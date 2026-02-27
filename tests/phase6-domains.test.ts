/**
 * Phase 6: 新ドメイン + 型システム テスト
 */

import { describe, test, expect, beforeEach } from 'vitest';
import { rei } from '../src/index';
import { colorHarmony, generateFractal, generateLSystem, analyzeAesthetics } from '../src/lang/domains/art';
import { createScale, createChord, createRhythm, createMelody, analyzeProgression } from '../src/lang/domains/music';
import { supplyDemand, createMarket, marketRun, createGame } from '../src/lang/domains/economics';
import { parseSyntax, createSemanticFrame, analyzeWord, translate } from '../src/lang/domains/linguistics';
import { inferType, typeCheck, typeDomain, checkPipeCompatibility } from '../src/lang/type-system';

beforeEach(() => { rei.reset(); });

// ============================================================
// E. 芸術ドメイン
// ============================================================

describe('E.芸術: パターン生成', () => {
  test('fractal: マンデルブロ集合', () => {
    const r = generateFractal(10, 10, 30);
    expect(r.reiType).toBe('PatternResult');
    expect(r.type).toBe('fractal');
    expect(r.data.length).toBe(10);
    expect(r.data[0].length).toBe(10);
    // 全値は0-1の範囲
    expect(r.data.flat().every(v => v >= 0 && v <= 1)).toBe(true);
  });

  test('lsystem: L-Systemパターン', () => {
    const r = generateLSystem('F', { F: 'F+F-F' }, 2);
    expect(r.reiType).toBe('PatternResult');
    expect(r.type).toBe('lsystem');
    expect(r.data.length).toBeGreaterThan(0);
  });

  test('パイプ: fractal', () => {
    const r = rei('10 |> fractal(10, 20)');
    expect(r.reiType).toBe('PatternResult');
    expect(r.width).toBe(10);
  });

  test('パイプ: フラクタル (Japanese)', () => {
    const r = rei('8 |> フラクタル(8, 10)');
    expect(r.reiType).toBe('PatternResult');
  });
});

describe('E.芸術: 色彩理論', () => {
  test('color_harmony: 補色', () => {
    const r = colorHarmony(0, 'complementary');
    expect(r.reiType).toBe('ColorHarmony');
    expect(r.colors.length).toBe(2);
    expect(r.base.h).toBe(0);
    expect(r.colors[1].h).toBe(180);
  });

  test('color_harmony: 三色', () => {
    const r = colorHarmony(120, 'triadic');
    expect(r.colors.length).toBe(3);
  });

  test('パイプ: 色彩調和', () => {
    const r = rei('240 |> 色彩調和("analogous")');
    expect(r.reiType).toBe('ColorHarmony');
    expect(r.colors.length).toBe(3);
  });
});

describe('E.芸術: 美学分析', () => {
  test('aesthetics: パターン分析', () => {
    const pattern = generateFractal(10, 10, 20);
    const a = analyzeAesthetics(pattern);
    expect(a.reiType).toBe('AestheticAnalysis');
    expect(a.overallBeauty).toBeGreaterThanOrEqual(0);
    expect(a.overallBeauty).toBeLessThanOrEqual(1);
    expect(typeof a.style).toBe('string');
    expect(typeof a.ibushiGin).toBe('number');
  });

  test('パイプ: 美学分析', () => {
    const r = rei('10 |> fractal(10, 20) |> aesthetics');
    expect(r.reiType).toBe('AestheticAnalysis');
  });

  test('パイプ: art_sigma', () => {
    const r = rei('10 |> fractal(10, 20) |> art_sigma');
    expect(r.reiType).toBe('SigmaResult');
    expect(r.domain).toBe('art');
  });

  test('芸術σ (Japanese)', () => {
    const r = rei('180 |> 色彩調和("triadic") |> 芸術σ');
    expect(r.reiType).toBe('SigmaResult');
  });
});

// ============================================================
// F. 音楽ドメイン
// ============================================================

describe('F.音楽: 音階', () => {
  test('scale: Cメジャー', () => {
    const r = createScale('C', 'major');
    expect(r.reiType).toBe('ScaleResult');
    expect(r.root).toBe('C');
    expect(r.notes[0].name).toBe('C');
    expect(r.notes.length).toBe(8); // 7音 + オクターブ上のルート
    expect(r.intervals).toEqual([2, 2, 1, 2, 2, 2, 1]);
  });

  test('scale: ペンタトニック', () => {
    const r = createScale('A', 'pentatonic');
    expect(r.notes.length).toBe(6); // 5音 + 1
    expect(r.tension).toBeLessThan(0.3);
  });

  test('パイプ: 音階', () => {
    const r = rei('"C" |> 音階("minor")');
    expect(r.reiType).toBe('ScaleResult');
    expect(r.mode).toBe('minor');
  });
});

