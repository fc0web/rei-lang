// Copyright 2024-2026 Nobuki Fujimoto (藤本伸樹)
// Licensed under the Apache License, Version 2.0
// See LICENSE file for details.
// ============================================================
// GFT Layout Engine & SVG Renderer
// D-FUMT Graphic Formula Theory — レイアウト＆描画
// ============================================================

import {
  FormulaGraph,
  GFTNode,
  GFTEdge,
  LayoutOptions,
  LayoutAlgorithm,
  GFTRenderOutput,
} from './types';
import { graph as makeGraph } from './graph';

// --- Layout Engine ---

export function applyLayout(
  g: FormulaGraph,
  options: Partial<LayoutOptions> = {}
): FormulaGraph {
  const opts: LayoutOptions = {
    algorithm: options.algorithm ?? 'radial',
    width: options.width ?? 600,
    height: options.height ?? 400,
    padding: options.padding ?? 40,
    nodeSpacing: options.nodeSpacing ?? 60,
    layerSpacing: options.layerSpacing ?? 80,
    centerX: options.centerX ?? (options.width ?? 600) / 2,
    centerY: options.centerY ?? (options.height ?? 400) / 2,
  };

  switch (opts.algorithm) {
    case 'radial':
      return layoutRadial(g, opts);
    case 'hierarchical':
      return layoutHierarchical(g, opts);
    case 'tree':
      return layoutTree(g, opts);
    case 'grid':
      return layoutGrid(g, opts);
    case 'force':
      return layoutForce(g, opts);
    default:
      return g;
  }
}

// --- Radial Layout (多次元数のcenter-neighbor構造に最適) ---

function layoutRadial(g: FormulaGraph, opts: LayoutOptions): FormulaGraph {
  const cx = opts.centerX!;
  const cy = opts.centerY!;

  // Find center node (first multidim or genesis or largest)
  const centerIdx = g.nodes.findIndex(
    (n) => n.kind === 'multidim' || n.kind === 'genesis' || n.kind === 'unified'
  );
  const ci = centerIdx >= 0 ? centerIdx : 0;

  // Build adjacency for BFS layers
  const adj = new Map<string, Set<string>>();
  for (const e of g.edges) {
    if (!adj.has(e.source)) adj.set(e.source, new Set());
    if (!adj.has(e.target)) adj.set(e.target, new Set());
    adj.get(e.source)!.add(e.target);
    adj.get(e.target)!.add(e.source);
  }

  // BFS to assign layers
  const layers = new Map<string, number>();
  const queue = [g.nodes[ci].id];
  layers.set(g.nodes[ci].id, 0);

  while (queue.length > 0) {
    const current = queue.shift()!;
    const layer = layers.get(current)!;
    for (const neighbor of adj.get(current) ?? []) {
      if (!layers.has(neighbor)) {
        layers.set(neighbor, layer + 1);
        queue.push(neighbor);
      }
    }
  }

  // Assign unvisited nodes
  for (const n of g.nodes) {
    if (!layers.has(n.id)) {
      layers.set(n.id, (layers.size > 0 ? Math.max(...layers.values()) : 0) + 1);
    }
  }

  // Position nodes by layer
  const maxLayer = Math.max(...layers.values(), 0);
  const layerGroups = new Map<number, string[]>();
  for (const [id, layer] of layers) {
    if (!layerGroups.has(layer)) layerGroups.set(layer, []);
    layerGroups.get(layer)!.push(id);
  }

  const positioned = g.nodes.map((n) => {
    const layer = layers.get(n.id) ?? 0;
    if (layer === 0) {
      return { ...n, x: cx, y: cy, layer: 0 };
    }

    const siblings = layerGroups.get(layer) ?? [n.id];
    const idx = siblings.indexOf(n.id);
    const count = siblings.length;
    const angle = (2 * Math.PI * idx) / count - Math.PI / 2;
    const radius = layer * opts.nodeSpacing;

    return {
      ...n,
      x: cx + Math.cos(angle) * radius,
      y: cy + Math.sin(angle) * radius,
      layer,
    };
  });

  return makeGraph(g.name, positioned, [...g.edges], { ...g.metadata, layout: 'radial' });
}

// --- Hierarchical Layout (生成公理系に最適) ---

