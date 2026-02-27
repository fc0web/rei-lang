/**
 * Phase 5: マルチドメイン拡張テスト
 * 
 * B. 自然科学（N体問題、波動場）
 * C. 情報工学（ETLパイプライン、LLMチェーン）
 * D. 人文科学（テキスト分析、系譜・因果ネットワーク、倫理推論）
 * 共通層（simulation-core, pipeline-core, graph-core）
 */

import { describe, test, expect } from 'vitest';
import { rei } from '../src/index';

function evalRei(code: string): any {
  rei.reset();
  return rei(code);
}

// ============================================================
// 共通層テスト
// ============================================================

describe('Phase 5 共通層: simulation-core', () => {
  test('SimulationSpace作成', () => {
    const r = evalRei('[3] |> nbody("gravity")');
    expect(r.reiType).toBe('SimulationSpace');
    expect(r.particles.length).toBe(3);
    expect(r.domain).toBe('natural_science');
  });

  test('sim_step: 1ステップ進行', () => {
    const r = evalRei('[2] |> nbody("gravity") |> sim_step');
    expect(r.time).toBeGreaterThan(0);
    expect(r.history.length).toBeGreaterThan(0);
  });

  test('sim_run: 複数ステップ', () => {
    const r = evalRei('[2] |> nbody("gravity") |> sim_run(10)');
    expect(r.history.length).toBeGreaterThan(1);
    expect(r.time).toBeGreaterThan(0);
  });

  test('sim_sigma: σメタデータ', () => {
    const r = evalRei('[2] |> nbody("gravity") |> sim_run(10) |> sim_sigma');
    expect(r.reiType).toBe('SigmaResult');
    expect(r.field).toBeDefined();
    expect(r.flow).toBeDefined();
    expect(r.memory).toBeDefined();
    expect(r.relation).toBeDefined();
    expect(r.will).toBeDefined();
    expect(r.energy).toBeDefined();
  });
});

describe('Phase 5 共通層: pipeline-core', () => {
  test('PipelineSpace作成', () => {
    const r = evalRei('[1,2,3,4,5] |> pipeline');
    expect(r.reiType).toBe('PipelineSpace');
    expect(r.stages.length).toBe(0);
  });

  test('pipe_stage追加', () => {
    const r = evalRei('[1,2,3] |> pipeline |> pipe_stage("extract")');
    expect(r.stages.length).toBe(1);
    expect(r.stages[0].name).toBe('extract');
  });

  test('pipe_run実行', () => {
    const r = evalRei('"a,b,c\\n1,2,3" |> pipeline |> pipe_stage("extract") |> pipe_run');
    expect(r.status).toBe('completed');
    expect(r.result).toBeDefined();
  });

  test('pipe_sigma', () => {
    const r = evalRei('"data" |> pipeline |> pipe_stage("extract") |> pipe_run |> pipe_sigma');
    expect(r.reiType).toBe('SigmaResult');
    expect(r.flow).toBeDefined();
    expect(r.layer).toBeDefined();
    expect(r.performance).toBeDefined();
  });
});

describe('Phase 5 共通層: graph-core', () => {
  test('GraphSpace作成', () => {
    const r = evalRei('"test" |> graph');
    expect(r.reiType).toBe('GraphSpace');
    expect(r.nodes.size).toBe(0);
  });

  test('graph_node: ノード追加', () => {
    const r = evalRei('"g" |> graph |> graph_node("A") |> graph_node("B")');
    expect(r.nodes.size).toBe(2);
    expect(r.nodes.has('A')).toBe(true);
  });

  test('graph_edge: エッジ追加', () => {
    const r = evalRei('"g" |> graph |> graph_edge("A", "B", "related")');
    expect(r.edges.length).toBe(1);
    expect(r.edges[0].from).toBe('A');
    expect(r.edges[0].to).toBe('B');
  });

  test('graph_traverse: BFS走査', () => {
    const r = evalRei('"g" |> graph |> graph_edge("A", "B", "r") |> graph_edge("B", "C", "r") |> graph_traverse("A")');
    expect(r.visited).toContain('A');
    expect(r.visited).toContain('B');
    expect(r.visited).toContain('C');
  });

  test('graph_sigma', () => {
    const r = evalRei('"g" |> graph |> graph_edge("A", "B", "r") |> graph_sigma');
    expect(r.reiType).toBe('SigmaResult');
    expect(r.field.nodes).toBe(2);
    expect(r.field.edges).toBe(1);
  });
});

// ============================================================
// ドメインB: 自然科学テスト
// ============================================================

