# Rei CLI (0₀式/rei-shiki)

**Multi-dimensional structure management for AI-assisted workflows.**

Rei CLI creates structured project representations based on the four axioms of Rei language, and exports them as context files for AI chat (Claude, ChatGPT, etc).

> ⚡ All data is stored locally — no server communication. No telemetry. No cloud sync.

## Four Axioms (四公理)

| Axiom | Name | Japanese | Function |
|-------|------|----------|----------|
| A1 | Center-Periphery | 中心-周囲 | Every structure has a center and surrounding elements |
| A2 | Extension-Reduction | 拡張-縮約 | Structures grow or shrink |
| A3 | Sigma-Accumulation | σ蓄積 | Progress accumulates measurably |
| A4 | Genesis | 生成 | Structures emerge from creation |

## Six Attributes (六属性)

Every structure carries six attributes: **field** (場), **flow** (流), **memory** (記憶), **layer** (層), **relation** (関係), **will** (意志).

## Install

```bash
npm install -g rei-cli
```

Or use directly:
```bash
npx rei-cli init project "My Project" --periphery "Design,Build,Test"
```

## Quick Start

```bash
# 1. Create a project structure (A4: Genesis)
rei init project "プロダクトリリース" --periphery "設計,実装,テスト" --will "MVP完成"

# 2. Update progress (A3: Sigma Accumulation)
rei sigma update "プロダクトリリース" +100 "設計完了" --node "設計"
rei sigma update "プロダクトリリース" +40 "実装進行中" --node "実装"

# 3. Add context/decisions (Memory)
rei memory "プロダクトリリース" "アーキテクチャレビュー完了、MVC採用決定"

# 4. Expand scope (A2: Extension)
rei extend "プロダクトリリース" --add "ドキュメント,デプロイ"

# 5. Export for AI chat
rei export "プロダクトリリース" --format both

# 📎 Attach the exported .rei-context.json or .rei-context.md to your AI chat
```

## Commands

### `rei init <type> <name>` — Create Structure (A4: Genesis)

```bash
rei init project "Bug Fix Sprint" --periphery "Triage,Fix,Verify,Deploy"
rei init task "API設計" --periphery "仕様策定,実装,テスト" --field engineering
rei init idea "新機能案" --periphery "リサーチ,プロトタイプ,評価" --flow cyclical
rei init analysis "市場調査" --periphery "データ収集,分析,レポート"
rei init decision "技術選定" --periphery "候補洗い出し,比較,決定" --flow adaptive
```

Options:
- `-p, --periphery <items>` — Comma-separated periphery items (required)
- `-f, --field <field>` — Domain field (auto-inferred if omitted)
- `--flow <pattern>` — Flow pattern: sequential|parallel|cyclical|adaptive
- `-w, --will <goal>` — Goal/intention
- `-t, --tags <tags>` — Comma-separated tags
- `--target <number>` — Target sigma percentage
- `--seed <note>` — Genesis seed note

### `rei sigma update <name> <delta> <note>` — Update Progress (A3)

```bash
rei sigma update "Bug Fix" +100 "Triage complete" --node "Triage"
rei sigma update "Bug Fix" +50 "Fix in progress" --node "Fix"
```

Options:
- `-n, --node <name>` — Target a specific periphery node
- `-m, --memory <note>` — Also add a memory entry

### `rei sigma history <name>` — View Progress History

```bash
rei sigma history "Bug Fix" --count 20
```

### `rei export <name>` — Export for AI Chat

```bash
rei export "Bug Fix" --format json          # JSON only
rei export "Bug Fix" --format md            # Markdown only
rei export "Bug Fix" --format both          # Both (default)
rei export "Bug Fix" --compact              # Minimal JSON for token efficiency
rei export "Bug Fix" --stdout               # Print to stdout
```

### `rei list` — List All Structures

```bash
rei list          # Summary view
rei list -a       # Detailed view
```

### `rei view <name>` — View Structure Details

```bash
rei view "Bug Fix"
rei view "Bug Fix" --json    # Raw JSON output
```

### `rei extend <name>` — Add Periphery (A2: Extension)

```bash
rei extend "Bug Fix" --add "Documentation,Review"
```

### `rei reduce <name>` — Remove Periphery (A2: Reduction)

```bash
rei reduce "Bug Fix" --remove "Review"
```

### `rei memory <name> <note>` — Add Memory

```bash
rei memory "Bug Fix" "Root cause identified: race condition in auth module"
```

## AI Export Format

The exported `.rei-context.json` contains:

```json
{
  "_rei_context": "Rei Structure (0₀式): project — \"プロダクトリリース\"\nProgress: σ = 47%\n...",
  "structure": {
    "type": "project",
    "center": "プロダクトリリース",
    "periphery": [
      { "name": "設計", "progress": 100, "status": "done" },
      { "name": "実装", "progress": 40, "status": "active" }
    ],
    "overall_progress": 47
  },
  "memory": ["[2026-02-17] アーキテクチャレビュー完了"],
  "sigma": { "current": 47, "recent_changes": [...] },
  "prompt_hint": "Please help with this project. Currently active: 実装(40%)"
}
```

The `prompt_hint` field gives the AI a starting point for understanding your current state.

## Data Storage

- All data is stored in `.rei/` directory (project-local)
- Each structure is a `.rei.json` file
- **No server communication. No cloud sync. No telemetry.**
- Files can be version-controlled with Git

## Design Principles

1. **Local-first** — Your data never leaves your machine
2. **AI-native** — Designed to be attached to AI conversations
3. **Axiom-based** — Built on Rei's four-axiom mathematical framework
4. **Minimal** — Does one thing well: structure → AI context

## Author

**Nobuki Fujimoto** (藤本 伸樹)

- GitHub: [fc0web/rei-lang](https://github.com/fc0web/rei-lang)
- Theory: D-FUMT (Dimensional Fujimoto Universal Mathematical Theory)

## License

MIT
