/**
 * Rei Serialization Tests — serialize/deserialize
 * 23 tests covering: basic types, σ preservation, roundtrip,
 * complex types, pretty print, version metadata, full pipeline
 */
import { describe, it, expect } from "vitest";
import { rei } from "../src/index";

describe("S1: serialize 基本型", () => {
  it("number", () => {
    rei.reset();
    const r = rei('42 |> serialize') as string;
    expect(typeof r).toBe("string");
    const env = JSON.parse(r);
    expect(env.__rei__).toBe(true);
    expect(env.type).toBe("number");
    expect(env.payload).toBe(42);
    expect(env.version).toBe("0.3.1");
  });

  it("string", () => {
    rei.reset();
    const env = JSON.parse(rei('"hello" |> serialize') as string);
    expect(env.type).toBe("string");
    expect(env.payload).toBe("hello");
  });

  it("array", () => {
    rei.reset();
    const env = JSON.parse(rei('[1, 2, 3] |> serialize') as string);
    expect(env.type).toBe("array");
    expect(env.payload).toEqual([1, 2, 3]);
  });

  it("MDim", () => {
    rei.reset();
    const env = JSON.parse(rei('𝕄{5; 1, 2, 3} |> serialize') as string);
    expect(env.type).toBe("MDim");
    expect(env.payload.center).toBe(5);
    expect(env.payload.neighbors).toEqual([1, 2, 3]);
  });

  it("Quad", () => {
    rei.reset();
    const env = JSON.parse(rei('⊤ |> serialize') as string);
    expect(env.type).toBe("Quad");
    expect(env.payload.value).toBe("top");
  });

  it("boolean", () => {
    rei.reset();
    const env = JSON.parse(rei('true |> serialize') as string);
    expect(env.type).toBe("boolean");
    expect(env.payload).toBe(true);
  });
});

describe("S2: serialize with σ", () => {
  it("computed value has σ in envelope", () => {
    rei.reset();
    const env = JSON.parse(rei('𝕄{10; 3, 7, 5} |> compute |> serialize') as string);
    expect(env.type).toBe("ReiVal");
    expect(env.sigma).toBeDefined();
    expect(env.sigma.memory.length).toBeGreaterThan(0);
    expect(env.sigma.pipeCount).toBe(1);
  });

  it("multi-pipe σ tendency tracking", () => {
    rei.reset();
    const env = JSON.parse(rei('𝕄{10; 3, 7, 5} |> compute |> sqrt |> negate |> serialize') as string);
    expect(env.sigma).toBeDefined();
    expect(env.sigma.pipeCount).toBeGreaterThanOrEqual(3);
    expect(env.sigma.memory.length).toBeGreaterThanOrEqual(2);
    expect(env.sigma.tendency).toBe("contract");
  });

  it("σ not duplicated in payload", () => {
    rei.reset();
    const env = JSON.parse(rei('𝕄{5; 1, 2, 3} |> compute |> serialize') as string);
    expect(env.payload.__sigma__).toBeUndefined();
    expect(env.sigma).toBeDefined();
  });
});

describe("S3: deserialize 基本型", () => {
  it("number roundtrip", () => {
    rei.reset();
    const json = rei('42 |> serialize') as string;
    rei.reset();
    rei.evaluator().env.define("j", json, false);
    expect(rei('j |> deserialize')).toBe(42);
  });

  it("MDim roundtrip", () => {
    rei.reset();
    const json = rei('𝕄{5; 1, 2, 3} |> serialize') as string;
    rei.reset();
    rei.evaluator().env.define("j", json, false);
    const r = rei('j |> deserialize') as any;
    expect(r.reiType).toBe("MDim");
    expect(r.center).toBe(5);
    expect(r.neighbors).toEqual([1, 2, 3]);
  });

  it("array roundtrip", () => {
    rei.reset();
    const json = rei('[10, 20, 30] |> serialize') as string;
    rei.reset();
    rei.evaluator().env.define("j", json, false);
    const r = rei('j |> deserialize') as any[];
    expect(Array.isArray(r)).toBe(true);
    expect(r).toEqual([10, 20, 30]);
  });
});

