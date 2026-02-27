// ============================================================
// Tests: Natural Science Domain (自然科学ドメイン)
// Phase 5-B: N体問題、波動、粒子系シミュレーション
// ============================================================
import { describe, it, expect } from 'vitest';
import {
  vec3, vec3Add, vec3Sub, vec3Scale, vec3Mag, vec3Dist, vec3Zero,
  createNBodySpace, stepNBody, runNBody, getNBodySigma,
  createWaveField, exciteWave, stepWave, runWave, getWaveSigma,
  createParticleSystem, stepParticles, runParticles, getThermodynamicSigma,
  type BodyDef, type Vec3,
} from '../src/lang/natural-science';

// ═══════════════════════════════════════════
// Vec3 ユーティリティ
// ═══════════════════════════════════════════

describe('Vec3 utilities', () => {
  it('vec3 creation', () => {
    const v = vec3(1, 2, 3);
    expect(v.x).toBe(1);
    expect(v.y).toBe(2);
    expect(v.z).toBe(3);
  });

  it('vec3Add', () => {
    const r = vec3Add(vec3(1, 2, 3), vec3(4, 5, 6));
    expect(r).toEqual({ x: 5, y: 7, z: 9 });
  });

  it('vec3Sub', () => {
    const r = vec3Sub(vec3(5, 7, 9), vec3(4, 5, 6));
    expect(r).toEqual({ x: 1, y: 2, z: 3 });
  });

  it('vec3Scale', () => {
    const r = vec3Scale(vec3(1, 2, 3), 2);
    expect(r).toEqual({ x: 2, y: 4, z: 6 });
  });

  it('vec3Mag', () => {
    expect(vec3Mag(vec3(3, 4, 0))).toBe(5);
    expect(vec3Mag(vec3Zero())).toBe(0);
  });

  it('vec3Dist', () => {
    expect(vec3Dist(vec3(0, 0, 0), vec3(3, 4, 0))).toBe(5);
  });
});

// ═══════════════════════════════════════════
// N体問題
// ═══════════════════════════════════════════

describe('N-Body simulation', () => {
  const twoBodyDefs: BodyDef[] = [
    { id: 'sun', mass: 100, position: vec3(0, 0, 0), velocity: vec3(0, 0, 0) },
    { id: 'planet', mass: 1, position: vec3(10, 0, 0), velocity: vec3(0, 3.16, 0) },
  ];

  it('creates NBodySpace with correct initial state', () => {
    const space = createNBodySpace(twoBodyDefs);
    expect(space.reiType).toBe('NBodySpace');
    expect(space.bodies.length).toBe(2);
    expect(space.time).toBe(0);
    expect(space.totalSteps).toBe(0);
    expect(space.bodies[0].mass).toBe(100);
    expect(space.bodies[1].mass).toBe(1);
  });

  it('computes initial accelerations', () => {
    const space = createNBodySpace(twoBodyDefs);
    // Planet should be accelerated toward sun
    expect(space.bodies[1].acceleration.x).toBeLessThan(0);
  });

  it('stepNBody advances time', () => {
    const space = createNBodySpace(twoBodyDefs);
    stepNBody(space, 0.01);
    expect(space.time).toBeGreaterThan(0);
    expect(space.totalSteps).toBe(1);
  });

  it('trajectory is recorded in memory', () => {
    const space = createNBodySpace(twoBodyDefs);
    runNBody(space, 10, 0.01);
    expect(space.bodies[1].trajectory.length).toBeGreaterThan(1);
  });

  it('energy is approximately conserved (Leapfrog)', () => {
    const space = createNBodySpace(twoBodyDefs);
    runNBody(space, 100, 0.01);
    const eh = space.energyHistory;
    const initialE = eh[0];
    const finalE = eh[eh.length - 1];
    // Leapfrog should conserve energy well
    const drift = Math.abs(finalE - initialE) / Math.abs(initialE);
    expect(drift).toBeLessThan(0.05); // < 5% drift
  });

  it('runNBody executes multiple steps', () => {
    const space = createNBodySpace(twoBodyDefs);
    runNBody(space, 50, 0.01);
    expect(space.totalSteps).toBe(50);
  });

  it('σ field reports correct body count and mass', () => {
    const space = createNBodySpace(twoBodyDefs);
    const sigma = getNBodySigma(space);
    expect(sigma.reiType).toBe('NBodySigma');
    expect(sigma.field.bodies).toBe(2);
    expect(sigma.field.totalMass).toBe(101);
  });

  it('σ flow reports kinetic energy', () => {
    const space = createNBodySpace(twoBodyDefs);
    runNBody(space, 10, 0.01);
    const sigma = getNBodySigma(space);
    expect(sigma.flow.kineticEnergy).toBeGreaterThan(0);
    expect(sigma.flow.totalSteps).toBe(10);
  });

  it('σ memory reports energy drift', () => {
    const space = createNBodySpace(twoBodyDefs);
    runNBody(space, 100, 0.01);
    const sigma = getNBodySigma(space);
    expect(sigma.memory.energyDrift).toBeDefined();
    expect(sigma.memory.energyHistory.length).toBeGreaterThan(0);
  });

  it('σ relation identifies strongest pair', () => {
    const space = createNBodySpace(twoBodyDefs);
    const sigma = getNBodySigma(space);
    expect(sigma.relation.strongestPair).toContain('sun');
    expect(sigma.relation.strongestPair).toContain('planet');
    expect(sigma.relation.strongestForce).toBeGreaterThan(0);
  });

  it('σ will: bound system has negative total energy', () => {
    const space = createNBodySpace(twoBodyDefs);
    const sigma = getNBodySigma(space);
    expect(sigma.will.tendency).toBe('bound');
    expect(sigma.will.totalEnergy).toBeLessThan(0);
  });

  it('σ layer: two-body system is binary', () => {
    const space = createNBodySpace(twoBodyDefs);
    const sigma = getNBodySigma(space);
    expect(sigma.layer.hierarchy).toBe('binary');
  });

  it('three-body system works', () => {
    const bodies: BodyDef[] = [
      { id: 'a', mass: 10, position: vec3(0, 0, 0), velocity: vec3(0, 0, 0) },
      { id: 'b', mass: 10, position: vec3(5, 0, 0), velocity: vec3(0, 1, 0) },
      { id: 'c', mass: 10, position: vec3(2.5, 4, 0), velocity: vec3(-0.5, -0.5, 0) },
    ];
    const space = createNBodySpace(bodies);
    runNBody(space, 20, 0.01);
    const sigma = getNBodySigma(space);
    expect(sigma.field.bodies).toBe(3);
  });
});

