// ============================================================
// Rei (0₀式) — Theory #8–#21 Test Suite
// 14 theories, comprehensive coverage
// Author: Nobuki Fujimoto
// ============================================================

import { describe, it, expect } from 'vitest';

// #8–#10
import {
  contractToZero, isDynamicEquilibrium, contractionLimit,
  project, linearInterpolate, linearSpiralDual,
  dot, dotMerge, toDots, fromDots, dotGenesis,
} from '../src/theories/theories-8-10';

// #11–#14
import {
  inverseConstruct, solveFor,
  decompose, reconstruct,
  mirror, mirrorMultiDim, mirrorFixpoint,
  spiralNum, spiralTraverse, spiralFold, spiralUnfold, spiralToCartesian,
} from '../src/theories/theories-11-14';

// #15–#21
import {
  compressPi, compressE, compressPhi, compressWithMode,
  spiralExtend, findSpiralZeros,
  generalizedExtend, extendChain, extensionDepth, extensionRoot, generalizedContract,
  expand, informationLoss,
  temporal, evolve, atTime, temporalDiff, temporalWindow,
  extractInvariant, assertInvariant, timelessProject, timelessPipe,
  quadAnd, quadOr, quadNot, quadResolve, quadCertainty, quadCollapse,
  isLatent, isDefinite, quadMultiDim, quadMultiDimCertainty,
} from '../src/theories/theories-15-21';

import { MultiDimNumber } from '../src/core/types';

// Helper
const md = (center: number, neighbors: number[]): MultiDimNumber => ({
  center,
  neighbors,
  mode: 'weighted',
});

// ============================================================
// #8 Contraction Zero Theory
// ============================================================
describe('#8 Contraction Zero Theory', () => {
  it('contracts a multidimensional number toward zero', () => {
    const result = contractToZero(md(10, [5, 5, 5, 5, 5, 5, 5, 5]));
    expect(result.result.kind).toBe('dynamic_zero');
    expect(result.result.value).toBe(0);
    expect(result.result.contractionDepth).toBeGreaterThan(0);
    expect(result.steps.length).toBeGreaterThan(1);
  });

  it('detects dynamic equilibrium', () => {
    expect(isDynamicEquilibrium(md(0, [0, 0, 0, 0, 0, 0, 0, 0]))).toBe(true);
    expect(isDynamicEquilibrium(md(10, [5, 5, 5, 5, 5, 5, 5, 5]))).toBe(false);
  });

  it('finds contraction limit of iterative function', () => {
    // cos(x) has a fixed point at ~0.7391
    const result = contractionLimit(0, Math.cos);
    expect(result.converged).toBe(true);
    expect(result.limit).toBeCloseTo(0.7390851332, 5);
  });

  it('preserves contraction path history', () => {
    const result = contractToZero(md(100, [50, 50, 50, 50, 50, 50, 50, 50]));
    expect(result.result.contractionPath.length).toBeGreaterThan(1);
    expect(result.result.contractionPath[0]).toBe(100);
  });

  it('residual entropy is non-negative', () => {
    const result = contractToZero(md(5, [1, 2, 3, 4, 5, 6, 7, 8]));
    expect(result.result.residualEntropy).toBeGreaterThanOrEqual(0);
  });
});

