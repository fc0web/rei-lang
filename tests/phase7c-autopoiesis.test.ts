/**
 * Phase 7c Tests — σ自己生成エンジン（オートポイエーシス）
 * 
 * Birth Axioms: fission, fusion, emergence, metamorphosis
 * Conservation Laws: σ質量保存, relation保存, memory因果保存, will連続性
 */

import { describe, it, expect } from 'vitest';
import {
  createColony,
  canFission,
  fission,
  canFusion,
  fusion,
  canEmergence,
  emergence,
  canMetamorphosis,
  metamorphosis,
  stepColony,
  DEFAULT_AUTOPOIESIS_CONFIG,
  type ColonyValue,
  type Colony,
} from '../src/lang/sigma-autopoiesis';

// ============================================================
// Helper
// ============================================================

function makeValue(id: string, value: number, overrides: Record<string, any> = {}): ColonyValue {
  return {
    id,
    value,
    sigma: {
      field: { center: value, neighbors: [], dim: 0, domain: 'default' },
      flow: { velocity: 0, phase: 'rest' },
      memory: [],
      layer: { depth: 1, structure: 'flat' },
      relation: { refs: [], dependencies: [], entanglements: [], isolated: true },
      will: { tendency: 'rest', strength: 0 },
      ...overrides,
    },
  };
}

// ============================================================
// 1. Colony Creation
// ============================================================

describe('Phase 7c: Colony Creation', () => {

  it('creates colony from values', () => {
    const colony = createColony([
      { id: 'a', value: 10 },
      { id: 'b', value: 20 },
    ]);
    expect(colony.values.length).toBe(2);
    expect(colony.generation).toBe(0);
    expect(colony.history.length).toBe(0);
  });

  it('assigns default sigma', () => {
    const colony = createColony([{ id: 'x', value: 5 }]);
    expect(colony.values[0].sigma.field).toBeDefined();
    expect(colony.values[0].sigma.will).toBeDefined();
    expect(colony.values[0].sigma.memory).toBeDefined();
  });

  it('accepts custom config', () => {
    const colony = createColony([{ id: 'a', value: 1 }], { maxPopulation: 50 });
    expect(colony.config.maxPopulation).toBe(50);
  });

  it('preserves custom sigma', () => {
    const colony = createColony([{
      id: 'a', value: 1,
      sigma: { field: 'physics', flow: { phase: 'steady' }, memory: [1], layer: { depth: 2 }, relation: { refs: [] }, will: { tendency: 'expand' } },
    }]);
    expect(colony.values[0].sigma.field).toBe('physics');
    expect(colony.values[0].sigma.will.tendency).toBe('expand');
  });

  it('empty colony is valid', () => {
    const colony = createColony([]);
    expect(colony.values.length).toBe(0);
  });
});

// ============================================================
// 2. BA-1: Fission (分裂)
// ============================================================

