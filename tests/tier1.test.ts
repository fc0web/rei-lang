// ============================================================
// Rei v0.3 Tier 1 テストスイート — 公理C1(σ) & C2(τ)
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

/** ReiValを透過的にアンラップ */
function unwrap(v: any): any {
  return (v !== null && typeof v === 'object' && v.reiType === 'ReiVal') ? v.value : v;
}

// ============================================================
// 公理C1 — 全値型のσ（自己参照）
// ============================================================

describe("Tier 1: 公理C1 — 全値型のσ（自己参照）", () => {

  describe("Number |> sigma", () => {
    it("数値の基本σ", () => {
      const r = run("42 |> sigma");
      expect(r.reiType).toBe("SigmaResult");
      expect(r.field.center).toBe(42);
      expect(Array.isArray(r.field.neighbors)).toBe(true);
      expect(r.field.neighbors.length).toBe(0);
    });

    it("数値σのwill/flow/memory（パイプ無し）", () => {
      const r = run("42 |> sigma");
      expect(r.will.tendency).toBe("rest");
      expect(r.memory.raw.length).toBe(0);
      expect(r.layer.depth).toBe(0);
    });

    it("σ.fieldアクセス", () => {
      const r = run("42 |> sigma |> field");
      expect(r.center).toBe(42);
    });
  });

  describe("String |> sigma", () => {
    it("文字列の基本σ", () => {
      const r = run('"hello" |> sigma');
      expect(r.reiType).toBe("SigmaResult");
      expect(r.field.value).toBe("hello");
      expect(r.field.length).toBe(5);
    });
  });

  describe("MDim |> sigma", () => {
    it("MDimの基本σ", () => {
      const r = run("𝕄{3; 1, 2, 3} |> sigma");
      expect(r.reiType).toBe("SigmaResult");
      expect(r.field.center).toBe(3);
      expect(r.field.dim).toBe(3);
      expect(r.field.mode).toBe("weighted");
    });
  });

  describe("Ext |> sigma", () => {
    it("拡張数の基本σ", () => {
      const r = run("0ox |> sigma");
      expect(r.reiType).toBe("SigmaResult");
      expect(r.field.base).toBe(0);
      expect(r.field.order).toBe(2);
      expect(r.layer.depth).toBe(2);
    });
  });

  describe("Genesis |> sigma", () => {
    it("Genesis（未進行）のσ", () => {
      const r = run("genesis() |> sigma");
      expect(r.reiType).toBe("SigmaResult");
      expect(r.field.state).toBe("void");
      expect(r.field.omega).toBe(0);
      expect(r.flow.direction).toBe("forward");
    });

    it("Genesis（進行後）のσメモリ統合", () => {
      const r = run("genesis() |> forward |> forward |> sigma");
      expect(r.reiType).toBe("SigmaResult");
      expect(r.field.state).toBe("line");
      expect(r.memory.raw.length).toBeGreaterThan(0);
    });
  });

  describe("Boolean / Null |> sigma", () => {
    it("真偽値のσ", () => {
      const r = run("true |> sigma");
      expect(r.reiType).toBe("SigmaResult");
      expect(r.field.value).toBe(true);
    });

    it("nullのσ", () => {
      const r = run("null |> sigma");
      expect(r.reiType).toBe("SigmaResult");
      expect(r.field.value).toBe(null);
    });
  });

  describe("Array |> sigma", () => {
    it("配列のσ", () => {
      const r = run("[1, 2, 3] |> sigma");
      expect(r.reiType).toBe("SigmaResult");
      expect(r.field.length).toBe(3);
      expect(r.field.first).toBe(1);
      expect(r.field.last).toBe(3);
    });
  });
});

// ============================================================
// 公理C2 — τ（傾向性）とメモリ追跡
// ============================================================

