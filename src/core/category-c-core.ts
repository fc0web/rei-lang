// ============================================================
// Rei (0₀式) — Category C: Philosophical Foundations
// Language Core Implementation
//
// C1: 意識数理学 — Notation Equivalence Axiom (NEA)
// C2: 万物数理統一理論 (UMTE) — Domain System
// C3: 非数数学理論 (NNM) — Non-Numeric Primitives
// C4: 超数学再構築理論 (MMRT) — Non-Arithmetic Modes
// C5: 別数理構築理論 (AMRT) — Parallel Mode Execution
//
// Author: Nobuki Fujimoto
// Theory: D-FUMT Philosophical Foundations
// ============================================================

// ============================================================
// Shared Core Types
// ============================================================

export interface MultiDimNumber {
  readonly center: number;
  readonly neighbors: number[];
  readonly mode: ComputeMode;
  readonly domain?: Domain;       // C2: UMTE
}

// C4: MMRT — Extended 9-mode computation
export type ComputeMode =
  // Classic arithmetic modes (v0.1)
  | 'weighted' | 'multiplicative' | 'harmonic' | 'exponential'
  // Non-arithmetic modes (C4: MMRT)
  | 'topological' | 'ordinal' | 'categorical' | 'symbolic' | 'relational';

// C2: UMTE — Domain system
export type Domain =
  | 'image' | 'graph' | 'music' | 'physics'
  | 'text' | 'time' | 'network' | 'logic'
  | string;  // User-defined domains

// ============================================================
// C1: 意識数理学 — Notation Equivalence Axiom (NEA)
// ============================================================
// 4つの記法層は同一のASTに正規化される

export type NotationLayer = 'sensory' | 'dialogue' | 'structural' | 'semantic';

export interface ZeroExtension {
  readonly base: string;          // '0', 'π', 'e', etc.
  readonly subscripts: string[];  // ['o','o','o'] for 0ooo
}

/**
 * Parse zero-extension from sensory layer notation.
 * e.g. "0ooo" → { base: '0', subscripts: ['o','o','o'] }
 */
export function parseSensory(input: string): ZeroExtension | null {
  const match = input.match(/^([0πeφi])([oxzwensbua]+)$/);
  if (!match) return null;
  return {
    base: match[1],
    subscripts: match[2].split(''),
  };
}

/**
 * Parse zero-extension from dialogue layer notation.
 * e.g. "0_o3" → { base: '0', subscripts: ['o','o','o'] }
 */
export function parseDialogue(input: string): ZeroExtension | null {
  const match = input.match(/^([0πeφi])_([oxzwensbua])(\d+)$/);
  if (!match) return null;
  const char = match[2];
  const count = parseInt(match[3], 10);
  return {
    base: match[1],
    subscripts: Array(count).fill(char),
  };
}

/**
 * Parse zero-extension from structural layer notation.
 * e.g. "0(o,3)" → { base: '0', subscripts: ['o','o','o'] }
 */
export function parseStructural(input: string): ZeroExtension | null {
  const match = input.match(/^([0πeφi])\(([oxzwensbua]),(\d+)\)$/);
  if (!match) return null;
  const char = match[2];
  const count = parseInt(match[3], 10);
  return {
    base: match[1],
    subscripts: Array(count).fill(char),
  };
}

/**
 * Parse zero-extension from semantic layer notation.
 * e.g. '0{"sub":"o","degree":3}' → { base: '0', subscripts: ['o','o','o'] }
 */
