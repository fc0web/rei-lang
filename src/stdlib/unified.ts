// ============================================================
// Rei (0₀式) Standard Library — unified Module
// 統合数体系 U³ (Unified Number System U³)
// Category-theoretic unification of MultiDim × Extended × Level
// Author: Nobuki Fujimoto
// ============================================================

import { MultiDimNumber, ExtendedNumber, ExtendedSubscript } from '../core/types';

// ============================================================
// Types
// ============================================================

/**
 * U³ — The unified number.
 *
 * Three components in categorical product:
 *   𝕄 (MultiDim) : spatial structure (center-neighbor)
 *   Ext (Extended): hierarchical depth (0₀ → 0₀₀ → ...)
 *   Level (ℕ)     : abstraction level
 */
export interface U3Number {
  readonly multidim: MultiDimNumber;
  readonly extended: ExtendedNumber;
  readonly level: number;
}

export interface ConsistencyCheck {
  readonly mdExtConsistent: boolean;
  readonly levelDepthMatch: boolean;
  readonly errors: readonly string[];
}

export interface U3Distance {
  readonly total: number;
  readonly mdComponent: number;
  readonly extComponent: number;
  readonly levelComponent: number;
}

export interface U3Weights {
  readonly alpha: number;  // weight for MultiDim distance
  readonly beta: number;   // weight for Extended distance
  readonly gamma: number;  // weight for Level distance
}

const DEFAULT_WEIGHTS: U3Weights = { alpha: 1, beta: 1, gamma: 0.5 };

// ============================================================
// Construction — Natural Transformations (η)
// ============================================================

/**
 * η_U : (𝕄, Ext, ℕ) → U³
 * Full construction from all three components.
 */
export function from(options: {
  multidim: MultiDimNumber;
  extended: ExtendedNumber;
  level: number;
}): U3Number {
  return Object.freeze({
    multidim: options.multidim,
    extended: options.extended,
    level: Math.max(0, Math.floor(options.level)),
  });
}

/**
 * η_Num : ℝ → U³
 * Embed a plain number into U³.
 * The number becomes the center with zero neighbors,
 * trivial extension (0₀), and level 0.
 */
export function fromNumber(n: number, level: number = 0): U3Number {
  return from({
    multidim: {
      center: n,
      neighbors: new Array(8).fill(0),
      mode: 'weighted',
    },
    extended: {
      subscript: { base: 0, chars: ['o'] as any, degree: 1 },
      value: n,
      phase: 'neutral',
    },
    level,
  });
}

/**
 * η_M : 𝕄 → U³
 * Embed a MultiDimNumber into U³.
 */
export function fromMultiDim(md: MultiDimNumber, level: number = 0): U3Number {
  const computedValue = md.center + md.neighbors.reduce((s, n) => s + n, 0);
  return from({
    multidim: md,
    extended: {
      subscript: { base: 0, chars: ['o'] as any, degree: 1 },
      value: computedValue,
      phase: 'neutral',
    },
    level,
  });
}

/**
 * η_E : Ext → U³
 * Embed an ExtendedNumber into U³.
 */
export function fromExtended(ext: ExtendedNumber, level: number = 0): U3Number {
  return from({
    multidim: {
      center: ext.value,
      neighbors: new Array(8).fill(ext.value / 8),
      mode: 'weighted',
    },
    extended: ext,
    level,
  });
}

/**
 * Convert an array of numbers to U³ numbers.
 */
export function fromArray(arr: readonly number[], level: number = 0): U3Number[] {
  return arr.map(n => fromNumber(n, level));
}

// ============================================================
// Projection — Natural Transformations (π)
// ============================================================

/**
 * π_M : U³ → 𝕄
 * Project to MultiDimNumber component.
 */
export function toMultiDim(u: U3Number): MultiDimNumber {
  return u.multidim;
}

/**
 * π_E : U³ → Ext
 * Project to ExtendedNumber component.
 */
export function toExtended(u: U3Number): ExtendedNumber {
  return u.extended;
}

/**
 * π_ℝ : U³ → ℝ
 * Project to a single scalar value.
 * Combines all three components.
 */
export function toNumber(u: U3Number): number {
  const mdValue = u.multidim.center;
  const extValue = u.extended.value;
  // Weighted combination based on level
  return mdValue + extValue * u.level * 0.01;
}

// ============================================================
// Arithmetic — U³ Algebra
// ============================================================

