/**
 * Phase 7d Tests — σ創発エンジン
 * 
 * Emergence Metrics: 構造複雑度, 機能多様度, 情報超過量, 意志収束度
 * Ecosystem observation and emergent property detection
 */

import { describe, it, expect } from 'vitest';
import {
  createEcosystem,
  measureStructuralComplexity,
  measureFunctionalDiversity,
  measureInformationExcess,
  measureWillConvergence,
  observe,
  observeAndRecord,
  type EcosystemValue,
  type Ecosystem,
} from '../src/lang/sigma-emergence';

// ============================================================
// Helper
// ============================================================

function makeEcoValue(id: string, overrides: Record<string, any> = {}): EcosystemValue {
  return {
    id,
    value: Math.floor(Math.random() * 100),
    sigma: {
      field: { center: 0, neighbors: [], dim: 0, domain: 'default' },
      flow: { velocity: 0, phase: 'rest' },
      memory: [],
      layer: { depth: 1, structure: 'flat' },
      relation: { refs: [], isolated: true },
      will: { tendency: 'rest', strength: 0 },
      ...overrides,
    },
  };
}

// ============================================================
// 1. EM-1: Structural Complexity
// ============================================================

describe('Phase 7d: EM-1 Structural Complexity', () => {

  it('isolated values = zero complexity', () => {
    const values = [makeEcoValue('a'), makeEcoValue('b'), makeEcoValue('c')];
    const result = measureStructuralComplexity(values);
    expect(result.complexity).toBe(0);
    expect(result.topology).toBe('sparse');
  });

  it('fully connected = high complexity', () => {
    const values = [
      makeEcoValue('a', { relation: { refs: ['b', 'c'] } }),
      makeEcoValue('b', { relation: { refs: ['a', 'c'] } }),
      makeEcoValue('c', { relation: { refs: ['a', 'b'] } }),
    ];
    const result = measureStructuralComplexity(values);
    expect(result.complexity).toBeGreaterThan(0.5);
    expect(result.topology).toBe('complete');
    expect(result.emergentStructures).toContain('fully-connected-cluster');
  });

  it('star topology detected', () => {
    const values = [
      makeEcoValue('hub', { relation: { refs: ['a', 'b', 'c'] } }),
      makeEcoValue('a', { relation: { refs: ['hub'] } }),
      makeEcoValue('b', { relation: { refs: ['hub'] } }),
      makeEcoValue('c', { relation: { refs: ['hub'] } }),
    ];
    const result = measureStructuralComplexity(values);
    expect(result.topology).toBe('star');
  });

  it('single value = zero complexity', () => {
    const result = measureStructuralComplexity([makeEcoValue('a')]);
    expect(result.complexity).toBe(0);
  });

  it('connection density is normalized', () => {
    const values = [
      makeEcoValue('a', { relation: { refs: ['b'] } }),
      makeEcoValue('b', { relation: { refs: ['a'] } }),
      makeEcoValue('c'),
    ];
    const result = measureStructuralComplexity(values);
    expect(result.connectionDensity).toBeGreaterThan(0);
    expect(result.connectionDensity).toBeLessThanOrEqual(1);
  });

  it('hierarchical structure detected', () => {
    const values = [
      makeEcoValue('a', { relation: { refs: ['b'] }, layer: { depth: 1 } }),
      makeEcoValue('b', { relation: { refs: ['a', 'c'] }, layer: { depth: 2 } }),
      makeEcoValue('c', { relation: { refs: ['b'] }, layer: { depth: 3 } }),
    ];
    const result = measureStructuralComplexity(values);
    // 3-node chain detected as star (center=b) with hierarchical layers
    expect(['star', 'connected']).toContain(result.topology);
    expect(result.emergentStructures).toContain('hierarchical-layers');
  });

  it('empty values = zero', () => {
    const result = measureStructuralComplexity([]);
    expect(result.complexity).toBe(0);
  });
});

// ============================================================
// 2. EM-2: Functional Diversity
// ============================================================

