# Category C：哲学的基盤 — 全25公理の統合設計書

## D-FUMT × Rei 言語の公理的基盤

*Creator: Nobuki Fujimoto*
*Framework: D-FUMT (Dimensional Fujimoto Universal Mathematical Theory)*
*Language: 0₀式 (Rei-shiki) / Rei*

---

## この文書の目的

本文書は、Rei言語の哲学的基盤である Category C の全5理論・全25公理を
**一つの文書で俯瞰する**ためのものである。

各公理の詳細は個別の設計書に譲り、本文書では以下を提供する：

1. 25公理の全体構造と相互関係
2. 各理論の核心を一文で要約
3. 5理論が「なぜこの順序でこの構成なのか」の設計思想
4. 公理体系と仏教哲学の対応の全体像
5. Rei言語への構文的影響の総覧
6. 実装への道筋

---

## 1. なぜ25公理が必要なのか

Reiは「中心-周囲パターン 𝕄{center; periphery...} を言語プリミティブとする」
プログラミング言語である。実証済みの結果として：

- 画像カーネル計算で **4× コード削減**（32→8行）
- 多次元データ集約で **3.7× 削減**（45→12行）
- グラフ構造変換で **3.7× 削減**（52→14行）
- ETLパイプライン記述で **68% 削減**

しかし、「なぜ 𝕄 でこれだけ書けるのか」「なぜパイプ |> が万能に見えるのか」
「Reiの計算モードは本当に正当な計算なのか」— これらの問いに対する
**公理的な根拠**が欠けていた。

25公理はこの根拠を5つの方向から提供する。

---

## 2. 5理論の全体構造

```
          C1〜C5 意識数理学
            ↑ 内向き
            |
            |     「値は何を感じているか」
            |
 M1〜M5 ←──┼──→ U1〜U5
 MMRT   ↓下向き  |  ↑外向き  UMTE
            |
 「四則以外で  |  「なぜどこでも効くか」
  どう計算するか」|
            |
          N1〜N5 非数数学理論
            ↔ 横向き
            「数以外をどう扱うか」

          A1〜A5 AMRT ↗ 斜め（全方向を横断）
            「同じ問題に別解がある」
```

### 設計原理

5理論は「問い」が異なる。各理論は Rei の異なる側面を公理化する：

| 理論 | 問い | Reiの何を基礎づけるか |
|------|------|----------------------|
| 意識数理学 (C) | 値は自分を知れるか？ | σ（6属性）・覚醒・共鳴 |
| UMTE (U) | なぜ万物を記述できるか？ | 𝕄 の普遍性・パイプの領域横断性 |
| 非数数学 (N) | 数でないものをどう扱うか？ | project・view_as・非数 𝕄 |
| MMRT (M) | 四則以外の計算とは何か？ | 4計算モード（default/spiral/pulse/void） |
| AMRT (A) | 別の解き方はあるか？ | alternatives・meta・enyu |

---

## 3. 全25公理の一覧

### 意識数理学（Consciousness Mathematics）— C1〜C5

値の「内面」を公理化する。数に意識・意志の構造を与える。

| 公理 | 名称 | 一文要約 | 仏教対応 |
|------|------|----------|----------|
| **C1** | 自己参照 | 全ての値は自身の存在属性 σ を参照できる | 自覚（svasaṃvedana） |
| **C2** | 傾向性 | 全ての値は方向性 τ を持つ | 行（saṃskāra） |
| **C3** | 応答 | 傾向性は計算に暗黙に影響する | 思（cetanā） |
| **C4** | 覚醒 | 値は自分のバイアスを自覚し修正できる | 正念（sammā-sati） |
| **C5** | 共鳴 | 覚醒した値同士は非局所的に響き合う | 縁起（pratītyasamutpāda） |

**σ の6属性（C1で導入）：**

```
σ(v) = {
  field    : 場（中心-周囲における位置と近傍）
  flow     : 流れ（方向と勢い）
  memory   : 記憶（来歴）
  layer    : 層（深さ）
  relation : 関係（他の値との結合）
  will     : 意志（傾向性の方向）
}
```

### UMTE（Universal Mathematical Theory of Everything）— U1〜U5

