// ============================================================
// Rei v0.3 Evaluator — Integrated with Space-Layer-Diffusion
// Original: v0.2.1 by Nobuki Fujimoto
// Extended: v0.3 Space-Layer-Diffusion (collaborative design)
// ============================================================

import { TokenType } from './lexer';
import {
  createSpace, addNodeToLayer, stepSpace, diffuseSpace,
  computeNodeValue, stepNode,
  getSigmaFlow, getSigmaMemory, getSigmaField, getSigmaWill,
  getSpaceSigma, findResonances,
  type ReiSpace, type DNode, type ConvergenceCriteria, type ContractionMethod,
} from './space';

// --- Tier 1: Sigma Metadata (公理C1 — 全値型の自己参照) ---

export interface SigmaMetadata {
  memory: any[];           // 来歴: パイプ通過前の値の配列
  tendency: string;        // 傾向性: 'rest' | 'expand' | 'contract' | 'spiral'
  pipeCount: number;       // パイプ通過回数
}

/** 全値型のσラッパー — 値にσメタデータを付与 */
export interface ReiVal {
  reiType: 'ReiVal';
  value: any;
  __sigma__: SigmaMetadata;
}

function createSigmaMeta(): SigmaMetadata {
  return { memory: [], tendency: 'rest', pipeCount: 0 };
}

/** ReiValでラップ（既にラップ済みなら内部値を更新） */
function wrapWithSigma(value: any, prevValue: any, prevMeta?: SigmaMetadata): any {
  // ReiValをネストしない
  const rawValue = unwrapReiVal(value);
  const rawPrev = unwrapReiVal(prevValue);

  const meta: SigmaMetadata = prevMeta
    ? { ...prevMeta, memory: [...prevMeta.memory, rawPrev], pipeCount: prevMeta.pipeCount + 1 }
    : { memory: [rawPrev], tendency: 'rest', pipeCount: 1 };

  // 傾向性の判定（C2: τ）
  meta.tendency = computeTendency(meta.memory, rawValue);

  // プリミティブ値はラップして返す
  if (rawValue === null || typeof rawValue !== 'object') {
    return { reiType: 'ReiVal' as const, value: rawValue, __sigma__: meta };
  }

  // オブジェクト値は __sigma__ プロパティを直接付与（型を壊さない）
  rawValue.__sigma__ = meta;
  return rawValue;
}

/** 傾向性を計算（C2: τ — 値の変換方向から判定） */
function computeTendency(memory: any[], currentValue: any): string {
  if (memory.length < 2) return 'rest';
  const recent = memory.slice(-5).map(toNumSafe);
  const current = toNumSafe(currentValue);
  
  let expandCount = 0, contractCount = 0, alternating = 0;
  
  for (let i = 0; i < recent.length; i++) {
    const prev = i === 0 ? recent[0] : recent[i - 1];
    const cur = i === recent.length - 1 ? current : recent[i + 1];
    if (cur > prev) expandCount++;
    else if (cur < prev) contractCount++;
    if (i > 0 && ((cur > prev) !== (recent[i] > recent[i - 1]))) alternating++;
  }

  if (alternating >= recent.length - 1) return 'spiral';
  if (expandCount > contractCount) return 'expand';
  if (contractCount > expandCount) return 'contract';
  return 'rest';
}

function toNumSafe(v: any): number {
  if (typeof v === 'number') return v;
  if (v === null || v === undefined) return 0;
  if (typeof v === 'boolean') return v ? 1 : 0;
  if (typeof v === 'object' && v.reiType === 'ReiVal') return toNumSafe(v.value);
  if (typeof v === 'object' && v.reiType === 'Ext') return v.valStar();
  if (typeof v === 'object' && v.reiType === 'MDim') {
    const { center, neighbors, mode } = v;
    const weights = v.weights ?? neighbors.map(() => 1);
    const n = neighbors.length;
    if (n === 0) return center;
    const wSum = weights.reduce((a: number, b: number) => a + b, 0);
    const wAvg = neighbors.reduce((sum: number, vi: number, i: number) => sum + (weights[i] ?? 1) * vi, 0) / (wSum || 1);
    return center + wAvg;
  }
  return 0;
}

/** ReiValを透過的にアンラップ */
function unwrapReiVal(v: any): any {
  if (v !== null && typeof v === 'object' && v.reiType === 'ReiVal') return v.value;
  return v;
}

/** 値からSigmaMetadataを取得 */
function getSigmaOf(v: any): SigmaMetadata {
  if (v !== null && typeof v === 'object') {
    if (v.reiType === 'ReiVal') return v.__sigma__;
    if (v.__sigma__) return v.__sigma__;
  }
  return createSigmaMeta();
}