describe('Phase 7d: EM-2 Functional Diversity', () => {

  it('single domain = low diversity', () => {
    const values = [
      makeEcoValue('a', { field: { domain: 'physics' } }),
      makeEcoValue('b', { field: { domain: 'physics' } }),
    ];
    const result = measureFunctionalDiversity(values);
    expect(result.uniqueDomains.length).toBe(1);
    expect(result.diversity).toBeLessThan(0.5);
  });

  it('multiple domains = higher diversity', () => {
    const values = [
      makeEcoValue('a', { field: { domain: 'physics' } }),
      makeEcoValue('b', { field: { domain: 'music' } }),
      makeEcoValue('c', { field: { domain: 'economics' } }),
    ];
    const result = measureFunctionalDiversity(values);
    expect(result.uniqueDomains.length).toBe(3);
    expect(result.diversity).toBeGreaterThan(0.1);
  });

  it('cross-domain bridges detected', () => {
    const values = [
      makeEcoValue('a', { field: { domain: 'physics' }, relation: { refs: ['b'] } }),
      makeEcoValue('b', { field: { domain: 'music' }, relation: { refs: ['a'] } }),
    ];
    const result = measureFunctionalDiversity(values);
    expect(result.bridgeCapabilities.length).toBeGreaterThan(0);
    expect(result.bridgeCapabilities.some(b => b.includes('physics') && b.includes('music'))).toBe(true);
  });

  it('no bridges for same-domain relations', () => {
    const values = [
      makeEcoValue('a', { field: { domain: 'physics' }, relation: { refs: ['b'] } }),
      makeEcoValue('b', { field: { domain: 'physics' }, relation: { refs: ['a'] } }),
    ];
    const result = measureFunctionalDiversity(values);
    expect(result.bridgeCapabilities.length).toBe(0);
  });

  it('all 7 domains = maximum diversity', () => {
    const domains = ['natural-science', 'info-engineering', 'humanities', 'art', 'music', 'economics', 'linguistics'];
    const values = domains.map((d, i) => makeEcoValue(`v${i}`, { field: { domain: d } }));
    const result = measureFunctionalDiversity(values);
    expect(result.uniqueDomains.length).toBe(7);
    expect(result.diversity).toBeGreaterThan(0.4);
  });

  it('transformation paths count bridges', () => {
    const values = [
      makeEcoValue('a', { field: { domain: 'physics' }, relation: { refs: ['b'] } }),
      makeEcoValue('b', { field: { domain: 'music' }, relation: { refs: ['c'] } }),
      makeEcoValue('c', { field: { domain: 'economics' }, relation: { refs: ['a'] } }),
    ];
    const result = measureFunctionalDiversity(values);
    expect(result.transformationPaths).toBeGreaterThan(0);
  });
});

// ============================================================
// 3. EM-3: Information Excess
// ============================================================

describe('Phase 7d: EM-3 Information Excess', () => {

  it('empty memories = zero excess', () => {
    const values = [makeEcoValue('a'), makeEcoValue('b')];
    const result = measureInformationExcess(values);
    expect(result.excess).toBe(0);
    expect(result.individualTotal).toBe(0);
  });

  it('shared patterns increase excess', () => {
    const values = [
      makeEcoValue('a', { memory: ['pattern_A', 'unique_1'] }),
      makeEcoValue('b', { memory: ['pattern_A', 'unique_2'] }),
    ];
    const result = measureInformationExcess(values);
    expect(result.sharedPatterns.length).toBeGreaterThan(0);
    expect(result.collectiveTotal).toBeGreaterThan(result.individualTotal);
    expect(result.excess).toBeGreaterThan(0);
  });

  it('no shared patterns = zero excess', () => {
    const values = [
      makeEcoValue('a', { memory: ['unique_1'] }),
      makeEcoValue('b', { memory: ['unique_2'] }),
    ];
    const result = measureInformationExcess(values);
    expect(result.sharedPatterns.length).toBe(0);
    expect(result.excess).toBe(0);
  });

  it('multiple shared patterns = higher excess', () => {
    const values = [
      makeEcoValue('a', { memory: ['p1', 'p2', 'p3'] }),
      makeEcoValue('b', { memory: ['p1', 'p2', 'p4'] }),
      makeEcoValue('c', { memory: ['p1', 'p3', 'p5'] }),
    ];
    const result = measureInformationExcess(values);
    expect(result.sharedPatterns.length).toBeGreaterThanOrEqual(2);
  });

  it('individual total counts all memories', () => {
    const values = [
      makeEcoValue('a', { memory: [1, 2, 3] }),
      makeEcoValue('b', { memory: [4, 5] }),
    ];
    const result = measureInformationExcess(values);
    expect(result.individualTotal).toBe(5);
  });
});

// ============================================================
// 4. EM-4: Will Convergence
// ============================================================

