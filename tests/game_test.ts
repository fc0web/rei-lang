// ============================================================
// Rei v0.3 — Game & Randomness テスト (柱⑤)
// 55テスト: ランダムネス + ゲームエンジン + Rei構文統合
// ============================================================

import {
  createGameSpace, playMove, autoPlay, selectBestMove,
  gameAsMDim, getGameSigma, formatGame, getLegalMoves, simulateGames,
  randomFromMDim, randomUniform, randomWeighted, randomWalk,
  monteCarloSample, analyzeEntropy, seedRandom,
  type GameSpace, type RandomResult,
} from '../lang/game';

import { Lexer } from '../lang/lexer';
import { Parser } from '../lang/parser';
import { Evaluator } from '../lang/evaluator';

function rei(code: string): any {
  const lexer = new Lexer(code);
  const tokens = lexer.tokenize();
  const parser = new Parser(tokens);
  const ast = parser.parseProgram();
  const evaluator = new Evaluator();
  return evaluator.eval(ast);
}

let passed = 0, failed = 0, totalTests = 0;
function group(name: string) { console.log(`\n═══ ${name} ═══`); }
function test(name: string, fn: () => void) {
  totalTests++;
  try { fn(); passed++; console.log(`  ✅ ${name}`); }
  catch (e: any) { failed++; console.log(`  ❌ ${name}\n     ${e.message}`); }
}
function assert(cond: boolean, msg = '') { if (!cond) throw new Error(`Assertion failed${msg ? ': ' + msg : ''}`); }
function assertEq(a: any, b: any, msg = '') { if (a !== b) throw new Error(`${msg ? msg + ': ' : ''}expected ${JSON.stringify(b)}, got ${JSON.stringify(a)}`); }

// ═══════════════════════════════════════════
// Part A: Pure Randomness
// ═══════════════════════════════════════════

group("1. ランダム基本");

test("randomUniform — 配列からランダム選択", () => {
  seedRandom(42);
  const r = randomUniform([10, 20, 30]);
  assertEq(r.reiType, 'RandomResult');
  assert([10, 20, 30].includes(r.value), `value: ${r.value}`);
  assert(Math.abs(r.probability - 1/3) < 0.01, 'probability ≈ 1/3');
  assert(r.entropy > 0, 'positive entropy');
});

test("randomWeighted — 重み付き選択", () => {
  seedRandom(123);
  const r = randomWeighted(['a', 'b', 'c'], [10, 1, 1]);
  assertEq(r.reiType, 'RandomResult');
  assert(['a', 'b', 'c'].includes(r.value), `value: ${r.value}`);
  assertEq(r.source, 'weighted');
});

test("randomFromMDim — 𝕄のneighborsから選択", () => {
  seedRandom(99);
  const md = { reiType: 'MDim', center: 5, neighbors: [1, 2, 3, 4] };
  const r = randomFromMDim(md);
  assert([1, 2, 3, 4].includes(r.value), `value: ${r.value}`);
});

test("randomFromMDim — 空のneighbors", () => {
  const md = { reiType: 'MDim', center: 42, neighbors: [] };
  const r = randomFromMDim(md);
  assertEq(r.value, 42);
  assertEq(r.probability, 1);
});

test("seedRandom — 同じシードで再現可能", () => {
  seedRandom(777);
  const r1 = randomUniform([1,2,3,4,5]);
  seedRandom(777);
  const r2 = randomUniform([1,2,3,4,5]);
  assertEq(r1.value, r2.value);
});

group("2. エントロピー分析");

test("analyzeEntropy — 均一分布", () => {
  const e = analyzeEntropy([1, 2, 3, 4, 1, 2, 3, 4]);
  assertEq(e.reiType, 'EntropyAnalysis');
  assert(e.shannon > 0, 'positive entropy');
  assert(Math.abs(e.relativeEntropy - 1.0) < 0.01, `relative ≈ 1.0, got ${e.relativeEntropy}`);
});

test("analyzeEntropy — 偏った分布", () => {
  const e = analyzeEntropy([1, 1, 1, 1, 1, 1, 1, 2]);
  assert(e.relativeEntropy < 0.8, `relative should be < 0.8, got ${e.relativeEntropy}`);
});

test("analyzeEntropy — 単一値（エントロピー0）", () => {
  const e = analyzeEntropy([5, 5, 5, 5]);
  assertEq(e.shannon, 0);
});

test("analyzeEntropy — distribution返却", () => {
  const e = analyzeEntropy([1, 1, 2, 2, 3]);
  assert(e.distribution.length === 3, 'has 3 unique values');
  assert(e.distribution[0].probability >= e.distribution[1].probability, 'sorted by probability');
});

