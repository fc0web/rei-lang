// ============================================================
// Rei (0₀式) stdlib — chrono module
// 時間数学理論: 時系列データの中心-周囲計算
// ============================================================
// 核心的洞察: 時系列における「現在値」は中心、
// 「過去の値」と「未来の値」は周囲。
// 時系列解析がReiの多次元数演算に帰着される。
// ============================================================

// --- Types ---

export interface ChronoPoint {
  readonly time: number;
  readonly value: number;
  readonly past: number[];
  readonly future: number[];
}

export type ChronoSeries = readonly ChronoPoint[];

export interface TemporalWindow {
  readonly pastSize: number;
  readonly futureSize: number;
  readonly stride: number;
}

export interface TrendResult {
  readonly slope: number;
  readonly intercept: number;
  readonly r2: number;
}

export interface DecomposeResult {
  readonly trend: number[];
  readonly seasonal: number[];
  readonly residual: number[];
}

export interface ForecastResult {
  readonly values: number[];
  readonly confidence: number;
  readonly method: string;
}

// --- Series Construction ---

export function createSeries(values: number[], timestamps?: number[]): ChronoSeries {
  return values.map((v, i) => ({
    time: timestamps ? timestamps[i] : i,
    value: v,
    past: values.slice(Math.max(0, i - 3), i),
    future: values.slice(i + 1, i + 4),
  }));
}

export function fromWindowed(data: number[], windowConfig: TemporalWindow): ChronoSeries {
  const { pastSize, futureSize, stride } = windowConfig;
  const points: ChronoPoint[] = [];

  for (let i = pastSize; i < data.length - futureSize; i += stride) {
    points.push({
      time: i,
      value: data[i],
      past: data.slice(i - pastSize, i),
      future: data.slice(i + 1, i + 1 + futureSize),
    });
  }
  return points;
}

export function resample(series: ChronoSeries, interval: number): ChronoSeries {
  if (series.length < 2) return series;

  const startTime = series[0].time;
  const endTime = series[series.length - 1].time;
  const result: ChronoPoint[] = [];

  for (let t = startTime; t <= endTime; t += interval) {
    const value = interpolateAt(series, t);
    result.push({ time: t, value, past: [], future: [] });
  }

  // Fill past/future after interpolation
  const values = result.map(p => p.value);
  return result.map((p, i) => ({
    ...p,
    past: values.slice(Math.max(0, i - 3), i),
    future: values.slice(i + 1, i + 4),
  }));
}

function interpolateAt(series: ChronoSeries, t: number): number {
  if (t <= series[0].time) return series[0].value;
  if (t >= series[series.length - 1].time) return series[series.length - 1].value;

  for (let i = 0; i < series.length - 1; i++) {
    if (series[i].time <= t && t <= series[i + 1].time) {
      const ratio = (t - series[i].time) / (series[i + 1].time - series[i].time);
      return series[i].value + ratio * (series[i + 1].value - series[i].value);
    }
  }
  return series[series.length - 1].value;
}

// --- Window Operations (Center-Periphery Mapping) ---

export function window(series: ChronoSeries, config: TemporalWindow): ChronoPoint[] {
  const values = series.map(p => p.value);
  const { pastSize, futureSize, stride } = config;
  const result: ChronoPoint[] = [];

  for (let i = pastSize; i < values.length - futureSize; i += stride) {
    result.push({
      time: series[i].time,
      value: values[i],
      past: values.slice(i - pastSize, i),
      future: values.slice(i + 1, i + 1 + futureSize),
    });
  }
  return result;
}

export function slide(series: ChronoSeries, windowSize: number, step = 1): ChronoPoint[] {
  const half = Math.floor(windowSize / 2);
  return window(series, { pastSize: half, futureSize: windowSize - half - 1, stride: step });
}

export function expanding(series: ChronoSeries): ChronoPoint[] {
  const values = series.map(p => p.value);
  return series.map((p, i) => ({
    time: p.time,
    value: p.value,
    past: values.slice(0, i),
    future: values.slice(i + 1),
  }));
}

// --- Time Series Analysis ---

export function trend(series: ChronoSeries): TrendResult {
  const n = series.length;
  if (n < 2) return { slope: 0, intercept: series[0]?.value ?? 0, r2: 0 };

  const xs = series.map(p => p.time);
  const ys = series.map(p => p.value);
  const meanX = xs.reduce((a, b) => a + b, 0) / n;
  const meanY = ys.reduce((a, b) => a + b, 0) / n;

  let num = 0, denX = 0, denY = 0;
  for (let i = 0; i < n; i++) {
    const dx = xs[i] - meanX;
    const dy = ys[i] - meanY;
    num += dx * dy;
    denX += dx * dx;
    denY += dy * dy;
  }

  const slope = denX === 0 ? 0 : num / denX;
  const intercept = meanY - slope * meanX;
  const r2 = denX === 0 || denY === 0 ? 0 : (num * num) / (denX * denY);

  return { slope, intercept, r2 };
}