/** 全値型からSigmaResult（C1公理のσ関数）を構築 */
function buildSigmaResult(rawVal: any, meta: SigmaMetadata): any {
  const val = unwrapReiVal(rawVal);

  // ── field: 値の型に応じた場情報 ──
  let field: any;
  let layer = 0;
  let flow: any = { direction: meta.tendency === 'rest' ? 'rest' : meta.tendency, momentum: meta.pipeCount, velocity: 0 };

  if (val !== null && typeof val === 'object') {
    if (val.reiType === 'MDim') {
      field = { center: val.center, neighbors: [...val.neighbors], mode: val.mode, dim: val.neighbors.length };
    } else if (val.reiType === 'Ext') {
      field = { base: val.base, order: val.order, subscripts: val.subscripts };
      layer = val.order;
    } else if (val.reiType === 'State') {
      field = { state: val.state, omega: val.omega };
      flow = { direction: 'forward', momentum: val.history.length - 1, velocity: 1 };
    } else if (val.reiType === 'Quad') {
      field = { value: val.value };
    } else if (val.reiType === 'DNode') {
      // DNode — 既存のspace.tsのσと統合
      field = { center: val.center, neighbors: [...val.neighbors], layer: val.layerIndex, index: val.nodeIndex };
      layer = val.layerIndex;
      flow = { stage: val.stage, directions: val.neighbors.length, momentum: val.momentum, velocity: 0 };
      if (val.diffusionHistory.length >= 2) {
        flow.velocity = Math.abs(
          val.diffusionHistory[val.diffusionHistory.length - 1].result -
          val.diffusionHistory[val.diffusionHistory.length - 2].result
        );
      }
    } else if (val.reiType === 'Space') {
      // Space — 既存のgetSpaceSigmaに委譲（evalPipe側で処理）
      field = { type: 'space' };
    } else if (Array.isArray(val)) {
      field = { length: val.length, first: val[0] ?? null, last: val[val.length - 1] ?? null };
    } else {
      field = { type: typeof val };
    }
  } else if (typeof val === 'number') {
    field = { center: val, neighbors: [] };
  } else if (typeof val === 'string') {
    field = { value: val, length: val.length };
  } else if (typeof val === 'boolean') {
    field = { value: val };
  } else {
    field = { value: null };
  }

  // ── memory: 来歴 ──
  const memory = [...meta.memory];

  // Genesis の来歴との統合
  if (val !== null && typeof val === 'object' && val.reiType === 'State' && val.history) {
    if (memory.length === 0 && val.history.length > 1) {
      for (let i = 0; i < val.history.length - 1; i++) {
        memory.push(val.history[i]);
      }
    }
  }

  // ── will: 傾向性（C2） ──
  const will = {
    tendency: meta.tendency as any,
    strength: meta.pipeCount > 0 ? Math.min(meta.pipeCount / 5, 1) : 0,
    history: meta.memory.map((_: any, i: number) => {
      if (i === 0) return 'rest';
      const prev = toNumSafe(meta.memory[i - 1]);
      const cur = toNumSafe(meta.memory[i]);
      return cur > prev ? 'expand' : cur < prev ? 'contract' : 'rest';
    }),
  };

  return {
    reiType: 'SigmaResult',
    field,
    flow,
    memory,
    layer,
    will,
    relation: [],
  };
}

// --- Environment (Scope) ---

export class Environment {
  parent: Environment | null;
  bindings = new Map<string, { value: any; mutable: boolean }>();

  constructor(parent: Environment | null = null) {
    this.parent = parent;
  }

  define(name: string, value: any, mutable = false) {
    this.bindings.set(name, { value, mutable });
  }

  get(name: string): any {
    const b = this.bindings.get(name);
    if (b) return b.value;
    if (this.parent) return this.parent.get(name);
    throw new Error(`未定義の変数: ${name}`);
  }

  set(name: string, value: any) {
    const b = this.bindings.get(name);
    if (b) {
      if (!b.mutable) throw new Error(`不変の変数に代入: ${name}`);
      b.value = value;
      return;
    }
    if (this.parent) { this.parent.set(name, value); return; }
    throw new Error(`未定義の変数: ${name}`);
  }

  has(name: string): boolean {
    if (this.bindings.has(name)) return true;
    if (this.parent) return this.parent.has(name);
    return false;
  }

  getBinding(name: string) {
    const b = this.bindings.get(name);
    if (b) return b;
    if (this.parent) return this.parent.getBinding(name);
    return null;
  }

  allBindings(): Map<string, { value: any; mutable: boolean }> {
    const all = new Map<string, { value: any; mutable: boolean }>();
    if (this.parent) {
      for (const [k, v] of this.parent.allBindings()) all.set(k, v);
    }
    for (const [k, v] of this.bindings) all.set(k, v);
    return all;
  }
}

// --- Extended numbers ---

function createExtended(base: number, subscripts: string) {
  const order = subscripts.length;
  return {
    reiType: "Ext" as const,
    base,
    order,
    subscripts,
    valStar() {
      if (base === 0) return Math.pow(0.1, order);
      return base * Math.pow(0.1, order);
    },
  };
}

function parseExtLit(raw: string) {
  if (raw === "0\u2080") return createExtended(0, "o");
  const baseChar = raw[0];
  const subs = raw.slice(1);
  const baseMap: Record<string, number> = {
    "0": 0, "\u03C0": Math.PI, "e": Math.E,
    "\u03C6": (1 + Math.sqrt(5)) / 2, "i": NaN,
  };
  return createExtended(baseMap[baseChar] ?? 0, subs);
}

// --- MDim computation (v0.2.1 original) ---

// ═══════════════════════════════════════════
// Tier 2: 利用可能な全計算モード一覧（M1: 計算多元性公理）
// ═══════════════════════════════════════════
const ALL_COMPUTE_MODES = [
  "weighted", "multiplicative", "harmonic", "exponential",
  "geometric", "median", "minkowski", "entropy",
] as const;

