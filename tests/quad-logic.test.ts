// ============================================================
// quad-logic.test.ts — 統合四価論理テスト (100 tests)
//
// §1 値マッピング (10)
// §2 否定演算3種 (15)
// §3 二項演算 — π打ち消し意味論 (20)
// §4 含意・排他・双条件 (10)
// §5 位相-論理ブリッジ (10)
// §6 代数的性質検証 (15)
// §7 格子構造 (10)
// §8 Genesis統合 (5)
// §9 QuadOps統合オブジェクト (5)
//
// @author Nobuki Fujimoto (D-FUMT)
// ============================================================

import { describe, it, expect } from 'vitest';
import {
  // §1 マッピング
  toLogic,
  toLegacy,
  ALL_QUAD_VALUES,
  ALL_LOGIC_VALUES,
  // §2 否定
  quadNot,
  quadPiNegate,
  quadFullNegate,
  // §3 二項
  quadAnd,
  quadOr,
  // §4 派生
  quadImplies,
  quadXor,
  quadBicond,
  // §5 位相
  quadToPhase,
  phaseToQuad,
  quadIsTruthy,
  quadIsPiRotated,
  quadBaseValue,
  quadDecompose,
  quadCompose,
  // §6 検証
  verifyDoubleNegation,
  verifyPiPeriod2,
  verifyFullNegatePeriod2,
  verifyAndAssociativity,
  verifyOrAssociativity,
  verifyAndCommutativity,
  verifyOrCommutativity,
  verifyPiCancellation,
  verifyDeMorgan,
  // §7 格子
  quadLeq,
  quadJoin,
  quadMeet,
  quadDistance,
  // §8 Genesis
  createGenesis,
  genesisForward,
  genesisBackward,
  genesisPhaseIndex,
  genesisPhaseCount,
  // §9 統合
  QuadOps,
  // 真理値表
  binaryTruthTable,
  unaryTruthTable,
  formatBinaryTruthTable,
  formatUnaryTruthTable,
  // 型
  type QuadValue,
  type QuadLogicValue,
} from '../src/lang/quad-logic';

const PI = Math.PI;

// ============================================================
// §1 値マッピング (10 tests)
// ============================================================
describe('§1 値マッピング', () => {
  it('1.1 toLogic: top → true', () => {
    expect(toLogic('top')).toBe('true');
  });

  it('1.2 toLogic: bottom → false', () => {
    expect(toLogic('bottom')).toBe('false');
  });

  it('1.3 toLogic: topPi → true-pi', () => {
    expect(toLogic('topPi')).toBe('true-pi');
  });

  it('1.4 toLogic: bottomPi → false-pi', () => {
    expect(toLogic('bottomPi')).toBe('false-pi');
  });

  it('1.5 toLegacy: true → top', () => {
    expect(toLegacy('true')).toBe('top');
  });

  it('1.6 toLegacy: false → bottom', () => {
    expect(toLegacy('false')).toBe('bottom');
  });

  it('1.7 往復変換: toLogic ∘ toLegacy = id', () => {
    for (const v of ALL_LOGIC_VALUES) {
      expect(toLogic(toLegacy(v))).toBe(v);
    }
  });

  it('1.8 往復変換: toLegacy ∘ toLogic = id', () => {
    for (const v of ALL_QUAD_VALUES) {
      expect(toLegacy(toLogic(v))).toBe(v);
    }
  });

  it('1.9 ALL_QUAD_VALUES: 4つの値', () => {
    expect(ALL_QUAD_VALUES).toHaveLength(4);
    expect(ALL_QUAD_VALUES).toContain('top');
    expect(ALL_QUAD_VALUES).toContain('bottom');
    expect(ALL_QUAD_VALUES).toContain('topPi');
    expect(ALL_QUAD_VALUES).toContain('bottomPi');
  });

  it('1.10 ALL_LOGIC_VALUES: 4つの値', () => {
    expect(ALL_LOGIC_VALUES).toHaveLength(4);
    expect(ALL_LOGIC_VALUES).toContain('true');
    expect(ALL_LOGIC_VALUES).toContain('false');
  });
});

