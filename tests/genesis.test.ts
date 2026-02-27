// ============================================================
// Rei v0.5.5 — Genesis Axiom System (A4) Tests
// 公理A4: 生成相転移（Genesis Phase Transition）の専用テスト
//
// A4: 存在は無から段階的に生じる。各段階は不可逆であり、
//     段階を飛び越えることはできない。
//
// Phase order: void → dot → line → surface → solid → omega
// Axiom map:   G-E₁    G-S₀    G-S₁      G-N₁
//
// @axiom A4
// ============================================================

import { describe, it, expect, beforeEach } from 'vitest';
import { rei } from '../src/index';

// ============================================================
// §1 Genesis Creation — G-E₁ 存在公理の前提
// ============================================================
describe('A4 §1: Genesis Creation (存在公理の前提)', () => {
  beforeEach(() => rei.reset());

  it('genesis() creates a State object', () => {
    rei('let g = genesis()');
    const r: any = rei('g');
    expect(r).not.toBeNull();
    expect(r.reiType).toBe('State');
  });

  it('initial state is void — complete nothingness', () => {
    rei('let g = genesis()');
    expect(rei('g.state')).toBe('void');
  });

  it('initial omega is 0 — not yet fully emerged', () => {
    rei('let g = genesis()');
    expect(rei('g.omega')).toBe(0);
  });

  it('initial history contains only void', () => {
    rei('let g = genesis()');
    const h: any = rei('g.history');
    expect(h).toEqual(['void']);
  });

  it('multiple genesis instances are independent', () => {
    rei('let g1 = genesis()');
    rei('let g2 = genesis()');
    rei('g1 |> forward');
    expect(rei('g1.state')).toBe('dot');
    expect(rei('g2.state')).toBe('void');
  });
});

// ============================================================
// §2 Phase Transitions — G-E₁, G-S₀, G-S₁, G-N₁
// ============================================================
describe('A4 §2: Phase Transitions (相転移)', () => {
  beforeEach(() => rei.reset());

  it('G-E₁: void → dot — something can exist', () => {
    rei('let g = genesis()');
    rei('g |> forward');
    expect(rei('g.state')).toBe('dot');
  });

  it('G-S₀: dot → line — structure begins to separate', () => {
    rei('let g = genesis()');
    rei('g |> forward'); // void → dot
    rei('g |> forward'); // dot → line
    expect(rei('g.state')).toBe('line');
  });

  it('G-S₁: line → surface — value becomes fixable', () => {
    rei('let g = genesis()');
    rei('g |> forward'); // void → dot
    rei('g |> forward'); // dot → line
    rei('g |> forward'); // line → surface
    expect(rei('g.state')).toBe('surface');
  });

  it('G-N₁: surface → solid — number system emerges', () => {
    rei('let g = genesis()');
    rei('g |> forward'); // void → dot
    rei('g |> forward'); // dot → line
    rei('g |> forward'); // line → surface
    rei('g |> forward'); // surface → solid
    expect(rei('g.state')).toBe('solid');
  });

  it('solid → omega — full emergence', () => {
    rei('let g = genesis()');
    rei('g |> forward');
    rei('g |> forward');
    rei('g |> forward');
    rei('g |> forward');
    rei('g |> forward'); // solid → omega
    expect(rei('g.state')).toBe('omega');
  });

  it('full genesis chain: void → dot → line → surface → solid → omega', () => {
    rei('let g = genesis()');
    const phases = ['void'];
    for (let i = 0; i < 5; i++) {
      rei('g |> forward');
      phases.push(rei('g.state') as string);
    }
    expect(phases).toEqual(['void', 'dot', 'line', 'surface', 'solid', 'omega']);
  });
});

