/**
 * Phase 5.5c: ドメイン横断統合テスト
 *
 * B(自然科学) × C(情報工学) × D(人文科学) の連携パイプ
 */

import { describe, test, expect, beforeEach } from 'vitest';
import { rei } from '../src/index';
import {
  simToPipeline,
  simEnergyToPipeline,
  simToCausal,
  simEthics,
  dataToText,
  dataEthics,
  pipelineToSim,
  causalToSim,
  textToPipeline,
  composeDomains,
  getCrossDomainSigma,
  getDomainCompositionSigma,
  wrapCrossDomain,
} from '../src/lang/domains/cross-domain';
import { createNBodySpace } from '../src/lang/domains/natural-science';
import { createETLSpace, addETLStage } from '../src/lang/domains/info-engineering';
import { createPipelineSpace, pipelineRun, addStage } from '../src/lang/domains/pipeline-core';
import { analyzeText, createCausalNetwork, evaluateEthics } from '../src/lang/domains/humanities';
import { addGraphNode, addGraphEdge } from '../src/lang/domains/graph-core';
import { simRun } from '../src/lang/domains/simulation-core';

beforeEach(() => { rei.reset(); });

// ============================================================
// B→C: 自然科学 → 情報工学
// ============================================================

describe('B→C: 自然科学 → 情報工学', () => {
  test('sim_to_pipeline: N体シミュレーション→パイプライン', () => {
    const sim = simRun(createNBodySpace(3, 'gravity', {}), 10);
    const pipeline = simToPipeline(sim);
    expect(pipeline.reiType).toBe('PipelineSpace');
    expect(Array.isArray(pipeline.data)).toBe(true);
    expect(pipeline.data.length).toBe(3);
    expect(pipeline.data[0]).toHaveProperty('x');
    expect(pipeline.data[0]).toHaveProperty('speed');
    expect(pipeline.metadata.sourceDomain).toBe('natural_science');
  });

  test('sim_energy_pipeline: エネルギー時系列→パイプライン', () => {
    const sim = simRun(createNBodySpace(3, 'gravity', {}), 20);
    const pipeline = simEnergyToPipeline(sim);
    expect(pipeline.reiType).toBe('PipelineSpace');
    expect(Array.isArray(pipeline.data)).toBe(true);
    expect(pipeline.data.length).toBeGreaterThan(0);
    expect(pipeline.data[0]).toHaveProperty('kinetic');
    expect(pipeline.data[0]).toHaveProperty('potential');
    expect(pipeline.data[0]).toHaveProperty('total');
  });

  test('パイプ経由: sim_to_pipeline', () => {
    const r = rei('[3] |> nbody("gravity") |> sim_run(10) |> sim_to_pipeline');
    expect(r.reiType).toBe('PipelineSpace');
    expect(Array.isArray(r.data)).toBe(true);
  });

  test('シミュ→パイプ (Japanese)', () => {
    const r = rei('[3] |> N体("gravity") |> sim_run(5) |> シミュ→パイプ');
    expect(r.reiType).toBe('PipelineSpace');
  });

  test('B→Cのフルチェーン: シミュ→パイプ→実行→σ', () => {
    const r = rei('[3] |> nbody("gravity") |> sim_run(10) |> sim_to_pipeline |> etl_stage("clean") |> pipe_run |> pipe_sigma');
    expect(r.reiType).toBe('SigmaResult');
  });
});

// ============================================================
// B→D: 自然科学 → 人文科学
// ============================================================

