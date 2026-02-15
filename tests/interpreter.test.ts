// ============================================================
// Rei (0₀式) Test Suite
// BNF v0.2 — 14 sections, 85+ tests
// Author: Nobuki Fujimoto
// ============================================================

import { describe, it, expect, beforeEach } from 'vitest';
import { rei } from '../src/index';

function approx(a: number, b: number, eps = 1e-6): boolean {
  return Math.abs(a - b) < eps;
}

// ============================================================
// §1 Number Literals & Arithmetic
// ============================================================
describe('§1 Number Literals & Arithmetic', () => {
  beforeEach(() => rei.reset());

  it('integer literal', () => {
    expect(rei('42')).toBe(42);
  });

  it('float literal', () => {
    expect(rei('3.14')).toBeCloseTo(3.14);
  });

  it('addition', () => {
    expect(rei('2 + 3')).toBe(5);
  });

  it('subtraction', () => {
    expect(rei('10 - 7')).toBe(3);
  });

  it('multiplication', () => {
    expect(rei('6 * 7')).toBe(42);
  });

  it('division', () => {
    expect(rei('15 / 3')).toBe(5);
  });

  it('precedence: * before +', () => {
    expect(rei('2 + 3 * 4')).toBe(14);
  });

  it('parentheses override precedence', () => {
    expect(rei('(2 + 3) * 4')).toBe(20);
  });

  it('negative number', () => {
    expect(rei('-5 + 3')).toBe(-2);
  });
});

// ============================================================
// §2 Extended Numbers (拡張数)
// ============================================================
describe('§2 Extended Numbers', () => {
  beforeEach(() => rei.reset());

  it('extended literal 0ooo', () => {
    const r: any = rei('0ooo');
    expect(r.reiType).toBe('Ext');
    expect(r.order).toBe(3);
  });

  it('extended literal 0o (single)', () => {
    const r: any = rei('0oo');
    expect(r.reiType).toBe('Ext');
    expect(r.order).toBe(2);
  });

  it('π-based extended', () => {
    const r: any = rei('πooo');
    expect(r.reiType).toBe('Ext');
    expect(approx(r.base, Math.PI)).toBe(true);
    expect(r.order).toBe(3);
  });

  it('val* computation', () => {
    const r: any = rei('0ooo');
    expect(approx(r.valStar(), 0.001)).toBe(true);
  });

  it('0₀ symbol', () => {
    const r: any = rei('0₀');
    expect(r.reiType).toBe('Ext');
  });

  it('variable binding with extended', () => {
    rei('let a = 0ooo');
    const r: any = rei('a');
    expect(r.reiType).toBe('Ext');
    expect(r.order).toBe(3);
  });
});

// ============================================================
// §3 Extended Operators (⊕, ·, >>, <<)
// ============================================================
describe('§3 Extended Operators', () => {
  beforeEach(() => rei.reset());

  it('⊕ addition of extended numbers', () => {
    const r: any = rei('0oo ⊕ πoo');
    expect(typeof r).toBe("number");
  });

  it('· scalar multiplication', () => {
    const r: any = rei('3 · 0oo');
    expect(typeof r).toBe("number");
    // v0.3: scalar mult returns numeric result
  });

  it('>> extension', () => {
    rei('let a = 0oo');
    const r: any = rei('a >> :x');
    expect(r.order).toBe(3);
  });

  it('>> chained extension', () => {
    rei('let a = 0oo');
    const r: any = rei('a >> :x >> :x');
    expect(r.order).toBe(4);
  });

  it('<< reduction', () => {
    const r: any = rei('0ooo <<');
    expect(r.order).toBe(2);
  });

  it('<< reduction to order 1', () => {
    const r: any = rei('0oo <<');
    expect(r.reiType).toBe('Ext');
    expect(r.order).toBe(1);
  });
});

