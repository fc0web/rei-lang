/**
 * Phase 7e Tests — ミクロ-マクロ双極限メタブリッジ
 *
 * テスト構成:
 *   1. 圧縮関手 compress (μ方向) — 30テスト
 *   2. 展開関手 expand (M方向) — 30テスト
 *   3. 双対性定理 DT-1〜DT-4 — 25テスト
 *   4. 密度メトリクス — 20テスト
 *   5. 被覆メトリクス — 15テスト
 *   6. MetaBridge 翻訳 — 20テスト
 *   7. ダイヤモンド7結晶モデル — 10テスト
 *                          合計: 150テスト
 */

import { describe, it, expect } from 'vitest';
import {
  // Types
  type GenesisSystem,
  type Domain,
  type SigmaSystem,
  type CoreRepr,
  type SystemRepr,
  type MetaBridge,
  // Constants
  ALL_GENESIS_SYSTEMS,
  ALL_DOMAINS,
  ALL_SIGMA_SYSTEMS,
  THEORETICAL_MAXIMUM,
  // Core functions
  compress,
  expand,
  createSeedRepr,
  createSystemRepr,
  // Metrics
  measureDensity,
  measureCoverage,
  // Bridge
  createMetaBridge,
  createAllBridges,
  // Duality theorems
  verifyDT1,
  verifyDT2,
  verifyDT3,
  verifyDT4,
  // Preservation
  verifyMBP1,
  verifyMBP4,
  verifyMBP5,
  // Diamond 7
  createDiamond7,
} from '../src/lang/sigma-meta-bridge';

// ============================================================
// Helper
// ============================================================

function makeRepr(
  value: number,
  system: GenesisSystem = 'core',
  domain: Domain = 'natural-science',
  sigmaSystem: SigmaSystem = 'deep',
  sigmaOverrides: Record<string, any> = {},
): SystemRepr {
  return createSystemRepr(value, {
    system,
    domain,
    sigmaSystem,
    sigma: Object.keys(sigmaOverrides).length > 0 ? sigmaOverrides : undefined,
  });
}

// ============================================================
// 1. 圧縮関手 compress (μ方向) — 30テスト
// ============================================================

