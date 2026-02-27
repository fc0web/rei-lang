/**
 * Rei Benchmark Suite — Runnable Comparisons
 * 
 * Run: npx vitest run benchmarks/
 * 
 * Each benchmark shows:
 * 1. Working Rei code (via rei() API)
 * 2. Equivalent logic in plain TypeScript
 * 3. Structural comparison
 */

import { describe, it, expect } from 'vitest';
import { rei } from '../src/index';

// ================================================================
// Benchmark 1: Image Kernel Computation
// Center-periphery pattern as a language primitive
// ================================================================

describe('Benchmark 1: Image Kernel (Center-Periphery)', () => {
  
  it('Rei: 3 lines — define, compute, done', () => {
    rei.reset();
    // pixel=128, neighbors=[120, 135, 140, 125]
    rei('let kernel = 𝕄{128; 120, 135, 140, 125}');
    const weighted = rei('kernel |> compute :weighted');
    const harmonic = rei('kernel |> compute :harmonic');
    
    expect(typeof weighted).toBe('number');
    expect(typeof harmonic).toBe('number');
    // Rei: 3 lines (define + 2 computations)
  });

  it('TypeScript equivalent: 15+ lines', () => {
    // Manual kernel computation — no spatial primitives
    const center = 128;
    const neighbors = [120, 135, 140, 125];
    
    // Weighted average (manual)
    const n = neighbors.length;
    const neighborAvg = neighbors.reduce((a, b) => a + b, 0) / n;
    const weighted = center + neighborAvg;
    
    // Harmonic mean (manual)
    const reciprocalSum = neighbors.reduce((s, v) => s + 1 / Math.abs(v), 0);
    const harmonic = center + n / reciprocalSum;
    
    expect(typeof weighted).toBe('number');
    expect(typeof harmonic).toBe('number');
    // TypeScript: 10+ lines just for computation
    // Plus: no concept of "center" vs "neighbor" — it's just arrays
  });
});

// ================================================================
// Benchmark 2: Multi-Dimensional Data Aggregation
// Four computation modes from one data structure
// ================================================================

describe('Benchmark 2: Multi-Dimensional Aggregation (4 Modes)', () => {

  it('Rei: 5 lines — one structure, four views', () => {
    rei.reset();
    rei('let data = 𝕄{100; 20, 30, 40, 50}');
    const w = rei('data |> compute :weighted');
    const m = rei('data |> compute :multiplicative');
    const h = rei('data |> compute :harmonic');
    const e = rei('data |> compute :exponential');

    expect(typeof w).toBe('number');
    expect(typeof m).toBe('number');
    expect(typeof h).toBe('number');
    expect(typeof e).toBe('number');
    // Rei: 5 lines. The structure IS the computation.
  });

  it('TypeScript equivalent: 25+ lines', () => {
    const center = 100;
    const neighbors = [20, 30, 40, 50];
    const n = neighbors.length;

    // Weighted
    const avg = neighbors.reduce((a, b) => a + b, 0) / n;
    const weighted = center + avg;

    // Multiplicative
    const product = neighbors.reduce((p, v) => p * (1 + v), 1);
    const multiplicative = center * product;

    // Harmonic
    const recipSum = neighbors.reduce((s, v) => s + 1 / Math.abs(v), 0);
    const harmonic = center + n / recipSum;

    // Exponential
    const expAvg = neighbors.reduce((s, v) => s + Math.exp(v), 0) / n;
    const exponential = center * expAvg;

    expect(typeof weighted).toBe('number');
    expect(typeof multiplicative).toBe('number');
    expect(typeof harmonic).toBe('number');
    expect(typeof exponential).toBe('number');
    // TypeScript: 15+ lines of manual computation
    // Plus: "center" and "neighbors" are just variables — no structural meaning
  });
});

// ================================================================
// Benchmark 3: Six-Attribute Metadata
// Values that carry their own context vs manual tracking
// ================================================================

describe('Benchmark 3: Six-Attribute Metadata (σ)', () => {

  it('Rei: 2 lines — create value, get full metadata', () => {
    rei.reset();
    rei('let mut x = 𝕄{5; 1, 2, 3}');
    const sigma = rei('x |> sigma');

    // All six attributes present — automatically
    expect(sigma.field.center).toBe(5);
    expect(sigma.field.neighbors).toEqual([1, 2, 3]);
    expect(sigma.field.dim).toBe(3);
    expect(sigma.flow.velocity).toBe(0);
    expect(sigma.flow.phase).toBe('rest');
    expect(sigma.layer.depth).toBe(1);
    expect(sigma.relation.isolated).toBe(true);
    expect(sigma.will.tendency).toBe('rest');
    // Rei: 2 lines. Six attributes for free.
  });

  it('TypeScript equivalent: 40+ lines', () => {
    // Manual metadata tracking
    class TrackedValue {
      // Field
      center: number;
      neighbors: number[];
      dim: number;
      // Flow
      velocity: number = 0;
      acceleration: number = 0;
      phase: string = 'rest';
      // Memory
      history: any[] = [];
      // Layer
      depth: number = 1;
      structure: string = 'flat';
      // Relation
      refs: string[] = [];
      dependencies: string[] = [];
      isolated: boolean = true;
      // Will
      tendency: string = 'rest';
      strength: number = 0;

      constructor(center: number, neighbors: number[]) {
        this.center = center;
        this.neighbors = neighbors;
        this.dim = neighbors.length;
      }

      getSigma() {
        return {
          field: { center: this.center, neighbors: this.neighbors, dim: this.dim },
          flow: { velocity: this.velocity, phase: this.phase },
          layer: { depth: this.depth, structure: this.structure },
          relation: { refs: this.refs, isolated: this.isolated },
          will: { tendency: this.tendency, strength: this.strength },
        };
      }
    }

    const x = new TrackedValue(5, [1, 2, 3]);
    const sigma = x.getSigma();

    expect(sigma.field.center).toBe(5);
    expect(sigma.relation.isolated).toBe(true);
    // TypeScript: 40+ lines of class definition
    // And this class doesn't auto-update — every operation needs manual tracking
  });
});

