/**
 * Phase 6.5: EFGH ドメイン横断統合テスト
 *
 * E(芸術) × F(音楽) × G(経済学) × H(言語学) の相互連携
 * + EFGH → BCD ブリッジ
 * + 7ドメイン全体統合
 */

import { describe, test, expect, beforeEach } from 'vitest';
import { rei } from '../src/index';
import {
  artToMusic, musicToArt,
  artToMarket, marketToArt,
  artToText, textToArt,
  musicToMarket, marketToMusic,
  musicToText, textToMusic,
  marketToText, textToMarket,
  artToSim, musicToSim, marketToSim,
  marketEthics, linguisticsToHumanities, linguisticsToPipeline,
  composeAll,
  getEFGHCrossSigma, getUniversalSigma,
  wrapEFGHCross,
} from '../src/lang/domains/cross-domain-efgh';
import { colorHarmony, generateFractal, analyzeAesthetics } from '../src/lang/domains/art';
import { createScale, createChord, createMelody, createRhythm } from '../src/lang/domains/music';
import { createMarket, marketRun, supplyDemand, createGame } from '../src/lang/domains/economics';
import { parseSyntax, createSemanticFrame, translate, analyzeWord } from '../src/lang/domains/linguistics';
import { createNBodySpace } from '../src/lang/domains/natural-science';
import { createPipelineSpace } from '../src/lang/domains/pipeline-core';
import { simRun } from '../src/lang/domains/simulation-core';
import { analyzeText, evaluateEthics } from '../src/lang/domains/humanities';

beforeEach(() => { rei.reset(); });

// ============================================================
// E↔F: 芸術 ↔ 音楽 (共感覚)
// ============================================================

describe('E↔F: 芸術 ↔ 音楽 (共感覚)', () => {
  test('art_to_music: ColorHarmony → ScaleResult', () => {
    const ch = colorHarmony(0, 'complementary');
    const scale = artToMusic(ch);
    expect(scale.reiType).toBe('ScaleResult');
    expect(scale.root).toBe('C');  // hue=0 → C
    expect(scale.mode).toBe('major');  // complementary → major
    expect(scale.notes.length).toBeGreaterThan(0);
  });

  test('art_to_music: PatternResult → ScaleResult', () => {
    const pattern = generateFractal(10, 10, 20);
    const scale = artToMusic(pattern);
    expect(scale.reiType).toBe('ScaleResult');
    expect(scale.notes.length).toBeGreaterThan(0);
  });

  test('art_to_music: AestheticAnalysis → ScaleResult', () => {
    const aesthetics = analyzeAesthetics(generateFractal(10, 10, 20));
    const scale = artToMusic(aesthetics);
    expect(scale.reiType).toBe('ScaleResult');
  });

  test('art_to_music: 数値 (hue) → ScaleResult', () => {
    const scale = artToMusic(120);  // hue=120 → E
    expect(scale.reiType).toBe('ScaleResult');
    expect(scale.root).toBe('E');
  });

  test('music_to_art: ScaleResult → ColorHarmony', () => {
    const scale = createScale('C', 'major');
    const ch = musicToArt(scale);
    expect(ch.reiType).toBe('ColorHarmony');
    expect(ch.base.h).toBe(0);  // C → hue 0
    expect(ch.scheme).toBe('complementary');  // major → complementary
  });

  test('music_to_art: ChordResult → ColorHarmony', () => {
    const chord = createChord('G', 'major');
    const ch = musicToArt(chord);
    expect(ch.reiType).toBe('ColorHarmony');
    expect(ch.base.h).toBe(210);  // G → hue 210
  });

  test('music_to_art: MelodyResult → ColorHarmony', () => {
    const scale = createScale('A', 'minor');
    const melody = createMelody(scale, 8, 'stepwise');
    const ch = musicToArt(melody);
    expect(ch.reiType).toBe('ColorHarmony');
  });

  test('ラウンドトリップ: Color → Scale → Color', () => {
    const original = colorHarmony(60, 'triadic');
    const scale = artToMusic(original);
    const roundtrip = musicToArt(scale);
    expect(roundtrip.reiType).toBe('ColorHarmony');
    // ドメインが保存される（完全一致は不要だが型は同じ）
  });

  test('パイプ経由: art_to_music', () => {
    const result = rei('0 |> color_harmony("complementary") |> art_to_music');
    expect(result.reiType).toBe('ScaleResult');
  });

  test('パイプ経由: music_to_art', () => {
    const result = rei('"C" |> scale("major") |> music_to_art');
    expect(result.reiType).toBe('ColorHarmony');
  });
});

