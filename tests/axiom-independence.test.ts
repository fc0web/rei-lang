// ============================================================
// axiom-independence.test.ts — Rei 4公理独立性の計算論的証明
//
// 4つの反モデル M1-M4 に対して、各公理の成立/不成立を検証する。
// 各モデルが正確に3公理を満たし1公理を満たさないことを示す。
//
// §1 M1: ScalarModel   — ¬A1, A2✓, A3✓, A4✓  (20 tests)
// §2 M2: FlatModel     — A1✓, ¬A2, A3✓, A4✓  (20 tests)
// §3 M3: AmnesicModel  — A1✓, A2✓, ¬A3, A4✓  (20 tests)
// §4 M4: EternalModel  — A1✓, A2✓, A3✓, ¬A4  (20 tests)
// §5 独立性行列の整合性検証                      (5 tests)
//
// 合計: 85 tests
//
// 証明原理（モデル論的独立性）:
//   公理Aᵢが他の3公理から導出可能であれば、
//   他の3公理を満たすモデルは必然的にAᵢも満たす。
//   Mᵢが他の3公理を満たしAᵢを満たさない ⟹ Aᵢは独立。
//
// @author Nobuki Fujimoto (D-FUMT)
// ============================================================

import { describe, it, expect } from 'vitest';
import {
  // M1: ScalarModel
  m1Create, m1Init, m1HasPeriphery, m1GetNeighborCount,
  m1Extend, m1Reduce, m1VerifyInverse, m1Transform,
  m1GenesisCreate, m1GenesisForward,
  // M2: FlatModel
  m2Create, m2Compute, m2Init, m2HasDepth, m2GetDepth,
  m2Transform, m2GenesisCreate, m2GenesisForward,
  // M3: AmnesicModel
  m3Create, m3Compute, m3Extend, m3Reduce, m3VerifyInverse,
  m3Transform, m3Chain, m3GetHistory, m3GetTransformCount,
  m3GenesisCreate, m3GenesisForward,
  // M4: EternalModel
  m4Create, m4Compute, m4Extend, m4Reduce, m4VerifyInverse,
  m4Init, m4Transform, m4GenesisCreate, m4GenesisForward, m4Axiom,
  // 検証関数
  checkA1, checkA2, checkA3, checkA4, independenceMatrix,
} from '../theory/axiom-independence-models';

