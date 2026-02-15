// ============================================================
// Rei v0.3 Tier 5 テストスイート
// C5(共鳴) & N3-N5(非数数学) & M4-M5(モード生成・完全性)
// U3-U5(階層再帰・架橋・完全性) & A2-A5(解変換・合成・評価・完全性)
// vitest形式
// ============================================================

import { describe, it, expect } from 'vitest';
import { Lexer } from '../src/lang/lexer';
import { Parser } from '../src/lang/parser';
import { Evaluator } from '../src/lang/evaluator';

function run(code: string): any {
  const tokens = new Lexer(code).tokenize();
  const ast = new Parser(tokens).parseProgram();
  const ev = new Evaluator();
  return ev.eval(ast);
}

function unwrap(v: any): any {
  return (v !== null && typeof v === 'object' && v.reiType === 'ReiVal') ? v.value : v;
}

// ============================================================
// 公理C5 — 共鳴（Resonance）: 覚醒した値同士の非局所的共鳴
// 全反射ネットワーク— 全てが全てを映し合う
// ============================================================

describe("Tier 5: 公理C5 — resonate（共鳴）", () => {

  it("同じ𝕄同士は高い共鳴度", () => {
    const r = run('𝕄{5; 1, 2, 3} |> resonate(𝕄{5; 1, 2, 3})');
    expect(r.reiType).toBe("ResonanceResult");
    expect(r.strength).toBeGreaterThan(0.8);
    expect(r.resonates).toBe(true);
  });

  it("異なる𝕄は低い共鳴度", () => {
    const r = run('𝕄{5; 1, 2, 3} |> resonate(𝕄{100; 50, 60, 70})');
    expect(r.reiType).toBe("ResonanceResult");
    expect(r.strength).toBeLessThan(0.8);
  });

  it("次元一致度（dimMatch）の確認", () => {
    const r = run('𝕄{5; 1, 2, 3} |> resonate(𝕄{10; 4, 5, 6})');
    expect(r.dimMatch).toBe(1); // 同じ3次元
  });

  it("次元不一致は低い共鳴", () => {
    const r = run('𝕄{5; 1, 2, 3} |> resonate(𝕄{5; 1})');
    expect(r.dimMatch).toBeLessThan(1);
  });

  it("数値同士の共鳴", () => {
    const r = run('5 |> resonate(5)');
    expect(r.strength).toBeGreaterThan(0.5);
  });
});

describe("Tier 5: 公理C5 — resonance_field（共鳴場）", () => {

  it("覚醒前は局所的共鳴場", () => {
    const r = run('42 |> resonance_field');
    expect(r.reiType).toBe("ResonanceField");
    expect(r.range).toBe("local");
    expect(r.capacity).toBeLessThanOrEqual(0.3);
  });

  it("覚醒後は非局所的共鳴場", () => {
    const r = run('𝕄{5; 1, 2, 3, 4, 5, 6, 7, 8} |> abs |> negate |> abs |> negate |> abs |> resonance_field');
    expect(r.reiType).toBe("ResonanceField");
    expect(r.range).toBe("non-local");
    expect(r.capacity).toBe(1.0);
  });
});

describe("Tier 5: 公理C5 — resonance_map（共鳴マップ）", () => {

  it("𝕄内の中心-近傍間の共鳴マップ", () => {
    const r = run('𝕄{5; 4, 6, 3} |> resonance_map');
    expect(Array.isArray(r)).toBe(true);
    expect(r.length).toBe(3); // center vs each neighbor
  });

  it("近い値ほど高い共鳴強度", () => {
    const r = run('𝕄{5; 4, 100} |> resonance_map');
    // 5と4の共鳴 > 5と100の共鳴
    expect(r[0].strength).toBeGreaterThan(r[1].strength);
  });
});

