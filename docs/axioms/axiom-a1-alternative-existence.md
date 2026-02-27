# 公理A1：別解存在公理（Alternative Existence Axiom）

## D-FUMT 別数理構築理論（AMRT）— 第1公理

*Creator: Nobuki Fujimoto*
*Framework: D-FUMT (Dimensional Fujimoto Universal Mathematical Theory)*
*Language: 0₀式 (Rei-shiki) / Rei*

---

## 公理の定義

**公理A1（別解存在公理）：**

任意の数学的問題 P に対して、根本的に異なる解法が少なくとも2つ存在する。
「根本的に異なる」とは、解法の構造（使用する概念・演算・証明戦略）が
互いに還元不可能であることを意味する。

```
∀P ∈ Problems, ∃S₁, S₂ ∈ Solutions(P) :
  S₁ ≠_structural S₂
  ∧ result(S₁) = result(S₂)
  ∧ ¬(S₁ reduces_to S₂) ∧ ¬(S₂ reduces_to S₁)
```

### 形式的定義

```
定義 A1.1（問題 Problem）：
  Problem = (Domain, Specification, Constraints)
  
  Domain        : 問題が属する領域
  Specification : 何を求めるか（入出力仕様）
  Constraints   : 制約条件
  
  問題は「何を」を規定し、「どう」は規定しない。

定義 A1.2（解法 Solution）：
  Solution = (Strategy, Operations, Proof)
  
  Strategy   : 問題へのアプローチの概念的枠組み
  Operations : 使用する演算の列（M1の体系を含む）
  Proof      : 解法が正しいことの証明
  
  解法は「どう」を規定する。

定義 A1.3（構造的差異 ≠_structural）：
  二つの解法 S₁, S₂ が構造的に異なるとは：
  
  (a) Strategy が異なる概念体系に属する
  (b) Operations の演算体系（M1）が異なる
  (c) Proof の証明戦略が異なる
  
  上記のうち少なくとも1つを満たすこと。
  
  重要：「コードの書き方が違う」だけでは構造的差異ではない。
  「ソートのバブルソートとクイックソート」は構造的に異なる。
  「バブルソートのループ変数名が違う」は構造的に異ならない。

定義 A1.4（解法族 Alt(P)）：
  問題 P に対する全ての構造的に異なる解法の集合を Alt(P) と書く。
  
  Alt(P) = { S ∈ Solutions(P) | S は他の全てと構造的に異なる }
  
  A1 は |Alt(P)| ≥ 2 を主張する。
```

---

## 仏教哲学との対応

**八万四千の法門（法門無量）**

仏教では「法門無量誓願学」— 教えは無量であり、全てを学ぶと誓う。
同じ悟り（解答）に至る道（解法）は一つではない。

```
問題 P = 「苦からの解放」
  
  S₁ = 戒律の道（śīla）     ← 規律的アプローチ
  S₂ = 禅定の道（samādhi）   ← 瞑想的アプローチ
  S₃ = 智慧の道（prajñā）    ← 知的アプローチ
  S₄ = 念仏の道（nembutsu）  ← 信仰的アプローチ
  
  result(S₁) = result(S₂) = result(S₃) = result(S₄) = 悟り
  しかし S₁ ≠_structural S₂ ≠_structural S₃ ≠_structural S₄
```

**多門（bahudvāra）：**

「多門」とは「多くの入口」。一つの真理（解）に至る入口は多い。
A1はこの多門性を数学に適用する。

数学の歴史そのものがA1の証左：
ニュートンとライプニッツの微積分は構造的に異なるが同じ結果に至る。
ユークリッド幾何と解析幾何は構造的に異なるが同じ定理を証明できる。

---

## 構文への影響

### 別解の列挙 `alternatives`

```rei
// 問題に対する別解の列挙
problem = Problem.new(
  domain: :sorting,
  spec: |input: [Int]| -> |output: [Int]| { output == sort(input) },
  constraints: [:stable]
)

problem |> alternatives
// → [
//     { strategy: :comparison,   name: "merge_sort",     complexity: O(n·log(n)) },
//     { strategy: :distribution, name: "counting_sort",  complexity: O(n+k) },
//     { strategy: :recursive,    name: "quicksort",      complexity: O(n·log(n)) },
//     { strategy: :insertion,    name: "timsort",        complexity: O(n·log(n)) },
//   ]
```

### 別解による解決 `solve_with`

```rei
// 特定の別解で問題を解く
data = [5, 3, 8, 1, 9, 2]

data |> solve_with(:comparison)    // merge sort で解く
data |> solve_with(:distribution)  // counting sort で解く
data |> solve_with(:recursive)     // quicksort で解く

// 結果は同じ [1, 2, 3, 5, 8, 9]
// しかし σ.memory（来歴）は全て異なる
```

### 別解の自動探索 `discover_alternative`

```rei
// 既存の解法とは構造的に異なる解法を探索
existing_solution = |data| data |> merge_sort

discover_alternative(existing_solution, domain: :sorting)
// → { strategy: :distribution, 
//     solution: |data| data |> counting_sort,
//     structural_difference: [:strategy, :operations] }
```

