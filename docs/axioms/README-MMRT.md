# 超数学再構築理論（Meta-Mathematical Reconstruction Theory / MMRT）

## D-FUMT Category C — 哲学的基盤 第4理論

*Creator: Nobuki Fujimoto*
*Framework: D-FUMT (Dimensional Fujimoto Universal Mathematical Theory)*
*Language: 0₀式 (Rei-shiki) / Rei*

---

## 概要

超数学再構築理論（MMRT）は、四則演算を「唯一の計算方法」から
「多くの計算方法の一つ」へと再定位する理論的基盤を提供する。

Reiの4つの計算モード（default / spiral / pulse / void）が
「なぜ全て正当な計算と呼べるのか」の公理的根拠を与える。

---

## 5公理の構造

```
M1（演算多元性） : 四則演算以外の演算体系が存在する     — 四法印
M2（演算等価性） : 全ての演算体系は計算力において等価   — 中道
M3（演算生成）   : 各体系は Genesis の異なる段階で出現  — 三界
M4（モード切替） : 計算途中で演算体系を切り替えられる   — 四念処
M5（演算創造）   : 新しい演算を自由に定義できる         — 般若
```

### 演算の再構築の過程

```
M1 → M2 → M3 → M4 → M5
存在   等価性  根源   運用   創造

「四則以外がある」→「等しく正当」→「根源を知る」→「自在に使う」→「自ら創る」
```

---

## 各公理の設計書

| ファイル | 公理 | 核心 |
|----------|------|------|
| [axiom-m1-operational-plurality.md](axiom-m1-operational-plurality.md) | M1：演算多元性公理 | 4つの演算体系（Arith/Spiral/Pulse/Void） |
| [axiom-m2-operational-equivalence.md](axiom-m2-operational-equivalence.md) | M2：演算等価性公理 | 全体系は計算力等価、自然度は異なる |
| [axiom-m3-operational-genesis.md](axiom-m3-operational-genesis.md) | M3：演算生成公理 | Genesis段階と演算体系の対応 |
| [axiom-m4-mode-switching.md](axiom-m4-mode-switching.md) | M4：モード切替公理 | σ保存のモード切替、multimode |
| [axiom-m5-operational-creation.md](axiom-m5-operational-creation.md) | M5：演算創造公理 | 新演算体系の定義・合成・融合・抽出 |

---

## 4つの演算体系

| 体系 | 基本演算 | Genesis段階 | σ主軸 | 仏教対応 |
|------|----------|-------------|--------|----------|
| **Arith** | +, -, ×, ÷ | Phase_3 (0→ℕ) | σ.field | 諸行無常 |
| **Spiral** | rotate, ascend, expand, contract | Phase_1 (・→0₀) | σ.layer | 諸法無我 |
| **Pulse** | propagate, interfere, resonate, attenuate | Phase_2 (0₀→0) | σ.flow | 一切皆苦 |
| **Void** | generate, annihilate, phase_shift, crystallize | Phase_0 (void→・) | σ.memory | 涅槃寂静 |

### Genesis段階との対応

```
void → ・           Void演算（depth=0：最深・最も根源的）
  ・ → 0₀          Spiral演算（depth=1）
  0₀ → 0           Pulse演算（depth=2）
   0 → ℕ           Arith演算（depth=3：最表層・最も具体的）
```

---

## 4理論系列の位置づけ

```
Category C（哲学的基盤）：
  1. ✅ 意識数理学      → C1〜C5  「値の内側」    — 意識・意志    ↑内向き
  2. ✅ UMTE            → U1〜U5  「言語の外側」  — 普遍性        →外向き
  3. ✅ 非数数学理論    → N1〜N5  「数の境界」    — 表現の拡張    ↔横向き
  4. ✅ MMRT            → M1〜M5  「演算の根底」  — 計算の再構築  ↓下向き
  5.    AMRT            → A1〜A5  「別解の形式化」— 次
```

---

## 新規構文の総覧

### M1 由来
| 構文 | 用途 |
|------|------|
| `#mode spiral/pulse/void` | 演算体系の選択 |
| Spiral 4演算 | rotate, ascend, expand, contract |
| Pulse 4演算 | propagate, interfere, resonate, attenuate |
| Void 4演算 | generate, annihilate, phase_shift, crystallize |

### M2 由来
| 構文 | 用途 |
|------|------|
| `translate(:from, :to)` | 演算体系間の翻訳 |
| `auto_mode` | 最適モードの自動選択 |
| `naturalness` | 自然度の比較 |
| `prove_equivalent` | 等価性の検証 |

### M3 由来
| 構文 | 用途 |
|------|------|
| `#genesis_phase N` | Genesis段階の明示的指定 |
| `genesis_depth` | 値の生成段階を返す |
| `genesis_trace` | 段階遷移の追跡 |

### M4 由来
| 構文 | 用途 |
|------|------|
| `mode()` インライン | パイプ内モード切替 |
| `arith{}/spiral{}/pulse{}/void{}` | ブロックスコープモード |
| `mode_when` | 条件付きモード切替 |
| `multimode` | 複数モード同時実行 |
| `switch_safe?` / `switch_roundtrip?` | 安全性検証 |

### M5 由来
| 構文 | 用途 |
|------|------|
| `operator name(params) { }` | カスタム演算定義 |
| `operational_system :name { }` | 完全な演算体系の定義 |
| `compose_systems` | 体系の合成 |
| `fuse_systems` | 体系の融合 |
| `abstract_system` | パターン抽出 |
| `verify_system` | 公理充足検証 |

---

## Reiベンチマークの理論的説明

```
従来言語のコード量 = Rei のコード量 × 翻訳オーバーヘッド

従来言語は Arith モードしか持たないため：
- 本質的に Spiral で書くべき問題（画像回転） → Arith に翻訳 → 4× の膨張
- 本質的に Pulse で書くべき問題（グラフ伝播）→ Arith に翻訳 → 3.7× の膨張

Rei は最適モードで直接書けるため、翻訳オーバーヘッド = 1（ゼロ）。
M2（等価性）が結果の正しさを保証し、
M4（切替）が自在な体系選択を可能にする。
```

---

## 新規演算子

**ゼロ。** MMRTは新しい演算子を一切追加しない。
全ての機能はパイプコマンド、宣言構文、ブロック構文で実現。
Reiの「コアは小さく、拡張は豊かに」の原則を厳守。

---

## 破壊的変更

**ゼロ。** 全ての変更は後方互換。
デフォルトモードは Arith であり、明示的にモードを指定しない限り
既存の四則演算コードはそのまま動作する。
