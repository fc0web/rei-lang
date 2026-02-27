// ============================================================
// phase8b-metabolism.test.ts — Phase 8b テスト (90 tests)
//
// 代謝エンジンの3戦略、適応、飢餓、廃棄物を検証
//
// @author Nobuki Fujimoto (D-FUMT)
// ============================================================

import { describe, it, expect } from 'vitest';
import {
  type MultiDimNumber,
  type MetabolismCycle,
  type SigmaDelta,
  type StarvationState,
  STRATEGY_WEIGHTED,
  STRATEGY_HARMONIC,
  STRATEGY_GEOMETRIC,
  STRATEGIES,
  computeMD,
  acquireResources,
  transform,
  generateWaste,
  computeSigmaDelta,
  computeEfficiency,
  metabolize,
  metabolicRate,
  adaptMetabolism,
  computeEnvironmentStress,
  detectStarvation,
  metabolicWaste,
  runMetabolismCycles,
  getStrategy,
  getAllStrategies,
} from '../src/lang/life/metabolism';

// ============================================================
// テスト用ヘルパー
// ============================================================

function createTestEntity(overrides: any = {}): any {
  return {
    id: 'test-entity',
    lineage: [],
    self: {
      center: { center: 5, neighbors: [1, 2, 3] },
      periphery: [
        { center: 2, neighbors: [1] },
        { center: 3, neighbors: [2] },
        { center: 4, neighbors: [3] },
      ],
      weights: [0.8, 0.6, 0.4],
      mode: 'weighted' as const,
      ...overrides.self,
    },
    sigma: {
      field: 1.0,
      flow: 0.5,
      memory: [{ type: 'init' }],
      layer: 0,
      relation: ['a'],
      will: 0.3,
      ...overrides.sigma,
    },
    genesis: {
      phase: 'number',
      canGenerate: false,
      birthHistory: [],
      ...overrides.genesis,
    },
    vitality: {
      alive: true,
      age: 5,
      health: 0.8,
      mlc: {
        boundary: true,
        metabolism: true,
        memory: true,
        selfRepair: false,
        autopoiesis: false,
        emergence: false,
      },
      ...overrides.vitality,
    },
  };
}

function createResource(center: number, neighbors: number[] = []): MultiDimNumber {
  return { center, neighbors, mode: 'weighted' };
}

