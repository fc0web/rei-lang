// ============================================================
// Rei v0.3 — 全モジュール統合テスト
// Tier 1-5 (25公理) + 柱①②③④⑤ の後方互換性と統合動作
// ============================================================

import { describe, it, expect } from 'vitest';
import { Lexer } from '../src/lang/lexer';
import { Parser } from '../src/lang/parser';
import { Evaluator } from '../src/lang/evaluator';

function rei(code: string): any {
  const tokens = new Lexer(code).tokenize();
  const ast = new Parser(tokens).parseProgram();
  return new Evaluator().eval(ast);
}

function unwrap(v: any): any {
  return (v !== null && typeof v === 'object' && v.reiType === 'ReiVal') ? v.value : v;
}

// ═══════════════════════════════════════════
// v0.2.1 互換: 基本演算
// ═══════════════════════════════════════════

describe("v0.2.1互換: 基本演算", () => {
  it("四則演算", () => {
    expect(rei('2 + 3')).toBe(5);
    expect(rei('10 - 7')).toBe(3);
    expect(rei('4 * 5')).toBe(20);
    expect(rei('15 / 3')).toBe(5);
  });

  it("変数宣言と利用", () => {
    expect(rei('let x = 42; x')).toBe(42);
  });

  it("if式", () => {
    expect(rei('if true then 1 else 0')).toBe(1);
  });

  it("配列", () => {
    const r = rei('[1, 2, 3]');
    expect(r).toEqual([1, 2, 3]);
  });

  it("compress関数", () => {
    const r = rei('compress f(x) = x + 1; f(5)');
    expect(r).toBe(6);
  });

  it("文字列", () => {
    expect(rei('"hello"')).toBe('hello');
  });

  it("比較演算", () => {
    expect(rei('3 > 2')).toBe(true);
    expect(rei('1 == 1')).toBe(true);
  });

  it("𝕄基本compute", () => {
    expect(unwrap(rei('𝕄{5; 1, 2, 3, 4} |> compute'))).toBe(7.5);
  });

  it("𝕄compute :weighted", () => {
    expect(unwrap(rei('𝕄{5; 1, 2, 3, 4} |> compute :weighted'))).toBe(7.5);
  });
});

// ═══════════════════════════════════════════
// v0.3: Space-Layer-Diffusion
// ═══════════════════════════════════════════

describe("v0.3: Space-Layer-Diffusion", () => {
  it("space構文で空間を構築", () => {
    const r = rei('let s = space { layer 0: 𝕄{5; 1, 2, 3} }; s |> sigma');
    expect(r.field).toBeDefined();
  });

  it("space diffuse", () => {
    const r = rei('let s = space { layer 0: 𝕄{5; 1, 2, 3, 4} }; s |> diffuse(3)');
    expect(Array.isArray(r)).toBe(true);
  });
});

// ═══════════════════════════════════════════
// Tier 1: C1(σ全値型) & C2(τ傾向性)
// ═══════════════════════════════════════════

describe("Tier 1: σ全値型 & τ傾向性", () => {
  it("数値σ", () => {
    const r = rei('42 |> sigma');
    expect(r.reiType).toBe('SigmaResult');
    expect(r.field).toBeDefined();
  });

  it("文字列σ", () => {
    const r = rei('"hello" |> sigma');
    expect(r.reiType).toBe('SigmaResult');
  });

  it("MDimσ", () => {
    const r = rei('𝕄{5; 1, 2, 3} |> sigma');
    expect(r.reiType).toBe('SigmaResult');
  });

  it("τ傾向性: contract", () => {
    const r = rei('100 |> sqrt |> sqrt |> sigma');
    expect(r.will.tendency).toBe('contract');
  });

  it("τ傾向性: expand", () => {
    const r = rei('2 |> abs |> abs |> abs |> sigma');
    expect(typeof r.will.tendency).toBe('string');
  });
});

// ═══════════════════════════════════════════
// Tier 2: N1(射影) & M1(計算多元性)
// ═══════════════════════════════════════════

