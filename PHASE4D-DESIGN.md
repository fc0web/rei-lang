# Phase 4d: 安定化＋外部証明 — Stabilization & External Proof

**Date:** 2026-02-14
**Author:** Nobuki Fujimoto
**Status:** In Progress

---

## 目的

Phase 4a〜4c + sigma-deep統合で、Reiの内部基盤は一通り揃った。
6属性（場・流れ・記憶・層・関係・意志）がすべて深化済み、877テスト全パス。

Phase 4dの目的は**「外部の人間がReiの価値を自分の手で確認できる状態」**を作ること。

これは新機能の追加ではなく、既存の強みを**追試可能・説明可能・使用可能**にする作業である。

---

## 現状の問題

1. **READMEが内部者向け** — 機能リストが長大だが「Reiとは何か」が3行でわからない
2. **ベンチマークが検証不能** — 「4× code reduction」と書いてあるが、再現手順がない
3. **キラー例が疑似コード** — `docs/rei-killer-examples.md` は「現在のインタプリタで全て動くわけではない」と明記
4. **チュートリアルがない** — 初めてReiに触る人が15分で動かせるガイドがない
5. **テストバッジが古い** — 799のまま（実際は877）
6. **v1.0への道筋が不明** — APIの安定性コミットメントがない

---

## 成果物

### ① README全面刷新
- 3行でReiとは何かを伝える
- 「Why Rei?」セクション（他言語との明確な違い）
- 実際に動くベンチマークへのリンク
- テストバッジ更新（877）
- 不要な詳細はサブドキュメントへ移動

### ② Runnable Benchmark Suite (`benchmarks/`)
実際にRei REPLで実行でき、等価なPython/JSコードと比較できるベンチマーク。

| # | ベンチマーク | Reiの強み |
|---|------------|----------|
| 1 | 画像カーネル計算（中心-周囲パターン） | 𝕄 + compute |
| 2 | グラフ構造変換 | bind + trace |
| 3 | 多次元データ集約 | 𝕄 + pipe |
| 4 | 自律エージェント協調 | spawn + mediate |
| 5 | 6属性メタデータ追跡 | sigma-deep |
| 6 | 構造の縁起的追跡 | trace + influence + entangle |
| 7 | 意志ベース計算 | will_evolve + will_align |

各ベンチマークは:
- `benchmarks/NN-name.rei` — Reiコード（実際に動く）
- `benchmarks/NN-name.py` — 等価Python（比較用）
- `benchmarks/NN-name.md` — 解説（行数比較、構造の違い）

### ③ Getting Started チュートリアル (`docs/TUTORIAL.md`)
- 前提: Node.js 18+
- 5分: インストール〜REPL起動〜基本演算
- 10分: 𝕄の定義〜パイプ〜compress関数
- 15分: genesis〜sigma〜6属性体験
- ゴール: 「Reiが従来の言語と何が違うか」を体感

### ④ v1.0 ロードマップ (`docs/ROADMAP-v1.md`)
- v0.5.x: Phase 4d（安定化、現在）
- v0.6.0: API凍結候補（破壊的変更の最終リスト）
- v0.7.0: ドキュメント完備
- v1.0.0: 安定版リリース

### ⑤ API安定性ドキュメント (`docs/API-STABILITY.md`)
- Stable（変更しない）: rei(), rei.reset(), Lexer, Parser, Evaluator
- Provisional（微調整あり）: sigma-deep, relation/will commands
- Experimental: 空/diffuse 構文（未実装部分）

---

## 優先順位

1. **README刷新** — 最も多くの人が最初に見るもの
2. **ベンチマーク** — 「74% code reduction」の証拠
3. **チュートリアル** — 「動かしてみたい」に応える
4. **ロードマップ + API安定性** — 「使って大丈夫か」に応える

---

## 成功基準

Phase 4dが完了した状態とは:

> 初めてReiのGitHubを訪れた開発者が、READMEを読み、
> 15分以内にReiを動かし、ベンチマークを自分で確認し、
> 「この言語には独自の価値がある」と判断できる状態。