function computeMDim(md: any): number {
  const { center, neighbors, mode } = md;
  const weights = md.weights ?? neighbors.map(() => 1);
  const n = neighbors.length;
  if (n === 0) return center;

  // Tier 2 M3: blend モード — blend(weighted:0.7,geometric:0.3)
  if (typeof mode === 'string' && mode.startsWith('blend(')) {
    return computeBlend(md, mode);
  }

  switch (mode) {
    case "weighted": {
      const wSum = weights.reduce((a: number, b: number) => a + b, 0);
      const wAvg = neighbors.reduce((sum: number, v: number, i: number) => sum + (weights[i] ?? 1) * v, 0) / (wSum || 1);
      return center + wAvg;
    }
    case "multiplicative": {
      const prod = neighbors.reduce((p: number, v: number) => p * (1 + v), 1);
      return center * prod;
    }
    case "harmonic": {
      const harmSum = neighbors.reduce((s: number, v: number) => s + 1 / (Math.abs(v) || 1), 0);
      return center + n / harmSum;
    }
    case "exponential": {
      const expSum = neighbors.reduce((s: number, v: number) => s + Math.exp(v), 0);
      return center * (expSum / n);
    }
    // ── Tier 2 M1: 新計算モード ──
    case "geometric": {
      // 幾何平均: center × (Π|neighbors|)^(1/n)
      const prod = neighbors.reduce((p: number, v: number) => p * Math.abs(v || 1), 1);
      return center * Math.pow(prod, 1 / n);
    }
    case "median": {
      // 中央値: center + median(neighbors)
      const sorted = [...neighbors].sort((a: number, b: number) => a - b);
      const mid = Math.floor(n / 2);
      const med = n % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
      return center + med;
    }
    case "minkowski": {
      // ミンコフスキー距離（p=2, ユークリッド距離）: center + sqrt(Σ(neighbors²)/n)
      const p = md.minkowskiP ?? 2;
      const sumP = neighbors.reduce((s: number, v: number) => s + Math.pow(Math.abs(v), p), 0);
      return center + Math.pow(sumP / n, 1 / p);
    }
    case "entropy": {
      // 情報エントロピー: center × (1 + H(neighbors))
      const total = neighbors.reduce((s: number, v: number) => s + Math.abs(v), 0) || 1;
      const probs = neighbors.map((v: number) => Math.abs(v) / total);
      const H = -probs.reduce((s: number, p: number) => s + (p > 0 ? p * Math.log2(p) : 0), 0);
      return center * (1 + H);
    }
    default: return center;
  }
}

/** Tier 2 M3: モード合成 — blend(weighted:0.7,geometric:0.3) */
function computeBlend(md: any, blendSpec: string): number {
  // Parse: "blend(weighted:0.7,geometric:0.3)"
  const inner = blendSpec.slice(6, -1); // remove "blend(" and ")"
  const parts = inner.split(',').map(s => s.trim());
  let totalWeight = 0;
  let blendedResult = 0;

  for (const part of parts) {
    const [modeName, weightStr] = part.split(':').map(s => s.trim());
    const w = parseFloat(weightStr) || 0;
    const result = computeMDim({ ...md, mode: modeName });
    blendedResult += w * result;
    totalWeight += w;
  }

  return totalWeight > 0 ? blendedResult / totalWeight : md.center;
}

/** Tier 2 N1: 配列・文字列・数値を𝕄に射影する */
function projectToMDim(input: any, centerSpec: string | number | null, args: any[]): any {
  let elements: any[];

  // 入力を要素配列に変換
  if (Array.isArray(input)) {
    elements = [...input];
  } else if (typeof input === 'string') {
    // 文字列 → 文字コード配列
    elements = Array.from(input).map(c => c.charCodeAt(0));
  } else if (typeof input === 'number') {
    // 数値 → 桁の配列
    const digits = Math.abs(input).toString().split('').map(Number);
    elements = digits;
  } else if (input !== null && typeof input === 'object' && input.reiType === 'MDim') {
    // MDimの再射影（N2: reproject）
    elements = [input.center, ...input.neighbors];
  } else {
    return { reiType: "MDim", center: input ?? 0, neighbors: [], mode: "weighted" };
  }

  if (elements.length === 0) {
    return { reiType: "MDim", center: 0, neighbors: [], mode: "weighted" };
  }

  // 中心の選択
  let centerIndex = 0;
  if (centerSpec === ':max' || centerSpec === 'max') {
    centerIndex = elements.indexOf(Math.max(...elements.map(Number)));
  } else if (centerSpec === ':min' || centerSpec === 'min') {
    centerIndex = elements.indexOf(Math.min(...elements.map(Number)));
  } else if (centerSpec === ':first' || centerSpec === 'first') {
    centerIndex = 0;
  } else if (centerSpec === ':last' || centerSpec === 'last') {
    centerIndex = elements.length - 1;
  } else if (centerSpec === ':middle' || centerSpec === 'middle') {
    centerIndex = Math.floor(elements.length / 2);
  } else if (typeof centerSpec === 'number') {
    // 具体的な値で指定 → その値を持つ要素を中心にする
    const idx = elements.indexOf(centerSpec);
    centerIndex = idx >= 0 ? idx : 0;
  }

  const center = elements[centerIndex];
  const neighbors = elements.filter((_: any, i: number) => i !== centerIndex);

  return { reiType: "MDim", center, neighbors, mode: "weighted" };
}

// --- Quad logic (v0.2.1) ---

function quadNot(v: string): string {
  switch (v) {
    case "top": return "bottom";
    case "bottom": return "top";
    case "topPi": return "bottomPi";
    case "bottomPi": return "topPi";
    default: return v;
  }
}

function quadAnd(a: string, b: string): string {
  if (a === "bottom" || b === "bottom") return "bottom";
  if (a === "top" && b === "top") return "top";
  return "bottomPi";
}

function quadOr(a: string, b: string): string {
  if (a === "top" || b === "top") return "top";
  if (a === "bottom" && b === "bottom") return "bottom";
  return "topPi";
}

// --- Genesis ---

const PHASE_ORDER = ["void", "dot", "line", "surface", "solid", "omega"];

function createGenesis() {
  return { reiType: "State" as const, state: "void", omega: 0, history: ["void"] };
}

function genesisForward(g: any) {
  const idx = PHASE_ORDER.indexOf(g.state);
  if (idx < PHASE_ORDER.length - 1) {
    g.state = PHASE_ORDER[idx + 1];
    g.history.push(g.state);
    if (g.state === "omega") g.omega = 1;
  }
}

// ============================================================
// EVALUATOR
// ============================================================

export class Evaluator {
  env: Environment;

  constructor(parent?: Environment) {
    this.env = new Environment(parent ?? null);
    this.registerBuiltins();
  }

