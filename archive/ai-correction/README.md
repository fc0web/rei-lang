# archive/ai-correction

元の場所:
- `src/extensions/ai-correction.ts`
- `tests/ai-correction.test.ts`

## 退避の理由

`ai-correction.ts` の日本語コメントが UTF-8 → cp932（Shift-JIS）→ UTF-8 の順でデコードされる過程で化けている。
`npm run lint`（`tsc --noEmit`）がこの 1 ファイルで 32 件の構文エラーを出し、`npm publish` の `prepublishOnly` が通らない状態になっていた。

## 復元できないこと

- cp932 を介して往復変換したバイト列には、Shift-JIS に存在しないコードポイントの箇所に不可逆な置換が入っている。Python で `text.encode('cp932', errors='replace').decode('utf-8', errors='replace')` を試すと **約 170 文字が `�` に落ちる**。この 170 文字は推測でしか埋められない。
- `git log -- src/extensions/ai-correction.ts` の履歴は初回コミット (`a20ffad`) 1 本のみ。化ける前の版は git 履歴にもない。
- `grep -rn "ai-correction" src/ theory/ benchmarks/` の結果、ソース側からの import は 0 件。`dist/` にも入っていなかった（`src/index.ts` 等から参照されていなかったため）。npm 公開物には含まれない。

したがって、実害のあるファイルではないが、`tsc` を汚す実体として残すわけにもいかない。本ディレクトリに退避する。

## 対象外であること

- `tsconfig.json` の `include` は `src/**/*`, `theory/...`。`archive/` は含まれない。
- `vitest.config.ts` の `include` は `tests/**/*.test.ts`, `benchmarks/**/*.test.ts`。`archive/` は含まれない。
- `tsup.config.ts` の `entry` は `src/index.ts`。`archive/` は含まれない。
- `package.json` の `files` は `dist`, `bin`, `spec`, `theory`, `PEACE_USE_CLAUSE.md`, `README.md`, `LICENSE`。`archive/` は含まれない。

## 再興するとき

- このファイルの文字化けを人手で直す（コメントを日本語で書き直す、または英語に差し替える）。
- そのうえで `src/extensions/ai-correction.ts` と `tests/ai-correction.test.ts` に戻し、`tests/ai-correction.test.ts` の import を `../src/extensions/ai-correction` に戻す。
- `npm run lint && npm run test` で通ることを確かめる。