describe('B→D: 自然科学 → 人文科学', () => {
  test('sim_to_causal: N体→因果ネットワーク', () => {
    const sim = simRun(createNBodySpace(4, 'gravity', {}), 10);
    const graph = simToCausal(sim);
    expect(graph.reiType).toBe('GraphSpace');
    expect(graph.nodes.size).toBe(4);
    expect(graph.edges.length).toBeGreaterThan(0);
    // エッジには重力的影響の重みがある
    expect(graph.edges[0].weight).toBeGreaterThan(0);
    expect(graph.metadata.sourceDomain).toBe('natural_science');
  });

  test('sim_ethics: シミュレーションの倫理的評価', () => {
    const sim = simRun(createNBodySpace(3, 'gravity', {}), 10);
    const ethics = simEthics(sim);
    expect(ethics.reiType).toBe('EthicsResult');
    expect(ethics.perspectives.length).toBeGreaterThan(0);
    expect(ethics.synthesis).toBeDefined();
  });

  test('パイプ経由: sim_to_causal', () => {
    const r = rei('[3] |> nbody("gravity") |> sim_run(10) |> sim_to_causal');
    expect(r.reiType).toBe('GraphSpace');
    expect(r.nodes.size).toBe(3);
  });

  test('シミュ→因果 (Japanese)', () => {
    const r = rei('[3] |> N体("gravity") |> sim_run(5) |> シミュ→因果');
    expect(r.reiType).toBe('GraphSpace');
  });

  test('B→Dのフルチェーン: シミュ→因果→σ', () => {
    const r = rei('[3] |> nbody("gravity") |> sim_run(10) |> sim_to_causal |> graph_sigma');
    expect(r.reiType).toBe('SigmaResult');
  });
});

// ============================================================
// C→D: 情報工学 → 人文科学
// ============================================================

describe('C→D: 情報工学 → 人文科学', () => {
  test('data_to_text: パイプライン→テキスト分析', () => {
    const pipeline = createPipelineSpace([
      { name: 'アリス', age: 30 },
      { name: 'ボブ', age: 25 },
    ]);
    pipeline.result = pipeline.data; // simulate completed pipeline
    const text = dataToText(pipeline);
    expect(text.reiType).toBe('TextAnalysis');
    expect(text.stats.totalChars).toBeGreaterThan(0);
  });

  test('data_ethics: データ処理の倫理的評価', () => {
    let pipeline = createETLSpace('a,b\n1,2\n3,4');
    pipeline = addETLStage(pipeline, 'extract', {});
    const ethics = dataEthics(pipeline);
    expect(ethics.reiType).toBe('EthicsResult');
    expect(ethics.perspectives.length).toBeGreaterThan(0);
  });

  test('パイプ経由: data_to_text', () => {
    const r = rei('"name,value\\n田中,100\\n佐藤,200" |> etl |> etl_stage("extract") |> pipe_run |> data_to_text');
    expect(r.reiType).toBe('TextAnalysis');
  });

  test('データ→テキスト (Japanese)', () => {
    const r = rei('"a,b\\n1,2" |> ETL |> etl_stage("extract") |> pipe_run |> データ→テキスト');
    expect(r.reiType).toBe('TextAnalysis');
  });
});

// ============================================================
// C→B: 情報工学 → 自然科学
// ============================================================

describe('C→B: 情報工学 → 自然科学', () => {
  test('pipeline_to_sim: データ→シミュレーション初期条件', () => {
    const pipeline = createPipelineSpace([
      { id: 'p0', x: 0, y: 0, mass: 1 },
      { id: 'p1', x: 1, y: 1, mass: 2 },
      { id: 'p2', x: 2, y: 0, mass: 1.5 },
    ]);
    pipeline.result = pipeline.data;
    const sim = pipelineToSim(pipeline);
    expect(sim.reiType).toBe('SimulationSpace');
    expect(sim.particles.length).toBe(3);
    expect(sim.particles[0].position[0]).toBe(0);
    expect(sim.particles[1].mass).toBe(2);
    expect(sim.metadata.sourceDomain).toBe('info_engineering');
  });

  test('パイプ経由: pipeline_to_sim', () => {
    // ETLで生成したデータからシミュを構築
    const r = rei('"id,x,y,mass\\np0,0,0,1\\np1,1,1,2" |> etl |> etl_stage("extract") |> pipe_run |> pipeline_to_sim');
    expect(r.reiType).toBe('SimulationSpace');
    expect(r.particles.length).toBeGreaterThan(0);
  });

  test('パイプ→シミュ (Japanese)', () => {
    const r = rei('"id,x,y\\na,0,0\\nb,1,1" |> ETL |> etl_stage("extract") |> pipe_run |> パイプ→シミュ');
    expect(r.reiType).toBe('SimulationSpace');
  });
});

// ============================================================
// D→B: 人文科学 → 自然科学
// ============================================================

