// ============================================================
// Rei (0₀式) Standard Library — Tier 1 Test Suite
// Modules: field, symmetry, unified
// Author: Nobuki Fujimoto
// ============================================================

import { describe, it, expect } from 'vitest';

import {
  gradient, divergence, curl, laplacian,
  createGrid, gradientGrid, divergenceGrid, curlGrid, laplacianGrid,
  energy, superpose, solvePoisson, flux, circulation,
} from '../src/stdlib/field';

import {
  rotate, reflect, invert, detect, breaking,
  symmetrize, orbits, tensor,
} from '../src/stdlib/symmetry';

import {
  from as u3from, fromNumber, fromMultiDim, fromExtended, fromArray,
  toMultiDim, toExtended, toNumber,
  add as u3add, mul as u3mul, scale,
  elevate, ground, setLevel,
  distance, norm,
  verifyConsistency, verifyAdditionHomomorphism, verifyElevateGroundAdjunction,
  display,
} from '../src/stdlib/unified';

import { MultiDimNumber } from '../src/core/types';

// Helper
const md = (center: number, neighbors: number[]): MultiDimNumber => ({
  center,
  neighbors,
  mode: 'weighted',
});

// ============================================================
// field Module Tests
// ============================================================
describe('field module', () => {

  describe('gradient', () => {
    it('computes gradient for uniform field (zero gradient)', () => {
      const g = gradient(md(5, [5, 5, 5, 5, 5, 5, 5, 5]));
      expect(g.magnitude).toBeCloseTo(0, 5);
    });

    it('computes E-W gradient', () => {
      // E=10, W=0, others equal → strong dx
      const g = gradient(md(5, [5, 5, 10, 5, 5, 5, 0, 5]));
      expect(g.dx).toBeGreaterThan(0);
      expect(Math.abs(g.dy)).toBeLessThan(Math.abs(g.dx));
    });

    it('computes N-S gradient', () => {
      // N=10, S=0, others equal → strong dy
      const g = gradient(md(5, [10, 5, 5, 5, 0, 5, 5, 5]));
      expect(g.dy).toBeGreaterThan(0);
    });

    it('magnitude is always non-negative', () => {
      const g = gradient(md(5, [1, 2, 3, 4, 5, 6, 7, 8]));
      expect(g.magnitude).toBeGreaterThanOrEqual(0);
    });

    it('direction is in [-π, π]', () => {
      const g = gradient(md(5, [1, 2, 3, 4, 5, 6, 7, 8]));
      expect(g.direction).toBeGreaterThanOrEqual(-Math.PI);
      expect(g.direction).toBeLessThanOrEqual(Math.PI);
    });
  });

  describe('divergence', () => {
    it('returns zero for uniform field', () => {
      const d = divergence(md(5, [5, 5, 5, 5, 5, 5, 5, 5]));
      expect(d).toBeCloseTo(0, 5);
    });

    it('positive for source (center < neighbors)', () => {
      const d = divergence(md(0, [10, 10, 10, 10, 10, 10, 10, 10]));
      expect(d).toBeGreaterThan(0);
    });

    it('negative for sink (center > neighbors)', () => {
      const d = divergence(md(100, [1, 1, 1, 1, 1, 1, 1, 1]));
      expect(d).toBeLessThan(0);
    });
  });

  describe('curl', () => {
    it('returns zero for symmetric field', () => {
      const c = curl(md(5, [5, 5, 5, 5, 5, 5, 5, 5]));
      expect(c).toBeCloseTo(0, 10);
    });

    it('returns zero for uniformly increasing field', () => {
      // All neighbors same → curl = 0
      const c = curl(md(5, [10, 10, 10, 10, 10, 10, 10, 10]));
      expect(c).toBeCloseTo(0, 10);
    });
  });

  describe('laplacian', () => {
    it('returns zero for uniform field', () => {
      const l = laplacian(md(5, [5, 5, 5, 5, 5, 5, 5, 5]));
      expect(l).toBeCloseTo(0, 10);
    });

    it('equals mean(neighbors) - center', () => {
      const m = md(5, [1, 2, 3, 4, 5, 6, 7, 8]);
      const mean = (1 + 2 + 3 + 4 + 5 + 6 + 7 + 8) / 8;
      expect(laplacian(m)).toBeCloseTo(mean - 5, 10);
    });

    it('positive when center is a local minimum', () => {
      expect(laplacian(md(0, [10, 10, 10, 10, 10, 10, 10, 10]))).toBeGreaterThan(0);
    });

    it('negative when center is a local maximum', () => {
      expect(laplacian(md(100, [1, 1, 1, 1, 1, 1, 1, 1]))).toBeLessThan(0);
    });
  });

  describe('grid operations', () => {
    it('creates grid from 2D array', () => {
      const grid = createGrid([
        [1, 2, 3],
        [4, 5, 6],
        [7, 8, 9],
      ]);
      expect(grid.width).toBe(3);
      expect(grid.height).toBe(3);
      expect(grid.points[1][1].center).toBe(5);
    });

    it('gradientGrid returns correct dimensions', () => {
      const grid = createGrid([[1, 2], [3, 4]]);
      const g = gradientGrid(grid);
      expect(g.length).toBe(2);
      expect(g[0].length).toBe(2);
    });

    it('energy is non-negative', () => {
      const grid = createGrid([[1, 2], [3, 4]]);
      expect(energy(grid)).toBeGreaterThanOrEqual(0);
    });

    it('energy is zero for uniform grid', () => {
      const grid = createGrid([[5, 5, 5], [5, 5, 5], [5, 5, 5]]);
      expect(energy(grid)).toBeCloseTo(0, 5);
    });

    it('superposes two grids', () => {
      const a = createGrid([[10, 10], [10, 10]]);
      const b = createGrid([[0, 0], [0, 0]]);
      const result = superpose(a, b, 0.5);
      expect(result.points[0][0].center).toBeCloseTo(5);
    });
  });

  describe('Gauss and Stokes theorems', () => {
    it('flux equals total divergence', () => {
      const grid = createGrid([[1, 2, 3], [4, 5, 6], [7, 8, 9]]);
      const f = flux(grid);
      const divGrid = divergenceGrid(grid);
      const totalDiv = divGrid.flat().reduce((s, v) => s + v, 0);
      expect(f).toBeCloseTo(totalDiv, 10);
    });

    it('circulation equals total curl', () => {
      const grid = createGrid([[1, 2, 3], [4, 5, 6], [7, 8, 9]]);
      const c = circulation(grid);
      const curlG = curlGrid(grid);
      const totalCurl = curlG.flat().reduce((s, v) => s + v, 0);
      expect(c).toBeCloseTo(totalCurl, 10);
    });
  });
});

