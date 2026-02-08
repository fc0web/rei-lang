// Copyright 2024-2026 Nobuki Fujimoto (藤本伸樹)
// Licensed under the Apache License, Version 2.0
// See LICENSE file for details.
// ============================================================
// Rei (0₀式) Core Type Definitions
// D-FUMT Multi-Dimensional Number System Theory
// Author: Nobuki Fujimoto
// ============================================================

/**
 * 表記の別名宣言（Notation Alias）:
 * 正式記号は 0₀ (Unicode) / 0_{0} (LaTeX) / 0_0 (code)
 * プレーンテキスト: 0o  コード内: 0_0  すべて同一概念
 */

// --- Computation Modes (4計算モード) ---

export enum ComputationMode {
  /** 重み付き平均: V = c₀ + Σ(wᵢ × nᵢ) / Σwᵢ */
  Weighted = 'weighted',
  /** 乗法的結合: V = c₀ × Π(nᵢ^wᵢ) */
  Multiplicative = 'multiplicative',
  /** 調和平均: V = n / Σ(1/nᵢ) */
  Harmonic = 'harmonic',
  /** 指数平均: V = (Σ(nᵢ^p) / n)^(1/p) */
  Exponential = 'exponential',
}

// --- Multi-Dimensional Number (多次元数) ---

export interface MultiDimNumber {
  readonly center: number;
  readonly neighbors: readonly number[];
  readonly weights: readonly number[];
  readonly mode: ComputationMode;
  readonly direction: 'cw' | 'ccw'; // clockwise / counter-clockwise
}

// --- Extended Subscript (拡張添字) ---

export type SubscriptChar = 'o' | 'x' | 'z' | 'w' | 'y' | 'v' | 'u' | 't' | 's' | 'r';

export interface ExtendedSubscript {
  readonly base: 0 | typeof Math.PI | typeof Math.E;
  readonly chars: readonly SubscriptChar[];
  readonly degree: number; // = chars.length
}

// --- Extended Number (拡張数) ---

export interface ExtendedNumber {
  readonly subscript: ExtendedSubscript;
  readonly value: number;
  readonly phase: 'extended' | 'reduced' | 'neutral';
}

// --- Unified Number (統合数) ---

export interface UnifiedNumber {
  readonly multidim: MultiDimNumber;
  readonly extended: ExtendedNumber;
  readonly level: number; // hierarchical level
}

// --- Hierarchical Multi-Dimensional Number (階層的多次元数) ---

export interface HierarchicalMultiDim {
  readonly center: MultiDimNumber;
  readonly children: readonly HierarchicalMultiDim[];
  readonly depth: number;
}

// --- Symmetry Classes (対称性クラス) ---

export enum SymmetryClass {
  Full = 'full',           // all weights equal
  Axial = 'axial',         // mirror symmetry
  Rotational = 'rotational', // rotational symmetry
  Asymmetric = 'asymmetric', // no symmetry
}

// --- Computation Result ---

export interface ComputationResult {
  readonly value: number;
  readonly mode: ComputationMode;
  readonly symmetry: SymmetryClass;
  readonly steps: readonly string[];
  readonly elapsed_ns?: number;
}

// --- Operator Types ---

export type ExtensionOp = '⊕' | '⊗';  // extension operators
export type ReductionOp = '⊖' | '⊘';  // reduction operators
export type PipeOp = '|>' | '<|';       // pipe operators (center → outward)

// --- Notation Equivalence (記法同値公理) ---

export interface NotationForm {
  readonly sensory: string;    // 感覚層: 0ooo
  readonly dialogue: string;   // 対話層: 0_o3
  readonly structural: string; // 構造層: 0(o,3)
  readonly semantic: string;   // 意味層: {base:0, type:"o", degree:3}
}
