// Copyright 2024-2026 Nobuki Fujimoto (藤本伸樹)
// Licensed under the Apache License, Version 2.0
// See LICENSE file for details.
// ============================================================
// Rei (0₀式) Language Interpreter
// compress / pipe / extension-reduction operators
// REI_EXTENSION_SYNTAX_DESIGN implementation
// ============================================================

import { ComputationMode, SubscriptChar } from '../core/types';
import { mdnum, compute, computeGrid } from '../core/multidim';
import { subscript, extnum, extend, reduce, toNotation, parseSubscript } from '../core/extended';
import { unified, unifiedAdd, unifiedMul, computeUnified } from '../core/unified';
import { fromExpression, fromMultiDim, fromExtended, fromGenesis } from '../gft/graph';
import { renderToString } from '../gft/renderer';

// ============================================================
// Token Types
// ============================================================

export type TokenType =
  | 'NUMBER' | 'STRING' | 'IDENT' | 'SUBSCRIPT'
  | 'COMPRESS' | 'EXPAND' | 'BIND' | 'PIPE_RIGHT' | 'PIPE_LEFT'
  | 'EXTEND' | 'REDUCE' | 'PLUS' | 'MINUS' | 'STAR' | 'SLASH' | 'CARET'
  | 'EQ' | 'ARROW' | 'LPAREN' | 'RPAREN' | 'LBRACKET' | 'RBRACKET'
  | 'LBRACE' | 'RBRACE' | 'COMMA' | 'COLON' | 'SEMICOLON' | 'DOT'
  | 'COMMENT' | 'NEWLINE' | 'EOF';

export interface Token {
  type: TokenType;
  value: string;
  line: number;
  col: number;
}

// ============================================================
// Lexer
// ============================================================

const KEYWORDS = new Set([
  'compress', 'expand', 'bind', 'let', 'if', 'then', 'else',
  'true', 'false', 'mode', 'cw', 'ccw', 'gft', 'genesis',
  'weighted', 'multiplicative', 'harmonic', 'exponential',
]);

