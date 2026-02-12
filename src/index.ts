import { Lexer } from './lang/lexer';
import { Parser } from './lang/parser';
import { Evaluator } from './lang/evaluator';

export { Lexer } from './lang/lexer';
export { Parser } from './lang/parser';
export { Evaluator } from './lang/evaluator';

function unwrapReiVal(v: any): any {
  if (v !== null && typeof v === 'object' && v.reiType === 'ReiVal') {
    return v.value;
  }
  // Strip __sigma__ from arrays
  if (Array.isArray(v) && (v as any).__sigma__) {
    const clean = [...v];
    return clean;
  }
  return v;
}

// Stateful rei interface
let _evaluator = new Evaluator();

function reiFn(source: string): any {
  const lexer = new Lexer(source);
  const tokens = lexer.tokenize();
  const parser = new Parser(tokens);
  const ast = parser.parseProgram();
  const result = _evaluator.eval(ast);
  return unwrapReiVal(result);
}

reiFn.reset = function () {
  _evaluator = new Evaluator();
};

reiFn.evaluator = function () {
  return _evaluator;
};

export const rei = reiFn;