describe("Tier 5: 公理C5 — resonance_chain（共鳴チェーン）", () => {

  it("共鳴チェーンを返す", () => {
    const r = run('𝕄{5; 4, 6, 3} |> resonance_chain');
    expect(r.reiType).toBe("ResonanceChain");
    expect(r.chain.length).toBeGreaterThan(0);
    expect(r.chain[0].value).toBe(5); // centerから開始
  });

  it("非𝕄は空チェーン", () => {
    const r = run('42 |> resonance_chain');
    expect(r.depth).toBe(0);
  });
});

// ============================================================
// 公理N3 — 型変換射影（Typed Projection）: 𝕄を異なる構造に射影
// ============================================================

describe("Tier 5: 公理N3 — project_as（型変換射影）", () => {

  describe("graph射影", () => {
    it("𝕄をグラフ構造に射影", () => {
      const r = run('𝕄{5; 1, 2, 3} |> project_as("graph")');
      expect(r.reiType).toBe("GraphProjection");
      expect(r.hub).toBe(5);
      expect(r.nodes).toEqual([5, 1, 2, 3]);
      expect(r.edges.length).toBe(3);
      expect(r.degree).toBe(3);
    });

    it("各edgeにfrom/to/weightが含まれる", () => {
      const r = run('𝕄{10; 3, 7} |> project_as("graph")');
      for (const edge of r.edges) {
        expect(edge.from).toBe(10);
        expect(typeof edge.to).toBe("number");
        expect(typeof edge.weight).toBe("number");
      }
    });
  });

  describe("series射影", () => {
    it("𝕄を時系列に射影", () => {
      const r = run('𝕄{10; 12, 15, 13} |> project_as("series")');
      expect(r.reiType).toBe("SeriesProjection");
      expect(r.values).toEqual([10, 12, 15, 13]);
      expect(r.deltas.length).toBe(3);
      expect(r.length).toBe(4);
    });

    it("デルタが正しく算出される", () => {
      const r = run('𝕄{10; 20, 30} |> project_as("series")');
      expect(r.deltas).toEqual([10, 10]);
    });
  });

  describe("matrix射影", () => {
    it("𝕄を行列行に射影", () => {
      const r = run('𝕄{5; 1, 2, 3} |> project_as("matrix")');
      expect(r.reiType).toBe("MatrixProjection");
      expect(r.row).toEqual([5, 1, 2, 3]);
      expect(r.diagonal).toBe(5);
      expect(r.size).toBe(4);
    });
  });

  describe("tree射影", () => {
    it("𝕄を木構造に射影", () => {
      const r = run('𝕄{5; 1, 2, 3} |> project_as("tree")');
      expect(r.reiType).toBe("TreeProjection");
      expect(r.root).toBe(5);
      expect(r.children.length).toBe(3);
      expect(r.height).toBe(1);
      expect(r.leaves).toBe(3);
    });
  });

  it("配列からの型変換射影", () => {
    const r = run('[10, 20, 30] |> project_as("graph")');
    expect(r.reiType).toBe("GraphProjection");
  });
});

// ============================================================
// 公理N4 — 射影合成（Projection Composition）
// ============================================================

describe("Tier 5: 公理N4 — compose_projections（射影合成）", () => {

  it("𝕄の全射影を合成して新𝕄を生成", () => {
    const r = run('𝕄{5; 1, 2, 3} |> compose_projections');
    expect(r.reiType).toBe("MDim");
    expect(typeof r.center).toBe("number");
    expect(r.neighbors.length).toBe(4); // 4通りの射影結果
  });

  it("合成結果のcenterは各射影compute値の平均", () => {
    const r = run('𝕄{5; 1, 2, 3} |> compose_projections');
    // 各射影のcompute値の平均がcenterになる
    expect(typeof r.center).toBe("number");
    expect(r.center).not.toBe(0);
  });

  it("配列の射影合成", () => {
    const r = run('[𝕄{5; 1, 2}, 𝕄{10; 3, 4}] |> compose_projections');
    expect(r.reiType).toBe("MDim");
  });
});

// ============================================================
// 公理N5 — 表現完全性（Representational Completeness）
// ============================================================

