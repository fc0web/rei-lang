# 公理A3：相補性公理（Complementarity Axiom）

## D-FUMT 別数理構築理論（AMRT）— 第3公理

*Creator: Nobuki Fujimoto*
*Framework: D-FUMT (Dimensional Fujimoto Universal Mathematical Theory)*
*Language: 0₀式 (Rei-shiki) / Rei*

---

## 公理の定義

**公理A3（相補性公理）：**

構造的に異なる解法は、問題の異なる側面を照らす。
全ての別解を合わせた理解は、いずれの単一の解法を超える。
各解法は問題の「不完全な窓」であるが、窓を増やすことで理解が深まる。

```
∀P ∈ Problems, ∀S₁, S₂ ∈ Alt(P) :
  insight(S₁) ∪ insight(S₂) ⊋ insight(S₁)
  insight(S₁) ∪ insight(S₂) ⊋ insight(S₂)
  
  すなわち、二つの解法を合わせた洞察は、
  いずれの単独解法の洞察よりも厳密に大きい。
```

### 形式的定義

```
定義 A3.1（洞察 insight）：
  解法 S が問題 P について提供する洞察：
  
  insight(S) = { property(P) | property は S を通じて可視になる }
  
  洞察は「その解法を通じて初めて見える問題の性質」の集合。

定義 A3.2（相補性 complementarity）：
  二つの解法 S₁, S₂ の相補性：
  
  Comp(S₁, S₂) = |insight(S₁) △ insight(S₂)| / |insight(S₁) ∪ insight(S₂)|
  
  △ は対称差（一方にあり他方にない要素の集合）。
  
  Comp = 0 : 完全に同じ洞察を提供（A2により ≅_struct の場合のみ）
  Comp = 1 : 完全に相補的（全く異なる側面を照らす）
  0 < Comp < 1 : 部分的相補性（通常のケース）

定義 A3.3（累積洞察 Cumulative Insight）：
  n 個の解法を合わせた累積洞察：
  
  CI({S₁,...,Sₙ}) = |⋃ᵢ insight(Sᵢ)| / |insight_total(P)|
  
  ここで insight_total(P) は P についての全洞察（無限であり得る）。
  
  N5（不完全性）との対応：CI < 1（有限解法の場合）
  しかし lim_{n→∞} CI = 1（解法を増やせば漸近する）

定義 A3.4（固有洞察 unique insight）：
  解法 S の固有洞察 — S でしか得られない洞察：
  
  unique_insight(S) = insight(S) \ ⋃_{S'≠S} insight(S')
  
  A2 の kernel に対応する「洞察版」。
  A2（非還元性）が概念の固有性を保証し、
  A3 が洞察の固有性を保証する。
```

---

## 仏教哲学との対応

**相即（parasparasaṃgraha）— 互いに含み合う**

華厳思想の「相即」— 一つのものが他の全てを含み、他の全てが一つを含む。
A3は解法同士の相即を記述する：各解法は独立（A2）だが、
合わせるとより大きな理解が生じる（A3）。

```
解法 S₁ は S₂ の見えない側面を照らし、
解法 S₂ は S₁ の見えない側面を照らす。
  
これは因陀羅網（インドラの網）の知的版：
各解法（宝珠）が他の解法を映し、
全体として問題の全貌が浮かび上がる。
```

**波粒二重性と相補性：**

ニールス・ボーアの相補性原理は仏教的直観に基づくとされる
（ボーアの紋章には陰陽の太極図が使われた）。
光は「粒子」と「波動」という二つの非還元的（A2）かつ相補的（A3）な記述を持つ。
どちらか一方だけでは光の全貌を捉えきれない。

A3はこの物理学的相補性を数学一般に拡張する：
あらゆる問題は複数の「非還元的だが相補的な」記述を持つ。

---

## 構文への影響

### 相補性の測定 `complementarity`

```rei
// 二つの解法の相補性を測定
merge_sort_insight = insight(merge_sort_solution)
// → [:divide_and_conquer_structure, :recursion_depth, 
//     :merge_cost, :stability_guarantee]

counting_sort_insight = insight(counting_sort_solution)
// → [:value_distribution, :space_tradeoff,
//     :linear_time_condition, :integer_restriction]

complementarity(merge_sort_solution, counting_sort_solution)
// → { comp_degree: 0.85,
//     unique_to_merge: [:recursion_depth, :merge_cost],
//     unique_to_counting: [:value_distribution, :linear_time_condition],
//     shared: [:stability_guarantee] }
```

### 相補的洞察の統合 `integrate_insights`

```rei
// 複数の解法の洞察を統合
all_solutions = problem |> alternatives

all_solutions |> integrate_insights
// → { total_insight: 0.87,     // 全解法合わせて問題の87%を照らす
//     coverage_map: {
//       structure:    covered_by [:merge_sort, :quicksort],
//       distribution: covered_by [:counting_sort, :radix_sort],
//       adaptivity:   covered_by [:timsort],
//       worst_case:   not_yet_covered
//     },
//     gaps: [:worst_case_behavior_in_adversarial_input],
//     suggested_next: "Consider adversarial-resistant sorting" }
```

### 相補的実行 `complementary_run`

