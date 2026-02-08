// Copyright 2024-2026 Nobuki Fujimoto (藤本伸樹)
// Licensed under the Apache License, Version 2.0
// See LICENSE file for details.
// ============================================================
// GFT (Graphic Formula Theory) Type Definitions
// D-FUMT Extension Theory — 図式数式理論
// Author: Nobuki Fujimoto
// ============================================================

/**
 * GFT — Graphic Formula Theory
 *
 * 数式を有向グラフとして表現する理論。
 * ノード = 数学的対象（数、変数、関数、演算子）
 * エッジ = 数学的関係（入力→出力、依存、変換）
 *
 * Rei の多次元数体系とシームレスに統合:
 * - 多次元数のcenter/neighbor構造 → GFTノードの隣接関係
 * - 拡張/縮約操作 → グラフの展開/折りたたみ
 * - 生成公理系 → グラフの段階的構築
 */

// --- Node Types ---

export type GFTNodeKind =
  | 'value'       // 数値リテラル
  | 'variable'    // 変数
  | 'operator'    // 演算子 (+, -, ×, ÷, ^)
  | 'function'    // 関数 (sin, cos, exp, log, ...)
  | 'multidim'    // 多次元数ノード
  | 'extended'    // 拡張数ノード
  | 'unified'     // 統合数ノード
  | 'genesis'     // 生成公理系ノード（・, 0₀, 0）
  | 'group'       // グループ（部分式）
  | 'pipe'        // パイプ（データフロー）
  | 'compress'    // 圧縮（関数定義）
  ;

export interface GFTNode {
  readonly id: string;
  readonly kind: GFTNodeKind;
  readonly label: string;
  readonly value?: number | string;
  readonly metadata: Readonly<Record<string, unknown>>;
  // Layout
  readonly x: number;
  readonly y: number;
  readonly radius: number;
  // Visual
  readonly color: string;
  readonly glow: boolean;
  readonly layer: number;  // depth layer for 3D-like rendering
}

// --- Edge Types ---

export type GFTEdgeKind =
  | 'input'       // 入力（引数→演算子）
  | 'output'      // 出力（演算子→結果）
  | 'dependency'  // 依存関係
  | 'extension'   // 拡張 (⊕)
  | 'reduction'   // 縮約 (⊖)
  | 'pipe'        // パイプ |>
  | 'genesis'     // 生成遷移 ⇒G
  | 'neighbor'    // 多次元数の隣接
  | 'transform'   // 変換
  ;

export interface GFTEdge {
  readonly id: string;
  readonly source: string;  // source node id
  readonly target: string;  // target node id
  readonly kind: GFTEdgeKind;
  readonly weight: number;
  readonly label?: string;
  readonly curved: boolean;
  readonly color: string;
  readonly animated: boolean;
}

// --- Formula Graph ---

export interface FormulaGraph {
  readonly id: string;
  readonly name: string;
  readonly nodes: readonly GFTNode[];
  readonly edges: readonly GFTEdge[];
  readonly metadata: Readonly<Record<string, unknown>>;
}

// --- Layout Algorithms ---

export type LayoutAlgorithm =
  | 'force'         // 力指向レイアウト
  | 'radial'        // 放射状（多次元数のcenter-neighbor構造に最適）
  | 'hierarchical'  // 階層的（生成公理系に最適）
  | 'tree'          // ツリー（式木に最適）
  | 'grid'          // グリッド（多次元数グリッドに最適）
  ;

export interface LayoutOptions {
  readonly algorithm: LayoutAlgorithm;
  readonly width: number;
  readonly height: number;
  readonly padding: number;
  readonly nodeSpacing: number;
  readonly layerSpacing: number;
  readonly centerX?: number;
  readonly centerY?: number;
}

// --- Transform Types ---

export type GraphTransform =
  | { type: 'extend'; nodeId: string; char: string }           // 拡張
  | { type: 'reduce'; nodeId: string }                          // 縮約
  | { type: 'collapse'; groupId: string }                       // 折りたたみ
  | { type: 'expand'; groupId: string }                         // 展開
  | { type: 'substitute'; varId: string; value: number }        // 代入
  | { type: 'simplify' }                                        // 簡約
  | { type: 'decompose'; nodeId: string }                       // 分解（多次元数→個別ノード）
  | { type: 'compose'; nodeIds: string[] }                      // 合成（個別→多次元数）
  ;

// --- Render Output ---

export interface GFTRenderOutput {
  readonly svg: string;
  readonly width: number;
  readonly height: number;
  readonly nodeCount: number;
  readonly edgeCount: number;
}

// --- Color Palette for GFT ---

export const GFT_COLORS: Record<GFTNodeKind, string> = {
  value: '#a8a4a0',       // silver
  variable: '#6b9fd4',    // rei-blue
  operator: '#c4a265',    // gold
  function: '#50a068',    // green
  multidim: '#4a6fa5',    // deep blue
  extended: '#a05050',    // red
  unified: '#8b5cf6',     // purple
  genesis: '#f0ece4',     // dot-white
  group: '#374151',       // dark gray
  pipe: '#06b6d4',        // cyan
  compress: '#d97706',    // amber
};

export const GFT_EDGE_COLORS: Record<GFTEdgeKind, string> = {
  input: '#6b7280',
  output: '#c4a265',
  dependency: '#4b5563',
  extension: '#50a068',
  reduction: '#a05050',
  pipe: '#06b6d4',
  genesis: '#f0ece4',
  neighbor: '#4a6fa5',
  transform: '#8b5cf6',
};
