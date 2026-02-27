// ============================================================
// spiral-number.test.ts — 螺旋数体系テストスイート
//
// τ² = -1 + ε の厳密なテストと既存体系との差異検証
//
// @author Nobuki Fujimoto (D-FUMT / 0₀式)
// ============================================================

import {
  computeAB,
  classifyRegion,
  createSpiral,
  fromComplex,
  fromCartesian3D,
  add,
  subtract,
  multiply,
  divide,
  conjugate,
  norm,
  magnitude,
  differentiate,
  integrate,
  transitionEpsilon,
  toComplex,
  toMDimNeighbors,
  fromMDim,
  spiralTraversal,
  compareWithSystems,
  spiralSigma,
  isSpiralNumber,
  isSpiralTrajectory,
  unitReal,
  unitImaginary,
  goldenSpiral,
  logarithmicSpiral,
  type SpiralNumber,
} from '../extensions/spiral-number';

// ============ テストランナー ============

let passed = 0;
let failed = 0;
let total = 0;

function assert(condition: boolean, message: string) {
  total++;
  if (condition) {
    passed++;
    console.log(`  ✅ ${message}`);
  } else {
    failed++;
    console.log(`  ❌ ${message}`);
  }
}

function assertClose(actual: number, expected: number, message: string, epsilon = 1e-6) {
  assert(
    Math.abs(actual - expected) < epsilon,
    `${message} (actual: ${actual}, expected: ${expected})`
  );
}

function section(name: string) {
  console.log(`\n─── ${name} ───`);
}

// ============================================================
// 1. A(s), B(s) 基底関数
// ============================================================

section('1. 基底関数 A(s), B(s)');

// 1.1 楕円領域: ε=0 (純虚数) → cos/sin
(() => {
  const { A, B } = computeAB(0, 0);
  assertClose(A, 1, 'ε=0, s=0: A=cos(0)=1');
  assertClose(B, 0, 'ε=0, s=0: B=sin(0)/1=0');
})();

(() => {
  const { A, B } = computeAB(Math.PI / 2, 0);
  assertClose(A, 0, 'ε=0, s=π/2: A=cos(π/2)≈0', 1e-10);
  // ω=√(1-0)=1, B=sin(1·π/2)/1=1
  assertClose(B, 1, 'ε=0, s=π/2: B=sin(π/2)/1=1', 1e-10);
})();

// 1.2 放物領域: ε=1
(() => {
  const { A, B } = computeAB(3.5, 1);
  assertClose(A, 1, 'ε=1: A=1 (常に)');
  assertClose(B, 3.5, 'ε=1, s=3.5: B=s=3.5');
})();

// 1.3 双曲領域: ε=2
(() => {
  const { A, B } = computeAB(0, 2);
  assertClose(A, 1, 'ε=2, s=0: A=cosh(0)=1');
  assertClose(B, 0, 'ε=2, s=0: B=sinh(0)/1=0');
})();

(() => {
  const { A, B } = computeAB(1, 2);
  const kappa = 1; // √(2-1) = 1
  assertClose(A, Math.cosh(1), 'ε=2, s=1: A=cosh(1)');
  assertClose(B, Math.sinh(1), 'ε=2, s=1: B=sinh(1)/1');
})();

// 1.4 楕円 ε=0.5
(() => {
  const omega = Math.sqrt(0.5);
  const { A, B } = computeAB(1, 0.5);
  assertClose(A, Math.cos(omega), 'ε=0.5, s=1: A=cos(ω)');
  assertClose(B, Math.sin(omega) / omega, 'ε=0.5, s=1: B=sin(ω)/ω');
})();

// ============================================================
// 2. 領域分類
// ============================================================

section('2. 領域分類');

assert(classifyRegion(-1) === 'elliptic', 'ε=-1: 楕円');
assert(classifyRegion(0) === 'elliptic', 'ε=0: 楕円（純虚数）');
assert(classifyRegion(0.99) === 'elliptic', 'ε=0.99: 楕円');
assert(classifyRegion(1) === 'parabolic', 'ε=1: 放物');
assert(classifyRegion(1.01) === 'hyperbolic', 'ε=1.01: 双曲');
assert(classifyRegion(2) === 'hyperbolic', 'ε=2: 双曲');
assert(classifyRegion(3) === 'hyperbolic', 'ε=3: 双曲');

// ============================================================
// 3. 螺旋数の生成
// ============================================================

section('3. 螺旋数生成');

