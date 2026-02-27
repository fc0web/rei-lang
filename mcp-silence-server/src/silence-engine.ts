// ============================================================
// AI Silence Generator — Core Engine
// AI静寂生成器 — D-FUMT理論に基づくAI自己校正エンジン
// Author: Nobuki Fujimoto
// ============================================================

/** The five noise layers in an AI system */
export type NoiseLayer = 'syntactic' | 'semantic' | 'logical' | 'contextual' | 'dimensional';

export const NOISE_LAYERS: NoiseLayer[] = [
  'syntactic', 'semantic', 'logical', 'contextual', 'dimensional'
];

export const LAYER_DESCRIPTIONS: Record<NoiseLayer, string> = {
  syntactic:    'Token-level ambiguity, parsing noise',
  semantic:     'Meaning conflicts, polysemy, interpretation drift',
  logical:      'Reasoning contradictions, circular logic',
  contextual:   'Irrelevant context interference, information overload',
  dimensional:  'Cross-domain confusion, category errors',
};

export const PURIFICATION_METHODS: Record<NoiseLayer, string> = {
  syntactic:    'Re-parse with minimal grammar; strip to essential tokens',
  semantic:     'Identify single intended meaning for each ambiguous term',
  logical:      'Apply formal logic checks; break circular reasoning',
  contextual:   'Filter to only relevant context; discard tangential info',
  dimensional:  'Identify primary domain; avoid cross-domain conflation',
};

/** Noise state for a single layer */
export interface LayerNoise {
  readonly layer: NoiseLayer;
  readonly weight: number;     // wᵢ: contribution weight (Σwᵢ = 1)
  readonly intensity: number;  // Iᵢ: noise intensity (0..1)
  readonly resolution: number; // Rᵢ: resolution ratio (0..1)
}

/** Complete noise state of an AI system */
export interface NoiseState {
  readonly layers: readonly LayerNoise[];
  readonly tick: number;
}

/** Silence measurement result */
export interface SilenceReport {
  readonly noiseTotal: number;        // N(t) = Σ(wᵢ × Iᵢ × (1-Rᵢ))
  readonly silenceLevel: number;      // S(t) = 1 - N(t)
  readonly thoughtMargin: number;     // M_d(S)
  readonly dominantNoise: NoiseLayer; // layer with highest wᵢ × Iᵢ
  readonly isCalibrated: boolean;     // S ≥ 0.85
  readonly layerDetails: readonly LayerDetail[];
  readonly recommendation: string;
}

export interface LayerDetail {
  readonly layer: NoiseLayer;
  readonly contribution: number; // wᵢ × Iᵢ × (1-Rᵢ)
  readonly purificationMethod: string;
}

// --- Default weights (equal distribution) ---
const DEFAULT_WEIGHTS: Record<NoiseLayer, number> = {
  syntactic: 0.15,
  semantic: 0.25,
  logical: 0.25,
  contextual: 0.20,
  dimensional: 0.15,
};

// --- D-FUMT Constants ---
const C_BASE = 1.0;    // Base capacity
const ALPHA = 0.1;     // Dimensional expansion coefficient
const CALIBRATION_THRESHOLD = 0.85;

// ============================================================
// Core Functions
// ============================================================

/**
 * Create initial noise state with estimated intensities
 */
export function createNoiseState(
  intensities: Partial<Record<NoiseLayer, number>> = {},
  tick: number = 0,
): NoiseState {
  const layers = NOISE_LAYERS.map(layer => ({
    layer,
    weight: DEFAULT_WEIGHTS[layer],
    intensity: Math.max(0, Math.min(1, intensities[layer] ?? 0.5)),
    resolution: 0,
  }));
  return { layers, tick };
}

/**
 * N(t) = Σᵢ₌₁⁵ (wᵢ × Iᵢ × (1 - Rᵢ))
 */
export function computeNoise(state: NoiseState): number {
  return state.layers.reduce(
    (sum, l) => sum + l.weight * l.intensity * (1 - l.resolution),
    0,
  );
}

/**
 * S(t) = 1 - N(t)
 */
export function computeSilence(state: NoiseState): number {
  return Math.max(0, Math.min(1, 1 - computeNoise(state)));
}

