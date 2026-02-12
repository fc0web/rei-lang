// ============================================================
// Rei v0.3 — Game & Randomness テスト (柱⑤) — vitest版
// 55テスト: ランダムネス + ゲームエンジン + Rei構文統合
// ============================================================

import { describe, it, expect } from 'vitest';
import {
  createGameSpace, playMove, autoPlay, selectBestMove,
  gameAsMDim, getGameSigma, formatGame, getLegalMoves, simulateGames,
  randomFromMDim, randomUniform, randomWeighted, randomWalk,
  monteCarloSample, analyzeEntropy, seedRandom,
  type GameSpace, type RandomResult,
} from '../src/lang/game';
import { Lexer } from '../src/lang/lexer';
import { Parser } from '../src/lang/parser';
import { Evaluator } from '../src/lang/evaluator';

function rei(code: string): any {
  const tokens = new Lexer(code).tokenize();
  const ast = new Parser(tokens).parseProgram();
  return new Evaluator().eval(ast);
}

// ═══════════════════════════════════════════
// Part A: Pure Randomness
// ═══════════════════════════════════════════

describe("1. ランダム基本", () => {
  it("randomUniform — 配列からランダム選択", () => {
    seedRandom(42);
    const r = randomUniform([10, 20, 30]);
    expect(r.reiType).toBe('RandomResult');
    expect([10, 20, 30]).toContain(r.value);
    expect(Math.abs(r.probability - 1/3)).toBeLessThan(0.01);
    expect(r.entropy).toBeGreaterThan(0);
  });

  it("randomWeighted — 重み付き選択", () => {
    seedRandom(123);
    const r = randomWeighted(['a', 'b', 'c'], [10, 1, 1]);
    expect(r.reiType).toBe('RandomResult');
    expect(['a', 'b', 'c']).toContain(r.value);
    expect(r.source).toBe('weighted');
  });

  it("randomFromMDim — 𝕄のneighborsから選択", () => {
    seedRandom(99);
    const md = { reiType: 'MDim', center: 5, neighbors: [1, 2, 3, 4] };
    const r = randomFromMDim(md);
    expect([1, 2, 3, 4]).toContain(r.value);
  });

  it("randomFromMDim — 空のneighbors", () => {
    const md = { reiType: 'MDim', center: 42, neighbors: [] };
    const r = randomFromMDim(md);
    expect(r.value).toBe(42);
    expect(r.probability).toBe(1);
  });

  it("seedRandom — 同じシードで再現可能", () => {
    seedRandom(777);
    const r1 = randomUniform([1,2,3,4,5]);
    seedRandom(777);
    const r2 = randomUniform([1,2,3,4,5]);
    expect(r1.value).toBe(r2.value);
  });
});

describe("2. エントロピー分析", () => {
  it("analyzeEntropy — 均一分布", () => {
    const e = analyzeEntropy([1, 2, 3, 4, 1, 2, 3, 4]);
    expect(e.reiType).toBe('EntropyAnalysis');
    expect(e.shannon).toBeGreaterThan(0);
    expect(Math.abs(e.relativeEntropy - 1.0)).toBeLessThan(0.01);
  });

  it("analyzeEntropy — 偏った分布", () => {
    const e = analyzeEntropy([1, 1, 1, 1, 1, 1, 1, 2]);
    expect(e.relativeEntropy).toBeLessThan(0.8);
  });

  it("analyzeEntropy — 単一値（エントロピー0）", () => {
    const e = analyzeEntropy([5, 5, 5, 5]);
    expect(e.shannon).toBe(0);
  });

  it("analyzeEntropy — distribution返却", () => {
    const e = analyzeEntropy([1, 1, 2, 2, 3]);
    expect(e.distribution.length).toBe(3);
    expect(e.distribution[0].probability).toBeGreaterThanOrEqual(e.distribution[1].probability);
  });
});

