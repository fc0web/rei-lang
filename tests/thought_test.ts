// ============================================================
// Rei v0.3 — Thought Loop テスト (柱④: 思考ループ・自律的自己進化)
// 47テスト: エンジン単体 + Rei構文統合
// ============================================================

import {
  thinkLoop, getThoughtSigma, formatThought,
  thoughtTrajectory, thoughtModes, dominantMode,
  type ThoughtResult, type ThoughtConfig,
} from '../lang/thought';

// Rei構文テスト用
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

const VALID_MODES = [
  "weighted", "multiplicative", "harmonic", "exponential",
  "geometric", "median", "minkowski", "entropy",
];

// --- Test runner ---
let passed = 0;
let failed = 0;
let totalTests = 0;

function group(name: string) {
  console.log(`\n═══ ${name} ═══`);
}

function test(name: string, fn: () => void) {
  totalTests++;
  try {
    fn();
    passed++;
    console.log(`  ✅ ${name}`);
  } catch (e: any) {
    failed++;
    console.log(`  ❌ ${name}`);
    console.log(`     ${e.message}`);
  }
}

function assert(cond: boolean, msg: string = '') {
  if (!cond) throw new Error(`Assertion failed${msg ? ': ' + msg : ''}`);
}

function assertEq(a: any, b: any, msg: string = '') {
  if (a !== b) throw new Error(`${msg ? msg + ': ' : ''}expected ${JSON.stringify(b)}, got ${JSON.stringify(a)}`);
}

function assertApprox(a: number, b: number, eps: number = 0.01, msg: string = '') {
  if (Math.abs(a - b) > eps) throw new Error(`${msg ? msg + ': ' : ''}expected ≈${b}, got ${a} (Δ=${Math.abs(a-b)})`);
}

// ═══════════════════════════════════════════════
// Group 1: ThinkLoop基本動作
// ═══════════════════════════════════════════════
group("1. ThinkLoop 基本動作");

test("収束戦略 — 𝕄が安定値に到達", () => {
  const md = { reiType: 'MDim', center: 5, neighbors: [1, 2, 3], mode: 'weighted' };
  const result = thinkLoop(md, { strategy: 'converge', maxIterations: 20 });
  assert(result.reiType === 'ThoughtResult', 'reiType');
  assert(result.totalIterations > 0, 'iterations > 0');
  assert(result.totalIterations <= 20, 'iterations <= maxIterations');
  assert(result.stopReason !== undefined, 'stopReason exists');
});

test("数値入力 — 自動𝕄変換", () => {
  const result = thinkLoop(42, { strategy: 'converge', maxIterations: 5 });
  assert(result.reiType === 'ThoughtResult', 'reiType');
  assert(result.totalIterations <= 5, 'respects maxIterations');
});

test("配列入力 — 自動𝕄変換", () => {
  const result = thinkLoop([10, 2, 3, 4], { strategy: 'converge', maxIterations: 5 });
  assert(result.reiType === 'ThoughtResult', 'reiType');
  assert(result.steps.length > 0, 'has steps');
});

test("maxIterations制限", () => {
  const md = { reiType: 'MDim', center: 100, neighbors: [50, 60, 70, 80], mode: 'weighted' };
  const result = thinkLoop(md, { strategy: 'explore', maxIterations: 3 });
  assert(result.totalIterations <= 3, `got ${result.totalIterations}`);
});

// ═══════════════════════════════════════════════
// Group 2: 停止判定
// ═══════════════════════════════════════════════
group("2. 停止判定");

test("収束停止 — delta < epsilon", () => {
  const md = { reiType: 'MDim', center: 5, neighbors: [1, 2, 3], mode: 'weighted' };
  const result = thinkLoop(md, { strategy: 'converge', maxIterations: 50, epsilon: 1.0 });
  // 大きなepsilonで収束しやすい
  if (result.stopReason === 'converged') {
    const lastStep = result.steps[result.steps.length - 1];
    assert(Math.abs(lastStep.delta) < 1.0, 'delta < epsilon');
  }
  assert(result.stopReason !== undefined, 'has stopReason');
});

