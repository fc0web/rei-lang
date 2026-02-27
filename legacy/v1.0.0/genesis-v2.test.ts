// ============================================================
// Rei (0₀式) Genesis Axiom System v2 — Test Suite
// 仕様テスト: witness, monotone, reproducibility, CS assumption
// ============================================================

import { describe, it, expect } from 'vitest';
import {
  createGenesis,
  evolve,
  runFullGenesis,
  firewallCheck,
  phaseDelta,
  phaseIndex,
  computeProgress,
  evaluateCS,
  fnv1a32,
  verifyTheoremS0,
  verifyTheoremS1,
  verifyMonotonicity,
  verifyAllWitnesses,
  CURVATURE_THRESHOLD,
  ENTROPY_DECAY,
  STRUCTURE_GROWTH,
  type GenesisPhase,
  type GenesisState,
  type GenesisTransition,
} from '../src/genesis-axioms-v2';

// ============================================================
// 1. Basic Phase Progression
// ============================================================

describe('Phase Progression', () => {
  it('creates initial void state', () => {
    const state = createGenesis();
    expect(state.phase).toBe('void');
    expect(state.curvature).toBe(0);
    expect(state.entropy).toBe(1.0);
    expect(state.structure).toBe(0.1);
    expect(state.history.length).toBe(0);
    expect(state.tick).toBe(0);
  });

  it('evolves from void to number', () => {
    const state = runFullGenesis(0.3);
    expect(state.phase).toBe('number');
    expect(state.history.length).toBe(4); // void→dot→0₀→0→number
  });

  it('passes through all phases in order', () => {
    const state = runFullGenesis(0.3);
    const phases = state.history.map(t => t.to);
    expect(phases).toEqual(['dot', 'zero_zero', 'zero', 'number']);
  });

  it('does not skip phases with low energy', () => {
    let state = createGenesis();
    // Very low energy — should evolve slowly
    for (let i = 0; i < 5; i++) {
      state = evolve(state, 0.05);
    }
    // Should not have reached number yet
    expect(phaseIndex(state.phase)).toBeLessThan(phaseIndex('number'));
  });
});

// ============================================================
// 2. Firewall Rule
// ============================================================

describe('Firewall Rule (FR)', () => {
  it('allows exactly one-step transitions', () => {
    expect(firewallCheck('void', 'dot')).toBe(true);
    expect(firewallCheck('dot', 'zero_zero')).toBe(true);
    expect(firewallCheck('zero_zero', 'zero')).toBe(true);
    expect(firewallCheck('zero', 'number')).toBe(true);
  });

  it('blocks phase-skipping', () => {
    expect(firewallCheck('void', 'zero_zero')).toBe(false);
    expect(firewallCheck('void', 'zero')).toBe(false);
    expect(firewallCheck('void', 'number')).toBe(false);
    expect(firewallCheck('dot', 'zero')).toBe(false);
    expect(firewallCheck('dot', 'number')).toBe(false);
    expect(firewallCheck('zero_zero', 'number')).toBe(false);
  });

  it('blocks backward transitions', () => {
    expect(firewallCheck('dot', 'void')).toBe(false);
    expect(firewallCheck('zero_zero', 'dot')).toBe(false);
    expect(firewallCheck('number', 'zero')).toBe(false);
  });

  it('blocks self-transitions', () => {
    expect(firewallCheck('void', 'void')).toBe(false);
    expect(firewallCheck('dot', 'dot')).toBe(false);
    expect(firewallCheck('number', 'number')).toBe(false);
  });
});

// ============================================================
// 3. Phase Delta (Monotonicity Primitive)
// ============================================================

