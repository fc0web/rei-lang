// ============================================================
// Rei (0₀式) Irreversible Syntax Layer — Test Suite v3
// 仕様テスト: Φ/Ψ/Ω, Invariants, Mark Chain, Proofs,
//            DSL, Type-Level Stage, Adversarial Attacks
// ============================================================

import { describe, it, expect, beforeEach } from 'vitest';
import {
  createGenesis,
  runFullGenesis,
  evolve,
  fnv1a32,
  type GenesisState,
  type GenesisTransition,
} from '../src/genesis/genesis-axioms-v2';
import {
  // Invariants
  checkInvAST,
  checkInvWitness,
  checkInvPhase,
  checkAllInvariants,
  // Pipeline
  createPipeline,
  // Transforms
  phiNormalize,
  psiCommit,
  omegaCompact,
  // DSL
  applyRule,
  RULE_PHI_NORMALIZE,
  RULE_PSI_COMMIT,
  RULE_OMEGA_COMPACT,
  // Verification
  verifySealProof,
  verifyCompactProof,
  verifyMarkChain,
  // Full pipeline
  executeFullPipeline,
  // Utils
  resetMarkCounter,
  stateHistoryDigest,
  // Types
  type Pipeline,
  type OpenPipeline,
  type SealedPipeline,
  type CompactedPipeline,
  type SealProof,
  type CompactProof,
  type PipelineRule,
  type InvariantCheck,
} from '../src/genesis/irreversible-syntax';

// ============================================================
// Helper
// ============================================================

let genesisState: GenesisState;

beforeEach(() => {
  resetMarkCounter();
  genesisState = runFullGenesis(0.3);
});

// ============================================================
// 1. Invariant System
// ============================================================

describe('Invariant System', () => {
  describe('inv_ast', () => {
    it('passes for identical states', () => {
      expect(checkInvAST(genesisState, genesisState)).toBe(true);
    });

    it('passes for states with same structure but different physical values', () => {
      const modified: GenesisState = {
        ...genesisState,
        curvature: 0.999,
        entropy: 0.001,
      };
      expect(checkInvAST(genesisState, modified)).toBe(true);
    });

    it('fails when transition count changes', () => {
      const truncated: GenesisState = {
        ...genesisState,
        history: genesisState.history.slice(0, 2),
      };
      expect(checkInvAST(genesisState, truncated)).toBe(false);
    });

    it('fails when phase changes', () => {
      const altered: GenesisState = { ...genesisState, phase: 'void' };
      expect(checkInvAST(genesisState, altered)).toBe(false);
    });

    it('fails when transition from/to is altered', () => {
      const tampered: GenesisState = {
        ...genesisState,
        history: genesisState.history.map((t, i) =>
          i === 0 ? { ...t, from: 'dot' as any } : t
        ),
      };
      expect(checkInvAST(genesisState, tampered)).toBe(false);
    });
  });

  describe('inv_witness', () => {
    it('passes for valid genesis state', () => {
      expect(checkInvWitness(genesisState)).toBe(true);
    });

    it('fails for tampered witness hash', () => {
      const tampered: GenesisState = {
        ...genesisState,
        history: genesisState.history.map((t, i) =>
          i === 0 ? { ...t, witness: { ...t.witness, hash: 'tampered' } } : t
        ),
      };
      expect(checkInvWitness(tampered)).toBe(false);
    });
  });

  describe('inv_phase', () => {
    it('passes for valid genesis state', () => {
      expect(checkInvPhase(genesisState)).toBe(true);
    });

    it('fails for backward transition', () => {
      const tampered: GenesisState = {
        ...genesisState,
        history: [{
          ...genesisState.history[0],
          from: 'dot',
          to: 'void',
        }],
      };
      expect(checkInvPhase(tampered)).toBe(false);
    });
  });

  describe('checkAllInvariants', () => {
    it('all pass for normalized genesis', () => {
      const result = checkAllInvariants(genesisState, genesisState);
      expect(result.inv_ast).toBe(true);
      expect(result.inv_witness).toBe(true);
      expect(result.inv_phase).toBe(true);
      expect(result.details).toBe('All invariants preserved');
    });

    it('reports specific violations', () => {
      const truncated: GenesisState = { ...genesisState, history: [] };
      const result = checkAllInvariants(genesisState, truncated);
      expect(result.inv_ast).toBe(false);
      expect(result.details).toContain('AST structure changed');
    });
  });
});

// ============================================================
// 2. Φ — 構造保存変換（Phi）
// ============================================================

