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

// ═══════════════════════════════════════════
// Tier 3: U1(構造還元公理) & A1(解の多元性公理)
// ═══════════════════════════════════════════

/** Tier 3 U1: 全射影の生成 — 各要素を中心にした𝕄の配列 */
function projectAll(input: any): any[] {
  let elements: any[];

  if (Array.isArray(input)) {
    elements = [...input];
  } else if (typeof input === 'string') {
    elements = Array.from(input).map(c => c.charCodeAt(0));
  } else if (typeof input === 'number') {
    elements = Math.abs(input).toString().split('').map(Number);
  } else if (input !== null && typeof input === 'object' && input.reiType === 'MDim') {
    elements = [input.center, ...input.neighbors];
  } else {
    return [{ reiType: "MDim", center: input ?? 0, neighbors: [], mode: "weighted" }];
  }

  if (elements.length === 0) return [];

  // U1.2（射影の多重性定理）: n要素 → n通りの射影
  return elements.map((_, centerIdx) => {
    const center = elements[centerIdx];
    const neighbors = elements.filter((_: any, i: number) => i !== centerIdx);
    return { reiType: "MDim", center, neighbors, mode: "weighted" };
  });
}

/** Tier 3 A1: 全モードで計算 — 解の多元性 */
function computeAll(md: any): any {
  if (!md || md.reiType !== 'MDim') return [];
  return ALL_COMPUTE_MODES.map(mode => ({
    mode,
    value: computeMDim({ ...md, mode }),
  }));
}

/** Tier 3 A1: 2つのモードを比較 */
function compareModes(md: any, mode1: string, mode2: string): any {
  if (!md || md.reiType !== 'MDim') return null;
  const v1 = computeMDim({ ...md, mode: mode1 });
  const v2 = computeMDim({ ...md, mode: mode2 });
  return {
    reiType: 'CompareResult',
    mode1: { mode: mode1, value: v1 },
    mode2: { mode: mode2, value: v2 },
    diff: Math.abs(v1 - v2),
    ratio: v2 !== 0 ? v1 / v2 : Infinity,
  };
}

/** Tier 3 U1+A1: perspectives — 全射影 × 全モード */
function perspectives(input: any): any {
  const allProjections = projectAll(input);
  return allProjections.map((proj, idx) => {
    const results = ALL_COMPUTE_MODES.map(mode => ({
      mode,
      value: computeMDim({ ...proj, mode }),
    }));
    return {
      projectionIndex: idx,
      center: proj.center,
      neighbors: proj.neighbors,
      results,
    };
  });
}

/** Tier 3 U1: ネスト𝕄のフラット化 — 𝕄{𝕄{a;b}; 𝕄{c;d}} → 単一数値 */
function computeNestedMDim(md: any): number {
  const center = md.reiType === 'MDim'
    ? (md.center !== null && typeof md.center === 'object' && md.center.reiType === 'MDim'
        ? computeNestedMDim(md.center)
        : typeof md.center === 'number' ? md.center : 0)
    : (typeof md === 'number' ? md : 0);

  const neighbors = (md.neighbors ?? []).map((n: any) =>
    n !== null && typeof n === 'object' && n.reiType === 'MDim'
      ? computeNestedMDim(n)
      : typeof n === 'number' ? n : 0
  );

  return computeMDim({ ...md, center, neighbors });
}

// ═══════════════════════════════════════════
// Tier 4: C3(応答公理) & C4(覚醒公理) & U2(変換保存) & M2(モード等価)
// ═══════════════════════════════════════════

/**
 * Tier 4 C3: 応答 — 値が外部刺激に反応して変化する
 * 仏教対応: 触（phassa）— 感覚器官と対象の接触による反応
 */
function respondToStimulus(input: any, stimulus: number, method: string = 'absorb'): any {
  if (input !== null && typeof input === 'object' && input.reiType === 'MDim') {
    const md = input;
    switch (method) {
      case 'absorb': {
        // 刺激を吸収: centerが刺激の影響を受ける
        const factor = stimulus / (Math.abs(md.center) + Math.abs(stimulus) || 1);
        const newCenter = md.center + stimulus * factor;
        return { ...md, center: newCenter };
      }
      case 'distribute': {
        // 刺激を近傍に分配
        const share = stimulus / (md.neighbors.length || 1);
        const newNeighbors = md.neighbors.map((n: number) => n + share);
        return { ...md, neighbors: newNeighbors };
      }
      case 'reflect': {
        // 刺激を反射（centerはそのまま、近傍が反転方向に変化）
        const newNeighbors = md.neighbors.map((n: number) => n - stimulus / (md.neighbors.length || 1));
        return { ...md, neighbors: newNeighbors };
      }
      case 'resonate': {
        // 刺激と共鳴（全体がstimulus周波数で変調）
        const newCenter = md.center * (1 + Math.sin(stimulus));
        const newNeighbors = md.neighbors.map((n: number, i: number) =>
          n * (1 + Math.sin(stimulus + (i + 1) * Math.PI / md.neighbors.length))
        );
        return { ...md, center: newCenter, neighbors: newNeighbors };
      }
      default:
        return respondToStimulus(input, stimulus, 'absorb');
    }
  }

  // 非𝕄: 数値は単純加算
  if (typeof input === 'number') return input + stimulus;
  return input;
}

/**
 * Tier 4 C3: 感度 — 値が刺激にどれだけ敏感かを測定
 * 微小刺激に対する変化率
 */
function computeSensitivity(input: any): number {
  if (input !== null && typeof input === 'object' && input.reiType === 'MDim') {
    const original = computeMDim(input);
    const epsilon = 0.001;
    const perturbed = respondToStimulus(input, epsilon, 'absorb');
    const perturbedVal = computeMDim(perturbed);
    return Math.abs(perturbedVal - original) / epsilon;
  }
  if (typeof input === 'number') return 1.0; // 数値は常に感度1
  return 0;
}

