// Copyright 2024-2026 Nobuki Fujimoto (藤本伸樹)
// Licensed under the Apache License, Version 2.0
// See LICENSE file for details.
// ============================================================
// GFT Formula Graph Builder
// D-FUMT Graphic Formula Theory — グラフ構築エンジン
// ============================================================

import {
  GFTNode,
  GFTEdge,
  FormulaGraph,
  GFTNodeKind,
  GFTEdgeKind,
  GFT_COLORS,
  GFT_EDGE_COLORS,
  GraphTransform,
} from './types';
import { MultiDimNumber, ExtendedNumber, ComputationMode } from '../core/types';
import { toNotation } from '../core/extended';

// --- ID Generation ---

let _idCounter = 0;
function nextId(prefix: string = 'n'): string {
  return `${prefix}_${(++_idCounter).toString(36)}`;
}

export function resetIdCounter(): void {
  _idCounter = 0;
}

// --- Node Builder ---

export function node(
  kind: GFTNodeKind,
  label: string,
  opts: Partial<Omit<GFTNode, 'id' | 'kind' | 'label'>> = {}
): GFTNode {
  return Object.freeze({
    id: opts.x !== undefined ? nextId(kind[0]) : nextId(kind[0]),
    kind,
    label,
    value: opts.value,
    metadata: Object.freeze(opts.metadata ?? {}),
    x: opts.x ?? 0,
    y: opts.y ?? 0,
    radius: opts.radius ?? (kind === 'group' ? 30 : kind === 'genesis' ? 20 : 15),
    color: opts.color ?? GFT_COLORS[kind],
    glow: opts.glow ?? (kind === 'genesis' || kind === 'pipe'),
    layer: opts.layer ?? 0,
  });
}

// --- Edge Builder ---

export function edge(
  source: string,
  target: string,
  kind: GFTEdgeKind,
  opts: Partial<Omit<GFTEdge, 'id' | 'source' | 'target' | 'kind'>> = {}
): GFTEdge {
  return Object.freeze({
    id: nextId('e'),
    source,
    target,
    kind,
    weight: opts.weight ?? 1,
    label: opts.label,
    curved: opts.curved ?? (kind === 'neighbor' || kind === 'genesis'),
    color: opts.color ?? GFT_EDGE_COLORS[kind],
    animated: opts.animated ?? (kind === 'genesis' || kind === 'pipe' || kind === 'extension'),
  });
}

// --- Graph Builder ---

export function graph(
  name: string,
  nodes: GFTNode[],
  edges: GFTEdge[],
  metadata: Record<string, unknown> = {}
): FormulaGraph {
  return Object.freeze({
    id: nextId('g'),
    name,
    nodes: Object.freeze([...nodes]),
    edges: Object.freeze([...edges]),
    metadata: Object.freeze(metadata),
  });
}

// --- Build from Multi-Dimensional Number ---

export function fromMultiDim(md: MultiDimNumber, cx: number = 0, cy: number = 0): FormulaGraph {
  const centerNode = node('multidim', `${md.center}`, {
    value: md.center,
    x: cx,
    y: cy,
    radius: 20,
    glow: true,
    metadata: { mode: md.mode, direction: md.direction },
  });

  const nodes: GFTNode[] = [centerNode];
  const edges: GFTEdge[] = [];

  const n = md.neighbors.length;
  const angleStep = (2 * Math.PI) / n;

  for (let i = 0; i < n; i++) {
    const angle = -Math.PI / 2 + i * angleStep * (md.direction === 'cw' ? 1 : -1);
    const nx = cx + Math.cos(angle) * 80;
    const ny = cy + Math.sin(angle) * 80;

    const neighborNode = node('value', `${md.neighbors[i]}`, {
      value: md.neighbors[i],
      x: nx,
      y: ny,
      metadata: { weight: md.weights[i], index: i },
    });

    nodes.push(neighborNode);
    edges.push(
      edge(neighborNode.id, centerNode.id, 'neighbor', {
        weight: md.weights[i],
        label: `w=${md.weights[i]}`,
      })
    );
  }

  return graph(`MultiDim(${md.center})`, nodes, edges, { source: 'multidim' });
}

// --- Build from Extended Number ---

export function fromExtended(en: ExtendedNumber, cx: number = 0, cy: number = 0): FormulaGraph {
  const notation = toNotation(en.subscript);
  const nodes: GFTNode[] = [];
  const edges: GFTEdge[] = [];

  // Base node
  const baseNode = node('extended', notation.sensory, {
    value: en.value,
    x: cx,
    y: cy,
    glow: true,
    metadata: { notation, phase: en.phase },
  });
  nodes.push(baseNode);

  // Subscript character nodes (as a chain)
  let prevId = baseNode.id;
  for (let i = 0; i < en.subscript.chars.length; i++) {
    const charNode = node('value', en.subscript.chars[i], {
      x: cx + (i + 1) * 50,
      y: cy,
      radius: 10,
      metadata: { charIndex: i },
    });
    nodes.push(charNode);
    edges.push(
      edge(prevId, charNode.id, 'extension', {
        label: `dim ${i + 1}`,
        animated: true,
      })
    );
    prevId = charNode.id;
  }

  return graph(`Extended(${notation.sensory})`, nodes, edges, { source: 'extended' });
}

