// ============================================================
// Rei (0₀式) stdlib — holograph module
// ホログラフィック投影理論 (HMPT): 多次元→低次元投影
// ============================================================
// 核心的洞察: ホログラムが2次元に3次元情報を保持するように、
// Reiの多次元数は低次元表現に「折りたたんで」も、
// 中心-周囲パターンから元の構造を復元できる。
// ============================================================

// --- Types ---

export type ProjectionMethod = 'pca' | 'random' | 'sparse' | 'rei_compress';

export interface Projection {
  readonly sourceDim: number;
  readonly targetDim: number;
  readonly matrix: number[][];          // m × n 射影行列
  readonly pseudoInverse: number[][];   // n × m 疑似逆行列
  readonly method: ProjectionMethod;
  readonly preservedVariance: number;
}

export interface Hologram<T = number[]> {
  readonly projected: T;
  readonly envelope: number[];          // 復元用位相情報
  readonly sourceDim: number;
  readonly targetDim: number;
  readonly fidelity: number;
}

export interface ProjectionAnalysis {
  readonly explainedVariance: number[];
  readonly optimalDim: number;
  readonly intrinsicDim: number;
  readonly totalVariance: number;
}

// --- Matrix Utilities ---

function matMul(A: number[][], B: number[][]): number[][] {
  const m = A.length, n = B[0].length, p = B.length;
  const C: number[][] = Array.from({ length: m }, () => new Array(n).fill(0));
  for (let i = 0; i < m; i++)
    for (let j = 0; j < n; j++)
      for (let k = 0; k < p; k++)
        C[i][j] += A[i][k] * B[k][j];
  return C;
}

function transpose(M: number[][]): number[][] {
  const m = M.length, n = M[0].length;
  const T: number[][] = Array.from({ length: n }, () => new Array(m).fill(0));
  for (let i = 0; i < m; i++)
    for (let j = 0; j < n; j++)
      T[j][i] = M[i][j];
  return T;
}

function matVec(M: number[][], v: number[]): number[] {
  return M.map(row => row.reduce((s, val, i) => s + val * v[i], 0));
}

function vecNorm(v: number[]): number {
  return Math.sqrt(v.reduce((s, x) => s + x * x, 0));
}

function vecSub(a: number[], b: number[]): number[] {
  return a.map((v, i) => v - b[i]);
}

function vecDot(a: number[], b: number[]): number {
  return a.reduce((s, v, i) => s + v * b[i], 0);
}

function vecScale(v: number[], s: number): number[] {
  return v.map(x => x * s);
}

/** Power iteration for top-k eigenvectors of a symmetric matrix */
function topEigenvectors(cov: number[][], k: number, iterations = 200): {
  vectors: number[][];
  values: number[];
} {
  const n = cov.length;
  const vectors: number[][] = [];
  const values: number[] = [];
  const deflated = cov.map(row => [...row]);

  for (let comp = 0; comp < k; comp++) {
    // Initialize random vector
    let v = Array.from({ length: n }, (_, i) => Math.sin(i * 7.3 + comp * 13.1));
    let norm = vecNorm(v);
    v = v.map(x => x / norm);

    let eigenvalue = 0;
    for (let iter = 0; iter < iterations; iter++) {
      const Av = matVec(deflated, v);
      eigenvalue = vecDot(v, Av);
      norm = vecNorm(Av);
      if (norm < 1e-15) break;
      v = Av.map(x => x / norm);
    }

    vectors.push(v);
    values.push(Math.abs(eigenvalue));

    // Deflate: remove this component
    for (let i = 0; i < n; i++)
      for (let j = 0; j < n; j++)
        deflated[i][j] -= eigenvalue * v[i] * v[j];
  }

  return { vectors, values };
}

// --- Projection Construction ---

export function createProjection(
  sourceDim: number,
  targetDim: number,
  method: ProjectionMethod = 'random'
): Projection {
  if (targetDim >= sourceDim) {
    throw new Error(`targetDim (${targetDim}) must be < sourceDim (${sourceDim})`);
  }

  let matrix: number[][];

  if (method === 'random') {
    // Random Gaussian projection (JL lemma)
    const scale = 1 / Math.sqrt(targetDim);
    matrix = Array.from({ length: targetDim }, () =>
      Array.from({ length: sourceDim }, () => gaussianRandom() * scale)
    );
  } else if (method === 'sparse') {
    // Sparse random projection (Achlioptas)
    const s = Math.sqrt(3);
    matrix = Array.from({ length: targetDim }, () =>
      Array.from({ length: sourceDim }, () => {
        const r = Math.random();
        if (r < 1 / 6) return s / Math.sqrt(targetDim);
        if (r < 2 / 6) return -s / Math.sqrt(targetDim);
        return 0;
      })
    );
  } else {
    // Identity-like truncation (placeholder for PCA/rei_compress)
    matrix = Array.from({ length: targetDim }, (_, i) =>
      Array.from({ length: sourceDim }, (_, j) => (i === j ? 1 : 0))
    );
  }

  const pseudoInverse = computePseudoInverse(matrix);

  return Object.freeze({
    sourceDim,
    targetDim,
    matrix,
    pseudoInverse,
    method,
    preservedVariance: targetDim / sourceDim,  // placeholder
  });
}