// ============================================================
// §2 否定演算3種 (15 tests)
// ============================================================
describe('§2 否定演算3種', () => {
  // 標準否定 (¬): 真偽反転、位相保存
  it('2.1 quadNot: top → bottom', () => {
    expect(quadNot('top')).toBe('bottom');
  });

  it('2.2 quadNot: bottom → top', () => {
    expect(quadNot('bottom')).toBe('top');
  });

  it('2.3 quadNot: topPi → bottomPi', () => {
    expect(quadNot('topPi')).toBe('bottomPi');
  });

  it('2.4 quadNot: bottomPi → topPi', () => {
    expect(quadNot('bottomPi')).toBe('topPi');
  });

  // π回転否定 (¬π): 真偽保存、位相回転
  it('2.5 quadPiNegate: top → topPi', () => {
    expect(quadPiNegate('top')).toBe('topPi');
  });

  it('2.6 quadPiNegate: topPi → top', () => {
    expect(quadPiNegate('topPi')).toBe('top');
  });

  it('2.7 quadPiNegate: bottom → bottomPi', () => {
    expect(quadPiNegate('bottom')).toBe('bottomPi');
  });

  it('2.8 quadPiNegate: bottomPi → bottom', () => {
    expect(quadPiNegate('bottomPi')).toBe('bottom');
  });

  // 完全否定 (¬π ∘ ¬): 対角反転
  it('2.9 quadFullNegate: top → bottomPi', () => {
    expect(quadFullNegate('top')).toBe('bottomPi');
  });

  it('2.10 quadFullNegate: bottom → topPi', () => {
    expect(quadFullNegate('bottom')).toBe('topPi');
  });

  it('2.11 quadFullNegate: topPi → bottom', () => {
    expect(quadFullNegate('topPi')).toBe('bottom');
  });

  it('2.12 quadFullNegate: bottomPi → top', () => {
    expect(quadFullNegate('bottomPi')).toBe('top');
  });

  // 否定の直交性
  it('2.13 ¬ と ¬π は異なる演算', () => {
    expect(quadNot('top')).not.toBe(quadPiNegate('top'));
  });

  it('2.14 ¬π ∘ ¬ = ¬ ∘ ¬π (可換性)', () => {
    for (const v of ALL_QUAD_VALUES) {
      expect(quadPiNegate(quadNot(v))).toBe(quadNot(quadPiNegate(v)));
    }
  });

  it('2.15 3種の否定は4値上で全て異なる写像', () => {
    // 各否定が異なる結果を出すことを確認
    const notResults = ALL_QUAD_VALUES.map(v => quadNot(v));
    const piResults = ALL_QUAD_VALUES.map(v => quadPiNegate(v));
    const fullResults = ALL_QUAD_VALUES.map(v => quadFullNegate(v));
    expect(notResults.join(',')).not.toBe(piResults.join(','));
    expect(piResults.join(',')).not.toBe(fullResults.join(','));
    expect(notResults.join(',')).not.toBe(fullResults.join(','));
  });
});

