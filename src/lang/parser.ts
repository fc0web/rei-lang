// ============================================================
// Rei (0₀式) Parser — 構文解析器（再帰下降）
// BNF v0.2 準拠
// Author: Nobuki Fujimoto
// ============================================================

import { Token, TokenType, TokenTypeValue } from './lexer';
import type { ASTNode, NodeType } from '../core/types';

function node(type: NodeType, props: Record<string, any> = {}): ASTNode {
  return { type, ...props };
}

export class Parser {
  private pos: number = 0;
  private tokens: Token[];

  constructor(tokens: Token[]) {
    this.tokens = tokens.filter(t => t.type !== TokenType.NEWLINE);
  }

  parseProgram(): ASTNode {
    const stmts: ASTNode[] = [];
    while (!this.isAtEnd()) {
      while (this.check(TokenType.SEMICOLON)) this.advance();
      if (this.isAtEnd()) break;
      stmts.push(this.parseStatement());
      while (this.check(TokenType.SEMICOLON)) this.advance();
    }
    return node('Program', { body: stmts });
  }

  private parseStatement(): ASTNode {
    if (this.check(TokenType.LET)) return this.parseLetStmt();
    if (this.check(TokenType.COMPRESS)) return this.parseCompressDef();
    return this.parseExpression();
  }

  // --- let [mut] name [: type] = expr [witnessed by "..."] ---
  private parseLetStmt(): ASTNode {
    this.expect(TokenType.LET);
    const mutable = this.match(TokenType.MUT);
    const name = this.expect(TokenType.IDENT).value;

    // Optional type annotation
    let typeAnnotation: string | null = null;
    let phaseGuard: string | null = null;
    if (this.match(TokenType.COLON)) {
      typeAnnotation = this.expect(TokenType.IDENT).value;
      // Check for phase guard @phase
      if (this.check(TokenType.IDENT) && this.peek().value.startsWith('@')) {
        phaseGuard = this.advance().value.slice(1);
      }
    }

    this.expect(TokenType.ASSIGN);
    const init = this.parseExpression();

    // Optional witness clause
    let witness: string | null = null;
    if (this.match(TokenType.WITNESSED)) {
      this.expect(TokenType.BY);
      witness = this.expect(TokenType.STRING).value;
    }

    return node(mutable ? 'MutStmt' : 'LetStmt', {
      name, init, typeAnnotation, phaseGuard, witness,
    });
  }

  // --- compress [level] name(params) [-> type] = body ---
  private parseCompressDef(): ASTNode {
    const compressToken = this.expect(TokenType.COMPRESS);
    const level = this.parseCompressLevel(compressToken.value);
    const name = this.expect(TokenType.IDENT).value;

    this.expect(TokenType.LPAREN);
    const params: string[] = [];
    if (!this.check(TokenType.RPAREN)) {
      params.push(this.parseParamDecl());
      while (this.match(TokenType.COMMA)) {
        params.push(this.parseParamDecl());
      }
    }
    this.expect(TokenType.RPAREN);

    // Optional return type
    let returnType: string | null = null;
    if (this.match(TokenType.ARROW)) {
      returnType = this.expect(TokenType.IDENT).value;
    }

    this.expect(TokenType.ASSIGN);
    const body = this.parseExpression();

    return node('CompressDef', { name, params, body, level, returnType });
  }

  private parseCompressLevel(value: string): number {
    if (value === 'compress') return -1; // default
    const suffixMap: Record<string, number> = {
      'compress⁰': 0, 'compress¹': 1, 'compress²': 2,
      'compress³': 3, 'compress∞': Infinity,
    };
    return suffixMap[value] ?? -1;
  }

  private parseParamDecl(): string {
    // Accept IDENT, or math constant names used as param names (e, i)
    let name: string;
    if (this.check(TokenType.IDENT)) {
      name = this.advance().value;
    } else if (this.check(TokenType.CONST_E)) {
      name = this.advance().value;
    } else if (this.check(TokenType.CONST_I)) {
      name = this.advance().value;
    } else {
      name = this.expect(TokenType.IDENT).value;
    }
    // Optional type annotation
    if (this.match(TokenType.COLON)) {
      this.expect(TokenType.IDENT); // consume type name
    }
    return name;
  }

  // --- Expression hierarchy (low → high precedence) ---

  private parseExpression(): ASTNode {
    return this.parsePipe();
  }

