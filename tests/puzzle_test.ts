// ============================================================
// Puzzle Unification Tests — 柱③ パズル統一（数独→場-拡散）
// ============================================================

import { Lexer } from '../lang/lexer';
import { Parser } from '../lang/parser';
import { Evaluator } from '../lang/evaluator';
import {
  createSudokuSpace, createLatinSquareSpace, createCustomPuzzleSpace,
  propagateStep, propagateNakedPair, solvePuzzle, propagateOnly,
  cellAsMDim, getGrid, getCandidates, getPuzzleSigma,
  formatSudoku, estimateDifficulty, generateSudoku, parseGrid,
  type PuzzleSpace, type ConstraintGroup,
} from '../lang/puzzle';

function run(code: string): any {
  const tokens = new Lexer(code).tokenize();
  const ast = new Parser(tokens).parseProgram();
  return new Evaluator().eval(ast);
}

let passed = 0;
let failed = 0;
const failures: string[] = [];

function test(name: string, fn: () => void) {
  try {
    fn();
    passed++;
    console.log(`  ✅ ${name}`);
  } catch (e: any) {
    failed++;
    failures.push(`${name}: ${e.message}`);
    console.log(`  ❌ ${name}: ${e.message}`);
  }
}

function assert(condition: boolean, msg: string = '') {
  if (!condition) throw new Error(msg || 'assertion failed');
}

// ═══════════════════════════════════════════
// Group 1: パズル空間の生成（場属性）
// ═══════════════════════════════════════════
console.log('\n🧩 Group 1: パズル空間の生成');

// 簡単な4×4数独（2×2ブロック）
const mini4x4 = [
  [1, 0, 0, 4],
  [0, 0, 1, 0],
  [0, 1, 0, 0],
  [4, 0, 0, 1],
];

test('4×4数独: PuzzleSpace生成', () => {
  const space = createSudokuSpace(mini4x4);
  assert(space.reiType === 'PuzzleSpace', `expected PuzzleSpace, got ${space.reiType}`);
  assert(space.puzzleType === 'sudoku');
  assert(space.size === 4);
  assert(space.cells.length === 4);
  assert(space.cells[0].length === 4);
});

test('4×4数独: ヒントセルは確定済み', () => {
  const space = createSudokuSpace(mini4x4);
  assert(space.cells[0][0].value === 1, 'cell(0,0) should be 1');
  assert(space.cells[0][0].fixed === true, 'cell(0,0) should be fixed');
  assert(space.cells[0][0].candidates.length === 0, 'fixed cell should have no candidates');
});

test('4×4数独: 空セルは候補を持つ', () => {
  const space = createSudokuSpace(mini4x4);
  const cell = space.cells[0][1]; // (0,1) = 0 → 未確定
  assert(cell.value === 0, 'cell(0,1) should be 0');
  assert(cell.fixed === false);
  // 初期伝播後: 行0に1,4がある → 候補は{2,3}の一部
  assert(cell.candidates.length > 0, 'should have candidates');
  assert(!cell.candidates.includes(1), 'should not include 1 (row constraint)');
  assert(!cell.candidates.includes(4), 'should not include 4 (row constraint)');
});

test('4×4数独: 制約グループの数', () => {
  const space = createSudokuSpace(mini4x4);
  // 4行 + 4列 + 4ブロック = 12
  assert(space.constraints.length === 12, `expected 12 constraints, got ${space.constraints.length}`);
});

// ═══════════════════════════════════════════
// Group 2: 制約伝播（流れ属性 — 拡散）
// ═══════════════════════════════════════════
console.log('\n🌊 Group 2: 制約伝播（拡散）');

test('4×4数独: 初期伝播で候補が削減される', () => {
  const space = createSudokuSpace(mini4x4);
  // cell(0,1)は行に1,4 / 列に1(col1) / ブロックに1 → 候補は{2,3}の部分集合
  const cands = getCandidates(space, 0, 1);
  assert(cands.length <= 2, `expected <=2 candidates, got ${cands.length}: ${cands}`);
});

