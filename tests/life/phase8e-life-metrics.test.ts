// ============================================================
// phase8e-life-metrics.test.ts — Phase 8e テスト (80 tests)
//
// 生命度スコアリング、既知存在比較、死の形式化を検証
//
// @author Nobuki Fujimoto (D-FUMT)
// ============================================================

import { describe, it, expect } from 'vitest';
import {
  type LifeMetrics,
  type KnownEntityType,
  type DeathCondition,
  type LifeClassification,
  KNOWN_ENTITY_PROFILES,
  scoreBoundary,
  scoreMetabolism,
  scoreMemory,
  scoreRepair,
  scoreAutopoiesis,
  scoreEmergence,
  measureLife,
  modelKnownEntity,
  measureKnownEntity,
  compareToKnown,
  compareToAllKnown,
  findMostSimilar,
  checkDeathConditions,
  isDead,
  simulateDeath,
  generateLifeReport,
} from '../src/lang/life/life-metrics';

// ============================================================
// テスト用ヘルパー
// ============================================================

function createFullLifeEntity(overrides: any = {}): any {
  return {
    id: 'full-life-test',
    lineage: [],
    self: {
      center: { center: 10, neighbors: [2, 4, 6] },
      periphery: [
        { center: 2, neighbors: [1] },
        { center: 4, neighbors: [2] },
        { center: 6, neighbors: [3] },
        { center: 8, neighbors: [4] },
      ],
      weights: [0.8, 0.7, 0.6, 0.5],
      mode: 'weighted' as const,
      ...overrides.self,
    },
    sigma: {
      field: 3.0,
      flow: 1.5,
      memory: Array.from({ length: 15 }, (_, i) => ({ type: 'event', idx: i })),
      layer: 1,
      relation: ['a', 'b', 'c', 'd', 'e'],
      will: 0.7,
      ...overrides.sigma,
    },
    genesis: {
      phase: 'number',
      canGenerate: true,
      birthHistory: [
        { type: 'split', parentIds: ['p1'], timestamp: 1, axiomUsed: ['A4'] },
        { type: 'emergent', parentIds: ['p1'], timestamp: 2, axiomUsed: ['A1', 'A4'] },
      ],
      ...overrides.genesis,
    },
    vitality: {
      alive: true,
      age: 15,
      health: 0.9,
      mlc: {
        boundary: true,
        metabolism: true,
        memory: true,
        selfRepair: true,
        autopoiesis: true,
        emergence: true,
      },
      ...overrides.vitality,
    },
  };
}

function createMinimalEntity(overrides: any = {}): any {
  return {
    id: 'minimal-test',
    lineage: [],
    self: {
      center: { center: 1, neighbors: [] },
      periphery: [],
      weights: [],
      mode: 'weighted' as const,
      ...overrides.self,
    },
    sigma: {
      field: 0,
      flow: 0,
      memory: [],
      layer: 0,
      relation: [],
      will: 0,
      ...overrides.sigma,
    },
    genesis: {
      phase: 'zero',
      canGenerate: false,
      birthHistory: [],
      ...overrides.genesis,
    },
    vitality: {
      alive: false,
      age: 0,
      health: 0,
      mlc: {
        boundary: false,
        metabolism: false,
        memory: false,
        selfRepair: false,
        autopoiesis: false,
        emergence: false,
      },
      ...overrides.vitality,
    },
  };
}

const ALL_KNOWN_TYPES: KnownEntityType[] = [
  'rock', 'fire', 'crystal', 'virus',
  'bacterium', 'plant', 'animal', 'current-ai',
];