export function seasonality(
  series: ChronoSeries,
  period: number
): { seasonal: number[]; residual: number[] } {
  const values = series.map(p => p.value);
  const n = values.length;

  // Compute seasonal averages
  const seasonalAvg = new Array(period).fill(0);
  const counts = new Array(period).fill(0);
  for (let i = 0; i < n; i++) {
    const idx = i % period;
    seasonalAvg[idx] += values[i];
    counts[idx]++;
  }
  for (let i = 0; i < period; i++) {
    seasonalAvg[i] = counts[i] > 0 ? seasonalAvg[i] / counts[i] : 0;
  }

  const grandMean = values.reduce((a, b) => a + b, 0) / n;
  const seasonal = seasonalAvg.map(s => s - grandMean);
  const residual = values.map((v, i) => v - seasonal[i % period] - grandMean);

  return { seasonal, residual };
}

export function decompose(series: ChronoSeries, period: number): DecomposeResult {
  const values = series.map(p => p.value);
  const n = values.length;

  // Trend: centered moving average
  const trendValues: number[] = new Array(n).fill(0);
  const half = Math.floor(period / 2);
  for (let i = half; i < n - half; i++) {
    let sum = 0;
    for (let j = i - half; j <= i + half; j++) sum += values[j];
    trendValues[i] = sum / (2 * half + 1);
  }
  // Extend trend at boundaries
  for (let i = 0; i < half; i++) trendValues[i] = trendValues[half];
  for (let i = n - half; i < n; i++) trendValues[i] = trendValues[n - half - 1];

  // Detrended
  const detrended = values.map((v, i) => v - trendValues[i]);

  // Seasonal component
  const seasonalAvg = new Array(period).fill(0);
  const counts = new Array(period).fill(0);
  for (let i = 0; i < n; i++) {
    seasonalAvg[i % period] += detrended[i];
    counts[i % period]++;
  }
  for (let i = 0; i < period; i++) {
    seasonalAvg[i] = counts[i] > 0 ? seasonalAvg[i] / counts[i] : 0;
  }

  const seasonalValues = values.map((_, i) => seasonalAvg[i % period]);
  const residualValues = values.map((v, i) => v - trendValues[i] - seasonalValues[i]);

  return { trend: trendValues, seasonal: seasonalValues, residual: residualValues };
}

export function autocorrelation(series: ChronoSeries, maxLag: number): number[] {
  const values = series.map(p => p.value);
  const n = values.length;
  const mean = values.reduce((a, b) => a + b, 0) / n;
  const variance = values.reduce((acc, v) => acc + (v - mean) ** 2, 0) / n;

  if (variance === 0) return new Array(maxLag + 1).fill(0);

  const result: number[] = [];
  for (let lag = 0; lag <= maxLag; lag++) {
    let sum = 0;
    for (let i = 0; i < n - lag; i++) {
      sum += (values[i] - mean) * (values[i + lag] - mean);
    }
    result.push(sum / (n * variance));
  }
  return result;
}

export function crossCorrelation(a: ChronoSeries, b: ChronoSeries, maxLag: number): number[] {
  const va = a.map(p => p.value);
  const vb = b.map(p => p.value);
  const n = Math.min(va.length, vb.length);
  const meanA = va.reduce((s, v) => s + v, 0) / n;
  const meanB = vb.reduce((s, v) => s + v, 0) / n;
  const stdA = Math.sqrt(va.reduce((s, v) => s + (v - meanA) ** 2, 0) / n);
  const stdB = Math.sqrt(vb.reduce((s, v) => s + (v - meanB) ** 2, 0) / n);

  if (stdA === 0 || stdB === 0) return new Array(2 * maxLag + 1).fill(0);

  const result: number[] = [];
  for (let lag = -maxLag; lag <= maxLag; lag++) {
    let sum = 0;
    let count = 0;
    for (let i = 0; i < n; i++) {
      const j = i + lag;
      if (j >= 0 && j < n) {
        sum += (va[i] - meanA) * (vb[j] - meanB);
        count++;
      }
    }
    result.push(count > 0 ? sum / (count * stdA * stdB) : 0);
  }
  return result;
}

// --- Forecast (Knowledge Backflow connection point) ---