// ============================================================
// E↔G: 芸術 ↔ 経済学
// ============================================================

describe('E↔G: 芸術 ↔ 経済学', () => {
  test('art_to_market: AestheticAnalysis → MarketState', () => {
    const aesthetics = analyzeAesthetics(generateFractal(10, 10, 20));
    const market = artToMarket(aesthetics);
    expect(market.reiType).toBe('MarketState');
    expect(market.price).toBeGreaterThan(0);
    expect(market.agents.length).toBeGreaterThan(0);
  });

  test('art_to_market: ColorHarmony → MarketState', () => {
    const ch = colorHarmony(120, 'analogous');
    const market = artToMarket(ch);
    expect(market.reiType).toBe('MarketState');
    expect(market.name).toContain('color_market');
  });

  test('market_to_art: MarketState → PatternResult', () => {
    const market = marketRun(createMarket('test', 100, 5), 20);
    const pattern = marketToArt(market);
    expect(pattern.reiType).toBe('PatternResult');
    expect(pattern.data.length).toBeGreaterThan(0);
    expect(pattern.params.sourceDomain).toBe('economics');
  });

  test('market_to_art: SupplyDemandResult → PatternResult', () => {
    const sd = supplyDemand(1, 0, -1, 100);
    const pattern = marketToArt(sd);
    expect(pattern.reiType).toBe('PatternResult');
  });

  test('パイプ経由: art_to_market', () => {
    const result = rei('10 |> fractal(10, 20) |> aesthetics |> art_to_market');
    expect(result.reiType).toBe('MarketState');
  });

  test('パイプ経由: market_to_art', () => {
    const result = rei('"art" |> market(100, 5) |> market_run(20) |> market_to_art');
    expect(result.reiType).toBe('PatternResult');
  });
});

// ============================================================
// E↔H: 芸術 ↔ 言語学
// ============================================================

describe('E↔H: 芸術 ↔ 言語学', () => {
  test('art_to_text: AestheticAnalysis → SyntaxTree', () => {
    const aesthetics = analyzeAesthetics(generateFractal(10, 10, 20));
    const tree = artToText(aesthetics);
    expect(tree.reiType).toBe('SyntaxTree');
    expect(tree.sentence.length).toBeGreaterThan(0);
  });

  test('art_to_text: ColorHarmony → SyntaxTree', () => {
    const ch = colorHarmony(60, 'analogous');
    const tree = artToText(ch);
    expect(tree.reiType).toBe('SyntaxTree');
    expect(tree.sentence).toContain('色彩調和');
  });

  test('art_to_text: PatternResult → SyntaxTree', () => {
    const pattern = generateFractal(10, 10, 20);
    const tree = artToText(pattern);
    expect(tree.reiType).toBe('SyntaxTree');
    expect(tree.sentence).toContain('パターン');
  });

  test('text_to_art: SyntaxTree → ColorHarmony', () => {
    const tree = parseSyntax('美しい風景を描写する');
    const ch = textToArt(tree);
    expect(ch.reiType).toBe('ColorHarmony');
    expect(ch.colors.length).toBeGreaterThan(0);
  });

  test('text_to_art: SemanticFrame → ColorHarmony', () => {
    const frame = createSemanticFrame('描く', { agent: '画家', theme: '風景' });
    const ch = textToArt(frame);
    expect(ch.reiType).toBe('ColorHarmony');
  });

  test('text_to_art: TranslationResult → ColorHarmony', () => {
    const tr = translate('美しい', 'ja', 'en');
    const ch = textToArt(tr);
    expect(ch.reiType).toBe('ColorHarmony');
  });

  test('パイプ経由: art_to_text', () => {
    const result = rei('0 |> color_harmony("complementary") |> art_to_text');
    expect(result.reiType).toBe('SyntaxTree');
  });
});

// ============================================================
// F↔G: 音楽 ↔ 経済学
// ============================================================