// ============================================================
// #9 Linear Number System Theory
// ============================================================
describe('#9 Linear Number System Theory', () => {
  it('projects onto axial direction (N-S)', () => {
    const p = project(md(5, [10, 0, 0, 0, 2, 0, 0, 0]), 'axial');
    expect(p.axis).toBe('axial');
    expect(p.value).toBe(8); // N(10) - S(2) = 8
    expect(p.direction).toBe(1);
  });

  it('projects onto radial direction', () => {
    const p = project(md(5, [10, 10, 10, 10, 10, 10, 10, 10]), 'radial');
    expect(p.axis).toBe('radial');
    expect(p.value).toBe(5); // avg(10) - center(5) = 5
  });

  it('projects onto tangent direction (E-W)', () => {
    const p = project(md(5, [0, 0, 8, 0, 0, 0, 3, 0]), 'tangent');
    expect(p.value).toBe(5); // E(8) - W(3) = 5
  });

  it('interpolates between two linear numbers', () => {
    const a = project(md(0, [10, 0, 0, 0, 0, 0, 0, 0]), 'axial');
    const b = project(md(0, [20, 0, 0, 0, 0, 0, 0, 0]), 'axial');
    const mid = linearInterpolate(a, b, 0.5);
    expect(mid.value).toBeCloseTo((a.value + b.value) / 2);
  });

  it('computes linear-spiral duality', () => {
    const lin = project(md(5, [10, 0, 0, 0, 2, 0, 0, 0]), 'axial');
    const dual = linearSpiralDual(lin);
    expect(dual.spiralRadius).toBe(Math.abs(lin.value));
  });
});

// ============================================================
// #10 Dot Number System Theory
// ============================================================
describe('#10 Dot Number System Theory', () => {
  it('creates unique dots', () => {
    const d1 = dot();
    const d2 = dot();
    expect(d1.id).not.toBe(d2.id);
  });

  it('merges dots into shapes', () => {
    expect(dotMerge(dot()).shape).toBe('point');
    expect(dotMerge(dot(), dot()).shape).toBe('line');
    expect(dotMerge(dot(), dot(), dot()).shape).toBe('triangle');
    expect(dotMerge(dot(), dot(), dot(), dot()).shape).toBe('tetrahedron');
  });

  it('converts number to dots and back', () => {
    const comb = toDots(5);
    expect(fromDots(comb)).toBe(5);
    expect(comb.dots.length).toBe(5);
  });

  it('generates genesis sequence', () => {
    const g = dotGenesis();
    expect(g.void_state).toBeNull();
    expect(g.dot_state.kind).toBe('dot');
    expect(g.zero_zero.base).toBe(0);
    expect(g.zero).toBe(0);
  });
});

// ============================================================
// #11 Inverse Mathematical Construction Theory
// ============================================================
describe('#11 Inverse Mathematical Construction Theory', () => {
  it('inverse constructs from sum constraint', () => {
    const result = inverseConstruct([{ type: 'sum', target: 90 }]);
    expect(result.success).toBe(true);
    expect(result.input).not.toBeNull();
    if (result.input) {
      const total = result.input.center + result.input.neighbors.reduce((a, b) => a + b, 0);
      expect(total).toBeCloseTo(90, 0);
    }
  });

  it('inverse constructs from mean constraint', () => {
    const result = inverseConstruct([{ type: 'mean', target: 5 }]);
    expect(result.success).toBe(true);
  });

  it('solves for variable using Newton-Raphson', () => {
    // Solve x² = 4 → x = 2
    const result = solveFor(x => x * x, 4, { initialGuess: 1 });
    expect(result.converged).toBe(true);
    expect(result.solution).toBeCloseTo(2, 8);
  });

  it('solves transcendental equations', () => {
    // Solve e^x = 10 → x = ln(10) ≈ 2.3026
    const result = solveFor(Math.exp, 10, { initialGuess: 2 });
    expect(result.converged).toBe(true);
    expect(result.solution).toBeCloseTo(Math.log(10), 6);
  });
});

// ============================================================
// #12 Mathematical Decomposition-Construction Theory
// ============================================================
describe('#12 Mathematical Decomposition-Construction Theory', () => {
  const testMd = md(5, [1, 2, 3, 4, 5, 6, 7, 8]);

  it('decomposes with axial basis', () => {
    const d = decompose(testMd, 'axial');
    expect(d.basis).toBe('axial');
    expect(d.components.length).toBe(8);
    expect(d.reconstructable).toBe(true);
  });

  it('decomposes with spectral basis', () => {
    const d = decompose(testMd, 'spectral');
    expect(d.basis).toBe('spectral');
    expect(d.components.length).toBe(8);
  });

  it('decomposes with hierarchical basis', () => {
    const d = decompose(testMd, 'hierarchical');
    expect(d.basis).toBe('hierarchical');
    expect(d.components.length).toBe(3);
  });

  it('reconstructs from axial decomposition', () => {
    const d = decompose(testMd, 'axial');
    const r = reconstruct(d, 8);
    expect(r.neighbors.length).toBe(8);
  });
});

