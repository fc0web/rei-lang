// ============================================================
// Rei Phase 7a — σ-interaction Tests
// 6属性間の相互作用ルール（新規8ルール）のテスト
//
// @axiom A1, A3
// ============================================================

import { describe, it, expect, beforeEach } from 'vitest';
import { createDeepSigmaMeta, type DeepSigmaMeta } from '../src/lang/sigma-deep';
import {
  reactWillToField,
  reactWillToRelation,
  reactMemoryToWill,
  reactMemoryToFlow,
  reactMemoryToField,
  reactRelationToField,
  reactFieldToLayer,
  reactFieldToFlow,
  applyInteractionRule,
  applyInteractionRules,
  INTERACTION_RULES,
} from '../src/lang/sigma-interaction';

// ============================================================
// ヘルパー
// ============================================================
function makeMeta(overrides: Partial<DeepSigmaMeta> = {}): DeepSigmaMeta {
  return { ...createDeepSigmaMeta(), ...overrides };
}

// ============================================================
// §1 σ-R02: will → field  「σ傾向性は場を選ぶ」
// ============================================================
describe('σ-R02: will → field', () => {
  it('expand tendency → exploratory marker', () => {
    const meta = makeMeta({ tendency: 'expand' });
    const result = reactWillToField(meta, 'physics');
    expect(result).not.toBeNull();
    expect(result!.attribute).toBe('field');
    expect(result!.after.marker).toBe('exploratory');
  });

  it('contract tendency → focused marker', () => {
    const meta = makeMeta({ tendency: 'contract' });
    const result = reactWillToField(meta, 'music');
    expect(result).not.toBeNull();
    expect(result!.after.marker).toBe('focused');
  });

  it('harmonize tendency → bridging marker', () => {
    const meta = makeMeta({ tendency: 'harmonize' });
    const result = reactWillToField(meta, 'art');
    expect(result).not.toBeNull();
    expect(result!.after.marker).toBe('bridging');
  });

  it('rest tendency → no change (null)', () => {
    const meta = makeMeta({ tendency: 'rest' });
    const result = reactWillToField(meta, 'physics');
    expect(result).toBeNull();
  });

  it('trigger includes tendency name', () => {
    const meta = makeMeta({ tendency: 'expand' });
    const result = reactWillToField(meta, 'default');
    expect(result!.trigger).toBe('will:expand');
  });

  it('preserves base field in after', () => {
    const meta = makeMeta({ tendency: 'expand' });
    const result = reactWillToField(meta, 'linguistics');
    expect(result!.after.base).toBe('linguistics');
  });
});

// ============================================================
// §2 σ-R03: will → relation  「σ傾向性は関係を形成する」
// ============================================================
describe('σ-R03: will → relation', () => {
  it('expand tendency → open mode, positive affinity', () => {
    const meta = makeMeta({ tendency: 'expand' });
    const result = reactWillToRelation(meta, ['x', 'y']);
    expect(result).not.toBeNull();
    expect(result!.attribute).toBe('relation');
    expect(result!.after.formationMode).toBe('open');
    expect(result!.after.affinityDelta).toBeGreaterThan(0);
  });

  it('contract tendency → selective mode, negative affinity', () => {
    const meta = makeMeta({ tendency: 'contract' });
    const result = reactWillToRelation(meta, ['a']);
    expect(result).not.toBeNull();
    expect(result!.after.formationMode).toBe('selective');
    expect(result!.after.affinityDelta).toBeLessThan(0);
  });

  it('harmonize tendency → balanced mode', () => {
    const meta = makeMeta({ tendency: 'harmonize' });
    const result = reactWillToRelation(meta, ['a', 'b', 'c']);
    expect(result).not.toBeNull();
    expect(result!.after.formationMode).toBe('balanced');
  });

  it('rest tendency → no change', () => {
    const meta = makeMeta({ tendency: 'rest' });
    const result = reactWillToRelation(meta, ['x']);
    expect(result).toBeNull();
  });

  it('preserves existing ref count', () => {
    const meta = makeMeta({ tendency: 'expand' });
    const result = reactWillToRelation(meta, ['a', 'b', 'c']);
    expect(result!.after.count).toBe(3);
  });
});

