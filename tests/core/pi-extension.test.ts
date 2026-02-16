// ============================================================
// pi-extension.test.ts — π拡張理論テスト (100 tests)
//
// §1 コンストラクタとパース (15)
// §2 ⊕拡張 / ⊖縮約 (15)
// §3 位相計算4モード (15)
// §4 記法同値公理 (15)
// §5 四価論理 (15)
// §6 ゼロ拡張との統合 (10)
// §7 σ蓄積連携 (10)
// §8 レポートと分析 (5)
//
// @author Nobuki Fujimoto (D-FUMT)
// ============================================================

import { describe, it, expect } from 'vitest';
import {
  PI, PHI, TAU,
  piSubscript,
  piExtnum,
  parsePiSubscript,
  piExtend,
  piReduce,
  piExtendTo,
  piReduceTo,
  verifyInverse,
  computePhase,
  normalizePhase,
  phaseToDegrees,
  phaseDifference,
  piRotate,
  piReflect,
  piToNotation,
  notationEquivalent,
  quadValue,
  piNegate,
  standardNegate,
  quadAnd,
  quadOr,
  quadToPhase,
  allQuadValues,
  composeA2,
  verifyA2Commutativity,
  emptyPiSigma,
  piExtendWithSigma,
  piReduceWithSigma,
  piRotateWithSigma,
  summarizePi,
  compareRotationModes,
  generatePiReport,
} from '../../src/lang/core/pi-extension';

// ============================================================
// §1 コンストラクタとパース (15 tests)
// ============================================================
describe('§1 コンストラクタとパース', () => {
  it('1.1 piSubscript: 空の添字', () => {
    const sub = piSubscript();
    expect(sub.base).toBe('pi');
    expect(sub.chars).toHaveLength(0);
  });

  it('1.2 piSubscript: ooo', () => {
    const sub = piSubscript(['o', 'o', 'o']);
    expect(sub.chars).toEqual(['o', 'o', 'o']);
  });

  it('1.3 piSubscript: 混合文字', () => {
    const sub = piSubscript(['o', 'x', 'o']);
    expect(sub.chars).toEqual(['o', 'x', 'o']);
  });

  it('1.4 piExtnum: 基本生成', () => {
    const pn = piExtnum(piSubscript(['o', 'o']));
    expect(pn.degree).toBe(2);
    expect(pn.mode).toBe('standard');
  });

  it('1.5 piExtnum: degree=0', () => {
    const pn = piExtnum(piSubscript());
    expect(pn.degree).toBe(0);
    expect(pn.phase).toBe(0);
  });

  it('1.6 piExtnum: 回転モード指定', () => {
    const pn = piExtnum(piSubscript(['o']), 'golden');
    expect(pn.mode).toBe('golden');
  });

  it('1.7 parsePiSubscript: 感覚層 πooo', () => {
    const sub = parsePiSubscript('πooo');
    expect(sub).not.toBeNull();
    expect(sub!.chars).toEqual(['o', 'o', 'o']);
  });

  it('1.8 parsePiSubscript: 対話層 π_o3', () => {
    const sub = parsePiSubscript('π_o3');
    expect(sub).not.toBeNull();
    expect(sub!.chars).toHaveLength(3);
    expect(sub!.chars.every(c => c === 'o')).toBe(true);
  });

  it('1.9 parsePiSubscript: 構造層 π(o,3)', () => {
    const sub = parsePiSubscript('π(o,3)');
    expect(sub).not.toBeNull();
    expect(sub!.chars).toHaveLength(3);
  });

  it('1.10 parsePiSubscript: 複合構造 π(o,2,x,3)', () => {
    const sub = parsePiSubscript('π(o,2,x,3)');
    expect(sub).not.toBeNull();
    expect(sub!.chars).toHaveLength(5);
  });

  it('1.11 parsePiSubscript: 無効な入力', () => {
    expect(parsePiSubscript('abc')).toBeNull();
    expect(parsePiSubscript('0ooo')).toBeNull(); // ゼロ拡張、π拡張ではない
  });

  it('1.12 parsePiSubscript: 空π', () => {
    // πだけの場合は感覚層として処理されない（空文字マッチしない）
    const sub = parsePiSubscript('π');
    // 空文字列にマッチしないのでnull
    expect(sub).toBeNull();
  });

  it('1.13 piExtnum: immutable', () => {
    const sub = piSubscript(['o', 'o']);
    const pn = piExtnum(sub);
    // subscriptのcharsは変更不可
    expect(() => {
      (pn.subscript.chars as any).push('x');
    }).toThrow();
  });

  it('1.14 parsePiSubscript: 大文字Π', () => {
    const sub = parsePiSubscript('Πooo');
    expect(sub).not.toBeNull();
    expect(sub!.chars).toHaveLength(3);
  });

  it('1.15 piSubscript: 多様な文字', () => {
    const sub = piSubscript(['z', 'x', 'w', 'o', 'e', 'n', 'e']);
    expect(sub.chars).toHaveLength(7);
    expect(sub.base).toBe('pi');
  });
});

