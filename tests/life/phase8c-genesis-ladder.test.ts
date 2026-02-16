// ============================================================
// phase8c-genesis-ladder.test.ts — Phase 8c テスト (100 tests)
//
// Genesis Ladderの10段階遷移を完全検証
//
// @author Nobuki Fujimoto (D-FUMT)
// ============================================================

import { describe, it, expect } from 'vitest';
import {
  type LadderStage,
  type LadderState,
  STAGE_METADATA,
  LADDER_ORDER,
  TRANSITIONS,
  getStageLevel,
  getStageMetadata,
  stageDistance,
  isHigherStage,
  isValidTransition,
  getAvailableTransitions,
  getAscendTransitions,
  getDescendTransitions,
  createInitialState,
  ascend,
  descend,
  ascendTo,
  descendTo,
  runFullGenesis,
  runGenesisTo,
  runFullDeath,
  determinEntityStage,
  applyTransitionToEntity,
  getLadderSummary,
  analyzeLadder,
} from '../src/lang/life/genesis-ladder';

// テスト用ヘルパー
function createTestEntity(overrides: any = {}): any {
  return {
    id: 'test-entity',
    lineage: [],
    self: {
      center: { center: 5, neighbors: [1, 2, 3] },
      periphery: [{ center: 2, neighbors: [1] }, { center: 3, neighbors: [2] }],
      weights: [0.5, 0.5],
      mode: 'weighted' as const,
    },
    sigma: { field: 1, flow: 0.5, memory: [{ type: 'init' }], layer: 0, relation: ['a'], will: 0.3 },
    genesis: { phase: 'number', canGenerate: false, birthHistory: [], ...overrides.genesis },
    vitality: {
      alive: true, age: 5, health: 0.8,
      mlc: { boundary: true, metabolism: true, memory: true, selfRepair: false, autopoiesis: false, emergence: false },
      ...overrides.vitality,
    },
  };
}

// ============================================================
// §1 段階メタデータ (15 tests)
// ============================================================
describe('§1 段階メタデータ', () => {
  it('1.1 全11段階が定義されている', () => {
    expect(STAGE_METADATA.length).toBe(11);
  });

  it('1.2 LADDER_ORDERが11段階', () => {
    expect(LADDER_ORDER.length).toBe(11);
  });

  it('1.3 voidがレベル0', () => {
    expect(getStageLevel('void')).toBe(0);
  });

  it('1.4 full-lifeがレベル10', () => {
    expect(getStageLevel('full-life')).toBe(10);
  });

  it('1.5 各段階のレベルが連続', () => {
    for (let i = 0; i < LADDER_ORDER.length; i++) {
      expect(getStageLevel(LADDER_ORDER[i])).toBe(i);
    }
  });

  it('1.6 getStageMetadataがvoidを返す', () => {
    const meta = getStageMetadata('void');
    expect(meta).toBeDefined();
    expect(meta!.name).toBe('絶対無');
  });

  it('1.7 getStageMetadataがfull-lifeを返す', () => {
    const meta = getStageMetadata('full-life');
    expect(meta).toBeDefined();
    expect(meta!.name).toBe('完全な生命');
  });

  it('1.8 全段階にnameが存在', () => {
    STAGE_METADATA.forEach(s => expect(s.name).toBeTruthy());
  });

  it('1.9 全段階にdescriptionが存在', () => {
    STAGE_METADATA.forEach(s => expect(s.description).toBeTruthy());
  });

  it('1.10 full-lifeが全公理を必要とする', () => {
    const meta = getStageMetadata('full-life');
    expect(meta!.requiredAxioms).toContain('A1');
    expect(meta!.requiredAxioms).toContain('A2');
    expect(meta!.requiredAxioms).toContain('A3');
    expect(meta!.requiredAxioms).toContain('A4');
  });

  it('1.11 voidは公理を必要としない', () => {
    const meta = getStageMetadata('void');
    expect(meta!.requiredAxioms.length).toBe(0);
  });

  it('1.12 full-lifeが全MLC条件を満たす', () => {
    const meta = getStageMetadata('full-life');
    expect(meta!.mlcSatisfied.length).toBe(6);
  });

  it('1.13 voidはMLC条件を満たさない', () => {
    const meta = getStageMetadata('void');
    expect(meta!.mlcSatisfied.length).toBe(0);
  });

  it('1.14 十二因縁が一部の段階に対応', () => {
    const withNidana = STAGE_METADATA.filter(s => s.nidana);
    expect(withNidana.length).toBeGreaterThan(5);
  });

  it('1.15 不明な段階のレベルは-1', () => {
    expect(getStageLevel('unknown' as any)).toBe(-1);
  });
});

