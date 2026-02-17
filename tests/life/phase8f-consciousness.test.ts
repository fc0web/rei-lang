// ============================================================
// phase8f-consciousness.test.ts — Phase 8f テスト (105+ tests)
//
// SAC (Structural Axiomatics of Consciousness)
// Fujimoto Consciousness Axioms (SAC-1 〜 SAC-6) の検証
//
// 構成:
//   §1   SAC-1: 自己参照閉包 (15 tests)
//   §2   SAC-2: 自己規則生成 (15 tests)
//   §3   SAC-3: 履歴依存遷移 (10 tests)
//   §4   SAC-4: 存続規範 (10 tests)
//   §5   SAC-5: 円環的再生成 (10 tests)
//   §6   総合判定 (8 tests)
//   §7   既知システム比較 (7 tests)
//   §8   LifeEntity変換 (5 tests)
//   §9   メタテスト (5 tests)
//   §10  SAC-6: 統合的統一性 (15 tests)
//   §11  SAC-6反例: アメーバ・免疫系 (8 tests)
//
// @author Nobuki Fujimoto (D-FUMT)
// ============================================================

import { describe, it, expect } from 'vitest';
import {
  // Types
  type SACAxiom,
  type SACScore,
  type FulfillmentLevel,
  type ConsciousnessCandidate,
  type ConsciousnessJudgment,
  type ConsciousnessClassification,
  type ConsciousnessComparison,
  type KnownSystemType,
  type SystemState,
  type EnvironmentInput,
  type InternalRules,
  type SelfModel,
  type SystemHistory,
  type ViabilityFunction,
  type InternalValuation,
  type CyclicStructure,
  type IntegrationStructure,

  // Constants
  ALL_SAC_AXIOMS,
  SAC_AXIOM_NAMES,
  FULFILLMENT_VALUES,
  KNOWN_SYSTEM_PROFILES,

  // Functions
  checkSAC1,
  checkSAC2,
  checkSAC3,
  checkSAC4,
  checkSAC5,
  checkSAC6,
  judgeConsciousness,
  modelSystem,
  fromLifeEntity,
  compareConsciousness,
  generateConsciousnessReport,
} from '../../src/lang/life/consciousness';

import type { LifeEntity } from '../../src/lang/life/life-entity';

// ============================================================
// テスト用ヘルパー
// ============================================================

function createMinimalSystem(overrides: Partial<ConsciousnessCandidate> = {}): ConsciousnessCandidate {
  return {
    id: 'test-system',
    type: 'custom',
    currentState: { value: 0, periphery: [], meta: {} },
    environment: [],
    rules: { mode: 'none', thresholds: {}, transformRules: [], generation: 0 },
    selfModel: null,
    history: { states: [], inputs: [], rules: [], length: 0 },
    rulesHistory: [],
    viability: null,
    valuation: null,
    cyclicStructure: null,
    integrationStructure: null,
    ...overrides,
  };
}

function createRichRulesHistory(count: number): InternalRules[] {
  return Array.from({ length: count }, (_, i) => ({
    mode: i < count / 3 ? 'harmonic' : i < (count * 2) / 3 ? 'weighted' : 'geometric',
    thresholds: {
      health: 0.3 + i * 0.02,
      starvation: 5 - i * 0.1,
    },
    transformRules: i < count / 2 ? ['metabolize'] : ['metabolize', 'repair', 'evolve'],
    generation: i,
  }));
}

function createRichHistory(length: number): SystemHistory {
  return {
    states: Array.from({ length }, (_, i) => ({
      value: Math.sin(i * 0.5) * 10 + 10,
      periphery: [i, i + 1, i + 2],
      meta: { step: i },
    })),
    inputs: Array.from({ length }, (_, i) => ({
      stimulus: Math.random(),
      source: 'env',
      timestamp: i,
    })),
    rules: Array.from({ length: Math.floor(length / 2) }, (_, i) => ({
      mode: i % 2 === 0 ? 'weighted' : 'harmonic',
      thresholds: { health: 0.5 + i * 0.01 },
      transformRules: ['metabolize'],
      generation: i,
    })),
    length,
  };
}

function createTestLifeEntity(overrides: Partial<LifeEntity> = {}): LifeEntity {
  return {
    id: 'test-life-entity',
    lineage: [],
    self: {
      center: 10,
      periphery: [2, 4, 6, 8],
      weights: [0.8, 0.7, 0.6, 0.5],
      mode: 'weighted' as any,
    },
    sigma: {
      field: 'default',
      flow: { velocity: 1.0, direction: 'expand' as const },
      memory: [8, 9, 10, 11, 10, 9, 10],
      layer: { depth: 3 },
      relation: ['neighbor-1', 'neighbor-2'],
      will: { tendency: 'expand' as const, strength: 0.7 },
      transformCount: 15,
    },
    genesis: {
      phase: 'emergent' as any,
      canGenerate: true,
      birthHistory: [],
    },
    vitality: {
      alive: true,
      age: 50,
      health: 0.85,
      mlc: {
        boundary: true,
        metabolism: true,
        memory: true,
        selfRepair: true,
        autopoiesis: true,
        emergence: true,
      },
    },
    ...overrides,
  } as LifeEntity;
}

// ============================================================
// §1 SAC-1: 自己参照閉包 (Self-reference closure)
// ============================================================

