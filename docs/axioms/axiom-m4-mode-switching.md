# 公理M4：モード切替公理（Mode Switching Axiom）

## D-FUMT 超数学再構築理論（MMRT）— 第4公理

*Creator: Nobuki Fujimoto*
*Framework: D-FUMT (Dimensional Fujimoto Universal Mathematical Theory)*
*Language: 0₀式 (Rei-shiki) / Rei*

---

## 公理の定義

**公理M4（モード切替公理）：**

Reiのプログラムは、計算の途中で演算体系を切り替えることができる。
切替は値の σ を完全に保存し、解釈フレームのみを変更する。
切替は安全であり、情報損失を伴わない。

```
∀v ∈ Value, ∀OS₁, OS₂ ∈ {Arith, Spiral, Pulse, Void} :
  switch(v, OS₁, OS₂).σ = v.σ
  switch(v, OS₁, OS₂).value = reinterpret(v.value, OS₁, OS₂)
```

### 形式的定義

```
定義 M4.1（モード切替 switch）：
  switch : Value × OS × OS → Value
  
  switch(v, OS_from, OS_to) は以下を実行する：
  (a) σ の完全保存：全ての6属性 + genesis_depth が不変
  (b) 値の再解釈：同じビットパターンを新しい体系で解釈
  (c) 演算コンテキストの変更：以降の演算は OS_to で実行

定義 M4.2（再解釈 reinterpret）：
  reinterpret : ValueRepr × OS × OS → ValueRepr
  
  値の内部表現を、OS_from の意味論から OS_to の意味論に変換する。
  
  例：数値 5 の再解釈
  Arith → Spiral : 5 → (amplitude: 5, phase: 0, layer: 0)
  Arith → Pulse  : 5 → (energy: 5, frequency: 1, decay: 0)
  Arith → Void   : 5 → (existence_level: 5, phase_state: :crystallized)
  
  reinterpret は全単射であり、情報を失わない。

定義 M4.3（切替の可逆性）：
  switch(switch(v, OS₁, OS₂), OS₂, OS₁) = v
  
  すなわち、切替は常に完全可逆。
  行って戻れば元に戻る。

定義 M4.4（切替の透過性）：
  切替点を挟んだ計算の最終結果は、
  切替なしの計算と等価である（M2等価性による）。
  
  ただし、中間表現と計算効率は異なり得る。
  切替の目的は「より自然な（効率的な）表現を選ぶ」こと。
```

---

## 仏教哲学との対応

**四念処（cattāro satipaṭṭhānā）— 四つの観察対象**

仏教の瞑想実践である四念処は、同じ経験を4つの異なる観点から観察する：

```
身念処（kāyānupassanā）   ← Arith：身体（量・物質）の観察
受念処（vedanānupassanā）  ← Pulse：感受（波動・感覚）の観察
心念処（cittānupassanā）   ← Spiral：心（構造・パターン）の観察
法念処（dhammānupassanā）  ← Void：法（存在の本質）の観察
```

瞑想者は一つの観点に固定されず、四つの間を自由に移動する。
これがモード切替の瞑想的実践である。

**重要な洞察：**
四念処では「観察対象を変えても、観察する『もの』は同じ」。
M4でも「演算体系を変えても、操作される『値の本質（σ）』は同じ」。
変わるのは見方（解釈フレーム）だけである。

---

## 構文への影響

### インラインモード切替 `mode()`

```rei
// パイプの中でモードを自由に切り替え
data = 𝕄{10; 3, 7, 2, 8, 5}

result = data
  |> mode(:arith) |> normalize          // 正規化（四則演算で）
  |> mode(:spiral) |> rotate(fibonacci) // フィボナッチ角で回転
  |> mode(:pulse) |> propagate(3)       // 3近傍に伝播
  |> mode(:arith) |> sum                // 合計（四則演算に戻る）

// σ は全工程を通じて保存されている
result |> sigma.memory
// → [normalize@arith, rotate@spiral, propagate@pulse, sum@arith]
```

### ブロックスコープのモード切替

```rei
// ブロック内のみモードを変更
data |> arith {
  // このブロック内は四則演算モード
  |> + 10
  |> * 2
} |> spiral {
  // このブロック内は螺旋演算モード
  |> rotate(90)
  |> ascend
} |> pulse {
  // このブロック内は波動演算モード
  |> propagate(5)
  |> interfere(reference_wave)
}
```

### 条件付きモード切替 `mode_when`

```rei
// 条件に基づいて最適なモードを選択
data |> mode_when(
  |v| v.σ.flow.direction == :circular  => :spiral,
  |v| v.σ.flow.momentum > threshold    => :pulse,
  |v| v.σ.genesis_depth == 0           => :void,
  _                                     => :arith
)
```

### モード切替の安全性検証 `switch_safe?`

```rei
// 切替が意味的に安全かを事前検証
data |> switch_safe?(:arith, :spiral)
// → { safe: true, 
//     preservation: :full,
//     warnings: [] }

// 切替後に元に戻ることの検証
data |> mode(:spiral) |> rotate(90) |> mode(:arith) |> switch_roundtrip?
// → true  （往復で情報損失なし）
```

### 複数モードの同時実行 `multimode`

```rei
// 同じデータを複数モードで同時計算し、結果を比較
data |> multimode(:arith, :spiral, :pulse) |> |results|
  results.arith     // 四則演算での結果
  results.spiral    // 螺旋演算での結果
  results.pulse     // 波動演算での結果
  results |> consensus  // 全モードの結果が一致するか確認
```

