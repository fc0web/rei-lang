// ============================================================
// Rei (0₀式) Irreversible Syntax Layer v2 — Test Suite
// 仕様テスト: Φ/Ψ/Ω, applyRule DSL, Type-level, Triangle, Publish
// ============================================================

import { describe, it, expect, beforeEach } from 'vitest';
import {
  createGenesis,
  runFullGenesis,
  evolve,
  type GenesisState,
} from '../src/genesis-axioms-v2';
import {
  checkInvAST,
  checkInvWitness,
  checkInvPhase,
  checkAllInvariants,
  createPipeline,
  phiNormalize,
  psiCommit,
  psiPublish,
  omegaCompact,
  verifySealProof,
  verifyPublishProof,
  verifyCompactProof,
  verifyMarkChain,
  verifyTriangleCoherence,
  executeFullPipeline,
  executePublishPipeline,
  applyRule,
  resetMarkCounter,
  stateHistoryDigest,
  RULE_PHI_NORMALIZE,
  RULE_PSI_COMMIT,
  RULE_PSI_PUBLISH,
  type Pipeline,
  type SealProof,
  type PublishProof,
  type CompactProof,
  type TransformRule,
} from '../src/irreversible-syntax';

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
    it('passes for states with different physical values', () => {
      const modified: GenesisState = { ...genesisState, curvature: 0.999, entropy: 0.001 };
      expect(checkInvAST(genesisState, modified)).toBe(true);
    });
    it('fails when transition count changes', () => {
      const truncated: GenesisState = { ...genesisState, history: genesisState.history.slice(0, 2) };
      expect(checkInvAST(genesisState, truncated)).toBe(false);
    });
    it('fails when phase changes', () => {
      expect(checkInvAST(genesisState, { ...genesisState, phase: 'void' })).toBe(false);
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
        history: [{ ...genesisState.history[0], from: 'dot', to: 'void' }],
      };
      expect(checkInvPhase(tampered)).toBe(false);
    });
  });

  describe('checkAllInvariants', () => {
    it('all pass for identical states', () => {
      const result = checkAllInvariants(genesisState, genesisState);
      expect(result.inv_ast).toBe(true);
      expect(result.inv_witness).toBe(true);
      expect(result.inv_phase).toBe(true);
      expect(result.details).toBe('All invariants preserved');
    });
    it('reports specific violations', () => {
      const result = checkAllInvariants(genesisState, { ...genesisState, history: [] });
      expect(result.inv_ast).toBe(false);
      expect(result.details).toContain('AST structure changed');
    });
  });
});

// ============================================================
// 2. [ENH-1] applyRule DSL
// ============================================================

describe('[ENH-1] applyRule DSL', () => {
  it('all Φ transforms go through applyRule', () => {
    const pipeline = createPipeline(genesisState);
    const result = applyRule(pipeline, RULE_PHI_NORMALIZE);
    expect(result.records.length).toBe(1);
    expect(result.records[0].ruleName).toBe('Φ_normalize');
  });

  it('rule requires check rejects sealed pipeline', () => {
    const open = createPipeline(genesisState);
    const sealed = psiCommit(open);
    expect(() => applyRule(sealed as any, RULE_PHI_NORMALIZE)).toThrow('cannot transform after seal');
  });

  it('custom rules can be applied through applyRule', () => {
    // A no-op Φ rule (identity transform)
    const identityRule: TransformRule = {
      name: 'Φ_identity',
      kind: 'phi_normalize',
      category: 'phi',
      requires: (p) => p._phase === 'open' ? { ok: true } : { ok: false, reason: 'not open' },
      pre: () => true,
      apply: (s) => s,
      post: (_b, a, o) => checkAllInvariants(o, a),
    };
    const pipeline = createPipeline(genesisState);
    const result = applyRule(pipeline, identityRule);
    expect(result.records[0].ruleName).toBe('Φ_identity');
    expect(result.current).toEqual(genesisState);
  });

  it('rule post-condition failure throws', () => {
    const badRule: TransformRule = {
      name: 'BAD_RULE',
      kind: 'phi_normalize',
      category: 'phi',
      requires: () => ({ ok: true }),
      pre: () => true,
      apply: (s) => ({ ...s, phase: 'void' as any }),  // breaks inv_ast
      post: (_b, a, o) => {
        const inv = checkAllInvariants(o, a);
        if (!inv.inv_ast) throw new Error('BAD_RULE: invariant violation');
        return inv;
      },
    };
    const pipeline = createPipeline(genesisState);
    expect(() => applyRule(pipeline, badRule)).toThrow('BAD_RULE: invariant violation');
  });

  it('rule pre-condition failure throws', () => {
    const strictRule: TransformRule = {
      name: 'STRICT',
      kind: 'phi_normalize',
      category: 'phi',
      requires: () => ({ ok: true }),
      pre: () => false,  // always fails
      apply: (s) => s,
      post: (_b, a, o) => checkAllInvariants(o, a),
    };
    const pipeline = createPipeline(genesisState);
    expect(() => applyRule(pipeline, strictRule)).toThrow('pre-condition (S₀) failed');
  });
});