group("3. ランダムウォーク & モンテカルロ");

test("randomWalk — 指定ステップ数", () => {
  const walk = randomWalk(0, 10);
  assertEq(walk.length, 11); // start + 10 steps
  assertEq(walk[0], 0);
});

test("randomWalk — カスタムステップサイズ", () => {
  seedRandom(42);
  const walk = randomWalk(100, 5, 10);
  assertEq(walk.length, 6);
  assertEq(walk[0], 100);
  // 各ステップは±10
  for (let i = 1; i < walk.length; i++) {
    assert(Math.abs(walk[i] - walk[i-1]) === 10, `step size = 10`);
  }
});

test("monteCarloSample — N回サンプリング", () => {
  const md = { reiType: 'MDim', center: 0, neighbors: [1, 2, 3] };
  const mc = monteCarloSample(md, 50);
  assertEq(mc.samples.length, 50);
  assert(mc.entropy.reiType === 'EntropyAnalysis', 'has entropy');
  assert(mc.entropy.shannon > 0, 'positive entropy');
});

// ═══════════════════════════════════════════
// Part B: Game Unification
// ═══════════════════════════════════════════

group("4. ゲームスペース作成");

test("三目並べ作成", () => {
  const g = createGameSpace('tic_tac_toe');
  assertEq(g.reiType, 'GameSpace');
  assertEq(g.rules.name, 'tic_tac_toe');
  assertEq(g.state.board.length, 9);
  assert(g.state.board.every((c: any) => c === 0), 'empty board');
  assertEq(g.state.currentPlayer, 1);
  assertEq(g.state.status, 'playing');
});

test("ニム作成", () => {
  const g = createGameSpace('nim');
  assertEq(g.rules.name, 'nim');
  assertEq(g.state.board[0], 10); // デフォルト10石
});

test("ニム — カスタム石数", () => {
  const g = createGameSpace('nim', { stones: 15 });
  assertEq(g.state.board[0], 15);
});

test("じゃんけん作成", () => {
  const g = createGameSpace('rock_paper_scissors');
  assertEq(g.rules.name, 'rock_paper_scissors');
});

test("コインフリップ作成", () => {
  const g = createGameSpace('coin_flip');
  assertEq(g.rules.name, 'coin_flip');
});

test("日本語名で作成", () => {
  const g1 = createGameSpace('三目並べ');
  assertEq(g1.rules.name, 'tic_tac_toe');
  const g2 = createGameSpace('ニム');
  assertEq(g2.rules.name, 'nim');
  const g3 = createGameSpace('じゃんけん');
  assertEq(g3.rules.name, 'rock_paper_scissors');
});

group("5. 三目並べ — ゲームプレイ");

test("合法手 — 初期盤面は9手", () => {
  const g = createGameSpace('tic_tac_toe');
  const moves = getLegalMoves(g);
  assertEq(moves.length, 9);
});

test("playMove — 手動で1手打つ", () => {
  const g = createGameSpace('tic_tac_toe');
  const g2 = playMove(g, 4); // 中央に打つ
  assertEq(g2.state.board[4], 1); // Player 1のマーク
  assertEq(g2.state.currentPlayer, 2); // 手番交代
  assertEq(g2.state.turnCount, 1);
});

test("playMove — 自動（minimax最善手）", () => {
  const g = createGameSpace('tic_tac_toe');
  const g2 = playMove(g); // AIが打つ
  assert(g2.state.turnCount === 1, 'moved');
  assert(g2.state.board.some((c: any) => c !== 0), 'board changed');
});

test("autoPlay — 完全自動対局", () => {
  const g = createGameSpace('tic_tac_toe');
  const result = autoPlay(g, 'minimax', 'minimax');
  assert(result.state.status !== 'playing', `status: ${result.state.status}`);
  // 双方最適なら引き分け
  assertEq(result.state.status, 'draw');
});

test("autoPlay — minimax vs random", () => {
  seedRandom(42);
  const g = createGameSpace('tic_tac_toe');
  const result = autoPlay(g, 'minimax', 'random');
  assert(result.state.status !== 'playing', 'game ended');
  // minimaxはrandomに対して負けない
  assert(result.state.winner !== 2, 'minimax should not lose');
});

group("6. ニム — ゲームプレイ");

test("ニム合法手 — 1〜3", () => {
  const g = createGameSpace('nim');
  const moves = getLegalMoves(g);
  assert(moves.length <= 3, 'max 3 moves');
  assert(moves.includes(1), 'can take 1');
});

