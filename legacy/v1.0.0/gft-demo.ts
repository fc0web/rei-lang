// ============================================================
// Rei GFT Example — Graphic Formula Theory Demo
// ============================================================

import { mdnum, subscript, extnum, ComputationMode } from '../src/core';
import { fromMultiDim, fromExtended, fromGenesis, fromExpression, graphStats } from '../src/gft/graph';
import { applyLayout, renderSVG, renderToString } from '../src/gft/renderer';

// --- 1. Multi-Dimensional Number as Radial Graph ---
console.log('=== GFT: Multi-Dimensional Number ===');
const md = mdnum(5, [1, 2, 3, 4, 5, 6], undefined, ComputationMode.Weighted);
const mdGraph = fromMultiDim(md, 200, 200);
const mdSvg = renderToString(mdGraph, 'radial', 400, 400);
console.log(`Nodes: ${mdGraph.nodes.length}, Edges: ${mdGraph.edges.length}`);
console.log(`SVG size: ${mdSvg.length} chars`);

// --- 2. Extended Number Chain ---
console.log('\n=== GFT: Extended Number ===');
const en = extnum(subscript(0, ['o', 'o', 'o']));
const enGraph = fromExtended(en, 100, 200);
console.log(`0ooo graph: ${enGraph.nodes.length} nodes, ${enGraph.edges.length} edges`);

// --- 3. Genesis Axiom System ---
console.log('\n=== GFT: Genesis Axiom System ===');
const genesisGraph = fromGenesis();
const genesisSvg = renderToString(genesisGraph, 'hierarchical', 300, 500);
console.log(`Genesis: ${genesisGraph.nodes.length} phases, ${genesisGraph.edges.length} transitions`);
console.log(`SVG size: ${genesisSvg.length} chars`);

// --- 4. Expression Graph ---
console.log('\n=== GFT: Expression ===');
const exprGraph = fromExpression('2 + 3 * 4 |> sqrt');
const stats = graphStats(exprGraph);
console.log(`Expression graph:`, stats);

// --- 5. All Layout Algorithms ---
console.log('\n=== Layout Comparison ===');
const layouts = ['radial', 'hierarchical', 'force', 'grid'] as const;
for (const algo of layouts) {
  const laid = applyLayout(mdGraph, { algorithm: algo, width: 400, height: 400 });
  const output = renderSVG(laid, 400, 400);
  console.log(`${algo}: ${output.svg.length} chars`);
}

console.log('\n✅ GFT examples complete!');
