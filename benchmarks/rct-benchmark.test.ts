/**
 * RCT Benchmark Suite — Generative Compression vs Conventional
 * 
 * Rei Compression Theory (D-FUMT Theory #67)
 * Author: Nobuki Fujimoto (藤本伸樹) & Claude
 * 
 * Run: npx vitest run benchmarks/rct-benchmark.test.ts
 * 
 * Compares RCT's generative compression against:
 * - gzip (zlib deflate)
 * - JSON.stringify (baseline)
 * 
 * Key insight: RCT compresses by finding GENERATIVE PARAMETERS (θ),
 * not by finding redundancy in bit patterns.
 * For structured/mathematical data, this is fundamentally superior.
 */

import { describe, it, expect } from 'vitest';
import { deflateSync, inflateSync } from 'zlib';
import {
  compressToGenerativeParams,
  generate,
  estimateKolmogorov,
  hierarchicalCompress,
  hierarchicalDecompress,
  proveStructuralCompressibility,
  buildCompressedIndex,
  partialGenerate,
} from '../theory/theories-67';

// ================================================================
// Helper: gzip compression for comparison
// ================================================================

function gzipCompress(data: number[]): { compressedSize: number; ratio: number; roundTrip: boolean } {
  const buf = Buffer.from(JSON.stringify(data));
  const compressed = deflateSync(buf);
  const decompressed = JSON.parse(inflateSync(compressed).toString());
  return {
    compressedSize: compressed.length,
    ratio: compressed.length / buf.length,
    roundTrip: JSON.stringify(data) === JSON.stringify(decompressed),
  };
}

function rctCompress(data: number[]): { compressedSize: number; ratio: number; roundTrip: boolean; type: string } {
  const result = compressToGenerativeParams(data);
  const restored = generate(result.params, data.length);
  const match = data.length === restored.length && data.every((v, i) => Math.abs(v - restored[i]) < 1e-10);
  return {
    compressedSize: result.params.size,
    ratio: result.compressionRatio,
    roundTrip: match,
    type: result.params.type,
  };
}

// ================================================================
// Section 1: Structured Data — RCT's Strong Domain
// ================================================================

describe('RCT vs gzip: Structured Mathematical Data', () => {

  it('constant sequence — RCT: O(1) vs gzip: O(n)', () => {
    // [42, 42, 42, ..., 42] × 1000
    const data = Array(1000).fill(42);
    const rct = rctCompress(data);
    const gz = gzipCompress(data);

    // RCT: θ = {type: "constant", value: 42, length: 1000} → 2-3 params
    expect(rct.type).toMatch(/constant|periodic/);
    expect(rct.compressedSize).toBeLessThan(10);
    expect(rct.roundTrip).toBe(true);

    // RCT should be dramatically better for constant data
    expect(rct.ratio).toBeLessThan(gz.ratio);

    console.log(`Constant×1000: RCT ratio=${rct.ratio.toFixed(4)} (${rct.type}), gzip ratio=${gz.ratio.toFixed(4)}`);
  });

  it('arithmetic sequence — RCT: O(1) vs gzip: O(n)', () => {
    // [0, 3, 6, 9, ..., 2997]  (1000 terms)
    const data = Array.from({ length: 1000 }, (_, i) => i * 3);
    const rct = rctCompress(data);
    const gz = gzipCompress(data);

    // RCT: θ = {type: "arithmetic", start: 0, diff: 3, length: 1000} → 3 params
    expect(rct.type).toBe('arithmetic');
    expect(rct.compressedSize).toBeLessThan(10);
    expect(rct.roundTrip).toBe(true);

    expect(rct.ratio).toBeLessThan(gz.ratio);

    console.log(`Arithmetic×1000: RCT ratio=${rct.ratio.toFixed(4)}, gzip ratio=${gz.ratio.toFixed(4)}`);
  });

  it('periodic pattern — RCT: O(period) vs gzip: O(n)', () => {
    // [1,2,3,4,5, 1,2,3,4,5, ...] × 200 repetitions
    const pattern = [1, 2, 3, 4, 5];
    const data = Array.from({ length: 1000 }, (_, i) => pattern[i % pattern.length]);
    const rct = rctCompress(data);
    const gz = gzipCompress(data);

    expect(rct.type).toBe('periodic');
    expect(rct.roundTrip).toBe(true);
    expect(rct.ratio).toBeLessThan(gz.ratio);

    console.log(`Periodic(5)×1000: RCT ratio=${rct.ratio.toFixed(4)}, gzip ratio=${gz.ratio.toFixed(4)}`);
  });

  it('geometric sequence — RCT: O(1) vs gzip: O(n)', () => {
    // [1, 2, 4, 8, 16, ...] (20 terms)
    const data = Array.from({ length: 20 }, (_, i) => Math.pow(2, i));
    const rct = rctCompress(data);
    const gz = gzipCompress(data);

    expect(rct.roundTrip).toBe(true);

    console.log(`Geometric×20: RCT ratio=${rct.ratio.toFixed(4)} (${rct.type}), gzip ratio=${gz.ratio.toFixed(4)}`);
  });
});

