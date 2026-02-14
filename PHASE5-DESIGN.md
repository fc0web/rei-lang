# Phase 5: マルチドメイン拡張 設計書

**Date:** 2026-02-15
**Author:** Nobuki Fujimoto (D-FUMT)
**Base:** Rei v0.5.3 (975 tests)

---

## アーキテクチャ

```
Phase 5: マルチドメイン拡張
├── 共通層: domains/shared/
│   ├── simulation-core.ts  （B/D共通：時間発展モデル）
│   ├── pipeline-core.ts    （C共通：データフロー抽象）
│   └── graph-core.ts       （B/C/D共通：ネットワーク構造）
├── B. domains/natural-science.ts  （自然科学）
├── C. domains/info-engineering.ts （情報工学）
└── D. domains/humanities.ts       （人文科学）
```

## 6属性との対応

| 属性 | 自然科学(B) | 情報工学(C) | 人文科学(D) |
|------|-----------|-----------|-----------|
| 場(field) | 力場・物理空間 | データスキーマ | 文脈・時代 |
| 流れ(flow) | 時間発展 | データフロー | 歴史の流れ |
| 記憶(memory) | 軌道履歴 | 変換ログ | 記録・伝承 |
| 層(layer) | スケール階層 | ステージ深度 | 抽象度 |
| 関係(relation) | 相互作用 | 依存関係 | 人間関係・因果 |
| 意志(will) | ポテンシャル | 最適化目標 | 倫理的意志 |
