// ============================================================
// Rei (0₀式) stdlib — oracle module
// 四価0π理論(#21): 確率的占卜・陰陽論理モデル
// ============================================================
// 核心的洞察:
// 四価0π理論: 0（静/無）, π（動/転）, 0ₒ（潜在）, πₒ（超越）
//
// 陰陽との対応:
//   陰(yin)     ↔ 0  （静/受容）
//   陽(yang)    ↔ π  （動/発散）
//   陰中の陽   ↔ 0ₒ （静の中の動）
//   陽中の陰   ↔ πₒ （動の中の静）
//
// 易経の爻:
//   老陰(6) ↔ 0（変化する陰 → 陽へ）
//   少陽(7) ↔ π（安定した陽）
//   少陰(8) ↔ 0ₒ（安定した陰）
//   老陽(9) ↔ πₒ（変化する陽 → 陰へ）
//
// Reiの生成公理系との接続:
//   void → ・→ 0₀ → 0 → ℕ は「無から有への生成」
//   四価0πは「有の状態の四つの相」
// ============================================================

// --- Types ---

/** 四価状態: 0=静(0), 1=動(π), 2=潜在(0ₒ), 3=超越(πₒ) */
export type FourValue = 0 | 1 | 2 | 3;

export const FOUR_VALUE_NAMES: Record<FourValue, string> = {
  0: '0 (静/無)',
  1: 'π (動/転)',
  2: '0ₒ (潜在)',
  3: 'πₒ (超越)',
};

export const FOUR_VALUE_YIN_YANG: Record<FourValue, string> = {
  0: '陰 (yin)',
  1: '陽 (yang)',
  2: '陰中の陽',
  3: '陽中の陰',
};

/** 爻 (こう): 易経の基本単位 */
export type Yao = 6 | 7 | 8 | 9;
// 6 = 老陰 (変爻: 陰→陽)
// 7 = 少陽 (不変の陽)
// 8 = 少陰 (不変の陰)
// 9 = 老陽 (変爻: 陽→陰)

/** 三爻 → 八卦 */
export interface Trigram {
  readonly lines: [Yao, Yao, Yao];
  readonly number: number;    // 0-7
  readonly name: string;      // 乾, 兌, 離, 震, 巽, 坎, 艮, 坤
  readonly nature: string;    // 天, 沢, 火, 雷, 風, 水, 山, 地
  readonly attribute: string; // 健, 悦, 麗, 動, 入, 陥, 止, 順
}

/** 六爻 → 六十四卦 */
export interface Hexagram {
  readonly lines: [Yao, Yao, Yao, Yao, Yao, Yao]; // 下→上
  readonly number: number;       // 1-64 (King Wen sequence)
  readonly name: string;
  readonly upper: Trigram;
  readonly lower: Trigram;
}

export interface Interpretation {
  readonly hexagram: Hexagram;
  readonly changingLines: number[];      // 変爻の位置 (0-5)
  readonly relatedHexagram: Hexagram | null; // 之卦
  readonly yinYangBalance: { yin: number; yang: number; ratio: number };
  readonly entropy: number;
}

// --- Constants ---

const TRIGRAM_DATA: Array<{
  name: string; nature: string; attribute: string;
  binary: [number, number, number];
}> = [
  { name: '坤', nature: '地', attribute: '順', binary: [0, 0, 0] },
  { name: '艮', nature: '山', attribute: '止', binary: [0, 0, 1] },
  { name: '坎', nature: '水', attribute: '陥', binary: [0, 1, 0] },
  { name: '巽', nature: '風', attribute: '入', binary: [0, 1, 1] },
  { name: '震', nature: '雷', attribute: '動', binary: [1, 0, 0] },
  { name: '離', nature: '火', attribute: '麗', binary: [1, 0, 1] },
  { name: '兌', nature: '沢', attribute: '悦', binary: [1, 1, 0] },
  { name: '乾', nature: '天', attribute: '健', binary: [1, 1, 1] },
];

