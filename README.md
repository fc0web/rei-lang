# Rei (0₀式) — D-FUMT Computational Language

[![npm version](https://img.shields.io/npm/v/rei-lang)](https://www.npmjs.com/package/rei-lang)
[![License: MIT](https://img.shields.io/badge/License-MIT-gold.svg)](./LICENSE)
[![Tests](https://img.shields.io/badge/tests-85%2F85-brightgreen)]()

**Rei** (0₀式 / れいしき) is a mathematical computation language based on **D-FUMT** (Dimensional Fujimoto Universal Mathematical Theory). Its center-periphery patterns as language primitives achieve an **average 74% code reduction** over equivalent implementations in general-purpose languages.

**Author:** Nobuki Fujimoto

---

## Install

```bash
npm install rei-lang
```

## Quick Start

### As a Library

```typescript
import { rei } from 'rei-lang';

// Multi-dimensional number computation
rei('let field = 𝕄{5; 1, 2, 3, 4}');
const result = rei('field |> compute :weighted');
console.log(result); // 7.5

// Define functions with compress
rei('compress energy(m) = m |> compute :weighted');
rei('let e = energy(𝕄{0; 10, 20, 30})');
console.log(rei('e')); // 20

// Genesis axiom system
rei('let g = genesis()');
rei('g |> forward');
rei('g |> forward');
console.log(rei('g.state')); // "line"

// Reset state between sessions
rei.reset();
```

### Interactive REPL

```bash
npx rei
```

```
 ╔══════════════════════════════════════════╗
 ║  Rei (0₀式) REPL v0.2.0                  ║
 ║  D-FUMT Computational Language           ║
 ╚══════════════════════════════════════════╝

零 > 𝕄{5; 1, 2, 3, 4} |> compute :weighted
7.5

零 > compress karma(i, e, r) = i * e * r
compress karma(i, e, r)

零 > karma(0.8, 0.9, 0.7)
0.504
```

### Execute a File

```bash
npx rei program.rei
```

### Inline Evaluation

```bash
npx rei -e "2 + 3 * 4"
# → 14
```

---

## Language Features

### Multi-Dimensional Numbers (𝕄)

The core data structure. A center value with peripheral neighbors, computed in 4 modes:

```rei
let m = 𝕄{5; 1, 2, 3, 4}

m |> compute :weighted       // center + weighted avg of neighbors
m |> compute :multiplicative  // center × Π(1 + nᵢ)
m |> compute :harmonic        // center + n / Σ(1/|nᵢ|)
m |> compute :exponential     // center × avg(e^nᵢ)
```

### Extended Numbers (拡張数)

Numbers with subscript-based dimensional extension:

```rei
let a = 0ooo       // 3rd-order extension of zero
a >> :x >> :x      // extend: order 3 → 5
a <<               // reduce: order 3 → 2
a |> valStar       // numeric projection: 0.001

πooo               // π extended to 3rd order
0₀                 // D-FUMT zero symbol
```

### Compress (関数定義)

Functions are defined with `compress` — reflecting D-FUMT's compression philosophy:

```rei
compress distance(x, y) = sqrt(x * x + y * y)
compress field(c, r) = 𝕄{c; r, r, r, r}

distance(3, 4)           // 5
field(10, 2) |> compute :weighted  // 12
```

### Pipe Operator (|>)

Center-to-periphery data flow:

```rei
-25 |> abs |> sqrt              // 5
[3, 1, 2] |> sort |> reverse    // [3, 2, 1]
"hello" |> upper                // "HELLO"
𝕄{0; 1, 2, 3} |> normalize     // normalized neighbors
```

### Genesis Axiom System (生成公理系)

Models computational emergence from void:

```rei
let g = genesis()   // void
g |> forward        // void → dot
g |> forward        // dot → line
g |> forward        // line → surface
g |> forward        // surface → solid
g |> forward        // solid → omega (Ω)
g.omega             // 1
```

Or from the primordial dot (・):

```rei
let g = ・
g |> forward        // dot
g |> forward        // line
```

### Four-Valued Logic (四価0π)

Beyond true/false — Theory #21:

```rei
⊤           // true
⊥           // false
⊤π          // true-pi (π-rotated truth)
⊥π          // false-pi

¬⊤          // ⊥
⊤ ∧ ⊥      // ⊥
⊥ ∨ ⊤      // ⊤
```

### Variable Binding

```rei
let x = 42           // immutable
let mut y = 10       // mutable
```

---

## Benchmarks

| Task | Conventional | Rei | Reduction |
|------|-------------|-----|-----------|
| Image kernel calculations | 32 lines | 8 lines | **4×** |
| Multi-dimensional data aggregation | 45 lines | 12 lines | **3.7×** |
| Graph structure transformation | 52 lines | 14 lines | **3.7×** |
| **Average** | | | **74%** |

---

## API Reference

### `rei(code: string): ReiValue`

Evaluate a string of Rei code. State persists across calls.

### `rei.reset(): void`

Clear all variable and function bindings.

### `rei.parse(code: string): ASTNode`

Parse code and return the AST without evaluating.

### `rei.tokenize(code: string): Token[]`

Tokenize code and return the token stream.

### Classes

- `Lexer` — Tokenizer
- `Parser` — Recursive descent parser
- `Evaluator` — AST evaluator with environment/scope chain
- `Environment` — Scope management

### Types

- `MultiDimNumber` — `{ center, neighbors, mode, weights? }`
- `ReiExtended` — `{ base, order, subscripts, valStar() }`
- `GenesisState` — `{ state, omega, history }`
- `ReiFunction` — `{ name, params, body, closure }`
- `Quad` — `{ value: 'top' | 'bottom' | 'topPi' | 'bottomPi' }`

---

## BNF Specification

The complete BNF v0.2 specification is available in the repository.

Key features integrated from 21 D-FUMT theories:
- 45 keywords, 10 operators, 9 types
- Full backward compatibility with v0.1
- Complete operator precedence table

---

## Theoretical Foundation

Rei is grounded in **D-FUMT** (Dimensional Fujimoto Universal Mathematical Theory), a framework of 66 interconnected theories spanning pure mathematics to philosophy and AI consciousness. The language's core innovation — **center-periphery patterns as language primitives** — derives from D-FUMT's multi-dimensional number system theory.

---

## License

MIT © Nobuki Fujimoto