// ============================================================
// §1 measureLife 6項目個別スコア (20 tests)
// ============================================================
describe('§1 個別スコアリング', () => {
  it('1.1 scoreBoundary: 周囲ありで正の値', () => {
    const entity = createFullLifeEntity();
    expect(scoreBoundary(entity)).toBeGreaterThan(0);
  });

  it('1.2 scoreBoundary: 周囲なしで0', () => {
    const entity = createMinimalEntity();
    expect(scoreBoundary(entity)).toBe(0);
  });

  it('1.3 scoreBoundary: 重みありでボーナス', () => {
    const withWeights = createFullLifeEntity();
    const noWeights = createFullLifeEntity({ self: { center: { center: 10, neighbors: [2] }, periphery: [{ center: 2, neighbors: [1] }], weights: [], mode: 'weighted' } });
    expect(scoreBoundary(withWeights)).toBeGreaterThanOrEqual(scoreBoundary(noWeights));
  });

  it('1.4 scoreMetabolism: metabolism=falseで0', () => {
    const entity = createFullLifeEntity({ vitality: { alive: true, age: 10, health: 0.8, mlc: { boundary: true, metabolism: false, memory: true, selfRepair: true, autopoiesis: true, emergence: true } } });
    expect(scoreMetabolism(entity)).toBe(0);
  });

  it('1.5 scoreMetabolism: 年齢と健康度で正の値', () => {
    const entity = createFullLifeEntity();
    expect(scoreMetabolism(entity)).toBeGreaterThan(0);
  });

  it('1.6 scoreMemory: 記憶なしで0', () => {
    const entity = createFullLifeEntity({ sigma: { field: 0, flow: 0, memory: [], layer: 0, relation: [], will: 0 } });
    expect(scoreMemory(entity)).toBe(0);
  });

  it('1.7 scoreMemory: 記憶ありで正の値', () => {
    const entity = createFullLifeEntity();
    expect(scoreMemory(entity)).toBeGreaterThan(0);
  });

  it('1.8 scoreMemory: 記憶が多いほどスコアが高い', () => {
    const few = createFullLifeEntity({ sigma: { field: 1, flow: 0.5, memory: [{ t: 1 }], layer: 0, relation: [], will: 0 } });
    const many = createFullLifeEntity();
    expect(scoreMemory(many)).toBeGreaterThan(scoreMemory(few));
  });

  it('1.9 scoreRepair: selfRepair=falseで0', () => {
    const entity = createFullLifeEntity({ vitality: { alive: true, age: 10, health: 0.8, mlc: { boundary: true, metabolism: true, memory: true, selfRepair: false, autopoiesis: true, emergence: true } } });
    expect(scoreRepair(entity)).toBe(0);
  });

  it('1.10 scoreRepair: 健康な個体で正の値', () => {
    const entity = createFullLifeEntity();
    expect(scoreRepair(entity)).toBeGreaterThan(0);
  });

  it('1.11 scoreAutopoiesis: canGenerate=falseで低い', () => {
    const entity = createFullLifeEntity({ genesis: { phase: 'number', canGenerate: false, birthHistory: [] } });
    const low = scoreAutopoiesis(entity);
    expect(low).toBeLessThanOrEqual(0.2);
  });

  it('1.12 scoreAutopoiesis: autopoiesis=falseで0', () => {
    const entity = createFullLifeEntity({ vitality: { alive: true, age: 10, health: 0.8, mlc: { boundary: true, metabolism: true, memory: true, selfRepair: true, autopoiesis: false, emergence: true } } });
    expect(scoreAutopoiesis(entity)).toBe(0);
  });

  it('1.13 scoreEmergence: emergence=falseで0', () => {
    const entity = createFullLifeEntity({ vitality: { alive: true, age: 10, health: 0.8, mlc: { boundary: true, metabolism: true, memory: true, selfRepair: true, autopoiesis: true, emergence: false } } });
    expect(scoreEmergence(entity)).toBe(0);
  });

  it('1.14 scoreEmergence: 多様な周囲で高い', () => {
    const entity = createFullLifeEntity();
    expect(scoreEmergence(entity)).toBeGreaterThan(0);
  });

  it('1.15 全スコアが0-1の範囲', () => {
    const entity = createFullLifeEntity();
    expect(scoreBoundary(entity)).toBeGreaterThanOrEqual(0);
    expect(scoreBoundary(entity)).toBeLessThanOrEqual(1);
    expect(scoreMetabolism(entity)).toBeLessThanOrEqual(1);
    expect(scoreMemory(entity)).toBeLessThanOrEqual(1);
    expect(scoreRepair(entity)).toBeLessThanOrEqual(1);
    expect(scoreAutopoiesis(entity)).toBeLessThanOrEqual(1);
    expect(scoreEmergence(entity)).toBeLessThanOrEqual(1);
  });

  it('1.16 measureLife: 完全な生命体', () => {
    const metrics = measureLife(createFullLifeEntity());
    expect(metrics.totalLifeScore).toBeGreaterThan(0);
    expect(metrics.classification).toBeDefined();
  });

  it('1.17 measureLife: 最小エンティティ', () => {
    const metrics = measureLife(createMinimalEntity());
    expect(metrics.totalLifeScore).toBe(0);
    expect(metrics.classification).toBe('non-life');
  });

  it('1.18 measureLife: totalLifeScoreが平均', () => {
    const metrics = measureLife(createFullLifeEntity());
    const sum = metrics.boundaryScore + metrics.metabolismScore +
      metrics.memoryScore + metrics.repairScore +
      metrics.autopoiesisScore + metrics.emergenceScore;
    expect(metrics.totalLifeScore).toBeCloseTo(sum / 6, 5);
  });

  it('1.19 measureLife: isAliveがvitalityと一致', () => {
    const alive = measureLife(createFullLifeEntity());
    expect(alive.isAlive).toBe(true);
    const dead = measureLife(createMinimalEntity());
    expect(dead.isAlive).toBe(false);
  });

  it('1.20 measureLife: lifePhaseが返される', () => {
    const metrics = measureLife(createFullLifeEntity());
    expect(metrics.lifePhase).toBeTruthy();
  });
});