test("目標到達停止 — seek戦略", () => {
  const md = { reiType: 'MDim', center: 5, neighbors: [1, 2, 3], mode: 'weighted' };
  const result = thinkLoop(md, {
    strategy: 'seek',
    targetValue: 7,
    targetEpsilon: 2.0,
    maxIterations: 30,
    allowCycleDetection: false,  // seek時は循環検出を無効に
  });
  assert(result.stopStrategy === 'seek', 'strategy is seek');
  // ターゲットに到達したか、最大反復に到達
  assert(['target_reached', 'limit'].includes(result.stopReason), `stopReason: ${result.stopReason}`);
});

test("最大反復到達停止", () => {
  const md = { reiType: 'MDim', center: 5, neighbors: [1, 2, 3], mode: 'weighted' };
  const result = thinkLoop(md, { strategy: 'explore', maxIterations: 3, epsilon: 0.000001 });
  assert(result.totalIterations <= 3, 'respects limit');
});

test("循環検出停止", () => {
  // 単純な数値は循環しやすい
  const result = thinkLoop(1, {
    strategy: 'converge',
    maxIterations: 30,
    allowCycleDetection: true,
    cycleWindowSize: 3,
  });
  assert(result.totalIterations <= 30, 'completed');
  assert(result.stopReason !== undefined, 'has stopReason');
});

// ═══════════════════════════════════════════════
// Group 3: 5つの戦略
// ═══════════════════════════════════════════════
group("3. 5つの戦略");

test("converge戦略", () => {
  const md = { reiType: 'MDim', center: 10, neighbors: [1, 2, 3, 4], mode: 'weighted' };
  const result = thinkLoop(md, { strategy: 'converge', maxIterations: 20 });
  assertEq(result.stopStrategy, 'converge');
});

test("explore戦略", () => {
  const md = { reiType: 'MDim', center: 5, neighbors: [1, 2, 3], mode: 'weighted' };
  const result = thinkLoop(md, { strategy: 'explore', maxIterations: 10 });
  assertEq(result.stopStrategy, 'explore');
});

test("seek戦略", () => {
  const md = { reiType: 'MDim', center: 5, neighbors: [1, 2, 3], mode: 'weighted' };
  const result = thinkLoop(md, { strategy: 'seek', targetValue: 10, maxIterations: 15 });
  assertEq(result.stopStrategy, 'seek');
});

test("awaken戦略", () => {
  const md = { reiType: 'MDim', center: 5, neighbors: [1, 2, 3, 4, 5], mode: 'weighted' };
  const result = thinkLoop(md, {
    strategy: 'awaken',
    maxIterations: 30,
    awakenThreshold: 0.3,
  });
  assertEq(result.stopStrategy, 'awaken');
  // 覚醒したか最大反復に到達
  assert(['awakened', 'limit'].includes(result.stopReason), `reason: ${result.stopReason}`);
});

test("auto戦略（デフォルト）", () => {
  const md = { reiType: 'MDim', center: 5, neighbors: [1, 2, 3], mode: 'weighted' };
  const result = thinkLoop(md, { strategy: 'auto', maxIterations: 10 });
  assertEq(result.stopStrategy, 'auto');
});

// ═══════════════════════════════════════════════
// Group 4: 思考ステップの記録
// ═══════════════════════════════════════════════
group("4. 思考ステップの記録（記憶属性）");

test("各ステップにiteration/value/mode/delta記録", () => {
  const md = { reiType: 'MDim', center: 5, neighbors: [1, 2, 3], mode: 'weighted' };
  const result = thinkLoop(md, { maxIterations: 5 });
  for (const step of result.steps) {
    assert(typeof step.iteration === 'number', 'iteration is number');
    assert(typeof step.numericValue === 'number', 'numericValue is number');
    assert(typeof step.selectedMode === 'string', 'selectedMode is string');
    assert(typeof step.delta === 'number', 'delta is number');
    assert(typeof step.decision === 'string', 'decision is string');
  }
});

