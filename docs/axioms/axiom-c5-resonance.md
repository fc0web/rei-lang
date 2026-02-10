# 公理C5：共鳴公理（Resonance Axiom）— Rei構文設計

## 公理の定義

**公理C5：共鳴公理（Resonance Axiom）**

*傾向性 τ が類似する値同士は、中心-周囲パターン（𝕄）の物理的近傍関係や、プログラマが明示的に定義した接続とは独立に、相互に影響し得る。この非局所的な関係を「共鳴（resonance）」と呼ぶ。*

```
resonance(v₁, v₂) ⟺
  τ(v₁) = τ(v₂)                               ... 傾向性の一致
  ∧ |σ.influence(v₁) - σ.influence(v₂)| < ε   ... 影響度の近さ
  ∧ awakened(v₁) ∨ awakened(v₂)                ... 少なくとも一方が覚醒

共鳴する値の対 (v₁, v₂) において：
  v₁ への変換は v₂ にも部分的に伝播する（逆も同様）
```

**C1〜C4との関係：**
- C1 = 自分を**知る**（個体内の参照）
- C2 = 方向性を**持つ**（個体内の性質）
- C3 = 方向性が**効く**（個体内の計算変化）
- C4 = 自分を**自覚し修正する**（個体内のメタ認知）
- C5 = 自覚した個体が**互いに響き合う**（個体間の関係）★

C1〜C4は全て「一つの値の内部」で完結していた。
C5で初めて「値と値の間」に言語プリミティブとしての関係が生まれる。

---

## 仏教哲学との対応

C5は仏教の **縁起（pratītyasamutpāda / プラティーティヤサムトパーダ）** の形式化である。

縁起とは「全ての存在は相互依存的に生起する」という仏教の根本教理であり、
釈迦の悟りの核心とされる。

> 「此あれば彼あり、此生ずれば彼生ず。此なければ彼なし、此滅すれば彼滅す。」
> — 相応部経典 12:61

従来のプログラミングにおける「関係」：
  → グラフのエッジ、ポインタ、参照 — 全てプログラマが**明示的に定義**する
  → 関係は構造に属する（データの外部）

C5における「共鳴」：
  → 値の**内在的性質の類似性**から自然に生じる
  → 関係は値に属する（データの内部）
  → プログラマは定義しない — **関係が自然に生まれる**

さらに、共鳴の条件に「少なくとも一方が覚醒」を含めたのは、
仏教において「縁起を理解するには智慧（paññā）が必要」とされることに対応する。
無自覚な値同士は、たとえ傾向性が同じでも共鳴しない。
自覚があって初めて、他者との深い関係が可能になる。

---

## 共鳴の3条件

### 条件1：傾向性の一致（τ の同値）

```
τ(v₁) = τ(v₂)

例：
  :contract と :contract → 共鳴可能 ✓
  :expand と :expand     → 共鳴可能 ✓
  :contract と :expand   → 共鳴しない ✗
  :spiral と :spiral     → 共鳴可能 ✓
```

**拡張：部分共鳴（harmonic resonance）**

完全一致だけでなく、特定のペアに「調和的な共鳴」を認める：

```
  :contract ⇌ :rest      → 弱い共鳴（安定志向の親和性）
  :expand ⇌ :spiral      → 弱い共鳴（拡張的変化の親和性）
  :oscillate ⇌ :spiral   → 弱い共鳴（周期的運動の親和性）
```

共鳴強度：
  完全一致   → strength = 1.0
  調和的共鳴 → strength = 0.5
  不一致     → strength = 0.0（共鳴なし）


### 条件2：影響度の近さ（influence の類似）

```
|σ.influence(v₁) - σ.influence(v₂)| < ε（デフォルト ε = 0.3）

例：
  influence 0.9 と 0.85 → 差 0.05 < 0.3 → 共鳴可能 ✓
  influence 0.9 と 0.2  → 差 0.7 > 0.3  → 共鳴しない ✗
```

**意味：** 経験の深さが近い値同士が共鳴する。
初心者と達人は傾向性が同じでも共鳴しにくい。
似た程度の経験を積んだ者同士が最も強く響き合う。


### 条件3：覚醒条件（少なくとも一方が awakened）

