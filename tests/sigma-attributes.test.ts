/**
 * Phase 5.5: 6属性ファーストクラス化テスト
 * 
 * 場(field)・流れ(flow)・記憶(memory)・層(layer)の直接操作
 * 関係(relation)・意志(will)の拡張
 * 属性星座(constellation)の全体分析
 */

import { describe, test, expect, beforeEach } from 'vitest';
import { rei } from '../src/index';
import { computeCollectiveWill } from '../src/lang/sigma-attributes';

beforeEach(() => { rei.reset(); });

// ============================================================
// 場 (field) — 直接クエリ・操作
// ============================================================

describe('6属性深化: 場 (field)', () => {
  test('field_of: 配列の場情報', () => {
    const r = rei('[1, 2, 3, 4, 5] |> field_of');
    expect(r.reiType).toBe('FieldInfo');
    expect(r.topology).toBe('linear');
    expect(r.dimensions).toBe(1);
    expect(r.neighbors).toHaveLength(5);
  });

  test('field_of: 数値の場情報', () => {
    const r = rei('42 |> field_of');
    expect(r.reiType).toBe('FieldInfo');
    expect(r.topology).toBe('point');
    expect(r.center).toBe(42);
  });

  test('field_of: 文字列の場情報', () => {
    const r = rei('"hello" |> field_of');
    expect(r.reiType).toBe('FieldInfo');
    expect(r.topology).toBe('linear');
    expect(r.density).toBeGreaterThan(0);
  });

  test('場 (Japanese alias)', () => {
    const r = rei('[1, 2, 3] |> 場');
    expect(r.reiType).toBe('FieldInfo');
  });

  test('field_set: 配列要素を設定', () => {
    const r = rei('[1, 2, 3] |> field_set("1", 99)');
    expect(r).toEqual([1, 99, 3]);
  });

  test('field_merge: 2つの場をマージ', () => {
    const r = rei('[1, 2] |> field_merge([3, 4])');
    expect(r).toEqual([1, 2, 3, 4]);
  });

  test('field_topology: トポロジー分析', () => {
    const r = rei('[1, 2, 3, 4, 5] |> field_topology');
    expect(r.topology).toBe('linear');
    expect(r.connectivity).toBeGreaterThan(0);
    expect(typeof r.symmetry).toBe('number');
  });

  test('field_topology: 対称配列', () => {
    const r = rei('[1, 2, 3, 2, 1] |> field_topology');
    expect(r.symmetry).toBe(1);  // 完全対称
  });
});

// ============================================================
// 流れ (flow) — 直接クエリ・制御
// ============================================================

describe('6属性深化: 流れ (flow)', () => {
  test('flow_of: 流れ情報の取得', () => {
    const r = rei('42 |> flow_of');
    expect(r.reiType).toBe('FlowInfo');
    expect(r.phase).toBeDefined();
    expect(typeof r.momentum).toBe('number');
    expect(typeof r.velocity).toBe('number');
  });

  test('流れ (Japanese alias)', () => {
    const r = rei('[1, 2, 3] |> 流れ');
    expect(r.reiType).toBe('FlowInfo');
  });

  test('flow_set: 流れの方向設定', () => {
    rei('let mut a = 10');
    const r = rei('a |> flow_set("expand") |> flow_of');
    expect(r.reiType).toBe('FlowInfo');
  });

  test('flow_reverse: 流れの反転', () => {
    rei('let mut a = [1, 2, 3]');
    const r = rei('a |> flow_reverse |> flow_of');
    expect(r.reiType).toBe('FlowInfo');
  });

  test('flow_accelerate: 流れの加速', () => {
    const r = rei('[1, 2, 3] |> flow_accelerate(2.0) |> flow_of');
    expect(r.reiType).toBe('FlowInfo');
  });
});

// ============================================================
// 記憶 (memory) — 直接クエリ・操作
// ============================================================

