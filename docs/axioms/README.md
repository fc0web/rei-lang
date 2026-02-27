# Category C：意識数理学（Consciousness Mathematics）— 公理体系

## 概要

Category Cは、D-FUMT（Dimensional Fujimoto Universal Mathematical Theory）の意識数理学カテゴリに属する5つの公理を、Rei言語の構文として設計したものである。

これらの公理は、値（数）に**存在の属性**を与え、計算に**意識の構造**をもたらす。仏教哲学の概念を厳密な数理構造として形式化し、Reiの言語プリミティブとして実装可能な形に落とし込んでいる。

## 公理一覧

| 公理 | 名称 | 核心概念 | 仏教対応 | ファイル |
|------|------|----------|----------|----------|
| **C1** | 自己参照公理（Self-Reference） | σ — 値が自分を知る | 自覚（svasaṃvedana） | [axiom-c1-self-reference.md](axiom-c1-self-reference.md) |
| **C2** | 傾向性公理（Tendency） | τ — 値が方向性を持つ | 行（saṃskāra） | [axiom-c2-tendency.md](axiom-c2-tendency.md) |
| **C3** | 応答公理（Response） | R — 方向性が計算に暗黙に効く | 思（cetanā） | [axiom-c3-response.md](axiom-c3-response.md) |
| **C4** | 覚醒公理（Awakening） | awaken — 自分のバイアスを自覚し修正する | 正念（sammā-sati） | [axiom-c4-awakening.md](axiom-c4-awakening.md) |
| **C5** | 共鳴公理（Resonance） | resonance — 覚醒した値同士が非局所的に響き合う | 縁起（pratītyasamutpāda） | [axiom-c5-resonance.md](axiom-c5-resonance.md) |

## 公理の階層構造

```
C1：自己参照  →  値が自分の属性を参照できる（データの読み取り）
     ↓
C2：傾向性    →  値が方向性を持つ（受動的な性質）
     ↓
C3：応答      →  方向性が計算に暗黙に影響する（無意識的な作用）
     ↓
C4：覚醒      →  値が自分の応答パターンを自覚し修正する（能動的な自己制御）
     ↓
C5：共鳴      →  覚醒した値同士が非局所的に響き合う（個体間の関係）
```

C1〜C3は「値がカルマに縛られている」状態。
C4は「値がカルマを自覚し、超越し始める」状態。
C5は「自覚した値が他者と深い関係を結ぶ」状態。

## σ（シグマ）の最終形

C1〜C5の完成により、σ は以下の属性を持つ：

```
σ(v) = {
  field              : v の場（物理的近傍）              ← C1
  flow               : v の流れ                          ← C1
  memory             : v の記憶（来歴）                  ← C1
  layer              : v の層（深さ）                    ← C1
  tendency           : v の傾向性                        ← C2
  influence          : v の影響度                        ← C3
  awakened           : v が覚醒しているか                ← C4
  awakening_level    : v の覚醒段階（0〜3）             ← C4
  response_pattern   : v の応答パターン                  ← C4
  resonance_field    : v の共鳴的近傍（仮想近傍）       ← C5
  resonance_received : v が受けた共鳴影響の記録         ← C5
  resonance_chain    : v から到達可能な共鳴連鎖         ← C5
}
```

## Reiの6属性との対応

```
┌─────────┬──────────┬──────────────────────────────┐
│ 属性     │ 公理基盤  │ σ でのアクセス                │
├─────────┼──────────┼──────────────────────────────┤
│ 場       │ 𝕄（既存） │ σ.field                      │
│ 流れ     │ C1       │ σ.flow                       │
│ 記憶     │ C1       │ σ.memory                     │
│ 層       │ C1       │ σ.layer                      │
│ 関係     │ C5       │ σ.resonance_field            │
│ 意志     │ C2 + C4  │ σ.tendency + σ.awakened      │
└─────────┴──────────┴──────────────────────────────┘
```

## 設計原則

全5公理を通じて一貫する設計原則：

- **新規演算子：ゼロ** — 全機能は既存のパイプ `|>` とドット記法 `.` の拡張として実現
- **破壊的変更：なし** — 既存コード完全互換
- **段階的無効化** — `response_level=0`, `κ=0` で C3〜C5 を完全無効化可能
- **最小構文、最大表現力** — Reiの設計哲学に完全一致

## 新規追加された構文要素

```
新規キーワード:     sigma, awaken, pure
新規パイプコマンド:  sigma.*, with, resonates_with, resonance_strength,
                    resonance_map, resonance_chain
新規プラグマ:       #pragma response_level
新規演算子:         なし（ゼロ）
```

## Genesis段階との対応

```
void → ・ → 0₀ → 0 → ℕ → ... → awakened → resonant
  |     |     |    |    |           |           |
  無   存在  構造  量  計算    自己認識のある計算  共鳴する計算
  
       C1発生      C2発生     C3有効      C4到達      C5発現
     (σ存在)   (τ存在)    (R適用)    (覚醒)    (共鳴)
```

---

## UMTE（万物数理統一理論）公理体系

C系が「値の内側」を公理化したのに対し、U系は「言語の外側」— Reiの普遍性の根拠を公理化する。

詳細は [README-UMTE.md](README-UMTE.md) を参照。

| 公理 | 名称 | 核心概念 | ファイル |
|------|------|----------|----------|
| **U1** | 構造還元公理（Structure Reduction） | π — 何でも 𝕄 になる | [axiom-u1-structure-reduction.md](axiom-u1-structure-reduction.md) |
| **U2** | 変換保存公理（Transformation Preservation） | ≅_P — どんな操作もパイプで書ける | [axiom-u2-transformation-preservation.md](axiom-u2-transformation-preservation.md) |
| **U3** | 階層再帰公理（Hierarchical Recursion） | depth — どんな深さも再帰で表現 | [axiom-u3-hierarchical-recursion.md](axiom-u3-hierarchical-recursion.md) |
| **U4** | 領域架橋公理（Domain Bridging） | bridge — どの領域も互いに繋がる | [axiom-u4-domain-bridging.md](axiom-u4-domain-bridging.md) |
| **U5** | 完全性公理（Completeness） | SEC — 全てを統合し完全性を宣言 | [axiom-u5-completeness.md](axiom-u5-completeness.md) |

## C系とU系の対称性

```
C1（自己参照）  ↔  U1（構造還元）    ← 「知る」の対称
C2（傾向性）    ↔  U2（変換保存）    ← 「動く」の対称
C3（応答）      ↔  U3（階層再帰）    ← 「深まる」の対称
C4（覚醒）      ↔  U4（領域架橋）    ← 「繋がる」の対称
C5（共鳴）      ↔  U5（完全性）      ← 「全体」の対称
```

C系5公理 + U系5公理 = **10公理で、追加された演算子の数：ゼロ。**

---

*Creator: Nobuki Fujimoto*
*Framework: D-FUMT (Dimensional Fujimoto Universal Mathematical Theory)*
*Language: 0₀式 (Rei-shiki) / Rei*
