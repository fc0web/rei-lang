// ============================================================
// Rei (0₀式) stdlib — network module
// 多元数学ネットワーク理論: グラフ構造のRei的操作
// ============================================================
// 核心的洞察: Reiの多次元数 [c; n₁,...,nₙ] はそれ自体が
// 「1ノード(center) + n本のエッジ(neighbors)」のスターグラフ。
// ネットワーク全体はスターグラフの合成として表現される。
// ============================================================

// --- Types ---

export interface ReiNode {
  readonly id: number;
  readonly center: number;       // ノード固有値（多次元数の中心）
  readonly neighbors: number[];  // エッジ重み（多次元数の周囲値）
}

export interface ReiEdge {
  readonly source: number;
  readonly target: number;
  readonly weight: number;
}

export type ComputationMode = 'additive' | 'multiplicative' | 'weighted' | 'geometric';

export interface ReiGraph {
  readonly nodes: ReiNode[];
  readonly edges: ReiEdge[];
  readonly directed: boolean;
  readonly mode: ComputationMode;
}

export interface PathResult {
  readonly path: number[];
  readonly distance: number;
}

export interface DegreeInfo {
  readonly in: number;
  readonly out: number;
  readonly total: number;
}

// --- Graph Construction ---

export function createGraph(
  nodes: Array<{ center: number; neighbors?: number[] }>,
  edges?: Array<{ source: number; target: number; weight?: number }>,
  opts?: { directed?: boolean; mode?: ComputationMode }
): ReiGraph {
  const directed = opts?.directed ?? false;
  const mode = opts?.mode ?? 'additive';

  const reiNodes: ReiNode[] = nodes.map((n, i) => ({
    id: i,
    center: n.center,
    neighbors: n.neighbors ?? [],
  }));

  const reiEdges: ReiEdge[] = edges
    ? edges.map(e => ({ source: e.source, target: e.target, weight: e.weight ?? 1 }))
    : inferEdges(reiNodes);

  return Object.freeze({ nodes: reiNodes, edges: reiEdges, directed, mode });
}

function inferEdges(nodes: ReiNode[]): ReiEdge[] {
  const edges: ReiEdge[] = [];
  for (const node of nodes) {
    for (let i = 0; i < node.neighbors.length; i++) {
      const targetId = i < nodes.length ? i : i % nodes.length;
      if (targetId !== node.id) {
        edges.push({ source: node.id, target: targetId, weight: node.neighbors[i] });
      }
    }
  }
  return edges;
}

export function addNode(graph: ReiGraph, node: { center: number; neighbors?: number[] }): ReiGraph {
  const newId = graph.nodes.length;
  const newNode: ReiNode = { id: newId, center: node.center, neighbors: node.neighbors ?? [] };
  return Object.freeze({
    ...graph,
    nodes: [...graph.nodes, newNode],
  });
}

export function addEdge(graph: ReiGraph, source: number, target: number, weight = 1): ReiGraph {
  const edge: ReiEdge = { source, target, weight };
  const edges = [...graph.edges, edge];
  if (!graph.directed) {
    edges.push({ source: target, target: source, weight });
  }
  return Object.freeze({ ...graph, edges });
}

export function fromAdjacency(matrix: number[][], opts?: { directed?: boolean }): ReiGraph {
  const n = matrix.length;
  const directed = opts?.directed ?? false;
  const nodes: Array<{ center: number; neighbors: number[] }> = [];
  const edges: Array<{ source: number; target: number; weight: number }> = [];

  for (let i = 0; i < n; i++) {
    const row = matrix[i];
    const neighborWeights: number[] = [];
    for (let j = 0; j < row.length; j++) {
      if (row[j] !== 0 && i !== j) {
        neighborWeights.push(row[j]);
        if (directed || j > i) {
          edges.push({ source: i, target: j, weight: row[j] });
        }
      }
    }
    nodes.push({ center: matrix[i][i] || 0, neighbors: neighborWeights });
  }

  return createGraph(nodes, edges, { directed });
}

export function toAdjacency(graph: ReiGraph): number[][] {
  const n = graph.nodes.length;
  const matrix: number[][] = Array.from({ length: n }, () => new Array(n).fill(0));

  for (const node of graph.nodes) {
    matrix[node.id][node.id] = node.center;
  }
  for (const edge of graph.edges) {
    matrix[edge.source][edge.target] = edge.weight;
    if (!graph.directed) {
      matrix[edge.target][edge.source] = edge.weight;
    }
  }
  return matrix;
}

// --- Graph Analysis ---

export function degree(graph: ReiGraph, nodeIndex: number): DegreeInfo {
  let inDeg = 0, outDeg = 0;
  for (const e of graph.edges) {
    if (e.source === nodeIndex) outDeg++;
    if (e.target === nodeIndex) inDeg++;
  }
  return { in: inDeg, out: outDeg, total: inDeg + outDeg };
}