describe("3. ランダムウォーク & モンテカルロ", () => {
  it("randomWalk — 指定ステップ数", () => {
    const walk = randomWalk(0, 10);
    expect(walk.length).toBe(11);
    expect(walk[0]).toBe(0);
  });

  it("randomWalk — カスタムステップサイズ", () => {
    seedRandom(42);
    const walk = randomWalk(100, 5, 10);
    expect(walk.length).toBe(6);
    expect(walk[0]).toBe(100);
    for (let i = 1; i < walk.length; i++) {
      expect(Math.abs(walk[i] - walk[i-1])).toBe(10);
    }
  });

  it("monteCarloSample — N回サンプリング", () => {
    const md = { reiType: 'MDim', center: 0, neighbors: [1, 2, 3] };
    const mc = monteCarloSample(md, 50);
    expect(mc.samples.length).toBe(50);
    expect(mc.entropy.reiType).toBe('EntropyAnalysis');
    expect(mc.entropy.shannon).toBeGreaterThan(0);
  });
});

// ═══════════════════════════════════════════
// Part B: Game Unification
// ═══════════════════════════════════════════

describe("4. ゲームスペース作成", () => {
  it("三目並べ作成", () => {
    const g = createGameSpace('tic_tac_toe');
    expect(g.reiType).toBe('GameSpace');
    expect(g.rules.name).toBe('tic_tac_toe');
    expect(g.state.board.length).toBe(9);
    expect(g.state.board.every((c: any) => c === 0)).toBe(true);
    expect(g.state.currentPlayer).toBe(1);
    expect(g.state.status).toBe('playing');
  });

  it("ニム作成", () => {
    const g = createGameSpace('nim');
    expect(g.rules.name).toBe('nim');
    expect(g.state.board[0]).toBe(10);
  });

  it("ニム — カスタム石数", () => {
    const g = createGameSpace('nim', { stones: 15 });
    expect(g.state.board[0]).toBe(15);
  });

  it("じゃんけん作成", () => {
    const g = createGameSpace('rock_paper_scissors');
    expect(g.rules.name).toBe('rock_paper_scissors');
  });

  it("コインフリップ作成", () => {
    const g = createGameSpace('coin_flip');
    expect(g.rules.name).toBe('coin_flip');
  });

  it("日本語名で作成", () => {
    const g1 = createGameSpace('三目並べ');
    expect(g1.rules.name).toBe('tic_tac_toe');
    const g2 = createGameSpace('ニム');
    expect(g2.rules.name).toBe('nim');
    const g3 = createGameSpace('じゃんけん');
    expect(g3.rules.name).toBe('rock_paper_scissors');
  });
});

describe("5. 三目並べ — ゲームプレイ", () => {
  it("合法手 — 初期盤面は9手", () => {
    const g = createGameSpace('tic_tac_toe');
    expect(getLegalMoves(g).length).toBe(9);
  });

  it("playMove — 手動で1手打つ", () => {
    const g = createGameSpace('tic_tac_toe');
    const g2 = playMove(g, 4);
    expect(g2.state.board[4]).toBe(1);
    expect(g2.state.currentPlayer).toBe(2);
    expect(g2.state.turnCount).toBe(1);
  });

  it("playMove — 自動（minimax最善手）", () => {
    const g = createGameSpace('tic_tac_toe');
    const g2 = playMove(g);
    expect(g2.state.turnCount).toBe(1);
    expect(g2.state.board.some((c: any) => c !== 0)).toBe(true);
  });

  it("autoPlay — 完全自動対局", () => {
    const g = createGameSpace('tic_tac_toe');
    const result = autoPlay(g, 'minimax', 'minimax');
    expect(result.state.status).not.toBe('playing');
    expect(result.state.status).toBe('draw');
  });

  it("autoPlay — minimax vs random", () => {
    seedRandom(42);
    const g = createGameSpace('tic_tac_toe');
    const result = autoPlay(g, 'minimax', 'random');
    expect(result.state.status).not.toBe('playing');
    expect(result.state.winner).not.toBe(2);
  });
});