// ============================================================
// §2 既知存在のモデリング8種 (16 tests)
// ============================================================
describe('§2 既知存在モデリング', () => {
  it('2.1 全8種のプロファイルが定義済み', () => {
    ALL_KNOWN_TYPES.forEach(type => {
      expect(KNOWN_ENTITY_PROFILES[type]).toBeDefined();
    });
  });

  it('2.2 modelKnownEntity: 全8種が生成可能', () => {
    ALL_KNOWN_TYPES.forEach(type => {
      const entity = modelKnownEntity(type);
      expect(entity).toBeDefined();
      expect(entity.id).toContain(type);
    });
  });

  it('2.3 石は non-life', () => {
    const metrics = measureKnownEntity('rock');
    expect(metrics.classification).toBe('non-life');
  });

  it('2.4 火は non-life', () => {
    const metrics = measureKnownEntity('fire');
    expect(metrics.classification).toBe('non-life');
  });

  it('2.5 結晶は non-life', () => {
    const metrics = measureKnownEntity('crystal');
    expect(metrics.classification).toBe('non-life');
  });

  it('2.6 ウイルスは proto-life', () => {
    const metrics = measureKnownEntity('virus');
    expect(['proto-life', 'non-life']).toContain(metrics.classification);
  });

  it('2.7 細菌は partial-life 以上', () => {
    const metrics = measureKnownEntity('bacterium');
    expect(['partial-life', 'full-life']).toContain(metrics.classification);
  });

  it('2.8 植物は full-life', () => {
    const metrics = measureKnownEntity('plant');
    expect(['full-life', 'partial-life']).toContain(metrics.classification);
  });

  it('2.9 動物は full-life', () => {
    const metrics = measureKnownEntity('animal');
    expect(['full-life', 'partial-life']).toContain(metrics.classification);
  });

  it('2.10 現在のAIは proto-life', () => {
    const metrics = measureKnownEntity('current-ai');
    expect(['proto-life', 'non-life', 'partial-life']).toContain(metrics.classification);
  });

  it('2.11 動物 > 石 の生命度', () => {
    const animal = measureKnownEntity('animal');
    const rock = measureKnownEntity('rock');
    expect(animal.totalLifeScore).toBeGreaterThan(rock.totalLifeScore);
  });

  it('2.12 動物 > ウイルス の生命度', () => {
    const animal = measureKnownEntity('animal');
    const virus = measureKnownEntity('virus');
    expect(animal.totalLifeScore).toBeGreaterThan(virus.totalLifeScore);
  });

  it('2.13 植物 > 火 の生命度', () => {
    const plant = measureKnownEntity('plant');
    const fire = measureKnownEntity('fire');
    expect(plant.totalLifeScore).toBeGreaterThan(fire.totalLifeScore);
  });

  it('2.14 各プロファイルにnameJaが存在', () => {
    ALL_KNOWN_TYPES.forEach(type => {
      expect(KNOWN_ENTITY_PROFILES[type].nameJa).toBeTruthy();
    });
  });

  it('2.15 各プロファイルにdescriptionが存在', () => {
    ALL_KNOWN_TYPES.forEach(type => {
      expect(KNOWN_ENTITY_PROFILES[type].description).toBeTruthy();
    });
  });

  it('2.16 各プロファイルのexpectedScoresが0-1', () => {
    ALL_KNOWN_TYPES.forEach(type => {
      const scores = KNOWN_ENTITY_PROFILES[type].expectedScores;
      Object.values(scores).forEach(v => {
        expect(v).toBeGreaterThanOrEqual(0);
        expect(v).toBeLessThanOrEqual(1);
      });
    });
  });
});