describe('Phase 7c: BA-1 Fission', () => {

  it('canFission: true when memory >= threshold and will=propagate', () => {
    const v = makeValue('a', 100, {
      memory: Array.from({ length: 15 }, (_, i) => i),
      will: { tendency: 'propagate', strength: 0.8 },
    });
    expect(canFission(v, DEFAULT_AUTOPOIESIS_CONFIG)).toBe(true);
  });

  it('canFission: false when memory below threshold', () => {
    const v = makeValue('a', 100, {
      memory: [1, 2],
      will: { tendency: 'propagate', strength: 0.8 },
    });
    expect(canFission(v, DEFAULT_AUTOPOIESIS_CONFIG)).toBe(false);
  });

  it('canFission: false when will is not propagate', () => {
    const v = makeValue('a', 100, {
      memory: Array.from({ length: 15 }, (_, i) => i),
      will: { tendency: 'expand', strength: 0.8 },
    });
    expect(canFission(v, DEFAULT_AUTOPOIESIS_CONFIG)).toBe(false);
  });

  it('fission creates two children', () => {
    const v = makeValue('a', 100, {
      memory: Array.from({ length: 12 }, (_, i) => i),
      will: { tendency: 'propagate', strength: 0.8 },
    });
    const result = fission(v, DEFAULT_AUTOPOIESIS_CONFIG);
    expect(result.child1).toBeDefined();
    expect(result.child2).toBeDefined();
    expect(result.child1.id).toContain('a');
    expect(result.child2.id).toContain('a');
  });

  it('fission: C-1 σ質量保存 — memory split', () => {
    const mem = Array.from({ length: 12 }, (_, i) => i);
    const v = makeValue('a', 100, { memory: mem, will: { tendency: 'propagate' } });
    const result = fission(v, DEFAULT_AUTOPOIESIS_CONFIG);
    const totalMem = result.child1.sigma.memory.length + result.child2.sigma.memory.length;
    expect(totalMem).toBe(mem.length);
    expect(result.conservation.sigmaMassPreserved).toBe(true);
  });

  it('fission: value is split between children', () => {
    const v = makeValue('a', 100, {
      memory: Array.from({ length: 12 }, (_, i) => i),
      will: { tendency: 'propagate' },
    });
    const result = fission(v, DEFAULT_AUTOPOIESIS_CONFIG);
    expect(result.child1.value + result.child2.value).toBe(100);
  });

  it('fission: children inherit parent field', () => {
    const v = makeValue('a', 50, {
      memory: Array.from({ length: 12 }, (_, i) => i),
      will: { tendency: 'propagate' },
      field: { center: 50, domain: 'physics' },
    });
    const result = fission(v, DEFAULT_AUTOPOIESIS_CONFIG);
    expect(result.child1.sigma.field.domain).toBe('physics');
    expect(result.child2.sigma.field.domain).toBe('physics');
  });

  it('fission: children reference parent', () => {
    const v = makeValue('parent', 80, {
      memory: Array.from({ length: 12 }, (_, i) => i),
      will: { tendency: 'propagate' },
    });
    const result = fission(v, DEFAULT_AUTOPOIESIS_CONFIG);
    expect(result.child1.sigma.relation.refs).toContain('parent');
    expect(result.child2.sigma.relation.refs).toContain('parent');
  });

  it('fission: will strength halved', () => {
    const v = makeValue('a', 100, {
      memory: Array.from({ length: 12 }, (_, i) => i),
      will: { tendency: 'propagate', strength: 0.8 },
    });
    const result = fission(v, DEFAULT_AUTOPOIESIS_CONFIG);
    expect(result.child1.sigma.will.strength).toBeCloseTo(0.4);
    expect(result.child2.sigma.will.strength).toBeCloseTo(0.4);
  });
});

// ============================================================
// 3. BA-2: Fusion (融合)
// ============================================================

