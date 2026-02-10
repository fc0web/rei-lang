/**
 * ═══════════════════════════════════════════════════════════════════
 *  Rei (0₀式) Lexer — Tokenizer
 *  BNF v0.2 準拠
 *  Author: Nobuki Fujimoto
 * ═══════════════════════════════════════════════════════════════════
 */

export enum TokenType {
  // Literals
  NUMBER = 'NUMBER',
  STRING = 'STRING',
  EXT_LIT = 'EXT_LIT',         // 0ooo, πxx, eoo, φoo, ioo
  ZERO_SUB = 'ZERO_SUB',       // 0₀
  DOT_PRIM = 'DOT_PRIM',       // ・

  // Multi-dim / Unified
  MDIM = 'MDIM',               // 𝕄
  UNIFIED = 'UNIFIED',         // 𝕌

  // Shapes
  TRIANGLE = 'TRIANGLE',       // △
  SQUARE = 'SQUARE',           // □
  CIRCLE = 'CIRCLE',           // ○
  DIAMOND = 'DIAMOND',         // ◇

  // Quad logic
  QUAD_TRUE = 'QUAD_TRUE',     // ⊤
  QUAD_FALSE = 'QUAD_FALSE',   // ⊥
  QUAD_TRUE_PI = 'QUAD_TRUE_PI',  // ⊤π
  QUAD_FALSE_PI = 'QUAD_FALSE_PI', // ⊥π

  // Math constants
  PI = 'PI',
  E_CONST = 'E_CONST',
  PHI = 'PHI',
  I_CONST = 'I_CONST',

  // Keywords
  LET = 'LET',
  MUT = 'MUT',
  COMPRESS = 'COMPRESS',
  COMPUTE = 'COMPUTE',
  WEIGHT = 'WEIGHT',
  EXTEND = 'EXTEND',           // keyword form
  GENESIS = 'GENESIS',
  FORWARD = 'FORWARD',
  AS = 'AS',
  WITNESSED = 'WITNESSED',
  BY = 'BY',
  SEAL = 'SEAL',
  VERIFY = 'VERIFY',
  PHASE = 'PHASE',
  TEMPORAL = 'TEMPORAL',
  TIMELESS = 'TIMELESS',
  PARALLEL = 'PARALLEL',
  MIRROR = 'MIRROR',

  // Identifiers
  IDENT = 'IDENT',

  // Operators
  PLUS = 'PLUS',
  MINUS = 'MINUS',
  STAR = 'STAR',
  SLASH = 'SLASH',
  OPLUS = 'OPLUS',             // ⊕
  OTIMES = 'OTIMES',           // ⊗
  CDOT = 'CDOT',               // ·
  PIPE_OP = 'PIPE_OP',         // |>
  EXTEND_OP = 'EXTEND_OP',     // >>
  REDUCE_OP = 'REDUCE_OP',     // <<
  SPIRAL_UP = 'SPIRAL_UP',     // ⤊
  SPIRAL_DOWN = 'SPIRAL_DOWN', // ⤋
  MIRROR_OP = 'MIRROR_OP',     // ◁
  AND = 'AND',                 // ∧
  OR = 'OR',                   // ∨
  NOT = 'NOT',                 // ¬
  KAPPA_GT = 'KAPPA_GT',       // >κ
  KAPPA_LT = 'KAPPA_LT',      // <κ
  KAPPA_EQ = 'KAPPA_EQ',       // =κ
  ASSIGN = 'ASSIGN',           // =
  ARROW = 'ARROW',             // ->

  // Delimiters
  LPAREN = 'LPAREN',
  RPAREN = 'RPAREN',
  LBRACE = 'LBRACE',
  RBRACE = 'RBRACE',
  LBRACKET = 'LBRACKET',
  RBRACKET = 'RBRACKET',
  COMMA = 'COMMA',
  SEMICOLON = 'SEMICOLON',
  COLON = 'COLON',
  DOT = 'DOT',

  // Special
  EOF = 'EOF',
  NEWLINE = 'NEWLINE',
}

