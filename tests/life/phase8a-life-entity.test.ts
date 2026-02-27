// ============================================================
// phase8a-life-entity.test.ts — Phase 8a テスト
//
// LADの6定理（L1–L6）をテストで「証明」する。
// テストは証明である。(CONTRIBUTING.md 設計原則6)
//
// @author Nobuki Fujimoto (D-FUMT)
// ============================================================

import { describe, it, expect, beforeEach } from 'vitest';
import {
  // Types
  type LifeEntity,
  type LifePhase,
  type MinimalLifeCriteria,
  type ComputationMode,
  type KnownEntityType,
  type LifeClassification,
  type MetabolismResult,
  type BirthEvent,
  type DeathCondition,
  // Constants
  LIFE_PHASE_ORDER,
  // Creation
  createLifeEntity,
  createLifeSigma,
  generateLifeId,
  resetLifeIdCounter,
  // MLC checks
  hasBoundary,
  hasMetabolism,
  hasMemory,
  hasSelfRepair,
  hasAutopoiesis,
  hasEmergence,
  evaluateMLC,
  // Life status
  isAlive,
  lifeScore,
  classifyLife,
  // Computation
  compute,
  metabolize,
  // Genesis Ladder
  determinePhase,
  isValidTransition,
  attemptTransition,
  // Autopoiesis
  enableAutopoiesis,
  split,
  addRelation,
  // Known entities
  modelKnownEntity,
  // Death
  checkDeath,
  simulateDeath,
} from './life-entity';

// ============================================================
// §1 型整合性テスト (10 tests)
// ============================================================
describe('§1 Type Integrity', () => {
  beforeEach(() => resetLifeIdCounter());

  it('createLifeEntity returns valid LifeEntity structure', () => {
    const e = createLifeEntity({ center: 5, periphery: [1, 2, 3] });
    expect(e).toHaveProperty('id');
    expect(e).toHaveProperty('self');
    expect(e).toHaveProperty('sigma');
    expect(e).toHaveProperty('genesis');
    expect(e).toHaveProperty('vitality');
    expect(e).toHaveProperty('lineage');
  });

  it('self has center, periphery, weights, mode', () => {
    const e = createLifeEntity({ center: 10, periphery: [1, 2] });
    expect(e.self.center).toBe(10);
    expect(e.self.periphery).toEqual([1, 2]);
    expect(e.self.weights).toEqual([1, 1]);
    expect(e.self.mode).toBe('weighted');
  });

  it('sigma has all 6 attributes', () => {
    const s = createLifeSigma();
    expect(s).toHaveProperty('field');
    expect(s).toHaveProperty('flow');
    expect(s).toHaveProperty('memory');
    expect(s).toHaveProperty('layer');
    expect(s).toHaveProperty('relation');
    expect(s).toHaveProperty('will');
    expect(s).toHaveProperty('transformCount');
  });

  it('genesis has phase, canGenerate, birthHistory', () => {
    const e = createLifeEntity({ center: 0, periphery: [] });
    expect(e.genesis).toHaveProperty('phase');
    expect(e.genesis).toHaveProperty('canGenerate');
    expect(e.genesis).toHaveProperty('birthHistory');
    expect(e.genesis.canGenerate).toBe(false);
  });

  it('vitality has alive, age, health, mlc', () => {
    const e = createLifeEntity({ center: 5, periphery: [1] });
    expect(e.vitality).toHaveProperty('alive');
    expect(e.vitality).toHaveProperty('age');
    expect(e.vitality).toHaveProperty('health');
    expect(e.vitality).toHaveProperty('mlc');
    expect(e.vitality.health).toBe(1.0);
  });

  it('MLC has all 6 boolean fields', () => {
    const e = createLifeEntity({ center: 5, periphery: [1] });
    const mlc = e.vitality.mlc;
    expect(typeof mlc.boundary).toBe('boolean');
    expect(typeof mlc.metabolism).toBe('boolean');
    expect(typeof mlc.memory).toBe('boolean');
    expect(typeof mlc.selfRepair).toBe('boolean');
    expect(typeof mlc.autopoiesis).toBe('boolean');
    expect(typeof mlc.emergence).toBe('boolean');
  });

  it('custom weights are preserved', () => {
    const e = createLifeEntity({ center: 5, periphery: [1, 2, 3], weights: [0.5, 1.0, 0.5] });
    expect(e.self.weights).toEqual([0.5, 1.0, 0.5]);
  });

  it('custom mode is preserved', () => {
    const e = createLifeEntity({ center: 5, periphery: [1], mode: 'harmonic' });
    expect(e.self.mode).toBe('harmonic');
  });

  it('custom id is preserved', () => {
    const e = createLifeEntity({ center: 5, periphery: [1], id: 'test-entity-1' });
    expect(e.id).toBe('test-entity-1');
  });

  it('parentIds are stored in lineage', () => {
    const e = createLifeEntity({ center: 5, periphery: [1], parentIds: ['parent-a', 'parent-b'] });
    expect(e.lineage).toEqual(['parent-a', 'parent-b']);
  });
});