/**
 * Tier 4 C4: 覚醒度 — σの豊かさに基づく自己認識スコア
 * 仏教対応: 菩提（bodhi）— 悟りへの段階
 *
 * スコア要素:
 *   - memory の深さ（パイプ通過履歴）
 *   - tendency の変化（静止でない）
 *   - 構造の複雑さ（近傍の数）
 *   - pipeCount（変換回数）
 */
function computeAwareness(input: any, meta: SigmaMetadata): number {
  let score = 0;
  const maxScore = 5;

  // 1. 記憶の深さ（0〜1）
  score += Math.min(meta.memory.length / 5, 1);

  // 2. 傾向性が静止でない（0 or 1）
  if (meta.tendency !== 'rest') score += 1;

  // 3. パイプ通過回数（0〜1）
  score += Math.min(meta.pipeCount / 5, 1);

  // 4. 構造の複雑さ（0〜1）
  const raw = unwrapReiVal(input);
  if (raw !== null && typeof raw === 'object') {
    if (raw.reiType === 'MDim' && raw.neighbors) {
      score += Math.min(raw.neighbors.length / 8, 1);
    } else if (raw.reiType === 'Space') {
      score += 1; // Spaceは最も複雑
    } else if (raw.reiType === 'State' && raw.history) {
      score += Math.min(raw.history.length / 5, 1);
    }
  }

  // 5. 記憶の多様性（同じ値ばかりでないか）
  if (meta.memory.length >= 2) {
    const unique = new Set(meta.memory.map(v => JSON.stringify(v)));
    score += Math.min(unique.size / meta.memory.length, 1);
  }

  return Math.min(score / maxScore, 1);
}

/** Tier 4 C4: 覚醒閾値 — awareness >= 0.6 で覚醒 */
const AWAKENING_THRESHOLD = 0.6;

/**
 * Tier 4 U2: 変換パターンの統一適用
 * 異なる領域の変換を𝕄上の同じパイプ操作で表現
 */
function applyTransform(input: any, transformName: string, param: number): any {
  const raw = unwrapReiVal(input);

  if (raw !== null && typeof raw === 'object' && raw.reiType === 'MDim') {
    const md = raw;
    switch (transformName) {
      case 'scale': {
        // スケール変換: 全要素をparam倍
        return { ...md, center: md.center * param, neighbors: md.neighbors.map((n: number) => n * param) };
      }
      case 'shift': {
        // シフト変換: 全要素にparam加算
        return { ...md, center: md.center + param, neighbors: md.neighbors.map((n: number) => n + param) };
      }
      case 'rotate': {
        // 回転変換: 近傍をparam位置ずらす
        const n = md.neighbors.length;
        if (n === 0) return md;
        const shift = ((param % n) + n) % n;
        const rotated = [...md.neighbors.slice(shift), ...md.neighbors.slice(0, shift)];
        return { ...md, neighbors: rotated };
      }
      case 'invert': {
        // 反転変換: center基準で近傍を反転
        return { ...md, neighbors: md.neighbors.map((n: number) => 2 * md.center - n) };
      }
      case 'normalize_to': {
        // 正規化変換: 全要素の和がparamになるよう正規化
        const total = Math.abs(md.center) + md.neighbors.reduce((s: number, v: number) => s + Math.abs(v), 0) || 1;
        const factor = param / total;
        return { ...md, center: md.center * factor, neighbors: md.neighbors.map((n: number) => n * factor) };
      }
      default:
        throw new Error(`未知の変換: ${transformName}`);
    }
  }

  // 数値への変換
  if (typeof raw === 'number') {
    switch (transformName) {
      case 'scale': return raw * param;
      case 'shift': return raw + param;
      case 'invert': return -raw;
      default: return raw;
    }
  }

  return raw;
}

/**
 * Tier 4 M2: モード等価判定
 * 2つのモードが同じ型の出力を返すことを確認
 */
function checkModeEquivalence(md: any, mode1: string, mode2: string): any {
  if (!md || md.reiType !== 'MDim') return { equivalent: false, reason: 'non-MDim input' };
  const v1 = computeMDim({ ...md, mode: mode1 });
  const v2 = computeMDim({ ...md, mode: mode2 });
  return {
    reiType: 'ModeEquivResult',
    mode1,
    mode2,
    type_equivalent: typeof v1 === typeof v2, // M2: 出力型が等価
    value1: v1,
    value2: v2,
    relative_diff: Math.abs(v2) > 0 ? Math.abs(v1 - v2) / Math.abs(v2) : (v1 === v2 ? 0 : Infinity),
  };
}

// --- Quad logic (v0.2.1) ---

// ============================================================
// Tier 5: C5(共鳴) & N3-N5(非数数学) & M4-M5(モード生成・完全性)
//         U3-U5(階層再帰・架橋・完全性) & A2-A5(解変換・合成・評価・完全性)
// ============================================================

/**
 * Tier 5 C5: 共鳴計算 — 2つの𝕄の構造的共鳴度を算出
 * 覚醒した値同士が非局所的に影響し合う（仏教: 因陀羅網 Indra's Net）
 */
