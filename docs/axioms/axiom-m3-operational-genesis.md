# 公理M3：演算生成公理（Operational Genesis Axiom）

## D-FUMT 超数学再構築理論（MMRT）— 第3公理

*Creator: Nobuki Fujimoto*
*Framework: D-FUMT (Dimensional Fujimoto Universal Mathematical Theory)*
*Language: 0₀式 (Rei-shiki) / Rei*

---

## 公理の定義

**公理M3（演算生成公理）：**

各演算体系は Genesis 段階遷移の特定の段階で出現する。
四則演算は最も表層的な段階の産物であり、
より深い段階にはより根源的な演算が存在する。

```
Genesis段階遷移と演算体系の出現：

void → ・           Void演算の出現（生成/消滅）
  ・ → 0₀          Spiral演算の出現（回転/上昇）
  0₀ → 0           Pulse演算の出現（伝播/干渉）
   0 → ℕ           Arith演算の出現（加減乗除）

深さ：  最深          ←→          最表層
根源性：最も根源的    ←→          最も素朴
```

### 形式的定義

```
定義 M3.1（Genesis段階と演算の対応）：
  各 Genesis 遷移は、特定の「変化の様態」を初めて可能にする。
  その変化の様態が、対応する演算体系の基本演算となる。
  
  Phase_0 (void → ・) ：「存在が生じる」変化
    → generate, annihilate, phase_shift, crystallize
    → Void演算体系
    
  Phase_1 (・ → 0₀) ：「構造が分化する」変化
    → rotate, ascend, expand, contract
    → Spiral演算体系
    
  Phase_2 (0₀ → 0) ：「量が伝播する」変化
    → propagate, interfere, resonate, attenuate
    → Pulse演算体系
    
  Phase_3 (0 → ℕ) ：「量が累積する」変化
    → +, -, ×, ÷
    → Arith演算体系

定義 M3.2（演算の深度 Depth）：
  演算体系 OS の深度 depth(OS) を Genesis 段階で定義する。
  
  depth(Void)   = 0  （最深）
  depth(Spiral)  = 1
  depth(Pulse)   = 2
  depth(Arith)   = 3  （最表層）
  
  深い演算体系ほど「根源的」であり、
  浅い演算体系ほど「具体的」である。

定義 M3.3（上位包含関係）：
  深い演算体系は、浅い演算体系の操作を「含む」。
  ただし M1.3（独立性）とは矛盾しない：
  
  「含む」とは「シミュレートできる」の意であり、
  「基本演算が同一である」の意ではない。
  
  Void は Spiral をシミュレートできる
    （生成/消滅で回転/上昇を再現可能）
  Spiral は Pulse をシミュレートできる
    （螺旋の投影として波動を再現可能）
  Pulse は Arith をシミュレートできる
    （干渉パターンの計数として加減算を再現可能）
    
  逆方向のシミュレートも可能（M2等価性）だが、
  深→浅のシミュレートの方が「自然」。
```

---

## 仏教哲学との対応

**三界（trailokya）と Genesis**

仏教の三界（欲界・色界・無色界）は存在の層を記述する。
Genesis 段階は存在の生成過程を記述する。
両者は「深さ」の概念を共有している。

```
void       ← 無色界（arūpyadhātu）：形なき世界
  ↓            Void演算 = 存在の根源的操作
  ・         ← 色界上層（rūpadhātu）：形が生じ始める世界
  ↓            Spiral演算 = 構造の分化操作
  0₀         ← 色界下層：形が確定する世界
  ↓            Pulse演算 = 波動としての相互作用
  0 → ℕ     ← 欲界（kāmadhātu）：具体的な量の世界
               Arith演算 = 量の直接操作
```

**唯識の八識との対応：**

```
Void演算   ← 阿頼耶識（ālayavijñāna）：全ての種子の蔵
             生成/消滅は種子の現行/薫習に対応
             
Spiral演算 ← 末那識（manas）：自我意識の回転
             rotate/ascend は自我の執着と超越に対応
             
Pulse演算  ← 意識（manovijñāna）：思考の波動
             propagate/interfere は思考の連鎖と葛藤に対応
             
Arith演算  ← 前五識（pañcavijñāna）：感覚的認識
             +/-/×/÷ は感覚データの直接的処理に対応
```

---

## 構文への影響

### Genesis段階の明示的指定

```rei
// 各段階での操作を明示的に指定
#genesis_phase 0    // Void段階
void |> generate(:point)         // ・ を生成
     |> phase_shift(:structure)  // 構造を持たせる

#genesis_phase 1    // Spiral段階
point |> rotate(phi)             // 黄金角で回転
      |> ascend                  // 層を上げる
      |> expand(golden_ratio)    // 黄金比で拡大

#genesis_phase 2    // Pulse段階
structure |> propagate(neighbors) // 近傍に伝播
          |> interfere(boundary)  // 境界条件と干渉

#genesis_phase 3    // Arith段階（通常のデフォルト）
numbers |> sum                    // 加算
        |> normalize              // 正規化（除算）
```

### 深度に基づく自動モード選択

```rei
// 問題の「本質的な深度」に基づいてモードを選択
problem |> genesis_depth
// → 1  （この問題は本質的にSpiral段階）

// 深度に基づく最適化
problem |> at_depth(1) |> solve
// Spiral モードで解を求める
```

