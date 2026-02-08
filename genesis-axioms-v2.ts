// ============================================================
// Rei (0₀式) Genesis Axiom System v2 (GA-v2)
// 生成公理系 — 「0の手前」の公理化（精密版）
// D-FUMT Extension
// Author: Nobuki Fujimoto
// ============================================================
//
// v2 Changes from v1:
//   - witness + delta system for machine-verifiable S₀/S₁
//   - phaseDelta for monotonicity guarantee
//   - enrichTransition with threshold/progress tracking
//   - CS (General Position Assumption) in witness payload
//   - FNV-1a hash for reproducibility (TODO: upgrade to SHA-256)
//
// Review fixes applied:
//   [FIX-1] computeProgress uses energized state (not pre-transition)
//   [FIX-2] No double decay/growth on transition — uses energized directly
//   [FIX-3] TODO marker for SHA-256 upgrade
//   [FIX-4] CS assumption integrated into witness.payload
// ============================================================

// --- Phase Types ---

export type GenesisPhase =
  | 'void'       // 完全な無（公理系の外部）
  | 'dot'        // ・（てん）— 最初の存在、制約なし
  | 'zero_zero'  // 0₀ — 構造の誕生（値と構造の分離）
  | 'zero'       // 0  — 値の確定、数学が可能に
  | 'number';    // N  — 通常の数体系

// --- Witness System ---

export interface Witness {
  readonly kind: 'existence' | 'structure_separation' | 'value_fixation' | 'number_genesis';
  readonly hash: string;
  readonly payload: WitnessPayload;
}

export interface WitnessPayload {
  readonly from: GenesisPhase;
  readonly to: GenesisPhase;
  readonly tick: number;
  readonly curvature: number;
  readonly entropy: number;
  readonly structure: number;
  readonly threshold: number;
  readonly progress: number;       // 0..1+ ratio toward threshold
  readonly cs: CSAssumption;       // [FIX-4] General Position Assumption
}

/**
 * CS: 一般位置仮定（General Position Assumption）
 * 遷移が「一般的条件下」で一意であることを保証するための仮定。
 * witness.payload に組み込むことで S₀/S₁ が「仮定つき定理」になる。
 */
export interface CSAssumption {
  readonly satisfied: boolean;
  readonly indicator: number;      // 構造指標と曲率の局所勾配の組み合わせ
  readonly description: string;
}

// --- Transition Types ---

export interface GenesisTransition {
  readonly from: GenesisPhase;
  readonly to: GenesisPhase;
  readonly tick: number;
  readonly curvature_delta: number;
  readonly axiom: string;
  readonly witness: Witness;
}

// --- State Types ---

export interface GenesisState {
  readonly phase: GenesisPhase;
  readonly curvature: number;       // κ — 局所曲率
  readonly entropy: number;         // S — エントロピー
  readonly structure: number;       // 構造指標
  readonly history: readonly GenesisTransition[];
  readonly tick: number;
}

// --- Genesis Constants ---

export const CURVATURE_THRESHOLD = 0.7;   // κc: 臨界閾値
export const ENTROPY_DECAY = 0.95;
export const STRUCTURE_GROWTH = 1.1;
const STRUCTURE_THRESHOLD = 2.0;           // G-N₁ threshold

// --- Phase Order & Utilities ---

const PHASE_ORDER: GenesisPhase[] = ['void', 'dot', 'zero_zero', 'zero', 'number'];

export function phaseIndex(p: GenesisPhase): number {
  return PHASE_ORDER.indexOf(p);
}

/**
 * phaseDelta: Genesis は逆行しない（単調性の機械的保証）
 * δ > 0 なら前進、δ = 0 なら停滞、δ < 0 なら違反
 */
export function phaseDelta(from: GenesisPhase, to: GenesisPhase): number {
  return phaseIndex(to) - phaseIndex(from);
}

// --- Hash Function ---

/**
 * FNV-1a 32-bit hash for witness reproducibility.
 * TODO [FIX-3]: Upgrade to SHA-256 for production use.
 * Current choice: deterministic, fast, good enough for MVP integrity checks.
 * Stable JSON property order is assumed (guaranteed by enrichTransition's explicit layout).
 */
export function fnv1a32(input: string): string {
  let hash = 0x811c9dc5;
  for (let i = 0; i < input.length; i++) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash >>> 0).toString(16).padStart(8, '0');
}

// --- Physics ---

/**
 * computeProgress: 現在の状態がフェーズ遷移閾値にどれだけ近いかを計算
 *
 * [FIX-1] energized state を引数に取ることで、
 * 遷移判定と progress が同一の状態から計算される。
 */