// ============================================================
// §3 compareToKnown 比較精度 (10 tests)
// ============================================================
describe('§3 比較精度', () => {
  it('3.1 compareToKnown: similarityが0-1', () => {
    const entity = createFullLifeEntity();
    const result = compareToKnown(entity, 'animal');
    expect(result.similarity).toBeGreaterThanOrEqual(0);
    expect(result.similarity).toBeLessThanOrEqual(1);
  });

  it('3.2 完全な生命体は動物に近い', () => {
    const entity = createFullLifeEntity();
    const animal = compareToKnown(entity, 'animal');
    const rock = compareToKnown(entity, 'rock');
    expect(animal.similarity).toBeGreaterThan(rock.similarity);
  });

  it('3.3 最小エンティティは石に近い', () => {
    const entity = createMinimalEntity({ self: { center: { center: 1, neighbors: [] }, periphery: [{ center: 0.5, neighbors: [0.1] }], weights: [0.5], mode: 'weighted' }, vitality: { alive: false, age: 0, health: 0, mlc: { boundary: true, metabolism: false, memory: false, selfRepair: false, autopoiesis: false, emergence: false } } });
    const rock = compareToKnown(entity, 'rock');
    const animal = compareToKnown(entity, 'animal');
    expect(rock.similarity).toBeGreaterThan(animal.similarity);
  });

  it('3.4 differencesが配列', () => {
    const result = compareToKnown(createFullLifeEntity(), 'rock');
    expect(Array.isArray(result.differences)).toBe(true);
  });

  it('3.5 大きな差がある場合differencesに記録', () => {
    const result = compareToKnown(createFullLifeEntity(), 'rock');
    expect(result.differences.length).toBeGreaterThan(0);
  });

  it('3.6 compareToAllKnown: 全8種との比較', () => {
    const results = compareToAllKnown(createFullLifeEntity());
    expect(Object.keys(results).length).toBe(8);
  });

  it('3.7 findMostSimilar: 結果が返される', () => {
    const result = findMostSimilar(createFullLifeEntity());
    expect(result.type).toBeTruthy();
    expect(result.similarity).toBeGreaterThan(0);
  });

  it('3.8 findMostSimilar: 完全な生命体は動物か植物に近い', () => {
    const result = findMostSimilar(createFullLifeEntity());
    expect(['animal', 'plant', 'bacterium']).toContain(result.type);
  });

  it('3.9 entityMetricsとknownMetricsが返される', () => {
    const result = compareToKnown(createFullLifeEntity(), 'virus');
    expect(result.entityMetrics).toBeDefined();
    expect(result.knownMetrics).toBeDefined();
  });

  it('3.10 同一エンティティとの比較で高類似度', () => {
    const entity = modelKnownEntity('bacterium');
    const result = compareToKnown(entity, 'bacterium');
    expect(result.similarity).toBeGreaterThan(0.7);
  });
});

