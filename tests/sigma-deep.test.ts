/**
 * sigma-deep.test.ts — 6属性深化テスト
 * 
 * 各属性の深化が正しく動作することを検証する。
 * 既存の799テストを壊さない後方互換性も確認。
 */
import { describe, it, expect } from 'vitest';
import {
  createDeepSigmaMeta,
  wrapWithDeepSigma,
  buildDeepSigmaResult,
  type DeepSigmaMeta,
  type DeepSigmaResult,
} from '../src/lang/sigma-deep';

// ============================================================
// ヘルパー: パイプチェーンをシミュレーション
// ============================================================
function simulatePipeChain(
  values: any[],
  operations?: string[],
  refs?: string[][],
): { result: DeepSigmaResult; meta: DeepSigmaMeta } {
  let meta: DeepSigmaMeta | null = null;
  let wrapped: any = values[0];

  for (let i = 1; i < values.length; i++) {
    wrapped = wrapWithDeepSigma(
      values[i],
      wrapped,
      meta,
      operations?.[i - 1],
      refs?.[i - 1],
    );
    meta = wrapped.__sigma__ ?? wrapped;
    if (typeof meta !== 'object' || !('pipeCount' in meta)) {
      meta = wrapped.__sigma__;
    }
  }

  const finalMeta = meta ?? createDeepSigmaMeta();
  const result = buildDeepSigmaResult(values[values.length - 1], finalMeta);
  return { result, meta: finalMeta };
}

// ============================================================
// 1. 後方互換性テスト
// ============================================================
describe('後方互換性', () => {
  it('createDeepSigmaMeta は既存フィールドを含む', () => {
    const meta = createDeepSigmaMeta();
    expect(meta.memory).toEqual([]);
    expect(meta.tendency).toBe('rest');
    expect(meta.pipeCount).toBe(0);
  });

  it('SigmaResult は reiType を持つ', () => {
    const meta = createDeepSigmaMeta();
    const result = buildDeepSigmaResult(42, meta);
    expect(result.reiType).toBe('SigmaResult');
  });

  it('field は数値に対して center/neighbors を返す', () => {
    const meta = createDeepSigmaMeta();
    const result = buildDeepSigmaResult(42, meta);
    expect(result.field).toEqual({ center: 42, neighbors: [] });
  });

  it('memory.raw は元の値配列を保持する', () => {
    const { result } = simulatePipeChain([1, 2, 3, 4, 5]);
    expect(result.memory.raw).toContain(1);
    expect(result.memory.raw).toContain(2);
  });

  it('will.history は既存形式を維持する', () => {
    const { result } = simulatePipeChain([1, 3, 5, 7]);
    expect(result.will.history).toContain('expand');
  });
});

// ============================================================
// 2. 流れ (flow) 深化テスト
// ============================================================
describe('流れ (flow) 深化', () => {
  it('velocity: 値の変化速度を計算する', () => {
    const { result } = simulatePipeChain([0, 10, 30]);
    expect(result.flow.velocity).toBe(20); // 10→30 = +20
  });

  it('acceleration: 速度の変化率を計算する', () => {
    // 0→10 (v=10), 10→30 (v=20) → acceleration = 10
    const { result } = simulatePipeChain([0, 10, 30]);
    expect(result.flow.acceleration).toBe(10);
  });

  it('phase: rest — 静止状態', () => {
    const meta = createDeepSigmaMeta();
    const result = buildDeepSigmaResult(5, meta);
    expect(result.flow.phase).toBe('rest');
  });

  it('phase: accelerating — 加速中', () => {
    // v: 5, 10, 20 → acceleration > 0
    const { result } = simulatePipeChain([0, 5, 15, 35]);
    expect(result.flow.acceleration).toBeGreaterThan(0);
  });

  it('phase: decelerating — 減速中', () => {
    // v: 20, 10, 5 → acceleration < 0
    const { result } = simulatePipeChain([0, 20, 30, 35]);
    expect(result.flow.acceleration).toBeLessThan(0);
  });

  it('phase: reversing — 方向反転', () => {
    // 上昇→下降
    const { result } = simulatePipeChain([0, 10, 20, 15]);
    expect(result.flow.phase).toBe('reversing');
  });

  it('momentum: パイプ深度に一致する', () => {
    const { result } = simulatePipeChain([1, 2, 3, 4, 5]);
    expect(result.flow.momentum).toBe(4); // 4回パイプ通過
  });
});

