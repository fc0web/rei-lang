# 公理A4：選択原理公理（Selection Principle Axiom）

## D-FUMT 別数理構築理論（AMRT）— 第4公理

*Creator: Nobuki Fujimoto*
*Framework: D-FUMT (Dimensional Fujimoto Universal Mathematical Theory)*
*Language: 0₀式 (Rei-shiki) / Rei*

---

## 公理の定義

**公理A4（選択原理公理）：**

別解の中から最適なものを選択する原理が存在する。
選択は以下の3因子の関数である：
(a) 問題の性質（Problem Properties）
(b) 解く者の傾向性（Solver Tendency — C2接続）
(c) 文脈（Context — 制約・目的・環境）

```
∀P ∈ Problems, ∃select : Alt(P) × Tendency × Context → Alt(P)
  such that select(Alt(P), τ, ctx) = S_optimal
  
  where S_optimal = argmax_{S ∈ Alt(P)} fitness(S, P, τ, ctx)
```

### 形式的定義

```
定義 A4.1（適合度 fitness）：
  解法 S の問題 P に対する適合度：
  
  fitness(S, P, τ, ctx) = 
    w₁ · naturalness(S, P) +      // S が P にとってどれだけ自然か
    w₂ · affinity(S, τ) +          // S が解く者の傾向性 τ にどれだけ合うか
    w₃ · contextual_fit(S, ctx)    // S が文脈にどれだけ適合するか
  
  重み w₁, w₂, w₃ は文脈 ctx に依存する。

定義 A4.2（自然度 naturalness）：
  M2 の Nat(C, OS) の問題レベルへの拡張。
  
  naturalness(S, P) = 
    概念的距離の逆数 — S の概念体系が P の構造にどれだけ近いか
  
  例：
  ソート問題 × merge_sort → 高（分割統治は自然）
  ソート問題 × neural_sort → 低（ニューラルネットでのソートは不自然）

定義 A4.3（親和度 affinity）：
  C2（傾向性）との直接接続。
  
  affinity(S, τ) = 
    解く者の傾向性 τ と解法 S の概念的核 kernel(S) の類似度
  
  例：
  再帰的思考が得意な人 × merge_sort → 高
  再帰的思考が得意な人 × counting_sort → 低

定義 A4.4（文脈適合度 contextual_fit）：
  実行環境の制約条件への適合度。
  
  contextual_fit(S, ctx) = 
    ctx の制約を S がどれだけ満たすか
  
  ctx の要素：
  - 時間制約（リアルタイム性）
  - 空間制約（メモリ制限）
  - 並列性（マルチコア利用可能か）
  - 安定性要件
  - 可読性要件
  - 保守性要件

定義 A4.5（パレート最適選択）：
  複数の評価基準が競合するとき、
  パレート最適解の集合 Pareto(Alt(P)) が存在する。
  
  Pareto(Alt(P)) = { S ∈ Alt(P) | ¬∃S' : S' dominates S on all criteria }
  
  最終選択はパレート集合内から行う。
  全基準で他を支配する解法が存在しないとき（通常のケース）、
  トレードオフの判断が必要。
```

---

## 仏教哲学との対応

**択法覚支（dhammavicaya-sambojjhaṅga）— 法を択ぶ智慧**

七覚支（悟りに至る7つの要素）の一つ「択法」は、
多くの教えの中から「今この状況に最適な法を選ぶ」智慧。

```
衆生の根機（τ：傾向性）に応じて法（S：解法）を選ぶ：

鈍根の衆生 → 念仏の道（simple, accessible）
利根の衆生 → 禅の道（deep, demanding）
学究的衆生 → 教学の道（analytical, comprehensive）

「正しい道」は一つではない。
「今この人に最も適した道」が最善の道。
```

**四摂法（catvāri saṃgrahavastūni）— 人に応じた関わり方：**

