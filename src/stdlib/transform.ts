// ============================================================
// Rei (0₀式) stdlib — transform module
// 知識逆流理論: データの高次変換パイプライン
// ============================================================
// 核心的洞察: Reiの拡張（△）と縮約（▽）は本質的に可逆ペア。
// transform は、この可逆性を任意のデータ変換に一般化する。
// 「結果から原因へ遡る」逆流変換を形式化する。
// ============================================================

// --- Types ---

export interface Transform<A = number, B = number> {
  readonly forward: (a: A) => B;
  readonly inverse: (b: B) => A;
  readonly name: string;
  readonly reversible: boolean;
  readonly lossy: boolean;
}

export interface TransformChain<A = number, Z = number> {
  readonly steps: Transform<any, any>[];
  readonly forward: (a: A) => Z;
  readonly inverse: (z: Z) => A;
  readonly name: string;
}

export interface Residual {
  readonly lostInfo: any;
  readonly confidence: number;
}

export interface RoundTripResult<A> {
  readonly original: A;
  readonly result: A;
  readonly error: number;
}

export interface InverseWithResidualResult<A> {
  readonly value: A;
  readonly residual: Residual;
}

// --- Transform Construction ---

export function createTransform<A, B>(
  forward: (a: A) => B,
  inverse: (b: B) => A,
  opts?: { name?: string; reversible?: boolean; lossy?: boolean }
): Transform<A, B> {
  return Object.freeze({
    forward,
    inverse,
    name: opts?.name ?? 'anonymous',
    reversible: opts?.reversible ?? true,
    lossy: opts?.lossy ?? false,
  });
}

export function chain<A, Z>(...transforms: Transform<any, any>[]): TransformChain<A, Z> {
  const forward = (a: A): Z => {
    let result: any = a;
    for (const t of transforms) {
      result = t.forward(result);
    }
    return result;
  };

  const inverse = (z: Z): A => {
    let result: any = z;
    for (let i = transforms.length - 1; i >= 0; i--) {
      result = transforms[i].inverse(result);
    }
    return result;
  };

  const name = transforms.map(t => t.name).join(' → ');

  return Object.freeze({ steps: transforms, forward, inverse, name });
}

export function identity<A>(): Transform<A, A> {
  return createTransform(
    (a: A) => a,
    (a: A) => a,
    { name: 'identity', reversible: true, lossy: false }
  );
}

// --- Built-in Transforms ---

export function normalize(mean: number, std: number): Transform<number, number> {
  if (std === 0) throw new Error('Standard deviation cannot be zero');
  return createTransform(
    (x: number) => (x - mean) / std,
    (y: number) => y * std + mean,
    { name: `normalize(μ=${mean}, σ=${std})`, reversible: true, lossy: false }
  );
}

export function log(base = Math.E): Transform<number, number> {
  const logBase = Math.log(base);
  return createTransform(
    (x: number) => Math.log(x + 1) / logBase,
    (y: number) => Math.pow(base, y) - 1,
    { name: `log(base=${base === Math.E ? 'e' : base})`, reversible: true, lossy: false }
  );
}

export function quantize(precision: number): Transform<number, number> {
  const factor = Math.pow(10, precision);
  return createTransform(
    (x: number) => Math.round(x * factor) / factor,
    (y: number) => y,  // 量子化は情報を失う → 逆変換は近似
    { name: `quantize(${precision})`, reversible: false, lossy: true }
  );
}

export function scale(factor: number): Transform<number, number> {
  if (factor === 0) throw new Error('Scale factor cannot be zero');
  return createTransform(
    (x: number) => x * factor,
    (y: number) => y / factor,
    { name: `scale(${factor})`, reversible: true, lossy: false }
  );
}

export function shift(offset: number): Transform<number, number> {
  return createTransform(
    (x: number) => x + offset,
    (y: number) => y - offset,
    { name: `shift(${offset})`, reversible: true, lossy: false }
  );
}

export function clamp(min: number, max: number): Transform<number, number> {
  return createTransform(
    (x: number) => Math.max(min, Math.min(max, x)),
    (y: number) => y,  // clampは情報を失う
    { name: `clamp(${min}, ${max})`, reversible: false, lossy: true }
  );
}

export function power(exp: number): Transform<number, number> {
  return createTransform(
    (x: number) => Math.pow(x, exp),
    (y: number) => Math.pow(y, 1 / exp),
    { name: `power(${exp})`, reversible: true, lossy: false }
  );
}

export function sigmoid(): Transform<number, number> {
  return createTransform(
    (x: number) => 1 / (1 + Math.exp(-x)),
    (y: number) => -Math.log(1 / y - 1),
    { name: 'sigmoid', reversible: true, lossy: false }
  );
}

export function softmax(): Transform<number[], number[]> {
  return createTransform(
    (xs: number[]) => {
      const maxX = Math.max(...xs);
      const exps = xs.map(x => Math.exp(x - maxX));
      const sum = exps.reduce((a, b) => a + b, 0);
      return exps.map(e => e / sum);
    },
    (ys: number[]) => {
      // Pseudo-inverse: log of probabilities (up to constant)
      return ys.map(y => Math.log(Math.max(y, 1e-15)));
    },
    { name: 'softmax', reversible: false, lossy: true }
  );
}

/** FFT変換 (実数配列 → 複素数配列) */
export function fft(): Transform<number[], Array<{ re: number; im: number }>> {
  return createTransform(
    (xs: number[]) => dft(xs),
    (freqs: Array<{ re: number; im: number }>) => idft(freqs),
    { name: 'fft', reversible: true, lossy: false }
  );
}