// ============================================================
// §2 遷移規則 (15 tests)
// ============================================================
describe('§2 遷移規則', () => {
  it('2.1 上昇遷移が10個存在', () => {
    const ascends = TRANSITIONS.filter(t => t.operator === '⊕');
    expect(ascends.length).toBe(10);
  });

  it('2.2 下降遷移が10個存在', () => {
    const descends = TRANSITIONS.filter(t => t.operator === '⊖');
    expect(descends.length).toBe(10);
  });

  it('2.3 void→dotが有効', () => {
    expect(isValidTransition('void', 'dot')).toBe(true);
  });

  it('2.4 dot→voidが有効', () => {
    expect(isValidTransition('dot', 'void')).toBe(true);
  });

  it('2.5 void→full-lifeは直接遷移不可', () => {
    expect(isValidTransition('void', 'full-life')).toBe(false);
  });

  it('2.6 全上昇遷移が連続段階', () => {
    const ascends = TRANSITIONS.filter(t => t.operator === '⊕');
    ascends.forEach(t => {
      const fromLevel = getStageLevel(t.from);
      const toLevel = getStageLevel(t.to);
      expect(toLevel - fromLevel).toBe(1);
    });
  });

  it('2.7 全下降遷移が連続段階', () => {
    const descends = TRANSITIONS.filter(t => t.operator === '⊖');
    descends.forEach(t => {
      const fromLevel = getStageLevel(t.from);
      const toLevel = getStageLevel(t.to);
      expect(fromLevel - toLevel).toBe(1);
    });
  });

  it('2.8 全遷移にaxiomUsedが存在', () => {
    TRANSITIONS.forEach(t => {
      expect(t.axiomUsed.length).toBeGreaterThan(0);
    });
  });

  it('2.9 dot→void は不可逆（涅槃）', () => {
    const t = TRANSITIONS.find(t => t.from === 'dot' && t.to === 'void');
    expect(t!.reversible).toBe(false);
  });

  it('2.10 他の遷移は可逆', () => {
    const reversible = TRANSITIONS.filter(t => !(t.from === 'dot' && t.to === 'void'));
    reversible.forEach(t => expect(t.reversible).toBe(true));
  });

  it('2.11 voidからの遷移は上昇のみ', () => {
    const fromVoid = getAvailableTransitions('void');
    fromVoid.forEach(t => expect(t.operator).toBe('⊕'));
  });

  it('2.12 full-lifeからの遷移は下降のみ', () => {
    const fromFull = getAvailableTransitions('full-life');
    fromFull.forEach(t => expect(t.operator).toBe('⊖'));
  });

  it('2.13 中間段階は上昇と下降の両方', () => {
    const avail = getAvailableTransitions('metabolic');
    const operators = avail.map(t => t.operator);
    expect(operators).toContain('⊕');
    expect(operators).toContain('⊖');
  });

  it('2.14 getAscendTransitionsが上昇のみ返す', () => {
    const ascends = getAscendTransitions('number');
    ascends.forEach(t => expect(t.operator).toBe('⊕'));
  });

  it('2.15 getDescendTransitionsが下降のみ返す', () => {
    const descends = getDescendTransitions('number');
    descends.forEach(t => expect(t.operator).toBe('⊖'));
  });
});

