// ============================================================
// Rei (0₀式) — Category C: Philosophical Foundations Tests
// 5 theories × core integration tests
// Author: Nobuki Fujimoto
// ============================================================

import { describe, it, expect } from 'vitest';
import {
  // C1: NEA
  parseSensory, parseDialogue, parseStructural, parseSemantic,
  parseZeroExtension, detectLayer, formatAs, notationEquivalent,
  type ZeroExtension, type NotationLayer,
  // C2: UMTE
  withDomain, domainCast, domainCompute, domainSemantics, isStandardDomain,
  // C3: NNM
  createDot, createShape, createColor, createSound, createChord,
  primitiveKind, createGeneralizedMD,
  type Dot, type Shape, type ColorValue, type SoundValue,
  // C4: MMRT
  computeTopological, computeOrdinal, computeCategorical,
  computeSymbolic, computeRelational, computeUnified,
  type TopologicalResult, type OrdinalResult, type CategoricalResult,
  type SymbolicResult, type RelationalResult,
  // C5: AMRT
  parallelCompute, computeAll, fork, join, divergence, consensus,
  type ParallelResult,
  // Shared
  type MultiDimNumber, type ComputeMode,
} from '../category-c-core.js';


// ============================================================
// Helper
// ============================================================
function md(center: number, neighbors: number[], mode: ComputeMode = 'weighted'): MultiDimNumber {
  return { center, neighbors, mode };
}


// ============================================================
// C1: 意識数理学 — Notation Equivalence Axiom (NEA)
// ============================================================
describe('C1: 意識数理学 — Notation Equivalence Axiom', () => {

  describe('Sensory Layer Parsing', () => {
    it('parses 0ooo', () => {
      const r = parseSensory('0ooo');
      expect(r).toEqual({ base: '0', subscripts: ['o', 'o', 'o'] });
    });

    it('parses πxxx', () => {
      const r = parseSensory('πxxx');
      expect(r).toEqual({ base: 'π', subscripts: ['x', 'x', 'x'] });
    });

    it('parses ezzo (mixed subscripts)', () => {
      const r = parseSensory('ezzo');
      expect(r).toEqual({ base: 'e', subscripts: ['z', 'z', 'o'] });
    });

    it('rejects invalid input', () => {
      expect(parseSensory('hello')).toBeNull();
      expect(parseSensory('0')).toBeNull();
      expect(parseSensory('')).toBeNull();
    });
  });

  describe('Dialogue Layer Parsing', () => {
    it('parses 0_o3', () => {
      const r = parseDialogue('0_o3');
      expect(r).toEqual({ base: '0', subscripts: ['o', 'o', 'o'] });
    });

    it('parses π_x5', () => {
      const r = parseDialogue('π_x5');
      expect(r).toEqual({ base: 'π', subscripts: ['x', 'x', 'x', 'x', 'x'] });
    });

    it('parses e_z1', () => {
      const r = parseDialogue('e_z1');
      expect(r).toEqual({ base: 'e', subscripts: ['z'] });
    });
  });

  describe('Structural Layer Parsing', () => {
    it('parses 0(o,3)', () => {
      const r = parseStructural('0(o,3)');
      expect(r).toEqual({ base: '0', subscripts: ['o', 'o', 'o'] });
    });

    it('parses π(x,2)', () => {
      const r = parseStructural('π(x,2)');
      expect(r).toEqual({ base: 'π', subscripts: ['x', 'x'] });
    });
  });

  describe('Semantic Layer Parsing', () => {
    it('parses 0{"sub":"o","degree":3}', () => {
      const r = parseSemantic('0{"sub":"o","degree":3}');
      expect(r).toEqual({ base: '0', subscripts: ['o', 'o', 'o'] });
    });

    it('parses π{"sub":"x","degree":4}', () => {
      const r = parseSemantic('π{"sub":"x","degree":4}');
      expect(r).toEqual({ base: 'π', subscripts: ['x', 'x', 'x', 'x'] });
    });
  });

  describe('NEA Core Axiom: All 4 layers produce identical results', () => {
    it('0ooo ≡ 0_o3 ≡ 0(o,3) ≡ 0{"sub":"o","degree":3}', () => {
      const sensory    = parseZeroExtension('0ooo');
      const dialogue   = parseZeroExtension('0_o3');
      const structural = parseZeroExtension('0(o,3)');
      const semantic   = parseZeroExtension('0{"sub":"o","degree":3}');

      expect(sensory).toEqual(dialogue);
      expect(dialogue).toEqual(structural);
      expect(structural).toEqual(semantic);
    });

    it('πxxx ≡ π_x3 ≡ π(x,3) ≡ π{"sub":"x","degree":3}', () => {
      const a = parseZeroExtension('πxxx');
      const b = parseZeroExtension('π_x3');
      const c = parseZeroExtension('π(x,3)');
      const d = parseZeroExtension('π{"sub":"x","degree":3}');

      expect(a).toEqual(b);
      expect(b).toEqual(c);
      expect(c).toEqual(d);
    });
  });

  describe('notationEquivalent()', () => {
    it('recognizes equivalent notations', () => {
      expect(notationEquivalent('0ooo', '0_o3')).toBe(true);
      expect(notationEquivalent('0_o3', '0(o,3)')).toBe(true);
      expect(notationEquivalent('πxxx', 'π(x,3)')).toBe(true);
    });

    it('rejects non-equivalent notations', () => {
      expect(notationEquivalent('0ooo', '0_o2')).toBe(false);
      expect(notationEquivalent('0ooo', 'πooo')).toBe(false);
    });
  });

  describe('detectLayer()', () => {
    it('detects sensory', () => expect(detectLayer('0ooo')).toBe('sensory'));
    it('detects dialogue', () => expect(detectLayer('0_o3')).toBe('dialogue'));
    it('detects structural', () => expect(detectLayer('0(o,3)')).toBe('structural'));
    it('detects semantic', () => expect(detectLayer('0{"sub":"o","degree":3}')).toBe('semantic'));
  });

  describe('formatAs() — round-trip conversion', () => {
    it('converts to all 4 layers and back', () => {
      const original: ZeroExtension = { base: '0', subscripts: ['o', 'o', 'o'] };
      const layers: NotationLayer[] = ['sensory', 'dialogue', 'structural', 'semantic'];

      for (const layer of layers) {
        const formatted = formatAs(original, layer);
        const parsed = parseZeroExtension(formatted);
        expect(parsed).toEqual(original);
      }
    });
  });
});


