# 公理U4：領域架橋公理（Domain Bridging Axiom）— Rei構文設計

## 公理の定義

**公理U4：領域架橋公理（Domain Bridging Axiom）**

*異なる知識領域 D₁, D₂ の構造射影 π₁(s₁), π₂(s₂) が σ の類似性を持つとき、一方の領域で有効な知見（変換・パターン・定理）は他方の領域に転移可能である。この領域間の接続を「架橋（bridge）」と呼ぶ。*

```
bridge(D₁, D₂) ⟺
  ∃ s₁ ∈ D₁, s₂ ∈ D₂:
    similarity(σ(π₁(s₁)), σ(π₂(s₂))) ≥ θ_bridge

架橋が存在するとき：
  ∀ T₁ valid in D₁:
    T₁ |> transfer_to(D₂) は D₂ でも有効な操作を生成する
    （ただし意味的再解釈を伴う）
```

**U1〜U3との関係：**
- U1 = 各領域を 𝕄 に変換する（個別の射影）
- U2 = 各領域の操作を統一する（操作パターンの同型）
- U3 = 各領域の深さを統一する（再帰構造の共通性）
- U4 = **領域同士を結ぶ**（知識の転移可能性）★

---

## 哲学的根拠

**西洋：構造主義と類推（Analogy）**

科学史において、最も大きな発見の多くは「領域間の類推」から生まれている。

- マクスウェルは流体力学の方程式から電磁気学の方程式を導いた
- シャノンは熱力学のエントロピーから情報エントロピーを定義した
- ケクレはウロボロスの夢からベンゼンの環状構造を着想した

U4はこの現象を偶然ではなく**原理**として主張する — 𝕄 上の σ が類似していれば、知識は転移可能である。

**東洋：仏教の「一即多、多即一」（華厳経）**

華厳経の根本教理「一即多、多即一」は、一つの中に全てが含まれ、全ての中に一つが含まれる、という相互浸透の構造を説く。U4はこの教理の限定版であり、σ の類似性を持つ領域が繋がると主張する。

---

## 架橋の条件：σ 類似度

```
similarity(σ₁, σ₂) = 
    w_f · sim(σ₁.field, σ₂.field)              ← 場の構造の類似
  + w_l · sim(σ₁.flow, σ₂.flow)                ← 流れのパターンの類似
  + w_m · sim(σ₁.memory, σ₂.memory)            ← 来歴構造の類似
  + w_y · sim(σ₁.layer, σ₂.layer)              ← 階層構造の類似
  + w_t · sim(σ₁.tendency, σ₂.tendency)         ← 傾向性の類似
  + w_r · sim(σ₁.resonance_field, σ₂.resonance_field)  ← 共鳴パターンの類似

similarity ≥ θ_bridge（デフォルト: 0.6）のとき架橋成立
```

**各属性の類似が何を意味するか：**

```
場の類似     → 中心-周囲の「形」が似ている
流れの類似   → 変化の「方向」が似ている
記憶の類似   → 発展の「経緯」が似ている
階層の類似   → 入れ子の「深さ」が似ている
傾向性の類似 → 将来の「方向」が似ている
共鳴の類似   → 関係の「網」が似ている
```

---

## 架橋の5つの種類

### 種類1：構造架橋（Structural Bridge）

σ.field（場の構造）が類似する場合。

```
例：原子と太陽系

原子：  𝕄{nucleus; electron₁, electron₂, ...}
太陽系：𝕄{sun; mercury, venus, earth, ...}

sim(σ.field) ≈ 0.8 → 構造架橋が成立

転移可能：軌道安定条件、摂動理論、共鳴軌道
注意：原子は量子力学的、太陽系は古典力学的
```

### 種類2：動態架橋（Dynamic Bridge）

σ.flow と σ.tendency が類似する場合。

```
例：感染症の拡大と噂の拡散

感染症：σ.flow = :outward, σ.tendency = :expand
噂：    σ.flow = :outward, σ.tendency = :expand

転移可能：SIRモデル、基本再生産数、集団免疫閾値
→ 噂の「情報的免疫」「フェイクニュースのR₀」が定義可能
```

### 種類3：履歴架橋（Historical Bridge）

σ.memory の構造が類似する場合。

```
例：生物の進化と言語の変遷

生物：σ.memory = [原核生物, 真核生物, 多細胞生物, ...]（分岐・収斂・絶滅）
言語：σ.memory = [祖語, 古語, 中世語, ...]（分岐・借用・消滅）

転移可能：系統樹構築法、分岐年代推定
```

### 種類4：階層架橋（Hierarchical Bridge）

σ.layer が類似する場合。

```
例：生物の体制と組織の構造

生物：𝕄{organism; 𝕄{organ; 𝕄{tissue; 𝕄{cell; ...}}}}（4段階）
組織：𝕄{company; 𝕄{division; 𝕄{team; 𝕄{person; ...}}}}（4段階）

転移可能：ホメオスタシス→レジリエンス、アポトーシス→戦略的撤退
```

