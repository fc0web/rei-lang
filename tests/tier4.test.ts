// ============================================================
// Rei v0.3 Tier 4 テストスイート — C3(応答) & C4(覚醒) & U2(変換保存) & M2(モード等価)
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
// 公理C3 — 応答（respond）: 値が外部刺激に反応
// ============================================================

describe("Tier 4: 公理C3 — respond（応答）", () => {

  describe("absorb（吸収）モード", () => {
    it("𝕄がstimulus を吸収してcenterが変化", () => {
      const r = run('𝕄{5; 1, 2, 3} |> respond(10)');
      expect(r.reiType).toBe("MDim");
      expect(r.center).not.toBe(5); // 刺激により変化
    });

    it("刺激0なら変化なし", () => {
      const r = run('𝕄{5; 1, 2, 3} |> respond(0)');
      expect(r.center).toBe(5);
    });

    it("数値への刺激は加算", () => {
      const r = run('10 |> respond(5)');
      expect(unwrap(r)).toBe(15);
    });
  });

  describe("distribute（分配）モード", () => {
    it("刺激を近傍に均等分配", () => {
      const r = run('𝕄{5; 1, 2, 3} |> respond(9, "distribute")');
      expect(r.reiType).toBe("MDim");
      expect(r.center).toBe(5); // centerは不変
      // 9/3 = 3ずつ加算
      expect(r.neighbors).toEqual([4, 5, 6]);
    });
  });

  describe("reflect（反射）モード", () => {
    it("刺激を反射して近傍が逆方向に変化", () => {
      const r = run('𝕄{5; 1, 2, 3} |> respond(9, "reflect")');
      expect(r.reiType).toBe("MDim");
      expect(r.center).toBe(5);
      // 反射: 各近傍 - 9/3 = -3ずつ
      expect(r.neighbors).toEqual([-2, -1, 0]);
    });
  });

  describe("resonate（共鳴）モード", () => {
    it("刺激と共鳴して全体が変調", () => {
      const r = run('𝕄{5; 1, 2, 3} |> respond(1, "resonate")');
      expect(r.reiType).toBe("MDim");
      // sin(1) ≈ 0.841 → center = 5 * (1 + 0.841) ≈ 9.207
      expect(r.center).not.toBe(5);
      expect(typeof r.center).toBe("number");
    });
  });

  describe("応答チェーン", () => {
    it("複数回応答で値が累積変化", () => {
      const r1 = run('𝕄{5; 1, 2, 3} |> respond(10) |> compute');
      const r0 = run('𝕄{5; 1, 2, 3} |> compute');
      expect(unwrap(r1)).not.toBe(unwrap(r0));
    });

    it("応答後にσで追跡可能", () => {
      const r = run('𝕄{5; 1, 2, 3} |> respond(10) |> sigma');
      expect(r.reiType).toBe("SigmaResult");
      expect(r.memory.raw.length).toBeGreaterThanOrEqual(1);
    });
  });
});

// ============================================================
// 公理C3 — sensitivity（応答感度）
// ============================================================

describe("Tier 4: 公理C3 — sensitivity（感度）", () => {

  it("𝕄の感度を数値で返す", () => {
    const r = run('𝕄{5; 1, 2, 3} |> sensitivity');
    expect(typeof unwrap(r)).toBe("number");
    expect(unwrap(r)).toBeGreaterThan(0);
  });

  it("数値の感度は1.0", () => {
    const r = run('42 |> sensitivity');
    expect(unwrap(r)).toBe(1.0);
  });

  it("異なる構造は異なる感度", () => {
    const s1 = run('𝕄{5; 1, 2, 3} |> sensitivity');
    const s2 = run('𝕄{100; 1, 2, 3} |> sensitivity');
    // center が異なる → 感度が異なる
    expect(unwrap(s1)).not.toBe(unwrap(s2));
  });
});

// ============================================================
// 公理C4 — awareness（覚醒度）& awakened?（覚醒判定）
// ============================================================

describe("Tier 4: 公理C4 — awareness & awakened?（覚醒）", () => {

  it("初期状態のawarenessは低い", () => {
    const r = run('42 |> awareness');
    expect(unwrap(r)).toBeLessThan(0.5);
  });

  it("パイプ通過で覚醒度が上昇", () => {
    const r1 = run('42 |> awareness');
    const r2 = run('42 |> abs |> negate |> abs |> negate |> awareness');
    expect(unwrap(r2)).toBeGreaterThan(unwrap(r1));
  });

  it("初期状態はawakened がfalse", () => {
    const r = run('42 |> awakened');
    expect(unwrap(r)).toBe(false);
  });

  it("十分なパイプ通過後にawakened がtrue", () => {
    // 多段パイプで覚醒度を上げる
    const r = run('𝕄{5; 1, 2, 3, 4, 5, 6, 7, 8} |> abs |> negate |> abs |> negate |> abs |> awakened');
    expect(unwrap(r)).toBe(true);
  });

  it("覚醒度は0〜1の範囲", () => {
    const r = run('𝕄{5; 1, 2, 3} |> abs |> abs |> awareness');
    const v = unwrap(r);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });

  it("構造が複雑なほど覚醒度が高い", () => {
    // normalize は 𝕄 構造を保つので構造の複雑さが維持される
    const simple = run('𝕄{5; 1} |> normalize |> awareness');
    const complex = run('𝕄{5; 1, 2, 3, 4, 5, 6, 7, 8} |> normalize |> awareness');
    expect(unwrap(complex)).toBeGreaterThan(unwrap(simple));
  });
});

