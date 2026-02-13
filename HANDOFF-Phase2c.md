# 引き継ぎ: Rei v0.5 Phase 2b → Phase 2c — 並行実行エンジン

## 現在の状態:
* GitHub: https://github.com/fc0web/rei-lang
* npm: rei-lang v0.4.0 (v0.5.0はPhase 3で公開)
* テスト: **661全通過**（19ファイル）
  - 577: 既存テスト（リグレッションゼロ）
  - 22: EventBus単体テスト
  - 37: Entity Agent単体テスト
  - 25: EventBus×Agent×Evaluator統合テスト
* ⭐ 初スター獲得（maxishiiさん）

## 本日完了したこと (Phase 2b):

### 1. EventBus基盤 (`src/lang/event-bus.ts` — ~280行)
* `ReiEventBus` クラス — Evaluatorインスタンスごとに1つ
* 型安全なイベント定義（EventCategory × EventAction = EventType）
  - カテゴリ: entity / binding / will / space / pipe / **agent** / system
* フィルタリング: 完全一致 / カテゴリワイルドカード / 全イベント(*) / カスタム関数
* `on()`, `once()`, 購読解除（返り値関数）
* イベントログ（サイズ上限・カテゴリ別取得対応）
* σ情報（`EventBusSigma`）— EventBus自体の自己記述
* FlowMomentum — 六属性「流れ」との概念的接続
  - rest / expanding / contracting / converged / pulsing
* 安全性: リスナーエラー耐性、無限連鎖防止（maxDepth=16）

### 2. Entity Agent (`src/lang/entity-agent.ts` — ~700行)
* `ReiAgent` クラス — 六属性を統合する自律Agent
  - 場(field) = 保持する値とEntityKind
  - 流れ(flow) = EventBus FlowMomentumに連動
  - 記憶(memory) = 行動履歴（perception/decision/action）
  - 層(layer) = 親子Agent階層の深度
  - 関係(relation) = BindingSummary連携
  - 意志(will) = ReiIntention連携
* ライフサイクル: dormant → active → suspended → dissolved
* AgentBehavior（4つの振る舞いポリシー）:
  - reactive: イベントに受動的に反応
  - autonomous: 意志に基づいて能動的に行動
  - cooperative: 他Agentとの調和を優先
  - explorative: 未知の相互作用を積極的に探索
* perceive → decide → act サイクル（同期実行）
  - perceive: EventBus受信 + 環境認識(autonomy.ts委譲)
  - decide: behaviorに応じた判断ロジック
  - act: recognize / fuse / separate / transform / emit / dissolve
* `AgentRegistry` — Agent管理レジストリ
  - spawn / get / dissolve / tickAll / list / sigma
  - 親子階層管理・連鎖消滅

### 3. Evaluator統合（evaluator.ts +~160行）
* `Evaluator.eventBus` プロパティ追加
* `Evaluator.agentRegistry` プロパティ追加
* 既存コマンドにEventBus発火を追加:
  - `recognize` / `認識` → `entity:recognize` 発火
  - `fuse_with` / `融合` → `entity:fuse` 発火
  - `separate` / `分離` → `entity:separate` 発火
  - `transform_to` / `変容` → `entity:transform` 発火
* 新パイプコマンド（日本語対応）:
  - `events` / `イベント` — イベントログ取得
  - `event_sigma` / `イベントσ` — EventBusのσ
  - `event_count` / `イベント数` — イベント数
  - `event_flow` / `流れ状態` — FlowMomentum取得
  - `agent` / `エージェント` — Agent生成（behavior / ID指定可能）
  - `agent_tick` / `自律実行` — Agentの1ステップ実行
  - `agent_sigma` / `自律σ` — AgentのSigma取得
  - `agent_list` / `自律一覧` — 全Agent一覧
  - `agent_dissolve` / `自律消滅` — Agent消滅
  - `agents_tick_all` / `全自律実行` — 全Agent一括tick
  - `agent_registry_sigma` / `自律統計` — レジストリ統計

