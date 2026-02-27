// ============================================================
// Rei v0.5 — AgentSpace Evaluator Integration Tests (Phase 4a)
// パイプコマンド agent_solve / 自律解法 etc. のテスト
// ============================================================

import { describe, it, expect, beforeEach } from 'vitest';
import { rei } from '../src/index';

beforeEach(() => { rei.reset(); });

describe('AgentSpace — Evaluator統合（パズル）', () => {
  it('generate_sudoku |> agent_solve でAgent基盤解法が動く', () => {
    const result = rei('30 |> generate_sudoku(42) |> agent_solve');

    expect(result.reiType).toBe('AgentSpaceResult');
    expect(result.kind).toBe('puzzle');
    expect(result.solved).toBe(true);
    expect(result.grid).toBeDefined();
    expect(result.totalRounds).toBeGreaterThan(0);
  });

  it('generate_sudoku |> 自律解法 で日本語パイプが動く', () => {
    const result = rei('30 |> 数独生成(42) |> 自律解法');
    expect(result.solved).toBe(true);
  });

  it('agent_solve |> grid でグリッドを取得できる', () => {
    const result = rei('30 |> generate_sudoku(42) |> agent_solve |> grid');

    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBe(9);
    for (const row of result) {
      for (const val of row) {
        expect(val).toBeGreaterThanOrEqual(1);
        expect(val).toBeLessThanOrEqual(9);
      }
    }
  });

  it('sudoku |> as_agent_space でAgentSpaceを取得できる', () => {
    const result = rei('30 |> generate_sudoku(42) |> as_agent_space');

    expect(result.reiType).toBe('AgentSpace');
    expect(result.kind).toBe('puzzle');
    expect(result.agentIds.length).toBe(81);
  });

  it('agent_solve |> rounds でラウンド数を取得', () => {
    const result = rei('30 |> generate_sudoku(42) |> agent_solve |> rounds');
    expect(typeof result).toBe('number');
    expect(result).toBeGreaterThan(0);
  });
});

describe('AgentSpace — Evaluator統合（ゲーム）', () => {
  it('game |> agent_play でAgent対局が動く', () => {
    const result = rei('"tic_tac_toe" |> game |> agent_play("minimax", "minimax")');

    expect(result.reiType).toBe('AgentSpaceResult');
    expect(result.kind).toBe('game');
    expect(result.solved).toBe(true);
    expect(result.winner).toBeNull();
  });

  it('game |> 自律対戦 で日本語パイプが動く', () => {
    const result = rei('"tic_tac_toe" |> game |> 自律対戦("minimax", "minimax")');
    expect(result.solved).toBe(true);
  });

  it('game |> agent_turn で1手だけ打てる', () => {
    const result = rei('"tic_tac_toe" |> game |> agent_turn("minimax", "minimax")');

    expect(result.reiType).toBe('AgentSpaceResult');
    expect(result.moveHistory).toBeDefined();
    expect(result.moveHistory.length).toBe(1);
  });

  it('game(nim) |> agent_match でニム対局が動く', () => {
    const result = rei('"nim" |> game |> agent_match("minimax", "random")');

    expect(result.solved).toBe(true);
    expect(result.moveHistory.length).toBeGreaterThan(0);
  });

  it('game |> as_agent_space でAgentSpaceを取得', () => {
    const result = rei('"tic_tac_toe" |> game |> as_agent_space');

    expect(result.reiType).toBe('AgentSpace');
    expect(result.kind).toBe('game');
    expect(result.agentIds.length).toBe(2);
  });

  it('agent_play |> 棋譜 で対局履歴を取得', () => {
    const result = rei('"tic_tac_toe" |> game |> agent_play("minimax", "minimax") |> 棋譜');

    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBeGreaterThanOrEqual(5);
  });
});