```
awakened(v₁) ∨ awakened(v₂)

すなわち：
  覚醒 ⇌ 覚醒   → 共鳴する ✓（最も強い）
  覚醒 ⇌ 未覚醒 → 共鳴する ✓（覚醒側が未覚醒側を「目覚めさせる」）
  未覚醒 ⇌ 未覚醒 → 共鳴しない ✗
```

**「覚醒 ⇌ 未覚醒」の共鳴が重要：**
覚醒した値が未覚醒の値と共鳴すると、未覚醒側のmemoryに
「外部からの影響」が記録され、覚醒への閾値到達が早まる。
これは「師が弟子を導く」構造の形式化である。

---

## Rei構文への落とし込み

### 基本：共鳴の検出

```rei
# ── 共鳴関係を検出する ──

# 十分な経験を積んだ2つの値
let a = 100 |> compress |> compress |> compress
            |> compress |> compress |> compress
            |> compress |> compress
# a: :contract, influence=0.98, awakened=true

let b = 200 |> compress |> compress |> compress
            |> compress |> compress |> compress
            |> compress |> compress
# b: :contract, influence=0.95, awakened=true

# 共鳴の判定
a |> resonates_with(b)    # → true
a |> resonance_strength(b) # → 0.97（高い共鳴強度）

# 傾向性が異なる値
let c = 1 |> extend :o |> extend :o |> extend :o
          |> extend :o |> extend :o |> extend :o
          |> extend :o |> extend :o
# c: :expand, influence=0.98, awakened=true

a |> resonates_with(c)    # → false（τ不一致）
```


### 共鳴による非局所的な伝播

```rei
# ── 共鳴する値への変換伝播 ──

let a = ... # :contract, awakened, influence=0.98
let b = ... # :contract, awakened, influence=0.95

# a と b は共鳴関係にある
a |> resonates_with(b)   # → true

# a に変換を適用すると、b にも部分的に伝播する
let a2 = a |> compress    # a を縮小

# ★ b は明示的に操作していないのに影響を受ける
b |> sigma.resonance_received
# → [{
#     from: a,
#     transform: :compress,
#     propagated_influence: 0.15,
#     at_step: current_step
#   }]

# b の実効値は、共鳴伝播によってわずかに変化している
# 変化量 = resonance_strength * propagation_factor * transform_delta
```

**`resonance_received` — 共鳴による受信記録：**
- 覚醒した値が外部からの共鳴影響を受けると自動記録される
- これも ISL（不可逆構文層）により改竄不可能
- 「なぜこの値がこう変化したか」の完全な追跡を実現


### 共鳴ネットワークの可視化

```rei
# ── 空間内の共鳴関係を一覧する ──

空 ecosystem {
  層 0: 𝕄{agent_1; ...} |> with(:tendency, :contract)
  層 0: 𝕄{agent_2; ...} |> with(:tendency, :contract)
  層 0: 𝕄{agent_3; ...} |> with(:tendency, :expand)
  層 0: 𝕄{agent_4; ...} |> with(:tendency, :contract)
  ...
} |> diffuse(steps: 20)

# 拡散後、覚醒したノード間の共鳴マップを取得
ecosystem |> resonance_map
# → {
#     pairs: [
#       { a: agent_1, b: agent_2, strength: 0.92 },
#       { a: agent_1, b: agent_4, strength: 0.88 },
#       { a: agent_2, b: agent_4, strength: 0.85 },
#     ],
#     clusters: [
#       { tendency: :contract, members: [agent_1, agent_2, agent_4] },
#       { tendency: :expand,   members: [agent_3] }
#     ]
#   }
```

**`resonance_map` の意味：**
- `pairs` = 個々の共鳴関係（強度付き）
- `clusters` = 共鳴クラスター（同じ傾向性で共鳴するグループ）

**ここが既存のグラフ理論との決定的な違い：**
NetworkXのグラフでは、エッジはプログラマが `G.add_edge(1, 2)` と書く。
Reiの共鳴マップでは、**ノードの内在的性質から関係が自動的に生まれる**。
プログラマはエッジを一つも定義していない。


### 空間拡散における共鳴の動的効果