describe('Phase 7e: compress (μ方向)', () => {

  it('C-01: core system repr → CoreRepr', () => {
    const repr = makeRepr(42, 'core');
    const core = compress(repr);
    expect(core.reiType).toBe('CoreRepr');
    expect(core.seed).toBe(42);
  });

  it('C-02: quantum system repr → CoreRepr preserves value', () => {
    const repr = makeRepr(7, 'quantum', 'info-engineering');
    const core = compress(repr);
    expect(core.seed).toBe(7);
    expect(core.zero.center).toBe(7);
  });

  it('C-03: categorical system repr → CoreRepr', () => {
    const repr = makeRepr(100, 'categorical', 'humanities');
    const core = compress(repr);
    expect(core.seed).toBe(100);
  });

  it('C-04: cellular system repr → CoreRepr', () => {
    const repr = makeRepr(255, 'cellular', 'art');
    const core = compress(repr);
    expect(core.seed).toBe(255);
  });

  it('C-05: dialectical system repr → CoreRepr', () => {
    const repr = makeRepr(-1, 'dialectical', 'economics');
    const core = compress(repr);
    expect(core.seed).toBe(-1);
  });

  it('C-06: preserves periphery from field.neighbors', () => {
    const repr = makeRepr(10, 'core', 'natural-science', 'deep', {
      field: { center: 10, neighbors: [1, 2, 3], dim: 1, domain: 'natural-science' },
      flow: { velocity: 0, phase: 'rest' },
      memory: [],
      layer: { depth: 1, structure: 'flat' },
      relation: { refs: [], isolated: true },
      will: { tendency: 'rest', strength: 0 },
    });
    const core = compress(repr);
    expect(core.zero.periphery).toContain(1);
    expect(core.zero.periphery).toContain(2);
    expect(core.zero.periphery).toContain(3);
  });

  it('C-07: σ-minimal → compressed sigma has state/transition', () => {
    const repr = makeRepr(5, 'core', 'natural-science', 'minimal');
    const core = compress(repr);
    expect(core.sigma.state).toBeDefined();
    expect(core.sigma.transition).toBeDefined();
  });

  it('C-08: σ-deep → state includes field,memory,layer', () => {
    const repr = makeRepr(5, 'core', 'natural-science', 'deep');
    const core = compress(repr);
    expect(core.sigma.state).toHaveProperty('field');
    expect(core.sigma.state).toHaveProperty('memory');
    expect(core.sigma.state).toHaveProperty('layer');
  });

  it('C-09: σ-deep → transition includes flow,relation,will', () => {
    const repr = makeRepr(5, 'core', 'natural-science', 'deep');
    const core = compress(repr);
    expect(core.sigma.transition).toHaveProperty('flow');
    expect(core.sigma.transition).toHaveProperty('relation');
    expect(core.sigma.transition).toHaveProperty('will');
  });

  it('C-10: σ-extended → preserves anti-attributes in state', () => {
    const repr = makeRepr(5, 'core', 'natural-science', 'extended', {
      field: { center: 5 },
      flow: { velocity: 0 },
      memory: [],
      layer: { depth: 1 },
      relation: { refs: [] },
      will: { tendency: 'rest' },
      antiField: { void: true },
      antiFlow: { reversed: true },
      antiMemory: { forgotten: ['x'] },
      antiLayer: { collapsed: true },
      antiRelation: { severed: ['y'] },
      antiWill: { inaction: true },
    });
    const core = compress(repr);
    expect(core.sigma.state.antiField).toEqual({ void: true });
    expect(core.sigma.transition.antiFlow).toEqual({ reversed: true });
  });

  it('C-11: payload preserves original system', () => {
    const repr = makeRepr(42, 'quantum', 'music');
    const core = compress(repr);
    expect(core.payload.originalSystem).toBe('quantum');
    expect(core.payload.originalDomain).toBe('music');
  });

  it('C-12: payload preserves original sigmaSystem', () => {
    const repr = makeRepr(42, 'core', 'humanities', 'extended');
    const core = compress(repr);
    expect(core.payload.originalSigmaSystem).toBe('extended');
  });

  it('C-13: bridgeability includes all domains', () => {
    const repr = makeRepr(42, 'core', 'art');
    const core = compress(repr);
    expect(core.bridgeability.length).toBe(ALL_DOMAINS.length);
    // 元のドメインが先頭
    expect(core.bridgeability[0]).toBe('art');
  });

  it('C-14: zero value compresses correctly', () => {
    const repr = makeRepr(0, 'core');
    const core = compress(repr);
    expect(core.seed).toBe(0);
    expect(core.zero.center).toBe(0);
  });

  it('C-15: negative value compresses correctly', () => {
    const repr = makeRepr(-999, 'dialectical');
    const core = compress(repr);
    expect(core.seed).toBe(-999);
  });

  it('C-16: large value compresses correctly', () => {
    const repr = makeRepr(Number.MAX_SAFE_INTEGER, 'quantum');
    const core = compress(repr);
    expect(core.seed).toBe(Number.MAX_SAFE_INTEGER);
  });

  it('C-17: compress preserves velocity in periphery', () => {
    const repr = makeRepr(10, 'core', 'natural-science', 'deep', {
      field: { center: 10, neighbors: [], dim: 0, domain: 'default' },
      flow: { velocity: 5.5, phase: 'accelerating' },
      memory: [],
      layer: { depth: 1, structure: 'flat' },
      relation: { refs: [], isolated: true },
      will: { tendency: 'rest', strength: 0 },
    });
    const core = compress(repr);
    expect(core.zero.periphery).toContain(5.5);
  });

  it('C-18: compress relation refs → hashed periphery', () => {
    const repr = makeRepr(10, 'core', 'natural-science', 'deep', {
      field: { center: 10, neighbors: [], dim: 0 },
      flow: { velocity: 0, phase: 'rest' },
      memory: [],
      layer: { depth: 1, structure: 'flat' },
      relation: { refs: ['node-a', 'node-b'], isolated: false },
      will: { tendency: 'rest', strength: 0 },
    });
    const core = compress(repr);
    expect(core.zero.periphery.length).toBeGreaterThanOrEqual(2);
  });

  it('C-19: compress is deterministic', () => {
    const repr = makeRepr(42, 'quantum', 'music', 'deep');
    const core1 = compress(repr);
    const core2 = compress(repr);
    expect(core1.seed).toBe(core2.seed);
    expect(core1.zero.center).toBe(core2.zero.center);
  });

  it('C-20: σ-fluid compresses without error', () => {
    const repr = makeRepr(42, 'core', 'natural-science', 'fluid');
    expect(() => compress(repr)).not.toThrow();
    const core = compress(repr);
    expect(core.seed).toBe(42);
  });

  it('C-21: each domain compresses correctly', () => {
    for (const domain of ALL_DOMAINS) {
      const repr = makeRepr(1, 'core', domain);
      const core = compress(repr);
      expect(core.seed).toBe(1);
      expect(core.bridgeability[0]).toBe(domain);
    }
  });

  it('C-22: each system compresses correctly', () => {
    for (const system of ALL_GENESIS_SYSTEMS) {
      const repr = makeRepr(1, system);
      const core = compress(repr);
      expect(core.seed).toBe(1);
      expect(core.payload.originalSystem).toBe(system);
    }
  });

  it('C-23: compress with empty sigma', () => {
    const repr: SystemRepr = {
      reiType: 'SystemRepr',
      system: 'core',
      domain: 'natural-science',
      sigmaSystem: 'deep',
      value: 0,
      sigma: {},
      systemMeta: {},
    };
    expect(() => compress(repr)).not.toThrow();
  });

  it('C-24: compress with rich sigma preserves in payload', () => {
    const richSigma = {
      field: { center: 42, neighbors: [1,2,3], dim: 3, domain: 'physics' },
      flow: { velocity: 10, phase: 'accelerating' },
      memory: [{ value: 40 }, { value: 41 }],
      layer: { depth: 3, structure: 'recursive' },
      relation: { refs: ['a', 'b', 'c'], isolated: false },
      will: { tendency: 'expand', strength: 0.9 },
    };
    const repr = makeRepr(42, 'quantum', 'natural-science', 'deep', richSigma);
    const core = compress(repr);
    expect(core.payload.originalSigma).toEqual(richSigma);
  });

  it('C-25: compress preserves systemMeta in payload', () => {
    const repr = createSystemRepr(42, {
      system: 'categorical',
      systemMeta: { objects: 5, morphisms: 10 },
    });
    const core = compress(repr);
    expect(core.payload.originalSystemMeta).toEqual({ objects: 5, morphisms: 10 });
  });

  it('C-26: CoreRepr always has 4 core fields', () => {
    const repr = makeRepr(42, 'quantum', 'music', 'extended');
    const core = compress(repr);
    expect(core).toHaveProperty('seed');
    expect(core).toHaveProperty('zero');
    expect(core).toHaveProperty('sigma');
    expect(core).toHaveProperty('bridgeability');
  });

  it('C-27: bridgeability always has 7 domains', () => {
    const repr = makeRepr(42);
    const core = compress(repr);
    expect(core.bridgeability.length).toBe(7);
    expect(new Set(core.bridgeability).size).toBe(7);
  });

  it('C-28: compress different values → different seeds', () => {
    const core1 = compress(makeRepr(1));
    const core2 = compress(makeRepr(2));
    expect(core1.seed).not.toBe(core2.seed);
  });

  it('C-29: compress same value/different system → same seed', () => {
    const core1 = compress(makeRepr(42, 'core'));
    const core2 = compress(makeRepr(42, 'quantum'));
    expect(core1.seed).toBe(core2.seed);
  });

  it('C-30: σ-minimal state/transition are preserved', () => {
    const repr = makeRepr(5, 'core', 'natural-science', 'minimal');
    const core = compress(repr);
    expect(core.sigma.state).toBeDefined();
    expect(core.sigma.transition).toBeDefined();
  });
});