export function forecast(
  series: ChronoSeries,
  steps: number,
  method: 'linear' | 'exponential' | 'arima' = 'linear'
): ForecastResult {
  const values = series.map(p => p.value);
  const n = values.length;

  if (method === 'linear') {
    const t = trend(series);
    const lastTime = series[n - 1].time;
    const interval = n > 1 ? (series[n - 1].time - series[0].time) / (n - 1) : 1;
    const predicted = Array.from({ length: steps }, (_, i) =>
      t.intercept + t.slope * (lastTime + (i + 1) * interval)
    );
    return { values: predicted, confidence: t.r2, method: 'linear' };
  }

  if (method === 'exponential') {
    // Simple exponential smoothing
    const alpha = 0.3;
    let level = values[0];
    for (let i = 1; i < n; i++) {
      level = alpha * values[i] + (1 - alpha) * level;
    }
    const predicted = new Array(steps).fill(level);
    return { values: predicted, confidence: 0.5, method: 'exponential' };
  }

  // ARIMA(1,1,0) simplified
  const diffs = values.slice(1).map((v, i) => v - values[i]);
  const phi = diffs.length > 1
    ? diffs.slice(1).reduce((s, d, i) => s + d * diffs[i], 0) /
      diffs.reduce((s, d) => s + d * d, 0.0001)
    : 0;

  const predicted: number[] = [];
  let lastVal = values[n - 1];
  let lastDiff = diffs[diffs.length - 1] || 0;
  for (let i = 0; i < steps; i++) {
    lastDiff = phi * lastDiff;
    lastVal += lastDiff;
    predicted.push(lastVal);
  }
  return { values: predicted, confidence: 0.4, method: 'arima' };
}

/** 過去方向への予測（知識逆流理論の核心） */
export function backcast(series: ChronoSeries, steps: number): ForecastResult {
  const reversed = [...series].reverse().map((p, i) => ({
    ...p,
    time: i,
    past: [...p.future],
    future: [...p.past],
  }));
  const result = forecast(reversed, steps, 'linear');
  return { ...result, values: result.values.reverse(), method: 'backcast' };
}

// --- Rei-specific Operations ---

/** 時系列の縮約（ダウンサンプリング + 特徴保持） */
export function compressSeries(series: ChronoSeries, factor = 2): ChronoSeries {
  const values = series.map(p => p.value);
  const result: ChronoPoint[] = [];

  for (let i = 0; i < values.length; i += factor) {
    const chunk = values.slice(i, i + factor);
    const center = chunk.reduce((a, b) => a + b, 0) / chunk.length;
    result.push({
      time: series[i].time,
      value: center,
      past: result.length > 0 ? result.slice(-3).map(p => p.value) : [],
      future: [],
    });
  }

  // Fill future references
  return result.map((p, i) => ({
    ...p,
    future: result.slice(i + 1, i + 4).map(q => q.value),
  }));
}

/** 補間による拡張 */
export function expandSeries(series: ChronoSeries, factor = 2): ChronoSeries {
  const values = series.map(p => p.value);
  const times = series.map(p => p.time);
  const expanded: { time: number; value: number }[] = [];

  for (let i = 0; i < values.length - 1; i++) {
    for (let j = 0; j < factor; j++) {
      const ratio = j / factor;
      expanded.push({
        time: times[i] + ratio * (times[i + 1] - times[i]),
        value: values[i] + ratio * (values[i + 1] - values[i]),
      });
    }
  }
  expanded.push({ time: times[times.length - 1], value: values[values.length - 1] });

  return createSeries(
    expanded.map(e => e.value),
    expanded.map(e => e.time)
  );
}

/** 差分 */
export function diff(series: ChronoSeries, order = 1): ChronoSeries {
  let values = series.map(p => p.value);
  let times = series.map(p => p.time);
  for (let d = 0; d < order; d++) {
    const newValues = values.slice(1).map((v, i) => v - values[i]);
    times = times.slice(1);
    values = newValues;
  }
  return createSeries(values, times);
}

/** 累積和 */
export function integrate(series: ChronoSeries): ChronoSeries {
  const values = series.map(p => p.value);
  const cumsum: number[] = [];
  let sum = 0;
  for (const v of values) {
    sum += v;
    cumsum.push(sum);
  }
  return createSeries(cumsum, series.map(p => p.time));
}

// --- Utility ---

export function values(series: ChronoSeries): number[] {
  return series.map(p => p.value);
}

export function timestamps(series: ChronoSeries): number[] {
  return series.map(p => p.time);
}

export function mean(series: ChronoSeries): number {
  const vals = values(series);
  return vals.reduce((a, b) => a + b, 0) / vals.length;
}

export function variance(series: ChronoSeries): number {
  const vals = values(series);
  const m = vals.reduce((a, b) => a + b, 0) / vals.length;
  return vals.reduce((acc, v) => acc + (v - m) ** 2, 0) / vals.length;
}