// ============================================================
// §3 σ-R04: memory → will  「記憶はσ傾向性を育てる」
// ============================================================
describe('σ-R04: memory → will', () => {
  it('3+ repeats of same value → mastery tendency', () => {
    const meta = makeMeta({ tendency: 'rest', memory: [42, 42, 42] });
    const result = reactMemoryToWill(meta);
    expect(result).not.toBeNull();
    expect(result!.attribute).toBe('will');
    expect(result!.after.tendency).toBe('mastery');
  });

  it('consistently increasing values → expand tendency', () => {
    const meta = makeMeta({ tendency: 'rest', memory: [1, 3, 7, 15] });
    const result = reactMemoryToWill(meta);
    expect(result).not.toBeNull();
    expect(result!.after.tendency).toBe('expand');
  });

  it('consistently decreasing values → contract tendency', () => {
    const meta = makeMeta({ tendency: 'rest', memory: [100, 50, 20, 5] });
    const result = reactMemoryToWill(meta);
    expect(result).not.toBeNull();
    expect(result!.after.tendency).toBe('contract');
  });

  it('alternating values → oscillate tendency', () => {
    const meta = makeMeta({ tendency: 'rest', memory: [10, 20, 10, 20] });
    const result = reactMemoryToWill(meta);
    expect(result).not.toBeNull();
    expect(result!.after.tendency).toBe('oscillate');
  });

  it('less than 3 entries → no change', () => {
    const meta = makeMeta({ tendency: 'rest', memory: [1, 2] });
    const result = reactMemoryToWill(meta);
    expect(result).toBeNull();
  });

  it('mutates meta.tendency', () => {
    const meta = makeMeta({ tendency: 'rest', memory: [42, 42, 42] });
    reactMemoryToWill(meta);
    expect(meta.tendency).toBe('mastery');
  });

  it('already matching tendency → no change', () => {
    const meta = makeMeta({ tendency: 'expand', memory: [1, 3, 7, 15] });
    const result = reactMemoryToWill(meta);
    expect(result).toBeNull();
  });

  it('5+ repeats also triggers mastery', () => {
    const meta = makeMeta({ tendency: 'rest', memory: ['a', 'a', 'a', 'a', 'a'] });
    const result = reactMemoryToWill(meta);
    expect(result).not.toBeNull();
    expect(result!.after.tendency).toBe('mastery');
  });
});

// ============================================================
// §4 σ-R05: memory → flow  「記憶は流れを最適化する」
// ============================================================
describe('σ-R05: memory → flow', () => {
  it('repetitive operations → accelerating', () => {
    const meta = makeMeta({ operations: ['add', 'add', 'add', 'add', 'add'] });
    const result = reactMemoryToFlow(meta);
    expect(result).not.toBeNull();
    expect(result!.attribute).toBe('flow');
    expect(result!.after.phase).toBe('accelerating');
  });

  it('diverse operations → steady', () => {
    const meta = makeMeta({ operations: ['add', 'mul', 'div', 'sub', 'sqrt'] });
    const result = reactMemoryToFlow(meta);
    expect(result).not.toBeNull();
    expect(result!.after.phase).toBe('steady');
  });

  it('mixed operations → decelerating', () => {
    const meta = makeMeta({ operations: ['add', 'add', 'mul', 'add', 'sub'] });
    const result = reactMemoryToFlow(meta);
    expect(result).not.toBeNull();
    expect(result!.after.phase).toBe('decelerating');
  });

  it('less than 2 operations → no change', () => {
    const meta = makeMeta({ operations: ['add'] });
    const result = reactMemoryToFlow(meta);
    expect(result).toBeNull();
  });

  it('appends to velocity history', () => {
    const meta = makeMeta({ operations: ['add', 'add', 'add'], velocityHistory: [0.5] });
    reactMemoryToFlow(meta);
    expect(meta.velocityHistory.length).toBe(2);
  });

  it('returns velocity in after', () => {
    const meta = makeMeta({ operations: ['a', 'a', 'a'] });
    const result = reactMemoryToFlow(meta);
    expect(result!.after.velocity).toBeGreaterThan(0);
  });
});

