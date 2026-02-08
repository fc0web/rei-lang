// Copyright 2024-2026 Nobuki Fujimoto (藤本伸樹)
// Licensed under the Apache License, Version 2.0
// See LICENSE file for details.
// ============================================================
//  Rei (0₀式 / れいしき)
//  A mathematical computation system & programming language
//  Based on D-FUMT (Dimensional Fujimoto Universal Mathematical Theory)
//
//  Author: Nobuki Fujimoto
//  License: Apache-2.0
// ============================================================
//
//  表記の別名宣言（Notation Alias）:
//  正式記号: 0₀ (Unicode) / 0_{0} (LaTeX) / 0_0 (code)
//  プレーンテキスト: 0o — すべて同一概念
//
// ============================================================

// Core: Multi-dimensional numbers, extended numbers, unified numbers
export * from './core';

// GFT: Graphic Formula Theory
export * as gft from './gft';

// Genesis: Genesis Axiom System
export * as genesis from './genesis';

// Lang: Rei language interpreter
export * as lang from './lang';

// --- Version ---
export const VERSION = '1.0.0';
export const AUTHOR = 'Nobuki Fujimoto';
export const THEORY = 'D-FUMT (Dimensional Fujimoto Universal Mathematical Theory)';