describe('Φ_normalize', () => {
  it('creates a normalized pipeline', () => {
    const pipeline = createPipeline(genesisState);
    const result = phiNormalize(pipeline);

    expect(result.records.length).toBe(1);
    expect(result.records[0].ruleName).toBe('Φ_normalize');
    expect(result.stage).toBe('open');
  });

  it('preserves all 3 invariants', () => {
    const pipeline = createPipeline(genesisState);
    const result = phiNormalize(pipeline);

    const invariants = result.records[0].invariants;
    expect(invariants.inv_ast).toBe(true);
    expect(invariants.inv_witness).toBe(true);
    expect(invariants.inv_phase).toBe(true);
  });

  it('generates a mark with correct kind', () => {
    const pipeline = createPipeline(genesisState);
    const result = phiNormalize(pipeline);
    expect(result.markChain.length).toBe(1);
    expect(result.markChain[0].kind).toBe('phi_normalize');
  });

  it('first mark has no parent', () => {
    const pipeline = createPipeline(genesisState);
    const result = phiNormalize(pipeline);
    expect(result.markChain[0].parentMarkId).toBeNull();
  });

  it('preserves phase and transition structure', () => {
    const pipeline = createPipeline(genesisState);
    const result = phiNormalize(pipeline);
    expect(result.current.phase).toBe(genesisState.phase);
    expect(result.current.history.length).toBe(genesisState.history.length);
  });

  it('normalizes floating-point values', () => {
    const messyState: GenesisState = {
      ...genesisState,
      curvature: 0.30000000000000004,
      entropy: 0.7999999999999998,
    };
    const pipeline = createPipeline(messyState);
    const result = phiNormalize(pipeline);
    expect(result.current.curvature).toBe(0.3);
    expect(result.current.entropy).toBe(0.8);
  });

  it('can be applied multiple times before seal', () => {
    let pipeline = createPipeline(genesisState);
    pipeline = phiNormalize(pipeline);
    pipeline = phiNormalize(pipeline);

    expect(pipeline.records.length).toBe(2);
    expect(pipeline.markChain.length).toBe(2);
    expect(pipeline.markChain[1].parentMarkId).toBe(pipeline.markChain[0].id);
  });

  it('throws after seal (runtime defense-in-depth)', () => {
    let pipeline = createPipeline(genesisState);
    pipeline = phiNormalize(pipeline);
    const sealed = psiCommit(pipeline);

    // @ts-expect-error — [ENH-2] phiNormalize only accepts OpenPipeline
    expect(() => phiNormalize(sealed)).toThrow('cannot transform after seal');
  });
});

// ============================================================
// 3. Ψ — 封印変換（Psi）
// ============================================================

describe('Ψ_commit', () => {
  it('seals the pipeline', () => {
    let pipeline = createPipeline(genesisState);
    pipeline = phiNormalize(pipeline);
    const sealed = psiCommit(pipeline);

    expect(sealed.stage).toBe('sealed');
    expect(sealed.sealProof).toBeDefined();
  });

  it('generates seal proof with correct structure', () => {
    let pipeline = createPipeline(genesisState);
    pipeline = phiNormalize(pipeline);
    const sealed = psiCommit(pipeline);

    const proof = sealed.sealProof;
    expect(proof.sealMark.kind).toBe('psi_commit');
    expect(proof.stateAtSeal.phase).toBe('number');
    expect(proof.invariantsAtSeal.inv_witness).toBe(true);
    expect(proof.invariantsAtSeal.inv_phase).toBe(true);
    expect(proof.csAtSeal).toBe(true);
    expect(typeof proof.hash).toBe('string');
  });

  it('seal mark chains to previous marks', () => {
    let pipeline = createPipeline(genesisState);
    pipeline = phiNormalize(pipeline);
    const sealed = psiCommit(pipeline);

    const sealMark = sealed.markChain[sealed.markChain.length - 1];
    const phiMark = sealed.markChain[sealed.markChain.length - 2];
    expect(sealMark.parentMarkId).toBe(phiMark.id);
  });

  it('prevents double seal (runtime defense-in-depth)', () => {
    let pipeline = createPipeline(genesisState);
    pipeline = phiNormalize(pipeline);
    const sealed = psiCommit(pipeline);

    // @ts-expect-error — [ENH-2] psiCommit only accepts OpenPipeline
    expect(() => psiCommit(sealed)).toThrow('already sealed');
  });

  it('can seal without prior Φ', () => {
    const pipeline = createPipeline(genesisState);
    const sealed = psiCommit(pipeline);
    expect(sealed.stage).toBe('sealed');
    expect(sealed.records.length).toBe(1);
  });

  it('seal proof hash is reproducible', () => {
    let pipeline1 = createPipeline(genesisState);
    pipeline1 = phiNormalize(pipeline1);
    resetMarkCounter();
    const sealed1 = psiCommit(pipeline1);

    resetMarkCounter();
    let pipeline2 = createPipeline(genesisState);
    pipeline2 = phiNormalize(pipeline2);
    resetMarkCounter();
    const sealed2 = psiCommit(pipeline2);

    expect(sealed1.sealProof.hash).toBe(sealed2.sealProof.hash);
  });
});

// ============================================================
// 4. Ω — 履歴合成（Omega）
// ============================================================

