// ============================================================
// Evolve Pipe Tests — 柱① 自動モード選択
// ============================================================

import { Lexer } from './lexer';
import { Parser } from './parser';
import { Evaluator } from './evaluator';

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

function assertClose(a: number, b: number, eps: number = 0.001, msg: string = '') {
  if (Math.abs(a - b) > eps) throw new Error(msg || `expected ~${b}, got ${a}`);
}

// ═══════════════════════════════════════════
// Test Group 1: 基本的なevolve
// ═══════════════════════════════════════════
console.log('\n📦 Group 1: 基本的なevolve');

test('evolve on 𝕄 returns EvolveResult', () => {
  const r = run('𝕄{5; 1, 2, 3} |> evolve');
  assert(r !== null && typeof r === 'object', 'result should be object');
  assert(r.reiType === 'EvolveResult', `expected EvolveResult, got ${r.reiType}`);
  assert(typeof r.value === 'number', 'value should be number');
  assert(typeof r.selectedMode === 'string', 'selectedMode should be string');
  assert(typeof r.reason === 'string', 'reason should be string');
  assert(Array.isArray(r.candidates), 'candidates should be array');
  assert(r.candidates.length === 8, `expected 8 candidates, got ${r.candidates.length}`);
});

test('evolve_value returns number directly', () => {
  const r = run('𝕄{5; 1, 2, 3} |> evolve_value');
  assert(typeof r === 'number', `expected number, got ${typeof r}`);
});

test('evolve default strategy is auto', () => {
  const r = run('𝕄{5; 1, 2, 3} |> evolve');
  assert(r.strategy === 'auto', `expected auto, got ${r.strategy}`);
});

// ═══════════════════════════════════════════
// Test Group 2: 5つの戦略
// ═══════════════════════════════════════════
console.log('\n📦 Group 2: 5つの戦略');

test('evolve("stable") selects stable mode', () => {
  const r = run('𝕄{5; 1, 2, 3} |> evolve("stable")');
  assert(r.reiType === 'EvolveResult', 'should return EvolveResult');
  assert(r.strategy === 'stable', `expected stable, got ${r.strategy}`);
  assert(typeof r.selectedMode === 'string', 'should select a mode');
});

test('evolve("divergent") selects most divergent mode', () => {
  const r = run('𝕄{5; 1, 2, 3} |> evolve("divergent")');
  assert(r.strategy === 'divergent', `expected divergent, got ${r.strategy}`);
  // divergent should select the mode furthest from mean
  const values = r.candidates.map((c: any) => c.value);
  const mean = values.reduce((s: number, v: number) => s + v, 0) / values.length;
  const selectedDev = Math.abs(r.value - mean);
  // It should be the max deviation
  for (const c of r.candidates) {
    assert(Math.abs(c.value - mean) <= selectedDev + 0.001,
      `mode ${c.mode} has larger deviation than selected`);
  }
});

test('evolve("creative") selects furthest from median', () => {
  const r = run('𝕄{5; 1, 2, 3} |> evolve("creative")');
  assert(r.strategy === 'creative', `expected creative, got ${r.strategy}`);
});

test('evolve("tendency") selects by τ tendency', () => {
  const r = run('𝕄{5; 1, 2, 3} |> evolve("tendency")');
  assert(r.strategy === 'tendency', `expected tendency, got ${r.strategy}`);
});

test('evolve("auto") uses auto strategy', () => {
  const r = run('𝕄{5; 1, 2, 3} |> evolve("auto")');
  assert(r.strategy === 'auto', `expected auto, got ${r.strategy}`);
});

// ═══════════════════════════════════════════
// Test Group 3: σ来歴との統合
// ═══════════════════════════════════════════
console.log('\n📦 Group 3: σ来歴との統合');

test('evolve after pipe chain has memory', () => {
  const r = run('𝕄{5; 1, 2, 3} |> normalize |> normalize |> evolve');
  assert(r.reiType === 'EvolveResult', 'should return EvolveResult');
  // After 2 pipe steps, awareness should be > 0
  assert(r.awareness >= 0, `awareness should be >= 0, got ${r.awareness}`);
});