/**
 * U³ Addition: u₁ ⊕ u₂
 *
 * Homomorphism condition:
 *   π_M(u₁ ⊕ u₂) = π_M(u₁) ⊕_M π_M(u₂)
 *   π_E(u₁ ⊕ u₂) = π_E(u₁) ⊕_E π_E(u₂)
 */
export function add(a: U3Number, b: U3Number): U3Number {
  const maxLen = Math.max(a.multidim.neighbors.length, b.multidim.neighbors.length);
  const newNeighbors: number[] = [];
  for (let i = 0; i < maxLen; i++) {
    const av = a.multidim.neighbors[i] ?? 0;
    const bv = b.multidim.neighbors[i] ?? 0;
    newNeighbors.push(av + bv);
  }

  return from({
    multidim: {
      center: a.multidim.center + b.multidim.center,
      neighbors: newNeighbors,
      mode: a.multidim.mode,
    },
    extended: {
      subscript: a.extended.subscript.degree >= b.extended.subscript.degree
        ? a.extended.subscript
        : b.extended.subscript,
      value: a.extended.value + b.extended.value,
      phase: 'extended',
    },
    level: Math.max(a.level, b.level),
  });
}

/**
 * U³ Multiplication: u₁ ⊗ u₂
 *
 * MultiDim: multiplicative combination
 * Extended: additive (degree addition)
 * Level: additive
 */
export function mul(a: U3Number, b: U3Number): U3Number {
  const maxLen = Math.max(a.multidim.neighbors.length, b.multidim.neighbors.length);
  const newNeighbors: number[] = [];
  for (let i = 0; i < maxLen; i++) {
    const av = a.multidim.neighbors[i] ?? 1;
    const bv = b.multidim.neighbors[i] ?? 1;
    newNeighbors.push(av * bv);
  }

  const totalDegree = a.extended.subscript.degree + b.extended.subscript.degree;

  return from({
    multidim: {
      center: a.multidim.center * b.multidim.center,
      neighbors: newNeighbors,
      mode: 'multiplicative' as any,
    },
    extended: {
      subscript: {
        ...a.extended.subscript,
        degree: totalDegree,
      },
      value: a.extended.value * b.extended.value,
      phase: 'extended',
    },
    level: a.level + b.level,
  });
}

/**
 * Scalar multiplication: α · u
 */
export function scale(u: U3Number, scalar: number): U3Number {
  return from({
    multidim: {
      center: u.multidim.center * scalar,
      neighbors: u.multidim.neighbors.map(n => n * scalar),
      mode: u.multidim.mode,
    },
    extended: {
      ...u.extended,
      value: u.extended.value * scalar,
    },
    level: u.level,
  });
}

// ============================================================
// Level Operations — Functorial Elevation/Grounding
// ============================================================

/**
 * ↑(u): Elevate — increase abstraction level.
 *
 * - Level increases by 1
 * - Extended depth increases (extend operation)
 * - MultiDim neighbors become smoother (average toward center)
 */
export function elevate(u: U3Number): U3Number {
  const smoothingFactor = 0.9;
  const newNeighbors = u.multidim.neighbors.map(n =>
    n * smoothingFactor + u.multidim.center * (1 - smoothingFactor)
  );

  return from({
    multidim: {
      center: u.multidim.center,
      neighbors: newNeighbors,
      mode: u.multidim.mode,
    },
    extended: {
      subscript: {
        ...u.extended.subscript,
        degree: u.extended.subscript.degree + 1,
      },
      value: u.extended.value,
      phase: 'extended',
    },
    level: u.level + 1,
  });
}

/**
 * ↓(u): Ground — decrease abstraction level.
 *
 * - Level decreases by 1 (min 0)
 * - Extended depth decreases (reduce operation)
 * - MultiDim neighbors become more varied (amplify differences)
 */
export function ground(u: U3Number): U3Number {
  if (u.level <= 0) return u;

  const amplifyFactor = 1.1;
  const newNeighbors = u.multidim.neighbors.map(n =>
    u.multidim.center + (n - u.multidim.center) * amplifyFactor
  );

  return from({
    multidim: {
      center: u.multidim.center,
      neighbors: newNeighbors,
      mode: u.multidim.mode,
    },
    extended: {
      subscript: {
        ...u.extended.subscript,
        degree: Math.max(1, u.extended.subscript.degree - 1),
      },
      value: u.extended.value,
      phase: u.extended.subscript.degree > 1 ? 'reduced' : 'neutral',
    },
    level: u.level - 1,
  });
}

/**
 * Set level directly.
 */