function computeResonance(a: any, b: any): any {
  const aRaw = unwrapReiVal(a);
  const bRaw = unwrapReiVal(b);

  // 数値同士の共鳴: 差の逆数に基づく
  const aNum = typeof aRaw === 'number' ? aRaw : (aRaw?.center ?? 0);
  const bNum = typeof bRaw === 'number' ? bRaw : (bRaw?.center ?? 0);

  // 構造的共鳴: 次元の一致度
  const aDim = aRaw?.neighbors?.length ?? 0;
  const bDim = bRaw?.neighbors?.length ?? 0;
  const dimMatch = aDim === 0 && bDim === 0 ? 1 : 1 - Math.abs(aDim - bDim) / Math.max(aDim, bDim, 1);

  // 値の近接度
  const maxAbs = Math.max(Math.abs(aNum), Math.abs(bNum), 1);
  const valueProximity = 1 - Math.abs(aNum - bNum) / maxAbs;

  // 近傍パターンの類似度（余弦類似度）
  let patternSimilarity = 0;
  if (aDim > 0 && bDim > 0) {
    const minLen = Math.min(aDim, bDim);
    const aN = aRaw.neighbors.slice(0, minLen);
    const bN = bRaw.neighbors.slice(0, minLen);
    const dotProduct = aN.reduce((s: number, v: number, i: number) => s + v * bN[i], 0);
    const normA = Math.sqrt(aN.reduce((s: number, v: number) => s + v * v, 0)) || 1;
    const normB = Math.sqrt(bN.reduce((s: number, v: number) => s + v * v, 0)) || 1;
    patternSimilarity = dotProduct / (normA * normB);
  }

  // 総合共鳴度: 3要素の加重平均
  const strength = (dimMatch * 0.3 + Math.max(valueProximity, 0) * 0.3 + (patternSimilarity + 1) / 2 * 0.4);

  return {
    reiType: 'ResonanceResult',
    strength: Math.max(0, Math.min(1, strength)),
    dimMatch,
    valueProximity: Math.max(0, valueProximity),
    patternSimilarity,
    resonates: strength >= 0.5,
  };
}

/**
 * Tier 5 C5: 共鳴場 — 値の共鳴メタデータを返す
 */
function getResonanceField(input: any, meta: SigmaMetadata): any {
  const raw = unwrapReiVal(input);
  const isAwakened = computeAwareness(input, meta) >= AWAKENING_THRESHOLD;
  return {
    reiType: 'ResonanceField',
    awakened: isAwakened,
    // 覚醒値はより広い共鳴場を持つ
    range: isAwakened ? 'non-local' : 'local',
    capacity: isAwakened ? 1.0 : 0.3,
    signature: raw?.neighbors?.length ?? 0,
  };
}

/**
 * Tier 5 C5: 共鳴マップ — 配列内の全ペアの共鳴を算出
 */
function resonanceMap(input: any): any {
  const raw = unwrapReiVal(input);
  if (!Array.isArray(raw)) {
    if (raw?.reiType === 'MDim') {
      // 𝕄の中心と各近傍の共鳴
      return raw.neighbors.map((n: number, i: number) => ({
        pair: [raw.center, n],
        index: i,
        strength: 1 - Math.abs(raw.center - n) / Math.max(Math.abs(raw.center), Math.abs(n), 1),
      }));
    }
    return [];
  }
  // 配列: 全ペアの共鳴
  const results: any[] = [];
  for (let i = 0; i < raw.length; i++) {
    for (let j = i + 1; j < raw.length; j++) {
      const res = computeResonance(raw[i], raw[j]);
      results.push({ pair: [i, j], ...res });
    }
  }
  return results;
}

/**
 * Tier 5 C5: 共鳴チェーン — 共鳴の連鎖を追跡
 */
function resonanceChain(input: any): any {
  const raw = unwrapReiVal(input);
  if (!raw || raw.reiType !== 'MDim') {
    return { reiType: 'ResonanceChain', chain: [], depth: 0 };
  }
  // 中心→各近傍→近傍同士の共鳴連鎖
  const chain: any[] = [];
  const visited = new Set<number>();
  function trace(value: number, depth: number) {
    if (visited.has(value) || depth > 5) return;
    visited.add(value);
    chain.push({ value, depth });
    for (const n of raw.neighbors) {
      if (!visited.has(n)) {
        const proximity = 1 - Math.abs(value - n) / Math.max(Math.abs(value), Math.abs(n), 1);
        if (proximity > 0.3) trace(n, depth + 1);
      }
    }
  }
  trace(raw.center, 0);
  return { reiType: 'ResonanceChain', chain, depth: chain.length };
}

/**
 * Tier 5 N3: 型変換射影 — 𝕄を異なる構造型として再解釈
 */
function projectAs(input: any, targetType: string): any {
  const raw = unwrapReiVal(input);

  // まず𝕄に変換
  let md: any;
  if (raw?.reiType === 'MDim') {
    md = raw;
  } else if (Array.isArray(raw)) {
    md = projectToMDim(raw, 'first', []);
  } else if (typeof raw === 'number') {
    const digits = String(Math.abs(Math.floor(raw))).split('').map(Number);
    md = { reiType: 'MDim', center: digits[0], neighbors: digits.slice(1), mode: 'weighted' };
  } else {
    md = { reiType: 'MDim', center: 0, neighbors: [], mode: 'weighted' };
  }

  switch (targetType) {
    case 'graph': {
      // グラフ構造: center=ハブ, neighbors=接続ノード, edges=ハブから各ノードへ
      const edges = md.neighbors.map((n: number, i: number) => ({
        from: md.center, to: n, weight: Math.abs(md.center - n),
      }));
      return {
        reiType: 'GraphProjection',
        hub: md.center,
        nodes: [md.center, ...md.neighbors],
        edges,
        degree: md.neighbors.length,
      };
    }
    case 'series': {
      // 時系列: center=初期値, neighbors=時間ステップ
      const series = [md.center, ...md.neighbors];
      const deltas = [];
      for (let i = 1; i < series.length; i++) deltas.push(series[i] - series[i - 1]);
      return {
        reiType: 'SeriesProjection',
        values: series,
        deltas,
        trend: deltas.length > 0 ? (deltas.reduce((a: number, b: number) => a + b, 0) / deltas.length > 0 ? 'up' : 'down') : 'flat',
        length: series.length,
      };
    }
    case 'matrix': {
      // 行列行: center=対角要素, neighbors=非対角要素
      const size = md.neighbors.length + 1;
      const row = [md.center, ...md.neighbors];
      return {
        reiType: 'MatrixProjection',
        row,
        size,
        diagonal: md.center,
        trace: md.center, // 1行分のtrace
      };
    }
    case 'tree': {
      // 木構造: center=root, neighbors=children
      const children = md.neighbors.map((n: number, i: number) => ({
        value: n, depth: 1, index: i, leaf: true,
      }));
      return {
        reiType: 'TreeProjection',
        root: md.center,
        children,
        height: md.neighbors.length > 0 ? 1 : 0,
        leaves: md.neighbors.length,
      };
    }
    default:
      throw new Error(`未知の射影型: ${targetType}`);
  }
}

