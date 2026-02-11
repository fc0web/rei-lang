# 公理U2：変換保存公理（Transformation Preservation Axiom）— Rei構文設計

## 公理の定義

**公理U2：変換保存公理（Transformation Preservation Axiom）**

*領域 D₁ における変換 T₁ と領域 D₂ における変換 T₂ が、𝕄 上で同じ中心-周囲操作パターンとして表現できるとき、T₁ と T₂ は Rei上で同一の構文で記述できる。この構造的等価性を「変換同型（transformation isomorphism）」と呼ぶ。*

```
∀ T₁ ∈ D₁, T₂ ∈ D₂:
  pattern(T₁) ≅ pattern(T₂)
  ⟹ rei_syntax(T₁) = rei_syntax(T₂)

ここで pattern(T) は、T が 𝕄 に対して行う操作の抽象パターン：
  - center への作用
  - periphery への作用
  - center-periphery 間の関係への作用
```

**U1との関係：**
- U1 = **構造**が統一できる（全てが 𝕄 になる）
- U2 = **操作**が統一できる（全てがパイプで書ける）★

U1が「名詞の統一」なら、U2は「動詞の統一」である。

---

## 哲学的根拠

**西洋：圏論の「関手（Functor）」**

圏論において、異なる圏（数学的構造の世界）の間の「構造を保つ写像」を関手と呼ぶ。関手は「対象の対応」と「射（変換）の対応」の両方を保存する。

U2はこの発想をプログラミング言語レベルに持ち込むものである。「物理学の変換」と「生物学の変換」が、Reiの 𝕄 上で同じパイプ操作になるとき、それは二つの領域間に関手が存在することを意味する。

```
圏論：  F : C₁ → C₂  （関手は構造と変換の両方を保存）

U1+U2： π₁ : D₁ → 𝕄   （構造を保存）← U1
        π₂ : D₂ → 𝕄   （構造を保存）← U1
        T₁ ↦ pipe_op   （変換を保存）← U2 ★
        T₂ ↦ pipe_op   （変換を保存）← U2 ★
```

**東洋：仏教の「法（dharma）のパターン」**

仏教では、現象は無限に多様だが、そこに働く**法則（dharma）は有限**であるとする。十二縁起は12の要素の連鎖だが、この同じパターンが心理現象にも、社会現象にも、自然現象にも見出される。

U2はこれと同じ主張をする：**操作のパターンは、領域を超えて共通である。**

---

## 7つの基本操作パターン

全ての領域の変換は、𝕄 上の以下7つの基本パターンに分類できる：

```
┌──────────────┬──────────────────────────────────────┐
│ パターン      │ 𝕄 上の操作                            │
├──────────────┼──────────────────────────────────────┤
│ 集約 aggregate│ periphery → center に情報を集める     │
│ 拡散 diffuse  │ center → periphery に情報を広げる     │
│ 変形 transform│ center の値を変換する                  │
│ 選別 filter   │ periphery の一部を除外する             │
│ 並替 reorder  │ periphery の順序を変える               │
│ 合成 compose  │ 複数の 𝕄 を結合する                   │
│ 分解 decompose│ 一つの 𝕄 を複数に分割する             │
└──────────────┴──────────────────────────────────────┘
```

**主張：あらゆる領域の計算は、この7パターンの組み合わせで表現できる。**

---

## 領域を超えた変換同型の具体例

### 同型1：「重み付き平均」の普遍性

```
パターン：集約（periphery → center）

物理学（重力の合成）：  F_total = Σ G·mᵢ/rᵢ² · r̂ᵢ
ニューラルネット（活性化）：a = σ(Σ wᵢ·xᵢ + b)
経済学（均衡価格）：    P = Σ(demand_i · weight_i) / Σ(weight_i)
言語学（語義の決定）：  meaning(word) = Σ context_i · relevance_i
```

**4つの分野が全く同じRei構文になる：**

```rei
# 物理学
𝕄{particle; neighbors...} |> compute :weighted

# ニューラルネット
𝕄{neuron; inputs...} |> compute :weighted |> sigmoid

# 経済学
𝕄{price; traders...} |> compute :weighted

# 言語学
𝕄{word; context...} |> compute :weighted
```

### 同型2：「拡散」の普遍性

```
パターン：拡散（center → periphery）

物理学（熱伝導）：   ∂T/∂t = α∇²T
疫学（感染拡大）：   S → I with probability ∝ infected/total
社会学（噂の伝播）： rumor(person) → rumor(neighbors)
生物学（モルフォゲン）：∂C/∂t = D∇²C - λC + source
```

**全て同じ構文：**

```rei
空 system {
  層 0: 𝕄{center; neighbors...}
  更新 = σ.field |> compute :weighted
} |> diffuse("equilibrium")
```

### 同型3：「選別」の普遍性

```
パターン：選別（periphery の一部を除外）

データベース：    SELECT * FROM users WHERE age > 20
画像処理：       pixel' = pixel if pixel > threshold else 0
進化生物学：     population' = population |> filter(fitness > threshold)
グラフ理論：     tree' = tree |> prune(weight < min_weight)
```

