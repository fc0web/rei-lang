# Rei (0₀式) Language — Complete BNF v0.2

**Author:** Nobuki Fujimoto  
**Date:** 2026-02-10  
**Status:** Specification with Working Interpreter  
**Theories:** #1–#21 (Category A full + Category B + Category C reflected)

---

## Changelog from v0.1

| Item | v0.1 | v0.2 | Change |
|------|------|------|--------|
| Theory coverage | #1–#7 (core) | #1–#21 | +14 theories |
| Keywords | 14 | 45 | +31 |
| Operators | 8 | 10 | +2 (`⤊`/`⤋`, `◁`) |
| Types | 6 | 9 | +3 (`Temporal`, `Timeless`, `Quad`) |
| Compute modes | 4 | 9 | +5 (`:zero`, `:pi`, `:e`, `:phi`, `:symbolic`) |
| Pipe commands | 3 | 10 | +7 (`seal`, `verify`, `temporal`, `timeless`, `mirror`, `symmetry`, `as`) |
| Breaking changes | — | — | **0** (完全後方互換) |

---

## Complete BNF Grammar

```ebnf
(* ============================================================ *)
(* Rei (0₀式) Language — Complete BNF v0.2                       *)
(* Author: Nobuki Fujimoto                                       *)
(* Theories: #1–#21 integrated                                   *)
(* ============================================================ *)

(* ── I. Program Structure ── *)

program         ::= statement*

statement       ::= let_stmt
                  | compress_def
                  | expr_stmt

let_stmt        ::= 'let' 'mut'? IDENT (':' type_expr phase_guard?)?
                     '=' expr witness_clause?

witness_clause  ::= 'witnessed' 'by' STRING

compress_def    ::= 'compress' IDENT '(' param_list ')' ('->' type_expr)? '=' expr

param_list      ::= (param_decl (',' param_decl)*)?
param_decl      ::= IDENT (':' type_expr phase_guard?)?

phase_guard     ::= 'phase' IDENT

expr_stmt       ::= expr

(* ── II. Expressions (by precedence, low → high) ── *)

expr            ::= pipe_expr

(* Level 1: Pipe *)
pipe_expr       ::= logic_or ( '|>' pipe_command )*
pipe_command    ::= 'compute' ':' COMP_MODE
                  | 'as' ':' DOMAIN
                  | 'compress' (':' IDENT)?
                  | 'seal' | 'verify'
                  | 'forward'
                  | 'mirror'
                  | 'temporal' | 'timeless'
                  | 'symmetry'
                  | IDENT ('(' expr_list? ')')?

(* Level 2: Logic OR *)
logic_or        ::= logic_and ( '∨' logic_and )*

(* Level 3: Logic AND *)
logic_and       ::= kappa_cmp ( '∧' kappa_cmp )*

(* Level 4: Kappa Comparison *)
kappa_cmp       ::= additive ( ('>κ' | '<κ' | '=κ') additive )?

(* Level 5: Additive *)
additive        ::= multiplicative ( ('+' | '-' | '⊕') multiplicative )*

(* Level 6: Multiplicative *)
multiplicative  ::= extend_reduce ( ('*' | '/' | '⊗' | '·') extend_reduce )*

(* Level 7: Extend / Reduce / Spiral *)
extend_reduce   ::= unary_prefix ( '>>' ':' IDENT
                                  | '<<'
                                  | '⤊' NUMBER?
                                  | '⤋' NUMBER? )*

(* Level 8: Unary Prefix *)
unary_prefix    ::= '¬' unary_prefix
                  | '-' unary_prefix
                  | member_access

(* Level 9: Member Access *)
member_access   ::= call_expr ( '.' IDENT )*

(* Level 10: Function Call *)
call_expr       ::= primary ( '(' expr_list? ')' )*

(* ── III. Primary Expressions ── *)

primary         ::= NUMBER
                  | EXT_LIT
                  | '0₀'
                  | '・'
                  | STRING
                  | QUAD_LIT
                  | 'π' | 'φ'
                  | mdim_lit
                  | unified_lit
                  | shape_lit
                  | 'genesis' '(' ')'?
                  | '(' expr ')'
                  | IDENT

mdim_lit        ::= '𝕄' '{' expr ';' neighbor_list '}'
neighbor_list   ::= neighbor (',' neighbor)*
neighbor        ::= expr ('weight' expr)?

unified_lit     ::= '𝕌' '{' expr ',' expr '}'

shape_lit       ::= SHAPE '{' expr_list? '}'
SHAPE           ::= '△' | '□' | '○' | '◇'

(* ── IV. Terminal Symbols ── *)

COMP_MODE       ::= 'weighted' | 'multiplicative' | 'harmonic' | 'exponential'
                  | 'zero' | 'pi' | 'e' | 'phi' | 'symbolic' | 'all'

DOMAIN          ::= 'image' | 'sound' | 'graph' | 'geometry' | 'text'

QUAD_LIT        ::= '⊤' | '⊥' | '⊤π' | '⊥π'

EXT_LIT         ::= BASE SUBSCRIPT_CHAR+
BASE            ::= '0' | 'π' | 'e' | 'φ' | 'i'
SUBSCRIPT_CHAR  ::= [oxzwensbua]

IDENT           ::= [a-zA-Z_] [a-zA-Z0-9_]*
NUMBER          ::= '-'? [0-9]+ ('.' [0-9]+)?
STRING          ::= '"' [^"]* '"'

expr_list       ::= expr (',' expr)*
```

