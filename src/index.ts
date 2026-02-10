/**
 * ═══════════════════════════════════════════════════════════════════
 *  Rei (0₀式) Language — Public API
 *  Author: Nobuki Fujimoto
 * ═══════════════════════════════════════════════════════════════════
 */

import { Lexer } from './lexer';
import { Parser } from './parser';
import { Evaluator } from './evaluator';
import { Environment, ReiValue, reiToString, toNumber } from './environment';

export { Environment, ReiValue, reiToString, toNumber } from './environment';
export { Lexer, TokenType, Token } from './lexer';
export { Parser, ParseError } from './parser';
export { Evaluator, RuntimeError } from './evaluator';
export * as AST from './ast';

const defaultEvaluator = new Evaluator();

/**
 * Execute a Rei expression and return the result.
 */
export function rei(source: string, env?: Environment): ReiValue {
  const lexer = new Lexer(source);
  const tokens = lexer.tokenize();
  const parser = new Parser(tokens);
  const nodes = parser.parse();

  const evalEnv = env ?? new Environment();
  let result: ReiValue = { kind: 'void' };
  for (const node of nodes) {
    result = defaultEvaluator.eval(node, evalEnv);
  }
  return result;
}

/**
 * Execute and return { result, display } for REPL use.
 */
export function run(source: string, env: Environment): { result: ReiValue; display: string } {
  const result = rei(source, env);
  return { result, display: reiToString(result) };
}

/**
 * Convenience: execute and return string representation.
 */
export function reiStr(val: ReiValue): string {
  return reiToString(val);
}
