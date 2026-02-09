# GitHub 更新手順 — v0.1-spec

## 追加するファイル（3つ）

### 1. 仕様書を追加
- ファイル名: `spec/REI_SPEC_v0.1.md`
- 方法: Add file → Create new file → `spec/REI_SPEC_v0.1.md` と入力
- 内容: REI_SPEC_v0.1.md の全文を貼り付け
- コミットメッセージ: `spec: add Rei Language Specification v0.1`

### 2. NOTICE を更新
- 既存の NOTICE ファイルを開く → 鉛筆アイコン（Edit）
- ファイル末尾に NOTICE_ADDITIONS.txt の内容を追記
- コミットメッセージ: `legal: add protected computational model elements to NOTICE`

### 3. README.md を更新
- 既存の README.md を開く → 鉛筆アイコン（Edit）
- 適切な位置（Project Structure の前あたり）に README_ADDITIONS.txt の内容を追記
- コミットメッセージ: `docs: add unique syntactic constructs section to README`

## 反映後の確認

更新後のフォルダ構成:
```
rei-lang/
├── spec/
│   └── REI_SPEC_v0.1.md    ← NEW
├── src/
│   ├── core/
│   ├── gft/
│   ├── lang/
│   └── genesis/
├── docs/
│   ├── index.html
│   └── gft-pipeline-tracer.html
├── NOTICE                   ← UPDATED
└── README.md                ← UPDATED
```

## タグ付け（任意・Git CLI使用時）

```bash
git tag -a v0.1-spec -m "Rei Language Specification v0.1"
git push origin v0.1-spec
```

Web UIからはタグ作成できないため、
代替として Releases → Create a new release → Tag: v0.1-spec でも可。
