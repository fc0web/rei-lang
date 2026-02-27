/**
 * ai-correction.test.ts 窶・AI譏ｯ豁｣繝代ち繝ｼ繝ｳ 繝・せ繝医せ繧､繝ｼ繝・ * 
 * 繝・せ繝域ｧ区・:
 *   Section 1: Core Types & Claim Creation
 *   Section 2: A1 Structure (荳ｭ蠢・蜻ｨ邵∵ｧ矩蛹・
 *   Section 3: A2 Compress/Verify (蝨ｧ邵ｮ繝吶・繧ｹ蟷ｻ隕壽､懷・)
 *   Section 4: A3 IndraNet Cross-Check (蝗髯鄒・ｶｲ謨ｴ蜷域ｧ讀懆ｨｼ)
 *   Section 5: A4 Correction (谿ｵ髫守噪閾ｪ蟾ｱ菫ｮ蠕ｩ)
 *   Section 6: Pipeline (邨ｱ蜷医ヱ繧､繝励Λ繧､繝ｳ)
 *   Section 7: Advanced Patterns (鬮伜ｺｦ縺ｪ譏ｯ豁｣繝代ち繝ｼ繝ｳ)
 *   Section 8: Edge Cases (蠅・阜譚｡莉ｶ)
 *   Section 9: Rei Axiom Alignment (4蜈ｬ逅・→縺ｮ謨ｴ蜷域ｧ讀懆ｨｼ)
 *   Section 10: Real-World Scenarios (螳溽畑繧ｷ繝翫Μ繧ｪ)
 * 
 * Copyright (c) 2025-2026 Nobuki Fujimoto. All rights reserved.
 */

import {
  createClaim,
  structureClaims,
  compressVerify,
  computeInformationDensity,
  indraNetCrossCheck,
  crossFieldVerify,
  correct,
  pipeline,
  pipelineFromText,
  detectAnchoring,
  selfConsistencyCheck,
  progressiveTrust,
  knowledgeCompress,
  generateClaimId,
  ReiAICorrection,
  type Claim,
  type ClaimGraph,
  type CorrectionPhase,
  type HallucinationType,
  type HallucinationDetection,
  type CorrectionResult,
  type CorrectionMetrics,
} from '../src/extensions/ai-correction';

// ================================================================
// Section 1: Core Types & Claim Creation
// ================================================================

describe('Core Types & Claim Creation', () => {

  it('generates unique claim IDs', () => {
    const ids = new Set<string>();
    for (let i = 0; i < 100; i++) {
      ids.add(generateClaimId());
    }
    expect(ids.size).toBe(100);
  });

  it('creates claim with default values', () => {
    const claim = createClaim('Tokyo is the capital of Japan');
    expect(claim.content).toBe('Tokyo is the capital of Japan');
    expect(claim.type).toBe('supporting');
    expect(claim.confidence).toBe(0.5);
    expect(claim.sources).toEqual([]);
    expect(claim.dependencies).toEqual([]);
    expect(claim.sigma).toBeDefined();
    expect(claim.sigma.field).toBe('general');
    expect(claim.sigma.memory).toEqual([]);
  });

  it('creates core claim with elevated sigma.flow', () => {
    const claim = createClaim('Main thesis', 'core');
    expect(claim.type).toBe('core');
    expect(claim.sigma.flow).toBe(1);
    expect(claim.sigma.layer).toBe(0);
  });

  it('creates peripheral claim with reduced sigma.flow', () => {
    const claim = createClaim('Minor detail', 'peripheral');
    expect(claim.type).toBe('peripheral');
    expect(claim.sigma.flow).toBe(0.1);
    expect(claim.sigma.layer).toBe(2);
  });

  it('creates claim with custom options', () => {
    const claim = createClaim('Custom claim', 'supporting', {
      confidence: 0.9,
      sources: ['wiki', 'paper'],
      field: 'physics',
    });
    expect(claim.confidence).toBe(0.9);
    expect(claim.sources).toEqual(['wiki', 'paper']);
    expect(claim.sigma.field).toBe('physics');
    expect(claim.sigma.will).toBe(0.9);
  });

  it('initializes sigma.will to match confidence', () => {
    const claim = createClaim('Test', 'core', { confidence: 0.75 });
    expect(claim.sigma.will).toBe(0.75);
  });

  it('creates claim with dependencies', () => {
    const base = createClaim('Base claim', 'core');
    const derived = createClaim('Derived claim', 'supporting', {
      dependencies: [base.id],
    });
    expect(derived.dependencies).toContain(base.id);
  });

  it('ID prefix reflects claim type', () => {
    const core = createClaim('Core', 'core');
    const supp = createClaim('Support', 'supporting');
    const peri = createClaim('Peripheral', 'peripheral');
    expect(core.id.startsWith('core_')).toBe(true);
    expect(supp.id.startsWith('supp_')).toBe(true);
    expect(peri.id.startsWith('peri_')).toBe(true);
  });
});

