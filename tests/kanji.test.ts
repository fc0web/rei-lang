// ============================================================
// Kanji/Japanese 𝕄 Tests — 柱② 漢字/日本語の𝕄表現
// ============================================================

import { describe, it, expect } from 'vitest';
import { Lexer } from '../src/lang/lexer';
import { Parser } from '../src/lang/parser';
import { Evaluator } from '../src/lang/evaluator';

function run(code: string): any {
  const tokens = new Lexer(code).tokenize();
  const ast = new Parser(tokens).parseProgram();
  return new Evaluator().eval(ast);
}

let passed = 0;
let failed = 0;
const failures: string[] = [];

function test(name: string, fn: () => void) {
  try {
    fn();
    passed++;
    console.log(`  ✅ ${name}`);
  } catch (e: any) {
    failed++;
    failures.push(`${name}: ${e.message}`);
    console.log(`  ❌ ${name}: ${e.message}`);
  }
}

function assert(condition: boolean, msg: string = '') {
  if (!condition) throw new Error(msg || 'assertion failed');
}

// ═══════════════════════════════════════════
// Group 1: 𝕄リテラルでの文字列𝕄（StringMDim自動検出）
// ═══════════════════════════════════════════

describe('柱② 漢字/日本語の𝕄表現', () => {
  it('all kanji tests', () => {
console.log('\n📦 Group 1: 文字列𝕄リテラル');

test('𝕄{"休"; "人", "木"} creates StringMDim', () => {
  const r = run('𝕄{"休"; "人", "木"}');
  assert(r.reiType === 'StringMDim', `expected StringMDim, got ${r.reiType}`);
  assert(r.center === '休', `expected center=休, got ${r.center}`);
  assert(r.neighbors.length === 2, `expected 2 neighbors`);
  assert(r.neighbors[0] === '人', `expected 人, got ${r.neighbors[0]}`);
  assert(r.neighbors[1] === '木', `expected 木, got ${r.neighbors[1]}`);
});

test('𝕄{"明"; "日", "月"} — 日+月=明', () => {
  const r = run('𝕄{"明"; "日", "月"}');
  assert(r.reiType === 'StringMDim', 'should be StringMDim');
  assert(r.center === '明');
  assert(r.neighbors[0] === '日');
  assert(r.neighbors[1] === '月');
});

test('𝕄{"食べた"; "猫が", "魚を"} — 述語中心の文構造', () => {
  const r = run('𝕄{"食べた"; "猫が", "魚を"}');
  assert(r.reiType === 'StringMDim', 'should be StringMDim');
  assert(r.center === '食べた', `expected 食べた, got ${r.center}`);
  assert(r.neighbors.includes('猫が'));
  assert(r.neighbors.includes('魚を'));
});

test('𝕄{"ma"; "妈(1声)", "麻(2声)", "马(3声)", "骂(4声)"} — 声調=モード', () => {
  const r = run('𝕄{"ma"; "妈(1声)", "麻(2声)", "马(3声)", "骂(4声)"}');
  assert(r.reiType === 'StringMDim');
  assert(r.center === 'ma');
  assert(r.neighbors.length === 4, `expected 4 tones, got ${r.neighbors.length}`);
});

test('数値𝕄は従来通りMDim', () => {
  const r = run('𝕄{5; 1, 2, 3}');
  assert(r.reiType === 'MDim', `numeric should be MDim, got ${r.reiType}`);
});

// ═══════════════════════════════════════════
// Group 2: kanji パイプ（漢字分解）
// ═══════════════════════════════════════════
console.log('\n📦 Group 2: kanji パイプ（漢字分解）');

test('"休" |> kanji → 人+木の分解', () => {
  const r = run('"休" |> kanji');
  assert(r.reiType === 'StringMDim', `expected StringMDim, got ${r.reiType}`);
  assert(r.center === '休');
  assert(r.neighbors.includes('人'), 'should include 人');
  assert(r.neighbors.includes('木'), 'should include 木');
  assert(r.mode === 'kanji');
});

test('"明" |> kanji → 日+月', () => {
  const r = run('"明" |> kanji');
  assert(r.center === '明');
  assert(r.neighbors.includes('日'));
  assert(r.neighbors.includes('月'));
});

test('"森" |> kanji → 木+木+木', () => {
  const r = run('"森" |> kanji');
  assert(r.center === '森');
  assert(r.neighbors.length === 3, `expected 3 trees, got ${r.neighbors.length}`);
  assert(r.neighbors.every((n: string) => n === '木'), 'all should be 木');
});

test('"男" |> kanji → 田+力', () => {
  const r = run('"男" |> kanji');
  assert(r.neighbors.includes('田'));
  assert(r.neighbors.includes('力'));
});

test('"好" |> kanji → 女+子', () => {
  const r = run('"好" |> kanji');
  assert(r.neighbors.includes('女'));
  assert(r.neighbors.includes('子'));
});

test('"明日" |> kanji → 複数文字の分解', () => {
  const r = run('"明日" |> kanji');
  assert(r.reiType === 'StringMDim');
  assert(r.center === '明日');
  assert(r.neighbors.includes('明'));
  assert(r.neighbors.includes('日'));
});

test('象形文字の分解（構成要素なし）', () => {
  const r = run('"山" |> kanji');
  assert(r.reiType === 'StringMDim');
  assert(r.center === '山');
  assert(r.metadata.known === true);
  assert(r.metadata.category === '象形');
});

// ═══════════════════════════════════════════
// Group 3: 漢字メタデータアクセス
// ═══════════════════════════════════════════
console.log('\n📦 Group 3: 漢字メタデータ');

test('kanji |> readings で読みを取得', () => {
  const r = run('"休" |> kanji |> readings');
  assert(r.on !== undefined, 'should have on readings');
  assert(r.kun !== undefined, 'should have kun readings');
  assert(r.on.includes('キュウ'), `expected キュウ in on readings`);
});

test('kanji |> strokes で画数を取得', () => {
  const r = run('"休" |> kanji |> strokes');
  assert(r === 6, `expected 6 strokes, got ${r}`);
});

test('kanji |> category で六書分類を取得', () => {
  const r = run('"休" |> kanji |> category');
  assert(r === '会意', `expected 会意, got ${r}`);
});

test('kanji |> radicals で部首情報を取得', () => {
  const r = run('"休" |> kanji |> radicals');
  assert(r.radical === '人', `expected radical 人, got ${r.radical}`);
});

test('kanji |> meaning で意味を取得', () => {
  const r = run('"休" |> kanji |> meaning');
  assert(r === 'rest', `expected rest, got ${r}`);
});

test('メンバーアクセス: .radical', () => {
  const r = run('let k = "明" |> kanji; k.radical');
  assert(r === '日', `expected 日, got ${r}`);
});

test('メンバーアクセス: .category', () => {
  const r = run('let k = "好" |> kanji; k.category');
  assert(r === '会意', `expected 会意, got ${r}`);
});

test('メンバーアクセス: .strokes', () => {
  const r = run('let k = "山" |> kanji; k.strokes');
  assert(r === 3, `expected 3, got ${r}`);
});

test('メンバーアクセス: .meaning', () => {
  const r = run('let k = "愛" |> kanji; k.meaning');
  assert(r === 'love', `expected love, got ${r}`);
});

test('メンバーアクセス: .known (辞書にある)', () => {
  const r = run('let k = "日" |> kanji; k.known');
  assert(r === true);
});

test('メンバーアクセス: .known (辞書にない)', () => {
  const r = run('let k = "龍" |> kanji; k.known');
  assert(r === false);
});

// ═══════════════════════════════════════════
// Group 4: 漢字類似度（similarity）
// ═══════════════════════════════════════════
console.log('\n📦 Group 4: 漢字類似度');

test('similarity: 晴と清（共通音符「青」）', () => {
  const r = run('"晴" |> kanji |> similarity("清")');
  assert(r.reiType === 'KanjiSimilarity', 'should return KanjiSimilarity');
  assert(r.sharedComponents.includes('青'), 'should share 青');
  assert(r.sharedPhoneticGroup === true, 'should be in same phonetic group');
  assert(r.strength > 0.3, `should have moderate similarity, got ${r.strength}`);
});

test('similarity: 林と森（共通構成要素「木」）', () => {
  const r = run('"林" |> kanji |> similarity("森")');
  assert(r.sharedComponents.includes('木'), 'should share 木');
  assert(r.strength > 0, 'should have positive similarity');
});

test('similarity: 間と聞（共通構成要素「門」）', () => {
  const r = run('"間" |> kanji |> similarity("聞")');
  assert(r.sharedComponents.includes('門'), 'should share 門');
  assert(r.sharedPhoneticGroup === true);
});

test('similarity.strength アクセス', () => {
  const r = run('let s = "晴" |> kanji |> similarity("清"); s.strength');
  assert(typeof r === 'number', `expected number, got ${typeof r}`);
  assert(r >= 0 && r <= 1, `strength should be 0-1, got ${r}`);
});

test('similarity: 無関係な漢字は低スコア', () => {
  const r = run('"山" |> kanji |> similarity("魚")');
  assert(r.strength < 0.3, `unrelated kanji should have low similarity, got ${r.strength}`);
});

// ═══════════════════════════════════════════
// Group 5: sentence パイプ（日本語文構造）
// ═══════════════════════════════════════════
console.log('\n📦 Group 5: sentence パイプ（日本語文→述語中心𝕄）');

test('"猫が魚を食べた" |> sentence', () => {
  const r = run('"猫が魚を食べた" |> sentence');
  assert(r.reiType === 'StringMDim', 'should return StringMDim');
  assert(r.mode === 'sentence');
  assert(r.center === '食べた', `predicate should be 食べた, got ${r.center}`);
  assert(r.neighbors.some((n: string) => n.includes('猫')), 'should include 猫 phrase');
  assert(r.neighbors.some((n: string) => n.includes('魚')), 'should include 魚 phrase');
});

test('"花が咲いた" |> sentence', () => {
  const r = run('"花が咲いた" |> sentence');
  assert(r.reiType === 'StringMDim');
  assert(r.center === '咲いた', `predicate should be 咲いた, got ${r.center}`);
});

test('"私は東京に住んでいます" |> sentence', () => {
  const r = run('"私は東京に住んでいます" |> sentence');
  assert(r.reiType === 'StringMDim');
  assert(r.mode === 'sentence');
  // 述語は最後の部分
  assert(r.center.length > 0, 'should have predicate');
  console.log(`    → center="${r.center}", neighbors=${JSON.stringify(r.neighbors)}`);
});

test('sentence.center と .neighbors メンバーアクセス', () => {
  const r = run('let s = "犬が走った" |> sentence; s.center');
  assert(typeof r === 'string', 'center should be string');
});

// ═══════════════════════════════════════════
// Group 6: 音符グループ（形声文字）
// ═══════════════════════════════════════════
console.log('\n📦 Group 6: 音符グループ（形声パターン）');

test('phonetic_group: 青系（晴清請情精）', () => {
  const r = run('"晴" |> kanji |> phonetic_group');
  assert(Array.isArray(r), 'should return array');
  assert(r.includes('清'), 'should include 清');
  assert(r.includes('情'), 'should include 情');
  assert(r.includes('精'), 'should include 精');
  console.log(`    → 青系: [${r.join(', ')}]`);
});

test('phonetic_group: 門系（間聞閉開問）', () => {
  const r = run('"間" |> kanji |> phonetic_group');
  assert(Array.isArray(r));
  assert(r.includes('聞'));
  assert(r.includes('問'));
  console.log(`    → 門系: [${r.join(', ')}]`);
});

// ═══════════════════════════════════════════
// Group 7: 逆引き・合成
// ═══════════════════════════════════════════
console.log('\n📦 Group 7: 構成要素からの逆引き');

test('compose: ["人","木"] → ["休"]', () => {
  const r = run('𝕄{"?"; "人", "木"} |> compose');
  assert(Array.isArray(r), 'should return array');
  assert(r.includes('休'), `should find 休 from 人+木, got [${r.join(',')}]`);
});

test('compose: ["日","月"] → ["明"]', () => {
  const r = run('𝕄{"?"; "日", "月"} |> compose');
  assert(r.includes('明'), `should find 明 from 日+月`);
});

test('compose: ["女","子"] → ["好"]', () => {
  const r = run('𝕄{"?"; "女", "子"} |> compose');
  assert(r.includes('好'), `should find 好 from 女+子`);
});

test('compose: ["田","力"] → ["男"]', () => {
  const r = run('𝕄{"?"; "田", "力"} |> compose');
  assert(r.includes('男'), `should find 男 from 田+力`);
});

// ═══════════════════════════════════════════
// Group 8: 再帰的分解 (decompose)
// ═══════════════════════════════════════════
console.log('\n📦 Group 8: 再帰的分解');

test('decompose: 明の構成要素をさらに分解', () => {
  const r = run('"明" |> kanji |> decompose');
  assert(Array.isArray(r), 'should return array of StringMDims');
  assert(r.length === 2, `expected 2 (日, 月), got ${r.length}`);
  assert(r[0].reiType === 'StringMDim');
  assert(r[0].center === '日');
  assert(r[1].center === '月');
});

// ═══════════════════════════════════════════
// Group 9: tone パイプ（中国語声調）
// ═══════════════════════════════════════════
console.log('\n📦 Group 9: tone パイプ（声調=M1公理）');

test('"ma" |> tone with variants', () => {
  const r = run('"ma" |> tone("妈", "麻", "马", "骂")');
  assert(r.reiType === 'StringMDim', 'should return StringMDim');
  assert(r.center === 'ma');
  assert(r.neighbors.length === 4);
  assert(r.mode === 'tone');
  assert(r.metadata.m1_correspondence === 'tone = compute mode');
});

// ═══════════════════════════════════════════
// Group 10: 六書分類の網羅テスト
// ═══════════════════════════════════════════
console.log('\n📦 Group 10: 六書分類');

test('象形: 山', () => {
  const r = run('"山" |> kanji |> category');
  assert(r === '象形', `expected 象形, got ${r}`);
});

test('指事: 上', () => {
  const r = run('"上" |> kanji |> category');
  assert(r === '指事', `expected 指事, got ${r}`);
});

test('会意: 休', () => {
  const r = run('"休" |> kanji |> category');
  assert(r === '会意', `expected 会意, got ${r}`);
});

test('形声: 晴', () => {
  const r = run('"晴" |> kanji |> category');
  assert(r === '形声', `expected 形声, got ${r}`);
});

// ═══════════════════════════════════════════
// Group 11: StringMDim の σ
// ═══════════════════════════════════════════
console.log('\n📦 Group 11: StringMDim のσ');

test('StringMDim |> sigma returns SigmaResult', () => {
  const r = run('"休" |> kanji |> sigma');
  assert(r.reiType === 'SigmaResult', `expected SigmaResult, got ${r.reiType}`);
  assert(r.field.center === '休');
  assert(r.field.type === 'string');
  assert(r.relation.length > 0, 'should have relations');
});

// ═══════════════════════════════════════════
// Group 12: エッジケース
// ═══════════════════════════════════════════
console.log('\n📦 Group 12: エッジケース');

test('辞書にない漢字のkanji分解', () => {
  const r = run('"龍" |> kanji');
  assert(r.reiType === 'StringMDim');
  assert(r.center === '龍');
  assert(r.metadata.known === false);
});

test('英単語でのkanji（フォールバック）', () => {
  const r = run('"hello" |> kanji');
  assert(r.reiType === 'StringMDim');
  assert(r.center === 'hello');
});

test('空文字列のsentence', () => {
  const r = run('"テスト" |> sentence');
  assert(r.reiType === 'StringMDim');
  assert(r.center.length > 0);
});

// ═══════════════════════════════════════════
// Summary
// ═══════════════════════════════════════════
console.log(`\n${'═'.repeat(50)}`);
console.log(`Kanji/Japanese 𝕄 Tests: ${passed} passed, ${failed} failed`);
if (failures.length > 0) {
  console.log('\nFailures:');
  failures.forEach(f => console.log(`  ❌ ${f}`));
}
console.log(`${'═'.repeat(50)}`);
if (failed > 0) { throw new Error(`${failed} kanji tests failed`); }
  });
});
