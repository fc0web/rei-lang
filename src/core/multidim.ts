// Copyright 2024-2026 Nobuki Fujimoto (藤本伸樹)
// Licensed under the Apache License, Version 2.0
// See LICENSE file for details.
// ============================================================
// Rei (0₀式) Multi-Dimensional Number Computation Engine
// D-FUMT 多次元数体系理論 実装
// ============================================================

import {
  MultiDimNumber,
  ComputationMode,
  ComputationResult,
  SymmetryClass,
  HierarchicalMultiDim,
} from './types';

// --- Factory Functions ---

export function mdnum(
  center: number,
  neighbors: number[],
  weights?: number[],
  mode: ComputationMode = ComputationMode.Weighted,
  direction: 'cw' | 'ccw' = 'cw'
): MultiDimNumber {
  const w = weights ?? neighbors.map(() => 1);
  if (w.length !== neighbors.length) {
    throw new RangeError(
      `Weights length (${w.length}) must match neighbors length (${neighbors.length})`
    );
  }
  return Object.freeze({ center, neighbors, weights: w, mode, direction });
}

export function hmdnum(
  center: MultiDimNumber,
  children: HierarchicalMultiDim[] = [],
  depth: number = 0
): HierarchicalMultiDim {
  return Object.freeze({ center, children, depth });
}

// --- Symmetry Detection ---

export function detectSymmetry(md: MultiDimNumber): SymmetryClass {
  const { weights } = md;
  if (weights.length <= 1) return SymmetryClass.Full;

  const allEqual = weights.every((w) => Math.abs(w - weights[0]) < 1e-12);
  if (allEqual) return SymmetryClass.Full;

  // Axial: check mirror symmetry
  const n = weights.length;
  const isMirror = weights.every(
    (w, i) => Math.abs(w - weights[n - 1 - i]) < 1e-12
  );
  if (isMirror) return SymmetryClass.Axial;

  // Rotational: check if any rotation matches
  for (let shift = 1; shift < n; shift++) {
    const isRotation = weights.every(
      (w, i) => Math.abs(w - weights[(i + shift) % n]) < 1e-12
    );
    if (isRotation) return SymmetryClass.Rotational;
  }

  return SymmetryClass.Asymmetric;
}

// --- Core Computation ---

function computeWeighted(md: MultiDimNumber): number {
  const { center, neighbors, weights } = md;
  const totalWeight = weights.reduce((s, w) => s + w, 0);
  if (totalWeight === 0) return center;
  const weightedSum = neighbors.reduce((s, n, i) => s + weights[i] * n, 0);
  return center + weightedSum / totalWeight;
}

function computeMultiplicative(md: MultiDimNumber): number {
  const { center, neighbors, weights } = md;
  const product = neighbors.reduce((p, n, i) => p * Math.pow(Math.abs(n) || 1, weights[i]), 1);
  return center * product;
}

function computeHarmonic(md: MultiDimNumber): number {
  const { neighbors } = md;
  const nonZero = neighbors.filter((n) => n !== 0);
  if (nonZero.length === 0) return 0;
  const reciprocalSum = nonZero.reduce((s, n) => s + 1 / n, 0);
  return nonZero.length / reciprocalSum;
}

function computeExponential(md: MultiDimNumber, p: number = 2): number {
  const { neighbors } = md;
  if (neighbors.length === 0) return 0;
  const powerSum = neighbors.reduce((s, n) => s + Math.pow(Math.abs(n), p), 0);
  return Math.pow(powerSum / neighbors.length, 1 / p);
}

export function compute(md: MultiDimNumber, p?: number): ComputationResult {
  const start = typeof performance !== 'undefined' ? performance.now() : Date.now();
  const steps: string[] = [];
  const symmetry = detectSymmetry(md);

  // Apply direction (reverse neighbors for ccw)
  const ordered: MultiDimNumber =
    md.direction === 'ccw'
      ? { ...md, neighbors: [...md.neighbors].reverse(), weights: [...md.weights].reverse() }
      : md;

  steps.push(`mode=${md.mode}, direction=${md.direction}, symmetry=${symmetry}`);
  steps.push(`center=${md.center}, neighbors=[${md.neighbors.join(',')}]`);

  // Symmetry optimization
  if (symmetry === SymmetryClass.Full && md.mode === ComputationMode.Weighted) {
    const avg = ordered.neighbors.reduce((s, n) => s + n, 0) / ordered.neighbors.length;
    const value = ordered.center + avg;
    steps.push(`[opt:full-symmetry] simple average → ${value}`);
    const elapsed_ns = ((typeof performance !== 'undefined' ? performance.now() : Date.now()) - start) * 1e6;
    return Object.freeze({ value, mode: md.mode, symmetry, steps, elapsed_ns });
  }

  let value: number;
  switch (md.mode) {
    case ComputationMode.Weighted:
      value = computeWeighted(ordered);
      steps.push(`weighted → ${value}`);
      break;
    case ComputationMode.Multiplicative:
      value = computeMultiplicative(ordered);
      steps.push(`multiplicative → ${value}`);
      break;
    case ComputationMode.Harmonic:
      value = computeHarmonic(ordered);
      steps.push(`harmonic → ${value}`);
      break;
    case ComputationMode.Exponential:
      value = computeExponential(ordered, p);
      steps.push(`exponential(p=${p ?? 2}) → ${value}`);
      break;
  }

  const elapsed_ns = ((typeof performance !== 'undefined' ? performance.now() : Date.now()) - start) * 1e6;
  return Object.freeze({ value, mode: md.mode, symmetry, steps, elapsed_ns });
}

// --- Hierarchical Computation (階層的計算) ---

export function computeHierarchical(h: HierarchicalMultiDim): ComputationResult {
  if (h.children.length === 0) {
    return compute(h.center);
  }

  // Recursively compute children first
  const childValues = h.children.map((child) => computeHierarchical(child));
  const childNums = childValues.map((r) => r.value);

  // Replace neighbors with child computation results
  const resolved = mdnum(
    h.center.center,
    childNums,
    h.center.weights.slice(0, childNums.length),
    h.center.mode,
    h.center.direction
  );

  const result = compute(resolved);
  const allSteps = [
    `[hierarchical depth=${h.depth}]`,
    ...childValues.flatMap((r) => r.steps.map((s) => `  ${s}`)),
    ...result.steps,
  ];

  return Object.freeze({ ...result, steps: allSteps });
}

// --- Grid Computation (8-neighbor grid) ---

export function computeGrid(
  grid: number[][],
  row: number,
  col: number,
  mode: ComputationMode = ComputationMode.Weighted,
  direction: 'cw' | 'ccw' = 'cw'
): ComputationResult {
  const rows = grid.length;
  const cols = grid[0]?.length ?? 0;
  const center = grid[row][col];

  // 8-neighbor offsets (clockwise from top-left)
  const offsets: [number, number][] =
    direction === 'cw'
      ? [[-1, -1], [-1, 0], [-1, 1], [0, 1], [1, 1], [1, 0], [1, -1], [0, -1]]
      : [[-1, -1], [0, -1], [1, -1], [1, 0], [1, 1], [-1, 1], [-1, 0], [-1, -1]];

  const neighbors: number[] = [];
  for (const [dr, dc] of offsets) {
    const r = row + dr;
    const c = col + dc;
    if (r >= 0 && r < rows && c >= 0 && c < cols) {
      neighbors.push(grid[r][c]);
    }
  }

  return compute(mdnum(center, neighbors, undefined, mode, direction));
}