describe('Phase 7d: EM-4 Will Convergence', () => {

  it('unanimous will = high convergence', () => {
    const values = [
      makeEcoValue('a', { will: { tendency: 'expand', strength: 0.8 } }),
      makeEcoValue('b', { will: { tendency: 'expand', strength: 0.7 } }),
      makeEcoValue('c', { will: { tendency: 'expand', strength: 0.9 } }),
    ];
    const result = measureWillConvergence(values);
    expect(result.convergence).toBeGreaterThan(0.5);
    expect(result.collectiveWill).toBe('expand');
    expect(result.agreement).toBe(1);
  });

  it('diverse wills = low convergence', () => {
    const values = [
      makeEcoValue('a', { will: { tendency: 'expand', strength: 0.3 } }),
      makeEcoValue('b', { will: { tendency: 'contract', strength: 0.3 } }),
      makeEcoValue('c', { will: { tendency: 'harmonize', strength: 0.3 } }),
    ];
    const result = measureWillConvergence(values);
    expect(result.agreement).toBeLessThan(0.5);
  });

  it('majority strategy picks most common', () => {
    const values = [
      makeEcoValue('a', { will: { tendency: 'expand' } }),
      makeEcoValue('b', { will: { tendency: 'expand' } }),
      makeEcoValue('c', { will: { tendency: 'contract' } }),
    ];
    const result = measureWillConvergence(values, 'majority');
    expect(result.collectiveWill).toBe('expand');
  });

  it('consensus strategy: all agree', () => {
    const values = [
      makeEcoValue('a', { will: { tendency: 'harmonize' } }),
      makeEcoValue('b', { will: { tendency: 'harmonize' } }),
    ];
    const result = measureWillConvergence(values, 'consensus');
    expect(result.collectiveWill).toBe('harmonize');
  });

  it('consensus strategy: no consensus = rest', () => {
    const values = [
      makeEcoValue('a', { will: { tendency: 'expand' } }),
      makeEcoValue('b', { will: { tendency: 'contract' } }),
    ];
    const result = measureWillConvergence(values, 'consensus');
    expect(result.collectiveWill).toBe('rest');
  });

  it('emergent strategy: expand+contract = oscillate', () => {
    const values = [
      makeEcoValue('a', { will: { tendency: 'expand', strength: 0.9 } }),
      makeEcoValue('b', { will: { tendency: 'expand', strength: 0.8 } }),
      makeEcoValue('c', { will: { tendency: 'contract', strength: 0.7 } }),
    ];
    const result = measureWillConvergence(values, 'emergent');
    expect(result.emergentWill).toBe('oscillate');
  });

  it('emergent strategy: explore+harmonize = optimize', () => {
    const values = [
      makeEcoValue('a', { will: { tendency: 'explore', strength: 0.9 } }),
      makeEcoValue('b', { will: { tendency: 'explore', strength: 0.8 } }),
      makeEcoValue('c', { will: { tendency: 'harmonize', strength: 0.7 } }),
    ];
    const result = measureWillConvergence(values, 'emergent');
    expect(result.emergentWill).toBe('optimize');
  });

  it('empty values = zero convergence', () => {
    const result = measureWillConvergence([]);
    expect(result.convergence).toBe(0);
  });

  it('individual wills are recorded', () => {
    const values = [
      makeEcoValue('a', { will: { tendency: 'expand' } }),
      makeEcoValue('b', { will: { tendency: 'contract' } }),
    ];
    const result = measureWillConvergence(values);
    expect(result.individualWills).toEqual(['expand', 'contract']);
  });
});

// ============================================================
// 5. Ecosystem Creation
// ============================================================

describe('Phase 7d: Ecosystem', () => {

  it('creates ecosystem with values', () => {
    const eco = createEcosystem([
      { id: 'a', value: 10 },
      { id: 'b', value: 20 },
    ]);
    expect(eco.values.length).toBe(2);
    expect(eco.observations.length).toBe(0);
  });

  it('assigns default sigma', () => {
    const eco = createEcosystem([{ id: 'x', value: 5 }]);
    expect(eco.values[0].sigma.field).toBeDefined();
    expect(eco.values[0].sigma.will).toBeDefined();
  });

  it('accepts custom config', () => {
    const eco = createEcosystem([], { emergenceThreshold: 0.8 });
    expect(eco.config.emergenceThreshold).toBe(0.8);
  });

  it('preserves custom sigma', () => {
    const eco = createEcosystem([{
      id: 'a', value: 1,
      sigma: { field: { domain: 'music' }, flow: {}, memory: [], layer: {}, relation: {}, will: {} },
    }]);
    expect(eco.values[0].sigma.field.domain).toBe('music');
  });
});

