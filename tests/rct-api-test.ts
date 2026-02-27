#!/usr/bin/env tsx
/**
 * RCT 方向3 — API実接続テスト
 * ==============================
 * 実際のClaude APIを使って意味的圧縮を実測する
 *
 * 実行方法:
 *   ANTHROPIC_API_KEY=sk-ant-... npx tsx tests/rct-api-test.ts
 *
 * Rei v0.4統合に向けた実測データを取得する
 */

import * as zlib from 'zlib';

// ============================================================
// Claude API呼び出し
// ============================================================

const API_ENDPOINT = 'https://api.anthropic.com/v1/messages';
const MODEL = 'claude-sonnet-4-20250514';

async function callClaude(prompt: string, maxTokens: number = 4096): Promise<string> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    console.error('❌ ANTHROPIC_API_KEY が設定されていません');
    console.error('   実行例: ANTHROPIC_API_KEY=sk-ant-... npx tsx tests/rct-api-test.ts');
    process.exit(1);
  }

  const response = await fetch(API_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'anthropic-version': '2023-06-01',
      'x-api-key': apiKey,
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: maxTokens,
      messages: [{ role: 'user', content: prompt }],
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`API error ${response.status}: ${err}`);
  }

  const data = await response.json() as { content: Array<{ text?: string }> };
  return data.content?.[0]?.text || '';
}

// ============================================================
// テストケース
// ============================================================

const TEST_CASES: Array<{
  name: string;
  description: string;
  code: string;
}> = [
  {
    name: 'math-utils',
    description: '数学ユーティリティ関数群（factorial, fibonacci, isPrime）',
    code: `/**
 * Calculate the factorial of a number
 * @param n - Non-negative integer
 * @returns n! (factorial)
 */
export function factorial(n: number): number {
  if (n < 0) throw new Error('Negative input not allowed');
  if (n <= 1) return 1;
  return n * factorial(n - 1);
}

/**
 * Calculate fibonacci number at position n
 * Uses iterative approach for efficiency
 */
export function fibonacci(n: number): number {
  if (n < 0) throw new Error('Negative input not allowed');
  if (n <= 1) return n;
  let a = 0, b = 1;
  for (let i = 2; i <= n; i++) {
    [a, b] = [b, a + b];
  }
  return b;
}

/**
 * Check if a number is prime using 6k±1 optimization
 */
export function isPrime(n: number): boolean {
  if (n < 2) return false;
  if (n < 4) return true;
  if (n % 2 === 0 || n % 3 === 0) return false;
  for (let i = 5; i * i <= n; i += 6) {
    if (n % i === 0 || n % (i + 2) === 0) return false;
  }
  return true;
}

/**
 * Greatest common divisor (Euclidean algorithm)
 */
export function gcd(a: number, b: number): number {
  while (b !== 0) {
    [a, b] = [b, a % b];
  }
  return Math.abs(a);
}`,
  },
  {
    name: 'task-queue',
    description: 'イベント駆動型タスクキュー（優先度・並行制御付き）',
    code: `import { EventEmitter } from 'events';

interface TaskOptions {
  priority: 'low' | 'medium' | 'high';
  timeout?: number;
}

interface Task {
  id: string;
  name: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  options: TaskOptions;
  result?: unknown;
  error?: Error;
}

export class TaskQueue extends EventEmitter {
  private tasks: Map<string, Task> = new Map();
  private running: Set<string> = new Set();
  private maxConcurrency: number;
  private idCounter = 0;

  constructor(maxConcurrency = 3) {
    super();
    this.maxConcurrency = maxConcurrency;
  }

  add(name: string, options: TaskOptions = { priority: 'medium' }): string {
    const id = \`task_\${++this.idCounter}\`;
    this.tasks.set(id, { id, name, status: 'pending', options });
    this.emit('added', id);
    this.processNext();
    return id;
  }

  async processNext(): Promise<void> {
    if (this.running.size >= this.maxConcurrency) return;
    const pending = [...this.tasks.values()]
      .filter(t => t.status === 'pending')
      .sort((a, b) => {
        const order = { high: 0, medium: 1, low: 2 };
        return order[a.options.priority] - order[b.options.priority];
      });
    if (!pending.length) return;

    const task = pending[0];
    task.status = 'running';
    this.running.add(task.id);

    try {
      const timeout = task.options.timeout || 30000;
      task.result = await Promise.race([
        this.execute(task),
        new Promise((_, rej) => setTimeout(() => rej(new Error('Timeout')), timeout)),
      ]);
      task.status = 'completed';
      this.emit('completed', task.id);
    } catch (e) {
      task.status = 'failed';
      task.error = e as Error;
      this.emit('failed', task.id);
    } finally {
      this.running.delete(task.id);
      this.processNext();
    }
  }

  private async execute(task: Task): Promise<unknown> {
    return new Promise(r => setTimeout(() => r({ id: task.id, ok: true }), 50));
  }

  getStats() {
    const all = [...this.tasks.values()];
    return {
      total: all.length,
      pending: all.filter(t => t.status === 'pending').length,
      running: all.filter(t => t.status === 'running').length,
      completed: all.filter(t => t.status === 'completed').length,
      failed: all.filter(t => t.status === 'failed').length,
    };
  }
}`,
  },
  {
    name: 'dijkstra',
    description: 'Dijkstra最短経路 + トポロジカルソート',
    code: `interface Edge { to: number; weight: number; }

export function dijkstra(graph: Edge[][], source: number) {
  const n = graph.length;
  const dist = new Array(n).fill(Infinity);
  const prev: (number | null)[] = new Array(n).fill(null);
  const visited = new Array(n).fill(false);
  const pq: [number, number][] = [];

  dist[source] = 0;
  pq.push([0, source]);

  while (pq.length) {
    pq.sort((a, b) => a[0] - b[0]);
    const [d, u] = pq.shift()!;
    if (visited[u]) continue;
    visited[u] = true;
    if (d > dist[u]) continue;

    for (const { to, weight } of graph[u]) {
      const alt = dist[u] + weight;
      if (alt < dist[to]) {
        dist[to] = alt;
        prev[to] = u;
        pq.push([alt, to]);
      }
    }
  }

  return {
    distances: dist,
    path(from: number, to: number): number[] {
      if (dist[to] === Infinity) return [];
      const p: number[] = [];
      let c: number | null = to;
      while (c !== null) { p.unshift(c); c = prev[c]; }
      return p[0] === from ? p : [];
    },
  };
}

export function topologicalSort(adj: number[][]): number[] | null {
  const n = adj.length;
  const inDeg = new Array(n).fill(0);
  for (const nbrs of adj) for (const v of nbrs) inDeg[v]++;

  const queue: number[] = [];
  for (let i = 0; i < n; i++) if (inDeg[i] === 0) queue.push(i);

  const result: number[] = [];
  while (queue.length) {
    const u = queue.shift()!;
    result.push(u);
    for (const v of adj[u]) if (--inDeg[v] === 0) queue.push(v);
  }
  return result.length === n ? result : null;
}`,
  },
];