// 3.1 基本生成
(() => {
  const sp = createSpiral(1, 0, 0, 0);
  assert(sp.reiType === 'SpiralNumber', 'reiType = SpiralNumber');
  assertClose(sp.x, 1, 'r=1,θ=0,s=0,ε=0: x=1');
  assertClose(sp.y, 0, 'y=0');
  assertClose(sp.z, 0, 'z=0');
  assert(sp.region === 'elliptic', '領域: 楕円');
})();

// 3.2 ε=0 → 複素数と等価
(() => {
  const sp = createSpiral(1, Math.PI / 2, 0, 0);
  assertClose(sp.x, 0, 'i: x≈0', 1e-10);
  assertClose(sp.y, 1, 'i: y=1');
  assertClose(sp.z, 0, 'i: z=0');
})();

// 3.3 螺旋位相 s≠0 → 3次元に拡張
(() => {
  const sp = createSpiral(1, 0, 1, 0);
  assertClose(sp.x, Math.cos(1), 's=1,ε=0: x=cos(1)');
  assertClose(sp.z, Math.sin(1), 's=1,ε=0: z=sin(1)');
  assert(sp.z !== 0, 's≠0 で z≠0（3次元に拡張）');
})();

// 3.4 双曲領域
(() => {
  const sp = createSpiral(1, 0, 1, 2);
  assertClose(sp.x, Math.cosh(1), 'ε=2: x=cosh(1)');
  assertClose(sp.z, Math.sinh(1), 'ε=2: z=sinh(1)');
  assert(sp.region === 'hyperbolic', '領域: 双曲');
})();

// ============================================================
// 4. 複素数との互換性
// ============================================================

section('4. 複素数との互換性');

// 4.1 fromComplex
(() => {
  const sp = fromComplex(3, 4);
  assertClose(sp.r, 5, 'fromComplex(3,4): r=5');
  assertClose(sp.s, 0, 'fromComplex: s=0');
  assertClose(sp.epsilon, 0, 'fromComplex: ε=0');
  const c = toComplex(sp);
  assertClose(c.real, 3, 'toComplex: real=3');
  assertClose(c.imag, 4, 'toComplex: imag=4');
})();

// 4.2 往復変換の一貫性
(() => {
  const original = createSpiral(2, 1.5, 0, 0);
  const c = toComplex(original);
  const restored = fromComplex(c.real, c.imag);
  assertClose(restored.r, original.r, '往復変換: r保存', 1e-5);
  assertClose(restored.theta, original.theta, '往復変換: θ保存', 1e-5);
})();

// ============================================================
// 5. 四則演算
// ============================================================

section('5. 四則演算');

// 5.1 加法
(() => {
  const a = createSpiral(1, 0, 0, 0);    // = 1
  const b = createSpiral(1, 0, 0, 0);    // = 1
  const c = add(a, b);
  assertClose(c.x, 2, '1+1: x=2');
  assertClose(c.y, 0, '1+1: y=0');
})();

// 5.2 減法
(() => {
  const a = createSpiral(3, 0, 0, 0);
  const b = createSpiral(1, 0, 0, 0);
  const c = subtract(a, b);
  assertClose(c.x, 2, '3-1: x=2');
})();

// 5.3 乗法（極座標）
(() => {
  const a = createSpiral(2, Math.PI / 4, 0, 0);
  const b = createSpiral(3, Math.PI / 4, 0, 0);
  const c = multiply(a, b);
  assertClose(c.r, 6, '2×3: r=6');
  assertClose(c.theta, Math.PI / 2, 'π/4+π/4: θ=π/2');
})();

// 5.4 乗法の螺旋位相加算
(() => {
  const a = createSpiral(1, 0, 1, 0.5);
  const b = createSpiral(1, 0, 2, 0.5);
  const c = multiply(a, b);
  assertClose(c.s, 3, '乗法: s₁+s₂=3');
})();

// 5.5 除法
(() => {
  const a = createSpiral(6, Math.PI, 3, 0);
  const b = createSpiral(2, Math.PI / 2, 1, 0);
  const c = divide(a, b);
  assertClose(c.r, 3, '6/2: r=3');
  assertClose(c.theta, Math.PI / 2, 'π-π/2: θ=π/2');
  assertClose(c.s, 2, '3-1: s=2');
})();

// 5.6 零除算
(() => {
  const a = createSpiral(1, 0, 0, 0);
  const b = createSpiral(0, 0, 0, 0);
  const c = divide(a, b);
  assert(c.r === Infinity, '零除算: r=Infinity');
})();

// ============================================================
// 6. 共役とノルム
// ============================================================

section('6. 共役とノルム');

