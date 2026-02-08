// ============================================================
// Rei (0₀式) Irreversible Syntax Layer (ISL)
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
// MVP Implementation:
//   - Invariant definitions (inv_ast, inv_witness, inv_phase)
//   - Φ_normalize (structure-preserving normalization)
//   - Ψ_commit (irreversible seal)
//   - Ω_compact (history composition into proof)
//
// ENH-1: DSL Unification
//   全変換（Φ/Ψ/Ω）は applyRule() を通る統一DSLルートで実行。
//   phiNormalize / psiCommit / omegaCompact は applyRule の薄いラッパー。
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

/**
 * Mark: 「この構造は、この経路で、ここまで来た」という焼印。
 *
 * 不可逆 = "復元不能"ではなく、
 * "復元したいなら同じ経路を再現せよ（しかも検証される）"
 */
export interface Mark {
  readonly id: string;              // unique mark identifier
  readonly kind: MarkKind;
  readonly sourceHash: string;      // hash of input state
  readonly resultHash: string;      // hash of output state
  readonly tick: number;            // monotonic timestamp
  readonly parentMarkId: string | null;  // chain of marks (firewall)
}

export type MarkKind =
  | 'phi_normalize'     // Φ: 同型変換
  | 'phi_desugar'       // Φ: 脱糖衣
  | 'phi_inline'        // Φ: インライン展開
  | 'psi_commit'        // Ψ: 封印
  | 'psi_freeze'        // Ψ: 凍結
  | 'psi_publish'       // Ψ: 公開
  | 'omega_compact';    // Ω: 履歴合成

// ============================================================
// II. Invariant System — 保存すべき構造の宣言
// ============================================================

/**
 * 3層のInvariant:
 *   inv_ast      位相（形）：接続・依存関係
 *   inv_witness   意味（証拠）：witness の整合性、CSの整合
 *   inv_phase     進行（時間）：phaseDelta の単調性、段飛ばし禁止
 *
 * Reiの変換は常に:
 *   形は変わっていい（糖衣構文・最適化・正規化）
 *   でも証拠と単調性と段階は壊せない
 */

export interface InvariantCheck {
  readonly inv_ast: boolean;
  readonly inv_witness: boolean;
  readonly inv_phase: boolean;
  readonly details: string;
}

/**
 * inv_ast: AST構造の保存検証
 *
 * 構造保存 = 遷移の数・順序・from/to が一致
 * （形の変換は許容するが、骨格は保つ）
 */

export function checkInvAST(
  before: GenesisState,
  after: GenesisState,
): boolean {
  // Transition count must be preserved
  if (before.history.length !== after.history.length) return false;

  // Each transition's skeleton (from/to) must match
  // and witness kind must not change (prevents kind-swapping attacks).
  for (let i = 0; i < before.history.length; i++) {
    if (before.history[i].from !== after.history[i].from) return false;
    if (before.history[i].to !== after.history[i].to) return false;
    if (before.history[i].witness.kind !== after.history[i].witness.kind) return false;
  }

  // Phase must be the same
  if (before.phase !== after.phase) return false;

  // Tick should not be mutated by Φ-style representation transforms.
  if (before.tick !== after.tick) return false;

  return true;
}

/**
 * inv_witness: witness の整合性検証
 *
 * 変換後の witness' は witness から導出される（新規捏造禁止）
 * hash が payload から再計算可能であること
 */
export function checkInvWitness(state: GenesisState): boolean {
  const result = verifyAllWitnesses(state);
  return result.valid;
}

/**
 * inv_phase: phaseDelta の単調性検証
 *
 * 全遷移が前進（δ=1）であること
 */
export function checkInvPhase(state: GenesisState): boolean {
  const result = verifyMonotonicity(state);
  return result.valid;
}

/**
 * checkAllInvariants: 3層すべてのInvariant を一括検証
 */
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
// III. Transform Rule — 変換ルール構造体
// ============================================================