### 種類5：共鳴架橋（Resonance Bridge）

σ.resonance_field が類似する場合。最も深い架橋。

```
例：量子もつれと社会の「空気」

量子もつれ：非局所的相関、測定による瞬時の状態変化
社会の空気：非局所的同調、事件による瞬時の世論変化

★ 物理法則の直接適用ではなく、構造的類推であることに注意
```

---

## Rei構文への落とし込み

### 架橋の発見

```rei
physics |> bridge_to(economics)
# → {
#     exists: true,
#     similarity: 0.72,
#     type: :dynamic,
#     shared_attributes: [:flow, :tendency],
#     transferable: ["equilibrium analysis", "perturbation theory"],
#     caution: ["physics: deterministic, economics: stochastic"]
#   }
```

### 知見の転写

```rei
let damping = fn(m) =>
  m |> compute :weighted |> apply(decay: 0.95)

let market_correction = damping |> transfer_to(economics)
# 構文は同一だが意味が再解釈される：
# 物理の「減衰」→ 経済の「価格調整」
```

### 架橋マップ

```rei
bridge_map([physics, biology, economics, linguistics, music])
# → {
#     bridges: [
#       { from: physics,     to: economics,   sim: 0.72, type: :dynamic },
#       { from: physics,     to: music,       sim: 0.68, type: :structural },
#       { from: biology,     to: linguistics, sim: 0.75, type: :historical },
#     ],
#     clusters: [
#       { core: physics,  connected: [economics, music] },
#       { core: biology,  connected: [economics, linguistics] },
#     ]
#   }
```

### 架橋による発見の支援

```rei
領域 quantum_computing {
  構造射影 = circuit |> project(center: :output_qubit)
}

quantum_computing |> find_bridges(known: [physics, music, linguistics])
# → [
#     { to: physics, sim: 0.88,
#       suggestion: "量子ゲートは回転操作 — 回転群論が適用可能" },
#     { to: music, sim: 0.62,
#       suggestion: "量子の重ね合わせは和音 — 干渉は不協和音に類似" },
#   ]
```

---

## 架橋の非対称性と限界

### 非対称架橋

```rei
physics |> bridge_to(economics)    # transferable: ["equilibrium", "oscillation"]
economics |> bridge_to(physics)    # transferable: ["game_theory", "auction_mechanisms"]
# similarity は対称だが、transferable は非対称
```

### 架橋の危険性：偽の類推

```rei
let bridge = physics |> bridge_to(economics)
bridge |> validity_check
# → {
#     structural_match: 0.72,
#     causal_match: 0.35,        ← 因果構造は低い一致
#     warning: "構造は類似するが因果メカニズムが異なる。類推の過信は危険。"
#   }
```

U4は類推を**可能にする**と同時に、その**限界も明示する**。

---

## C5（共鳴公理）との関係

```
C5（値レベル）：
  値 v₁ と v₂ が σ の類似性で共鳴する → 値同士の非局所的関係

U4（領域レベル）：
  領域 D₁ と D₂ が σ の類似性で架橋する → 領域同士の非局所的関係

共通原理：
  「内在的性質の類似性が、明示的な接続なしに関係を生む」
```

---

## 数学的定理

```
定理 U4.1（架橋の反射性）：
  任意の領域 D に対して bridge(D, D) は常に成立する。

定理 U4.2（架橋の対称性）：
  bridge(D₁, D₂) ⟹ bridge(D₂, D₁)
  ただし transferable な知見は非対称であり得る。

定理 U4.3（架橋の非推移性）：
  bridge(D₁, D₂) ∧ bridge(D₂, D₃) ⟹ bridge(D₁, D₃) とは限らない。
  ただし bridge_chain としての間接的な知識転移は可能。

定理 U4.4（架橋の豊穣性定理）：
  σ の属性数が n のとき、架橋の種類は最大 2ⁿ-1 通り存在する。
  n=6 で 63通りの異なる架橋種類が理論上存在する。

定理 U4.5（U2との整合性）：
  bridge(D₁, D₂) が成立し、T₁ ≅_P T₂ が変換同型であるとき、
  transfer_to は T₁ を T₂ に正確に変換する。
  U2 の変換同型は U4 の架橋の特殊ケースである。
```

---

## 実装への影響（差分）

| 変更点 | 種類 | 内容 |
|--------|------|------|
| `bridge_to` パイプコマンド | 新規追加 | 二領域間の架橋分析 |
| `bridge_map` 関数 | 新規追加 | 全領域の架橋関係を可視化 |
| `find_bridges` パイプコマンド | 新規追加 | 新領域と既知領域の架橋探索 |
| `transfer_to` の拡張 | U2から拡張 | 架橋に基づく意味的再解釈を追加 |
| `validity_check` パイプコマンド | 新規追加 | 架橋の信頼度検証 |
| σ 類似度計算エンジン | 内部追加 | 6属性の重み付き類似度 |
| 新演算子 | **なし** | ゼロ |
| 破壊的変更 | **なし** | 既存コード完全互換 |