describe('6属性深化: 記憶 (memory)', () => {
  test('memory_of: 記憶情報の取得', () => {
    const r = rei('42 |> memory_of');
    expect(r.reiType).toBe('MemoryInfo');
    expect(typeof r.count).toBe('number');
    expect(r.trajectory).toBeDefined();
  });

  test('記憶 (Japanese alias)', () => {
    const r = rei('"test" |> 記憶');
    expect(r.reiType).toBe('MemoryInfo');
  });

  test('memory_search: 記憶検索', () => {
    const r = rei('42 |> memory_search("pipe")');
    expect(Array.isArray(r)).toBe(true);
  });

  test('memory_snapshot: 特定時点のスナップショット', () => {
    const r = rei('42 |> memory_snapshot(-1)');
    // 直接値ではmemoryエントリがないのでnull
    // （パイプチェーン内でmemoryが蓄積される場合にはエントリが返る）
    expect(r === null || typeof r === 'object').toBe(true);
  });

  test('memory_forget: 記憶の忘却', () => {
    rei('let mut a = 10');
    const r = rei('a |> memory_forget(3)');
    expect(r).toBeDefined();
  });
});

// ============================================================
// 層 (layer) — 直接クエリ・操作
// ============================================================

describe('6属性深化: 層 (layer)', () => {
  test('layer_of: 層情報の取得', () => {
    const r = rei('[1, 2, 3] |> layer_of');
    expect(r.reiType).toBe('LayerInfo');
    expect(r.structure).toBe('flat');
    expect(r.expandable).toBe(false);
  });

  test('layer_of: ネスト配列', () => {
    const r = rei('[[1, 2], [3, 4]] |> layer_of');
    expect(r.reiType).toBe('LayerInfo');
    expect(r.structure).toBe('nested');
    expect(r.expandable).toBe(true);
    expect(r.components).toBeGreaterThan(0);
  });

  test('層 (Japanese alias)', () => {
    const r = rei('[1, 2] |> 層');
    expect(r.reiType).toBe('LayerInfo');
  });

  test('layer_deepen: 層の深化', () => {
    const r = rei('[1, 2, 3, 4] |> layer_deepen');
    expect(Array.isArray(r)).toBe(true);
    expect(r.length).toBe(2);     // 2つのサブ配列に分割
    expect(Array.isArray(r[0])).toBe(true);
  });

  test('layer_flatten: 層の平坦化', () => {
    const r = rei('[[1, 2], [3, 4]] |> layer_flatten');
    expect(r).toEqual([1, 2, 3, 4]);
  });

  test('deepen → flatten は元に戻る', () => {
    const r = rei('[1, 2, 3, 4] |> layer_deepen |> layer_flatten');
    expect(r).toEqual([1, 2, 3, 4]);
  });
});

// ============================================================
// 関係 拡張 (relation extended)
// ============================================================

describe('6属性深化: 関係拡張 (relation)', () => {
  test('relation_topology: 関係トポロジー', () => {
    rei('let mut a = 10');
    const r = rei('a |> relation_topology');
    expect(r.reiType).toBe('RelationTopology');
    expect(typeof r.totalBindings).toBe('number');
    expect(typeof r.isolationDegree).toBe('number');
  });

  test('relation_topology: バインド後', () => {
    rei('let mut a = 10');
    rei('let mut b = 20');
    rei('a |> bind("b", "mirror")');
    const r = rei('a |> relation_topology');
    expect(r.reiType).toBe('RelationTopology');
    expect(r.totalBindings).toBeGreaterThan(0);
  });

  test('relation_symmetry: 関係の対称性', () => {
    rei('let mut a = 10');
    const r = rei('a |> relation_symmetry');
    expect(typeof r.symmetricCount).toBe('number');
    expect(typeof r.symmetryRatio).toBe('number');
    expect(r.dominantDirection).toBeDefined();
  });

  test('関係位相 (Japanese alias)', () => {
    rei('let mut x = 5');
    const r = rei('x |> 関係位相');
    expect(r.reiType).toBe('RelationTopology');
  });
});

// ============================================================
// 意志 拡張 (will extended)
// ============================================================