test("ニム — 手動プレイ", () => {
  const g = createGameSpace('nim');
  const g2 = playMove(g, 2); // 2個取る
  assertEq(g2.state.board[0], 8); // 10 - 2 = 8
  assertEq(g2.state.currentPlayer, 2);
});

test("ニム — 完全自動", () => {
  const g = createGameSpace('nim');
  const result = autoPlay(g);
  assert(result.state.status === 'win', 'someone wins');
  assert(result.state.winner !== null, 'has winner');
});

group("7. 戦略の多様性");

test("random戦略", () => {
  seedRandom(42);
  const g = createGameSpace('tic_tac_toe');
  g.strategy = 'random';
  const best = selectBestMove(g);
  assert(best.move >= 0 && best.move < 9, 'valid move');
  assertEq(best.searchNodes, 1); // randomは1ノードだけ
});

test("greedy戦略", () => {
  const g = createGameSpace('tic_tac_toe');
  g.strategy = 'greedy';
  const best = selectBestMove(g);
  assert(best.move >= 0, 'valid move');
});

test("minimax戦略 — 探索ノード数", () => {
  const g = createGameSpace('tic_tac_toe');
  g.strategy = 'minimax';
  const best = selectBestMove(g);
  assert(best.searchNodes > 1, `searched ${best.searchNodes} nodes`);
});

group("8. 統一性の証明");

test("全ゲームがGameSpaceで表現可能", () => {
  const games = ['tic_tac_toe', 'nim', 'coin_flip', 'rock_paper_scissors'];
  for (const name of games) {
    const g = createGameSpace(name);
    assertEq(g.reiType, 'GameSpace');
    assert(g.rules.getLegalMoves !== undefined, `${name} has getLegalMoves`);
    assert(g.rules.applyMove !== undefined, `${name} has applyMove`);
    assert(g.rules.checkWin !== undefined, `${name} has checkWin`);
    assert(g.rules.formatBoard !== undefined, `${name} has formatBoard`);
  }
});

test("全ゲームが同じplay/autoPlayで動く", () => {
  seedRandom(42);
  const games = ['tic_tac_toe', 'nim', 'rock_paper_scissors'];
  for (const name of games) {
    const g = createGameSpace(name);
    const result = autoPlay(g, 'random', 'random');
    assert(result.state.status !== 'playing', `${name} completed`);
  }
});

test("全ゲームを𝕄として表現可能", () => {
  const games = ['tic_tac_toe', 'nim', 'coin_flip'];
  for (const name of games) {
    const g = createGameSpace(name);
    const md = gameAsMDim(g);
    assertEq(md.reiType, 'MDim');
    assert(md.neighbors.length > 0, `${name} has neighbors (legal moves)`);
  }
});

group("9. σ自己参照");

test("getGameSigma — 6属性", () => {
  const g = createGameSpace('tic_tac_toe');
  const sigma = getGameSigma(g);
  assertEq(sigma.reiType, 'SigmaResult');
  assert(sigma.field !== undefined, 'has field');
  assert(sigma.flow !== undefined, 'has flow');
  assert(sigma.memory !== undefined, 'has memory');
  assert(typeof sigma.layer === 'number', 'has layer');
  assert(sigma.relation !== undefined, 'has relation');
  assert(sigma.will !== undefined, 'has will');
});

test("σ — 対局中の状態を反映", () => {
  const g = createGameSpace('tic_tac_toe');
  const g2 = playMove(g, 4);
  const sigma = getGameSigma(g2);
  assertEq(sigma.field.turnCount, 1);
  assertEq(sigma.flow.currentPlayer, 2);
  assert(sigma.memory.length === 1, 'has 1 move in memory');
});

test("formatGame — 文字列出力", () => {
  const g = createGameSpace('tic_tac_toe');
  const fmt = formatGame(g);
  assert(typeof fmt === 'string', 'is string');
  assert(fmt.includes('tic_tac_toe'), 'has game name');
});

group("10. シミュレーション");

test("simulateGames — 複数対局", () => {
  seedRandom(42);
  const result = simulateGames('tic_tac_toe', 5, 'minimax', 'random');
  assertEq(result.total, 5);
  assert(result.p1Wins + result.p2Wins + result.draws === 5, 'all accounted');
  assert(result.p1Rate >= 0 && result.p1Rate <= 1, 'valid rate');
});

// ═══════════════════════════════════════════
// Part C: Rei構文統合
// ═══════════════════════════════════════════

group("11. Rei構文 — ランダム");

test("𝕄 |> random", () => {
  seedRandom(42);
  const r = rei('𝕄{5; 1, 2, 3, 4} |> random');
  assertEq(r.reiType, 'RandomResult');
  assert([1,2,3,4].includes(r.value), `value: ${r.value}`);
});

