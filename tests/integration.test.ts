// ============================================================
// Rei v0.3 Integration Tests
// Tests full pipeline: Rei syntax → Lexer → Parser → Evaluator
// Covers both v0.2.1 backward compatibility and v0.3 new features
// ============================================================

import { Lexer } from '../src/lang/lexer';
import { Parser } from '../src/lang/parser';
import { Evaluator } from '../src/lang/evaluator';

// --- Test Runner ---
let passed = 0;
let failed = 0;

const evaluator = new Evaluator();

function run(code: string): any {
  const lexer = new Lexer(code);
  const tokens = lexer.tokenize();
  const parser = new Parser(tokens);
  const ast = parser.parseProgram();
  return evaluator.eval(ast);
}

function reset() {
  Object.assign(evaluator, new Evaluator());
}

function assert(condition: boolean, message: string) {
  if (condition) { passed++; console.log(`  ✅ ${message}`); }
  else { failed++; console.log(`  ❌ ${message}`); }
}

function assertEq(actual: any, expected: any, message: string) {
  if (typeof actual === 'number' && typeof expected === 'number') {
    assert(Math.abs(actual - expected) < 0.01, `${message} (${actual} ≈ ${expected})`);
  } else {
    assert(actual === expected, `${message} (${JSON.stringify(actual)} === ${JSON.stringify(expected)})`);
  }
}

function section(name: string) {
  console.log(`\n─── ${name} ───`);
  reset();
}

// ════════════════════════════════════
// PART 1: v0.2.1 BACKWARD COMPATIBILITY
// ════════════════════════════════════

section('1. 基本演算（v0.2.1互換）');
assertEq(run('2 + 3'), 5, '加算');
assertEq(run('10 - 4'), 6, '減算');
assertEq(run('3 * 7'), 21, '乗算');
assertEq(run('15 / 3'), 5, '除算');
assertEq(run('2 + 3 * 4'), 14, '優先順位');

section('2. 変数束縛（v0.2.1互換）');
run('let x = 42');
assertEq(run('x'), 42, 'let束縛');
run('let mut y = 10');
assertEq(run('y'), 10, 'mut束縛');

section('3. MDim計算（v0.2.1互換）');
{
  const r = run('𝕄{5; 1, 2, 3, 4} |> compute :weighted');
  assertEq(r, 7.5, '𝕄 weighted compute');
}
{
  run('let m = 𝕄{5; 1, 2, 3, 4}');
  assertEq(run('m |> center'), 5, 'MDim center');
  assertEq(run('m |> dim'), 4, 'MDim dim');
  const ns = run('m |> neighbors');
  assert(Array.isArray(ns) && ns.length === 4, 'MDim neighbors');
}

section('4. 拡張数（v0.2.1互換）');
{
  run('let z = 0ooo');
  assertEq(run('z |> order'), 3, '拡張数 order');
}

section('5. compress関数（v0.2.1互換）');
{
  run('compress double(x) = x * 2');
  assertEq(run('double(5)'), 10, 'compress関数呼び出し');
  run('compress energy(m) = m |> compute :weighted');
  assertEq(run('energy(𝕄{0; 10, 20, 30})'), 20, 'compress + MDim');
}

section('6. Genesis公理系（v0.2.1互換）');
{
  run('let g = genesis()');
  run('g |> forward');
  run('g |> forward');
  assertEq(run('g |> phase'), 'line', 'Genesis phase');
}

section('7. 四価論理（v0.2.1互換）');
assertEq(run('⊤').value, 'top', '⊤');
assertEq(run('⊥').value, 'bottom', '⊥');
assertEq(run('¬⊤').value, 'bottom', '¬⊤ = ⊥');

section('8. パイプ演算（v0.2.1互換）');
assertEq(run('-25 |> abs'), 25, 'abs');
assertEq(run('-25 |> abs |> sqrt'), 5, 'chained pipe');
assertEq(run('"hello" |> upper'), 'HELLO', 'string upper');
assertEq(run('[3,1,2] |> sort |> first'), 1, 'array sort + first');

section('9. if/match式（v0.2.1互換）');
assertEq(run('if 1 > 0 then 42 else 0'), 42, 'if true');
assertEq(run('if 0 > 1 then 42 else 0'), 0, 'if false');
assertEq(run('match 2 { case 1 -> "one", case 2 -> "two", case 3 -> "three" }'), 'two', 'match');

// ════════════════════════════════════
// PART 2: v0.3 SPACE-LAYER-DIFFUSION
// ════════════════════════════════════

section('10. 空（Space）リテラルの生成');
{
  run('let s = space{ layer 0: 𝕄{5; 1, 2, 3, 4} }');
  const s = run('s');
  assert(s && s.reiType === 'Space', 'space リテラルでSpace型が生成される');
  assertEq(s.layers.size, 1, '1つの層');
}