// ============================================================
// 意味抽出プロンプト（圧縮）
// ============================================================

function buildExtractionPrompt(code: string): string {
  return `You are a Semantic Compression Engine (RCT — Rei Compression Theory).

TASK: Extract the minimal "generative parameters θ" from this source code.
The goal is to produce the SMALLEST possible JSON that still contains enough
information for another LLM to regenerate functionally equivalent code.

RULES:
- Be EXTREMELY concise. Every byte counts.
- Use abbreviations and short keys.
- Omit anything that can be reasonably inferred.
- Do NOT include the actual code — only the description of what it does.

OUTPUT FORMAT (respond with ONLY this JSON, no markdown, no explanation):
{"i":"intent in <10 words","s":"structure summary","a":["algorithm1","algorithm2"],"d":["dep1"],"t":"key types compact","e":["edge case1"],"c":{"CONST":"val"},"io":"func(params)->ret; ...","l":"lang"}

SOURCE CODE:
\`\`\`
${code}
\`\`\``;
}

// ============================================================
// 復元プロンプト（解凍）
// ============================================================

function buildReconstructionPrompt(theta: string, language: string): string {
  return `You are a Code Reconstruction Engine (RCT — Rei Compression Theory).

TASK: From the following compressed parameters θ, generate COMPLETE, RUNNABLE
${language} source code that is FUNCTIONALLY EQUIVALENT to the original.

GENERATIVE PARAMETERS θ:
${theta}

RULES:
1. Generate complete, runnable code with all imports
2. Match every function/class described in θ
3. Handle all listed edge cases
4. Use idiomatic ${language}
5. Include JSDoc/comments for public APIs

OUTPUT: Respond with ONLY the source code, no explanations.`;
}