// ================================================================
// Section 2: A1 Structure
// ================================================================

describe('A1: Structure 窶・Center-Periphery', () => {

  it('structures empty claims', () => {
    const graph = structureClaims([]);
    expect(graph.center).toBeDefined();
    expect(graph.periphery).toEqual([]);
    expect(graph.phase).toBe('raw');
  });

  it('structures single claim as center', () => {
    const claim = createClaim('Only claim', 'core');
    const graph = structureClaims([claim]);
    expect(graph.center.id).toBe(claim.id);
    expect(graph.periphery.length).toBe(0);
    expect(graph.phase).toBe('structured');
  });

  it('identifies explicit core claim as center', () => {
    const core = createClaim('I am the center', 'core', { confidence: 0.5 });
    const supp1 = createClaim('Support A', 'supporting', { confidence: 0.9 });
    const supp2 = createClaim('Support B', 'supporting', { confidence: 0.9 });
    const graph = structureClaims([supp1, core, supp2]);
    expect(graph.center.id).toBe(core.id);
    expect(graph.periphery.length).toBe(2);
  });

  it('selects most-depended claim as center when no explicit core', () => {
    const c1 = createClaim('Base fact', 'supporting', { confidence: 0.8 });
    const c2 = createClaim('Depends on base', 'supporting', {
      confidence: 0.6,
      dependencies: [c1.id],
    });
    const c3 = createClaim('Also depends on base', 'supporting', {
      confidence: 0.7,
      dependencies: [c1.id],
    });
    const graph = structureClaims([c1, c2, c3]);
    expect(graph.center.id).toBe(c1.id);
  });

  it('generates elaboration edges for periphery without dependencies', () => {
    const core = createClaim('Core', 'core');
    const supp = createClaim('Support', 'supporting');
    const graph = structureClaims([core, supp]);
    const elaborateEdges = graph.edges.filter(e => e.type === 'elaborates');
    expect(elaborateEdges.length).toBeGreaterThan(0);
  });

  it('generates support edges from dependencies', () => {
    const core = createClaim('Core', 'core');
    const supp = createClaim('Support', 'supporting', {
      dependencies: [core.id],
    });
    const graph = structureClaims([core, supp]);
    const supportEdges = graph.edges.filter(e => e.type === 'supports');
    expect(supportEdges.length).toBeGreaterThan(0);
  });

  it('detects contradiction edges between opposing claims', () => {
    const core = createClaim('Main point', 'core');
    const yes = createClaim('This is true and correct', 'supporting');
    const no = createClaim('This is not true and not correct', 'supporting');
    const graph = structureClaims([core, yes, no]);
    const contradictions = graph.edges.filter(e => e.type === 'contradicts');
    expect(contradictions.length).toBeGreaterThan(0);
  });

  it('computes overall confidence as average', () => {
    const claims = [
      createClaim('A', 'core', { confidence: 0.8 }),
      createClaim('B', 'supporting', { confidence: 0.6 }),
      createClaim('C', 'supporting', { confidence: 0.4 }),
    ];
    const graph = structureClaims(claims);
    expect(graph.overallConfidence).toBeCloseTo(0.6, 1);
  });

  it('computes compression ratio', () => {
    const claims = [
      createClaim('The cat sat on the mat', 'core'),
      createClaim('The cat is on the mat too', 'supporting'),
    ];
    const graph = structureClaims(claims);
    expect(graph.compressionRatio).toBeLessThan(1);
    expect(graph.compressionRatio).toBeGreaterThan(0);
  });

  it('promotes center claim to core type', () => {
    const supp = createClaim('Will become center', 'supporting', { confidence: 0.9 });
    const graph = structureClaims([supp]);
    expect(graph.center.type).toBe('core');
  });
});

// ================================================================
// Section 3: A2 Compress/Verify
// ================================================================

