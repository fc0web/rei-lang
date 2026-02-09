// ============================================================
// Rei (0₀式) Phase Guard + Curvature Literal Tests
// Author: Nobuki Fujimoto
// ============================================================

import { describe, it, expect } from 'vitest';

// --- Phase Guard imports ---
import {
  guard,
  guardedParam,
  guardedFunction,
  validatePhaseGuard,
  validatePhaseTransition,
  phaseValue,
  applyGuardedFunction,
  displayFunction,
  displayParam,
  GUARD_NORMALIZE,
  GUARD_COMMIT,
  GUARD_COMPACT,
  GUARD_EMERGE,
  GUARD_SEPARATE,
  GUARD_FIX_VALUE,
  GUARD_TO_NUMBER,
  type PhaseGuardedValue,
} from '../src/genesis/phase-guard';

// --- Curvature Literal imports ---
import {
  κ,
  kappa,
  curvatureAdd,
  curvatureSub,
  curvatureMul,
  curvatureDiv,
  curvaturePipe,
  curvaturePipeChain,
  curvatureGt,
  curvatureLt,
  curvatureEq,
  extractCurvature,
  curvatureDecay,
  curvatureGrow,
  checkPhaseTransition,
  energize,
  curvatureMultiDim,
  multiDimMeanCurvature,
  multiDimMaxCurvature,
  multiDimConvolve,
  displayCurvature,
  displayCurvatureMultiDim,
  curvatureOp,
  type CurvatureValue,
} from '../src/genesis/curvature-literal';

// ============================================================
// Phase Guard Tests
// ============================================================

