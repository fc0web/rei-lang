/**
 * Rei MDim Structure Builder
 * 
 * Builds MDim structures following the four axioms:
 *   A1: Every structure has a center and periphery
 *   A2: Structures can extend or reduce
 *   A3: Progress accumulates via sigma (σ)
 *   A4: Structures emerge from genesis seeds
 */

import {
  ReiStructure,
  ReiStructureType,
  PeripheryNode,
  SigmaEntry,
  SixAttributes,
  ReiAIExport,
  REI_VERSION,
} from './types';

// ─── Builder ───────────────────────────────────────────────

export interface BuilderOptions {
  type: ReiStructureType;
  center: string;
  periphery: string[];
  field?: string;
  flow?: string;
  will?: string;
  tags?: string[];
  seed?: string;
  target?: number;
}

/**
 * Create a new ReiStructure (A4: Genesis)
 */
export function createStructure(opts: BuilderOptions): ReiStructure {
  const now = new Date().toISOString();

  const peripheryNodes: PeripheryNode[] = opts.periphery.map((name) => ({
    name: name.trim(),
    sigma: 0,
    status: 'pending' as const,
  }));

  const attributes: SixAttributes = {
    field: opts.field || inferField(opts.type),
    flow: opts.flow || inferFlow(opts.type),
    memory: [],
    layer: 0,
    relation: [],
    will: opts.will || `Complete: ${opts.center}`,
  };

  return {
    rei_version: REI_VERSION,
    type: opts.type,
    center: opts.center,
    periphery: peripheryNodes,
    attributes,
    sigma: {
      current: 0,
      target: opts.target,
      history: [{
        timestamp: now,
        delta: 0,
        note: `Genesis: ${opts.center}`,
        source: 'init',
      }],
    },
    genesis: {
      created_at: now,
      created_by: 'rei-cli',
      seed: opts.seed,
    },
    meta: {
      updated_at: now,
      tags: opts.tags || [],
      local_only: true,
    },
  };
}

// ─── A2: Extension / Reduction ─────────────────────────────

/**
 * Add periphery nodes (A2: Extension)
 */
export function extendPeriphery(
  structure: ReiStructure,
  names: string[]
): ReiStructure {
  const newNodes: PeripheryNode[] = names.map((name) => ({
    name: name.trim(),
    sigma: 0,
    status: 'pending' as const,
  }));

  return {
    ...structure,
    periphery: [...structure.periphery, ...newNodes],
    meta: { ...structure.meta, updated_at: new Date().toISOString() },
  };
}

/**
 * Remove periphery nodes (A2: Reduction)
 */
export function reducePeriphery(
  structure: ReiStructure,
  names: string[]
): ReiStructure {
  const removeSet = new Set(names.map((n) => n.trim().toLowerCase()));
  return {
    ...structure,
    periphery: structure.periphery.filter(
      (p) => !removeSet.has(p.name.toLowerCase())
    ),
    meta: { ...structure.meta, updated_at: new Date().toISOString() },
  };
}

// ─── A3: Sigma Operations ──────────────────────────────────

/**
 * Update sigma for a periphery node or the whole structure
 */
export function updateSigma(
  structure: ReiStructure,
  delta: number,
  note: string,
  peripheryName?: string
): ReiStructure {
  const now = new Date().toISOString();
  const entry: SigmaEntry = { timestamp: now, delta, note };

  let periphery = structure.periphery;

  if (peripheryName) {
    entry.source = peripheryName;
    periphery = structure.periphery.map((p) => {
      if (p.name.toLowerCase() === peripheryName.toLowerCase()) {
        const newSigma = Math.max(0, Math.min(100, p.sigma + delta));
        return {
          ...p,
          sigma: newSigma,
          status: newSigma >= 100 ? 'done' as const :
                  newSigma > 0 ? 'active' as const :
                  p.status,
        };
      }
      return p;
    });
  }

  // Recalculate overall sigma
  const overallSigma = periphery.length > 0
    ? Math.round(periphery.reduce((sum, p) => sum + p.sigma, 0) / periphery.length)
    : structure.sigma.current + delta;

  return {
    ...structure,
    periphery,
    sigma: {
      ...structure.sigma,
      current: overallSigma,
      history: [...structure.sigma.history, entry],
    },
    meta: { ...structure.meta, updated_at: now },
  };
}

/**
 * Add a memory entry
 */
export function addMemory(
  structure: ReiStructure,
  note: string
): ReiStructure {
  return {
    ...structure,
    attributes: {
      ...structure.attributes,
      memory: [...structure.attributes.memory, `[${new Date().toISOString().slice(0, 10)}] ${note}`],
    },
    meta: { ...structure.meta, updated_at: new Date().toISOString() },
  };
}

// ─── AI Export ─────────────────────────────────────────────

