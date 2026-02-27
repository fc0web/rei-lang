// ============================================================
// Entity Agent × Evaluator 統合テスト
// Phase 2b: パイプコマンドからのAgent操作
// ============================================================

import { describe, it, expect, beforeEach } from 'vitest';
import { Lexer } from '../src/lang/lexer';
import { Parser } from '../src/lang/parser';
import { Evaluator } from '../src/lang/evaluator';

function evalRei(ev: Evaluator, code: string): any {
  const lexer = new Lexer(code);
  const tokens = lexer.tokenize();
  const parser = new Parser(tokens);
  const ast = parser.parseProgram();
  return ev.eval(ast);
}

describe('Entity Agent × Evaluator — Phase 2b統合テスト', () => {

  let ev: Evaluator;

  beforeEach(() => {
    ev = new Evaluator();
  });

  // ═══════════════════════════════════════
  // 1. Agentパイプコマンド
  // ═══════════════════════════════════════

  describe('1. Agent生成', () => {
    it('agent コマンドでAgent生成', () => {
      evalRei(ev, 'let x = 42');
      const sigma = evalRei(ev, 'x |> agent');
      expect(sigma.reiType).toBe('AgentSigma');
      expect(sigma.field.kind).toBe('numeric');
      expect(sigma.behavior).toBe('reactive');
    });

    it('behavior指定でAgent生成', () => {
      evalRei(ev, 'let x = 42');
      const sigma = evalRei(ev, 'x |> agent("autonomous")');
      expect(sigma.behavior).toBe('autonomous');
    });

    it('behavior + ID指定でAgent生成', () => {
      evalRei(ev, 'let x = 42');
      const sigma = evalRei(ev, 'x |> agent("autonomous", "my_agent")');
      expect(sigma.id).toBe('my_agent');
      expect(sigma.behavior).toBe('autonomous');
    });

    it('日本語コマンドでAgent生成', () => {
      evalRei(ev, 'let x = 42');
      const sigma = evalRei(ev, 'x |> エージェント');
      expect(sigma.reiType).toBe('AgentSigma');
    });

    it('日本語behavior指定', () => {
      evalRei(ev, 'let x = 42');
      const sigma = evalRei(ev, 'x |> エージェント("自律")');
      expect(sigma.behavior).toBe('autonomous');
    });

    it('文字列からAgent生成', () => {
      evalRei(ev, 'let s = "hello"');
      const sigma = evalRei(ev, 's |> agent');
      expect(sigma.field.kind).toBe('linguistic');
    });

    it('𝕄からAgent生成', () => {
      evalRei(ev, 'let m = 𝕄{5; 1, 2, 3}');
      const sigma = evalRei(ev, 'm |> agent("explorative")');
      expect(sigma.field.kind).toBe('numeric');
      expect(sigma.behavior).toBe('explorative');
    });
  });

  // ═══════════════════════════════════════
  // 2. Agent tick
  // ═══════════════════════════════════════

  describe('2. Agent tick', () => {
    it('agent_tickでAgentを一歩進める', () => {
      evalRei(ev, 'let x = 42');
      evalRei(ev, 'let y = 43');
      const sigma = evalRei(ev, 'x |> agent("reactive", "test_tick")');
      const result = evalRei(ev, '"test_tick" |> agent_tick');
      expect(result.reiType).toBe('AgentTickResult');
      expect(result.agentId).toBe('test_tick');
      expect(result.step).toBe(1);
    });

    it('日本語agent_tick', () => {
      evalRei(ev, 'let x = 42');
      evalRei(ev, 'x |> エージェント("自律", "jp_tick")');
      const result = evalRei(ev, '"jp_tick" |> 自律実行');
      expect(result.reiType).toBe('AgentTickResult');
    });

    it('σからのパイプチェーン: agent → agent_tick', () => {
      evalRei(ev, 'let pi_val = 3.14');
      const sigma = evalRei(ev, 'pi_val |> agent("autonomous", "chain_test")');
      const result = evalRei(ev, '"chain_test" |> agent_tick');
      expect(result.reiType).toBe('AgentTickResult');
      expect(result.decision).toBeDefined();
    });
  });

  // ═══════════════════════════════════════
  // 3. Agent管理
  // ═══════════════════════════════════════

  describe('3. Agent管理', () => {
    it('agent_listで全Agent一覧取得', () => {
      evalRei(ev, 'let a = 1');
      evalRei(ev, 'let b = 2');
      evalRei(ev, 'a |> agent("reactive", "a1")');
      evalRei(ev, 'b |> agent("autonomous", "a2")');
      const list = evalRei(ev, '0 |> agent_list');
      expect(list.length).toBe(2);
    });

    it('agent_sigmaでσ取得', () => {
      evalRei(ev, 'let x = 42');
      evalRei(ev, 'x |> agent("reactive", "sigma_test")');
      const sigma = evalRei(ev, '"sigma_test" |> agent_sigma');
      expect(sigma.reiType).toBe('AgentSigma');
      expect(sigma.id).toBe('sigma_test');
    });

    it('agent_dissolveでAgent消滅', () => {
      evalRei(ev, 'let x = 42');
      evalRei(ev, 'x |> agent("reactive", "del_test")');
      const result = evalRei(ev, '"del_test" |> agent_dissolve');
      expect(result.dissolved).toBe(true);
      const list = evalRei(ev, '0 |> agent_list');
      expect(list.length).toBe(0);
    });

    it('agent_registry_sigmaで統計取得', () => {
      evalRei(ev, 'let a = 1');
      evalRei(ev, 'let b = 2');
      evalRei(ev, 'let c = 3');
      evalRei(ev, 'a |> agent("reactive")');
      evalRei(ev, 'b |> agent("autonomous")');
      evalRei(ev, 'c |> agent("cooperative")');
      const stats = evalRei(ev, '0 |> agent_registry_sigma');
      expect(stats.reiType).toBe('AgentRegistrySigma');
      expect(stats.totalAgents).toBe(3);
      expect(stats.activeAgents).toBe(3);
    });
  });

  // ═══════════════════════════════════════
  // 4. EventBusパイプコマンド
  // ═══════════════════════════════════════

  describe('4. EventBusコマンド', () => {
    it('event_sigmaでEventBusのσ取得', () => {
      const sigma = evalRei(ev, '0 |> event_sigma');
      expect(sigma.reiType).toBe('EventBusSigma');
    });

    it('event_countでイベント数取得', () => {
      evalRei(ev, 'let x = 42');
      evalRei(ev, 'x |> agent("reactive", "ev_count_test")');
      const count = evalRei(ev, '0 |> event_count');
      expect(count).toBeGreaterThan(0);
    });

    it('event_flowで流れ状態取得', () => {
      const flow = evalRei(ev, '0 |> event_flow');
      expect(flow.state).toBeDefined();
    });

    it('日本語EventBusコマンド', () => {
      const sigma = evalRei(ev, '0 |> イベントσ');
      expect(sigma.reiType).toBe('EventBusSigma');
      const count = evalRei(ev, '0 |> イベント数');
      expect(typeof count).toBe('number');
      const flow = evalRei(ev, '0 |> 流れ状態');
      expect(flow.state).toBeDefined();
    });
  });

  // ═══════════════════════════════════════
  // 5. agents_tick_all
  // ═══════════════════════════════════════

  describe('5. 全Agent一括tick', () => {
    it('agents_tick_allで全Agentが一括実行', () => {
      evalRei(ev, 'let a = 1');
      evalRei(ev, 'let b = 2');
      evalRei(ev, 'let c = 3');
      evalRei(ev, 'a |> agent("reactive", "all_1")');
      evalRei(ev, 'b |> agent("autonomous", "all_2")');
      evalRei(ev, 'c |> agent("explorative", "all_3")');
      const result = evalRei(ev, '0 |> agents_tick_all');
      expect(result.reiType).toBe('AgentTickAllResult');
      expect(result.count).toBe(3);
    });

    it('日本語全自律実行', () => {
      evalRei(ev, 'let x = 42');
      evalRei(ev, 'x |> エージェント("自律", "jp_all")');
      const result = evalRei(ev, '0 |> 全自律実行');
      expect(result.count).toBe(1);
    });
  });

  // ═══════════════════════════════════════
  // 6. 既存autonomyコマンドにEventBus発火
  // ═══════════════════════════════════════

  describe('6. 既存コマンドのEventBus統合', () => {
    it('recognizeがEventBusにイベントを発火', () => {
      evalRei(ev, 'let x = 42');
      evalRei(ev, 'let y = 43');
      evalRei(ev, 'x |> recognize');
      const sigma = evalRei(ev, '0 |> event_sigma');
      expect(sigma.categoryCounts['entity']).toBeGreaterThan(0);
    });

    it('fuse_withがEventBusにイベントを発火', () => {
      evalRei(ev, 'let a = 42');
      evalRei(ev, 'let b = 43');
      evalRei(ev, 'a |> fuse_with("b")');
      const sigma = evalRei(ev, '0 |> event_sigma');
      expect(sigma.categoryCounts['entity']).toBeGreaterThan(0);
    });

    it('separateがEventBusにイベントを発火', () => {
      evalRei(ev, 'let m = 𝕄{5; 1, 2, 3}');
      evalRei(ev, 'm |> separate');
      const count = evalRei(ev, '0 |> event_count');
      expect(count).toBeGreaterThan(0);
    });

    it('transform_toがEventBusにイベントを発火', () => {
      evalRei(ev, 'let x = 42');
      evalRei(ev, 'x |> transform_to("symbolic")');
      const count = evalRei(ev, '0 |> event_count');
      expect(count).toBeGreaterThan(0);
    });
  });

  // ═══════════════════════════════════════
  // 7. 六属性σ統合
  // ═══════════════════════════════════════

  describe('7. 六属性σの完全性', () => {
    it('AgentSigmaに六属性が全て含まれる', () => {
      evalRei(ev, 'let x = 42');
      const sigma = evalRei(ev, 'x |> agent("autonomous", "full_sigma")');

      // 場 (field)
      expect(sigma.field).toBeDefined();
      expect(sigma.field.kind).toBe('numeric');
      expect(sigma.field.entitySigma).toBeDefined();

      // 流れ (flow)
      expect(sigma.flow).toBeDefined();
      expect(sigma.flow.state).toBeDefined();

      // 記憶 (memory)
      expect(sigma.memory).toBeDefined();
      expect(sigma.memory.totalEntries).toBeGreaterThanOrEqual(0);

      // 層 (layer)
      expect(sigma.layer).toBeDefined();
      expect(typeof sigma.layer.depth).toBe('number');

      // 関係 (relation)
      expect(sigma.relation).toBeDefined();
      expect(sigma.relation.bindingCount).toBe(0);

      // 意志 (will)
      expect(sigma.will).toBeDefined();
    });
  });
});