describe('Phase Guard — @ Phase', () => {

  // --- I. Guard Creation ---
  describe('Guard Creation', () => {
    it('creates pipeline guards', () => {
      const g = guard('open');
      expect(g.phase).toBe('open');
      expect(g.category).toBe('pipeline');
      expect(g.strict).toBe(true);
    });

    it('creates genesis guards', () => {
      const g = guard('void');
      expect(g.phase).toBe('void');
      expect(g.category).toBe('genesis');
    });

    it('creates non-strict guards', () => {
      const g = guard('sealed', false);
      expect(g.strict).toBe(false);
    });
  });

  // --- II. Phase Validation ---
  describe('Phase Validation', () => {
    it('accepts matching pipeline phase', () => {
      const result = validatePhaseGuard('open', guard('open'));
      expect(result.valid).toBe(true);
      expect(result.kind).toBe('match');
    });

    it('rejects mismatched pipeline phase', () => {
      const result = validatePhaseGuard('sealed', guard('open'));
      expect(result.valid).toBe(false);
      expect(result.kind).toBe('mismatch');
      expect(result.error).toContain('@ open');
      expect(result.error).toContain('@ sealed');
    });

    it('accepts matching genesis phase', () => {
      const result = validatePhaseGuard('dot', guard('dot'));
      expect(result.valid).toBe(true);
    });

    it('rejects genesis phase applied to pipeline guard', () => {
      const result = validatePhaseGuard('void', guard('open'));
      expect(result.valid).toBe(false);
      expect(result.kind).toBe('category_mismatch');
    });

    it('rejects pipeline phase applied to genesis guard', () => {
      const result = validatePhaseGuard('sealed', guard('dot'));
      expect(result.valid).toBe(false);
      expect(result.kind).toBe('category_mismatch');
    });

    it('non-strict: accepts higher pipeline phase', () => {
      const result = validatePhaseGuard('sealed', guard('open', false));
      expect(result.valid).toBe(true);
    });

    it('non-strict: rejects lower pipeline phase', () => {
      const result = validatePhaseGuard('open', guard('sealed', false));
      expect(result.valid).toBe(false);
    });

    it('non-strict: accepts higher genesis phase', () => {
      const result = validatePhaseGuard('zero', guard('dot', false));
      expect(result.valid).toBe(true);
    });
  });

  // --- III. Phase Transition Validation ---
  describe('Phase Transition Validation', () => {
    it('allows Open → Sealed', () => {
      const result = validatePhaseTransition(guard('open'), guard('sealed'));
      expect(result.valid).toBe(true);
    });

    it('allows Sealed → Compacted', () => {
      const result = validatePhaseTransition(guard('sealed'), guard('compacted'));
      expect(result.valid).toBe(true);
    });

    it('allows same phase (Open → Open)', () => {
      const result = validatePhaseTransition(guard('open'), guard('open'));
      expect(result.valid).toBe(true);
    });

    it('rejects regression (Sealed → Open)', () => {
      const result = validatePhaseTransition(guard('sealed'), guard('open'));
      expect(result.valid).toBe(false);
      expect(result.kind).toBe('regression');
    });

    it('rejects skip (Open → Compacted)', () => {
      const result = validatePhaseTransition(guard('open'), guard('compacted'));
      expect(result.valid).toBe(false);
    });

    it('allows genesis: void → dot', () => {
      const result = validatePhaseTransition(guard('void'), guard('dot'));
      expect(result.valid).toBe(true);
    });

    it('allows genesis: dot → zero_zero', () => {
      const result = validatePhaseTransition(guard('dot'), guard('zero_zero'));
      expect(result.valid).toBe(true);
    });

    it('rejects genesis regression: zero → dot', () => {
      const result = validatePhaseTransition(guard('zero'), guard('dot'));
      expect(result.valid).toBe(false);
      expect(result.kind).toBe('regression');
    });

    it('rejects genesis skip: void → zero_zero', () => {
      const result = validatePhaseTransition(guard('void'), guard('zero_zero'));
      expect(result.valid).toBe(false);
    });

    it('rejects cross-category: pipeline → genesis', () => {
      const result = validatePhaseTransition(guard('open'), guard('void'));
      expect(result.valid).toBe(false);
      expect(result.kind).toBe('category_mismatch');
    });
  });

  // --- IV. Function Application ---
  describe('Function Application with Phase Guard', () => {
    const identity = (inputs: readonly number[]) => inputs[0];
    const doubler = (inputs: readonly number[]) => inputs[0] * 2;

    it('normalize: accepts @ Open', () => {
      const input = phaseValue(42, 'open');
      const result = applyGuardedFunction(GUARD_NORMALIZE, [input], identity);
      expect(result.success).toBe(true);
      expect(result.result?.value).toBe(42);
      expect(result.result?.phase).toBe('open');
    });

    it('normalize: rejects @ Sealed', () => {
      const input = phaseValue(42, 'sealed');
      const result = applyGuardedFunction(GUARD_NORMALIZE, [input], identity);
      expect(result.success).toBe(false);
      expect(result.errors[0]).toContain('@ open');
    });

    it('commit: Open → Sealed transition', () => {
      const input = phaseValue(42, 'open');
      const result = applyGuardedFunction(GUARD_COMMIT, [input], identity, 'sealed');
      expect(result.success).toBe(true);
      expect(result.result?.phase).toBe('sealed');
      expect(result.phaseTransition).toEqual({ from: 'open', to: 'sealed' });
    });

    it('compact: Sealed → Compacted transition', () => {
      const input = phaseValue(42, 'sealed');
      const result = applyGuardedFunction(GUARD_COMPACT, [input], identity, 'compacted');
      expect(result.success).toBe(true);
      expect(result.result?.phase).toBe('compacted');
      expect(result.phaseTransition).toEqual({ from: 'sealed', to: 'compacted' });
    });

    it('compact: rejects @ Open', () => {
      const input = phaseValue(42, 'open');
      const result = applyGuardedFunction(GUARD_COMPACT, [input], identity);
      expect(result.success).toBe(false);
    });

    it('genesis emerge: void → dot', () => {
      const input = phaseValue(0, 'void');
      const result = applyGuardedFunction(GUARD_EMERGE, [input], identity, 'dot');
      expect(result.success).toBe(true);
      expect(result.phaseTransition).toEqual({ from: 'void', to: 'dot' });
    });

    it('genesis full chain: void → dot → zero_zero → zero → number', () => {
      let v: PhaseGuardedValue<number> = phaseValue(0, 'void');

      const r1 = applyGuardedFunction(GUARD_EMERGE, [v], identity, 'dot');
      expect(r1.success).toBe(true);
      v = r1.result!;

      const r2 = applyGuardedFunction(GUARD_SEPARATE, [v], identity, 'zero_zero');
      expect(r2.success).toBe(true);
      v = r2.result!;

      const r3 = applyGuardedFunction(GUARD_FIX_VALUE, [v], identity, 'zero');
      expect(r3.success).toBe(true);
      v = r3.result!;

      const r4 = applyGuardedFunction(GUARD_TO_NUMBER, [v], identity, 'number');
      expect(r4.success).toBe(true);
      v = r4.result!;

      expect(v.phase).toBe('number');
      expect(v.witnesses).toHaveLength(4);
    });

    it('rejects wrong argument count', () => {
      const result = applyGuardedFunction(GUARD_NORMALIZE, [], identity);
      expect(result.success).toBe(false);
      expect(result.errors[0]).toContain('Expected 1');
    });

    it('accumulates witnesses through pipeline', () => {
      let v = phaseValue(10, 'open', ['source:raw']);
      const r1 = applyGuardedFunction(GUARD_NORMALIZE, [v], doubler);
      expect(r1.success).toBe(true);
      expect(r1.result!.witnesses).toContain('source:raw');
      expect(r1.result!.witnesses).toContain('normalize@open');
    });
  });

  // --- V. Display ---
  describe('Display', () => {
    it('displays normalize in Rei notation', () => {
      const s = displayFunction(GUARD_NORMALIZE);
      expect(s).toContain('compress');
      expect(s).toContain('normalize');
      expect(s).toContain('@ Open');
    });

    it('displays commit with return guard', () => {
      const s = displayFunction(GUARD_COMMIT);
      expect(s).toContain('-> Pipeline @ Sealed');
    });

    it('displays genesis emerge', () => {
      const s = displayFunction(GUARD_EMERGE);
      expect(s).toContain('@ Void');
      expect(s).toContain('@ Dot');
    });
  });
});