  // Level 1: |> pipe, ◁ reflect
  private parsePipe(): ASTNode {
    let left = this.parseLogicOr();
    while (this.check(TokenType.PIPE_OP) || this.check(TokenType.REFLECT)) {
      if (this.match(TokenType.PIPE_OP)) {
        // Pipe command: expr |> command [:mode] [args]
        const cmd = this.parsePipeCommand();
        left = node('Pipe', { input: left, command: cmd });
      } else if (this.match(TokenType.REFLECT)) {
        const right = this.parseLogicOr();
        left = node('ReflectOp', { left, right });
      }
    }
    return left;
  }

  private parsePipeCommand(): ASTNode {
    // command can be: ident, ident :mode, ident(args)
    if (this.check(TokenType.IDENT) || this.check(TokenType.GENESIS)) {
      const cmd = this.advance().value;
      let mode: string | null = null;
      let args: ASTNode[] = [];

      // :mode
      if (this.match(TokenType.COLON)) {
        mode = this.expect(TokenType.IDENT).value;
      }

      // (args)
      if (this.match(TokenType.LPAREN)) {
        if (!this.check(TokenType.RPAREN)) {
          args.push(this.parseExpression());
          while (this.match(TokenType.COMMA)) args.push(this.parseExpression());
        }
        this.expect(TokenType.RPAREN);
      }

      return node('PipeCmd', { cmd, mode, args });
    }
    // Converge/Diverge
    if (this.match(TokenType.CONVERGE)) return node('PipeCmd', { cmd: '⤊', mode: null, args: [] });
    if (this.match(TokenType.DIVERGE)) return node('PipeCmd', { cmd: '⤋', mode: null, args: [] });

    throw this.error('パイプコマンドが必要');
  }

  // Level 2: ∧ ∨ (logic)
  private parseLogicOr(): ASTNode {
    let left = this.parseLogicAnd();
    while (this.match(TokenType.OR)) {
      const right = this.parseLogicAnd();
      left = node('BinOp', { op: '∨', left, right });
    }
    return left;
  }

  private parseLogicAnd(): ASTNode {
    let left = this.parseComparison();
    while (this.match(TokenType.AND)) {
      const right = this.parseComparison();
      left = node('BinOp', { op: '∧', left, right });
    }
    return left;
  }

  // Level 3: >κ <κ =κ == != > < >= <=
  private parseComparison(): ASTNode {
    let left = this.parseAddition();
    const compOps = [
      TokenType.GT_K, TokenType.LT_K, TokenType.EQ_K,
      TokenType.EQ, TokenType.NEQ,
      TokenType.GT, TokenType.LT, TokenType.GTE, TokenType.LTE,
    ];
    while (compOps.some(op => this.check(op))) {
      const opToken = this.advance();
      const right = this.parseAddition();
      left = node('BinOp', { op: opToken.value, left, right });
    }
    return left;
  }

  // Level 4: + - ⊕
  private parseAddition(): ASTNode {
    let left = this.parseMultiplication();
    while (this.check(TokenType.PLUS) || this.check(TokenType.MINUS) || this.check(TokenType.OPLUS)) {
      const op = this.advance().value;
      const right = this.parseMultiplication();
      left = node('BinOp', { op, left, right });
    }
    return left;
  }

  // Level 5: * / ⊗ ·
  private parseMultiplication(): ASTNode {
    let left = this.parseExtendReduce();
    while (this.check(TokenType.STAR) || this.check(TokenType.SLASH) ||
           this.check(TokenType.OTIMES) || this.check(TokenType.CDOT)) {
      const op = this.advance().value;
      const right = this.parseExtendReduce();
      left = node('BinOp', { op, left, right });
    }
    return left;
  }

  // Level 6: >> << ⤊ ⤋
  private parseExtendReduce(): ASTNode {
    let left = this.parseUnary();
    while (true) {
      if (this.match(TokenType.EXTEND)) {
        // >> :subscript or >> expr
        if (this.match(TokenType.COLON)) {
          const sub = this.expect(TokenType.IDENT).value;
          left = node('Extend', { target: left, subscript: sub });
        } else {
          const right = this.parseUnary();
          left = node('Extend', { target: left, expr: right });
        }
      } else if (this.match(TokenType.REDUCE)) {
        left = node('Reduce', { target: left });
      } else if (this.match(TokenType.CONVERGE)) {
        const right = this.parseUnary();
        left = node('ConvergeOp', { left, right });
      } else if (this.match(TokenType.DIVERGE)) {
        const right = this.parseUnary();
        left = node('DivergeOp', { left, right });
      } else {
        break;
      }
    }
    return left;
  }

