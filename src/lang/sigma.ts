// ============================================================
// Rei v0.4 — Sigma Metadata System (公理C1: 全値型の自己参照)
// Extracted from evaluator.ts for modular architecture
// ============================================================

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

export function createSigmaMeta(): SigmaMetadata {
  return { memory: [], tendency: 'rest', pipeCount: 0 };
}

/** ReiValでラップ（既にラップ済みなら内部値を更新） */
export function wrapWithSigma(value: any, prevValue: any, prevMeta?: SigmaMetadata): any {
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
export function computeTendency(memory: any[], currentValue: any): string {
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

export function toNumSafe(v: any): number {
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
export function unwrapReiVal(v: any): any {
  if (v !== null && typeof v === 'object' && v.reiType === 'ReiVal') return v.value;
  return v;
}

/** 値からSigmaMetadataを取得 */
export function getSigmaOf(v: any): SigmaMetadata {
  if (v !== null && typeof v === 'object') {
    if (v.reiType === 'ReiVal') return v.__sigma__;
    if (v.__sigma__) return v.__sigma__;
  }
  return createSigmaMeta();
}

/** 全値型からSigmaResult（C1公理のσ関数）を構築 */
export function buildSigmaResult(rawVal: any, meta: SigmaMetadata): any {
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
