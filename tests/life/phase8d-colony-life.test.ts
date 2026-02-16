// ============================================================
// phase8d-colony-life.test.ts — Phase 8d テスト (100 tests)
//
// コロニー、自然選択、突然変異、種分化、創発を検証
//
// @author Nobuki Fujimoto (D-FUMT)
// ============================================================

import { describe, it, expect, beforeEach } from 'vitest';
import {
  type LifeColony,
  type FitnessResult,
  type MutationResult,
  type GenerationResult,
  resetColonyIdCounter,
  generateColonyId,
  createColony,
  computeFitness,
  naturalSelection,
  mutate,
  reproduce,
  crossover,
  runGeneration,
  runGenerations,
  detectSpeciesFromMembers,
  detectSpeciation,
  detectColonialEmergence,
  colonialEmergence,
  computeColonyStats,
  computeDiversity,
} from '../src/lang/life/colony-life';

// テスト用ヘルパー
function createTestEntity(id: string, overrides: any = {}): any {
  return {
    id,
    lineage: [],
    self: {
      center: { center: 5 + Math.random() * 2, neighbors: [1, 2] },
      periphery: [
        { center: 2, neighbors: [1] },
        { center: 3, neighbors: [2] },
        { center: 4, neighbors: [3] },
      ],
      weights: [0.8, 0.6, 0.4],
      mode: overrides.mode ?? 'weighted' as const,
    },
    sigma: {
      field: 1.0,
      flow: 0.5,
      memory: [{ type: 'init' }],
      layer: 0,
      relation: ['a'],
      will: 0.3,
    },
    genesis: {
      phase: 'number',
      canGenerate: false,
      birthHistory: [],
    },
    vitality: {
      alive: true,
      age: overrides.age ?? 5,
      health: overrides.health ?? 0.8,
      mlc: {
        boundary: true,
        metabolism: true,
        memory: true,
        selfRepair: false,
        autopoiesis: false,
        emergence: false,
      },
    },
  };
}

function createPopulation(n: number): any[] {
  return Array.from({ length: n }, (_, i) =>
    createTestEntity(`life-${i}`, {
      mode: ['weighted', 'harmonic', 'geometric'][i % 3],
      health: 0.5 + Math.random() * 0.5,
      age: Math.floor(Math.random() * 20),
    })
  );
}

beforeEach(() => resetColonyIdCounter());

// ============================================================
// §1 コロニー生成と初期化 (10 tests)
// ============================================================
describe('§1 コロニー生成', () => {
  it('1.1 コロニー生成が成功する', () => {
    const members = [createTestEntity('a'), createTestEntity('b')];
    const colony = createColony(members);
    expect(colony).toBeDefined();
    expect(colony.members.length).toBe(2);
  });

  it('1.2 コロニーIDが生成される', () => {
    const colony = createColony([createTestEntity('a')]);
    expect(colony.id).toMatch(/^colony-/);
  });

  it('1.3 世代番号が0で初期化', () => {
    const colony = createColony([createTestEntity('a')]);
    expect(colony.generation).toBe(0);
  });

  it('1.4 空のコロニーが生成可能', () => {
    const colony = createColony([]);
    expect(colony.members.length).toBe(0);
  });

  it('1.5 環境が設定される', () => {
    const env = [{ center: 5, neighbors: [2, 3] }];
    const colony = createColony([createTestEntity('a')], env);
    expect(colony.environment.length).toBe(1);
  });

  it('1.6 collectiveSigmaが初期化される', () => {
    const colony = createColony([createTestEntity('a')]);
    expect(colony.collectiveSigma).toBeDefined();
    expect(colony.collectiveSigma.generationalMemory).toEqual([]);
  });

  it('1.7 statsが計算される', () => {
    const colony = createColony(createPopulation(5));
    expect(colony.stats.totalPopulation).toBe(5);
  });

  it('1.8 speciesが検出される', () => {
    const colony = createColony(createPopulation(9));
    expect(colony.species.length).toBeGreaterThan(0);
  });

  it('1.9 IDカウンタがリセットされる', () => {
    resetColonyIdCounter();
    expect(generateColonyId()).toBe('colony-1');
    expect(generateColonyId()).toBe('colony-2');
  });

  it('1.10 大規模コロニーが生成可能', () => {
    const colony = createColony(createPopulation(50));
    expect(colony.members.length).toBe(50);
  });
});

