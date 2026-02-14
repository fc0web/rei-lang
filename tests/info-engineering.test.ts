// ============================================================
// Tests: Information Engineering Domain (情報工学ドメイン)
// Phase 5-C: ETLパイプライン、LLMエージェント連携、データフロー
// ============================================================
import { describe, it, expect } from 'vitest';
import {
  createETLPipeline, addExtract, addTransform, addLoad, runETL,
  createAgentOrchestrator, orchestrate,
  analyzeDataFlow, transforms,
  type DataSource, type DataSink, type LLMAgentDef,
} from '../src/lang/info-engineering';

// ═══════════════════════════════════════════
// テスト用データ
// ═══════════════════════════════════════════

const salesSource: DataSource = {
  id: 'src_sales',
  name: 'Sales Data',
  schema: [
    { name: 'product', type: 'string' },
    { name: 'amount', type: 'number' },
    { name: 'region', type: 'string' },
    { name: 'date', type: 'date' },
  ],
  format: 'json',
};

const salesSink: DataSink = {
  id: 'sink_report',
  name: 'Sales Report',
  format: 'json',
};

const sampleData = [
  { product: 'Widget A', amount: 100, region: 'East', date: '2025-01-01' },
  { product: 'Widget B', amount: 200, region: 'West', date: '2025-01-02' },
  { product: 'Widget A', amount: 150, region: 'East', date: '2025-01-03' },
  { product: 'Widget C', amount: 50, region: 'West', date: '2025-01-04' },
  { product: 'Widget B', amount: 300, region: 'East', date: '2025-01-05' },
  { product: 'Widget A', amount: 80, region: 'West', date: '2025-01-06' },
];

// ═══════════════════════════════════════════
// ETLパイプライン
// ═══════════════════════════════════════════

describe('ETL Pipeline', () => {
  it('creates empty pipeline', () => {
    const pipe = createETLPipeline('Test Pipeline');
    expect(pipe.reiType).toBe('ETLPipeline');
    expect(pipe.name).toBe('Test Pipeline');
    expect(pipe.stages.length).toBe(0);
  });

  it('adds extract stage', () => {
    const pipe = createETLPipeline('Test');
    addExtract(pipe, salesSource);
    expect(pipe.stages.length).toBe(1);
    expect(pipe.stages[0].type).toBe('extract');
  });

  it('adds transform stages', () => {
    const pipe = createETLPipeline('Test');
    addExtract(pipe, salesSource);
    addTransform(pipe, transforms.filter('High value', r => r.amount > 100));
    expect(pipe.stages.length).toBe(2);
    expect(pipe.stages[1].type).toBe('transform');
  });

  it('adds load stage', () => {
    const pipe = createETLPipeline('Test');
    addExtract(pipe, salesSource);
    addLoad(pipe, salesSink);
    expect(pipe.stages.length).toBe(2);
    expect(pipe.stages[1].type).toBe('load');
  });

  it('runs simple ETL pipeline', () => {
    const pipe = createETLPipeline('Sales ETL');
    addExtract(pipe, salesSource);
    addLoad(pipe, salesSink);

    const result = runETL(pipe, sampleData);
    expect(result.reiType).toBe('ETLResult');
    expect(result.success).toBe(true);
    expect(result.data.length).toBe(6);
  });

  it('filter transform reduces data', () => {
    const pipe = createETLPipeline('Filter ETL');
    addExtract(pipe, salesSource);
    addTransform(pipe, transforms.filter('High value', r => r.amount > 100));
    addLoad(pipe, salesSink);

    const result = runETL(pipe, sampleData);
    expect(result.success).toBe(true);
    expect(result.data.length).toBe(3); // 200, 150, 300
  });

  it('map transform modifies data', () => {
    const pipe = createETLPipeline('Map ETL');
    addExtract(pipe, salesSource);
    addTransform(pipe, transforms.map('Double amount', r => ({
      ...r,
      amount: r.amount * 2,
    })));
    addLoad(pipe, salesSink);

    const result = runETL(pipe, sampleData);
    expect(result.success).toBe(true);
    expect(result.data[0].amount).toBe(200); // 100 * 2
  });

  it('project transform selects columns', () => {
    const pipe = createETLPipeline('Project ETL');
    addExtract(pipe, salesSource);
    addTransform(pipe, transforms.project('Select cols', ['product', 'amount']));
    addLoad(pipe, salesSink);

    const result = runETL(pipe, sampleData);
    expect(result.success).toBe(true);
    expect(Object.keys(result.data[0])).toEqual(['product', 'amount']);
    expect(result.data[0].region).toBeUndefined();
  });

  it('sort transform orders data', () => {
    const pipe = createETLPipeline('Sort ETL');
    addExtract(pipe, salesSource);
    addTransform(pipe, transforms.sort('By amount desc', 'amount', 'desc'));
    addLoad(pipe, salesSink);

    const result = runETL(pipe, sampleData);
    expect(result.success).toBe(true);
    expect(result.data[0].amount).toBe(300);
    expect(result.data[result.data.length - 1].amount).toBe(50);
  });

  it('aggregate transform groups data', () => {
    const pipe = createETLPipeline('Aggregate ETL');
    addExtract(pipe, salesSource);
    addTransform(pipe, transforms.aggregate(
      'Sum by product',
      'product',
      { amount: (values) => values.reduce((s: number, v: any) => s + (typeof v === 'number' ? v : v.amount ?? 0), 0) }
    ));
    addLoad(pipe, salesSink);

    const result = runETL(pipe, sampleData);
    expect(result.success).toBe(true);
    expect(result.data.length).toBe(3); // Widget A, B, C
  });

  it('chained transforms work', () => {
    const pipe = createETLPipeline('Chained ETL');
    addExtract(pipe, salesSource);
    addTransform(pipe, transforms.filter('East only', r => r.region === 'East'));
    addTransform(pipe, transforms.map('Add tax', r => ({ ...r, total: r.amount * 1.1 })));
    addTransform(pipe, transforms.sort('By total', 'total', 'desc'));
    addLoad(pipe, salesSink);

    const result = runETL(pipe, sampleData);
    expect(result.success).toBe(true);
    expect(result.data.length).toBe(3); // East region only
    expect(result.data[0].total).toBeDefined();
    expect(result.data[0].total).toBeGreaterThan(result.data[1].total);
  });

  it('tracks total runs', () => {
    const pipe = createETLPipeline('Multi-run');
    addExtract(pipe, salesSource);
    addLoad(pipe, salesSink);

    runETL(pipe, sampleData);
    runETL(pipe, sampleData);
    runETL(pipe, sampleData);

    expect(pipe.totalRuns).toBe(3);
  });
});