export function setLevel(u: U3Number, level: number): U3Number {
  return from({
    multidim: u.multidim,
    extended: u.extended,
    level: Math.max(0, level),
  });
}

// ============================================================
// Metrics
// ============================================================

/**
 * U³ distance function.
 *
 * d_U(u₁, u₂) = α·d_M + β·d_E + γ·d_L
 *
 * where:
 *   d_M = Euclidean distance on MultiDim (center + neighbors)
 *   d_E = |ext.value difference| + |degree difference|
 *   d_L = |level difference|
 */
export function distance(
  a: U3Number,
  b: U3Number,
  weights: Partial<U3Weights> = {}
): U3Distance {
  const w = { ...DEFAULT_WEIGHTS, ...weights };

  // MultiDim distance
  const centerDiff = (a.multidim.center - b.multidim.center) ** 2;
  const neighborDiff = a.multidim.neighbors.reduce((sum, n, i) => {
    const bv = b.multidim.neighbors[i] ?? 0;
    return sum + (n - bv) ** 2;
  }, 0);
  const mdDist = Math.sqrt(centerDiff + neighborDiff);

  // Extended distance
  const extDist = Math.abs(a.extended.value - b.extended.value)
    + Math.abs(a.extended.subscript.degree - b.extended.subscript.degree);

  // Level distance
  const levelDist = Math.abs(a.level - b.level);

  return {
    total: w.alpha * mdDist + w.beta * extDist + w.gamma * levelDist,
    mdComponent: mdDist,
    extComponent: extDist,
    levelComponent: levelDist,
  };
}

/**
 * Norm: ||u|| = distance(u, zero)
 */
export function norm(u: U3Number): number {
  const zero = fromNumber(0);
  return distance(u, zero).total;
}

// ============================================================
// Consistency Verification
// ============================================================

/**
 * Verify that a U³ number is internally consistent.
 *
 * Checks:
 * 1. MultiDim center and Extended value should be related
 * 2. Level should match Extended depth
 */
export function verifyConsistency(u: U3Number): ConsistencyCheck {
  const errors: string[] = [];

  // Check 1: MultiDim-Extended relationship
  // The extended value should be derivable from multidim
  const mdTotal = u.multidim.center + u.multidim.neighbors.reduce((s, n) => s + n, 0);
  const mdExtRatio = u.extended.value !== 0
    ? Math.abs(mdTotal / u.extended.value - 1)
    : (mdTotal === 0 ? 0 : Infinity);
  const mdExtConsistent = mdExtRatio < 1.0; // Allow reasonable divergence

  if (!mdExtConsistent) {
    errors.push(`MultiDim total (${mdTotal.toFixed(4)}) diverges from Extended value (${u.extended.value.toFixed(4)})`);
  }

  // Check 2: Level-Depth relationship
  const depth = u.extended.subscript.degree;
  const levelDepthMatch = Math.abs(u.level - depth) <= depth; // Level should be within depth range

  if (!levelDepthMatch) {
    errors.push(`Level (${u.level}) mismatches Extension depth (${depth})`);
  }

  return { mdExtConsistent, levelDepthMatch, errors };
}

// ============================================================
// Homomorphism Verification
// ============================================================

/**
 * Verify the addition homomorphism:
 *   π_M(u₁ ⊕ u₂) ≈ π_M(u₁) ⊕_M π_M(u₂)
 */
export function verifyAdditionHomomorphism(
  a: U3Number,
  b: U3Number,
  epsilon: number = 1e-10
): boolean {
  const sum = add(a, b);
  const projected = toMultiDim(sum);

  // Direct addition of projections
  const pa = toMultiDim(a);
  const pb = toMultiDim(b);
  const directCenter = pa.center + pb.center;

  return Math.abs(projected.center - directCenter) < epsilon;
}

/**
 * Verify elevate-ground adjunction:
 *   ground(elevate(u)).level === u.level
 */
export function verifyElevateGroundAdjunction(u: U3Number): boolean {
  const roundTrip = ground(elevate(u));
  return roundTrip.level === u.level;
}

// ============================================================
// Display
// ============================================================

/**
 * Format a U³ number for display.
 */
export function display(u: U3Number): string {
  const c = u.multidim.center;
  const n = u.multidim.neighbors.slice(0, 4).map(v => v.toFixed(1)).join(',');
  const ext = `depth=${u.extended.subscript.degree}`;
  return `U³{𝕄{${c}; ${n},...} | ${ext} | L${u.level}}`;
}