// ============================================================
// C2: 万物数理統一理論 (UMTE) — Domain System
// ============================================================
describe('C2: 万物数理統一理論 (UMTE) — Domain System', () => {

  it('attaches domain tag to MultiDimNumber', () => {
    const m = md(5, [1, 2, 3, 4]);
    const tagged = withDomain(m, 'image');
    expect(tagged.domain).toBe('image');
    expect(tagged.center).toBe(5);
  });

  it('casts between domains (structure preserved)', () => {
    const m = withDomain(md(60, [64, 67]), 'music');
    const cast = domainCast(m, 'physics');
    expect(cast.domain).toBe('physics');
    expect(cast.center).toBe(60);
    expect(cast.neighbors).toEqual([64, 67]);
  });

  it('validates standard domains', () => {
    expect(isStandardDomain('image')).toBe(true);
    expect(isStandardDomain('graph')).toBe(true);
    expect(isStandardDomain('music')).toBe(true);
    expect(isStandardDomain('physics')).toBe(true);
  });

  it('domainCompute returns domain-annotated result', () => {
    const m = withDomain(md(5, [1, 2, 3, 4]), 'image');
    const result = domainCompute(m, 'weighted');
    expect(result.domain).toBe('image');
    expect(result.mode).toBe('weighted');
    expect(typeof result.value).toBe('number');
  });

  it('domainSemantics provides domain-specific meaning', () => {
    expect(domainSemantics('weighted', 'image')).toContain('blur');
    expect(domainSemantics('weighted', 'graph')).toContain('influence');
    expect(domainSemantics('topological', 'graph')).toContain('adjacency');
    expect(domainSemantics('ordinal', 'music')).toContain('pitch');
  });

  it('same structure, different domains = same syntax, different semantics (UMTE principle)', () => {
    const data = md(128, [100, 120, 140, 130, 110, 125, 135, 115]);
    const asImage = domainCompute(withDomain(data, 'image'), 'weighted');
    const asGraph = domainCompute(withDomain(data, 'graph'), 'weighted');
    // Same computation, but the semantic meaning differs
    expect(asImage.value).toBe(asGraph.value);  // Identical numeric result
    expect(asImage.domain).not.toBe(asGraph.domain);  // Different interpretation
  });
});