  // Level 7: unary ¬ -
  private parseUnary(): ASTNode {
    if (this.match(TokenType.NOT)) {
      const operand = this.parseUnary();
      return node('UnaryOp', { op: '¬', operand });
    }
    if (this.check(TokenType.MINUS) && this.shouldNegateBePrefix()) {
      this.advance();
      const operand = this.parseUnary();
      return node('UnaryOp', { op: '-', operand });
    }
    return this.parsePostfix();
  }

  // Level 8: . member access, [index], (call)
  private parsePostfix(): ASTNode {
    let left = this.parsePrimary();
    while (true) {
      if (this.match(TokenType.DOT)) {
        if (this.check(TokenType.IDENT)) {
          const member = this.advance().value;
          // Check for κ suffix
          if (this.match(TokenType.DOT) && this.check(TokenType.IDENT) && this.peek().value === 'κ') {
            this.advance();
            left = node('MemberAccess', { object: left, member, kappa: true });
          } else {
            left = node('MemberAccess', { object: left, member, kappa: false });
          }
        }
      } else if (this.match(TokenType.LPAREN)) {
        // Function call
        const args: ASTNode[] = [];
        if (!this.check(TokenType.RPAREN)) {
          args.push(this.parseExpression());
          while (this.match(TokenType.COMMA)) args.push(this.parseExpression());
        }
        this.expect(TokenType.RPAREN);
        left = node('FnCall', { callee: left, args });
      } else if (this.match(TokenType.LBRACKET)) {
        const index = this.parseExpression();
        this.expect(TokenType.RBRACKET);
        left = node('IndexAccess', { object: left, index });
      } else {
        break;
      }
    }
    return left;
  }

  // --- Primary expressions ---
  private parsePrimary(): ASTNode {
    // Number literal
    if (this.check(TokenType.NUMBER)) {
      const val = this.advance().value;
      return node('NumLit', { value: parseFloat(val) });
    }

    // String literal
    if (this.check(TokenType.STRING)) {
      return node('StrLit', { value: this.advance().value });
    }

    // Boolean
    if (this.match(TokenType.TRUE)) return node('BoolLit', { value: true });
    if (this.match(TokenType.FALSE)) return node('BoolLit', { value: false });

    // Null
    if (this.match(TokenType.NULL)) return node('NullLit', {});

    // Extended literal
    if (this.check(TokenType.EXT_LIT)) {
      const val = this.advance().value;
      return node('ExtLit', { raw: val });
    }

    // 0₀
    if (this.match(TokenType.SYMBOL_0_0)) {
      return node('ExtLit', { raw: '0₀' });
    }

    // ・ (primordial dot)
    if (this.match(TokenType.SYMBOL_DOT_PRIM)) {
      return node('ConstLit', { value: '・' });
    }

    // Math constants
    if (this.match(TokenType.CONST_PI)) return node('NumLit', { value: Math.PI });
    if (this.match(TokenType.CONST_E)) return node('NumLit', { value: Math.E });
    if (this.match(TokenType.CONST_PHI)) return node('NumLit', { value: (1 + Math.sqrt(5)) / 2 });
    if (this.match(TokenType.CONST_I)) return node('ConstLit', { value: 'i' });
    if (this.match(TokenType.CONST_EMPTY)) return node('ConstLit', { value: '∅' });
    if (this.match(TokenType.CONST_PHI_UP)) return node('ConstLit', { value: 'Φ' });
    if (this.match(TokenType.CONST_PSI_UP)) return node('ConstLit', { value: 'Ψ' });
    if (this.match(TokenType.CONST_OMEGA_UP)) return node('ConstLit', { value: 'Ω' });

    // Quad literals
    if (this.match(TokenType.QUAD_TOP)) return node('QuadLit', { value: 'top' });
    if (this.match(TokenType.QUAD_BOT)) return node('QuadLit', { value: 'bottom' });
    if (this.match(TokenType.QUAD_TOP_PI)) return node('QuadLit', { value: 'topPi' });
    if (this.match(TokenType.QUAD_BOT_PI)) return node('QuadLit', { value: 'bottomPi' });

    // 𝕄{ MDim literal
    if (this.match(TokenType.MDIM_OPEN)) {
      return this.parseMDimLit();
    }

    // Array literal [...]
    if (this.match(TokenType.LBRACKET)) {
      const elems: ASTNode[] = [];
      if (!this.check(TokenType.RBRACKET)) {
        elems.push(this.parseExpression());
        while (this.match(TokenType.COMMA)) elems.push(this.parseExpression());
      }
      this.expect(TokenType.RBRACKET);
      return node('ArrayLit', { elements: elems });
    }

    // Parenthesized expression
    if (this.match(TokenType.LPAREN)) {
      const expr = this.parseExpression();
      this.expect(TokenType.RPAREN);
      return expr;
    }

    // If expression
    if (this.check(TokenType.IF)) return this.parseIfExpr();

    // Match expression
    if (this.check(TokenType.MATCH)) return this.parseMatchExpr();

    // Genesis
    if (this.check(TokenType.GENESIS)) {
      this.advance();
      if (this.match(TokenType.LPAREN)) {
        this.expect(TokenType.RPAREN);
      }
      return node('FnCall', { callee: node('Ident', { name: 'genesis' }), args: [] });
    }

    // Identifier
    if (this.check(TokenType.IDENT)) {
      const name = this.advance().value;
      return node('Ident', { name });
    }

    throw this.error(`予期しないトークン: ${this.peek().value} (${this.peek().type})`);
  }