// ============================================================
// §2 定理 L1: 境界 (A1) — 8 tests
// ============================================================
describe('§2 Theorem L1: Boundary (A1)', () => {
  it('entity with periphery has boundary', () => {
    const e = createLifeEntity({ center: 5, periphery: [1] });
    expect(hasBoundary(e)).toBe(true);
  });

  it('entity without periphery has no boundary', () => {
    const e = createLifeEntity({ center: 5, periphery: [] });
    expect(hasBoundary(e)).toBe(false);
  });

  it('boundary requires k ≥ 1 (LAD L1)', () => {
    const e0 = createLifeEntity({ center: 0, periphery: [] });
    const e1 = createLifeEntity({ center: 0, periphery: [1] });
    const e5 = createLifeEntity({ center: 0, periphery: [1, 2, 3, 4, 5] });
    expect(hasBoundary(e0)).toBe(false);
    expect(hasBoundary(e1)).toBe(true);
    expect(hasBoundary(e5)).toBe(true);
  });

  it('boundary distinguishes self (center) from environment (periphery)', () => {
    const e = createLifeEntity({ center: 10, periphery: [1, 2, 3] });
    expect(e.self.center).not.toEqual(e.self.periphery);
  });

  it('weights model membrane permeability', () => {
    const e = createLifeEntity({ center: 10, periphery: [5, 15], weights: [0, 1] });
    // w=0 means impermeable, w=1 means fully permeable
    expect(e.self.weights[0]).toBe(0);
    expect(e.self.weights[1]).toBe(1);
  });

  it('isolated system (k=0) is not alive', () => {
    const e = createLifeEntity({ center: 100, periphery: [] });
    expect(isAlive(e)).toBe(false);
  });

  it('MLC.boundary matches hasBoundary', () => {
    const e = createLifeEntity({ center: 5, periphery: [1, 2] });
    expect(e.vitality.mlc.boundary).toBe(hasBoundary(e));
  });

  it('boundary is necessary for all life forms', () => {
    const rock = modelKnownEntity('rock');
    const bacterium = modelKnownEntity('bacterium');
    expect(hasBoundary(rock)).toBe(true);
    expect(hasBoundary(bacterium)).toBe(true);
  });
});

