// ============================================================
// Rei (0₀式) stdlib Tier 2 — Test Suite
// network, chrono, transform, holograph
// ============================================================
// Run: npx vitest run tests/stdlib-tier2.test.ts
// ============================================================

import { describe, it, expect } from 'vitest';
import * as network from '../src/stdlib/network';
import * as chrono from '../src/stdlib/chrono';
import * as transform from '../src/stdlib/transform';
import * as holograph from '../src/stdlib/holograph';

// ============================================================
// network tests
// ============================================================
describe('network', () => {
  // --- Construction ---
  it('creates a graph from nodes', () => {
    const g = network.createGraph([
      { center: 5, neighbors: [1, 2] },
      { center: 3, neighbors: [4] },
      { center: 7, neighbors: [2, 5] },
    ]);
    expect(g.nodes.length).toBe(3);
    expect(g.nodes[0].center).toBe(5);
    expect(g.directed).toBe(false);
  });

  it('creates from adjacency matrix', () => {
    const g = network.fromAdjacency([
      [0, 1, 0],
      [1, 0, 2],
      [0, 2, 0],
    ]);
    expect(g.nodes.length).toBe(3);
    expect(g.edges.length).toBeGreaterThan(0);
  });

  it('converts to adjacency matrix', () => {
    const g = network.fromAdjacency([
      [0, 1, 3],
      [1, 0, 2],
      [3, 2, 0],
    ]);
    const adj = network.toAdjacency(g);
    expect(adj[0][1]).toBe(1);
    expect(adj[1][2]).toBe(2);
    expect(adj[0][2]).toBe(3);
  });

  it('adds nodes and edges', () => {
    let g = network.createGraph([{ center: 1 }, { center: 2 }]);
    g = network.addNode(g, { center: 3 });
    expect(g.nodes.length).toBe(3);
    g = network.addEdge(g, 0, 2, 5);
    expect(g.edges.some(e => e.source === 0 && e.target === 2 && e.weight === 5)).toBe(true);
  });

  // --- Analysis ---
  it('computes degree', () => {
    const g = network.fromAdjacency([
      [0, 1, 1],
      [1, 0, 0],
      [1, 0, 0],
    ]);
    const d = network.degree(g, 0);
    expect(d.total).toBeGreaterThanOrEqual(2);
  });

  it('finds neighbors', () => {
    const g = network.fromAdjacency([
      [0, 1, 0, 1],
      [1, 0, 1, 0],
      [0, 1, 0, 0],
      [1, 0, 0, 0],
    ]);
    const nb = network.getNeighbors(g, 0);
    expect(nb).toContain(1);
    expect(nb).toContain(3);
  });

  it('shortest path (Dijkstra)', () => {
    const g = network.fromAdjacency([
      [0, 1, 0, 0],
      [1, 0, 2, 0],
      [0, 2, 0, 3],
      [0, 0, 3, 0],
    ]);
    const sp = network.shortestPath(g, 0, 3);
    expect(sp.path[0]).toBe(0);
    expect(sp.path[sp.path.length - 1]).toBe(3);
    expect(sp.distance).toBe(6);  // 0→1(1) + 1→2(2) + 2→3(3)
  });

  it('detects connectivity', () => {
    const connected = network.fromAdjacency([
      [0, 1, 0],
      [1, 0, 1],
      [0, 1, 0],
    ]);
    expect(network.connected(connected)).toBe(true);

    const disconnected = network.fromAdjacency([
      [0, 1, 0, 0],
      [1, 0, 0, 0],
      [0, 0, 0, 1],
      [0, 0, 1, 0],
    ]);
    expect(network.connected(disconnected)).toBe(false);
  });

  it('finds connected components', () => {
    const g = network.fromAdjacency([
      [0, 1, 0, 0],
      [1, 0, 0, 0],
      [0, 0, 0, 1],
      [0, 0, 1, 0],
    ]);
    const comps = network.components(g);
    expect(comps.length).toBe(2);
  });

  // --- Rei Operations ---
  it('computes PageRank', () => {
    const g = network.createGraph(
      [{ center: 1 }, { center: 1 }, { center: 1 }],
      [
        { source: 0, target: 1 },
        { source: 1, target: 2 },
        { source: 2, target: 0 },
      ],
      { directed: true }
    );
    const pr = network.pagerank(g, 0.85, 100);
    expect(pr.length).toBe(3);
    const sum = pr.reduce((a, b) => a + b, 0);
    expect(sum).toBeCloseTo(1, 4);  // ranks sum to 1
  });

  it('computes centrality measures', () => {
    const g = network.fromAdjacency([
      [0, 1, 1, 1],
      [1, 0, 0, 0],
      [1, 0, 0, 0],
      [1, 0, 0, 0],
    ]);
    const dc = network.centrality(g, 'degree');
    expect(dc[0]).toBeGreaterThan(dc[1]);  // hub has highest degree

    const cc = network.centrality(g, 'closeness');
    expect(cc[0]).toBeGreaterThan(cc[1]);
  });

  it('compresses graph (Rei ▽)', () => {
    const g = network.createGraph([
      { center: 5.0, neighbors: [1] },
      { center: 5.01, neighbors: [2] },  // close to node 0
      { center: 10.0, neighbors: [3] },
    ]);
    const compressed = network.compressGraph(g, 0.1);
    expect(compressed.nodes.length).toBeLessThan(3);  // nodes merged
  });

  it('expands graph (Rei △)', () => {
    const g = network.createGraph([
      { center: 5, neighbors: [1, 2, 3, 4] },
      { center: 3, neighbors: [5] },
    ]);
    const expanded = network.expandGraph(g, 0);
    expect(expanded.nodes.length).toBe(3);  // node split into 2
  });

  // --- Transforms ---
  it('transposes graph', () => {
    const g = network.createGraph(
      [{ center: 1 }, { center: 2 }],
      [{ source: 0, target: 1, weight: 3 }],
      { directed: true }
    );
    const t = network.transpose(g);
    expect(t.edges[0].source).toBe(1);
    expect(t.edges[0].target).toBe(0);
  });

  it('unions two graphs', () => {
    const a = network.createGraph([{ center: 1 }], []);
    const b = network.createGraph([{ center: 2 }], []);
    const u = network.graphUnion(a, b);
    expect(u.nodes.length).toBe(2);
  });

  it('extracts subgraph', () => {
    const g = network.fromAdjacency([
      [0, 1, 1, 0],
      [1, 0, 1, 0],
      [1, 1, 0, 1],
      [0, 0, 1, 0],
    ]);
    const sub = network.subgraph(g, [0, 1, 2]);
    expect(sub.nodes.length).toBe(3);
  });
});

