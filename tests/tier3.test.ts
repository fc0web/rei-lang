// ============================================================
// Rei v0.3 Tier 3 テストスイート — 公理U1(構造還元) & A1(解の多元性)
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
// 公理U1 — 構造還元: project_all（全射影の生成）
// ============================================================

describe("Tier 3: 公理U1 — project_all（全射影）", () => {

  it("3要素配列 → 3通りの射影", () => {
    const r = run('[1, 5, 3] |> project_all');
    expect(Array.isArray(r)).toBe(true);
    expect(r.length).toBe(3);
    // 各射影のcenterが異なる
    const centers = r.map((m: any) => m.center);
    expect(centers.sort()).toEqual([1, 3, 5]);
  });

  it("各射影は完全な𝕄構造", () => {
    const r = run('[10, 20, 30] |> project_all');
    for (const proj of r) {
      expect(proj.reiType).toBe("MDim");
      expect(proj.neighbors.length).toBe(2);
      // center + neighbors = 元の全要素
      const all = [proj.center, ...proj.neighbors].sort();
      expect(all).toEqual([10, 20, 30]);
    }
  });

  it("4要素配列 → 4通りの射影", () => {
    const r = run('[1, 2, 3, 4] |> project_all');
    expect(r.length).toBe(4);
  });

  it("1要素配列 → 1通りの射影（近傍なし）", () => {
    const r = run('[42] |> project_all');
    expect(r.length).toBe(1);
    expect(r[0].center).toBe(42);
    expect(r[0].neighbors).toEqual([]);
  });

  it("𝕄の全射影（中心の再選択）", () => {
    const r = run('𝕄{5; 1, 2, 3} |> project_all');
    expect(r.length).toBe(4); // 5, 1, 2, 3 の4要素
    const centers = r.map((m: any) => m.center).sort();
    expect(centers).toEqual([1, 2, 3, 5]);
  });

  it("文字列の全射影", () => {
    const r = run('"ab" |> project_all');
    expect(r.length).toBe(2); // 'a'=97, 'b'=98
  });

  it("数値の全射影（桁分解）", () => {
    const r = run('123 |> project_all');
    expect(r.length).toBe(3); // 1, 2, 3
  });

  it("U1.3 射影の情報保存性: 各射影から元の要素を復元可能", () => {
    const r = run('[7, 3, 9] |> project_all');
    for (const proj of r) {
      const restored = [proj.center, ...proj.neighbors].sort();
      expect(restored).toEqual([3, 7, 9]);
    }
  });
});

// ============================================================
// 公理U1 — ネスト𝕄のフラット化
// ============================================================

describe("Tier 3: 公理U1 — ネスト𝕄のフラット化", () => {

  it("ネスト𝕄を再帰的に計算", () => {
    // 𝕄{𝕄{10; 1, 2}; 3, 4} → center=computeMDim(𝕄{10;1,2})=11.5, neighbors=[3,4]
    // → 11.5 + (3+4)/2 = 15
    const r = run('𝕄{𝕄{10; 1, 2}; 3, 4} |> flatten_nested');
    expect(typeof unwrap(r)).toBe("number");
  });

  it("フラットな𝕄はそのまま計算", () => {
    const flat = run('𝕄{5; 1, 2, 3} |> flatten_nested');
    const normal = run('𝕄{5; 1, 2, 3} |> compute');
    expect(unwrap(flat)).toBe(unwrap(normal));
  });
});

// ============================================================
// 公理A1 — 解の多元性: compute_all
// ============================================================

describe("Tier 3: 公理A1 — compute_all（全モード計算）", () => {

  it("全8モードの計算結果を返す", () => {
    const r = run('𝕄{5; 1, 2, 3, 4} |> compute_all');
    expect(Array.isArray(r)).toBe(true);
    expect(r.length).toBe(8);
  });

  it("各結果にmodeとvalueが含まれる", () => {
    const r = run('𝕄{5; 1, 2, 3, 4} |> compute_all');
    for (const entry of r) {
      expect(entry).toHaveProperty('mode');
      expect(entry).toHaveProperty('value');
      expect(typeof entry.value).toBe('number');
    }
  });

  it("結果にweightedモードが含まれる", () => {
    const r = run('𝕄{5; 1, 2, 3, 4} |> compute_all');
    const weighted = r.find((e: any) => e.mode === 'weighted');
    expect(weighted).toBeDefined();
    expect(weighted.value).toBe(7.5);
  });

  it("結果にgeometricモードが含まれる", () => {
    const r = run('𝕄{5; 2, 8} |> compute_all');
    const geo = r.find((e: any) => e.mode === 'geometric');
    expect(geo).toBeDefined();
    expect(typeof geo.value).toBe('number');
  });

  it("A1: 異なるモードは異なる結果を返す（非自明な入力）", () => {
    const r = run('𝕄{5; 1, 2, 3, 4} |> compute_all');
    const values = r.map((e: any) => e.value);
    const uniqueValues = new Set(values);
    // 8モード中、少なくとも3つは異なるはず
    expect(uniqueValues.size).toBeGreaterThanOrEqual(3);
  });

  it("配列を直接compute_allできる", () => {
    const r = run('[1, 5, 3] |> compute_all');
    expect(Array.isArray(r)).toBe(true);
    expect(r.length).toBe(8);
  });
});

