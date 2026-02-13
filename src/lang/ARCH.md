# ARCH.md — Rei Architecture Constitution

> **この文書はReiプロジェクトの「憲法」です。**
> すべてのコード変更・設計判断はこの文書に反しないことを確認してから行ってください。
> 人間・LLM（Claude/ChatGPT/Gemini）の区別なく適用されます。

**Version:** 1.0.0
**Author:** Nobuki Fujimoto (藤本伸樹)
**Date:** 2026-02-13

---

## 1. 基本原則

Reiは**無限成長に耐えるOS**を目指す。そのための4本柱：

| 柱 | 意味 | 対応セクション |
|----|------|---------------|
| **Core不変** | 核は凍結し、互換性を最優先する | §2 |
| **Plugin増殖** | 拡張は境界の外で自由に増える | §3 |
| **Index Tree** | 索引の索引で、規模に関係なく必要な部分だけ取得 | §4 |
| **Spec世代管理** | 仕様にバージョンを付け、世代間を橋渡しする | §5 |

---

## 2. Core（不変層）

### 2.1 Coreの定義

Coreとは、**変更すると全Pluginが壊れる可能性がある部分**を指す。

```
Core = {
  lexer.ts        — 字句解析（トークン定義）
  parser.ts       — 構文解析（AST定義）
  evaluator-core  — 評価エンジンの骨格
                    （変数管理、パイプディスパッチ、𝕄生成）
  types.ts        — ReiVal, MDimNumber, ReiSpace 等の型定義
}
```

### 2.2 Coreの凍結規則

| 規則 | 説明 |
|------|------|
| **C-1: 後方互換** | Coreの公開APIを削除・変更してはならない。新規追加のみ許可 |
| **C-2: 型保存** | `ReiVal`, `MDimNumber` の既存フィールドの型を変更してはならない |
| **C-3: パイプ契約** | 既存のパイプコマンド名の意味を変更してはならない |
| **C-4: Genesis不変** | Genesis公理（G₀, G→R）に基づく `. → 0₀ → 0 → 1` の生成連鎖は永久不変 |
| **C-5: テスト保護** | Core変更は既存テスト100%通過が必須。テスト削除は禁止 |

### 2.3 Coreを変更したい場合

1. ADR（Architecture Decision Record）を `docs/adr/` に書く
2. 全Pluginの影響範囲を `find_callers` で確認
3. 移行パス（migration path）を用意
4. Spec世代を上げる（§5参照）

---

## 3. Plugin（拡張層）

### 3.1 Pluginの定義

Pluginとは、**Coreの公開APIのみを使って機能を追加する独立モジュール**。

```
Plugin = {
  pipe-math.ts        — 数学パイプコマンド群
  pipe-space.ts       — Space-Layer-Diffusion
  pipe-puzzle.ts      — パズル統一エンジン
  pipe-game.ts        — ゲーム統一エンジン
  pipe-thought.ts     — Thought Loop
  pipe-relation.ts    — 関係属性コマンド
  pipe-will.ts        — 意志属性コマンド
  pipe-compute.ts     — 高度計算
  pipe-evolve.ts      — 自動モード選択
  pipe-kanji.ts       — 漢字/日本語処理

  extensions/         — 将来の理論別Plugin（66理論）
    ext-contraction-zero.ts
    ext-point-number.ts
    ext-linear-number.ts
    ext-inverse-math.ts
    ...
}
```

### 3.2 Pluginの境界規則

| 規則 | 説明 |
|------|------|
| **P-1: Core参照のみ** | PluginはCoreの公開API（export）だけを参照する。Core内部（private）への直接参照は禁止 |
| **P-2: Plugin間独立** | Plugin同士は直接importしない。共有が必要な場合はCoreにインターフェースを追加 |
| **P-3: 逆流禁止** | CoreはPluginをimportしない。依存方向は常に Plugin → Core の一方向 |
| **P-4: 自己完結テスト** | 各Pluginは自身のテストを持ち、単独で `npm test` 可能 |
| **P-5: 登録制** | PluginはCoreのディスパッチャに「登録」する。CoreがPluginを「知っている」のは登録テーブルのみ |

### 3.3 依存方向図

