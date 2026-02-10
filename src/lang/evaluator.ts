// ============================================================
// Rei (0₀式) Evaluator — 評価器
// BNF v0.2 準拠
// Author: Nobuki Fujimoto
// ============================================================

import type {
  ASTNode, ReiValue, MultiDimNumber, ReiExtended, GenesisState,
  ReiFunction, Quad, QuadValue, ComputationMode, Environment as EnvType,
} from '../core/types';
import { Environment } from '../core/types';

// --- Extended number implementation ---
function createExtended(base: number, subscripts: string): ReiExtended {
  const order = subscripts.length;
  return {
    reiType: 'Ext',
    base,
    order,
    subscripts,
    valStar() {
      // val* — numeric projection: base ^ (1/10^order) for base=0 → order-based
      if (base === 0) return Math.pow(0.1, order);
      return base * Math.pow(0.1, order);
    },
  };
}

function parseExtLit(raw: string): ReiExtended {
  if (raw === '0₀') return createExtended(0, 'o');
  const baseChar = raw[0];
  const subs = raw.slice(1);
  const baseMap: Record<string, number> = {
    '0': 0, 'π': Math.PI, 'e': Math.E, 'φ': (1 + Math.sqrt(5)) / 2, 'i': NaN,
  };
  return createExtended(baseMap[baseChar] ?? 0, subs);
}

// --- MDim computation ---
function computeMDim(md: MultiDimNumber): number {
  const { center, neighbors, mode } = md;
  const weights = md.weights ?? neighbors.map(() => 1);
  const n = neighbors.length;
  if (n === 0) return center;

  switch (mode) {
    case 'weighted': {
      const wSum = weights.reduce((a, b) => a + b, 0);
      const wAvg = neighbors.reduce((sum, v, i) => sum + weights[i] * v, 0) / (wSum || 1);
      return center + wAvg;
    }
    case 'multiplicative': {
      const prod = neighbors.reduce((p, v) => p * (1 + v), 1);
      return center * prod;
    }
    case 'harmonic': {
      const harmSum = neighbors.reduce((s, v) => s + 1 / (Math.abs(v) || 1), 0);
      return center + n / harmSum;
    }
    case 'exponential': {
      const expSum = neighbors.reduce((s, v) => s + Math.exp(v), 0);
      return center * (expSum / n);
    }
    default:
      return center;
  }
}

// --- Quad logic (四価0π) ---
function quadNot(v: QuadValue): QuadValue {
  const map: Record<QuadValue, QuadValue> = {
    'top': 'bottom', 'bottom': 'top', 'topPi': 'bottomPi', 'bottomPi': 'topPi',
  };
  return map[v];
}

function quadAnd(a: QuadValue, b: QuadValue): QuadValue {
  if (a === 'bottom' || b === 'bottom') return 'bottom';
  if (a === 'bottomPi' || b === 'bottomPi') return 'bottomPi';
  if (a === 'top' && b === 'top') return 'top';
  if (a === 'topPi' || b === 'topPi') return 'topPi';
  return 'top';
}

function quadOr(a: QuadValue, b: QuadValue): QuadValue {
  if (a === 'top' || b === 'top') return 'top';
  if (a === 'topPi' || b === 'topPi') return 'topPi';
  if (a === 'bottom' && b === 'bottom') return 'bottom';
  return 'bottomPi';
}

// --- Genesis ---
function createGenesis(): GenesisState {
  return { reiType: 'State', state: 'void', omega: 0, history: ['void'] };
}

const PHASE_ORDER: GenesisState['state'][] = ['void', 'dot', 'line', 'surface', 'solid', 'omega'];

function genesisForward(g: GenesisState): void {
  const idx = PHASE_ORDER.indexOf(g.state);
  if (idx < PHASE_ORDER.length - 1) {
    g.state = PHASE_ORDER[idx + 1];
    g.history.push(g.state);
    if (g.state === 'omega') g.omega = 1;
  }
}

export class Evaluator {
  public env: Environment;

  constructor(parent?: Environment) {
    this.env = new Environment(parent ?? null);
    this.registerBuiltins();
  }