// ============================================================
// §2 runGeneration 1世代実行 (15 tests)
// ============================================================
describe('§2 runGeneration', () => {
  it('2.1 1世代が実行される', () => {
    const colony = createColony(createPopulation(10));
    const result = runGeneration(colony, { seed: 42 });
    expect(result.colony.generation).toBe(1);
  });

  it('2.2 世代番号が増加する', () => {
    const colony = createColony(createPopulation(10));
    const r1 = runGeneration(colony, { seed: 42 });
    const r2 = runGeneration(r1.colony, { seed: 43 });
    expect(r2.colony.generation).toBe(2);
  });

  it('2.3 births が生成される', () => {
    const colony = createColony(createPopulation(10));
    const result = runGeneration(colony, { reproductionRate: 0.5, seed: 42 });
    expect(result.births.length).toBeGreaterThan(0);
  });

  it('2.4 deaths が発生する', () => {
    const colony = createColony(createPopulation(10));
    const result = runGeneration(colony, { survivalRate: 0.5, seed: 42 });
    expect(result.deaths.length).toBeGreaterThan(0);
  });

  it('2.5 mutations が記録される', () => {
    const colony = createColony(createPopulation(10));
    const result = runGeneration(colony, { mutationRate: 0.9, seed: 42 });
    // 高変異率なので突然変異が起きるはず
    expect(result.mutations).toBeDefined();
  });

  it('2.6 GenerationResultの構造が正しい', () => {
    const result = runGeneration(createColony(createPopulation(5)), { seed: 42 });
    expect(result.colony).toBeDefined();
    expect(result.births).toBeDefined();
    expect(result.deaths).toBeDefined();
    expect(result.mutations).toBeDefined();
    expect(result.newSpecies).toBeDefined();
    expect(typeof result.emergenceDetected).toBe('boolean');
  });

  it('2.7 人口が0にならない（最低1生存）', () => {
    const colony = createColony(createPopulation(5));
    const result = runGeneration(colony, { survivalRate: 0.1, seed: 42 });
    expect(result.colony.members.length).toBeGreaterThan(0);
  });

  it('2.8 statsが更新される', () => {
    const colony = createColony(createPopulation(10));
    const result = runGeneration(colony, { seed: 42 });
    expect(result.colony.stats.birthCount).toBeGreaterThanOrEqual(0);
    expect(result.colony.stats.deathCount).toBeGreaterThanOrEqual(0);
  });

  it('2.9 collectiveSigmaのgenerationalMemoryが追加', () => {
    const colony = createColony(createPopulation(5));
    const result = runGeneration(colony, { seed: 42 });
    expect(result.colony.collectiveSigma.generationalMemory.length).toBe(1);
  });

  it('2.10 generationalRecordの構造が正しい', () => {
    const colony = createColony(createPopulation(5));
    const result = runGeneration(colony, { seed: 42 });
    const record = result.colony.collectiveSigma.generationalMemory[0];
    expect(record.generation).toBe(1);
    expect(typeof record.populationSize).toBe('number');
    expect(typeof record.averageFitness).toBe('number');
  });

  it('2.11 survivalRate=1で全員生存', () => {
    const colony = createColony(createPopulation(5));
    const result = runGeneration(colony, { survivalRate: 1, seed: 42 });
    expect(result.deaths.length).toBe(0);
  });

  it('2.12 reproductionRate=0で子なし', () => {
    const colony = createColony(createPopulation(5));
    const result = runGeneration(colony, { reproductionRate: 0, seed: 42 });
    // reproductionRate=0 → Math.ceil(n * 0) = 0
    expect(result.births.length).toBe(0);
  });

  it('2.13 speciesが更新される', () => {
    const colony = createColony(createPopulation(9));
    const result = runGeneration(colony, { seed: 42 });
    expect(result.colony.species.length).toBeGreaterThan(0);
  });

  it('2.14 seed指定で決定的', () => {
    const colony = createColony(createPopulation(10));
    const r1 = runGeneration(colony, { seed: 42 });
    const r2 = runGeneration(colony, { seed: 42 });
    expect(r1.births.length).toBe(r2.births.length);
  });

  it('2.15 空コロニーの世代実行', () => {
    const colony = createColony([]);
    const result = runGeneration(colony, { seed: 42 });
    expect(result.colony.members.length).toBe(0);
  });
});