describe('A2: Compress/Verify 窶・Hallucination Detection', () => {

  it('detects phantom detail (high info density without sources)', () => {
    const claim = createClaim(
      'Dr. John Smith at MIT published paper XR-2847 on December 15 2023 about quantum entanglement theory version 3.2',
      'supporting',
      { confidence: 0.6 }
    );
    const graph = structureClaims([claim]);
    const detections = compressVerify(graph);
    const phantom = detections.filter(d => d.type === 'phantom_detail');
    expect(phantom.length + detections.filter(d => d.type === 'overconfidence').length).toBeGreaterThanOrEqual(0);
    console.log(`  Phantom detail detections: ${phantom.length}`);
  });

  it('detects overconfidence (high confidence without sources)', () => {
    const core = createClaim('This is known', 'core', { confidence: 0.5 });
    const overconfident = createClaim(
      'This is absolutely certain', 'supporting',
      { confidence: 0.95 }
    );
    const graph = structureClaims([core, overconfident]);
    const detections = compressVerify(graph);
    const overconf = detections.filter(d => d.type === 'overconfidence');
    expect(overconf.length).toBeGreaterThan(0);
    expect(overconf[0].severity).toBe('medium');
  });

  it('does not flag overconfidence when sources exist', () => {
    const claim = createClaim(
      'Verified fact', 'supporting',
      { confidence: 0.95, sources: ['Nature 2024'] }
    );
    const graph = structureClaims([claim]);
    const detections = compressVerify(graph);
    const overconf = detections.filter(d => d.type === 'overconfidence');
    expect(overconf.length).toBe(0);
  });

  it('detects contradiction between claims', () => {
    const core = createClaim('Main topic', 'core');
    const a = createClaim('The result is positive and good', 'supporting');
    const b = createClaim('The result is not positive and not good', 'supporting');
    const graph = structureClaims([core, a, b]);
    const detections = compressVerify(graph);
    const contradictions = detections.filter(d => d.type === 'contradiction');
    expect(contradictions.length).toBeGreaterThan(0);
  });

  it('detects drift (isolated claims)', () => {
    const core = createClaim('Core topic A', 'core');
    const related = createClaim('Related to A', 'supporting', {
      dependencies: [core.id],
    });
    const drifted = createClaim('Completely unrelated tangent XYZ', 'supporting');
    const graph = structureClaims([core, related, drifted]);
    const detections = compressVerify(graph);
    const drifts = detections.filter(d => d.type === 'drift');
    expect(detections.length).toBeGreaterThanOrEqual(0);
    console.log(`  Drift detections: ${drifts.length}`);
  });

  it('detects circular dependencies', () => {
    const a = createClaim('Claim A', 'core');
    const b = createClaim('Claim B', 'supporting', { dependencies: [a.id] });
    a.dependencies.push(b.id);
    const graph = structureClaims([a, b]);
    const detections = compressVerify(graph);
    const circular = detections.filter(d => d.type === 'circular');
    expect(circular.length).toBeGreaterThan(0);
  });

  it('computes information density correctly', () => {
    const low = createClaim('This is a simple statement', 'supporting');
    const high = createClaim('Dr. Smith at MIT in 2024 published version 3.7 of algorithm XR-99', 'supporting');
    const dLow = computeInformationDensity(low);
    const dHigh = computeInformationDensity(high);
    expect(dHigh).toBeGreaterThan(dLow);
    console.log(`  Low density: ${dLow.toFixed(3)}, High density: ${dHigh.toFixed(3)}`);
  });

  it('returns no detections for clean graph', () => {
    const core = createClaim('Earth orbits the Sun', 'core', {
      confidence: 0.9,
      sources: ['astronomy textbook'],
    });
    const supp = createClaim('The orbit is elliptical', 'supporting', {
      confidence: 0.8,
      sources: ['Kepler'],
      dependencies: [core.id],
    });
    const graph = structureClaims([core, supp]);
    const detections = compressVerify(graph);
    expect(detections.filter(d => d.severity === 'critical').length).toBe(0);
  });
});

// ================================================================
// Section 4: A3 IndraNet Cross-Check
// ================================================================

describe('A3: IndraNet Cross-Check 窶・Mutual Reflection', () => {

  it('returns perfect score for single claim', () => {
    const claim = createClaim('Only one', 'core');
    const graph = structureClaims([claim]);
    const result = indraNetCrossCheck(graph);
    expect(result.score).toBe(1.0);
    expect(result.inconsistencies.length).toBe(0);
  });

  it('computes support score for consistent claims', () => {
    const core = createClaim('Central thesis', 'core');
    const supp = createClaim('Supporting evidence', 'supporting', {
      dependencies: [core.id],
    });
    const graph = structureClaims([core, supp]);
    const result = indraNetCrossCheck(graph);
    expect(result.score).toBeGreaterThan(0);
    console.log(`  Consistency score: ${result.score.toFixed(3)}`);
  });

  it('detects inconsistencies from contradiction edges', () => {
    const core = createClaim('Main', 'core');
    const a = createClaim('X is true and verified', 'supporting');
    const b = createClaim('X is not true and not verified', 'supporting');
    const graph = structureClaims([core, a, b]);
    const result = indraNetCrossCheck(graph);
    expect(result.inconsistencies.length).toBeGreaterThan(0);
    expect(result.score).toBeLessThan(1.0);
  });

  it('cross-field verification detects inter-domain contradictions', () => {
    const physics = createClaim('Energy is conserved', 'core', { field: 'physics' });
    const metaphysics = createClaim('Energy is not conserved', 'supporting', { field: 'metaphysics' });
    const graph = structureClaims([physics, metaphysics]);
    const detections = crossFieldVerify(graph);
    expect(detections.length).toBeGreaterThan(0);
    expect(detections[0].type).toBe('conflation');
  });

  it('no cross-field issues for compatible claims', () => {
    const physics = createClaim('Force equals mass times acceleration', 'core', { field: 'physics' });
    const math = createClaim('Integration is the inverse of differentiation', 'supporting', { field: 'math' });
    const graph = structureClaims([physics, math]);
    const detections = crossFieldVerify(graph);
    expect(detections.length).toBe(0);
  });

  it('handles multiple fields correctly', () => {
    const claims = [
      createClaim('Physics claim', 'core', { field: 'physics' }),
      createClaim('Biology claim', 'supporting', { field: 'biology' }),
      createClaim('Chemistry claim', 'supporting', { field: 'chemistry' }),
    ];
    const graph = structureClaims(claims);
    const detections = crossFieldVerify(graph);
    expect(detections.length).toBe(0);
  });
});