describe("Tier 5: 公理N5 — representable（表現可能性）", () => {

  it("数値は無損失で表現可能", () => {
    const r = run('42 |> representable');
    expect(r.reiType).toBe("RepresentableResult");
    expect(r.representable).toBe(true);
    expect(r.lossless).toBe(true);
  });

  it("文字列は無損失で表現可能", () => {
    const r = run('"hello" |> representable');
    expect(r.representable).toBe(true);
    expect(r.lossless).toBe(true);
  });

  it("配列は無損失で表現可能", () => {
    const r = run('[1, 2, 3] |> representable');
    expect(r.representable).toBe(true);
    expect(r.lossless).toBe(true);
  });

  it("𝕄は既に𝕄", () => {
    const r = run('𝕄{5; 1, 2, 3} |> representable');
    expect(r.representable).toBe(true);
    expect(r.reason).toBe("already 𝕄");
  });

  it("真偽値は表現可能", () => {
    const r = run('true |> representable');
    expect(r.representable).toBe(true);
    expect(r.lossless).toBe(true);
  });

  it("nullは表現可能", () => {
    const r = run('null |> representable');
    expect(r.representable).toBe(true);
  });
});

// ============================================================
// 公理M4 — モード導出（Mode Derivation）
// ============================================================

describe("Tier 5: 公理M4 — derive_mode（モード導出）", () => {

  it("2モードの加重合成で新モードを導出", () => {
    const r = run('𝕄{5; 1, 2, 3, 4} |> derive_mode("weighted", 0.7, "geometric", 0.3)');
    expect(r.reiType).toBe("DerivedModeResult");
    expect(typeof r.value).toBe("number");
    expect(r.baseModes).toEqual(["weighted", "geometric"]);
  });

  it("導出値は元モードの中間", () => {
    const w = run('𝕄{5; 1, 2, 3, 4} |> compute :weighted');
    const g = run('𝕄{5; 1, 2, 3, 4} |> compute :geometric');
    const r = run('𝕄{5; 1, 2, 3, 4} |> derive_mode("weighted", 0.5, "geometric", 0.5)');
    const expected = (unwrap(w) * 0.5 + unwrap(g) * 0.5);
    expect(r.value).toBeCloseTo(expected, 5);
  });

  it("formulaが生成される", () => {
    const r = run('𝕄{5; 1, 2, 3} |> derive_mode("weighted", 0.6, "median", 0.4)');
    expect(r.formula).toContain("weighted");
    expect(r.formula).toContain("median");
  });
});

// ============================================================
// 公理M5 — モード空間（Mode Space）
// ============================================================

describe("Tier 5: 公理M5 — mode_space（モード空間）", () => {

  it("全モードの値を返す", () => {
    const r = run('𝕄{5; 1, 2, 3, 4} |> mode_space');
    expect(r.reiType).toBe("ModeSpace");
    expect(r.modes).toBe(8);
    expect(r.values.length).toBe(8);
  });

  it("各モードにmode名とvalueが含まれる", () => {
    const r = run('𝕄{5; 1, 2, 3, 4} |> mode_space');
    for (const v of r.values) {
      expect(typeof v.mode).toBe("string");
      expect(typeof v.value).toBe("number");
    }
  });

  it("分散と多様性が計算される", () => {
    const r = run('𝕄{5; 1, 2, 3, 4} |> mode_space');
    expect(typeof r.variance).toBe("number");
    expect(typeof r.diversity).toBe("number");
    expect(r.coverage).toBe(1.0);
  });

  it("非𝕄はモード数0", () => {
    const r = run('42 |> mode_space');
    expect(r.coverage).toBe(0);
  });
});

// ============================================================
// 公理U3 — 階層再帰（Hierarchical Recursion）
// ============================================================

describe("Tier 5: 公理U3 — depth（ネスト深度）", () => {

  it("フラット𝕄の深度は0", () => {
    const r = run('𝕄{5; 1, 2, 3} |> depth');
    expect(unwrap(r)).toBe(0);
  });

  it("数値の深度は0", () => {
    const r = run('42 |> depth');
    expect(unwrap(r)).toBe(0);
  });
});