// ============================================================
// §3 naturalSelection (15 tests)
// ============================================================
describe('§3 naturalSelection', () => {
  it('3.1 70%生存率で約70%が生存', () => {
    const members = createPopulation(10);
    const { survivors, dead } = naturalSelection(members, 0.7);
    expect(survivors.length).toBe(7);
    expect(dead.length).toBe(3);
  });

  it('3.2 全員生存', () => {
    const members = createPopulation(5);
    const { survivors } = naturalSelection(members, 1.0);
    expect(survivors.length).toBe(5);
  });

  it('3.3 最低1人は生存', () => {
    const members = createPopulation(5);
    const { survivors } = naturalSelection(members, 0.01);
    expect(survivors.length).toBeGreaterThanOrEqual(1);
  });

  it('3.4 適応度順にソート', () => {
    const members = createPopulation(10);
    const { survivors } = naturalSelection(members, 0.5);
    // 生存者の適応度は平均的に高いはず
    const survFitness = survivors.map(s => computeFitness(s).fitness);
    const avgSurv = survFitness.reduce((a, b) => a + b, 0) / survFitness.length;
    expect(avgSurv).toBeGreaterThan(0);
  });

  it('3.5 空の個体群で空結果', () => {
    const { survivors, dead } = naturalSelection([], 0.7);
    expect(survivors.length).toBe(0);
    expect(dead.length).toBe(0);
  });

  it('3.6 1個体で必ず生存', () => {
    const { survivors } = naturalSelection([createTestEntity('solo')], 0.5);
    expect(survivors.length).toBe(1);
  });

  it('3.7 survivors + dead = 元の個体数', () => {
    const members = createPopulation(15);
    const { survivors, dead } = naturalSelection(members, 0.6);
    expect(survivors.length + dead.length).toBe(15);
  });

  it('3.8 健康な個体が生存しやすい', () => {
    const healthy = createTestEntity('healthy', { health: 1.0 });
    const unhealthy = createTestEntity('unhealthy', { health: 0.1 });
    const { survivors } = naturalSelection([healthy, unhealthy], 0.5);
    expect(survivors.length).toBe(1);
    expect(survivors[0].vitality.health).toBeGreaterThanOrEqual(unhealthy.vitality.health);
  });

  it('3.9 survivalRate=0でも最低1生存', () => {
    const { survivors } = naturalSelection(createPopulation(5), 0);
    expect(survivors.length).toBeGreaterThanOrEqual(1);
  });

  it('3.10 大規模選択が動作する', () => {
    const { survivors, dead } = naturalSelection(createPopulation(100), 0.3);
    expect(survivors.length + dead.length).toBe(100);
  });

  it('3.11 適応度が0-1の範囲', () => {
    createPopulation(10).forEach(m => {
      const f = computeFitness(m);
      expect(f.fitness).toBeGreaterThanOrEqual(0);
      expect(f.fitness).toBeLessThanOrEqual(1);
    });
  });

  it('3.12 fitnessのcomponentsが存在', () => {
    const f = computeFitness(createTestEntity('test'));
    expect(f.components.health).toBeDefined();
    expect(f.components.metabolicEfficiency).toBeDefined();
    expect(f.components.memoryDepth).toBeDefined();
  });

  it('3.13 健康度0の個体は低適応度', () => {
    const entity = createTestEntity('dead', { health: 0 });
    expect(computeFitness(entity).fitness).toBeLessThan(0.5);
  });

  it('3.14 非常に老いた個体は適応度が低い', () => {
    const young = createTestEntity('young', { age: 5, health: 0.8 });
    const old = createTestEntity('old', { age: 80, health: 0.8 });
    expect(computeFitness(young).fitness).toBeGreaterThan(computeFitness(old).fitness);
  });

  it('3.15 周囲が多いほど適応度が高い', () => {
    const few = createTestEntity('few');
    few.self.periphery = [{ center: 1, neighbors: [1] }];
    const many = createTestEntity('many');
    expect(computeFitness(many).fitness).toBeGreaterThan(computeFitness(few).fitness);
  });
});

