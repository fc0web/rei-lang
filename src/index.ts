// ============================================================
// Rei (0₀式) — D-FUMT Computational Language
// Main Entry Point
// Author: Nobuki Fujimoto
// ============================================================

export { Lexer, TokenType } from './lang/lexer';
export type { Token, TokenTypeValue } from './lang/lexer';
export { Parser } from './lang/parser';
export { Evaluator } from './lang/evaluator';
export {
  Environment,
  type MultiDimNumber,
  type ReiExtended,
  type GenesisState,
  type ReiFunction,
  type ReiValue,
  type ASTNode,
  type NodeType,
  type ComputationMode,
  type CompressMode,
  type Quad,
  type QuadValue,
  type PhaseTag,
  type Temporal,
  type Timeless,
} from './core/types';

import { Lexer } from './lang/lexer';
import { Parser } from './lang/parser';
import { Evaluator } from './lang/evaluator';
import type { ReiValue } from './core/types';

/**
 * Shared evaluator instance for the `rei()` convenience function.
 * State persists across calls (variables, functions).
 * Call `rei.reset()` to clear state.
 */
let _evaluator = new Evaluator();

/**
 * Evaluate a string of Rei code.
 *
 * @example
 * ```ts
 * import { rei } from 'rei-lang';
 *
 * rei('let x = 𝕄{5; 1, 2, 3, 4}');
 * const result = rei('x |> compute :weighted');
 * console.log(result); // 7.5
 * ```
 */
export function rei(code: string): ReiValue {
  const lexer = new Lexer(code);
  const tokens = lexer.tokenize();
  const parser = new Parser(tokens);
  const ast = parser.parseProgram();
  return _evaluator.eval(ast);
}

/** Reset the shared evaluator state (clear all variables and functions). */
rei.reset = function reset(): void {
  _evaluator = new Evaluator();
};

/** Get the shared evaluator instance. */
rei.evaluator = function evaluator(): Evaluator {
  return _evaluator;
};

/**
 * Parse Rei code and return the AST without evaluating.
 */
rei.parse = function parse(code: string) {
  const lexer = new Lexer(code);
  const tokens = lexer.tokenize();
  const parser = new Parser(tokens);
  return parser.parseProgram();
};

/**
 * Tokenize Rei code and return the token stream.
 */
rei.tokenize = function tokenize(code: string) {
  const lexer = new Lexer(code);
  return lexer.tokenize();
};

export default rei;