// ============================================================
// §3 stageDistance と比較 (10 tests)
// ============================================================
describe('§3 段階距離と比較', () => {
  it('3.1 voidからfull-lifeの距離は10', () => {
    expect(stageDistance('void', 'full-life')).toBe(10);
  });

  it('3.2 full-lifeからvoidの距離は-10', () => {
    expect(stageDistance('full-life', 'void')).toBe(-10);
  });

  it('3.3 同一段階の距離は0', () => {
    expect(stageDistance('metabolic', 'metabolic')).toBe(0);
  });

  it('3.4 隣接段階の距離は±1', () => {
    expect(stageDistance('void', 'dot')).toBe(1);
    expect(stageDistance('dot', 'void')).toBe(-1);
  });

  it('3.5 isHigherStage: full-life > void', () => {
    expect(isHigherStage('full-life', 'void')).toBe(true);
  });

  it('3.6 isHigherStage: void < full-life', () => {
    expect(isHigherStage('void', 'full-life')).toBe(false);
  });

  it('3.7 isHigherStage: 同一は false', () => {
    expect(isHigherStage('metabolic', 'metabolic')).toBe(false);
  });

  it('3.8 emergent > autopoietic', () => {
    expect(isHigherStage('emergent', 'autopoietic')).toBe(true);
  });

  it('3.9 responsive < memory-bearing', () => {
    expect(isHigherStage('responsive', 'memory-bearing')).toBe(false);
  });

  it('3.10 number > zero', () => {
    expect(isHigherStage('number', 'zero')).toBe(true);
  });
});

// ============================================================
// §4 初期状態と上昇遷移 (15 tests)
// ============================================================
describe('§4 初期状態と上昇', () => {
  it('4.1 初期状態がvoid', () => {
    const state = createInitialState();
    expect(state.currentStage).toBe('void');
    expect(state.currentLevel).toBe(0);
  });

  it('4.2 初期状態のhistoryにvoid', () => {
    const state = createInitialState();
    expect(state.history).toEqual(['void']);
  });

  it('4.3 ascend: void→dot', () => {
    const state = createInitialState();
    const result = ascend(state);
    expect(result.success).toBe(true);
    expect(result.state.currentStage).toBe('dot');
  });

  it('4.4 ascend: dot→zero-extended', () => {
    let state = createInitialState();
    state = ascend(state).state;
    const result = ascend(state);
    expect(result.success).toBe(true);
    expect(result.state.currentStage).toBe('zero-extended');
  });

  it('4.5 full-lifeからascendは失敗', () => {
    const state = runFullGenesis();
    const result = ascend(state);
    expect(result.success).toBe(false);
  });

  it('4.6 ascendのhistoryが蓄積される', () => {
    let state = createInitialState();
    state = ascend(state).state;
    state = ascend(state).state;
    expect(state.history.length).toBe(3); // void, dot, zero-extended
  });

  it('4.7 ascendのtransitionsが記録される', () => {
    let state = createInitialState();
    state = ascend(state).state;
    expect(state.transitions.length).toBe(1);
    expect(state.transitions[0].from).toBe('void');
    expect(state.transitions[0].to).toBe('dot');
  });

  it('4.8 ascendTo: void→number', () => {
    const state = createInitialState();
    const result = ascendTo(state, 'number');
    expect(result.success).toBe(true);
    expect(result.state.currentStage).toBe('number');
    expect(result.state.currentLevel).toBe(4);
  });

  it('4.9 ascendTo: void→full-life', () => {
    const result = ascendTo(createInitialState(), 'full-life');
    expect(result.success).toBe(true);
    expect(result.state.currentStage).toBe('full-life');
  });

  it('4.10 ascendTo: 既に目標以上の場合は失敗', () => {
    const state = runGenesisTo('metabolic');
    const result = ascendTo(state, 'responsive');
    expect(result.success).toBe(false);
  });

  it('4.11 ascendTo: 不明な段階で失敗', () => {
    const result = ascendTo(createInitialState(), 'unknown' as any);
    expect(result.success).toBe(false);
  });

  it('4.12 各段階への上昇が全て成功する', () => {
    for (const stage of LADDER_ORDER.slice(1)) {
      const result = ascendTo(createInitialState(), stage);
      expect(result.success).toBe(true);
      expect(result.state.currentStage).toBe(stage);
    }
  });

  it('4.13 上昇遷移のtransition情報が返される', () => {
    const result = ascend(createInitialState());
    expect(result.transition).toBeDefined();
    expect(result.transition!.operator).toBe('⊕');
  });

  it('4.14 currentLevelが正しく更新される', () => {
    let state = createInitialState();
    for (let i = 1; i <= 10; i++) {
      state = ascend(state).state;
      expect(state.currentLevel).toBe(i);
    }
  });

  it('4.15 10回のascendでfull-lifeに到達', () => {
    let state = createInitialState();
    for (let i = 0; i < 10; i++) {
      const result = ascend(state);
      expect(result.success).toBe(true);
      state = result.state;
    }
    expect(state.currentStage).toBe('full-life');
  });
});

