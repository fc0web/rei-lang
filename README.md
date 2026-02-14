# Rei (0₀式) — D-FUMT Computational Language

[![npm version](https://img.shields.io/npm/v/rei-lang)](https://www.npmjs.com/package/rei-lang)
[![License: Apache 2.0](https://img.shields.io/badge/License-Apache_2.0-gold.svg)](./LICENSE)
[![Tests](https://img.shields.io/badge/tests-799%2F799-brightgreen)]()

**Rei** (0₀式 / れいしき) is a mathematical computation language based on **D-FUMT** (Dimensional Fujimoto Universal Mathematical Theory). Its center-periphery patterns as language primitives achieve an **average 74% code reduction** over equivalent implementations in general-purpose languages.

**Author:** Nobuki Fujimoto

---

## What's New in v0.5.2 — Phase 4b/4c (Puzzle & Game Deepening)

### Phase 4b: パズル推論深化
- **Hidden Single 検出** — 制約グループ内で唯一の候補位置を自動確定
- **Pointing Pair 検出** — Box-Line Reduction による高度候補消去
- **推論層追跡 (ReasoningTrace)** — 各確定/消去ステップの推論層を記録
- **難易度分析 (DifficultyAnalysis)** — easy/medium/hard/expert の自動判定（スコア0-100）
- 新パイプ: `agent_difficulty` / `自律難易度`, `agent_trace` / `自律追跡`

### Phase 4c: ゲーム推論深化
- **行動パターン分化** — reactive（防御的）/ proactive（攻撃的）/ contemplative（MC評価）/ competitive（minimax）
- **戦術パターン知覚** — threat, opportunity, fork, block, center, corner の自動検出
- **対局分析 (MatchAnalysis)** — プレイヤー別の手数・戦術パターン集計・サマリー生成
- 新パイプ: `agent_analyze` / `自律分析`

```rei
// Phase 4b: パズル難易度分析
30 |> generate_sudoku(42) |> agent_difficulty
// → { level: "easy", score: 12, layersUsed: ["layer1_elimination"], ... }

// Phase 4c: 対局分析（reactive vs minimax）
"tic_tac_toe" |> game |> agent_analyze("reactive", "minimax")
// → { winner: 2, players: [{behavior: "reactive", ...}, {behavior: "competitive", ...}] }
```

## What's New in v0.5.1 — AgentSpace (Phase 4a)

**Puzzles and games are the same abstraction.** AgentSpace unifies puzzle-solving and game-playing on the v0.5 agent runtime:

- **Puzzles** = cooperative multi-agent systems (all cells work toward a common goal)
- **Games** = competitive multi-agent systems (players have opposing objectives)

The only difference is agent `behavior` and mediator `strategy`.

```rei
// Puzzle: Agent-based solving
30 |> generate_sudoku(42) |> agent_solve     // 81 cooperative agents solve sudoku
30 |> 数独生成(42) |> 自律解法               // Japanese syntax

// Game: Agent-based play
game("tictactoe") |> agent_play("competitive", "cooperative")
game("tictactoe") |> agent_match             // Full match to completion

// Unified observation
sudoku(grid) |> as_agent_space |> 調停σ      // Same σ for both
game("tictactoe") |> as_agent_space |> 調停σ
```

### v0.5 Agent Runtime

v0.5 introduced a **self-organizing agent runtime** — entities perceive, decide, and act autonomously, coordinated by a conflict-resolving mediator.

- **EventBus** — Type-safe event-driven architecture with flow momentum tracking
- **Entity Agent** — Six-attribute autonomous agents (perceive → decide → act cycle)
- **Mediator** — Concurrent execution engine with conflict detection and resolution strategies

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
 ║  Rei (0₀式) REPL v0.5.0                ║
 ║  D-FUMT Computational Language          ║
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

### Four-Valued Logic (四価0π)

Beyond true/false — based on D-FUMT Theory #21:

```rei
⊤           // true
⊥           // false
⊤π          // true-pi (π-rotated truth)
⊥π          // false-pi

¬⊤          // ⊥
⊤ ∧ ⊥      // ⊥
⊥ ∨ ⊤      // ⊤
```

---

## v0.5 Agent Runtime

### EventBus (イベントバス)

Type-safe event system with flow momentum tracking. Events follow a `category:action` pattern (e.g., `entity:fuse`, `agent:act`, `space:diffuse`).

```typescript
import { rei, ReiEventBus } from 'rei-lang';

// Access via Evaluator
const ev = rei.evaluator();
const bus = ev.eventBus;

// Subscribe to events
bus.on('entity:fuse', (event) => {
  console.log('Fusion occurred:', event.data);
});

// Subscribe with filter
bus.subscribe(
  (e) => e.category === 'agent',
  (e) => console.log(`Agent ${e.data.agentId}: ${e.action}`)
);
```

In Rei syntax with pipe commands:

```rei
// Emit a custom event
"mySource" |> emit("entity:transform", "data")

// Subscribe to events
"entity:*" |> subscribe

// Check flow momentum state
0 |> flow_momentum    // → { state: "expanding", rate: 12.5, ... }
```

### Entity Agent (自律エンティティ)

Entities in Rei are autonomous agents with the six D-FUMT attributes (場・流れ・記憶・層・関係・意志), executing a perceive → decide → act lifecycle.

```rei
// Spawn an agent from a value
let a = 𝕄{10; 1, 2, 3} |> spawn

// Agent lifecycle
a |> perceive       // observe environment → Perception
a |> decide         // choose action → Decision
a |> act            // execute decision → ActionResult

// Agent introspection
a |> agent_sigma    // σ metadata: state, step, memory, bindings
a |> 自律σ          // 日本語版

// Agent behaviors: reactive / proactive / cooperative / competitive / contemplative
```

```typescript
// Programmatic API
import { ReiAgent, AgentRegistry } from 'rei-lang';

const registry = new AgentRegistry();
const agent = registry.spawn(42, {
  behavior: 'cooperative',
  autonomyLevel: 0.8,
});

const perception = agent.perceive(registry);
const decision = agent.decide(perception);
const result = agent.act(registry, decision);
```

### Mediator (調停エンジン)

The Mediator coordinates multiple agents running concurrently, detecting and resolving conflicts with configurable strategies.

```rei
// Concurrent execution — all agents perceive → decide → resolve conflicts → act
0 |> mediate              // 1 round of concurrent execution
0 |> mediate(5)           // 5 rounds with convergence detection
0 |> mediate(10, 0.8)    // max 10 rounds, convergence threshold 0.8

// Strategies: priority / cooperative / sequential / cancel_both / mediator
0 |> mediate_strategy("cooperative")   // 協調 — merge conflicting intentions
0 |> 調停戦略("協調")                   // 日本語版

// Inter-agent messaging
"agent_a" |> mediate_message("agent_b", "hello")   // point-to-point
"agent_a" |> mediate_broadcast("共有データ")          // broadcast to all

// Mediator σ — statistics and convergence history
0 |> mediator_sigma   // → { totalRounds, conflicts, convergenceHistory, ... }
0 |> 調停σ            // 日本語版
```

Conflict types detected automatically: **target contention** (same target), **resource conflict** (shared resource), **mutual fuse** (A↔B fusion), **contradictory** (fuse vs separate).

Resolution strategies:

| Strategy | Japanese | Behavior |
|----------|----------|----------|
| `priority` | 優先 | Highest confidence × priority wins |
| `cooperative` | 協調 | Merge intentions into compromise |
| `sequential` | 順次 | Execute in priority order |
| `cancel_both` | 両方取消 | Cancel conflicting actions |
| `mediator` | 調停者 | Mediator's own judgment (中道) |

```typescript
// Programmatic API
import { ReiMediator, AgentRegistry } from 'rei-lang';

const registry = new AgentRegistry();
const mediator = new ReiMediator(registry);

// Spawn agents
registry.spawn(10, { behavior: 'cooperative' });
registry.spawn(20, { behavior: 'competitive' });

// Run concurrent rounds with convergence detection
const result = mediator.run({
  maxRounds: 10,
  convergenceThreshold: 0.8,
});
console.log(result.converged, result.totalRounds);
```

---

## Six Attributes (六属性)

Every entity in Rei carries six attributes from D-FUMT theory:

| Attribute | Japanese | Role |
|-----------|----------|------|
| Field (場) | ば | Spatial context and neighbors |
| Flow (流れ) | ながれ | Temporal momentum and EventBus connection |
| Memory (記憶) | きおく | History of observations and actions |
| Layer (層) | そう | Hierarchical depth and nesting |
| Relation (関係) | かんけい | Bindings between entities |
| Will (意志) | いし | Intention-driven computation strategy |

```rei
// Relation binding
let x = 42
let y = 100
x |> bind(y, "collaborator")   // create a relation

// Will-driven computation
let m = 𝕄{5; 1, 2, 3}
m |> intend("maximize")        // set intention
m |> will_compute              // compute guided by will
```

---

## RCT Compression (Rei Compression Theory)

D-FUMT Theory #67 — generative compression outperforming gzip on structured data:

```rei
// Core compression (Direction 1-2)
let data = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
data |> compress           // → compact θ representation
data |> compress |> decompress   // → lossless round-trip

// Semantic compression (Direction 3)
"let x = 𝕄{5; 1, 2, 3}" |> semantic_compress    // → θ parameters
"let x = 𝕄{5; 1, 2, 3}" |> 意味圧縮              // 日本語版
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

### `rei.evaluator(): Evaluator`

Access the underlying Evaluator instance (for EventBus, AgentRegistry, etc.).

### Classes

| Class | Description |
|-------|-------------|
| `Lexer` | Tokenizer |
| `Parser` | Recursive descent parser |
| `Evaluator` | AST evaluator with environment/scope chain |
| `ReiEventBus` | Type-safe event system with flow momentum |
| `ReiAgent` | Autonomous entity with six attributes |
| `AgentRegistry` | Agent lifecycle management |
| `ReiMediator` | Concurrent execution engine with conflict resolution |

### Types

| Type | Shape |
|------|-------|
| `MultiDimNumber` | `{ center, neighbors, mode, weights? }` |
| `ReiExtended` | `{ base, order, subscripts, valStar() }` |
| `GenesisState` | `{ state, omega, history }` |
| `ReiFunction` | `{ name, params, body, closure }` |
| `Quad` | `{ value: 'top' \| 'bottom' \| 'topPi' \| 'bottomPi' }` |
| `ReiEvent` | `{ type, category, action, timestamp, data, source?, depth }` |
| `AgentSigma` | `{ state, kind, behavior, step, perception, decisions, memory }` |
| `MediatorSigma` | `{ totalRounds, conflicts, convergenceHistory, agentCount }` |

---

## Bilingual Pipe Commands (日本語対応)

All pipe commands have Japanese aliases:

| English | 日本語 | Description |
|---------|--------|-------------|
| `spawn` | `生成` | Create agent from value |
| `perceive` | `知覚` | Agent observes environment |
| `decide` | `判断` | Agent chooses action |
| `act` | `行動` | Agent executes decision |
| `agent_sigma` | `自律σ` | Agent metadata |
| `mediate` | `調停` | Concurrent round execution |
| `mediate_run` | `調停実行` | Multi-round execution |
| `mediator_sigma` | `調停σ` | Mediator statistics |
| `mediate_strategy` | `調停戦略` | Set conflict strategy |
| `mediate_message` | `調停通信` | Point-to-point message |
| `mediate_broadcast` | `調停放送` | Broadcast to all agents |
| `emit` | `発火` | Emit event |
| `subscribe` | `購読` | Subscribe to events |
| `bind` | `結合` | Create relation binding |
| `intend` | `意図` | Set entity intention |
| `compress` | `圧縮` | RCT compression |
| `decompress` | `復元` | RCT decompression |

---

## BNF Specification

The complete BNF v0.3 specification is available in [`spec/`](./spec/).

---

## Theoretical Foundation

Rei is grounded in **D-FUMT** (Dimensional Fujimoto Universal Mathematical Theory), a framework of 66 interconnected theories spanning pure mathematics to philosophy and AI consciousness. The language's core innovation — **center-periphery patterns as language primitives** — derives from D-FUMT's multi-dimensional number system theory.

See [`theory/`](./theory/) for the complete theoretical documentation.

---

## ☮️ Peace Use Clause / 平和利用条項

Rei is licensed under Apache 2.0 with an additional Peace Use Clause.
Rei は Apache 2.0 ライセンスに加え、平和利用条項が適用されます。

Rooted in the Buddhist concept of "Kū" (空, Emptiness) and D-FUMT's consciousness mathematics, Rei is designed exclusively for the peaceful advancement of humanity. This software may not be used for:
仏教の「空」の概念と D-FUMT の意識数学に基づき、Rei は人類の平和的発展のためにのみ設計されています。以下の目的での使用は禁止されています：

🚫 Weapons, military systems, or LAWS / 兵器・軍事システム・自律型致死兵器
🚫 Human rights violations / 人権侵害
🚫 Intentional environmental destruction / 意図的な環境破壊

✅ Education, research, humanitarian aid, and creative endeavors are encouraged.
✅ 教育・研究・人道支援・創造的活動での使用を推奨します。

See [PEACE_USE_CLAUSE.md](./PEACE_USE_CLAUSE.md) for full details.

Apache 2.0 © Nobuki Fujimoto