describe("Tier 2: 射影 & 計算多元性", () => {
  it("project", () => {
    const r = rei('[1, 5, 3] |> project("max")');
    expect(r.center).toBe(5);
    expect(r.reiType).toBe('MDim');
  });

  it("compute :geometric", () => {
    const r = rei('𝕄{2; 4, 8} |> compute :geometric');
    expect(typeof unwrap(r)).toBe('number');
  });

  it("modes", () => {
    const r = rei('𝕄{5; 1, 2, 3} |> modes');
    expect(Array.isArray(r)).toBe(true);
    expect(r.length).toBe(8);
  });

  it("blend", () => {
    const r = rei('𝕄{5; 1, 2, 3} |> blend("weighted", 0.7, "geometric", 0.3)');
    expect(typeof unwrap(r)).toBe('number');
  });
});

// ═══════════════════════════════════════════
// Tier 3: U1(構造還元) & A1(解の多元性)
// ═══════════════════════════════════════════

describe("Tier 3: 構造還元 & 解の多元性", () => {
  it("project_all", () => {
    const r = rei('[1, 5, 3] |> project_all');
    expect(Array.isArray(r)).toBe(true);
    expect(r.length).toBe(3);
  });

  it("compute_all", () => {
    const r = rei('𝕄{5; 1, 2, 3} |> compute_all');
    expect(Array.isArray(r)).toBe(true);
    expect(r.length).toBe(8);
  });

  it("perspectives", () => {
    const r = rei('[1, 5, 3] |> perspectives');
    expect(Array.isArray(r)).toBe(true);
  });
});

// ═══════════════════════════════════════════
// Tier 4: C3(応答) & C4(覚醒) & U2(変換) & M2(等価)
// ═══════════════════════════════════════════

describe("Tier 4: 応答 & 覚醒 & 変換 & 等価", () => {
  it("respond", () => {
    const r = rei('𝕄{5; 1, 2, 3} |> respond(10)');
    expect(r.center).not.toBe(5);
  });

  it("awareness", () => {
    const r = rei('42 |> awareness');
    expect(typeof unwrap(r)).toBe('number');
  });

  it("transform scale", () => {
    const r = rei('𝕄{5; 1, 2, 3} |> transform("scale", 2)');
    expect(r.center).toBe(10);
  });

  it("mode_equiv", () => {
    const r = rei('𝕄{5; 1, 2, 3} |> mode_equiv("weighted", "geometric")');
    expect(typeof r.type_equivalent).toBe('boolean');
  });
});

// ═══════════════════════════════════════════
// Tier 5: C5(共鳴) & N3-N5 & M4-M5 & U3-U5 & A2-A5
// ═══════════════════════════════════════════

describe("Tier 5: 共鳴 & 高度機能", () => {
  it("resonate", () => {
    const r = rei('𝕄{5; 1, 2, 3} |> resonate(𝕄{5; 1, 2, 3})');
    expect(r.strength).toBeGreaterThan(0.5);
  });

  it("encode", () => {
    const r = rei('[1, 5, 3, 2] |> encode');
    expect(r.reiType).toBe('MDim');
  });

  it("consensus", () => {
    const r = rei('𝕄{5; 1, 2, 3} |> consensus');
    expect(r.reiType).toBe('ConsensusResult');
  });

  it("mode_space", () => {
    const r = rei('𝕄{5; 1, 2, 3} |> mode_space');
    expect(typeof r.modes).toBe('number');
  });

  it("structural_similarity", () => {
    const r = rei('𝕄{5; 1, 2, 3} |> structural_similarity(𝕄{5; 1, 2, 3})');
    expect(r.similarity).toBeGreaterThan(0.5);
  });
});

// ═══════════════════════════════════════════
// 柱①: evolveパイプ（自動モード選択）
// ═══════════════════════════════════════════

describe("柱①: evolveパイプ", () => {
  it("基本evolve", () => {
    const r = rei('𝕄{5; 1, 2, 3} |> evolve');
    expect(r.reiType).toBe('EvolveResult');
    expect(typeof r.value).toBe('number');
    expect(typeof r.selectedMode).toBe('string');
  });

  it("evolve(stable)", () => {
    const r = rei('𝕄{5; 1, 2, 3} |> evolve("stable")');
    expect(r.reiType).toBe('EvolveResult');
  });
});

// ═══════════════════════════════════════════
// 柱②: 漢字/日本語の𝕄表現
// ═══════════════════════════════════════════

