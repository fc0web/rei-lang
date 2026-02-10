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

function computeMDim(md: any): number {
  const { center, neighbors, mode } = md;
  const weights = md.weights ?? neighbors.map(() => 1);
  const n = neighbors.length;
  if (n === 0) return center;
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
    default: return center;
  }
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
    const input = this.eval(ast.input);
    const cmd = ast.command;
    if (cmd.type === "PipeCmd") return this.execPipeCmd(input, cmd);
    throw new Error("無効なパイプコマンド");
  }

  private execPipeCmd(input: any, cmd: any): any {
    const { cmd: cmdName, mode, args: argNodes } = cmd;
    const args = argNodes.map((a: any) => this.eval(a));

    // ═══════════════════════════════════════════
    // v0.3: Space pipe commands
    // ═══════════════════════════════════════════
    if (this.isSpace(input)) {
      const sp = input as ReiSpace;
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
    if (this.isDNode(input)) {
      const dn = input as DNode;
      switch (cmdName) {
        case "sigma": {
          return {
            reiType: "SigmaResult",
            flow: getSigmaFlow(dn),
            memory: getSigmaMemory(dn),
            layer: dn.layerIndex,
            will: getSigmaWill(dn),
            field: {
              center: dn.center, neighbors: [...dn.neighbors],
              layer: dn.layerIndex, index: dn.nodeIndex,
            },
          };
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
    if (this.isObj(input) && input.reiType === "SigmaResult") {
      switch (cmdName) {
        case "flow": return input.flow;
        case "memory": return input.memory;
        case "layer": case "層": return input.layer;
        case "will": return input.will;
        case "field": return input.field;
        case "relation": return input.relation ?? [];
      }
    }

    // ═══════════════════════════════════════════
    // v0.2.1 Original pipe commands (unchanged)
    // ═══════════════════════════════════════════
    if (this.isMDim(input)) {
      const md = input;
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

    if (this.isExt(input)) {
      const ext = input;
      switch (cmdName) {
        case "order": return ext.order;
        case "base": return ext.base;
        case "valStar": case "val": return ext.valStar();
        case "subscripts": return ext.subscripts;
      }
    }

    if (this.isGenesis(input)) {
      const g = input;
      switch (cmdName) {
        case "forward": genesisForward(g); return g;
        case "phase": return g.state;
        case "history": return g.history;
        case "omega": return g.omega;
      }
    }

    if (Array.isArray(input)) {
      switch (cmdName) {
        case "len": return input.length;
        case "sum": return input.reduce((a: number, b: any) => a + this.toNumber(b), 0);
        case "avg": return input.length === 0 ? 0 : input.reduce((a: number, b: any) => a + this.toNumber(b), 0) / input.length;
        case "first": return input[0] ?? null;
        case "last": return input[input.length - 1] ?? null;
        case "reverse": return [...input].reverse();
        case "sort": return [...input].sort((a: any, b: any) => this.toNumber(a) - this.toNumber(b));
        case "map": {
          if (args.length > 0 && this.isFunction(args[0])) {
            return input.map((v: any) => this.callFunction(args[0], [v]));
          }
          return input;
        }
        case "filter": {
          if (args.length > 0 && this.isFunction(args[0])) {
            return input.filter((v: any) => !!this.callFunction(args[0], [v]));
          }
          return input;
        }
        case "reduce": {
          if (args.length >= 2 && this.isFunction(args[0])) {
            return input.reduce((acc: any, v: any) => this.callFunction(args[0], [acc, v]), args[1]);
          }
          return input;
        }
      }
    }

    if (typeof input === "number") {
      switch (cmdName) {
        case "abs": return Math.abs(input);
        case "sqrt": return Math.sqrt(input);
        case "round": return Math.round(input);
        case "floor": return Math.floor(input);
        case "ceil": return Math.ceil(input);
        case "negate": return -input;
      }
    }

    if (typeof input === "string") {
      switch (cmdName) {
        case "len": return input.length;
        case "upper": return input.toUpperCase();
        case "lower": return input.toLowerCase();
        case "trim": return input.trim();
        case "split": return input.split(args[0] ?? "");
        case "reverse": return Array.from(input).reverse().join("");
      }
    }

    if (cmdName === "\u290A" || cmdName === "converge") {
      if (this.isMDim(input)) return computeMDim(input);
      return input;
    }
    if (cmdName === "\u290B" || cmdName === "diverge") {
      if (typeof input === "number") {
        return { reiType: "MDim", center: input, neighbors: [input, input, input, input], mode: "weighted" };
      }
      return input;
    }

    // User-defined pipe function
    if (this.env.has(cmdName)) {
      const fn = this.env.get(cmdName);
      if (this.isFunction(fn)) return this.callFunction(fn, [input, ...args]);
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
    const obj = this.eval(ast.object);

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
    if (typeof val === "number") return val;
    if (typeof val === "boolean") return val ? 1 : 0;
    if (val === null) return 0;
    if (this.isExt(val)) return val.valStar();
    if (this.isMDim(val)) return computeMDim(val);
    if (typeof val === "string") return parseFloat(val) || 0;
    return 0;
  }

  private isTruthy(val: any): boolean {
    if (val === null || val === false || val === 0) return false;
    if (this.isQuad(val)) return val.value === "top" || val.value === "topPi";
    return true;
  }

  private matches(target: any, pattern: any): boolean {
    if (typeof target === typeof pattern && target === pattern) return true;
    if (this.isQuad(target) && this.isQuad(pattern)) return target.value === pattern.value;
    return false;
  }

  isObj(v: any): boolean { return v !== null && typeof v === "object" && !Array.isArray(v); }
  isMDim(v: any): boolean { return this.isObj(v) && v.reiType === "MDim"; }
  isExt(v: any): boolean { return this.isObj(v) && v.reiType === "Ext"; }
  isGenesis(v: any): boolean { return this.isObj(v) && v.reiType === "State"; }
  isFunction(v: any): boolean { return this.isObj(v) && v.reiType === "Function"; }
  isQuad(v: any): boolean { return this.isObj(v) && v.reiType === "Quad"; }
  // ── v0.3 ──
  isSpace(v: any): boolean { return this.isObj(v) && v.reiType === "Space"; }
  isDNode(v: any): boolean { return this.isObj(v) && v.reiType === "DNode"; }
}
