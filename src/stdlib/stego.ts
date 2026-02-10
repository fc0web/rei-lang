// ============================================================
// Rei (0₀式) stdlib — stego module
// 文字内情報埋込理論: ステガノグラフィの代数的操作
// ============================================================
// 核心的洞察: Reiの多次元数 [c; n₁,...,nₙ] において、
// center = 表面的に見えるデータ（カバー）
// neighbors = 隠された情報（ペイロード）
// 拡張(△) = 次元を増やして情報を隠す
// 縮約(▽) = 次元を落として情報を抽出する
//
// D-FUMTの「見えない次元に情報を埋め込む」思想の直接実装。
// ============================================================

// --- Types ---

export type TextMethod = 'zwc' | 'homoglyph' | 'whitespace';
export type StegoMethod = 'lsb' | 'spread' | 'multidim';
export type AttackType = 'noise' | 'crop' | 'scale' | 'quantize';

export interface MultiDimStego {
  readonly center: number;
  readonly neighbors: number[];
  readonly hidden: boolean;  // 情報が隠蔽されているか
}

export interface StegoAnalysis {
  readonly capacity: number;       // ビット容量
  readonly detectability: number;  // 検出リスク [0,1]
  readonly psnr: number;           // ピーク信号対雑音比 (dB)
  readonly robustness: number;     // 堅牢性 [0,1]
}

// --- Text Steganography ---

// ゼロ幅文字 (Zero-Width Characters)
const ZWC = {
  ZWSP: '\u200B',    // Zero-Width Space → bit 0
  ZWNJ: '\u200C',    // Zero-Width Non-Joiner → bit 1
  ZWJ:  '\u200D',    // Zero-Width Joiner → separator
  MARK: '\uFEFF',    // BOM / Zero-Width No-Break Space → start marker
};

/**
 * テキストステガノグラフィ: ゼロ幅文字による埋込
 * カバーテキストの文字間にゼロ幅文字で秘密メッセージをエンコード
 */
export function embedText(cover: string, secret: string, method: TextMethod = 'zwc'): string {
  if (method !== 'zwc') {
    // 他の方式は zwc にフォールバック
    return embedText(cover, secret, 'zwc');
  }

  // 秘密文字列 → バイナリ
  const bits = stringToBits(secret);

  // ゼロ幅文字列に変換
  const encoded = ZWC.MARK +
    bits.map(b => b === 1 ? ZWC.ZWNJ : ZWC.ZWSP).join('') +
    ZWC.ZWJ;

  // カバーの中間に挿入
  const mid = Math.floor(cover.length / 2);
  return cover.slice(0, mid) + encoded + cover.slice(mid);
}

/**
 * テキストステガノグラフィ: 抽出
 */
export function extractText(stego: string, method: TextMethod = 'zwc'): string {
  if (method !== 'zwc') {
    return extractText(stego, 'zwc');
  }

  const startIdx = stego.indexOf(ZWC.MARK);
  const endIdx = stego.indexOf(ZWC.ZWJ, startIdx + 1);

  if (startIdx === -1 || endIdx === -1) return '';

  const encoded = stego.slice(startIdx + 1, endIdx);
  const bits: number[] = [];

  for (const ch of encoded) {
    if (ch === ZWC.ZWNJ) bits.push(1);
    else if (ch === ZWC.ZWSP) bits.push(0);
  }

  return bitsToString(bits);
}

// --- Numeric Steganography (LSB) ---

/**
 * LSBステガノグラフィ: 最下位ビット埋込
 * Reiの中心-周囲パターンで言えば:
 * center値のLSBが「見えない近傍」として情報を運ぶ
 */
export function embedLSB(cover: number[], bits: number[], depth: number = 1): number[] {
  const result = [...cover];
  let bitIdx = 0;

  for (let i = 0; i < result.length && bitIdx < bits.length; i++) {
    for (let d = 0; d < depth && bitIdx < bits.length; d++) {
      const mask = ~(1 << d);
      result[i] = (Math.round(result[i]) & mask) | ((bits[bitIdx] & 1) << d);
      bitIdx++;
    }
  }

  return result;
}