// ============================================================
// 3. Φ — Structure-Preserving Transform
// ============================================================

describe('Φ_normalize', () => {
  it('creates a normalized pipeline', () => {
    const pipeline = createPipeline(genesisState);
    const result = phiNormalize(pipeline);
    expect(result.records.length).toBe(1);
    expect(result.records[0].ruleName).toBe('Φ_normalize');
    expect(result._phase).toBe('open');
  });

  it('preserves all 3 invariants', () => {
    const pipeline = createPipeline(genesisState);
    const result = phiNormalize(pipeline);
    const inv = result.records[0].invariants;
    expect(inv.inv_ast).toBe(true);
    expect(inv.inv_witness).toBe(true);
    expect(inv.inv_phase).toBe(true);
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
    const result = phiNormalize(createPipeline(messyState));
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
    const sealed = psiCommit(phiNormalize(createPipeline(genesisState)));
    expect(() => phiNormalize(sealed as any)).toThrow('cannot transform after seal');
  });
});

// ============================================================
// 4. Ψ_commit — Seal
// ============================================================

describe('Ψ_commit', () => {
  it('seals the pipeline', () => {
    const sealed = psiCommit(phiNormalize(createPipeline(genesisState)));
    expect(sealed._phase).toBe('sealed');
    expect(sealed.sealProof).toBeDefined();
  });

  it('generates seal proof with correct structure', () => {
    const sealed = psiCommit(phiNormalize(createPipeline(genesisState)));
    expect(sealed.sealProof.sealMark.kind).toBe('psi_commit');
    expect(sealed.sealProof.stateAtSeal.phase).toBe('number');
    expect(sealed.sealProof.invariantsAtSeal.inv_witness).toBe(true);
    expect(sealed.sealProof.csAtSeal).toBe(true);
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
    const sealed = psiCommit(phiNormalize(createPipeline(genesisState)));
    expect(() => psiCommit(sealed as any)).toThrow('already sealed');
  });

  it('prevents Φ after seal', () => {
    const sealed = psiCommit(phiNormalize(createPipeline(genesisState)));
    expect(() => phiNormalize(sealed as any)).toThrow('cannot transform after seal');
  });

  it('can seal without prior Φ', () => {
    const sealed = psiCommit(createPipeline(genesisState));
    expect(sealed._phase).toBe('sealed');
    expect(sealed.records.length).toBe(1);
  });

  it('seal proof hash is reproducible', () => {
    let p1 = createPipeline(genesisState);
    p1 = phiNormalize(p1);
    resetMarkCounter();
    const s1 = psiCommit(p1);
    resetMarkCounter();
    let p2 = createPipeline(genesisState);
    p2 = phiNormalize(p2);
    resetMarkCounter();
    const s2 = psiCommit(p2);
    expect(s1.sealProof.hash).toBe(s2.sealProof.hash);
  });
});

// ============================================================
// 5. [ENH-4] Ψ_publish — Irreversible Publish
// ============================================================

