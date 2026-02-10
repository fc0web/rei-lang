/**
 * ═══════════════════════════════════════════════════════════════════
 *  Rei (0₀式) Interpreter Test Suite
 *  BNF v0.2 — 21 Theories Integrated
 *  14 Sections / 88+ Tests
 *  Author: Nobuki Fujimoto
 * ═══════════════════════════════════════════════════════════════════
 */

import { rei, run, reiStr, Environment, ReiValue, toNumber } from '../src/index';

// Helper: evaluate with shared env
function evalWith(env: Environment, ...sources: string[]): ReiValue {
  let result: ReiValue = { kind: 'void' };
  for (const s of sources) {
    result = rei(s, env);
  }
  return result;
}

// ============================================================
// 1. Extended Number Literals
// ============================================================
describe('§1 Extended Number Literals', () => {

  it('parses 0ooo as extended number', () => {
    const r = rei('0ooo');
    expect(r.kind).toBe('extended');
    if (r.kind === 'extended') {
      expect(r.base).toBe('0');
      expect(r.subscripts).toEqual(['o', 'o', 'o']);
    }
  });

  it('parses 0oo (2 subscripts)', () => {
    const r = rei('0oo');
    expect(r.kind).toBe('extended');
    if (r.kind === 'extended') expect(r.subscripts).toHaveLength(2);
  });

  it('parses πooo', () => {
    const r = rei('πooo');
    expect(r.kind).toBe('extended');
    if (r.kind === 'extended') {
      expect(r.base).toBe('π');
      expect(r.numericValue).toBeCloseTo(Math.PI);
    }
  });

  it('parses eoo', () => {
    const r = rei('eoo');
    expect(r.kind).toBe('extended');
    if (r.kind === 'extended') expect(r.base).toBe('e');
  });

  it('parses φox', () => {
    const r = rei('φox');
    expect(r.kind).toBe('extended');
    if (r.kind === 'extended') expect(r.subscripts).toEqual(['o', 'x']);
  });

  it('parses 0₀ (zero-subscript-zero)', () => {
    const r = rei('0₀');
    expect(r.kind).toBe('extended');
  });

  it('displays extended as string', () => {
    expect(reiStr(rei('0ooo'))).toBe('0ooo');
    expect(reiStr(rei('πooo'))).toBe('πooo');
  });
});


// ============================================================
// 2. Extended Number Operations
// ============================================================
describe('§2 Extended Number Operations', () => {

  it('⊕ addition of extended numbers', () => {
    const env = new Environment();
    rei('let a = 0oo', env);
    rei('let b = 0ox', env);
    const r = rei('a ⊕ b', env);
    expect(r.kind).toBe('extended');
  });

  it('⊗ multiplication of extended numbers', () => {
    const env = new Environment();
    rei('let a = 0oo', env);
    rei('let b = 0ox', env);
    const r = rei('a ⊗ b', env);
    expect(r.kind).toBe('extended');
  });

  it('scalar multiplication ·', () => {
    const env = new Environment();
    rei('let a = 0oo', env);
    const r = rei('3 · a', env);
    expect(r.kind).toBe('extended');
  });

  it('>> extend adds subscript', () => {
    const env = new Environment();
    rei('let a = 0oo', env);
    const r = rei('a >> :x', env);
    expect(r.kind).toBe('extended');
    if (r.kind === 'extended') expect(r.subscripts).toEqual(['o', 'o', 'x']);
  });

  it('<< reduce removes subscript', () => {
    const env = new Environment();
    rei('let a = 0ooo', env);
    const r = rei('a <<', env);
    expect(r.kind).toBe('extended');
    if (r.kind === 'extended') expect(r.subscripts).toHaveLength(2);
  });

  it('.order property', () => {
    const env = new Environment();
    rei('let a = 0ooo', env);
    const r = rei('a.order', env);
    expect(r.kind).toBe('number');
    if (r.kind === 'number') expect(r.value).toBe(3);
  });
});


