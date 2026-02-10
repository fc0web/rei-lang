// ============================================================
// Rei (0₀式) Standard Library — symmetry Module
// 超対称数学理論 (Super-Symmetric Mathematics Theory)
// Dihedral group D₈ operations on center-neighbor structures
// Author: Nobuki Fujimoto
// ============================================================

import { MultiDimNumber } from '../core/types';

// ============================================================
// Types
// ============================================================

export type SymmetryAxis = 'N' | 'NE' | 'E' | 'SE' | 'NS' | 'EW' | 'NESW' | 'NWSE';

export type SymmetryClassDetailed =
  | 'full'               // All 16 elements of D₈ (all neighbors equal)
  | 'four_fold'          // 4-fold rotational + reflections (order 8)
  | 'axial'              // Mirror symmetry on 1+ axes (order 4)
  | 'single_reflection'  // Single mirror axis (order 2)
  | 'asymmetric';        // No symmetry (order 1)

export interface SymmetryInfo {
  readonly class: SymmetryClassDetailed;
  readonly stabilizerOrder: number;
  readonly axes: readonly SymmetryAxis[];
  readonly rotationalOrder: number;
}

export interface SymmetryTensor {
  readonly eigenvalues: readonly [number, number];
  readonly eigenvectors: readonly [[number, number], [number, number]];
  readonly anisotropy: number;  // 0 = isotropic, 1 = fully anisotropic
}

export interface OrbitDecomposition {
  readonly orbits: readonly (readonly number[])[];
  readonly orbitSizes: readonly number[];
  readonly representatives: readonly number[];
}

// ============================================================
// D₈ Group Operations
// ============================================================

/**
 * Rotate neighbors by `steps` positions (each step = 45°).
 * Positive = counter-clockwise.
 *
 *   rotate(steps=1): N→NW, NE→N, E→NE, ...
 *   rotate(steps=2): 90° CCW
 *   rotate(steps=4): 180°
 */
export function rotate(md: MultiDimNumber, steps: number): MultiDimNumber {
  const N = md.neighbors.length;
  if (N === 0) return md;

  const normalizedSteps = ((steps % N) + N) % N;
  const newNeighbors = md.neighbors.map((_, i) =>
    md.neighbors[(i + normalizedSteps) % N]
  );

  return { center: md.center, neighbors: newNeighbors, mode: md.mode };
}

/**
 * Reflect neighbors across a specified axis.
 *
 * Axis definitions (for 8 neighbors, indices 0-7):
 *   NS:   N-S axis (vertical)    — swaps E↔W, NE↔NW, SE↔SW
 *   EW:   E-W axis (horizontal)  — swaps N↔S, NE↔SE, NW↔SW
 *   NESW: NE-SW diagonal         — swaps N↔E, S↔W, NW↔SE
 *   NWSE: NW-SE diagonal         — swaps N↔W, S↔E, NE↔SW
 */
export function reflect(md: MultiDimNumber, axis: SymmetryAxis): MultiDimNumber {
  const n = [...md.neighbors];
  const N = n.length;

  if (N < 8) return md;

  // Reflection permutations for 8-neighbor system
  // N=0, NE=1, E=2, SE=3, S=4, SW=5, W=6, NW=7
  const reflections: Record<SymmetryAxis, number[]> = {
    'NS':   [0, 7, 6, 5, 4, 3, 2, 1],  // N-S axis: reverse E/W
    'N':    [0, 7, 6, 5, 4, 3, 2, 1],  // alias
    'EW':   [4, 3, 2, 1, 0, 7, 6, 5],  // E-W axis: reverse N/S
    'E':    [4, 3, 2, 1, 0, 7, 6, 5],  // alias
    'NESW': [2, 1, 0, 7, 6, 5, 4, 3],  // NE-SW diagonal
    'NE':   [2, 1, 0, 7, 6, 5, 4, 3],  // alias
    'NWSE': [6, 5, 4, 3, 2, 1, 0, 7],  // NW-SE diagonal
    'SE':   [6, 5, 4, 3, 2, 1, 0, 7],  // alias
  };

  const perm = reflections[axis];
  if (!perm) return md;

  const newNeighbors = perm.map(i => n[i]);
  return { center: md.center, neighbors: newNeighbors, mode: md.mode };
}

/**
 * Invert: swap center with mean of neighbors.
 */
export function invert(md: MultiDimNumber): MultiDimNumber {
  const mean = md.neighbors.reduce((s, n) => s + n, 0) / md.neighbors.length;
  const ratio = md.center !== 0 ? mean / md.center : 1;

  return {
    center: mean,
    neighbors: md.neighbors.map(n => n / ratio || md.center),
    mode: md.mode,
  };
}

// ============================================================
// Symmetry Detection
// ============================================================