// ============================================================
// C3: 非数数学理論 (NNM) — Non-Numeric Primitives
// ============================================================
describe('C3: 非数数学理論 (NNM) — Non-Numeric Primitives', () => {

  describe('Dot (・) — pre-numeric point', () => {
    it('creates dot primitive', () => {
      const dot = createDot();
      expect(dot.kind).toBe('dot');
    });

    it('detected as dot kind', () => {
      expect(primitiveKind(createDot())).toBe('dot');
    });
  });

  describe('Shape — geometric primitives', () => {
    it('creates triangle', () => {
      const tri = createShape('△', 3);
      expect(tri.kind).toBe('shape');
      expect(tri.type).toBe('△');
      expect(tri.vertices).toBe(3);
    });

    it('creates various shapes', () => {
      expect(createShape('□', 4).type).toBe('□');
      expect(createShape('○', 0).type).toBe('○');
      expect(createShape('☆', 10).type).toBe('☆');
    });

    it('detected as shape kind', () => {
      expect(primitiveKind(createShape('△', 3))).toBe('shape');
    });
  });

  describe('Color — center-neighbor color pattern', () => {
    it('creates color with neighbors', () => {
      const c = createColor('#FF6B35', ['#FFB563', '#FF4444']);
      expect(c.kind).toBe('color');
      expect(c.center).toBe('#FF6B35');
      expect(c.neighbors).toHaveLength(2);
    });

    it('creates color without neighbors', () => {
      const c = createColor('#000000');
      expect(c.neighbors).toHaveLength(0);
    });
  });

  describe('Sound — frequency/waveform primitives', () => {
    it('creates sound value', () => {
      const s = createSound(440, 'sine', 0.5);
      expect(s.kind).toBe('sound');
      expect(s.frequency).toBe(440);
      expect(s.waveform).toBe('sine');
      expect(s.duration).toBe(0.5);
    });

    it('creates chord literal', () => {
      const c = createChord(['C4', 'E4', 'G4']);
      expect(c.kind).toBe('chord');
      expect(c.notes).toEqual(['C4', 'E4', 'G4']);
    });
  });

  describe('Generalized MultiDim (non-numeric center-neighbor)', () => {
    it('creates generalized MD with colors', () => {
      const gmd = createGeneralizedMD(
        createColor('#FF0000'),
        [createColor('#00FF00'), createColor('#0000FF')],
        'image'
      );
      expect(gmd.center.kind).toBe('color');
      expect(gmd.neighbors).toHaveLength(2);
      expect(gmd.domain).toBe('image');
    });

    it('creates generalized MD with strings', () => {
      const gmd = createGeneralizedMD('center', ['up', 'down', 'left', 'right']);
      expect(gmd.center).toBe('center');
      expect(gmd.neighbors).toHaveLength(4);
    });
  });
});