// ============================================================
// chrono tests
// ============================================================
describe('chrono', () => {
  const data = [1, 2, 3, 5, 8, 13, 21, 34];

  // --- Construction ---
  it('creates a time series', () => {
    const s = chrono.createSeries(data);
    expect(s.length).toBe(data.length);
    expect(s[0].value).toBe(1);
    expect(s[3].past.length).toBe(3);
  });

  it('creates windowed series', () => {
    const s = chrono.fromWindowed(data, { pastSize: 2, futureSize: 1, stride: 1 });
    expect(s.length).toBeGreaterThan(0);
    expect(s[0].past.length).toBe(2);
    expect(s[0].future.length).toBe(1);
  });

  it('resamples series', () => {
    const s = chrono.createSeries([0, 10, 20], [0, 5, 10]);
    const resampled = chrono.resample(s, 2);
    expect(resampled.length).toBe(6);  // 0, 2, 4, 6, 8, 10
    expect(resampled[0].value).toBeCloseTo(0);
    expect(resampled[resampled.length - 1].value).toBeCloseTo(20);
  });

  // --- Window Operations ---
  it('applies temporal window', () => {
    const s = chrono.createSeries(data);
    const windowed = chrono.window(s, { pastSize: 2, futureSize: 1, stride: 1 });
    expect(windowed.length).toBeGreaterThan(0);
    expect(windowed[0].past.length).toBe(2);
    expect(windowed[0].future.length).toBe(1);
  });

  it('applies sliding window', () => {
    const s = chrono.createSeries(data);
    const slid = chrono.slide(s, 5, 1);
    expect(slid.length).toBeGreaterThan(0);
  });

  it('applies expanding window', () => {
    const s = chrono.createSeries(data);
    const exp = chrono.expanding(s);
    expect(exp[0].past.length).toBe(0);
    expect(exp[exp.length - 1].past.length).toBe(data.length - 1);
  });

  // --- Analysis ---
  it('computes trend', () => {
    const s = chrono.createSeries([1, 2, 3, 4, 5]);
    const t = chrono.trend(s);
    expect(t.slope).toBeCloseTo(1, 1);
    expect(t.r2).toBeCloseTo(1, 3);
  });

  it('detects seasonality', () => {
    const seasonal = [1, 5, 3, 1, 5, 3, 1, 5, 3, 1, 5, 3];
    const s = chrono.createSeries(seasonal);
    const result = chrono.seasonality(s, 3);
    expect(result.seasonal.length).toBe(3);
    // First season component should be below mean, second above
    expect(result.seasonal[1]).toBeGreaterThan(result.seasonal[0]);
  });

  it('decomposes time series', () => {
    const vals = Array.from({ length: 24 }, (_, i) => i * 0.5 + 3 * Math.sin(i * Math.PI / 6));
    const s = chrono.createSeries(vals);
    const d = chrono.decompose(s, 12);
    expect(d.trend.length).toBe(vals.length);
    expect(d.seasonal.length).toBe(vals.length);
    expect(d.residual.length).toBe(vals.length);
    // trend + seasonal + residual ≈ original
    const reconstructed = vals.map((_, i) => d.trend[i] + d.seasonal[i] + d.residual[i]);
    for (let i = 0; i < vals.length; i++) {
      expect(reconstructed[i]).toBeCloseTo(vals[i], 8);
    }
  });

  it('computes autocorrelation', () => {
    const s = chrono.createSeries([1, 2, 3, 4, 5, 4, 3, 2, 1]);
    const ac = chrono.autocorrelation(s, 3);
    expect(ac[0]).toBeCloseTo(1, 3);  // lag 0 = perfect correlation
    expect(ac.length).toBe(4);  // 0..3
  });

  it('computes cross-correlation', () => {
    const a = chrono.createSeries([1, 2, 3, 4, 5]);
    const b = chrono.createSeries([5, 4, 3, 2, 1]);
    const cc = chrono.crossCorrelation(a, b, 2);
    expect(cc.length).toBe(5);  // -2..2
  });

  // --- Forecast ---
  it('forecasts with linear method', () => {
    const s = chrono.createSeries([1, 2, 3, 4, 5]);
    const f = chrono.forecast(s, 3, 'linear');
    expect(f.values.length).toBe(3);
    expect(f.values[0]).toBeCloseTo(6, 0);
    expect(f.method).toBe('linear');
  });

  it('forecasts with exponential smoothing', () => {
    const s = chrono.createSeries([1, 2, 3, 4, 5]);
    const f = chrono.forecast(s, 3, 'exponential');
    expect(f.values.length).toBe(3);
    expect(f.method).toBe('exponential');
  });

  it('backcasts (knowledge backflow)', () => {
    const s = chrono.createSeries([3, 4, 5, 6, 7]);
    const bc = chrono.backcast(s, 2);
    expect(bc.values.length).toBe(2);
    expect(bc.method).toBe('backcast');
  });

  // --- Rei Operations ---
  it('compresses series (Rei ▽)', () => {
    const s = chrono.createSeries(data);
    const compressed = chrono.compressSeries(s, 2);
    expect(compressed.length).toBe(Math.ceil(data.length / 2));
  });

  it('expands series (Rei △)', () => {
    const s = chrono.createSeries([0, 10, 20]);
    const expanded = chrono.expandSeries(s, 3);
    expect(expanded.length).toBeGreaterThan(3);
  });

  it('computes diff and integrate (inverse pair)', () => {
    const s = chrono.createSeries([1, 3, 6, 10, 15]);
    const d = chrono.diff(s);
    expect(chrono.values(d)).toEqual([2, 3, 4, 5]);
    const integrated = chrono.integrate(d);
    expect(chrono.values(integrated)[0]).toBeCloseTo(2);
  });

  // --- Utility ---
  it('extracts values and timestamps', () => {
    const s = chrono.createSeries([10, 20, 30]);
    expect(chrono.values(s)).toEqual([10, 20, 30]);
    expect(chrono.timestamps(s)).toEqual([0, 1, 2]);
  });

  it('computes mean and variance', () => {
    const s = chrono.createSeries([2, 4, 6, 8]);
    expect(chrono.mean(s)).toBe(5);
    expect(chrono.variance(s)).toBe(5);
  });
});

