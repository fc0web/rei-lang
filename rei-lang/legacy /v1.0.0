// ============================================================
// Rei (0₀式) Irreversible Syntax Layer (ISL) v3
// 不可逆構文 — Φ（同型変換）/ Ψ（封印）/ Ω（履歴合成）
// D-FUMT Extension — Built on GA-v2
// Author: Nobuki Fujimoto
// ============================================================
//
// Design Principles:
//   変換 = プログラム
//   witness = 証拠
//   phaseDelta = 時間
//   firewall = 物理法則（段飛ばし不能）
//
//   この4つを「文法レベルで不可分」にする設計。
//
// ENH-1: DSL Unification
//   全変換（Φ/Ψ/Ω）は applyRule() を通る統一DSLルートで実行。
//   phiNormalize / psiCommit / omegaCompact は applyRule の薄いラッパー。
//
// ENH-2: Type-Level Stage Separation
//   Pipeline を OpenPipeline | SealedPipeline | CompactedPipeline の
//   判別共用体（discriminated union）として定義。
//   sealed後のΦ呼び出しは **コンパイル時にエラー** になる。
//   ランタイムチェックは defense-in-depth として残留。
//
//   Open  ──Φ──▶ Open  ──Ψ──▶ Sealed ──Ω──▶ Compacted
//   │              │              │              │
//   │ phiNormalize │              │ omegaCompact │
//   │ (何度でも)    │  psiCommit   │ (1回のみ)    │ Terminal
//   └──────────────┘              └──────────────┘
// ============================================================

import {
  type GenesisPhase,
  type GenesisState,
  type GenesisTransition,
  type Witness,
  type WitnessPayload,
  type CSAssumption,
  fnv1a32,
  phaseDelta,
  phaseIndex,
  verifyMonotonicity,
  verifyAllWitnesses,
} from './genesis-axioms-v2';

// ============================================================
// I. Mark System — 不可逆タグ（焼き付けの最小単位）
// ============================================================

export interface Mark {
  readonly id: string;
  readonly kind: MarkKind;
  readonly sourceHash: string;
  readonly resultHash: string;
  readonly tick: number;
  readonly parentMarkId: string | null;
}

export type MarkKind =
  | 'phi_normalize'
  | 'phi_desugar'
  | 'phi_inline'
  | 'psi_commit'
  | 'psi_freeze'
  | 'psi_publish'
  | 'omega_compact';

// ============================================================
// II. Invariant System — 保存すべき構造の宣言
// ============================================================

export interface InvariantCheck {
  readonly inv_ast: boolean;
  readonly inv_witness: boolean;
  readonly inv_phase: boolean;
  readonly details: string;
}

export function checkInvAST(
  before: GenesisState,
  after: GenesisState,
): boolean {
  if (before.history.length !== after.history.length) return false;
  for (let i = 0; i < before.history.length; i++) {
    if (before.history[i].from !== after.history[i].from) return false;
    if (before.history[i].to !== after.history[i].to) return false;
    if (before.history[i].witness.kind !== after.history[i].witness.kind) return false;
  }
  if (before.phase !== after.phase) return false;
  if (before.tick !== after.tick) return false;
  return true;
}

export function checkInvWitness(state: GenesisState): boolean {
  return verifyAllWitnesses(state).valid;
}

export function checkInvPhase(state: GenesisState): boolean {
  return verifyMonotonicity(state).valid;
}

export function checkAllInvariants(
  before: GenesisState,
  after: GenesisState,
): InvariantCheck {
  const inv_ast = checkInvAST(before, after);
  const inv_witness = checkInvWitness(after);
  const inv_phase = checkInvPhase(after);

  const failures: string[] = [];
  if (!inv_ast) failures.push('AST structure changed');
  if (!inv_witness) failures.push('witness integrity broken');
  if (!inv_phase) failures.push('phase monotonicity violated');

  return {
    inv_ast,
    inv_witness,
    inv_phase,
    details: failures.length === 0
      ? 'All invariants preserved'
      : `Invariant violations: ${failures.join(', ')}`,
  };
}

// ============================================================
// III. Transform Rule — 変換ルール構造体（Generic）
// ============================================================

export interface TransformRule<T> {
  readonly name: string;
  readonly kind: MarkKind;
  readonly pre: (input: T) => boolean;
  readonly post: (input: T, output: T) => boolean;
  readonly transform: (input: T) => T;
  readonly firewall: (input: T) => boolean;
}

// ============================================================
// IV. Type-Level Pipeline Stages — コンパイル時段階強制
// ============================================================