// ============================================================
// §3 Firewall Rule — 遮断規則
// ============================================================
describe('A4 §3: Firewall Rule (遮断規則)', () => {
  beforeEach(() => rei.reset());

  it('transitions advance exactly one step at a time', () => {
    rei('let g = genesis()');
    rei('g |> forward');
    // After one forward, must be dot (not line, not surface)
    expect(rei('g.state')).toBe('dot');
    expect(rei('g.state')).not.toBe('line');
    expect(rei('g.state')).not.toBe('surface');
  });

  it('cannot skip from void directly to line', () => {
    rei('let g = genesis()');
    rei('g |> forward'); // void → dot (must pass through dot)
    expect(rei('g.state')).toBe('dot');
    // There is no way to reach line without passing through dot
  });

  it('omega is a terminal state — forward has no effect', () => {
    rei('let g = genesis()');
    for (let i = 0; i < 5; i++) rei('g |> forward');
    expect(rei('g.state')).toBe('omega');
    // Additional forward should not change state
    rei('g |> forward');
    expect(rei('g.state')).toBe('omega');
  });

  it('forward beyond omega does not crash', () => {
    rei('let g = genesis()');
    for (let i = 0; i < 10; i++) rei('g |> forward');
    expect(rei('g.state')).toBe('omega');
  });

  it('each forward adds exactly one phase to history', () => {
    rei('let g = genesis()');
    expect((rei('g.history') as any[]).length).toBe(1); // [void]
    rei('g |> forward');
    expect((rei('g.history') as any[]).length).toBe(2); // [void, dot]
    rei('g |> forward');
    expect((rei('g.history') as any[]).length).toBe(3); // [void, dot, line]
  });
});

// ============================================================
// §4 History Tracking — 履歴保持（A4 ∩ A3）
// ============================================================
describe('A4 §4: History Tracking (履歴保持)', () => {
  beforeEach(() => rei.reset());

  it('history records complete phase sequence', () => {
    rei('let g = genesis()');
    rei('g |> forward');
    rei('g |> forward');
    rei('g |> forward');
    const h: any = rei('g.history');
    expect(h).toEqual(['void', 'dot', 'line', 'surface']);
  });

  it('full history from void to omega', () => {
    rei('let g = genesis()');
    for (let i = 0; i < 5; i++) rei('g |> forward');
    const h: any = rei('g.history');
    expect(h).toEqual(['void', 'dot', 'line', 'surface', 'solid', 'omega']);
  });

  it('history length equals current phase index + 1', () => {
    rei('let g = genesis()');
    expect((rei('g.history') as any[]).length).toBe(1);
    for (let i = 0; i < 5; i++) {
      rei('g |> forward');
      expect((rei('g.history') as any[]).length).toBe(i + 2);
    }
  });

  it('history is ordered — earlier phases come first', () => {
    rei('let g = genesis()');
    for (let i = 0; i < 5; i++) rei('g |> forward');
    const h: any = rei('g.history');
    expect(h[0]).toBe('void');
    expect(h[h.length - 1]).toBe('omega');
  });

  it('forward at omega does not duplicate omega in history', () => {
    rei('let g = genesis()');
    for (let i = 0; i < 5; i++) rei('g |> forward');
    const len1 = (rei('g.history') as any[]).length;
    rei('g |> forward'); // extra forward at omega
    const len2 = (rei('g.history') as any[]).length;
    expect(len2).toBe(len1); // history should not grow
  });
});

// ============================================================
// §5 Omega State — 完全生成状態
// ============================================================
describe('A4 §5: Omega State (完全生成状態)', () => {
  beforeEach(() => rei.reset());

  it('omega flag is 0 before reaching omega', () => {
    rei('let g = genesis()');
    rei('g |> forward');
    rei('g |> forward');
    expect(rei('g.omega')).toBe(0);
  });

  it('omega flag becomes 1 at omega state', () => {
    rei('let g = genesis()');
    for (let i = 0; i < 5; i++) rei('g |> forward');
    expect(rei('g.omega')).toBe(1);
  });

  it('omega flag remains 1 after extra forwards', () => {
    rei('let g = genesis()');
    for (let i = 0; i < 7; i++) rei('g |> forward');
    expect(rei('g.omega')).toBe(1);
  });
});