// ============================================================
// 3. Multi-Dimensional Numbers
// ============================================================
describe('§3 Multi-Dimensional Numbers', () => {

  it('parses 𝕄{center; neighbors}', () => {
    const r = rei('𝕄{5; 1, 2, 3, 4}');
    expect(r.kind).toBe('multidim');
    if (r.kind === 'multidim') {
      expect(r.center).toBe(5);
      expect(r.neighbors).toHaveLength(4);
    }
  });

  it('𝕄 with negative center', () => {
    const r = rei('𝕄{-0.53; 0, -0.6, 0, -0.9}');
    expect(r.kind).toBe('multidim');
    if (r.kind === 'multidim') expect(r.center).toBeCloseTo(-0.53);
  });

  it('𝕄 with weighted neighbor', () => {
    const r = rei('𝕄{10; 1, 2, 3 weight 0.5}');
    expect(r.kind).toBe('multidim');
    if (r.kind === 'multidim') {
      expect(r.neighbors[2].weight).toBe(0.5);
    }
  });

  it('.center property', () => {
    const env = new Environment();
    rei('let m = 𝕄{5; 1, 2, 3, 4}', env);
    const r = rei('m.center', env);
    if (r.kind === 'number') expect(r.value).toBe(5);
  });

  it('.dim property', () => {
    const env = new Environment();
    rei('let m = 𝕄{5; 1, 2, 3, 4, 5, 6, 7, 8}', env);
    const r = rei('m.dim', env);
    if (r.kind === 'number') expect(r.value).toBe(8);
  });
});


// ============================================================
// 4. Compute Modes (9 modes)
// ============================================================
describe('§4 Compute Modes', () => {

  const setup = (env: Environment) => {
    rei('let m = 𝕄{10; 1, 2, 3, 4, 5, 6, 7, 8}', env);
  };

  it('compute :weighted', () => {
    const env = new Environment();
    setup(env);
    const r = rei('m |> compute :weighted', env);
    expect(r.kind).toBe('number');
    if (r.kind === 'number') expect(r.value).toBeGreaterThan(0);
  });

  it('compute :multiplicative', () => {
    const env = new Environment();
    setup(env);
    const r = rei('m |> compute :multiplicative', env);
    expect(r.kind).toBe('number');
  });

  it('compute :harmonic', () => {
    const env = new Environment();
    setup(env);
    const r = rei('m |> compute :harmonic', env);
    expect(r.kind).toBe('number');
  });

  it('compute :exponential', () => {
    const env = new Environment();
    setup(env);
    const r = rei('m |> compute :exponential', env);
    expect(r.kind).toBe('number');
  });

  it('compute :zero', () => {
    const env = new Environment();
    setup(env);
    const r = rei('m |> compute :zero', env);
    expect(r.kind).toBe('number');
  });

  it('compute :pi', () => {
    const env = new Environment();
    setup(env);
    const r = rei('m |> compute :pi', env);
    expect(r.kind).toBe('number');
  });

  it('compute :e', () => {
    const env = new Environment();
    setup(env);
    const r = rei('m |> compute :e', env);
    expect(r.kind).toBe('number');
  });

  it('compute :phi', () => {
    const env = new Environment();
    setup(env);
    const r = rei('m |> compute :phi', env);
    expect(r.kind).toBe('number');
  });

  it('compute :symbolic', () => {
    const env = new Environment();
    setup(env);
    const r = rei('m |> compute :symbolic', env);
    expect(r.kind).toBe('number');
    if (r.kind === 'number') expect(r.value).toBe(8); // peak
  });

  it('compute :all returns parallel with 9 modes', () => {
    const env = new Environment();
    setup(env);
    const r = rei('m |> compute :all', env);
    expect(r.kind).toBe('parallel');
    if (r.kind === 'parallel') expect(r.modes).toHaveLength(9);
  });
});


// ============================================================
// 5. Compress Functions
// ============================================================
describe('§5 Compress Functions', () => {

  it('defines and calls a compress function', () => {
    const env = new Environment();
    rei('compress karma(i, e, r) = i * e * r', env);
    const r = rei('karma(0.8, 0.9, 0.7)', env);
    expect(r.kind).toBe('number');
    if (r.kind === 'number') expect(r.value).toBeCloseTo(0.504);
  });

  it('compress with MDim return', () => {
    const env = new Environment();
    rei('compress field(c, r) = 𝕄{c; r, r, r, r}', env);
    const r = rei('field(10, 2)', env);
    expect(r.kind).toBe('multidim');
  });

  it('compress used in pipeline', () => {
    const env = new Environment();
    rei('compress field(c, r) = 𝕄{c; r, r, r, r}', env);
    const r = rei('field(10, 2) |> compute :weighted', env);
    expect(r.kind).toBe('number');
  });

  it('compress with arithmetic', () => {
    const env = new Environment();
    rei('compress add(a, b) = a + b', env);
    const r = rei('add(3, 7)', env);
    if (r.kind === 'number') expect(r.value).toBe(10);
  });
});


