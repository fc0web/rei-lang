// ============================================================
// Rei (0₀式) stdlib — music module
// USFT (Universal Sound Formula Theory) +
// 音楽数理統一理論 (UMTM): 音楽構造の代数的操作
// ============================================================
// 核心的洞察:
// USFT: (音の層集合, ⊕) はアーベル群（可換的重畳）
// UMTM: 旋律・和声・リズムを統合する代数構造
//
// Reiの中心-周囲パターン:
//   center = 根音(root)
//   neighbors = 倍音・和音構成音・リズムパターン
//   compress = 楽曲→モチーフ→音程列→数列
// ============================================================

// --- Types ---

export interface Pitch {
  readonly midi: number;
  readonly name: string;
  readonly octave: number;
  readonly pitchClass: number;  // 0-11 (C=0, C#=1, ..., B=11)
}

export interface Interval {
  readonly semitones: number;
  readonly name: string;
  readonly quality: string;
}

export interface Chord {
  readonly pitches: number[];
  readonly root: number;
  readonly intervals: number[];
}

export type ScaleMode =
  | 'major' | 'minor' | 'dorian' | 'phrygian'
  | 'lydian' | 'mixolydian' | 'aeolian' | 'locrian'
  | 'pentatonic_major' | 'pentatonic_minor'
  | 'chromatic' | 'whole_tone';

export interface Scale {
  readonly root: number;
  readonly mode: ScaleMode;
  readonly pitches: number[];
  readonly pattern: number[];
}

export interface Rhythm {
  readonly durations: number[];
  readonly bpm: number;
  readonly totalBeats: number;
}

export type ChordQuality =
  | 'major' | 'minor' | 'diminished' | 'augmented'
  | 'dominant7' | 'major7' | 'minor7' | 'diminished7'
  | 'sus2' | 'sus4' | 'unknown';

// USFT 10基本層クラス
export type LayerType =
  | 'harmonic' | 'melodic' | 'rhythmic' | 'timbral'
  | 'envelope' | 'spatial' | 'noise' | 'symmetric'
  | 'fm' | 'linguistic';

export interface USFTLayers {
  readonly harmonic: number[];    // 倍音列
  readonly melodic: number[];     // 旋律輪郭
  readonly rhythmic: number[];    // リズムパターン
  readonly timbral: number[];     // 音色スペクトル
  readonly envelope: number[];    // ADSR包絡
  readonly spatial: number[];     // 空間情報
  readonly noise: number[];       // 雑音成分
  readonly symmetric: number[];   // 対称性パターン
  readonly fm: number[];          // 周波数変調成分
  readonly linguistic: number[];  // 言語的構造
}

export interface MusicalSymmetry {
  readonly retrograde: boolean;        // 逆行
  readonly inversion: boolean;         // 反行
  readonly retrogradeInversion: boolean; // 逆行反行
  readonly transposition: number | null; // 移調対称
  readonly palindrome: boolean;        // 回文
}

// --- Constants ---

const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

const INTERVAL_NAMES: Record<number, string> = {
  0: 'P1', 1: 'm2', 2: 'M2', 3: 'm3', 4: 'M3', 5: 'P4',
  6: 'TT', 7: 'P5', 8: 'm6', 9: 'M6', 10: 'm7', 11: 'M7', 12: 'P8',
};

