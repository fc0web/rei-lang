/**
 * sigma-reactive.test.ts — 6属性相互反応テスト
 * 
 * relation → will → flow → memory → layer → relation の循環カスケード
 * 
 * テスト構成:
 *   1. 個別反応テスト（各属性間の1ステップ反応）
 *   2. カスケードテスト（フルチェーン連鎖）
 *   3. Reiパイプ統合テスト（bind/entangle/will_* がcascadeを返す）
 *   4. pulse（脈動）テスト
 *   5. 日本語構文テスト
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { rei } from '../src/index';
import {
  reactRelationToWill,
  reactWillToFlow,
  reactFlowToMemory,
  reactMemoryToLayer,
  reactLayerToRelation,
  cascadeFromRelation,
  cascadeFromWill,
  sigmaReactivePulse,
} from '../src/index';
import { createDeepSigmaMeta, type DeepSigmaMeta } from '../src/lang/sigma-deep';

function freshMeta(): DeepSigmaMeta {
  return createDeepSigmaMeta();
}

// ═══════════════════════════════════════════
// Part 1: 個別反応テスト
// ═══════════════════════════════════════════

describe('個別反応: relation → will', () => {
  it('bind は意志を強化する', () => {
    const meta = freshMeta();
    const r = reactRelationToWill(meta, 'bind');
    expect(r).not.toBeNull();
    expect(r!.attribute).toBe('will');
    expect(r!.trigger).toBe('relation:bind');
    expect(r!.after.strength).toBeGreaterThan(r!.before.strength);
  });

  it('entangle は共鳴を引き起こす', () => {
    const meta = freshMeta();
    const r = reactRelationToWill(meta, 'entangle', 'expand');
    expect(r).not.toBeNull();
    expect(r!.after.tendency).toBe('harmonize');
    expect(r!.after.strength).toBeGreaterThan(0);
    expect(r!.reason).toContain('共鳴');
  });

  it('unbind は意志を弱める', () => {
    const meta = freshMeta();
    meta.tendency = 'expand';
    const r = reactRelationToWill(meta, 'unbind');
    expect(r).not.toBeNull();
    expect(r!.trigger).toBe('relation:unbind');
  });
});

describe('個別反応: will → flow', () => {
  it('evolve は流れを加速する', () => {
    const meta = freshMeta();
    const r = reactWillToFlow(meta, 'evolve', 0.5);
    expect(r).not.toBeNull();
    expect(r!.attribute).toBe('flow');
    expect(r!.after.phase).toBe('accelerating');
    expect(r!.after.velocity).toBeGreaterThan(0);
  });

  it('align は流れを安定化する', () => {
    const meta = freshMeta();
    const r = reactWillToFlow(meta, 'align', 0.8);
    expect(r).not.toBeNull();
    expect(r!.after.phase).toBe('steady');
  });

  it('conflict(高intensity) は流れを逆転する', () => {
    const meta = freshMeta();
    const r = reactWillToFlow(meta, 'conflict', 0.9);
    expect(r).not.toBeNull();
    expect(r!.after.phase).toBe('reversing');
    expect(r!.after.velocity).toBeLessThan(0);
  });

  it('conflict(低intensity) は流れを減速する', () => {
    const meta = freshMeta();
    const r = reactWillToFlow(meta, 'conflict', 0.3);
    expect(r).not.toBeNull();
    expect(r!.after.phase).toBe('decelerating');
  });
});

describe('個別反応: flow → memory', () => {
  it('位相遷移が記憶に記録される', () => {
    const meta = freshMeta();
    const entryCountBefore = meta.structured.length;
    const r = reactFlowToMemory(meta, {
      from: 'rest',
      to: 'accelerating',
      velocity: 0.15,
    }, 'will:evolve');
    
    expect(r.attribute).toBe('memory');
    expect(r.after.entries).toBe(entryCountBefore + 1);
    expect(meta.structured.length).toBe(entryCountBefore + 1);
    expect(meta.structured[meta.structured.length - 1].operation).toContain('rest→accelerating');
  });
});

describe('個別反応: memory → layer', () => {
  it('記憶5件未満では層は変化しない', () => {
    const meta = freshMeta();
    meta.structured = Array(4).fill({});
    const r = reactMemoryToLayer(meta);
    expect(r).toBeNull();
  });

  it('記憶5件以上で層がnestedに深化', () => {
    const meta = freshMeta();
    meta.structured = Array(5).fill({});
    meta.nestDepth = 1;
    const r = reactMemoryToLayer(meta);
    expect(r).not.toBeNull();
    expect(r!.after.depth).toBe(2);
    expect(r!.after.structure).toBe('nested');
  });

  it('記憶10件以上で層がrecursiveに深化', () => {
    const meta = freshMeta();
    meta.structured = Array(10).fill({});
    meta.nestDepth = 1;
    const r = reactMemoryToLayer(meta);
    expect(r).not.toBeNull();
    expect(r!.after.depth).toBe(3);
    expect(r!.after.structure).toBe('recursive');
  });

  it('記憶20件以上で層がfractalに深化', () => {
    const meta = freshMeta();
    meta.structured = Array(20).fill({});
    meta.nestDepth = 1;
    const r = reactMemoryToLayer(meta);
    expect(r).not.toBeNull();
    expect(r!.after.depth).toBe(4);
    expect(r!.after.structure).toBe('fractal');
  });
});

describe('個別反応: layer → relation', () => {
  it('層が深化すると影響範囲が拡大する', () => {
    const meta = freshMeta();
    const r = reactLayerToRelation(meta, 1, 2);
    expect(r).not.toBeNull();
    expect(r!.attribute).toBe('relation');
    expect(r!.after.maxReach).toBeGreaterThan(r!.before.maxReach);
  });

  it('depth 3以上で共鳴強化', () => {
    const meta = freshMeta();
    const r = reactLayerToRelation(meta, 2, 3);
    expect(r).not.toBeNull();
    expect(r!.after.resonanceBoost).toBe(true);
    expect(r!.reason).toContain('共鳴強化');
  });

  it('深度が変わらなければ反応なし', () => {
    const meta = freshMeta();
    const r = reactLayerToRelation(meta, 2, 2);
    expect(r).toBeNull();
  });
});

// ═══════════════════════════════════════════
// Part 2: カスケードテスト
// ═══════════════════════════════════════════

describe('カスケード: relation起点', () => {
  it('bind からのカスケードが連鎖する', () => {
    const meta = freshMeta();
    const result = cascadeFromRelation(meta, 'bind');
    expect(result.reiType).toBe('CascadeResult');
    expect(result.reactions.length).toBeGreaterThanOrEqual(1);
    expect(result.depth).toBeGreaterThanOrEqual(1);
    // will反応は必ず起きる
    expect(result.reactions[0].attribute).toBe('will');
  });

  it('entangle からのカスケードはbindより深い', () => {
    const meta = freshMeta();
    const bindResult = cascadeFromRelation(freshMeta(), 'bind');
    const entangleResult = cascadeFromRelation(meta, 'entangle', 'expand');
    expect(entangleResult.reactions.length).toBeGreaterThanOrEqual(bindResult.reactions.length);
  });

  it('カスケードの各反応にtriggerが記録される', () => {
    const meta = freshMeta();
    const result = cascadeFromRelation(meta, 'bind');
    for (const reaction of result.reactions) {
      expect(reaction.trigger).toBeTruthy();
      expect(reaction.reason).toBeTruthy();
      expect(reaction.attribute).toBeTruthy();
    }
  });
});

describe('カスケード: will起点', () => {
  it('evolve からのカスケード', () => {
    const meta = freshMeta();
    const result = cascadeFromWill(meta, 'evolve', 0.7);
    expect(result.reiType).toBe('CascadeResult');
    expect(result.reactions.length).toBeGreaterThanOrEqual(1);
    expect(result.reactions[0].attribute).toBe('flow');
  });

  it('conflict(高intensity) はflow逆転を含む', () => {
    const meta = freshMeta();
    const result = cascadeFromWill(meta, 'conflict', 0.9);
    const flowReaction = result.reactions.find(r => r.attribute === 'flow');
    expect(flowReaction).toBeDefined();
    expect(flowReaction!.after.phase).toBe('reversing');
  });
});

// ═══════════════════════════════════════════
// Part 3: Reiパイプ統合テスト
// ═══════════════════════════════════════════

describe('Reiパイプ統合: bind にカスケードが付随', () => {
  beforeEach(() => rei.reset());

  it('bind の結果にcascadeが含まれる', () => {
    rei('let mut a = 𝕄{5; 1, 2, 3}');
    rei('let mut b = 𝕄{10; 4, 5, 6}');
    const result = rei('a |> bind("b", "mirror")');
    expect(result.cascade).toBeDefined();
    expect(result.cascade.reiType).toBe('CascadeResult');
    expect(result.cascade.reactions.length).toBeGreaterThanOrEqual(1);
  });

  it('cascade内の最初の反応はwill変化', () => {
    rei('let mut x = 𝕄{5; 1, 2}');
    rei('let mut y = 𝕄{10; 3, 4}');
    const result = rei('x |> bind("y")');
    expect(result.cascade.reactions[0].attribute).toBe('will');
    expect(result.cascade.reactions[0].trigger).toBe('relation:bind');
  });
});

describe('Reiパイプ統合: entangle にカスケードが付随', () => {
  beforeEach(() => rei.reset());

  it('entangle の結果にcascadeが含まれる', () => {
    rei('let mut p = 𝕄{3; 1, 2}');
    rei('let mut q = 𝕄{7; 5, 6}');
    rei('p |> bind("q")');
    const result = rei('p |> entangle("q")');
    expect(result.cascade).toBeDefined();
    expect(result.cascade.reiType).toBe('CascadeResult');
  });
});

describe('Reiパイプ統合: will_evolve にカスケードが付随', () => {
  beforeEach(() => rei.reset());

  it('will_evolve の結果にcascadeが含まれる', () => {
    rei('let mut w = 𝕄{5; 1, 2, 3}');
    rei('w |> intend("maximize")');
    const result = rei('w |> will_evolve');
    expect(result.reiType).toBe('WillEvolution');
    expect(result.cascade).toBeDefined();
    expect(result.cascade.reiType).toBe('CascadeResult');
  });
});

describe('Reiパイプ統合: will_align にカスケードが付随', () => {
  beforeEach(() => rei.reset());

  it('will_align の結果にcascadeが含まれる', () => {
    rei('let mut a = 𝕄{5; 1, 2}');
    rei('let mut b = 𝕄{10; 3, 4}');
    rei('a |> intend("maximize")');
    rei('b |> intend("minimize")');
    rei('a |> bind("b")');
    const result = rei('a |> will_align("b")');
    expect(result.reiType).toBe('WillAlignment');
    expect(result.cascade).toBeDefined();
  });
});

describe('Reiパイプ統合: will_conflict にカスケードが付随', () => {
  beforeEach(() => rei.reset());

  it('will_conflict の結果にcascadeが含まれる', () => {
    rei('let mut x = 𝕄{5; 1, 2}');
    rei('let mut y = 𝕄{10; 3, 4}');
    rei('x |> intend("maximize")');
    rei('y |> intend("minimize")');
    rei('x |> bind("y")');
    const result = rei('x |> will_conflict("y")');
    expect(result.reiType).toBe('WillConflict');
    expect(result.cascade).toBeDefined();
  });
});

// ═══════════════════════════════════════════
// Part 4: pulse（脈動）テスト
// ═══════════════════════════════════════════

describe('pulse（脈動）パイプ', () => {
  beforeEach(() => rei.reset());

  it('pulse は CascadeResult を返す', () => {
    rei('let mut v = 𝕄{5; 1, 2, 3}');
    const result = rei('v |> pulse');
    expect(result.reiType).toBe('CascadeResult');
    expect(typeof result.depth).toBe('number');
    expect(typeof result.stable).toBe('boolean');
    expect(typeof result.pulse).toBe('number');
  });

  it('pulse(3) は最大3回脈動する', () => {
    rei('let mut v = 𝕄{5; 1, 2, 3}');
    const result = rei('v |> pulse(3)');
    expect(result.pulse).toBeLessThanOrEqual(3);
  });

  it('意志がrestの安定した値は早期に停止する', () => {
    rei('let mut v = 42');
    const result = rei('v |> pulse(10)');
    expect(result.stable).toBe(true);
  });
});

describe('cascade（連鎖）パイプ', () => {
  beforeEach(() => rei.reset());

  it('cascade("bind") は relation起点のカスケード', () => {
    rei('let mut v = 𝕄{5; 1, 2, 3}');
    const result = rei('v |> cascade("bind")');
    expect(result.reiType).toBe('CascadeResult');
    expect(result.reactions[0]?.attribute).toBe('will');
  });

  it('cascade("evolve") は will起点のカスケード', () => {
    rei('let mut v = 𝕄{5; 1, 2, 3}');
    const result = rei('v |> cascade("evolve")');
    expect(result.reiType).toBe('CascadeResult');
    expect(result.reactions[0]?.attribute).toBe('flow');
  });

  it('cascade("conflict", 0.9) は高tension', () => {
    rei('let mut v = 𝕄{5; 1, 2, 3}');
    const result = rei('v |> cascade("conflict", 0.9)');
    const flowReaction = result.reactions.find((r: any) => r.attribute === 'flow');
    expect(flowReaction).toBeDefined();
    expect(flowReaction!.after.phase).toBe('reversing');
  });
});

// ═══════════════════════════════════════════
// Part 5: 日本語構文テスト
// ═══════════════════════════════════════════

describe('日本語構文: 脈動・連鎖', () => {
  beforeEach(() => rei.reset());

  it('脈動 = pulse', () => {
    rei('let mut v = 𝕄{5; 1, 2, 3}');
    const result = rei('v |> 脈動');
    expect(result.reiType).toBe('CascadeResult');
  });

  it('連鎖("bind") = cascade("bind")', () => {
    rei('let mut v = 𝕄{5; 1, 2, 3}');
    const result = rei('v |> 連鎖("bind")');
    expect(result.reiType).toBe('CascadeResult');
  });
});

// ═══════════════════════════════════════════
// Part 6: 循環カスケードの検証
// ═══════════════════════════════════════════

describe('循環カスケード: bind → will → flow → memory → layer', () => {
  it('十分な記憶蓄積でフルチェーンが発動する', () => {
    const meta = freshMeta();
    // 記憶を事前に蓄積して層の深化を起こせる状態にする
    for (let i = 0; i < 4; i++) {
      meta.structured.push({
        value: i,
        timestamp: i * 100,
        cause: 'pipe',
        operation: `test_${i}`,
      });
    }
    // bind + 蓄積された記憶 → フルカスケード
    const result = cascadeFromRelation(meta, 'bind');
    
    // will反応
    expect(result.reactions.some(r => r.attribute === 'will')).toBe(true);
    // flow反応
    expect(result.reactions.some(r => r.attribute === 'flow')).toBe(true);
    // memory反応
    expect(result.reactions.some(r => r.attribute === 'memory')).toBe(true);
    // 記憶が5件以上になったのでlayer反応も起きるはず
    expect(result.reactions.some(r => r.attribute === 'layer')).toBe(true);
    
    expect(result.depth).toBeGreaterThanOrEqual(4);
  });

  it('entangle は bind より強い連鎖を起こす', () => {
    const metaBind = freshMeta();
    const metaEntangle = freshMeta();
    // 同じ記憶量を事前投入
    for (let i = 0; i < 4; i++) {
      metaBind.structured.push({ value: i, timestamp: i * 100, cause: 'pipe' as const });
      metaEntangle.structured.push({ value: i, timestamp: i * 100, cause: 'pipe' as const });
    }
    const bindResult = cascadeFromRelation(metaBind, 'bind');
    const entangleResult = cascadeFromRelation(metaEntangle, 'entangle', 'expand');

    // entangleの方が意志変化が大きい
    const bindWill = bindResult.reactions.find(r => r.attribute === 'will');
    const entangleWill = entangleResult.reactions.find(r => r.attribute === 'will');
    expect(entangleWill!.after.strength).toBeGreaterThanOrEqual(bindWill!.after.strength);
  });
});