// ============================================================
// 6. Unified Observation
// ============================================================

describe('Phase 7d: Unified Observation', () => {

  it('observe returns all 4 metrics', () => {
    const eco = createEcosystem([
      { id: 'a', value: 10 },
      { id: 'b', value: 20 },
    ]);
    const obs = observe(eco);
    expect(obs.metrics.structuralComplexity).toBeDefined();
    expect(obs.metrics.functionalDiversity).toBeDefined();
    expect(obs.metrics.informationExcess).toBeDefined();
    expect(obs.metrics.willConvergence).toBeDefined();
  });

  it('observe has timestamp', () => {
    const eco = createEcosystem([{ id: 'a', value: 1 }]);
    const obs = observe(eco);
    expect(obs.timestamp).toBeDefined();
  });

  it('overall emergence is 0-1', () => {
    const eco = createEcosystem([{ id: 'a', value: 1 }, { id: 'b', value: 2 }]);
    const obs = observe(eco);
    expect(obs.overallEmergence).toBeGreaterThanOrEqual(0);
    expect(obs.overallEmergence).toBeLessThanOrEqual(1);
  });

  it('rich ecosystem has emergent properties', () => {
    const eco = createEcosystem([
      { id: 'a', value: 10, sigma: {
        field: { domain: 'physics' }, flow: {}, memory: ['shared_pattern'],
        layer: { depth: 1 }, relation: { refs: ['b', 'c'] },
        will: { tendency: 'expand', strength: 0.8 },
      }},
      { id: 'b', value: 20, sigma: {
        field: { domain: 'music' }, flow: {}, memory: ['shared_pattern'],
        layer: { depth: 2 }, relation: { refs: ['a', 'c'] },
        will: { tendency: 'expand', strength: 0.7 },
      }},
      { id: 'c', value: 30, sigma: {
        field: { domain: 'economics' }, flow: {}, memory: ['shared_pattern'],
        layer: { depth: 1 }, relation: { refs: ['a', 'b'] },
        will: { tendency: 'contract', strength: 0.6 },
      }},
    ]);
    const obs = observe(eco);
    expect(obs.emergentProperties.length).toBeGreaterThan(0);
    expect(obs.overallEmergence).toBeGreaterThan(0);
  });

  it('observeAndRecord adds to observations', () => {
    const eco = createEcosystem([{ id: 'a', value: 1 }]);
    const eco2 = observeAndRecord(eco);
    expect(eco2.observations.length).toBe(1);
    const eco3 = observeAndRecord(eco2);
    expect(eco3.observations.length).toBe(2);
  });

  it('structural emergence detected in fully connected', () => {
    const eco = createEcosystem([
      { id: 'a', value: 1, sigma: {
        field: { domain: 'default' }, flow: {}, memory: [], layer: { depth: 1 },
        relation: { refs: ['b', 'c'] }, will: { tendency: 'rest' },
      }},
      { id: 'b', value: 2, sigma: {
        field: { domain: 'default' }, flow: {}, memory: [], layer: { depth: 1 },
        relation: { refs: ['a', 'c'] }, will: { tendency: 'rest' },
      }},
      { id: 'c', value: 3, sigma: {
        field: { domain: 'default' }, flow: {}, memory: [], layer: { depth: 1 },
        relation: { refs: ['a', 'b'] }, will: { tendency: 'rest' },
      }},
    ]);
    const obs = observe(eco);
    const structural = obs.emergentProperties.find(p => p.pattern === 'structural');
    expect(structural).toBeDefined();
    expect(structural!.strength).toBeGreaterThan(0);
  });

  it('functional emergence detected with cross-domain bridges', () => {
    const eco = createEcosystem([
      { id: 'a', value: 1, sigma: {
        field: { domain: 'physics' }, flow: {}, memory: [], layer: {},
        relation: { refs: ['b'] }, will: { tendency: 'rest' },
      }},
      { id: 'b', value: 2, sigma: {
        field: { domain: 'music' }, flow: {}, memory: [], layer: {},
        relation: { refs: ['a'] }, will: { tendency: 'rest' },
      }},
    ]);
    const obs = observe(eco);
    const functional = obs.emergentProperties.find(p => p.pattern === 'functional');
    expect(functional).toBeDefined();
  });

  it('informational emergence from shared memory patterns', () => {
    const eco = createEcosystem([
      { id: 'a', value: 1, sigma: {
        field: {}, flow: {}, memory: ['shared_x', 'shared_y'], layer: {},
        relation: { refs: [] }, will: { tendency: 'rest' },
      }},
      { id: 'b', value: 2, sigma: {
        field: {}, flow: {}, memory: ['shared_x', 'shared_y'], layer: {},
        relation: { refs: [] }, will: { tendency: 'rest' },
      }},
    ]);
    const obs = observe(eco);
    const informational = obs.emergentProperties.find(p => p.pattern === 'informational');
    expect(informational).toBeDefined();
  });

  it('volitional emergence: expand+contract→oscillate', () => {
    const eco = createEcosystem([
      { id: 'a', value: 1, sigma: {
        field: {}, flow: {}, memory: [], layer: {},
        relation: { refs: [] }, will: { tendency: 'expand', strength: 0.9 },
      }},
      { id: 'b', value: 2, sigma: {
        field: {}, flow: {}, memory: [], layer: {},
        relation: { refs: [] }, will: { tendency: 'expand', strength: 0.8 },
      }},
      { id: 'c', value: 3, sigma: {
        field: {}, flow: {}, memory: [], layer: {},
        relation: { refs: [] }, will: { tendency: 'contract', strength: 0.7 },
      }},
    ], { collectiveWillStrategy: 'emergent' });
    const obs = observe(eco);
    const volitional = obs.emergentProperties.find(p => p.pattern === 'volitional');
    expect(volitional).toBeDefined();
    expect(volitional!.description).toContain('oscillate');
  });

  it('disabled patterns not detected', () => {
    const eco = createEcosystem([
      { id: 'a', value: 1, sigma: {
        field: { domain: 'physics' }, flow: {}, memory: ['shared'], layer: {},
        relation: { refs: ['b'] }, will: { tendency: 'expand', strength: 0.9 },
      }},
      { id: 'b', value: 2, sigma: {
        field: { domain: 'music' }, flow: {}, memory: ['shared'], layer: {},
        relation: { refs: ['a'] }, will: { tendency: 'contract', strength: 0.8 },
      }},
    ], { patterns: ['structural'] });
    const obs = observe(eco);
    expect(obs.emergentProperties.every(p => p.pattern === 'structural')).toBe(true);
  });
});

