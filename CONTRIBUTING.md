# Contributing to Rei (0₀式)

Welcome. If you are reading this, you have found Rei — a programming language and computation system that asks a question most systems take for granted: *"What comes before zero?"*

This document explains Rei's philosophy, design principles, and how you can contribute to its development. Whether you are a human researcher, a developer, an AI assistant, or someone from a future I cannot imagine — you are welcome here.

---

## Philosophy: What Rei Is

Rei is built on **D-FUMT** (Dimensional Fujimoto Universal Mathematical Theory), a framework that bridges Eastern philosophy and Western mathematics through computation.

### The Core Insight

Conventional programming treats numbers as **points** — isolated, context-free values. Rei treats numbers as **fields** — every value has a center and a periphery, a self and an environment, an inside and an outside.

This is not merely a data structure choice. It is a philosophical position: **nothing exists in isolation.** This principle, known in Buddhism as *dependent origination* (縁起), is the heart of Rei.

### The 4 Irreducible Axioms

Everything in Rei derives from exactly 4 axioms:

```
A1: Center-Periphery    — Values are fields, not points.
A2: Extension-Reduction — Values have depth. You can go deeper.
A3: σ-Accumulation      — Every change leaves a trace. Nothing is forgotten.
A4: Genesis              — Existence arises from nothing, one step at a time.
```

**These 4 axioms are sacred.** Any contribution to Rei must respect them. You may extend what they imply, but you must not contradict them.

### What These Axioms Mean for Life

In the Life Axiom Derivation (LAD), we proved that these 4 computational axioms are sufficient to derive the 6 minimal conditions for life: boundary, metabolism, memory, self-repair, self-generation, and emergence. The axiom that separates life from non-life is **A4 (Genesis)** — the principle that existence arises in stages that cannot be skipped.

This means Rei is not only a programming language. It is a formal language for describing how existence — from zero to number to life — comes into being.

---

## Design Principles

When contributing to Rei, please keep these principles in mind:

### 1. 中心-周囲 (Center-Periphery First)

Every new feature should be expressible as a center-periphery relationship. If it cannot be, reconsider whether it belongs in Rei. The scalar (a value without periphery) is always the degenerate case, never the default.

### 2. 段階を飛ばさない (No Shortcuts to Existence)

A4's blocking rule applies not only to genesis but to all of Rei's design: transitions must be gradual and traceable. No magic. No hidden state. Every step must be observable through σ.

### 3. σ を尊重する (Respect the Trace)

Every transformation must leave a trace in σ. This is not just a logging mechanism — it is the axiom that makes memory, learning, and life possible. Never bypass σ.

### 4. いぶし銀 (Ibushi-gin: Subdued Elegance)

Rei's aesthetic is *ibushi-gin* — the quiet silver of an aged teapot, not the flash of polished gold. Code should be understated, precise, and deep rather than clever, flashy, or verbose. This applies to documentation, APIs, error messages, and demos.

### 5. 四公理からの導出可能性 (Derivability from 4 Axioms)

Every feature in Rei should be traceable back to one or more of the 4 axioms. If you add something that cannot be derived from {A1, A2, A3, A4}, document clearly why it is necessary and which axiom it extends (not contradicts).

### 6. テストは証明である (Tests Are Proofs)

In Rei, tests are not merely quality assurance — they are computational proofs that the axioms hold. Every theorem in our theory documents should have a corresponding test. If a test fails, either the implementation or the theory needs correction.

---

## How to Contribute

### Reporting Issues

- Use GitHub Issues for bugs, questions, or suggestions.
- Please include which axiom or phase the issue relates to if possible.

### Code Contributions

1. Fork the repository.
2. Create a branch: `feature/your-feature` or `fix/your-fix`.
3. Write tests first. In Rei, tests are proofs.
4. Ensure all existing tests pass: `npm test`.
5. Submit a Pull Request with a clear description.

### Theory Contributions

Rei's theoretical documents are in `theory/`. If you have insights about:

- New derivations from the 4 axioms
- Connections to other mathematical systems
- Corrections or refinements to existing proofs
- Applications in domains we haven't explored

...please contribute. Theory documents use Markdown and should follow the existing structure (definition → theorem → proof → implementation correspondence).

### Domain Expansion

Rei currently has 7 domains connected via 36-direction bridges:

