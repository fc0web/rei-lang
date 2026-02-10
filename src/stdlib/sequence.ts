// ============================================================
// Rei (0₀式) stdlib — sequence module
// 情報系列ネットワーク理論(ISNT): 情報の連鎖・伝播・減衰・共鳴
// ============================================================
// 核心的洞察: Reiの多次元数 [c; n₁,...,nₙ] において、
// centerは情報の発信源、neighborsは伝播先。
// sequenceモジュールは「グラフ上を流れる情報のダイナミクス」を扱う。
// networkが静的構造、sequenceが動的過程。
// ============================================================

// --- Types ---

export interface Signal {
  readonly values: number[];
  readonly length: number;
}

export type AdjMatrix = number[][];

export interface CascadeResult {
  readonly activated: boolean[][];   // [step][node] — 各ステップで活性化したか
  readonly times: number[];          // 各ノードの初回活性化時刻（-1=未活性）
  readonly totalActivated: number;
}

export interface PropagationResult {
  readonly snapshots: number[][];    // [step][node] — 各ステップの信号値
  readonly finalState: number[];
  readonly steps: number;
}

// --- Signal Creation ---

/** 数値配列から信号を作成 */
export function createSignal(values: number[]): Signal {
  return { values: [...values], length: values.length };
}

/** インパルス信号（特定位置に1、他は0） */
export function impulse(length: number, position: number = 0): Signal {
  const values = new Array(length).fill(0);
  if (position >= 0 && position < length) values[position] = 1;
  return { values, length };
}

/** ステップ信号（特定位置以降が1） */
export function step(length: number, position: number = 0): Signal {
  const values = new Array(length).fill(0);
  for (let i = position; i < length; i++) values[i] = 1;
  return { values, length };
}

/** ランプ信号（線形増加） */
export function ramp(length: number, slope: number = 1): Signal {
  const values = Array.from({ length }, (_, i) => i * slope);
  return { values, length };
}

// --- Signal Operations ---

/** 信号の減衰: s[i] → s[i] * α^i */
export function attenuate(signal: Signal, alpha: number): Signal {
  const values = signal.values.map((v, i) => v * Math.pow(alpha, i));
  return { values, length: signal.length };
}

/** 信号の増幅 */
export function amplify(signal: Signal, factor: number): Signal {
  const values = signal.values.map(v => v * factor);
  return { values, length: signal.length };
}

/** 信号の遅延（右シフト） */
export function delay(signal: Signal, steps: number): Signal {
  const values = new Array(signal.length).fill(0);
  for (let i = 0; i < signal.length; i++) {
    const src = i - steps;
    if (src >= 0 && src < signal.length) values[i] = signal.values[src];
  }
  return { values, length: signal.length };
}

/** 畳み込み */
export function convolve(signal: Signal, kernel: number[]): Signal {
  const n = signal.length;
  const k = kernel.length;
  const outLen = n + k - 1;
  const values = new Array(outLen).fill(0);
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < k; j++) {
      values[i + j] += signal.values[i] * kernel[j];
    }
  }
  return { values, length: outLen };
}

// --- Propagation on Graphs ---

/**
 * グラフ上の信号伝播（ISNTの核心）
 * 隣接行列 adj[i][j] = i→jへのエッジ重み
 * alpha = 伝播ごとの減衰率
 */
export function propagate(
  initial: number[],
  adj: AdjMatrix,
  steps: number,
  alpha: number = 0.8
): PropagationResult {
  const n = adj.length;
  const snapshots: number[][] = [initial.slice()];
  let current = initial.slice();

  for (let s = 0; s < steps; s++) {
    const next = new Array(n).fill(0);
    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
        if (adj[i][j] > 0) {
          next[j] += current[i] * adj[i][j] * alpha;
        }
      }
    }
    current = next;
    snapshots.push(current.slice());
  }

  return { snapshots, finalState: current, steps };
}

/**
 * カスケード拡散（ISNTの情報カスケードモデル）
 * 閾値ベースの活性化伝播
 */