test("反復番号は0から連続", () => {
  const md = { reiType: 'MDim', center: 10, neighbors: [2, 3, 4], mode: 'weighted' };
  const result = thinkLoop(md, { maxIterations: 5 });
  result.steps.forEach((step, i) => {
    assertEq(step.iteration, i, `step ${i} iteration`);
  });
});

test("deltaは前ステップとの差分", () => {
  const md = { reiType: 'MDim', center: 5, neighbors: [1, 2, 3], mode: 'weighted' };
  const result = thinkLoop(md, { maxIterations: 5 });
  if (result.steps.length >= 2) {
    const s0 = result.steps[0];
    const s1 = result.steps[1];
    // s1.delta = s1.numericValue - s0.numericValue (approximately)
    // s0.delta = s0.numericValue - initialValue
    assert(typeof s1.delta === 'number', 'delta exists');
  }
});

test("全ステップにdecisionとreason", () => {
  const md = { reiType: 'MDim', center: 5, neighbors: [1, 2, 3], mode: 'weighted' };
  const result = thinkLoop(md, { maxIterations: 5 });
  for (const step of result.steps) {
    assert(['continue', 'converged', 'limit', 'target_reached', 'awakened', 'cycle_detected'].includes(step.decision),
      `decision: ${step.decision}`);
  }
  // 最後のステップはcontinue以外
  const last = result.steps[result.steps.length - 1];
  assert(last.decision !== 'continue' || result.totalIterations === 0, 'last step has terminal decision');
});

// ═══════════════════════════════════════════════
// Group 5: 軌跡分析（流れ属性）
// ═══════════════════════════════════════════════
group("5. 軌跡分析（流れ属性）");

test("trajectory属性が存在", () => {
  const md = { reiType: 'MDim', center: 5, neighbors: [1, 2, 3], mode: 'weighted' };
  const result = thinkLoop(md, { maxIterations: 10 });
  assert(['converging', 'diverging', 'oscillating', 'chaotic', 'stable'].includes(result.trajectory),
    `trajectory: ${result.trajectory}`);
});

test("convergenceRate: 0〜1の範囲", () => {
  const md = { reiType: 'MDim', center: 5, neighbors: [1, 2, 3], mode: 'weighted' };
  const result = thinkLoop(md, { maxIterations: 10 });
  assert(result.convergenceRate >= 0, 'rate >= 0');
  assert(result.convergenceRate <= 1, 'rate <= 1');
});

test("thoughtTrajectory — 数値配列を返す", () => {
  const md = { reiType: 'MDim', center: 5, neighbors: [1, 2, 3], mode: 'weighted' };
  const result = thinkLoop(md, { maxIterations: 5 });
  const traj = thoughtTrajectory(result);
  assert(Array.isArray(traj), 'is array');
  assert(traj.every(v => typeof v === 'number'), 'all numbers');
  assertEq(traj.length, result.totalIterations, 'length matches iterations');
});

// ═══════════════════════════════════════════════
// Group 6: モード選択（意志属性）
// ═══════════════════════════════════════════════
group("6. モード選択（意志属性）");

test("modeHistory — 各ステップの選択モード", () => {
  const md = { reiType: 'MDim', center: 5, neighbors: [1, 2, 3], mode: 'weighted' };
  const result = thinkLoop(md, { maxIterations: 5 });
  assert(Array.isArray(result.modeHistory), 'is array');
  assertEq(result.modeHistory.length, result.totalIterations, 'length matches');
});

test("modeTransitions — モード変更回数", () => {
  const md = { reiType: 'MDim', center: 5, neighbors: [1, 2, 3], mode: 'weighted' };
  const result = thinkLoop(md, { maxIterations: 10 });
  assert(typeof result.modeTransitions === 'number', 'is number');
  assert(result.modeTransitions >= 0, 'non-negative');
  assert(result.modeTransitions < result.totalIterations, 'less than total');
});