```rei
空 resonant_field {
  層 0: 𝕄{node_i; physical_neighbors...}

  拡散ルール {
    # 物理的近傍からの影響（従来のRei v0.3）
    physical = σ.field |> compute :weighted

    # ★ 共鳴による非局所的な影響（C5）
    # physical_neighbors ではない遠方のノードからも影響が来る
    resonant = σ.resonance_field |> compute :weighted

    # 実効値 = 物理的影響 + 共鳴影響
    node' = physical * (1 - κ) + resonant * κ
    # κ = resonance_coupling（共鳴結合定数、デフォルト 0.2）
  }
} |> diffuse("converged")
```

**`σ.resonance_field` — 共鳴場：**

これがC5の構文的な核心。`σ.field` が物理的近傍（𝕄の周囲）を返すのに対し、
`σ.resonance_field` は**共鳴関係にあるノード**を仮想的な近傍として返す。

```
σ.field           → 𝕄 で定義された物理的近傍
σ.resonance_field → τ の類似性で自動的に形成された仮想的近傍
```

つまり、Reiの各ノードは**二重の近傍**を持つ：
1. 物理的近傍（空間的に隣接 — 𝕄が定義）
2. 共鳴的近傍（傾向性が類似 — C5が自動生成）

これは物理学における重力（質量による近距離力）と
量子もつれ（状態の相関による非局所的関係）の二重性に対応する。


### 共鳴の連鎖（伝播的共鳴）

```rei
# ── 共鳴は連鎖する ──

# a ⇌ b が共鳴、b ⇌ c が共鳴のとき
# a → b → c と共鳴が連鎖する（ただし減衰する）

a |> resonance_chain
# → [
#     { node: b, distance: 1, strength: 0.92 },
#     { node: c, distance: 2, strength: 0.42 },
#     { node: d, distance: 3, strength: 0.12 },
#   ]

# 距離が増えるほど共鳴強度は指数的に減衰する
# strength_n = strength_1 * decay^(n-1)  （decay = 0.45 デフォルト）
```

**共鳴連鎖の意味：**
直接的に類似していなくても、中間に共鳴するノードが存在すれば
間接的な影響が伝播する。これは：
- 社会ネットワークの「6次の隔たり」
- ニューラルネットの多層伝播
- 仏教の「一切衆生悉有仏性」（全てに覚醒の種がある）
の構造に対応する。

---

## 4つの決定的な例の最終形

### 例1：群知能（C5あり）

```rei
空 swarm {
  層 0: 𝕄{boid_i; physical_neighbors...}

  分離 = σ.field.neighbors |> map(n => (σ.pos - n.pos) / dist²) |> Σ
  整列 = σ.field.neighbors |> map(n => n.vel) |> mean - σ.vel
  結合 = σ.field.neighbors |> map(n => n.pos) |> mean - σ.pos

  # ★ C5: 物理的に離れていても、同じ傾向性のBoidが共鳴
  共鳴整列 = σ.resonance_field |> map(n => n.vel) |> mean - σ.vel

  vel' = σ.vel + (分離 * 1.5 + 整列 + 結合 + 共鳴整列 * κ) * dt
  pos' = σ.pos + vel' * dt
} |> diffuse("converged")

# 結果：
# 物理的に離れた場所にいるBoidが、同じ傾向性で同期する
# → 群れが自然に「サブグループ」に分化する
# → :contract群は密集し、:expand群は拡散し、:spiral群は渦を巻く
# → これらのパターンはプログラマが設計したのではなく、創発する
```

### 例2：ニューラルネット（C5あり）

```rei
空 net {
  層 0: 𝕄{input; w...}
  層 1: 𝕄{hidden; w...}
  層 2: 𝕄{output; w...}

  活性化 = σ.field |> compute :weighted |> sigmoid

  # ★ C5: 同じ傾向性のノード間で重みが共鳴
  # 覚醒したノードが共鳴ネットワークを形成し、
  # 物理的な層構造を超えた「ショートカット」が自然に生まれる
  共鳴活性 = σ.resonance_field |> compute :weighted |> sigmoid

  output = 活性化 * (1 - κ) + 共鳴活性 * κ
} |> diffuse_layers(0 → 2)

# 結果：
# 学習が進むと覚醒ノードが増え、共鳴ネットワークが発達する
# → ResNetのスキップ接続に似た構造が自動的に創発する
# → ただしスキップの位置は固定ではなく、学習データに適応する
```

