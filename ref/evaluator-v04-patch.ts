/**
 * RCT 方向3 — evaluator.ts 統合パッチ
 * ======================================
 * Rei v0.4用: semantic_compress / semantic_decompress / semantic_verify
 *
 * 既存のevaluator.tsに追加するコード。
 * 方向2の compress/decompress に並ぶ形で配置してください。
 *
 * 使い方（Rei構文）:
 *   data |> semantic_compress              # デフォルト（LLM, high忠実度）
 *   data |> semantic_compress("llm","low") # モデルと忠実度を指定
 *   theta |> semantic_decompress           # θからコード復元
 *   [orig, recon] |> semantic_verify       # 意味的等価性検証
 *
 * Author: Nobuki Fujimoto (藤本 伸樹) & Claude
 */

// ============================================================
// 1. パーサーへの追加（parser.ts）
// ============================================================
// 以下のキーワードをparser.tsのパイプコマンド認識部分に追加:
//
//   'semantic_compress'
//   'semantic_decompress'  
//   'semantic_verify'
//
// 既存の 'compress' / 'decompress' と同じパターンで認識させる

// ============================================================
// 2. evaluator.ts への追加
// ============================================================

/*
  handlePipeCommand() の switch文に以下のcaseを追加:

  case 'semantic_compress': {
    return await this.handleSemanticCompress(input, args);
  }
  case 'semantic_decompress': {
    return await this.handleSemanticDecompress(input);
  }
  case 'semantic_verify': {
    return await this.handleSemanticVerify(input);
  }
*/

// ── semantic_compress ──

interface SemanticThetaCompact {
  _rct: 'semantic';         // RCTマーカー
  v: '3.0';                 // 方向3バージョン
  m: string;                // model_type
  f: string;                // fidelity
  t: string;                // theta (圧縮された意味記述)
  os: number;               // original_size
  ts: number;               // theta_size
  r: number;                // compression_ratio
}

/**
 * semantic_compress の実装
 *
 * @param input - 圧縮対象の文字列データ
 * @param args - [model_type?, fidelity?] 省略時はデフォルト値
 * @returns SemanticThetaCompact
 */
async function handleSemanticCompress(
  input: unknown,
  args: unknown[] = []
): Promise<SemanticThetaCompact> {
  // 入力を文字列に変換
  const data = typeof input === 'string' ? input : JSON.stringify(input);
  const modelType = typeof args[0] === 'string' ? args[0] : 'llm';
  const fidelity = typeof args[1] === 'string' ? args[1] : 'high';

  const originalSize = Buffer.byteLength(data, 'utf-8');

  // API keyが設定されていればLLMで圧縮、なければローカル
  const apiKey = process.env.ANTHROPIC_API_KEY || '';

  let theta: string;

  if (apiKey && modelType === 'llm') {
    // LLM意味圧縮
    theta = await callClaudeForCompression(data, fidelity, apiKey);
  } else {
    // ローカルフォールバック（パターンマッチ）
    theta = localSemanticExtract(data);
  }

  const thetaSize = Buffer.byteLength(theta, 'utf-8');

  return {
    _rct: 'semantic',
    v: '3.0',
    m: modelType,
    f: fidelity,
    t: theta,
    os: originalSize,
    ts: thetaSize,
    r: thetaSize / originalSize,
  };
}

/**
 * semantic_decompress の実装
 */
async function handleSemanticDecompress(
  input: unknown
): Promise<string> {
  const theta = input as SemanticThetaCompact;

  if (!theta || theta._rct !== 'semantic') {
    throw new Error('Invalid input: expected SemanticThetaCompact (output of semantic_compress)');
  }

  const apiKey = process.env.ANTHROPIC_API_KEY || '';

  if (apiKey && theta.m === 'llm') {
    return await callClaudeForReconstruction(theta.t, apiKey);
  } else {
    // ローカルフォールバック: θをそのまま返す（復元不可）
    return `/* RCT Semantic Theta (local mode - connect API for full reconstruction) */\n${theta.t}`;
  }
}

/**
 * semantic_verify の実装
 */
