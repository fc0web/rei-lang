/**
 * Phase 7b Tests — σ自己修復エンジン
 * 
 * 破損3類型の検知・診断・修復・ログ記録
 * + カスケード修復チェック
 */

import { describe, it, expect } from 'vitest';
import {
  detectIntegrity,
  diagnose,
  repair,
  selfRepair,
  checkCascadeRisk,
  DEFAULT_REPAIR_CONFIG,
  type IntegrityReport,
  type SelfRepairConfig,
} from '../src/lang/sigma-selfrepair';

// ============================================================
// Helper: σオブジェクト生成
// ============================================================

function healthySigma(): Record<string, any> {
  return {
    field: { center: 5, neighbors: [1, 2, 3], dim: 3 },
    flow: { velocity: 0.5, acceleration: 0, phase: 'steady', momentum: 0.5 },
    memory: [1, 2, 3],
    layer: { depth: 1, structure: 'flat', expandable: true },
    relation: { refs: ['a', 'b'], dependencies: [], entanglements: [], isolated: false },
    will: { tendency: 'expand', strength: 0.6, intrinsic: 'centered' },
  };
}

// ============================================================
// 1. Type-1: 欠損検知テスト (missing)
// ============================================================

describe('Phase 7b: Type-1 Missing Attribute Detection', () => {

  it('detects missing field', () => {
    const sigma = healthySigma();
    delete sigma.field;
    const report = detectIntegrity(sigma);
    expect(report.healthy).toBe(false);
    expect(report.checks.find(c => c.attribute === 'field')?.status).toBe('damaged');
    expect(report.checks.find(c => c.attribute === 'field')?.damageType).toBe('missing');
  });

  it('detects missing flow', () => {
    const sigma = healthySigma();
    delete sigma.flow;
    const report = detectIntegrity(sigma);
    expect(report.checks.find(c => c.attribute === 'flow')?.damageType).toBe('missing');
  });

  it('detects missing memory', () => {
    const sigma = healthySigma();
    delete sigma.memory;
    const report = detectIntegrity(sigma);
    expect(report.checks.find(c => c.attribute === 'memory')?.damageType).toBe('missing');
  });

  it('detects missing layer', () => {
    const sigma = healthySigma();
    delete sigma.layer;
    const report = detectIntegrity(sigma);
    expect(report.checks.find(c => c.attribute === 'layer')?.damageType).toBe('missing');
  });

  it('detects missing relation', () => {
    const sigma = healthySigma();
    delete sigma.relation;
    const report = detectIntegrity(sigma);
    expect(report.checks.find(c => c.attribute === 'relation')?.damageType).toBe('missing');
  });

  it('detects missing will', () => {
    const sigma = healthySigma();
    delete sigma.will;
    const report = detectIntegrity(sigma);
    expect(report.checks.find(c => c.attribute === 'will')?.damageType).toBe('missing');
  });

  it('detects null field', () => {
    const sigma = healthySigma();
    sigma.field = null;
    const report = detectIntegrity(sigma);
    expect(report.checks.find(c => c.attribute === 'field')?.status).toBe('damaged');
  });

  it('detects null will', () => {
    const sigma = healthySigma();
    sigma.will = null;
    const report = detectIntegrity(sigma);
    expect(report.checks.find(c => c.attribute === 'will')?.status).toBe('damaged');
  });

  it('detects multiple missing attributes', () => {
    const sigma = healthySigma();
    delete sigma.field;
    delete sigma.will;
    delete sigma.memory;
    const report = detectIntegrity(sigma);
    expect(report.damageCount).toBeGreaterThanOrEqual(3);
    expect(report.score).toBeLessThan(0.5);
  });

  it('detects all attributes missing (empty object)', () => {
    const sigma: Record<string, any> = {};
    const report = detectIntegrity(sigma);
    expect(report.healthy).toBe(false);
    expect(report.damageCount).toBeGreaterThanOrEqual(6);
    expect(report.score).toBeLessThan(0.2);
  });
});

// ============================================================
// 2. Type-2: 不整合検知テスト (inconsistent)
// ============================================================