/**
 * [ENH-2] Pipeline stages as a discriminated union.
 *
 * TypeScript の型システムにより:
 *   phiNormalize(sealedPipeline)  → コンパイルエラー
 *   psiCommit(sealedPipeline)     → コンパイルエラー
 *   omegaCompact(openPipeline)    → コンパイルエラー
 */
export type PipelineStage = 'open' | 'sealed' | 'compacted';

interface PipelineBase {
  readonly original: GenesisState;
  readonly current: GenesisState;
  readonly records: readonly TransformRecord[];
  readonly markChain: readonly Mark[];
}

/** OpenPipeline: Φ適用可能、Ψで封印可能 */
export interface OpenPipeline extends PipelineBase {
  readonly stage: 'open';
}

/** SealedPipeline: Φ禁止、Ψ禁止、Ωのみ許可 */
export interface SealedPipeline extends PipelineBase {
  readonly stage: 'sealed';
  readonly sealProof: SealProof;
}

/** CompactedPipeline: 全変換禁止（終端） */
export interface CompactedPipeline extends PipelineBase {
  readonly stage: 'compacted';
  readonly sealProof: SealProof;
}

/** Pipeline = OpenPipeline | SealedPipeline | CompactedPipeline */
export type Pipeline = OpenPipeline | SealedPipeline | CompactedPipeline;

/**
 * @deprecated Use Pipeline (OpenPipeline | SealedPipeline | CompactedPipeline)
 */
export type TransformPipeline = Pipeline;

// ============================================================
// IV-b. Transform Records
// ============================================================

export interface TransformRecord {
  readonly ruleName: string;
  readonly mark: Mark;
  readonly invariants: InvariantCheck;
  readonly timestamp: number;
}

export function createPipeline(state: GenesisState): OpenPipeline {
  return {
    original: state,
    current: state,
    records: [],
    markChain: [],
    stage: 'open',
  };
}

// ============================================================
// V. Mark Generation
// ============================================================

let globalMarkCounter = 0;

export function resetMarkCounter(): void {
  globalMarkCounter = 0;
}

function generateMark(
  kind: MarkKind,
  before: GenesisState,
  after: GenesisState,
  parentMark: Mark | null,
): Mark {
  const tick = globalMarkCounter++;

  const beforeHistoryDigest = stateHistoryDigest(before);
  const afterHistoryDigest = stateHistoryDigest(after);

  const sourceHash = fnv1a32(JSON.stringify({
    phase: before.phase,
    curvature: before.curvature,
    entropy: before.entropy,
    structure: before.structure,
    historyLength: before.history.length,
    historyDigest: beforeHistoryDigest,
  }));
  const resultHash = fnv1a32(JSON.stringify({
    phase: after.phase,
    curvature: after.curvature,
    entropy: after.entropy,
    structure: after.structure,
    historyLength: after.history.length,
    historyDigest: afterHistoryDigest,
  }));

  return {
    id: `mark_${kind}_${tick}`,
    kind,
    sourceHash,
    resultHash,
    tick,
    parentMarkId: parentMark?.id ?? null,
  };
}

export function stateHistoryDigest(state: GenesisState): string {
  const summary = {
    phase: state.phase,
    tick: state.tick,
    history: state.history.map(t => ({
      from: t.from,
      to: t.to,
      kind: t.witness.kind,
      hash: t.witness.hash,
    })),
  };
  return fnv1a32(JSON.stringify(summary));
}

function roundTo(value: number, decimals: number): number {
  const factor = Math.pow(10, decimals);
  return Math.round(value * factor) / factor;
}

// ============================================================
// VI. PipelineRule DSL — 不可逆構文ルールの統一入口
// ============================================================

export interface PipelineRule {
  readonly name: string;
  readonly kind: MarkKind;
  readonly category: 'phi' | 'psi' | 'omega';
  readonly requires: (pipeline: Pipeline) => { ok: boolean; reason?: string };
  readonly pre: (state: GenesisState, original: GenesisState) => boolean;
  readonly apply: (state: GenesisState) => GenesisState;
  readonly post: (before: GenesisState, after: GenesisState, original: GenesisState) => InvariantCheck;
}

/**
 * applyRule: Rei の全変換はここを通す。
 *
 * [ENH-2] TypeScript 関数オーバーロード:
 *   applyRule(open,   phi_rule)   → OpenPipeline
 *   applyRule(open,   psi_rule)   → SealedPipeline
 *   applyRule(sealed, omega_rule) → CompactedPipeline
 *
 * 型が合わない組み合わせ → コンパイルエラー。
 * ランタイム requires チェックは defense-in-depth。
 */