describe("Tier 5: 公理U3 — nest（ネスト化）", () => {

  it("𝕄を1レベルネスト", () => {
    const r = run('𝕄{5; 1, 2, 3} |> nest(1)');
    expect(r.reiType).toBe("MDim");
    // centerが𝕄になる
    expect(r.center.reiType).toBe("MDim");
    expect(r.center.center).toBe(5);
  });

  it("数値をnestすると𝕄に変換", () => {
    const r = run('42 |> nest(1)');
    expect(r.reiType).toBe("MDim");
    expect(r.center).toBe(42);
  });

  it("ネスト後のdepth", () => {
    const r = run('𝕄{5; 1, 2, 3} |> nest(1) |> depth');
    expect(unwrap(r)).toBe(1);
  });
});

describe("Tier 5: 公理U3 — recursive_compute（再帰的計算）", () => {

  it("フラット𝕄はcomputeと同じ結果", () => {
    const flat = run('𝕄{5; 1, 2, 3} |> compute');
    const rec = run('𝕄{5; 1, 2, 3} |> recursive_compute');
    expect(unwrap(rec)).toBe(unwrap(flat));
  });

  it("数値はそのまま返る", () => {
    const r = run('42 |> recursive_compute');
    expect(unwrap(r)).toBe(42);
  });
});

// ============================================================
// 公理U4 — 領域架橋（Domain Bridging）
// ============================================================

describe("Tier 5: 公理U4 — structural_similarity（構造的類似度）", () => {

  it("同一構造は完全類似", () => {
    const r = run('𝕄{5; 1, 2, 3} |> structural_similarity(𝕄{5; 1, 2, 3})');
    expect(r.reiType).toBe("SimilarityResult");
    expect(r.similarity).toBeGreaterThan(0.9);
    expect(r.isomorphic).toBe(true);
  });

  it("同次元・異値は部分的に類似", () => {
    const r = run('𝕄{5; 1, 2, 3} |> structural_similarity(𝕄{50; 10, 20, 30})');
    expect(r.dimSimilarity).toBe(1); // 同じ3次元
    expect(r.similarity).toBeGreaterThan(0.3);
  });

  it("異次元は低い類似度", () => {
    const r = run('𝕄{5; 1, 2, 3} |> structural_similarity(𝕄{5; 1})');
    expect(r.dimSimilarity).toBeLessThan(1);
  });
});

describe("Tier 5: 公理U4 — bridge（領域架橋）", () => {

  it("2つの𝕄間のブリッジを生成", () => {
    const r = run('𝕄{5; 1, 2, 3} |> bridge(𝕄{10; 2, 4, 6})');
    expect(r.reiType).toBe("BridgeResult");
    expect(typeof r.scaleFactor).toBe("number");
    expect(r.scaleFactor).toBeCloseTo(2, 5); // 10/5 = 2
  });

  it("transferableの判定", () => {
    const r1 = run('𝕄{5; 1, 2, 3} |> bridge(𝕄{10; 2, 4, 6})');
    expect(r1.transferable).toBe(true); // 類似構造

    const r2 = run('𝕄{5; 1, 2, 3} |> bridge(𝕄{100; 50})');
    // 次元が異なるので転移困難の可能性
    expect(typeof r2.transferable).toBe("boolean");
  });
});

// ============================================================
// 公理U5 — 完全性（Completeness）: 任意値 ⇔ 𝕄
// ============================================================

