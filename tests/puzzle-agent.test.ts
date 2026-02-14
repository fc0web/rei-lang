/**
 * Phase 4b テスト: パズル推論深化
 * - Hidden Single / Pointing Pair 検出
 * - 推論層追跡 (ReasoningTrace)
 * - 難易度分析 (DifficultyAnalysis)
 */
import { describe, it, expect } from 'vitest';
import { rei } from '../src/index';
import { createSudokuSpace } from '../src/lang/puzzle';
import {
  createPuzzleAgentSpace, agentSpaceRun,
  getDifficultyAnalysis, getReasoningTrace,
} from '../src/lang/agent-space';

function ev(code: string): any {
  return rei(code);
}

function easy4x4(): number[][] {
  return [
    [1, 2, 0, 0],
    [3, 4, 0, 0],
    [2, 0, 4, 0],
    [0, 3, 0, 2],
  ];
}

function easy9x9(): number[][] {
  return [
    [5,3,0,0,7,0,0,0,0],
    [6,0,0,1,9,5,0,0,0],
    [0,9,8,0,0,0,0,6,0],
    [8,0,0,0,6,0,0,0,3],
    [4,0,0,8,0,3,0,0,1],
    [7,0,0,0,2,0,0,0,6],
    [0,6,0,0,0,0,2,8,0],
    [0,0,0,4,1,9,0,0,5],
    [0,0,0,0,8,0,0,7,9],
  ];
}