// ============================================================
// §2 ⊕拡張 / ⊖縮約 (15 tests)
// ============================================================
describe('§2 ⊕拡張 / ⊖縮約', () => {
  it('2.1 piExtend: 次数が1増加', () => {
    const pn = piExtnum(piSubscript(['o']));
    const ext = piExtend(pn);
    expect(ext.degree).toBe(2);
  });

  it('2.2 piExtend: 指定文字で拡張', () => {
    const pn = piExtnum(piSubscript(['o']));
    const ext = piExtend(pn, 'x');
    expect(ext.subscript.chars).toEqual(['o', 'x']);
  });

  it('2.3 piReduce: 次数が1減少', () => {
    const pn = piExtnum(piSubscript(['o', 'o', 'o']));
    const red = piReduce(pn);
    expect(red.degree).toBe(2);
  });

  it('2.4 piReduce: degree=0では変化なし', () => {
    const pn = piExtnum(piSubscript());
    const red = piReduce(pn);
    expect(red.degree).toBe(0);
  });

  it('2.5 逆元性: ⊖(⊕(v, s)) = v', () => {
    const pn = piExtnum(piSubscript(['o', 'o']));
    expect(verifyInverse(pn, 'o')).toBe(true);
  });

  it('2.6 逆元性: 異なる文字でも成立', () => {
    const pn = piExtnum(piSubscript(['o', 'x']));
    expect(verifyInverse(pn, 'z')).toBe(true);
  });

  it('2.7 piExtendTo: 指定次数まで拡張', () => {
    const pn = piExtnum(piSubscript());
    const ext = piExtendTo(pn, 5);
    expect(ext.degree).toBe(5);
  });

  it('2.8 piReduceTo: 指定次数まで縮約', () => {
    const pn = piExtnum(piSubscript(['o', 'o', 'o', 'o', 'o']));
    const red = piReduceTo(pn, 2);
    expect(red.degree).toBe(2);
  });

  it('2.9 piExtendTo: 既に目標以上なら変化なし', () => {
    const pn = piExtnum(piSubscript(['o', 'o', 'o']));
    const ext = piExtendTo(pn, 2);
    expect(ext.degree).toBe(3);
  });

  it('2.10 連続拡張: 位相が段階的に増加 (standard)', () => {
    let pn = piExtnum(piSubscript());
    const phases: number[] = [pn.phase];
    for (let i = 0; i < 5; i++) {
      pn = piExtend(pn);
      phases.push(pn.phase);
    }
    for (let i = 1; i < phases.length; i++) {
      expect(phases[i]).toBeGreaterThan(phases[i - 1]);
    }
  });

  it('2.11 連続縮約: 位相が段階的に減少', () => {
    let pn = piExtnum(piSubscript(['o', 'o', 'o', 'o']));
    const phases: number[] = [pn.phase];
    for (let i = 0; i < 4; i++) {
      pn = piReduce(pn);
      phases.push(pn.phase);
    }
    for (let i = 1; i < phases.length; i++) {
      expect(phases[i]).toBeLessThan(phases[i - 1]);
    }
  });

  it('2.12 完全縮約: degree=0, phase=0', () => {
    let pn = piExtnum(piSubscript(['o', 'o', 'o']));
    pn = piReduceTo(pn, 0);
    expect(pn.degree).toBe(0);
    expect(pn.phase).toBe(0);
  });

  it('2.13 piExtend: モードが保持される', () => {
    const pn = piExtnum(piSubscript(['o']), 'harmonic');
    const ext = piExtend(pn, 'o');
    expect(ext.mode).toBe('harmonic');
  });

  it('2.14 大量拡張: degree=100', () => {
    const pn = piExtendTo(piExtnum(piSubscript()), 100);
    expect(pn.degree).toBe(100);
    expect(pn.phase).toBeGreaterThan(0);
  });

  it('2.15 拡張→縮約→拡張の往復', () => {
    let pn = piExtnum(piSubscript(['o']));
    pn = piExtend(pn, 'x');     // degree=2
    pn = piExtend(pn, 'o');     // degree=3
    pn = piReduce(pn);          // degree=2
    pn = piExtend(pn, 'z');     // degree=3
    expect(pn.degree).toBe(3);
    expect(pn.subscript.chars).toEqual(['o', 'x', 'z']);
  });
});

