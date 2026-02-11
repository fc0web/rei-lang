// ============================================================
// Rei v0.3 Tier 2 テストスイート — 公理N1(射影) & M1(計算多元性)
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
// 公理N1 — 射影（project）: 任意のデータを𝕄に射影
// ============================================================

describe("Tier 2: 公理N1 — 射影（project）", () => {

  describe("配列 → 𝕄 射影", () => {
    it("配列の最大値を中心に射影", () => {
      const r = run('[1, 5, 3, 2] |> project("max")');
      expect(r.reiType).toBe("MDim");
      expect(r.center).toBe(5);
      expect(r.neighbors).toEqual([1, 3, 2]);
    });

    it("配列の最小値を中心に射影", () => {
      const r = run('[10, 5, 3, 2] |> project("min")');
      expect(r.reiType).toBe("MDim");
      expect(r.center).toBe(2);
      expect(r.neighbors).toEqual([10, 5, 3]);
    });

    it("配列の先頭を中心に射影（デフォルト）", () => {
      const r = run('[7, 3, 1] |> project("first")');
      expect(r.reiType).toBe("MDim");
      expect(r.center).toBe(7);
      expect(r.neighbors).toEqual([3, 1]);
    });

    it("配列の末尾を中心に射影", () => {
      const r = run('[7, 3, 9] |> project("last")');
      expect(r.reiType).toBe("MDim");
      expect(r.center).toBe(9);
      expect(r.neighbors).toEqual([7, 3]);
    });

    it("配列の中央を中心に射影", () => {
      const r = run('[1, 5, 9] |> project("middle")');
      expect(r.reiType).toBe("MDim");
      expect(r.center).toBe(5);
      expect(r.neighbors).toEqual([1, 9]);
    });

    it("具体値で中心を指定", () => {
      const r = run('[1, 5, 3] |> project(3)');
      expect(r.reiType).toBe("MDim");
      expect(r.center).toBe(3);
      expect(r.neighbors).toEqual([1, 5]);
    });
  });

  describe("文字列 → 𝕄 射影", () => {
    it("文字列を文字コード配列として射影", () => {
      const r = run('"abc" |> project("max")');
      expect(r.reiType).toBe("MDim");
      // 'a'=97, 'b'=98, 'c'=99 → center=99, neighbors=[97,98]
      expect(r.center).toBe(99);
      expect(r.neighbors).toEqual([97, 98]);
    });
  });

  describe("数値 → 𝕄 射影", () => {
    it("数値を桁配列として射影", () => {
      const r = run('123 |> project("max")');
      expect(r.reiType).toBe("MDim");
      // 1,2,3 → center=3, neighbors=[1,2]
      expect(r.center).toBe(3);
      expect(r.neighbors).toEqual([1, 2]);
    });
  });

  describe("射影 → 計算チェーン", () => {
    it("射影後にcomputeできる", () => {
      const r = run('[1, 5, 3, 2] |> project("max") |> compute');
      expect(typeof unwrap(r)).toBe("number");
    });

    it("射影後にσが動作する", () => {
      const r = run('[1, 5, 3] |> project("max") |> sigma');
      expect(r.reiType).toBe("SigmaResult");
      expect(r.field.center).toBe(5);
      expect(r.field.dim).toBe(2);
    });
  });
});

// ============================================================
// 公理N2 — 複数射影（reproject）: 𝕄の中心を変更
// ============================================================

describe("Tier 2: 公理N2 — 複数射影（reproject）", () => {

  it("MDimの中心を変更", () => {
    const r = run('𝕄{5; 1, 2, 3} |> reproject(1)');
    expect(r.reiType).toBe("MDim");
    expect(r.center).toBe(1);
    expect(r.neighbors.sort()).toEqual([2, 3, 5]);
  });

  it("別の値で再射影", () => {
    const r = run('𝕄{10; 20, 30} |> reproject(30)');
    expect(r.reiType).toBe("MDim");
    expect(r.center).toBe(30);
    expect(r.neighbors.sort()).toEqual([10, 20]);
  });

  it("再射影後にcompute", () => {
    const r1 = run('𝕄{5; 1, 2, 3} |> compute');
    const r2 = run('𝕄{5; 1, 2, 3} |> reproject(1) |> compute');
    // 異なる中心で計算 → 異なる結果
    expect(unwrap(r1)).not.toBe(unwrap(r2));
  });

  it("配列のreprojectはprojectにフォールバック", () => {
    const r = run('[1, 5, 3] |> reproject("max")');
    expect(r.reiType).toBe("MDim");
    expect(r.center).toBe(5);
  });
});

// ============================================================
// 公理M1 — 計算多元性: 新計算モード
// ============================================================

