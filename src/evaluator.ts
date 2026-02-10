/**
 * ═══════════════════════════════════════════════════════════════════
 *  Rei (0₀式) Evaluator — Tree-Walking Interpreter
 *  BNF v0.2 — 21 Theories Integrated
 *  Author: Nobuki Fujimoto
 * ═══════════════════════════════════════════════════════════════════
 */

import * as AST from './ast';
import {
  Environment, ReiValue, ReiNumber, ReiExtended, ReiMultiDim,
  ReiFunction, ReiGenesis, ReiQuad, ReiParallel,
  reiNumber, reiExtended, toNumber, reiToString
} from './environment';

export class RuntimeError extends Error {
  constructor(msg: string) {
    super(`Runtime error: ${msg}`);
  }
}

export class Evaluator {
  eval(node: AST.ASTNode, env: Environment): ReiValue {
    switch (node.kind) {
      case 'NumberLiteral':
        return reiNumber(node.value);

      case 'ExtendedLiteral':
        return reiExtended(node.base, node.subscripts);

      case 'MultiDimLiteral':
        return this.evalMultiDim(node, env);

      case 'UnifiedLiteral':
        return this.evalUnified(node, env);

      case 'DotLiteral':
        return { kind: 'dot' };

      case 'ShapeLiteral':
        return this.evalShape(node, env);

      case 'QuadLiteral':
        return { kind: 'quad', value: node.value };

      case 'StringLiteral':
        return { kind: 'string', value: node.value };

      case 'Identifier':
        return env.get(node.name);

      case 'BinaryExpr':
        return this.evalBinary(node, env);

      case 'UnaryExpr':
        return this.evalUnary(node, env);

      case 'PipeExpr':
        return this.evalPipe(node, env);

      case 'ExtendExpr':
        return this.evalExtend(node, env);

      case 'ReduceExpr':
        return this.evalReduce(node, env);

      case 'SpiralExpr':
        return this.evalSpiral(node, env);

      case 'ReverseSpiralExpr':
        return this.evalReverseSpiral(node, env);

      case 'MirrorExpr':
        return this.evalMirror(node, env);

      case 'ComputeExpr':
        return this.evalCompute(node, env);

      case 'CompressExpr':
        return this.evalCompress(node, env);

      case 'AsExpr':
        return this.evalAs(node, env);

      case 'WitnessExpr':
        return this.eval(node.expr, env);

      case 'PhaseGuardExpr':
        return this.evalPhaseGuard(node, env);

      case 'ISLExpr':
        return this.evalISL(node, env);

      case 'TemporalExpr':
        return this.evalTemporal(node, env);

      case 'TimelessExpr':
        return this.evalTimeless(node, env);

      case 'ParallelExpr':
        return this.evalParallel(node, env);

      case 'LetStmt':
        return this.evalLet(node, env);

      case 'CompressDef':
        return this.evalCompressDef(node, env);

      case 'FunctionCall':
        return this.evalCall(node, env);

      case 'MemberExpr':
        return this.evalMember(node, env);

      case 'ArrayExpr':
        throw new RuntimeError('Array expressions not yet supported');

      case 'BlockExpr':
        return this.evalBlock(node, env);

      case 'GenesisExpr':
        return this.newGenesis();

      default:
        throw new RuntimeError(`Unknown node kind: ${(node as any).kind}`);
    }
  }

  // ─── Multi-dimensional ───

  private evalMultiDim(node: AST.MultiDimLiteral, env: Environment): ReiMultiDim {
    const center = toNumber(this.eval(node.center, env));
    const neighbors = node.neighbors.map(n => ({
      value: toNumber(this.eval(n.value, env)),
      weight: n.weight ? toNumber(this.eval(n.weight, env)) : 1
    }));
    return { kind: 'multidim', center, neighbors };
  }

