// ============================================================
// Rei v0.5 — AgentSpace Tests (Phase 4a)
// パズル統一理論 × ゲーム統一理論の Agent 基盤テスト
// ============================================================

import { describe, it, expect } from 'vitest';
import {
  createPuzzleAgentSpace,
  createGameAgentSpace,
  agentSpaceRunRound,
  agentSpaceRun,
  getAgentSpaceSigma,
  getAgentSpaceGrid,
  getAgentSpaceGameState,
  formatAgentSpacePuzzle,
  formatAgentSpaceGame,
} from '../src/lang/agent-space';
import { createSudokuSpace } from '../src/lang/puzzle';
import { createGameSpace } from '../src/lang/game';

// ─── ヘルパー ─────────────────────────

// 簡単な4×4数独（テスト用）
function easy4x4Grid(): number[][] {
  return [
    [1, 2, 0, 0],
    [0, 0, 1, 2],
    [2, 1, 0, 0],
    [0, 0, 2, 1],
  ];
}

// 標準9×9数独（簡単）
function easy9x9Grid(): number[][] {
  return [
    [5, 3, 0, 0, 7, 0, 0, 0, 0],
    [6, 0, 0, 1, 9, 5, 0, 0, 0],
    [0, 9, 8, 0, 0, 0, 0, 6, 0],
    [8, 0, 0, 0, 6, 0, 0, 0, 3],
    [4, 0, 0, 8, 0, 3, 0, 0, 1],
    [7, 0, 0, 0, 2, 0, 0, 0, 6],
    [0, 6, 0, 0, 0, 0, 2, 8, 0],
    [0, 0, 0, 4, 1, 9, 0, 0, 5],
    [0, 0, 0, 0, 8, 0, 0, 7, 9],
  ];
}

// ═══════════════════════════════════════════
// パズル AgentSpace テスト
// ═══════════════════════════════════════════

