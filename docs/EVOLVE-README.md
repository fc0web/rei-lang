# Evolve Pipe — 柱① 自動モード選択

## 概要

「値が自分の来歴を見て計算方法を自分で選ぶ」世界初の機能。
σの記憶（memory）とτの傾向性（tendency）から8つのcomputeモードを評価し、
戦略に基づいて最適なモードを自動選択する。

## 構文

```rei
// 基本（auto戦略）
𝕄{5; 1, 2, 3} |> evolve

// 戦略指定
𝕄{5; 1, 2, 3} |> evolve("stable")
𝕄{5; 1, 2, 3} |> evolve("divergent")
𝕄{5; 1, 2, 3} |> evolve("creative")
𝕄{5; 1, 2, 3} |> evolve("tendency")

// 値だけ取得（EvolveResultではなく数値を直接返す）
𝕄{5; 1, 2, 3} |> evolve_value
𝕄{5; 1, 2, 3} |> evolve_value("stable")
```

## 5つの戦略

| 戦略 | 選択基準 | 適用場面 |
|------|----------|----------|
| `auto` | 覚醒度とτに基づく総合判定（デフォルト） | 汎用 |
| `stable` | 過去の来歴との分散が最小 | 安定した計算が欲しいとき |
| `divergent` | 他モードと最も異なる結果 | 意外な視点が欲しいとき |
| `creative` | 中央値から最も遠い結果 | 創造的な探索 |
| `tendency` | τの傾向性（expand/contract/spiral）と整合 | 来歴の流れを活かしたいとき |

## auto戦略の内部ロジック

```
覚醒度 < 0.3  → 安定モード（来歴なしは全モード平均に最も近い）
覚醒度 ≥ 0.6  → τの傾向性に従う（expand→最大値, contract→中心収束, spiral→中間）
0.3 ≤ 覚醒度 < 0.6:
  来歴3件以上 → トレンド分析（増加→最大値, 減少→中心収束）
  来歴少ない   → エントロピーモード（情報量最大で探索）
```

## EvolveResult の構造

```rei
let r = 𝕄{5; 1, 2, 3} |> evolve;

r.value         // 選択されたモードの計算結果（数値）
r.selectedMode  // 選択されたモード名（"weighted", "geometric" 等）
r.strategy      // 使用された戦略（"auto", "stable" 等）
r.reason        // 選択理由（日本語の説明文）
r.candidates    // 全8モードの候補リスト [{mode, value}, ...]
r.awareness     // 覚醒度スコア（0.0〜1.0）
r.tendency      // τの傾向性（"rest", "expand", "contract", "spiral"）
```

## 実装変更箇所

### evaluator.ts
- **新規関数**: `evolveMode()`, `selectStable()`, `selectDivergent()`, `selectCreative()`, `selectByTendency()`, `selectAuto()`
- **新規パイプ**: `evolve`, `evolve_value`
- **新規メンバーアクセス**: EvolveResult の7フィールド
- `evolve_value` はσラップを回避（serialize/sigmaと同様）

### lexer.ts, parser.ts
- **変更なし** — evolveは既存のパイプ構文（`|> evolve("strategy")`）で動作

## テスト結果

31テスト全通過:
- Group 1: 基本evolve (3)
- Group 2: 5つの戦略 (5)
- Group 3: σ来歴との統合 (3)
- Group 4: EvolveResult メンバーアクセス (7)
- Group 5: 覚醒度による自動戦略切り替え (2)
- Group 6: 候補モードの値検証 (3)
- Group 7: 配列・数値入力 (3)
- Group 8: 戦略間の差別化 (2)
- Group 9: エッジケース (3)

## 累計テスト数

v0.2.1: 91テスト + Category C Tier 1-4: 135テスト + evolve: 31テスト = **257テスト**