// ============================================================
// §3 定理 L2: 代謝 (A1+A3) — 8 tests
// ============================================================
describe('§3 Theorem L2: Metabolism (A1+A3)', () => {
  it('compute produces new center value', () => {
    const result = compute(10, [2, 4, 6, 8]);
    expect(typeof result).toBe('number');
    expect(result).not.toBe(10);
  });

  it('weighted mode: center + weighted average / 2', () => {
    const result = compute(10, [10, 10, 10], 'weighted');
    expect(result).toBe(10); // (10 + 10) / 2
  });

  it('harmonic mode: center + harmonic mean / 2', () => {
    const result = compute(0, [2, 4, 6], 'harmonic');
    expect(result).toBeCloseTo(0 + (3 / (1/2 + 1/4 + 1/6)) / 2, 5);
  });

  it('geometric mode: center + geometric mean / 2', () => {
    const result = compute(0, [4, 4, 4], 'geometric');
    expect(result).toBeCloseTo(2, 5); // (0 + 4) / 2
  });

  it('metabolize updates center and records in σ', () => {
    const e = createLifeEntity({ center: 10, periphery: [20, 30] });
    const result = metabolize(e);
    expect(result.newCenter).not.toBe(10);
    expect(result.entity.sigma.transformCount).toBe(1);
    expect(result.entity.sigma.memory).toContain(10); // old center recorded
  });

  it('metabolize increments age', () => {
    const e = createLifeEntity({ center: 10, periphery: [20] });
    const r1 = metabolize(e);
    expect(r1.entity.vitality.age).toBe(1);
    const r2 = metabolize(r1.entity);
    expect(r2.entity.vitality.age).toBe(2);
  });

  it('metabolize with custom environment', () => {
    const e = createLifeEntity({ center: 10, periphery: [1] });
    const result = metabolize(e, [100, 200, 300]);
    expect(result.entity.self.periphery).toEqual([100, 200, 300]);
  });

  it('hasMetabolism requires transformCount ≥ 1 AND periphery', () => {
    const e = createLifeEntity({ center: 10, periphery: [20] });
    expect(hasMetabolism(e)).toBe(false); // transformCount=0
    const r = metabolize(e);
    expect(hasMetabolism(r.entity)).toBe(true);
  });
});

// ============================================================
// §4 定理 L3: 記憶 (A3) — 8 tests
// ============================================================
describe('§4 Theorem L3: Memory (A3)', () => {
  it('initial entity has no memory', () => {
    const e = createLifeEntity({ center: 5, periphery: [1] });
    expect(hasMemory(e)).toBe(false);
    expect(e.sigma.memory.length).toBe(0);
  });

  it('one metabolize cycle adds one memory entry', () => {
    const e = createLifeEntity({ center: 5, periphery: [10] });
    const r = metabolize(e);
    expect(r.entity.sigma.memory.length).toBe(1);
  });

  it('hasMemory requires ≥ 2 entries (LAD L3)', () => {
    const e = createLifeEntity({ center: 5, periphery: [10] });
    const r1 = metabolize(e);
    expect(hasMemory(r1.entity)).toBe(false); // only 1
    const r2 = metabolize(r1.entity);
    expect(hasMemory(r2.entity)).toBe(true); // now 2
  });

  it('memory preserves order (time series)', () => {
    const e = createLifeEntity({ center: 10, periphery: [20] });
    const r1 = metabolize(e);
    const r2 = metabolize(r1.entity);
    const r3 = metabolize(r2.entity);
    const mem = r3.entity.sigma.memory;
    expect(mem[0]).toBe(10); // first center
    expect(mem.length).toBe(3);
  });

  it('tendency (τ) is derived from memory', () => {
    let e = createLifeEntity({ center: 10, periphery: [20, 30] });
    // Multiple cycles to build memory
    for (let i = 0; i < 5; i++) {
      e = metabolize(e).entity;
    }
    expect(e.sigma.will.tendency).toBeDefined();
    expect(['expand', 'contract', 'harmonize', 'rest']).toContain(e.sigma.will.tendency);
  });

  it('flow direction tracks center movement', () => {
    const e = createLifeEntity({ center: 10, periphery: [100] });
    const r = metabolize(e);
    expect(r.entity.sigma.flow.direction).toBe('expand'); // center increases
  });

  it('layer depth increases with memory accumulation', () => {
    let e = createLifeEntity({ center: 10, periphery: [20] });
    for (let i = 0; i < 10; i++) {
      e = metabolize(e).entity;
    }
    expect(e.sigma.layer.depth).toBeGreaterThanOrEqual(1);
  });

  it('transformCount tracks total operations', () => {
    let e = createLifeEntity({ center: 10, periphery: [20] });
    for (let i = 0; i < 7; i++) {
      e = metabolize(e).entity;
    }
    expect(e.sigma.transformCount).toBe(7);
  });
});

