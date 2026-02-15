# Rei (0₀式 / れいしき)

**A mathematical computation system and programming language based on D-FUMT.**

[![npm version](https://img.shields.io/npm/v/rei-lang.svg)](https://www.npmjs.com/package/rei-lang)
[![tests](https://img.shields.io/badge/tests-1569%20passing-brightgreen.svg)](https://github.com/fc0web/rei-lang)
[![domains](https://img.shields.io/badge/domains-7%20connected-blueviolet.svg)](https://github.com/fc0web/rei-lang)
[![axioms](https://img.shields.io/badge/axioms-4%20irreducible-orange.svg)](theory/REI-MINIMAL-AXIOMS.md)
[![License: Apache 2.0](https://img.shields.io/badge/License-Apache_2.0-blue.svg)](LICENSE)

> 表記の別名宣言: 正式記号は `0₀` (Unicode) / `0_{0}` (LaTeX) / `0_0` (code)。すべて同一概念。

### 🔴 [Live Demo — Cross-Domain Computation](https://fc0web.github.io/rei-lang/)

> Particle physics → Art → Music in real-time. See 36-direction domain bridges in action.

---

## Overview

Rei is a computation system that extends the concept of "number" from a point to a field. Built on **D-FUMT** (Dimensional Fujimoto Universal Mathematical Theory) by Nobuki Fujimoto, it provides:

* **Multi-Dimensional Numbers** — Center + neighbor values with directional computation
* **Extended Number System** — Zero/π extension theory with infinite-dimensional subscript space
* **Genesis Axiom System** — Axiomatization of "what comes before zero"
* **GFT (Graphic Formula Theory)** — Visual graph representation of mathematical formulas
* **Rei Language** — Programming language with `compress`, pipe operators, extension/reduction primitives
* **7-Domain Network** — Cross-domain computation across Natural Science, Information Engineering, Humanities, Art, Music, Economics, and Linguistics with 36-direction bridges

## Minimal Axiom System — 4 Irreducible Axioms

The entire Rei system is built on exactly **4 irreducible axioms**. Everything else — 1,533 tests, 7 domains, 36 bridges, agents, evolve, and all other features — is derived from these four:

| Axiom | Name | Axis | Core Idea |
| --- | --- | --- | --- |
| **A1** | Center-Periphery | Space | Values are fields, not points. Every value has a center and neighbors |
| **A2** | Extension-Reduction | Depth | Values can be extended (⊕) and reduced (⊖) one step at a time |
| **A3** | Sigma Accumulation | Time | Every transformation leaves a trace. Values are self-referential |
| **A4** | Genesis Phase Transition | Existence | Existence arises from nothing in irreversible stages: void → ・ → 0₀ → 0 → ℕ |

Four orthogonal axes — space, depth, time, existence — form the complete foundation.

For comparison: λ-calculus has 3 rules (computation only), Peano has 5 axioms (natural numbers only), ZFC has 9 axioms (sets only). Rei covers both computation and ontology in 4.

📄 **[Full formal specification → theory/REI-MINIMAL-AXIOMS.md](theory/REI-MINIMAL-AXIOMS.md)**

## 7-Domain Cross-Domain Network

Rei v0.5.5 achieves full interconnection across 7 knowledge domains:

```
        B: Natural Science
       / | \
      /  |  \
  C: Info    E: Art
  Eng. |  ×  | \
      \| / \ |  F: Music
   D: Human  | /
    ities \  |/
        G: Economics
          |
      H: Linguistics

  ← 36-direction bridges →
  All domains fully connected
```

| Domain | Code | Focus | Example |
| --- | --- | --- | --- |
| Natural Science | B | Physics, N-body simulation | Particle systems, energy fields |
| Information Engineering | C | ETL, data pipelines | Stream processing, agents |
| Humanities | D | Text analysis, ethics | Genealogy modeling, logic |
| Art | E | Visual patterns, generative art | Color fields, complexity metrics |
| Music | F | Melodic computation, scales | Tempo, harmony, note generation |
| Economics | G | Market models, game theory | Supply-demand, equilibrium |
| Linguistics | H | Syntax trees, morphology | Parse structures, semantics |

Every domain pair is connected by bidirectional bridges (7 × 6 / 2 × ... = 36 directed bridges), enabling seamless transformation:

```javascript
// Rei: One pipe transforms between any two domains
import { simulateParticles, simToArt, artToMusic } from 'rei-lang';

const sim = simulateParticles(30, 200);   // B: Physics simulation
const art = sim |> simToArt;              // B → E: Simulation becomes art
const melody = art |> artToMusic;         // E → F: Art becomes music
// Every transformation preserves σ — field, flow, memory, layer, relation, will
```

## Install

```
npm install rei-lang
```

## Quick Start

```javascript
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

```javascript
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

```javascript
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

```javascript
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

```javascript
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
| --- | --- | --- |
| `radial` | Multi-dimensional numbers | Center-outward radiation |
| `hierarchical` | Genesis axiom system | Top-down phase progression |
| `tree` | Expression trees | Parent-child formula structure |
| `grid` | Grid computations | Matrix-like arrangement |
| `force` | General graphs | Force-directed spring model |

### Rei Language

```javascript
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
| --- | --- | --- |
| `compress` | 圧縮 (compression) | Functions compress computation into reusable form |
| `bind` | 値固定公理 | Immutable by default — once bound, cannot rebind |
| `\|>` | 中心→外放射 | Data flows outward from center, like multi-dim numbers |
| `⊕` / `⊖` | 拡張・縮約 | First-class extension/reduction operators |
| `[c; n₁, n₂]` | 多次元数リテラル | Direct multi-dimensional number construction |

## 6-Attribute System (σ-deep)

Every Rei value carries six metadata attributes that persist across transformations:

| Attribute | Japanese | Role |
| --- | --- | --- |
| **field** (場) | ば | Spatial context and domain membership |
| **flow** (流れ) | ながれ | Temporal direction and data movement |
| **memory** (記憶) | きおく | Transformation history and lineage |
| **layer** (層) | そう | Abstraction depth and nesting level |
| **relation** (関係) | かんけい | Connections to other values |
| **will** (意志) | いし | Autonomous behavior and agent intent |

These 6 attributes are the observable manifestation of **Axiom A3 (Sigma Accumulation)**. They are not independent axioms — they are derived from the single principle that "every transformation leaves a trace."

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

The Genesis Axiom System (**Axiom A4**) formalizes the emergence of number from pre-mathematical existence. No other computation system axiomatizes the origin of existence itself.

Theorem S₀ and S₁ prove uniqueness of transitions under the general position assumption (CS).

### GFT (Graphic Formula Theory)

GFT represents mathematical formulas as directed graphs:

* **Nodes** = mathematical objects (values, operators, functions, multi-dim numbers)
* **Edges** = mathematical relationships (input, output, extension, genesis transitions)
* Integrates seamlessly with Rei's core: multi-dim center/neighbor → radial graph layout

## Benchmarks — Proven Expressiveness

Rei demonstrates **average 74% code reduction** vs conventional approaches:

| Task | Conventional | Rei | Reduction | Key Advantage |
| --- | --- | --- | --- | --- |
| Image Kernel | 32 lines (JS) | 8 lines | **4× shorter** | 4-level nested loops → 0 nesting |
| Data Aggregation | 45 lines (Python) | 12 lines | **3.7× shorter** | Mode switch: +15 lines → +1 keyword |
| Graph Transform | 52+ lines (D3.js) | 14 lines | **3.7× shorter** | Manual graph ops → ⊕/⊖ operators |

The fundamental advantage: **center-neighbor pattern as a language primitive** (Axiom A1).

## Theoretical Documents

| Document | Description |
| --- | --- |
| [REI-MINIMAL-AXIOMS.md](theory/REI-MINIMAL-AXIOMS.md) | Formal specification of the 4 irreducible axioms |
| [AXIOM-INDEPENDENCE.md](theory/AXIOM-INDEPENDENCE.md) | Independence proof sketch: counter-models M₁–M₄ |
| [AXIOM-DERIVATIONS.md](theory/AXIOM-DERIVATIONS.md) | Derivation proof sketch: 15 theorems from 4 axioms |
| [TEST-AXIOM-MAP.md](theory/TEST-AXIOM-MAP.md) | Test-axiom dependency map: all tests classified by axiom |
| [SELF-AWARE-REDEFINITION.md](theory/SELF-AWARE-REDEFINITION.md) | Mathematical redefinition of Self-Aware Value as σ-annotated value |
| [PHASE7-DESIGN.md](theory/PHASE7-DESIGN.md) | Phase 7 design: Autonomous computation layer + Alternative systems |
| [genesis-axiom-system.md](theory/genesis-axiom-system.md) | Genesis Axiom System — "What comes before zero?" |
| [d-fumt-overview.md](theory/d-fumt-overview.md) | D-FUMT theoretical framework overview |
| [AXIOM-INVENTORY.md](AXIOM-INVENTORY.md) | Full axiom inventory: classification of all concepts as axiom, theorem, or decoration |

## Version History

| Version | Tests | Key Milestones |
| --- | --- | --- |
| v0.2.0 | 91 | Initial release — Lexer, Parser, Evaluator, Genesis Axiom, GFT |
| v0.2.1 | 91 | npm publish, license alignment (Apache 2.0) |
| v0.5.2 | 799 | Phase 4a–4c: AgentSpace, puzzle reasoning, game behavior, tactical perception |
| v0.5.3 | 975 | Phase 4d: P1–P5 stabilization, relation/will × AgentSpace, education demo |
| v0.5.4 | 1360 | Phase 5.5–6: 6-attribute full cascade, 4 new domains (E/F/G/H), type system |
| v0.5.4+ | 1459 | Phase 6.5: EFGH cross-integration, 24-direction bridges |
| **v0.5.5** | **1533** | **Phase 6.7: 7-domain full connection, 36-direction bridges, structural philosophy unification** |
| v0.5.5+ | 1569 | Axiom reduction: 4 minimal axioms, independence proofs, A4 test suite |

## Roadmap

### Phase 7: Autonomous Computation Layer (Next)

Phase 7 extends Rei in two directions simultaneously:

**Direction A — Deepening: σ-interaction (Phase 7a–7d)**

The 6 attributes evolve from static metadata to a dynamic interaction system:

```
Layer 4: Autopoiesis     ← Phase 7d   Values generate new values
Layer 3: Interaction      ← Phase 7b-c  Attributes influence each other
Layer 2: Tracking         ← Current     6 attributes as metadata
Layer 1: Deterministic    ← Current     Pure computation (mdnum, compute, pipe)
```

Phase 7a defines 12 interaction rules between attributes (e.g., "will changes flow", "memory accumulation alters layer"). Target: +120 tests.

**Direction B — Inclusion: Alternative Systems (Phase 7e)**

Parallel computation systems connected to Rei's core via the same bridge mechanism used for 7-domain integration:

* **Quantum Genesis** — Superposition-based phase transitions
* **Categorical Genesis** — Category-theoretic formalization with functors
* **Cellular Genesis** — Cellular automaton approach to emergence

All alternatives are derivable from the 4 axioms (proven in [AXIOM-DERIVATIONS.md](theory/AXIOM-DERIVATIONS.md)).

**Test target:** 1,569 → 2,063 (+494 tests across Phase 7a–7e)

📄 **[Full Phase 7 design → theory/PHASE7-DESIGN.md](theory/PHASE7-DESIGN.md)**

## Author

**Nobuki Fujimoto** (藤本伸樹)

* ORCID: [Nobuki Fujimoto](https://orcid.org/)
* Wikidata: D-FUMT, Rei Computation System

## License

This repository uses a **dual licensing** structure:

| Content | License | Location |
| --- | --- | --- |
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
@software{fujimoto2026rei,
  author       = {Fujimoto, Nobuki},
  title        = {Rei (0₀式): Mathematical Computation System based on D-FUMT},
  year         = {2026},
  license      = {Apache-2.0},
  url          = {https://github.com/fc0web/rei-lang}
}
```

---

**"Rei"**, **"0₀式"**, **"D-FUMT"**, and **"GFT"** are trademarks of Nobuki Fujimoto.