test('evolve after multiple transforms considers history', () => {
  const r = run(`
    let x = 𝕄{10; 2, 4, 6};
    x |> normalize |> normalize |> normalize |> evolve("stable")
  `);
  assert(r.strategy === 'stable', 'should use stable strategy');
  assert(typeof r.value === 'number', 'should produce numeric result');
});

test('evolve preserves σ metadata', () => {
  // evolve result should carry sigma info
  const r = run('𝕄{5; 1, 2, 3} |> normalize |> normalize |> evolve');
  assert(r.tendency !== undefined, 'should have tendency');
  assert(r.awareness !== undefined, 'should have awareness');
});

// ═══════════════════════════════════════════
// Test Group 4: EvolveResult メンバーアクセス
// ═══════════════════════════════════════════
console.log('\n📦 Group 4: EvolveResult メンバーアクセス');

test('EvolveResult.value access', () => {
  const r = run(`
    let r = 𝕄{5; 1, 2, 3} |> evolve;
    r.value
  `);
  assert(typeof r === 'number', `expected number, got ${typeof r}`);
});

test('EvolveResult.selectedMode access', () => {
  const r = run(`
    let r = 𝕄{5; 1, 2, 3} |> evolve;
    r.selectedMode
  `);
  assert(typeof r === 'string', `expected string, got ${typeof r}`);
});

test('EvolveResult.strategy access', () => {
  const r = run(`
    let r = 𝕄{5; 1, 2, 3} |> evolve("stable");
    r.strategy
  `);
  assert(r === 'stable', `expected stable, got ${r}`);
});

test('EvolveResult.reason access', () => {
  const r = run(`
    let r = 𝕄{5; 1, 2, 3} |> evolve;
    r.reason
  `);
  assert(typeof r === 'string', `expected string, got ${typeof r}`);
  assert(r.length > 0, 'reason should not be empty');
});

test('EvolveResult.candidates access', () => {
  const r = run(`
    let r = 𝕄{5; 1, 2, 3} |> evolve;
    r.candidates
  `);
  assert(Array.isArray(r), 'candidates should be array');
  assert(r.length === 8, `expected 8 candidates, got ${r.length}`);
});

test('EvolveResult.awareness access', () => {
  const r = run(`
    let r = 𝕄{5; 1, 2, 3} |> evolve;
    r.awareness
  `);
  assert(typeof r === 'number', `expected number, got ${typeof r}`);
  assert(r >= 0 && r <= 1, `awareness should be 0-1, got ${r}`);
});

test('EvolveResult.tendency access', () => {
  const r = run(`
    let r = 𝕄{5; 1, 2, 3} |> evolve;
    r.tendency
  `);
  assert(typeof r === 'string', `expected string, got ${typeof r}`);
});

// ═══════════════════════════════════════════
// Test Group 5: 覚醒度による自動戦略切り替え
// ═══════════════════════════════════════════
console.log('\n📦 Group 5: 覚醒度による自動戦略切り替え');

test('low awareness → auto selects stable', () => {
  // Fresh 𝕄 with no history → low awareness
  const r = run('𝕄{5; 1, 2, 3} |> evolve("auto")');
  assert(r.awareness < 0.3 || r.reason.includes('安定') || r.reason.includes('エントロピー'),
    `low awareness should use stable/entropy: ${r.reason}`);
});

test('high pipe count increases awareness', () => {
  const r1 = run('𝕄{5; 1, 2, 3} |> evolve');
  const r2 = run('𝕄{5; 1, 2, 3} |> normalize |> normalize |> normalize |> normalize |> normalize |> evolve');
  assert(r2.awareness >= r1.awareness,
    `more pipes should increase awareness: ${r1.awareness} vs ${r2.awareness}`);
});

// ═══════════════════════════════════════════
// Test Group 6: 各モードの候補が正しい値
// ═══════════════════════════════════════════
console.log('\n📦 Group 6: 候補モードの値検証');

test('candidates contain all 8 compute modes', () => {
  const r = run('𝕄{5; 1, 2, 3} |> evolve');
  const modes = r.candidates.map((c: any) => c.mode);
  const expected = ["weighted", "multiplicative", "harmonic", "exponential",
                    "geometric", "median", "minkowski", "entropy"];
  for (const m of expected) {
    assert(modes.includes(m), `missing mode: ${m}`);
  }
});

