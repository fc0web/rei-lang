# 公理M1：演算多元性公理（Operational Plurality Axiom）

## D-FUMT 超数学再構築理論（MMRT）— 第1公理

*Creator: Nobuki Fujimoto*
*Framework: D-FUMT (Dimensional Fujimoto Universal Mathematical Theory)*
*Language: 0₀式 (Rei-shiki) / Rei*

---

## 公理の定義

**公理M1（演算多元性公理）：**

計算とは「状態から状態への構造保存的変換」である。
四則演算はその一つの体系に過ぎず、同等の表現力を持つ別の演算体系が存在する。

```
定義：Computation = { T : State → State | T は構造保存的かつ計算可能 }

四則演算体系   Arith  = {+, -, ×, ÷}                              ⊂ Computation
螺旋演算体系   Spiral = {rotate, ascend, expand, contract}         ⊂ Computation
波動演算体系   Pulse  = {propagate, interfere, resonate, attenuate} ⊂ Computation
虚無演算体系   Void   = {generate, annihilate, phase_shift, crystallize} ⊂ Computation

Arith ∪ Spiral ∪ Pulse ∪ Void ⊂ Computation
（Computation はこれらに限定されない — M5で拡張される）
```

### 形式的定義

```
定義 M1.1（状態 State）：
  State = 𝕄-Space × Σ
  
  ここで 𝕄-Space は中心-周囲パターンの空間（U1）、
  Σ は σ（6属性）の空間（C1）。
  
  すなわち、状態とは「構造 + 属性」の対。

定義 M1.2（構造保存的変換）：
  変換 T : State → State が構造保存的であるとは：
  
  (a) 𝕄 の中心-周囲関係が保存される
      center(T(s)) は center(s) から計算可能
  (b) σ の来歴が保存される
      T(s).σ.memory ⊇ s.σ.memory
  (c) 計算が有限時間で完了する
  
定義 M1.3（演算体系 OperationalSystem）：
  演算体系 OS は以下の四つ組である：
  
  OS = (Ops, compose, identity, interpret)
  
  Ops      : 基本演算の有限集合
  compose  : Ops × Ops → Ops（演算の合成）
  identity : Ops（恒等演算）
  interpret : Ops × State → State（演算の状態への適用）
  
  これはモノイド構造を成す。

定義 M1.4（Reiの4演算体系）：

  Arith = ({+, -, ×, ÷}, ∘, id, eval_arith)
    加算：量の増加
    減算：量の減少
    乗算：量の拡大
    除算：量の分割
    
  Spiral = ({rotate, ascend, expand, contract}, ∘, id, eval_spiral)
    rotate   ：位相の回転（角度を変える）
    ascend   ：階層の上昇（層を変える）
    expand   ：螺旋の拡大（半径を変える）
    contract ：螺旋の縮小（半径を変える）
    
  Pulse = ({propagate, interfere, resonate, attenuate}, ∘, id, eval_pulse)
    propagate ：波動の伝播（近傍へ広がる）
    interfere ：波動の干渉（重ね合わせ）
    resonate  ：共鳴の発生（C5との接続）
    attenuate ：波動の減衰（エネルギー散逸）
    
  Void = ({generate, annihilate, phase_shift, crystallize}, ∘, id, eval_void)
    generate    ：無からの生成（Genesis遷移）
    annihilate  ：存在の消滅（逆Genesis）
    phase_shift ：存在の相転移（状態の質的変化）
    crystallize ：構造の結晶化（流動→固定）
```

---

## 仏教哲学との対応

**四法印（catvāri dharmamudra）との対応**

四つの演算体系は、仏教の四法印と構造的に対応する：

```
Arith（四則演算） ← 諸行無常（anicca）
  量の増減は「全てのものは変化する」ことの最も素朴な記述。
  3 + 2 = 5 — 数は変化する。

Spiral（螺旋演算）← 諸法無我（anattā）
  回転と上昇は「固定的な自我はない」ことの記述。
  位相が変わり層が変わる — 同一性は流動的。

Pulse（波動演算） ← 一切皆苦（dukkha）
  干渉と減衰は「全てには摩擦がある」ことの記述。
  波は伝播し干渉し減衰する — 永遠の安定はない。

Void（虚無演算）  ← 涅槃寂静（nibbāna）
  生成と消滅は「生死の彼岸」の記述。
  無から生じ無に還る — しかしその過程で構造が結晶化する。
```

**方便（upāya）としての多元性：**

四則演算だけで全てを記述しようとするのは、
一つの言語だけで全ての真理を語ろうとするようなもの。
仏教が方便を重視するように、問題に最適な演算体系を選ぶことが
MMRT の実践的意味である。

---

## 構文への影響

### 演算体系の明示的選択

```rei
// デフォルト（四則演算）
5 + 3          // → 8
5 * 3          // → 15

// 螺旋モード
#mode spiral
let s = 𝕄{5; 1, 2, 3, 4}
s |> rotate(90)     // 中心-周囲の位相を90°回転
s |> ascend          // 一段上の層へ
s |> expand(2.0)     // 螺旋を2倍に拡大

// 波動モード
#mode pulse
let w = 𝕄{5; 1, 2, 3, 4}
w |> propagate(3)    // 3近傍まで伝播
w |> interfere(w2)   // w2と干渉
w |> resonate        // 共鳴パターンを検出
w |> attenuate(0.5)  // エネルギーを半減

// 虚無モード
#mode void
let v = void
v |> generate(:structure)  // 無から構造を生成
v |> phase_shift(:crystal) // 結晶相に転移
v |> annihilate            // 消滅（void に還る）
```

