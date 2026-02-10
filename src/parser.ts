/**
 * ═══════════════════════════════════════════════════════════════════
 *  Rei (0₀式) Parser — Recursive Descent
 *  BNF v0.2 準拠 — Operator Precedence Table
 *  Author: Nobuki Fujimoto
 * ═══════════════════════════════════════════════════════════════════
 *
 *  Precedence (low → high):
 *  1. |> pipe
 *  2. ∧ ∨ (quad logic)
 *  3. >κ <κ =κ (kappa comparison)
 *  4. ⊕ + - (additive)
 *  5. ⊗ * · / (multiplicative)
 *  6. >> << ⤊ ⤋ (extend/reduce/spiral)
 *  7. ¬ (prefix not)
 *  8. . .κ (member access)
 */

import { Token, TokenType } from './lexer';
import * as AST from './ast';

export class ParseError extends Error {
  constructor(msg: string, public token: Token) {
    super(`Parse error at line ${token.line}:${token.col}: ${msg}`);
  }
}

export class Parser {
  private tokens: Token[];
  private pos: number = 0;

  constructor(tokens: Token[]) {
    this.tokens = tokens;
  }

  parse(): AST.ASTNode[] {
    const stmts: AST.ASTNode[] = [];
    while (!this.isAtEnd()) {
      const s = this.statement();
      if (s) stmts.push(s);
    }
    return stmts;
  }

  parseExpr(): AST.ASTNode {
    return this.expression();
  }

  // ─── Statement ───

  private statement(): AST.ASTNode | null {
    if (this.check(TokenType.LET)) return this.letStatement();
    if (this.check(TokenType.COMPRESS) && this.isCompressDef()) return this.compressDefinition();
    return this.expression();
  }

  private letStatement(): AST.LetStmt {
    this.expect(TokenType.LET);
    const mutable = this.match(TokenType.MUT);
    const name = this.expect(TokenType.IDENT).value;

    let typeAnnotation: string | undefined;
    let phaseGuard: string | undefined;
    if (this.match(TokenType.COLON)) {
      typeAnnotation = this.expect(TokenType.IDENT).value;
      if (this.check(TokenType.PHASE)) {
        this.advance();
        phaseGuard = this.expect(TokenType.IDENT).value;
      }
    }

    this.expect(TokenType.ASSIGN);
    const value = this.expression();

    let witness: string | undefined;
    if (this.match(TokenType.WITNESSED)) {
      this.expect(TokenType.BY);
      witness = this.expect(TokenType.STRING).value;
    }

    return { kind: 'LetStmt', name, mutable, typeAnnotation, phaseGuard, value, witness };
  }

  private isCompressDef(): boolean {
    // Look ahead: compress IDENT (
    let i = this.pos + 1;
    // skip compress level markers
    while (i < this.tokens.length && this.tokens[i].type === TokenType.NUMBER) i++;
    if (i < this.tokens.length && this.tokens[i].type === TokenType.IDENT) {
      i++;
      if (i < this.tokens.length && this.tokens[i].type === TokenType.LPAREN) return true;
    }
    return false;
  }

  private compressDefinition(): AST.CompressDef {
    this.expect(TokenType.COMPRESS);

    let level: string | undefined;
    // compress level via superscript or bracket notation handled at lexer level
    // For now, parse simple form: compress name(params) = body
    const name = this.expect(TokenType.IDENT).value;
    this.expect(TokenType.LPAREN);

    const params: { name: string; type?: string; phaseGuard?: string }[] = [];
    if (!this.check(TokenType.RPAREN)) {
      do {
        const pname = this.expect(TokenType.IDENT).value;
        let ptype: string | undefined;
        let pguard: string | undefined;
        if (this.match(TokenType.COLON)) {
          ptype = this.expect(TokenType.IDENT).value;
          if (this.check(TokenType.PHASE)) {
            this.advance();
            pguard = this.expect(TokenType.IDENT).value;
          }
        }
        params.push({ name: pname, type: ptype, phaseGuard: pguard });
      } while (this.match(TokenType.COMMA));
    }
    this.expect(TokenType.RPAREN);

    let returnType: string | undefined;
    if (this.match(TokenType.ARROW)) {
      returnType = this.expect(TokenType.IDENT).value;
    }

    this.expect(TokenType.ASSIGN);
    const body = this.expression();

    return { kind: 'CompressDef', name, level, params, returnType, body };
  }

