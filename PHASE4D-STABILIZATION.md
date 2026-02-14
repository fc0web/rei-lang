# Phase 4d 安定化分析 — AgentSpace × relation/will 統合

**Date:** 2026-02-14
**Status:** 分析完了 → 実装待ち

---

## 現状診断

### ✅ 個別に完成しているもの

| システム | 状態 | テスト数 |
|---------|------|---------|
| sigma-deep 6属性 (field/flow/memory/layer/relation/will) | 深化済 | ~50 |
| relation深化 (trace/influence/entangle) | 動作確認済 | 15 |
| will深化 (will_evolve/will_align/will_conflict) | 動作確認済 | 16 |
| AgentSpace (puzzle agent / game agent) | Phase 4a-4c完了 | ~73 |
| Entity Agent + Mediator | 完成 | ~72 |

### ❌ 統合されていないもの

**核心的発見: AgentSpace と relation/will deep コマンドの間に統合がゼロ。**

```
agent-space.ts  ←→  sigma-deep.ts (trace/influence/entangle/will_*)
                     接続なし
entity-agent.ts ←→  sigma-deep.ts (新しい relation/will 型)
                     旧 relation.ts/will.ts の型のみ使用
mediator.ts     ←→  sigma-deep.ts
                     接続なし
```

具体的に：

1. **agent-space.ts (1,661行)** — `entangle`, `influence`, `trace`, `will_evolve`, `will_align`, `will_conflict` への参照がゼロ
2. **entity-agent.ts** の `sigma()` — 旧式の flat な `relation: { bindingCount, bindings }` と `will: { intention, satisfaction }` を返す。sigma-deep の豊かな構造（`entanglements`, `trajectory`, `intrinsic`, `prediction`）を反映していない
3. **mediator.ts** — 競合解決が純粋にメカニカル（priority/cooperative）。will システムを認識しない
4. **evaluator.ts:2310付近** — `// Phase 3統合: Game × Will 意志駆動の戦略選択` というコメントプレースホルダが残っている（未実装）

---

## 統合の設計

### 統合レイヤー1: パズル × relation deep

**思想**: 数独の制約グループ（行・列・ブロック）は「縁起」そのもの。セルは独立しておらず、相互依存のネットワークの中で値が決まる。

| 既存の挙動 | 統合後の挙動 |
|-----------|------------|
| 制約グループ = 配列としてハードコード | 制約グループ = `entangle` で結合された Agent 群 |
| 制約伝播 = 手続き的ループ | 制約伝播 = `influence` スコアで波及効果を定量化 |
| 解法過程 = ラウンドログ | 解法過程 = `trace` で全依存チェーンを可視化 |

**具体的な変更:**

```typescript
// agent-space.ts: createPuzzleAgentSpace() 内
// 同じ行/列/ブロックのセルAgent同士を entangle で結合
for (const group of constraintGroups) {
  for (let i = 0; i < group.cells.length; i++) {
    for (let j = i + 1; j < group.cells.length; j++) {
      // group.type = 'row' | 'column' | 'block'
      createEntanglement(
        agentA.sigmaMeta, agentB.sigmaMeta,
        group.type  // entangleの種類として制約タイプを渡す
      );
    }
  }
}
```

**新しいパイプコマンド:**

```rei
let p = sudoku(grid)
p |> agent_solve |> trace        // 解法の依存チェーン全体を表示
p |> agent_solve |> influence("R1C1")  // 特定セルの影響範囲を定量化
```

**検証テスト（提案）:**

- パズルAgent化時に entanglement が正しく生成される（行×列×ブロック）
- 確定セルの influence スコアが高い（多くの他セルの候補を消去するため）
- trace が制約伝播の因果チェーンを正確に反映する
- 孤立セル（候補が1つ）の trace.maxDepth が 0 である

---

### 統合レイヤー2: ゲーム × will deep

**思想**: ゲームのプレイヤーは「意志」を持つ存在。戦略選択は意志の表明であり、対局は意志の衝突と調和のプロセスである。

| 既存の挙動 | 統合後の挙動 |
|-----------|------------|
| 戦略 = 文字列 ("minimax", "random") | 戦略 = will.tendency + will.strength |
| 対局 = 機械的ターン交代 | 対局 = 毎ターン will_evolve で意志更新 |
| 勝敗 = 結果のみ | 勝敗 = will_conflict で対立の構造を分析 |

**具体的な変更:**

```typescript
// agent-space.ts: ゲームAgent の decide() 内
// 手を打つ前に意志を進化させる
const evolution = evolveWill(agent.value, agent.sigmaMeta);
// evolution.prediction を考慮して手を選択

// 対局後の分析
const conflict = detectWillConflict(
  player1.sigmaMeta, player2.sigmaMeta
);
// conflict.resolutions で対局のダイナミクスを説明
```

**新しいパイプコマンド:**

```rei
let g = game("tictactoe")
g |> agent_play("competitive", "cooperative")
g |> will_conflict("player2")   // 対立構造の分析
g |> will_align("player2")      // 協力ゲームでの意志調律
```

**検証テスト（提案）:**

- competitive Agent の will.tendency が "expand" または "compete" である
- cooperative Agent の will.tendency が "cooperate" または "defend" である
- will_evolve が対局の経過に応じて strength を更新する
- will_conflict が minimax vs random で明確な対立を検出する
- will_align が cooperative vs cooperative で高い調和スコアを返す