// King Wen sequence (upper trigram index × 8 + lower trigram index → hexagram number)
const KING_WEN: Record<string, { number: number; name: string }> = {
  '7,7': { number: 1, name: '乾' },
  '0,0': { number: 2, name: '坤' },
  '2,4': { number: 3, name: '屯' },
  '1,2': { number: 4, name: '蒙' },
  '2,7': { number: 5, name: '需' },
  '7,2': { number: 6, name: '訟' },
  '0,2': { number: 7, name: '師' },
  '2,0': { number: 8, name: '比' },
  '3,7': { number: 9, name: '小畜' },
  '7,3': { number: 10, name: '履' },
  '0,7': { number: 11, name: '泰' },
  '7,0': { number: 12, name: '否' },
  '7,5': { number: 13, name: '同人' },
  '5,7': { number: 14, name: '大有' },
  '0,1': { number: 15, name: '謙' },
  '4,0': { number: 16, name: '豫' },
  '6,4': { number: 17, name: '随' },
  '1,3': { number: 18, name: '蠱' },
  '0,6': { number: 19, name: '臨' },
  '3,0': { number: 20, name: '観' },
  '5,4': { number: 21, name: '噬嗑' },
  '1,5': { number: 22, name: '賁' },
  '1,0': { number: 23, name: '剥' },
  '0,4': { number: 24, name: '復' },
  '7,4': { number: 25, name: '无妄' },
  '1,7': { number: 26, name: '大畜' },
  '1,4': { number: 27, name: '頤' },
  '6,3': { number: 28, name: '大過' },
  '2,2': { number: 29, name: '坎' },
  '5,5': { number: 30, name: '離' },
  '6,1': { number: 31, name: '咸' },
  '4,3': { number: 32, name: '恒' },
  '7,1': { number: 33, name: '遯' },
  '4,7': { number: 34, name: '大壮' },
  '5,0': { number: 35, name: '晋' },
  '0,5': { number: 36, name: '明夷' },
  '3,5': { number: 37, name: '家人' },
  '5,6': { number: 38, name: '睽' },
  '2,1': { number: 39, name: '蹇' },
  '4,2': { number: 40, name: '解' },
  '1,6': { number: 41, name: '損' },
  '3,4': { number: 42, name: '益' },
  '6,7': { number: 43, name: '夬' },
  '7,6': { number: 44, name: '姤' },
  '6,0': { number: 45, name: '萃' },
  '0,3': { number: 46, name: '升' },
  '6,2': { number: 47, name: '困' },
  '2,3': { number: 48, name: '井' },
  '6,5': { number: 49, name: '革' },
  '5,3': { number: 50, name: '鼎' },
  '4,4': { number: 51, name: '震' },
  '1,1': { number: 52, name: '艮' },
  '3,1': { number: 53, name: '漸' },
  '4,6': { number: 54, name: '帰妹' },
  '4,5': { number: 55, name: '豊' },
  '5,1': { number: 56, name: '旅' },
  '3,3': { number: 57, name: '巽' },
  '6,6': { number: 58, name: '兌' },
  '3,2': { number: 59, name: '渙' },
  '2,6': { number: 60, name: '節' },
  '3,6': { number: 61, name: '中孚' },
  '4,1': { number: 62, name: '小過' },
  '2,5': { number: 63, name: '既済' },
  '5,2': { number: 64, name: '未済' },
};

// --- Seeded Random ---

function seededRandom(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 1103515245 + 12345) & 0x7fffffff;
    return s / 0x7fffffff;
  };
}

// --- Four-Value Logic ---

/** 四価状態を生成 */
export function fourValue(seed?: number): FourValue {
  const rand = seed !== undefined ? seededRandom(seed)() : Math.random();
  return Math.floor(rand * 4) as FourValue;
}

/** 四価状態の名前 */
export function fourValueName(v: FourValue): string {
  return FOUR_VALUE_NAMES[v];
}

/** 四価状態の陰陽対応 */
export function fourValueYinYang(v: FourValue): string {
  return FOUR_VALUE_YIN_YANG[v];
}

/**
 * 四価AND (∧₄)
 * 真理値表: 0=最弱, 3=最強として min 演算
 * ただし 0ₒ と πₒ は特別な関係
 */
export function and4(a: FourValue, b: FourValue): FourValue {
  // 四価AND真理値表
  const table: FourValue[][] = [
    [0, 0, 0, 0],  // 0 ∧ ?
    [0, 1, 2, 3],  // π ∧ ?
    [0, 2, 2, 0],  // 0ₒ ∧ ?  (潜在同士は潜在、超越との組み合わせは無に)
    [0, 3, 0, 3],  // πₒ ∧ ?  (超越と潜在は無、超越同士は超越)
  ];
  return table[a][b];
}

/**
 * 四価OR (∨₄)
 */