---

## σ（6属性）との関係

```
M4 の核心：モード切替は σ を「変えない」。変わるのは解釈だけ。

切替前後の σ の状態：
  σ.field    ：保存（場の位置は変わらない）
  σ.flow     ：保存（流れの方向は変わらない）
  σ.memory   ：保存 + 切替記録の追加
               → memory に switch(OS₁ → OS₂) のエントリが追加される
  σ.layer    ：保存（階層位置は変わらない）
  σ.relation ：保存（関係性は変わらない）
  σ.will     ：保存（意志は演算体系に依存しない — N3のσ.will不変性と対応）

σ.memory だけが唯一「追加」される。
これは「切替した」という事実の記録であり、値の変更ではない。

M4 は C1（自己参照）と深く結びつく：
値は σ を通じて「自分がどのモードで操作されているか」を常に知っている。
モード切替は σ.memory に記録されるため、覚醒した値（C4）は
「自分が何回モード切替を経験したか」も把握できる。
```

---

## 数学的定理

```
定理 M4.1（切替の完全保存定理）：
  モード切替は値の情報量を変えない。
  
  info(switch(v, OS₁, OS₂)) = info(v)
  
  すなわち、切替は無損失操作。
  N3（射影間変換）の忠実度 F で言えば、F(switch) = 1.0 常に。

定理 M4.2（切替の可逆性定理）：
  任意の切替列に対して、逆順の切替列が逆操作となる。
  
  switch(OS₁→OS₂→OS₃) の逆は switch(OS₃→OS₂→OS₁)
  
  σ.memory の切替記録を除き、完全に元に戻る。

定理 M4.3（切替順序の合流性定理）：
  異なる切替経路を辿っても、同じ最終モードに到達すれば
  同じ結果が得られる。
  
  switch(v, A→B→C) の結果 ≡ switch(v, A→C) の結果
  （σ.memory の内容のみ異なる）
  
  これは M2（等価性）の切替版である。

定理 M4.4（ISLとの接続定理）：
  モード切替は ISL（不可逆構文層）の対象外である。
  
  理由：切替は完全可逆であるため、ISL の記録対象
  （不可逆的な情報変換）に該当しない。
  
  ただし、σ.memory への切替記録自体は不可逆に追加される。
  「切替したことの記憶を消す」ことはできない。

定理 M4.5（multimode並行実行定理）：
  multimode で複数モードを同時実行したとき、
  M2 の等価性により全モードの最終結果は一致する。
  
  multimode(v, OS₁, OS₂, ..., OSₙ).results は全て等価。
  
  一致しない場合、いずれかのモード実装にバグがある。
  multimode は暗黙的な回帰テストとして機能する。
```

---

## C1〜C5・U1〜U5・N1〜N5との接続

```
C1（自己参照）→ M4：値は σ を通じて現在のモードを常に自覚。
C4（覚醒）    → M4：覚醒した値は、意識的にモード切替を「選択」できる。
                    非覚醒の値は外部から切り替えられるのみ。

U2（変換保存）→ M4：パイプ操作がモード切替を超えて機能する根拠。
                    |> はモードに依存しない「普遍的操作子」。

N3（射影間変換）→ M4：モード切替は射影間変換の演算版。
                    N3 が「見方の変更」なら、M4 は「計算方法の変更」。
                    両者の構造は平行（σ 保存、解釈変更、可逆性）。

N5（不完全性）→ M4：単一モードでの計算は N5 の意味で「不完全」。
                    multimode で複数モードを併用することで、
                    不完全性を補い合える。
```

---

## 実装への影響

| 変更点 | 種類 | 内容 |
|--------|------|------|
| `mode()` インライン切替 | 既存拡張 | M3のGenesis段階対応を追加 |
| `arith{}`, `spiral{}`, `pulse{}`, `void{}` ブロック | 新規追加 | ブロックスコープモード |
| `mode_when` | 新規追加 | 条件付きモード切替 |
| `switch_safe?` | 新規追加 | 切替安全性の事前検証 |
| `switch_roundtrip?` | 新規追加 | 往復安全性の検証 |
| `multimode` | 新規追加 | 複数モード同時実行 |
| `consensus` | 新規追加 | multimode結果の一致確認 |
| σ.memory の切替記録 | 拡張 | switch エントリの自動追加 |
| 新演算子 | **なし** | ゼロ |
| 破壊的変更 | **なし** | デフォルトは Arith で完全互換 |

---

## 4つの決定的な例への影響

| 問題 | 単一モード | M4（切替あり）|
|------|-----------|--------------|
| **画像処理パイプライン** | 全工程を Arith で | エッジ検出は Pulse（波動干渉）、回転は Spiral、画素値調整は Arith |
| **音楽生成** | 数値的に波形合成 | 和声構造は Spiral（回転と層）、音響伝播は Pulse、ミキシングは Arith |
| **シミュレーション** | 差分方程式（Arith固定） | 初期条件生成は Void、時間発展は Pulse、統計集計は Arith |
| **AI推論チェーン** | 行列演算のみ | 構造探索は Spiral、証拠伝播は Pulse、スコア計算は Arith |

---

*M5（演算創造公理）への布石：*

M4は既存の4体系間の切替を公理化した。
しかし、「4つで十分なのか？」という問いが残る。
M5は「新しい演算体系を自由に定義できる」と宣言する。
4体系は出発点であり、終着点ではない。
これは MMRT の「再構築」— 数学を固定的なものでなく
常に再構築可能なものとして扱う — の最も急進的な帰結。