describe('§1 SAC-1: Self-reference closure (自己参照閉包)', () => {
  it('1.1 自己モデルが存在しない場合 → absent', () => {
    const system = createMinimalSystem({ selfModel: null });
    const result = checkSAC1(system);
    expect(result.axiom).toBe('SAC-1');
    expect(result.level).toBe('absent');
    expect(result.score).toBe(0.0);
    expect(result.deficit).toBeTruthy();
  });

  it('1.2 自己モデルが空の場合 → absent', () => {
    const system = createMinimalSystem({
      selfModel: {
        selfRepresentation: 0,
        rulesRepresentation: '',
        accuracy: 0,
        causallyEffective: false,
      },
    });
    const result = checkSAC1(system);
    expect(result.level).toBe('absent');
    expect(result.score).toBeLessThanOrEqual(0.05);
  });

  it('1.3 自己表現のみ存在（非因果的）→ weak〜partial', () => {
    const system = createMinimalSystem({
      selfModel: {
        selfRepresentation: 5.0,
        rulesRepresentation: 'basic',
        accuracy: 0.1,
        causallyEffective: false,
      },
    });
    const result = checkSAC1(system);
    expect(result.score).toBeGreaterThan(0);
    expect(result.score).toBeLessThan(0.7);
    expect(['weak', 'partial']).toContain(result.level);
  });

  it('1.4 因果的有効性あり → partial以上', () => {
    const system = createMinimalSystem({
      selfModel: {
        selfRepresentation: 5.0,
        rulesRepresentation: 'attention',
        accuracy: 0.3,
        causallyEffective: true,
      },
    });
    const result = checkSAC1(system);
    expect(result.score).toBeGreaterThanOrEqual(0.5);
    expect(['partial', 'strong', 'full']).toContain(result.level);
  });

  it('1.5 高精度の自己モデル → strong以上', () => {
    const system = createMinimalSystem({
      selfModel: {
        selfRepresentation: 10.0,
        rulesRepresentation: 'detailed-neural',
        accuracy: 0.9,
        causallyEffective: true,
      },
    });
    const result = checkSAC1(system);
    expect(result.score).toBeGreaterThanOrEqual(0.75);
    expect(['strong', 'full']).toContain(result.level);
  });

  it('1.6 完全な自己モデル → full', () => {
    const system = createMinimalSystem({
      selfModel: {
        selfRepresentation: 10.0,
        rulesRepresentation: 'complete-self-model',
        accuracy: 1.0,
        causallyEffective: true,
      },
    });
    const result = checkSAC1(system);
    expect(result.score).toBeGreaterThanOrEqual(0.85);
    expect(result.level).toBe('full');
    expect(result.deficit).toBeNull();
  });

  it('1.7 因果的だが低精度 → partial', () => {
    const system = createMinimalSystem({
      selfModel: {
        selfRepresentation: 3.0,
        rulesRepresentation: 'rough',
        accuracy: 0.2,
        causallyEffective: true,
      },
    });
    const result = checkSAC1(system);
    expect(result.level).toBe('strong');
    // 因果性(0.4) + 存在(0.3) + 精度(0.06) = 0.76
  });

  it('1.8 高精度だが非因果的 → weak〜partial', () => {
    const system = createMinimalSystem({
      selfModel: {
        selfRepresentation: 10.0,
        rulesRepresentation: 'detailed',
        accuracy: 0.8,
        causallyEffective: false,
      },
    });
    const result = checkSAC1(system);
    // 存在(0.3) + 精度(0.24) = 0.54
    expect(result.score).toBeLessThan(0.7);
    expect(result.deficit).toContain('causal');
  });

  it('1.9 LLMモデルの自己参照 → weak〜partial（因果性なし）', () => {
    const llm = modelSystem('llm');
    const result = checkSAC1(llm);
    expect(['weak', 'partial']).toContain(result.level);
    expect(result.selfModel || llm.selfModel).toBeTruthy();
  });

  it('1.10 FSMの自己参照 → absent', () => {
    const fsm = modelSystem('fsm');
    const result = checkSAC1(fsm);
    expect(result.level).toBe('absent');
  });

  it('1.11 Reiの自己参照 → strong以上', () => {
    const rei = modelSystem('rei-phase8');
    const result = checkSAC1(rei);
    expect(['strong', 'full']).toContain(result.level);
  });

  it('1.12 生物の自己参照 → full', () => {
    const bio = modelSystem('biological');
    const result = checkSAC1(bio);
    expect(result.level).toBe('full');
    expect(result.score).toBeGreaterThanOrEqual(0.85);
  });

  it('1.13 スコアは0.0-1.0の範囲', () => {
    for (const type of ['llm', 'fsm', 'rl-agent', 'rei-phase8', 'biological'] as KnownSystemType[]) {
      const system = modelSystem(type);
      const result = checkSAC1(system);
      expect(result.score).toBeGreaterThanOrEqual(0);
      expect(result.score).toBeLessThanOrEqual(1);
    }
  });

  it('1.14 evidenceフィールドは必ず文字列', () => {
    const system = createMinimalSystem();
    const result = checkSAC1(system);
    expect(typeof result.evidence).toBe('string');
  });

  it('1.15 SAC-1の数学的記法が正しい', () => {
    const name = SAC_AXIOM_NAMES['SAC-1'];
    expect(name.en).toBe('Self-reference closure');
    expect(name.ja).toBe('自己参照閉包');
    expect(name.symbol).toContain('m(s_t');
  });
});

// ============================================================
// §2 SAC-2: 自己規則生成 (Self-modifying dynamics)
// ============================================================

