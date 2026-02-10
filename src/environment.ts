/**
 * ═══════════════════════════════════════════════════════════════════
 *  Rei (0₀式) Environment — Scope & Bindings
 *  Author: Nobuki Fujimoto
 * ═══════════════════════════════════════════════════════════════════
 */

export interface Binding {
  value: ReiValue;
  mutable: boolean;
  witness?: string;
  phaseGuard?: string;
}

export class Environment {
  private bindings: Map<string, Binding> = new Map();
  private parent: Environment | null;

  constructor(parent: Environment | null = null) {
    this.parent = parent;
  }

  define(name: string, value: ReiValue, mutable: boolean = false, witness?: string, phaseGuard?: string) {
    this.bindings.set(name, { value, mutable, witness, phaseGuard });
  }

  get(name: string): ReiValue {
    const binding = this.bindings.get(name);
    if (binding) return binding.value;
    if (this.parent) return this.parent.get(name);
    throw new Error(`Undefined variable: ${name}`);
  }

  getBinding(name: string): Binding | undefined {
    const binding = this.bindings.get(name);
    if (binding) return binding;
    if (this.parent) return this.parent.getBinding(name);
    return undefined;
  }

  set(name: string, value: ReiValue) {
    const binding = this.bindings.get(name);
    if (binding) {
      if (!binding.mutable) throw new Error(`Cannot mutate immutable binding: ${name}`);
      binding.value = value;
      return;
    }
    if (this.parent) { this.parent.set(name, value); return; }
    throw new Error(`Undefined variable: ${name}`);
  }

  child(): Environment {
    return new Environment(this);
  }
}

// ─── Rei Value Types ───

export type ReiValue =
  | ReiNumber
  | ReiExtended
  | ReiMultiDim
  | ReiUnified
  | ReiDot
  | ReiShape
  | ReiQuad
  | ReiString
  | ReiFunction
  | ReiGenesis
  | ReiTemporal
  | ReiTimeless
  | ReiDomain
  | ReiISLSealed
  | ReiParallel
  | ReiVoid;

export interface ReiNumber {
  kind: 'number';
  value: number;
}

export interface ReiExtended {
  kind: 'extended';
  base: string;
  subscripts: string[];
  numericValue: number;
}

export interface ReiMultiDim {
  kind: 'multidim';
  center: number;
  neighbors: { value: number; weight: number }[];
}

export interface ReiUnified {
  kind: 'unified';
  extPart: ReiExtended;
  mdimPart: ReiMultiDim;
}

export interface ReiDot {
  kind: 'dot';
}

export interface ReiShape {
  kind: 'shape';
  shape: string;
  points: ReiValue[];
  vertexCount: number;
}

export interface ReiQuad {
  kind: 'quad';
  value: '⊤' | '⊥' | '⊤π' | '⊥π';
}

export interface ReiString {
  kind: 'string';
  value: string;
}

export interface ReiFunction {
  kind: 'function';
  name: string;
  params: { name: string; type?: string }[];
  body: any; // ASTNode
  closure: Environment;
}

export interface ReiGenesis {
  kind: 'genesis';
  state: string;  // 'S0', 'S1', 'S2', ...
  phase: number;
  omega: number;
  history: string[];
}

export interface ReiTemporal {
  kind: 'temporal';
  value: ReiValue;
  timestamp: number;
}

export interface ReiTimeless {
  kind: 'timeless';
  value: ReiValue;
  invariantHash: string;
}

export interface ReiDomain {
  kind: 'domain';
  value: ReiValue;
  domain: string;  // 'image', 'sound', 'graph', 'geometry', 'text'
  metadata: Record<string, any>;
}

export interface ReiISLSealed {
  kind: 'isl_sealed';
  value: ReiValue;
  hash: string;
  timestamp: number;
}

export interface ReiParallel {
  kind: 'parallel';
  modes: { mode: string; result: ReiValue }[];
}

export interface ReiVoid {
  kind: 'void';
}

// ─── Value Utilities ───

export function reiNumber(v: number): ReiNumber {
  return { kind: 'number', value: v };
}

export function reiExtended(base: string, subscripts: string[]): ReiExtended {
  const baseVal = base === '0' ? 0 : base === 'π' ? Math.PI : base === 'e' ? Math.E :
                  base === 'φ' ? (1 + Math.sqrt(5)) / 2 : base === 'i' ? 0 : 0;
  return { kind: 'extended', base, subscripts, numericValue: baseVal };
}

export function toNumber(v: ReiValue): number {
  switch (v.kind) {
    case 'number': return v.value;
    case 'extended': return v.numericValue;
    case 'multidim': return v.center;
    case 'quad': return v.value === '⊤' ? 1 : v.value === '⊥' ? 0 : v.value === '⊤π' ? 0.5 : -0.5;
    case 'dot': return 0;
    case 'temporal': return toNumber(v.value);
    case 'timeless': return toNumber(v.value);
    case 'domain': return toNumber(v.value);
    default: return 0;
  }
}

export function reiToString(v: ReiValue): string {
  switch (v.kind) {
    case 'number': return String(v.value);
    case 'extended': return v.base + v.subscripts.join('');
    case 'multidim':
      return `𝕄{${v.center}; ${v.neighbors.map(n => n.weight !== 1 ? `${n.value} weight ${n.weight}` : String(n.value)).join(', ')}}`;
    case 'unified': return `𝕌{${reiToString(v.extPart)}, ${reiToString(v.mdimPart)}}`;
    case 'dot': return '・';
    case 'shape': return `${v.shape}{${v.vertexCount} vertices}`;
    case 'quad': return v.value;
    case 'string': return v.value;
    case 'function': return `compress ${v.name}(${v.params.map(p => p.name).join(', ')})`;
    case 'genesis': return `Genesis<${v.state}, ω=${v.omega}>`;
    case 'temporal': return `Temporal<${reiToString(v.value)}, t=${v.timestamp}>`;
    case 'timeless': return `Timeless<${reiToString(v.value)}>`;
    case 'domain': return `${v.domain}::${reiToString(v.value)}`;
    case 'isl_sealed': return `ISL[${v.hash.slice(0, 8)}](${reiToString(v.value)})`;
    case 'parallel': return `Parallel{${v.modes.map(m => `${m.mode}: ${reiToString(m.result)}`).join(', ')}}`;
    case 'void': return 'void';
  }
}