// --- Build from Expression String ---

export function fromExpression(expr: string): FormulaGraph {
  // Simple expression parser for GFT visualization
  const tokens = tokenize(expr);
  const { nodes, edges, rootId } = buildExprTree(tokens);
  return graph(`Expr(${expr})`, nodes, edges, { expression: expr, rootId });
}

// --- Simple Expression Tokenizer ---

interface Token {
  type: 'number' | 'variable' | 'operator' | 'lparen' | 'rparen' | 'function' | 'pipe';
  value: string;
}

function tokenize(expr: string): Token[] {
  const tokens: Token[] = [];
  let i = 0;
  const s = expr.replace(/\s+/g, '');

  while (i < s.length) {
    // Pipe operator
    if (s.slice(i, i + 2) === '|>') {
      tokens.push({ type: 'pipe', value: '|>' });
      i += 2;
      continue;
    }
    if (s.slice(i, i + 2) === '<|') {
      tokens.push({ type: 'pipe', value: '<|' });
      i += 2;
      continue;
    }

    const c = s[i];

    if (c === '(') { tokens.push({ type: 'lparen', value: '(' }); i++; continue; }
    if (c === ')') { tokens.push({ type: 'rparen', value: ')' }); i++; continue; }
    if ('+-*/^⊕⊗⊖⊘'.includes(c)) {
      tokens.push({ type: 'operator', value: c }); i++; continue;
    }

    // Number
    if (/\d/.test(c) || (c === '.' && i + 1 < s.length && /\d/.test(s[i + 1]))) {
      let num = '';
      while (i < s.length && (/\d/.test(s[i]) || s[i] === '.')) {
        num += s[i]; i++;
      }
      tokens.push({ type: 'number', value: num });
      continue;
    }

    // Function or variable
    if (/[a-zA-Zα-ωΑ-Ω_₀]/.test(c)) {
      let name = '';
      while (i < s.length && /[a-zA-Zα-ωΑ-Ω_₀0-9]/.test(s[i])) {
        name += s[i]; i++;
      }
      const isFn = ['sin', 'cos', 'tan', 'exp', 'log', 'sqrt', 'abs', 'compress'].includes(name);
      tokens.push({ type: isFn ? 'function' : 'variable', value: name });
      continue;
    }

    i++; // skip unknown
  }

  return tokens;
}

// --- Build Expression Tree as GFT Graph ---

function buildExprTree(tokens: Token[]): {
  nodes: GFTNode[];
  edges: GFTEdge[];
  rootId: string;
} {
  const nodes: GFTNode[] = [];
  const edges: GFTEdge[] = [];

  let yLevel = 0;
  let xPos = 0;

  function createNodeFromToken(tok: Token): GFTNode {
    const kindMap: Record<string, GFTNodeKind> = {
      number: 'value',
      variable: 'variable',
      operator: 'operator',
      function: 'function',
      pipe: 'pipe',
    };

    const n = node(kindMap[tok.type] ?? 'value', tok.value, {
      value: tok.type === 'number' ? parseFloat(tok.value) : tok.value,
      x: xPos * 60,
      y: yLevel * 80,
    });
    xPos++;
    return n;
  }

  // Simple flat visualization (proper AST would need recursive descent)
  let prevNodeId: string | null = null;

  for (const tok of tokens) {
    if (tok.type === 'lparen' || tok.type === 'rparen') continue;

    const n = createNodeFromToken(tok);
    nodes.push(n);

    if (prevNodeId && tok.type === 'operator') {
      // Operator connects to previous
      edges.push(edge(prevNodeId, n.id, 'input'));
    } else if (prevNodeId && tok.type === 'pipe') {
      edges.push(edge(prevNodeId, n.id, 'pipe', { animated: true }));
    } else if (prevNodeId) {
      // Value/variable after operator
      const lastOp = [...nodes].reverse().find((nd) => nd.kind === 'operator' || nd.kind === 'pipe');
      if (lastOp) {
        edges.push(edge(lastOp.id, n.id, 'output'));
      }
    }

    prevNodeId = n.id;
  }

  return { nodes, edges, rootId: nodes[0]?.id ?? '' };
}

// --- Build Genesis Graph ---

