// ============================================================
// multiverse-library.test.ts — 多元宇宙図書館テスト (80 tests)
//
// §1 LibraryNode 生成 (10)
// §2 多元宇宙ネットワーク A1 (15)
// §3 多次元宇宙 A2深度軸 (15)
// §4 合わせ鏡 A2+π回転軸 (15)
// §5 統合システム (10)
// §6 知識伝播シミュレーション (10)
// §7 レポートと分析 (5)
//
// @author Nobuki Fujimoto (D-FUMT)
// ============================================================

import { describe, it, expect } from 'vitest';
import {
  createLibraryNode,
  archiveToNode,
  createMultiverseNetwork,
  addNode,
  updateNode,
  nodeDistance,
  createKnowledgeEnergy,
  addEdge,
  connectAll,
  getA1Pattern,
  recalculateTotal,
  createDimensionalLayer,
  createAllDimensions,
  projectDimension,
  dimensionLossRate,
  runDimensionProjectionChain,
  createMirrorLayer,
  createMirrorSystem,
  mirrorTotalFidelity,
  mirrorSelfSimilarity,
  mirrorPhase,
  createUniversalLibrarySystem,
  propagateFragment,
  systemStats,
  generateSystemReport,
} from '../../src/lang/core/multiverse-library';

import { createSigmaFragment } from '../../src/lang/core/cosmic-archive';

const PI = Math.PI;

// ヘルパー: テスト用σ断片
function testFragment(id: string) {
  return createSigmaFragment(
    id, ['genesis:void', 'genesis:conscious'], 'growth', 10, 'conscious',
    { boundary: true, metabolism: true, memory: true, selfRepair: true, autopoiesis: true, emergence: true },
    100,
  );
}

// ============================================================
// §1 LibraryNode 生成 (10 tests)
// ============================================================
describe('§1 LibraryNode 生成', () => {
  it('1.1 基本生成', () => {
    const node = createLibraryNode('u1', '宇宙α', 'spiral', { x: 0, y: 0, z: 0 });
    expect(node.id).toBe('u1');
    expect(node.galaxyShape).toBe('spiral');
    expect(node.dimensionLevel).toBe(3);
  });

  it('1.2 位置が正しい', () => {
    const node = createLibraryNode('u2', 'β', 'elliptical', { x: 10, y: 20, z: 30 });
    expect(node.position.x).toBe(10);
    expect(node.position.y).toBe(20);
    expect(node.position.z).toBe(30);
  });

  it('1.3 空の図書館で初期化', () => {
    const node = createLibraryNode('u3', 'γ', 'ring', { x: 0, y: 0, z: 0 });
    expect(node.library.totalArchived).toBe(0);
  });

  it('1.4 mirrorDepthのデフォルトは0', () => {
    const node = createLibraryNode('u4', 'δ', 'irregular', { x: 0, y: 0, z: 0 });
    expect(node.mirrorDepth).toBe(0);
  });

  it('1.5 mirrorDepthに応じた位相', () => {
    const node = createLibraryNode('u5', 'ε', 'spiral', { x: 0, y: 0, z: 0 }, 3, 3);
    expect(node.phase).toBeCloseTo(PI / 2, 10); // 3 * π/6 = π/2
  });

  it('1.6 physicsParamsが保存される', () => {
    const node = createLibraryNode('u6', 'ζ', 'lenticular', { x: 0, y: 0, z: 0 }, 3, 0, { gravity: 15 });
    expect(node.physicsParams.gravity).toBe(15);
  });

  it('1.7 immutable', () => {
    const node = createLibraryNode('u7', 'η', 'spiral', { x: 0, y: 0, z: 0 });
    expect(() => { (node as any).id = 'changed'; }).toThrow();
  });

  it('1.8 archiveToNode: σ断片をアーカイブ', () => {
    const node = createLibraryNode('u8', 'θ', 'elliptical', { x: 0, y: 0, z: 0 });
    const updated = archiveToNode(node, testFragment('f1'));
    expect(updated.library.totalArchived).toBe(1);
    expect(node.library.totalArchived).toBe(0); // 元は変わらない
  });

  it('1.9 全5種の銀河形状を設定可能', () => {
    const shapes = ['spiral', 'elliptical', 'irregular', 'lenticular', 'ring'] as const;
    shapes.forEach(shape => {
      const n = createLibraryNode('test', 'test', shape, { x: 0, y: 0, z: 0 });
      expect(n.galaxyShape).toBe(shape);
    });
  });

  it('1.10 dimensionLevelを指定', () => {
    const node = createLibraryNode('u10', 'κ', 'ring', { x: 0, y: 0, z: 0 }, 11);
    expect(node.dimensionLevel).toBe(11);
  });
});