describe('F.音楽: 和声', () => {
  test('chord: Cメジャー', () => {
    const r = createChord('C', 'major');
    expect(r.reiType).toBe('ChordResult');
    expect(r.notes.length).toBe(3);
    expect(r.consonance).toBe(0.9);
    expect(r.function).toBe('tonic');
  });

  test('chord: G7（ドミナント）', () => {
    const r = createChord('G', '7');
    expect(r.notes.length).toBe(4);
    expect(r.function).toBe('dominant');
  });

  test('パイプ: 和音', () => {
    const r = rei('"E" |> 和音("minor")');
    expect(r.reiType).toBe('ChordResult');
    expect(r.type).toBe('minor');
  });
});

describe('F.音楽: リズム', () => {
  test('rhythm: 4拍子', () => {
    const r = createRhythm(4, 4, 0.5, 120);
    expect(r.reiType).toBe('RhythmPattern');
    expect(r.timeSignature).toEqual([4, 4]);
    expect(r.pattern.length).toBe(16);
    expect(r.pattern[0]).toBe(1); // 最初の拍は強拍
  });

  test('パイプ: リズム', () => {
    const r = rei('3 |> リズム(4, 0.3, 140)');
    expect(r.reiType).toBe('RhythmPattern');
    expect(r.timeSignature[0]).toBe(3);
  });
});

describe('F.音楽: メロディ', () => {
  test('melody: 段階的メロディ', () => {
    const scale = createScale('C', 'major');
    const m = createMelody(scale, 8, 'stepwise');
    expect(m.reiType).toBe('MelodyResult');
    expect(m.notes.length).toBe(8);
    expect(m.intervals.length).toBe(7);
    expect(typeof m.contour).toBe('string');
    expect(typeof m.resolution).toBe('number');
  });

  test('パイプ: 旋律', () => {
    const r = rei('"C" |> scale("pentatonic") |> 旋律(6)');
    expect(r.reiType).toBe('MelodyResult');
    expect(r.notes.length).toBe(6);
  });

  test('music_sigma', () => {
    const r = rei('"C" |> scale("major") |> music_sigma');
    expect(r.reiType).toBe('SigmaResult');
    expect(r.domain).toBe('music');
  });

  test('音楽σ (Japanese)', () => {
    const r = rei('"A" |> 和音("minor") |> 音楽σ');
    expect(r.reiType).toBe('SigmaResult');
  });
});

// ============================================================
// G. 経済学ドメイン
// ============================================================

describe('G.経済学: 需要供給', () => {
  test('supply_demand: 基本', () => {
    const r = supplyDemand(1, 0, -1, 100);
    expect(r.reiType).toBe('SupplyDemandResult');
    expect(r.equilibrium.price).toBe(50);
    expect(r.equilibrium.quantity).toBe(50);
  });

  test('パイプ: 需給', () => {
    const r = rei('1 |> 需給(0, -1, 100)');
    expect(r.reiType).toBe('SupplyDemandResult');
    expect(r.equilibrium.price).toBe(50);
  });
});

describe('G.経済学: 市場シミュ', () => {
  test('market: 作成', () => {
    const m = createMarket('test', 100, 5);
    expect(m.reiType).toBe('MarketState');
    expect(m.agents.length).toBe(5);
    expect(m.price).toBe(100);
  });

  test('market_run: 実行', () => {
    const m = marketRun(createMarket('test', 100, 5), 50);
    expect(m.history.length).toBe(51); // initial + 50
    expect(typeof m.volatility).toBe('number');
    expect(['bull', 'bear', 'stable']).toContain(m.trend);
  });

  test('パイプ: 市場', () => {
    const r = rei('"株式" |> 市場(100, 5) |> 市場実行(20)');
    expect(r.reiType).toBe('MarketState');
    expect(r.history.length).toBe(21);
  });

  test('economics_sigma', () => {
    const r = rei('"test" |> market(100, 5) |> market_run(10) |> economics_sigma');
    expect(r.reiType).toBe('SigmaResult');
    expect(r.domain).toBe('economics');
  });
});