// ============================================================
// #13 Mirror Calculation Formula
// ============================================================
describe('#13 Mirror Calculation Formula', () => {
  it('converges to fixpoint for contractive mappings', () => {
    const result = mirror(10, x => x * 0.5 + 3, x => x * 0.3 + 2);
    expect(result.converged).toBe(true);
    expect(result.reflections.length).toBeGreaterThan(1);
  });

  it('mirror on multidimensional numbers converges', () => {
    const result = mirrorMultiDim(md(10, [1, 2, 3, 4, 5, 6, 7, 8]));
    expect(result.converged).toBe(true);
    // Fixpoint: center ≈ mean of neighbors
    const fp = result.fixpoint;
    const mean = fp.neighbors.reduce((a, b) => a + b, 0) / fp.neighbors.length;
    expect(fp.center).toBeCloseTo(mean, 1);
  });

  it('finds fixpoint analytically', () => {
    const fp = mirrorFixpoint(x => x / 2 + 1, x => x / 3 + 2);
    expect(typeof fp).toBe('number');
    expect(isFinite(fp)).toBe(true);
  });
});

// ============================================================
// #14 Spiral Number System Theory
// ============================================================
describe('#14 Spiral Number System Theory', () => {
  it('creates spiral numbers', () => {
    const s = spiralNum(5, Math.PI / 4, 0, 'ccw');
    expect(s.kind).toBe('spiral');
    expect(s.radius).toBe(5);
  });

  it('traverses neighbors in spiral order', () => {
    const vals = spiralTraverse(md(5, [1, 2, 3, 4, 5, 6, 7, 8]));
    expect(vals.length).toBe(8);
    expect(vals[0]).toBe(1); // starts at index 0
  });

  it('folds along spiral path', () => {
    const result = spiralFold(
      md(0, [1, 2, 3, 4, 5, 6, 7, 8]),
      (acc, val) => acc + val,
      0
    );
    expect(result).toBe(36); // sum of 1..8
  });

  it('unfolds a value into spiral pattern', () => {
    const unfolded = spiralUnfold(10, 8, 0.9);
    expect(unfolded.center).toBe(10);
    expect(unfolded.neighbors.length).toBe(8);
    expect(unfolded.neighbors[0]).toBe(10);
    expect(unfolded.neighbors[7]).toBeLessThan(unfolded.neighbors[0]);
  });

  it('converts spiral to cartesian', () => {
    const s = spiralNum(1, 0, 0, 'ccw');
    const { x, y } = spiralToCartesian(s);
    expect(x).toBeCloseTo(1);
    expect(y).toBeCloseTo(0);
  });
});

// ============================================================
// #15 Constant Contraction Theory Group
// ============================================================
describe('#15 Constant Contraction Theory Group', () => {
  const testMd = md(5, [10, 8, 6, 4, 2, 1, 3, 7]);

  it('π-contraction extracts periodic components', () => {
    const result = compressPi(testMd);
    expect(result.dc).toBeCloseTo(5.125);
    expect(result.amplitude).toBeGreaterThan(0);
    expect(typeof result.phase).toBe('number');
  });

  it('e-contraction fits exponential decay', () => {
    // Create exponentially decaying data
    const expMd = md(100, [100, 90, 81, 73, 66, 59, 53, 48]);
    const result = compressE(expMd);
    expect(result.N0).toBeGreaterThan(0);
    expect(result.lambda).toBeGreaterThan(0);
  });

  it('φ-contraction extracts golden-ratio structure', () => {
    const PHI = (1 + Math.sqrt(5)) / 2;
    const goldenMd = md(1, Array.from({ length: 8 }, (_, i) => Math.pow(PHI, i)));
    const result = compressPhi(goldenMd);
    expect(result.seed).toBeCloseTo(1, 0);
    expect(result.fidelity).toBeGreaterThan(0.9);
  });

  it('unified dispatcher works for all modes', () => {
    for (const mode of ['zero', 'pi', 'e', 'phi'] as const) {
      const result = compressWithMode(testMd, mode);
      expect(result.mode).toBe(mode);
    }
  });
});

