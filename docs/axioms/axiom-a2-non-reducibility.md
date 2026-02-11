# 公理A2：非還元性公理（Non-Reducibility Axiom）

## D-FUMT 別数理構築理論（AMRT）— 第2公理

*Creator: Nobuki Fujimoto*
*Framework: D-FUMT (Dimensional Fujimoto Universal Mathematical Theory)*
*Language: 0₀式 (Rei-shiki) / Rei*

---

## 公理の定義

**公理A2（非還元性公理）：**

構造的に異なる解法は、互いに還元不可能である。
すなわち、ある別解を別の別解の「特殊ケース」や「変形」として
説明し尽くすことはできない。各別解は固有の概念的核を持つ。

```
∀S₁, S₂ ∈ Alt(P) : S₁ ≠_structural S₂ ⟹
  ¬∃f : S₁ →_reduce S₂
  ∧ ¬∃g : S₂ →_reduce S₁
  
  ∧ ∃kernel(S₁) : kernel(S₁) ∉ concepts(S₂)
  ∧ ∃kernel(S₂) : kernel(S₂) ∉ concepts(S₁)
```

### 形式的定義

```
定義 A2.1（還元 reduction）：
  解法 S₁ が S₂ に還元可能とは：
  
  S₁ →_reduce S₂ ⟺ ∃h : concepts(S₁) → concepts(S₂)
    such that h は全射かつ構造保存
  
  すなわち、S₁ の全ての概念が S₂ の概念で「言い換えられる」こと。
  
  A2 はこの h の不存在を主張する。

定義 A2.2（概念的核 kernel）：
  解法 S の概念的核 kernel(S) とは、
  S に固有であり他の解法には現れない概念の集合。
  
  kernel(S) = concepts(S) \ ⋃_{S' ∈ Alt(P), S'≠S} concepts(S')
  
  A2 は kernel(S) ≠ ∅ を全ての S に対して主張する。

定義 A2.3（非還元性の度合い irreducibility）：
  二つの解法間の非還元性の度合いを：
  
  Irred(S₁, S₂) = |kernel(S₁)| + |kernel(S₂)| / |concepts(S₁) ∪ concepts(S₂)|
  
  Irred = 0 : 完全に還元可能（同じ解法）
  Irred = 1 : 完全に非還元（概念を全く共有しない）
  0 < Irred < 1 : 部分的非還元（通常のケース）

定義 A2.4（構造的同型 structural isomorphism）：
  二つの解法が「見かけは違うが本質は同じ」場合を除外する。
  
  S₁ ≅_struct S₂ ⟺ ∃h : concepts(S₁) ↔ concepts(S₂)
    where h は同型写像
  
  A2 は Alt(P) の要素を構造的同型で割った商集合上で主張される。
  すなわち、「本当に違う」解法のみが Alt(P) に含まれる。
```

---

## 仏教哲学との対応

**不二（advaya）— 二つにして二つでない**

「不二」は大乗仏教の根本概念 — 対立する二つは実は「二つにして二つでない」。
しかしこれは「同じ」という意味ではない。
「二つでない」が「一つ」を意味しないところに不二の深さがある。

```
非還元性の不二：
  S₁ と S₂ は同じ答えに至る（不二 — 二つでない）
  しかし S₁ は S₂ に還元できない（二つ — 独立）
  
  S₁ ≠ S₂  かつ  result(S₁) = result(S₂)
  
  これがまさに「不二にして不一」
```

**維摩経の沈黙：**

維摩居士は「不二法門とは何か」と問われて沈黙した。
この沈黙は「言葉にした時点で一つの解法に還元してしまう」ことへの拒否。
A2は「還元してはならない」ことを数学的に保証する。

各解法は固有の概念的核（kernel）を持ち、
それは他の解法の言葉では「語り得ない」（維摩の沈黙）。

---

## 構文への影響

### 非還元性の検証 `irreducible?`

```rei
// 二つの解法が真に非還元的かを検証
merge_sort_solution = Solution.new(
  strategy: :divide_and_conquer,
  concepts: [:split, :merge, :recursion, :comparison]
)

counting_sort_solution = Solution.new(
  strategy: :distribution,
  concepts: [:count, :accumulate, :place, :index_mapping]
)

irreducible?(merge_sort_solution, counting_sort_solution)
// → { irreducible: true,
//     irred_degree: 0.75,
//     kernel_1: [:split, :merge, :recursion],
//     kernel_2: [:count, :accumulate, :index_mapping],
//     shared: [:comparison_or_ordering] }
```

### 概念的核の抽出 `kernel`

```rei
// 解法に固有の概念を抽出
merge_sort_solution |> kernel
// → [:split, :merge, :recursion]
// これらの概念は counting_sort には現れない

counting_sort_solution |> kernel
// → [:count, :accumulate, :index_mapping]
// これらの概念は merge_sort には現れない
```

### 偽の別解の検出 `structurally_same?`