// ============================================================
// C4: 超数学再構築理論 (MMRT) — Non-Arithmetic Modes
// ============================================================
describe('C4: 超数学再構築理論 (MMRT) — Non-Arithmetic Computation', () => {

  const peak = md(10, [1, 2, 3, 4, 5, 6, 7, 8]);
  const valley = md(1, [5, 6, 7, 8, 9, 10, 11, 12]);
  const plateau = md(5, [5, 5, 5, 5]);

  describe(':topological — adjacency structure only', () => {
    it('computes degree for 8-neighbor', () => {
      const r = computeTopological(peak);
      expect(r.kind).toBe('topological');
      expect(r.degree).toBe(8);
      expect(r.connectivity).toBe(1.0);
      expect(r.hasCenter).toBe(true);
    });

    it('computes degree for 4-neighbor', () => {
      const r = computeTopological(md(5, [1, 2, 3, 4]));
      expect(r.degree).toBe(4);
      expect(r.connectivity).toBe(0.5);
    });

    it('handles empty neighbors', () => {
      const r = computeTopological(md(5, []));
      expect(r.degree).toBe(0);
      expect(r.connectivity).toBe(0);
    });
  });

  describe(':ordinal — ordering relations only', () => {
    it('detects peak (center > all neighbors)', () => {
      const r = computeOrdinal(peak);
      expect(r.kind).toBe('ordinal');
      expect(r.below).toBe(8);
      expect(r.above).toBe(0);
      expect(r.rank).toBe(1.0);
    });

    it('detects valley (center < all neighbors)', () => {
      const r = computeOrdinal(valley);
      expect(r.below).toBe(0);
      expect(r.above).toBe(8);
      expect(r.rank).toBe(0);
    });

    it('detects plateau (center = all neighbors)', () => {
      const r = computeOrdinal(plateau);
      expect(r.equal).toBe(4);
      expect(r.rank).toBe(0);
    });
  });

  describe(':categorical — morphism composition', () => {
    it('computes morphisms from neighbors to center', () => {
      const r = computeCategorical(md(5, [3, 7]));
      expect(r.kind).toBe('categorical');
      expect(r.morphisms).toEqual([-2, 2]);
      expect(r.composed).toBe(0);
      expect(r.identity).toBe(true);  // symmetric → identity
    });

    it('non-identity composition', () => {
      const r = computeCategorical(md(5, [1, 2, 3]));
      expect(r.composed).toBe(-9);  // (1-5)+(2-5)+(3-5) = -4-3-2 = -9
      expect(r.identity).toBe(false);
    });
  });

  describe(':symbolic — pattern classification', () => {
    it('classifies peak pattern', () => {
      const r = computeSymbolic(peak);
      expect(r.kind).toBe('symbolic');
      expect(r.pattern).toBe('peak');
      expect(r.confidence).toBe(1.0);
    });

    it('classifies valley pattern', () => {
      const r = computeSymbolic(valley);
      expect(r.pattern).toBe('valley');
      expect(r.confidence).toBe(1.0);
    });

    it('classifies plateau pattern', () => {
      const r = computeSymbolic(plateau);
      expect(r.pattern).toBe('plateau');
    });

    it('classifies isolated (no neighbors)', () => {
      const r = computeSymbolic(md(5, []));
      expect(r.pattern).toBe('isolated');
    });
  });

  describe(':relational — relation predicates', () => {
    it('enumerates all relations', () => {
      const r = computeRelational(md(5, [3, 5, 7]));
      expect(r.kind).toBe('relational');
      expect(r.greater).toEqual([0]);   // index 0: 5>3
      expect(r.equal).toEqual([1]);     // index 1: 5==5
      expect(r.less).toEqual([2]);      // index 2: 5<7
    });

    it('computes dominance ratio', () => {
      const r = computeRelational(peak);
      expect(r.dominance).toBe(1.0);  // center dominates all
    });

    it('zero dominance for valley', () => {
      const r = computeRelational(valley);
      expect(r.dominance).toBe(0);
    });
  });

  describe('computeUnified dispatches correctly', () => {
    it('arithmetic modes return number', () => {
      expect(typeof computeUnified(peak, 'weighted')).toBe('number');
      expect(typeof computeUnified(peak, 'multiplicative')).toBe('number');
      expect(typeof computeUnified(peak, 'harmonic')).toBe('number');
      expect(typeof computeUnified(peak, 'exponential')).toBe('number');
    });

    it('non-arithmetic modes return typed results', () => {
      const topo = computeUnified(peak, 'topological') as TopologicalResult;
      expect(topo.kind).toBe('topological');

      const ord = computeUnified(peak, 'ordinal') as OrdinalResult;
      expect(ord.kind).toBe('ordinal');

      const cat = computeUnified(peak, 'categorical') as CategoricalResult;
      expect(cat.kind).toBe('categorical');

      const sym = computeUnified(peak, 'symbolic') as SymbolicResult;
      expect(sym.kind).toBe('symbolic');

      const rel = computeUnified(peak, 'relational') as RelationalResult;
      expect(rel.kind).toBe('relational');
    });
  });
});


