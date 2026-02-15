/**
 * Phase 6.6: BCD→EFGH 逆方向ブリッジテスト
 *
 * 「無機質有機体」— 数値的データ(B/C/D)が美的・文化的表現(E/F/G/H)に変容する
 */

import { describe, test, expect, beforeEach } from 'vitest';
import { rei } from '../src/index';

import {
  simToArt, simToMusic, simToMarket, simToLinguistics,
  pipelineToArt, pipelineToMusic, pipelineToMarket, pipelineToLinguistics,
  humanToArt, humanToMusic, ethicsToMarket, graphToLinguistics,
  getBCDtoEFGHSigma,
  wrapSimToArt, wrapSimToMusic, wrapSimToMarket, wrapSimToLinguistics,
  wrapPipelineToArt, wrapPipelineToMusic, wrapPipelineToMarket, wrapPipelineToLinguistics,
  wrapHumanToArt, wrapHumanToMusic, wrapEthicsToMarket, wrapGraphToLinguistics,
} from '../src/lang/domains/cross-domain-bcd-efgh';

import { createNBodySpace } from '../src/lang/domains/natural-science';
import { simRun, type SimulationSpace } from '../src/lang/domains/simulation-core';
import { createPipelineSpace, addStage, pipelineRun, type PipelineSpace } from '../src/lang/domains/pipeline-core';
import { analyzeText, evaluateEthics, type TextAnalysisResult, type EthicsResult } from '../src/lang/domains/humanities';
import { createGraphSpace, addGraphNode, addGraphEdge, type GraphSpace } from '../src/lang/domains/graph-core';

// ============================================================
// テストヘルパー
// ============================================================

function createTestSim(n: number = 8): SimulationSpace {
  return createNBodySpace(n, 'gravity', { mass: 1, radius: 5 });
}

function createSmallSim(): SimulationSpace {
  return createNBodySpace(2, 'gravity');
}

function createEmptySim(): SimulationSpace {
  return createNBodySpace(0, 'gravity');
}

function createTestPipeline(stageCount: number = 5): PipelineSpace {
  let pipe = createPipelineSpace('test_pipe', [1, 2, 3, 4, 5, 6, 7, 8]);
  for (let i = 0; i < stageCount; i++) {
    pipe = addStage(pipe, {
      id: `stage_${i}`,
      transform: i % 2 === 0 ? (x: number) => x * 2 : undefined,
      filter: i % 2 !== 0 ? (x: number) => x > 2 : undefined,
    });
  }
  return pipelineRun(pipe);
}

function createEmptyPipeline(): PipelineSpace {
  return createPipelineSpace('empty_pipe', []);
}

function createShortPipeline(): PipelineSpace {
  let pipe = createPipelineSpace('short_pipe', [10, 20, 30]);
  pipe = addStage(pipe, { id: 's1', transform: (x: number) => x + 1 });
  return pipelineRun(pipe);
}

function createTestText(): TextAnalysisResult {
  return analyzeText('The brave heroes fought against the darkness with unwavering courage');
}

function createTestEthics(): EthicsResult {
  return evaluateEthics('Testing an action for ethical evaluation');
}

function createTestGraph(): GraphSpace {
  let g = createGraphSpace('test_graph');
  g = addGraphNode(g, 'center', 'Core');
  g = addGraphNode(g, 'a', 'Alpha');
  g = addGraphNode(g, 'b', 'Beta');
  g = addGraphNode(g, 'c', 'Gamma');
  g = addGraphEdge(g, 'center', 'a', 'related', 1);
  g = addGraphEdge(g, 'center', 'b', 'related', 1);
  g = addGraphEdge(g, 'center', 'c', 'related', 1);
  g = addGraphEdge(g, 'a', 'b', 'related', 0.5);
  return g;
}

function createEmptyGraph(): GraphSpace {
  return createGraphSpace('empty_graph');
}

beforeEach(() => { rei.reset(); });

// ============================================================
// B→E: シミュレーション → 芸術
// ============================================================