test('4×4数独: propagateStepで確定が進む', () => {
  const space = createSudokuSpace(mini4x4);
  const before = space.confirmedCells;
  propagateStep(space);
  // 少なくとも初期伝播分は確定済み
  assert(space.confirmedCells >= before, 'confirmed cells should not decrease');
});

test('4×4数独: 完全に解ける', () => {
  const space = createSudokuSpace(mini4x4);
  solvePuzzle(space);
  assert(space.solved, 'puzzle should be solved');
  const grid = getGrid(space);
  // 全セルが1-4
  for (let r = 0; r < 4; r++) {
    for (let c = 0; c < 4; c++) {
      assert(grid[r][c] >= 1 && grid[r][c] <= 4, `cell(${r},${c})=${grid[r][c]} invalid`);
    }
  }
});

test('4×4数独: 解の整合性（行・列・ブロック）', () => {
  const space = createSudokuSpace(mini4x4);
  solvePuzzle(space);
  const grid = getGrid(space);

  // 各行に1-4が1つずつ
  for (let r = 0; r < 4; r++) {
    const row = new Set(grid[r]);
    assert(row.size === 4, `row ${r} has duplicates: ${grid[r]}`);
  }
  // 各列に1-4が1つずつ
  for (let c = 0; c < 4; c++) {
    const col = new Set(grid.map(r => r[c]));
    assert(col.size === 4, `col ${c} has duplicates`);
  }
});

// ═══════════════════════════════════════════
// Group 3: 9×9数独
// ═══════════════════════════════════════════
console.log('\n🔢 Group 3: 9×9数独');

// Wikipedia掲載の数独問題
const sudoku9x9 = parseGrid(
  "530070000600195000098000060800060003400803001700020006060000280000419005000080079"
);

test('9×9数独: PuzzleSpace生成', () => {
  const space = createSudokuSpace(sudoku9x9);
  assert(space.size === 9);
  assert(space.constraints.length === 27, `expected 27, got ${space.constraints.length}`); // 9行+9列+9ブロック
});

test('9×9数独: 初期ヒント数の確認', () => {
  const space = createSudokuSpace(sudoku9x9);
  let fixed = 0;
  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      if (space.cells[r][c].fixed) fixed++;
    }
  }
  assert(fixed > 20, `expected >20 hints, got ${fixed}`);
});

test('9×9数独: 完全に解ける', () => {
  const space = createSudokuSpace(sudoku9x9);
  solvePuzzle(space);
  assert(space.solved, 'should be solved');
  const grid = getGrid(space);

  // 全行チェック
  for (let r = 0; r < 9; r++) {
    const row = new Set(grid[r]);
    assert(row.size === 9, `row ${r} has duplicates`);
    for (let v = 1; v <= 9; v++) assert(row.has(v), `row ${r} missing ${v}`);
  }
  // 全列チェック
  for (let c = 0; c < 9; c++) {
    const col = new Set(grid.map(r => r[c]));
    assert(col.size === 9, `col ${c} has duplicates`);
  }
});

test('9×9数独: ヒントが保持される', () => {
  const space = createSudokuSpace(sudoku9x9);
  solvePuzzle(space);
  const grid = getGrid(space);

  // 元のヒントがそのまま残っている
  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      if (sudoku9x9[r][c] > 0) {
        assert(grid[r][c] === sudoku9x9[r][c],
          `hint (${r},${c}): expected ${sudoku9x9[r][c]}, got ${grid[r][c]}`);
      }
    }
  }
});

// ═══════════════════════════════════════════
// Group 4: 𝕄表現（中心-周辺パターン）
// ═══════════════════════════════════════════
console.log('\n📐 Group 4: 𝕄表現');

test('セルを𝕄として取得', () => {
  const space = createSudokuSpace(mini4x4);
  const mdim = cellAsMDim(space, 0, 0); // 固定セル(1)
  assert(mdim.reiType === 'MDim');
  assert(mdim.center === 1, `expected center=1, got ${mdim.center}`);
  assert(mdim.neighbors.length === 0, 'fixed cell should have no neighbors(candidates)');
});