describe('phaseDelta', () => {
  it('returns positive for forward transitions', () => {
    expect(phaseDelta('void', 'dot')).toBe(1);
    expect(phaseDelta('void', 'number')).toBe(4);
  });

  it('returns negative for backward transitions', () => {
    expect(phaseDelta('number', 'void')).toBe(-4);
    expect(phaseDelta('dot', 'void')).toBe(-1);
  });

  it('returns zero for self', () => {
    expect(phaseDelta('void', 'void')).toBe(0);
    expect(phaseDelta('number', 'number')).toBe(0);
  });
});

// ============================================================
// 4. Witness System
// ============================================================

describe('Witness', () => {
  it('attaches witness to every transition', () => {
    const state = runFullGenesis(0.3);
    for (const t of state.history) {
      expect(t.witness).toBeDefined();
      expect(t.witness.kind).toBeDefined();
      expect(t.witness.hash).toBeDefined();
      expect(t.witness.payload).toBeDefined();
    }
  });

  it('assigns correct witness kind per phase transition', () => {
    const state = runFullGenesis(0.3);
    const kinds = state.history.map(t => t.witness.kind);
    expect(kinds).toEqual([
      'existence',              // void → dot
      'structure_separation',   // dot → zero_zero
      'value_fixation',         // zero_zero → zero
      'number_genesis',         // zero → number
    ]);
  });

  it('includes threshold and progress in payload', () => {
    const state = runFullGenesis(0.3);
    for (const t of state.history) {
      expect(typeof t.witness.payload.threshold).toBe('number');
      expect(typeof t.witness.payload.progress).toBe('number');
    }
  });

  it('[FIX-1] progress ≥ 1.0 for all transitions (except void→dot)', () => {
    const state = runFullGenesis(0.3);
    for (const t of state.history) {
      if (t.from === 'void') continue; // void→dot has no threshold
      expect(t.witness.payload.progress).toBeGreaterThanOrEqual(1.0);
    }
  });

  it('[FIX-1] uses energized state for progress computation', () => {
    // Verify that the progress in witness matches what we'd get
    // from computeProgress on the energized state
    const state = runFullGenesis(0.3);
    for (const t of state.history) {
      // Reconstruct: progress should reflect the state AT transition time
      // Since [FIX-1], this should always be ≥ 1.0 for non-void transitions
      if (t.from !== 'void') {
        expect(t.witness.payload.progress).toBeGreaterThanOrEqual(1.0);
      }
    }
  });
});

// ============================================================
// 5. CS Assumption (General Position)
// ============================================================

describe('CS Assumption', () => {
  it('includes CS in every witness payload', () => {
    const state = runFullGenesis(0.3);
    for (const t of state.history) {
      expect(t.witness.payload.cs).toBeDefined();
      expect(typeof t.witness.payload.cs.satisfied).toBe('boolean');
      expect(typeof t.witness.payload.cs.indicator).toBe('number');
      expect(typeof t.witness.payload.cs.description).toBe('string');
    }
  });

  it('CS holds under normal evolution', () => {
    const state = runFullGenesis(0.3);
    for (const t of state.history) {
      expect(t.witness.payload.cs.satisfied).toBe(true);
    }
  });

  it('CS indicator is positive under normal conditions', () => {
    const state = runFullGenesis(0.3);
    for (const t of state.history) {
      expect(t.witness.payload.cs.indicator).toBeGreaterThan(0);
    }
  });

  it('CS fails with zero energy', () => {
    const state = createGenesis();
    const cs = evaluateCS(state, 0);
    expect(cs.satisfied).toBe(false);
    expect(cs.description).toContain('zero energy');
  });

  it('CS fails with degenerate structure', () => {
    const state: GenesisState = {
      phase: 'dot',
      curvature: 0.5,
      entropy: 0.8,
      structure: 0,  // degenerate
      history: [],
      tick: 5,
    };
    const cs = evaluateCS(state, 0.2);
    expect(cs.satisfied).toBe(false);
    expect(cs.description).toContain('degenerate structure');
  });

  it('CS fails with dissipated entropy', () => {
    const state: GenesisState = {
      phase: 'zero_zero',
      curvature: 0.8,
      entropy: 0,  // dissipated
      structure: 1.5,
      history: [],
      tick: 10,
    };
    const cs = evaluateCS(state, 0.2);
    expect(cs.satisfied).toBe(false);
    expect(cs.description).toContain('dissipated entropy');
  });
});