(() => {
  const sp = createSpiral(3, 1.2, 0.5, 0.3);
  const conj = conjugate(sp);
  assertClose(conj.r, sp.r, '共役: r保存');
  assertClose(conj.theta, -sp.theta, '共役: θ反転');
  assertClose(conj.s, -sp.s, '共役: s反転');
})();

(() => {
  const sp = createSpiral(3, 0, 0, 0);
  assertClose(norm(sp), 9, '|3|²=9');
  assertClose(magnitude(sp), 3, '|3|=3');
})();

// ============================================================
// 7. 微分・積分
// ============================================================

section('7. 微分・積分');

// 7.1 微分
(() => {
  const sp = createSpiral(1, 0, 0, 0);
  const dsp = differentiate(sp, 1.0, 0.5);
  assert(isSpiralNumber(dsp), '微分結果は螺旋数');
})();

// 7.2 積分（軌道生成）
(() => {
  const sp = createSpiral(1, 0, 0, 0);
  const traj = integrate(sp, 1, 0.1, 2 * Math.PI, 50);
  assert(isSpiralTrajectory(traj), '積分結果は軌道');
  assert(traj.points.length === 51, '51点（50ステップ+初期点）');
  assert(traj.arcLength > 0, '弧長 > 0');
})();

// ============================================================
// 8. 位相遷移
// ============================================================

section('8. 位相遷移（ε変化）');

// 8.1 楕円→双曲
(() => {
  const sp = createSpiral(1, 0, 1, 0);
  const traj = transitionEpsilon(sp, 2, 20);
  assert(traj.length === 21, '21点（20ステップ+初期点）');
  assert(traj[0].region === 'elliptic', '開始: 楕円');
  assert(traj[traj.length - 1].region === 'hyperbolic', '終了: 双曲');

  // 途中で放物を通過
  const hasParabolic = traj.some(s => s.region === 'parabolic');
  assert(hasParabolic, '途中に放物領域あり');
})();

// 8.2 遷移回数の記録
(() => {
  const sp = createSpiral(1, 0, 1, -0.5);
  const traj = transitionEpsilon(sp, 2.5, 100);
  const last = traj[traj.length - 1];
  assert(last.layer.regionTransitions >= 2, `遷移回数 = ${last.layer.regionTransitions}`);
})();

// ============================================================
// 9. MDim接続
// ============================================================

section('9. MDim接続');

// 9.1 toMDimNeighbors
(() => {
  const sp = createSpiral(2, 0, 0.5, 0);
  const mdim = toMDimNeighbors(sp, 8);
  assert(mdim.neighbors.length === 8, '8方向の近傍');
  assert(typeof mdim.center === 'number', 'center は数値');
  assert(mdim.mode === 'weighted', 'モード = weighted');
})();

// 9.2 fromMDim
(() => {
  const sp = fromMDim(5, [1, 2, 3, 4, 5, 6, 7, 8], 0.5);
  assert(isSpiralNumber(sp), 'fromMDim は螺旋数を返す');
  assert(sp.epsilon === 0.5, 'ε が保存される');
})();

// 9.3 spiralTraversal
(() => {
  const { result, trace } = spiralTraversal(
    5, [1, 2, 3, 4, 9, 8, 7, 6], 'cw', 'add'
  );
  assertClose(result, 45, '螺旋加算: 5+1+2+3+4+9+8+7+6=45');
  assert(trace.length === 9, 'trace: 9点（center+8近傍）');
  assertClose(trace[0], 5, 'trace[0] = center');
})();

// 9.4 逆回転
(() => {
  const { result: cwResult } = spiralTraversal(0, [1, 2, 3, 4], 'cw', 'add');
  const { result: ccwResult } = spiralTraversal(0, [1, 2, 3, 4], 'ccw', 'add');
  assertClose(cwResult, ccwResult, 'CW/CCW加算: 合計は同じ');
})();

// 9.5 減衰螺旋
(() => {
  const { result: noDecay } = spiralTraversal(0, [10, 10, 10, 10], 'cw', 'add', 1.0);
  const { result: withDecay } = spiralTraversal(0, [10, 10, 10, 10], 'cw', 'add', 0.5);
  assert(withDecay < noDecay, '減衰あり < 減衰なし');
})();

// ============================================================
// 10. 既存体系との差異検証
// ============================================================

section('10. 既存体系との差異');

// 10.1 ε=0, s=0 → 複素数と一致
(() => {
  const cmp = compareWithSystems(2, 1.0, 0, 0);
  assertClose(cmp.spiral.x, cmp.complex.x, 'ε=0,s=0: spiral.x = complex.x');
  assertClose(cmp.spiral.y, cmp.complex.y, 'ε=0,s=0: spiral.y = complex.y');
})();