  private registerBuiltins(): void {
    // Math constants
    this.env.define('e', Math.E);
    this.env.define('PI', Math.PI);

    // Genesis constructor
    this.env.define('genesis', {
      reiType: 'Function', name: 'genesis', params: [],
      body: null as any, closure: this.env,
    } as any);

    // Math builtins
    const mathFns = ['abs', 'sqrt', 'sin', 'cos', 'log', 'exp', 'floor', 'ceil', 'round', 'min', 'max', 'len', 'print'];
    for (const name of mathFns) {
      this.env.define(name, {
        reiType: 'Function', name, params: ['x'],
        body: null as any, closure: this.env,
      } as any);
    }
  }

  eval(ast: ASTNode): ReiValue {
    switch (ast.type) {
      case 'Program': return this.evalProgram(ast);
      case 'NumLit': return ast.value;
      case 'StrLit': return ast.value;
      case 'BoolLit': return ast.value;
      case 'NullLit': return null;
      case 'ExtLit': return parseExtLit(ast.raw);
      case 'ConstLit': return this.evalConstLit(ast);
      case 'QuadLit': return { reiType: 'Quad', value: ast.value } as Quad;
      case 'MDimLit': return this.evalMDimLit(ast);
      case 'ArrayLit': return ast.elements.map((e: ASTNode) => this.eval(e));
      case 'Ident': return this.env.get(ast.name);
      case 'LetStmt': return this.evalLetStmt(ast);
      case 'MutStmt': return this.evalMutStmt(ast);
      case 'CompressDef': return this.evalCompressDef(ast);
      case 'BinOp': return this.evalBinOp(ast);
      case 'UnaryOp': return this.evalUnaryOp(ast);
      case 'Pipe': return this.evalPipe(ast);
      case 'FnCall': return this.evalFnCall(ast);
      case 'MemberAccess': return this.evalMemberAccess(ast);
      case 'IndexAccess': return this.evalIndexAccess(ast);
      case 'Extend': return this.evalExtend(ast);
      case 'Reduce': return this.evalReduce(ast);
      case 'ConvergeOp': return this.evalConverge(ast);
      case 'DivergeOp': return this.evalDiverge(ast);
      case 'ReflectOp': return this.evalReflect(ast);
      case 'IfExpr': return this.evalIfExpr(ast);
      case 'MatchExpr': return this.evalMatchExpr(ast);
      default:
        throw new Error(`未実装のノード型: ${ast.type}`);
    }
  }

  private evalProgram(ast: ASTNode): ReiValue {
    let result: ReiValue = null;
    for (const stmt of ast.body) {
      result = this.eval(stmt);
    }
    return result;
  }

  private evalConstLit(ast: ASTNode): ReiValue {
    switch (ast.value) {
      case '・': return createGenesis(); // 原初点
      case '∅': return null;
      case 'i': return { reiType: 'Ext', base: NaN, order: 0, subscripts: '', valStar: () => NaN } as ReiExtended;
      case 'Φ': return 'Φ'; // phase constants
      case 'Ψ': return 'Ψ';
      case 'Ω': return 'Ω';
      default: return null;
    }
  }

  private evalMDimLit(ast: ASTNode): MultiDimNumber {
    const center = this.toNumber(this.eval(ast.center));
    const neighbors = ast.neighbors.map((n: ASTNode) => this.toNumber(this.eval(n)));
    const weights = ast.weight ? [this.toNumber(this.eval(ast.weight))] : undefined;
    const mode = (ast.mode || 'weighted') as ComputationMode;
    return { reiType: 'MDim', center, neighbors, mode, weights };
  }

  private evalLetStmt(ast: ASTNode): ReiValue {
    const val = this.eval(ast.init);
    this.env.define(ast.name, val, false);
    return val;
  }

  private evalMutStmt(ast: ASTNode): ReiValue {
    const val = this.eval(ast.init);
    this.env.define(ast.name, val, true);
    return val;
  }

  private evalCompressDef(ast: ASTNode): ReiFunction {
    const fn: ReiFunction = {
      reiType: 'Function',
      name: ast.name,
      params: ast.params,
      body: ast.body,
      closure: this.env,
    };
    this.env.define(ast.name, fn);
    return fn;
  }

