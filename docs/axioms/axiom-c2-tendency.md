# 公理C2：傾向性公理（Tendency Axiom）— Rei構文設計

## 公理の定義

**公理C2：傾向性公理（Tendency Axiom）**

*Reiにおける全ての値 v は、変換を受けたときに「向かいやすい方向」を内在的に持つ。これを τ(v) と表記する。*

```
τ(v) ∈ { :contract, :expand, :spiral, :rest, :oscillate }
```

τ は外部から与えるパラメータではなく、値の**内在的性質**である。
確率的な重みとは異なり、τ は「値がどうなりたいか」という方向性を表す。

---

## 仏教哲学との対応

τ（傾向性）は仏教の **行（saṃskāra / サンスカーラ）** の形式化である。

唯識思想において、行は「意志的な形成力」を意味する。
過去の経験（記憶 = sigma.memory）が蓄積されることで、
未来への傾向性（τ）が形成される。これは業（カルマ）の構造そのものである。

- σ.memory（C1）= 過去の来歴 → 「どこから来たか」
- τ（C2）= 未来への傾向性 → 「どこへ向かいたいか」

C1とC2は時間軸上で**対称的な双対**をなす。

---

## 5つの傾向性モード

| モード | 意味 | 数学的対応 | 直感的イメージ |
|--------|------|-----------|---------------|
| `:contract` | 縮約に向かう | 収束、極限 | 石が谷底に転がる |
| `:expand` | 拡張に向かう | 発散、生成 | 種が芽を出す |
| `:spiral` | 螺旋的に変化する | 回転＋階層遷移 | 渦巻く銀河 |
| `:rest` | 静止を保つ | 不動点、平衡 | 湖面の静けさ |
| `:oscillate` | 振動する | 周期、往復 | 振り子の運動 |

**なぜ5つか：** D-FUMTの既存理論との対応
- `:contract` ← 縮小理論（ゼロ縮小、π縮小、e縮小、φ縮小）
- `:expand` ← ゼロ拡張理論、無限拡張数学理論
- `:spiral` ← 螺旋数体系理論
- `:rest` ← 時相静止状態論（「全ての事象は静止している」）
- `:oscillate` ← 合わせ鏡計算式（再帰的反射・振動）

---

## Rei構文への落とし込み

### 基本構文：τ の参照

```rei
# ── 値の傾向性を参照する ──

let m = 𝕄{5; 1, 2, 3, 4}

m |> sigma.tendency     # → :rest（デフォルト — 生成直後は静止）

# Genesis値は段階に応じた傾向性を持つ
let g = genesis()
g |> sigma.tendency     # → :expand（void は存在へ向かいたい）

g |> forward            # void → dot
g |> sigma.tendency     # → :expand（まだ拡張途上）

g |> forward            # dot → 0₀
g |> sigma.tendency     # → :rest（構造的ゼロは安定）
```

**設計判断：** `sigma.tendency` であり `sigma.tau` ではない。
理由：Reiの既存パイプコマンドは英語の動詞/名詞（compute, normalize, sort）であり、
ギリシャ文字の直接使用はコードの可読性を下げる。
ただし理論文書では `τ(v)` を使って良い。


### 傾向性の明示的設定

```rei
# ── 値に傾向性を与える ──

# with構文で傾向性を付与（新しい値を返す、元の値は不変）
let a = 42 |> with(:tendency, :contract)
a |> sigma.tendency     # → :contract

let b = 42 |> with(:tendency, :expand)
b |> sigma.tendency     # → :expand

# 多次元数にも適用
let field = 𝕄{5; 1, 2, 3, 4} |> with(:tendency, :spiral)
field |> sigma.tendency   # → :spiral
```

**設計判断：** `with` をメタ操作として使う。
これは既存の演算子（新規ゼロ）で実現できる。
`with` は値の属性を設定するパイプコマンドとして登録する。


### 傾向性の自動推論（C1との連携）

```rei
# ── memory から tendency が自動的に推論される ──

# 縮小を繰り返した値は :contract の傾向性を持つようになる
let x = 100
let y = x |> compress |> compress |> compress

y |> sigma.memory       # → [100, 50, 25]（来歴：縮小の連続）
y |> sigma.tendency     # → :contract（自動推論！）

# 拡張を繰り返した値は :expand の傾向性を持つ
let z = 1
let w = z |> extend :o |> extend :o |> extend :o

w |> sigma.memory       # → [1, 1₀, 1₀₀]（来歴：拡張の連続）
w |> sigma.tendency     # → :expand（自動推論）
```

**これがC2の核心設計：**
τ は手動設定もできるが、**sigma.memory（来歴）から自動的に推論される**。
過去の変換パターンが未来への傾向性を形成する。
これは仏教の業（カルマ）の正確な数学的実装である。

**推論ルール：**