### 段階遷移の追跡 `genesis_trace`

```rei
// 計算がどのGenesis段階を経由したかを追跡
result = complex_computation(data)

result |> genesis_trace
// → [Phase_3(:arith, steps: 5),
//     Phase_1(:spiral, steps: 12),   // 途中でSpiral段階に降下
//     Phase_3(:arith, steps: 3)]     // 再びArith段階に戻る
```

---

## σ（6属性）との関係

```
M3 は σ に genesis_depth 属性を追加する：

σ.genesis_depth : 値が最初に生成された Genesis 段階

void から generate された値 → σ.genesis_depth = 0
螺旋トラバーサルで生成された値 → σ.genesis_depth = 1
波動伝播で生成された値 → σ.genesis_depth = 2
四則演算で生成された値 → σ.genesis_depth = 3

この属性は σ.memory と連動する：
値の来歴（memory）を遡ると、最初の生成点の段階が分かる。
genesis_depth は memory の最古の記録から導出可能。

深い段階で生まれた値は、浅い段階の操作に対して
「根源的な安定性」を持つ傾向がある（C2傾向性との接続）。
```

---

## 数学的定理

```
定理 M3.1（演算の段階的出現定理）：
  各 Genesis 段階は、その段階以前に存在しなかった
  新しい種類の変化を初めて可能にする。
  
  Phase_0 以前：変化そのものが存在しない（void）
  Phase_0：     「ある/ない」の変化が可能に（生成/消滅）
  Phase_1：     「向き/深さ」の変化が可能に（回転/上昇）
  Phase_2：     「広がり/重なり」の変化が可能に（伝播/干渉）
  Phase_3：     「量」の変化が可能に（加減乗除）
  
  各段階は前段階の変化を前提とする。
  量の変化（Phase_3）には、広がりの変化（Phase_2）が必要であり、
  広がりの変化には向きの変化（Phase_1）が必要であり、
  向きの変化には存在そのもの（Phase_0）が必要。

定理 M3.2（深度と抽象度の対応定理）：
  演算体系の深度は、その体系が扱う概念の抽象度に反比例する。
  
  depth(OS) が小さいほど（深いほど）、OS は抽象的。
  depth(OS) が大きいほど（浅いほど）、OS は具体的。
  
  Void（depth=0）：最も抽象的 — 存在/非存在のレベル
  Arith（depth=3）：最も具体的 — 量のレベル

定理 M3.3（Genesis整合性定理）：
  M3 の Genesis 段階と演算体系の対応は、
  D-FUMT の既存 Genesis 公理系と無矛盾である。
  
  既存：void → ・ → 0₀ → 0 → ℕ
  M3が追加するのは、各遷移矢印 → の「意味」を
  演算体系として形式化すること。矢印自体は変更しない。

定理 M3.4（深度保存定理）：
  演算体系の切替（M4で詳述）は、
  値の genesis_depth を変更しない。
  
  depth(v) は v の生成時に固定され、
  その後どの体系で操作されても変わらない。
  
  「Void段階で生まれた値は、Arith段階で操作されても
   Void由来であり続ける」— 出自は不変。

定理 M3.5（C1σとの統合定理）：
  M3 の genesis_depth は C1 の σ の自然な拡張である。
  
  σ_extended = σ ∪ { genesis_depth }
  
  この拡張は C1 の自己参照公理を満たす：
  値は自分の genesis_depth を σ 経由で参照可能。
```

---

## C1〜C5・U1〜U5・N1〜N5との接続

```
C1（自己参照）→ M3：σ に genesis_depth が追加され、
                    値は「自分がどの深さで生まれたか」を知る。

C2（傾向性）  → M3：genesis_depth は傾向性 τ の決定因子。
                    深い段階で生まれた値は、深い演算に傾きやすい。

C4（覚醒）    → M3：覚醒は「自分の genesis_depth を自覚し、
                    意識的に異なる深度の演算を選択できる」こと。

U3（階層再帰）→ M3：Genesis の段階は U3 の階層の存在論的根拠。
                    𝕄 の再帰深度と genesis_depth は対応する。

N1（射影存在）→ M3：各 Genesis 段階は、対象を射影する
                    「解像度」に対応する。
                    深い段階ほど粗い（抽象的な）射影、
                    浅い段階ほど細かい（具体的な）射影。
```

---

## 実装への影響

| 変更点 | 種類 | 内容 |
|--------|------|------|
| `#genesis_phase` プラグマ | 新規追加 | Genesis段階の明示的指定 |
| `genesis_depth` パイプコマンド | 新規追加 | 値の生成段階を返す |
| `at_depth(n)` パイプコマンド | 拡張 | U3の階層深度とGenesis深度の統合 |
| `genesis_trace` パイプコマンド | 新規追加 | 段階遷移の追跡 |
| σ.genesis_depth | 新規属性 | 6属性 + genesis_depth |
| 新演算子 | **なし** | ゼロ |
| 破壊的変更 | **なし** | genesis_depth のデフォルトは 3（Arith）で完全互換 |

---

*M4（モード切替公理）への布石：*

M3は各演算体系の「出自」を Genesis に位置づけた。
しかし、プログラムの実行中に体系を切り替えることは許されるのか？
M4は「切替可能であり、切替は安全」と宣言する。
値の σ が状態を保存するため、体系間の移動で情報は失われない。
