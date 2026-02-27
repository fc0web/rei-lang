# Rei Benchmark Results — Runnable Comparisons

**Run the benchmarks yourself:**
```bash
npx vitest run benchmarks/
```

All benchmarks are in `benchmarks/benchmark-suite.test.ts`. Each test has both a Rei implementation and a TypeScript equivalent doing the same thing.

---

## Summary

| # | Task | Rei | TypeScript | Ratio | What Rei eliminates |
|---|------|-----|-----------|-------|-------------------|
| 1 | Image kernel computation | 3 lines | 10+ lines | 3.3× | Manual neighbor loops |
| 2 | Multi-dimensional aggregation (4 modes) | 5 lines | 15+ lines | 3× | Separate computation functions |
| 3 | Six-attribute metadata | 2 lines | 40+ lines | 20× | Entire metadata class |
| 4 | Dependency graph tracing | 6 lines | 30+ lines | 5× | BFS implementation |
| 5 | Influence scoring | 5 lines | 25+ lines | 5× | Graph pathfinding |
| 6 | Structural entanglement | 4 lines | 20+ lines | 5× | Bidirectional state |
| 7 | Will evolution | 3 lines | 30+ lines | 10× | State machine + history |

---

## The Real Difference

Line count reduction is visible but not the point. The deeper difference:

**In TypeScript/Python**, you build infrastructure first, then use it:
- Define a class for tracked values
- Implement BFS for dependency tracing
- Build a state machine for intention evolution
- Wire up metadata manually at every operation

**In Rei**, the infrastructure is the language:
- Values have spatial structure (𝕄)
- Metadata propagates automatically (σ)
- Dependencies are tracked by the runtime (trace, influence)
- Intentions evolve autonomously (will_evolve)

Every operation in the TypeScript benchmarks is something a programmer must remember to implement and maintain. In Rei, forgetting is structurally impossible — the metadata exists whether you ask for it or not.

---

## Benchmark 3 Explained: Why 20× Matters

The most dramatic ratio is Benchmark 3 (six-attribute metadata): 2 lines vs 40+ lines.

**Rei:**
```rei
let mut x = 𝕄{5; 1, 2, 3}
x |> sigma
```

**TypeScript:** Requires defining a class with 15+ properties, a constructor, and a `getSigma()` method — and this class still doesn't auto-update when operations happen.

This isn't just shorter. It means Rei values **always** carry their context. You can inspect any value at any point and know its field, flow, memory, layer, relations, and will. In TypeScript, you only know what you explicitly tracked.

---

## How to Verify

```bash
git clone https://github.com/fc0web/rei-lang.git
cd rei-lang
npm install
npx vitest run benchmarks/
```

All 14 tests should pass. Read the test file to see both implementations side by side.
