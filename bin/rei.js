#!/usr/bin/env node

// ============================================================
// Rei (0₀式) CLI — REPL & File Execution
// v0.3 — Space-Layer-Diffusion Model
// Author: Nobuki Fujimoto
// ============================================================

const { Lexer } = require('../dist/index.js');
const { Parser } = require('../dist/index.js');
const { Evaluator } = require('../dist/index.js');
const fs = require('fs');
const path = require('path');
const readline = require('readline');

const VERSION = '0.5.2';

// --- Result formatting ---
function formatResult(val) {
  if (val === null || val === undefined) return 'null';
  if (typeof val === 'number') return String(val);
  if (typeof val === 'string') return `"${val}"`;
  if (typeof val === 'boolean') return String(val);
  if (Array.isArray(val)) return `[${val.map(formatResult).join(', ')}]`;

  if (val && typeof val === 'object') {
    switch (val.reiType) {
      case 'Ext':
        return `Ext(base=${val.base}, order=${val.order}, subs="${val.subscripts}", val*=${val.valStar()})`;
      case 'MDim':
        return `𝕄{${val.center}; ${val.neighbors.join(', ')}} :${val.mode}`;
      case 'State':
        return `Genesis(${val.state}, ω=${val.omega})`;
      case 'Function':
        return `compress ${val.name}(${val.params.join(', ')})`;
      case 'Quad':
        const sym = { top: '⊤', bottom: '⊥', topPi: '⊤π', bottomPi: '⊥π' };
        return sym[val.value] || val.value;
      // ── v0.3 Space-Layer-Diffusion ──
      case 'Space': {
        const layers = [];
        for (const [idx, layer] of val.layers) {
          const nodes = layer.nodes.map(n =>
            `𝕄{${n.center}; ${n.neighbors.slice(0, 4).join(', ')}${n.neighbors.length > 4 ? ', ...' : ''}}[stage=${n.stage}]`
          ).join(', ');
          const frozen = layer.frozen ? ' ❄' : '';
          layers.push(`  層 ${idx}${frozen}: ${nodes}`);
        }
        return `空{${val.topology !== 'flat' ? ` topology: ${val.topology}` : ''}\n${layers.join('\n')}\n} [global_stage=${val.globalStage}]`;
      }
      case 'DNode': {
        const ns = val.neighbors.slice(0, 4).join(', ') + (val.neighbors.length > 4 ? `, ... (${val.neighbors.length}方向)` : '');
        return `DNode{${val.center}; ${ns}} [stage=${val.stage}, ${val.momentum}]`;
      }
      case 'SigmaResult': {
        return `σ{ flow: {stage=${val.flow.stage}, dirs=${val.flow.directions}, ${val.flow.momentum}}, layer=${val.layer}, memory=[${val.memory.length}] }`;
      }
      default:
        // Handle plain objects (sigma sub-objects, resonance pairs, etc.)
        if (val.similarity !== undefined && val.nodeA && val.nodeB) {
          return `Resonance(層${val.nodeA.layer}[${val.nodeA.index}] ↔ 層${val.nodeB.layer}[${val.nodeB.index}], sim=${val.similarity})`;
        }
        if (val.stage !== undefined && val.momentum !== undefined && val.directions !== undefined) {
          return `σ.flow{stage=${val.stage}, dirs=${val.directions}, ${val.momentum}, v=${val.velocity}}`;
        }
        if (val.tendency !== undefined && val.strength !== undefined) {
          return `σ.will{τ=${val.tendency}, strength=${val.strength}}`;
        }
        if (val.layers !== undefined && val.total_nodes !== undefined) {
          return `σ.field{layers=${val.layers}, nodes=${val.total_nodes}, active=${val.active_nodes}}`;
        }
        if (val.global_stage !== undefined) {
          return `σ.flow{global_stage=${val.global_stage}, converged=${val.converged_nodes}, expanding=${val.expanding_nodes}}`;
        }
        return JSON.stringify(val);
    }
  }
  return String(val);
}

// --- Evaluate code string ---
function evaluate(code, evaluator) {
  const lexer = new Lexer(code);
  const tokens = lexer.tokenize();
  const parser = new Parser(tokens);
  const ast = parser.parseProgram();
  return evaluator.eval(ast);
}

// --- CLI argument parsing ---
const args = process.argv.slice(2);

if (args.includes('--version') || args.includes('-v')) {
  console.log(`rei-lang v${VERSION}`);
  process.exit(0);
}