describe('D→B: 人文科学 → 自然科学', () => {
  test('causal_to_sim: 因果ネットワーク→力学系', () => {
    const graph = createCausalNetwork('test');
    addGraphNode(graph, 'A', 'A', { influence: 2 });
    addGraphNode(graph, 'B', 'B', { influence: 1 });
    addGraphNode(graph, 'C', 'C', { influence: 1.5 });
    addGraphEdge(graph, 'A', 'B', 'causal', 0.8);
    addGraphEdge(graph, 'B', 'C', 'causal', 0.5);
    
    const sim = causalToSim(graph);
    expect(sim.reiType).toBe('SimulationSpace');
    expect(sim.particles.length).toBe(3);
    expect(sim.rules.length).toBe(1);
    expect(sim.rules[0].name).toBe('causal_attraction');
    // 質量はinfluenceから
    expect(sim.particles[0].mass).toBe(2);
  });

  test('causal_to_sim → sim_run 可能', () => {
    const graph = createCausalNetwork('dynamics');
    addGraphNode(graph, 'X', 'X', { influence: 1 });
    addGraphNode(graph, 'Y', 'Y', { influence: 1 });
    addGraphEdge(graph, 'X', 'Y', 'causal', 0.5);
    
    const sim = causalToSim(graph);
    const result = simRun(sim, 50);
    expect(result.time).toBeGreaterThan(0);
    expect(result.history.length).toBeGreaterThanOrEqual(50);
  });

  test('パイプ経由: causal_to_sim', () => {
    const r = rei('"test" |> causal_network |> causal_chain("A", "B", "C") |> causal_to_sim');
    expect(r.reiType).toBe('SimulationSpace');
    expect(r.particles.length).toBe(3);
  });

  test('因果→シミュ (Japanese)', () => {
    const r = rei('"関係" |> 因果網 |> causal_chain("甲", "乙") |> 因果→シミュ');
    expect(r.reiType).toBe('SimulationSpace');
  });
});

// ============================================================
// D→C: 人文科学 → 情報工学
// ============================================================

describe('D→C: 人文科学 → 情報工学', () => {
  test('text_to_pipeline: テキスト分析→パイプライン', () => {
    const analysis = analyzeText('これはテストです。日本語のテキスト分析を行います。');
    const pipeline = textToPipeline(analysis);
    expect(pipeline.reiType).toBe('PipelineSpace');
    expect(Array.isArray(pipeline.data)).toBe(true);
    expect(pipeline.data.length).toBeGreaterThan(0);
    expect(pipeline.data[0]).toHaveProperty('character');
    expect(pipeline.data[0]).toHaveProperty('frequency');
    expect(pipeline.metadata.sourceDomain).toBe('humanities');
  });

  test('パイプ経由: text_to_pipeline', () => {
    const r = rei('"東京は日本の首都です" |> text_analyze |> text_to_pipeline');
    expect(r.reiType).toBe('PipelineSpace');
    expect(Array.isArray(r.data)).toBe(true);
  });

  test('テキスト→パイプ (Japanese)', () => {
    const r = rei('"テスト文字列" |> テキスト分析 |> テキスト→パイプ');
    expect(r.reiType).toBe('PipelineSpace');
  });
});

// ============================================================
// 三領域統合
// ============================================================

describe('三領域統合', () => {
  test('composeDomains: 基本統合', () => {
    const sim = simRun(createNBodySpace(3, 'gravity', {}), 10);
    const pipeline = createPipelineSpace([1, 2, 3]);
    const text = analyzeText('テストテキスト');
    
    const comp = composeDomains(sim, pipeline, text);
    expect(comp.reiType).toBe('DomainComposition');
    expect(comp.natural).toBeDefined();
    expect(comp.engineering).toBeDefined();
    expect(comp.humanities).toBeDefined();
    expect(comp.synthesis).toBeDefined();
    expect(typeof comp.synthesis.harmony).toBe('number');
    expect(Array.isArray(comp.synthesis.commonPatterns)).toBe(true);
    expect(Array.isArray(comp.synthesis.tensions)).toBe(true);
  });

  test('composeDomains: σ取得', () => {
    const sim = simRun(createNBodySpace(3, 'gravity', {}), 10);
    const pipeline = createPipelineSpace([1, 2, 3]);
    const text = analyzeText('テスト');
    
    const comp = composeDomains(sim, pipeline, text);
    const sigma = getDomainCompositionSigma(comp);
    expect(sigma.reiType).toBe('SigmaResult');
    expect(sigma.domain).toBe('cross_domain');
    expect(sigma.subtype).toBe('composition');
    expect(sigma.harmony).toBeDefined();
  });
});