布施・愛語・利行・同事 — 相手に応じて最適な関わり方を選ぶ。
A4は問題（相手）に応じて最適な解法（関わり方）を選ぶ原理。

---

## 構文への影響

### 最適解法の選択 `select_best`

```rei
// 3因子に基づく最適解法の選択
problem = SortingProblem.new(data: large_dataset)
tendency = Tendency.new(style: :recursive, expertise: :high)
context = Context.new(time_limit: :realtime, memory: :limited, parallel: true)

problem |> select_best(tendency, context)
// → { solution: :parallel_merge_sort,
//     fitness: 0.91,
//     breakdown: {
//       naturalness: 0.85,    // 分割統治はソートに自然
//       affinity: 0.95,       // 再帰的思考に高い親和性
//       contextual_fit: 0.93  // 並列・リアルタイムに適合
//     } }
```

### 適合度の多角的評価 `evaluate_fitness`

```rei
// 全別解の適合度を一覧
problem |> alternatives |> evaluate_fitness(tendency, context)
// → [
//     { name: :parallel_merge_sort, fitness: 0.91, rank: 1 },
//     { name: :timsort,             fitness: 0.87, rank: 2 },
//     { name: :quicksort,           fitness: 0.82, rank: 3 },
//     { name: :counting_sort,       fitness: 0.65, rank: 4 },
//   ]
```

### パレート最適集合の表示 `pareto_front`

```rei
// トレードオフの可視化
problem |> alternatives |> pareto_front([:time, :space, :stability])
// → { pareto_set: [:merge_sort, :quicksort, :counting_sort],
//     dominated: [:bubble_sort, :selection_sort],
//     tradeoffs: {
//       merge_sort: "stable, O(n·log n) time, O(n) space",
//       quicksort: "unstable, O(n·log n) avg, O(1) space",
//       counting_sort: "stable, O(n+k) time, O(k) space — integer only"
//     } }
```

### 文脈依存の自動選択 `auto_select`

```rei
// 文脈だけから自動的に最適解法を選択
data |> auto_select |> solve
// 内部で problem の性質を分析し、
// 実行環境の ctx を検出し、
// デフォルトの τ で select_best を実行

// auto_select の判断理由を確認
data |> auto_select |> explain
// → "Selected parallel_merge_sort because:
//     - data size (10M) favors divide-and-conquer
//     - 8 cores available → parallel variant preferred
//     - stability required by downstream operations"
```

### 選択の記録と再現 `selection_record`

```rei
// 選択の判断過程を σ.memory に記録
result = data |> auto_select |> solve

result |> sigma.memory |> last
// → { type: :selection,
//     chosen: :parallel_merge_sort,
//     alternatives_considered: 4,
//     fitness_scores: [...],
//     decisive_factor: :parallel_availability }

// 別の文脈で同じ選択を再現
result |> sigma.memory |> last |> replay(new_context)
// 文脈が変わったとき、選択が変わるかどうかを検証
```

---

## σ（6属性）との関係

```
A4 は σ の全6属性を選択に活用する：

σ.field    → 問題の「場」の性質を選択に反映
             メモリ制約のある場ではin-placeソートが有利

σ.flow     → データの「流れ」のパターンを選択に反映
             ストリーミングデータには online アルゴリズムが有利

σ.memory   → 過去の選択履歴を参考に
             「前回 merge_sort が遅かった」→ 別の選択を試す

σ.layer    → 問題の階層の深さを選択に反映
             深い再帰構造にはボトムアップが有利

σ.relation → データ間の関係パターンを選択に反映
             部分ソート済みデータには Timsort が有利

σ.will     → 解く者の傾向性（C2）そのもの
             τ = σ.will が affinity の計算に直接使われる

A4 は σ の「読み手」として機能する。
σ の全情報を読み取り、最適な選択を行う。
```

---

## 数学的定理