// ============================================================
// 2. 展開関手 expand (M方向) — 30テスト
// ============================================================

describe('Phase 7e: expand (M方向)', () => {

  const seed = createSeedRepr(42);

  it('E-01: expand to core/natural-science/deep', () => {
    const result = expand(seed, { system: 'core', domain: 'natural-science', sigmaSystem: 'deep' });
    expect(result.reiType).toBe('SystemRepr');
    expect(result.value).toBe(42);
    expect(result.system).toBe('core');
  });

  it('E-02: expand to quantum system', () => {
    const result = expand(seed, { system: 'quantum', domain: 'info-engineering', sigmaSystem: 'deep' });
    expect(result.system).toBe('quantum');
    expect(result.systemMeta.hilbertDim).toBeGreaterThanOrEqual(2);
  });

  it('E-03: expand to categorical system', () => {
    const result = expand(seed, { system: 'categorical', domain: 'humanities', sigmaSystem: 'deep' });
    expect(result.system).toBe('categorical');
    expect(result.systemMeta.isIdentity).toBe(true);
  });

  it('E-04: expand to cellular system', () => {
    const result = expand(seed, { system: 'cellular', domain: 'art', sigmaSystem: 'deep' });
    expect(result.system).toBe('cellular');
    expect(result.systemMeta.rule).toBe(110);
  });

  it('E-05: expand to dialectical system', () => {
    const result = expand(seed, { system: 'dialectical', domain: 'economics', sigmaSystem: 'deep' });
    expect(result.system).toBe('dialectical');
    expect(result.systemMeta.thesis).toBe(42);
    expect(result.systemMeta.antithesis).toBe(-42);
  });

  it('E-06: expand to σ-minimal → 2 attributes', () => {
    const result = expand(seed, { system: 'core', domain: 'natural-science', sigmaSystem: 'minimal' });
    expect(result.sigma).toHaveProperty('state');
    expect(result.sigma).toHaveProperty('transition');
  });

  it('E-07: expand to σ-deep → 6 attributes', () => {
    const result = expand(seed, { system: 'core', domain: 'natural-science', sigmaSystem: 'deep' });
    expect(result.sigma).toHaveProperty('field');
    expect(result.sigma).toHaveProperty('flow');
    expect(result.sigma).toHaveProperty('memory');
    expect(result.sigma).toHaveProperty('layer');
    expect(result.sigma).toHaveProperty('relation');
    expect(result.sigma).toHaveProperty('will');
  });

  it('E-08: expand to σ-extended → includes anti-attributes', () => {
    const result = expand(seed, { system: 'core', domain: 'natural-science', sigmaSystem: 'extended' });
    expect(result.sigma).toHaveProperty('antiField');
    expect(result.sigma).toHaveProperty('antiFlow');
    expect(result.sigma).toHaveProperty('antiMemory');
    expect(result.sigma).toHaveProperty('antiLayer');
    expect(result.sigma).toHaveProperty('antiRelation');
    expect(result.sigma).toHaveProperty('antiWill');
  });

  it('E-09: expand to σ-fluid → has _fluid marker', () => {
    const result = expand(seed, { system: 'core', domain: 'natural-science', sigmaSystem: 'fluid' });
    expect(result.sigma._fluid).toBe(true);
    expect(result.sigma._canGrow).toBe(true);
    expect(result.sigma._canShrink).toBe(true);
  });

  it('E-10: expand preserves seed value across all systems', () => {
    for (const sys of ALL_GENESIS_SYSTEMS) {
      const result = expand(seed, { system: sys, domain: 'natural-science', sigmaSystem: 'deep' });
      expect(result.value).toBe(42);
    }
  });

  it('E-11: expand preserves seed value across all domains', () => {
    for (const dom of ALL_DOMAINS) {
      const result = expand(seed, { system: 'core', domain: dom, sigmaSystem: 'deep' });
      expect(result.value).toBe(42);
    }
  });

  it('E-12: expand preserves seed value across all σ systems', () => {
    for (const sig of ALL_SIGMA_SYSTEMS) {
      const result = expand(seed, { system: 'core', domain: 'natural-science', sigmaSystem: sig });
      expect(result.value).toBe(42);
    }
  });

  it('E-13: expand reaches all 140 combinations', () => {
    let count = 0;
    for (const sys of ALL_GENESIS_SYSTEMS) {
      for (const dom of ALL_DOMAINS) {
        for (const sig of ALL_SIGMA_SYSTEMS) {
          const result = expand(seed, { system: sys, domain: dom, sigmaSystem: sig });
          expect(result.reiType).toBe('SystemRepr');
          count++;
        }
      }
    }
    expect(count).toBe(THEORETICAL_MAXIMUM);
  });

  it('E-14: expand with zero seed', () => {
    const zeroSeed = createSeedRepr(0);
    const result = expand(zeroSeed, { system: 'quantum', domain: 'music', sigmaSystem: 'deep' });
    expect(result.value).toBe(0);
  });

  it('E-15: expand with negative seed', () => {
    const negSeed = createSeedRepr(-100);
    const result = expand(negSeed, { system: 'dialectical', domain: 'art', sigmaSystem: 'deep' });
    expect(result.value).toBe(-100);
    expect(result.systemMeta.antithesis).toBe(100);
  });

  it('E-16: expand domain label is correct', () => {
    const result = expand(seed, { system: 'core', domain: 'art', sigmaSystem: 'deep' });
    expect(result.systemMeta.domainLabel).toBe('E');
  });

  it('E-17: expand quantum hilbert dim scales with seed', () => {
    const largeSeed = createSeedRepr(1000);
    const result = expand(largeSeed, { system: 'quantum', domain: 'natural-science', sigmaSystem: 'deep' });
    expect(result.systemMeta.hilbertDim).toBeGreaterThan(2);
  });

  it('E-18: expand restores original systemMeta when roundtripping', () => {
    const original = createSystemRepr(42, {
      system: 'quantum',
      domain: 'music',
      systemMeta: { custom: 'data', hilbertDim: 8 },
    });
    const core = compress(original);
    const restored = expand(core, { system: 'quantum', domain: 'music', sigmaSystem: 'deep' });
    expect(restored.systemMeta.custom).toBe('data');
  });

  it('E-19: expand to different system does not restore original meta', () => {
    const original = createSystemRepr(42, {
      system: 'quantum',
      systemMeta: { custom: 'quantum-data' },
    });
    const core = compress(original);
    const different = expand(core, { system: 'cellular', domain: 'natural-science', sigmaSystem: 'deep' });
    expect(different.systemMeta.custom).toBeUndefined();
    expect(different.systemMeta.rule).toBe(110);
  });

  it('E-20: deep σ has system mapping', () => {
    const result = expand(seed, { system: 'quantum', domain: 'natural-science', sigmaSystem: 'deep' });
    expect(result.sigma._systemMapping).toBeDefined();
    expect(result.sigma._systemMapping.field).toBe('hilbert-subspace');
  });

  it('E-21: dialectical spiral starts at 0', () => {
    const result = expand(seed, { system: 'dialectical', domain: 'humanities', sigmaSystem: 'deep' });
    expect(result.systemMeta.spiralLevel).toBe(0);
  });

  it('E-22: expand sets correct sigmaSystem on result', () => {
    for (const sig of ALL_SIGMA_SYSTEMS) {
      const result = expand(seed, { system: 'core', domain: 'natural-science', sigmaSystem: sig });
      expect(result.sigmaSystem).toBe(sig);
    }
  });

  it('E-23: expand sets expandedFrom = core in meta', () => {
    const result = expand(seed, { system: 'cellular', domain: 'linguistics', sigmaSystem: 'deep' });
    expect(result.systemMeta.expandedFrom).toBe('core');
  });

  it('E-24: expand cellular has lattice size', () => {
    const result = expand(seed, { system: 'cellular', domain: 'natural-science', sigmaSystem: 'deep' });
    expect(result.systemMeta.latticeSize).toBe(8);
    expect(result.systemMeta.generations).toBe(0);
  });

  it('E-25: expand categorical has initial morphism count', () => {
    const result = expand(seed, { system: 'categorical', domain: 'natural-science', sigmaSystem: 'deep' });
    expect(result.systemMeta.morphismCount).toBe(0);
    expect(result.systemMeta.objectCount).toBe(1);
  });

  it('E-26: expand σ-extended deep attributes plus anti-attributes', () => {
    const result = expand(seed, { system: 'core', domain: 'natural-science', sigmaSystem: 'extended' });
    const keys = Object.keys(result.sigma).filter(k => !k.startsWith('_'));
    // 6 base + 6 anti = 12
    expect(keys.length).toBe(12);
  });

  it('E-27: expand σ-fluid has initial attribute count of 6', () => {
    const result = expand(seed, { system: 'core', domain: 'natural-science', sigmaSystem: 'fluid' });
    expect(result.sigma._attributeCount).toBe(6);
  });

  it('E-28: expand with payload=null creates fresh meta', () => {
    const freshSeed = createSeedRepr(10);
    expect(freshSeed.payload).toBeNull();
    const result = expand(freshSeed, { system: 'quantum', domain: 'art', sigmaSystem: 'deep' });
    expect(result.systemMeta.genesisSystem).toBe('quantum');
  });

  it('E-29: expand correctly sets domain on result', () => {
    for (const dom of ALL_DOMAINS) {
      const result = expand(seed, { system: 'core', domain: dom, sigmaSystem: 'deep' });
      expect(result.domain).toBe(dom);
    }
  });

  it('E-30: expand preserves seedValue in meta', () => {
    const result = expand(seed, { system: 'dialectical', domain: 'linguistics', sigmaSystem: 'deep' });
    expect(result.systemMeta.seedValue).toBe(42);
  });
});