### 4. パブリックAPI更新（src/index.ts）
* `ReiEventBus` クラスをexport
* `ReiAgent` / `AgentRegistry` クラスをexport

## 使用例:

```rei
// Agent生成
let x = 42
let sigma = x |> agent("autonomous", "my_agent")
// → AgentSigma { id: "my_agent", behavior: "autonomous", field: { kind: "numeric" }, ... }

// 自律実行
"my_agent" |> agent_tick
// → AgentTickResult { decision: { action: "recognize", ... }, ... }

// 全Agent一括実行
0 |> agents_tick_all
// → AgentTickAllResult { count: N, results: { ... } }

// EventBus確認
0 |> event_sigma
// → EventBusSigma { totalEmitted: N, flowMomentum: { state: "expanding", ... } }

// 日本語でも同等
let y = 3.14
y |> エージェント("自律", "pi_agent")
"pi_agent" |> 自律実行
0 |> 全自律実行
0 |> イベントσ
```

## v0.5ロードマップ:
* Phase 1 ✅ evaluator.tsモジュール分割
* Phase 2a ✅ イベントシステム導入（EventBus + イベント駆動）
* Phase 2b ✅ Entity Agent化（六属性を持つ自律Agent抽象化）
* **Phase 2c（次）並行実行エンジン（perceive → decide → act + Mediator）**
* Phase 3 統合・安定化・npm v0.5.0公開
* Phase 4 応用領域展開（第3段階エンジン上に構築）

## Phase 2cの設計方針:
* 並行実行: 複数Agentが「同時」に知覚・判断・行動する仕組み
* Mediator パターン: Agent間の通信・調停を担うMediator
* 同期実行 → 非同期実行への移行（async tick）
* コンフリクト解決: 同じリソースへの同時アクセス時の調停ルール
* Space拡散との統合: space:step/diffuse/converge イベントの発火
* 現状のtickAllを拡張し、ラウンド制の並行実行を実装

## ファイル構成（src/lang/ — Phase 2b完了時点）:
* evaluator.ts (~2,725行) — Evaluator class本体 + EventBus/Agent統合
* **event-bus.ts (~280行)** — ★ Phase 2a/2b 新規
* **entity-agent.ts (~700行)** — ★ Phase 2b 新規
* sigma.ts (185行) — σメタデータ
* mdim-core.ts (1,123行) — 𝕄計算コア + Tier 2-5
* evolve.ts (243行) — evolveモード
* string-mdim.ts (370行) — StringMDim/漢字
* rct-local.ts (381行) — シリアライズ・圧縮
* quad-genesis.ts (48行) — 四値論理・Genesis
* autonomy.ts (1,055行) — 自律認識エンジン
* relation.ts (581行) — 関係属性
* will.ts (554行) — 意志属性

## テストファイル（Phase 2b追加分）:
* tests/event-bus.test.ts (22テスト)
* tests/entity-agent.test.ts (37テスト)
* tests/entity-agent-integration.test.ts (25テスト)

## 注意事項:
* Phase 2a（EventBus）は引き継ぎ仕様に基づいて再実装済み
  - Nobukiさんのローカル版event-bus.tsとのマージが必要
  - 主要インターフェースは互換（ReiEventBus, on/once/emit/getSigma）
* agentIdCounterはモジュールレベルの変数（Evaluatorリセット時の考慮必要）
* README更新・note.com記事はまだ未完了

## 未完了タスク:
* README更新（v0.4新機能 + Phase 2a/2b反映）
* note.com v0.4リリース記事
* Nobukiさんのローカルevent-bus.tsとの統合
* Phase 2c: Mediator + 並行実行エンジン
* Space系イベント発火（space:step/diffuse/converge — Phase 2cで統合予定）
* bind/unbind/intend/will_computeへのEventBus発火追加（Phase 2cで統合予定）
