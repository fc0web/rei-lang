# Rei (0₀式) Language Specification v0.1
## Extended Notation & Gray Zone Defense
### Author: Nobuki Fujimoto | Date: 2026-02-09

> This document defines Rei Language Specification v0.1,
> establishing the minimum formal boundary of the Rei
> computational model and its protected syntactic constructs.

---

## Part I: NOTICE / README 反映文（確定版）

### README 追記（英語 — 研究者向け）

```markdown
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
```

### NOTICE 追記（法的効力 — 確定版）

```
============================================================
PROTECTED COMPUTATIONAL MODEL ELEMENTS
============================================================

The following computational model elements are integral to
Rei / D-FUMT and are subject to derivative work provisions:

1. CENTER-NEIGHBOR SIMULTANEOUS COMPUTATION
   Any system implementing a computation model where a central
   value is simultaneously computed with surrounding/adjacent
   values as a language-level primitive.

2. PHASE-BASED IRREVERSIBLE PIPELINES
   Any system enforcing irreversible state transitions through
   type-level and/or runtime phase guards (e.g. Open → Sealed
   → Compacted or equivalent stage progression).

3. CURVATURE-PROPAGATING NUMERICAL MODELS
   Any system attaching curvature, energy, or genesis-derived
   metadata to numerical values and propagating such metadata
   through computation chains.

4. WITNESS-TRACKED TRANSFORMATION CHAINS
   Any system recording cryptographic witnesses for value
   transformations and using such witnesses for verification
   of computation integrity.

5. ZERO-ORIGIN GENERATIVE NUMBER SYSTEMS
   Any system axiomatizing the generation of numbers from a
   pre-numeric void state through staged phase transitions.

6. DIRECTIONAL COMPUTATION OPERATORS
   Any system providing direction-specified computation
   operators that select subsets of neighbors/dimensions
   for partial computation.

7. EXPLANATORY FRAMEWORK
   The conceptual descriptions, metaphors, and pedagogical
   structures used to explain the above elements are themselves
   part of the Rei model.

Renaming symbols, rephrasing descriptions, or restructuring
surface syntax does not avoid derivative classification under
the applicable license terms.

Formal definitions of the protected constructs are provided
in "Rei Language Specification v0.1" (spec/REI_SPEC_v0.1.md).

Derivative works include, but are not limited to:
- Systems implementing center-neighbor simultaneous computation
  under any naming convention
- Phase-based irreversible pipelines regardless of phase names
- Curvature-propagating numerical models with renamed parameters
- Witness-tracked transformation chains with alternative hashing
- Zero-origin generative number systems with modified axiom names

As of 2026, there are NO authorized third-party implementations
of the Rei computational model.
```

---

## Part II: 優先実装仕様 — BNF + セマンティクス

### A. 提案5: 相転移ガード（Phase Guard） `@ Phase`

#### BNF

```ebnf
(* Phase Guard — 関数パラメータに相制約を付与 *)
phase_type      ::= 'Open' | 'Sealed' | 'Compacted'
                  | 'void' | 'dot' | 'zero_zero' | 'zero' | 'number'

phase_guard     ::= '@' phase_type

param_decl      ::= IDENT ':' type_expr phase_guard?

return_guard    ::= '->' type_expr phase_guard?

compress_def    ::= 'compress' IDENT '(' param_list ')' return_guard? '=' expr

(* Examples *)
(* compress normalize(p: Pipeline @ Open) = ...                    *)
(* compress commit(p: Pipeline @ Open) -> Pipeline @ Sealed = ...  *)
(* compress compact(s: Pipeline @ Sealed) -> Pipeline @ Compacted  *)
(* compress emerge(g: Genesis @ void) -> Genesis @ dot = ...       *)
```

#### セマンティクス