export function parseSemantic(input: string): ZeroExtension | null {
  // Match base char followed by JSON object
  const baseMatch = input.match(/^([0πeφi])\{/);
  if (!baseMatch) return null;
  const base = baseMatch[1];
  const jsonStr = input.slice(base.length);
  try {
    const obj = JSON.parse(jsonStr);
    if (typeof obj.sub === 'string' && typeof obj.degree === 'number') {
      return {
        base,
        subscripts: Array(obj.degree).fill(obj.sub),
      };
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * NEA: Parse any of the 4 notation layers, returning the same canonical form.
 * sensory(M) ≡ dialogue(M) ≡ structural(M) ≡ semantic(M)
 */
export function parseZeroExtension(input: string): ZeroExtension | null {
  return parseSensory(input)
    ?? parseDialogue(input)
    ?? parseStructural(input)
    ?? parseSemantic(input);
}

/**
 * Detect which notation layer a string belongs to.
 */
export function detectLayer(input: string): NotationLayer | null {
  if (parseSensory(input)) return 'sensory';
  if (parseDialogue(input)) return 'dialogue';
  if (parseStructural(input)) return 'structural';
  if (parseSemantic(input)) return 'semantic';
  return null;
}

/**
 * Format a ZeroExtension into the specified notation layer.
 */
export function formatAs(ext: ZeroExtension, layer: NotationLayer): string {
  switch (layer) {
    case 'sensory':
      return ext.base + ext.subscripts.join('');
    case 'dialogue': {
      // Group consecutive same chars: ['o','o','o'] → "o3"
      // For mixed: ['o','o','x'] → need multiple segments
      const groups = groupSubscripts(ext.subscripts);
      if (groups.length === 1) {
        return `${ext.base}_${groups[0].char}${groups[0].count}`;
      }
      // Mixed subscripts fallback to sensory
      return ext.base + ext.subscripts.join('');
    }
    case 'structural': {
      const groups = groupSubscripts(ext.subscripts);
      if (groups.length === 1) {
        return `${ext.base}(${groups[0].char},${groups[0].count})`;
      }
      // Mixed: chain notation
      return groups.map(g => `${ext.base}(${g.char},${g.count})`).join('');
    }
    case 'semantic': {
      const groups = groupSubscripts(ext.subscripts);
      if (groups.length === 1) {
        return `${ext.base}{"sub":"${groups[0].char}","degree":${groups[0].count}}`;
      }
      return `${ext.base}{"subscripts":${JSON.stringify(ext.subscripts)}}`;
    }
  }
}

function groupSubscripts(subs: string[]): { char: string; count: number }[] {
  const groups: { char: string; count: number }[] = [];
  for (const s of subs) {
    if (groups.length > 0 && groups[groups.length - 1].char === s) {
      groups[groups.length - 1].count++;
    } else {
      groups.push({ char: s, count: 1 });
    }
  }
  return groups;
}

/**
 * NEA equivalence check: are two notation strings equivalent?
 */
export function notationEquivalent(a: string, b: string): boolean {
  const ea = parseZeroExtension(a);
  const eb = parseZeroExtension(b);
  if (!ea || !eb) return false;
  return ea.base === eb.base
    && ea.subscripts.length === eb.subscripts.length
    && ea.subscripts.every((s, i) => s === eb.subscripts[i]);
}


// ============================================================
// C2: 万物数理統一理論 (UMTE) — Domain System
// ============================================================

const STANDARD_DOMAINS: readonly Domain[] = [
  'image', 'graph', 'music', 'physics',
  'text', 'time', 'network', 'logic',
];

/**
 * Create a multi-dimensional number with a domain tag.
 */
export function withDomain(md: MultiDimNumber, domain: Domain): MultiDimNumber {
  return { ...md, domain };
}

/**
 * Check if a domain is one of the standard domains.
 */
export function isStandardDomain(d: string): d is Domain {
  return STANDARD_DOMAINS.includes(d as Domain);
}

/**
 * Cast a MultiDimNumber to a different domain.
 * The structure is preserved; interpretation changes.
 */
export function domainCast(md: MultiDimNumber, target: Domain): MultiDimNumber {
  return { ...md, domain: target };
}

/**
 * Domain-aware compute: delegates to domain-specific strategies.
 * The key insight of UMTE is that the SAME syntax (compute :weighted)
 * produces domain-appropriate results.
 */
export function domainCompute(
  md: MultiDimNumber,
  mode: ComputeMode,
): { value: number | object; domain: Domain | undefined; mode: ComputeMode } {
  const result = computeUnified(md, mode);
  return { value: result, domain: md.domain, mode };
}

/**
 * Get a human-readable description of what a compute mode means
 * in a specific domain. This is the UMTE mapping.
 */
export function domainSemantics(mode: ComputeMode, domain: Domain): string {
  const map: Record<string, Record<string, string>> = {
    weighted: {
      image: 'blur (spatial averaging)',
      graph: 'influence score (weighted centrality)',
      music: 'centroid frequency of chord',
      physics: 'temperature field smoothing',
    },
    topological: {
      image: 'connected component analysis',
      graph: 'adjacency structure (ignore weights)',
      music: 'interval class set',
      physics: 'phase topology',
    },
    ordinal: {
      image: 'rank filter (median-like)',
      graph: 'node ranking by degree',
      music: 'pitch ordering / contour',
      physics: 'thermodynamic ordering',
    },
  };
  return map[mode]?.[domain] ?? `${mode} in ${domain} domain`;
}


// ============================================================
// C3: 非数数学理論 (NNM) — Non-Numeric Primitives
// ============================================================

export type PrimitiveKind = 'numeric' | 'dot' | 'shape' | 'color' | 'sound';

/** The pre-numeric point ・ from Genesis Axiom System */
export interface Dot {
  readonly kind: 'dot';
}

/** Shape literal: a collection of points forming a geometric entity */
export interface Shape {
  readonly kind: 'shape';
  readonly type: '△' | '□' | '○' | '◇' | '☆';
  readonly vertices: number;
}

/** Color literal: center color with optional neighbor colors */
export interface ColorValue {
  readonly kind: 'color';
  readonly center: string;      // hex e.g. '#FF6B35'
  readonly neighbors: string[]; // hex values
}

/** Sound literal: frequency with parameters */
export interface SoundValue {
  readonly kind: 'sound';
  readonly frequency: number;      // Hz
  readonly waveform: string;       // 'sine', 'square', etc.
  readonly duration: number;       // seconds
}

/** Chord literal: collection of notes */
export interface ChordLiteral {
  readonly kind: 'chord';
  readonly notes: string[];        // ['C4', 'E4', 'G4']
}

export type NonNumericValue = Dot | Shape | ColorValue | SoundValue | ChordLiteral;

export function createDot(): Dot {
  return { kind: 'dot' };
}

export function createShape(type: Shape['type'], vertices: number): Shape {
  return { kind: 'shape', type, vertices };
}

export function createColor(center: string, neighbors: string[] = []): ColorValue {
  return { kind: 'color', center, neighbors };
}

export function createSound(frequency: number, waveform: string = 'sine', duration: number = 1.0): SoundValue {
  return { kind: 'sound', frequency, waveform, duration };
}

export function createChord(notes: string[]): ChordLiteral {
  return { kind: 'chord', notes };
}

/**
 * Detect the primitive kind of a value.
 */
export function primitiveKind(value: unknown): PrimitiveKind {
  if (typeof value === 'number') return 'numeric';
  if (typeof value === 'object' && value !== null && 'kind' in value) {
    const v = value as { kind: string };
    if (v.kind === 'dot') return 'dot';
    if (v.kind === 'shape') return 'shape';
    if (v.kind === 'color') return 'color';
    if (v.kind === 'sound' || v.kind === 'chord') return 'sound';
  }
  return 'numeric';
}

/**
 * Generalized center-neighbor pattern for non-numeric values.
 * C3 extends the fundamental Rei pattern beyond numbers.
 */
export interface GeneralizedMultiDim<T> {
  readonly center: T;
  readonly neighbors: T[];
  readonly domain?: Domain;
}

export function createGeneralizedMD<T>(center: T, neighbors: T[], domain?: Domain): GeneralizedMultiDim<T> {
  return { center, neighbors, domain };
}


// ============================================================
// C4: 超数学再構築理論 (MMRT) — Non-Arithmetic Compute Modes
// ============================================================

/** Topological result: only adjacency structure matters */
export interface TopologicalResult {
  readonly kind: 'topological';
  readonly degree: number;         // Number of neighbors
  readonly connectivity: number;   // 1.0 if all neighbors present, else fraction
  readonly hasCenter: boolean;     // Whether center is defined (not NaN/null)
}

/** Ordinal result: only ordering relations matter */
export interface OrdinalResult {
  readonly kind: 'ordinal';
  readonly rank: number;           // center's rank among all values [0,1]
  readonly below: number;          // count of neighbors < center
  readonly equal: number;          // count of neighbors == center
  readonly above: number;          // count of neighbors > center
}

/** Categorical result: morphism composition */
export interface CategoricalResult {
  readonly kind: 'categorical';
  readonly morphisms: number[];    // Differences: each neighbor - center
  readonly composed: number;       // Sum of all morphisms (composition)
  readonly identity: boolean;      // Is composed morphism ≈ 0?
}

/** Symbolic result: pattern classification */
export interface SymbolicResult {
  readonly kind: 'symbolic';
  readonly pattern: string;        // 'peak', 'valley', 'plateau', 'slope', 'mixed'
  readonly confidence: number;     // [0,1]
}

/** Relational result: relation predicates */
export interface RelationalResult {
  readonly kind: 'relational';
  readonly greater: number[];      // Indices of neighbors where center > neighbor
  readonly equal: number[];        // Indices where center == neighbor
  readonly less: number[];         // Indices where center < neighbor
  readonly dominance: number;      // Fraction of neighbors that center dominates [0,1]
}

export type NonArithmeticResult =
  | TopologicalResult | OrdinalResult | CategoricalResult
  | SymbolicResult | RelationalResult;

/**
 * Topological compute: only adjacency structure, values ignored.
 */
export function computeTopological(md: MultiDimNumber): TopologicalResult {
  const maxNeighbors = 8; // Standard 8-neighbor model
  return {
    kind: 'topological',
    degree: md.neighbors.length,
    connectivity: md.neighbors.length / maxNeighbors,
    hasCenter: !isNaN(md.center) && md.center !== null,
  };
}

/**
 * Ordinal compute: only ordering relations, magnitude ignored.
 */
export function computeOrdinal(md: MultiDimNumber): OrdinalResult {
  const c = md.center;
  let below = 0, equal = 0, above = 0;
  for (const n of md.neighbors) {
    if (n < c) below++;
    else if (n === c) equal++;
    else above++;
  }
  const total = md.neighbors.length;
  return {
    kind: 'ordinal',
    rank: total > 0 ? below / total : 0.5,
    below, equal, above,
  };
}

/**
 * Categorical compute: treat neighbor→center as morphisms.
 * Each morphism is (neighbor - center). Composition is sum.
 */
export function computeCategorical(md: MultiDimNumber): CategoricalResult {
  const morphisms = md.neighbors.map(n => n - md.center);
  const composed = morphisms.reduce((a, b) => a + b, 0);
  return {
    kind: 'categorical',
    morphisms,
    composed,
    identity: Math.abs(composed) < 1e-10,
  };
}

/**
 * Symbolic compute: classify the center-neighbor pattern.
 */
export function computeSymbolic(md: MultiDimNumber): SymbolicResult {
  if (md.neighbors.length === 0) {
    return { kind: 'symbolic', pattern: 'isolated', confidence: 1.0 };
  }
  const c = md.center;
  const allBelow = md.neighbors.every(n => n < c);
  const allAbove = md.neighbors.every(n => n > c);
  const allEqual = md.neighbors.every(n => Math.abs(n - c) < 1e-10);

  if (allBelow) return { kind: 'symbolic', pattern: 'peak', confidence: 1.0 };
  if (allAbove) return { kind: 'symbolic', pattern: 'valley', confidence: 1.0 };
  if (allEqual) return { kind: 'symbolic', pattern: 'plateau', confidence: 1.0 };

  // Partial pattern detection
  const belowCount = md.neighbors.filter(n => n < c).length;
  const ratio = belowCount / md.neighbors.length;
  if (ratio > 0.75) return { kind: 'symbolic', pattern: 'peak', confidence: ratio };
  if (ratio < 0.25) return { kind: 'symbolic', pattern: 'valley', confidence: 1 - ratio };

  // Check monotonic slope (neighbors sorted by position)
  const diffs = md.neighbors.map(n => n - c);
  const increasing = diffs.every((d, i) => i === 0 || d >= diffs[i - 1]);
  const decreasing = diffs.every((d, i) => i === 0 || d <= diffs[i - 1]);
  if (increasing || decreasing) {
    return { kind: 'symbolic', pattern: 'slope', confidence: 0.8 };
  }

  return { kind: 'symbolic', pattern: 'mixed', confidence: 0.5 };
}

/**
 * Relational compute: enumerate all relation predicates.
 */
export function computeRelational(md: MultiDimNumber): RelationalResult {
  const greater: number[] = [];
  const equal: number[] = [];
  const less: number[] = [];
  md.neighbors.forEach((n, i) => {
    if (md.center > n) greater.push(i);
    else if (md.center === n) equal.push(i);
    else less.push(i);
  });
  return {
    kind: 'relational',
    greater, equal, less,
    dominance: md.neighbors.length > 0 ? greater.length / md.neighbors.length : 0,
  };
}


// ============================================================
// C5: 別数理構築理論 (AMRT) — Parallel Mode Execution
// ============================================================

/** Result of parallel computation across multiple modes */
export interface ParallelResult<T = number | NonArithmeticResult> {
  readonly kind: 'parallel';
  readonly results: Record<string, T>;
  readonly modes: ComputeMode[];
}

/**
 * Execute multiple compute modes in parallel.
 * AMRT: "For every problem, multiple correct solutions exist."
 */
export function parallelCompute(
  md: MultiDimNumber,
  modes: ComputeMode[],
): ParallelResult {
  const results: Record<string, number | NonArithmeticResult> = {};
  for (const mode of modes) {
    results[mode] = computeUnified(md, mode);
  }
  return { kind: 'parallel', results, modes };
}

/**
 * Compute ALL modes (the complete AMRT perspective).
 */
export function computeAll(md: MultiDimNumber): ParallelResult {
  const allModes: ComputeMode[] = [
    'weighted', 'multiplicative', 'harmonic', 'exponential',
    'topological', 'ordinal', 'categorical', 'symbolic', 'relational',
  ];
  return parallelCompute(md, allModes);
}

/** Fork: split data into multiple processing paths */
export interface ForkResult<T = number | NonArithmeticResult> {
  readonly kind: 'fork';
  readonly branches: Record<string, T>;
}

export function fork(
  md: MultiDimNumber,
  branches: Record<string, (md: MultiDimNumber) => number | NonArithmeticResult>,
): ForkResult {
  const results: Record<string, number | NonArithmeticResult> = {};
  for (const [name, fn] of Object.entries(branches)) {
    results[name] = fn(md);
  }
  return { kind: 'fork', branches: results };
}

/** Join strategies for combining parallel results */
export type JoinStrategy = 'best' | 'consensus' | 'all' | 'first';

/**
 * Join: combine multiple numeric results.
 */
export function join(
  results: Record<string, number | NonArithmeticResult>,
  strategy: JoinStrategy,
): number | NonArithmeticResult | Record<string, number | NonArithmeticResult> {
  const numericEntries = Object.entries(results).filter(
    ([, v]) => typeof v === 'number'
  ) as [string, number][];

  switch (strategy) {
    case 'first':
      return numericEntries.length > 0 ? numericEntries[0][1] : results[Object.keys(results)[0]];
    case 'consensus': {
      if (numericEntries.length === 0) return results[Object.keys(results)[0]];
      const values = numericEntries.map(([, v]) => v);
      values.sort((a, b) => a - b);
      const mid = Math.floor(values.length / 2);
      return values.length % 2 !== 0
        ? values[mid]
        : (values[mid - 1] + values[mid]) / 2;
    }
    case 'best': {
      // "Best" for numeric: minimum absolute value (closest to equilibrium)
      if (numericEntries.length === 0) return results[Object.keys(results)[0]];
      return numericEntries.reduce((a, b) => Math.abs(a[1]) <= Math.abs(b[1]) ? a : b)[1];
    }
    case 'all':
      return results;
  }
}

/**
 * Divergence: measure how different parallel results are.
 * Returns pairwise divergence for numeric results.
 */
export function divergence(
  results: Record<string, number | NonArithmeticResult>,
): Record<string, number | string> {
  const entries = Object.entries(results);
  const out: Record<string, number | string> = {};
  for (let i = 0; i < entries.length; i++) {
    for (let j = i + 1; j < entries.length; j++) {
      const key = `${entries[i][0]}_vs_${entries[j][0]}`;
      const a = entries[i][1];
      const b = entries[j][1];
      if (typeof a === 'number' && typeof b === 'number') {
        out[key] = Math.abs(a - b);
      } else {
        out[key] = 'incomparable';
      }
    }
  }
  return out;
}

/**
 * Consensus: find the central tendency of numeric parallel results.
 */
export function consensus(
  results: Record<string, number | NonArithmeticResult>,
): number | null {
  const numerics = Object.values(results).filter((v): v is number => typeof v === 'number');
  if (numerics.length === 0) return null;
  return numerics.reduce((a, b) => a + b, 0) / numerics.length;
}


// ============================================================
// Unified Compute: single entry point for all 9 modes
// ============================================================

/**
 * Core compute function that handles all 9 modes.
 * Arithmetic modes return number, non-arithmetic modes return typed results.
 */
export function computeUnified(
  md: MultiDimNumber,
  mode: ComputeMode,
): number | NonArithmeticResult {
  switch (mode) {
    // Arithmetic modes (v0.1)
    case 'weighted':
      return computeWeighted(md);
    case 'multiplicative':
      return computeMultiplicative(md);
    case 'harmonic':
      return computeHarmonic(md);
    case 'exponential':
      return computeExponential(md);
    // Non-arithmetic modes (C4: MMRT)
    case 'topological':
      return computeTopological(md);
    case 'ordinal':
      return computeOrdinal(md);
    case 'categorical':
      return computeCategorical(md);
    case 'symbolic':
      return computeSymbolic(md);
    case 'relational':
      return computeRelational(md);
  }
}

// ============================================================
// Classic Arithmetic Compute (for completeness)
// ============================================================

function computeWeighted(md: MultiDimNumber): number {
  if (md.neighbors.length === 0) return md.center;
  const sum = md.neighbors.reduce((a, b) => a + b, 0);
  return (md.center + sum) / (1 + md.neighbors.length);
}

function computeMultiplicative(md: MultiDimNumber): number {
  if (md.neighbors.length === 0) return md.center;
  return md.neighbors.reduce((a, b) => a * b, md.center);
}

function computeHarmonic(md: MultiDimNumber): number {
  const all = [md.center, ...md.neighbors];
  const nonZero = all.filter(v => v !== 0);
  if (nonZero.length === 0) return 0;
  const recipSum = nonZero.reduce((a, b) => a + 1 / b, 0);
  return nonZero.length / recipSum;
}

function computeExponential(md: MultiDimNumber): number {
  const all = [md.center, ...md.neighbors];
  const expSum = all.reduce((a, b) => a + Math.exp(b), 0);
  return Math.log(expSum / all.length);
}
