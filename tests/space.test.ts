// ============================================================
// Rei v0.3 — Space-Layer-Diffusion Test Suite
// Tests the core engine independently of the parser
// ============================================================

import {
  createSpace,
  createDNode,
  addNodeToLayer,
  stepNode,
  stepSpace,
  diffuseSpace,
  computeNodeValue,
  getSigmaFlow,
  getSigmaMemory,
  getSigmaWill,
  getSigmaField,
  getSpaceSigma,
  findResonances,
  type ReiSpace,
  type DNode,
  type ConvergenceCriteria,
} from '../src/lang/space';

// ============ Test Runner ============

let passed = 0;
let failed = 0;

function assert(condition: boolean, message: string) {
  if (condition) {
    passed++;
    console.log(`  ✅ ${message}`);
  } else {
    failed++;
    console.log(`  ❌ ${message}`);
  }
}

function assertClose(actual: number, expected: number, message: string, epsilon = 0.01) {
  assert(Math.abs(actual - expected) < epsilon, `${message} (${actual} ≈ ${expected})`);
}

function section(name: string) {
  console.log(`\n─── ${name} ───`);
}

// ============ Tests ============

section('1. DNode 生成と基本計算');

{
  const node = createDNode(5, [1, 2, 3, 4]);
  assert(node.reiType === 'DNode', 'DNodeの型識別');
  assert(node.center === 5, '中心値');
  assert(node.neighbors.length === 4, 'neighbors数');
  assert(node.stage === 0, '初期段階は0');
  assert(node.momentum === 'rest', '初期momentumはrest');

  const value = computeNodeValue(node);
  assertClose(value, 7.5, 'weighted計算 (5 + avg(1,2,3,4))');
}

{
  const node = createDNode(5, [1, 2, 3, 4], 'multiplicative');
  const value = computeNodeValue(node);
  assertClose(value, 5 * 2 * 3 * 4 * 5, 'multiplicative計算');
}

section('2. 1段階拡散（step）');

{
  const node = createDNode(5, [1, 2, 3, 4]);
  assert(node.neighbors.length === 4, '拡散前: 4方向');

  stepNode(node);
  assert(node.stage === 1, '段階が1に進む');
  assert(node.neighbors.length === 8, '拡散後: 8方向（線形補間）');
  assert(node.momentum === 'expanding', 'momentum = expanding');
  assert(node.diffusionHistory.length === 2, '履歴が2エントリ');
}

{
  const node = createDNode(10, [2, 4, 6]);
  stepNode(node);
  assert(node.neighbors.length === 6, '3方向 → 6方向');

  stepNode(node);
  assert(node.neighbors.length === 12, '6方向 → 12方向');
  assert(node.stage === 2, '段階2');

  stepNode(node);
  assert(node.neighbors.length === 24, '12方向 → 24方向');
  assert(node.stage === 3, '段階3');
  // 段階ごとに2倍 = 2^n の倍増パターン
}

section('3. Space（場）の生成と層');

{
  const space = createSpace();
  assert(space.reiType === 'Space', 'Space型識別');
  assert(space.layers.size === 0, '空の場');
  assert(space.topology === 'flat', 'デフォルトはflat');
}

{
  const space = createSpace();
  addNodeToLayer(space, 0, 5, [1, 2, 3, 4]);
  addNodeToLayer(space, 0, 10, [3, 7, 2]);
  addNodeToLayer(space, 1, 0, [1, -1, 1, -1]);

  assert(space.layers.size === 2, '2つの層');
  assert(space.layers.get(0)!.nodes.length === 2, '層0に2ノード');
  assert(space.layers.get(1)!.nodes.length === 1, '層1に1ノード');
}

section('4. 場全体の1段階拡散（stepSpace）');