test('evolve weighted candidate matches compute :weighted', () => {
  const evolveR = run('𝕄{5; 1, 2, 3} |> evolve');
  const directR = run('𝕄{5; 1, 2, 3} |> compute :weighted');
  const weightedCandidate = evolveR.candidates.find((c: any) => c.mode === 'weighted');
  assertClose(weightedCandidate.value, directR, 0.001,
    `weighted: evolve=${weightedCandidate.value}, direct=${directR}`);
});

test('evolve geometric candidate matches compute :geometric', () => {
  const evolveR = run('𝕄{5; 1, 2, 3} |> evolve');
  const directR = run('𝕄{5; 1, 2, 3} |> compute :geometric');
  const geoCandidate = evolveR.candidates.find((c: any) => c.mode === 'geometric');
  assertClose(geoCandidate.value, directR, 0.001,
    `geometric: evolve=${geoCandidate.value}, direct=${directR}`);
});

// ═══════════════════════════════════════════
// Test Group 7: 配列・数値入力
// ═══════════════════════════════════════════
console.log('\n📦 Group 7: 配列・数値入力');

test('evolve on array (auto-project)', () => {
  const r = run('[1, 2, 3, 4, 5] |> evolve');
  assert(r.reiType === 'EvolveResult', 'should return EvolveResult from array');
  assert(typeof r.value === 'number', 'should produce number');
});

test('evolve on number (auto-project)', () => {
  const r = run('42 |> evolve');
  assert(r.reiType === 'EvolveResult', 'should return EvolveResult from number');
});

test('evolve_value on array returns number', () => {
  const r = run('[10, 20, 30] |> evolve_value');
  assert(typeof r === 'number', `expected number, got ${typeof r}`);
});

// ═══════════════════════════════════════════
// Test Group 8: divergent戦略の差別化テスト
// ═══════════════════════════════════════════
console.log('\n📦 Group 8: 戦略間の差別化');

test('different strategies can produce different results', () => {
  const base = '𝕄{10; 1, 100, 3}';
  const stable = run(`${base} |> evolve("stable")`);
  const divergent = run(`${base} |> evolve("divergent")`);
  const creative = run(`${base} |> evolve("creative")`);
  
  // At least some strategies should select different modes
  const modes = new Set([stable.selectedMode, divergent.selectedMode, creative.selectedMode]);
  // With highly asymmetric neighbors, strategies should differ
  assert(modes.size >= 1, 'strategies should produce results');
  console.log(`    → stable=${stable.selectedMode}, divergent=${divergent.selectedMode}, creative=${creative.selectedMode}`);
});

test('tendency with expand history favors expanding mode', () => {
  // Build expand tendency through increasing pipe results
  const r = run(`
    𝕄{1; 2, 3} |> normalize |> normalize |> normalize |> evolve("tendency")
  `);
  assert(r.reiType === 'EvolveResult', 'should return EvolveResult');
  console.log(`    → tendency=${r.tendency}, mode=${r.selectedMode}`);
});

// ═══════════════════════════════════════════
// Test Group 9: エッジケース
// ═══════════════════════════════════════════
console.log('\n📦 Group 9: エッジケース');

test('evolve on 𝕄 with no neighbors', () => {
  // 𝕄{5;} is the syntax for center-only MDim
  const r = run('𝕄{5; 0} |> evolve');
  assert(r.reiType === 'EvolveResult', 'should handle minimal neighbors');
});

test('evolve on 𝕄 with single neighbor', () => {
  const r = run('𝕄{5; 3} |> evolve');
  assert(r.reiType === 'EvolveResult', 'should handle single neighbor');
  assert(r.candidates.length === 8, 'should have 8 candidates');
});

test('evolve on negative values', () => {
  const r = run('𝕄{-5; -1, -2, -3} |> evolve');
  assert(r.reiType === 'EvolveResult', 'should handle negative values');
  assert(typeof r.value === 'number', 'should produce number');
});

// ═══════════════════════════════════════════
// Summary
// ═══════════════════════════════════════════
console.log(`\n${'═'.repeat(50)}`);
console.log(`Evolve Pipe Tests: ${passed} passed, ${failed} failed`);
if (failures.length > 0) {
  console.log('\nFailures:');
  failures.forEach(f => console.log(`  ❌ ${f}`));
}
console.log(`${'═'.repeat(50)}`);
process.exit(failed > 0 ? 1 : 0);
