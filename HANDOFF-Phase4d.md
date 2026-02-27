# Rei-lang 引継ぎ資料 — 2026-02-14 (Phase 4d)

## 現在のステータス

- **リポジトリ**: https://github.com/fc0web/rei-lang
- **テスト**: 891 passed | 4 skipped (895 total) — 既存877 + ベンチマーク14
- **バージョン**: v0.5.2 (未publishのPhase 4d成果あり)

---

## 今回のセッションで完了したタスク

### Phase 4d: 安定化＋外部証明

#### 1. README全面刷新
- **旧README → `README-v052.md` にバックアップ**
- 新READMEの構成:
  - 冒頭3行でReiの本質を説明: "Values That Know Themselves"
  - "Why Rei?" セクション — sigma, trace, influence, will_evolveの実動例
  - Quick Start (5分) — REPL + ライブラリ両方
  - Core Concepts — 𝕄, σ, relation deep, will deep, genesis, compress
  - ベンチマークへのリンク
  - Agent runtime 概要
  - 日本語対応の説明
  - テストバッジ更新: 799 → 877
- **旧READMEの問題を修正**: 機能リスト羅列 → 価値提案に転換

#### 2. Runnable Benchmark Suite (`benchmarks/`)
- `benchmarks/benchmark-suite.test.ts` — 7ベンチマーク × 2テスト = 14テスト
- 各ベンチマークにRei実装 + TypeScript等価実装を並列記載
- `benchmarks/README.md` — 結果サマリーと実行方法

| # | ベンチマーク | Rei | TS | 比率 |
|---|------------|-----|-----|------|
| 1 | 画像カーネル計算 | 3行 | 10+行 | 3.3× |
| 2 | 多次元集約(4モード) | 5行 | 15+行 | 3× |
| 3 | 6属性メタデータ | 2行 | 40+行 | 20× |
| 4 | 依存グラフ追跡 | 6行 | 30+行 | 5× |
| 5 | 影響度スコアリング | 5行 | 25+行 | 5× |
| 6 | 構造的エンタングルメント | 4行 | 20+行 | 5× |
| 7 | 意志の自律進化 | 3行 | 30+行 | 10× |

#### 3. Getting Started チュートリアル (`docs/TUTORIAL.md`)
- 15分で完了できる構成（Part 1〜6）
- Install → 𝕄 → σ → relation → will → 日本語 の順
- すべて実際にREPLで動くコード

#### 4. Phase 4d設計文書 (`PHASE4D-DESIGN.md`)
- 目的、現状の問題、成果物一覧、優先順位、成功基準

#### 5. v1.0ロードマップ (`docs/ROADMAP-v1.md`)
- v0.5.x → v0.6.0 → v0.7.0 → v0.8.0 → v1.0.0 の段階定義
- v1.0の基準: API安定、ドキュメント完備、1000+テスト、外部フィードバック
- 非目標の明記（Visual IDE、セルフホスト等）

#### 6. vitest設定更新
- `vitest.config.ts` に `benchmarks/**/*.test.ts` を追加

---

## 変更ファイル一覧

| ファイル | 操作 |
|---------|------|
| `README.md` | 新規作成（全面刷新） |
| `README-v052.md` | 旧READMEのバックアップ |
| `PHASE4D-DESIGN.md` | 新規作成 |
| `benchmarks/benchmark-suite.test.ts` | 新規作成（14テスト） |
| `benchmarks/README.md` | 新規作成 |
| `docs/TUTORIAL.md` | 新規作成 |
| `docs/ROADMAP-v1.md` | 新規作成 |
| `vitest.config.ts` | 修正（benchmarks追加） |

---

## 次のタスク（優先順）

### ① Git commit & push
```bash
cd C:\Users\user\rei-lang
git add -A
git commit -m "Phase 4d: README rewrite, benchmark suite, tutorial, roadmap"
git push origin main
```

### ② npm publish (v0.5.3)
- `package.json` のバージョン更新
- description更新（"Values That Know Themselves" 追記）
- CHANGELOG更新
- `npm publish`

### ③ note.com記事公開
- Phase 4dの概要記事
- ベンチマーク結果の紹介
- GitHub PagesデモURL追記

### ④ Phase 4d残タスク
- API安定性ドキュメント (`docs/API-STABILITY.md`)
- READMEのベンチマーク数値を新ベンチマークに合わせて更新
- 旧killer examples (`docs/rei-killer-examples.md`) の注意書き更新

---

## 技術メモ

- **テスト実行**: `npx vitest run` — 全891テスト
- **ベンチマークのみ**: `npx vitest run benchmarks/` — 14テスト
- **ビルド**: `npm run build` → tsup で ESM/CJS/DTS 生成
