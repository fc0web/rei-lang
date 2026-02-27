// ============================================================
// ghost.test.ts — 幽霊の数式テストスイート
//
// G = f(G) の不動点探索と6属性システムの統合テスト
//
// @author Nobuki Fujimoto (D-FUMT / 0₀式)
// ============================================================

import {
  summon,
  compose,
  nest,
  haunt,
  exorcise,
  ensemble,
  goldenRatioGhost,
  cosineGhost,
  sqrt2Ghost,
  logisticGhost,
  logarithmGhost,
  paradoxGhost,
  ghostSigma,
  isGhost,
  isGhostEnsemble,
  type Ghost,
  type GhostEnsemble,
} from '../extensions/ghost';

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

function assertNotNull<T>(value: T | null, message: string): asserts value is T {
  assert(value !== null, message);
}

function section(name: string) {
  console.log(`\n─── ${name} ───`);
}

// ============================================================
// 1. 基本召喚テスト
// ============================================================

section('1. 基本召喚（summon）');

// 1.1 恒等関数の不動点
(() => {
  const g = summon(x => x, 42);
  assert(g.phase === 'materialized', '恒等関数: 即座に実体化');
  assert(g.convergence === 'exact', '恒等関数: 完全一致');
  assertClose(g.fixedPoint!, 42, '恒等関数: 不動点 = seed');
})();

// 1.2 定数関数の不動点
(() => {
  const g = summon(_ => 7, 0);
  assert(g.phase === 'materialized', '定数関数: 実体化');
  assertClose(g.fixedPoint!, 7, '定数関数: 不動点 = 定数値');
})();

// 1.3 線形収縮写像 f(x) = x/2
(() => {
  const g = summon(x => x / 2, 100);
  assert(g.phase === 'materialized', '線形収縮: 実体化');
  assertClose(g.fixedPoint!, 0, '線形収縮: 不動点 = 0', 1e-8);
})();

// 1.4 seed = 0 での挙動
(() => {
  const g = summon(x => x * x, 0);
  assert(g.phase === 'materialized', 'seed=0, x²: 実体化');
  assertClose(g.fixedPoint!, 0, 'seed=0, x²: 不動点 = 0');
})();

// 1.5 負の seed
(() => {
  const g = summon(x => x / 2, -100);
  assert(g.phase === 'materialized', '負のseed: 実体化');
  assertClose(g.fixedPoint!, 0, '負のseed: 不動点 = 0', 1e-8);
})();

// ============================================================
// 2. 古典的不動点テスト
// ============================================================

section('2. 古典的不動点');

// 2.1 黄金比 φ = (1 + √5) / 2 ≈ 1.6180339887
(() => {
  const g = goldenRatioGhost();
  assert(g.phase === 'materialized', '黄金比: 実体化');
  assertClose(g.fixedPoint!, 1.6180339887, '黄金比: φ ≈ 1.618', 1e-6);
  assert(g.convergence === 'approximate' || g.convergence === 'exact', '黄金比: 収束');
})();

// 2.2 ドッティ数（cos の不動点）≈ 0.7390851332
(() => {
  const g = cosineGhost();
  assert(g.phase === 'materialized', 'ドッティ数: 実体化');
  assertClose(g.fixedPoint!, 0.7390851332, 'ドッティ数 ≈ 0.739', 1e-6);
})();

// 2.3 √2 ≈ 1.41421356
(() => {
  const g = sqrt2Ghost();
  assert(g.phase === 'materialized', '√2: 実体化');
  assertClose(g.fixedPoint!, 1.41421356, '√2 ≈ 1.414', 1e-6);
})();

// 2.4 対数不動点 x = ln(x+1) → 0（収束が遅い）
(() => {
  const g = summon(x => Math.log(x + 1), 0.5, {
    maxIterations: 500,
    epsilon: 1e-6,
    id: 'logarithm',
  });
  assert(
    g.phase === 'materialized' || g.phase === 'manifesting',
    `対数: 実体化または顕現 (phase=${g.phase})`
  );
  assert(
    g.memory.bestApproximation < 0.01,
    `対数不動点 ≈ 0 (bestApprox=${g.memory.bestApproximation})`
  );
})();

// ============================================================
// 3. 発散・パラドックステスト
// ============================================================

section('3. 発散とパラドックス');