// ============================================================
// 公理A1 — compare（モード比較）
// ============================================================

describe("Tier 3: 公理A1 — compare（モード比較）", () => {

  it("2モードの比較結果を返す", () => {
    const r = run('𝕄{5; 1, 2, 3, 4} |> compare("weighted", "geometric")');
    expect(r.reiType).toBe('CompareResult');
    expect(r.mode1.mode).toBe('weighted');
    expect(r.mode2.mode).toBe('geometric');
    expect(typeof r.diff).toBe('number');
    expect(typeof r.ratio).toBe('number');
  });

  it("同じモード比較 → diff=0", () => {
    const r = run('𝕄{5; 1, 2, 3} |> compare("weighted", "weighted")');
    expect(r.diff).toBe(0);
    expect(r.ratio).toBe(1);
  });

  it("異なるモード → diff>0（非自明入力）", () => {
    const r = run('𝕄{5; 1, 2, 3, 4} |> compare("weighted", "entropy")');
    expect(r.diff).toBeGreaterThan(0);
  });

  it("デフォルトはweighted vs geometric", () => {
    const r = run('𝕄{5; 1, 2, 3} |> compare');
    expect(r.mode1.mode).toBe('weighted');
    expect(r.mode2.mode).toBe('geometric');
  });
});

// ============================================================
// Tier 3: perspectives（全射影 × 全モード）
// ============================================================

describe("Tier 3: U1+A1 — perspectives（全射影×全モード）", () => {

  it("3要素 → 3射影 × 8モード = 24結果", () => {
    const r = run('[1, 5, 3] |> perspectives');
    expect(Array.isArray(r)).toBe(true);
    expect(r.length).toBe(3); // 3射影
    for (const proj of r) {
      expect(proj.results.length).toBe(8); // 各8モード
    }
  });

  it("各perspectiveにcenterとresultsが含まれる", () => {
    const r = run('[10, 20] |> perspectives');
    for (const proj of r) {
      expect(proj).toHaveProperty('center');
      expect(proj).toHaveProperty('neighbors');
      expect(proj).toHaveProperty('results');
      expect(proj).toHaveProperty('projectionIndex');
    }
  });

  it("異なる中心は異なるweighted結果を生む", () => {
    const r = run('[1, 10, 100] |> perspectives');
    const weightedResults = r.map((p: any) =>
      p.results.find((res: any) => res.mode === 'weighted').value
    );
    // 中心が1, 10, 100 → 結果は異なる
    const unique = new Set(weightedResults);
    expect(unique.size).toBe(3);
  });

  it("𝕄のperspectives", () => {
    const r = run('𝕄{5; 1, 2, 3} |> perspectives');
    expect(r.length).toBe(4); // 4要素 → 4射影
  });
});

// ============================================================
// σとの統合テスト
// ============================================================

describe("Tier 3: σとの統合", () => {

  it("project_all結果の各𝕄にσが適用可能", () => {
    // project_allの結果は配列なので、個別要素にσ
    const r = run('let ps = [1, 5, 3] |> project_all; ps[0] |> sigma');
    expect(unwrap(r).reiType).toBe("SigmaResult");
  });

  it("compute_all後にσで来歴追跡", () => {
    const r = run('𝕄{5; 1, 2, 3} |> compute_all |> sigma');
    expect(r.reiType).toBe("SigmaResult");
  });

  it("compare後にσ", () => {
    const r = run('𝕄{5; 1, 2, 3} |> compare("weighted", "median") |> sigma');
    expect(r.reiType).toBe("SigmaResult");
  });
});

// ============================================================
// 後方互換性テスト（Tier 1 + Tier 2 が壊れていないこと）
// ============================================================

describe("後方互換性テスト（Tier 3）", () => {

  it("Tier 1: 基本σ", () => {
    const r = run('42 |> sigma');
    expect(r.reiType).toBe("SigmaResult");
    expect(r.field.center).toBe(42);
  });

  it("Tier 1: パイプ来歴追跡", () => {
    const r = run('10 |> abs |> sigma');
    expect(r.memory.length).toBeGreaterThanOrEqual(1);
  });

  it("Tier 2: project", () => {
    const r = run('[1, 5, 3] |> project("max")');
    expect(r.center).toBe(5);
  });

  it("Tier 2: compute :geometric", () => {
    const r = run('𝕄{2; 4, 8} |> compute :geometric');
    expect(typeof unwrap(r)).toBe("number");
  });

  it("Tier 2: blend", () => {
    const r = run('𝕄{5; 1, 2, 3, 4} |> blend("weighted", 0.5, "geometric", 0.5)');
    expect(typeof unwrap(r)).toBe("number");
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