async function handleSemanticVerify(
  input: unknown
): Promise<{
  score: number;
  functional: number;
  structural: number;
  details: string;
}> {
  if (!Array.isArray(input) || input.length < 2) {
    throw new Error('semantic_verify expects [original, reconstructed] array');
  }

  const [original, reconstructed] = input.map(x =>
    typeof x === 'string' ? x : JSON.stringify(x)
  );

  const apiKey = process.env.ANTHROPIC_API_KEY || '';

  if (apiKey) {
    return await callClaudeForVerification(original, reconstructed, apiKey);
  } else {
    // ローカルフォールバック: ヒューリスティック比較
    return localSemanticVerify(original, reconstructed);
  }
}

// ============================================================
// 3. LLM通信関数
// ============================================================

async function callClaudeForCompression(
  data: string,
  fidelity: string,
  apiKey: string
): Promise<string> {
  const prompt = `You are RCT (Rei Compression Theory) Semantic Compressor.
Extract MINIMAL generative parameters θ from this code.
Fidelity: ${fidelity}
Respond with ONLY compact JSON, no markdown.
{"i":"intent<10words","s":"structure","a":["algo1"],"d":["dep"],"t":"types","e":["edge"],"io":"func()->ret","l":"lang"}

\`\`\`
${data}
\`\`\``;

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'anthropic-version': '2023-06-01',
      'x-api-key': apiKey,
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      messages: [{ role: 'user', content: prompt }],
    }),
  });

  const result = await response.json() as { content: Array<{ text?: string }> };
  return result.content?.[0]?.text || '{}';
}

async function callClaudeForReconstruction(
  theta: string,
  apiKey: string
): Promise<string> {
  const prompt = `You are RCT Code Reconstruction Engine.
Generate COMPLETE, RUNNABLE TypeScript from these parameters θ:
${theta}
Output ONLY source code, no explanations.`;

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'anthropic-version': '2023-06-01',
      'x-api-key': apiKey,
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4096,
      messages: [{ role: 'user', content: prompt }],
    }),
  });

  const result = await response.json() as { content: Array<{ text?: string }> };
  return result.content?.[0]?.text || '';
}

async function callClaudeForVerification(
  original: string,
  reconstructed: string,
  apiKey: string
): Promise<{ score: number; functional: number; structural: number; details: string }> {
  const prompt = `Compare semantic equivalence of these two code files.
ORIGINAL:\n\`\`\`\n${original.substring(0, 2000)}\n\`\`\`
RECONSTRUCTED:\n\`\`\`\n${reconstructed.substring(0, 2000)}\n\`\`\`
Respond ONLY: SCORE:0.XX FUNCTIONAL:0.XX STRUCTURAL:0.XX NOTES:brief`;

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'anthropic-version': '2023-06-01',
      'x-api-key': apiKey,
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 512,
      messages: [{ role: 'user', content: prompt }],
    }),
  });

  const result = await response.json() as { content: Array<{ text?: string }> };
  const text = result.content?.[0]?.text || '';

  const scoreM = text.match(/SCORE:\s*([\d.]+)/);
  const funcM = text.match(/FUNCTIONAL:\s*([\d.]+)/);
  const structM = text.match(/STRUCTURAL:\s*([\d.]+)/);

  return {
    score: scoreM ? parseFloat(scoreM[1]) : 0,
    functional: funcM ? parseFloat(funcM[1]) : 0,
    structural: structM ? parseFloat(structM[1]) : 0,
    details: text,
  };
}

// ============================================================
// 4. ローカルフォールバック関数
// ============================================================