describe('Phase 7c: BA-2 Fusion', () => {

  it('canFusion: true when mutual refs + same field + high strength', () => {
    const v1 = makeValue('a', 10, {
      field: { domain: 'physics' },
      relation: { refs: ['b'], entanglements: ['b'] },
    });
    const v2 = makeValue('b', 20, {
      field: { domain: 'physics' },
      relation: { refs: ['a'], entanglements: ['a'] },
    });
    expect(canFusion(v1, v2, DEFAULT_AUTOPOIESIS_CONFIG)).toBe(true);
  });

  it('canFusion: false when different fields', () => {
    const v1 = makeValue('a', 10, {
      field: { domain: 'physics' },
      relation: { refs: ['b'], entanglements: ['b'] },
    });
    const v2 = makeValue('b', 20, {
      field: { domain: 'music' },
      relation: { refs: ['a'], entanglements: ['a'] },
    });
    expect(canFusion(v1, v2, DEFAULT_AUTOPOIESIS_CONFIG)).toBe(false);
  });

  it('canFusion: false when no relation', () => {
    const v1 = makeValue('a', 10, { field: { domain: 'physics' } });
    const v2 = makeValue('b', 20, { field: { domain: 'physics' } });
    expect(canFusion(v1, v2, DEFAULT_AUTOPOIESIS_CONFIG)).toBe(false);
  });

  it('fusion: values are summed', () => {
    const v1 = makeValue('a', 10, {
      field: { domain: 'physics' },
      relation: { refs: ['b'], entanglements: ['b'] },
    });
    const v2 = makeValue('b', 20, {
      field: { domain: 'physics' },
      relation: { refs: ['a'], entanglements: ['a'] },
    });
    const result = fusion(v1, v2);
    expect(result.child.value).toBe(30);
  });

  it('fusion: C-2 relation保存 — external refs inherited', () => {
    const v1 = makeValue('a', 10, {
      field: { domain: 'default' },
      relation: { refs: ['b', 'c'], entanglements: [] },
    });
    const v2 = makeValue('b', 20, {
      field: { domain: 'default' },
      relation: { refs: ['a', 'd'], entanglements: [] },
    });
    const result = fusion(v1, v2);
    expect(result.child.sigma.relation.refs).toContain('c');
    expect(result.child.sigma.relation.refs).toContain('d');
    // a and b are parents, should not be in refs
    expect(result.child.sigma.relation.refs).not.toContain('a');
    expect(result.child.sigma.relation.refs).not.toContain('b');
  });

  it('fusion: C-3 memory因果保存 — memories combined', () => {
    const v1 = makeValue('a', 10, {
      field: { domain: 'default' },
      memory: [1, 2, 3],
      relation: { refs: [], entanglements: [] },
    });
    const v2 = makeValue('b', 20, {
      field: { domain: 'default' },
      memory: [4, 5],
      relation: { refs: [], entanglements: [] },
    });
    const result = fusion(v1, v2);
    expect(result.child.sigma.memory.length).toBe(5);
    expect(result.conservation.memoryCausalPreserved).toBe(true);
  });

  it('fusion: dependencies record parents', () => {
    const v1 = makeValue('x', 1, { field: { domain: 'default' }, relation: { refs: [], entanglements: [] } });
    const v2 = makeValue('y', 2, { field: { domain: 'default' }, relation: { refs: [], entanglements: [] } });
    const result = fusion(v1, v2);
    expect(result.child.sigma.relation.dependencies).toContain('x');
    expect(result.child.sigma.relation.dependencies).toContain('y');
  });

  it('fusion: layer depth = max of parents', () => {
    const v1 = makeValue('a', 1, {
      field: { domain: 'default' },
      layer: { depth: 2 },
      relation: { refs: [], entanglements: [] },
    });
    const v2 = makeValue('b', 2, {
      field: { domain: 'default' },
      layer: { depth: 5 },
      relation: { refs: [], entanglements: [] },
    });
    const result = fusion(v1, v2);
    expect(result.child.sigma.layer.depth).toBe(5);
  });
});

// ============================================================
// 4. BA-3: Emergence (創発)
// ============================================================

describe('Phase 7c: BA-3 Emergence', () => {

  it('canEmergence: true for connected cluster of 3+', () => {
    const v1 = makeValue('a', 1, { relation: { refs: ['b', 'c'] } });
    const v2 = makeValue('b', 2, { relation: { refs: ['a', 'c'] } });
    const v3 = makeValue('c', 3, { relation: { refs: ['a', 'b'] } });
    expect(canEmergence([v1, v2, v3], DEFAULT_AUTOPOIESIS_CONFIG)).toBe(true);
  });

  it('canEmergence: false for cluster < 3', () => {
    const v1 = makeValue('a', 1, { relation: { refs: ['b'] } });
    const v2 = makeValue('b', 2, { relation: { refs: ['a'] } });
    expect(canEmergence([v1, v2], DEFAULT_AUTOPOIESIS_CONFIG)).toBe(false);
  });

  it('canEmergence: false for unconnected cluster', () => {
    const v1 = makeValue('a', 1);
    const v2 = makeValue('b', 2);
    const v3 = makeValue('c', 3);
    expect(canEmergence([v1, v2, v3], DEFAULT_AUTOPOIESIS_CONFIG)).toBe(false);
  });

  it('emergence: creates meta-value at higher layer', () => {
    const v1 = makeValue('a', 10, { relation: { refs: ['b', 'c'] }, layer: { depth: 1 } });
    const v2 = makeValue('b', 20, { relation: { refs: ['a', 'c'] }, layer: { depth: 1 } });
    const v3 = makeValue('c', 30, { relation: { refs: ['a', 'b'] }, layer: { depth: 2 } });
    const result = emergence([v1, v2, v3]);
    expect(result.metaValue.sigma.layer.depth).toBe(3); // max(1,1,2) + 1
  });

  it('emergence: meta-value is average of cluster', () => {
    const v1 = makeValue('a', 10, { relation: { refs: ['b', 'c'] } });
    const v2 = makeValue('b', 20, { relation: { refs: ['a', 'c'] } });
    const v3 = makeValue('c', 30, { relation: { refs: ['a', 'b'] } });
    const result = emergence([v1, v2, v3]);
    expect(result.metaValue.value).toBe(20); // avg(10,20,30)
  });

  it('emergence: meta-value references all cluster members', () => {
    const v1 = makeValue('a', 1, { relation: { refs: ['b', 'c'] } });
    const v2 = makeValue('b', 2, { relation: { refs: ['a', 'c'] } });
    const v3 = makeValue('c', 3, { relation: { refs: ['a', 'b'] } });
    const result = emergence([v1, v2, v3]);
    expect(result.metaValue.sigma.relation.refs).toContain('a');
    expect(result.metaValue.sigma.relation.refs).toContain('b');
    expect(result.metaValue.sigma.relation.refs).toContain('c');
  });

  it('emergence: records emergence event in memory', () => {
    const v1 = makeValue('a', 1, { relation: { refs: ['b', 'c'] } });
    const v2 = makeValue('b', 2, { relation: { refs: ['a', 'c'] } });
    const v3 = makeValue('c', 3, { relation: { refs: ['a', 'b'] } });
    const result = emergence([v1, v2, v3]);
    expect(result.metaValue.sigma.memory[0]?.type).toBe('emergence');
  });

  it('emergence: detects complete topology', () => {
    const v1 = makeValue('a', 1, { relation: { refs: ['b', 'c'] } });
    const v2 = makeValue('b', 2, { relation: { refs: ['a', 'c'] } });
    const v3 = makeValue('c', 3, { relation: { refs: ['a', 'b'] } });
    const result = emergence([v1, v2, v3]);
    expect(result.pattern).toBe('complete');
  });

  it('emergence: collective will from majority', () => {
    const v1 = makeValue('a', 1, { relation: { refs: ['b', 'c'] }, will: { tendency: 'expand' } });
    const v2 = makeValue('b', 2, { relation: { refs: ['a', 'c'] }, will: { tendency: 'expand' } });
    const v3 = makeValue('c', 3, { relation: { refs: ['a', 'b'] }, will: { tendency: 'contract' } });
    const result = emergence([v1, v2, v3]);
    expect(result.metaValue.sigma.will.tendency).toBe('expand');
  });
});