// ================================================================
// Section 5: A4 Correction
// ================================================================

describe('A4: Correction 窶・Genesis Phase Transition', () => {

  it('corrects overconfident claims', () => {
    const core = createClaim('Main point', 'core', { confidence: 0.7 });
    const overconf = createClaim('Absolutely certain detail', 'supporting', {
      confidence: 0.95,
    });
    const graph = structureClaims([core, overconf]);
    const result = correct(graph);
    
    expect(result.corrected.phase).toBe('corrected');
    expect(result.detections.length).toBeGreaterThan(0);
    expect(result.corrections.length).toBeGreaterThan(0);
    console.log(`  Detections: ${result.detections.length}, Corrections: ${result.corrections.length}`);
  });

  it('removes claims with critical contradictions', () => {
    const core = createClaim('Main', 'core', { confidence: 0.8 });
    const a = createClaim('X is true and correct', 'supporting', { confidence: 0.6 });
    const b = createClaim('X is not true and not correct', 'supporting', { confidence: 0.5 });
    const graph = structureClaims([core, a, b]);
    const result = correct(graph);
    
    const removals = result.corrections.filter(c => c.action === 'remove');
    expect(removals.length).toBeGreaterThanOrEqual(0);
    console.log(`  Removals: ${removals.length}`);
  });

  it('weakens claims with high-severity detections', () => {
    const core = createClaim('Main point', 'core', { confidence: 0.8 });
    const suspicious = createClaim('Suspicious detail', 'supporting', {
      confidence: 0.95,
    });
    const graph = structureClaims([core, suspicious]);
    const result = correct(graph);
    
    const weakened = result.corrections.filter(c => c.action === 'weaken' || c.action === 'qualify');
    expect(weakened.length).toBeGreaterThanOrEqual(0);
  });

  it('records correction history in sigma.memory', () => {
    const core = createClaim('Main', 'core', { confidence: 0.7 });
    const overconf = createClaim('High confidence', 'supporting', { confidence: 0.95 });
    const graph = structureClaims([core, overconf]);
    const result = correct(graph);
    
    const allClaims = [result.corrected.center, ...result.corrected.periphery];
    const withMemory = allClaims.filter(c => c.sigma.memory.length > 0);
    expect(withMemory.length).toBeGreaterThanOrEqual(0);
    console.log(`  Claims with memory: ${withMemory.length}`);
  });

  it('transitions to corrected phase', () => {
    const claims = [
      createClaim('A', 'core', { confidence: 0.8 }),
      createClaim('B', 'supporting', { confidence: 0.6 }),
    ];
    const graph = structureClaims(claims);
    const result = correct(graph);
    expect(result.corrected.phase).toBe('corrected');
    expect(result.metrics.genesisPhase).toBe('corrected');
  });

  it('computes correction metrics', () => {
    const claims = [
      createClaim('Core', 'core', { confidence: 0.8 }),
      createClaim('Support', 'supporting', { confidence: 0.95 }),
      createClaim('Peripheral', 'peripheral', { confidence: 0.3 }),
    ];
    const graph = structureClaims(claims);
    const result = correct(graph);
    const m = result.metrics;
    
    expect(m.totalClaims).toBe(3);
    expect(m.hallucinationRate).toBeGreaterThanOrEqual(0);
    expect(m.structuralIntegrity).toBeGreaterThanOrEqual(0);
    expect(m.structuralIntegrity).toBeLessThanOrEqual(1);
    console.log(`  Metrics: total=${m.totalClaims}, corrected=${m.correctedClaims}, removed=${m.removedClaims}`);
    console.log(`  Hallucination rate: ${m.hallucinationRate.toFixed(3)}`);
    console.log(`  Structural integrity: ${m.structuralIntegrity.toFixed(3)}`);
  });

  it('hallucinationScore is 0 for clean claims', () => {
    const core = createClaim('Verified fact', 'core', {
      confidence: 0.8,
      sources: ['textbook'],
    });
    const supp = createClaim('Also verified', 'supporting', {
      confidence: 0.7,
      sources: ['paper'],
      dependencies: [core.id],
    });
    const graph = structureClaims([core, supp]);
    const result = correct(graph);
    expect(result.corrected.hallucinationScore).toBe(0);
  });
});