// ============================================================
// transform tests
// ============================================================
describe('transform', () => {
  // --- Construction ---
  it('creates basic transform', () => {
    const t = transform.createTransform(
      (x: number) => x * 2,
      (y: number) => y / 2,
      { name: 'double' }
    );
    expect(t.forward(5)).toBe(10);
    expect(t.inverse(10)).toBe(5);
    expect(t.name).toBe('double');
  });

  it('chains transforms', () => {
    const c = transform.chain(
      transform.scale(2),
      transform.shift(3)
    );
    expect(c.forward(5)).toBe(13);    // 5*2 + 3
    expect(c.inverse(13)).toBe(5);    // (13-3)/2
  });

  it('identity is no-op', () => {
    const id = transform.identity<number>();
    expect(id.forward(42)).toBe(42);
    expect(id.inverse(42)).toBe(42);
  });

  // --- Built-in Transforms ---
  it('normalize: (x-μ)/σ ↔ y*σ+μ', () => {
    const t = transform.normalize(10, 5);
    expect(t.forward(15)).toBeCloseTo(1);
    expect(t.inverse(1)).toBeCloseTo(15);
  });

  it('log: ln(x+1) ↔ e^y - 1', () => {
    const t = transform.log();
    expect(t.forward(Math.E - 1)).toBeCloseTo(1);
    expect(t.inverse(1)).toBeCloseTo(Math.E - 1);
  });

  it('quantize is lossy', () => {
    const t = transform.quantize(2);
    expect(t.forward(3.14159)).toBeCloseTo(3.14);
    expect(t.lossy).toBe(true);
  });

  it('scale: x*k ↔ y/k', () => {
    const t = transform.scale(3);
    expect(t.forward(4)).toBe(12);
    expect(t.inverse(12)).toBe(4);
  });

  it('shift: x+k ↔ y-k', () => {
    const t = transform.shift(7);
    expect(t.forward(3)).toBe(10);
    expect(t.inverse(10)).toBe(3);
  });

  it('power: x^n ↔ y^(1/n)', () => {
    const t = transform.power(2);
    expect(t.forward(3)).toBe(9);
    expect(t.inverse(9)).toBeCloseTo(3);
  });

  it('sigmoid: reversible', () => {
    const t = transform.sigmoid();
    expect(t.forward(0)).toBeCloseTo(0.5);
    expect(t.inverse(0.5)).toBeCloseTo(0);
    expect(t.inverse(t.forward(2))).toBeCloseTo(2, 5);
  });

  it('softmax: forward produces probabilities', () => {
    const t = transform.softmax();
    const result = t.forward([1, 2, 3]);
    const sum = result.reduce((a, b) => a + b, 0);
    expect(sum).toBeCloseTo(1, 5);
    expect(result[2]).toBeGreaterThan(result[0]);
  });

  it('fft: round-trip preserves signal', () => {
    const t = transform.fft();
    const signal = [1, 0, -1, 0];
    const freqs = t.forward(signal);
    expect(freqs.length).toBe(4);
    const recovered = t.inverse(freqs);
    for (let i = 0; i < signal.length; i++) {
      expect(recovered[i]).toBeCloseTo(signal[i], 8);
    }
  });

  // --- Inverse Operations (Knowledge Backflow) ---
  it('inverts a transform', () => {
    const t = transform.scale(5);
    const inv = transform.invert(t);
    expect(inv.forward(10)).toBe(2);   // was inverse
    expect(inv.inverse(2)).toBe(10);   // was forward
  });

  it('round-trip measures error', () => {
    const c = transform.chain(transform.scale(2), transform.shift(1));
    const rt = transform.roundTrip(7, c);
    expect(rt.error).toBeCloseTo(0, 10);  // exact reversibility
    expect(rt.result).toBeCloseTo(7);
  });

  it('round-trip with lossy transform shows error', () => {
    const c = transform.chain(
      transform.scale(Math.PI),
      transform.quantize(1)
    );
    const rt = transform.roundTrip(1, c);
    expect(rt.error).toBeGreaterThan(0);  // quantization introduces error
  });

  it('inverse with residual', () => {
    const t = transform.quantize(0);
    const result = transform.inverseWithResidual(t, 3);
    expect(result.value).toBe(3);
    expect(result.residual.confidence).toBeLessThanOrEqual(1);
  });

  // --- Chain Operations ---
  it('compose: f ∘ g', () => {
    const f = transform.scale(2);
    const g = transform.shift(3);
    const fg = transform.compose(f, g);
    expect(fg.forward(5)).toBe(13);  // 5*2 + 3
    expect(fg.inverse(13)).toBe(5);
  });

  it('parallel: [f, g]', () => {
    const p = transform.parallel(
      transform.scale(2),
      transform.shift(10)
    );
    const result = p.forward([3, 5] as [number, number]);
    expect(result).toEqual([6, 15]);
    expect(p.inverse([6, 15] as [number, number])).toEqual([3, 5]);
  });

  it('conditional: pred-based routing', () => {
    const c = transform.conditional<number, number>(
      x => x >= 0,
      transform.scale(2),
      transform.scale(-2)
    );
    expect(c.forward(5)).toBe(10);
    expect(c.forward(-3)).toBe(6);
  });

  // --- Analysis ---
  it('isReversible detects exact reversibility', () => {
    expect(transform.isReversible(transform.scale(3), [1, 2, 3, -5, 0])).toBe(true);
    expect(transform.isReversible(transform.quantize(1), [1.234, 5.678])).toBe(false);
  });

  it('measureLoss quantifies information loss', () => {
    const lossless = transform.chain(transform.scale(2));
    expect(transform.measureLoss(5, lossless)).toBeCloseTo(0);

    const lossy = transform.chain(transform.scale(Math.PI), transform.quantize(1));
    expect(transform.measureLoss(1, lossy)).toBeGreaterThan(0);
  });

  it('jacobian computes numerical derivatives', () => {
    const t = transform.createTransform(
      (xs: number[]) => [xs[0] * xs[0], xs[0] * xs[1]],
      (ys: number[]) => ys,
    );
    const J = transform.jacobian(t, [3, 4]);
    expect(J[0][0]).toBeCloseTo(6, 2);   // d(x²)/dx = 2x = 6
    expect(J[0][1]).toBeCloseTo(0, 2);   // d(x²)/dy = 0
    expect(J[1][0]).toBeCloseTo(4, 2);   // d(xy)/dx = y = 4
    expect(J[1][1]).toBeCloseTo(3, 2);   // d(xy)/dy = x = 3
  });
});