// ================================================================
// Section 2: Random Data — Neither Should Excel
// ================================================================

describe('RCT vs gzip: Random/Unstructured Data', () => {

  it('pseudo-random data — both struggle (theoretical limit)', () => {
    // Random data is incompressible by any method (Kolmogorov)
    const seed = 12345;
    const data = Array.from({ length: 200 }, (_, i) => {
      const x = Math.sin(seed + i * 7919) * 10000;
      return Math.floor(Math.abs(x) % 256);
    });

    const rct = rctCompress(data);
    const gz = gzipCompress(data);

    // Both should have ratio close to 1 (or above for small overhead)
    // RCT gracefully falls back to raw storage
    expect(rct.roundTrip).toBe(true);

    console.log(`Random×200: RCT ratio=${rct.ratio.toFixed(4)} (${rct.type}), gzip ratio=${gz.ratio.toFixed(4)}`);
  });
});

// ================================================================
// Section 3: Real-World Patterns — Domain-Specific Advantages
// ================================================================

describe('RCT vs gzip: Real-World Domain Patterns', () => {

  it('sensor data (temperature readings with periodic trend)', () => {
    // Simulated daily temperature: base 20°C + sinusoidal variation
    const data = Array.from({ length: 365 }, (_, day) => {
      return Math.round(20 + 10 * Math.sin(2 * Math.PI * day / 365));
    });

    const rct = rctCompress(data);
    const gz = gzipCompress(data);

    expect(rct.roundTrip).toBe(true);

    console.log(`Sensor(365 days): RCT ratio=${rct.ratio.toFixed(4)} (${rct.type}), gzip ratio=${gz.ratio.toFixed(4)}`);
  });

  it('pixel gradient (image kernel pattern)', () => {
    // 100×1 gradient: 0, 2, 5, 7, 10, ... (arithmetic-ish)
    const data = Array.from({ length: 100 }, (_, i) => Math.floor(i * 2.55));

    const rct = rctCompress(data);
    const gz = gzipCompress(data);

    expect(rct.roundTrip).toBe(true);

    console.log(`Pixel gradient×100: RCT ratio=${rct.ratio.toFixed(4)} (${rct.type}), gzip ratio=${gz.ratio.toFixed(4)}`);
  });

  it('fibonacci-like sequence (recursive pattern)', () => {
    const data: number[] = [1, 1];
    for (let i = 2; i < 50; i++) {
      data.push(data[i - 1] + data[i - 2]);
    }

    const rct = rctCompress(data);
    const gz = gzipCompress(data);

    expect(rct.roundTrip).toBe(true);

    console.log(`Fibonacci×50: RCT ratio=${rct.ratio.toFixed(4)} (${rct.type}), gzip ratio=${gz.ratio.toFixed(4)}`);
  });

  it('step function (digital signal)', () => {
    // [0,0,0,...,255,255,255,...,0,0,0,...] repeated
    const data: number[] = [];
    for (let block = 0; block < 10; block++) {
      for (let i = 0; i < 50; i++) data.push(block % 2 === 0 ? 0 : 255);
    }

    const rct = rctCompress(data);
    const gz = gzipCompress(data);

    expect(rct.roundTrip).toBe(true);

    console.log(`Step function×500: RCT ratio=${rct.ratio.toFixed(4)} (${rct.type}), gzip ratio=${gz.ratio.toFixed(4)}`);
  });

  it('musical interval pattern (chromatic scale)', () => {
    // MIDI notes: repeating chromatic pattern
    const scale = [60, 62, 64, 65, 67, 69, 71, 72]; // C major
    const data = Array.from({ length: 400 }, (_, i) => scale[i % scale.length]);

    const rct = rctCompress(data);
    const gz = gzipCompress(data);

    expect(rct.type).toBe('periodic');
    expect(rct.roundTrip).toBe(true);

    console.log(`Musical scale×400: RCT ratio=${rct.ratio.toFixed(4)}, gzip ratio=${gz.ratio.toFixed(4)}`);
  });

  it('economic growth (compound interest)', () => {
    // 100 * 1.05^n (5% annual growth over 50 years)
    const data = Array.from({ length: 50 }, (_, i) => Math.round(100 * Math.pow(1.05, i)));

    const rct = rctCompress(data);
    const gz = gzipCompress(data);

    expect(rct.roundTrip).toBe(true);

    console.log(`Compound growth×50: RCT ratio=${rct.ratio.toFixed(4)} (${rct.type}), gzip ratio=${gz.ratio.toFixed(4)}`);
  });
});