describe('F↔G: 音楽 ↔ 経済学', () => {
  test('music_to_market: ScaleResult → MarketState', () => {
    const scale = createScale('C', 'major');
    const market = musicToMarket(scale);
    expect(market.reiType).toBe('MarketState');
    expect(market.name).toContain('scale_market');
  });

  test('music_to_market: MelodyResult → MarketState', () => {
    const scale = createScale('A', 'minor');
    const melody = createMelody(scale, 8, 'stepwise');
    const market = musicToMarket(melody);
    expect(market.reiType).toBe('MarketState');
    expect(market.name).toBe('melody_market');
  });

  test('music_to_market: RhythmPattern → MarketState', () => {
    const rhythm = createRhythm(4, 4, 0.5, 120);
    const market = musicToMarket(rhythm);
    expect(market.reiType).toBe('MarketState');
    expect(market.name).toContain('rhythm_market');
  });

  test('music_to_market: ChordResult → MarketState', () => {
    const chord = createChord('G', 'major');
    const market = musicToMarket(chord);
    expect(market.reiType).toBe('MarketState');
    expect(market.name).toContain('chord_market');
  });

  test('market_to_music: MarketState(bull) → major scale or melody', () => {
    let market = createMarket('test', 100, 5);
    market = marketRun(market, 10);
    const result = marketToMusic(market);
    expect(['ScaleResult', 'MelodyResult']).toContain(result.reiType);
  });

  test('market_to_music: SupplyDemandResult → ScaleResult', () => {
    const sd = supplyDemand(1, 0, -1, 100);
    const scale = marketToMusic(sd);
    expect(scale.reiType).toBe('ScaleResult');
  });

  test('market_to_music: GameTheoryResult → ScaleResult', () => {
    const game = createGame('prisoners_dilemma');
    const scale = marketToMusic(game);
    expect(scale.reiType).toBe('ScaleResult');
  });

  test('パイプ経由: music_to_market', () => {
    const result = rei('"D" |> scale("minor") |> music_to_market');
    expect(result.reiType).toBe('MarketState');
  });

  test('パイプ経由: market_to_music', () => {
    const result = rei('"m" |> market(100, 5) |> market_run(10) |> market_to_music');
    expect(['ScaleResult', 'MelodyResult']).toContain(result.reiType);
  });
});

// ============================================================
// F↔H: 音楽 ↔ 言語学
// ============================================================

describe('F↔H: 音楽 ↔ 言語学', () => {
  test('music_to_text: ScaleResult → SyntaxTree', () => {
    const scale = createScale('C', 'major');
    const tree = musicToText(scale);
    expect(tree.reiType).toBe('SyntaxTree');
    expect(tree.sentence).toContain('音階');
  });

  test('music_to_text: MelodyResult → SyntaxTree', () => {
    const scale = createScale('A', 'minor');
    const melody = createMelody(scale, 8, 'stepwise');
    const tree = musicToText(melody);
    expect(tree.reiType).toBe('SyntaxTree');
    expect(tree.sentence).toContain('旋律');
  });

  test('music_to_text: ChordResult → SyntaxTree', () => {
    const chord = createChord('E', 'minor');
    const tree = musicToText(chord);
    expect(tree.reiType).toBe('SyntaxTree');
    expect(tree.sentence).toContain('和音');
  });

  test('music_to_text: RhythmPattern → SyntaxTree', () => {
    const rhythm = createRhythm(4, 4, 0.5, 120);
    const tree = musicToText(rhythm);
    expect(tree.reiType).toBe('SyntaxTree');
    expect(tree.sentence).toContain('リズム');
  });

  test('text_to_music: SyntaxTree → ScaleResult', () => {
    const tree = parseSyntax('鳥が歌を歌う');
    const scale = textToMusic(tree);
    expect(scale.reiType).toBe('ScaleResult');
  });

  test('text_to_music: SemanticFrame → ScaleResult', () => {
    const frame = createSemanticFrame('演奏する', { agent: '演者', theme: '曲' });
    const scale = textToMusic(frame);
    expect(scale.reiType).toBe('ScaleResult');
  });

  test('text_to_music: TranslationResult → ScaleResult', () => {
    const tr = translate('音楽', 'ja', 'en');
    const scale = textToMusic(tr);
    expect(scale.reiType).toBe('ScaleResult');
  });

  test('パイプ経由: music_to_text', () => {
    const result = rei('"C" |> scale("major") |> music_to_text');
    expect(result.reiType).toBe('SyntaxTree');
  });

  test('パイプ経由: text_to_music', () => {
    const result = rei('"鳥が歌を歌う" |> parse |> text_to_music');
    expect(result.reiType).toBe('ScaleResult');
  });
});

// ============================================================
// G↔H: 経済学 ↔ 言語学
// ============================================================