// ============================================================
// 3. 双対性定理 DT-1〜DT-4 — 25テスト
// ============================================================

describe('Phase 7e: Duality Theorems', () => {

  // DT-1: compress ∘ expand = identity
  describe('DT-1 (compress ∘ expand = id)', () => {
    it('DT1-01: core/natural-science/deep', () => {
      const result = verifyDT1(createSeedRepr(42), { system: 'core', domain: 'natural-science', sigmaSystem: 'deep' });
      expect(result.holds).toBe(true);
    });

    it('DT1-02: quantum/music/extended', () => {
      const result = verifyDT1(createSeedRepr(7), { system: 'quantum', domain: 'music', sigmaSystem: 'extended' });
      expect(result.holds).toBe(true);
    });

    it('DT1-03: categorical/humanities/minimal', () => {
      const result = verifyDT1(createSeedRepr(0), { system: 'categorical', domain: 'humanities', sigmaSystem: 'minimal' });
      expect(result.holds).toBe(true);
    });

    it('DT1-04: cellular/art/fluid', () => {
      const result = verifyDT1(createSeedRepr(-50), { system: 'cellular', domain: 'art', sigmaSystem: 'fluid' });
      expect(result.holds).toBe(true);
    });

    it('DT1-05: dialectical/economics/deep', () => {
      const result = verifyDT1(createSeedRepr(999), { system: 'dialectical', domain: 'economics', sigmaSystem: 'deep' });
      expect(result.holds).toBe(true);
    });

    it('DT1-06: holds for all systems with seed=0', () => {
      for (const sys of ALL_GENESIS_SYSTEMS) {
        const result = verifyDT1(createSeedRepr(0), { system: sys, domain: 'natural-science', sigmaSystem: 'deep' });
        expect(result.holds).toBe(true);
      }
    });
  });

  // DT-2: expand ∘ compress ≈ identity
  describe('DT-2 (expand ∘ compress ≈ id)', () => {
    it('DT2-01: core deep repr roundtrips', () => {
      const repr = makeRepr(42, 'core', 'natural-science', 'deep');
      const result = verifyDT2(repr);
      expect(result.holds).toBe(true);
    });

    it('DT2-02: quantum extended repr roundtrips', () => {
      const repr = makeRepr(7, 'quantum', 'music', 'extended');
      const result = verifyDT2(repr);
      expect(result.holds).toBe(true);
    });

    it('DT2-03: categorical minimal repr roundtrips', () => {
      const repr = makeRepr(0, 'categorical', 'humanities', 'minimal');
      const result = verifyDT2(repr);
      expect(result.holds).toBe(true);
    });

    it('DT2-04: cellular fluid repr roundtrips', () => {
      const repr = makeRepr(-50, 'cellular', 'art', 'fluid');
      const result = verifyDT2(repr);
      expect(result.holds).toBe(true);
    });

    it('DT2-05: dialectical deep repr roundtrips', () => {
      const repr = makeRepr(999, 'dialectical', 'economics', 'deep');
      const result = verifyDT2(repr);
      expect(result.holds).toBe(true);
    });

    it('DT2-06: all system/domain combos roundtrip', () => {
      for (const sys of ALL_GENESIS_SYSTEMS) {
        for (const dom of ALL_DOMAINS) {
          const repr = makeRepr(42, sys, dom, 'deep');
          const result = verifyDT2(repr);
          expect(result.holds).toBe(true);
        }
      }
    });
  });

  // DT-3: density(compress(x)) = MAX ⟺ coverage(expand(x)) = MAX
  describe('DT-3 (μ-limit ⟺ M-limit)', () => {
    it('DT3-01: core deep repr satisfies dual limit', () => {
      const repr = makeRepr(42, 'core', 'natural-science', 'deep');
      const result = verifyDT3(repr);
      expect(result.holds).toBe(true);
    });

    it('DT3-02: quantum repr satisfies dual limit', () => {
      const repr = makeRepr(7, 'quantum', 'music', 'extended');
      const result = verifyDT3(repr);
      expect(result.holds).toBe(true);
    });

    it('DT3-03: dialectical repr satisfies dual limit', () => {
      const repr = makeRepr(-1, 'dialectical', 'economics', 'deep');
      const result = verifyDT3(repr);
      expect(result.holds).toBe(true);
    });

    it('DT3-04: all systems satisfy dual limit', () => {
      for (const sys of ALL_GENESIS_SYSTEMS) {
        const repr = makeRepr(42, sys, 'natural-science', 'deep');
        const result = verifyDT3(repr);
        expect(result.holds).toBe(true);
      }
    });
  });

  // DT-4: 0₀ = fixed-point = seed
  describe('DT-4 (0₀ = fixed-point)', () => {
    it('DT4-01: 0₀ is fixed point and seed', () => {
      const result = verifyDT4();
      expect(result.holds).toBe(true);
    });

    it('DT4-02: seed repr has zero value', () => {
      const seed = createSeedRepr(0);
      expect(seed.seed).toBe(0);
      expect(seed.zero.center).toBe(0);
      expect(seed.zero.periphery).toEqual([]);
    });

    it('DT4-03: seed can expand to every target', () => {
      const seed = createSeedRepr(0);
      for (const sys of ALL_GENESIS_SYSTEMS) {
        const result = expand(seed, { system: sys, domain: 'natural-science', sigmaSystem: 'deep' });
        expect(result.value).toBe(0);
      }
    });
  });
});