/**
 * Tier 5 N4: 射影合成 — 複数の射影を合成して新しい𝕄を生成
 */
function composeProjections(input: any): any {
  const raw = unwrapReiVal(input);
  if (!Array.isArray(raw)) {
    if (raw?.reiType === 'MDim') {
      // 𝕄の全射影を合成: 各射影のcompute結果を新しい近傍に
      const allProj = projectAll(raw);
      const values = allProj.map((p: any) => computeMDim(p));
      const center = values.reduce((a: number, b: number) => a + b, 0) / values.length;
      return { reiType: 'MDim', center, neighbors: values, mode: 'weighted' };
    }
    return raw;
  }
  // 配列の射影合成: 各射影の中心を新しい𝕄の近傍に
  const projected = raw.map((item: any) => {
    if (item?.reiType === 'MDim') return item;
    return projectToMDim(typeof item === 'number' ? [item] : item, 'first', []);
  });
  const centers = projected.map((p: any) => p.center);
  const avgCenter = centers.reduce((a: number, b: number) => a + b, 0) / centers.length;
  return { reiType: 'MDim', center: avgCenter, neighbors: centers, mode: 'weighted' };
}

/**
 * Tier 5 N5: 表現可能性判定 — 任意の値が𝕄として表現可能かを判定
 */
function checkRepresentable(input: any): any {
  const raw = unwrapReiVal(input);
  const result = { reiType: 'RepresentableResult', representable: true, reason: '', lossless: true };

  if (raw === null || raw === undefined) {
    result.representable = true;
    result.reason = 'null → 𝕄{0;}';
    result.lossless = true;
  } else if (typeof raw === 'number') {
    result.representable = true;
    result.reason = 'number → 𝕄{n;}';
    result.lossless = true;
  } else if (typeof raw === 'string') {
    result.representable = true;
    result.reason = 'string → 𝕄{charCode(center); charCodes(rest)}';
    result.lossless = true;
  } else if (typeof raw === 'boolean') {
    result.representable = true;
    result.reason = 'boolean → 𝕄{0|1;}';
    result.lossless = true;
  } else if (Array.isArray(raw)) {
    result.representable = true;
    result.reason = `array[${raw.length}] → 𝕄{first; rest}`;
    result.lossless = true;
  } else if (raw?.reiType === 'MDim') {
    result.representable = true;
    result.reason = 'already 𝕄';
    result.lossless = true;
  } else if (raw?.reiType === 'Space') {
    result.representable = true;
    result.reason = 'Space → nested 𝕄 (U3 hierarchical)';
    result.lossless = true;
  } else if (raw?.reiType) {
    result.representable = true;
    result.reason = `${raw.reiType} → 𝕄 via structural projection`;
    result.lossless = false; // 型情報の一部が失われる可能性
  } else if (typeof raw === 'object') {
    result.representable = true;
    result.reason = 'object → 𝕄{keys; values}';
    result.lossless = false;
  } else {
    result.representable = false;
    result.reason = `unknown type: ${typeof raw}`;
    result.lossless = false;
  }
  return result;
}

/**
 * Tier 5 M4: モード導出 — 既存2モードの合成で新モードを生成
 */
function deriveMode(md: any, baseModes: string[], weights: number[]): any {
  if (!md || md.reiType !== 'MDim') throw new Error('derive_mode: 𝕄型が必要です');
  const results = baseModes.map(m => computeMDim({ ...md, mode: m }));
  let derived = 0;
  let totalWeight = 0;
  for (let i = 0; i < results.length; i++) {
    const w = weights[i] ?? 1;
    derived += results[i] * w;
    totalWeight += w;
  }
  derived = totalWeight > 0 ? derived / totalWeight : 0;
  return {
    reiType: 'DerivedModeResult',
    value: derived,
    baseModes,
    weights,
    formula: baseModes.map((m, i) => `${weights[i] ?? 1}×${m}`).join(' + '),
  };
}

/**
 * Tier 5 M5: モード空間 — 全モードの完全記述
 */
function getModeSpace(md: any): any {
  if (!md || md.reiType !== 'MDim') {
    return { reiType: 'ModeSpace', modes: ALL_COMPUTE_MODES.length, values: [], coverage: 0 };
  }
  const values = ALL_COMPUTE_MODES.map(mode => ({
    mode,
    value: computeMDim({ ...md, mode }),
  }));
  // モード間の距離行列
  const distances: number[][] = [];
  for (let i = 0; i < values.length; i++) {
    distances[i] = [];
    for (let j = 0; j < values.length; j++) {
      distances[i][j] = Math.abs(values[i].value - values[j].value);
    }
  }
  // 分散（多様性の指標）
  const allVals = values.map(v => v.value);
  const mean = allVals.reduce((a, b) => a + b, 0) / allVals.length;
  const variance = allVals.reduce((a, v) => a + (v - mean) ** 2, 0) / allVals.length;
  return {
    reiType: 'ModeSpace',
    modes: ALL_COMPUTE_MODES.length,
    values,
    variance,
    diversity: Math.sqrt(variance),
    coverage: 1.0, // 全モード利用可能
  };
}

/**
 * Tier 5 U3: ネスト深度の計測
 */
function measureDepth(input: any): number {
  const raw = unwrapReiVal(input);
  if (!raw || raw.reiType !== 'MDim') return 0;

  let maxDepth = 0;
  // centerが𝕄なら再帰
  if (raw.center !== null && typeof raw.center === 'object' && raw.center.reiType === 'MDim') {
    maxDepth = Math.max(maxDepth, 1 + measureDepth(raw.center));
  }
  // neighborsに𝕄があれば再帰
  if (raw.neighbors) {
    for (const n of raw.neighbors) {
      if (n !== null && typeof n === 'object' && n.reiType === 'MDim') {
        maxDepth = Math.max(maxDepth, 1 + measureDepth(n));
      }
    }
  }
  return maxDepth;
}

