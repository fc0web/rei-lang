# Changelog

## [0.4.0] — 2026-02-14

### ☮️ Peace Use Clause（平和利用条項）
- Apache 2.0 ライセンスに平和利用条項を追加
- 兵器・軍事システム・LAWS・人権侵害目的での使用を禁止
- 日英バイリンガルの `PEACE_USE_CLAUSE.md` を同梱

### 🧠 RCT Semantic Compression（意味的圧縮 — D-FUMT Theory #67 方向3）
- `semantic_compress` / `意味圧縮`: コードの意味をθ（生成パラメータ）に圧縮
- `semantic_decompress` / `意味復元`: θからコードを再生成
- `semantic_verify` / `意味検証`: 元コードと復元コードの意味的等価性を検証
- ローカルモード（LLM不要）: パターンマッチベースの高速θ抽出
- APIモード（ANTHROPIC_API_KEY設定時）: Claude連携による高精度意味圧縮
- 6属性とモデルの対応: LLM=記憶, CNN=場, GNN=関係, Symbolic=意志, Diffusion=流れ, Hybrid=層

### 🗜️ RCT Core Compression（コア圧縮 — D-FUMT Theory #67 方向1-2）
- `compress` / `圧縮`: 12パターン自動選択による生成的圧縮
- `decompress` / `復元`: 完全可逆な復元
- `compress_info` / `圧縮情報`: 圧縮メタデータ表示
- Hybrid戦略統合: gzip比 RCT 24.8% vs gzip 26.2%で上回る
- 数値パターンでgzipの最大100倍の圧縮率

### 🔗 6属性能動化（関係・意志）
- `bind` / `relate` — 値間の関係性バインディング
- `intend` / `will_compute` — 意志に基づく計算戦略選択
- 全6属性（場・流れ・記憶・層・関係・意志）が能動的に動作

### 🧩 柱③④⑤ 統合
- パズル統一エンジン（数独・ラテン方陣・制約伝播）
- Thought Loop（自律的思考ループ）
- ゲーム統一（三目並べ・ニム・minimax）+ ピュアランダムネス

### テスト
- 535テスト通過（15テストファイル）
- 新規: `rct_semantic_integration.test.ts` (13テスト)

### ライセンス
- MIT → Apache 2.0 + Peace Use Clause に変更

---

## [0.3.1] — 2026-02-10

- 全12テストスイートvitest統一・482テスト全通過
- `src/index.ts` 追加（stateful API + ReiVal unwrap）

## [0.3.0] — 2026-02-08

- Space-Layer-Diffusion モデル実装
- 場-層-拡散の計算エンジン
- MCP Server 実装

## [0.2.1] — 2026-01

- 初期リリース
- 多次元数体系・中心-周囲パターン
- 74%平均コード削減