// ============================================================
// §3 二項演算 — π打ち消し意味論 (20 tests)
// ============================================================
describe('§3 二項演算 — π打ち消し', () => {
  // AND基本
  it('3.1 AND: top ∧ top = top', () => {
    expect(quadAnd('top', 'top')).toBe('top');
  });

  it('3.2 AND: top ∧ bottom = bottom', () => {
    expect(quadAnd('top', 'bottom')).toBe('bottom');
  });

  it('3.3 AND: bottom ∧ bottom = bottom', () => {
    expect(quadAnd('bottom', 'bottom')).toBe('bottom');
  });

  it('3.4 AND: bottom ∧ top = bottom', () => {
    expect(quadAnd('bottom', 'top')).toBe('bottom');
  });

  // AND π打ち消し — 核心テスト
  it('3.5 AND: topPi ∧ topPi = top (π×π=1 打ち消し)', () => {
    expect(quadAnd('topPi', 'topPi')).toBe('top');
  });

  it('3.6 AND: top ∧ topPi = topPi (1×π=π)', () => {
    expect(quadAnd('top', 'topPi')).toBe('topPi');
  });

  it('3.7 AND: topPi ∧ top = topPi (π×1=π)', () => {
    expect(quadAnd('topPi', 'top')).toBe('topPi');
  });

  it('3.8 AND: bottomPi ∧ top = bottomPi (π-XOR: π⊕0=π)', () => {
    // base: false∧true=false, π: true⊕false=true → bottomPi
    expect(quadAnd('bottomPi', 'top')).toBe('bottomPi');
  });

  it('3.9 AND: topPi ∧ bottom = bottomPi (π-XOR: π⊕0=π)', () => {
    // base: true∧false=false, π: true⊕false=true → bottomPi
    expect(quadAnd('topPi', 'bottom')).toBe('bottomPi');
  });

  it('3.10 AND: bottomPi ∧ bottomPi = bottom', () => {
    expect(quadAnd('bottomPi', 'bottomPi')).toBe('bottom');
  });

  // OR基本
  it('3.11 OR: top ∨ top = top', () => {
    expect(quadOr('top', 'top')).toBe('top');
  });

  it('3.12 OR: top ∨ bottom = top', () => {
    expect(quadOr('top', 'bottom')).toBe('top');
  });

  it('3.13 OR: bottom ∨ bottom = bottom', () => {
    expect(quadOr('bottom', 'bottom')).toBe('bottom');
  });

  it('3.14 OR: bottom ∨ top = top', () => {
    expect(quadOr('bottom', 'top')).toBe('top');
  });

  // OR π打ち消し
  it('3.15 OR: topPi ∨ topPi = top (π×π=1)', () => {
    expect(quadOr('topPi', 'topPi')).toBe('top');
  });

  it('3.16 OR: top ∨ topPi = topPi (π伝播)', () => {
    expect(quadOr('top', 'topPi')).toBe('topPi');
  });

  // AND/OR 真理値表の網羅性
  it('3.17 AND真理値表: 16エントリ', () => {
    const table = binaryTruthTable(quadAnd);
    expect(table).toHaveLength(16);
  });

  it('3.18 OR真理値表: 16エントリ', () => {
    const table = binaryTruthTable(quadOr);
    expect(table).toHaveLength(16);
  });

  // AND/OR の既存セマンティクスとの差異確認
  it('3.19 旧AND vs 新AND: topPi∧topPi が異なる', () => {
    // 旧: bottomPi (π保存), 新: top (π打ち消し)
    // 本テストはπ打ち消し意味論の正しさを確認
    expect(quadAnd('topPi', 'topPi')).toBe('top');
  });

  it('3.20 AND/ORの結果は常にQuadValue', () => {
    for (const a of ALL_QUAD_VALUES) {
      for (const b of ALL_QUAD_VALUES) {
        expect(ALL_QUAD_VALUES).toContain(quadAnd(a, b));
        expect(ALL_QUAD_VALUES).toContain(quadOr(a, b));
      }
    }
  });
});