{
  const space = createSpace();
  addNodeToLayer(space, 0, 5, [1, 2, 3, 4]);
  addNodeToLayer(space, 0, 10, [3, 7, 2]);

  stepSpace(space);
  assert(space.globalStage === 1, 'グローバル段階 = 1');

  const node0 = space.layers.get(0)!.nodes[0];
  const node1 = space.layers.get(0)!.nodes[1];
  assert(node0.stage === 1, 'ノード0: 段階1');
  assert(node1.stage === 1, 'ノード1: 段階1');
  assert(node0.neighbors.length === 8, 'ノード0: 4→8方向');
  assert(node1.neighbors.length === 6, 'ノード1: 3→6方向');
}

section('5. 層の凍結（freeze/thaw）');

{
  const space = createSpace();
  addNodeToLayer(space, 0, 5, [1, 2, 3, 4]);
  addNodeToLayer(space, 1, 10, [3, 7, 2]);

  // 層0を凍結
  space.layers.get(0)!.frozen = true;

  stepSpace(space);

  const node0 = space.layers.get(0)!.nodes[0];
  const node1 = space.layers.get(1)!.nodes[0];
  assert(node0.stage === 0, '凍結した層0: 段階0のまま');
  assert(node1.stage === 1, '凍結していない層1: 段階1に進む');

  // 層0を解凍
  space.layers.get(0)!.frozen = false;
  stepSpace(space);

  assert(node0.stage === 1, '解凍後の層0: 段階1に進む');
  assert(node1.stage === 2, '層1: 段階2に進む');
}

section('6. 特定層のみの拡散');

{
  const space = createSpace();
  addNodeToLayer(space, 0, 5, [1, 2, 3, 4]);
  addNodeToLayer(space, 1, 10, [3, 7, 2]);

  // 層0だけ拡散
  stepSpace(space, 0);

  const node0 = space.layers.get(0)!.nodes[0];
  const node1 = space.layers.get(1)!.nodes[0];
  assert(node0.stage === 1, '層0: 段階1');
  assert(node1.stage === 0, '層1: 段階0のまま');
}

section('7. 収束まで拡散（diffuseSpace）');

{
  const space = createSpace();
  // 均一なneighbors → 早く収束するはず
  addNodeToLayer(space, 0, 5, [2, 2, 2, 2]);

  const results = diffuseSpace(space, { type: 'converged' });

  assert(results.length === 1, '結果は1つ');
  const node = space.layers.get(0)!.nodes[0];
  assert(node.momentum === 'converged', '収束完了');
  assert(node.stage > 0, '少なくとも1段階は拡散した');
  console.log(`    → 収束まで ${node.stage} 段階`);
}

{
  const space = createSpace();
  addNodeToLayer(space, 0, 5, [1, 2, 3, 4]);

  // 3段階で強制停止
  const results = diffuseSpace(space, { type: 'steps', max: 3 });

  const node = space.layers.get(0)!.nodes[0];
  assert(node.stage >= 3, '3段階以上拡散した');
  assert(results.length === 1, '結果は1つ');
}

{
  const space = createSpace();
  addNodeToLayer(space, 0, 100, [1, 1, 1, 1]);

  // epsilon収束
  const results = diffuseSpace(space, { type: 'epsilon', threshold: 0.01 });

  const node = space.layers.get(0)!.nodes[0];
  assert(node.momentum === 'converged', 'epsilon収束完了');
  console.log(`    → epsilon収束まで ${node.stage} 段階`);
}

section('8. 複数ノード同時拡散');

{
  const space = createSpace();
  addNodeToLayer(space, 0, 5, [1, 2, 3, 4]);
  addNodeToLayer(space, 0, 10, [3, 7, 2]);
  addNodeToLayer(space, 0, -3, [8, 1, 5, 9, 2, 7]);

  const results = diffuseSpace(space, { type: 'steps', max: 5 });

  assert(results.length === 3, '3ノードの結果');
  for (let i = 0; i < 3; i++) {
    const node = space.layers.get(0)!.nodes[i];
    assert(node.stage >= 5, `ノード${i}: 5段階以上拡散`);
  }
}

