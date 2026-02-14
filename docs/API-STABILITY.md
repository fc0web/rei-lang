# API Stability — Rei v0.5.3

This document classifies every public API in Rei by stability level. It is a commitment to users about what will and won't change before v1.0.

---

## Stability Levels

| Level | Meaning | What to expect |
|-------|---------|---------------|
| **Stable** | Will not change before v1.0 | Safe to depend on in production |
| **Provisional** | Minor adjustments possible | Signature stable, details may shift |
| **Experimental** | May change significantly | Use with awareness of potential breaking changes |

---

## Core API

### Stable ✅

These APIs will not have breaking changes before v1.0.

| API | Description | Since |
|-----|-------------|-------|
| `rei(code: string): any` | Evaluate Rei code, return result | v0.3.1 |
| `rei.reset(): void` | Clear all state (variables, functions, agents) | v0.3.1 |
| `rei.evaluator(): Evaluator` | Access underlying Evaluator instance | v0.3.1 |
| `new Lexer(source: string)` | Tokenizer | v0.2.1 |
| `lexer.tokenize(): Token[]` | Produce token array | v0.2.1 |
| `new Parser(tokens: Token[])` | Parser | v0.2.1 |
| `parser.parseProgram(): ASTNode` | Produce AST | v0.2.1 |
| `new Evaluator()` | AST evaluator with environment | v0.2.1 |
| `evaluator.eval(ast: ASTNode): any` | Evaluate AST | v0.2.1 |

### Stable Rei Syntax ✅

| Syntax | Description |
|--------|-------------|
| `𝕄{center; n1, n2, ...}` | Multi-dimensional number literal |
| `expr \|> command` | Pipe operator |
| `compute :mode` | Computation modes (weighted, multiplicative, harmonic, exponential) |
| `compress name(params) = body` | Function definition |
| `let name = expr` / `let mut name = expr` | Variable binding |
| `genesis()` / `forward` | Genesis axiom system |
| `⊤, ⊥, ⊤π, ⊥π` | Four-valued logic |
| `0ooo` / `>> :x` / `<<` | Extended numbers |

---

## Six-Attribute System (σ)

### Provisional ⚠️

The six attributes are a core concept and will remain, but internal structure may be adjusted.

| API | Description | Notes |
|-----|-------------|-------|
| `expr \|> sigma` | Get six-attribute metadata | Return shape is provisional |
| `sigma.field` | `{center, neighbors, mode, dim}` | Stable shape |
| `sigma.flow` | `{velocity, acceleration, phase, momentum}` | Shape may expand |
| `sigma.memory` | `{raw, entries, trajectory, dominantCause, span}` | `.raw` access may change |
| `sigma.layer` | `{depth, structure, expandable, components}` | Stable shape |
| `sigma.relation` | `{refs, dependencies, entanglements, isolated}` | Stable shape |
| `sigma.will` | `{tendency, strength, intrinsic, confidence, prediction, history}` | Shape may expand |

### Provisional — Relation Deep ⚠️

| Command | 日本語 | Description | Notes |
|---------|--------|-------------|-------|
| `trace` | `追跡` | Dependency chain (BFS, transitive closure) | Return shape may adjust |
| `influence("target")` | `影響("target")` | Influence score between values | Scoring algorithm may change |
| `entangle("target")` | `縁起("target")` | Deep bidirectional entanglement | Depth classification may adjust |

### Provisional — Will Deep ⚠️

| Command | 日本語 | Description | Notes |
|---------|--------|-------------|-------|
| `will_evolve` | `意志進化` | Autonomous will evolution | Evolution logic may change |
| `will_align("target")` | `意志調律("target")` | Harmonize intentions | Harmony calculation may adjust |
| `will_conflict("target")` | `意志衝突("target")` | Detect tension | Resolution strategies may expand |

### Provisional — Sigma-Deep Types ⚠️

| Type | Description |
|------|-------------|
| `DeepSigmaMeta` | Internal metadata structure |
| `DeepSigmaResult` | Full sigma result |
| `TraceResult` / `TraceNode` | Trace output |
| `InfluenceResult` | Influence output |
| `EntanglementResult` | Entanglement output |
| `WillEvolution` / `WillAlignment` / `WillConflict` | Will outputs |