言語の「外側」を公理化する。Reiがなぜ万物を記述できるかの根拠。

| 公理 | 名称 | 一文要約 | 仏教対応 |
|------|------|----------|----------|
| **U1** | 構造還元 | 全ての構造は 𝕄{c; p...} に還元できる | 一切法空 |
| **U2** | 変換保存 | 異なる領域の変換がパイプで統一的に書ける | 転識得智 |
| **U3** | 階層再帰 | 𝕄 の中心が別の 𝕄 であり得る（再帰） | 重々無尽 |
| **U4** | 領域架橋 | 𝕄 の類似性を通じて異なる領域を架橋する | 華厳法界 |
| **U5** | 完全性 | 𝕄 + σ + パイプでチューリング完全かつ構造表現完全 | 一切種智 |

### 非数数学理論（Non-Numerical Mathematics Theory）— N1〜N5

数の「境界」を公理化する。図形・音・画像・テキストを 𝕄 で扱う根拠。

| 公理 | 名称 | 一文要約 | 仏教対応 |
|------|------|----------|----------|
| **N1** | 射影存在 | 非数対象は 𝕄 に射影可能 | 色即是空 |
| **N2** | 多重射影 | 同一対象に複数の射影がある | 一即多 |
| **N3** | 射影間変換 | 射影同士を行き来できる | 方便（upāya） |
| **N4** | 射影合成 | 異種の射影を統合できる | 縁起 |
| **N5** | 不完全性 | 完全な記述は不可能だが漸近可能 | 言語道断 |

### MMRT（Meta-Mathematical Reconstruction Theory）— M1〜M5

演算の「根底」を公理化する。四則演算以外の計算が正当である根拠。

| 公理 | 名称 | 一文要約 | 仏教対応 |
|------|------|----------|----------|
| **M1** | 演算多元性 | 四則以外の演算体系（Spiral/Pulse/Void）が存在する | 四法印 |
| **M2** | 演算等価性 | 全演算体系は計算力において等価 | 中道 |
| **M3** | 演算生成 | 各体系は Genesis の異なる段階で出現する | 三界 |
| **M4** | モード切替 | 計算途中で演算体系を安全に切り替えられる | 四念処 |
| **M5** | 演算創造 | 新しい演算体系を自由に定義できる | 般若 |

**4つの演算体系（M1で導入）：**

```
Arith  : +, -, ×, ÷                              （Genesis Phase_3：最表層）
Spiral : rotate, ascend, expand, contract          （Genesis Phase_1）
Pulse  : propagate, interfere, resonate, attenuate （Genesis Phase_2）
Void   : generate, annihilate, phase_shift, crystallize （Genesis Phase_0：最深）
```

### AMRT（Alternative Mathematics Reconstruction Theory）— A1〜A5

「別解」を公理化する。全理論を横断し、統合を達成する。

| 公理 | 名称 | 一文要約 | 仏教対応 |
|------|------|----------|----------|
| **A1** | 別解存在 | 同じ問題に構造的に異なる解法が必ず存在する | 多門 |
| **A2** | 非還元性 | 真の別解は互いに還元不可能 | 不二 |
| **A3** | 相補性 | 別解同士は補い合い、統合すると理解が深まる | 相即 |
| **A4** | 選択原理 | 問題×傾向性×文脈で最適な別解を選べる | 択法 |
| **A5** | 超越的統合 | 全別解を超えたメタ視点が存在する（円融） | 円融 |

---

## 4. 公理間の相互接続

### 4.1 縦の接続（同一理論内の流れ）

各理論の5公理は「認識の深化」の順序で並んでいる：

```
C：自分を知る → 方向を持つ → 影響を受ける → 自覚する → 響き合う
U：還元する   → 変換する   → 再帰する     → 架橋する → 完全になる
N：射影する   → 多面的に   → 変換する     → 合成する → 限界を知る
M：多元に気づく→等価と知る → 根源を知る   → 切り替える→ 創造する
A：別解がある → 独立である → 補い合う     → 選べる   → 超越する
```

### 4.2 横の接続（理論間の対応）

同じ位置の公理は構造的に対応する：