export function lex(source: string): Token[] {
  const tokens: Token[] = [];
  let i = 0;
  let line = 1;
  let col = 1;

  while (i < source.length) {
    const c = source[i];

    // Whitespace (not newline)
    if (c === ' ' || c === '\t' || c === '\r') { i++; col++; continue; }

    // Newline
    if (c === '\n') {
      tokens.push({ type: 'NEWLINE', value: '\n', line, col });
      i++; line++; col = 1; continue;
    }

    // Comment: // or #
    if ((c === '/' && source[i + 1] === '/') || c === '#') {
      let comment = '';
      while (i < source.length && source[i] !== '\n') { comment += source[i]; i++; col++; }
      tokens.push({ type: 'COMMENT', value: comment, line, col });
      continue;
    }

    // Pipe operators
    if (c === '|' && source[i + 1] === '>') {
      tokens.push({ type: 'PIPE_RIGHT', value: '|>', line, col }); i += 2; col += 2; continue;
    }
    if (c === '<' && source[i + 1] === '|') {
      tokens.push({ type: 'PIPE_LEFT', value: '<|', line, col }); i += 2; col += 2; continue;
    }

    // Arrow
    if (c === '-' && source[i + 1] === '>') {
      tokens.push({ type: 'ARROW', value: '->', line, col }); i += 2; col += 2; continue;
    }

    // Extension/Reduction operators (⊕ ⊖ or ASCII alternatives)
    if (c === '⊕' || (c === '<' && source[i + 1] === '+' && source[i + 2] === '>')) {
      const len = c === '⊕' ? 1 : 3;
      tokens.push({ type: 'EXTEND', value: '⊕', line, col }); i += len; col += len; continue;
    }
    if (c === '⊖' || (c === '<' && source[i + 1] === '-' && source[i + 2] === '>')) {
      const len = c === '⊖' ? 1 : 3;
      tokens.push({ type: 'REDUCE', value: '⊖', line, col }); i += len; col += len; continue;
    }

    // Simple operators
    if (c === '+') { tokens.push({ type: 'PLUS', value: '+', line, col }); i++; col++; continue; }
    if (c === '-') { tokens.push({ type: 'MINUS', value: '-', line, col }); i++; col++; continue; }
    if (c === '*') { tokens.push({ type: 'STAR', value: '*', line, col }); i++; col++; continue; }
    if (c === '/') { tokens.push({ type: 'SLASH', value: '/', line, col }); i++; col++; continue; }
    if (c === '^') { tokens.push({ type: 'CARET', value: '^', line, col }); i++; col++; continue; }
    if (c === '=') { tokens.push({ type: 'EQ', value: '=', line, col }); i++; col++; continue; }

    // Delimiters
    if (c === '(') { tokens.push({ type: 'LPAREN', value: '(', line, col }); i++; col++; continue; }
    if (c === ')') { tokens.push({ type: 'RPAREN', value: ')', line, col }); i++; col++; continue; }
    if (c === '[') { tokens.push({ type: 'LBRACKET', value: '[', line, col }); i++; col++; continue; }
    if (c === ']') { tokens.push({ type: 'RBRACKET', value: ']', line, col }); i++; col++; continue; }
    if (c === '{') { tokens.push({ type: 'LBRACE', value: '{', line, col }); i++; col++; continue; }
    if (c === '}') { tokens.push({ type: 'RBRACE', value: '}', line, col }); i++; col++; continue; }
    if (c === ',') { tokens.push({ type: 'COMMA', value: ',', line, col }); i++; col++; continue; }
    if (c === ':') { tokens.push({ type: 'COLON', value: ':', line, col }); i++; col++; continue; }
    if (c === ';') { tokens.push({ type: 'SEMICOLON', value: ';', line, col }); i++; col++; continue; }
    if (c === '.') { tokens.push({ type: 'DOT', value: '.', line, col }); i++; col++; continue; }

    // Subscript notation: 0ooo, 0₀, etc. (must check before general number)
    if (c === '0' && i + 1 < source.length && /[₀oxzwyvutsr]/.test(source[i + 1])) {
      let sub = '0';
      const startCol = col;
      i++; col++;
      while (i < source.length && /[₀oxzwyvutsr₁₂₃₄₅₆₇₈₉]/.test(source[i])) {
        sub += source[i]; i++; col++;
      }
      tokens.push({ type: 'SUBSCRIPT', value: sub, line, col: startCol });
      continue;
    }

    // Number
    if (/\d/.test(c)) {
      let num = '';
      const startCol = col;
      while (i < source.length && (/\d/.test(source[i]) || source[i] === '.')) {
        num += source[i]; i++; col++;
      }
      tokens.push({ type: 'NUMBER', value: num, line, col: startCol });
      continue;
    }

    // String
    if (c === '"' || c === "'") {
      const quote = c;
      let str = '';
      i++; col++;
      while (i < source.length && source[i] !== quote) {
        str += source[i]; i++; col++;
      }
      i++; col++; // closing quote
      tokens.push({ type: 'STRING', value: str, line, col });
      continue;
    }

    // Identifier / Keyword
    if (/[a-zA-Zα-ωΑ-Ω_]/.test(c)) {
      let ident = '';
      const startCol = col;
      while (i < source.length && /[a-zA-Zα-ωΑ-Ω_0-9]/.test(source[i])) {
        ident += source[i]; i++; col++;
      }
      if (ident === 'compress') {
        tokens.push({ type: 'COMPRESS', value: ident, line, col: startCol });
      } else if (ident === 'expand') {
        tokens.push({ type: 'EXPAND', value: ident, line, col: startCol });
      } else if (ident === 'bind' || ident === 'let') {
        tokens.push({ type: 'BIND', value: ident, line, col: startCol });
      } else {
        tokens.push({ type: 'IDENT', value: ident, line, col: startCol });
      }
      continue;
    }

    // Skip unknown
    i++; col++;
  }

  tokens.push({ type: 'EOF', value: '', line, col });
  return tokens.filter((t) => t.type !== 'COMMENT' && t.type !== 'NEWLINE');
}

