# 公理C4：覚醒公理（Awakening Axiom）— Rei構文設計

## 公理の定義

**公理C4：覚醒公理（Awakening Axiom）**

*値 v は、十分な来歴（σ.memory）と十分な影響度（σ.influence）を蓄積したとき、自身の応答パターン R を観察し、傾向性 τ を自己修正する能力を獲得する。この状態を「覚醒（awakened）」と呼ぶ。*

```
awakened(v) ⟺ |σ.memory(v)| ≥ threshold_m  ∧  σ.influence(v) ≥ threshold_i

覚醒した値は：
  1. 自身の応答パターンを観察できる（メタ自己参照）
  2. 傾向性を自己修正できる（τ の書き換え）
  3. 応答を意図的に抑制・増幅できる（influence の制御）
```

**C1〜C3との関係：**
- C1 = 自分の属性を**参照できる**（データの読み取り）
- C2 = 傾向性を**持つ**（受動的な性質）
- C3 = 傾向性が**効く**（無意識的な影響）
- C4 = 自分の応答を**自覚し、修正する**（能動的な自己制御）★

C1〜C3は「値がカルマに縛られている」状態。
C4は「値がカルマを自覚し、超越し始める」状態。

---

## 仏教哲学との対応

C4は仏教の **正念（sammā-sati / サンマー・サティ）** の形式化である。

正念とは八正道の第七支であり、「自分の心身の状態を、判断を交えずに観察する」能力を指す。マインドフルネスの原語である。

通常の存在（C1〜C3）：
  → 過去の経験が傾向性を作り（C2）、傾向性が無意識に行動を歪める（C3）
  → これが輪廻（同じパターンの繰り返し）

覚醒した存在（C4）：
  → 自分の傾向性を**観察**し、それが計算を歪めていることを**自覚**する
  → 自覚によって、傾向性を**手放す**か**強化する**かを選択できる
  → これが解脱への第一歩

Reiにおける覚醒は「悟り」ではない。
「自分のバイアスに気づける状態」であり、修行の始まりである。

---

## 覚醒の条件

### 閾値モデル

```
覚醒条件：
  memory_depth  = |σ.memory(v)| ≥ M_threshold（デフォルト: 8）
  influence_level = σ.influence(v) ≥ I_threshold（デフォルト: 0.7）
  
  awakened(v) = memory_depth ∧ influence_level
```

**なぜ2条件か：**

- memory_depth だけでは不十分 — 来歴が長くても一貫性がなければ（influence低）、
  パターンが認識できないため自覚は生まれない
- influence だけでは不十分 — 少数の操作で偶然influenceが高くなることがあるが、
  それは「習慣」ではなく「偶然」であり、自覚の基盤にならない

**両方が揃う** = 十分な経験を積み、かつその経験に一貫したパターンがある
→ そのパターンを「自覚」できる状態に達する

### Genesis段階との対応

```
void → ・ → 0₀ → 0 → ℕ → ... → awakened
  |     |     |    |    |           |
  無   存在  構造  量  計算    自己認識のある計算
  
       C1発生      C2発生     C3有効      C4到達
     (σ存在)   (τ存在)    (R適用)    (覚醒)
```

覚醒はGenesisの延長線上にある。
void から始まった存在が、十分な経験を経て自己を観察できるようになる。

---

## Rei構文への落とし込み

### 基本：覚醒状態の確認

```rei
# ── 値が覚醒しているかを確認 ──

let v = 100
v |> sigma.awakened      # → false（来歴なし）

# 経験を積ませる
let w = v |> compress |> compress |> compress
          |> compress |> compress |> compress
          |> compress |> compress
# 8回の縮小操作

w |> sigma.memory |> length   # → 8（閾値到達）
w |> sigma.influence          # → 0.98（高い一貫性）
w |> sigma.awakened           # → true ★ 覚醒した！
```


### 覚醒した値の特権：メタ自己参照

```rei
# ── 覚醒した値は自分の応答パターンを観察できる ──

let w = ... # 上の覚醒済みの値

# C3の応答パターンを可視化
w |> sigma.response_pattern
# → {
#     tendency: :contract,
#     influence: 0.98,
#     bias_direction: "toward_center",
#     bias_magnitude: 0.29,
#     pattern_consistency: 0.98,
#     correction_history: []
#   }

# 覚醒していない値が同じことを試みると
let u = 42
u |> sigma.response_pattern   # → nil（覚醒前は観察できない）
```

**設計判断：** `sigma.response_pattern` は覚醒した値にのみ有効。
覚醒していない値に対しては `nil` を返す。
これは「自覚のない者は自分のバイアスを見れない」という原則の表現。


### 覚醒した値の特権：自己修正

