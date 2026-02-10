// ============================================================
// Rei v0.3 — D-FUMT Computational Language
// Space-Layer-Diffusion Model (場-層-拡散計算モデル)
// Author: Nobuki Fujimoto
// ============================================================

import { Lexer, TokenType, type Token } from './lang/lexer';
import { Parser } from './lang/parser';
import { Evaluator, Environment } from './lang/evaluator';

// Re-export everything
export { Lexer, Parser, Evaluator, Environment, TokenType };
export type { Token };

// --- Convenience API ---

let _evaluator = new Evaluator();

export function rei(code: string): any {
  const lexer = new Lexer(code);
  const tokens = lexer.tokenize();
  const parser = new Parser(tokens);
  const ast = parser.parseProgram();
  return _evaluator.eval(ast);
}

rei.reset = function reset() {
  _evaluator = new Evaluator();
};

rei.evaluator = function evaluator() {
  return _evaluator;
};

rei.parse = function parse(code: string) {
  const lexer = new Lexer(code);
  const tokens = lexer.tokenize();
  const parser = new Parser(tokens);
  return parser.parseProgram();
};

rei.tokenize = function tokenize(code: string) {
  const lexer = new Lexer(code);
  return lexer.tokenize();
};