// ============================================================
// AST Types
// ============================================================

export type ASTNode =
  | { type: 'number'; value: number }
  | { type: 'string'; value: string }
  | { type: 'ident'; name: string }
  | { type: 'subscript'; notation: string }
  | { type: 'binop'; op: string; left: ASTNode; right: ASTNode }
  | { type: 'unaryop'; op: string; operand: ASTNode }
  | { type: 'pipe'; left: ASTNode; right: ASTNode; direction: 'right' | 'left' }
  | { type: 'extend'; target: ASTNode; char: string }
  | { type: 'reduce'; target: ASTNode }
  | { type: 'compress'; name: string; params: string[]; body: ASTNode }
  | { type: 'bind'; name: string; value: ASTNode }
  | { type: 'call'; name: string; args: ASTNode[] }
  | { type: 'multidim'; center: ASTNode; neighbors: ASTNode[]; mode?: string }
  | { type: 'array'; elements: ASTNode[] }
  | { type: 'if'; cond: ASTNode; then: ASTNode; else_: ASTNode }
  | { type: 'block'; stmts: ASTNode[] }
  | { type: 'gft'; expr: ASTNode }
  ;

// ============================================================
// Parser
// ============================================================

export function parse(tokens: Token[]): ASTNode[] {
  let pos = 0;

  function peek(): Token { return tokens[pos] ?? { type: 'EOF', value: '', line: 0, col: 0 }; }
  function advance(): Token { return tokens[pos++]; }
  function expect(type: TokenType): Token {
    const t = advance();
    if (t.type !== type) throw new SyntaxError(`Expected ${type}, got ${t.type} '${t.value}' at line ${t.line}`);
    return t;
  }

  function parseStmt(): ASTNode {
    const t = peek();

    // bind x = expr
    if (t.type === 'BIND') {
      advance();
      const name = expect('IDENT').value;
      expect('EQ');
      const value = parseExpr();
      return { type: 'bind', name, value };
    }

    // compress name(params) -> body
    if (t.type === 'COMPRESS') {
      advance();
      const name = expect('IDENT').value;
      expect('LPAREN');
      const params: string[] = [];
      while (peek().type !== 'RPAREN') {
        params.push(expect('IDENT').value);
        if (peek().type === 'COMMA') advance();
      }
      expect('RPAREN');
      expect('ARROW');
      const body = parseExpr();
      return { type: 'compress', name, params, body };
    }

    return parseExpr();
  }

  function parseExpr(): ASTNode {
    return parsePipe();
  }

  function parsePipe(): ASTNode {
    let left = parseAddSub();
    while (peek().type === 'PIPE_RIGHT' || peek().type === 'PIPE_LEFT') {
      const dir = advance().type === 'PIPE_RIGHT' ? 'right' : 'left';
      const right = parseAddSub();
      left = { type: 'pipe', left, right, direction: dir as 'right' | 'left' };
    }
    return left;
  }

  function parseAddSub(): ASTNode {
    let left = parseMulDiv();
    while (peek().type === 'PLUS' || peek().type === 'MINUS') {
      const op = advance().value;
      const right = parseMulDiv();
      left = { type: 'binop', op, left, right };
    }
    return left;
  }

  function parseMulDiv(): ASTNode {
    let left = parsePower();
    while (peek().type === 'STAR' || peek().type === 'SLASH') {
      const op = advance().value;
      const right = parsePower();
      left = { type: 'binop', op, left, right };
    }
    return left;
  }

  function parsePower(): ASTNode {
    let left = parseExtendReduce();
    if (peek().type === 'CARET') {
      advance();
      const right = parseExtendReduce();
      left = { type: 'binop', op: '^', left, right };
    }
    return left;
  }

  function parseExtendReduce(): ASTNode {
    let expr = parseUnary();

    while (peek().type === 'EXTEND' || peek().type === 'REDUCE') {
      if (peek().type === 'EXTEND') {
        advance();
        const char = peek().type === 'IDENT' ? advance().value : 'o';
        expr = { type: 'extend', target: expr, char };
      } else {
        advance();
        expr = { type: 'reduce', target: expr };
      }
    }
    return expr;
  }

  function parseUnary(): ASTNode {
    if (peek().type === 'MINUS') {
      advance();
      return { type: 'unaryop', op: '-', operand: parseAtom() };
    }
    return parseAtom();
  }

  function parseAtom(): ASTNode {
    const t = peek();

    // Number
    if (t.type === 'NUMBER') {
      advance();
      return { type: 'number', value: parseFloat(t.value) };
    }

    // String
    if (t.type === 'STRING') {
      advance();
      return { type: 'string', value: t.value };
    }

    // Subscript notation
    if (t.type === 'SUBSCRIPT') {
      advance();
      return { type: 'subscript', notation: t.value };
    }

    // Parenthesized expression or multidim
    if (t.type === 'LPAREN') {
      advance();
      const expr = parseExpr();
      expect('RPAREN');
      return expr;
    }

    // Array / multidim literal: [center; n1, n2, n3]
    if (t.type === 'LBRACKET') {
      advance();
      const first = parseExpr();
      if (peek().type === 'SEMICOLON') {
        // Multidim: [center; neighbors...]
        advance();
        const neighbors: ASTNode[] = [];
        while (peek().type !== 'RBRACKET') {
          neighbors.push(parseExpr());
          if (peek().type === 'COMMA') advance();
        }
        expect('RBRACKET');
        const modeToken = peek();
        let mode: string | undefined;
        if (modeToken.type === 'IDENT' && ['weighted', 'multiplicative', 'harmonic', 'exponential'].includes(modeToken.value)) {
          advance();
          mode = modeToken.value;
        }
        return { type: 'multidim', center: first, neighbors, mode };
      } else {
        // Array
        const elements: ASTNode[] = [first];
        while (peek().type === 'COMMA') {
          advance();
          elements.push(parseExpr());
        }
        expect('RBRACKET');
        return { type: 'array', elements };
      }
    }

    // GFT visualization
    if (t.type === 'IDENT' && t.value === 'gft') {
      advance();
      expect('LPAREN');
      const expr = parseExpr();
      expect('RPAREN');
      return { type: 'gft', expr };
    }

    // If expression
    if (t.type === 'IDENT' && t.value === 'if') {
      advance();
      const cond = parseExpr();
      expect('IDENT'); // 'then'
      const then = parseExpr();
      expect('IDENT'); // 'else'
      const else_ = parseExpr();
      return { type: 'if', cond, then, else_ };
    }

    // Function call or identifier
    if (t.type === 'IDENT') {
      advance();
      if (peek().type === 'LPAREN') {
        advance();
        const args: ASTNode[] = [];
        while (peek().type !== 'RPAREN') {
          args.push(parseExpr());
          if (peek().type === 'COMMA') advance();
        }
        expect('RPAREN');
        return { type: 'call', name: t.value, args };
      }
      return { type: 'ident', name: t.value };
    }

    throw new SyntaxError(`Unexpected token: ${t.type} '${t.value}' at line ${t.line}:${t.col}`);
  }

  const statements: ASTNode[] = [];
  while (peek().type !== 'EOF') {
    statements.push(parseStmt());
    while (peek().type === 'SEMICOLON') advance();
  }
  return statements;
}