```rei
// 「見かけの違い」と「本質的な違い」を区別
bubble_sort = Solution.new(strategy: :comparison, concepts: [:swap, :comparison, :iteration])
selection_sort = Solution.new(strategy: :comparison, concepts: [:select_min, :comparison, :iteration])

structurally_same?(bubble_sort, selection_sort)
// → { same_structure: true,
//     reason: "Both are comparison-based iterative sorts",
//     shared_kernel: [:comparison, :iteration],
//     surface_difference: [:swap vs :select_min] }
// → 構造的には同一。Alt(P) では1つとして扱われる。
```

### 非還元性マップ `irred_map`

```rei
// 全別解間の非還元性を可視化
problem |> alternatives |> irred_map
// → 非還元性のグラフ：
//   merge_sort ──0.75── counting_sort
//       |                    |
//      0.82                0.89
//       |                    |
//   quicksort ──0.71── radix_sort
```

---

## σ（6属性）との関係

```
A2 は σ に対して「概念的固有性」の情報を追加する：

σ.kernel : 値を生成した解法の概念的核
  
  merge_sort で生成された値：
    σ.kernel = [:split, :merge, :recursion]
    
  counting_sort で生成された値：
    σ.kernel = [:count, :accumulate, :index_mapping]

この kernel 情報は σ.memory の一部として記録される。
覚醒した値（C4）は自分の kernel を知り、
「自分がどの概念体系で生まれたか」を自覚する。

重要な帰結：
同じ数値でも、異なる kernel を持つ場合がある。
5 = merge_sort_result と 5 = counting_sort_result は
σ.field（値）は同じだが σ.kernel（出自の概念体系）が異なる。

これは C1（自己参照）の深化：
値は「自分が何であるか」だけでなく
「自分がどの概念体系から来たか」も知っている。
```

---

## 数学的定理

```
定理 A2.1（核の非空性定理）：
  Alt(P) の全ての要素は空でない概念的核を持つ。
  
  ∀S ∈ Alt(P) : kernel(S) ≠ ∅
  
  証明の骨子：
  kernel(S) = ∅ ならば concepts(S) ⊆ ⋃ concepts(S') であり、
  S は他の解法の概念で完全に説明可能 → S は他の解法に還元可能。
  これは A2 の非還元性に矛盾。

定理 A2.2（チャーチ=チューリングの別解性定理）：
  チューリング機械、λ計算、再帰関数は
  計算力において等価（チャーチ=チューリングのテーゼ）だが、
  概念的核が異なり、互いに還元不可能。
  
  kernel(Turing) = [:tape, :head, :state_transition]
  kernel(Lambda) = [:abstraction, :application, :substitution]
  kernel(Recursive) = [:base_case, :recursion, :composition]
  
  これは A2 の最も著名な例証。

定理 A2.3（非還元性とM1独立性の接続定理）：
  M1（演算多元性）の4体系の独立性は、
  A2 の非還元性の演算体系レベルでの表現である。
  
  Arith, Spiral, Pulse, Void は互いに概念的核が異なり、
  いずれも他に還元不可能。

定理 A2.4（非還元性の保存定理）：
  非還元的な二つの解法を合成しても、
  各解法の概念的核は保存される。
  
  kernel(compose(S₁, S₂)) ⊇ kernel(S₁) ∪ kernel(S₂)
  
  合成は核を「消す」ことはない。
  N4（射影合成）の decompose が可逆であることと対応。

定理 A2.5（ISLによる核の証明定理）：
  解法の概念的核は ISL を通じて暗号学的に証明可能。
  
  「この解法が真にこの概念的核を持つ」ことが
  検証可能な形で記録される。
  偽の別解（構造的に同じだが表面的に異なるだけ）を排除する。
```

---

## C1〜C5・U1〜U5・N1〜N5・M1〜M5との接続

```
C1（自己参照）→ A2：値は自分の概念的核（kernel）を σ で参照可能。

C4（覚醒）    → A2：覚醒は「自分の kernel を自覚し、
                    別の kernel の存在を認識する」こと。

U1（構造還元）→ A2：U1 の「𝕄 への還元」は A2 と矛盾しない。
                    全ての解法は 𝕄 で表現可能（U1）だが、
                    𝕄 上の構造は還元不可能に異なり得る（A2）。

M1（演算多元性）→ A2：M1 の4体系の独立性は A2 の具体例。

N5（不完全性）→ A2：各解法は問題の不完全な記述（N5）。
                    非還元性は「各記述が異なる情報を保持する」ことの保証。
```

---

## 実装への影響

| 変更点 | 種類 | 内容 |
|--------|------|------|
| `irreducible?` | 新規追加 | 非還元性の検証 |
| `kernel` パイプコマンド | 新規追加 | 概念的核の抽出 |
| `structurally_same?` | 新規追加 | 構造的同一性の検証 |
| `irred_map` | 新規追加 | 非還元性マップの可視化 |
| σ.kernel 属性 | 新規追加（σ.memory内） | 概念的核の記録 |
| 新演算子 | **なし** | ゼロ |
| 破壊的変更 | **なし** | 完全互換 |

---

*A3（相補性公理）への布石：*

A2は「別解は互いに還元不可能」と宣言した。
では、別解同士は無関係なのか？
A3は「否」と答える — 別解同士は補い合い、
一つの解法では見えない側面を別の解法が照らす。