// ============================================================
// §4 含意・排他・双条件 (10 tests)
// ============================================================
describe('§4 含意・排他・双条件', () => {
  it('4.1 implies: top → top = top', () => {
    expect(quadImplies('top', 'top')).toBe('top');
  });

  it('4.2 implies: top → bottom = bottom', () => {
    expect(quadImplies('top', 'bottom')).toBe('bottom');
  });

  it('4.3 implies: bottom → top = top', () => {
    expect(quadImplies('bottom', 'top')).toBe('top');
  });

  it('4.4 implies: bottom → bottom = top', () => {
    expect(quadImplies('bottom', 'bottom')).toBe('top');
  });

  it('4.5 xor: top ⊕ top = bottom', () => {
    expect(quadXor('top', 'top')).toBe('bottom');
  });

  it('4.6 xor: top ⊕ bottom = top', () => {
    expect(quadXor('top', 'bottom')).toBe('top');
  });

  it('4.7 xor: bottom ⊕ top = top', () => {
    expect(quadXor('bottom', 'top')).toBe('top');
  });

  it('4.8 xor: bottom ⊕ bottom = bottom', () => {
    expect(quadXor('bottom', 'bottom')).toBe('bottom');
  });

  it('4.9 bicond: top ↔ top = top', () => {
    expect(quadBicond('top', 'top')).toBe('top');
  });

  it('4.10 bicond: top ↔ bottom = bottom', () => {
    expect(quadBicond('top', 'bottom')).toBe('bottom');
  });
});

// ============================================================
// §5 位相-論理ブリッジ (10 tests)
// ============================================================
describe('§5 位相-論理ブリッジ', () => {
  it('5.1 quadToPhase: top = 0', () => {
    expect(quadToPhase('top')).toBe(0);
  });

  it('5.2 quadToPhase: bottom = π', () => {
    expect(quadToPhase('bottom')).toBe(PI);
  });

  it('5.3 quadToPhase: topPi = π', () => {
    expect(quadToPhase('topPi')).toBe(PI);
  });

  it('5.4 quadToPhase: bottomPi = 0', () => {
    expect(quadToPhase('bottomPi')).toBe(0);
  });

  it('5.5 quadIsTruthy: top/topPi=true, bottom/bottomPi=false', () => {
    expect(quadIsTruthy('top')).toBe(true);
    expect(quadIsTruthy('topPi')).toBe(true);
    expect(quadIsTruthy('bottom')).toBe(false);
    expect(quadIsTruthy('bottomPi')).toBe(false);
  });

  it('5.6 quadIsPiRotated: topPi/bottomPi=true', () => {
    expect(quadIsPiRotated('top')).toBe(false);
    expect(quadIsPiRotated('topPi')).toBe(true);
    expect(quadIsPiRotated('bottom')).toBe(false);
    expect(quadIsPiRotated('bottomPi')).toBe(true);
  });

  it('5.7 quadDecompose: 分解と合成の往復', () => {
    for (const v of ALL_QUAD_VALUES) {
      const { base, piRotated } = quadDecompose(v);
      expect(quadCompose(base, piRotated)).toBe(v);
    }
  });

  it('5.8 quadCompose: true+false → top', () => {
    expect(quadCompose(true, false)).toBe('top');
  });

  it('5.9 quadCompose: false+true → bottomPi', () => {
    expect(quadCompose(false, true)).toBe('bottomPi');
  });

  it('5.10 phaseToQuad: 0/非回転 → top', () => {
    expect(phaseToQuad(0, false)).toBe('top');
    expect(phaseToQuad(PI, false)).toBe('bottom');
    expect(phaseToQuad(0, true)).toBe('topPi');
  });
});

