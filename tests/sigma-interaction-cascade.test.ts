// ============================================================
// Rei Phase 7a — σ-interaction Cascade & Integration Tests
// ルール組み合わせ・カスケード・12ルール統合・収束テスト
//
// Target: +47 tests (1,642 → 1,689)
//
// @axiom A1 (Existence), A3 (Sigma Accumulation)
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
  type InteractionRuleId,
} from '../src/lang/sigma-interaction';
import {
  reactRelationToWill,
  reactWillToFlow,
  reactFlowToMemory,
  reactMemoryToLayer,
  reactLayerToRelation,
  cascadeFromRelation,
  cascadeFromWill,
  pulse,
  type AttributeReaction,
  type CascadeResult,
} from '../src/lang/sigma-reactive';

// ============================================================
// ヘルパー
// ============================================================
function makeMeta(overrides: Partial<DeepSigmaMeta> = {}): DeepSigmaMeta {
  return { ...createDeepSigmaMeta(), ...overrides };
}

// ============================================================
// §1 ルール組み合わせテスト（主要ペア20組）
// A→B: ルールAの出力がルールBの入力として有効に機能するか
// ============================================================
describe('§1 Rule Combinations (A→B chains)', () => {

  // ── will起点のチェーン ──

  it('R02→R10: will→field→layer (expand→exploratory→depth 4)', () => {
    const meta = makeMeta({ tendency: 'expand' });
    // Step 1: will → field
    const r1 = reactWillToField(meta, 'physics');
    expect(r1).not.toBeNull();
    expect(r1!.after.marker).toBe('exploratory');
    // Step 2: field(exploratory) → layer
    const r2 = reactFieldToLayer('exploratory', 1);
    expect(r2).not.toBeNull();
    expect(r2!.after.depth).toBe(4);
  });

  it('R02→R12: will→field→flow (contract→focused field→creative flow rule)', () => {
    const meta = makeMeta({ tendency: 'contract' });
    const r1 = reactWillToField(meta, 'art');
    expect(r1!.after.marker).toBe('focused');
    // focused field → field→flow
    const r2 = reactFieldToFlow('focused', meta);
    expect(r2).not.toBeNull();
    expect(r2!.after.dampingFactor).toBeDefined();
  });

  it('R02→R10→layer change: will→field→layer (harmonize→bridging→depth 5)', () => {
    const meta = makeMeta({ tendency: 'harmonize' });
    const r1 = reactWillToField(meta, 'linguistics');
    expect(r1!.after.marker).toBe('bridging');
    const r2 = reactFieldToLayer('bridging', 2);
    expect(r2).not.toBeNull();
    expect(r2!.after.depth).toBe(5);
    expect(r2!.after.structure).toBe('nested');
  });

  it('R03→R08: will→relation→field (expand forms open relations, bridges fields)', () => {
    const meta = makeMeta({ tendency: 'expand' });
    const r1 = reactWillToRelation(meta, ['ref-a', 'ref-b']);
    expect(r1).not.toBeNull();
    expect(r1!.after.formationMode).toBe('open');
    // Now the opened relations bridge to foreign fields
    const r2 = reactRelationToField(meta, 'physics', ['music', 'art']);
    expect(r2).not.toBeNull();
    expect(r2!.after.bridgeCount).toBeGreaterThanOrEqual(2);
  });

  // ── memory起点のチェーン ──

  it('R04→R02: memory→will→field (repeated pattern → mastery → field change)', () => {
    const meta = makeMeta({
      memory: [42, 42, 42, 42],
      tendency: 'rest',
    });
    const r1 = reactMemoryToWill(meta);
    expect(r1).not.toBeNull();
    expect(r1!.after.tendency).toBe('mastery');
    // Now will(mastery) → field
    const r2 = reactWillToField(meta, 'info-engineering');
    expect(r2).not.toBeNull();
    expect(r2!.after.marker).toBe('active'); // mastery is default case
    expect(r2!.after.tendency).toBe('mastery');
  });

  it('R04→R03: memory→will→relation (increasing memory → expand → open relations)', () => {
    const meta = makeMeta({
      memory: [1, 2, 3, 4, 5],
      tendency: 'rest',
    });
    const r1 = reactMemoryToWill(meta);
    expect(r1).not.toBeNull();
    expect(r1!.after.tendency).toBe('expand');
    // Now expand tendency → relation formation
    const r2 = reactWillToRelation(meta, ['a', 'b']);
    expect(r2).not.toBeNull();
    expect(r2!.after.formationMode).toBe('open');
    expect(r2!.after.affinityDelta).toBe(0.3);
  });

  it('R04→R02→R10: memory→will→field→layer (3-step chain)', () => {
    const meta = makeMeta({
      memory: [10, 8, 6, 4, 2],
      tendency: 'rest',
    });
    const r1 = reactMemoryToWill(meta);
    expect(r1!.after.tendency).toBe('contract');
    const r2 = reactWillToField(meta, 'music');
    expect(r2!.after.marker).toBe('focused');
    const r3 = reactFieldToLayer('focused', 1);
    expect(r3).not.toBeNull();
    expect(r3!.after.depth).toBe(4);
  });

  it('R05→(reactive) flow→memory: memory→flow→memory feedback', () => {
    const meta = makeMeta({
      operations: ['map', 'map', 'map', 'map', 'map'],
      velocityHistory: [0.5],
    });
    const r1 = reactMemoryToFlow(meta);
    expect(r1).not.toBeNull();
    expect(r1!.after.phase).toBe('accelerating');
    // Flow change → record to memory (reactive)
    const r2 = reactFlowToMemory(meta, {
      from: 'steady',
      to: 'accelerating',
      velocity: r1!.after.velocity,
    }, 'memory→flow');
    expect(r2).not.toBeNull();
    expect(r2.attribute).toBe('memory');
  });

  it('R06→R10: memory→field(affinity)→layer', () => {
    const fieldHistory = ['physics', 'physics', 'music', 'physics', 'art'];
    const meta = makeMeta();
    const r1 = reactMemoryToField(meta, fieldHistory);
    expect(r1).not.toBeNull();
    expect(r1!.after.dominantField).toBe('physics');
    // Dominant field (physics) → layer adjustment
    const r2 = reactFieldToLayer('physics', 3);
    expect(r2).not.toBeNull();
    expect(r2!.after.depth).toBe(1);
  });

  it('R06→R12: memory→field(affinity)→flow(domain rule)', () => {
    const fieldHistory = ['music', 'music', 'music', 'art'];
    const meta = makeMeta();
    const r1 = reactMemoryToField(meta, fieldHistory);
    expect(r1!.after.dominantField).toBe('music');
    // Dominant field → flow rule
    const r2 = reactFieldToFlow('music', meta);
    expect(r2).not.toBeNull();
    expect(r2!.after.rule).toBe('rhythmic');
    expect(r2!.after.oscillationBias).toBe(0.8);
  });

  // ── relation起点のチェーン ──

  it('R08→R10: relation→field(bridge)→layer', () => {
    const meta = makeMeta();
    const r1 = reactRelationToField(meta, 'physics', ['music', 'economics']);
    expect(r1).not.toBeNull();
    expect(r1!.after.bridgeCount).toBe(2);
    // Bridge effect on layer: physics field has depth 1
    const r2 = reactFieldToLayer('physics', 3);
    expect(r2).not.toBeNull();
    expect(r2!.after.depth).toBe(1);
  });

  it('R08→R12: relation→field(bridge)→flow(domain rule)', () => {
    const meta = makeMeta();
    const r1 = reactRelationToField(meta, 'economics', ['physics']);
    expect(r1).not.toBeNull();
    // Economics field → flow equilibrium rule
    const r2 = reactFieldToFlow('economics', meta);
    expect(r2).not.toBeNull();
    expect(r2!.after.rule).toBe('equilibrium');
    expect(r2!.after.dampingFactor).toBe(0.7);
  });

  // ── field起点のチェーン ──

  it('R10→(reactive) layer→relation: field→layer→relation', () => {
    // field changes layer depth, layer change affects relation scope
    const r1 = reactFieldToLayer('meta', 2);
    expect(r1).not.toBeNull();
    expect(r1!.after.depth).toBe(5);
    // Layer depth change (2→5) → relation scope expands
    const meta = makeMeta({ tendency: 'expand' });
    const r2 = reactLayerToRelation(meta, 2, 5);
    expect(r2).not.toBeNull();
    expect(r2!.after.maxReach).toBeDefined();
    expect(r2!.after.maxReach).toBeGreaterThan(2);
  });

  it('R12→(reactive) flow→memory: field→flow→memory', () => {
    const meta = makeMeta({ velocityHistory: [0.3] });
    const r1 = reactFieldToFlow('physics', meta);
    expect(r1).not.toBeNull();
    expect(r1!.after.rule).toBe('inertial');
    // Flow change → memory record
    const r2 = reactFlowToMemory(meta, {
      from: 'steady',
      to: 'accelerating',
      velocity: 0.8,
    }, 'field→flow');
    expect(r2.attribute).toBe('memory');
  });

  // ── bidirectional / cross patterns ──

  it('R03↔R07: will→relation (interaction) + relation→will (reactive) bidirectional', () => {
    const meta = makeMeta({ tendency: 'expand' });
    // interaction: will → relation
    const r1 = reactWillToRelation(meta, ['peer-a']);
    expect(r1!.after.formationMode).toBe('open');
    // reactive: relation event → will
    const r2 = reactRelationToWill(meta, 'bind', 'contract');
    expect(r2).not.toBeNull();
    // Will is modified by the binding event
    expect(r2!.attribute).toBe('will');
  });

  it('R04↔R05: memory→will AND memory→flow (parallel outputs)', () => {
    const meta = makeMeta({
      memory: [1, 2, 3, 4, 5],
      tendency: 'rest',
      operations: ['add', 'mul', 'add', 'sub', 'div'],
      velocityHistory: [0.5],
    });
    // memory → will
    const r1 = reactMemoryToWill(meta);
    expect(r1).not.toBeNull();
    expect(r1!.after.tendency).toBe('expand');
    // memory → flow (parallel, not sequential)
    const r2 = reactMemoryToFlow(meta);
    expect(r2).not.toBeNull();
    expect(r2!.after.phase).toBeDefined();
    // Both outputs exist simultaneously
    expect(r1!.attribute).toBe('will');
    expect(r2!.attribute).toBe('flow');
  });

  it('R02+R06: will→field AND memory→field (convergent inputs to field)', () => {
    const meta = makeMeta({ tendency: 'expand' });
    // Two different rules target 'field'
    const r1 = reactWillToField(meta, 'info-engineering');
    const r2 = reactMemoryToField(meta, ['physics', 'physics', 'music']);
    expect(r1).not.toBeNull();
    expect(r2).not.toBeNull();
    // Both affect field but through different mechanisms
    expect(r1!.after.marker).toBe('exploratory');
    expect(r2!.after.dominantField).toBe('physics');
  });

  it('R10→R11→R07: field→layer→relation→will (3-step reactive chain from field)', () => {
    const meta = makeMeta({ tendency: 'rest' });
    // Step 1: field → layer (interaction)
    const r1 = reactFieldToLayer('philosophy', 1);
    expect(r1).not.toBeNull();
    expect(r1!.after.depth).toBe(5);
    // Step 2: layer → relation (reactive)
    const r2 = reactLayerToRelation(meta, 1, 5);
    expect(r2).not.toBeNull();
    expect(r2!.after.maxReach).toBe(6);
    // Step 3: relation → will (reactive)
    const r3 = reactRelationToWill(meta, 'entangle', 'harmonize');
    expect(r3).not.toBeNull();
    expect(r3!.attribute).toBe('will');
  });
});

