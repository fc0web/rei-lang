# Rei (0₀式) — Values That Know Themselves

[![npm version](https://img.shields.io/npm/v/rei-lang)](https://www.npmjs.com/package/rei-lang)
[![License: Apache 2.0](https://img.shields.io/badge/License-Apache_2.0-gold.svg)](./LICENSE)
[![Tests](https://img.shields.io/badge/tests-877%20passed-brightgreen)]()
[![Peace Use](https://img.shields.io/badge/☮️-Peace_Use-blue)](./PEACE_USE_CLAUSE.md)

**Rei** is a computation language where every value carries six attributes — field, flow, memory, layer, relation, and will — as language primitives. Where other languages lose context at every step, Rei values know where they are, where they came from, and what they're connected to.

**Author:** Nobuki Fujimoto (藤本 伸樹)

---

## Why Rei?

In conventional languages, spatial structure, history, and relationships are things you build on top. In Rei, they're built in.

```rei
// A value with spatial context: center 5, neighbors [1, 2, 3]
let mut x = 𝕄{5; 1, 2, 3}

// One pipe gives you the full picture — no manual tracking needed
x |> sigma
// → { field:    { center: 5, neighbors: [1,2,3], dim: 3 },
//     flow:     { velocity: 0, phase: "rest" },
//     memory:   { entries: [...], trajectory: [...] },
//     layer:    { depth: 1, structure: "flat" },
//     relation: { refs: [], isolated: true },
//     will:     { tendency: "rest", strength: 0 } }
```

This isn't a library feature. It's **what values are** in Rei.

### What this enables

**Dependency tracing without instrumentation:**
```rei
let mut a = 𝕄{5; 1, 2, 3}
let mut b = 𝕄{10; 4, 5, 6}
let mut c = 𝕄{7; 8, 9}
a |> bind("b", "mirror")
b |> bind("c", "mirror")

a |> trace
// → { root: "a", chains: [["a","b","c"]], maxDepth: 2 }
// a knows its entire dependency graph — automatically
```

**Influence scoring between connected values:**
```rei
a |> influence("c")
// → { from: "a", to: "c", score: 1, path: ["a","b","c"], hops: 2 }
```

**Values that evolve their own intentions:**
```rei
let mut w = 𝕄{5; 1, 2, 3}
w |> intend("maximize")
w |> will_evolve
// → { previous: {tendency:"rest"}, evolved: {tendency:"rest", strength:0.3},
//     reason: "弱い意志 → 内在傾向に回帰", autonomous: true }
```

In Python, every one of these features requires a framework, manual state tracking, and hundreds of lines of boilerplate. In Rei, they're one pipe away.

---

## Install

```bash
npm install rei-lang
```

## Quick Start (5 minutes)

### As a Library

```typescript
import { rei } from 'rei-lang';

// Multi-dimensional numbers: center-periphery computation
rei('let field = 𝕄{5; 1, 2, 3, 4}');
rei('field |> compute :weighted');       // → 7.5
rei('field |> compute :harmonic');       // → harmonic aggregation

// Functions compress complexity
rei('compress distance(x, y) = sqrt(x * x + y * y)');
rei('distance(3, 4)');                   // → 5

// Pipes flow naturally
rei('-25 |> abs |> sqrt');               // → 5
rei('[5, 3, 8, 1] |> sort |> reverse');  // → [8, 5, 3, 1]

rei.reset(); // clear state between sessions
```

### Interactive REPL

```bash
npx rei
```

```
 ╔══════════════════════════════════════════╗
 ║  Rei (0₀式) REPL v0.5.2                ║
 ║  D-FUMT Computational Language          ║
 ╚══════════════════════════════════════════╝

零 > 𝕄{5; 1, 2, 3, 4} |> compute :weighted
7.5

零 > 𝕄{5; 1, 2, 3} |> sigma
{ field: { center: 5, ... }, flow: { ... }, memory: { ... }, ... }
```

---

## Core Concepts

### 𝕄 — Multi-Dimensional Numbers

The fundamental data type. A center value surrounded by neighbors, computed in four modes:

```rei
let m = 𝕄{5; 1, 2, 3, 4}

m |> compute :weighted       // center + weighted avg of neighbors
m |> compute :multiplicative  // center × Π(1 + nᵢ)
m |> compute :harmonic        // center + n / Σ(1/|nᵢ|)
m |> compute :exponential     // center × avg(e^nᵢ)
```

This isn't an array with an index. It's a value with spatial awareness — the center knows its periphery.

### σ (Sigma) — Six Attributes

Every value in Rei carries six attributes, accessible via `|> sigma`:

| Attribute | 日本語 | What it tracks |
|-----------|--------|---------------|
| **field** | 場 | Spatial context: center, neighbors, dimension |
| **flow** | 流れ | Temporal state: velocity, acceleration, phase |
| **memory** | 記憶 | History: past operations, trajectory, causes |
| **layer** | 層 | Structural depth: nesting, components |
| **relation** | 関係 | Connections: bindings, dependencies, entanglements |
| **will** | 意志 | Intention: tendency, strength, prediction |

### Relation Deep — 縁起的追跡

Track how values depend on each other:

```rei
let mut a = 𝕄{5; 1, 2}
let mut b = 𝕄{10; 3, 4}
a |> bind("b", "mirror")        // create a relation

a |> trace                       // dependency chain (BFS, cycle-safe)
a |> influence("b")              // influence score between values
a |> entangle("b")               // deep bidirectional entanglement
// also: 追跡, 影響("b"), 縁起("b") — full Japanese support
```

### Will Deep — 意志の自律性

Values can carry and evolve intentions:

```rei
let mut x = 𝕄{5; 1, 2, 3}
x |> intend("maximize")         // set intention
x |> will_evolve                 // autonomous evolution based on history

let mut y = 𝕄{10; 4, 5}
y |> intend("minimize")
x |> bind("y")
x |> will_align("y")             // harmonize intentions
x |> will_conflict("y")          // detect and resolve tension
// also: 意志進化, 意志調律("y"), 意志衝突("y")
```

### Genesis Axiom System — 生成公理系

Computational emergence from void:

```rei
let g = genesis()    // void
g |> forward         // void → dot
g |> forward         // dot → line
g |> forward         // line → surface
g |> forward         // surface → solid
g |> forward         // solid → omega (Ω)
```

### Compress — 関数定義

Functions are defined with `compress`, reflecting D-FUMT's compression philosophy:

```rei
compress energy(m) = m |> compute :weighted
compress karma(i, e, r) = i * e * r

energy(𝕄{0; 10, 20, 30})   // → 20
karma(0.8, 0.9, 0.7)        // → 0.504
```

---

## Benchmarks

### Code Reduction

| Task | Conventional | Rei | Reduction |
|------|-------------|-----|-----------|
| Image kernel computation | 32 lines | 8 lines | **4×** |
| Multi-dimensional aggregation | 45 lines | 12 lines | **3.7×** |
| Graph structure transformation | 52 lines | 14 lines | **3.7×** |
| **Average** | | | **74%** |

See [`benchmarks/`](./benchmarks/) for runnable comparisons with equivalent Python code.

### What Benchmarks Don't Capture

The deeper advantage isn't line count — it's **what you don't have to build**. In Rei, dependency tracking, metadata propagation, and structural awareness are free. In other languages, they're projects.

---

## Agent Runtime (v0.5)

Rei includes a self-organizing agent system where entities perceive, decide, and act autonomously:

```rei
// Spawn agents from values
let mut a = 𝕄{10; 1, 2, 3} |> agent
a |> agent_sigma                          // full agent state

// Puzzle solving: 81 cooperative agents solve sudoku
30 |> generate_sudoku(42) |> agent_solve

// Game playing: competitive match
"tic_tac_toe" |> game |> agent_match
```

Puzzles and games are the same abstraction — the only difference is agent behavior and mediator strategy.

---

## Bilingual Support (日本語対応)

All commands have Japanese aliases:

```rei
𝕄{5; 1, 2, 3} |> sigma           // English
𝕄{5; 1, 2, 3} |> 自律σ           // 日本語

"b" |> bind("a")                   // English
"b" |> 結合("a")                   // 日本語

// trace → 追跡, influence → 影響, entangle → 縁起
// will_evolve → 意志進化, will_align → 意志調律
```

See [full command reference](./docs/KANJI-README.md) for the complete bilingual table.

---

## Documentation

| Document | Content |
|----------|---------|
| [TUTORIAL.md](./docs/TUTORIAL.md) | Getting started in 15 minutes |
| [KANJI-README.md](./docs/KANJI-README.md) | Full bilingual command reference |
| [PHASE4D-DESIGN.md](./PHASE4D-DESIGN.md) | Current development phase |
| [ARCH.md](./ARCH.md) | Architecture overview |
| [spec/](./spec/) | BNF specification (v0.3) |
| [theory/](./theory/) | D-FUMT theoretical foundation (66 theories) |

---

## Theoretical Foundation

Rei is grounded in **D-FUMT** (Dimensional Fujimoto Universal Mathematical Theory), a framework of 66 interconnected theories. The language's core innovation — center-periphery patterns and six-attribute metadata — derives from D-FUMT's multi-dimensional number system and consciousness mathematics.

Key theoretical concepts:
- **Extended Zero** (0₀, 0₀₀, 0owo) — dimensional extension of zero
- **Four-Valued Logic** (⊤, ⊥, ⊤π, ⊥π) — beyond true/false
- **Genesis Axioms** — computational emergence from void
- **RCT** (Rei Compression Theory) — generative compression

See [`theory/`](./theory/) for complete documentation.

---

## ☮️ Peace Use Clause

Rei is licensed under Apache 2.0 with a Peace Use Clause. It is designed exclusively for the peaceful advancement of humanity.

🚫 Weapons, military systems, or autonomous lethal weapons
🚫 Human rights violations
🚫 Intentional environmental destruction

✅ Education, research, humanitarian aid, and creative endeavors

See [PEACE_USE_CLAUSE.md](./PEACE_USE_CLAUSE.md) for details.

---

Apache 2.0 © Nobuki Fujimoto
