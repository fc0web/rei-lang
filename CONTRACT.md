# CONTRACT.md — Rei Plugin Contract & Spec Generation Rules

> **ARCH.md が「憲法」なら、この文書は「法律」です。**
> Pluginを作成・変更するすべての人（人間・LLM）はこの契約に従ってください。

**Version:** 1.0.0
**Author:** Nobuki Fujimoto (藤本伸樹)
**Date:** 2026-02-13
**Governed by:** ARCH.md §3, §5

---

## Part I: Plugin Contract（プラグイン契約）

### 1. Pluginの構造要件

すべてのPluginは以下の構造を持たなければならない：

```typescript
// ============================================================
// [Plugin名] — [1行の説明]
//
// Spec Version: 1.0
// Depends on: Core only (evaluator-core, types)
// Provides: [コマンド一覧]
// ============================================================

import type { ReiVal, PipeHandler, PluginContext } from '../types.js';

/** Plugin定義 */
export const plugin: ReiPlugin = {
  name: '[plugin-name]',
  version: '0.1.0',
  specVersion: '1.0',
  commands: {
    // ... パイプコマンド群
  },
};
```

### 2. 命名規則

| 対象 | 規則 | 例 |
|------|------|-----|
| ファイル名 | `pipe-[名前].ts` | `pipe-puzzle.ts` |
| Plugin名 | 小文字ケバブケース | `"puzzle"`, `"thought-loop"` |
| コマンド名 | 小文字スネークケース | `"solve"`, `"think"`, `"will_compute"` |
| 日本語コマンド | UTF-8そのまま | `"数独"`, `"解く"`, `"思考"` |
| テストファイル | `[plugin名].test.ts` | `puzzle.test.ts` |
| 拡張Plugin | `ext-[理論名].ts` | `ext-contraction-zero.ts` |

### 3. 依存の制約（ARCH.md §3.2 の詳細化）

#### 3.1 許可される依存

```typescript
// ✅ OK: Coreの公開型をimport
import type { ReiVal, MDimNumber } from '../types.js';

// ✅ OK: Coreのユーティリティ関数を使用
import { createMDim, wrapReiVal } from '../evaluator-core.js';

// ✅ OK: Node.js標準ライブラリ
import * as path from 'node:path';

// ✅ OK: 外部npmパッケージ（package.jsonに宣言済み）
import { z } from 'zod';
```

#### 3.2 禁止される依存

```typescript
// ❌ 禁止: 他のPluginを直接import
import { solveSudoku } from './pipe-puzzle.js';

// ❌ 禁止: Coreのprivateメンバーにアクセス
const env = evaluator['env'];  // private field

// ❌ 禁止: Coreの内部実装に依存するパス
import { parseInternalNode } from '../parser-internals.js';

// ❌ 禁止: グローバル状態の変更
globalThis.reiState = { ... };
```

#### 3.3 Plugin間でロジックを共有したい場合

```
方法A: 共通部分をCoreに昇格する
  → Core に新しいユーティリティ関数を追加
  → ADR を書いて記録
  → 両Pluginがそれぞれ Core からimport

方法B: 共通部分を shared utility に切り出す
  → src/shared/[名前].ts に配置
  → shared は Core でも Plugin でもない「ユーティリティ層」
  → shared → Core への依存は許可、shared → Plugin は禁止
```

### 4. コマンド登録の契約

#### 4.1 コマンドのシグネチャ

```typescript
type PipeHandler = (
  target: ReiVal,           // パイプの入力値
  context: PluginContext,   // Core が提供するコンテキスト
  ...args: ReiVal[]         // 追加引数
) => ReiVal;                // 戻り値（必ずReiVal）
```

#### 4.2 PluginContextの内容