  // ─── Expression Levels ───

  private expression(): AST.ASTNode {
    return this.pipe();
  }

  // Level 1: |> pipe
  private pipe(): AST.ASTNode {
    let left = this.logicOr();

    while (this.match(TokenType.PIPE_OP)) {
      // |> command or |> compute :mode or |> as :domain
      if (this.check(TokenType.COMPUTE)) {
        this.advance();
        this.expect(TokenType.COLON);
        const mode = this.expect(TokenType.IDENT).value;
        left = { kind: 'ComputeExpr', operand: left, mode } as AST.ComputeExpr;
      } else if (this.check(TokenType.AS)) {
        this.advance();
        this.expect(TokenType.COLON);
        const domain = this.expect(TokenType.IDENT).value;
        left = { kind: 'AsExpr', operand: left, domain } as AST.AsExpr;
      } else if (this.check(TokenType.COMPRESS)) {
        this.advance();
        let mode: string | undefined;
        if (this.match(TokenType.COLON)) {
          mode = this.expect(TokenType.IDENT).value;
        }
        left = { kind: 'CompressExpr', operand: left, mode } as AST.CompressExpr;
      } else if (this.check(TokenType.SEAL)) {
        this.advance();
        left = { kind: 'ISLExpr', expr: left, action: 'seal' } as AST.ISLExpr;
      } else if (this.check(TokenType.VERIFY)) {
        this.advance();
        left = { kind: 'ISLExpr', expr: left, action: 'verify' } as AST.ISLExpr;
      } else if (this.check(TokenType.FORWARD)) {
        this.advance();
        left = { kind: 'PipeExpr', left, command: 'forward' } as AST.PipeExpr;
      } else if (this.check(TokenType.MIRROR)) {
        this.advance();
        left = { kind: 'MirrorExpr', operand: left } as AST.MirrorExpr;
      } else if (this.check(TokenType.TEMPORAL)) {
        this.advance();
        left = { kind: 'TemporalExpr', expr: left } as AST.TemporalExpr;
      } else if (this.check(TokenType.TIMELESS)) {
        this.advance();
        left = { kind: 'TimelessExpr', expr: left } as AST.TimelessExpr;
      } else {
        const cmd = this.expect(TokenType.IDENT).value;
        const args: AST.ASTNode[] = [];
        // Optional args
        if (this.match(TokenType.LPAREN)) {
          if (!this.check(TokenType.RPAREN)) {
            do { args.push(this.expression()); } while (this.match(TokenType.COMMA));
          }
          this.expect(TokenType.RPAREN);
        }
        left = { kind: 'PipeExpr', left, command: cmd, args } as AST.PipeExpr;
      }
    }
    return left;
  }

  // Level 2: ∧ ∨
  private logicOr(): AST.ASTNode {
    let left = this.logicAnd();
    while (this.match(TokenType.OR)) {
      const right = this.logicAnd();
      left = { kind: 'BinaryExpr', op: '∨', left, right };
    }
    return left;
  }

  private logicAnd(): AST.ASTNode {
    let left = this.kappaComparison();
    while (this.match(TokenType.AND)) {
      const right = this.kappaComparison();
      left = { kind: 'BinaryExpr', op: '∧', left, right };
    }
    return left;
  }

  // Level 3: >κ <κ =κ
  private kappaComparison(): AST.ASTNode {
    let left = this.additive();
    if (this.check(TokenType.KAPPA_GT) || this.check(TokenType.KAPPA_LT) || this.check(TokenType.KAPPA_EQ)) {
      const op = this.advance().value;
      const right = this.additive();
      left = { kind: 'BinaryExpr', op, left, right };
    }
    return left;
  }

  // Level 4: + - ⊕
  private additive(): AST.ASTNode {
    let left = this.multiplicative();
    while (this.check(TokenType.PLUS) || this.check(TokenType.MINUS) || this.check(TokenType.OPLUS)) {
      const op = this.advance().value;
      const right = this.multiplicative();
      left = { kind: 'BinaryExpr', op, left, right };
    }
    return left;
  }

  // Level 5: * / ⊗ ·
  private multiplicative(): AST.ASTNode {
    let left = this.extendReduce();
    while (this.check(TokenType.STAR) || this.check(TokenType.SLASH) ||
           this.check(TokenType.OTIMES) || this.check(TokenType.CDOT)) {
      const op = this.advance().value;
      const right = this.extendReduce();
      left = { kind: 'BinaryExpr', op, left, right };
    }
    return left;
  }

