# Rei (0₀式) Language — Complete BNF v0.3

**Author:** Nobuki Fujimoto  
**Date:** 2026-02-10  
**Status:** Specification Draft  
**Changes from v0.2:** Category C Philosophical Foundations (5 theories → language core)

---

## Changelog from v0.2

| Item | v0.2 | v0.3 | Change |
|------|------|------|--------|
| Theory coverage | #1–#21 (modules) | #1–#21 + C1–C5 (core) | +5 core theories |
| Notation layers | 1 form | 4 forms | C1: NEA 4-layer literals |
| COMP_MODE | 4 modes | 9 modes | C4: +5 non-arithmetic modes |
| Domain tags | none | @domain | C2: UMTE domain annotations |
| Non-numeric literals | none | 5 types | C3: NNM ・△□🎨♪ |
| Parallel execution | none | fork/join | C5: AMRT parallel compute |
| Keywords | 45 | 59 | +14 |
| Breaking changes | — | 0 | Full backward compatibility |

---

## Complete BNF Grammar

```ebnf
(* ============================================================ *)
(* Rei (0₀式) Language — Complete BNF v0.3                       *)
(* Author: Nobuki Fujimoto                                       *)
(* Theories: #1–#21 + C1–C5 integrated                          *)
(* ============================================================ *)


(* ============================================================ *)
(* I. Program Structure                                          *)
(* ============================================================ *)

program         ::= statement*

statement       ::= let_stmt
                  | compress_def
                  | expr_stmt

let_stmt        ::= 'let' 'mut'? IDENT (':' type_expr phase_guard?)?
                     '=' expr witness_clause?

witness_clause  ::= 'witnessed' 'by' STRING

compress_def    ::= compress_level? 'compress' IDENT
                     '(' param_list ')' return_guard? '=' expr

compress_level  ::= 'compress⁰' | 'compress¹' | 'compress²'
                  | 'compress³' | 'compress∞'
                  | 'compress' '[' NUMBER ']'

param_list      ::= (param_decl (',' param_decl)*)?
param_decl      ::= IDENT ':' type_expr phase_guard?

return_guard    ::= '->' type_expr phase_guard?


(* ============================================================ *)
(* II. Phase System (ISL)                                        *)
(* ============================================================ *)

phase_guard     ::= '@' phase_type
phase_type      ::= 'Open' | 'Sealed' | 'Compacted'
                  | 'void' | 'dot' | 'zero_zero' | 'zero' | 'number'


(* ============================================================ *)
(* III. Expression Hierarchy                                     *)
(* ============================================================ *)

expr            ::= pipe_expr

pipe_expr       ::= curvature_expr (pipe_op pipe_target)*
pipe_op         ::= '|>'
                  | '|>' '⟨' direction_set '⟩'
                  | '<|' '⟨' direction_set '⟩'
                  | '◁'

pipe_target     ::= IDENT arg*
                  | compute_cmd
                  | compress_cmd
                  | expand_cmd
                  | temporal_cmd
                  | timeless_cmd
                  | quad_cmd
                  | spiral_cmd
                  | domain_cast_cmd        (* C2: NEW *)
                  | parallel_compute_cmd   (* C5: NEW *)
                  | fork_cmd               (* C5: NEW *)
                  | join_cmd               (* C5: NEW *)
                  | 'divergence'           (* C5: NEW *)
                  | 'consensus'            (* C5: NEW *)
                  | 'select' ':' IDENT     (* C5: NEW *)

direction_set   ::= '*' | 'ortho' | 'diag'
                  | direction (',' direction)*
direction       ::= 'N' | 'NE' | 'E' | 'SE' | 'S' | 'SW' | 'W' | 'NW'


(* ============================================================ *)
(* IV. Computation Commands                                      *)
(* ============================================================ *)

compute_cmd     ::= 'compute' ':' COMP_MODE
                  | 'compute' ':all'

(* C4: MMRT — 9 computation modes (4 arithmetic + 5 non-arithmetic) *)
COMP_MODE       ::= 'weighted' | 'multiplicative'
                  | 'harmonic' | 'exponential'
                  | 'topological'                    (* C4: NEW *)
                  | 'ordinal'                        (* C4: NEW *)
                  | 'categorical'                    (* C4: NEW *)
                  | 'symbolic'                       (* C4: NEW *)
                  | 'relational'                     (* C4: NEW *)

compress_cmd    ::= 'compress' (':' compress_mode)?
compress_mode   ::= 'zero' | 'pi' | 'e' | 'phi'

expand_cmd      ::= 'expand' (':' expand_mode)?
expand_mode     ::= 'uniform' | 'maxent' | 'pi' | 'e' | 'phi'


(* ============================================================ *)
(* V. Temporal / Timeless / Quadrivalent Commands                *)
(* ============================================================ *)

temporal_cmd    ::= 'evolve' ':' evolve_rule
                  | 'at' '(' expr ')'
                  | 'temporal_diff'
                  | 'window' '(' expr ',' expr ')'
evolve_rule     ::= 'diffusion' | 'wave' | 'advection' | IDENT

timeless_cmd    ::= 'extract_invariant'
                  | 'assert_invariant'
                  | 'timeless_project'

quad_cmd        ::= 'resolve'
                  | 'certainty'
                  | 'collapse'

spiral_cmd      ::= 'spiral_extend' '(' spiral_params ')'
                  | 'find_spiral_zeros'
spiral_params   ::= expr (',' expr)*


(* ============================================================ *)
(* VI. Domain System (C2: UMTE)                                  *)
(* ============================================================ *)

domain_cast_cmd ::= 'as' ':' domain_name

domain_tag      ::= '@domain' ':' domain_name
domain_name     ::= 'image' | 'graph' | 'music' | 'physics'
                  | 'text' | 'time' | 'network' | 'logic'
                  | IDENT


(* ============================================================ *)
(* VII. Parallel Execution (C5: AMRT)                            *)
(* ============================================================ *)

parallel_compute_cmd ::= 'compute' ':parallel' '[' mode_list ']'
mode_list       ::= ':' COMP_MODE (',' ':' COMP_MODE)*

fork_cmd        ::= 'fork' '{' fork_branch (',' fork_branch)* '}'
fork_branch     ::= IDENT ':' pipe_chain
pipe_chain      ::= (pipe_op pipe_target)+

join_cmd        ::= 'join' ':' join_strategy ('{' join_params '}')?
join_strategy   ::= 'best' | 'consensus' | 'all' | 'first'
join_params     ::= IDENT ':' expr (',' IDENT ':' expr)*


(* ============================================================ *)
(* VIII. Literals                                                 *)
(* ============================================================ *)

primary         ::= mdnum_literal
                  | zero_ext_literal
                  | curvature_literal
                  | temporal_literal
                  | quad_literal
                  | non_numeric_literal        (* C3: NEW *)
                  | CONST
                  | NUMBER
                  | STRING
                  | IDENT
                  | '(' expr ')'

(* --- Multi-Dimensional Number --- *)
mdnum_literal   ::= '𝕄' '{' expr ';' expr_list
                     ('weight' expr)? '}'
                     domain_tag?               (* C2: NEW *)
                  | '[' expr ';' expr_list ']'
                     domain_tag?               (* C2: NEW *)

(* --- C1: Notation Equivalence — 4-Layer Zero Extension --- *)
zero_ext_literal ::= zero_ext_sensory
                   | zero_ext_dialogue
                   | zero_ext_structural
                   | zero_ext_semantic

zero_ext_sensory    ::= BASE SUBSCRIPT_CHAR+
                        (* e.g. 0ooo, πxxx, ezzo *)

zero_ext_dialogue   ::= BASE '_' SUBSCRIPT_CHAR DIGIT+
                        (* e.g. 0_o3, π_x3, e_z2 *)

zero_ext_structural ::= BASE '(' SUBSCRIPT_CHAR ',' DIGIT+ ')'
                        (* e.g. 0(o,3), π(x,3), e(z,2) *)

zero_ext_semantic   ::= BASE '{' '"' 'sub' '"' ':' '"' SUBSCRIPT_CHAR '"'
                         ',' '"' 'degree' '"' ':' DIGIT+ '}'
                        (* e.g. 0{"sub":"o","degree":3} *)

(* NEA Constraint: All four forms normalize to identical AST *)

(* --- Curvature Literal --- *)
curvature_literal ::= NUMBER 'κ'

(* --- Temporal Literal --- *)
temporal_literal ::= mdnum_literal '|' 't' '=' expr

(* --- Quadrivalent Literal --- *)
quad_literal    ::= '⊤' | '⊥' | '⊤π' | '⊥π'

(* --- C3: Non-Numeric Literals --- *)
non_numeric_literal ::= dot_literal
                      | shape_literal
                      | color_literal
                      | sound_literal

dot_literal     ::= '・'

shape_literal   ::= shape_type '{' expr_list '}'
shape_type      ::= '△' | '□' | '○' | '◇' | '☆'

color_literal   ::= '🎨' '{' hex_color (';' hex_color_list)? '}'
hex_color       ::= '#' [0-9A-Fa-f]{6}
hex_color_list  ::= hex_color (',' hex_color)*

sound_literal   ::= '♪' '{' expr ';' sound_params '}'
                  | '♫' '{' note_list '}'
sound_params    ::= ':' IDENT (',' expr)*
note_list       ::= note_name (',' note_name)*
note_name       ::= [A-G] [#b]? DIGIT


(* ============================================================ *)
(* IX. Type System                                               *)
(* ============================================================ *)

type_expr       ::= base_type generic_args? phase_guard? domain_tag?
base_type       ::= 'MultiDim' | 'Scalar' | 'ZeroExt'
                  | 'Temporal' | 'Timeless' | 'Quad'
                  | 'Dot' | 'Shape' | 'Color' | 'Sound'  (* C3: NEW *)
                  | 'ParallelResult'                       (* C5: NEW *)
                  | IDENT
generic_args    ::= '<' type_expr (',' type_expr)* '>'


(* ============================================================ *)
(* X. Logic Operators (#21)                                      *)
(* ============================================================ *)

logic_expr      ::= logic_or
logic_or        ::= logic_and ('∨' logic_and)*
logic_and       ::= logic_not ('∧' logic_not)*
logic_not       ::= '¬' logic_not | comparison
comparison      ::= add_expr (comp_op add_expr)?
comp_op         ::= '>κ' | '<κ' | '=κ' | '==' | '!=' | '>' | '<'

curvature_expr  ::= logic_expr

add_expr        ::= mul_expr (('⊕' | '+') mul_expr)*
mul_expr        ::= ext_expr (('⊗' | '*' | '·') ext_expr)*

ext_expr        ::= unary_expr ('>>' ':' SUBSCRIPT | '<<' | '⤊' | '⤋')*
unary_expr      ::= primary ('.' IDENT arg* | '.κ')*
arg             ::= '(' expr_list ')'
expr_list       ::= expr (',' expr)*


(* ============================================================ *)
(* XI. Terminal Symbols                                          *)
(* ============================================================ *)

BASE            ::= '0' | 'π' | 'e' | 'φ' | 'i' | NUMBER
SUBSCRIPT_CHAR  ::= [oxzwensbua]
MATH_CONST      ::= 'π' | 'e' | 'φ'
CONST           ::= 'Φ' | 'Ψ' | 'Ω' | '∅' | '・' | '0₀'
IDENT           ::= [a-zA-Z_] [a-zA-Z0-9_]*
NUMBER          ::= [0-9]+ ('.' [0-9]+)?
DIGIT           ::= [0-9]+
STRING          ::= '"' [^"]* '"'
SUBSCRIPT       ::= [a-z0-9]+
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

## v0.2 → v0.3 Migration

**完全後方互換。** v0.2で有効な全てのプログラムは、v0.3でも同一のセマンティクスで動作する。

新機能は全て以下のいずれかとして追加：
- 記法リテラルの新形式（4-layer NEA）
- 計算モードの追加（`:topological`, `:ordinal`, `:categorical`, `:symbolic`, `:relational`）
- ドメインタグ（`@domain :name`）
- 非数値リテラル（`・`, `△{}`, `🎨{}`, `♪{}`, `♫{}`）
- 並行実行コマンド（`fork`, `join`, `divergence`, `consensus`, `select`）
- ドメイン変換コマンド（`as :domain`）

---

## Keyword Table (v0.3 Complete — 59 keywords)

### Core (v0.1: 14)
`let`, `mut`, `compress`, `compute`, `weight`, `witnessed`, `by`,
`Open`, `Sealed`, `Compacted`, `void`, `dot`, `zero_zero`, `zero`, `number`

### Theory #8–#21 (v0.2: +31)
`contract`, `project`, `combine`, `simplex`, `dimensionalize`,
`inverse`, `decompose`, `reconstruct`, `mirror`, `spiral`,
`pi`, `e`, `phi`, `spiral_extend`, `find_spiral_zeros`,
`extend_to`, `compress_to`, `expand`,
`evolve`, `at`, `temporal_diff`, `window`,
`extract_invariant`, `assert_invariant`, `timeless_project`,
`resolve`, `certainty`, `collapse`,
`diffusion`, `wave`, `advection`

### Category C (v0.3: +14)
`topological`, `ordinal`, `categorical`, `symbolic`, `relational`,
`parallel`, `fork`, `join`, `divergence`, `consensus`, `select`,
`as`, `domain`, `path`

---

© 2024-2026 Nobuki Fujimoto (藤本伸樹)