describe("6. ニム — ゲームプレイ", () => {
  it("ニム合法手 — 1〜3", () => {
    const g = createGameSpace('nim');
    const moves = getLegalMoves(g);
    expect(moves.length).toBeLessThanOrEqual(3);
    expect(moves).toContain(1);
  });

  it("ニム — 手動プレイ", () => {
    const g = createGameSpace('nim');
    const g2 = playMove(g, 2);
    expect(g2.state.board[0]).toBe(8);
    expect(g2.state.currentPlayer).toBe(2);
  });

  it("ニム — 完全自動", () => {
    const g = createGameSpace('nim');
    const result = autoPlay(g);
    expect(result.state.status).toBe('win');
    expect(result.state.winner).not.toBeNull();
  });
});

describe("7. 戦略の多様性", () => {
  it("random戦略", () => {
    seedRandom(42);
    const g = createGameSpace('tic_tac_toe');
    g.strategy = 'random';
    const best = selectBestMove(g);
    expect(best.move).toBeGreaterThanOrEqual(0);
    expect(best.move).toBeLessThan(9);
    expect(best.searchNodes).toBe(1);
  });

  it("greedy戦略", () => {
    const g = createGameSpace('tic_tac_toe');
    g.strategy = 'greedy';
    expect(selectBestMove(g).move).toBeGreaterThanOrEqual(0);
  });

  it("minimax戦略 — 探索ノード数", () => {
    const g = createGameSpace('tic_tac_toe');
    g.strategy = 'minimax';
    expect(selectBestMove(g).searchNodes).toBeGreaterThan(1);
  });
});

describe("8. 統一性の証明", () => {
  it("全ゲームがGameSpaceで表現可能", () => {
    for (const name of ['tic_tac_toe', 'nim', 'coin_flip', 'rock_paper_scissors']) {
      const g = createGameSpace(name);
      expect(g.reiType).toBe('GameSpace');
      expect(g.rules.getLegalMoves).toBeDefined();
      expect(g.rules.applyMove).toBeDefined();
      expect(g.rules.checkWin).toBeDefined();
      expect(g.rules.formatBoard).toBeDefined();
    }
  });

  it("全ゲームが同じplay/autoPlayで動く", () => {
    seedRandom(42);
    for (const name of ['tic_tac_toe', 'nim', 'rock_paper_scissors']) {
      const result = autoPlay(createGameSpace(name), 'random', 'random');
      expect(result.state.status).not.toBe('playing');
    }
  });

  it("全ゲームを𝕄として表現可能", () => {
    for (const name of ['tic_tac_toe', 'nim', 'coin_flip']) {
      const md = gameAsMDim(createGameSpace(name));
      expect(md.reiType).toBe('MDim');
      expect(md.neighbors.length).toBeGreaterThan(0);
    }
  });
});

describe("9. σ自己参照", () => {
  it("getGameSigma — 6属性", () => {
    const sigma = getGameSigma(createGameSpace('tic_tac_toe'));
    expect(sigma.reiType).toBe('SigmaResult');
    expect(sigma.field).toBeDefined();
    expect(sigma.flow).toBeDefined();
    expect(sigma.memory).toBeDefined();
    expect(typeof sigma.layer).toBe('number');
    expect(sigma.relation).toBeDefined();
    expect(sigma.will).toBeDefined();
  });

  it("σ — 対局中の状態を反映", () => {
    const sigma = getGameSigma(playMove(createGameSpace('tic_tac_toe'), 4));
    expect(sigma.field.turnCount).toBe(1);
    expect(sigma.flow.currentPlayer).toBe(2);
    expect(sigma.memory.length).toBe(1);
  });

  it("formatGame — 文字列出力", () => {
    const fmt = formatGame(createGameSpace('tic_tac_toe'));
    expect(typeof fmt).toBe('string');
    expect(fmt).toContain('tic_tac_toe');
  });
});

describe("10. シミュレーション", () => {
  it("simulateGames — 複数対局", () => {
    seedRandom(42);
    const r = simulateGames('tic_tac_toe', 5, 'minimax', 'random');
    expect(r.total).toBe(5);
    expect(r.p1Wins + r.p2Wins + r.draws).toBe(5);
    expect(r.p1Rate).toBeGreaterThanOrEqual(0);
    expect(r.p1Rate).toBeLessThanOrEqual(1);
  });
});

// ═══════════════════════════════════════════
// Part C: Rei構文統合
// ═══════════════════════════════════════════