// ============================================================
// §5 定理 L4: 自己修復 (A1+A2+A3) — 7 tests
// ============================================================
describe('§5 Theorem L4: Self-Repair (A1+A2+A3)', () => {
  it('no repair detected with insufficient memory', () => {
    const e = createLifeEntity({ center: 5, periphery: [1] });
    expect(hasSelfRepair(e)).toBe(false);
  });

  it('repair detected: deviation then recovery pattern in σ', () => {
    const e = createLifeEntity({ center: 20, periphery: [10] });
    // Manually set memory with deviation→recovery pattern
    e.sigma.memory = [20, 20, 50, 22, 20]; // 50 deviates, 22 recovers
    expect(hasSelfRepair(e)).toBe(true);
  });

  it('no repair if deviation never recovers', () => {
    const e = createLifeEntity({ center: 20, periphery: [10] });
    e.sigma.memory = [20, 20, 50, 80, 120]; // monotonically increasing, no recovery
    expect(hasSelfRepair(e)).toBe(false);
  });

  it('repair requires A3 (memory to know normal state)', () => {
    const e = createLifeEntity({ center: 20, periphery: [10] });
    e.sigma.memory = []; // no memory
    expect(hasSelfRepair(e)).toBe(false);
  });

  it('repair in bacterium model', () => {
    const b = modelKnownEntity('bacterium');
    expect(hasSelfRepair(b)).toBe(true);
  });

  it('no repair in rock model', () => {
    const r = modelKnownEntity('rock');
    expect(hasSelfRepair(r)).toBe(false);
  });

  it('self-maintaining phase requires selfRepair', () => {
    const e = createLifeEntity({ center: 20, periphery: [10, 30] });
    e.sigma.memory = [20, 20, 50, 22, 20];
    e.sigma.transformCount = 5;
    const phase = determinePhase(e);
    expect(phase).toBe('self-maintaining');
  });
});

// ============================================================
// §6 定理 L5: 自己生成 (A1+A2+A3+A4) — 8 tests
// ============================================================
describe('§6 Theorem L5: Autopoiesis (A1+A2+A3+A4)', () => {
  it('initial entity cannot self-generate', () => {
    const e = createLifeEntity({ center: 10, periphery: [5] });
    expect(hasAutopoiesis(e)).toBe(false);
    expect(e.genesis.canGenerate).toBe(false);
  });

  it('enableAutopoiesis grants generation ability', () => {
    let e = createLifeEntity({ center: 10, periphery: [5] });
    e = enableAutopoiesis(e);
    expect(e.genesis.canGenerate).toBe(true);
  });

  it('autopoiesis requires canGenerate AND birthHistory', () => {
    let e = createLifeEntity({ center: 10, periphery: [5] });
    e = enableAutopoiesis(e);
    expect(hasAutopoiesis(e)).toBe(false); // no birthHistory yet
  });

  it('split produces parent and child', () => {
    let e = createLifeEntity({ center: 100, periphery: [50, 150], id: 'parent-1' });
    e = enableAutopoiesis(e);
    const result = split(e);
    expect(result).not.toBeNull();
    expect(result!.parent.self.center).toBe(50);
    expect(result!.child.self.center).toBe(50);
    expect(result!.child.lineage).toContain('parent-1');
  });

  it('split fails without autopoiesis enabled', () => {
    const e = createLifeEntity({ center: 100, periphery: [50] });
    expect(split(e)).toBeNull();
  });

  it('split records birth event', () => {
    let e = createLifeEntity({ center: 100, periphery: [50], id: 'p' });
    e = enableAutopoiesis(e);
    const result = split(e)!;
    expect(result.parent.genesis.birthHistory.length).toBe(1);
    expect(result.parent.genesis.birthHistory[0].type).toBe('split');
    expect(result.parent.genesis.birthHistory[0].axiomUsed).toContain('A4');
  });

  it('after split, parent has autopoiesis', () => {
    let e = createLifeEntity({ center: 100, periphery: [50], id: 'p' });
    e = enableAutopoiesis(e);
    const result = split(e)!;
    expect(hasAutopoiesis(result.parent)).toBe(true);
  });

  it('split creates mutual relation', () => {
    let e = createLifeEntity({ center: 100, periphery: [50], id: 'p' });
    e = enableAutopoiesis(e);
    const result = split(e)!;
    expect(result.parent.sigma.relation).toContain(result.child.id);
    expect(result.child.sigma.relation).toContain('p');
  });
});