describe('AgentSpace — パズル基盤', () => {
  it('PuzzleSpace から AgentSpace を生成できる', () => {
    const puzzle = createSudokuSpace(easy4x4Grid());
    const space = createPuzzleAgentSpace(puzzle);

    expect(space.reiType).toBe('AgentSpace');
    expect(space.kind).toBe('puzzle');
    expect(space.agentIds.length).toBe(16); // 4×4
    expect(space.puzzleData).toBeDefined();
    expect(space.puzzleData!.size).toBe(4);
    expect(space.solved).toBe(false);
  });

  it('9×9数独から81 Agentを生成できる', () => {
    const puzzle = createSudokuSpace(easy9x9Grid());
    const space = createPuzzleAgentSpace(puzzle);

    expect(space.agentIds.length).toBe(81);
    expect(space.puzzleData!.constraints.length).toBeGreaterThan(0);
  });

  it('確定済みセルのAgentは初期値を持つ', () => {
    const puzzle = createSudokuSpace(easy4x4Grid());
    const space = createPuzzleAgentSpace(puzzle);

    const agent = space.registry.get('cell_0_0');
    expect(agent).toBeDefined();
    expect(agent!.value.value).toBe(1);
    expect(agent!.value.fixed).toBe(true);
  });

  it('未確定セルのAgentは候補を持つ', () => {
    const puzzle = createSudokuSpace(easy4x4Grid());
    const space = createPuzzleAgentSpace(puzzle);

    const agent = space.registry.get('cell_0_2');
    expect(agent).toBeDefined();
    expect(agent!.value.value).toBe(0);
    expect(agent!.value.candidates.length).toBeGreaterThan(0);
  });

  it('1ラウンド実行で候補が消去される', () => {
    const puzzle = createSudokuSpace(easy9x9Grid());
    const space = createPuzzleAgentSpace(puzzle);

    const round = agentSpaceRunRound(space);

    expect(round.round).toBe(1);
    expect(round.actions.length).toBe(81);
    // 9x9では何らかの消去または確定が発生するはず
    const nonNone = round.actions.filter(a => a.type !== 'none');
    expect(nonNone.length).toBeGreaterThan(0);
  });

  it('4×4数独がAgent基盤で解ける', () => {
    const puzzle = createSudokuSpace(easy4x4Grid());
    const space = createPuzzleAgentSpace(puzzle);

    const result = agentSpaceRun(space, 20);

    expect(result.solved).toBe(true);
    expect(result.grid).toBeDefined();

    // 全セルが埋まっている
    const grid = result.grid!;
    for (let r = 0; r < 4; r++) {
      for (let c = 0; c < 4; c++) {
        expect(grid[r][c]).toBeGreaterThan(0);
      }
    }
  });

  it('解のグリッドが有効な数独解である', () => {
    const puzzle = createSudokuSpace(easy4x4Grid());
    const space = createPuzzleAgentSpace(puzzle);
    const result = agentSpaceRun(space, 20);
    const grid = result.grid!;

    // 各行が1〜4を含む
    for (let r = 0; r < 4; r++) {
      const row = new Set(grid[r]);
      expect(row.size).toBe(4);
      for (let v = 1; v <= 4; v++) {
        expect(row.has(v)).toBe(true);
      }
    }

    // 各列が1〜4を含む
    for (let c = 0; c < 4; c++) {
      const col = new Set([grid[0][c], grid[1][c], grid[2][c], grid[3][c]]);
      expect(col.size).toBe(4);
    }
  });

  it('9×9数独がAgent基盤で解ける', () => {
    const puzzle = createSudokuSpace(easy9x9Grid());
    const space = createPuzzleAgentSpace(puzzle);

    const result = agentSpaceRun(space, 50);

    expect(result.solved).toBe(true);
    expect(result.totalRounds).toBeGreaterThan(0);
    expect(result.totalEliminations).toBeGreaterThan(0);
    expect(result.totalConfirmations).toBeGreaterThan(0);

    // 全81セルが埋まっている
    const grid = result.grid!;
    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) {
        expect(grid[r][c]).toBeGreaterThanOrEqual(1);
        expect(grid[r][c]).toBeLessThanOrEqual(9);
      }
    }
  });

  it('getAgentSpaceGrid で現在のグリッドを取得できる', () => {
    const puzzle = createSudokuSpace(easy4x4Grid());
    const space = createPuzzleAgentSpace(puzzle);

    const grid = getAgentSpaceGrid(space);
    expect(grid.length).toBe(4);
    expect(grid[0][0]).toBe(1);
    expect(grid[0][2]).toBe(0); // 未確定
  });

  it('formatAgentSpacePuzzle で盤面を文字列化できる', () => {
    const puzzle = createSudokuSpace(easy4x4Grid());
    const space = createPuzzleAgentSpace(puzzle);

    const formatted = formatAgentSpacePuzzle(space);
    expect(formatted).toContain('1');
    expect(formatted).toContain('·'); // 未確定セル
  });

  it('ラウンドごとに収束率が記録される', () => {
    const puzzle = createSudokuSpace(easy4x4Grid());
    const space = createPuzzleAgentSpace(puzzle);

    agentSpaceRunRound(space);
    agentSpaceRunRound(space);

    expect(space.convergenceHistory.length).toBe(2);
    // 2ラウンド目は1ラウンド目より収束率が高いはず
    expect(space.convergenceHistory[1]).toBeGreaterThanOrEqual(
      space.convergenceHistory[0]
    );
  });

  it('Agent の memory に消去履歴が蓄積される', () => {
    const puzzle = createSudokuSpace(easy4x4Grid());
    const space = createPuzzleAgentSpace(puzzle);

    agentSpaceRun(space, 20);

    // 未確定だったセルの Agent に記憶があるはず
    const agent = space.registry.get('cell_0_2');
    expect(agent).toBeDefined();
    expect(agent!.memory.length).toBeGreaterThan(0);
  });
});

// ═══════════════════════════════════════════
// ゲーム AgentSpace テスト
// ═══════════════════════════════════════════