const SCALE_PATTERNS: Record<ScaleMode, number[]> = {
  major:            [2, 2, 1, 2, 2, 2, 1],
  minor:            [2, 1, 2, 2, 1, 2, 2],
  dorian:           [2, 1, 2, 2, 2, 1, 2],
  phrygian:         [1, 2, 2, 2, 1, 2, 2],
  lydian:           [2, 2, 2, 1, 2, 2, 1],
  mixolydian:       [2, 2, 1, 2, 2, 1, 2],
  aeolian:          [2, 1, 2, 2, 1, 2, 2],
  locrian:          [1, 2, 2, 1, 2, 2, 2],
  pentatonic_major: [2, 2, 3, 2, 3],
  pentatonic_minor: [3, 2, 2, 3, 2],
  chromatic:        [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
  whole_tone:       [2, 2, 2, 2, 2, 2],
};

// --- Pitch ---

/** MIDI番号からPitchを作成 */
export function pitch(midi: number): Pitch {
  const pitchClass = ((midi % 12) + 12) % 12;
  const octave = Math.floor(midi / 12) - 1;
  return {
    midi,
    name: `${NOTE_NAMES[pitchClass]}${octave}`,
    octave,
    pitchClass,
  };
}

/** 音名からMIDI番号を取得 */
export function nameToMidi(name: string): number {
  const match = name.match(/^([A-G])(#|b)?(\d+)$/);
  if (!match) return -1;
  let pc = NOTE_NAMES.indexOf(match[1]);
  if (match[2] === '#') pc++;
  else if (match[2] === 'b') pc--;
  return ((parseInt(match[3]) + 1) * 12) + ((pc + 12) % 12);
}

/** 周波数変換 (A4 = 440Hz) */
export function midiToFreq(midi: number): number {
  return 440 * Math.pow(2, (midi - 69) / 12);
}

// --- Interval ---

/** 音程を作成 */
export function interval(semitones: number): Interval {
  const abs = Math.abs(semitones);
  const name = INTERVAL_NAMES[abs % 12] || `${abs}st`;
  const qualities: Record<string, string> = {
    P1: 'perfect', m2: 'minor', M2: 'major', m3: 'minor', M3: 'major',
    P4: 'perfect', TT: 'tritone', P5: 'perfect', m6: 'minor', M6: 'major',
    m7: 'minor', M7: 'major', P8: 'perfect',
  };
  return { semitones, name, quality: qualities[name] || 'other' };
}

// --- Chord ---

/** 和音を作成（中心-周囲パターン: root=center, intervals=neighbors） */
export function chord(pitches: number[]): Chord {
  if (pitches.length === 0) {
    return { pitches: [], root: 0, intervals: [] };
  }
  const sorted = [...pitches].sort((a, b) => a - b);
  const root = sorted[0];
  const intervals = sorted.slice(1).map(p => p - root);
  return { pitches: sorted, root, intervals };
}

/** 和音の性質を分析 */
export function analyzeChord(ch: Chord): ChordQuality {
  const itvs = ch.intervals.map(i => i % 12);
  const set = new Set(itvs);

  if (set.has(4) && set.has(7)) {
    if (set.has(11)) return 'major7';
    if (set.has(10)) return 'dominant7';
    return 'major';
  }
  if (set.has(3) && set.has(7)) {
    if (set.has(10)) return 'minor7';
    return 'minor';
  }
  if (set.has(3) && set.has(6)) {
    if (set.has(9)) return 'diminished7';
    return 'diminished';
  }
  if (set.has(4) && set.has(8)) return 'augmented';
  if (set.has(2) && set.has(7)) return 'sus2';
  if (set.has(5) && set.has(7)) return 'sus4';
  return 'unknown';
}

/** 移調 */
export function transpose(ch: Chord, semitones: number): Chord {
  return chord(ch.pitches.map(p => p + semitones));
}

/** 転回 */
export function invert(ch: Chord, n: number = 1): Chord {
  const ps = [...ch.pitches];
  for (let i = 0; i < n; i++) {
    const lowest = ps.shift()!;
    ps.push(lowest + 12);
  }
  return chord(ps);
}

/** 逆行（旋律の反転） */
export function retrograde(pitches: number[]): number[] {
  return [...pitches].reverse();
}

/** 反行（音程の上下反転） */
export function melodicInversion(pitches: number[], axis?: number): number[] {
  if (pitches.length === 0) return [];
  const ax = axis ?? pitches[0];
  return pitches.map(p => 2 * ax - p);
}

// --- Scale ---

/** 音階を作成 */
export function scale(root: number, mode: ScaleMode): Scale {
  const pattern = SCALE_PATTERNS[mode];
  const pitches = [root];
  let current = root;
  for (const step of pattern) {
    current += step;
    pitches.push(current);
  }
  return { root, mode, pitches, pattern };
}

/** 調性推定（最も一致する長調/短調を返す） */
export function detectKey(pitches: number[]): { key: number; mode: ScaleMode; confidence: number } {
  const pcs = new Set(pitches.map(p => ((p % 12) + 12) % 12));
  let bestKey = 0;
  let bestMode: ScaleMode = 'major';
  let bestScore = 0;

  for (let root = 0; root < 12; root++) {
    for (const mode of ['major', 'minor'] as ScaleMode[]) {
      const s = scale(root + 60, mode);
      const scalePcs = new Set(s.pitches.map(p => p % 12));
      let score = 0;
      for (const pc of pcs) {
        if (scalePcs.has(pc)) score++;
      }
      const confidence = pcs.size > 0 ? score / pcs.size : 0;
      if (confidence > bestScore) {
        bestScore = confidence;
        bestKey = root;
        bestMode = mode;
      }
    }
  }
  return { key: bestKey, mode: bestMode, confidence: bestScore };
}

/** ローマ数字分析 */
export function romanNumerals(progression: Chord[], key: number): string[] {
  const numerals = ['I', 'bII', 'II', 'bIII', 'III', 'IV', '#IV', 'V', 'bVI', 'VI', 'bVII', 'VII'];
  return progression.map(ch => {
    const degree = ((ch.root % 12) - (key % 12) + 12) % 12;
    const quality = analyzeChord(ch);
    const numeral = numerals[degree];
    if (quality === 'minor' || quality === 'minor7') return numeral.toLowerCase();
    if (quality === 'diminished' || quality === 'diminished7') return numeral.toLowerCase() + '°';
    if (quality === 'augmented') return numeral + '+';
    if (quality === 'dominant7') return numeral + '7';
    return numeral;
  });
}

// --- Rhythm (USFT 定理9.3: リズムの有理性) ---

/** リズムを作成 */
export function rhythm(durations: number[], bpm: number = 120): Rhythm {
  return {
    durations,
    bpm,
    totalBeats: durations.reduce((a, b) => a + b, 0),
  };
}

/** 定理9.3: 全てのリズム位置が有理数上にあるか検証 */
export function isRational(r: Rhythm): boolean {
  let pos = 0;
  for (const d of r.durations) {
    pos += d;
    // 有理数判定: 有限小数または循環小数
    // 実用的には十分な精度で有理数近似できるか
    const frac = pos * 10000;
    if (Math.abs(frac - Math.round(frac)) > 0.001) return false;
  }
  return true;
}

/** リズムの量子化（最近接グリッドに吸着） */
export function quantize(r: Rhythm, grid: number): Rhythm {
  const durations = r.durations.map(d => {
    const quantized = Math.round(d / grid) * grid;
    return quantized > 0 ? quantized : grid;
  });
  return rhythm(durations, r.bpm);
}

/** ポリリズム生成 */
export function polyrhythm(a: Rhythm, b: Rhythm): Rhythm {
  const totalA = a.totalBeats;
  const totalB = b.totalBeats;
  // LCMで統合
  const lcm = (totalA * totalB) / gcd(totalA, totalB);

  const events = new Set<number>();
  let pos = 0;
  for (const d of a.durations) { events.add(pos); pos += d * (lcm / totalA); }
  pos = 0;
  for (const d of b.durations) { events.add(pos); pos += d * (lcm / totalB); }

  const sorted = [...events].sort((a, b) => a - b);
  const durations: number[] = [];
  for (let i = 1; i < sorted.length; i++) {
    durations.push(sorted[i] - sorted[i - 1]);
  }
  durations.push(lcm - sorted[sorted.length - 1]);

  return rhythm(durations, a.bpm);
}

function gcd(a: number, b: number): number {
  a = Math.abs(a); b = Math.abs(b);
  while (b > 0.0001) { const t = b; b = a % b; a = t; }
  return a;
}

// --- USFT Layer Operations ---

/**
 * USFT 層分解
 * 音高列 → 10基本層に分解
 * （コンピュータ上での近似実装）
 */
export function decomposeLayers(pitches: number[]): USFTLayers {
  if (pitches.length === 0) {
    const empty = { harmonic: [], melodic: [], rhythmic: [], timbral: [],
      envelope: [], spatial: [], noise: [], symmetric: [], fm: [], linguistic: [] };
    return empty as USFTLayers;
  }

  // 倍音層: 基本周波数の整数倍
  const fundamental = Math.min(...pitches);
  const harmonic = pitches.map(p => {
    const ratio = midiToFreq(p) / midiToFreq(fundamental);
    return Math.round(ratio * 100) / 100;
  });

  // 旋律層: 隣接音程の列
  const melodic: number[] = [];
  for (let i = 1; i < pitches.length; i++) {
    melodic.push(pitches[i] - pitches[i - 1]);
  }

  // リズム層: 均等配置（デフォルト）
  const rhythmic = pitches.map(() => 1);

  // 音色層: ピッチクラス分布
  const timbral = new Array(12).fill(0);
  for (const p of pitches) timbral[((p % 12) + 12) % 12]++;

  // 包絡層: 正規化された位置
  const envelope = pitches.map((_, i) => {
    const t = pitches.length > 1 ? i / (pitches.length - 1) : 0;
    return Math.sin(t * Math.PI); // 単純なアーチ包絡
  });

  // 空間層: 左右パンニング
  const spatial = pitches.map((p) => ((p % 12) / 11) * 2 - 1);

  // 雑音層: 残差
  const noise = pitches.map(() => (Math.random() - 0.5) * 0.01);

  // 対称性層: 回文的パターン
  const half = Math.floor(pitches.length / 2);
  const symmetric = pitches.map((p, i) =>
    i < half ? pitches[pitches.length - 1 - i] - p : 0
  );

  // FM層: 変調パターン（基本周波数比）
  const fm = pitches.map((p, i) => {
    return i > 0 ? (midiToFreq(p) / midiToFreq(pitches[i - 1])) : 1;
  });

  // 言語層: テンション/リリースのパターン
  const linguistic = pitches.map((p, i) => {
    if (i === 0) return 0;
    const diff = p - pitches[i - 1];
    return diff > 0 ? 1 : diff < 0 ? -1 : 0; // 上行=1, 下行=-1, 同=0
  });

  return { harmonic, melodic, rhythmic, timbral, envelope, spatial,
           noise, symmetric, fm, linguistic };
}

/**
 * USFT 層重畳（アーベル群の⊕ˢ操作）
 * 可換性: superpose(a, b) = superpose(b, a)
 */
export function superpose(a: USFTLayers, b: USFTLayers): USFTLayers {
  const add = (x: number[], y: number[]): number[] => {
    const len = Math.max(x.length, y.length);
    return Array.from({ length: len }, (_, i) => (x[i] || 0) + (y[i] || 0));
  };

  return {
    harmonic: add(a.harmonic, b.harmonic),
    melodic: add(a.melodic, b.melodic),
    rhythmic: add(a.rhythmic, b.rhythmic),
    timbral: add(a.timbral, b.timbral),
    envelope: add(a.envelope, b.envelope),
    spatial: add(a.spatial, b.spatial),
    noise: add(a.noise, b.noise),
    symmetric: add(a.symmetric, b.symmetric),
    fm: add(a.fm, b.fm),
    linguistic: add(a.linguistic, b.linguistic),
  };
}

/** 特定層の抽出 */
export function extractLayer(layers: USFTLayers, type: LayerType): number[] {
  return layers[type];
}

// --- Musical Symmetry ---

/** 音楽的対称性の検出 */
export function detectSymmetry(pitches: number[]): MusicalSymmetry {
  if (pitches.length <= 1) {
    return { retrograde: true, inversion: true, retrogradeInversion: true,
             transposition: 0, palindrome: true };
  }

  // 音程列
  const intervals: number[] = [];
  for (let i = 1; i < pitches.length; i++) {
    intervals.push(pitches[i] - pitches[i - 1]);
  }

  const revIntervals = [...intervals].reverse();
  const invIntervals = intervals.map(i => -i);
  const riIntervals = [...invIntervals].reverse();

  const arrEq = (a: number[], b: number[]): boolean =>
    a.length === b.length && a.every((v, i) => v === b[i]);

  // 逆行: 逆順の音程列が一致
  const retro = arrEq(intervals, revIntervals);

  // 反行: 音程を反転した列が元と一致（移調を許容）
  const inv = arrEq(intervals, invIntervals);

  // 逆行反行
  const ri = arrEq(intervals, riIntervals);

  // 移調対称: 全体を移調すると元と一致するか
  let transpositionVal: number | null = null;
  for (let t = 1; t < 12; t++) {
    const transposed = pitches.map(p => ((p + t) % 12));
    const original = pitches.map(p => ((p % 12 + 12) % 12));
    if (arrEq(transposed.sort(), original.sort())) {
      transpositionVal = t;
      break;
    }
  }

  // 回文
  const palindrome = arrEq(pitches, [...pitches].reverse());

  return { retrograde: retro, inversion: inv, retrogradeInversion: ri,
           transposition: transpositionVal, palindrome };
}

// --- Compression Ratio (USFT 定理9.4: κ_s) ---

/**
 * 構造的圧縮率 κ_s（定理9.4）
 * 音楽の情報を最小限の規則で記述できる度合い
 * κ_s ~ 10³–10⁴ が音楽の典型値
 */
export function compressionRatio(pitches: number[]): number {
  if (pitches.length <= 1) return 1;

  // 元のデータ量
  const rawBits = pitches.length * 7; // 128 MIDI values → 7 bits each

  // 圧縮後の記述量（音程列 + 繰り返しパターン）
  const intervals: number[] = [];
  for (let i = 1; i < pitches.length; i++) {
    intervals.push(pitches[i] - pitches[i - 1]);
  }

  // ユニークな音程数
  const uniqueIntervals = new Set(intervals).size;

  // 繰り返しパターン検出（RLE的圧縮）
  let runCount = 1;
  for (let i = 1; i < intervals.length; i++) {
    if (intervals[i] !== intervals[i - 1]) runCount++;
  }

  // 圧縮記述量: ユニーク音程のテーブル + 参照列
  const compressedBits = uniqueIntervals * 5 + runCount * Math.ceil(Math.log2(uniqueIntervals + 1));

  return compressedBits > 0 ? rawBits / compressedBits : 1;
}