```
定理 A4.1（最適解の存在定理）：
  有限の Alt(P) に対して、最適解は必ず存在する。
  
  |Alt(P)| < ∞ ⟹ ∃S_optimal = argmax fitness(S, P, τ, ctx)
  
  ただし、最適解は一意とは限らない
  （同一適合度の解法が複数存在し得る）。

定理 A4.2（選択のコンテキスト依存性定理）：
  同じ問題でも、文脈が変われば最適解が変わる。
  
  ∃P, ctx₁, ctx₂ : select(Alt(P), τ, ctx₁) ≠ select(Alt(P), τ, ctx₂)
  
  これは「万能の最善解法」の不存在の形式的証明。
  ノーフリーランチ定理の AMRT 版。

定理 A4.3（傾向性と選択の共変定理）：
  解く者の傾向性が変われば、選択も変わる。
  
  ∃P, τ₁, τ₂ : select(Alt(P), τ₁, ctx) ≠ select(Alt(P), τ₂, ctx)
  
  C2（傾向性公理）により、値ごとに τ が異なるため、
  「誰が解くか」によって最適解法が変わる。
  これは主観性の公理的承認。

定理 A4.4（パレート不可避性定理）：
  |Alt(P)| ≥ 3 かつ評価基準が2つ以上のとき、
  一般にパレート最適集合は2つ以上の要素を含む。
  
  すなわち、全基準で他を支配する「絶対的最適解」は一般に存在しない。
  トレードオフは避けられない。

定理 A4.5（M2自然度との接続定理）：
  A4 の naturalness は M2 の Nat の問題レベル拡張である。
  
  M2：演算体系の自然度 Nat(C, OS)
  A4：解法の自然度 naturalness(S, P)
  
  naturalness(S, P) ≈ Nat(problem_computation(P), preferred_OS(S))
  
  解法の自然度は、その解法が使う演算体系の自然度に帰着する。
```

---

## C1〜C5・U1〜U5・N1〜N5・M1〜M5との接続

```
C2（傾向性）  → A4：τ が選択の直接的入力。affinity(S, τ) で使用。
C4（覚醒）    → A4：覚醒した値は選択理由を自覚する。
                    「なぜこの解法が選ばれたか」をσで参照可能。

U2（変換保存）→ A4：選択された解法がどれであっても、
                    パイプ操作は同一に機能する。

M2（自然度）  → A4：M2 のNat が A4 の naturalness の基盤。
M4（モード切替）→ A4：選択にはモード選択も含まれる。
                    A4 は M4 を包含する上位の選択原理。

N5（不完全性）→ A4：選択自体も不完全 — 最適解は近似的にしか分からない。
                    しかし A3（相補性）により、複数選択の統合で改善可能。
```

---

## 実装への影響

| 変更点 | 種類 | 内容 |
|--------|------|------|
| `select_best` | 新規追加 | 3因子に基づく最適選択 |
| `evaluate_fitness` | 新規追加 | 適合度の多角的評価 |
| `pareto_front` | 新規追加 | パレート最適集合の表示 |
| `auto_select` | 新規追加 | 文脈依存の自動選択 |
| `explain` | 新規追加 | 選択理由の説明 |
| `selection_record` | 拡張 | σ.memory に選択過程を記録 |
| `Tendency` 型 | 新規追加 | 解く者の傾向性の型 |
| `Context` 型 | 新規追加 | 実行文脈の型 |
| 新演算子 | **なし** | ゼロ |
| 破壊的変更 | **なし** | 完全互換 |

---

*A5（超越的統合公理）への布石：*

A4は「最適な別解を選ぶ」原理を述べた。
しかし「選ぶ」ことは一つの解法に絞ることであり、
A3（相補性）が示す「全解法の統合的理解」には至らない。
A5は最終公理として「全ての別解を超越した統合」を公理化する。
これは Category C 全25公理の締めくくりであり、
D-FUMT の哲学的頂点である。