```rei
// 相補的な二つの解法を同時実行し、洞察を統合
data |> complementary_run(merge_sort, counting_sort)
// → { result: [1, 2, 3, 5, 8, 9],  // 結果は同じ
//     combined_insight: {
//       from_merge: "data has recursive substructure at depth 3",
//       from_counting: "value range is compact (max-min=8)",
//       synthesis: "compact-range data with recursive substructure" } }
```

### 洞察ギャップの発見 `insight_gaps`

```rei
// 現在の解法群が照らしていない側面を発見
problem |> alternatives |> insight_gaps
// → [:adversarial_robustness, :cache_behavior, :parallel_decomposition]
// これらを照らす新しい解法の探索が必要

// ギャップを埋める解法の自動探索
problem |> alternatives |> insight_gaps |> discover_for_gap
// → Solution.new(strategy: :cache_oblivious, 
//     insight: [:cache_behavior, :memory_hierarchy])
```

---

## σ（6属性）との関係

```
A3 は σ に insight 情報を追加する：

σ.insight : この値を生成した解法が提供する洞察の集合

merge_sort の結果の値：
  σ.insight = [:divide_and_conquer_structure, :recursion_depth, ...]

counting_sort の結果の値：
  σ.insight = [:value_distribution, :linear_time_condition, ...]

同じ値でも σ.insight が異なる場合、
覚醒した値（C4）は「自分について、まだ知らない側面がある」と認識する。

C5（共鳴）との深い接続：
異なる σ.insight を持つ値同士が共鳴するとき、
共鳴を通じて互いの洞察が「漏れ伝わる」。
これは「別の道を歩んだ者同士が出会い、互いの経験を共有する」
という人間的体験の形式化。
```

---

## 数学的定理

```
定理 A3.1（相補性の非自明性定理）：
  A2 で非還元的な二つの解法は、常に正の相補性を持つ。
  
  S₁ ≠_structural S₂ ⟹ Comp(S₁, S₂) > 0
  
  証明の骨子：
  A2 により kernel(S₁) ≠ ∅ かつ kernel(S₂) ≠ ∅。
  kernel に対応する固有洞察が存在するため、
  対称差は空でない。

定理 A3.2（累積洞察の単調増加定理）：
  解法を追加すると、累積洞察は必ず増加する。
  
  CI({S₁,...,Sₙ,S_{n+1}}) ≥ CI({S₁,...,Sₙ})
  
  等号は S_{n+1} が既存解法と構造的に同型の場合のみ。

定理 A3.3（N5との接続定理）：
  A3 の累積洞察 CI と N5 の近似度 Approx は平行構造を持つ。
  
  N5：射影を増やすと対象の記述が漸近的に完全に近づく
  A3：解法を増やすと問題の理解が漸近的に完全に近づく
  
  N5 が「表現の不完全性」なら、A3 は「理解の不完全性」。
  両者は同じ不完全性の異なる側面。

定理 A3.4（ボーアの相補性の一般化定理）：
  量子力学の波粒二重性は、A3 の特殊ケースである。
  
  光の問題 P に対して：
  S_particle（粒子的記述）と S_wave（波動的記述）は
  非還元的（A2）かつ相補的（A3）。
  
  A3 はこの物理的相補性を全数学問題に一般化する。

定理 A3.5（相補性と共鳴の接続定理）：
  相補的な解法で生成された値同士の共鳴度は一般に高い。
  
  Comp(S₁, S₂) が高い ⟹ Resonance(v₁, v₂) が高い傾向
  
  ここで v₁ = solve(P, S₁), v₂ = solve(P, S₂)。
  異なる道を辿った値こそ、出会ったときに最も豊かに響き合う。
```

---

## C1〜C5・U1〜U5・N1〜N5・M1〜M5との接続

```
C5（共鳴）    → A3：相補的な解法の値同士が共鳴する（A3.5）。
                    共鳴は相補性の「体験的表現」。

N2（多重射影）→ A3：多重射影と相補的解法は平行構造。
                    射影の相補性 = 解法の相補性。

N5（不完全性）→ A3：累積洞察の漸近性は N5 の不完全性と対応。

M2（演算等価性）→ A3：等価な結果に至る別解は、
                    結果は同じでも洞察が異なる。
                    M2 の「過程の可変性」が A3 の「洞察の相補性」の源泉。

M4（モード切替）→ A3：モード切替で異なる洞察が得られる。
                    同じ問題を Spiral で解いた洞察と
                    Pulse で解いた洞察は相補的。
```

---

## 実装への影響

| 変更点 | 種類 | 内容 |
|--------|------|------|
| `complementarity` | 新規追加 | 相補性の測定 |
| `integrate_insights` | 新規追加 | 洞察の統合 |
| `complementary_run` | 新規追加 | 相補的同時実行 |
| `insight_gaps` | 新規追加 | 洞察ギャップの発見 |
| `discover_for_gap` | 新規追加 | ギャップを埋める解法の探索 |
| σ.insight 属性 | 新規追加（σ.memory内） | 洞察の記録 |
| 新演算子 | **なし** | ゼロ |
| 破壊的変更 | **なし** | 完全互換 |

---

*A4（選択原理公理）への布石：*

A3は「別解は相補的」と宣言した。
しかし、実際のプログラミングでは「今ここで」一つの解法を選ぶ必要がある。
A4は「最適な別解を選ぶ原理」を公理化する。
選択は問題の性質、解く者の傾向性（C2）、文脈に依存する。