// ============================================================
// #16 Dimensional Spiral Zero-point Theory (DSZT)
// ============================================================
describe('#16 DSZT', () => {
  it('performs spiral extension', () => {
    const result = spiralExtend(1.0, 5, Math.PI / 4);
    expect(result.depth).toBe(5);
    expect(result.phases.length).toBe(6);
    expect(result.dimension).toBe(5);
  });

  it('spiral extension with 2π/p returns near-original phase', () => {
    const p = 8;
    const result = spiralExtend(1.0, p, (2 * Math.PI) / p);
    const firstAngle = result.phases[0].angle;
    const lastAngle = result.phases[p].angle;
    // After p steps, angle should be ≈ 2π (one full rotation)
    expect(lastAngle).toBeCloseTo(2 * Math.PI, 5);
  });

  it('finds spiral zeros', () => {
    const values = [1, 0.5, 0.01, -0.3, -0.01, 0.2, 0.8];
    const zeros = findSpiralZeros(values, 0.05);
    expect(zeros.length).toBeGreaterThan(0);
  });
});

// ============================================================
// #17 Infinite Extension Mathematics Theory
// ============================================================
describe('#17 Infinite Extension Mathematics Theory', () => {
  it('creates generalized extension', () => {
    const ext = generalizedExtend(0, 0);
    expect(ext.root).toBe(0);
    expect(ext.depth).toBe(1);
  });

  it('chains extensions', () => {
    let ext = generalizedExtend(3, 2);
    ext = extendChain(ext, 1);
    ext = extendChain(ext, 0);
    expect(extensionDepth(ext)).toBe(3);
    expect(extensionRoot(ext)).toBe(3);
  });

  it('contracts extensions (inverse)', () => {
    let ext = generalizedExtend(5, 3);
    ext = extendChain(ext, 2);
    const contracted = generalizedContract(ext);
    expect(typeof contracted).toBe('object');
    if (typeof contracted !== 'number') {
      expect(contracted.depth).toBe(1);
    }
  });

  it('contracts to root at depth 1', () => {
    const ext = generalizedExtend(7, 0);
    const result = generalizedContract(ext);
    expect(result).toBe(7);
  });
});

// ============================================================
// #18 Contraction Theory (compress/expand duality)
// ============================================================
describe('#18 Contraction Theory', () => {
  it('expands uniformly', () => {
    const result = expand(90, 'uniform', { neighborCount: 8 });
    expect(result.neighbors.length).toBe(8);
    const total = result.center + result.neighbors.reduce((a, b) => a + b, 0);
    expect(total).toBeCloseTo(90, 5);
  });

  it('expands with π mode (periodic)', () => {
    const result = expand(5, 'pi', { neighborCount: 8 });
    expect(result.neighbors.length).toBe(8);
    // Should have cosine pattern
    expect(result.neighbors[0]).toBeCloseTo(5);
  });

  it('expands with φ mode (golden ratio)', () => {
    const result = expand(10, 'phi', { neighborCount: 8 });
    expect(result.neighbors[0]).toBe(10);
    expect(result.neighbors[1]).toBeLessThan(result.neighbors[0]);
  });

  it('measures information loss', () => {
    const original = md(5, [1, 2, 3, 4, 5, 6, 7, 8]);
    const loss = informationLoss(original, m => m.center + m.neighbors.reduce((a, b) => a + b, 0));
    expect(loss).toBeGreaterThanOrEqual(0);
  });

  it('uniform expand then compress preserves total', () => {
    const original = md(5, [10, 10, 10, 10, 10, 10, 10, 10]);
    const total = original.center + original.neighbors.reduce((a, b) => a + b, 0);
    const expanded = expand(total, 'uniform', { neighborCount: 8 });
    const restoredTotal = expanded.center + expanded.neighbors.reduce((a, b) => a + b, 0);
    expect(restoredTotal).toBeCloseTo(total, 5);
  });
});