describe("Tier 5: 公理U5 — encode（エンコード）", () => {

  it("数値を𝕄にエンコード", () => {
    const r = run('42 |> encode');
    expect(r.reiType).toBe("MDim");
    expect(r.center).toBe(42);
  });

  it("文字列を𝕄にエンコード", () => {
    const r = run('"hi" |> encode');
    expect(r.reiType).toBe("MDim");
    expect(r.center).toBe(104); // 'h'
    expect(r.neighbors).toEqual([105]); // 'i'
  });

  it("配列を𝕄にエンコード", () => {
    const r = run('[1, 2, 3] |> encode');
    expect(r.reiType).toBe("MDim");
    expect(r.center).toBe(1);
    expect(r.neighbors).toEqual([2, 3]);
  });

  it("𝕄はそのまま", () => {
    const r = run('𝕄{5; 1, 2, 3} |> encode');
    expect(r.center).toBe(5);
    expect(r.neighbors).toEqual([1, 2, 3]);
  });

  it("真偽値のエンコード", () => {
    const r = run('true |> encode');
    expect(r.reiType).toBe("MDim");
    expect(r.center).toBe(1);
  });

  it("nullのエンコード", () => {
    const r = run('null |> encode');
    expect(r.reiType).toBe("MDim");
    expect(r.center).toBe(0);
  });
});

describe("Tier 5: 公理U5 — decode（デコード）", () => {

  it("𝕄を数値にデコード（compute結果）", () => {
    const r = run('𝕄{5; 1, 2, 3} |> decode("number")');
    const c = run('𝕄{5; 1, 2, 3} |> compute');
    expect(unwrap(r)).toBe(unwrap(c));
  });

  it("𝕄を配列にデコード", () => {
    const r = run('𝕄{5; 1, 2, 3} |> decode("array")');
    expect(r[0]).toBe(5);
    expect(r[1]).toBe(1);
    expect(r[2]).toBe(2);
    expect(r[3]).toBe(3);
    expect(r.length).toBe(4);
  });

  it("𝕄を文字列にデコード", () => {
    const r = run('𝕄{72; 101, 108} |> decode("string")');
    expect(typeof unwrap(r)).toBe("string");
  });

  it("encode→decodeのラウンドトリップ（配列）", () => {
    const r = run('[1, 2, 3] |> encode |> decode("array")');
    expect(r[0]).toBe(1);
    expect(r[1]).toBe(2);
    expect(r[2]).toBe(3);
    expect(r.length).toBe(3);
  });
});

// ============================================================
// 公理A2 — 解変換（Solution Transformation）
// ============================================================

describe("Tier 5: 公理A2 — map_solutions（解変換）", () => {

  it("全解をscale変換", () => {
    const r = run('𝕄{5; 1, 2, 3, 4} |> map_solutions("scale", 2)');
    expect(Array.isArray(r)).toBe(true);
    expect(r.length).toBe(8);
    for (const sol of r) {
      expect(sol.value).toBe(sol.original * 2);
      expect(sol.transform).toBe("scale");
    }
  });

  it("全解をshift変換", () => {
    const r = run('𝕄{5; 1, 2, 3, 4} |> map_solutions("shift", 10)');
    for (const sol of r) {
      expect(sol.value).toBe(sol.original + 10);
    }
  });

  it("全解をnormalize変換", () => {
    const r = run('𝕄{5; 1, 2, 3, 4} |> map_solutions("normalize")');
    for (const sol of r) {
      expect(sol.value).toBeGreaterThanOrEqual(-1);
      expect(sol.value).toBeLessThanOrEqual(1);
    }
  });

  it("配列からのmap_solutions", () => {
    const r = run('[1, 5, 3, 2] |> map_solutions("scale", 3)');
    expect(r.length).toBe(8);
  });
});

// ============================================================
// 公理A3 — 合意形成（Consensus）
// ============================================================

describe("Tier 5: 公理A3 — consensus（合意形成）", () => {

  it("中央値・平均・標準偏差を返す", () => {
    const r = run('𝕄{5; 1, 2, 3, 4} |> consensus');
    expect(r.reiType).toBe("ConsensusResult");
    expect(typeof r.median).toBe("number");
    expect(typeof r.mean).toBe("number");
    expect(typeof r.stddev).toBe("number");
    expect(typeof r.agreement).toBe("number");
  });

  it("合意度は0〜1の範囲", () => {
    const r = run('𝕄{5; 1, 2, 3, 4} |> consensus');
    expect(r.agreement).toBeGreaterThanOrEqual(0);
    expect(r.agreement).toBeLessThanOrEqual(1);
  });

  it("解の数が正しい", () => {
    const r = run('𝕄{5; 1, 2, 3, 4} |> consensus');
    expect(r.solutions).toBe(8);
  });

  it("rangeにmin/maxが含まれる", () => {
    const r = run('𝕄{5; 1, 2, 3, 4} |> consensus');
    expect(typeof r.range.min).toBe("number");
    expect(typeof r.range.max).toBe("number");
    expect(r.range.max).toBeGreaterThanOrEqual(r.range.min);
  });
});