/**
 * LSBステガノグラフィ: 抽出
 */
export function extractLSB(stego: number[], bitCount: number, depth: number = 1): number[] {
  const bits: number[] = [];
  let extracted = 0;

  for (let i = 0; i < stego.length && extracted < bitCount; i++) {
    for (let d = 0; d < depth && extracted < bitCount; d++) {
      bits.push((Math.round(stego[i]) >> d) & 1);
      extracted++;
    }
  }

  return bits;
}

// --- Spread Spectrum Steganography ---

/**
 * スペクトラム拡散ステガノグラフィ
 * 鍵(key)を使って情報を広範囲に分散埋込
 * 堅牢性が高い（攻撃耐性）
 */
export function embedSpread(
  cover: number[],
  bits: number[],
  key: number[]
): number[] {
  const result = [...cover];
  const strength = 0.5;

  for (let b = 0; b < bits.length; b++) {
    const bit = bits[b] * 2 - 1; // 0/1 → -1/+1
    for (let k = 0; k < key.length; k++) {
      const idx = (b * key.length + k) % result.length;
      const keyVal = key[k] * 2 - 1; // -1/+1
      result[idx] += bit * keyVal * strength;
    }
  }

  return result;
}

/**
 * スペクトラム拡散: 抽出
 */
export function extractSpread(
  stego: number[],
  bitCount: number,
  key: number[],
  original?: number[]
): number[] {
  const bits: number[] = [];
  const ref = original || new Array(stego.length).fill(0);

  for (let b = 0; b < bitCount; b++) {
    let sum = 0;
    for (let k = 0; k < key.length; k++) {
      const idx = (b * key.length + k) % stego.length;
      const diff = stego[idx] - (ref[idx] || 0);
      const keyVal = key[k] * 2 - 1;
      sum += diff * keyVal;
    }
    bits.push(sum > 0 ? 1 : 0);
  }

  return bits;
}

// --- Capacity & Quality Analysis ---

/** 埋込容量（ビット数） */
export function capacity(cover: number[] | string, method: StegoMethod = 'lsb'): number {
  if (typeof cover === 'string') {
    // テキスト: 文字間にゼロ幅文字を挿入可能
    return Math.max(0, cover.length - 1) * 8; // 各間に1バイト分
  }

  switch (method) {
    case 'lsb':
      return cover.length; // 1ビット/要素
    case 'spread':
      return Math.floor(cover.length / 4); // 4要素で1ビット
    case 'multidim':
      return Math.floor(cover.length / 2); // 周囲値に分散
    default:
      return cover.length;
  }
}

/** 検出可能性スコア [0=安全, 1=検出容易] */
export function detectability(cover: number[], stego: number[]): number {
  if (cover.length === 0) return 0;
  const n = Math.min(cover.length, stego.length);

  // 統計的差異の測定
  let sumDiffSq = 0;
  let sumCoverSq = 0;

  const coverMean = cover.reduce((a, b) => a + b, 0) / n;
  const stegoMean = stego.slice(0, n).reduce((a, b) => a + b, 0) / n;

  for (let i = 0; i < n; i++) {
    sumDiffSq += (cover[i] - stego[i]) ** 2;
    sumCoverSq += (cover[i] - coverMean) ** 2;
  }

  // 正規化差異
  const nrmse = sumCoverSq > 0
    ? Math.sqrt(sumDiffSq / n) / Math.sqrt(sumCoverSq / n)
    : 0;

  // ヒストグラム差異
  const bins = 16;
  const coverHist = histogram(cover, bins);
  const stegoHist = histogram(stego.slice(0, n), bins);
  let histDiff = 0;
  for (let i = 0; i < bins; i++) {
    histDiff += Math.abs(coverHist[i] - stegoHist[i]);
  }

  // 平均差異の絶対値
  const meanDiff = Math.abs(coverMean - stegoMean);
  const maxVal = Math.max(...cover.map(Math.abs), 1);
  const normalizedMeanDiff = meanDiff / maxVal;

  // 複合スコア
  return Math.min(1, (nrmse * 0.4 + histDiff * 0.4 + normalizedMeanDiff * 0.2));
}