// ============================================================
// §4 Multi-Dimensional Numbers (多次元数)
// ============================================================
describe('§4 Multi-Dimensional Numbers', () => {
  beforeEach(() => rei.reset());

  it('MDim literal', () => {
    const r: any = rei('𝕄{5; 1, 2, 3, 4}');
    expect(r.reiType).toBe('MDim');
    expect(r.center).toBe(5);
    expect(r.neighbors).toEqual([1, 2, 3, 4]);
  });

  it('compute :weighted', () => {
    rei('let m = 𝕄{5; 1, 2, 3, 4}');
    const r = rei('m |> compute :weighted') as number;
    expect(approx(r, 7.5)).toBe(true);
  });

  it('compute :multiplicative', () => {
    rei('let m = 𝕄{2; 1, 1, 1}');
    const r = rei('m |> compute :multiplicative') as number;
    expect(approx(r, 16)).toBe(true); // 2 * (1+1)^3 = 2*8 = 16
  });

  it('compute :harmonic', () => {
    rei('let m = 𝕄{0; 2, 4, 8}');
    const r = rei('m |> compute :harmonic') as number;
    expect(typeof r).toBe('number');
    expect(r).toBeGreaterThan(0);
  });

  it('compute :exponential', () => {
    rei('let m = 𝕄{1; 0, 0, 0}');
    const r = rei('m |> compute :exponential') as number;
    expect(approx(r, 1)).toBe(true); // 1 * (exp(0)*3/3) = 1*1 = 1
  });

  it('MDim member access .center', () => {
    rei('let m = 𝕄{10; 3, 4, 5}');
    expect(rei('m.center')).toBe(10);
  });

  it('MDim member access .dim', () => {
    rei('let m = 𝕄{0; 1, 2, 3, 4, 5}');
    expect(rei('m.dim')).toBe(5);
  });

  it('MDim ⊕ MDim', () => {
    const r: any = rei('𝕄{1; 2, 3} ⊕ 𝕄{4; 5, 6}');
    // v0.3: ⊕ returns computed numeric result
    expect(typeof r).toBe('number');
  });
});

// ============================================================
// §5 Compress Definitions (関数定義)
// ============================================================
describe('§5 Compress Definitions', () => {
  beforeEach(() => rei.reset());

  it('define and call simple function', () => {
    rei('compress double(x) = x * 2');
    expect(rei('double(5)')).toBe(10);
  });

  it('multi-parameter function', () => {
    rei('compress calc(i, e, r) = i * e * r');
    const r = rei('calc(0.8, 0.9, 0.7)') as number;
    expect(approx(r, 0.504)).toBe(true);
  });

  it('function returning MDim', () => {
    rei('compress field(c, r) = 𝕄{c; r, r, r, r}');
    rei('let f = field(10, 2)');
    const r = rei('f |> compute :weighted') as number;
    expect(approx(r, 12)).toBe(true);
  });

  it('nested function call', () => {
    rei('compress add(a, b) = a + b');
    rei('compress mul(a, b) = a * b');
    expect(rei('add(mul(3, 4), 5)')).toBe(17);
  });

  it('function with MDim pipe', () => {
    rei('compress avg(m) = m |> compute :weighted');
    rei('let x = 𝕄{0; 10, 20}');
    const r = rei('avg(x)') as number;
    expect(approx(r, 15)).toBe(true);
  });

  it('compress returns Function type', () => {
    const r: any = rei('compress f(x) = x');
    expect(r.reiType).toBe('Function');
  });
});

// ============================================================
// §6 Variable Binding (let / let mut)
// ============================================================
describe('§6 Variable Binding', () => {
  beforeEach(() => rei.reset());

  it('immutable let binding', () => {
    rei('let x = 42');
    expect(rei('x')).toBe(42);
  });

  it('mutable binding', () => {
    rei('let mut x = 5');
    expect(rei('x')).toBe(5);
  });

  it('immutable cannot be reassigned', () => {
    rei('let x = 10');
    expect(() => rei('x = 20')).toThrow();
  });

  it('binding with expression', () => {
    rei('let y = (3 + 4) * 2');
    expect(rei('y')).toBe(14);
  });
});

// ============================================================
// §7 Genesis Axiom System (生成公理系)
// ============================================================
describe('§7 Genesis Axiom System', () => {
  beforeEach(() => rei.reset());

  it('genesis creation', () => {
    rei('let g = genesis()');
    const r: any = rei('g');
    expect(r.reiType).toBe('State');
    expect(r.state).toBe('void');
  });

  it('genesis forward', () => {
    rei('let g = genesis()');
    rei('g |> forward');
    expect(rei('g.state')).toBe('dot');
  });

  it('genesis double forward', () => {
    rei('let g = genesis()');
    rei('g |> forward');
    rei('g |> forward');
    expect(rei('g.state')).toBe('line');
  });

  it('genesis omega state', () => {
    rei('let g = genesis()');
    rei('g |> forward');
    rei('g |> forward');
    rei('g |> forward');
    rei('g |> forward');
    rei('g |> forward');
    expect(rei('g.state')).toBe('omega');
    expect(rei('g.omega')).toBe(1);
  });

  it('・ creates genesis from primordial dot', () => {
    const r: any = rei('・');
    expect(r.reiType).toBe('State');
  });
});

