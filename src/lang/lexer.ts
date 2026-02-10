// ============================================================
// Rei (0₀式) Lexer — 字句解析器
// BNF v0.2 準拠
// Author: Nobuki Fujimoto
// ============================================================

export const TokenType = {
  // Literals
  NUMBER: 'NUMBER',
  STRING: 'STRING',
  EXT_LIT: 'EXT_LIT',
  SYMBOL_0_0: 'SYMBOL_0_0',
  SYMBOL_DOT_PRIM: 'SYMBOL_DOT_PRIM',
  BOOL_TRUE: 'BOOL_TRUE',
  BOOL_FALSE: 'BOOL_FALSE',

  // Math constants
  CONST_PI: 'CONST_PI',
  CONST_E: 'CONST_E',
  CONST_PHI: 'CONST_PHI',
  CONST_I: 'CONST_I',
  CONST_PHI_UP: 'CONST_PHI_UP',
  CONST_PSI_UP: 'CONST_PSI_UP',
  CONST_OMEGA_UP: 'CONST_OMEGA_UP',
  CONST_EMPTY: 'CONST_EMPTY',

  // Quad literals (v0.2)
  QUAD_TOP: 'QUAD_TOP',
  QUAD_BOT: 'QUAD_BOT',
  QUAD_TOP_PI: 'QUAD_TOP_PI',
  QUAD_BOT_PI: 'QUAD_BOT_PI',

  // Keywords
  LET: 'LET',
  MUT: 'MUT',
  COMPRESS: 'COMPRESS',
  WEIGHT: 'WEIGHT',
  GENESIS: 'GENESIS',
  IF: 'IF',
  THEN: 'THEN',
  ELSE: 'ELSE',
  MATCH: 'MATCH',
  CASE: 'CASE',
  WITNESSED: 'WITNESSED',
  BY: 'BY',
  TRUE: 'TRUE',
  FALSE: 'FALSE',
  NULL: 'NULL',
  TEMPORAL: 'TEMPORAL',
  TIMELESS: 'TIMELESS',

  // Identifiers
  IDENT: 'IDENT',

  // Operators
  PLUS: 'PLUS',
  MINUS: 'MINUS',
  STAR: 'STAR',
  SLASH: 'SLASH',
  OPLUS: 'OPLUS',
  OTIMES: 'OTIMES',
  CDOT: 'CDOT',
  PIPE_OP: 'PIPE_OP',
  EXTEND: 'EXTEND',
  REDUCE: 'REDUCE',
  ASSIGN: 'ASSIGN',
  DOT: 'DOT',
  ARROW: 'ARROW',
  SEMICOLON: 'SEMICOLON',
  COMMA: 'COMMA',
  COLON: 'COLON',
  LPAREN: 'LPAREN',
  RPAREN: 'RPAREN',
  LBRACE: 'LBRACE',
  RBRACE: 'RBRACE',
  LBRACKET: 'LBRACKET',
  RBRACKET: 'RBRACKET',
  CONVERGE: 'CONVERGE',
  DIVERGE: 'DIVERGE',
  REFLECT: 'REFLECT',
  AND: 'AND',
  OR: 'OR',
  NOT: 'NOT',
  GT_K: 'GT_K',
  LT_K: 'LT_K',
  EQ_K: 'EQ_K',
  GT: 'GT',
  LT: 'LT',
  EQ: 'EQ',
  NEQ: 'NEQ',
  GTE: 'GTE',
  LTE: 'LTE',
  MDIM_OPEN: 'MDIM_OPEN',

  // Special
  NEWLINE: 'NEWLINE',
  EOF: 'EOF',
} as const;

export type TokenTypeValue = (typeof TokenType)[keyof typeof TokenType];

export interface Token {
  type: TokenTypeValue;
  value: string;
  line: number;
  col: number;
}

const KEYWORDS: Record<string, TokenTypeValue> = {
  'let': TokenType.LET,
  'mut': TokenType.MUT,
  'compress': TokenType.COMPRESS,
  'weight': TokenType.WEIGHT,
  'genesis': TokenType.GENESIS,
  'if': TokenType.IF,
  'then': TokenType.THEN,
  'else': TokenType.ELSE,
  'match': TokenType.MATCH,
  'case': TokenType.CASE,
  'witnessed': TokenType.WITNESSED,
  'by': TokenType.BY,
  'true': TokenType.TRUE,
  'false': TokenType.FALSE,
  'null': TokenType.NULL,
  'Temporal': TokenType.TEMPORAL,
  'Timeless': TokenType.TIMELESS,
};