// 10.2 s≠0 → 複素数と乖離
(() => {
  const cmp = compareWithSystems(2, 1.0, 1, 0);
  const dx = Math.abs(cmp.spiral.x - cmp.complex.x);
  assert(dx > 0.01, `s=1で複素数と乖離: Δx=${dx.toFixed(4)}`);
})();

// 10.3 ε=2 → 分解型複素数と一致
(() => {
  const cmp = compareWithSystems(1, 0, 1, 2);
  assertClose(cmp.spiral.x, cmp.split.x, 'ε=2: spiral = split-complex (x)', 1e-5);
  assertClose(cmp.spiral.z, cmp.split.z, 'ε=2: spiral = split-complex (z)', 1e-5);
})();

// 10.4 任意εで双対数と異なる
(() => {
  const cmp = compareWithSystems(1, 0.5, 2, 0.5);
  const d = Math.sqrt(
    (cmp.spiral.x - cmp.dual.x) ** 2 +
    (cmp.spiral.y - cmp.dual.y) ** 2 +
    (cmp.spiral.z - cmp.dual.z) ** 2
  );
  assert(d > 0.01, `ε=0.5 で双対数と差異: Δ=${d.toFixed(4)}`);
})();

// 10.5 differences配列
(() => {
  const cmp1 = compareWithSystems(1, 0, 0, 0);
  assert(cmp1.differences.some(d => d.includes('完全一致')),
    'ε=0,s=0: 複素数と完全一致メッセージ');

  const cmp2 = compareWithSystems(1, 0, 1, 0.5);
  assert(cmp2.differences.length > 0, 'ε=0.5,s=1: 差異リストあり');
})();

// ============================================================
// 11. 6属性テスト
// ============================================================

section('11. 6属性システム');

(() => {
  const sp = createSpiral(2, 1, 0.5, 0.3);

  // field
  assert(sp.field.region === 'elliptic', 'field.region = elliptic');
  assert(typeof sp.field.curvature === 'number', 'field.curvature は数値');
  assert(sp.field.stability > 0, 'field.stability > 0');

  // flow
  assert(['winding', 'unwinding', 'static', 'expanding', 'collapsing'].includes(sp.flow.direction),
    `flow.direction = ${sp.flow.direction}`);

  // memory
  assert(sp.memory.trajectory.length > 0, 'memory: 軌跡あり');
  assert(typeof sp.memory.windingNumber === 'number', 'memory.windingNumber は数値');

  // layer
  assert(typeof sp.layer.shellIndex === 'number', 'layer.shellIndex は数値');
  assert(sp.layer.depth >= 0, 'layer.depth >= 0');

  // relation
  assertClose(sp.relation.conjugate.theta, -sp.theta, 'relation.conjugate.θ = -θ');
  assertClose(sp.relation.conjugate.s, -sp.s, 'relation.conjugate.s = -s');

  // will
  assert(sp.will.tendency === 'tighten', 'ε<1: tendency = tighten');
  assert(sp.will.strength > 0, 'will.strength > 0');
})();

// 双曲のwill
(() => {
  const sp = createSpiral(1, 0, 1, 2);
  assert(sp.will.tendency === 'expand', 'ε>1: tendency = expand');
})();

// 放物のwill
(() => {
  const sp = createSpiral(1, 0, 1, 1);
  assert(sp.will.tendency === 'equilibrium', 'ε=1: tendency = equilibrium');
})();

// ============================================================
// 12. σ統合
// ============================================================

section('12. σ統合');

(() => {
  const sp = createSpiral(2, 1, 0.5, 0.7);
  const sigma = spiralSigma(sp);
  assert(sigma.field === sp.field, 'σ.field');
  assert(sigma.flow === sp.flow, 'σ.flow');
  assert(sigma.memory.windingNumber === sp.memory.windingNumber, 'σ.memory.windingNumber');
  assert(sigma.layer === sp.layer, 'σ.layer');
  assert(sigma.relation === sp.relation, 'σ.relation');
  assert(sigma.will === sp.will, 'σ.will');
})();

// ============================================================
// 13. 型判定
// ============================================================

section('13. 型判定');

(() => {
  const sp = createSpiral(1, 0, 0, 0);
  assert(isSpiralNumber(sp), 'isSpiralNumber: 正');
  assert(!isSpiralNumber(42), 'isSpiralNumber: 数値は否');
  assert(!isSpiralNumber(null), 'isSpiralNumber: nullは否');
  assert(!isSpiralNumber({ reiType: 'Ghost' }), 'isSpiralNumber: Ghostは否');

  const traj = integrate(sp, 1, 0, Math.PI, 10);
  assert(isSpiralTrajectory(traj), 'isSpiralTrajectory: 正');
  assert(!isSpiralTrajectory(sp), 'isSpiralTrajectory: 螺旋数は否');
})();

