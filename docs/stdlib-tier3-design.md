# Rei (0₀式) 標準ライブラリ設計書 — Tier 3

**Author:** Nobuki Fujimoto  
**Version:** 0.1.0  
**Date:** 2026-02-10  
**Scope:** 4モジュール — `sequence`, `music`, `stego`, `oracle`

---

## 概要

Tier 1（field, symmetry, unified）= 静的基盤  
Tier 2（network, chrono, transform, holograph）= 動的操作  
**Tier 3（sequence, music, stego, oracle）= Reiならではの独自性領域**

Tier 3 は他言語に類例のない「D-FUMTの哲学が直接プリミティブになる」モジュール群である。

| # | モジュール | D-FUMT理論 | 核心 |
|---|-----------|-----------|------|
| 8 | `sequence` | 情報系列ネットワーク理論(ISNT) | 情報の連鎖・伝播・減衰・共鳴 |
| 9 | `music` | USFT + 音楽数理統一理論(UMTM) | 音楽構造の代数的操作 |
| 10 | `stego` | 文字内情報埋込理論 | 情報の隠蔽・検出・容量分析 |
| 11 | `oracle` | 四価0π理論(#21)接続 | 確率的占卜・陰陽論理モデル |

---

## Tier間の接続マップ

```
Tier 1 (静的基盤)          Tier 2 (動的操作)          Tier 3 (独自領域)
┌──────────┐             ┌──────────┐             ┌──────────┐
│  field   │─gradient──→│ network  │─propagate─→│ sequence │
│  symmetry│─detect───→│ transform│─layer─────→│  music   │
│  unified │─from─────→│  chrono  │─forecast──→│  oracle  │
│          │            │holograph │─encode────→│  stego   │
└──────────┘             └──────────┘             └──────────┘

cross-tier connections:
  field.gradient()     → sequence.propagate() の伝播場
  symmetry.detect()    → music.detectSymmetry() 音楽の対称性
  network.pagerank()   → sequence.influence() ノード影響力
  chrono.forecast()    → oracle.predict() 時系列→占卜
  transform.chain()    → stego.embed() 変換チェーンとしての埋込
  holograph.encode()   → stego.encode() 情報の圧縮隠蔽
```

---

## §1. sequence モジュール — 情報系列ネットワーク理論(ISNT)

### 1.1 設計思想

ISNTは「情報がネットワーク上でどう伝播し、変容し、減衰し、共鳴するか」を記述する理論。
network モジュールが「静的なグラフ構造」を扱うのに対し、
sequence は「グラフ上を流れる情報のダイナミクス」を扱う。

Reiの中心-周囲パターンとの関係:
- 中心(center) = 情報の発信源
- 周囲(neighbors) = 伝播先
- 伝播 = center→neighbor→neighbor→... の連鎖

### 1.2 核心的概念

| 概念 | 数学的表現 | 意味 |
|------|-----------|------|
| 信号(Signal) | s(t) ∈ ℝ | 時刻tにおける情報の値 |
| 伝播(Propagation) | P: V×V → [0,1] | ノード間の伝播確率 |
| 減衰(Attenuation) | α ∈ (0,1) | 伝播ごとの情報減衰率 |
| 共鳴(Resonance) | R(f₁,f₂) | 二つの信号が強め合う条件 |
| カスケード(Cascade) | C(v,t) | ノードvが時刻tまでに感染する確率 |
| 影響力(Influence) | I(v) = Σ C(v,t) | ノードvの総影響力 |

### 1.3 Rei構文イメージ

```rei
import sequence

// 情報系列の作成
let sig = sequence.signal([1.0, 0.8, 0.6, 0.3, 0.1])

// グラフ上の伝播シミュレーション
let result = sig | propagate graph alpha=0.7

// 共鳴検出
let resonance = sequence.resonate(sig1, sig2)

// カスケード（情報の連鎖拡散）
let cascade = sequence.cascade(graph, seed=[0], steps=10)

// 影響力ランキング
let ranking = cascade | influence | sort :desc
```

### 1.4 API 設計

```typescript
// 信号の作成と操作
createSignal(values: number[]): Signal
impulse(length: number, position?: number): Signal
step(length: number, position?: number): Signal

// 伝播
propagate(signal: Signal, graph: AdjMatrix, alpha?: number): Signal[]
cascade(graph: AdjMatrix, seeds: number[], steps: number, alpha?: number): CascadeResult
influence(cascade: CascadeResult): number[]

// 共鳴と相関
resonate(a: Signal, b: Signal): number
crossCorrelate(a: Signal, b: Signal): number[]
autoCorrelate(signal: Signal): number[]

// 系列変換
convolve(signal: Signal, kernel: number[]): Signal
delay(signal: Signal, steps: number): Signal
attenuate(signal: Signal, alpha: number): Signal
amplify(signal: Signal, factor: number): Signal

// 情報理論的指標
entropy(signal: Signal): number
mutualInformation(a: Signal, b: Signal): number
transferEntropy(source: Signal, target: Signal, lag?: number): number
```

---

## §2. music モジュール — USFT + 音楽数理統一理論(UMTM)

### 2.1 設計思想

USFTの核心: (音の層集合, ⊕) はアーベル群（可換的重畳）
UMTMの拡張: 旋律・和声・リズムを統合する代数構造

Reiの中心-周囲パターンとの関係:
- 中心(center) = 根音(root)
- 周囲(neighbors) = 倍音・和音構成音・リズムパターン
- 圧縮(compress) = 楽曲→モチーフ→音程列→数列

### 2.2 核心的概念

| 概念 | 数学的表現 | 意味 |
|------|-----------|------|
| 音高(Pitch) | p ∈ ℤ (MIDI) | 半音単位の音高 |
| 音程(Interval) | Δp ∈ ℤ | 二音間の半音差 |
| 和音(Chord) | C ⊂ ℤ | 音高の集合 |
| 音階(Scale) | S ⊆ ℤ₁₂ | mod 12 の音高クラス集合 |
| リズム(Rhythm) | r ∈ ℚⁿ | 有理数位置列（定理9.3） |
| 層(Layer) | ◫ˢ | USFT 10基本層クラス |
| 重畳(Superpose) | ⊕ˢ | アーベル群の加法（可換） |

### 2.3 Rei構文イメージ

```rei
import music

// 音高・音程
let a4 = music.pitch(69)  // MIDI 69 = A4
let fifth = music.interval(7)  // 完全五度 = 7半音

// 和音の構築（中心-周囲パターン）
let cmaj = music.chord([60, 64, 67])  // C, E, G
let quality = cmaj | analyze  // → "major"

// 音階
let major = music.scale(:major, root=60)

// リズム（定理9.3: 有理数位置）
let rhythm = music.rhythm([1/4, 1/4, 1/8, 1/8, 1/4])
rhythm | verify :rational  // → true

// USFT 層分解
let layers = a4 | decompose :usft
let harmonic = layers | layer :harmonic

// 和音進行
let prog = music.progression([cmaj, fmaj, gmaj, cmaj])
prog | romanNumerals  // → ["I", "IV", "V", "I"]

// 転回・移調
cmaj | invert 1      // → 第1転回形
cmaj | transpose 7   // → G major
```

### 2.4 API 設計

```typescript
// 基本構造
pitch(midi: number): Pitch
interval(semitones: number): Interval
chord(pitches: number[]): Chord
scale(root: number, mode: ScaleMode): Scale
rhythm(durations: number[], bpm?: number): Rhythm

// 和音分析
analyzeChord(chord: Chord): ChordQuality
detectKey(pitches: number[]): { key: number; mode: ScaleMode }
romanNumerals(progression: Chord[], key: number): string[]

// 音程操作
transpose(chord: Chord, semitones: number): Chord
invert(chord: Chord, n?: number): Chord
retrograde(pitches: number[]): number[]

// USFT 層操作
decomposeLayers(pitches: number[]): USFTLayers
superpose(a: USFTLayers, b: USFTLayers): USFTLayers
extractLayer(layers: USFTLayers, type: LayerType): number[]

// リズム操作（定理9.3）
isRational(rhythm: Rhythm): boolean
quantize(rhythm: Rhythm, grid: number): Rhythm
polyrhythm(a: Rhythm, b: Rhythm): Rhythm

// 圧縮率（定理9.4: κ_s）
compressionRatio(pitches: number[]): number

// 対称性検出
detectSymmetry(pitches: number[]): MusicalSymmetry
```

---

## §3. stego モジュール — 文字内情報埋込理論

### 3.1 設計思想

ステガノグラフィは「情報の中に情報を隠す」技術。
D-FUMTの文脈では「見えない次元に情報を埋め込む」ことと同義。
Reiの多次元数の「見えない近傍値」がまさにこの思想を体現する。

Reiの中心-周囲パターンとの関係:
- 中心(center) = 表面的に見える情報（カバーデータ）
- 周囲(neighbors) = 隠された情報（ペイロード）
- 拡張(△) = 情報の埋込（次元を増やして隠す）
- 縮約(▽) = 情報の抽出（次元を落として表出させる）

### 3.2 核心的概念

| 概念 | 数学的表現 | 意味 |
|------|-----------|------|
| カバー(Cover) | C ∈ ℤⁿ | 運搬媒体データ |
| ペイロード(Payload) | M ∈ {0,1}ᵐ | 隠蔽する秘密データ |
| ステゴ(Stego) | S = Embed(C, M) | 埋込後のデータ |
| 容量(Capacity) | κ = m/n | ビット/要素の比率 |
| 検出性(Detectability) | D(C, S) | カバーとステゴの統計的差異 |
| 堅牢性(Robustness) | R(S, attack) | 攻撃耐性 |

### 3.3 Rei構文イメージ

```rei
import stego

// テキストステガノグラフィ
let cover = "Hello World"
let secret = "Hi"
let stego = stego.embedText(cover, secret, method=:zwc)
stego | extractText :zwc  // → "Hi"

// 数値ステガノグラフィ（LSB）
let data = [100, 200, 150, 180, 220]
let hidden = stego.embedLSB(data, [1, 0, 1, 1])
hidden | extractLSB 4     // → [1, 0, 1, 1]

// 容量分析
data | stego.capacity :lsb   // → 5ビット
data | stego.capacity :spread // → 2ビット

// 検出性テスト
stego.detectability(data, hidden)  // → 0.02（低=安全）
```

### 3.4 API 設計

```typescript
// テキストステガノグラフィ
embedText(cover: string, secret: string, method?: TextMethod): string
extractText(stego: string, method?: TextMethod): string

// 数値ステガノグラフィ（LSB）
embedLSB(cover: number[], bits: number[], depth?: number): number[]
extractLSB(stego: number[], bitCount: number, depth?: number): number[]

// スペクトラム拡散
embedSpread(cover: number[], bits: number[], key: number[]): number[]
extractSpread(stego: number[], bitCount: number, key: number[]): number[]

// 容量と品質
capacity(cover: number[] | string, method: StegoMethod): number
detectability(cover: number[], stego: number[]): number
psnr(original: number[], modified: number[]): number

// 堅牢性テスト
robustness(stego: number[], attack: AttackType): number

// Rei固有: 多次元数ステガノグラフィ
embedMultiDim(center: number, neighbors: number[], secret: number[]): MultiDimStego
extractMultiDim(stego: MultiDimStego): number[]
```

---

## §4. oracle モジュール — 四価0π理論接続・確率的占卜モデル

### 4.1 設計思想

oracleモジュールはD-FUMTの四価0π理論(#21)を実装する。
「占い」は確率的プロセスだが、D-FUMTの文脈では
「四価論理（0, π, 0ₒ, πₒ）による非二値的意思決定」を意味する。

四価0π理論:
- 0 = 静的原点（無/未定）
- π = 回転・反転（変化/転換）
- 0ₒ = 深度を持つゼロ（潜在/内包）
- πₒ = 回転＋深度（変容/超越）

陰陽との対応:
- 陰(yin) ↔ 0（静/受容）
- 陽(yang) ↔ π（動/発散）
- 陰中の陽 ↔ 0ₒ（静の中の動）
- 陽中の陰 ↔ πₒ（動の中の静）

### 4.2 核心的概念

| 概念 | 数学的表現 | 意味 |
|------|-----------|------|
| 四価状態 | Q ∈ {0, π, 0ₒ, πₒ} | 四つの根本状態 |
| 爻(こう) | y ∈ {6,7,8,9} | 易の爻（老陰/少陽/少陰/老陽） |
| 卦(か) | K = (y₁,...,y₆) | 6爻の組 = 64卦 |
| 遷移確率 | T: Q×Q → [0,1] | 状態間の遷移行列 |
| エントロピー的運勢 | H(K) | 卦のエントロピー = 変化の可能性 |
| 共時性(Synchronicity) | S(e₁,e₂) | 二事象の意味的相関 |

### 4.3 Rei構文イメージ

```rei
import oracle

// 四価状態の生成
let state = oracle.fourValue()  // → 0 | π | 0ₒ | πₒ

// 易占（筮竹法シミュレーション）
let hexagram = oracle.iching()
hexagram | interpret  // → { number: 1, name: "乾", meaning: "..." }

// 四価論理演算
oracle.and4(0, π)    // → 0ₒ（四価AND）
oracle.or4(0ₒ, πₒ)  // → π（四価OR）

// 遷移行列による運勢推移
let trajectory = oracle.trajectory(initial=0, steps=12)

// エントロピー分析
hexagram | entropy    // → 変化の度合い

// 共時性スコア
oracle.synchronicity(event1, event2)
```

### 4.4 API 設計

```typescript
// 四価状態
type FourValue = 0 | 1 | 2 | 3;  // 0=0, 1=π, 2=0ₒ, 3=πₒ
fourValue(): FourValue
fourValueName(v: FourValue): string

// 四価論理演算
and4(a: FourValue, b: FourValue): FourValue
or4(a: FourValue, b: FourValue): FourValue
not4(a: FourValue): FourValue
implies4(a: FourValue, b: FourValue): FourValue

// 易経モデル
castYao(): Yao                    // 一爻を投じる
castHexagram(seed?: number): Hexagram  // 六爻を投じる
interpret(hex: Hexagram): Interpretation
changingLines(hex: Hexagram): number[]  // 変爻
relatedHexagram(hex: Hexagram): Hexagram  // 之卦

// 遷移と軌跡
transitionMatrix(): number[][]
trajectory(initial: FourValue, steps: number, seed?: number): FourValue[]
stationaryDistribution(): number[]

// エントロピー・分析
hexagramEntropy(hex: Hexagram): number
yinYangBalance(hex: Hexagram): { yin: number; yang: number; ratio: number }
trigramDecompose(hex: Hexagram): { upper: Trigram; lower: Trigram }

// 共時性
synchronicity(events: number[], context: number[]): number
```

---

## Tier 1 + Tier 2 + Tier 3 統合エクスポート

```typescript
// src/stdlib/index.ts

// Tier 1 — 静的基盤
export * as field from './field';
export * as symmetry from './symmetry';
export * as unified from './unified';

// Tier 2 — 動的操作
export * as network from './network';
export * as chrono from './chrono';
export * as transform from './transform';
export * as holograph from './holograph';

// Tier 3 — 独自領域
export * as sequence from './sequence';
export * as music from './music';
export * as stego from './stego';
export * as oracle from './oracle';
```

---

## NOTICE 追記案（#26〜#29）

```
#26 — sequence module (情報系列ネットワーク理論 ISNT)
  signal propagation, cascade, influence, transfer entropy
  Author: Nobuki Fujimoto
  Theory: 情報系列ネットワーク理論 (D-FUMT)
  License: MIT

#27 — music module (USFT + 音楽数理統一理論 UMTM)
  chord analysis, USFT layer decomposition, rhythm rationality,
  musical symmetry, compression ratio κ_s
  Author: Nobuki Fujimoto
  Theory: Universal Sound Formula Theory / 音楽数理統一理論 (D-FUMT)
  License: MIT

#28 — stego module (文字内情報埋込理論)
  text/numeric steganography, LSB embedding, spread spectrum,
  capacity analysis, multi-dimensional steganography
  Author: Nobuki Fujimoto
  Theory: 文字内情報埋込理論 (D-FUMT)
  License: MIT

#29 — oracle module (四価0π理論接続)
  four-value logic (0/π/0ₒ/πₒ), I Ching hexagram model,
  transition dynamics, entropy analysis, synchronicity
  Author: Nobuki Fujimoto
  Theory: 四価0π理論 / 陰陽術統合 (D-FUMT)
  License: MIT
```