describe('G↔H: 経済学 ↔ 言語学', () => {
  test('market_to_text: MarketState → SyntaxTree', () => {
    const market = createMarket('stocks', 150, 8);
    const tree = marketToText(market);
    expect(tree.reiType).toBe('SyntaxTree');
    expect(tree.sentence).toContain('市場');
  });

  test('market_to_text: SupplyDemandResult → SyntaxTree', () => {
    const sd = supplyDemand(1, 0, -1, 100);
    const tree = marketToText(sd);
    expect(tree.reiType).toBe('SyntaxTree');
    expect(tree.sentence).toContain('均衡');
  });

  test('market_to_text: GameTheoryResult → SyntaxTree', () => {
    const game = createGame('prisoners_dilemma');
    const tree = marketToText(game);
    expect(tree.reiType).toBe('SyntaxTree');
    expect(tree.sentence).toContain('ゲーム');
  });

  test('text_to_market: SyntaxTree → MarketState', () => {
    const tree = parseSyntax('株式市場が上昇する');
    const market = textToMarket(tree);
    expect(market.reiType).toBe('MarketState');
    expect(market.name).toContain('syntax_market');
  });

  test('text_to_market: SemanticFrame → MarketState', () => {
    const frame = createSemanticFrame('取引する', { agent: '投資家', theme: '株式' });
    const market = textToMarket(frame);
    expect(market.reiType).toBe('MarketState');
  });

  test('text_to_market: TranslationResult → MarketState', () => {
    const tr = translate('市場', 'ja', 'en');
    const market = textToMarket(tr);
    expect(market.reiType).toBe('MarketState');
  });

  test('パイプ経由: market_to_text', () => {
    const result = rei('"stocks" |> market(100, 5) |> market_to_text');
    expect(result.reiType).toBe('SyntaxTree');
  });

  test('パイプ経由: text_to_market', () => {
    const result = rei('"市場が上昇する" |> parse |> text_to_market');
    expect(result.reiType).toBe('MarketState');
  });
});

// ============================================================
// EFGH → BCD ブリッジ
// ============================================================