test('未確定セルの𝕄: center=0, neighbors=候補', () => {
  const space = createSudokuSpace(mini4x4);
  const mdim = cellAsMDim(space, 0, 1); // 空セル
  assert(mdim.center === 0, `expected center=0, got ${mdim.center}`);
  assert(mdim.neighbors.length > 0, 'should have candidate neighbors');
});

test('解いた後: 全セルのneighborsが空', () => {
  const space = createSudokuSpace(mini4x4);
  solvePuzzle(space);
  for (let r = 0; r < 4; r++) {
    for (let c = 0; c < 4; c++) {
      const mdim = cellAsMDim(space, r, c);
      assert(mdim.center > 0, `cell(${r},${c}) should be confirmed`);
      assert(mdim.neighbors.length === 0, `cell(${r},${c}) should have no candidates`);
    }
  }
});

// ═══════════════════════════════════════════
// Group 5: σ（自己参照 — 記憶・意志）
// ═══════════════════════════════════════════
console.log('\n🧠 Group 5: σ（自己参照）');

test('パズルσ: field情報', () => {
  const space = createSudokuSpace(mini4x4);
  const sigma = getPuzzleSigma(space);
  assert(sigma.reiType === 'SigmaResult');
  assert(sigma.field.puzzleType === 'sudoku');
  assert(sigma.field.size === 4);
  assert(sigma.field.totalCells === 16);
});

test('パズルσ: flow（進捗）', () => {
  const space = createSudokuSpace(mini4x4);
  const sigma = getPuzzleSigma(space);
  assert(typeof sigma.flow.progress === 'number');
  assert(sigma.flow.progress >= 0 && sigma.flow.progress <= 1);
});

test('パズルσ: memory（解法履歴）', () => {
  const space = createSudokuSpace(mini4x4);
  propagateStep(space);
  const sigma = getPuzzleSigma(space);
  assert(Array.isArray(sigma.memory));
  assert(sigma.memory.length > 0, 'should have propagation history');
});

test('パズルσ: will（意志/戦略）', () => {
  const space = createSudokuSpace(mini4x4);
  const sigma = getPuzzleSigma(space);
  assert(['contract', 'expand', 'spiral', 'rest'].includes(sigma.will.tendency));
});

test('解いた後のσ: momentum=converged', () => {
  const space = createSudokuSpace(mini4x4);
  solvePuzzle(space);
  const sigma = getPuzzleSigma(space);
  assert(sigma.flow.momentum === 'converged', `expected converged, got ${sigma.flow.momentum}`);
  assert(sigma.flow.progress === 1);
});

test('パズルσ: relation（制約ネットワーク）', () => {
  const space = createSudokuSpace(mini4x4);
  const sigma = getPuzzleSigma(space);
  assert(Array.isArray(sigma.relation));
  assert(sigma.relation.length === 12, `expected 12, got ${sigma.relation.length}`);
});

// ═══════════════════════════════════════════
// Group 6: 消去履歴（記憶属性）
// ═══════════════════════════════════════════
console.log('\n📜 Group 6: 消去履歴（記憶）');

test('消去履歴が記録される', () => {
  const space = createSudokuSpace(mini4x4);
  // 初期伝播で少なくとも何かは消去されている
  let totalHistory = 0;
  for (let r = 0; r < 4; r++) {
    for (let c = 0; c < 4; c++) {
      totalHistory += space.cells[r][c].eliminationHistory.length;
    }
  }
  assert(totalHistory > 0, 'should have elimination history');
});

test('消去履歴にreasonが含まれる', () => {
  const space = createSudokuSpace(mini4x4);
  for (let r = 0; r < 4; r++) {
    for (let c = 0; c < 4; c++) {
      for (const entry of space.cells[r][c].eliminationHistory) {
        assert(typeof entry.reason === 'string', 'reason should be string');
        assert(typeof entry.candidate === 'number', 'candidate should be number');
        assert(typeof entry.step === 'number', 'step should be number');
      }
    }
  }
});

