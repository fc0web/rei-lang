# Rei CLI — リポジトリ統合ガイド

## 手順

### 1. packages/cli/ をリポジトリに配置

```bash
cd ~/rei-lang  # (既存のrei-langリポジトリ)

# tar.gz を展開して packages/cli/ にコピー
# もしくは、ダウンロードしたフォルダをそのまま配置:
cp -r <ダウンロード先>/packages/cli packages/cli
```

最終的なディレクトリ構造:
```
rei-lang/
├── src/                    # 既存Reiコア
├── packages/
│   └── cli/
│       ├── bin/
│       │   └── rei         # エントリポイント
│       ├── src/
│       │   ├── index.ts    # CLI メイン
│       │   ├── core/
│       │   │   ├── types.ts     # 四公理+六属性 型定義
│       │   │   ├── builder.ts   # MDim構造ビルダー
│       │   │   └── storage.ts   # ローカルI/O
│       │   └── commands/
│       │       ├── init.ts      # rei init (A4: Genesis)
│       │       ├── sigma.ts     # rei sigma (A3: σ蓄積)
│       │       ├── export.ts    # rei export (AI添付)
│       │       ├── list-view.ts # rei list / view
│       │       └── extend.ts    # rei extend/reduce/memory (A2)
│       ├── package.json
│       ├── tsconfig.json
│       ├── README.md
│       └── .gitignore
├── ...
```

### 2. 依存インストール & ビルド

```bash
cd packages/cli
npm install
npm run build
chmod +x bin/rei
```

### 3. 動作確認

```bash
# ヘルプ表示
node dist/index.js --help

# テスト実行
node dist/index.js init project "テスト" --periphery "A,B,C"
node dist/index.js list
node dist/index.js sigma update "テスト" +50 "進捗" --node "A"
node dist/index.js export "テスト" --format both
```

### 4. ローカルリンク (開発中に `rei` コマンドとして使う)

```bash
cd packages/cli
npm link
# これで `rei` コマンドがグローバルで使えるようになる
rei --help
```

### 5. Git コミット

```bash
cd ~/rei-lang
git add packages/cli/
git commit -m "feat: add rei-cli prototype (packages/cli)

- CLI tool for creating/managing Rei MDim structures
- Commands: init, sigma, export, list, view, extend, reduce, memory
- AI chat export format (JSON + Markdown)
- Local-only storage (no server communication)
- 1,110 lines TypeScript, 8 source files
- Four axioms (A1-A4) + six attributes implementation"
```

### 6. npm 公開 (準備ができたら)

```bash
cd packages/cli
npm login
npm publish --access public
# → @rei-lang/cli として公開される
# → `npx @rei-lang/cli init project "test" --periphery "a,b,c"` で使える
```

## ルートの package.json にワークスペースを追加する場合 (任意)

既存の `rei-lang/package.json` にワークスペース設定を追加:

```json
{
  "workspaces": [
    "packages/*"
  ]
}
```

これにより `npm install` がルートから一括で依存を管理できます。

## 次のステップ

1. **記事化**: Qiita/Zennで「Rei CLI — AIチャット用の構造化コンテキスト管理ツール」
2. **npm publish**: `@rei-lang/cli` として公開
3. **#17 第三者検証**: CLIの使用体験を第三者に依頼