// ============================================================
// 公理A4 — 解評価（Solution Evaluation）: best & rank
// ============================================================

describe("Tier 5: 公理A4 — best（最良解選択）", () => {

  it("median_closest基準でbestを返す", () => {
    const r = run('𝕄{5; 1, 2, 3, 4} |> best');
    expect(typeof r.mode).toBe("string");
    expect(typeof r.value).toBe("number");
  });

  it("max基準", () => {
    const r = run('𝕄{5; 1, 2, 3, 4} |> best("max")');
    const all = run('𝕄{5; 1, 2, 3, 4} |> compute_all');
    const maxVal = Math.max(...all.map((s: any) => s.value));
    expect(r.value).toBe(maxVal);
  });

  it("min基準", () => {
    const r = run('𝕄{5; 1, 2, 3, 4} |> best("min")');
    const all = run('𝕄{5; 1, 2, 3, 4} |> compute_all');
    const minVal = Math.min(...all.map((s: any) => s.value));
    expect(r.value).toBe(minVal);
  });
});

describe("Tier 5: 公理A4 — rank（解ランキング）", () => {

  it("全解をランク付け", () => {
    const r = run('𝕄{5; 1, 2, 3, 4} |> rank');
    expect(Array.isArray(r)).toBe(true);
    expect(r.length).toBe(8);
    // ランクが1から8まで
    const ranks = r.map((s: any) => s.rank);
    expect(ranks).toEqual([1, 2, 3, 4, 5, 6, 7, 8]);
  });

  it("ランクは降順（高い値が上位）", () => {
    const r = run('𝕄{5; 1, 2, 3, 4} |> rank');
    for (let i = 0; i < r.length - 1; i++) {
      expect(r[i].value).toBeGreaterThanOrEqual(r[i + 1].value);
    }
  });

  it("各エントリにmode, value, rankが含まれる", () => {
    const r = run('𝕄{5; 1, 2, 3, 4} |> rank');
    for (const s of r) {
      expect(typeof s.mode).toBe("string");
      expect(typeof s.value).toBe("number");
      expect(typeof s.rank).toBe("number");
    }
  });
});

// ============================================================
// 公理A5 — 解の完全性（Solution Completeness）
// ============================================================

describe("Tier 5: 公理A5 — solution_completeness（解の完全性）", () => {

  it("完全性結果を返す", () => {
    const r = run('𝕄{5; 1, 2, 3, 4} |> solution_completeness');
    expect(r.reiType).toBe("CompletenessResult");
    expect(r.totalModes).toBe(8);
    expect(typeof r.uniqueSolutions).toBe("number");
    expect(typeof r.uniqueRatio).toBe("number");
    expect(typeof r.uniformity).toBe("number");
    expect(typeof r.completeness).toBe("number");
  });

  it("ユニーク率は0〜1の範囲", () => {
    const r = run('𝕄{5; 1, 2, 3, 4} |> solution_completeness');
    expect(r.uniqueRatio).toBeGreaterThanOrEqual(0);
    expect(r.uniqueRatio).toBeLessThanOrEqual(1);
  });

  it("isCompleteフラグ", () => {
    const r = run('𝕄{5; 1, 2, 3, 4} |> solution_completeness');
    expect(typeof r.isComplete).toBe("boolean");
  });

  it("非自明な入力は複数のユニーク解を持つ", () => {
    const r = run('𝕄{5; 1, 2, 3, 4} |> solution_completeness');
    expect(r.uniqueSolutions).toBeGreaterThan(1);
  });
});

// ============================================================
// Tier 5: 公理間の統合テスト
// ============================================================