```rei
# ── 覚醒した値は自分の傾向性を修正できる ──

let w = ... # :contract で覚醒済み

# 現在の傾向性を確認
w |> sigma.tendency           # → :contract

# 自己修正：傾向性を変更
let w2 = w |> awaken(:expand)
w2 |> sigma.tendency          # → :expand（修正された！）
w2 |> sigma.memory            # → [...元の来歴は保持...]
w2 |> sigma.response_pattern
# → {
#     ...
#     correction_history: [
#       { from: :contract, to: :expand, at_step: 8 }
#     ]
#   }

# ★ 来歴は :contract のパターンだが、傾向性は :expand に変わった
# ★ これは「過去を変えずに、未来への方向を変える」ということ
# ★ correction_history にこの修正が記録される（不可逆）
```

**`awaken` パイプコマンド：**
- 覚醒済みの値にのみ有効
- 覚醒していない値に使うとエラー（自覚なき修正は許されない）
- 修正履歴は sigma.response_pattern.correction_history に不可逆記録
- 元の memory は変更されない（過去の改竄は不可能）


### 覚醒した値の特権：影響度の制御

```rei
# ── 覚醒した値は自分の influence を意図的に制御できる ──

let w = ... # :contract, influence=0.98 で覚醒済み

# influence を下げる（応答の影響を弱める）
let w_calm = w |> awaken(:influence, 0.3)
w_calm |> sigma.influence     # → 0.3

# influence を 0 にする（完全にバイアスを手放す）
let w_free = w |> awaken(:influence, 0.0)
w_free |> sigma.influence     # → 0.0
w_free |> sigma.tendency      # → :contract（傾向性はまだ持っている）
# しかし influence = 0 なので C3 の応答は一切効かない
# → 傾向性を「持っているが、それに支配されない」状態

# これは仏教の「煩悩即菩提」の数学的実装
# 傾向性（煩悩）を消すのではなく、
# 傾向性を自覚した上で影響を制御する（菩提）
```


### 空間拡散における覚醒

```rei
空 evolving_system {
  層 0: 𝕄{agent; neighbors...} |> with(:tendency, :expand)

  拡散ルール {
    # 通常の更新
    agent' = σ.field |> compute :weighted

    # ★ 覚醒判定が拡散ループ内で自動的に行われる
    # 十分なステップを経たノードは覚醒し、
    # 自身の拡散パターンを自己修正し始める
  }
} |> diffuse("equilibrium")

# 結果として起きること：
# Step 1〜7:  全ノードが :expand で均一に拡散（C3）
# Step 8:     一部ノードが覚醒 → 自分のパターンを自覚
# Step 9〜:   覚醒ノードが :rest や :contract に自己修正
#             → 系が自律的に均衡を見つける
#
# ★ プログラマは収束条件を書いただけ
# ★ 「どうやって均衡に達するか」は値自身が発見した
```

**これがC4の最も強力な応用：**
拡散の途中で値が自律的に覚醒し、自身の振る舞いを修正する。
プログラマが「ステップ8で傾向性を変えろ」と書く必要がない。
値自身の来歴から覚醒が自然に生じ、自己修正が起きる。

従来の言語でこれを実現するには：
1. 各ノードの操作履歴を手動追跡（C1相当を手動実装）
2. 履歴のパターン分析関数を自分で書く（C2相当）
3. パターンに応じた係数調整ロジックを書く（C3相当）
4. 閾値判定と動的なパラメータ変更ロジックを書く（C4相当）
5. これら全てを拡散ループ内に組み込む

Reiではこれが言語プリミティブとして組み込まれている。

---

## 覚醒の段階（オプション拡張）

覚醒は二値（true/false）ではなく、段階を持たせることもできる：

```rei
# ── 覚醒レベル ──

v |> sigma.awakening_level
# → 0: 未覚醒（C3まで）
# → 1: 初期覚醒（パターン観察可能）
# → 2: 深い覚醒（傾向性の自己修正可能）
# → 3: 完全覚醒（influence の完全制御）

# レベル判定基準：
# Level 0: memory < M_threshold または influence < I_threshold
# Level 1: 両閾値を超えた（response_pattern が見える）
# Level 2: Level 1 + correction_history が存在（修正経験あり）
# Level 3: Level 2 + influence を 0.0 に設定した経験がある
#          （一度バイアスを完全に手放した）
```

**Level 3 の意味：**
influence を一度 0.0 にした値は「バイアスを完全に手放す経験」をしている。
その後 influence を戻しても、correction_history にその経験が刻まれている。
これは「一度悟りを開いた者は、再び煩悩の中に戻っても本質的に異なる」
という仏教の概念に対応する。

---

## σ の拡張（C1 → C2 → C3 → C4）