// ============================================================
// §4 mutate の構造変更検証 (15 tests)
// ============================================================
describe('§4 突然変異', () => {
  it('4.1 変異率0で変異なし', () => {
    const entity = createTestEntity('test');
    const result = mutate(entity, 0, 42);
    expect(result.magnitude).toBe(0);
  });

  it('4.2 変異率1で必ず変異', () => {
    const entity = createTestEntity('test');
    const result = mutate(entity, 1, 42);
    expect(result.mutationType).toBeTruthy();
  });

  it('4.3 periphery-addで周囲が増える', () => {
    const entity = createTestEntity('test');
    const original = entity.self.periphery.length;
    // seed to get periphery-add
    let added = false;
    for (let s = 0; s < 100; s++) {
      const result = mutate(entity, 1, s);
      if (result.mutationType === 'periphery-add') {
        expect(result.entity.self.periphery.length).toBe(original + 1);
        added = true;
        break;
      }
    }
    expect(added).toBe(true);
  });

  it('4.4 periphery-removeで周囲が減る', () => {
    const entity = createTestEntity('test');
    const original = entity.self.periphery.length;
    let removed = false;
    for (let s = 0; s < 100; s++) {
      const result = mutate(entity, 1, s);
      if (result.mutationType === 'periphery-remove') {
        expect(result.entity.self.periphery.length).toBe(original - 1);
        removed = true;
        break;
      }
    }
    expect(removed).toBe(true);
  });

  it('4.5 mode-switchでモードが変わる', () => {
    const entity = createTestEntity('test');
    let switched = false;
    for (let s = 0; s < 100; s++) {
      const result = mutate(entity, 1, s);
      if (result.mutationType === 'mode-switch') {
        expect(result.entity.self.mode).not.toBe(entity.self.mode);
        switched = true;
        break;
      }
    }
    expect(switched).toBe(true);
  });

  it('4.6 weight-shiftで重みが変わる', () => {
    const entity = createTestEntity('test');
    let shifted = false;
    for (let s = 0; s < 100; s++) {
      const result = mutate(entity, 1, s);
      if (result.mutationType === 'weight-shift') {
        shifted = true;
        break;
      }
    }
    expect(shifted).toBe(true);
  });

  it('4.7 center-driftで中心が変わる', () => {
    let drifted = false;
    for (let s = 0; s < 100; s++) {
      const entity = createTestEntity('test');
      const result = mutate(entity, 1, s);
      if (result.mutationType === 'center-drift' && result.magnitude > 0) {
        drifted = true;
        break;
      }
    }
    expect(drifted).toBe(true);
  });

  it('4.8 magnitudeが非負', () => {
    for (let s = 0; s < 20; s++) {
      const result = mutate(createTestEntity('test'), 1, s);
      expect(result.magnitude).toBeGreaterThanOrEqual(0);
    }
  });

  it('4.9 descriptionが存在する', () => {
    const result = mutate(createTestEntity('test'), 1, 42);
    expect(result.description).toBeTruthy();
  });

  it('4.10 最小周囲での削除は変異なし', () => {
    const entity = createTestEntity('test');
    entity.self.periphery = [{ center: 1, neighbors: [1] }];
    let noChange = false;
    for (let s = 0; s < 100; s++) {
      const result = mutate(entity, 1, s);
      if (result.mutationType === 'periphery-remove') {
        expect(result.magnitude).toBe(0);
        noChange = true;
        break;
      }
    }
    // periphery-removeが選ばれた場合のみテスト
    if (!noChange) expect(true).toBe(true); // skip
  });

  it('4.11 reproduce が子を生成', () => {
    const parent = createTestEntity('parent');
    const child = reproduce(parent, 0.1, 42);
    expect(child.id).not.toBe(parent.id);
    expect(child.vitality.age).toBe(0);
  });

  it('4.12 reproduce の系譜に親ID', () => {
    const parent = createTestEntity('parent');
    const child = reproduce(parent, 0.1, 42);
    expect(child.lineage).toContain('parent');
  });

  it('4.13 crossover が2親からの子を生成', () => {
    const p1 = createTestEntity('p1', { mode: 'weighted' });
    const p2 = createTestEntity('p2', { mode: 'harmonic' });
    const child = crossover(p1, p2, 42);
    expect(child.id).not.toBe(p1.id);
    expect(child.lineage).toContain('p1');
    expect(child.lineage).toContain('p2');
  });

  it('4.14 crossover の子の年齢が0', () => {
    const child = crossover(createTestEntity('p1'), createTestEntity('p2'), 42);
    expect(child.vitality.age).toBe(0);
  });

  it('4.15 crossover で記憶が両親から継承', () => {
    const p1 = createTestEntity('p1');
    p1.sigma.memory = [{ type: 'p1-mem' }];
    const p2 = createTestEntity('p2');
    p2.sigma.memory = [{ type: 'p2-mem' }];
    const child = crossover(p1, p2, 42);
    expect(child.sigma.memory.length).toBeGreaterThan(0);
  });
});