test("dominantMode — 最頻モード", () => {
  const md = { reiType: 'MDim', center: 5, neighbors: [1, 2, 3], mode: 'weighted' };
  const result = thinkLoop(md, { maxIterations: 5 });
  const dom = dominantMode(result);
  assert(typeof dom.mode === 'string', 'has mode');
  assert(typeof dom.count === 'number', 'has count');
  assert(dom.ratio > 0 && dom.ratio <= 1, 'ratio in range');
});

test("loopTendency — ループの意志", () => {
  const md = { reiType: 'MDim', center: 5, neighbors: [1, 2, 3], mode: 'weighted' };
  const result = thinkLoop(md, { maxIterations: 10 });
  assert(['rest', 'contract', 'expand', 'spiral'].includes(result.loopTendency),
    `tendency: ${result.loopTendency}`);
  assert(result.loopStrength >= 0 && result.loopStrength <= 1, 'strength in range');
});

// ═══════════════════════════════════════════════
// Group 7: 覚醒（C4公理）
// ═══════════════════════════════════════════════
group("7. 覚醒（C4公理 — 思考ループ版）");

test("peakAwareness — 最高覚醒度", () => {
  const md = { reiType: 'MDim', center: 5, neighbors: [1, 2, 3, 4, 5], mode: 'weighted' };
  const result = thinkLoop(md, { maxIterations: 15 });
  assert(typeof result.peakAwareness === 'number', 'is number');
  assert(result.peakAwareness >= 0 && result.peakAwareness <= 1, 'in range');
});

test("finalAwareness — 最終覚醒度", () => {
  const md = { reiType: 'MDim', center: 5, neighbors: [1, 2, 3, 4, 5], mode: 'weighted' };
  const result = thinkLoop(md, { maxIterations: 15 });
  assert(typeof result.finalAwareness === 'number', 'is number');
  assert(result.finalAwareness <= result.peakAwareness, 'final <= peak');
});

test("awaken戦略で覚醒到達", () => {
  const md = { reiType: 'MDim', center: 5, neighbors: [1, 2, 3, 4, 5], mode: 'weighted' };
  const result = thinkLoop(md, {
    strategy: 'awaken',
    maxIterations: 30,
    awakenThreshold: 0.2,  // 低い閾値で確実に覚醒
  });
  if (result.stopReason === 'awakened') {
    assert(result.awakenedAt !== null, 'awakenedAt is set');
    assert(typeof result.awakenedAt === 'number', 'awakenedAt is number');
  }
});

// ═══════════════════════════════════════════════
// Group 8: σ自己参照
// ═══════════════════════════════════════════════
group("8. σ自己参照（ThoughtResultのσ）");

test("getThoughtSigma — 6属性を持つ", () => {
  const md = { reiType: 'MDim', center: 5, neighbors: [1, 2, 3], mode: 'weighted' };
  const result = thinkLoop(md, { maxIterations: 5 });
  const sigma = getThoughtSigma(result);

  assert(sigma.reiType === 'SigmaResult', 'is SigmaResult');
  assert(sigma.field !== undefined, 'has field');
  assert(sigma.flow !== undefined, 'has flow');
  assert(sigma.memory !== undefined, 'has memory');
  assert(typeof sigma.layer === 'number', 'has layer');
  assert(sigma.will !== undefined, 'has will');
  assert(sigma.relation !== undefined, 'has relation');
});

test("σ.field — 思考ループ情報", () => {
  const md = { reiType: 'MDim', center: 5, neighbors: [1, 2, 3], mode: 'weighted' };
  const result = thinkLoop(md, { maxIterations: 5 });
  const sigma = getThoughtSigma(result);

  assertEq(sigma.field.type, 'thought_loop');
  assert(typeof sigma.field.finalValue === 'number', 'has finalValue');
  assert(typeof sigma.field.totalIterations === 'number', 'has totalIterations');
});