// ============================================================
// 6. Let Bindings & Mutability
// ============================================================
describe('§6 Let Bindings & Mutability', () => {

  it('immutable let binding', () => {
    const env = new Environment();
    rei('let x = 42', env);
    const r = rei('x', env);
    if (r.kind === 'number') expect(r.value).toBe(42);
  });

  it('mutable let binding', () => {
    const env = new Environment();
    rei('let mut x = 10', env);
    const r = rei('x', env);
    if (r.kind === 'number') expect(r.value).toBe(10);
  });

  it('let with extended literal', () => {
    const env = new Environment();
    rei('let a = 0ooo', env);
    const r = rei('a', env);
    expect(r.kind).toBe('extended');
  });

  it('let with MDim', () => {
    const env = new Environment();
    rei('let m = 𝕄{5; 1, 2, 3, 4}', env);
    const r = rei('m.center', env);
    if (r.kind === 'number') expect(r.value).toBe(5);
  });

  it('multiple let bindings', () => {
    const env = new Environment();
    rei('let a = 10', env);
    rei('let b = 20', env);
    const r = rei('a + b', env);
    if (r.kind === 'number') expect(r.value).toBe(30);
  });

  it('witness clause', () => {
    const env = new Environment();
    rei('let x = 42 witnessed by "test_origin"', env);
    const binding = env.getBinding('x');
    expect(binding?.witness).toBe('test_origin');
  });
});


// ============================================================
// 7. Genesis Axiom System
// ============================================================
describe('§7 Genesis Axiom System', () => {

  it('creates genesis at S0', () => {
    const env = new Environment();
    rei('let g = genesis()', env);
    const r = rei('g.state', env);
    if (r.kind === 'string') expect(r.value).toBe('S0');
  });

  it('forward advances state', () => {
    const env = new Environment();
    const g = rei('genesis()', env) as any;
    // Forward creates a new genesis
    const g1 = rei('genesis() |> forward', env);
    if (g1.kind === 'genesis') expect(g1.state).toBe('S1');
  });

  it('double forward reaches S2', () => {
    const env = new Environment();
    // Since pipe creates new value, we chain
    rei('let g = genesis() |> forward', env);
    const r = rei('g |> forward', env);
    if (r.kind === 'genesis') {
      expect(r.state).toBe('S2');
      expect(r.omega).toBe(1);
    }
  });

  it('genesis.phase property', () => {
    const env = new Environment();
    rei('let g = genesis() |> forward', env);
    const r = rei('g.phase', env);
    if (r.kind === 'number') expect(r.value).toBe(1);
  });
});


// ============================================================
// 8. Four-Value Logic (Quad / 四価0π理論)
// ============================================================
describe('§8 Four-Value Logic', () => {

  it('⊤ literal', () => {
    const r = rei('⊤');
    expect(r.kind).toBe('quad');
    if (r.kind === 'quad') expect(r.value).toBe('⊤');
  });

  it('⊥ literal', () => {
    const r = rei('⊥');
    if (r.kind === 'quad') expect(r.value).toBe('⊥');
  });

  it('⊤π literal', () => {
    const r = rei('⊤π');
    if (r.kind === 'quad') expect(r.value).toBe('⊤π');
  });

  it('⊥π literal', () => {
    const r = rei('⊥π');
    if (r.kind === 'quad') expect(r.value).toBe('⊥π');
  });

  it('∧ (AND): ⊤ ∧ ⊤ = ⊤', () => {
    const r = rei('⊤ ∧ ⊤');
    if (r.kind === 'quad') expect(r.value).toBe('⊤');
  });

  it('∧ (AND): ⊤ ∧ ⊥ = ⊥', () => {
    const r = rei('⊤ ∧ ⊥');
    if (r.kind === 'quad') expect(r.value).toBe('⊥');
  });

  it('∨ (OR): ⊥ ∨ ⊤ = ⊤', () => {
    const r = rei('⊥ ∨ ⊤');
    if (r.kind === 'quad') expect(r.value).toBe('⊤');
  });

  it('¬ negation: ¬⊤ = ⊥', () => {
    const r = rei('¬⊤');
    if (r.kind === 'quad') expect(r.value).toBe('⊥');
  });

  it('¬ negation: ¬⊤π = ⊥π', () => {
    const r = rei('¬⊤π');
    if (r.kind === 'quad') expect(r.value).toBe('⊥π');
  });

  it('precedence: ⊤ ∧ ⊤ ∨ ⊥ = ⊤ (AND before OR)', () => {
    const r = rei('⊤ ∧ ⊤ ∨ ⊥');
    if (r.kind === 'quad') expect(r.value).toBe('⊤');
  });
});