// ═══════════════════════════════════════════
// 波動シミュレーション
// ═══════════════════════════════════════════

describe('Wave simulation', () => {
  it('creates WaveField with correct dimensions', () => {
    const field = createWaveField(20, 20);
    expect(field.reiType).toBe('WaveField');
    expect(field.width).toBe(20);
    expect(field.height).toBe(20);
    expect(field.current.length).toBe(20);
    expect(field.current[0].length).toBe(20);
  });

  it('exciteWave sets amplitude at position', () => {
    const field = createWaveField(10, 10);
    exciteWave(field, 5, 5, 1.0);
    expect(field.current[5][5]).toBe(1.0);
  });

  it('exciteWave ignores out-of-bounds', () => {
    const field = createWaveField(10, 10);
    exciteWave(field, -1, 5, 1.0);
    exciteWave(field, 5, 100, 1.0);
    // Should not crash
    expect(field.current[5][5]).toBe(0);
  });

  it('stepWave propagates wave outward', () => {
    const field = createWaveField(10, 10, 1.0, 1.0);
    exciteWave(field, 5, 5, 1.0);
    stepWave(field);
    // Neighbors should now have non-zero amplitude
    expect(field.current[5][4]).not.toBe(0); // left
    expect(field.current[5][6]).not.toBe(0); // right
    expect(field.current[4][5]).not.toBe(0); // up
    expect(field.current[6][5]).not.toBe(0); // down
  });

  it('wave energy decreases with damping', () => {
    const field = createWaveField(20, 20, 1.0, 0.95);
    exciteWave(field, 10, 10, 5.0);
    runWave(field, 50);
    const sigma = getWaveSigma(field);
    expect(sigma.field.maxAmplitude).toBeLessThan(5.0);
  });

  it('σ reports wave field state', () => {
    const field = createWaveField(10, 10);
    exciteWave(field, 5, 5, 2.0);
    runWave(field, 5);
    const sigma = getWaveSigma(field);
    expect(sigma.reiType).toBe('WaveSigma');
    expect(sigma.field.width).toBe(10);
    expect(sigma.field.totalEnergy).toBeGreaterThan(0);
    expect(sigma.flow.time).toBeGreaterThan(0);
  });

  it('energy history is tracked in memory', () => {
    const field = createWaveField(10, 10);
    exciteWave(field, 5, 5, 1.0);
    runWave(field, 10);
    const sigma = getWaveSigma(field);
    expect(sigma.memory.totalSteps).toBe(10);
  });

  it('damped wave eventually reaches damped phase', () => {
    const field = createWaveField(10, 10, 1.0, 0.9);
    exciteWave(field, 5, 5, 0.1);
    runWave(field, 100);
    const sigma = getWaveSigma(field);
    expect(sigma.flow.phase).toBe('damped');
  });

  it('runWave executes multiple steps', () => {
    const field = createWaveField(10, 10);
    exciteWave(field, 5, 5, 1.0);
    runWave(field, 30);
    expect(field.totalSteps).toBe(30);
  });
});

// ═══════════════════════════════════════════
// 粒子系（熱力学）
// ═══════════════════════════════════════════