export function applyRule(
  pipeline: OpenPipeline,
  rule: PipelineRule & { readonly category: 'phi' },
): OpenPipeline;
export function applyRule(
  pipeline: OpenPipeline,
  rule: PipelineRule & { readonly category: 'psi' },
): SealedPipeline;
export function applyRule(
  pipeline: SealedPipeline,
  rule: PipelineRule & { readonly category: 'omega' },
): CompactedPipeline;
export function applyRule(
  pipeline: Pipeline,
  rule: PipelineRule,
): Pipeline;
export function applyRule(
  pipeline: Pipeline,
  rule: PipelineRule,
): Pipeline {
  // 1. Firewall (runtime defense-in-depth)
  const req = rule.requires(pipeline);
  if (!req.ok) throw new Error(`${rule.name}: firewall — ${req.reason ?? 'blocked'}`);

  // 2. Precondition (S₀)
  const before = pipeline.current;
  if (!rule.pre(before, pipeline.original)) {
    throw new Error(`${rule.name}: precondition (S₀) failed`);
  }

  // 3. Transform
  const after = rule.apply(before);

  // 4. Postcondition (S₁)
  const invariants = rule.post(before, after, pipeline.original);
  if (!invariants.inv_ast || !invariants.inv_witness || !invariants.inv_phase) {
    throw new Error(`${rule.name}: invariant violation — ${invariants.details}`);
  }

  // 5. Mark
  const parentMark = pipeline.markChain.length > 0
    ? pipeline.markChain[pipeline.markChain.length - 1]
    : null;
  const mark = generateMark(rule.kind, before, after, parentMark);

  // 6. Record
  const record: TransformRecord = {
    ruleName: rule.name,
    mark,
    invariants,
    timestamp: Date.now(),
  };

  const base: PipelineBase & { records: readonly TransformRecord[]; markChain: readonly Mark[] } = {
    original: pipeline.original,
    current: after,
    records: [...pipeline.records, record],
    markChain: [...pipeline.markChain, mark],
  };

  // [ENH-2] Stage transition
  switch (rule.category) {
    case 'phi':
      return { ...base, stage: 'open' as const };

    case 'psi': {
      const state = after;
      const csHolds = state.history.every(t => t.witness.payload.cs.satisfied);
      const snapshot: StateSnapshot = {
        phase: state.phase,
        curvature: state.curvature,
        entropy: state.entropy,
        structure: state.structure,
        transitionCount: state.history.length,
        tick: state.tick,
      };
      const sealProof: SealProof = {
        sealMark: mark,
        stateAtSeal: snapshot,
        invariantsAtSeal: invariants,
        csAtSeal: csHolds,
        hash: fnv1a32(JSON.stringify({
          markId: mark.id,
          snapshot,
          invariants: {
            inv_ast: invariants.inv_ast,
            inv_witness: invariants.inv_witness,
            inv_phase: invariants.inv_phase,
          },
          csHolds,
        })),
      };
      return { ...base, stage: 'sealed' as const, sealProof };
    }

    case 'omega': {
      const sealProof = (pipeline as SealedPipeline).sealProof;
      return { ...base, stage: 'compacted' as const, sealProof };
    }
  }
}

// ============================================================
// VI-b. Built-in Rules (Φ/Ψ/Ω)
// ============================================================

const PRECISION = 10;

export const RULE_PHI_NORMALIZE: PipelineRule & { readonly category: 'phi' } = {
  name: 'Φ_normalize',
  kind: 'phi_normalize',
  category: 'phi',
  requires: (p) => {
    if (p.stage === 'sealed') return { ok: false, reason: 'cannot transform after seal (Ψ)' };
    if (p.stage === 'compacted') return { ok: false, reason: 'cannot transform after compaction (Ω)' };
    return { ok: true };
  },
  pre: () => true,
  apply: (state) => ({
    ...state,
    curvature: roundTo(state.curvature, PRECISION),
    entropy: roundTo(state.entropy, PRECISION),
    structure: roundTo(state.structure, PRECISION),
  }),
  post: (before, after) => checkAllInvariants(before, after),
};

export const RULE_PSI_COMMIT: PipelineRule & { readonly category: 'psi' } = {
  name: 'Ψ_commit',
  kind: 'psi_commit',
  category: 'psi',
  requires: (p) => {
    if (p.stage === 'sealed') return { ok: false, reason: 'already sealed — double seal is forbidden' };
    if (p.stage === 'compacted') return { ok: false, reason: 'cannot seal after compaction (Ω)' };
    return { ok: true };
  },
  pre: (_state, original) => {
    return checkInvWitness(original) && checkInvPhase(original);
  },
  apply: (state) => state,
  post: (_before, after, original) => {
    const inv = checkAllInvariants(original, after);
    if (!inv.inv_witness) return { ...inv, details: 'Invariant violations: witness integrity broken' };
    if (!inv.inv_phase) return { ...inv, details: 'Invariant violations: phase monotonicity violated' };
    return inv;
  },
};