// ============================================================
// §2 カスケード伝播テスト（4〜5ステップ連鎖反応シナリオ）
// ============================================================
describe('§2 Cascade Propagation (multi-step chains)', () => {

  it('4-step: memory→will→field→layer (decreasing memory triggers full chain)', () => {
    const meta = makeMeta({
      memory: [100, 80, 60, 40, 20],
      tendency: 'rest',
    });
    const reactions: AttributeReaction[] = [];

    // Step 1: memory → will (contract)
    const r1 = reactMemoryToWill(meta);
    expect(r1).not.toBeNull();
    reactions.push(r1!);
    expect(meta.tendency).toBe('contract');

    // Step 2: will(contract) → field
    const r2 = reactWillToField(meta, 'art');
    expect(r2).not.toBeNull();
    reactions.push(r2!);
    expect(r2!.after.marker).toBe('focused');

    // Step 3: field(focused) → layer
    const r3 = reactFieldToLayer('focused', 2);
    expect(r3).not.toBeNull();
    reactions.push(r3!);
    expect(r3!.after.depth).toBe(4);

    // Step 4: layer change → relation (reactive)
    const r4 = reactLayerToRelation(meta, 2, 4);
    expect(r4).not.toBeNull();
    reactions.push(r4!);

    expect(reactions).toHaveLength(4);
    expect(reactions.map(r => r.attribute)).toEqual(['will', 'field', 'layer', 'relation']);
  });

  it('4-step: memory→will→relation→field (increasing memory triggers open relations)', () => {
    const meta = makeMeta({
      memory: [1, 3, 5, 7, 9],
      tendency: 'rest',
    });
    const reactions: AttributeReaction[] = [];

    // Step 1: memory → will (expand due to increasing)
    const r1 = reactMemoryToWill(meta);
    reactions.push(r1!);
    expect(r1!.after.tendency).toBe('expand');

    // Step 2: will(expand) → relation
    const r2 = reactWillToRelation(meta, ['peer-1']);
    reactions.push(r2!);
    expect(r2!.after.formationMode).toBe('open');

    // Step 3: open relations → field bridges
    const r3 = reactRelationToField(meta, 'linguistics', ['music', 'art']);
    reactions.push(r3!);
    expect(r3!.after.bridgeCount).toBeGreaterThan(0);

    // Step 4: bridged field → flow rule
    const r4 = reactFieldToFlow('linguistics', meta);
    reactions.push(r4!);
    expect(r4!.after.rule).toBe('syntactic');

    expect(reactions).toHaveLength(4);
  });

  it('5-step: memory→will→field→flow→memory (full cycle back to memory)', () => {
    const meta = makeMeta({
      memory: [1, 2, 3, 4, 5],
      tendency: 'rest',
      velocityHistory: [0.4],
    });
    const reactions: AttributeReaction[] = [];

    // Step 1: memory → will
    reactions.push(reactMemoryToWill(meta)!);
    expect(meta.tendency).toBe('expand');

    // Step 2: will → field
    const r2 = reactWillToField(meta, 'economics');
    reactions.push(r2!);

    // Step 3: field → flow
    const r3 = reactFieldToFlow('economics', meta);
    reactions.push(r3!);
    expect(r3!.after.rule).toBe('equilibrium');

    // Step 4: flow → memory (reactive)
    const r4 = reactFlowToMemory(meta, {
      from: 'steady',
      to: 'accelerating',
      velocity: 0.7,
    }, 'cascade');
    reactions.push(r4);

    // Step 5: memory accumulation → layer (reactive)
    meta.memory.push('cascade-record');
    meta.memory.push('cascade-record-2');
    meta.memory.push('cascade-record-3');
    const r5 = reactMemoryToLayer(meta);
    if (r5) reactions.push(r5);

    expect(reactions.length).toBeGreaterThanOrEqual(4);
    // Verify the chain touched multiple attributes
    const attrs = new Set(reactions.map(r => r.attribute));
    expect(attrs.size).toBeGreaterThanOrEqual(3);
  });

  it('5-step: relation→will→field→layer→relation (circular chain)', () => {
    const meta = makeMeta({ tendency: 'rest' });
    const reactions: AttributeReaction[] = [];

    // Step 1: relation event → will (reactive)
    const r1 = reactRelationToWill(meta, 'entangle', 'expand');
    reactions.push(r1!);

    // Step 2: will → field (interaction)
    const r2 = reactWillToField(meta, 'philosophy');
    reactions.push(r2!);

    // Step 3: field → layer (interaction)
    const r3 = reactFieldToLayer('philosophy', 1);
    reactions.push(r3!);
    expect(r3!.after.depth).toBe(5);

    // Step 4: layer → relation (reactive)
    const r4 = reactLayerToRelation(meta, 1, 5);
    reactions.push(r4!);

    // Step 5: relation → will again (reactive) — the circle
    const r5 = reactRelationToWill(meta, 'bind');
    reactions.push(r5!);

    expect(reactions).toHaveLength(5);
    // Verify circular: starts and ends with will-related change
    expect(reactions[0].attribute).toBe('will');
    expect(reactions[4].attribute).toBe('will');
  });

  it('4-step: will→flow→memory→will (feedback through reactive chain)', () => {
    const meta = makeMeta({
      tendency: 'expand',
      velocityHistory: [0.3],
    });
    const reactions: AttributeReaction[] = [];

    // Step 1: will → flow (reactive)
    const r1 = reactWillToFlow(meta, 'evolve', 0.8);
    reactions.push(r1!);

    // Step 2: flow → memory (reactive)
    const r2 = reactFlowToMemory(meta, {
      from: r1!.before.phase,
      to: r1!.after.phase,
      velocity: r1!.after.velocity,
    }, 'will-chain');
    reactions.push(r2);

    // Step 3: accumulate memory to trigger pattern detection
    meta.memory.push(10);
    meta.memory.push(20);
    meta.memory.push(30);

    // Step 4: memory → will (interaction)
    const r3 = reactMemoryToWill(meta);
    // May or may not trigger depending on pattern
    if (r3) {
      reactions.push(r3);
      expect(r3.attribute).toBe('will');
    }

    expect(reactions.length).toBeGreaterThanOrEqual(2);
    // At minimum, will→flow→memory chain should work
    expect(reactions[0].attribute).toBe('flow');
    expect(reactions[1].attribute).toBe('memory');
  });

  it('parallel cascade: will triggers both field and relation simultaneously', () => {
    const meta = makeMeta({ tendency: 'expand' });

    // Will triggers two independent outputs
    const toField = reactWillToField(meta, 'music');
    const toRelation = reactWillToRelation(meta, ['a', 'b', 'c']);

    expect(toField).not.toBeNull();
    expect(toRelation).not.toBeNull();

    // Both continue their own chains
    const fieldToLayer = reactFieldToLayer('exploratory', 2);
    const fieldToFlow = reactFieldToFlow('music', meta);

    expect(fieldToLayer).not.toBeNull();
    expect(fieldToFlow).not.toBeNull();
    expect(fieldToFlow!.after.rule).toBe('rhythmic');

    // Parallel outputs diverge into separate chains
    expect(toField!.attribute).toBe('field');
    expect(toRelation!.attribute).toBe('relation');
    expect(fieldToLayer!.attribute).toBe('layer');
    expect(fieldToFlow!.attribute).toBe('flow');
  });

  it('memory fan-out: memory→{will, flow, field} three simultaneous outputs', () => {
    const meta = makeMeta({
      memory: [5, 10, 15, 20, 25],
      tendency: 'rest',
      operations: ['op', 'op', 'op', 'op', 'op'],
      velocityHistory: [0.5],
    });
    const fieldHistory = ['physics', 'physics', 'music'];

    // memory → will
    const r1 = reactMemoryToWill(meta);
    expect(r1).not.toBeNull();

    // memory → flow
    const r2 = reactMemoryToFlow(meta);
    expect(r2).not.toBeNull();

    // memory → field (via field history)
    const r3 = reactMemoryToField(meta, fieldHistory);
    expect(r3).not.toBeNull();

    // All three triggered from memory
    expect(r1!.attribute).toBe('will');
    expect(r2!.attribute).toBe('flow');
    expect(r3!.attribute).toBe('field');
  });

  it('field fan-out: field→{layer, flow} two simultaneous outputs', () => {
    // Physics field triggers both layer and flow changes
    const meta = makeMeta();
    const r1 = reactFieldToLayer('physics', 3);
    const r2 = reactFieldToFlow('physics', meta);

    expect(r1).not.toBeNull();
    expect(r2).not.toBeNull();
    expect(r1!.after.depth).toBe(1); // physics is low abstraction
    expect(r2!.after.rule).toBe('inertial');
    expect(r2!.after.dampingFactor).toBe(0.9);
  });

  it('4-step: oscillating memory→will→relation→field→flow', () => {
    const meta = makeMeta({
      memory: [10, 5, 10, 5],
      tendency: 'rest',
    });
    const reactions: AttributeReaction[] = [];

    // Step 1: oscillating memory → will(oscillate)
    const r1 = reactMemoryToWill(meta);
    expect(r1).not.toBeNull();
    expect(r1!.after.tendency).toBe('oscillate');
    reactions.push(r1!);

    // Step 2: will(oscillate) → relation
    const r2 = reactWillToRelation(meta, ['x', 'y']);
    reactions.push(r2!);

    // Step 3: relation → field bridge
    const r3 = reactRelationToField(meta, 'art', ['music']);
    reactions.push(r3!);

    // Step 4: field → flow
    const r4 = reactFieldToFlow('art', meta);
    reactions.push(r4!);
    expect(r4!.after.rule).toBe('creative');

    expect(reactions).toHaveLength(4);
  });

  it('convergent cascade: two sources both modify field', () => {
    const meta = makeMeta({ tendency: 'expand' });

    // Source 1: will → field
    const fromWill = reactWillToField(meta, 'economics');
    expect(fromWill).not.toBeNull();
    expect(fromWill!.after.marker).toBe('exploratory');

    // Source 2: relation → field
    const fromRelation = reactRelationToField(meta, 'economics', ['art', 'music']);
    expect(fromRelation).not.toBeNull();
    expect(fromRelation!.after.bridgeCount).toBe(2);

    // Both affect field attribute but with different mechanisms
    expect(fromWill!.attribute).toBe('field');
    expect(fromRelation!.attribute).toBe('field');
    // Will adds marker, relation adds bridges — both valid simultaneously
  });

  it('deep chain: memory→will→field→layer→relation→will (5-step back to origin)', () => {
    const meta = makeMeta({
      memory: [1, 2, 3, 4, 5],
      tendency: 'rest',
    });

    // 1. memory → will (expand)
    const r1 = reactMemoryToWill(meta);
    expect(r1!.after.tendency).toBe('expand');

    // 2. will → field (exploratory)
    const r2 = reactWillToField(meta, 'info-engineering');
    expect(r2!.after.marker).toBe('exploratory');

    // 3. field → layer
    const r3 = reactFieldToLayer('exploratory', 1);
    expect(r3!.after.depth).toBe(4);

    // 4. layer → relation (reactive)
    const r4 = reactLayerToRelation(meta, 1, 4);
    expect(r4).not.toBeNull();

    // 5. relation → will (reactive, back to origin attribute)
    const r5 = reactRelationToWill(meta, 'bind');
    expect(r5).not.toBeNull();
    expect(r5!.attribute).toBe('will');
  });
});

