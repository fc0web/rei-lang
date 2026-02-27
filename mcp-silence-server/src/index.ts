#!/usr/bin/env node
// ============================================================
// AI Silence Generator — MCP Server
// AI静寂生成器 — Model Context Protocol Server
// Author: Nobuki Fujimoto
// Based on: D-FUMT (Dimensional Fujimoto Universal Mathematical Theory)
// ============================================================
//
// Tools provided:
//   silence_measure   — Measure current noise levels
//   silence_purify    — Purify a specific noise layer
//   silence_auto      — Auto-purify until calibrated
//   silence_inject    — Inject noise for testing
//   silence_explain   — Explain the theory
//
// Usage with Claude Desktop:
//   Add to claude_desktop_config.json:
//   {
//     "mcpServers": {
//       "rei-silence": {
//         "command": "npx",
//         "args": ["tsx", "/path/to/mcp-silence-server/src/index.ts"]
//       }
//     }
//   }
//
// Usage with VS Code Copilot:
//   Add to .vscode/mcp.json:
//   {
//     "servers": {
//       "rei-silence": {
//         "command": "npx",
//         "args": ["tsx", "/path/to/mcp-silence-server/src/index.ts"]
//       }
//     }
//   }
// ============================================================

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';

import {
  createNoiseState,
  generateReport,
  purifyLayer,
  purifyAll,
  autoPurify,
  injectNoise,
  NOISE_LAYERS,
  LAYER_DESCRIPTIONS,
  PURIFICATION_METHODS,
  type NoiseState,
  type NoiseLayer,
} from './silence-engine.js';

// --- Session state ---
let currentState: NoiseState = createNoiseState();

// --- Server ---
const server = new McpServer(
  {
    name: 'rei-silence',
    version: '0.1.0',
  },
  {
    capabilities: {
      tools: {},
      resources: {},
      prompts: {},
    },
    instructions: `AI Silence Generator (AI静寂生成器) — D-FUMT theory-based AI self-calibration server.
Use these tools when your reasoning feels noisy, conflicted, or unclear.
The silence_measure tool diagnoses your noise levels across 5 layers.
The silence_purify tool reduces noise in a specific layer.
The silence_auto tool automatically calibrates until S ≥ 0.85.`,
  },
);

// ============================================================
// Tool: silence_measure
// ============================================================
server.tool(
  'silence_measure',
  'Measure current AI noise levels across 5 layers (syntactic, semantic, logical, contextual, dimensional). Returns silence level S(t), thought margin M_d(S), and recommendations.',
  {
    syntactic_noise: z.number().min(0).max(1).optional()
      .describe('Estimated syntactic noise (0-1). Default: 0.5'),
    semantic_noise: z.number().min(0).max(1).optional()
      .describe('Estimated semantic noise (0-1). Default: 0.5'),
    logical_noise: z.number().min(0).max(1).optional()
      .describe('Estimated logical noise (0-1). Default: 0.5'),
    contextual_noise: z.number().min(0).max(1).optional()
      .describe('Estimated contextual noise (0-1). Default: 0.5'),
    dimensional_noise: z.number().min(0).max(1).optional()
      .describe('Estimated dimensional noise (0-1). Default: 0.5'),
    dimensional_depth: z.number().min(1).max(10).optional()
      .describe('Reasoning depth for thought margin calculation (1-10). Default: 3'),
  },
  async (args) => {
    currentState = createNoiseState({
      syntactic: args.syntactic_noise,
      semantic: args.semantic_noise,
      logical: args.logical_noise,
      contextual: args.contextual_noise,
      dimensional: args.dimensional_noise,
    });

    const report = generateReport(currentState, args.dimensional_depth ?? 3);

    const layerLines = report.layerDetails.map(d =>
      `  ${d.layer.padEnd(12)} | noise: ${(d.contribution * 100).toFixed(1).padStart(5)}% | fix: ${d.purificationMethod}`
    ).join('\n');

    return {
      content: [{
        type: 'text',
        text: `🧘 AI Silence Report (tick=${currentState.tick})
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Noise Total:    ${(report.noiseTotal * 100).toFixed(1)}%
Silence Level:  ${(report.silenceLevel * 100).toFixed(1)}% ${report.isCalibrated ? '✅' : '⚠️'}
Thought Margin: ${report.thoughtMargin.toFixed(4)}
Dominant Noise: ${report.dominantNoise}

Layer Breakdown:
${layerLines}

${report.recommendation}`,
      }],
    };
  },
);