// ============================================================
// 4. 密度メトリクス — 20テスト
// ============================================================

describe('Phase 7e: Density Metrics', () => {

  it('D-01: CoreRepr is always irreducible', () => {
    const core = compress(makeRepr(42));
    const density = measureDensity(core);
    expect(density.isIrreducible).toBe(true);
  });

  it('D-02: SystemRepr is never irreducible', () => {
    const repr = makeRepr(42);
    const density = measureDensity(repr);
    expect(density.isIrreducible).toBe(false);
  });

  it('D-03: CoreRepr has representationSize = 4', () => {
    const core = compress(makeRepr(42));
    const density = measureDensity(core);
    expect(density.representationSize).toBe(4);
  });

  it('D-04: CoreRepr density > SystemRepr density (μ-Axiom-3)', () => {
    const repr = makeRepr(42, 'quantum', 'music', 'extended');
    const systemDensity = measureDensity(repr);
    const coreDensity = measureDensity(compress(repr));
    expect(coreDensity.density).toBeGreaterThan(systemDensity.density);
  });

  it('D-05: σ-minimal has smaller representation than σ-deep', () => {
    const minimal = makeRepr(42, 'core', 'natural-science', 'minimal');
    const deep = makeRepr(42, 'core', 'natural-science', 'deep');
    const minDensity = measureDensity(minimal);
    const deepDensity = measureDensity(deep);
    expect(minDensity.representationSize).toBeLessThan(deepDensity.representationSize);
  });

  it('D-06: σ-extended has larger representation than σ-deep', () => {
    const extended = makeRepr(42, 'core', 'natural-science', 'extended');
    const deep = makeRepr(42, 'core', 'natural-science', 'deep');
    const extDensity = measureDensity(extended);
    const deepDensity = measureDensity(deep);
    expect(extDensity.representationSize).toBeGreaterThan(deepDensity.representationSize);
  });

  it('D-07: compressionRatio < 1 for non-minimal σ', () => {
    const repr = makeRepr(42, 'core', 'natural-science', 'extended');
    const density = measureDensity(repr);
    expect(density.compressionRatio).toBeLessThan(1);
  });

  it('D-08: CoreRepr axiomUtilization = 1.0', () => {
    const core = compress(makeRepr(42));
    const density = measureDensity(core);
    expect(density.axiomUtilization).toBe(1.0);
  });

  it('D-09: informationContent > 0 for any repr', () => {
    const core = compress(makeRepr(42));
    const density = measureDensity(core);
    expect(density.informationContent).toBeGreaterThan(0);
  });

  it('D-10: density = informationContent / representationSize', () => {
    const core = compress(makeRepr(42));
    const d = measureDensity(core);
    expect(d.density).toBeCloseTo(d.informationContent / d.representationSize, 5);
  });

  it('D-11: density monotonicity across all systems (MB-P4)', () => {
    for (const sys of ALL_GENESIS_SYSTEMS) {
      const repr = makeRepr(42, sys, 'natural-science', 'deep');
      const result = verifyMBP4(repr);
      expect(result.holds).toBe(true);
    }
  });

  it('D-12: density monotonicity across all σ systems', () => {
    for (const sig of ALL_SIGMA_SYSTEMS) {
      const repr = makeRepr(42, 'core', 'natural-science', sig);
      const result = verifyMBP4(repr);
      expect(result.holds).toBe(true);
    }
  });

  it('D-13: density hierarchy: extended < deep < minimal (by representation size)', () => {
    const ext = measureDensity(makeRepr(42, 'core', 'natural-science', 'extended'));
    const deep = measureDensity(makeRepr(42, 'core', 'natural-science', 'deep'));
    const min = measureDensity(makeRepr(42, 'core', 'natural-science', 'minimal'));
    expect(ext.representationSize).toBeGreaterThan(deep.representationSize);
    expect(deep.representationSize).toBeGreaterThan(min.representationSize);
  });

  it('D-14: axiomUtilization for empty sigma is partial', () => {
    const repr: SystemRepr = {
      reiType: 'SystemRepr', system: 'core', domain: 'natural-science',
      sigmaSystem: 'deep', value: 42, sigma: {}, systemMeta: {},
    };
    const density = measureDensity(repr);
    expect(density.axiomUtilization).toBeLessThan(1.0);
    expect(density.axiomUtilization).toBeGreaterThan(0); // at least A1 and A4
  });

  it('D-15: axiomUtilization for rich sigma is high', () => {
    const repr = makeRepr(42, 'core', 'natural-science', 'deep', {
      field: { center: 42, neighbors: [1, 2] },
      flow: { velocity: 1 },
      memory: [{ value: 41 }],
      layer: { depth: 2 },
      relation: { refs: ['a'] },
      will: { tendency: 'expand' },
    });
    const density = measureDensity(repr);
    expect(density.axiomUtilization).toBe(1.0);
  });

  it('D-16: large value does not break density calculation', () => {
    const repr = makeRepr(Number.MAX_SAFE_INTEGER, 'quantum', 'music', 'extended');
    expect(() => measureDensity(repr)).not.toThrow();
  });

  it('D-17: zero value density is valid', () => {
    const repr = makeRepr(0);
    const density = measureDensity(repr);
    expect(density.density).toBeGreaterThan(0);
  });

  it('D-18: negative value density is valid', () => {
    const repr = makeRepr(-999);
    const density = measureDensity(repr);
    expect(density.density).toBeGreaterThan(0);
  });

  it('D-19: compressed then measured = irreducible', () => {
    for (const sys of ALL_GENESIS_SYSTEMS) {
      const core = compress(makeRepr(42, sys));
      expect(measureDensity(core).isIrreducible).toBe(true);
    }
  });

  it('D-20: density is deterministic', () => {
    const repr = makeRepr(42, 'quantum', 'music', 'deep');
    const d1 = measureDensity(repr);
    const d2 = measureDensity(repr);
    expect(d1.density).toBe(d2.density);
  });
});