export function or4(a: FourValue, b: FourValue): FourValue {
  const table: FourValue[][] = [
    [0, 1, 2, 3],  // 0 ∨ ?
    [1, 1, 1, 1],  // π ∨ ?
    [2, 1, 2, 1],  // 0ₒ ∨ ?
    [3, 1, 1, 3],  // πₒ ∨ ?
  ];
  return table[a][b];
}

/**
 * 四価NOT (¬₄)
 * 0↔π, 0ₒ↔πₒ (陰陽反転)
 */
export function not4(a: FourValue): FourValue {
  const map: Record<FourValue, FourValue> = { 0: 1, 1: 0, 2: 3, 3: 2 };
  return map[a];
}

/**
 * 四価含意 (→₄)
 * a →₄ b = ¬₄a ∨₄ b
 */
export function implies4(a: FourValue, b: FourValue): FourValue {
  return or4(not4(a), b);
}

// --- I Ching Model ---

/** 一爻を投じる（筮竹法シミュレーション） */
export function castYao(rand?: () => number): Yao {
  const r = rand ? rand() : Math.random();
  // 確率分布（伝統的な筮竹法に近似）
  // 老陽(9): 1/16, 少陰(8): 7/16, 少陽(7): 5/16, 老陰(6): 3/16
  if (r < 1 / 16) return 9;          // 老陽
  if (r < 1 / 16 + 3 / 16) return 6; // 老陰
  if (r < 1 / 16 + 3 / 16 + 5 / 16) return 7; // 少陽
  return 8;                            // 少陰
}

/** 六爻を投じて卦を構成 */
export function castHexagram(seed?: number): Hexagram {
  const rand = seed !== undefined ? seededRandom(seed) : undefined;
  const lines: Yao[] = [];
  for (let i = 0; i < 6; i++) {
    lines.push(castYao(rand));
  }
  return buildHexagram(lines as [Yao, Yao, Yao, Yao, Yao, Yao]);
}

/** 爻の配列から卦を構成 */
function buildHexagram(lines: [Yao, Yao, Yao, Yao, Yao, Yao]): Hexagram {
  const lower = buildTrigram([lines[0], lines[1], lines[2]]);
  const upper = buildTrigram([lines[3], lines[4], lines[5]]);

  const key = `${upper.number},${lower.number}`;
  const kwEntry = KING_WEN[key] || { number: 0, name: '未知' };

  return {
    lines,
    number: kwEntry.number,
    name: kwEntry.name,
    upper,
    lower,
  };
}

/** 三爻から八卦を構成 */
function buildTrigram(lines: [Yao, Yao, Yao]): Trigram {
  const binary: [number, number, number] = lines.map(y =>
    (y === 7 || y === 9) ? 1 : 0
  ) as [number, number, number];

  const idx = binary[0] * 4 + binary[1] * 2 + binary[2];
  const data = TRIGRAM_DATA[idx];

  return {
    lines,
    number: idx,
    name: data.name,
    nature: data.nature,
    attribute: data.attribute,
  };
}

/** 卦の解釈 */
export function interpret(hex: Hexagram): Interpretation {
  const changing = changingLines(hex);
  const related = changing.length > 0 ? relatedHexagram(hex) : null;
  const balance = yinYangBalance(hex);
  const ent = hexagramEntropy(hex);

  return {
    hexagram: hex,
    changingLines: changing,
    relatedHexagram: related,
    yinYangBalance: balance,
    entropy: ent,
  };
}

/** 変爻の位置を返す */
export function changingLines(hex: Hexagram): number[] {
  const changing: number[] = [];
  hex.lines.forEach((y, i) => {
    if (y === 6 || y === 9) changing.push(i);
  });
  return changing;
}

/** 之卦（変爻を反転した卦） */
export function relatedHexagram(hex: Hexagram): Hexagram {
  const newLines = hex.lines.map(y => {
    if (y === 6) return 7 as Yao;  // 老陰 → 少陽
    if (y === 9) return 8 as Yao;  // 老陽 → 少陰
    return y;
  }) as [Yao, Yao, Yao, Yao, Yao, Yao];

  return buildHexagram(newLines);
}

/** 八卦への分解 */
export function trigramDecompose(hex: Hexagram): { upper: Trigram; lower: Trigram } {
  return { upper: hex.upper, lower: hex.lower };
}

// --- Analysis ---