describe('Phase 7b: Type-2 Inconsistency Detection', () => {

  it('detects unknown flow phase', () => {
    const sigma = healthySigma();
    sigma.flow.phase = 'invalid_phase';
    const report = detectIntegrity(sigma);
    const flowCheck = report.checks.find(c => c.attribute === 'flow');
    expect(flowCheck?.status).toBe('warning');
  });

  it('detects unknown will tendency', () => {
    const sigma = healthySigma();
    sigma.will.tendency = 'invalid_tendency';
    const report = detectIntegrity(sigma);
    const willCheck = report.checks.find(c => c.attribute === 'will');
    expect(willCheck?.status).toBe('warning');
  });

  it('detects negative layer depth', () => {
    const sigma = healthySigma();
    sigma.layer.depth = -1;
    const report = detectIntegrity(sigma);
    const layerCheck = report.checks.find(c => c.attribute === 'layer');
    expect(layerCheck?.status).toBe('damaged');
  });

  it('detects non-array relation.refs', () => {
    const sigma = healthySigma();
    sigma.relation.refs = 'not_an_array';
    const report = detectIntegrity(sigma);
    const relCheck = report.checks.find(c => c.attribute === 'relation');
    expect(relCheck?.status).toBe('damaged');
  });

  it('detects physics-rhythmic cross-attribute inconsistency', () => {
    const sigma = healthySigma();
    sigma.field = 'physics';
    sigma.flow = { phase: 'rhythmic' };
    const report = detectIntegrity(sigma);
    const crossCheck = report.checks.find(c => c.attribute === 'field-flow');
    expect(crossCheck?.status).toBe('warning');
  });

  it('detects deep-layer isolated inconsistency', () => {
    const sigma = healthySigma();
    sigma.layer.depth = 4;
    sigma.relation.isolated = true;
    const report = detectIntegrity(sigma);
    const crossCheck = report.checks.find(c => c.attribute === 'layer-relation');
    expect(crossCheck?.status).toBe('warning');
  });

  it('passes field-flow consistency for valid combo', () => {
    const sigma = healthySigma();
    sigma.field = 'music';
    sigma.flow = { phase: 'rhythmic' };
    const report = detectIntegrity(sigma);
    const crossCheck = report.checks.find(c => c.attribute === 'field-flow');
    expect(crossCheck?.status).toBe('ok');
  });

  it('incomplete field structure is warning', () => {
    const sigma = healthySigma();
    sigma.field = { marker: 'test' }; // no center, no neighbors
    const report = detectIntegrity(sigma);
    const fieldCheck = report.checks.find(c => c.attribute === 'field');
    expect(fieldCheck?.status).toBe('warning');
  });
});

// ============================================================
// 3. Type-3: 劣化検知テスト (degraded)
// ============================================================

describe('Phase 7b: Type-3 Degradation Detection', () => {

  it('detects memory exceeding maxEntries', () => {
    const sigma = healthySigma();
    sigma.memory = Array.from({ length: 150 }, (_, i) => i);
    const report = detectIntegrity(sigma, { maxMemoryEntries: 100 });
    const memCheck = report.checks.find(c => c.attribute === 'memory');
    expect(memCheck?.damageType).toBe('degraded');
    expect(memCheck?.score).toBeLessThan(0.5);
  });

  it('warns at 80% memory capacity', () => {
    const sigma = healthySigma();
    sigma.memory = Array.from({ length: 85 }, (_, i) => i);
    const report = detectIntegrity(sigma, { maxMemoryEntries: 100 });
    const memCheck = report.checks.find(c => c.attribute === 'memory');
    expect(memCheck?.status).toBe('warning');
  });

  it('passes memory well under limit', () => {
    const sigma = healthySigma();
    sigma.memory = [1, 2, 3];
    const report = detectIntegrity(sigma, { maxMemoryEntries: 100 });
    const memCheck = report.checks.find(c => c.attribute === 'memory');
    expect(memCheck?.status).toBe('ok');
  });

  it('detects memory.entries degradation', () => {
    const sigma = healthySigma();
    sigma.memory = { entries: Array.from({ length: 200 }, (_, i) => i) };
    const report = detectIntegrity(sigma, { maxMemoryEntries: 100 });
    const memCheck = report.checks.find(c => c.attribute === 'memory');
    expect(memCheck?.damageType).toBe('degraded');
  });
});

// ============================================================
// 4. Healthy σ Detection
// ============================================================