function dft(xs: number[]): Array<{ re: number; im: number }> {
  const N = xs.length;
  const result: Array<{ re: number; im: number }> = [];
  for (let k = 0; k < N; k++) {
    let re = 0, im = 0;
    for (let n = 0; n < N; n++) {
      const angle = -2 * Math.PI * k * n / N;
      re += xs[n] * Math.cos(angle);
      im += xs[n] * Math.sin(angle);
    }
    result.push({ re, im });
  }
  return result;
}

function idft(freqs: Array<{ re: number; im: number }>): number[] {
  const N = freqs.length;
  const result: number[] = [];
  for (let n = 0; n < N; n++) {
    let val = 0;
    for (let k = 0; k < N; k++) {
      const angle = 2 * Math.PI * k * n / N;
      val += freqs[k].re * Math.cos(angle) - freqs[k].im * Math.sin(angle);
    }
    result.push(val / N);
  }
  return result;
}

// --- Inverse Operations (Knowledge Backflow Core) ---

export function invert<A, B>(t: Transform<A, B>): Transform<B, A> {
  return createTransform(
    t.inverse,
    t.forward,
    { name: `inv(${t.name})`, reversible: t.reversible, lossy: t.lossy }
  );
}

export function inverseChain<A, Z>(c: TransformChain<A, Z>): TransformChain<Z, A> {
  const reversed = [...c.steps].reverse().map(s => invert(s));
  return chain<Z, A>(...reversed);
}

export function roundTrip<A>(value: A, c: TransformChain<A, any>): RoundTripResult<A> {
  const forwarded = c.forward(value);
  const result = c.inverse(forwarded);
  const error = computeError(value, result);
  return { original: value, result, error };
}

export function inverseWithResidual<A, B>(
  t: Transform<A, B>,
  b: B
): InverseWithResidualResult<A> {
  const inverted = t.inverse(b);
  const reForwarded = t.forward(inverted);
  const error = computeError(b, reForwarded);
  const confidence = Math.max(0, 1 - error);

  return {
    value: inverted,
    residual: {
      lostInfo: { forwardResult: reForwarded, originalInput: b, diff: error },
      confidence,
    },
  };
}

function computeError(a: any, b: any): number {
  if (typeof a === 'number' && typeof b === 'number') {
    return Math.abs(a - b) / (Math.abs(a) + 1e-15);
  }
  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) return 1;
    let sumSq = 0;
    for (let i = 0; i < a.length; i++) {
      const e = computeError(a[i], b[i]);
      sumSq += e * e;
    }
    return Math.sqrt(sumSq / a.length);
  }
  return a === b ? 0 : 1;
}

// --- Chain Operations ---

export function compose<A, B, C>(
  f: Transform<A, B>,
  g: Transform<B, C>
): Transform<A, C> {
  return createTransform(
    (a: A) => g.forward(f.forward(a)),
    (c: C) => f.inverse(g.inverse(c)),
    {
      name: `${f.name} ∘ ${g.name}`,
      reversible: f.reversible && g.reversible,
      lossy: f.lossy || g.lossy,
    }
  );
}

export function parallel<A, B, C, D>(
  f: Transform<A, B>,
  g: Transform<C, D>
): Transform<[A, C], [B, D]> {
  return createTransform(
    ([a, c]: [A, C]) => [f.forward(a), g.forward(c)] as [B, D],
    ([b, d]: [B, D]) => [f.inverse(b), g.inverse(d)] as [A, C],
    {
      name: `parallel(${f.name}, ${g.name})`,
      reversible: f.reversible && g.reversible,
      lossy: f.lossy || g.lossy,
    }
  );
}

export function conditional<A, B>(
  pred: (a: A) => boolean,
  ifTrue: Transform<A, B>,
  ifFalse: Transform<A, B>
): Transform<A, B> {
  return createTransform(
    (a: A) => pred(a) ? ifTrue.forward(a) : ifFalse.forward(a),
    (b: B) => {
      // 逆流時: 両方の逆変換を試みて、元の条件を検証
      const fromTrue = ifTrue.inverse(b);
      if (pred(fromTrue)) return fromTrue;
      return ifFalse.inverse(b);
    },
    {
      name: `cond(${ifTrue.name} | ${ifFalse.name})`,
      reversible: ifTrue.reversible && ifFalse.reversible,
      lossy: true,  // 条件分岐は逆流時に情報損失の可能性
    }
  );
}

// --- Analysis ---

export function isReversible<A>(t: Transform<A, any>, samples: A[]): boolean {
  for (const sample of samples) {
    const rt = roundTrip(sample, chain(t) as TransformChain<A, any>);
    if (rt.error > 1e-10) return false;
  }
  return true;
}

export function measureLoss<A>(value: A, c: TransformChain<A, any>): number {
  return roundTrip(value, c).error;
}

/** 数値ヤコビアン（有限差分近似） */
export function jacobian(
  t: Transform<number[], number[]>,
  at: number[],
  epsilon = 1e-7
): number[][] {
  const y0 = t.forward(at);
  const m = y0.length;
  const n = at.length;
  const J: number[][] = Array.from({ length: m }, () => new Array(n).fill(0));

  for (let j = 0; j < n; j++) {
    const perturbed = [...at];
    perturbed[j] += epsilon;
    const y1 = t.forward(perturbed);
    for (let i = 0; i < m; i++) {
      J[i][j] = (y1[i] - y0[i]) / epsilon;
    }
  }
  return J;
}