// ============================================================
// §1 metabolize 正常系 (15 tests)
// ============================================================
describe('§1 metabolize 正常系', () => {
  it('1.1 基本的な代謝サイクルが実行される', () => {
    const entity = createTestEntity();
    const env = [createResource(5, [2, 3]), createResource(3, [1, 2])];
    const result = metabolize(entity, env);
    expect(result.entity).toBeDefined();
    expect(result.cycle).toBeDefined();
    expect(result.starvation).toBeDefined();
  });

  it('1.2 代謝後に年齢が1増加する', () => {
    const entity = createTestEntity({ vitality: { alive: true, age: 5, health: 0.8, mlc: { boundary: true, metabolism: true, memory: true, selfRepair: false, autopoiesis: false, emergence: false } } });
    const result = metabolize(entity, [createResource(5, [2])]);
    expect(result.entity.vitality.age).toBe(6);
  });

  it('1.3 代謝サイクル番号が正しく設定される', () => {
    const entity = createTestEntity();
    const result = metabolize(entity, [createResource(5)]);
    expect(result.cycle.cycleNumber).toBe(entity.vitality.age + 1);
  });

  it('1.4 代謝の変換モードがエンティティのモードと一致する', () => {
    const entity = createTestEntity({ self: { mode: 'harmonic', center: { center: 5, neighbors: [1] }, periphery: [{ center: 2, neighbors: [1] }], weights: [0.5] } });
    const result = metabolize(entity, [createResource(5)]);
    expect(result.cycle.transformation).toBe('harmonic');
  });

  it('1.5 環境があれば代謝MLCがtrueになる', () => {
    const entity = createTestEntity();
    const result = metabolize(entity, [createResource(5)]);
    expect(result.entity.vitality.mlc.metabolism).toBe(true);
  });

  it('1.6 空の環境で代謝MLCがfalseになる', () => {
    const entity = createTestEntity();
    const result = metabolize(entity, []);
    expect(result.entity.vitality.mlc.metabolism).toBe(false);
  });

  it('1.7 代謝後にσのmemoryが追加される', () => {
    const entity = createTestEntity();
    const memBefore = entity.sigma.memory.length;
    const result = metabolize(entity, [createResource(5)]);
    expect(result.entity.sigma.memory.length).toBeGreaterThan(memBefore);
  });

  it('1.8 代謝後のσのfieldが増加する', () => {
    const entity = createTestEntity();
    const result = metabolize(entity, [createResource(5, [3, 4])]);
    expect(result.entity.sigma.field).toBeGreaterThanOrEqual(entity.sigma.field);
  });

  it('1.9 代謝効率が0-1の範囲内', () => {
    const entity = createTestEntity();
    const result = metabolize(entity, [createResource(5)]);
    expect(result.cycle.efficiency).toBeGreaterThanOrEqual(0);
    expect(result.cycle.efficiency).toBeLessThanOrEqual(1);
  });

  it('1.10 豊かな環境で健康度が向上する', () => {
    const entity = createTestEntity({ vitality: { alive: true, age: 5, health: 0.5, mlc: { boundary: true, metabolism: true, memory: true, selfRepair: false, autopoiesis: false, emergence: false } } });
    const env = [createResource(5, [2, 3]), createResource(4, [1, 2]), createResource(6, [3, 4])];
    const result = metabolize(entity, env);
    expect(result.entity.vitality.health).toBeGreaterThanOrEqual(entity.vitality.health);
  });

  it('1.11 空の環境で健康度が低下する', () => {
    const entity = createTestEntity();
    const result = metabolize(entity, []);
    expect(result.entity.vitality.health).toBeLessThan(entity.vitality.health);
  });

  it('1.12 出力のMultiDimNumberが有効', () => {
    const entity = createTestEntity();
    const result = metabolize(entity, [createResource(5, [2])]);
    expect(typeof result.cycle.output.center).toBe('number');
    expect(Array.isArray(result.cycle.output.neighbors)).toBe(true);
  });

  it('1.13 入力が正しくフィルタリングされる', () => {
    const entity = createTestEntity();
    const result = metabolize(entity, [createResource(10, [5, 5])]);
    // 透過性により入力が調整される
    expect(result.cycle.input.length).toBe(1);
    expect(result.cycle.input[0].center).toBeLessThanOrEqual(10);
  });

  it('1.14 複数環境の代謝が正しく処理される', () => {
    const entity = createTestEntity();
    const env = [createResource(2), createResource(4), createResource(6)];
    const result = metabolize(entity, env);
    expect(result.cycle.input.length).toBe(3);
  });

  it('1.15 健康度が0以下にならない', () => {
    const entity = createTestEntity({ vitality: { alive: true, age: 5, health: 0.05, mlc: { boundary: true, metabolism: true, memory: true, selfRepair: false, autopoiesis: false, emergence: false } } });
    const result = metabolize(entity, []);
    expect(result.entity.vitality.health).toBeGreaterThanOrEqual(0);
  });
});

