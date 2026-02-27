/**
 * phase4d-integration.test.ts
 * Phase 4d P3/P4/P5: Entity Agent σ深化 + Mediator × will + 横断テスト
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { rei } from '../src/index';
import { createSudokuSpace } from '../src/lang/puzzle';
import { createGameSpace } from '../src/lang/game';
import {
  createPuzzleAgentSpace, createGameAgentSpace,
  agentSpaceRun, agentSpaceRunRound,
  traceAgentRelations, computeAgentInfluence,
  detectGameWillConflict, alignGameWills,
} from '../src/lang/agent-space';

function easy4x4(): number[][] {
  return [
    [1, 0, 0, 0],
    [0, 0, 0, 1],
    [0, 1, 0, 0],
    [0, 0, 1, 0],
  ];
}

// ═══════════════════════════════════════════
// P3: Entity Agent σ の深化
// ═══════════════════════════════════════════

describe('P3: Entity Agent σ deep', () => {
  it('パズルAgent の sigma() に deep relation 情報が含まれる', () => {
    const puzzle = createSudokuSpace(easy4x4());
    const space = createPuzzleAgentSpace(puzzle);
    const agent = space.registry.get('cell_0_0');
    expect(agent).toBeDefined();
    const sigma = agent!.sigma();
    expect(sigma.relation.constraintCount).toBeGreaterThan(0);
    expect(sigma.relation.isolated).toBe(false);
    expect(sigma.will.tendency).toBe('cooperate');
  });

  it('ゲームAgent の sigma() に deep will 情報が含まれる', () => {
    const game = createGameSpace('tic_tac_toe');
    const space = createGameAgentSpace(game, 'competitive', 'cooperative');
    const p1 = space.registry.get('player_1');
    const p2 = space.registry.get('player_2');
    expect(p1).toBeDefined();
    expect(p2).toBeDefined();
    const s1 = p1!.sigma();
    const s2 = p2!.sigma();
    expect(s1.will.tendency).toBe('expand');
    expect(s2.will.tendency).toBe('harmonize');
  });

  it('ゲーム対局後、Agent の sigma が最新の will を反映', () => {
    const game = createGameSpace('tic_tac_toe');
    const space = createGameAgentSpace(game, 'competitive', 'cooperative');
    agentSpaceRun(space, 50);
    const p1 = space.registry.get('player_1');
    const sigma = p1!.sigma();
    // 対局後は will が進化しているはず
    expect(sigma.will.tendency).toBeTruthy();
    expect(sigma.will.strength).toBeGreaterThanOrEqual(0);
  });
});

// ═══════════════════════════════════════════
// P4: Agent deepMeta の動的更新
// ═══════════════════════════════════════════

describe('P4: Agent deepMeta 動的更新', () => {
  it('毎ラウンドでゲームAgentの will が更新される', () => {
    const game = createGameSpace('tic_tac_toe');
    const space = createGameAgentSpace(game, 'minimax', 'random');

    // 1ラウンド実行
    agentSpaceRunRound(space);
    const p1After1 = space.registry.get('player_1')!.sigma();
    expect(p1After1.will.lastReason).toBeTruthy();

    // もう1ラウンド
    if (!space.solved) {
      agentSpaceRunRound(space);
    }

    // 意志履歴が蓄積されている
    expect(space.gameData!.willHistory.length).toBeGreaterThanOrEqual(1);
  });

  it('パズルAgentのrelation deepMetaが初期化時に正しく設定される', () => {
    const puzzle = createSudokuSpace(easy4x4());
    const space = createPuzzleAgentSpace(puzzle);

    // 全セルにdeepMetaが設定されている
    for (const agentId of space.agentIds) {
      const agent = space.registry.get(agentId);
      expect(agent).toBeDefined();
      expect(agent!.deepMeta).not.toBeNull();
      expect(agent!.deepMeta!.relation).toBeDefined();
    }
  });
});

// ═══════════════════════════════════════════
// P5: 横断テスト — 6属性の一貫性
// ═══════════════════════════════════════════

describe('P5: 横断テスト — パズルの相互依存的解法', () => {
  it('数独の全プロセス: 解法 → 関係サマリー → 特定セルの追跡 → 影響度', () => {
    const puzzle = createSudokuSpace(easy4x4());
    const space = createPuzzleAgentSpace(puzzle);
    const result = agentSpaceRun(space, 100);

    // 解けている
    expect(result.solved).toBe(true);

    // 関係サマリーがある
    expect(result.relationSummary).toBeDefined();
    expect(result.relationSummary!.totalBindings).toBeGreaterThan(0);

    // 特定セルの追跡ができる
    const trace = traceAgentRelations(result, 'cell_0_0')!;
    expect(trace.totalRefs).toBeGreaterThan(1);

    // 同じ行のセル間の影響度が正
    const inf = computeAgentInfluence(result, 'cell_0_0', 'cell_0_3')!;
    expect(inf.score).toBeGreaterThan(0);
    expect(inf.directlyBound).toBe(true);

    // 推論追跡も使える（後方互換）
    expect(result.reasoningTrace).toBeDefined();
    expect(result.difficulty).toBeDefined();
  });
});

describe('P5: 横断テスト — 意志駆動対局', () => {
  it('ゲームの全プロセス: 対局 → 意志サマリー → 衝突検出 → 調律', () => {
    const game = createGameSpace('tic_tac_toe');
    const space = createGameAgentSpace(game, 'competitive', 'cooperative');
    const result = agentSpaceRun(space, 50);

    // 対局完了
    expect(result.solved).toBe(true);

    // 意志サマリーがある
    expect(result.willSummary).toBeDefined();
    expect(result.willSummary!.players.length).toBe(2);
    expect(result.willSummary!.willHistory.length).toBeGreaterThan(0);

    // 衝突検出ができる
    const conflict = detectGameWillConflict(result);
    expect(conflict).not.toBeNull();
    expect(conflict!.reiType).toBe('WillConflict');

    // 調律ができる
    const alignment = alignGameWills(result);
    expect(alignment).not.toBeNull();
    expect(alignment!.reiType).toBe('WillAlignment');

    // 対局分析も使える（後方互換）
    expect(result.matchAnalysis).toBeDefined();
  });
});

describe('P5: 横断テスト — パイプチェーン', () => {
  beforeEach(() => rei.reset());

  it('パズル: agent_solve → relations → 全フローが動く', () => {
    rei.reset();
    const rels = rei('30 |> generate_sudoku(42) |> agent_solve |> relations');
    expect(rels.totalBindings).toBeGreaterThan(0);
  });

  it('ゲーム: agent_play → will_conflict → 全フローが動く', () => {
    rei.reset();
    const conflict = rei('"tic_tac_toe" |> game |> agent_play("competitive", "cooperative") |> will_conflict');
    expect(conflict.reiType).toBe('WillConflict');
  });

  it('既存のパイプチェーンが壊れていない（パズル）', () => {
    rei.reset();
    const solved = rei('30 |> generate_sudoku(42) |> agent_solve |> solved');
    expect(solved).toBe(true);
  });

  it('既存のパイプチェーンが壊れていない（ゲーム）', () => {
    rei.reset();
    const analysis = rei('"tic_tac_toe" |> game |> agent_match("minimax", "minimax") |> 分析');
    expect(analysis.reiType).toBe('MatchAnalysis');
  });

  it('既存のrelation/willコマンドが壊れていない（変数束縛版）', () => {
    rei.reset();
    rei('let mut a = 𝕄{5; 1, 2, 3}');
    rei('let mut b = 𝕄{10; 4, 5, 6}');
    rei('a |> bind("b", "mirror")');
    const trace = rei('a |> trace');
    expect(trace.reiType).toBe('TraceResult');
  });
});