// ============================================================
// 5. BA-4: Metamorphosis (変態)
// ============================================================

describe('Phase 7c: BA-4 Metamorphosis', () => {

  it('canMetamorphosis: true when cyclic memory pattern', () => {
    const v = makeValue('a', 50, {
      memory: ['x', 'y', 'x', 'y', 'x', 'y', 'x', 'y'],
    });
    expect(canMetamorphosis(v)).toBe(true);
  });

  it('canMetamorphosis: false with no cycle', () => {
    const v = makeValue('a', 50, {
      memory: [1, 2, 3, 4, 5, 6, 7, 8],
    });
    expect(canMetamorphosis(v)).toBe(false);
  });

  it('canMetamorphosis: false with short memory', () => {
    const v = makeValue('a', 50, { memory: [1, 2] });
    expect(canMetamorphosis(v)).toBe(false);
  });

  it('metamorphosis: changes field domain', () => {
    const v = makeValue('a', 50, {
      field: { domain: 'natural-science', center: 50, neighbors: [] },
      memory: ['x', 'y', 'x', 'y', 'x', 'y', 'x', 'y'],
    });
    const result = metamorphosis(v);
    expect(result.newField).not.toBe('natural-science');
    expect(result.after.sigma.field.domain).toBe(result.newField);
  });

  it('metamorphosis: C-4 will方向保存', () => {
    const v = makeValue('a', 50, {
      field: { domain: 'natural-science' },
      will: { tendency: 'expand', strength: 0.5 },
      memory: ['x', 'y', 'x', 'y', 'x', 'y', 'x', 'y'],
    });
    const result = metamorphosis(v);
    expect(result.after.sigma.will.tendency).toBe('expand'); // 方向保存
    expect(result.conservation.willContinuityPreserved).toBe(true);
  });

  it('metamorphosis: strength is recalculated', () => {
    const v = makeValue('a', 50, {
      field: { domain: 'natural-science' },
      will: { tendency: 'expand', strength: 0.5 },
      memory: ['x', 'y', 'x', 'y', 'x', 'y', 'x', 'y'],
    });
    const result = metamorphosis(v);
    expect(result.after.sigma.will.strength).not.toBe(0.5);
    expect(result.after.sigma.will.strength).toBeGreaterThan(0);
  });

  it('metamorphosis: records event in memory', () => {
    const v = makeValue('a', 50, {
      field: { domain: 'natural-science' },
      memory: ['x', 'y', 'x', 'y', 'x', 'y', 'x', 'y'],
    });
    const result = metamorphosis(v);
    const metaEvent = result.after.sigma.memory.find((m: any) => m?.type === 'metamorphosis');
    expect(metaEvent).toBeDefined();
    expect(metaEvent.from).toBe('natural-science');
    expect(metaEvent.to).toBe(result.newField);
  });

  it('metamorphosis: preserves id', () => {
    const v = makeValue('original_id', 50, {
      field: { domain: 'natural-science' },
      memory: ['x', 'y', 'x', 'y', 'x', 'y', 'x', 'y'],
    });
    const result = metamorphosis(v);
    expect(result.after.id).toBe('original_id');
  });
});