describe("Tier 2: 公理M1 — 計算多元性（新モード）", () => {

  describe("geometric（幾何平均）モード", () => {
    it("幾何平均で計算", () => {
      const r = run('𝕄{2; 4, 8} |> compute :geometric');
      expect(typeof unwrap(r)).toBe("number");
      // center × (|4| × |8|)^(1/2) = 2 × sqrt(32) ≈ 11.31
      expect(unwrap(r)).toBeCloseTo(2 * Math.sqrt(32), 5);
    });
  });

  describe("median（中央値）モード", () => {
    it("奇数個の近傍", () => {
      const r = run('𝕄{10; 1, 5, 3} |> compute :median');
      // center + median(1,3,5) = 10 + 3 = 13
      expect(unwrap(r)).toBe(13);
    });

    it("偶数個の近傍", () => {
      const r = run('𝕄{10; 1, 2, 3, 4} |> compute :median');
      // center + median(1,2,3,4) = 10 + 2.5 = 12.5
      expect(unwrap(r)).toBe(12.5);
    });
  });

  describe("minkowski（ミンコフスキー距離）モード", () => {
    it("ミンコフスキー距離で計算", () => {
      const r = run('𝕄{0; 3, 4} |> compute :minkowski');
      // center + sqrt((9+16)/2) = 0 + sqrt(12.5) ≈ 3.536
      expect(typeof unwrap(r)).toBe("number");
      expect(unwrap(r)).toBeCloseTo(Math.sqrt(12.5), 5);
    });
  });

  describe("entropy（情報エントロピー）モード", () => {
    it("エントロピーで計算", () => {
      const r = run('𝕄{1; 2, 2, 2} |> compute :entropy');
      // 均等分布 → H = log2(3) ≈ 1.585
      // center × (1 + H) = 1 × (1 + 1.585) ≈ 2.585
      expect(typeof unwrap(r)).toBe("number");
      expect(unwrap(r)).toBeGreaterThan(1);
    });

    it("偏った分布はエントロピーが低い", () => {
      const r1 = run('𝕄{1; 2, 2, 2} |> compute :entropy');
      const r2 = run('𝕄{1; 10, 1, 1} |> compute :entropy');
      // 均等な方がエントロピーが高い
      expect(unwrap(r1)).toBeGreaterThan(unwrap(r2));
    });
  });

  describe("既存モードの後方互換", () => {
    it("weighted（既存）", () => {
      const r = run('𝕄{5; 1, 2, 3, 4} |> compute :weighted');
      expect(unwrap(r)).toBe(5 + (1 + 2 + 3 + 4) / 4);
    });

    it("harmonic（既存）", () => {
      const r = run('𝕄{5; 1, 2, 3, 4} |> compute :harmonic');
      expect(typeof unwrap(r)).toBe("number");
    });

    it("デフォルトモード（weighted）", () => {
      const r = run('𝕄{5; 1, 2, 3, 4} |> compute');
      expect(unwrap(r)).toBe(5 + (1 + 2 + 3 + 4) / 4);
    });
  });
});

// ============================================================
// Tier 2: modes パイプコマンド
// ============================================================

describe("Tier 2: modes パイプコマンド", () => {
  it("利用可能なモード一覧を返す", () => {
    const r = run('𝕄{5; 1, 2, 3} |> modes');
    expect(Array.isArray(unwrap(r))).toBe(true);
    const modes = unwrap(r);
    expect(modes).toContain("weighted");
    expect(modes).toContain("geometric");
    expect(modes).toContain("median");
    expect(modes).toContain("entropy");
    expect(modes.length).toBe(8);
  });
});

// ============================================================
// Tier 2 M3: blend（モード合成）
// ============================================================

describe("Tier 2: M3 — blend（モード合成）", () => {
  it("2つのモードを合成", () => {
    const r = run('𝕄{5; 1, 2, 3, 4} |> blend("weighted", 0.5, "geometric", 0.5)');
    const w = run('𝕄{5; 1, 2, 3, 4} |> compute :weighted');
    const g = run('𝕄{5; 1, 2, 3, 4} |> compute :geometric');
    // ブレンド結果は2つのモードの中間
    const expected = (unwrap(w) * 0.5 + unwrap(g) * 0.5);
    expect(unwrap(r)).toBeCloseTo(expected, 5);
  });

  it("重み付き合成", () => {
    const r = run('𝕄{5; 1, 2, 3, 4} |> blend("weighted", 0.8, "median", 0.2)');
    expect(typeof unwrap(r)).toBe("number");
  });
});

// ============================================================
// Tier 2: σとの統合テスト
// ============================================================

describe("Tier 2: σとの統合", () => {

  it("project → sigma で射影元を追跡", () => {
    const r = run('[1, 5, 3] |> project("max") |> sigma');
    expect(r.reiType).toBe("SigmaResult");
    expect(r.field.center).toBe(5);
    expect(r.memory.length).toBeGreaterThanOrEqual(1);
  });

  it("reproject → sigma で再射影を追跡", () => {
    const r = run('𝕄{5; 1, 2, 3} |> reproject(2) |> sigma');
    expect(r.reiType).toBe("SigmaResult");
    expect(r.field.center).toBe(2);
  });

  it("新モードcompute → sigma で計算来歴を追跡", () => {
    const r = run('𝕄{5; 1, 2, 3} |> compute :geometric |> sigma');
    expect(r.reiType).toBe("SigmaResult");
    expect(r.memory.length).toBeGreaterThanOrEqual(1);
  });
});

// ============================================================
// 後方互換性テスト（Tier 1 + v0.3 が壊れていないこと）
// ============================================================

describe("後方互換性テスト（Tier 2）", () => {

  it("既存のMDim compute は変わらない", () => {
    const r = run('𝕄{5; 1, 2, 3, 4} |> compute');
    expect(unwrap(r)).toBe(7.5);
  });

  it("既存のMDim normalize は変わらない", () => {
    const r = run('𝕄{5; 2, 3} |> normalize');
    expect(r.reiType).toBe("MDim");
  });

  it("既存のSpace構文は変わらない", () => {
    const r = run('let s = space { layer 0: 𝕄{5; 1, 2, 3} }; s |> sigma');
    expect(r.field).toBeDefined();
  });

  it("Tier 1 σは正常動作", () => {
    const r = run('42 |> sigma');
    expect(r.reiType).toBe("SigmaResult");
    expect(r.field.center).toBe(42);
  });

  it("パイプ通過後の演算は正常", () => {
    const r = run('let x = [1, 5, 3] |> project("max") |> compute; x + 10');
    expect(typeof unwrap(r)).toBe("number");
  });
});