export function getNeighbors(graph: ReiGraph, nodeIndex: number): number[] {
  const result = new Set<number>();
  for (const e of graph.edges) {
    if (e.source === nodeIndex) result.add(e.target);
    if (!graph.directed && e.target === nodeIndex) result.add(e.source);
  }
  return [...result];
}

export function shortestPath(graph: ReiGraph, src: number, dst: number): PathResult {
  const n = graph.nodes.length;
  const dist = new Array(n).fill(Infinity);
  const prev = new Array(n).fill(-1);
  const visited = new Set<number>();
  dist[src] = 0;

  for (let iter = 0; iter < n; iter++) {
    let u = -1;
    let minDist = Infinity;
    for (let i = 0; i < n; i++) {
      if (!visited.has(i) && dist[i] < minDist) {
        u = i;
        minDist = dist[i];
      }
    }
    if (u === -1 || u === dst) break;
    visited.add(u);

    for (const e of graph.edges) {
      let neighbor = -1;
      let w = 0;
      if (e.source === u) { neighbor = e.target; w = e.weight; }
      else if (!graph.directed && e.target === u) { neighbor = e.source; w = e.weight; }
      if (neighbor >= 0 && dist[u] + w < dist[neighbor]) {
        dist[neighbor] = dist[u] + w;
        prev[neighbor] = u;
      }
    }
  }

  if (dist[dst] === Infinity) return { path: [], distance: Infinity };

  const path: number[] = [];
  for (let v = dst; v !== -1; v = prev[v]) path.unshift(v);
  return { path, distance: dist[dst] };
}

export function connected(graph: ReiGraph): boolean {
  if (graph.nodes.length === 0) return true;
  const visited = new Set<number>();
  const stack = [0];
  while (stack.length > 0) {
    const u = stack.pop()!;
    if (visited.has(u)) continue;
    visited.add(u);
    for (const nb of getNeighbors(graph, u)) {
      if (!visited.has(nb)) stack.push(nb);
    }
  }
  return visited.size === graph.nodes.length;
}

export function components(graph: ReiGraph): number[][] {
  const visited = new Set<number>();
  const result: number[][] = [];

  for (let i = 0; i < graph.nodes.length; i++) {
    if (visited.has(i)) continue;
    const comp: number[] = [];
    const stack = [i];
    while (stack.length > 0) {
      const u = stack.pop()!;
      if (visited.has(u)) continue;
      visited.add(u);
      comp.push(u);
      for (const nb of getNeighbors(graph, u)) {
        if (!visited.has(nb)) stack.push(nb);
      }
    }
    result.push(comp.sort((a, b) => a - b));
  }
  return result;
}

// --- Rei-specific Operations ---

export function pagerank(graph: ReiGraph, damping = 0.85, iterations = 100): number[] {
  const n = graph.nodes.length;
  if (n === 0) return [];

  let ranks = new Array(n).fill(1 / n);
  const outDeg = new Array(n).fill(0);
  for (const e of graph.edges) outDeg[e.source]++;

  for (let iter = 0; iter < iterations; iter++) {
    const newRanks = new Array(n).fill((1 - damping) / n);
    for (const e of graph.edges) {
      if (outDeg[e.source] > 0) {
        newRanks[e.target] += damping * ranks[e.source] / outDeg[e.source];
      }
    }
    ranks = newRanks;
  }
  return ranks;
}

export function centrality(
  graph: ReiGraph,
  type: 'degree' | 'betweenness' | 'closeness' = 'degree'
): number[] {
  const n = graph.nodes.length;
  if (n === 0) return [];

  if (type === 'degree') {
    return graph.nodes.map((_, i) => degree(graph, i).total / (n > 1 ? n - 1 : 1));
  }

  if (type === 'closeness') {
    return graph.nodes.map((_, i) => {
      let totalDist = 0;
      let reachable = 0;
      for (let j = 0; j < n; j++) {
        if (i === j) continue;
        const sp = shortestPath(graph, i, j);
        if (sp.distance < Infinity) {
          totalDist += sp.distance;
          reachable++;
        }
      }
      return reachable > 0 ? reachable / totalDist : 0;
    });
  }

  // betweenness (simplified Brandes-like)
  const bc = new Array(n).fill(0);
  for (let s = 0; s < n; s++) {
    for (let t = s + 1; t < n; t++) {
      const sp = shortestPath(graph, s, t);
      if (sp.path.length > 2) {
        for (let k = 1; k < sp.path.length - 1; k++) {
          bc[sp.path[k]] += 1;
        }
      }
    }
  }
  const maxBC = Math.max(...bc, 1);
  return bc.map(v => v / maxBC);
}