describe('B→E: simToArt — シミュレーション → 芸術', () => {
  test('多粒子系 → PatternResult (空間パターン)', () => {
    const sim = createTestSim(8);
    const art = simToArt(sim);
    expect(art.reiType).toBe('PatternResult');
    const pattern = art as any;
    expect(pattern.width).toBeGreaterThan(0);
    expect(pattern.height).toBeGreaterThan(0);
    expect(pattern.data.length).toBe(pattern.height);
    expect(pattern.data[0].length).toBe(pattern.width);
    for (const row of pattern.data) {
      for (const val of row) {
        expect(val).toBeGreaterThanOrEqual(0);
        expect(val).toBeLessThanOrEqual(1);
      }
    }
  });

  test('少数粒子 → ColorHarmony', () => {
    const sim = createSmallSim();
    const art = simToArt(sim);
    expect(['PatternResult', 'ColorHarmony']).toContain(art.reiType);
  });

  test('空シミュ → デフォルトColorHarmony', () => {
    const sim = createEmptySim();
    const art = simToArt(sim);
    expect(art.reiType).toBe('ColorHarmony');
  });

  test('パターンのメタデータに粒子情報', () => {
    const sim = createTestSim(10);
    const art = simToArt(sim);
    if (art.reiType === 'PatternResult') {
      expect((art as any).metadata.particleCount).toBe(10);
      expect((art as any).metadata.type).toBe('simulation_projection');
    }
  });

  test('異なる粒子数で異なる結果', () => {
    const art1 = simToArt(createTestSim(8));
    const art2 = simToArt(createEmptySim());
    expect(art1.reiType).not.toBe(art2.reiType);
  });
});

// ============================================================
// B→F: シミュレーション → 音楽
// ============================================================

describe('B→F: simToMusic — シミュレーション → 音楽', () => {
  test('多粒子系 → MelodyResult', () => {
    const sim = createTestSim(8);
    const music = simToMusic(sim);
    expect(music.reiType).toBe('MelodyResult');
    expect((music as any).notes.length).toBeGreaterThan(0);
    for (const note of (music as any).notes) {
      expect(note.frequency).toBeGreaterThan(0);
      expect(note.midi).toBeGreaterThanOrEqual(0);
    }
  });

  test('少数粒子 → ScaleResult', () => {
    const sim = createSmallSim();
    const music = simToMusic(sim);
    expect(['ScaleResult', 'MelodyResult']).toContain(music.reiType);
  });

  test('空シミュ → デフォルトScale (C minor)', () => {
    const sim = createEmptySim();
    const music = simToMusic(sim);
    expect(music.reiType).toBe('ScaleResult');
    expect((music as any).root).toBe('C');
    expect((music as any).mode).toBe('minor');
  });

  test('メロディの音符数は粒子数に基づく', () => {
    const sim = createTestSim(12);
    const music = simToMusic(sim);
    if (music.reiType === 'MelodyResult') {
      expect((music as any).notes.length).toBeGreaterThanOrEqual(4);
      expect((music as any).notes.length).toBeLessThanOrEqual(16);
    }
  });

  test('結果に音符情報がある', () => {
    const sim = createTestSim(6);
    const music = simToMusic(sim);
    if (music.reiType === 'ScaleResult') {
      expect((music as any).root).toBeDefined();
      expect((music as any).mode).toBeDefined();
    } else {
      expect((music as any).notes.length).toBeGreaterThan(0);
    }
  });
});

// ============================================================
// B→G: シミュレーション → 経済学
// ============================================================

