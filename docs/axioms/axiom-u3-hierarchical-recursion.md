# 公理U3：階層再帰公理（Hierarchical Recursion Axiom）— Rei構文設計

## 公理の定義

**公理U3：階層再帰公理（Hierarchical Recursion Axiom）**

*𝕄 の中心 c は、それ自体が別の 𝕄 であり得る。また周囲要素 pᵢ も同様に 𝕄 であり得る。この再帰的入れ子により、任意の有限階層深度の構造が単一の 𝕄 表記で表現可能である。*

```
𝕄{c; p₁, ..., pₙ}  ここで c, pᵢ ∈ ReiValue ∪ 𝕄

再帰の例：
  𝕄{ 𝕄{a; b, c}; 𝕄{d; e, f}, 𝕄{g; h, i} }
  
  depth 0:  外側の 𝕄
  depth 1:  中心の 𝕄{a; b, c} と周囲の 𝕄{d; e, f}, 𝕄{g; h, i}
  depth 2:  各 𝕄 の中の値 a, b, c, d, e, f, g, h, i
```

**U1・U2との関係：**
- U1 = **何でも** 𝕄 になる（水平方向の統一）
- U2 = **どんな操作も**パイプで書ける（操作の統一）
- U3 = **どんな深さも** 𝕄 の再帰で表現できる（垂直方向の統一）★

U1+U2が世界の「広さ」を統一したのに対し、U3は世界の「深さ」を統一する。

---

## 哲学的根拠

**西洋：フラクタルと自己相似性**

マンデルブロが発見したフラクタル構造は、「部分が全体と同じ構造を持つ」。海岸線を拡大すると、拡大前と同じ複雑さのギザギザが現れる。U3は、この自己相似性を 𝕄 の再帰として形式化する。

**東洋：華厳経の「因陀羅網（Indra's Net）」**

華厳経に説かれるインドラの網は、無限の宝珠が網目ごとに結ばれ、各宝珠が他の全ての宝珠を映し出す。一つの宝珠の中に全宇宙が映り、その映像の中にさらに全宇宙が映る — 無限の入れ子構造。

U3の 𝕄 の再帰は、この因陀羅網の有限版である。

**D-FUMTとの接続：ゼロ拡張の再帰性**

```
0₀ の中に 0 がある
0₀₀ の中に 0₀ があり、その中に 0 がある
0₀₀₀ の中に 0₀₀ があり、その中に 0₀ があり、その中に 0 がある
```

ゼロ拡張は「数の中に数がある」再帰だった。U3はこれを「構造の中に構造がある」に一般化する。

---

## 再帰の3つの形態

### 形態1：垂直包含（Vertical Containment）

中心が下位構造を含む。最も基本的な再帰。

```
𝕄{ 𝕄{core; sub₁, sub₂}; peer₁, peer₂ }

例：会社構造
  𝕄{ 𝕄{CEO; VP_eng, VP_sales}; board_member₁, board_member₂ }
```

### 形態2：均一再帰（Uniform Recursion）

全ての要素が同じ深さの 𝕄 を持つ。ツリー構造の自然な表現。

```
𝕄{ 𝕄{a; a₁, a₂}; 𝕄{b; b₁, b₂}, 𝕄{c; c₁, c₂} }

例：ファイルシステム
  𝕄{ 𝕄{index.html; style.css, app.js}; 
      𝕄{images; logo.png, bg.jpg}, 
      𝕄{docs; readme.md, api.md} }
```

### 形態3：非対称再帰（Asymmetric Recursion）

中心と周囲で再帰の深さが異なる。

```
𝕄{ 𝕄{ 𝕄{nucleus; DNA, RNA}; mitochondria, ribosome}; 
    cell_membrane, 
    extracellular_matrix }

depth 0: 細胞全体
depth 1: 細胞内部（中心）と細胞外（周囲は浅い）
depth 2: 核の内部（中心の中心）
```

中心ほど深く、周囲ほど浅い — 「注目するものほど詳細に記述する」自然な認知構造に対応。

---

## Rei構文への落とし込み

### 基本：入れ子 𝕄 の生成

```rei
let team_a = 𝕄{leader_a; member_1, member_2, member_3}
let team_b = 𝕄{leader_b; member_4, member_5}
let dept   = 𝕄{director; team_a, team_b}

dept |> sigma.layer                    # → 0（最外層）
dept |> sigma.field.center |> sigma.layer  # → 1（中心の深さ）
```

### 深さの参照