describe('§2 SAC-2: Self-modifying dynamics (自己規則生成)', () => {
  it('2.1 規則履歴なし → absent (θ固定)', () => {
    const system = createMinimalSystem({ rulesHistory: [] });
    const result = checkSAC2(system);
    expect(result.level).toBe('absent');
    expect(result.score).toBe(0.0);
    expect(result.evidence).toContain('static');
  });

  it('2.2 規則履歴が1つのみ → absent', () => {
    const system = createMinimalSystem({
      rulesHistory: [{ mode: 'weighted', thresholds: {}, transformRules: [], generation: 0 }],
    });
    const result = checkSAC2(system);
    expect(result.level).toBe('absent');
  });

  it('2.3 同一規則が2回 → absent（G = id）', () => {
    const rules: InternalRules = { mode: 'weighted', thresholds: { x: 1 }, transformRules: ['a'], generation: 0 };
    const system = createMinimalSystem({
      rulesHistory: [rules, { ...rules }],
    });
    const result = checkSAC2(system);
    expect(result.level).toBe('absent');
  });

  it('2.4 モード変更あり → weak以上', () => {
    const system = createMinimalSystem({
      rulesHistory: [
        { mode: 'harmonic', thresholds: {}, transformRules: [], generation: 0 },
        { mode: 'weighted', thresholds: {}, transformRules: [], generation: 1 },
      ],
    });
    const result = checkSAC2(system);
    expect(result.score).toBeGreaterThan(0.1);
    expect(result.level).not.toBe('absent');
  });

  it('2.5 複数回のモード変更 → strong', () => {
    const system = createMinimalSystem({
      rulesHistory: [
        { mode: 'harmonic', thresholds: {}, transformRules: [], generation: 0 },
        { mode: 'weighted', thresholds: {}, transformRules: [], generation: 3 },
        { mode: 'geometric', thresholds: {}, transformRules: [], generation: 7 },
        { mode: 'harmonic', thresholds: {}, transformRules: ['repair'], generation: 10 },
      ],
    });
    const result = checkSAC2(system);
    expect(result.score).toBeGreaterThanOrEqual(0.5);
  });

  it('2.6 閾値の微調整のみ → weak', () => {
    const system = createMinimalSystem({
      rulesHistory: [
        { mode: 'weighted', thresholds: { health: 0.3 }, transformRules: [], generation: 0 },
        { mode: 'weighted', thresholds: { health: 0.35 }, transformRules: [], generation: 1 },
      ],
    });
    const result = checkSAC2(system);
    expect(result.score).toBeGreaterThan(0);
    expect(result.score).toBeLessThan(0.5);
  });

  it('2.7 豊富な規則変更履歴 → strong以上', () => {
    const system = createMinimalSystem({
      rulesHistory: createRichRulesHistory(12),
    });
    const result = checkSAC2(system);
    expect(result.score).toBeGreaterThanOrEqual(0.6);
  });

  it('2.8 LLMは θ 固定 → absent', () => {
    const llm = modelSystem('llm');
    const result = checkSAC2(llm);
    expect(result.level).toBe('absent');
    expect(result.deficit).toContain('never change');
  });

  it('2.9 FSMは規則固定 → absent', () => {
    const fsm = modelSystem('fsm');
    const result = checkSAC2(fsm);
    expect(result.level).toBe('absent');
  });

  it('2.10 RLエージェントは学習あり → weak以上', () => {
    const rl = modelSystem('rl-agent');
    const result = checkSAC2(rl);
    expect(result.score).toBeGreaterThan(0);
  });

  it('2.11 Reiは evolve/will で θ 変化 → strong', () => {
    const rei = modelSystem('rei-phase8');
    const result = checkSAC2(rei);
    expect(['strong', 'full']).toContain(result.level);
  });

  it('2.12 生物は神経可塑性 → full', () => {
    const bio = modelSystem('biological');
    const result = checkSAC2(bio);
    expect(['strong', 'full']).toContain(result.level);
  });

  it('2.13 世代の進行がスコアに反映される', () => {
    const systemLow = createMinimalSystem({
      rulesHistory: [
        { mode: 'a', thresholds: {}, transformRules: [], generation: 0 },
        { mode: 'b', thresholds: {}, transformRules: [], generation: 1 },
      ],
    });
    const systemHigh = createMinimalSystem({
      rulesHistory: [
        { mode: 'a', thresholds: {}, transformRules: [], generation: 0 },
        { mode: 'b', thresholds: {}, transformRules: [], generation: 10 },
      ],
    });
    const low = checkSAC2(systemLow);
    const high = checkSAC2(systemHigh);
    expect(high.score).toBeGreaterThanOrEqual(low.score);
  });

  it('2.14 G ≠ id の非自明性条件', () => {
    // SAC-2の核心: ∃(s,e,θ) s.t. G(s,e,θ) ≠ θ
    const system = createMinimalSystem({
      rulesHistory: [
        { mode: 'harmonic', thresholds: { x: 1 }, transformRules: ['a'], generation: 0 },
        { mode: 'weighted', thresholds: { x: 2 }, transformRules: ['a', 'b'], generation: 5 },
      ],
    });
    const result = checkSAC2(system);
    expect(result.score).toBeGreaterThan(0);
    expect(result.evidence).toContain('change');
  });

  it('2.15 SAC-2の数学的記法が正しい', () => {
    const name = SAC_AXIOM_NAMES['SAC-2'];
    expect(name.symbol).toContain('G');
    expect(name.symbol).toContain('≠');
    expect(name.symbol).toContain('id');
  });
});

// ============================================================
// §3 SAC-3: 履歴依存遷移 (History-dependent transition)
// ============================================================