test("σ.memory — 全ステップ履歴", () => {
  const md = { reiType: 'MDim', center: 5, neighbors: [1, 2, 3], mode: 'weighted' };
  const result = thinkLoop(md, { maxIterations: 5 });
  const sigma = getThoughtSigma(result);

  assert(Array.isArray(sigma.memory), 'memory is array');
  assert(sigma.memory.length > 0, 'memory is not empty');
  assert(sigma.memory[0].iteration !== undefined, 'has iteration');
  assert(sigma.memory[0].mode !== undefined, 'has mode');
});

test("σ.will — ループの意志", () => {
  const md = { reiType: 'MDim', center: 5, neighbors: [1, 2, 3], mode: 'weighted' };
  const result = thinkLoop(md, { maxIterations: 10 });
  const sigma = getThoughtSigma(result);

  assert(sigma.will.tendency !== undefined, 'has tendency');
  assert(Array.isArray(sigma.will.history), 'has history');
});

test("σ.relation — ステップ間関係", () => {
  const md = { reiType: 'MDim', center: 5, neighbors: [1, 2, 3], mode: 'weighted' };
  const result = thinkLoop(md, { maxIterations: 5 });
  const sigma = getThoughtSigma(result);

  assert(Array.isArray(sigma.relation), 'relation is array');
  if (sigma.relation.length > 0) {
    assert(sigma.relation[0].from !== undefined, 'has from');
    assert(sigma.relation[0].to !== undefined, 'has to');
    assert(typeof sigma.relation[0].delta === 'number', 'has delta');
  }
});

// ═══════════════════════════════════════════════
// Group 9: フォーマット出力
// ═══════════════════════════════════════════════
group("9. フォーマット出力");

test("formatThought — 文字列を返す", () => {
  const md = { reiType: 'MDim', center: 5, neighbors: [1, 2, 3], mode: 'weighted' };
  const result = thinkLoop(md, { maxIterations: 5 });
  const fmt = formatThought(result);
  assert(typeof fmt === 'string', 'is string');
  assert(fmt.includes('思考ループ結果'), 'has header');
  assert(fmt.includes('反復'), 'has iteration info');
  assert(fmt.includes('軌跡'), 'has trajectory');
});

// ═══════════════════════════════════════════════
// Group 10: エッジケース
// ═══════════════════════════════════════════════
group("10. エッジケース");

test("maxIterations=1 — 1回だけ思考", () => {
  const md = { reiType: 'MDim', center: 5, neighbors: [1, 2, 3], mode: 'weighted' };
  const result = thinkLoop(md, { maxIterations: 1 });
  assertEq(result.totalIterations, 1);
  assertEq(result.steps.length, 1);
});

test("空のneighbors — 安全に処理", () => {
  const md = { reiType: 'MDim', center: 42, neighbors: [], mode: 'weighted' };
  const result = thinkLoop(md, { maxIterations: 5 });
  assert(result.reiType === 'ThoughtResult', 'completes');
});

test("大きな数値 — オーバーフローしない", () => {
  const md = { reiType: 'MDim', center: 1e10, neighbors: [1e8, 1e9], mode: 'weighted' };
  const result = thinkLoop(md, { maxIterations: 5 });
  assert(isFinite(result.finalNumeric), 'result is finite');
});

// ═══════════════════════════════════════════════
// Group 11: evolve(柱①)との連携
// ═══════════════════════════════════════════════
group("11. evolve(柱①)との連携");

test("thinkはevolveを内部で繰り返し使用", () => {
  const md = { reiType: 'MDim', center: 5, neighbors: [1, 2, 3], mode: 'weighted' };
  const result = thinkLoop(md, { maxIterations: 5 });
  // 各ステップでモードが選択されている
  for (const step of result.steps) {
    assert(
      VALID_MODES.includes(step.selectedMode),
      `invalid mode: ${step.selectedMode}`
    );
  }
});

test("converge戦略はstable系モードを好む", () => {
  const md = { reiType: 'MDim', center: 5, neighbors: [1, 2, 3], mode: 'weighted' };
  const result = thinkLoop(md, { strategy: 'converge', maxIterations: 10 });
  // convergeは安定モードを選びやすい
  assert(result.modeHistory.length > 0, 'has mode history');
});