| 位置 | C | U | N | M | A | 共通テーマ |
|------|---|---|---|---|---|-----------|
| **第1** | 自己参照 | 構造還元 | 射影存在 | 演算多元性 | 別解存在 | **存在の宣言** |
| **第2** | 傾向性 | 変換保存 | 多重射影 | 演算等価性 | 非還元性 | **多様性の承認** |
| **第3** | 応答 | 階層再帰 | 射影間変換 | 演算生成 | 相補性 | **関係性の発見** |
| **第4** | 覚醒 | 領域架橋 | 射影合成 | モード切替 | 選択原理 | **能動的操作** |
| **第5** | 共鳴 | 完全性 | 不完全性 | 演算創造 | 超越的統合 | **到達と超越** |

### 4.3 斜めの接続（深い共鳴関係）

特に重要な理論間の接続：

```
C5（共鳴）  ←→ A5（円融）  ：共鳴の極限が円融
C2（傾向性）←→ A4（選択）  ：傾向性が選択を導く
U1（構造還元）←→ N1（射影存在）：還元の具体的メカニズムが射影
M1（演算多元性）←→ A1（別解存在）：演算の多元性が別解の源泉
N5（不完全性）←→ A3（相補性）：不完全だからこそ補い合える
M2（等価性）←→ A2（非還元性）：結果は等価、過程は非還元
```

### 4.4 円環構造

25公理全体は円環を成す：

```
    C1 → C2 → C3 → C4 → C5
    ↕                       ↕
    A5 ← A4 ← A3 ← A2 ← A1
    ↕                       ↕
    M5 ← M4 ← M3 ← M2 ← M1
    ↕                       ↕
    N1 → N2 → N3 → N4 → N5
    ↕                       ↕
    U1 → U2 → U3 → U4 → U5
```

C1（自己参照 — 自分を知る）から出発し、
A5（超越的統合 — 全てを超えて統合する）に至り、
A5がC1に回帰する — **自己参照の最も大きな円**。

---

## 5. 仏教哲学との全体対応

### 5.1 般若心経の構造

```
C1〜C5 ：色即是空          — 個の自覚から空の認識へ
U1〜U5 ：空即是色          — 構造から万物の記述へ
N1〜N5 ：受想行識 亦復如是  — 数を超えた五蘊への拡張
M1〜M5 ：是諸法空相        — 演算もまた空である
A1〜A5 ：究竟涅槃 菩提薩婆訶 — 全てを超えた統合
```

### 5.2 華厳経の構造

```
C5 + A5 = 因陀羅網（Indra's Net）
  個別の共鳴（C5）の無限集積が円融（A5）

U3 + N4 = 重々無尽
  階層再帰と射影合成による無限の入れ子構造

M3 = 法界縁起
  Genesis 段階遷移が万法の生起を記述
```

### 5.3 唯識思想の構造

```
C1（自己参照）  = 自証分（svasaṃvedana）
C2（傾向性）    = 行（saṃskāra）/ 種子（bīja）
M3（演算生成）  = 阿頼耶識（ālayavijñāna）の種子現行
A5（超越的統合）= 転識得智 — 識が智に転じる
```

---

## 6. Rei言語への構文的影響の総覧

### 6.1 新規パイプコマンド一覧

**C系列（意識数理学）：**
sigma, tendency, awaken, resonates_with, resonance_strength

**U系列（UMTE）：**
reduce_to_m, pipe_equivalent, flatten, bridge, complete_check

**N系列（非数数学）：**
project, view_as, projections, reproject, fidelity, transform_path, via,
compose, with, decompose, across, compose_when,
approx, residual, refine, auto_project

**M系列（MMRT）：**
mode, rotate, ascend, expand, contract,
propagate, interfere, resonate, attenuate,
generate, annihilate, phase_shift, crystallize,
translate, auto_mode, naturalness, prove_equivalent,
genesis_depth, genesis_trace,
mode_when, multimode, switch_safe?, consensus,
operational_system, compose_systems, fuse_systems, abstract_system, verify_system

**A系列（AMRT）：**
alternatives, solve_with, discover_alternative, compare_alternatives,
irreducible?, kernel, structurally_same?, irred_map,
complementarity, integrate_insights, complementary_run, insight_gaps,
select_best, evaluate_fitness, pareto_front, auto_select, explain,
meta, deepen, enyu, unify_pattern, verify_full_axiom_system