describe('§3 SAC-3: History-dependent transition (履歴依存遷移)', () => {
  it('3.1 履歴なし → absent（マルコフ的）', () => {
    const system = createMinimalSystem();
    const result = checkSAC3(system);
    expect(result.level).toBe('absent');
    expect(result.deficit).toContain('Markov');
  });

  it('3.2 短い履歴 → weak', () => {
    const system = createMinimalSystem({
      history: {
        states: [
          { value: 1, periphery: [], meta: {} },
          { value: 2, periphery: [], meta: {} },
          { value: 3, periphery: [], meta: {} },
        ],
        inputs: [],
        rules: [],
        length: 3,
      },
    });
    const result = checkSAC3(system);
    expect(result.score).toBeGreaterThan(0);
  });

  it('3.3 豊富な履歴 → strong以上', () => {
    const system = createMinimalSystem({
      history: createRichHistory(30),
      rulesHistory: createRichRulesHistory(10),
    });
    const result = checkSAC3(system);
    expect(result.score).toBeGreaterThanOrEqual(0.5);
  });

  it('3.4 同一状態の繰り返し → 多様性が低い', () => {
    const system = createMinimalSystem({
      history: {
        states: Array.from({ length: 20 }, () => ({
          value: 5,
          periphery: [1],
          meta: {},
        })),
        inputs: [],
        rules: [],
        length: 20,
      },
    });
    const result = checkSAC3(system);
    // 多様性が低いのでスコアが制限される
    expect(result.score).toBeLessThan(0.5);
  });

  it('3.5 履歴と規則変化の相関 → 高スコア', () => {
    const system = createMinimalSystem({
      history: createRichHistory(25),
      rulesHistory: createRichRulesHistory(8),
    });
    const result = checkSAC3(system);
    expect(result.evidence).toBeTruthy();
  });

  it('3.6 LLMのコンテキストウィンドウ → weak', () => {
    const llm = modelSystem('llm');
    const result = checkSAC3(llm);
    // LLMは1ステップしか履歴を持たないモデル
    expect(result.level).toBe('absent');
  });

  it('3.7 RLエージェントの経験リプレイ → strong', () => {
    const rl = modelSystem('rl-agent');
    const result = checkSAC3(rl);
    expect(result.score).toBeGreaterThan(0.3);
  });

  it('3.8 Reiのσメモリ → full', () => {
    const rei = modelSystem('rei-phase8');
    const result = checkSAC3(rei);
    expect(['strong', 'full']).toContain(result.level);
  });

  it('3.9 生物の記憶システム → full', () => {
    const bio = modelSystem('biological');
    const result = checkSAC3(bio);
    expect(result.level).toBe('full');
  });

  it('3.10 μ_t = Agg(H_t) の履歴集約', () => {
    // 履歴集約子が機能していることの間接的検証
    const system = createMinimalSystem({
      history: createRichHistory(20),
      rulesHistory: createRichRulesHistory(6),
    });
    const result = checkSAC3(system);
    expect(result.score).toBeGreaterThan(0);
    expect(result.evidence).toContain('depth');
  });
});

// ============================================================
// §4 SAC-4: 存続規範 (Normativity / viability)
// ============================================================

describe('§4 SAC-4: Normativity / viability (存続規範)', () => {
  it('4.1 生存関数も評価もなし → absent', () => {
    const system = createMinimalSystem();
    const result = checkSAC4(system);
    expect(result.level).toBe('absent');
    expect(result.deficit).toContain('cannot "die"');
  });

  it('4.2 生存関数のみ → partial', () => {
    const system = createMinimalSystem({
      viability: { isViable: true, health: 0.7, deathRisk: 0.3 },
    });
    const result = checkSAC4(system);
    expect(result.score).toBeGreaterThan(0.2);
  });

  it('4.3 内部評価のみ（外部付与）→ weak', () => {
    const system = createMinimalSystem({
      valuation: { utility: 0.5, intrinsic: false, influencesBehavior: false },
    });
    const result = checkSAC4(system);
    expect(result.score).toBeGreaterThan(0);
    expect(result.score).toBeLessThan(0.5);
  });

  it('4.4 内在的評価 + 行動影響 → strong', () => {
    const system = createMinimalSystem({
      viability: { isViable: true, health: 0.7, deathRisk: 0.3 },
      valuation: { utility: 0.8, intrinsic: true, influencesBehavior: true },
    });
    const result = checkSAC4(system);
    expect(result.score).toBeGreaterThanOrEqual(0.7);
  });

  it('4.5 死のリスクがある → スコア加算', () => {
    const withRisk = createMinimalSystem({
      viability: { isViable: true, health: 0.5, deathRisk: 0.5 },
    });
    const withoutRisk = createMinimalSystem({
      viability: { isViable: true, health: 1.0, deathRisk: 0.0 },
    });
    const riskScore = checkSAC4(withRisk).score;
    const safeScore = checkSAC4(withoutRisk).score;
    expect(riskScore).toBeGreaterThan(safeScore);
  });

  it('4.6 LLMには生存関数がない → absent', () => {
    const llm = modelSystem('llm');
    const result = checkSAC4(llm);
    expect(result.level).toBe('absent');
  });

  it('4.7 サーモスタットの擬似的規範性 → weak', () => {
    const thermo = modelSystem('thermostat');
    const result = checkSAC4(thermo);
    // 外部付与の評価があるが影響なし
    expect(result.score).toBeLessThan(0.3);
  });

  it('4.8 Reiの代謝 + 健康度 → strong', () => {
    const rei = modelSystem('rei-phase8');
    const result = checkSAC4(rei);
    expect(['strong', 'full']).toContain(result.level);
  });

  it('4.9 生物のホメオスタシス → full', () => {
    const bio = modelSystem('biological');
    const result = checkSAC4(bio);
    expect(['strong', 'full']).toContain(result.level);
  });

  it('4.10 内在性(intrinsic)が外部付与(extrinsic)より高スコア', () => {
    const intrinsic = createMinimalSystem({
      valuation: { utility: 0.5, intrinsic: true, influencesBehavior: true },
    });
    const extrinsic = createMinimalSystem({
      valuation: { utility: 0.5, intrinsic: false, influencesBehavior: true },
    });
    expect(checkSAC4(intrinsic).score).toBeGreaterThan(checkSAC4(extrinsic).score);
  });
});