describe('Phase 4b: パズル推論深化', () => {

  describe('難易度分析 (DifficultyAnalysis)', () => {
    it('4×4数独の難易度が判定できる', () => {
      const puzzle = createSudokuSpace(easy4x4());
      const space = createPuzzleAgentSpace(puzzle);
      agentSpaceRun(space, 100);
      const diff = getDifficultyAnalysis(space);
      expect(diff.reiType).toBe('DifficultyAnalysis');
      expect(['easy', 'medium', 'hard', 'expert']).toContain(diff.level);
      expect(diff.score).toBeGreaterThanOrEqual(0);
      expect(diff.score).toBeLessThanOrEqual(100);
    });

    it('layerCounts が全推論層を含む', () => {
      const puzzle = createSudokuSpace(easy4x4());
      const space = createPuzzleAgentSpace(puzzle);
      agentSpaceRun(space, 100);
      const diff = getDifficultyAnalysis(space);
      expect('layer1_elimination' in diff.layerCounts).toBe(true);
      expect('layer2_naked_pair' in diff.layerCounts).toBe(true);
      expect('layer2_hidden_single' in diff.layerCounts).toBe(true);
      expect('layer2_pointing_pair' in diff.layerCounts).toBe(true);
      expect('layer3_backtrack' in diff.layerCounts).toBe(true);
    });

    it('layersUsed が配列である', () => {
      const puzzle = createSudokuSpace(easy4x4());
      const space = createPuzzleAgentSpace(puzzle);
      agentSpaceRun(space, 100);
      const diff = getDifficultyAnalysis(space);
      expect(Array.isArray(diff.layersUsed)).toBe(true);
    });

    it('9×9数独の難易度分析ができる', () => {
      const puzzle = createSudokuSpace(easy9x9());
      const space = createPuzzleAgentSpace(puzzle);
      agentSpaceRun(space, 100);
      const diff = getDifficultyAnalysis(space);
      expect(diff.reiType).toBe('DifficultyAnalysis');
      expect(diff.totalSteps).toBeGreaterThan(0);
    });

    it('easy パズルは backtrack なし', () => {
      const puzzle = createSudokuSpace(easy4x4());
      const space = createPuzzleAgentSpace(puzzle);
      agentSpaceRun(space, 100);
      const diff = getDifficultyAnalysis(space);
      expect(diff.level).toBe('easy');
      expect(diff.backtrackCount).toBe(0);
    });

    it('難易度スコアは 0-100 の範囲', () => {
      const puzzle = createSudokuSpace(easy9x9());
      const space = createPuzzleAgentSpace(puzzle);
      agentSpaceRun(space, 100);
      const diff = getDifficultyAnalysis(space);
      expect(diff.score).toBeGreaterThanOrEqual(0);
      expect(diff.score).toBeLessThanOrEqual(100);
    });
  });

  describe('推論追跡 (ReasoningTrace)', () => {
    it('推論追跡が取得できる', () => {
      const puzzle = createSudokuSpace(easy4x4());
      const space = createPuzzleAgentSpace(puzzle);
      agentSpaceRun(space, 100);
      const trace = getReasoningTrace(space);
      expect(Array.isArray(trace)).toBe(true);
    });

    it('追跡エントリが必須フィールドを持つ', () => {
      const puzzle = createSudokuSpace(easy9x9());
      const space = createPuzzleAgentSpace(puzzle);
      agentSpaceRun(space, 100);
      const trace = getReasoningTrace(space);
      expect(trace.length).toBeGreaterThan(0);
      const entry = trace[0];
      expect(typeof entry.round).toBe('number');
      expect(typeof entry.layer).toBe('string');
      expect(Array.isArray(entry.cell)).toBe(true);
      expect(entry.cell.length).toBe(2);
      expect(typeof entry.detail).toBe('string');
    });

    it('layer1_elimination が記録される', () => {
      const puzzle = createSudokuSpace(easy9x9());
      const space = createPuzzleAgentSpace(puzzle);
      agentSpaceRun(space, 100);
      const trace = getReasoningTrace(space);
      const layer1 = trace.filter(e => e.layer === 'layer1_elimination');
      expect(layer1.length).toBeGreaterThan(0);
    });
  });

  describe('パイプ構文', () => {
    it('agent_solve |> difficulty', () => {
      const result = ev('30 |> generate_sudoku(42) |> agent_solve |> difficulty');
      expect(result).toBeDefined();
      expect(result.reiType).toBe('DifficultyAnalysis');
    });

    it('agent_solve |> trace', () => {
      const result = ev('30 |> generate_sudoku(42) |> agent_solve |> trace');
      expect(Array.isArray(result)).toBe(true);
    });

    it('自律解法 |> 難易度（日本語）', () => {
      const diff = ev('30 |> 数独生成(42) |> 自律解法 |> 難易度');
      expect(diff.reiType).toBe('DifficultyAnalysis');
    });

    it('自律解法 |> 追跡（日本語）', () => {
      const trace = ev('30 |> 数独生成(42) |> 自律解法 |> 追跡');
      expect(Array.isArray(trace)).toBe(true);
    });

    it('agent_difficulty パイプ', () => {
      const diff = ev('30 |> generate_sudoku(42) |> agent_difficulty');
      expect(diff.reiType).toBe('DifficultyAnalysis');
    });

    it('agent_trace パイプ', () => {
      const trace = ev('30 |> generate_sudoku(42) |> agent_trace');
      expect(Array.isArray(trace)).toBe(true);
    });

    it('自律難易度パイプ', () => {
      const diff = ev('30 |> 数独生成(42) |> 自律難易度');
      expect(diff.reiType).toBe('DifficultyAnalysis');
    });

    it('自律追跡パイプ', () => {
      const trace = ev('30 |> 数独生成(42) |> 自律追跡');
      expect(Array.isArray(trace)).toBe(true);
    });
  });

  describe('Hidden Single 検出', () => {
    it('Hidden Single 経由でも解が正しい', () => {
      const puzzle = createSudokuSpace(easy9x9());
      const space = createPuzzleAgentSpace(puzzle);
      const result = agentSpaceRun(space, 100);
      expect(result.solved).toBe(true);
    });

    it('解のグリッドが有効', () => {
      const puzzle = createSudokuSpace(easy9x9());
      const space = createPuzzleAgentSpace(puzzle);
      const result = agentSpaceRun(space, 100);
      expect(result.grid).toBeDefined();
      for (const row of result.grid!) {
        for (const v of row) {
          expect(v).toBeGreaterThan(0);
          expect(v).toBeLessThanOrEqual(9);
        }
      }
    });
  });
});