describe('Ω_compact', () => {
  it('produces a compact proof', () => {
    let pipeline = createPipeline(genesisState);
    pipeline = phiNormalize(pipeline);
    const sealed = psiCommit(pipeline);
    const proof = omegaCompact(sealed);

    expect(proof).toBeDefined();
    expect(typeof proof.hash).toBe('string');
    expect(proof.transformCount).toBe(3); // Φ + Ψ + Ω
  });

  it('records phase progression', () => {
    let pipeline = createPipeline(genesisState);
    pipeline = phiNormalize(pipeline);
    const sealed = psiCommit(pipeline);
    const proof = omegaCompact(sealed);

    expect(proof.phaseProgression).toContain('void');
    expect(proof.phaseProgression).toContain('・');
    expect(proof.phaseProgression).toContain('0₀');
    expect(proof.phaseProgression).toContain('0');
    expect(proof.phaseProgression).toContain('ℕ');
  });

  it('records genesis transition count', () => {
    let pipeline = createPipeline(genesisState);
    pipeline = phiNormalize(pipeline);
    const sealed = psiCommit(pipeline);
    const proof = omegaCompact(sealed);
    expect(proof.genesisTransitions).toBe(4);
  });

  it('records mark chain hashes', () => {
    let pipeline = createPipeline(genesisState);
    pipeline = phiNormalize(pipeline);
    const sealed = psiCommit(pipeline);
    const proof = omegaCompact(sealed);
    expect(proof.markChainHashes.length).toBe(3); // Φ + Ψ + Ω
  });

  it('includes seal proof hash', () => {
    let pipeline = createPipeline(genesisState);
    pipeline = phiNormalize(pipeline);
    const sealed = psiCommit(pipeline);
    const proof = omegaCompact(sealed);
    expect(proof.sealProofHash).toBe(sealed.sealProof.hash);
  });

  it('CS status is recorded', () => {
    let pipeline = createPipeline(genesisState);
    pipeline = phiNormalize(pipeline);
    const sealed = psiCommit(pipeline);
    const proof = omegaCompact(sealed);
    expect(proof.allCSHeld).toBe(true);
  });

  it('requires seal before compaction (runtime defense-in-depth)', () => {
    const pipeline = createPipeline(genesisState);
    // @ts-expect-error — [ENH-2] omegaCompact only accepts SealedPipeline
    expect(() => omegaCompact(pipeline)).toThrow('must be sealed');
  });

  it('prevents double compaction', () => {
    let pipeline = createPipeline(genesisState);
    pipeline = phiNormalize(pipeline);
    const sealed = psiCommit(pipeline);
    omegaCompact(sealed);
    const compactedPipeline = { ...sealed, stage: 'compacted' as const };
    // @ts-expect-error — [ENH-2] omegaCompact only accepts SealedPipeline
    expect(() => omegaCompact(compactedPipeline)).toThrow('already compacted');
  });
});

// ============================================================
// 5. Mark Chain Verification
// ============================================================

describe('Mark Chain', () => {
  it('valid chain passes verification', () => {
    let pipeline = createPipeline(genesisState);
    pipeline = phiNormalize(pipeline);
    const sealed = psiCommit(pipeline);
    const result = verifyMarkChain(sealed.markChain);
    expect(result.valid).toBe(true);
    expect(result.errors).toEqual([]);
  });

  it('detects broken parent chain', () => {
    let pipeline = createPipeline(genesisState);
    pipeline = phiNormalize(pipeline);
    const sealed = psiCommit(pipeline);
    const tampered = sealed.markChain.map((m, i) =>
      i === 1 ? { ...m, parentMarkId: 'wrong_id' } : m
    );
    const result = verifyMarkChain(tampered);
    expect(result.valid).toBe(false);
    expect(result.errors[0]).toContain('parent mismatch');
  });

  it('detects non-monotonic ticks', () => {
    let pipeline = createPipeline(genesisState);
    pipeline = phiNormalize(pipeline);
    const sealed = psiCommit(pipeline);
    const tampered = sealed.markChain.map((m, i) =>
      i === 1 ? { ...m, tick: 0 } : m
    );
    const result = verifyMarkChain(tampered);
    expect(result.valid).toBe(false);
    expect(result.errors[0]).toContain('tick not monotonic');
  });

  it('detects false root (first mark with parent)', () => {
    let pipeline = createPipeline(genesisState);
    pipeline = phiNormalize(pipeline);
    const sealed = psiCommit(pipeline);
    const tampered = sealed.markChain.map((m, i) =>
      i === 0 ? { ...m, parentMarkId: 'phantom_parent' } : m
    );
    const result = verifyMarkChain(tampered);
    expect(result.valid).toBe(false);
    expect(result.errors[0]).toContain('First mark should have no parent');
  });

  it('multi-step chain maintains integrity', () => {
    let pipeline = createPipeline(genesisState);
    pipeline = phiNormalize(pipeline);
    pipeline = phiNormalize(pipeline);
    pipeline = phiNormalize(pipeline);
    const sealed = psiCommit(pipeline);
    expect(sealed.markChain.length).toBe(4);
    const result = verifyMarkChain(sealed.markChain);
    expect(result.valid).toBe(true);
  });
});

// ============================================================
// 6. Proof Verification
// ============================================================

describe('Seal Proof Verification', () => {
  it('valid seal proof passes', () => {
    let pipeline = createPipeline(genesisState);
    pipeline = phiNormalize(pipeline);
    const sealed = psiCommit(pipeline);
    const result = verifySealProof(sealed.sealProof, sealed.current);
    expect(result.valid).toBe(true);
  });

  it('detects phase mismatch', () => {
    let pipeline = createPipeline(genesisState);
    pipeline = phiNormalize(pipeline);
    const sealed = psiCommit(pipeline);
    const wrongState: GenesisState = { ...sealed.current, phase: 'void' };
    const result = verifySealProof(sealed.sealProof, wrongState);
    expect(result.valid).toBe(false);
    expect(result.errors[0]).toContain('Phase mismatch');
  });

  it('detects tampered seal proof hash', () => {
    let pipeline = createPipeline(genesisState);
    pipeline = phiNormalize(pipeline);
    const sealed = psiCommit(pipeline);
    const tamperedProof: SealProof = { ...sealed.sealProof, hash: 'tampered' };
    const result = verifySealProof(tamperedProof, sealed.current);
    expect(result.valid).toBe(false);
    expect(result.errors[0]).toContain('hash mismatch');
  });
});