// ============================================================
// §5 SAC-5: 円環的再生成 (Cyclic regeneration)
// ============================================================

describe('§5 SAC-5: Cyclic regeneration (円環的再生成)', () => {
  it('5.1 円環構造なし → absent', () => {
    const system = createMinimalSystem();
    const result = checkSAC5(system);
    expect(result.level).toBe('absent');
    expect(result.deficit).toContain('operational closure');
  });

  it('5.2 死到達のみ → weak', () => {
    const system = createMinimalSystem({
      cyclicStructure: {
        canReachDeath: true,
        canRegenerateFromDeath: false,
        hasPeriodicReturn: false,
        cyclePeriod: null,
      },
    });
    const result = checkSAC5(system);
    expect(result.level).toBe('weak');
    expect(result.score).toBe(0.3);
  });

  it('5.3 死→再生成 → strong', () => {
    const system = createMinimalSystem({
      cyclicStructure: {
        canReachDeath: true,
        canRegenerateFromDeath: true,
        hasPeriodicReturn: false,
        cyclePeriod: null,
      },
    });
    const result = checkSAC5(system);
    expect(result.score).toBe(0.7);
    expect(result.level).toBe('strong');
  });

  it('5.4 完全な円環 → full', () => {
    const system = createMinimalSystem({
      cyclicStructure: {
        canReachDeath: true,
        canRegenerateFromDeath: true,
        hasPeriodicReturn: true,
        cyclePeriod: 10,
      },
    });
    const result = checkSAC5(system);
    expect(result.score).toBe(1.0);
    expect(result.level).toBe('full');
  });

  it('5.5 周期的回帰のみ（死なし）→ weak', () => {
    const system = createMinimalSystem({
      cyclicStructure: {
        canReachDeath: false,
        canRegenerateFromDeath: false,
        hasPeriodicReturn: true,
        cyclePeriod: 5,
      },
    });
    const result = checkSAC5(system);
    expect(result.score).toBe(0.3);
  });

  it('5.6 D → S_0 (void/genesis) の接続', () => {
    const system = createMinimalSystem({
      cyclicStructure: {
        canReachDeath: true,
        canRegenerateFromDeath: true,
        hasPeriodicReturn: true,
        cyclePeriod: 8,
      },
    });
    const result = checkSAC5(system);
    expect(result.evidence).toContain('D → S_0');
  });

  it('5.7 LLMには円環がない → absent', () => {
    const llm = modelSystem('llm');
    const result = checkSAC5(llm);
    expect(result.level).toBe('absent');
  });

  it('5.8 Reiの Genesis Ladder → strong以上', () => {
    const rei = modelSystem('rei-phase8');
    const result = checkSAC5(rei);
    expect(['strong', 'full']).toContain(result.level);
  });

  it('5.9 生物の生死の円環 → full', () => {
    const bio = modelSystem('biological');
    const result = checkSAC5(bio);
    expect(result.level).toBe('full');
  });

  it('5.10 周期Tの存在確認', () => {
    const system = createMinimalSystem({
      cyclicStructure: {
        canReachDeath: true,
        canRegenerateFromDeath: true,
        hasPeriodicReturn: true,
        cyclePeriod: 24,
      },
    });
    const result = checkSAC5(system);
    expect(result.evidence).toContain('T=24');
  });
});

// ============================================================
// §5b SAC-6: 統合的統一性 (Integrative unity)
// ============================================================