const SUBSCRIPT_CHARS = new Set('oxzwensbua'.split(''));

export class Lexer {
  private chars: string[];
  private pos: number = 0;
  private line: number = 1;
  private col: number = 1;
  private tokens: Token[] = [];

  constructor(private source: string) {
    this.chars = Array.from(source);
  }

  tokenize(): Token[] {
    this.tokens = [];
    while (this.pos < this.chars.length) {
      this.skipWhitespaceAndComments();
      if (this.pos >= this.chars.length) break;

      const ch = this.chars[this.pos];

      // Newline
      if (ch === '\n') {
        this.emit(TokenType.NEWLINE, '\n');
        this.advance();
        this.line++;
        this.col = 1;
        continue;
      }

      // String literal
      if (ch === '"') { this.readString(); continue; }

      // 0₀ symbol
      if (ch === '0' && this.peek(1) === '₀') {
        this.emit(TokenType.SYMBOL_0_0, '0₀');
        this.advance(); this.advance();
        continue;
      }

      // 𝕄{ — MDim literal
      if (ch === '𝕄' && this.peek(1) === '{') {
        this.emit(TokenType.MDIM_OPEN, '𝕄{');
        this.advance(); this.advance();
        continue;
      }

      // Extended literals: 0ooo, πoo, eoo, φoo, ioo
      if (this.isExtStart(ch)) {
        const ext = this.readExtLit();
        if (ext) continue;
      }

      // Number
      if (this.isDigit(ch) || (ch === '-' && this.isDigit(this.peek(1) ?? '') && this.shouldNegateBePrefix())) {
        this.readNumber();
        continue;
      }

      // Math constants and Unicode operators
      if (this.readUnicodeToken(ch)) continue;

      // Multi-char operators
      if (this.readMultiCharOp(ch)) continue;

      // Single-char operators
      if (this.readSingleCharOp(ch)) continue;

      // Identifiers / keywords
      if (this.isIdentStart(ch)) {
        this.readIdentOrKeyword();
        continue;
      }

      // Skip unrecognized
      this.advance();
    }

    this.emit(TokenType.EOF, '');
    return this.tokens.filter(t => t.type !== TokenType.NEWLINE || false);
  }

  private skipWhitespaceAndComments(): void {
    while (this.pos < this.chars.length) {
      const ch = this.chars[this.pos];
      if (ch === ' ' || ch === '\t' || ch === '\r') {
        this.advance();
        continue;
      }
      // Line comment: //
      if (ch === '/' && this.peek(1) === '/') {
        while (this.pos < this.chars.length && this.chars[this.pos] !== '\n') this.advance();
        continue;
      }
      // Block comment: /* */
      if (ch === '/' && this.peek(1) === '*') {
        this.advance(); this.advance();
        while (this.pos < this.chars.length) {
          if (this.chars[this.pos] === '*' && this.peek(1) === '/') {
            this.advance(); this.advance();
            break;
          }
          if (this.chars[this.pos] === '\n') { this.line++; this.col = 0; }
          this.advance();
        }
        continue;
      }
      break;
    }
  }

  private readString(): void {
    const startCol = this.col;
    this.advance(); // skip opening "
    let str = '';
    while (this.pos < this.chars.length && this.chars[this.pos] !== '"') {
      if (this.chars[this.pos] === '\\' && this.pos + 1 < this.chars.length) {
        this.advance();
        const esc = this.chars[this.pos];
        if (esc === 'n') str += '\n';
        else if (esc === 't') str += '\t';
        else if (esc === '\\') str += '\\';
        else if (esc === '"') str += '"';
        else str += esc;
      } else {
        str += this.chars[this.pos];
      }
      this.advance();
    }
    if (this.pos < this.chars.length) this.advance(); // skip closing "
    this.tokens.push({ type: TokenType.STRING, value: str, line: this.line, col: startCol });
  }