// ============================================================
// §5 σ-R06: memory → field  「記憶は場を記録する」
// ============================================================
describe('σ-R06: memory → field', () => {
  it('builds affinity map from field history', () => {
    const meta = makeMeta();
    const result = reactMemoryToField(meta, ['physics', 'physics', 'music']);
    expect(result).not.toBeNull();
    expect(result!.attribute).toBe('field');
    expect(result!.after.affinityMap).toBeDefined();
    expect(result!.after.affinityMap['physics']).toBeCloseTo(2 / 3);
    expect(result!.after.affinityMap['music']).toBeCloseTo(1 / 3);
  });

  it('identifies dominant field', () => {
    const meta = makeMeta();
    const result = reactMemoryToField(meta, ['art', 'art', 'art', 'music']);
    expect(result!.after.dominantField).toBe('art');
  });

  it('less than 2 entries → no change', () => {
    const meta = makeMeta();
    const result = reactMemoryToField(meta, ['physics']);
    expect(result).toBeNull();
  });

  it('counts unique fields', () => {
    const meta = makeMeta();
    const result = reactMemoryToField(meta, ['a', 'b', 'c', 'a']);
    expect(result!.after.uniqueFields).toBe(3);
  });

  it('equal distribution → balanced affinity', () => {
    const meta = makeMeta();
    const result = reactMemoryToField(meta, ['a', 'b', 'c']);
    expect(result!.after.affinityMap['a']).toBeCloseTo(1 / 3);
    expect(result!.after.affinityMap['b']).toBeCloseTo(1 / 3);
  });
});

// ============================================================
// §6 σ-R08: relation → field  「関係は場を架橋する」
// ============================================================
describe('σ-R08: relation → field', () => {
  it('foreign fields create bridges', () => {
    const meta = makeMeta();
    const result = reactRelationToField(meta, 'physics', ['music', 'art']);
    expect(result).not.toBeNull();
    expect(result!.attribute).toBe('field');
    expect(result!.after.bridgeCount).toBe(2);
  });

  it('same field → no bridges', () => {
    const meta = makeMeta();
    const result = reactRelationToField(meta, 'physics', ['physics', 'physics']);
    expect(result).toBeNull();
  });

  it('mixed same and foreign → only foreign bridges', () => {
    const meta = makeMeta();
    const result = reactRelationToField(meta, 'music', ['music', 'art', 'music', 'economics']);
    expect(result).not.toBeNull();
    expect(result!.after.bridgeCount).toBe(2); // art, economics
  });

  it('bridge strength increases with frequency', () => {
    const meta = makeMeta();
    const result = reactRelationToField(meta, 'a', ['b', 'b', 'b']);
    expect(result!.after.bridges[0].strength).toBeGreaterThan(0.1);
  });

  it('preserves own field in output', () => {
    const meta = makeMeta();
    const result = reactRelationToField(meta, 'linguistics', ['art']);
    expect(result!.after.field).toBe('linguistics');
  });
});

// ============================================================
// §7 σ-R10: field → layer  「場は層を決定する」
// ============================================================
describe('σ-R10: field → layer', () => {
  it('physics → low layer depth', () => {
    const result = reactFieldToLayer('physics', 0);
    expect(result).not.toBeNull();
    expect(result!.attribute).toBe('layer');
    expect(result!.after.depth).toBe(1);
  });

  it('art → mid layer depth', () => {
    const result = reactFieldToLayer('art', 0);
    expect(result).not.toBeNull();
    expect(result!.after.depth).toBe(3);
  });

  it('bridging → high layer depth', () => {
    const result = reactFieldToLayer('bridging', 0);
    expect(result).not.toBeNull();
    expect(result!.after.depth).toBe(5);
  });

  it('same depth → no change', () => {
    const result = reactFieldToLayer('physics', 1);
    expect(result).toBeNull();
  });

  it('high abstraction → nested structure', () => {
    const result = reactFieldToLayer('philosophy', 0);
    expect(result).not.toBeNull();
    expect(result!.after.structure).toBe('nested');
  });

  it('low abstraction → flat structure', () => {
    const result = reactFieldToLayer('physics', 0);
    expect(result!.after.structure).toBe('flat');
  });

  it('unknown field → no change from current', () => {
    const result = reactFieldToLayer('unknown_field', 3);
    expect(result).toBeNull(); // targetDepth defaults to currentLayerDepth
  });
});