describe('Particle system (thermodynamics)', () => {
  it('creates ParticleSystem with correct count', () => {
    const sys = createParticleSystem(50, 1.0);
    expect(sys.reiType).toBe('ParticleSystem');
    expect(sys.particles.length).toBe(50);
    expect(sys.temperature).toBe(1.0);
  });

  it('initial center-of-mass velocity is near zero', () => {
    const sys = createParticleSystem(100, 1.0);
    const totalVx = sys.particles.reduce((s, p) => s + p.velocity.x, 0);
    const totalVy = sys.particles.reduce((s, p) => s + p.velocity.y, 0);
    expect(Math.abs(totalVx)).toBeLessThan(0.01);
    expect(Math.abs(totalVy)).toBeLessThan(0.01);
  });

  it('stepParticles advances time', () => {
    const sys = createParticleSystem(20, 1.0);
    stepParticles(sys, 0.01);
    expect(sys.totalSteps).toBe(1);
    expect(sys.time).toBeGreaterThan(0);
  });

  it('particles stay within periodic boundaries', () => {
    const sys = createParticleSystem(20, 2.0, 5.0);
    runParticles(sys, 100, 0.01);
    for (const p of sys.particles) {
      expect(p.position.x).toBeGreaterThanOrEqual(0);
      expect(p.position.x).toBeLessThan(5.0);
      expect(p.position.y).toBeGreaterThanOrEqual(0);
      expect(p.position.y).toBeLessThan(5.0);
    }
  });

  it('temperature is tracked in history', () => {
    const sys = createParticleSystem(30, 1.0);
    runParticles(sys, 20, 0.01);
    expect(sys.temperatureHistory.length).toBeGreaterThan(1);
  });

  it('σ field reports particle count and density', () => {
    const sys = createParticleSystem(50, 1.0, 10.0);
    const sigma = getThermodynamicSigma(sys);
    expect(sigma.reiType).toBe('ThermoSigma');
    expect(sigma.field.particleCount).toBe(50);
    expect(sigma.field.density).toBe(50 / (10 * 10 * 10));
  });

  it('σ flow reports temperature and speed', () => {
    const sys = createParticleSystem(50, 1.0);
    runParticles(sys, 10, 0.01);
    const sigma = getThermodynamicSigma(sys);
    expect(sigma.flow.temperature).toBeGreaterThan(0);
    expect(sigma.flow.avgSpeed).toBeGreaterThan(0);
  });

  it('σ memory reports trajectory', () => {
    const sys = createParticleSystem(30, 1.0);
    runParticles(sys, 20, 0.01);
    const sigma = getThermodynamicSigma(sys);
    expect(sigma.memory.temperatureHistory.length).toBeGreaterThan(1);
    expect(['stable', 'oscillating', 'diverging']).toContain(sigma.memory.trajectory);
  });

  it('σ will reports entropy', () => {
    const sys = createParticleSystem(50, 1.0);
    const sigma = getThermodynamicSigma(sys);
    expect(sigma.will.entropy).toBeGreaterThanOrEqual(0);
  });

  it('runParticles executes multiple steps', () => {
    const sys = createParticleSystem(20, 1.0);
    runParticles(sys, 30, 0.01);
    expect(sys.totalSteps).toBe(30);
  });

  it('higher temperature means higher average speed', () => {
    const sysLow = createParticleSystem(100, 0.1);
    const sysHigh = createParticleSystem(100, 10.0);
    const sigmaLow = getThermodynamicSigma(sysLow);
    const sigmaHigh = getThermodynamicSigma(sysHigh);
    expect(sigmaHigh.flow.avgSpeed).toBeGreaterThan(sigmaLow.flow.avgSpeed);
  });
});

// ═══════════════════════════════════════════
// 6属性統合テスト
// ═══════════════════════════════════════════

describe('Six-attribute integration (Natural Science)', () => {
  it('N-body σ has all 6 attributes', () => {
    const space = createNBodySpace([
      { id: 'a', mass: 10, position: vec3(0, 0, 0), velocity: vec3(0, 0, 0) },
      { id: 'b', mass: 1, position: vec3(5, 0, 0), velocity: vec3(0, 1, 0) },
    ]);
    runNBody(space, 10, 0.01);
    const sigma = getNBodySigma(space);

    expect(sigma.field).toBeDefined();
    expect(sigma.flow).toBeDefined();
    expect(sigma.memory).toBeDefined();
    expect(sigma.layer).toBeDefined();
    expect(sigma.relation).toBeDefined();
    expect(sigma.will).toBeDefined();
  });

  it('wave σ has field, flow, memory', () => {
    const field = createWaveField(10, 10);
    exciteWave(field, 5, 5, 1.0);
    runWave(field, 5);
    const sigma = getWaveSigma(field);

    expect(sigma.field).toBeDefined();
    expect(sigma.flow).toBeDefined();
    expect(sigma.memory).toBeDefined();
  });

  it('thermo σ has all 6 attributes', () => {
    const sys = createParticleSystem(30, 1.0);
    runParticles(sys, 10, 0.01);
    const sigma = getThermodynamicSigma(sys);

    expect(sigma.field).toBeDefined();
    expect(sigma.flow).toBeDefined();
    expect(sigma.memory).toBeDefined();
    expect(sigma.layer).toBeDefined();
    expect(sigma.will).toBeDefined();
  });
});