describe('[ENH-4] Ψ_publish', () => {
  it('publishes a sealed pipeline', () => {
    const sealed = psiCommit(phiNormalize(createPipeline(genesisState)));
    const published = psiPublish(sealed);
    expect(published._phase).toBe('sealed');
    expect(published.publishProof).toBeDefined();
  });

  it('publish proof contains correct structure', () => {
    const sealed = psiCommit(phiNormalize(createPipeline(genesisState)));
    const published = psiPublish(sealed);
    const proof = published.publishProof!;
    expect(proof.publishMark.kind).toBe('psi_publish');
    expect(proof.sealProofHash).toBe(sealed.sealProof.hash);
    expect(proof.allCSHeld).toBe(true);
    expect(typeof proof.genesisDigest).toBe('string');
    expect(typeof proof.hash).toBe('string');
  });

  it('publish mark chains after seal mark', () => {
    const sealed = psiCommit(phiNormalize(createPipeline(genesisState)));
    const published = psiPublish(sealed);
    const publishMark = published.markChain[published.markChain.length - 1];
    const sealMark = published.markChain[published.markChain.length - 2];
    expect(publishMark.parentMarkId).toBe(sealMark.id);
    expect(publishMark.kind).toBe('psi_publish');
  });

  it('prevents double publish', () => {
    const sealed = psiCommit(phiNormalize(createPipeline(genesisState)));
    const published = psiPublish(sealed);
    expect(() => psiPublish(published)).toThrow('already published');
  });

  it('requires seal before publish', () => {
    const open = createPipeline(genesisState);
    expect(() => psiPublish(open as any)).toThrow('must be sealed');
  });

  it('publish proof passes verification', () => {
    const sealed = psiCommit(phiNormalize(createPipeline(genesisState)));
    const published = psiPublish(sealed);
    const result = verifyPublishProof(
      published.publishProof!,
      published.current,
      sealed.sealProof.hash,
    );
    expect(result.valid).toBe(true);
  });

  it('detects tampered publish proof hash', () => {
    const sealed = psiCommit(phiNormalize(createPipeline(genesisState)));
    const published = psiPublish(sealed);
    const tampered = { ...published.publishProof!, hash: 'tampered' };
    const result = verifyPublishProof(tampered, published.current, sealed.sealProof.hash);
    expect(result.valid).toBe(false);
  });

  it('publish proof records genesis digest', () => {
    const sealed = psiCommit(phiNormalize(createPipeline(genesisState)));
    const published = psiPublish(sealed);
    const expectedDigest = stateHistoryDigest(published.current);
    expect(published.publishProof!.genesisDigest).toBe(expectedDigest);
  });
});

// ============================================================
// 6. Ω_compact
// ============================================================

describe('Ω_compact', () => {
  it('produces a compact proof', () => {
    const sealed = psiCommit(phiNormalize(createPipeline(genesisState)));
    const proof = omegaCompact(sealed);
    expect(proof).toBeDefined();
    expect(typeof proof.hash).toBe('string');
    expect(proof.transformCount).toBe(2);
  });

  it('records phase progression', () => {
    const sealed = psiCommit(phiNormalize(createPipeline(genesisState)));
    const proof = omegaCompact(sealed);
    expect(proof.phaseProgression).toContain('void');
    expect(proof.phaseProgression).toContain('ℕ');
  });

  it('records genesis transition count', () => {
    const sealed = psiCommit(phiNormalize(createPipeline(genesisState)));
    expect(omegaCompact(sealed).genesisTransitions).toBe(4);
  });

  it('records mark chain hashes including Ω', () => {
    const sealed = psiCommit(phiNormalize(createPipeline(genesisState)));
    const proof = omegaCompact(sealed);
    expect(proof.markChainHashes.length).toBe(3); // Φ + Ψ + Ω
  });

  it('includes seal proof hash', () => {
    const sealed = psiCommit(phiNormalize(createPipeline(genesisState)));
    const proof = omegaCompact(sealed);
    expect(proof.sealProofHash).toBe(sealed.sealProof.hash);
  });

  it('[ENH-3] includes historyDigest', () => {
    const sealed = psiCommit(phiNormalize(createPipeline(genesisState)));
    const proof = omegaCompact(sealed);
    expect(typeof proof.historyDigest).toBe('string');
    expect(proof.historyDigest).toBe(stateHistoryDigest(sealed.current));
  });

  it('[ENH-4] includes publishProofHash when published', () => {
    const sealed = psiCommit(phiNormalize(createPipeline(genesisState)));
    const published = psiPublish(sealed);
    const proof = omegaCompact(published);
    expect(proof.publishProofHash).toBe(published.publishProof!.hash);
  });

  it('[ENH-4] publishProofHash is null when not published', () => {
    const sealed = psiCommit(phiNormalize(createPipeline(genesisState)));
    const proof = omegaCompact(sealed);
    expect(proof.publishProofHash).toBeNull();
  });

  it('requires seal before compaction', () => {
    expect(() => omegaCompact(createPipeline(genesisState) as any)).toThrow();
  });
});

