/**
 * Phase 5.5b: 6属性動的相互作用テスト
 *
 * 動的カスケード、星座ライフサイクル、共鳴増幅
 */

import { describe, test, expect, beforeEach } from 'vitest';
import { rei } from '../src/index';
import {
  dynamicCascade,
  evolveConstellation,
  classifyLifecycle,
  detectResonanceAmplification,
  reactFieldToFlow,
  reactFieldToRelation,
  reactLayerToField,
  reactMemoryToWill,
  reactFlowToField,
  reactWillToRelation,
  getDynamicCascadeSigma,
  getConstellationHistorySigma,
} from '../src/lang/sigma-dynamics';
import { computeConstellation } from '../src/lang/sigma-attributes';
import { createDeepSigmaMeta } from '../src/lang/sigma-deep';

beforeEach(() => { rei.reset(); });

// ============================================================
// 新規カスケードパス: field の参加
// ============================================================

describe('場(field)のカスケード参加', () => {
  test('field → flow: 場の拡張が流れを加速', () => {
    const meta = createDeepSigmaMeta();
    const r = reactFieldToFlow(meta, 'expand');
    expect(r).not.toBeNull();
    expect(r!.attribute).toBe('flow');
    expect(r!.after.velocity).toBeGreaterThan(r!.before.velocity);
    expect(r!.reason).toContain('加速');
  });

  test('field → flow: 場の収縮が流れを減速', () => {
    const meta = createDeepSigmaMeta();
    meta.velocityHistory.push(0.5);
    const r = reactFieldToFlow(meta, 'contract');
    expect(r).not.toBeNull();
    expect(r!.after.velocity).toBeLessThan(r!.before.velocity);
  });

  test('field → flow: 場の融合が急流を発生', () => {
    const meta = createDeepSigmaMeta();
    const r = reactFieldToFlow(meta, 'merge');
    expect(r).not.toBeNull();
    expect(r!.after.velocity).toBeGreaterThan(0.2);
  });

  test('field → relation: 高密度の場が関係を誘発', () => {
    const meta = createDeepSigmaMeta();
    const r = reactFieldToRelation(meta, 'network', 0.8);
    expect(r).not.toBeNull();
    expect(r!.attribute).toBe('relation');
    expect(r!.reason).toContain('密度');
  });

  test('field → relation: 低密度の場は反応しない', () => {
    const meta = createDeepSigmaMeta();
    const r = reactFieldToRelation(meta, 'point', 0.2);
    expect(r).toBeNull();
  });

  test('layer → field: 層の深化が場の焦点を狭める', () => {
    const meta = createDeepSigmaMeta();
    const r = reactLayerToField(meta, 1, 3);
    expect(r).not.toBeNull();
    expect(r!.attribute).toBe('field');
    expect(r!.after.scope).toBe('narrow');
  });

  test('layer → field: 層の浅化が場の視野を広げる', () => {
    const meta = createDeepSigmaMeta();
    const r = reactLayerToField(meta, 3, 1);
    expect(r).not.toBeNull();
    expect(r!.after.scope).toBe('wide');
  });

  test('layer → field: 深度変化なしは反応なし', () => {
    const meta = createDeepSigmaMeta();
    const r = reactLayerToField(meta, 2, 2);
    expect(r).toBeNull();
  });
});

// ============================================================
// 逆方向・交差カスケード
// ============================================================