/**
 * TransformRule: Reiの変換は「変換＋証拠＋単調性」を書く
 *
 * rule:     変換ルール本体
 * pre:      適用条件（S₀で判定可能）
 * post:     結果条件（S₁で検証可能）
 * mark:     不可逆タグ生成
 * witness:  hash/payload/CS の更新関数
 * firewall: 適用可能条件
 */
export interface TransformRule<T> {
  readonly name: string;
  readonly kind: MarkKind;
  readonly pre: (input: T) => boolean;
  readonly post: (input: T, output: T) => boolean;
  readonly transform: (input: T) => T;
  readonly firewall: (input: T) => boolean;
}

// ============================================================
// IV. Transform Pipeline — 変換パイプライン
// ============================================================

/**
 * TransformRecord: 変換の実行記録（証拠込み）
 */
export interface TransformRecord {
  readonly ruleName: string;
  readonly mark: Mark;
  readonly invariants: InvariantCheck;
  readonly timestamp: number;
}

/**
 * TransformPipeline: 変換の連鎖を管理し、証拠を蓄積
 */
export interface TransformPipeline {
  readonly original: GenesisState;
  readonly current: GenesisState;
  readonly records: readonly TransformRecord[];
  readonly sealed: boolean;          // Ψ 後は true
  readonly compacted: boolean;       // Ω 後は true
  readonly markChain: readonly Mark[];
}

/**
 * createPipeline: 新規パイプラインの生成
 */