describe('Compact Proof Verification', () => {
  it('valid compact proof passes', () => {
    let pipeline = createPipeline(genesisState);
    pipeline = phiNormalize(pipeline);
    const sealed = psiCommit(pipeline);
    const proof = omegaCompact(sealed);
    expect(verifyCompactProof(proof).valid).toBe(true);
  });

  it('detects tampered compact proof hash', () => {
    let pipeline = createPipeline(genesisState);
    pipeline = phiNormalize(pipeline);
    const sealed = psiCommit(pipeline);
    const proof = omegaCompact(sealed);
    const tampered: CompactProof = { ...proof, hash: 'tampered' };
    expect(verifyCompactProof(tampered).valid).toBe(false);
  });
});

// ============================================================
// 7. Transform Ordering Enforcement
// ============================================================

describe('Transform Ordering (Φ → Ψ → Ω)', () => {
  it('Φ → Ψ → Ω succeeds', () => {
    let pipeline = createPipeline(genesisState);
    pipeline = phiNormalize(pipeline);
    const sealed = psiCommit(pipeline);
    const proof = omegaCompact(sealed);
    expect(proof).toBeDefined();
  });

  it('Ψ → Ω succeeds (Φ optional)', () => {
    const pipeline = createPipeline(genesisState);
    const sealed = psiCommit(pipeline);
    const proof = omegaCompact(sealed);
    expect(proof).toBeDefined();
    expect(proof.transformCount).toBe(2); // Ψ + Ω
  });

  it('Ω without Ψ fails', () => {
    const pipeline = createPipeline(genesisState);
    // @ts-expect-error — [ENH-2] omegaCompact requires SealedPipeline
    expect(() => omegaCompact(pipeline)).toThrow('must be sealed');
  });

  it('Φ after Ψ fails', () => {
    const sealed = psiCommit(createPipeline(genesisState));
    // @ts-expect-error — [ENH-2] phiNormalize requires OpenPipeline
    expect(() => phiNormalize(sealed)).toThrow('cannot transform after seal');
  });

  it('Ψ after Ψ fails', () => {
    const sealed = psiCommit(createPipeline(genesisState));
    // @ts-expect-error — [ENH-2] psiCommit requires OpenPipeline
    expect(() => psiCommit(sealed)).toThrow('already sealed');
  });

  it('Ω after Ω fails', () => {
    const sealed = psiCommit(createPipeline(genesisState));
    omegaCompact(sealed);
    const compacted = { ...sealed, stage: 'compacted' as const };
    // @ts-expect-error — [ENH-2] CompactedPipeline ≠ SealedPipeline
    expect(() => omegaCompact(compacted)).toThrow('already compacted');
  });
});

// ============================================================
// 8. Full Pipeline (Integration)
// ============================================================

describe('executeFullPipeline', () => {
  it('produces valid proof and seal proof', () => {
    const { proof, sealProof, pipeline } = executeFullPipeline(genesisState);
    expect(proof).toBeDefined();
    expect(sealProof).toBeDefined();
    expect(pipeline.stage).toBe('compacted');
  });

  it('proof passes verification', () => {
    const { proof } = executeFullPipeline(genesisState);
    expect(verifyCompactProof(proof).valid).toBe(true);
  });

  it('seal proof passes verification', () => {
    const { sealProof, pipeline } = executeFullPipeline(genesisState);
    expect(verifySealProof(sealProof, pipeline.current).valid).toBe(true);
  });

  it('mark chain passes verification', () => {
    const { pipeline } = executeFullPipeline(genesisState);
    expect(verifyMarkChain(pipeline.markChain).valid).toBe(true);
  });

  it('phase progression is complete', () => {
    const { proof } = executeFullPipeline(genesisState);
    expect(proof.phaseProgression).toBe('void→・→0₀→0→ℕ');
  });

  it('compacted pipeline has Φ+Ψ+Ω marks', () => {
    const { pipeline } = executeFullPipeline(genesisState);
    expect(pipeline.markChain.length).toBe(3);
    expect(pipeline.markChain[0].kind).toBe('phi_normalize');
    expect(pipeline.markChain[1].kind).toBe('psi_commit');
    expect(pipeline.markChain[2].kind).toBe('omega_compact');
  });

  it('works with different energy levels', () => {
    for (const energy of [0.15, 0.2, 0.3, 0.5]) {
      resetMarkCounter();
      const state = runFullGenesis(energy);
      const { proof } = executeFullPipeline(state);
      expect(verifyCompactProof(proof).valid).toBe(true);
      expect(proof.allCSHeld).toBe(true);
      expect(proof.genesisTransitions).toBe(4);
    }
  });

  it('is reproducible', () => {
    resetMarkCounter();
    const { proof: proof1 } = executeFullPipeline(genesisState);
    resetMarkCounter();
    const { proof: proof2 } = executeFullPipeline(runFullGenesis(0.3));
    expect(proof1.hash).toBe(proof2.hash);
    expect(proof1.originalHash).toBe(proof2.originalHash);
    expect(proof1.finalHash).toBe(proof2.finalHash);
  });
});

// ============================================================
// 9. Edge Cases
// ============================================================