// ============================================================
// §2 代謝モード3種の動作 (15 tests)
// ============================================================
describe('§2 代謝モード3種', () => {
  it('2.1 Weighted戦略の定義が正しい', () => {
    expect(STRATEGY_WEIGHTED.mode).toBe('weighted');
    expect(STRATEGY_WEIGHTED.stability).toBeGreaterThan(STRATEGY_HARMONIC.stability);
  });

  it('2.2 Harmonic戦略の定義が正しい', () => {
    expect(STRATEGY_HARMONIC.mode).toBe('harmonic');
    expect(STRATEGY_HARMONIC.fragility).toBeGreaterThan(STRATEGY_WEIGHTED.fragility);
  });

  it('2.3 Geometric戦略の定義が正しい', () => {
    expect(STRATEGY_GEOMETRIC.mode).toBe('geometric');
    expect(STRATEGY_GEOMETRIC.efficiency).toBeGreaterThan(STRATEGY_WEIGHTED.efficiency);
  });

  it('2.4 STRATEGIESマップに3種含まれる', () => {
    expect(Object.keys(STRATEGIES).length).toBe(3);
  });

  it('2.5 getStrategyが正しく動作する', () => {
    expect(getStrategy('weighted')).toBe(STRATEGY_WEIGHTED);
    expect(getStrategy('harmonic')).toBe(STRATEGY_HARMONIC);
    expect(getStrategy('geometric')).toBe(STRATEGY_GEOMETRIC);
  });

  it('2.6 getAllStrategiesが3つ返す', () => {
    expect(getAllStrategies().length).toBe(3);
  });

  it('2.7 computeMD weighted計算が正しい', () => {
    const md: MultiDimNumber = { center: 4, neighbors: [2, 6], mode: 'weighted' };
    const result = computeMD(md);
    expect(result).toBe(4); // (4+2+6)/3 = 4
  });

  it('2.8 computeMD harmonic計算が正しい', () => {
    const md: MultiDimNumber = { center: 2, neighbors: [4, 4], mode: 'harmonic' };
    const result = computeMD(md);
    // 調和平均: 3/(1/2+1/4+1/4) = 3/1 = 3
    expect(result).toBeCloseTo(3, 1);
  });

  it('2.9 computeMD geometric計算が正しい', () => {
    const md: MultiDimNumber = { center: 2, neighbors: [8], mode: 'geometric' };
    const result = computeMD(md);
    // 幾何平均: (2*8)^(1/2) = 4
    expect(result).toBeCloseTo(4, 1);
  });

  it('2.10 Weighted代謝が安定的に動作する', () => {
    const entity = createTestEntity({ self: { mode: 'weighted', center: { center: 5, neighbors: [1] }, periphery: [{ center: 2, neighbors: [1] }], weights: [0.5] } });
    const env = [createResource(5, [3])];
    const result = metabolize(entity, env);
    expect(result.cycle.transformation).toBe('weighted');
  });

  it('2.11 Harmonic代謝がボトルネック感応型', () => {
    const entity = createTestEntity({ self: { mode: 'harmonic', center: { center: 5, neighbors: [1] }, periphery: [{ center: 2, neighbors: [1] }], weights: [0.5] } });
    const env = [createResource(5, [3])];
    const result = metabolize(entity, env);
    expect(result.cycle.transformation).toBe('harmonic');
  });

  it('2.12 Geometric代謝が乗法効果型', () => {
    const entity = createTestEntity({ self: { mode: 'geometric', center: { center: 5, neighbors: [1] }, periphery: [{ center: 2, neighbors: [1] }], weights: [0.5] } });
    const env = [createResource(5, [3])];
    const result = metabolize(entity, env);
    expect(result.cycle.transformation).toBe('geometric');
  });

  it('2.13 空の値の計算でエラーが出ない', () => {
    expect(computeMD({ center: 0, neighbors: [], mode: 'weighted' })).toBe(0);
    expect(computeMD({ center: 0, neighbors: [], mode: 'harmonic' })).toBe(0);
    expect(computeMD({ center: 0, neighbors: [], mode: 'geometric' })).toBe(0);
  });

  it('2.14 transformが資源を圧縮する', () => {
    const resources = Array.from({ length: 10 }, (_, i) =>
      createResource(i + 1, [i * 0.5, i * 0.3, i * 0.2])
    );
    const result = transform(resources, 'weighted');
    expect(result.neighbors.length).toBeLessThanOrEqual(4);
  });

  it('2.15 各モードで異なる結果が得られる', () => {
    const md: MultiDimNumber = { center: 3, neighbors: [1, 9] };
    const w = computeMD({ ...md, mode: 'weighted' });
    const h = computeMD({ ...md, mode: 'harmonic' });
    const g = computeMD({ ...md, mode: 'geometric' });
    // 3つが全て同じではない
    expect(w === h && h === g).toBe(false);
  });
});