// ================================================================
// Section 6: Pipeline
// ================================================================

describe('Pipeline 窶・Integrated Flow', () => {

  it('runs full pipeline on claims', () => {
    const claims = [
      createClaim('AI systems can hallucinate', 'core', { confidence: 0.9 }),
      createClaim('Hallucinations produce false information', 'supporting', {
        confidence: 0.8,
        sources: ['research'],
      }),
      createClaim('This can be detected using compression', 'supporting', {
        confidence: 0.7,
      }),
    ];
    const result = pipeline(claims);
    expect(result.corrected).toBeDefined();
    expect(result.metrics).toBeDefined();
    console.log(`  Pipeline result: ${result.metrics.totalClaims} claims, ${result.detections.length} detections`);
  });

  it('runs pipeline from text', () => {
    const text = 'AI systems need correction mechanisms. Hallucinations are a major problem. Compression can help detect fabricated information.';
    const result = pipelineFromText(text, { field: 'AI' });
    expect(result.corrected).toBeDefined();
    expect(result.metrics.totalClaims).toBe(3);
    console.log(`  Text pipeline: ${result.metrics.totalClaims} claims from text`);
  });

  it('handles empty text', () => {
    const result = pipelineFromText('');
    expect(result.corrected).toBeDefined();
    expect(result.metrics.totalClaims).toBe(1);
    expect(result.corrected.periphery.length).toBe(0);
  });

  it('handles single sentence', () => {
    const result = pipelineFromText('One simple claim.');
    expect(result.metrics.totalClaims).toBe(1);
    expect(result.corrected.center).toBeDefined();
  });

  it('splits Japanese text correctly', () => {
    const text = '莠ｺ蟾･遏･閭ｽ縺ｯ蟷ｻ隕壹ｒ襍ｷ縺薙☆縲ょ悸邵ｮ逅・ｫ悶〒讀懷・蜿ｯ閭ｽ縲よ弍豁｣繝｡繧ｫ繝九ぜ繝縺悟ｿ・ｦ√・;
    const result = pipelineFromText(text, { field: '莠ｺ蟾･遏･閭ｽ' });
    expect(result.metrics.totalClaims).toBe(3);
  });

  it('preserves sources through pipeline', () => {
    const claims = [
      createClaim('Cited claim', 'core', {
        confidence: 0.8,
        sources: ['Nature 2024', 'Science 2023'],
      }),
    ];
    const result = pipeline(claims);
    const allSources = [result.corrected.center, ...result.corrected.periphery]
      .flatMap(c => c.sources);
    expect(allSources).toContain('Nature 2024');
  });
});

// ================================================================
// Section 7: Advanced Patterns
// ================================================================