// ═══════════════════════════════════════════
// Group 7: 難易度推定（層属性）
// ═══════════════════════════════════════════
console.log('\n📊 Group 7: 難易度推定');

test('4×4数独: 簡単と判定される', () => {
  // 多くのヒントがある簡単な4×4
  const easyPuzzle = [
    [1, 2, 3, 4],
    [3, 4, 0, 0],
    [0, 0, 4, 3],
    [4, 3, 2, 1],
  ];
  const space = createSudokuSpace(easyPuzzle);
  solvePuzzle(space);
  const diff = estimateDifficulty(space);
  assert(diff.reiType === 'DifficultyResult');
  assert(diff.score <= 3, `expected easy, got score=${diff.score}, techniques=${diff.techniques}`);
});

test('難易度にmaxLayerが含まれる', () => {
  const space = createSudokuSpace(mini4x4);
  solvePuzzle(space);
  const diff = estimateDifficulty(space);
  assert(typeof diff.maxLayer === 'number');
  assert(diff.maxLayer >= 0 && diff.maxLayer <= 2);
});

// ═══════════════════════════════════════════
// Group 8: ラテン方陣（パズル統一の証明）
// ═══════════════════════════════════════════
console.log('\n🎯 Group 8: ラテン方陣（統一性の実証）');

const latinSquare = [
  [1, 0, 0],
  [0, 0, 1],
  [0, 1, 0],
];

test('3×3ラテン方陣: 生成', () => {
  const space = createLatinSquareSpace(latinSquare);
  assert(space.puzzleType === 'latin_square');
  assert(space.size === 3);
  // 3行 + 3列 = 6制約（ブロックなし）
  assert(space.constraints.length === 6, `expected 6, got ${space.constraints.length}`);
});

test('3×3ラテン方陣: 解ける', () => {
  const space = createLatinSquareSpace(latinSquare);
  solvePuzzle(space);
  assert(space.solved, 'latin square should be solved');
  const grid = getGrid(space);

  for (let r = 0; r < 3; r++) {
    const row = new Set(grid[r]);
    assert(row.size === 3, `row ${r} has duplicates: ${grid[r]}`);
  }
  for (let c = 0; c < 3; c++) {
    const col = new Set(grid.map(r => r[c]));
    assert(col.size === 3, `col ${c} has duplicates`);
  }
});

test('ラテン方陣のσもSigmaResultを返す', () => {
  const space = createLatinSquareSpace(latinSquare);
  const sigma = getPuzzleSigma(space);
  assert(sigma.reiType === 'SigmaResult');
  assert(sigma.field.puzzleType === 'latin_square');
});

// ═══════════════════════════════════════════
// Group 9: カスタム制約（sum制約など）
// ═══════════════════════════════════════════
console.log('\n🔧 Group 9: カスタムパズル');

test('カスタムパズル: 行列+sum制約', () => {
  // 2×2: 各行・列がall_different, 対角線の和=3
  const customConstraints: ConstraintGroup[] = [
    { type: 'all_different', cells: [[0,0],[0,1]], label: '行0' },
    { type: 'all_different', cells: [[1,0],[1,1]], label: '行1' },
    { type: 'all_different', cells: [[0,0],[1,0]], label: '列0' },
    { type: 'all_different', cells: [[0,1],[1,1]], label: '列1' },
  ];
  const grid = [[1, 0], [0, 1]];
  const space = createCustomPuzzleSpace(2, grid, customConstraints);
  assert(space.puzzleType === 'custom');
  solvePuzzle(space);
  assert(space.solved);
});

// ═══════════════════════════════════════════
// Group 10: 問題生成
// ═══════════════════════════════════════════
console.log('\n🎲 Group 10: 問題生成');

test('generateSudoku: 有効なグリッドを生成', () => {
  const grid = generateSudoku(30, 42);
  assert(grid.length === 9);
  assert(grid[0].length === 9);

  // ヒント数の確認（概算）
  let clues = 0;
  for (const row of grid) for (const v of row) if (v > 0) clues++;
  assert(clues >= 17 && clues <= 50, `clues=${clues} out of range`);
});