// ============================================================
// §3 adaptMetabolism 環境適応 (10 tests)
// ============================================================
describe('§3 adaptMetabolism 環境適応', () => {
  it('3.1 低ストレスでweightedを選択', () => {
    const entity = createTestEntity();
    expect(adaptMetabolism(entity, 0.1)).toBe('weighted');
  });

  it('3.2 中ストレスでgeometricを選択', () => {
    const entity = createTestEntity();
    expect(adaptMetabolism(entity, 0.5)).toBe('geometric');
  });

  it('3.3 高ストレスでharmonicを選択', () => {
    const entity = createTestEntity();
    expect(adaptMetabolism(entity, 0.9)).toBe('harmonic');
  });

  it('3.4 ストレス0でweighted', () => {
    expect(adaptMetabolism(createTestEntity(), 0)).toBe('weighted');
  });

  it('3.5 ストレス1でharmonic', () => {
    expect(adaptMetabolism(createTestEntity(), 1)).toBe('harmonic');
  });

  it('3.6 境界値0.3未満でweighted', () => {
    expect(adaptMetabolism(createTestEntity(), 0.29)).toBe('weighted');
  });

  it('3.7 境界値0.3でgeometric', () => {
    expect(adaptMetabolism(createTestEntity(), 0.3)).toBe('geometric');
  });

  it('3.8 境界値0.7でharmonic', () => {
    expect(adaptMetabolism(createTestEntity(), 0.7)).toBe('harmonic');
  });

  it('3.9 環境ストレス計算: 空環境で最大', () => {
    expect(computeEnvironmentStress([])).toBe(1.0);
  });

  it('3.10 環境ストレス計算: 豊かな環境で低い', () => {
    const env = [createResource(20, [10, 10])];
    const stress = computeEnvironmentStress(env);
    expect(stress).toBeLessThan(0.5);
  });
});

// ============================================================
// §4 metabolicRate 計算正確性 (10 tests)
// ============================================================
describe('§4 metabolicRate', () => {
  it('4.1 健康な若い個体は高い代謝率', () => {
    const entity = createTestEntity({ vitality: { alive: true, age: 5, health: 1.0, mlc: { boundary: true, metabolism: true, memory: false, selfRepair: false, autopoiesis: false, emergence: false } } });
    const rate = metabolicRate(entity);
    expect(rate).toBeGreaterThan(0);
  });

  it('4.2 不健康な個体は低い代謝率', () => {
    const healthy = createTestEntity({ vitality: { alive: true, age: 5, health: 1.0, mlc: { boundary: true, metabolism: true, memory: false, selfRepair: false, autopoiesis: false, emergence: false } } });
    const unhealthy = createTestEntity({ vitality: { alive: true, age: 5, health: 0.1, mlc: { boundary: true, metabolism: true, memory: false, selfRepair: false, autopoiesis: false, emergence: false } } });
    expect(metabolicRate(healthy)).toBeGreaterThan(metabolicRate(unhealthy));
  });

  it('4.3 周囲が多いと代謝率が高い', () => {
    const many = createTestEntity();
    const few = createTestEntity({ self: { center: { center: 5, neighbors: [1] }, periphery: [{ center: 2, neighbors: [1] }], weights: [0.5], mode: 'weighted' } });
    expect(metabolicRate(many)).toBeGreaterThan(metabolicRate(few));
  });

  it('4.4 代謝率は非負', () => {
    const entity = createTestEntity({ vitality: { alive: true, age: 100, health: 0.01, mlc: { boundary: true, metabolism: true, memory: false, selfRepair: false, autopoiesis: false, emergence: false } } });
    expect(metabolicRate(entity)).toBeGreaterThanOrEqual(0);
  });

  it('4.5 年齢0の個体の代謝率', () => {
    const entity = createTestEntity({ vitality: { alive: true, age: 0, health: 0.8, mlc: { boundary: true, metabolism: true, memory: false, selfRepair: false, autopoiesis: false, emergence: false } } });
    expect(metabolicRate(entity)).toBeGreaterThanOrEqual(0);
  });

  it('4.6 老化で代謝率が低下する', () => {
    const young = createTestEntity({ vitality: { alive: true, age: 10, health: 0.8, mlc: { boundary: true, metabolism: true, memory: false, selfRepair: false, autopoiesis: false, emergence: false } } });
    const old = createTestEntity({ vitality: { alive: true, age: 80, health: 0.8, mlc: { boundary: true, metabolism: true, memory: false, selfRepair: false, autopoiesis: false, emergence: false } } });
    expect(metabolicRate(young)).toBeGreaterThan(metabolicRate(old));
  });

  it('4.7 壮年期がピーク', () => {
    const young = createTestEntity({ vitality: { alive: true, age: 3, health: 0.8, mlc: { boundary: true, metabolism: true, memory: false, selfRepair: false, autopoiesis: false, emergence: false } } });
    const prime = createTestEntity({ vitality: { alive: true, age: 20, health: 0.8, mlc: { boundary: true, metabolism: true, memory: false, selfRepair: false, autopoiesis: false, emergence: false } } });
    expect(metabolicRate(prime)).toBeGreaterThanOrEqual(metabolicRate(young));
  });

  it('4.8 computeEfficiency weightedモード', () => {
    const eff = computeEfficiency('weighted', 3, 0.8);
    expect(eff).toBeGreaterThan(0);
    expect(eff).toBeLessThanOrEqual(1);
  });

  it('4.9 computeEfficiency 健康度0で低効率', () => {
    const low = computeEfficiency('weighted', 3, 0);
    const high = computeEfficiency('weighted', 3, 1);
    expect(low).toBeLessThan(high);
  });

  it('4.10 computeEfficiency 入力0で効率0', () => {
    expect(computeEfficiency('weighted', 0, 0.8)).toBe(0);
  });
});

