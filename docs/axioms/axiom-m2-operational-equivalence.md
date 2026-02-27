# 公理M2：演算等価性公理（Operational Equivalence Axiom）

## D-FUMT 超数学再構築理論（MMRT）— 第2公理

*Creator: Nobuki Fujimoto*
*Framework: D-FUMT (Dimensional Fujimoto Universal Mathematical Theory)*
*Language: 0₀式 (Rei-shiki) / Rei*

---

## 公理の定義

**公理M2（演算等価性公理）：**

全ての演算体系は計算力において等価である。
すなわち、一つの体系で表現可能な計算は、他の体系でも表現可能である。
ただし、表現の自然さ（簡潔さ）は体系によって異なる。

```
∀OS₁, OS₂ ∈ {Arith, Spiral, Pulse, Void} :
  ∀T ∈ OS₁, ∃T' ∈ OS₂ : 
    ∀s ∈ State : T(s).result = T'(s).result
```

### 形式的定義

```
定義 M2.1（計算力等価性 Computational Equivalence）：
  二つの演算体系 OS₁, OS₂ が計算力等価であるとは：
  
  OS₁ ≡_comp OS₂ ⟺ 
    (∀T₁ ∈ OS₁, ∃T₂ ∈ OS₂ : T₁ ≡ T₂) ∧
    (∀T₂ ∈ OS₂, ∃T₁ ∈ OS₁ : T₂ ≡ T₁)
  
  ここで T₁ ≡ T₂ は「全ての入力に対して同じ結果を返す」こと。

定義 M2.2（表現効率 Expressiveness）：
  演算体系 OS で計算 C を表現するのに必要な演算の最小数を
  complexity(C, OS) と書く。
  
  M2 は以下を主張しない：
  complexity(C, OS₁) = complexity(C, OS₂)
  
  むしろ、一般に complexity は体系によって大きく異なる。
  これがモード切替の存在意義。

定義 M2.3（自然度 Naturalness）：
  計算 C と演算体系 OS の間の自然度を：
  
  Nat(C, OS) = 1 / complexity(C, OS)
  
  と定義する。Nat が高いほど、その計算はその体系で「自然」に書ける。
  
  Reiのモード切替は Nat を最大化する選択：
  optimal_mode(C) = argmax_{OS} Nat(C, OS)

定義 M2.4（翻訳写像 Translation Map）：
  演算体系 OS₁ から OS₂ への翻訳写像：
  
  Tr_{1→2} : OS₁ → OS₂
  
  M2 はこの写像の存在を保証する（M1.4 の独立性と矛盾しない）。
  独立性は「基本演算が一致しない」こと、
  等価性は「合成を通じて同じ計算に到達できる」こと。
```

---

## 仏教哲学との対応

**三乗の教え（triyāna）**

仏教には声聞乗・縁覚乗・菩薩乗という三つの道がある。
道は異なるが、いずれも最終的に同じ悟りに至る。

```
四則演算（Arith）   ← 声聞乗：最も素朴で直接的な道
螺旋演算（Spiral）  ← 縁覚乗：自力で構造を悟る道
波動演算（Pulse）   ← 菩薩乗：他者（近傍）との関係を通じた道
虚無演算（Void）    ← 仏乗  ：根源から直接的に到る道
```

道が異なるから優劣があるのではない。
問題（衆生の根機）に応じて最適な道を選ぶ — これが方便の知恵である。

**中道（majjhimā paṭipadā）：**

M2は「いずれの体系も特権的ではない」と宣言する。
四則演算が「正統」で螺旋演算が「異端」ではない。
全ての体系は等しく正当であり、等しく限界を持つ。
これは中道 — どちらの極端にも偏らない — の数学的表現。

---

## 構文への影響

### 翻訳写像の明示的使用 `translate`

```rei
// 四則演算を螺旋演算に翻訳
let arith_computation = |x| x + 5 * 2
let spiral_equivalent = arith_computation |> translate(:arith, :spiral)
// → |x| x |> rotate(angle_of(5)) |> expand(factor_of(2))

// 結果は同じ
arith_computation(10)    // → 20
spiral_equivalent(10)    // → 20（螺旋空間での同値な操作を経て）
```

### 最適モードの自動選択 `auto_mode`

```rei
// 問題に最適な演算体系を自動選択
data |> auto_mode |> compute
// 内部で各体系の Nat(computation, OS) を評価し、
// 最も自然な体系を自動選択

// 自動選択の結果を確認
data |> auto_mode |> current_mode
// → :spiral  （この計算には螺旋演算が最適）
```

### モード間の自然度比較 `naturalness`

```rei
// 計算の各モードでの自然度を比較
computation = |data| data |> rotate(90) |> map(|x| x |> ascend)

computation |> naturalness
// → { arith: 0.12,      // 座標変換を経由するので不自然
//     spiral: 0.95,      // 回転と上昇が基本演算 — 極めて自然
//     pulse: 0.31,       // 波動解釈は可能だが迂遠
//     void: 0.08 }       // 虚無演算での解釈は困難
```

### 等価性の証明 `prove_equivalent`