// ============================================================
// §3 位相計算4モード (15 tests)
// ============================================================
describe('§3 位相計算4モード', () => {
  it('3.1 standard: phase = π × degree', () => {
    expect(computePhase(1, 'standard')).toBeCloseTo(PI, 10);
    expect(computePhase(2, 'standard')).toBeCloseTo(2 * PI, 10);
    expect(computePhase(3, 'standard')).toBeCloseTo(3 * PI, 10);
  });

  it('3.2 fractional: phase = π / degree', () => {
    expect(computePhase(1, 'fractional')).toBeCloseTo(PI, 10);
    expect(computePhase(2, 'fractional')).toBeCloseTo(PI / 2, 10);
    expect(computePhase(4, 'fractional')).toBeCloseTo(PI / 4, 10);
  });

  it('3.3 harmonic: phase = π × H_n', () => {
    // H_1 = 1, H_2 = 1.5, H_3 = 1.833...
    expect(computePhase(1, 'harmonic')).toBeCloseTo(PI, 10);
    expect(computePhase(2, 'harmonic')).toBeCloseTo(PI * 1.5, 10);
  });

  it('3.4 golden: phase = π × φ^degree', () => {
    expect(computePhase(1, 'golden')).toBeCloseTo(PI * PHI, 10);
    expect(computePhase(2, 'golden')).toBeCloseTo(PI * PHI * PHI, 10);
  });

  it('3.5 degree=0: 全モードで phase=0', () => {
    expect(computePhase(0, 'standard')).toBe(0);
    expect(computePhase(0, 'fractional')).toBe(0);
    expect(computePhase(0, 'harmonic')).toBe(0);
    expect(computePhase(0, 'golden')).toBe(0);
  });

  it('3.6 normalizePhase: 0-2π範囲', () => {
    expect(normalizePhase(0)).toBeCloseTo(0, 10);
    expect(normalizePhase(PI)).toBeCloseTo(PI, 10);
    expect(normalizePhase(3 * PI)).toBeCloseTo(PI, 10);
    expect(normalizePhase(-PI)).toBeCloseTo(PI, 10);
  });

  it('3.7 phaseToDegrees: ラジアン→度', () => {
    expect(phaseToDegrees(PI)).toBeCloseTo(180, 10);
    expect(phaseToDegrees(PI / 2)).toBeCloseTo(90, 10);
    expect(phaseToDegrees(TAU)).toBeCloseTo(360, 10);
  });

  it('3.8 phaseDifference: 同一なら0', () => {
    const a = piExtnum(piSubscript(['o', 'o']));
    expect(phaseDifference(a, a)).toBeCloseTo(0, 10);
  });

  it('3.9 phaseDifference: πの差', () => {
    const a = piExtnum(piSubscript(['o']));       // π
    const b = piExtnum(piSubscript(['o', 'o']));  // 2π
    const diff = phaseDifference(a, b);
    expect(diff).toBeCloseTo(PI, 5);
  });

  it('3.10 piRotate: 位相がπ増加', () => {
    const pn = piExtnum(piSubscript(['o']));
    const rotated = piRotate(pn);
    expect(rotated.phase).toBeCloseTo(pn.phase + PI, 10);
  });

  it('3.11 piReflect: 位相が反転', () => {
    const pn = piExtnum(piSubscript(['o', 'o']));
    const reflected = piReflect(pn);
    expect(reflected.phase).toBeCloseTo(-pn.phase, 10);
  });

  it('3.12 piRotate二重: 位相が2π増加', () => {
    const pn = piExtnum(piSubscript(['o']));
    const r2 = piRotate(piRotate(pn));
    expect(normalizePhase(r2.phase)).toBeCloseTo(normalizePhase(pn.phase), 5);
  });

  it('3.13 fractionalモードは次数増加で収束', () => {
    const p5 = computePhase(5, 'fractional');
    const p10 = computePhase(10, 'fractional');
    const p100 = computePhase(100, 'fractional');
    expect(p5).toBeGreaterThan(p10);
    expect(p10).toBeGreaterThan(p100);
    expect(p100).toBeGreaterThan(0);
  });

  it('3.14 goldenモードは急速に発散', () => {
    const p3 = computePhase(3, 'golden');
    const p5 = computePhase(5, 'golden');
    expect(p5).toBeGreaterThan(p3 * 2);
  });

  it('3.15 harmonicモードはゆるやかに増加', () => {
    const p1 = computePhase(1, 'harmonic');
    const p10 = computePhase(10, 'harmonic');
    // H_10 ≈ 2.928..., so p10 ≈ 2.928π
    expect(p10).toBeGreaterThan(2.5 * PI);
    expect(p10).toBeLessThan(3.5 * PI);
  });
});