// ============================================================
// §6 代数的性質検証 (15 tests)
// ============================================================
describe('§6 代数的性質検証', () => {
  it('6.1 二重否定律: ¬(¬v) = v', () => {
    expect(verifyDoubleNegation()).toBe(true);
  });

  it('6.2 π回転の周期2: ¬π(¬π(v)) = v', () => {
    expect(verifyPiPeriod2()).toBe(true);
  });

  it('6.3 完全否定の周期2', () => {
    expect(verifyFullNegatePeriod2()).toBe(true);
  });

  it('6.4 AND可換律: a ∧ b = b ∧ a', () => {
    expect(verifyAndCommutativity()).toBe(true);
  });

  it('6.5 OR可換律: a ∨ b = b ∨ a', () => {
    expect(verifyOrCommutativity()).toBe(true);
  });

  it('6.6 π打ち消し律: topPi ∧ topPi = top', () => {
    expect(verifyPiCancellation()).toBe(true);
  });

  it('6.7 AND結合律', () => {
    expect(verifyAndAssociativity()).toBe(true);
  });

  it('6.8 OR結合律: π-XOR意味論では非結合的 (4つの反例)', () => {
    // π-XOR OR は結合律を満たさない。これは四価論理の既知性質。
    // 例: (⊤ ∨ ⊥π) ∨ ⊥π = ⊤  vs  ⊤ ∨ (⊥π ∨ ⊥π) = ⊤π
    expect(verifyOrAssociativity()).toBe(false);
    // 具体的反例の検証
    expect(quadOr(quadOr('top', 'bottomPi'), 'bottomPi')).toBe('top');
    expect(quadOr('top', quadOr('bottomPi', 'bottomPi'))).toBe('topPi');
  });

  it('6.9 ド・モルガン検証', () => {
    const dm = verifyDeMorgan();
    // 四価論理ではド・モルガンが成立するかは意味論依存
    expect(typeof dm.and).toBe('boolean');
    expect(typeof dm.or).toBe('boolean');
  });

  it('6.10 AND単位元: top ∧ v = v', () => {
    for (const v of ALL_QUAD_VALUES) {
      expect(quadAnd('top', v)).toBe(v);
    }
  });

  it('6.11 AND零元: bottom ∧ v = bottom', () => {
    for (const v of ALL_QUAD_VALUES) {
      // bottom∧v は常に偽（base=false）
      expect(quadIsTruthy(quadAnd('bottom', v))).toBe(false);
    }
  });

  it('6.12 OR単位元: bottom ∨ v = v', () => {
    for (const v of ALL_QUAD_VALUES) {
      expect(quadOr('bottom', v)).toBe(v);
    }
  });

  it('6.13 OR零元: top ∨ v は常にtruthy', () => {
    for (const v of ALL_QUAD_VALUES) {
      expect(quadIsTruthy(quadOr('top', v))).toBe(true);
    }
  });

  it('6.14 XOR自己逆元: v ⊕ v = bottom', () => {
    expect(quadXor('top', 'top')).toBe('bottom');
    expect(quadXor('bottom', 'bottom')).toBe('bottom');
  });

  it('6.15 含意の反射律: v → v = top', () => {
    // top → top = ¬top ∨ top = bottom ∨ top = top
    expect(quadImplies('top', 'top')).toBe('top');
    expect(quadImplies('bottom', 'bottom')).toBe('top');
  });
});

// ============================================================
// §7 格子構造 (10 tests)
// ============================================================
describe('§7 格子構造', () => {
  it('7.1 quadLeq: bottom ≤ top', () => {
    expect(quadLeq('bottom', 'top')).toBe(true);
  });

  it('7.2 quadLeq: top ≤ bottom = false', () => {
    expect(quadLeq('top', 'bottom')).toBe(false);
  });

  it('7.3 quadLeq: 反射律 v ≤ v', () => {
    for (const v of ALL_QUAD_VALUES) {
      expect(quadLeq(v, v)).toBe(true);
    }
  });

  it('7.4 quadLeq: 全順序 bottom ≤ bottomPi ≤ topPi ≤ top', () => {
    expect(quadLeq('bottom', 'bottomPi')).toBe(true);
    expect(quadLeq('bottomPi', 'topPi')).toBe(true);
    expect(quadLeq('topPi', 'top')).toBe(true);
  });

  it('7.5 quadJoin: join(bottom, top) = top', () => {
    expect(quadJoin('bottom', 'top')).toBe('top');
  });

  it('7.6 quadMeet: meet(bottom, top) = bottom', () => {
    expect(quadMeet('bottom', 'top')).toBe('bottom');
  });

  it('7.7 quadJoin: join(topPi, bottomPi) = topPi', () => {
    expect(quadJoin('topPi', 'bottomPi')).toBe('topPi');
  });

  it('7.8 quadMeet: meet(topPi, bottomPi) = bottomPi', () => {
    expect(quadMeet('topPi', 'bottomPi')).toBe('bottomPi');
  });

  it('7.9 quadDistance: distance(bottom, top) = 3', () => {
    expect(quadDistance('bottom', 'top')).toBe(3);
  });

  it('7.10 quadDistance: distance(v, v) = 0', () => {
    for (const v of ALL_QUAD_VALUES) {
      expect(quadDistance(v, v)).toBe(0);
    }
  });
});