```typescript
interface PluginContext {
  // 値の生成
  createMDim(center: number, periphery: number[]): MDimNumber;
  wrapVal(raw: any): ReiVal;

  // 変数参照（読み取り専用）
  getVar(name: string): ReiVal | undefined;

  // σ（自己参照）
  sigma(val: ReiVal): SigmaResult;

  // 6属性アクセス
  getField(val: ReiVal): SigmaField;
  getFlow(val: ReiVal): SigmaFlow;
  getMemory(val: ReiVal): MemoryEntry[];
  getLayer(val: ReiVal): SigmaLayer;
  getRelation(val: ReiVal): SigmaRelation;
  getWill(val: ReiVal): SigmaWill;
}
```

#### 4.3 コマンド命名の衝突防止

```
1. 登録時に名前の重複チェックを行う
2. 重複があった場合、後から登録したPluginがエラーを投げる
3. 日本語コマンドは英語コマンドのエイリアスとして登録
   例: commands["solve"] と commands["解く"] は同じハンドラ
```

### 5. テストの契約

#### 5.1 必須テスト

各Pluginは最低限以下のテストを持つ：

```typescript
describe('[Plugin名]', () => {
  // 1. 基本動作
  it('should handle basic pipe command', () => { ... });

  // 2. エッジケース
  it('should handle empty/null input gracefully', () => { ... });

  // 3. 型安全性
  it('should return valid ReiVal', () => { ... });

  // 4. 独立性の証明
  it('should work without other plugins loaded', () => { ... });
});
```

#### 5.2 テストの実行

```bash
# 全テスト
npm test

# 特定Pluginのテストのみ
npm test -- --grep "puzzle"

# Coreテストのみ（Plugin追加時の回帰確認）
npm test -- --grep "core|tier"
```

---

## Part II: Spec Generation Rules（仕様世代管理規格）

### 6. Spec世代の定義

#### 6.1 現在の世代一覧

| 世代 | コードネーム | 状態 | 内容 |
|------|-------------|------|------|
| **v1.0** | **Genesis** | 🟡 Active | 6属性、25公理、5柱、482テスト |
| v2.0 | Plugin | 📋 Draft | Plugin Architecture、66理論拡張開始 |
| v3.0 | Mirror | 💭 Vision | Reiの自己記述性、OS化完成形 |

#### 6.2 世代の状態遷移

```
Draft → Active → Frozen → Archived

Draft:    仕様策定中。変更自由
Active:   リリース済み。後方互換な追加のみ
Frozen:   完全凍結。変更禁止。セキュリティ修正のみ例外
Archived: サポート終了。ドキュメントのみ保持
```

### 7. 世代遷移のプロセス

#### 7.1 新世代の開始（Draft → Active）

```markdown
1. docs/spec/v[N].0-draft.md を作成
2. 新Specで追加/変更するAPI一覧を明記
3. 旧Specからの移行パスを記述
4. アダプター層を実装
5. 全テスト（旧世代＋新世代）が通過することを確認
6. CHANGELOG に世代遷移を記録
7. REI_INDEX.md を更新
```

#### 7.2 凍結（Active → Frozen）

```markdown
1. 最終テスト実行（全テスト100%通過）
2. docs/spec/v[N].0.md に "FROZEN" マークを追加
3. ADR に凍結の理由と日付を記録
4. 以後このSpecのCoreファイルは変更禁止
```

### 8. アダプター層の設計

異なるSpec世代のPluginが共存するための橋渡し：

```typescript
// adapters/v1-to-v2.ts
//
// Spec v1.0 の Plugin を Spec v2.0 の Core で動かすためのアダプター

import type { ReiPlugin as V1Plugin } from '../spec-v1/types.js';
import type { ReiPlugin as V2Plugin } from '../spec-v2/types.js';

export function adaptV1toV2(v1plugin: V1Plugin): V2Plugin {
  return {
    ...v1plugin,
    specVersion: '2.0',
    // v2で追加された必須フィールドにデフォルト値を設定
    capabilities: inferCapabilities(v1plugin),
    // v1のコマンドシグネチャをv2に変換
    commands: wrapV1Commands(v1plugin.commands),
  };
}
```

### 9. バージョニング規則

#### 9.1 Spec世代 vs パッケージバージョン