export function fromGenesis(): FormulaGraph {
  const voidNode = node('genesis', '∅', { x: 0, y: 0, radius: 12, metadata: { phase: 'void' } });
  const dotNode = node('genesis', '・', { x: 0, y: -80, radius: 16, glow: true, metadata: { phase: 'dot' } });
  const zzNode = node('genesis', '0₀', { x: 0, y: -160, radius: 18, glow: true, metadata: { phase: 'zero_zero' } });
  const zeroNode = node('genesis', '0', { x: 0, y: -240, radius: 20, glow: true, metadata: { phase: 'zero' } });
  const numNode = node('genesis', 'ℕ', { x: 0, y: -320, radius: 22, metadata: { phase: 'number' } });

  const nodes = [voidNode, dotNode, zzNode, zeroNode, numNode];
  const edges = [
    edge(voidNode.id, dotNode.id, 'genesis', { label: 'G-E₁', animated: true }),
    edge(dotNode.id, zzNode.id, 'genesis', { label: 'G-S₀', animated: true }),
    edge(zzNode.id, zeroNode.id, 'genesis', { label: 'G-S₁', animated: true }),
    edge(zeroNode.id, numNode.id, 'genesis', { label: 'G-N₁', animated: true }),
  ];

  return graph('Genesis Axiom System', nodes, edges, { source: 'genesis' });
}

// --- Graph Transforms ---

export function applyTransform(g: FormulaGraph, transform: GraphTransform): FormulaGraph {
  switch (transform.type) {
    case 'extend': {
      const targetNode = g.nodes.find((n) => n.id === transform.nodeId);
      if (!targetNode) return g;

      const newNode = node('value', transform.char, {
        x: targetNode.x + 50,
        y: targetNode.y,
        radius: 10,
      });

      const newEdge = edge(targetNode.id, newNode.id, 'extension', {
        label: `⊕${transform.char}`,
        animated: true,
      });

      return graph(g.name, [...g.nodes, newNode], [...g.edges, newEdge], g.metadata);
    }

    case 'reduce': {
      const lastEdge = [...g.edges]
        .reverse()
        .find((e) => e.source === transform.nodeId && e.kind === 'extension');
      if (!lastEdge) return g;

      return graph(
        g.name,
        g.nodes.filter((n) => n.id !== lastEdge.target),
        g.edges.filter((e) => e.id !== lastEdge.id),
        g.metadata
      );
    }

    case 'decompose': {
      const mdNode = g.nodes.find((n) => n.id === transform.nodeId && n.kind === 'multidim');
      if (!mdNode) return g;
      // Already decomposed in radial view
      return g;
    }

    case 'compose': {
      const nodesToCompose = g.nodes.filter((n) => transform.nodeIds.includes(n.id));
      if (nodesToCompose.length < 2) return g;

      const avgX = nodesToCompose.reduce((s, n) => s + n.x, 0) / nodesToCompose.length;
      const avgY = nodesToCompose.reduce((s, n) => s + n.y, 0) / nodesToCompose.length;

      const composedNode = node('multidim', 'M', {
        x: avgX,
        y: avgY,
        radius: 20,
        glow: true,
        value: nodesToCompose.map((n) => n.value).join(','),
      });

      const newEdges = nodesToCompose.map((n) =>
        edge(n.id, composedNode.id, 'neighbor')
      );

      return graph(
        g.name,
        [...g.nodes, composedNode],
        [...g.edges, ...newEdges],
        g.metadata
      );
    }

    case 'simplify': {
      // Remove redundant identity nodes (0 in addition, 1 in multiplication)
      const simplifiedNodes = g.nodes.filter((n) => {
        if (n.kind === 'value' && n.value === 0) {
          const hasAddEdge = g.edges.some(
            (e) =>
              (e.source === n.id || e.target === n.id) &&
              g.nodes.find((op) =>
                (op.id === e.source || op.id === e.target) &&
                op.kind === 'operator' &&
                op.value === '+'
              )
          );
          return !hasAddEdge;
        }
        return true;
      });

      const simplifiedEdges = g.edges.filter(
        (e) =>
          simplifiedNodes.some((n) => n.id === e.source) &&
          simplifiedNodes.some((n) => n.id === e.target)
      );

      return graph(g.name, simplifiedNodes, simplifiedEdges, {
        ...g.metadata,
        simplified: true,
      });
    }

    default:
      return g;
  }
}

// --- Graph Statistics ---

export function graphStats(g: FormulaGraph): {
  nodeCount: number;
  edgeCount: number;
  kindDistribution: Record<string, number>;
  maxDepth: number;
  connectivity: number;
} {
  const kindDist: Record<string, number> = {};
  for (const n of g.nodes) {
    kindDist[n.kind] = (kindDist[n.kind] ?? 0) + 1;
  }

  // BFS for max depth
  const adjList = new Map<string, string[]>();
  for (const e of g.edges) {
    if (!adjList.has(e.source)) adjList.set(e.source, []);
    adjList.get(e.source)!.push(e.target);
  }

  let maxDepth = 0;
  const visited = new Set<string>();

  function dfs(nodeId: string, depth: number) {
    if (visited.has(nodeId)) return;
    visited.add(nodeId);
    maxDepth = Math.max(maxDepth, depth);
    for (const neighbor of adjList.get(nodeId) ?? []) {
      dfs(neighbor, depth + 1);
    }
  }

  if (g.nodes.length > 0) {
    dfs(g.nodes[0].id, 0);
  }

  return {
    nodeCount: g.nodes.length,
    edgeCount: g.edges.length,
    kindDistribution: kindDist,
    maxDepth,
    connectivity: g.nodes.length > 0 ? g.edges.length / g.nodes.length : 0,
  };
}