// ============================================================
// §8 σ-R12: field → flow  「場は流れの法則を与える」
// ============================================================
describe('σ-R12: field → flow', () => {
  it('physics → inertial rule (high damping)', () => {
    const meta = makeMeta();
    const result = reactFieldToFlow('physics', meta);
    expect(result).not.toBeNull();
    expect(result!.attribute).toBe('flow');
    expect(result!.after.rule).toBe('inertial');
    expect(result!.after.dampingFactor).toBe(0.9);
  });

  it('music → rhythmic rule (high oscillation)', () => {
    const meta = makeMeta();
    const result = reactFieldToFlow('music', meta);
    expect(result!.after.rule).toBe('rhythmic');
    expect(result!.after.oscillationBias).toBe(0.8);
  });

  it('economics → equilibrium rule', () => {
    const meta = makeMeta();
    const result = reactFieldToFlow('economics', meta);
    expect(result!.after.rule).toBe('equilibrium');
  });

  it('art → creative rule (low damping)', () => {
    const meta = makeMeta();
    const result = reactFieldToFlow('art', meta);
    expect(result!.after.rule).toBe('creative');
    expect(result!.after.dampingFactor).toBe(0.3);
  });

  it('linguistics → syntactic rule', () => {
    const meta = makeMeta();
    const result = reactFieldToFlow('linguistics', meta);
    expect(result!.after.rule).toBe('syntactic');
  });

  it('unknown field → neutral rule', () => {
    const meta = makeMeta();
    const result = reactFieldToFlow('custom_field', meta);
    expect(result!.after.rule).toBe('neutral');
  });

  it('includes applied field in output', () => {
    const meta = makeMeta();
    const result = reactFieldToFlow('physics', meta);
    expect(result!.after.appliedField).toBe('physics');
  });
});