  // Level 6: >> << ⤊ ⤋
  private extendReduce(): AST.ASTNode {
    let left = this.unaryPrefix();

    while (true) {
      if (this.match(TokenType.EXTEND_OP)) {
        this.expect(TokenType.COLON);
        const sub = this.expect(TokenType.IDENT).value;
        left = { kind: 'ExtendExpr', operand: left, subscript: sub } as AST.ExtendExpr;
      } else if (this.match(TokenType.REDUCE_OP)) {
        left = { kind: 'ReduceExpr', operand: left } as AST.ReduceExpr;
      } else if (this.match(TokenType.SPIRAL_UP)) {
        const depth = this.check(TokenType.NUMBER) ? parseInt(this.advance().value) : 1;
        left = { kind: 'SpiralExpr', operand: left, depth } as AST.SpiralExpr;
      } else if (this.match(TokenType.SPIRAL_DOWN)) {
        const depth = this.check(TokenType.NUMBER) ? parseInt(this.advance().value) : 1;
        left = { kind: 'ReverseSpiralExpr', operand: left, depth } as AST.ReverseSpiralExpr;
      } else {
        break;
      }
    }
    return left;
  }

  // Level 7: ¬ (prefix)
  private unaryPrefix(): AST.ASTNode {
    if (this.match(TokenType.NOT)) {
      const operand = this.unaryPrefix();
      return { kind: 'UnaryExpr', op: '¬', operand };
    }
    if (this.check(TokenType.MINUS) && !this.isPrevValue()) {
      this.advance();
      const operand = this.unaryPrefix();
      return { kind: 'UnaryExpr', op: '-', operand };
    }
    return this.memberAccess();
  }

  private isPrevValue(): boolean {
    if (this.pos === 0) return false;
    const prev = this.tokens[this.pos - 1];
    return [TokenType.NUMBER, TokenType.IDENT, TokenType.RPAREN, TokenType.RBRACE,
            TokenType.EXT_LIT, TokenType.ZERO_SUB].includes(prev.type);
  }

  // Level 8: . member access
  private memberAccess(): AST.ASTNode {
    let left = this.callExpr();
    while (this.match(TokenType.DOT)) {
      // Allow both IDENT and keywords in member position
      const tok = this.current();
      if (tok.type === TokenType.IDENT || this.isKeywordToken(tok.type)) {
        this.advance();
        left = { kind: 'MemberExpr', object: left, property: tok.value } as AST.MemberExpr;
      } else {
        throw new ParseError(`Expected property name but got ${tok.type}`, tok);
      }
    }
    return left;
  }

  private isKeywordToken(type: TokenType): boolean {
    return [
      TokenType.LET, TokenType.MUT, TokenType.COMPRESS, TokenType.COMPUTE,
      TokenType.WEIGHT, TokenType.GENESIS, TokenType.FORWARD, TokenType.AS,
      TokenType.WITNESSED, TokenType.BY, TokenType.SEAL, TokenType.VERIFY,
      TokenType.PHASE, TokenType.TEMPORAL, TokenType.TIMELESS,
      TokenType.PARALLEL, TokenType.MIRROR
    ].includes(type);
  }

  // Function call
  private callExpr(): AST.ASTNode {
    let expr = this.primary();
    while (this.check(TokenType.LPAREN)) {
      this.advance();
      const args: AST.ASTNode[] = [];
      if (!this.check(TokenType.RPAREN)) {
        do { args.push(this.expression()); } while (this.match(TokenType.COMMA));
      }
      this.expect(TokenType.RPAREN);
      expr = { kind: 'FunctionCall', callee: expr, args } as AST.FunctionCall;
    }
    return expr;
  }

  // ─── Primary ───