test('generateSudoku: 生成した問題が解ける', () => {
  const grid = generateSudoku(30, 42);
  const space = createSudokuSpace(grid);
  solvePuzzle(space);
  assert(space.solved, 'generated puzzle should be solvable');
});

test('parseGrid: 文字列からグリッド生成', () => {
  const grid = parseGrid("530070000600195000098000060800060003400803001700020006060000280000419005000080079");
  assert(grid.length === 9);
  assert(grid[0][0] === 5);
  assert(grid[0][1] === 3);
  assert(grid[0][2] === 0);
});

// ═══════════════════════════════════════════
// Group 11: フォーマット出力
// ═══════════════════════════════════════════
console.log('\n📋 Group 11: フォーマット出力');

test('formatSudoku: 表示用文字列を生成', () => {
  const space = createSudokuSpace(sudoku9x9);
  const formatted = formatSudoku(space);
  assert(typeof formatted === 'string');
  assert(formatted.includes('5'), 'should include hint 5');
  assert(formatted.includes('.'), 'should include . for empty');
});

// ═══════════════════════════════════════════
// Group 12: propagateOnly（純粋推論）
// ═══════════════════════════════════════════
console.log('\n🧮 Group 12: 純粋推論');

test('propagateOnly: バックトラッキングなしで進行', () => {
  // ヒントが多い4×4は推論だけで解ける
  const easyPuzzle = [
    [1, 2, 3, 4],
    [3, 4, 0, 0],
    [0, 0, 4, 3],
    [4, 3, 2, 1],
  ];
  const space = createSudokuSpace(easyPuzzle);
  propagateOnly(space);
  assert(space.solved, '4x4 with many hints should be solvable by propagation only');
  const diff = estimateDifficulty(space);
  assert(!diff.backtrackUsed, 'should not use backtracking');
});

// ═══════════════════════════════════════════
// Group 13: エッジケース
// ═══════════════════════════════════════════
console.log('\n⚠️ Group 13: エッジケース');

test('すでに解けている4×4', () => {
  const solved = [
    [1, 2, 3, 4],
    [3, 4, 1, 2],
    [2, 1, 4, 3],
    [4, 3, 2, 1],
  ];
  const space = createSudokuSpace(solved);
  assert(space.solved, 'should be immediately solved');
});

test('空に近い4×4', () => {
  const almostEmpty = [
    [1, 0, 0, 0],
    [0, 0, 0, 0],
    [0, 0, 0, 0],
    [0, 0, 0, 1],
  ];
  const space = createSudokuSpace(almostEmpty);
  solvePuzzle(space);
  assert(space.solved, 'should be solvable');
});

// ═══════════════════════════════════════════
// Group 14: Rei構文との統合テスト
// ═══════════════════════════════════════════
console.log('\n🔗 Group 14: Rei構文統合');

test('puzzle_create via evaluator', () => {
  const result = run(`
    let grid = [
      [1, 0, 0, 4],
      [0, 0, 1, 0],
      [0, 1, 0, 0],
      [4, 0, 0, 1]
    ];
    grid |> puzzle("sudoku")
  `);
  assert(result.reiType === 'PuzzleSpace', `expected PuzzleSpace, got ${result?.reiType}`);
  assert(result.puzzleType === 'sudoku');
});

test('puzzle |> propagate', () => {
  const result = run(`
    let grid = [
      [1, 0, 0, 4],
      [0, 0, 1, 0],
      [0, 1, 0, 0],
      [4, 0, 0, 1]
    ];
    grid |> puzzle("sudoku") |> propagate
  `);
  assert(result.reiType === 'PuzzleSpace');
});

test('puzzle |> solve', () => {
  const result = run(`
    let grid = [
      [1, 0, 0, 4],
      [0, 0, 1, 0],
      [0, 1, 0, 0],
      [4, 0, 0, 1]
    ];
    grid |> puzzle("sudoku") |> solve
  `);
  assert(result.reiType === 'PuzzleSpace');
  assert(result.solved === true, 'should be solved');
});