/**
 * Tier 5 U3: ネスト化 — 𝕄を指定レベル分ネストする
 */
function nestMDim(input: any, levels: number = 1): any {
  const raw = unwrapReiVal(input);
  if (!raw || raw.reiType !== 'MDim') {
    // 非𝕄はまず𝕄に変換
    const md = { reiType: 'MDim', center: typeof raw === 'number' ? raw : 0, neighbors: [], mode: 'weighted' };
    return levels <= 1 ? md : nestMDim(md, levels - 1);
  }
  if (levels <= 0) return raw;
  // 現在の𝕄を新しい𝕄のcenterにラップ
  const wrapped = {
    reiType: 'MDim',
    center: raw,
    neighbors: [],
    mode: 'weighted',
  };
  return levels <= 1 ? wrapped : nestMDim(wrapped, levels - 1);
}

/**
 * Tier 5 U3: 再帰的計算 — ネストされた𝕄を底から上へ再帰的に計算
 */
function recursiveCompute(input: any): number {
  const raw = unwrapReiVal(input);
  if (typeof raw === 'number') return raw;
  if (!raw || raw.reiType !== 'MDim') return 0;

  // centerが𝕄なら再帰的に計算
  const centerVal = (raw.center?.reiType === 'MDim')
    ? recursiveCompute(raw.center)
    : (typeof raw.center === 'number' ? raw.center : 0);

  // neighborsも再帰的に計算
  const neighborVals = (raw.neighbors || []).map((n: any) =>
    (n?.reiType === 'MDim') ? recursiveCompute(n) : (typeof n === 'number' ? n : 0)
  );

  // フラット化した値でcomputeMDim
  return computeMDim({
    reiType: 'MDim',
    center: centerVal,
    neighbors: neighborVals,
    mode: raw.mode || 'weighted',
  });
}

/**
 * Tier 5 U4: 構造的類似度 — 2つの𝕄の構造的類似性を算出
 */
function structuralSimilarity(a: any, b: any): any {
  const aRaw = unwrapReiVal(a);
  const bRaw = unwrapReiVal(b);

  // 次元の一致度
  const aDim = aRaw?.neighbors?.length ?? 0;
  const bDim = bRaw?.neighbors?.length ?? 0;
  const dimSim = aDim === 0 && bDim === 0 ? 1 : 1 - Math.abs(aDim - bDim) / Math.max(aDim, bDim, 1);

  // 比率パターンの類似度
  const aCenter = typeof aRaw === 'number' ? aRaw : (aRaw?.center ?? 0);
  const bCenter = typeof bRaw === 'number' ? bRaw : (bRaw?.center ?? 0);
  const aRatios = (aRaw?.neighbors ?? []).map((n: number) => aCenter !== 0 ? n / aCenter : n);
  const bRatios = (bRaw?.neighbors ?? []).map((n: number) => bCenter !== 0 ? n / bCenter : n);

  let ratioSim = 0;
  if (aRatios.length > 0 && bRatios.length > 0) {
    const minLen = Math.min(aRatios.length, bRatios.length);
    let sumDiff = 0;
    for (let i = 0; i < minLen; i++) {
      sumDiff += Math.abs(aRatios[i] - bRatios[i]);
    }
    ratioSim = 1 / (1 + sumDiff / minLen);
  } else if (aRatios.length === 0 && bRatios.length === 0) {
    ratioSim = 1;
  }

  // モードの一致
  const modeSim = (aRaw?.mode ?? 'weighted') === (bRaw?.mode ?? 'weighted') ? 1 : 0.5;

  const similarity = dimSim * 0.4 + ratioSim * 0.4 + modeSim * 0.2;

  return {
    reiType: 'SimilarityResult',
    similarity,
    dimSimilarity: dimSim,
    ratioSimilarity: ratioSim,
    modeSimilarity: modeSim,
    isomorphic: similarity > 0.9,
  };
}

/**
 * Tier 5 U4: 領域架橋 — 2つの𝕄間の構造的マッピングを生成
 */
function bridgeMDim(a: any, b: any): any {
  const sim = structuralSimilarity(a, b);
  const aRaw = unwrapReiVal(a);
  const bRaw = unwrapReiVal(b);
  const aCenter = typeof aRaw === 'number' ? aRaw : (aRaw?.center ?? 0);
  const bCenter = typeof bRaw === 'number' ? bRaw : (bRaw?.center ?? 0);

  // スケールファクターの計算
  const scaleFactor = aCenter !== 0 ? bCenter / aCenter : 1;

  return {
    reiType: 'BridgeResult',
    similarity: sim.similarity,
    scaleFactor,
    mapping: {
      centerA: aCenter,
      centerB: bCenter,
      dimA: aRaw?.neighbors?.length ?? 0,
      dimB: bRaw?.neighbors?.length ?? 0,
    },
    transferable: sim.similarity > 0.5,
  };
}

/**
 * Tier 5 U5: エンコード — 任意の値を𝕄に変換
 */