// ============================================================
// Evaluator
// ============================================================

export type ReiValue =
  | number
  | string
  | boolean
  | number[]
  | { type: 'multidim'; result: ReturnType<typeof compute> }
  | { type: 'extended'; value: ReturnType<typeof extnum> }
  | { type: 'unified'; value: ReturnType<typeof computeUnified> }
  | { type: 'function'; params: string[]; body: ASTNode; closure: Environment }
  | { type: 'gft'; svg: string }
  | null;

export type Environment = Map<string, ReiValue>;

function createStdlib(): Environment {
  const env: Environment = new Map();

  // Constants
  env.set('pi', Math.PI);
  env.set('π', Math.PI);
  env.set('e', Math.E);
  env.set('phi', (1 + Math.sqrt(5)) / 2);
  env.set('φ', (1 + Math.sqrt(5)) / 2);
  env.set('true', true as any);
  env.set('false', false as any);

  // Math functions
  env.set('sin', { type: 'function', params: ['x'], body: { type: 'ident', name: '__builtin_sin' }, closure: env } as any);
  env.set('cos', { type: 'function', params: ['x'], body: { type: 'ident', name: '__builtin_cos' }, closure: env } as any);
  env.set('sqrt', { type: 'function', params: ['x'], body: { type: 'ident', name: '__builtin_sqrt' }, closure: env } as any);
  env.set('abs', { type: 'function', params: ['x'], body: { type: 'ident', name: '__builtin_abs' }, closure: env } as any);
  env.set('log', { type: 'function', params: ['x'], body: { type: 'ident', name: '__builtin_log' }, closure: env } as any);
  env.set('exp', { type: 'function', params: ['x'], body: { type: 'ident', name: '__builtin_exp' }, closure: env } as any);

  return env;
}