/** 陰陽バランス */
export function yinYangBalance(hex: Hexagram): { yin: number; yang: number; ratio: number } {
  let yin = 0;
  let yang = 0;
  for (const y of hex.lines) {
    if (y === 6 || y === 8) yin++;
    else yang++;
  }
  return { yin, yang, ratio: yang > 0 ? yin / yang : Infinity };
}

/**
 * 卦のエントロピー（変化の可能性の指標）
 * 変爻が多いほどエントロピーが高い = 変化の度合いが大きい
 */
export function hexagramEntropy(hex: Hexagram): number {
  const changing = changingLines(hex).length;
  if (changing === 0) return 0;
  if (changing === 6) return 1;

  // 二項エントロピー
  const p = changing / 6;
  return -(p * Math.log2(p) + (1 - p) * Math.log2(1 - p));
}

// --- Transition Dynamics ---

/**
 * 四価状態の遷移行列
 * 陰陽の循環的ダイナミクス:
 * 0(陰) → 0ₒ(陰中の陽) → π(陽) → πₒ(陽中の陰) → 0(陰)...
 */
export function transitionMatrix(): number[][] {
  return [
    // 0    π     0ₒ   πₒ
    [0.3, 0.1, 0.5, 0.1],  // from 0:  主に0ₒへ（陰→陰中の陽）
    [0.1, 0.3, 0.1, 0.5],  // from π:  主にπₒへ（陽→陽中の陰）
    [0.1, 0.5, 0.3, 0.1],  // from 0ₒ: 主にπへ（陰中の陽→陽）
    [0.5, 0.1, 0.1, 0.3],  // from πₒ: 主に0へ（陽中の陰→陰）
  ];
}

/**
 * 四価状態の軌跡（遷移行列に基づく確率的遷移）
 */
export function trajectory(
  initial: FourValue,
  steps: number,
  seed?: number
): FourValue[] {
  const T = transitionMatrix();
  const rand = seed !== undefined ? seededRandom(seed) : () => Math.random();
  const path: FourValue[] = [initial];
  let current = initial;

  for (let s = 0; s < steps; s++) {
    const probs = T[current];
    const r = rand();
    let cumulative = 0;

    for (let next = 0; next < 4; next++) {
      cumulative += probs[next];
      if (r < cumulative) {
        current = next as FourValue;
        break;
      }
    }
    path.push(current);
  }

  return path;
}

/**
 * 定常分布（遷移行列の固有ベクトル）
 * 長期的に各状態がどの程度の割合で現れるか
 */
export function stationaryDistribution(): number[] {
  const T = transitionMatrix();
  // べき乗法で定常分布を求める
  let dist = [0.25, 0.25, 0.25, 0.25];

  for (let iter = 0; iter < 100; iter++) {
    const next = [0, 0, 0, 0];
    for (let j = 0; j < 4; j++) {
      for (let i = 0; i < 4; i++) {
        next[j] += dist[i] * T[i][j];
      }
    }
    dist = next;
  }

  // 正規化
  const sum = dist.reduce((a, b) => a + b, 0);
  return dist.map(d => d / sum);
}

// --- Synchronicity ---

/**
 * 共時性スコア（ユングの共時性概念の数学化）
 * 二つの事象系列の「意味的相関」を計算
 * 統計的独立性からの乖離度として定義
 */
export function synchronicity(events: number[], context: number[]): number {
  if (events.length === 0 || context.length === 0) return 0;

  const n = Math.min(events.length, context.length);

  // 正規化
  const eMean = events.slice(0, n).reduce((a, b) => a + b, 0) / n;
  const cMean = context.slice(0, n).reduce((a, b) => a + b, 0) / n;
  const eStd = Math.sqrt(events.slice(0, n).reduce((a, v) => a + (v - eMean) ** 2, 0) / n) || 1;
  const cStd = Math.sqrt(context.slice(0, n).reduce((a, v) => a + (v - cMean) ** 2, 0) / n) || 1;

  // ピアソン相関
  let corr = 0;
  for (let i = 0; i < n; i++) {
    corr += ((events[i] - eMean) / eStd) * ((context[i] - cMean) / cStd);
  }
  corr /= n;

  // Fisher's z-transform で有意性を強調
  const z = 0.5 * Math.log((1 + Math.abs(corr)) / (1 - Math.abs(corr) + 0.001));

  // [0,1] に正規化
  return Math.min(1, Math.tanh(z));
}