describe('AgentSpace — ゲーム基盤', () => {
  it('GameSpace から AgentSpace を生成できる', () => {
    const game = createGameSpace('tic_tac_toe');
    const space = createGameAgentSpace(game);

    expect(space.reiType).toBe('AgentSpace');
    expect(space.kind).toBe('game');
    expect(space.agentIds.length).toBe(2);
    expect(space.gameData).toBeDefined();
    expect(space.gameData!.gameName).toBe('tic_tac_toe');
  });

  it('プレイヤー Agent が生成されている', () => {
    const game = createGameSpace('tic_tac_toe');
    const space = createGameAgentSpace(game);

    const p1 = space.registry.get('player_1');
    const p2 = space.registry.get('player_2');
    expect(p1).toBeDefined();
    expect(p2).toBeDefined();
    expect(p1!.value.player).toBe(1);
    expect(p2!.value.player).toBe(2);
  });

  it('1ラウンドで1手打てる', () => {
    const game = createGameSpace('tic_tac_toe');
    const space = createGameAgentSpace(game, 'minimax', 'minimax');

    const round = agentSpaceRunRound(space);

    expect(round.round).toBe(1);
    const moveActions = round.actions.filter(a => a.type === 'move');
    expect(moveActions.length).toBe(1);
    expect(moveActions[0].agentId).toBe('player_1');
  });

  it('三目並べが決着まで自動対局できる', () => {
    const game = createGameSpace('tic_tac_toe');
    const space = createGameAgentSpace(game, 'minimax', 'minimax');

    const result = agentSpaceRun(space, 20);

    expect(result.solved).toBe(true);
    expect(result.kind).toBe('game');
    // minimax vs minimax は引分になるはず
    expect(result.moveHistory).toBeDefined();
    expect(result.moveHistory!.length).toBeGreaterThanOrEqual(5);
  });

  it('minimax vs minimax で引分になる', () => {
    const game = createGameSpace('tic_tac_toe');
    const space = createGameAgentSpace(game, 'minimax', 'minimax');

    const result = agentSpaceRun(space, 20);

    expect(space.gameData!.state.status).toBe('draw');
    expect(result.winner).toBeNull();
  });

  it('minimax vs random で minimax が負けない', () => {
    const game = createGameSpace('tic_tac_toe');
    const space = createGameAgentSpace(game, 'minimax', 'random');

    const result = agentSpaceRun(space, 20);

    // minimax は少なくとも引分以上
    expect(result.winner === null || result.winner === 1).toBe(true);
  });

  it('異なる戦略を各プレイヤーに設定できる', () => {
    const game = createGameSpace('tic_tac_toe');
    const space = createGameAgentSpace(game, 'greedy', 'defensive');

    expect(space.gameData!.strategies).toEqual(['greedy', 'defensive']);
  });

  it('getAgentSpaceGameState でゲーム状態を取得できる', () => {
    const game = createGameSpace('tic_tac_toe');
    const space = createGameAgentSpace(game);

    agentSpaceRunRound(space);
    const state = getAgentSpaceGameState(space);

    expect(state).toBeDefined();
    expect(state!.turnCount).toBe(1);
    expect(state!.moveHistory.length).toBe(1);
  });

  it('formatAgentSpaceGame で盤面を文字列化できる', () => {
    const game = createGameSpace('tic_tac_toe');
    const space = createGameAgentSpace(game, 'minimax', 'minimax');

    agentSpaceRunRound(space);
    const formatted = formatAgentSpaceGame(space);
    expect(formatted.length).toBeGreaterThan(0);
  });

  it('ニムが Agent 対局で動作する', () => {
    const game = createGameSpace('nim');
    const space = createGameAgentSpace(game, 'minimax', 'random');

    const result = agentSpaceRun(space, 50);

    expect(result.solved).toBe(true);
    expect(result.moveHistory).toBeDefined();
    expect(result.moveHistory!.length).toBeGreaterThan(0);
  });

  it('Agent の memory に棋譜が蓄積される', () => {
    const game = createGameSpace('tic_tac_toe');
    const space = createGameAgentSpace(game, 'minimax', 'minimax');

    agentSpaceRun(space, 20);

    const p1 = space.registry.get('player_1');
    expect(p1).toBeDefined();
    expect(p1!.memory.length).toBeGreaterThan(0);

    // 着手記録が含まれる
    const actionMemories = p1!.memory.filter(m => m.type === 'action');
    expect(actionMemories.length).toBeGreaterThan(0);
  });
});

// ═══════════════════════════════════════════
// σ（メタデータ）テスト
// ═══════════════════════════════════════════