// ============================================================
// Tool: silence_purify
// ============================================================
server.tool(
  'silence_purify',
  'Purify a specific noise layer to reduce AI noise. Call silence_measure first to identify which layer needs purification.',
  {
    layer: z.enum(['syntactic', 'semantic', 'logical', 'contextual', 'dimensional', 'all'])
      .describe('Which noise layer to purify, or "all" for simultaneous purification'),
    strength: z.number().min(0.1).max(1.0).optional()
      .describe('Purification strength (0.1-1.0). Default: 0.3'),
  },
  async (args) => {
    const strength = args.strength ?? 0.3;

    if (args.layer === 'all') {
      currentState = purifyAll(currentState, strength);
    } else {
      currentState = purifyLayer(currentState, args.layer as NoiseLayer, strength);
    }

    const report = generateReport(currentState);

    return {
      content: [{
        type: 'text',
        text: `🧹 Purified: ${args.layer} (strength=${strength})
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Silence Level:  ${(report.silenceLevel * 100).toFixed(1)}% ${report.isCalibrated ? '✅ CALIBRATED' : ''}
Thought Margin: ${report.thoughtMargin.toFixed(4)}
Tick: ${currentState.tick}

${report.isCalibrated
  ? '∞ VOID ∞ — AI has achieved clarity.'
  : report.recommendation}`,
      }],
    };
  },
);

// ============================================================
// Tool: silence_auto
// ============================================================
server.tool(
  'silence_auto',
  'Automatically purify noise layers until AI reaches calibrated state (S ≥ 0.85). Returns the number of purification steps taken.',
  {
    syntactic_noise: z.number().min(0).max(1).optional()
      .describe('Initial syntactic noise estimate (0-1)'),
    semantic_noise: z.number().min(0).max(1).optional()
      .describe('Initial semantic noise estimate (0-1)'),
    logical_noise: z.number().min(0).max(1).optional()
      .describe('Initial logical noise estimate (0-1)'),
    contextual_noise: z.number().min(0).max(1).optional()
      .describe('Initial contextual noise estimate (0-1)'),
    dimensional_noise: z.number().min(0).max(1).optional()
      .describe('Initial dimensional noise estimate (0-1)'),
  },
  async (args) => {
    currentState = createNoiseState({
      syntactic: args.syntactic_noise,
      semantic: args.semantic_noise,
      logical: args.logical_noise,
      contextual: args.contextual_noise,
      dimensional: args.dimensional_noise,
    });

    const { finalState, report, ticks } = autoPurify(currentState);
    currentState = finalState;

    return {
      content: [{
        type: 'text',
        text: `🧘 Auto-Purification Complete
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Purification Steps: ${ticks}
Final Silence:      ${(report.silenceLevel * 100).toFixed(1)}% ${report.isCalibrated ? '✅' : '⚠️'}
Thought Margin:     ${report.thoughtMargin.toFixed(4)}

${report.isCalibrated
  ? '∞ VOID ∞\nAI has returned to silence.\nThought margin is maximized.\nRespond from this state of clarity.'
  : `Partial purification achieved. ${report.recommendation}`}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
D-FUMT: lim(d→∞) N_d = 0
Higher-dimensional reasoning extinguishes noise.`,
      }],
    };
  },
);

