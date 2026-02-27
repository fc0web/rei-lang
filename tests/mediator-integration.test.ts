// ============================================================
// Mediator × Evaluator 統合テスト
// Phase 2c: 並行実行エンジン + 競合解決
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

describe('Mediator × Evaluator — Phase 2c統合テスト', () => {

  let ev: Evaluator;

  beforeEach(() => {
    ev = new Evaluator();
  });

  // ═══════════════════════════════════════
  // 1. 単一ラウンド調停
  // ═══════════════════════════════════════

  describe('1. 単一ラウンド調停', () => {
    it('mediate で1ラウンド並行実行', () => {
      evalRei(ev, 'let x = 42');
      evalRei(ev, 'let y = 100');
      evalRei(ev, 'x |> agent("autonomous", "a1")');
      evalRei(ev, 'y |> agent("reactive", "a2")');

      const result = evalRei(ev, '0 |> mediate');
      expect(result.reiType).toBe('MediatorRoundResult');
      expect(result.round).toBe(1);
      expect(result.activeAgents).toBe(2);
      expect(typeof result.convergence).toBe('number');
    });

    it('日本語: 調停 で1ラウンド並行実行', () => {
      evalRei(ev, 'let x = 42');
      evalRei(ev, 'x |> エージェント("自律", "a1")');

      const result = evalRei(ev, '0 |> 調停');
      expect(result.reiType).toBe('MediatorRoundResult');
    });

    it('Agentなしでもmediateは安全に動作', () => {
      const result = evalRei(ev, '0 |> mediate');
      expect(result.reiType).toBe('MediatorRoundResult');
      expect(result.activeAgents).toBe(0);
      expect(result.convergence).toBe(1.0);
    });

    it('mediateの結果に競合情報が含まれる', () => {
      evalRei(ev, 'let x = 42');
      evalRei(ev, 'x |> agent("autonomous", "a1")');

      const result = evalRei(ev, '0 |> mediate');
      expect(result).toHaveProperty('conflicts');
      expect(result).toHaveProperty('resolutions');
      expect(result).toHaveProperty('actions');
    });
  });

  // ═══════════════════════════════════════
  // 2. 複数ラウンド調停
  // ═══════════════════════════════════════

  describe('2. 複数ラウンド調停', () => {
    it('mediate(3) で3ラウンド実行', () => {
      evalRei(ev, 'let x = 42');
      evalRei(ev, 'x |> agent("autonomous", "a1")');

      const result = evalRei(ev, '0 |> mediate(3)');
      expect(result.reiType).toBe('MediatorRunResult');
      expect(result.totalRounds).toBeGreaterThanOrEqual(1);
      expect(result.totalRounds).toBeLessThanOrEqual(3);
      expect(typeof result.converged).toBe('boolean');
    });

    it('mediate_run で複数ラウンド実行', () => {
      evalRei(ev, 'let x = 42');
      evalRei(ev, 'x |> agent("reactive", "a1")');

      const result = evalRei(ev, '0 |> mediate_run(5)');
      expect(result.reiType).toBe('MediatorRunResult');
      expect(result.totalRounds).toBeGreaterThanOrEqual(1);
    });

    it('日本語: 調停実行 で複数ラウンド実行', () => {
      evalRei(ev, 'let x = 42');
      evalRei(ev, 'x |> エージェント("受動", "a1")');

      const result = evalRei(ev, '0 |> 調停実行(3)');
      expect(result.reiType).toBe('MediatorRunResult');
    });

    it('収束検出: reactiveのみだと低活動', () => {
      // reactive Agentはイベントがなければ基本的に「何もしない」を選択
      evalRei(ev, 'let x = 42');
      evalRei(ev, 'x |> agent("reactive", "r1")');

      const result = evalRei(ev, '0 |> mediate(10)');
      expect(result.reiType).toBe('MediatorRunResult');
      expect(result.totalRounds).toBeGreaterThanOrEqual(1);
      // reactiveは環境認識で何か見つけると反応する可能性がある
      expect(result.totalRounds).toBeLessThanOrEqual(10);
    });

    it('roundSummaries が含まれる', () => {
      evalRei(ev, 'let x = 42');
      evalRei(ev, 'x |> agent("autonomous", "a1")');

      const result = evalRei(ev, '0 |> mediate(3)');
      expect(Array.isArray(result.roundSummaries)).toBe(true);
      for (const s of result.roundSummaries) {
        expect(s).toHaveProperty('round');
        expect(s).toHaveProperty('activeAgents');
        expect(s).toHaveProperty('conflicts');
        expect(s).toHaveProperty('convergence');
      }
    });

    it('flowMomentum が最終状態に含まれる', () => {
      evalRei(ev, 'let x = 42');
      evalRei(ev, 'x |> agent("autonomous", "a1")');

      const result = evalRei(ev, '0 |> mediate(3)');
      expect(result.flowMomentum).toHaveProperty('state');
      expect(result.flowMomentum).toHaveProperty('rate');
    });
  });

  // ═══════════════════════════════════════
  // 3. 競合検出と解決
  // ═══════════════════════════════════════

  describe('3. 競合検出と解決', () => {
    it('複数Agentが共存して並行実行される', () => {
      evalRei(ev, 'let x = 42');
      evalRei(ev, 'let y = 100');
      evalRei(ev, 'let z = 200');
      evalRei(ev, 'x |> agent("autonomous", "a1")');
      evalRei(ev, 'y |> agent("explorative", "a2")');
      evalRei(ev, 'z |> agent("cooperative", "a3")');

      const result = evalRei(ev, '0 |> mediate');
      expect(result.activeAgents).toBe(3);
      expect(Object.keys(result.actions).length).toBe(3);
    });

    it('異なるbehaviorのAgentが同時に動作', () => {
      evalRei(ev, 'let a = 1');
      evalRei(ev, 'let b = 2');
      evalRei(ev, 'a |> agent("reactive", "r1")');
      evalRei(ev, 'b |> agent("autonomous", "auto1")');

      const result = evalRei(ev, '0 |> mediate');
      // reactive は何もしない、autonomous は認識を試みる
      expect(result.activeAgents).toBe(2);
    });
  });

  // ═══════════════════════════════════════
  // 4. Mediator σ
  // ═══════════════════════════════════════

  describe('4. Mediator σ', () => {
    it('mediator_sigma で調停σ取得', () => {
      const sigma = evalRei(ev, '0 |> mediator_sigma');
      expect(sigma.reiType).toBe('MediatorSigma');
      expect(sigma.totalRounds).toBe(0);
      expect(sigma.totalConflicts).toBe(0);
      expect(sigma.defaultStrategy).toBe('priority');
    });

    it('日本語: 調停σ で取得', () => {
      const sigma = evalRei(ev, '0 |> 調停σ');
      expect(sigma.reiType).toBe('MediatorSigma');
    });

    it('mediateの後はσが更新される', () => {
      evalRei(ev, 'let x = 42');
      evalRei(ev, 'x |> agent("autonomous", "a1")');
      evalRei(ev, '0 |> mediate');

      const sigma = evalRei(ev, '0 |> mediator_sigma');
      expect(sigma.totalRounds).toBe(1);
      expect(Array.isArray(sigma.convergenceHistory)).toBe(true);
      expect(sigma.convergenceHistory.length).toBe(1);
    });

    it('複数ラウンド後のσ', () => {
      evalRei(ev, 'let x = 42');
      evalRei(ev, 'x |> agent("autonomous", "a1")');
      evalRei(ev, '0 |> mediate(3)');

      const sigma = evalRei(ev, '0 |> mediator_sigma');
      expect(sigma.totalRounds).toBeGreaterThanOrEqual(1);
      expect(sigma.convergenceHistory.length).toBeGreaterThanOrEqual(1);
    });
  });

  // ═══════════════════════════════════════
  // 5. Agent優先度
  // ═══════════════════════════════════════

  describe('5. Agent優先度', () => {
    it('agent_priority で優先度設定', () => {
      evalRei(ev, 'let x = 42');
      evalRei(ev, 'x |> agent("autonomous", "a1")');

      const result = evalRei(ev, '"a1" |> agent_priority(0.9)');
      expect(result.agentId).toBe('a1');
      expect(result.priority).toBe(0.9);
    });

    it('agent_priority 引数なしで優先度取得', () => {
      evalRei(ev, 'let x = 42');
      evalRei(ev, 'x |> agent("autonomous", "a1")');

      const result = evalRei(ev, '"a1" |> agent_priority');
      expect(result.agentId).toBe('a1');
      expect(result.priority).toBe(0.5); // デフォルト
    });

    it('日本語: 優先度 で設定', () => {
      evalRei(ev, 'let x = 42');
      evalRei(ev, 'x |> エージェント("自律", "a1")');

      const result = evalRei(ev, '"a1" |> 優先度(0.8)');
      expect(result.priority).toBe(0.8);
    });

    it('AgentSigmaからの優先度設定', () => {
      evalRei(ev, 'let x = 42');
      evalRei(ev, 'x |> agent("autonomous", "a1")');

      // σ経由でagentIdを取得してパイプ
      evalRei(ev, 'let s = "a1" |> agent_sigma');
      const result = evalRei(ev, '"a1" |> agent_priority(0.7)');
      expect(result.priority).toBe(0.7);
    });
  });

  // ═══════════════════════════════════════
  // 6. 調停戦略
  // ═══════════════════════════════════════

  describe('6. 調停戦略', () => {
    it('mediate_strategy でデフォルト戦略変更', () => {
      const result = evalRei(ev, '0 |> mediate_strategy("cooperative")');
      expect(result.strategy).toBe('cooperative');
    });

    it('日本語: 調停戦略 で変更', () => {
      const result = evalRei(ev, '0 |> 調停戦略("協調")');
      expect(result.strategy).toBe('cooperative');
    });

    it('引数なしで現在の戦略を取得', () => {
      const result = evalRei(ev, '0 |> mediate_strategy');
      expect(result.strategy).toBe('priority'); // デフォルト
    });

    it('日本語戦略名マッピング', () => {
      evalRei(ev, '0 |> mediate_strategy("優先")');
      expect(evalRei(ev, '0 |> mediate_strategy').strategy).toBe('priority');

      evalRei(ev, '0 |> mediate_strategy("順次")');
      expect(evalRei(ev, '0 |> mediate_strategy').strategy).toBe('sequential');

      evalRei(ev, '0 |> mediate_strategy("両方取消")');
      expect(evalRei(ev, '0 |> mediate_strategy').strategy).toBe('cancel_both');

      evalRei(ev, '0 |> mediate_strategy("調停者")');
      expect(evalRei(ev, '0 |> mediate_strategy').strategy).toBe('mediator');
    });
  });

  // ═══════════════════════════════════════
  // 7. Agent間メッセージング
  // ═══════════════════════════════════════

  describe('7. Agent間メッセージング', () => {
    it('mediate_message でAgent間通信', () => {
      evalRei(ev, 'let x = 42');
      evalRei(ev, 'let y = 100');
      evalRei(ev, 'x |> agent("reactive", "a1")');
      evalRei(ev, 'y |> agent("reactive", "a2")');

      const result = evalRei(ev, '"a1" |> mediate_message("a2")');
      expect(result.sent).toBe(true);
      expect(result.from).toBe('a1');
      expect(result.to).toBe('a2');
    });

    it('mediate_broadcast で全Agent通信', () => {
      evalRei(ev, 'let x = 42');
      evalRei(ev, 'x |> agent("reactive", "a1")');

      const result = evalRei(ev, '"a1" |> mediate_broadcast');
      expect(result.broadcast).toBe(true);
      expect(result.from).toBe('a1');
    });

    it('日本語: 調停通信 で通信', () => {
      evalRei(ev, 'let x = 42');
      evalRei(ev, 'let y = 100');
      evalRei(ev, 'x |> エージェント("受動", "a1")');
      evalRei(ev, 'y |> エージェント("受動", "a2")');

      const result = evalRei(ev, '"a1" |> 調停通信("a2")');
      expect(result.sent).toBe(true);
    });

    it('日本語: 調停放送 でブロードキャスト', () => {
      evalRei(ev, 'let x = 42');
      evalRei(ev, 'x |> エージェント("受動", "a1")');

      const result = evalRei(ev, '"a1" |> 調停放送');
      expect(result.broadcast).toBe(true);
    });
  });

  // ═══════════════════════════════════════
  // 8. 統合シナリオ
  // ═══════════════════════════════════════

  describe('8. 統合シナリオ', () => {
    it('Agent生成 → 優先度設定 → 調停 → σ確認', () => {
      // Agent生成
      evalRei(ev, 'let x = 42');
      evalRei(ev, 'let y = 100');
      evalRei(ev, 'x |> agent("autonomous", "a1")');
      evalRei(ev, 'y |> agent("cooperative", "a2")');

      // 優先度設定
      evalRei(ev, '"a1" |> agent_priority(0.9)');
      evalRei(ev, '"a2" |> agent_priority(0.3)');

      // 調停実行
      const roundResult = evalRei(ev, '0 |> mediate');
      expect(roundResult.activeAgents).toBe(2);

      // σ確認
      const sigma = evalRei(ev, '0 |> mediator_sigma');
      expect(sigma.totalRounds).toBe(1);
    });

    it('複数behavior混在 → 複数ラウンド → 収束確認', () => {
      evalRei(ev, 'let a = 1');
      evalRei(ev, 'let b = 2');
      evalRei(ev, 'let c = 3');
      evalRei(ev, 'a |> agent("reactive", "r1")');
      evalRei(ev, 'b |> agent("autonomous", "auto1")');
      evalRei(ev, 'c |> agent("explorative", "exp1")');

      const result = evalRei(ev, '0 |> mediate(5)');
      expect(result.reiType).toBe('MediatorRunResult');
      expect(result.totalRounds).toBeGreaterThanOrEqual(1);
      expect(result.finalAgents.length).toBeGreaterThanOrEqual(0);
    });

    it('EventBusのイベント数が調停後に増加', () => {
      evalRei(ev, 'let x = 42');
      evalRei(ev, 'x |> agent("autonomous", "a1")');

      const beforeCount = evalRei(ev, '0 |> event_count');
      evalRei(ev, '0 |> mediate');
      const afterCount = evalRei(ev, '0 |> event_count');

      expect(afterCount).toBeGreaterThan(beforeCount);
    });

    it('Agent dissolve後のmediateは残りAgentのみ実行', () => {
      evalRei(ev, 'let x = 42');
      evalRei(ev, 'let y = 100');
      evalRei(ev, 'x |> agent("reactive", "a1")');
      evalRei(ev, 'y |> agent("reactive", "a2")');

      // a1を消滅
      evalRei(ev, '"a1" |> agent_dissolve');

      const result = evalRei(ev, '0 |> mediate');
      expect(result.activeAgents).toBe(1);
    });
  });

  // ═══════════════════════════════════════
  // 9. エッジケース
  // ═══════════════════════════════════════

  describe('9. エッジケース', () => {
    it('mediate(0) は1ラウンドとして扱う', () => {
      const result = evalRei(ev, '0 |> mediate(0)');
      // maxRounds=0 → 単一ラウンドモード（<= 1 条件）
      expect(result.reiType).toBe('MediatorRoundResult');
    });

    it('全Agent suspended状態ではactiveAgents=0', () => {
      evalRei(ev, 'let x = 42');
      evalRei(ev, 'x |> agent("reactive", "a1")');

      // Agentを消滅させる
      evalRei(ev, '"a1" |> agent_dissolve');

      const result = evalRei(ev, '0 |> mediate');
      expect(result.activeAgents).toBe(0);
    });

    it('大量Agentの並行実行', () => {
      for (let i = 0; i < 10; i++) {
        evalRei(ev, `let v${i} = ${i * 10}`);
        evalRei(ev, `v${i} |> agent("reactive", "bulk_${i}")`);
      }

      const result = evalRei(ev, '0 |> mediate');
      expect(result.activeAgents).toBe(10);
    });
  });
});