describe('AgentSpace — σ（メタデータ）', () => {
  it('パズルのσが正しい構造を持つ', () => {
    const puzzle = createSudokuSpace(easy4x4Grid());
    const space = createPuzzleAgentSpace(puzzle);
    agentSpaceRun(space, 20);

    const sigma = getAgentSpaceSigma(space);

    expect(sigma.reiType).toBe('AgentSpaceSigma');
    expect(sigma.kind).toBe('puzzle');
    expect(sigma.agentCount).toBe(16);
    expect(sigma.solved).toBe(true);
    expect(sigma.field.type).toBe('sudoku');
    expect(sigma.field.totalCells).toBe(16);
    expect(sigma.field.confirmedCells).toBe(16);
    expect(sigma.field.remainingCells).toBe(0);
    expect(sigma.flow.momentum).toBe('converged');
    expect(sigma.memory.totalActions).toBeGreaterThan(0);
  });

  it('ゲームのσが正しい構造を持つ', () => {
    const game = createGameSpace('tic_tac_toe');
    const space = createGameAgentSpace(game, 'minimax', 'minimax');
    agentSpaceRun(space, 20);

    const sigma = getAgentSpaceSigma(space);

    expect(sigma.reiType).toBe('AgentSpaceSigma');
    expect(sigma.kind).toBe('game');
    expect(sigma.agentCount).toBe(2);
    expect(sigma.solved).toBe(true);
    expect(sigma.field.game).toBe('tic_tac_toe');
    expect(sigma.field.status).toBe('draw');
    expect(sigma.field.strategies).toEqual(['minimax', 'minimax']);
    expect(sigma.convergenceHistory.length).toBeGreaterThan(0);
  });

  it('σの convergenceHistory がラウンドごとに記録される', () => {
    const puzzle = createSudokuSpace(easy4x4Grid());
    const space = createPuzzleAgentSpace(puzzle);
    agentSpaceRun(space, 20);

    const sigma = getAgentSpaceSigma(space);
    expect(sigma.convergenceHistory.length).toBe(space.rounds.length);
  });

  it('σの memory.roundHistory がラウンドごとのアクション数を記録する', () => {
    const puzzle = createSudokuSpace(easy9x9Grid());
    const space = createPuzzleAgentSpace(puzzle);
    agentSpaceRun(space, 50);

    const sigma = getAgentSpaceSigma(space);
    expect(sigma.memory.roundHistory.length).toBe(space.rounds.length);
    // 最初のラウンドは多くのアクションがあるはず
    expect(sigma.memory.roundHistory[0]).toBeGreaterThan(0);
  });
});

// ═══════════════════════════════════════════
// 統一性テスト（パズルとゲームの共通インターフェース）
// ═══════════════════════════════════════════

describe('AgentSpace — 統一性', () => {
  it('パズルもゲームも同じ agentSpaceRun で実行できる', () => {
    const puzzle = createSudokuSpace(easy4x4Grid());
    const puzzleSpace = createPuzzleAgentSpace(puzzle);
    const puzzleResult = agentSpaceRun(puzzleSpace, 20);

    const game = createGameSpace('tic_tac_toe');
    const gameSpace = createGameAgentSpace(game, 'minimax', 'minimax');
    const gameResult = agentSpaceRun(gameSpace, 20);

    // 両方とも同じ結果型
    expect(puzzleResult.reiType).toBe('AgentSpaceResult');
    expect(gameResult.reiType).toBe('AgentSpaceResult');

    // 両方とも解決
    expect(puzzleResult.solved).toBe(true);
    expect(gameResult.solved).toBe(true);

    // 種類は異なる
    expect(puzzleResult.kind).toBe('puzzle');
    expect(gameResult.kind).toBe('game');
  });

  it('パズルもゲームも同じ getAgentSpaceSigma でσ取得できる', () => {
    const puzzle = createSudokuSpace(easy4x4Grid());
    const puzzleSpace = createPuzzleAgentSpace(puzzle);
    agentSpaceRun(puzzleSpace, 20);

    const game = createGameSpace('tic_tac_toe');
    const gameSpace = createGameAgentSpace(game, 'minimax', 'minimax');
    agentSpaceRun(gameSpace, 20);

    const puzzleSigma = getAgentSpaceSigma(puzzleSpace);
    const gameSigma = getAgentSpaceSigma(gameSpace);

    // 共通フィールド
    expect(puzzleSigma.reiType).toBe('AgentSpaceSigma');
    expect(gameSigma.reiType).toBe('AgentSpaceSigma');
    expect(puzzleSigma.solved).toBe(true);
    expect(gameSigma.solved).toBe(true);
    expect(typeof puzzleSigma.totalRounds).toBe('number');
    expect(typeof gameSigma.totalRounds).toBe('number');
  });

  it('agentSpaceRunRound を段階的に実行できる', () => {
    const puzzle = createSudokuSpace(easy4x4Grid());
    const space = createPuzzleAgentSpace(puzzle);

    // 1ラウンドずつ手動実行
    const r1 = agentSpaceRunRound(space);
    expect(r1.round).toBe(1);

    const r2 = agentSpaceRunRound(space);
    expect(r2.round).toBe(2);

    expect(space.rounds.length).toBe(2);
  });
});