  private evalUnified(node: AST.UnifiedLiteral, env: Environment): ReiValue {
    const extPart = this.eval(node.extPart, env);
    const mdimPart = this.eval(node.mdimPart, env);
    if (extPart.kind !== 'extended' || mdimPart.kind !== 'multidim') {
      throw new RuntimeError('𝕌 requires extended and multidim parts');
    }
    return { kind: 'unified', extPart, mdimPart };
  }

  private evalShape(node: AST.ShapeLiteral, env: Environment): ReiValue {
    const points = node.points.map(p => this.eval(p, env));
    return { kind: 'shape', shape: node.shape, points, vertexCount: points.length };
  }

  // ─── Binary Operations ───

  private evalBinary(node: AST.BinaryExpr, env: Environment): ReiValue {
    const left = this.eval(node.left, env);
    const right = this.eval(node.right, env);

    // Quad logic
    if (left.kind === 'quad' || right.kind === 'quad') {
      return this.evalQuadBinary(node.op, left, right);
    }

    // Extended number operations
    if (left.kind === 'extended' && right.kind === 'extended') {
      return this.evalExtBinary(node.op, left, right);
    }

    // Scalar multiplication: number · extended or extended · number
    if (node.op === '·') {
      if (left.kind === 'number' && right.kind === 'extended') {
        return this.evalScalarMul(right, left.value);
      }
      if (left.kind === 'extended' && right.kind === 'number') {
        return this.evalScalarMul(left, right.value);
      }
      return this.evalScalarMul(left, toNumber(right));
    }

    // Numeric operations
    const lv = toNumber(left);
    const rv = toNumber(right);

    switch (node.op) {
      case '+': case '⊕': return reiNumber(lv + rv);
      case '-': return reiNumber(lv - rv);
      case '*': case '⊗': return reiNumber(lv * rv);
      case '/': {
        if (rv === 0) throw new RuntimeError('Division by zero');
        return reiNumber(lv / rv);
      }
      case '>κ': return { kind: 'quad', value: lv > rv ? '⊤' : '⊥' };
      case '<κ': return { kind: 'quad', value: lv < rv ? '⊤' : '⊥' };
      case '=κ': return { kind: 'quad', value: Math.abs(lv - rv) < 1e-10 ? '⊤' : '⊥' };
      default:
        throw new RuntimeError(`Unknown binary operator: ${node.op}`);
    }
  }

  private evalQuadBinary(op: string, left: ReiValue, right: ReiValue): ReiQuad {
    const lq = this.toQuadValue(left);
    const rq = this.toQuadValue(right);

    switch (op) {
      case '∧': return { kind: 'quad', value: this.quadAnd(lq, rq) };
      case '∨': return { kind: 'quad', value: this.quadOr(lq, rq) };
      default: throw new RuntimeError(`Unsupported quad operator: ${op}`);
    }
  }

  private toQuadValue(v: ReiValue): '⊤' | '⊥' | '⊤π' | '⊥π' {
    if (v.kind === 'quad') return v.value;
    const n = toNumber(v);
    return n > 0 ? '⊤' : n < 0 ? '⊥' : '⊥π';
  }

  // Four-value logic truth tables
  private quadAnd(a: string, b: string): '⊤' | '⊥' | '⊤π' | '⊥π' {
    if (a === '⊥' || b === '⊥') return '⊥';
    if (a === '⊤' && b === '⊤') return '⊤';
    if (a === '⊥π' || b === '⊥π') return '⊥π';
    return '⊤π';
  }

  private quadOr(a: string, b: string): '⊤' | '⊥' | '⊤π' | '⊥π' {
    if (a === '⊤' || b === '⊤') return '⊤';
    if (a === '⊤π' || b === '⊤π') return '⊤π';
    if (a === '⊥π' || b === '⊥π') return '⊥π';
    return '⊥';
  }

  private evalExtBinary(op: string, left: ReiExtended, right: ReiExtended): ReiValue {
    switch (op) {
      case '⊕': case '+': {
        // Extended addition: merge subscript spaces
        const allSubs = [...new Set([...left.subscripts, ...right.subscripts])];
        return reiExtended(left.base, allSubs);
      }
      case '⊗': case '*': {
        // Extended multiplication: concatenate subscripts
        return reiExtended(left.base, [...left.subscripts, ...right.subscripts]);
      }
      default:
        return reiNumber(left.numericValue + right.numericValue);
    }
  }

