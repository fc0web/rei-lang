// ============================================================
// Rei (0₀式) Irreversible Syntax Layer v2 (ISL-v2)
// 不可逆構文 — Φ（同型変換）/ Ψ（封印）/ Ω（履歴合成）
// D-FUMT Extension — Built on GA-v2
// Author: Nobuki Fujimoto
// ============================================================
//
// v2 Enhancements (from review recommendations):
//   [ENH-1] applyRule DSL — all transforms go through TransformRule
//   [ENH-2] Type-level pipeline phases — Open/Sealed/Compacted
//   [ENH-3] Triangle coherence — markChain ⇔ history ⇔ witness
//   [ENH-4] Ψ_publish — irreversible publish primitive
//
// Design Principles:
//   変換 = プログラム     (TransformRule)
//   witness = 証拠        (Witness + Mark)
//   phaseDelta = 時間     (monotonic tick)
//   firewall = 物理法則   (type-level + runtime)
//
//   この4つを「文法レベルで不可分」にする設計。
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
    inv_ast, inv_witness, inv_phase,
    details: failures.length === 0
      ? 'All invariants preserved'
      : `Invariant violations: ${failures.join(', ')}`,
  };
}

// ============================================================
// III. [ENH-2] Type-Level Pipeline Phases
// ============================================================

export type PipelinePhase = 'open' | 'sealed' | 'compacted';

export interface TransformRecord {
  readonly ruleName: string;
  readonly mark: Mark;
  readonly invariants: InvariantCheck;
  readonly timestamp: number;
}

export interface Pipeline<P extends PipelinePhase> {
  readonly _phase: P;
  readonly original: GenesisState;
  readonly current: GenesisState;
  readonly records: readonly TransformRecord[];
  readonly markChain: readonly Mark[];
  readonly sealProof: P extends 'sealed' | 'compacted' ? SealProof : undefined;
  readonly publishProof: P extends 'sealed' | 'compacted' ? PublishProof | undefined : undefined;
}

// Legacy alias
export type TransformPipeline = Pipeline<'open'> | Pipeline<'sealed'> | Pipeline<'compacted'>;

// ============================================================
// IV. [ENH-1] TransformRule DSL
// ============================================================

export interface TransformRule {
  readonly name: string;
  readonly kind: MarkKind;
  readonly category: 'phi' | 'psi' | 'omega';
  readonly requires: (pipeline: Pipeline<any>) => { ok: boolean; reason?: string };
  readonly pre: (state: GenesisState, original: GenesisState) => boolean;
  readonly apply: (state: GenesisState) => GenesisState;
  readonly post: (before: GenesisState, after: GenesisState, original: GenesisState) => InvariantCheck;
}