// ================================================================
// Benchmark 4: Dependency Graph Tracing
// Automatic transitive closure vs manual BFS
// ================================================================

describe('Benchmark 4: Dependency Tracing', () => {

  it('Rei: 6 lines — bind, trace, done', () => {
    rei.reset();
    rei('let mut a = 𝕄{1; 2, 3}');
    rei('let mut b = 𝕄{4; 5, 6}');
    rei('let mut c = 𝕄{7; 8, 9}');
    rei('a |> bind("b", "mirror")');
    rei('b |> bind("c", "mirror")');
    const trace = rei('a |> trace');

    expect(trace.reiType).toBe('TraceResult');
    expect(trace.totalRefs).toBeGreaterThanOrEqual(3);
    expect(trace.maxDepth).toBeGreaterThanOrEqual(2);
    expect(trace.chains.some((ch: string[]) => ch.includes('c'))).toBe(true);
    // Rei: 6 lines. Transitive dependency chain — automatic.
  });

  it('TypeScript equivalent: 30+ lines', () => {
    // Manual dependency graph with BFS traversal
    type Node = { id: string; value: number; deps: string[] };
    const nodes: Map<string, Node> = new Map();
    
    nodes.set('a', { id: 'a', value: 1, deps: ['b'] });
    nodes.set('b', { id: 'b', value: 4, deps: ['c'] });
    nodes.set('c', { id: 'c', value: 7, deps: [] });

    // BFS trace from 'a'
    function trace(startId: string): { chains: string[][], maxDepth: number, totalRefs: number } {
      const visited = new Set<string>();
      const queue: { id: string; depth: number; path: string[] }[] = [
        { id: startId, depth: 0, path: [startId] }
      ];
      const chains: string[][] = [];
      let maxDepth = 0;

      while (queue.length > 0) {
        const { id, depth, path } = queue.shift()!;
        if (visited.has(id)) continue;
        visited.add(id);
        maxDepth = Math.max(maxDepth, depth);

        const node = nodes.get(id);
        if (!node) continue;

        if (node.deps.length === 0) {
          chains.push(path);
        }
        for (const dep of node.deps) {
          queue.push({ id: dep, depth: depth + 1, path: [...path, dep] });
        }
      }
      return { chains, maxDepth, totalRefs: visited.size };
    }

    const result = trace('a');
    expect(result.totalRefs).toBeGreaterThanOrEqual(3);
    expect(result.maxDepth).toBeGreaterThanOrEqual(2);
    expect(result.chains.some(ch => ch.includes('c'))).toBe(true);
    // TypeScript: 30+ lines. And this is a simple version without cycle detection,
    // strength tracking, or depth limits — all of which Rei provides automatically.
  });
});

// ================================================================
// Benchmark 5: Influence Scoring Between Connected Values
// One pipe vs manual graph pathfinding
// ================================================================

describe('Benchmark 5: Influence Scoring', () => {

  it('Rei: 5 lines — bind, score, done', () => {
    rei.reset();
    rei('let mut x = 𝕄{5; 1, 2}');
    rei('let mut y = 𝕄{10; 3, 4}');
    rei('let mut z = 𝕄{15; 5, 6}');
    rei('x |> bind("y", "mirror")');
    rei('y |> bind("z", "mirror")');
    const inf = rei('x |> influence("z")');

    expect(inf.reiType).toBe('InfluenceResult');
    expect(inf.from).toBe('x');
    expect(inf.to).toBe('z');
    expect(inf.hops).toBe(2);
    expect(inf.path).toEqual(['x', 'y', 'z']);
    expect(inf.score).toBeGreaterThan(0);
    // Rei: 5 lines. Influence path and score — automatic.
  });

  it('TypeScript equivalent: 25+ lines', () => {
    // Manual BFS shortest path with strength calculation
    const graph: Map<string, { target: string; strength: number }[]> = new Map();
    graph.set('x', [{ target: 'y', strength: 1 }]);
    graph.set('y', [{ target: 'z', strength: 1 }]);
    graph.set('z', []);

    function influence(from: string, to: string) {
      const queue: { node: string; path: string[]; score: number }[] = [
        { node: from, path: [from], score: 1 }
      ];
      const visited = new Set<string>();

      while (queue.length > 0) {
        const { node, path, score } = queue.shift()!;
        if (node === to) {
          return { from, to, path, score, hops: path.length - 1 };
        }
        if (visited.has(node)) continue;
        visited.add(node);
        for (const edge of graph.get(node) || []) {
          queue.push({
            node: edge.target,
            path: [...path, edge.target],
            score: score * edge.strength,
          });
        }
      }
      return { from, to, path: [], score: 0, hops: -1 };
    }

    const result = influence('x', 'z');
    expect(result.hops).toBe(2);
    expect(result.path).toEqual(['x', 'y', 'z']);
    // TypeScript: 25+ lines, no strength decay, no cycle protection
  });
});