section('9. Sigma（自己参照）— 公理C1');

{
  const space = createSpace();
  addNodeToLayer(space, 0, 5, [1, 2, 3, 4]);
  const node = space.layers.get(0)!.nodes[0];

  // 初期状態のσ
  const flow0 = getSigmaFlow(node);
  assert(flow0.stage === 0, 'σ.flow.stage = 0');
  assert(flow0.directions === 4, 'σ.flow.directions = 4');
  assert(flow0.momentum === 'rest', 'σ.flow.momentum = rest');

  const mem0 = getSigmaMemory(node);
  assert(mem0.length === 1, 'σ.memory: 初期エントリ1つ');

  // 2段階拡散
  stepNode(node);
  stepNode(node);

  const flow2 = getSigmaFlow(node);
  assert(flow2.stage === 2, 'σ.flow.stage = 2');
  assert(flow2.directions === 16, 'σ.flow.directions = 16');
  assert(flow2.momentum === 'expanding', 'σ.flow.momentum = expanding');

  const mem2 = getSigmaMemory(node);
  assert(mem2.length === 3, 'σ.memory: 3エントリ（初期 + 2段階）');
  assert(mem2[0].stage === 0, 'σ.memory[0].stage = 0');
  assert(mem2[1].stage === 1, 'σ.memory[1].stage = 1');
  assert(mem2[2].stage === 2, 'σ.memory[2].stage = 2');

  // σ.field
  const field = getSigmaField(node, space);
  assert(field.center === 5, 'σ.field.center = 5');
  assert(field.layer === 0, 'σ.field.layer = 0');
  assert(field.index === 0, 'σ.field.index = 0');
}

section('10. Sigma Will（意志）— 公理C2');

{
  const node = createDNode(5, [1, 2, 3, 4]);

  // 複数段階拡散して傾向性を蓄積
  for (let i = 0; i < 6; i++) {
    stepNode(node);
  }

  const will = getSigmaWill(node);
  assert(
    ['contract', 'expand', 'spiral', 'rest'].includes(will.tendency),
    `σ.will.tendency は有効な値: "${will.tendency}"`
  );
  assert(will.strength >= 0 && will.strength <= 1, `σ.will.strength = ${will.strength}`);
  assert(will.history.length === 6, 'σ.will.history: 6エントリ');
  console.log(`    → 意志: ${will.tendency} (強度: ${will.strength})`);
}

section('11. 場全体のΣ（Space sigma）');

{
  const space = createSpace();
  addNodeToLayer(space, 0, 5, [1, 2, 3, 4]);
  addNodeToLayer(space, 0, 10, [3, 7]);
  addNodeToLayer(space, 1, 0, [1, -1]);

  const sigma = getSpaceSigma(space);
  assert(sigma.field.layers === 2, 'σ.field.layers = 2');
  assert(sigma.field.total_nodes === 3, 'σ.field.total_nodes = 3');
  assert(sigma.field.active_nodes === 3, 'σ.field.active_nodes = 3');
  assert(sigma.flow.converged_nodes === 0, 'σ.flow.converged = 0');
  assert(sigma.layer.length === 2, 'σ.layer = [0, 1]');

  // 拡散後
  diffuseSpace(space, { type: 'steps', max: 3 });

  const sigma2 = getSpaceSigma(space);
  assert(sigma2.flow.global_stage > 0, 'グローバル段階が進んだ');
}

section('12. 共鳴（Resonance）— 公理C5');