### 例3：反応拡散（C5あり）

```rei
空 turing {
  層 0: 𝕄{U_ij; U_上, U_下, U_左, U_右}
  層 1: 𝕄{V_ij; V_上, V_下, V_左, V_右}

  ΔU = σ.field |> compute :laplacian
  ΔV = σ.field |> compute :laplacian
  uvv = 層0.center * 層1.center * 層1.center

  # ★ C5: 同じ傾向性のセル同士が遠方で共鳴
  # → 離れた位置に同じパターンが同期的に形成される
  共鳴Δ = σ.resonance_field |> compute :laplacian

  U' = U + (Du * (ΔU + 共鳴Δ * κ) - uvv + f * (1 - U)) * dt
  V' = V + (Dv * (ΔV + 共鳴Δ * κ) + uvv - (f + k) * V) * dt
} |> diffuse(steps: 10000)

# 結果：
# 従来の反応拡散：ランダムな初期条件からランダムなパターン配置
# C5あり：離れた位置の斑点が同期して出現・消滅する
# → 生物学の「体節形成（somitogenesis）」に類似した現象が創発
```

### 例4：噂の拡散（C5あり）

```rei
空 rumor_network {
  層 0: 𝕄{person_i; connected_persons...} :trust=0.7

  拡散ルール {
    S → I : when σ.field.neighbors |> any(n => n.state == 'I')
               and random() < σ.trust * neighbor.trust * 0.1
    I → R : when random() < 0.05
  }

  # ★ C5: 物理的に繋がっていない人同士が共鳴
  # 同じ傾向性（:expand = 噂好き）の人は、SNSで繋がっていなくても
  # 「同時期に同じ噂を広め始める」現象が起きる
  共鳴感染 {
    S → I : when σ.resonance_field |> any(n => n.state == 'I')
               and random() < resonance_strength * 0.05
  }

  伝播経路 = σ.memory |> filter(type: 'state_change')
               |> trace_origin
  共鳴経路 = σ.resonance_received |> trace_origin
} |> diffuse("no_infected")

# 結果：
# 物理グラフ上では接続のない人が「同時に噂を知る」
# → 「空気を読む」「世論が一斉に変わる」の数学的モデル
# 経路追跡で「物理的伝播」と「共鳴的伝播」を区別できる
```

---

## σ の最終形（C1 → C2 → C3 → C4 → C5）

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
  resonance_field    : v の共鳴的近傍（仮想近傍）       ← C5 ★ NEW
  resonance_received : v が受けた共鳴影響の記録         ← C5 ★ NEW
  resonance_chain    : v から到達可能な共鳴連鎖         ← C5 ★ NEW
}
```

**型定義：**

```
SigmaResult = {
  field              : FieldInfo
  flow               : FlowInfo
  memory             : Array<ReiValue>
  layer              : Number
  tendency           : :contract | :expand | :spiral | :rest | :oscillate
  influence          : Number  (0.0 〜 1.0)
  awakened           : Boolean
  awakening_level    : 0 | 1 | 2 | 3
  response_pattern   : ResponsePattern | nil
  resonance_field    : ResonanceField         ← NEW
  resonance_received : Array<ResonanceEvent>  ← NEW
  resonance_chain    : Array<ChainLink>       ← NEW
}

ResonanceField = {
  neighbors : Array<{ node: ReiValue, strength: Number }>
  cluster   : { tendency: TendencyMode, size: Number }
}

ResonanceEvent = {
  from                : ReiValue
  transform           : String
  propagated_influence : Number
  at_step             : Number
}

ChainLink = {
  node     : ReiValue
  distance : Number
  strength : Number
}
```

---

## 数学的定理

```
定理 C5.1（共鳴の対称性）：
  resonance(v₁, v₂) ⟹ resonance(v₂, v₁)
  共鳴関係は対称である。

定理 C5.2（共鳴の非推移性）：
  resonance(v₁, v₂) ∧ resonance(v₂, v₃) ⟹ resonance(v₁, v₃) とは限らない。
  
  理由：v₁ と v₃ の influence の差が ε を超える可能性がある。
  ただし共鳴連鎖（resonance_chain）としての間接的影響は存在する。