  private evalScalarMul(left: ReiValue, scalar: number): ReiValue {
    if (left.kind === 'extended') {
      return { ...left, numericValue: left.numericValue * scalar };
    }
    if (left.kind === 'multidim') {
      return {
        ...left,
        center: left.center * scalar,
        neighbors: left.neighbors.map(n => ({ ...n, value: n.value * scalar }))
      };
    }
    return reiNumber(toNumber(left) * scalar);
  }

  // ─── Unary ───

  private evalUnary(node: AST.UnaryExpr, env: Environment): ReiValue {
    const operand = this.eval(node.operand, env);
    switch (node.op) {
      case '-': return reiNumber(-toNumber(operand));
      case '¬': {
        if (operand.kind === 'quad') {
          const neg: Record<string, '⊤' | '⊥' | '⊤π' | '⊥π'> = {
            '⊤': '⊥', '⊥': '⊤', '⊤π': '⊥π', '⊥π': '⊤π'
          };
          return { kind: 'quad', value: neg[operand.value] };
        }
        return reiNumber(toNumber(operand) === 0 ? 1 : 0);
      }
      default: throw new RuntimeError(`Unknown unary op: ${node.op}`);
    }
  }

  // ─── Pipe ───

  private evalPipe(node: AST.PipeExpr, env: Environment): ReiValue {
    const left = this.eval(node.left, env);

    switch (node.command) {
      case 'forward': {
        if (left.kind !== 'genesis') throw new RuntimeError('forward requires Genesis');
        return this.genesisForward(left);
      }
      case 'symmetry': {
        if (left.kind !== 'multidim') throw new RuntimeError('symmetry requires MultiDim');
        return this.evalSymmetry(left);
      }
      default: {
        // Try to find as function in env
        const fn = env.getBinding(node.command);
        if (fn && fn.value.kind === 'function') {
          return this.callFunction(fn.value, [left], env);
        }
        throw new RuntimeError(`Unknown pipe command: ${node.command}`);
      }
    }
  }

  // ─── Extend / Reduce / Spiral ───

  private evalExtend(node: AST.ExtendExpr, env: Environment): ReiValue {
    const operand = this.eval(node.operand, env);
    if (operand.kind === 'extended') {
      return reiExtended(operand.base, [...operand.subscripts, node.subscript]);
    }
    throw new RuntimeError('>> (extend) requires extended number');
  }

  private evalReduce(node: AST.ReduceExpr, env: Environment): ReiValue {
    const operand = this.eval(node.operand, env);
    if (operand.kind === 'extended') {
      if (operand.subscripts.length <= 1) {
        return reiNumber(operand.numericValue);
      }
      return reiExtended(operand.base, operand.subscripts.slice(0, -1));
    }
    throw new RuntimeError('<< (reduce) requires extended number');
  }

  private evalSpiral(node: AST.SpiralExpr, env: Environment): ReiValue {
    const operand = this.eval(node.operand, env);
    if (operand.kind === 'multidim') {
      // Spiral up: wrap in hierarchical multidim
      const newCenter = this.computeWeighted(operand);
      return {
        kind: 'multidim',
        center: newCenter,
        neighbors: [{ value: operand.center, weight: 1 }, ...operand.neighbors]
      };
    }
    if (operand.kind === 'extended') {
      // Spiral: add a layer of subscripts
      const extra = Array(node.depth).fill('s');
      return reiExtended(operand.base, [...operand.subscripts, ...extra]);
    }
    return operand;
  }

  private evalReverseSpiral(node: AST.ReverseSpiralExpr, env: Environment): ReiValue {
    const operand = this.eval(node.operand, env);
    if (operand.kind === 'multidim') {
      // Spiral down: flatten
      return reiNumber(this.computeWeighted(operand));
    }
    return operand;
  }