describe('逆方向・交差カスケード', () => {
  test('memory → will: 拡張操作の記憶が意志を形成', () => {
    const meta = createDeepSigmaMeta();
    meta.structured = Array(5).fill(null).map((_, i) => ({
      value: i, timestamp: i * 100, cause: 'pipe' as const, operation: 'add',
    }));
    meta.operations = ['add', 'extend', 'add', 'bind', 'grow'];
    meta.tendency = 'rest';
    const r = reactMemoryToWill(meta);
    expect(r).not.toBeNull();
    expect(r!.attribute).toBe('will');
    expect(r!.after.tendency).toBe('expand');
  });

  test('memory → will: 縮小操作の記憶が収縮の意志を形成', () => {
    const meta = createDeepSigmaMeta();
    meta.structured = Array(5).fill(null).map((_, i) => ({
      value: i, timestamp: i * 100, cause: 'pipe' as const, operation: 'remove',
    }));
    meta.operations = ['remove', 'filter', 'unbind', 'forget', 'remove'];
    meta.tendency = 'rest';
    const r = reactMemoryToWill(meta);
    expect(r).not.toBeNull();
    expect(r!.after.tendency).toBe('contract');
  });

  test('memory → will: 記憶不足では反応なし', () => {
    const meta = createDeepSigmaMeta();
    meta.structured = [{ value: 1, timestamp: 0, cause: 'genesis' as const }];
    const r = reactMemoryToWill(meta);
    expect(r).toBeNull();
  });

  test('flow → field: 正の速度が場を引き伸ばす', () => {
    const meta = createDeepSigmaMeta();
    const r = reactFlowToField(meta, 0.5);
    expect(r).not.toBeNull();
    expect(r!.attribute).toBe('field');
    expect(r!.after.shape).toBe('stretching');
  });

  test('flow → field: 負の速度が場を圧縮する', () => {
    const meta = createDeepSigmaMeta();
    const r = reactFlowToField(meta, -0.3);
    expect(r).not.toBeNull();
    expect(r!.after.shape).toBe('compressing');
  });

  test('flow → field: 微小速度では反応なし', () => {
    const meta = createDeepSigmaMeta();
    const r = reactFlowToField(meta, 0.05);
    expect(r).toBeNull();
  });

  test('will → relation: 拡大の意志が新たな関係を求める', () => {
    const meta = createDeepSigmaMeta();
    const r = reactWillToRelation(meta, 'expand', 0.7);
    expect(r).not.toBeNull();
    expect(r!.attribute).toBe('relation');
    expect(r!.after.state).toBe('seeking_new');
  });

  test('will → relation: 弱い意志は反応なし', () => {
    const meta = createDeepSigmaMeta();
    const r = reactWillToRelation(meta, 'expand', 0.1);
    expect(r).toBeNull();
  });
});

// ============================================================
// 動的カスケード（全結合版）
// ============================================================

describe('動的カスケード（全結合版）', () => {
  test('field起点のカスケードが複数属性に波及', () => {
    const meta = createDeepSigmaMeta();
    const r = dynamicCascade([1, 2, 3, 4, 5], meta, 'field', 'expand', 8);
    expect(r.reiType).toBe('DynamicCascadeResult');
    expect(r.reactions.length).toBeGreaterThan(0);
    expect(r.paths.length).toBeGreaterThan(0);
    expect(r.paths[0][0]).toBe('field');
    expect(r.constellation.before).toBeDefined();
    expect(r.constellation.after).toBeDefined();
  });

  test('relation起点のカスケード', () => {
    const meta = createDeepSigmaMeta();
    const r = dynamicCascade(42, meta, 'relation', 'bind', 8);
    expect(r.reiType).toBe('DynamicCascadeResult');
    expect(r.reactions.length).toBeGreaterThan(0);
    // relation → will は既存パスなので必ず発火
    const willReaction = r.reactions.find(r => r.attribute === 'will');
    expect(willReaction).toBeDefined();
  });

  test('will起点のカスケード', () => {
    const meta = createDeepSigmaMeta();
    meta.tendency = 'expand';
    const r = dynamicCascade([1, 2, 3], meta, 'will', 'evolve', 8);
    expect(r.reiType).toBe('DynamicCascadeResult');
    expect(r.reactions.length).toBeGreaterThan(0);
  });

  test('memory起点のカスケード', () => {
    const meta = createDeepSigmaMeta();
    meta.structured = Array(10).fill(null).map((_, i) => ({
      value: i, timestamp: i * 100, cause: 'pipe' as const, operation: 'transform',
    }));
    meta.operations = Array(10).fill('transform');
    const r = dynamicCascade([1, 2, 3], meta, 'memory', 'accumulate', 8);
    expect(r.reiType).toBe('DynamicCascadeResult');
  });

  test('layer起点のカスケード', () => {
    const meta = createDeepSigmaMeta();
    meta.nestDepth = 2;
    const r = dynamicCascade([[1, 2], [3, 4]], meta, 'layer', 'deepen', 8);
    expect(r.reiType).toBe('DynamicCascadeResult');
    expect(r.depth).toBeGreaterThan(0);
  });

  test('カスケードは安定する（無限ループしない）', () => {
    const meta = createDeepSigmaMeta();
    const r = dynamicCascade([1, 2, 3], meta, 'field', 'restructure', 20);
    expect(r.depth).toBeLessThanOrEqual(20);
    expect(typeof r.stable).toBe('boolean');
  });

  test('星座パターンの変化を検出', () => {
    const meta = createDeepSigmaMeta();
    const r = dynamicCascade([1, 2, 3], meta, 'field', 'expand', 8);
    expect(typeof r.constellation.patternChanged).toBe('boolean');
    expect(typeof r.constellation.transition).toBe('string');
  });

  test('パイプ経由: dynamic_cascade', () => {
    const r = rei('[1, 2, 3, 4, 5] |> dynamic_cascade("field", "expand")');
    expect(r.reiType).toBe('DynamicCascadeResult');
    expect(r.reactions.length).toBeGreaterThan(0);
  });

  test('パイプ経由: 動的連鎖 (Japanese)', () => {
    const r = rei('[1, 2, 3] |> 動的連鎖("relation", "bind")');
    expect(r.reiType).toBe('DynamicCascadeResult');
  });

  test('cascade_sigma: カスケード結果のσ', () => {
    const r = rei('[1, 2, 3] |> dynamic_cascade("field", "expand") |> cascade_sigma');
    expect(r.reiType).toBe('SigmaResult');
    expect(r.domain).toBe('meta');
    expect(r.subtype).toBe('dynamic_cascade');
    expect(r.cascade).toBeDefined();
    expect(r.constellationTransition).toBeDefined();
  });

  test('連鎖σ (Japanese)', () => {
    const r = rei('[1, 2, 3] |> 動的連鎖("field", "expand") |> 連鎖σ');
    expect(r.reiType).toBe('SigmaResult');
  });
});