// ============================================================
// 6. Colony Step — Integration
// ============================================================

describe('Phase 7c: Colony Step', () => {

  it('step increments generation', () => {
    const colony = createColony([{ id: 'a', value: 10 }]);
    const result = stepColony(colony);
    expect(result.colony.generation).toBe(1);
  });

  it('step with no conditions = no events', () => {
    const colony = createColony([{ id: 'a', value: 10 }]);
    const result = stepColony(colony);
    expect(result.events.length).toBe(0);
    expect(result.populationBefore).toBe(result.populationAfter);
  });

  it('step triggers fission when conditions met', () => {
    const colony = createColony([{
      id: 'a', value: 100,
      sigma: {
        field: { domain: 'default' }, flow: { phase: 'rest' },
        memory: Array.from({ length: 15 }, (_, i) => i),
        layer: { depth: 1 }, relation: { refs: [], entanglements: [], isolated: true },
        will: { tendency: 'propagate', strength: 0.8 },
      },
    }], { birthAxioms: ['fission'] });
    const result = stepColony(colony);
    expect(result.events.some(e => e.type === 'fission')).toBe(true);
    expect(result.populationAfter).toBe(2); // 1 parent → 2 children
  });

  it('step respects maxPopulation', () => {
    const values = Array.from({ length: 100 }, (_, i) => ({
      id: `v${i}`, value: i,
      sigma: {
        field: { domain: 'default' }, flow: { phase: 'rest' },
        memory: Array.from({ length: 15 }, (_, j) => j),
        layer: { depth: 1 }, relation: { refs: [], entanglements: [], isolated: true },
        will: { tendency: 'propagate', strength: 0.8 },
      },
    }));
    const colony = createColony(values, { maxPopulation: 100 });
    const result = stepColony(colony);
    expect(result.populationAfter).toBeLessThanOrEqual(100);
  });

  it('step records events in history', () => {
    const colony = createColony([{
      id: 'a', value: 100,
      sigma: {
        field: { domain: 'default' }, flow: { phase: 'rest' },
        memory: Array.from({ length: 15 }, (_, i) => i),
        layer: { depth: 1 }, relation: { refs: [], entanglements: [], isolated: true },
        will: { tendency: 'propagate', strength: 0.8 },
      },
    }]);
    const result = stepColony(colony);
    expect(result.colony.history.length).toBe(result.events.length);
  });

  it('step events have conservation checks', () => {
    const colony = createColony([{
      id: 'a', value: 100,
      sigma: {
        field: { domain: 'default' }, flow: { phase: 'rest' },
        memory: Array.from({ length: 15 }, (_, i) => i),
        layer: { depth: 1 }, relation: { refs: [], entanglements: [], isolated: true },
        will: { tendency: 'propagate', strength: 0.8 },
      },
    }]);
    const result = stepColony(colony);
    for (const event of result.events) {
      expect(event.conservationCheck).toBeDefined();
      expect(event.conservationCheck.memoryCausalPreserved).toBe(true);
    }
  });

  it('multiple steps accumulate history', () => {
    let colony = createColony([{
      id: 'a', value: 100,
      sigma: {
        field: { domain: 'default' }, flow: { phase: 'rest' },
        memory: Array.from({ length: 15 }, (_, i) => i),
        layer: { depth: 1 }, relation: { refs: [], entanglements: [], isolated: true },
        will: { tendency: 'propagate', strength: 0.8 },
      },
    }]);
    colony = stepColony(colony).colony;
    colony = stepColony(colony).colony;
    expect(colony.generation).toBe(2);
  });
});