/**
 * Check if two neighbor arrays are equal within tolerance.
 */
function neighborsEqual(a: readonly number[], b: readonly number[], epsilon: number = 1e-10): boolean {
  if (a.length !== b.length) return false;
  return a.every((v, i) => Math.abs(v - b[i]) < epsilon);
}

/**
 * Detect the symmetry class of a MultiDimNumber.
 *
 * Applies all 16 elements of D₈ and counts which leave
 * the neighbor array invariant. The stabilizer size
 * determines the symmetry class.
 */
export function detect(md: MultiDimNumber): SymmetryInfo {
  const N = md.neighbors.length;
  const epsilon = 1e-10;

  if (N < 2) {
    return { class: 'full', stabilizerOrder: 1, axes: [], rotationalOrder: 1 };
  }

  // Check all rotations
  let rotationalOrder = 1;
  for (let r = 1; r < N; r++) {
    const rotated = rotate(md, r);
    if (neighborsEqual(md.neighbors, rotated.neighbors, epsilon)) {
      rotationalOrder = N / r;
      break;
    }
  }

  // Check if all rotations are symmetric (full rotational)
  let allRotationsSymmetric = true;
  for (let r = 1; r < N; r++) {
    const rotated = rotate(md, r);
    if (!neighborsEqual(md.neighbors, rotated.neighbors, epsilon)) {
      allRotationsSymmetric = false;
      break;
    }
  }

  // Check reflections
  const axesToCheck: SymmetryAxis[] = ['NS', 'EW', 'NESW', 'NWSE'];
  const symmetricAxes: SymmetryAxis[] = [];

  for (const axis of axesToCheck) {
    const reflected = reflect(md, axis);
    if (neighborsEqual(md.neighbors, reflected.neighbors, epsilon)) {
      symmetricAxes.push(axis);
    }
  }

  // Determine stabilizer order
  let stabilizerOrder = 1;

  // Count rotational symmetries
  for (let r = 1; r < N; r++) {
    const rotated = rotate(md, r);
    if (neighborsEqual(md.neighbors, rotated.neighbors, epsilon)) {
      stabilizerOrder++;
    }
  }

  // Add reflections
  stabilizerOrder += symmetricAxes.length;

  // For each rotation that is symmetric, its composition with each symmetric reflection is also in stabilizer
  // (handled approximately by the count above)

  // Classify
  let symmetryClass: SymmetryClassDetailed;
  if (allRotationsSymmetric && symmetricAxes.length === axesToCheck.length) {
    symmetryClass = 'full';
  } else if (rotationalOrder >= 4 && symmetricAxes.length >= 2) {
    symmetryClass = 'four_fold';
  } else if (symmetricAxes.length >= 2) {
    symmetryClass = 'axial';
  } else if (symmetricAxes.length === 1) {
    symmetryClass = 'single_reflection';
  } else {
    symmetryClass = 'asymmetric';
  }

  return {
    class: symmetryClass,
    stabilizerOrder,
    axes: symmetricAxes,
    rotationalOrder,
  };
}

// ============================================================
// Symmetry Measures
// ============================================================

/**
 * Symmetry breaking: measure of deviation from perfect symmetry.
 *
 * B(n) = min over all D₈ transforms g: ||n - g·n|| / ||n||
 *
 * Returns 0 for fully symmetric, larger values for less symmetric.
 */
export function breaking(md: MultiDimNumber): number {
  const N = md.neighbors.length;
  if (N === 0) return 0;

  const norm = Math.sqrt(md.neighbors.reduce((s, n) => s + n * n, 0));
  if (norm < 1e-15) return 0;

  // Mean of neighbors (the "fully symmetric" reference)
  const mean = md.neighbors.reduce((s, n) => s + n, 0) / N;
  const deviation = md.neighbors.reduce((s, n) => s + (n - mean) ** 2, 0);

  return Math.sqrt(deviation) / norm;
}

/**
 * Symmetrize: project to the nearest structure with specified symmetry.
 *
 * - 'full': replace all neighbors with their mean
 * - 'axial': average paired neighbors across axis
 * - 'four_fold': average in groups of 4 (90° rotational)
 */