describe('G.経済学: ゲーム理論', () => {
  test('game: 囚人のジレンマ', () => {
    const g = createGame('prisoners_dilemma');
    expect(g.reiType).toBe('GameTheoryResult');
    expect(g.nashEquilibria.length).toBeGreaterThan(0);
    // 囚人のジレンマのナッシュ均衡は（裏切り, 裏切り）
    expect(g.nashEquilibria[0].strategies).toEqual([1, 1]);
  });

  test('game: 鹿狩り', () => {
    const g = createGame('stag_hunt');
    expect(g.nashEquilibria.length).toBe(2); // (鹿,鹿) と (兎,兎)
  });

  test('パイプ: ゲーム理論', () => {
    const r = rei('"prisoners_dilemma" |> ゲーム理論');
    expect(r.reiType).toBe('GameTheoryResult');
  });

  test('経済σ (Japanese)', () => {
    const r = rei('"prisoners_dilemma" |> game_theory |> 経済σ');
    expect(r.reiType).toBe('SigmaResult');
    expect(r.domain).toBe('economics');
  });
});

// ============================================================
// H. 言語学ドメイン
// ============================================================

describe('H.言語学: 構文解析', () => {
  test('parse: 英語', () => {
    const r = parseSyntax('The cat is big');
    expect(r.reiType).toBe('SyntaxTree');
    expect(r.root.type).toBe('S');
    expect(r.depth).toBeGreaterThan(1);
    expect(r.nodeCount).toBeGreaterThan(1);
  });

  test('parse: 日本語', () => {
    const r = parseSyntax('猫は大きい');
    expect(r.reiType).toBe('SyntaxTree');
    expect(r.nodeCount).toBeGreaterThan(0);
  });

  test('パイプ: 構文解析', () => {
    const r = rei('"The dog is running" |> 構文解析');
    expect(r.reiType).toBe('SyntaxTree');
  });
});

describe('H.言語学: 意味フレーム', () => {
  test('semantic_frame: 基本', () => {
    const f = createSemanticFrame('eat', { agent: 'cat', patient: 'fish' });
    expect(f.reiType).toBe('SemanticFrame');
    expect(f.predicate).toBe('eat');
    expect(f.roles.length).toBe(2);
  });

  test('パイプ: 意味フレーム', () => {
    const r = rei('"run" |> 意味フレーム');
    expect(r.reiType).toBe('SemanticFrame');
  });
});

describe('H.言語学: 語分析', () => {
  test('word_analyze: 英語', () => {
    const r = analyzeWord('big');
    expect(r.reiType).toBe('WordRelation');
    expect(r.relations.length).toBeGreaterThan(0);
    expect(r.relations.some(r => r.type === 'synonym')).toBe(true);
  });

  test('word_analyze: 日本語', () => {
    const r = analyzeWord('美しい');
    expect(r.etymology).toBe('和語');
    expect(r.relations.length).toBeGreaterThan(0);
  });

  test('パイプ: 語分析', () => {
    const r = rei('"fast" |> 語分析');
    expect(r.reiType).toBe('WordRelation');
  });
});

describe('H.言語学: 翻訳', () => {
  test('translate: ja→en', () => {
    const r = translate('猫は大きい', 'ja', 'en');
    expect(r.reiType).toBe('TranslationResult');
    expect(r.source.lang).toBe('ja');
    expect(r.target.lang).toBe('en');
    expect(r.target.text).toContain('cat');
  });

  test('translate: en→ja', () => {
    const r = translate('cat book water', 'en', 'ja');
    expect(r.target.text).toContain('猫');
    expect(r.target.text).toContain('本');
  });

  test('パイプ: 翻訳', () => {
    const r = rei('"猫は大きい" |> 翻訳("ja", "en")');
    expect(r.reiType).toBe('TranslationResult');
  });

  test('linguistics_sigma', () => {
    const r = rei('"The cat is big" |> parse |> linguistics_sigma');
    expect(r.reiType).toBe('SigmaResult');
    expect(r.domain).toBe('linguistics');
  });

  test('言語σ (Japanese)', () => {
    const r = rei('"猫" |> 翻訳("ja", "en") |> 言語σ');
    expect(r.reiType).toBe('SigmaResult');
  });
});

// ============================================================
// 型システム
// ============================================================

