// Copyright 2024-2026 Nobuki Fujimoto (藤本伸樹)
// Licensed under the Apache License, Version 2.0
// See LICENSE file for details.
// ============================================================
// Rei (0₀式) Unified Number System
// D-FUMT 統合数式体系 実装
// ============================================================

import { UnifiedNumber, ComputationMode, ComputationResult } from './types';
import { mdnum, compute } from './multidim';
import { subscript, extnum, extend, reduce } from './extended';

// --- Factory ---

export function unified(
  center: number,
  neighbors: number[],
  baseConst: 0 | typeof Math.PI | typeof Math.E = 0,
  subscriptChars: ('o' | 'x' | 'z')[] = ['o'],
  mode: ComputationMode = ComputationMode.Weighted,
  level: number = 0
): UnifiedNumber {
  const md = mdnum(center, neighbors, undefined, mode);
  const sub = subscript(baseConst, subscriptChars);
  const ext = extnum(sub);
  return Object.freeze({ multidim: md, extended: ext, level });
}

// --- Unified Addition (⊕) ---

export function unifiedAdd(a: UnifiedNumber, b: UnifiedNumber): UnifiedNumber {
  const newCenter = a.multidim.center + b.multidim.center;
  const maxLen = Math.max(a.multidim.neighbors.length, b.multidim.neighbors.length);
  const newNeighbors: number[] = [];
  for (let i = 0; i < maxLen; i++) {
    const av = a.multidim.neighbors[i] ?? 0;
    const bv = b.multidim.neighbors[i] ?? 0;
    newNeighbors.push(av + bv);
  }
  const newMd = mdnum(newCenter, newNeighbors, undefined, a.multidim.mode);

  // Extend subscript to max degree
  const maxDegree = Math.max(a.extended.subscript.degree, b.extended.subscript.degree);
  let ext = a.extended;
  while (ext.subscript.degree < maxDegree) {
    ext = extend(ext);
  }

  return Object.freeze({
    multidim: newMd,
    extended: ext,
    level: Math.max(a.level, b.level),
  });
}

// --- Unified Multiplication (⊗) ---

export function unifiedMul(a: UnifiedNumber, b: UnifiedNumber): UnifiedNumber {
  const newCenter = a.multidim.center * b.multidim.center;
  const maxLen = Math.max(a.multidim.neighbors.length, b.multidim.neighbors.length);
  const newNeighbors: number[] = [];
  for (let i = 0; i < maxLen; i++) {
    const av = a.multidim.neighbors[i] ?? 1;
    const bv = b.multidim.neighbors[i] ?? 1;
    newNeighbors.push(av * bv);
  }
  const newMd = mdnum(newCenter, newNeighbors, undefined, ComputationMode.Multiplicative);

  const totalDegree = a.extended.subscript.degree + b.extended.subscript.degree;
  const chars = [...a.extended.subscript.chars, ...b.extended.subscript.chars];
  const sub = subscript(a.extended.subscript.base, [...chars] as any);
  const ext = extnum(sub);

  return Object.freeze({
    multidim: newMd,
    extended: ext,
    level: a.level + b.level,
  });
}

// --- Compute Unified Value ---

export function computeUnified(u: UnifiedNumber): ComputationResult {
  const mdResult = compute(u.multidim);
  const extOffset = u.extended.value;
  const combinedValue = mdResult.value + extOffset * u.level;

  return Object.freeze({
    value: combinedValue,
    mode: u.multidim.mode,
    symmetry: mdResult.symmetry,
    steps: [
      ...mdResult.steps,
      `ext_offset=${extOffset}, level=${u.level}`,
      `unified → ${combinedValue}`,
    ],
  });
}