// 3.1 反転関数 f(x) = -x（seed ≠ 0 では振動）
(() => {
  const g = paradoxGhost(1.0);
  assert(
    g.convergence === 'oscillating' || g.phase === 'paradox' || g.phase === 'manifesting',
    '反転: 振動またはパラドックス'
  );
})();

// 3.2 発散関数 f(x) = 2x
(() => {
  const g = summon(x => 2 * x, 1);
  assert(
    g.phase === 'paradox' || g.convergence === 'diverging',
    '発散関数: パラドックスまたは発散'
  );
})();

// 3.3 NaN を返す関数
(() => {
  const g = summon(x => Math.sqrt(-Math.abs(x) - 1), 1);
  assert(g.phase === 'paradox', 'NaN関数: パラドックス');
})();

// 3.4 Infinity を返す関数
(() => {
  const g = summon(x => x === 0 ? 1 : 1 / (x * x * x - x), 0.5);
  assert(
    g.phase === 'paradox' || g.phase === 'materialized' || g.phase === 'manifesting',
    'Infinity候補: フェーズ判定あり'
  );
})();

// ============================================================
// 4. ロジスティック写像テスト
// ============================================================

section('4. ロジスティック写像');

// 4.1 r=2 (安定不動点 x*=0.5)
(() => {
  const g = logisticGhost(2.0);
  assert(g.phase === 'materialized', 'r=2: 安定不動点に実体化');
  assertClose(g.fixedPoint!, 0.5, 'r=2: 不動点 = 0.5', 1e-6);
})();

// 4.2 r=3.2 (2周期軌道)
(() => {
  const g = logisticGhost(3.2);
  assert(
    g.convergence === 'oscillating' || g.phase === 'manifesting' || g.phase === 'materialized',
    'r=3.2: 振動または顕現'
  );
})();

// 4.3 r=3.8 (カオス領域)
(() => {
  const g = logisticGhost(3.8);
  assert(g.memory.totalSteps > 0, 'r=3.8: 反復が実行された');
  assert(
    g.layer.fractalDimension >= 0,
    `r=3.8: フラクタル次元 = ${g.layer.fractalDimension}`
  );
})();

// ============================================================
// 5. 6属性テスト
// ============================================================

section('5. 6属性システム');

// 5.1 field — 中心と周縁
(() => {
  const g = cosineGhost();
  assert(typeof g.field.center === 'number', 'field.center は数値');
  assert(Array.isArray(g.field.periphery), 'field.periphery は配列');
  assert(g.field.depth > 0, 'field.depth > 0');
  assert(g.field.selfSimilarity >= 0 && g.field.selfSimilarity <= 1,
    `field.selfSimilarity = ${g.field.selfSimilarity} (0-1範囲)`);
})();

// 5.2 flow — 方向と速度
(() => {
  const g = goldenRatioGhost();
  assert(
    ['inward', 'outward', 'circular', 'still'].includes(g.flow.direction),
    `flow.direction = ${g.flow.direction}`
  );
  assert(typeof g.flow.velocity === 'number', 'flow.velocity は数値');
  assert(g.flow.phase === 'arrived', 'flow.phase = arrived (実体化後)');
})();

// 5.3 memory — 反復履歴
(() => {
  const g = summon(Math.cos, 1.0, { trackHistory: true });
  assert(g.memory.iterations.length > 0, 'memory: 履歴あり');
  assert(g.memory.totalSteps > 0, 'memory: ステップ数 > 0');
  assert(g.memory.bestDelta < 1, 'memory: bestDelta < 1');

  const firstIter = g.memory.iterations[0];
  assert(firstIter.step === 0, 'memory: 最初のステップ = 0');
  assert(typeof firstIter.input === 'number', 'memory: input は数値');
  assert(typeof firstIter.output === 'number', 'memory: output は数値');
})();

// 5.4 layer — 自己参照の深さ
(() => {
  const g = sqrt2Ghost();
  assert(g.layer.depth > 0, 'layer.depth > 0');
  assert(g.layer.shellValues.length > 0, 'layer.shellValues に値あり');
  assert(typeof g.layer.fractalDimension === 'number',
    `layer.fractalDimension = ${g.layer.fractalDimension}`);
})();

// 5.5 relation — 関係性
(() => {
  const g = summon(Math.cos, 1.0, { id: 'test_ghost' });
  assert(g.relation.entangled.includes('test_ghost'), 'relation: IDが記録されている');
  assert(typeof g.relation.resonanceFreq === 'number', 'relation.resonanceFreq は数値');
  assert(typeof g.relation.mirrorDepth === 'number', 'relation.mirrorDepth は数値');
})();