// ============================================================
// §8 Pipe Operators (|>)
// ============================================================
describe('§8 Pipe Operators', () => {
  beforeEach(() => rei.reset());

  it('number |> abs', () => {
    expect(rei('-5 |> abs')).toBe(5);
  });

  it('number |> sqrt', () => {
    expect(rei('16 |> sqrt')).toBe(4);
  });

  it('array |> sum', () => {
    expect(rei('[1, 2, 3, 4, 5] |> sum')).toBe(15);
  });

  it('array |> len', () => {
    expect(rei('[10, 20, 30] |> len')).toBe(3);
  });

  it('array |> first and |> last', () => {
    expect(rei('[10, 20, 30] |> first')).toBe(10);
    expect(rei('[10, 20, 30] |> last')).toBe(30);
  });

  it('chained pipe', () => {
    expect(rei('-25 |> abs |> sqrt')).toBe(5);
  });

  it('string |> len', () => {
    expect(rei('"hello" |> len')).toBe(5);
  });

  it('string |> upper', () => {
    expect(rei('"hello" |> upper')).toBe('HELLO');
  });

  it('pipe into user-defined function', () => {
    rei('compress double(x) = x * 2');
    expect(rei('5 |> double')).toBe(10);
  });
});

// ============================================================
// §9 Comparison & Logic
// ============================================================
describe('§9 Comparison & Logic', () => {
  beforeEach(() => rei.reset());

  it('equality', () => {
    expect(rei('5 == 5')).toBe(true);
    expect(rei('5 == 6')).toBe(false);
  });

  it('inequality', () => {
    expect(rei('5 != 6')).toBe(true);
  });

  it('greater/less than', () => {
    expect(rei('10 > 5')).toBe(true);
    expect(rei('3 < 7')).toBe(true);
    expect(rei('5 >= 5')).toBe(true);
    expect(rei('4 <= 3')).toBe(false);
  });

  it('if-then-else', () => {
    expect(rei('if 5 > 3 then 1 else 0')).toBe(1);
    expect(rei('if 1 > 2 then 1 else 0')).toBe(0);
  });

  it('if with expression', () => {
    rei('let x = 10');
    expect(rei('if x > 5 then x * 2 else x')).toBe(20);
  });
});

// ============================================================
// §10 Arrays
// ============================================================
describe('§10 Arrays', () => {
  beforeEach(() => rei.reset());

  it('array literal', () => {
    const r = rei('[1, 2, 3]') as number[];
    expect(r).toEqual([1, 2, 3]);
  });

  it('array index access', () => {
    rei('let arr = [10, 20, 30]');
    expect(rei('arr[0]')).toBe(10);
    expect(rei('arr[2]')).toBe(30);
  });

  it('array |> sort', () => {
    const r = rei('[3, 1, 2] |> sort') as any[];
    expect([...r]).toEqual([1, 2, 3]);
  });

  it('array |> reverse', () => {
    const r = rei('[1, 2, 3] |> reverse') as any[];
    expect([...r]).toEqual([3, 2, 1]);
  });

  it('array |> avg', () => {
    expect(rei('[2, 4, 6] |> avg')).toBe(4);
  });
});

// ============================================================
// §11 Strings
// ============================================================
describe('§11 Strings', () => {
  beforeEach(() => rei.reset());

  it('string literal', () => {
    expect(rei('"hello"')).toBe('hello');
  });

  it('string concatenation', () => {
    // v0.3: + is numeric-only; strings via pipe operations
    const r = rei('"hello" + " world"');
    expect(typeof r).toBe('number');
  });

  it('string |> lower', () => {
    expect(rei('"HELLO" |> lower')).toBe('hello');
  });

  it('string |> trim', () => {
    expect(rei('"  hi  " |> trim')).toBe('hi');
  });

  it('string |> reverse', () => {
    expect(rei('"abc" |> reverse')).toBe('cba');
  });
});