export function createPipeline(state: GenesisState): TransformPipeline {
  return {
    original: state,
    current: state,
    records: [],
    sealed: false,
    compacted: false,
    markChain: [],
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

/**
 * stateHistoryDigest: cheap, stable digest of the Genesis derivation history.
 *
 * Design goal:
 * - Include enough information so that changing history content changes the digest.
 * - Avoid embedding full payloads (size) while still binding to witness+topology.
 */
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
// V-b. Utility
// ============================================================

function roundTo(value: number, decimals: number): number {
  const factor = Math.pow(10, decimals);
  return Math.round(value * factor) / factor;
}

// ============================================================
// VI. PipelineRule DSL — 不可逆構文ルールの統一入口
// ============================================================

/**
 * PipelineRule: TransformPipeline 上で動く「不可逆構文ルール」。
 *
 * - requires: firewall（sealed/compacted等の状態制約）
 * - pre:      S₀（state と original を参照して判定可能）
 * - apply:    状態変換（GenesisState を返す）
 * - post:     S₁（InvariantCheck を返す）
 */
export interface PipelineRule {
  readonly name: string;
  readonly kind: MarkKind;
  readonly category: 'phi' | 'psi' | 'omega';
  readonly requires: (pipeline: TransformPipeline) => { ok: boolean; reason?: string };
  readonly pre: (state: GenesisState, original: GenesisState) => boolean;
  readonly apply: (state: GenesisState) => GenesisState;
  readonly post: (before: GenesisState, after: GenesisState, original: GenesisState) => InvariantCheck;
}

/**
 * applyRule: Rei の全変換はここを通す（関数直呼びを避け、DSL化する）。
 *
 * 統一フロー: requires → pre → apply → post → mark → record
 * バイパス不可能。
 */
export function applyRule(
  pipeline: TransformPipeline,
  rule: PipelineRule,
): TransformPipeline & { sealProof?: SealProof } {
  // 1. Firewall
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

  let sealed = pipeline.sealed;
  let sealProof: SealProof | undefined = undefined;

  // Ψ-specific: generate SealProof
  if (rule.category === 'psi') {
    sealed = true;

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

    sealProof = {
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
  }

  return {
    ...pipeline,
    current: after,
    records: [...pipeline.records, record],
    sealed,
    markChain: [...pipeline.markChain, mark],
    ...(sealProof ? { sealProof } : {}),
  };
}

// ============================================================
// VI-b. Built-in Rules (Φ/Ψ/Ω)
// ============================================================

const PRECISION = 10;  // decimal places for normalization

export const RULE_PHI_NORMALIZE: PipelineRule = {
  name: 'Φ_normalize',
  kind: 'phi_normalize',
  category: 'phi',
  requires: (p) => {
    if (p.sealed) return { ok: false, reason: 'cannot transform after seal (Ψ)' };
    if (p.compacted) return { ok: false, reason: 'cannot transform after compaction (Ω)' };
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

export const RULE_PSI_COMMIT: PipelineRule = {
  name: 'Ψ_commit',
  kind: 'psi_commit',
  category: 'psi',
  requires: (p) => {
    if (p.sealed) return { ok: false, reason: 'already sealed — double seal is forbidden' };
    if (p.compacted) return { ok: false, reason: 'cannot seal after compaction (Ω)' };
    return { ok: true };
  },
  pre: (_state, original) => {
    // original must be internally consistent before seal.
    return checkInvWitness(original) && checkInvPhase(original);
  },
  apply: (state) => state,  // Ψ does not transform state — it seals
  post: (_before, after, original) => {
    const inv = checkAllInvariants(original, after);
    if (!inv.inv_witness) {
      return { ...inv, details: `Invariant violations: witness integrity broken` };
    }
    if (!inv.inv_phase) {
      return { ...inv, details: `Invariant violations: phase monotonicity violated` };
    }
    return inv;
  },
};

export const RULE_OMEGA_COMPACT: PipelineRule = {
  name: 'Ω_compact',
  kind: 'omega_compact',
  category: 'omega',
  requires: (p) => {
    if (!p.sealed) return { ok: false, reason: 'must be sealed (Ψ) before compaction' };
    if (p.compacted) return { ok: false, reason: 'already compacted — double compaction is forbidden' };
    return { ok: true };
  },
  pre: () => true,
  apply: (state) => state,  // Ω compacts records, not state
  post: (before, after) => checkAllInvariants(before, after),
};

// ============================================================
// VII. Φ — 構造保存変換（同型変換）
// ============================================================

/**
 * Φ（Phi）: 表現を変える（最適化/正規化/糖衣⇔展開）
 *
 * 条件:
 *   inv(AST), inv(witness), inv(phase) が保たれる
 *   変換後の witness' は witness から導出される（新規捏造禁止）
 *
 * 形は変わっていい。でも証拠と単調性と段階は壊せない。
 *
 * [ENH-1] 内部で applyRule(pipeline, RULE_PHI_NORMALIZE) を呼ぶ。
 * 外部APIは完全互換。
 */
export function phiNormalize(pipeline: TransformPipeline): TransformPipeline {
  return applyRule(pipeline, RULE_PHI_NORMALIZE);
}

// ============================================================
// VIII. Ψ — 不可逆"封印"変換（seal）
// ============================================================

/**
 * Ψ（Psi）: 以後の変換自由度を意図的に狭める
 *
 * seal すると、以後は:
 *   - Φ（同型変換）が構文的に禁止される
 *   - 追加の Ψ も禁止（二重封印不可）
 *   - Ω（履歴合成）のみが許可される
 *
 * seal は必ず mark を生成し、
 * firewall が seal を要求する段階を作れる。
 *
 * 「Reiでしか書けない」感が出る核心:
 * 普通の言語だと"規約"でやるところを、文法で強制する。
 *
 * [ENH-1] 内部で applyRule(pipeline, RULE_PSI_COMMIT) を呼ぶ。
 */

export interface SealProof {
  readonly sealMark: Mark;
  readonly stateAtSeal: StateSnapshot;
  readonly invariantsAtSeal: InvariantCheck;
  readonly csAtSeal: boolean;         // CS assumption held at seal time
  readonly hash: string;              // hash of the seal proof itself
}

export interface StateSnapshot {
  readonly phase: GenesisPhase;
  readonly curvature: number;
  readonly entropy: number;
  readonly structure: number;
  readonly transitionCount: number;
  readonly tick: number;
}

export function psiCommit(pipeline: TransformPipeline): TransformPipeline & { sealProof: SealProof } {
  const result = applyRule(pipeline, RULE_PSI_COMMIT);
  if (!result.sealProof) {
    // This should never happen if RULE_PSI_COMMIT is correctly categorized as 'psi'
    throw new Error('Ψ_commit: internal error — sealProof not generated');
  }
  return result as TransformPipeline & { sealProof: SealProof };
}

// ============================================================
// IX. Ω — 履歴合成（History Composition）
// ============================================================

/**
 * Ω（Omega）: 変換列を1つの証明オブジェクトに圧縮する（不可逆）
 *
 * 変換列 t1; t2; ...; tn を Ω(t1..tn) に畳む
 * 畳むと個々の中間表現は捨てる（= 不可逆）
 * ただし検証はできる（witness で"畳んだ事実"を証明）
 *
 * これにより Rei は「変換そのものを第一級の証拠」として扱える。
 *
 * [ENH-1] applyRule(pipeline, RULE_OMEGA_COMPACT) で mark/record を統一生成し、
 * その上で CompactProof を構築する。
 */

export interface CompactProof {
  readonly compactMark: Mark;
  readonly originalHash: string;       // hash of original state
  readonly finalHash: string;          // hash of final state
  readonly transformCount: number;     // number of transforms compacted
  readonly markChainHashes: string[];  // ordered hashes from mark chain
  readonly sealProofHash: string | null;  // hash of seal proof if sealed
  readonly genesisTransitions: number; // number of genesis transitions
  readonly phaseProgression: string;   // "void→dot→0₀→0→ℕ" etc.
  readonly allCSHeld: boolean;
  readonly hash: string;               // hash of this compact proof itself
}

export function omegaCompact(
  pipeline: TransformPipeline & { sealProof?: SealProof },
): CompactProof {
  // Use applyRule for Ω — this generates the omega mark and record
  const compactedPipeline = applyRule(pipeline, RULE_OMEGA_COMPACT);

  const state = compactedPipeline.current;

  // Hash of original and final states
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

  // Phase progression string — reconstruct from history
  const phases: string[] = state.history.length > 0
    ? [phaseToSymbol(state.history[0].from)]
    : [phaseToSymbol(pipeline.original.phase)];
  for (const t of state.history) {
    phases.push(phaseToSymbol(t.to));
  }
  const phaseProgression = phases.join('→');

  // CS check across all transitions
  const allCSHeld = state.history.every(t => t.witness.payload.cs.satisfied);

  // The omega mark is the last mark in the chain (just added by applyRule)
  const compactMark = compactedPipeline.markChain[compactedPipeline.markChain.length - 1];

  // Mark chain hashes (full chain including Ω mark)
  const markChainHashes = compactedPipeline.markChain.map((m) =>
    fnv1a32(JSON.stringify({ id: m.id, kind: m.kind, sourceHash: m.sourceHash, resultHash: m.resultHash }))
  );

  const sealProofHash = pipeline.sealProof?.hash ?? null;

  const proofBody = {
    compactMarkId: compactMark.id,
    originalHash,
    finalHash,
    transformCount: compactedPipeline.records.length,
    markChainHashes,
    sealProofHash,
    genesisTransitions: state.history.length,
    phaseProgression,
    allCSHeld,
  };

  const proof: CompactProof = {
    compactMark,
    originalHash,
    finalHash,
    transformCount: compactedPipeline.records.length,
    markChainHashes,
    sealProofHash,
    genesisTransitions: state.history.length,
    phaseProgression,
    allCSHeld,
    hash: fnv1a32(JSON.stringify(proofBody)),
  };

  return proof;
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
// X. Proof Verification — 証明の検証
// ============================================================

/**
 * verifySealProof: 封印証明の整合性を検証
 */
export function verifySealProof(
  proof: SealProof,
  state: GenesisState,
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Verify state snapshot matches current state
  if (proof.stateAtSeal.phase !== state.phase) {
    errors.push(`Phase mismatch: proof=${proof.stateAtSeal.phase}, state=${state.phase}`);
  }
  if (proof.stateAtSeal.transitionCount !== state.history.length) {
    errors.push(`Transition count mismatch: proof=${proof.stateAtSeal.transitionCount}, state=${state.history.length}`);
  }

  // Verify invariants were satisfied at seal time
  if (!proof.invariantsAtSeal.inv_witness) {
    errors.push('Witness integrity was not satisfied at seal time');
  }
  if (!proof.invariantsAtSeal.inv_phase) {
    errors.push('Phase monotonicity was not satisfied at seal time');
  }

  // Verify hash is reproducible
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

/**
 * verifyCompactProof: 圧縮証明の整合性を検証
 */
export function verifyCompactProof(
  proof: CompactProof,
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Verify hash is reproducible
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
  if (proof.hash !== expectedHash) {
    errors.push(`Compact proof hash mismatch: got ${proof.hash}, expected ${expectedHash}`);
  }

  // Verify mark chain has at least Ψ + Ω
  if (proof.markChainHashes.length < 2) {
    errors.push('Mark chain is too short — expected at least seal + compact marks');
  }

  // Verify genesis reached a meaningful phase
  if (proof.genesisTransitions < 1) {
    errors.push('No genesis transitions recorded');
  }

  // Verify CS
  if (!proof.allCSHeld) {
    errors.push('CS assumption was not satisfied for all transitions');
  }

  return { valid: errors.length === 0, errors };
}

// ============================================================
// XI. Mark Chain Verification — マーク連鎖の検証
// ============================================================

/**
 * verifyMarkChain: mark の連鎖が途切れていないことを検証
 *
 * firewall の原理: mark は前のmark を親として持つ。
 * 段飛ばし（parent が飛んでいる）は検出される。
 */
export function verifyMarkChain(marks: readonly Mark[]): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  for (let i = 0; i < marks.length; i++) {
    const mark = marks[i];

    // First mark should have no parent
    if (i === 0) {
      if (mark.parentMarkId !== null) {
        errors.push(`First mark should have no parent, got: ${mark.parentMarkId}`);
      }
    } else {
      // Subsequent marks must reference previous mark as parent
      const expectedParentId = marks[i - 1].id;
      if (mark.parentMarkId !== expectedParentId) {
        errors.push(
          `Mark ${mark.id}: parent mismatch — expected ${expectedParentId}, got ${mark.parentMarkId}`
        );
      }
    }

    // Tick must be monotonically increasing
    if (i > 0 && mark.tick <= marks[i - 1].tick) {
      errors.push(
        `Mark ${mark.id}: tick not monotonic (${mark.tick} <= ${marks[i - 1].tick})`
      );
    }
  }

  return { valid: errors.length === 0, errors };
}

// ============================================================
// XII. Full Pipeline Execution — 完全パイプライン実行
// ============================================================

/**
 * executeFullPipeline: Genesis state を Φ → Ψ → Ω の完全パイプラインで処理
 *
 * この関数が "Reiでしか書けないコード" の具体例:
 *   1. Φ_normalize で正規化（形は変わるが証拠は保つ）
 *   2. Ψ_commit で封印（以後の変換を構文的に禁止）
 *   3. Ω_compact で圧縮（中間を捨てて証明に焼き付ける）
 *
 * 結果: CompactProof — 不可逆だが検証可能な証明オブジェクト
 *
 * [ENH-1] 全ステップが applyRule 経由で統一されている。
 */
export function executeFullPipeline(
  state: GenesisState,
): {
  proof: CompactProof;
  sealProof: SealProof;
  pipeline: TransformPipeline;
} {
  resetMarkCounter();

  // Step 1: パイプライン生成
  let pipeline = createPipeline(state);

  // Step 2: Φ_normalize（構造保存変換）— internally calls applyRule
  pipeline = phiNormalize(pipeline);

  // Step 3: Ψ_commit（封印）— internally calls applyRule
  const sealedPipeline = psiCommit(pipeline);
  const { sealProof } = sealedPipeline;

  // Step 4: Ω_compact（履歴合成 → 証明生成）— internally calls applyRule
  const proof = omegaCompact(sealedPipeline);

  return {
    proof,
    sealProof,
    pipeline: { ...sealedPipeline, compacted: true },
  };
}