  private registerBuiltins() {
    this.env.define("e", Math.E);
    this.env.define("PI", Math.PI);
    this.env.define("genesis", {
      reiType: "Function", name: "genesis", params: [], body: null, closure: this.env,
    });
    const mathFns = ["abs", "sqrt", "sin", "cos", "log", "exp", "floor", "ceil", "round", "min", "max", "len", "print"];
    for (const name of mathFns) {
      this.env.define(name, {
        reiType: "Function", name, params: ["x"], body: null, closure: this.env,
      });
    }
  }

  eval(ast: any): any {
    switch (ast.type) {
      case "Program": return this.evalProgram(ast);
      case "NumLit": return ast.value;
      case "StrLit": return ast.value;
      case "BoolLit": return ast.value;
      case "NullLit": return null;
      case "ExtLit": return parseExtLit(ast.raw);
      case "ConstLit": return this.evalConstLit(ast);
      case "QuadLit": return { reiType: "Quad", value: ast.value };
      case "MDimLit": return this.evalMDimLit(ast);
      case "ArrayLit": return ast.elements.map((e: any) => this.eval(e));
      case "Ident": return this.env.get(ast.name);
      case "LetStmt": return this.evalLetStmt(ast);
      case "MutStmt": return this.evalMutStmt(ast);
      case "CompressDef": return this.evalCompressDef(ast);
      case "BinOp": return this.evalBinOp(ast);
      case "UnaryOp": return this.evalUnaryOp(ast);
      case "Pipe": return this.evalPipe(ast);
      case "FnCall": return this.evalFnCall(ast);
      case "MemberAccess": return this.evalMemberAccess(ast);
      case "IndexAccess": return this.evalIndexAccess(ast);
      case "Extend": return this.evalExtend(ast);
      case "Reduce": return this.evalReduce(ast);
      case "ConvergeOp": return this.evalConverge(ast);
      case "DivergeOp": return this.evalDiverge(ast);
      case "ReflectOp": return this.evalReflect(ast);
      case "IfExpr": return this.evalIfExpr(ast);
      case "MatchExpr": return this.evalMatchExpr(ast);
      // ── v0.3 ──
      case "SpaceLit": return this.evalSpaceLit(ast);
      default:
        throw new Error(`未実装のノード型: ${ast.type}`);
    }
  }

  private evalProgram(ast: any): any {
    let result = null;
    for (const stmt of ast.body) { result = this.eval(stmt); }
    return result;
  }

  private evalConstLit(ast: any): any {
    switch (ast.value) {
      case "\u30FB": return createGenesis();
      case "\u2205": return null;
      case "i": return { reiType: "Ext", base: NaN, order: 0, subscripts: "", valStar: () => NaN };
      case "\u03A6": return "\u03A6";
      case "\u03A8": return "\u03A8";
      case "\u03A9": return "\u03A9";
      default: return null;
    }
  }

  private evalMDimLit(ast: any): any {
    const center = this.toNumber(this.eval(ast.center));
    const neighbors = ast.neighbors.map((n: any) => this.toNumber(this.eval(n)));
    const weights = ast.weight ? [this.toNumber(this.eval(ast.weight))] : undefined;
    const mode = ast.mode || "weighted";
    return { reiType: "MDim", center, neighbors, mode, weights };
  }

  // ── v0.3: Space literal evaluation ──
  private evalSpaceLit(ast: any): ReiSpace {
    const space = createSpace((ast.topology || "flat") as any);

    for (const layerDef of ast.layers) {
      const layerIndex = typeof layerDef.index === 'object'
        ? this.toNumber(this.eval(layerDef.index))
        : layerDef.index;

      for (const nodeExpr of layerDef.nodes) {
        const val = this.eval(nodeExpr);
        if (this.isMDim(val)) {
          addNodeToLayer(space, layerIndex, val.center, val.neighbors, val.mode, val.weights);
        } else if (typeof val === 'number') {
          addNodeToLayer(space, layerIndex, val, []);
        }
      }
    }
    return space;
  }

  private evalLetStmt(ast: any): any {
    const val = this.eval(ast.init);
    this.env.define(ast.name, val, false);
    return val;
  }

  private evalMutStmt(ast: any): any {
    const val = this.eval(ast.init);
    this.env.define(ast.name, val, true);
    return val;
  }

  private evalCompressDef(ast: any): any {
    const fn = {
      reiType: "Function", name: ast.name, params: ast.params,
      body: ast.body, closure: this.env,
    };
    this.env.define(ast.name, fn);
    return fn;
  }

  private evalBinOp(ast: any): any {
    const left = this.eval(ast.left);
    const right = this.eval(ast.right);
    // Quad logic
    if (this.isQuad(left) && this.isQuad(right)) {
      switch (ast.op) {
        case "\u2227": return { reiType: "Quad", value: quadAnd(left.value, right.value) };
        case "\u2228": return { reiType: "Quad", value: quadOr(left.value, right.value) };
      }
    }
    const l = this.toNumber(left);
    const r = this.toNumber(right);
    switch (ast.op) {
      case "+": return l + r;
      case "-": return l - r;
      case "*": return l * r;
      case "/": return r !== 0 ? l / r : NaN;
      case "\u2295": return l + r;     // ⊕
      case "\u2297": return l * r;     // ⊗
      case "\xB7": return l * r;       // ·
      case "==": return l === r;
      case "!=": return l !== r;
      case ">": return l > r;
      case "<": return l < r;
      case ">=": return l >= r;
      case "<=": return l <= r;
      case ">\u03BA": return l > r;    // >κ
      case "<\u03BA": return l < r;    // <κ
      case "=\u03BA": return l === r;  // =κ
      case "\u2227": return l !== 0 && r !== 0;  // ∧
      case "\u2228": return l !== 0 || r !== 0;  // ∨
      default: throw new Error(`未知の演算子: ${ast.op}`);
    }
  }

  private evalUnaryOp(ast: any): any {
    const operand = this.eval(ast.operand);
    switch (ast.op) {
      case "-": return -this.toNumber(operand);
      case "\xAC":
        if (this.isQuad(operand)) return { reiType: "Quad", value: quadNot(operand.value) };
        return !operand;
      default: throw new Error(`未知の単項演算子: ${ast.op}`);
    }
  }