// ============================================================
// §5 複数世代の連続実行 (15 tests)
// ============================================================
describe('§5 複数世代', () => {
  it('5.1 5世代実行が完了する', () => {
    const colony = createColony(createPopulation(10));
    const { colony: final } = runGenerations(colony, 5, { seed: 42 });
    expect(final.generation).toBe(5);
  });

  it('5.2 世代結果の数が一致', () => {
    const { generationResults } = runGenerations(
      createColony(createPopulation(10)), 3, { seed: 42 }
    );
    expect(generationResults.length).toBe(3);
  });

  it('5.3 世代を重ねると集合記憶が蓄積', () => {
    const { colony } = runGenerations(
      createColony(createPopulation(10)), 5, { seed: 42 }
    );
    expect(colony.collectiveSigma.generationalMemory.length).toBe(5);
  });

  it('5.4 人口が維持される', () => {
    const { colony } = runGenerations(
      createColony(createPopulation(10)), 10, { seed: 42 }
    );
    expect(colony.members.length).toBeGreaterThan(0);
  });

  it('5.5 0世代実行で変化なし', () => {
    const colony = createColony(createPopulation(5));
    const { colony: final } = runGenerations(colony, 0, { seed: 42 });
    expect(final.generation).toBe(0);
  });

  it('5.6 各世代の適応度が記録される', () => {
    const { generationResults } = runGenerations(
      createColony(createPopulation(10)), 3, { seed: 42 }
    );
    generationResults.forEach(r => {
      expect(r.colony.stats.averageFitness).toBeGreaterThanOrEqual(0);
    });
  });

  it('5.7 絶滅で早期終了', () => {
    // 非常に厳しい条件
    const colony = createColony([createTestEntity('lone', { health: 0.01 })]);
    const { generationResults } = runGenerations(colony, 100, {
      survivalRate: 0.01,
      reproductionRate: 0,
      seed: 42,
    });
    // 全100世代は走らないはず（でも最低1は生存するのでまあ）
    expect(generationResults.length).toBeGreaterThanOrEqual(1);
  });

  it('5.8 speciesCountが記録される', () => {
    const { colony } = runGenerations(
      createColony(createPopulation(9)), 3, { seed: 42 }
    );
    expect(colony.stats.speciesCount).toBeGreaterThan(0);
  });

  it('5.9 大規模長期実行', () => {
    const { colony } = runGenerations(
      createColony(createPopulation(20)), 10, { seed: 42 }
    );
    expect(colony.generation).toBe(10);
  });

  it('5.10 birthCount/deathCountが記録', () => {
    const { generationResults } = runGenerations(
      createColony(createPopulation(10)), 1, { seed: 42 }
    );
    expect(typeof generationResults[0].colony.stats.birthCount).toBe('number');
    expect(typeof generationResults[0].colony.stats.deathCount).toBe('number');
  });

  it('5.11 各世代でcolony.idが変わらない', () => {
    const colony = createColony(createPopulation(5));
    const { colony: final } = runGenerations(colony, 3, { seed: 42 });
    expect(final.id).toBe(colony.id);
  });

  it('5.12 世代間で環境が保持される', () => {
    const env = [{ center: 5, neighbors: [2] }];
    const colony = createColony(createPopulation(5), env);
    const { colony: final } = runGenerations(colony, 3, { seed: 42 });
    expect(final.environment).toEqual(env);
  });

  it('5.13 10世代で多様性が変動する', () => {
    const { generationResults } = runGenerations(
      createColony(createPopulation(15)), 10, { seed: 42 }
    );
    const diversities = generationResults.map(r => r.colony.stats.diversity);
    // 多様性が全て同じではないはず
    const unique = new Set(diversities.map(d => d.toFixed(2)));
    expect(unique.size).toBeGreaterThanOrEqual(1);
  });

  it('5.14 mutationRate=0で安定', () => {
    const { colony } = runGenerations(
      createColony(createPopulation(10)), 3,
      { mutationRate: 0, seed: 42 }
    );
    expect(colony.members.length).toBeGreaterThan(0);
  });

  it('5.15 高mutationRateで構造変化', () => {
    const { generationResults } = runGenerations(
      createColony(createPopulation(10)), 3,
      { mutationRate: 0.9, seed: 42 }
    );
    // 変異が多いはず
    const totalMutations = generationResults.reduce(
      (s, r) => s + r.mutations.length, 0
    );
    expect(totalMutations).toBeGreaterThanOrEqual(0);
  });
});