// ═══════════════════════════════════════════
// ETL σ（6属性）
// ═══════════════════════════════════════════

describe('ETL Sigma (6 attributes)', () => {
  it('σ field reports stage counts', () => {
    const pipe = createETLPipeline('Test');
    addExtract(pipe, salesSource);
    addTransform(pipe, transforms.filter('test', r => r.amount > 0));
    addTransform(pipe, transforms.map('test2', r => r));
    addLoad(pipe, salesSink);

    const result = runETL(pipe, sampleData);
    const sigma = result.sigma;

    expect(sigma.reiType).toBe('ETLSigma');
    expect(sigma.field.totalStages).toBe(4);
    expect(sigma.field.extractCount).toBe(1);
    expect(sigma.field.transformCount).toBe(2);
    expect(sigma.field.loadCount).toBe(1);
  });

  it('σ flow reports direction and duration', () => {
    const pipe = createETLPipeline('Test');
    addExtract(pipe, salesSource);
    addLoad(pipe, salesSink);

    const result = runETL(pipe, sampleData);
    expect(result.sigma.flow.direction).toBe('complete');
    expect(result.sigma.flow.totalDurationMs).toBeGreaterThanOrEqual(0);
  });

  it('σ memory reports data lineage', () => {
    const pipe = createETLPipeline('Test');
    addExtract(pipe, salesSource);
    addTransform(pipe, transforms.filter('test', r => r.amount > 100));
    addLoad(pipe, salesSink);

    const result = runETL(pipe, sampleData);
    expect(result.sigma.memory.dataLineage.length).toBeGreaterThan(0);
    expect(result.sigma.memory.dataLineage[0]).toContain('input');
  });

  it('σ layer reports pipeline depth', () => {
    const pipe = createETLPipeline('Test');
    addExtract(pipe, salesSource);
    addTransform(pipe, transforms.filter('test', r => r.amount > 100));
    addTransform(pipe, transforms.map('test2', r => r));
    addLoad(pipe, salesSink);

    const result = runETL(pipe, sampleData);
    expect(result.sigma.layer.depth).toBe(4);
  });

  it('σ layer reports compression ratio', () => {
    const pipe = createETLPipeline('Test');
    addExtract(pipe, salesSource);
    addTransform(pipe, transforms.filter('test', r => r.amount > 100));
    addLoad(pipe, salesSink);

    const result = runETL(pipe, sampleData);
    expect(result.sigma.layer.compressionRatio).toBe(3 / 6); // 3 out of 6
  });

  it('σ relation reports dependencies', () => {
    const pipe = createETLPipeline('Test');
    addExtract(pipe, salesSource);
    addTransform(pipe, transforms.filter('test', r => r.amount > 0));
    addLoad(pipe, salesSink);

    const result = runETL(pipe, sampleData);
    expect(result.sigma.relation.dependencies.length).toBe(3);
  });

  it('σ will reports quality score', () => {
    const pipe = createETLPipeline('Test');
    addExtract(pipe, salesSource);
    addLoad(pipe, salesSink);

    const result = runETL(pipe, sampleData);
    expect(result.sigma.will.qualityScore).toBeGreaterThan(0);
    expect(result.sigma.will.completeness).toBe(1); // no nulls
  });

  it('σ will reports lower completeness for data with nulls', () => {
    const pipe = createETLPipeline('Test');
    addExtract(pipe, salesSource);
    addLoad(pipe, salesSink);

    const dataWithNulls = [
      { product: 'A', amount: null, region: 'East' },
      { product: 'B', amount: 100, region: null },
    ];
    const result = runETL(pipe, dataWithNulls);
    expect(result.sigma.will.completeness).toBeLessThan(1);
  });
});