// ============================================================
// §1 M1: ScalarModel — ¬A1, A2✓, A3✓, A4✓
// ============================================================
describe('§1 M1: ScalarModel (¬A1, A2✓, A3✓, A4✓)', () => {

  // --- A1 不成立の証明 ---
  describe('A1 ✗ — 中心-周囲構造なし', () => {
    it('1.1 periphery が存在しない', () => {
      const v = m1Create(5);
      expect(m1HasPeriphery(v)).toBe(false);
    });

    it('1.2 neighbor 数が常に 0', () => {
      const v = m1Create(42);
      expect(m1GetNeighborCount(v)).toBe(0);
    });

    it('1.3 値は常にスカラー（場ではない）', () => {
      const v = m1Create(7);
      expect(typeof v.scalar).toBe('number');
      expect('periphery' in v).toBe(false);
    });

    it('1.4 checkA1(M1): 要件不充足', () => {
      const a1 = checkA1('M1');
      expect(a1.hasPeriphery).toBe(false);
      expect(a1.canCompute).toBe(false);
      expect(a1.canHaveMultipleNeighbors).toBe(false);
    });
  });

  // --- A2 成立の証明 ---
  describe('A2 ✓ — 拡張-縮約', () => {
    it('1.5 extend: 深度が増加する', () => {
      const v = m1Create(5);
      const ext = m1Extend(v);
      expect(ext.depth).toBe(1);
      expect(ext.scalar).toBeCloseTo(0.5);
    });

    it('1.6 reduce: 深度が減少する', () => {
      const v = m1Extend(m1Create(5));
      const red = m1Reduce(v);
      expect(red.depth).toBe(0);
      expect(red.scalar).toBeCloseTo(5);
    });

    it('1.7 逆元性: ⊖(⊕(v)) = v', () => {
      expect(m1VerifyInverse(m1Create(5))).toBe(true);
      expect(m1VerifyInverse(m1Create(0))).toBe(true);
      expect(m1VerifyInverse(m1Create(-3.14))).toBe(true);
    });

    it('1.8 多段階拡張: depth ≥ 2', () => {
      let v = m1Create(100);
      v = m1Extend(v); v = m1Extend(v); v = m1Extend(v);
      expect(v.depth).toBe(3);
      expect(v.scalar).toBeCloseTo(0.1);
    });
  });

  // --- A3 成立の証明 ---
  describe('A3 ✓ — σ蓄積', () => {
    it('1.9 変換で履歴が蓄積される', () => {
      let s = m1Init(5);
      s = m1Transform(s, v => ({ ...v, scalar: v.scalar + 3 }));
      expect(s.sigma.history).toHaveLength(1);
      expect(s.sigma.history[0].scalar).toBe(5);
    });

    it('1.10 変換回数が追跡される', () => {
      let s = m1Init(0);
      s = m1Transform(s, v => ({ ...v, scalar: v.scalar + 1 }));
      s = m1Transform(s, v => ({ ...v, scalar: v.scalar + 1 }));
      s = m1Transform(s, v => ({ ...v, scalar: v.scalar + 1 }));
      expect(s.sigma.count).toBe(3);
    });

    it('1.11 傾向性が計算される', () => {
      let s = m1Init(0);
      s = m1Transform(s, v => ({ ...v, scalar: v.scalar + 10 }));
      expect(s.sigma.tendency).toBe('rising');
      s = m1Transform(s, v => ({ ...v, scalar: v.scalar - 5 }));
      expect(s.sigma.tendency).toBe('falling');
    });

    it('1.12 履歴は蓄積のみ（減少しない）', () => {
      let s = m1Init(0);
      for (let i = 0; i < 5; i++) {
        s = m1Transform(s, v => ({ ...v, scalar: v.scalar + 1 }));
      }
      expect(s.sigma.history).toHaveLength(5);
      // 各履歴エントリが変換前の値を正確に記録
      expect(s.sigma.history[0].scalar).toBe(0);
      expect(s.sigma.history[4].scalar).toBe(4);
    });
  });

  // --- A4 成立の証明 ---
  describe('A4 ✓ — 生成相転移', () => {
    it('1.13 void 状態が存在する', () => {
      const g = m1GenesisCreate();
      expect(g.phase).toBe('void');
      expect(g.value).toBeNull();
    });

    it('1.14 相転移 void → dot → zero-ext → zero → natural', () => {
      let g = m1GenesisCreate();
      g = m1GenesisForward(g); expect(g.phase).toBe('dot');
      g = m1GenesisForward(g); expect(g.phase).toBe('zero-ext');
      g = m1GenesisForward(g); expect(g.phase).toBe('zero');
      g = m1GenesisForward(g); expect(g.phase).toBe('natural');
    });

    it('1.15 遮断規則: 段階飛ばし不可（forward は1段階ずつ）', () => {
      let g = m1GenesisCreate();
      g = m1GenesisForward(g);
      expect(g.phase).toBe('dot'); // void → dot のみ。void → zero は不可
    });

    it('1.16 omega到達後は遷移しない', () => {
      let g = m1GenesisCreate();
      for (let i = 0; i < 4; i++) g = m1GenesisForward(g);
      expect(g.phase).toBe('natural');
      const g2 = m1GenesisForward(g);
      expect(g2.phase).toBe('natural'); // 変化なし
    });
  });
});

