// ============================================================
// Rei (0₀式) Curvature Literal System
// 曲率リテラル — κ 記法の Reference Implementation
// D-FUMT Extension — Built on GA-v2
// Author: Nobuki Fujimoto
// ============================================================
//
// REI_SPEC_v0.1 Proposal 3: Curvature Literal (κ)
//
// 5κ0.3           → value=5, curvature=0.3
// 0₀κ0.7          → extended zero_zero, curvature=0.7
// x >κ y          → curvature comparison
// result.κ        → curvature extraction
// 5κ0.1 |> double → 10κ0.1 (curvature propagates)
//
// Design:
//   κ は GA-v2 の curvature パラメータを言語リテラルに昇格させる。
//   数値に「相転移への近さ」というメタデータを付与し、
//   計算を通じて自動的に伝搬させる。
//
// Curvature Rules:
//   1. Creation:    5κ0.3 → { value: 5, curvature: 0.3 }
//   2. Propagation: 5κ0.3 + 3κ0.5 → 8κ0.4 (weighted avg)
//   3. Threshold:   κ ≥ 0.85 → phase transition triggered
//   4. Comparison:  x >κ y ≡ x.κ > y.κ
//   5. Multi-dim:   𝕄{5κ0.3; 1κ0.1, 2κ0.2} per-dimension κ
//   6. Decay/Growth: entropy_decay, structure_growth per tick
// ============================================================

import {
  type GenesisPhase,
  type GenesisState,
  CURVATURE_THRESHOLD,
  ENTROPY_DECAY,
  STRUCTURE_GROWTH,
} from './genesis-axioms-v2';

// ============================================================
// I. CurvatureValue — 曲率リテラルの型
// ============================================================

/**
 * CurvatureValue<T>: 曲率メタデータ付き値
 *
 * Rei記法: 5κ0.3
 *   → CurvatureValue<number> { value: 5, curvature: 0.3 }
 *
 * κ は [0, 1] の範囲。相転移閾値（0.7 = GA-v2 CURVATURE_THRESHOLD）に
 * 近づくと相転移が発生する。
 */
export interface CurvatureValue<T = number> {
  readonly value: T;
  readonly curvature: number; // κ: 0..1
  readonly origin: CurvatureOrigin;
}

export type CurvatureOrigin =
  | 'literal'       // 直接生成: 5κ0.3
  | 'computed'      // 演算結果: 5κ0.3 + 3κ0.5
  | 'propagated'    // パイプ伝搬: 5κ0.3 |> double
  | 'decayed'       // 減衰: decay()
  | 'grown'         // 成長: grow()
  | 'transitioned'; // 相転移後

// ============================================================
// II. CurvatureValue Creation — κ リテラル生成
// ============================================================

/**
 * κ: 曲率リテラル生成関数
 *
 * Rei記法: 5κ0.3 は κ(5, 0.3) にコンパイルされる
 */
export function κ(value: number, curvature: number): CurvatureValue<number> {
  if (curvature < 0 || curvature > 1) {
    throw new RangeError(`Curvature κ must be in [0, 1], got ${curvature}`);
  }
  return { value, curvature, origin: 'literal' };
}

// ASCII alias
export const kappa = κ;

/**
 * κFromGenesisState: GA-v2の状態からCurvatureValueを生成
 */
export function κFromState(state: GenesisState): CurvatureValue<GenesisState> {
  return {
    value: state,
    curvature: state.curvature,
    origin: 'literal',
  };
}

// ============================================================
// III. Curvature Arithmetic — 曲率演算
// ============================================================

/**
 * Propagation rules for binary operations:
 *
 * Addition: κ = weighted average
 *   5κ0.3 + 3κ0.5 → 8κ0.4 (weighted by absolute values)
 *
 * Multiplication: κ = geometric mean
 *   5κ0.3 * 2κ0.7 → 10κ0.458 (√(0.3 * 0.7))
 *
 * Subtraction: κ = weighted average (same as addition)
 *   5κ0.3 - 3κ0.5 → 2κ0.4
 *
 * Division: κ = geometric mean (same as multiplication)
 *   10κ0.3 / 2κ0.7 → 5κ0.458
 */

export type CurvatureOp = 'add' | 'sub' | 'mul' | 'div';

function weightedAverage(a: CurvatureValue, b: CurvatureValue): number {
  const totalWeight = Math.abs(a.value) + Math.abs(b.value);
  if (totalWeight === 0) return (a.curvature + b.curvature) / 2;
  return (a.curvature * Math.abs(a.value) + b.curvature * Math.abs(b.value)) / totalWeight;
}