```
Phase Guard Rules:

1. COMPILE-TIME CHECK
   If a value's static phase ≠ declared guard phase → compile error.

   compress normalize(p: Pipeline @ Open) = ...
   let s = commit(p)          // s : Pipeline @ Sealed
   normalize(s)               // ERROR: expected @ Open, got @ Sealed

2. RUNTIME CHECK (defense-in-depth)
   Even with type cast bypass, runtime firewall checks actual phase.

   let hacked = s as Pipeline @ Open   // WARNING: phase cast
   normalize(hacked)                    // RUNTIME ERROR: firewall

3. PHASE MONOTONICITY
   Phase transitions are monotonic: Open → Sealed → Compacted.
   Reverse transitions are always rejected.

   compress downgrade(s: Pipeline @ Sealed) -> Pipeline @ Open = ...
   // ERROR: phase regression not allowed

4. GENESIS PHASE MONOTONICITY
   void → dot → zero_zero → zero → number
   Same monotonicity rules apply.

5. PHASE INFERENCE
   If return guard is omitted, phase is inferred from body.

   compress normalize(p: Pipeline @ Open) = phi(p)
   // Inferred return: Pipeline @ Open (Φ preserves phase)

   compress commit(p: Pipeline @ Open) = psi(p)
   // Inferred return: Pipeline @ Sealed (Ψ advances phase)
```

#### TypeScript 対応（既存ISLとの統合）

```typescript
// Phase Guard は既存の discriminated union と対応
type PipelinePhase = 'open' | 'sealed' | 'compacted';

// @ Open → OpenPipeline
// @ Sealed → SealedPipeline
// @ Compacted → CompactedPipeline

// Rei言語のphase guardはTypeScriptコンパイル時に
// 以下の型チェックに変換される：
function normalize(p: OpenPipeline): OpenPipeline { ... }
//                    ^^^^^^^^^^^^^ ← @ Open の型表現

// ランタイムfirewallは既存のISL実装をそのまま使用
```

---

### B. 提案3: 曲率リテラル（Curvature Literal） `κ`

#### BNF

```ebnf
(* Curvature Literal — 数値に曲率メタデータを付与 *)
curvature_suffix  ::= 'κ' NUMBER

curvature_literal ::= NUMBER curvature_suffix
                    | EXT_LIT curvature_suffix

(* Curvature Operations *)
curvature_compare ::= expr '>κ' expr        (* curvature comparison *)
                    | expr '<κ' expr
                    | expr '=κ' expr

curvature_extract ::= expr '.κ'              (* curvature extraction *)

(* Examples *)
(* 5κ0.3          → value=5, curvature=0.3                    *)
(* 0₀κ0.7         → extended zero_zero, curvature=0.7          *)
(* x >κ y         → compare curvatures of x and y              *)
(* result.κ       → extract curvature value                     *)
(* 5κ0.1 |> double → 10κ0.1 (curvature propagates)            *)
```

#### セマンティクス

```
Curvature Literal Rules:

1. CREATION
   5κ0.3 creates a CurvatureValue { value: 5, curvature: 0.3 }
   Curvature must be in range [0, 1].

2. PROPAGATION
   Curvature propagates through computation:

   5κ0.3 |> double         → 10κ0.3    (value changes, κ preserved)
   5κ0.3 + 3κ0.5           → 8κ0.4     (κ = weighted average)
   5κ0.3 * 2κ0.7           → 10κ0.5    (κ = geometric mean)

3. THRESHOLD BEHAVIOR (Genesis Connection)
   When curvature exceeds a threshold, phase transition occurs:

   let x = 0κ0.0
   x = x |> energize(0.3)   // 0κ0.3
   x = x |> energize(0.3)   // 0κ0.6
   x = x |> energize(0.3)   // phase transition! 0κ0.9 → triggers

   This directly maps to GA-v2's curvature-driven phase transitions.

4. CURVATURE COMPARISON
   x >κ y  ≡  x.κ > y.κ
   Useful for priority/ordering based on "readiness to transition"

5. CURVATURE IN MULTI-DIMENSIONAL NUMBERS
   𝕄{5κ0.3; 1κ0.1, 2κ0.2, 3κ0.4}
   Each dimension can have independent curvature.

6. CURVATURE DECAY / GROWTH
   entropy_decay = 0.02 per tick (from GA-v2)
   structure_growth = 0.03 per tick (from GA-v2)

   let x = 5κ0.8
   x |> decay    → 5κ0.78
   x |> grow     → 5κ0.83
```