section('11. 空リテラル — 複数層');
{
  run(`let s = space{
    layer 0: 𝕄{5; 1, 2, 3, 4}, 𝕄{10; 3, 7}
    layer 1: 𝕄{0; 1, -1}
  }`);
  const s = run('s');
  assertEq(s.layers.size, 2, '2つの層');
  assertEq(s.layers.get(0).nodes.length, 2, '層0に2ノード');
  assertEq(s.layers.get(1).nodes.length, 1, '層1に1ノード');
}

section('12. Unicode 空/層 構文');
{
  run('let s = 空{ 層 0: 𝕄{5; 1, 2, 3, 4} }');
  const s = run('s');
  assert(s && s.reiType === 'Space', '空{ 層 } でSpace型が生成される');
  assertEq(s.layers.get(0).nodes.length, 1, '層0に1ノード');
}

section('13. step — 1段階拡散');
{
  run('let s = space{ layer 0: 𝕄{5; 1, 2, 3, 4} }');
  run('s |> step');
  const node = run('s |> node(0, 0)');
  assertEq(node.stage, 1, 'step後: 段階1');
  assertEq(node.neighbors.length, 8, 'step後: 4→8方向');
}

section('14. step — 複数回');
{
  run('let s = space{ layer 0: 𝕄{0; 1, 2, 3, 4, 5, 6, 7, 8} }');
  run('s |> step');
  run('s |> step');
  run('s |> step');
  const node = run('s |> node(0, 0)');
  assertEq(node.stage, 3, '3回step: 段階3');
  assertEq(node.neighbors.length, 64, '8→16→32→64 方向');
}

section('15. diffuse — 段階数制限');
{
  run('let s = space{ layer 0: 𝕄{5; 1, 2, 3, 4} }');
  const results = run('s |> diffuse(5)');
  assert(Array.isArray(results), 'diffuse結果は配列');
  assert(typeof results[0] === 'number', '結果は数値');
  const node = run('s |> node(0, 0)');
  assert(node.stage >= 5, '5段階以上拡散');
}

section('16. diffuse — 収束まで');
{
  run('let s = space{ layer 0: 𝕄{5; 2, 2, 2, 2} }');
  const results = run('s |> diffuse("converged")');
  const node = run('s |> node(0, 0)');
  assertEq(node.momentum, 'converged', '収束完了');
}

section('17. 複数ノード同時拡散');
{
  run(`let s = space{
    layer 0: 𝕄{5; 1, 2, 3, 4}, 𝕄{10; 3, 7, 2}, 𝕄{-3; 8, 1, 5}
  }`);
  const results = run('s |> diffuse(3)');
  assertEq(results.length, 3, '3ノードの結果');
}

section('18. sigma — ノードの自己参照（公理C1）');
{
  run('let s = space{ layer 0: 𝕄{5; 1, 2, 3, 4} }');
  run('s |> step');
  run('s |> step');

  const sigma = run('s |> node(0, 0) |> sigma');
  assert(sigma && sigma.reiType === 'SigmaResult', 'sigma結果');

  const flow = run('s |> node(0, 0) |> sigma |> flow');
  assertEq(flow.stage, 2, 'σ.flow.stage = 2');
  assertEq(flow.directions, 16, 'σ.flow.directions = 16');

  const memory = run('s |> node(0, 0) |> sigma |> memory');
  assertEq(memory.length, 3, 'σ.memory: 3エントリ');

  const layer = run('s |> node(0, 0) |> sigma |> layer');
  assertEq(layer, 0, 'σ.layer = 0');
}

section('19. sigma.flow のメンバーアクセス');
{
  run('let s = space{ layer 0: 𝕄{5; 1, 2, 3, 4} }');
  run('s |> step');

  const stage = run('(s |> node(0, 0) |> sigma |> flow).stage');
  assertEq(stage, 1, 'σ.flow.stage via member access');

  const momentum = run('(s |> node(0, 0) |> sigma |> flow).momentum');
  assertEq(momentum, 'expanding', 'σ.flow.momentum = expanding');
}

section('20. sigma.will — 傾向性（公理C2）');
{
  run('let s = space{ layer 0: 𝕄{5; 1, 2, 3, 4} }');
  // 複数段階拡散して傾向性を蓄積
  for (let i = 0; i < 6; i++) run('s |> step');

  const will = run('s |> node(0, 0) |> sigma |> will');
  assert(
    ['contract', 'expand', 'spiral', 'rest'].includes(will.tendency),
    `σ.will.tendency: "${will.tendency}"`
  );
  assert(will.history.length === 6, 'σ.will.history: 6エントリ');
}

section('21. 場全体のsigma');
{
  run(`let s = space{
    layer 0: 𝕄{5; 1, 2, 3, 4}, 𝕄{10; 3, 7}
    layer 1: 𝕄{0; 1, -1}
  }`);

  const sigma = run('s |> sigma');
  assertEq(sigma.field.layers, 2, 'Space σ.field.layers = 2');
  assertEq(sigma.field.total_nodes, 3, 'Space σ.field.total_nodes = 3');
}