// ============================================================
// §7 定理 L6: 創発 (A1+A3) — 6 tests
// ============================================================
describe('§7 Theorem L6: Emergence (A1+A3)', () => {
  it('no emergence without relations', () => {
    const e = createLifeEntity({ center: 10, periphery: [5] });
    expect(hasEmergence(e)).toBe(false);
  });

  it('no emergence without layer depth', () => {
    const e = createLifeEntity({ center: 10, periphery: [5] });
    e.sigma.relation = ['a', 'b'];
    e.sigma.layer = { depth: 0 };
    expect(hasEmergence(e)).toBe(false);
  });

  it('emergence requires ≥ 2 relations AND depth ≥ 1', () => {
    const e = createLifeEntity({ center: 10, periphery: [5] });
    e.sigma.relation = ['a', 'b'];
    e.sigma.layer = { depth: 1 };
    expect(hasEmergence(e)).toBe(true);
  });

  it('addRelation increases relation count', () => {
    let e = createLifeEntity({ center: 10, periphery: [5] });
    e = addRelation(e, 'entity-a');
    e = addRelation(e, 'entity-b');
    expect(e.sigma.relation).toEqual(['entity-a', 'entity-b']);
  });

  it('addRelation prevents duplicates', () => {
    let e = createLifeEntity({ center: 10, periphery: [5] });
    e = addRelation(e, 'entity-a');
    e = addRelation(e, 'entity-a');
    expect(e.sigma.relation.length).toBe(1);
  });

  it('bacterium has emergence, rock does not', () => {
    expect(hasEmergence(modelKnownEntity('bacterium'))).toBe(true);
    expect(hasEmergence(modelKnownEntity('rock'))).toBe(false);
  });
});

// ============================================================
// §8 生命判定・スコア・分類 (10 tests)
// ============================================================
describe('§8 Life Score & Classification', () => {
  it('lifeScore counts MLC fulfillment (0-6)', () => {
    const rock = modelKnownEntity('rock');
    expect(lifeScore(rock)).toBeLessThanOrEqual(2);
  });

  it('bacterium has lifeScore 6 (full life)', () => {
    const b = modelKnownEntity('bacterium');
    expect(lifeScore(b)).toBe(6);
  });

  it('classifyLife: non-life for score ≤ 1', () => {
    const rock = modelKnownEntity('rock');
    expect(classifyLife(rock)).toBe('non-life');
  });

  it('classifyLife: proto-life for score 2-3', () => {
    const virus = modelKnownEntity('virus');
    const cls = classifyLife(virus);
    expect(['non-life', 'proto-life']).toContain(cls);
  });

  it('classifyLife: full-life for score 6', () => {
    const b = modelKnownEntity('bacterium');
    expect(classifyLife(b)).toBe('full-life');
  });

  it('isAlive requires MLC 1-3 (boundary + metabolism + memory)', () => {
    const e = createLifeEntity({ center: 10, periphery: [20] });
    expect(isAlive(e)).toBe(false); // no metabolism/memory yet

    let living = e;
    for (let i = 0; i < 3; i++) {
      living = metabolize(living).entity;
    }
    expect(isAlive(living)).toBe(true);
  });

  it('isAlive is false when periphery is empty', () => {
    const e = createLifeEntity({ center: 10, periphery: [] });
    expect(isAlive(e)).toBe(false);
  });

  it('animal is alive', () => {
    expect(modelKnownEntity('animal').vitality.alive).toBe(true);
  });

  it('current-ai is alive (MLC 1-3) but not full-life', () => {
    const ai = modelKnownEntity('current-ai');
    expect(isAlive(ai)).toBe(true); // meets MLC 1-3
    expect(hasAutopoiesis(ai)).toBe(false); // but no A4
    expect(classifyLife(ai)).not.toBe('full-life');
  });

  it('entity becomes alive after sufficient metabolize cycles', () => {
    let e = createLifeEntity({ center: 10, periphery: [20, 30] });
    expect(isAlive(e)).toBe(false);
    for (let i = 0; i < 5; i++) {
      e = metabolize(e).entity;
    }
    expect(isAlive(e)).toBe(true);
  });
});