describe('Edge Cases', () => {
  it('pipeline with void-only state (no transitions)', () => {
    const voidState = createGenesis();
    const pipeline = createPipeline(voidState);
    const normalized = phiNormalize(pipeline);
    expect(normalized.current.phase).toBe('void');
    expect(normalized.current.history.length).toBe(0);
  });

  it('pipeline with partial genesis', () => {
    resetMarkCounter();
    let state = createGenesis();
    state = evolve(state, 0.5);
    expect(state.phase).toBe('dot');

    const pipeline = createPipeline(state);
    const normalized = phiNormalize(pipeline);
    const sealed = psiCommit(normalized);
    const proof = omegaCompact(sealed);
    expect(proof.genesisTransitions).toBe(1);
    expect(proof.phaseProgression).toContain('・');
  });
});

// ============================================================
// 10. DSL Layer — applyRule + PipelineRule
// ============================================================

describe('applyRule DSL', () => {
  describe('applyRule ↔ convenience wrapper equivalence', () => {
    it('applyRule(RULE_PHI_NORMALIZE) ≡ phiNormalize()', () => {
      resetMarkCounter();
      const p1 = applyRule(createPipeline(genesisState), RULE_PHI_NORMALIZE);
      resetMarkCounter();
      const p2 = phiNormalize(createPipeline(genesisState));

      expect(p1.markChain[0].id).toBe(p2.markChain[0].id);
      expect(p1.records[0].ruleName).toBe(p2.records[0].ruleName);
      expect(p1.current.curvature).toBe(p2.current.curvature);
    });

    it('applyRule(RULE_PSI_COMMIT) produces sealProof', () => {
      let pipeline = createPipeline(genesisState);
      pipeline = phiNormalize(pipeline);
      const result = applyRule(pipeline, RULE_PSI_COMMIT);
      expect(result.stage).toBe('sealed');
      expect((result as SealedPipeline).sealProof).toBeDefined();
    });

    it('applyRule(RULE_OMEGA_COMPACT) generates omega mark', () => {
      let pipeline = createPipeline(genesisState);
      pipeline = phiNormalize(pipeline);
      const sealed = psiCommit(pipeline);
      const compacted = applyRule(sealed, RULE_OMEGA_COMPACT);
      expect(compacted.stage).toBe('compacted');
      const lastMark = compacted.markChain[compacted.markChain.length - 1];
      expect(lastMark.kind).toBe('omega_compact');
    });
  });

  describe('firewall enforcement via applyRule', () => {
    it('RULE_PHI_NORMALIZE blocked after seal', () => {
      const sealed = psiCommit(createPipeline(genesisState));
      // runtime defense-in-depth (type system already blocks this)
      expect(() => applyRule(sealed as any, RULE_PHI_NORMALIZE)).toThrow('cannot transform after seal');
    });

    it('RULE_PSI_COMMIT blocked on sealed pipeline', () => {
      const sealed = psiCommit(createPipeline(genesisState));
      expect(() => applyRule(sealed as any, RULE_PSI_COMMIT)).toThrow('already sealed');
    });

    it('RULE_OMEGA_COMPACT blocked without seal', () => {
      const pipeline = createPipeline(genesisState);
      expect(() => applyRule(pipeline as any, RULE_OMEGA_COMPACT)).toThrow('must be sealed');
    });

    it('RULE_OMEGA_COMPACT blocked after compaction', () => {
      const sealed = psiCommit(createPipeline(genesisState));
      const compacted = applyRule(sealed, RULE_OMEGA_COMPACT);
      expect(() => applyRule(compacted as any, RULE_OMEGA_COMPACT)).toThrow('already compacted');
    });
  });

  describe('custom PipelineRule', () => {
    it('identity rule passes all invariants', () => {
      const RULE_IDENTITY: PipelineRule & { readonly category: 'phi' } = {
        name: 'identity',
        kind: 'phi_normalize',
        category: 'phi',
        requires: (p) => p.stage === 'open' ? { ok: true } : { ok: false, reason: 'not open' },
        pre: () => true,
        apply: (state) => state,
        post: (before, after) => checkAllInvariants(before, after),
      };

      const pipeline = createPipeline(genesisState);
      const result = applyRule(pipeline, RULE_IDENTITY);
      expect(result.records[0].ruleName).toBe('identity');
      expect(result.records[0].invariants.inv_ast).toBe(true);
    });

    it('custom rule with failing precondition throws', () => {
      const RULE_FAIL: PipelineRule & { readonly category: 'phi' } = {
        name: 'fail_pre',
        kind: 'phi_normalize',
        category: 'phi',
        requires: () => ({ ok: true }),
        pre: () => false,
        apply: (state) => state,
        post: (before, after) => checkAllInvariants(before, after),
      };
      expect(() => applyRule(createPipeline(genesisState), RULE_FAIL)).toThrow('precondition (S₀) failed');
    });

    it('custom rule that breaks invariants is caught', () => {
      const RULE_BREAK: PipelineRule & { readonly category: 'phi' } = {
        name: 'breaker',
        kind: 'phi_normalize',
        category: 'phi',
        requires: () => ({ ok: true }),
        pre: () => true,
        apply: (state) => ({ ...state, phase: 'void' as any }),
        post: (before, after) => checkAllInvariants(before, after),
      };
      expect(() => applyRule(createPipeline(genesisState), RULE_BREAK)).toThrow('invariant violation');
    });
  });

  describe('rule chaining', () => {
    it('multi-rule mark chain is valid', () => {
      let pipeline: OpenPipeline = createPipeline(genesisState);
      pipeline = applyRule(pipeline, RULE_PHI_NORMALIZE);
      pipeline = applyRule(pipeline, RULE_PHI_NORMALIZE);
      pipeline = applyRule(pipeline, RULE_PHI_NORMALIZE);
      const sealed = applyRule(pipeline, RULE_PSI_COMMIT);

      expect(sealed.markChain.length).toBe(4);
      expect(verifyMarkChain(sealed.markChain).valid).toBe(true);
      expect(sealed.markChain[0].kind).toBe('phi_normalize');
      expect(sealed.markChain[3].kind).toBe('psi_commit');
    });

    it('full DSL pipeline matches executeFullPipeline hash', () => {
      resetMarkCounter();
      let p: OpenPipeline = createPipeline(genesisState);
      p = applyRule(p, RULE_PHI_NORMALIZE);
      const sealed = applyRule(p, RULE_PSI_COMMIT);
      const dslProof = omegaCompact(sealed);

      resetMarkCounter();
      const { proof: fullProof } = executeFullPipeline(runFullGenesis(0.3));

      expect(dslProof.hash).toBe(fullProof.hash);
    });
  });

  describe('built-in rule metadata', () => {
    it('RULE_PHI_NORMALIZE', () => {
      expect(RULE_PHI_NORMALIZE.name).toBe('Φ_normalize');
      expect(RULE_PHI_NORMALIZE.kind).toBe('phi_normalize');
      expect(RULE_PHI_NORMALIZE.category).toBe('phi');
    });
    it('RULE_PSI_COMMIT', () => {
      expect(RULE_PSI_COMMIT.name).toBe('Ψ_commit');
      expect(RULE_PSI_COMMIT.category).toBe('psi');
    });
    it('RULE_OMEGA_COMPACT', () => {
      expect(RULE_OMEGA_COMPACT.name).toBe('Ω_compact');
      expect(RULE_OMEGA_COMPACT.category).toBe('omega');
    });
  });
});