// ============================================================
// 14. 古典的螺旋
// ============================================================

section('14. 古典的螺旋');

(() => {
  const one = unitReal();
  assertClose(one.x, 1, 'unitReal: x=1');
  assertClose(one.y, 0, 'unitReal: y=0');
  assertClose(one.epsilon, 0, 'unitReal: ε=0');
})();

(() => {
  const i = unitImaginary();
  assertClose(i.x, 0, 'unitImaginary: x≈0', 1e-10);
  assertClose(i.y, 1, 'unitImaginary: y=1');
})();

(() => {
  const gs = goldenSpiral();
  assert(isSpiralTrajectory(gs), '黄金螺旋: 軌道型');
  assert(gs.points.length > 10, '黄金螺旋: 十分な点数');
  assert(gs.arcLength > 0, '黄金螺旋: 弧長>0');
})();

(() => {
  const ls = logarithmicSpiral(0.1, 2);
  assert(isSpiralTrajectory(ls), '対数螺旋: 軌道型');
  assert(ls.arcLength > 0, '対数螺旋: 弧長>0');
})();

// ============================================================
// 15. 4公理との対応
// ============================================================

section('15. 4公理との対応');

// A1: 中心-周縁 — r=0 が中心、r→∞ が周縁
(() => {
  const center = createSpiral(0, 0, 0, 0);
  const far = createSpiral(100, 0, 0, 0);
  assertClose(magnitude(center), 0, 'A1: r=0 が中心');
  assert(magnitude(far) > 10, 'A1: r大 が周縁');
})();

// A2: 拡張-縮約 — ε変化で位相遷移
(() => {
  const elliptic = createSpiral(1, 0, 1, 0);
  const hyperbolic = createSpiral(1, 0, 1, 2);
  assert(elliptic.field.stability > hyperbolic.field.stability,
    'A2: 楕円は双曲より安定');
})();

// A3: Σ蓄積 — 積分で軌跡を蓄積
(() => {
  const sp = createSpiral(1, 0, 0, 0.5);
  const traj = integrate(sp, 1, 0.5, 4 * Math.PI, 100);
  assert(traj.points.length > 50, 'A3: 軌跡の蓄積');
  assert(traj.arcLength > 0, 'A3: 弧長の蓄積');
})();

// A4: Genesis — ε=-1→0→1→2 での段階的顕現
(() => {
  const e_minus1 = createSpiral(1, 0, 1, -1);
  const e_0 = createSpiral(1, 0, 1, 0);
  const e_1 = createSpiral(1, 0, 1, 1);
  const e_2 = createSpiral(1, 0, 1, 2);

  assert(e_minus1.region === 'elliptic', 'A4: ε=-1 楕円');
  assert(e_0.region === 'elliptic', 'A4: ε=0 楕円(複素数)');
  assert(e_1.region === 'parabolic', 'A4: ε=1 放物(臨界)');
  assert(e_2.region === 'hyperbolic', 'A4: ε=2 双曲');

  // εの増加に伴い z成分が単調増加（s=1固定）
  assert(e_2.z > e_1.z, 'A4: ε増加でz成長');
  assert(e_1.z > e_0.z, 'A4: ε増加でz成長(2)');
})();

// ============================================================
// 16. エッジケース
// ============================================================

section('16. エッジケース');

// r=0
(() => {
  const sp = createSpiral(0, 1, 1, 0.5);
  assertClose(sp.x, 0, 'r=0: x=0');
  assertClose(sp.y, 0, 'r=0: y=0');
  assertClose(sp.z, 0, 'r=0: z=0');
})();

// 非常に大きなε
(() => {
  const sp = createSpiral(1, 0, 1, 100);
  assert(sp.region === 'hyperbolic', '大きなε: 双曲');
  assert(isFinite(sp.x), 'x は有限');
})();

// 負のε
(() => {
  const sp = createSpiral(1, 0, 1, -5);
  assert(sp.region === 'elliptic', '負のε: 楕円');
  assert(isFinite(sp.x), 'x は有限');
})();

// ============================================================
// 結果集計
// ============================================================

console.log(`\n${'═'.repeat(50)}`);
console.log(`  結果: ${passed} passed / ${failed} failed / ${total} total`);
console.log(`${'═'.repeat(50)}`);

if (failed > 0) {
  process.exit(1);
}