export function computeProgress(state: GenesisState): number {
  switch (state.phase) {
    case 'void':
      // void → dot: always fires (existence axiom)
      return 1.0;
    case 'dot':
      // dot → zero_zero: curvature must reach CURVATURE_THRESHOLD
      return state.curvature / CURVATURE_THRESHOLD;
    case 'zero_zero':
      // zero_zero → zero: entropy must decay below threshold
      return (1 - state.entropy) / (1 - ENTROPY_DECAY);
    case 'zero':
      // zero → number: structure must exceed STRUCTURE_THRESHOLD
      return state.structure / STRUCTURE_THRESHOLD;
    case 'number':
      return 1.0; // terminal phase
  }
}

/**
 * evaluateCS: CS（一般位置仮定）を評価
 *
 * CS holds when:
 *   1. structure > 0 (非退化)
 *   2. energy > 0 (正のエネルギー入力)
 *   3. entropy > 0 (散逸していない)
 */
export function evaluateCS(state: GenesisState, energy: number): CSAssumption {
  const structurePositive = state.structure > 0;
  const energyPositive = energy > 0;
  const entropyPositive = state.entropy > 0;
  const satisfied = structurePositive && energyPositive && entropyPositive;

  const indicator = state.structure * state.curvature * state.entropy;

  return {
    satisfied,
    indicator,
    description: satisfied
      ? `CS holds: structure=${state.structure.toFixed(4)}, energy=${energy.toFixed(4)}, entropy=${state.entropy.toFixed(4)}`
      : `CS violated: ${!structurePositive ? 'degenerate structure' : ''} ${!energyPositive ? 'zero energy' : ''} ${!entropyPositive ? 'dissipated entropy' : ''}`.trim(),
  };
}

// --- Witness Construction ---

function witnessKindForPhase(from: GenesisPhase): Witness['kind'] {
  switch (from) {
    case 'void': return 'existence';
    case 'dot': return 'structure_separation';
    case 'zero_zero': return 'value_fixation';
    case 'zero': return 'number_genesis';
    default: return 'existence'; // unreachable in normal flow
  }
}

/**
 * enrichTransition: 生の遷移情報に witness を付与
 *
 * [FIX-1] threshold/progress は energized state から計算されたものを使用
 * [FIX-4] CS 仮定を witness.payload に含める
 */
function enrichTransition(
  from: GenesisPhase,
  to: GenesisPhase,
  state: GenesisState,  // energized state
  axiom: string,
  threshold: number,
  progress: number,
  cs: CSAssumption,
): GenesisTransition {
  const kind = witnessKindForPhase(from);

  const payload: WitnessPayload = {
    from,
    to,
    tick: state.tick,
    curvature: state.curvature,
    entropy: state.entropy,
    structure: state.structure,
    threshold,
    progress,
    cs,
  };

  const hashInput = JSON.stringify(payload);
  const hash = fnv1a32(hashInput);

  return {
    from,
    to,
    tick: state.tick,
    curvature_delta: state.curvature,
    axiom,
    witness: { kind, hash, payload },
  };
}

// --- Firewall Rule ---

/**
 * FR: 遮断規則（Firewall Rule）
 * ・は直接数値に変換できない。0₀ を経由しなければならない。
 * 段飛ばし禁止：相転移は必ず1段ずつ。
 */
export function firewallCheck(from: GenesisPhase, to: GenesisPhase): boolean {
  const delta = phaseDelta(from, to);
  return delta === 1;
}

// --- Axioms ---

/**
 * G-E₁: 存在公理（Existence）
 * 何かが存在しうる。それを ・（てん）と呼ぶ。
 */
function axiomExistence(state: GenesisState): { to: GenesisPhase; axiom: string } | null {
  if (state.phase !== 'void') return null;
  return { to: 'dot', axiom: 'G-E₁: Existence — ・(dot) emerges from void' };
}

/**
 * G-S₀: 構造分離公理（Structure Separation）
 * ・が十分な曲率を持つと、構造が分離して 0₀ が生まれる。
 */
function axiomStructureSeparation(state: GenesisState): { to: GenesisPhase; axiom: string } | null {
  if (state.phase !== 'dot') return null;
  if (state.curvature < CURVATURE_THRESHOLD) return null;
  return { to: 'zero_zero', axiom: 'G-S₀: Structure Separation — ・ differentiates into 0₀' };
}

/**
 * G-S₁: 値固定公理（Value Fixation）
 * 0₀ のエントロピーが十分に低下すると、値が確定して 0 になる。
 */
function axiomValueFixation(state: GenesisState): { to: GenesisPhase; axiom: string } | null {
  if (state.phase !== 'zero_zero') return null;
  if (state.entropy > ENTROPY_DECAY) return null;
  return { to: 'zero', axiom: 'G-S₁: Value Fixation — 0₀ crystallizes into 0' };
}

/**
 * G-N₁: 数生成公理（Number Genesis）
 * 0 に十分な構造が蓄積されると、数体系 ℕ が生まれる。
 */