  private evalPipe(ast: any): any {
    const rawInput = this.eval(ast.input);
    const cmd = ast.command;
    if (cmd.type === "PipeCmd") {
      // ── Tier 1: σメモリ追跡 ──
      // sigmaコマンド自体はラップしない（参照操作なので）
      if (cmd.cmd === "sigma") {
        return this.execPipeCmd(rawInput, cmd);
      }
      const result = this.execPipeCmd(rawInput, cmd);
      // パイプ通過時にσメタデータを付与
      const prevMeta = getSigmaOf(rawInput);
      return wrapWithSigma(result, rawInput, prevMeta.pipeCount > 0 ? prevMeta : undefined);
    }
    throw new Error("無効なパイプコマンド");
  }

  private execPipeCmd(input: any, cmd: any): any {
    const { cmd: cmdName, mode, args: argNodes } = cmd;
    const args = argNodes.map((a: any) => this.eval(a));

    // ── Tier 1: σメタデータを保存してからアンラップ ──
    const sigmaMetadata = getSigmaOf(input);
    const rawInput = unwrapReiVal(input);

    // ═══════════════════════════════════════════
    // Tier 1: σ（全値型の自己参照 — 公理C1）
    // ═══════════════════════════════════════════
    if (cmdName === "sigma") {
      // Space — 既存のgetSpaceSigmaに委譲
      if (this.isSpace(rawInput)) return getSpaceSigma(rawInput as ReiSpace);
      // DNode — 既存のσ関数と統合
      if (this.isDNode(rawInput)) {
        const dn = rawInput as DNode;
        return {
          reiType: "SigmaResult",
          flow: getSigmaFlow(dn),
          memory: [...getSigmaMemory(dn), ...sigmaMetadata.memory],
          layer: dn.layerIndex,
          will: getSigmaWill(dn),
          field: { center: dn.center, neighbors: [...dn.neighbors], layer: dn.layerIndex, index: dn.nodeIndex },
          relation: [],
        };
      }
      // 全値型 — C1公理のσ関数
      return buildSigmaResult(rawInput, sigmaMetadata);
    }

    // ═══════════════════════════════════════════
    // v0.3: Space pipe commands (rawInputを使用)
    // ═══════════════════════════════════════════
    if (this.isSpace(rawInput)) {
      const sp = rawInput as ReiSpace;
      switch (cmdName) {
        case "step": {
          const targetLayer = args.length > 0 ? this.toNumber(args[0]) : undefined;
          stepSpace(sp, targetLayer);
          return sp;
        }
        case "diffuse": {
          let criteria: ConvergenceCriteria = { type: 'converged' };
          let targetLayer: number | undefined;
          let contractionMethod: ContractionMethod = 'weighted';

          if (args.length >= 1) {
            const arg0 = args[0];
            if (typeof arg0 === 'number') {
              criteria = { type: 'steps', max: arg0 };
            } else if (typeof arg0 === 'string') {
              switch (arg0) {
                case 'converged': criteria = { type: 'converged' }; break;
                case 'fixed': criteria = { type: 'fixed' }; break;
                default:
                  const eps = parseFloat(arg0);
                  if (!isNaN(eps)) criteria = { type: 'epsilon', threshold: eps };
              }
            }
          }
          if (args.length >= 2 && typeof args[1] === 'number') targetLayer = args[1];
          if (args.length >= 3 && typeof args[2] === 'string') contractionMethod = args[2] as ContractionMethod;

          return diffuseSpace(sp, criteria, targetLayer, contractionMethod);
        }
        case "node": {
          const layerIdx = args.length >= 1 ? this.toNumber(args[0]) : 0;
          const nodeIdx = args.length >= 2 ? this.toNumber(args[1]) : 0;
          const layer = sp.layers.get(layerIdx);
          if (layer && layer.nodes[nodeIdx]) return layer.nodes[nodeIdx];
          throw new Error(`ノードが見つかりません: 層${layerIdx}, index ${nodeIdx}`);
        }
        case "sigma": return getSpaceSigma(sp);
        case "resonances": {
          const threshold = args.length >= 1 ? this.toNumber(args[0]) : 0.5;
          return findResonances(sp, threshold);
        }
        case "freeze": {
          const layerIdx = this.toNumber(args[0] ?? 0);
          const layer = sp.layers.get(layerIdx);
          if (layer) layer.frozen = true;
          return sp;
        }
        case "thaw": {
          const layerIdx = this.toNumber(args[0] ?? 0);
          const layer = sp.layers.get(layerIdx);
          if (layer) layer.frozen = false;
          return sp;
        }
        case "spawn": {
          const val = args[0];
          const layerIdx = args.length >= 2 ? this.toNumber(args[1]) : 0;
          if (this.isMDim(val)) {
            addNodeToLayer(sp, layerIdx, val.center, val.neighbors, val.mode, val.weights);
          }
          return sp;
        }
        case "result": {
          const layerIdx = args.length >= 1 ? this.toNumber(args[0]) : undefined;
          const results: number[] = [];
          for (const [lIdx, layer] of sp.layers) {
            if (layerIdx !== undefined && lIdx !== layerIdx) continue;
            for (const n of layer.nodes) results.push(computeNodeValue(n));
          }
          return results.length === 1 ? results[0] : results;
        }
      }
    }

    // ═══════════════════════════════════════════
    // v0.3: DNode pipe commands
    // ═══════════════════════════════════════════
    if (this.isDNode(rawInput)) {
      const dn = rawInput as DNode;
      switch (cmdName) {
        case "sigma": {
          // Tier 1: 上のσハンドラに統合済み — ここには到達しない
          return buildSigmaResult(dn, sigmaMetadata);
        }
        case "compute": return computeNodeValue(dn);
        case "center": return dn.center;
        case "neighbors": return dn.neighbors;
        case "dim": return dn.neighbors.length;
        case "stage": return dn.stage;
        case "step": { stepNode(dn); return dn; }
        case "extract": {
          return { reiType: "MDim", center: dn.center, neighbors: dn.neighbors, mode: dn.mode, weights: dn.weights };
        }
      }
    }

    // ═══════════════════════════════════════════
    // v0.3: SigmaResult pipe commands
    // ═══════════════════════════════════════════
    if (this.isObj(rawInput) && rawInput.reiType === "SigmaResult") {
      switch (cmdName) {
        case "flow": return rawInput.flow;
        case "memory": return rawInput.memory;
        case "layer": case "層": return rawInput.layer;
        case "will": return rawInput.will;
        case "field": return rawInput.field;
        case "relation": return rawInput.relation ?? [];
      }
    }

    // ═══════════════════════════════════════════
    // Tier 2: project（N1 射影公理）/ reproject（N2 複数射影）
    // ═══════════════════════════════════════════
    if (cmdName === "project") {
      const centerSpec = args.length > 0 ? args[0] : ':first';
      return projectToMDim(rawInput, centerSpec, args);
    }
    if (cmdName === "reproject") {
      if (this.isMDim(rawInput) && args.length > 0) {
        const newCenter = args[0];
        const allElements = [rawInput.center, ...rawInput.neighbors];
        const idx = typeof newCenter === 'number'
          ? allElements.indexOf(newCenter)
          : 0;
        if (idx < 0) throw new Error(`reproject: 中心値 ${newCenter} が見つかりません`);
        const center = allElements[idx];
        const neighbors = allElements.filter((_: any, i: number) => i !== idx);
        return { reiType: "MDim", center, neighbors, mode: rawInput.mode };
      }
      // 非MDimの場合はprojectにフォールバック
      return projectToMDim(rawInput, args[0] ?? ':first', args);
    }
    if (cmdName === "modes") {
      return [...ALL_COMPUTE_MODES];
    }
    if (cmdName === "blend") {
      // blend("weighted", 0.7, "geometric", 0.3) — モード合成（M3: モード合成公理）
      if (!this.isMDim(rawInput)) throw new Error("blend: 𝕄型の値が必要です");
      let blendedResult = 0;
      let totalWeight = 0;
      for (let i = 0; i < args.length - 1; i += 2) {
        const modeName = String(args[i]);
        const w = typeof args[i + 1] === 'number' ? args[i + 1] : 0;
        const result = computeMDim({ ...rawInput, mode: modeName });
        blendedResult += w * result;
        totalWeight += w;
      }
      return totalWeight > 0 ? blendedResult / totalWeight : computeMDim(rawInput);
    }

    // ═══════════════════════════════════════════
    // v0.2.1 Original pipe commands (rawInputを使用)
    // ═══════════════════════════════════════════
    if (this.isMDim(rawInput)) {
      const md = rawInput;
      switch (cmdName) {
        case "compute": {
          const m = mode || md.mode;
          return computeMDim({ ...md, mode: m });
        }
        case "center": return md.center;
        case "neighbors": return md.neighbors;
        case "dim": return md.neighbors.length;
        case "normalize": {
          const sum = md.neighbors.reduce((a: number, b: number) => a + Math.abs(b), 0) || 1;
          return { reiType: "MDim", center: md.center, neighbors: md.neighbors.map((n: number) => n / sum), mode: md.mode };
        }
        case "flatten": return computeMDim(md);
        case "map": {
          if (args.length > 0 && this.isFunction(args[0])) {
            const fn = args[0];
            const newNeighbors = md.neighbors.map((n: number) => this.toNumber(this.callFunction(fn, [n])));
            return { ...md, neighbors: newNeighbors };
          }
          return md;
        }
      }
    }

    if (this.isExt(rawInput)) {
      const ext = rawInput;
      switch (cmdName) {
        case "order": return ext.order;
        case "base": return ext.base;
        case "valStar": case "val": return ext.valStar();
        case "subscripts": return ext.subscripts;
      }
    }

    if (this.isGenesis(rawInput)) {
      const g = rawInput;
      switch (cmdName) {
        case "forward": genesisForward(g); return g;
        case "phase": return g.state;
        case "history": return g.history;
        case "omega": return g.omega;
      }
    }

    if (Array.isArray(rawInput)) {
      switch (cmdName) {
        case "len": return rawInput.length;
        case "sum": return rawInput.reduce((a: number, b: any) => a + this.toNumber(b), 0);
        case "avg": return rawInput.length === 0 ? 0 : rawInput.reduce((a: number, b: any) => a + this.toNumber(b), 0) / rawInput.length;
        case "first": return rawInput[0] ?? null;
        case "last": return rawInput[rawInput.length - 1] ?? null;
        case "reverse": return [...rawInput].reverse();
        case "sort": return [...rawInput].sort((a: any, b: any) => this.toNumber(a) - this.toNumber(b));
        case "map": {
          if (args.length > 0 && this.isFunction(args[0])) {
            return rawInput.map((v: any) => this.callFunction(args[0], [v]));
          }
          return rawInput;
        }
        case "filter": {
          if (args.length > 0 && this.isFunction(args[0])) {
            return rawInput.filter((v: any) => !!this.callFunction(args[0], [v]));
          }
          return rawInput;
        }
        case "reduce": {
          if (args.length >= 2 && this.isFunction(args[0])) {
            return rawInput.reduce((acc: any, v: any) => this.callFunction(args[0], [acc, v]), args[1]);
          }
          return rawInput;
        }
      }
    }

    if (typeof rawInput === "number") {
      switch (cmdName) {
        case "abs": return Math.abs(rawInput);
        case "sqrt": return Math.sqrt(rawInput);
        case "round": return Math.round(rawInput);
        case "floor": return Math.floor(rawInput);
        case "ceil": return Math.ceil(rawInput);
        case "negate": return -rawInput;
      }
    }

    if (typeof rawInput === "string") {
      switch (cmdName) {
        case "len": return rawInput.length;
        case "upper": return rawInput.toUpperCase();
        case "lower": return rawInput.toLowerCase();
        case "trim": return rawInput.trim();
        case "split": return rawInput.split(args[0] ?? "");
        case "reverse": return Array.from(rawInput).reverse().join("");
      }
    }

    if (cmdName === "\u290A" || cmdName === "converge") {
      if (this.isMDim(rawInput)) return computeMDim(rawInput);
      return rawInput;
    }
    if (cmdName === "\u290B" || cmdName === "diverge") {
      if (typeof rawInput === "number") {
        return { reiType: "MDim", center: rawInput, neighbors: [rawInput, rawInput, rawInput, rawInput], mode: "weighted" };
      }
      return rawInput;
    }

    // User-defined pipe function
    if (this.env.has(cmdName)) {
      const fn = this.env.get(cmdName);
      if (this.isFunction(fn)) return this.callFunction(fn, [rawInput, ...args]);
    }

    throw new Error(`未知のパイプコマンド: ${cmdName}`);
  }