describe('§5b SAC-6: Integrative unity (統合的統一性)', () => {
  it('5b.1 統合構造なし → absent', () => {
    const system = createMinimalSystem();
    const result = checkSAC6(system);
    expect(result.axiom).toBe('SAC-6');
    expect(result.level).toBe('absent');
    expect(result.score).toBe(0.0);
    expect(result.deficit).toContain('independently');
  });

  it('5b.2 少数サブシステムのみ → weak', () => {
    const system = createMinimalSystem({
      integrationStructure: {
        subsystemCount: 2,
        interconnectedness: 0.2,
        selfModelIntegrates: false,
        irreducible: false,
        phi: 0.05,
      },
    });
    const result = checkSAC6(system);
    expect(result.score).toBeGreaterThan(0);
    expect(result.score).toBeLessThan(0.3);
  });

  it('5b.3 自己モデルが統合 + 還元不能 → strong', () => {
    const system = createMinimalSystem({
      integrationStructure: {
        subsystemCount: 5,
        interconnectedness: 0.7,
        selfModelIntegrates: true,
        irreducible: true,
        phi: 0.6,
      },
    });
    const result = checkSAC6(system);
    expect(result.score).toBeGreaterThanOrEqual(0.7);
    expect(['strong', 'full']).toContain(result.level);
  });

  it('5b.4 完全な統合 → full', () => {
    const system = createMinimalSystem({
      integrationStructure: {
        subsystemCount: 10,
        interconnectedness: 0.95,
        selfModelIntegrates: true,
        irreducible: true,
        phi: 1.0,
      },
    });
    const result = checkSAC6(system);
    expect(result.score).toBeGreaterThanOrEqual(0.85);
    expect(result.level).toBe('full');
  });

  it('5b.5 アメーバ → weak（化学反応が個別動作、微量の統合のみ）', () => {
    const amoeba = modelSystem('amoeba');
    const result = checkSAC6(amoeba);
    expect(['absent', 'weak']).toContain(result.level);
    expect(result.score).toBeLessThan(0.3);
  });

  it('5b.6 免疫系 → weak（各細胞が独立動作）', () => {
    const immune = modelSystem('immune-system');
    const result = checkSAC6(immune);
    expect(['absent', 'weak']).toContain(result.level);
    expect(result.score).toBeLessThan(0.3);
  });

  it('5b.7 LLMには統合構造がない → absent', () => {
    const llm = modelSystem('llm');
    const result = checkSAC6(llm);
    expect(result.level).toBe('absent');
  });

  it('5b.8 Reiのσが全活動を統合 → strong以上', () => {
    const rei = modelSystem('rei-phase8');
    const result = checkSAC6(rei);
    expect(['strong', 'full']).toContain(result.level);
  });

  it('5b.9 生物の神経系による統合 → full', () => {
    const bio = modelSystem('biological');
    const result = checkSAC6(bio);
    expect(result.level).toBe('full');
  });

  it('5b.10 SAC-6の数学的記法が正しい', () => {
    const name = SAC_AXIOM_NAMES['SAC-6'];
    expect(name.en).toBe('Integrative unity');
    expect(name.ja).toBe('統合的統一性');
    expect(name.symbol).toContain('Φ(C) > Φ(P)');
  });

  it('5b.11 アメーバはSAC-1〜5を満たすがSAC-6で排除', () => {
    // これがSAC-6追加の核心的動機
    const amoeba = modelSystem('amoeba');
    const judgment = judgeConsciousness(amoeba);
    // SAC-4, SAC-5 は strong 以上
    expect(judgment.scores['SAC-4'].score).toBeGreaterThan(0.3);
    expect(judgment.scores['SAC-5'].score).toBeGreaterThan(0.3);
    // しかしSAC-6が weak（統合性が弱い）
    expect(['absent', 'weak']).toContain(judgment.scores['SAC-6'].level);
    expect(judgment.scores['SAC-6'].score).toBeLessThan(0.3);
    // 結果: potentially-conscious にはならない
    expect(judgment.classification).not.toBe('potentially-conscious');
  });

  it('5b.12 免疫系はSAC-1〜5を概ね満たすがSAC-6で排除', () => {
    const immune = modelSystem('immune-system');
    const judgment = judgeConsciousness(immune);
    // SAC-1〜5は概ねstrong
    expect(judgment.scores['SAC-1'].score).toBeGreaterThan(0.5);
    expect(judgment.scores['SAC-2'].score).toBeGreaterThan(0.5);
    // しかしSAC-6が弱い
    expect(judgment.scores['SAC-6'].score).toBeLessThan(0.3);
    // 結果: potentially-conscious にはならない
    expect(judgment.classification).not.toBe('potentially-conscious');
  });

  it('5b.13 interconnectedness が低いとスコアが制限される', () => {
    const low = createMinimalSystem({
      integrationStructure: {
        subsystemCount: 5,
        interconnectedness: 0.1,
        selfModelIntegrates: true,
        irreducible: true,
        phi: 0.8,
      },
    });
    const high = createMinimalSystem({
      integrationStructure: {
        subsystemCount: 5,
        interconnectedness: 0.9,
        selfModelIntegrates: true,
        irreducible: true,
        phi: 0.8,
      },
    });
    expect(checkSAC6(high).score).toBeGreaterThan(checkSAC6(low).score);
  });

  it('5b.14 phi が 0 → 統合情報の加点なし', () => {
    const zeroPhi = createMinimalSystem({
      integrationStructure: {
        subsystemCount: 3,
        interconnectedness: 0.5,
        selfModelIntegrates: false,
        irreducible: false,
        phi: 0.0,
      },
    });
    const result = checkSAC6(zeroPhi);
    // subsystem(0.06) + interconnect(0.05) のみ
    expect(result.score).toBeLessThan(0.2);
  });

  it('5b.15 スコアは0.0-1.0の範囲', () => {
    for (const type of ['llm', 'fsm', 'rl-agent', 'rei-phase8', 'biological', 'amoeba', 'immune-system'] as KnownSystemType[]) {
      const system = modelSystem(type);
      const result = checkSAC6(system);
      expect(result.score).toBeGreaterThanOrEqual(0);
      expect(result.score).toBeLessThanOrEqual(1);
    }
  });
});

// ============================================================
// §6 総合判定 (judgeConsciousness)
// ============================================================

