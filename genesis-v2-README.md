# Rei Genesis Axiom System v2 (GA-v2)

**Machine-Verifiable Genesis: From Void to Number**

Part of [D-FUMT](https://github.com/nobuki-fujimoto/rei-lang) (Dimensional Fujimoto Universal Mathematical Theory)
Author: Nobuki Fujimoto (藤本伸樹)

---

## Overview

The Genesis Axiom System formalizes what comes *before* zero. While Peano's axioms assume zero exists and ZFC starts from the empty set, GA models the emergence of number from pre-mathematical existence through four phase transitions:

```
void  →  ・(dot)  →  0₀  →  0  →  ℕ
      G-E₁        G-S₀     G-S₁    G-N₁
```

**GA-v2** elevates this from a descriptive model to a **machine-verifiable** axiom system:

- **Witness system** — Every phase transition carries a cryptographic witness recording the exact state (curvature, entropy, structure, threshold, progress) at the moment of transition. Witnesses are hashable and reproducible.
- **Monotonicity guarantee** — The Firewall Rule (FR) enforces that phase transitions advance exactly one step at a time. `phaseDelta` provides mechanical verification that no backtracking or phase-skipping occurs.
- **CS (General Position) Assumption** — Theorems S₀ and S₁ (uniqueness of ・→0₀ and 0₀→0 transitions) are recorded as *conditional theorems*. The CS assumption — requiring positive structure, positive energy input, and positive entropy — is evaluated and stored in `witness.payload.cs` for each transition.
- **Integrity verification** — `verifyAllWitnesses()` checks hash reproducibility, witness-kind consistency, and progress-threshold coherence across the entire genesis history.

## 概要（日本語）

生成公理系（GA）は「ゼロの手前に何があるか」を公理化します。ペアノの公理がゼロの存在を仮定し、ZFCが空集合から始まるのに対し、GAは数学以前の存在から数が生じる過程を4つの相転移として定式化します。

**GA-v2** では、この体系を「説明」から「検証可能な公理系」に昇格させました：

- **Witness（証人）系** — 各相転移に暗号学的witnessを付与。遷移時の状態（曲率・エントロピー・構造指標・閾値・進捗率）を記録し、ハッシュによる再現性を保証します。
- **単調性保証** — 遮断規則（FR）により段飛ばし・逆行を機械的に禁止。`phaseDelta`で全遷移の前進性を検証可能です。
- **CS（一般位置仮定）** — 定理S₀/S₁（・→0₀ および 0₀→0 の一意性）は「仮定つき定理」として記録されます。CS仮定の成否は `witness.payload.cs` に遷移ごとに保存されます。
- **整合性検証** — `verifyAllWitnesses()` がハッシュ再現性・witness種別整合・進捗-閾値整合を履歴全体にわたって検査します。

## Review Fixes Applied (v1 → v2)

| Fix | Issue | Resolution |
|-----|-------|------------|
| FIX-1 | `computeProgress(state)` used pre-transition state | Changed to `computeProgress(energized)` — progress now reflects the state at transition time |
| FIX-2 | Double decay/growth on transition | Transition uses `energized` directly — physics updates exactly once per tick |
| FIX-3 | FNV-1a 32-bit hash lacks collision resistance | TODO marker for SHA-256 upgrade; stable JSON property order documented |
| FIX-4 | S₀/S₁ were unconditional | CS assumption integrated into `witness.payload` — theorems are now conditional |

## Quick Start

```typescript
import {
  createGenesis,
  evolve,
  runFullGenesis,
  verifyTheoremS0,
  verifyTheoremS1,
  verifyMonotonicity,
  verifyAllWitnesses,
} from './genesis-axioms-v2';

// Run full genesis: void → ・ → 0₀ → 0 → ℕ
const state = runFullGenesis(0.3);

// Machine verification
console.log(verifyTheoremS0(state));    // { valid: true, csHolds: true, ... }
console.log(verifyTheoremS1(state));    // { valid: true, csHolds: true, ... }
console.log(verifyMonotonicity(state)); // { valid: true, ... }
console.log(verifyAllWitnesses(state)); // { valid: true, errors: [] }

// Inspect witness for any transition
const t = state.history[1]; // dot → zero_zero
console.log(t.witness.kind);               // 'structure_separation'
console.log(t.witness.hash);               // reproducible FNV-1a hash
console.log(t.witness.payload.progress);   // ≥ 1.0 (threshold reached)
console.log(t.witness.payload.cs);         // { satisfied: true, indicator: ..., description: ... }
```

## Test Suite

92 specification tests covering:

- Phase progression & ordering
- Firewall Rule (skip/backward/self blocking)
- phaseDelta monotonicity primitive
- Witness attachment, kind, threshold, progress
- CS assumption (normal + 3 violation patterns)
- Theorem S₀/S₁ with CS verification
- Monotonicity (including tampered history detection)
- Witness integrity (hash & kind tampering)
- Hash reproducibility (same params → same hash, different params → different hash)
- Single physics update (FIX-2 guarantee)
- computeProgress correctness per phase
- Full audit across 6 energy levels

```bash
npm test
# ✓ tests/genesis-v2.test.ts (92 tests) — all pass
```

## Architecture

```
genesis-axioms-v2.ts
├── Types: GenesisPhase, GenesisState, GenesisTransition, Witness, CSAssumption
├── Constants: CURVATURE_THRESHOLD, ENTROPY_DECAY, STRUCTURE_GROWTH
├── Phase utilities: phaseIndex, phaseDelta, firewallCheck
├── Physics: computeProgress, evaluateCS
├── Axioms: G-E₁, G-S₀, G-S₁, G-N₁ (return intent, not state)
├── Core: evolve (single-step), runFullGenesis, createGenesis
├── Witness: fnv1a32, witnessKindForPhase, enrichTransition
└── Verification: verifyTheoremS0/S1, verifyMonotonicity, verifyAllWitnesses
```

## License

Code: MIT
Theory: CC BY-NC-SA 4.0

© 2024-2026 Nobuki Fujimoto (藤本伸樹)