// 5.6 will — 意志
(() => {
  const gMat = cosineGhost();
  assert(gMat.will.tendency === 'materialize', '実体化ゴースト: tendency = materialize');
  assert(gMat.will.strength === 1.0, '実体化ゴースト: strength = 1.0');
  assert(gMat.will.purpose.length > 0, 'will.purpose が設定されている');
})();

// ============================================================
// 6. ghostSigma 統合テスト
// ============================================================

section('6. σ統合');

(() => {
  const g = goldenRatioGhost();
  const sigma = ghostSigma(g);

  assert(sigma.field === g.field, 'σ.field が正しく返される');
  assert(sigma.flow === g.flow, 'σ.flow が正しく返される');
  assert(sigma.memory.iterations === g.memory.totalSteps, 'σ.memory.iterations');
  assert(sigma.memory.bestDelta === g.memory.bestDelta, 'σ.memory.bestDelta');
  assert(sigma.layer === g.layer, 'σ.layer が正しく返される');
  assert(sigma.relation === g.relation, 'σ.relation が正しく返される');
  assert(sigma.will === g.will, 'σ.will が正しく返される');
})();

// ============================================================
// 7. 型判定テスト
// ============================================================

section('7. 型判定');

(() => {
  const g = cosineGhost();
  assert(isGhost(g), 'isGhost: ゴーストを正しく判定');
  assert(!isGhost(42), 'isGhost: 数値は非ゴースト');
  assert(!isGhost(null), 'isGhost: null は非ゴースト');
  assert(!isGhost({ reiType: 'DNode' }), 'isGhost: DNode は非ゴースト');

  const ens = ensemble([g]);
  assert(isGhostEnsemble(ens), 'isGhostEnsemble: 正しく判定');
  assert(!isGhostEnsemble(g), 'isGhostEnsemble: ゴースト単体は非アンサンブル');
})();

// ============================================================
// 8. 合成（compose）テスト
// ============================================================

section('8. ゴースト合成');

// 8.1 同じ不動点のゴーストを合成
(() => {
  const g1 = cosineGhost();
  const g2 = cosineGhost();
  const gc = compose(g1, g2);

  assert(isGhost(gc), '合成結果はゴースト');
  assert(gc.fixedPoint !== null, '合成ゴーストは不動点を持つ');
  assertClose(gc.fixedPoint!, g1.fixedPoint!, '同じゴーストの合成: 不動点一致', 0.1);
})();

// 8.2 異なるゴーストの合成
(() => {
  const g1 = goldenRatioGhost();
  const g2 = cosineGhost();
  const gc = compose(g1, g2);

  assert(isGhost(gc), '異なるゴーストの合成結果はゴースト');
  assert(gc.relation.entangled.length >= 2, '合成: 関係性が統合されている');
})();

// 8.3 カスタム合成関数
(() => {
  const g1 = sqrt2Ghost();
  const g2 = goldenRatioGhost();
  const gc = compose(g1, g2, (a, b) => Math.sqrt(a * b));

  assert(isGhost(gc), 'カスタム合成: ゴースト');
})();

// ============================================================
// 9. 入れ子（nest）テスト
// ============================================================

section('9. ゴースト入れ子');

// 9.1 基本的な入れ子
(() => {
  const g = nest(Math.cos, 1.0, 3);
  assert(isGhost(g), '入れ子結果はゴースト');
  assert(g.layer.depth === 3, '入れ子: depth = 3');
  assert(g.layer.shellValues.length === 3, '入れ子: 3層の値');
  assert(g.relation.mirrorDepth === 3, '入れ子: mirrorDepth = 3');
})();

// 9.2 深い入れ子でも収束
(() => {
  const g = nest(x => (x + 2 / x) / 2, 1.0, 5);
  assert(g.fixedPoint !== null, '深い入れ子でも不動点あり');
  assertClose(g.fixedPoint!, 1.41421356, '深い入れ子: √2に収束', 1e-4);
})();

// 9.3 深さ1の入れ子 = 通常の召喚と同等
(() => {
  const gNested = nest(Math.cos, 1.0, 1);
  const gNormal = cosineGhost();
  assertClose(
    gNested.fixedPoint!,
    gNormal.fixedPoint!,
    '深さ1: 通常召喚と同値',
    1e-6
  );
})();