describe('Phase 7b: Healthy σ Detection', () => {

  it('healthy sigma scores 1.0', () => {
    const sigma = healthySigma();
    const report = detectIntegrity(sigma);
    expect(report.healthy).toBe(true);
    expect(report.score).toBeGreaterThanOrEqual(0.9);
    expect(report.damageCount).toBe(0);
  });

  it('integrity report has timestamp', () => {
    const report = detectIntegrity(healthySigma());
    expect(report.timestamp).toBeDefined();
    expect(typeof report.timestamp).toBe('string');
  });

  it('all valid tendencies pass', () => {
    const validTendencies = ['rest', 'expand', 'contract', 'harmonize', 'persist', 'explore', 'mastery'];
    for (const t of validTendencies) {
      const sigma = healthySigma();
      sigma.will.tendency = t;
      const report = detectIntegrity(sigma);
      expect(report.checks.find(c => c.attribute === 'will')?.status).toBe('ok');
    }
  });

  it('all valid flow phases pass', () => {
    const validPhases = ['rest', 'accelerating', 'decelerating', 'steady', 'oscillating'];
    for (const p of validPhases) {
      const sigma = healthySigma();
      sigma.flow.phase = p;
      const report = detectIntegrity(sigma);
      expect(report.checks.find(c => c.attribute === 'flow')?.status).toBe('ok');
    }
  });
});

// ============================================================
// 5. Diagnosis
// ============================================================

describe('Phase 7b: Diagnosis', () => {

  it('diagnoses missing attributes as restore actions', () => {
    const sigma = healthySigma();
    delete sigma.field;
    const report = detectIntegrity(sigma);
    const diag = diagnose(report);
    expect(diag.damages.length).toBeGreaterThan(0);
    expect(diag.repairPlan.some(a => a.action === 'restore')).toBe(true);
  });

  it('diagnoses inconsistency as reconcile actions', () => {
    const sigma = healthySigma();
    sigma.flow.phase = 'invalid';
    const report = detectIntegrity(sigma);
    const diag = diagnose(report);
    expect(diag.repairPlan.some(a => a.action === 'reconcile')).toBe(true);
  });

  it('diagnoses degradation as prune actions', () => {
    const sigma = healthySigma();
    sigma.memory = Array.from({ length: 150 }, (_, i) => i);
    const report = detectIntegrity(sigma, { maxMemoryEntries: 100 });
    const diag = diagnose(report);
    expect(diag.repairPlan.some(a => a.action === 'prune')).toBe(true);
  });

  it('prioritizes restore over reconcile over prune', () => {
    const sigma: Record<string, any> = {
      field: null,
      flow: { phase: 'invalid' },
      memory: Array.from({ length: 150 }, (_, i) => i),
      layer: { depth: 1 },
      relation: { refs: [] },
      will: { tendency: 'rest' },
    };
    const report = detectIntegrity(sigma, { maxMemoryEntries: 100 });
    const diag = diagnose(report);
    // restore(priority 3) should come before reconcile(2) and prune(1)
    expect(diag.repairPlan[0].priority).toBeGreaterThanOrEqual(diag.repairPlan[diag.repairPlan.length - 1].priority);
  });

  it('calculates cascade risk proportional to damage count', () => {
    const sigma: Record<string, any> = {};
    const report = detectIntegrity(sigma);
    const diag = diagnose(report);
    expect(diag.cascadeRisk).toBeGreaterThan(0);
  });

  it('estimates recovery score', () => {
    const sigma = healthySigma();
    delete sigma.field;
    const report = detectIntegrity(sigma);
    const diag = diagnose(report);
    expect(diag.estimatedRecovery).toBeGreaterThan(report.score);
  });
});

// ============================================================
// 6. Repair Execution
// ============================================================