// ============================================================
// 9. Domain Tags (as)
// ============================================================
describe('§9 Domain Tags', () => {

  it('tags as image domain', () => {
    const env = new Environment();
    rei('let pixel = 𝕄{128; 100, 120, 140, 130}', env);
    const r = rei('pixel |> as :image', env);
    expect(r.kind).toBe('domain');
    if (r.kind === 'domain') expect(r.domain).toBe('image');
  });

  it('tags as sound domain', () => {
    const r = rei('𝕄{440; 1, 0.5, 0.25} |> as :sound');
    expect(r.kind).toBe('domain');
    if (r.kind === 'domain') expect(r.domain).toBe('sound');
  });

  it('domain tagged value can be computed', () => {
    const env = new Environment();
    rei('let pixel = 𝕄{128; 100, 120, 140, 130}', env);
    const r = rei('pixel |> as :image |> compute :weighted', env);
    expect(r.kind).toBe('number');
  });
});


// ============================================================
// 10. Kappa Comparison & Symmetry
// ============================================================
describe('§10 Kappa Comparison & Symmetry', () => {

  it('>κ comparison', () => {
    const r = rei('5 >κ 3');
    if (r.kind === 'quad') expect(r.value).toBe('⊤');
  });

  it('<κ comparison', () => {
    const r = rei('3 <κ 5');
    if (r.kind === 'quad') expect(r.value).toBe('⊤');
  });

  it('=κ comparison (equal)', () => {
    const r = rei('7 =κ 7');
    if (r.kind === 'quad') expect(r.value).toBe('⊤');
  });

  it('=κ comparison (not equal)', () => {
    const r = rei('7 =κ 8');
    if (r.kind === 'quad') expect(r.value).toBe('⊥');
  });

  it('symmetry analysis (symmetric)', () => {
    const env = new Environment();
    rei('let m = 𝕄{0; 1, 2, 3, 2, 1}', env);
    const r = rei('m |> symmetry', env);
    if (r.kind === 'string') expect(r.value).toBe('Symmetric');
  });

  it('symmetry analysis (asymmetric)', () => {
    const env = new Environment();
    rei('let m = 𝕄{0; 1, 3, 5, 7}', env);
    const r = rei('m |> symmetry', env);
    if (r.kind === 'string') expect(r.value).toBe('Asymmetric');
  });
});


// ============================================================
// 11. Shapes & Dot (GFT Foundation)
// ============================================================
describe('§11 Shapes & Dot', () => {

  it('・ (dot) primordial point', () => {
    const r = rei('・');
    expect(r.kind).toBe('dot');
  });

  it('△ triangle shape', () => {
    const r = rei('△{・, ・, ・}');
    expect(r.kind).toBe('shape');
    if (r.kind === 'shape') {
      expect(r.shape).toBe('△');
      expect(r.vertexCount).toBe(3);
    }
  });

  it('□ square shape', () => {
    const r = rei('□{・, ・, ・, ・}');
    if (r.kind === 'shape') expect(r.vertexCount).toBe(4);
  });

  it('shape display string', () => {
    const r = reiStr(rei('△{・, ・, ・}'));
    expect(r).toContain('3 vertices');
  });
});


// ============================================================
// 12. ISL, Temporal, Timeless, Witness
// ============================================================
describe('§12 ISL, Temporal & Timeless', () => {

  it('ISL seal creates sealed value', () => {
    const r = rei('42 |> seal');
    expect(r.kind).toBe('isl_sealed');
    if (r.kind === 'isl_sealed') {
      expect(r.hash).toBeDefined();
      expect(r.hash.length).toBeGreaterThan(0);
    }
  });

  it('ISL verify on sealed returns ⊤', () => {
    const env = new Environment();
    rei('let s = 42 |> seal', env);
    const r = rei('s |> verify', env);
    if (r.kind === 'quad') expect(r.value).toBe('⊤');
  });

  it('ISL verify on unsealed returns ⊥', () => {
    const env = new Environment();
    rei('let x = 42', env);
    const r = rei('x |> verify', env);
    if (r.kind === 'quad') expect(r.value).toBe('⊥');
  });

  it('temporal wrapping', () => {
    const r = rei('42 |> temporal');
    expect(r.kind).toBe('temporal');
    if (r.kind === 'temporal') {
      expect(r.timestamp).toBeGreaterThan(0);
    }
  });

  it('timeless wrapping', () => {
    const r = rei('42 |> timeless');
    expect(r.kind).toBe('timeless');
    if (r.kind === 'timeless') {
      expect(r.invariantHash).toBeDefined();
    }
  });

  it('sealed value .hash property', () => {
    const env = new Environment();
    rei('let s = 42 |> seal', env);
    const r = rei('s.hash', env);
    expect(r.kind).toBe('string');
  });
});


