# Changelog

## [0.5.0] — 2026-02-14

### 🤖 自律Agent実行エンジン（v0.5ロードマップ全完了）
v0.5の全Phase（Phase 1〜3）完了。エンティティが自律的に知覚・判断・行動する実行エンジンを導入。

### Phase 1: evaluator.tsモジュール分割
- evaluator.ts (2,908行) を安定的にモジュール管理

### Phase 2a: EventBus — イベント駆動基盤
- `ReiEventBus` クラス: 型安全なイベントシステム (`event-bus.ts`, 353行)
- イベント型: `category:action` パターン (entity/binding/will/space/agent/system)
- FlowMomentum: 六属性「流れ」との概念的接続 (rest/expanding/contracting/converged/pulsing)
- パイプコマンド: `emit` / `発火`, `subscribe` / `購読`, `flow_momentum` / `流勢`

### Phase 2b: Entity Agent — 自律エンティティ
- `ReiAgent` クラス: 六属性を持つ自律Agent (`entity-agent.ts`, 1,153行)
- perceive → decide → act ライフサイクル
- 5つの行動パターン: reactive / proactive / cooperative / competitive / contemplative
- `AgentRegistry`: Agentのスポーン・検索・ライフサイクル管理
- パイプコマンド: `spawn` / `生成`, `perceive` / `知覚`, `decide` / `判断`, `act` / `行動`, `agent_sigma` / `自律σ`

### Phase 2c: Mediator — 並行実行エンジン
- `ReiMediator` クラス: 並行実行 + 競合解決 (`mediator.ts`, 770行)
- ラウンドベース並行実行: perceive all → decide all → 競合検出 → 解決 → act all
- 4種の競合検出: target_contention / resource_conflict / mutual_fuse / contradictory
- 5種の解決戦略: priority(優先) / cooperative(協調) / sequential(順次) / cancel_both(両方取消) / mediator(調停者)
- 収束検出付き連続実行 (`run()`)
- Agent間メッセージング: sendMessage / broadcast
- パイプコマンド: `mediate` / `調停`, `mediate_run` / `調停実行`, `mediator_sigma` / `調停σ`, `mediate_strategy` / `調停戦略`, `mediate_message` / `調停通信`, `mediate_broadcast` / `調停放送`

### Phase 3: 統合・安定化
- DTSビルドエラー修正 (KANJI_DB export, entity-agent型整合)
- README全面更新 (v0.5新機能ドキュメント)
- npm v0.5.0パッケージ公開

### テスト
- **721テスト通過**（21テストファイル）
  - 661: Phase 2b以前（リグレッションゼロ）
  - 25: Mediator単体テスト
  - 35: Mediator×Evaluator統合テスト

### パブリックAPI
- `ReiEventBus`, `ReiAgent`, `AgentRegistry`, `ReiMediator` をexport

---

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