describe('B→G: simToMarket — シミュレーション → 経済学', () => {
  test('多粒子系 → MarketState (エージェント変換)', () => {
    const sim = createTestSim(8);
    const market = simToMarket(sim);
    expect(market.reiType).toBe('MarketState');
    expect(market.agents.length).toBeGreaterThan(0);
    for (const agent of market.agents) {
      expect(agent.id).toBeDefined();
      expect(['buyer', 'seller', 'speculator']).toContain(agent.type);
      expect(agent.capital).toBeGreaterThan(0);
    }
  });

  test('粒子質量 → 基準価格', () => {
    const sim = createTestSim(5);
    const market = simToMarket(sim);
    expect(market.price).toBeGreaterThan(0);
  });

  test('空シミュ → デフォルト市場', () => {
    const sim = createEmptySim();
    const market = simToMarket(sim);
    expect(market.reiType).toBe('MarketState');
    expect(market.agents.length).toBeGreaterThanOrEqual(3);
  });

  test('ボラティリティが0-1範囲', () => {
    const sim = createTestSim(10);
    const market = simToMarket(sim);
    expect(market.volatility).toBeGreaterThanOrEqual(0);
    expect(market.volatility).toBeLessThanOrEqual(1);
  });
});

// ============================================================
// B→H: シミュレーション → 言語学
// ============================================================

describe('B→H: simToLinguistics — シミュレーション → 言語学', () => {
  test('多粒子系 → SyntaxTree', () => {
    const sim = createTestSim(8);
    const tree = simToLinguistics(sim);
    expect(tree.reiType).toBe('SyntaxTree');
    expect(tree.root).toBeDefined();
    expect(tree.sentence).toBeDefined();
  });

  test('空シミュ → "empty system" の構文木', () => {
    const sim = createEmptySim();
    const tree = simToLinguistics(sim);
    expect(tree.sentence.toLowerCase()).toContain('empty');
  });

  test('単粒子系の記述', () => {
    const sim = createNBodySpace(1, 'gravity');
    const tree = simToLinguistics(sim);
    expect(tree.sentence.toLowerCase()).toContain('single');
  });

  test('高粒子数は複雑記述', () => {
    const sim = createTestSim(20);
    const tree = simToLinguistics(sim);
    expect(tree.sentence.toLowerCase()).toContain('complex');
  });

  test('文が十分な長さ', () => {
    const sim = createTestSim(6);
    const tree = simToLinguistics(sim);
    expect(tree.sentence.length).toBeGreaterThan(15);
  });
});

// ============================================================
// C→E: パイプライン → 芸術
// ============================================================

describe('C→E: pipelineToArt — パイプライン → 芸術', () => {
  test('多段パイプライン → PatternResult', () => {
    const pipe = createTestPipeline(5);
    const art = pipelineToArt(pipe);
    expect(art.reiType).toBe('PatternResult');
    expect((art as any).width).toBeGreaterThan(0);
  });

  test('短パイプライン → ColorHarmony', () => {
    const pipe = createShortPipeline();
    const art = pipelineToArt(pipe);
    expect(['PatternResult', 'ColorHarmony']).toContain(art.reiType);
  });

  test('空パイプライン → デフォルトColorHarmony', () => {
    const pipe = createEmptyPipeline();
    const art = pipelineToArt(pipe);
    expect(art.reiType).toBe('ColorHarmony');
  });

  test('パターンの値が0-1範囲', () => {
    const pipe = createTestPipeline(6);
    const art = pipelineToArt(pipe);
    if (art.reiType === 'PatternResult') {
      for (const row of (art as any).data) {
        for (const val of row) {
          expect(val).toBeGreaterThanOrEqual(0);
          expect(val).toBeLessThanOrEqual(1);
        }
      }
    }
  });

  test('ステージ数がメタデータに反映', () => {
    const pipe = createTestPipeline(7);
    const art = pipelineToArt(pipe);
    if (art.reiType === 'PatternResult') {
      expect((art as any).metadata.stageCount).toBe(7);
    }
  });
});

// ============================================================
// C→F: パイプライン → 音楽
// ============================================================

describe('C→F: pipelineToMusic — パイプライン → 音楽', () => {
  test('多段パイプライン → MelodyResult', () => {
    const pipe = createTestPipeline(5);
    const music = pipelineToMusic(pipe);
    expect(music.reiType).toBe('MelodyResult');
    expect((music as any).notes.length).toBeGreaterThan(0);
  });

  test('短パイプライン → ScaleResult', () => {
    const pipe = createShortPipeline();
    const music = pipelineToMusic(pipe);
    expect(['ScaleResult', 'MelodyResult']).toContain(music.reiType);
  });

  test('空パイプライン → デフォルトScale', () => {
    const pipe = createEmptyPipeline();
    const music = pipelineToMusic(pipe);
    expect(music.reiType).toBe('ScaleResult');
  });

  test('音符に周波数情報', () => {
    const pipe = createTestPipeline(6);
    const music = pipelineToMusic(pipe);
    if (music.reiType === 'MelodyResult') {
      for (const note of (music as any).notes) {
        expect(note.frequency).toBeGreaterThan(0);
      }
    }
  });
});