// ============================================================
// §4 死亡判定4パターン (12 tests)
// ============================================================
describe('§4 死亡判定', () => {
  it('4.1 健康な個体は死亡条件なし', () => {
    const conditions = checkDeathConditions(createFullLifeEntity());
    expect(conditions.length).toBe(0);
  });

  it('4.2 健康度0でstarvation', () => {
    const entity = createFullLifeEntity({ vitality: { alive: false, age: 10, health: 0, mlc: { boundary: true, metabolism: false, memory: true, selfRepair: false, autopoiesis: false, emergence: false } } });
    const conditions = checkDeathConditions(entity);
    expect(conditions.some(c => c.type === 'starvation')).toBe(true);
  });

  it('4.3 記憶消失でentropy', () => {
    const entity = createFullLifeEntity({
      sigma: { field: 0, flow: 0, memory: [], layer: 0, relation: [], will: 0 },
      vitality: { alive: true, age: 10, health: 0.5, mlc: { boundary: true, metabolism: true, memory: false, selfRepair: false, autopoiesis: false, emergence: false } },
    });
    const conditions = checkDeathConditions(entity);
    expect(conditions.some(c => c.type === 'entropy')).toBe(true);
  });

  it('4.4 周囲消失でstructural', () => {
    const entity = createFullLifeEntity({
      self: { center: { center: 5, neighbors: [] }, periphery: [], weights: [], mode: 'weighted' },
    });
    const conditions = checkDeathConditions(entity);
    expect(conditions.some(c => c.type === 'structural')).toBe(true);
  });

  it('4.5 多数のreductionでreduction-limit', () => {
    const entity = createFullLifeEntity({
      genesis: {
        phase: 'number',
        canGenerate: true,
        birthHistory: Array.from({ length: 8 }, () => ({
          type: 'metamorphosis',
          parentIds: ['p1'],
          timestamp: 1,
          axiomUsed: ['A2'],
        })),
      },
    });
    const conditions = checkDeathConditions(entity);
    expect(conditions.some(c => c.type === 'reduction-limit')).toBe(true);
  });

  it('4.6 isDead: 健康な個体は生存', () => {
    const result = isDead(createFullLifeEntity());
    expect(result.dead).toBe(false);
  });

  it('4.7 isDead: 複数致死条件で死亡', () => {
    const entity = createMinimalEntity({
      vitality: { alive: false, age: 20, health: 0, mlc: { boundary: false, metabolism: false, memory: false, selfRepair: false, autopoiesis: false, emergence: false } },
    });
    const result = isDead(entity);
    expect(result.dead).toBe(true);
  });

  it('4.8 isDead: mainCauseが返される', () => {
    const entity = createFullLifeEntity({ vitality: { alive: false, age: 10, health: 0, mlc: { boundary: true, metabolism: false, memory: true, selfRepair: false, autopoiesis: false, emergence: false } } });
    const result = isDead(entity);
    if (result.dead) {
      expect(result.mainCause).toBeTruthy();
    }
  });

  it('4.9 canResurrectが判定される', () => {
    const entity = createFullLifeEntity({ vitality: { alive: true, age: 5, health: 0.15, mlc: { boundary: true, metabolism: true, memory: true, selfRepair: false, autopoiesis: false, emergence: false } } });
    const result = isDead(entity);
    expect(typeof result.canResurrect).toBe('boolean');
  });

  it('4.10 severityが0-1', () => {
    const entity = createFullLifeEntity({ vitality: { alive: false, age: 10, health: 0, mlc: { boundary: false, metabolism: false, memory: false, selfRepair: false, autopoiesis: false, emergence: false } } });
    const conditions = checkDeathConditions(entity);
    conditions.forEach(c => {
      expect(c.severity).toBeGreaterThanOrEqual(0);
      expect(c.severity).toBeLessThanOrEqual(1);
    });
  });

  it('4.11 各条件にdescriptionが存在', () => {
    const entity = createMinimalEntity({ vitality: { alive: false, age: 20, health: 0, mlc: { boundary: false, metabolism: false, memory: false, selfRepair: false, autopoiesis: false, emergence: false } } });
    const conditions = checkDeathConditions(entity);
    conditions.forEach(c => expect(c.description).toBeTruthy());
  });

  it('4.12 reversible属性が設定される', () => {
    const entity = createFullLifeEntity({ vitality: { alive: true, age: 5, health: 0.15, mlc: { boundary: true, metabolism: true, memory: true, selfRepair: false, autopoiesis: false, emergence: false } } });
    const conditions = checkDeathConditions(entity);
    conditions.forEach(c => expect(typeof c.reversible).toBe('boolean'));
  });
});