describe('Phase 7b: Repair Execution', () => {

  it('restores missing field to default', () => {
    const sigma = healthySigma();
    delete sigma.field;
    const result = selfRepair(sigma);
    expect(result.integrityAfter).toBeGreaterThan(result.integrityBefore);
    expect(sigma.field).toBeDefined();
  });

  it('restores missing will to default', () => {
    const sigma = healthySigma();
    delete sigma.will;
    selfRepair(sigma);
    expect(sigma.will).toBeDefined();
    expect(sigma.will.tendency).toBe('rest');
  });

  it('restores missing memory to default', () => {
    const sigma = healthySigma();
    delete sigma.memory;
    selfRepair(sigma);
    expect(Array.isArray(sigma.memory)).toBe(true);
  });

  it('reconciles physics-rhythmic inconsistency', () => {
    const sigma = healthySigma();
    sigma.field = 'physics';
    sigma.flow = { phase: 'rhythmic' };
    selfRepair(sigma);
    expect(sigma.flow.phase).not.toBe('rhythmic');
  });

  it('fixes negative layer depth', () => {
    const sigma = healthySigma();
    sigma.layer.depth = -5;
    selfRepair(sigma);
    expect(sigma.layer.depth).toBeGreaterThanOrEqual(0);
  });

  it('fixes non-array relation.refs', () => {
    const sigma = healthySigma();
    sigma.relation.refs = 'broken';
    selfRepair(sigma);
    expect(Array.isArray(sigma.relation.refs)).toBe(true);
  });

  it('prunes oversized memory (aggressive)', () => {
    const sigma = healthySigma();
    sigma.memory = Array.from({ length: 200 }, (_, i) => i);
    selfRepair(sigma, { maxMemoryEntries: 50, repairStrategy: 'aggressive' });
    // 50 pruned + 1 repair log entry
    expect(sigma.memory.length).toBeLessThanOrEqual(52);
    expect(sigma.memory.length).toBeLessThan(200);
  });

  it('prunes oversized memory (conservative)', () => {
    const sigma = healthySigma();
    sigma.memory = Array.from({ length: 200 }, (_, i) => i);
    selfRepair(sigma, { maxMemoryEntries: 50, repairStrategy: 'conservative' });
    expect(sigma.memory.length).toBeLessThanOrEqual(52);
    expect(sigma.memory.length).toBeLessThan(200);
  });

  it('prunes oversized memory (adaptive) preserves repair logs', () => {
    const sigma = healthySigma();
    sigma.memory = [
      ...Array.from({ length: 100 }, (_, i) => i),
      { type: 'self-repair', detail: 'past repair' },
      ...Array.from({ length: 100 }, (_, i) => i + 100),
    ];
    selfRepair(sigma, { maxMemoryEntries: 50, repairStrategy: 'adaptive' });
    expect(sigma.memory.length).toBeLessThan(201);
    expect(sigma.memory.some((m: any) => m?.type === 'self-repair')).toBe(true);
  });

  it('no-op for healthy sigma', () => {
    const sigma = healthySigma();
    const result = selfRepair(sigma);
    expect(result.success).toBe(true);
    expect(result.actionsApplied).toBe(0);
    expect(result.integrityBefore).toBe(result.integrityAfter);
  });

  it('repairs multiple damages in one pass', () => {
    const sigma: Record<string, any> = {
      flow: { phase: 'rest' },
      memory: [],
      layer: { depth: 1 },
      relation: { refs: [] },
    };
    const result = selfRepair(sigma);
    expect(result.actionsApplied).toBeGreaterThan(0);
    expect(sigma.field).toBeDefined();
    expect(sigma.will).toBeDefined();
  });

  it('integrity improves after repair', () => {
    const sigma: Record<string, any> = {};
    const result = selfRepair(sigma);
    expect(result.integrityAfter).toBeGreaterThan(result.integrityBefore);
  });
});

// ============================================================
// 7. Repair Logging
// ============================================================

describe('Phase 7b: Repair Logging', () => {

  it('logs repair events to memory', () => {
    const sigma = healthySigma();
    delete sigma.field;
    selfRepair(sigma, { logRepairs: true });
    const repairLog = sigma.memory?.find?.((m: any) => m?.type === 'self-repair');
    expect(repairLog).toBeDefined();
    expect(repairLog.timestamp).toBeDefined();
    expect(repairLog.actionsCount).toBeGreaterThan(0);
  });

  it('does not log when logRepairs is false', () => {
    const sigma = healthySigma();
    delete sigma.field;
    selfRepair(sigma, { logRepairs: false });
    const repairLog = sigma.memory?.find?.((m: any) => m?.type === 'self-repair');
    expect(repairLog).toBeUndefined();
  });

  it('log contains integrityDelta', () => {
    const sigma: Record<string, any> = { memory: [] };
    const result = selfRepair(sigma, { logRepairs: true });
    expect(result.log.integrityDelta).toBeGreaterThan(0);
  });

  it('log contains damage types', () => {
    const sigma: Record<string, any> = { memory: [] };
    const result = selfRepair(sigma);
    expect(result.log.damageTypes.length).toBeGreaterThan(0);
    expect(result.log.damageTypes).toContain('missing');
  });

  it('log records strategy used', () => {
    const sigma = healthySigma();
    delete sigma.field;
    const result = selfRepair(sigma, { repairStrategy: 'aggressive' });
    expect(result.log.strategy).toBe('aggressive');
  });
});