// ============================================================
// Curvature Literal Tests
// ============================================================

describe('Curvature Literal — κ', () => {

  // --- I. Creation ---
  describe('Creation', () => {
    it('creates 5κ0.3', () => {
      const cv = κ(5, 0.3);
      expect(cv.value).toBe(5);
      expect(cv.curvature).toBe(0.3);
      expect(cv.origin).toBe('literal');
    });

    it('creates 0κ0.0 (zero curvature)', () => {
      const cv = κ(0, 0.0);
      expect(cv.value).toBe(0);
      expect(cv.curvature).toBe(0);
    });

    it('creates 42κ1.0 (maximum curvature)', () => {
      const cv = κ(42, 1.0);
      expect(cv.curvature).toBe(1.0);
    });

    it('rejects κ > 1', () => {
      expect(() => κ(5, 1.5)).toThrow('Curvature κ must be in [0, 1]');
    });

    it('rejects κ < 0', () => {
      expect(() => κ(5, -0.1)).toThrow('Curvature κ must be in [0, 1]');
    });

    it('kappa alias works', () => {
      const cv = kappa(5, 0.3);
      expect(cv.value).toBe(5);
      expect(cv.curvature).toBe(0.3);
    });
  });

  // --- II. Arithmetic ---
  describe('Arithmetic', () => {
    it('addition: 5κ0.3 + 3κ0.5 → 8κ(weighted avg)', () => {
      const result = curvatureAdd(κ(5, 0.3), κ(3, 0.5));
      expect(result.value).toBe(8);
      // weighted avg: (0.3*5 + 0.5*3) / (5+3) = 3.0/8 = 0.375
      expect(result.curvature).toBeCloseTo(0.375, 4);
      expect(result.origin).toBe('computed');
    });

    it('subtraction: 5κ0.3 - 3κ0.5 → 2κ(weighted avg)', () => {
      const result = curvatureSub(κ(5, 0.3), κ(3, 0.5));
      expect(result.value).toBe(2);
      expect(result.curvature).toBeCloseTo(0.375, 4);
    });

    it('multiplication: 5κ0.3 * 2κ0.7 → 10κ(geometric mean)', () => {
      const result = curvatureMul(κ(5, 0.3), κ(2, 0.7));
      expect(result.value).toBe(10);
      // geometric mean: √(0.3 * 0.7) ≈ 0.4583
      expect(result.curvature).toBeCloseTo(Math.sqrt(0.21), 4);
    });

    it('division: 10κ0.3 / 2κ0.7 → 5κ(geometric mean)', () => {
      const result = curvatureDiv(κ(10, 0.3), κ(2, 0.7));
      expect(result.value).toBe(5);
      expect(result.curvature).toBeCloseTo(Math.sqrt(0.21), 4);
    });

    it('division by zero throws', () => {
      expect(() => curvatureDiv(κ(10, 0.3), κ(0, 0.5))).toThrow('Division by zero');
    });

    it('0κ0 + 0κ0 → 0κ0', () => {
      const result = curvatureAdd(κ(0, 0), κ(0, 0));
      expect(result.value).toBe(0);
      expect(result.curvature).toBe(0);
    });

    it('curvatureOp works for all operations', () => {
      expect(curvatureOp(κ(3, 0.2), κ(2, 0.4), 'add').value).toBe(5);
      expect(curvatureOp(κ(3, 0.2), κ(2, 0.4), 'sub').value).toBe(1);
      expect(curvatureOp(κ(3, 0.2), κ(2, 0.4), 'mul').value).toBe(6);
      expect(curvatureOp(κ(6, 0.2), κ(2, 0.4), 'div').value).toBe(3);
    });
  });

  // --- III. Pipe Propagation ---
  describe('Pipe Propagation', () => {
    it('5κ0.3 |> double → 10κ0.3', () => {
      const result = curvaturePipe(κ(5, 0.3), x => x * 2);
      expect(result.value).toBe(10);
      expect(result.curvature).toBe(0.3);
      expect(result.origin).toBe('propagated');
    });

    it('5κ0.3 |> negate → -5κ0.3', () => {
      const result = curvaturePipe(κ(5, 0.3), x => -x);
      expect(result.value).toBe(-5);
      expect(result.curvature).toBe(0.3);
    });

    it('pipe chain preserves curvature', () => {
      const result = curvaturePipeChain(κ(5, 0.3), [
        x => x * 2,    // 10
        x => x + 3,    // 13
        x => -x,       // -13
      ]);
      expect(result.value).toBe(-13);
      expect(result.curvature).toBe(0.3);
    });
  });

  // --- IV. Comparison ---
  describe('Comparison', () => {
    it('>κ: 5κ0.5 >κ 3κ0.3 → true', () => {
      expect(curvatureGt(κ(5, 0.5), κ(3, 0.3))).toBe(true);
    });

    it('>κ: 5κ0.3 >κ 3κ0.5 → false', () => {
      expect(curvatureGt(κ(5, 0.3), κ(3, 0.5))).toBe(false);
    });

    it('<κ works', () => {
      expect(curvatureLt(κ(5, 0.3), κ(3, 0.5))).toBe(true);
    });

    it('=κ works', () => {
      expect(curvatureEq(κ(5, 0.3), κ(3, 0.3))).toBe(true);
    });

    it('.κ extracts curvature', () => {
      expect(extractCurvature(κ(42, 0.777))).toBe(0.777);
    });
  });

  // --- V. Decay & Growth ---
  describe('Decay & Growth', () => {
    it('decay reduces curvature', () => {
      const result = curvatureDecay(κ(5, 0.8));
      expect(result.curvature).toBeCloseTo(0.8 * 0.95, 4);
      expect(result.value).toBe(5);
      expect(result.origin).toBe('decayed');
    });

    it('grow increases curvature', () => {
      const result = curvatureGrow(κ(5, 0.3));
      expect(result.curvature).toBeCloseTo(0.3 * 1.1, 4);
      expect(result.value).toBe(5);
      expect(result.origin).toBe('grown');
    });

    it('curvature clamps at 1.0', () => {
      const result = curvatureGrow(κ(5, 0.95), 1.2);
      expect(result.curvature).toBeLessThanOrEqual(1.0);
    });

    it('curvature clamps at 0.0', () => {
      const result = curvatureDecay(κ(5, 0.01), 0.01);
      expect(result.curvature).toBeGreaterThanOrEqual(0);
    });
  });

  // --- VI. Phase Transition ---
  describe('Phase Transition', () => {
    it('no transition below threshold', () => {
      const event = checkPhaseTransition(κ(5, 0.3));
      expect(event.triggered).toBe(false);
    });

    it('transition at threshold', () => {
      const event = checkPhaseTransition(κ(5, 0.7));
      expect(event.triggered).toBe(true);
      expect(event.message).toContain('triggered');
    });

    it('transition above threshold', () => {
      const event = checkPhaseTransition(κ(5, 0.9));
      expect(event.triggered).toBe(true);
    });

    it('energize step by step', () => {
      let cv = κ(0, 0.0);

      const e1 = energize(cv, 0.3);
      expect(e1.result.curvature).toBeCloseTo(0.3, 4);
      expect(e1.transition.triggered).toBe(false);
      cv = e1.result;

      const e2 = energize(cv, 0.3);
      expect(e2.result.curvature).toBeCloseTo(0.6, 4);
      expect(e2.transition.triggered).toBe(false);
      cv = e2.result;

      const e3 = energize(cv, 0.3);
      expect(e3.result.curvature).toBeCloseTo(0.9, 4);
      expect(e3.transition.triggered).toBe(true);
      expect(e3.result.origin).toBe('transitioned');
    });

    it('energize clamps at 1.0', () => {
      const { result } = energize(κ(0, 0.9), 0.5);
      expect(result.curvature).toBe(1.0);
    });
  });

  // --- VII. Multi-Dimensional Curvature ---
  describe('Multi-Dimensional Curvature', () => {
    const md = curvatureMultiDim(
      κ(5, 0.3),
      [κ(1, 0.1), κ(2, 0.2), κ(3, 0.4), κ(4, 0.5)]
    );

    it('creates multi-dim with per-dimension κ', () => {
      expect(md.center.curvature).toBe(0.3);
      expect(md.neighbors[0].curvature).toBe(0.1);
      expect(md.neighbors[3].curvature).toBe(0.5);
    });

    it('mean curvature', () => {
      const mean = multiDimMeanCurvature(md);
      // (0.3 + 0.1 + 0.2 + 0.4 + 0.5) / 5 = 0.3
      expect(mean).toBeCloseTo(0.3, 4);
    });

    it('max curvature', () => {
      const max = multiDimMaxCurvature(md);
      expect(max.curvature).toBe(0.5);
      expect(max.value).toBe(4);
    });

    it('curvature-weighted convolution', () => {
      const result = multiDimConvolve(md);
      expect(result.origin).toBe('computed');
      // Higher curvature neighbors have more influence
      expect(result.value).toBeGreaterThan(0);
    });
  });

  // --- VIII. Display ---
  describe('Display', () => {
    it('displays 5κ0.30', () => {
      expect(displayCurvature(κ(5, 0.3))).toBe('5κ0.30');
    });

    it('displays float value', () => {
      expect(displayCurvature(κ(3.14, 0.5))).toBe('3.1400κ0.50');
    });

    it('displays multi-dim', () => {
      const md = curvatureMultiDim(κ(5, 0.3), [κ(1, 0.1), κ(2, 0.2)]);
      const s = displayCurvatureMultiDim(md);
      expect(s).toContain('𝕄{');
      expect(s).toContain('5κ0.30');
      expect(s).toContain('1κ0.10');
    });
  });
});