// ============================================================
// §4 記法同値公理 (15 tests)
// ============================================================
describe('§4 記法同値公理', () => {
  it('4.1 感覚層: πooo', () => {
    const notation = piToNotation(piSubscript(['o', 'o', 'o']));
    expect(notation.sensory).toBe('πooo');
  });

  it('4.2 対話層: π_o3', () => {
    const notation = piToNotation(piSubscript(['o', 'o', 'o']));
    expect(notation.dialogue).toBe('π_o3');
  });

  it('4.3 構造層: π(o,3)', () => {
    const notation = piToNotation(piSubscript(['o', 'o', 'o']));
    expect(notation.structural).toBe('π(o,3)');
  });

  it('4.4 意味層: JSON構造', () => {
    const notation = piToNotation(piSubscript(['o', 'o', 'o']));
    expect(notation.semantic.base).toBe('pi');
    expect(notation.semantic.degree).toBe(3);
    expect(notation.semantic.charCounts).toEqual({ o: 3 });
  });

  it('4.5 混合文字の記法: πoox', () => {
    const notation = piToNotation(piSubscript(['o', 'o', 'x']));
    expect(notation.sensory).toBe('πoox');
    expect(notation.dialogue).toBe('π_o2x1');
    expect(notation.structural).toBe('π(o,2,x,1)');
  });

  it('4.6 記法同値: πoox ≡ πoxo (順序が違っても同値)', () => {
    const a = piSubscript(['o', 'o', 'x']);
    const b = piSubscript(['o', 'x', 'o']);
    expect(notationEquivalent(a, b)).toBe(true);
  });

  it('4.7 記法非同値: πooo ≠ πoox', () => {
    const a = piSubscript(['o', 'o', 'o']);
    const b = piSubscript(['o', 'o', 'x']);
    expect(notationEquivalent(a, b)).toBe(false);
  });

  it('4.8 記法非同値: 次数が異なる', () => {
    const a = piSubscript(['o', 'o']);
    const b = piSubscript(['o', 'o', 'o']);
    expect(notationEquivalent(a, b)).toBe(false);
  });

  it('4.9 パース→記法の往復: πooo', () => {
    const parsed = parsePiSubscript('πooo')!;
    const notation = piToNotation(parsed);
    expect(notation.sensory).toBe('πooo');
  });

  it('4.10 パース→記法の往復: π_o3', () => {
    const parsed = parsePiSubscript('π_o3')!;
    const notation = piToNotation(parsed);
    expect(notation.dialogue).toBe('π_o3');
  });

  it('4.11 パース→記法の往復: π(o,3)', () => {
    const parsed = parsePiSubscript('π(o,3)')!;
    const notation = piToNotation(parsed);
    expect(notation.structural).toBe('π(o,3)');
  });

  it('4.12 空添字の記法', () => {
    const notation = piToNotation(piSubscript());
    expect(notation.sensory).toBe('π');
    expect(notation.dialogue).toBe('π_');
    expect(notation.semantic.degree).toBe(0);
  });

  it('4.13 長い添字: π_o10相当', () => {
    const chars = Array(10).fill('o');
    const notation = piToNotation(piSubscript(chars));
    expect(notation.sensory).toBe('π' + 'o'.repeat(10));
    expect(notation.dialogue).toBe('π_o10');
    expect(notation.structural).toBe('π(o,10)');
  });

  it('4.14 3種の文字: πoxxzzz', () => {
    const sub = piSubscript(['o', 'x', 'x', 'z', 'z', 'z']);
    const notation = piToNotation(sub);
    expect(notation.semantic.charCounts).toEqual({ o: 1, x: 2, z: 3 });
  });

  it('4.15 全3層パースが同一オブジェクトを生成', () => {
    const a = parsePiSubscript('πooo')!;
    const b = parsePiSubscript('π_o3')!;
    const c = parsePiSubscript('π(o,3)')!;
    expect(notationEquivalent(a, b)).toBe(true);
    expect(notationEquivalent(b, c)).toBe(true);
    expect(notationEquivalent(a, c)).toBe(true);
  });
});