// ============================================================
// 6. Theorem S₀ / S₁ Verification
// ============================================================

describe('Theorem S₀ (・ →G 0₀ uniqueness)', () => {
  it('holds for normal genesis', () => {
    const state = runFullGenesis(0.3);
    const s0 = verifyTheoremS0(state);
    expect(s0.valid).toBe(true);
    expect(s0.csHolds).toBe(true);
  });

  it('reports CS status', () => {
    const state = runFullGenesis(0.3);
    const s0 = verifyTheoremS0(state);
    expect(s0.csHolds).toBe(true);
    expect(s0.message).toContain('CS=true');
  });
});

describe('Theorem S₁ (0₀ →G 0 uniqueness)', () => {
  it('holds for normal genesis', () => {
    const state = runFullGenesis(0.3);
    const s1 = verifyTheoremS1(state);
    expect(s1.valid).toBe(true);
    expect(s1.csHolds).toBe(true);
  });

  it('reports CS status', () => {
    const state = runFullGenesis(0.3);
    const s1 = verifyTheoremS1(state);
    expect(s1.csHolds).toBe(true);
    expect(s1.message).toContain('CS=true');
  });
});

// ============================================================
// 7. Monotonicity Verification
// ============================================================

describe('Monotonicity', () => {
  it('holds for normal genesis', () => {
    const state = runFullGenesis(0.3);
    const mono = verifyMonotonicity(state);
    expect(mono.valid).toBe(true);
  });

  it('detects tampered history (backward transition)', () => {
    // Construct a fake state with backward transition
    const fakeTransition: GenesisTransition = {
      from: 'zero_zero',
      to: 'dot',  // backward!
      tick: 5,
      curvature: 0.5,
      axiom: 'FAKE',
      witness: {
        kind: 'structure_separation',
        hash: 'deadbeef',
        payload: {
          from: 'zero_zero',
          to: 'dot',
          tick: 5,
          curvature: 0.5,
          entropy: 0.8,
          structure: 1.0,
          threshold: 0.35,
          progress: 1.5,
          cs: { satisfied: true, indicator: 0.5, description: 'FAKE' },
        },
      },
    };

    const fakeState: GenesisState = {
      phase: 'dot',
      curvature: 0.5,
      entropy: 0.8,
      structure: 1.0,
      history: [fakeTransition],
      tick: 6,
    };

    const mono = verifyMonotonicity(fakeState);
    expect(mono.valid).toBe(false);
    expect(mono.message).toContain('Monotonicity violated');
  });

  it('detects tampered history (phase skip)', () => {
    const fakeTransition: GenesisTransition = {
      from: 'void',
      to: 'zero',  // skip!
      tick: 1,
      curvature: 0.5,
      axiom: 'FAKE',
      witness: {
        kind: 'existence',
        hash: 'deadbeef',
        payload: {
          from: 'void',
          to: 'zero',
          tick: 1,
          curvature: 0.5,
          entropy: 0.9,
          structure: 0.5,
          threshold: 0,
          progress: 1.0,
          cs: { satisfied: true, indicator: 0.5, description: 'FAKE' },
        },
      },
    };

    const fakeState: GenesisState = {
      phase: 'zero',
      curvature: 0.5,
      entropy: 0.9,
      structure: 0.5,
      history: [fakeTransition],
      tick: 2,
    };

    const mono = verifyMonotonicity(fakeState);
    expect(mono.valid).toBe(false);
  });
});

// ============================================================
// 8. Witness Integrity Verification
// ============================================================