### 別解の比較 `compare_alternatives`

```rei
// 別解同士を多角的に比較
compare_alternatives(
  merge_sort,
  counting_sort,
  on: [:time_complexity, :space_complexity, :stability, :naturalness]
)
// → { merge_sort:    { time: O(n·log(n)), space: O(n),   stable: true,  naturalness: { arith: 0.7, spiral: 0.3 } },
//     counting_sort: { time: O(n+k),      space: O(k),   stable: true,  naturalness: { arith: 0.9, pulse: 0.1 } } }
```

---

## σ（6属性）との関係

```
A1 は σ に対して「解法の多元性」の情報を追加する：

値が計算された解法は σ.memory に記録される。
同じ結果でも、異なる解法で計算された値は異なる σ.memory を持つ。

σ.memory の解法情報：
  {
    solution_strategy: :comparison,
    operations_used: [:compare, :merge, :split],
    mode_history: [:arith, :arith, :arith],
    alternative_index: 0           // Alt(P) 中の何番目の解法か
  }

重要な帰結：
M2（等価性）は σ.field（結果）の一致を保証するが、
A1 は σ.memory（過程）の差異を保証する。
同じ答えでも「どう辿り着いたか」は異なる。

C4（覚醒）との接続：
覚醒した値は、自分が Alt(P) のどの解法で計算されたかを知り、
「別の道もあった」ことを認識している。
```

---

## 数学的定理

```
定理 A1.1（別解の存在保証定理）：
  任意の自明でない問題 P（|Solutions(P)| > 0）に対して、
  |Alt(P)| ≥ 2 である。
  
  証明の骨子：
  M1（演算多元性）により、少なくとも4つの演算体系が存在する。
  自明でない問題の解法は、少なくとも2つの異なる体系で
  異なる構造の解法を構成できる。

定理 A1.2（数学史的検証定理）：
  以下の数学的事実は A1 の経験的検証である：
  
  - 微積分：ニュートン流（流率法）とライプニッツ流（微分法）
  - 幾何学：ユークリッド幾何と解析幾何
  - 論理学：古典論理と直観主義論理
  - 数論  ：解析的証明と代数的証明と組合せ論的証明
  - 計算  ：チューリング機械とλ計算と再帰関数
  
  各対において result は同値だが structure は異なる。

定理 A1.3（N2との平行性定理）：
  A1（別解存在）は N2（多重射影）と平行構造を持つ。
  
  N2：同一対象 → 複数の射影
  A1：同一問題 → 複数の解法
  
  射影が「見方の多元性」なら、解法は「解き方の多元性」。
  両者は同じ原理（多元性）の異なる現れ。

定理 A1.4（解法族の豊富性定理）：
  問題の複雑さが増すと、別解の数も増加する傾向がある。
  
  complexity(P) → ∞ ⟹ |Alt(P)| → ∞
  
  単純な問題（1+1=?）には限られた別解しかないが、
  複雑な問題（タンパク質折り畳み）には無数の異なるアプローチがある。
```

---

## C1〜C5・U1〜U5・N1〜N5・M1〜M5との接続

```
C2（傾向性）  → A1：傾向性 τ は「どの別解に親和的か」を示す。
                    プログラマの個性や問題の性質が τ に反映。

C5（共鳴）    → A1：異なる別解が同じ部分構造を共有するとき、
                    共鳴が発生する。これが「別解間の意外な共通点」。

U4（領域架橋）→ A1：一つの領域の解法を別の領域に持ち込むこと
                    （転移学習の理論版）が、新しい別解の発見になる。

M1（演算多元性）→ A1：M1 の4演算体系は、A1 の別解を生成する
                    4つの「解法生成源」。各体系は異なる構造の解法を自然に生む。

M2（演算等価性）→ A1：M2 が「結果の同一性」を保証し、
                    A1 が「過程の多元性」を保証する。両者は相補的。

N2（多重射影）→ A1：平行構造（定理 A1.3）。
```

---

## 実装への影響

| 変更点 | 種類 | 内容 |
|--------|------|------|
| `alternatives` パイプコマンド | 新規追加 | 問題に対する別解の列挙 |
| `solve_with` パイプコマンド | 新規追加 | 特定の別解での解決 |
| `discover_alternative` | 新規追加 | 新しい別解の自動探索 |
| `compare_alternatives` | 新規追加 | 別解の多角的比較 |
| `Problem` 型 | 新規追加 | 問題の型安全な定義 |
| `Solution` 型 | 新規追加 | 解法の型安全な定義 |
| σ.memory の解法情報 | 拡張 | 使用された解法の記録 |
| 新演算子 | **なし** | ゼロ |
| 破壊的変更 | **なし** | 完全互換 |

---

*A2（非還元性公理）への布石：*

A1は「別解が存在する」と宣言した。
しかし、「別解に見えて実は同じ」ということはないのか？
A2は「真の別解は互いに還元不可能」と宣言する
— 別解の独立性の保証。