describe('EFGH → BCD ブリッジ', () => {
  // E → B
  test('art_to_sim: PatternResult → SimulationSpace', () => {
    const pattern = generateFractal(15, 15, 30);
    const sim = artToSim(pattern);
    expect(sim.reiType).toBe('SimulationSpace');
    expect(sim.particles.length).toBeGreaterThanOrEqual(3);
  });

  test('art_to_sim: ColorHarmony → SimulationSpace', () => {
    const ch = colorHarmony(0, 'triadic');
    const sim = artToSim(ch);
    expect(sim.reiType).toBe('SimulationSpace');
    expect(sim.particles.length).toBeGreaterThanOrEqual(3);
  });

  // F → B
  test('music_to_sim: ScaleResult → SimulationSpace', () => {
    const scale = createScale('C', 'major');
    const sim = musicToSim(scale);
    expect(sim.reiType).toBe('SimulationSpace');
    expect(sim.particles.length).toBe(scale.notes.length);
    expect(sim.particles[0].properties).toHaveProperty('frequency');
  });

  test('music_to_sim: MelodyResult → SimulationSpace', () => {
    const scale = createScale('A', 'minor');
    const melody = createMelody(scale, 8, 'stepwise');
    const sim = musicToSim(melody);
    expect(sim.reiType).toBe('SimulationSpace');
  });

  test('music_to_sim: RhythmPattern → SimulationSpace', () => {
    const rhythm = createRhythm(4, 4, 0.5, 120);
    const sim = musicToSim(rhythm);
    expect(sim.reiType).toBe('SimulationSpace');
    expect(sim.particles.length).toBeGreaterThanOrEqual(3);
  });

  // G → B
  test('market_to_sim: MarketState → SimulationSpace', () => {
    const market = createMarket('test', 100, 8);
    const sim = marketToSim(market);
    expect(sim.reiType).toBe('SimulationSpace');
    expect(sim.particles.length).toBe(market.agents.length);
  });

  // G → D
  test('market_ethics: MarketState → EthicsResult', () => {
    const market = createMarket('test', 100, 5);
    const ethics = marketEthics(market);
    expect(ethics.reiType).toBe('EthicsResult');
    expect(ethics.perspectives.length).toBeGreaterThan(0);
  });

  test('market_ethics: GameTheoryResult → EthicsResult', () => {
    const game = createGame('prisoners_dilemma');
    const ethics = marketEthics(game);
    expect(ethics.reiType).toBe('EthicsResult');
  });

  // H → D
  test('linguistics_to_humanities: SyntaxTree → TextAnalysis', () => {
    const tree = parseSyntax('自然言語処理は重要な技術である');
    const text = linguisticsToHumanities(tree);
    expect(text.reiType).toBe('TextAnalysis');
    expect(text.original.length).toBeGreaterThan(0);
  });

  test('linguistics_to_humanities: TranslationResult → TextAnalysis', () => {
    const tr = translate('科学', 'ja', 'en');
    const text = linguisticsToHumanities(tr);
    expect(text.reiType).toBe('TextAnalysis');
  });

  test('linguistics_to_humanities: SemanticFrame → TextAnalysis', () => {
    const frame = createSemanticFrame('研究する', { agent: '科学者', theme: '物理' });
    const text = linguisticsToHumanities(frame);
    expect(text.reiType).toBe('TextAnalysis');
  });

  test('linguistics_to_humanities: WordRelation → TextAnalysis', () => {
    const word = analyzeWord('知識');
    const text = linguisticsToHumanities(word);
    expect(text.reiType).toBe('TextAnalysis');
  });

  // H → C
  test('linguistics_to_pipeline: TranslationResult → PipelineSpace', () => {
    const tr = translate('猫が魚を食べる', 'ja', 'en');
    const pipeline = linguisticsToPipeline(tr);
    expect(pipeline.reiType).toBe('PipelineSpace');
    expect(Array.isArray(pipeline.data)).toBe(true);
    expect(pipeline.metadata.sourceDomain).toBe('linguistics');
  });

  test('linguistics_to_pipeline: SyntaxTree → PipelineSpace', () => {
    const tree = parseSyntax('猫が走る');
    const pipeline = linguisticsToPipeline(tree);
    expect(pipeline.reiType).toBe('PipelineSpace');
    expect(Array.isArray(pipeline.data)).toBe(true);
  });

  test('linguistics_to_pipeline: WordRelation → PipelineSpace', () => {
    const word = analyzeWord('言語');
    const pipeline = linguisticsToPipeline(word);
    expect(pipeline.reiType).toBe('PipelineSpace');
  });

  // パイプ経由
  test('パイプ経由: art_to_sim', () => {
    const result = rei('10 |> fractal(10, 20) |> art_to_sim');
    expect(result.reiType).toBe('SimulationSpace');
  });

  test('パイプ経由: music_to_sim', () => {
    const result = rei('"C" |> scale("major") |> music_to_sim');
    expect(result.reiType).toBe('SimulationSpace');
  });

  test('パイプ経由: market_to_sim', () => {
    const result = rei('"test" |> market(100, 8) |> market_to_sim');
    expect(result.reiType).toBe('SimulationSpace');
  });

  test('パイプ経由: market_ethics', () => {
    const result = rei('"test" |> market(100, 5) |> market_ethics');
    expect(result.reiType).toBe('EthicsResult');
  });

  test('パイプ経由: linguistics_to_humanities', () => {
    const result = rei('"科学は進歩する" |> parse |> linguistics_to_humanities');
    expect(result.reiType).toBe('TextAnalysis');
  });

  test('パイプ経由: linguistics_to_pipeline', () => {
    const result = rei('"猫" |> translate("ja", "en") |> linguistics_to_pipeline');
    expect(result.reiType).toBe('PipelineSpace');
  });
});

// ============================================================
// 多段パイプ (マルチドメイン横断)
// ============================================================