function callBuiltin(name: string, args: ReiValue[]): ReiValue {
  const n = args[0] as number;
  switch (name) {
    case '__builtin_sin': return Math.sin(n);
    case '__builtin_cos': return Math.cos(n);
    case '__builtin_sqrt': return Math.sqrt(n);
    case '__builtin_abs': return Math.abs(n);
    case '__builtin_log': return Math.log(n);
    case '__builtin_exp': return Math.exp(n);
    default: return null;
  }
}

export function evaluate(nodes: ASTNode[], env?: Environment): ReiValue[] {
  const e = env ?? createStdlib();
  return nodes.map((node) => evalNode(node, e));
}

function evalNode(node: ASTNode, env: Environment): ReiValue {
  switch (node.type) {
    case 'number': return node.value;
    case 'string': return node.value;

    case 'ident': {
      const val = env.get(node.name);
      if (val === undefined) throw new ReferenceError(`Undefined: ${node.name}`);
      return val;
    }

    case 'subscript': {
      const parsed = parseSubscript(node.notation);
      if (!parsed) throw new SyntaxError(`Invalid subscript: ${node.notation}`);
      const en = extnum(parsed);
      return { type: 'extended', value: en } as any;
    }

    case 'binop': {
      const left = evalNode(node.left, env) as number;
      const right = evalNode(node.right, env) as number;
      switch (node.op) {
        case '+': return left + right;
        case '-': return left - right;
        case '*': return left * right;
        case '/': return right !== 0 ? left / right : NaN;
        case '^': return Math.pow(left, right);
        default: return NaN;
      }
    }

    case 'unaryop': {
      const val = evalNode(node.operand, env) as number;
      return node.op === '-' ? -val : val;
    }

    case 'pipe': {
      const input = evalNode(node.left, env);
      const fn = evalNode(node.right, env);
      if (fn && typeof fn === 'object' && 'type' in fn && fn.type === 'function') {
        const fnObj = fn as { params: string[]; body: ASTNode; closure: Environment };
        const newEnv = new Map(fnObj.closure);
        newEnv.set(fnObj.params[0], input);

        // Check for builtin
        if (fnObj.body.type === 'ident' && fnObj.body.name.startsWith('__builtin_')) {
          return callBuiltin(fnObj.body.name, [input]);
        }
        return evalNode(fnObj.body, newEnv);
      }
      throw new TypeError('Pipe target must be a function');
    }

    case 'extend': {
      const target = evalNode(node.target, env);
      if (target && typeof target === 'object' && 'type' in target && target.type === 'extended') {
        const en = (target as any).value;
        const extended = extend(en, node.char as SubscriptChar);
        return { type: 'extended', value: extended } as any;
      }
      throw new TypeError('Extension target must be an extended number');
    }

    case 'reduce': {
      const target = evalNode(node.target, env);
      if (target && typeof target === 'object' && 'type' in target && target.type === 'extended') {
        const en = (target as any).value;
        const reduced = reduce(en);
        return { type: 'extended', value: reduced } as any;
      }
      throw new TypeError('Reduction target must be an extended number');
    }

    case 'compress': {
      // compress = function definition (immutable binding)
      const fn: ReiValue = { type: 'function', params: node.params, body: node.body, closure: new Map(env) };
      env.set(node.name, fn);
      return fn;
    }

    case 'bind': {
      // Immutable binding (value fixation axiom)
      if (env.has(node.name)) {
        throw new Error(`Cannot rebind immutable '${node.name}' (value fixation axiom)`);
      }
      const val = evalNode(node.value, env);
      env.set(node.name, val);
      return val;
    }

    case 'call': {
      const fn = env.get(node.name);
      const args = node.args.map((a) => evalNode(a, env));

      // Builtin function check
      if (fn && typeof fn === 'object' && 'type' in fn && fn.type === 'function') {
        const fnObj = fn as { params: string[]; body: ASTNode; closure: Environment };
        if (fnObj.body.type === 'ident' && fnObj.body.name.startsWith('__builtin_')) {
          return callBuiltin(fnObj.body.name, args);
        }
        const newEnv = new Map(fnObj.closure);
        fnObj.params.forEach((p, i) => newEnv.set(p, args[i] ?? null));
        return evalNode(fnObj.body, newEnv);
      }
      throw new ReferenceError(`${node.name} is not a function`);
    }

    case 'multidim': {
      const center = evalNode(node.center, env) as number;
      const neighbors = node.neighbors.map((n) => evalNode(n, env) as number);
      const modeMap: Record<string, ComputationMode> = {
        weighted: ComputationMode.Weighted,
        multiplicative: ComputationMode.Multiplicative,
        harmonic: ComputationMode.Harmonic,
        exponential: ComputationMode.Exponential,
      };
      const mode = node.mode ? modeMap[node.mode] : ComputationMode.Weighted;
      const md = mdnum(center, neighbors, undefined, mode);
      const result = compute(md);
      return { type: 'multidim', result } as any;
    }

    case 'array': {
      return node.elements.map((e) => evalNode(e, env) as number);
    }

    case 'if': {
      const cond = evalNode(node.cond, env);
      return cond ? evalNode(node.then, env) : evalNode(node.else_, env);
    }

    case 'block': {
      let result: ReiValue = null;
      for (const stmt of node.stmts) {
        result = evalNode(stmt, env);
      }
      return result;
    }

    case 'gft': {
      const inner = evalNode(node.expr, env);
      if (inner && typeof inner === 'object' && 'type' in inner) {
        if (inner.type === 'multidim') {
          const md = mdnum(0, [1, 2, 3]); // simplified
          const g = fromMultiDim(md);
          return { type: 'gft', svg: renderToString(g) } as any;
        }
      }
      // Default: expression graph
      const g = fromExpression('expr');
      return { type: 'gft', svg: renderToString(g) } as any;
    }

    default:
      return null;
  }
}

// ============================================================
// REPL Runner
// ============================================================

export function run(source: string): ReiValue[] {
  const tokens = lex(source);
  const ast = parse(tokens);
  return evaluate(ast);
}

export function formatValue(val: ReiValue): string {
  if (val === null) return 'null';
  if (typeof val === 'number') return val.toString();
  if (typeof val === 'string') return `"${val}"`;
  if (typeof val === 'boolean') return val.toString();
  if (Array.isArray(val)) return `[${val.join(', ')}]`;
  if (typeof val === 'object' && 'type' in val) {
    switch (val.type) {
      case 'multidim': return `MultiDim(${(val as any).result.value}) [${(val as any).result.mode}]`;
      case 'extended': {
        const en = (val as any).value;
        const notation = toNotation(en.subscript);
        return `Extended(${notation.sensory}) = ${en.value}`;
      }
      case 'function': return `compress<${(val as any).params.join(', ')}>`;
      case 'gft': return `[GFT SVG: ${(val as any).svg.length} chars]`;
      default: return JSON.stringify(val);
    }
  }
  return String(val);
}