// ============================================================
// holograph tests
// ============================================================
describe('holograph', () => {
  // Test data: 5D points
  const data5d = [
    [1, 2, 3, 4, 5],
    [2, 4, 6, 8, 10],
    [3, 6, 9, 12, 15],
    [1.5, 3, 4.5, 6, 7.5],
    [4, 8, 12, 16, 20],
    [0.5, 1, 1.5, 2, 2.5],
    [5, 10, 15, 20, 25],
    [2.5, 5, 7.5, 10, 12.5],
  ];

  // --- Projection Construction ---
  it('creates random projection', () => {
    const p = holograph.createProjection(5, 2, 'random');
    expect(p.sourceDim).toBe(5);
    expect(p.targetDim).toBe(2);
    expect(p.matrix.length).toBe(2);
    expect(p.matrix[0].length).toBe(5);
  });

  it('creates sparse projection', () => {
    const p = holograph.createProjection(10, 3, 'sparse');
    expect(p.matrix.length).toBe(3);
    expect(p.matrix[0].length).toBe(10);
  });

  it('creates PCA projection from data', () => {
    const p = holograph.fromData(data5d, 2, 'pca');
    expect(p.sourceDim).toBe(5);
    expect(p.targetDim).toBe(2);
    expect(p.preservedVariance).toBeGreaterThan(0);
  });

  it('creates Rei compress projection', () => {
    const p = holograph.reiCompress(data5d, 2);
    expect(p.method).toBe('rei_compress');
    expect(p.targetDim).toBe(2);
  });

  it('rejects targetDim >= sourceDim', () => {
    expect(() => holograph.createProjection(3, 5)).toThrow();
    expect(() => holograph.createProjection(3, 3)).toThrow();
  });

  // --- Projection / Reconstruction ---
  it('projects data to lower dimension', () => {
    const p = holograph.fromData(data5d, 2, 'pca');
    const projected = holograph.project(data5d, p);
    expect(projected.length).toBe(data5d.length);
    expect(projected[0].length).toBe(2);
  });

  it('reconstructs data from projection', () => {
    const p = holograph.fromData(data5d, 2, 'pca');
    const projected = holograph.project(data5d, p);
    const reconstructed = holograph.reconstruct(projected, p);
    expect(reconstructed.length).toBe(data5d.length);
    expect(reconstructed[0].length).toBe(5);
  });

  it('projects and reconstructs single point', () => {
    const p = holograph.fromData(data5d, 2, 'pca');
    const point = [3, 6, 9, 12, 15];
    const low = holograph.projectPoint(point, p);
    expect(low.length).toBe(2);
    const restored = holograph.reconstructPoint(low, p);
    expect(restored.length).toBe(5);
  });

  it('PCA reconstruction has high fidelity on linear data', () => {
    const p = holograph.fromData(data5d, 2, 'pca');
    const projected = holograph.project(data5d, p);
    const reconstructed = holograph.reconstruct(projected, p);
    const fid = holograph.fidelity(data5d, reconstructed);
    // Data is nearly rank-1 (all proportional), so 2D PCA should capture most
    expect(fid).toBeGreaterThan(0.8);
  });

  // --- Hologram Operations ---
  it('encodes data as hologram', () => {
    const h = holograph.encode(data5d, 2);
    expect(h.projected.length).toBe(data5d.length);
    expect(h.projected[0].length).toBe(2);
    expect(h.envelope.length).toBe(data5d.length);
    expect(h.fidelity).toBeGreaterThan(0);
    expect(h.sourceDim).toBe(5);
    expect(h.targetDim).toBe(2);
  });

  it('computes residual matrix', () => {
    const p = holograph.fromData(data5d, 2, 'pca');
    const projected = holograph.project(data5d, p);
    const reconstructed = holograph.reconstruct(projected, p);
    const res = holograph.residual(data5d, reconstructed);
    expect(res.length).toBe(data5d.length);
    expect(res[0].length).toBe(5);
  });

  // --- Analysis ---
  it('computes explained variance', () => {
    const ev = holograph.explainedVariance(data5d);
    expect(ev.length).toBeGreaterThan(0);
    expect(ev[0]).toBeGreaterThan(0);
    const total = ev.reduce((a, b) => a + b, 0);
    expect(total).toBeCloseTo(1, 1);
  });

  it('finds optimal dimension', () => {
    const opt = holograph.optimalDim(data5d, 0.95);
    expect(opt).toBeGreaterThanOrEqual(1);
    expect(opt).toBeLessThanOrEqual(5);
  });

  it('estimates intrinsic dimension', () => {
    const id = holograph.intrinsicDim(data5d);
    expect(id).toBeGreaterThanOrEqual(1);
    // Data is nearly rank-1, so intrinsic dim should be low
    expect(id).toBeLessThanOrEqual(3);
  });

  it('computes distortion map', () => {
    const p = holograph.fromData(data5d, 2, 'pca');
    const projected = holograph.project(data5d, p);
    const distortions = holograph.distortionMap(data5d, projected);
    expect(distortions.length).toBe(data5d.length);
  });

  it('runs full analysis', () => {
    const analysis = holograph.analyze(data5d);
    expect(analysis.explainedVariance.length).toBeGreaterThan(0);
    expect(analysis.optimalDim).toBeGreaterThanOrEqual(1);
    expect(analysis.intrinsicDim).toBeGreaterThanOrEqual(1);
  });

  // --- Visualization ---
  it('project2D returns x, y arrays', () => {
    const result = holograph.project2D(data5d);
    expect(result.x.length).toBe(data5d.length);
    expect(result.y.length).toBe(data5d.length);
  });

  it('project3D returns x, y, z arrays', () => {
    const result = holograph.project3D(data5d);
    expect(result.x.length).toBe(data5d.length);
    expect(result.y.length).toBe(data5d.length);
    expect(result.z.length).toBe(data5d.length);
  });
});