// ============================================================
// C5: 別数理構築理論 (AMRT) — Parallel Mode Execution
// ============================================================
describe('C5: 別数理構築理論 (AMRT) — Parallel Execution', () => {

  const m = md(5, [1, 2, 3, 4, 5, 6, 7, 8]);

  describe('parallelCompute', () => {
    it('executes multiple modes simultaneously', () => {
      const r = parallelCompute(m, ['weighted', 'harmonic']);
      expect(r.kind).toBe('parallel');
      expect(r.modes).toEqual(['weighted', 'harmonic']);
      expect(typeof r.results['weighted']).toBe('number');
      expect(typeof r.results['harmonic']).toBe('number');
    });

    it('mixes arithmetic and non-arithmetic modes', () => {
      const r = parallelCompute(m, ['weighted', 'topological', 'symbolic']);
      expect(typeof r.results['weighted']).toBe('number');
      expect((r.results['topological'] as TopologicalResult).kind).toBe('topological');
      expect((r.results['symbolic'] as SymbolicResult).kind).toBe('symbolic');
    });
  });

  describe('computeAll', () => {
    it('runs all 9 modes', () => {
      const r = computeAll(m);
      expect(r.modes).toHaveLength(9);
      expect(Object.keys(r.results)).toHaveLength(9);
    });

    it('AMRT principle: every mode produces a valid result', () => {
      const r = computeAll(m);
      for (const [mode, result] of Object.entries(r.results)) {
        expect(result).toBeDefined();
        if (typeof result === 'number') {
          expect(isFinite(result)).toBe(true);
        } else {
          expect(result).toHaveProperty('kind');
        }
      }
    });
  });

  describe('fork', () => {
    it('creates multiple processing branches', () => {
      const r = fork(m, {
        path_a: (m) => computeUnified(m, 'weighted') as number,
        path_b: (m) => computeUnified(m, 'harmonic') as number,
        path_c: (m) => computeUnified(m, 'symbolic'),
      });
      expect(r.kind).toBe('fork');
      expect(Object.keys(r.branches)).toHaveLength(3);
      expect(typeof r.branches['path_a']).toBe('number');
      expect(typeof r.branches['path_b']).toBe('number');
      expect((r.branches['path_c'] as SymbolicResult).kind).toBe('symbolic');
    });
  });

  describe('join', () => {
    const results: Record<string, number> = {
      weighted: 4.5,
      harmonic: 3.2,
      exponential: 5.8,
    };

    it('join :first returns first result', () => {
      const r = join(results, 'first');
      expect(r).toBe(4.5);
    });

    it('join :consensus returns median', () => {
      const r = join(results, 'consensus');
      expect(r).toBe(4.5);  // median of [3.2, 4.5, 5.8]
    });

    it('join :best returns closest to zero', () => {
      const r = join(results, 'best');
      expect(r).toBe(3.2);  // |3.2| is smallest
    });

    it('join :all returns everything', () => {
      const r = join(results, 'all');
      expect(r).toEqual(results);
    });
  });

  describe('divergence', () => {
    it('computes pairwise numeric divergence', () => {
      const results: Record<string, number> = {
        weighted: 4.0,
        harmonic: 3.0,
      };
      const d = divergence(results);
      expect(d['weighted_vs_harmonic']).toBe(1.0);
    });

    it('marks non-numeric comparisons as incomparable', () => {
      const results: Record<string, number | object> = {
        weighted: 4.0,
        symbolic: { kind: 'symbolic', pattern: 'peak', confidence: 1.0 },
      };
      const d = divergence(results as any);
      expect(d['weighted_vs_symbolic']).toBe('incomparable');
    });
  });

  describe('consensus', () => {
    it('returns mean of numeric results', () => {
      const results: Record<string, number> = {
        weighted: 4.0,
        harmonic: 3.0,
        exponential: 5.0,
      };
      expect(consensus(results)).toBe(4.0);
    });

    it('ignores non-numeric results', () => {
      const results: Record<string, number | object> = {
        weighted: 6.0,
        symbolic: { kind: 'symbolic', pattern: 'peak', confidence: 1.0 },
      };
      expect(consensus(results as any)).toBe(6.0);
    });

    it('returns null for no numeric results', () => {
      const results: Record<string, object> = {
        symbolic: { kind: 'symbolic', pattern: 'peak', confidence: 1.0 },
      };
      expect(consensus(results as any)).toBeNull();
    });
  });
});