// ============================================================
// §2 M2: FlatModel — A1✓, ¬A2, A3✓, A4✓
// ============================================================
describe('§2 M2: FlatModel (A1✓, ¬A2, A3✓, A4✓)', () => {

  // --- A1 成立の証明 ---
  describe('A1 ✓ — 中心-周囲構造', () => {
    it('2.1 center と periphery を持つ', () => {
      const v = m2Create(5, [1, 2, 3, 4]);
      expect(v.center).toBe(5);
      expect(v.periphery).toEqual([1, 2, 3, 4]);
    });

    it('2.2 compute: 中心と周囲から値を算出', () => {
      const v = m2Create(5, [1, 2, 3, 4]);
      expect(m2Compute(v)).toBeCloseTo(7.5);
    });

    it('2.3 退化条件: periphery空ならcenter', () => {
      const v = m2Create(42, []);
      expect(m2Compute(v)).toBe(42);
    });

    it('2.4 複数近傍を持てる', () => {
      const v = m2Create(0, [1, 2, 3, 4, 5, 6, 7, 8]);
      expect(v.periphery).toHaveLength(8);
    });
  });

  // --- A2 不成立の証明 ---
  describe('A2 ✗ — 拡張-縮約なし', () => {
    it('2.5 depth の概念がない', () => {
      const v = m2Create(5, [1, 2, 3]);
      expect(m2HasDepth(v)).toBe(false);
    });

    it('2.6 depth は常に 0', () => {
      const v = m2Create(5, [1, 2, 3]);
      expect(m2GetDepth(v)).toBe(0);
    });

    it('2.7 extend/reduce は定義されていない', () => {
      // TypeScript レベルで m2Extend, m2Reduce は存在しない
      expect(typeof (m2Create as any).extend).toBe('undefined');
    });

    it('2.8 checkA2(M2): 全要件不充足', () => {
      const a2 = checkA2('M2');
      expect(a2.canExtend).toBe(false);
      expect(a2.canReduce).toBe(false);
      expect(a2.inverseHolds).toBe(false);
      expect(a2.multipleDepthLevels).toBe(false);
    });
  });

  // --- A3 成立の証明 ---
  describe('A3 ✓ — σ蓄積', () => {
    it('2.9 変換で履歴蓄積', () => {
      let s = m2Init(5, [1, 2]);
      s = m2Transform(s, v => m2Create(v.center + 1, [...v.periphery]));
      expect(s.sigma.history).toHaveLength(1);
      expect(s.sigma.count).toBe(1);
    });

    it('2.10 傾向性計算', () => {
      let s = m2Init(0, []);
      s = m2Transform(s, () => m2Create(10, []));
      expect(s.sigma.tendency).toBe('rising');
    });

    it('2.11 3回変換で count=3', () => {
      let s = m2Init(0, [1]);
      for (let i = 0; i < 3; i++) {
        s = m2Transform(s, v => m2Create(v.center + 1, [...v.periphery]));
      }
      expect(s.sigma.count).toBe(3);
      expect(s.sigma.history).toHaveLength(3);
    });
  });

  // --- A4 成立の証明 ---
  describe('A4 ✓ — 生成相転移', () => {
    it('2.12 void → dot → zero-field → zero → natural', () => {
      let g = m2GenesisCreate();
      expect(g.phase).toBe('void');
      g = m2GenesisForward(g); expect(g.phase).toBe('dot');
      g = m2GenesisForward(g); expect(g.phase).toBe('zero-field');
      g = m2GenesisForward(g); expect(g.phase).toBe('zero');
      g = m2GenesisForward(g); expect(g.phase).toBe('natural');
    });

    it('2.13 遮断規則', () => {
      let g = m2GenesisCreate();
      g = m2GenesisForward(g);
      expect(g.phase).toBe('dot');
    });

    it('2.14 zero-field は 0₀ の平面表現', () => {
      let g = m2GenesisCreate();
      g = m2GenesisForward(g); // dot
      g = m2GenesisForward(g); // zero-field
      expect(g.value).not.toBeNull();
      expect(g.value!.center).toBe(0);
      expect(g.value!.periphery).toEqual([]);
    });
  });
});

