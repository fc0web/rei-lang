// ============================================================
// RCT (Rei Compression Theory) — Reiコマンドテスト
// D-FUMT Theory #67 — 方向2: compress / decompress
// Author: Nobuki Fujimoto (藤本 伸樹) & Claude
// ============================================================

import { describe, it, expect, beforeEach } from 'vitest';
import { rei } from '../src/index';

describe('RCT compress/decompress', () => {
  beforeEach(() => rei.reset());

  // ═══════════════════════════════════════════
  // 基本圧縮テスト
  // ═══════════════════════════════════════════

  it('数値配列の圧縮', () => {
    const r = rei('[1, 2, 3, 4, 5, 1, 2, 3, 4, 5] |> compress');
    expect(r.reiType).toBe('CompressedRei');
    expect(r.compressionRatio).toBeLessThan(1);
  });

  it('定数列の圧縮', () => {
    const r = rei('[7, 7, 7, 7, 7, 7, 7, 7, 7, 7] |> compress');
    expect(r.reiType).toBe('CompressedRei');
    expect(r.params.type).toMatch(/constant|periodic/);
    expect(r.compressionRatio).toBeLessThan(0.5);
  });

  it('等差数列の圧縮', () => {
    const r = rei('[10, 20, 30, 40, 50, 60, 70, 80] |> compress');
    expect(r.reiType).toBe('CompressedRei');
    expect(r.compressionRatio).toBeLessThan(1);
  });

  it('文字列の圧縮', () => {
    const r = rei('"hello world hello world" |> compress');
    expect(r.reiType).toBe('CompressedRei');
    expect(r.originalType).toBe('string');
  });

  // ═══════════════════════════════════════════
  // 復元テスト（可逆性）
  // ═══════════════════════════════════════════

  it('数値配列の compress → decompress', () => {
    const r = rei('[1, 2, 3, 4, 5, 1, 2, 3, 4, 5] |> compress |> decompress');
    expect(r).toEqual([1, 2, 3, 4, 5, 1, 2, 3, 4, 5]);
  });

  it('定数列の compress → decompress', () => {
    const r = rei('[42, 42, 42, 42, 42] |> compress |> decompress');
    expect(r).toEqual([42, 42, 42, 42, 42]);
  });

  it('文字列の compress → decompress', () => {
    const r = rei('"abcabcabc" |> compress |> decompress');
    expect(r).toBe('abcabcabc');
  });

  // ═══════════════════════════════════════════
  // 圧縮情報テスト
  // ═══════════════════════════════════════════

  it('compress_info', () => {
    const r = rei('[1, 2, 3, 1, 2, 3, 1, 2, 3] |> compress_info');
    expect(r.reiType).toBe('CompressInfo');
    expect(r.type).toBe('periodic');
    expect(r.originalSize).toBe(9);
    expect(r.compressionRatio).toBeLessThan(1);
    expect(r.improvement).toContain('削減');
  });

  // ═══════════════════════════════════════════
  // 日本語コマンドテスト
  // ═══════════════════════════════════════════

  it('圧縮（日本語コマンド）', () => {
    const r = rei('[1, 1, 1, 1, 1] |> 圧縮');
    expect(r.reiType).toBe('CompressedRei');
  });

  it('圧縮 → 復元（日本語コマンド）', () => {
    const r = rei('[1, 1, 1, 1, 1] |> 圧縮 |> 復元');
    expect(r).toEqual([1, 1, 1, 1, 1]);
  });

  it('圧縮情報（日本語コマンド）', () => {
    const r = rei('[1, 2, 3, 1, 2, 3] |> 圧縮情報');
    expect(r.reiType).toBe('CompressInfo');
    expect(r.type).toBe('periodic');
  });

  // ═══════════════════════════════════════════
  // 大きいデータのテスト
  // ═══════════════════════════════════════════

  it('20要素等差数列', () => {
    const r = rei('[0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19] |> compress');
    expect(r.compressionRatio).toBeLessThan(0.5);
  });

  it('周期パターンの圧縮率', () => {
    const r = rei('[1,2,3,4,5,1,2,3,4,5,1,2,3,4,5,1,2,3,4,5] |> compress_info');
    expect(r.type).toBe('periodic');
    expect(r.compressionRatio).toBeLessThan(0.5);
  });
});