  private evalMirror(node: AST.MirrorExpr, env: Environment): ReiValue {
    const operand = this.eval(node.operand, env);
    if (operand.kind === 'extended') {
      return reiExtended(operand.base, [...operand.subscripts].reverse());
    }
    if (operand.kind === 'multidim') {
      return {
        ...operand,
        neighbors: [...operand.neighbors].reverse()
      };
    }
    return operand;
  }

  // ─── Compute Modes (9 modes) ───

  private evalCompute(node: AST.ComputeExpr, env: Environment): ReiValue {
    let operand = this.eval(node.operand, env);

    // Unwrap domain tag if present
    if (operand.kind === 'domain') {
      operand = operand.value;
    }

    if (operand.kind !== 'multidim') {
      throw new RuntimeError('compute requires MultiDim value');
    }

    if (node.mode === 'all') {
      return this.computeAll(operand);
    }

    const result = this.computeMode(operand, node.mode);
    return reiNumber(result);
  }

  private computeMode(md: ReiMultiDim, mode: string): number {
    const c = md.center;
    const ns = md.neighbors;
    const totalWeight = ns.reduce((s, n) => s + n.weight, 0);

    switch (mode) {
      case 'weighted': {
        const wSum = ns.reduce((s, n) => s + n.value * n.weight, 0);
        return c + (totalWeight > 0 ? wSum / totalWeight : 0);
      }
      case 'multiplicative': {
        const prod = ns.reduce((p, n) => p * Math.pow(Math.abs(n.value) || 1, n.weight), 1);
        return c * prod;
      }
      case 'harmonic': {
        const hSum = ns.reduce((s, n) => s + (n.value !== 0 ? n.weight / n.value : 0), 0);
        return hSum !== 0 ? c + totalWeight / hSum : c;
      }
      case 'exponential': {
        const expSum = ns.reduce((s, n) => s + n.weight * Math.exp(n.value), 0);
        return c + Math.log(expSum / totalWeight);
      }
      // v0.2 additional modes
      case 'zero': {
        // Contract toward zero: iterative averaging
        let val = c;
        for (const n of ns) {
          val = val * (1 - n.weight / totalWeight) + n.value * (n.weight / totalWeight);
        }
        return val;
      }
      case 'pi': {
        // π-periodic compression
        const phase = ns.reduce((s, n) => s + n.value * n.weight, 0) / (totalWeight || 1);
        return c + Math.sin(phase * Math.PI);
      }
      case 'e': {
        // Exponential growth/decay
        const rate = ns.reduce((s, n) => s + n.value * n.weight, 0) / (totalWeight || 1);
        return c * Math.exp(rate);
      }
      case 'phi': {
        // Golden ratio harmonic
        const PHI = (1 + Math.sqrt(5)) / 2;
        const phiSum = ns.reduce((s, n, i) => s + n.value * Math.pow(PHI, -(i + 1)) * n.weight, 0);
        return c + phiSum / (totalWeight || 1);
      }
      case 'symbolic': {
        // Return peak neighbor value (symbolic max)
        const peak = ns.reduce((max, n) => Math.abs(n.value) > Math.abs(max.value) ? n : max, ns[0] || { value: 0 });
        return peak ? peak.value : c;
      }
      default:
        return this.computeMode(md, 'weighted');
    }
  }

  private computeWeighted(md: ReiMultiDim): number {
    return this.computeMode(md, 'weighted');
  }

  private computeAll(md: ReiMultiDim): ReiParallel {
    const modes = ['weighted', 'multiplicative', 'harmonic', 'exponential',
                   'zero', 'pi', 'e', 'phi', 'symbolic'];
    return {
      kind: 'parallel',
      modes: modes.map(mode => ({
        mode,
        result: reiNumber(this.computeMode(md, mode))
      }))
    };
  }

  // ─── Compress (pipeline operation) ───

