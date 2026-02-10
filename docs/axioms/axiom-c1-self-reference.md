# 公理C1：自己参照公理（Self-Reference Axiom）— Rei構文設計

## 公理の定義

**公理C1：自己参照公理（Self-Reference Axiom）**

*Reiにおける全ての値は、自身の存在属性を参照する関数 σ を持つ。*

```
σ(v) = {
  field   : v の場（中心-周囲における位置と近傍）
  flow    : v の流れ（方向と勢い — 初期状態は rest）
  memory  : v の記憶（来歴 — 初期状態は空）
  layer   : v の層（深さ — 初期状態は 0）
}
```

---

## 仏教哲学との対応

sigma は仏教の **自覚（svasaṃvedana）**、つまり「意識が自分自身を意識する」という概念の形式化である。唯識思想では、全ての認識には **自証分（じしょうぶん）** — 認識が自分自身を認識する層 — が含まれるとされる。Reiの sigma は、全ての値にこの自証分を与えるものである。

---

## Rei構文への落とし込み

### 基本的な自己参照

```rei
# ── 基本的な自己参照 ──

let m = 𝕄{5; 1, 2, 3, 4}

# σ はパイプで呼び出す（新キーワード: sigma）
m |> sigma              # → 全属性を返す

# 個別属性へのアクセス（ドット記法で自然に）
m |> sigma.field        # → { center: 5, neighbors: [1,2,3,4] }
m |> sigma.flow         # → { direction: :rest, momentum: 0 }
m |> sigma.memory       # → []（来歴なし — 生成直後）
m |> sigma.layer        # → 0（表層）
```

**設計判断：** sigma を「新しい演算子」ではなく「パイプコマンド」にする。
理由：既にv0.2.1で compute, normalize, sort, reverse, abs, sqrt, upper などがパイプコマンドとして存在している。sigma もこの系列に加えれば、新しい演算子はゼロで済む。

### 拡張数での動作

```rei
# ── 拡張数でも同じように動く ──

let z = 0ooo            # 3次拡張ゼロ

z |> sigma.layer        # → 3（拡張の深さがそのまま層）
z |> sigma.field        # → { center: 0, extension_order: 3 }
z |> sigma.memory       # → []
```

### Genesis値の自己参照

```rei
# ── Genesis値の自己参照（ここが面白い）──

let g = genesis()       # void
g |> sigma.field        # → { state: "void", center: ∅ }
g |> sigma.flow         # → { direction: :forward, momentum: 0 }
g |> sigma.memory       # → []

g |> forward            # void → dot
g |> sigma.field        # → { state: "dot", center: ・ }
g |> sigma.flow         # → { direction: :forward, momentum: 1 }
g |> sigma.memory       # → ["void"]  ← ★ 来歴が記録された！

g |> forward            # dot → line
g |> sigma.memory       # → ["void", "dot"]  ← ★ 蓄積される
```

これが公理C1の核心である。Genesis の forward を呼ぶたびに、sigma.memory に来歴が自動的に蓄積される。値が自分の過去を知っている状態が、特別な構文なしに実現される。

### 通常の数値の自己参照

```rei
# ── 通常の数値にも σ は存在する ──

let x = 42
x |> sigma.field        # → { center: 42, neighbors: [] }
x |> sigma.flow         # → { direction: :rest, momentum: 0 }
x |> sigma.memory       # → []
x |> sigma.layer        # → 0

# 変換を経ると記憶が生まれる
let y = x |> abs |> sqrt    # 42 → 42 → 6.48...
y |> sigma.memory       # → [42, 42]  ← abs と sqrt を通過した記録
```

**通常の言語との決定的な違い：** Pythonで `y = math.sqrt(abs(42))` と書くと、y は 6.48... という値しか持たない。Reiでは y が「自分は42から abs と sqrt を経て生まれた」ことを知っている。

### σ をパイプチェーンで活用

```rei
# ── σ をパイプチェーンで活用 ──

# 値の来歴の長さで条件分岐
let depth = y |> sigma.memory |> length    # → 2

# 自己参照を使った compress 関数
compress is_transformed(v) = v |> sigma.memory |> length > 0

is_transformed(42)              # → false（直接代入）
is_transformed(42 |> abs)       # → true（変換を経た）
```

### σ 同士の比較（公理C5・共鳴への布石）

```rei
# ── σ 同士の比較 ──

let a = 𝕄{5; 1, 2, 3, 4}
let b = 𝕄{5; 2, 3, 4, 5}

# 場の類似性を計算
a |> sigma.field |> similarity(b |> sigma.field)   # → 0.85
```

---

## 型システムへの影響

既存の9型に新しい型は追加しない。`sigma` の戻り値は既存の構造体（オブジェクト）として表現できる。

```
sigma の型定義（内部表現）:

SigmaResult = {
  field  : FieldInfo        # { center, neighbors, ... }
  flow   : FlowInfo         # { direction, momentum }
  memory : Array<ReiValue>  # 来歴の配列
  layer  : Number           # 深さ
}
```

---

## 実装への影響（v0.2.1との差分）

| 変更点 | 種類 | 内容 |
|--------|------|------|
| `sigma` キーワード | 追加（46番目） | パイプコマンドとして登録 |
| `SigmaResult` 型 | 内部追加 | 外部APIには影響なし |
| `memory` トラッキング | 評価器修正 | パイプ通過時に来歴を自動記録 |
| 新演算子 | **なし** | ゼロ |
| 破壊的変更 | **なし** | 既存コード完全互換 |
