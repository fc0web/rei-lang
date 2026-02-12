'use strict';

// src/lang/lexer.ts
var TokenType = {
  // Literals
  NUMBER: "NUMBER",
  STRING: "STRING",
  EXT_LIT: "EXT_LIT",
  SYMBOL_0_0: "SYMBOL_0_0",
  SYMBOL_DOT_PRIM: "SYMBOL_DOT_PRIM",
  // Math constants
  CONST_PI: "CONST_PI",
  CONST_E: "CONST_E",
  CONST_PHI: "CONST_PHI",
  CONST_I: "CONST_I",
  CONST_PHI_UP: "CONST_PHI_UP",
  CONST_PSI_UP: "CONST_PSI_UP",
  CONST_OMEGA_UP: "CONST_OMEGA_UP",
  CONST_EMPTY: "CONST_EMPTY",
  // Quad literals (v0.2)
  QUAD_TOP: "QUAD_TOP",
  QUAD_BOT: "QUAD_BOT",
  QUAD_TOP_PI: "QUAD_TOP_PI",
  QUAD_BOT_PI: "QUAD_BOT_PI",
  // Keywords
  LET: "LET",
  MUT: "MUT",
  COMPRESS: "COMPRESS",
  WEIGHT: "WEIGHT",
  GENESIS: "GENESIS",
  IF: "IF",
  THEN: "THEN",
  ELSE: "ELSE",
  MATCH: "MATCH",
  CASE: "CASE",
  WITNESSED: "WITNESSED",
  BY: "BY",
  TRUE: "TRUE",
  FALSE: "FALSE",
  NULL: "NULL",
  TEMPORAL: "TEMPORAL",
  TIMELESS: "TIMELESS",
  // ── v0.3 Space-Layer-Diffusion keywords ──
  SPACE: "SPACE",
  // 空 or "space"
  LAYER: "LAYER",
  // 層 or "layer"
  // Identifiers
  IDENT: "IDENT",
  // Operators
  PLUS: "PLUS",
  MINUS: "MINUS",
  STAR: "STAR",
  SLASH: "SLASH",
  OPLUS: "OPLUS",
  OTIMES: "OTIMES",
  CDOT: "CDOT",
  PIPE_OP: "PIPE_OP",
  EXTEND: "EXTEND",
  REDUCE: "REDUCE",
  ASSIGN: "ASSIGN",
  DOT: "DOT",
  ARROW: "ARROW",
  SEMICOLON: "SEMICOLON",
  COMMA: "COMMA",
  COLON: "COLON",
  LPAREN: "LPAREN",
  RPAREN: "RPAREN",
  LBRACE: "LBRACE",
  RBRACE: "RBRACE",
  LBRACKET: "LBRACKET",
  RBRACKET: "RBRACKET",
  CONVERGE: "CONVERGE",
  DIVERGE: "DIVERGE",
  REFLECT: "REFLECT",
  AND: "AND",
  OR: "OR",
  NOT: "NOT",
  GT_K: "GT_K",
  LT_K: "LT_K",
  EQ_K: "EQ_K",
  GT: "GT",
  LT: "LT",
  EQ: "EQ",
  NEQ: "NEQ",
  GTE: "GTE",
  LTE: "LTE",
  MDIM_OPEN: "MDIM_OPEN",
  // Special
  NEWLINE: "NEWLINE",
  EOF: "EOF"
};
var KEYWORDS = {
  "let": TokenType.LET,
  "mut": TokenType.MUT,
  "compress": TokenType.COMPRESS,
  "weight": TokenType.WEIGHT,
  "genesis": TokenType.GENESIS,
  "if": TokenType.IF,
  "then": TokenType.THEN,
  "else": TokenType.ELSE,
  "match": TokenType.MATCH,
  "case": TokenType.CASE,
  "witnessed": TokenType.WITNESSED,
  "by": TokenType.BY,
  "true": TokenType.TRUE,
  "false": TokenType.FALSE,
  "null": TokenType.NULL,
  "Temporal": TokenType.TEMPORAL,
  "Timeless": TokenType.TIMELESS,
  // ── v0.3 ──
  "space": TokenType.SPACE,
  "layer": TokenType.LAYER
};
var SUBSCRIPT_CHARS = new Set("oxzwensbua".split(""));
var Lexer = class {
  constructor(source) {
    this.source = source;
    this.chars = Array.from(source);
  }
  chars;
  pos = 0;
  line = 1;
  col = 1;
  tokens = [];
  tokenize() {
    this.tokens = [];
    while (this.pos < this.chars.length) {
      this.skipWhitespaceAndComments();
      if (this.pos >= this.chars.length) break;
      const ch = this.chars[this.pos];
      if (ch === "\n") {
        this.emit(TokenType.NEWLINE, "\n");
        this.advance();
        this.line++;
        this.col = 1;
        continue;
      }
      if (ch === '"') {
        this.readString();
        continue;
      }
      if (ch === "0" && this.peek(1) === "\u2080") {
        this.emit(TokenType.SYMBOL_0_0, "0\u2080");
        this.advance();
        this.advance();
        continue;
      }
      if (ch === "\u{1D544}" && this.peek(1) === "{") {
        this.emit(TokenType.MDIM_OPEN, "\u{1D544}{");
        this.advance();
        this.advance();
        continue;
      }
      if (ch === "\u7A7A") {
        this.emit(TokenType.SPACE, "\u7A7A");
        this.advance();
        continue;
      }
      if (ch === "\u5C64") {
        this.emit(TokenType.LAYER, "\u5C64");
        this.advance();
        continue;
      }
      if (this.isExtStart(ch)) {
        const ext = this.readExtLit();
        if (ext) continue;
      }
      if (this.isDigit(ch) || ch === "-" && this.isDigit(this.peek(1) ?? "") && this.shouldNegateBePrefix()) {
        this.readNumber();
        continue;
      }
      if (this.readUnicodeToken(ch)) continue;
      if (this.readMultiCharOp(ch)) continue;
      if (this.readSingleCharOp(ch)) continue;
      if (this.isIdentStart(ch)) {
        this.readIdentOrKeyword();
        continue;
      }
      this.advance();
    }
    this.emit(TokenType.EOF, "");
    return this.tokens.filter((t) => t.type !== TokenType.NEWLINE);
  }
  skipWhitespaceAndComments() {
    while (this.pos < this.chars.length) {
      const ch = this.chars[this.pos];
      if (ch === " " || ch === "	" || ch === "\r") {
        this.advance();
        continue;
      }
      if (ch === "/" && this.peek(1) === "/") {
        while (this.pos < this.chars.length && this.chars[this.pos] !== "\n") this.advance();
        continue;
      }
      if (ch === "/" && this.peek(1) === "*") {
        this.advance();
        this.advance();
        while (this.pos < this.chars.length) {
          if (this.chars[this.pos] === "*" && this.peek(1) === "/") {
            this.advance();
            this.advance();
            break;
          }
          if (this.chars[this.pos] === "\n") {
            this.line++;
            this.col = 0;
          }
          this.advance();
        }
        continue;
      }
      break;
    }
  }
  readString() {
    const startCol = this.col;
    this.advance();
    let str = "";
    while (this.pos < this.chars.length && this.chars[this.pos] !== '"') {
      if (this.chars[this.pos] === "\\" && this.pos + 1 < this.chars.length) {
        this.advance();
        const esc = this.chars[this.pos];
        if (esc === "n") str += "\n";
        else if (esc === "t") str += "	";
        else if (esc === "\\") str += "\\";
        else if (esc === '"') str += '"';
        else str += esc;
      } else {
        str += this.chars[this.pos];
      }
      this.advance();
    }
    if (this.pos < this.chars.length) this.advance();
    this.tokens.push({ type: TokenType.STRING, value: str, line: this.line, col: startCol });
  }
  isExtStart(ch) {
    if (ch === "0" && SUBSCRIPT_CHARS.has(this.peek(1) ?? "")) return true;
    if (ch === "\u03C0" || ch === "\u03C6") {
      const next = this.peek(1);
      if (next && SUBSCRIPT_CHARS.has(next)) return true;
    }
    if (ch === "e" || ch === "i") {
      const next = this.peek(1);
      if (!next || !SUBSCRIPT_CHARS.has(next)) return false;
      let offset = 1;
      while (this.peek(offset) && SUBSCRIPT_CHARS.has(this.peek(offset))) offset++;
      const afterSubs = this.peek(offset);
      if (afterSubs && /[a-zA-Z0-9_]/.test(afterSubs)) return false;
      return true;
    }
    return false;
  }
  readExtLit() {
    const startCol = this.col;
    const base = this.chars[this.pos];
    this.advance();
    let subs = "";
    while (this.pos < this.chars.length && SUBSCRIPT_CHARS.has(this.chars[this.pos])) {
      subs += this.chars[this.pos];
      this.advance();
    }
    if (subs.length > 0) {
      this.tokens.push({ type: TokenType.EXT_LIT, value: base + subs, line: this.line, col: startCol });
      return true;
    }
    this.pos--;
    this.col--;
    return false;
  }
  readNumber() {
    const startCol = this.col;
    let num = "";
    if (this.chars[this.pos] === "-") {
      num += "-";
      this.advance();
    }
    while (this.pos < this.chars.length && this.isDigit(this.chars[this.pos])) {
      num += this.chars[this.pos];
      this.advance();
    }
    if (this.pos < this.chars.length && this.chars[this.pos] === "." && this.isDigit(this.peek(1) ?? "")) {
      num += ".";
      this.advance();
      while (this.pos < this.chars.length && this.isDigit(this.chars[this.pos])) {
        num += this.chars[this.pos];
        this.advance();
      }
    }
    this.tokens.push({ type: TokenType.NUMBER, value: num, line: this.line, col: startCol });
  }
  readUnicodeToken(ch) {
    const map = [
      ["\u2295", TokenType.OPLUS],
      ["\u2297", TokenType.OTIMES],
      ["\xB7", TokenType.CDOT],
      ["\u03C0", TokenType.CONST_PI],
      ["\u03C6", TokenType.CONST_PHI],
      ["\u03A6", TokenType.CONST_PHI_UP],
      ["\u03A8", TokenType.CONST_PSI_UP],
      ["\u03A9", TokenType.CONST_OMEGA_UP],
      ["\u2205", TokenType.CONST_EMPTY],
      ["\u22A4", TokenType.QUAD_TOP],
      ["\u22A5", TokenType.QUAD_BOT],
      ["\u290A", TokenType.CONVERGE],
      ["\u290B", TokenType.DIVERGE],
      ["\u25C1", TokenType.REFLECT],
      ["\u2227", TokenType.AND],
      ["\u2228", TokenType.OR],
      ["\xAC", TokenType.NOT],
      ["\u30FB", TokenType.SYMBOL_DOT_PRIM]
    ];
    if (ch === "\u22A4" && this.peek(1) === "\u03C0") {
      this.emit(TokenType.QUAD_TOP_PI, "\u22A4\u03C0");
      this.advance();
      this.advance();
      return true;
    }
    if (ch === "\u22A5" && this.peek(1) === "\u03C0") {
      this.emit(TokenType.QUAD_BOT_PI, "\u22A5\u03C0");
      this.advance();
      this.advance();
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
  readMultiCharOp(ch) {
    const next = this.peek(1);
    if (ch === "|" && next === ">") {
      this.emit(TokenType.PIPE_OP, "|>");
      this.advance();
      this.advance();
      return true;
    }
    if (ch === ">" && next === ">") {
      this.emit(TokenType.EXTEND, ">>");
      this.advance();
      this.advance();
      return true;
    }
    if (ch === "<" && next === "<") {
      this.emit(TokenType.REDUCE, "<<");
      this.advance();
      this.advance();
      return true;
    }
    if (ch === "-" && next === ">") {
      this.emit(TokenType.ARROW, "->");
      this.advance();
      this.advance();
      return true;
    }
    if (ch === "=" && next === "=") {
      this.emit(TokenType.EQ, "==");
      this.advance();
      this.advance();
      return true;
    }
    if (ch === "!" && next === "=") {
      this.emit(TokenType.NEQ, "!=");
      this.advance();
      this.advance();
      return true;
    }
    if (ch === ">" && next === "=") {
      this.emit(TokenType.GTE, ">=");
      this.advance();
      this.advance();
      return true;
    }
    if (ch === "<" && next === "=") {
      this.emit(TokenType.LTE, "<=");
      this.advance();
      this.advance();
      return true;
    }
    if (ch === ">" && next === "\u03BA") {
      this.emit(TokenType.GT_K, ">\u03BA");
      this.advance();
      this.advance();
      return true;
    }
    if (ch === "<" && next === "\u03BA") {
      this.emit(TokenType.LT_K, "<\u03BA");
      this.advance();
      this.advance();
      return true;
    }
    if (ch === "=" && next === "\u03BA") {
      this.emit(TokenType.EQ_K, "=\u03BA");
      this.advance();
      this.advance();
      return true;
    }
    return false;
  }
  readSingleCharOp(ch) {
    const map = {
      "+": TokenType.PLUS,
      "-": TokenType.MINUS,
      "*": TokenType.STAR,
      "/": TokenType.SLASH,
      "=": TokenType.ASSIGN,
      ".": TokenType.DOT,
      ",": TokenType.COMMA,
      ":": TokenType.COLON,
      ";": TokenType.SEMICOLON,
      "(": TokenType.LPAREN,
      ")": TokenType.RPAREN,
      "{": TokenType.LBRACE,
      "}": TokenType.RBRACE,
      "[": TokenType.LBRACKET,
      "]": TokenType.RBRACKET,
      "|": TokenType.PIPE_OP,
      ">": TokenType.GT,
      "<": TokenType.LT
    };
    const type = map[ch];
    if (type) {
      this.emit(type, ch);
      this.advance();
      return true;
    }
    return false;
  }
  readIdentOrKeyword() {
    const startCol = this.col;
    let name = "";
    while (this.pos < this.chars.length && this.isIdentPart(this.chars[this.pos])) {
      name += this.chars[this.pos];
      this.advance();
    }
    if (name.startsWith("compress") && name.length > 8) {
      const suffix = name.slice(8);
      if (["\u2070", "\xB9", "\xB2", "\xB3", "\u221E"].includes(suffix)) {
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
  advance() {
    this.pos++;
    this.col++;
  }
  peek(offset) {
    return this.chars[this.pos + offset];
  }
  emit(type, value) {
    this.tokens.push({ type, value, line: this.line, col: this.col });
  }
  isDigit(ch) {
    return ch >= "0" && ch <= "9";
  }
  isIdentStart(ch) {
    return /[a-zA-Z_α-ωΑ-Ω𝕄𝕌\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FFF]/.test(ch);
  }
  isIdentPart(ch) {
    return /[a-zA-Z0-9_α-ωΑ-Ω⁰¹²³∞𝕄𝕌\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FFF]/.test(ch);
  }
  shouldNegateBePrefix() {
    if (this.tokens.length === 0) return true;
    const last = this.tokens[this.tokens.length - 1];
    return [
      TokenType.LPAREN,
      TokenType.COMMA,
      TokenType.ASSIGN,
      TokenType.PLUS,
      TokenType.MINUS,
      TokenType.STAR,
      TokenType.SLASH,
      TokenType.OPLUS,
      TokenType.OTIMES,
      TokenType.PIPE_OP,
      TokenType.SEMICOLON,
      TokenType.LBRACKET,
      TokenType.COLON,
      TokenType.MDIM_OPEN,
      TokenType.LBRACE
    ].includes(last.type);
  }
};

// src/lang/parser.ts
function node(type, props = {}) {
  return { type, ...props };
}
var Parser = class {
  pos = 0;
  tokens;
  constructor(tokens) {
    this.tokens = tokens.filter((t) => t.type !== TokenType.NEWLINE);
  }
  parseProgram() {
    const stmts = [];
    while (!this.isAtEnd()) {
      while (this.check(TokenType.SEMICOLON)) this.advance();
      if (this.isAtEnd()) break;
      stmts.push(this.parseStatement());
      while (this.check(TokenType.SEMICOLON)) this.advance();
    }
    return node("Program", { body: stmts });
  }
  parseStatement() {
    if (this.check(TokenType.LET)) return this.parseLetStmt();
    if (this.check(TokenType.COMPRESS)) return this.parseCompressDef();
    return this.parseExpression();
  }
  // --- let [mut] name [: type] = expr [witnessed by "..."] ---
  parseLetStmt() {
    this.expect(TokenType.LET);
    const mutable = this.match(TokenType.MUT);
    const name = this.expect(TokenType.IDENT).value;
    let typeAnnotation = null;
    let phaseGuard = null;
    if (this.match(TokenType.COLON)) {
      typeAnnotation = this.expect(TokenType.IDENT).value;
      if (this.check(TokenType.IDENT) && this.peek().value.startsWith("@")) {
        phaseGuard = this.advance().value.slice(1);
      }
    }
    this.expect(TokenType.ASSIGN);
    const init = this.parseExpression();
    let witness = null;
    if (this.match(TokenType.WITNESSED)) {
      this.expect(TokenType.BY);
      witness = this.expect(TokenType.STRING).value;
    }
    return node(mutable ? "MutStmt" : "LetStmt", {
      name,
      init,
      typeAnnotation,
      phaseGuard,
      witness
    });
  }
  // --- compress [level] name(params) [-> type] = body ---
  parseCompressDef() {
    const compressToken = this.expect(TokenType.COMPRESS);
    const level = this.parseCompressLevel(compressToken.value);
    const name = this.expect(TokenType.IDENT).value;
    this.expect(TokenType.LPAREN);
    const params = [];
    if (!this.check(TokenType.RPAREN)) {
      params.push(this.parseParamDecl());
      while (this.match(TokenType.COMMA)) {
        params.push(this.parseParamDecl());
      }
    }
    this.expect(TokenType.RPAREN);
    let returnType = null;
    if (this.match(TokenType.ARROW)) {
      returnType = this.expect(TokenType.IDENT).value;
    }
    this.expect(TokenType.ASSIGN);
    const body = this.parseExpression();
    return node("CompressDef", { name, params, body, level, returnType });
  }
  parseCompressLevel(value) {
    if (value === "compress") return -1;
    const suffixMap = {
      "compress\u2070": 0,
      // ⁰
      "compress\xB9": 1,
      // ¹
      "compress\xB2": 2,
      // ²
      "compress\xB3": 3,
      // ³
      "compress\u221E": Infinity
      // ∞
    };
    return suffixMap[value] ?? -1;
  }
  parseParamDecl() {
    let name;
    if (this.check(TokenType.IDENT)) {
      name = this.advance().value;
    } else if (this.check(TokenType.CONST_E)) {
      name = this.advance().value;
    } else if (this.check(TokenType.CONST_I)) {
      name = this.advance().value;
    } else {
      name = this.expect(TokenType.IDENT).value;
    }
    if (this.match(TokenType.COLON)) {
      this.expect(TokenType.IDENT);
    }
    return name;
  }
  // --- Expression hierarchy (low → high precedence) ---
  parseExpression() {
    return this.parsePipe();
  }
  // Level 1: |> pipe, ◁ reflect
  parsePipe() {
    let left = this.parseLogicOr();
    while (this.check(TokenType.PIPE_OP) || this.check(TokenType.REFLECT)) {
      if (this.match(TokenType.PIPE_OP)) {
        const cmd = this.parsePipeCommand();
        left = node("Pipe", { input: left, command: cmd });
      } else if (this.match(TokenType.REFLECT)) {
        const right = this.parseLogicOr();
        left = node("ReflectOp", { left, right });
      }
    }
    return left;
  }
  parsePipeCommand() {
    if (this.check(TokenType.IDENT) || this.check(TokenType.GENESIS) || this.check(TokenType.SPACE) || this.check(TokenType.LAYER)) {
      const cmd = this.advance().value;
      let mode = null;
      let args = [];
      if (this.match(TokenType.COLON)) {
        mode = this.expect(TokenType.IDENT).value;
      }
      if (this.match(TokenType.LPAREN)) {
        if (!this.check(TokenType.RPAREN)) {
          args.push(this.parseExpression());
          while (this.match(TokenType.COMMA)) args.push(this.parseExpression());
        }
        this.expect(TokenType.RPAREN);
      }
      return node("PipeCmd", { cmd, mode, args });
    }
    if (this.match(TokenType.CONVERGE)) return node("PipeCmd", { cmd: "\u290A", mode: null, args: [] });
    if (this.match(TokenType.DIVERGE)) return node("PipeCmd", { cmd: "\u290B", mode: null, args: [] });
    throw this.error("\u30D1\u30A4\u30D7\u30B3\u30DE\u30F3\u30C9\u304C\u5FC5\u8981");
  }
  // Level 2: ∧ ∨ (logic)
  parseLogicOr() {
    let left = this.parseLogicAnd();
    while (this.match(TokenType.OR)) {
      const right = this.parseLogicAnd();
      left = node("BinOp", { op: "\u2228", left, right });
    }
    return left;
  }
  parseLogicAnd() {
    let left = this.parseComparison();
    while (this.match(TokenType.AND)) {
      const right = this.parseComparison();
      left = node("BinOp", { op: "\u2227", left, right });
    }
    return left;
  }
  // Level 3: comparison operators
  parseComparison() {
    let left = this.parseAddition();
    const compOps = [
      TokenType.GT_K,
      TokenType.LT_K,
      TokenType.EQ_K,
      TokenType.EQ,
      TokenType.NEQ,
      TokenType.GT,
      TokenType.LT,
      TokenType.GTE,
      TokenType.LTE
    ];
    while (compOps.some((op) => this.check(op))) {
      const opToken = this.advance();
      const right = this.parseAddition();
      left = node("BinOp", { op: opToken.value, left, right });
    }
    return left;
  }
  // Level 4: + - ⊕
  parseAddition() {
    let left = this.parseMultiplication();
    while (this.check(TokenType.PLUS) || this.check(TokenType.MINUS) || this.check(TokenType.OPLUS)) {
      const op = this.advance().value;
      const right = this.parseMultiplication();
      left = node("BinOp", { op, left, right });
    }
    return left;
  }
  // Level 5: * / ⊗ ·
  parseMultiplication() {
    let left = this.parseExtendReduce();
    while (this.check(TokenType.STAR) || this.check(TokenType.SLASH) || this.check(TokenType.OTIMES) || this.check(TokenType.CDOT)) {
      const op = this.advance().value;
      const right = this.parseExtendReduce();
      left = node("BinOp", { op, left, right });
    }
    return left;
  }
  // Level 6: >> << ⤊ ⤋
  parseExtendReduce() {
    let left = this.parseUnary();
    while (true) {
      if (this.match(TokenType.EXTEND)) {
        if (this.match(TokenType.COLON)) {
          const sub = this.expect(TokenType.IDENT).value;
          left = node("Extend", { target: left, subscript: sub });
        } else {
          const right = this.parseUnary();
          left = node("Extend", { target: left, expr: right });
        }
      } else if (this.match(TokenType.REDUCE)) {
        left = node("Reduce", { target: left });
      } else if (this.match(TokenType.CONVERGE)) {
        const right = this.parseUnary();
        left = node("ConvergeOp", { left, right });
      } else if (this.match(TokenType.DIVERGE)) {
        const right = this.parseUnary();
        left = node("DivergeOp", { left, right });
      } else {
        break;
      }
    }
    return left;
  }
  // Level 7: unary ¬ -
  parseUnary() {
    if (this.match(TokenType.NOT)) {
      const operand = this.parseUnary();
      return node("UnaryOp", { op: "\xAC", operand });
    }
    if (this.check(TokenType.MINUS) && this.shouldNegateBePrefix()) {
      this.advance();
      const operand = this.parseUnary();
      return node("UnaryOp", { op: "-", operand });
    }
    return this.parsePostfix();
  }
  // Level 8: . member access, [index], (call)
  parsePostfix() {
    let left = this.parsePrimary();
    while (true) {
      if (this.match(TokenType.DOT)) {
        if (this.check(TokenType.IDENT)) {
          const member = this.advance().value;
          if (this.check(TokenType.DOT) && this.checkAhead(TokenType.IDENT, 1) && this.tokens[this.pos + 1]?.value === "\u03BA") {
            this.advance();
            this.advance();
            left = node("MemberAccess", { object: left, member, kappa: true });
          } else {
            left = node("MemberAccess", { object: left, member, kappa: false });
          }
        }
      } else if (this.match(TokenType.LPAREN)) {
        const args = [];
        if (!this.check(TokenType.RPAREN)) {
          args.push(this.parseExpression());
          while (this.match(TokenType.COMMA)) args.push(this.parseExpression());
        }
        this.expect(TokenType.RPAREN);
        left = node("FnCall", { callee: left, args });
      } else if (this.match(TokenType.LBRACKET)) {
        const index = this.parseExpression();
        this.expect(TokenType.RBRACKET);
        left = node("IndexAccess", { object: left, index });
      } else {
        break;
      }
    }
    return left;
  }
  // --- Primary expressions ---
  parsePrimary() {
    if (this.check(TokenType.NUMBER)) {
      const val = this.advance().value;
      return node("NumLit", { value: parseFloat(val) });
    }
    if (this.check(TokenType.STRING)) {
      return node("StrLit", { value: this.advance().value });
    }
    if (this.match(TokenType.TRUE)) return node("BoolLit", { value: true });
    if (this.match(TokenType.FALSE)) return node("BoolLit", { value: false });
    if (this.match(TokenType.NULL)) return node("NullLit", {});
    if (this.check(TokenType.EXT_LIT)) {
      const val = this.advance().value;
      return node("ExtLit", { raw: val });
    }
    if (this.match(TokenType.SYMBOL_0_0)) {
      return node("ExtLit", { raw: "0\u2080" });
    }
    if (this.match(TokenType.SYMBOL_DOT_PRIM)) {
      return node("ConstLit", { value: "\u30FB" });
    }
    if (this.match(TokenType.CONST_PI)) return node("NumLit", { value: Math.PI });
    if (this.match(TokenType.CONST_E)) return node("NumLit", { value: Math.E });
    if (this.match(TokenType.CONST_PHI)) return node("NumLit", { value: (1 + Math.sqrt(5)) / 2 });
    if (this.match(TokenType.CONST_I)) return node("ConstLit", { value: "i" });
    if (this.match(TokenType.CONST_EMPTY)) return node("ConstLit", { value: "\u2205" });
    if (this.match(TokenType.CONST_PHI_UP)) return node("ConstLit", { value: "\u03A6" });
    if (this.match(TokenType.CONST_PSI_UP)) return node("ConstLit", { value: "\u03A8" });
    if (this.match(TokenType.CONST_OMEGA_UP)) return node("ConstLit", { value: "\u03A9" });
    if (this.match(TokenType.QUAD_TOP)) return node("QuadLit", { value: "top" });
    if (this.match(TokenType.QUAD_BOT)) return node("QuadLit", { value: "bottom" });
    if (this.match(TokenType.QUAD_TOP_PI)) return node("QuadLit", { value: "topPi" });
    if (this.match(TokenType.QUAD_BOT_PI)) return node("QuadLit", { value: "bottomPi" });
    if (this.match(TokenType.MDIM_OPEN)) {
      return this.parseMDimLit();
    }
    if (this.match(TokenType.LBRACKET)) {
      const elems = [];
      if (!this.check(TokenType.RBRACKET)) {
        elems.push(this.parseExpression());
        while (this.match(TokenType.COMMA)) elems.push(this.parseExpression());
      }
      this.expect(TokenType.RBRACKET);
      return node("ArrayLit", { elements: elems });
    }
    if (this.match(TokenType.LPAREN)) {
      const expr = this.parseExpression();
      this.expect(TokenType.RPAREN);
      return expr;
    }
    if (this.check(TokenType.IF)) return this.parseIfExpr();
    if (this.check(TokenType.MATCH)) return this.parseMatchExpr();
    if (this.check(TokenType.GENESIS)) {
      this.advance();
      if (this.match(TokenType.LPAREN)) {
        this.expect(TokenType.RPAREN);
      }
      return node("FnCall", { callee: node("Ident", { name: "genesis" }), args: [] });
    }
    if (this.check(TokenType.SPACE)) {
      return this.parseSpaceLit();
    }
    if (this.check(TokenType.IDENT)) {
      const name = this.advance().value;
      return node("Ident", { name });
    }
    throw this.error(`\u4E88\u671F\u3057\u306A\u3044\u30C8\u30FC\u30AF\u30F3: ${this.peek().value} (${this.peek().type})`);
  }
  // --- MDim literal: 𝕄{center; n1, n2, ... [weight w] [mode]} ---
  parseMDimLit() {
    const center = this.parseExpression();
    this.expect(TokenType.SEMICOLON);
    const neighbors = [];
    neighbors.push(this.parseExpression());
    while (this.match(TokenType.COMMA)) {
      if (this.check(TokenType.RBRACE)) break;
      if (this.check(TokenType.WEIGHT)) break;
      neighbors.push(this.parseExpression());
    }
    let weight = null;
    if (this.match(TokenType.WEIGHT)) {
      weight = this.parseExpression();
    }
    let mode = "weighted";
    if (this.match(TokenType.COLON)) {
      if (this.check(TokenType.IDENT)) {
        mode = this.advance().value;
      }
    }
    this.expect(TokenType.RBRACE);
    return node("MDimLit", { center, neighbors, weight, mode });
  }
  // ── v0.3: Space literal: 空{ 層 0: expr, expr  層 1: expr } ──
  parseSpaceLit() {
    this.expect(TokenType.SPACE);
    this.expect(TokenType.LBRACE);
    const layers = [];
    let topology = "flat";
    if (this.check(TokenType.IDENT) && this.peek().value === "topology") {
      this.advance();
      this.expect(TokenType.COLON);
      if (this.check(TokenType.IDENT)) {
        topology = this.advance().value;
      }
      this.match(TokenType.COMMA);
    }
    while (!this.check(TokenType.RBRACE) && !this.isAtEnd()) {
      if (!this.check(TokenType.LAYER)) {
        throw this.error(`\u5C64\u306E\u5B9A\u7FA9\u304C\u5FC5\u8981\u3067\u3059\u3002\u5B9F\u969B: ${this.peek().type} ("${this.peek().value}")`);
      }
      this.expect(TokenType.LAYER);
      const layerIndex = this.parseExpression();
      this.expect(TokenType.COLON);
      const nodes = [];
      nodes.push(this.parseExpression());
      while (this.match(TokenType.COMMA)) {
        if (this.check(TokenType.LAYER) || this.check(TokenType.RBRACE)) break;
        nodes.push(this.parseExpression());
      }
      layers.push({ index: layerIndex, nodes });
    }
    this.expect(TokenType.RBRACE);
    return node("SpaceLit", { layers, topology });
  }
  // --- if expr then expr else expr ---
  parseIfExpr() {
    this.expect(TokenType.IF);
    const cond = this.parseExpression();
    this.expect(TokenType.THEN);
    const then = this.parseExpression();
    this.expect(TokenType.ELSE);
    const elseExpr = this.parseExpression();
    return node("IfExpr", { cond, then, else: elseExpr });
  }
  // --- match expr { case pat -> expr, ... } ---
  parseMatchExpr() {
    this.expect(TokenType.MATCH);
    const target = this.parseExpression();
    this.expect(TokenType.LBRACE);
    const cases = [];
    while (!this.check(TokenType.RBRACE) && !this.isAtEnd()) {
      this.expect(TokenType.CASE);
      const pattern = this.parsePrimary();
      this.expect(TokenType.ARROW);
      const body = this.parseExpression();
      cases.push({ pattern, body });
      this.match(TokenType.COMMA);
    }
    this.expect(TokenType.RBRACE);
    return node("MatchExpr", { target, cases });
  }
  // --- Helpers ---
  peek() {
    return this.tokens[this.pos] || { type: TokenType.EOF, value: "", line: 0, col: 0 };
  }
  isAtEnd() {
    return this.peek().type === TokenType.EOF;
  }
  check(type) {
    return this.peek().type === type;
  }
  checkAhead(type, offset) {
    const idx = this.pos + offset;
    return idx < this.tokens.length && this.tokens[idx].type === type;
  }
  advance() {
    const t = this.tokens[this.pos];
    this.pos++;
    return t;
  }
  match(type) {
    if (this.check(type)) {
      this.advance();
      return true;
    }
    return false;
  }
  expect(type) {
    if (this.check(type)) return this.advance();
    const t = this.peek();
    throw this.error(`\u671F\u5F85: ${type}, \u5B9F\u969B: ${t.type} ("${t.value}")`);
  }
  error(msg) {
    const t = this.peek();
    return new Error(`[\u884C ${t.line}:${t.col}] \u69CB\u6587\u30A8\u30E9\u30FC: ${msg}`);
  }
  shouldNegateBePrefix() {
    if (this.pos === 0) return true;
    const prev = this.tokens[this.pos - 1];
    return [
      TokenType.LPAREN,
      TokenType.COMMA,
      TokenType.ASSIGN,
      TokenType.PLUS,
      TokenType.MINUS,
      TokenType.STAR,
      TokenType.SLASH,
      TokenType.OPLUS,
      TokenType.OTIMES,
      TokenType.PIPE_OP,
      TokenType.SEMICOLON,
      TokenType.LBRACKET,
      TokenType.COLON,
      TokenType.MDIM_OPEN,
      TokenType.LBRACE
    ].includes(prev.type);
  }
};

// src/lang/space.ts
function createDNode(center, neighbors, mode = "weighted", weights, layerIndex = 0, nodeIndex = 0) {
  return {
    reiType: "DNode",
    center,
    neighbors: [...neighbors],
    mode,
    weights,
    stage: 0,
    initialDirections: neighbors.length,
    diffusionHistory: [{
      stage: 0,
      directions: neighbors.length,
      result: center,
      neighbors: [...neighbors]
    }],
    momentum: "rest",
    layerIndex,
    nodeIndex,
    tendencyHistory: []
  };
}
function createSpace(topology = "flat") {
  return {
    reiType: "Space",
    layers: /* @__PURE__ */ new Map(),
    topology,
    globalStage: 0
  };
}
function addLayer(space, layerIndex) {
  if (!space.layers.has(layerIndex)) {
    space.layers.set(layerIndex, {
      index: layerIndex,
      nodes: [],
      frozen: false
    });
  }
  return space.layers.get(layerIndex);
}
function addNodeToLayer(space, layerIndex, center, neighbors, mode = "weighted", weights) {
  const layer = addLayer(space, layerIndex);
  const nodeIndex = layer.nodes.length;
  const node2 = createDNode(center, neighbors, mode, weights, layerIndex, nodeIndex);
  layer.nodes.push(node2);
  return node2;
}
function defaultDiffuse(neighbors) {
  const n = neighbors.length;
  if (n === 0) return [];
  const result = [];
  for (let i = 0; i < n; i++) {
    result.push(neighbors[i]);
    result.push((neighbors[i] + neighbors[(i + 1) % n]) / 2);
  }
  return result;
}
function stepNode(node2, diffuseFn) {
  if (node2.momentum === "converged" || node2.momentum === "contracting") return;
  const fn = defaultDiffuse;
  const newNeighbors = fn(node2.neighbors);
  const prevResult = computeNodeValue(node2);
  node2.neighbors = newNeighbors;
  node2.stage += 1;
  const newResult = computeNodeValue(node2);
  node2.diffusionHistory.push({
    stage: node2.stage,
    directions: newNeighbors.length,
    result: newResult,
    neighbors: [...newNeighbors]
  });
  node2.momentum = "expanding";
  const delta = Math.abs(newResult - prevResult);
  if (delta < 1e-3) {
    node2.tendencyHistory.push("rest");
  } else if (newResult > prevResult) {
    node2.tendencyHistory.push("expand");
  } else {
    node2.tendencyHistory.push("contract");
  }
}
function computeNodeValue(node2) {
  const { center, neighbors, mode } = node2;
  const weights = node2.weights ?? neighbors.map(() => 1);
  const n = neighbors.length;
  if (n === 0) return center;
  switch (mode) {
    case "weighted": {
      const wSum = weights.reduce((a, b) => a + b, 0);
      const wAvg = neighbors.reduce((sum, v, i) => sum + (weights[i] ?? 1) * v, 0) / (wSum || 1);
      return center + wAvg;
    }
    case "multiplicative": {
      const prod = neighbors.reduce((p, v) => p * (1 + v), 1);
      return center * prod;
    }
    case "harmonic": {
      const harmSum = neighbors.reduce((s, v) => s + 1 / (Math.abs(v) || 1), 0);
      return center + n / harmSum;
    }
    case "exponential": {
      const expSum = neighbors.reduce((s, v) => s + Math.exp(v), 0);
      return center * (expSum / n);
    }
    default:
      return center;
  }
}
function isNodeConverged(node2, criteria) {
  const history = node2.diffusionHistory;
  if (history.length < 2) return false;
  switch (criteria.type) {
    case "steps":
      return node2.stage >= criteria.max;
    case "epsilon": {
      const last = history[history.length - 1].result;
      const prev = history[history.length - 2].result;
      return Math.abs(last - prev) < criteria.threshold;
    }
    case "fixed": {
      const last = history[history.length - 1].result;
      const prev = history[history.length - 2].result;
      return last === prev;
    }
    case "converged": {
      const last = history[history.length - 1].result;
      const prev = history[history.length - 2].result;
      return Math.abs(last - prev) < 1e-4;
    }
  }
}
function contractNode(node2, method = "weighted") {
  node2.momentum = "contracting";
  const finalValue = computeNodeValue(node2);
  node2.momentum = "converged";
  return finalValue;
}
function stepSpace(space, targetLayer, diffuseFn) {
  for (const [layerIdx, layer] of space.layers) {
    if (targetLayer !== void 0 && layerIdx !== targetLayer) continue;
    if (layer.frozen) continue;
    for (const node2 of layer.nodes) {
      stepNode(node2);
    }
  }
  space.globalStage++;
}
function diffuseSpace(space, criteria = { type: "converged" }, targetLayer, contractionMethod = "weighted", diffuseFn, maxSafetySteps = 100) {
  let steps = 0;
  while (steps < maxSafetySteps) {
    let allConverged = true;
    for (const [layerIdx, layer] of space.layers) {
      if (targetLayer !== void 0 && layerIdx !== targetLayer) continue;
      if (layer.frozen) continue;
      for (const node2 of layer.nodes) {
        if (node2.momentum === "converged") continue;
        if (isNodeConverged(node2, criteria)) {
          contractNode(node2, contractionMethod);
        } else {
          stepNode(node2);
          allConverged = false;
        }
      }
    }
    space.globalStage++;
    steps++;
    if (allConverged) break;
  }
  const results = [];
  for (const [layerIdx, layer] of space.layers) {
    if (targetLayer !== void 0 && layerIdx !== targetLayer) continue;
    for (const node2 of layer.nodes) {
      if (node2.momentum !== "converged") {
        contractNode(node2, contractionMethod);
      }
      results.push(computeNodeValue(node2));
    }
  }
  return results;
}
function getSigmaFlow(node2) {
  return {
    stage: node2.stage,
    directions: node2.neighbors.length,
    momentum: node2.momentum,
    velocity: node2.diffusionHistory.length >= 2 ? Math.abs(
      node2.diffusionHistory[node2.diffusionHistory.length - 1].result - node2.diffusionHistory[node2.diffusionHistory.length - 2].result
    ) : 0
  };
}
function getSigmaMemory(node2) {
  return [...node2.diffusionHistory];
}
function getSigmaWill(node2) {
  const history = node2.tendencyHistory;
  const recent = history.slice(-5);
  const counts = {};
  for (const t of recent) {
    counts[t] = (counts[t] ?? 0) + 1;
  }
  let tendency = "rest";
  let maxCount = 0;
  for (const [t, c] of Object.entries(counts)) {
    if (c > maxCount) {
      maxCount = c;
      tendency = t;
    }
  }
  if (history.length >= 4) {
    let alternating = 0;
    for (let i = 1; i < recent.length; i++) {
      if (recent[i] !== recent[i - 1]) alternating++;
    }
    if (alternating >= recent.length - 1) tendency = "spiral";
  }
  return {
    tendency,
    strength: maxCount / Math.max(recent.length, 1),
    history: [...history]
  };
}
function nodeSimilarity(a, b) {
  const centerDiff = Math.abs(a.center - b.center);
  const centerSim = 1 / (1 + centerDiff);
  const dirDiff = Math.abs(a.neighbors.length - b.neighbors.length);
  const dirSim = 1 / (1 + dirDiff);
  const valA = computeNodeValue(a);
  const valB = computeNodeValue(b);
  const valDiff = Math.abs(valA - valB);
  const valSim = 1 / (1 + valDiff);
  return (centerSim + dirSim + valSim) / 3;
}
function findResonances(space, threshold = 0.5) {
  const allNodes = [];
  for (const [layerIdx, layer] of space.layers) {
    for (let i = 0; i < layer.nodes.length; i++) {
      allNodes.push({ node: layer.nodes[i], layer: layerIdx, index: i });
    }
  }
  const pairs = [];
  for (let i = 0; i < allNodes.length; i++) {
    for (let j = i + 1; j < allNodes.length; j++) {
      if (allNodes[i].layer === allNodes[j].layer && allNodes[i].index === allNodes[j].index) continue;
      const sim = nodeSimilarity(allNodes[i].node, allNodes[j].node);
      if (sim >= threshold) {
        pairs.push({
          nodeA: { layer: allNodes[i].layer, index: allNodes[i].index },
          nodeB: { layer: allNodes[j].layer, index: allNodes[j].index },
          similarity: Math.round(sim * 1e3) / 1e3
        });
      }
    }
  }
  return pairs;
}
function getSpaceSigma(space) {
  let totalNodes = 0;
  let convergedNodes = 0;
  let expandingNodes = 0;
  const layerIndices = [];
  for (const [layerIdx, layer] of space.layers) {
    layerIndices.push(layerIdx);
    totalNodes += layer.nodes.length;
    for (const node2 of layer.nodes) {
      if (node2.momentum === "converged") convergedNodes++;
      else if (node2.momentum === "expanding") expandingNodes++;
    }
  }
  return {
    field: {
      layers: space.layers.size,
      total_nodes: totalNodes,
      active_nodes: totalNodes - convergedNodes,
      topology: space.topology
    },
    flow: {
      global_stage: space.globalStage,
      converged_nodes: convergedNodes,
      expanding_nodes: expandingNodes
    },
    layer: layerIndices.sort((a, b) => a - b)
  };
}

// src/lang/thought.ts
var DEFAULT_CONFIG = {
  strategy: "converge",
  maxIterations: 50,
  epsilon: 1e-4,
  awakenThreshold: 0.6,
  allowCycleDetection: true,
  cycleWindowSize: 5
};
var THINK_COMPUTE_MODES = [
  "weighted",
  "multiplicative",
  "harmonic",
  "exponential",
  "geometric",
  "median",
  "minkowski",
  "entropy"
];
function thinkComputeMDim(md, mode) {
  const { center, neighbors } = md;
  const weights = md.weights ?? neighbors.map(() => 1);
  const n = neighbors.length;
  if (n === 0) return center;
  switch (mode) {
    case "weighted": {
      const wSum = weights.reduce((a, b) => a + b, 0);
      const wAvg = neighbors.reduce((sum, v, i) => sum + (weights[i] ?? 1) * v, 0) / (wSum || 1);
      return center + wAvg;
    }
    case "multiplicative": {
      const prod = neighbors.reduce((p, v) => p * (1 + v), 1);
      return center * prod;
    }
    case "harmonic": {
      const harmSum = neighbors.reduce((s, v) => s + 1 / (Math.abs(v) || 1), 0);
      return center + n / harmSum;
    }
    case "exponential": {
      const expSum = neighbors.reduce((s, v) => s + Math.exp(v), 0);
      return center * (expSum / n);
    }
    case "geometric": {
      const prod = neighbors.reduce((p, v) => p * Math.abs(v || 1), 1);
      return center * Math.pow(prod, 1 / n);
    }
    case "median": {
      const sorted = [...neighbors].sort((a, b) => a - b);
      const mid = Math.floor(n / 2);
      const med = n % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
      return center + med;
    }
    case "minkowski": {
      const p = 2;
      const sumP = neighbors.reduce((s, v) => s + Math.pow(Math.abs(v), p), 0);
      return center + Math.pow(sumP / n, 1 / p);
    }
    case "entropy": {
      const total = neighbors.reduce((s, v) => s + Math.abs(v), 0) || 1;
      const probs = neighbors.map((v) => Math.abs(v) / total);
      const H = -probs.reduce((s, p) => s + (p > 0 ? p * Math.log2(p) : 0), 0);
      return center * (1 + H);
    }
    default:
      return center;
  }
}
function toNum(v) {
  if (typeof v === "number") return v;
  if (v === null || v === void 0) return 0;
  if (typeof v === "boolean") return v ? 1 : 0;
  if (v?.reiType === "ReiVal") return toNum(v.value);
  if (v?.reiType === "MDim") return thinkComputeMDim(v, v.mode || "weighted");
  if (v?.reiType === "Ext") return v.valStar?.() ?? 0;
  return 0;
}
function ensureMDim(v) {
  if (v?.reiType === "ReiVal") return ensureMDim(v.value);
  if (v?.reiType === "MDim") return v;
  if (typeof v === "number") return { reiType: "MDim", center: v, neighbors: [], mode: "weighted" };
  if (Array.isArray(v)) {
    if (v.length === 0) return { reiType: "MDim", center: 0, neighbors: [], mode: "weighted" };
    return { reiType: "MDim", center: v[0], neighbors: v.slice(1), mode: "weighted" };
  }
  return { reiType: "MDim", center: 0, neighbors: [], mode: "weighted" };
}
function thinkAwareness(iterationCount, modeTransitions, trajectory) {
  let score = 0;
  score += Math.min(iterationCount / 10, 1);
  score += Math.min(modeTransitions / 5, 1);
  if (trajectory === "oscillating") score += 0.8;
  else if (trajectory === "chaotic") score += 1;
  else if (trajectory === "converging") score += 0.5;
  else if (trajectory === "diverging") score += 0.3;
  return Math.min(score / 3, 1);
}
function thinkEvolveStep(md, history, strategy) {
  const candidates = THINK_COMPUTE_MODES.map((mode) => ({
    mode,
    value: thinkComputeMDim(md, mode)
  }));
  const pastValues = history.map((s) => s.numericValue);
  let selected;
  switch (strategy) {
    case "converge":
    case "stable": {
      if (pastValues.length === 0) {
        selected = candidates[0];
      } else {
        const lastVal = pastValues[pastValues.length - 1];
        selected = candidates.reduce(
          (best, c) => Math.abs(c.value - lastVal) < Math.abs(best.value - lastVal) ? c : best
        );
      }
      break;
    }
    case "explore":
    case "divergent": {
      if (pastValues.length === 0) {
        selected = candidates.reduce(
          (best, c) => Math.abs(c.value) > Math.abs(best.value) ? c : best
        );
      } else {
        const mean = pastValues.reduce((a, b) => a + b, 0) / pastValues.length;
        selected = candidates.reduce(
          (best, c) => Math.abs(c.value - mean) > Math.abs(best.value - mean) ? c : best
        );
      }
      break;
    }
    case "seek": {
      const median = [...candidates].sort((a, b) => a.value - b.value)[Math.floor(candidates.length / 2)];
      selected = median;
      break;
    }
    case "creative": {
      const mean = candidates.reduce((s, c) => s + c.value, 0) / candidates.length;
      selected = candidates.reduce(
        (best, c) => Math.abs(c.value - mean) > Math.abs(best.value - mean) ? c : best
      );
      break;
    }
    default: {
      if (pastValues.length >= 3) {
        const recent = pastValues.slice(-3);
        const isExpanding = recent.every((v, i) => i === 0 || v > recent[i - 1]);
        const isContracting = recent.every((v, i) => i === 0 || v < recent[i - 1]);
        if (isExpanding) {
          const lastVal = pastValues[pastValues.length - 1];
          selected = candidates.reduce(
            (best, c) => Math.abs(c.value - lastVal) < Math.abs(best.value - lastVal) ? c : best
          );
        } else if (isContracting) {
          selected = candidates.reduce(
            (best, c) => c.value > best.value ? c : best
          );
        } else {
          selected = candidates[0];
        }
      } else {
        selected = candidates[0];
      }
      break;
    }
  }
  const newMd = { ...md, mode: selected.mode };
  return {
    value: newMd,
    numericValue: selected.value,
    selectedMode: selected.mode
  };
}
function analyzeTrajectory(steps) {
  if (steps.length < 3) return "stable";
  const deltas = steps.slice(1).map((s) => s.delta);
  const absDeltas = deltas.map(Math.abs);
  if (absDeltas.every((d) => d < 1e-3)) return "stable";
  let decreasing = 0;
  for (let i = 1; i < absDeltas.length; i++) {
    if (absDeltas[i] < absDeltas[i - 1]) decreasing++;
  }
  if (decreasing >= absDeltas.length * 0.7) return "converging";
  let increasing = 0;
  for (let i = 1; i < absDeltas.length; i++) {
    if (absDeltas[i] > absDeltas[i - 1]) increasing++;
  }
  if (increasing >= absDeltas.length * 0.7) return "diverging";
  let signChanges = 0;
  for (let i = 1; i < deltas.length; i++) {
    if (Math.sign(deltas[i]) !== Math.sign(deltas[i - 1])) signChanges++;
  }
  if (signChanges >= deltas.length * 0.6) return "oscillating";
  return "chaotic";
}
function detectCycle(values, windowSize) {
  if (values.length < windowSize * 2) return false;
  const recent = values.slice(-windowSize);
  const earlier = values.slice(-windowSize * 2, -windowSize);
  if (recent.every((v, i) => Math.abs(v - earlier[i]) < 1e-4)) return true;
  const recentSorted = [...recent].sort();
  const earlierSorted = [...earlier].sort();
  if (recentSorted.every((v, i) => Math.abs(v - earlierSorted[i]) < 1e-4)) return true;
  return false;
}
function computeLoopTendency(steps) {
  if (steps.length < 2) return { tendency: "rest", strength: 0 };
  const recentDecisions = steps.slice(-5).map((s) => s.decision);
  const recentDeltas = steps.slice(-5).map((s) => s.delta);
  const convergeCount = recentDecisions.filter((d) => d === "converged").length;
  if (convergeCount > 0) return { tendency: "rest", strength: convergeCount / recentDecisions.length };
  const absDeltas = recentDeltas.map(Math.abs);
  let shrinking = 0;
  for (let i = 1; i < absDeltas.length; i++) {
    if (absDeltas[i] < absDeltas[i - 1]) shrinking++;
  }
  if (shrinking > absDeltas.length / 2) {
    return { tendency: "contract", strength: shrinking / absDeltas.length };
  }
  let growing = 0;
  for (let i = 1; i < absDeltas.length; i++) {
    if (absDeltas[i] > absDeltas[i - 1]) growing++;
  }
  if (growing > absDeltas.length / 2) {
    return { tendency: "expand", strength: growing / absDeltas.length };
  }
  const modes = steps.slice(-5).map((s) => s.selectedMode);
  const modeChanges = modes.filter((m, i) => i > 0 && m !== modes[i - 1]).length;
  if (modeChanges >= modes.length * 0.6) {
    return { tendency: "spiral", strength: modeChanges / modes.length };
  }
  return { tendency: "rest", strength: 0.5 };
}
function thinkLoop(input, configArg = {}) {
  const config = { ...DEFAULT_CONFIG, ...configArg };
  const md = ensureMDim(input);
  const steps = [];
  const numericHistory = [];
  let currentMd = { ...md };
  let currentNumeric = toNum(md);
  let modeTransitions = 0;
  let lastMode = "";
  let awakenedAt = null;
  let peakAwareness = 0;
  let stopReason = "limit";
  numericHistory.push(currentNumeric);
  for (let i = 0; i < config.maxIterations; i++) {
    const evolveStrategy = config.strategy === "converge" ? "stable" : config.strategy === "seek" ? "seek" : config.strategy === "explore" ? "divergent" : config.strategy === "awaken" ? "creative" : "auto";
    const evolved = thinkEvolveStep(currentMd, steps, evolveStrategy);
    const delta = evolved.numericValue - currentNumeric;
    if (lastMode && evolved.selectedMode !== lastMode) modeTransitions++;
    lastMode = evolved.selectedMode;
    const trajectory2 = analyzeTrajectory(steps);
    const awareness = thinkAwareness(i + 1, modeTransitions, trajectory2);
    if (awareness > peakAwareness) peakAwareness = awareness;
    const tendencyResult = computeLoopTendency(steps);
    let decision = "continue";
    let reason = "";
    if (config.strategy === "converge" || config.strategy === "auto") {
      if (Math.abs(delta) < config.epsilon && i > 0) {
        decision = "converged";
        reason = `|\u0394| = ${Math.abs(delta).toFixed(6)} < \u03B5 = ${config.epsilon}`;
      }
    }
    if (config.strategy === "seek" && config.targetValue !== void 0) {
      const targetDist = Math.abs(evolved.numericValue - config.targetValue);
      const targetEps = config.targetEpsilon ?? config.epsilon;
      if (targetDist < targetEps) {
        decision = "target_reached";
        reason = `|value - target| = ${targetDist.toFixed(6)} < \u03B5 = ${targetEps}`;
      }
    }
    if (config.strategy === "awaken") {
      if (awareness >= config.awakenThreshold && awakenedAt === null) {
        awakenedAt = i;
        decision = "awakened";
        reason = `awareness = ${awareness.toFixed(3)} >= threshold = ${config.awakenThreshold}`;
      }
    }
    if (config.allowCycleDetection && i >= config.cycleWindowSize * 2) {
      if (detectCycle(numericHistory, config.cycleWindowSize)) {
        decision = "cycle_detected";
        reason = `\u5FAA\u74B0\u30D1\u30BF\u30FC\u30F3\u691C\u51FA\uFF08\u7A93\u30B5\u30A4\u30BA${config.cycleWindowSize}\uFF09`;
      }
    }
    const step = {
      iteration: i,
      value: evolved.value,
      numericValue: evolved.numericValue,
      selectedMode: evolved.selectedMode,
      delta,
      awareness,
      tendency: tendencyResult.tendency,
      decision,
      reason
    };
    steps.push(step);
    numericHistory.push(evolved.numericValue);
    currentMd = ensureMDim(evolved.value);
    currentNumeric = evolved.numericValue;
    if (decision !== "continue") {
      stopReason = decision;
      break;
    }
  }
  if (steps.length === config.maxIterations && steps[steps.length - 1].decision === "continue") {
    steps[steps.length - 1].decision = "limit";
    steps[steps.length - 1].reason = `\u6700\u5927\u53CD\u5FA9\u56DE\u6570 ${config.maxIterations} \u306B\u5230\u9054`;
    stopReason = "limit";
  }
  const trajectory = analyzeTrajectory(steps);
  const modeHistory = steps.map((s) => s.selectedMode);
  const loopTendency = computeLoopTendency(steps);
  let convergenceRate = 0;
  if (steps.length >= 2) {
    const firstAbsDelta = Math.abs(steps[0].delta) || 1;
    const lastAbsDelta = Math.abs(steps[steps.length - 1].delta);
    convergenceRate = 1 - lastAbsDelta / firstAbsDelta;
  }
  return {
    reiType: "ThoughtResult",
    finalValue: currentMd,
    finalNumeric: currentNumeric,
    totalIterations: steps.length,
    steps,
    stopReason,
    stopStrategy: config.strategy,
    trajectory,
    convergenceRate: Math.max(0, Math.min(1, convergenceRate)),
    loopTendency: loopTendency.tendency,
    loopStrength: loopTendency.strength,
    peakAwareness,
    finalAwareness: steps.length > 0 ? steps[steps.length - 1].awareness : 0,
    awakenedAt,
    modeHistory,
    modeTransitions
  };
}
function getThoughtSigma(result) {
  return {
    reiType: "SigmaResult",
    field: {
      type: "thought_loop",
      finalValue: result.finalNumeric,
      totalIterations: result.totalIterations,
      trajectory: result.trajectory
    },
    flow: {
      direction: result.trajectory,
      momentum: result.totalIterations,
      velocity: result.steps.length > 0 ? Math.abs(result.steps[result.steps.length - 1].delta) : 0,
      convergenceRate: result.convergenceRate
    },
    memory: result.steps.map((s) => ({
      iteration: s.iteration,
      value: s.numericValue,
      mode: s.selectedMode,
      delta: s.delta,
      decision: s.decision
    })),
    layer: result.awakenedAt !== null ? 1 : 0,
    will: {
      tendency: result.loopTendency,
      strength: result.loopStrength,
      history: result.modeHistory
    },
    relation: result.steps.length > 1 ? result.steps.slice(1).map((s, i) => ({
      from: result.steps[i].iteration,
      to: s.iteration,
      delta: s.delta,
      modeChange: s.selectedMode !== result.steps[i].selectedMode
    })) : []
  };
}
function formatThought(result) {
  const lines = [];
  lines.push(`\u2550\u2550\u2550 \u601D\u8003\u30EB\u30FC\u30D7\u7D50\u679C \u2550\u2550\u2550`);
  lines.push(`\u6226\u7565: ${result.stopStrategy}`);
  lines.push(`\u53CD\u5FA9: ${result.totalIterations}\u56DE`);
  lines.push(`\u505C\u6B62\u7406\u7531: ${result.stopReason}`);
  lines.push(`\u6700\u7D42\u5024: ${result.finalNumeric.toFixed(6)}`);
  lines.push(`\u8ECC\u8DE1: ${result.trajectory}`);
  lines.push(`\u53CE\u675F\u7387: ${(result.convergenceRate * 100).toFixed(1)}%`);
  lines.push(`\u6700\u9AD8\u899A\u9192\u5EA6: ${(result.peakAwareness * 100).toFixed(1)}%`);
  lines.push(`\u30E2\u30FC\u30C9\u9077\u79FB: ${result.modeTransitions}\u56DE`);
  lines.push(`\u30EB\u30FC\u30D7\u306E\u610F\u5FD7: ${result.loopTendency} (\u5F37\u5EA6: ${result.loopStrength.toFixed(2)})`);
  if (result.awakenedAt !== null) {
    lines.push(`\u899A\u9192: \u53CD\u5FA9 #${result.awakenedAt} \u3067\u899A\u9192`);
  }
  lines.push(`\u2500\u2500\u2500  \u8ECC\u8DE1  \u2500\u2500\u2500`);
  for (const step of result.steps.slice(0, 10)) {
    const marker = step.decision !== "continue" ? ` \u2190 ${step.decision}` : "";
    lines.push(
      `  #${step.iteration}: ${step.numericValue.toFixed(4)} [${step.selectedMode}] \u0394=${step.delta >= 0 ? "+" : ""}${step.delta.toFixed(4)}${marker}`
    );
  }
  if (result.steps.length > 10) {
    lines.push(`  ... (${result.steps.length - 10}\u30B9\u30C6\u30C3\u30D7\u7701\u7565)`);
    const last = result.steps[result.steps.length - 1];
    lines.push(
      `  #${last.iteration}: ${last.numericValue.toFixed(4)} [${last.selectedMode}] \u0394=${last.delta >= 0 ? "+" : ""}${last.delta.toFixed(4)} \u2190 ${last.decision}`
    );
  }
  return lines.join("\n");
}
function thoughtTrajectory(result) {
  return result.steps.map((s) => s.numericValue);
}
function thoughtModes(result) {
  return result.modeHistory;
}
function dominantMode(result) {
  const counts = {};
  for (const m of result.modeHistory) {
    counts[m] = (counts[m] ?? 0) + 1;
  }
  let maxMode = "";
  let maxCount = 0;
  for (const [m, c] of Object.entries(counts)) {
    if (c > maxCount) {
      maxMode = m;
      maxCount = c;
    }
  }
  return {
    mode: maxMode,
    count: maxCount,
    ratio: result.modeHistory.length > 0 ? maxCount / result.modeHistory.length : 0
  };
}

// src/lang/game.ts
var _rngState = [Date.now() ^ 3735928559, Date.now() ^ 3405691582];
function seedRandom(seed) {
  _rngState = [seed ^ 3735928559, seed * 1103515245 + 12345 ^ 3405691582];
}
function nextRandom() {
  let [s0, s1] = _rngState;
  const result = s0 + s1 >>> 0;
  s1 ^= s0;
  _rngState[0] = (s0 << 23 | s0 >>> 9) ^ s1 ^ s1 << 17;
  _rngState[1] = s1 << 6 | s1 >>> 26;
  return (result >>> 0) / 4294967296;
}
function randomUniform(items) {
  if (items.length === 0) return { reiType: "RandomResult", value: null, probability: 0, entropy: 0, source: "uniform" };
  const idx = Math.floor(nextRandom() * items.length);
  const p = 1 / items.length;
  return {
    reiType: "RandomResult",
    value: items[idx],
    probability: p,
    entropy: Math.log2(items.length),
    source: "uniform"
  };
}
function randomWeighted(items, weights) {
  if (items.length === 0) return { reiType: "RandomResult", value: null, probability: 0, entropy: 0, source: "weighted" };
  const totalWeight = weights.reduce((a, b) => a + b, 0) || 1;
  const probs = weights.map((w) => w / totalWeight);
  const r = nextRandom();
  let cumulative = 0;
  let selectedIdx = items.length - 1;
  for (let i = 0; i < probs.length; i++) {
    cumulative += probs[i];
    if (r < cumulative) {
      selectedIdx = i;
      break;
    }
  }
  const entropy = -probs.reduce((s, p) => s + (p > 0 ? p * Math.log2(p) : 0), 0);
  return {
    reiType: "RandomResult",
    value: items[selectedIdx],
    probability: probs[selectedIdx],
    entropy,
    source: "weighted"
  };
}
function randomFromMDim(md) {
  if (md?.reiType !== "MDim" || !md.neighbors || md.neighbors.length === 0) {
    return { reiType: "RandomResult", value: md?.center ?? 0, probability: 1, entropy: 0, source: "uniform" };
  }
  if (md.weights && md.weights.length === md.neighbors.length) {
    return randomWeighted(md.neighbors, md.weights);
  }
  return randomUniform(md.neighbors);
}
function analyzeEntropy(values) {
  if (values.length === 0) {
    return { reiType: "EntropyAnalysis", shannon: 0, maxEntropy: 0, relativeEntropy: 0, distribution: [] };
  }
  const counts = /* @__PURE__ */ new Map();
  for (const v of values) {
    const key = JSON.stringify(v);
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  const n = values.length;
  const distribution = [];
  let shannon = 0;
  for (const [key, count] of counts) {
    const p = count / n;
    shannon -= p * Math.log2(p);
    distribution.push({ value: JSON.parse(key), probability: p });
  }
  const maxEntropy = Math.log2(counts.size);
  return {
    reiType: "EntropyAnalysis",
    shannon,
    maxEntropy,
    relativeEntropy: maxEntropy > 0 ? shannon / maxEntropy : 1,
    distribution: distribution.sort((a, b) => b.probability - a.probability)
  };
}
function randomWalk(start, steps, stepSize = 1) {
  const walk = [start];
  let current = start;
  for (let i = 0; i < steps; i++) {
    current += (nextRandom() > 0.5 ? 1 : -1) * stepSize;
    walk.push(current);
  }
  return walk;
}
function monteCarloSample(md, n) {
  const samples = [];
  for (let i = 0; i < n; i++) {
    const r = randomFromMDim(md);
    samples.push(r.value);
  }
  return { samples, entropy: analyzeEntropy(samples) };
}
function tttGetLegalMoves(state) {
  return state.board.reduce((moves, cell, i) => cell === 0 ? [...moves, i] : moves, []);
}
function tttApplyMove(state, position) {
  const newBoard = [...state.board];
  newBoard[position] = state.currentPlayer;
  const newState = {
    board: newBoard,
    currentPlayer: state.currentPlayer === 1 ? 2 : 1,
    moveHistory: [...state.moveHistory, {
      player: state.currentPlayer,
      position,
      label: `${state.currentPlayer === 1 ? "X" : "O"} at (${Math.floor(position / 3)},${position % 3})`
    }],
    status: "playing",
    winner: null,
    turnCount: state.turnCount + 1
  };
  const winner = tttCheckWin(newState);
  if (winner) {
    newState.status = "win";
    newState.winner = winner;
  } else if (tttCheckDraw(newState)) {
    newState.status = "draw";
  }
  return newState;
}
var TTT_LINES = [
  [0, 1, 2],
  [3, 4, 5],
  [6, 7, 8],
  // rows
  [0, 3, 6],
  [1, 4, 7],
  [2, 5, 8],
  // cols
  [0, 4, 8],
  [2, 4, 6]
  // diags
];
function tttCheckWin(state) {
  for (const [a, b, c] of TTT_LINES) {
    if (state.board[a] && state.board[a] === state.board[b] && state.board[b] === state.board[c]) {
      return state.board[a];
    }
  }
  return null;
}
function tttCheckDraw(state) {
  return !tttCheckWin(state) && state.board.every((c) => c !== 0);
}
function tttEvaluate(state, player) {
  const winner = tttCheckWin(state);
  if (winner === player) return 10;
  if (winner !== null) return -10;
  if (tttCheckDraw(state)) return 0;
  let score = 0;
  if (state.board[4] === player) score += 3;
  for (const corner of [0, 2, 6, 8]) {
    if (state.board[corner] === player) score += 1;
  }
  return score;
}
function tttFormatBoard(state) {
  const symbols = [".", "X", "O"];
  const rows = [];
  for (let r = 0; r < 3; r++) {
    rows.push(state.board.slice(r * 3, r * 3 + 3).map((c) => symbols[c]).join(" "));
  }
  return rows.join("\n");
}
var TIC_TAC_TOE_RULES = {
  name: "tic_tac_toe",
  getLegalMoves: tttGetLegalMoves,
  applyMove: tttApplyMove,
  checkWin: tttCheckWin,
  checkDraw: tttCheckDraw,
  evaluate: tttEvaluate,
  formatBoard: tttFormatBoard
};
function nimGetLegalMoves(state) {
  const stones = state.board[0];
  const moves = [];
  for (let i = 1; i <= Math.min(3, stones); i++) moves.push(i);
  return moves;
}
function nimApplyMove(state, position) {
  const remaining = state.board[0] - position;
  const newState = {
    board: [remaining],
    currentPlayer: state.currentPlayer === 1 ? 2 : 1,
    moveHistory: [...state.moveHistory, {
      player: state.currentPlayer,
      position,
      label: `Player ${state.currentPlayer} takes ${position} (${remaining} left)`
    }],
    status: "playing",
    winner: null,
    turnCount: state.turnCount + 1
  };
  if (remaining <= 0) {
    newState.status = "win";
    newState.winner = state.currentPlayer === 1 ? 2 : 1;
  }
  return newState;
}
function nimCheckWin(state) {
  return state.winner;
}
function nimCheckDraw(_state) {
  return false;
}
function nimEvaluate(state, player) {
  if (state.winner === player) return 10;
  if (state.winner !== null) return -10;
  const stones = state.board[0];
  const isLosing = (stones - 1) % 4 === 0;
  return state.currentPlayer === player ? isLosing ? -5 : 5 : isLosing ? 5 : -5;
}
function nimFormatBoard(state) {
  const stones = state.board[0];
  return `Stones: ${"\u25CF".repeat(stones)}${"\u25CB".repeat(Math.max(0, 10 - stones))} (${stones} remaining)`;
}
var NIM_RULES = {
  name: "nim",
  getLegalMoves: nimGetLegalMoves,
  applyMove: nimApplyMove,
  checkWin: nimCheckWin,
  checkDraw: nimCheckDraw,
  evaluate: nimEvaluate,
  formatBoard: nimFormatBoard
};
function coinGetLegalMoves(_state) {
  return [0, 1];
}
function coinApplyMove(state, position) {
  const flip = nextRandom() > 0.5 ? 1 : 0;
  const correct = position === flip;
  const newScore = [...state.board];
  if (correct) newScore[state.currentPlayer - 1]++;
  newScore[2] = flip;
  const newState = {
    board: newScore,
    currentPlayer: state.currentPlayer === 1 ? 2 : 1,
    moveHistory: [...state.moveHistory, {
      player: state.currentPlayer,
      position,
      label: `P${state.currentPlayer} guessed ${position === 0 ? "H" : "T"}, got ${flip === 0 ? "H" : "T"} \u2192 ${correct ? "\u2713" : "\u2717"}`
    }],
    status: "playing",
    winner: null,
    turnCount: state.turnCount + 1
  };
  if (newState.turnCount >= 10) {
    const s1 = newScore[0], s2 = newScore[1];
    if (s1 > s2) {
      newState.status = "win";
      newState.winner = 1;
    } else if (s2 > s1) {
      newState.status = "win";
      newState.winner = 2;
    } else {
      newState.status = "draw";
    }
  }
  return newState;
}
function coinCheckWin(state) {
  return state.winner;
}
function coinCheckDraw(state) {
  return state.status === "draw";
}
function coinEvaluate(state, player) {
  return (state.board[player - 1] ?? 0) - (state.board[player === 1 ? 1 : 0] ?? 0);
}
function coinFormatBoard(state) {
  return `P1: ${state.board[0] ?? 0} | P2: ${state.board[1] ?? 0} | Turn: ${state.turnCount}/10`;
}
var COIN_FLIP_RULES = {
  name: "coin_flip",
  getLegalMoves: coinGetLegalMoves,
  applyMove: coinApplyMove,
  checkWin: coinCheckWin,
  checkDraw: coinCheckDraw,
  evaluate: coinEvaluate,
  formatBoard: coinFormatBoard
};
function rpsGetLegalMoves(_state) {
  return [0, 1, 2];
}
function rpsApplyMove(state, position) {
  const newHistory = [...state.moveHistory, {
    player: state.currentPlayer,
    position,
    label: `P${state.currentPlayer}: ${["Rock", "Paper", "Scissors"][position]}`
  }];
  if (state.currentPlayer === 2) {
    const p1Move = state.board[2];
    const p2Move = position;
    const newScore = [state.board[0], state.board[1]];
    if (p1Move === p2Move) ; else if ((p1Move + 1) % 3 === p2Move) {
      newScore[1]++;
    } else {
      newScore[0]++;
    }
    const round = Math.floor(state.turnCount / 2) + 1;
    const newState = {
      board: [newScore[0], newScore[1], -1],
      currentPlayer: 1,
      moveHistory: newHistory,
      status: "playing",
      winner: null,
      turnCount: state.turnCount + 1
    };
    if (round >= 5) {
      if (newScore[0] > newScore[1]) {
        newState.status = "win";
        newState.winner = 1;
      } else if (newScore[1] > newScore[0]) {
        newState.status = "win";
        newState.winner = 2;
      } else {
        newState.status = "draw";
      }
    }
    return newState;
  }
  return {
    board: [state.board[0] ?? 0, state.board[1] ?? 0, position],
    currentPlayer: 2,
    moveHistory: newHistory,
    status: "playing",
    winner: null,
    turnCount: state.turnCount + 1
  };
}
function rpsCheckWin(state) {
  return state.winner;
}
function rpsCheckDraw(state) {
  return state.status === "draw";
}
function rpsEvaluate(state, player) {
  return (state.board[player - 1] ?? 0) - (state.board[player === 1 ? 1 : 0] ?? 0);
}
function rpsFormatBoard(state) {
  return `P1: ${state.board[0] ?? 0} | P2: ${state.board[1] ?? 0} | Round: ${Math.floor(state.turnCount / 2) + 1}/5`;
}
var RPS_RULES = {
  name: "rock_paper_scissors",
  getLegalMoves: rpsGetLegalMoves,
  applyMove: rpsApplyMove,
  checkWin: rpsCheckWin,
  checkDraw: rpsCheckDraw,
  evaluate: rpsEvaluate,
  formatBoard: rpsFormatBoard
};
var GAME_REGISTRY = {
  "tic_tac_toe": { rules: TIC_TAC_TOE_RULES, initialBoard: () => Array(9).fill(0) },
  "ttt": { rules: TIC_TAC_TOE_RULES, initialBoard: () => Array(9).fill(0) },
  "\u4E09\u76EE\u4E26\u3079": { rules: TIC_TAC_TOE_RULES, initialBoard: () => Array(9).fill(0) },
  "nim": { rules: NIM_RULES, initialBoard: () => [10] },
  "\u30CB\u30E0": { rules: NIM_RULES, initialBoard: () => [10] },
  "coin_flip": { rules: COIN_FLIP_RULES, initialBoard: () => [0, 0, -1] },
  "\u30B3\u30A4\u30F3": { rules: COIN_FLIP_RULES, initialBoard: () => [0, 0, -1] },
  "rock_paper_scissors": { rules: RPS_RULES, initialBoard: () => [0, 0, -1] },
  "rps": { rules: RPS_RULES, initialBoard: () => [0, 0, -1] },
  "\u3058\u3083\u3093\u3051\u3093": { rules: RPS_RULES, initialBoard: () => [0, 0, -1] }
};
function createGameSpace(gameName, config) {
  const entry = GAME_REGISTRY[gameName];
  if (!entry) throw new Error(`\u672A\u77E5\u306E\u30B2\u30FC\u30E0: ${gameName} (\u5BFE\u5FDC: ${Object.keys(GAME_REGISTRY).join(", ")})`);
  let board = entry.initialBoard();
  if (config?.board) board = config.board;
  if (config?.stones && gameName.includes("nim")) board = [config.stones];
  return {
    reiType: "GameSpace",
    state: {
      board,
      currentPlayer: 1,
      moveHistory: [],
      status: "playing",
      winner: null,
      turnCount: 0
    },
    rules: entry.rules,
    strategy: "minimax",
    maxDepth: 9,
    searchNodes: 0
  };
}
function minimax(state, rules, depth, alpha, beta, maximizing, player, nodeCounter) {
  nodeCounter.count++;
  const winner = rules.checkWin(state);
  if (winner !== null || rules.checkDraw(state) || depth <= 0) {
    return rules.evaluate(state, player);
  }
  const moves = rules.getLegalMoves(state);
  if (moves.length === 0) return rules.evaluate(state, player);
  if (maximizing) {
    let maxEval = -Infinity;
    for (const move of moves) {
      const newState = rules.applyMove(state, move);
      const ev = minimax(newState, rules, depth - 1, alpha, beta, false, player, nodeCounter);
      maxEval = Math.max(maxEval, ev);
      alpha = Math.max(alpha, ev);
      if (beta <= alpha) break;
    }
    return maxEval;
  } else {
    let minEval = Infinity;
    for (const move of moves) {
      const newState = rules.applyMove(state, move);
      const ev = minimax(newState, rules, depth - 1, alpha, beta, true, player, nodeCounter);
      minEval = Math.min(minEval, ev);
      beta = Math.min(beta, ev);
      if (beta <= alpha) break;
    }
    return minEval;
  }
}
function selectBestMove(game) {
  const { state, rules, strategy, maxDepth } = game;
  const moves = rules.getLegalMoves(state);
  if (moves.length === 0) return { move: -1, score: 0, searchNodes: 0 };
  switch (strategy) {
    case "random": {
      const idx = Math.floor(nextRandom() * moves.length);
      return { move: moves[idx], score: 0, searchNodes: 1 };
    }
    case "greedy": {
      let bestMove = moves[0];
      let bestScore = -Infinity;
      for (const move of moves) {
        const newState = rules.applyMove(state, move);
        const score = rules.evaluate(newState, state.currentPlayer);
        if (score > bestScore) {
          bestScore = score;
          bestMove = move;
        }
      }
      return { move: bestMove, score: bestScore, searchNodes: moves.length };
    }
    case "defensive": {
      const opponent = state.currentPlayer === 1 ? 2 : 1;
      let bestMove = moves[0];
      let bestScore = -Infinity;
      for (const move of moves) {
        const newState = rules.applyMove(state, move);
        const score = -rules.evaluate(newState, opponent);
        if (score > bestScore) {
          bestScore = score;
          bestMove = move;
        }
      }
      return { move: bestMove, score: bestScore, searchNodes: moves.length };
    }
    default: {
      const nodeCounter = { count: 0 };
      let bestMove = moves[0];
      let bestScore = -Infinity;
      for (const move of moves) {
        const newState = rules.applyMove(state, move);
        const score = minimax(newState, rules, maxDepth - 1, -Infinity, Infinity, false, state.currentPlayer, nodeCounter);
        if (score > bestScore) {
          bestScore = score;
          bestMove = move;
        }
      }
      return { move: bestMove, score: bestScore, searchNodes: nodeCounter.count };
    }
  }
}
function playMove(game, position) {
  const moves = game.rules.getLegalMoves(game.state);
  if (moves.length === 0 || game.state.status !== "playing") return game;
  let move;
  if (position !== void 0 && moves.includes(position)) {
    move = position;
  } else {
    const best = selectBestMove(game);
    move = best.move;
    game.searchNodes += best.searchNodes;
  }
  return {
    ...game,
    state: game.rules.applyMove(game.state, move)
  };
}
function autoPlay(game, p1Strategy, p2Strategy) {
  let current = { ...game };
  const s1 = p1Strategy ?? game.strategy;
  const s2 = p2Strategy ?? game.strategy;
  let safetyCounter = 0;
  while (current.state.status === "playing" && safetyCounter < 200) {
    safetyCounter++;
    current = {
      ...current,
      strategy: current.state.currentPlayer === 1 ? s1 : s2
    };
    current = playMove(current);
  }
  return current;
}
function gameAsMDim(game) {
  const moves = game.rules.getLegalMoves(game.state);
  return {
    reiType: "MDim",
    center: game.state.turnCount,
    neighbors: moves,
    mode: game.strategy,
    metadata: {
      game: game.rules.name,
      currentPlayer: game.state.currentPlayer,
      status: game.state.status
    }
  };
}
function getGameSigma(game) {
  return {
    reiType: "SigmaResult",
    field: {
      game: game.rules.name,
      board: game.state.board,
      turnCount: game.state.turnCount,
      status: game.state.status
    },
    flow: {
      currentPlayer: game.state.currentPlayer,
      direction: game.state.status === "playing" ? "active" : "terminated",
      momentum: game.state.turnCount
    },
    memory: game.state.moveHistory,
    layer: game.maxDepth,
    relation: {
      players: 2,
      type: game.rules.name === "nim" ? "adversarial_sequential" : game.rules.name === "coin_flip" ? "independent_simultaneous" : "adversarial_alternating"
    },
    will: {
      strategy: game.strategy,
      searchDepth: game.maxDepth,
      searchNodes: game.searchNodes
    }
  };
}
function formatGame(game) {
  const lines = [];
  lines.push(`\u2550\u2550\u2550 ${game.rules.name} \u2550\u2550\u2550`);
  lines.push(game.rules.formatBoard(game.state));
  lines.push(`\u624B\u756A: Player ${game.state.currentPlayer} | \u72B6\u614B: ${game.state.status}`);
  if (game.state.winner) lines.push(`\u52DD\u8005: Player ${game.state.winner}`);
  if (game.state.moveHistory.length > 0) {
    lines.push(`\u2500\u2500\u2500 \u68CB\u8B5C \u2500\u2500\u2500`);
    for (const m of game.state.moveHistory.slice(-5)) {
      lines.push(`  ${m.label}`);
    }
    if (game.state.moveHistory.length > 5) {
      lines.push(`  ... (${game.state.moveHistory.length - 5}\u624B\u7701\u7565)`);
    }
  }
  return lines.join("\n");
}
function getLegalMoves(game) {
  return game.rules.getLegalMoves(game.state);
}
function simulateGames(gameName, n, p1Strategy = "minimax", p2Strategy = "random") {
  let p1Wins = 0, p2Wins = 0, draws = 0;
  for (let i = 0; i < n; i++) {
    const game = createGameSpace(gameName);
    const result = autoPlay(game, p1Strategy, p2Strategy);
    if (result.state.winner === 1) p1Wins++;
    else if (result.state.winner === 2) p2Wins++;
    else draws++;
  }
  return { p1Wins, p2Wins, draws, total: n, p1Rate: p1Wins / n };
}

// src/lang/puzzle.ts
function createCell(row, col, size) {
  return {
    row,
    col,
    value: 0,
    candidates: Array.from({ length: size }, (_, i) => i + 1),
    fixed: false,
    eliminationHistory: []
  };
}
function createSudokuConstraints(size) {
  const groups = [];
  const boxSize = Math.round(Math.sqrt(size));
  for (let r = 0; r < size; r++) {
    groups.push({
      type: "all_different",
      cells: Array.from({ length: size }, (_, c) => [r, c]),
      label: `\u884C${r}`
    });
  }
  for (let c = 0; c < size; c++) {
    groups.push({
      type: "all_different",
      cells: Array.from({ length: size }, (_, r) => [r, c]),
      label: `\u5217${c}`
    });
  }
  for (let br = 0; br < boxSize; br++) {
    for (let bc = 0; bc < boxSize; bc++) {
      const cells = [];
      for (let r = 0; r < boxSize; r++) {
        for (let c = 0; c < boxSize; c++) {
          cells.push([br * boxSize + r, bc * boxSize + c]);
        }
      }
      groups.push({
        type: "all_different",
        cells,
        label: `\u30D6\u30ED\u30C3\u30AF(${br},${bc})`
      });
    }
  }
  return groups;
}
function createLatinSquareConstraints(size) {
  const groups = [];
  for (let r = 0; r < size; r++) {
    groups.push({
      type: "all_different",
      cells: Array.from({ length: size }, (_, c) => [r, c]),
      label: `\u884C${r}`
    });
  }
  for (let c = 0; c < size; c++) {
    groups.push({
      type: "all_different",
      cells: Array.from({ length: size }, (_, r) => [r, c]),
      label: `\u5217${c}`
    });
  }
  return groups;
}
function createSudokuSpace(grid) {
  const size = grid.length;
  const cells = [];
  for (let r = 0; r < size; r++) {
    cells[r] = [];
    for (let c = 0; c < size; c++) {
      cells[r][c] = createCell(r, c, size);
      if (grid[r][c] > 0) {
        cells[r][c].value = grid[r][c];
        cells[r][c].candidates = [];
        cells[r][c].fixed = true;
      }
    }
  }
  const space = {
    reiType: "PuzzleSpace",
    puzzleType: "sudoku",
    size,
    cells,
    constraints: createSudokuConstraints(size),
    history: [],
    solved: false,
    step: 0,
    totalCandidates: 0,
    confirmedCells: 0
  };
  initialPropagation(space);
  updateSpaceSigma(space);
  return space;
}
function createLatinSquareSpace(grid) {
  const size = grid.length;
  const cells = [];
  for (let r = 0; r < size; r++) {
    cells[r] = [];
    for (let c = 0; c < size; c++) {
      cells[r][c] = createCell(r, c, size);
      if (grid[r][c] > 0) {
        cells[r][c].value = grid[r][c];
        cells[r][c].candidates = [];
        cells[r][c].fixed = true;
      }
    }
  }
  const space = {
    reiType: "PuzzleSpace",
    puzzleType: "latin_square",
    size,
    cells,
    constraints: createLatinSquareConstraints(size),
    history: [],
    solved: false,
    step: 0,
    totalCandidates: 0,
    confirmedCells: 0
  };
  initialPropagation(space);
  updateSpaceSigma(space);
  return space;
}
function initialPropagation(space) {
  const { cells, constraints } = space;
  const details = [];
  let eliminations = 0;
  for (const group of constraints) {
    if (group.type !== "all_different") continue;
    const confirmed = /* @__PURE__ */ new Set();
    for (const [r, c] of group.cells) {
      if (cells[r][c].value > 0) confirmed.add(cells[r][c].value);
    }
    for (const [r, c] of group.cells) {
      if (cells[r][c].value > 0) continue;
      for (const val of confirmed) {
        const idx = cells[r][c].candidates.indexOf(val);
        if (idx >= 0) {
          cells[r][c].candidates.splice(idx, 1);
          cells[r][c].eliminationHistory.push({
            candidate: val,
            reason: `${group.type}_initial`,
            source: [-1, -1],
            step: 0
          });
          eliminations++;
        }
      }
      if (cells[r][c].candidates.length === 1) {
        cells[r][c].value = cells[r][c].candidates[0];
        cells[r][c].candidates = [];
        details.push(`(${r},${c})=${cells[r][c].value} [\u521D\u671F\u4F1D\u64AD: ${group.label}]`);
      }
    }
  }
  if (eliminations > 0) {
    space.history.push({
      step: 0,
      eliminations,
      confirmations: details.length,
      technique: "initial_propagation",
      details
    });
  }
}
function updateSpaceSigma(space) {
  let total = 0;
  let confirmed = 0;
  const { cells, size } = space;
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (cells[r][c].value > 0) {
        confirmed++;
      } else {
        total += cells[r][c].candidates.length;
      }
    }
  }
  space.totalCandidates = total;
  space.confirmedCells = confirmed;
  space.solved = confirmed === size * size;
}
function propagateStep(space) {
  space.step++;
  const step = space.step;
  const { cells, constraints, size } = space;
  const details = [];
  let eliminations = 0;
  let confirmations = 0;
  let nakedSingleProgress = true;
  while (nakedSingleProgress) {
    nakedSingleProgress = false;
    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        if (cells[r][c].value > 0) continue;
        if (cells[r][c].candidates.length === 1) {
          const val = cells[r][c].candidates[0];
          cells[r][c].value = val;
          cells[r][c].candidates = [];
          confirmations++;
          nakedSingleProgress = true;
          details.push(`(${r},${c})=${val} [Naked Single]`);
          for (const group of constraints) {
            if (!group.cells.some(([gr, gc]) => gr === r && gc === c)) continue;
            for (const [gr, gc] of group.cells) {
              if (gr === r && gc === c) continue;
              if (cells[gr][gc].value > 0) continue;
              const idx = cells[gr][gc].candidates.indexOf(val);
              if (idx >= 0) {
                cells[gr][gc].candidates.splice(idx, 1);
                cells[gr][gc].eliminationHistory.push({
                  candidate: val,
                  reason: `${group.type}_propagation`,
                  source: [r, c],
                  step
                });
                eliminations++;
              }
            }
          }
        }
      }
    }
  }
  for (const group of constraints) {
    if (group.type !== "all_different") continue;
    const confirmedInGroup = /* @__PURE__ */ new Set();
    for (const [r, c] of group.cells) {
      if (cells[r][c].value > 0) confirmedInGroup.add(cells[r][c].value);
    }
    for (let val = 1; val <= size; val++) {
      if (confirmedInGroup.has(val)) continue;
      const possibleCells = [];
      for (const [r, c] of group.cells) {
        if (cells[r][c].value > 0) continue;
        if (cells[r][c].candidates.includes(val)) {
          possibleCells.push([r, c]);
        }
      }
      if (possibleCells.length === 1) {
        const [r, c] = possibleCells[0];
        if (cells[r][c].value > 0) continue;
        const removed = cells[r][c].candidates.filter((v) => v !== val);
        for (const rem of removed) {
          cells[r][c].eliminationHistory.push({
            candidate: rem,
            reason: "hidden_single",
            source: [r, c],
            step
          });
          eliminations++;
        }
        cells[r][c].value = val;
        cells[r][c].candidates = [];
        confirmations++;
        details.push(`(${r},${c})=${val} [Hidden Single: ${group.label}]`);
        for (const otherGroup of constraints) {
          if (!otherGroup.cells.some(([gr, gc]) => gr === r && gc === c)) continue;
          for (const [gr, gc] of otherGroup.cells) {
            if (gr === r && gc === c) continue;
            if (cells[gr][gc].value > 0) continue;
            const idx = cells[gr][gc].candidates.indexOf(val);
            if (idx >= 0) {
              cells[gr][gc].candidates.splice(idx, 1);
              cells[gr][gc].eliminationHistory.push({
                candidate: val,
                reason: `${otherGroup.type}_propagation`,
                source: [r, c],
                step
              });
              eliminations++;
            }
          }
        }
      }
    }
  }
  const record = {
    step,
    eliminations,
    confirmations,
    technique: confirmations > 0 ? "naked_single+hidden_single" : "no_progress",
    details
  };
  space.history.push(record);
  updateSpaceSigma(space);
  return record;
}
function propagateNakedPair(space) {
  space.step++;
  const step = space.step;
  const { cells, constraints } = space;
  const details = [];
  let eliminations = 0;
  for (const group of constraints) {
    if (group.type !== "all_different") continue;
    const pairs = [];
    for (const [r, c] of group.cells) {
      if (cells[r][c].candidates.length === 2) {
        pairs.push({ pos: [r, c], cands: [...cells[r][c].candidates] });
      }
    }
    for (let i = 0; i < pairs.length; i++) {
      for (let j = i + 1; j < pairs.length; j++) {
        if (pairs[i].cands[0] === pairs[j].cands[0] && pairs[i].cands[1] === pairs[j].cands[1]) {
          const [v1, v2] = pairs[i].cands;
          const [r1, c1] = pairs[i].pos;
          const [r2, c2] = pairs[j].pos;
          for (const [r, c] of group.cells) {
            if (r === r1 && c === c1 || r === r2 && c === c2) continue;
            if (cells[r][c].value > 0) continue;
            for (const val of [v1, v2]) {
              const idx = cells[r][c].candidates.indexOf(val);
              if (idx >= 0) {
                cells[r][c].candidates.splice(idx, 1);
                cells[r][c].eliminationHistory.push({
                  candidate: val,
                  reason: "naked_pair",
                  source: [r1, c1],
                  step
                });
                eliminations++;
                details.push(
                  `(${r},${c}) \u304B\u3089 ${val} \u3092\u6D88\u53BB [Naked Pair: (${r1},${c1})-(${r2},${c2})={${v1},${v2}} in ${group.label}]`
                );
              }
            }
          }
        }
      }
    }
  }
  const record = {
    step,
    eliminations,
    confirmations: 0,
    technique: eliminations > 0 ? "naked_pair" : "no_progress",
    details
  };
  space.history.push(record);
  updateSpaceSigma(space);
  return record;
}
function solveWithBacktracking(space) {
  let progress = true;
  while (progress) {
    const result = propagateStep(space);
    if (result.confirmations === 0 && result.eliminations === 0) {
      const pairResult = propagateNakedPair(space);
      if (pairResult.eliminations === 0) {
        progress = false;
      } else {
        progress = true;
      }
    }
    if (space.solved) return true;
    for (let r = 0; r < space.size; r++) {
      for (let c = 0; c < space.size; c++) {
        if (space.cells[r][c].value === 0 && space.cells[r][c].candidates.length === 0) {
          return false;
        }
      }
    }
  }
  if (space.solved) return true;
  let minCands = Infinity;
  let targetCell = null;
  for (let r = 0; r < space.size; r++) {
    for (let c = 0; c < space.size; c++) {
      const cell = space.cells[r][c];
      if (cell.value === 0 && cell.candidates.length > 0 && cell.candidates.length < minCands) {
        minCands = cell.candidates.length;
        targetCell = [r, c];
      }
    }
  }
  if (!targetCell) return false;
  const [tr, tc] = targetCell;
  const candidates = [...space.cells[tr][tc].candidates];
  for (const val of candidates) {
    const snapshot = snapshotSpace(space);
    space.cells[tr][tc].value = val;
    space.cells[tr][tc].candidates = [];
    space.step++;
    space.history.push({
      step: space.step,
      eliminations: 0,
      confirmations: 1,
      technique: "backtracking_guess",
      details: [`(${tr},${tc})=${val} [\u4EEE\u5B9A: \u5019\u88DC${candidates.join(",")}\u304B\u3089]`]
    });
    propagateFromConfirmation(space, tr, tc, val);
    updateSpaceSigma(space);
    if (solveWithBacktracking(space)) {
      return true;
    }
    restoreSpace(space, snapshot);
  }
  return false;
}
function propagateFromConfirmation(space, row, col, val) {
  const { cells, constraints } = space;
  for (const group of constraints) {
    if (!group.cells.some(([gr, gc]) => gr === row && gc === col)) continue;
    for (const [gr, gc] of group.cells) {
      if (gr === row && gc === col) continue;
      if (cells[gr][gc].value > 0) continue;
      const idx = cells[gr][gc].candidates.indexOf(val);
      if (idx >= 0) {
        cells[gr][gc].candidates.splice(idx, 1);
        cells[gr][gc].eliminationHistory.push({
          candidate: val,
          reason: `${group.type}_propagation`,
          source: [row, col],
          step: space.step
        });
      }
    }
  }
}
function snapshotSpace(space) {
  const { cells, size } = space;
  const snap = {
    cells: [],
    step: space.step,
    histLen: space.history.length,
    solved: space.solved
  };
  for (let r = 0; r < size; r++) {
    snap.cells[r] = [];
    for (let c = 0; c < size; c++) {
      snap.cells[r][c] = {
        value: cells[r][c].value,
        candidates: [...cells[r][c].candidates],
        histLen: cells[r][c].eliminationHistory.length
      };
    }
  }
  return snap;
}
function restoreSpace(space, snap) {
  const { cells, size } = space;
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      cells[r][c].value = snap.cells[r][c].value;
      cells[r][c].candidates = [...snap.cells[r][c].candidates];
      cells[r][c].eliminationHistory = cells[r][c].eliminationHistory.slice(0, snap.cells[r][c].histLen);
    }
  }
  space.step = snap.step;
  space.history = space.history.slice(0, snap.histLen);
  space.solved = snap.solved;
  updateSpaceSigma(space);
}
function solvePuzzle(space) {
  if (space.solved) return space;
  solveWithBacktracking(space);
  return space;
}
function propagateOnly(space, maxSteps = 100) {
  let steps = 0;
  while (steps < maxSteps && !space.solved) {
    const result = propagateStep(space);
    if (result.confirmations === 0 && result.eliminations === 0) {
      const pairResult = propagateNakedPair(space);
      if (pairResult.eliminations === 0) break;
    }
    steps++;
  }
  return space;
}
function cellAsMDim(space, row, col) {
  const cell = space.cells[row]?.[col];
  if (!cell) throw new Error(`\u30BB\u30EB(${row},${col})\u304C\u898B\u3064\u304B\u308A\u307E\u305B\u3093`);
  return {
    reiType: "MDim",
    center: cell.value,
    neighbors: [...cell.candidates],
    mode: "weighted",
    // パズル拡張情報
    __puzzle__: {
      row: cell.row,
      col: cell.col,
      fixed: cell.fixed,
      eliminationCount: cell.eliminationHistory.length
    }
  };
}
function getGrid(space) {
  const grid = [];
  for (let r = 0; r < space.size; r++) {
    grid[r] = [];
    for (let c = 0; c < space.size; c++) {
      grid[r][c] = space.cells[r][c].value;
    }
  }
  return grid;
}
function getCandidates(space, row, col) {
  const cell = space.cells[row]?.[col];
  if (!cell) return [];
  if (cell.value > 0) return [];
  return [...cell.candidates];
}
function getPuzzleSigma(space) {
  const { size, cells } = space;
  let totalCandidates = 0;
  let confirmedCells = 0;
  let minCandidates = Infinity;
  let maxCandidates = 0;
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (cells[r][c].value > 0) {
        confirmedCells++;
      } else {
        const cLen = cells[r][c].candidates.length;
        totalCandidates += cLen;
        if (cLen < minCandidates) minCandidates = cLen;
        if (cLen > maxCandidates) maxCandidates = cLen;
      }
    }
  }
  const totalCells = size * size;
  const progress = confirmedCells / totalCells;
  return {
    reiType: "SigmaResult",
    field: {
      puzzleType: space.puzzleType,
      size: space.size,
      totalCells,
      confirmedCells,
      remainingCells: totalCells - confirmedCells,
      totalCandidates,
      constraintGroups: space.constraints.length
    },
    flow: {
      step: space.step,
      momentum: space.solved ? "converged" : progress > 0.5 ? "contracting" : "expanding",
      progress,
      velocity: space.history.length > 0 ? space.history[space.history.length - 1].confirmations : 0
    },
    memory: space.history.map((h) => ({
      step: h.step,
      technique: h.technique,
      eliminations: h.eliminations,
      confirmations: h.confirmations
    })),
    layer: space.history.some((h) => h.technique === "backtracking_guess") ? 2 : space.history.some((h) => h.technique === "naked_pair") ? 1 : 0,
    will: {
      tendency: space.solved ? "rest" : minCandidates <= 2 ? "contract" : maxCandidates >= 7 ? "expand" : "spiral",
      strength: progress,
      minCandidates: minCandidates === Infinity ? 0 : minCandidates,
      maxCandidates
    },
    relation: space.constraints.map((g) => ({ type: g.type, label: g.label, cells: g.cells.length }))
  };
}
function formatSudoku(space) {
  const { cells, size } = space;
  const boxSize = Math.round(Math.sqrt(size));
  const lines = [];
  for (let r = 0; r < size; r++) {
    if (r > 0 && r % boxSize === 0) {
      lines.push("------+-------+------");
    }
    const row = [];
    for (let c = 0; c < size; c++) {
      if (c > 0 && c % boxSize === 0) row.push("|");
      const v = cells[r][c].value;
      row.push(v > 0 ? ` ${v}` : " .");
    }
    lines.push(row.join(""));
  }
  return lines.join("\n");
}
function estimateDifficulty(space) {
  const techniques = new Set(space.history.map((h) => h.technique));
  const totalSteps = space.history.length;
  const backtrackUsed = techniques.has("backtracking_guess");
  const nakedPairUsed = techniques.has("naked_pair");
  let level;
  let score;
  if (backtrackUsed) {
    level = "\u6975\u96E3";
    score = 5;
  } else if (nakedPairUsed) {
    level = "\u96E3";
    score = 4;
  } else if (totalSteps > 10) {
    level = "\u4E2D";
    score = 3;
  } else if (totalSteps > 5) {
    level = "\u6613";
    score = 2;
  } else {
    level = "\u5165\u9580";
    score = 1;
  }
  return {
    reiType: "DifficultyResult",
    level,
    score,
    totalSteps,
    techniques: [...techniques],
    backtrackUsed,
    // D-FUMT層: 使用した推論の最大深度
    maxLayer: backtrackUsed ? 2 : nakedPairUsed ? 1 : 0
  };
}
function generateSudoku(clues = 30, seed) {
  const grid = Array.from({ length: 9 }, () => Array(9).fill(0));
  let s = seed ?? Date.now();
  function rand() {
    s = s * 1103515245 + 12345 & 2147483647;
    return s / 2147483647;
  }
  function shuffle(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(rand() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }
  function fillGrid(g) {
    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) {
        if (g[r][c] !== 0) continue;
        const nums = shuffle([1, 2, 3, 4, 5, 6, 7, 8, 9]);
        for (const n of nums) {
          if (isValid(g, r, c, n)) {
            g[r][c] = n;
            if (fillGrid(g)) return true;
            g[r][c] = 0;
          }
        }
        return false;
      }
    }
    return true;
  }
  function isValid(g, r, c, n) {
    for (let i = 0; i < 9; i++) {
      if (g[r][i] === n || g[i][c] === n) return false;
    }
    const br = Math.floor(r / 3) * 3;
    const bc = Math.floor(c / 3) * 3;
    for (let i = 0; i < 3; i++) {
      for (let j = 0; j < 3; j++) {
        if (g[br + i][bc + j] === n) return false;
      }
    }
    return true;
  }
  fillGrid(grid);
  const positions = shuffle(
    Array.from({ length: 81 }, (_, i) => [Math.floor(i / 9), i % 9])
  );
  let removed = 0;
  const target = 81 - Math.max(17, Math.min(40, clues));
  for (const [r, c] of positions) {
    if (removed >= target) break;
    grid[r][c] = 0;
    removed++;
  }
  return grid;
}
function parseGrid(input) {
  let flat;
  if (typeof input === "string") {
    flat = input.replace(/[^0-9.]/g, "").split("").map((c) => c === "." ? 0 : parseInt(c, 10));
  } else {
    flat = input;
  }
  const size = Math.round(Math.sqrt(flat.length));
  const grid = [];
  for (let r = 0; r < size; r++) {
    grid[r] = [];
    for (let c = 0; c < size; c++) {
      grid[r][c] = flat[r * size + c] ?? 0;
    }
  }
  return grid;
}