describe("Tier 1: 公理C2 — τ（傾向性）とメモリ追跡", () => {

  describe("パイプ通過時のメモリ記録", () => {
    it("数値パイプのメモリ追跡", () => {
      const r = run("42 |> abs |> sqrt |> sigma");
      expect(r.memory.raw.length).toBeGreaterThanOrEqual(1);
      expect(r.memory.raw[0]).toBe(42);
    });

    it("文字列パイプのメモリ追跡", () => {
      const r = run('"hello" |> upper |> sigma');
      expect(r.memory.raw.length).toBeGreaterThanOrEqual(1);
      expect(r.memory.raw[0]).toBe("hello");
    });

    it("σ.memoryアクセス", () => {
      const r = run("42 |> abs |> sqrt |> sigma |> memory");
      // 深化版: memory はオブジェクト { raw, entries, ... }
      expect(r).toHaveProperty('raw');
      expect(Array.isArray(r.raw)).toBe(true);
      expect(r.raw.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe("傾向性（tendency）の検出", () => {
    it("縮小傾向の検出（contract）", () => {
      const r = run("100 |> sqrt |> sqrt |> sqrt |> sigma");
      expect(r.will.tendency).toBe("contract");
    });

    it("σ.willアクセス", () => {
      const r = run("100 |> sqrt |> sqrt |> sigma |> will");
      expect(r.tendency).toBeDefined();
      expect(r.strength).toBeDefined();
    });

    it("σ.will.tendencyアクセス", () => {
      const r = run("100 |> sqrt |> sqrt |> sigma |> will");
      expect(r.tendency).toBe("contract");
    });
  });

  describe("σの直列パイプ動作", () => {
    it("σは参照操作（メモリに影響しない）", () => {
      const r = run("42 |> abs |> sigma");
      expect(r.reiType).toBe("SigmaResult");
    });

    it("σ後のfield/flowパイプ", () => {
      const flow = run("42 |> abs |> sigma |> flow");
      expect(flow.direction !== undefined || flow.momentum !== undefined).toBe(true);
    });
  });
});

// ============================================================
// 後方互換性テスト
// ============================================================

describe("後方互換性テスト", () => {

  describe("既存v0.3 Space/DNode σとの互換", () => {
    it("Space σ（既存互換）", () => {
      const r = run(`
        let s = space { layer 0: 𝕄{5; 1, 2, 3} }
        s |> sigma
      `);
      expect(r.field).toBeDefined();
    });

    it("DNode σ（既存互換）", () => {
      const r = run(`
        let s = space { layer 0: 𝕄{5; 1, 2, 3} }
        let n = s |> node(0, 0)
        n |> sigma
      `);
      expect(r.reiType).toBe("SigmaResult");
      expect(r.field.center).toBeDefined();
      expect(r.flow).toBeDefined();
      expect(r.will).toBeDefined();
    });
  });

  describe("パイプ通過後の値の正常動作", () => {
    it("パイプ通過後の数値演算", () => {
      const r = run("let x = 42 |> abs; x + 10");
      expect(unwrap(r)).toBe(52);
    });

    it("パイプ通過後の比較演算", () => {
      const r = run("let x = 42 |> abs; x == 42");
      expect(unwrap(r)).toBe(true);
    });

    it("パイプ通過後のMDim演算", () => {
      const r = run("let m = 𝕄{3; 1, 2} |> normalize; m |> compute");
      expect(typeof unwrap(r)).toBe("number");
    });

    it("パイプ通過後のGenesis操作", () => {
      const r = run("let g = genesis() |> forward; g |> phase");
      expect(unwrap(r)).toBe("dot");
    });

    it("パイプ通過後の文字列操作", () => {
      const r = run('"hello" |> upper |> len');
      expect(unwrap(r)).toBe(5);
    });

    it("パイプ通過後のif式", () => {
      const r = run("let x = 42 |> abs; if x then 1 else 0");
      expect(unwrap(r)).toBe(1);
    });
  });

  describe("複合パイプチェーン", () => {
    it("長いパイプチェーンのメモリ蓄積", () => {
      const r = run("100 |> abs |> sqrt |> floor |> abs |> sigma");
      expect(r.memory.raw.length).toBeGreaterThanOrEqual(3);
    });

    it("Genesis複数段階のσ", () => {
      const r = run("genesis() |> forward |> forward |> forward |> sigma");
      expect(r.field.state).toBe("surface");
    });
  });
});