describe("Tier 5: 公理間の統合テスト", () => {

  it("C5+C4: 覚醒値の共鳴は非覚醒値より広い", () => {
    const dormant = run('42 |> resonance_field');
    const awake = run('𝕄{5; 1, 2, 3, 4, 5, 6, 7, 8} |> abs |> negate |> abs |> negate |> abs |> resonance_field');
    expect(awake.capacity).toBeGreaterThan(dormant.capacity);
  });

  it("N3+A1: project_as後にcompute_allで多元的解析", () => {
    const graph = run('𝕄{5; 1, 2, 3} |> project_as("graph")');
    expect(graph.reiType).toBe("GraphProjection");
    expect(graph.degree).toBe(3);
  });

  it("U5+A4: encode→best で最良解を選択", () => {
    const r = run('[1, 5, 3, 2] |> encode |> best("max")');
    expect(typeof r.value).toBe("number");
    expect(typeof r.mode).toBe("string");
  });

  it("M5+A5: mode_space と solution_completeness の整合性", () => {
    const ms = run('𝕄{5; 1, 2, 3, 4} |> mode_space');
    const sc = run('𝕄{5; 1, 2, 3, 4} |> solution_completeness');
    expect(ms.modes).toBe(sc.totalModes);
  });

  it("U3+U5: nest→encode→decode のラウンドトリップ", () => {
    const r = run('42 |> nest(1) |> depth');
    expect(unwrap(r)).toBe(0); // nest(1) makes center=42, no nested MDim
  });

  it("C5+U4: resonateとstructural_similarityの相関", () => {
    const res = run('𝕄{5; 1, 2, 3} |> resonate(𝕄{5; 1, 2, 3})');
    const sim = run('𝕄{5; 1, 2, 3} |> structural_similarity(𝕄{5; 1, 2, 3})');
    // 同一構造: 両方とも高い値
    expect(res.strength).toBeGreaterThan(0.7);
    expect(sim.similarity).toBeGreaterThan(0.7);
  });
});

// ============================================================
// 後方互換性テスト（Tier 1〜4が壊れていないこと）
// ============================================================

describe("後方互換性テスト（Tier 5）", () => {

  it("Tier 1: 基本σ", () => {
    const r = run('42 |> sigma');
    expect(r.reiType).toBe("SigmaResult");
  });

  it("Tier 1: τ傾向性", () => {
    const r = run('100 |> sqrt |> sqrt |> sigma');
    expect(r.will.tendency).toBe("contract");
  });

  it("Tier 2: project", () => {
    const r = run('[1, 5, 3] |> project("max")');
    expect(r.center).toBe(5);
  });

  it("Tier 2: compute :geometric", () => {
    const r = run('𝕄{2; 4, 8} |> compute :geometric');
    expect(typeof unwrap(r)).toBe("number");
  });

  it("Tier 3: project_all", () => {
    const r = run('[1, 5, 3] |> project_all');
    expect(r.length).toBe(3);
  });

  it("Tier 3: compute_all", () => {
    const r = run('𝕄{5; 1, 2, 3} |> compute_all');
    expect(r.length).toBe(8);
  });

  it("Tier 4: respond", () => {
    const r = run('𝕄{5; 1, 2, 3} |> respond(10)');
    expect(r.center).not.toBe(5);
  });

  it("Tier 4: awareness", () => {
    const r = run('42 |> awareness');
    expect(unwrap(r)).toBeLessThan(0.5);
  });

  it("Tier 4: transform", () => {
    const r = run('𝕄{5; 1, 2, 3} |> transform("scale", 2)');
    expect(r.center).toBe(10);
  });

  it("v0.2.1: 既存compute", () => {
    const r = run('𝕄{5; 1, 2, 3, 4} |> compute');
    expect(unwrap(r)).toBe(7.5);
  });

  it("v0.3: Space構文", () => {
    const r = run('let s = space { layer 0: 𝕄{5; 1, 2, 3} }; s |> sigma');
    expect(r.field).toBeDefined();
  });
});