// ============================================================
// §2 多元宇宙ネットワーク A1 (15 tests)
// ============================================================
describe('§2 多元宇宙ネットワーク A1', () => {
  it('2.1 空のネットワーク', () => {
    const net = createMultiverseNetwork();
    expect(net.nodes).toHaveLength(0);
    expect(net.edges).toHaveLength(0);
  });

  it('2.2 ノード追加', () => {
    let net = createMultiverseNetwork();
    net = addNode(net, createLibraryNode('u1', 'α', 'spiral', { x: 0, y: 0, z: 0 }));
    expect(net.nodes).toHaveLength(1);
  });

  it('2.3 複数ノード追加', () => {
    let net = createMultiverseNetwork();
    for (let i = 0; i < 5; i++) {
      net = addNode(net, createLibraryNode(`u${i}`, `lib${i}`, 'spiral', { x: i * 10, y: 0, z: 0 }));
    }
    expect(net.nodes).toHaveLength(5);
  });

  it('2.4 nodeDistance: 同じ位置は0', () => {
    const a = createLibraryNode('a', 'a', 'spiral', { x: 0, y: 0, z: 0 });
    const b = createLibraryNode('b', 'b', 'spiral', { x: 0, y: 0, z: 0 });
    expect(nodeDistance(a, b)).toBe(0);
  });

  it('2.5 nodeDistance: 3D距離', () => {
    const a = createLibraryNode('a', 'a', 'spiral', { x: 0, y: 0, z: 0 });
    const b = createLibraryNode('b', 'b', 'spiral', { x: 3, y: 4, z: 0 });
    expect(nodeDistance(a, b)).toBeCloseTo(5, 10);
  });

  it('2.6 createKnowledgeEnergy: 近いほど高強度', () => {
    const a = createLibraryNode('a', 'a', 'spiral', { x: 0, y: 0, z: 0 });
    const near = createLibraryNode('b', 'b', 'spiral', { x: 1, y: 0, z: 0 });
    const far = createLibraryNode('c', 'c', 'spiral', { x: 100, y: 0, z: 0 });
    const eNear = createKnowledgeEnergy(a, near);
    const eFar = createKnowledgeEnergy(a, far);
    expect(eNear.intensity).toBeGreaterThan(eFar.intensity);
  });

  it('2.7 addEdge: エッジ追加', () => {
    let net = createMultiverseNetwork();
    const a = createLibraryNode('a', 'a', 'spiral', { x: 0, y: 0, z: 0 });
    const b = createLibraryNode('b', 'b', 'spiral', { x: 10, y: 0, z: 0 });
    net = addNode(net, a);
    net = addNode(net, b);
    const energy = createKnowledgeEnergy(a, b);
    net = addEdge(net, energy);
    expect(net.edges).toHaveLength(1);
    expect(net.totalEnergy).toBeGreaterThan(0);
  });

  it('2.8 connectAll: 完全グラフ', () => {
    let net = createMultiverseNetwork();
    for (let i = 0; i < 4; i++) {
      net = addNode(net, createLibraryNode(`u${i}`, `l${i}`, 'spiral', { x: i * 10, y: 0, z: 0 }));
    }
    net = connectAll(net);
    // 4ノードの完全グラフ = C(4,2) = 6エッジ
    expect(net.edges).toHaveLength(6);
  });

  it('2.9 connectAll: 3ノード = 3エッジ', () => {
    let net = createMultiverseNetwork();
    for (let i = 0; i < 3; i++) {
      net = addNode(net, createLibraryNode(`u${i}`, `l${i}`, 'spiral', { x: i * 50, y: 0, z: 0 }));
    }
    net = connectAll(net);
    expect(net.edges).toHaveLength(3);
  });

  it('2.10 getA1Pattern: 中心と周囲', () => {
    let net = createMultiverseNetwork();
    net = addNode(net, createLibraryNode('center', 'c', 'spiral', { x: 0, y: 0, z: 0 }));
    net = addNode(net, createLibraryNode('p1', 'p1', 'elliptical', { x: 10, y: 0, z: 0 }));
    net = addNode(net, createLibraryNode('p2', 'p2', 'ring', { x: 0, y: 10, z: 0 }));
    net = connectAll(net);
    const pattern = getA1Pattern(net, 'center');
    expect(pattern).not.toBeNull();
    expect(pattern!.center.id).toBe('center');
    expect(pattern!.periphery).toHaveLength(2);
  });

  it('2.11 getA1Pattern: 存在しないIDはnull', () => {
    const net = createMultiverseNetwork();
    expect(getA1Pattern(net, 'nonexistent')).toBeNull();
  });

  it('2.12 getA1Pattern: 周囲にweight付き', () => {
    let net = createMultiverseNetwork();
    net = addNode(net, createLibraryNode('c', 'c', 'spiral', { x: 0, y: 0, z: 0 }));
    net = addNode(net, createLibraryNode('p', 'p', 'spiral', { x: 5, y: 0, z: 0 }));
    net = connectAll(net);
    const pattern = getA1Pattern(net, 'c')!;
    expect(pattern.periphery[0].weight).toBeGreaterThan(0);
  });

  it('2.13 updateNode: ノード更新', () => {
    let net = createMultiverseNetwork();
    const node = createLibraryNode('u1', 'old', 'spiral', { x: 0, y: 0, z: 0 });
    net = addNode(net, node);
    const updated = archiveToNode(node, testFragment('f1'));
    net = updateNode(net, updated);
    expect(net.nodes[0].library.totalArchived).toBe(1);
  });

  it('2.14 recalculateTotal', () => {
    let net = createMultiverseNetwork();
    let node = createLibraryNode('u1', 'α', 'spiral', { x: 0, y: 0, z: 0 });
    node = archiveToNode(node, testFragment('f1'));
    node = archiveToNode(node, testFragment('f2'));
    net = addNode(net, node);
    net = recalculateTotal(net);
    expect(net.totalFragments).toBe(2);
  });

  it('2.15 knowledgeEnergy: 同位置なら強度1.0', () => {
    const a = createLibraryNode('a', 'a', 'spiral', { x: 0, y: 0, z: 0 });
    const b = createLibraryNode('b', 'b', 'spiral', { x: 0, y: 0, z: 0 });
    const e = createKnowledgeEnergy(a, b);
    expect(e.intensity).toBe(1.0);
  });
});