describe('6属性深化: 意志拡張 (will)', () => {
  test('will_emerge: 意志の創発', () => {
    const r = rei('42 |> will_emerge');
    expect(typeof r.direction).toBe('string');
    expect(typeof r.confidence).toBe('number');
    expect(typeof r.source).toBe('string');
  });

  test('意志創発 (Japanese alias)', () => {
    const r = rei('[1, 2, 3] |> 意志創発');
    expect(r.direction).toBeDefined();
  });

  test('will_collective: 集合的意志', () => {
    const wills = [
      { tendency: 'expand', strength: 0.8 },
      { tendency: 'expand', strength: 0.6 },
      { tendency: 'contract', strength: 0.3 },
    ];
    const r = computeCollectiveWill(wills);
    expect(r.reiType).toBe('CollectiveWill');
    expect(r.dominant).toBe('expand');
    expect(r.consensus).toBeGreaterThan(0);
    expect(Array.isArray(r.dissent)).toBe(true);
  });

  test('will_collective: 全員一致', () => {
    const wills = [
      { tendency: 'seek', strength: 0.9 },
      { tendency: 'seek', strength: 0.7 },
    ];
    const r = computeCollectiveWill(wills);
    expect(r.consensus).toBe(1);
    expect(r.dissent).toHaveLength(0);
  });

  test('will_collective: 創発的傾向', () => {
    const wills = [
      { tendency: 'expand', strength: 0.5 },
      { tendency: 'contract', strength: 0.5 },
      { tendency: 'spiral', strength: 0.5 },
    ];
    const r = computeCollectiveWill(wills);
    expect(r.emergent).toBeDefined();
    expect(r.emergent).not.toBeNull();
  });
});

// ============================================================
// 属性星座 (constellation)
// ============================================================

describe('6属性深化: 属性星座 (constellation)', () => {
  test('constellation: 基本分析', () => {
    const r = rei('[1, 2, 3, 4, 5] |> constellation');
    expect(r.reiType).toBe('AttributeConstellation');
    expect(r.attributes).toBeDefined();
    expect(r.attributes.field).toBeGreaterThanOrEqual(0);
    expect(r.attributes.flow).toBeGreaterThanOrEqual(0);
    expect(r.attributes.memory).toBeGreaterThanOrEqual(0);
    expect(r.attributes.layer).toBeGreaterThanOrEqual(0);
    expect(r.attributes.relation).toBeGreaterThanOrEqual(0);
    expect(r.attributes.will).toBeGreaterThanOrEqual(0);
  });

  test('星座 (Japanese alias)', () => {
    const r = rei('42 |> 星座');
    expect(r.reiType).toBe('AttributeConstellation');
    expect(r.pattern).toBeDefined();
  });

  test('constellation: バランス度', () => {
    const r = rei('[1, 2, 3] |> constellation');
    expect(typeof r.balance).toBe('number');
    expect(r.balance).toBeGreaterThanOrEqual(0);
    expect(r.balance).toBeLessThanOrEqual(1);
  });

  test('constellation: パターン名', () => {
    const r = rei('"hello world" |> constellation');
    expect(typeof r.pattern).toBe('string');
    // パターン名は日本語
    expect(r.pattern.length).toBeGreaterThan(0);
  });

  test('constellation: 支配属性と最弱属性', () => {
    const r = rei('[1, 2, 3, 4, 5, 6, 7, 8, 9, 10] |> constellation');
    expect(r.dominantAttribute).toBeDefined();
    expect(r.weakestAttribute).toBeDefined();
    expect(r.dominantAttribute).not.toBe(r.weakestAttribute);
  });

  test('constellation: 共鳴ペア', () => {
    const r = rei('[1, 2, 3] |> constellation');
    expect(Array.isArray(r.resonances)).toBe(true);
    if (r.resonances.length > 0) {
      expect(r.resonances[0]).toHaveLength(3); // [attr1, attr2, strength]
    }
  });

  test('attr_balance: バランス情報', () => {
    const r = rei('[1, 2, 3] |> attr_balance');
    expect(typeof r.balance).toBe('number');
    expect(typeof r.dominant).toBe('string');
    expect(typeof r.weakest).toBe('string');
    expect(typeof r.pattern).toBe('string');
  });

  test('属性均衡 (Japanese alias)', () => {
    const r = rei('"test" |> 属性均衡');
    expect(r.balance).toBeDefined();
  });

  test('attr_resonance: 属性間共鳴', () => {
    const r = rei('[1, 2, 3] |> attr_resonance');
    expect(Array.isArray(r.resonances)).toBe(true);
    expect(typeof r.harmony).toBe('number');
  });

  test('属性共鳴 (Japanese alias)', () => {
    const r = rei('42 |> 属性共鳴');
    expect(r.harmony).toBeDefined();
  });

  test('constellation_sigma: 星座のσ', () => {
    const r = rei('[1, 2, 3] |> constellation |> constellation_sigma');
    expect(r.reiType).toBe('SigmaResult');
    expect(r.domain).toBe('meta');
    expect(r.subtype).toBe('constellation');
    expect(r.attributes).toBeDefined();
    expect(r.balance).toBeDefined();
    expect(r.harmony).toBeDefined();
  });

  test('星座σ (Japanese alias)', () => {
    const r = rei('"text" |> 星座 |> 星座σ');
    expect(r.reiType).toBe('SigmaResult');
  });
});