describe('Phase 5 ドメインB: 自然科学', () => {
  test('N体: gravity', () => {
    const r = evalRei('[3] |> nbody("gravity") |> sim_run(20) |> sim_sigma');
    expect(r.domain).toBe('natural_science');
    expect(r.energy).toBeDefined();
    expect(r.field.particles).toBe(3);
  });

  test('N体: spring', () => {
    const r = evalRei('[4] |> nbody("spring") |> sim_run(10) |> sim_sigma');
    expect(r.field.particles).toBe(4);
    expect(r.energy).toBeDefined();
  });

  test('N体: coulomb', () => {
    const r = evalRei('[2] |> nbody("coulomb") |> sim_run(10) |> sim_sigma');
    expect(r.field.particles).toBe(2);
  });

  test('N体: エネルギー保存', () => {
    const r = evalRei('[2] |> nbody("gravity") |> sim_run(50) |> sim_sigma');
    expect(r.energyConservation).toBeGreaterThan(0.5);
  });

  test('wave_field: 波動場の作成', () => {
    const r = evalRei('[10, 10] |> wave_field');
    expect(r.reiType).toBe('WaveFieldSpace');
    expect(r.width).toBe(10);
    expect(r.height).toBe(10);
  });

  test('wave_field: ステップ実行', () => {
    const r = evalRei('[8, 8] |> wave_field |> wave_run(10)');
    expect(r.time).toBeGreaterThan(0);
    expect(r.history.length).toBe(10);
  });

  test('wave_field: σ', () => {
    const r = evalRei('[8, 8] |> wave_field |> wave_run(5) |> wave_sigma');
    expect(r.reiType).toBe('SigmaResult');
    expect(r.domain).toBe('natural_science');
    expect(r.subtype).toBe('wave_field');
    expect(r.energy).toBeDefined();
  });

  test('wave_field: 減衰', () => {
    const r = evalRei('[6, 6] |> wave_field |> wave_run(50) |> wave_sigma');
    // 減衰により振幅が減少するはず
    expect(r.maxAmplitude).toBeDefined();
  });
});

// ============================================================
// ドメインC: 情報工学テスト
// ============================================================

describe('Phase 5 ドメインC: 情報工学 - ETL', () => {
  test('ETLパイプライン: extract', () => {
    const r = evalRei('"a,b\\n1,2\\n3,4" |> etl |> etl_stage("extract") |> pipe_run');
    expect(r.status).toBe('completed');
    expect(Array.isArray(r.result)).toBe(true);
  });

  test('ETLパイプライン: clean', () => {
    const r = evalRei('[1, null, 2, "", 3] |> etl |> etl_stage("clean") |> pipe_run');
    expect(r.status).toBe('completed');
    const result = r.result;
    expect(result).not.toContain(null);
    expect(result).not.toContain('');
  });

  test('ETLパイプライン: deduplicate', () => {
    const r = evalRei('[1, 2, 2, 3, 3, 3] |> etl |> etl_stage("deduplicate") |> pipe_run');
    expect(r.result.length).toBe(3);
  });

  test('ETLパイプライン: normalize', () => {
    const r = evalRei('[0, 50, 100] |> etl |> etl_stage("normalize") |> pipe_run');
    expect(r.result[0]).toBe(0);
    expect(r.result[1]).toBe(0.5);
    expect(r.result[2]).toBe(1);
  });

  test('ETLパイプライン: aggregate', () => {
    const r = evalRei('[10, 20, 30] |> etl |> etl_stage("aggregate") |> pipe_run');
    expect(r.result.count).toBe(3);
  });

  test('ETL完全パイプライン', () => {
    const r = evalRei('"a,b\\n1,2\\n3,4" |> etl |> etl_stage("extract") |> etl_stage("clean") |> pipe_run |> pipe_sigma');
    expect(r.reiType).toBe('SigmaResult');
    expect(r.domain).toBe('info_engineering');
    expect(r.layer.depth).toBe(2);
  });

  test('ETL: load ステージ', () => {
    const r = evalRei('[1, 2, 3] |> etl |> etl_stage("load") |> pipe_run');
    expect(r.result.loaded).toBe(true);
    expect(r.result.records).toBeDefined();
  });
});