// ============================================================
// §9 INTERACTION_RULES メタデータ
// ============================================================
describe('INTERACTION_RULES metadata', () => {
  it('contains exactly 8 rules', () => {
    expect(INTERACTION_RULES.length).toBe(8);
  });

  it('all rules have unique IDs', () => {
    const ids = INTERACTION_RULES.map(r => r.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('all rules have source and target attributes', () => {
    const validAttrs = ['field', 'flow', 'memory', 'layer', 'relation', 'will'];
    for (const rule of INTERACTION_RULES) {
      expect(validAttrs).toContain(rule.source);
      expect(validAttrs).toContain(rule.target);
      expect(rule.source).not.toBe(rule.target);
    }
  });

  it('all rules have valid strength', () => {
    for (const rule of INTERACTION_RULES) {
      expect(['weak', 'medium', 'strong']).toContain(rule.strength);
    }
  });

  it('covers all 8 new rule IDs', () => {
    const ids = INTERACTION_RULES.map(r => r.id).sort();
    expect(ids).toEqual([
      'σ-R02', 'σ-R03', 'σ-R04', 'σ-R05',
      'σ-R06', 'σ-R08', 'σ-R10', 'σ-R12',
    ]);
  });
});

// ============================================================
// §10 applyInteractionRule — 統合API
// ============================================================
describe('applyInteractionRule', () => {
  it('applies σ-R02 via rule ID', () => {
    const meta = makeMeta({ tendency: 'expand' });
    const result = applyInteractionRule('σ-R02', meta, { currentField: 'physics' });
    expect(result).not.toBeNull();
    expect(result!.attribute).toBe('field');
  });

  it('applies σ-R04 via rule ID', () => {
    const meta = makeMeta({ tendency: 'rest', memory: [42, 42, 42] });
    const result = applyInteractionRule('σ-R04', meta);
    expect(result).not.toBeNull();
    expect(result!.after.tendency).toBe('mastery');
  });

  it('applies σ-R10 via rule ID', () => {
    const result = applyInteractionRule('σ-R10', makeMeta(), { currentField: 'physics', currentLayerDepth: 0 });
    expect(result).not.toBeNull();
    expect(result!.after.depth).toBe(1);
  });

  it('applies σ-R12 via rule ID', () => {
    const result = applyInteractionRule('σ-R12', makeMeta(), { currentField: 'music' });
    expect(result).not.toBeNull();
    expect(result!.after.rule).toBe('rhythmic');
  });

  it('returns null for rule with insufficient context', () => {
    const meta = makeMeta({ tendency: 'rest' });
    const result = applyInteractionRule('σ-R02', meta, { currentField: 'x' });
    expect(result).toBeNull(); // rest → no change
  });
});

// ============================================================
// §11 applyInteractionRules — 複数ルール一括適用
// ============================================================
describe('applyInteractionRules', () => {
  it('applies multiple rules and returns all results', () => {
    const meta = makeMeta({ tendency: 'expand', operations: ['a', 'a', 'a'] });
    const results = applyInteractionRules(
      ['σ-R02', 'σ-R05'],
      meta,
      { currentField: 'physics' },
    );
    expect(results.length).toBe(2);
    expect(results[0].attribute).toBe('field');
    expect(results[1].attribute).toBe('flow');
  });

  it('filters out null results', () => {
    const meta = makeMeta({ tendency: 'rest', operations: [] });
    const results = applyInteractionRules(
      ['σ-R02', 'σ-R05'],
      meta,
      { currentField: 'x' },
    );
    expect(results.length).toBe(0);
  });

  it('empty rule list → empty results', () => {
    const results = applyInteractionRules([], makeMeta());
    expect(results).toEqual([]);
  });
});

// ============================================================
// §12 ルール組み合わせテスト — 連鎖反応
// ============================================================
describe('Rule combinations — cascade scenarios', () => {
  it('memory → will → field (R04 → R02 chain)', () => {
    const meta = makeMeta({ tendency: 'rest', memory: [1, 3, 7, 15] });

    // Step 1: memory → will
    const r1 = reactMemoryToWill(meta);
    expect(r1).not.toBeNull();
    expect(meta.tendency).toBe('expand');

    // Step 2: will → field (tendency changed by step 1)
    const r2 = reactWillToField(meta, 'default');
    expect(r2).not.toBeNull();
    expect(r2!.after.marker).toBe('exploratory');
  });

  it('memory → will → relation (R04 → R03 chain)', () => {
    const meta = makeMeta({ tendency: 'rest', memory: [100, 50, 20, 5] });

    const r1 = reactMemoryToWill(meta);
    expect(meta.tendency).toBe('contract');

    const r2 = reactWillToRelation(meta, ['a', 'b']);
    expect(r2!.after.formationMode).toBe('selective');
  });

  it('field → layer + field → flow (R10 + R12 parallel)', () => {
    const meta = makeMeta();

    const r1 = reactFieldToLayer('music', 0);
    const r2 = reactFieldToFlow('music', meta);

    expect(r1).not.toBeNull();
    expect(r2).not.toBeNull();
    expect(r1!.after.depth).toBe(3);
    expect(r2!.after.rule).toBe('rhythmic');
  });

  it('relation → field bridge when cross-domain (R08)', () => {
    const meta = makeMeta();
    const result = reactRelationToField(meta, 'physics', ['music', 'economics', 'art']);
    expect(result!.after.bridgeCount).toBe(3);
  });

  it('complete 3-step cascade: memory → will → field → layer', () => {
    const meta = makeMeta({ tendency: 'rest', memory: [1, 5, 25, 125] });

    // Step 1: R04 memory → will
    reactMemoryToWill(meta);
    expect(meta.tendency).toBe('expand');

    // Step 2: R02 will → field
    const r2 = reactWillToField(meta, 'default');
    expect(r2!.after.marker).toBe('exploratory');

    // Step 3: R10 field → layer (using the new marker)
    const r3 = reactFieldToLayer('exploratory', 0);
    expect(r3).not.toBeNull();
    expect(r3!.after.depth).toBe(4);
  });
});

// ============================================================
// §13 境界条件テスト
// ============================================================
describe('Edge cases and safety', () => {
  it('empty memory array → no memory-based reactions', () => {
    const meta = makeMeta({ memory: [] });
    expect(reactMemoryToWill(meta)).toBeNull();
  });

  it('empty operations → no memory-flow reaction', () => {
    const meta = makeMeta({ operations: [] });
    expect(reactMemoryToFlow(meta)).toBeNull();
  });

  it('empty relatedFields → no bridge creation', () => {
    const meta = makeMeta();
    expect(reactRelationToField(meta, 'physics', [])).toBeNull();
  });

  it('null/undefined field handled gracefully', () => {
    const meta = makeMeta({ tendency: 'expand' });
    const result = reactWillToField(meta, null);
    expect(result).not.toBeNull();
  });

  it('very long memory does not crash', () => {
    const longMem = Array.from({ length: 1000 }, (_, i) => i);
    const meta = makeMeta({ memory: longMem });
    const result = reactMemoryToWill(meta);
    expect(result).not.toBeNull();
  });

  it('very long operations does not crash', () => {
    const longOps = Array.from({ length: 500 }, () => 'add');
    const meta = makeMeta({ operations: longOps });
    const result = reactMemoryToFlow(meta);
    expect(result).not.toBeNull();
  });
});
