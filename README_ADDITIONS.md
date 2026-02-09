<!-- ============================================================
     README ADDITIONS — Add these sections to your existing README.md
     Insert after the "Genesis Axiom System" section
     ============================================================ -->

### Genesis Axiom System v2 (GA-v2)

```typescript
import {
  createGenesis,
  evolve,
  runFullGenesis,
  verifyTheoremS0,
  verifyTheoremS1,
  verifyMonotonicity,
  verifyAllWitnesses,
} from './src/genesis/genesis-axioms-v2';

// Run full genesis: void → ・ → 0₀ → 0 → ℕ
const state = runFullGenesis(0.3);

// Machine verification with witness system
console.log(verifyTheoremS0(state));    // { valid: true, csHolds: true, ... }
console.log(verifyTheoremS1(state));    // { valid: true, csHolds: true, ... }
console.log(verifyMonotonicity(state)); // { valid: true, deltas: [1,1,1,1] }
console.log(verifyAllWitnesses(state)); // { valid: true, count: 4 }
```

**v2 improvements over v1:**
- **Witness system** — Cryptographic witnesses for each phase transition
- **CS (General Position) Assumption** — S₀/S₁ are conditional theorems
- **Monotonicity guarantee** — Firewall Rule prevents backtracking/skipping
- **Hash-based integrity** — FNV-1a for reproducible verification

### ISL — Irreversible Syntax Layer (不可逆構文層)

ISL enforces that state transformations in the Genesis pipeline are **irreversible at both compile-time and runtime**.

```typescript
import {
  createPipeline,
  applyRule,
  RULE_PHI_NORMALIZE,
  RULE_PSI_COMMIT,
  RULE_OMEGA_COMPACT,
} from './src/genesis/irreversible-syntax';

// Type-safe pipeline: Open → Sealed → Compacted
let p = createPipeline(genesisState);           // OpenPipeline
p = applyRule(p, RULE_PHI_NORMALIZE);           // OpenPipeline (normalized)
const sealed = applyRule(p, RULE_PSI_COMMIT);   // SealedPipeline
const proof = applyRule(sealed, RULE_OMEGA_COMPACT); // CompactedPipeline

// ❌ Compile error — TypeScript prevents regression
phiNormalize(sealed);  // TS2345: SealedPipeline ≠ OpenPipeline

// ❌ Runtime error — Firewall catches type-cast bypass
const hacked = sealed as unknown as OpenPipeline;
phiNormalize(hacked);  // Error: firewall detects sealed=true
```

**Key features:**
- **Discriminated union types** — `Open | Sealed | Compacted` (compile-time enforcement)
- **Runtime firewalls** — Defense-in-depth against `as unknown as` bypass
- **applyRule DSL** — Unified 6-step pipeline: firewall → pre → apply → post → mark → record
- **31 adversarial tests** — History tampering, witness attacks, seal forgery, type-cast bypass
- **110 tests passing** (GA-v2: 79 + ISL: 31)

### GFT Pipeline Tracer — Interactive Debug & Education Tool

An interactive HTML tool for visualizing and learning Rei's pipeline:

🔗 **[Live Demo](https://fc0web.github.io/rei-lang/gft-pipeline-tracer.html)**

| Tab | Description |
|-----|-------------|
| **Pipeline Tracer** | Step-by-step ISL visualization (Open→Sealed→Compacted) |
| **Genesis Viewer** | GA-v2 phase transitions with curvature/entropy/structure graphs |
| **Attack Replay** | 31 adversarial test patterns — see where each attack is blocked |
| **Education** | Interactive quiz (ISL, GA-v2, center/neighbor) with scoring |

## Project Structure

```
rei-lang/
├── src/
│   ├── core/           # Multi-dim numbers, extended numbers, computation
│   ├── gft/            # Graphic Formula Theory (graph, renderer, layout)
│   ├── lang/           # Rei language (lexer, parser, evaluator, REPL)
│   └── genesis/        # Genesis Axiom System v2 + ISL
│       ├── genesis-axioms-v2.ts
│       └── irreversible-syntax.ts
├── tests/
│   ├── genesis-v2.test.ts
│   └── irreversible-syntax.test.ts
├── docs/
│   └── gft-pipeline-tracer.html
├── examples/
│   ├── benchmarks.ts
│   └── gft-demo.ts
├── theory/             # D-FUMT theoretical documents
├── CITATION.cff
├── LICENSE (Apache 2.0)
└── README.md
```

## Unique Syntactic Constructs

The Rei language includes syntactic constructs that are **formally derived
from the D-FUMT theoretical framework**. These are not stylistic choices
but mathematical necessities of the Rei computational model:

| Construct | Origin | Description |
|-----------|--------|-------------|
| `center \|> compute` | Multi-Dimensional Number Theory | Center-neighbor simultaneous computation |
| `\|>⟨N,S,E,W⟩` | Directional Computation Theory | Direction-specified pipe operator |
| `compress fn(x) = ...` | Compression Philosophy | Pattern abstraction with compression semantics |
| `5κ0.3` | Genesis Axiom System (GA-v2) | Curvature-annotated numerical literal |
| `@ Phase` | Irreversible Syntax Layer (ISL) | Phase transition guard |
| `witnessed by` | ISL Witness System | Cryptographically tracked assignment |
| `0→o→o→x` | Zero Extension Theory | Dimensional extension chain |
| `𝕄{5; 1,2,3,4}` | Multi-Dimensional Number Theory | Multi-dimensional number literal |
| `[dim:diag]` | Directional Computation Theory | Dimensional slice notation |
| `compress²` | Compression Philosophy | Leveled compression keyword |

Any system that reproduces equivalent behavior — even under different
naming or surface syntax — shall be considered a derivative work of Rei
under the terms specified in the NOTICE file.

The explanatory structure describing these constructs (including metaphors
such as "center-radiating computation", "phase-irreversible transformation",
and "curvature-driven genesis") is itself part of the Rei model and is
protected under CC BY-NC-SA 4.0.

## Language Specification

The formal specification is available at [`spec/REI_SPEC_v0.1.md`](spec/REI_SPEC_v0.1.md).

This document defines Rei Language Specification v0.1, establishing the
minimum formal boundary of the Rei computational model and its protected
syntactic constructs.