// ============================================================
// 7. Edge Cases
// ============================================================

describe('Phase 7d: Edge Cases', () => {

  it('single value ecosystem', () => {
    const eco = createEcosystem([{ id: 'alone', value: 42 }]);
    const obs = observe(eco);
    expect(obs.overallEmergence).toBeLessThan(0.3);
    expect(obs.emergentProperties.length).toBe(0);
  });

  it('empty ecosystem', () => {
    const eco = createEcosystem([]);
    const obs = observe(eco);
    expect(obs.overallEmergence).toBe(0);
  });

  it('large ecosystem (20 values)', () => {
    const values = Array.from({ length: 20 }, (_, i) => ({
      id: `v${i}`,
      value: i * 10,
      sigma: {
        field: { domain: ['physics', 'music', 'economics'][i % 3] },
        flow: {}, memory: [`common_${i % 3}`],
        layer: { depth: (i % 3) + 1 },
        relation: { refs: i > 0 ? [`v${i - 1}`] : [] },
        will: { tendency: ['expand', 'contract', 'harmonize'][i % 3], strength: 0.5 },
      },
    }));
    const eco = createEcosystem(values);
    const obs = observe(eco);
    expect(obs.metrics).toBeDefined();
    expect(obs.overallEmergence).toBeGreaterThanOrEqual(0);
  });

  it('metrics are all numbers', () => {
    const eco = createEcosystem([
      { id: 'a', value: 1 },
      { id: 'b', value: 2 },
    ]);
    const obs = observe(eco);
    expect(typeof obs.metrics.structuralComplexity).toBe('number');
    expect(typeof obs.metrics.functionalDiversity).toBe('number');
    expect(typeof obs.metrics.informationExcess).toBe('number');
    expect(typeof obs.metrics.willConvergence).toBe('number');
    expect(!isNaN(obs.overallEmergence)).toBe(true);
  });
});