export const RULE_OMEGA_COMPACT: PipelineRule & { readonly category: 'omega' } = {
  name: 'Ω_compact',
  kind: 'omega_compact',
  category: 'omega',
  requires: (p) => {
    if (p.stage === 'open') return { ok: false, reason: 'must be sealed (Ψ) before compaction' };
    if (p.stage === 'compacted') return { ok: false, reason: 'already compacted — double compaction is forbidden' };
    return { ok: true };
  },
  pre: () => true,
  apply: (state) => state,
  post: (before, after) => checkAllInvariants(before, after),
};

// ============================================================
// VII. Φ — 構造保存変換
// ============================================================

/** [ENH-2] OpenPipeline のみ受理 → sealed 後はコンパイルエラー */
export function phiNormalize(pipeline: OpenPipeline): OpenPipeline {
  return applyRule(pipeline, RULE_PHI_NORMALIZE);
}

// ============================================================
// VIII. Ψ — 不可逆"封印"変換
// ============================================================

export interface SealProof {
  readonly sealMark: Mark;
  readonly stateAtSeal: StateSnapshot;
  readonly invariantsAtSeal: InvariantCheck;
  readonly csAtSeal: boolean;
  readonly hash: string;
}

export interface StateSnapshot {
  readonly phase: GenesisPhase;
  readonly curvature: number;
  readonly entropy: number;
  readonly structure: number;
  readonly transitionCount: number;
  readonly tick: number;
}

/** [ENH-2] OpenPipeline → SealedPipeline。型が変わる。 */
export function psiCommit(pipeline: OpenPipeline): SealedPipeline {
  return applyRule(pipeline, RULE_PSI_COMMIT);
}

// ============================================================
// IX. Ω — 履歴合成
// ============================================================

export interface CompactProof {
  readonly compactMark: Mark;
  readonly originalHash: string;
  readonly finalHash: string;
  readonly transformCount: number;
  readonly markChainHashes: string[];
  readonly sealProofHash: string | null;
  readonly genesisTransitions: number;
  readonly phaseProgression: string;
  readonly allCSHeld: boolean;
  readonly hash: string;
}

function _omegaCompactFull(pipeline: SealedPipeline): {
  proof: CompactProof;
  compacted: CompactedPipeline;
} {
  const compacted = applyRule(pipeline, RULE_OMEGA_COMPACT);
  const state = compacted.current;

  const originalHash = fnv1a32(JSON.stringify({
    phase: pipeline.original.phase,
    curvature: pipeline.original.curvature,
    entropy: pipeline.original.entropy,
    structure: pipeline.original.structure,
  }));

  const finalHash = fnv1a32(JSON.stringify({
    phase: state.phase,
    curvature: state.curvature,
    entropy: state.entropy,
    structure: state.structure,
  }));

  const phases: string[] = state.history.length > 0
    ? [phaseToSymbol(state.history[0].from)]
    : [phaseToSymbol(pipeline.original.phase)];
  for (const t of state.history) {
    phases.push(phaseToSymbol(t.to));
  }
  const phaseProgression = phases.join('→');

  const allCSHeld = state.history.every(t => t.witness.payload.cs.satisfied);
  const compactMark = compacted.markChain[compacted.markChain.length - 1];
  const markChainHashes = compacted.markChain.map((m) =>
    fnv1a32(JSON.stringify({ id: m.id, kind: m.kind, sourceHash: m.sourceHash, resultHash: m.resultHash }))
  );

  const sealProofHash = pipeline.sealProof.hash;

  const proofBody = {
    compactMarkId: compactMark.id,
    originalHash,
    finalHash,
    transformCount: compacted.records.length,
    markChainHashes,
    sealProofHash,
    genesisTransitions: state.history.length,
    phaseProgression,
    allCSHeld,
  };

  return {
    proof: {
      compactMark,
      originalHash,
      finalHash,
      transformCount: compacted.records.length,
      markChainHashes,
      sealProofHash,
      genesisTransitions: state.history.length,
      phaseProgression,
      allCSHeld,
      hash: fnv1a32(JSON.stringify(proofBody)),
    },
    compacted,
  };
}

