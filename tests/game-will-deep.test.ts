/**
 * game-will-deep.test.ts
 * Phase 4d P2: ゲーム × will deep（意志駆動対局）統合テスト
 *
 * ゲームAgentが will_evolve で戦略を進化させ、
 * will_conflict/will_align で対立と調和を分析できることを検証
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { rei } from '../src/index';
import {
  createGameAgentSpace, agentSpaceRun,
  detectGameWillConflict, alignGameWills,
} from '../src/lang/agent-space';
import { createGameSpace } from '../src/lang/game';

// ═══════════════════════════════════════════
// Part 1: 意志サマリー
// ═══════════════════════════════════════════

describe('Game × Will Deep — 意志サマリー', () => {
  beforeEach(() => rei.reset());

  it('agent_play 結果に willSummary が含まれる', () => {
    const game = createGameSpace('tic_tac_toe');
    const space = createGameAgentSpace(game, 'minimax', 'minimax');
    const result = agentSpaceRun(space, 50);
    expect(result.reiType).toBe('AgentSpaceResult');
    expect(result.willSummary).toBeDefined();
    expect(result.willSummary!.players.length).toBe(2);
  });

  it('各プレイヤーの意志進化が記録される', () => {
    const game = createGameSpace('tic_tac_toe');
    const space = createGameAgentSpace(game, 'minimax', 'minimax');
    const result = agentSpaceRun(space, 50);
    const ws = result.willSummary!;
    for (const player of ws.players) {
      expect(player.player).toBeGreaterThanOrEqual(1);
      expect(player.initialTendency).toBeTruthy();
      expect(player.finalTendency).toBeTruthy();
      expect(player.totalEvolutions).toBeGreaterThan(0);
    }
  });

  it('意志履歴に各ラウンドの進化が記録される', () => {
    const game = createGameSpace('tic_tac_toe');
    const space = createGameAgentSpace(game, 'minimax', 'minimax');
    const result = agentSpaceRun(space, 50);
    const ws = result.willSummary!;
    expect(ws.willHistory.length).toBeGreaterThan(0);
    for (const entry of ws.willHistory) {
      expect(entry.round).toBeGreaterThan(0);
      expect(entry.player).toBeGreaterThanOrEqual(1);
      expect(entry.evolution.reiType).toBe('WillEvolution');
    }
  });

  it('competitive vs cooperative で異なる初期 tendency', () => {
    const game = createGameSpace('tic_tac_toe');
    const space = createGameAgentSpace(game, 'competitive', 'cooperative');
    const result = agentSpaceRun(space, 50);
    const ws = result.willSummary!;
    // competitive → expand, cooperative → harmonize
    expect(ws.players[0].initialTendency).toBe('expand');
    expect(ws.players[1].initialTendency).toBe('harmonize');
  });

  it('パイプ: will_summary / 意志要約', () => {
    rei.reset();
    const result = rei('"tic_tac_toe" |> game |> agent_play("minimax", "minimax") |> will_summary');
    expect(result).not.toBeNull();
    expect(result.players.length).toBe(2);
  });

  it('パイプ: will_history / 意志履歴', () => {
    rei.reset();
    const result = rei('"tic_tac_toe" |> game |> agent_play("minimax", "minimax") |> 意志履歴');
    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBeGreaterThan(0);
  });
});

// ═══════════════════════════════════════════
// Part 2: will_conflict（意志衝突）
// ═══════════════════════════════════════════

describe('Game × Will Deep — will_conflict（意志衝突）', () => {
  beforeEach(() => rei.reset());

  it('competitive vs cooperative で衝突が検出される', () => {
    const game = createGameSpace('tic_tac_toe');
    const space = createGameAgentSpace(game, 'competitive', 'cooperative');
    const result = agentSpaceRun(space, 50);
    const conflict = detectGameWillConflict(result);
    expect(conflict).not.toBeNull();
    expect(conflict!.reiType).toBe('WillConflict');
    expect(conflict!.refs).toEqual(['player_1', 'player_2']);
  });

  it('minimax vs minimax では低い tension', () => {
    const game = createGameSpace('tic_tac_toe');
    const space = createGameAgentSpace(game, 'minimax', 'minimax');
    const result = agentSpaceRun(space, 50);
    const conflict = detectGameWillConflict(result);
    expect(conflict).not.toBeNull();
    // 同じ戦略 → 同じ傾向 → 低い tension
    expect(conflict!.tension).toBeLessThanOrEqual(0.5);
  });

  it('パイプ: will_conflict / 意志衝突', () => {
    rei.reset();
    const result = rei('"tic_tac_toe" |> game |> agent_play("competitive", "cooperative") |> 意志衝突');
    expect(result).not.toBeNull();
    expect(result.reiType).toBe('WillConflict');
  });

  it('conflictAnalysis が willSummary 内にも含まれる', () => {
    const game = createGameSpace('tic_tac_toe');
    const space = createGameAgentSpace(game, 'competitive', 'cooperative');
    const result = agentSpaceRun(space, 50);
    expect(result.willSummary!.conflictAnalysis).not.toBeNull();
    expect(result.willSummary!.conflictAnalysis!.reiType).toBe('WillConflict');
  });
});

// ═══════════════════════════════════════════
// Part 3: will_align（意志調律）
// ═══════════════════════════════════════════

describe('Game × Will Deep — will_align（意志調律）', () => {
  beforeEach(() => rei.reset());

  it('API: alignGameWills が動く', () => {
    const game = createGameSpace('tic_tac_toe');
    const space = createGameAgentSpace(game, 'competitive', 'cooperative');
    const result = agentSpaceRun(space, 50);
    const alignment = alignGameWills(result);
    expect(alignment).not.toBeNull();
    expect(alignment!.reiType).toBe('WillAlignment');
    expect(alignment!.refs).toEqual(['player_1', 'player_2']);
  });

  it('パイプ: will_align / 意志調律', () => {
    rei.reset();
    const result = rei('"tic_tac_toe" |> game |> agent_play("minimax", "minimax") |> 意志調律');
    expect(result).not.toBeNull();
    expect(result.reiType).toBe('WillAlignment');
  });

  it('同じ戦略の調律は高い harmony', () => {
    const game = createGameSpace('tic_tac_toe');
    const space = createGameAgentSpace(game, 'minimax', 'minimax');
    const result = agentSpaceRun(space, 50);
    const alignment = alignGameWills(result);
    expect(alignment).not.toBeNull();
    expect(alignment!.harmony).toBeGreaterThanOrEqual(0.5);
  });
});

// ═══════════════════════════════════════════
// Part 4: パイプチェーン統合テスト
// ═══════════════════════════════════════════

describe('Game × Will Deep — パイプチェーン', () => {
  beforeEach(() => rei.reset());

  it('agent_play |> 分析 は引き続き動作する（後方互換）', () => {
    rei.reset();
    const result = rei('"tic_tac_toe" |> game |> agent_play("minimax", "minimax") |> 分析');
    expect(result).not.toBeNull();
    expect(result.reiType).toBe('MatchAnalysis');
  });

  it('agent_match |> 意志衝突 が動く', () => {
    rei.reset();
    const result = rei('"tic_tac_toe" |> game |> agent_match("competitive", "reactive") |> 意志衝突');
    expect(result).not.toBeNull();
    expect(result.reiType).toBe('WillConflict');
  });
});