```
依存の矢印は「使う側 → 使われる側」

                    ┌─────────────┐
                    │    Core     │
                    │ (不変・凍結)  │
                    └──────┬──────┘
                           │
          ┌────────────────┼────────────────┐
          │                │                │
     ┌────▼────┐     ┌────▼────┐     ┌────▼────┐
     │pipe-math│     │pipe-pzl │     │pipe-game│  ...
     │ Plugin  │     │ Plugin  │     │ Plugin  │
     └─────────┘     └─────────┘     └─────────┘
          │                │                │
          ╳                ╳                ╳
    （Plugin同士のimportは禁止）

    ★ 逆流禁止: Core は Plugin を import しない
    ★ 水平禁止: Plugin は他の Plugin を import しない
```

### 3.4 Plugin登録インターフェース

```typescript
// Core が提供する Plugin 登録 API
interface ReiPlugin {
  name: string;                              // "puzzle", "game", etc.
  version: string;                           // semver
  specVersion: string;                       // "1.0" — 対応するSpec世代
  commands: Record<string, PipeHandler>;     // パイプコマンド群
  keywords?: Record<string, string>;         // lexer拡張（日本語等）
  init?(context: PluginContext): void;       // 初期化フック
}

// Core の Evaluator はこの登録テーブルだけを見る
class EvaluatorCore {
  private plugins: Map<string, ReiPlugin> = new Map();

  use(plugin: ReiPlugin): void {
    // P-5: 登録のみ。Coreはpluginの内部を知らない
    this.plugins.set(plugin.name, plugin);
  }

  execPipeCmd(cmd: string, target: ReiVal): ReiVal {
    // ディスパッチ: 全pluginのcommandsを順に探す
    for (const plugin of this.plugins.values()) {
      if (cmd in plugin.commands) {
        return plugin.commands[cmd](target, this.context);
      }
    }
    throw new Error(`Unknown pipe command: ${cmd}`);
  }
}
```

---

## 4. Index Tree（索引木）

### 4.1 なぜ索引が必要か

> 「1TBを500kbに圧縮」するのではなく、
> 「1TBの索引から今必要な500kbだけを取り出す」

LLMのコンテキストウィンドウは有限。プロジェクトが成長しても
「日々の作業コスト」を一定に保つために、階層的索引を維持する。

### 4.2 索引の3層構造

```
Layer 0: REI_INDEX.md（人間＋AI向けの目次 — 1ファイル）
  ├── プロジェクト全体の構造
  ├── Core / Plugin の一覧と役割
  ├── 「この作業には何を読むべきか」のガイド
  └── 変更履歴サマリー

Layer 1: 各モジュールのヘッダーコメント
  ├── 各 .ts ファイル冒頭の JSDoc
  ├── export 一覧と簡易説明
  └── 依存先の列挙

Layer 2: MCP Server（機械的索引 — 自動生成）
  ├── シンボル索引（関数/型/クラスの名前・位置）
  ├── 依存グラフ（import/call graph）
  ├── 全文検索（grep）
  └── 行範囲取得（get_code）
```

### 4.3 REI_INDEX.md の必須セクション

```markdown
# REI_INDEX.md
## 1. プロジェクト概要（3行以内）
## 2. Core ファイル一覧（変更厳禁マーク付き）
## 3. Plugin 一覧（各Pluginの役割を1行で）
## 4. 作業ガイド
   - 「パズルを修正したい」→ pipe-puzzle.ts + puzzle.ts
   - 「新しい理論を追加したい」→ extensions/ に新Plugin
   - 「Core APIを変えたい」→ §2.3の手順を踏む
## 5. 最近の変更（直近5件）
```

### 4.4 索引の索引（スケール対策）

プロジェクトが100モジュールを超えたら、索引自体を分割する：

```
REI_INDEX.md           ← 全体目次（常に1ファイル）
  ├── INDEX_CORE.md    ← Core層の詳細索引
  ├── INDEX_PLUGINS.md ← Plugin層の詳細索引
  └── INDEX_DOCS.md    ← ドキュメント・理論の索引
```

---

## 5. Spec世代管理

### 5.1 なぜ世代管理が必要か

拡張が増えるほど「全世界の整合性」が必要になり、いつか破綻する。
世代管理により、**古い仕様と新しい仕様が共存**できる。