// ============================================================
// #19 Temporal Number System Theory
// ============================================================
describe('#19 Temporal Number System Theory', () => {
  it('creates temporal multidimensional number', () => {
    const t = temporal(md(100, [20, 20, 20, 20, 20, 20, 20, 20]), 0);
    expect(t.kind).toBe('temporal');
    expect(t.time).toBe(0);
  });

  it('evolves with diffusion rule', () => {
    const t0 = temporal(md(100, [20, 20, 20, 20, 20, 20, 20, 20]), 0);
    const trajectory = evolve(t0, { dt: 0.1, steps: 10, rule: 'diffusion' });
    expect(trajectory.length).toBe(11);
    // Center should decrease (diffusing outward)
    expect(trajectory[10].state.center).toBeLessThan(100);
  });

  it('evolves with wave rule', () => {
    const t0 = temporal(md(100, [0, 0, 0, 0, 0, 0, 0, 0]), 0);
    const trajectory = evolve(t0, { dt: 0.01, steps: 100, rule: 'wave' });
    expect(trajectory.length).toBe(101);
  });

  it('retrieves state at specific time', () => {
    const t0 = temporal(md(100, [20, 20, 20, 20, 20, 20, 20, 20]), 0);
    const trajectory = evolve(t0, { dt: 0.1, steps: 10, rule: 'diffusion' });
    const at05 = atTime(trajectory, 0.5);
    expect(at05).not.toBeNull();
    expect(at05!.time).toBeCloseTo(0.5, 1);
  });

  it('computes temporal derivative', () => {
    const t0 = temporal(md(100, [20, 20, 20, 20, 20, 20, 20, 20]), 0);
    const trajectory = evolve(t0, { dt: 0.1, steps: 5, rule: 'diffusion' });
    const diff = temporalDiff(trajectory, 1);
    expect(diff).not.toBeNull();
  });

  it('windows trajectory by time range', () => {
    const t0 = temporal(md(100, [20, 20, 20, 20, 20, 20, 20, 20]), 0);
    const trajectory = evolve(t0, { dt: 0.1, steps: 20, rule: 'diffusion' });
    const windowed = temporalWindow(trajectory, 0.5, 1.0);
    expect(windowed.length).toBeGreaterThan(0);
    expect(windowed.every(t => t.time >= 0.5 && t.time <= 1.0)).toBe(true);
  });
});

// ============================================================
// #20 Timeless Number System Theory
// ============================================================
describe('#20 Timeless Number System Theory', () => {
  it('extracts invariant from trajectory', () => {
    const t0 = temporal(md(100, [20, 20, 20, 20, 20, 20, 20, 20]), 0);
    const trajectory = evolve(t0, { dt: 0.1, steps: 10, rule: 'diffusion' });
    const inv = extractInvariant(trajectory);
    expect(inv.kind).toBe('timeless');
    expect(inv.invariantType).toBe('mass-conservation');
  });

  it('asserts invariant holds for diffusion', () => {
    const t0 = temporal(md(100, [20, 20, 20, 20, 20, 20, 20, 20]), 0);
    const trajectory = evolve(t0, { dt: 0.01, steps: 100, rule: 'diffusion', alpha: 0.05 });
    const inv = extractInvariant(trajectory);
    const check = assertInvariant(trajectory, inv, 5);
    expect(check.holds).toBe(true);
  });

  it('projects trajectory to timeless (strips time)', () => {
    const t0 = temporal(md(10, [1, 2, 3, 4, 5, 6, 7, 8]), 0);
    const trajectory = evolve(t0, { dt: 0.1, steps: 5, rule: 'diffusion' });
    const projected = timelessProject(trajectory);
    expect(projected.length).toBe(6);
    expect(projected[0].center).toBe(10);
  });

  it('timeless pipe applies multiple operations', () => {
    const testMd = md(5, [1, 2, 3, 4, 5, 6, 7, 8]);
    const result = timelessPipe(testMd, [
      m => m.center + m.neighbors.reduce((a, b) => a + b, 0),
      m => (m.center + m.neighbors.reduce((a, b) => a + b, 0)) / 9,
      m => Math.max(m.center, ...m.neighbors),
    ]);
    expect(result.kind).toBe('timeless');
    expect(result.value.length).toBe(3);
  });
});