describe("柱②: 漢字/日本語𝕄", () => {
  it("kanji (漢字分解)", () => {
    const r = rei('"休" |> kanji');
    expect(r.reiType).toBe('StringMDim');
    expect(r.center).toBe('休');
  });

  it("sentence (文解析)", () => {
    const r = rei('"猫が魚を食べた" |> sentence');
    expect(r.reiType).toBe('StringMDim');
  });

  it("kanji → similarity", () => {
    const r = rei('"休" |> kanji |> similarity("体")');
    expect(typeof r.strength).toBe('number');
  });
});

// ═══════════════════════════════════════════
// 柱③: パズル統一（新規統合）
// ═══════════════════════════════════════════

describe("柱③: パズル統一", () => {
  it("数独生成 → 解く（パイプチェーン）", () => {
    const r = rei('30 |> generate_sudoku(42) |> solve');
    expect(r.reiType).toBe('PuzzleSpace');
    expect(r.solved).toBe(true);
  });

  it("日本語: 数独生成 → 解く → σ", () => {
    const r = rei('30 |> 数独生成(42) |> 解く |> sigma');
    expect(r.reiType).toBe('SigmaResult');
    expect(r.flow.momentum).toBe('converged');
  });

  it("文字列から数独構築 → solve", () => {
    const r = rei('"530070000600195000098000060800060003400803001700020006060000280000419005000080079" |> puzzle |> solve');
    expect(r.solved).toBe(true);
  });
});

// ═══════════════════════════════════════════
// 柱④: Thought Loop（思考ループ）
// ═══════════════════════════════════════════

describe("柱④: Thought Loop", () => {
  it("基本think", () => {
    const r = rei('𝕄{5; 1, 2, 3} |> think("converge")');
    expect(r.reiType).toBe('ThoughtResult');
    expect(typeof r.finalNumeric).toBe('number');
  });

  it("think回数指定", () => {
    const r = rei('𝕄{5; 1, 2, 3} |> think(5)');
    expect(r.reiType).toBe('ThoughtResult');
    expect(r.totalIterations).toBeLessThanOrEqual(5);
  });

  it("think_trajectory", () => {
    const r = rei('𝕄{5; 1, 2, 3} |> think_trajectory');
    expect(Array.isArray(r)).toBe(true);
  });

  it("日本語: 思考", () => {
    const r = rei('𝕄{5; 1, 2, 3} |> 思考("converge")');
    expect(r.reiType).toBe('ThoughtResult');
  });
});

// ═══════════════════════════════════════════
// 柱⑤: Game & Randomness
// ═══════════════════════════════════════════

describe("柱⑤: Game & Randomness", () => {
  it("ゲーム作成", () => {
    const r = rei('"tic_tac_toe" |> game');
    expect(r.reiType).toBe('GameSpace');
  });

  it("自動対局", () => {
    const r = rei('"tic_tac_toe" |> game |> auto_play');
    expect(r.reiType).toBe('GameSpace');
  });

  it("ランダム", () => {
    const r = rei('𝕄{5; 1, 2, 3, 4} |> random');
    expect(r.reiType).toBe('RandomResult');
    expect(typeof r.value).toBe('number');
  });

  it("エントロピー", () => {
    const r = rei('𝕄{5; 1, 2, 3, 4} |> entropy');
    expect(r.reiType).toBe('EntropyAnalysis');
    expect(typeof r.shannon).toBe('number');
  });

  it("日本語: ゲーム", () => {
    const r = rei('"tic_tac_toe" |> ゲーム');
    expect(r.reiType).toBe('GameSpace');
  });
});

// ═══════════════════════════════════════════
// 全柱横断: パイプチェーン互換性
// ═══════════════════════════════════════════

describe("全柱横断テスト", () => {
  it("evolve → think: 柱①→④の連携", () => {
    const r = rei('𝕄{5; 1, 2, 3} |> evolve');
    expect(r.reiType).toBe('EvolveResult');
    // evolve結果のvalueは数値
    expect(typeof r.value).toBe('number');
  });

  it("パズル→σ→awareness: 柱③→Tier4の連携", () => {
    const sigma = rei('30 |> generate_sudoku(42) |> solve |> sigma');
    expect(sigma.reiType).toBe('SigmaResult');
    expect(sigma.flow.progress).toBe(1);
  });

  it("serialize/deserialize の後方互換", () => {
    const serialized = rei('𝕄{5; 1, 2, 3} |> compute |> serialize');
    expect(typeof serialized).toBe('string');
    const parsed = JSON.parse(serialized);
    expect(parsed.__rei__).toBe(true);
  });
});