// ============================================================
// 5. 被覆メトリクス — 15テスト
// ============================================================

describe('Phase 7e: Coverage Metrics', () => {

  it('V-01: theoretical maximum = 140', () => {
    expect(THEORETICAL_MAXIMUM).toBe(140);
  });

  it('V-02: full coverage with default seed', () => {
    const coverage = measureCoverage();
    expect(coverage.coverageRatio).toBe(1.0);
  });

  it('V-03: no unreachable cells', () => {
    const coverage = measureCoverage();
    expect(coverage.unreachable).toEqual([]);
  });

  it('V-04: reachable systems = 5', () => {
    const coverage = measureCoverage();
    expect(coverage.reachableSystems).toBe(5);
  });

  it('V-05: reachable domains = 7', () => {
    const coverage = measureCoverage();
    expect(coverage.reachableDomains).toBe(7);
  });

  it('V-06: reachable sigmas = 4', () => {
    const coverage = measureCoverage();
    expect(coverage.reachableSigmas).toBe(4);
  });

  it('V-07: totalReachableSpace = 140', () => {
    const coverage = measureCoverage();
    expect(coverage.totalReachableSpace).toBe(140);
  });

  it('V-08: coverage with specific seed repr', () => {
    const seed = createSeedRepr(42);
    const coverage = measureCoverage(seed);
    expect(coverage.coverageRatio).toBe(1.0);
  });

  it('V-09: coverage with zero seed', () => {
    const seed = createSeedRepr(0);
    const coverage = measureCoverage(seed);
    expect(coverage.coverageRatio).toBe(1.0);
  });

  it('V-10: coverage with negative seed', () => {
    const seed = createSeedRepr(-999);
    const coverage = measureCoverage(seed);
    expect(coverage.coverageRatio).toBe(1.0);
  });

  it('V-11: MB-P5 holds (coverage completeness)', () => {
    const result = verifyMBP5();
    expect(result.holds).toBe(true);
  });

  it('V-12: ALL_GENESIS_SYSTEMS has 5 entries', () => {
    expect(ALL_GENESIS_SYSTEMS.length).toBe(5);
  });

  it('V-13: ALL_DOMAINS has 7 entries', () => {
    expect(ALL_DOMAINS.length).toBe(7);
  });

  it('V-14: ALL_SIGMA_SYSTEMS has 4 entries', () => {
    expect(ALL_SIGMA_SYSTEMS.length).toBe(4);
  });

  it('V-15: 5 × 7 × 4 = 140', () => {
    expect(ALL_GENESIS_SYSTEMS.length * ALL_DOMAINS.length * ALL_SIGMA_SYSTEMS.length).toBe(140);
  });
});