export function cascade(
  adj: AdjMatrix,
  seeds: number[],
  steps: number,
  threshold: number = 0.3,
  alpha: number = 0.5
): CascadeResult {
  const n = adj.length;
  const activated: boolean[][] = [];
  const times = new Array(n).fill(-1);
  const isActive = new Array(n).fill(false);

  // 初期シード活性化
  for (const s of seeds) {
    if (s >= 0 && s < n) {
      isActive[s] = true;
      times[s] = 0;
    }
  }
  activated.push(isActive.slice());

  for (let step = 1; step <= steps; step++) {
    const newActive = isActive.slice();

    for (let j = 0; j < n; j++) {
      if (isActive[j]) continue; // 既に活性化済み

      // 隣接する活性化ノードからの影響を集計
      let influence = 0;
      for (let i = 0; i < n; i++) {
        if (isActive[i] && adj[i][j] > 0) {
          influence += adj[i][j] * alpha;
        }
      }

      if (influence >= threshold) {
        newActive[j] = true;
        times[j] = step;
      }
    }

    for (let j = 0; j < n; j++) isActive[j] = newActive[j];
    activated.push(isActive.slice());
  }

  return {
    activated,
    times,
    totalActivated: times.filter(t => t >= 0).length,
  };
}

/** 各ノードの影響力スコア（カスケード結果から算出） */
export function influence(cascadeResult: CascadeResult): number[] {
  const n = cascadeResult.times.length;
  const scores = new Array(n).fill(0);
  const maxTime = Math.max(...cascadeResult.times.filter(t => t >= 0), 1);

  for (let i = 0; i < n; i++) {
    if (cascadeResult.times[i] >= 0) {
      // 早く活性化されたノードほど影響力が高い
      scores[i] = 1 - cascadeResult.times[i] / (maxTime + 1);
    }
  }
  return scores;
}

// --- Correlation & Resonance ---

/** 相互相関 */
export function crossCorrelate(a: Signal, b: Signal): number[] {
  const n = Math.max(a.length, b.length);
  const result: number[] = [];

  for (let lag = -(n - 1); lag < n; lag++) {
    let sum = 0;
    for (let i = 0; i < a.length; i++) {
      const j = i + lag;
      if (j >= 0 && j < b.length) {
        sum += a.values[i] * b.values[j];
      }
    }
    result.push(sum);
  }
  return result;
}

/** 自己相関 */
export function autoCorrelate(signal: Signal): number[] {
  return crossCorrelate(signal, signal);
}

/**
 * 共鳴スコア（ISNT固有概念）
 * 二つの信号がどの程度「強め合う」かを [0,1] で返す
 */
export function resonate(a: Signal, b: Signal): number {
  const minLen = Math.min(a.length, b.length);
  if (minLen === 0) return 0;

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < minLen; i++) {
    dotProduct += a.values[i] * b.values[i];
    normA += a.values[i] * a.values[i];
    normB += b.values[i] * b.values[i];
  }

  const denom = Math.sqrt(normA) * Math.sqrt(normB);
  if (denom === 0) return 0;
  return Math.max(0, dotProduct / denom); // 正の相関のみ
}

// --- Information Theory ---

/** シャノンエントロピー（離散化） */
export function entropy(signal: Signal, bins: number = 10): number {
  if (signal.length === 0) return 0;

  const min = Math.min(...signal.values);
  const max = Math.max(...signal.values);
  const range = max - min || 1;

  const counts = new Array(bins).fill(0);
  for (const v of signal.values) {
    const bin = Math.min(Math.floor(((v - min) / range) * bins), bins - 1);
    counts[bin]++;
  }

  let h = 0;
  for (const c of counts) {
    if (c > 0) {
      const p = c / signal.length;
      h -= p * Math.log2(p);
    }
  }
  return h;
}

/**
 * 相互情報量
 * 二つの信号間の統計的依存性の測定
 */