// ============================================================
// §3 多次元宇宙 A2深度軸 (15 tests)
// ============================================================
describe('§3 多次元宇宙 A2深度軸', () => {
  it('3.1 createDimensionalLayer: 3次元', () => {
    const layer = createDimensionalLayer(3);
    expect(layer.level).toBe(3);
    expect(layer.name).toBe('空間');
  });

  it('3.2 createDimensionalLayer: 11次元', () => {
    const layer = createDimensionalLayer(11);
    expect(layer.name).toBe('M理論空間');
  });

  it('3.3 createAllDimensions: 11層', () => {
    const dims = createAllDimensions();
    expect(dims).toHaveLength(11);
    expect(dims[0].level).toBe(1);
    expect(dims[10].level).toBe(11);
  });

  it('3.4 projectionLoss: 11Dは損失0%', () => {
    const layer = createDimensionalLayer(11);
    expect(layer.projectionLoss).toBeCloseTo(0, 10);
  });

  it('3.5 projectionLoss: 1Dは損失最大', () => {
    const layer = createDimensionalLayer(1);
    expect(layer.projectionLoss).toBeGreaterThan(0.9);
  });

  it('3.6 projectDimension: 同次元なら損失なし', () => {
    expect(projectDimension(11, 11, 100)).toBe(100);
  });

  it('3.7 projectDimension: 高→低で情報減少', () => {
    const result = projectDimension(11, 3, 100);
    expect(result).toBeLessThan(100);
    expect(result).toBeCloseTo(100 * 3 / 11, 10);
  });

  it('3.8 projectDimension: 低→高なら損失なし', () => {
    expect(projectDimension(3, 11, 50)).toBe(50);
  });

  it('3.9 dimensionLossRate: 11→3', () => {
    const rate = dimensionLossRate(11, 3);
    expect(rate).toBeCloseTo(1 - 3 / 11, 10);
  });

  it('3.10 dimensionLossRate: 同次元=0', () => {
    expect(dimensionLossRate(5, 5)).toBe(0);
  });

  it('3.11 runDimensionProjectionChain: 11Dが最大', () => {
    const chain = runDimensionProjectionChain(1000);
    expect(chain[11]).toBe(1000);
    expect(chain[1]).toBeLessThan(chain[11]);
  });

  it('3.12 runDimensionProjectionChain: 段階的に減少', () => {
    const chain = runDimensionProjectionChain(1000);
    for (let d = 10; d >= 1; d--) {
      expect(chain[d as 1]).toBeLessThanOrEqual(chain[(d + 1) as 11]);
    }
  });

  it('3.13 runDimensionProjectionChain: 1Dでも0にはならない', () => {
    const chain = runDimensionProjectionChain(1000);
    expect(chain[1]).toBeGreaterThan(0);
  });

  it('3.14 各次元にdescriptionがある', () => {
    const dims = createAllDimensions();
    dims.forEach(d => {
      expect(d.description).toBeTruthy();
    });
  });

  it('3.15 3次元の投影損失率', () => {
    const layer = createDimensionalLayer(3);
    expect(layer.projectionLoss).toBeCloseTo(1 - 3 / 11, 10);
  });
});