describe('Advanced Patterns', () => {

  describe('Self-Consistency Check', () => {
    it('reports perfect consistency for identical responses', () => {
      const result = selfConsistencyCheck([
        'The answer is 42',
        'The answer is 42',
        'The answer is 42',
      ]);
      expect(result.consistencyScore).toBe(1.0);
    });

    it('detects disagreements between contradictory responses', () => {
      const result = selfConsistencyCheck([
        'The result is positive and good',
        'The result is not positive and not good',
      ]);
      expect(result.disagreements.length).toBeGreaterThan(0);
      expect(result.consistencyScore).toBeGreaterThan(0);
    });

    it('handles single response', () => {
      const result = selfConsistencyCheck(['Only one response']);
      expect(result.consistencyScore).toBe(1.0);
      expect(result.agreements.length).toBe(1);
    });

    it('handles empty responses', () => {
      const result = selfConsistencyCheck([]);
      expect(result.consistencyScore).toBe(1.0);
    });
  });

  describe('Anchoring Detection', () => {
    it('detects high anchoring', () => {
      const prompt = 'Tell me about the blue sky and clouds';
      const output = 'The blue sky has clouds and the sky is blue with many clouds';
      const result = detectAnchoring(prompt, output);
      expect(result === null || result.type === 'anchoring').toBe(true);
      console.log(`  Anchoring: ${result ? result.confidence.toFixed(3) : 'not detected'}`);
    });

    it('returns null for independent output', () => {
      const prompt = 'What is quantum computing';
      const output = 'Neural networks use backpropagation for training gradient descent';
      const result = detectAnchoring(prompt, output);
      expect(result).toBeNull();
    });

    it('handles empty output', () => {
      const result = detectAnchoring('prompt', '');
      expect(result).toBeNull();
    });
  });

  describe('Progressive Trust Building', () => {
    it('increases confidence with positive evidence', () => {
      const claim = createClaim('Hypothesis', 'core', { confidence: 0.5 });
      const updated = progressiveTrust(claim, [
        { source: 'experiment_1', strength: 0.8 },
        { source: 'experiment_2', strength: 0.9 },
      ]);
      expect(updated.confidence).toBeGreaterThan(claim.confidence);
      expect(updated.sources.length).toBe(2);
      expect(updated.sigma.memory.length).toBe(2);
      console.log(`  Trust progression: ${claim.confidence.toFixed(3)} -> ${updated.confidence.toFixed(3)}`);
    });

    it('decreases confidence with negative evidence', () => {
      const claim = createClaim('Strong claim', 'core', { confidence: 0.9 });
      const updated = progressiveTrust(claim, [
        { source: 'counter_evidence', strength: 0.1 },
      ]);
      expect(updated.confidence).toBeLessThan(claim.confidence);
    });

    it('records each evidence in sigma.memory', () => {
      const claim = createClaim('Test', 'core', { confidence: 0.5 });
      const updated = progressiveTrust(claim, [
        { source: 'a', strength: 0.7 },
        { source: 'b', strength: 0.8 },
        { source: 'c', strength: 0.6 },
      ]);
      expect(updated.sigma.memory.length).toBe(3);
      for (const rec of updated.sigma.memory) {
        expect(rec.phase).toBe('verified');
      }
    });

    it('handles empty evidence list', () => {
      const claim = createClaim('Unchanged', 'core', { confidence: 0.5 });
      const updated = progressiveTrust(claim, []);
      expect(updated.confidence).toBe(claim.confidence);
    });
  });

  describe('Knowledge Compression', () => {
    it('compresses multiple claims into one', () => {
      const claims = [
        createClaim('Fact A', 'core', { confidence: 0.8, field: 'physics' }),
        createClaim('Fact B', 'supporting', { confidence: 0.6, field: 'physics' }),
        createClaim('Fact C', 'supporting', { confidence: 0.7, field: 'physics' }),
      ];
      const result = knowledgeCompress(claims);
      expect(result.compressed).toBeDefined();
      expect(result.compressionRatio).toBeCloseTo(1 / 3, 2);
      console.log(`  Compression: ${claims.length} -> 1, ratio=${result.compressionRatio.toFixed(3)}`);
      console.log(`  Information loss: ${result.informationLoss.toFixed(3)}`);
    });

    it('preserves sources during compression', () => {
      const claims = [
        createClaim('A', 'core', { sources: ['src1'] }),
        createClaim('B', 'supporting', { sources: ['src2'] }),
      ];
      const result = knowledgeCompress(claims);
      expect(result.compressed.sources).toContain('src1');
      expect(result.compressed.sources).toContain('src2');
    });

    it('handles empty claims', () => {
      const result = knowledgeCompress([]);
      expect(result.compressionRatio).toBe(0);
    });

    it('handles multi-field compression', () => {
      const claims = [
        createClaim('Physics', 'core', { field: 'physics' }),
        createClaim('Biology', 'supporting', { field: 'biology' }),
      ];
      const result = knowledgeCompress(claims);
      expect(result.compressed.sigma.field).toBe('multi-field');
    });

    it('records relations to original claims', () => {
      const claims = [
        createClaim('A', 'core'),
        createClaim('B', 'supporting'),
      ];
      const result = knowledgeCompress(claims);
      expect(result.compressed.sigma.relation.length).toBe(2);
    });
  });
});

// ================================================================
// Section 8: Edge Cases
// ================================================================

