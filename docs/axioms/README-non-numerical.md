# 非数数学理論（Non-Numerical Mathematics Theory）

## D-FUMT Category C — 哲学的基盤 第3理論

*Creator: Nobuki Fujimoto*
*Framework: D-FUMT (Dimensional Fujimoto Universal Mathematical Theory)*
*Language: 0₀式 (Rei-shiki) / Rei*

---

## 概要

非数数学理論は、数値以外の対象（図形・画像・音・テキスト等）を
Reiの中心-周囲パターン 𝕄 で記述するための理論的基盤を提供する。

GFT（幾何形状理論）、UPFT（普遍パターン形式理論）、USFT（普遍音形式理論）が
「なぜ数体系の上に自然に乗るのか」の公理的根拠を与える。

---

## 5公理の構造

```
N1（射影存在）   : 非数は 𝕄 に射影できる         — 色即是空
N2（多重射影）   : 射影の仕方は一つではない       — 一即多
N3（射影間変換） : 射影同士を行き来できる         — 方便
N4（射影合成）   : 異種の射影を統合できる         — 縁起
N5（不完全性）   : しかし完全には捉えきれない     — 言語道断
```

### 認識の深化の過程

```
N1 → N2 → N3 → N4 → N5
存在   多様性  変換   統合   謙虚さ

「見える」→「多く見える」→「見方を変えられる」→「統合できる」→「限界を知る」
```

---

## 各公理の設計書

| ファイル | 公理 | 核心 |
|----------|------|------|
| [axiom-n1-projection-existence.md](axiom-n1-projection-existence.md) | N1：射影存在公理 | 全ての対象は 𝕄 に射影できる |
| [axiom-n2-multiple-projection.md](axiom-n2-multiple-projection.md) | N2：多重射影公理 | 同一対象に複数の射影が存在する |
| [axiom-n3-inter-projection.md](axiom-n3-inter-projection.md) | N3：射影間変換公理 | 射影間の変換が存在する |
| [axiom-n4-projection-composition.md](axiom-n4-projection-composition.md) | N4：射影合成公理 | 異種の射影を合成できる |
| [axiom-n5-incompleteness.md](axiom-n5-incompleteness.md) | N5：非数の不完全性公理 | 完全な記述は不可能だが漸近可能 |

---

## 3理論系列の位置づけ

```
Category C（哲学的基盤）：
  1. ✅ 意識数理学      → C1〜C5  「値の内側」  — 意識・意志
  2. ✅ UMTE            → U1〜U5  「言語の外側」— 普遍性
  3. ✅ 非数数学理論    → N1〜N5  「数の境界」  — 表現の拡張
  4.    MMRT            → M1〜M5  「演算の再構築」— 次
  5.    AMRT            → A1〜A5  「別解の形式化」— 最後
```

---

## 新規構文の総覧

### N1 由来
| 構文 | 用途 |
|------|------|
| `project(:name)` | 対象 → 𝕄 の射影実行 |
| `Projector<O, C, P>` | 射影の型定義 |

### N2 由来
| 構文 | 用途 |
|------|------|
| `view_as(:name)` | 視点の切り替え |
| `projections` | 利用可能射影の列挙 |
| `projector :name = ...` | カスタム射影の宣言 |

### N3 由来
| 構文 | 用途 |
|------|------|
| `reproject(:from, :to)` | 射影間変換 |
| `fidelity` | 変換の忠実度 |
| `transform_path(:from, :to)` | 最適変換経路 |
| `via(:a, :b, :c)` | 変換チェーンの省略記法 |

### N4 由来
| 構文 | 用途 |
|------|------|
| `compose(𝕄₁, 𝕄₂)` | 異種 𝕄 の合成 |
| `with` パイプ | パイプスタイルの合成 |
| `decompose` | 合成の分解 |
| `across` | 合成内の横断操作 |
| `compose_when` | 条件付き合成 |

### N5 由来
| 構文 | 用途 |
|------|------|
| `approx` | 射影の近似度 |
| `residual` | 残差の分析 |
| `refine` | 漸近的精緻化 |
| `auto_project(target_approx:)` | 自動射影選択 |
| `#pragma incompleteness` | 不完全性の警告レベル |

---

## σ（6属性）への影響

```
N1: σ は射影時に保存される（「6属性ごと引っ越す」）
N2: 6属性は「6つの基本視点」を提供する
    → π_field, π_flow, π_memory, π_layer, π_relation, π_will
N3: σ.memory は射影変換の履歴を自動記録
    σ.will は射影に依存しない不変量
N4: σ の合成規則（merge, sync, interleave, emergent_will 等）
N5: σ.will の残差は一般に最大（意志は最も捉えにくい）
```

---

## 既存理論との統合

```
フーリエ変換 = N3 の射影間変換 T_{time, freq} の特殊ケース
ラプラス変換 = N3 の射影間変換 T_{time, s_domain} の特殊ケース
GFT  = N1 の Shape → 𝕄 射影族
UPFT = N1 の Pattern → 𝕄 射影族
USFT = N1 の Sound → 𝕄 射影族
```

---

## 新規演算子

**ゼロ。** 非数数学理論は新しい演算子を一切追加しない。
全ての機能はパイプコマンドと型定義で実現される。
Reiの「コアは小さく、拡張は豊かに」の原則を厳守。

---

## 破壊的変更

**ゼロ。** 全ての変更は後方互換。
既存の数値 𝕄 は自明射影（π_id）として動作し、
既存のパイプ操作は射影間変換の特殊ケースとして統合される。
