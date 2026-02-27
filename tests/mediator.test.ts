// ============================================================
// Mediator 単体テスト
// Phase 2c: 競合検出・解決ロジック + 並行実行エンジン
// ============================================================

import { describe, it, expect, beforeEach } from 'vitest';
import { ReiEventBus } from '../src/lang/event-bus';
import { ReiAgent, AgentRegistry } from '../src/lang/entity-agent';
import { ReiMediator } from '../src/lang/mediator';

describe('ReiMediator — 単体テスト', () => {

  let eventBus: ReiEventBus;
  let registry: AgentRegistry;
  let mediator: ReiMediator;

  beforeEach(() => {
    eventBus = new ReiEventBus();
    registry = new AgentRegistry(eventBus);
    mediator = new ReiMediator(eventBus, registry);
  });

  // ═══════════════════════════════════════
  // 1. 基本ラウンド実行
  // ═══════════════════════════════════════

  describe('1. 基本ラウンド実行', () => {
    it('Agentなしでも安全にrunRound', () => {
      const result = mediator.runRound();
      expect(result.round).toBe(1);
      expect(result.metrics.activeAgents).toBe(0);
      expect(result.metrics.convergenceRatio).toBe(1.0);
    });

    it('1Agentで1ラウンド実行', () => {
      registry.spawn(42, { id: 'a1', behavior: 'reactive' });
      const result = mediator.runRound();

      expect(result.round).toBe(1);
      expect(result.metrics.activeAgents).toBe(1);
      expect(result.perceptions.size).toBe(1);
      expect(result.decisions.size).toBe(1);
      expect(result.actions.size).toBe(1);
    });

    it('複数Agentの同時実行', () => {
      registry.spawn(10, { id: 'a1', behavior: 'reactive' });
      registry.spawn(20, { id: 'a2', behavior: 'autonomous' });
      registry.spawn(30, { id: 'a3', behavior: 'explorative' });

      const result = mediator.runRound();

      expect(result.metrics.activeAgents).toBe(3);
      expect(result.perceptions.size).toBe(3);
      expect(result.decisions.size).toBe(3);
      expect(result.actions.size).toBe(3);
    });

    it('ラウンド番号がインクリメントされる', () => {
      registry.spawn(42, { id: 'a1', behavior: 'reactive' });

      const r1 = mediator.runRound();
      const r2 = mediator.runRound();
      const r3 = mediator.runRound();

      expect(r1.round).toBe(1);
      expect(r2.round).toBe(2);
      expect(r3.round).toBe(3);
    });
  });

  // ═══════════════════════════════════════
  // 2. 連続実行と収束
  // ═══════════════════════════════════════

  describe('2. 連続実行と収束', () => {
    it('reactive Agentのみ → 即収束', () => {
      registry.spawn(42, { id: 'r1', behavior: 'reactive' });
      registry.spawn(100, { id: 'r2', behavior: 'reactive' });

      const result = mediator.run(10);
      expect(result.converged).toBe(true);
      expect(result.convergenceRound).toBeLessThanOrEqual(10);
    });

    it('maxRoundsに到達すると終了', () => {
      registry.spawn(42, { id: 'a1', behavior: 'autonomous' });

      const result = mediator.run(3, 1.0);
      expect(result.totalRounds).toBeLessThanOrEqual(3);
    });

    it('convergenceThresholdのカスタマイズ', () => {
      registry.spawn(42, { id: 'r1', behavior: 'reactive' });
      registry.spawn(100, { id: 'auto1', behavior: 'autonomous' });

      // 閾値を低めに設定
      const result = mediator.run(10, 0.4);
      expect(result.totalRounds).toBeGreaterThanOrEqual(1);
    });

    it('Agentゼロで即収束', () => {
      const result = mediator.run(10);
      expect(result.converged).toBe(true);
      expect(result.totalRounds).toBe(1);
    });

    it('rounds配列がラウンド数と一致', () => {
      registry.spawn(42, { id: 'a1', behavior: 'reactive' });
      const result = mediator.run(5);
      expect(result.rounds.length).toBe(result.totalRounds);
    });
  });

  // ═══════════════════════════════════════
  // 3. 競合検出
  // ═══════════════════════════════════════

  describe('3. 競合検出', () => {
    it('競合なしの場合はconflicts空配列', () => {
      registry.spawn(42, { id: 'r1', behavior: 'reactive' });
      registry.spawn(100, { id: 'r2', behavior: 'reactive' });

      const result = mediator.runRound();
      expect(result.conflicts.length).toBe(0);
    });

    it('メトリクスにconflictCountが含まれる', () => {
      registry.spawn(42, { id: 'a1', behavior: 'reactive' });
      const result = mediator.runRound();
      expect(typeof result.metrics.conflictCount).toBe('number');
    });
  });

  // ═══════════════════════════════════════
  // 4. Agent優先度
  // ═══════════════════════════════════════

  describe('4. Agent優先度', () => {
    it('デフォルト優先度は0.5', () => {
      expect(mediator.getAgentPriority('any')).toBe(0.5);
    });

    it('優先度を設定・取得', () => {
      mediator.setAgentPriority('a1', 0.9);
      expect(mediator.getAgentPriority('a1')).toBe(0.9);
    });

    it('異なるAgentに異なる優先度', () => {
      mediator.setAgentPriority('a1', 0.9);
      mediator.setAgentPriority('a2', 0.1);

      expect(mediator.getAgentPriority('a1')).toBe(0.9);
      expect(mediator.getAgentPriority('a2')).toBe(0.1);
    });
  });

  // ═══════════════════════════════════════
  // 5. 調停戦略
  // ═══════════════════════════════════════

  describe('5. 調停戦略', () => {
    it('デフォルト戦略はpriority', () => {
      expect(mediator.defaultStrategy).toBe('priority');
    });

    it('戦略変更', () => {
      mediator.defaultStrategy = 'cooperative';
      expect(mediator.defaultStrategy).toBe('cooperative');
    });
  });

  // ═══════════════════════════════════════
  // 6. メッセージング
  // ═══════════════════════════════════════

  describe('6. メッセージング', () => {
    it('sendMessageでイベント発火', () => {
      registry.spawn(42, { id: 'a1', behavior: 'reactive' });
      registry.spawn(100, { id: 'a2', behavior: 'reactive' });

      const event = mediator.sendMessage('a1', 'a2', { greeting: 'hello' });
      expect(event.type).toBe('agent:act');
      expect(event.data.fromAgent).toBe('a1');
      expect(event.data.targetId).toBe('a2');
      expect(event.data.greeting).toBe('hello');
    });

    it('broadcastでイベント発火', () => {
      registry.spawn(42, { id: 'a1', behavior: 'reactive' });
      registry.spawn(100, { id: 'a2', behavior: 'reactive' });

      const event = mediator.broadcast('a1', { alert: 'urgent' });
      expect(event.type).toBe('agent:act');
      expect(event.data.type).toBe('broadcast');
      expect(event.data.fromAgent).toBe('a1');
      expect(event.data.alert).toBe('urgent');
    });
  });

  // ═══════════════════════════════════════
  // 7. σ（自己記述）
  // ═══════════════════════════════════════

  describe('7. σ（自己記述）', () => {
    it('初期σ', () => {
      const sigma = mediator.sigma();
      expect(sigma.reiType).toBe('MediatorSigma');
      expect(sigma.totalRounds).toBe(0);
      expect(sigma.totalConflicts).toBe(0);
      expect(sigma.totalResolutions).toBe(0);
      expect(sigma.defaultStrategy).toBe('priority');
      expect(sigma.isRunning).toBe(false);
      expect(sigma.convergenceHistory).toEqual([]);
    });

    it('ラウンド実行後のσ更新', () => {
      registry.spawn(42, { id: 'a1', behavior: 'reactive' });
      mediator.runRound();

      const sigma = mediator.sigma();
      expect(sigma.totalRounds).toBe(1);
      expect(sigma.convergenceHistory.length).toBe(1);
    });

    it('複数ラウンド後の収束履歴', () => {
      registry.spawn(42, { id: 'a1', behavior: 'reactive' });
      mediator.runRound();
      mediator.runRound();
      mediator.runRound();

      const sigma = mediator.sigma();
      expect(sigma.totalRounds).toBe(3);
      expect(sigma.convergenceHistory.length).toBe(3);
    });
  });

  // ═══════════════════════════════════════
  // 8. リセット
  // ═══════════════════════════════════════

  describe('8. リセット', () => {
    it('reset()で統計クリア', () => {
      registry.spawn(42, { id: 'a1', behavior: 'reactive' });
      mediator.runRound();
      mediator.setAgentPriority('a1', 0.9);

      mediator.reset();

      const sigma = mediator.sigma();
      expect(sigma.totalRounds).toBe(0);
      expect(sigma.totalConflicts).toBe(0);
      expect(sigma.convergenceHistory).toEqual([]);
      expect(mediator.getAgentPriority('a1')).toBe(0.5); // デフォルトに戻る
    });
  });

  // ═══════════════════════════════════════
  // 9. EventBus統合
  // ═══════════════════════════════════════

  describe('9. EventBus統合', () => {
    it('ラウンド実行でイベントが発火される', () => {
      registry.spawn(42, { id: 'a1', behavior: 'reactive' });
      const beforeCount = eventBus.getEventCount();
      mediator.runRound();
      const afterCount = eventBus.getEventCount();

      expect(afterCount).toBeGreaterThan(beforeCount);
    });

    it('システムイベントがログに記録される', () => {
      registry.spawn(42, { id: 'a1', behavior: 'reactive' });
      mediator.runRound();

      const systemEvents = eventBus.getLog('system');
      expect(systemEvents.length).toBeGreaterThan(0);
    });
  });

  // ═══════════════════════════════════════
  // 10. dissolved/suspendedのAgent除外
  // ═══════════════════════════════════════

  describe('10. 非活性Agentの除外', () => {
    it('dissolvedなAgentはラウンドから除外', () => {
      const a1 = registry.spawn(42, { id: 'a1', behavior: 'reactive' });
      registry.spawn(100, { id: 'a2', behavior: 'reactive' });

      registry.dissolve('a1');

      const result = mediator.runRound();
      expect(result.metrics.activeAgents).toBe(1);
    });
  });
});
