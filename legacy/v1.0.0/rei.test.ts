// ============================================================
// Rei (0₀式) Tests
// ============================================================

import { describe, it, expect } from 'vitest';
import {
  mdnum, compute, computeGrid, detectSymmetry, hmdnum, computeHierarchical,
  ComputationMode, SymmetryClass,
  subscript, extnum, extend, reduce, toNotation, parseSubscript, isEquivalent,
  extendChain, reduceChain, dualExtend,
} from '../src/core';
import {
  createGenesis, evolve, runFullGenesis,
  verifyTheoremS0, verifyTheoremS1, firewallCheck,
} from '../src/genesis';
import {
  node, edge, graph, fromMultiDim, fromExtended, fromGenesis,
  fromExpression, applyTransform, graphStats,
} from '../src/gft/graph';
import { applyLayout, renderSVG, renderToString } from '../src/gft/renderer';
import { lex, parse, run, formatValue } from '../src/lang';

// --- Core: Multi-Dimensional Numbers ---

describe('MultiDimNumber', () => {
  it('creates a multi-dimensional number', () => {
    const md = mdnum(5, [1, 2, 3, 4]);
    expect(md.center).toBe(5);
    expect(md.neighbors).toEqual([1, 2, 3, 4]);
    expect(md.mode).toBe(ComputationMode.Weighted);
  });

  it('computes weighted average', () => {
    const md = mdnum(10, [2, 4, 6, 8]);
    const result = compute(md);
    expect(result.value).toBe(15); // 10 + (2+4+6+8)/4
    expect(result.mode).toBe(ComputationMode.Weighted);
  });

  it('computes harmonic mean', () => {
    const md = mdnum(0, [2, 4], undefined, ComputationMode.Harmonic);
    const result = compute(md);
    expect(result.value).toBeCloseTo(2.6667, 3);
  });

  it('detects full symmetry', () => {
    const md = mdnum(5, [3, 3, 3, 3]);
    expect(detectSymmetry(md)).toBe(SymmetryClass.Full);
  });

  it('detects axial symmetry', () => {
    const md = mdnum(5, [1, 2, 3, 2, 1], [1, 2, 3, 2, 1]);
    expect(detectSymmetry(md)).toBe(SymmetryClass.Axial);
  });

  it('supports clockwise and counter-clockwise', () => {
    const cw = compute(mdnum(0, [1, 2, 3], [1, 2, 3], ComputationMode.Weighted, 'cw'));
    const ccw = compute(mdnum(0, [1, 2, 3], [1, 2, 3], ComputationMode.Weighted, 'ccw'));
    // Reversed neighbors with reversed weights should give same result
    expect(cw.value).toBeCloseTo(ccw.value, 10);
  });

  it('computes grid 8-neighbor', () => {
    const grid = [
      [1, 2, 3],
      [4, 5, 6],
      [7, 8, 9],
    ];
    const result = computeGrid(grid, 1, 1);
    expect(result.value).toBeGreaterThan(5);
  });
});

describe('HierarchicalMultiDim', () => {
  it('computes hierarchical structure', () => {
    const child1 = hmdnum(mdnum(3, [1, 2]));
    const child2 = hmdnum(mdnum(7, [5, 6]));
    const parent = hmdnum(mdnum(10, [0, 0], [1, 1]), [child1, child2]);
    const result = computeHierarchical(parent);
    expect(typeof result.value).toBe('number');
    expect(result.steps.length).toBeGreaterThan(0);
  });
});

// --- Core: Extended Numbers ---

describe('ExtendedNumber', () => {
  it('creates subscript', () => {
    const sub = subscript(0, ['o', 'o', 'o']);
    expect(sub.degree).toBe(3);
    expect(sub.base).toBe(0);
  });

  it('produces notation equivalence', () => {
    const sub = subscript(0, ['o', 'o', 'o']);
    const notation = toNotation(sub);
    expect(notation.sensory).toBe('0ooo');
    expect(notation.dialogue).toBe('0_o3');
    expect(notation.structural).toBe('0(o,3)');
  });

  it('parses all notation forms', () => {
    const s1 = parseSubscript('0ooo');
    const s2 = parseSubscript('0_o3');
    const s3 = parseSubscript('0(o,3)');
    expect(s1).not.toBeNull();
    expect(s2).not.toBeNull();
    expect(s3).not.toBeNull();
    expect(isEquivalent(s1!, s2!)).toBe(true);
    expect(isEquivalent(s2!, s3!)).toBe(true);
  });

  it('extends and reduces', () => {
    const en = extnum(subscript(0, ['o']));
    const extended = extend(en, 'x');
    expect(extended.subscript.degree).toBe(2);
    expect(extended.phase).toBe('extended');

    const reduced = reduce(extended);
    expect(reduced.subscript.degree).toBe(1);
    expect(reduced.phase).toBe('reduced');
  });

  it('creates extension chain', () => {
    const en = extnum(subscript(0, ['o']));
    const chain = extendChain(en, ['x', 'z', 'w']);
    expect(chain.length).toBe(4);
    expect(chain[3].subscript.degree).toBe(4);
  });

  it('performs dual extension', () => {
    const zero = extnum(subscript(0, ['o']));
    const pi = extnum(subscript(Math.PI, ['x']));
    const [ez, ep] = dualExtend(zero, pi, 'z');
    expect(ez.subscript.degree).toBe(2);
    expect(ep.subscript.degree).toBe(2);
  });
});

// --- Genesis Axiom System ---