describe('Witness Integrity', () => {
  it('all witnesses pass integrity check for normal genesis', () => {
    const state = runFullGenesis(0.3);
    const result = verifyAllWitnesses(state);
    expect(result.valid).toBe(true);
    expect(result.errors).toEqual([]);
  });

  it('detects hash tampering', () => {
    const state = runFullGenesis(0.3);
    // Tamper with hash
    const tampered: GenesisState = {
      ...state,
      history: state.history.map((t, i) =>
        i === 0
          ? { ...t, witness: { ...t.witness, hash: 'tampered!' } }
          : t
      ),
    };

    const result = verifyAllWitnesses(tampered);
    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
    expect(result.errors[0]).toContain('hash mismatch');
  });

  it('detects kind tampering', () => {
    const state = runFullGenesis(0.3);
    // Change kind of first transition (should be 'existence')
    const tampered: GenesisState = {
      ...state,
      history: state.history.map((t, i) =>
        i === 0
          ? { ...t, witness: { ...t.witness, kind: 'value_fixation' as any } }
          : t
      ),
    };

    const result = verifyAllWitnesses(tampered);
    expect(result.valid).toBe(false);
    expect(result.errors[0]).toContain('kind mismatch');
  });
});

// ============================================================
// 9. Hash Reproducibility
// ============================================================

describe('Hash Reproducibility', () => {
  it('same parameters produce same hash', () => {
    const state1 = runFullGenesis(0.3);
    const state2 = runFullGenesis(0.3);

    expect(state1.history.length).toBe(state2.history.length);

    for (let i = 0; i < state1.history.length; i++) {
      expect(state1.history[i].witness.hash).toBe(state2.history[i].witness.hash);
    }
  });

  it('different energyPerStep produces different hashes', () => {
    const state1 = runFullGenesis(0.2);
    const state2 = runFullGenesis(0.3);

    // At least some hashes should differ (different physics paths)
    const hashesMatch = state1.history.every((t, i) =>
      i < state2.history.length && t.witness.hash === state2.history[i].witness.hash
    );
    expect(hashesMatch).toBe(false);
  });

  it('FNV-1a produces consistent output', () => {
    expect(fnv1a32('hello')).toBe(fnv1a32('hello'));
    expect(fnv1a32('hello')).not.toBe(fnv1a32('world'));
  });

  it('FNV-1a produces 8-character hex strings', () => {
    const hash = fnv1a32('test input');
    expect(hash).toMatch(/^[0-9a-f]{8}$/);
  });
});

// ============================================================
// 10. [FIX-2] No Double Decay/Growth on Transition
// ============================================================

describe('[FIX-2] Single Physics Update', () => {
  it('entropy decays exactly once per tick (with or without transition)', () => {
    // Run one step that triggers a transition (void→dot at tick 1)
    let state = createGenesis();
    state = evolve(state, 0.5);

    // entropy should be 1.0 * ENTROPY_DECAY = 0.95 (exactly one decay)
    expect(state.entropy).toBeCloseTo(1.0 * ENTROPY_DECAY, 10);
  });

  it('structure grows exactly once per tick on transition', () => {
    let state = createGenesis();
    state = evolve(state, 0.5);

    // structure should be 0.1 * STRUCTURE_GROWTH = 0.11 (exactly one growth)
    expect(state.structure).toBeCloseTo(0.1 * STRUCTURE_GROWTH, 10);
  });

  it('physics is consistent across transition and non-transition steps', () => {
    // Compare: step with transition vs step without
    let stateA = createGenesis();
    stateA = evolve(stateA, 0.5); // void→dot (transition)

    let stateB: GenesisState = {
      ...createGenesis(),
      phase: 'dot', // already at dot, no transition will fire with same curvature
    };
    stateB = evolve(stateB, 0.5); // no transition (stays dot, curvature not high enough for next)

    // Both should have same entropy decay factor applied once
    expect(stateA.entropy).toBeCloseTo(1.0 * ENTROPY_DECAY, 10);
    expect(stateB.entropy).toBeCloseTo(1.0 * ENTROPY_DECAY, 10);
  });
});