// ============================================================
// Cross-module Integration Tests
// ============================================================
describe('Tier 2 Integration', () => {
  it('network → holograph: project large graph to 2D', () => {
    const g = network.fromAdjacency([
      [0, 1, 2, 0, 0],
      [1, 0, 1, 3, 0],
      [2, 1, 0, 1, 4],
      [0, 3, 1, 0, 2],
      [0, 0, 4, 2, 0],
    ]);
    const adj = network.toAdjacency(g);
    const proj = holograph.project2D(adj);
    expect(proj.x.length).toBe(5);
    expect(proj.y.length).toBe(5);
  });

  it('chrono → transform: reversible time series pipeline', () => {
    const data = [1, 2, 3, 4, 5, 6, 7, 8];
    const s = chrono.createSeries(data);
    const m = chrono.mean(s);
    const std = Math.sqrt(chrono.variance(s));

    const pipeline = transform.chain(
      transform.normalize(m, std),
      transform.scale(100)
    );

    const transformed = data.map(v => pipeline.forward(v));
    const restored = transformed.map(v => pipeline.inverse(v));

    for (let i = 0; i < data.length; i++) {
      expect(restored[i]).toBeCloseTo(data[i], 8);
    }
  });

  it('transform → holograph: transform chain then project', () => {
    const data5d = [
      [1, 2, 3, 4, 5],
      [2, 4, 6, 8, 10],
      [3, 6, 9, 12, 15],
    ];

    // Transform each row
    const t = transform.scale(0.1);
    const scaled = data5d.map(row => row.map(v => t.forward(v)));

    // Project
    const proj = holograph.fromData(scaled, 2, 'pca');
    const projected = holograph.project(scaled, proj);
    expect(projected.length).toBe(3);
    expect(projected[0].length).toBe(2);
  });

  it('network centrality → chrono time series → forecast', () => {
    // Simulate centrality evolving over time
    const centralityOverTime = [0.1, 0.15, 0.22, 0.31, 0.45, 0.52, 0.61];
    const s = chrono.createSeries(centralityOverTime);
    const f = chrono.forecast(s, 3, 'linear');
    expect(f.values.length).toBe(3);
    expect(f.values[0]).toBeGreaterThan(0.6);  // upward trend
  });

  it('full pipeline: network → transform → holograph → chrono', () => {
    // 1. Build graph
    const g = network.fromAdjacency([
      [0, 1, 2],
      [1, 0, 3],
      [2, 3, 0],
    ]);
    const pr = network.pagerank(g, 0.85, 50);

    // 2. Transform PageRank values
    const t = transform.scale(100);
    const scaled = pr.map(v => t.forward(v));

    // 3. Create time series of scaled values (simulate temporal snapshots)
    const timeSeries: number[] = [];
    for (let epoch = 0; epoch < 5; epoch++) {
      for (const v of scaled) {
        timeSeries.push(v * (1 + epoch * 0.1));
      }
    }

    // 4. Analyze as time series
    const s = chrono.createSeries(timeSeries);
    const trnd = chrono.trend(s);
    expect(trnd.slope).toBeGreaterThan(0);  // upward trend due to epoch scaling

    // 5. All components work together
    expect(pr.length).toBe(3);
    expect(scaled.length).toBe(3);
    expect(timeSeries.length).toBe(15);
  });
});