// ============================================================
// 11. stateHistoryDigest
// ============================================================

describe('stateHistoryDigest', () => {
  it('returns 8-char hex string', () => {
    const digest = stateHistoryDigest(genesisState);
    expect(typeof digest).toBe('string');
    expect(digest.length).toBe(8);
  });

  it('is deterministic', () => {
    expect(stateHistoryDigest(genesisState)).toBe(stateHistoryDigest(genesisState));
  });

  it('changes when history changes', () => {
    const tampered: GenesisState = {
      ...genesisState,
      history: genesisState.history.slice(0, 2),
    };
    expect(stateHistoryDigest(genesisState)).not.toBe(stateHistoryDigest(tampered));
  });

  it('changes when witness hash changes', () => {
    const tampered: GenesisState = {
      ...genesisState,
      history: genesisState.history.map((t, i) =>
        i === 0 ? { ...t, witness: { ...t.witness, hash: 'tampered' } } : t
      ),
    };
    expect(stateHistoryDigest(genesisState)).not.toBe(stateHistoryDigest(tampered));
  });
});

// ============================================================
// 12. [ENH-2] Type-Level Stage Enforcement
// ============================================================

describe('[ENH-2] Type-Level Stage Enforcement', () => {
  it('createPipeline returns OpenPipeline (stage=open)', () => {
    const pipeline = createPipeline(genesisState);
    expect(pipeline.stage).toBe('open');
    // Type assertion — if this compiles, the type is correct
    const _open: OpenPipeline = pipeline;
  });

  it('phiNormalize returns OpenPipeline (stage stays open)', () => {
    const result = phiNormalize(createPipeline(genesisState));
    expect(result.stage).toBe('open');
    const _open: OpenPipeline = result;
  });

  it('psiCommit returns SealedPipeline (stage transitions to sealed)', () => {
    const sealed = psiCommit(createPipeline(genesisState));
    expect(sealed.stage).toBe('sealed');
    const _sealed: SealedPipeline = sealed;
    expect(_sealed.sealProof).toBeDefined();
  });

  it('executeFullPipeline returns CompactedPipeline (stage=compacted)', () => {
    const { pipeline } = executeFullPipeline(genesisState);
    expect(pipeline.stage).toBe('compacted');
    const _compacted: CompactedPipeline = pipeline;
    expect(_compacted.sealProof).toBeDefined();
  });

  it('stage field is "open" | "sealed" | "compacted" (no booleans)', () => {
    const open = createPipeline(genesisState);
    const sealed = psiCommit(open);

    // The old boolean fields are gone — stage replaces them
    expect('sealed' in open).toBe(false);     // no boolean 'sealed'
    expect('compacted' in open).toBe(false);   // no boolean 'compacted'
    expect(open.stage).toBe('open');
    expect(sealed.stage).toBe('sealed');
  });

  it('type narrowing via stage discriminant', () => {
    // Build all three stages
    const open: Pipeline = createPipeline(genesisState);
    const sealed: Pipeline = psiCommit(createPipeline(genesisState));

    // Function that accepts Pipeline union and narrows
    function getStageInfo(p: Pipeline): string {
      switch (p.stage) {
        case 'open': return 'open';
        case 'sealed': return `sealed:${p.sealProof.hash.slice(0, 4)}`;
        case 'compacted': return `compacted:${p.sealProof.hash.slice(0, 4)}`;
      }
    }

    expect(getStageInfo(open)).toBe('open');
    expect(getStageInfo(sealed)).toMatch(/^sealed:/);
  });
});

// ============================================================
// 13. Adversarial Attack Tests — 敵対的テスト
// ============================================================