// ============================================================
// §6 ・ (Dot Literal) — 原初的存在
// ============================================================
describe('A4 §6: ・ Literal (原初的存在)', () => {
  beforeEach(() => rei.reset());

  it('・ creates a Genesis State', () => {
    const r: any = rei('・');
    expect(r).not.toBeNull();
    expect(r.reiType).toBe('State');
  });

  it('・ represents the primordial dot — first existence', () => {
    const r: any = rei('・');
    // ・ is the first existence, conceptually equivalent to G-E₁
    expect(r.reiType).toBe('State');
  });
});

// ============================================================
// §7 Property Access — 属性アクセス
// ============================================================
describe('A4 §7: Property Access (属性アクセス)', () => {
  beforeEach(() => rei.reset());

  it('.state returns current phase', () => {
    rei('let g = genesis()');
    expect(rei('g.state')).toBe('void');
    rei('g |> forward');
    expect(rei('g.state')).toBe('dot');
  });

  it('.phase is alias for .state', () => {
    rei('let g = genesis()');
    rei('g |> forward');
    expect(rei('g.phase')).toBe('dot');
    expect(rei('g.state')).toBe(rei('g.phase'));
  });

  it('.omega returns omega flag', () => {
    rei('let g = genesis()');
    expect(rei('g.omega')).toBe(0);
  });

  it('.history returns phase array', () => {
    rei('let g = genesis()');
    rei('g |> forward');
    const h: any = rei('g.history');
    expect(Array.isArray(h)).toBe(true);
    expect(h.length).toBe(2);
  });
});

// ============================================================
// §8 Uniqueness — 遷移の一意性（定理 S₀, S₁）
// ============================================================
describe('A4 §8: Transition Uniqueness (遷移の一意性)', () => {
  beforeEach(() => rei.reset());

  it('Theorem S₀: void → dot transition is unique', () => {
    // Run two independent genesis and verify same result
    rei('let g1 = genesis()');
    rei('let g2 = genesis()');
    rei('g1 |> forward');
    rei('g2 |> forward');
    expect(rei('g1.state')).toBe(rei('g2.state'));
    expect(rei('g1.state')).toBe('dot');
  });

  it('Theorem S₁: dot → line transition is unique', () => {
    rei('let g1 = genesis()');
    rei('let g2 = genesis()');
    rei('g1 |> forward'); rei('g1 |> forward');
    rei('g2 |> forward'); rei('g2 |> forward');
    expect(rei('g1.state')).toBe(rei('g2.state'));
    expect(rei('g1.state')).toBe('line');
  });

  it('all transitions are deterministic — same path every time', () => {
    const paths: string[][] = [];
    for (let trial = 0; trial < 3; trial++) {
      rei.reset();
      rei('let g = genesis()');
      const path = ['void'];
      for (let i = 0; i < 5; i++) {
        rei('g |> forward');
        path.push(rei('g.state') as string);
      }
      paths.push(path);
    }
    // All trials must produce identical paths
    expect(paths[0]).toEqual(paths[1]);
    expect(paths[1]).toEqual(paths[2]);
  });
});

// ============================================================
// §9 Pipe Integration — パイプ演算子との統合
// ============================================================
describe('A4 §9: Pipe Integration (パイプ統合)', () => {
  beforeEach(() => rei.reset());

  it('genesis → forward via pipe', () => {
    rei('let g = genesis()');
    rei('g |> forward');
    expect(rei('g.state')).toBe('dot');
  });

  it('genesis → forward → phase access chain', () => {
    rei('let g = genesis()');
    rei('g |> forward');
    rei('g |> forward');
    expect(rei('g.state')).toBe('line');
  });

  it('multiple forwards via sequential pipes', () => {
    rei('let g = genesis()');
    rei('g |> forward');
    rei('g |> forward');
    rei('g |> forward');
    rei('g |> forward');
    rei('g |> forward');
    expect(rei('g.state')).toBe('omega');
    expect(rei('g.omega')).toBe(1);
  });
});