  private isExtStart(ch: string): boolean {
    if (ch === '0' && SUBSCRIPT_CHARS.has(this.peek(1) ?? '')) return true;
    // π and φ are unambiguous (not valid identifier starts in typical use)
    if (ch === 'π' || ch === 'φ') {
      const next = this.peek(1);
      if (next && SUBSCRIPT_CHARS.has(next)) return true;
    }
    // e and i: only treat as ext if ALL subsequent chars are subscript chars
    // (to avoid misidentifying "energy", "inner", "each", "item" etc.)
    if (ch === 'e' || ch === 'i') {
      const next = this.peek(1);
      if (!next || !SUBSCRIPT_CHARS.has(next)) return false;
      // Scan ahead: must be subscript chars only, no alphanumeric after
      let offset = 1;
      while (this.peek(offset) && SUBSCRIPT_CHARS.has(this.peek(offset)!)) offset++;
      const afterSubs = this.peek(offset);
      // If followed by alphanumeric or _, it's an identifier
      if (afterSubs && /[a-zA-Z0-9_]/.test(afterSubs)) return false;
      return true;
    }
    return false;
  }

  private readExtLit(): boolean {
    const startCol = this.col;
    const base = this.chars[this.pos];
    this.advance();
    let subs = '';
    while (this.pos < this.chars.length && SUBSCRIPT_CHARS.has(this.chars[this.pos])) {
      subs += this.chars[this.pos];
      this.advance();
    }
    if (subs.length > 0) {
      this.tokens.push({
        type: TokenType.EXT_LIT,
        value: base + subs,
        line: this.line,
        col: startCol,
      });
      return true;
    }
    // Not an ext lit — put back and let it be handled as something else
    this.pos--;
    this.col--;
    return false;
  }

  private readNumber(): void {
    const startCol = this.col;
    let num = '';
    if (this.chars[this.pos] === '-') { num += '-'; this.advance(); }
    while (this.pos < this.chars.length && this.isDigit(this.chars[this.pos])) {
      num += this.chars[this.pos];
      this.advance();
    }
    if (this.pos < this.chars.length && this.chars[this.pos] === '.' &&
        this.isDigit(this.peek(1) ?? '')) {
      num += '.';
      this.advance();
      while (this.pos < this.chars.length && this.isDigit(this.chars[this.pos])) {
        num += this.chars[this.pos];
        this.advance();
      }
    }
    this.tokens.push({ type: TokenType.NUMBER, value: num, line: this.line, col: startCol });
  }

  private readUnicodeToken(ch: string): boolean {
    const startCol = this.col;
    const map: [string, TokenTypeValue][] = [
      ['⊕', TokenType.OPLUS],
      ['⊗', TokenType.OTIMES],
      ['·', TokenType.CDOT],
      ['π', TokenType.CONST_PI],
      ['φ', TokenType.CONST_PHI],
      ['Φ', TokenType.CONST_PHI_UP],
      ['Ψ', TokenType.CONST_PSI_UP],
      ['Ω', TokenType.CONST_OMEGA_UP],
      ['∅', TokenType.CONST_EMPTY],
      ['⊤', TokenType.QUAD_TOP],
      ['⊥', TokenType.QUAD_BOT],
      ['⤊', TokenType.CONVERGE],
      ['⤋', TokenType.DIVERGE],
      ['◁', TokenType.REFLECT],
      ['∧', TokenType.AND],
      ['∨', TokenType.OR],
      ['¬', TokenType.NOT],
      ['・', TokenType.SYMBOL_DOT_PRIM],
    ];

    // Handle ⊤π and ⊥π
    if (ch === '⊤' && this.peek(1) === 'π') {
      this.emit(TokenType.QUAD_TOP_PI, '⊤π');
      this.advance(); this.advance();
      return true;
    }
    if (ch === '⊥' && this.peek(1) === 'π') {
      this.emit(TokenType.QUAD_BOT_PI, '⊥π');
      this.advance(); this.advance();
      return true;
    }

    for (const [sym, type] of map) {
      if (ch === sym) {
        this.emit(type, sym);
        this.advance();
        return true;
      }
    }
    return false;
  }