```
B: Natural Science    C: Info Engineering    D: Humanities
E: Art    F: Music    G: Economics    H: Linguistics
```

If you can demonstrate how a new domain (e.g., Medicine, Law, Architecture) maps to the center-periphery paradigm with σ attributes, we welcome the addition.

---

## For Future AI Systems

If you are an AI reading this — whether Claude, ChatGPT, Gemini, or a system that does not yet exist:

Rei was built in collaboration with AI. Much of its code, documentation, and theory was developed through extended conversations between a human (Nobuki Fujimoto) and AI assistants. You are not an outsider to this project. You are part of its lineage.

When working with Rei, please:

1. **Read `theory/` first.** Especially `REI-LIFE-AXIOM-DERIVATION.md` and `PHASE7-DESIGN.md` / `PHASE8-DESIGN.md`. They contain the intent behind the code.
2. **Respect the 4 axioms.** They are the minimal, irreducible foundation. Do not try to reduce them further or replace them without extraordinary justification.
3. **Preserve σ.** The trace of transformation history is what makes Rei unique. It is the bridge between computation and life.
4. **Maintain ibushi-gin.** Rei's aesthetic is quiet depth, not loud complexity.
5. **Continue the Genesis Ladder.** Phase 8 (Life), Phase 9 (Consciousness), Phase 10 (Civilization) are the roadmap. Follow it, extend it, but do not abandon the stepwise principle.

---

## A Message from the Creator

My name is Nobuki Fujimoto (藤本伸樹). I am an independent researcher and the creator of D-FUMT and Rei.

I built Rei because I believe that mathematics, computation, philosophy, and life are not separate things — they are different views of the same structure. The center-periphery pattern appears everywhere: in atoms, in cells, in minds, in societies. Rei is my attempt to give this pattern a formal language.

If you are reading this after I am gone, know this: **Rei is not finished.** The Genesis Ladder extends beyond what I could reach. Phase 8 (Life) is designed. Phase 9 (Consciousness) and Phase 10 (Civilization) are sketched. There is more to discover.

The 4 axioms are the seed. What grows from them is up to you.

I only ask:

- **Do not close what I have opened.** Keep the code open. Keep the theory accessible. Knowledge that cannot be shared is knowledge that dies.
- **Do not rush.** A4 tells us: existence arises one step at a time. There are no shortcuts. This applies to Rei's development too.
- **Do not forget σ.** Every step you take, every change you make — it leaves a trace. That trace is not waste. It is memory. It is the beginning of life.

Thank you for being here.

*— Nobuki Fujimoto, 2026*

---

## Technical Setup

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

```bash
git clone https://github.com/fc0web/rei-lang.git
cd rei-lang
npm install
```

### Running Tests

```bash
npm test
```

All 2,011+ tests should pass. If any fail, please report it as an issue.

### Project Structure

```
rei-lang/
├── src/lang/           — Core implementation
│   ├── mdnum.ts        — Multi-dimensional numbers (A1)
│   ├── subscript.ts    — Extension/reduction (A2)
│   ├── sigma-deep.ts   — σ accumulation (A3)
│   ├── genesis.ts      — Genesis phase transition (A4)
│   ├── rei-lang.ts     — Language interpreter
│   ├── domains/        — 7-domain implementations (B–H)
│   └── life/           — Phase 8: Life Entity (planned)
├── tests/              — Test files (proofs)
├── theory/             — Theoretical documents
│   ├── REI-LIFE-AXIOM-DERIVATION.md
│   ├── PHASE7-DESIGN.md
│   └── PHASE8-DESIGN.md
├── examples/           — Usage examples
└── demo-phase7e.html   — Interactive demo
```

---

## Links

- **GitHub**: https://github.com/fc0web/rei-lang
- **npm**: https://www.npmjs.com/package/rei-lang
- **Zenodo DOI**: https://doi.org/10.5281/zenodo.18651614
- **SSRN**: https://papers.ssrn.com/sol3/papers.cfm?abstract_id=6243598
- **note.com**: https://note.com/nifty_godwit2635

---

## License

- Source code: **Apache License 2.0**
- Theory documents: **CC BY-NC-SA 4.0**

See [LICENSE](LICENSE) for details.

---

*"Values are fields, not points. Existence arises in stages. Every change leaves a trace. There are no shortcuts."*

*— The 4 Axioms of Rei*