// ============================================================
// §5 四価論理 (15 tests)
// ============================================================
describe('§5 四価論理', () => {
  it('5.1 quadValue: ⊤ = true', () => {
    expect(quadValue(true, false)).toBe('true');
  });

  it('5.2 quadValue: ⊥ = false', () => {
    expect(quadValue(false, false)).toBe('false');
  });

  it('5.3 quadValue: ⊤π = true-pi', () => {
    expect(quadValue(true, true)).toBe('true-pi');
  });

  it('5.4 quadValue: ⊥π = false-pi', () => {
    expect(quadValue(false, true)).toBe('false-pi');
  });

  it('5.5 piNegate: ⊤ → ⊤π → ⊤ (周期2)', () => {
    expect(piNegate('true')).toBe('true-pi');
    expect(piNegate('true-pi')).toBe('true');
  });

  it('5.6 piNegate: ⊥ → ⊥π → ⊥ (周期2)', () => {
    expect(piNegate('false')).toBe('false-pi');
    expect(piNegate('false-pi')).toBe('false');
  });

  it('5.7 standardNegate: ⊤ ↔ ⊥', () => {
    expect(standardNegate('true')).toBe('false');
    expect(standardNegate('false')).toBe('true');
  });

  it('5.8 standardNegate: ⊤π ↔ ⊥π', () => {
    expect(standardNegate('true-pi')).toBe('false-pi');
    expect(standardNegate('false-pi')).toBe('true-pi');
  });

  it('5.9 quadAnd: ⊤ ∧ ⊤ = ⊤', () => {
    expect(quadAnd('true', 'true')).toBe('true');
  });

  it('5.10 quadAnd: ⊤ ∧ ⊥ = ⊥', () => {
    expect(quadAnd('true', 'false')).toBe('false');
  });

  it('5.11 quadAnd: ⊤π ∧ ⊤π = ⊤ (π×π=1)', () => {
    expect(quadAnd('true-pi', 'true-pi')).toBe('true');
  });

  it('5.12 quadOr: ⊥ ∨ ⊥ = ⊥', () => {
    expect(quadOr('false', 'false')).toBe('false');
  });

  it('5.13 quadToPhase: ⊤=0, ⊥=π', () => {
    expect(quadToPhase('true')).toBe(0);
    expect(quadToPhase('false')).toBe(PI);
  });

  it('5.14 allQuadValues: 4つの値', () => {
    expect(allQuadValues()).toHaveLength(4);
  });

  it('5.15 二重piNegate: 恒等', () => {
    for (const v of allQuadValues()) {
      expect(piNegate(piNegate(v))).toBe(v);
    }
  });
});