  private readMultiCharOp(ch: string): boolean {
    const next = this.peek(1);

    if (ch === '|' && next === '>') {
      this.emit(TokenType.PIPE_OP, '|>');
      this.advance(); this.advance();
      return true;
    }
    if (ch === '>' && next === '>') {
      this.emit(TokenType.EXTEND, '>>');
      this.advance(); this.advance();
      return true;
    }
    if (ch === '<' && next === '<') {
      this.emit(TokenType.REDUCE, '<<');
      this.advance(); this.advance();
      return true;
    }
    if (ch === '-' && next === '>') {
      this.emit(TokenType.ARROW, '->');
      this.advance(); this.advance();
      return true;
    }
    if (ch === '=' && next === '=') {
      this.emit(TokenType.EQ, '==');
      this.advance(); this.advance();
      return true;
    }
    if (ch === '!' && next === '=') {
      this.emit(TokenType.NEQ, '!=');
      this.advance(); this.advance();
      return true;
    }
    if (ch === '>' && next === '=') {
      this.emit(TokenType.GTE, '>=');
      this.advance(); this.advance();
      return true;
    }
    if (ch === '<' && next === '=') {
      this.emit(TokenType.LTE, '<=');
      this.advance(); this.advance();
      return true;
    }
    if (ch === '>' && next === 'κ') {
      this.emit(TokenType.GT_K, '>κ');
      this.advance(); this.advance();
      return true;
    }
    if (ch === '<' && next === 'κ') {
      this.emit(TokenType.LT_K, '<κ');
      this.advance(); this.advance();
      return true;
    }
    if (ch === '=' && next === 'κ') {
      this.emit(TokenType.EQ_K, '=κ');
      this.advance(); this.advance();
      return true;
    }
    return false;
  }

  private readSingleCharOp(ch: string): boolean {
    const map: Record<string, TokenTypeValue> = {
      '+': TokenType.PLUS,
      '-': TokenType.MINUS,
      '*': TokenType.STAR,
      '/': TokenType.SLASH,
      '=': TokenType.ASSIGN,
      '.': TokenType.DOT,
      ',': TokenType.COMMA,
      ':': TokenType.COLON,
      ';': TokenType.SEMICOLON,
      '(': TokenType.LPAREN,
      ')': TokenType.RPAREN,
      '{': TokenType.LBRACE,
      '}': TokenType.RBRACE,
      '[': TokenType.LBRACKET,
      ']': TokenType.RBRACKET,
      '|': TokenType.PIPE_OP,
      '>': TokenType.GT,
      '<': TokenType.LT,
    };
    const type = map[ch];
    if (type) {
      this.emit(type, ch);
      this.advance();
      return true;
    }
    return false;
  }

  private readIdentOrKeyword(): void {
    const startCol = this.col;
    let name = '';
    while (this.pos < this.chars.length && this.isIdentPart(this.chars[this.pos])) {
      name += this.chars[this.pos];
      this.advance();
    }
    // Check compress levels
    if (name.startsWith('compress') && name.length > 8) {
      const suffix = name.slice(8);
      if (['⁰', '¹', '²', '³', '∞'].includes(suffix)) {
        this.tokens.push({ type: TokenType.COMPRESS, value: name, line: this.line, col: startCol });
        return;
      }
    }
    const kw = KEYWORDS[name];
    if (kw) {
      this.tokens.push({ type: kw, value: name, line: this.line, col: startCol });
    } else {
      this.tokens.push({ type: TokenType.IDENT, value: name, line: this.line, col: startCol });
    }
  }

  // --- Helpers ---
  private advance(): void { this.pos++; this.col++; }
  private peek(offset: number): string | undefined { return this.chars[this.pos + offset]; }
  private emit(type: TokenTypeValue, value: string): void {
    this.tokens.push({ type, value, line: this.line, col: this.col });
  }
  private isDigit(ch: string): boolean { return ch >= '0' && ch <= '9'; }
  private isIdentStart(ch: string): boolean {
    return /[a-zA-Z_α-ωΑ-Ω𝕄𝕌]/.test(ch);
  }
  private isIdentPart(ch: string): boolean {
    return /[a-zA-Z0-9_α-ωΑ-Ω⁰¹²³∞𝕄𝕌]/.test(ch);
  }
  private shouldNegateBePrefix(): boolean {
    if (this.tokens.length === 0) return true;
    const last = this.tokens[this.tokens.length - 1];
    return [
      TokenType.LPAREN, TokenType.COMMA, TokenType.ASSIGN,
      TokenType.PLUS, TokenType.MINUS, TokenType.STAR, TokenType.SLASH,
      TokenType.OPLUS, TokenType.OTIMES, TokenType.PIPE_OP,
      TokenType.SEMICOLON, TokenType.LBRACKET, TokenType.COLON,
    ].includes(last.type as any);
  }
}