---

## Operator Precedence Table (low → high)

| Level | Operators | Associativity | Theory Origin |
|-------|-----------|---------------|---------------|
| 1 | `\|>` | left | core (pipe) |
| 2 | `∨` | left | #21 四価0π理論 |
| 3 | `∧` | left | #21 四価0π理論 |
| 4 | `>κ` `<κ` `=κ` | none | #4 圧縮次元理論 |
| 5 | `+` `-` `⊕` | left | core, #1 ゼロ拡張理論 |
| 6 | `*` `/` `⊗` `·` | left | core, #2 多次元数体系 |
| 7 | `>>` `<<` `⤊` `⤋` | left | #1, #16 次元螺旋零点理論 |
| 8 | `¬` `-` (unary) | right (prefix) | #21 四価0π理論 |
| 9 | `.` | left | core (member) |

---

## Value Types

| Type | Literal Example | Theory |
|------|----------------|--------|
| `Number` | `42`, `3.14` | — |
| `Extended` | `0ooo`, `πxx`, `eoo` | #1 ゼロ拡張理論 |
| `MultiDim` | `𝕄{5; 1, 2, 3, 4}` | #2 多次元数体系 |
| `Unified` | `𝕌{0oo, 𝕄{5; 1, 2}}` | #3 多要素数体系 |
| `Dot` | `・` | #10 点数体系理論 |
| `Shape` | `△{・, ・, ・}` | GFT基盤 |
| `Quad` | `⊤`, `⊥`, `⊤π`, `⊥π` | #21 四価0π理論 |
| `Genesis` | `genesis()` | #6 生成公理系 |
| `Temporal<T>` | `val \|> temporal` | #19 時相数体系理論 |
| `Timeless<T>` | `val \|> timeless` | #20 無時間性数体系理論 |
| `Domain<T>` | `val \|> as :image` | GFT/UPFT/USFT |
| `ISLSealed<T>` | `val \|> seal` | ISL不可逆構文層 |
| `Parallel<T>` | `val \|> compute :all` | #14 合わせ鏡計算式 |

---

## Compute Modes (9 + all)

| Mode | Formula | Theory |
|------|---------|--------|
| `:weighted` | c + Σ(vᵢ·wᵢ)/Σwᵢ | #2 core |
| `:multiplicative` | c · Π\|vᵢ\|^wᵢ | #2 core |
| `:harmonic` | c + Σwᵢ / Σ(wᵢ/vᵢ) | #2 core |
| `:exponential` | c + ln(Σwᵢ·e^vᵢ / Σwᵢ) | #2 core |
| `:zero` | iterative contraction | #8 縮小ゼロ理論 |
| `:pi` | c + sin(Σvᵢ·wᵢ · π / Σwᵢ) | #15 π縮小理論 |
| `:e` | c · e^(Σvᵢ·wᵢ / Σwᵢ) | #15 e縮小理論 |
| `:phi` | c + Σvᵢ·φ^(-(i+1))·wᵢ / Σwᵢ | #15 φ縮小理論 |
| `:symbolic` | peak(vᵢ) | #18 縮小理論 |
| `:all` | parallel execution of all 9 | #14 合わせ鏡計算式 |

---

## Pipe Commands

| Command | Syntax | Effect |
|---------|--------|--------|
| `compute` | `\|> compute :MODE` | 多次元数の計算モード実行 |
| `as` | `\|> as :DOMAIN` | ドメインタグ付加 |
| `compress` | `\|> compress :MODE?` | 値の圧縮 |
| `seal` | `\|> seal` | ISL暗号封印 |
| `verify` | `\|> verify` | ISL封印検証 |
| `forward` | `\|> forward` | Genesis相転移 |
| `mirror` | `\|> mirror` | 合わせ鏡反転 |
| `temporal` | `\|> temporal` | 時間タグ付加 |
| `timeless` | `\|> timeless` | 不変量抽出 |
| `symmetry` | `\|> symmetry` | 対称性分析 |

---

## v0.1 → v0.2 Migration

**完全後方互換。** v0.1で有効な全てのプログラムは、v0.2でも同一のセマンティクスで動作する。

全ての新機能は以下のいずれかとして追加：
- パイプコマンド (`|> new_command`)
- compute モード (`:zero`, `:pi`, `:e`, `:phi`, `:symbolic`)
- 型修飾子 (`Temporal<T>`, `Timeless<T>`)
- リテラル (`⊤`, `⊥`, `⊤π`, `⊥π`, `・`, `△{}`)
- 演算子 (`⤊`, `⤋`, `◁`) — 既存演算子との文法的衝突なし

---

## Implementation Status

| Component | Status | Lines |
|-----------|--------|-------|
| Lexer | ✅ Complete | ~280 |
| Parser (recursive descent) | ✅ Complete | ~470 |
| AST types | ✅ Complete | ~200 |
| Evaluator | ✅ Complete | ~450 |
| Environment (scopes) | ✅ Complete | ~180 |
| REPL | ✅ Complete | ~100 |
| Test suite | ✅ 85/85 passing | ~550 |
| **Total** | **✅** | **~2,230** |
