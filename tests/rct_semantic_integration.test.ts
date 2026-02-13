/**
 * RCT 方向3 — Evaluator統合テスト
 * ====================================
 * semantic_compress / semantic_decompress / semantic_verify
 * がRei構文（パイプ）から直接使えることを検証
 */

import { describe, it, expect } from 'vitest';
import { rei } from '../src/index';

const SAMPLE_CODE = `
export function add(a: number, b: number): number {
  return a + b;
}

export function multiply(x: number, y: number): number {
  return x * y;
}
`;

describe('RCT Semantic Compression — Evaluator Integration', () => {

  // ═══════════════════════════════════════════
  // semantic_compress テスト
  // ═══════════════════════════════════════════

  it('semantic_compress: 文字列 → SemanticTheta', () => {
    const r = rei('"export function hello(name: string): string { return name; }" |> semantic_compress');
    expect(r.reiType).toBe('SemanticTheta');
    expect(r.version).toBe('3.0');
    expect(r.originalSize).toBeGreaterThan(0);
    expect(r.thetaSize).toBeGreaterThan(0);
    expect(r.functions.length).toBeGreaterThan(0);
    // ローカルモードでは短いコードの圧縮率は1以上になることがある
    // LLM接続時はθがコンパクトになり圧縮率が改善する
    expect(r.compressionRatio).toBeGreaterThan(0);
  });

  it('semantic_compress: 複数関数のθ抽出', () => {
    const code = `export function factorial(n: number): number {
      if (n <= 1) return 1;
      return n * factorial(n - 1);
    }
    export function fibonacci(n: number): number {
      if (n <= 1) return n;
      let a = 0, b = 1;
      for (let i = 2; i <= n; i++) { [a, b] = [b, a + b]; }
      return b;
    }`;
    const r = rei(`"${code.replace(/"/g, '\\"').replace(/\n/g, '\\n')}" |> semantic_compress`);
    expect(r.compressionRatio).toBeGreaterThan(0);
    expect(r.functions.length).toBeGreaterThanOrEqual(2);
    expect(r.functions.some((f: string) => f.includes('factorial'))).toBe(true);
    expect(r.functions.some((f: string) => f.includes('fibonacci'))).toBe(true);
  });

  it('semantic_compress: language検出', () => {
    const r = rei('"export interface User { name: string; age: number; }" |> semantic_compress');
    expect(r.language).toBe('TypeScript');
  });

  it('semantic_compress: patterns検出', () => {
    const code = 'async function fetch() { try { await get(); } catch(e) { } }';
    const r = rei(`"${code}" |> semantic_compress`);
    expect(r.patterns).toContain('async/await');
    expect(r.patterns).toContain('error-handling');
  });

  // ═══════════════════════════════════════════
  // semantic_decompress テスト
  // ═══════════════════════════════════════════

  it('semantic_compress → semantic_decompress: ラウンドトリップ', () => {
    const r = rei('"export function greet(name: string): string { return name; }" |> semantic_compress |> semantic_decompress');
    expect(typeof r).toBe('string');
    expect(r).toContain('greet');
    expect(r.length).toBeGreaterThan(0);
  });

  it('semantic_decompress: imports復元', () => {
    const code = "import { readFile } from 'fs'; export function load() { }";
    const r = rei(`"${code}" |> semantic_compress |> semantic_decompress`);
    expect(r).toContain('fs');
  });

  // ═══════════════════════════════════════════
  // semantic_verify テスト
  // ═══════════════════════════════════════════

  it('semantic_verify: 同一コード → 高スコア', () => {
    const code = 'function add(a, b) { return a + b; }';
    const r = rei(`["${code}", "${code}"] |> semantic_verify`);
    expect(r.reiType).toBe('SemanticVerify');
    expect(r.score).toBeGreaterThan(0.5);
    expect(r.structural).toBe(1);
  });

  it('semantic_verify: 異なるコード → 低スコア', () => {
    const r = rei('["function add(a, b) { return a + b; }", "function xyz() { return 1; }"] |> semantic_verify');
    expect(r.structural).toBeLessThan(1);
  });

  it('semantic_verify: 配列でない入力 → エラー', () => {
    expect(() => rei('"hello" |> semantic_verify')).toThrow('expects [original, reconstructed]');
  });

  // ═══════════════════════════════════════════
  // 日本語コマンドテスト
  // ═══════════════════════════════════════════

  it('意味圧縮（日本語コマンド）', () => {
    const r = rei('"export function test(): void { }" |> 意味圧縮');
    expect(r.reiType).toBe('SemanticTheta');
  });

  it('意味圧縮 → 意味復元（日本語コマンド）', () => {
    const r = rei('"export function test(): void { }" |> 意味圧縮 |> 意味復元');
    expect(typeof r).toBe('string');
    expect(r).toContain('test');
  });

  it('意味検証（日本語コマンド）', () => {
    const r = rei('["function a() {}", "function a() {}"] |> 意味検証');
    expect(r.reiType).toBe('SemanticVerify');
    expect(r.structural).toBe(1);
  });

  // ═══════════════════════════════════════════
  // フルサイクルテスト
  // ═══════════════════════════════════════════

  it('compress → decompress → verify: フルサイクル', () => {
    rei.reset();
    const origCode = 'export function sum(arr: number[]): number { return arr.reduce((a,b) => a+b, 0); }';

    // Step 1: 圧縮
    const theta = rei(`"${origCode}" |> semantic_compress`);
    expect(theta.reiType).toBe('SemanticTheta');
    expect(theta.compressionRatio).toBeGreaterThan(0);

    // Step 2: 復元（ローカルモードではスケルトンコード）
    const reconstructed = rei(`"${origCode}" |> semantic_compress |> semantic_decompress`);
    expect(typeof reconstructed).toBe('string');
    expect(reconstructed).toContain('sum');

    // Step 3: 検証
    const origEsc = origCode.replace(/"/g, '\\"');
    const reconEsc = reconstructed.replace(/"/g, '\\"').replace(/\n/g, '\\n');
    const verify = rei(`["${origEsc}", "${reconEsc}"] |> semantic_verify`);
    expect(verify.score).toBeGreaterThan(0);
    expect(verify.structural).toBeGreaterThan(0);
  });
});