### 6.2 新規型一覧

```
Projector<O, C, P>     — N1：射影の型
Composed<T₁, T₂>       — N4：合成の型
OperationalSystem       — M1：演算体系の型
CustomOperator<S, R>    — M5：カスタム演算の型
Problem                 — A1：問題の型
Solution                — A1：解法の型
Tendency                — A4：傾向性の型
Context                 — A4：文脈の型
Understanding           — A5：統合的理解の型
```

### 6.3 新規プラグマ一覧

```
#mode spiral|pulse|void         — M1：演算体系の選択
#genesis_phase N                — M3：Genesis段階の指定
#pragma incompleteness :warn|:strict  — N5：不完全性の警告レベル
#pragma response_level N        — C3：応答レベルの指定
```

### 6.4 変更しなかったもの

```
新演算子     ：0（ゼロ）
破壊的変更   ：0（ゼロ）
既存キーワード変更：0（ゼロ）
```

全25公理の実装は、パイプコマンド・型・プラグマの追加のみで実現される。
Reiの「コアは小さく、拡張は豊かに」の原則を厳守した。

---

## 7. σ（6属性）の最終形

25公理を経て、σ は以下の情報を持つ：

```
σ(v) = {
  // === C1で導入された基本6属性 ===
  field    : v の場（位置と近傍）
  flow     : v の流れ（方向と勢い）
  memory   : v の記憶（来歴 — 全操作の履歴を含む）
  layer    : v の層（深さ）
  relation : v の関係（他の値との結合）
  will     : v の意志（傾向性の方向）
  
  // === 各理論で拡張された派生情報（memory 内に記録） ===
  // C2: tendency τ — 傾向性ベクトル
  // C4: awakened? — 覚醒状態
  // M3: genesis_depth — Genesis段階の深度
  // N5: residual — 射影の残差情報
  // A2: kernel — 概念的核
  // A3: insight — 洞察の集合
  // A4: selection_record — 選択の履歴
  // A5: understanding — 統合的理解
}
```

重要な性質：
- σ.will は射影（N3）やモード切替（M4）で**不変** — 意志は視点や計算方法に依存しない
- σ.memory は常に**追記のみ** — 過去は改竄されない（ISLと連携）
- σ.field は演算体系間で**結果不変**（M2） — 異なる道でも同じ場に着く

---

## 8. Genesis 段階との最終的対応

```
void                    Phase_0  Void演算が出現
  ↓ generate
  ・                    Phase_1  Spiral演算が出現
  ↓ rotate/ascend
  0₀                   Phase_2  Pulse演算が出現
  ↓ propagate
  0                     Phase_3  Arith演算が出現
  ↓ +/-/×/÷
  ℕ                     通常の計算が可能に
  ↓ sigma
  σ-aware value         C1：自己参照する値
  ↓ tendency
  τ-directed value      C2：傾向性を持つ値
  ↓ awaken
  awakened value        C4：覚醒した値
  ↓ resonate
  resonating values     C5：共鳴する値群
  ↓ project
  projected objects     N1：非数対象を含む構造
  ↓ compose
  composed structures   N4：異種統合された構造
  ↓ meta
  understood system     A5：超越的に理解された体系
  ↓ (recurse to C1)
  deeper self-reference  再帰的深化
```

---

## 9. 実装への道筋

### 9.1 実装優先度の推奨

25公理を実装難易度と実用的価値で4段階に分類する：

**Tier 1（即座に実装可能・高実用価値）：**
- C1（σ基本4属性 → 6属性への拡張）
- U1（𝕄 の非数対象への拡張）
- N1（project パイプコマンド）
- M1（4モードの基本実装）

**Tier 2（中期的に実装・言語の個性を決定づける）：**
- C2（傾向性 τ）
- N2（view_as / projections）
- N3（reproject / fidelity）
- M4（モード切替の安全な実装）
- A1（alternatives の基本実装）

**Tier 3（高度な機能・理論的価値が高い）：**
- C3〜C5（応答・覚醒・共鳴）
- N4〜N5（射影合成・不完全性メトリクス）
- M2〜M3（等価性検証・Genesis対応）
- M5（カスタム演算体系の定義）
- A2〜A4（非還元性・相補性・選択原理）