// ============================================================
// 7. Mark Chain Verification
// ============================================================

describe('Mark Chain', () => {
  it('valid chain passes', () => {
    const sealed = psiCommit(phiNormalize(createPipeline(genesisState)));
    expect(verifyMarkChain(sealed.markChain).valid).toBe(true);
  });

  it('detects broken parent chain', () => {
    const sealed = psiCommit(phiNormalize(createPipeline(genesisState)));
    const tampered = sealed.markChain.map((m, i) =>
      i === 1 ? { ...m, parentMarkId: 'wrong_id' } : m
    );
    expect(verifyMarkChain(tampered).valid).toBe(false);
  });

  it('detects non-monotonic ticks', () => {
    const sealed = psiCommit(phiNormalize(createPipeline(genesisState)));
    const tampered = sealed.markChain.map((m, i) =>
      i === 1 ? { ...m, tick: 0 } : m
    );
    const result = verifyMarkChain(tampered);
    expect(result.valid).toBe(false);
    expect(result.errors[0]).toContain('tick not monotonic');
  });

  it('detects false root', () => {
    const sealed = psiCommit(phiNormalize(createPipeline(genesisState)));
    const tampered = sealed.markChain.map((m, i) =>
      i === 0 ? { ...m, parentMarkId: 'phantom' } : m
    );
    expect(verifyMarkChain(tampered).valid).toBe(false);
  });

  it('multi-step chain maintains integrity', () => {
    let p = createPipeline(genesisState);
    p = phiNormalize(p);
    p = phiNormalize(p);
    p = phiNormalize(p);
    const sealed = psiCommit(p);
    expect(sealed.markChain.length).toBe(4);
    expect(verifyMarkChain(sealed.markChain).valid).toBe(true);
  });

  it('[ENH-4] chain includes publish mark', () => {
    const sealed = psiCommit(phiNormalize(createPipeline(genesisState)));
    const published = psiPublish(sealed);
    expect(published.markChain.length).toBe(3); // Φ + Ψ_commit + Ψ_publish
    expect(published.markChain[2].kind).toBe('psi_publish');
    expect(verifyMarkChain(published.markChain).valid).toBe(true);
  });
});

// ============================================================
// 8. Proof Verification
// ============================================================

describe('Seal Proof Verification', () => {
  it('valid seal proof passes', () => {
    const sealed = psiCommit(phiNormalize(createPipeline(genesisState)));
    expect(verifySealProof(sealed.sealProof, sealed.current).valid).toBe(true);
  });

  it('detects phase mismatch', () => {
    const sealed = psiCommit(phiNormalize(createPipeline(genesisState)));
    const wrong: GenesisState = { ...sealed.current, phase: 'void' };
    expect(verifySealProof(sealed.sealProof, wrong).valid).toBe(false);
  });

  it('detects tampered hash', () => {
    const sealed = psiCommit(phiNormalize(createPipeline(genesisState)));
    const tampered: SealProof = { ...sealed.sealProof, hash: 'tampered' };
    expect(verifySealProof(tampered, sealed.current).valid).toBe(false);
  });
});

describe('Compact Proof Verification', () => {
  it('valid compact proof passes', () => {
    const sealed = psiCommit(phiNormalize(createPipeline(genesisState)));
    expect(verifyCompactProof(omegaCompact(sealed)).valid).toBe(true);
  });

  it('detects tampered hash', () => {
    const sealed = psiCommit(phiNormalize(createPipeline(genesisState)));
    const proof = omegaCompact(sealed);
    expect(verifyCompactProof({ ...proof, hash: 'tampered' }).valid).toBe(false);
  });
});