// ============================================================
// symmetry Module Tests
// ============================================================
describe('symmetry module', () => {

  describe('rotate', () => {
    it('rotate by 0 is identity', () => {
      const m = md(5, [1, 2, 3, 4, 5, 6, 7, 8]);
      const r = rotate(m, 0);
      expect(r.neighbors).toEqual(m.neighbors);
    });

    it('rotate by N is identity', () => {
      const m = md(5, [1, 2, 3, 4, 5, 6, 7, 8]);
      const r = rotate(m, 8);
      expect(r.neighbors).toEqual(m.neighbors);
    });

    it('rotate by 1 shifts neighbors', () => {
      const m = md(5, [1, 2, 3, 4, 5, 6, 7, 8]);
      const r = rotate(m, 1);
      expect(r.neighbors[0]).toBe(2); // shifted
    });

    it('rotate preserves center', () => {
      const m = md(5, [1, 2, 3, 4, 5, 6, 7, 8]);
      const r = rotate(m, 3);
      expect(r.center).toBe(5);
    });

    it('rotate twice by 4 = identity', () => {
      const m = md(5, [1, 2, 3, 4, 5, 6, 7, 8]);
      const r = rotate(rotate(m, 4), 4);
      expect(r.neighbors).toEqual(m.neighbors);
    });
  });

  describe('reflect', () => {
    it('double reflection is identity', () => {
      const m = md(5, [1, 2, 3, 4, 5, 6, 7, 8]);
      const r = reflect(reflect(m, 'NS'), 'NS');
      expect(r.neighbors).toEqual(m.neighbors);
    });

    it('NS reflection swaps E and W', () => {
      const m = md(5, [1, 2, 3, 4, 5, 6, 7, 8]);
      const r = reflect(m, 'NS');
      // NS: [0,7,6,5,4,3,2,1] → n[2]=E becomes position of n[6]=W
      expect(r.neighbors[2]).toBe(m.neighbors[6]);
      expect(r.neighbors[6]).toBe(m.neighbors[2]);
    });

    it('preserves center', () => {
      const m = md(5, [1, 2, 3, 4, 5, 6, 7, 8]);
      expect(reflect(m, 'EW').center).toBe(5);
    });
  });

  describe('detect', () => {
    it('detects full symmetry', () => {
      const info = detect(md(5, [3, 3, 3, 3, 3, 3, 3, 3]));
      expect(info.class).toBe('full');
    });

    it('detects asymmetry', () => {
      const info = detect(md(5, [1, 3, 7, 2, 5, 8, 4, 6]));
      expect(info.class).toBe('asymmetric');
    });

    it('detects four-fold symmetry', () => {
      const info = detect(md(5, [1, 2, 1, 2, 1, 2, 1, 2]));
      expect(['four_fold', 'axial', 'full']).toContain(info.class);
      expect(info.stabilizerOrder).toBeGreaterThan(1);
    });

    it('stabilizer order is always positive', () => {
      const info = detect(md(5, [1, 2, 3, 4, 5, 6, 7, 8]));
      expect(info.stabilizerOrder).toBeGreaterThanOrEqual(1);
    });
  });

  describe('breaking', () => {
    it('zero for fully symmetric', () => {
      expect(breaking(md(5, [3, 3, 3, 3, 3, 3, 3, 3]))).toBeCloseTo(0);
    });

    it('non-negative', () => {
      expect(breaking(md(5, [1, 2, 3, 4, 5, 6, 7, 8]))).toBeGreaterThanOrEqual(0);
    });

    it('increases with asymmetry', () => {
      const sym = breaking(md(5, [3, 3, 3, 3, 3, 3, 3, 3]));
      const asym = breaking(md(5, [1, 100, 1, 100, 1, 100, 1, 100]));
      expect(asym).toBeGreaterThan(sym);
    });
  });

  describe('symmetrize', () => {
    it('full symmetrization averages all neighbors', () => {
      const s = symmetrize(md(5, [1, 2, 3, 4, 5, 6, 7, 8]), 'full');
      const mean = (1 + 2 + 3 + 4 + 5 + 6 + 7 + 8) / 8;
      expect(s.neighbors[0]).toBeCloseTo(mean);
      expect(s.neighbors[7]).toBeCloseTo(mean);
    });

    it('four_fold creates alternating pattern', () => {
      const s = symmetrize(md(5, [1, 2, 3, 4, 5, 6, 7, 8]), 'four_fold');
      expect(s.neighbors[0]).toBe(s.neighbors[2]);
      expect(s.neighbors[1]).toBe(s.neighbors[3]);
    });

    it('asymmetric is identity', () => {
      const m = md(5, [1, 2, 3, 4, 5, 6, 7, 8]);
      const s = symmetrize(m, 'asymmetric');
      expect(s.neighbors).toEqual(m.neighbors);
    });
  });

  describe('orbits', () => {
    it('full symmetry has 1 orbit', () => {
      const o = orbits(md(5, [3, 3, 3, 3, 3, 3, 3, 3]));
      expect(o.orbits.length).toBe(1);
    });

    it('all unique values have 8 orbits', () => {
      const o = orbits(md(5, [1, 2, 3, 4, 5, 6, 7, 8]));
      expect(o.orbits.length).toBe(8);
    });

    it('orbit sizes sum to neighbor count', () => {
      const o = orbits(md(5, [1, 2, 1, 2, 1, 2, 3, 3]));
      const total = o.orbitSizes.reduce((s, n) => s + n, 0);
      expect(total).toBe(8);
    });
  });

  describe('tensor', () => {
    it('isotropic field has small anisotropy', () => {
      const t = tensor(md(5, [5, 5, 5, 5, 5, 5, 5, 5]));
      expect(t.anisotropy).toBeCloseTo(0, 1);
    });

    it('directional field has high anisotropy', () => {
      // Strong E-W, weak N-S
      const t = tensor(md(5, [0, 0, 100, 0, 0, 0, 100, 0]));
      expect(t.anisotropy).toBeGreaterThan(0.5);
    });

    it('eigenvalues are real', () => {
      const t = tensor(md(5, [1, 2, 3, 4, 5, 6, 7, 8]));
      expect(isFinite(t.eigenvalues[0])).toBe(true);
      expect(isFinite(t.eigenvalues[1])).toBe(true);
    });
  });
});