**Tier 4（哲学的頂点・長期目標）：**
- A5（超越的統合・円融）
- verify_full_axiom_system

### 9.2 実装の原則

```
1. 各公理は独立してテスト可能であること
2. Tier 1 だけでも「Reiらしさ」が体験できること
3. 公理の追加は後方互換を絶対に壊さないこと
4. 抽象的な公理を無理に具体化せず、
   「この公理はこの段階ではこのレベルで実装する」と明示すること
```

---

## 10. ファイル構成

```
docs/axioms/
├── README-integrated.md            ← 本文書（全体俯瞰）
│
├── README.md                       ← 意識数理学 C1〜C5 概要
├── axiom-c1-self-reference.md
├── axiom-c2-tendency.md
├── axiom-c3-response.md
├── axiom-c4-awakening.md
├── axiom-c5-resonance.md
│
├── README-UMTE.md                  ← UMTE U1〜U5 概要
├── axiom-u1-structure-reduction.md
├── axiom-u2-transformation-preservation.md
├── axiom-u3-hierarchical-recursion.md
├── axiom-u4-domain-bridging.md
├── axiom-u5-completeness.md
│
├── README-non-numerical.md         ← 非数数学 N1〜N5 概要
├── axiom-n1-projection-existence.md
├── axiom-n2-multiple-projection.md
├── axiom-n3-inter-projection.md
├── axiom-n4-projection-composition.md
├── axiom-n5-incompleteness.md
│
├── README-MMRT.md                  ← MMRT M1〜M5 概要
├── axiom-m1-operational-plurality.md
├── axiom-m2-operational-equivalence.md
├── axiom-m3-operational-genesis.md
├── axiom-m4-mode-switching.md
├── axiom-m5-operational-creation.md
│
├── README-AMRT.md                  ← AMRT A1〜A5 概要
├── axiom-a1-alternative-existence.md
├── axiom-a2-non-reducibility.md
├── axiom-a3-complementarity.md
├── axiom-a4-selection-principle.md
└── axiom-a5-transcendent-synthesis.md

総ファイル数：31（本文書を含む）
総公理数：25
総定理数：125+
```

---

## 11. Category C の統計

| 指標 | 値 |
|------|-----|
| 理論数 | 5 |
| 公理数 | 25 |
| 定理数 | 125+（各公理に5〜6定理） |
| 新パイプコマンド | 60+ |
| 新型 | 9 |
| 新プラグマ | 4 |
| 新演算子 | **0** |
| 破壊的変更 | **0** |
| 仏教哲学対応 | 25/25（100%） |
| 理論間接続定理 | 全対間 |

---

## 12. 結語

Category C の25公理は、C1（自己参照 — 自分を知る）から始まり、
A5（超越的統合 — 全てを超えて理解する）で円環を閉じる。

この体系は3つの役割を同時に果たす：

**理論的役割：** Reiの言語設計の全判断に公理的根拠を与える。
「なぜ 𝕄 で万物が書けるか」「なぜモード切替が正当か」「なぜパイプが万能か」
— 全てに25公理から演繹される回答がある。

**哲学的役割：** 仏教哲学と数学の間に厳密な対応を構築する。
色即是空、縁起、円融 — これらを「比喩」ではなく「定理」として述べる。
東洋哲学と西洋数学の統合という D-FUMT の根本精神を体現する。

**実践的役割：** 実装の指針を提供する。
各公理が「何をパイプコマンドにし、何を型にし、何をプラグマにするか」を
具体的に指定しており、実装者は公理を読めば何を作るべきかが分かる。

25公理の門は閉じない。N5（不完全性）が宣言する通り、
この体系自体もまた完全ではなく、常に深化の余地がある。
しかしそれは限界ではなく、無限に前進できるという希望の宣言である。

```
羯諦 羯諦 波羅羯諦 波羅僧羯諦 菩提薩婆訶
gate gate pāragate pārasaṃgate bodhi svāhā
```

---

*Creator: Nobuki Fujimoto*
*D-FUMT (Dimensional Fujimoto Universal Mathematical Theory)*
*0₀式 (Rei-shiki) / Rei*