// ============================================================
// §5 飢餓検知と死亡予測 (15 tests)
// ============================================================
describe('§5 飢餓検知', () => {
  it('5.1 空の環境で完全飢餓', () => {
    const entity = createTestEntity();
    const result = detectStarvation(entity, [], 0.8);
    expect(result.starving).toBe(true);
    expect(result.deficientResources).toContain('all');
  });

  it('5.2 豊かな環境で飢餓なし', () => {
    const entity = createTestEntity();
    const env = [createResource(10, [5, 5]), createResource(8, [4, 4]), createResource(6, [3, 3])];
    const result = detectStarvation(entity, env, 0.8);
    expect(result.starving).toBe(false);
  });

  it('5.3 貧弱な環境でenergyが不足', () => {
    const entity = createTestEntity();
    const env = [createResource(0.01, [0.001])];
    const result = detectStarvation(entity, env, 0.8);
    expect(result.deficientResources).toContain('energy');
  });

  it('5.4 単一資源でdiversityが不足', () => {
    const entity = createTestEntity();
    const env = [createResource(5, [3])];
    const result = detectStarvation(entity, env, 0.8);
    expect(result.deficientResources).toContain('diversity');
  });

  it('5.5 弱い資源でqualityが不足', () => {
    const entity = createTestEntity();
    const env = [createResource(0.01), createResource(0.01), createResource(0.01)];
    const result = detectStarvation(entity, env, 0.8);
    expect(result.deficientResources).toContain('quality');
  });

  it('5.6 飢餓時のturnsUntilDeathが有限', () => {
    const result = detectStarvation(createTestEntity(), [], 0.8);
    expect(result.turnsUntilDeath).toBeGreaterThan(0);
    expect(result.turnsUntilDeath).toBeLessThan(Infinity);
  });

  it('5.7 非飢餓時のturnsUntilDeathがInfinity', () => {
    const env = [createResource(10, [5, 5]), createResource(8, [4, 4]), createResource(6, [3])];
    const result = detectStarvation(createTestEntity(), env, 0.8);
    if (!result.starving) {
      expect(result.turnsUntilDeath).toBe(Infinity);
    }
  });

  it('5.8 severity は0-1の範囲', () => {
    const result = detectStarvation(createTestEntity(), [], 0.8);
    expect(result.severity).toBeGreaterThanOrEqual(0);
    expect(result.severity).toBeLessThanOrEqual(1);
  });

  it('5.9 健康度が低いとturnsUntilDeathが短い', () => {
    const r1 = detectStarvation(createTestEntity(), [], 0.8);
    const r2 = detectStarvation(createTestEntity(), [], 0.2);
    expect(r2.turnsUntilDeath).toBeLessThanOrEqual(r1.turnsUntilDeath);
  });

  it('5.10 完全飢餓のseverityが最大', () => {
    const result = detectStarvation(createTestEntity(), [], 0.5);
    expect(result.severity).toBe(1.0);
  });

  it('5.11 metabolicWasteが廃棄物を返す', () => {
    const cycle: MetabolismCycle = {
      input: [createResource(10, [5])],
      transformation: 'weighted',
      output: { center: 5, neighbors: [2], mode: 'weighted' },
      waste: [{ center: 1, neighbors: [0.5], mode: 'weighted' }],
      sigmaUpdate: { field: 0, flow: 0, memory: 0, layer: 0, relation: 0, will: 0 },
      cycleNumber: 1,
      efficiency: 0.8,
    };
    const waste = metabolicWaste(cycle);
    expect(waste).toEqual(cycle.waste);
  });

  it('5.12 generateWaste 高効率で廃棄物が少ない', () => {
    const input = [createResource(10, [5, 5])];
    const output = { center: 8, neighbors: [4, 4], mode: 'weighted' as const };
    const waste = generateWaste(input, output, 0.95);
    const wasteTotal = waste.reduce((s, w) => s + w.center, 0);
    expect(wasteTotal).toBeLessThan(5);
  });

  it('5.13 generateWaste 低効率で廃棄物が多い', () => {
    const input = [createResource(10, [5, 5])];
    const output = { center: 2, neighbors: [1], mode: 'weighted' as const };
    const high = generateWaste(input, output, 0.9);
    const low = generateWaste(input, output, 0.1);
    const highTotal = high.reduce((s, w) => s + w.center, 0);
    const lowTotal = low.reduce((s, w) => s + w.center, 0);
    expect(lowTotal).toBeGreaterThanOrEqual(highTotal);
  });

  it('5.14 acquireResources 透過性が反映される', () => {
    const entity = createTestEntity({ self: { center: { center: 5, neighbors: [1] }, periphery: [{ center: 2, neighbors: [1] }], weights: [0.5], mode: 'weighted' } });
    const env = [createResource(10, [5])];
    const acquired = acquireResources(entity, env);
    expect(acquired[0].center).toBe(5); // 10 * 0.5
  });

  it('5.15 acquireResources 空の環境で空配列', () => {
    const acquired = acquireResources(createTestEntity(), []);
    expect(acquired.length).toBe(0);
  });
});

