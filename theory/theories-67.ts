// ============================================================
// D-FUMT Theory #67: Rei Compression Theory (RCT)
// 生成的圧縮 — データではなく生成パラメータ（公理）を保存する
// K_Rei(x) = min{ |θ| : G_Rei(θ) = x }
//
// 考案者: 藤本伸樹 (Nobuki Fujimoto)
// ============================================================

export interface GenerativeParams {
  type: 'constant' | 'arithmetic' | 'geometric' | 'periodic' | 'polynomial' | 'recursive' | 'raw';
  params: number[];
  size: number;
}

export interface CompressionResult {
  params: GenerativeParams;
  compressionRatio: number;
  exactMatch: boolean;
  kolmogorovEstimate: number;
}

/**
 * データを生成的パラメータに圧縮する
 * 7つのパターン検出器を順次適用し、最もコンパクトなものを選択
 */
export function compressToGenerativeParams(data: number[]): CompressionResult {
  if (data.length === 0) {
    return {
      params: { type: 'raw', params: [], size: 0 },
      compressionRatio: 0,
      exactMatch: true,
      kolmogorovEstimate: 0,
    };
  }

  const candidates: CompressionResult[] = [
    tryConstant(data),
    tryArithmetic(data),
    tryGeometric(data),
    tryPeriodic(data),
    tryPolynomial(data),
    tryRecursive(data),
    rawFallback(data),
  ].filter(c => c !== null) as CompressionResult[];

  // exactMatchを優先し、次にcompressionRatioが最小のものを選択
  candidates.sort((a, b) => {
    if (a.exactMatch && !b.exactMatch) return -1;
    if (!a.exactMatch && b.exactMatch) return 1;
    return a.compressionRatio - b.compressionRatio;
  });

  return candidates[0];
}

/**
 * 生成パラメータからデータを復元する
 */
export function generate(params: GenerativeParams, length: number): number[] {
  switch (params.type) {
    case 'constant':
      return Array(length).fill(params.params[0]);

    case 'arithmetic': {
      const [start, diff] = params.params;
      return Array.from({ length }, (_, i) => start + diff * i);
    }

    case 'geometric': {
      const [start, ratio] = params.params;
      return Array.from({ length }, (_, i) => start * Math.pow(ratio, i));
    }

    case 'periodic': {
      const period = params.params;
      return Array.from({ length }, (_, i) => period[i % period.length]);
    }

    case 'polynomial': {
      const coeffs = params.params;
      return Array.from({ length }, (_, i) => {
        let val = 0;
        for (let j = 0; j < coeffs.length; j++) {
          val += coeffs[j] * Math.pow(i, j);
        }
        return val;
      });
    }

    case 'recursive': {
      const [a, b, c] = params.params; // f(n) = a*f(n-1) + b*f(n-2) + c
      const result = [params.params[3] ?? 0, params.params[4] ?? 1];
      for (let i = 2; i < length; i++) {
        result.push(a * result[i - 1] + b * result[i - 2] + c);
      }
      return result.slice(0, length);
    }

    case 'raw':
      return [...params.params];

    default:
      return [...params.params];
  }
}

// ─── パターン検出器 ─────────────────────────

function tryConstant(data: number[]): CompressionResult | null {
  const first = data[0];
  if (data.every(v => v === first)) {
    return {
      params: { type: 'constant', params: [first], size: 1 },
      compressionRatio: 1 / data.length,
      exactMatch: true,
      kolmogorovEstimate: 1,
    };
  }
  return null;
}

function tryArithmetic(data: number[]): CompressionResult | null {
  if (data.length < 2) return null;
  const diff = data[1] - data[0];
  const isArithmetic = data.every((v, i) => Math.abs(v - (data[0] + diff * i)) < 1e-10);
  if (isArithmetic) {
    return {
      params: { type: 'arithmetic', params: [data[0], diff], size: 2 },
      compressionRatio: 2 / data.length,
      exactMatch: true,
      kolmogorovEstimate: 2,
    };
  }
  return null;
}

function tryGeometric(data: number[]): CompressionResult | null {
  if (data.length < 2 || data[0] === 0) return null;
  const ratio = data[1] / data[0];
  if (ratio === 0 || !isFinite(ratio)) return null;
  const isGeometric = data.every((v, i) =>
    Math.abs(v - data[0] * Math.pow(ratio, i)) < Math.abs(v * 1e-10) + 1e-10
  );
  if (isGeometric) {
    return {
      params: { type: 'geometric', params: [data[0], ratio], size: 2 },
      compressionRatio: 2 / data.length,
      exactMatch: true,
      kolmogorovEstimate: 2,
    };
  }
  return null;
}

function tryPeriodic(data: number[]): CompressionResult | null {
  for (let period = 1; period <= Math.floor(data.length / 2); period++) {
    const pattern = data.slice(0, period);
    const isPeriodic = data.every((v, i) => v === pattern[i % period]);
    if (isPeriodic) {
      return {
        params: { type: 'periodic', params: pattern, size: period },
        compressionRatio: period / data.length,
        exactMatch: true,
        kolmogorovEstimate: period,
      };
    }
  }
  return null;
}

function tryPolynomial(data: number[]): CompressionResult | null {
  if (data.length < 3) return null;
  // 2次多項式: a + bx + cx^2
  // 3点から係数を推定
  const x0 = 0, x1 = 1, x2 = 2;
  const y0 = data[0], y1 = data[1], y2 = data[2];
  const c = (y2 - 2 * y1 + y0) / 2;
  const b = y1 - y0 - c;
  const a = y0;

  if (Math.abs(c) < 1e-10) return null; // 線形は arithmetic で処理

  const isPolynomial = data.every((v, i) =>
    Math.abs(v - (a + b * i + c * i * i)) < Math.abs(v * 1e-8) + 1e-8
  );
  if (isPolynomial) {
    return {
      params: { type: 'polynomial', params: [a, b, c], size: 3 },
      compressionRatio: 3 / data.length,
      exactMatch: true,
      kolmogorovEstimate: 3,
    };
  }
  return null;
}

function tryRecursive(data: number[]): CompressionResult | null {
  if (data.length < 4) return null;
  // f(n) = a*f(n-1) + b*f(n-2) + c
  // フィボナッチ型: a=1, b=1, c=0
  const f0 = data[0], f1 = data[1];

  // a=1, b=1, c=0 (フィボナッチ型)
  const fib = [f0, f1];
  for (let i = 2; i < data.length; i++) fib.push(fib[i - 1] + fib[i - 2]);
  if (data.every((v, i) => v === fib[i])) {
    return {
      params: { type: 'recursive', params: [1, 1, 0, f0, f1], size: 5 },
      compressionRatio: 5 / data.length,
      exactMatch: true,
      kolmogorovEstimate: 5,
    };
  }

  return null;
}

function rawFallback(data: number[]): CompressionResult {
  return {
    params: { type: 'raw', params: [...data], size: data.length },
    compressionRatio: 1.0,
    exactMatch: true,
    kolmogorovEstimate: data.length,
  };
}