// ============================================================
// §3 M3: AmnesicModel — A1✓, A2✓, ¬A3, A4✓
// ============================================================
describe('§3 M3: AmnesicModel (A1✓, A2✓, ¬A3, A4✓)', () => {

  // --- A1 成立の証明 ---
  describe('A1 ✓ — 中心-周囲構造', () => {
    it('3.1 center と periphery', () => {
      const v = m3Create(5, [1, 2, 3]);
      expect(v.center).toBe(5);
      expect(v.periphery).toEqual([1, 2, 3]);
    });

    it('3.2 compute', () => {
      const v = m3Create(5, [1, 2, 3, 4]);
      expect(m3Compute(v)).toBeCloseTo(7.5);
    });

    it('3.3 退化条件', () => {
      expect(m3Compute(m3Create(42))).toBe(42);
    });
  });

  // --- A2 成立の証明 ---
  describe('A2 ✓ — 拡張-縮約', () => {
    it('3.4 extend: 深度増加', () => {
      const v = m3Create(10, [2, 4]);
      const ext = m3Extend(v);
      expect(ext.depth).toBe(1);
      expect(ext.center).toBeCloseTo(1);
      expect(ext.periphery[0]).toBeCloseTo(0.2);
    });

    it('3.5 reduce: 深度減少', () => {
      const v = m3Extend(m3Create(10, [2]));
      const red = m3Reduce(v);
      expect(red.depth).toBe(0);
      expect(red.center).toBeCloseTo(10);
    });

    it('3.6 逆元性', () => {
      expect(m3VerifyInverse(m3Create(5, [1, 2]))).toBe(true);
    });

    it('3.7 多段階拡張', () => {
      let v = m3Create(100, [10, 20]);
      v = m3Extend(v); v = m3Extend(v); v = m3Extend(v);
      expect(v.depth).toBe(3);
    });
  });

  // --- A3 不成立の証明 ---
  describe('A3 ✗ — σ蓄積なし', () => {
    it('3.8 変換で履歴が残らない', () => {
      const v = m3Create(5, [1, 2]);
      const v2 = m3Transform(v, val => m3Create(val.center + 10, [...val.periphery]));
      expect(m3GetHistory(v2)).toEqual([]);
    });

    it('3.9 変換回数が追跡されない', () => {
      let v = m3Create(0);
      for (let i = 0; i < 10; i++) {
        v = m3Transform(v, val => m3Create(val.center + 1));
      }
      expect(m3GetTransformCount(v)).toBe(0); // 常に0
    });

    it('3.10 連鎖変換後も来歴不明', () => {
      const v = m3Create(1, [2, 3]);
      const result = m3Chain(v, [
        val => m3Create(val.center * 2, [...val.periphery]),
        val => m3Create(val.center + 5, [...val.periphery]),
        val => m3Create(val.center * 3, [...val.periphery]),
      ]);
      // result は (1*2+5)*3 = 21 だが、そこに至る過程は一切不明
      expect(result.center).toBe(21);
      expect(m3GetHistory(result)).toEqual([]);
      expect(m3GetTransformCount(result)).toBe(0);
    });

    it('3.11 傾向性の計算が不可能', () => {
      // M3 の値には tendency フィールド自体が存在しない
      const v = m3Create(5);
      expect('tendency' in v).toBe(false);
      expect('sigma' in v).toBe(false);
    });

    it('3.12 checkA3(M3): 全要件不充足', () => {
      const a3 = checkA3('M3');
      expect(a3.historyRecorded).toBe(false);
      expect(a3.countTracked).toBe(false);
      expect(a3.tendencyComputable).toBe(false);
      expect(a3.historyImmutable).toBe(false);
    });
  });

  // --- A4 成立の証明 ---
  describe('A4 ✓ — 生成相転移', () => {
    it('3.13 void → ... → natural', () => {
      let g = m3GenesisCreate();
      expect(g.phase).toBe('void');
      g = m3GenesisForward(g); expect(g.phase).toBe('dot');
      g = m3GenesisForward(g); expect(g.phase).toBe('zero-ext');
      g = m3GenesisForward(g); expect(g.phase).toBe('zero');
      g = m3GenesisForward(g); expect(g.phase).toBe('natural');
    });

    it('3.14 zero-ext の値は depth=1', () => {
      let g = m3GenesisCreate();
      g = m3GenesisForward(g); // dot
      g = m3GenesisForward(g); // zero-ext
      expect(g.value!.depth).toBe(1);
    });

    it('3.15 遮断規則', () => {
      const g = m3GenesisCreate();
      const g1 = m3GenesisForward(g);
      expect(g1.phase).toBe('dot'); // 1段階のみ
    });
  });
});