// ============================================================
// unified Module Tests
// ============================================================
describe('unified module', () => {

  describe('construction', () => {
    it('fromNumber creates valid U³', () => {
      const u = fromNumber(42);
      expect(u.multidim.center).toBe(42);
      expect(u.level).toBe(0);
    });

    it('fromMultiDim preserves structure', () => {
      const m = md(5, [1, 2, 3, 4, 5, 6, 7, 8]);
      const u = fromMultiDim(m, 2);
      expect(toMultiDim(u)).toBe(m);
      expect(u.level).toBe(2);
    });

    it('fromArray creates multiple U³', () => {
      const arr = fromArray([1, 2, 3, 4, 5]);
      expect(arr.length).toBe(5);
      expect(arr[0].multidim.center).toBe(1);
    });
  });

  describe('projection', () => {
    it('toMultiDim preserves original', () => {
      const m = md(5, [1, 2, 3, 4, 5, 6, 7, 8]);
      const u = fromMultiDim(m);
      expect(toMultiDim(u).center).toBe(5);
    });

    it('toNumber returns scalar', () => {
      const u = fromNumber(42);
      const n = toNumber(u);
      expect(typeof n).toBe('number');
    });
  });

  describe('arithmetic', () => {
    it('addition preserves centers', () => {
      const a = fromNumber(10);
      const b = fromNumber(20);
      const sum = u3add(a, b);
      expect(sum.multidim.center).toBe(30);
    });

    it('multiplication is correct', () => {
      const a = fromNumber(3);
      const b = fromNumber(4);
      const prod = u3mul(a, b);
      expect(prod.multidim.center).toBe(12);
    });

    it('scale works', () => {
      const u = fromNumber(10);
      const scaled = scale(u, 3);
      expect(scaled.multidim.center).toBe(30);
    });

    it('addition homomorphism holds', () => {
      const a = fromNumber(5);
      const b = fromNumber(7);
      expect(verifyAdditionHomomorphism(a, b)).toBe(true);
    });
  });

  describe('level operations', () => {
    it('elevate increases level', () => {
      const u = fromNumber(5, 2);
      const elevated = elevate(u);
      expect(elevated.level).toBe(3);
    });

    it('ground decreases level', () => {
      const u = fromNumber(5, 3);
      const grounded = ground(u);
      expect(grounded.level).toBe(2);
    });

    it('ground at level 0 stays at 0', () => {
      const u = fromNumber(5, 0);
      const grounded = ground(u);
      expect(grounded.level).toBe(0);
    });

    it('elevate-ground adjunction holds', () => {
      const u = fromNumber(5, 2);
      expect(verifyElevateGroundAdjunction(u)).toBe(true);
    });

    it('setLevel works', () => {
      const u = setLevel(fromNumber(5), 7);
      expect(u.level).toBe(7);
    });
  });

  describe('distance', () => {
    it('distance to self is zero', () => {
      const u = fromNumber(5);
      expect(distance(u, u).total).toBeCloseTo(0);
    });

    it('distance is non-negative', () => {
      const a = fromNumber(1);
      const b = fromNumber(100);
      expect(distance(a, b).total).toBeGreaterThanOrEqual(0);
    });

    it('distance is symmetric', () => {
      const a = fromNumber(3, 1);
      const b = fromNumber(7, 2);
      expect(distance(a, b).total).toBeCloseTo(distance(b, a).total);
    });

    it('norm is non-negative', () => {
      expect(norm(fromNumber(5))).toBeGreaterThanOrEqual(0);
    });

    it('norm of zero is zero', () => {
      expect(norm(fromNumber(0))).toBeCloseTo(0);
    });
  });

  describe('consistency', () => {
    it('fromNumber produces consistent U³', () => {
      const check = verifyConsistency(fromNumber(5));
      expect(check.errors.length).toBe(0);
    });

    it('display returns readable string', () => {
      const d = display(fromNumber(42, 3));
      expect(d).toContain('U³');
      expect(d).toContain('42');
      expect(d).toContain('L3');
    });
  });
});