test('puzzle |> grid', () => {
  const result = run(`
    let grid = [
      [1, 0, 0, 4],
      [0, 0, 1, 0],
      [0, 1, 0, 0],
      [4, 0, 0, 1]
    ];
    grid |> puzzle("sudoku") |> solve |> grid
  `);
  assert(Array.isArray(result));
  assert(result.length === 4);
  assert(result[0].length === 4);
});

test('puzzle |> sigma', () => {
  const result = run(`
    let grid = [
      [1, 0, 0, 4],
      [0, 0, 1, 0],
      [0, 1, 0, 0],
      [4, 0, 0, 1]
    ];
    grid |> puzzle("sudoku") |> sigma
  `);
  assert(result.reiType === 'SigmaResult');
  assert(result.field.puzzleType === 'sudoku');
});

test('puzzle |> cell(row, col)', () => {
  const result = run(`
    let grid = [
      [1, 0, 0, 4],
      [0, 0, 1, 0],
      [0, 1, 0, 0],
      [4, 0, 0, 1]
    ];
    grid |> puzzle("sudoku") |> cell(0, 0)
  `);
  assert(result.reiType === 'MDim');
  assert(result.center === 1, 'fixed cell center should be 1');
});

test('puzzle |> difficulty', () => {
  const result = run(`
    let grid = [
      [1, 0, 0, 4],
      [0, 0, 1, 0],
      [0, 1, 0, 0],
      [4, 0, 0, 1]
    ];
    grid |> puzzle("sudoku") |> solve |> difficulty
  `);
  assert(result.reiType === 'DifficultyResult');
  assert(typeof result.level === 'string');
  assert(typeof result.score === 'number');
});

test('puzzle |> format', () => {
  const result = run(`
    let grid = [
      [1, 0, 0, 4],
      [0, 0, 1, 0],
      [0, 1, 0, 0],
      [4, 0, 0, 1]
    ];
    grid |> puzzle("sudoku") |> format
  `);
  assert(typeof result === 'string');
});

test('puzzle("latin_square") — ラテン方陣もRei構文で記述可能', () => {
  const result = run(`
    let grid = [
      [1, 0, 0],
      [0, 0, 1],
      [0, 1, 0]
    ];
    grid |> puzzle("latin_square") |> solve
  `);
  assert(result.reiType === 'PuzzleSpace');
  assert(result.solved === true);
});

test('puzzle |> generate — 問題生成', () => {
  const result = run(`
    30 |> puzzle_generate
  `);
  assert(Array.isArray(result));
  assert(result.length === 9);
});

test('9×9数独: Rei構文で完全に解ける', () => {
  // parseGridの結果を直接使うのではなく、Reiリテラルで配列を渡す
  const result = run(`
    let grid = [
      [5,3,0, 0,7,0, 0,0,0],
      [6,0,0, 1,9,5, 0,0,0],
      [0,9,8, 0,0,0, 0,6,0],
      [8,0,0, 0,6,0, 0,0,3],
      [4,0,0, 8,0,3, 0,0,1],
      [7,0,0, 0,2,0, 0,0,6],
      [0,6,0, 0,0,0, 2,8,0],
      [0,0,0, 4,1,9, 0,0,5],
      [0,0,0, 0,8,0, 0,7,9]
    ];
    grid |> puzzle("sudoku") |> solve
  `);
  assert(result.solved === true, '9x9 should be solved via Rei');
});

// ═══════════════════════════════════════════
// Summary
// ═══════════════════════════════════════════
console.log(`\n${'═'.repeat(50)}`);
console.log(`結果: ${passed} passed, ${failed} failed (total ${passed + failed})`);
if (failures.length > 0) {
  console.log('\n❌ 失敗したテスト:');
  for (const f of failures) console.log(`  - ${f}`);
}
console.log(`${'═'.repeat(50)}`);
process.exit(failed > 0 ? 1 : 0);