describe('Adversarial Attacks', () => {
  // ----- 13.1 History Tampering -----
  describe('History Tampering', () => {
    it('detects added transition (extra history entry)', () => {
      const fakeTransition: GenesisTransition = {
        ...genesisState.history[0],
        from: 'zero',
        to: 'number',
      };
      const tampered: GenesisState = {
        ...genesisState,
        history: [...genesisState.history, fakeTransition],
      };
      expect(checkInvAST(genesisState, tampered)).toBe(false);
    });

    it('detects removed transition (shortened history)', () => {
      const tampered: GenesisState = {
        ...genesisState,
        history: genesisState.history.slice(1),
      };
      expect(checkInvAST(genesisState, tampered)).toBe(false);
    });

    it('detects transition reordering (swap from/to)', () => {
      const tampered: GenesisState = {
        ...genesisState,
        history: genesisState.history.map((t, i) =>
          i === 1 ? { ...t, from: t.to, to: t.from } : t
        ),
      };
      expect(checkInvAST(genesisState, tampered)).toBe(false);
      expect(checkInvPhase(tampered)).toBe(false);
    });

    it('detects history modification via stateHistoryDigest', () => {
      const original = stateHistoryDigest(genesisState);
      // Modify a single transition's from field
      const tampered: GenesisState = {
        ...genesisState,
        history: genesisState.history.map((t, i) =>
          i === 2 ? { ...t, from: 'void' as any } : t
        ),
      };
      expect(stateHistoryDigest(tampered)).not.toBe(original);
    });
  });

  // ----- 13.2 Witness Attacks -----
  describe('Witness Attacks', () => {
    it('detects witness kind swapping', () => {
      const tampered: GenesisState = {
        ...genesisState,
        history: genesisState.history.map((t, i) =>
          i === 0 ? { ...t, witness: { ...t.witness, kind: 'number_genesis' as any } } : t
        ),
      };
      // inv_ast detects kind change
      expect(checkInvAST(genesisState, tampered)).toBe(false);
      // inv_witness also detects because kind feeds into verification
      expect(checkInvWitness(tampered)).toBe(false);
    });

    it('detects witness hash tampering', () => {
      const tampered: GenesisState = {
        ...genesisState,
        history: genesisState.history.map((t, i) =>
          i === 0 ? { ...t, witness: { ...t.witness, hash: 'deadbeef' } } : t
        ),
      };
      expect(checkInvWitness(tampered)).toBe(false);
    });

    it('detects witness payload modification (curvature change)', () => {
      const t0 = genesisState.history[0];
      const modifiedPayload = { ...t0.witness.payload, curvature: 999 };
      const tampered: GenesisState = {
        ...genesisState,
        history: genesisState.history.map((t, i) =>
          i === 0 ? {
            ...t,
            witness: {
              ...t.witness,
              payload: modifiedPayload,
              // hash is NOT recomputed — this should fail
            },
          } : t
        ),
      };
      expect(checkInvWitness(tampered)).toBe(false);
    });

    it('detects recomputed hash with modified payload (sophisticated attack)', () => {
      const t0 = genesisState.history[0];
      const modifiedPayload = { ...t0.witness.payload, curvature: 999 };
      const recomputedHash = fnv1a32(JSON.stringify(modifiedPayload));
      const tampered: GenesisState = {
        ...genesisState,
        history: genesisState.history.map((t, i) =>
          i === 0 ? {
            ...t,
            witness: {
              ...t.witness,
              payload: modifiedPayload,
              hash: recomputedHash,  // attacker recomputes hash
            },
          } : t
        ),
      };
      // Hash matches payload — but stateHistoryDigest catches it
      // because the witness hash changed from original
      const originalDigest = stateHistoryDigest(genesisState);
      const tamperedDigest = stateHistoryDigest(tampered);
      expect(originalDigest).not.toBe(tamperedDigest);
    });
  });

  // ----- 13.3 Seal Proof Forgery -----
  describe('Seal Proof Forgery', () => {
    it('detects forged seal proof hash', () => {
      let pipeline = createPipeline(genesisState);
      pipeline = phiNormalize(pipeline);
      const sealed = psiCommit(pipeline);

      const forged: SealProof = { ...sealed.sealProof, hash: 'forged_hash_value' };
      const result = verifySealProof(forged, sealed.current);
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('hash mismatch'))).toBe(true);
    });

    it('detects mismatched state snapshot in seal proof', () => {
      let pipeline = createPipeline(genesisState);
      pipeline = phiNormalize(pipeline);
      const sealed = psiCommit(pipeline);

      const forgedSnapshot = { ...sealed.sealProof.stateAtSeal, phase: 'void' as any };
      const forged: SealProof = {
        ...sealed.sealProof,
        stateAtSeal: forgedSnapshot,
      };
      const result = verifySealProof(forged, sealed.current);
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('Phase mismatch'))).toBe(true);
    });

    it('detects falsified invariants in seal proof', () => {
      let pipeline = createPipeline(genesisState);
      pipeline = phiNormalize(pipeline);
      const sealed = psiCommit(pipeline);

      const forgedInvariants: InvariantCheck = {
        ...sealed.sealProof.invariantsAtSeal,
        inv_witness: false,
      };
      const forged: SealProof = {
        ...sealed.sealProof,
        invariantsAtSeal: forgedInvariants,
      };
      const result = verifySealProof(forged, sealed.current);
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('Witness integrity'))).toBe(true);
    });

    it('detects CS status forgery in seal proof', () => {
      let pipeline = createPipeline(genesisState);
      pipeline = phiNormalize(pipeline);
      const sealed = psiCommit(pipeline);

      const forged: SealProof = { ...sealed.sealProof, csAtSeal: false };
      const result = verifySealProof(forged, sealed.current);
      // csAtSeal is part of the hash — hash verification catches this
      expect(result.valid).toBe(false);
    });
  });

  // ----- 13.4 Mark Chain Attacks -----
  describe('Mark Chain Attacks', () => {
    it('detects removed mark (gap in chain)', () => {
      let pipeline = createPipeline(genesisState);
      pipeline = phiNormalize(pipeline);
      pipeline = phiNormalize(pipeline);
      const sealed = psiCommit(pipeline);

      // Remove middle mark
      const gapped = [sealed.markChain[0], sealed.markChain[2]];
      const result = verifyMarkChain(gapped);
      expect(result.valid).toBe(false);
    });

    it('detects reordered marks', () => {
      let pipeline = createPipeline(genesisState);
      pipeline = phiNormalize(pipeline);
      pipeline = phiNormalize(pipeline);
      const sealed = psiCommit(pipeline);

      // Swap marks 0 and 1
      const reordered = [
        sealed.markChain[1],
        sealed.markChain[0],
        sealed.markChain[2],
      ];
      const result = verifyMarkChain(reordered);
      expect(result.valid).toBe(false);
    });

    it('detects duplicate mark injection', () => {
      let pipeline = createPipeline(genesisState);
      pipeline = phiNormalize(pipeline);
      const sealed = psiCommit(pipeline);

      // Inject duplicate of first mark
      const duplicated = [sealed.markChain[0], sealed.markChain[0], sealed.markChain[1]];
      const result = verifyMarkChain(duplicated);
      expect(result.valid).toBe(false);
      // tick not monotonic (same tick) or parent mismatch
    });

    it('detects parentMarkId tampering (broken chain link)', () => {
      let pipeline = createPipeline(genesisState);
      pipeline = phiNormalize(pipeline);
      const sealed = psiCommit(pipeline);

      const broken = sealed.markChain.map((m, i) =>
        i === 1 ? { ...m, parentMarkId: 'nonexistent_mark_id' } : m
      );
      const result = verifyMarkChain(broken);
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('parent mismatch'))).toBe(true);
    });
  });

  // ----- 13.5 Phase Regression / Bypass -----
  describe('Phase Regression & Bypass', () => {
    it('detects backward phase transition', () => {
      const tampered: GenesisState = {
        ...genesisState,
        history: [{
          ...genesisState.history[0],
          from: 'number',
          to: 'zero',
        }],
      };
      expect(checkInvPhase(tampered)).toBe(false);
    });

    it('detects phase skip (void → zero_zero)', () => {
      const tampered: GenesisState = {
        ...genesisState,
        history: [{
          ...genesisState.history[0],
          from: 'void',
          to: 'zero_zero',
        }],
      };
      expect(checkInvPhase(tampered)).toBe(false);
    });

    it('runtime defense catches type-cast bypass (sealed → phiNormalize)', () => {
      const sealed = psiCommit(createPipeline(genesisState));

      // Attacker force-casts sealed pipeline to OpenPipeline
      const fakeOpen = sealed as unknown as OpenPipeline;
      expect(() => phiNormalize(fakeOpen)).toThrow('cannot transform after seal');
    });

    it('runtime defense catches type-cast bypass (open → omegaCompact)', () => {
      const open = createPipeline(genesisState);

      // Attacker force-casts open pipeline to SealedPipeline
      const fakeSealed = open as unknown as SealedPipeline;
      expect(() => omegaCompact(fakeSealed)).toThrow('must be sealed');
    });

    it('runtime defense catches type-cast bypass (double seal)', () => {
      const sealed = psiCommit(createPipeline(genesisState));
      const fakeOpen = sealed as unknown as OpenPipeline;
      expect(() => psiCommit(fakeOpen)).toThrow('already sealed');
    });

    it('runtime defense catches type-cast bypass (double compact)', () => {
      const sealed = psiCommit(createPipeline(genesisState));
      const compacted = applyRule(sealed, RULE_OMEGA_COMPACT);
      const fakeSealed = compacted as unknown as SealedPipeline;
      expect(() => omegaCompact(fakeSealed)).toThrow('already compacted');
    });
  });

  // ----- 13.6 Compact Proof Attacks -----
  describe('Compact Proof Attacks', () => {
    it('detects tampered transformCount', () => {
      const { proof } = executeFullPipeline(genesisState);
      const forged: CompactProof = { ...proof, transformCount: 999 };
      expect(verifyCompactProof(forged).valid).toBe(false);
    });

    it('detects tampered phaseProgression', () => {
      const { proof } = executeFullPipeline(genesisState);
      const forged: CompactProof = { ...proof, phaseProgression: 'void→ℕ' };
      expect(verifyCompactProof(forged).valid).toBe(false);
    });

    it('detects removed markChainHash', () => {
      const { proof } = executeFullPipeline(genesisState);
      const forged: CompactProof = { ...proof, markChainHashes: [proof.markChainHashes[0]] };
      expect(verifyCompactProof(forged).valid).toBe(false);
    });

    it('detects allCSHeld falsification', () => {
      const { proof } = executeFullPipeline(genesisState);
      const forged: CompactProof = { ...proof, allCSHeld: false };
      const result = verifyCompactProof(forged);
      expect(result.valid).toBe(false);
    });
  });
});