  private evalFnCall(ast: any): any {
    const callee = this.eval(ast.callee);
    const args = ast.args.map((a: any) => this.eval(a));
    if (ast.callee.type === "Ident" && ast.callee.name === "genesis") return createGenesis();
    if (this.isFunction(callee)) return this.callFunction(callee, args);
    throw new Error(`呼び出し不可能: ${JSON.stringify(callee)}`);
  }

  private callFunction(fn: any, args: any[]): any {
    if (fn.body === null || fn.body === undefined) return this.callBuiltin(fn.name, args);
    const callEnv = new Environment(fn.closure);
    for (let i = 0; i < fn.params.length; i++) {
      callEnv.define(fn.params[i], args[i] ?? null);
    }
    const savedEnv = this.env;
    this.env = callEnv;
    const result = this.eval(fn.body);
    this.env = savedEnv;
    return result;
  }

  private callBuiltin(name: string, args: any[]): any {
    if (name === "genesis") return createGenesis();
    const a = args[0] !== undefined ? this.toNumber(args[0]) : 0;
    const b = args[1] !== undefined ? this.toNumber(args[1]) : 0;
    switch (name) {
      case "abs": return Math.abs(a);
      case "sqrt": return Math.sqrt(a);
      case "sin": return Math.sin(a);
      case "cos": return Math.cos(a);
      case "log": return Math.log(a);
      case "exp": return Math.exp(a);
      case "floor": return Math.floor(a);
      case "ceil": return Math.ceil(a);
      case "round": return Math.round(a);
      case "min": return Math.min(a, b);
      case "max": return Math.max(a, b);
      case "len":
        if (Array.isArray(args[0])) return args[0].length;
        if (typeof args[0] === "string") return args[0].length;
        return 0;
      case "print": return args[0] ?? null;
      default: throw new Error(`未知の組込み関数: ${name}`);
    }
  }