export function applyRule<P extends PipelinePhase>(
  pipeline: Pipeline<P>,
  rule: TransformRule,
): Pipeline<P> {
  const req = rule.requires(pipeline);
  if (!req.ok) {
    throw new Error(`${rule.name}: ${req.reason}`);
  }
  if (!rule.pre(pipeline.current, pipeline.original)) {
    throw new Error(`${rule.name}: pre-condition (S₀) failed`);
  }
  const before = pipeline.current;
  const after = rule.apply(before);
  const invariants = rule.post(before, after, pipeline.original);
  const parentMark = pipeline.markChain.length > 0
    ? pipeline.markChain[pipeline.markChain.length - 1]
    : null;
  const mark = generateMark(rule.kind, before, after, parentMark);
  const record: TransformRecord = {
    ruleName: rule.name,
    mark,
    invariants,
    timestamp: Date.now(),
  };
  return {
    ...pipeline,
    current: after,
    records: [...pipeline.records, record],
    markChain: [...pipeline.markChain, mark],
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
  const beforeDigest = stateHistoryDigest(before);
  const afterDigest = stateHistoryDigest(after);
  const sourceHash = fnv1a32(JSON.stringify({
    phase: before.phase,
    curvature: before.curvature,
    entropy: before.entropy,
    structure: before.structure,
    historyLength: before.history.length,
    historyDigest: beforeDigest,
  }));
  const resultHash = fnv1a32(JSON.stringify({
    phase: after.phase,
    curvature: after.curvature,
    entropy: after.entropy,
    structure: after.structure,
    historyLength: after.history.length,
    historyDigest: afterDigest,
  }));
  return {
    id: `mark_${kind}_${tick}`,
    kind, sourceHash, resultHash, tick,
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

// ============================================================
// VI. Built-in Rules
// ============================================================

function roundTo(value: number, decimals: number): number {
  const factor = Math.pow(10, decimals);
  return Math.round(value * factor) / factor;
}

export const RULE_PHI_NORMALIZE: TransformRule = {
  name: 'Φ_normalize',
  kind: 'phi_normalize',
  category: 'phi',
  requires: (pipeline) => {
    if (pipeline._phase === 'sealed') return { ok: false, reason: 'cannot transform after seal (Ψ)' };
    if (pipeline._phase === 'compacted') return { ok: false, reason: 'cannot transform after compaction (Ω)' };
    return { ok: true };
  },
  pre: () => true,
  apply: (state) => ({
    ...state,
    curvature: roundTo(state.curvature, 10),
    entropy: roundTo(state.entropy, 10),
    structure: roundTo(state.structure, 10),
  }),
  post: (_before, after, original) => {
    const inv = checkAllInvariants(original, after);
    if (!inv.inv_ast || !inv.inv_witness || !inv.inv_phase) {
      throw new Error(`Φ_normalize: invariant violation — ${inv.details}`);
    }
    return inv;
  },
};

export const RULE_PSI_COMMIT: TransformRule = {
  name: 'Ψ_commit',
  kind: 'psi_commit',
  category: 'psi',
  requires: (pipeline) => {
    if (pipeline._phase === 'sealed') return { ok: false, reason: 'already sealed — double seal is forbidden' };
    if (pipeline._phase === 'compacted') return { ok: false, reason: 'cannot seal after compaction (Ω)' };
    return { ok: true };
  },
  pre: () => true,
  apply: (state) => state,
  post: (_before, after, original) => {
    const inv = checkAllInvariants(original, after);
    if (!inv.inv_witness) throw new Error('Ψ_commit: witness integrity must hold before seal');
    if (!inv.inv_phase) throw new Error('Ψ_commit: phase monotonicity must hold before seal');
    return inv;
  },
};

export const RULE_PSI_PUBLISH: TransformRule = {
  name: 'Ψ_publish',
  kind: 'psi_publish',
  category: 'psi',
  requires: (pipeline) => {
    if (pipeline._phase !== 'sealed') return { ok: false, reason: 'must be sealed (Ψ_commit) before publish' };
    if ((pipeline as any).publishProof !== undefined &&
        (pipeline as any).publishProof !== null) {
      return { ok: false, reason: 'already published — double publish is forbidden' };
    }
    return { ok: true };
  },
  pre: (state) => state.history.every(t => t.witness.payload.cs.satisfied),
  apply: (state) => state,
  post: (_before, after, original) => checkAllInvariants(original, after),
};

// ============================================================
// VII. Pipeline Creation & Typed Transitions
// ============================================================

export function createPipeline(state: GenesisState): Pipeline<'open'> {
  return {
    _phase: 'open',
    original: state,
    current: state,
    records: [],
    markChain: [],
    sealProof: undefined as any,
    publishProof: undefined as any,
  };
}

export function phiNormalize(pipeline: Pipeline<'open'>): Pipeline<'open'> {
  return applyRule(pipeline, RULE_PHI_NORMALIZE);
}

// ============================================================
// VIII. Ψ — Seal
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

export function psiCommit(pipeline: Pipeline<'open'>): Pipeline<'sealed'> {
  const applied = applyRule(pipeline, RULE_PSI_COMMIT);
  const state = applied.current;
  const csHolds = state.history.every(t => t.witness.payload.cs.satisfied);
  const invariants = checkAllInvariants(pipeline.original, state);
  const sealMark = applied.markChain[applied.markChain.length - 1];
  const snapshot: StateSnapshot = {
    phase: state.phase,
    curvature: state.curvature,
    entropy: state.entropy,
    structure: state.structure,
    transitionCount: state.history.length,
    tick: state.tick,
  };
  const sealProof: SealProof = {
    sealMark,
    stateAtSeal: snapshot,
    invariantsAtSeal: invariants,
    csAtSeal: csHolds,
    hash: fnv1a32(JSON.stringify({
      markId: sealMark.id,
      snapshot,
      invariants: {
        inv_ast: invariants.inv_ast,
        inv_witness: invariants.inv_witness,
        inv_phase: invariants.inv_phase,
      },
      csHolds,
    })),
  };
  return {
    _phase: 'sealed',
    original: applied.original,
    current: applied.current,
    records: applied.records,
    markChain: applied.markChain,
    sealProof,
    publishProof: undefined,
  };
}

// ============================================================
// IX. [ENH-4] Ψ_publish — Irreversible Publish
// ============================================================

export interface PublishProof {
  readonly publishMark: Mark;
  readonly stateAtPublish: StateSnapshot;
  readonly sealProofHash: string;
  readonly genesisDigest: string;
  readonly allCSHeld: boolean;
  readonly hash: string;
}

export function psiPublish(pipeline: Pipeline<'sealed'>): Pipeline<'sealed'> {
  if (pipeline.publishProof !== undefined && pipeline.publishProof !== null) {
    throw new Error('Ψ_publish: already published — double publish is forbidden');
  }

  const applied = applyRule(pipeline, RULE_PSI_PUBLISH);
  const state = applied.current;
  const csHolds = state.history.every(t => t.witness.payload.cs.satisfied);
  const publishMark = applied.markChain[applied.markChain.length - 1];
  const snapshot: StateSnapshot = {
    phase: state.phase,
    curvature: state.curvature,
    entropy: state.entropy,
    structure: state.structure,
    transitionCount: state.history.length,
    tick: state.tick,
  };
  const genesisDigest = stateHistoryDigest(state);
  const publishProof: PublishProof = {
    publishMark,
    stateAtPublish: snapshot,
    sealProofHash: pipeline.sealProof.hash,
    genesisDigest,
    allCSHeld: csHolds,
    hash: fnv1a32(JSON.stringify({
      markId: publishMark.id,
      snapshot,
      sealProofHash: pipeline.sealProof.hash,
      genesisDigest,
      csHolds,
    })),
  };
  return {
    _phase: 'sealed',
    original: applied.original,
    current: applied.current,
    records: applied.records,
    markChain: applied.markChain,
    sealProof: pipeline.sealProof,
    publishProof,
  };
}

// ============================================================
// X. Ω — History Composition
// ============================================================

export interface CompactProof {
  readonly compactMark: Mark;
  readonly originalHash: string;
  readonly finalHash: string;
  readonly transformCount: number;
  readonly markChainHashes: string[];
  readonly sealProofHash: string | null;
  readonly publishProofHash: string | null;
  readonly genesisTransitions: number;
  readonly phaseProgression: string;
  readonly allCSHeld: boolean;
  readonly historyDigest: string;
  readonly hash: string;
}

export function omegaCompact(pipeline: Pipeline<'sealed'>): CompactProof {
  // Runtime firewall: must be sealed
  if ((pipeline as any)._phase !== 'sealed') {
    throw new Error('Ω_compact: must be sealed (Ψ) before compaction');
  }
  const state = pipeline.current;
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
  const markChainHashes = pipeline.markChain.map(m =>
    fnv1a32(JSON.stringify({ id: m.id, kind: m.kind, sourceHash: m.sourceHash, resultHash: m.resultHash }))
  );
  const phases: string[] = state.history.length > 0
    ? [phaseToSymbol(state.history[0].from)]
    : [phaseToSymbol(pipeline.original.phase)];
  for (const t of state.history) {
    phases.push(phaseToSymbol(t.to));
  }
  const phaseProgression = phases.join('→');
  const allCSHeld = state.history.every(t => t.witness.payload.cs.satisfied);
  const historyDigest = stateHistoryDigest(state);
  const parentMark = pipeline.markChain.length > 0
    ? pipeline.markChain[pipeline.markChain.length - 1]
    : null;
  const compactMark = generateMark('omega_compact', state, state, parentMark);
  const compactMarkHash = fnv1a32(JSON.stringify({
    id: compactMark.id, kind: compactMark.kind,
    sourceHash: compactMark.sourceHash, resultHash: compactMark.resultHash,
  }));
  markChainHashes.push(compactMarkHash);
  const sealProofHash = pipeline.sealProof?.hash ?? null;
  const publishProofHash = pipeline.publishProof?.hash ?? null;
  const proofBody = {
    compactMarkId: compactMark.id,
    originalHash, finalHash,
    transformCount: pipeline.records.length,
    markChainHashes, sealProofHash, publishProofHash,
    genesisTransitions: state.history.length,
    phaseProgression, allCSHeld, historyDigest,
  };
  return {
    compactMark, originalHash, finalHash,
    transformCount: pipeline.records.length,
    markChainHashes, sealProofHash, publishProofHash,
    genesisTransitions: state.history.length,
    phaseProgression, allCSHeld, historyDigest,
    hash: fnv1a32(JSON.stringify(proofBody)),
  };
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
// XI. Proof Verification
// ============================================================

export function verifySealProof(
  proof: SealProof, state: GenesisState,
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  if (proof.stateAtSeal.phase !== state.phase) {
    errors.push(`Phase mismatch: proof=${proof.stateAtSeal.phase}, state=${state.phase}`);
  }
  if (proof.stateAtSeal.transitionCount !== state.history.length) {
    errors.push(`Transition count mismatch: proof=${proof.stateAtSeal.transitionCount}, state=${state.history.length}`);
  }
  if (!proof.invariantsAtSeal.inv_witness) {
    errors.push('Witness integrity was not satisfied at seal time');
  }
  if (!proof.invariantsAtSeal.inv_phase) {
    errors.push('Phase monotonicity was not satisfied at seal time');
  }
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
  if (proof.hash !== expectedHash) {
    errors.push(`Seal proof hash mismatch: got ${proof.hash}, expected ${expectedHash}`);
  }
  return { valid: errors.length === 0, errors };
}

export function verifyPublishProof(
  proof: PublishProof, state: GenesisState, sealProofHash: string,
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  if (proof.stateAtPublish.phase !== state.phase) {
    errors.push(`Phase mismatch: proof=${proof.stateAtPublish.phase}, state=${state.phase}`);
  }
  if (proof.sealProofHash !== sealProofHash) {
    errors.push(`Seal proof hash mismatch`);
  }
  const expectedDigest = stateHistoryDigest(state);
  if (proof.genesisDigest !== expectedDigest) {
    errors.push(`Genesis digest mismatch`);
  }
  const expectedHash = fnv1a32(JSON.stringify({
    markId: proof.publishMark.id,
    snapshot: proof.stateAtPublish,
    sealProofHash: proof.sealProofHash,
    genesisDigest: proof.genesisDigest,
    csHolds: proof.allCSHeld,
  }));
  if (proof.hash !== expectedHash) {
    errors.push(`Publish proof hash mismatch: got ${proof.hash}, expected ${expectedHash}`);
  }
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
    publishProofHash: proof.publishProofHash,
    genesisTransitions: proof.genesisTransitions,
    phaseProgression: proof.phaseProgression,
    allCSHeld: proof.allCSHeld,
    historyDigest: proof.historyDigest,
  };
  const expectedHash = fnv1a32(JSON.stringify(proofBody));
  if (proof.hash !== expectedHash) {
    errors.push(`Compact proof hash mismatch: got ${proof.hash}, expected ${expectedHash}`);
  }
  if (proof.markChainHashes.length < 1) {
    errors.push('Mark chain is empty');
  }
  if (proof.genesisTransitions < 1) {
    errors.push('No genesis transitions recorded');
  }
  if (!proof.allCSHeld) {
    errors.push('CS assumption was not satisfied for all transitions');
  }
  return { valid: errors.length === 0, errors };
}

// ============================================================
// XII. Mark Chain Verification
// ============================================================

export function verifyMarkChain(marks: readonly Mark[]): {
  valid: boolean; errors: string[];
} {
  const errors: string[] = [];
  for (let i = 0; i < marks.length; i++) {
    const mark = marks[i];
    if (i === 0) {
      if (mark.parentMarkId !== null) {
        errors.push(`First mark should have no parent, got: ${mark.parentMarkId}`);
      }
    } else {
      const expectedParentId = marks[i - 1].id;
      if (mark.parentMarkId !== expectedParentId) {
        errors.push(`Mark ${mark.id}: parent mismatch — expected ${expectedParentId}, got ${mark.parentMarkId}`);
      }
    }
    if (i > 0 && mark.tick <= marks[i - 1].tick) {
      errors.push(`Mark ${mark.id}: tick not monotonic (${mark.tick} <= ${marks[i - 1].tick})`);
    }
  }
  return { valid: errors.length === 0, errors };
}

// ============================================================
// XIII. [ENH-3] Triangle Coherence Verification
// ============================================================

export interface TriangleCoherence {
  readonly valid: boolean;
  readonly markChainValid: boolean;
  readonly historyWitnessValid: boolean;
  readonly markHistoryBound: boolean;
  readonly errors: string[];
}

export function verifyTriangleCoherence(
  pipeline: Pipeline<'sealed'>,
  proof?: CompactProof,
): TriangleCoherence {
  const errors: string[] = [];

  // 1. Mark chain integrity
  const markResult = verifyMarkChain(pipeline.markChain);
  if (!markResult.valid) {
    errors.push(...markResult.errors.map(e => `[markChain] ${e}`));
  }

  // 2. History ⇔ Witness integrity
  const witnessResult = verifyAllWitnesses(pipeline.current);
  if (!witnessResult.valid) {
    errors.push(...witnessResult.errors.map(e => `[witness] ${e}`));
  }

  // 3. Mark ⇔ History binding
  let markHistoryBound = true;
  if (pipeline.markChain.length > 0) {
    const firstMark = pipeline.markChain[0];
    const expectedSourceHash = fnv1a32(JSON.stringify({
      phase: pipeline.original.phase,
      curvature: pipeline.original.curvature,
      entropy: pipeline.original.entropy,
      structure: pipeline.original.structure,
      historyLength: pipeline.original.history.length,
      historyDigest: stateHistoryDigest(pipeline.original),
    }));
    if (firstMark.sourceHash !== expectedSourceHash) {
      errors.push(`[binding] First mark sourceHash doesn't match original state`);
      markHistoryBound = false;
    }
    const lastMark = pipeline.markChain[pipeline.markChain.length - 1];
    const expectedResultHash = fnv1a32(JSON.stringify({
      phase: pipeline.current.phase,
      curvature: pipeline.current.curvature,
      entropy: pipeline.current.entropy,
      structure: pipeline.current.structure,
      historyLength: pipeline.current.history.length,
      historyDigest: stateHistoryDigest(pipeline.current),
    }));
    if (lastMark.resultHash !== expectedResultHash) {
      errors.push(`[binding] Last mark resultHash doesn't match current state`);
      markHistoryBound = false;
    }
  }

  // 4. Proof ⇔ History digest
  if (proof) {
    const currentDigest = stateHistoryDigest(pipeline.current);
    if (proof.historyDigest !== currentDigest) {
      errors.push(`[proof] historyDigest mismatch`);
    }
  }

  return {
    valid: errors.length === 0,
    markChainValid: markResult.valid,
    historyWitnessValid: witnessResult.valid,
    markHistoryBound,
    errors,
  };
}

// ============================================================
// XIV. Full Pipeline Execution
// ============================================================

export function executeFullPipeline(state: GenesisState): {
  proof: CompactProof;
  sealProof: SealProof;
  pipeline: Pipeline<'sealed'>;
} {
  resetMarkCounter();
  let open = createPipeline(state);
  open = phiNormalize(open);
  const sealed = psiCommit(open);
  const proof = omegaCompact(sealed);
  return { proof, sealProof: sealed.sealProof, pipeline: sealed };
}

export function executePublishPipeline(state: GenesisState): {
  proof: CompactProof;
  sealProof: SealProof;
  publishProof: PublishProof;
  pipeline: Pipeline<'sealed'>;
} {
  resetMarkCounter();
  let open = createPipeline(state);
  open = phiNormalize(open);
  const sealed = psiCommit(open);
  const published = psiPublish(sealed);
  const proof = omegaCompact(published);
  return {
    proof,
    sealProof: sealed.sealProof,
    publishProof: published.publishProof!,
    pipeline: published,
  };
}