// src/lang/evaluator.ts
function createSigmaMeta() {
  return { memory: [], tendency: "rest", pipeCount: 0 };
}
function wrapWithSigma(value, prevValue, prevMeta) {
  const rawValue = unwrapReiVal(value);
  const rawPrev = unwrapReiVal(prevValue);
  const meta = prevMeta ? { ...prevMeta, memory: [...prevMeta.memory, rawPrev], pipeCount: prevMeta.pipeCount + 1 } : { memory: [rawPrev], tendency: "rest", pipeCount: 1 };
  meta.tendency = computeTendency(meta.memory, rawValue);
  if (rawValue === null || typeof rawValue !== "object") {
    return { reiType: "ReiVal", value: rawValue, __sigma__: meta };
  }
  rawValue.__sigma__ = meta;
  return rawValue;
}
function computeTendency(memory, currentValue) {
  if (memory.length < 2) return "rest";
  const recent = memory.slice(-5).map(toNumSafe);
  const current = toNumSafe(currentValue);
  let expandCount = 0, contractCount = 0, alternating = 0;
  for (let i = 0; i < recent.length; i++) {
    const prev = i === 0 ? recent[0] : recent[i - 1];
    const cur = i === recent.length - 1 ? current : recent[i + 1];
    if (cur > prev) expandCount++;
    else if (cur < prev) contractCount++;
    if (i > 0 && cur > prev !== recent[i] > recent[i - 1]) alternating++;
  }
  if (alternating >= recent.length - 1) return "spiral";
  if (expandCount > contractCount) return "expand";
  if (contractCount > expandCount) return "contract";
  return "rest";
}
function toNumSafe(v) {
  if (typeof v === "number") return v;
  if (v === null || v === void 0) return 0;
  if (typeof v === "boolean") return v ? 1 : 0;
  if (typeof v === "object" && v.reiType === "ReiVal") return toNumSafe(v.value);
  if (typeof v === "object" && v.reiType === "Ext") return v.valStar();
  if (typeof v === "object" && v.reiType === "MDim") {
    const { center, neighbors, mode } = v;
    const weights = v.weights ?? neighbors.map(() => 1);
    const n = neighbors.length;
    if (n === 0) return center;
    const wSum = weights.reduce((a, b) => a + b, 0);
    const wAvg = neighbors.reduce((sum, vi, i) => sum + (weights[i] ?? 1) * vi, 0) / (wSum || 1);
    return center + wAvg;
  }
  return 0;
}
function unwrapReiVal(v) {
  if (v !== null && typeof v === "object" && v.reiType === "ReiVal") return v.value;
  return v;
}
function getSigmaOf(v) {
  if (v !== null && typeof v === "object") {
    if (v.reiType === "ReiVal") return v.__sigma__;
    if (v.__sigma__) return v.__sigma__;
  }
  return createSigmaMeta();
}
function buildSigmaResult(rawVal, meta) {
  const val = unwrapReiVal(rawVal);
  let field;
  let layer = 0;
  let flow = { direction: meta.tendency === "rest" ? "rest" : meta.tendency, momentum: meta.pipeCount, velocity: 0 };
  if (val !== null && typeof val === "object") {
    if (val.reiType === "MDim") {
      field = { center: val.center, neighbors: [...val.neighbors], mode: val.mode, dim: val.neighbors.length };
    } else if (val.reiType === "Ext") {
      field = { base: val.base, order: val.order, subscripts: val.subscripts };
      layer = val.order;
    } else if (val.reiType === "State") {
      field = { state: val.state, omega: val.omega };
      flow = { direction: "forward", momentum: val.history.length - 1, velocity: 1 };
    } else if (val.reiType === "Quad") {
      field = { value: val.value };
    } else if (val.reiType === "DNode") {
      field = { center: val.center, neighbors: [...val.neighbors], layer: val.layerIndex, index: val.nodeIndex };
      layer = val.layerIndex;
      flow = { stage: val.stage, directions: val.neighbors.length, momentum: val.momentum, velocity: 0 };
      if (val.diffusionHistory.length >= 2) {
        flow.velocity = Math.abs(
          val.diffusionHistory[val.diffusionHistory.length - 1].result - val.diffusionHistory[val.diffusionHistory.length - 2].result
        );
      }
    } else if (val.reiType === "Space") {
      field = { type: "space" };
    } else if (Array.isArray(val)) {
      field = { length: val.length, first: val[0] ?? null, last: val[val.length - 1] ?? null };
    } else {
      field = { type: typeof val };
    }
  } else if (typeof val === "number") {
    field = { center: val, neighbors: [] };
  } else if (typeof val === "string") {
    field = { value: val, length: val.length };
  } else if (typeof val === "boolean") {
    field = { value: val };
  } else {
    field = { value: null };
  }
  const memory = [...meta.memory];
  if (val !== null && typeof val === "object" && val.reiType === "State" && val.history) {
    if (memory.length === 0 && val.history.length > 1) {
      for (let i = 0; i < val.history.length - 1; i++) {
        memory.push(val.history[i]);
      }
    }
  }
  const will = {
    tendency: meta.tendency,
    strength: meta.pipeCount > 0 ? Math.min(meta.pipeCount / 5, 1) : 0,
    history: meta.memory.map((_, i) => {
      if (i === 0) return "rest";
      const prev = toNumSafe(meta.memory[i - 1]);
      const cur = toNumSafe(meta.memory[i]);
      return cur > prev ? "expand" : cur < prev ? "contract" : "rest";
    })
  };
  return {
    reiType: "SigmaResult",
    field,
    flow,
    memory,
    layer,
    will,
    relation: []
  };
}
var Environment = class {
  parent;
  bindings = /* @__PURE__ */ new Map();
  constructor(parent = null) {
    this.parent = parent;
  }
  define(name, value, mutable = false) {
    this.bindings.set(name, { value, mutable });
  }
  get(name) {
    const b = this.bindings.get(name);
    if (b) return b.value;
    if (this.parent) return this.parent.get(name);
    throw new Error(`\u672A\u5B9A\u7FA9\u306E\u5909\u6570: ${name}`);
  }
  set(name, value) {
    const b = this.bindings.get(name);
    if (b) {
      if (!b.mutable) throw new Error(`\u4E0D\u5909\u306E\u5909\u6570\u306B\u4EE3\u5165: ${name}`);
      b.value = value;
      return;
    }
    if (this.parent) {
      this.parent.set(name, value);
      return;
    }
    throw new Error(`\u672A\u5B9A\u7FA9\u306E\u5909\u6570: ${name}`);
  }
  has(name) {
    if (this.bindings.has(name)) return true;
    if (this.parent) return this.parent.has(name);
    return false;
  }
  getBinding(name) {
    const b = this.bindings.get(name);
    if (b) return b;
    if (this.parent) return this.parent.getBinding(name);
    return null;
  }
  allBindings() {
    const all = /* @__PURE__ */ new Map();
    if (this.parent) {
      for (const [k, v] of this.parent.allBindings()) all.set(k, v);
    }
    for (const [k, v] of this.bindings) all.set(k, v);
    return all;
  }
};
function createExtended(base, subscripts) {
  const order = subscripts.length;
  return {
    reiType: "Ext",
    base,
    order,
    subscripts,
    valStar() {
      if (base === 0) return Math.pow(0.1, order);
      return base * Math.pow(0.1, order);
    }
  };
}
function parseExtLit(raw) {
  if (raw === "0\u2080") return createExtended(0, "o");
  const baseChar = raw[0];
  const subs = raw.slice(1);
  const baseMap = {
    "0": 0,
    "\u03C0": Math.PI,
    "e": Math.E,
    "\u03C6": (1 + Math.sqrt(5)) / 2,
    "i": NaN
  };
  return createExtended(baseMap[baseChar] ?? 0, subs);
}
var ALL_COMPUTE_MODES = [
  "weighted",
  "multiplicative",
  "harmonic",
  "exponential",
  "geometric",
  "median",
  "minkowski",
  "entropy"
];
function computeMDim(md) {
  const { center, neighbors, mode } = md;
  const weights = md.weights ?? neighbors.map(() => 1);
  const n = neighbors.length;
  if (n === 0) return center;
  if (typeof mode === "string" && mode.startsWith("blend(")) {
    return computeBlend(md, mode);
  }
  switch (mode) {
    case "weighted": {
      const wSum = weights.reduce((a, b) => a + b, 0);
      const wAvg = neighbors.reduce((sum, v, i) => sum + (weights[i] ?? 1) * v, 0) / (wSum || 1);
      return center + wAvg;
    }
    case "multiplicative": {
      const prod = neighbors.reduce((p, v) => p * (1 + v), 1);
      return center * prod;
    }
    case "harmonic": {
      const harmSum = neighbors.reduce((s, v) => s + 1 / (Math.abs(v) || 1), 0);
      return center + n / harmSum;
    }
    case "exponential": {
      const expSum = neighbors.reduce((s, v) => s + Math.exp(v), 0);
      return center * (expSum / n);
    }
    // ── Tier 2 M1: 新計算モード ──
    case "geometric": {
      const prod = neighbors.reduce((p, v) => p * Math.abs(v || 1), 1);
      return center * Math.pow(prod, 1 / n);
    }
    case "median": {
      const sorted = [...neighbors].sort((a, b) => a - b);
      const mid = Math.floor(n / 2);
      const med = n % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
      return center + med;
    }
    case "minkowski": {
      const p = md.minkowskiP ?? 2;
      const sumP = neighbors.reduce((s, v) => s + Math.pow(Math.abs(v), p), 0);
      return center + Math.pow(sumP / n, 1 / p);
    }
    case "entropy": {
      const total = neighbors.reduce((s, v) => s + Math.abs(v), 0) || 1;
      const probs = neighbors.map((v) => Math.abs(v) / total);
      const H = -probs.reduce((s, p) => s + (p > 0 ? p * Math.log2(p) : 0), 0);
      return center * (1 + H);
    }
    default:
      return center;
  }
}
function computeBlend(md, blendSpec) {
  const inner = blendSpec.slice(6, -1);
  const parts = inner.split(",").map((s) => s.trim());
  let totalWeight = 0;
  let blendedResult = 0;
  for (const part of parts) {
    const [modeName, weightStr] = part.split(":").map((s) => s.trim());
    const w = parseFloat(weightStr) || 0;
    const result = computeMDim({ ...md, mode: modeName });
    blendedResult += w * result;
    totalWeight += w;
  }
  return totalWeight > 0 ? blendedResult / totalWeight : md.center;
}
function projectToMDim(input, centerSpec, args) {
  let elements;
  if (Array.isArray(input)) {
    elements = [...input];
  } else if (typeof input === "string") {
    elements = Array.from(input).map((c) => c.charCodeAt(0));
  } else if (typeof input === "number") {
    const digits = Math.abs(input).toString().split("").map(Number);
    elements = digits;
  } else if (input !== null && typeof input === "object" && input.reiType === "MDim") {
    elements = [input.center, ...input.neighbors];
  } else {
    return { reiType: "MDim", center: input ?? 0, neighbors: [], mode: "weighted" };
  }
  if (elements.length === 0) {
    return { reiType: "MDim", center: 0, neighbors: [], mode: "weighted" };
  }
  let centerIndex = 0;
  if (centerSpec === ":max" || centerSpec === "max") {
    centerIndex = elements.indexOf(Math.max(...elements.map(Number)));
  } else if (centerSpec === ":min" || centerSpec === "min") {
    centerIndex = elements.indexOf(Math.min(...elements.map(Number)));
  } else if (centerSpec === ":first" || centerSpec === "first") {
    centerIndex = 0;
  } else if (centerSpec === ":last" || centerSpec === "last") {
    centerIndex = elements.length - 1;
  } else if (centerSpec === ":middle" || centerSpec === "middle") {
    centerIndex = Math.floor(elements.length / 2);
  } else if (typeof centerSpec === "number") {
    const idx = elements.indexOf(centerSpec);
    centerIndex = idx >= 0 ? idx : 0;
  }
  const center = elements[centerIndex];
  const neighbors = elements.filter((_, i) => i !== centerIndex);
  return { reiType: "MDim", center, neighbors, mode: "weighted" };
}
function projectAll(input) {
  let elements;
  if (Array.isArray(input)) {
    elements = [...input];
  } else if (typeof input === "string") {
    elements = Array.from(input).map((c) => c.charCodeAt(0));
  } else if (typeof input === "number") {
    elements = Math.abs(input).toString().split("").map(Number);
  } else if (input !== null && typeof input === "object" && input.reiType === "MDim") {
    elements = [input.center, ...input.neighbors];
  } else {
    return [{ reiType: "MDim", center: input ?? 0, neighbors: [], mode: "weighted" }];
  }
  if (elements.length === 0) return [];
  return elements.map((_, centerIdx) => {
    const center = elements[centerIdx];
    const neighbors = elements.filter((_2, i) => i !== centerIdx);
    return { reiType: "MDim", center, neighbors, mode: "weighted" };
  });
}
function computeAll(md) {
  if (!md || md.reiType !== "MDim") return [];
  return ALL_COMPUTE_MODES.map((mode) => ({
    mode,
    value: computeMDim({ ...md, mode })
  }));
}
function compareModes(md, mode1, mode2) {
  if (!md || md.reiType !== "MDim") return null;
  const v1 = computeMDim({ ...md, mode: mode1 });
  const v2 = computeMDim({ ...md, mode: mode2 });
  return {
    reiType: "CompareResult",
    mode1: { mode: mode1, value: v1 },
    mode2: { mode: mode2, value: v2 },
    diff: Math.abs(v1 - v2),
    ratio: v2 !== 0 ? v1 / v2 : Infinity
  };
}
function perspectives(input) {
  const allProjections = projectAll(input);
  return allProjections.map((proj, idx) => {
    const results = ALL_COMPUTE_MODES.map((mode) => ({
      mode,
      value: computeMDim({ ...proj, mode })
    }));
    return {
      projectionIndex: idx,
      center: proj.center,
      neighbors: proj.neighbors,
      results
    };
  });
}
function computeNestedMDim(md) {
  const center = md.reiType === "MDim" ? md.center !== null && typeof md.center === "object" && md.center.reiType === "MDim" ? computeNestedMDim(md.center) : typeof md.center === "number" ? md.center : 0 : typeof md === "number" ? md : 0;
  const neighbors = (md.neighbors ?? []).map(
    (n) => n !== null && typeof n === "object" && n.reiType === "MDim" ? computeNestedMDim(n) : typeof n === "number" ? n : 0
  );
  return computeMDim({ ...md, center, neighbors });
}
function respondToStimulus(input, stimulus, method = "absorb") {
  if (input !== null && typeof input === "object" && input.reiType === "MDim") {
    const md = input;
    switch (method) {
      case "absorb": {
        const factor = stimulus / (Math.abs(md.center) + Math.abs(stimulus) || 1);
        const newCenter = md.center + stimulus * factor;
        return { ...md, center: newCenter };
      }
      case "distribute": {
        const share = stimulus / (md.neighbors.length || 1);
        const newNeighbors = md.neighbors.map((n) => n + share);
        return { ...md, neighbors: newNeighbors };
      }
      case "reflect": {
        const newNeighbors = md.neighbors.map((n) => n - stimulus / (md.neighbors.length || 1));
        return { ...md, neighbors: newNeighbors };
      }
      case "resonate": {
        const newCenter = md.center * (1 + Math.sin(stimulus));
        const newNeighbors = md.neighbors.map(
          (n, i) => n * (1 + Math.sin(stimulus + (i + 1) * Math.PI / md.neighbors.length))
        );
        return { ...md, center: newCenter, neighbors: newNeighbors };
      }
      default:
        return respondToStimulus(input, stimulus, "absorb");
    }
  }
  if (typeof input === "number") return input + stimulus;
  return input;
}
function computeSensitivity(input) {
  if (input !== null && typeof input === "object" && input.reiType === "MDim") {
    const original = computeMDim(input);
    const epsilon = 1e-3;
    const perturbed = respondToStimulus(input, epsilon, "absorb");
    const perturbedVal = computeMDim(perturbed);
    return Math.abs(perturbedVal - original) / epsilon;
  }
  if (typeof input === "number") return 1;
  return 0;
}
function computeAwareness(input, meta) {
  let score = 0;
  const maxScore = 5;
  score += Math.min(meta.memory.length / 5, 1);
  if (meta.tendency !== "rest") score += 1;
  score += Math.min(meta.pipeCount / 5, 1);
  const raw = unwrapReiVal(input);
  if (raw !== null && typeof raw === "object") {
    if (raw.reiType === "MDim" && raw.neighbors) {
      score += Math.min(raw.neighbors.length / 8, 1);
    } else if (raw.reiType === "Space") {
      score += 1;
    } else if (raw.reiType === "State" && raw.history) {
      score += Math.min(raw.history.length / 5, 1);
    }
  }
  if (meta.memory.length >= 2) {
    const unique = new Set(meta.memory.map((v) => JSON.stringify(v)));
    score += Math.min(unique.size / meta.memory.length, 1);
  }
  return Math.min(score / maxScore, 1);
}
var AWAKENING_THRESHOLD = 0.6;
function applyTransform(input, transformName, param) {
  const raw = unwrapReiVal(input);
  if (raw !== null && typeof raw === "object" && raw.reiType === "MDim") {
    const md = raw;
    switch (transformName) {
      case "scale": {
        return { ...md, center: md.center * param, neighbors: md.neighbors.map((n) => n * param) };
      }
      case "shift": {
        return { ...md, center: md.center + param, neighbors: md.neighbors.map((n) => n + param) };
      }
      case "rotate": {
        const n = md.neighbors.length;
        if (n === 0) return md;
        const shift = (param % n + n) % n;
        const rotated = [...md.neighbors.slice(shift), ...md.neighbors.slice(0, shift)];
        return { ...md, neighbors: rotated };
      }
      case "invert": {
        return { ...md, neighbors: md.neighbors.map((n) => 2 * md.center - n) };
      }
      case "normalize_to": {
        const total = Math.abs(md.center) + md.neighbors.reduce((s, v) => s + Math.abs(v), 0) || 1;
        const factor = param / total;
        return { ...md, center: md.center * factor, neighbors: md.neighbors.map((n) => n * factor) };
      }
      default:
        throw new Error(`\u672A\u77E5\u306E\u5909\u63DB: ${transformName}`);
    }
  }
  if (typeof raw === "number") {
    switch (transformName) {
      case "scale":
        return raw * param;
      case "shift":
        return raw + param;
      case "invert":
        return -raw;
      default:
        return raw;
    }
  }
  return raw;
}
function checkModeEquivalence(md, mode1, mode2) {
  if (!md || md.reiType !== "MDim") return { equivalent: false, reason: "non-MDim input" };
  const v1 = computeMDim({ ...md, mode: mode1 });
  const v2 = computeMDim({ ...md, mode: mode2 });
  return {
    reiType: "ModeEquivResult",
    mode1,
    mode2,
    type_equivalent: typeof v1 === typeof v2,
    // M2: 出力型が等価
    value1: v1,
    value2: v2,
    relative_diff: Math.abs(v2) > 0 ? Math.abs(v1 - v2) / Math.abs(v2) : v1 === v2 ? 0 : Infinity
  };
}
function computeResonance(a, b) {
  const aRaw = unwrapReiVal(a);
  const bRaw = unwrapReiVal(b);
  const aNum = typeof aRaw === "number" ? aRaw : aRaw?.center ?? 0;
  const bNum = typeof bRaw === "number" ? bRaw : bRaw?.center ?? 0;
  const aDim = aRaw?.neighbors?.length ?? 0;
  const bDim = bRaw?.neighbors?.length ?? 0;
  const dimMatch = aDim === 0 && bDim === 0 ? 1 : 1 - Math.abs(aDim - bDim) / Math.max(aDim, bDim, 1);
  const maxAbs = Math.max(Math.abs(aNum), Math.abs(bNum), 1);
  const valueProximity = 1 - Math.abs(aNum - bNum) / maxAbs;
  let patternSimilarity = 0;
  if (aDim > 0 && bDim > 0) {
    const minLen = Math.min(aDim, bDim);
    const aN = aRaw.neighbors.slice(0, minLen);
    const bN = bRaw.neighbors.slice(0, minLen);
    const dotProduct = aN.reduce((s, v, i) => s + v * bN[i], 0);
    const normA = Math.sqrt(aN.reduce((s, v) => s + v * v, 0)) || 1;
    const normB = Math.sqrt(bN.reduce((s, v) => s + v * v, 0)) || 1;
    patternSimilarity = dotProduct / (normA * normB);
  }
  const strength = dimMatch * 0.3 + Math.max(valueProximity, 0) * 0.3 + (patternSimilarity + 1) / 2 * 0.4;
  return {
    reiType: "ResonanceResult",
    strength: Math.max(0, Math.min(1, strength)),
    dimMatch,
    valueProximity: Math.max(0, valueProximity),
    patternSimilarity,
    resonates: strength >= 0.5
  };
}
function getResonanceField(input, meta) {
  const raw = unwrapReiVal(input);
  const isAwakened = computeAwareness(input, meta) >= AWAKENING_THRESHOLD;
  return {
    reiType: "ResonanceField",
    awakened: isAwakened,
    // 覚醒値はより広い共鳴場を持つ
    range: isAwakened ? "non-local" : "local",
    capacity: isAwakened ? 1 : 0.3,
    signature: raw?.neighbors?.length ?? 0
  };
}
function resonanceMap(input) {
  const raw = unwrapReiVal(input);
  if (!Array.isArray(raw)) {
    if (raw?.reiType === "MDim") {
      return raw.neighbors.map((n, i) => ({
        pair: [raw.center, n],
        index: i,
        strength: 1 - Math.abs(raw.center - n) / Math.max(Math.abs(raw.center), Math.abs(n), 1)
      }));
    }
    return [];
  }
  const results = [];
  for (let i = 0; i < raw.length; i++) {
    for (let j = i + 1; j < raw.length; j++) {
      const res = computeResonance(raw[i], raw[j]);
      results.push({ pair: [i, j], ...res });
    }
  }
  return results;
}
function resonanceChain(input) {
  const raw = unwrapReiVal(input);
  if (!raw || raw.reiType !== "MDim") {
    return { reiType: "ResonanceChain", chain: [], depth: 0 };
  }
  const chain = [];
  const visited = /* @__PURE__ */ new Set();
  function trace(value, depth) {
    if (visited.has(value) || depth > 5) return;
    visited.add(value);
    chain.push({ value, depth });
    for (const n of raw.neighbors) {
      if (!visited.has(n)) {
        const proximity = 1 - Math.abs(value - n) / Math.max(Math.abs(value), Math.abs(n), 1);
        if (proximity > 0.3) trace(n, depth + 1);
      }
    }
  }
  trace(raw.center, 0);
  return { reiType: "ResonanceChain", chain, depth: chain.length };
}
function projectAs(input, targetType) {
  const raw = unwrapReiVal(input);
  let md;
  if (raw?.reiType === "MDim") {
    md = raw;
  } else if (Array.isArray(raw)) {
    md = projectToMDim(raw, "first");
  } else if (typeof raw === "number") {
    const digits = String(Math.abs(Math.floor(raw))).split("").map(Number);
    md = { reiType: "MDim", center: digits[0], neighbors: digits.slice(1), mode: "weighted" };
  } else {
    md = { reiType: "MDim", center: 0, neighbors: [], mode: "weighted" };
  }
  switch (targetType) {
    case "graph": {
      const edges = md.neighbors.map((n, i) => ({
        from: md.center,
        to: n,
        weight: Math.abs(md.center - n)
      }));
      return {
        reiType: "GraphProjection",
        hub: md.center,
        nodes: [md.center, ...md.neighbors],
        edges,
        degree: md.neighbors.length
      };
    }
    case "series": {
      const series = [md.center, ...md.neighbors];
      const deltas = [];
      for (let i = 1; i < series.length; i++) deltas.push(series[i] - series[i - 1]);
      return {
        reiType: "SeriesProjection",
        values: series,
        deltas,
        trend: deltas.length > 0 ? deltas.reduce((a, b) => a + b, 0) / deltas.length > 0 ? "up" : "down" : "flat",
        length: series.length
      };
    }
    case "matrix": {
      const size = md.neighbors.length + 1;
      const row = [md.center, ...md.neighbors];
      return {
        reiType: "MatrixProjection",
        row,
        size,
        diagonal: md.center,
        trace: md.center
        // 1行分のtrace
      };
    }
    case "tree": {
      const children = md.neighbors.map((n, i) => ({
        value: n,
        depth: 1,
        index: i,
        leaf: true
      }));
      return {
        reiType: "TreeProjection",
        root: md.center,
        children,
        height: md.neighbors.length > 0 ? 1 : 0,
        leaves: md.neighbors.length
      };
    }
    default:
      throw new Error(`\u672A\u77E5\u306E\u5C04\u5F71\u578B: ${targetType}`);
  }
}
function composeProjections(input) {
  const raw = unwrapReiVal(input);
  if (!Array.isArray(raw)) {
    if (raw?.reiType === "MDim") {
      const allProj = projectAll(raw);
      const values = allProj.map((p) => computeMDim(p));
      const center = values.reduce((a, b) => a + b, 0) / values.length;
      return { reiType: "MDim", center, neighbors: values, mode: "weighted" };
    }
    return raw;
  }
  const projected = raw.map((item) => {
    if (item?.reiType === "MDim") return item;
    return projectToMDim(typeof item === "number" ? [item] : item, "first");
  });
  const centers = projected.map((p) => p.center);
  const avgCenter = centers.reduce((a, b) => a + b, 0) / centers.length;
  return { reiType: "MDim", center: avgCenter, neighbors: centers, mode: "weighted" };
}
function checkRepresentable(input) {
  const raw = unwrapReiVal(input);
  const result = { reiType: "RepresentableResult", representable: true, reason: "", lossless: true };
  if (raw === null || raw === void 0) {
    result.representable = true;
    result.reason = "null \u2192 \u{1D544}{0;}";
    result.lossless = true;
  } else if (typeof raw === "number") {
    result.representable = true;
    result.reason = "number \u2192 \u{1D544}{n;}";
    result.lossless = true;
  } else if (typeof raw === "string") {
    result.representable = true;
    result.reason = "string \u2192 \u{1D544}{charCode(center); charCodes(rest)}";
    result.lossless = true;
  } else if (typeof raw === "boolean") {
    result.representable = true;
    result.reason = "boolean \u2192 \u{1D544}{0|1;}";
    result.lossless = true;
  } else if (Array.isArray(raw)) {
    result.representable = true;
    result.reason = `array[${raw.length}] \u2192 \u{1D544}{first; rest}`;
    result.lossless = true;
  } else if (raw?.reiType === "MDim") {
    result.representable = true;
    result.reason = "already \u{1D544}";
    result.lossless = true;
  } else if (raw?.reiType === "Space") {
    result.representable = true;
    result.reason = "Space \u2192 nested \u{1D544} (U3 hierarchical)";
    result.lossless = true;
  } else if (raw?.reiType) {
    result.representable = true;
    result.reason = `${raw.reiType} \u2192 \u{1D544} via structural projection`;
    result.lossless = false;
  } else if (typeof raw === "object") {
    result.representable = true;
    result.reason = "object \u2192 \u{1D544}{keys; values}";
    result.lossless = false;
  } else {
    result.representable = false;
    result.reason = `unknown type: ${typeof raw}`;
    result.lossless = false;
  }
  return result;
}
function deriveMode(md, baseModes, weights) {
  if (!md || md.reiType !== "MDim") throw new Error("derive_mode: \u{1D544}\u578B\u304C\u5FC5\u8981\u3067\u3059");
  const results = baseModes.map((m) => computeMDim({ ...md, mode: m }));
  let derived = 0;
  let totalWeight = 0;
  for (let i = 0; i < results.length; i++) {
    const w = weights[i] ?? 1;
    derived += results[i] * w;
    totalWeight += w;
  }
  derived = totalWeight > 0 ? derived / totalWeight : 0;
  return {
    reiType: "DerivedModeResult",
    value: derived,
    baseModes,
    weights,
    formula: baseModes.map((m, i) => `${weights[i] ?? 1}\xD7${m}`).join(" + ")
  };
}
function getModeSpace(md) {
  if (!md || md.reiType !== "MDim") {
    return { reiType: "ModeSpace", modes: ALL_COMPUTE_MODES.length, values: [], coverage: 0 };
  }
  const values = ALL_COMPUTE_MODES.map((mode) => ({
    mode,
    value: computeMDim({ ...md, mode })
  }));
  const distances = [];
  for (let i = 0; i < values.length; i++) {
    distances[i] = [];
    for (let j = 0; j < values.length; j++) {
      distances[i][j] = Math.abs(values[i].value - values[j].value);
    }
  }
  const allVals = values.map((v) => v.value);
  const mean = allVals.reduce((a, b) => a + b, 0) / allVals.length;
  const variance = allVals.reduce((a, v) => a + (v - mean) ** 2, 0) / allVals.length;
  return {
    reiType: "ModeSpace",
    modes: ALL_COMPUTE_MODES.length,
    values,
    variance,
    diversity: Math.sqrt(variance),
    coverage: 1
    // 全モード利用可能
  };
}
function measureDepth(input) {
  const raw = unwrapReiVal(input);
  if (!raw || raw.reiType !== "MDim") return 0;
  let maxDepth = 0;
  if (raw.center !== null && typeof raw.center === "object" && raw.center.reiType === "MDim") {
    maxDepth = Math.max(maxDepth, 1 + measureDepth(raw.center));
  }
  if (raw.neighbors) {
    for (const n of raw.neighbors) {
      if (n !== null && typeof n === "object" && n.reiType === "MDim") {
        maxDepth = Math.max(maxDepth, 1 + measureDepth(n));
      }
    }
  }
  return maxDepth;
}
function nestMDim(input, levels = 1) {
  const raw = unwrapReiVal(input);
  if (!raw || raw.reiType !== "MDim") {
    const md = { reiType: "MDim", center: typeof raw === "number" ? raw : 0, neighbors: [], mode: "weighted" };
    return levels <= 1 ? md : nestMDim(md, levels - 1);
  }
  if (levels <= 0) return raw;
  const wrapped = {
    reiType: "MDim",
    center: raw,
    neighbors: [],
    mode: "weighted"
  };
  return levels <= 1 ? wrapped : nestMDim(wrapped, levels - 1);
}
function recursiveCompute(input) {
  const raw = unwrapReiVal(input);
  if (typeof raw === "number") return raw;
  if (!raw || raw.reiType !== "MDim") return 0;
  const centerVal = raw.center?.reiType === "MDim" ? recursiveCompute(raw.center) : typeof raw.center === "number" ? raw.center : 0;
  const neighborVals = (raw.neighbors || []).map(
    (n) => n?.reiType === "MDim" ? recursiveCompute(n) : typeof n === "number" ? n : 0
  );
  return computeMDim({
    reiType: "MDim",
    center: centerVal,
    neighbors: neighborVals,
    mode: raw.mode || "weighted"
  });
}
function structuralSimilarity(a, b) {
  const aRaw = unwrapReiVal(a);
  const bRaw = unwrapReiVal(b);
  const aDim = aRaw?.neighbors?.length ?? 0;
  const bDim = bRaw?.neighbors?.length ?? 0;
  const dimSim = aDim === 0 && bDim === 0 ? 1 : 1 - Math.abs(aDim - bDim) / Math.max(aDim, bDim, 1);
  const aCenter = typeof aRaw === "number" ? aRaw : aRaw?.center ?? 0;
  const bCenter = typeof bRaw === "number" ? bRaw : bRaw?.center ?? 0;
  const aRatios = (aRaw?.neighbors ?? []).map((n) => aCenter !== 0 ? n / aCenter : n);
  const bRatios = (bRaw?.neighbors ?? []).map((n) => bCenter !== 0 ? n / bCenter : n);
  let ratioSim = 0;
  if (aRatios.length > 0 && bRatios.length > 0) {
    const minLen = Math.min(aRatios.length, bRatios.length);
    let sumDiff = 0;
    for (let i = 0; i < minLen; i++) {
      sumDiff += Math.abs(aRatios[i] - bRatios[i]);
    }
    ratioSim = 1 / (1 + sumDiff / minLen);
  } else if (aRatios.length === 0 && bRatios.length === 0) {
    ratioSim = 1;
  }
  const modeSim = (aRaw?.mode ?? "weighted") === (bRaw?.mode ?? "weighted") ? 1 : 0.5;
  const similarity = dimSim * 0.4 + ratioSim * 0.4 + modeSim * 0.2;
  return {
    reiType: "SimilarityResult",
    similarity,
    dimSimilarity: dimSim,
    ratioSimilarity: ratioSim,
    modeSimilarity: modeSim,
    isomorphic: similarity > 0.9
  };
}
function bridgeMDim(a, b) {
  const sim = structuralSimilarity(a, b);
  const aRaw = unwrapReiVal(a);
  const bRaw = unwrapReiVal(b);
  const aCenter = typeof aRaw === "number" ? aRaw : aRaw?.center ?? 0;
  const bCenter = typeof bRaw === "number" ? bRaw : bRaw?.center ?? 0;
  const scaleFactor = aCenter !== 0 ? bCenter / aCenter : 1;
  return {
    reiType: "BridgeResult",
    similarity: sim.similarity,
    scaleFactor,
    mapping: {
      centerA: aCenter,
      centerB: bCenter,
      dimA: aRaw?.neighbors?.length ?? 0,
      dimB: bRaw?.neighbors?.length ?? 0
    },
    transferable: sim.similarity > 0.5
  };
}
function encodeMDim(input) {
  const raw = unwrapReiVal(input);
  if (raw?.reiType === "MDim") return raw;
  if (typeof raw === "number") {
    return { reiType: "MDim", center: raw, neighbors: [], mode: "weighted" };
  }
  if (typeof raw === "string") {
    const codes = Array.from(raw).map((c) => c.charCodeAt(0));
    if (codes.length === 0) return { reiType: "MDim", center: 0, neighbors: [], mode: "weighted" };
    return { reiType: "MDim", center: codes[0], neighbors: codes.slice(1), mode: "weighted" };
  }
  if (typeof raw === "boolean") {
    return { reiType: "MDim", center: raw ? 1 : 0, neighbors: [], mode: "weighted" };
  }
  if (raw === null || raw === void 0) {
    return { reiType: "MDim", center: 0, neighbors: [], mode: "weighted" };
  }
  if (Array.isArray(raw)) {
    const nums = raw.map((v) => typeof v === "number" ? v : 0);
    return { reiType: "MDim", center: nums[0] ?? 0, neighbors: nums.slice(1), mode: "weighted" };
  }
  if (typeof raw === "object") {
    const values = Object.values(raw).filter((v) => typeof v === "number");
    return { reiType: "MDim", center: values[0] ?? 0, neighbors: values.slice(1), mode: "weighted" };
  }
  return { reiType: "MDim", center: 0, neighbors: [], mode: "weighted" };
}
function decodeMDim(input, targetType) {
  const raw = unwrapReiVal(input);
  const md = raw?.reiType === "MDim" ? raw : encodeMDim(raw);
  switch (targetType) {
    case "number":
      return computeMDim(md);
    case "array":
      return [md.center, ...md.neighbors];
    case "string":
      return String.fromCharCode(md.center, ...md.neighbors);
    case "object":
      const obj = { center: md.center };
      md.neighbors.forEach((n, i) => {
        obj[`n${i}`] = n;
      });
      return obj;
    default:
      return [md.center, ...md.neighbors];
  }
}
function mapSolutions(md, transformName, param = 1) {
  const solutions = computeAll(md);
  return solutions.map((sol) => {
    let transformed;
    switch (transformName) {
      case "scale":
        transformed = sol.value * param;
        break;
      case "shift":
        transformed = sol.value + param;
        break;
      case "normalize": {
        const maxVal = Math.max(...solutions.map((s) => Math.abs(s.value)), 1);
        transformed = sol.value / maxVal;
        break;
      }
      case "rank_normalize": {
        const sorted = [...solutions].sort((a, b) => a.value - b.value);
        const rank = sorted.findIndex((s) => s.mode === sol.mode);
        transformed = (rank + 1) / solutions.length;
        break;
      }
      default:
        transformed = sol.value;
    }
    return { ...sol, original: sol.value, value: transformed, transform: transformName };
  });
}
function computeConsensus(md) {
  const solutions = computeAll(md);
  const values = solutions.map((s) => s.value);
  const sorted = [...values].sort((a, b) => a - b);
  const median = sorted.length % 2 === 0 ? (sorted[sorted.length / 2 - 1] + sorted[sorted.length / 2]) / 2 : sorted[Math.floor(sorted.length / 2)];
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const variance = values.reduce((a, v) => a + (v - mean) ** 2, 0) / values.length;
  const stddev = Math.sqrt(variance);
  const agreement = 1 / (1 + stddev / (Math.abs(mean) || 1));
  return {
    reiType: "ConsensusResult",
    median,
    mean,
    stddev,
    agreement,
    solutions: solutions.length,
    range: { min: sorted[0], max: sorted[sorted.length - 1] }
  };
}
function selectBest(md, criteria = "median_closest") {
  const solutions = computeAll(md);
  const values = solutions.map((s) => s.value);
  switch (criteria) {
    case "max":
      return solutions.reduce((best, s) => s.value > best.value ? s : best);
    case "min":
      return solutions.reduce((best, s) => s.value < best.value ? s : best);
    case "median_closest":
    default: {
      const sorted = [...values].sort((a, b) => a - b);
      const median = sorted.length % 2 === 0 ? (sorted[sorted.length / 2 - 1] + sorted[sorted.length / 2]) / 2 : sorted[Math.floor(sorted.length / 2)];
      return solutions.reduce(
        (best, s) => Math.abs(s.value - median) < Math.abs(best.value - median) ? s : best
      );
    }
  }
}
function rankSolutions(md, criteria = "value") {
  const solutions = computeAll(md);
  const sorted = [...solutions].sort((a, b) => {
    switch (criteria) {
      case "value":
        return b.value - a.value;
      // 降順
      case "abs":
        return Math.abs(b.value) - Math.abs(a.value);
      default:
        return b.value - a.value;
    }
  });
  return sorted.map((s, i) => ({ ...s, rank: i + 1 }));
}
function solutionCompleteness(md) {
  const solutions = computeAll(md);
  const values = solutions.map((s) => s.value);
  const uniqueValues = new Set(values.map((v) => Math.round(v * 1e6) / 1e6));
  const uniqueRatio = uniqueValues.size / values.length;
  const sorted = [...values].sort((a, b) => a - b);
  const range = sorted[sorted.length - 1] - sorted[0];
  const bins = 4;
  const binWidth = range / bins || 1;
  const histogram = new Array(bins).fill(0);
  for (const v of values) {
    const bin = Math.min(Math.floor((v - sorted[0]) / binWidth), bins - 1);
    histogram[bin]++;
  }
  const total = values.length;
  let entropy = 0;
  for (const count of histogram) {
    if (count > 0) {
      const p = count / total;
      entropy -= p * Math.log2(p);
    }
  }
  const maxEntropy = Math.log2(bins);
  const uniformity = maxEntropy > 0 ? entropy / maxEntropy : 1;
  return {
    reiType: "CompletenessResult",
    totalModes: solutions.length,
    uniqueSolutions: uniqueValues.size,
    uniqueRatio,
    range,
    uniformity,
    completeness: uniqueRatio * 0.5 + uniformity * 0.5,
    isComplete: uniqueRatio > 0.5 && uniformity > 0.3
  };
}
function evolveMode(input, meta, strategy = "auto") {
  const raw = unwrapReiVal(input);
  let md;
  if (raw?.reiType === "MDim") {
    md = raw;
  } else if (Array.isArray(raw)) {
    md = projectToMDim(raw, "first");
  } else if (typeof raw === "number") {
    md = { reiType: "MDim", center: raw, neighbors: [], mode: "weighted" };
  } else {
    md = { reiType: "MDim", center: 0, neighbors: [], mode: "weighted" };
  }
  const candidates = ALL_COMPUTE_MODES.map((mode) => ({
    mode,
    value: computeMDim({ ...md, mode })
  }));
  const awareness = computeAwareness(input, meta);
  const tendency = meta.tendency;
  let selected;
  let reason;
  switch (strategy) {
    case "stable":
      selected = selectStable(candidates, meta);
      reason = selectStableReason(selected, candidates, meta);
      break;
    case "divergent":
      selected = selectDivergent(candidates);
      reason = `\u6700\u3082\u4ED6\u306E\u30E2\u30FC\u30C9\u3068\u7570\u306A\u308B\u7D50\u679C\u3092\u51FA\u3059\u30E2\u30FC\u30C9\uFF08\u504F\u5DEE: ${calcDeviation(selected.value, candidates).toFixed(4)}\uFF09`;
      break;
    case "creative":
      selected = selectCreative(candidates);
      reason = `\u4E2D\u592E\u5024\u304B\u3089\u6700\u3082\u9060\u3044\u7D50\u679C\uFF08\u8DDD\u96E2: ${calcMedianDistance(selected.value, candidates).toFixed(4)}\uFF09`;
      break;
    case "tendency":
      selected = selectByTendency(candidates, tendency, md);
      reason = `\u03C4\u306E\u50BE\u5411\u6027\u300C${tendency}\u300D\u3068\u6574\u5408\u3059\u308B\u30E2\u30FC\u30C9`;
      break;
    case "auto":
    default:
      ({ selected, reason } = selectAuto(candidates, meta, awareness, md));
      strategy = "auto";
      break;
  }
  return {
    reiType: "EvolveResult",
    value: selected.value,
    selectedMode: selected.mode,
    strategy,
    reason,
    candidates,
    awareness,
    tendency
  };
}
function selectStable(candidates, meta) {
  if (meta.memory.length === 0) {
    const mean = candidates.reduce((s, c) => s + c.value, 0) / candidates.length;
    return candidates.reduce(
      (best, c) => Math.abs(c.value - mean) < Math.abs(best.value - mean) ? c : best
    );
  }
  const recentValues = meta.memory.slice(-5).map(toNumSafe);
  const recentMean = recentValues.reduce((s, v) => s + v, 0) / recentValues.length;
  return candidates.reduce(
    (best, c) => Math.abs(c.value - recentMean) < Math.abs(best.value - recentMean) ? c : best
  );
}
function selectStableReason(selected, candidates, meta) {
  if (meta.memory.length === 0) {
    return `\u5168\u30E2\u30FC\u30C9\u306E\u5E73\u5747\u306B\u6700\u3082\u8FD1\u3044\u7D50\u679C\uFF08\u6765\u6B74\u306A\u3057\u3001\u521D\u56DE\u9078\u629E\uFF09`;
  }
  return `\u904E\u53BB${meta.memory.length}\u56DE\u306E\u6765\u6B74\u306E\u50BE\u5411\u306B\u6700\u3082\u6574\u5408\uFF08\u5B89\u5B9A\u6027\u512A\u5148\uFF09`;
}
function selectDivergent(candidates) {
  return candidates.reduce(
    (best, c) => calcDeviation(c.value, candidates) > calcDeviation(best.value, candidates) ? c : best
  );
}
function selectCreative(candidates) {
  return candidates.reduce(
    (best, c) => calcMedianDistance(c.value, candidates) > calcMedianDistance(best.value, candidates) ? c : best
  );
}
function selectByTendency(candidates, tendency, md) {
  const baseValue = computeMDim({ ...md, mode: "weighted" });
  switch (tendency) {
    case "expand": {
      return candidates.reduce((best, c) => c.value > best.value ? c : best);
    }
    case "contract": {
      return candidates.reduce(
        (best, c) => Math.abs(c.value - md.center) < Math.abs(best.value - md.center) ? c : best
      );
    }
    case "spiral": {
      const sorted = [...candidates].sort(
        (a, b) => Math.abs(a.value - baseValue) - Math.abs(b.value - baseValue)
      );
      const midIdx = Math.floor(sorted.length / 2);
      return sorted[midIdx];
    }
    default: {
      return candidates.find((c) => c.mode === "weighted") ?? candidates[0];
    }
  }
}
function selectAuto(candidates, meta, awareness, md) {
  if (awareness < 0.3) {
    const selected2 = selectStable(candidates, meta);
    return {
      selected: selected2,
      reason: `\u899A\u9192\u5EA6\u304C\u4F4E\u3044\uFF08${awareness.toFixed(2)}\uFF09\u305F\u3081\u5B89\u5B9A\u30E2\u30FC\u30C9\u3092\u9078\u629E`
    };
  }
  if (awareness >= AWAKENING_THRESHOLD) {
    const selected2 = selectByTendency(candidates, meta.tendency, md);
    return {
      selected: selected2,
      reason: `\u899A\u9192\u72B6\u614B\uFF08${awareness.toFixed(2)}\uFF09: \u50BE\u5411\u6027\u300C${meta.tendency}\u300D\u306B\u57FA\u3065\u304D\u9078\u629E`
    };
  }
  if (meta.memory.length >= 3) {
    const recentValues = meta.memory.slice(-3).map(toNumSafe);
    const trend = recentValues[recentValues.length - 1] - recentValues[0];
    if (trend > 0) {
      const selected2 = candidates.reduce((best, c) => c.value > best.value ? c : best);
      return { selected: selected2, reason: `\u6765\u6B74\u304B\u3089\u5897\u52A0\u50BE\u5411\u3092\u691C\u51FA \u2192 \u6700\u5927\u5024\u30E2\u30FC\u30C9\u3092\u9078\u629E` };
    } else if (trend < 0) {
      const selected2 = candidates.reduce(
        (best, c) => Math.abs(c.value - md.center) < Math.abs(best.value - md.center) ? c : best
      );
      return { selected: selected2, reason: `\u6765\u6B74\u304B\u3089\u6E1B\u5C11\u50BE\u5411\u3092\u691C\u51FA \u2192 \u4E2D\u5FC3\u53CE\u675F\u30E2\u30FC\u30C9\u3092\u9078\u629E` };
    }
  }
  const selected = candidates.find((c) => c.mode === "entropy") ?? candidates[0];
  return {
    selected,
    reason: `\u4E2D\u9593\u899A\u9192\u5EA6\uFF08${awareness.toFixed(2)}\uFF09: \u60C5\u5831\u30A8\u30F3\u30C8\u30ED\u30D4\u30FC\u30E2\u30FC\u30C9\u3067\u63A2\u7D22`
  };
}
function calcDeviation(value, candidates) {
  const mean = candidates.reduce((s, c) => s + c.value, 0) / candidates.length;
  return Math.abs(value - mean);
}
function calcMedianDistance(value, candidates) {
  const sorted = [...candidates].map((c) => c.value).sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  const median = sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
  return Math.abs(value - median);
}
var KANJI_DB = {
  // ═══ 象形（しょうけい）— 物の形を象る ═══
  "\u65E5": { components: [], radical: "\u65E5", radicalName: "\u306B\u3061", strokes: 4, on: ["\u30CB\u30C1", "\u30B8\u30C4"], kun: ["\u3072", "\u304B"], category: "\u8C61\u5F62", meaning: "sun/day" },
  "\u6708": { components: [], radical: "\u6708", radicalName: "\u3064\u304D", strokes: 4, on: ["\u30B2\u30C4", "\u30AC\u30C4"], kun: ["\u3064\u304D"], category: "\u8C61\u5F62", meaning: "moon/month" },
  "\u5C71": { components: [], radical: "\u5C71", radicalName: "\u3084\u307E", strokes: 3, on: ["\u30B5\u30F3", "\u30BB\u30F3"], kun: ["\u3084\u307E"], category: "\u8C61\u5F62", meaning: "mountain" },
  "\u5DDD": { components: [], radical: "\u5DDD", radicalName: "\u304B\u308F", strokes: 3, on: ["\u30BB\u30F3"], kun: ["\u304B\u308F"], category: "\u8C61\u5F62", meaning: "river" },
  "\u6C34": { components: [], radical: "\u6C34", radicalName: "\u307F\u305A", strokes: 4, on: ["\u30B9\u30A4"], kun: ["\u307F\u305A"], category: "\u8C61\u5F62", meaning: "water" },
  "\u706B": { components: [], radical: "\u706B", radicalName: "\u3072", strokes: 4, on: ["\u30AB"], kun: ["\u3072", "\u307B"], category: "\u8C61\u5F62", meaning: "fire" },
  "\u6728": { components: [], radical: "\u6728", radicalName: "\u304D", strokes: 4, on: ["\u30E2\u30AF", "\u30DC\u30AF"], kun: ["\u304D", "\u3053"], category: "\u8C61\u5F62", meaning: "tree/wood" },
  "\u91D1": { components: [], radical: "\u91D1", radicalName: "\u304B\u306D", strokes: 8, on: ["\u30AD\u30F3", "\u30B3\u30F3"], kun: ["\u304B\u306D", "\u304B\u306A"], category: "\u8C61\u5F62", meaning: "gold/metal" },
  "\u571F": { components: [], radical: "\u571F", radicalName: "\u3064\u3061", strokes: 3, on: ["\u30C9", "\u30C8"], kun: ["\u3064\u3061"], category: "\u8C61\u5F62", meaning: "earth/soil" },
  "\u4EBA": { components: [], radical: "\u4EBA", radicalName: "\u3072\u3068", strokes: 2, on: ["\u30B8\u30F3", "\u30CB\u30F3"], kun: ["\u3072\u3068"], category: "\u8C61\u5F62", meaning: "person" },
  "\u53E3": { components: [], radical: "\u53E3", radicalName: "\u304F\u3061", strokes: 3, on: ["\u30B3\u30A6", "\u30AF"], kun: ["\u304F\u3061"], category: "\u8C61\u5F62", meaning: "mouth" },
  "\u76EE": { components: [], radical: "\u76EE", radicalName: "\u3081", strokes: 5, on: ["\u30E2\u30AF", "\u30DC\u30AF"], kun: ["\u3081", "\u307E"], category: "\u8C61\u5F62", meaning: "eye" },
  "\u624B": { components: [], radical: "\u624B", radicalName: "\u3066", strokes: 4, on: ["\u30B7\u30E5"], kun: ["\u3066", "\u305F"], category: "\u8C61\u5F62", meaning: "hand" },
  "\u8033": { components: [], radical: "\u8033", radicalName: "\u307F\u307F", strokes: 6, on: ["\u30B8"], kun: ["\u307F\u307F"], category: "\u8C61\u5F62", meaning: "ear" },
  "\u8DB3": { components: [], radical: "\u8DB3", radicalName: "\u3042\u3057", strokes: 7, on: ["\u30BD\u30AF"], kun: ["\u3042\u3057", "\u305F"], category: "\u8C61\u5F62", meaning: "foot/leg" },
  "\u5973": { components: [], radical: "\u5973", radicalName: "\u304A\u3093\u306A", strokes: 3, on: ["\u30B8\u30E7", "\u30CB\u30E7"], kun: ["\u304A\u3093\u306A", "\u3081"], category: "\u8C61\u5F62", meaning: "woman" },
  "\u5B50": { components: [], radical: "\u5B50", radicalName: "\u3053", strokes: 3, on: ["\u30B7", "\u30B9"], kun: ["\u3053"], category: "\u8C61\u5F62", meaning: "child" },
  "\u7530": { components: [], radical: "\u7530", radicalName: "\u305F", strokes: 5, on: ["\u30C7\u30F3"], kun: ["\u305F"], category: "\u8C61\u5F62", meaning: "rice field" },
  "\u8C9D": { components: [], radical: "\u8C9D", radicalName: "\u304B\u3044", strokes: 7, on: ["\u30D0\u30A4"], kun: ["\u304B\u3044"], category: "\u8C61\u5F62", meaning: "shell" },
  "\u8ECA": { components: [], radical: "\u8ECA", radicalName: "\u304F\u308B\u307E", strokes: 7, on: ["\u30B7\u30E3"], kun: ["\u304F\u308B\u307E"], category: "\u8C61\u5F62", meaning: "vehicle" },
  "\u99AC": { components: [], radical: "\u99AC", radicalName: "\u3046\u307E", strokes: 10, on: ["\u30D0"], kun: ["\u3046\u307E", "\u307E"], category: "\u8C61\u5F62", meaning: "horse" },
  "\u9B5A": { components: [], radical: "\u9B5A", radicalName: "\u3046\u304A", strokes: 11, on: ["\u30AE\u30E7"], kun: ["\u3046\u304A", "\u3055\u304B\u306A"], category: "\u8C61\u5F62", meaning: "fish" },
  "\u9CE5": { components: [], radical: "\u9CE5", radicalName: "\u3068\u308A", strokes: 11, on: ["\u30C1\u30E7\u30A6"], kun: ["\u3068\u308A"], category: "\u8C61\u5F62", meaning: "bird" },
  "\u96E8": { components: [], radical: "\u96E8", radicalName: "\u3042\u3081", strokes: 8, on: ["\u30A6"], kun: ["\u3042\u3081", "\u3042\u307E"], category: "\u8C61\u5F62", meaning: "rain" },
  "\u77F3": { components: [], radical: "\u77F3", radicalName: "\u3044\u3057", strokes: 5, on: ["\u30BB\u30AD", "\u30B7\u30E3\u30AF"], kun: ["\u3044\u3057"], category: "\u8C61\u5F62", meaning: "stone" },
  "\u7AF9": { components: [], radical: "\u7AF9", radicalName: "\u305F\u3051", strokes: 6, on: ["\u30C1\u30AF"], kun: ["\u305F\u3051"], category: "\u8C61\u5F62", meaning: "bamboo" },
  "\u7CF8": { components: [], radical: "\u7CF8", radicalName: "\u3044\u3068", strokes: 6, on: ["\u30B7"], kun: ["\u3044\u3068"], category: "\u8C61\u5F62", meaning: "thread" },
  "\u7C73": { components: [], radical: "\u7C73", radicalName: "\u3053\u3081", strokes: 6, on: ["\u30D9\u30A4", "\u30DE\u30A4"], kun: ["\u3053\u3081"], category: "\u8C61\u5F62", meaning: "rice" },
  "\u866B": { components: [], radical: "\u866B", radicalName: "\u3080\u3057", strokes: 6, on: ["\u30C1\u30E5\u30A6"], kun: ["\u3080\u3057"], category: "\u8C61\u5F62", meaning: "insect" },
  "\u72AC": { components: [], radical: "\u72AC", radicalName: "\u3044\u306C", strokes: 4, on: ["\u30B1\u30F3"], kun: ["\u3044\u306C"], category: "\u8C61\u5F62", meaning: "dog" },
  "\u529B": { components: [], radical: "\u529B", radicalName: "\u3061\u304B\u3089", strokes: 2, on: ["\u30EA\u30AD", "\u30EA\u30E7\u30AF"], kun: ["\u3061\u304B\u3089"], category: "\u8C61\u5F62", meaning: "power" },
  "\u5200": { components: [], radical: "\u5200", radicalName: "\u304B\u305F\u306A", strokes: 2, on: ["\u30C8\u30A6"], kun: ["\u304B\u305F\u306A"], category: "\u8C61\u5F62", meaning: "sword" },
  "\u9580": { components: [], radical: "\u9580", radicalName: "\u3082\u3093", strokes: 8, on: ["\u30E2\u30F3"], kun: ["\u304B\u3069"], category: "\u8C61\u5F62", meaning: "gate" },
  "\u5FC3": { components: [], radical: "\u5FC3", radicalName: "\u3053\u3053\u308D", strokes: 4, on: ["\u30B7\u30F3"], kun: ["\u3053\u3053\u308D"], category: "\u8C61\u5F62", meaning: "heart/mind" },
  // ═══ 指事（しじ）— 抽象概念を記号で示す ═══
  "\u4E00": { components: [], radical: "\u4E00", radicalName: "\u3044\u3061", strokes: 1, on: ["\u30A4\u30C1", "\u30A4\u30C4"], kun: ["\u3072\u3068"], category: "\u6307\u4E8B", meaning: "one" },
  "\u4E8C": { components: [], radical: "\u4E8C", radicalName: "\u306B", strokes: 2, on: ["\u30CB"], kun: ["\u3075\u305F"], category: "\u6307\u4E8B", meaning: "two" },
  "\u4E09": { components: [], radical: "\u4E00", radicalName: "\u3044\u3061", strokes: 3, on: ["\u30B5\u30F3"], kun: ["\u307F", "\u307F\u3063"], category: "\u6307\u4E8B", meaning: "three" },
  "\u4E0A": { components: [], radical: "\u4E00", radicalName: "\u3044\u3061", strokes: 3, on: ["\u30B8\u30E7\u30A6", "\u30B7\u30E7\u30A6"], kun: ["\u3046\u3048", "\u3042"], category: "\u6307\u4E8B", meaning: "above" },
  "\u4E0B": { components: [], radical: "\u4E00", radicalName: "\u3044\u3061", strokes: 3, on: ["\u30AB", "\u30B2"], kun: ["\u3057\u305F", "\u3055", "\u304F\u3060"], category: "\u6307\u4E8B", meaning: "below" },
  "\u672C": { components: ["\u6728", "\u4E00"], radical: "\u6728", radicalName: "\u304D", strokes: 5, on: ["\u30DB\u30F3"], kun: ["\u3082\u3068"], category: "\u6307\u4E8B", meaning: "origin/book" },
  "\u672B": { components: ["\u6728", "\u4E00"], radical: "\u6728", radicalName: "\u304D", strokes: 5, on: ["\u30DE\u30C4", "\u30D0\u30C4"], kun: ["\u3059\u3048"], category: "\u6307\u4E8B", meaning: "end/tip" },
  "\u4E2D": { components: ["\u53E3", "\u4E28"], radical: "\u4E28", radicalName: "\u307C\u3046", strokes: 4, on: ["\u30C1\u30E5\u30A6"], kun: ["\u306A\u304B"], category: "\u6307\u4E8B", meaning: "center/middle" },
  "\u5929": { components: ["\u4E00", "\u5927"], radical: "\u5927", radicalName: "\u3060\u3044", strokes: 4, on: ["\u30C6\u30F3"], kun: ["\u3042\u3081", "\u3042\u307E"], category: "\u6307\u4E8B", meaning: "heaven/sky" },
  // ═══ 会意（かいい）— 2つ以上の字を合わせて意味を作る ═══
  "\u4F11": { components: ["\u4EBA", "\u6728"], radical: "\u4EBA", radicalName: "\u306B\u3093\u3079\u3093", strokes: 6, on: ["\u30AD\u30E5\u30A6"], kun: ["\u3084\u3059"], category: "\u4F1A\u610F", meaning: "rest" },
  "\u660E": { components: ["\u65E5", "\u6708"], radical: "\u65E5", radicalName: "\u306B\u3061", strokes: 8, on: ["\u30E1\u30A4", "\u30DF\u30E7\u30A6"], kun: ["\u3042\u304B", "\u3042\u304D"], category: "\u4F1A\u610F", meaning: "bright" },
  "\u68EE": { components: ["\u6728", "\u6728", "\u6728"], radical: "\u6728", radicalName: "\u304D", strokes: 12, on: ["\u30B7\u30F3"], kun: ["\u3082\u308A"], category: "\u4F1A\u610F", meaning: "forest" },
  "\u6797": { components: ["\u6728", "\u6728"], radical: "\u6728", radicalName: "\u304D", strokes: 8, on: ["\u30EA\u30F3"], kun: ["\u306F\u3084\u3057"], category: "\u4F1A\u610F", meaning: "grove" },
  "\u7537": { components: ["\u7530", "\u529B"], radical: "\u7530", radicalName: "\u305F", strokes: 7, on: ["\u30C0\u30F3", "\u30CA\u30F3"], kun: ["\u304A\u3068\u3053"], category: "\u4F1A\u610F", meaning: "man" },
  "\u597D": { components: ["\u5973", "\u5B50"], radical: "\u5973", radicalName: "\u304A\u3093\u306A", strokes: 6, on: ["\u30B3\u30A6"], kun: ["\u3059", "\u3053\u306E", "\u3088"], category: "\u4F1A\u610F", meaning: "like/good" },
  "\u4FE1": { components: ["\u4EBA", "\u8A00"], radical: "\u4EBA", radicalName: "\u306B\u3093\u3079\u3093", strokes: 9, on: ["\u30B7\u30F3"], kun: [""], category: "\u4F1A\u610F", meaning: "trust/believe" },
  "\u708E": { components: ["\u706B", "\u706B"], radical: "\u706B", radicalName: "\u3072", strokes: 8, on: ["\u30A8\u30F3"], kun: ["\u307B\u306E\u304A"], category: "\u4F1A\u610F", meaning: "flame" },
  "\u5CA9": { components: ["\u5C71", "\u77F3"], radical: "\u5C71", radicalName: "\u3084\u307E", strokes: 8, on: ["\u30AC\u30F3"], kun: ["\u3044\u308F"], category: "\u4F1A\u610F", meaning: "rock" },
  "\u82B1": { components: ["\u8349", "\u5316"], radical: "\u8349", radicalName: "\u304F\u3055\u304B\u3093\u3080\u308A", strokes: 7, on: ["\u30AB"], kun: ["\u306F\u306A"], category: "\u4F1A\u610F", meaning: "flower" },
  "\u8349": { components: ["\u8349\u51A0", "\u65E9"], radical: "\u8349", radicalName: "\u304F\u3055\u304B\u3093\u3080\u308A", strokes: 9, on: ["\u30BD\u30A6"], kun: ["\u304F\u3055"], category: "\u4F1A\u610F", meaning: "grass" },
  "\u9CF4": { components: ["\u53E3", "\u9CE5"], radical: "\u9CE5", radicalName: "\u3068\u308A", strokes: 14, on: ["\u30E1\u30A4"], kun: ["\u306A"], category: "\u4F1A\u610F", meaning: "cry/chirp" },
  "\u7551": { components: ["\u706B", "\u7530"], radical: "\u7530", radicalName: "\u305F", strokes: 9, on: [], kun: ["\u306F\u305F", "\u306F\u305F\u3051"], category: "\u4F1A\u610F", meaning: "field (cultivated)" },
  "\u5CE0": { components: ["\u5C71", "\u4E0A", "\u4E0B"], radical: "\u5C71", radicalName: "\u3084\u307E", strokes: 9, on: [], kun: ["\u3068\u3046\u3052"], category: "\u4F1A\u610F", meaning: "mountain pass" },
  "\u96F7": { components: ["\u96E8", "\u7530"], radical: "\u96E8", radicalName: "\u3042\u3081", strokes: 13, on: ["\u30E9\u30A4"], kun: ["\u304B\u307F\u306A\u308A"], category: "\u4F1A\u610F", meaning: "thunder" },
  "\u770B": { components: ["\u624B", "\u76EE"], radical: "\u76EE", radicalName: "\u3081", strokes: 9, on: ["\u30AB\u30F3"], kun: ["\u307F"], category: "\u4F1A\u610F", meaning: "watch/look" },
  "\u601D": { components: ["\u7530", "\u5FC3"], radical: "\u5FC3", radicalName: "\u3053\u3053\u308D", strokes: 9, on: ["\u30B7"], kun: ["\u304A\u3082"], category: "\u4F1A\u610F", meaning: "think" },
  "\u5FCD": { components: ["\u5200", "\u5FC3"], radical: "\u5FC3", radicalName: "\u3053\u3053\u308D", strokes: 7, on: ["\u30CB\u30F3"], kun: ["\u3057\u306E"], category: "\u4F1A\u610F", meaning: "endure/ninja" },
  "\u6B66": { components: ["\u6B62", "\u6208"], radical: "\u6B62", radicalName: "\u3068\u3081\u308B", strokes: 8, on: ["\u30D6", "\u30E0"], kun: ["\u305F\u3051"], category: "\u4F1A\u610F", meaning: "martial" },
  "\u53CB": { components: ["\u53C8", "\u53C8"], radical: "\u53C8", radicalName: "\u307E\u305F", strokes: 4, on: ["\u30E6\u30A6"], kun: ["\u3068\u3082"], category: "\u4F1A\u610F", meaning: "friend" },
  "\u5149": { components: ["\u706B", "\u513F"], radical: "\u513F", radicalName: "\u306B\u3093\u306B\u3087\u3046", strokes: 6, on: ["\u30B3\u30A6"], kun: ["\u3072\u304B", "\u3072\u304B\u308A"], category: "\u4F1A\u610F", meaning: "light" },
  "\u7A7A": { components: ["\u7A74", "\u5DE5"], radical: "\u7A74", radicalName: "\u3042\u306A", strokes: 8, on: ["\u30AF\u30A6"], kun: ["\u305D\u3089", "\u3042", "\u304B\u3089"], category: "\u4F1A\u610F", meaning: "sky/empty" },
  "\u6D77": { components: ["\u6C34", "\u6BCE"], radical: "\u6C34", radicalName: "\u3055\u3093\u305A\u3044", strokes: 9, on: ["\u30AB\u30A4"], kun: ["\u3046\u307F"], category: "\u4F1A\u610F", meaning: "sea" },
  "\u9053": { components: ["\u9996", "\u8FB6"], radical: "\u8FB6", radicalName: "\u3057\u3093\u306B\u3087\u3046", strokes: 12, on: ["\u30C9\u30A6", "\u30C8\u30A6"], kun: ["\u307F\u3061"], category: "\u4F1A\u610F", meaning: "way/path" },
  "\u548C": { components: ["\u79BE", "\u53E3"], radical: "\u53E3", radicalName: "\u304F\u3061", strokes: 8, on: ["\u30EF"], kun: ["\u3084\u308F", "\u306A\u3054"], category: "\u4F1A\u610F", meaning: "harmony/Japan" },
  "\u7F8E": { components: ["\u7F8A", "\u5927"], radical: "\u7F8A", radicalName: "\u3072\u3064\u3058", strokes: 9, on: ["\u30D3"], kun: ["\u3046\u3064\u304F"], category: "\u4F1A\u610F", meaning: "beauty" },
  "\u611B": { components: ["\u722A", "\u5196", "\u5FC3", "\u5902"], radical: "\u5FC3", radicalName: "\u3053\u3053\u308D", strokes: 13, on: ["\u30A2\u30A4"], kun: [""], category: "\u4F1A\u610F", meaning: "love" },
  "\u5922": { components: ["\u8349", "\u7F52", "\u5196", "\u5915"], radical: "\u5915", radicalName: "\u3086\u3046\u3079", strokes: 13, on: ["\u30E0", "\u30DC\u30A6"], kun: ["\u3086\u3081"], category: "\u4F1A\u610F", meaning: "dream" },
  "\u98A8": { components: ["\u51E0", "\u866B"], radical: "\u98A8", radicalName: "\u304B\u305C", strokes: 9, on: ["\u30D5\u30A6", "\u30D5"], kun: ["\u304B\u305C", "\u304B\u3056"], category: "\u4F1A\u610F", meaning: "wind" },
  "\u96EA": { components: ["\u96E8", "\u30E8"], radical: "\u96E8", radicalName: "\u3042\u3081", strokes: 11, on: ["\u30BB\u30C4"], kun: ["\u3086\u304D"], category: "\u4F1A\u610F", meaning: "snow" },
  "\u96F2": { components: ["\u96E8", "\u4E91"], radical: "\u96E8", radicalName: "\u3042\u3081", strokes: 12, on: ["\u30A6\u30F3"], kun: ["\u304F\u3082"], category: "\u4F1A\u610F", meaning: "cloud" },
  "\u661F": { components: ["\u65E5", "\u751F"], radical: "\u65E5", radicalName: "\u306B\u3061", strokes: 9, on: ["\u30BB\u30A4", "\u30B7\u30E7\u30A6"], kun: ["\u307B\u3057"], category: "\u4F1A\u610F", meaning: "star" },
  "\u56FD": { components: ["\u56D7", "\u7389"], radical: "\u56D7", radicalName: "\u304F\u306B\u304C\u307E\u3048", strokes: 8, on: ["\u30B3\u30AF"], kun: ["\u304F\u306B"], category: "\u4F1A\u610F", meaning: "country" },
  "\u8A9E": { components: ["\u8A00", "\u4E94", "\u53E3"], radical: "\u8A00", radicalName: "\u3054\u3093\u3079\u3093", strokes: 14, on: ["\u30B4"], kun: ["\u304B\u305F"], category: "\u4F1A\u610F", meaning: "language/word" },
  "\u8A71": { components: ["\u8A00", "\u820C"], radical: "\u8A00", radicalName: "\u3054\u3093\u3079\u3093", strokes: 13, on: ["\u30EF"], kun: ["\u306F\u306A\u3057", "\u306F\u306A"], category: "\u4F1A\u610F", meaning: "talk/story" },
  "\u8AAD": { components: ["\u8A00", "\u58F2"], radical: "\u8A00", radicalName: "\u3054\u3093\u3079\u3093", strokes: 14, on: ["\u30C9\u30AF", "\u30C8\u30AF", "\u30C8\u30A6"], kun: ["\u3088"], category: "\u5F62\u58F0", meaning: "read" },
  "\u66F8": { components: ["\u807F", "\u65E5"], radical: "\u65E5", radicalName: "\u306B\u3061", strokes: 10, on: ["\u30B7\u30E7"], kun: ["\u304B"], category: "\u4F1A\u610F", meaning: "write/book" },
  "\u751F": { components: [], radical: "\u751F", radicalName: "\u305B\u3044", strokes: 5, on: ["\u30BB\u30A4", "\u30B7\u30E7\u30A6"], kun: ["\u3044", "\u3046", "\u306F", "\u304D", "\u306A\u307E"], category: "\u8C61\u5F62", meaning: "life/birth" },
  "\u5927": { components: [], radical: "\u5927", radicalName: "\u3060\u3044", strokes: 3, on: ["\u30C0\u30A4", "\u30BF\u30A4"], kun: ["\u304A\u304A", "\u304A\u304A\u304D"], category: "\u8C61\u5F62", meaning: "big" },
  "\u5C0F": { components: [], radical: "\u5C0F", radicalName: "\u3057\u3087\u3046", strokes: 3, on: ["\u30B7\u30E7\u30A6"], kun: ["\u3061\u3044", "\u3053", "\u304A"], category: "\u8C61\u5F62", meaning: "small" },
  "\u767D": { components: [], radical: "\u767D", radicalName: "\u3057\u308D", strokes: 5, on: ["\u30CF\u30AF", "\u30D3\u30E3\u30AF"], kun: ["\u3057\u308D", "\u3057\u3089"], category: "\u8C61\u5F62", meaning: "white" },
  "\u8D64": { components: ["\u571F", "\u706B"], radical: "\u8D64", radicalName: "\u3042\u304B", strokes: 7, on: ["\u30BB\u30AD", "\u30B7\u30E3\u30AF"], kun: ["\u3042\u304B"], category: "\u4F1A\u610F", meaning: "red" },
  "\u9752": { components: ["\u751F", "\u6708"], radical: "\u9752", radicalName: "\u3042\u304A", strokes: 8, on: ["\u30BB\u30A4", "\u30B7\u30E7\u30A6"], kun: ["\u3042\u304A"], category: "\u4F1A\u610F", meaning: "blue/green" },
  "\u9ED2": { components: ["\u91CC", "\u706C"], radical: "\u9ED2", radicalName: "\u304F\u308D", strokes: 11, on: ["\u30B3\u30AF"], kun: ["\u304F\u308D"], category: "\u4F1A\u610F", meaning: "black" },
  // ═══ 形声（けいせい）— 意符と音符の組み合わせ ═══
  "\u6674": { components: ["\u65E5", "\u9752"], radical: "\u65E5", radicalName: "\u306B\u3061", strokes: 12, on: ["\u30BB\u30A4"], kun: ["\u306F"], category: "\u5F62\u58F0", meaning: "clear weather" },
  "\u6E05": { components: ["\u6C34", "\u9752"], radical: "\u6C34", radicalName: "\u3055\u3093\u305A\u3044", strokes: 11, on: ["\u30BB\u30A4", "\u30B7\u30E7\u30A6"], kun: ["\u304D\u3088"], category: "\u5F62\u58F0", meaning: "pure/clean" },
  "\u8ACB": { components: ["\u8A00", "\u9752"], radical: "\u8A00", radicalName: "\u3054\u3093\u3079\u3093", strokes: 15, on: ["\u30BB\u30A4", "\u30B7\u30F3"], kun: ["\u3053", "\u3046"], category: "\u5F62\u58F0", meaning: "request" },
  "\u60C5": { components: ["\u5FC3", "\u9752"], radical: "\u5FC3", radicalName: "\u308A\u3063\u3057\u3093\u3079\u3093", strokes: 11, on: ["\u30B8\u30E7\u30A6", "\u30BB\u30A4"], kun: ["\u306A\u3055\u3051"], category: "\u5F62\u58F0", meaning: "emotion" },
  "\u7CBE": { components: ["\u7C73", "\u9752"], radical: "\u7C73", radicalName: "\u3053\u3081", strokes: 14, on: ["\u30BB\u30A4", "\u30B7\u30E7\u30A6"], kun: [""], category: "\u5F62\u58F0", meaning: "spirit/refined" },
  "\u9285": { components: ["\u91D1", "\u540C"], radical: "\u91D1", radicalName: "\u304B\u306D", strokes: 14, on: ["\u30C9\u30A6"], kun: ["\u3042\u304B\u304C\u306D"], category: "\u5F62\u58F0", meaning: "copper" },
  "\u92FC": { components: ["\u91D1", "\u5CA1"], radical: "\u91D1", radicalName: "\u304B\u306D", strokes: 16, on: ["\u30B3\u30A6"], kun: ["\u306F\u304C\u306D"], category: "\u5F62\u58F0", meaning: "steel" },
  "\u6CB3": { components: ["\u6C34", "\u53EF"], radical: "\u6C34", radicalName: "\u3055\u3093\u305A\u3044", strokes: 8, on: ["\u30AB"], kun: ["\u304B\u308F"], category: "\u5F62\u58F0", meaning: "river" },
  "\u6E56": { components: ["\u6C34", "\u80E1"], radical: "\u6C34", radicalName: "\u3055\u3093\u305A\u3044", strokes: 12, on: ["\u30B3"], kun: ["\u307F\u305A\u3046\u307F"], category: "\u5F62\u58F0", meaning: "lake" },
  "\u6C60": { components: ["\u6C34", "\u4E5F"], radical: "\u6C34", radicalName: "\u3055\u3093\u305A\u3044", strokes: 6, on: ["\u30C1"], kun: ["\u3044\u3051"], category: "\u5F62\u58F0", meaning: "pond" },
  "\u6D0B": { components: ["\u6C34", "\u7F8A"], radical: "\u6C34", radicalName: "\u3055\u3093\u305A\u3044", strokes: 9, on: ["\u30E8\u30A6"], kun: [""], category: "\u5F62\u58F0", meaning: "ocean/Western" },
  "\u677E": { components: ["\u6728", "\u516C"], radical: "\u6728", radicalName: "\u304D", strokes: 8, on: ["\u30B7\u30E7\u30A6"], kun: ["\u307E\u3064"], category: "\u5F62\u58F0", meaning: "pine" },
  "\u685C": { components: ["\u6728", "\u5B30"], radical: "\u6728", radicalName: "\u304D", strokes: 10, on: ["\u30AA\u30A6"], kun: ["\u3055\u304F\u3089"], category: "\u5F62\u58F0", meaning: "cherry blossom" },
  "\u6A4B": { components: ["\u6728", "\u55AC"], radical: "\u6728", radicalName: "\u304D", strokes: 16, on: ["\u30AD\u30E7\u30A6"], kun: ["\u306F\u3057"], category: "\u5F62\u58F0", meaning: "bridge" },
  "\u6751": { components: ["\u6728", "\u5BF8"], radical: "\u6728", radicalName: "\u304D", strokes: 7, on: ["\u30BD\u30F3"], kun: ["\u3080\u3089"], category: "\u5F62\u58F0", meaning: "village" },
  "\u7D19": { components: ["\u7CF8", "\u6C0F"], radical: "\u7CF8", radicalName: "\u3044\u3068", strokes: 10, on: ["\u30B7"], kun: ["\u304B\u307F"], category: "\u5F62\u58F0", meaning: "paper" },
  "\u7DDA": { components: ["\u7CF8", "\u6CC9"], radical: "\u7CF8", radicalName: "\u3044\u3068", strokes: 15, on: ["\u30BB\u30F3"], kun: [""], category: "\u5F62\u58F0", meaning: "line/thread" },
  "\u732B": { components: ["\u72AC", "\u82D7"], radical: "\u72AC", radicalName: "\u3051\u3082\u306E\u3078\u3093", strokes: 11, on: ["\u30D3\u30E7\u30A6"], kun: ["\u306D\u3053"], category: "\u5F62\u58F0", meaning: "cat" },
  "\u6642": { components: ["\u65E5", "\u5BFA"], radical: "\u65E5", radicalName: "\u306B\u3061", strokes: 10, on: ["\u30B8"], kun: ["\u3068\u304D"], category: "\u5F62\u58F0", meaning: "time" },
  "\u9593": { components: ["\u9580", "\u65E5"], radical: "\u9580", radicalName: "\u3082\u3093", strokes: 12, on: ["\u30AB\u30F3", "\u30B1\u30F3"], kun: ["\u3042\u3044\u3060", "\u307E"], category: "\u5F62\u58F0", meaning: "interval/between" },
  "\u805E": { components: ["\u9580", "\u8033"], radical: "\u8033", radicalName: "\u307F\u307F", strokes: 14, on: ["\u30D6\u30F3", "\u30E2\u30F3"], kun: ["\u304D"], category: "\u5F62\u58F0", meaning: "hear/ask" },
  "\u9589": { components: ["\u9580", "\u624D"], radical: "\u9580", radicalName: "\u3082\u3093", strokes: 11, on: ["\u30D8\u30A4"], kun: ["\u3057", "\u3068"], category: "\u5F62\u58F0", meaning: "close/shut" },
  "\u958B": { components: ["\u9580", "\u5F00"], radical: "\u9580", radicalName: "\u3082\u3093", strokes: 12, on: ["\u30AB\u30A4"], kun: ["\u3042", "\u3072\u3089"], category: "\u5F62\u58F0", meaning: "open" },
  "\u554F": { components: ["\u9580", "\u53E3"], radical: "\u53E3", radicalName: "\u304F\u3061", strokes: 11, on: ["\u30E2\u30F3"], kun: ["\u3068"], category: "\u5F62\u58F0", meaning: "question" },
  "\u6B4C": { components: ["\u53EF", "\u6B20"], radical: "\u6B20", radicalName: "\u3042\u304F\u3073", strokes: 14, on: ["\u30AB"], kun: ["\u3046\u305F", "\u3046\u305F"], category: "\u5F62\u58F0", meaning: "song" },
  "\u7B97": { components: ["\u7AF9", "\u76EE", "\u5EFE"], radical: "\u7AF9", radicalName: "\u305F\u3051\u304B\u3093\u3080\u308A", strokes: 14, on: ["\u30B5\u30F3"], kun: [""], category: "\u5F62\u58F0", meaning: "calculate" },
  "\u6570": { components: ["\u7C73", "\u5973", "\u6535"], radical: "\u6535", radicalName: "\u307C\u304F\u3065\u304F\u308A", strokes: 13, on: ["\u30B9\u30A6", "\u30B9"], kun: ["\u304B\u305A", "\u304B\u305E"], category: "\u5F62\u58F0", meaning: "number/count" },
  "\u96F6": { components: ["\u96E8", "\u4EE4"], radical: "\u96E8", radicalName: "\u3042\u3081", strokes: 13, on: ["\u30EC\u30A4"], kun: [""], category: "\u5F62\u58F0", meaning: "zero" },
  "\u7121": { components: ["\u4E00", "\u706B"], radical: "\u706B", radicalName: "\u308C\u3063\u304B", strokes: 12, on: ["\u30E0", "\u30D6"], kun: ["\u306A"], category: "\u4F1A\u610F", meaning: "nothing/void" },
  "\u59CB": { components: ["\u5973", "\u53F0"], radical: "\u5973", radicalName: "\u304A\u3093\u306A", strokes: 8, on: ["\u30B7"], kun: ["\u306F\u3058"], category: "\u5F62\u58F0", meaning: "begin" }
};
var PHONETIC_GROUPS = {
  "\u9752": ["\u6674", "\u6E05", "\u8ACB", "\u60C5", "\u7CBE"],
  "\u9580": ["\u9593", "\u805E", "\u9589", "\u958B", "\u554F"],
  "\u6C34": ["\u6CB3", "\u6E56", "\u6C60", "\u6D0B", "\u6D77", "\u6E05"],
  "\u6728": ["\u6797", "\u68EE", "\u677E", "\u685C", "\u6A4B", "\u6751", "\u672C", "\u672B"],
  "\u91D1": ["\u9285", "\u92FC"],
  "\u8A00": ["\u8A9E", "\u8A71", "\u8AAD", "\u8ACB"],
  "\u65E5": ["\u660E", "\u6674", "\u6642", "\u9593", "\u661F"],
  "\u5FC3": ["\u601D", "\u5FCD", "\u60C5", "\u611B"],
  "\u706B": ["\u708E", "\u7551", "\u5149"],
  "\u5C71": ["\u5CA9", "\u5CE0"],
  "\u96E8": ["\u96F7", "\u96EA", "\u96F2", "\u96F6"]
};
function kanjiToStringMDim(ch) {
  const info = KANJI_DB[ch];
  if (!info) {
    return {
      reiType: "StringMDim",
      center: ch,
      neighbors: [],
      mode: "kanji",
      metadata: { known: false }
    };
  }
  return {
    reiType: "StringMDim",
    center: ch,
    neighbors: info.components.length > 0 ? info.components : [ch],
    mode: "kanji",
    metadata: {
      known: true,
      radical: info.radical,
      radicalName: info.radicalName,
      strokes: info.strokes,
      on: info.on,
      kun: info.kun,
      category: info.category,
      meaning: info.meaning
    }
  };
}
function wordToStringMDim(word) {
  const chars = Array.from(word);
  if (chars.length === 1) return kanjiToStringMDim(chars[0]);
  return {
    reiType: "StringMDim",
    center: word,
    neighbors: chars,
    mode: "kanji",
    metadata: {
      charCount: chars.length,
      components: chars.map((c) => {
        const info = KANJI_DB[c];
        return info ? { char: c, components: info.components, category: info.category } : { char: c, components: [], category: "unknown" };
      })
    }
  };
}
function sentenceToStringMDim(text) {
  const particles = /([がはをにでとのへもやかながらまでよりさえだけばかりしかこそ]+)/;
  const parts = [];
  let predicate = "";
  const segments = text.split(particles).filter((s) => s.length > 0);
  let currentBunsetsu = "";
  for (const seg of segments) {
    currentBunsetsu += seg;
    if (particles.test(seg)) {
      parts.push(currentBunsetsu);
      currentBunsetsu = "";
    }
  }
  if (currentBunsetsu.length > 0) {
    predicate = currentBunsetsu;
  }
  if (!predicate && parts.length > 0) {
    predicate = parts.pop();
  }
  return {
    reiType: "StringMDim",
    center: predicate || text,
    neighbors: parts,
    mode: "sentence",
    metadata: {
      original: text,
      bunsetsuCount: parts.length + 1,
      particlesFound: parts.map((p) => {
        const match = p.match(particles);
        return match ? match[0] : "";
      })
    }
  };
}
function toneToStringMDim(pinyin, toneVariants) {
  return {
    reiType: "StringMDim",
    center: pinyin,
    neighbors: toneVariants,
    mode: "tone",
    metadata: {
      toneCount: toneVariants.length,
      // M1公理: 同じ音にモードを変えると意味が変わる
      m1_correspondence: "tone = compute mode"
    }
  };
}
function kanjiSimilarity(a, b) {
  const aComps = new Set(a.neighbors);
  const bComps = new Set(b.neighbors);
  const shared = [];
  for (const c of aComps) {
    if (bComps.has(c)) shared.push(c);
  }
  const unionSize = (/* @__PURE__ */ new Set([...aComps, ...bComps])).size;
  const jaccard = unionSize > 0 ? shared.length / unionSize : 0;
  const sameRadical = a.metadata?.radical === b.metadata?.radical;
  const sameCategory = a.metadata?.category === b.metadata?.category;
  const strokeDiff = Math.abs((a.metadata?.strokes ?? 0) - (b.metadata?.strokes ?? 0));
  const strokeSimilarity = 1 / (1 + strokeDiff);
  let sharedPhoneticGroup = false;
  for (const [, group] of Object.entries(PHONETIC_GROUPS)) {
    if (group.includes(a.center) && group.includes(b.center)) {
      sharedPhoneticGroup = true;
      break;
    }
  }
  const strength = jaccard * 0.35 + (sameRadical ? 0.25 : 0) + (sameCategory ? 0.15 : 0) + strokeSimilarity * 0.1 + (sharedPhoneticGroup ? 0.15 : 0);
  return {
    reiType: "KanjiSimilarity",
    pair: [a.center, b.center],
    strength: Math.min(1, strength),
    sharedComponents: shared,
    jaccard,
    sameRadical,
    sameCategory,
    strokeDiff,
    sharedPhoneticGroup
  };
}
function reverseKanjiLookup(components) {
  const results = [];
  const compSet = new Set(components);
  for (const [kanji, info] of Object.entries(KANJI_DB)) {
    if (info.components.length === 0) continue;
    if (info.components.every((c) => compSet.has(c))) {
      results.push(kanji);
    }
  }
  return results;
}
function getPhoneticGroup(ch) {
  for (const [key, group] of Object.entries(PHONETIC_GROUPS)) {
    if (ch === key || group.includes(ch)) return group;
  }
  return [];
}
var REI_SERIAL_VERSION = "0.3.1";
function reiSerialize(value, pretty = false) {
  const type = detectSerialType(value);
  let sigma;
  if (value !== null && typeof value === "object" && value.__sigma__) {
    sigma = {
      memory: value.__sigma__.memory || [],
      tendency: value.__sigma__.tendency || "rest",
      pipeCount: value.__sigma__.pipeCount || 0
    };
  }
  const payload = cleanSerialPayload(value);
  const envelope = {
    __rei__: true,
    version: REI_SERIAL_VERSION,
    type,
    timestamp: (/* @__PURE__ */ new Date()).toISOString(),
    payload,
    ...sigma ? { sigma } : {}
  };
  return JSON.stringify(envelope, null, pretty ? 2 : void 0);
}
function reiDeserialize(value) {
  let json;
  if (typeof value === "string") {
    json = value;
  } else if (typeof value === "object" && value !== null && value.reiType === "ReiVal" && typeof value.value === "string") {
    json = value.value;
  } else {
    json = JSON.stringify(value);
  }
  let parsed;
  try {
    parsed = JSON.parse(json);
  } catch (e) {
    throw new Error(`deserialize: \u7121\u52B9\u306AJSON \u2014 ${e.message}`);
  }
  if (parsed && parsed.__rei__ === true && "payload" in parsed) {
    let val = parsed.payload;
    if (parsed.sigma && val !== null && typeof val === "object") {
      val.__sigma__ = {
        memory: parsed.sigma.memory || [],
        tendency: parsed.sigma.tendency || "rest",
        pipeCount: parsed.sigma.pipeCount || 0
      };
    }
    return val;
  }
  return parsed;
}
function detectSerialType(value) {
  if (value === null || value === void 0) return "null";
  if (typeof value === "number") return "number";
  if (typeof value === "string") return "string";
  if (typeof value === "boolean") return "boolean";
  if (Array.isArray(value)) return "array";
  if (typeof value === "object" && value.reiType) return value.reiType;
  return "object";
}
function cleanSerialPayload(value) {
  if (value === null || value === void 0) return value;
  if (typeof value !== "object") return value;
  if (Array.isArray(value)) return value.map(cleanSerialPayload);
  const clean = {};
  for (const key of Object.keys(value)) {
    if (key === "__sigma__") continue;
    clean[key] = value[key];
  }
  return clean;
}
function quadNot(v) {
  switch (v) {
    case "top":
      return "bottom";
    case "bottom":
      return "top";
    case "topPi":
      return "bottomPi";
    case "bottomPi":
      return "topPi";
    default:
      return v;
  }
}
function quadAnd(a, b) {
  if (a === "bottom" || b === "bottom") return "bottom";
  if (a === "top" && b === "top") return "top";
  return "bottomPi";
}
function quadOr(a, b) {
  if (a === "top" || b === "top") return "top";
  if (a === "bottom" && b === "bottom") return "bottom";
  return "topPi";
}
var PHASE_ORDER = ["void", "dot", "line", "surface", "solid", "omega"];
function createGenesis() {
  return { reiType: "State", state: "void", omega: 0, history: ["void"] };
}
function genesisForward(g) {
  const idx = PHASE_ORDER.indexOf(g.state);
  if (idx < PHASE_ORDER.length - 1) {
    g.state = PHASE_ORDER[idx + 1];
    g.history.push(g.state);
    if (g.state === "omega") g.omega = 1;
  }
}
var Evaluator = class {
  env;
  constructor(parent) {
    this.env = new Environment(parent ?? null);
    this.registerBuiltins();
  }
  registerBuiltins() {
    this.env.define("e", Math.E);
    this.env.define("PI", Math.PI);
    this.env.define("genesis", {
      reiType: "Function",
      name: "genesis",
      params: [],
      body: null,
      closure: this.env
    });
    const mathFns = ["abs", "sqrt", "sin", "cos", "log", "exp", "floor", "ceil", "round", "min", "max", "len", "print"];
    for (const name of mathFns) {
      this.env.define(name, {
        reiType: "Function",
        name,
        params: ["x"],
        body: null,
        closure: this.env
      });
    }
  }
  eval(ast) {
    switch (ast.type) {
      case "Program":
        return this.evalProgram(ast);
      case "NumLit":
        return ast.value;
      case "StrLit":
        return ast.value;
      case "BoolLit":
        return ast.value;
      case "NullLit":
        return null;
      case "ExtLit":
        return parseExtLit(ast.raw);
      case "ConstLit":
        return this.evalConstLit(ast);
      case "QuadLit":
        return { reiType: "Quad", value: ast.value };
      case "MDimLit":
        return this.evalMDimLit(ast);
      case "ArrayLit":
        return ast.elements.map((e) => this.eval(e));
      case "Ident":
        return this.env.get(ast.name);
      case "LetStmt":
        return this.evalLetStmt(ast);
      case "MutStmt":
        return this.evalMutStmt(ast);
      case "CompressDef":
        return this.evalCompressDef(ast);
      case "BinOp":
        return this.evalBinOp(ast);
      case "UnaryOp":
        return this.evalUnaryOp(ast);
      case "Pipe":
        return this.evalPipe(ast);
      case "FnCall":
        return this.evalFnCall(ast);
      case "MemberAccess":
        return this.evalMemberAccess(ast);
      case "IndexAccess":
        return this.evalIndexAccess(ast);
      case "Extend":
        return this.evalExtend(ast);
      case "Reduce":
        return this.evalReduce(ast);
      case "ConvergeOp":
        return this.evalConverge(ast);
      case "DivergeOp":
        return this.evalDiverge(ast);
      case "ReflectOp":
        return this.evalReflect(ast);
      case "IfExpr":
        return this.evalIfExpr(ast);
      case "MatchExpr":
        return this.evalMatchExpr(ast);
      // ── v0.3 ──
      case "SpaceLit":
        return this.evalSpaceLit(ast);
      default:
        throw new Error(`\u672A\u5B9F\u88C5\u306E\u30CE\u30FC\u30C9\u578B: ${ast.type}`);
    }
  }
  evalProgram(ast) {
    let result = null;
    for (const stmt of ast.body) {
      result = this.eval(stmt);
    }
    return result;
  }
  evalConstLit(ast) {
    switch (ast.value) {
      case "\u30FB":
        return createGenesis();
      case "\u2205":
        return null;
      case "i":
        return { reiType: "Ext", base: NaN, order: 0, subscripts: "", valStar: () => NaN };
      case "\u03A6":
        return "\u03A6";
      case "\u03A8":
        return "\u03A8";
      case "\u03A9":
        return "\u03A9";
      default:
        return null;
    }
  }
  evalMDimLit(ast) {
    const rawCenter = this.eval(ast.center);
    const rawNeighbors = ast.neighbors.map((n) => this.eval(n));
    const hasString = typeof rawCenter === "string" || rawNeighbors.some((n) => typeof n === "string");
    if (hasString) {
      const center2 = typeof rawCenter === "string" ? rawCenter : String(rawCenter);
      const neighbors2 = rawNeighbors.map((n) => typeof n === "string" ? n : String(n));
      const mode2 = ast.mode || "freeform";
      return {
        reiType: "StringMDim",
        center: center2,
        neighbors: neighbors2,
        mode: mode2,
        metadata: { source: "literal" }
      };
    }
    const center = this.toNumber(rawCenter);
    const neighbors = rawNeighbors.map((n) => this.toNumber(n));
    const weights = ast.weight ? [this.toNumber(this.eval(ast.weight))] : void 0;
    const mode = ast.mode || "weighted";
    return { reiType: "MDim", center, neighbors, mode, weights };
  }
  // ── v0.3: Space literal evaluation ──
  evalSpaceLit(ast) {
    const space = createSpace(ast.topology || "flat");
    for (const layerDef of ast.layers) {
      const layerIndex = typeof layerDef.index === "object" ? this.toNumber(this.eval(layerDef.index)) : layerDef.index;
      for (const nodeExpr of layerDef.nodes) {
        const val = this.eval(nodeExpr);
        if (this.isMDim(val)) {
          addNodeToLayer(space, layerIndex, val.center, val.neighbors, val.mode, val.weights);
        } else if (typeof val === "number") {
          addNodeToLayer(space, layerIndex, val, []);
        }
      }
    }
    return space;
  }
  evalLetStmt(ast) {
    const val = this.eval(ast.init);
    this.env.define(ast.name, val, false);
    return val;
  }
  evalMutStmt(ast) {
    const val = this.eval(ast.init);
    this.env.define(ast.name, val, true);
    return val;
  }
  evalCompressDef(ast) {
    const fn = {
      reiType: "Function",
      name: ast.name,
      params: ast.params,
      body: ast.body,
      closure: this.env
    };
    this.env.define(ast.name, fn);
    return fn;
  }
  evalBinOp(ast) {
    const left = this.eval(ast.left);
    const right = this.eval(ast.right);
    if (this.isQuad(left) && this.isQuad(right)) {
      switch (ast.op) {
        case "\u2227":
          return { reiType: "Quad", value: quadAnd(left.value, right.value) };
        case "\u2228":
          return { reiType: "Quad", value: quadOr(left.value, right.value) };
      }
    }
    const l = this.toNumber(left);
    const r = this.toNumber(right);
    switch (ast.op) {
      case "+":
        return l + r;
      case "-":
        return l - r;
      case "*":
        return l * r;
      case "/":
        return r !== 0 ? l / r : NaN;
      case "\u2295":
        return l + r;
      // ⊕
      case "\u2297":
        return l * r;
      // ⊗
      case "\xB7":
        return l * r;
      // ·
      case "==":
        return l === r;
      case "!=":
        return l !== r;
      case ">":
        return l > r;
      case "<":
        return l < r;
      case ">=":
        return l >= r;
      case "<=":
        return l <= r;
      case ">\u03BA":
        return l > r;
      // >κ
      case "<\u03BA":
        return l < r;
      // <κ
      case "=\u03BA":
        return l === r;
      // =κ
      case "\u2227":
        return l !== 0 && r !== 0;
      // ∧
      case "\u2228":
        return l !== 0 || r !== 0;
      // ∨
      default:
        throw new Error(`\u672A\u77E5\u306E\u6F14\u7B97\u5B50: ${ast.op}`);
    }
  }
  evalUnaryOp(ast) {
    const operand = this.eval(ast.operand);
    switch (ast.op) {
      case "-":
        return -this.toNumber(operand);
      case "\xAC":
        if (this.isQuad(operand)) return { reiType: "Quad", value: quadNot(operand.value) };
        return !operand;
      default:
        throw new Error(`\u672A\u77E5\u306E\u5358\u9805\u6F14\u7B97\u5B50: ${ast.op}`);
    }
  }
  evalPipe(ast) {
    const rawInput = this.eval(ast.input);
    const cmd = ast.command;
    if (cmd.type === "PipeCmd") {
      if (cmd.cmd === "sigma") {
        return this.execPipeCmd(rawInput, cmd);
      }
      if (cmd.cmd === "serialize" || cmd.cmd === "serialize_pretty") {
        return reiSerialize(rawInput, cmd.cmd === "serialize_pretty");
      }
      if (cmd.cmd === "deserialize") {
        return reiDeserialize(rawInput);
      }
      if (cmd.cmd === "evolve_value") {
        return this.execPipeCmd(rawInput, cmd);
      }
      if (cmd.cmd === "think" || cmd.cmd === "\u601D\u8003" || cmd.cmd === "think_trajectory" || cmd.cmd === "\u8ECC\u8DE1" || cmd.cmd === "think_modes" || cmd.cmd === "think_dominant" || cmd.cmd === "think_format" || cmd.cmd === "\u601D\u8003\u8868\u793A") {
        return this.execPipeCmd(rawInput, cmd);
      }
      if (rawInput?.reiType === "ThoughtResult" || rawInput?.reiType === "ReiVal" && rawInput?.value?.reiType === "ThoughtResult") {
        const thoughtAccessors = [
          "final_value",
          "\u6700\u7D42\u5024",
          "iterations",
          "\u53CD\u5FA9\u6570",
          "stop_reason",
          "\u505C\u6B62\u7406\u7531",
          "trajectory",
          "\u8ECC\u8DE1",
          "convergence",
          "\u53CE\u675F\u7387",
          "awareness",
          "\u899A\u9192\u5EA6",
          "tendency",
          "\u610F\u5FD7",
          "steps",
          "\u5168\u5C65\u6B74",
          "dominant_mode",
          "\u652F\u914D\u30E2\u30FC\u30C9"
        ];
        if (thoughtAccessors.includes(cmd.cmd)) {
          return this.execPipeCmd(rawInput, cmd);
        }
      }
      const gameCommands = [
        "game",
        "\u30B2\u30FC\u30E0",
        "play",
        "\u6253\u3064",
        "auto_play",
        "\u81EA\u52D5\u5BFE\u5C40",
        "best_move",
        "\u6700\u5584\u624B",
        "legal_moves",
        "\u5408\u6CD5\u624B",
        "game_format",
        "\u76E4\u9762\u8868\u793A",
        "game_sigma",
        "simulate",
        "\u30B7\u30DF\u30E5\u30EC\u30FC\u30C8",
        "random",
        "\u30E9\u30F3\u30C0\u30E0",
        "random_walk",
        "entropy",
        "\u30A8\u30F3\u30C8\u30ED\u30D4\u30FC",
        "monte_carlo",
        "seed"
      ];
      if (gameCommands.includes(cmd.cmd)) {
        return this.execPipeCmd(rawInput, cmd);
      }
      const unwrappedForGame = rawInput?.reiType === "ReiVal" ? rawInput.value : rawInput;
      if (unwrappedForGame?.reiType === "GameSpace") {
        const gameAccessors = [
          "play",
          "\u6253\u3064",
          "auto_play",
          "\u81EA\u52D5\u5BFE\u5C40",
          "best_move",
          "\u6700\u5584\u624B",
          "legal_moves",
          "\u5408\u6CD5\u624B",
          "board",
          "\u76E4\u9762",
          "status",
          "\u72B6\u614B",
          "winner",
          "\u52DD\u8005",
          "turn",
          "\u624B\u756A",
          "history",
          "\u68CB\u8B5C",
          "game_format",
          "\u76E4\u9762\u8868\u793A",
          "sigma",
          "as_mdim"
        ];
        if (gameAccessors.includes(cmd.cmd)) {
          return this.execPipeCmd(rawInput, cmd);
        }
      }
      if (unwrappedForGame?.reiType === "RandomResult" || unwrappedForGame?.reiType === "EntropyAnalysis") {
        return this.execPipeCmd(rawInput, cmd);
      }
      const puzzleCommands = [
        "puzzle",
        "\u30D1\u30BA\u30EB",
        "\u6570\u72EC",
        "sudoku",
        "latin_square",
        "\u30E9\u30C6\u30F3\u65B9\u9663",
        "solve",
        "\u89E3\u304F",
        "propagate",
        "\u4F1D\u64AD",
        "propagate_pair",
        "cell",
        "\u30BB\u30EB",
        "grid",
        "\u76E4\u9762",
        "candidates",
        "\u5019\u88DC",
        "puzzle_format",
        "\u6570\u72EC\u8868\u793A",
        "difficulty",
        "\u96E3\u6613\u5EA6",
        "generate_sudoku",
        "\u6570\u72EC\u751F\u6210"
      ];
      if (puzzleCommands.includes(cmd.cmd)) {
        return this.execPipeCmd(rawInput, cmd);
      }
      const unwrappedForPuzzle = rawInput?.reiType === "ReiVal" ? rawInput.value : rawInput;
      if (unwrappedForPuzzle?.reiType === "PuzzleSpace") {
        const puzzleAccessors = [
          "solve",
          "\u89E3\u304F",
          "propagate",
          "\u4F1D\u64AD",
          "propagate_pair",
          "cell",
          "\u30BB\u30EB",
          "grid",
          "\u76E4\u9762",
          "candidates",
          "\u5019\u88DC",
          "puzzle_format",
          "\u6570\u72EC\u8868\u793A",
          "difficulty",
          "\u96E3\u6613\u5EA6",
          "sigma",
          "status",
          "\u72B6\u614B",
          "history",
          "\u5C65\u6B74",
          "as_mdim"
        ];
        if (puzzleAccessors.includes(cmd.cmd)) {
          return this.execPipeCmd(rawInput, cmd);
        }
      }
      const stringMDimAccessors = [
        "strokes",
        "\u753B\u6570",
        "category",
        "\u516D\u66F8",
        "meaning",
        "\u610F\u5473",
        "readings",
        "\u8AAD\u307F",
        "radicals",
        "\u90E8\u9996",
        "phonetic_group",
        "\u97F3\u7B26",
        "compose",
        "\u5408\u6210",
        "decompose",
        "\u5206\u89E3",
        "similarity",
        "\u985E\u4F3C"
      ];
      if (stringMDimAccessors.includes(cmd.cmd)) {
        return this.execPipeCmd(rawInput, cmd);
      }
      const result = this.execPipeCmd(rawInput, cmd);
      const prevMeta = getSigmaOf(rawInput);
      return wrapWithSigma(result, rawInput, prevMeta.pipeCount > 0 ? prevMeta : void 0);
    }
    throw new Error("\u7121\u52B9\u306A\u30D1\u30A4\u30D7\u30B3\u30DE\u30F3\u30C9");
  }
  execPipeCmd(input, cmd) {
    const { cmd: cmdName, mode, args: argNodes } = cmd;
    const args = argNodes.map((a) => this.eval(a));
    const sigmaMetadata = getSigmaOf(input);
    const rawInput = unwrapReiVal(input);
    if (cmdName === "sigma") {
      if (this.isSpace(rawInput)) return getSpaceSigma(rawInput);
      if (this.isDNode(rawInput)) {
        const dn = rawInput;
        return {
          reiType: "SigmaResult",
          flow: getSigmaFlow(dn),
          memory: [...getSigmaMemory(dn), ...sigmaMetadata.memory],
          layer: dn.layerIndex,
          will: getSigmaWill(dn),
          field: { center: dn.center, neighbors: [...dn.neighbors], layer: dn.layerIndex, index: dn.nodeIndex },
          relation: []
        };
      }
      if (rawInput !== null && typeof rawInput === "object" && rawInput.reiType === "StringMDim") {
        const sm = rawInput;
        return {
          reiType: "SigmaResult",
          field: { center: sm.center, neighbors: sm.neighbors, mode: sm.mode, type: "string" },
          flow: { direction: "rest", momentum: 0, velocity: 0 },
          memory: sigmaMetadata.memory,
          layer: 0,
          will: { tendency: sigmaMetadata.tendency, strength: 0, history: [] },
          relation: sm.neighbors.map((n) => ({ from: sm.center, to: n, type: sm.mode }))
        };
      }
      if (rawInput !== null && typeof rawInput === "object" && rawInput.reiType === "ThoughtResult") {
        return getThoughtSigma(rawInput);
      }
      if (rawInput !== null && typeof rawInput === "object" && rawInput.reiType === "GameSpace") {
        return getGameSigma(rawInput);
      }
      if (rawInput !== null && typeof rawInput === "object" && rawInput.reiType === "PuzzleSpace") {
        return getPuzzleSigma(rawInput);
      }
      return buildSigmaResult(rawInput, sigmaMetadata);
    }
    if (this.isSpace(rawInput)) {
      const sp = rawInput;
      switch (cmdName) {
        case "step": {
          const targetLayer = args.length > 0 ? this.toNumber(args[0]) : void 0;
          stepSpace(sp, targetLayer);
          return sp;
        }
        case "diffuse": {
          let criteria = { type: "converged" };
          let targetLayer;
          let contractionMethod = "weighted";
          if (args.length >= 1) {
            const arg0 = args[0];
            if (typeof arg0 === "number") {
              criteria = { type: "steps", max: arg0 };
            } else if (typeof arg0 === "string") {
              switch (arg0) {
                case "converged":
                  criteria = { type: "converged" };
                  break;
                case "fixed":
                  criteria = { type: "fixed" };
                  break;
                default:
                  const eps = parseFloat(arg0);
                  if (!isNaN(eps)) criteria = { type: "epsilon", threshold: eps };
              }
            }
          }
          if (args.length >= 2 && typeof args[1] === "number") targetLayer = args[1];
          if (args.length >= 3 && typeof args[2] === "string") contractionMethod = args[2];
          return diffuseSpace(sp, criteria, targetLayer, contractionMethod);
        }
        case "node": {
          const layerIdx = args.length >= 1 ? this.toNumber(args[0]) : 0;
          const nodeIdx = args.length >= 2 ? this.toNumber(args[1]) : 0;
          const layer = sp.layers.get(layerIdx);
          if (layer && layer.nodes[nodeIdx]) return layer.nodes[nodeIdx];
          throw new Error(`\u30CE\u30FC\u30C9\u304C\u898B\u3064\u304B\u308A\u307E\u305B\u3093: \u5C64${layerIdx}, index ${nodeIdx}`);
        }
        case "sigma":
          return getSpaceSigma(sp);
        case "resonances": {
          const threshold = args.length >= 1 ? this.toNumber(args[0]) : 0.5;
          return findResonances(sp, threshold);
        }
        case "freeze": {
          const layerIdx = this.toNumber(args[0] ?? 0);
          const layer = sp.layers.get(layerIdx);
          if (layer) layer.frozen = true;
          return sp;
        }
        case "thaw": {
          const layerIdx = this.toNumber(args[0] ?? 0);
          const layer = sp.layers.get(layerIdx);
          if (layer) layer.frozen = false;
          return sp;
        }
        case "spawn": {
          const val = args[0];
          const layerIdx = args.length >= 2 ? this.toNumber(args[1]) : 0;
          if (this.isMDim(val)) {
            addNodeToLayer(sp, layerIdx, val.center, val.neighbors, val.mode, val.weights);
          }
          return sp;
        }
        case "result": {
          const layerIdx = args.length >= 1 ? this.toNumber(args[0]) : void 0;
          const results = [];
          for (const [lIdx, layer] of sp.layers) {
            if (layerIdx !== void 0 && lIdx !== layerIdx) continue;
            for (const n of layer.nodes) results.push(computeNodeValue(n));
          }
          return results.length === 1 ? results[0] : results;
        }
      }
    }
    if (this.isDNode(rawInput)) {
      const dn = rawInput;
      switch (cmdName) {
        case "sigma": {
          return buildSigmaResult(dn, sigmaMetadata);
        }
        case "compute":
          return computeNodeValue(dn);
        case "center":
          return dn.center;
        case "neighbors":
          return dn.neighbors;
        case "dim":
          return dn.neighbors.length;
        case "stage":
          return dn.stage;
        case "step": {
          stepNode(dn);
          return dn;
        }
        case "extract": {
          return { reiType: "MDim", center: dn.center, neighbors: dn.neighbors, mode: dn.mode, weights: dn.weights };
        }
      }
    }
    if (this.isObj(rawInput) && rawInput.reiType === "SigmaResult") {
      switch (cmdName) {
        case "flow":
          return rawInput.flow;
        case "memory":
          return rawInput.memory;
        case "layer":
        case "\u5C64":
          return rawInput.layer;
        case "will":
          return rawInput.will;
        case "field":
          return rawInput.field;
        case "relation":
          return rawInput.relation ?? [];
      }
    }
    if (cmdName === "project") {
      const centerSpec = args.length > 0 ? args[0] : ":first";
      return projectToMDim(rawInput, centerSpec);
    }
    if (cmdName === "reproject") {
      if (this.isMDim(rawInput) && args.length > 0) {
        const newCenter = args[0];
        const allElements = [rawInput.center, ...rawInput.neighbors];
        const idx = typeof newCenter === "number" ? allElements.indexOf(newCenter) : 0;
        if (idx < 0) throw new Error(`reproject: \u4E2D\u5FC3\u5024 ${newCenter} \u304C\u898B\u3064\u304B\u308A\u307E\u305B\u3093`);
        const center = allElements[idx];
        const neighbors = allElements.filter((_, i) => i !== idx);
        return { reiType: "MDim", center, neighbors, mode: rawInput.mode };
      }
      return projectToMDim(rawInput, args[0] ?? ":first");
    }
    if (cmdName === "modes") {
      return [...ALL_COMPUTE_MODES];
    }
    if (cmdName === "blend") {
      if (!this.isMDim(rawInput)) throw new Error("blend: \u{1D544}\u578B\u306E\u5024\u304C\u5FC5\u8981\u3067\u3059");
      let blendedResult = 0;
      let totalWeight = 0;
      for (let i = 0; i < args.length - 1; i += 2) {
        const modeName = String(args[i]);
        const w = typeof args[i + 1] === "number" ? args[i + 1] : 0;
        const result = computeMDim({ ...rawInput, mode: modeName });
        blendedResult += w * result;
        totalWeight += w;
      }
      return totalWeight > 0 ? blendedResult / totalWeight : computeMDim(rawInput);
    }
    if (cmdName === "project_all") {
      return projectAll(rawInput);
    }
    if (cmdName === "compute_all") {
      if (this.isMDim(rawInput)) return computeAll(rawInput);
      if (Array.isArray(rawInput)) {
        const projected = projectToMDim(rawInput, "first");
        return computeAll(projected);
      }
      return [];
    }
    if (cmdName === "compare") {
      if (!this.isMDim(rawInput)) throw new Error("compare: \u{1D544}\u578B\u306E\u5024\u304C\u5FC5\u8981\u3067\u3059");
      const mode1 = args.length >= 1 ? String(args[0]) : "weighted";
      const mode2 = args.length >= 2 ? String(args[1]) : "geometric";
      return compareModes(rawInput, mode1, mode2);
    }
    if (cmdName === "perspectives") {
      return perspectives(rawInput);
    }
    if (cmdName === "flatten_nested") {
      if (this.isMDim(rawInput)) return computeNestedMDim(rawInput);
      return rawInput;
    }
    if (cmdName === "respond") {
      const stimulus = args.length >= 1 ? this.toNumber(args[0]) : 0;
      const method = args.length >= 2 ? String(args[1]) : "absorb";
      return respondToStimulus(rawInput, stimulus, method);
    }
    if (cmdName === "sensitivity") {
      return computeSensitivity(rawInput);
    }
    if (cmdName === "awareness") {
      return computeAwareness(rawInput, sigmaMetadata);
    }
    if (cmdName === "awakened") {
      return computeAwareness(rawInput, sigmaMetadata) >= AWAKENING_THRESHOLD;
    }
    if (cmdName === "transform") {
      const transformName = args.length >= 1 ? String(args[0]) : "scale";
      const param = args.length >= 2 ? this.toNumber(args[1]) : 1;
      return applyTransform(rawInput, transformName, param);
    }
    if (cmdName === "mode_equiv") {
      if (!this.isMDim(rawInput)) throw new Error("mode_equiv: \u{1D544}\u578B\u306E\u5024\u304C\u5FC5\u8981\u3067\u3059");
      const m1 = args.length >= 1 ? String(args[0]) : "weighted";
      const m2 = args.length >= 2 ? String(args[1]) : "geometric";
      return checkModeEquivalence(rawInput, m1, m2);
    }
    if (cmdName === "resonate") {
      if (args.length < 1) throw new Error("resonate: \u6BD4\u8F03\u5BFE\u8C61\u304C\u5FC5\u8981\u3067\u3059");
      return computeResonance(rawInput, args[0]);
    }
    if (cmdName === "resonance_field") {
      return getResonanceField(rawInput, sigmaMetadata);
    }
    if (cmdName === "resonance_map") {
      return resonanceMap(rawInput);
    }
    if (cmdName === "resonance_chain") {
      return resonanceChain(rawInput);
    }
    if (cmdName === "project_as") {
      const targetType = args.length >= 1 ? String(args[0]) : "graph";
      return projectAs(rawInput, targetType);
    }
    if (cmdName === "compose_projections") {
      return composeProjections(rawInput);
    }
    if (cmdName === "representable") {
      return checkRepresentable(rawInput);
    }
    if (cmdName === "derive_mode") {
      if (!this.isMDim(rawInput)) throw new Error("derive_mode: \u{1D544}\u578B\u304C\u5FC5\u8981\u3067\u3059");
      const modes = args.filter((a) => typeof a === "string");
      const weights = args.filter((a) => typeof a === "number");
      if (modes.length === 0) modes.push("weighted", "geometric");
      if (weights.length === 0) weights.push(0.5, 0.5);
      return deriveMode(rawInput, modes, weights);
    }
    if (cmdName === "mode_space") {
      return getModeSpace(rawInput);
    }
    if (cmdName === "depth") {
      return measureDepth(rawInput);
    }
    if (cmdName === "nest") {
      const levels = args.length >= 1 ? this.toNumber(args[0]) : 1;
      return nestMDim(rawInput, levels);
    }
    if (cmdName === "recursive_compute") {
      return recursiveCompute(rawInput);
    }
    if (cmdName === "bridge") {
      if (args.length < 1) throw new Error("bridge: \u6BD4\u8F03\u5BFE\u8C61\u304C\u5FC5\u8981\u3067\u3059");
      return bridgeMDim(rawInput, args[0]);
    }
    if (cmdName === "structural_similarity") {
      if (args.length < 1) throw new Error("structural_similarity: \u6BD4\u8F03\u5BFE\u8C61\u304C\u5FC5\u8981\u3067\u3059");
      return structuralSimilarity(rawInput, args[0]);
    }
    if (cmdName === "encode") {
      return encodeMDim(rawInput);
    }
    if (cmdName === "decode") {
      const targetType = args.length >= 1 ? String(args[0]) : "array";
      return decodeMDim(rawInput, targetType);
    }
    if (cmdName === "map_solutions") {
      if (!this.isMDim(rawInput)) {
        if (Array.isArray(rawInput)) {
          const projected = projectToMDim(rawInput, "first");
          return mapSolutions(projected, args.length >= 1 ? String(args[0]) : "scale", args.length >= 2 ? this.toNumber(args[1]) : 1);
        }
        throw new Error("map_solutions: \u{1D544}\u578B\u307E\u305F\u306F\u914D\u5217\u304C\u5FC5\u8981\u3067\u3059");
      }
      return mapSolutions(rawInput, args.length >= 1 ? String(args[0]) : "scale", args.length >= 2 ? this.toNumber(args[1]) : 1);
    }
    if (cmdName === "consensus") {
      if (!this.isMDim(rawInput)) {
        if (Array.isArray(rawInput)) {
          return computeConsensus(projectToMDim(rawInput, "first"));
        }
        throw new Error("consensus: \u{1D544}\u578B\u307E\u305F\u306F\u914D\u5217\u304C\u5FC5\u8981\u3067\u3059");
      }
      return computeConsensus(rawInput);
    }
    if (cmdName === "best") {
      if (!this.isMDim(rawInput)) {
        if (Array.isArray(rawInput)) {
          return selectBest(projectToMDim(rawInput, "first"), args.length >= 1 ? String(args[0]) : "median_closest");
        }
        throw new Error("best: \u{1D544}\u578B\u307E\u305F\u306F\u914D\u5217\u304C\u5FC5\u8981\u3067\u3059");
      }
      return selectBest(rawInput, args.length >= 1 ? String(args[0]) : "median_closest");
    }
    if (cmdName === "rank") {
      if (!this.isMDim(rawInput)) {
        if (Array.isArray(rawInput)) {
          return rankSolutions(projectToMDim(rawInput, "first"), args.length >= 1 ? String(args[0]) : "value");
        }
        throw new Error("rank: \u{1D544}\u578B\u307E\u305F\u306F\u914D\u5217\u304C\u5FC5\u8981\u3067\u3059");
      }
      return rankSolutions(rawInput, args.length >= 1 ? String(args[0]) : "value");
    }
    if (cmdName === "solution_completeness") {
      if (!this.isMDim(rawInput)) {
        if (Array.isArray(rawInput)) {
          return solutionCompleteness(projectToMDim(rawInput, "first"));
        }
        throw new Error("solution_completeness: \u{1D544}\u578B\u307E\u305F\u306F\u914D\u5217\u304C\u5FC5\u8981\u3067\u3059");
      }
      return solutionCompleteness(rawInput);
    }
    if (cmdName === "evolve") {
      const strategy = args.length >= 1 ? String(args[0]) : "auto";
      return evolveMode(input, sigmaMetadata, strategy);
    }
    if (cmdName === "evolve_value") {
      const strategy = args.length >= 1 ? String(args[0]) : "auto";
      const result = evolveMode(input, sigmaMetadata, strategy);
      return result.value;
    }
    if (this.isMDim(rawInput)) {
      const md = rawInput;
      switch (cmdName) {
        case "compute": {
          const m = mode || md.mode;
          return computeMDim({ ...md, mode: m });
        }
        case "center":
          return md.center;
        case "neighbors":
          return md.neighbors;
        case "dim":
          return md.neighbors.length;
        case "normalize": {
          const sum = md.neighbors.reduce((a, b) => a + Math.abs(b), 0) || 1;
          return { reiType: "MDim", center: md.center, neighbors: md.neighbors.map((n) => n / sum), mode: md.mode };
        }
        case "flatten":
          return computeMDim(md);
        case "map": {
          if (args.length > 0 && this.isFunction(args[0])) {
            const fn = args[0];
            const newNeighbors = md.neighbors.map((n) => this.toNumber(this.callFunction(fn, [n])));
            return { ...md, neighbors: newNeighbors };
          }
          return md;
        }
      }
    }
    if (this.isExt(rawInput)) {
      const ext = rawInput;
      switch (cmdName) {
        case "order":
          return ext.order;
        case "base":
          return ext.base;
        case "valStar":
        case "val":
          return ext.valStar();
        case "subscripts":
          return ext.subscripts;
      }
    }
    if (this.isGenesis(rawInput)) {
      const g = rawInput;
      switch (cmdName) {
        case "forward":
          genesisForward(g);
          return g;
        case "phase":
          return g.state;
        case "history":
          return g.history;
        case "omega":
          return g.omega;
      }
    }
    if (Array.isArray(rawInput)) {
      switch (cmdName) {
        case "len":
          return rawInput.length;
        case "sum":
          return rawInput.reduce((a, b) => a + this.toNumber(b), 0);
        case "avg":
          return rawInput.length === 0 ? 0 : rawInput.reduce((a, b) => a + this.toNumber(b), 0) / rawInput.length;
        case "first":
          return rawInput[0] ?? null;
        case "last":
          return rawInput[rawInput.length - 1] ?? null;
        case "reverse":
          return [...rawInput].reverse();
        case "sort":
          return [...rawInput].sort((a, b) => this.toNumber(a) - this.toNumber(b));
        case "map": {
          if (args.length > 0 && this.isFunction(args[0])) {
            return rawInput.map((v) => this.callFunction(args[0], [v]));
          }
          return rawInput;
        }
        case "filter": {
          if (args.length > 0 && this.isFunction(args[0])) {
            return rawInput.filter((v) => !!this.callFunction(args[0], [v]));
          }
          return rawInput;
        }
        case "reduce": {
          if (args.length >= 2 && this.isFunction(args[0])) {
            return rawInput.reduce((acc, v) => this.callFunction(args[0], [acc, v]), args[1]);
          }
          return rawInput;
        }
      }
    }
    if (typeof rawInput === "number") {
      switch (cmdName) {
        case "abs":
          return Math.abs(rawInput);
        case "sqrt":
          return Math.sqrt(rawInput);
        case "round":
          return Math.round(rawInput);
        case "floor":
          return Math.floor(rawInput);
        case "ceil":
          return Math.ceil(rawInput);
        case "negate":
          return -rawInput;
      }
    }
    if (typeof rawInput === "string") {
      switch (cmdName) {
        case "len":
          return rawInput.length;
        case "upper":
          return rawInput.toUpperCase();
        case "lower":
          return rawInput.toLowerCase();
        case "trim":
          return rawInput.trim();
        case "split":
          return rawInput.split(args[0] ?? "");
        case "reverse":
          return Array.from(rawInput).reverse().join("");
        // ═══════════════════════════════════════════
        // 柱②: 漢字/日本語パイプコマンド
        // ═══════════════════════════════════════════
        case "kanji":
        case "\u6F22\u5B57": {
          const chars = Array.from(rawInput);
          if (chars.length === 1) return kanjiToStringMDim(chars[0]);
          return wordToStringMDim(rawInput);
        }
        case "sentence":
        case "\u6587": {
          return sentenceToStringMDim(rawInput);
        }
        case "tone":
        case "\u58F0\u8ABF": {
          return toneToStringMDim(rawInput, args.map(String));
        }
      }
    }
    if (rawInput !== null && typeof rawInput === "object" && rawInput.reiType === "StringMDim") {
      const sm = rawInput;
      switch (cmdName) {
        case "center":
          return sm.center;
        case "neighbors":
          return sm.neighbors;
        case "dim":
          return sm.neighbors.length;
        case "mode":
          return sm.mode;
        case "metadata":
          return sm.metadata ?? {};
        case "similarity":
        case "\u985E\u4F3C": {
          let other;
          if (typeof args[0] === "string") {
            other = kanjiToStringMDim(args[0]);
          } else if (args[0]?.reiType === "StringMDim") {
            other = args[0];
          } else {
            throw new Error("similarity: \u6BD4\u8F03\u5BFE\u8C61\u304C\u5FC5\u8981\u3067\u3059\uFF08\u6587\u5B57\u5217\u307E\u305F\u306FStringMDim\uFF09");
          }
          return kanjiSimilarity(sm, other);
        }
        case "radicals":
        case "\u90E8\u9996": {
          if (sm.mode === "kanji" && sm.metadata?.known) {
            return { radical: sm.metadata.radical, name: sm.metadata.radicalName };
          }
          return sm.neighbors.map((c) => {
            const info = KANJI_DB[c];
            return info ? { char: c, radical: info.radical, name: info.radicalName } : { char: c, radical: "?", name: "unknown" };
          });
        }
        case "readings":
        case "\u8AAD\u307F": {
          if (sm.mode === "kanji" && sm.metadata?.known) {
            return { on: sm.metadata.on, kun: sm.metadata.kun };
          }
          return sm.neighbors.map((c) => {
            const info = KANJI_DB[c];
            return info ? { char: c, on: info.on, kun: info.kun } : { char: c, on: [], kun: [] };
          });
        }
        case "strokes":
        case "\u753B\u6570": {
          if (sm.mode === "kanji" && sm.metadata?.known) {
            return sm.metadata.strokes;
          }
          return sm.neighbors.reduce((total, c) => {
            const info = KANJI_DB[c];
            return total + (info?.strokes ?? 0);
          }, 0);
        }
        case "category":
        case "\u516D\u66F8": {
          if (sm.mode === "kanji" && sm.metadata?.known) {
            return sm.metadata.category;
          }
          return sm.neighbors.map((c) => {
            const info = KANJI_DB[c];
            return info ? { char: c, category: info.category } : { char: c, category: "unknown" };
          });
        }
        case "meaning":
        case "\u610F\u5473": {
          if (sm.mode === "kanji" && sm.metadata?.known) {
            return sm.metadata.meaning;
          }
          return sm.neighbors.map((c) => {
            const info = KANJI_DB[c];
            return info ? { char: c, meaning: info.meaning } : { char: c, meaning: "unknown" };
          });
        }
        case "phonetic_group":
        case "\u97F3\u7B26": {
          return getPhoneticGroup(sm.center);
        }
        case "compose":
        case "\u5408\u6210": {
          return reverseKanjiLookup(sm.neighbors);
        }
        case "decompose":
        case "\u5206\u89E3": {
          return sm.neighbors.map((c) => kanjiToStringMDim(c));
        }
        case "kanji":
        case "\u6F22\u5B57": {
          return kanjiToStringMDim(sm.center);
        }
        case "sigma": {
          return {
            reiType: "SigmaResult",
            field: { center: sm.center, neighbors: sm.neighbors, mode: sm.mode, type: "string" },
            flow: { direction: "rest", momentum: 0, velocity: 0 },
            memory: [],
            layer: 0,
            will: { tendency: "rest", strength: 0, history: [] },
            relation: sm.neighbors.map((n) => ({ from: sm.center, to: n, type: sm.mode }))
          };
        }
      }
    }
    if (cmdName === "\u290A" || cmdName === "converge") {
      if (this.isMDim(rawInput)) return computeMDim(rawInput);
      return rawInput;
    }
    if (cmdName === "\u290B" || cmdName === "diverge") {
      if (typeof rawInput === "number") {
        return { reiType: "MDim", center: rawInput, neighbors: [rawInput, rawInput, rawInput, rawInput], mode: "weighted" };
      }
      return rawInput;
    }
    if (cmdName === "think" || cmdName === "\u601D\u8003") {
      const config = {};
      if (args.length >= 1) {
        const firstArg = args[0];
        if (typeof firstArg === "string") {
          config.strategy = firstArg;
        } else if (typeof firstArg === "number") {
          config.maxIterations = firstArg;
          config.strategy = "converge";
        }
      }
      if (args.length >= 2) {
        const secondArg = args[1];
        if (typeof secondArg === "number") {
          if (config.strategy === "seek") {
            config.targetValue = secondArg;
          } else {
            config.maxIterations = secondArg;
          }
        }
      }
      if (args.length >= 3 && typeof args[2] === "number") {
        config.maxIterations = args[2];
      }
      return thinkLoop(rawInput, config);
    }
    if (cmdName === "think_trajectory" || cmdName === "\u8ECC\u8DE1") {
      if (rawInput?.reiType === "ThoughtResult") return thoughtTrajectory(rawInput);
      const config = {};
      if (args.length >= 1 && typeof args[0] === "string") config.strategy = args[0];
      if (args.length >= 1 && typeof args[0] === "number") config.maxIterations = args[0];
      return thoughtTrajectory(thinkLoop(rawInput, config));
    }
    if (cmdName === "think_modes") {
      if (rawInput?.reiType === "ThoughtResult") return thoughtModes(rawInput);
      return thoughtModes(thinkLoop(rawInput, {}));
    }
    if (cmdName === "think_dominant" || cmdName === "\u652F\u914D\u30E2\u30FC\u30C9") {
      if (rawInput?.reiType === "ThoughtResult") return dominantMode(rawInput);
      return dominantMode(thinkLoop(rawInput, {}));
    }
    if (cmdName === "think_format" || cmdName === "\u601D\u8003\u8868\u793A") {
      if (rawInput?.reiType === "ThoughtResult") return formatThought(rawInput);
      return formatThought(thinkLoop(rawInput, {}));
    }
    if (rawInput?.reiType === "ThoughtResult") {
      const tr = rawInput;
      switch (cmdName) {
        case "final_value":
        case "\u6700\u7D42\u5024":
          return tr.finalValue;
        case "iterations":
        case "\u53CD\u5FA9\u6570":
          return tr.totalIterations;
        case "stop_reason":
        case "\u505C\u6B62\u7406\u7531":
          return tr.stopReason;
        case "trajectory":
        case "\u8ECC\u8DE1":
          return tr.trajectory;
        case "convergence":
        case "\u53CE\u675F\u7387":
          return tr.convergenceRate;
        case "awareness":
        case "\u899A\u9192\u5EA6":
          return tr.peakAwareness;
        case "tendency":
        case "\u610F\u5FD7":
          return { tendency: tr.loopTendency, strength: tr.loopStrength };
        case "steps":
        case "\u5168\u5C65\u6B74":
          return tr.steps;
        case "dominant_mode":
        case "\u652F\u914D\u30E2\u30FC\u30C9":
          return dominantMode(tr);
        case "sigma":
          return getThoughtSigma(tr);
      }
    }
    if (cmdName === "random" || cmdName === "\u30E9\u30F3\u30C0\u30E0") {
      if (rawInput?.reiType === "MDim") return randomFromMDim(rawInput);
      if (Array.isArray(rawInput)) return randomUniform(rawInput);
      if (typeof rawInput === "number") {
        return Math.floor(rawInput * Math.random());
      }
      return randomUniform([rawInput]);
    }
    if (cmdName === "seed") {
      const s = typeof rawInput === "number" ? rawInput : 42;
      seedRandom(s);
      return s;
    }
    if (cmdName === "random_walk") {
      const start = typeof rawInput === "number" ? rawInput : 0;
      const steps = args.length >= 1 ? Number(args[0]) : 20;
      const stepSize = args.length >= 2 ? Number(args[1]) : 1;
      return randomWalk(start, steps, stepSize);
    }
    if (cmdName === "entropy" || cmdName === "\u30A8\u30F3\u30C8\u30ED\u30D4\u30FC") {
      if (Array.isArray(rawInput)) return analyzeEntropy(rawInput);
      if (rawInput?.reiType === "MDim") return analyzeEntropy(rawInput.neighbors);
      return analyzeEntropy([rawInput]);
    }
    if (cmdName === "monte_carlo") {
      const n = args.length >= 1 ? Number(args[0]) : 100;
      if (rawInput?.reiType === "MDim") return monteCarloSample(rawInput, n);
      return monteCarloSample({ reiType: "MDim", center: 0, neighbors: Array.isArray(rawInput) ? rawInput : [rawInput] }, n);
    }
    if (cmdName === "game" || cmdName === "\u30B2\u30FC\u30E0") {
      const gameName = typeof rawInput === "string" ? rawInput : args.length >= 1 ? String(args[0]) : "tic_tac_toe";
      const config = {};
      if (typeof rawInput === "number") config.stones = rawInput;
      if (args.length >= 2 && typeof args[1] === "number") config.stones = args[1];
      return createGameSpace(gameName, config);
    }
    if (rawInput?.reiType === "GameSpace") {
      const gs = rawInput;
      switch (cmdName) {
        case "play":
        case "\u6253\u3064": {
          const pos = args.length >= 1 ? Number(args[0]) : void 0;
          return playMove(gs, pos);
        }
        case "auto_play":
        case "\u81EA\u52D5\u5BFE\u5C40": {
          const s1 = args.length >= 1 ? String(args[0]) : gs.strategy;
          const s2 = args.length >= 2 ? String(args[1]) : gs.strategy;
          return autoPlay(gs, s1, s2);
        }
        case "best_move":
        case "\u6700\u5584\u624B":
          return selectBestMove(gs);
        case "legal_moves":
        case "\u5408\u6CD5\u624B":
          return getLegalMoves(gs);
        case "board":
        case "\u76E4\u9762":
          return gs.state.board;
        case "status":
        case "\u72B6\u614B":
          return gs.state.status;
        case "winner":
        case "\u52DD\u8005":
          return gs.state.winner;
        case "turn":
        case "\u624B\u756A":
          return gs.state.currentPlayer;
        case "history":
        case "\u68CB\u8B5C":
          return gs.state.moveHistory;
        case "game_format":
        case "\u76E4\u9762\u8868\u793A":
          return formatGame(gs);
        case "as_mdim":
          return gameAsMDim(gs);
        case "sigma":
        case "game_sigma":
          return getGameSigma(gs);
      }
    }
    if (cmdName === "simulate" || cmdName === "\u30B7\u30DF\u30E5\u30EC\u30FC\u30C8") {
      const gameName = typeof rawInput === "string" ? rawInput : "tic_tac_toe";
      const n = args.length >= 1 ? Number(args[0]) : 10;
      const s1 = args.length >= 2 ? String(args[1]) : "minimax";
      const s2 = args.length >= 3 ? String(args[2]) : "random";
      return simulateGames(gameName, n, s1, s2);
    }
    if (rawInput?.reiType === "RandomResult") {
      const rr = rawInput;
      switch (cmdName) {
        case "value":
          return rr.value;
        case "probability":
        case "\u78BA\u7387":
          return rr.probability;
        case "entropy":
        case "\u30A8\u30F3\u30C8\u30ED\u30D4\u30FC":
          return rr.entropy;
      }
    }
    if (rawInput?.reiType === "EntropyAnalysis") {
      const ea = rawInput;
      switch (cmdName) {
        case "shannon":
          return ea.shannon;
        case "relative":
          return ea.relativeEntropy;
        case "distribution":
          return ea.distribution;
      }
    }
    if (cmdName === "puzzle" || cmdName === "\u30D1\u30BA\u30EB" || cmdName === "sudoku" || cmdName === "\u6570\u72EC") {
      if (typeof rawInput === "string") {
        const grid = parseGrid(rawInput);
        return createSudokuSpace(grid);
      }
      if (Array.isArray(rawInput)) {
        if (Array.isArray(rawInput[0])) {
          return createSudokuSpace(rawInput);
        }
        const grid = parseGrid(rawInput);
        return createSudokuSpace(grid);
      }
      if (typeof rawInput === "number") {
        const seed = args.length > 0 ? Number(args[0]) : void 0;
        const grid = generateSudoku(rawInput, seed);
        return createSudokuSpace(grid);
      }
      throw new Error("puzzle: \u6587\u5B57\u5217\u30FB\u914D\u5217\u30FB\u6570\u5024\u306E\u3044\u305A\u308C\u304B\u3092\u5165\u529B\u3057\u3066\u304F\u3060\u3055\u3044");
    }
    if (cmdName === "latin_square" || cmdName === "\u30E9\u30C6\u30F3\u65B9\u9663") {
      if (Array.isArray(rawInput)) {
        if (Array.isArray(rawInput[0])) {
          return createLatinSquareSpace(rawInput);
        }
        const grid = parseGrid(rawInput);
        return createLatinSquareSpace(grid);
      }
      throw new Error("latin_square: \u4E8C\u6B21\u5143\u914D\u5217\u3092\u5165\u529B\u3057\u3066\u304F\u3060\u3055\u3044");
    }
    if (cmdName === "generate_sudoku" || cmdName === "\u6570\u72EC\u751F\u6210") {
      const clues = typeof rawInput === "number" ? rawInput : 30;
      const seed = args.length > 0 ? Number(args[0]) : void 0;
      const grid = generateSudoku(clues, seed);
      return createSudokuSpace(grid);
    }
    if (rawInput?.reiType === "PuzzleSpace") {
      const ps = rawInput;
      switch (cmdName) {
        // 解く
        case "solve":
        case "\u89E3\u304F":
          return solvePuzzle(ps);
        // 制約伝播のみ
        case "propagate":
        case "\u4F1D\u64AD": {
          const maxSteps = args.length > 0 ? Number(args[0]) : 100;
          return propagateOnly(ps, maxSteps);
        }
        // 1ステップ伝播
        case "step":
        case "\u30B9\u30C6\u30C3\u30D7":
          propagateStep(ps);
          return ps;
        // Naked Pair
        case "propagate_pair":
        case "\u88F8\u30DA\u30A2":
          propagateNakedPair(ps);
          return ps;
        // セル取得（𝕄形式）
        case "cell":
        case "\u30BB\u30EB": {
          const row = args.length > 0 ? Number(args[0]) : 0;
          const col = args.length > 1 ? Number(args[1]) : 0;
          return cellAsMDim(ps, row, col);
        }
        // 候補取得
        case "candidates":
        case "\u5019\u88DC": {
          const row = args.length > 0 ? Number(args[0]) : 0;
          const col = args.length > 1 ? Number(args[1]) : 0;
          return getCandidates(ps, row, col);
        }
        // グリッド取得
        case "grid":
        case "\u76E4\u9762":
          return getGrid(ps);
        // 表示
        case "puzzle_format":
        case "\u6570\u72EC\u8868\u793A":
          return formatSudoku(ps);
        // 難易度
        case "difficulty":
        case "\u96E3\u6613\u5EA6":
          return estimateDifficulty(ps);
        // σ
        case "sigma":
          return getPuzzleSigma(ps);
        // 状態
        case "status":
        case "\u72B6\u614B":
          return {
            solved: ps.solved,
            confirmedCells: ps.confirmedCells,
            totalCandidates: ps.totalCandidates,
            step: ps.step,
            size: ps.size,
            puzzleType: ps.puzzleType
          };
        // 履歴
        case "history":
        case "\u5C65\u6B74":
          return ps.history;
        // 𝕄形式変換
        case "as_mdim": {
          const row = args.length > 0 ? Number(args[0]) : 0;
          const col = args.length > 1 ? Number(args[1]) : 0;
          return cellAsMDim(ps, row, col);
        }
      }
    }
    if (this.env.has(cmdName)) {
      const fn = this.env.get(cmdName);
      if (this.isFunction(fn)) return this.callFunction(fn, [rawInput, ...args]);
    }
    throw new Error(`\u672A\u77E5\u306E\u30D1\u30A4\u30D7\u30B3\u30DE\u30F3\u30C9: ${cmdName}`);
  }
  evalFnCall(ast) {
    const callee = this.eval(ast.callee);
    const args = ast.args.map((a) => this.eval(a));
    if (ast.callee.type === "Ident" && ast.callee.name === "genesis") return createGenesis();
    if (this.isFunction(callee)) return this.callFunction(callee, args);
    throw new Error(`\u547C\u3073\u51FA\u3057\u4E0D\u53EF\u80FD: ${JSON.stringify(callee)}`);
  }
  callFunction(fn, args) {
    if (fn.body === null || fn.body === void 0) return this.callBuiltin(fn.name, args);
    const callEnv = new Environment(fn.closure);
    for (let i = 0; i < fn.params.length; i++) {
      callEnv.define(fn.params[i], args[i] ?? null);
    }
    const savedEnv = this.env;
    this.env = callEnv;
    const result = this.eval(fn.body);
    this.env = savedEnv;
    return result;
  }
  callBuiltin(name, args) {
    if (name === "genesis") return createGenesis();
    const a = args[0] !== void 0 ? this.toNumber(args[0]) : 0;
    const b = args[1] !== void 0 ? this.toNumber(args[1]) : 0;
    switch (name) {
      case "abs":
        return Math.abs(a);
      case "sqrt":
        return Math.sqrt(a);
      case "sin":
        return Math.sin(a);
      case "cos":
        return Math.cos(a);
      case "log":
        return Math.log(a);
      case "exp":
        return Math.exp(a);
      case "floor":
        return Math.floor(a);
      case "ceil":
        return Math.ceil(a);
      case "round":
        return Math.round(a);
      case "min":
        return Math.min(a, b);
      case "max":
        return Math.max(a, b);
      case "len":
        if (Array.isArray(args[0])) return args[0].length;
        if (typeof args[0] === "string") return args[0].length;
        return 0;
      case "print":
        return args[0] ?? null;
      default:
        throw new Error(`\u672A\u77E5\u306E\u7D44\u8FBC\u307F\u95A2\u6570: ${name}`);
    }
  }
  evalMemberAccess(ast) {
    const rawObj = this.eval(ast.object);
    const obj = unwrapReiVal(rawObj);
    if (ast.member === "__sigma__") {
      return getSigmaOf(rawObj);
    }
    if (this.isObj(obj) && obj.reiType === "EvolveResult") {
      switch (ast.member) {
        case "value":
          return obj.value;
        case "selectedMode":
          return obj.selectedMode;
        case "strategy":
          return obj.strategy;
        case "reason":
          return obj.reason;
        case "candidates":
          return obj.candidates;
        case "awareness":
          return obj.awareness;
        case "tendency":
          return obj.tendency;
      }
    }
    if (this.isObj(obj) && obj.reiType === "StringMDim") {
      switch (ast.member) {
        case "center":
          return obj.center;
        case "neighbors":
          return obj.neighbors;
        case "mode":
          return obj.mode;
        case "dim":
          return obj.neighbors.length;
        case "metadata":
          return obj.metadata ?? {};
        // 漢字メタデータへの直接アクセス
        case "radical":
          return obj.metadata?.radical ?? null;
        case "radicalName":
          return obj.metadata?.radicalName ?? null;
        case "strokes":
          return obj.metadata?.strokes ?? 0;
        case "on":
          return obj.metadata?.on ?? [];
        case "kun":
          return obj.metadata?.kun ?? [];
        case "category":
          return obj.metadata?.category ?? null;
        case "meaning":
          return obj.metadata?.meaning ?? null;
        case "known":
          return obj.metadata?.known ?? false;
      }
    }
    if (this.isObj(obj) && obj.reiType === "KanjiSimilarity") {
      switch (ast.member) {
        case "strength":
          return obj.strength;
        case "pair":
          return obj.pair;
        case "sharedComponents":
          return obj.sharedComponents;
        case "jaccard":
          return obj.jaccard;
        case "sameRadical":
          return obj.sameRadical;
        case "sameCategory":
          return obj.sameCategory;
        case "strokeDiff":
          return obj.strokeDiff;
        case "sharedPhoneticGroup":
          return obj.sharedPhoneticGroup;
      }
    }
    if (this.isObj(obj) && obj.reiType === "SigmaResult") {
      switch (ast.member) {
        case "flow":
          return obj.flow;
        case "memory":
          return obj.memory;
        case "layer":
          return obj.layer;
        case "will":
          return obj.will;
        case "field":
          return obj.field;
        case "relation":
          return obj.relation ?? [];
      }
    }
    if (this.isObj(obj) && obj.stage !== void 0 && obj.momentum !== void 0 && obj.directions !== void 0) {
      switch (ast.member) {
        case "stage":
          return obj.stage;
        case "directions":
          return obj.directions;
        case "momentum":
          return obj.momentum;
        case "velocity":
          return obj.velocity;
      }
    }
    if (this.isObj(obj) && obj.tendency !== void 0 && obj.strength !== void 0) {
      switch (ast.member) {
        case "tendency":
          return obj.tendency;
        case "strength":
          return obj.strength;
        case "history":
          return obj.history;
      }
    }
    if (this.isObj(obj) && obj.layers !== void 0 && obj.total_nodes !== void 0) {
      switch (ast.member) {
        case "layers":
          return obj.layers;
        case "total_nodes":
          return obj.total_nodes;
        case "active_nodes":
          return obj.active_nodes;
        case "topology":
          return obj.topology;
      }
    }
    if (this.isObj(obj) && obj.global_stage !== void 0 && obj.converged_nodes !== void 0) {
      switch (ast.member) {
        case "global_stage":
          return obj.global_stage;
        case "converged_nodes":
          return obj.converged_nodes;
        case "expanding_nodes":
          return obj.expanding_nodes;
      }
    }
    if (this.isDNode(obj)) {
      const dn = obj;
      switch (ast.member) {
        case "center":
          return dn.center;
        case "neighbors":
          return dn.neighbors;
        case "stage":
          return dn.stage;
        case "momentum":
          return dn.momentum;
        case "mode":
          return dn.mode;
        case "dim":
          return dn.neighbors.length;
      }
    }
    if (this.isMDim(obj)) {
      switch (ast.member) {
        case "center":
          return obj.center;
        case "neighbors":
          return obj.neighbors;
        case "mode":
          return obj.mode;
        case "dim":
          return obj.neighbors.length;
      }
    }
    if (this.isExt(obj)) {
      switch (ast.member) {
        case "order":
          return obj.order;
        case "base":
          return obj.base;
        case "subscripts":
          return obj.subscripts;
        case "valStar":
          return obj.valStar();
      }
    }
    if (this.isGenesis(obj)) {
      switch (ast.member) {
        case "state":
        case "phase":
          return obj.state;
        case "omega":
          return obj.omega;
        case "history":
          return obj.history;
      }
    }
    if (Array.isArray(obj)) {
      switch (ast.member) {
        case "length":
          return obj.length;
        case "first":
          return obj[0] ?? null;
        case "last":
          return obj[obj.length - 1] ?? null;
      }
    }
    throw new Error(`\u30E1\u30F3\u30D0\u30FC ${ast.member} \u306B\u30A2\u30AF\u30BB\u30B9\u3067\u304D\u307E\u305B\u3093`);
  }
  evalIndexAccess(ast) {
    const obj = this.eval(ast.object);
    const idx = this.toNumber(this.eval(ast.index));
    if (Array.isArray(obj)) return obj[idx] ?? null;
    if (typeof obj === "string") return obj[idx] ?? null;
    if (this.isMDim(obj)) return obj.neighbors[idx] ?? null;
    throw new Error("\u30A4\u30F3\u30C7\u30C3\u30AF\u30B9\u30A2\u30AF\u30BB\u30B9\u4E0D\u53EF");
  }
  evalExtend(ast) {
    const target = this.eval(ast.target);
    if (this.isExt(target)) {
      if (ast.subscript) return createExtended(target.base, target.subscripts + ast.subscript);
      return createExtended(target.base, target.subscripts + "o");
    }
    throw new Error("\u62E1\u5F35\u306F\u62E1\u5F35\u6570\u306B\u306E\u307F\u9069\u7528\u53EF\u80FD");
  }
  evalReduce(ast) {
    const target = this.eval(ast.target);
    if (this.isExt(target)) {
      if (target.order <= 1) return target.base;
      return createExtended(target.base, target.subscripts.slice(0, -1));
    }
    throw new Error("\u7E2E\u7D04\u306F\u62E1\u5F35\u6570\u306B\u306E\u307F\u9069\u7528\u53EF\u80FD");
  }
  evalConverge(ast) {
    const left = this.eval(ast.left);
    const right = this.eval(ast.right);
    if (this.isMDim(left) && this.isMDim(right)) {
      return {
        reiType: "MDim",
        center: (left.center + right.center) / 2,
        neighbors: [...left.neighbors, ...right.neighbors],
        mode: left.mode
      };
    }
    return this.toNumber(left) + this.toNumber(right);
  }
  evalDiverge(ast) {
    const left = this.eval(ast.left);
    const right = this.eval(ast.right);
    if (this.isMDim(left)) {
      this.toNumber(right);
      const half = Math.floor(left.neighbors.length / 2);
      return [
        { reiType: "MDim", center: left.center, neighbors: left.neighbors.slice(0, half), mode: left.mode },
        { reiType: "MDim", center: left.center, neighbors: left.neighbors.slice(half), mode: left.mode }
      ];
    }
    return this.toNumber(left) - this.toNumber(right);
  }
  evalReflect(ast) {
    const left = this.eval(ast.left);
    this.eval(ast.right);
    if (this.isMDim(left)) {
      return { reiType: "MDim", center: left.center, neighbors: [...left.neighbors].reverse(), mode: left.mode };
    }
    return this.toNumber(left);
  }
  evalIfExpr(ast) {
    const cond = this.eval(ast.cond);
    return this.isTruthy(cond) ? this.eval(ast.then) : this.eval(ast.else);
  }
  evalMatchExpr(ast) {
    const target = this.eval(ast.target);
    for (const { pattern, body } of ast.cases) {
      const patVal = this.eval(pattern);
      if (this.matches(target, patVal)) return this.eval(body);
    }
    throw new Error("\u30DE\u30C3\u30C1\u3059\u308B\u5206\u5C90\u304C\u898B\u3064\u304B\u308A\u307E\u305B\u3093");
  }
  // --- Helpers ---
  toNumber(val) {
    if (val !== null && typeof val === "object" && val.reiType === "ReiVal") return this.toNumber(val.value);
    if (typeof val === "number") return val;
    if (typeof val === "boolean") return val ? 1 : 0;
    if (val === null) return 0;
    if (this.isExt(val)) return val.valStar();
    if (this.isMDim(val)) return computeMDim(val);
    if (typeof val === "string") return parseFloat(val) || 0;
    return 0;
  }
  isTruthy(val) {
    const v = unwrapReiVal(val);
    if (v === null || v === false || v === 0) return false;
    if (this.isQuad(v)) return v.value === "top" || v.value === "topPi";
    return true;
  }
  matches(target, pattern) {
    if (typeof target === typeof pattern && target === pattern) return true;
    if (this.isQuad(target) && this.isQuad(pattern)) return target.value === pattern.value;
    return false;
  }
  isObj(v) {
    const u = unwrapReiVal(v);
    return u !== null && typeof u === "object" && !Array.isArray(u);
  }
  isMDim(v) {
    const u = unwrapReiVal(v);
    return u !== null && typeof u === "object" && u.reiType === "MDim";
  }
  isExt(v) {
    const u = unwrapReiVal(v);
    return u !== null && typeof u === "object" && u.reiType === "Ext";
  }
  isGenesis(v) {
    const u = unwrapReiVal(v);
    return u !== null && typeof u === "object" && u.reiType === "State";
  }
  isFunction(v) {
    const u = unwrapReiVal(v);
    return u !== null && typeof u === "object" && u.reiType === "Function";
  }
  isQuad(v) {
    const u = unwrapReiVal(v);
    return u !== null && typeof u === "object" && u.reiType === "Quad";
  }
  // ── v0.3 ──
  isSpace(v) {
    const u = unwrapReiVal(v);
    return u !== null && typeof u === "object" && u.reiType === "Space";
  }
  isDNode(v) {
    const u = unwrapReiVal(v);
    return u !== null && typeof u === "object" && u.reiType === "DNode";
  }
  // ── Tier 1 ──
  isReiVal(v) {
    return v !== null && typeof v === "object" && v.reiType === "ReiVal";
  }
  // ── 柱② ──
  isStringMDim(v) {
    const u = unwrapReiVal(v);
    return u !== null && typeof u === "object" && u.reiType === "StringMDim";
  }
  /** 値からσメタデータを取得（Tier 1） */
  getSigmaMetadata(v) {
    return getSigmaOf(v);
  }
  /** ReiValを透過的にアンラップ */
  unwrap(v) {
    return unwrapReiVal(v);
  }
};

// src/index.ts
function unwrapReiVal2(v) {
  if (v !== null && typeof v === "object" && v.reiType === "ReiVal") {
    return v.value;
  }
  if (Array.isArray(v) && v.__sigma__) {
    const clean = [...v];
    return clean;
  }
  return v;
}
var _evaluator = new Evaluator();
function reiFn(source) {
  const lexer = new Lexer(source);
  const tokens = lexer.tokenize();
  const parser = new Parser(tokens);
  const ast = parser.parseProgram();
  const result = _evaluator.eval(ast);
  return unwrapReiVal2(result);
}
reiFn.reset = function() {
  _evaluator = new Evaluator();
};
reiFn.evaluator = function() {
  return _evaluator;
};
var rei = reiFn;

exports.Evaluator = Evaluator;
exports.Lexer = Lexer;
exports.Parser = Parser;
exports.rei = rei;
//# sourceMappingURL=index.js.map
//# sourceMappingURL=index.js.map