```rei
// 二つの異なるモードの計算が等価であることを証明
let f_arith = |x| x * 2 + 3
let f_spiral = |x| x |> expand(2.0) |> rotate(phase_of(3))

prove_equivalent(f_arith, f_spiral, domain: Integer(0..100))
// → { equivalent: true, 
//     proof: :exhaustive_check,
//     divergence_points: [] }
```

---

## σ（6属性）との関係

```
M2 は σ に対して「演算体系不変量」を定義する：

σ.result_invariant :
  同じ計算を異なる体系で実行したとき、
  σ の以下の属性は体系によらず同じ値を取る：
  
  σ.field の最終値   → 不変（結果は同じ）
  σ.layer の最終値   → 不変（最終的な深さは同じ）
  
  一方、以下の属性は体系によって異なり得る：
  
  σ.flow の経路     → 可変（辿る道筋が異なる）
  σ.memory の内容   → 可変（来歴が異なる）
  σ.will の遷移     → 可変（傾向性の変化パターンが異なる）
  σ.relation の形成 → 可変（形成される関係が異なる）

すなわち、「結果」は等価だが「過程」は異なる。
これは仏教の「道は異なるが悟りは一つ」と正確に対応する。
```

---

## 数学的定理

```
定理 M2.1（チューリング等価性定理）：
  4つの演算体系は全てチューリング完全である。
  
  Arith ≡_Turing Spiral ≡_Turing Pulse ≡_Turing Void
  
  証明の骨子：
  各体系が条件分岐・反復・記憶を表現可能であることを示す。
  Arith は自明。
  Spiral: rotate + ascend でカウンタ、expand/contract で条件分岐。
  Pulse: propagate でデータ伝送、interfere で条件分岐。
  Void: generate/annihilate でメモリ操作、phase_shift で分岐。

定理 M2.2（自然度の相補性定理）：
  任意の計算 C に対して、
  全ての体系で同時に最大の自然度を持つことは一般にない。
  
  ∃C : Nat(C, Arith) > Nat(C, Spiral) ∧ Nat(C, Spiral) > Nat(C, Arith)
  （別の計算 C' では逆転する）
  
  すなわち、「全ての問題に最適な唯一の体系」は存在しない。
  これがモード切替の必然性を証明する。

定理 M2.3（翻訳のオーバーヘッド定理）：
  翻訳写像 Tr_{1→2} は一般に計算量のオーバーヘッドを伴う。
  
  complexity(Tr_{1→2}(T), OS₂) ≥ complexity(T, OS₁)（一般に不等号）
  
  等号が成立するのは、T が OS₁ と OS₂ の
  「共通部分」に属する場合のみ。

定理 M2.4（Reiベンチマークの理論的説明定理）：
  Reiの実証済みベンチマーク結果：
  - 画像カーネル 4× 削減
  - 多次元データ集約 3.7× 削減
  - グラフ構造変換 3.7× 削減
  
  これらは M2 の帰結として説明可能：
  従来言語は Arith モードしか持たないため、
  本質的に Spiral や Pulse で書くべき問題を
  Arith に翻訳するオーバーヘッドが発生していた。
  
  Rei は最適なモードで書けるため、翻訳オーバーヘッドがゼロ。
  コード削減率 ≈ 1 / (翻訳オーバーヘッド比)

定理 M2.5（結果不変・過程可変定理）：
  同一の計算を異なる体系で実行したとき：
  
  result(T, OS₁) = result(T, OS₂)      （結果は不変）
  process(T, OS₁) ≠ process(T, OS₂)    （過程は可変）
  
  ここで process は中間状態の列（σ.memory に記録される）。
```

---

## C1〜C5・U1〜U5・N1〜N5との接続

```
C2（傾向性）  → M2：傾向性 τ が「最適モードの予測因子」として機能。
                    τ(v) = :spiral なら Spiral モードが自然。

C3（応答）    → M2：応答 R(v, T) は演算体系に依存する。
                    同じ変換 T でも、Arith と Spiral で応答が異なる。
                    しかし最終結果は等価（M2.5）。

U2（変換保存）→ M2：U2 が保証する「パイプ操作の保存性」は
                    M2 の等価性の上位概念。
                    演算体系を超えてパイプが機能する根拠。

U5（完全性）  → M2：U5 の「構造表現完全性」は、
                    4体系全てが等価にチューリング完全であることから帰結。

N3（射影間変換）→ M2：演算体系間の翻訳 Tr は、
                    N3 の射影間変換 T の演算版。
                    構造変換（N3）と演算変換（M2）が平行構造。
```

---

## 実装への影響

| 変更点 | 種類 | 内容 |
|--------|------|------|
| `translate` パイプコマンド | 新規追加 | 演算体系間の翻訳 |
| `auto_mode` パイプコマンド | 新規追加 | 最適モードの自動選択 |
| `naturalness` パイプコマンド | 新規追加 | 自然度の比較 |
| `prove_equivalent` | 新規追加 | 等価性の検証 |
| `current_mode` | 新規追加 | 現在の演算体系の確認 |
| 新演算子 | **なし** | ゼロ |
| 破壊的変更 | **なし** | 完全互換 |

---

*M3（演算生成公理）への布石：*

M1は「複数の演算体系がある」、M2は「それらは等価」と述べた。
しかし、なぜちょうどこの4つなのか？
M3は Genesis 段階遷移との対応を示し、
各演算体系がなぜ存在するかの存在論的根拠を与える。