/** Rei的縮約: ノード統合（center値の類似するノードを結合） */
export function compressGraph(graph: ReiGraph, threshold = 0.1): ReiGraph {
  const n = graph.nodes.length;
  if (n <= 1) return graph;

  const groups: number[][] = [];
  const assigned = new Set<number>();

  for (let i = 0; i < n; i++) {
    if (assigned.has(i)) continue;
    const group = [i];
    assigned.add(i);
    for (let j = i + 1; j < n; j++) {
      if (assigned.has(j)) continue;
      const diff = Math.abs(graph.nodes[i].center - graph.nodes[j].center);
      const maxVal = Math.max(Math.abs(graph.nodes[i].center), Math.abs(graph.nodes[j].center), 1);
      if (diff / maxVal < threshold) {
        group.push(j);
        assigned.add(j);
      }
    }
    groups.push(group);
  }

  const newNodes = groups.map(g => {
    const centers = g.map(i => graph.nodes[i].center);
    const avgCenter = centers.reduce((a, b) => a + b, 0) / centers.length;
    const allNeighbors = g.flatMap(i => graph.nodes[i].neighbors);
    return { center: avgCenter, neighbors: allNeighbors };
  });

  const nodeMap = new Map<number, number>();
  groups.forEach((g, idx) => g.forEach(old => nodeMap.set(old, idx)));

  const edgeSet = new Set<string>();
  const newEdges: Array<{ source: number; target: number; weight: number }> = [];
  for (const e of graph.edges) {
    const s = nodeMap.get(e.source)!;
    const t = nodeMap.get(e.target)!;
    if (s === t) continue;
    const key = `${s}-${t}`;
    if (!edgeSet.has(key)) {
      edgeSet.add(key);
      newEdges.push({ source: s, target: t, weight: e.weight });
    }
  }

  return createGraph(newNodes, newEdges, { directed: graph.directed, mode: graph.mode });
}

/** Rei的拡張: ノード分裂 */
export function expandGraph(graph: ReiGraph, nodeIndex: number): ReiGraph {
  const node = graph.nodes[nodeIndex];
  if (!node || node.neighbors.length < 2) return graph;

  const mid = Math.floor(node.neighbors.length / 2);
  const n1 = { center: node.center, neighbors: node.neighbors.slice(0, mid) };
  const n2 = { center: node.center, neighbors: node.neighbors.slice(mid) };

  const newNodes = [
    ...graph.nodes.slice(0, nodeIndex).map(n => ({ center: n.center, neighbors: [...n.neighbors] })),
    n1, n2,
    ...graph.nodes.slice(nodeIndex + 1).map(n => ({ center: n.center, neighbors: [...n.neighbors] })),
  ];

  const newId2 = nodeIndex + 1;
  const newEdges = graph.edges.map(e => ({
    source: e.source === nodeIndex ? nodeIndex :
            e.source > nodeIndex ? e.source + 1 : e.source,
    target: e.target === nodeIndex ? nodeIndex :
            e.target > nodeIndex ? e.target + 1 : e.target,
    weight: e.weight,
  }));
  newEdges.push({ source: nodeIndex, target: newId2, weight: node.center });

  return createGraph(newNodes, newEdges, { directed: graph.directed, mode: graph.mode });
}

// --- Graph Transforms ---

export function transpose(graph: ReiGraph): ReiGraph {
  const newEdges = graph.edges.map(e => ({
    source: e.target,
    target: e.source,
    weight: e.weight,
  }));
  return Object.freeze({ ...graph, edges: newEdges });
}

export function graphUnion(a: ReiGraph, b: ReiGraph): ReiGraph {
  const offset = a.nodes.length;
  const allNodes = [
    ...a.nodes.map(n => ({ center: n.center, neighbors: [...n.neighbors] })),
    ...b.nodes.map(n => ({ center: n.center, neighbors: [...n.neighbors] })),
  ];
  const allEdges = [
    ...a.edges,
    ...b.edges.map(e => ({ source: e.source + offset, target: e.target + offset, weight: e.weight })),
  ];
  return createGraph(allNodes, allEdges, { directed: a.directed || b.directed, mode: a.mode });
}

export function subgraph(graph: ReiGraph, nodeIndices: number[]): ReiGraph {
  const indexSet = new Set(nodeIndices);
  const remap = new Map<number, number>();
  nodeIndices.forEach((old, idx) => remap.set(old, idx));

  const nodes = nodeIndices.map(i => ({
    center: graph.nodes[i].center,
    neighbors: [...graph.nodes[i].neighbors],
  }));

  const edges = graph.edges
    .filter(e => indexSet.has(e.source) && indexSet.has(e.target))
    .map(e => ({ source: remap.get(e.source)!, target: remap.get(e.target)!, weight: e.weight }));

  return createGraph(nodes, edges, { directed: graph.directed, mode: graph.mode });
}