// ============================================================
// 6. MetaBridge 翻訳 — 20テスト
// ============================================================

describe('Phase 7e: MetaBridge Translation', () => {

  it('B-01: core→quantum bridge preserves value', () => {
    const bridge = createMetaBridge('core', 'quantum');
    const repr = makeRepr(42, 'core', 'natural-science', 'deep');
    const result = bridge.translate(repr);
    expect(result.value).toBe(42);
    expect(result.system).toBe('quantum');
  });

  it('B-02: quantum→categorical bridge preserves value', () => {
    const bridge = createMetaBridge('quantum', 'categorical');
    const repr = makeRepr(7, 'quantum', 'music', 'deep');
    const result = bridge.translate(repr);
    expect(result.value).toBe(7);
    expect(result.system).toBe('categorical');
  });

  it('B-03: dialectical→cellular bridge', () => {
    const bridge = createMetaBridge('dialectical', 'cellular');
    const repr = makeRepr(-5, 'dialectical', 'economics', 'deep');
    const result = bridge.translate(repr);
    expect(result.value).toBe(-5);
    expect(result.system).toBe('cellular');
  });

  it('B-04: self-bridge (core→core) = identity-like', () => {
    const bridge = createMetaBridge('core', 'core');
    const repr = makeRepr(42, 'core', 'art', 'deep');
    const result = bridge.translate(repr);
    expect(result.value).toBe(42);
    expect(result.system).toBe('core');
  });

  it('B-05: createAllBridges creates 20 bridges', () => {
    const bridges = createAllBridges();
    expect(bridges.length).toBe(20);
  });

  it('B-06: all bridge pairs have unique ids', () => {
    const bridges = createAllBridges();
    const ids = bridges.map(b => b.id);
    expect(new Set(ids).size).toBe(20);
  });

  it('B-07: MB-P1 (computational equivalence) for all bridges', () => {
    const bridges = createAllBridges();
    const repr = makeRepr(42, 'core', 'natural-science', 'deep');
    for (const bridge of bridges) {
      const inputRepr = makeRepr(42, bridge.source, 'natural-science', 'deep');
      const result = verifyMBP1(bridge, inputRepr);
      expect(result.holds).toBe(true);
    }
  });

  it('B-08: bridge id format for core↔alt', () => {
    const bridge = createMetaBridge('core', 'quantum');
    expect(bridge.id).toBe('MB-αC');
  });

  it('B-09: bridge id format for alt→core', () => {
    const bridge = createMetaBridge('quantum', 'core');
    expect(bridge.id).toBe('MB-Cα');
  });

  it('B-10: bridge id format for alt↔alt', () => {
    const bridge = createMetaBridge('quantum', 'categorical');
    expect(bridge.id).toBe('MB-αβ');
  });

  it('B-11: bridge preserves domain through translation', () => {
    const bridge = createMetaBridge('core', 'dialectical');
    const repr = makeRepr(42, 'core', 'music', 'deep');
    const result = bridge.translate(repr);
    expect(result.domain).toBe('music');
  });

  it('B-12: bridge preserves sigmaSystem through translation', () => {
    const bridge = createMetaBridge('quantum', 'cellular');
    const repr = makeRepr(42, 'quantum', 'art', 'extended');
    const result = bridge.translate(repr);
    expect(result.sigmaSystem).toBe('extended');
  });

  it('B-13: bridge.measureDensityOf works', () => {
    const bridge = createMetaBridge('core', 'quantum');
    const repr = makeRepr(42);
    const density = bridge.measureDensityOf(repr);
    expect(density.density).toBeGreaterThan(0);
  });

  it('B-14: chaining two bridges = direct bridge', () => {
    const ab = createMetaBridge('core', 'quantum');
    const bc = createMetaBridge('quantum', 'categorical');
    const ac = createMetaBridge('core', 'categorical');

    const repr = makeRepr(42, 'core', 'natural-science', 'deep');
    const chained = bc.translate(ab.translate(repr));
    const direct = ac.translate(repr);

    expect(chained.value).toBe(direct.value);
    expect(chained.system).toBe(direct.system);
  });

  it('B-15: all 10 bridge pairs have bidirectional coverage', () => {
    const bridges = createAllBridges();
    const pairSet = new Set<string>();
    for (const b of bridges) {
      pairSet.add(`${b.source}→${b.target}`);
    }
    // For each forward, there should be a reverse
    for (const b of bridges) {
      expect(pairSet.has(`${b.target}→${b.source}`)).toBe(true);
    }
  });

  it('B-16: bridge with zero value', () => {
    const bridge = createMetaBridge('core', 'quantum');
    const repr = makeRepr(0, 'core');
    const result = bridge.translate(repr);
    expect(result.value).toBe(0);
  });

  it('B-17: bridge with negative value', () => {
    const bridge = createMetaBridge('core', 'dialectical');
    const repr = makeRepr(-42, 'core');
    const result = bridge.translate(repr);
    expect(result.value).toBe(-42);
  });

  it('B-18: bridge with large value', () => {
    const bridge = createMetaBridge('quantum', 'cellular');
    const repr = makeRepr(Number.MAX_SAFE_INTEGER, 'quantum');
    const result = bridge.translate(repr);
    expect(result.value).toBe(Number.MAX_SAFE_INTEGER);
  });

  it('B-19: bridge translation is deterministic', () => {
    const bridge = createMetaBridge('core', 'quantum');
    const repr = makeRepr(42, 'core');
    const r1 = bridge.translate(repr);
    const r2 = bridge.translate(repr);
    expect(r1.value).toBe(r2.value);
    expect(r1.system).toBe(r2.system);
  });

  it('B-20: all bridges translate every domain', () => {
    const bridge = createMetaBridge('core', 'quantum');
    for (const dom of ALL_DOMAINS) {
      const repr = makeRepr(42, 'core', dom, 'deep');
      const result = bridge.translate(repr);
      expect(result.value).toBe(42);
      expect(result.domain).toBe(dom);
    }
  });
});