/** [ENH-2] SealedPipeline のみ受理。Open はコンパイルエラー。 */
export function omegaCompact(pipeline: SealedPipeline): CompactProof {
  return _omegaCompactFull(pipeline).proof;
}

function phaseToSymbol(phase: GenesisPhase): string {
  switch (phase) {
    case 'void': return 'void';
    case 'dot': return '・';
    case 'zero_zero': return '0₀';
    case 'zero': return '0';
    case 'number': return 'ℕ';
  }
}

// ============================================================
// X. Proof Verification
// ============================================================

export function verifySealProof(
  proof: SealProof,
  state: GenesisState,
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (proof.stateAtSeal.phase !== state.phase)
    errors.push(`Phase mismatch: proof=${proof.stateAtSeal.phase}, state=${state.phase}`);
  if (proof.stateAtSeal.transitionCount !== state.history.length)
    errors.push(`Transition count mismatch: proof=${proof.stateAtSeal.transitionCount}, state=${state.history.length}`);
  if (!proof.invariantsAtSeal.inv_witness)
    errors.push('Witness integrity was not satisfied at seal time');
  if (!proof.invariantsAtSeal.inv_phase)
    errors.push('Phase monotonicity was not satisfied at seal time');

  const expectedHash = fnv1a32(JSON.stringify({
    markId: proof.sealMark.id,
    snapshot: proof.stateAtSeal,
    invariants: {
      inv_ast: proof.invariantsAtSeal.inv_ast,
      inv_witness: proof.invariantsAtSeal.inv_witness,
      inv_phase: proof.invariantsAtSeal.inv_phase,
    },
    csHolds: proof.csAtSeal,
  }));
  if (proof.hash !== expectedHash)
    errors.push(`Seal proof hash mismatch: got ${proof.hash}, expected ${expectedHash}`);

  return { valid: errors.length === 0, errors };
}

export function verifyCompactProof(
  proof: CompactProof,
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  const proofBody = {
    compactMarkId: proof.compactMark.id,
    originalHash: proof.originalHash,
    finalHash: proof.finalHash,
    transformCount: proof.transformCount,
    markChainHashes: proof.markChainHashes,
    sealProofHash: proof.sealProofHash,
    genesisTransitions: proof.genesisTransitions,
    phaseProgression: proof.phaseProgression,
    allCSHeld: proof.allCSHeld,
  };
  const expectedHash = fnv1a32(JSON.stringify(proofBody));
  if (proof.hash !== expectedHash)
    errors.push(`Compact proof hash mismatch: got ${proof.hash}, expected ${expectedHash}`);

  if (proof.markChainHashes.length < 2)
    errors.push('Mark chain is too short — expected at least seal + compact marks');
  if (proof.genesisTransitions < 1)
    errors.push('No genesis transitions recorded');
  if (!proof.allCSHeld)
    errors.push('CS assumption was not satisfied for all transitions');

  return { valid: errors.length === 0, errors };
}

// ============================================================
// XI. Mark Chain Verification
// ============================================================

export function verifyMarkChain(marks: readonly Mark[]): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];
  for (let i = 0; i < marks.length; i++) {
    const mark = marks[i];
    if (i === 0) {
      if (mark.parentMarkId !== null)
        errors.push(`First mark should have no parent, got: ${mark.parentMarkId}`);
    } else {
      const expectedParentId = marks[i - 1].id;
      if (mark.parentMarkId !== expectedParentId)
        errors.push(`Mark ${mark.id}: parent mismatch — expected ${expectedParentId}, got ${mark.parentMarkId}`);
    }
    if (i > 0 && mark.tick <= marks[i - 1].tick)
      errors.push(`Mark ${mark.id}: tick not monotonic (${mark.tick} <= ${marks[i - 1].tick})`);
  }
  return { valid: errors.length === 0, errors };
}

// ============================================================
// XII. Full Pipeline Execution
// ============================================================

/**
 * [ENH-2] 型の遷移が明示的:
 *   OpenPipeline → (Φ) → OpenPipeline → (Ψ) → SealedPipeline → (Ω) → CompactedPipeline
 */
export function executeFullPipeline(
  state: GenesisState,
): {
  proof: CompactProof;
  sealProof: SealProof;
  pipeline: CompactedPipeline;
} {
  resetMarkCounter();
  const open: OpenPipeline = createPipeline(state);
  const normalized: OpenPipeline = phiNormalize(open);
  const sealed: SealedPipeline = psiCommit(normalized);
  const { proof, compacted } = _omegaCompactFull(sealed);

  return { proof, sealProof: sealed.sealProof, pipeline: compacted };
}