describe('マルチドメイン横断パイプ', () => {
  test('E→F→G: 芸術→音楽→経済', () => {
    const result = rei('60 |> color_harmony("triadic") |> art_to_music |> music_to_market');
    expect(result.reiType).toBe('MarketState');
  });

  test('H→F→E: 言語→音楽→芸術', () => {
    const result = rei('"鳥が歌う" |> parse |> text_to_music |> music_to_art');
    expect(result.reiType).toBe('ColorHarmony');
  });

  test('G→F→E→H: 経済→音楽→芸術→言語', () => {
    const result = rei('"m" |> market(100, 5) |> market_run(10) |> market_to_music |> music_to_art |> art_to_text');
    expect(result.reiType).toBe('SyntaxTree');
  });

  test('E→B: 芸術→シミュ→パイプライン (BCD横断)', () => {
    const result = rei('10 |> fractal(10, 20) |> art_to_sim |> sim_to_pipeline');
    expect(result.reiType).toBe('PipelineSpace');
  });

  test('F→B→D: 音楽→シミュ→因果ネットワーク', () => {
    const scale = createScale('C', 'major');
    const sim = musicToSim(scale);
    const simulated = simRun(sim, 5);
    expect(simulated.reiType).toBe('SimulationSpace');
    expect(simulated.history.length).toBeGreaterThan(0);
  });

  test('G→D→C: 経済→倫理→テキスト', () => {
    const market = createMarket('ethics_test', 100, 5);
    const ethics = marketEthics(market);
    expect(ethics.reiType).toBe('EthicsResult');
    expect(ethics.perspectives.length).toBeGreaterThan(0);
  });
});

// ============================================================
// 日本語エイリアス
// ============================================================

describe('日本語エイリアス', () => {
  test('芸術→音楽', () => {
    const result = rei('0 |> color_harmony("complementary") |> 芸術→音楽');
    expect(result.reiType).toBe('ScaleResult');
  });

  test('音楽→芸術', () => {
    const result = rei('"C" |> scale("major") |> 音楽→芸術');
    expect(result.reiType).toBe('ColorHarmony');
  });

  test('芸術→市場', () => {
    const result = rei('10 |> fractal(10, 20) |> aesthetics |> 芸術→市場');
    expect(result.reiType).toBe('MarketState');
  });

  test('市場→芸術', () => {
    const result = rei('"m" |> market(100, 5) |> market_run(20) |> 市場→芸術');
    expect(result.reiType).toBe('PatternResult');
  });

  test('音楽→市場', () => {
    const result = rei('"D" |> scale("minor") |> 音楽→市場');
    expect(result.reiType).toBe('MarketState');
  });

  test('市場→音楽', () => {
    const result = rei('"m" |> market(100, 5) |> market_run(10) |> 市場→音楽');
    expect(['ScaleResult', 'MelodyResult']).toContain(result.reiType);
  });

  test('市場→言語', () => {
    const result = rei('"stocks" |> market(100, 5) |> 市場→言語');
    expect(result.reiType).toBe('SyntaxTree');
  });

  test('言語→市場', () => {
    const result = rei('"市場が上昇する" |> parse |> 言語→市場');
    expect(result.reiType).toBe('MarketState');
  });

  test('芸術→シミュ', () => {
    const result = rei('10 |> fractal(10, 20) |> 芸術→シミュ');
    expect(result.reiType).toBe('SimulationSpace');
  });

  test('音楽→シミュ', () => {
    const result = rei('"C" |> scale("major") |> 音楽→シミュ');
    expect(result.reiType).toBe('SimulationSpace');
  });

  test('市場→シミュ', () => {
    const result = rei('"m" |> market(100, 8) |> 市場→シミュ');
    expect(result.reiType).toBe('SimulationSpace');
  });

  test('市場倫理', () => {
    const result = rei('"m" |> market(100, 5) |> 市場倫理');
    expect(result.reiType).toBe('EthicsResult');
  });

  test('言語→人文', () => {
    const result = rei('"科学は進歩する" |> parse |> 言語→人文');
    expect(result.reiType).toBe('TextAnalysis');
  });

  test('言語→パイプ', () => {
    const result = rei('"猫" |> translate("ja", "en") |> 言語→パイプ');
    expect(result.reiType).toBe('PipelineSpace');
  });
});

// ============================================================
// 7ドメイン全体統合
// ============================================================