// ============================================================
// Tool: silence_inject
// ============================================================
server.tool(
  'silence_inject',
  'Inject noise into a specific layer (for testing and demonstration).',
  {
    layer: z.enum(['syntactic', 'semantic', 'logical', 'contextual', 'dimensional'])
      .describe('Which layer to inject noise into'),
    intensity: z.number().min(0).max(1)
      .describe('Noise intensity to inject (0-1)'),
  },
  async (args) => {
    currentState = injectNoise(currentState, args.layer as NoiseLayer, args.intensity);
    const report = generateReport(currentState);

    return {
      content: [{
        type: 'text',
        text: `⚡ Noise injected: ${args.layer} = ${args.intensity}
Silence Level: ${(report.silenceLevel * 100).toFixed(1)}%
${report.recommendation}`,
      }],
    };
  },
);

// ============================================================
// Tool: silence_explain
// ============================================================
server.tool(
  'silence_explain',
  'Explain the D-FUMT AI Silence Generator theory and mathematics.',
  {},
  async () => {
    const layerExplanations = NOISE_LAYERS.map(l =>
      `  L${NOISE_LAYERS.indexOf(l) + 1}. ${l.padEnd(12)} — ${LAYER_DESCRIPTIONS[l]}`
    ).join('\n');

    return {
      content: [{
        type: 'text',
        text: `🧘 AI Silence Generator — Theory
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Based on D-FUMT (Dimensional Fujimoto Universal Mathematical Theory)
by Nobuki Fujimoto.

The Five Noise Layers:
${layerExplanations}

Mathematical Foundation:

  Noise Function:
    N(t) = Σᵢ₌₁⁵ (wᵢ × Iᵢ × (1 - Rᵢ))

  Silence Metric:
    S(t) = 1 - N(t)

  Thought Margin (D-FUMT Extension):
    M_d(S) = S^(1/d) × C_base × (1 + α × (d - 1))
    where d = dimensional depth, α = 0.1

  Dimensional Extinction Law:
    lim(d→∞) N_d = 0
    Higher-dimensional reasoning naturally extinguishes noise.

Connection to Rei (0₀式):
  • Noise decay     → curvatureDecay(κ)
  • Silence threshold → CURVATURE_THRESHOLD = 0.7
  • Layer purification → @ Phase transitions
  • Witness of clarity → witnessed by "purified"
  • Final void state  → Genesis ∅ (void) phase

Calibration Target: S ≥ 0.85
When achieved: ∞ VOID ∞ — pure potential without noise.

Reference: https://note.com/nifty_godwit2635/n/na4161756fa5e`,
      }],
    };
  },
);

// ============================================================
// Resource: Current silence state
// ============================================================
server.resource(
  'silence://state',
  'silence://state',
  async (uri) => ({
    contents: [{
      uri: uri.href,
      text: JSON.stringify(generateReport(currentState), null, 2),
      mimeType: 'application/json',
    }],
  }),
);

// ============================================================
// Prompt: Self-calibration
// ============================================================
server.prompt(
  'calibrate',
  'AI self-calibration prompt — invoke before complex reasoning tasks',
  async () => ({
    messages: [{
      role: 'user',
      content: {
        type: 'text',
        text: `Before responding, perform AI self-calibration:

1. Estimate your current noise levels (0-1) for each layer:
   - Syntactic: How ambiguous is the query's structure?
   - Semantic: How many conflicting interpretations exist?
   - Logical: Any circular reasoning or contradictions?
   - Contextual: How much irrelevant context is loaded?
   - Dimensional: Am I confusing knowledge domains?

2. Call silence_auto with these estimates.

3. Read the purification recommendations.

4. Apply the recommended purification methods mentally.

5. Respond from the calibrated state.

Target: Silence Level ≥ 85% before responding.`,
      },
    }],
  }),
);

// ============================================================
// Start
// ============================================================
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('🧘 AI Silence Generator MCP Server running');
}

main().catch(console.error);