export interface Token {
  type: TokenType;
  value: string;
  line: number;
  col: number;
}

const KEYWORDS: Record<string, TokenType> = {
  'let': TokenType.LET,
  'mut': TokenType.MUT,
  'compress': TokenType.COMPRESS,
  'compute': TokenType.COMPUTE,
  'weight': TokenType.WEIGHT,
  'genesis': TokenType.GENESIS,
  'forward': TokenType.FORWARD,
  'as': TokenType.AS,
  'witnessed': TokenType.WITNESSED,
  'by': TokenType.BY,
  'seal': TokenType.SEAL,
  'verify': TokenType.VERIFY,
  'phase': TokenType.PHASE,
  'temporal': TokenType.TEMPORAL,
  'timeless': TokenType.TIMELESS,
  'parallel': TokenType.PARALLEL,
  'mirror': TokenType.MIRROR,
};

// Subscript chars valid in extended literals
const SUBSCRIPT_CHARS = new Set('oxzwensbua'.split(''));

export class Lexer {
  private source: string;
  private chars: string[];
  private pos: number = 0;
  private line: number = 1;
  private col: number = 1;
  private tokens: Token[] = [];

  constructor(source: string) {
    this.source = source;
    this.chars = Array.from(source); // Unicode-safe
  }

  tokenize(): Token[] {
    this.tokens = [];
    while (this.pos < this.chars.length) {
      this.skipWhitespace();
      if (this.pos >= this.chars.length) break;

      const ch = this.chars[this.pos];

      // Comments
      if (ch === '/' && this.peek(1) === '/') {
        this.skipLineComment();
        continue;
      }

      // String literals
      if (ch === '"') { this.readString(); continue; }

      // 0₀ symbol
      if (ch === '0' && this.peek(1) === '₀') {
        this.emit(TokenType.ZERO_SUB, '0₀', 2);
        continue;
      }

      // Extended literals: 0ooo, πooo, eooo, φooo, iooo
      if (this.isExtBase(ch) && this.isSubscriptStart()) {
        this.readExtLiteral();
        continue;
      }

      // Number
      if (this.isDigit(ch) || (ch === '-' && this.isDigit(this.peek(1) ?? '') && this.shouldNegateAsLiteral())) {
        this.readNumber();
        continue;
      }

      // Unicode symbols (single char)
      if (this.tryUnicodeSymbol()) continue;

      // Multi-char operators
      if (this.tryMultiCharOp()) continue;

      // Single-char operators & delimiters
      if (this.trySingleCharOp(ch)) continue;

      // Identifiers & keywords
      if (this.isIdentStart(ch)) {
        this.readIdentifier();
        continue;
      }

      // Colon (for :mode syntax)
      if (ch === ':') {
        this.emit(TokenType.COLON, ':', 1);
        continue;
      }

      // Unknown — skip
      this.pos++;
      this.col++;
    }

    this.tokens.push({ type: TokenType.EOF, value: '', line: this.line, col: this.col });
    return this.tokens;
  }

  // ─── Helpers ───

  private peek(offset: number = 0): string | undefined {
    return this.chars[this.pos + offset];
  }

  private emit(type: TokenType, value: string, length: number) {
    this.tokens.push({ type, value, line: this.line, col: this.col });
    this.pos += length;
    this.col += length;
  }

  private skipWhitespace() {
    while (this.pos < this.chars.length) {
      const ch = this.chars[this.pos];
      if (ch === '\n') {
        this.line++;
        this.col = 1;
        this.pos++;
      } else if (ch === ' ' || ch === '\t' || ch === '\r') {
        this.pos++;
        this.col++;
      } else {
        break;
      }
    }
  }

  private skipLineComment() {
    while (this.pos < this.chars.length && this.chars[this.pos] !== '\n') {
      this.pos++;
    }
  }

  private isDigit(ch: string): boolean {
    return ch >= '0' && ch <= '9';
  }

  private isIdentStart(ch: string): boolean {
    return (ch >= 'a' && ch <= 'z') || (ch >= 'A' && ch <= 'Z') || ch === '_';
  }