```
memory の直近N回の変換が：
  - 全て値の減少 → :contract
  - 全て値の増加 → :expand  
  - 増減の交互   → :oscillate
  - 回転を含む   → :spiral
  - 変化なし     → :rest
  - 混在         → 最頻出パターンを採用
```


### 傾向性を使った条件分岐

```rei
# ── τ に基づく分岐 ──

compress behave(v) = match v |> sigma.tendency {
  :contract  => v |> compress
  :expand    => v |> extend :o
  :spiral    => v |> rotate(π/4)
  :rest      => v
  :oscillate => v |> negate
}

# 同じ関数に異なる傾向性の値を渡すと、異なる結果が出る
let a = 10 |> with(:tendency, :contract)
let b = 10 |> with(:tendency, :expand)

behave(a)   # → 5（縮約された）
behave(b)   # → 10₀（拡張された）
```

**重要：a と b は「同じ値 10」だが、傾向性が異なるため振る舞いが違う。**
これは通常のプログラミングでは不可能。
Python の `10` はどこでも同じ `10` だが、
Rei の `10` は来歴と傾向性を持つ **個性のある数** である。


### 空間拡散での傾向性（v0.3 Space Engine との統合）

```rei
# ── 拡散時に各ノードの傾向性が計算に影響する ──

空 ecosystem {
  層 0: 𝕄{prey;   neighbors...} |> with(:tendency, :expand)    # 被食者は増えたい
  層 1: 𝕄{predator; neighbors...} |> with(:tendency, :contract) # 捕食者は集約したい

  拡散ルール {
    # 傾向性に応じて拡散の「力」が変わる
    prey'     = σ.field |> compute :weighted * tendency_factor(σ.tendency)
    predator' = σ.field |> compute :weighted * tendency_factor(σ.tendency)
  }
} |> diffuse("equilibrium")

# tendency_factor の定義：
# :expand   → 1.5（拡散を促進）
# :contract → 0.5（拡散を抑制）
# :rest     → 1.0（中立）
# :spiral   → 1.0 + 0.5i（複素方向に回転）
# :oscillate → sin(step) で周期的に変化
```

**v0.3との統合ポイント：**
- `diffuse()` のステップごとに、各DNodeの `σ.tendency` が参照される
- 傾向性は拡散の「力の係数」として作用する
- これにより、同じ空間内で :expand なノードと :contract なノードが
  自然に異なるパターンを形成する（自己組織化の創発）


---

## σ の拡張（C1 → C2）

C1で設計した σ に `tendency` を追加：

```
σ(v) = {
  field    : v の場（中心-周囲における位置と近傍）     ← C1
  flow     : v の流れ（方向と勢い）                    ← C1
  memory   : v の記憶（来歴）                          ← C1
  layer    : v の層（深さ）                            ← C1
  tendency : v の傾向性（向かいやすい方向）            ← C2 ★ NEW
}
```

**型定義の更新：**

```
SigmaResult = {
  field    : FieldInfo
  flow     : FlowInfo
  memory   : Array<ReiValue>
  layer    : Number
  tendency : :contract | :expand | :spiral | :rest | :oscillate   ← NEW
}
```


---

## 実装への影響（v0.3との差分）

| 変更点 | 種類 | 内容 |
|--------|------|------|
| `tendency` 属性 | σに追加 | 5値の列挙型 |
| `with` パイプコマンド | 新規追加 | メタ属性の設定 |
| tendency 自動推論 | evaluator修正 | memory分析ロジック |
| DNode への tendency 統合 | space.ts修正 | 拡散係数への反映 |
| 新演算子 | **なし** | ゼロ |
| 破壊的変更 | **なし** | 既存コード完全互換 |


---

## 4つの決定的な例への影響

| 例 | C2追加前 | C2追加後 |
|----|---------|---------|
| **群知能** | 全Boidが同じルールで動く | 各Boidが :expand/:contract の個性を持ち、群れの形状が多様化 |
| **ニューラルネット** | 全ノードが同じ活性化 | ノードごとに傾向性が異なり、pruningの自然な基準になる |
| **反応拡散** | U/Vが均一に拡散 | :expand なUと :contract なVが非対称に振る舞い、パターンが豊かに |
| **噂の拡散** | 全ノードが同じ伝播確率 | :expand な人は噂を広めやすく、:rest な人は無視する「性格」が出る |


---

## C3（応答公理）への布石

C2の設計で、C3への接続点が明確になった：

- C2 = 値が傾向性を **持つ**
- C3 = 傾向性が計算結果に **影響する**

C2では `tendency_factor()` や `match σ.tendency` で傾向性を**明示的に**使った。
C3では、これを**暗黙的に**— つまり、プログラマが意識しなくても
傾向性が計算に自動的に影響する仕組みを設計する。

これは「意志が無意識のうちに行動に影響する」という
仏教の行（saṃskāra）のより深い側面の形式化になる。