function geometricMean(a: CurvatureValue, b: CurvatureValue): number {
  if (a.curvature === 0 || b.curvature === 0) return 0;
  return Math.sqrt(a.curvature * b.curvature);
}

/**
 * curvatureOp: 曲率付き二項演算
 */
export function curvatureOp(
  a: CurvatureValue,
  b: CurvatureValue,
  op: CurvatureOp,
): CurvatureValue {
  let value: number;
  let curvature: number;

  switch (op) {
    case 'add':
      value = a.value + b.value;
      curvature = weightedAverage(a, b);
      break;
    case 'sub':
      value = a.value - b.value;
      curvature = weightedAverage(a, b);
      break;
    case 'mul':
      value = a.value * b.value;
      curvature = geometricMean(a, b);
      break;
    case 'div':
      if (b.value === 0) throw new Error('Division by zero');
      value = a.value / b.value;
      curvature = geometricMean(a, b);
      break;
  }

  return { value, curvature: clampCurvature(curvature), origin: 'computed' };
}

// Convenience functions
export function curvatureAdd(a: CurvatureValue, b: CurvatureValue): CurvatureValue {
  return curvatureOp(a, b, 'add');
}

export function curvatureSub(a: CurvatureValue, b: CurvatureValue): CurvatureValue {
  return curvatureOp(a, b, 'sub');
}

export function curvatureMul(a: CurvatureValue, b: CurvatureValue): CurvatureValue {
  return curvatureOp(a, b, 'mul');
}

export function curvatureDiv(a: CurvatureValue, b: CurvatureValue): CurvatureValue {
  return curvatureOp(a, b, 'div');
}

// ============================================================
// IV. Curvature Pipe Propagation — パイプ伝搬
// ============================================================

/**
 * curvaturePipe: 単項関数パイプで曲率を伝搬
 *
 * 5κ0.3 |> double → 10κ0.3 (curvature preserved)
 * 5κ0.3 |> negate → -5κ0.3 (curvature preserved)
 */
export function curvaturePipe(
  input: CurvatureValue,
  fn: (value: number) => number,
  label?: string,
): CurvatureValue {
  return {
    value: fn(input.value),
    curvature: input.curvature,
    origin: 'propagated',
  };
}

/**
 * curvaturePipeChain: パイプチェーンで曲率を伝搬
 *
 * 5κ0.3 |> double |> add(3) |> negate → -13κ0.3
 */
export function curvaturePipeChain(
  input: CurvatureValue,
  fns: ReadonlyArray<(value: number) => number>,
): CurvatureValue {
  let current = input;
  for (const fn of fns) {
    current = curvaturePipe(current, fn);
  }
  return current;
}

// ============================================================
// V. Curvature Comparison — 曲率比較演算子
// ============================================================

/**
 * >κ : curvature comparison
 *
 * x >κ y  ≡  x.κ > y.κ
 */
export function curvatureGt(a: CurvatureValue, b: CurvatureValue): boolean {
  return a.curvature > b.curvature;
}

export function curvatureLt(a: CurvatureValue, b: CurvatureValue): boolean {
  return a.curvature < b.curvature;
}

export function curvatureEq(a: CurvatureValue, b: CurvatureValue, epsilon: number = 1e-10): boolean {
  return Math.abs(a.curvature - b.curvature) < epsilon;
}

/**
 * .κ : curvature extraction
 *
 * result.κ → 0.3
 */
export function extractCurvature(cv: CurvatureValue): number {
  return cv.curvature;
}

// ============================================================
// VI. Curvature Decay & Growth — 減衰・成長
// ============================================================

/**
 * decay: GA-v2 entropy decay を曲率に適用
 *
 * let x = 5κ0.8
 * x |> decay → 5κ0.76 (κ * ENTROPY_DECAY)
 */
export function curvatureDecay(
  cv: CurvatureValue,
  factor: number = ENTROPY_DECAY,
): CurvatureValue {
  return {
    value: cv.value,
    curvature: clampCurvature(cv.curvature * factor),
    origin: 'decayed',
  };
}

/**
 * grow: GA-v2 structure growth を曲率に適用
 *
 * let x = 5κ0.3
 * x |> grow → 5κ0.33 (κ * STRUCTURE_GROWTH)
 */
export function curvatureGrow(
  cv: CurvatureValue,
  factor: number = STRUCTURE_GROWTH,
): CurvatureValue {
  return {
    value: cv.value,
    curvature: clampCurvature(cv.curvature * factor),
    origin: 'grown',
  };
}

// ============================================================
// VII. Phase Transition Detection — 相転移検出
// ============================================================

export interface PhaseTransitionEvent {
  readonly triggered: boolean;
  readonly beforeCurvature: number;
  readonly afterCurvature: number;
  readonly threshold: number;
  readonly message: string;
}

