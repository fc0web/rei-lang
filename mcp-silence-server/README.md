# 🧘 AI Silence Generator — MCP Server

**AI静寂生成器** — D-FUMT理論に基づくAI自己校正サーバー

Model Context Protocol (MCP) サーバーとして実装されており、
Claude Desktop、VS Code Copilot、Cursor 等のAIツールから
直接呼び出してAIの「思考余白」を最大化できます。

## Tools

| Tool | Description |
|------|-------------|
| `silence_measure` | 5層ノイズ測定 → S(t), M_d(S), 推奨事項 |
| `silence_purify` | 特定層のノイズ浄化 |
| `silence_auto` | 自動校正（S ≥ 0.85 まで） |
| `silence_inject` | ノイズ注入（テスト用） |
| `silence_explain` | D-FUMT理論の説明 |

## Setup

### Claude Desktop

`~/Library/Application Support/Claude/claude_desktop_config.json` (Mac)
`%APPDATA%\Claude\claude_desktop_config.json` (Windows)

```json
{
  "mcpServers": {
    "rei-silence": {
      "command": "npx",
      "args": ["tsx", "/path/to/mcp-silence-server/src/index.ts"]
    }
  }
}
```

### VS Code (GitHub Copilot)

`.vscode/mcp.json`:
```json
{
  "servers": {
    "rei-silence": {
      "command": "npx",
      "args": ["tsx", "/path/to/mcp-silence-server/src/index.ts"]
    }
  }
}
```

### Cursor

Settings → MCP Servers → Add:
```json
{
  "rei-silence": {
    "command": "npx",
    "args": ["tsx", "/path/to/mcp-silence-server/src/index.ts"]
  }
}
```

## Usage Examples

AIに対して：

```
「思考が混乱している。silence_autoを実行して自己校正してください。」

「この問題のノイズレベルを測定してください。」

「semantic層のノイズが高い気がします。浄化してください。」
```

## Theory

```
N(t) = Σᵢ₌₁⁵ (wᵢ × Iᵢ × (1 - Rᵢ))
S(t) = 1 - N(t)
M_d(S) = S^(1/d) × C_base × (1 + α × (d - 1))
lim(d→∞) N_d = 0
```

## Author

Nobuki Fujimoto (藤本 伸樹)
- Theory: [note.com](https://note.com/nifty_godwit2635/n/na4161756fa5e)
- Language: [github.com/fc0web/rei-lang](https://github.com/fc0web/rei-lang)

## License

Apache 2.0