// ================================================================
// Benchmark 6: Structural Entanglement
// Deep bidirectional binding vs manual bidirectional state
// ================================================================

describe('Benchmark 6: Structural Entanglement', () => {

  it('Rei: 4 lines — bind, entangle, done', () => {
    rei.reset();
    rei('let mut p = 𝕄{3; 1, 2}');
    rei('let mut q = 𝕄{7; 5, 6}');
    rei('p |> bind("q", "mirror")');
    const ent = rei('p |> entangle("q")');

    expect(ent.reiType).toBe('EntanglementResult');
    expect(ent.bidirectional).toBe(true);
    expect(ent.strength).toBeGreaterThan(0);
    expect(['quantum', 'deep', 'surface']).toContain(ent.depth);
    // Rei: 4 lines. Deep entanglement with bidirectionality and depth classification.
  });

  it('TypeScript equivalent: 20+ lines', () => {
    // Manual bidirectional relationship tracking
    class EntangledPair {
      a: { id: string; value: number };
      b: { id: string; value: number };
      strength: number;
      bidirectional: boolean;
      depth: string;

      constructor(a: { id: string; value: number }, b: { id: string; value: number }) {
        this.a = a;
        this.b = b;
        this.strength = 1;
        this.bidirectional = true;
        this.depth = this.calculateDepth();
      }

      private calculateDepth(): string {
        // Simplified — Rei does this with full sigma context
        if (this.strength >= 0.8) return 'quantum';
        if (this.strength >= 0.4) return 'deep';
        return 'surface';
      }
    }

    const pair = new EntangledPair(
      { id: 'p', value: 3 },
      { id: 'q', value: 7 }
    );
    expect(pair.bidirectional).toBe(true);
    expect(['quantum', 'deep', 'surface']).toContain(pair.depth);
    // TypeScript: 20+ lines, and doesn't integrate with any metadata system
  });
});

// ================================================================
// Benchmark 7: Will Evolution
// Autonomous intention evolution vs manual state machines
// ================================================================

describe('Benchmark 7: Will Evolution (Autonomous Intention)', () => {

  it('Rei: 3 lines — intend, evolve, inspect', () => {
    rei.reset();
    rei('let mut w = 𝕄{5; 1, 2, 3}');
    rei('w |> intend("maximize")');
    const evolved = rei('w |> will_evolve');

    expect(evolved.reiType).toBe('WillEvolution');
    expect(evolved.previous).toBeDefined();
    expect(evolved.evolved).toBeDefined();
    expect(evolved.autonomous).toBe(true);
    expect(typeof evolved.reason).toBe('string');
    // Rei: 3 lines. The value autonomously decides how its intention evolves.
  });

  it('TypeScript equivalent: 30+ lines', () => {
    // Manual intention tracking with evolution logic
    interface WillState {
      tendency: string;
      strength: number;
      intrinsic: string;
      history: { tendency: string; strength: number }[];
    }

    class IntentionalValue {
      value: number;
      will: WillState;

      constructor(value: number) {
        this.value = value;
        this.will = {
          tendency: 'rest',
          strength: 0,
          intrinsic: 'centered',
          history: [],
        };
      }

      intend(tendency: string) {
        this.will.history.push({
          tendency: this.will.tendency,
          strength: this.will.strength,
        });
        this.will.tendency = tendency;
      }

      evolve(): { previous: any; evolved: any; reason: string } {
        const previous = { ...this.will };
        // Simplified evolution logic
        if (this.will.strength < 0.3) {
          this.will.strength += 0.3;
          return {
            previous,
            evolved: { ...this.will },
            reason: 'Weak will — falling back to intrinsic tendency',
          };
        }
        this.will.strength = Math.min(1, this.will.strength + 0.1);
        return {
          previous,
          evolved: { ...this.will },
          reason: 'Strengthening existing tendency',
        };
      }
    }

    const w = new IntentionalValue(5);
    w.intend('maximize');
    const result = w.evolve();
    expect(result.previous).toBeDefined();
    expect(result.evolved).toBeDefined();
    // TypeScript: 30+ lines, and this is a simplified version
    // Real evolution would need trajectory analysis, confidence scoring, etc.
  });
});