function axiomNumberGenesis(state: GenesisState): { to: GenesisPhase; axiom: string } | null {
  if (state.phase !== 'zero') return null;
  if (state.structure < STRUCTURE_THRESHOLD) return null;
  return { to: 'number', axiom: 'G-N₁: Number Genesis — 0 generates the number system ℕ' };
}

// --- Core ---

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

/**
 * evolve: 1ステップの進化
 *
 * [FIX-1] computeProgress は energized state から計算
 * [FIX-2] 遷移時に decay/growth を二重適用しない — energized をそのまま使用
 */
export function evolve(state: GenesisState, energy: number = 0.1): GenesisState {
  // Add curvature energy + apply decay/growth
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
    if (result) {
      // [FIX-1] progress computed from energized state
      const progress = computeProgress(energized);
      const threshold = CURVATURE_THRESHOLD; // simplified; per-axiom in full version
      const cs = evaluateCS(energized, energy);

      const t = enrichTransition(
        state.phase,       // from: original phase
        result.to,         // to: new phase
        energized,         // state: energized (FIX-1)
        result.axiom,
        threshold,
        progress,
        cs,
      );

      // [FIX-2] Use energized directly — no second decay/growth
      return Object.freeze({
        phase: result.to,
        curvature: energized.curvature,
        entropy: energized.entropy,
        structure: energized.structure,
        history: [...state.history, t],
        tick: energized.tick,
      });
    }
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
  csHolds: boolean;
  message: string;
} {
  const dotToZeroZero = state.history.filter(
    (t) => t.from === 'dot' && t.to === 'zero_zero'
  );
  const unique = dotToZeroZero.length <= 1;
  const csHolds = dotToZeroZero.every(t => t.witness.payload.cs.satisfied);
  const valid = unique && csHolds;
  return {
    valid,
    csHolds,
    message: valid
      ? `Theorem S₀ holds: unique transition ・ →G 0₀ (count=${dotToZeroZero.length}, CS=${csHolds})`
      : unique
        ? `Theorem S₀ conditional: transition unique but CS not satisfied`
        : `Theorem S₀ violated: multiple transitions ・ →G 0₀ (count=${dotToZeroZero.length})`,
  };
}

/**
 * Theorem S₁: Under Assumption CS,
 * the transition 0₀ →G 0 is unique.
 */
export function verifyTheoremS1(state: GenesisState): {
  valid: boolean;
  csHolds: boolean;
  message: string;
} {
  const zeroZeroToZero = state.history.filter(
    (t) => t.from === 'zero_zero' && t.to === 'zero'
  );
  const unique = zeroZeroToZero.length <= 1;
  const csHolds = zeroZeroToZero.every(t => t.witness.payload.cs.satisfied);
  const valid = unique && csHolds;
  return {
    valid,
    csHolds,
    message: valid
      ? `Theorem S₁ holds: unique transition 0₀ →G 0 (count=${zeroZeroToZero.length}, CS=${csHolds})`
      : unique
        ? `Theorem S₁ conditional: transition unique but CS not satisfied`
        : `Theorem S₁ violated: multiple transitions 0₀ →G 0 (count=${zeroZeroToZero.length})`,
  };
}

/**
 * verifyMonotonicity: Genesis の全遷移が単調前進であることを検証
 */
export function verifyMonotonicity(state: GenesisState): {
  valid: boolean;
  message: string;
} {
  for (const t of state.history) {
    const delta = phaseDelta(t.from, t.to);
    if (delta !== 1) {
      return {
        valid: false,
        message: `Monotonicity violated at tick ${t.tick}: ${t.from} → ${t.to} (δ=${delta})`,
      };
    }
  }
  return {
    valid: true,
    message: `Monotonicity holds: all ${state.history.length} transitions advance exactly one step`,
  };
}

/**
 * verifyAllWitnesses: 全 witness の整合性を検証
 * - hash が payload から再計算可能か
 * - kind が遷移元フェーズと一致するか
 * - progress ≥ 1.0（遷移した以上、臨界に到達しているはず）[FIX-1 の検証]
 */
export function verifyAllWitnesses(state: GenesisState): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  for (const t of state.history) {
    const w = t.witness;

    // Hash reproducibility check
    const expectedHash = fnv1a32(JSON.stringify(w.payload));
    if (w.hash !== expectedHash) {
      errors.push(`Tick ${t.tick}: hash mismatch (got ${w.hash}, expected ${expectedHash})`);
    }

    // Kind consistency check
    const expectedKind = witnessKindForPhase(t.from);
    if (w.kind !== expectedKind) {
      errors.push(`Tick ${t.tick}: kind mismatch (got ${w.kind}, expected ${expectedKind})`);
    }

    // [FIX-1 validation] Progress should be ≥ 1.0 for any completed transition
    // Exception: void → dot has no threshold requirement
    if (t.from !== 'void' && w.payload.progress < 1.0) {
      errors.push(`Tick ${t.tick}: progress < 1.0 (${w.payload.progress.toFixed(4)}) — transition occurred below threshold`);
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