// ============================================================
// §4 合わせ鏡 A2+π回転軸 (15 tests)
// ============================================================
describe('§4 合わせ鏡 A2+π回転軸', () => {
  it('4.1 createMirrorLayer: depth=0は原本', () => {
    const layer = createMirrorLayer(0);
    expect(layer.depth).toBe(0);
    expect(layer.scale).toBe(1);
    expect(layer.fidelity).toBe(1.0);
  });

  it('4.2 createMirrorLayer: depth増加でscale減少', () => {
    const l1 = createMirrorLayer(1);
    const l3 = createMirrorLayer(3);
    expect(l3.scale).toBeLessThan(l1.scale);
  });

  it('4.3 createMirrorLayer: depth増加でfidelity減少', () => {
    const l0 = createMirrorLayer(0);
    const l5 = createMirrorLayer(5);
    expect(l5.fidelity).toBeLessThan(l0.fidelity);
    expect(l5.fidelity).toBeGreaterThan(0); // 完全には消えない
  });

  it('4.4 createMirrorLayer: 色相シフト', () => {
    const l1 = createMirrorLayer(1);
    const l2 = createMirrorLayer(2);
    expect(l2.hueShift).toBe(l1.hueShift * 2);
  });

  it('4.5 createMirrorSystem: デフォルト8層(0-7)', () => {
    const system = createMirrorSystem();
    expect(system).toHaveLength(8);
    expect(system[0].depth).toBe(0);
    expect(system[7].depth).toBe(7);
  });

  it('4.6 createMirrorSystem: 指定深度', () => {
    const system = createMirrorSystem(15);
    expect(system).toHaveLength(16); // 0-15
  });

  it('4.7 mirrorTotalFidelity: 収束する級数', () => {
    const system = createMirrorSystem(100);
    const total = mirrorTotalFidelity(system);
    // 0.95の等比級数: Σ 0.95^n = 1/(1-0.95) = 20 に収束
    expect(total).toBeLessThan(21);
    expect(total).toBeGreaterThan(15);
  });

  it('4.8 mirrorSelfSimilarity: 一定縮小率なら1.0', () => {
    const system = createMirrorSystem(5);
    const similarity = mirrorSelfSimilarity(system);
    expect(similarity).toBeCloseTo(1.0, 5);
  });

  it('4.9 mirrorPhase: depth=0はphase=0', () => {
    const layer = createMirrorLayer(0);
    expect(mirrorPhase(layer)).toBe(0);
  });

  it('4.10 mirrorPhase: depth増加でphase増加', () => {
    const l1 = createMirrorLayer(1);
    const l3 = createMirrorLayer(3);
    expect(mirrorPhase(l3)).toBeGreaterThan(mirrorPhase(l1));
  });

  it('4.11 合わせ鏡の色相は360°で一周', () => {
    const l12 = createMirrorLayer(12); // 30° × 12 = 360° → 0°
    expect(l12.hueShift).toBe(0); // 360 % 360 = 0
  });

  it('4.12 scale > 0 (完全に消えない)', () => {
    const deep = createMirrorLayer(50);
    expect(deep.scale).toBeGreaterThan(0);
  });

  it('4.13 fidelity > 0 (情報は消えない)', () => {
    const deep = createMirrorLayer(100);
    expect(deep.fidelity).toBeGreaterThan(0);
  });

  it('4.14 回転角が蓄積', () => {
    const l6 = createMirrorLayer(6);
    expect(l6.rotation).toBeCloseTo(PI, 5); // 6 × π/6 = π
  });

  it('4.15 createMirrorSystem: 3層最小', () => {
    const system = createMirrorSystem(2);
    expect(system).toHaveLength(3); // 0, 1, 2
  });
});