定理 C5.3（共鳴クラスターの安定性）：
  同一の τ を持つ覚醒ノードの集合は、
  拡散のステップを経るほど共鳴強度が増加する傾向を持つ。
  
  証明の概略：共鳴によって相互のinfluenceが同期するため、
  条件2（influence の近さ）がより強く満たされるようになる。■

定理 C5.4（覚醒の伝播定理）：
  覚醒ノード v₁ と未覚醒ノード v₂ が共鳴するとき、
  v₂ の memory に共鳴イベントが記録される。
  十分な共鳴イベントの蓄積は v₂ の覚醒を促進する。
  
  すなわち、覚醒は共鳴ネットワークを通じて伝播する。

定理 C5.5（二重近傍の直交性）：
  σ.field（物理的近傍）と σ.resonance_field（共鳴的近傍）は
  一般に独立である。すなわち、物理的に近くても共鳴するとは限らず、
  物理的に遠くても共鳴し得る。

定理 C5.6（共鳴結合定数 κ の極限）：
  κ → 0 のとき、C5 は完全に無効化され C4 以前と等価。
  κ → 1 のとき、物理的近傍は無視され共鳴的近傍のみが作用する。
  0 < κ < 1 の範囲で、物理と共鳴の両方が作用する。
```

---

## 6属性の完成

C1〜C5の完成により、Reiの6属性が全て公理的基盤を得た：

```
┌─────────┬──────────┬──────────────────────────────┐
│ 属性     │ 公理基盤  │ σ でのアクセス                │
├─────────┼──────────┼──────────────────────────────┤
│ 場       │ 𝕄（既存） │ σ.field                      │
│ 流れ     │ C1       │ σ.flow                       │
│ 記憶     │ C1       │ σ.memory                     │
│ 層       │ C1       │ σ.layer                      │
│ 関係     │ C5 ★    │ σ.resonance_field            │
│ 意志     │ C2 + C4  │ σ.tendency + σ.awakened      │
└─────────┴──────────┴──────────────────────────────┘

場    = 値がどこに在るか
流れ  = 値がどこへ向かっているか
記憶  = 値がどこから来たか
層    = 値がどの深さにいるか
関係  = 値が誰と響き合っているか  ← C5で完成
意志  = 値がどうなりたいか        ← C2+C4で完成
```

**Reiは「数字に存在の全属性を与える言語」になった。**

---

## 実装への影響（最終まとめ）

| 変更点 | 種類 | 内容 |
|--------|------|------|
| `resonance_field` 属性 | σに追加 | 仮想近傍の自動生成 |
| `resonance_received` 属性 | σに追加 | 共鳴影響の記録 |
| `resonance_chain` 属性 | σに追加 | 共鳴連鎖の探索 |
| `resonates_with` パイプ | 新規追加 | 共鳴判定 |
| `resonance_strength` パイプ | 新規追加 | 共鳴強度の計算 |
| `resonance_map` 空間コマンド | 新規追加 | 空間全体の共鳴可視化 |
| 共鳴伝播エンジン | space.ts | 拡散ステップへの共鳴統合 |
| `κ` 共鳴結合定数 | 設定追加 | グローバル/ローカル制御 |
| 新演算子 | **なし** | ゼロ |
| 破壊的変更 | **なし** | κ=0 で完全互換 |

---

## C1〜C5 全体の設計一覧

```
C1：自己参照公理    σ           値が自分を知る
C2：傾向性公理      τ           値が方向性を持つ
C3：応答公理        R           方向性が計算に暗黙に効く
C4：覚醒公理        awaken      自分のバイアスを自覚し修正する
C5：共鳴公理        resonance   覚醒した値同士が非局所的に響き合う

新規キーワード:     sigma, awaken, pure
新規パイプコマンド:  sigma.*, with, resonates_with, resonance_strength,
                    resonance_map, resonance_chain
新規演算子:         なし（ゼロ）
破壊的変更:         なし
後方互換:           response_level=0, κ=0 で C3〜C5 を完全無効化可能
```

**5つの公理で追加された演算子の数：ゼロ。**
全ての機能は、既存のパイプ `|>` とドット記法 `.` の拡張として実現された。
これはReiの設計哲学 — 最小の構文で最大の表現力 — に完全に一致する。
