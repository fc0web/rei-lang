# Changelog

## [0.5.5] — 2026-02-15

### 🌐 Phase 6: 4新ドメイン拡張 (E/F/G/H)
数学(A)・自然科学(B)・情報工学(C)・人文科学(D)に加え、4つの新ドメインを追加。
Reiの中心-周囲パターンが7つの知の領域を統一的に扱えることを実証。

#### E. 芸術 (`domains/art.ts`)
- パターン生成（フラクタル、セルオートマトン、反応拡散系）
- 色彩理論（RGB/HSL変換、補色・類似色・三色配色の調和計算）
- 美学分析（構図・バランス・リズムの定量評価）

#### F. 音楽 (`domains/music.ts`)
- 音階生成（メジャー/マイナー/モード、微分音対応）
- 和声分析（協和度計算、コード進行評価）
- メロディ生成（音程パターン、リズム構造）

#### G. 経済学 (`domains/economics.ts`)
- 市場シミュレーション（需要供給、価格均衡）
- ゲーム理論（ナッシュ均衡、囚人のジレンマ）
- エージェントベース市場モデル

#### H. 言語学 (`domains/linguistics.ts`)
- 構文解析（再帰下降パーサー、構文木生成）
- 意味論（類似度計算、語義ネットワーク）
- 翻訳フレームワーク（言語間マッピング）

#### 型システム強化 (`type-system.ts`)
- ランタイム型チェック・型推論統合
- 全ドメイン空間型のファーストクラスサポート
- 哲学型 0₀（すべての型の根源）

### 🔗 Phase 6.5: EFGH横断統合 (`cross-domain-efgh.ts`)
- EFGH内部12方向ブリッジ（E↔F共感覚, E↔G美的価値, F↔H韻律言語 等）
- EFGH→BCD 12方向ブリッジ（E→B フラクタル→N体, G→D 市場→倫理 等）
- `compose_all` — 7ドメイン(B-H)統合分析

### 🔄 Phase 6.6: BCD→EFGH逆方向ブリッジ (`cross-domain-bcd-efgh.ts`)
- B→E/F/G/H: 自然科学データの芸術・音楽・経済・言語表現変換
- C→E/F/G/H: 情報工学データの多領域変換
- D→E/F/G/H: 人文科学知見の創造的表現変換
- **全36方向接続達成** — 7ドメイン完全相互接続ネットワーク

### 🏛️ Phase 6.7: 用語の構造哲学統一
- 宗教固有の用語を構造哲学の言葉に置換
- 「縁起」→「相互依存」、「空」→「動的ゼロ」等
- 普遍的な数理構造として、文化的背景に依存しない記述に統一

### テスト
- **1533テスト通過**（42テストファイル）
- Phase 6 新規: 65テスト (`phase6-domains.test.ts`)
- EFGH横断: 99テスト (`cross-domain-efgh.test.ts`)
- BCD→EFGH: 74テスト (`cross-domain-bcd-efgh.test.ts`)
- Zero regressions

---

## [0.5.4] — 2026-02-15

### ⭐ Phase 5.5: 6属性全結合カスケード (`sigma-dynamics.ts`, `sigma-attributes.ts`)
6属性（場・流れ・記憶・層・関係・意志）を一方向線形チェーンから全結合ネットワークに拡張。

#### 6属性ファーストクラス化
- 直接クエリ: `field_of` / `flow_of` / `memory_of` / `layer_of`
- 場操作: `field_set` / `field_merge` / `field_topology`
- 流れ制御: `flow_set` / `flow_reverse` / `flow_accelerate`
- 記憶操作: `memory_search` / `memory_snapshot` / `memory_forget`
- 層操作: `layer_deepen` / `layer_flatten`
- 星座分析: `attr_resonance` / `attr_balance` / `attr_compose`

#### 全結合カスケード
- 場(field)がカスケードに参加（field→flow, field→relation, layer→field）
- 逆方向・交差カスケード（memory→will, flow→field, will→relation）
- 共鳴増幅（属性間の共鳴検出による自動増幅）

#### 星座ライフサイクル
- 5段階: 萌芽 → 成長 → 成熟 → 変容 → 再生
- 星座の時間発展追跡

### 🧬 Phase 5.5b: 自律認識エンジン (`autonomy.ts`)
- `recognize` / `認識` — 周囲エンティティの検知・評価
- `fuse` / `融合` — 最適な結合形態の自律選択
- `separate` / `分離` — 融合済みエンティティの分離
- `transform` / `変容` — 文脈に応じた表現形態の変容
- `entity_sigma` / `存在σ` — 自律的自己記述
- `auto_recognize` / `自動認識` — 空間内全ノードの相互認識

### 🌉 Phase 5.5c: BCDドメイン横断統合 (`cross-domain.ts`)
- 6方向ブリッジ: B↔C, B↔D, C↔D（各双方向）
- `domain_compose` — 3ドメイン統合分析
- `cross_sigma` — 横断σメタデータ
- D-FUMT「相互依存」原理の実装