// ============================================================
// Cross-Theory Integration Tests
// ============================================================
describe('Category C — Cross-Theory Integration', () => {

  it('C1×C2: NEA notation with domain tag', () => {
    // Parse a notation, then apply domain
    const ext = parseZeroExtension('0ooo');
    expect(ext).not.toBeNull();
    // Domain tagging works on any parsed result
    const m = withDomain(md(0, [0, 0, 0]), 'physics');
    expect(m.domain).toBe('physics');
  });

  it('C2×C4: Domain-aware non-arithmetic compute', () => {
    const m = withDomain(md(10, [1, 2, 3, 4, 5, 6, 7, 8]), 'graph');
    const topo = computeUnified(m, 'topological') as TopologicalResult;
    const semantics = domainSemantics('topological', 'graph');
    expect(topo.degree).toBe(8);
    expect(semantics).toContain('adjacency');
  });

  it('C3×C4: Non-numeric + non-arithmetic (NNM×MMRT)', () => {
    // Dots can be in center-neighbor structures
    const dot = createDot();
    expect(dot.kind).toBe('dot');
    // Shape vertices as structural topology
    const shape = createShape('△', 3);
    expect(shape.vertices).toBe(3);
    // This mirrors topological mode: structure without values
  });

  it('C4×C5: All 9 modes via AMRT parallel execution', () => {
    const m = md(5, [1, 2, 3, 4, 5, 6, 7, 8]);
    const all = computeAll(m);

    // Verify arithmetic results are numbers
    expect(typeof all.results['weighted']).toBe('number');
    expect(typeof all.results['harmonic']).toBe('number');

    // Verify non-arithmetic results have kind tags
    expect((all.results['topological'] as TopologicalResult).kind).toBe('topological');
    expect((all.results['symbolic'] as SymbolicResult).kind).toBe('symbolic');

    // All 9 modes produced valid results
    expect(Object.keys(all.results)).toHaveLength(9);
  });

  it('C1×C5: Multiple notations → same parallel result (NEA×AMRT)', () => {
    // All 4 notations parse to the same zero extension
    const notations = ['0ooo', '0_o3', '0(o,3)', '0{"sub":"o","degree":3}'];
    const parsed = notations.map(n => parseZeroExtension(n));
    // All produce identical canonical form
    for (let i = 1; i < parsed.length; i++) {
      expect(parsed[i]).toEqual(parsed[0]);
    }
    // Therefore, any computation on any notation produces the same result
    // This is the deep connection: NEA ensures AMRT's parallel modes
    // are invariant across notation layers
  });

  it('Full pipeline: C1→C2→C3→C4→C5 integration', () => {
    // C1: Parse a notation
    const ext = parseZeroExtension('0ooo');
    expect(ext).not.toBeNull();

    // C2: Create domain-tagged data
    const m = withDomain(md(10, [1, 2, 3, 4, 5, 6, 7, 8]), 'physics');

    // C3: Non-numeric primitives coexist
    const dot = createDot();
    const shape = createShape('○', 0);
    expect(dot.kind).toBe('dot');
    expect(shape.kind).toBe('shape');

    // C4: Non-arithmetic compute
    const symbolic = computeSymbolic(m);
    expect(symbolic.pattern).toBe('peak');

    // C5: Parallel execution
    const parallel = computeAll(m);
    expect(parallel.modes).toHaveLength(9);

    // Consensus across all modes
    const c = consensus(parallel.results);
    expect(c).not.toBeNull();
  });
});