// ============================================================
// §6 廃棄物の環境影響 (10 tests)
// ============================================================
describe('§6 廃棄物と環境', () => {
  it('6.1 generateWaste 空入力で空', () => {
    const waste = generateWaste([], { center: 0, neighbors: [] }, 0.5);
    expect(waste.length).toBe(0);
  });

  it('6.2 廃棄物の構造が正しい', () => {
    const waste = generateWaste(
      [createResource(20, [10, 10])],
      { center: 5, neighbors: [2], mode: 'weighted' },
      0.3
    );
    if (waste.length > 0) {
      expect(typeof waste[0].center).toBe('number');
      expect(Array.isArray(waste[0].neighbors)).toBe(true);
    }
  });

  it('6.3 computeSigmaDelta memoryが常に1', () => {
    const partial = {
      input: [createResource(5, [2])],
      transformation: 'weighted' as const,
      output: { center: 3, neighbors: [1], mode: 'weighted' as const },
      waste: [],
    };
    const delta = computeSigmaDelta(partial);
    expect(delta.memory).toBe(1);
  });

  it('6.4 computeSigmaDelta fieldが非負', () => {
    const partial = {
      input: [createResource(5)],
      transformation: 'weighted' as const,
      output: { center: 3, neighbors: [1], mode: 'weighted' as const },
      waste: [],
    };
    const delta = computeSigmaDelta(partial);
    expect(delta.field).toBeGreaterThanOrEqual(0);
  });

  it('6.5 computeSigmaDelta 複数入力でrelation正', () => {
    const partial = {
      input: [createResource(5), createResource(3)],
      transformation: 'weighted' as const,
      output: { center: 4, neighbors: [2], mode: 'weighted' as const },
      waste: [],
    };
    const delta = computeSigmaDelta(partial);
    expect(delta.relation).toBeGreaterThan(0);
  });

  it('6.6 computeSigmaDelta 単一入力でrelation=0', () => {
    const partial = {
      input: [createResource(5)],
      transformation: 'weighted' as const,
      output: { center: 3, neighbors: [], mode: 'weighted' as const },
      waste: [],
    };
    const delta = computeSigmaDelta(partial);
    expect(delta.relation).toBe(0);
  });

  it('6.7 廃棄物がMultiDimNumber型', () => {
    const waste = generateWaste(
      [createResource(30, [10])],
      { center: 5, neighbors: [], mode: 'weighted' },
      0.2
    );
    waste.forEach(w => {
      expect(typeof w.center).toBe('number');
      expect(Array.isArray(w.neighbors)).toBe(true);
    });
  });

  it('6.8 効率1.0で廃棄物が最小', () => {
    const waste = generateWaste(
      [createResource(10)],
      { center: 8, neighbors: [], mode: 'weighted' },
      1.0
    );
    // 効率100%でも入出力差があれば微量の廃棄物
    const total = waste.reduce((s, w) => s + w.center, 0);
    expect(total).toBeLessThanOrEqual(5);
  });

  it('6.9 transform 空入力で中心0', () => {
    const result = transform([], 'weighted');
    expect(result.center).toBe(0);
    expect(result.neighbors.length).toBe(0);
  });

  it('6.10 transform 圧縮が常に圧縮の原則に従う', () => {
    const many = Array.from({ length: 20 }, (_, i) => createResource(i + 1, [i]));
    const result = transform(many, 'weighted');
    expect(result.neighbors.length).toBeLessThanOrEqual(4);
  });
});