// ============================================================
// 循環ブリッジ: A→B→C→A
// ============================================================

describe('循環ブリッジ', () => {
  test('B→C→D: シミュ→パイプ→テキスト分析', () => {
    const sim = simRun(createNBodySpace(3, 'gravity', {}), 10);
    const pipeline = simToPipeline(sim);
    pipeline.result = pipeline.data;
    const text = dataToText(pipeline);
    expect(text.reiType).toBe('TextAnalysis');
    expect(text.stats.totalChars).toBeGreaterThan(0);
  });

  test('D→B→C: 因果→シミュ→パイプ', () => {
    const graph = createCausalNetwork('cycle');
    addGraphNode(graph, 'A', 'A', { influence: 1 });
    addGraphNode(graph, 'B', 'B', { influence: 1 });
    addGraphEdge(graph, 'A', 'B', 'causal', 0.5);
    
    const sim = causalToSim(graph);
    const ranSim = simRun(sim, 10);
    const pipeline = simToPipeline(ranSim);
    expect(pipeline.reiType).toBe('PipelineSpace');
    expect(pipeline.data.length).toBe(2);
  });

  test('C→D→B: パイプ→テキスト→（テキストメトリクスから分析）', () => {
    const pipeline = createPipelineSpace([
      { name: 'test', value: 42 },
    ]);
    pipeline.result = pipeline.data;
    const text = dataToText(pipeline);
    expect(text.reiType).toBe('TextAnalysis');
    // テキスト分析結果をさらにパイプラインに戻す
    const backPipeline = textToPipeline(text);
    expect(backPipeline.reiType).toBe('PipelineSpace');
  });

  test('パイプ経由: フルサイクル B→C→D', () => {
    const r = rei('[3] |> nbody("gravity") |> sim_run(10) |> sim_to_pipeline |> etl_stage("clean") |> pipe_run |> data_to_text');
    expect(r.reiType).toBe('TextAnalysis');
  });

  test('パイプ経由: フルサイクル D→B→C', () => {
    const r = rei('"test" |> causal_network |> causal_chain("A", "B", "C") |> causal_to_sim |> sim_run(10) |> sim_to_pipeline');
    expect(r.reiType).toBe('PipelineSpace');
  });
});

// ============================================================
// 横断σ
// ============================================================

describe('横断σ', () => {
  test('wrapCrossDomain + cross_sigma', () => {
    const wrapped = wrapCrossDomain(
      { test: true },
      'natural_science', 'SimulationSpace',
      'info_engineering', 'PipelineSpace',
      'sim_to_pipeline',
    );
    const sigma = getCrossDomainSigma(wrapped);
    expect(sigma.reiType).toBe('SigmaResult');
    expect(sigma.domain).toBe('cross_domain');
    expect(sigma.flow.direction).toContain('→');
  });
});

// ============================================================
// 日本語エイリアス包括テスト
// ============================================================

describe('日本語エイリアス', () => {
  test('B→C: シミュ→パイプ', () => {
    const r = rei('[3] |> N体("gravity") |> sim_run(5) |> シミュ→パイプ');
    expect(r.reiType).toBe('PipelineSpace');
  });

  test('B→D: シミュ→因果', () => {
    const r = rei('[3] |> N体("gravity") |> sim_run(5) |> シミュ→因果');
    expect(r.reiType).toBe('GraphSpace');
  });

  test('D→B: 因果→シミュ', () => {
    const r = rei('"test" |> 因果網 |> causal_chain("X", "Y") |> 因果→シミュ');
    expect(r.reiType).toBe('SimulationSpace');
  });

  test('D→C: テキスト→パイプ', () => {
    const r = rei('"日本語テスト" |> テキスト分析 |> テキスト→パイプ');
    expect(r.reiType).toBe('PipelineSpace');
  });

  test('C→D: データ→テキスト', () => {
    const r = rei('"a,b\\n1,2" |> ETL |> etl_stage("extract") |> pipe_run |> データ→テキスト');
    expect(r.reiType).toBe('TextAnalysis');
  });

  test('C→B: パイプ→シミュ', () => {
    const r = rei('"x,y\\n0,0\\n1,1" |> ETL |> etl_stage("extract") |> pipe_run |> パイプ→シミュ');
    expect(r.reiType).toBe('SimulationSpace');
  });
});