section('22. freeze/thaw — 層の凍結と解凍');
{
  run(`let s = space{
    layer 0: 𝕄{5; 1, 2, 3, 4}
    layer 1: 𝕄{10; 3, 7, 2}
  }`);

  run('s |> freeze(0)');
  run('s |> step');

  const node0 = run('s |> node(0, 0)');
  const node1 = run('s |> node(1, 0)');
  assertEq(node0.stage, 0, '凍結した層0: 段階0のまま');
  assertEq(node1.stage, 1, '層1: 段階1に進む');

  run('s |> thaw(0)');
  run('s |> step');

  const node0b = run('s |> node(0, 0)');
  assertEq(node0b.stage, 1, '解凍後の層0: 段階1に進む');
}

section('23. spawn — ノードの動的追加');
{
  run('let s = space{ layer 0: 𝕄{5; 1, 2, 3, 4} }');
  run('s |> spawn(𝕄{10; 3, 7}, 0)');

  const s = run('s');
  assertEq(s.layers.get(0).nodes.length, 2, 'spawn後: 層0に2ノード');
}

section('24. result — 結果取得');
{
  run('let s = space{ layer 0: 𝕄{5; 1, 2, 3, 4} }');
  const r = run('s |> result(0)');
  assert(typeof r === 'number', 'result: 数値を返す');
}

section('25. resonances — 共鳴検出（公理C5）');
{
  run(`let s = space{
    layer 0: 𝕄{5; 1, 2, 3, 4}
    layer 2: 𝕄{5.1; 1.1, 2, 3, 4}
  }`);

  const pairs = run('s |> resonances(0.5)');
  assert(Array.isArray(pairs), '共鳴ペアは配列');
  assert(pairs.length >= 1, '類似ノード間に共鳴を検出');
  if (pairs.length > 0) {
    assert(pairs[0].similarity > 0.8, `高い類似度: ${pairs[0].similarity}`);
  }
}

section('26. DNode extract — MDim互換');
{
  run('let s = space{ layer 0: 𝕄{5; 1, 2, 3, 4} }');
  const extracted = run('s |> node(0, 0) |> extract');
  assertEq(extracted.reiType, 'MDim', 'extract → MDim型');
  assertEq(extracted.center, 5, 'extract: center保持');
  assertEq(run('(s |> node(0, 0) |> extract) |> compute :weighted'), 7.5, 'extract後のcompute');
}

section('27. DNode compute');
{
  run('let s = space{ layer 0: 𝕄{5; 1, 2, 3, 4} }');
  const v = run('s |> node(0, 0) |> compute');
  assertEq(v, 7.5, 'DNode compute = MDim compute');
}

section('28. 拡散方向倍増パターンの構文検証');
{
  run('let s = space{ layer 0: 𝕄{0; 1, 2, 3, 4, 5, 6, 7, 8} }');
  run('s |> step');
  assertEq(run('(s |> node(0, 0)).neighbors.length'), 16, '8→16');
  run('s |> step');
  assertEq(run('(s |> node(0, 0)).neighbors.length'), 32, '16→32');
  run('s |> step');
  assertEq(run('(s |> node(0, 0)).neighbors.length'), 64, '32→64');
}

section('29. 複合パイプライン');
{
  run(`let s = space{
    layer 0: 𝕄{5; 1, 2, 3, 4}
    layer 1: 𝕄{10; 3, 7, 2}
  }`);
  // step → freeze → step → thaw → diffuse
  run('s |> step');
  run('s |> freeze(0)');
  run('s |> step');
  run('s |> step');
  run('s |> thaw(0)');
  const results = run('s |> diffuse(3)');
  assert(Array.isArray(results) && results.length === 2, '2ノードの結果');
}

section('30. v0.2.1 + v0.3 混在コード');
{
  // 従来のMDimと新しいSpaceが同じプログラム内で共存
  run('let m = 𝕄{5; 1, 2, 3, 4}');
  run('let direct = m |> compute :weighted');
  assertEq(run('direct'), 7.5, '従来のMDim compute');

  run('let s = space{ layer 0: 𝕄{5; 1, 2, 3, 4} }');
  run('let via_space = s |> node(0, 0) |> compute');
  assertEq(run('via_space'), 7.5, 'Space経由のcompute');

  // compress関数でSpaceを扱う
  run('compress make_space(c, n1, n2, n3, n4) = space{ layer 0: 𝕄{c; n1, n2, n3, n4} }');
  run('let s2 = make_space(100, 10, 20, 30, 40)');
  assert(run('s2').reiType === 'Space', 'compress関数でSpace生成');
}

// ════════════════════════════════════
// SUMMARY
// ════════════════════════════════════

console.log('\n════════════════════════════════════');
console.log(`  結果: ${passed} passed, ${failed} failed, ${passed + failed} total`);
console.log('════════════════════════════════════');

if (failed > 0) process.exit(1);