/**
 * Export structure for AI chat attachment
 */
export function exportForAI(structure: ReiStructure): ReiAIExport {
  const recentHistory = structure.sigma.history.slice(-5);

  return {
    _rei_context: [
      `Rei Structure (0₀式): ${structure.type} — "${structure.center}"`,
      `Progress: σ = ${structure.sigma.current}${structure.sigma.target ? `/${structure.sigma.target}` : '%'}`,
      `Field: ${structure.attributes.field} | Flow: ${structure.attributes.flow}`,
      `Will: ${structure.attributes.will}`,
    ].join('\n'),

    structure: {
      type: structure.type,
      center: structure.center,
      periphery: structure.periphery.map((p) => ({
        name: p.name,
        progress: p.sigma,
        status: p.status,
      })),
      overall_progress: structure.sigma.current,
      field: structure.attributes.field,
      will: structure.attributes.will,
      flow: structure.attributes.flow,
    },

    memory: structure.attributes.memory,

    sigma: {
      current: structure.sigma.current,
      target: structure.sigma.target,
      recent_changes: recentHistory.map((h) => ({
        note: h.note,
        delta: h.delta,
      })),
    },

    prompt_hint: generatePromptHint(structure),
  };
}

/**
 * Export as Markdown for human-readable attachment
 */
export function exportAsMarkdown(structure: ReiStructure): string {
  const lines: string[] = [];

  lines.push(`# Rei: ${structure.center}`);
  lines.push(`> Type: ${structure.type} | σ = ${structure.sigma.current}%`);
  lines.push('');

  lines.push('## Periphery (周囲)');
  for (const p of structure.periphery) {
    const bar = progressBar(p.sigma);
    lines.push(`- **${p.name}** ${bar} ${p.sigma}% [${p.status}]`);
  }
  lines.push('');

  lines.push('## Attributes (六属性)');
  lines.push(`- **Field (場):** ${structure.attributes.field}`);
  lines.push(`- **Flow (流):** ${structure.attributes.flow}`);
  lines.push(`- **Layer (層):** ${structure.attributes.layer}`);
  lines.push(`- **Will (意志):** ${structure.attributes.will}`);
  lines.push('');

  if (structure.attributes.memory.length > 0) {
    lines.push('## Memory (記憶)');
    for (const m of structure.attributes.memory) {
      lines.push(`- ${m}`);
    }
    lines.push('');
  }

  if (structure.sigma.history.length > 1) {
    lines.push('## Recent Sigma History');
    for (const h of structure.sigma.history.slice(-5)) {
      const sign = h.delta >= 0 ? '+' : '';
      lines.push(`- [${h.timestamp.slice(0, 16)}] ${sign}${h.delta} — ${h.note}`);
    }
    lines.push('');
  }

  lines.push('---');
  lines.push(`*Generated by rei-cli v${REI_VERSION} | ${new Date().toISOString().slice(0, 10)}*`);

  return lines.join('\n');
}

// ─── Helpers ───────────────────────────────────────────────

function inferField(type: ReiStructureType): string {
  const map: Record<ReiStructureType, string> = {
    project: 'engineering',
    task: 'execution',
    idea: 'exploration',
    analysis: 'research',
    decision: 'strategy',
  };
  return map[type] || 'general';
}

function inferFlow(type: ReiStructureType): string {
  const map: Record<ReiStructureType, string> = {
    project: 'sequential',
    task: 'sequential',
    idea: 'cyclical',
    analysis: 'parallel',
    decision: 'adaptive',
  };
  return map[type] || 'sequential';
}

function generatePromptHint(structure: ReiStructure): string {
  const pending = structure.periphery.filter((p) => p.status === 'pending');
  const active = structure.periphery.filter((p) => p.status === 'active');
  const blocked = structure.periphery.filter((p) => p.status === 'blocked');

  const hints: string[] = [];

  if (blocked.length > 0) {
    hints.push(`Blocked items need attention: ${blocked.map((b) => b.name).join(', ')}`);
  }
  if (active.length > 0) {
    hints.push(`Currently active: ${active.map((a) => `${a.name}(${a.sigma}%)`).join(', ')}`);
  }
  if (pending.length > 0 && active.length === 0) {
    hints.push(`Next to start: ${pending[0].name}`);
  }
  if (structure.sigma.current >= 90) {
    hints.push('Near completion — review and finalize.');
  }

  return hints.length > 0
    ? `Please help with this ${structure.type}. ${hints.join(' ')}`
    : `Please help advance this ${structure.type}: "${structure.center}"`;
}

function progressBar(percent: number): string {
  const filled = Math.round(percent / 10);
  const empty = 10 - filled;
  return `[${'█'.repeat(filled)}${'░'.repeat(empty)}]`;
}