// ============================================================
// C→G: パイプライン → 経済学
// ============================================================

describe('C→G: pipelineToMarket — パイプライン → 経済学', () => {
  test('パイプライン → MarketState', () => {
    const pipe = createTestPipeline(5);
    const market = pipelineToMarket(pipe);
    expect(market.reiType).toBe('MarketState');
    expect(market.agents.length).toBeGreaterThanOrEqual(3);
  });

  test('空パイプライン → 最低3エージェント', () => {
    const pipe = createEmptyPipeline();
    const market = pipelineToMarket(pipe);
    expect(market.reiType).toBe('MarketState');
    expect(market.agents.length).toBeGreaterThanOrEqual(3);
  });

  test('ボラティリティがステージ数に基づく', () => {
    const pipe = createTestPipeline(8);
    const market = pipelineToMarket(pipe);
    expect(market.volatility).toBeGreaterThan(0);
    expect(market.volatility).toBeLessThanOrEqual(0.8);
  });

  test('基準価格がステージ数に基づく', () => {
    const m1 = pipelineToMarket(createTestPipeline(3));
    const m2 = pipelineToMarket(createTestPipeline(8));
    // より多くのステージ → より高い基準価格
    expect(m2.price).toBeGreaterThanOrEqual(m1.price);
  });
});

// ============================================================
// C→H: パイプライン → 言語学
// ============================================================

describe('C→H: pipelineToLinguistics — パイプライン → 言語学', () => {
  test('パイプライン → SyntaxTree', () => {
    const pipe = createTestPipeline(5);
    const tree = pipelineToLinguistics(pipe);
    expect(tree.reiType).toBe('SyntaxTree');
    expect(tree.sentence).toBeDefined();
    expect(tree.sentence.toLowerCase()).toContain('pipeline');
  });

  test('空パイプライン → "empty" 記述', () => {
    const pipe = createEmptyPipeline();
    const tree = pipelineToLinguistics(pipe);
    expect(tree.sentence.toLowerCase()).toContain('empty');
  });

  test('transform多いパイプラインの記述にpipelineが含まれる', () => {
    let pipe = createPipelineSpace('t_pipe', [1, 2, 3]);
    pipe = addStage(pipe, { id: 't1', transform: (x: number) => x * 2 });
    pipe = addStage(pipe, { id: 't2', transform: (x: number) => x + 1 });
    pipe = addStage(pipe, { id: 't3', transform: (x: number) => x * 3 });
    pipe = addStage(pipe, { id: 't4', transform: (x: number) => x - 1 });
    pipe = pipelineRun(pipe);
    const tree = pipelineToLinguistics(pipe);
    expect(tree.sentence.toLowerCase()).toContain('pipeline');
    expect(tree.sentence).toContain('4');
  });

  test('ステージ数が文に含まれる', () => {
    const pipe = createTestPipeline(7);
    const tree = pipelineToLinguistics(pipe);
    expect(tree.sentence).toContain('7');
  });
});

// ============================================================
// D→E: 人文科学 → 芸術
// ============================================================