// ============================================================
// §3 12ルール統合テスト（sigma-reactive 5ルール + sigma-interaction 8ルール）
// ============================================================
describe('§3 12-Rule Integration (reactive + interaction)', () => {

  it('all 12 rules are defined: 5 reactive + 8 interaction = complete system', () => {
    // 8 interaction rules from INTERACTION_RULES
    expect(INTERACTION_RULES).toHaveLength(8);

    // 5 reactive functions exist
    expect(typeof reactRelationToWill).toBe('function');
    expect(typeof reactWillToFlow).toBe('function');
    expect(typeof reactFlowToMemory).toBe('function');
    expect(typeof reactMemoryToLayer).toBe('function');
    expect(typeof reactLayerToRelation).toBe('function');

    // 8 interaction functions exist
    expect(typeof reactWillToField).toBe('function');
    expect(typeof reactWillToRelation).toBe('function');
    expect(typeof reactMemoryToWill).toBe('function');
    expect(typeof reactMemoryToFlow).toBe('function');
    expect(typeof reactMemoryToField).toBe('function');
    expect(typeof reactRelationToField).toBe('function');
    expect(typeof reactFieldToLayer).toBe('function');
    expect(typeof reactFieldToFlow).toBe('function');
  });

  it('6 attributes are fully connected: every attribute has at least one incoming and outgoing rule', () => {
    const attrs = ['field', 'flow', 'memory', 'layer', 'relation', 'will'] as const;

    // Build connectivity matrix from interaction rules
    const interactionEdges = INTERACTION_RULES.map(r => ({
      source: r.source,
      target: r.target,
    }));

    // Add reactive edges
    const reactiveEdges = [
      { source: 'relation', target: 'will' },     // σ-R07
      { source: 'will', target: 'flow' },          // σ-R01
      { source: 'flow', target: 'memory' },        // σ-R09
      { source: 'memory', target: 'layer' },       // (reactive)
      { source: 'layer', target: 'relation' },     // σ-R11
    ];

    const allEdges = [...interactionEdges, ...reactiveEdges];

    for (const attr of attrs) {
      const hasOutgoing = allEdges.some(e => e.source === attr);
      const hasIncoming = allEdges.some(e => e.target === attr);
      expect(hasOutgoing).toBe(true);
      expect(hasIncoming).toBe(true);
    }
  });

  it('cascadeFromRelation incorporates reactive chain: relation→will→flow→memory', () => {
    const meta = makeMeta({ tendency: 'rest' });
    const result = cascadeFromRelation(meta, 'bind');

    expect(result.reactions.length).toBeGreaterThanOrEqual(1);
    expect(result.depth).toBeGreaterThanOrEqual(1);
    // The cascade should touch will at minimum
    const attrs = result.reactions.map(r => r.attribute);
    expect(attrs).toContain('will');
  });

  it('cascadeFromWill triggers flow chain', () => {
    const meta = makeMeta({ tendency: 'expand', velocityHistory: [0.3] });
    const result = cascadeFromWill(meta, 'evolve', 0.7);

    expect(result.reactions.length).toBeGreaterThanOrEqual(1);
    const attrs = result.reactions.map(r => r.attribute);
    expect(attrs).toContain('flow');
  });

  it('pulse() produces multi-step reactions from non-rest state', () => {
    const meta = makeMeta({
      tendency: 'expand',
      memory: [1, 2, 3],
      velocityHistory: [0.5],
    });
    const result = pulse(meta);

    expect(result.reiType).toBe('CascadeResult');
    expect(result.reactions.length).toBeGreaterThan(0);
    expect(result.pulse).toBeGreaterThanOrEqual(1);
  });

  it('applyInteractionRules covers all 8 rules in one call', () => {
    const allRuleIds: InteractionRuleId[] = [
      'σ-R02', 'σ-R03', 'σ-R04', 'σ-R05',
      'σ-R06', 'σ-R08', 'σ-R10', 'σ-R12',
    ];
    const meta = makeMeta({
      tendency: 'expand',
      memory: [1, 1, 1, 1],
      operations: ['a', 'a', 'a'],
      velocityHistory: [0.3],
    });
    const context = {
      currentField: 'music',
      currentRefs: ['ref-1'],
      currentLayerDepth: 2,
      fieldHistory: ['physics', 'music', 'physics'],
      ownField: 'physics',
      relatedFields: ['music', 'art'],
    };

    const results = applyInteractionRules(allRuleIds, meta, context);

    // Most rules should fire given rich context
    expect(results.length).toBeGreaterThanOrEqual(5);
    const targetAttrs = new Set(results.map(r => r.attribute));
    // Should affect multiple distinct attributes
    expect(targetAttrs.size).toBeGreaterThanOrEqual(3);
  });

  it('interaction and reactive rules can compose: applyInteractionRules → pulse', () => {
    const meta = makeMeta({
      tendency: 'expand',
      memory: [1, 2, 3],
      operations: ['op'],
      velocityHistory: [0.5],
    });

    // First apply interaction rules to set up state
    const interactionResults = applyInteractionRules(
      ['σ-R02', 'σ-R04'],
      meta,
      { currentField: 'physics' },
    );
    expect(interactionResults.length).toBeGreaterThanOrEqual(1);

    // Then pulse the reactive system
    const pulseResult = pulse(meta);
    expect(pulseResult.reactions.length).toBeGreaterThanOrEqual(0);
    // The combined system should be functional
    expect(pulseResult.reiType).toBe('CascadeResult');
  });

  it('interaction rules follow A3 axiom: all produce valid AttributeReaction', () => {
    const meta = makeMeta({
      tendency: 'expand',
      memory: [1, 2, 3, 4],
      operations: ['a', 'b', 'c'],
      velocityHistory: [0.5],
    });

    const reactions = [
      reactWillToField(meta, 'physics'),
      reactWillToRelation(meta, ['r1']),
      reactMemoryToFlow(meta),
      reactMemoryToField(meta, ['f1', 'f2', 'f1']),
      reactRelationToField(meta, 'p', ['q', 'r']),
      reactFieldToLayer('music', 1),
      reactFieldToFlow('economics', meta),
    ].filter((r): r is AttributeReaction => r !== null);

    for (const r of reactions) {
      // Every reaction must have the required fields
      expect(r.attribute).toBeDefined();
      expect(r.trigger).toBeDefined();
      expect(r.before).toBeDefined();
      expect(r.after).toBeDefined();
      expect(r.reason).toBeDefined();
      expect(typeof r.reason).toBe('string');
      expect(r.reason.length).toBeGreaterThan(0);
    }
  });

  it('rule strengths are properly classified: weak, medium, strong', () => {
    const strengths = INTERACTION_RULES.map(r => r.strength);
    const unique = new Set(strengths);
    // Should have at least 2 different strength levels
    expect(unique.size).toBeGreaterThanOrEqual(2);
    // All must be valid
    for (const s of strengths) {
      expect(['weak', 'medium', 'strong']).toContain(s);
    }
  });
});