/** PSNR (Peak Signal-to-Noise Ratio) in dB */
export function psnr(original: number[], modified: number[]): number {
  const n = Math.min(original.length, modified.length);
  if (n === 0) return Infinity;

  let mse = 0;
  for (let i = 0; i < n; i++) {
    mse += (original[i] - modified[i]) ** 2;
  }
  mse /= n;

  if (mse === 0) return Infinity;

  const maxVal = Math.max(...original.map(Math.abs), 1);
  return 10 * Math.log10((maxVal * maxVal) / mse);
}

/** 攻撃耐性テスト */
export function robustness(
  stego: number[],
  bits: number[],
  attack: AttackType,
  key?: number[]
): number {
  let attacked: number[];

  switch (attack) {
    case 'noise':
      attacked = stego.map(v => v + (Math.random() - 0.5) * 2);
      break;
    case 'crop':
      attacked = stego.slice(0, Math.floor(stego.length * 0.8));
      attacked.push(...new Array(stego.length - attacked.length).fill(0));
      break;
    case 'scale':
      attacked = stego.map(v => Math.round(v * 0.9));
      break;
    case 'quantize':
      attacked = stego.map(v => Math.round(v / 4) * 4);
      break;
    default:
      attacked = [...stego];
  }

  // 攻撃後に抽出
  const extracted = key
    ? extractSpread(attacked, bits.length, key, new Array(attacked.length).fill(0))
    : extractLSB(attacked, bits.length);

  // ビット一致率
  let matches = 0;
  for (let i = 0; i < Math.min(bits.length, extracted.length); i++) {
    if (bits[i] === extracted[i]) matches++;
  }

  return bits.length > 0 ? matches / bits.length : 1;
}

// --- Rei固有: 多次元数ステガノグラフィ ---

/**
 * 多次元数 [center; n₁,...,nₖ] の neighbor 値に情報を埋込
 * D-FUMTの「見えない次元」思想の直接実装
 */
export function embedMultiDim(
  center: number,
  neighbors: number[],
  secret: number[]
): MultiDimStego {
  const newNeighbors = [...neighbors];

  // 秘密情報をneighborsのLSBに埋込
  for (let i = 0; i < secret.length && i < newNeighbors.length; i++) {
    newNeighbors[i] = (Math.round(newNeighbors[i]) & ~1) | (secret[i] & 1);
  }

  return { center, neighbors: newNeighbors, hidden: true };
}

/**
 * 多次元数ステガノグラフィ: 抽出
 */
export function extractMultiDim(stego: MultiDimStego, bitCount?: number): number[] {
  const count = bitCount ?? stego.neighbors.length;
  return stego.neighbors.slice(0, count).map(n => Math.round(n) & 1);
}

// --- Utility Functions ---

function stringToBits(str: string): number[] {
  const bits: number[] = [];
  for (let i = 0; i < str.length; i++) {
    const code = str.charCodeAt(i);
    for (let b = 7; b >= 0; b--) {
      bits.push((code >> b) & 1);
    }
  }
  return bits;
}

function bitsToString(bits: number[]): string {
  let str = '';
  for (let i = 0; i + 7 < bits.length; i += 8) {
    let code = 0;
    for (let b = 0; b < 8; b++) {
      code = (code << 1) | (bits[i + b] & 1);
    }
    if (code > 0) str += String.fromCharCode(code);
  }
  return str;
}

function histogram(data: number[], bins: number): number[] {
  if (data.length === 0) return new Array(bins).fill(0);
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const hist = new Array(bins).fill(0);

  for (const v of data) {
    const bin = Math.min(Math.floor(((v - min) / range) * bins), bins - 1);
    hist[bin]++;
  }

  // 正規化
  const total = data.length;
  return hist.map(c => c / total);
}