if (args.includes('--help') || args.includes('-h')) {
  console.log(`
Rei (0₀式) — D-FUMT Computational Language v${VERSION}
Space-Layer-Diffusion Model (場-層-拡散計算モデル)

Usage:
  rei                    Start interactive REPL
  rei <file.rei>         Execute a Rei source file
  rei -e "<code>"        Evaluate inline code
  rei --version          Show version
  rei --help             Show this help

REPL commands:
  :env                   Show all bindings
  :ast <code>            Show AST for code
  :tokens <code>         Show token stream
  :reset                 Clear all state
  :quit                  Exit REPL

v0.3 New Features:
  空{ 層 N: 𝕄{...} }    Space literal with layers
  s |> step              Single diffusion step
  s |> diffuse(N)        Diffuse N steps
  s |> sigma             Self-reference (σ)
  s |> freeze(N)         Freeze layer N
  s |> thaw(N)           Thaw layer N
  s |> resonances(0.5)   Find resonance pairs

Author: Nobuki Fujimoto
`);
  process.exit(0);
}

// --- Inline eval: -e ---
const eIdx = args.indexOf('-e');
if (eIdx >= 0 && args[eIdx + 1]) {
  try {
    const evaluator = new Evaluator();
    const result = evaluate(args[eIdx + 1], evaluator);
    console.log(formatResult(result));
  } catch (e) {
    console.error(`Error: ${e.message}`);
    process.exit(1);
  }
  process.exit(0);
}

// --- File execution ---
if (args.length > 0 && !args[0].startsWith('-')) {
  const filePath = path.resolve(args[0]);
  try {
    const code = fs.readFileSync(filePath, 'utf-8');
    const evaluator = new Evaluator();
    const result = evaluate(code, evaluator);
    if (result !== null && result !== undefined) {
      console.log(formatResult(result));
    }
  } catch (e) {
    if (e.code === 'ENOENT') {
      console.error(`File not found: ${filePath}`);
    } else {
      console.error(`Error: ${e.message}`);
    }
    process.exit(1);
  }
  process.exit(0);
}

// --- Interactive REPL ---
console.log(`
 ╔══════════════════════════════════════════════╗
 ║  Rei (0₀式) REPL v${VERSION}                     ║
 ║  D-FUMT Computational Language               ║
 ║  Space-Layer-Diffusion Model (場-層-拡散)    ║
 ║  Author: Nobuki Fujimoto                     ║
 ╚══════════════════════════════════════════════╝

 Type :help for commands, :quit to exit
`);

const evaluator = new Evaluator();
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  prompt: '\x1b[33m零 >\x1b[0m ',
});

rl.prompt();

rl.on('line', (input) => {
  const trimmed = input.trim();
  if (!trimmed) { rl.prompt(); return; }

  // Meta commands
  if (trimmed === ':quit' || trimmed === ':q') {
    console.log('\nさようなら');
    process.exit(0);
  }
  if (trimmed === ':help' || trimmed === ':h') {
    console.log('  :env      Show all bindings');
    console.log('  :ast      Show AST for last input');
    console.log('  :tokens   Show token stream');
    console.log('  :reset    Clear state');
    console.log('  :quit     Exit');
    rl.prompt();
    return;
  }
  if (trimmed === ':reset') {
    Object.assign(evaluator, new Evaluator());
    console.log('  State reset.');
    rl.prompt();
    return;
  }
  if (trimmed === ':env') {
    const bindings = evaluator.env.allBindings();
    for (const [k, v] of bindings) {
      if (v.value && typeof v.value === 'object' && v.value.reiType === 'Function' && !v.value.body) continue;
      console.log(`  ${v.mutable ? 'mut ' : ''}${k} = ${formatResult(v.value)}`);
    }
    rl.prompt();
    return;
  }
  if (trimmed.startsWith(':ast ')) {
    try {
      const code = trimmed.slice(5);
      const lexer = new Lexer(code);
      const tokens = lexer.tokenize();
      const parser = new Parser(tokens);
      const ast = parser.parseProgram();
      console.log(JSON.stringify(ast, null, 2));
    } catch (e) { console.log(`\x1b[31m${e.message}\x1b[0m`); }
    rl.prompt();
    return;
  }
  if (trimmed.startsWith(':tokens ')) {
    try {
      const code = trimmed.slice(8);
      const lexer = new Lexer(code);
      const tokens = lexer.tokenize();
      tokens.forEach(t => console.log(`  ${t.type.padEnd(15)} ${JSON.stringify(t.value)}`));
    } catch (e) { console.log(`\x1b[31m${e.message}\x1b[0m`); }
    rl.prompt();
    return;
  }

  // Evaluate
  try {
    const result = evaluate(trimmed, evaluator);
    const out = formatResult(result);
    if (out !== 'null' && out !== 'undefined') {
      console.log(`\x1b[33m${out}\x1b[0m`);
    }
  } catch (e) {
    console.log(`\x1b[31m${e.message}\x1b[0m`);
  }
  rl.prompt();
});

rl.on('close', () => {
  console.log('\nさようなら');
  process.exit(0);
});