test("[1,2,3] |> entropy", () => {
  const r = rei('[1, 1, 2, 2, 3, 3] |> entropy');
  assertEq(r.reiType, 'EntropyAnalysis');
  assert(r.shannon > 0, 'positive entropy');
});

test("𝕄 |> ランダム — 日本語", () => {
  seedRandom(42);
  const r = rei('𝕄{0; 10, 20, 30} |> ランダム');
  assertEq(r.reiType, 'RandomResult');
});

test("0 |> random_walk(10)", () => {
  const r = rei('0 |> random_walk(10)');
  assert(Array.isArray(r), 'is array');
  assertEq(r.length, 11);
});

group("12. Rei構文 — ゲーム");

test('"tic_tac_toe" |> game — ゲーム作成', () => {
  const r = rei('"tic_tac_toe" |> game');
  assertEq(r.reiType, 'GameSpace');
  assertEq(r.rules.name, 'tic_tac_toe');
});

test('game |> play(4) — 手動プレイ', () => {
  const r = rei('"tic_tac_toe" |> game |> play(4)');
  assertEq(r.reiType, 'GameSpace');
  assertEq(r.state.board[4], 1);
});

test('game |> auto_play — 自動対局', () => {
  const r = rei('"tic_tac_toe" |> game |> auto_play("minimax", "minimax")');
  assertEq(r.state.status, 'draw');
});

test('game |> legal_moves — 合法手取得', () => {
  const r = rei('"tic_tac_toe" |> game |> legal_moves');
  assert(Array.isArray(r), 'is array');
  assertEq(r.length, 9);
});

test('game |> board — 盤面取得', () => {
  const r = rei('"tic_tac_toe" |> game |> play(0) |> board');
  assert(Array.isArray(r), 'is array');
  assertEq(r[0], 1);
});

test('game |> sigma — σ自己参照', () => {
  const r = rei('"tic_tac_toe" |> game |> sigma');
  assertEq(r.reiType, 'SigmaResult');
  assertEq(r.field.game, 'tic_tac_toe');
});

test('"nim" |> game |> auto_play — ニム自動対局', () => {
  const r = rei('"nim" |> game |> auto_play("minimax", "random")');
  assertEq(r.state.status, 'win');
});

test('game |> 盤面表示 — 日本語', () => {
  const r = rei('"tic_tac_toe" |> game |> play(4) |> 盤面表示');
  assert(typeof r === 'string', 'is string');
});

test('"tic_tac_toe" |> simulate(3) — シミュレーション', () => {
  seedRandom(42);
  const r = rei('"tic_tac_toe" |> simulate(3, "minimax", "random")');
  assertEq(r.total, 3);
  assert(r.p1Wins + r.p2Wins + r.draws === 3, 'all accounted');
});

group("13. D-FUMT 6属性マッピング");

test("場(field) — ゲーム盤面", () => {
  const g = createGameSpace('tic_tac_toe');
  const sigma = getGameSigma(g);
  assertEq(sigma.field.game, 'tic_tac_toe');
  assertEq(sigma.field.board.length, 9);
});

test("流れ(flow) — ターン進行", () => {
  const g = playMove(createGameSpace('tic_tac_toe'), 4);
  const sigma = getGameSigma(g);
  assertEq(sigma.flow.currentPlayer, 2);
  assertEq(sigma.flow.direction, 'active');
});

test("記憶(memory) — 棋譜", () => {
  let g = createGameSpace('tic_tac_toe');
  g = playMove(g, 0);
  g = playMove(g, 4);
  const sigma = getGameSigma(g);
  assertEq(sigma.memory.length, 2);
});

test("層(layer) — 探索深度", () => {
  const g = createGameSpace('tic_tac_toe');
  const sigma = getGameSigma(g);
  assert(sigma.layer > 0, 'has search depth');
});

test("関係(relation) — プレイヤー構造", () => {
  const g = createGameSpace('tic_tac_toe');
  const sigma = getGameSigma(g);
  assertEq(sigma.relation.players, 2);
  assertEq(sigma.relation.type, 'adversarial_alternating');
});

test("意志(will) — 戦略情報", () => {
  const g = createGameSpace('tic_tac_toe');
  const sigma = getGameSigma(g);
  assertEq(sigma.will.strategy, 'minimax');
});

// ═══════════════════════════════════════════
console.log(`\n${'═'.repeat(50)}`);
console.log(`結果: ${passed}/${totalTests} テスト合格`);
if (failed > 0) { console.log(`❌ ${failed} テスト失敗`); process.exit(1); }
else { console.log(`✅ 全テスト合格！`); }