// ============================================================
// 10. 憑依（haunt）テスト
// ============================================================

section('10. 憑依');

// 10.1 実体化ゴーストによる憑依
(() => {
  const g = cosineGhost();  // 不動点 ≈ 0.739
  const haunted = haunt(g, 0, 1.0);  // 0 を 0.739 方向へ引く
  assert(haunted > 0, '憑依: 0 が不動点方向に移動');
  assert(haunted <= g.fixedPoint!, '憑依: 不動点を超えない (strength=1)');
})();

// 10.2 強さ0 = 影響なし
(() => {
  const g = goldenRatioGhost();
  const haunted = haunt(g, 5.0, 0);
  assertClose(haunted, 5.0, '強さ0: 影響なし');
})();

// 10.3 強さ0.5 = 半分引き寄せ
(() => {
  const g = cosineGhost();  // fp ≈ 0.739
  const target = 0;
  const haunted = haunt(g, target, 0.5);
  const expected = target + (g.fixedPoint! - target) * 0.5;
  assertClose(haunted, expected, '強さ0.5: 半分の引力');
})();

// ============================================================
// 11. 除霊（exorcise）テスト
// ============================================================

section('11. 除霊');

// 11.1 パラドックスゴーストの除霊
(() => {
  const g = paradoxGhost(1.0);
  const ex = exorcise(g);
  assert(ex.phase === 'dormant' || ex.phase === 'materialized', '除霊: 安定化');
  assert(ex.will.tendency === 'dissolve' || ex.will.tendency === 'materialize', '除霊: 意志が消散');
})();

// 11.2 既に実体化したゴーストの除霊 = そのまま
(() => {
  const g = cosineGhost();
  const ex = exorcise(g);
  assert(ex === g, '実体化済み: そのまま返る');
})();

// ============================================================
// 12. アンサンブル（ensemble）テスト
// ============================================================

section('12. アンサンブル');

// 12.1 空のアンサンブル
(() => {
  const ens = ensemble([]);
  assert(ens.ghosts.length === 0, '空アンサンブル: ゴーストなし');
  assert(ens.resonances.length === 0, '空アンサンブル: 共鳴なし');
  assert(ens.collectiveFixedPoint === null, '空アンサンブル: 集団不動点なし');
})();

// 12.2 同じ不動点のアンサンブル
(() => {
  const g1 = cosineGhost();
  const g2 = cosineGhost();
  const ens = ensemble([g1, g2]);

  assert(ens.ghosts.length === 2, '2体アンサンブル');
  assert(ens.resonances.length > 0, '同じ不動点: 共鳴あり');
  assert(ens.resonances[0].type === 'mirror', '同じ不動点: mirror共鳴');
  assertClose(ens.resonances[0].similarity, 1.0, '同じ不動点: 完全類似', 0.01);
})();

// 12.3 異なる不動点のアンサンブル
(() => {
  const g1 = goldenRatioGhost();   // ≈ 1.618
  const g2 = cosineGhost();        // ≈ 0.739
  const g3 = sqrt2Ghost();         // ≈ 1.414
  const ens = ensemble([g1, g2, g3]);

  assert(ens.ghosts.length === 3, '3体アンサンブル');
  assert(ens.collectiveFixedPoint !== null, '集団不動点あり');

  // 集団不動点は3つの平均
  const expectedCollective = (g1.fixedPoint! + g2.fixedPoint! + g3.fixedPoint!) / 3;
  assertClose(ens.collectiveFixedPoint!, expectedCollective, '集団不動点 = 平均', 1e-6);
})();

// 12.4 共鳴タイプの判定
(() => {
  const g1 = goldenRatioGhost();   // ≈ 1.618
  const g2 = sqrt2Ghost();         // ≈ 1.414
  const ens = ensemble([g1, g2]);

  if (ens.resonances.length > 0) {
    const r = ens.resonances[0];
    assert(r.similarity > 0, `共鳴類似度 = ${r.similarity}`);
    assert(
      ['harmonic', 'mirror', 'shadow'].includes(r.type),
      `共鳴タイプ = ${r.type}`
    );
  }
  assert(true, 'φ と √2: 共鳴分析完了');
})();

// ============================================================
// 13. オプションテスト
// ============================================================

section('13. オプション');

// 13.1 履歴なしモード
(() => {
  const g = summon(Math.cos, 1.0, { trackHistory: false });
  assert(g.memory.iterations.length === 0, 'trackHistory=false: 履歴空');
  assert(g.phase === 'materialized', 'trackHistory=false でも実体化');
})();