// ============================================================
// #21 Quadrivalent 0π Theory
// ============================================================
describe('#21 Quadrivalent 0π Theory', () => {
  // AND truth table
  it('four-valued AND', () => {
    expect(quadAnd('T', 'T')).toBe('T');
    expect(quadAnd('T', 'F')).toBe('F');
    expect(quadAnd('T', 'Tpi')).toBe('Tpi');
    expect(quadAnd('Tpi', 'Fpi')).toBe('Fpi');
    expect(quadAnd('F', 'Tpi')).toBe('F');
  });

  // OR truth table
  it('four-valued OR', () => {
    expect(quadOr('F', 'F')).toBe('F');
    expect(quadOr('F', 'T')).toBe('T');
    expect(quadOr('Fpi', 'Tpi')).toBe('Tpi');
    expect(quadOr('T', 'Fpi')).toBe('T');
  });

  // NOT
  it('four-valued NOT', () => {
    expect(quadNot('T')).toBe('F');
    expect(quadNot('F')).toBe('T');
    expect(quadNot('Tpi')).toBe('Fpi');
    expect(quadNot('Fpi')).toBe('Tpi');
  });

  // Double negation
  it('double negation is identity', () => {
    for (const v of ['T', 'F', 'Tpi', 'Fpi'] as const) {
      expect(quadNot(quadNot(v))).toBe(v);
    }
  });

  // Resolve
  it('resolves latent values', () => {
    expect(quadResolve('Tpi', true)).toBe('T');
    expect(quadResolve('Tpi', false)).toBe('F');
    expect(quadResolve('Fpi', true)).toBe('F');
    expect(quadResolve('Fpi', false)).toBe('T');
    expect(quadResolve('T', false)).toBe('T');  // definite unchanged
    expect(quadResolve('F', true)).toBe('F');   // definite unchanged
  });

  // Certainty
  it('computes certainty', () => {
    expect(quadCertainty(['T', 'F', 'T', 'F'])).toBe(1.0);
    expect(quadCertainty(['T', 'Tpi', 'Fpi', 'F'])).toBe(0.5);
    expect(quadCertainty(['Tpi', 'Fpi'])).toBe(0);
  });

  // Collapse
  it('collapses latent to definite', () => {
    const collapsed = quadCollapse(['T', 'Tpi', 'Fpi', 'F']);
    expect(collapsed).toEqual(['T', 'T', 'F', 'F']);
  });

  // Latent/Definite checks
  it('identifies latent and definite values', () => {
    expect(isLatent('Tpi')).toBe(true);
    expect(isLatent('Fpi')).toBe(true);
    expect(isLatent('T')).toBe(false);
    expect(isDefinite('T')).toBe(true);
    expect(isDefinite('Fpi')).toBe(false);
  });

  // De Morgan's laws in four-valued logic
  it('De Morgan: ¬(a∧b) = ¬a∨¬b', () => {
    for (const a of ['T', 'F', 'Tpi', 'Fpi'] as const) {
      for (const b of ['T', 'F', 'Tpi', 'Fpi'] as const) {
        expect(quadNot(quadAnd(a, b))).toBe(quadOr(quadNot(a), quadNot(b)));
      }
    }
  });

  it('De Morgan: ¬(a∨b) = ¬a∧¬b', () => {
    for (const a of ['T', 'F', 'Tpi', 'Fpi'] as const) {
      for (const b of ['T', 'F', 'Tpi', 'Fpi'] as const) {
        expect(quadNot(quadOr(a, b))).toBe(quadAnd(quadNot(a), quadNot(b)));
      }
    }
  });

  // Integration with MultiDimNumber
  it('creates quad multidimensional number', () => {
    const qmd = quadMultiDim(
      md(5, [1, 2, 3, 4, 5, 6, 7, 8]),
      ['T', 'Tpi', 'F', 'Fpi', 'T', 'Tpi', 'F', 'Fpi', 'T']
    );
    const cert = quadMultiDimCertainty(qmd);
    expect(cert).toBeGreaterThan(0);
    expect(cert).toBeLessThan(1);
  });
});