describe('型システム: 型推論', () => {
  test('基本型推論', () => {
    expect(inferType(42)).toBe('Number');
    expect(inferType('hello')).toBe('String');
    expect(inferType(true)).toBe('Boolean');
    expect(inferType(null)).toBe('Null');
    expect(inferType([1, 2, 3])).toBe('Array');
    expect(inferType({ a: 1 })).toBe('Object');
  });

  test('Rei型推論', () => {
    expect(inferType({ reiType: 'SimulationSpace' })).toBe('SimulationSpace');
    expect(inferType({ reiType: 'MarketState' })).toBe('MarketState');
    expect(inferType({ reiType: 'SyntaxTree' })).toBe('SyntaxTree');
    expect(inferType({ reiType: 'SigmaResult' })).toBe('SigmaResult');
  });

  test('パイプ: 型', () => {
    expect(rei('42 |> 型')).toBe('Number');
    expect(rei('"hello" |> type_of')).toBe('String');
    expect(rei('[1, 2, 3] |> type_of')).toBe('Array');
  });
});

describe('型システム: 型チェック', () => {
  test('正常値の型チェック', () => {
    const r = typeCheck(42);
    expect(r.reiType).toBe('TypeCheckResult');
    expect(r.type).toBe('Number');
    expect(r.valid).toBe(true);
    expect(r.errors.length).toBe(0);
  });

  test('NaNの検出', () => {
    const r = typeCheck(NaN);
    expect(r.valid).toBe(false);
    expect(r.errors[0].kind).toBe('invalid_operation');
  });

  test('Infinityの警告', () => {
    const r = typeCheck(Infinity);
    expect(r.warnings.length).toBeGreaterThan(0);
  });

  test('空配列の警告', () => {
    const r = typeCheck([]);
    expect(r.warnings.some(w => w.kind === 'unsafe_operation')).toBe(true);
  });

  test('パイプ: 型検査', () => {
    const r = rei('42 |> 型検査');
    expect(r.reiType).toBe('TypeCheckResult');
    expect(r.valid).toBe(true);
  });
});

describe('型システム: ドメイン判定', () => {
  test('型ドメイン', () => {
    expect(typeDomain('Number')).toBe('core');
    expect(typeDomain('SimulationSpace')).toBe('natural_science');
    expect(typeDomain('MarketState')).toBe('economics');
    expect(typeDomain('SyntaxTree')).toBe('linguistics');
    expect(typeDomain('PatternResult')).toBe('art');
    expect(typeDomain('ScaleResult')).toBe('music');
  });

  test('パイプ: 型ドメイン', () => {
    expect(rei('"hello" |> 型ドメイン')).toBe('core');
  });
});

describe('型システム: パイプ互換性', () => {
  test('互換性あり', () => {
    const r = checkPipeCompatibility('SimulationSpace', 'sim_run');
    expect(r.compatible).toBe(true);
  });

  test('互換性なし', () => {
    const r = checkPipeCompatibility('String', 'sim_run');
    expect(r.compatible).toBe(false);
    expect(r.reason).toBeDefined();
  });

  test('制約なしコマンド', () => {
    const r = checkPipeCompatibility('String', 'map');
    expect(r.compatible).toBe(true);
  });

  test('type_sigma', () => {
    const r = rei('42 |> 型σ');
    expect(r.reiType).toBe('SigmaResult');
    expect(r.domain).toBe('type_system');
  });
});

// ============================================================
// 統合テスト
// ============================================================

describe('統合: ドメイン横断', () => {
  test('芸術×音楽: フラクタル→美学分析→σ', () => {
    const r = rei('10 |> fractal(10, 20) |> aesthetics |> art_sigma');
    expect(r.reiType).toBe('SigmaResult');
    expect(r.domain).toBe('art');
  });

  test('音楽: スケール→メロディ→σ', () => {
    const r = rei('"C" |> scale("major") |> melody(8) |> music_sigma');
    expect(r.reiType).toBe('SigmaResult');
    expect(r.domain).toBe('music');
  });

  test('経済学: 市場→実行→σ', () => {
    const r = rei('"test" |> market(50, 5) |> market_run(20) |> economics_sigma');
    expect(r.reiType).toBe('SigmaResult');
  });

  test('言語学: 翻訳→σ', () => {
    const r = rei('"猫は大きい" |> translate("ja", "en") |> linguistics_sigma');
    expect(r.reiType).toBe('SigmaResult');
  });

  test('型チェック→σ', () => {
    const r = rei('"test" |> type_check |> type_sigma');
    expect(r.reiType).toBe('SigmaResult');
  });
});