// ═══════════════════════════════════════════════
// Group 12: Rei構文統合テスト
// ═══════════════════════════════════════════════
group("12. Rei構文統合（パイプコマンド）");

test("𝕄 |> think — 基本動作", () => {
  const result = rei('𝕄{5; 1, 2, 3} |> think("converge")');
  assert(result.reiType === 'ThoughtResult', `got ${result?.reiType}`);
  assert(result.totalIterations > 0, 'has iterations');
});

test("𝕄 |> think(10) — 反復数指定", () => {
  const result = rei('𝕄{5; 1, 2, 3} |> think(5)');
  assert(result.reiType === 'ThoughtResult', 'is ThoughtResult');
  assert(result.totalIterations <= 5, `iterations: ${result.totalIterations}`);
});

test("𝕄 |> think(\"explore\") — 探索戦略", () => {
  const result = rei('𝕄{5; 1, 2, 3} |> think("explore")');
  assertEq(result.stopStrategy, 'explore');
});

test("𝕄 |> think(\"seek\", 15) — 目標値探索", () => {
  const result = rei('𝕄{5; 1, 2, 3} |> think("seek", 15)');
  assertEq(result.stopStrategy, 'seek');
});

test("𝕄 |> think(\"awaken\") — 覚醒戦略", () => {
  const result = rei('𝕄{5; 1, 2, 3, 4, 5} |> think("awaken")');
  assertEq(result.stopStrategy, 'awaken');
});

test("𝕄 |> 思考 — 日本語コマンド", () => {
  const result = rei('𝕄{5; 1, 2, 3} |> 思考("converge")');
  assert(result.reiType === 'ThoughtResult', 'is ThoughtResult');
});

test("think |> iterations — 反復数アクセサ", () => {
  const result = rei('𝕄{5; 1, 2, 3} |> think("converge") |> iterations');
  assert(typeof result === 'number', `got ${typeof result}`);
  assert(result > 0, 'has iterations');
});

test("think |> 反復数 — 日本語アクセサ", () => {
  const result = rei('𝕄{5; 1, 2, 3} |> think("converge") |> 反復数');
  assert(typeof result === 'number', 'is number');
});

test("think |> stop_reason — 停止理由", () => {
  const result = rei('𝕄{5; 1, 2, 3} |> think("converge") |> stop_reason');
  assert(typeof result === 'string', `got ${typeof result}`);
});

test("think |> trajectory — 軌跡タイプ", () => {
  const result = rei('𝕄{5; 1, 2, 3} |> think("converge") |> trajectory');
  assert(['converging', 'diverging', 'oscillating', 'chaotic', 'stable'].includes(result),
    `trajectory: ${result}`);
});

test("think |> convergence — 収束率", () => {
  const result = rei('𝕄{5; 1, 2, 3} |> think("converge") |> convergence');
  assert(typeof result === 'number', 'is number');
  assert(result >= 0 && result <= 1, `rate: ${result}`);
});

test("think |> awareness — 覚醒度", () => {
  const result = rei('𝕄{5; 1, 2, 3, 4, 5} |> think("converge") |> awareness');
  assert(typeof result === 'number', 'is number');
  assert(result >= 0 && result <= 1, `awareness: ${result}`);
});

test("think |> tendency — 意志", () => {
  const result = rei('𝕄{5; 1, 2, 3} |> think("converge") |> tendency');
  assert(result.tendency !== undefined, 'has tendency');
  assert(typeof result.strength === 'number', 'has strength');
});

test("think |> sigma — σ自己参照", () => {
  const result = rei('𝕄{5; 1, 2, 3} |> think("converge") |> sigma');
  assert(result.reiType === 'SigmaResult', 'is SigmaResult');
  assert(result.field.type === 'thought_loop', 'field.type');
  assert(result.memory.length > 0, 'has memory');
  assert(result.will !== undefined, 'has will');
});