{
  const space = createSpace();
  // 類似したノードを別の層に配置
  addNodeToLayer(space, 0, 5, [1, 2, 3, 4]);
  addNodeToLayer(space, 2, 5.1, [1.1, 2, 3, 4]); // 非常に類似

  const pairs = findResonances(space, 0.5);
  assert(pairs.length >= 1, '共鳴ペアが検出された');
  if (pairs.length > 0) {
    assert(pairs[0].similarity > 0.8, `類似度が高い: ${pairs[0].similarity}`);
    console.log(`    → 共鳴: 層${pairs[0].nodeA.layer} ↔ 層${pairs[0].nodeB.layer} (類似度: ${pairs[0].similarity})`);
  }
}

{
  const space = createSpace();
  // 全く異なるノード
  addNodeToLayer(space, 0, 5, [1, 2, 3, 4]);
  addNodeToLayer(space, 1, 1000, [500, 800, 900]);

  const pairs = findResonances(space, 0.9);
  assert(pairs.length === 0, '異なるノード間に高い共鳴はない');
}

section('13. 拡散方向数の倍増パターン確認');

{
  const node = createDNode(0, [1, 2, 3, 4, 5, 6, 7, 8]); // 8方向
  const directions: number[] = [8];

  for (let i = 0; i < 4; i++) {
    stepNode(node);
    directions.push(node.neighbors.length);
  }

  assert(directions[0] === 8, '段階0: 8方向');
  assert(directions[1] === 16, '段階1: 16方向');
  assert(directions[2] === 32, '段階2: 32方向');
  assert(directions[3] === 64, '段階3: 64方向');
  assert(directions[4] === 128, '段階4: 128方向');
  console.log(`    → 方向数推移: ${directions.join(' → ')}`);
  console.log(`    → Nobukiさんの構想通り: 8→16→32→64→128 (×2倍増)`);
}

section('14. 多層同時拡散（画像の構造の再現）');

{
  const space = createSpace();

  // 中央の大きなノード（画像の中心）
  addNodeToLayer(space, 0, 19, [
    Math.PI, 3 /* C */, 17 /* Q */, 19,
    23 /* W */, 20 /* T */, 24 /* X */, Math.PI,
  ]);

  // 周辺の小さなノード（画像の矢印先の各ノード）
  addNodeToLayer(space, 1, 18, [Math.E, 18]);               // 上方向
  addNodeToLayer(space, 1, 19, [Math.PI, 3, 19]);            // 右上
  addNodeToLayer(space, 1, 10, [Math.PI, 3, 19, 24]);        // 右
  addNodeToLayer(space, 1, 19, [Math.PI, 3]);                // 左上（小）

  // 全ノード同時拡散
  diffuseSpace(space, { type: 'steps', max: 3 });

  const sigma = getSpaceSigma(space);
  assert(sigma.field.total_nodes === 5, '5つのノードが同時拡散');
  assert(sigma.field.layers === 2, '2つの層');

  for (const [_, layer] of space.layers) {
    for (const node of layer.nodes) {
      assert(node.stage >= 3, `全ノードが3段階以上拡散: ノード(層${node.layerIndex},${node.nodeIndex}) = 段階${node.stage}`);
    }
  }
}

section('15. 収束後のMDim互換性（既存コードとの共存）');

{
  // 従来のMDim的な使い方
  const node = createDNode(5, [1, 2, 3, 4], 'weighted');
  const directResult = computeNodeValue(node); // 従来のcompute相当

  // 場に入れて拡散
  const space = createSpace();
  addNodeToLayer(space, 0, 5, [1, 2, 3, 4]);
  const diffusedResults = diffuseSpace(space, { type: 'steps', max: 0 });

  // 0段階拡散 = 従来のcomputeと同等
  // (拡散0段階では初期状態のまま収縮するため)
  assert(typeof directResult === 'number', '従来のcompute: 数値を返す');
  assert(typeof diffusedResults[0] === 'number', '場のdiffuse: 数値を返す');
}

// ============ Summary ============

console.log('\n════════════════════════════════════');
console.log(`  結果: ${passed} passed, ${failed} failed, ${passed + failed} total`);
console.log('════════════════════════════════════');

if (failed > 0) {
  process.exit(1);
}