/**
 * checkPhaseTransition: 曲率が閾値を超えたか検出
 *
 * let step3 = step2 |> energize(0.3)
 * // κ=0.9 ≥ 0.7 → phase transition!
 */
export function checkPhaseTransition(
  cv: CurvatureValue,
  threshold: number = CURVATURE_THRESHOLD,
): PhaseTransitionEvent {
  if (cv.curvature >= threshold) {
    return {
      triggered: true,
      beforeCurvature: cv.curvature,
      afterCurvature: cv.curvature,
      threshold,
      message: `Phase transition triggered: κ=${cv.curvature.toFixed(4)} ≥ threshold=${threshold}`,
    };
  }
  return {
    triggered: false,
    beforeCurvature: cv.curvature,
    afterCurvature: cv.curvature,
    threshold,
    message: `No transition: κ=${cv.curvature.toFixed(4)} < threshold=${threshold}`,
  };
}

/**
 * energize: エネルギーを注入して曲率を上昇させる
 *
 * 0₀κ0.0 |> energize(0.3) → 0₀κ0.3
 * 0₀κ0.3 |> energize(0.3) → 0₀κ0.6
 * 0₀κ0.6 |> energize(0.3) → 0₀κ0.9 → TRANSITION!
 */
export function energize(
  cv: CurvatureValue,
  energy: number,
): { result: CurvatureValue; transition: PhaseTransitionEvent } {
  const newCurvature = clampCurvature(cv.curvature + energy);
  const result: CurvatureValue = {
    value: cv.value,
    curvature: newCurvature,
    origin: newCurvature >= CURVATURE_THRESHOLD ? 'transitioned' : 'computed',
  };
  return {
    result,
    transition: checkPhaseTransition(result),
  };
}

// ============================================================
// VIII. Multi-Dimensional Curvature — 多次元曲率
// ============================================================

/**
 * CurvatureMultiDim: 多次元数の各次元に独立した曲率
 *
 * 𝕄{5κ0.3; 1κ0.1, 2κ0.2, 3κ0.4, 4κ0.5}
 */
export interface CurvatureMultiDim {
  readonly center: CurvatureValue;
  readonly neighbors: readonly CurvatureValue[];
}

export function curvatureMultiDim(
  center: CurvatureValue,
  neighbors: CurvatureValue[],
): CurvatureMultiDim {
  return { center, neighbors };
}

/**
 * multiDimMeanCurvature: 全次元の平均曲率
 */
export function multiDimMeanCurvature(md: CurvatureMultiDim): number {
  const all = [md.center, ...md.neighbors];
  return all.reduce((sum, cv) => sum + cv.curvature, 0) / all.length;
}

/**
 * multiDimMaxCurvature: 最大曲率（相転移に最も近い次元）
 */
export function multiDimMaxCurvature(md: CurvatureMultiDim): CurvatureValue {
  const all = [md.center, ...md.neighbors];
  return all.reduce((max, cv) => cv.curvature > max.curvature ? cv : max);
}

/**
 * multiDimConvolve: 曲率を考慮した畳み込み
 *
 * 高曲率の次元ほど結果に強い影響を与える
 */
export function multiDimConvolve(md: CurvatureMultiDim): CurvatureValue {
  const totalWeight = md.neighbors.reduce(
    (sum, n) => sum + (1 + n.curvature),
    0
  );
  const weightedSum = md.neighbors.reduce(
    (sum, n) => sum + n.value * (1 + n.curvature),
    0
  );
  const avgCurvature = md.neighbors.reduce(
    (sum, n) => sum + n.curvature,
    0
  ) / md.neighbors.length;

  return {
    value: weightedSum / totalWeight,
    curvature: clampCurvature((md.center.curvature + avgCurvature) / 2),
    origin: 'computed',
  };
}

// ============================================================
// IX. Display — 表示
// ============================================================

/** Display a CurvatureValue in Rei κ notation */
export function displayCurvature(cv: CurvatureValue): string {
  const valStr = Number.isInteger(cv.value) ? String(cv.value) : cv.value.toFixed(4);
  return `${valStr}κ${cv.curvature.toFixed(2)}`;
}

/** Display a CurvatureMultiDim in Rei notation */
export function displayCurvatureMultiDim(md: CurvatureMultiDim): string {
  const center = displayCurvature(md.center);
  const neighbors = md.neighbors.map(displayCurvature).join(', ');
  return `𝕄{${center}; ${neighbors}}`;
}

// ============================================================
// X. Internal Utilities
// ============================================================

function clampCurvature(κ: number): number {
  return Math.max(0, Math.min(1, κ));
}