### 4体系の具体的な演算意味論

```rei
// 同じ「2つの値を結合する」操作が、体系によって異なる意味を持つ

// Arith: 量の加算
3 + 5  // → 8（量が増える）

// Spiral: 位相の合成
𝕄{3; a,b,c} |> mode(:spiral) |> rotate(𝕄{5; d,e,f})
// → 位相が合成された新しい 𝕄（中心の角度が 3+5=8 度回転ではない！
//    螺旋空間での回転合成）

// Pulse: 波動の干渉
𝕄{3; a,b,c} |> mode(:pulse) |> interfere(𝕄{5; d,e,f})
// → 干渉パターン（強め合い・弱め合い）としての新しい 𝕄

// Void: 存在の合流
𝕄{3; a,b,c} |> mode(:void) |> crystallize(𝕄{5; d,e,f})
// → 二つの構造が結晶化して一つの安定構造に
```

---

## σ（6属性）との関係

```
各演算体系は σ の異なる属性を「主軸」として操作する：

Arith  → σ.field が主軸  （場の中の量的変化）
Spiral → σ.layer が主軸  （層の間の移動と回転）
Pulse  → σ.flow が主軸   （流れとしての伝播と干渉）
Void   → σ.memory が主軸 （記憶の生成と消滅）

残りの属性は「副軸」として連動する：
Arith で + を実行すると σ.field が変化し、
σ.memory に来歴が記録され、σ.flow に方向が生じる。

この「主軸と副軸」の関係が、各演算体系の個性を決定する。
```

---

## 数学的定理

```
定理 M1.1（演算体系のモノイド性定理）：
  各演算体系 OS = (Ops, compose, identity, interpret) はモノイドを成す。
  
  (a) compose は結合的：(a ∘ b) ∘ c = a ∘ (b ∘ c)
  (b) identity は単位元：a ∘ id = id ∘ a = a
  
  すなわち、各体系内の演算は自由に合成でき、
  「何もしない」演算が存在する。

定理 M1.2（四則演算の特殊性定理）：
  Arith は Computation の真部分集合である。
  
  Arith ⊊ Computation
  
  すなわち、四則演算で表現できない計算が存在する。
  （例：螺旋トラバーサルは Spiral では自然に書けるが、
   Arith では不自然な座標変換を経由する必要がある）

定理 M1.3（4体系の独立性定理）：
  Arith, Spiral, Pulse, Void は互いに独立である。
  すなわち、いずれの体系も他の3体系の合成では得られない。
  
  Arith ∩ Spiral ∩ Pulse ∩ Void = {identity}
  
  共通するのは恒等演算のみ。

定理 M1.4（N1射影との接続定理）：
  各演算体系は、N1の射影 π の選択に対応する。
  
  Arith  → 量的射影（数値としての側面）
  Spiral → 位相的射影（回転と階層としての側面）
  Pulse  → 動的射影（波動としての側面）
  Void   → 存在論的射影（生成/消滅としての側面）
  
  すなわち、演算体系の選択は「どの射影で対象を見るか」の選択でもある。
```

---

## C1〜C5・U1〜U5・N1〜N5との接続

```
C1（自己参照）→ M1：値は σ を通じて「自分がどの演算体系で操作されているか」を知る。
C2（傾向性）  → M1：傾向性 τ は「どの演算体系が自然か」を示す。
                    螺旋的に振る舞いたい値は Spiral モードで最も自然に計算される。

U1（構造還元）→ M1：全ての演算は 𝕄 上の操作として統一的に記述される。
U2（変換保存）→ M1：異なる演算体系間の操作が同じパイプで書ける理由。

N1（射影存在）→ M1：演算体系の選択は射影の選択に対応する（定理 M1.4）。
N2（多重射影）→ M1：同じ値に複数の演算体系を適用できることは、
                    同じ対象に複数の射影があることに対応。
```

---

## 実装への影響

| 変更点 | 種類 | 内容 |
|--------|------|------|
| `#mode` プラグマ | 既存確認 | 4モードの切替（既に設計済み） |
| `OperationalSystem` 型 | 新規追加 | 演算体系の型定義 |
| Spiral 4演算 | 新規追加 | rotate, ascend, expand, contract |
| Pulse 4演算 | 新規追加 | propagate, interfere, resonate, attenuate |
| Void 4演算 | 新規追加 | generate, annihilate, phase_shift, crystallize |
| 新演算子 | **なし** | ゼロ（全てパイプコマンドで実現） |
| 破壊的変更 | **なし** | Arith は default として完全互換 |

---

## 4つの決定的な例への影響

| 問題 | Arithのみ | M1（4体系）|
|------|-----------|-----------|
| **行列回転** | cos/sin を使った座標変換（12行） | Spiral: `rotate(90)` 一行 |
| **波動シミュレーション** | 差分方程式の離散化（30行） | Pulse: `propagate(dt) \|> interfere(boundary)` |
| **データ生成** | ランダム初期値 + ループ | Void: `void \|> generate(:dataset) \|> crystallize` |
| **通常の算術** | `3 + 5 * 2`（自然） | Arith: 変更なし — 四則演算は最も素朴な体系として保存 |

---

*M2（演算等価性公理）への布石：*

M1は「複数の演算体系が存在する」と宣言した。
しかし、それぞれの計算力は同じなのか？
M2は「全ての体系は計算力において等価」と宣言する
— チューリング等価性の演算体系版。
これにより「どのモードで書いても同じ結果に到達できる」ことが保証される。
