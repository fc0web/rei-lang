// ============================================================
// EventBus 単体テスト
// Phase 2a: イベント駆動基盤
// ============================================================

import { describe, it, expect, beforeEach } from 'vitest';
import { ReiEventBus, type ReiEvent, type EventType } from '../src/lang/event-bus';

describe('EventBus — Phase 2a', () => {

  let bus: ReiEventBus;

  beforeEach(() => {
    bus = new ReiEventBus();
  });

  // ═══════════════════════════════════════
  // 1. 基本的な発火・購読
  // ═══════════════════════════════════════

  describe('1. 基本的な発火・購読', () => {
    it('イベントを発火できる', () => {
      const event = bus.emit('entity:recognize', { test: true });
      expect(event.type).toBe('entity:recognize');
      expect(event.category).toBe('entity');
      expect(event.action).toBe('recognize');
      expect(event.data.test).toBe(true);
    });

    it('EventType完全一致でイベントを購読', () => {
      const received: ReiEvent[] = [];
      bus.on('entity:recognize', (e) => received.push(e));
      bus.emit('entity:recognize', { a: 1 });
      bus.emit('entity:fuse', { b: 2 });
      expect(received.length).toBe(1);
      expect(received[0].data.a).toBe(1);
    });

    it('カテゴリワイルドカードで購読', () => {
      const received: ReiEvent[] = [];
      bus.on('entity', (e) => received.push(e));
      bus.emit('entity:recognize', {});
      bus.emit('entity:fuse', {});
      bus.emit('binding:create', {});
      expect(received.length).toBe(2);
    });

    it('全イベント購読 (*)', () => {
      const received: ReiEvent[] = [];
      bus.on('*', (e) => received.push(e));
      bus.emit('entity:recognize', {});
      bus.emit('binding:create', {});
      bus.emit('will:intend', {});
      expect(received.length).toBe(3);
    });

    it('カスタムフィルタ関数で購読', () => {
      const received: ReiEvent[] = [];
      bus.on(
        (e) => e.data.priority > 0.5,
        (e) => received.push(e)
      );
      bus.emit('entity:recognize', { priority: 0.3 });
      bus.emit('entity:fuse', { priority: 0.8 });
      expect(received.length).toBe(1);
    });
  });

  // ═══════════════════════════════════════
  // 2. 購読解除・once
  // ═══════════════════════════════════════

  describe('2. 購読解除・once', () => {
    it('購読解除関数で解除できる', () => {
      const received: ReiEvent[] = [];
      const unsub = bus.on('entity:recognize', (e) => received.push(e));
      bus.emit('entity:recognize', {});
      expect(received.length).toBe(1);

      unsub();
      bus.emit('entity:recognize', {});
      expect(received.length).toBe(1);  // 増えない
    });

    it('onceは一度だけ発火', () => {
      const received: ReiEvent[] = [];
      bus.once('entity:recognize', (e) => received.push(e));
      bus.emit('entity:recognize', { n: 1 });
      bus.emit('entity:recognize', { n: 2 });
      expect(received.length).toBe(1);
      expect(received[0].data.n).toBe(1);
    });

    it('clearで全購読解除', () => {
      const received: ReiEvent[] = [];
      bus.on('*', (e) => received.push(e));
      bus.emit('entity:recognize', {});
      expect(received.length).toBe(1);

      bus.clear();
      bus.emit('entity:recognize', {});
      expect(received.length).toBe(1);  // 増えない
    });
  });

  // ═══════════════════════════════════════
  // 3. イベントログ
  // ═══════════════════════════════════════

  describe('3. イベントログ', () => {
    it('イベントがログに記録される', () => {
      bus.emit('entity:recognize', {});
      bus.emit('binding:create', {});
      const log = bus.getLog();
      expect(log.length).toBe(2);
    });

    it('カテゴリ別でログを取得', () => {
      bus.emit('entity:recognize', {});
      bus.emit('entity:fuse', {});
      bus.emit('binding:create', {});
      const entityLog = bus.getLog('entity');
      expect(entityLog.length).toBe(2);
    });

    it('ログサイズ上限が機能する', () => {
      const smallBus = new ReiEventBus(10);
      for (let i = 0; i < 20; i++) {
        smallBus.emit('entity:recognize', { i });
      }
      const log = smallBus.getLog();
      expect(log.length).toBeLessThanOrEqual(10);
    });

    it('clearLogでログをクリア', () => {
      bus.emit('entity:recognize', {});
      bus.emit('binding:create', {});
      bus.clearLog();
      expect(bus.getLog().length).toBe(0);
    });
  });

  // ═══════════════════════════════════════
  // 4. 安全性
  // ═══════════════════════════════════════

  describe('4. 安全性', () => {
    it('リスナーエラーが他のリスナーに影響しない', () => {
      const received: ReiEvent[] = [];
      bus.on('entity:recognize', () => { throw new Error('テストエラー'); });
      bus.on('entity:recognize', (e) => received.push(e));
      bus.emit('entity:recognize', {});
      expect(received.length).toBe(1);  // エラーリスナーの後でも受信
    });

    it('リスナーエラーがsystem:errorとしてログに記録される', () => {
      bus.on('entity:recognize', () => { throw new Error('テストエラー'); });
      bus.emit('entity:recognize', {});
      const errorLog = bus.getLog('system');
      expect(errorLog.length).toBe(1);
      expect(errorLog[0].data.error).toContain('テストエラー');
    });

    it('無限連鎖が防止される (maxDepth=16)', () => {
      // 自己参照イベント連鎖
      bus.on('entity:recognize', () => {
        bus.emit('entity:recognize', { chain: true });
      });
      bus.emit('entity:recognize', { start: true });

      // 16回で停止し、system:errorが記録される
      const errorLog = bus.getLog('system');
      expect(errorLog.length).toBeGreaterThan(0);
    });
  });

  // ═══════════════════════════════════════
  // 5. FlowMomentum
  // ═══════════════════════════════════════

  describe('5. FlowMomentum', () => {
    it('イベントなしではrest状態', () => {
      const flow = bus.getFlowMomentum();
      expect(flow.state).toBe('rest');
      expect(flow.rate).toBe(0);
    });

    it('イベント発火後にrecentCountが増加', () => {
      bus.emit('entity:recognize', {});
      bus.emit('entity:fuse', {});
      const flow = bus.getFlowMomentum();
      expect(flow.recentCount).toBe(2);
    });
  });

  // ═══════════════════════════════════════
  // 6. σ（自己記述）
  // ═══════════════════════════════════════

  describe('6. σ', () => {
    it('EventBusのσを取得できる', () => {
      bus.on('*', () => {});
      bus.on('entity', () => {});
      bus.emit('entity:recognize', {});
      bus.emit('binding:create', {});

      const sigma = bus.getSigma();
      expect(sigma.reiType).toBe('EventBusSigma');
      expect(sigma.totalEmitted).toBe(2);
      expect(sigma.totalListeners).toBe(2);
      expect(sigma.categoryCounts['entity']).toBe(1);
      expect(sigma.categoryCounts['binding']).toBe(1);
      expect(sigma.maxDepth).toBe(16);
    });

    it('イベント数カウントが正確', () => {
      for (let i = 0; i < 5; i++) bus.emit('entity:recognize', {});
      expect(bus.getEventCount()).toBe(5);
    });

    it('リスナー数カウントが正確', () => {
      bus.on('*', () => {});
      bus.on('entity', () => {});
      const unsub = bus.on('binding', () => {});
      expect(bus.listenerCount()).toBe(3);
      unsub();
      expect(bus.listenerCount()).toBe(2);
    });
  });

  // ═══════════════════════════════════════
  // 7. ソース追跡
  // ═══════════════════════════════════════

  describe('7. ソース追跡', () => {
    it('sourceが設定される', () => {
      const received: ReiEvent[] = [];
      bus.on('*', (e) => received.push(e));
      bus.emit('entity:recognize', {}, 'agent_1');
      expect(received[0].source).toBe('agent_1');
    });

    it('sourceなしの場合はundefined', () => {
      const received: ReiEvent[] = [];
      bus.on('*', (e) => received.push(e));
      bus.emit('entity:recognize', {});
      expect(received[0].source).toBeUndefined();
    });
  });
});