  private evalMemberAccess(ast: any): any {
    const rawObj = this.eval(ast.object);
    const obj = unwrapReiVal(rawObj);

    // ── Tier 1: σメタデータへのメンバーアクセス ──
    if (ast.member === "__sigma__") {
      return getSigmaOf(rawObj);
    }

    // ── v0.3: SigmaResult member access ──
    if (this.isObj(obj) && obj.reiType === "SigmaResult") {
      switch (ast.member) {
        case "flow": return obj.flow;
        case "memory": return obj.memory;
        case "layer": return obj.layer;
        case "will": return obj.will;
        case "field": return obj.field;
        case "relation": return obj.relation ?? [];
      }
    }

    // ── v0.3: Sigma sub-object member access ──
    if (this.isObj(obj) && obj.stage !== undefined && obj.momentum !== undefined && obj.directions !== undefined) {
      switch (ast.member) {
        case "stage": return obj.stage;
        case "directions": return obj.directions;
        case "momentum": return obj.momentum;
        case "velocity": return obj.velocity;
      }
    }
    if (this.isObj(obj) && obj.tendency !== undefined && obj.strength !== undefined) {
      switch (ast.member) {
        case "tendency": return obj.tendency;
        case "strength": return obj.strength;
        case "history": return obj.history;
      }
    }
    // Space sigma field sub-object
    if (this.isObj(obj) && obj.layers !== undefined && obj.total_nodes !== undefined) {
      switch (ast.member) {
        case "layers": return obj.layers;
        case "total_nodes": return obj.total_nodes;
        case "active_nodes": return obj.active_nodes;
        case "topology": return obj.topology;
      }
    }
    // Space sigma flow sub-object
    if (this.isObj(obj) && obj.global_stage !== undefined && obj.converged_nodes !== undefined) {
      switch (ast.member) {
        case "global_stage": return obj.global_stage;
        case "converged_nodes": return obj.converged_nodes;
        case "expanding_nodes": return obj.expanding_nodes;
      }
    }

    // ── v0.3: DNode member access ──
    if (this.isDNode(obj)) {
      const dn = obj as DNode;
      switch (ast.member) {
        case "center": return dn.center;
        case "neighbors": return dn.neighbors;
        case "stage": return dn.stage;
        case "momentum": return dn.momentum;
        case "mode": return dn.mode;
        case "dim": return dn.neighbors.length;
      }
    }

    // ── v0.2.1 original member access ──
    if (this.isMDim(obj)) {
      switch (ast.member) {
        case "center": return obj.center;
        case "neighbors": return obj.neighbors;
        case "mode": return obj.mode;
        case "dim": return obj.neighbors.length;
      }
    }
    if (this.isExt(obj)) {
      switch (ast.member) {
        case "order": return obj.order;
        case "base": return obj.base;
        case "subscripts": return obj.subscripts;
        case "valStar": return obj.valStar();
      }
    }
    if (this.isGenesis(obj)) {
      switch (ast.member) {
        case "state": case "phase": return obj.state;
        case "omega": return obj.omega;
        case "history": return obj.history;
      }
    }
    if (Array.isArray(obj)) {
      switch (ast.member) {
        case "length": return obj.length;
        case "first": return obj[0] ?? null;
        case "last": return obj[obj.length - 1] ?? null;
      }
    }
    throw new Error(`メンバー ${ast.member} にアクセスできません`);
  }