  private primary(): AST.ASTNode {
    const tok = this.current();

    // Number literal
    if (this.match(TokenType.NUMBER)) {
      return { kind: 'NumberLiteral', value: parseFloat(tok.value) };
    }

    // Extended literal
    if (this.match(TokenType.EXT_LIT)) {
      const base = tok.value[0];
      const subs = tok.value.slice(1).split('');
      return { kind: 'ExtendedLiteral', base, subscripts: subs };
    }

    // 0₀
    if (this.match(TokenType.ZERO_SUB)) {
      return { kind: 'ExtendedLiteral', base: '0', subscripts: ['₀'] };
    }

    // ・ dot
    if (this.match(TokenType.DOT_PRIM)) {
      return { kind: 'DotLiteral' };
    }

    // Quad logic literals
    if (this.match(TokenType.QUAD_TRUE)) return { kind: 'QuadLiteral', value: '⊤' };
    if (this.match(TokenType.QUAD_FALSE)) return { kind: 'QuadLiteral', value: '⊥' };
    if (this.match(TokenType.QUAD_TRUE_PI)) return { kind: 'QuadLiteral', value: '⊤π' };
    if (this.match(TokenType.QUAD_FALSE_PI)) return { kind: 'QuadLiteral', value: '⊥π' };

    // π, φ as constants
    if (this.match(TokenType.PI)) return { kind: 'NumberLiteral', value: Math.PI };
    if (this.match(TokenType.PHI)) return { kind: 'NumberLiteral', value: (1 + Math.sqrt(5)) / 2 };

    // String
    if (this.match(TokenType.STRING)) {
      return { kind: 'StringLiteral', value: tok.value };
    }

    // 𝕄{center; neighbors}
    if (this.match(TokenType.MDIM)) {
      return this.multiDimLiteral();
    }

    // 𝕌{ext, mdim}
    if (this.match(TokenType.UNIFIED)) {
      return this.unifiedLiteral();
    }

    // Shape literals: △{...} □{...} etc.
    if (this.check(TokenType.TRIANGLE) || this.check(TokenType.SQUARE) ||
        this.check(TokenType.CIRCLE) || this.check(TokenType.DIAMOND)) {
      return this.shapeLiteral();
    }

    // genesis()
    if (this.match(TokenType.GENESIS)) {
      if (this.match(TokenType.LPAREN)) this.expect(TokenType.RPAREN);
      return { kind: 'GenesisExpr' };
    }

    // Parenthesized expression
    if (this.match(TokenType.LPAREN)) {
      const expr = this.expression();
      this.expect(TokenType.RPAREN);
      return expr;
    }

    // Identifier
    if (this.match(TokenType.IDENT)) {
      return { kind: 'Identifier', name: tok.value };
    }

    throw new ParseError(`Unexpected token: ${tok.value} (${tok.type})`, tok);
  }

  private multiDimLiteral(): AST.MultiDimLiteral {
    this.expect(TokenType.LBRACE);
    const center = this.expression();
    this.expect(TokenType.SEMICOLON);

    const neighbors: { value: AST.ASTNode; weight?: AST.ASTNode }[] = [];
    do {
      const val = this.expression();
      let weight: AST.ASTNode | undefined;
      if (this.match(TokenType.WEIGHT)) {
        weight = this.expression();
      }
      neighbors.push({ value: val, weight });
    } while (this.match(TokenType.COMMA));

    this.expect(TokenType.RBRACE);
    return { kind: 'MultiDimLiteral', center, neighbors };
  }

  private unifiedLiteral(): AST.UnifiedLiteral {
    this.expect(TokenType.LBRACE);
    const extPart = this.expression();
    this.expect(TokenType.COMMA);
    const mdimPart = this.expression();
    this.expect(TokenType.RBRACE);
    return { kind: 'UnifiedLiteral', extPart, mdimPart };
  }

  private shapeLiteral(): AST.ShapeLiteral {
    const shape = this.advance().value;
    this.expect(TokenType.LBRACE);
    const points: AST.ASTNode[] = [];
    if (!this.check(TokenType.RBRACE)) {
      do { points.push(this.expression()); } while (this.match(TokenType.COMMA));
    }
    this.expect(TokenType.RBRACE);
    return { kind: 'ShapeLiteral', shape, points };
  }

  // ─── Utility ───

  private current(): Token { return this.tokens[this.pos]; }
  private isAtEnd(): boolean { return this.current().type === TokenType.EOF; }

  private check(type: TokenType): boolean {
    return !this.isAtEnd() && this.current().type === type;
  }

  private match(type: TokenType): boolean {
    if (this.check(type)) { this.advance(); return true; }
    return false;
  }

  private advance(): Token {
    const t = this.tokens[this.pos];
    if (!this.isAtEnd()) this.pos++;
    return t;
  }

  private expect(type: TokenType): Token {
    if (this.check(type)) return this.advance();
    const t = this.current();
    throw new ParseError(`Expected ${type} but got ${t.type} (${t.value})`, t);
  }
}