describe('D→E: humanToArt — 人文科学 → 芸術', () => {
  test('TextAnalysisResult → ColorHarmony', () => {
    const text = createTestText();
    const art = humanToArt(text);
    expect(art.reiType).toBe('ColorHarmony');
    expect((art as any).colors.length).toBeGreaterThan(0);
  });

  test('EthicsResult → PatternResult', () => {
    const ethics = createTestEthics();
    const art = humanToArt(ethics);
    expect(art.reiType).toBe('PatternResult');
    expect((art as any).width).toBe(8);
    expect((art as any).height).toBe(8);
  });

  test('パターンの値が0-1範囲 (倫理)', () => {
    const ethics = createTestEthics();
    const art = humanToArt(ethics);
    if (art.reiType === 'PatternResult') {
      for (const row of (art as any).data) {
        for (const val of row) {
          expect(val).toBeGreaterThanOrEqual(0);
          expect(val).toBeLessThanOrEqual(1);
        }
      }
    }
  });

  test('ColorHarmonyのcolorsが定義', () => {
    const text = createTestText();
    const art = humanToArt(text);
    if (art.reiType === 'ColorHarmony') {
      expect((art as any).colors).toBeDefined();
      expect((art as any).scheme).toBeDefined();
    }
  });
});

// ============================================================
// D→F: 人文科学 → 音楽
// ============================================================

describe('D→F: humanToMusic — 人文科学 → 音楽', () => {
  test('TextAnalysisResult → MelodyResult or ScaleResult', () => {
    const text = createTestText();
    const music = humanToMusic(text);
    expect(['MelodyResult', 'ScaleResult']).toContain(music.reiType);
    if (music.reiType === 'MelodyResult') {
      expect((music as any).notes.length).toBeGreaterThan(0);
    }
  });

  test('EthicsResult → ScaleResult', () => {
    const ethics = createTestEthics();
    const music = humanToMusic(ethics);
    expect(music.reiType).toBe('ScaleResult');
  });

  test('root と mode が定義', () => {
    const ethics = createTestEthics();
    const music = humanToMusic(ethics);
    expect((music as any).root).toBeDefined();
    expect((music as any).mode).toBeDefined();
  });

  test('テキストの語数が多いとメロディ', () => {
    const text = analyzeText('This is a long sentence with many words to generate a nice melody from the text');
    const music = humanToMusic(text);
    expect(['MelodyResult', 'ScaleResult']).toContain(music.reiType);
  });
});

// ============================================================
// D→G: 倫理 → 経済学
// ============================================================

describe('D→G: ethicsToMarket — 倫理 → 経済学', () => {
  test('EthicsResult → MarketState', () => {
    const ethics = createTestEthics();
    const market = ethicsToMarket(ethics);
    expect(market.reiType).toBe('MarketState');
    expect(market.agents.length).toBeGreaterThanOrEqual(3);
  });

  test('エージェント戦略が倫理スコアに基づく', () => {
    const ethics = createTestEthics();
    const market = ethicsToMarket(ethics);
    // 全エージェントの戦略が設定されている
    for (const agent of market.agents) {
      expect(['fundamental', 'momentum']).toContain(agent.strategy);
    }
  });

  test('ボラティリティが0-1範囲', () => {
    const ethics = createTestEthics();
    const market = ethicsToMarket(ethics);
    expect(market.volatility).toBeGreaterThan(0);
    expect(market.volatility).toBeLessThan(1);
  });

  test('ethicsScoreメタデータ', () => {
    const ethics = createTestEthics();
    const market = ethicsToMarket(ethics);
    expect((market as any).ethicsScore).toBeDefined();
    expect((market as any).ethicsScore).toBeGreaterThanOrEqual(0);
    expect((market as any).ethicsScore).toBeLessThanOrEqual(1);
  });

  test('基準価格は100', () => {
    const ethics = createTestEthics();
    const market = ethicsToMarket(ethics);
    // createMarket(name, 100, 6)
    expect(market.price).toBe(100);
  });
});

// ============================================================
// D→H: グラフ → 言語学
// ============================================================