// ============================================================
// Integration: Phase Guard + Curvature Literal
// ============================================================

describe('Integration: Phase Guard × Curvature Literal', () => {
  it('curvature-driven genesis with phase guards', () => {
    // Start: void @ void, κ=0
    let state = phaseValue(κ(0, 0.0), 'void');

    // emerge: void → dot
    const r1 = applyGuardedFunction(
      GUARD_EMERGE,
      [state],
      () => κ(0, 0.1),
      'dot',
    );
    expect(r1.success).toBe(true);
    state = r1.result!;

    // energize until κ reaches threshold
    let cv = state.value as CurvatureValue;
    const { result: energized } = energize(cv, 0.65);

    // separate: dot → zero_zero (κ=0.75 ≥ threshold)
    expect(energized.curvature).toBeGreaterThanOrEqual(0.7);
    state = phaseValue(energized, 'dot', state.witnesses as string[]);

    const r2 = applyGuardedFunction(
      GUARD_SEPARATE,
      [state],
      () => energized,
      'zero_zero',
    );
    expect(r2.success).toBe(true);
    expect(r2.phaseTransition).toEqual({ from: 'dot', to: 'zero_zero' });
  });

  it('phase guard prevents premature genesis', () => {
    // Try to skip from void directly to zero_zero
    const state = phaseValue(κ(0, 0.0), 'void');
    const result = applyGuardedFunction(
      GUARD_SEPARATE, // expects @ dot
      [state],        // but got @ void
      () => κ(0, 0.5),
    );
    expect(result.success).toBe(false);
    expect(result.errors[0]).toContain('expected @ dot');
    expect(result.errors[0]).toContain('got @ void');
  });

  it('full ISL pipeline with curvature tracking', () => {
    // Open pipeline with curvature
    let p = phaseValue(κ(42, 0.2), 'open', ['source:sensor']);

    // normalize (Open → Open)
    const r1 = applyGuardedFunction(
      GUARD_NORMALIZE,
      [p],
      (inputs) => curvaturePipe(inputs[0] as CurvatureValue, x => x),
    );
    expect(r1.success).toBe(true);
    p = r1.result!;

    // commit (Open → Sealed)
    const r2 = applyGuardedFunction(
      GUARD_COMMIT,
      [p],
      (inputs) => inputs[0],
      'sealed',
    );
    expect(r2.success).toBe(true);
    p = r2.result!;
    expect(p.phase).toBe('sealed');

    // compact (Sealed → Compacted)
    const r3 = applyGuardedFunction(
      GUARD_COMPACT,
      [p],
      (inputs) => inputs[0],
      'compacted',
    );
    expect(r3.success).toBe(true);
    expect(r3.result!.phase).toBe('compacted');

    // Cannot normalize after compact
    const r4 = applyGuardedFunction(
      GUARD_NORMALIZE,
      [r3.result!],
      (inputs) => inputs[0],
    );
    expect(r4.success).toBe(false);
  });
});