**全て同じ構文：**

```rei
𝕄{center; elements...} |> filter(condition)
```

---

## 変換同型の形式定義

```
定義：変換同型（Transformation Isomorphism）

二つの変換 T₁ : 𝕄₁ → 𝕄₁', T₂ : 𝕄₂ → 𝕄₂' が変換同型であるとは、
以下の可換図式が成り立つことである：

  D₁ --T₁--> D₁'
   |           |
  π₁         π₁
   ↓           ↓
  𝕄  --P-->  𝕄'     ← P は Rei のパイプ操作
   ↑           ↑
  π₂         π₂
   |           |
  D₂ --T₂--> D₂'

すなわち：
  π₁ ∘ T₁ = P ∘ π₁   （D₁で変換してから射影 = 射影してからパイプ操作）
  π₂ ∘ T₂ = P ∘ π₂   （D₂で変換してから射影 = 射影してからパイプ操作）

このとき T₁ ≅_P T₂ と書く（P を介して同型）。
```

---

## Rei構文への落とし込み

### 変換同型の検証

```rei
let gravity_result = physics.force(earth, solar_system)
let rei_result = 𝕄{earth; sun, mars, jupiter...} |> compute :weighted

gravity_result |> isomorphic_to(rei_result)    # → true
```

### パターン抽出

```rei
let t = fn(m) => m |> compute :weighted |> normalize

t |> operation_pattern
# → {
#     primary: :aggregate,
#     secondary: :transform,
#     center_effect: :modified,
#     periphery_effect: :read,
#   }
```

### 領域間転写

```rei
# 物理学で有効な「振動の減衰モデル」
let damping = fn(m) =>
  m |> compute :weighted
    |> apply(decay: 0.95)

# 経済学に転写
let market_correction = damping |> transfer_to(economics)
```

### 7パターンの合成

```rei
# ETLパイプライン = 選別 → 変形 → 集約 の合成
let etl = fn(data) =>
  data
  |> filter(valid?)           # 選別
  |> map(transform_schema)    # 変形
  |> compute :weighted        # 集約

# 機械学習の1エポック = 拡散 → 集約 → 変形 の合成
let train_step = fn(net) =>
  net
  |> diffuse(forward: true)   # 拡散（フォワードパス）
  |> compute :loss             # 集約（損失計算）
  |> transform(:backprop)      # 変形（重み更新）
```

---

## Reiの既存ベンチマークとの接続

U2は、Reiの実証済みベンチマーク結果を**理論的に説明**する：

```
画像カーネル計算（4× 削減）：
  集約パターンがパイプコマンド1つで表現される。

多次元データ集約（3.7× 削減）：
  次元が増えても「集約パターン」は同じ。𝕄 の構造が次元を吸収する。

グラフ変換（3.7× 削減）：
  「変形 + 合成パターン」の組み合わせ。汎用パイプで済む。

ETLパイプライン（68% 削減）：
  「選別 → 変形 → 集約」パターンの典型的合成。
```

**U2の予測：** 任意の領域において、その領域の計算が7基本パターンの合成で表現できる限り、Reiは同等以上のコード削減を達成する。

---

## 数学的定理

```
定理 U2.1（パターン完全性定理）：
  7基本操作パターン（集約・拡散・変形・選別・並替・合成・分解）は、
  𝕄 上の全ての操作の基底をなす。
  すなわち、任意の 𝕄 → 𝕄 の操作はこれらの有限合成で表現できる。

定理 U2.2（変換同型の推移性）：
  T₁ ≅_P T₂ かつ T₂ ≅_P T₃ ならば T₁ ≅_P T₃
  すなわち、「同型クラス」が形成される。

定理 U2.3（コード削減の下界定理）：
  ある操作が k 個の基本パターンの合成で表現できるとき、
  Reiでの記述量は O(k) に比例する。
  従来の言語では O(k·d)（d = パターンあたりの平均実装行数）。
  削減率は平均 1/d（実測値 74%削減 ≈ d ≈ 3.8）。

定理 U2.4（C3との整合性）：
  変換同型は C3（応答公理）の影響を保存する。
  物理学で「引力が収束を加速する」のと
  社会学で「同調圧力が合意形成を加速する」のは、
  :contract の応答（C3）が同型的に作用した結果である。
```

---

## 実装への影響（差分）

| 変更点 | 種類 | 内容 |
|--------|------|------|
| `operation_pattern` パイプ | 新規追加 | 変換のパターン自動分類 |
| `isomorphic_to` パイプ | 新規追加 | 変換同型の検証 |
| `transfer_to` パイプ | 新規追加 | 領域間の操作転写 |
| 7基本パターンの内部分類 | evaluator.ts | パイプ操作の抽象パターン管理 |
| 新演算子 | **なし** | ゼロ |
| 破壊的変更 | **なし** | 既存コード完全互換 |