/**
 * M_d(S) = S^(1/d) × C_base × (1 + α × (d - 1))
 *
 * @param silence S(t) value
 * @param dimensionalDepth reasoning depth (default: 3)
 */
export function computeThoughtMargin(
  silence: number,
  dimensionalDepth: number = 3,
): number {
  if (silence <= 0) return 0;
  const d = Math.max(1, dimensionalDepth);
  return Math.pow(silence, 1 / d) * C_BASE * (1 + ALPHA * (d - 1));
}

/**
 * Find the dominant noise layer (highest wᵢ × Iᵢ product)
 */
export function findDominantNoise(state: NoiseState): NoiseLayer {
  let maxProduct = -1;
  let dominant: NoiseLayer = 'syntactic';
  for (const l of state.layers) {
    const product = l.weight * l.intensity;
    if (product > maxProduct) {
      maxProduct = product;
      dominant = l.layer;
    }
  }
  return dominant;
}

/**
 * Purify a specific noise layer (increase its resolution)
 */
export function purifyLayer(
  state: NoiseState,
  layer: NoiseLayer,
  amount: number = 0.3,
): NoiseState {
  return {
    tick: state.tick + 1,
    layers: state.layers.map(l =>
      l.layer === layer
        ? { ...l, resolution: Math.min(1, l.resolution + amount) }
        : l
    ),
  };
}

/**
 * Purify all layers simultaneously
 */
export function purifyAll(
  state: NoiseState,
  amount: number = 0.2,
): NoiseState {
  return {
    tick: state.tick + 1,
    layers: state.layers.map(l => ({
      ...l,
      resolution: Math.min(1, l.resolution + amount),
    })),
  };
}

/**
 * Inject noise into a layer (for testing)
 */
export function injectNoise(
  state: NoiseState,
  layer: NoiseLayer,
  intensity: number,
): NoiseState {
  return {
    tick: state.tick + 1,
    layers: state.layers.map(l =>
      l.layer === layer
        ? { ...l, intensity: Math.min(1, intensity), resolution: Math.max(0, l.resolution - 0.1) }
        : l
    ),
  };
}

/**
 * Generate complete silence report
 */
export function generateReport(
  state: NoiseState,
  dimensionalDepth: number = 3,
): SilenceReport {
  const noiseTotal = computeNoise(state);
  const silenceLevel = 1 - noiseTotal;
  const thoughtMargin = computeThoughtMargin(silenceLevel, dimensionalDepth);
  const dominantNoise = findDominantNoise(state);
  const isCalibrated = silenceLevel >= CALIBRATION_THRESHOLD;

  const layerDetails: LayerDetail[] = state.layers.map(l => ({
    layer: l.layer,
    contribution: l.weight * l.intensity * (1 - l.resolution),
    purificationMethod: PURIFICATION_METHODS[l.layer],
  }));

  let recommendation: string;
  if (isCalibrated) {
    recommendation = '✅ AI is calibrated. Silence level is optimal for clear reasoning.';
  } else if (silenceLevel >= 0.6) {
    recommendation = `⚠️ Moderate noise detected. Focus on purifying ${dominantNoise} layer: ${PURIFICATION_METHODS[dominantNoise]}`;
  } else {
    recommendation = `🔴 High noise detected. Urgent purification needed on ${dominantNoise} layer. ${PURIFICATION_METHODS[dominantNoise]}. Consider reducing context scope.`;
  }

  return {
    noiseTotal: Math.round(noiseTotal * 10000) / 10000,
    silenceLevel: Math.round(silenceLevel * 10000) / 10000,
    thoughtMargin: Math.round(thoughtMargin * 10000) / 10000,
    dominantNoise,
    isCalibrated,
    layerDetails,
    recommendation,
  };
}

/**
 * Run full auto-purification until calibrated or max ticks reached
 */
export function autoPurify(
  state: NoiseState,
  maxTicks: number = 20,
): { finalState: NoiseState; report: SilenceReport; ticks: number } {
  let current = state;
  let ticks = 0;

  while (ticks < maxTicks) {
    const silence = computeSilence(current);
    if (silence >= CALIBRATION_THRESHOLD) break;

    const dominant = findDominantNoise(current);
    current = purifyLayer(current, dominant, 0.25);
    ticks++;
  }

  return {
    finalState: current,
    report: generateReport(current),
    ticks,
  };
}