// ============================================================
// 11. computeProgress Correctness
// ============================================================

describe('computeProgress', () => {
  it('void phase has full progress', () => {
    const state = createGenesis();
    const { threshold, progress } = computeProgress(state);
    expect(threshold).toBe(0);
    expect(progress).toBe(1.0);
  });

  it('dot phase uses curvature threshold ×0.5', () => {
    const state: GenesisState = {
      phase: 'dot',
      curvature: CURVATURE_THRESHOLD * 0.25,
      entropy: 0.9,
      structure: 0.2,
      history: [],
      tick: 3,
    };
    const { threshold, progress } = computeProgress(state);
    expect(threshold).toBe(CURVATURE_THRESHOLD * 0.5);
    expect(progress).toBeCloseTo(0.5, 5); // 0.175 / 0.35 = 0.5
  });

  it('zero_zero phase uses full curvature threshold', () => {
    const state: GenesisState = {
      phase: 'zero_zero',
      curvature: CURVATURE_THRESHOLD,
      entropy: 0.8,
      structure: 1.0,
      history: [],
      tick: 5,
    };
    const { threshold, progress } = computeProgress(state);
    expect(threshold).toBe(CURVATURE_THRESHOLD);
    expect(progress).toBeCloseTo(1.0, 5);
  });

  it('zero phase uses structure threshold', () => {
    const state: GenesisState = {
      phase: 'zero',
      curvature: 0.8,
      entropy: 0.7,
      structure: 1.0,
      history: [],
      tick: 8,
    };
    const { threshold, progress } = computeProgress(state);
    expect(threshold).toBe(2.0);
    expect(progress).toBeCloseTo(0.5, 5);
  });

  it('number (terminal) phase has full progress', () => {
    const state: GenesisState = {
      phase: 'number',
      curvature: 0.6,
      entropy: 0.5,
      structure: 3.0,
      history: [],
      tick: 15,
    };
    const { threshold, progress } = computeProgress(state);
    expect(progress).toBe(1.0);
  });
});

// ============================================================
// 12. Integration: Full Genesis Audit
// ============================================================

describe('Full Genesis Audit', () => {
  const energyLevels = [0.15, 0.2, 0.25, 0.3, 0.4, 0.5];

  for (const energy of energyLevels) {
    describe(`energy=${energy}`, () => {
      let state: GenesisState;

      // Run once and reuse
      state = runFullGenesis(energy);

      it('reaches number phase', () => {
        state = runFullGenesis(energy);
        expect(state.phase).toBe('number');
      });

      it('has exactly 4 transitions', () => {
        state = runFullGenesis(energy);
        expect(state.history.length).toBe(4);
      });

      it('S₀ holds', () => {
        state = runFullGenesis(energy);
        expect(verifyTheoremS0(state).valid).toBe(true);
      });

      it('S₁ holds', () => {
        state = runFullGenesis(energy);
        expect(verifyTheoremS1(state).valid).toBe(true);
      });

      it('monotonicity holds', () => {
        state = runFullGenesis(energy);
        expect(verifyMonotonicity(state).valid).toBe(true);
      });

      it('all witnesses pass integrity', () => {
        state = runFullGenesis(energy);
        expect(verifyAllWitnesses(state).valid).toBe(true);
      });

      it('CS holds for all transitions', () => {
        state = runFullGenesis(energy);
        for (const t of state.history) {
          expect(t.witness.payload.cs.satisfied).toBe(true);
        }
      });

      it('is reproducible', () => {
        const a = runFullGenesis(energy);
        const b = runFullGenesis(energy);
        for (let i = 0; i < a.history.length; i++) {
          expect(a.history[i].witness.hash).toBe(b.history[i].witness.hash);
        }
      });
    });
  }
});
