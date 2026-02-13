// ============================================================
// Entity Agent 単体テスト
// Phase 2b: 六属性を持つ自律Agent
// ============================================================

import { describe, it, expect, beforeEach } from 'vitest';
import {
  ReiAgent, AgentRegistry,
  type AgentBehavior, type AgentState, type Perception, type Decision,
} from '../src/lang/entity-agent';
import { ReiEventBus } from '../src/lang/event-bus';

// ─── ヘルパー ─────────────────────────

function createTestEnvironment(): Map<string, any> {
  const env = new Map<string, any>();
  env.set('x', { value: 42 });
  env.set('pi', { value: Math.PI });
  env.set('name', { value: '円周率' });
  env.set('mdim', { value: { reiType: 'MDim', center: 10, neighbors: [1, 2, 3], mode: 'weighted' } });
  return env;
}

describe('Entity Agent — Phase 2b', () => {

  // ═══════════════════════════════════════
  // 1. Agent 生成と基本プロパティ
  // ═══════════════════════════════════════

  describe('1. Agent生成', () => {
    it('数値からAgentを生成できる', () => {
      const agent = new ReiAgent(42);
      expect(agent.value).toBe(42);
      expect(agent.kind).toBe('numeric');
      expect(agent.state).toBe('dormant');
    });

    it('文字列からAgentを生成できる', () => {
      const agent = new ReiAgent('円周率');
      expect(agent.value).toBe('円周率');
      expect(agent.kind).toBe('linguistic');
    });

    it('記号からAgentを生成できる', () => {
      const agent = new ReiAgent('π');
      expect(agent.kind).toBe('symbolic');
    });

    it('𝕄からAgentを生成できる', () => {
      const mdim = { reiType: 'MDim', center: 5, neighbors: [1, 2, 3], mode: 'weighted' };
      const agent = new ReiAgent(mdim);
      expect(agent.kind).toBe('numeric');
      expect(agent.value).toEqual(mdim);
    });

    it('オプション指定で生成できる', () => {
      const agent = new ReiAgent(42, {
        id: 'test_agent',
        behavior: 'autonomous',
        depth: 2,
      });
      expect(agent.id).toBe('test_agent');
      expect(agent.behavior).toBe('autonomous');
      expect(agent.depth).toBe(2);
    });

    it('IDが自動生成される', () => {
      const a1 = new ReiAgent(1);
      const a2 = new ReiAgent(2);
      expect(a1.id).not.toBe(a2.id);
      expect(a1.id).toMatch(/^agent_\d+$/);
    });
  });

  // ═══════════════════════════════════════
  // 2. ライフサイクル
  // ═══════════════════════════════════════

  describe('2. ライフサイクル', () => {
    let agent: ReiAgent;

    beforeEach(() => {
      agent = new ReiAgent(42, { id: 'lifecycle_test' });
    });

    it('dormant → active → suspended → active → dissolved', () => {
      expect(agent.state).toBe('dormant');
      agent.activate();
      expect(agent.state).toBe('active');
      agent.suspend();
      expect(agent.state).toBe('suspended');
      agent.resume();
      expect(agent.state).toBe('active');
      agent.dissolve();
      expect(agent.state).toBe('dissolved');
    });

    it('消滅済みAgentは起動できない', () => {
      agent.activate();
      agent.dissolve();
      expect(() => agent.activate()).toThrow('消滅済み');
    });

    it('EventBusを接続して起動できる', () => {
      const bus = new ReiEventBus();
      agent.activate(bus);
      expect(agent.state).toBe('active');
    });

    it('起動時にagent:spawnイベントが発火される', () => {
      const bus = new ReiEventBus();
      const events: any[] = [];
      bus.on('agent:spawn', (e) => events.push(e));
      agent.activate(bus);
      expect(events.length).toBe(1);
      expect(events[0].data.agentId).toBe('lifecycle_test');
    });
  });

  // ═══════════════════════════════════════
  // 3. perceive → decide → act サイクル
  // ═══════════════════════════════════════

  describe('3. perceive/decide/act', () => {
    let agent: ReiAgent;
    let bus: ReiEventBus;
    let env: Map<string, any>;

    beforeEach(() => {
      bus = new ReiEventBus();
      env = createTestEnvironment();
      agent = new ReiAgent(Math.PI, { id: 'pda_test', behavior: 'reactive' });
      agent.activate(bus);
    });

    it('perceive: 環境を認識できる', () => {
      const perception = agent.perceive(env, 'pi');
      expect(perception.recognized).not.toBeNull();
      expect(perception.recognized!.compatibleCount).toBeGreaterThan(0);
    });

    it('perceive: EventBusイベントを受信できる', () => {
      // entity:recognizeイベントを手動発火
      bus.emit('entity:recognize', { test: true });
      const perception = agent.perceive();
      expect(perception.events.length).toBeGreaterThan(0);
    });

    it('perceive: dormantの場合は空の知覚を返す', () => {
      const dormant = new ReiAgent(1);
      const perception = dormant.perceive(env);
      expect(perception.events.length).toBe(0);
      expect(perception.recognized).toBeNull();
    });

    it('decide (reactive): イベントなしなら何もしない', () => {
      const perception = agent.perceive();  // イベントなし、環境なし
      const decision = agent.decide(perception);
      expect(decision.action).toBe('none');
    });

    it('decide (reactive): 互換エンティティがあればrecognize', () => {
      const perception = agent.perceive(env, 'pi');
      const decision = agent.decide(perception);
      // πは「円周率」と互換性がある
      expect(['recognize', 'none']).toContain(decision.action);
    });

    it('act (recognize): 環境を認識して結果を返す', () => {
      const decision: Decision = {
        timestamp: Date.now(),
        action: 'recognize',
        params: {},
        reason: 'テスト',
        confidence: 1.0,
      };
      const result = agent.act(decision, { environment: env, selfName: 'pi' });
      expect(result.success).toBe(true);
      expect(result.result.reiType).toBe('RecognitionResult');
    });

    it('act (transform): 変容を実行できる', () => {
      const decision: Decision = {
        timestamp: Date.now(),
        action: 'transform',
        params: { direction: 'to_symbolic' },
        reason: 'テスト',
        confidence: 1.0,
      };
      const result = agent.act(decision);
      expect(result.success).toBe(true);
      expect(result.result.reiType).toBe('TransformResult');
    });

    it('act (separate): 分離を実行できる', () => {
      const mdimAgent = new ReiAgent(
        { reiType: 'MDim', center: 5, neighbors: [1, 2, 3], mode: 'weighted' },
        { id: 'sep_test' }
      );
      mdimAgent.activate(bus);
      const decision: Decision = {
        timestamp: Date.now(),
        action: 'separate',
        params: {},
        reason: 'テスト',
        confidence: 1.0,
      };
      const result = mdimAgent.act(decision);
      expect(result.success).toBe(true);
      expect(result.result.parts.length).toBeGreaterThan(1);
    });

    it('tick: 一括実行できる', () => {
      const result = agent.tick({ environment: env, selfName: 'pi' });
      expect(result.perception).toBeDefined();
      expect(result.decision).toBeDefined();
      expect(result.action).toBeDefined();
    });
  });

  // ═══════════════════════════════════════
  // 4. 振る舞いポリシー
  // ═══════════════════════════════════════

  describe('4. 振る舞いポリシー', () => {
    let bus: ReiEventBus;
    let env: Map<string, any>;

    beforeEach(() => {
      bus = new ReiEventBus();
      env = createTestEnvironment();
    });

    it('autonomous: 意志に基づいて判断する', () => {
      const agent = new ReiAgent(42, { behavior: 'autonomous' });
      agent.activate(bus);
      agent.setIntention({
        type: 'seek',
        target: 100,
        priority: 0.8,
        patience: 10,
        satisfaction: 0.1,  // 低い → 変容を試みるはず
        currentStep: 0,
        history: [],
        active: true,
      });
      const perception = agent.perceive(env, 'x');
      const decision = agent.decide(perception);
      expect(decision.action).toBe('transform');
    });

    it('autonomous: 高満足度で認識に切り替え', () => {
      const agent = new ReiAgent(42, { behavior: 'autonomous' });
      agent.activate(bus);
      agent.setIntention({
        type: 'seek',
        target: 42,
        priority: 0.8,
        patience: 10,
        satisfaction: 0.9,  // 高い → 新しい探索
        currentStep: 0,
        history: [],
        active: true,
      });
      const perception = agent.perceive(env, 'x');
      const decision = agent.decide(perception);
      expect(decision.action).toBe('recognize');
    });

    it('cooperative: 結合を提案する', () => {
      const agent = new ReiAgent(Math.PI, { behavior: 'cooperative' });
      agent.activate(bus);
      const perception = agent.perceive(env, 'pi');
      const decision = agent.decide(perception);
      // 互換エンティティがあれば結合を提案
      expect(['bind', 'none', 'recognize']).toContain(decision.action);
    });

    it('explorative: 変容を積極的に試みる', () => {
      const agent = new ReiAgent(42, { behavior: 'explorative' });
      agent.activate(bus);
      // step=0, 0%3==0 → 変容を試みる
      const perception = agent.perceive(env, 'x');
      const decision = agent.decide(perception);
      expect(['transform', 'recognize']).toContain(decision.action);
    });
  });

  // ═══════════════════════════════════════
  // 5. 六属性統合
  // ═══════════════════════════════════════

  describe('5. 六属性σ', () => {
    it('σに六属性が含まれる', () => {
      const bus = new ReiEventBus();
      const agent = new ReiAgent(Math.PI, { behavior: 'autonomous' });
      agent.activate(bus);

      const s = agent.sigma();
      expect(s.reiType).toBe('AgentSigma');

      // 場 (field)
      expect(s.field.kind).toBe('numeric');
      expect(s.field.entitySigma.reiType).toBe('EntitySigma');

      // 流れ (flow)
      expect(s.flow.state).toBeDefined();

      // 記憶 (memory)
      expect(s.memory.totalEntries).toBeGreaterThan(0);  // activate時に記録

      // 層 (layer)
      expect(s.layer.depth).toBe(0);

      // 関係 (relation)
      expect(s.relation.bindingCount).toBe(0);

      // 意志 (will)
      expect(s.will.intention).toBeNull();
    });

    it('意志設定がσに反映される', () => {
      const agent = new ReiAgent(42);
      agent.activate();
      agent.setIntention({
        type: 'seek',
        target: 100,
        priority: 0.9,
        patience: 10,
        satisfaction: 0.5,
        currentStep: 0,
        history: [],
        active: true,
      });

      const s = agent.sigma();
      expect(s.will.intention).not.toBeNull();
      expect(s.will.intention!.type).toBe('seek');
      expect(s.will.satisfaction).toBe(0.5);
    });

    it('記憶がperceive/decide/actで蓄積される', () => {
      const bus = new ReiEventBus();
      const env = createTestEnvironment();
      const agent = new ReiAgent(42, { behavior: 'reactive' });
      agent.activate(bus);

      agent.tick({ environment: env, selfName: 'x' });

      const s = agent.sigma();
      // activate + perceive + decide + act で最低4エントリ
      expect(s.memory.totalEntries).toBeGreaterThanOrEqual(4);
    });
  });

  // ═══════════════════════════════════════
  // 6. EventBus連携
  // ═══════════════════════════════════════

  describe('6. EventBus連携', () => {
    it('Agentのactがイベントを発火する', () => {
      const bus = new ReiEventBus();
      const events: any[] = [];
      bus.on('agent', (e) => events.push(e));

      const agent = new ReiAgent(42);
      agent.activate(bus);

      // tick実行 → agent:perceive, agent:decide, agent:act が発火されるはず
      const env = createTestEnvironment();
      agent.tick({ environment: env, selfName: 'x' });

      const agentEvents = events.filter(e => e.category === 'agent');
      expect(agentEvents.length).toBeGreaterThanOrEqual(3); // spawn + perceive + decide + act
    });

    it('EventBus切断後はイベントが発火されない', () => {
      const bus = new ReiEventBus();
      const events: any[] = [];
      bus.on('agent:spawn', (e) => events.push(e));

      const agent = new ReiAgent(42);
      agent.activate(bus);
      const countAfterActivate = events.length;

      agent.detachEventBus();
      // detach後のperceiveは内部でイベント発火を試みるが、
      // eventBusがnullなので何も起きない
      const perception = agent.perceive();
      expect(events.length).toBe(countAfterActivate);
    });
  });

  // ═══════════════════════════════════════
  // 7. AgentRegistry
  // ═══════════════════════════════════════

  describe('7. AgentRegistry', () => {
    let registry: AgentRegistry;
    let bus: ReiEventBus;

    beforeEach(() => {
      bus = new ReiEventBus();
      registry = new AgentRegistry(bus);
    });

    it('Agentを生成・登録できる', () => {
      const agent = registry.spawn(42, { id: 'reg_test' });
      expect(agent.state).toBe('active');  // autoActivate=true
      expect(registry.size()).toBe(1);
      expect(registry.get('reg_test')).toBe(agent);
    });

    it('親子関係を設定できる', () => {
      const parent = registry.spawn(1, { id: 'parent' });
      const child = registry.spawn(2, { id: 'child', parentId: 'parent' });
      expect(child.depth).toBe(1);
      expect(child.parentId).toBe('parent');
      expect(parent.childIds).toContain('child');
    });

    it('消滅で子Agentも連鎖消滅する', () => {
      registry.spawn(1, { id: 'root' });
      registry.spawn(2, { id: 'child1', parentId: 'root' });
      registry.spawn(3, { id: 'child2', parentId: 'root' });
      expect(registry.size()).toBe(3);

      registry.dissolve('root');
      expect(registry.size()).toBe(0);
    });

    it('tickAllで全Agentが一括tick', () => {
      registry.spawn(42, { id: 'a1', behavior: 'reactive' });
      registry.spawn(Math.PI, { id: 'a2', behavior: 'autonomous' });
      registry.spawn('π', { id: 'a3', behavior: 'explorative' });

      const env = createTestEnvironment();
      const results = registry.tickAll(env);
      expect(results.size).toBe(3);

      for (const [id, result] of results) {
        expect(result.perception).toBeDefined();
        expect(result.decision).toBeDefined();
        expect(result.action).toBeDefined();
      }
    });

    it('listで全Agent一覧を取得', () => {
      registry.spawn(42, { id: 'l1', behavior: 'reactive' });
      registry.spawn('π', { id: 'l2', behavior: 'autonomous' });

      const list = registry.list();
      expect(list.length).toBe(2);
      expect(list[0].kind).toBe('numeric');
      expect(list[1].kind).toBe('symbolic');
    });

    it('σで統計情報を取得', () => {
      registry.spawn(42, { behavior: 'reactive' });
      registry.spawn(Math.PI, { behavior: 'autonomous' });
      registry.spawn('hello', { behavior: 'cooperative' });

      const s = registry.sigma();
      expect(s.reiType).toBe('AgentRegistrySigma');
      expect(s.totalAgents).toBe(3);
      expect(s.activeAgents).toBe(3);
      expect(s.byBehavior['reactive']).toBe(1);
      expect(s.byBehavior['autonomous']).toBe(1);
    });

    it('clearで全Agent消滅', () => {
      registry.spawn(1);
      registry.spawn(2);
      registry.spawn(3);
      expect(registry.size()).toBe(3);

      registry.clear();
      expect(registry.size()).toBe(0);
    });
  });

  // ═══════════════════════════════════════
  // 8. 融合テスト（Agent間）
  // ═══════════════════════════════════════

  describe('8. Agent間融合', () => {
    it('2つのAgentが融合できる', () => {
      const bus = new ReiEventBus();
      const registry = new AgentRegistry(bus);

      const a1 = registry.spawn(Math.PI, { id: 'pi_agent' });
      const a2 = registry.spawn('π', { id: 'sym_agent' });

      const decision: Decision = {
        timestamp: Date.now(),
        action: 'fuse',
        target: 'sym_agent',
        params: { strategy: 'merge' },
        reason: 'テスト融合',
        confidence: 0.9,
      };

      const result = a1.act(decision, { agentRegistry: registry });
      expect(result.success).toBe(true);
      expect(result.result.reiType).toBe('FusionResult');
    });

    it('存在しないAgentとの融合は失敗', () => {
      const bus = new ReiEventBus();
      const registry = new AgentRegistry(bus);

      const a1 = registry.spawn(42);

      const decision: Decision = {
        timestamp: Date.now(),
        action: 'fuse',
        target: 'nonexistent',
        params: {},
        reason: 'テスト',
        confidence: 0.5,
      };

      const result = a1.act(decision, { agentRegistry: registry });
      expect(result.success).toBe(false);
    });
  });
});