#### TypeScript 対応

```typescript
// CurvatureValue は GA-v2 の内部状態と対応
interface CurvatureValue<T = number> {
  readonly value: T;
  readonly curvature: number;  // 0..1
}

// 5κ0.3 → { value: 5, curvature: 0.3 }
function κ(value: number, curvature: number): CurvatureValue {
  if (curvature < 0 || curvature > 1) throw new Error('κ must be in [0,1]');
  return { value, curvature };
}

// Propagation rules
function propagateCurvature(
  a: CurvatureValue,
  b: CurvatureValue,
  op: 'add' | 'mul'
): CurvatureValue {
  const value = op === 'add' ? a.value + b.value : a.value * b.value;
  const curvature = op === 'add'
    ? (a.curvature + b.curvature) / 2       // weighted average
    : Math.sqrt(a.curvature * b.curvature);  // geometric mean
  return { value, curvature };
}
```

---

### C. 提案1: 方向指定パイプ（Directional Pipe） `|>⟨方向⟩`

#### BNF

```ebnf
(* Directional Pipe — center/neighbor計算の方向を指定 *)
direction       ::= 'N' | 'NE' | 'E' | 'SE' | 'S' | 'SW' | 'W' | 'NW'
                  | '↑' | '↗' | '→' | '↘' | '↓' | '↙' | '←' | '↖'

direction_set   ::= '*'                        (* all directions *)
                  | 'ortho'                     (* N,S,E,W *)
                  | 'diag'                      (* NE,SE,SW,NW *)
                  | direction (',' direction)*  (* explicit list *)

directional_pipe ::= '|>' '⟨' direction_set '⟩' IDENT arg*

reverse_pipe     ::= '<|' '⟨' direction_set '⟩' IDENT arg*

(* Examples *)
(* grid |>⟨*⟩ convolve(kernel)           — all 8 directions        *)
(* grid |>⟨ortho⟩ gradient               — 4 orthogonal directions *)
(* grid |>⟨N,NE,E⟩ partial_conv(kernel)  — 3 specified directions  *)
(* satellites <|⟨*⟩ aggregate(center)     — reverse: outside→center *)
```

#### セマンティクス

```
Directional Pipe Rules:

1. DIRECTION SELECTION
   |>⟨dirs⟩ selects which neighbors participate in computation.

   𝕄{5; 1,2,3,4,5,6,7,8} |>⟨N⟩ get
   // → 1 (only north neighbor)

   𝕄{5; 1,2,3,4,5,6,7,8} |>⟨ortho⟩ sum
   // → 1+3+5+7 = 16 (N,E,S,W)

   𝕄{5; 1,2,3,4,5,6,7,8} |>⟨diag⟩ mean
   // → (2+4+6+8)/4 = 5.0 (NE,SE,SW,NW)

2. NEIGHBOR MAPPING (8-neighbor, clockwise from N)
   N=0, NE=1, E=2, SE=3, S=4, SW=5, W=6, NW=7

3. FULL DIRECTION (|>⟨*⟩) is equivalent to existing |>
   grid |>⟨*⟩ convolve(k)  ≡  grid |> convolve(k)

4. REVERSE PIPE (<|⟨⟩) aggregates from outside to center
   [1,2,3,4] <|⟨*⟩ mean  → computes mean of all values into center

5. COMPOSABILITY
   grid |>⟨ortho⟩ gradient |>⟨diag⟩ smooth
   // First compute gradient using orthogonal neighbors,
   // then smooth using diagonal neighbors
```

---

## Part III: 全記述式の統合BNF（Rei v0.1 Complete）