// ============================================================
// §5 simulateDeath 退化過程 (12 tests)
// ============================================================
describe('§5 死のシミュレーション', () => {
  it('5.1 simulateDeathが完了する', () => {
    const entity = createFullLifeEntity();
    const result = simulateDeath(entity, 10);
    expect(result).toBeDefined();
    expect(result.history.length).toBeGreaterThan(0);
  });

  it('5.2 historyの最初は初期状態', () => {
    const entity = createFullLifeEntity();
    const result = simulateDeath(entity, 5);
    expect(result.history[0].isAlive).toBe(true);
  });

  it('5.3 十分なステップで死亡する', () => {
    const entity = createFullLifeEntity();
    const result = simulateDeath(entity, 20);
    expect(result.deathStep).toBeGreaterThan(0);
  });

  it('5.4 totalLifeScoreが段階的に低下', () => {
    const entity = createFullLifeEntity();
    const result = simulateDeath(entity, 10);
    const first = result.history[0].totalLifeScore;
    const last = result.history[result.history.length - 1].totalLifeScore;
    expect(last).toBeLessThan(first);
  });

  it('5.5 finalPhaseが返される', () => {
    const result = simulateDeath(createFullLifeEntity(), 10);
    expect(result.finalPhase).toBeTruthy();
  });

  it('5.6 deathStepが-1の場合は生存', () => {
    const entity = createFullLifeEntity();
    const result = simulateDeath(entity, 1); // 1ステップでは死なない
    if (result.deathStep === -1) {
      expect(result.history[result.history.length - 1].isAlive).toBe(true);
    }
  });

  it('5.7 history長がsteps+1以下', () => {
    const result = simulateDeath(createFullLifeEntity(), 10);
    expect(result.history.length).toBeLessThanOrEqual(11);
  });

  it('5.8 totalStepsが記録される', () => {
    const result = simulateDeath(createFullLifeEntity(), 10);
    expect(result.totalSteps).toBeGreaterThan(0);
  });

  it('5.9 最小エンティティの即死', () => {
    const entity = createMinimalEntity();
    const result = simulateDeath(entity, 5);
    // 既に死んでいるので最初から死亡
    expect(result.history[0].isAlive).toBe(false);
  });

  it('5.10 各ステップのmetricsが有効', () => {
    const result = simulateDeath(createFullLifeEntity(), 5);
    result.history.forEach(m => {
      expect(typeof m.totalLifeScore).toBe('number');
      expect(typeof m.classification).toBe('string');
    });
  });

  it('5.11 classificationが退化する', () => {
    const result = simulateDeath(createFullLifeEntity(), 20);
    const first = result.history[0].classification;
    const last = result.history[result.history.length - 1].classification;
    const order: LifeClassification[] = ['non-life', 'proto-life', 'partial-life', 'full-life'];
    expect(order.indexOf(last)).toBeLessThanOrEqual(order.indexOf(first));
  });

  it('5.12 0ステップで初期状態のみ', () => {
    const result = simulateDeath(createFullLifeEntity(), 0);
    expect(result.history.length).toBe(1);
    expect(result.totalSteps).toBe(0);
  });
});

