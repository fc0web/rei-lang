// Copyright 2024-2026 Nobuki Fujimoto (藤本伸樹)
// Licensed under the Apache License, Version 2.0
// See LICENSE file for details.
// ============================================================
// Rei (0₀式) Genesis Axiom System (GA)
// 生成公理系 — 「0の手前」の公理化
// D-FUMT Extension
// Author: Nobuki Fujimoto
// ============================================================

// --- Phase Types ---

export type GenesisPhase =
  | 'void'          // 完全な無（公理系の外部）
  | 'dot'           // ・（てん）— 最初の存在、制約なし
  | 'zero_zero'     // 0₀ — 構造の誕生（値と構造の分離）
  | 'zero'          // 0  — 値の確定、数学が可能に
  | 'number';       // N  — 通常の数体系

export interface GenesisState {
  readonly phase: GenesisPhase;
  readonly curvature: number;       // κ — 局所曲率
  readonly entropy: number;         // S — エントロピー
  readonly structure: number;       // 構造指標
  readonly history: readonly GenesisTransition[];
  readonly tick: number;
}

export interface GenesisTransition {
  readonly from: GenesisPhase;
  readonly to: GenesisPhase;
  readonly tick: number;
  readonly curvature_delta: number;
  readonly axiom: string;           // which axiom triggered this
}

// --- Genesis Constants ---

const CURVATURE_THRESHOLD = 0.7;   // κc: 臨界閾値
const ENTROPY_DECAY = 0.95;
const STRUCTURE_GROWTH = 1.1;

// --- Phase Order ---

const PHASE_ORDER: GenesisPhase[] = ['void', 'dot', 'zero_zero', 'zero', 'number'];

function phaseIndex(p: GenesisPhase): number {
  return PHASE_ORDER.indexOf(p);
}

// --- Axioms ---

/**
 * G-E₁: 存在公理（Existence）
 * 何かが存在しうる。それを ・（てん）と呼ぶ。
 */
function axiomExistence(state: GenesisState): GenesisState | null {
  if (state.phase !== 'void') return null;
  return transition(state, 'dot', 'G-E₁: Existence — ・(dot) emerges from void');
}

/**
 * G-S₀: 構造分離公理（Structure Separation）
 * ・から 0₀ が生じる。値と構造が分離する。
 */
function axiomStructureSeparation(state: GenesisState): GenesisState | null {
  if (state.phase !== 'dot') return null;
  if (state.curvature < CURVATURE_THRESHOLD * 0.5) return null;
  return transition(state, 'zero_zero', 'G-S₀: Structure Separation — 0₀ (structure ≠ value)');
}

/**
 * G-S₁: 値固定公理（Value Fixation）
 * 0₀ から 0 が生じる。値が確定し、計算が可能になる。
 */
function axiomValueFixation(state: GenesisState): GenesisState | null {
  if (state.phase !== 'zero_zero') return null;
  if (state.curvature < CURVATURE_THRESHOLD) return null;
  return transition(state, 'zero', 'G-S₁: Value Fixation — 0 emerges, computation begins');
}

/**
 * G-N₁: 数体系生成公理
 * 0 から自然数体系が生じる。
 */
function axiomNumberGenesis(state: GenesisState): GenesisState | null {
  if (state.phase !== 'zero') return null;
  if (state.structure < 2.0) return null;
  return transition(state, 'number', 'G-N₁: Number Genesis — ℕ emerges from 0');
}

/**
 * FR: 遮断規則（Firewall Rule）
 * ・は直接数値に変換できない。0₀ を経由しなければならない。
 */
export function firewallCheck(from: GenesisPhase, to: GenesisPhase): boolean {
  const fi = phaseIndex(from);
  const ti = phaseIndex(to);
  // Must advance exactly one step at a time
  return ti === fi + 1;
}

// --- Transition ---

function transition(
  state: GenesisState,
  to: GenesisPhase,
  axiom: string
): GenesisState {
  if (!firewallCheck(state.phase, to)) {
    throw new Error(`Firewall violation: cannot transition ${state.phase} → ${to}`);
  }

  const t: GenesisTransition = {
    from: state.phase,
    to,
    tick: state.tick,
    curvature_delta: state.curvature,
    axiom,
  };

  return Object.freeze({
    phase: to,
    curvature: state.curvature * ENTROPY_DECAY,
    entropy: state.entropy * ENTROPY_DECAY,
    structure: state.structure * STRUCTURE_GROWTH,
    history: [...state.history, t],
    tick: state.tick + 1,
  });
}

// --- Simulator ---

export function createGenesis(): GenesisState {
  return Object.freeze({
    phase: 'void' as GenesisPhase,
    curvature: 0,
    entropy: 1.0,
    structure: 0.1,
    history: [],
    tick: 0,
  });
}

export function evolve(state: GenesisState, energy: number = 0.1): GenesisState {
  // Add curvature energy
  const energized: GenesisState = {
    ...state,
    curvature: Math.min(state.curvature + energy, 1.0),
    entropy: state.entropy * ENTROPY_DECAY,
    structure: state.structure * STRUCTURE_GROWTH,
    tick: state.tick + 1,
  };

  // Try axioms in order
  const axioms = [
    axiomExistence,
    axiomStructureSeparation,
    axiomValueFixation,
    axiomNumberGenesis,
  ];

  for (const axiom of axioms) {
    const result = axiom(energized);
    if (result) return result;
  }

  return Object.freeze(energized);
}

/**
 * Run full genesis from void to number system
 */
export function runFullGenesis(energyPerStep: number = 0.2): GenesisState {
  let state = createGenesis();
  const maxSteps = 100;

  for (let i = 0; i < maxSteps; i++) {
    state = evolve(state, energyPerStep);
    if (state.phase === 'number') break;
  }

  return state;
}

// --- Theorem S₀/S₁ Verification ---

/**
 * Theorem S₀: Under Assumption CS (general position),
 * the transition ・ →G 0₀ is unique.
 */
export function verifyTheoremS0(state: GenesisState): {
  valid: boolean;
  message: string;
} {
  const dotToZeroZero = state.history.filter(
    (t) => t.from === 'dot' && t.to === 'zero_zero'
  );
  const valid = dotToZeroZero.length <= 1;
  return {
    valid,
    message: valid
      ? `Theorem S₀ holds: unique transition ・ →G 0₀ (count=${dotToZeroZero.length})`
      : `Theorem S₀ violated: multiple transitions ・ →G 0₀ (count=${dotToZeroZero.length})`,
  };
}

/**
 * Theorem S₁: Under Assumption CS,
 * the transition 0₀ →G 0 is unique.
 */
export function verifyTheoremS1(state: GenesisState): {
  valid: boolean;
  message: string;
} {
  const zeroZeroToZero = state.history.filter(
    (t) => t.from === 'zero_zero' && t.to === 'zero'
  );
  const valid = zeroZeroToZero.length <= 1;
  return {
    valid,
    message: valid
      ? `Theorem S₁ holds: unique transition 0₀ →G 0 (count=${zeroZeroToZero.length})`
      : `Theorem S₁ violated: multiple transitions 0₀ →G 0 (count=${zeroZeroToZero.length})`,
  };
}