```ebnf
(* ============================================================ *)
(* Rei (0₀式) Language — Complete BNF v0.1                       *)
(* Author: Nobuki Fujimoto                                       *)
(* ============================================================ *)

program         ::= statement*

statement       ::= let_stmt
                  | compress_def
                  | expr_stmt

(* --- Variable Binding --- *)
let_stmt        ::= 'let' 'mut'? IDENT (':' type_expr phase_guard?)?
                     '=' expr witness_clause?

witness_clause  ::= 'witnessed' 'by' STRING

(* --- Compression Definition --- *)
compress_def    ::= compress_level? 'compress' IDENT
                     '(' param_list ')' return_guard? '=' expr

compress_level  ::= 'compress⁰' | 'compress¹' | 'compress²'
                  | 'compress³' | 'compress∞'
                  (* or: 'compress' '[' NUMBER ']' for ASCII fallback *)

param_list      ::= (param_decl (',' param_decl)*)?
param_decl      ::= IDENT ':' type_expr phase_guard?

return_guard    ::= '->' type_expr phase_guard?
phase_guard     ::= '@' phase_type
phase_type      ::= 'Open' | 'Sealed' | 'Compacted'
                  | 'void' | 'dot' | 'zero_zero' | 'zero' | 'number'

(* --- Expressions --- *)
expr            ::= pipe_expr

pipe_expr       ::= curvature_expr (pipe_op IDENT arg*)*
pipe_op         ::= '|>'                          (* standard pipe *)
                  | '|>' '⟨' direction_set '⟩'    (* directional pipe *)
                  | '<|' '⟨' direction_set '⟩'    (* reverse pipe *)

direction_set   ::= '*' | 'ortho' | 'diag'
                  | direction (',' direction)*
direction       ::= 'N' | 'NE' | 'E' | 'SE' | 'S' | 'SW' | 'W' | 'NW'

curvature_expr  ::= add_expr ('>κ' add_expr | '<κ' add_expr | '=κ' add_expr)?

add_expr        ::= mul_expr (('⊕' | '+') mul_expr)*
mul_expr        ::= ext_expr (('⊗' | '*' | '·') ext_expr)*

ext_expr        ::= unary_expr ('>>' ':' SUBSCRIPT | '<<')*
unary_expr      ::= primary ('.' IDENT | '.κ')*

primary         ::= curvature_literal
                  | NUMBER
                  | EXT_LIT
                  | MDIM_LIT
                  | CHAIN_LIT
                  | IDENT
                  | '(' expr ')'
                  | CONST

(* --- Literals --- *)
curvature_literal ::= (NUMBER | EXT_LIT) 'κ' NUMBER

MDIM_LIT        ::= '𝕄' '{' expr ';' expr_list
                     ('weight' expr_list)?
                     ('mode' COMP_MODE)? '}'

CHAIN_LIT       ::= BASE '→' SUBSCRIPT_CHAR ('→' SUBSCRIPT_CHAR)*
                     ('→' '{' SUBSCRIPT_CHAR (',' SUBSCRIPT_CHAR)* '}')?

dim_slice       ::= '[' 'dim' ':' direction_set ']'

(* --- Base Types --- *)
COMP_MODE       ::= 'weighted' | 'multiplicative' | 'harmonic' | 'exponential'
BASE            ::= '0' | 'π' | 'e' | 'φ' | 'i' | NUMBER
SUBSCRIPT_CHAR  ::= [oxzwensbua]
CONST           ::= 'Φ' | 'Ψ' | 'Ω' | '∅' | '・' | '0₀'

(* --- Type System --- *)
type_expr       ::= 'Num' | 'ExtNum' | 'MultiDim' | 'Unified'
                  | 'Pipeline' | 'Genesis'
                  | 'CurvatureNum'
                  | type_expr '[' ']'
```

---

## Part IV: サンプルプログラム（v0.1仕様デモ）

### Example 1: Phase Guard + ISL Pipeline