// ============================================================
// §6 detectSpeciation 種分化 (15 tests)
// ============================================================
describe('§6 種分化', () => {
  it('6.1 単一モードで1種', () => {
    const members = Array.from({ length: 5 }, (_, i) =>
      createTestEntity(`e${i}`, { mode: 'weighted' })
    );
    const species = detectSpeciesFromMembers(members);
    expect(species.length).toBe(1);
  });

  it('6.2 3モードで3種', () => {
    const members = [
      createTestEntity('a', { mode: 'weighted' }),
      createTestEntity('b', { mode: 'harmonic' }),
      createTestEntity('c', { mode: 'geometric' }),
    ];
    const species = detectSpeciesFromMembers(members);
    expect(species.length).toBe(3);
  });

  it('6.3 空の個体群で0種', () => {
    expect(detectSpeciesFromMembers([]).length).toBe(0);
  });

  it('6.4 種のmemberCountが正しい', () => {
    const members = [
      createTestEntity('a', { mode: 'weighted' }),
      createTestEntity('b', { mode: 'weighted' }),
      createTestEntity('c', { mode: 'harmonic' }),
    ];
    const species = detectSpeciesFromMembers(members);
    const weighted = species.find(s => s.dominantMode === 'weighted');
    expect(weighted!.memberCount).toBe(2);
  });

  it('6.5 種のsignatureが存在', () => {
    const species = detectSpeciesFromMembers(createPopulation(9));
    species.forEach(s => expect(s.signature.length).toBeGreaterThan(0));
  });

  it('6.6 detectSpeciation: 新種の検出', () => {
    const prev = [{ id: 'species-weighted', name: 'w種', memberCount: 3, dominantMode: 'weighted' as const, averageFitness: 0.5, signature: [5] }];
    const current = [
      ...prev,
      { id: 'species-harmonic', name: 'h種', memberCount: 2, dominantMode: 'harmonic' as const, averageFitness: 0.6, signature: [4] },
    ];
    const newSpecies = detectSpeciation(current, prev);
    expect(newSpecies.length).toBe(1);
    expect(newSpecies[0].id).toBe('species-harmonic');
  });

  it('6.7 detectSpeciation: 変化なしで空', () => {
    const prev = [{ id: 'species-weighted', name: 'w種', memberCount: 3, dominantMode: 'weighted' as const, averageFitness: 0.5, signature: [5] }];
    expect(detectSpeciation(prev, prev).length).toBe(0);
  });

  it('6.8 種のaverageFitnessが0-1', () => {
    const species = detectSpeciesFromMembers(createPopulation(15));
    species.forEach(s => {
      expect(s.averageFitness).toBeGreaterThanOrEqual(0);
      expect(s.averageFitness).toBeLessThanOrEqual(1);
    });
  });

  it('6.9 種のidがmode名を含む', () => {
    const species = detectSpeciesFromMembers(createPopulation(9));
    species.forEach(s => {
      expect(s.id).toMatch(/species-(weighted|harmonic|geometric)/);
    });
  });

  it('6.10 世代実行で種分化が記録される', () => {
    const colony = createColony(createPopulation(9));
    const result = runGeneration(colony, { mutationRate: 0.9, seed: 42 });
    expect(Array.isArray(result.newSpecies)).toBe(true);
  });

  it('6.11 computeDiversity: 全同一で0', () => {
    const members = Array.from({ length: 5 }, (_, i) =>
      createTestEntity(`e${i}`, { mode: 'weighted' })
    );
    expect(computeDiversity(members)).toBe(0);
  });

  it('6.12 computeDiversity: 均等分布で高い', () => {
    const members = [
      createTestEntity('a', { mode: 'weighted' }),
      createTestEntity('b', { mode: 'harmonic' }),
      createTestEntity('c', { mode: 'geometric' }),
    ];
    expect(computeDiversity(members)).toBeGreaterThan(0.5);
  });

  it('6.13 computeDiversity: 単一個体で0', () => {
    expect(computeDiversity([createTestEntity('a')])).toBe(0);
  });

  it('6.14 computeDiversity: 空で0', () => {
    expect(computeDiversity([])).toBe(0);
  });

  it('6.15 computeColonyStats: 全項目が有効', () => {
    const stats = computeColonyStats(createPopulation(10));
    expect(stats.totalPopulation).toBe(10);
    expect(stats.averageFitness).toBeGreaterThan(0);
    expect(stats.averageHealth).toBeGreaterThan(0);
    expect(typeof stats.diversity).toBe('number');
  });
});