// ============================================================
// 公理U2 — transform（変換保存）
// ============================================================

describe("Tier 4: 公理U2 — transform（変換パターン統一）", () => {

  describe("scale（スケール変換）", () => {
    it("全要素を2倍", () => {
      const r = run('𝕄{5; 1, 2, 3} |> transform("scale", 2)');
      expect(r.center).toBe(10);
      expect(r.neighbors).toEqual([2, 4, 6]);
    });

    it("数値もスケール可能", () => {
      const r = run('7 |> transform("scale", 3)');
      expect(unwrap(r)).toBe(21);
    });
  });

  describe("shift（シフト変換）", () => {
    it("全要素に10加算", () => {
      const r = run('𝕄{5; 1, 2, 3} |> transform("shift", 10)');
      expect(r.center).toBe(15);
      expect(r.neighbors).toEqual([11, 12, 13]);
    });
  });

  describe("rotate（回転変換）", () => {
    it("近傍を1位置回転", () => {
      const r = run('𝕄{5; 1, 2, 3, 4} |> transform("rotate", 1)');
      expect(r.center).toBe(5);
      expect(r.neighbors).toEqual([2, 3, 4, 1]);
    });

    it("2位置回転", () => {
      const r = run('𝕄{5; 1, 2, 3, 4} |> transform("rotate", 2)');
      expect(r.center).toBe(5);
      expect(r.neighbors).toEqual([3, 4, 1, 2]);
    });
  });

  describe("invert（反転変換）", () => {
    it("center基準で近傍を反転", () => {
      const r = run('𝕄{5; 1, 2, 3} |> transform("invert", 0)');
      // 2*5 - 1 = 9, 2*5 - 2 = 8, 2*5 - 3 = 7
      expect(r.center).toBe(5);
      expect(r.neighbors).toEqual([9, 8, 7]);
    });
  });

  describe("normalize_to（正規化変換）", () => {
    it("合計が100になるよう正規化", () => {
      const r = run('𝕄{5; 1, 2, 3} |> transform("normalize_to", 100)');
      const total = Math.abs(r.center) + r.neighbors.reduce((s: number, v: number) => s + Math.abs(v), 0);
      expect(total).toBeCloseTo(100, 5);
    });
  });

  describe("U2 変換同型: 同じ変換が異なる入力に適用可能", () => {
    it("scaleは𝕄にも数値にも適用可能", () => {
      const rMDim = run('𝕄{5; 1, 2, 3} |> transform("scale", 2) |> compute');
      const rNum = run('5 |> transform("scale", 2)');
      expect(typeof unwrap(rMDim)).toBe("number");
      expect(typeof unwrap(rNum)).toBe("number");
    });

    it("変換後にσで追跡可能", () => {
      const r = run('𝕄{5; 1, 2, 3} |> transform("scale", 2) |> sigma');
      expect(r.reiType).toBe("SigmaResult");
    });
  });
});

// ============================================================
// 公理M2 — mode_equiv（モード等価）
// ============================================================

describe("Tier 4: 公理M2 — mode_equiv（モード等価）", () => {

  it("2モードの等価性判定を返す", () => {
    const r = run('𝕄{5; 1, 2, 3} |> mode_equiv("weighted", "geometric")');
    expect(r.reiType).toBe("ModeEquivResult");
    expect(r.mode1).toBe("weighted");
    expect(r.mode2).toBe("geometric");
  });

  it("型は常に等価（M2公理: 出力型が等価）", () => {
    const r = run('𝕄{5; 1, 2, 3, 4} |> mode_equiv("weighted", "entropy")');
    expect(r.type_equivalent).toBe(true); // 両方number
  });

  it("同じモード同士はrelative_diff=0", () => {
    const r = run('𝕄{5; 1, 2, 3} |> mode_equiv("weighted", "weighted")');
    expect(r.relative_diff).toBe(0);
  });

  it("relative_diffで数値的な乖離を確認", () => {
    const r = run('𝕄{5; 1, 2, 3, 4} |> mode_equiv("weighted", "entropy")');
    expect(typeof r.relative_diff).toBe("number");
    expect(r.relative_diff).toBeGreaterThan(0);
  });
});

// ============================================================
// 後方互換性テスト（Tier 1〜3が壊れていないこと）
// ============================================================

describe("後方互換性テスト（Tier 4）", () => {

  it("Tier 1: 基本σ", () => {
    const r = run('42 |> sigma');
    expect(r.reiType).toBe("SigmaResult");
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

  it("Tier 3: perspectives", () => {
    const r = run('[1, 5] |> perspectives');
    expect(r.length).toBe(2);
  });

  it("v0.3: Space構文", () => {
    const r = run('let s = space { layer 0: 𝕄{5; 1, 2, 3} }; s |> sigma');
    expect(r.field).toBeDefined();
  });

  it("v0.2.1: 既存compute", () => {
    const r = run('𝕄{5; 1, 2, 3, 4} |> compute');
    expect(unwrap(r)).toBe(7.5);
  });
});