```rei
// 相ガード付きパイプライン関数定義
compress normalize(p: Pipeline @ Open) = p |> phi
compress commit(p: Pipeline @ Open) -> Pipeline @ Sealed = p |> psi
compress compact(s: Pipeline @ Sealed) -> Pipeline @ Compacted = s |> omega

// 使用例
let genesis_state = genesis(energy: 0.3)
let pipeline = createPipeline(genesis_state)

let normalized = normalize(pipeline)           // OK: @ Open → @ Open
let sealed = commit(normalized)                // OK: @ Open → @ Sealed
let proof = compact(sealed)                    // OK: @ Sealed → @ Compacted

// normalize(sealed)  ← COMPILE ERROR: expected @ Open, got @ Sealed
```

### Example 2: Curvature Literal + Genesis

```rei
// 曲率リテラルで初期状態を定義
let origin = 0₀κ0.0

// energize で曲率を蓄積
let step1 = origin |> energize(0.3)    // 0₀κ0.3
let step2 = step1 |> energize(0.3)     // 0₀κ0.6

// 曲率比較
step2 >κ step1                          // true (0.6 > 0.3)

// 曲率抽出
step2.κ                                 // 0.6

// threshold超過で相転移
let step3 = step2 |> energize(0.3)     // κ=0.9 ≥ 0.85 → number phase!
```

### Example 3: Directional Pipe + Dimensional Slice

```rei
// 8近傍多次元数
let cell = 𝕄{5; 1,2,3,4,5,6,7,8}

// 全方向計算（既存記法と互換）
cell |>⟨*⟩ convolve(kernel_3x3)

// 直交方向のみ
cell |>⟨ortho⟩ gradient

// 対角方向のみ
cell |>⟨diag⟩ smooth

// 特定方向
cell |>⟨N,NE,E⟩ partial_conv(kernel)

// 次元スライスとの組み合わせ
cell[dim:diag] |> sum                  // 2+4+6+8 = 20
cell[dim:ortho] |> mean                // (1+3+5+7)/4 = 4.0

// 逆方向パイプ
[1,2,3,4,5,6,7,8] <|⟨*⟩ aggregate     // 外→中心集約
```

### Example 4: Witnessed Assignment + Compression Level

```rei
// 証人付き代入
let raw_data = loadGrid("sensor.csv") witnessed by "source:sensor_array_v3"

// 圧縮レベル付き変換チェーン
compress² filter(grid: MultiDim) =
  grid |>⟨ortho⟩ median witnessed by "orthogonal_median_filter"

compress³ pipeline(data: MultiDim) =
  data
    |> filter witnessed by "step1:filter"
    |> normalize witnessed by "step2:normalize"
    |> classify witnessed by "step3:classify"

// 証人チェーン確認
let result = pipeline(raw_data)
result.witnesses
// → ["source:sensor_array_v3",
//     "step1:filter", "orthogonal_median_filter",
//     "step2:normalize", "step3:classify"]
result.witness_hash
// → "a3f8c1d2" (FNV-1a of entire chain)
```

### Example 5: Zero Extension Chain

```rei
// チェーン記法で零点拡張
let extended = 0→o→o→o→x              // 0ooox

// 分岐チェーン
let branches = 0→o→{x, z}             // [0oox, 0ooz] を同時生成

// 縮約チェーン
let reduced = 0ooox←←                  // 0oo (2回縮約)

// チェーンをパイプラインに接続
0→o→o→x |> compute |> seal           // 拡張→計算→封印
```

---

## Part V: タグ付け & 公開推奨

### GitHub タグ

```bash
git tag -a v0.1-spec -m "Rei Language Specification v0.1
- Phase Guard (@ Phase) specification
- Curvature Literal (κ) specification
- Directional Pipe (|>⟨⟩) specification
- Dimensional Slice ([dim:]) specification
- Witnessed Assignment specification
- Compression Level specification
- Zero Extension Chain specification
- Complete BNF grammar
- NOTICE derivative work provisions"

git push origin v0.1-spec
```

### ファイル配置

```
rei-lang/
├── spec/
│   └── REI_SPEC_v0.1.md        ← 本文書
├── src/genesis/
│   ├── genesis-axioms-v2.ts
│   └── irreversible-syntax.ts
├── NOTICE                       ← Part I の追記を反映
└── README.md                    ← Part I の追記を反映
```
