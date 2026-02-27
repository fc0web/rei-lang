/**
 * Phase 4c テスト: ゲーム推論深化
 * - 行動パターン分化 (behavior-based decisions)
 * - 戦術パターン知覚 (TacticalPerception)
 * - 対局分析 (MatchAnalysis)
 */
import { describe, it, expect } from 'vitest';
import { rei } from '../src/index';
import { createGameSpace } from '../src/lang/game';
import {
  createGameAgentSpace, agentSpaceRun, getMatchAnalysis,
} from '../src/lang/agent-space';

function ev(code: string): any {
  return rei(code);
}

describe('Phase 4c: ゲーム推論深化', () => {

  describe('対局分析 (MatchAnalysis) — API', () => {
    it('三目並べの対局分析が取得できる', () => {
      const game = createGameSpace('tic_tac_toe');
      const space = createGameAgentSpace(game, 'minimax', 'minimax');
      agentSpaceRun(space, 50);
      const analysis = getMatchAnalysis(space);

      expect(analysis.reiType).toBe('MatchAnalysis');
      expect(typeof analysis.totalMoves).toBe('number');
      expect(analysis.totalMoves).toBeGreaterThan(0);
      expect(typeof analysis.tacticalSummary).toBe('string');
    });

    it('players に両プレイヤーの分析が含まれる', () => {
      const game = createGameSpace('tic_tac_toe');
      const space = createGameAgentSpace(game, 'minimax', 'random');
      agentSpaceRun(space, 50);
      const analysis = getMatchAnalysis(space);

      expect(analysis.players.length).toBe(2);
      expect(analysis.players[0].player).toBe(1);
      expect(analysis.players[1].player).toBe(2);
    });

    it('behavior が記録される', () => {
      const game = createGameSpace('tic_tac_toe');
      const space = createGameAgentSpace(game, 'minimax', 'random');
      agentSpaceRun(space, 50);
      const analysis = getMatchAnalysis(space);

      expect(typeof analysis.players[0].behavior).toBe('string');
      expect(typeof analysis.players[1].behavior).toBe('string');
    });

    it('手数合計が一致する', () => {
      const game = createGameSpace('tic_tac_toe');
      const space = createGameAgentSpace(game, 'minimax', 'minimax');
      agentSpaceRun(space, 50);
      const analysis = getMatchAnalysis(space);

      const totalPlayerMoves = analysis.players[0].moveCount + analysis.players[1].moveCount;
      expect(totalPlayerMoves).toBe(analysis.totalMoves);
    });

    it('戦術パターンカウントが含まれる', () => {
      const game = createGameSpace('tic_tac_toe');
      const space = createGameAgentSpace(game, 'minimax', 'random');
      agentSpaceRun(space, 50);
      const analysis = getMatchAnalysis(space);

      const p1 = analysis.players[0];
      expect(typeof p1.tacticalPatterns.threat).toBe('number');
      expect(typeof p1.tacticalPatterns.opportunity).toBe('number');
      expect(typeof p1.tacticalPatterns.center).toBe('number');
    });
  });

  describe('対局分析 — パイプ構文', () => {
    it('agent_analyze パイプ', () => {
      const result = ev('"tic_tac_toe" |> game |> agent_analyze("minimax", "minimax")');
      expect(result.reiType).toBe('MatchAnalysis');
      expect(result.totalMoves).toBeGreaterThan(0);
    });

    it('自律分析（日本語）パイプ', () => {
      const result = ev('"tic_tac_toe" |> game |> 自律分析("minimax", "random")');
      expect(result.reiType).toBe('MatchAnalysis');
    });

    it('agent_play |> analyze', () => {
      const result = ev('"tic_tac_toe" |> game |> agent_play("minimax", "random") |> analyze');
      expect(result).toBeDefined();
      expect(result.reiType).toBe('MatchAnalysis');
    });

    it('自律対戦 |> 分析（日本語）', () => {
      const result = ev('"tic_tac_toe" |> game |> 自律対戦("minimax", "random") |> 分析');
      expect(result.reiType).toBe('MatchAnalysis');
    });
  });

  describe('Behavior 分化', () => {
    it('minimax vs minimax は引分', () => {
      const result = ev('"tic_tac_toe" |> game |> agent_analyze("minimax", "minimax")');
      expect(result.winner).toBeNull();
    });

    it('reactive Agent が動作する', () => {
      const result = ev('"tic_tac_toe" |> game |> agent_analyze("reactive", "minimax")');
      expect(result.reiType).toBe('MatchAnalysis');
      expect(result.players[0].behavior).toBe('reactive');
      expect(result.totalMoves).toBeGreaterThan(0);
    });

    it('proactive Agent が動作する', () => {
      const result = ev('"tic_tac_toe" |> game |> agent_analyze("proactive", "random")');
      expect(result.players[0].behavior).toBe('proactive');
      expect(result.totalMoves).toBeGreaterThan(0);
    });

    it('contemplative Agent が動作する', () => {
      const result = ev('"tic_tac_toe" |> game |> agent_analyze("contemplative", "random")');
      expect(result.players[0].behavior).toBe('contemplative');
      expect(result.totalMoves).toBeGreaterThan(0);
    });

    it('異なる behavior の Agent 同士が対局できる', () => {
      const result = ev('"tic_tac_toe" |> game |> agent_analyze("reactive", "proactive")');
      expect(result.reiType).toBe('MatchAnalysis');
      expect(result.players[0].behavior).toBe('reactive');
      expect(result.players[1].behavior).toBe('proactive');
    });
  });

  describe('戦術パターン知覚', () => {
    it('戦術サマリーが文字列', () => {
      const result = ev('"tic_tac_toe" |> game |> agent_analyze("minimax", "random")');
      expect(typeof result.tacticalSummary).toBe('string');
      expect(result.tacticalSummary.length).toBeGreaterThan(0);
    });

    it('全パターン型が定義されている', () => {
      const result = ev('"tic_tac_toe" |> game |> agent_analyze("minimax", "random")');
      const patterns = result.players[0].tacticalPatterns;
      for (const key of ['threat', 'opportunity', 'fork', 'block', 'center', 'corner', 'none']) {
        expect(typeof patterns[key]).toBe('number');
      }
    });
  });

  describe('ニム対局分析', () => {
    it('ニムでも agent_analyze が動作する', () => {
      const result = ev('"nim" |> game |> agent_analyze("minimax", "random")');
      expect(result.reiType).toBe('MatchAnalysis');
      expect(result.totalMoves).toBeGreaterThan(0);
    });

    it('ニムでも behavior 別プレイが動作する', () => {
      const result = ev('"nim" |> game |> agent_analyze("reactive", "minimax")');
      expect(result.reiType).toBe('MatchAnalysis');
    });
  });
});