describe('Phase 5 ドメインC: 情報工学 - LLMチェーン', () => {
  test('LLMチェーン作成', () => {
    const r = evalRei('"Hello world" |> llm_chain');
    expect(r.reiType).toBe('LLMChainSpace');
    expect(r.context).toBe('Hello world');
  });

  test('LLMチェーン: summarize', () => {
    const r = evalRei('"A long text about programming" |> llm_chain |> llm_stage("summarize")');
    expect(r.result).toContain('[Summary');
    expect(r.prompts.length).toBe(1);
  });

  test('LLMチェーン: マルチステージ', () => {
    const r = evalRei('"Input text" |> llm_chain |> llm_stage("analyze") |> llm_stage("summarize")');
    expect(r.prompts.length).toBe(2);
    expect(r.tokens.input).toBeGreaterThan(0);
    expect(r.tokens.output).toBeGreaterThan(0);
  });

  test('LLMチェーン: σ', () => {
    const r = evalRei('"text" |> llm_chain |> llm_stage("classify") |> llm_sigma');
    expect(r.reiType).toBe('SigmaResult');
    expect(r.subtype).toBe('llm_chain');
    expect(r.tokens).toBeDefined();
  });

  test('LLMチェーン: extract', () => {
    const r = evalRei('"Tokyo is the capital of Japan" |> llm_chain |> llm_stage("extract")');
    expect(r.result).toContain('[Extracted');
  });
});

// ============================================================
// ドメインD: 人文科学テスト
// ============================================================

describe('Phase 5 ドメインD: 人文科学 - テキスト分析', () => {
  test('text_analyze: 基本分析', () => {
    const r = evalRei('"hello world hello" |> text_analyze');
    expect(r.reiType).toBe('TextAnalysis');
    expect(r.stats.totalChars).toBe(17);
    expect(r.stats.uniqueChars).toBeGreaterThan(0);
  });

  test('text_analyze: エントロピー', () => {
    const r = evalRei('"aaaaaa" |> text_analyze');
    expect(r.stats.entropy).toBe(0); // 単一文字 = エントロピー0
  });

  test('text_analyze: 多様なテキスト', () => {
    const r = evalRei('"abcdefghij" |> text_analyze');
    expect(r.stats.entropy).toBeGreaterThan(2); // 高エントロピー
    expect(r.stats.diversity).toBe(1); // 全文字ユニーク
  });

  test('text_analyze: パターン検出', () => {
    const r = evalRei('"ababababab" |> text_analyze');
    expect(r.patterns.length).toBeGreaterThan(0);
    // "ab" パターンが検出されるはず
    const abPattern = r.patterns.find((p: any) => p.pattern === 'ab');
    expect(abPattern).toBeDefined();
  });

  test('text_sigma: テキストのσ', () => {
    const r = evalRei('"some text for analysis" |> text_analyze |> text_sigma');
    expect(r.reiType).toBe('SigmaResult');
    expect(r.domain).toBe('humanities');
    expect(r.subtype).toBe('text_analysis');
    expect(r.entropy).toBeDefined();
    expect(r.diversity).toBeDefined();
  });

  test('text_analyze: 日本語テキスト', () => {
    const r = evalRei('"これはテストです。テストの文章です。" |> text_analyze');
    expect(r.stats.totalChars).toBeGreaterThan(0);
    expect(r.structure.sentences).toBeGreaterThanOrEqual(1);
  });
});

describe('Phase 5 ドメインD: 人文科学 - 系譜・因果ネットワーク', () => {
  test('genealogy: 作成', () => {
    const r = evalRei('"dynasty" |> genealogy');
    expect(r.reiType).toBe('GraphSpace');
    expect(r.metadata.type).toBe('genealogy');
  });

  test('genealogy: ノードとエッジ', () => {
    const r = evalRei('"family" |> genealogy |> graph_node("parent") |> graph_edge("parent", "child", "parent")');
    expect(r.nodes.size).toBe(2);
    expect(r.edges.length).toBe(1);
  });

  test('causal_network: 因果チェーン', () => {
    const r = evalRei('"history" |> causal_network |> causal_chain("A", "B", "C")');
    expect(r.edges.length).toBe(2);
    expect(r.edges[0].type).toBe('caused');
  });

  test('causal_network: 影響伝播', () => {
    const r = evalRei('"net" |> causal_network |> causal_chain("A", "B", "C", "D") |> influence_propagate("A")');
    expect(r.size).toBeGreaterThan(0);
    expect(r.get('A')).toBe(1); // ソースは最大影響
    expect(r.get('B')).toBeGreaterThan(0);
  });

  test('genealogy_sigma', () => {
    const r = evalRei('"dynasty" |> genealogy |> graph_edge("A", "B", "parent") |> graph_edge("B", "C", "parent") |> genealogy_sigma');
    expect(r.reiType).toBe('SigmaResult');
    expect(r.genealogy).toBeDefined();
    expect(r.genealogy.roots).toBeDefined();
  });
});

