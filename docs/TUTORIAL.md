# Getting Started with Rei — 15 Minutes

This tutorial takes you from zero to understanding what makes Rei different.

**Prerequisites:** Node.js 18+

---

## Part 1: Install and Run (2 minutes)

```bash
npm install rei-lang
```

Start the REPL:
```bash
npx rei
```

You should see:
```
 ╔══════════════════════════════════════════╗
 ║  Rei (0₀式) REPL v0.5.2                ║
 ║  D-FUMT Computational Language          ║
 ╚══════════════════════════════════════════╝

零 >
```

Try a basic computation:
```
零 > 2 + 3 * 4
14

零 > -25 |> abs |> sqrt
5
```

The `|>` (pipe) operator passes a value through transformations, left to right.

---

## Part 2: Multi-Dimensional Numbers (3 minutes)

Rei's core data type is `𝕄` — a value with spatial structure:

```
零 > let m = 𝕄{5; 1, 2, 3, 4}
```

This creates a number with:
- **Center**: 5
- **Neighbors**: [1, 2, 3, 4]

Compute it in different modes:

```
零 > m |> compute :weighted
7.5

零 > m |> compute :harmonic
9.615384615384617

零 > m |> compute :multiplicative
750
```

Why does this matter? In normal languages, if you want a pixel value with its neighbors, or a node with its connections, you use arrays and index management. In Rei, the center-periphery relationship is the data type itself.

---

## Part 3: Sigma — The Six Attributes (5 minutes)

This is where Rei becomes fundamentally different from other languages.

Every value in Rei carries six attributes. See them with `sigma`:

```
零 > let mut x = 𝕄{5; 1, 2, 3}
零 > x |> sigma
```

Output (simplified):
```
{
  field:    { center: 5, neighbors: [1,2,3], dim: 3 },
  flow:     { velocity: 0, phase: "rest" },
  memory:   { entries: [...], trajectory: [...] },
  layer:    { depth: 1, structure: "flat" },
  relation: { refs: [], isolated: true },
  will:     { tendency: "rest", strength: 0 }
}
```

The value `x` knows:
- **Where it is** (field — its center and neighbors)
- **How it's moving** (flow — velocity and phase)
- **What happened to it** (memory — operation history)
- **How deep it is** (layer — structural nesting)
- **What it's connected to** (relation — currently isolated)
- **What it wants** (will — currently at rest)

You didn't build any of this. It's what values **are** in Rei.

---

## Part 4: Relations and Tracing (3 minutes)

Connect values and trace their dependencies:

```
零 > let mut a = 𝕄{5; 1, 2, 3}
零 > let mut b = 𝕄{10; 4, 5, 6}
零 > let mut c = 𝕄{7; 8, 9}

零 > a |> bind("b", "mirror")
零 > b |> bind("c", "mirror")
```

Now trace from `a`:

```
零 > a |> trace
{ root: "a", chains: [["a","b","c"]], maxDepth: 2, totalRefs: 3 }
```

`a` knows its entire dependency graph — `a → b → c` — automatically.

Check influence:

```
零 > a |> influence("c")
{ from: "a", to: "c", score: 1, path: ["a","b","c"], hops: 2 }
```

Create deep entanglement:

```
零 > a |> entangle("b")
{ bidirectional: true, depth: "quantum", strength: 1 }
```

In other languages, you'd need to build a graph library, implement BFS, and manually track every connection. In Rei, it's one pipe.

---

## Part 5: Will — Values with Intentions (2 minutes)

Values can carry and evolve intentions:

```
零 > let mut w = 𝕄{5; 1, 2, 3}
零 > w |> intend("maximize")
零 > w |> will_evolve
{
  previous: { tendency: "rest", strength: 0 },
  evolved:  { tendency: "rest", strength: 0.3 },
  reason: "弱い意志 → 内在傾向に回帰",
  autonomous: true
}
```

The value evolved its own intention based on its internal state. No external logic needed.

---

## Part 6: Japanese Syntax (Optional, 1 minute)

Every command has a Japanese alias:

```
零 > 𝕄{5; 1, 2, 3} |> 自律σ
零 > a |> 追跡
零 > a |> 影響("c")
零 > a |> 縁起("b")
零 > w |> 意志進化
```

Rei is fully bilingual — English and Japanese are interchangeable.

---

## What You've Learned

In 15 minutes, you've seen:

1. **𝕄 (Multi-Dimensional Numbers)** — values with spatial structure
2. **σ (Sigma)** — six attributes every value carries automatically
3. **trace / influence / entangle** — dependency tracking as a language primitive
4. **will_evolve** — values that autonomously evolve their intentions

The key insight: **in Rei, context is never lost.** Every value knows its structure, history, connections, and intentions — not because you built tracking code, but because that's what values are.

---

## Next Steps

- **Benchmarks**: `npx vitest run benchmarks/` — see Rei vs TypeScript side by side
- **Genesis Axiom System**: `genesis() |> forward` — computational emergence from void
- **Agent Runtime**: `𝕄{10; 1,2,3} |> agent` — autonomous agent systems
- **Full API**: See [README.md](../README.md) and [KANJI-README.md](./KANJI-README.md)
- **Theory**: See [theory/](../theory/) for the D-FUMT mathematical foundation

---

## Using Rei as a Library

```typescript
import { rei } from 'rei-lang';

// Evaluate Rei code
rei('let mut x = 𝕄{5; 1, 2, 3}');
const sigma = rei('x |> sigma');
console.log(sigma.field.center); // 5

// Define functions
rei('compress f(a, b) = a + b');
console.log(rei('f(3, 4)')); // 7

// Reset state
rei.reset();
```
