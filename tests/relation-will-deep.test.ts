/**
 * relation-will-deep.test.ts
 * relation/will 深化テスト — 縁起的追跡 + 意志の自律性
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { rei } from '../src/index';

function reiMulti(...lines: string[]): { results: any[] } {
  rei.reset();
  const results: any[] = [];
  for (const line of lines) {
    results.push(rei(line));
  }
  return { results };
}

// ═══════════════════════════════════════════
// Part 1: trace（追跡）
// ═══════════════════════════════════════════

describe('trace / 追跡 — 依存チェーン', () => {
  beforeEach(() => rei.reset());

  it('単一結合の追跡', () => {
    const { results } = reiMulti(
      'let mut a = 𝕄{5; 1, 2, 3}',
      'let mut b = 𝕄{10; 4, 5, 6}',
      'a |> bind("b", "mirror")',
      'a |> trace',
    );
    const trace = results[3];
    expect(trace.reiType).toBe('TraceResult');
    expect(trace.root).toBe('a');
    expect(trace.totalRefs).toBeGreaterThanOrEqual(2);
    expect(trace.nodes.length).toBeGreaterThanOrEqual(2);
  });

  it('チェーン結合の推移的追跡 (a→b→c)', () => {
    const { results } = reiMulti(
      'let mut a = 𝕄{1; 2, 3}',
      'let mut b = 𝕄{4; 5, 6}',
      'let mut c = 𝕄{7; 8, 9}',
      'a |> bind("b", "mirror")',
      'b |> bind("c", "mirror")',
      'a |> trace',
    );
    const trace = results[5];
    expect(trace.totalRefs).toBeGreaterThanOrEqual(3);
    expect(trace.maxDepth).toBeGreaterThanOrEqual(2);
    const hasC = trace.chains.some((ch: string[]) => ch.includes('c'));
    expect(hasC).toBe(true);
  });

  it('孤立した値の追跡', () => {
    const { results } = reiMulti(
      'let mut a = 𝕄{5; 1, 2, 3}',
      'a |> trace',
    );
    const trace = results[1];
    expect(trace.totalRefs).toBe(1);
    expect(trace.maxDepth).toBe(0);
  });

  it('深度制限が効く', () => {
    const { results } = reiMulti(
      'let mut a = 𝕄{1; 2}',
      'let mut b = 𝕄{3; 4}',
      'let mut c = 𝕄{5; 6}',
      'a |> bind("b")',
      'b |> bind("c")',
      'a |> trace(1)',
    );
    const trace = results[5];
    expect(trace.maxDepth).toBeLessThanOrEqual(1);
  });

  it('日本語: 追跡', () => {
    const { results } = reiMulti(
      'let mut x = 𝕄{5; 1, 2}',
      'let mut y = 𝕄{10; 3, 4}',
      'x |> 結合("y")',
      'x |> 追跡',
    );
    expect(results[3].reiType).toBe('TraceResult');
    expect(results[3].totalRefs).toBeGreaterThanOrEqual(2);
  });
});

// ═══════════════════════════════════════════
// Part 2: influence（影響）
// ═══════════════════════════════════════════

describe('influence / 影響 — 影響度計算', () => {
  beforeEach(() => rei.reset());

  it('直接結合の影響度は高い', () => {
    const { results } = reiMulti(
      'let mut a = 𝕄{5; 1, 2, 3}',
      'let mut b = 𝕄{10; 4, 5, 6}',
      'a |> bind("b", "mirror", 0.8)',
      'a |> influence("b")',
    );
    const inf = results[3];
    expect(inf.reiType).toBe('InfluenceResult');
    expect(inf.score).toBe(0.8);
    expect(inf.hops).toBe(1);
    expect(inf.directlyBound).toBe(true);
    expect(inf.path).toEqual(['a', 'b']);
  });

  it('間接結合は影響度が減衰する', () => {
    const { results } = reiMulti(
      'let mut a = 𝕄{1; 2}',
      'let mut b = 𝕄{3; 4}',
      'let mut c = 𝕄{5; 6}',
      'a |> bind("b", "mirror", 0.8)',
      'b |> bind("c", "mirror", 0.5)',
      'a |> influence("c")',
    );
    const inf = results[5];
    expect(inf.score).toBeCloseTo(0.4);
    expect(inf.hops).toBe(2);
    expect(inf.directlyBound).toBe(false);
    expect(inf.path).toEqual(['a', 'b', 'c']);
  });

  it('結合のない値は影響度0', () => {
    const { results } = reiMulti(
      'let mut a = 𝕄{5; 1, 2}',
      'let mut b = 𝕄{10; 3, 4}',
      'a |> influence("b")',
    );
    expect(results[2].score).toBe(0);
    expect(results[2].hops).toBe(-1);
  });

  it('自己への影響度は1', () => {
    const { results } = reiMulti(
      'let mut a = 𝕄{5; 1, 2}',
      'a |> influence("a")',
    );
    expect(results[1].score).toBe(1);
    expect(results[1].hops).toBe(0);
  });

  it('日本語: 影響', () => {
    const { results } = reiMulti(
      'let mut a = 𝕄{5; 1, 2}',
      'let mut b = 𝕄{10; 3, 4}',
      'a |> 結合("b")',
      'a |> 影響("b")',
    );
    expect(results[3].reiType).toBe('InfluenceResult');
    expect(results[3].score).toBeGreaterThan(0);
  });
});

// ═══════════════════════════════════════════
// Part 3: entangle（縁起）
// ═══════════════════════════════════════════

describe('entangle / 縁起 — 深い結合', () => {
  beforeEach(() => rei.reset());

  it('縁起的結合を作成できる', () => {
    const { results } = reiMulti(
      'let mut a = 𝕄{5; 1, 2, 3}',
      'let mut b = 𝕄{10; 4, 5, 6}',
      'a |> entangle("b")',
    );
    const ent = results[2];
    expect(ent.reiType).toBe('EntanglementResult');
    expect(ent.refs).toEqual(['a', 'b']);
    expect(ent.bidirectional).toBe(true);
    expect(ent.depth).toBe('quantum');
    expect(ent.strength).toBe(1.0);
  });

  it('共鳴度でdepthが変わる', () => {
    const { results } = reiMulti(
      'let mut a = 𝕄{5; 1, 2}',
      'let mut b = 𝕄{10; 3, 4}',
      'let mut c = 𝕄{15; 5, 6}',
      'a |> entangle("b", 0.9)',
      'a |> entangle("c", 0.3)',
    );
    expect(results[3].depth).toBe('quantum');
    expect(results[4].depth).toBe('surface');
  });

  it('縁起後にtraceで追跡できる', () => {
    const { results } = reiMulti(
      'let mut a = 𝕄{5; 1, 2}',
      'let mut b = 𝕄{10; 3, 4}',
      'a |> entangle("b")',
      'a |> trace',
    );
    expect(results[3].totalRefs).toBeGreaterThanOrEqual(2);
  });

  it('日本語: 縁起', () => {
    const { results } = reiMulti(
      'let mut x = 𝕄{5; 1, 2}',
      'let mut y = 𝕄{10; 3, 4}',
      'x |> 縁起("y")',
    );
    expect(results[2].reiType).toBe('EntanglementResult');
    expect(results[2].bidirectional).toBe(true);
  });
});

// ═══════════════════════════════════════════
// Part 4: will_evolve（意志進化）
// ═══════════════════════════════════════════

describe('will_evolve / 意志進化 — 自律的意志', () => {
  beforeEach(() => rei.reset());

  it('基本的な意志進化', () => {
    const { results } = reiMulti(
      'let mut a = 𝕄{5; 1, 2, 3}',
      'a |> will_evolve',
    );
    const evo = results[1];
    expect(evo.reiType).toBe('WillEvolution');
    expect(evo.previous).toBeDefined();
    expect(evo.evolved).toBeDefined();
    expect(evo.reason).toBeDefined();
    expect(evo.autonomous).toBe(true);
  });

  it('パイプチェーン後の意志進化', () => {
    const { results } = reiMulti(
      'let mut a = 𝕄{5; 1, 2, 3} |> normalize |> normalize |> normalize',
      'a |> will_evolve',
    );
    const evo = results[1];
    expect(evo.evolved.strength).toBeGreaterThan(0);
    expect(evo.evolved.tendency).toBeDefined();
  });

  it('ゼロ値の内在傾向は genesis', () => {
    const { results } = reiMulti(
      'let mut a = 0',
      'a |> will_evolve',
    );
    expect(results[1].evolved.intrinsic).toBe('genesis');
  });

  it('素数の内在傾向は irreducible', () => {
    const { results } = reiMulti(
      'let mut a = 7',
      'a |> will_evolve',
    );
    expect(results[1].evolved.intrinsic).toBe('irreducible');
  });

  it('日本語: 意志進化', () => {
    const { results } = reiMulti(
      'let mut a = 𝕄{5; 1, 2, 3}',
      'a |> 意志進化',
    );
    expect(results[1].reiType).toBe('WillEvolution');
    expect(results[1].autonomous).toBe(true);
  });
});

// ═══════════════════════════════════════════
// Part 5: will_align（意志調律）
// ═══════════════════════════════════════════

describe('will_align / 意志調律 — 意志の調和', () => {
  beforeEach(() => rei.reset());

  it('同じ傾向の値は調和する', () => {
    const { results } = reiMulti(
      'let mut a = 5',
      'let mut b = 10',
      'a |> will_align("b")',
    );
    const align = results[2];
    expect(align.reiType).toBe('WillAlignment');
    expect(align.harmony).toBeGreaterThanOrEqual(0);
    expect(align.harmony).toBeLessThanOrEqual(1);
  });

  it('結合後の意志調律', () => {
    const { results } = reiMulti(
      'let mut a = 𝕄{5; 1, 2, 3}',
      'let mut b = 𝕄{10; 4, 5, 6}',
      'a |> bind("b")',
      'a |> will_align("b")',
    );
    const align = results[3];
    expect(align.refs).toEqual(['a', 'b']);
    expect(align.after).toBeDefined();
    expect(align.method).toBeDefined();
  });

  it('日本語: 意志調律', () => {
    const { results } = reiMulti(
      'let mut a = 𝕄{5; 1, 2}',
      'let mut b = 𝕄{10; 3, 4}',
      'a |> 意志調律("b")',
    );
    expect(results[2].reiType).toBe('WillAlignment');
  });
});

// ═══════════════════════════════════════════
// Part 6: will_conflict（意志衝突）
// ═══════════════════════════════════════════

describe('will_conflict / 意志衝突 — 対立検出', () => {
  beforeEach(() => rei.reset());

  it('同じ傾向は衝突なし', () => {
    const { results } = reiMulti(
      'let mut a = 5',
      'let mut b = 10',
      'a |> will_conflict("b")',
    );
    const conflict = results[2];
    expect(conflict.reiType).toBe('WillConflict');
    expect(conflict.tension).toBeLessThanOrEqual(0.5);
  });

  it('衝突結果に解消提案がある', () => {
    const { results } = reiMulti(
      'let mut a = 𝕄{5; 1, 2, 3}',
      'let mut b = 𝕄{10; 4, 5, 6}',
      'a |> will_conflict("b")',
    );
    const conflict = results[2];
    expect(conflict.resolution).toBeDefined();
    expect(typeof conflict.resolution).toBe('string');
  });

  it('tension は 0-1 の範囲', () => {
    const { results } = reiMulti(
      'let mut a = 𝕄{0.001; 2, 3}',
      'let mut b = 𝕄{9999; 4, 5}',
      'a |> will_conflict("b")',
    );
    expect(results[2].tension).toBeGreaterThanOrEqual(0);
    expect(results[2].tension).toBeLessThanOrEqual(1);
  });

  it('日本語: 意志衝突', () => {
    const { results } = reiMulti(
      'let mut a = 𝕄{5; 1, 2}',
      'let mut b = 𝕄{10; 3, 4}',
      'a |> 意志衝突("b")',
    );
    expect(results[2].reiType).toBe('WillConflict');
  });
});

// ═══════════════════════════════════════════
// Part 7: 統合テスト
// ═══════════════════════════════════════════

describe('統合: relation×will 深化パイプライン', () => {
  beforeEach(() => rei.reset());

  it('縁起→追跡→影響の連携', () => {
    const { results } = reiMulti(
      'let mut a = 𝕄{5; 1, 2, 3}',
      'let mut b = 𝕄{10; 4, 5, 6}',
      'let mut c = 𝕄{15; 7, 8, 9}',
      'a |> entangle("b")',
      'b |> bind("c")',
      'a |> trace',
      'a |> influence("c")',
    );
    expect(results[3].reiType).toBe('EntanglementResult');
    const trace = results[5];
    expect(trace.totalRefs).toBeGreaterThanOrEqual(3);
    const inf = results[6];
    expect(inf.score).toBeGreaterThan(0);
    expect(inf.path.length).toBeGreaterThanOrEqual(2);
  });

  it('意志進化→意志調律→σの連携', () => {
    const { results } = reiMulti(
      'let mut a = 𝕄{7; 1, 2, 3} |> normalize |> normalize',
      'let mut b = 𝕄{6; 4, 5, 6}',
      'a |> will_evolve',
      'a |> will_align("b")',
      'a |> sigma',
    );
    expect(results[2].reiType).toBe('WillEvolution');
    expect(results[3].reiType).toBe('WillAlignment');
    const sigma = results[4];
    expect(sigma.will).toBeDefined();
  });

  it('衝突検出→縁起→調律の解消パイプライン', () => {
    const { results } = reiMulti(
      'let mut a = 𝕄{0.001; 2, 3}',
      'let mut b = 𝕄{999; 4, 5}',
      'a |> will_conflict("b")',
      'a |> entangle("b")',
      'a |> will_align("b")',
    );
    expect(results[2].reiType).toBe('WillConflict');
    expect(results[3].reiType).toBe('EntanglementResult');
    expect(results[4].reiType).toBe('WillAlignment');
    expect(results[4].after).toBeDefined();
  });

  it('全日本語パイプライン', () => {
    const { results } = reiMulti(
      'let mut x = 𝕄{5; 1, 2, 3}',
      'let mut y = 𝕄{10; 4, 5, 6}',
      'x |> 縁起("y")',
      'x |> 追跡',
      'x |> 影響("y")',
      'x |> 意志進化',
      'x |> 意志調律("y")',
      'x |> 意志衝突("y")',
    );
    expect(results[2].reiType).toBe('EntanglementResult');
    expect(results[3].reiType).toBe('TraceResult');
    expect(results[4].reiType).toBe('InfluenceResult');
    expect(results[5].reiType).toBe('WillEvolution');
    expect(results[6].reiType).toBe('WillAlignment');
    expect(results[7].reiType).toBe('WillConflict');
  });

  it('σに深化されたrelation/willが反映される', () => {
    const { results } = reiMulti(
      'let mut a = 𝕄{5; 1, 2, 3} |> intend("seek", 10)',
      'let mut b = 𝕄{10; 4, 5, 6}',
      'a |> entangle("b")',
      'a |> will_evolve',
      'a |> sigma',
    );
    const sigma = results[4];
    expect(sigma.reiType).toBe('SigmaResult');
    expect(sigma.field).toBeDefined();
    expect(sigma.flow).toBeDefined();
    expect(sigma.memory).toBeDefined();
    expect(sigma.layer).toBeDefined();
    expect(sigma.relation).toBeDefined();
    expect(sigma.will).toBeDefined();
  });
});