// ============================================================
// 等価性検証プロンプト
// ============================================================

function buildVerifyPrompt(original: string, reconstructed: string): string {
  return `Compare these two code files for SEMANTIC EQUIVALENCE.
Do they produce the same outputs for the same inputs?

ORIGINAL:
\`\`\`
${original.substring(0, 2500)}
\`\`\`

RECONSTRUCTED:
\`\`\`
${reconstructed.substring(0, 2500)}
\`\`\`

Respond with ONLY this format (no other text):
SCORE: 0.XX
FUNCTIONAL: 0.XX
STRUCTURAL: 0.XX
MISSING: list any missing functions or features
EXTRA: list any added functions or features`;
}

// ============================================================
// メイン: 圧縮 → 復元 → 検証 の完全サイクル
// ============================================================

async function runFullCycle() {
  console.log('');
  console.log('╔══════════════════════════════════════════════════════════════════╗');
  console.log('║  RCT 方向3: API実接続テスト — LLM意味的圧縮の実測             ║');
  console.log('║  D-FUMT Theory #67 — Rei v0.4統合に向けた検証                  ║');
  console.log('║  Author: Nobuki Fujimoto (藤本 伸樹)                           ║');
  console.log('╚══════════════════════════════════════════════════════════════════╝');
  console.log('');
  console.log(`  Model: ${MODEL}`);
  console.log(`  API: ${API_ENDPOINT}`);
  console.log('');

  const allResults: Array<{
    name: string;
    original_bytes: number;
    gzip_bytes: number;
    gzip_ratio: number;
    theta_bytes: number;
    theta_ratio: number;
    improvement_over_gzip: number;
    reconstructed_bytes: number;
    semantic_score: number;
    functional_score: number;
    structural_score: number;
    theta_content: string;
  }> = [];

  for (const tc of TEST_CASES) {
    console.log(`━━━ ${tc.name}: ${tc.description} ━━━`);
    console.log('');

    const originalBytes = Buffer.byteLength(tc.code, 'utf-8');
    const gzipBytes = zlib.gzipSync(Buffer.from(tc.code, 'utf-8'), { level: 9 }).length;
    const gzipRatio = gzipBytes / originalBytes;

    // ── Step 1: 圧縮（意味抽出） ──
    console.log('  [1/3] 圧縮中... (LLMが意味を抽出)');
    const t1 = Date.now();
    const theta = await callClaude(buildExtractionPrompt(tc.code), 1024);
    const compressTime = Date.now() - t1;

    const thetaBytes = Buffer.byteLength(theta, 'utf-8');
    const thetaRatio = thetaBytes / originalBytes;
    const improvement = (1 - thetaRatio / gzipRatio) * 100;

    console.log(`         θ = ${theta.substring(0, 120)}...`);
    console.log(`         ${thetaBytes} bytes (${(thetaRatio * 100).toFixed(1)}%) | ${compressTime}ms`);
    console.log('');

    // ── Step 2: 復元（コード再生成） ──
    console.log('  [2/3] 復元中... (LLMがθからコードを再生成)');
    const t2 = Date.now();
    const reconstructed = await callClaude(buildReconstructionPrompt(theta, 'TypeScript'), 4096);
    const decompressTime = Date.now() - t2;

    const reconBytes = Buffer.byteLength(reconstructed, 'utf-8');
    console.log(`         復元: ${reconBytes} bytes | ${decompressTime}ms`);
    console.log('');

    // ── Step 3: 検証（意味的等価性） ──
    console.log('  [3/3] 検証中... (意味的等価性を評価)');
    const t3 = Date.now();
    const verification = await callClaude(buildVerifyPrompt(tc.code, reconstructed), 512);
    const verifyTime = Date.now() - t3;

    // スコア抽出
    const scoreMatch = verification.match(/SCORE:\s*([\d.]+)/);
    const funcMatch = verification.match(/FUNCTIONAL:\s*([\d.]+)/);
    const structMatch = verification.match(/STRUCTURAL:\s*([\d.]+)/);
    const score = scoreMatch ? parseFloat(scoreMatch[1]) : 0;
    const funcScore = funcMatch ? parseFloat(funcMatch[1]) : 0;
    const structScore = structMatch ? parseFloat(structMatch[1]) : 0;

    console.log(`         ${verification.split('\n').slice(0, 5).join('\n         ')}`);
    console.log(`         ${verifyTime}ms`);
    console.log('');

    // ── 結果表示 ──
    const winner = thetaRatio < gzipRatio ? '✅ RCT勝利' : '❌ gzip勝利';
    console.log(`  ┌─────────────────────────────────────────────────┐`);
    console.log(`  │ 元サイズ:     ${String(originalBytes).padStart(6)} bytes                      │`);
    console.log(`  │ gzip:         ${String(gzipBytes).padStart(6)} bytes (${(gzipRatio * 100).toFixed(1).padStart(5)}%)               │`);
    console.log(`  │ RCT semantic: ${String(thetaBytes).padStart(6)} bytes (${(thetaRatio * 100).toFixed(1).padStart(5)}%)               │`);
    console.log(`  │ ${winner}  gzip比 ${improvement > 0 ? '+' : ''}${improvement.toFixed(1)}%                      │`);
    console.log(`  │ 意味的忠実度: ${(score * 100).toFixed(0)}%                                │`);
    console.log(`  │ 圧縮: ${compressTime}ms | 復元: ${decompressTime}ms | 検証: ${verifyTime}ms      │`);
    console.log(`  └─────────────────────────────────────────────────┘`);
    console.log('');

    allResults.push({
      name: tc.name,
      original_bytes: originalBytes,
      gzip_bytes: gzipBytes,
      gzip_ratio: gzipRatio,
      theta_bytes: thetaBytes,
      theta_ratio: thetaRatio,
      improvement_over_gzip: improvement,
      reconstructed_bytes: reconBytes,
      semantic_score: score,
      functional_score: funcScore,
      structural_score: structScore,
      theta_content: theta,
    });
  }

  // ── 総合結果 ──
  console.log('');
  console.log('╔══════════════════════════════════════════════════════════════════╗');
  console.log('║  総合結果                                                       ║');
  console.log('╠══════════════════════════════════════════════════════════════════╣');

  const wins = allResults.filter(r => r.theta_ratio < r.gzip_ratio).length;
  const losses = allResults.filter(r => r.theta_ratio >= r.gzip_ratio).length;
  const avgTheta = allResults.reduce((s, r) => s + r.theta_ratio, 0) / allResults.length;
  const avgGzip = allResults.reduce((s, r) => s + r.gzip_ratio, 0) / allResults.length;
  const avgScore = allResults.reduce((s, r) => s + r.semantic_score, 0) / allResults.length;
  const avgImprove = allResults.reduce((s, r) => s + r.improvement_over_gzip, 0) / allResults.length;

  console.log(`║  RCT vs gzip: ${wins}勝 ${losses}敗                                           ║`);
  console.log(`║  平均圧縮率:  gzip ${(avgGzip * 100).toFixed(1)}%  →  RCT ${(avgTheta * 100).toFixed(1)}%                       ║`);
  console.log(`║  平均改善率:  ${avgImprove > 0 ? '+' : ''}${avgImprove.toFixed(1)}% vs gzip                                    ║`);
  console.log(`║  平均意味忠実度: ${(avgScore * 100).toFixed(0)}%                                       ║`);
  console.log('╚══════════════════════════════════════════════════════════════════╝');
  console.log('');

  // ── JSON保存 ──
  const output = {
    timestamp: new Date().toISOString(),
    model: MODEL,
    results: allResults,
    summary: {
      wins, losses,
      avg_gzip_ratio: avgGzip,
      avg_theta_ratio: avgTheta,
      avg_improvement: avgImprove,
      avg_semantic_fidelity: avgScore,
    },
  };

  const fs = await import('fs');
  const outPath = 'docs/rct-api-test-results.json';
  fs.mkdirSync('docs', { recursive: true });
  fs.writeFileSync(outPath, JSON.stringify(output, null, 2));
  console.log(`  📊 結果保存: ${outPath}`);

  return output;
}

// 実行
runFullCycle().catch(err => {
  console.error('エラー:', err.message);
  process.exit(1);
});