// ============================================================
// 3. 記憶 (memory) 深化テスト
// ============================================================
describe('記憶 (memory) 深化', () => {
  it('entries: 構造化エントリが生成される', () => {
    const { result } = simulatePipeChain(
      [1, 2, 3],
      ['compute', 'evolve'],
    );
    expect(result.memory.entries.length).toBeGreaterThan(0);
    expect(result.memory.entries[0]).toHaveProperty('timestamp');
    expect(result.memory.entries[0]).toHaveProperty('cause');
  });

  it('dominantCause: 最も多い原因を特定する', () => {
    const { result } = simulatePipeChain(
      [1, 2, 3, 4, 5],
      ['compute', 'compute', 'evolve', 'compute'],
    );
    expect(result.memory.dominantCause).toBe('compute');
  });

  it('totalTransformations: パイプ回数と一致', () => {
    const { result } = simulatePipeChain([10, 20, 30, 40]);
    expect(result.memory.totalTransformations).toBe(3);
  });

  it('trajectory: expanding — 一貫して拡大', () => {
    const { result } = simulatePipeChain([1, 2, 4, 8, 16, 32]);
    expect(result.memory.trajectory).toBe('expanding');
  });

  it('trajectory: contracting — 一貫して縮小', () => {
    const { result } = simulatePipeChain([100, 50, 25, 12, 6]);
    expect(result.memory.trajectory).toBe('contracting');
  });

  it('trajectory: oscillating — 振動', () => {
    // 緩やかな振動（完全交互ではない → chaotic ではなく oscillating）
    const { result } = simulatePipeChain([10, 15, 12, 17, 14, 19, 16]);
    expect(result.memory.trajectory).toBe('oscillating');
  });

  it('trajectory: stable — 安定', () => {
    const { result } = simulatePipeChain([5, 5, 5, 5]);
    expect(result.memory.trajectory).toBe('stable');
  });

  it('span: 時間幅が0以上', () => {
    const { result } = simulatePipeChain([1, 2, 3]);
    expect(result.memory.span).toBeGreaterThanOrEqual(0);
  });

  it('sourceRefs: 参照変数が記録される', () => {
    const { result } = simulatePipeChain(
      [1, 2, 3],
      ['compute', 'evolve'],
      [['x'], ['x', 'y']],
    );
    const allRefs = result.memory.entries.flatMap(e => e.sourceRefs ?? []);
    expect(allRefs).toContain('x');
    expect(allRefs).toContain('y');
  });
});

// ============================================================
// 4. 層 (layer) 深化テスト
// ============================================================
describe('層 (layer) 深化', () => {
  it('flat: 単純な数値', () => {
    const meta = createDeepSigmaMeta();
    const result = buildDeepSigmaResult(42, meta);
    expect(result.layer.structure).toBe('flat');
    expect(result.layer.expandable).toBe(false);
  });

  it('nested: MDim は components を持つ', () => {
    const mdim = {
      reiType: 'MDim',
      center: 5,
      neighbors: [1, 2, 3, 4],
      mode: 'weighted',
    };
    const meta = createDeepSigmaMeta();
    const result = buildDeepSigmaResult(mdim, meta);
    expect(result.layer.components).toBe(4);
  });

  it('expandable: Ext は展開可能', () => {
    const ext = {
      reiType: 'Ext',
      base: 0,
      order: 3,
      subscripts: ['o', 'o', 'o'],
    };
    const meta = createDeepSigmaMeta();
    const result = buildDeepSigmaResult(ext, meta);
    expect(result.layer.expandable).toBe(true);
    expect(result.layer.depth).toBe(3);
  });

  it('recursive: 深い Ext は recursive', () => {
    const ext = {
      reiType: 'Ext',
      base: 0,
      order: 3,
      subscripts: ['o', 'o', 'o'],
    };
    const meta = createDeepSigmaMeta();
    const result = buildDeepSigmaResult(ext, meta);
    expect(result.layer.structure).toBe('recursive');
  });

  it('fractal: 非常に深い Ext は fractal', () => {
    const ext = {
      reiType: 'Ext',
      base: 0,
      order: 5,
      subscripts: ['o', 'o', 'o', 'o', 'o'],
    };
    const meta = createDeepSigmaMeta();
    const result = buildDeepSigmaResult(ext, meta);
    expect(result.layer.structure).toBe('fractal');
  });

  it('State: Genesis段階に応じた深さ', () => {
    const state = {
      reiType: 'State',
      state: '0₀',
      phase: 'extended_zero',
      omega: 'omega_0',
      history: ['void', 'point', '0₀'],
    };
    const meta = createDeepSigmaMeta();
    const result = buildDeepSigmaResult(state, meta);
    expect(result.layer.depth).toBe(3);
    expect(result.layer.expandable).toBe(true); // まだ進化可能
  });

  it('配列: ネストされた配列は nested', () => {
    const meta = createDeepSigmaMeta();
    const result = buildDeepSigmaResult([[1, 2], [3, 4]], meta);
    expect(result.layer.structure).toBe('nested');
    expect(result.layer.depth).toBe(2);
  });
});