function gaussianRandom(): number {
  // Box-Muller transform
  const u1 = Math.random() || 1e-15;
  const u2 = Math.random();
  return Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
}

function computePseudoInverse(M: number[][]): number[][] {
  // Moore-Penrose: P† = Mᵀ(MMᵀ)⁻¹
  const Mt = transpose(M);
  const MMt = matMul(M, Mt);

  // Simple inverse for small matrices via Gauss-Jordan
  const n = MMt.length;
  const aug = MMt.map((row, i) => {
    const r = [...row];
    for (let j = 0; j < n; j++) r.push(i === j ? 1 : 0);
    return r;
  });

  for (let col = 0; col < n; col++) {
    // Find pivot
    let maxRow = col;
    for (let row = col + 1; row < n; row++) {
      if (Math.abs(aug[row][col]) > Math.abs(aug[maxRow][col])) maxRow = row;
    }
    [aug[col], aug[maxRow]] = [aug[maxRow], aug[col]];

    const pivot = aug[col][col];
    if (Math.abs(pivot) < 1e-15) continue;

    for (let j = 0; j < 2 * n; j++) aug[col][j] /= pivot;
    for (let row = 0; row < n; row++) {
      if (row === col) continue;
      const factor = aug[row][col];
      for (let j = 0; j < 2 * n; j++) aug[row][j] -= factor * aug[col][j];
    }
  }

  const inv = aug.map(row => row.slice(n));
  return matMul(Mt, inv);
}

export function fromData(
  data: number[][],
  targetDim: number,
  method: ProjectionMethod = 'pca'
): Projection {
  const n = data.length;
  const sourceDim = data[0].length;

  if (targetDim >= sourceDim) {
    throw new Error(`targetDim (${targetDim}) must be < sourceDim (${sourceDim})`);
  }

  if (method === 'pca' || method === 'rei_compress') {
    // Compute mean
    const mean = new Array(sourceDim).fill(0);
    for (const row of data) {
      for (let j = 0; j < sourceDim; j++) mean[j] += row[j];
    }
    for (let j = 0; j < sourceDim; j++) mean[j] /= n;

    // Compute covariance matrix
    const cov: number[][] = Array.from({ length: sourceDim }, () => new Array(sourceDim).fill(0));
    for (const row of data) {
      const centered = row.map((v, j) => v - mean[j]);
      for (let i = 0; i < sourceDim; i++)
        for (let j = 0; j < sourceDim; j++)
          cov[i][j] += centered[i] * centered[j];
    }
    for (let i = 0; i < sourceDim; i++)
      for (let j = 0; j < sourceDim; j++)
        cov[i][j] /= n - 1;

    // Compute top eigenvectors
    const { vectors, values: eigenvalues } = topEigenvectors(cov, targetDim);

    // Projection matrix: rows are eigenvectors
    const matrix = vectors.slice(0, targetDim);

    // For rei_compress: weight by center-neighbor importance
    if (method === 'rei_compress') {
      for (let i = 0; i < targetDim; i++) {
        const weight = i === 0 ? 1.0 : 0.8 / Math.sqrt(i);  // center gets more weight
        matrix[i] = matrix[i].map(v => v * weight);
      }
    }

    const pseudoInverse = computePseudoInverse(matrix);
    const totalVar = eigenvalues.reduce((a, b) => a + b, 0);
    const preservedVar = eigenvalues.slice(0, targetDim).reduce((a, b) => a + b, 0);

    return Object.freeze({
      sourceDim,
      targetDim,
      matrix,
      pseudoInverse,
      method,
      preservedVariance: totalVar > 0 ? preservedVar / totalVar : 0,
    });
  }

  return createProjection(sourceDim, targetDim, method);
}

/** Rei独自投影: 中心-周囲パターンを活用 */
export function reiCompress(data: number[][], targetDim: number): Projection {
  return fromData(data, targetDim, 'rei_compress');
}

// --- Projection / Reconstruction ---

export function project(data: number[][], proj: Projection): number[][] {
  return data.map(row => matVec(proj.matrix, row));
}

export function reconstruct(projected: number[][], proj: Projection): number[][] {
  return projected.map(row => matVec(proj.pseudoInverse, row));
}

export function projectPoint(point: number[], proj: Projection): number[] {
  return matVec(proj.matrix, point);
}

export function reconstructPoint(point: number[], proj: Projection): number[] {
  return matVec(proj.pseudoInverse, point);
}

