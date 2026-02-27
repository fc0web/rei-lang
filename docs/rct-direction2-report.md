# RCT 方向2完了 — compress / decompress Reiコマンド実装

**Date**: 2026-02-13  
**Author**: Nobuki Fujimoto (藤本 伸樹) & Claude

---

## 実装結果: 全11テスト通過 ✅

### 新しいReiパイプコマンド

| コマンド | 日本語 | 機能 |
|:---|:---|:---|
| `compress` | `圧縮` | データを生成パラメータθに圧縮 |
| `decompress` | `復元` | 生成パラメータθから元データを復元 |
| `compress_info` | `圧縮情報` | 圧縮メタデータ（型・率・サイズ） |

### 使用例

```rei
// 数値配列の圧縮
[1, 2, 3, 4, 5, 1, 2, 3, 4, 5] |> compress
// → CompressedRei { type: "periodic", ratio: 60% }

// 圧縮→復元（完全可逆）
[10, 20, 30, 40, 50] |> compress |> decompress
// → [10, 20, 30, 40, 50]

// 文字列も圧縮可能
"hello world" |> compress |> decompress
// → "hello world"

// 圧縮情報
[1, 2, 3, 1, 2, 3] |> compress_info
// → { type: "periodic", improvement: "66.7% 削減" }

// 日本語コマンド
[1, 1, 1, 1, 1] |> 圧縮 |> 復元
// → [1, 1, 1, 1, 1]
```

### 対応データ型

| 入力型 | 圧縮方式 | 復元型 |
|:---|:---|:---|
| 数値配列 | 12パターン自動選択 | 数値配列 |
| 文字列 | UTF-8バイト列として圧縮 | 文字列 |
| 数値 | 単一要素配列 | 数値 |
| オブジェクト | JSON→バイト列 | オブジェクト |

### 変更ファイル

| ファイル | 変更内容 |
|:---|:---|
| `src/lang/parser.ts` | `parsePipeCommand` に `COMPRESS` トークン追加 (1行) |
| `src/lang/evaluator.ts` | RCT import追加 + compress/decompress/compress_info ハンドラ + ヘルパー関数 (~100行) |
| `theory/theories-67.ts` | 方向1で完成済み（変更なし） |
| `tests/rct_compress.test.ts` | 新規テスト (13テストケース) |

### テスト結果

```
✅ 数値配列 compress
✅ 圧縮→復元(配列)
✅ compress_info
✅ 等差数列
✅ 定数列
✅ 文字列 compress
✅ 文字列 復元
✅ 日本語 圧縮
✅ 日本語 復元
✅ 日本語 圧縮情報
✅ 大等差
```

---

## 次のステップ

- **方向3**: LLM連携による意味的圧縮（フェーズ2）
- **方向4**: note.com記事発表