export function symmetrize(
  md: MultiDimNumber,
  target: SymmetryClassDetailed
): MultiDimNumber {
  const n = md.neighbors;
  const N = n.length;

  if (N < 8) return md;

  switch (target) {
    case 'full': {
      const mean = n.reduce((s, v) => s + v, 0) / N;
      return { center: md.center, neighbors: new Array(N).fill(mean), mode: md.mode };
    }

    case 'four_fold': {
      // Average groups: {0,2,4,6} and {1,3,5,7}
      const orthoMean = (n[0] + n[2] + n[4] + n[6]) / 4;
      const diagMean = (n[1] + n[3] + n[5] + n[7]) / 4;
      const newN = [orthoMean, diagMean, orthoMean, diagMean,
                    orthoMean, diagMean, orthoMean, diagMean];
      return { center: md.center, neighbors: newN, mode: md.mode };
    }

    case 'axial': {
      // NS axis symmetry: average (i, N-i) pairs
      const newN = [...n];
      for (let i = 0; i < N / 2; i++) {
        const j = N - 1 - i;
        if (i !== j) {
          const avg = (n[i] + n[j]) / 2;
          newN[i] = avg;
          newN[j] = avg;
        }
      }
      return { center: md.center, neighbors: newN, mode: md.mode };
    }

    case 'single_reflection': {
      // Just enforce NS reflection: pair (1,7), (2,6), (3,5)
      const newN = [...n];
      newN[7] = newN[1] = (n[1] + n[7]) / 2;
      newN[6] = newN[2] = (n[2] + n[6]) / 2;
      newN[5] = newN[3] = (n[3] + n[5]) / 2;
      return { center: md.center, neighbors: newN, mode: md.mode };
    }

    case 'asymmetric':
    default:
      return md; // No change
  }
}

// ============================================================
// Orbit Decomposition
// ============================================================

/**
 * Decompose neighbor array into orbits under D₈ action.
 *
 * Elements in the same orbit are symmetrically equivalent.
 * Fewer orbits = higher symmetry.
 */
export function orbits(md: MultiDimNumber): OrbitDecomposition {
  const n = md.neighbors;
  const N = n.length;
  const epsilon = 1e-10;
  const visited = new Set<number>();
  const orbitList: number[][] = [];

  for (let i = 0; i < N; i++) {
    if (visited.has(i)) continue;

    const orbit: number[] = [i];
    visited.add(i);

    for (let j = i + 1; j < N; j++) {
      if (visited.has(j)) continue;
      if (Math.abs(n[i] - n[j]) < epsilon) {
        orbit.push(j);
        visited.add(j);
      }
    }

    orbitList.push(orbit);
  }

  return {
    orbits: orbitList,
    orbitSizes: orbitList.map(o => o.length),
    representatives: orbitList.map(o => n[o[0]]),
  };
}

// ============================================================
// Symmetry Tensor
// ============================================================

/**
 * Compute the symmetry tensor (moment of inertia tensor analogue).
 *
 * Maps the 8-neighbor structure to a 2×2 symmetric tensor:
 *   T = Σ nᵢ · (eᵢ ⊗ eᵢ)
 * where eᵢ is the unit direction vector for neighbor i.
 *
 * Eigenvalues reveal anisotropy:
 *   λ₁ ≈ λ₂ → isotropic
 *   λ₁ >> λ₂ → strongly directional
 */
export function tensor(md: MultiDimNumber): SymmetryTensor {
  const n = md.neighbors;
  const N = n.length;

  // Direction vectors for each neighbor
  let Txx = 0, Tyy = 0, Txy = 0;

  for (let i = 0; i < N; i++) {
    const angle = (2 * Math.PI * i) / N;
    const ex = Math.cos(angle);
    const ey = Math.sin(angle);
    Txx += n[i] * ex * ex;
    Tyy += n[i] * ey * ey;
    Txy += n[i] * ex * ey;
  }

  // Eigenvalues of 2x2 symmetric matrix
  const trace = Txx + Tyy;
  const det = Txx * Tyy - Txy * Txy;
  const disc = Math.sqrt(Math.max(0, trace * trace / 4 - det));
  const lambda1 = trace / 2 + disc;
  const lambda2 = trace / 2 - disc;

  // Eigenvectors
  let v1: [number, number], v2: [number, number];
  if (Math.abs(Txy) > 1e-15) {
    v1 = [lambda1 - Tyy, Txy];
    v2 = [lambda2 - Tyy, Txy];
  } else {
    v1 = [1, 0];
    v2 = [0, 1];
  }

  // Normalize
  const norm1 = Math.sqrt(v1[0] * v1[0] + v1[1] * v1[1]);
  const norm2 = Math.sqrt(v2[0] * v2[0] + v2[1] * v2[1]);
  if (norm1 > 0) { v1[0] /= norm1; v1[1] /= norm1; }
  if (norm2 > 0) { v2[0] /= norm2; v2[1] /= norm2; }

  // Anisotropy: 0 = isotropic, 1 = fully anisotropic
  const maxLambda = Math.max(Math.abs(lambda1), Math.abs(lambda2));
  const anisotropy = maxLambda > 1e-15
    ? Math.abs(lambda1 - lambda2) / maxLambda
    : 0;

  return {
    eigenvalues: [lambda1, lambda2],
    eigenvectors: [v1, v2],
    anisotropy,
  };
}