// --- Hologram Operations ---

export function encode(data: number[][], targetDim: number, method?: ProjectionMethod): Hologram<number[][]> {
  const proj = fromData(data, targetDim, method);
  const projected = project(data, proj);
  const reconstructed = reconstruct(projected, proj);

  // Envelope: residual information for reconstruction (phase info)
  const envelope: number[] = [];
  for (let i = 0; i < data.length; i++) {
    const diff = vecSub(data[i], reconstructed[i]);
    envelope.push(vecNorm(diff));
  }

  const fid = fidelity(data, reconstructed);

  return Object.freeze({
    projected,
    envelope,
    sourceDim: data[0].length,
    targetDim,
    fidelity: fid,
  });
}

export function decode<T>(hologram: Hologram<T>): T {
  // Note: Without the projection matrix, full decode is not possible.
  // This returns the projected data as-is (lossy reconstruction).
  return hologram.projected;
}

export function fidelity(original: number[][], reconstructed: number[][]): number {
  if (original.length === 0) return 1;
  let totalError = 0;
  let totalNorm = 0;
  for (let i = 0; i < original.length; i++) {
    const diff = vecSub(original[i], reconstructed[i]);
    totalError += vecDot(diff, diff);
    totalNorm += vecDot(original[i], original[i]);
  }
  return totalNorm > 0 ? Math.max(0, 1 - totalError / totalNorm) : 1;
}

export function residual(original: number[][], reconstructed: number[][]): number[][] {
  return original.map((row, i) => vecSub(row, reconstructed[i]));
}

// --- Analysis ---

export function explainedVariance(data: number[][], maxDim?: number): number[] {
  const n = data.length;
  const d = data[0].length;
  const dims = maxDim ?? d;

  const mean = new Array(d).fill(0);
  for (const row of data) for (let j = 0; j < d; j++) mean[j] += row[j];
  for (let j = 0; j < d; j++) mean[j] /= n;

  const cov: number[][] = Array.from({ length: d }, () => new Array(d).fill(0));
  for (const row of data) {
    const c = row.map((v, j) => v - mean[j]);
    for (let i = 0; i < d; i++)
      for (let j = 0; j < d; j++)
        cov[i][j] += c[i] * c[j];
  }
  for (let i = 0; i < d; i++)
    for (let j = 0; j < d; j++)
      cov[i][j] /= n - 1;

  const { values } = topEigenvectors(cov, dims);
  const total = values.reduce((a, b) => a + b, 0);
  return values.map(v => total > 0 ? v / total : 0);
}

export function optimalDim(data: number[][], threshold = 0.95): number {
  const variances = explainedVariance(data);
  let cumulative = 0;
  for (let i = 0; i < variances.length; i++) {
    cumulative += variances[i];
    if (cumulative >= threshold) return i + 1;
  }
  return variances.length;
}

export function intrinsicDim(data: number[][]): number {
  const variances = explainedVariance(data);
  // Participation ratio: (Σλᵢ)² / Σλᵢ²
  const sum = variances.reduce((a, b) => a + b, 0);
  const sumSq = variances.reduce((a, b) => a + b * b, 0);
  if (sumSq === 0) return 1;
  return Math.round(sum * sum / sumSq);
}

export function distortionMap(original: number[][], projected: number[][]): number[] {
  // For each pair of points, measure how much pairwise distances changed
  const n = original.length;
  const distortions: number[] = new Array(n).fill(0);

  for (let i = 0; i < n; i++) {
    let totalDistortion = 0;
    let count = 0;
    for (let j = 0; j < n; j++) {
      if (i === j) continue;
      const origDist = vecNorm(vecSub(original[i], original[j]));
      const projDist = vecNorm(vecSub(projected[i], projected[j]));
      if (origDist > 1e-15) {
        totalDistortion += Math.abs(origDist - projDist) / origDist;
        count++;
      }
    }
    distortions[i] = count > 0 ? totalDistortion / count : 0;
  }
  return distortions;
}

// --- Visualization Helpers ---

export function project2D(data: number[][]): { x: number[]; y: number[] } {
  const proj = fromData(data, 2, 'pca');
  const result = project(data, proj);
  return { x: result.map(r => r[0]), y: result.map(r => r[1]) };
}

export function project3D(data: number[][]): { x: number[]; y: number[]; z: number[] } {
  const proj = fromData(data, 3, 'pca');
  const result = project(data, proj);
  return { x: result.map(r => r[0]), y: result.map(r => r[1]), z: result.map(r => r[2]) };
}

// --- Analyze ---

export function analyze(data: number[][]): ProjectionAnalysis {
  const ev = explainedVariance(data);
  return {
    explainedVariance: ev,
    optimalDim: optimalDim(data),
    intrinsicDim: intrinsicDim(data),
    totalVariance: ev.reduce((a, b) => a + b, 0),
  };
}