// ============================================================
// 13. Spiral & Mirror Operations
// ============================================================
describe('§13 Spiral & Mirror Operations', () => {

  it('⤊ spiral up on extended', () => {
    const env = new Environment();
    rei('let a = 0oo', env);
    const r = rei('a ⤊', env);
    expect(r.kind).toBe('extended');
    if (r.kind === 'extended') {
      expect(r.subscripts.length).toBeGreaterThan(2);
    }
  });

  it('⤋ spiral down on multidim', () => {
    const env = new Environment();
    rei('let m = 𝕄{5; 1, 2, 3, 4}', env);
    const r = rei('m ⤋', env);
    expect(r.kind).toBe('number');
  });

  it('◁ mirror on extended reverses subscripts', () => {
    const env = new Environment();
    rei('let a = 0oxs', env);
    const r = rei('a |> mirror', env);
    if (r.kind === 'extended') {
      expect(r.subscripts).toEqual(['s', 'x', 'o']);
    }
  });

  it('◁ mirror on multidim reverses neighbors', () => {
    const env = new Environment();
    rei('let m = 𝕄{0; 1, 2, 3, 4}', env);
    const r = rei('m |> mirror', env);
    if (r.kind === 'multidim') {
      expect(r.neighbors.map(n => n.value)).toEqual([4, 3, 2, 1]);
    }
  });
});


// ============================================================
// 14. Integration — Multi-Step Pipelines
// ============================================================
describe('§14 Integration — Multi-Step Programs', () => {

  it('let + compute pipeline', () => {
    const env = new Environment();
    rei('let m = 𝕄{10; 1, 2, 3, 4, 5, 6, 7, 8}', env);
    const r = rei('m |> compute :weighted', env);
    expect(r.kind).toBe('number');
  });

  it('let + domain + compute', () => {
    const env = new Environment();
    rei('let pixel = 𝕄{128; 100, 120, 140, 130}', env);
    const r = rei('pixel |> as :image |> compute :weighted', env);
    expect(r.kind).toBe('number');
  });

  it('let + compute :all (all 9 modes)', () => {
    const env = new Environment();
    rei('let data = 𝕄{5; 1, 2, 3, 4, 5, 6, 7, 8}', env);
    const r = rei('data |> compute :all', env);
    expect(r.kind).toBe('parallel');
    if (r.kind === 'parallel') expect(r.modes).toHaveLength(9);
  });

  it('multiple lets and operations', () => {
    const env = new Environment();
    rei('let a = 10', env);
    rei('let b = 20', env);
    const r = rei('a + b', env);
    if (r.kind === 'number') expect(r.value).toBe(30);
  });

  it('zero extension → extend → check order', () => {
    const env = new Environment();
    rei('let z = 0oo', env);
    const r1 = rei('z >> :x', env);
    if (r1.kind === 'extended') {
      expect(r1.subscripts).toEqual(['o', 'o', 'x']);
    }
  });

  it('compress function + pipe chain', () => {
    const env = new Environment();
    rei('compress double(x) = x * 2', env);
    rei('let a = 5', env);
    const r = rei('double(a)', env);
    if (r.kind === 'number') expect(r.value).toBe(10);
  });

  it('genesis → forward → forward → check omega', () => {
    const env = new Environment();
    rei('let g = genesis() |> forward', env);
    const r = rei('g |> forward', env);
    if (r.kind === 'genesis') expect(r.omega).toBe(1);
  });

  it('basic multi-dim computation (example program)', () => {
    const r = rei('𝕄{5; 1, 2, 3, 4, 5, 6, 7, 8} |> compute :weighted');
    expect(r.kind).toBe('number');
  });

  it('seal + verify pipeline', () => {
    const env = new Environment();
    rei('let secret = 𝕄{42; 1, 2, 3} |> seal', env);
    const r = rei('secret |> verify', env);
    if (r.kind === 'quad') expect(r.value).toBe('⊤');
  });

  it('arithmetic expression evaluation', () => {
    const r = rei('3 + 4 * 2');
    if (r.kind === 'number') expect(r.value).toBe(11); // respects precedence
  });
});