// ============================================================
// Cross-Theory Integration Tests
// ============================================================
describe('Cross-Theory Integration', () => {
  it('#8 + #18: contract then expand round-trip', () => {
    const original = md(5, [1, 2, 3, 4, 5, 6, 7, 8]);
    const contracted = contractToZero(original);
    // Expand from the dynamic zero back to 8-neighbor structure
    const expanded = expand(0, 'uniform', { neighborCount: 8 });
    expect(expanded.neighbors.length).toBe(8);
  });

  it('#15 + #18: π-compress then π-expand', () => {
    const original = md(5, Array.from({ length: 8 }, (_, i) => 3 * Math.cos(2 * Math.PI * i / 8)));
    const piResult = compressPi(original);
    const expanded = expand(piResult.amplitude, 'pi', { neighborCount: 8 });
    expect(expanded.neighbors.length).toBe(8);
  });

  it('#19 + #20: evolve then extract invariant', () => {
    const t0 = temporal(md(50, [10, 10, 10, 10, 10, 10, 10, 10]), 0);
    const trajectory = evolve(t0, { dt: 0.01, steps: 100, rule: 'diffusion', alpha: 0.05 });
    const inv = extractInvariant(trajectory);
    expect(inv.kind).toBe('timeless');
  });

  it('#13 + #21: mirror fixpoint has definite quad value', () => {
    const fp = mirrorFixpoint(x => x * 0.5 + 3, x => x * 0.3 + 2);
    const qv = isFinite(fp) ? 'T' as const : 'Fpi' as const;
    expect(isDefinite(qv)).toBe(true);
  });

  it('#9 + #14: linear-spiral duality', () => {
    const lin = project(md(5, [10, 0, 0, 0, 2, 0, 0, 0]), 'axial');
    const dual = linearSpiralDual(lin);
    expect(dual.spiralRadius).toBe(Math.abs(lin.value));
    // Full circle: linear is spiral with angle=0 or π
    expect([0, Math.PI]).toContain(dual.spiralAngle);
  });

  it('complete cycle: ・ → 𝕄 → compress → expand → Timeless', () => {
    // #10: Start from dot
    const genesis = dotGenesis();
    expect(genesis.dot_state.kind).toBe('dot');

    // Create multidimensional number
    const mdNum = md(genesis.zero, [1, 2, 3, 4, 5, 6, 7, 8]);

    // #15: π-compress
    const piComp = compressPi(mdNum);

    // #18: expand back
    const expanded = expand(piComp.dc, 'uniform', { neighborCount: 8 });

    // #19: add time
    const t0 = temporal(expanded, 0);
    const trajectory = evolve(t0, { dt: 0.1, steps: 5, rule: 'diffusion' });

    // #20: extract invariant (timeless)
    const inv = extractInvariant(trajectory);
    expect(inv.kind).toBe('timeless');
  });
});
