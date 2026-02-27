/**
 * puzzle-relation-deep.test.ts
 * Phase 4d P1: パズル × relation deep（相互依存追跡）統合テスト
 *
 * 数独の制約グループが entanglement として表現され、
 * trace / influence でセル間の因果関係を追跡できることを検証
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { rei } from '../src/index';
import { createSudokuSpace } from '../src/lang/puzzle';
import {
  createPuzzleAgentSpace, agentSpaceRun,
  traceAgentRelations, computeAgentInfluence, cellRefToAgentId,
} from '../src/lang/agent-space';

// 4x4 テスト用パズル
function easy4x4(): number[][] {
  return [
    [1, 0, 0, 0],
    [0, 0, 0, 1],
    [0, 1, 0, 0],
    [0, 0, 1, 0],
  ];
}

// ═══════════════════════════════════════════
// Part 1: パズルAgent の関係サマリー
// ═══════════════════════════════════════════

describe('Puzzle × Relation Deep — 関係サマリー', () => {
  beforeEach(() => rei.reset());

  it('4x4 数独の agent_solve 結果に relationSummary が含まれる', () => {
    const puzzle = createSudokuSpace(easy4x4());
    const space = createPuzzleAgentSpace(puzzle);
    const result = agentSpaceRun(space, 100);
    expect(result.reiType).toBe('AgentSpaceResult');
    expect(result.relationSummary).toBeDefined();
    expect(result.relationSummary!.totalBindings).toBeGreaterThan(0);
  });

  it('制約タイプ別の結合数が正しい', () => {
    const puzzle = createSudokuSpace(easy4x4());
    const space = createPuzzleAgentSpace(puzzle);
    const result = agentSpaceRun(space, 100);
    const rel = result.relationSummary!;
    // 4x4 数独: 4行 + 4列 + 4ブロック の制約
    expect(rel.constraintBindings.row).toBeGreaterThan(0);
    expect(rel.constraintBindings.column).toBeGreaterThan(0);
    expect(rel.constraintBindings.block).toBeGreaterThan(0);
  });

  it('各セルが複数の制約で結合されている (avgBindingsPerAgent > 0)', () => {
    const puzzle = createSudokuSpace(easy4x4());
    const space = createPuzzleAgentSpace(puzzle);
    const result = agentSpaceRun(space, 100);
    const rel = result.relationSummary!;
    expect(rel.avgBindingsPerAgent).toBeGreaterThan(0);
  });

  it('最多接続と最少接続のAgentが記録される', () => {
    const puzzle = createSudokuSpace(easy4x4());
    const space = createPuzzleAgentSpace(puzzle);
    const result = agentSpaceRun(space, 100);
    const rel = result.relationSummary!;
    expect(rel.mostConnectedAgent).not.toBeNull();
    expect(rel.leastConnectedAgent).not.toBeNull();
    expect(rel.mostConnectedAgent!.bindingCount).toBeGreaterThanOrEqual(
      rel.leastConnectedAgent!.bindingCount
    );
  });

  it('パイプ: relations / 関係 で直接取得', () => {
    rei.reset();
    const result = rei('30 |> generate_sudoku(42) |> agent_solve |> relations');
    expect(result).not.toBeNull();
    expect(result.totalBindings).toBeGreaterThan(0);
  });

  it('日本語パイプ: 関係', () => {
    rei.reset();
    const result = rei('30 |> generate_sudoku(42) |> agent_solve |> 関係');
    expect(result).not.toBeNull();
    expect(result.totalBindings).toBeGreaterThan(0);
  });
});

// ═══════════════════════════════════════════
// Part 2: relation_trace（関係追跡）
// ═══════════════════════════════════════════

describe('Puzzle × Relation Deep — trace（関係追跡）', () => {
  beforeEach(() => rei.reset());

  it('特定セルからの関係追跡 (API)', () => {
    const puzzle = createSudokuSpace(easy4x4());
    const space = createPuzzleAgentSpace(puzzle);
    const result = agentSpaceRun(space, 100);
    const trace = traceAgentRelations(result, 'cell_0_0');
    expect(trace).not.toBeNull();
    expect(trace!.reiType).toBe('TraceResult');
    expect(trace!.root).toBe('cell_0_0');
    expect(trace!.totalRefs).toBeGreaterThan(1);
  });

  it('パイプ: relation_trace', () => {
    rei.reset();
    const result = rei('30 |> generate_sudoku(42) |> agent_solve |> relation_trace("cell_0_0")');
    expect(result).not.toBeNull();
    expect(result.reiType).toBe('TraceResult');
    expect(result.root).toBe('cell_0_0');
  });

  it('R1C1形式のセル参照が動く', () => {
    rei.reset();
    const result = rei('30 |> generate_sudoku(42) |> agent_solve |> relation_trace("R1C1")');
    expect(result).not.toBeNull();
    expect(result.root).toBe('cell_0_0');
  });

  it('日本語: 関係追跡', () => {
    rei.reset();
    const result = rei('30 |> generate_sudoku(42) |> agent_solve |> 関係追跡("R1C1")');
    expect(result).not.toBeNull();
    expect(result.reiType).toBe('TraceResult');
  });

  it('trace に引数を渡すと関係追跡になる', () => {
    rei.reset();
    const result = rei('30 |> generate_sudoku(42) |> agent_solve |> trace("cell_0_0")');
    expect(result).not.toBeNull();
    expect(result.reiType).toBe('TraceResult');
    expect(result.root).toBe('cell_0_0');
  });

  it('trace 引数なしは推論追跡（後方互換）', () => {
    rei.reset();
    const result = rei('30 |> generate_sudoku(42) |> agent_solve |> trace');
    // 引数なしは推論追跡（配列）
    expect(Array.isArray(result)).toBe(true);
  });

  it('同じ行/列のセルが追跡チェーンに含まれる', () => {
    const puzzle = createSudokuSpace(easy4x4());
    const space = createPuzzleAgentSpace(puzzle);
    const result = agentSpaceRun(space, 100);
    const trace = traceAgentRelations(result, 'cell_0_0')!;
    // cell_0_0 は行0と列0とブロック(0,0)に属する
    const refs = trace.nodes.map(n => n.ref);
    expect(refs).toContain('cell_0_0');
    // 同じ行のセルが含まれるはず
    const hasRowNeighbor = refs.some(r =>
      r === 'cell_0_1' || r === 'cell_0_2' || r === 'cell_0_3'
    );
    expect(hasRowNeighbor).toBe(true);
  });

  it('深度制限が効く', () => {
    const puzzle = createSudokuSpace(easy4x4());
    const space = createPuzzleAgentSpace(puzzle);
    const result = agentSpaceRun(space, 100);
    const trace = traceAgentRelations(result, 'cell_0_0', 1)!;
    expect(trace.maxDepth).toBeLessThanOrEqual(1);
  });

  it('cellRefToAgentId 変換ヘルパーが正しく動く', () => {
    expect(cellRefToAgentId('R1C1')).toBe('cell_0_0');
    expect(cellRefToAgentId('R3C4')).toBe('cell_2_3');
    expect(cellRefToAgentId('0,0')).toBe('cell_0_0');
    expect(cellRefToAgentId('cell_2_3')).toBe('cell_2_3');
  });
});

// ═══════════════════════════════════════════
// Part 3: influence（影響度）
// ═══════════════════════════════════════════

describe('Puzzle × Relation Deep — influence（影響度）', () => {
  beforeEach(() => rei.reset());

  it('同じ行の2セル間の影響度が正 (API)', () => {
    const puzzle = createSudokuSpace(easy4x4());
    const space = createPuzzleAgentSpace(puzzle);
    const result = agentSpaceRun(space, 100);
    const inf = computeAgentInfluence(result, 'cell_0_0', 'cell_0_3')!;
    expect(inf.reiType).toBe('InfluenceResult');
    expect(inf.score).toBeGreaterThan(0);
    expect(inf.directlyBound).toBe(true);
  });

  it('パイプ: influence', () => {
    rei.reset();
    const result = rei('30 |> generate_sudoku(42) |> agent_solve |> influence("cell_0_0", "cell_0_8")');
    expect(result).not.toBeNull();
    expect(result.reiType).toBe('InfluenceResult');
    expect(result.score).toBeGreaterThan(0);
  });

  it('R1C1形式のセル参照が動く', () => {
    rei.reset();
    const result = rei('30 |> generate_sudoku(42) |> agent_solve |> influence("R1C1", "R1C9")');
    expect(result).not.toBeNull();
    expect(result.from).toBe('cell_0_0');
    expect(result.to).toBe('cell_0_8');
    expect(result.score).toBeGreaterThan(0);
  });

  it('日本語: 影響', () => {
    rei.reset();
    const result = rei('30 |> generate_sudoku(42) |> agent_solve |> 影響("R1C1", "R1C9")');
    expect(result).not.toBeNull();
    expect(result.score).toBeGreaterThan(0);
  });

  it('同一セルへの影響度は1', () => {
    const puzzle = createSudokuSpace(easy4x4());
    const space = createPuzzleAgentSpace(puzzle);
    const result = agentSpaceRun(space, 100);
    const inf = computeAgentInfluence(result, 'cell_0_0', 'cell_0_0')!;
    expect(inf.score).toBe(1);
  });

  it('間接経路の影響度が計算される', () => {
    const puzzle = createSudokuSpace(easy4x4());
    const space = createPuzzleAgentSpace(puzzle);
    const result = agentSpaceRun(space, 100);
    // cell_0_0 と cell_3_3: 直接の制約グループを共有しないが間接経路あり
    const inf = computeAgentInfluence(result, 'cell_0_0', 'cell_3_3')!;
    expect(inf.score).toBeGreaterThanOrEqual(0);
    if (inf.score > 0) {
      expect(inf.hops).toBeGreaterThan(0);
      expect(inf.path.length).toBeGreaterThan(2);
    }
  });
});