// ============================================================
// 星座ライフサイクル
// ============================================================

describe('星座ライフサイクル', () => {
  test('ライフサイクル段階の判定: 萌芽', () => {
    const meta = createDeepSigmaMeta();
    const c = computeConstellation(42, meta);
    // 初期状態は活性が低い → 萌芽 or 成長
    const lifecycle = classifyLifecycle(c);
    expect(['萌芽', '成長', '変容', '再生', '成熟', '調和']).toContain(lifecycle);
  });

  test('パイプ経由: lifecycle', () => {
    const r = rei('[1, 2, 3] |> lifecycle');
    expect(typeof r).toBe('string');
    expect(['萌芽', '成長', '変容', '再生', '成熟', '調和']).toContain(r);
  });

  test('生命段階 (Japanese)', () => {
    const r = rei('42 |> 生命段階');
    expect(typeof r).toBe('string');
  });

  test('星座の時間発展: 基本', () => {
    const meta = createDeepSigmaMeta();
    meta.tendency = 'expand';
    meta.pipeCount = 3;
    const r = evolveConstellation([1, 2, 3], meta, 10);
    expect(r.reiType).toBe('ConstellationHistory');
    expect(r.snapshots.length).toBeGreaterThan(1);
    expect(r.snapshots[0].step).toBe(0);
    expect(r.lifecycle).toBeDefined();
  });

  test('星座の時間発展: 摂動付き', () => {
    const meta = createDeepSigmaMeta();
    const r = evolveConstellation([1, 2, 3, 4, 5], meta, 10, [
      { step: 3, attr: 'field', event: 'expand' },
      { step: 7, attr: 'will', event: 'evolve' },
    ]);
    expect(r.reiType).toBe('ConstellationHistory');
    expect(r.snapshots.length).toBeGreaterThan(2);
    // 摂動ステップのスナップショットがある
    const step3 = r.snapshots.find(s => s.step === 3);
    expect(step3).toBeDefined();
    expect(step3!.trigger).toContain('field');
  });

  test('パイプ経由: evolve_constellation', () => {
    const r = rei('[1, 2, 3] |> evolve_constellation(5)');
    expect(r.reiType).toBe('ConstellationHistory');
    expect(r.snapshots.length).toBeGreaterThan(0);
  });

  test('星座発展 (Japanese)', () => {
    const r = rei('[1, 2, 3] |> 星座発展(5)');
    expect(r.reiType).toBe('ConstellationHistory');
  });

  test('constellation_history_sigma', () => {
    const r = rei('[1, 2, 3] |> evolve_constellation(5) |> constellation_history_sigma');
    expect(r.reiType).toBe('SigmaResult');
    expect(r.domain).toBe('meta');
    expect(r.subtype).toBe('constellation_history');
    expect(r.lifecycle).toBeDefined();
  });

  test('星座履歴σ (Japanese)', () => {
    const r = rei('[1, 2, 3] |> 星座発展(5) |> 星座履歴σ');
    expect(r.reiType).toBe('SigmaResult');
  });
});

// ============================================================
// 共鳴増幅
// ============================================================