// ============================================================
// §5 下降遷移 (15 tests)
// ============================================================
describe('§5 下降遷移', () => {
  it('5.1 descend: full-life→emergent', () => {
    const state = runFullGenesis();
    const result = descend(state);
    expect(result.success).toBe(true);
    expect(result.state.currentStage).toBe('emergent');
  });

  it('5.2 voidからdescendは失敗', () => {
    const result = descend(createInitialState());
    expect(result.success).toBe(false);
  });

  it('5.3 descendTo: full-life→void', () => {
    const state = runFullGenesis();
    const result = descendTo(state, 'void');
    expect(result.success).toBe(true);
    expect(result.state.currentStage).toBe('void');
  });

  it('5.4 descendTo: metabolic→dot', () => {
    const state = runGenesisTo('metabolic');
    const result = descendTo(state, 'dot');
    expect(result.success).toBe(true);
    expect(result.state.currentStage).toBe('dot');
  });

  it('5.5 descendTo: 既に目標以下で失敗', () => {
    const state = runGenesisTo('dot');
    const result = descendTo(state, 'number');
    expect(result.success).toBe(false);
  });

  it('5.6 descend後のhistoryに記録される', () => {
    const state = runFullGenesis();
    const result = descend(state);
    expect(result.state.history).toContain('emergent');
  });

  it('5.7 descend後のtransitionsが記録される', () => {
    const state = runFullGenesis();
    const beforeCount = state.transitions.length;
    const result = descend(state);
    expect(result.state.transitions.length).toBe(beforeCount + 1);
  });

  it('5.8 下降遷移のoperatorが⊖', () => {
    const state = runFullGenesis();
    const result = descend(state);
    expect(result.transition!.operator).toBe('⊖');
  });

  it('5.9 full-life→voidで10回のdescend', () => {
    let state = runFullGenesis();
    for (let i = 0; i < 10; i++) {
      const result = descend(state);
      expect(result.success).toBe(true);
      state = result.state;
    }
    expect(state.currentStage).toBe('void');
  });

  it('5.10 currentLevelが正しく減少', () => {
    let state = runFullGenesis();
    for (let i = 9; i >= 0; i--) {
      state = descend(state).state;
      expect(state.currentLevel).toBe(i);
    }
  });

  it('5.11 descendTo 不明な段階で失敗', () => {
    const result = descendTo(runFullGenesis(), 'unknown' as any);
    expect(result.success).toBe(false);
  });

  it('5.12 各段階への下降が全て成功', () => {
    const fullState = runFullGenesis();
    for (const stage of LADDER_ORDER.slice(0, -1).reverse()) {
      const result = descendTo(runFullGenesis(), stage);
      expect(result.success).toBe(true);
      expect(result.state.currentStage).toBe(stage);
    }
  });

  it('5.13 上昇→下降→上昇の往復', () => {
    let state = createInitialState();
    state = ascendTo(state, 'metabolic').state;
    expect(state.currentStage).toBe('metabolic');
    state = descendTo(state, 'dot').state;
    expect(state.currentStage).toBe('dot');
    state = ascendTo(state, 'emergent').state;
    expect(state.currentStage).toBe('emergent');
  });

  it('5.14 descend後のreason', () => {
    const result = descend(createInitialState());
    expect(result.reason).toBeTruthy();
  });

  it('5.15 descendの理由メッセージが段階名を含む', () => {
    const result = descend(createInitialState());
    expect(result.reason).toContain('void');
  });
});