function encodeMDim(input: any): any {
  const raw = unwrapReiVal(input);
  if (raw?.reiType === 'MDim') return raw;
  if (typeof raw === 'number') {
    return { reiType: 'MDim', center: raw, neighbors: [], mode: 'weighted' };
  }
  if (typeof raw === 'string') {
    const codes = Array.from(raw).map(c => c.charCodeAt(0));
    if (codes.length === 0) return { reiType: 'MDim', center: 0, neighbors: [], mode: 'weighted' };
    return { reiType: 'MDim', center: codes[0], neighbors: codes.slice(1), mode: 'weighted' };
  }
  if (typeof raw === 'boolean') {
    return { reiType: 'MDim', center: raw ? 1 : 0, neighbors: [], mode: 'weighted' };
  }
  if (raw === null || raw === undefined) {
    return { reiType: 'MDim', center: 0, neighbors: [], mode: 'weighted' };
  }
  if (Array.isArray(raw)) {
    const nums = raw.map((v: any) => typeof v === 'number' ? v : 0);
    return { reiType: 'MDim', center: nums[0] ?? 0, neighbors: nums.slice(1), mode: 'weighted' };
  }
  // オブジェクト型 — キー数をcenter, 値を近傍に
  if (typeof raw === 'object') {
    const values = Object.values(raw).filter(v => typeof v === 'number') as number[];
    return { reiType: 'MDim', center: values[0] ?? 0, neighbors: values.slice(1), mode: 'weighted' };
  }
  return { reiType: 'MDim', center: 0, neighbors: [], mode: 'weighted' };
}

/**
 * Tier 5 U5: デコード — 𝕄を指定型に変換
 */
function decodeMDim(input: any, targetType: string): any {
  const raw = unwrapReiVal(input);
  const md = raw?.reiType === 'MDim' ? raw : encodeMDim(raw);

  switch (targetType) {
    case 'number':
      return computeMDim(md);
    case 'array':
      return [md.center, ...md.neighbors];
    case 'string':
      return String.fromCharCode(md.center, ...md.neighbors);
    case 'object':
      const obj: any = { center: md.center };
      md.neighbors.forEach((n: number, i: number) => { obj[`n${i}`] = n; });
      return obj;
    default:
      return [md.center, ...md.neighbors];
  }
}

/**
 * Tier 5 A2: 解変換 — compute_allの結果に変換を適用
 */
function mapSolutions(md: any, transformName: string, param: number = 1): any {
  const solutions = computeAll(md);
  return solutions.map((sol: any) => {
    let transformed: number;
    switch (transformName) {
      case 'scale': transformed = sol.value * param; break;
      case 'shift': transformed = sol.value + param; break;
      case 'normalize': {
        const maxVal = Math.max(...solutions.map((s: any) => Math.abs(s.value)), 1);
        transformed = sol.value / maxVal;
        break;
      }
      case 'rank_normalize': {
        const sorted = [...solutions].sort((a: any, b: any) => a.value - b.value);
        const rank = sorted.findIndex((s: any) => s.mode === sol.mode);
        transformed = (rank + 1) / solutions.length;
        break;
      }
      default: transformed = sol.value;
    }
    return { ...sol, original: sol.value, value: transformed, transform: transformName };
  });
}

/**
 * Tier 5 A3: 合意形成 — 全モードの結果からコンセンサスを算出
 */
function computeConsensus(md: any): any {
  const solutions = computeAll(md);
  const values = solutions.map((s: any) => s.value);

  // 中央値（ロバストなコンセンサス）
  const sorted = [...values].sort((a: number, b: number) => a - b);
  const median = sorted.length % 2 === 0
    ? (sorted[sorted.length / 2 - 1] + sorted[sorted.length / 2]) / 2
    : sorted[Math.floor(sorted.length / 2)];

  // 平均
  const mean = values.reduce((a: number, b: number) => a + b, 0) / values.length;

  // 標準偏差（合意の度合い）
  const variance = values.reduce((a: number, v: number) => a + (v - mean) ** 2, 0) / values.length;
  const stddev = Math.sqrt(variance);

  // 合意度: 標準偏差が小さいほど高い
  const agreement = 1 / (1 + stddev / (Math.abs(mean) || 1));

  return {
    reiType: 'ConsensusResult',
    median,
    mean,
    stddev,
    agreement,
    solutions: solutions.length,
    range: { min: sorted[0], max: sorted[sorted.length - 1] },
  };
}

/**
 * Tier 5 A4: 最良解選択 — 指定基準で最良の解を選択
 */
function selectBest(md: any, criteria: string = 'median_closest'): any {
  const solutions = computeAll(md);
  const values = solutions.map((s: any) => s.value);

  switch (criteria) {
    case 'max':
      return solutions.reduce((best: any, s: any) => s.value > best.value ? s : best);
    case 'min':
      return solutions.reduce((best: any, s: any) => s.value < best.value ? s : best);
    case 'median_closest':
    default: {
      const sorted = [...values].sort((a: number, b: number) => a - b);
      const median = sorted.length % 2 === 0
        ? (sorted[sorted.length / 2 - 1] + sorted[sorted.length / 2]) / 2
        : sorted[Math.floor(sorted.length / 2)];
      return solutions.reduce((best: any, s: any) =>
        Math.abs(s.value - median) < Math.abs(best.value - median) ? s : best
      );
    }
  }
}

/**
 * Tier 5 A4: 解のランキング
 */
function rankSolutions(md: any, criteria: string = 'value'): any {
  const solutions = computeAll(md);
  const sorted = [...solutions].sort((a: any, b: any) => {
    switch (criteria) {
      case 'value': return b.value - a.value; // 降順
      case 'abs': return Math.abs(b.value) - Math.abs(a.value);
      default: return b.value - a.value;
    }
  });
  return sorted.map((s: any, i: number) => ({ ...s, rank: i + 1 }));
}

/**
 * Tier 5 A5: 解の完全性 — 解空間の網羅度を評価
 */