// ============================================================
// §6 ゼロ拡張との統合 (10 tests)
// ============================================================
describe('§6 ゼロ拡張との統合', () => {
  it('6.1 composeA2: 基本合成', () => {
    const pn = piExtnum(piSubscript(['o', 'o']));
    const comp = composeA2(['o', 'o', 'o'], pn);
    expect(comp.depthDegree).toBe(3);
    expect(comp.rotationDegree).toBe(2);
    expect(comp.compositeDegree).toBe(5);
  });

  it('6.2 composeA2: 片方が空', () => {
    const pn = piExtnum(piSubscript());
    const comp = composeA2(['o'], pn);
    expect(comp.depthDegree).toBe(1);
    expect(comp.rotationDegree).toBe(0);
    expect(comp.compositeDegree).toBe(1);
  });

  it('6.3 composeA2: 両方空', () => {
    const pn = piExtnum(piSubscript());
    const comp = composeA2([], pn);
    expect(comp.compositeDegree).toBe(0);
  });

  it('6.4 verifyA2Commutativity: 可換性', () => {
    const pn = piExtnum(piSubscript(['o', 'x']));
    expect(verifyA2Commutativity(['o', 'o'], pn)).toBe(true);
  });

  it('6.5 composeA2: compositePhaseがπ拡張の位相', () => {
    const pn = piExtnum(piSubscript(['o', 'o', 'o']));
    const comp = composeA2(['x', 'x'], pn);
    expect(comp.compositePhase).toBe(pn.phase);
  });

  it('6.6 深度のみ: rotationDegree=0', () => {
    const pn = piExtnum(piSubscript());
    const comp = composeA2(['o', 'o', 'o', 'o', 'o'], pn);
    expect(comp.rotationDegree).toBe(0);
    expect(comp.compositePhase).toBe(0);
  });

  it('6.7 回転のみ: depthDegree=0', () => {
    const pn = piExtnum(piSubscript(['o', 'o', 'o']));
    const comp = composeA2([], pn);
    expect(comp.depthDegree).toBe(0);
    expect(comp.compositePhase).toBeCloseTo(3 * PI, 10);
  });

  it('6.8 A2完全: 深度+回転の直交性', () => {
    // 深度を増やしても回転には影響しない
    const pn = piExtnum(piSubscript(['o']));
    const comp1 = composeA2(['o'], pn);
    const comp2 = composeA2(['o', 'o', 'o'], pn);
    expect(comp1.compositePhase).toBe(comp2.compositePhase);
  });

  it('6.9 depthCharsとrotationCharsが独立', () => {
    const pn = piExtnum(piSubscript(['x', 'x']));
    const comp = composeA2(['o', 'o', 'o'], pn);
    expect(comp.depthChars).toEqual(['o', 'o', 'o']);
    expect(comp.rotationChars).toEqual(['x', 'x']);
  });

  it('6.10 大きな合成: depth=50, rotation=50', () => {
    const pn = piExtendTo(piExtnum(piSubscript()), 50);
    const comp = composeA2(Array(50).fill('o'), pn);
    expect(comp.compositeDegree).toBe(100);
  });
});