### 5.2 Spec世代の定義

| 世代 | 状態 | 内容 |
|------|------|------|
| **Spec v1.0** | 🔒 凍結予定 | 現在のRei v0.3〜v0.4（6属性、25公理、5柱） |
| **Spec v2.0** | 📋 計画中 | Plugin Architecture導入、66理論拡張 |
| **Spec v3.0** | 💭 構想 | Reiの自己記述性（OS化完成形） |

### 5.3 世代間の規則

| 規則 | 説明 |
|------|------|
| **S-1: 凍結は永久** | 一度凍結したSpecは変更しない |
| **S-2: 共存** | 異なるSpec世代のPluginは同時に動作できる |
| **S-3: アダプター** | Spec間の橋渡しはアダプター層で行う。Core変更ではなくアダプターで吸収 |
| **S-4: 明示的宣言** | 各Pluginは対応するspecVersionを宣言する |

### 5.4 世代遷移のプロセス

```
1. 新Specのドラフトを docs/spec/ に書く
2. アダプター層を実装（旧Plugin → 新Core の変換）
3. 新Spec対応のPluginを extensions/ に追加
4. 全テスト通過を確認
5. 旧Specを凍結（FROZEN マーク）
6. CHANGELOG + ADR に記録
```

---

## 6. D-FUMTの6属性との対応

このアーキテクチャ自体がD-FUMTの6属性を体現している：

| 属性 | アーキテクチャでの表現 |
|------|----------------------|
| **場（field）** | Core — 全てのPluginが存在する「場」 |
| **流れ（flow）** | 依存方向 — Plugin → Core の一方向の流れ |
| **記憶（memory）** | CHANGELOG + ADR — 設計判断の記録 |
| **層（layer）** | Index Tree — Layer 0/1/2 の階層構造 |
| **関係（relation）** | Plugin登録 — CoreとPluginの契約関係 |
| **意志（will）** | Spec世代管理 — プロジェクトの進化方向 |

---

## 7. 禁止事項（レッドライン）

以下は理由を問わず禁止。違反はrevertする：

1. **CoreからPluginへのimport**（逆流）
2. **Plugin間の直接import**（水平結合）
3. **既存テストの削除**（歴史の抹消）
4. **凍結Specの変更**（世代の改竄）
5. **REI_INDEX.mdの更新なき構造変更**（索引の腐敗）
6. **ADRなきCore変更**（判断の不記録）

---

## 付録A: ファイル配置規則

```
rei-lang/
├── ARCH.md                 ← この文書（憲法）
├── CONTRACT.md             ← Plugin契約（法律）
├── REI_INDEX.md            ← 索引の根（目次）
├── CHANGELOG.md            ← 変更履歴
├── src/
│   ├── lang/
│   │   ├── types.ts        ← [Core] 型定義
│   │   ├── lexer.ts        ← [Core] 字句解析
│   │   ├── parser.ts       ← [Core] 構文解析
│   │   ├── evaluator-core.ts  ← [Core] 評価エンジン骨格
│   │   ├── pipe-math.ts    ← [Plugin] 数学
│   │   ├── pipe-space.ts   ← [Plugin] 空間
│   │   ├── pipe-puzzle.ts  ← [Plugin] パズル統一
│   │   ├── pipe-game.ts    ← [Plugin] ゲーム統一
│   │   ├── pipe-thought.ts ← [Plugin] Thought Loop
│   │   ├── pipe-relation.ts← [Plugin] 関係
│   │   ├── pipe-will.ts    ← [Plugin] 意志
│   │   └── pipe-evolve.ts  ← [Plugin] 自動モード選択
│   ├── enyu/
│   │   └── contracts.ts    ← [Core] 円融型契約
│   └── extensions/         ← [Plugin] 将来の66理論
│       └── ...
├── tests/                  ← テスト（各Pluginごと）
├── docs/
│   ├── adr/               ← Architecture Decision Records
│   ├── spec/              ← Spec世代のドラフト
│   └── axioms/            ← 25公理のドキュメント
└── tools/
    └── mcp-server/        ← Index Tree Layer 2
```

---

> **この文書を変更する場合は、ADRを書き、全コントリビューターの合意を得ること。**
