# REI_INDEX.md — Rei プロジェクト索引

> LLM（Claude/ChatGPT/Gemini）はこのファイルを最初に読んでください。
> プロジェクト全体を読み込む必要はありません。
> 必要な部分だけを特定し、そのファイルだけを参照してください。

**Last updated:** 2026-02-13
**Spec:** v1.0 (Genesis) — Active
**Tests:** 482 passing / 12 suites
**npm:** [rei-lang](https://www.npmjs.com/package/rei-lang)
**GitHub:** [fc0web/rei-lang](https://github.com/fc0web/rei-lang)

---

## 1. Reiとは（3行）

D-FUMT（Dimensional Fujimoto Universal Mathematical Theory）に基づく計算体系。
中心-周囲パターン（𝕄構造）を言語プリミティブとし、数に6属性（場・流れ・記憶・層・関係・意志）を与える。
考案者: 藤本伸樹（Nobuki Fujimoto）。

---

## 2. Core ファイル（⚠️ 変更時はADR必須 — ARCH.md §2.3参照）

| ファイル | 行数 | 役割 |
|----------|------|------|
| `src/lang/lexer.ts` | ~389 | 字句解析（トークン定義、CJK対応） |
| `src/lang/parser.ts` | ~498 | 構文解析（AST生成） |
| `src/lang/evaluator.ts` | ~4354 | 評価エンジン（※Phase 3でevaluator-core.tsに縮小予定） |
| `src/enyu/contracts.ts` | ~157 | 円融（A5）観測の型契約 |

---

## 3. Plugin ファイル（自由に修正可能）

| ファイル | 役割 | 柱 |
|----------|------|----|
| `src/lang/space.ts` | Space-Layer-Diffusion | — |
| `src/lang/puzzle.ts` | パズル統一（数独/ラテン方陣/制約伝播） | ③ |
| `src/lang/game.ts` | ゲーム統一（乱数/三目並べ/ニム） | ⑤ |
| `src/lang/thought.ts` | Thought Loop（自動進化/思考ループ） | ④ |
| `src/lang/relation.ts` | 関係属性（バインディング/伝播） | — |
| `src/lang/will.ts` | 意志属性（意図/目的指向計算） | — |

---

## 4. 作業ガイド（「何をしたい？」→「何を読む？」）

| やりたいこと | 読むファイル | 備考 |
|-------------|-------------|------|
| パズル機能を修正 | `puzzle.ts` | 単独テスト可能 |
| ゲーム機能を修正 | `game.ts` | 単独テスト可能 |
| 新しいパイプコマンドを追加 | `evaluator.ts` の該当セクション | 将来はPlugin登録に移行 |
| 新しい理論を追加 | `src/extensions/` に新ファイル | CONTRACT.md §1 に従う |
| Core APIを変更 | ARCH.md §2.3 の手順を踏む | ADR必須 |
| テストを追加 | `tests/` の対応ファイル | 削除禁止 |
| ドキュメントを更新 | `docs/` 配下 | REI_INDEX.md も更新 |

---

## 5. 最近の変更（直近5件）

| 日付 | 内容 |
|------|------|
| 2026-02-13 | ARCH.md + CONTRACT.md + REI_INDEX.md 制定 |
| 2026-02-13 | MCPサーバー構築（tools/mcp-server/） |
| 2026-02-12 | evaluator.ts 16ファイル分割 |
| 2026-02-12 | Phase 3: puzzle.ts ↔ relation/will 統合 |
| 2026-02-11 | Rei v0.4: 6属性能動化完了（81テスト追加） |

---

## 6. 参照ドキュメント

| 文書 | 役割 |
|------|------|
| `ARCH.md` | アーキテクチャ憲法（依存方向・Core/Plugin境界） |
| `CONTRACT.md` | Plugin契約・Spec世代管理規格 |
| `docs/axioms/README-integrated.md` | 25公理の統合解説 |
| `NOTICE` | 知的財産保護の宣言 |
| `tools/mcp-server/README.md` | MCPサーバーの使い方 |

---

## 7. アーキテクチャ図（簡易）

```
                    ┌─────────────┐
                    │    Core     │  lexer / parser / evaluator-core / types
                    │   (不変)    │  contracts.ts
                    └──────┬──────┘
                           │  ← Plugin は Core のみを参照
          ┌────────┬───────┼───────┬────────┐
          │        │       │       │        │
       puzzle    game   thought  space   relation/will
       Plugin   Plugin  Plugin   Plugin  Plugin
          │        │       │       │        │
          ╳────────╳───────╳───────╳────────╳
              Plugin 同士の参照は禁止
```