export function mutualInformation(a: Signal, b: Signal, bins: number = 10): number {
  const minLen = Math.min(a.length, b.length);
  if (minLen === 0) return 0;

  const aMin = Math.min(...a.values.slice(0, minLen));
  const aMax = Math.max(...a.values.slice(0, minLen));
  const bMin = Math.min(...b.values.slice(0, minLen));
  const bMax = Math.max(...b.values.slice(0, minLen));
  const aRange = aMax - aMin || 1;
  const bRange = bMax - bMin || 1;

  // 同時分布
  const joint: number[][] = Array.from({ length: bins }, () => new Array(bins).fill(0));
  const margA = new Array(bins).fill(0);
  const margB = new Array(bins).fill(0);

  for (let i = 0; i < minLen; i++) {
    const ai = Math.min(Math.floor(((a.values[i] - aMin) / aRange) * bins), bins - 1);
    const bi = Math.min(Math.floor(((b.values[i] - bMin) / bRange) * bins), bins - 1);
    joint[ai][bi]++;
    margA[ai]++;
    margB[bi]++;
  }

  let mi = 0;
  for (let i = 0; i < bins; i++) {
    for (let j = 0; j < bins; j++) {
      if (joint[i][j] > 0 && margA[i] > 0 && margB[j] > 0) {
        const pij = joint[i][j] / minLen;
        const pi = margA[i] / minLen;
        const pj = margB[j] / minLen;
        mi += pij * Math.log2(pij / (pi * pj));
      }
    }
  }
  return Math.max(0, mi);
}

/**
 * 転送エントロピー（source→targetへの情報フロー量）
 * ISNTの核心的指標: 情報がネットワーク上でどの方向に流れるか
 */
export function transferEntropy(
  source: Signal,
  target: Signal,
  lag: number = 1,
  bins: number = 8
): number {
  const n = Math.min(source.length, target.length) - lag;
  if (n <= 0) return 0;

  const discretize = (v: number, min: number, range: number): number => {
    return Math.min(Math.floor(((v - min) / (range || 1)) * bins), bins - 1);
  };

  const tSlice = target.values.slice(lag);
  const tPast = target.values.slice(0, n);
  const sPast = source.values.slice(0, n);

  const tMin = Math.min(...tSlice.slice(0, n));
  const tMax = Math.max(...tSlice.slice(0, n));
  const tRange = tMax - tMin;
  const tpMin = Math.min(...tPast);
  const tpMax = Math.max(...tPast);
  const tpRange = tpMax - tpMin;
  const sMin = Math.min(...sPast);
  const sMax = Math.max(...sPast);
  const sRange = sMax - sMin;

  // 3次元同時分布: p(t_future, t_past, s_past)
  const counts: Map<string, number> = new Map();
  const countTP: Map<string, number> = new Map();
  const countTPS: Map<string, number> = new Map();
  const countT: Map<string, number> = new Map();

  for (let i = 0; i < n; i++) {
    const tf = discretize(tSlice[i], tMin, tRange);
    const tp = discretize(tPast[i], tpMin, tpRange);
    const sp = discretize(sPast[i], sMin, sRange);

    const kTPS = `${tf},${tp},${sp}`;
    const kTP = `${tf},${tp}`;
    const kPS = `${tp},${sp}`;
    const kP = `${tp}`;

    countTPS.set(kTPS, (countTPS.get(kTPS) || 0) + 1);
    countTP.set(kTP, (countTP.get(kTP) || 0) + 1);
    counts.set(kPS, (counts.get(kPS) || 0) + 1);
    countT.set(kP, (countT.get(kP) || 0) + 1);
  }

  let te = 0;
  for (const [kTPS, cTPS] of countTPS) {
    const [tf, tp, sp] = kTPS.split(',');
    const kTP = `${tf},${tp}`;
    const kPS = `${tp},${sp}`;
    const kP = tp;

    const pTPS = cTPS / n;
    const pTP = (countTP.get(kTP) || 0) / n;
    const pPS = (counts.get(kPS) || 0) / n;
    const pP = (countT.get(kP) || 0) / n;

    if (pTP > 0 && pPS > 0 && pP > 0) {
      te += pTPS * Math.log2((pTPS * pP) / (pTP * pPS));
    }
  }

  return Math.max(0, te);
}