  private isIdentChar(ch: string): boolean {
    return this.isIdentStart(ch) || this.isDigit(ch);
  }

  private isExtBase(ch: string): boolean {
    return ch === '0' || ch === 'π' || ch === 'e' || ch === 'φ' || ch === 'i';
  }

  private isSubscriptStart(): boolean {
    const next = this.peek(1);
    if (next === undefined || !SUBSCRIPT_CHARS.has(next)) return false;

    // For 'e' and 'i' bases: ensure we're not actually at the start of an identifier
    // e.g., 'exponential' should be IDENT, not EXT_LIT 'ex' + IDENT 'ponential'
    const ch = this.chars[this.pos];
    if (ch === 'e' || ch === 'i') {
      // Look ahead past all subscript chars — if followed by more ident chars, it's an identifier
      let lookahead = this.pos + 1;
      while (lookahead < this.chars.length && SUBSCRIPT_CHARS.has(this.chars[lookahead])) {
        lookahead++;
      }
      if (lookahead < this.chars.length && this.isIdentChar(this.chars[lookahead])) {
        return false; // Part of a longer identifier
      }
    }
    return true;
  }

  private shouldNegateAsLiteral(): boolean {
    // Negative number literal only after: (, [, {, ,, ;, =, operators, or at start
    if (this.tokens.length === 0) return true;
    const last = this.tokens[this.tokens.length - 1];
    return [
      TokenType.LPAREN, TokenType.LBRACKET, TokenType.LBRACE,
      TokenType.COMMA, TokenType.SEMICOLON, TokenType.ASSIGN,
      TokenType.PIPE_OP, TokenType.OPLUS, TokenType.OTIMES,
      TokenType.PLUS, TokenType.MINUS, TokenType.STAR, TokenType.SLASH,
      TokenType.COLON
    ].includes(last.type);
  }

  private readString() {
    this.pos++; this.col++; // skip opening "
    let val = '';
    while (this.pos < this.chars.length && this.chars[this.pos] !== '"') {
      if (this.chars[this.pos] === '\\') {
        this.pos++; this.col++;
        const esc = this.chars[this.pos];
        if (esc === 'n') val += '\n';
        else if (esc === 't') val += '\t';
        else val += esc;
      } else {
        val += this.chars[this.pos];
      }
      this.pos++; this.col++;
    }
    this.pos++; this.col++; // skip closing "
    this.tokens.push({ type: TokenType.STRING, value: val, line: this.line, col: this.col });
  }

  private readExtLiteral() {
    const startCol = this.col;
    let val = this.chars[this.pos];
    this.pos++; this.col++;
    while (this.pos < this.chars.length && SUBSCRIPT_CHARS.has(this.chars[this.pos])) {
      val += this.chars[this.pos];
      this.pos++; this.col++;
    }
    this.tokens.push({ type: TokenType.EXT_LIT, value: val, line: this.line, col: startCol });
  }

  private readNumber() {
    const startCol = this.col;
    let val = '';
    if (this.chars[this.pos] === '-') {
      val += '-';
      this.pos++; this.col++;
    }
    while (this.pos < this.chars.length && this.isDigit(this.chars[this.pos])) {
      val += this.chars[this.pos];
      this.pos++; this.col++;
    }
    if (this.pos < this.chars.length && this.chars[this.pos] === '.' &&
        this.peek(1) !== undefined && this.isDigit(this.peek(1)!)) {
      val += '.';
      this.pos++; this.col++;
      while (this.pos < this.chars.length && this.isDigit(this.chars[this.pos])) {
        val += this.chars[this.pos];
        this.pos++; this.col++;
      }
    }
    this.tokens.push({ type: TokenType.NUMBER, value: val, line: this.line, col: startCol });
  }

