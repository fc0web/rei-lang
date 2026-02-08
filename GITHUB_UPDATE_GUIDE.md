# GitHub リポジトリ更新ガイド

## 概要
このZIPの中身をそのまま `fc0web/rei-lang` リポジトリにコピーします。
全ファイルはテスト検証済み（110テスト全通過 + tsc型チェック通過）。
テストファイルのインポートパスは `src/genesis/` 配置に調整済みです。

---

## Step 1: ZIPの中身をリポジトリにコピー

以下のファイルをリポジトリのルートに上書きコピー：

```
src/genesis/genesis-axioms-v2.ts      ← GA-v2（witness系 + CS仮定）
src/genesis/irreversible-syntax.ts    ← ISL（不可逆構文層 v3）
tests/irreversible-syntax.test.ts     ← 110テスト（パス調整済み）
docs/index.html                       ← GitHub Pages ランディング
docs/gft-pipeline-tracer.html         ← GFTデバッグ・教育ツール
.gitignore                            ← ビルド成果物除外
```

---

## Step 2: 既存ファイル移動

```bash
# ルートの例示ファイルを examples/ に移動
git mv benchmarks.ts examples/benchmarks.ts
git mv gft-demo.ts examples/gft-demo.ts
```

---

## Step 3: 不要ファイル削除（推奨）

```bash
# ビルド成果物はGitHub Releasesに移行
git rm rei-lang-1.0.0.tgz
git rm rei-lang-apache2.zip
```

※ これらは `Releases` タブにアップロードし直す方がプロフェッショナルです

---

## Step 4: README.md 更新

`README_ADDITIONS.md` の内容を既存 README.md に統合：
- 「Genesis Axiom System」セクションの後に「GA-v2」「ISL」「GFT Pipeline Tracer」セクション追加
- 「Project Structure」セクションを更新版に差し替え

---

## Step 5: GitHub Pages 有効化

1. GitHub → Settings → Pages
2. Source: `Deploy from a branch`
3. Branch: `main`, Folder: `/docs`
4. Save

→ `https://fc0web.github.io/rei-lang/` でアクセス可能に

---

## Step 6: コミット & プッシュ

```bash
git add .
git commit -m "feat: add ISL (Irreversible Syntax Layer), GA-v2, GFT Pipeline Tracer

- src/genesis/genesis-axioms-v2.ts: witness system, CS assumption, monotonicity
- src/genesis/irreversible-syntax.ts: type-safe pipeline (Open→Sealed→Compacted)
- tests/irreversible-syntax.test.ts: 110 tests (79 GA-v2 + 31 adversarial)
- docs/gft-pipeline-tracer.html: interactive debug & education tool
- docs/index.html: GitHub Pages landing
- .gitignore: exclude build artifacts
- Move benchmarks.ts, gft-demo.ts to examples/
- Remove .tgz and .zip from repo (use Releases)"

git push origin main
```

---

## 更新後のフォルダ構成

```
rei-lang/
├── src/
│   ├── core/
│   ├── gft/
│   ├── lang/
│   └── genesis/                    ← NEW
│       ├── genesis-axioms-v2.ts
│       └── irreversible-syntax.ts
├── tests/
│   ├── (既存テスト)
│   └── irreversible-syntax.test.ts ← NEW
├── docs/                           ← NEW
│   ├── index.html
│   └── gft-pipeline-tracer.html
├── examples/
│   ├── benchmarks.ts               ← MOVED
│   └── gft-demo.ts                 ← MOVED
├── theory/
├── .gitignore                      ← NEW
├── CITATION.cff
├── LICENSE
├── NOTICE
├── README.md                       ← UPDATED
├── package.json
├── tsconfig.json
├── tsup.config.ts
└── vitest.config.ts
```