// ============================================================
// §5 統合システム (10 tests)
// ============================================================
describe('§5 統合システム', () => {
  it('5.1 createUniversalLibrarySystem: デフォルト生成', () => {
    const system = createUniversalLibrarySystem();
    expect(system.multiverse.nodes).toHaveLength(5);
    expect(system.dimensions).toHaveLength(11);
    expect(system.mirrors.length).toBeGreaterThan(0);
  });

  it('5.2 全4公理が活性', () => {
    const system = createUniversalLibrarySystem();
    expect(system.axiomUsage.A1).toBe(true);
    expect(system.axiomUsage.A2).toBe(true);
    expect(system.axiomUsage.A3).toBe(true);
    expect(system.axiomUsage.A4).toBe(true);
  });

  it('5.3 ネットワークが完全グラフ', () => {
    const system = createUniversalLibrarySystem(4);
    expect(system.multiverse.edges).toHaveLength(6); // C(4,2)
  });

  it('5.4 ノード数を指定', () => {
    const system = createUniversalLibrarySystem(10);
    expect(system.multiverse.nodes).toHaveLength(10);
  });

  it('5.5 鏡深度を指定', () => {
    const system = createUniversalLibrarySystem(3, 15);
    expect(system.mirrors).toHaveLength(16); // 0-15
  });

  it('5.6 各ノードの銀河形状が循環', () => {
    const system = createUniversalLibrarySystem(5);
    const shapes = system.multiverse.nodes.map(n => n.galaxyShape);
    expect(shapes).toEqual(['spiral', 'elliptical', 'irregular', 'lenticular', 'ring']);
  });

  it('5.7 ノード名にギリシャ文字', () => {
    const system = createUniversalLibrarySystem(3);
    expect(system.multiverse.nodes[0].name).toContain('Α'); // Alpha
    expect(system.multiverse.nodes[1].name).toContain('Β'); // Beta
  });

  it('5.8 ノードが円形に配置', () => {
    const system = createUniversalLibrarySystem(4);
    const positions = system.multiverse.nodes.map(n => n.position);
    // 各ノード間の距離が均等（正方形の辺）
    const d01 = Math.sqrt((positions[0].x - positions[1].x) ** 2 + (positions[0].y - positions[1].y) ** 2);
    const d12 = Math.sqrt((positions[1].x - positions[2].x) ** 2 + (positions[1].y - positions[2].y) ** 2);
    expect(d01).toBeCloseTo(d12, 5);
  });

  it('5.9 physicsParamsがノードごとに異なる', () => {
    const system = createUniversalLibrarySystem(3);
    const g0 = system.multiverse.nodes[0].physicsParams.gravity;
    const g1 = system.multiverse.nodes[1].physicsParams.gravity;
    expect(g0).not.toBe(g1);
  });

  it('5.10 systemStats: 基本統計', () => {
    const system = createUniversalLibrarySystem(5, 7);
    const stats = systemStats(system);
    expect(stats.nodeCount).toBe(5);
    expect(stats.edgeCount).toBe(10); // C(5,2)
    expect(stats.dimensionCount).toBe(11);
    expect(stats.mirrorDepth).toBe(7);
    expect(stats.allAxiomsActive).toBe(true);
  });
});