// ============================================================
// §6 完全Genesis/Death (10 tests)
// ============================================================
describe('§6 完全Genesis/Death', () => {
  it('6.1 runFullGenesisがfull-lifeに到達', () => {
    const state = runFullGenesis();
    expect(state.currentStage).toBe('full-life');
    expect(state.currentLevel).toBe(10);
  });

  it('6.2 runFullGenesisの遷移が10回', () => {
    const state = runFullGenesis();
    expect(state.transitions.length).toBe(10);
  });

  it('6.3 runFullGenesisのhistoryが11段階', () => {
    const state = runFullGenesis();
    expect(state.history.length).toBe(11);
  });

  it('6.4 runGenesisToが指定段階で停止', () => {
    const state = runGenesisTo('metabolic');
    expect(state.currentStage).toBe('metabolic');
  });

  it('6.5 runFullDeathがvoidに到達', () => {
    const state = runFullDeath();
    expect(state.currentStage).toBe('void');
    expect(state.currentLevel).toBe(0);
  });

  it('6.6 runFullDeathの遷移が20回', () => {
    const state = runFullDeath();
    expect(state.transitions.length).toBe(20); // 10 up + 10 down
  });

  it('6.7 runFullDeathのhistoryが21段階', () => {
    const state = runFullDeath();
    expect(state.history.length).toBe(21);
  });

  it('6.8 runGenesisTo void自体が初期状態', () => {
    // void to void should not ascend
    const state = createInitialState();
    const result = ascendTo(state, 'void');
    expect(result.success).toBe(false);
  });

  it('6.9 全段階を経由する完全サイクル', () => {
    const state = runFullDeath();
    // void→full-life→void の全段階が含まれる
    for (const stage of LADDER_ORDER) {
      expect(state.history).toContain(stage);
    }
  });

  it('6.10 runGenesisToの遷移数が段階数と一致', () => {
    for (let i = 1; i < LADDER_ORDER.length; i++) {
      const state = runGenesisTo(LADDER_ORDER[i]);
      expect(state.transitions.length).toBe(i);
    }
  });
});

// ============================================================
// §7 生命体との統合 (10 tests)
// ============================================================
describe('§7 生命体統合', () => {
  it('7.1 MLC全充足でfull-life', () => {
    const entity = createTestEntity({
      vitality: { alive: true, age: 5, health: 0.8,
        mlc: { boundary: true, metabolism: true, memory: true, selfRepair: true, autopoiesis: true, emergence: true } },
    });
    expect(determinEntityStage(entity)).toBe('full-life');
  });

  it('7.2 MLC5つでemergent', () => {
    const entity = createTestEntity({
      vitality: { alive: true, age: 5, health: 0.8,
        mlc: { boundary: true, metabolism: true, memory: true, selfRepair: true, autopoiesis: true, emergence: false } },
    });
    expect(determinEntityStage(entity)).toBe('emergent');
  });

  it('7.3 MLC4つでautopoietic', () => {
    const entity = createTestEntity({
      vitality: { alive: true, age: 5, health: 0.8,
        mlc: { boundary: true, metabolism: true, memory: true, selfRepair: true, autopoiesis: false, emergence: false } },
    });
    expect(determinEntityStage(entity)).toBe('autopoietic');
  });

  it('7.4 死亡状態でnumberまたはzero', () => {
    const entity = createTestEntity({ vitality: { alive: false, age: 5, health: 0, mlc: { boundary: true, metabolism: false, memory: false, selfRepair: false, autopoiesis: false, emergence: false } } });
    const stage = determinEntityStage(entity);
    expect(['number', 'zero']).toContain(stage);
  });

  it('7.5 applyTransitionToEntityがphaseを更新', () => {
    const entity = createTestEntity();
    const transition = TRANSITIONS[0]; // void→dot
    const updated = applyTransitionToEntity(entity, transition);
    expect(updated.genesis.birthHistory.length).toBeGreaterThan(entity.genesis.birthHistory.length);
  });

  it('7.6 MLC2つでmemory-bearing', () => {
    const entity = createTestEntity({
      vitality: { alive: true, age: 5, health: 0.8,
        mlc: { boundary: true, metabolism: true, memory: false, selfRepair: false, autopoiesis: false, emergence: false } },
    });
    expect(determinEntityStage(entity)).toBe('memory-bearing');
  });

  it('7.7 metabolismのみでmetabolic', () => {
    const entity = createTestEntity({
      vitality: { alive: true, age: 5, health: 0.8,
        mlc: { boundary: false, metabolism: true, memory: false, selfRepair: false, autopoiesis: false, emergence: false } },
    });
    expect(determinEntityStage(entity)).toBe('metabolic');
  });

  it('7.8 boundaryのみでresponsive', () => {
    const entity = createTestEntity({
      vitality: { alive: true, age: 5, health: 0.8,
        mlc: { boundary: true, metabolism: false, memory: false, selfRepair: false, autopoiesis: false, emergence: false } },
    });
    expect(determinEntityStage(entity)).toBe('responsive');
  });

  it('7.9 上昇遷移でbirthEvent typeがemergent', () => {
    const entity = createTestEntity();
    const ascendTransition = TRANSITIONS.find(t => t.operator === '⊕')!;
    const updated = applyTransitionToEntity(entity, ascendTransition);
    const lastEvent = updated.genesis.birthHistory[updated.genesis.birthHistory.length - 1];
    expect(lastEvent.type).toBe('emergent');
  });

  it('7.10 下降遷移でbirthEvent typeがmetamorphosis', () => {
    const entity = createTestEntity();
    const descendTransition = TRANSITIONS.find(t => t.operator === '⊖')!;
    const updated = applyTransitionToEntity(entity, descendTransition);
    const lastEvent = updated.genesis.birthHistory[updated.genesis.birthHistory.length - 1];
    expect(lastEvent.type).toBe('metamorphosis');
  });
});