// ═══════════════════════════════════════════
// LLMエージェント連携
// ═══════════════════════════════════════════

describe('LLM Agent Orchestration', () => {
  const agents: LLMAgentDef[] = [
    { id: 'researcher', name: 'Researcher', role: 'research', systemPrompt: 'You are a researcher.', maxTokens: 500 },
    { id: 'writer', name: 'Writer', role: 'writing', systemPrompt: 'You are a writer.', maxTokens: 500 },
    { id: 'editor', name: 'Editor', role: 'editing', systemPrompt: 'You are an editor.', maxTokens: 500 },
  ];

  const mockSimulate = (agent: LLMAgentDef, input: string) => ({
    output: `[${agent.role}] Processed: ${input.slice(0, 50)}`,
    tokens: Math.ceil(input.length / 4) + 50,
  });

  it('creates orchestrator', () => {
    const orch = createAgentOrchestrator(agents);
    expect(orch.reiType).toBe('AgentOrchestrator');
    expect(orch.agents.length).toBe(3);
    expect(orch.tokenUsed).toBe(0);
  });

  it('orchestrates sequential task', () => {
    const orch = createAgentOrchestrator(agents, 5000);
    const result = orchestrate(orch, 'Write about AI safety', mockSimulate);

    expect(result.reiType).toBe('OrchResult');
    expect(result.rounds.length).toBe(3);
    expect(result.totalTokens).toBeGreaterThan(0);
    expect(result.finalOutput).toContain('[editing]');
  });

  it('respects token budget', () => {
    const orch = createAgentOrchestrator(agents, 100); // Very low budget
    const result = orchestrate(orch, 'Long task that requires many tokens to process properly', mockSimulate);

    expect(result.totalTokens).toBeLessThanOrEqual(200); // Some slack for the first agent
  });

  it('σ field reports agent count', () => {
    const orch = createAgentOrchestrator(agents);
    const result = orchestrate(orch, 'Test task', mockSimulate);

    expect(result.sigma.field.agentCount).toBe(3);
    expect(result.sigma.field.roles).toContain('research');
    expect(result.sigma.field.roles).toContain('writing');
  });

  it('σ flow reports rounds', () => {
    const orch = createAgentOrchestrator(agents);
    const result = orchestrate(orch, 'Test task', mockSimulate);

    expect(result.sigma.flow.totalRounds).toBe(3);
    expect(result.sigma.flow.direction).toBe('sequential');
  });

  it('σ memory tracks token usage', () => {
    const orch = createAgentOrchestrator(agents, 10000);
    const result = orchestrate(orch, 'Test task', mockSimulate);

    expect(result.sigma.memory.totalTokens).toBeGreaterThan(0);
    expect(result.sigma.memory.contextUtilization).toBeGreaterThan(0);
    expect(result.sigma.memory.contextUtilization).toBeLessThanOrEqual(1);
  });

  it('σ layer reports delegation depth', () => {
    const orch = createAgentOrchestrator(agents);
    const result = orchestrate(orch, 'Test task', mockSimulate);

    expect(result.sigma.layer.depth).toBe(3);
    expect(result.sigma.layer.delegation).toBe(2);
  });

  it('σ relation identifies most active agent', () => {
    const orch = createAgentOrchestrator(agents);
    const result = orchestrate(orch, 'Test task', mockSimulate);

    expect(result.sigma.relation.mostActiveAgent).toBeTruthy();
    expect(result.sigma.relation.communicationPairs).toBeGreaterThan(0);
  });

  it('σ will reports convergence', () => {
    const orch = createAgentOrchestrator(agents);
    const result = orchestrate(orch, 'Test task', mockSimulate);

    expect(result.sigma.will.convergence).toBe(1.0);
  });
});