// ============================================================
// Cross-Module Integration Tests
// ============================================================
describe('Cross-Module Integration', () => {
  it('field.laplacian + symmetry.detect', () => {
    // Symmetric field should have zero laplacian at center
    const m = md(5, [5, 5, 5, 5, 5, 5, 5, 5]);
    expect(laplacian(m)).toBeCloseTo(0);
    expect(detect(m).class).toBe('full');
  });

  it('symmetry.symmetrize reduces gradient', () => {
    const m = md(5, [1, 2, 3, 4, 5, 6, 7, 8]);
    const sym = symmetrize(m, 'full');
    expect(gradient(sym).magnitude).toBeLessThan(gradient(m).magnitude);
  });

  it('unified wraps field-computed values', () => {
    const m = md(5, [1, 2, 3, 4, 5, 6, 7, 8]);
    const grad = gradient(m);
    const u = fromNumber(grad.magnitude, 1);
    expect(u.multidim.center).toBe(grad.magnitude);
    expect(u.level).toBe(1);
  });

  it('field + symmetry + unified pipeline', () => {
    // Create field → detect symmetry → wrap in U³ → elevate
    const m = md(5, [3, 3, 3, 3, 3, 3, 3, 3]);
    const sym = detect(m);
    const lap = laplacian(m);
    const u = fromNumber(lap, sym.stabilizerOrder);
    const elevated = elevate(u);
    expect(elevated.level).toBe(u.level + 1);
  });
});