// ============================================================
// §7 σ蓄積連携 (10 tests)
// ============================================================
describe('§7 σ蓄積連携', () => {
  it('7.1 emptyPiSigma: 初期状態', () => {
    const sigma = emptyPiSigma();
    expect(sigma.history).toHaveLength(0);
    expect(sigma.transformCount).toBe(0);
    expect(sigma.totalRotation).toBe(0);
  });

  it('7.2 piExtendWithSigma: 履歴に記録', () => {
    const pn = piExtnum(piSubscript(['o']));
    const { result, sigma } = piExtendWithSigma(pn, emptyPiSigma(), 'o');
    expect(result.degree).toBe(2);
    expect(sigma.history).toHaveLength(1);
    expect(sigma.history[0].operation).toBe('extend');
    expect(sigma.transformCount).toBe(1);
  });

  it('7.3 piReduceWithSigma: 履歴に記録', () => {
    const pn = piExtnum(piSubscript(['o', 'o']));
    const { result, sigma } = piReduceWithSigma(pn, emptyPiSigma());
    expect(result.degree).toBe(1);
    expect(sigma.history[0].operation).toBe('reduce');
  });

  it('7.4 piRotateWithSigma: 回転記録', () => {
    const pn = piExtnum(piSubscript(['o']));
    const { result, sigma } = piRotateWithSigma(pn, emptyPiSigma());
    expect(sigma.history[0].operation).toBe('rotate');
    expect(sigma.totalRotation).toBeGreaterThan(0);
  });

  it('7.5 連続操作のσ蓄積', () => {
    let pn = piExtnum(piSubscript());
    let sigma = emptyPiSigma();
    // 3回拡張
    for (let i = 0; i < 3; i++) {
      const r = piExtendWithSigma(pn, sigma, 'o');
      pn = r.result;
      sigma = r.sigma;
    }
    // 1回回転
    const r2 = piRotateWithSigma(pn, sigma);
    sigma = r2.sigma;
    // 1回縮約
    const r3 = piReduceWithSigma(r2.result, sigma);
    sigma = r3.sigma;

    expect(sigma.transformCount).toBe(5);
    expect(sigma.history).toHaveLength(5);
  });

  it('7.6 σ不可逆性: 履歴は追加のみ', () => {
    const pn = piExtnum(piSubscript(['o']));
    const { sigma: s1 } = piExtendWithSigma(pn, emptyPiSigma());
    expect(s1.history.length).toBeGreaterThanOrEqual(1);
    // historyをReadonlyArrayとしているので直接変更できない
  });

  it('7.7 totalRotation: 蓄積量が増加', () => {
    let pn = piExtnum(piSubscript());
    let sigma = emptyPiSigma();
    for (let i = 0; i < 5; i++) {
      const r = piExtendWithSigma(pn, sigma, 'o');
      pn = r.result;
      sigma = r.sigma;
    }
    expect(sigma.totalRotation).toBeGreaterThan(0);
  });

  it('7.8 fromDegree/toDegreeの正確性', () => {
    const pn = piExtnum(piSubscript(['o', 'o']));
    const { sigma } = piExtendWithSigma(pn, emptyPiSigma(), 'x');
    expect(sigma.history[0].fromDegree).toBe(2);
    expect(sigma.history[0].toDegree).toBe(3);
  });

  it('7.9 timestampが記録される', () => {
    const pn = piExtnum(piSubscript());
    const { sigma } = piExtendWithSigma(pn, emptyPiSigma());
    expect(sigma.history[0].timestamp).toBeGreaterThan(0);
  });

  it('7.10 char情報がextendに記録される', () => {
    const pn = piExtnum(piSubscript());
    const { sigma } = piExtendWithSigma(pn, emptyPiSigma(), 'z');
    expect(sigma.history[0].char).toBe('z');
  });
});

// ============================================================
// §8 レポートと分析 (5 tests)
// ============================================================
describe('§8 レポートと分析', () => {
  it('8.1 summarizePi: 基本情報', () => {
    const pn = piExtnum(piSubscript(['o', 'o']), 'standard');
    const summary = summarizePi(pn);
    expect(summary.degree).toBe(2);
    expect(summary.mode).toBe('standard');
    expect(summary.phaseDegrees).toBeCloseTo(360, 5);
    expect(summary.isFullRotation).toBe(true);
  });

  it('8.2 summarizePi: 半回転の検出', () => {
    const pn = piExtnum(piSubscript(['o']), 'standard');
    const summary = summarizePi(pn);
    expect(summary.isHalfRotation).toBe(true);
    expect(summary.isFullRotation).toBe(false);
  });

  it('8.3 compareRotationModes: 4モード比較', () => {
    const comp = compareRotationModes(3);
    expect(comp.standard.phase).toBeCloseTo(3 * PI, 10);
    expect(comp.fractional.phase).toBeCloseTo(PI / 3, 10);
    expect(comp.golden.phase).toBeGreaterThan(comp.standard.phase);
  });

  it('8.4 generatePiReport: 文字列生成', () => {
    const pn = piExtnum(piSubscript(['o', 'o', 'x']), 'harmonic');
    const report = generatePiReport(pn);
    expect(report).toContain('π拡張理論');
    expect(report).toContain('πoox');
    expect(report).toContain('harmonic');
    expect(report).toContain('A2');
  });

  it('8.5 generatePiReport: 存在のためのことば', () => {
    const pn = piExtnum(piSubscript(['o']));
    const report = generatePiReport(pn);
    expect(report).toContain('存在のためのことば');
  });
});