  private evalCompress(node: AST.CompressExpr, env: Environment): ReiValue {
    const operand = this.eval(node.operand, env);
    if (operand.kind === 'multidim') {
      const mode = node.mode || 'weighted';
      return reiNumber(this.computeMode(operand, mode));
    }
    if (operand.kind === 'extended') {
      // Compress: reduce to numeric
      return reiNumber(operand.numericValue);
    }
    return operand;
  }

  // ─── As (domain tagging) ───

  private evalAs(node: AST.AsExpr, env: Environment): ReiValue {
    const operand = this.eval(node.operand, env);
    return {
      kind: 'domain',
      value: operand,
      domain: node.domain,
      metadata: { taggedAt: Date.now() }
    };
  }

  // ─── Phase Guard ───

  private evalPhaseGuard(node: AST.PhaseGuardExpr, env: Environment): ReiValue {
    const val = this.eval(node.expr, env);
    // Phase check: 'pre' (pre-value), 'value', 'post' (post-value)
    // For now, pass through with validation
    return val;
  }

  // ─── ISL (Irreversible Syntax Layer) ───

  private evalISL(node: AST.ISLExpr, env: Environment): ReiValue {
    const val = this.eval(node.expr, env);
    if (node.action === 'seal') {
      const hash = this.simpleHash(reiToString(val) + Date.now());
      return {
        kind: 'isl_sealed',
        value: val,
        hash,
        timestamp: Date.now()
      };
    }
    if (node.action === 'verify') {
      if (val.kind === 'isl_sealed') {
        return { kind: 'quad', value: '⊤' };
      }
      return { kind: 'quad', value: '⊥' };
    }
    return val;
  }

  // ─── Temporal / Timeless ───

  private evalTemporal(node: AST.TemporalExpr, env: Environment): ReiValue {
    const val = this.eval(node.expr, env);
    const ts = node.timestamp ? toNumber(this.eval(node.timestamp, env)) : Date.now();
    return { kind: 'temporal', value: val, timestamp: ts };
  }

  private evalTimeless(node: AST.TimelessExpr, env: Environment): ReiValue {
    const val = this.eval(node.expr, env);
    return { kind: 'timeless', value: val, invariantHash: this.simpleHash(reiToString(val)) };
  }

  // ─── Parallel ───

  private evalParallel(node: AST.ParallelExpr, env: Environment): ReiValue {
    const results = node.branches.map((b, i) => ({
      mode: `branch_${i}`,
      result: this.eval(b, env)
    }));
    return { kind: 'parallel', modes: results };
  }

  // ─── Symmetry Analysis ───

  private evalSymmetry(md: ReiMultiDim): ReiValue {
    const vals = md.neighbors.map(n => n.value);
    const reversed = [...vals].reverse();
    const isSymmetric = vals.every((v, i) => Math.abs(v - reversed[i]) < 1e-10);
    const isAntiSymmetric = vals.every((v, i) => Math.abs(v + reversed[i]) < 1e-10);

    let type = 'Asymmetric';
    if (isSymmetric) type = 'Symmetric';
    else if (isAntiSymmetric) type = 'AntiSymmetric';

    return { kind: 'string', value: type };
  }

  // ─── Let Statement ───

  private evalLet(node: AST.LetStmt, env: Environment): ReiValue {
    const value = this.eval(node.value, env);
    env.define(node.name, value, node.mutable, node.witness, node.phaseGuard);
    return value;
  }

  // ─── Compress Definition (function) ───

  private evalCompressDef(node: AST.CompressDef, env: Environment): ReiValue {
    const fn: ReiFunction = {
      kind: 'function',
      name: node.name,
      params: node.params,
      body: node.body,
      closure: env
    };
    env.define(node.name, fn);
    return fn;
  }

  // ─── Function Call ───

  private evalCall(node: AST.FunctionCall, env: Environment): ReiValue {
    const callee = this.eval(node.callee, env);
    if (callee.kind !== 'function') {
      throw new RuntimeError(`${reiToString(callee)} is not callable`);
    }
    const args = node.args.map(a => this.eval(a, env));
    return this.callFunction(callee, args, env);
  }