describe('共鳴増幅', () => {
  test('共鳴検出の基本', () => {
    const meta = createDeepSigmaMeta();
    const c = computeConstellation([1, 2, 3], meta);
    const r = detectResonanceAmplification(c);
    expect(r.reiType).toBe('ResonanceAmplification');
    expect(typeof r.amplificationFactor).toBe('number');
    expect(r.amplificationFactor).toBeGreaterThanOrEqual(1);
    expect(Array.isArray(r.feedbackLoops)).toBe(true);
  });

  test('パイプ経由: resonance_detect', () => {
    const r = rei('[1, 2, 3, 4, 5] |> resonance_detect');
    expect(r.reiType).toBe('ResonanceAmplification');
    expect(typeof r.amplificationFactor).toBe('number');
  });

  test('共鳴検出 (Japanese)', () => {
    const r = rei('[1, 2, 3] |> 共鳴検出');
    expect(r.reiType).toBe('ResonanceAmplification');
  });

  test('共鳴が多いほど増幅係数が大きい', () => {
    // 共鳴なしの場合
    const noResonance = detectResonanceAmplification({
      reiType: 'AttributeConstellation',
      attributes: { field: 0.9, flow: 0.1, memory: 0.5, layer: 0.2, relation: 0.8, will: 0.0 },
      balance: 0.2, dominantAttribute: 'field', weakestAttribute: 'will',
      resonances: [], harmony: 0, pattern: '萌芽（芽）',
    });

    // 共鳴ありの場合
    const withResonance = detectResonanceAmplification({
      reiType: 'AttributeConstellation',
      attributes: { field: 0.5, flow: 0.5, memory: 0.5, layer: 0.5, relation: 0.5, will: 0.5 },
      balance: 0.9, dominantAttribute: 'field', weakestAttribute: 'will',
      resonances: [['field', 'flow', 0.95], ['memory', 'layer', 0.9], ['relation', 'will', 0.92]],
      harmony: 0.7, pattern: '調和（和）',
    });

    expect(withResonance.amplificationFactor).toBeGreaterThan(noResonance.amplificationFactor);
  });
});

// ============================================================
// 統合テスト
// ============================================================

describe('動的相互作用: 統合テスト', () => {
  test('フルパイプライン: 星座→動的連鎖→σ', () => {
    const r = rei('[1, 2, 3, 4, 5] |> dynamic_cascade("field", "merge") |> cascade_sigma');
    expect(r.reiType).toBe('SigmaResult');
    expect(r.cascade.depth).toBeGreaterThan(0);
  });

  test('フルパイプライン: 星座発展→σ', () => {
    const r = rei('[1, 2, 3] |> evolve_constellation(10) |> constellation_history_sigma');
    expect(r.reiType).toBe('SigmaResult');
    expect(r.field.snapshots).toBeGreaterThan(0);
  });

  test('既存cascade/pulseとの共存', () => {
    rei('let mut a = 𝕄{5; 1, 2, 3}');
    // 既存のpulseコマンドが動作
    const pulse = rei('a |> pulse');
    expect(pulse.reiType).toBe('CascadeResult');
    // 新規の動的連鎖も動作
    const dynamic = rei('a |> dynamic_cascade("field", "expand")');
    expect(dynamic.reiType).toBe('DynamicCascadeResult');
  });

  test('既存のbindとdynamic_cascadeの連携', () => {
    rei('let mut x = 𝕄{10; 1, 2, 3}');
    rei('let mut y = 𝕄{20; 4, 5, 6}');
    rei('x |> bind("y", "mirror")');
    // bind後にrelation起点のカスケードを実行
    const r = rei('x |> dynamic_cascade("relation", "bind")');
    expect(r.reiType).toBe('DynamicCascadeResult');
    expect(r.reactions.length).toBeGreaterThan(0);
  });

  test('全6属性の起点からカスケード発火可能', () => {
    const attrs = ['field', 'flow', 'memory', 'layer', 'relation', 'will'] as const;
    const events = ['expand', 'shift', 'accumulate', 'deepen', 'bind', 'evolve'];
    
    for (let i = 0; i < attrs.length; i++) {
      const r = rei(`[1, 2, 3] |> dynamic_cascade("${attrs[i]}", "${events[i]}")`);
      expect(r.reiType).toBe('DynamicCascadeResult');
    }
  });

  test('日本語エイリアス一通り', () => {
    expect(rei('[1] |> 動的連鎖("field", "expand")').reiType).toBe('DynamicCascadeResult');
    expect(rei('[1] |> 星座発展(3)').reiType).toBe('ConstellationHistory');
    expect(typeof rei('[1] |> 生命段階')).toBe('string');
    expect(rei('[1] |> 共鳴検出').reiType).toBe('ResonanceAmplification');
  });
});