describe("S4: σ 来歴の引き継ぎ", () => {
  it("σ memory restored after deserialize", () => {
    rei.reset();
    const json = rei('𝕄{10; 3, 7, 5} |> compute |> sqrt |> serialize') as string;
    rei.reset();
    rei.evaluator().env.define("j", json, false);
    const r = rei('j |> deserialize') as any;
    expect(r.__sigma__).toBeDefined();
    expect(r.__sigma__.memory.length).toBeGreaterThan(0);
    expect(r.__sigma__.pipeCount).toBeGreaterThanOrEqual(2);
  });

  it("deserialized 𝕄 → compute", () => {
    rei.reset();
    const json = rei('𝕄{5; 1, 2, 3} |> serialize') as string;
    rei.reset();
    rei.evaluator().env.define("j", json, false);
    const r = rei('j |> deserialize |> compute') as any;
    const val = typeof r === "object" ? (r.value ?? r) : r;
    expect(val).toBe(7);
  });

  it("deserialized 𝕄 → compute_all", () => {
    rei.reset();
    const json = rei('𝕄{10; 3, 7, 5} |> serialize') as string;
    rei.reset();
    rei.evaluator().env.define("j", json, false);
    const r = rei('j |> deserialize |> compute_all') as any[];
    expect(Array.isArray(r)).toBe(true);
    expect(r.length).toBe(8);
  });

  it("deserialized 𝕄 → consensus", () => {
    rei.reset();
    const json = rei('𝕄{5; 4, 5, 6} |> serialize') as string;
    rei.reset();
    rei.evaluator().env.define("j", json, false);
    const r = rei('j |> deserialize |> consensus') as any;
    expect(r.reiType).toBe("ConsensusResult");
    expect(typeof r.agreement).toBe("number");
  });
});

describe("S5: 複合型の保存・復元", () => {
  it("SigmaResult roundtrip", () => {
    rei.reset();
    const json = rei('𝕄{10; 3, 7, 5} |> compute |> sigma |> serialize') as string;
    rei.reset();
    rei.evaluator().env.define("j", json, false);
    const r = rei('j |> deserialize') as any;
    expect(r.reiType).toBe("SigmaResult");
    expect(r.field).toBeDefined();
    expect(r.will).toBeDefined();
  });

  it("ConsensusResult roundtrip", () => {
    rei.reset();
    const json = rei('𝕄{5; 4, 5, 6} |> consensus |> serialize') as string;
    rei.reset();
    rei.evaluator().env.define("j", json, false);
    const r = rei('j |> deserialize') as any;
    expect(r.reiType).toBe("ConsensusResult");
    expect(typeof r.agreement).toBe("number");
  });

  it("BridgeResult roundtrip", () => {
    rei.reset();
    const json = rei('𝕄{5; 1, 2, 3} |> bridge(𝕄{10; 2, 4, 6}) |> serialize') as string;
    rei.reset();
    rei.evaluator().env.define("j", json, false);
    const r = rei('j |> deserialize') as any;
    expect(r.reiType).toBe("BridgeResult");
    expect(r.scaleFactor).toBe(2);
    expect(r.transferable).toBe(true);
  });
});

describe("S6: serialize_pretty", () => {
  it("formatted output", () => {
    rei.reset();
    const r = rei('𝕄{5; 1, 2, 3} |> serialize_pretty') as string;
    expect(typeof r).toBe("string");
    expect(r).toContain("\n");
    expect(r).toContain("  ");
    const env = JSON.parse(r);
    expect(env.type).toBe("MDim");
  });
});

describe("S7: メタデータ", () => {
  it("timestamp present", () => {
    rei.reset();
    const env = JSON.parse(rei('42 |> serialize') as string);
    expect(typeof env.timestamp).toBe("string");
    expect(env.timestamp).toContain("T");
  });

  it("version correct", () => {
    rei.reset();
    const env = JSON.parse(rei('42 |> serialize') as string);
    expect(env.version).toBe("0.3.1");
  });
});

describe("S8: フルパイプライン", () => {
  it("serialize → deserialize → compute → σ check", () => {
    rei.reset();
    const json = rei('𝕄{10; 3, 7, 5} |> compute |> sqrt |> serialize') as string;
    const env = JSON.parse(json);
    expect(env.sigma.pipeCount).toBeGreaterThanOrEqual(2);

    rei.reset();
    rei.evaluator().env.define("saved", json, false);
    const r = rei('saved |> deserialize |> negate |> abs |> sigma') as any;
    expect(r.reiType).toBe("SigmaResult");
    expect(r.memory.length).toBeGreaterThanOrEqual(1);
  });
});