// ============================================================
// 5. 関係 (relation) 深化テスト
// ============================================================
describe('関係 (relation) 深化', () => {
  it('isolated: 参照なしは孤立', () => {
    const meta = createDeepSigmaMeta();
    const result = buildDeepSigmaResult(42, meta);
    expect(result.relation.isolated).toBe(true);
    expect(result.relation.refs).toEqual([]);
  });

  it('refs: パイプ内の参照変数が追跡される', () => {
    const { result } = simulatePipeChain(
      [1, 2, 3],
      ['compute', 'compute'],
      [['x', 'y'], ['z']],
    );
    expect(result.relation.refs).toContain('x');
    expect(result.relation.refs).toContain('y');
    expect(result.relation.refs).toContain('z');
    expect(result.relation.isolated).toBe(false);
  });

  it('dependencies: 依存関係が構築される', () => {
    const { result } = simulatePipeChain(
      [1, 2, 3, 4],
      ['compute', 'compute', 'compute'],
      [['x'], ['x'], ['y']],
    );
    const xDep = result.relation.dependencies.find(d => d.ref === 'x');
    expect(xDep).toBeDefined();
    expect(xDep!.strength).toBeGreaterThan(0);
  });

  it('entanglements: 強い依存の数', () => {
    const { result } = simulatePipeChain(
      [1, 2, 3, 4, 5],
      ['compute', 'compute', 'compute', 'compute'],
      [['x'], ['x'], ['x'], ['x']],
    );
    // x は4回中4回参照 → strength = 1.0 → entanglement
    expect(result.relation.entanglements).toBeGreaterThan(0);
  });
});