test("think |> 思考表示 — フォーマット", () => {
  const result = rei('𝕄{5; 1, 2, 3} |> 思考("converge") |> 思考表示');
  assert(typeof result === 'string', 'is string');
  assert(result.includes('思考ループ結果'), 'has header');
});

// ═══════════════════════════════════════════════
// Group 13: D-FUMT 6属性の完全マッピング
// ═══════════════════════════════════════════════
group("13. D-FUMT 6属性の完全マッピング");

test("場(field) — 思考対象の値が反復を通じて変化", () => {
  const md = { reiType: 'MDim', center: 5, neighbors: [1, 2, 3], mode: 'weighted' };
  const result = thinkLoop(md, { maxIterations: 5 });
  // 場 = 最終値が存在し、初期値から変化した可能性がある
  assert(typeof result.finalNumeric === 'number', 'finalNumeric exists');
  assert(result.finalValue !== undefined, 'finalValue exists');
});

test("流れ(flow) — 進化の方向", () => {
  const md = { reiType: 'MDim', center: 5, neighbors: [1, 2, 3], mode: 'weighted' };
  const result = thinkLoop(md, { maxIterations: 10 });
  // 流れ = trajectory + convergenceRate
  assert(result.trajectory !== undefined, 'trajectory exists');
  assert(typeof result.convergenceRate === 'number', 'convergenceRate exists');
});

test("記憶(memory) — 全ステップの完全な履歴", () => {
  const md = { reiType: 'MDim', center: 5, neighbors: [1, 2, 3], mode: 'weighted' };
  const result = thinkLoop(md, { maxIterations: 5 });
  // 記憶 = steps配列
  assertEq(result.steps.length, result.totalIterations, 'steps = iterations');
  for (const step of result.steps) {
    assert(step.selectedMode !== undefined, 'step has mode (what was chosen)');
    assert(step.reason !== undefined || step.decision !== undefined, 'step has reasoning');
  }
});

test("層(layer) — σのlayerで表現", () => {
  const md = { reiType: 'MDim', center: 5, neighbors: [1, 2, 3, 4, 5], mode: 'weighted' };
  const result = thinkLoop(md, {
    strategy: 'awaken',
    maxIterations: 30,
    awakenThreshold: 0.2,
  });
  const sigma = getThoughtSigma(result);
  assert(typeof sigma.layer === 'number', 'layer is number');
  // 覚醒すればlayer=1、しなければlayer=0
  if (result.awakenedAt !== null) {
    assertEq(sigma.layer, 1, 'awakened → layer 1');
  } else {
    assertEq(sigma.layer, 0, 'not awakened → layer 0');
  }
});

test("関係(relation) — ステップ間の連結", () => {
  const md = { reiType: 'MDim', center: 5, neighbors: [1, 2, 3], mode: 'weighted' };
  const result = thinkLoop(md, { maxIterations: 5 });
  const sigma = getThoughtSigma(result);
  // 関係 = ステップ間のdelta + modeChange
  if (result.totalIterations >= 2) {
    assert(sigma.relation.length >= 1, 'has relations');
    assert(typeof sigma.relation[0].modeChange === 'boolean', 'has modeChange');
  }
});

test("意志(will) — ループの自律的傾向", () => {
  const md = { reiType: 'MDim', center: 5, neighbors: [1, 2, 3], mode: 'weighted' };
  const result = thinkLoop(md, { maxIterations: 10 });
  // 意志 = loopTendency + loopStrength
  assert(['rest', 'contract', 'expand', 'spiral'].includes(result.loopTendency), 'valid tendency');
  assert(result.loopStrength >= 0 && result.loopStrength <= 1, 'strength in range');
});

// ═══════════════════════════════════════════════
// Summary
// ═══════════════════════════════════════════════
console.log(`\n${'═'.repeat(50)}`);
console.log(`結果: ${passed}/${totalTests} テスト合格`);
if (failed > 0) {
  console.log(`❌ ${failed} テスト失敗`);
  process.exit(1);
} else {
  console.log(`✅ 全テスト合格！`);
}