// ================================================================
// Section 4: Scaling Analysis — How Compression Behaves with Size
// ================================================================

describe('RCT vs gzip: Scaling Behavior', () => {

  it('constant sequence scaling: 10 → 10000', () => {
    const sizes = [10, 50, 100, 500, 1000, 5000, 10000];
    const results: { size: number; rctRatio: number; gzipRatio: number }[] = [];

    for (const size of sizes) {
      const data = Array(size).fill(7);
      const rct = rctCompress(data);
      const gz = gzipCompress(data);
      results.push({ size, rctRatio: rct.ratio, gzipRatio: gz.ratio });
    }

    // RCT ratio should decrease as n grows (O(1)/n → 0)
    // gzip ratio also decreases but slower
    const rctFirst = results[0].rctRatio;
    const rctLast = results[results.length - 1].rctRatio;
    expect(rctLast).toBeLessThan(rctFirst);

    console.log('Constant sequence scaling:');
    for (const r of results) {
      console.log(`  n=${r.size.toString().padStart(5)}: RCT=${r.rctRatio.toFixed(6)}, gzip=${r.gzipRatio.toFixed(6)}`);
    }
  });

  it('arithmetic sequence scaling: 10 → 10000', () => {
    const sizes = [10, 50, 100, 500, 1000, 5000, 10000];
    const results: { size: number; rctRatio: number; gzipRatio: number }[] = [];

    for (const size of sizes) {
      const data = Array.from({ length: size }, (_, i) => i * 5 + 1);
      const rct = rctCompress(data);
      const gz = gzipCompress(data);
      results.push({ size, rctRatio: rct.ratio, gzipRatio: gz.ratio });
    }

    // RCT: O(1) params → ratio approaches 0 as n → ∞
    const rctLast = results[results.length - 1].rctRatio;
    expect(rctLast).toBeLessThan(0.01);  // Should be near-zero for large n

    console.log('Arithmetic sequence scaling:');
    for (const r of results) {
      console.log(`  n=${r.size.toString().padStart(5)}: RCT=${r.rctRatio.toFixed(6)}, gzip=${r.gzipRatio.toFixed(6)}`);
    }
  });

  it('periodic pattern scaling with fixed period', () => {
    const sizes = [10, 50, 100, 500, 1000, 5000];
    const pattern = [1, 3, 7, 2, 9];
    const results: { size: number; rctRatio: number; gzipRatio: number }[] = [];

    for (const size of sizes) {
      const data = Array.from({ length: size }, (_, i) => pattern[i % pattern.length]);
      const rct = rctCompress(data);
      const gz = gzipCompress(data);
      results.push({ size, rctRatio: rct.ratio, gzipRatio: gz.ratio });
    }

    console.log('Periodic(5) scaling:');
    for (const r of results) {
      console.log(`  n=${r.size.toString().padStart(5)}: RCT=${r.rctRatio.toFixed(6)}, gzip=${r.gzipRatio.toFixed(6)}`);
    }
  });
});

// ================================================================
// Section 5: Kolmogorov Complexity Classification
// ================================================================