  private callFunction(fn: ReiFunction, args: ReiValue[], _env: Environment): ReiValue {
    const fnEnv = fn.closure.child();
    for (let i = 0; i < fn.params.length; i++) {
      fnEnv.define(fn.params[i].name, args[i] ?? { kind: 'void' });
    }
    return this.eval(fn.body, fnEnv);
  }

  // ─── Member Access ───

  private evalMember(node: AST.MemberExpr, env: Environment): ReiValue {
    const obj = this.eval(node.object, env);

    // Genesis properties
    if (obj.kind === 'genesis') {
      switch (node.property) {
        case 'state': return { kind: 'string', value: obj.state };
        case 'phase': return reiNumber(obj.phase);
        case 'omega': return reiNumber(obj.omega);
        default: throw new RuntimeError(`Unknown genesis property: ${node.property}`);
      }
    }

    // MultiDim properties
    if (obj.kind === 'multidim') {
      switch (node.property) {
        case 'center': return reiNumber(obj.center);
        case 'dim': return reiNumber(obj.neighbors.length);
        default: throw new RuntimeError(`Unknown multidim property: ${node.property}`);
      }
    }

    // Extended properties
    if (obj.kind === 'extended') {
      switch (node.property) {
        case 'order': return reiNumber(obj.subscripts.length);
        case 'base': return { kind: 'string', value: obj.base };
        default: throw new RuntimeError(`Unknown extended property: ${node.property}`);
      }
    }

    // Domain properties
    if (obj.kind === 'domain') {
      switch (node.property) {
        case 'domain': return { kind: 'string', value: obj.domain };
        case 'value': return obj.value;
        default: throw new RuntimeError(`Unknown domain property: ${node.property}`);
      }
    }

    // Temporal properties
    if (obj.kind === 'temporal') {
      switch (node.property) {
        case 'value': return obj.value;
        case 'timestamp': return reiNumber(obj.timestamp);
        default: throw new RuntimeError(`Unknown temporal property: ${node.property}`);
      }
    }

    // ISL properties
    if (obj.kind === 'isl_sealed') {
      switch (node.property) {
        case 'hash': return { kind: 'string', value: obj.hash };
        case 'value': return obj.value;
        default: throw new RuntimeError(`Unknown ISL property: ${node.property}`);
      }
    }

    // Parallel properties
    if (obj.kind === 'parallel') {
      switch (node.property) {
        case 'count': return reiNumber(obj.modes.length);
        default: {
          // Access by mode name
          const found = obj.modes.find(m => m.mode === node.property);
          if (found) return found.result;
          throw new RuntimeError(`Unknown parallel mode: ${node.property}`);
        }
      }
    }

    throw new RuntimeError(`Cannot access property '${node.property}' on ${obj.kind}`);
  }

  // ─── Block ───

  private evalBlock(node: AST.BlockExpr, env: Environment): ReiValue {
    const blockEnv = env.child();
    let result: ReiValue = { kind: 'void' };
    for (const stmt of node.statements) {
      result = this.eval(stmt, blockEnv);
    }
    return result;
  }

  // ─── Genesis ───

  private newGenesis(): ReiGenesis {
    return { kind: 'genesis', state: 'S0', phase: 0, omega: 0, history: ['S0'] };
  }

  private genesisForward(g: ReiGenesis): ReiGenesis {
    const num = parseInt(g.state.replace('S', ''));
    const nextState = `S${num + 1}`;
    return {
      kind: 'genesis',
      state: nextState,
      phase: g.phase + 1,
      omega: num + 1 >= 2 ? 1 : 0,
      history: [...g.history, nextState]
    };
  }

  // ─── Utility ───

  private simpleHash(input: string): string {
    let h = 0;
    for (let i = 0; i < input.length; i++) {
      h = ((h << 5) - h + input.charCodeAt(i)) | 0;
    }
    return Math.abs(h).toString(16).padStart(8, '0');
  }
}