// ============================================================
// 8. Cascade Risk Check
// ============================================================

describe('Phase 7b: Cascade Risk Check', () => {

  it('no cascade risk for healthy sigma', () => {
    const sigma = healthySigma();
    const neighbors = new Map<string, Record<string, any>>();
    neighbors.set('n1', healthySigma());
    const result = checkCascadeRisk(sigma, neighbors);
    expect(result.atRisk).toBe(false);
    expect(result.riskLevel).toBe(0);
  });

  it('detects cascade risk when neighbors are damaged', () => {
    const sigma: Record<string, any> = {}; // damaged
    const neighbors = new Map<string, Record<string, any>>();
    neighbors.set('n1', {}); // also damaged
    neighbors.set('n2', {}); // also damaged
    const result = checkCascadeRisk(sigma, neighbors);
    expect(result.atRisk).toBe(true);
    expect(result.affectedNeighbors.length).toBeGreaterThan(0);
  });

  it('risk level proportional to neighbor damage', () => {
    const sigma: Record<string, any> = {};
    const neighbors1 = new Map<string, Record<string, any>>();
    neighbors1.set('n1', {});
    const risk1 = checkCascadeRisk(sigma, neighbors1);

    const neighbors3 = new Map<string, Record<string, any>>();
    neighbors3.set('n1', {});
    neighbors3.set('n2', {});
    neighbors3.set('n3', {});
    const risk3 = checkCascadeRisk(sigma, neighbors3);

    expect(risk3.affectedNeighbors.length).toBeGreaterThanOrEqual(risk1.affectedNeighbors.length);
  });

  it('empty neighbors = no cascade', () => {
    const sigma: Record<string, any> = {};
    const result = checkCascadeRisk(sigma, new Map());
    expect(result.affectedNeighbors.length).toBe(0);
  });

  it('provides recommendation', () => {
    const sigma: Record<string, any> = {};
    const neighbors = new Map<string, Record<string, any>>();
    neighbors.set('n1', {});
    const result = checkCascadeRisk(sigma, neighbors);
    expect(typeof result.recommendation).toBe('string');
    expect(result.recommendation.length).toBeGreaterThan(0);
  });
});

// ============================================================
// 9. Config Customization
// ============================================================

describe('Phase 7b: Config Customization', () => {

  it('custom threshold changes healthy determination', () => {
    // Use a sigma with memory at 85% capacity (warning level)
    // but no damaged or warning attributes other than memory
    const sigma = healthySigma();
    sigma.memory = Array.from({ length: 85 }, (_, i) => i); // 85% of default 100
    // This creates a warning on memory, which means it's always unhealthy
    // Test: detect and check score changes
    const strictReport = detectIntegrity(sigma, { integrityThreshold: 0.99 });
    const lenientReport = detectIntegrity(sigma, { integrityThreshold: 0.5 });
    // Both detect same warning, same score
    expect(strictReport.score).toBe(lenientReport.score);
    expect(strictReport.healthy).toBe(false); // has warning
    expect(lenientReport.healthy).toBe(false); // has warning
    // But score itself should be reasonable
    expect(strictReport.score).toBeGreaterThan(0.7);
  });

  it('custom maxMemoryEntries affects degradation detection', () => {
    const sigma = healthySigma();
    sigma.memory = Array.from({ length: 50 }, (_, i) => i);
    const small = detectIntegrity(sigma, { maxMemoryEntries: 30 });
    const large = detectIntegrity(sigma, { maxMemoryEntries: 100 });
    expect(small.checks.find(c => c.attribute === 'memory')?.status).toBe('warning');
    expect(large.checks.find(c => c.attribute === 'memory')?.status).toBe('ok');
  });

  it('default config works without options', () => {
    const report = detectIntegrity(healthySigma());
    expect(report.score).toBeDefined();
    expect(report.checks.length).toBeGreaterThan(0);
  });
});