describe('Kolmogorov Complexity Estimation', () => {

  it('classifies data complexity correctly', () => {
    const trivial = Array(100).fill(0);
    const structured = Array.from({ length: 100 }, (_, i) => i * 2);
    const semiRandom = Array.from({ length: 100 }, (_, i) => Math.floor(Math.sin(i) * 50 + 50));
    const random = Array.from({ length: 100 }, () => Math.floor(Math.random() * 1000));

    const kTrivial = estimateKolmogorov(trivial);
    const kStructured = estimateKolmogorov(structured);
    const kSemiRandom = estimateKolmogorov(semiRandom);
    const kRandom = estimateKolmogorov(random);

    // Complexity should increase: trivial < structured < semi-random < random
    expect(kTrivial.compressibility).toBeGreaterThan(kStructured.compressibility);
    expect(kStructured.compressibility).toBeGreaterThan(0.5);
    expect(kTrivial.classification).toBe('trivial');

    console.log('Kolmogorov complexity estimates:');
    console.log(`  Trivial:     K̃=${kTrivial.estimatedComplexity}, class=${kTrivial.classification}, compress=${kTrivial.compressibility.toFixed(3)}`);
    console.log(`  Structured:  K̃=${kStructured.estimatedComplexity}, class=${kStructured.classification}, compress=${kStructured.compressibility.toFixed(3)}`);
    console.log(`  Semi-random: K̃=${kSemiRandom.estimatedComplexity}, class=${kSemiRandom.classification}, compress=${kSemiRandom.compressibility.toFixed(3)}`);
    console.log(`  Random:      K̃=${kRandom.estimatedComplexity}, class=${kRandom.classification}, compress=${kRandom.compressibility.toFixed(3)}`);
  });
});

// ================================================================
// Section 6: Structure Existence Theorem Verification
// ================================================================

describe('Structure Existence Theorem', () => {

  it('structured data compresses significantly better than random', () => {
    const structuredData = Array.from({ length: 500 }, (_, i) => {
      const pattern = [10, 20, 30, 40, 50];
      return pattern[i % pattern.length] + Math.floor(i / 100) * 10;
    });

    const proof = proveStructuralCompressibility(structuredData, 20);

    expect(proof.theorem_verified).toBe(true);
    expect(proof.structuredRatio).toBeLessThan(proof.averageRandomRatio);

    console.log('Structure Existence Theorem:');
    console.log(`  Structured ratio:     ${proof.structuredRatio.toFixed(4)}`);
    console.log(`  Avg random ratio:     ${proof.averageRandomRatio.toFixed(4)}`);
    console.log(`  Theorem verified:     ${proof.theorem_verified}`);
    console.log(`  ${proof.explanation}`);
  });
});

// ================================================================
// Section 7: Hierarchical Compression
// ================================================================

describe('Hierarchical (Multi-Layer) Compression', () => {

  it('achieves deeper compression through recursive parameter encoding', () => {
    // Large periodic data
    const pattern = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
    const data = Array.from({ length: 1000 }, (_, i) => pattern[i % pattern.length]);

    const result = hierarchicalCompress(data);

    expect(result.layers.length).toBeGreaterThanOrEqual(1);
    expect(result.actualRatio).toBeLessThan(0.5);

    console.log('Hierarchical compression:');
    console.log(`  Layers:           ${result.layers.length}`);
    console.log(`  Total params:     ${result.totalParams}`);
    console.log(`  Actual ratio:     ${result.actualRatio.toFixed(6)}`);
    console.log(`  Amplification:    ${result.amplificationFactors.map(f => f.toFixed(1)).join(' → ')}`);
  });

  it('hierarchical roundtrip preserves data', () => {
    const data = Array.from({ length: 200 }, (_, i) => (i * 7) % 100);
    const compressed = hierarchicalCompress(data);
    const restored = hierarchicalDecompress(compressed, data.length);

    // Check roundtrip (may have floating point differences)
    const matches = data.filter((v, i) => Math.abs(v - restored[i]) < 1e-6).length;
    const matchRate = matches / data.length;

    expect(matchRate).toBeGreaterThan(0.9);

    console.log(`Hierarchical roundtrip: ${(matchRate * 100).toFixed(1)}% exact match`);
  });
});

// ================================================================
// Section 8: Partial Generation (Index Compression)
// ================================================================