  private evalBinOp(ast: ASTNode): ReiValue {
    const left = this.eval(ast.left);
    const right = this.eval(ast.right);

    // Quad logic
    if (this.isQuad(left) && this.isQuad(right)) {
      const lq = (left as Quad).value;
      const rq = (right as Quad).value;
      switch (ast.op) {
        case '∧': return { reiType: 'Quad', value: quadAnd(lq, rq) } as Quad;
        case '∨': return { reiType: 'Quad', value: quadOr(lq, rq) } as Quad;
      }
    }

    // Extended ⊕ Extended
    if (this.isExt(left) && this.isExt(right) && ast.op === '⊕') {
      const le = left as ReiExtended;
      const re = right as ReiExtended;
      return createExtended(le.base + re.base, le.subscripts + re.subscripts);
    }

    // Scalar · Extended
    if (typeof left === 'number' && this.isExt(right) && ast.op === '·') {
      const re = right as ReiExtended;
      return createExtended(left * re.base, re.subscripts);
    }

    // MDim ⊕ MDim
    if (this.isMDim(left) && this.isMDim(right) && ast.op === '⊕') {
      const lm = left as MultiDimNumber;
      const rm = right as MultiDimNumber;
      const maxLen = Math.max(lm.neighbors.length, rm.neighbors.length);
      const neighbors: number[] = [];
      for (let i = 0; i < maxLen; i++) {
        neighbors.push((lm.neighbors[i] ?? 0) + (rm.neighbors[i] ?? 0));
      }
      return { reiType: 'MDim', center: lm.center + rm.center, neighbors, mode: lm.mode } as MultiDimNumber;
    }

    // String concatenation
    if (typeof left === 'string' && typeof right === 'string' && ast.op === '+') {
      return left + right;
    }

    // Numeric operations
    const l = this.toNumber(left);
    const r = this.toNumber(right);

    switch (ast.op) {
      case '+': return l + r;
      case '-': return l - r;
      case '*': return l * r;
      case '/': return r === 0 ? NaN : l / r;
      case '⊕': return l + r;
      case '⊗': return l * r;
      case '·': return l * r;
      case '==': return l === r;
      case '!=': return l !== r;
      case '>': return l > r;
      case '<': return l < r;
      case '>=': return l >= r;
      case '<=': return l <= r;
      case '>κ': return l > r;
      case '<κ': return l < r;
      case '=κ': return l === r;
      case '∧': return (!!left) && (!!right);
      case '∨': return (!!left) || (!!right);
      default:
        throw new Error(`未知の演算子: ${ast.op}`);
    }
  }

  private evalUnaryOp(ast: ASTNode): ReiValue {
    const operand = this.eval(ast.operand);
    switch (ast.op) {
      case '-': return -this.toNumber(operand);
      case '¬':
        if (this.isQuad(operand)) {
          return { reiType: 'Quad', value: quadNot((operand as Quad).value) } as Quad;
        }
        return !operand;
      default:
        throw new Error(`未知の単項演算子: ${ast.op}`);
    }
  }

  private evalPipe(ast: ASTNode): ReiValue {
    const input = this.eval(ast.input);
    const cmd = ast.command;

    if (cmd.type === 'PipeCmd') {
      return this.execPipeCmd(input, cmd);
    }
    throw new Error('無効なパイプコマンド');
  }