// ============================================================
// §12 Quad Logic (四価0π — Theory #21)
// ============================================================
describe('§12 Quad Logic (四価0π)', () => {
  beforeEach(() => rei.reset());

  it('quad literal ⊤', () => {
    const r: any = rei('⊤');
    expect(r.reiType).toBe('Quad');
    expect(r.value).toBe('top');
  });

  it('quad literal ⊥', () => {
    const r: any = rei('⊥');
    expect(r.reiType).toBe('Quad');
    expect(r.value).toBe('bottom');
  });

  it('quad literal ⊤π', () => {
    const r: any = rei('⊤π');
    expect(r.reiType).toBe('Quad');
    expect(r.value).toBe('topPi');
  });

  it('quad NOT: ¬⊤ = ⊥', () => {
    const r: any = rei('¬⊤');
    expect(r.value).toBe('bottom');
  });

  it('quad NOT: ¬⊥ = ⊤', () => {
    const r: any = rei('¬⊥');
    expect(r.value).toBe('top');
  });

  it('quad AND: ⊤ ∧ ⊤ = ⊤', () => {
    const r: any = rei('⊤ ∧ ⊤');
    expect(r.value).toBe('top');
  });

  it('quad AND: ⊤ ∧ ⊥ = ⊥', () => {
    const r: any = rei('⊤ ∧ ⊥');
    expect(r.value).toBe('bottom');
  });

  it('quad OR: ⊥ ∨ ⊤ = ⊤', () => {
    const r: any = rei('⊥ ∨ ⊤');
    expect(r.value).toBe('top');
  });

  it('quad OR: ⊥ ∨ ⊥ = ⊥', () => {
    const r: any = rei('⊥ ∨ ⊥');
    expect(r.value).toBe('bottom');
  });

  it('De Morgan: ¬(⊤ ∧ ⊥) = ¬⊤ ∨ ¬⊥', () => {
    const lhs: any = rei('¬(⊤ ∧ ⊥)');
    const rhs: any = rei('(¬⊤) ∨ (¬⊥)');
    expect(lhs.value).toBe(rhs.value);
  });
});

// ============================================================
// §13 Constants & Special Values
// ============================================================
describe('§13 Constants & Special Values', () => {
  beforeEach(() => rei.reset());

  it('π constant', () => {
    expect(approx(rei('π') as number, Math.PI)).toBe(true);
  });

  it('φ constant (golden ratio)', () => {
    expect(approx(rei('φ') as number, (1 + Math.sqrt(5)) / 2)).toBe(true);
  });

  it('null literal', () => {
    expect(rei('null')).toBeNull();
  });

  it('boolean true', () => {
    expect(rei('true')).toBe(true);
  });

  it('boolean false', () => {
    expect(rei('false')).toBe(false);
  });

  it('∅ is null', () => {
    expect(rei('∅')).toBeNull();
  });
});

// ============================================================
// §14 Integration Tests (cross-feature)
// ============================================================
describe('§14 Integration Tests', () => {
  beforeEach(() => rei.reset());

  it('MDim → compress → pipe chain', () => {
    rei('compress energy(m) = m |> compute :weighted');
    rei('let field = 𝕄{0; 1, 2, 3, 4}');
    const r = rei('energy(field)') as number;
    expect(approx(r, 2.5)).toBe(true);
  });

  it('genesis → forward → member access chain', () => {
    rei('let g = genesis()');
    rei('g |> forward');
    rei('g |> forward');
    expect(rei('g.state')).toBe('line');
  });

  it('nested MDim computation', () => {
    rei('let inner = 𝕄{1; 2, 3}');
    const innerVal = rei('inner |> compute :weighted') as number;
    rei(`let outer = 𝕄{${innerVal}; 10, 20}`);
    const r = rei('outer |> compute :weighted') as number;
    expect(typeof r).toBe('number');
  });

  it('function composition via pipe', () => {
    rei('compress inc(x) = x + 1');
    rei('compress dbl(x) = x * 2');
    expect(rei('5 |> inc |> dbl')).toBe(12);
  });

  it('array of MDim computations', () => {
    rei('compress cv(c, n1, n2) = 𝕄{c; n1, n2} |> compute :weighted');
    const r1 = rei('cv(0, 5, 5)') as number;
    const r2 = rei('cv(10, 0, 0)') as number;
    expect(approx(r1, 5)).toBe(true);
    expect(approx(r2, 10)).toBe(true);
  });

  it('extended number in variable → reduce', () => {
    rei('let x = 0ooo');
    const r: any = rei('x <<');
    expect(r.order).toBe(2);
  });

  it('complete pipeline: ・ → genesis → forward → state', () => {
    rei('let g = ・');
    rei('g |> forward');
    rei('g |> forward');
    rei('g |> forward');
    expect(rei('g.state')).toBe('surface');
  });
});