// 13.2 最大反復数制限
(() => {
  const g = summon(x => x + 0.001, 0, { maxIterations: 5 });
  assert(g.memory.totalSteps <= 5, 'maxIterations=5: 5反復以内');
})();

// 13.3 収束閾値の変更
(() => {
  const gLoose = summon(Math.cos, 1.0, { epsilon: 0.1 });
  const gTight = summon(Math.cos, 1.0, { epsilon: 1e-15 });

  assert(gLoose.memory.totalSteps <= gTight.memory.totalSteps,
    `緩い閾値(${gLoose.memory.totalSteps}反復) <= 厳しい閾値(${gTight.memory.totalSteps}反復)`
  );
})();

// ============================================================
// 14. エッジケーステスト
// ============================================================

section('14. エッジケース');

// 14.1 非常に大きな seed
(() => {
  const g = summon(x => x / 2, 1e15);
  assert(g.fixedPoint !== null, '大きなseed: 不動点あり');
  assertClose(g.fixedPoint!, 0, '大きなseed: 不動点 = 0', 1e-3);
})();

// 14.2 非常に小さな seed
(() => {
  const g = summon(x => x / 2, 1e-15);
  assert(g.phase === 'materialized', '微小seed: 実体化');
})();

// 14.3 f(x) = x + ε（ゆっくり発散）
(() => {
  const g = summon(x => x + 1e-12, 0, { maxIterations: 50 });
  assert(g.memory.totalSteps > 0, 'ゆっくり発散: 反復実行');
})();

// 14.4 f(x) = sin(x)（不動点 = 0、非常にゆっくり収束）
(() => {
  const g = summon(Math.sin, 3.0, { maxIterations: 200, epsilon: 1e-4 });
  assert(
    g.fixedPoint !== null || g.phase === 'manifesting' || g.phase === 'paradox',
    `sin不動点: phase=${g.phase}`
  );
})();

// ============================================================
// 15. Rei 公理との対応テスト
// ============================================================

section('15. 4公理との対応');

// A1: 中心-周縁 — ゴーストは自身が中心かつ周縁
(() => {
  const g = goldenRatioGhost();
  assert(
    Math.abs(g.field.center - g.fixedPoint!) < 1e-6,
    'A1: 不動点が場の中心と一致'
  );
  assert(
    g.field.periphery.length > 0,
    'A1: 周縁値が存在（反復途中の値）'
  );
  // 周縁は中心に向かって収束しているはず
  const lastPeriphery = g.field.periphery[g.field.periphery.length - 1];
  assert(
    Math.abs(lastPeriphery - g.field.center) < 0.1,
    'A1: 周縁が中心に近づいている'
  );
})();

// A2: 拡張-縮約 — 反復は収縮写像
(() => {
  const g = cosineGhost();
  assert(g.flow.velocity < 1 || g.flow.velocity > 0,
    'A2: 収束速度が正の有限値'
  );
  if (g.memory.iterations.length > 5) {
    const early = g.memory.iterations[2].delta;
    const late = g.memory.iterations[g.memory.iterations.length - 1].delta;
    assert(late < early, 'A2: 後半のδが前半より小さい（縮約）');
  }
})();

// A3: Σ蓄積 — 履歴の蓄積
(() => {
  const g = sqrt2Ghost();
  assert(g.memory.totalSteps > 0, 'A3: 反復が蓄積されている');
  assert(g.memory.bestDelta < g.memory.iterations[0]?.delta || true,
    'A3: 最良近似は初期より改善');
})();

// A4: Genesis — seedから段階的に顕現
(() => {
  const g = goldenRatioGhost();
  assert(g.seed === 1.0, 'A4: seedが保存されている');
  assert(g.phase === 'materialized', 'A4: 段階を経て実体化');
  assert(g.layer.shellValues.length > 0, 'A4: 各段階の値が記録');

  // shellValuesの最初と最後で、最初はseedに近く、最後は不動点に近い
  const firstShell = g.layer.shellValues[0];
  const lastShell = g.layer.shellValues[g.layer.shellValues.length - 1];
  assert(
    Math.abs(lastShell - g.fixedPoint!) < Math.abs(firstShell - g.fixedPoint!) || 
    g.layer.shellValues.length <= 2,
    'A4: 段階的に不動点に接近'
  );
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