  private execPipeCmd(input: ReiValue, cmd: ASTNode): ReiValue {
    const { cmd: cmdName, mode, args: argNodes } = cmd;
    const args = (argNodes as ASTNode[]).map((a: ASTNode) => this.eval(a));

    // MDim pipe commands
    if (this.isMDim(input)) {
      const md = input as MultiDimNumber;
      switch (cmdName) {
        case 'compute': {
          const m = (mode || md.mode) as ComputationMode;
          return computeMDim({ ...md, mode: m });
        }
        case 'center': return md.center;
        case 'neighbors': return md.neighbors;
        case 'dim': return md.neighbors.length;
        case 'normalize': {
          const sum = md.neighbors.reduce((a, b) => a + Math.abs(b), 0) || 1;
          return {
            reiType: 'MDim', center: md.center,
            neighbors: md.neighbors.map(n => n / sum),
            mode: md.mode,
          } as MultiDimNumber;
        }
        case 'flatten': return computeMDim(md);
        case 'map': {
          if (args.length > 0 && this.isFunction(args[0])) {
            const fn = args[0] as ReiFunction;
            const newNeighbors = md.neighbors.map(n => this.toNumber(this.callFunction(fn, [n])));
            return { ...md, neighbors: newNeighbors } as MultiDimNumber;
          }
          return md;
        }
      }
    }

    // Extended pipe commands
    if (this.isExt(input)) {
      const ext = input as ReiExtended;
      switch (cmdName) {
        case 'order': return ext.order;
        case 'base': return ext.base;
        case 'valStar':
        case 'val': return ext.valStar();
        case 'subscripts': return ext.subscripts;
      }
    }

    // Genesis pipe commands
    if (this.isGenesis(input)) {
      const g = input as GenesisState;
      switch (cmdName) {
        case 'forward': genesisForward(g); return g;
        case 'phase': return g.state;
        case 'history': return g.history as unknown as ReiValue;
        case 'omega': return g.omega;
      }
    }

    // Array pipe commands
    if (Array.isArray(input)) {
      switch (cmdName) {
        case 'len': return input.length;
        case 'sum': return input.reduce((a: number, b) => a + this.toNumber(b), 0);
        case 'avg': return input.length === 0 ? 0 : input.reduce((a: number, b) => a + this.toNumber(b), 0) / input.length;
        case 'first': return input[0] ?? null;
        case 'last': return input[input.length - 1] ?? null;
        case 'reverse': return [...input].reverse();
        case 'sort': return [...input].sort((a, b) => this.toNumber(a) - this.toNumber(b));
        case 'map': {
          if (args.length > 0 && this.isFunction(args[0])) {
            return input.map(v => this.callFunction(args[0] as ReiFunction, [v]));
          }
          return input;
        }
        case 'filter': {
          if (args.length > 0 && this.isFunction(args[0])) {
            return input.filter(v => !!this.callFunction(args[0] as ReiFunction, [v]));
          }
          return input;
        }
        case 'reduce': {
          if (args.length >= 2 && this.isFunction(args[0])) {
            return input.reduce((acc, v) => this.callFunction(args[0] as ReiFunction, [acc, v]), args[1]);
          }
          return input;
        }
      }
    }

    // Number pipe commands
    if (typeof input === 'number') {
      switch (cmdName) {
        case 'abs': return Math.abs(input);
        case 'sqrt': return Math.sqrt(input);
        case 'round': return Math.round(input);
        case 'floor': return Math.floor(input);
        case 'ceil': return Math.ceil(input);
        case 'negate': return -input;
      }
    }

    // String pipe commands
    if (typeof input === 'string') {
      switch (cmdName) {
        case 'len': return input.length;
        case 'upper': return input.toUpperCase();
        case 'lower': return input.toLowerCase();
        case 'trim': return input.trim();
        case 'split': return input.split(args[0] as string ?? '') as unknown as ReiValue;
        case 'reverse': return Array.from(input).reverse().join('');
      }
    }

    // ⤊ converge / ⤋ diverge
    if (cmdName === '⤊' || cmdName === 'converge') {
      if (this.isMDim(input)) {
        return computeMDim(input as MultiDimNumber);
      }
      return input;
    }
    if (cmdName === '⤋' || cmdName === 'diverge') {
      if (typeof input === 'number') {
        return { reiType: 'MDim', center: input, neighbors: [input, input, input, input], mode: 'weighted' as ComputationMode } as MultiDimNumber;
      }
      return input;
    }

    // Try as function call
    if (this.env.has(cmdName)) {
      const fn = this.env.get(cmdName);
      if (this.isFunction(fn)) {
        return this.callFunction(fn as ReiFunction, [input, ...args]);
      }
    }

    throw new Error(`未知のパイプコマンド: ${cmdName}`);
  }

