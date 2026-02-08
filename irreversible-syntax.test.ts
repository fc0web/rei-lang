// ============================================================
// Rei (0₀式) Irreversible Syntax Layer — Test Suite
// 仕様テスト: Φ/Ψ/Ω, Invariants, Mark Chain, Proofs, DSL
// ============================================================

import { describe, it, expect, beforeEach } from 'vitest';
import {
  createGenesis,
  runFullGenesis,
  evolve,
  type GenesisState,
} from '../src/genesis-axioms-v2';
import {
  // Invariants
  checkInvAST,
  checkInvWitness,
  checkInvPhase,
  checkAllInvariants,
  // Pipeline
  createPipeline,
  // Transforms (convenience wrappers)
  phiNormalize,
  psiCommit,
  omegaCompact,
  // DSL: applyRule + built-in rules
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
  type TransformPipeline,
  type SealProof,
  type CompactProof,
  type PipelineRule,
  type InvariantCheck,
} from '../src/irreversible-syntax';

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
      const altered: GenesisState = {
        ...genesisState,
        phase: 'void',
      };
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
        history: [
          {
            ...genesisState.history[0],
            from: 'dot',
            to: 'void',  // backward
          },
        ],
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
      const truncated: GenesisState = {
        ...genesisState,
        history: [],
      };
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
    expect(result.sealed).toBe(false);
    expect(result.compacted).toBe(false);
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

  it('throws after seal', () => {
    let pipeline = createPipeline(genesisState);
    pipeline = phiNormalize(pipeline);
    const sealed = psiCommit(pipeline);

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

    expect(sealed.sealed).toBe(true);
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

  it('prevents double seal', () => {
    let pipeline = createPipeline(genesisState);
    pipeline = phiNormalize(pipeline);
    const sealed = psiCommit(pipeline);

    expect(() => psiCommit(sealed)).toThrow('already sealed');
  });

  it('prevents Φ after seal', () => {
    let pipeline = createPipeline(genesisState);
    pipeline = phiNormalize(pipeline);
    const sealed = psiCommit(pipeline);

    expect(() => phiNormalize(sealed)).toThrow('cannot transform after seal');
  });

  it('can seal without prior Φ', () => {
    const pipeline = createPipeline(genesisState);
    const sealed = psiCommit(pipeline);

    expect(sealed.sealed).toBe(true);
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

    expect(proof.markChainHashes.length).toBe(3); // Φ mark + Ψ mark + Ω mark
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

  it('requires seal before compaction', () => {
    const pipeline = createPipeline(genesisState);
    expect(() => omegaCompact(pipeline as any)).toThrow('must be sealed');
  });

  it('prevents double compaction', () => {
    let pipeline = createPipeline(genesisState);
    pipeline = phiNormalize(pipeline);
    const sealed = psiCommit(pipeline);
    omegaCompact(sealed);

    const compactedPipeline = { ...sealed, compacted: true };
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

    const result = verifyCompactProof(proof);
    expect(result.valid).toBe(true);
  });

  it('detects tampered compact proof hash', () => {
    let pipeline = createPipeline(genesisState);
    pipeline = phiNormalize(pipeline);
    const sealed = psiCommit(pipeline);
    const proof = omegaCompact(sealed);

    const tampered: CompactProof = { ...proof, hash: 'tampered' };
    const result = verifyCompactProof(tampered);
    expect(result.valid).toBe(false);
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
    expect(() => omegaCompact(pipeline as any)).toThrow('must be sealed');
  });

  it('Φ after Ψ fails', () => {
    let pipeline = createPipeline(genesisState);
    const sealed = psiCommit(pipeline);
    expect(() => phiNormalize(sealed)).toThrow('cannot transform after seal');
  });

  it('Ψ after Ψ fails', () => {
    let pipeline = createPipeline(genesisState);
    const sealed = psiCommit(pipeline);
    expect(() => psiCommit(sealed)).toThrow('already sealed');
  });

  it('Ω after Ω fails', () => {
    let pipeline = createPipeline(genesisState);
    const sealed = psiCommit(pipeline);
    omegaCompact(sealed);
    const compactedPipeline = { ...sealed, compacted: true };
    expect(() => omegaCompact(compactedPipeline)).toThrow('already compacted');
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
    expect(pipeline.sealed).toBe(true);
    expect(pipeline.compacted).toBe(true);
  });

  it('proof passes verification', () => {
    const { proof } = executeFullPipeline(genesisState);
    const result = verifyCompactProof(proof);
    expect(result.valid).toBe(true);
  });

  it('seal proof passes verification', () => {
    const { sealProof, pipeline } = executeFullPipeline(genesisState);
    const result = verifySealProof(sealProof, pipeline.current);
    expect(result.valid).toBe(true);
  });

  it('mark chain passes verification', () => {
    const { pipeline } = executeFullPipeline(genesisState);
    const result = verifyMarkChain(pipeline.markChain);
    expect(result.valid).toBe(true);
  });

  it('phase progression is complete', () => {
    const { proof } = executeFullPipeline(genesisState);
    expect(proof.phaseProgression).toBe('void→・→0₀→0→ℕ');
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
    const state2 = runFullGenesis(0.3);
    const { proof: proof2 } = executeFullPipeline(state2);

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
// 10. DSL Layer — applyRule + PipelineRule テスト
// ============================================================

describe('applyRule DSL', () => {
  describe('applyRule ↔ convenience wrapper equivalence', () => {
    it('applyRule(RULE_PHI_NORMALIZE) ≡ phiNormalize()', () => {
      resetMarkCounter();
      const p1 = applyRule(createPipeline(genesisState), RULE_PHI_NORMALIZE);

      resetMarkCounter();
      const p2 = phiNormalize(createPipeline(genesisState));

      // Same mark IDs, same record names, same current state
      expect(p1.markChain[0].id).toBe(p2.markChain[0].id);
      expect(p1.records[0].ruleName).toBe(p2.records[0].ruleName);
      expect(p1.current.curvature).toBe(p2.current.curvature);
      expect(p1.current.entropy).toBe(p2.current.entropy);
      expect(p1.current.structure).toBe(p2.current.structure);
    });

    it('applyRule(RULE_PSI_COMMIT) produces sealProof', () => {
      let pipeline = createPipeline(genesisState);
      pipeline = phiNormalize(pipeline);

      const result = applyRule(pipeline, RULE_PSI_COMMIT);
      expect(result.sealed).toBe(true);
      expect(result.sealProof).toBeDefined();
      expect(result.sealProof!.sealMark.kind).toBe('psi_commit');
    });

    it('applyRule(RULE_OMEGA_COMPACT) generates omega mark', () => {
      let pipeline = createPipeline(genesisState);
      pipeline = phiNormalize(pipeline);
      const sealed = psiCommit(pipeline);

      const compacted = applyRule(sealed, RULE_OMEGA_COMPACT);
      const lastMark = compacted.markChain[compacted.markChain.length - 1];
      expect(lastMark.kind).toBe('omega_compact');
    });
  });

  describe('firewall enforcement via applyRule', () => {
    it('RULE_PHI_NORMALIZE blocked after seal', () => {
      let pipeline = createPipeline(genesisState);
      const sealed = psiCommit(pipeline);

      expect(() => applyRule(sealed, RULE_PHI_NORMALIZE)).toThrow('firewall');
      expect(() => applyRule(sealed, RULE_PHI_NORMALIZE)).toThrow('cannot transform after seal');
    });

    it('RULE_PSI_COMMIT blocked on already-sealed pipeline', () => {
      let pipeline = createPipeline(genesisState);
      const sealed = psiCommit(pipeline);

      expect(() => applyRule(sealed, RULE_PSI_COMMIT)).toThrow('firewall');
      expect(() => applyRule(sealed, RULE_PSI_COMMIT)).toThrow('already sealed');
    });

    it('RULE_OMEGA_COMPACT blocked without seal', () => {
      const pipeline = createPipeline(genesisState);

      expect(() => applyRule(pipeline, RULE_OMEGA_COMPACT)).toThrow('firewall');
      expect(() => applyRule(pipeline, RULE_OMEGA_COMPACT)).toThrow('must be sealed');
    });

    it('RULE_OMEGA_COMPACT blocked on already-compacted pipeline', () => {
      let pipeline = createPipeline(genesisState);
      const sealed = psiCommit(pipeline);
      const compacted = { ...applyRule(sealed, RULE_OMEGA_COMPACT), compacted: true };

      expect(() => applyRule(compacted, RULE_OMEGA_COMPACT)).toThrow('already compacted');
    });
  });

  describe('custom PipelineRule', () => {
    it('identity rule passes all invariants', () => {
      const RULE_IDENTITY: PipelineRule = {
        name: 'identity',
        kind: 'phi_normalize',
        category: 'phi',
        requires: (p) => {
          if (p.sealed) return { ok: false, reason: 'sealed' };
          return { ok: true };
        },
        pre: () => true,
        apply: (state) => state,  // no-op
        post: (before, after) => checkAllInvariants(before, after),
      };

      const pipeline = createPipeline(genesisState);
      const result = applyRule(pipeline, RULE_IDENTITY);

      expect(result.records.length).toBe(1);
      expect(result.records[0].ruleName).toBe('identity');
      expect(result.records[0].invariants.inv_ast).toBe(true);
      expect(result.records[0].invariants.inv_witness).toBe(true);
      expect(result.records[0].invariants.inv_phase).toBe(true);
    });

    it('custom rule with failing precondition throws', () => {
      const RULE_ALWAYS_FAIL_PRE: PipelineRule = {
        name: 'fail_pre',
        kind: 'phi_normalize',
        category: 'phi',
        requires: () => ({ ok: true }),
        pre: () => false,  // always fails
        apply: (state) => state,
        post: (before, after) => checkAllInvariants(before, after),
      };

      const pipeline = createPipeline(genesisState);
      expect(() => applyRule(pipeline, RULE_ALWAYS_FAIL_PRE)).toThrow('precondition (S₀) failed');
    });

    it('custom rule that breaks invariants is caught', () => {
      const RULE_BREAK_INV: PipelineRule = {
        name: 'breaker',
        kind: 'phi_normalize',
        category: 'phi',
        requires: () => ({ ok: true }),
        pre: () => true,
        apply: (state) => ({ ...state, phase: 'void' as any }),  // breaks inv_ast
        post: (before, after) => checkAllInvariants(before, after),
      };

      const pipeline = createPipeline(genesisState);
      expect(() => applyRule(pipeline, RULE_BREAK_INV)).toThrow('invariant violation');
    });
  });

  describe('rule chaining', () => {
    it('multi-rule mark chain is valid', () => {
      let pipeline = createPipeline(genesisState);

      // Φ → Φ → Φ → Ψ via applyRule
      pipeline = applyRule(pipeline, RULE_PHI_NORMALIZE);
      pipeline = applyRule(pipeline, RULE_PHI_NORMALIZE);
      pipeline = applyRule(pipeline, RULE_PHI_NORMALIZE);
      const sealed = applyRule(pipeline, RULE_PSI_COMMIT);

      expect(sealed.markChain.length).toBe(4);
      const result = verifyMarkChain(sealed.markChain);
      expect(result.valid).toBe(true);

      // Verify mark kinds in order
      expect(sealed.markChain[0].kind).toBe('phi_normalize');
      expect(sealed.markChain[1].kind).toBe('phi_normalize');
      expect(sealed.markChain[2].kind).toBe('phi_normalize');
      expect(sealed.markChain[3].kind).toBe('psi_commit');
    });

    it('custom Φ → built-in Ψ chaining works', () => {
      const RULE_CUSTOM_PHI: PipelineRule = {
        name: 'custom_phi',
        kind: 'phi_normalize',
        category: 'phi',
        requires: (p) => {
          if (p.sealed) return { ok: false, reason: 'sealed' };
          return { ok: true };
        },
        pre: () => true,
        apply: (state) => ({
          ...state,
          curvature: Math.round(state.curvature * 100) / 100,
          entropy: Math.round(state.entropy * 100) / 100,
          structure: Math.round(state.structure * 100) / 100,
        }),
        post: (before, after) => checkAllInvariants(before, after),
      };

      let pipeline = createPipeline(genesisState);
      pipeline = applyRule(pipeline, RULE_CUSTOM_PHI);
      const sealed = applyRule(pipeline, RULE_PSI_COMMIT);

      expect(sealed.sealed).toBe(true);
      expect(sealed.markChain.length).toBe(2);
      expect(sealed.markChain[0].kind).toBe('phi_normalize');
      expect(sealed.markChain[1].kind).toBe('psi_commit');
    });

    it('full DSL pipeline (applyRule only) matches executeFullPipeline hash', () => {
      // applyRule-only pipeline
      resetMarkCounter();
      let p = createPipeline(genesisState);
      p = applyRule(p, RULE_PHI_NORMALIZE);
      const sealed = applyRule(p, RULE_PSI_COMMIT) as TransformPipeline & { sealProof: SealProof };
      const dslProof = omegaCompact(sealed);

      // executeFullPipeline
      resetMarkCounter();
      const state2 = runFullGenesis(0.3);
      const { proof: fullProof } = executeFullPipeline(state2);

      expect(dslProof.hash).toBe(fullProof.hash);
      expect(dslProof.originalHash).toBe(fullProof.originalHash);
      expect(dslProof.finalHash).toBe(fullProof.finalHash);
    });
  });

  describe('built-in rule metadata', () => {
    it('RULE_PHI_NORMALIZE has correct metadata', () => {
      expect(RULE_PHI_NORMALIZE.name).toBe('Φ_normalize');
      expect(RULE_PHI_NORMALIZE.kind).toBe('phi_normalize');
      expect(RULE_PHI_NORMALIZE.category).toBe('phi');
    });

    it('RULE_PSI_COMMIT has correct metadata', () => {
      expect(RULE_PSI_COMMIT.name).toBe('Ψ_commit');
      expect(RULE_PSI_COMMIT.kind).toBe('psi_commit');
      expect(RULE_PSI_COMMIT.category).toBe('psi');
    });

    it('RULE_OMEGA_COMPACT has correct metadata', () => {
      expect(RULE_OMEGA_COMPACT.name).toBe('Ω_compact');
      expect(RULE_OMEGA_COMPACT.kind).toBe('omega_compact');
      expect(RULE_OMEGA_COMPACT.category).toBe('omega');
    });
  });
});

// ============================================================
// 11. stateHistoryDigest
// ============================================================

describe('stateHistoryDigest', () => {
  it('returns a string', () => {
    const digest = stateHistoryDigest(genesisState);
    expect(typeof digest).toBe('string');
    expect(digest.length).toBe(8); // FNV-1a 32-bit → 8 hex chars
  });

  it('is deterministic', () => {
    const d1 = stateHistoryDigest(genesisState);
    const d2 = stateHistoryDigest(genesisState);
    expect(d1).toBe(d2);
  });

  it('changes when history changes', () => {
    const original = stateHistoryDigest(genesisState);
    const tampered: GenesisState = {
      ...genesisState,
      history: genesisState.history.slice(0, 2),
    };
    const modified = stateHistoryDigest(tampered);
    expect(original).not.toBe(modified);
  });

  it('changes when witness hash changes', () => {
    const original = stateHistoryDigest(genesisState);
    const tampered: GenesisState = {
      ...genesisState,
      history: genesisState.history.map((t, i) =>
        i === 0 ? { ...t, witness: { ...t.witness, hash: 'tampered' } } : t
      ),
    };
    const modified = stateHistoryDigest(tampered);
    expect(original).not.toBe(modified);
  });
});
