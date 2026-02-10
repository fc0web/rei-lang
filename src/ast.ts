/**
 * ═══════════════════════════════════════════════════════════════════
 *  Rei (0₀式) AST — Abstract Syntax Tree Node Types
 *  BNF v0.2 準拠 — 21 Theories Integrated
 *  Author: Nobuki Fujimoto
 * ═══════════════════════════════════════════════════════════════════
 */

// ─── Node Kind Union ───
export type ASTNode =
  | NumberLiteral
  | ExtendedLiteral
  | MultiDimLiteral
  | UnifiedLiteral
  | DotLiteral
  | ShapeLiteral
  | QuadLiteral
  | StringLiteral
  | Identifier
  | BinaryExpr
  | UnaryExpr
  | PipeExpr
  | ExtendExpr
  | ReduceExpr
  | SpiralExpr
  | ReverseSpiralExpr
  | MirrorExpr
  | ComputeExpr
  | CompressExpr
  | AsExpr
  | WitnessExpr
  | PhaseGuardExpr
  | ISLExpr
  | LetStmt
  | CompressDef
  | FunctionCall
  | MemberExpr
  | ArrayExpr
  | BlockExpr
  | GenesisExpr
  | TemporalExpr
  | TimelessExpr
  | ParallelExpr;

// ─── Literals ───

export interface NumberLiteral {
  kind: 'NumberLiteral';
  value: number;
}

export interface ExtendedLiteral {
  kind: 'ExtendedLiteral';
  base: string;           // '0', 'π', 'e', 'φ', 'i'
  subscripts: string[];   // ['o','o','o'] etc.
}

export interface MultiDimLiteral {
  kind: 'MultiDimLiteral';
  center: ASTNode;
  neighbors: { value: ASTNode; weight?: ASTNode }[];
}

export interface UnifiedLiteral {
  kind: 'UnifiedLiteral';
  extPart: ASTNode;
  mdimPart: ASTNode;
}

export interface DotLiteral {
  kind: 'DotLiteral';  // ・ (primordial point)
}

export interface ShapeLiteral {
  kind: 'ShapeLiteral';
  shape: string;        // '△', '□', '○', '◇'
  points: ASTNode[];
}

export interface QuadLiteral {
  kind: 'QuadLiteral';
  value: '⊤' | '⊥' | '⊤π' | '⊥π';
}

export interface StringLiteral {
  kind: 'StringLiteral';
  value: string;
}

// ─── Expressions ───

export interface Identifier {
  kind: 'Identifier';
  name: string;
}

export interface BinaryExpr {
  kind: 'BinaryExpr';
  op: string;  // '+', '-', '*', '/', '⊕', '⊗', '·', '∧', '∨', '>κ', '<κ', '=κ'
  left: ASTNode;
  right: ASTNode;
}

export interface UnaryExpr {
  kind: 'UnaryExpr';
  op: string;  // '-', '¬'
  operand: ASTNode;
}

export interface PipeExpr {
  kind: 'PipeExpr';
  left: ASTNode;
  command: string;
  args?: ASTNode[];
}

export interface ExtendExpr {
  kind: 'ExtendExpr';
  operand: ASTNode;
  subscript: string;
}

export interface ReduceExpr {
  kind: 'ReduceExpr';
  operand: ASTNode;
}

export interface SpiralExpr {
  kind: 'SpiralExpr';   // ⤊ spiral up
  operand: ASTNode;
  depth: number;
}

export interface ReverseSpiralExpr {
  kind: 'ReverseSpiralExpr';  // ⤋ spiral down
  operand: ASTNode;
  depth: number;
}

export interface MirrorExpr {
  kind: 'MirrorExpr';   // ◁ mirror
  operand: ASTNode;
}

export interface ComputeExpr {
  kind: 'ComputeExpr';
  operand: ASTNode;
  mode: string;   // 'weighted', 'multiplicative', 'harmonic', 'exponential',
                   // 'zero', 'pi', 'e', 'phi', 'all'
}

export interface CompressExpr {
  kind: 'CompressExpr';
  operand: ASTNode;
  mode?: string;  // compress mode
}

export interface AsExpr {
  kind: 'AsExpr';
  operand: ASTNode;
  domain: string;  // 'image', 'sound', 'graph', 'text', 'geometry'
}

export interface WitnessExpr {
  kind: 'WitnessExpr';
  expr: ASTNode;
  tag: string;
}

export interface PhaseGuardExpr {
  kind: 'PhaseGuardExpr';
  expr: ASTNode;
  phase: string;    // 'pre', 'value', 'post'
}

export interface ISLExpr {
  kind: 'ISLExpr';
  expr: ASTNode;
  action: string;   // 'seal', 'verify'
}

export interface TemporalExpr {
  kind: 'TemporalExpr';
  expr: ASTNode;
  timestamp?: ASTNode;
}

export interface TimelessExpr {
  kind: 'TimelessExpr';
  expr: ASTNode;
}

export interface ParallelExpr {
  kind: 'ParallelExpr';
  branches: ASTNode[];
}

// ─── Statements ───

export interface LetStmt {
  kind: 'LetStmt';
  name: string;
  mutable: boolean;
  typeAnnotation?: string;
  phaseGuard?: string;
  value: ASTNode;
  witness?: string;
}

export interface CompressDef {
  kind: 'CompressDef';
  name: string;
  level?: string;     // '⁰','¹','²','³','∞'
  params: { name: string; type?: string; phaseGuard?: string }[];
  returnType?: string;
  body: ASTNode;
}

export interface FunctionCall {
  kind: 'FunctionCall';
  callee: ASTNode;
  args: ASTNode[];
}

export interface MemberExpr {
  kind: 'MemberExpr';
  object: ASTNode;
  property: string;
}

export interface ArrayExpr {
  kind: 'ArrayExpr';
  elements: ASTNode[];
}

export interface BlockExpr {
  kind: 'BlockExpr';
  statements: ASTNode[];
}

export interface GenesisExpr {
  kind: 'GenesisExpr';
}