// ============================================================
// 6. 意志 (will) 深化テスト
// ============================================================
describe('意志 (will) 深化', () => {
  it('intrinsic: ゼロは genesis', () => {
    const meta = createDeepSigmaMeta();
    const result = buildDeepSigmaResult(0, meta);
    expect(result.will.intrinsic).toBe('genesis');
  });

  it('intrinsic: 素数は irreducible', () => {
    const meta = createDeepSigmaMeta();
    const result = buildDeepSigmaResult(7, meta);
    expect(result.will.intrinsic).toBe('irreducible');
  });

  it('intrinsic: 完全数 (6) は harmonic', () => {
    const meta = createDeepSigmaMeta();
    const result = buildDeepSigmaResult(6, meta);
    expect(result.will.intrinsic).toBe('harmonic');
  });

  it('intrinsic: 小数は flowing', () => {
    const meta = createDeepSigmaMeta();
    const result = buildDeepSigmaResult(3.14, meta);
    expect(result.will.intrinsic).toBe('flowing');
  });

  it('intrinsic: MDim は centered/diffusive', () => {
    const mdim = {
      reiType: 'MDim',
      center: 5,
      neighbors: [1, 2],
      mode: 'weighted',
    };
    const meta = createDeepSigmaMeta();
    const result = buildDeepSigmaResult(mdim, meta);
    expect(result.will.intrinsic).toBe('centered');
  });

  it('intrinsic: Ext は expansive', () => {
    const ext = { reiType: 'Ext', base: 0, order: 2, subscripts: ['o', 'o'] };
    const meta = createDeepSigmaMeta();
    const result = buildDeepSigmaResult(ext, meta);
    expect(result.will.intrinsic).toBe('expansive');
  });

  it('confidence: 一貫した方向は高い信頼度', () => {
    const { result } = simulatePipeChain([1, 2, 3, 4, 5, 6, 7, 8]);
    expect(result.will.confidence).toBeGreaterThan(0.5);
  });

  it('confidence: ランダムな方向は低い信頼度', () => {
    const { result } = simulatePipeChain([1, 10, 2, 9, 3, 8, 4, 7]);
    expect(result.will.confidence).toBeLessThan(0.3);
  });

  it('prediction: 上昇トレンドでは次の値を予測', () => {
    const { result } = simulatePipeChain([1, 2, 3, 4, 5]);
    expect(result.will.prediction).toBeGreaterThan(5);
  });

  it('prediction: メモリ不足では null', () => {
    const meta = createDeepSigmaMeta();
    const result = buildDeepSigmaResult(42, meta);
    expect(result.will.prediction).toBeNull();
  });

  it('strength: パイプ回数に応じて増加', () => {
    const { result } = simulatePipeChain([1, 2, 3, 4, 5, 6]);
    expect(result.will.strength).toBe(1); // 5回以上で最大
  });
});

// ============================================================
// 7. 統合テスト — 6属性の連携
// ============================================================
describe('6属性統合', () => {
  it('全6属性が同時に返される', () => {
    const { result } = simulatePipeChain([1, 2, 3]);
    expect(result).toHaveProperty('field');
    expect(result).toHaveProperty('flow');
    expect(result).toHaveProperty('memory');
    expect(result).toHaveProperty('layer');
    expect(result).toHaveProperty('relation');
    expect(result).toHaveProperty('will');
  });

  it('長いパイプチェーンで全属性が正しく蓄積される', () => {
    const values = Array.from({ length: 20 }, (_, i) => i * 2);
    const ops = Array.from({ length: 19 }, () => 'compute');
    const refs = Array.from({ length: 19 }, (_, i) => [`var_${i % 3}`]);

    const { result } = simulatePipeChain(values, ops, refs);

    // flow
    expect(result.flow.momentum).toBe(19);
    expect(result.flow.phase).not.toBe('rest');

    // memory
    expect(result.memory.totalTransformations).toBe(19);
    expect(result.memory.trajectory).toBe('expanding');
    expect(result.memory.dominantCause).toBe('compute');

    // relation
    expect(result.relation.refs.length).toBeGreaterThan(0);
    expect(result.relation.isolated).toBe(false);

    // will
    expect(result.will.tendency).toBe('expand');
    expect(result.will.confidence).toBeGreaterThan(0);
    expect(result.will.prediction).not.toBeNull();
  });

  it('MDim値の6属性: 場+層+意志が連携する', () => {
    const mdim = {
      reiType: 'MDim',
      center: 10,
      neighbors: [2, 4, 6, 8, 10],
      mode: 'weighted',
    };
    const { result } = simulatePipeChain([5, mdim]);

    expect(result.field.center).toBe(10);
    expect(result.field.dim).toBe(5);
    expect(result.layer.components).toBe(5);
    expect(result.will.intrinsic).toBe('diffusive'); // 5つの隣接 → diffusive
  });

  it('Genesis値: 全属性がGenesis文脈を反映する', () => {
    const state = {
      reiType: 'State',
      state: '0₀',
      phase: 'extended_zero',
      omega: 'omega_0',
      history: ['void', 'point', '0₀'],
    };
    const meta = createDeepSigmaMeta();
    const result = buildDeepSigmaResult(state, meta);

    expect(result.field.state).toBe('0₀');
    expect(result.flow.direction).toBe('forward');
    expect(result.layer.expandable).toBe(true);
    expect(result.will.intrinsic).toBe('becoming');
  });
});