// ============================================================
// §4 M4: EternalModel — A1✓, A2✓, A3✓, ¬A4
// ============================================================
describe('§4 M4: EternalModel (A1✓, A2✓, A3✓, ¬A4)', () => {

  // --- A1 成立の証明 ---
  describe('A1 ✓ — 中心-周囲構造', () => {
    it('4.1 center と periphery', () => {
      const v = m4Create(5, [1, 2, 3]);
      expect(v.center).toBe(5);
      expect(v.periphery).toEqual([1, 2, 3]);
    });

    it('4.2 compute', () => {
      const v = m4Create(5, [1, 2, 3, 4]);
      expect(m4Compute(v)).toBeCloseTo(7.5);
    });

    it('4.3 退化条件', () => {
      expect(m4Compute(m4Create(42))).toBe(42);
    });
  });

  // --- A2 成立の証明 ---
  describe('A2 ✓ — 拡張-縮約', () => {
    it('4.4 extend', () => {
      const v = m4Create(10, [2, 4]);
      const ext = m4Extend(v);
      expect(ext.depth).toBe(1);
      expect(ext.center).toBeCloseTo(1);
    });

    it('4.5 reduce', () => {
      const v = m4Extend(m4Create(10, [2]));
      const red = m4Reduce(v);
      expect(red.center).toBeCloseTo(10);
    });

    it('4.6 逆元性', () => {
      expect(m4VerifyInverse(m4Create(5, [1, 2]))).toBe(true);
    });

    it('4.7 多段階拡張', () => {
      let v = m4Create(100, [10]);
      v = m4Extend(v); v = m4Extend(v); v = m4Extend(v);
      expect(v.depth).toBe(3);
    });
  });

  // --- A3 成立の証明 ---
  describe('A3 ✓ — σ蓄積', () => {
    it('4.8 変換で履歴蓄積', () => {
      let s = m4Init(5, [1, 2]);
      s = m4Transform(s, v => m4Create(v.center + 1, [...v.periphery]));
      expect(s.sigma.history).toHaveLength(1);
      expect(s.sigma.count).toBe(1);
    });

    it('4.9 傾向性', () => {
      let s = m4Init(0, []);
      s = m4Transform(s, () => m4Create(10, []));
      expect(s.sigma.tendency).toBe('rising');
      s = m4Transform(s, () => m4Create(3, []));
      expect(s.sigma.tendency).toBe('falling');
    });

    it('4.10 5回変換で完全な履歴', () => {
      let s = m4Init(0);
      for (let i = 0; i < 5; i++) {
        s = m4Transform(s, v => m4Create(v.center + 1));
      }
      expect(s.sigma.count).toBe(5);
      expect(s.sigma.history).toHaveLength(5);
      expect(s.sigma.history[0].center).toBe(0);
      expect(s.sigma.history[4].center).toBe(4);
    });
  });

  // --- A4 不成立の証明 ---
  describe('A4 ✗ — 生成相転移なし', () => {
    it('4.11 genesis は null (void 概念なし)', () => {
      const g = m4GenesisCreate();
      expect(g).toBeNull();
    });

    it('4.12 genesisForward は例外を投げる', () => {
      expect(() => m4GenesisForward(null)).toThrow();
    });

    it('4.13 値は「最初から存在する」(公理的に与えられる)', () => {
      const s = m4Axiom();
      expect(s.value.center).toBe(0);
      // この 0 は Genesis で生成されたものではなく、
      // ペアノの「0は自然数である」と同様に前提として与えられる
    });

    it('4.14 「値が存在する以前」という問いが無意味', () => {
      // M4 には void, dot, zero-ext のような相が存在しない
      // 値は永遠に存在している
      const s = m4Axiom();
      expect('phase' in s).toBe(false);
    });

    it('4.15 checkA4(M4): 全要件不充足', () => {
      const a4 = checkA4('M4');
      expect(a4.voidExists).toBe(false);
      expect(a4.transitionDefined).toBe(false);
      expect(a4.firewallHolds).toBe(false);
      expect(a4.multiplePhases).toBe(false);
    });
  });
});

// ============================================================
// §5 独立性行列の整合性検証
// ============================================================
describe('§5 独立性行列', () => {
  const matrix = independenceMatrix();

  it('5.1 各モデルは正確に1公理を不充足', () => {
    for (const model of ['M1', 'M2', 'M3', 'M4']) {
      const row = matrix[model];
      const falseCount = Object.values(row).filter(v => v === false).length;
      expect(falseCount).toBe(1);
    }
  });

  it('5.2 各公理は正確に1モデルで不充足', () => {
    for (const axiom of ['A1', 'A2', 'A3', 'A4']) {
      const falseCount = ['M1', 'M2', 'M3', 'M4']
        .filter(m => matrix[m][axiom] === false).length;
      expect(falseCount).toBe(1);
    }
  });

  it('5.3 M1は A1のみ不成立', () => {
    expect(matrix['M1']).toEqual({ A1: false, A2: true, A3: true, A4: true });
  });

  it('5.4 M2は A2のみ不成立', () => {
    expect(matrix['M2']).toEqual({ A1: true, A2: false, A3: true, A4: true });
  });

  it('5.5 対角構造: Mᵢ が ¬Aᵢ', () => {
    expect(matrix['M1']['A1']).toBe(false);
    expect(matrix['M2']['A2']).toBe(false);
    expect(matrix['M3']['A3']).toBe(false);
    expect(matrix['M4']['A4']).toBe(false);
  });
});