  private evalFnCall(ast: ASTNode): ReiValue {
    const callee = this.eval(ast.callee);
    const args = ast.args.map((a: ASTNode) => this.eval(a));

    // genesis()
    if (ast.callee.type === 'Ident' && ast.callee.name === 'genesis') {
      return createGenesis();
    }

    // Built-in functions
    if (this.isFunction(callee)) {
      const fn = callee as ReiFunction;
      return this.callFunction(fn, args);
    }

    throw new Error(`呼び出し不可能: ${JSON.stringify(callee)}`);
  }

  private callFunction(fn: ReiFunction, args: ReiValue[]): ReiValue {
    // Built-in math functions
    if (fn.body === null || fn.body === undefined) {
      return this.callBuiltin(fn.name, args);
    }

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

  private callBuiltin(name: string, args: ReiValue[]): ReiValue {
    if (name === 'genesis') return createGenesis();

    const a = args[0] !== undefined ? this.toNumber(args[0]) : 0;
    const b = args[1] !== undefined ? this.toNumber(args[1]) : 0;
    switch (name) {
      case 'abs': return Math.abs(a);
      case 'sqrt': return Math.sqrt(a);
      case 'sin': return Math.sin(a);
      case 'cos': return Math.cos(a);
      case 'log': return Math.log(a);
      case 'exp': return Math.exp(a);
      case 'floor': return Math.floor(a);
      case 'ceil': return Math.ceil(a);
      case 'round': return Math.round(a);
      case 'min': return Math.min(a, b);
      case 'max': return Math.max(a, b);
      case 'len':
        if (Array.isArray(args[0])) return (args[0] as any[]).length;
        if (typeof args[0] === 'string') return args[0].length;
        return 0;
      case 'print':
        // In REPL mode this prints, in eval mode returns the value
        return args[0] ?? null;
      default:
        throw new Error(`未知の組込み関数: ${name}`);
    }
  }

  private evalMemberAccess(ast: ASTNode): ReiValue {
    const obj = this.eval(ast.object);

    if (this.isMDim(obj)) {
      const md = obj as MultiDimNumber;
      switch (ast.member) {
        case 'center': return md.center;
        case 'neighbors': return md.neighbors;
        case 'mode': return md.mode;
        case 'dim': return md.neighbors.length;
      }
    }

    if (this.isExt(obj)) {
      const ext = obj as ReiExtended;
      switch (ast.member) {
        case 'order': return ext.order;
        case 'base': return ext.base;
        case 'subscripts': return ext.subscripts;
        case 'valStar': return ext.valStar();
      }
    }

    if (this.isGenesis(obj)) {
      const g = obj as GenesisState;
      switch (ast.member) {
        case 'state':
        case 'phase': return g.state;
        case 'omega': return g.omega;
        case 'history': return g.history as unknown as ReiValue;
      }
    }

    if (Array.isArray(obj)) {
      switch (ast.member) {
        case 'length': return obj.length;
        case 'first': return obj[0] ?? null;
        case 'last': return obj[obj.length - 1] ?? null;
      }
    }

    throw new Error(`メンバー ${ast.member} にアクセスできません`);
  }

  private evalIndexAccess(ast: ASTNode): ReiValue {
    const obj = this.eval(ast.object);
    const idx = this.toNumber(this.eval(ast.index));
    if (Array.isArray(obj)) return obj[idx] ?? null;
    if (typeof obj === 'string') return obj[idx] ?? null;
    if (this.isMDim(obj)) return (obj as MultiDimNumber).neighbors[idx] ?? null;
    throw new Error('インデックスアクセス不可');
  }

  private evalExtend(ast: ASTNode): ReiValue {
    const target = this.eval(ast.target);
    if (this.isExt(target)) {
      const ext = target as ReiExtended;
      if (ast.subscript) {
        return createExtended(ext.base, ext.subscripts + ast.subscript);
      }
      return createExtended(ext.base, ext.subscripts + 'o');
    }
    throw new Error('拡張は拡張数にのみ適用可能');
  }

  private evalReduce(ast: ASTNode): ReiValue {
    const target = this.eval(ast.target);
    if (this.isExt(target)) {
      const ext = target as ReiExtended;
      if (ext.order <= 1) return ext.base;
      return createExtended(ext.base, ext.subscripts.slice(0, -1));
    }
    throw new Error('縮約は拡張数にのみ適用可能');
  }

  private evalConverge(ast: ASTNode): ReiValue {
    const left = this.eval(ast.left);
    const right = this.eval(ast.right);
    // Converge: merge two MDim numbers
    if (this.isMDim(left) && this.isMDim(right)) {
      const lm = left as MultiDimNumber;
      const rm = right as MultiDimNumber;
      return {
        reiType: 'MDim',
        center: (lm.center + rm.center) / 2,
        neighbors: [...lm.neighbors, ...rm.neighbors],
        mode: lm.mode,
      } as MultiDimNumber;
    }
    return this.toNumber(left) + this.toNumber(right);
  }

  private evalDiverge(ast: ASTNode): ReiValue {
    const left = this.eval(ast.left);
    const right = this.eval(ast.right);
    if (this.isMDim(left)) {
      const md = left as MultiDimNumber;
      const n = this.toNumber(right);
      const half = Math.floor(md.neighbors.length / 2);
      return [
        { reiType: 'MDim', center: md.center, neighbors: md.neighbors.slice(0, half), mode: md.mode },
        { reiType: 'MDim', center: md.center, neighbors: md.neighbors.slice(half), mode: md.mode },
      ] as unknown as ReiValue;
    }
    return this.toNumber(left) - this.toNumber(right);
  }

  private evalReflect(ast: ASTNode): ReiValue {
    const left = this.eval(ast.left);
    const right = this.eval(ast.right);
    if (this.isMDim(left)) {
      const md = left as MultiDimNumber;
      return {
        reiType: 'MDim',
        center: md.center,
        neighbors: [...md.neighbors].reverse(),
        mode: md.mode,
      } as MultiDimNumber;
    }
    return this.toNumber(left);
  }

  private evalIfExpr(ast: ASTNode): ReiValue {
    const cond = this.eval(ast.cond);
    return this.isTruthy(cond) ? this.eval(ast.then) : this.eval(ast.else);
  }

  private evalMatchExpr(ast: ASTNode): ReiValue {
    const target = this.eval(ast.target);
    for (const { pattern, body } of ast.cases) {
      const patVal = this.eval(pattern);
      if (this.matches(target, patVal)) {
        return this.eval(body);
      }
    }
    throw new Error('マッチする分岐が見つかりません');
  }

  // --- Helpers ---
  toNumber(val: ReiValue): number {
    if (typeof val === 'number') return val;
    if (typeof val === 'boolean') return val ? 1 : 0;
    if (val === null) return 0;
    if (this.isExt(val)) return (val as ReiExtended).valStar();
    if (this.isMDim(val)) return computeMDim(val as MultiDimNumber);
    if (typeof val === 'string') return parseFloat(val) || 0;
    return 0;
  }

  private isTruthy(val: ReiValue): boolean {
    if (val === null || val === false || val === 0) return false;
    if (this.isQuad(val)) return (val as Quad).value === 'top' || (val as Quad).value === 'topPi';
    return true;
  }

  private matches(target: ReiValue, pattern: ReiValue): boolean {
    if (typeof target === typeof pattern && target === pattern) return true;
    if (this.isQuad(target) && this.isQuad(pattern)) {
      return (target as Quad).value === (pattern as Quad).value;
    }
    return false;
  }

  private isObj(v: ReiValue): boolean {
    return v !== null && typeof v === 'object' && !Array.isArray(v);
  }
  private isMDim(v: ReiValue): boolean { return this.isObj(v) && (v as any).reiType === 'MDim'; }
  private isExt(v: ReiValue): boolean { return this.isObj(v) && (v as any).reiType === 'Ext'; }
  private isGenesis(v: ReiValue): boolean { return this.isObj(v) && (v as any).reiType === 'State'; }
  private isFunction(v: ReiValue): boolean { return this.isObj(v) && (v as any).reiType === 'Function'; }
  private isQuad(v: ReiValue): boolean { return this.isObj(v) && (v as any).reiType === 'Quad'; }
}