// ============================================================
// 9. [ENH-3] Triangle Coherence
// ============================================================

describe('[ENH-3] Triangle Coherence', () => {
  it('valid pipeline passes triangle coherence', () => {
    const sealed = psiCommit(phiNormalize(createPipeline(genesisState)));
    const result = verifyTriangleCoherence(sealed);
    expect(result.valid).toBe(true);
    expect(result.markChainValid).toBe(true);
    expect(result.historyWitnessValid).toBe(true);
    expect(result.markHistoryBound).toBe(true);
  });

  it('validates with proof', () => {
    const sealed = psiCommit(phiNormalize(createPipeline(genesisState)));
    const proof = omegaCompact(sealed);
    const result = verifyTriangleCoherence(sealed, proof);
    expect(result.valid).toBe(true);
  });

  it('detects proof historyDigest mismatch', () => {
    const sealed = psiCommit(phiNormalize(createPipeline(genesisState)));
    const proof = omegaCompact(sealed);
    const tamperedProof = { ...proof, historyDigest: 'wrong_digest' };
    const result = verifyTriangleCoherence(sealed, tamperedProof);
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.includes('historyDigest'))).toBe(true);
  });

  it('detects tampered witness in pipeline', () => {
    const sealed = psiCommit(phiNormalize(createPipeline(genesisState)));
    // Tamper witness
    const tampered: Pipeline<'sealed'> = {
      ...sealed,
      current: {
        ...sealed.current,
        history: sealed.current.history.map((t, i) =>
          i === 0 ? { ...t, witness: { ...t.witness, hash: 'tampered' } } : t
        ),
      },
    };
    const result = verifyTriangleCoherence(tampered);
    expect(result.historyWitnessValid).toBe(false);
  });

  it('[ENH-4] works with published pipeline', () => {
    const sealed = psiCommit(phiNormalize(createPipeline(genesisState)));
    const published = psiPublish(sealed);
    const result = verifyTriangleCoherence(published);
    expect(result.valid).toBe(true);
  });

  it('first mark sourceHash matches original state', () => {
    const sealed = psiCommit(phiNormalize(createPipeline(genesisState)));
    const result = verifyTriangleCoherence(sealed);
    expect(result.markHistoryBound).toBe(true);
  });
});

// ============================================================
// 10. Transform Ordering Enforcement
// ============================================================

describe('Transform Ordering (Φ → Ψ → Ω)', () => {
  it('Φ → Ψ → Ω succeeds', () => {
    const sealed = psiCommit(phiNormalize(createPipeline(genesisState)));
    expect(omegaCompact(sealed)).toBeDefined();
  });

  it('Ψ → Ω succeeds (Φ optional)', () => {
    const sealed = psiCommit(createPipeline(genesisState));
    const proof = omegaCompact(sealed);
    expect(proof.transformCount).toBe(1);
  });

  it('Ω without Ψ fails', () => {
    expect(() => omegaCompact(createPipeline(genesisState) as any)).toThrow();
  });

  it('Φ after Ψ fails', () => {
    const sealed = psiCommit(createPipeline(genesisState));
    expect(() => phiNormalize(sealed as any)).toThrow();
  });

  it('Ψ after Ψ fails', () => {
    const sealed = psiCommit(createPipeline(genesisState));
    expect(() => psiCommit(sealed as any)).toThrow();
  });

  it('[ENH-4] Φ → Ψ → Ψ_publish → Ω succeeds', () => {
    const sealed = psiCommit(phiNormalize(createPipeline(genesisState)));
    const published = psiPublish(sealed);
    const proof = omegaCompact(published);
    expect(proof).toBeDefined();
    expect(proof.publishProofHash).not.toBeNull();
  });
});

// ============================================================
// 11. Full Pipeline (Integration)
// ============================================================