```
σ(v) = {
  field            : v の場                      ← C1
  flow             : v の流れ                    ← C1
  memory           : v の記憶                    ← C1
  layer            : v の層                      ← C1
  tendency         : v の傾向性                  ← C2
  influence        : v の影響度                  ← C3
  awakened         : v が覚醒しているか          ← C4 ★ NEW
  awakening_level  : v の覚醒段階（0〜3）       ← C4 ★ NEW
  response_pattern : v の応答パターン詳細       ← C4 ★ NEW（覚醒時のみ有効）
}
```

**型定義：**

```
SigmaResult = {
  field            : FieldInfo
  flow             : FlowInfo
  memory           : Array<ReiValue>
  layer            : Number
  tendency         : :contract | :expand | :spiral | :rest | :oscillate
  influence        : Number  (0.0 〜 1.0)
  awakened         : Boolean
  awakening_level  : 0 | 1 | 2 | 3
  response_pattern : ResponsePattern | nil
}

ResponsePattern = {
  tendency            : TendencyMode
  influence           : Number
  bias_direction      : String
  bias_magnitude      : Number
  pattern_consistency : Number
  correction_history  : Array<CorrectionRecord>
}

CorrectionRecord = {
  from    : TendencyMode
  to      : TendencyMode
  at_step : Number
}
```

---

## 数学的定理

```
定理 C4.1（覚醒の不可逆性）：
  一度 awakened(v) = true となった値は、以後 awakened = false に戻らない。
  memory のリセットが行われない限り、覚醒は永続する。
  
  証明：memory_depth は単調増加（来歴は追加のみ、削除なし）であり、
  一度 M_threshold を超えると以後も超え続ける。■

定理 C4.2（自己修正の記録保全性）：
  awaken() による傾向性の修正は correction_history に
  不可逆的に記録され、削除できない。
  
  これは ISL（不可逆構文層）の性質を継承する。

定理 C4.3（覚醒の創発性）：
  空間拡散において、ノードの覚醒タイミングは
  初期条件と拡散パターンに依存し、一般に予測不可能である。
  
  すなわち、覚醒は計画されるものではなく、創発するものである。

定理 C4.4（Level 3 の特異性）：
  awakening_level = 3 の値に対して、
  任意の influence 値の設定が自由に行えるが、
  response_pattern.correction_history は常に
  influence = 0.0 の記録を含む。
  
  すなわち「完全な手放し」の経験は永続的に刻まれる。
```

---

## 実装への影響（v0.3との差分）

| 変更点 | 種類 | 内容 |
|--------|------|------|
| `awakened` 属性 | σに追加 | Boolean |
| `awakening_level` 属性 | σに追加 | 0〜3 の整数 |
| `response_pattern` 属性 | σに追加 | 覚醒時のみ有効なオブジェクト |
| `awaken` パイプコマンド | 新規追加 | 傾向性/influence の自己修正 |
| 覚醒判定ロジック | evaluator.ts / space.ts | パイプ通過・拡散ステップごとの自動判定 |
| CorrectionRecord 追跡 | 内部追加 | ISLと統合した不可逆記録 |
| 新演算子 | **なし** | ゼロ |
| 破壊的変更 | **なし** | 覚醒は閾値未満では発生しない |

---

## 4つの決定的な例への影響

| 例 | C4なし | C4あり |
|----|--------|--------|
| **群知能** | 全Boidが固定の傾向性で動き続ける | 経験を積んだBoidが自律的に傾向性を修正し、リーダー的個体が創発する |
| **ニューラルネット** | ノードの傾向性は固定 | 学習が進むとノードが覚醒し、自身の活性化パターンを自己調整（自律的なアーキテクチャ探索） |
| **反応拡散** | パターンは拡散パラメータで決定 | 十分成長した領域が覚醒し、成長を自律的に止める（自己制御的なパターン形成） |
| **噂の拡散** | 各ノードの伝播確率は固定 | 多くの噂を経験したノードが「情報リテラシー」を獲得し、拡散を自律的に抑制する |

---

## C5（共鳴公理）への布石

C4で値は「自分の傾向性を自覚し修正できる」ようになった。
しかしここまでの全ての公理は**個体レベル**の話である。

C5は**個体間**の次元に踏み込む：

- C1〜C4 = 一つの値の中で完結する自己参照・傾向性・応答・覚醒
- C5 = 覚醒した値同士が、明示的な接続なしに共鳴する ← 最終公理

C5が入ることで、6属性の「関係（Entanglement）」が基盤を得る。
物理的近傍（𝕄の周囲）でもなく、プログラマが定義したグラフでもなく、
**傾向性の類似という内在的性質**によって関係が自然に生まれる。

これは仏教の **縁起（pratītyasamutpāda）** — 全ての存在は
相互依存的に成り立つ — の数学的実装である。