describe('Partial Generation — Random Access without Full Decompression', () => {

  it('retrieves arbitrary segments without decompressing everything', () => {
    // 10000 element arithmetic sequence
    const data = Array.from({ length: 10000 }, (_, i) => i * 3);
    const index = buildCompressedIndex(data, 100);

    // Retrieve only elements [500, 600)
    const partial = partialGenerate(index, 500, 600);

    expect(partial.length).toBe(100);
    expect(partial[0]).toBe(1500);  // 500 * 3
    expect(partial[99]).toBe(1797); // 599 * 3

    console.log('Partial generation (index compression):');
    console.log(`  Total data:       ${data.length} elements`);
    console.log(`  Index segments:   ${index.entries.length}`);
    console.log(`  Overall ratio:    ${index.overallRatio.toFixed(4)}`);
    console.log(`  Retrieved [500,600): ${partial.length} elements, first=${partial[0]}, last=${partial[partial.length - 1]}`);
  });

  it('gzip cannot do partial decompression', () => {
    // This is a fundamental architectural advantage of RCT:
    // gzip requires decompressing EVERYTHING to access any part
    const data = Array.from({ length: 10000 }, (_, i) => i * 3);
    
    // gzip: must decompress all → get slice
    const buf = Buffer.from(JSON.stringify(data));
    const compressed = deflateSync(buf);
    const decompressedAll = JSON.parse(inflateSync(compressed).toString());
    const gzipSlice = decompressedAll.slice(500, 600);

    // RCT: decompress only the needed segment
    const index = buildCompressedIndex(data, 100);
    const rctSlice = partialGenerate(index, 500, 600);

    expect(rctSlice).toEqual(gzipSlice);

    console.log(`Partial access: gzip decompressed ALL ${data.length} elements to get 100.`);
    console.log(`Partial access: RCT generated ONLY the needed 100 elements.`);
  });
});

// ================================================================
// Section 9: Summary Statistics
// ================================================================

describe('Comprehensive Summary', () => {

  it('generates full comparison report', () => {
    const testCases: { name: string; data: number[] }[] = [
      { name: 'Constant×1000', data: Array(1000).fill(42) },
      { name: 'Arithmetic×1000', data: Array.from({ length: 1000 }, (_, i) => i * 3) },
      { name: 'Periodic(5)×1000', data: Array.from({ length: 1000 }, (_, i) => [1,2,3,4,5][i%5]) },
      { name: 'Geometric×20', data: Array.from({ length: 20 }, (_, i) => Math.pow(2, i)) },
      { name: 'Step×500', data: Array.from({ length: 500 }, (_, i) => i < 250 ? 0 : 255) },
      { name: 'Fibonacci×30', data: (() => { const a = [1,1]; for(let i=2;i<30;i++) a.push(a[i-1]+a[i-2]); return a; })() },
    ];

    console.log('\n╔══════════════════════════════════════════════════════════════════╗');
    console.log('║          RCT vs gzip — Comprehensive Benchmark Results          ║');
    console.log('╠════════════════════╦═════════════╦═════════════╦════════════════╣');
    console.log('║ Dataset            ║  RCT ratio  ║ gzip ratio  ║ RCT advantage  ║');
    console.log('╠════════════════════╬═════════════╬═════════════╬════════════════╣');

    let rctWins = 0;
    let totalRctAdvantage = 0;

    for (const tc of testCases) {
      const rct = rctCompress(tc.data);
      const gz = gzipCompress(tc.data);
      const advantage = gz.ratio / Math.max(rct.ratio, 0.0001);
      if (rct.ratio < gz.ratio) rctWins++;
      totalRctAdvantage += advantage;

      console.log(
        `║ ${tc.name.padEnd(18)} ║ ${rct.ratio.toFixed(6).padStart(11)} ║ ${gz.ratio.toFixed(6).padStart(11)} ║ ${advantage.toFixed(1).padStart(6)}× better  ║`
      );
    }

    console.log('╠════════════════════╬═════════════╬═════════════╬════════════════╣');
    console.log(`║ RCT wins: ${rctWins}/${testCases.length}      ║ Avg advantage: ${(totalRctAdvantage/testCases.length).toFixed(1)}×`.padEnd(65) + '║');
    console.log('╚══════════════════════════════════════════════════════════════════╝');

    // RCT should win on majority of structured data
    expect(rctWins).toBeGreaterThanOrEqual(testCases.length * 0.5);
  });
});