function localSemanticExtract(code: string): string {
  const lines = code.split('\n');

  const functions: string[] = [];
  const imports: string[] = [];
  const interfaces: string[] = [];

  for (const line of lines) {
    // 関数シグネチャ
    const funcMatch = line.match(/(?:export\s+)?(?:async\s+)?function\s+(\w+)\s*\(([^)]*)\)(?:\s*:\s*(\S+))?/);
    if (funcMatch) {
      functions.push(`${funcMatch[1]}(${funcMatch[2].replace(/\s+/g, '')})${funcMatch[3] ? ':' + funcMatch[3] : ''}`);
    }
    // メソッド
    const methodMatch = line.match(/^\s{2,}(?:async\s+)?(\w+)\s*\(([^)]*)\)(?:\s*:\s*(\S+))?\s*\{/);
    if (methodMatch && !['if','for','while','switch','catch'].includes(methodMatch[1])) {
      functions.push(`.${methodMatch[1]}(${methodMatch[2].replace(/\s+/g, '')})`);
    }
    // import
    const impMatch = line.match(/from\s+['"]([^'"]+)['"]/);
    if (impMatch) imports.push(impMatch[1]);
    // interface/class
    const intMatch = line.match(/(?:export\s+)?(?:interface|class)\s+(\w+)/);
    if (intMatch) interfaces.push(intMatch[1]);
  }

  // コメントから意図を抽出
  const comments = lines
    .filter(l => l.trim().startsWith('//') || l.trim().startsWith('*'))
    .slice(0, 3)
    .map(c => c.replace(/^[\s/*]+/, '').trim())
    .filter(Boolean);

  return JSON.stringify({
    i: comments.join('. ').substring(0, 80) || 'code module',
    s: `${interfaces.length}types,${functions.length}fns`,
    a: functions.slice(0, 10),
    d: imports,
    t: interfaces.join(','),
  });
}

function localSemanticVerify(
  original: string,
  reconstructed: string
): { score: number; functional: number; structural: number; details: string } {
  // ヒューリスティック: 関数名の一致率
  const origFuncs = new Set(
    (original.match(/function\s+(\w+)/g) || []).map(m => m.replace('function ', ''))
  );
  const reconFuncs = new Set(
    (reconstructed.match(/function\s+(\w+)/g) || []).map(m => m.replace('function ', ''))
  );

  let matches = 0;
  for (const f of origFuncs) {
    if (reconFuncs.has(f)) matches++;
  }

  const structural = origFuncs.size > 0 ? matches / origFuncs.size : 0;

  return {
    score: structural * 0.8,
    functional: structural * 0.7,
    structural,
    details: `Local heuristic: ${matches}/${origFuncs.size} functions matched`,
  };
}

// ============================================================
// 5. テスト（rct_semantic.test.ts として保存）
// ============================================================

/*
  以下のテストを tests/rct_semantic.test.ts に追加:

  describe('RCT Semantic Compression (Direction 3)', () => {
    
    test('semantic_compress returns valid theta', async () => {
      const code = 'export function add(a: number, b: number): number { return a + b; }';
      const result = await handleSemanticCompress(code);
      expect(result._rct).toBe('semantic');
      expect(result.v).toBe('3.0');
      expect(result.ts).toBeLessThan(result.os);
      expect(result.r).toBeLessThan(1);
      expect(result.t).toContain('add');
    });

    test('semantic_compress with fidelity levels', async () => {
      const code = 'export function mul(a: number, b: number): number { return a * b; }';
      const high = await handleSemanticCompress(code, ['llm', 'high']);
      const low = await handleSemanticCompress(code, ['llm', 'low']);
      expect(high.ts).toBeGreaterThanOrEqual(low.ts); // high = more detail = larger theta
    });

    test('semantic_decompress returns code string', async () => {
      const theta: SemanticThetaCompact = {
        _rct: 'semantic', v: '3.0', m: 'llm', f: 'high',
        t: '{"i":"add function","s":"1fn","a":["add(a,b)->a+b"],"d":[],"t":"","io":"add(n,n)->n","l":"TS"}',
        os: 100, ts: 50, r: 0.5,
      };
      const result = await handleSemanticDecompress(theta);
      expect(typeof result).toBe('string');
      expect(result.length).toBeGreaterThan(0);
    });

    test('semantic_decompress rejects invalid input', async () => {
      await expect(handleSemanticDecompress('not a theta'))
        .rejects.toThrow('Invalid input');
    });

    test('semantic_verify returns scores', async () => {
      const orig = 'function add(a, b) { return a + b; }';
      const recon = 'function add(x, y) { return x + y; }';
      const result = await handleSemanticVerify([orig, recon]);
      expect(result.score).toBeGreaterThan(0);
      expect(result.structural).toBeGreaterThan(0);
    });

    test('semantic_verify rejects non-array input', async () => {
      await expect(handleSemanticVerify('not array'))
        .rejects.toThrow('expects [original, reconstructed]');
    });

    test('full cycle: compress → decompress → verify', async () => {
      const code = `
        export function greet(name: string): string {
          return \`Hello, \${name}!\`;
        }
      `;
      const theta = await handleSemanticCompress(code);
      expect(theta.r).toBeLessThan(1);

      const recon = await handleSemanticDecompress(theta);
      expect(recon).toContain('greet');

      const verify = await handleSemanticVerify([code, recon]);
      expect(verify.structural).toBeGreaterThan(0);
    });
  });
*/

export {
  handleSemanticCompress,
  handleSemanticDecompress,
  handleSemanticVerify,
  SemanticThetaCompact,
};