```rei
let org = 𝕄{ 𝕄{CEO; VP_1, VP_2}; board_1, board_2 }

org |> sigma.layer              # → 0
org |> depth                    # → 2（最大の入れ子深度）

org |> at_depth(0)              # → org 全体
org |> at_depth(1)              # → [𝕄{CEO; VP_1, VP_2}, board_1, board_2]
org |> at_depth(2)              # → [CEO, VP_1, VP_2, board_1, board_2]
```

### パイプ操作の再帰的適用

```rei
let org = 𝕄{ 𝕄{100; 50, 30}; 𝕄{80; 40, 20}, 𝕄{60; 35, 25} }

# 表層のみの計算（デフォルト）
org |> compute :weighted

# ★ 全深度に再帰的に適用
org |> compute :weighted :deep

# ★ 特定の深さのみに適用
org |> compute :weighted :at(1)
```

**`:deep` モディファイア：** パイプ操作を全階層に再帰適用する。
**`:at(n)` モディファイア：** 特定の深さにのみ操作を適用する。

### 空間拡散における階層

```rei
空 ecosystem {
  層 0: 𝕄{
    𝕄{forest; tree_1, tree_2, deer, wolf};
    𝕄{river; fish_1, fish_2, frog},
    𝕄{meadow; grass, rabbit_1, rabbit_2}
  }

  拡散ルール {
    individual' = σ.field |> compute :weighted
    habitat' = σ.field |> compute :weighted :at(1)
  }
} |> diffuse("equilibrium") :deep
```

### ズームイン・ズームアウト

```rei
let universe = 𝕄{
  𝕄{milky_way;
    𝕄{solar_system;
      𝕄{earth;
        𝕄{japan;
          𝕄{tokyo; shibuya, shinjuku, ikebukuro}
        }
      }
    }
  };
  andromeda, triangulum
}

universe |> zoom_in                    # → 𝕄{solar_system; ...}
universe |> zoom_in |> zoom_in         # → 𝕄{earth; ...}
universe |> zoom_to(depth: 4)          # → 𝕄{tokyo; shibuya, shinjuku, ikebukuro}

# ★ どの深さでも同じ sigma が機能する
universe |> zoom_to(depth: 4) |> sigma.tendency
# → :expand（東京は拡張傾向 — C2が階層内でも機能）
```

---

## Genesis段階との接続

```
void                              → depth = -1（存在以前）
  ↓ forward
・（dot）                          → depth = 0（点 = 内部構造なし）
  ↓ forward  
0₀                                → depth = 1（ゼロの中にゼロ）
  ↓ forward
𝕄{0; 1, 2, 3, ...}               → depth = 1（数の中心-周囲）
  ↓ U3 再帰
𝕄{ 𝕄{...}; 𝕄{...}, ... }        → depth = 2, 3, ...（構造の深化）
```

**C1（σ.layer）との統合：**
C1で定義した `σ.layer` は、U3によって「任意の 𝕄 構造における再帰深度」に一般化される。

---

## 数学的定理

```
定理 U3.1（再帰の有限性定理）：
  Reiプログラム中の 𝕄 の再帰深度は常に有限である。

定理 U3.2（深度不変性定理）：
  パイプ操作 P は、適用対象の 𝕄 の深度を変えない。
  P : 𝕄(depth=n) → 𝕄(depth=n)
  深度を変えるのは明示的な操作（compose, decompose, zoom）のみ。

定理 U3.3（:deep の結合律）：
  (P₁ :deep) ∘ (P₂ :deep) = (P₁ ∘ P₂) :deep

定理 U3.4（ゼロ拡張との互換性定理）：
  ゼロ拡張 0₀...₀ (n重) は、
  𝕄{0; 𝕄{0; 𝕄{0; ...}}} (n重) と同型である。

定理 U3.5（C4覚醒の階層伝播定理）：
  深さ n で覚醒した値は、深さ n-1 の 𝕄 の振る舞いに影響し得る。
  これは「個人の覚醒が組織を変える」構造の形式化である。
```

---

## 実装への影響（差分）

| 変更点 | 種類 | 内容 |
|--------|------|------|
| `depth` パイプコマンド | 新規追加 | 𝕄 の最大再帰深度を返す |
| `at_depth(n)` パイプコマンド | 新規追加 | 特定深度の要素を列挙 |
| `:deep` モディファイア | 新規追加 | パイプ操作の全階層再帰適用 |
| `:at(n)` モディファイア | 新規追加 | 特定深度へのパイプ操作限定 |
| `zoom_in/out/to` パイプコマンド | 新規追加 | 階層内の視点移動 |
| `σ.layer` の一般化 | 定義拡張 | ゼロ拡張深度 → 𝕄 再帰深度 |
| 新演算子 | **なし** | ゼロ |
| 破壊的変更 | **なし** | 既存の σ.layer と完全互換 |