### Provisional — Sigma-Deep Functions ⚠️

| Function | Description |
|----------|-------------|
| `createDeepSigmaMeta()` | Create initial metadata |
| `wrapWithDeepSigma()` | Wrap operation with sigma tracking |
| `buildDeepSigmaResult()` | Build sigma result from metadata |
| `mergeRelationBindings()` | Merge relation info into sigma |
| `mergeWillIntention()` | Merge will info into sigma |
| `traceRelationChain()` | Compute transitive closure |
| `computeInfluence()` | Compute influence score |
| `createEntanglement()` | Create entanglement |
| `evolveWill()` / `alignWills()` / `detectWillConflict()` | Will operations |

---

## Agent Runtime

### Experimental 🧪

The agent system works and is tested, but the API surface may change significantly.

| API | Description | Notes |
|-----|-------------|-------|
| `ReiEventBus` | Event system | Event type taxonomy may change |
| `ReiAgent` | Autonomous agent | Behavior model may expand |
| `AgentRegistry` | Agent lifecycle manager | Registration API may change |
| `ReiMediator` | Concurrent execution engine | Strategy API may change |

### Experimental — Agent Pipe Commands 🧪

| Command | 日本語 | Notes |
|---------|--------|-------|
| `agent` | — | May rename to `spawn` |
| `agent_sigma` | `自律σ` | Return shape may change |
| `perceive` / `decide` / `act` | `知覚` / `判断` / `行動` | Lifecycle may evolve |
| `mediate` / `mediate_run` | `調停` / `調停実行` | Parameter API may change |
| `mediator_sigma` | `調停σ` | Return shape may change |

### Experimental — AgentSpace 🧪

| API | Description | Notes |
|-----|-------------|-------|
| `createPuzzleAgentSpace()` | Puzzle → agent system | Entire API may restructure |
| `createGameAgentSpace()` | Game → agent system | Entire API may restructure |
| `agentSpaceRun()` / `agentSpaceRunRound()` | Execution | May merge or split |
| `agent_solve` / `agent_match` / `agent_analyze` | High-level pipes | Naming may change |

---

## Compression (RCT)

### Experimental 🧪

| Command | 日本語 | Notes |
|---------|--------|-------|
| `compress` (data) | `圧縮` | Core algorithm stable, API may adjust |
| `decompress` | `復元` | Roundtrip guaranteed |
| `semantic_compress` | `意味圧縮` | Highly experimental |
| `semantic_decompress` | `意味復元` | Depends on semantic_compress |

---

## Stable Pipe Commands ✅

These pipe commands will not change:

| Command | 日本語 | Description |
|---------|--------|-------------|
| `abs` | — | Absolute value |
| `sqrt` | — | Square root |
| `sort` | — | Sort array |
| `reverse` | — | Reverse array |
| `sum` | — | Sum array |
| `upper` / `lower` | — | String case |
| `normalize` | — | Normalize neighbors |
| `sigma` | — | Six-attribute metadata |
| `bind` | `結合` | Create relation |
| `intend` | `意志` | Set intention |
| `forward` | — | Genesis step |
| `kanji` | — | Kanji decomposition |
| `sentence` | — | Japanese sentence → 𝕄 |

---

## Migration Promise

When breaking changes occur in Provisional or Experimental APIs:
1. They will be listed in CHANGELOG.md
2. The version number will increment (minor for Provisional, could be patch for Experimental)
3. Migration guidance will be provided where practical

---

## Summary

| Level | Count | Examples |
|-------|-------|---------|
| **Stable** ✅ | ~25 APIs/commands | `rei()`, `𝕄`, `\|>`, `sigma`, `bind`, `intend` |
| **Provisional** ⚠️ | ~20 APIs/types | sigma-deep, trace, influence, entangle, will_* |
| **Experimental** 🧪 | ~15 APIs/commands | Agent runtime, AgentSpace, RCT compression |