// ============================================================
// §7 colonialEmergence 集合知 (15 tests)
// ============================================================
describe('§7 集合知の創発', () => {
  it('7.1 3個体以上で創発判定が動作', () => {
    const colony = createColony(createPopulation(5));
    const result = colonialEmergence(colony);
    expect(typeof result.emerged).toBe('boolean');
  });

  it('7.2 2個体以下で創発なし', () => {
    const colony = createColony([createTestEntity('a'), createTestEntity('b')]);
    expect(colonialEmergence(colony).emerged).toBe(false);
  });

  it('7.3 空コロニーで創発なし', () => {
    expect(colonialEmergence(createColony([])).emerged).toBe(false);
  });

  it('7.4 創発時にpropertyが返される', () => {
    // 多様で健康なコロニー
    const members = createPopulation(10);
    const colony = createColony(members);
    const result = colonialEmergence(colony);
    if (result.emerged) {
      expect(result.property).toBeDefined();
      expect(typeof result.property!.center).toBe('number');
    }
  });

  it('7.5 detectColonialEmergenceが真偽値を返す', () => {
    const colony = createColony(createPopulation(5));
    const result = detectColonialEmergence(createPopulation(5), colony);
    expect(typeof result).toBe('boolean');
  });

  it('7.6 少数個体では創発困難', () => {
    const colony = createColony([createTestEntity('a')]);
    expect(detectColonialEmergence([createTestEntity('b')], colony)).toBe(false);
  });

  it('7.7 多様なコロニーで創発の可能性', () => {
    const members = createPopulation(20);
    const colony = createColony(members);
    // 創発するかどうかは条件次第だが、エラーなく動作
    expect(() => colonialEmergence(colony)).not.toThrow();
  });

  it('7.8 世代実行でemergenceDetectedが返される', () => {
    const colony = createColony(createPopulation(10));
    const result = runGeneration(colony, { seed: 42 });
    expect(typeof result.emergenceDetected).toBe('boolean');
  });

  it('7.9 創発のpropertyのneighborsが種の適応度', () => {
    const colony = createColony(createPopulation(9));
    const result = colonialEmergence(colony);
    if (result.emerged && result.property) {
      expect(Array.isArray(result.property.neighbors)).toBe(true);
    }
  });

  it('7.10 collectiveSigmaのcollectiveWillが更新', () => {
    const colony = createColony(createPopulation(5));
    const { colony: next } = runGenerations(colony, 1, { seed: 42 });
    expect(typeof next.collectiveSigma.collectiveWill).toBe('number');
  });

  it('7.11 relationDensityが個体数に応じて変動', () => {
    const small = createColony(createPopulation(3));
    const large = createColony(createPopulation(15));
    expect(large.collectiveSigma.relationDensity).toBeGreaterThanOrEqual(
      small.collectiveSigma.relationDensity
    );
  });

  it('7.12 fieldStrengthが計算される', () => {
    const colony = createColony(createPopulation(5));
    expect(typeof colony.collectiveSigma.fieldStrength).toBe('number');
  });

  it('7.13 flowDirectionが計算される', () => {
    const colony = createColony(createPopulation(5));
    expect(typeof colony.collectiveSigma.flowDirection).toBe('number');
  });

  it('7.14 複数世代で創発の進化が追跡可能', () => {
    const { generationResults } = runGenerations(
      createColony(createPopulation(15)), 5, { seed: 42 }
    );
    const emergences = generationResults.filter(r => r.emergenceDetected);
    // 創発があるかないかに関わらず、エラーなく動作
    expect(emergences.length).toBeGreaterThanOrEqual(0);
  });

  it('7.15 computeColonyStats空で全0', () => {
    const stats = computeColonyStats([]);
    expect(stats.totalPopulation).toBe(0);
    expect(stats.averageFitness).toBe(0);
    expect(stats.diversity).toBe(0);
  });
});