function solutionCompleteness(md: any): any {
  const solutions = computeAll(md);
  const values = solutions.map((s: any) => s.value);

  // ユニーク値の比率
  const uniqueValues = new Set(values.map((v: number) => Math.round(v * 1e6) / 1e6));
  const uniqueRatio = uniqueValues.size / values.length;

  // レンジカバレッジ
  const sorted = [...values].sort((a: number, b: number) => a - b);
  const range = sorted[sorted.length - 1] - sorted[0];

  // 分布の均一性（エントロピーベース）
  const bins = 4;
  const binWidth = range / bins || 1;
  const histogram = new Array(bins).fill(0);
  for (const v of values) {
    const bin = Math.min(Math.floor((v - sorted[0]) / binWidth), bins - 1);
    histogram[bin]++;
  }
  const total = values.length;
  let entropy = 0;
  for (const count of histogram) {
    if (count > 0) {
      const p = count / total;
      entropy -= p * Math.log2(p);
    }
  }
  const maxEntropy = Math.log2(bins);
  const uniformity = maxEntropy > 0 ? entropy / maxEntropy : 1;

  return {
    reiType: 'CompletenessResult',
    totalModes: solutions.length,
    uniqueSolutions: uniqueValues.size,
    uniqueRatio,
    range,
    uniformity,
    completeness: (uniqueRatio * 0.5 + uniformity * 0.5),
    isComplete: uniqueRatio > 0.5 && uniformity > 0.3,
  };
}

// ============================================================
// Serialization — 𝕄のシリアライゼーション（保存・復元）
// serialize: Rei値 → JSON文字列（σ/τ/覚醒状態を含む）
// deserialize: JSON文字列 → Rei値（来歴を引き継いで計算再開）
// ============================================================

const REI_SERIAL_VERSION = "0.3.1";

function reiSerialize(value: any, pretty: boolean = false): string {
  const type = detectSerialType(value);
  let sigma: any;
  if (value !== null && typeof value === "object" && value.__sigma__) {
    sigma = {
      memory: value.__sigma__.memory || [],
      tendency: value.__sigma__.tendency || "rest",
      pipeCount: value.__sigma__.pipeCount || 0,
    };
  }
  const payload = cleanSerialPayload(value);
  const envelope = {
    __rei__: true as const,
    version: REI_SERIAL_VERSION,
    type,
    timestamp: new Date().toISOString(),
    payload,
    ...(sigma ? { sigma } : {}),
  };
  return JSON.stringify(envelope, null, pretty ? 2 : undefined);
}

function reiDeserialize(value: any): any {
  let json: string;
  if (typeof value === "string") {
    json = value;
  } else if (typeof value === "object" && value !== null && value.reiType === "ReiVal" && typeof value.value === "string") {
    json = value.value;
  } else {
    json = JSON.stringify(value);
  }
  let parsed: any;
  try { parsed = JSON.parse(json); } catch (e) {
    throw new Error(`deserialize: 無効なJSON — ${(e as Error).message}`);
  }
  if (parsed && parsed.__rei__ === true && "payload" in parsed) {
    let val = parsed.payload;
    if (parsed.sigma && val !== null && typeof val === "object") {
      val.__sigma__ = {
        memory: parsed.sigma.memory || [],
        tendency: parsed.sigma.tendency || "rest",
        pipeCount: parsed.sigma.pipeCount || 0,
      };
    }
    return val;
  }
  return parsed;
}

function detectSerialType(value: any): string {
  if (value === null || value === undefined) return "null";
  if (typeof value === "number") return "number";
  if (typeof value === "string") return "string";
  if (typeof value === "boolean") return "boolean";
  if (Array.isArray(value)) return "array";
  if (typeof value === "object" && value.reiType) return value.reiType;
  return "object";
}

