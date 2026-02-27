# Rei (0₀式) Language — Complete BNF v0.2

**Author:** Nobuki Fujimoto  
**Date:** 2026-02-10  
**Status:** Specification Draft  
**Changes from v0.1:** Integration of Theory #8–#21 (14 theories, 31 keywords, 2 operators, 3 types)

---

## Changelog from v0.1

| Item | v0.1 | v0.2 | Change |
|------|------|------|--------|
| Theory coverage | #1–#7 (core) | #1–#21 | +14 theories |
| Keywords | 14 | 45 | +31 |
| Operators | 8 | 10 | +2 (`⤊`/`⤋`, `◁`) |
| Types | 6 | 9 | +3 (`Temporal`, `Timeless`, `Quad`) |
| Compress modes | 1 (default) | 5 | +4 (`:zero`, `:pi`, `:e`, `:phi`) |
| Breaking changes | — | — | 0 |

---

## Complete BNF Grammar

```ebnf
(* ============================================================ *)
(* Rei (0₀式) Language — Complete BNF v0.2                       *)
(* Author: Nobuki Fujimoto                                       *)
(* Theories: #1–#21 integrated                                   *)
(* ============================================================ *)

(* ============================================================ *)
(* I. Program Structure                                          *)
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
                  | 'compress' '[' NUMBER ']'   (* ASCII fallback *)

param_list      ::= (param_decl (',' param_decl)*)?
param_decl      ::= IDENT ':' type_expr phase_guard?

return_guard    ::= '->' type_expr phase_guard?


(* ============================================================ *)
(* II. Phase System                                              *)
(*     Genesis Axioms + ISL (#1–#7, GA-v2)                       *)
(* ============================================================ *)

phase_guard     ::= '@' phase_type
phase_type      ::= 'Open' | 'Sealed' | 'Compacted'          (* ISL phases *)
                  | 'void' | 'dot' | 'zero_zero'              (* Genesis phases *)
                  | 'zero' | 'number'
                  | 'evolving' | 'stationary' | 'periodic'    (* #19 Temporal phases *)


(* ============================================================ *)
(* III. Expression Hierarchy                                     *)
(* ============================================================ *)

expr            ::= pipe_expr

(* --- Pipe Expressions (core + #18 expand) --- *)
pipe_expr       ::= curvature_expr (pipe_op cmd arg*
                  | '◁' expand_cmd                             (* #18 展開演算子 *)
                  )*

pipe_op         ::= '|>'                                       (* standard pipe *)
                  | '|>' '⟨' direction_set '⟩'                 (* directional pipe *)
                  | '<|' '⟨' direction_set '⟩'                 (* reverse pipe *)

direction_set   ::= '*' | 'ortho' | 'diag'
                  | direction (',' direction)*
direction       ::= 'N' | 'NE' | 'E' | 'SE' | 'S' | 'SW' | 'W' | 'NW'

(* --- Curvature Expressions (#4 曲率理論) --- *)
curvature_expr  ::= add_expr ('>κ' add_expr
                             | '<κ' add_expr
                             | '=κ' add_expr)?

(* --- Arithmetic --- *)
add_expr        ::= mul_expr (('⊕' | '+') mul_expr)*
mul_expr        ::= ext_expr (('⊗' | '*' | '·') ext_expr)*

(* --- Extension/Reduction + Spiral (#1 ゼロ拡張, #16 DSZT, #17 無限拡張) --- *)
ext_expr        ::= unary_expr ('>>' ':' ext_subscript          (* 拡張 *)
                               | '<<'                           (* 縮約 *)
                               | '⤊' angle_expr                (* #16 螺旋的次元上昇 *)
                               | '⤋' angle_expr?               (* #16 螺旋的次元降下 *)
                               )*

ext_subscript   ::= NUMBER                                     (* 数値拡張: 0,1,2,... *)
                  | MATH_CONST                                 (* 定数拡張: π, e, φ *)
                  | IDENT                                      (* 変数拡張 *)
                  | SUBSCRIPT                                  (* v0.1互換 *)

angle_expr      ::= NUMBER                                     (* ラジアン *)
                  | 'π' '/' NUMBER                             (* π分数 *)
                  | IDENT                                      (* 変数 *)

(* --- Unary --- *)
unary_expr      ::= primary ('.' IDENT | '.κ')*

(* --- Primary --- *)
primary         ::= md_literal                                 (* 多次元数リテラル *)
                  | curvature_literal                          (* 曲率リテラル *)
                  | quad_literal                               (* #21 四価リテラル *)
                  | NUMBER
                  | EXT_LIT
                  | CHAIN_LIT
                  | STRING
                  | IDENT
                  | '(' expr ')'
                  | CONST
                  | 'match' expr '{' match_arm+ '}'


(* ============================================================ *)
(* IV. Literals                                                  *)
(* ============================================================ *)

(* --- Multidimensional Number (#2 多次元数 + #19 時相) --- *)
md_literal      ::= '𝕄' '{' expr ';' expr_list
                     ('weight' expr_list)?
                     ('mode' COMP_MODE)?
                     temporal_tag?                             (* #19 *)
                     '}'

temporal_tag    ::= '|' 't' '=' expr                          (* #19 時刻タグ *)

(* --- Curvature Literal (#4 曲率) --- *)
curvature_literal ::= (NUMBER | EXT_LIT) 'κ' NUMBER

(* --- Four-valued Logic Literal (#21 四価0π) --- *)
quad_literal    ::= '⊤'                                       (* true *)
                  | '⊥'                                       (* false *)
                  | '⊤π'                                      (* latent true *)
                  | '⊥π'                                      (* latent false *)

(* --- Chain Literal (#1 ゼロ拡張) --- *)
CHAIN_LIT       ::= BASE '→' SUBSCRIPT_CHAR ('→' SUBSCRIPT_CHAR)*
                     ('→' '{' SUBSCRIPT_CHAR (',' SUBSCRIPT_CHAR)* '}')?

(* --- Dot Literal (#10 点数体系) --- *)
dot_literal     ::= '・'                                       (* 原始点 *)
                  | '・' '⊕' '・' ('⊕' '・')*                  (* 点結合 *)

(* --- Dimension Slice --- *)
dim_slice       ::= '[' 'dim' ':' direction_set ']'


(* ============================================================ *)
(* V. Pipe Commands (v0.1 core + #8–#21 extensions)             *)
(* ============================================================ *)

cmd             ::= core_cmd
                  | compress_cmd
                  | genesis_cmd
                  | theory_cmd

(* --- Core Commands (v0.1) --- *)
core_cmd        ::= 'sum' | 'mean' | 'max' | 'min' | 'median'
                  | 'convolve' | 'gradient' | 'smooth'
                  | 'normalize' | 'classify'
                  | 'energize' | 'seal' | 'compute'
                  | IDENT                                      (* user-defined *)

(* --- Compress Commands (v0.1 + #8 + #15) --- *)
compress_cmd    ::= 'compress' compress_mode?

compress_mode   ::= ':zero'                                    (* #8 縮小ゼロ *)
                  | ':pi'                                      (* #15 π縮小 *)
                  | ':e'                                       (* #15 e縮小 *)
                  | ':phi'                                     (* #15 φ縮小 *)
                  | ':' IDENT                                  (* 将来の拡張 *)

(* --- Genesis Commands (GA-v2) --- *)
genesis_cmd     ::= 'genesis' | 'phi' | 'psi' | 'omega'

(* --- Theory Extension Commands (#8–#21) --- *)
theory_cmd      ::= contraction_cmd                            (* #8 縮小ゼロ *)
                  | linear_cmd                                 (* #9 直線数体系 *)
                  | dot_cmd                                    (* #10 点数体系 *)
                  | inverse_cmd                                (* #11 逆数理構築 *)
                  | decompose_cmd                              (* #12 数理分解構築 *)
                  | mirror_cmd                                 (* #13 合わせ鏡 *)
                  | spiral_cmd                                 (* #14 螺旋数体系 *)
                  | dszt_cmd                                   (* #16 DSZT *)
                  | ext_query_cmd                              (* #17 無限拡張 *)
                  | temporal_cmd                               (* #19 時相 *)
                  | timeless_cmd                               (* #20 無時間性 *)
                  | quad_cmd                                   (* #21 四価0π *)

(* #8 縮小ゼロ理論 *)
contraction_cmd ::= 'contract_to_zero'
                  | 'dynamic_equilibrium'
                  | 'contraction_limit'

(* #9 直線数体系理論 *)
linear_cmd      ::= 'project' ':' axis_spec
                  | 'linear_interpolate'
axis_spec       ::= ':axial' | ':radial' | ':tangent' | IDENT

(* #10 点数体系理論 *)
dot_cmd         ::= 'to_dots'
                  | 'from_dots'
                  | 'dot_merge'

(* #11 逆数理構築理論 *)
inverse_cmd     ::= 'inverse_construct' '(' constraint_list ')'
                  | 'solve_for' '(' IDENT ')'

(* #12 数理分解構築理論 *)
decompose_cmd   ::= 'decompose' ':' decompose_basis
                  | 'reconstruct'
decompose_basis ::= ':axial' | ':spectral' | ':hierarchical' | IDENT

(* #13 合わせ鏡計算式 *)
mirror_cmd      ::= 'mirror' '(' mirror_params ')'
                  | 'mirror_fixpoint'
mirror_params   ::= 'depth' ':' NUMBER (',' 'damping' ':' NUMBER)?

(* #14 螺旋数体系理論 *)
spiral_cmd      ::= 'spiral_traverse' '(' spiral_params ')'
                  | 'spiral_fold'
                  | 'spiral_unfold'

(* #16 次元螺旋零点理論 *)
dszt_cmd        ::= 'spiral_extend' '(' dszt_params ')'
                  | 'find_spiral_zeros'
dszt_params     ::= 'depth' ':' NUMBER (',' 'twist' ':' angle_expr)?

(* #17 無限拡張数学理論 *)
ext_query_cmd   ::= 'extension_depth'
                  | 'extension_base'
                  | 'extension_root'
                  | 'extension_chain'

(* #18 縮小理論 — expand *)
expand_cmd      ::= 'expand' expand_mode '(' expand_params ')'

expand_mode     ::= ':uniform'
                  | ':maxent'
                  | ':pi' | ':e' | ':phi'
                  | ':' IDENT

expand_params   ::= NUMBER (',' constraint_list)?

constraint_list ::= constraint (',' constraint)*
constraint      ::= 'symmetry' ':' sym_type
                  | 'preserve' ':' IDENT
                  | 'prior' ':' expr
sym_type        ::= ':ortho' | ':diag' | ':full' | ':none'

(* #19 時相数体系理論 *)
temporal_cmd    ::= 'evolve' '(' evolve_params ')'
                  | 'at' '(' 't' ':' expr ')'
                  | 'temporal_diff'
                  | 'window' '(' 'from' ':' expr ',' 'to' ':' expr ')'

evolve_params   ::= 'dt' ':' expr ',' 'steps' ':' expr
                     (',' 'rule' ':' evolve_rule)?

evolve_rule     ::= ':diffusion' | ':wave' | ':advection'
                  | ':custom' '(' expr ')'

(* #20 無時間性数体系理論 *)
timeless_cmd    ::= 'extract_invariant'
                  | 'assert_invariant' '(' expr ')'
                  | 'timeless_project'
                  | 'timeless_pipe' '[' cmd_list ']'

cmd_list        ::= IDENT (',' IDENT)*

(* #21 四価0π理論 *)
quad_cmd        ::= 'resolve' '(' 'condition' ':' expr ')'
                  | 'certainty'
                  | 'collapse'
                  | 'is_latent'
                  | 'is_definite'


(* ============================================================ *)
(* VI. Type System                                               *)
(* ============================================================ *)

type_expr       ::= base_type
                  | parameterized_type
                  | type_expr '[' ']'

base_type       ::= 'Num' | 'ExtNum' | 'MultiDim' | 'Unified'
                  | 'Pipeline' | 'Genesis'
                  | 'CurvatureNum'
                  | 'Quad'                                     (* #21 四価論理型 *)
                  | 'Dot'                                      (* #10 点型 *)
                  | 'LinearNum'                                (* #9 直線数型 *)
                  | 'SpiralNum'                                (* #14 螺旋数型 *)

parameterized_type
                ::= 'Temporal' '<' type_expr '>'               (* #19 時相型 *)
                  | 'Timeless' '<' type_expr '>'               (* #20 無時間型 *)


(* ============================================================ *)
(* VII. Pattern Matching (extended for #21)                      *)
(* ============================================================ *)

match_arm       ::= pattern '=>' expr ','?

pattern         ::= quad_literal                               (* #21 四価パターン *)
                  | NUMBER
                  | STRING
                  | IDENT
                  | '_'                                        (* wildcard *)


(* ============================================================ *)
(* VIII. Logic Operators (extended for #21)                      *)
(* ============================================================ *)

(* Four-valued logic extends standard boolean operators *)
logic_expr      ::= expr '∧' expr                             (* AND — 四価拡張 *)
                  | expr '∨' expr                              (* OR — 四価拡張 *)
                  | '¬' expr                                   (* NOT — 四価拡張 *)


(* ============================================================ *)
(* IX. Terminal Symbols                                          *)
(* ============================================================ *)

COMP_MODE       ::= 'weighted' | 'multiplicative'
                  | 'harmonic' | 'exponential'

BASE            ::= '0' | 'π' | 'e' | 'φ' | 'i' | NUMBER

SUBSCRIPT_CHAR  ::= [oxzwensbua]

MATH_CONST      ::= 'π' | 'e' | 'φ'

CONST           ::= 'Φ' | 'Ψ' | 'Ω' | '∅' | '・' | '0₀'

IDENT           ::= [a-zA-Z_] [a-zA-Z0-9_]*

NUMBER          ::= [0-9]+ ('.' [0-9]+)?

STRING          ::= '"' [^"]* '"'

SUBSCRIPT       ::= [a-z0-9]+

arg             ::= '(' expr_list ')'
expr_list       ::= expr (',' expr)*
expr_stmt       ::= expr
```

---

## Operator Precedence (low → high)

| Level | Operators | Associativity | Theory |
|-------|-----------|---------------|--------|
| 1 | `\|>`, `\|>⟨⟩`, `<\|⟨⟩`, `◁` | left | core, #18 |
| 2 | `∧`, `∨` | left | #21 |
| 3 | `>κ`, `<κ`, `=κ` | none | #4 |
| 4 | `⊕`, `+` | left | core |
| 5 | `⊗`, `*`, `·` | left | core |
| 6 | `>>`, `<<`, `⤊`, `⤋` | left | #1, #16, #17 |
| 7 | `¬` | right (prefix) | #21 |
| 8 | `.`, `.κ` | left | core |

---

## v0.1 → v0.2 Migration

**完全後方互換。** v0.1で有効な全てのプログラムは、v0.2でも同一のセマンティクスで動作する。

新機能は全て以下のいずれかとして追加：
- パイプコマンド（`|> new_command`）
- compress モード（`compress :pi`）
- 型修飾子（`Temporal<T>`, `Timeless<T>`）
- リテラル（`⊤`, `⊥`, `⊤π`, `⊥π`）
- 演算子（`⤊`, `⤋`, `◁`）— 既存演算子との文法的衝突なし