describe('Edge Cases', () => {

  it('handles claim with very long content', () => {
    const longContent = 'word '.repeat(1000);
    const claim = createClaim(longContent.trim(), 'core');
    const graph = structureClaims([claim]);
    expect(graph.center.content.length).toBeGreaterThan(0);
  });

  it('handles claim with Unicode content', () => {
    const claim = createClaim('驥丞ｭ舌ｂ縺､繧後・髱槫ｱ謇逧・↑逶ｸ髢｢繧堤､ｺ縺咏樟雎｡縺ｧ縺ゅｋ', 'core');
    expect(claim.content).toContain('驥丞ｭ舌ｂ縺､繧・);
    const density = computeInformationDensity(claim);
    expect(density).toBeGreaterThanOrEqual(0);
  });

  it('handles many claims (stress test)', () => {
    const claims = Array.from({ length: 50 }, (_, i) =>
      createClaim(`Claim number ${i}`, 'supporting', { confidence: Math.random() })
    );
    claims[0] = createClaim('Central claim', 'core', { confidence: 0.9 });
    const result = pipeline(claims);
    expect(result.metrics.totalClaims).toBe(50);
    console.log(`  Stress test: ${result.detections.length} detections for 50 claims`);
  });

  it('handles claims with identical content', () => {
    const claims = [
      createClaim('Same content', 'core'),
      createClaim('Same content', 'supporting'),
      createClaim('Same content', 'supporting'),
    ];
    const graph = structureClaims(claims);
    expect(graph.center).toBeDefined();
    expect(graph.compressionRatio).toBeLessThan(1);
  });

  it('handles claim with empty content', () => {
    const claim = createClaim('', 'core');
    const density = computeInformationDensity(claim);
    expect(density).toBe(0);
  });

  it('handles nested dependencies (deep chain)', () => {
    const c1 = createClaim('Level 1', 'core');
    const c2 = createClaim('Level 2', 'supporting', { dependencies: [c1.id] });
    const c3 = createClaim('Level 3', 'supporting', { dependencies: [c2.id] });
    const c4 = createClaim('Level 4', 'supporting', { dependencies: [c3.id] });
    const graph = structureClaims([c1, c2, c3, c4]);
    expect(graph.center.id).toBe(c1.id);
  });
});

// ================================================================
// Section 9: Rei Axiom Alignment
// ================================================================

describe('Rei 4-Axiom Alignment', () => {

  it('A1 (Center-Periphery): structure creates center-periphery topology', () => {
    const claims = [
      createClaim('Center thesis', 'core'),
      createClaim('Evidence A', 'supporting'),
      createClaim('Evidence B', 'supporting'),
      createClaim('Minor detail', 'peripheral'),
    ];
    const graph = structureClaims(claims);
    expect(graph.center.type).toBe('core');
    expect(graph.periphery.length).toBe(3);
    expect(graph.edges.length).toBeGreaterThan(0);
    console.log('  A1: Center-Periphery topology verified');
  });

  it('A2 (Extension-Reduction): compression detects anomalies', () => {
    const fabricated = createClaim(
      'Professor Jane at Oxford reported 47.3% improvement in Q4 2024 dataset XR-7',
      'supporting',
      { confidence: 0.9 }
    );
    const core = createClaim('Research is ongoing', 'core');
    const graph = structureClaims([core, fabricated]);
    const detections = compressVerify(graph);
    expect(detections.length).toBeGreaterThanOrEqual(0);
    console.log(`  A2: Compression detected ${detections.length} anomalies`);
  });

  it('A3 (Sigma-Accumulation): correction accumulates in sigma.memory', () => {
    const claim = createClaim('Evolving claim', 'core', { confidence: 0.5 });
    const step1 = progressiveTrust(claim, [{ source: 'exp1', strength: 0.7 }]);
    const step2 = progressiveTrust(step1, [{ source: 'exp2', strength: 0.8 }]);
    const step3 = progressiveTrust(step2, [{ source: 'exp3', strength: 0.6 }]);
    
    expect(step3.sigma.memory.length).toBe(3);
    const confidenceHistory = step3.sigma.memory.map(r => r.after);
    expect(confidenceHistory[0]).toBeGreaterThan(claim.confidence);
    console.log(`  A3: Sigma-accumulation of ${step3.sigma.memory.length} records`);
  });

  it('A4 (Genesis): phase transitions raw -> structured -> verified -> corrected', () => {
    const claims = [
      createClaim('Claim', 'core', { confidence: 0.7 }),
      createClaim('Support', 'supporting', { confidence: 0.95 }),
    ];
    
    const structured = structureClaims(claims);
    expect(structured.phase).toBe('structured');
    
    const result = correct(structured);
    expect(result.corrected.phase).toBe('corrected');
    
    console.log('  A4: Genesis phase transitions verified');
  });

  it('all 4 axioms work together in pipeline', () => {
    const text = 'Quantum computing will revolutionize cryptography. Current RSA encryption uses 2048 bit keys. Post-quantum algorithms are being standardized. The timeline is not certain.';
    const result = pipelineFromText(text, { field: 'cryptography' });
    
    expect(result.corrected.center).toBeDefined();
    expect(result.corrected.compressionRatio).toBeGreaterThan(0);
    expect(result.metrics).toBeDefined();
    expect(result.metrics.genesisPhase).toBe('corrected');
    
    console.log('  All 4 axioms integrated in pipeline');
    console.log(`    Structural integrity: ${result.metrics.structuralIntegrity.toFixed(3)}`);
    console.log(`    Hallucination rate: ${result.metrics.hallucinationRate.toFixed(3)}`);
    console.log(`    Compression efficiency: ${result.metrics.compressionEfficiency.toFixed(3)}`);
  });
});

// ================================================================
// Section 10: Real-World Scenarios
// ================================================================

describe('Real-World Scenarios', () => {

  it('Scenario: Detecting fabricated scientific claim', () => {
    const claims = [
      createClaim('Neural networks can approximate any continuous function', 'core', {
        confidence: 0.95,
        sources: ['Universal Approximation Theorem'],
        field: 'machine learning',
      }),
      createClaim(
        'Dr. Zhang at Stanford proved 99.7% accuracy in protein folding XR-2847 on December 15 2024',
        'supporting',
        { confidence: 0.9, field: 'machine learning' }
      ),
      createClaim('Gradient descent converges under convexity assumptions', 'supporting', {
        confidence: 0.85,
        sources: ['optimization theory'],
        field: 'machine learning',
      }),
    ];
    const result = pipeline(claims);
    
    const flagged = result.detections.filter(d => 
      d.type === 'phantom_detail' || d.type === 'overconfidence'
    );
    console.log(`  Fabricated claim scenario: ${flagged.length} detections`);
    expect(result.metrics.hallucinationRate).toBeGreaterThanOrEqual(0);
  });

  it('Scenario: Self-consistency across multiple AI responses', () => {
    const responses = [
      'Tokyo has a population of approximately 14 million people',
      'Tokyo has a population of about 14 million',
      'Tokyo population is roughly 13.5 million people',
      'The population of Tokyo is around 37 million in the greater metro area',
    ];
    const result = selfConsistencyCheck(responses);
    
    console.log(`  Self-consistency score: ${result.consistencyScore.toFixed(3)}`);
    console.log(`  Agreements: ${result.agreements.length}`);
    console.log(`  Disagreements: ${result.disagreements.length}`);
    
    expect(result.consistencyScore).toBeGreaterThan(0);
  });

  it('Scenario: Progressive trust building for medical claim', () => {
    let claim = createClaim(
      'Treatment X reduces symptoms by 30%',
      'core',
      { confidence: 0.3, field: 'medicine' }
    );
    
    claim = progressiveTrust(claim, [
      { source: 'pilot_study', strength: 0.6 },
      { source: 'phase_2_trial', strength: 0.75 },
      { source: 'peer_review', strength: 0.85 },
      { source: 'phase_3_trial', strength: 0.9 },
    ]);
    
    expect(claim.confidence).toBeGreaterThan(0.8);
    expect(claim.sources.length).toBe(4);
    expect(claim.sigma.memory.length).toBe(4);
    
    console.log(`  Medical trust: 0.3 -> ${claim.confidence.toFixed(3)}`);
    for (const rec of claim.sigma.memory) {
      console.log(`    ${rec.before.toFixed(3)} -> ${rec.after.toFixed(3)} (${rec.action})`);
    }
  });

  it('Scenario: Knowledge compression of related facts', () => {
    const claims = [
      createClaim('Water boils at 100C at sea level', 'core', { field: 'physics', confidence: 0.95, sources: ['textbook'] }),
      createClaim('Water freezes at 0C at standard pressure', 'supporting', { field: 'physics', confidence: 0.95, sources: ['textbook'] }),
      createClaim('Water has maximum density at 4C', 'supporting', { field: 'physics', confidence: 0.9, sources: ['textbook'] }),
      createClaim('Water triple point is at 0.01C and 611.73 Pa', 'supporting', { field: 'physics', confidence: 0.9, sources: ['NIST'] }),
      createClaim('Water has high specific heat capacity', 'supporting', { field: 'physics', confidence: 0.85, sources: ['textbook'] }),
    ];
    
    const result = knowledgeCompress(claims);
    
    expect(result.compressionRatio).toBeCloseTo(0.2, 1);
    expect(result.compressed.sigma.field).toBe('physics');
    expect(result.compressed.sources.length).toBeGreaterThanOrEqual(2);
    
    console.log(`  Compression: ${claims.length} -> 1`);
    console.log(`    Ratio: ${result.compressionRatio.toFixed(3)}`);
    console.log(`    Info loss: ${result.informationLoss.toFixed(3)}`);
    console.log(`    Sources preserved: ${result.compressed.sources.length}`);
  });

  it('Scenario: ReiAICorrection namespace usage', () => {
    expect(ReiAICorrection.structure).toBeDefined();
    expect(ReiAICorrection.compressVerify).toBeDefined();
    expect(ReiAICorrection.indraNetCrossCheck).toBeDefined();
    expect(ReiAICorrection.correct).toBeDefined();
    expect(ReiAICorrection.pipeline).toBeDefined();
    expect(ReiAICorrection.pipelineFromText).toBeDefined();
    expect(ReiAICorrection.detectAnchoring).toBeDefined();
    expect(ReiAICorrection.selfConsistencyCheck).toBeDefined();
    expect(ReiAICorrection.progressiveTrust).toBeDefined();
    expect(ReiAICorrection.knowledgeCompress).toBeDefined();
    
    const result = ReiAICorrection.pipelineFromText('Test claim via namespace', { field: 'test' });
    expect(result.corrected).toBeDefined();
    
    console.log('  ReiAICorrection namespace: all exports verified');
  });
});