// ============================================================
// §4 無限ループ防止・収束テスト
// ============================================================
describe('§4 Infinite Loop Prevention & Convergence', () => {

  it('will↔relation does not diverge: repeated bidirectional interactions stabilize', () => {
    const meta = makeMeta({ tendency: 'expand' });
    const results: AttributeReaction[] = [];

    for (let i = 0; i < 10; i++) {
      // will → relation (interaction)
      const r1 = reactWillToRelation(meta, ['ref']);
      if (r1) results.push(r1);
      // relation → will (reactive)
      const r2 = reactRelationToWill(meta, 'bind');
      if (r2) results.push(r2);
    }

    // Should produce results but not grow unboundedly
    expect(results.length).toBeLessThanOrEqual(20);
    // Values should not explode
    const lastRelation = results.filter(r => r.attribute === 'relation').pop();
    if (lastRelation) {
      expect(Math.abs(lastRelation.after.affinityDelta)).toBeLessThanOrEqual(1);
    }
  });

  it('memory→will→field→layer chain terminates: no runaway depth', () => {
    const meta = makeMeta({
      memory: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
      tendency: 'rest',
    });

    // Run chain multiple times
    const depths: number[] = [];
    for (let i = 0; i < 5; i++) {
      reactMemoryToWill(meta);
      const fieldResult = reactWillToField(meta, 'music');
      const layerResult = reactFieldToLayer(
        fieldResult?.after.marker || 'unknown',
        depths.length > 0 ? depths[depths.length - 1] : 0,
      );
      if (layerResult) {
        depths.push(layerResult.after.depth);
      }
    }

    // Layer depth should be bounded (our abstraction levels max at 5)
    for (const d of depths) {
      expect(d).toBeLessThanOrEqual(5);
      expect(d).toBeGreaterThanOrEqual(0);
    }
  });

  it('pulse() converges within maxPulses: stable state reached', () => {
    const meta = makeMeta({
      tendency: 'rest',
      memory: [],
      velocityHistory: [],
    });

    const result = pulse(meta, 10);

    // Rest state with no memory should converge quickly
    expect(result.pulse).toBeLessThanOrEqual(10);
    // Should be considered stable since tendency is rest
    expect(result.reiType).toBe('CascadeResult');
  });

  it('cascadeFromRelation has bounded depth: entangle event does not explode', () => {
    const meta = makeMeta({ tendency: 'rest' });

    const result = cascadeFromRelation(meta, 'entangle', 'expand');

    // Cascade depth should be bounded
    expect(result.depth).toBeLessThanOrEqual(20);
    expect(result.reactions.length).toBeLessThanOrEqual(20);
  });

  it('repeated applyInteractionRules calls produce bounded results', () => {
    const meta = makeMeta({
      tendency: 'expand',
      memory: [1, 2, 3],
      operations: ['op'],
      velocityHistory: [0.5],
    });
    const context = {
      currentField: 'physics',
      currentRefs: ['r1'],
      fieldHistory: ['physics', 'music'],
      ownField: 'physics',
      relatedFields: ['music'],
      currentLayerDepth: 2,
    };

    // Apply all rules 5 times
    let totalReactions = 0;
    for (let i = 0; i < 5; i++) {
      const results = applyInteractionRules(
        ['σ-R02', 'σ-R03', 'σ-R04', 'σ-R05', 'σ-R06', 'σ-R08', 'σ-R10', 'σ-R12'],
        meta,
        context,
      );
      totalReactions += results.length;
    }

    // Total reactions should be bounded (max 8 rules × 5 iterations = 40)
    expect(totalReactions).toBeLessThanOrEqual(40);
    // velocityHistory should not grow without bound
    expect(meta.velocityHistory.length).toBeLessThanOrEqual(15);
  });

  it('memory→flow→memory loop converges: velocity does not diverge', () => {
    const meta = makeMeta({
      operations: ['map', 'map', 'map', 'map', 'map'],
      velocityHistory: [0.5],
    });

    const velocities: number[] = [];
    for (let i = 0; i < 8; i++) {
      const r = reactMemoryToFlow(meta);
      if (r) velocities.push(r.after.velocity);
    }

    // All velocities should be bounded [0, 1]
    for (const v of velocities) {
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThanOrEqual(1);
    }
  });

  it('field→layer→relation→will chain: layer depth bounded after repeated cycles', () => {
    const meta = makeMeta({ tendency: 'expand' });
    const layerDepths: number[] = [1];

    for (let i = 0; i < 6; i++) {
      const field = i % 2 === 0 ? 'meta' : 'physics';
      const r = reactFieldToLayer(field, layerDepths[layerDepths.length - 1]);
      if (r) layerDepths.push(r.after.depth);
    }

    // Layer depth should never exceed the max abstraction level (5)
    expect(Math.max(...layerDepths)).toBeLessThanOrEqual(5);
  });

  it('affinity values remain normalized in memory→field after many field visits', () => {
    const longHistory = Array.from({ length: 100 }, (_, i) =>
      ['physics', 'music', 'art', 'economics', 'linguistics'][i % 5],
    );
    const meta = makeMeta();
    const r = reactMemoryToField(meta, longHistory);
    expect(r).not.toBeNull();

    // All affinities should sum to ~1 (normalized)
    const affinities = Object.values(r!.after.affinityMap as Record<string, number>);
    const sum = affinities.reduce((a, b) => a + b, 0);
    expect(sum).toBeCloseTo(1.0, 5);

    // Each affinity should be in [0, 1]
    for (const a of affinities) {
      expect(a).toBeGreaterThanOrEqual(0);
      expect(a).toBeLessThanOrEqual(1);
    }
  });

  it('concurrent rule application: all rules on empty meta produce no crashes', () => {
    const meta = makeMeta(); // Completely default meta
    const allRuleIds: InteractionRuleId[] = [
      'σ-R02', 'σ-R03', 'σ-R04', 'σ-R05',
      'σ-R06', 'σ-R08', 'σ-R10', 'σ-R12',
    ];

    // This should not throw even with minimal context
    expect(() => {
      const results = applyInteractionRules(allRuleIds, meta, {});
      // rest tendency → most will-based rules return null
      // empty memory → memory-based rules return null
      // That's fine — no crash is the key assertion
      expect(results.length).toBeGreaterThanOrEqual(0);
    }).not.toThrow();
  });
});