  private evalIndexAccess(ast: any): any {
    const obj = this.eval(ast.object);
    const idx = this.toNumber(this.eval(ast.index));
    if (Array.isArray(obj)) return obj[idx] ?? null;
    if (typeof obj === "string") return obj[idx] ?? null;
    if (this.isMDim(obj)) return obj.neighbors[idx] ?? null;
    throw new Error("インデックスアクセス不可");
  }

  private evalExtend(ast: any): any {
    const target = this.eval(ast.target);
    if (this.isExt(target)) {
      if (ast.subscript) return createExtended(target.base, target.subscripts + ast.subscript);
      return createExtended(target.base, target.subscripts + "o");
    }
    throw new Error("拡張は拡張数にのみ適用可能");
  }

  private evalReduce(ast: any): any {
    const target = this.eval(ast.target);
    if (this.isExt(target)) {
      if (target.order <= 1) return target.base;
      return createExtended(target.base, target.subscripts.slice(0, -1));
    }
    throw new Error("縮約は拡張数にのみ適用可能");
  }

  private evalConverge(ast: any): any {
    const left = this.eval(ast.left);
    const right = this.eval(ast.right);
    if (this.isMDim(left) && this.isMDim(right)) {
      return {
        reiType: "MDim",
        center: (left.center + right.center) / 2,
        neighbors: [...left.neighbors, ...right.neighbors],
        mode: left.mode,
      };
    }
    return this.toNumber(left) + this.toNumber(right);
  }

  private evalDiverge(ast: any): any {
    const left = this.eval(ast.left);
    const right = this.eval(ast.right);
    if (this.isMDim(left)) {
      this.toNumber(right);
      const half = Math.floor(left.neighbors.length / 2);
      return [
        { reiType: "MDim", center: left.center, neighbors: left.neighbors.slice(0, half), mode: left.mode },
        { reiType: "MDim", center: left.center, neighbors: left.neighbors.slice(half), mode: left.mode },
      ];
    }
    return this.toNumber(left) - this.toNumber(right);
  }

  private evalReflect(ast: any): any {
    const left = this.eval(ast.left);
    this.eval(ast.right);
    if (this.isMDim(left)) {
      return { reiType: "MDim", center: left.center, neighbors: [...left.neighbors].reverse(), mode: left.mode };
    }
    return this.toNumber(left);
  }

  private evalIfExpr(ast: any): any {
    const cond = this.eval(ast.cond);
    return this.isTruthy(cond) ? this.eval(ast.then) : this.eval(ast.else);
  }

  private evalMatchExpr(ast: any): any {
    const target = this.eval(ast.target);
    for (const { pattern, body } of ast.cases) {
      const patVal = this.eval(pattern);
      if (this.matches(target, patVal)) return this.eval(body);
    }
    throw new Error("マッチする分岐が見つかりません");
  }

  // --- Helpers ---
  toNumber(val: any): number {
    // Tier 1: ReiVal透過
    if (val !== null && typeof val === 'object' && val.reiType === 'ReiVal') return this.toNumber(val.value);
    if (typeof val === "number") return val;
    if (typeof val === "boolean") return val ? 1 : 0;
    if (val === null) return 0;
    if (this.isExt(val)) return val.valStar();
    if (this.isMDim(val)) return computeMDim(val);
    if (typeof val === "string") return parseFloat(val) || 0;
    return 0;
  }

  private isTruthy(val: any): boolean {
    const v = unwrapReiVal(val);
    if (v === null || v === false || v === 0) return false;
    if (this.isQuad(v)) return v.value === "top" || v.value === "topPi";
    return true;
  }

  private matches(target: any, pattern: any): boolean {
    if (typeof target === typeof pattern && target === pattern) return true;
    if (this.isQuad(target) && this.isQuad(pattern)) return target.value === pattern.value;
    return false;
  }

  isObj(v: any): boolean { const u = unwrapReiVal(v); return u !== null && typeof u === "object" && !Array.isArray(u); }
  isMDim(v: any): boolean { const u = unwrapReiVal(v); return u !== null && typeof u === "object" && u.reiType === "MDim"; }
  isExt(v: any): boolean { const u = unwrapReiVal(v); return u !== null && typeof u === "object" && u.reiType === "Ext"; }
  isGenesis(v: any): boolean { const u = unwrapReiVal(v); return u !== null && typeof u === "object" && u.reiType === "State"; }
  isFunction(v: any): boolean { const u = unwrapReiVal(v); return u !== null && typeof u === "object" && u.reiType === "Function"; }
  isQuad(v: any): boolean { const u = unwrapReiVal(v); return u !== null && typeof u === "object" && u.reiType === "Quad"; }
  // ── v0.3 ──
  isSpace(v: any): boolean { const u = unwrapReiVal(v); return u !== null && typeof u === "object" && u.reiType === "Space"; }
  isDNode(v: any): boolean { const u = unwrapReiVal(v); return u !== null && typeof u === "object" && u.reiType === "DNode"; }
  // ── Tier 1 ──
  isReiVal(v: any): boolean { return v !== null && typeof v === 'object' && v.reiType === 'ReiVal'; }
  /** 値からσメタデータを取得（Tier 1） */
  getSigmaMetadata(v: any): SigmaMetadata { return getSigmaOf(v); }
  /** ReiValを透過的にアンラップ */
  unwrap(v: any): any { return unwrapReiVal(v); }
}