function cleanSerialPayload(value: any): any {
  if (value === null || value === undefined) return value;
  if (typeof value !== "object") return value;
  if (Array.isArray(value)) return value.map(cleanSerialPayload);
  const clean: any = {};
  for (const key of Object.keys(value)) {
    if (key === "__sigma__") continue;
    clean[key] = value[key];
  }
  return clean;
}

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
      // ── Serialization: serialize/deserialize もラップしない ──
      if (cmd.cmd === "serialize" || cmd.cmd === "serialize_pretty") {
        return reiSerialize(rawInput, cmd.cmd === "serialize_pretty");
      }
      if (cmd.cmd === "deserialize") {
        return reiDeserialize(rawInput);
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
    // Tier 3: U1(構造還元) & A1(解の多元性)
    // ═══════════════════════════════════════════
    if (cmdName === "project_all") {
      // U1.2: n要素 → n通りの全射影
      return projectAll(rawInput);
    }
    if (cmdName === "compute_all") {
      // A1: 全モードで計算 → 解の多元性
      if (this.isMDim(rawInput)) return computeAll(rawInput);
      // 配列の場合は先にproject → compute_all
      if (Array.isArray(rawInput)) {
        const projected = projectToMDim(rawInput, 'first', []);
        return computeAll(projected);
      }
      return [];
    }
    if (cmdName === "compare") {
      // A1: 2モード比較
      if (!this.isMDim(rawInput)) throw new Error("compare: 𝕄型の値が必要です");
      const mode1 = args.length >= 1 ? String(args[0]) : "weighted";
      const mode2 = args.length >= 2 ? String(args[1]) : "geometric";
      return compareModes(rawInput, mode1, mode2);
    }
    if (cmdName === "perspectives") {
      // U1+A1: 全射影 × 全モード
      return perspectives(rawInput);
    }
    if (cmdName === "flatten_nested") {
      // U1: ネスト𝕄の再帰的フラット化
      if (this.isMDim(rawInput)) return computeNestedMDim(rawInput);
      return rawInput;
    }

    // ═══════════════════════════════════════════
    // Tier 4: C3(応答) & C4(覚醒) & U2(変換保存) & M2(モード等価)
    // ═══════════════════════════════════════════
    if (cmdName === "respond") {
      // C3: 外部刺激への応答
      const stimulus = args.length >= 1 ? this.toNumber(args[0]) : 0;
      const method = args.length >= 2 ? String(args[1]) : 'absorb';
      return respondToStimulus(rawInput, stimulus, method);
    }
    if (cmdName === "sensitivity") {
      // C3: 応答感度の測定
      return computeSensitivity(rawInput);
    }
    if (cmdName === "awareness") {
      // C4: 覚醒度スコア（0.0〜1.0）
      return computeAwareness(rawInput, sigmaMetadata);
    }
    if (cmdName === "awakened") {
      // C4: 覚醒判定
      return computeAwareness(rawInput, sigmaMetadata) >= AWAKENING_THRESHOLD;
    }
    if (cmdName === "transform") {
      // U2: 変換パターンの統一適用
      const transformName = args.length >= 1 ? String(args[0]) : 'scale';
      const param = args.length >= 2 ? this.toNumber(args[1]) : 1;
      return applyTransform(rawInput, transformName, param);
    }
    if (cmdName === "mode_equiv") {
      // M2: モード等価判定
      if (!this.isMDim(rawInput)) throw new Error("mode_equiv: 𝕄型の値が必要です");
      const m1 = args.length >= 1 ? String(args[0]) : "weighted";
      const m2 = args.length >= 2 ? String(args[1]) : "geometric";
      return checkModeEquivalence(rawInput, m1, m2);
    }

    // ═══════════════════════════════════════════
    // Tier 5: C5(共鳴) & N3-N5 & M4-M5 & U3-U5 & A2-A5
    // ═══════════════════════════════════════════

    // C5: 共鳴
    if (cmdName === "resonate") {
      // C5: 2つの値の共鳴を算出
      if (args.length < 1) throw new Error("resonate: 比較対象が必要です");
      return computeResonance(rawInput, args[0]);
    }
    if (cmdName === "resonance_field") {
      // C5: 共鳴場の取得
      return getResonanceField(rawInput, sigmaMetadata);
    }
    if (cmdName === "resonance_map") {
      // C5: 共鳴マップ（全ペアの共鳴）
      return resonanceMap(rawInput);
    }
    if (cmdName === "resonance_chain") {
      // C5: 共鳴チェーン
      return resonanceChain(rawInput);
    }

    // N3: 型変換射影
    if (cmdName === "project_as") {
      const targetType = args.length >= 1 ? String(args[0]) : 'graph';
      return projectAs(rawInput, targetType);
    }

    // N4: 射影合成
    if (cmdName === "compose_projections") {
      return composeProjections(rawInput);
    }

    // N5: 表現可能性判定
    if (cmdName === "representable") {
      return checkRepresentable(rawInput);
    }

    // M4: モード導出
    if (cmdName === "derive_mode") {
      if (!this.isMDim(rawInput)) throw new Error("derive_mode: 𝕄型が必要です");
      const modes = args.filter((a: any) => typeof a === 'string');
      const weights = args.filter((a: any) => typeof a === 'number');
      if (modes.length === 0) modes.push('weighted', 'geometric');
      if (weights.length === 0) weights.push(0.5, 0.5);
      return deriveMode(rawInput, modes, weights);
    }

    // M5: モード空間
    if (cmdName === "mode_space") {
      return getModeSpace(rawInput);
    }

    // U3: 階層再帰
    if (cmdName === "depth") {
      return measureDepth(rawInput);
    }
    if (cmdName === "nest") {
      const levels = args.length >= 1 ? this.toNumber(args[0]) : 1;
      return nestMDim(rawInput, levels);
    }
    if (cmdName === "recursive_compute") {
      return recursiveCompute(rawInput);
    }

    // U4: 領域架橋
    if (cmdName === "bridge") {
      if (args.length < 1) throw new Error("bridge: 比較対象が必要です");
      return bridgeMDim(rawInput, args[0]);
    }
    if (cmdName === "structural_similarity") {
      if (args.length < 1) throw new Error("structural_similarity: 比較対象が必要です");
      return structuralSimilarity(rawInput, args[0]);
    }

    // U5: 完全性
    if (cmdName === "encode") {
      return encodeMDim(rawInput);
    }
    if (cmdName === "decode") {
      const targetType = args.length >= 1 ? String(args[0]) : 'array';
      return decodeMDim(rawInput, targetType);
    }

    // A2: 解変換
    if (cmdName === "map_solutions") {
      if (!this.isMDim(rawInput)) {
        if (Array.isArray(rawInput)) {
          const projected = projectToMDim(rawInput, 'first', []);
          return mapSolutions(projected, args.length >= 1 ? String(args[0]) : 'scale', args.length >= 2 ? this.toNumber(args[1]) : 1);
        }
        throw new Error("map_solutions: 𝕄型または配列が必要です");
      }
      return mapSolutions(rawInput, args.length >= 1 ? String(args[0]) : 'scale', args.length >= 2 ? this.toNumber(args[1]) : 1);
    }

    // A3: 合意形成
    if (cmdName === "consensus") {
      if (!this.isMDim(rawInput)) {
        if (Array.isArray(rawInput)) {
          return computeConsensus(projectToMDim(rawInput, 'first', []));
        }
        throw new Error("consensus: 𝕄型または配列が必要です");
      }
      return computeConsensus(rawInput);
    }

    // A4: 最良解・ランキング
    if (cmdName === "best") {
      if (!this.isMDim(rawInput)) {
        if (Array.isArray(rawInput)) {
          return selectBest(projectToMDim(rawInput, 'first', []), args.length >= 1 ? String(args[0]) : 'median_closest');
        }
        throw new Error("best: 𝕄型または配列が必要です");
      }
      return selectBest(rawInput, args.length >= 1 ? String(args[0]) : 'median_closest');
    }
    if (cmdName === "rank") {
      if (!this.isMDim(rawInput)) {
        if (Array.isArray(rawInput)) {
          return rankSolutions(projectToMDim(rawInput, 'first', []), args.length >= 1 ? String(args[0]) : 'value');
        }
        throw new Error("rank: 𝕄型または配列が必要です");
      }
      return rankSolutions(rawInput, args.length >= 1 ? String(args[0]) : 'value');
    }

    // A5: 解の完全性
    if (cmdName === "solution_completeness") {
      if (!this.isMDim(rawInput)) {
        if (Array.isArray(rawInput)) {
          return solutionCompleteness(projectToMDim(rawInput, 'first', []));
        }
        throw new Error("solution_completeness: 𝕄型または配列が必要です");
      }
      return solutionCompleteness(rawInput);
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