  private readIdentifier() {
    const startCol = this.col;
    let val = '';
    while (this.pos < this.chars.length && this.isIdentChar(this.chars[this.pos])) {
      val += this.chars[this.pos];
      this.pos++; this.col++;
    }
    const kwType = KEYWORDS[val];
    if (kwType) {
      this.tokens.push({ type: kwType, value: val, line: this.line, col: startCol });
    } else {
      this.tokens.push({ type: TokenType.IDENT, value: val, line: this.line, col: startCol });
    }
  }

  private tryUnicodeSymbol(): boolean {
    const ch = this.chars[this.pos];
    const map: Record<string, TokenType> = {
      '𝕄': TokenType.MDIM,
      '𝕌': TokenType.UNIFIED,
      '⊕': TokenType.OPLUS,
      '⊗': TokenType.OTIMES,
      '·': TokenType.CDOT,
      '⤊': TokenType.SPIRAL_UP,
      '⤋': TokenType.SPIRAL_DOWN,
      '◁': TokenType.MIRROR_OP,
      '∧': TokenType.AND,
      '∨': TokenType.OR,
      '¬': TokenType.NOT,
      '△': TokenType.TRIANGLE,
      '□': TokenType.SQUARE,
      '○': TokenType.CIRCLE,
      '◇': TokenType.DIAMOND,
      '・': TokenType.DOT_PRIM,
    };

    // ⊤π / ⊥π  (2-char combo)
    if (ch === '⊤' && this.peek(1) === 'π') {
      this.emit(TokenType.QUAD_TRUE_PI, '⊤π', 2);
      return true;
    }
    if (ch === '⊥' && this.peek(1) === 'π') {
      this.emit(TokenType.QUAD_FALSE_PI, '⊥π', 2);
      return true;
    }
    // ⊤ / ⊥ alone
    if (ch === '⊤') { this.emit(TokenType.QUAD_TRUE, '⊤', 1); return true; }
    if (ch === '⊥') { this.emit(TokenType.QUAD_FALSE, '⊥', 1); return true; }

    // π/e/φ/i as constants (not followed by subscript chars = constant, not ext literal)
    if (ch === 'π' && !this.isSubscriptStart()) { this.emit(TokenType.PI, 'π', 1); return true; }

    const tt = map[ch];
    if (tt) {
      this.emit(tt, ch, 1);
      return true;
    }
    return false;
  }

  private tryMultiCharOp(): boolean {
    const ch = this.chars[this.pos];
    const next = this.peek(1);

    // |>
    if (ch === '|' && next === '>') { this.emit(TokenType.PIPE_OP, '|>', 2); return true; }
    // >>
    if (ch === '>' && next === '>') { this.emit(TokenType.EXTEND_OP, '>>', 2); return true; }
    // <<
    if (ch === '<' && next === '<') { this.emit(TokenType.REDUCE_OP, '<<', 2); return true; }
    // ->
    if (ch === '-' && next === '>') { this.emit(TokenType.ARROW, '->', 2); return true; }
    // >κ <κ =κ
    if (ch === '>' && next === 'κ') { this.emit(TokenType.KAPPA_GT, '>κ', 2); return true; }
    if (ch === '<' && next === 'κ') { this.emit(TokenType.KAPPA_LT, '<κ', 2); return true; }
    if (ch === '=' && next === 'κ') { this.emit(TokenType.KAPPA_EQ, '=κ', 2); return true; }

    return false;
  }

  private trySingleCharOp(ch: string): boolean {
    const map: Record<string, TokenType> = {
      '+': TokenType.PLUS,
      '-': TokenType.MINUS,
      '*': TokenType.STAR,
      '/': TokenType.SLASH,
      '=': TokenType.ASSIGN,
      '(': TokenType.LPAREN,
      ')': TokenType.RPAREN,
      '{': TokenType.LBRACE,
      '}': TokenType.RBRACE,
      '[': TokenType.LBRACKET,
      ']': TokenType.RBRACKET,
      ',': TokenType.COMMA,
      ';': TokenType.SEMICOLON,
      '.': TokenType.DOT,
    };
    const tt = map[ch];
    if (tt) {
      this.emit(tt, ch, 1);
      return true;
    }
    return false;
  }
}