---

### 統合レイヤー3: Entity Agent σ の深化

**思想**: Agent の自己記述（σ）は、6属性の「浅い」サマリーから「深い」構造情報への進化。

**具体的な変更:**

```typescript
// entity-agent.ts: sigma() メソッドの拡張
sigma(): AgentSigma {
  // ... 既存のコード ...
  return {
    // ... 既存のフィールド ...
    relation: {
      bindingCount: this._bindings.length,
      bindings: this._bindings,
      // ★ 新規: sigma-deep の relation 情報
      entanglements: this._sigmaMeta?.relation?.entanglements ?? [],
      dependencies: this._sigmaMeta?.relation?.dependencies ?? [],
      isolated: this._sigmaMeta?.relation?.isolated ?? true,
    },
    will: {
      intention: this._intention,
      satisfaction: this._intention?.satisfaction ?? 0,
      // ★ 新規: sigma-deep の will 情報
      tendency: this._sigmaMeta?.will?.tendency ?? 'neutral',
      strength: this._sigmaMeta?.will?.strength ?? 0,
      intrinsic: this._sigmaMeta?.will?.intrinsic ?? 'neutral',
      prediction: this._sigmaMeta?.will?.prediction,
      history: this._sigmaMeta?.will?.history ?? [],
    },
  };
}
```

---

### 統合レイヤー4: Mediator × will

**思想**: 競合解決は「意志の調停」。Mediator は単なるスケジューラではなく、Agent 群の意志を調和させる存在。

**具体的な変更:**

```typescript
// mediator.ts: resolveConflict() 内
// 既存: priority ベースの機械的解決
// 新規: will_align を使った調和的解決（cooperative 戦略時）

if (this.strategy === 'cooperative') {
  const alignment = alignWills(agent1.sigmaMeta, agent2.sigmaMeta);
  if (alignment.harmonizedTendency) {
    // 調和された意志に基づいて解決
    return resolveByHarmony(alignment);
  }
}
```

---

## 実装優先順位

| 優先度 | タスク | 推定行数 | 推定テスト数 | 依存関係 |
|-------|--------|---------|------------|---------|
| P1 | パズル × entangle/trace/influence 統合 | +120行 | +15テスト | なし |
| P2 | ゲーム × will_evolve/will_conflict 統合 | +100行 | +15テスト | なし |
| P3 | Entity Agent σ の深化 | +40行 | +8テスト | P1, P2 |
| P4 | Mediator × will_align 統合 | +60行 | +8テスト | P3 |
| P5 | 横断テスト（パズル+ゲーム混合シナリオ） | - | +10テスト | P1-P4 |

推定合計: **+320行**, **+56テスト** → テスト総数 ~983

---

## 横断テストシナリオ（P5）

### シナリオ A: 数独の「縁起的解法」
```rei
let p = sudoku(grid)
let result = p |> agent_solve
// 期待: result 内に entanglement 情報が含まれる
// 期待: result.agentSigmas[*].relation.entanglements.length > 0
// 期待: trace が制約伝播の全因果チェーンを返す
```

### シナリオ B: 三目並べの「意志駆動対局」
```rei
let g = game("tictactoe")
let result = g |> agent_play("competitive", "cooperative")
// 期待: 各ターンで will が進化している
// 期待: will_conflict が検出される（competitive vs cooperative）
// 期待: competitive Agent の will.strength が対局後に上昇
```

### シナリオ C: 6属性の一貫性検証
```
任意のAgentSpaceの実行結果に対して:
- field: 環境状態が正確に反映
- flow: ラウンド/ターン進行の velocity/acceleration が計算される
- memory: 全アクションが記録されている
- layer: 推論深度が正しい
- relation: entanglement/dependency が反映されている ← NEW
- will: tendency/strength/history が反映されている ← NEW
```

---

## 成功基準

Phase 4d安定化が完了した状態とは：

> 6属性が個別の機能としてだけでなく、
> AgentSpace/Entity Agent/Mediator の中で**統合的に動作**し、
> パズルの「縁起的解法」とゲームの「意志駆動対局」が
> Reiの哲学を**コードレベルで体現**している状態。

具体的には：
1. ✅ パズルAgent が entangle で結合され、trace/influence で解法過程を説明できる
2. ✅ ゲームAgent が will_evolve で戦略を進化させ、will_conflict で対立を分析できる
3. ✅ Entity Agent の σ が sigma-deep の豊かな relation/will 構造を含む
4. ✅ Mediator が will_align を使った調和的競合解決ができる
5. ✅ 全テスト pass（既存927 + 新規56 = ~983）
6. ✅ 既存のベンチマーク・チュートリアルが引き続き動作する

---

## 技術ノート

- `sigma-deep.ts` の関数群（`traceRelationChain`, `computeInfluence`, `createEntanglement`, `evolveWill`, `alignWills`, `detectWillConflict`）は全て `DeepSigmaMeta` を引数に取る → Agent が内部に `DeepSigmaMeta` を保持する必要がある
- `entity-agent.ts` の `ReiAgent` は現在 `_sigmaMeta` を持っていない → 追加が必要（P3）
- `agent-space.ts` の `createPuzzleAgentSpace()` と `createGameAgentSpace()` が統合のエントリポイント
- evaluator.ts:2310 付近の `// Phase 3統合: Game × Will` プレースホルダは P2 で対応