### 📐 Phase 5: 3ドメイン拡張 (B/C/D)
- B. 自然科学 (`natural-science.ts`): N体シミュレーション、波動方程式
- C. 情報工学 (`info-engineering.ts`): ETLパイプライン、LLMチェーン
- D. 人文科学 (`humanities.ts`): テキスト分析、因果ネットワーク、倫理推論

### テスト
- **1158テスト通過**（36テストファイル）
- Phase 5 新規: 61テスト (`phase5-domains.test.ts`)
- 6属性深化: 180テスト (`sigma-attributes/deep/dynamics/reactive`)
- 自律認識: 42テスト (`autonomy.test.ts`)
- 横断統合: 38テスト (`cross-domain.test.ts`)
- Zero regressions

---

## [0.5.3] — 2026-02-14

### 📐 Phase 4d: 安定化＋外部証明
新機能ではなく、既存の強みを「追試可能・説明可能・使用可能」にするリリース。

#### README全面刷新
- "Values That Know Themselves" — 機能リスト羅列から価値提案に転換
- sigma, trace, influence, will_evolveの実動コード例
- テストバッジ更新: 799 → 877 → 891

#### 実行可能なベンチマークスイート (`benchmarks/`)
- 7つのRei vs TypeScript比較（14テスト全パス）
- 最大20×コード削減（6属性メタデータ）
- `npx vitest run benchmarks/` で誰でも検証可能

#### ドキュメント
- `docs/TUTORIAL.md` — 15分でReiの価値を体感するガイド
- `docs/ROADMAP-v1.md` — v0.5.x → v1.0.0 への段階的計画
- `docs/API-STABILITY.md` — Stable/Provisional/Experimental 分類
- `docs/note-phase4d-article.md` — note.com公開用記事
- `docs/rei-killer-examples.md` — 補足セクション更新（v0.5.3で動く機能の明記）

#### テスト
- 891 tests passing (877 existing + 14 benchmark tests)
- Zero regressions

## [0.5.2] — 2026-02-14

### 🧠 Phase 4b: パズル推論深化
- Hidden Single 検出（層2推論）
- Pointing Pair / Box-Line Reduction 検出（層2.5推論）
- 推論層追跡 (ReasoningTrace) — 各ステップの推論層を記録
- 難易度分析 (DifficultyAnalysis) — easy/medium/hard/expert 自動判定
- 新パイプ: `agent_difficulty` / `自律難易度`, `agent_trace` / `自律追跡`
- 結果パイプ: `difficulty` / `難易度`, `trace` / `追跡`

### 🎮 Phase 4c: ゲーム推論深化
- 行動パターン分化: reactive, proactive, contemplative, competitive
- 戦術パターン知覚: threat, opportunity, fork, block, center, corner
- モンテカルロ風評価（contemplative Agent）
- 対局分析 (MatchAnalysis) — プレイヤー別の手数・戦術集計
- 新パイプ: `agent_analyze` / `自律分析`
- 結果パイプ: `analyze` / `分析`

### テスト
- 799 tests passing (+37 new: 19 puzzle-agent + 18 game-agent)
- Zero regressions

## [0.5.1] — 2026-02-14

### 🧩 AgentSpace — パズル統一理論 × ゲーム統一理論 (Phase 4a)
パズルとゲームを同一の抽象として Agent 基盤上に統一。

#### 核心的洞察
- パズル = 協調的マルチエージェントシステム（全セルが共通目標に向かう）
- ゲーム = 競争的マルチエージェントシステム（プレイヤーが対立目標を持つ）
- 違いは Agent の behavior と Mediator の strategy だけ

#### 新規ファイル
- `src/lang/agent-space.ts` (1,011行) — AgentSpace 統一基盤
  - `createPuzzleAgentSpace()`: パズル → 協調Agentシステム変換
  - `createGameAgentSpace()`: ゲーム → 競争Agentシステム変換
  - `agentSpaceRun()`: 統一実行（収束/決着まで）
  - `agentSpaceRunRound()`: 1ラウンド単位実行
  - D-FUMT 六属性マッピング: 場=盤面, 流れ=ラウンド進行, 記憶=履歴, 層=推論深度, 関係=制約/対立, 意志=戦略

#### パイプコマンド（evaluator統合）
- パズル: `agent_solve`/`自律解法`, `agent_propagate`/`自律伝播`, `as_agent_space`/`空間Agent化`
- ゲーム: `agent_play`/`自律対戦`, `agent_turn`/`自律手番`, `agent_match`/`自律対局`
- 共通: AgentSpaceResult の `grid`, `rounds`, σ アクセス

#### テスト
- **762テスト通過**（23テストファイル）
  - 721: v0.5.0以前（リグレッションゼロ）
  - 30: AgentSpace単体テスト
  - 11: AgentSpace×Evaluator統合テスト

---

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