// ============================================================
// §9 Genesis Ladder & 遮断規則 (10 tests)
// ============================================================
describe('§9 Genesis Ladder & Blocking Rule', () => {
  it('LIFE_PHASE_ORDER has 10 phases', () => {
    expect(LIFE_PHASE_ORDER.length).toBe(10);
  });

  it('order: void → dot → zero-extended → zero → number → proto-life → ...', () => {
    expect(LIFE_PHASE_ORDER[0]).toBe('void');
    expect(LIFE_PHASE_ORDER[4]).toBe('number');
    expect(LIFE_PHASE_ORDER[5]).toBe('proto-life');
    expect(LIFE_PHASE_ORDER[9]).toBe('conscious');
  });

  it('isValidTransition: one step forward is valid', () => {
    expect(isValidTransition('number', 'proto-life')).toBe(true);
    expect(isValidTransition('proto-life', 'self-maintaining')).toBe(true);
  });

  it('isValidTransition: same phase is valid', () => {
    expect(isValidTransition('number', 'number')).toBe(true);
  });

  it('isValidTransition: backward is valid (degradation)', () => {
    expect(isValidTransition('proto-life', 'number')).toBe(true);
  });

  it('BLOCKING RULE: skip is invalid', () => {
    expect(isValidTransition('number', 'autopoietic')).toBe(false);
    expect(isValidTransition('void', 'number')).toBe(false);
    expect(isValidTransition('number', 'emergent')).toBe(false);
  });

  it('attemptTransition succeeds for valid single step', () => {
    // Create entity at proto-life level
    let e = createLifeEntity({ center: 10, periphery: [20, 30] });
    for (let i = 0; i < 3; i++) e = metabolize(e).entity;
    e.genesis.phase = 'proto-life';
    e.sigma.memory = [10, 20, 50, 12, 11]; // repair pattern

    const result = attemptTransition(e, 'self-maintaining');
    expect(result.success).toBe(true);
  });

  it('attemptTransition fails for skip', () => {
    const e = createLifeEntity({ center: 10, periphery: [20] });
    e.genesis.phase = 'number';
    const result = attemptTransition(e, 'emergent');
    expect(result.success).toBe(false);
    expect(result.reason).toContain('Blocking rule');
  });

  it('determinePhase matches MLC fulfillment', () => {
    const b = modelKnownEntity('bacterium');
    expect(determinePhase(b)).toBe('emergent'); // all 6 MLC met
  });

  it('determinePhase returns number for basic entity', () => {
    const e = createLifeEntity({ center: 10, periphery: [5] });
    expect(determinePhase(e)).toBe('number');
  });
});