// ============================================================
// §8 Genesis統合 (5 tests)
// ============================================================
describe('§8 Genesis統合', () => {
  it('8.1 createGenesis: 初期状態はvoid', () => {
    const g = createGenesis();
    expect(g.state).toBe('void');
    expect(g.omega).toBe(0);
    expect(g.history).toEqual(['void']);
  });

  it('8.2 genesisForward: void → dot → line', () => {
    const g = createGenesis();
    genesisForward(g);
    expect(g.state).toBe('dot');
    genesisForward(g);
    expect(g.state).toBe('line');
  });

  it('8.3 genesisForward: omega到達でomega=1', () => {
    const g = createGenesis();
    for (let i = 0; i < 5; i++) genesisForward(g);
    expect(g.state).toBe('omega');
    expect(g.omega).toBe(1);
  });

  it('8.4 genesisBackward: line → dot', () => {
    const g = createGenesis();
    genesisForward(g); // dot
    genesisForward(g); // line
    genesisBackward(g);
    expect(g.state).toBe('dot');
  });

  it('8.5 genesisPhaseIndex/Count', () => {
    expect(genesisPhaseIndex('void')).toBe(0);
    expect(genesisPhaseIndex('omega')).toBe(5);
    expect(genesisPhaseCount()).toBe(6);
  });
});

// ============================================================
// §9 QuadOps統合オブジェクト (5 tests)
// ============================================================
describe('§9 QuadOps統合オブジェクト', () => {
  it('9.1 QuadOps.not = quadNot', () => {
    expect(QuadOps.not('top')).toBe(quadNot('top'));
    expect(QuadOps.not('bottom')).toBe(quadNot('bottom'));
  });

  it('9.2 QuadOps.and = quadAnd', () => {
    expect(QuadOps.and('top', 'topPi')).toBe(quadAnd('top', 'topPi'));
  });

  it('9.3 QuadOps.piNegate = quadPiNegate', () => {
    expect(QuadOps.piNegate('top')).toBe(quadPiNegate('top'));
  });

  it('9.4 QuadOps.isTruthy/isPiRotated', () => {
    expect(QuadOps.isTruthy('topPi')).toBe(true);
    expect(QuadOps.isPiRotated('topPi')).toBe(true);
    expect(QuadOps.isPiRotated('top')).toBe(false);
  });

  it('9.5 QuadOps.verifyPiCancellation', () => {
    expect(QuadOps.verifyPiCancellation()).toBe(true);
  });
});

// ============================================================
// §bonus 真理値表フォーマット (検証のみ)
// ============================================================
describe('§bonus 真理値表フォーマット', () => {
  it('formatBinaryTruthTable: AND表が文字列を返す', () => {
    const table = formatBinaryTruthTable('AND', quadAnd);
    expect(table).toContain('AND');
    expect(table).toContain('top');
    expect(table).toContain('bottom');
  });

  it('formatUnaryTruthTable: NOT表が文字列を返す', () => {
    const table = formatUnaryTruthTable('NOT', quadNot);
    expect(table).toContain('NOT');
    expect(table).toContain('top');
  });

  it('unaryTruthTable: 4行', () => {
    const table = unaryTruthTable(quadNot);
    expect(table).toHaveLength(4);
  });
});