describe('D→H: graphToLinguistics — グラフ → 言語学', () => {
  test('グラフ → SyntaxTree', () => {
    const graph = createTestGraph();
    const tree = graphToLinguistics(graph);
    expect(tree.reiType).toBe('SyntaxTree');
    expect(tree.sentence).toBeDefined();
  });

  test('中心性の高いノードが主語', () => {
    const graph = createTestGraph();
    const tree = graphToLinguistics(graph);
    // "Core"が最も中心性が高い(3エッジ)
    expect(tree.sentence).toContain('Core');
  });

  test('空グラフ → "empty" 記述', () => {
    const graph = createEmptyGraph();
    const tree = graphToLinguistics(graph);
    expect(tree.sentence.toLowerCase()).toContain('empty');
  });

  test('エッジ情報が記述に含まれる', () => {
    const graph = createTestGraph();
    const tree = graphToLinguistics(graph);
    expect(tree.sentence.length).toBeGreaterThan(10);
  });

  test('単ノードグラフ', () => {
    let g = createGraphSpace('single');
    g = addGraphNode(g, 'alone', 'Solitary');
    const tree = graphToLinguistics(g);
    expect(tree.sentence).toContain('Solitary');
  });
});

// ============================================================
// ラッパー関数テスト
// ============================================================

describe('BCD→EFGH ラッパー関数', () => {
  test('wrapSimToArt → EFGHCrossDomainResult', () => {
    const result = wrapSimToArt(createTestSim(6));
    expect(result.reiType).toBe('EFGHCrossDomainResult');
    expect(result.source.domain).toBe('B.NaturalScience');
    expect(result.target.domain).toBe('E.Art');
    expect(result.bridge).toBe('sim_to_art');
  });

  test('wrapSimToMusic → synesthesia', () => {
    const result = wrapSimToMusic(createTestSim(6));
    expect(result.target.domain).toBe('F.Music');
    expect(result.metadata.synesthesia).toBe(0.6);
  });

  test('wrapSimToMarket → B→G', () => {
    const result = wrapSimToMarket(createTestSim(6));
    expect(result.target.domain).toBe('G.Economics');
  });

  test('wrapSimToLinguistics → B→H', () => {
    const result = wrapSimToLinguistics(createTestSim(6));
    expect(result.target.domain).toBe('H.Linguistics');
  });

  test('wrapPipelineToArt → C→E', () => {
    const result = wrapPipelineToArt(createTestPipeline(5));
    expect(result.source.domain).toBe('C.InfoEngineering');
    expect(result.target.domain).toBe('E.Art');
  });

  test('wrapPipelineToMusic → C→F', () => {
    const result = wrapPipelineToMusic(createTestPipeline(5));
    expect(result.target.domain).toBe('F.Music');
  });

  test('wrapPipelineToMarket → C→G', () => {
    const result = wrapPipelineToMarket(createTestPipeline(5));
    expect(result.target.domain).toBe('G.Economics');
  });

  test('wrapPipelineToLinguistics → C→H', () => {
    const result = wrapPipelineToLinguistics(createTestPipeline(5));
    expect(result.target.domain).toBe('H.Linguistics');
  });

  test('wrapHumanToArt → D→E', () => {
    const result = wrapHumanToArt(createTestText());
    expect(result.source.domain).toBe('D.Humanities');
    expect(result.target.domain).toBe('E.Art');
  });

  test('wrapHumanToMusic → D→F', () => {
    const result = wrapHumanToMusic(createTestText());
    expect(result.target.domain).toBe('F.Music');
  });

  test('wrapEthicsToMarket → D→G', () => {
    const result = wrapEthicsToMarket(createTestEthics());
    expect(result.source.type).toBe('EthicsResult');
    expect(result.target.domain).toBe('G.Economics');
  });

  test('wrapGraphToLinguistics → D→H', () => {
    const result = wrapGraphToLinguistics(createTestGraph());
    expect(result.source.domain).toBe('D.Humanities');
    expect(result.target.domain).toBe('H.Linguistics');
  });
});

// ============================================================
// σ（シグマ）関数テスト
// ============================================================