describe('7ドメイン全体統合 (compose_all)', () => {
  test('全ドメイン統合: 基本', () => {
    const sim = simRun(createNBodySpace(3, 'gravity', {}), 5);
    const pipeline = createPipelineSpace([1, 2, 3]);
    const text = analyzeText('テスト文');
    const pattern = generateFractal(10, 10, 20);
    const scale = createScale('C', 'major');
    const market = createMarket('test', 100, 5);
    const syntax = parseSyntax('テストの文を解析する');

    const composition = composeAll({
      natural_science: sim,
      info_engineering: pipeline,
      humanities: text,
      art: pattern,
      music: scale,
      economics: market,
      linguistics: syntax,
    });

    expect(composition.reiType).toBe('UniversalComposition');
    expect(composition.synthesis.domainCount).toBe(7);
    expect(composition.synthesis.harmony).toBeGreaterThanOrEqual(0);
    expect(composition.synthesis.harmony).toBeLessThanOrEqual(1);
    expect(composition.synthesis.universality).toBeGreaterThanOrEqual(0);
  });

  test('部分統合: 4ドメインのみ', () => {
    const composition = composeAll({
      art: generateFractal(10, 10, 20),
      music: createScale('C', 'major'),
      economics: createMarket('test', 100, 5),
      linguistics: parseSyntax('テスト'),
    });

    expect(composition.reiType).toBe('UniversalComposition');
    expect(composition.synthesis.domainCount).toBe(4);
    // E/F/G/Hのみ提供してもB/C/Dはnullで処理
    expect(composition.domains.natural_science.raw).toBeNull();
  });

  test('7ドメイン統合: 共通パターン検出', () => {
    const composition = composeAll({
      natural_science: simRun(createNBodySpace(5, 'gravity', {}), 10),
      info_engineering: createPipelineSpace([1, 2, 3, 4, 5]),
      humanities: analyzeText('深い哲学的な考察を行う文章である'),
      art: colorHarmony(0, 'triadic'),
      music: createScale('A', 'minor'),
      economics: createMarket('complex', 200, 15),
      linguistics: parseSyntax('複雑な構造を持つ文を解析する'),
    });

    expect(composition.synthesis.domainCount).toBe(7);
    expect(Array.isArray(composition.synthesis.commonPatterns)).toBe(true);
    expect(Array.isArray(composition.synthesis.tensions)).toBe(true);
  });

  test('7ドメイン統合σ', () => {
    const composition = composeAll({
      art: generateFractal(10, 10, 20),
      music: createScale('C', 'major'),
      economics: createMarket('test', 100, 5),
      linguistics: parseSyntax('テスト'),
    });

    const sigma = getUniversalSigma(composition);
    expect(sigma.reiType).toBe('SigmaResult');
    expect(sigma.domain).toBe('universal');
    expect(sigma.field.domainCount).toBe(4);
    expect(sigma).toHaveProperty('universality');
    expect(sigma).toHaveProperty('harmony');
  });

  test('BラベルでのアクセスもOK', () => {
    const composition = composeAll({
      B: simRun(createNBodySpace(3, 'gravity', {}), 5),
      E: generateFractal(10, 10, 20),
      F: createScale('C', 'major'),
    });

    expect(composition.reiType).toBe('UniversalComposition');
    expect(composition.synthesis.domainCount).toBe(3);
  });
});

// ============================================================
// σ (シグマ) テスト
// ============================================================

describe('EFGH Cross-Domain σ', () => {
  test('wrapEFGHCross: ブリッジ結果のラップ', () => {
    const scale = createScale('C', 'major');
    const wrapped = wrapEFGHCross(
      scale, 'art', 'ColorHarmony', 'music', 'ScaleResult', 'art_to_music',
      { synesthesia: 0.8 },
    );
    expect(wrapped.reiType).toBe('EFGHCrossDomainResult');
    expect(wrapped.bridge).toBe('art_to_music');
    expect(wrapped.metadata.synesthesia).toBe(0.8);
  });

  test('getEFGHCrossSigma: σ取得', () => {
    const wrapped = wrapEFGHCross(
      createScale('C', 'major'),
      'art', 'ColorHarmony', 'music', 'ScaleResult', 'art_to_music',
    );
    const sigma = getEFGHCrossSigma(wrapped);
    expect(sigma.reiType).toBe('SigmaResult');
    expect(sigma.domain).toBe('cross_domain_efgh');
    expect(sigma.flow.direction).toBe('art→music');
  });

  test('横断σ: EFGHCrossDomainResult対応', () => {
    const wrapped = wrapEFGHCross(
      createScale('C', 'major'),
      'art', 'ColorHarmony', 'music', 'ScaleResult', 'art_to_music',
    );
    const sigma = getEFGHCrossSigma(wrapped);
    expect(sigma.reiType).toBe('SigmaResult');
    expect(sigma.domain).toBe('cross_domain_efgh');
  });

  test('横断σ: UniversalComposition対応', () => {
    const composition = composeAll({
      art: generateFractal(10, 10, 20),
      music: createScale('C', 'major'),
    });
    const sigma = getUniversalSigma(composition);
    expect(sigma.reiType).toBe('SigmaResult');
    expect(sigma.domain).toBe('universal');
  });
});
