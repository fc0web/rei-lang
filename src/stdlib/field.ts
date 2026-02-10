// ============================================================
// Rei (0₀式) Standard Library — field Module
// 情報場数学理論 (Information Field Mathematics Theory)
// Discrete differential operators on center-neighbor structures
// Author: Nobuki Fujimoto
// ============================================================

import { MultiDimNumber } from '../core/types';

// ============================================================
// Types
// ============================================================

export interface GradientResult {
  readonly dx: number;        // ∂F/∂x (East-West)
  readonly dy: number;        // ∂F/∂y (North-South)
  readonly magnitude: number; // |∇F|
  readonly direction: number; // atan2(dy, dx) in radians
}

export interface FieldGrid {
  readonly width: number;
  readonly height: number;
  readonly points: MultiDimNumber[][];
}

export interface PoissonOptions {
  readonly maxIterations?: number;
  readonly tolerance?: number;
  readonly boundary?: 'dirichlet' | 'neumann' | 'periodic';
}

// ============================================================
// Single-Point Operators
// ============================================================

/**
 * Gradient: ∇F at a single point.
 *
 * Uses central differences from the 8-neighbor structure:
 *   dx = (E - W) / 2
 *   dy = (N - S) / 2
 *
 * Diagonal neighbors contribute to both components:
 *   dx += (NE + SE - NW - SW) / (4√2)
 *   dy += (NE + NW - SE - SW) / (4√2)
 *
 * Neighbor mapping: N=0, NE=1, E=2, SE=3, S=4, SW=5, W=6, NW=7
 */
export function gradient(md: MultiDimNumber): GradientResult {
  const n = md.neighbors;
  if (n.length < 8) {
    // Fallback for fewer than 8 neighbors
    const dx = n.length >= 3 ? (n[2] - (n[6] ?? n[0])) / 2 : 0;
    const dy = n.length >= 1 ? (n[0] - (n[4] ?? 0)) / 2 : 0;
    const magnitude = Math.sqrt(dx * dx + dy * dy);
    return { dx, dy, magnitude, direction: Math.atan2(dy, dx) };
  }

  const SQRT2_INV = 1 / (2 * Math.SQRT2);

  // Orthogonal contributions
  let dx = (n[2] - n[6]) / 2;  // (E - W) / 2
  let dy = (n[0] - n[4]) / 2;  // (N - S) / 2

  // Diagonal contributions
  dx += (n[1] + n[3] - n[5] - n[7]) * SQRT2_INV;
  dy += (n[1] + n[7] - n[3] - n[5]) * SQRT2_INV;

  const magnitude = Math.sqrt(dx * dx + dy * dy);
  const direction = Math.atan2(dy, dx);

  return { dx, dy, magnitude, direction };
}

/**
 * Divergence: div F at a single point.
 *
 * div F = ∂Fx/∂x + ∂Fy/∂y
 *       ≈ (E - 2c + W) + (N - 2c + S)
 *
 * Positive = source (outflow from center)
 * Negative = sink (inflow to center)
 * Zero = equilibrium
 */
export function divergence(md: MultiDimNumber): number {
  const n = md.neighbors;
  const c = md.center;

  if (n.length < 5) {
    return n.reduce((sum, v) => sum + (v - c), 0);
  }

  // Orthogonal: (N - 2c + S) + (E - 2c + W)
  const ortho = (n[0] - 2 * c + n[4]) + (n[2] - 2 * c + n[6]);

  // Diagonal contribution (weighted by 1/2 due to √2 distance)
  const diag = ((n[1] - 2 * c + n[5]) + (n[3] - 2 * c + n[7])) * 0.5;

  return ortho + diag;
}

/**
 * Curl: rot F at a single point.
 *
 * Measures net circulation around the center.
 * Computed as the signed sum of neighbor differences
 * traversed counter-clockwise.
 *
 * Positive = counter-clockwise rotation
 * Negative = clockwise rotation
 */
export function curl(md: MultiDimNumber): number {
  const n = md.neighbors;
  const N = n.length;

  if (N < 2) return 0;

  // Circulation: sum of (n[i+1] - n[i]) around the ring
  let circulation = 0;
  for (let i = 0; i < N; i++) {
    const next = (i + 1) % N;
    circulation += n[next] - n[i];
  }

  // Normalize by perimeter
  return circulation / N;
}

/**
 * Laplacian: ∇²F at a single point.
 *
 * ∇²F ≈ mean(neighbors) - center
 *
 * This is the fundamental operator connecting field theory
 * to Rei's core computation model. The weighted computation
 * mode `|> compute :weighted` is essentially the Laplacian.
 */
export function laplacian(md: MultiDimNumber): number {
  const mean = md.neighbors.reduce((sum, n) => sum + n, 0) / md.neighbors.length;
  return mean - md.center;
}

// ============================================================
// Grid Operators
// ============================================================

/**
 * Create a field grid from a 2D array of values.
 * Each value becomes the center of an 8-neighbor MultiDimNumber.
 */