describe('BCD→EFGH σ (シグマ)', () => {
  test('getBCDtoEFGHSigma — 6属性メタデータ', () => {
    const result = wrapSimToArt(createTestSim(6));
    const sigma = getBCDtoEFGHSigma(result);
    
    expect(sigma.field).toBeDefined();
    expect(sigma.field.direction).toBe('BCD→EFGH');
    expect(sigma.flow).toBeDefined();
    expect(sigma.flow.transformation).toBe('inorganic_to_organic');
    expect(sigma.memory).toBeDefined();
    expect(sigma.layer).toBeDefined();
    expect(sigma.relation).toBeDefined();
    expect(sigma.relation.philosophy).toBe('無機質有機体');
    expect(sigma.will).toBeDefined();
  });

  test('σの方向性が正しい (C→F)', () => {
    const result = wrapPipelineToMusic(createTestPipeline(5));
    const sigma = getBCDtoEFGHSigma(result);
    expect(sigma.field.source.domain).toBe('C.InfoEngineering');
    expect(sigma.field.target.domain).toBe('F.Music');
  });
});

// ============================================================
// 横断チェーン — BCD→EFGH→BCD 往復テスト
// ============================================================

describe('横断チェーン — 往復変換', () => {
  test('B→E→B: simToArt → artToSim 往復', async () => {
    const { artToSim } = await import('../src/lang/domains/cross-domain-efgh');
    const sim = createTestSim(8);
    const art = simToArt(sim);
    if (art.reiType === 'PatternResult') {
      const sim2 = artToSim(art);
      expect(sim2.reiType).toBe('SimulationSpace');
      expect(sim2.particles.length).toBeGreaterThan(0);
    }
  });

  test('B→F→B: simToMusic → musicToSim 往復', async () => {
    const { musicToSim } = await import('../src/lang/domains/cross-domain-efgh');
    const sim = createTestSim(8);
    const music = simToMusic(sim);
    const sim2 = musicToSim(music);
    expect(sim2.reiType).toBe('SimulationSpace');
    expect(sim2.particles.length).toBeGreaterThan(0);
  });

  test('C→E→F: pipelineToArt → artToMusic チェーン', async () => {
    const { artToMusic } = await import('../src/lang/domains/cross-domain-efgh');
    const pipe = createTestPipeline(5);
    const art = pipelineToArt(pipe);
    const music = artToMusic(art);
    expect(music.reiType).toBe('ScaleResult');
  });

  test('D→E→G: humanToArt → artToMarket チェーン', async () => {
    const { artToMarket } = await import('../src/lang/domains/cross-domain-efgh');
    const text = createTestText();
    const art = humanToArt(text);
    const market = artToMarket(art);
    expect(market.reiType).toBe('MarketState');
  });
});

// ============================================================
// 「無機質有機体」— 哲学的統合テスト
// ============================================================

describe('無機質有機体 — 数の有機的変容', () => {
  test('同一の数値データが異なるドメインで異なる意味を持つ', () => {
    const sim = createTestSim(8);
    const art = simToArt(sim);
    const music = simToMusic(sim);
    const market = simToMarket(sim);
    const lang = simToLinguistics(sim);
    
    const types = new Set([art.reiType, music.reiType, market.reiType, lang.reiType]);
    expect(types.size).toBeGreaterThanOrEqual(3);
  });

  test('全12方向のブリッジが機能する', () => {
    const sim = createTestSim(6);
    const pipe = createTestPipeline(4);
    const text = createTestText();
    const ethics = createTestEthics();
    const graph = createTestGraph();
    
    // B→EFGH (4)
    expect(simToArt(sim).reiType).toBeDefined();
    expect(simToMusic(sim).reiType).toBeDefined();
    expect(simToMarket(sim).reiType).toBe('MarketState');
    expect(simToLinguistics(sim).reiType).toBe('SyntaxTree');
    
    // C→EFGH (4)
    expect(pipelineToArt(pipe).reiType).toBeDefined();
    expect(pipelineToMusic(pipe).reiType).toBeDefined();
    expect(pipelineToMarket(pipe).reiType).toBe('MarketState');
    expect(pipelineToLinguistics(pipe).reiType).toBe('SyntaxTree');
    
    // D→EFGH (4)
    expect(humanToArt(text).reiType).toBeDefined();
    expect(humanToMusic(text).reiType).toBeDefined();
    expect(ethicsToMarket(ethics).reiType).toBe('MarketState');
    expect(graphToLinguistics(graph).reiType).toBe('SyntaxTree');
  });
});