describe('Phase 5 ドメインD: 人文科学 - 倫理推論', () => {
  test('ethics: 基本評価', () => {
    const r = evalRei('"sharing knowledge" |> ethics');
    expect(r.reiType).toBe('EthicsResult');
    expect(r.perspectives.length).toBe(5);
    expect(r.synthesis).toBeDefined();
  });

  test('ethics: 特定フレームワーク', () => {
    const r = evalRei('"donate to charity" |> ethics("utilitarian")');
    expect(r.perspectives.length).toBe(1);
    expect(r.perspectives[0].framework).toBe('utilitarian');
  });

  test('ethics: 複合評価', () => {
    const r = evalRei('"help others" |> ethics |> ethics_sigma');
    expect(r.reiType).toBe('SigmaResult');
    expect(r.domain).toBe('humanities');
    expect(r.subtype).toBe('ethics');
    expect(r.recommendation).toBeDefined();
  });

  test('ethics: コンセンサス検出', () => {
    const r = evalRei('"save a life" |> ethics');
    expect(r.synthesis.consensus).toBeDefined();
    expect(typeof r.synthesis.overallScore).toBe('number');
  });

  test('ethics: 緊張関係の検出', () => {
    const r = evalRei('"complex dilemma" |> ethics');
    expect(r.synthesis.tension).toBeDefined();
    expect(Array.isArray(r.synthesis.tension)).toBe(true);
  });
});

// ============================================================
// ドメイン横断テスト
// ============================================================

describe('Phase 5 ドメイン横断', () => {
  test('全ドメインが共存', () => {
    // 自然科学
    const b = evalRei('[2] |> nbody("gravity") |> sim_run(5) |> sim_sigma');
    expect(b.domain).toBe('natural_science');
    
    // 情報工学
    const c = evalRei('[1,2,3] |> etl |> etl_stage("extract") |> pipe_run |> pipe_sigma');
    expect(c.domain).toBe('info_engineering');
    
    // 人文科学
    const d = evalRei('"test" |> text_analyze |> text_sigma');
    expect(d.domain).toBe('humanities');
  });

  test('グラフは全ドメインで共有', () => {
    const g = evalRei('"g" |> graph |> graph_edge("X", "Y", "r") |> graph_sigma');
    expect(g.reiType).toBe('SigmaResult');
    expect(g.field.nodes).toBe(2);
  });

  test('σの構造が統一的', () => {
    const sims = evalRei('[2] |> nbody("gravity") |> sim_run(5) |> sim_sigma');
    const pipes = evalRei('"data" |> pipeline |> pipe_stage("extract") |> pipe_run |> pipe_sigma');
    const texts = evalRei('"hello" |> text_analyze |> text_sigma');
    
    // 全てSigmaResultで6属性を持つ
    for (const sigma of [sims, pipes, texts]) {
      expect(sigma.reiType).toBe('SigmaResult');
      expect(sigma.field).toBeDefined();
      expect(sigma.flow).toBeDefined();
      expect(sigma.memory).toBeDefined();
      expect(sigma.layer).toBeDefined();
      expect(sigma.relation).toBeDefined();
      expect(sigma.will).toBeDefined();
    }
  });

  test('既存機能との共存（Space）', () => {
    const space = evalRei('𝕄{5; 1, 2, 3} |> sigma');
    expect(space).toBeDefined();
  });

  test('既存機能との共存（パズル）', () => {
    const puzzle = evalRei('25 |> puzzle |> sigma');
    expect(puzzle).toBeDefined();
  });

  test('既存機能との共存（agent）', () => {
    const agent = evalRei('"test_agent" |> agent("reactive", "low")');
    expect(agent).toBeDefined();
  });
});

// ============================================================
// 日本語エイリアステスト
// ============================================================

describe('Phase 5 日本語エイリアス', () => {
  test('N体 (Japanese)', () => {
    const r = evalRei('[3] |> N体("gravity")');
    expect(r.reiType).toBe('SimulationSpace');
  });

  test('波動場 (Japanese)', () => {
    const r = evalRei('[8, 8] |> 波動場');
    expect(r.reiType).toBe('WaveFieldSpace');
  });

  test('テキスト分析 (Japanese)', () => {
    const r = evalRei('"hello" |> テキスト分析');
    expect(r.reiType).toBe('TextAnalysis');
  });

  test('系譜 (Japanese)', () => {
    const r = evalRei('"家系" |> 系譜');
    expect(r.reiType).toBe('GraphSpace');
    expect(r.metadata.type).toBe('genealogy');
  });

  test('因果 network (Japanese)', () => {
    const r = evalRei('"歴史" |> 因果網');
    expect(r.reiType).toBe('GraphSpace');
    expect(r.metadata.type).toBe('causal_network');
  });

  test('倫理 (Japanese)', () => {
    const r = evalRei('"行為" |> 倫理');
    expect(r.reiType).toBe('EthicsResult');
  });
});