function layoutHierarchical(g: FormulaGraph, opts: LayoutOptions): FormulaGraph {
  const cx = opts.centerX!;

  // Topological sort
  const inDegree = new Map<string, number>();
  const adj = new Map<string, string[]>();
  for (const n of g.nodes) {
    inDegree.set(n.id, 0);
    adj.set(n.id, []);
  }
  for (const e of g.edges) {
    inDegree.set(e.target, (inDegree.get(e.target) ?? 0) + 1);
    adj.get(e.source)?.push(e.target);
  }

  const layers = new Map<string, number>();
  const queue = g.nodes.filter((n) => (inDegree.get(n.id) ?? 0) === 0).map((n) => n.id);
  for (const id of queue) layers.set(id, 0);

  while (queue.length > 0) {
    const current = queue.shift()!;
    const layer = layers.get(current)!;
    for (const target of adj.get(current) ?? []) {
      if (!layers.has(target) || layers.get(target)! < layer + 1) {
        layers.set(target, layer + 1);
        queue.push(target);
      }
    }
  }

  // Assign unvisited
  for (const n of g.nodes) {
    if (!layers.has(n.id)) layers.set(n.id, 0);
  }

  const layerGroups = new Map<number, string[]>();
  for (const [id, layer] of layers) {
    if (!layerGroups.has(layer)) layerGroups.set(layer, []);
    layerGroups.get(layer)!.push(id);
  }

  const positioned = g.nodes.map((n) => {
    const layer = layers.get(n.id) ?? 0;
    const siblings = layerGroups.get(layer) ?? [n.id];
    const idx = siblings.indexOf(n.id);
    const count = siblings.length;
    const totalWidth = count * opts.nodeSpacing;
    const startX = cx - totalWidth / 2;

    return {
      ...n,
      x: startX + idx * opts.nodeSpacing + opts.nodeSpacing / 2,
      y: opts.padding + layer * opts.layerSpacing,
      layer,
    };
  });

  return makeGraph(g.name, positioned, [...g.edges], { ...g.metadata, layout: 'hierarchical' });
}

// --- Tree Layout ---

function layoutTree(g: FormulaGraph, opts: LayoutOptions): FormulaGraph {
  // Simplified: same as hierarchical with centered children
  return layoutHierarchical(g, opts);
}

// --- Grid Layout ---

function layoutGrid(g: FormulaGraph, opts: LayoutOptions): FormulaGraph {
  const cols = Math.ceil(Math.sqrt(g.nodes.length));

  const positioned = g.nodes.map((n, i) => {
    const row = Math.floor(i / cols);
    const col = i % cols;
    return {
      ...n,
      x: opts.padding + col * opts.nodeSpacing,
      y: opts.padding + row * opts.nodeSpacing,
      layer: row,
    };
  });

  return makeGraph(g.name, positioned, [...g.edges], { ...g.metadata, layout: 'grid' });
}

// --- Force-Directed Layout (simplified) ---

function layoutForce(g: FormulaGraph, opts: LayoutOptions): FormulaGraph {
  const positions = new Map<string, { x: number; y: number }>();

  // Initialize with random positions
  for (const n of g.nodes) {
    positions.set(n.id, {
      x: opts.centerX! + (Math.random() - 0.5) * opts.width * 0.6,
      y: opts.centerY! + (Math.random() - 0.5) * opts.height * 0.6,
    });
  }

  // Simple force simulation (50 iterations)
  const k = opts.nodeSpacing;
  for (let iter = 0; iter < 50; iter++) {
    const forces = new Map<string, { fx: number; fy: number }>();
    for (const n of g.nodes) forces.set(n.id, { fx: 0, fy: 0 });

    // Repulsion between all nodes
    for (let i = 0; i < g.nodes.length; i++) {
      for (let j = i + 1; j < g.nodes.length; j++) {
        const a = positions.get(g.nodes[i].id)!;
        const b = positions.get(g.nodes[j].id)!;
        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const dist = Math.max(Math.sqrt(dx * dx + dy * dy), 1);
        const force = (k * k) / dist;
        const fx = (dx / dist) * force;
        const fy = (dy / dist) * force;

        forces.get(g.nodes[i].id)!.fx -= fx;
        forces.get(g.nodes[i].id)!.fy -= fy;
        forces.get(g.nodes[j].id)!.fx += fx;
        forces.get(g.nodes[j].id)!.fy += fy;
      }
    }

    // Attraction along edges
    for (const e of g.edges) {
      const a = positions.get(e.source);
      const b = positions.get(e.target);
      if (!a || !b) continue;
      const dx = b.x - a.x;
      const dy = b.y - a.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const force = dist / k;
      const fx = (dx / dist) * force;
      const fy = (dy / dist) * force;

      forces.get(e.source)!.fx += fx;
      forces.get(e.source)!.fy += fy;
      forces.get(e.target)!.fx -= fx;
      forces.get(e.target)!.fy -= fy;
    }

    // Apply forces with cooling
    const cooling = 1 - iter / 50;
    for (const n of g.nodes) {
      const pos = positions.get(n.id)!;
      const f = forces.get(n.id)!;
      pos.x += f.fx * cooling * 0.1;
      pos.y += f.fy * cooling * 0.1;
      // Clamp to bounds
      pos.x = Math.max(opts.padding, Math.min(opts.width - opts.padding, pos.x));
      pos.y = Math.max(opts.padding, Math.min(opts.height - opts.padding, pos.y));
    }
  }

  const positioned = g.nodes.map((n) => {
    const pos = positions.get(n.id)!;
    return { ...n, x: pos.x, y: pos.y };
  });

  return makeGraph(g.name, positioned, [...g.edges], { ...g.metadata, layout: 'force' });
}