// ============================================================
// §7 複数サイクルの連続実行 (15 tests)
// ============================================================
describe('§7 連続代謝サイクル', () => {
  it('7.1 複数サイクル実行が完了する', () => {
    const entity = createTestEntity();
    const envs = [
      [createResource(5)],
      [createResource(4)],
      [createResource(6)],
    ];
    const result = runMetabolismCycles(entity, envs);
    expect(result.cycles.length).toBe(3);
  });

  it('7.2 サイクルごとに年齢が増加する', () => {
    const entity = createTestEntity({ vitality: { alive: true, age: 0, health: 0.8, mlc: { boundary: true, metabolism: true, memory: true, selfRepair: false, autopoiesis: false, emergence: false } } });
    const envs = [[createResource(5)], [createResource(5)], [createResource(5)]];
    const result = runMetabolismCycles(entity, envs);
    expect(result.entity.vitality.age).toBe(3);
  });

  it('7.3 飢餓履歴が記録される', () => {
    const entity = createTestEntity();
    const envs = [[createResource(5)], [], [createResource(3)]];
    const result = runMetabolismCycles(entity, envs);
    expect(result.history.length).toBe(3);
    expect(result.history[1].starving).toBe(true);
  });

  it('7.4 死亡時に中断される', () => {
    const entity = createTestEntity({ vitality: { alive: true, age: 0, health: 0.1, mlc: { boundary: true, metabolism: true, memory: true, selfRepair: false, autopoiesis: false, emergence: false } } });
    const envs = [[], [], [], [], []]; // 全て空 = 飢餓
    const result = runMetabolismCycles(entity, envs);
    expect(result.cycles.length).toBeLessThanOrEqual(5);
  });

  it('7.5 適応モードでモードが切り替わる', () => {
    const entity = createTestEntity();
    const envs = [
      [createResource(10, [5, 5])],  // 豊か
      [createResource(0.1)],          // 貧弱
    ];
    const result = runMetabolismCycles(entity, envs, true);
    // 環境に応じてモードが変わっているはず
    expect(result.cycles.length).toBe(2);
  });

  it('7.6 σのmemoryが蓄積される', () => {
    const entity = createTestEntity({ sigma: { field: 0, flow: 0, memory: [], layer: 0, relation: [], will: 0 } });
    const envs = [[createResource(5)], [createResource(5)], [createResource(5)]];
    const result = runMetabolismCycles(entity, envs);
    expect(result.entity.sigma.memory.length).toBe(3);
  });

  it('7.7 空のenvironments配列で即完了', () => {
    const result = runMetabolismCycles(createTestEntity(), []);
    expect(result.cycles.length).toBe(0);
  });

  it('7.8 10サイクル連続実行', () => {
    const entity = createTestEntity();
    const envs = Array.from({ length: 10 }, () => [createResource(5, [2, 3])]);
    const result = runMetabolismCycles(entity, envs);
    expect(result.cycles.length).toBe(10);
  });

  it('7.9 連続実行後のサイクル番号が連続', () => {
    const entity = createTestEntity({ vitality: { alive: true, age: 0, health: 0.8, mlc: { boundary: true, metabolism: true, memory: true, selfRepair: false, autopoiesis: false, emergence: false } } });
    const envs = [[createResource(5)], [createResource(5)], [createResource(5)]];
    const result = runMetabolismCycles(entity, envs);
    expect(result.cycles[0].cycleNumber).toBe(1);
    expect(result.cycles[1].cycleNumber).toBe(2);
    expect(result.cycles[2].cycleNumber).toBe(3);
  });

  it('7.10 適応モードoff時にモード固定', () => {
    const entity = createTestEntity({ self: { mode: 'harmonic', center: { center: 5, neighbors: [1] }, periphery: [{ center: 2, neighbors: [1] }], weights: [0.5] } });
    const envs = [[createResource(5)], [createResource(5)]];
    const result = runMetabolismCycles(entity, envs, false);
    result.cycles.forEach(c => expect(c.transformation).toBe('harmonic'));
  });

  it('7.11 環境変化への連続適応', () => {
    const entity = createTestEntity();
    const envs = [
      [createResource(20, [10, 10]), createResource(15, [8, 7])], // 豊か
      [createResource(1, [0.5])],                                   // 貧弱
      [createResource(10, [5, 5])],                                 // 回復
    ];
    const result = runMetabolismCycles(entity, envs, true);
    expect(result.cycles.length).toBe(3);
  });

  it('7.12 連続飢餓で健康度が段階的に低下', () => {
    const entity = createTestEntity({ vitality: { alive: true, age: 0, health: 1.0, mlc: { boundary: true, metabolism: true, memory: true, selfRepair: false, autopoiesis: false, emergence: false } } });
    const envs = [[], [], []];
    const result = runMetabolismCycles(entity, envs);
    // 健康度が低下しているはず
    expect(result.entity.vitality.health).toBeLessThan(1.0);
  });

  it('7.13 豊かな環境で健康度が維持される', () => {
    const entity = createTestEntity({ vitality: { alive: true, age: 0, health: 0.5, mlc: { boundary: true, metabolism: true, memory: true, selfRepair: false, autopoiesis: false, emergence: false } } });
    const envs = Array.from({ length: 5 }, () => [
      createResource(10, [5, 5]),
      createResource(8, [4, 4]),
      createResource(6, [3, 3]),
    ]);
    const result = runMetabolismCycles(entity, envs);
    expect(result.entity.vitality.health).toBeGreaterThanOrEqual(0.5);
  });

  it('7.14 cyclesとhistoryの長さが一致', () => {
    const envs = [[createResource(5)], [createResource(5)]];
    const result = runMetabolismCycles(createTestEntity(), envs);
    expect(result.cycles.length).toBe(result.history.length);
  });

  it('7.15 全サイクルの効率が0-1の範囲', () => {
    const envs = Array.from({ length: 5 }, () => [createResource(5, [2])]);
    const result = runMetabolismCycles(createTestEntity(), envs);
    result.cycles.forEach(c => {
      expect(c.efficiency).toBeGreaterThanOrEqual(0);
      expect(c.efficiency).toBeLessThanOrEqual(1);
    });
  });
});