describe('GenesisAxiomSystem', () => {
  it('creates initial void state', () => {
    const state = createGenesis();
    expect(state.phase).toBe('void');
    expect(state.history.length).toBe(0);
  });

  it('evolves through phases', () => {
    const state = runFullGenesis(0.3);
    expect(state.phase).toBe('number');
    expect(state.history.length).toBeGreaterThan(0);
  });

  it('enforces firewall rule', () => {
    expect(firewallCheck('void', 'dot')).toBe(true);
    expect(firewallCheck('void', 'zero_zero')).toBe(false);
    expect(firewallCheck('dot', 'zero')).toBe(false);
  });

  it('verifies Theorem S₀ and S₁', () => {
    const state = runFullGenesis();
    const s0 = verifyTheoremS0(state);
    const s1 = verifyTheoremS1(state);
    expect(s0.valid).toBe(true);
    expect(s1.valid).toBe(true);
  });
});

// --- GFT: Graphic Formula Theory ---

describe('GFT Graph', () => {
  it('builds from multi-dimensional number', () => {
    const md = mdnum(5, [1, 2, 3, 4]);
    const g = fromMultiDim(md);
    expect(g.nodes.length).toBe(5); // center + 4 neighbors
    expect(g.edges.length).toBe(4);
  });

  it('builds from extended number', () => {
    const en = extnum(subscript(0, ['o', 'o', 'o']));
    const g = fromExtended(en);
    expect(g.nodes.length).toBe(4); // base + 3 chars
    expect(g.edges.length).toBe(3);
  });

  it('builds genesis graph', () => {
    const g = fromGenesis();
    expect(g.nodes.length).toBe(5); // void → dot → 0₀ → 0 → ℕ
    expect(g.edges.length).toBe(4);
  });

  it('applies layout and renders SVG', () => {
    const md = mdnum(5, [1, 2, 3, 4]);
    const g = fromMultiDim(md);
    const laid = applyLayout(g, { algorithm: 'radial', width: 400, height: 400 });
    const output = renderSVG(laid, 400, 400);
    expect(output.svg).toContain('<svg');
    expect(output.nodeCount).toBe(5);
  });

  it('applies extend transform', () => {
    const en = extnum(subscript(0, ['o']));
    const g = fromExtended(en);
    const nodeId = g.nodes[0].id;
    const transformed = applyTransform(g, { type: 'extend', nodeId, char: 'x' });
    expect(transformed.nodes.length).toBe(g.nodes.length + 1);
  });

  it('reports graph statistics', () => {
    const g = fromGenesis();
    const stats = graphStats(g);
    expect(stats.nodeCount).toBe(5);
    expect(stats.edgeCount).toBe(4);
    expect(stats.kindDistribution['genesis']).toBe(5);
  });
});

describe('GFT Layouts', () => {
  const md = mdnum(5, [1, 2, 3, 4, 5, 6]);
  const g = fromMultiDim(md);

  it('applies radial layout', () => {
    const laid = applyLayout(g, { algorithm: 'radial' });
    expect(laid.metadata).toHaveProperty('layout', 'radial');
  });

  it('applies hierarchical layout', () => {
    const gg = fromGenesis();
    const laid = applyLayout(gg, { algorithm: 'hierarchical' });
    expect(laid.metadata).toHaveProperty('layout', 'hierarchical');
  });

  it('applies force layout', () => {
    const laid = applyLayout(g, { algorithm: 'force' });
    expect(laid.metadata).toHaveProperty('layout', 'force');
  });

  it('applies grid layout', () => {
    const laid = applyLayout(g, { algorithm: 'grid' });
    expect(laid.metadata).toHaveProperty('layout', 'grid');
  });
});

// --- Rei Language ---

describe('Rei Lexer', () => {
  it('tokenizes numbers', () => {
    const tokens = lex('42 3.14');
    expect(tokens.filter((t) => t.type === 'NUMBER').length).toBe(2);
  });

  it('tokenizes compress keyword', () => {
    const tokens = lex('compress add(x, y) -> x + y');
    expect(tokens[0].type).toBe('COMPRESS');
  });

  it('tokenizes pipe operator', () => {
    const tokens = lex('x |> f');
    expect(tokens.some((t) => t.type === 'PIPE_RIGHT')).toBe(true);
  });

  it('tokenizes extension/reduction operators', () => {
    const tokens = lex('0oo ⊕ o');
    expect(tokens.some((t) => t.type === 'EXTEND')).toBe(true);
  });

  it('tokenizes subscript notation', () => {
    const tokens = lex('0ooo');
    expect(tokens[0].type).toBe('SUBSCRIPT');
    expect(tokens[0].value).toBe('0ooo');
  });
});

describe('Rei Language', () => {
  it('evaluates arithmetic', () => {
    const results = run('2 + 3 * 4');
    expect(results[0]).toBe(14);
  });

  it('evaluates bind (immutable)', () => {
    const results = run('bind x = 42; x + 8');
    expect(results[1]).toBe(50);
  });

  it('evaluates compress (function)', () => {
    const results = run('compress double(x) -> x * 2; double(21)');
    expect(results[1]).toBe(42);
  });

  it('evaluates multidim literal', () => {
    const results = run('[5; 1, 2, 3, 4]');
    expect(results[0]).not.toBeNull();
    expect(typeof results[0]).toBe('object');
  });

  it('evaluates pipe operator', () => {
    const results = run('compress inc(x) -> x + 1; 41 |> inc');
    expect(results[1]).toBe(42);
  });

  it('formats values nicely', () => {
    expect(formatValue(42)).toBe('42');
    expect(formatValue('hello')).toBe('"hello"');
    expect(formatValue(null)).toBe('null');
  });
});
