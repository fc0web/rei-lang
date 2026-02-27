/**
 * Rei言語 (0₀式/rei-shiki) — Core Type Definitions
 * 
 * 四公理体系:
 *   A1: Center-Periphery (中心-周囲)
 *   A2: Extension-Reduction (拡張-縮約)
 *   A3: Sigma-Accumulation (σ蓄積)
 *   A4: Genesis (生成)
 * 
 * 六属性: field, flow, memory, layer, relation, will
 */

// ─── Axiom Types ───────────────────────────────────────────

/** A1: Center-Periphery structure */
export interface CenterPeriphery {
  center: string;
  periphery: string[];
}

/** A3: Sigma entry for accumulation tracking */
export interface SigmaEntry {
  timestamp: string;
  delta: number;
  note: string;
  source?: string;
}

/** A3: Sigma accumulation state */
export interface SigmaState {
  current: number;
  target?: number;
  history: SigmaEntry[];
}

// ─── Six Attributes (六属性) ───────────────────────────────

export interface SixAttributes {
  /** 場 — domain/context of the structure */
  field: string;
  /** 流 — flow pattern (sequential, parallel, cyclical) */
  flow: 'sequential' | 'parallel' | 'cyclical' | 'adaptive' | string;
  /** 記憶 — accumulated context and decisions */
  memory: string[];
  /** 層 — depth/layer level */
  layer: number;
  /** 関係 — connections to other structures */
  relation: Relation[];
  /** 意志 — intention/goal */
  will: string;
}

export interface Relation {
  target: string;
  type: 'depends-on' | 'extends' | 'composes' | 'mirrors' | string;
  note?: string;
}

// ─── MDim Structure ────────────────────────────────────────

export type ReiStructureType = 'project' | 'task' | 'idea' | 'analysis' | 'decision';

export interface ReiStructure {
  /** Rei format version */
  rei_version: string;
  /** Structure type */
  type: ReiStructureType;
  /** A1: Center (中心) */
  center: string;
  /** A1: Periphery (周囲) */
  periphery: PeripheryNode[];
  /** Six attributes */
  attributes: SixAttributes;
  /** A3: Sigma accumulation */
  sigma: SigmaState;
  /** A4: Genesis metadata */
  genesis: GenesisInfo;
  /** Local-only metadata */
  meta: ReiMeta;
}

export interface PeripheryNode {
  name: string;
  sigma: number;
  status: 'pending' | 'active' | 'done' | 'blocked';
  children?: PeripheryNode[];
}

export interface GenesisInfo {
  created_at: string;
  created_by: string;
  seed?: string;
}

export interface ReiMeta {
  updated_at: string;
  file_path?: string;
  tags: string[];
  local_only: true;
}

// ─── AI Export Format ──────────────────────────────────────

export interface ReiAIExport {
  /** Header for AI context */
  _rei_context: string;
  /** Compact structure for AI consumption */
  structure: {
    type: string;
    center: string;
    periphery: { name: string; progress: number; status: string }[];
    overall_progress: number;
    field: string;
    will: string;
    flow: string;
  };
  /** Key decisions and context */
  memory: string[];
  /** Current sigma state */
  sigma: {
    current: number;
    target?: number;
    recent_changes: { note: string; delta: number }[];
  };
  /** Actionable prompt hint */
  prompt_hint: string;
}

// ─── Constants ─────────────────────────────────────────────

export const REI_VERSION = '0.1.0';

export const STRUCTURE_TYPES: ReiStructureType[] = [
  'project', 'task', 'idea', 'analysis', 'decision'
];

export const DEFAULT_FLOW_PATTERNS = [
  'sequential', 'parallel', 'cyclical', 'adaptive'
] as const;