describe("11. Rei構文 — ランダム", () => {
  it("𝕄 |> random", () => {
    seedRandom(42);
    const r = rei('𝕄{5; 1, 2, 3, 4} |> random');
    expect(r.reiType).toBe('RandomResult');
    expect([1,2,3,4]).toContain(r.value);
  });

  it("[1,2,3] |> entropy", () => {
    const r = rei('[1, 1, 2, 2, 3, 3] |> entropy');
    expect(r.reiType).toBe('EntropyAnalysis');
    expect(r.shannon).toBeGreaterThan(0);
  });

  it("𝕄 |> ランダム — 日本語", () => {
    seedRandom(42);
    const r = rei('𝕄{0; 10, 20, 30} |> ランダム');
    expect(r.reiType).toBe('RandomResult');
  });

  it("0 |> random_walk(10)", () => {
    const r = rei('0 |> random_walk(10)');
    expect(Array.isArray(r)).toBe(true);
    expect(r.length).toBe(11);
  });
});

describe("12. Rei構文 — ゲーム", () => {
  it('"tic_tac_toe" |> game', () => {
    const r = rei('"tic_tac_toe" |> game');
    expect(r.reiType).toBe('GameSpace');
    expect(r.rules.name).toBe('tic_tac_toe');
  });

  it('game |> play(4)', () => {
    const r = rei('"tic_tac_toe" |> game |> play(4)');
    expect(r.state.board[4]).toBe(1);
  });

  it('game |> auto_play', () => {
    expect(rei('"tic_tac_toe" |> game |> auto_play("minimax", "minimax")').state.status).toBe('draw');
  });

  it('game |> legal_moves', () => {
    const r = rei('"tic_tac_toe" |> game |> legal_moves');
    expect(Array.isArray(r)).toBe(true);
    expect(r.length).toBe(9);
  });

  it('game |> board', () => {
    const r = rei('"tic_tac_toe" |> game |> play(0) |> board');
    expect(r[0]).toBe(1);
  });

  it('game |> sigma', () => {
    const r = rei('"tic_tac_toe" |> game |> sigma');
    expect(r.reiType).toBe('SigmaResult');
    expect(r.field.game).toBe('tic_tac_toe');
  });

  it('"nim" |> auto_play', () => {
    expect(rei('"nim" |> game |> auto_play("minimax", "random")').state.status).toBe('win');
  });

  it('game |> 盤面表示', () => {
    expect(typeof rei('"tic_tac_toe" |> game |> play(4) |> 盤面表示')).toBe('string');
  });

  it('simulate(3)', () => {
    seedRandom(42);
    const r = rei('"tic_tac_toe" |> simulate(3, "minimax", "random")');
    expect(r.total).toBe(3);
    expect(r.p1Wins + r.p2Wins + r.draws).toBe(3);
  });
});

describe("13. D-FUMT 6属性マッピング", () => {
  it("場(field)", () => {
    const sigma = getGameSigma(createGameSpace('tic_tac_toe'));
    expect(sigma.field.game).toBe('tic_tac_toe');
    expect(sigma.field.board.length).toBe(9);
  });

  it("流れ(flow)", () => {
    const sigma = getGameSigma(playMove(createGameSpace('tic_tac_toe'), 4));
    expect(sigma.flow.currentPlayer).toBe(2);
    expect(sigma.flow.direction).toBe('active');
  });

  it("記憶(memory)", () => {
    let g = createGameSpace('tic_tac_toe');
    g = playMove(g, 0);
    g = playMove(g, 4);
    expect(getGameSigma(g).memory.length).toBe(2);
  });

  it("層(layer)", () => {
    expect(getGameSigma(createGameSpace('tic_tac_toe')).layer).toBeGreaterThan(0);
  });

  it("関係(relation)", () => {
    const sigma = getGameSigma(createGameSpace('tic_tac_toe'));
    expect(sigma.relation.players).toBe(2);
    expect(sigma.relation.type).toBe('adversarial_alternating');
  });

  it("意志(will)", () => {
    expect(getGameSigma(createGameSpace('tic_tac_toe')).will.strategy).toBe('minimax');
  });
});