export function createGrid(
  values: number[][],
  mode: MultiDimNumber['mode'] = 'weighted'
): FieldGrid {
  const height = values.length;
  const width = values[0]?.length ?? 0;
  const points: MultiDimNumber[][] = [];

  for (let y = 0; y < height; y++) {
    const row: MultiDimNumber[] = [];
    for (let x = 0; x < width; x++) {
      const center = values[y][x];
      const neighbors: number[] = [];

      // 8-neighbor extraction (N, NE, E, SE, S, SW, W, NW)
      const offsets: [number, number][] = [
        [-1, 0], [-1, 1], [0, 1], [1, 1],
        [1, 0], [1, -1], [0, -1], [-1, -1],
      ];

      for (const [dy, dx] of offsets) {
        const ny = y + dy;
        const nx = x + dx;
        if (ny >= 0 && ny < height && nx >= 0 && nx < width) {
          neighbors.push(values[ny][nx]);
        } else {
          neighbors.push(center); // Mirror boundary
        }
      }

      row.push({ center, neighbors, mode });
    }
    points.push(row);
  }

  return { width, height, points };
}

/**
 * Apply gradient to entire grid.
 */
export function gradientGrid(grid: FieldGrid): GradientResult[][] {
  return grid.points.map(row => row.map(gradient));
}

/**
 * Apply divergence to entire grid.
 */
export function divergenceGrid(grid: FieldGrid): number[][] {
  return grid.points.map(row => row.map(divergence));
}

/**
 * Apply curl to entire grid.
 */
export function curlGrid(grid: FieldGrid): number[][] {
  return grid.points.map(row => row.map(curl));
}

/**
 * Apply laplacian to entire grid.
 */
export function laplacianGrid(grid: FieldGrid): number[][] {
  return grid.points.map(row => row.map(laplacian));
}

// ============================================================
// Field Operations
// ============================================================

/**
 * Field energy: E(F) = Σ |∇F|²
 * Measures the total variation (roughness) of the field.
 */
export function energy(grid: FieldGrid): number {
  let total = 0;
  for (const row of grid.points) {
    for (const point of row) {
      const grad = gradient(point);
      total += grad.magnitude * grad.magnitude;
    }
  }
  return total;
}

/**
 * Superpose two fields: result = α·A + (1-α)·B
 */
export function superpose(a: FieldGrid, b: FieldGrid, weight: number = 0.5): FieldGrid {
  if (a.width !== b.width || a.height !== b.height) {
    throw new Error('Field grids must have the same dimensions');
  }

  const points: MultiDimNumber[][] = [];
  for (let y = 0; y < a.height; y++) {
    const row: MultiDimNumber[] = [];
    for (let x = 0; x < a.width; x++) {
      const pa = a.points[y][x];
      const pb = b.points[y][x];
      row.push({
        center: pa.center * weight + pb.center * (1 - weight),
        neighbors: pa.neighbors.map((n, i) =>
          n * weight + pb.neighbors[i] * (1 - weight)
        ),
        mode: pa.mode,
      });
    }
    points.push(row);
  }

  return { width: a.width, height: a.height, points };
}

/**
 * Solve Poisson equation: ∇²φ = source
 * Using Jacobi iterative method.
 */
export function solvePoisson(
  source: FieldGrid,
  options: PoissonOptions = {}
): FieldGrid {
  const { maxIterations = 1000, tolerance = 1e-6, boundary = 'dirichlet' } = options;
  const { width, height } = source;

  // Initialize solution to zero
  let phi: number[][] = Array.from({ length: height }, () =>
    new Array(width).fill(0)
  );

  for (let iter = 0; iter < maxIterations; iter++) {
    let maxDiff = 0;
    const newPhi: number[][] = phi.map(row => [...row]);

    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        const neighbors = phi[y - 1][x] + phi[y + 1][x] + phi[y][x - 1] + phi[y][x + 1];
        const newVal = (neighbors - source.points[y][x].center) / 4;
        maxDiff = Math.max(maxDiff, Math.abs(newVal - phi[y][x]));
        newPhi[y][x] = newVal;
      }
    }

    // Apply boundary conditions
    if (boundary === 'periodic') {
      for (let y = 0; y < height; y++) {
        newPhi[y][0] = newPhi[y][width - 2];
        newPhi[y][width - 1] = newPhi[y][1];
      }
      for (let x = 0; x < width; x++) {
        newPhi[0][x] = newPhi[height - 2][x];
        newPhi[height - 1][x] = newPhi[1][x];
      }
    }

    phi = newPhi;

    if (maxDiff < tolerance) break;
  }

  return createGrid(phi, source.points[0]?.[0]?.mode ?? 'weighted');
}

/**
 * Flux through a boundary: integral of F·n over boundary.
 * By Gauss's theorem, equals the integral of div F over interior.
 */
export function flux(grid: FieldGrid): number {
  let total = 0;
  for (const row of grid.points) {
    for (const point of row) {
      total += divergence(point);
    }
  }
  return total;
}

/**
 * Circulation: integral of F around boundary.
 * By Stokes' theorem, equals the integral of curl F over interior.
 */
export function circulation(grid: FieldGrid): number {
  let total = 0;
  for (const row of grid.points) {
    for (const point of row) {
      total += curl(point);
    }
  }
  return total;
}