describe('executeFullPipeline', () => {
  it('produces valid proof and seal proof', () => {
    const { proof, sealProof, pipeline } = executeFullPipeline(genesisState);
    expect(proof).toBeDefined();
    expect(sealProof).toBeDefined();
    expect(pipeline._phase).toBe('sealed');
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

  it('[ENH-3] triangle coherence passes', () => {
    const { proof, pipeline } = executeFullPipeline(genesisState);
    expect(verifyTriangleCoherence(pipeline, proof).valid).toBe(true);
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
    }
  });

  it('is reproducible', () => {
    resetMarkCounter();
    const { proof: p1 } = executeFullPipeline(genesisState);
    resetMarkCounter();
    const { proof: p2 } = executeFullPipeline(runFullGenesis(0.3));
    expect(p1.hash).toBe(p2.hash);
  });
});

// ============================================================
// 12. [ENH-4] executePublishPipeline (Integration)
// ============================================================

describe('[ENH-4] executePublishPipeline', () => {
  it('produces valid proof, seal proof, and publish proof', () => {
    const { proof, sealProof, publishProof, pipeline } = executePublishPipeline(genesisState);
    expect(proof).toBeDefined();
    expect(sealProof).toBeDefined();
    expect(publishProof).toBeDefined();
    expect(pipeline._phase).toBe('sealed');
  });

  it('all proofs pass verification', () => {
    const { proof, sealProof, publishProof, pipeline } = executePublishPipeline(genesisState);
    expect(verifyCompactProof(proof).valid).toBe(true);
    expect(verifySealProof(sealProof, pipeline.current).valid).toBe(true);
    expect(verifyPublishProof(publishProof, pipeline.current, sealProof.hash).valid).toBe(true);
  });

  it('triangle coherence passes with publish', () => {
    const { proof, pipeline } = executePublishPipeline(genesisState);
    expect(verifyTriangleCoherence(pipeline, proof).valid).toBe(true);
  });

  it('compact proof includes publish proof hash', () => {
    const { proof, publishProof } = executePublishPipeline(genesisState);
    expect(proof.publishProofHash).toBe(publishProof.hash);
  });

  it('mark chain has 3 marks: Φ + Ψ_commit + Ψ_publish', () => {
    const { pipeline } = executePublishPipeline(genesisState);
    expect(pipeline.markChain.length).toBe(3);
    expect(pipeline.markChain[0].kind).toBe('phi_normalize');
    expect(pipeline.markChain[1].kind).toBe('psi_commit');
    expect(pipeline.markChain[2].kind).toBe('psi_publish');
  });

  it('works with different energy levels', () => {
    for (const energy of [0.15, 0.2, 0.3, 0.5]) {
      resetMarkCounter();
      const state = runFullGenesis(energy);
      const { proof, sealProof, publishProof, pipeline } = executePublishPipeline(state);
      expect(verifyCompactProof(proof).valid).toBe(true);
      expect(verifyPublishProof(publishProof, pipeline.current, sealProof.hash).valid).toBe(true);
    }
  });

  it('is reproducible', () => {
    resetMarkCounter();
    const { proof: p1 } = executePublishPipeline(genesisState);
    resetMarkCounter();
    const { proof: p2 } = executePublishPipeline(runFullGenesis(0.3));
    expect(p1.hash).toBe(p2.hash);
  });
});

// ============================================================
// 13. Edge Cases
// ============================================================

describe('Edge Cases', () => {
  it('pipeline with void-only state', () => {
    const result = phiNormalize(createPipeline(createGenesis()));
    expect(result.current.phase).toBe('void');
  });

  it('pipeline with partial genesis', () => {
    resetMarkCounter();
    let state = createGenesis();
    state = evolve(state, 0.5);
    expect(state.phase).toBe('dot');
    const sealed = psiCommit(phiNormalize(createPipeline(state)));
    const proof = omegaCompact(sealed);
    expect(proof.genesisTransitions).toBe(1);
    expect(proof.phaseProgression).toContain('・');
  });

  it('[ENH-2] type-level: cannot assign sealed to open', () => {
    // This is a compile-time guarantee — we verify the runtime tag
    const open = createPipeline(genesisState);
    expect(open._phase).toBe('open');
    const sealed = psiCommit(open);
    expect(sealed._phase).toBe('sealed');
    // At runtime, _phase tag correctly tracks state
    expect(open._phase !== sealed._phase).toBe(true);
  });
});