// ============================================================
// 7. Conservation Law Verification
// ============================================================

describe('Phase 7c: Conservation Laws', () => {

  it('C-1: fission preserves total memory count', () => {
    const mem = Array.from({ length: 20 }, (_, i) => `item_${i}`);
    const v = makeValue('a', 100, { memory: mem, will: { tendency: 'propagate' } });
    const result = fission(v, DEFAULT_AUTOPOIESIS_CONFIG);
    const total = result.child1.sigma.memory.length + result.child2.sigma.memory.length;
    expect(total).toBe(20);
  });

  it('C-2: fusion preserves external relations', () => {
    const v1 = makeValue('a', 10, {
      field: { domain: 'default' },
      relation: { refs: ['b', 'external1'], entanglements: [] },
    });
    const v2 = makeValue('b', 20, {
      field: { domain: 'default' },
      relation: { refs: ['a', 'external2'], entanglements: [] },
    });
    const result = fusion(v1, v2);
    expect(result.child.sigma.relation.refs).toContain('external1');
    expect(result.child.sigma.relation.refs).toContain('external2');
  });

  it('C-3: emergence preserves causal chain', () => {
    const v1 = makeValue('a', 1, { relation: { refs: ['b', 'c'] }, memory: ['history_a'] });
    const v2 = makeValue('b', 2, { relation: { refs: ['a', 'c'] }, memory: ['history_b'] });
    const v3 = makeValue('c', 3, { relation: { refs: ['a', 'b'] }, memory: ['history_c'] });
    const result = emergence([v1, v2, v3]);
    // meta-value's memory contains emergence event
    expect(result.metaValue.sigma.memory.length).toBeGreaterThan(0);
    expect(result.conservation.memoryCausalPreserved).toBe(true);
  });

  it('C-4: metamorphosis preserves will direction', () => {
    const v = makeValue('a', 50, {
      field: { domain: 'natural-science' },
      will: { tendency: 'harmonize', strength: 0.9 },
      memory: ['x', 'y', 'x', 'y', 'x', 'y', 'x', 'y'],
    });
    const result = metamorphosis(v);
    expect(result.after.sigma.will.tendency).toBe('harmonize');
  });
});

// ============================================================
// 8. Edge Cases
// ============================================================

describe('Phase 7c: Edge Cases', () => {

  it('fission of value=1 produces 0+1', () => {
    const v = makeValue('a', 1, {
      memory: Array.from({ length: 12 }, (_, i) => i),
      will: { tendency: 'propagate' },
    });
    const result = fission(v, DEFAULT_AUTOPOIESIS_CONFIG);
    expect(result.child1.value + result.child2.value).toBe(1);
  });

  it('fission of value=0', () => {
    const v = makeValue('a', 0, {
      memory: Array.from({ length: 12 }, (_, i) => i),
      will: { tendency: 'propagate' },
    });
    const result = fission(v, DEFAULT_AUTOPOIESIS_CONFIG);
    expect(result.child1.value + result.child2.value).toBe(0);
  });

  it('fusion with empty memories', () => {
    const v1 = makeValue('a', 10, { field: { domain: 'default' }, relation: { refs: [], entanglements: [] } });
    const v2 = makeValue('b', 20, { field: { domain: 'default' }, relation: { refs: [], entanglements: [] } });
    const result = fusion(v1, v2);
    expect(result.child.sigma.memory.length).toBe(0);
  });

  it('emergence with minimum cluster size 3', () => {
    const v1 = makeValue('a', 1, { relation: { refs: ['b', 'c'] } });
    const v2 = makeValue('b', 2, { relation: { refs: ['a', 'c'] } });
    const v3 = makeValue('c', 3, { relation: { refs: ['a', 'b'] } });
    const result = emergence([v1, v2, v3]);
    expect(result.metaValue).toBeDefined();
  });

  it('stepColony with disabled axioms = no events', () => {
    const colony = createColony([{
      id: 'a', value: 100,
      sigma: {
        field: { domain: 'default' }, flow: { phase: 'rest' },
        memory: Array.from({ length: 15 }, (_, i) => i),
        layer: { depth: 1 }, relation: { refs: [], entanglements: [], isolated: true },
        will: { tendency: 'propagate', strength: 0.8 },
      },
    }], { birthAxioms: [] });
    const result = stepColony(colony);
    expect(result.events.length).toBe(0);
  });
});
