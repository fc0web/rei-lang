# Rei (0₀式 / れいしき)

**A mathematical computation system and programming language based on D-FUMT.**

[![npm version](https://img.shields.io/npm/v/rei-lang.svg)](https://www.npmjs.com/package/rei-lang)
[![License: Apache 2.0](https://img.shields.io/badge/License-Apache_2.0-blue.svg)](LICENSE)
[![DOI](https://zenodo.org/badge/DOI/10.5281/zenodo.18651614.svg)](https://doi.org/10.5281/zenodo.18651614)
[![SSRN](https://img.shields.io/badge/SSRN-6243598-blue)](https://papers.ssrn.com/sol3/papers.cfm?abstract_id=6243598)
[![ORCID](https://img.shields.io/badge/ORCID-0009--0004--6019--9258-green)](https://orcid.org/0009-0004-6019-9258)

> 表記の別名宣言: 正式記号は `0₀` (Unicode) / `0_{0}` (LaTeX) / `0_0` (code)。すべて同一概念。

---

## 📄 Publications

| Resource | Link |
|----------|------|
| **Preprint (Zenodo)** | [![DOI](https://zenodo.org/badge/DOI/10.5281/zenodo.18651614.svg)](https://doi.org/10.5281/zenodo.18651614) |
| **Preprint (SSRN)** | [SSRN Abstract #6243598](https://papers.ssrn.com/sol3/papers.cfm?abstract_id=6243598) |
| **ORCID** | [0009-0004-6019-9258](https://orcid.org/0009-0004-6019-9258) |
| **GitHub** | [fc0web/rei-lang](https://github.com/fc0web/rei-lang) |
| **npm** | [rei-lang](https://www.npmjs.com/package/rei-lang) |

---

## Overview

Rei is a computation system that extends the concept of "number" from a point to a field. Built on **D-FUMT** (Dimensional Fujimoto Universal Mathematical Theory) by Nobuki Fujimoto, it provides:

* **Multi-Dimensional Numbers** — Center + neighbor values with directional computation
* **Extended Number System** — Zero/π extension theory with infinite-dimensional subscript space
* **Genesis Axiom System** — Axiomatization of "what comes before zero"
* **GFT (Graphic Formula Theory)** — Visual graph representation of mathematical formulas
* **Rei Language** — Programming language with `compress`, pipe operators, extension/reduction primitives

## Install

```
npm install rei-lang
```

## Quick Start

```typescript
import { mdnum, compute, ComputationMode } from 'rei-lang';

// Multi-dimensional number: center=5, neighbors=[1,2,3,4]
const md = mdnum(5, [1, 2, 3, 4]);
const result = compute(md);
console.log(result.value); // 7.5 (weighted average)

// With mode selection
const harmonic = mdnum(0, [2, 4, 6], undefined, ComputationMode.Harmonic);
console.log(compute(harmonic).value); // harmonic mean
```

## Modules

### Core — Multi-Dimensional Numbers

```typescript
import { mdnum, compute, computeGrid, detectSymmetry } from 'rei-lang';

// Basic multi-dimensional number
const md = mdnum(10, [2, 4, 6, 8]);
const result = compute(md);
// result.value = 15
// result.symmetry = 'full'

// Clockwise vs counter-clockwise
const cw = mdnum(0, [1, 2, 3], [1, 2, 3], ComputationMode.Weighted, 'cw');
const ccw = mdnum(0, [1, 2, 3], [1, 2, 3], ComputationMode.Weighted, 'ccw');

// Grid computation (8-neighbor)
const grid = [[1,2,3],[4,5,6],[7,8,9]];
computeGrid(grid, 1, 1); // computes center cell with 8 neighbors
```

### Core — Extended Numbers (Zero/π Extension)

```typescript
import { subscript, extnum, extend, reduce, toNotation, parseSubscript } from 'rei-lang';

// Create 0ooo (3rd degree extension of zero)
const sub = subscript(0, ['o', 'o', 'o']);
const en = extnum(sub);

// Notation Equivalence (記法同値公理)
const notation = toNotation(sub);
// notation.sensory    → "0ooo"      (感覚層)
// notation.dialogue   → "0_o3"      (対話層)
// notation.structural → "0(o,3)"    (構造層)
// notation.semantic   → JSON        (意味層)

// Parse from any notation form
parseSubscript('0ooo');   // ✓
parseSubscript('0_o3');   // ✓
parseSubscript('0(o,3)'); // ✓

// Extension/Reduction chains
const extended = extend(en, 'x');  // 0ooo → 0ooox (⊕)
const reduced = reduce(extended);  // 0ooox → 0ooo (⊖)
```

### Genesis Axiom System

```typescript
import { genesis } from 'rei-lang';
const { createGenesis, evolve, runFullGenesis, verifyTheoremS0, verifyTheoremS1 } = genesis;

// Run full genesis: void → ・ → 0₀ → 0 → ℕ
const state = runFullGenesis();
console.log(state.phase); // 'number'
console.log(state.history); // all transitions with axiom references

// Verify theorems
const s0 = verifyTheoremS0(state); // Theorem S₀: unique ・ →G 0₀
const s1 = verifyTheoremS1(state); // Theorem S₁: unique 0₀ →G 0
console.log(s0.valid); // true
console.log(s1.valid); // true
```

### GFT — Graphic Formula Theory

```typescript
import { gft } from 'rei-lang';
import { mdnum } from 'rei-lang';

// Visualize a multi-dimensional number as a radial graph
const md = mdnum(5, [1, 2, 3, 4, 5, 6]);
const graph = gft.fromMultiDim(md);

// Apply layout and render to SVG
const svg = gft.renderToString(graph, 'radial', 600, 400);
// → Complete SVG string with animated edges and glowing nodes

// Genesis visualization
const genesisGraph = gft.fromGenesis();
const genesisSvg = gft.renderToString(genesisGraph, 'hierarchical');

// Graph transforms
const extended = gft.applyTransform(graph, {
  type: 'extend',
  nodeId: graph.nodes[0].id,
  char: 'x',
});

// Statistics
const stats = gft.graphStats(graph);
// { nodeCount: 7, edgeCount: 6, kindDistribution: {...}, maxDepth: 1 }
```

#### Layout Algorithms

| Algorithm | Best For | Description |
|-----------|----------|-------------|
| `radial` | Multi-dimensional numbers | Center-outward radiation |
| `hierarchical` | Genesis axiom system | Top-down phase progression |
| `tree` | Expression trees | Parent-child formula structure |
| `grid` | Grid computations | Matrix-like arrangement |
| `force` | General graphs | Force-directed spring model |

### Rei Language

```typescript
import { lang } from 'rei-lang';

// Arithmetic
lang.run('2 + 3 * 4');  // [14]

// Immutable binding (value fixation axiom)
lang.run('bind x = 42');

// compress = function definition (compression philosophy)
lang.run('compress double(x) -> x * 2');
lang.run('double(21)');  // [42]

// Pipe operator (center → outward radiation)
lang.run('compress inc(x) -> x + 1');
lang.run('41 |> inc');  // [42]

// Multi-dimensional number literal
lang.run('[5; 1, 2, 3, 4]');  // MultiDim computation

// Extension/Reduction operators
lang.run('0oo ⊕ x');  // extend: 0oo → 0oox
lang.run('0oox ⊖');   // reduce: 0oox → 0oo
```

#### Language Design Philosophy

| Feature | Rei Concept | Rationale |
|---------|-------------|-----------|
| `compress` | 圧縮 (compression) | Functions compress computation into reusable form |
| `bind` | 値固定公理 | Immutable by default — once bound, cannot rebind |
| `\|>` | 中心→外放射 | Data flows outward from center, like multi-dim numbers |
| `⊕` / `⊖` | 拡張・縮約 | First-class extension/reduction operators |
| `[c; n₁, n₂]` | 多次元数リテラル | Direct multi-dimensional number construction |

## Theory Background

### D-FUMT (Dimensional Fujimoto Universal Mathematical Theory)

A comprehensive framework of 66+ interconnected theories spanning:

* Pure mathematics (multi-dimensional number theory, zero extension)
* Information theory (Cosmic Library Theory)
* AI consciousness and beyond

### Genesis Axiom System — "What comes before zero?"

```
void → ・(dot) → 0₀ → 0 → ℕ → ...
       G-E₁       G-S₀   G-S₁  G-N₁
```

The Genesis Axiom System formalizes the emergence of number from pre-mathematical existence.
Theorem S₀ and S₁ prove uniqueness of transitions under the general position assumption (CS).

### GFT (Graphic Formula Theory)

GFT represents mathematical formulas as directed graphs:

* **Nodes** = mathematical objects (values, operators, functions, multi-dim numbers)
* **Edges** = mathematical relationships (input, output, extension, genesis transitions)
* Integrates seamlessly with Rei's core: multi-dim center/neighbor → radial graph layout

## Benchmarks — Proven Expressiveness

Rei demonstrates **average 74% code reduction** vs conventional approaches:

| Task | Conventional | Rei | Reduction | Key Advantage |
|------|-------------|-----|-----------|---------------|
| Image Kernel | 32 lines (JS) | 8 lines | **4× shorter** | 4-level nested loops → 0 nesting |
| Data Aggregation | 45 lines (Python) | 12 lines | **3.7× shorter** | Mode switch: +15 lines → +1 keyword |
| Graph Transform | 52+ lines (D3.js) | 14 lines | **3.7× shorter** | Manual graph ops → ⊕/⊖ operators |

The fundamental advantage: **center-neighbor pattern as a language primitive**.

## Author

**Nobuki Fujimoto** (藤本伸樹)

* ORCID: [0009-0004-6019-9258](https://orcid.org/0009-0004-6019-9258)
* Wikidata: D-FUMT, Rei Computation System

## License

This repository uses a **dual licensing** structure:

| Content | License | Location |
|---------|---------|----------|
| Source code (`/src`, `/tests`, `/examples`) | **Apache License 2.0** | [LICENSE](LICENSE) |
| Theoretical documents (`/theory`) | **CC BY-NC-SA 4.0** | [LICENSE-THEORY.md](theory/LICENSE-THEORY.md) |

**Source code** — Free for commercial and non-commercial use, with attribution.

**Theory documents** — Free for non-commercial use with attribution. Commercial use (educational materials, certification programs, paid courses) requires written permission from the author.

**Derivative works:** Any system, course, certification, or publication that reproduces the core structures, definitions, axioms, or evaluation methods of Rei / D-FUMT — regardless of naming — is considered a derivative work subject to these license terms.

Copyright 2024-2026 Nobuki Fujimoto (藤本伸樹)

> ⚠️ **Certification Notice:** As of 2026, there are **NO** authorized third-party paid certifications based on Rei or D-FUMT. Only certification programs explicitly designated as "Official Rei / D-FUMT Certification" by Nobuki Fujimoto represent the authentic framework.

## Citation

If you use Rei in academic work, please cite:

```bibtex
@misc{fujimoto2026rei,
  author       = {Fujimoto, Nobuki},
  title        = {Rei: A Four-Axiom Foundation for Computational Existence Theory},
  year         = {2026},
  doi          = {10.5281/zenodo.18651614},
  url          = {https://doi.org/10.5281/zenodo.18651614},
  publisher    = {Zenodo}
}
```

**Other resources:**
- Zenodo: [10.5281/zenodo.18651614](https://doi.org/10.5281/zenodo.18651614)
- SSRN: [Abstract #6243598](https://papers.ssrn.com/sol3/papers.cfm?abstract_id=6243598)
- GitHub: [fc0web/rei-lang](https://github.com/fc0web/rei-lang)

---

**"Rei"**, **"0₀式"**, **"D-FUMT"**, and **"GFT"** are trademarks of Nobuki Fujimoto.