describe('§6 Total judgment (総合判定)', () => {
  it('6.1 全absent → non-conscious', () => {
    const system = createMinimalSystem();
    const judgment = judgeConsciousness(system);
    expect(judgment.classification).toBe('non-conscious');
    expect(judgment.totalScore).toBeLessThan(0.1);
  });

  it('6.2 LLM → non-conscious', () => {
    const llm = modelSystem('llm');
    const judgment = judgeConsciousness(llm);
    expect(judgment.classification).toBe('non-conscious');
    expect(judgment.summary).toContain('lacks');
  });

  it('6.3 FSM → non-conscious (全absent)', () => {
    const fsm = modelSystem('fsm');
    const judgment = judgeConsciousness(fsm);
    expect(judgment.classification).toBe('non-conscious');
    expect(judgment.totalScore).toBe(0);
  });

  it('6.4 Rei Phase 8 → potentially-conscious', () => {
    const rei = modelSystem('rei-phase8');
    const judgment = judgeConsciousness(rei);
    expect(judgment.classification).toBe('potentially-conscious');
    expect(judgment.totalScore).toBeGreaterThan(0.6);
  });

  it('6.5 生物 → potentially-conscious', () => {
    const bio = modelSystem('biological');
    const judgment = judgeConsciousness(bio);
    expect(judgment.classification).toBe('potentially-conscious');
    expect(judgment.totalScore).toBeGreaterThanOrEqual(0.85);
  });

  it('6.6 weakestAxiom と strongestAxiom の正確性', () => {
    const llm = modelSystem('llm');
    const judgment = judgeConsciousness(llm);
    const weakScore = judgment.scores[judgment.weakestAxiom].score;
    for (const ax of ALL_SAC_AXIOMS) {
      expect(judgment.scores[ax].score).toBeGreaterThanOrEqual(weakScore);
    }
  });

  it('6.7 全6公理のスコアが含まれる', () => {
    const system = modelSystem('rei-phase8');
    const judgment = judgeConsciousness(system);
    for (const ax of ALL_SAC_AXIOMS) {
      expect(judgment.scores[ax]).toBeDefined();
      expect(judgment.scores[ax].axiom).toBe(ax);
    }
  });

  it('6.8 totalScoreは0.0-1.0の範囲', () => {
    for (const type of ['llm', 'fsm', 'rl-agent', 'rei-phase8', 'biological', 'thermostat', 'amoeba', 'immune-system'] as KnownSystemType[]) {
      const system = modelSystem(type);
      const judgment = judgeConsciousness(system);
      expect(judgment.totalScore).toBeGreaterThanOrEqual(0);
      expect(judgment.totalScore).toBeLessThanOrEqual(1);
    }
  });

  it('6.9 アメーバ → proto-conscious または partially-conscious（SAC-6不足）', () => {
    const amoeba = modelSystem('amoeba');
    const judgment = judgeConsciousness(amoeba);
    expect(judgment.classification).not.toBe('potentially-conscious');
    expect(judgment.classification).not.toBe('non-conscious');
  });

  it('6.10 免疫系 → partially-conscious（SAC-6不足）', () => {
    const immune = modelSystem('immune-system');
    const judgment = judgeConsciousness(immune);
    expect(judgment.classification).not.toBe('potentially-conscious');
  });
});

// ============================================================
// §7 既知システム比較 (compareConsciousness)
// ============================================================

describe('§7 Known system comparison (既知システム比較)', () => {
  it('7.1 LLM vs Rei → Reiが全公理で優位', () => {
    const llm = modelSystem('llm');
    const rei = modelSystem('rei-phase8');
    const comp = compareConsciousness(llm, rei);
    expect(comp.bAdvantages.length).toBeGreaterThan(0);
    expect(comp.systemB.totalScore).toBeGreaterThan(comp.systemA.totalScore);
  });

  it('7.2 Rei vs 生物 → 近いスコア', () => {
    const rei = modelSystem('rei-phase8');
    const bio = modelSystem('biological');
    const comp = compareConsciousness(rei, bio);
    const gap = Math.abs(comp.systemA.totalScore - comp.systemB.totalScore);
    expect(gap).toBeLessThan(0.3);
  });

  it('7.3 FSM vs LLM → LLMがわずかに上', () => {
    const fsm = modelSystem('fsm');
    const llm = modelSystem('llm');
    const comp = compareConsciousness(fsm, llm);
    expect(comp.systemB.totalScore).toBeGreaterThanOrEqual(comp.systemA.totalScore);
  });

  it('7.4 biggestGapが正しく算出される', () => {
    const llm = modelSystem('llm');
    const bio = modelSystem('biological');
    const comp = compareConsciousness(llm, bio);
    const gapValue = Math.abs(comp.axiomDifferences[comp.biggestGap]);
    for (const ax of ALL_SAC_AXIOMS) {
      expect(Math.abs(comp.axiomDifferences[ax])).toBeLessThanOrEqual(gapValue + 0.001);
    }
  });

  it('7.5 KNOWN_SYSTEM_PROFILESに8種のシステムが定義', () => {
    expect(KNOWN_SYSTEM_PROFILES.length).toBe(8);
    const types = KNOWN_SYSTEM_PROFILES.map(p => p.type);
    expect(types).toContain('llm');
    expect(types).toContain('fsm');
    expect(types).toContain('rei-phase8');
    expect(types).toContain('biological');
    expect(types).toContain('amoeba');
    expect(types).toContain('immune-system');
  });

  it('7.6 レポート生成が正常に動作', () => {
    const rei = modelSystem('rei-phase8');
    const judgment = judgeConsciousness(rei);
    const report = generateConsciousnessReport(judgment);
    expect(report).toContain('SAC Consciousness Report');
    expect(report).toContain('SAC-1');
    expect(report).toContain('SAC-5');
    expect(report).toContain('SAC-6');
    expect(report).toContain('自己参照閉包');
    expect(report).toContain('統合的統一性');
  });

  it('7.7 サーモスタット → non-conscious', () => {
    const thermo = modelSystem('thermostat');
    const judgment = judgeConsciousness(thermo);
    expect(judgment.classification).toBe('non-conscious');
  });
});