// ============================================================
// 7. ダイヤモンド7結晶モデル — 10テスト
// ============================================================

describe('Phase 7e: Diamond 7 Crystal Model', () => {

  it('♦-01: creates 7 crystals', () => {
    const d7 = createDiamond7();
    expect(d7.crystals.length).toBe(7);
  });

  it('♦-02: each crystal has unique domain', () => {
    const d7 = createDiamond7();
    const domains = d7.crystals.map(c => c.domain);
    expect(new Set(domains).size).toBe(7);
  });

  it('♦-03: each crystal has correct label', () => {
    const d7 = createDiamond7();
    const labels = d7.crystals.map(c => c.label).sort();
    expect(labels).toEqual(['B', 'C', 'D', 'E', 'F', 'G', 'H']);
  });

  it('♦-04: each crystal is irreducible (ダイヤモンド密度)', () => {
    const d7 = createDiamond7();
    for (const crystal of d7.crystals) {
      expect(crystal.densityMetric.isIrreducible).toBe(true);
    }
  });

  it('♦-05: each crystal can reach all 5 systems', () => {
    const d7 = createDiamond7();
    for (const crystal of d7.crystals) {
      expect(crystal.reachableSystems.length).toBe(5);
    }
  });

  it('♦-06: total coverage = 1.0', () => {
    const d7 = createDiamond7();
    expect(d7.totalCoverage.coverageRatio).toBe(1.0);
  });

  it('♦-07: total density > 0', () => {
    const d7 = createDiamond7();
    expect(d7.totalDensity).toBeGreaterThan(0);
  });

  it('♦-08: core seed is 0₀ (zero)', () => {
    const d7 = createDiamond7(0);
    expect(d7.core.seed).toBe(0);
    expect(d7.core.zero.center).toBe(0);
  });

  it('♦-09: custom seed value propagates', () => {
    const d7 = createDiamond7(42);
    expect(d7.core.seed).toBe(42);
  });

  it('♦-10: diamond model with no unreachable cells', () => {
    const d7 = createDiamond7();
    expect(d7.totalCoverage.unreachable).toEqual([]);
  });
});
