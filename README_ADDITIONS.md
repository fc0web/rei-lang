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