// --- SVG Renderer ---

export function renderSVG(g: FormulaGraph, width?: number, height?: number): GFTRenderOutput {
  const w = width ?? 600;
  const h = height ?? 400;

  const svgParts: string[] = [];

  // Header
  svgParts.push(`<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">`);
  svgParts.push(`<defs>`);

  // Glow filter
  svgParts.push(`<filter id="glow"><feGaussianBlur stdDeviation="3" result="blur"/>`);
  svgParts.push(`<feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge></filter>`);

  // Arrow marker
  svgParts.push(`<marker id="arrow" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto">`);
  svgParts.push(`<path d="M0,0 L8,3 L0,6 Z" fill="#a8a4a0"/></marker>`);

  // Animated dash
  svgParts.push(`<style>@keyframes dash{from{stroke-dashoffset:20}to{stroke-dashoffset:0}}`);
  svgParts.push(`.animated-edge{animation:dash 1s linear infinite}</style>`);

  svgParts.push(`</defs>`);

  // Background
  svgParts.push(`<rect width="${w}" height="${h}" fill="#0a0a12" rx="8"/>`);

  // Title
  svgParts.push(`<text x="${w / 2}" y="20" fill="#c4a265" font-family="serif" font-size="14" text-anchor="middle">${escapeXml(g.name)}</text>`);

  // Edges
  for (const e of g.edges) {
    const src = g.nodes.find((n) => n.id === e.source);
    const tgt = g.nodes.find((n) => n.id === e.target);
    if (!src || !tgt) continue;

    const dashAttrs = e.animated ? `stroke-dasharray="5,5" class="animated-edge"` : '';
    const curveAttr = e.curved ? buildCurvedPath(src, tgt) : `M${src.x},${src.y} L${tgt.x},${tgt.y}`;

    svgParts.push(
      `<path d="${curveAttr}" fill="none" stroke="${e.color}" stroke-width="${Math.max(1, e.weight)}" ` +
      `marker-end="url(#arrow)" opacity="0.7" ${dashAttrs}/>`
    );

    if (e.label) {
      const mx = (src.x + tgt.x) / 2;
      const my = (src.y + tgt.y) / 2;
      svgParts.push(
        `<text x="${mx}" y="${my - 5}" fill="${e.color}" font-size="9" text-anchor="middle" opacity="0.8">${escapeXml(e.label)}</text>`
      );
    }
  }

  // Nodes
  for (const n of g.nodes) {
    const filterAttr = n.glow ? `filter="url(#glow)"` : '';
    svgParts.push(
      `<circle cx="${n.x}" cy="${n.y}" r="${n.radius}" fill="${n.color}" ${filterAttr} opacity="0.9"/>`
    );
    svgParts.push(
      `<circle cx="${n.x}" cy="${n.y}" r="${n.radius}" fill="none" stroke="${n.color}" stroke-width="1" opacity="0.4"/>`
    );
    svgParts.push(
      `<text x="${n.x}" y="${n.y + 4}" fill="#f0ece4" font-family="serif" font-size="${Math.max(9, n.radius * 0.7)}" text-anchor="middle">${escapeXml(n.label)}</text>`
    );
  }

  svgParts.push(`</svg>`);

  return {
    svg: svgParts.join('\n'),
    width: w,
    height: h,
    nodeCount: g.nodes.length,
    edgeCount: g.edges.length,
  };
}

// --- Helpers ---

function buildCurvedPath(src: GFTNode, tgt: GFTNode): string {
  const mx = (src.x + tgt.x) / 2;
  const my = (src.y + tgt.y) / 2;
  const dx = tgt.x - src.x;
  const dy = tgt.y - src.y;
  const offset = Math.min(30, Math.sqrt(dx * dx + dy * dy) * 0.2);
  const cx = mx - dy * offset / Math.sqrt(dx * dx + dy * dy + 1);
  const cy = my + dx * offset / Math.sqrt(dx * dx + dy * dy + 1);
  return `M${src.x},${src.y} Q${cx},${cy} ${tgt.x},${tgt.y}`;
}

function escapeXml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// --- Convenience: Render to string ---

export function renderToString(
  g: FormulaGraph,
  layout: LayoutAlgorithm = 'radial',
  width: number = 600,
  height: number = 400
): string {
  const laid = applyLayout(g, { algorithm: layout, width, height });
  return renderSVG(laid, width, height).svg;
}