// ============================================================
// 統合テスト
// ============================================================

describe('6属性深化: 統合テスト', () => {
  test('全6属性を同一値から取得', () => {
    const val = '[1, 2, 3, 4, 5]';
    const field = rei(`${val} |> field_of`);
    const flow = rei(`${val} |> flow_of`);
    const memory = rei(`${val} |> memory_of`);
    const layer = rei(`${val} |> layer_of`);
    
    expect(field.reiType).toBe('FieldInfo');
    expect(flow.reiType).toBe('FlowInfo');
    expect(memory.reiType).toBe('MemoryInfo');
    expect(layer.reiType).toBe('LayerInfo');
  });

  test('層操作: deepen → layer_of → flatten', () => {
    const deepened = rei('[1, 2, 3, 4] |> layer_deepen');
    expect(Array.isArray(deepened[0])).toBe(true);
    
    const info = rei('[[1, 2], [3, 4]] |> layer_of');
    expect(info.structure).toBe('nested');
    
    const flat = rei('[[1, 2], [3, 4]] |> layer_flatten');
    expect(flat).toEqual([1, 2, 3, 4]);
  });

  test('既存機能との共存: bind後のrelation_topology', () => {
    rei('let mut a = 𝕄{5; 1, 2, 3}');
    rei('let mut b = 𝕄{10; 4, 5, 6}');
    rei('a |> bind("b", "mirror")');
    
    const topo = rei('a |> relation_topology');
    expect(topo.totalBindings).toBeGreaterThan(0);
    
    const sym = rei('a |> relation_symmetry');
    expect(sym.symmetricCount).toBeGreaterThanOrEqual(0);
  });

  test('既存σとの共存', () => {
    const sigma = rei('𝕄{5; 1, 2, 3} |> sigma');
    expect(sigma).toBeDefined();
    expect(sigma.field).toBeDefined();
    expect(sigma.flow).toBeDefined();
    expect(sigma.memory).toBeDefined();
  });

  test('星座 → σ チェーン', () => {
    const r = rei('[1, 2, 3] |> constellation |> constellation_sigma');
    expect(r.reiType).toBe('SigmaResult');
    expect(r.field.center).toBeDefined();
    expect(r.will.tendency).toBeDefined();
  });

  test('日本語エイリアス一通り', () => {
    expect(rei('[1] |> 場').reiType).toBe('FieldInfo');
    expect(rei('[1] |> 流れ').reiType).toBe('FlowInfo');
    expect(rei('[1] |> 記憶').reiType).toBe('MemoryInfo');
    expect(rei('[1] |> 層').reiType).toBe('LayerInfo');
    expect(rei('[1] |> 星座').reiType).toBe('AttributeConstellation');
  });
});