// ============================================================
// §6 知識伝播シミュレーション (10 tests)
// ============================================================
describe('§6 知識伝播シミュレーション', () => {
  function createTestNetwork() {
    let net = createMultiverseNetwork();
    net = addNode(net, createLibraryNode('a', 'A', 'spiral', { x: 0, y: 0, z: 0 }));
    net = addNode(net, createLibraryNode('b', 'B', 'elliptical', { x: 10, y: 0, z: 0 }));
    net = addNode(net, createLibraryNode('c', 'C', 'ring', { x: 0, y: 10, z: 0 }));
    return connectAll(net);
  }

  it('6.1 propagateFragment: 基本伝播', () => {
    const net = createTestNetwork();
    const { network, steps } = propagateFragment(net, 'a', testFragment('f1'));
    expect(steps.length).toBeGreaterThan(0);
  });

  it('6.2 aから伝播: b, cに到達', () => {
    const net = createTestNetwork();
    const { steps } = propagateFragment(net, 'a', testFragment('f1'));
    const targetIds = steps.map(s => s.toId);
    expect(targetIds).toContain('b');
    expect(targetIds).toContain('c');
  });

  it('6.3 伝播後: 全ノードにσ断片', () => {
    const net = createTestNetwork();
    const { network } = propagateFragment(net, 'a', testFragment('f1'));
    const bNode = network.nodes.find(n => n.id === 'b')!;
    const cNode = network.nodes.find(n => n.id === 'c')!;
    expect(bNode.library.totalArchived).toBe(1);
    expect(cNode.library.totalArchived).toBe(1);
  });

  it('6.4 元のネットワークは変わらない', () => {
    const net = createTestNetwork();
    propagateFragment(net, 'a', testFragment('f1'));
    const bNode = net.nodes.find(n => n.id === 'b')!;
    expect(bNode.library.totalArchived).toBe(0);
  });

  it('6.5 各ステップにenergyIntensityがある', () => {
    const net = createTestNetwork();
    const { steps } = propagateFragment(net, 'a', testFragment('f1'));
    steps.forEach(s => {
      expect(s.energyIntensity).toBeGreaterThan(0);
    });
  });

  it('6.6 各ステップにdelayがある', () => {
    const net = createTestNetwork();
    const { steps } = propagateFragment(net, 'a', testFragment('f1'));
    steps.forEach(s => {
      expect(s.delay).toBeGreaterThanOrEqual(0);
    });
  });

  it('6.7 複数回伝播', () => {
    let net = createTestNetwork();
    const r1 = propagateFragment(net, 'a', testFragment('f1'));
    net = r1.network;
    const r2 = propagateFragment(net, 'b', testFragment('f2'));
    net = r2.network;
    // aからf1がb,cへ、bからf2がa,cへ
    const cNode = net.nodes.find(n => n.id === 'c')!;
    expect(cNode.library.totalArchived).toBe(2);
  });

  it('6.8 totalFragmentsが更新される', () => {
    const net = createTestNetwork();
    const { network } = propagateFragment(net, 'a', testFragment('f1'));
    expect(network.totalFragments).toBe(2); // b, c に各1
  });

  it('6.9 fragmentIdが記録される', () => {
    const net = createTestNetwork();
    const { steps } = propagateFragment(net, 'a', testFragment('myFragment'));
    expect(steps[0].fragmentId).toBe('myFragment');
  });

  it('6.10 存在しないoriginなら伝播なし', () => {
    const net = createTestNetwork();
    const { steps } = propagateFragment(net, 'nonexistent', testFragment('f1'));
    expect(steps).toHaveLength(0);
  });
});

// ============================================================
// §7 レポートと分析 (5 tests)
// ============================================================
describe('§7 レポートと分析', () => {
  it('7.1 systemStats: galaxyDistribution', () => {
    const system = createUniversalLibrarySystem(5);
    const stats = systemStats(system);
    expect(Object.keys(stats.galaxyDistribution).length).toBe(5);
  });

  it('7.2 systemStats: mirrorTotalFidelity > 1', () => {
    const system = createUniversalLibrarySystem(3, 10);
    const stats = systemStats(system);
    expect(stats.mirrorTotalFidelity).toBeGreaterThan(1);
  });

  it('7.3 systemStats: mirrorSelfSimilarity ≈ 1.0', () => {
    const system = createUniversalLibrarySystem(3, 5);
    const stats = systemStats(system);
    expect(stats.mirrorSelfSimilarity).toBeGreaterThan(0.99);
  });

  it('7.4 generateSystemReport: 文字列生成', () => {
    const system = createUniversalLibrarySystem();
    const report = generateSystemReport(system);
    expect(report).toContain('宇宙図書館');
    expect(report).toContain('多元宇宙');
    expect(report).toContain('合わせ鏡');
    expect(report).toContain('A1');
    expect(report).toContain('A2');
    expect(report).toContain('A3');
    expect(report).toContain('A4');
  });

  it('7.5 generateSystemReport: 存在のためのことば', () => {
    const system = createUniversalLibrarySystem();
    const report = generateSystemReport(system);
    expect(report).toContain('情報は消えない');
    expect(report).toContain('門は閉じない');
    expect(report).toContain('存在のためのことば');
  });
});