// ═══════════════════════════════════════════
// データフロー分析
// ═══════════════════════════════════════════

describe('Data Flow Analysis', () => {
  it('analyzes pipeline data flow', () => {
    const pipe = createETLPipeline('Test');
    addExtract(pipe, salesSource);
    addTransform(pipe, transforms.filter('test', r => r.amount > 100));
    addLoad(pipe, salesSink);

    // Run once to generate stage results
    runETL(pipe, sampleData);

    const analysis = analyzeDataFlow(pipe);
    expect(analysis.reiType).toBe('DataFlowAnalysis');
    expect(analysis.nodes.length).toBe(3);
    expect(analysis.edges.length).toBe(2);
    expect(analysis.criticalPath.length).toBe(3);
  });

  it('identifies node types', () => {
    const pipe = createETLPipeline('Test');
    addExtract(pipe, salesSource);
    addTransform(pipe, transforms.filter('test', r => true));
    addLoad(pipe, salesSink);

    runETL(pipe, sampleData);
    const analysis = analyzeDataFlow(pipe);

    expect(analysis.nodes[0].type).toBe('source');
    expect(analysis.nodes[1].type).toBe('transform');
    expect(analysis.nodes[2].type).toBe('sink');
  });

  it('reports max depth', () => {
    const pipe = createETLPipeline('Test');
    addExtract(pipe, salesSource);
    addTransform(pipe, transforms.filter('f1', r => true));
    addTransform(pipe, transforms.map('m1', r => r));
    addTransform(pipe, transforms.sort('s1', 'amount'));
    addLoad(pipe, salesSink);

    runETL(pipe, sampleData);
    const analysis = analyzeDataFlow(pipe);

    expect(analysis.maxDepth).toBe(5);
  });
});

// ═══════════════════════════════════════════
// 6属性統合テスト
// ═══════════════════════════════════════════

describe('Six-attribute integration (Info Engineering)', () => {
  it('ETL σ has all 6 attributes', () => {
    const pipe = createETLPipeline('Test');
    addExtract(pipe, salesSource);
    addTransform(pipe, transforms.filter('test', r => r.amount > 0));
    addLoad(pipe, salesSink);

    const result = runETL(pipe, sampleData);
    const sigma = result.sigma;

    expect(sigma.field).toBeDefined();
    expect(sigma.flow).toBeDefined();
    expect(sigma.memory).toBeDefined();
    expect(sigma.layer).toBeDefined();
    expect(sigma.relation).toBeDefined();
    expect(sigma.will).toBeDefined();
  });

  it('Orchestrator σ has all 6 attributes', () => {
    const orch = createAgentOrchestrator([
      { id: 'a1', name: 'A1', role: 'test', systemPrompt: '', maxTokens: 100 },
    ]);
    const result = orchestrate(orch, 'Test', (a, i) => ({ output: 'done', tokens: 10 }));

    expect(result.sigma.field).toBeDefined();
    expect(result.sigma.flow).toBeDefined();
    expect(result.sigma.memory).toBeDefined();
    expect(result.sigma.layer).toBeDefined();
    expect(result.sigma.relation).toBeDefined();
    expect(result.sigma.will).toBeDefined();
  });
});