  // --- MDim literal: 𝕄{center; n1, n2, ... [weight w] [mode]} ---
  private parseMDimLit(): ASTNode {
    const center = this.parseExpression();
    this.expect(TokenType.SEMICOLON);
    const neighbors: ASTNode[] = [];
    neighbors.push(this.parseExpression());
    while (this.match(TokenType.COMMA)) {
      if (this.check(TokenType.RBRACE)) break;
      if (this.check(TokenType.WEIGHT)) break;
      neighbors.push(this.parseExpression());
    }

    // Optional weight
    let weight: ASTNode | null = null;
    if (this.match(TokenType.WEIGHT)) {
      weight = this.parseExpression();
    }

    // Optional mode
    let mode: string = 'weighted';
    if (this.match(TokenType.COLON)) {
      if (this.check(TokenType.IDENT)) {
        mode = this.advance().value;
      }
    }

    this.expect(TokenType.RBRACE);
    return node('MDimLit', { center, neighbors, weight, mode });
  }

  // --- if expr then expr else expr ---
  private parseIfExpr(): ASTNode {
    this.expect(TokenType.IF);
    const cond = this.parseExpression();
    this.expect(TokenType.THEN);
    const then = this.parseExpression();
    this.expect(TokenType.ELSE);
    const elseExpr = this.parseExpression();
    return node('IfExpr', { cond, then, else: elseExpr });
  }

  // --- match expr { case pat -> expr, ... } ---
  private parseMatchExpr(): ASTNode {
    this.expect(TokenType.MATCH);
    const target = this.parseExpression();
    this.expect(TokenType.LBRACE);
    const cases: { pattern: ASTNode; body: ASTNode }[] = [];
    while (!this.check(TokenType.RBRACE) && !this.isAtEnd()) {
      this.expect(TokenType.CASE);
      const pattern = this.parsePrimary();
      this.expect(TokenType.ARROW);
      const body = this.parseExpression();
      cases.push({ pattern, body });
      this.match(TokenType.COMMA);
    }
    this.expect(TokenType.RBRACE);
    return node('MatchExpr', { target, cases });
  }

  // --- Helpers ---
  private peek(): Token { return this.tokens[this.pos] || { type: TokenType.EOF, value: '', line: 0, col: 0 }; }
  private isAtEnd(): boolean { return this.peek().type === TokenType.EOF; }
  private check(type: TokenTypeValue): boolean { return this.peek().type === type; }
  private checkAhead(type: TokenTypeValue, offset: number): boolean {
    const idx = this.pos + offset;
    return idx < this.tokens.length && this.tokens[idx].type === type;
  }
  private advance(): Token { const t = this.tokens[this.pos]; this.pos++; return t; }
  private match(type: TokenTypeValue): boolean {
    if (this.check(type)) { this.advance(); return true; }
    return false;
  }
  private expect(type: TokenTypeValue): Token {
    if (this.check(type)) return this.advance();
    const t = this.peek();
    throw this.error(`期待: ${type}, 実際: ${t.type} ("${t.value}")`);
  }
  private error(msg: string): Error {
    const t = this.peek();
    return new Error(`[行 ${t.line}:${t.col}] 構文エラー: ${msg}`);
  }
  private shouldNegateBePrefix(): boolean {
    if (this.pos === 0) return true;
    const prev = this.tokens[this.pos - 1];
    return [
      TokenType.LPAREN, TokenType.COMMA, TokenType.ASSIGN,
      TokenType.PLUS, TokenType.MINUS, TokenType.STAR, TokenType.SLASH,
      TokenType.OPLUS, TokenType.OTIMES, TokenType.PIPE_OP,
      TokenType.SEMICOLON, TokenType.LBRACKET, TokenType.COLON,
    ].includes(prev.type as any);
  }
}