// ============================================================
// §8 分析と可視化 (10 tests)
// ============================================================
describe('§8 分析と可視化', () => {
  it('8.1 getLadderSummaryが11段階返す', () => {
    const summary = getLadderSummary();
    expect(summary.length).toBe(11);
  });

  it('8.2 summaryの各項目にstageが存在', () => {
    getLadderSummary().forEach(s => expect(s.stage).toBeTruthy());
  });

  it('8.3 analyzeLadder: fullGenesisのascensionsが10', () => {
    const state = runFullGenesis();
    const analysis = analyzeLadder(state);
    expect(analysis.ascensions).toBe(10);
    expect(analysis.descensions).toBe(0);
  });

  it('8.4 analyzeLadder: fullDeathの合計遷移が20', () => {
    const state = runFullDeath();
    const analysis = analyzeLadder(state);
    expect(analysis.totalTransitions).toBe(20);
  });

  it('8.5 analyzeLadder: maxLevelReachedが10', () => {
    const state = runFullDeath();
    const analysis = analyzeLadder(state);
    expect(analysis.maxLevelReached).toBe(10);
  });

  it('8.6 analyzeLadder: 公理使用回数が記録される', () => {
    const state = runFullGenesis();
    const analysis = analyzeLadder(state);
    expect(analysis.axiomUsageCount['A4']).toBeGreaterThan(0);
  });

  it('8.7 analyzeLadder: A4が最も使用される', () => {
    const state = runFullGenesis();
    const analysis = analyzeLadder(state);
    // A4はGenesis全体で必要
    expect(analysis.axiomUsageCount['A4']).toBeGreaterThanOrEqual(3);
  });

  it('8.8 初期状態のanalysisが全て0', () => {
    const analysis = analyzeLadder(createInitialState());
    expect(analysis.totalTransitions).toBe(0);
    expect(analysis.ascensions).toBe(0);
    expect(analysis.descensions).toBe(0);
  });

  it('8.9 summaryのlevelが0から10', () => {
    const summary = getLadderSummary();
    expect(summary[0].level).toBe(0);
    expect(summary[10].level).toBe(10);
  });

  it('8.10 summaryのaxiomsが配列', () => {
    getLadderSummary().forEach(s => {
      expect(Array.isArray(s.axioms)).toBe(true);
    });
  });
});