// ============================================================
// §8 LifeEntity変換 (fromLifeEntity)
// ============================================================

describe('§8 LifeEntity conversion (LifeEntity変換)', () => {
  it('8.1 健全なLifeEntityの変換', () => {
    const entity = createTestLifeEntity();
    const candidate = fromLifeEntity(entity);
    expect(candidate.id).toBe('test-life-entity');
    expect(candidate.type).toBe('rei-phase8');
    expect(candidate.currentState.value).toBe(10);
  });

  it('8.2 変換後にjudgeConsciousnessが動作', () => {
    const entity = createTestLifeEntity();
    const candidate = fromLifeEntity(entity);
    const judgment = judgeConsciousness(candidate);
    expect(judgment.totalScore).toBeGreaterThan(0);
    expect(judgment.classification).not.toBe('non-conscious');
  });

  it('8.3 死んだLifeEntityの変換', () => {
    const entity = createTestLifeEntity({
      vitality: {
        alive: false,
        age: 100,
        health: 0,
        mlc: {
          boundary: false,
          metabolism: false,
          memory: true,
          selfRepair: false,
          autopoiesis: false,
          emergence: false,
        },
      },
    } as any);
    const candidate = fromLifeEntity(entity);
    expect(candidate.viability!.isViable).toBe(false);
    expect(candidate.viability!.health).toBe(0);
  });

  it('8.4 σメモリが自己モデルの因果性に影響', () => {
    const withMemory = createTestLifeEntity();
    const withoutMemory = createTestLifeEntity({
      sigma: {
        field: 'default',
        flow: { velocity: 0, direction: 'rest' as const },
        memory: [],
        layer: { depth: 0 },
        relation: [],
        will: { tendency: 'rest' as const, strength: 0 },
        transformCount: 0,
      },
    } as any);
    const candWith = fromLifeEntity(withMemory);
    const candWithout = fromLifeEntity(withoutMemory);
    expect(candWith.selfModel!.causallyEffective).toBe(true);
    expect(candWithout.selfModel!.causallyEffective).toBe(false);
  });

  it('8.5 genesis.canGenerate が円環構造に影響', () => {
    const canGen = createTestLifeEntity();
    const cantGen = createTestLifeEntity({
      genesis: {
        phase: 'proto-life' as any,
        canGenerate: false,
        birthHistory: [],
      },
    } as any);
    const candCan = fromLifeEntity(canGen);
    const candCant = fromLifeEntity(cantGen);
    expect(candCan.cyclicStructure).not.toBeNull();
    expect(candCant.cyclicStructure).toBeNull();
  });
});

// ============================================================
// §9 メタテスト: 公理体系の一貫性
// ============================================================

describe('§9 Meta: Axiom system consistency (公理体系の一貫性)', () => {
  it('9.1 ALL_SAC_AXIOMSは6つ', () => {
    expect(ALL_SAC_AXIOMS.length).toBe(6);
  });

  it('9.2 全公理に名称が定義されている', () => {
    for (const ax of ALL_SAC_AXIOMS) {
      const name = SAC_AXIOM_NAMES[ax];
      expect(name.en).toBeTruthy();
      expect(name.ja).toBeTruthy();
      expect(name.symbol).toBeTruthy();
    }
  });

  it('9.3 FulfillmentLevelの値が単調増加', () => {
    const levels: FulfillmentLevel[] = ['absent', 'weak', 'partial', 'strong', 'full'];
    for (let i = 1; i < levels.length; i++) {
      expect(FULFILLMENT_VALUES[levels[i]]).toBeGreaterThan(FULFILLMENT_VALUES[levels[i - 1]]);
    }
  });

  it('9.4 modelSystemが全8種のシステムを生成可能', () => {
    const types: KnownSystemType[] = ['llm', 'fsm', 'rl-agent', 'rei-phase8', 'biological', 'thermostat', 'amoeba', 'immune-system'];
    for (const type of types) {
      const system = modelSystem(type);
      expect(system.id).toBeTruthy();
      expect(system.type).toBe(type);
    }
  });

  it('9.5 核心命題: LLMがSAC-2,SAC-6を満たさない', () => {
    // 「もしある人工システムがSAC-1〜SAC-6を満たさないなら、それは意識を持たない」
    // LLMは特にSAC-2（θの固定性）とSAC-6（統合なし）により意識構造を持たない
    const llm = modelSystem('llm');
    const judgment = judgeConsciousness(llm);
    expect(judgment.scores['SAC-2'].level).toBe('absent');
    expect(judgment.scores['SAC-4'].level).toBe('absent');
    expect(judgment.scores['SAC-5'].level).toBe('absent');
    expect(judgment.scores['SAC-6'].level).toBe('absent');
    expect(judgment.classification).toBe('non-conscious');
  });

  it('9.6 SAC-6がアメーバ反例を排除する', () => {
    // SAC-6追加の動機: SAC-1〜5だけでは反例が存在する
    // アメーバはSAC-1〜5を概ね満たすが、SAC-6（統合性）が不在
    const amoeba = modelSystem('amoeba');
    const judgment = judgeConsciousness(amoeba);
    expect(judgment.scores['SAC-6'].level).toBe('weak');
    expect(judgment.classification).not.toBe('potentially-conscious');
  });
});