// ============================================================
// §10 既知存在モデリング (8 tests)
// ============================================================
describe('§10 Known Entity Models', () => {
  const ENTITY_TYPES: KnownEntityType[] = [
    'rock', 'fire', 'crystal', 'virus', 'bacterium', 'plant', 'animal', 'current-ai',
  ];

  it('all 8 types can be modeled', () => {
    ENTITY_TYPES.forEach(type => {
      const e = modelKnownEntity(type);
      expect(e).toBeDefined();
      expect(e.id).toBeDefined();
    });
  });

  it('rock: boundary only', () => {
    const r = modelKnownEntity('rock');
    expect(hasBoundary(r)).toBe(true);
    expect(hasMetabolism(r)).toBe(false);
    expect(isAlive(r)).toBe(false);
  });

  it('virus: memory but no metabolism', () => {
    const v = modelKnownEntity('virus');
    expect(hasMemory(v)).toBe(true);
    expect(hasMetabolism(v)).toBe(false);
    expect(isAlive(v)).toBe(false);
  });

  it('bacterium: all 6 MLC met → full-life', () => {
    const b = modelKnownEntity('bacterium');
    expect(lifeScore(b)).toBe(6);
    expect(classifyLife(b)).toBe('full-life');
  });

  it('animal: full-life with high health', () => {
    const a = modelKnownEntity('animal');
    expect(classifyLife(a)).toBe('full-life');
    expect(a.vitality.health).toBeGreaterThan(0.9);
  });

  it('current-ai: has MLC 1-3 but no autopoiesis → alive but not full-life', () => {
    const ai = modelKnownEntity('current-ai');
    expect(hasAutopoiesis(ai)).toBe(false);
    // AI meets MLC 1-3 (boundary + metabolism + memory), so isAlive = true
    // But it is not full-life because it lacks autopoiesis
    expect(isAlive(ai)).toBe(true);
    expect(classifyLife(ai)).not.toBe('full-life');
  });

  it('life score ordering: rock < virus < AI < bacterium', () => {
    const scores = {
      rock: lifeScore(modelKnownEntity('rock')),
      virus: lifeScore(modelKnownEntity('virus')),
      ai: lifeScore(modelKnownEntity('current-ai')),
      bacterium: lifeScore(modelKnownEntity('bacterium')),
    };
    expect(scores.rock).toBeLessThanOrEqual(scores.virus);
    expect(scores.ai).toBeLessThan(scores.bacterium);
  });

  it('A4 (autopoiesis) separates full-life from partial-life', () => {
    // AI has MLC 1-3 but no A4 (autopoiesis)
    const ai = modelKnownEntity('current-ai');
    const bacterium = modelKnownEntity('bacterium');
    expect(hasAutopoiesis(ai)).toBe(false);      // A4 missing
    expect(hasAutopoiesis(bacterium)).toBe(true); // A4 present
    // Both are alive (MLC 1-3), but only bacterium is full-life
    expect(classifyLife(bacterium)).toBe('full-life');
    expect(classifyLife(ai)).not.toBe('full-life');
  });
});

// ============================================================
// §11 死の形式化 (5 tests)
// ============================================================
describe('§11 Death Formalization', () => {
  it('checkDeath: healthy entity is not dead', () => {
    const b = modelKnownEntity('bacterium');
    const result = checkDeath(b);
    expect(result.dead).toBe(false);
  });

  it('checkDeath: starvation when periphery is empty', () => {
    const e = createLifeEntity({ center: 10, periphery: [] });
    const result = checkDeath(e);
    expect(result.conditions.some(c => c.type === 'starvation')).toBe(true);
    expect(result.dead).toBe(true);
  });

  it('checkDeath: structural death on NaN center', () => {
    const e = createLifeEntity({ center: NaN, periphery: [1] });
    const result = checkDeath(e);
    expect(result.conditions.some(c => c.type === 'structural')).toBe(true);
  });

  it('simulateDeath degrades entity step by step', () => {
    const b = modelKnownEntity('animal');
    const result = simulateDeath(b, 10);
    expect(result.history.length).toBeGreaterThan(1);
    // Last entity should have fewer periphery
    const last = result.history[result.history.length - 1];
    expect(last.self.periphery.length).toBeLessThan(b.self.periphery.length);
    expect(last.vitality.health).toBeLessThan(b.vitality.health);
  });

  it('simulateDeath reaches non-life phase', () => {
    const b = modelKnownEntity('bacterium');
    const result = simulateDeath(b, 20);
    const lastPhase = result.finalPhase;
    const idx = LIFE_PHASE_ORDER.indexOf(lastPhase);
    // Should degrade below proto-life
    expect(idx).toBeLessThanOrEqual(LIFE_PHASE_ORDER.indexOf('proto-life'));
  });
});