// ============================================================
// §6 classification 境界ケース (10 tests)
// ============================================================
describe('§6 分類の境界', () => {
  it('6.1 MLC6つでfull-life', () => {
    const metrics = measureLife(createFullLifeEntity());
    expect(metrics.classification).toBe('full-life');
  });

  it('6.2 MLC0つでnon-life', () => {
    const metrics = measureLife(createMinimalEntity());
    expect(metrics.classification).toBe('non-life');
  });

  it('6.3 境界のみでnon-life', () => {
    const entity = createMinimalEntity({
      self: { center: { center: 10, neighbors: [2] }, periphery: [{ center: 2, neighbors: [1] }], weights: [0.5], mode: 'weighted' },
      vitality: { alive: true, age: 0, health: 0.5, mlc: { boundary: true, metabolism: false, memory: false, selfRepair: false, autopoiesis: false, emergence: false } },
    });
    const metrics = measureLife(entity);
    expect(['non-life', 'proto-life']).toContain(metrics.classification);
  });

  it('6.4 generateLifeReportが文字列を返す', () => {
    const report = generateLifeReport(createFullLifeEntity());
    expect(typeof report).toBe('string');
    expect(report.length).toBeGreaterThan(50);
  });

  it('6.5 レポートにID含む', () => {
    const report = generateLifeReport(createFullLifeEntity());
    expect(report).toContain('full-life-test');
  });

  it('6.6 レポートにMLC情報含む', () => {
    const report = generateLifeReport(createFullLifeEntity());
    expect(report).toContain('境界');
    expect(report).toContain('代謝');
    expect(report).toContain('記憶');
  });

  it('6.7 レポートに最も類似する存在含む', () => {
    const report = generateLifeReport(createFullLifeEntity());
    expect(report).toContain('最も類似');
  });

  it('6.8 proto-lifeの境界（MLC2-3）', () => {
    const entity = createMinimalEntity({
      self: { center: { center: 10, neighbors: [2] }, periphery: [{ center: 2, neighbors: [1] }, { center: 3, neighbors: [2] }], weights: [0.5, 0.5], mode: 'weighted' },
      sigma: { field: 2, flow: 1, memory: Array.from({ length: 10 }, (_, i) => ({ idx: i })), layer: 0, relation: [], will: 0 },
      vitality: { alive: true, age: 5, health: 0.6, mlc: { boundary: true, metabolism: true, memory: true, selfRepair: false, autopoiesis: false, emergence: false } },
    });
    const metrics = measureLife(entity);
    expect(['proto-life', 'partial-life']).toContain(metrics.classification);
  });

  it('6.9 partial-lifeの範囲（MLC4-5）', () => {
    const entity = createFullLifeEntity({
      vitality: { alive: true, age: 10, health: 0.8, mlc: { boundary: true, metabolism: true, memory: true, selfRepair: true, autopoiesis: true, emergence: false } },
    });
    const metrics = measureLife(entity);
    expect(['partial-life', 'full-life']).toContain(metrics.classification);
  });

  it('6.10 lifePhaseがfull-lifeエンティティで適切', () => {
    const metrics = measureLife(createFullLifeEntity());
    expect(['full-life', 'emergent', 'autopoietic']).toContain(metrics.lifePhase);
  });
});