```
Spec世代:     v1.0, v2.0, v3.0（大きな設計変更）
npmバージョン: 0.3.1, 0.4.0, 1.0.0（セマンティックバージョニング）

対応:
  Spec v1.0 → npm 0.x.x（0系はSpec v1.0の範囲内）
  Spec v2.0 → npm 1.x.x（Plugin Architecture導入でメジャーアップ）
  Spec v3.0 → npm 2.x.x（自己記述性導入でメジャーアップ）
```

#### 9.2 Plugin のバージョン

```
Plugin は独立してバージョンを持つ:
  pipe-puzzle  0.1.0  (specVersion: "1.0")
  pipe-game    0.2.0  (specVersion: "1.0")
  ext-mirror   0.1.0  (specVersion: "2.0")  ← 将来の理論Plugin
```

---

## Part III: 変更管理（Change Control）

### 10. ADR（Architecture Decision Record）

Core変更やSpec世代遷移には ADR が必須。

```markdown
# ADR-[番号]: [タイトル]

## 状態
Proposed / Accepted / Deprecated

## 文脈
何が問題か、なぜ変更が必要か

## 決定
何をどう変えるか

## 影響
- 影響を受けるファイル
- 影響を受けるPlugin
- 移行パス

## 日付
YYYY-MM-DD
```

### 11. CHANGELOG の書式

```markdown
## [バージョン] - YYYY-MM-DD

### Added（追加）
- 新Plugin: pipe-xxx.ts — [説明]

### Changed（変更）
- [Core] evaluator-core.ts — [変更内容]（ADR-XX）

### Fixed（修正）
- [Plugin] pipe-puzzle.ts — [バグ内容]

### Frozen（凍結）
- Spec v1.0 → Frozen（ADR-XX）
```

### 12. 検証の自動化チェックリスト

変更をコミットする前に確認：

```
□ npm test — 全テスト通過
□ npm run build — TypeScriptコンパイル成功
□ REI_INDEX.md — 構造変更があれば更新済み
□ CHANGELOG.md — 変更内容を記録済み
□ ADR — Core変更の場合は記録済み
□ ARCH.md §7 — 禁止事項に該当しないことを確認
□ find_callers — 影響範囲を確認済み（MCPサーバー利用）
```

---

## Part IV: 実装ロードマップ

### 現在地からの移行計画

```
Phase 0（現在）: モノリシック evaluator.ts（4,354行）
  ↓
Phase 1（完了）: 16ファイル分割 + PROJECT_MAP.md
  ↓
Phase 2（本文書）: ARCH.md + CONTRACT.md を制定
  ↓
Phase 3: Plugin登録インターフェースの実装
  - types.ts に ReiPlugin, PluginContext を定義
  - evaluator-core.ts に use() と ディスパッチャを実装
  - 既存コードを段階的にPlugin化
  ↓
Phase 4: MCPサーバーを Index Tree Layer 2 として統合
  - tools/mcp-server/ からプロジェクト索引を自動生成
  - Claude Desktop / Claude Code との連携確認
  ↓
Phase 5: Spec v1.0 凍結 + Spec v2.0 開始
  - 66理論を extensions/ に順次追加
  - アダプター層の実装
  ↓
Phase 6: Reiの自己記述性（Spec v3.0）
  - Reiコード自体を𝕄構造として記述
  - 「この変更は何に影響するか」をRei自身が計算
```

---

## 付録: D-FUMTの25公理とSpec世代の対応

| 理論群 | 公理 | Spec世代 |
|--------|------|---------|
| 意識数学 (C) | C1〜C5 | v1.0 Genesis |
| 普遍数学 (U) | U1〜U5 | v1.0 Genesis |
| 非古典論理 (N) | N1〜N5 | v1.0 Genesis |
| メタ数学 (M) | M1〜M5 | v1.0 Genesis |
| 円融観測 (A) | A1〜A5 | v1.0 Genesis |

> 25公理はすべてSpec v1.0（Genesis世代）に属し、永久不変。
> 66理論の実装はSpec v2.0以降でPlugin化される。

---

> **この文書を変更する場合は、ADRを書き、ARCH.md §7の禁止事項に該当しないことを確認すること。**
