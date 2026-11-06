import { KMeansResult, ClusterSummary } from '../types/analytics';

/**
 * Deterministic PRNG using Mulberry32 for reproducible research and benchmarking
 */
export function createRNG(seed: number) {
  let s = Math.floor(seed) >>> 0;
  return function () {
    let t = (s += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Euclidean distance squared between two points
 */
export function distanceSquared(a: number[], b: number[]): number {
  let sum = 0;
  for (let i = 0; i < a.length; i++) {
    const diff = a[i] - b[i];
    sum += diff * diff;
  }
  return sum;
}

/**
 * Euclidean distance
 */
export function euclideanDistance(a: number[], b: number[]): number {
  return Math.sqrt(distanceSquared(a, b));
}

/**
 * Single run of K-Means algorithm with Lloyd's iterations
 */
function singleKMeansRun(
  matrix: number[][],
  k: number,
  maxIter: number,
  rng: () => number
): {
  centroids: number[][];
  assignments: number[];
  wss: number[];
  totalWss: number;
  iterations: number;
} {
  const n = matrix.length;
  const d = matrix[0].length;

  // Initialize centroids using K-Means++ logic
  const centroids: number[][] = [];
  const firstIdx = Math.floor(rng() * n);
  centroids.push([...matrix[firstIdx]]);

  for (let c = 1; c < k; c++) {
    const distances = matrix.map((point) => {
      let minDistSq = Infinity;
      for (const centroid of centroids) {
        const dSq = distanceSquared(point, centroid);
        if (dSq < minDistSq) minDistSq = dSq;
      }
      return minDistSq;
    });

    const sumDist = distances.reduce((a, b) => a + b, 0);
    let target = rng() * sumDist;
    let selectedIdx = 0;

    for (let i = 0; i < n; i++) {
      target -= distances[i];
      if (target <= 0) {
        selectedIdx = i;
        break;
      }
    }
    centroids.push([...matrix[selectedIdx]]);
  }

  let assignments = new Array(n).fill(0);
  let iterations = 0;
  let changed = true;

  while (changed && iterations < maxIter) {
    changed = false;
    iterations++;

    // Step 1: Assign each point to closest centroid
    for (let i = 0; i < n; i++) {
      let minDistSq = Infinity;
      let bestCluster = 0;

      for (let c = 0; c < k; c++) {
        const dSq = distanceSquared(matrix[i], centroids[c]);
        if (dSq < minDistSq) {
          minDistSq = dSq;
          bestCluster = c;
        }
      }

      if (assignments[i] !== bestCluster) {
        assignments[i] = bestCluster;
        changed = true;
      }
    }

    // Step 2: Recompute centroids
    const counts = new Array(k).fill(0);
    const newCentroids = Array.from({ length: k }, () => new Array(d).fill(0));

    for (let i = 0; i < n; i++) {
      const c = assignments[i];
      counts[c]++;
      for (let j = 0; j < d; j++) {
        newCentroids[c][j] += matrix[i][j];
      }
    }

    for (let c = 0; c < k; c++) {
      if (counts[c] > 0) {
        for (let j = 0; j < d; j++) {
          centroids[c][j] = newCentroids[c][j] / counts[c];
        }
      } else {
        // Re-seed empty cluster to a random point
        const randIdx = Math.floor(rng() * n);
        centroids[c] = [...matrix[randIdx]];
        changed = true;
      }
    }
  }

  // Calculate WSS per cluster
  const wss = new Array(k).fill(0);
  for (let i = 0; i < n; i++) {
    const c = assignments[i];
    wss[c] += distanceSquared(matrix[i], centroids[c]);
  }
  const totalWss = wss.reduce((a, b) => a + b, 0);

  return { centroids, assignments, wss, totalWss, iterations };
}

/**
 * Calculate Silhouette score for an assignment
 */
export function calculateSilhouetteScore(matrix: number[][], assignments: number[], k: number): number {
  const n = matrix.length;
  if (n <= 1 || k <= 1) return 0;

  // Pre-group indices by cluster
  const clusterIndices: number[][] = Array.from({ length: k }, () => []);
  for (let i = 0; i < n; i++) {
    clusterIndices[assignments[i]].push(i);
  }

  // Subsample if dataset is very large to keep computation sub-second (< 1500 points)
  const sampleIndices: number[] = [];
  const maxEval = 1000;
  const step = Math.max(1, Math.floor(n / maxEval));
  for (let i = 0; i < n; i += step) {
    sampleIndices.push(i);
  }

  let totalSilhouette = 0;
  let evaluatedCount = 0;

  for (const i of sampleIndices) {
    const ownCluster = assignments[i];
    const ownIndices = clusterIndices[ownCluster];

    if (ownIndices.length <= 1) {
      continue;
    }

    // Mean intra-cluster distance a(i)
    let aSum = 0;
    for (const otherIdx of ownIndices) {
      if (i !== otherIdx) {
        aSum += euclideanDistance(matrix[i], matrix[otherIdx]);
      }
    }
    const a = aSum / (ownIndices.length - 1);

    // Lowest mean distance to other clusters b(i)
    let b = Infinity;
    for (let c = 0; c < k; c++) {
      if (c === ownCluster || clusterIndices[c].length === 0) continue;
      let otherSum = 0;
      for (const otherIdx of clusterIndices[c]) {
        otherSum += euclideanDistance(matrix[i], matrix[otherIdx]);
      }
      const meanDist = otherSum / clusterIndices[c].length;
      if (meanDist < b) {
        b = meanDist;
      }
    }

    const s = (b - a) / Math.max(a, b);
    totalSilhouette += isNaN(s) ? 0 : s;
    evaluatedCount++;
  }

  return evaluatedCount > 0 ? totalSilhouette / evaluatedCount : 0;
}

/**
 * Calculate Davies-Bouldin Index (lower is better)
 */
export function calculateDaviesBouldin(matrix: number[][], centroids: number[][], assignments: number[]): number {
  const k = centroids.length;
  if (k <= 1) return 0;

  // Average distance from centroid in each cluster
  const s = new Array(k).fill(0);
  const counts = new Array(k).fill(0);

  for (let i = 0; i < matrix.length; i++) {
    const c = assignments[i];
    s[c] += euclideanDistance(matrix[i], centroids[c]);
    counts[c]++;
  }

  for (let c = 0; c < k; c++) {
    s[c] = counts[c] > 0 ? s[c] / counts[c] : 0;
  }

  let sumR = 0;
  for (let i = 0; i < k; i++) {
    let maxR = 0;
    for (let j = 0; j < k; j++) {
      if (i === j) continue;
      const d = euclideanDistance(centroids[i], centroids[j]);
      if (d > 0) {
        const r = (s[i] + s[j]) / d;
        if (r > maxR) maxR = r;
      }
    }
    sumR += maxR;
  }

  return sumR / k;
}

/**
 * Calculate Calinski-Harabasz Index (higher is better)
 */
export function calculateCalinskiHarabasz(
  betweenSs: number,
  totalWss: number,
  n: number,
  k: number
): number {
  if (k <= 1 || n <= k || totalWss <= 0) return 0;
  return (betweenSs / (k - 1)) / (totalWss / (n - k));
}

/**
 * Perform 2D PCA projection for high-dimensional visual mapping
 */
export function computePca2D(matrix: number[][]): {
  coords: { x: number; y: number }[];
  varianceExplained: [number, number];
} {
  const n = matrix.length;
  const d = matrix[0].length;

  if (d <= 2) {
    const coords = matrix.map((row) => ({
      x: row[0] || 0,
      y: row[1] || 0,
    }));
    return { coords, varianceExplained: [60, 40] };
  }

  // Mean center
  const means = new Array(d).fill(0);
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < d; j++) {
      means[j] += matrix[i][j];
    }
  }
  for (let j = 0; j < d; j++) means[j] /= n;

  const centered = matrix.map((row) => row.map((val, j) => val - means[j]));

  // Covariance matrix
  const cov: number[][] = Array.from({ length: d }, () => new Array(d).fill(0));
  for (let j1 = 0; j1 < d; j1++) {
    for (let j2 = 0; j2 < d; j2++) {
      let sum = 0;
      for (let i = 0; i < n; i++) {
        sum += centered[i][j1] * centered[i][j2];
      }
      cov[j1][j2] = sum / (n - 1);
    }
  }

  // Power iteration for first 2 principal components
  function powerIteration(A: number[][], iterations = 30): { eigenvalue: number; vector: number[] } {
    const dim = A.length;
    let v = Array.from({ length: dim }, () => Math.random() - 0.5);

    for (let it = 0; it < iterations; it++) {
      // Multiply A * v
      const nextV = new Array(dim).fill(0);
      for (let r = 0; r < dim; r++) {
        for (let c = 0; c < dim; c++) {
          nextV[r] += A[r][c] * v[c];
        }
      }
      // Normalize
      const norm = Math.sqrt(nextV.reduce((a, b) => a + b * b, 0)) || 1;
      v = nextV.map((x) => x / norm);
    }

    // Rayleigh quotient
    let rayleighNumerator = 0;
    for (let r = 0; r < dim; r++) {
      let Av_r = 0;
      for (let c = 0; c < dim; c++) {
        Av_r += A[r][c] * v[c];
      }
      rayleighNumerator += v[r] * Av_r;
    }

    return { eigenvalue: Math.max(0, rayleighNumerator), vector: v };
  }

  const pc1 = powerIteration(cov);

  // Deflate covariance matrix for PC2: A_deflated = A - λ1 * v1 * v1^T
  const covDeflated = cov.map((row, r) =>
    row.map((val, c) => val - pc1.eigenvalue * pc1.vector[r] * pc1.vector[c])
  );
  const pc2 = powerIteration(covDeflated);

  // Project data onto PC1 and PC2
  const coords = centered.map((row) => {
    let x = 0;
    let y = 0;
    for (let j = 0; j < d; j++) {
      x += row[j] * pc1.vector[j];
      y += row[j] * pc2.vector[j];
    }
    return { x, y };
  });

  const trace = cov.reduce((sum, row, i) => sum + row[i], 0) || 1;
  const var1 = Math.min(100, Math.max(5, (pc1.eigenvalue / trace) * 100));
  const var2 = Math.min(100 - var1, Math.max(5, (pc2.eigenvalue / trace) * 100));

  return { coords, varianceExplained: [Math.round(var1), Math.round(var2)] };
}

/**
 * Full K-Means clustering execution with multiple initializations (nstart)
 * Replicates R script: kmeans(..., centers = k, nstart = nstart, iter.max = max_iter)
 */
export function runKMeans(
  matrix: number[][],
  rawRecords: Record<string, any>[],
  features: string[],
  k: number,
  options: {
    nstart?: number;
    maxIter?: number;
    seed?: number;
  } = {}
): KMeansResult {
  const startTime = performance.now();
  const n = matrix.length;
  const d = features.length;
  const nstart = options.nstart ?? 10;
  const maxIter = options.maxIter ?? 20;
  const baseSeed = options.seed ?? 5935;

  let bestRun: ReturnType<typeof singleKMeansRun> | null = null;

  for (let run = 0; run < nstart; run++) {
    const rng = createRNG(baseSeed + run * 7919);
    const result = singleKMeansRun(matrix, k, maxIter, rng);

    if (!bestRun || result.totalWss < bestRun.totalWss) {
      bestRun = result;
    }
  }

  if (!bestRun) {
    throw new Error('K-Means no pudo converger.');
  }

  // Calculate Total Sum of Squares (TSS)
  const globalCentroid = new Array(d).fill(0);
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < d; j++) {
      globalCentroid[j] += matrix[i][j];
    }
  }
  for (let j = 0; j < d; j++) globalCentroid[j] /= n;

  let totalSs = 0;
  for (let i = 0; i < n; i++) {
    totalSs += distanceSquared(matrix[i], globalCentroid);
  }

  const betweenSs = Math.max(0, totalSs - bestRun.totalWss);
  const explainedVarianceRatio = totalSs > 0 ? betweenSs / totalSs : 0;

  // Silhouette score
  const silhouetteScore = calculateSilhouetteScore(matrix, bestRun.assignments, k);

  // Davies-Bouldin
  const daviesBouldinIndex = calculateDaviesBouldin(matrix, bestRun.centroids, bestRun.assignments);

  // Calinski-Harabasz
  const calinskiHarabaszIndex = calculateCalinskiHarabasz(betweenSs, bestRun.totalWss, n, k);

  // Compute 2D PCA projection for visual explorer
  const pca = computePca2D(matrix);
  const pcaCoords = pca.coords.map((c, idx) => ({
    x: c.x,
    y: c.y,
    cluster: bestRun!.assignments[idx],
    id: idx,
  }));

  // Build cluster summaries with unscaled (raw) and scaled centroids
  const clusters: ClusterSummary[] = [];

  // Calculate global means in raw data for comparison
  const globalRawMeans: Record<string, number> = {};
  features.forEach((feat) => {
    const sum = rawRecords.reduce((acc, row) => acc + (Number(row[feat]) || 0), 0);
    globalRawMeans[feat] = sum / n;
  });

  for (let c = 0; c < k; c++) {
    const clusterIndices = bestRun.assignments
      .map((clusterId, idx) => (clusterId === c ? idx : -1))
      .filter((idx) => idx !== -1);

    const size = clusterIndices.length;
    const percentage = (size / n) * 100;

    const centroidsScaled: Record<string, number> = {};
    const centroidsRaw: Record<string, number> = {};

    features.forEach((feat, featIdx) => {
      centroidsScaled[feat] = bestRun!.centroids[c][featIdx];

      // Raw centroid mean
      const rawSum = clusterIndices.reduce(
        (acc, idx) => acc + (Number(rawRecords[idx][feat]) || 0),
        0
      );
      centroidsRaw[feat] = size > 0 ? rawSum / size : 0;
    });

    // Key differentiating features (deviation in z-score from global mean)
    const keyDifferentiators = features
      .map((feat, featIdx) => {
        const clusterMean = centroidsRaw[feat];
        const globalMean = globalRawMeans[feat];
        const zScoreDiff = bestRun!.centroids[c][featIdx];
        return {
          feature: feat,
          clusterMean,
          globalMean,
          zScoreDiff,
          direction: zScoreDiff >= 0 ? ('higher' as const) : ('lower' as const),
        };
      })
      .sort((a, b) => Math.abs(b.zScoreDiff) - Math.abs(a.zScoreDiff));

    clusters.push({
      id: c,
      name: `Segmento ${c + 1}`,
      size,
      percentage,
      wss: bestRun.wss[c],
      centroidsRaw,
      centroidsScaled,
      keyDifferentiators,
    });
  }

  const executionTimeMs = Math.round(performance.now() - startTime);

  return {
    k,
    nstart,
    maxIter,
    seed: baseSeed,
    convergedIterations: bestRun.iterations,
    clusterAssignments: bestRun.assignments,
    clusters,
    totalWss: bestRun.totalWss,
    totalSs,
    betweenSs,
    explainedVarianceRatio,
    silhouetteScore,
    daviesBouldinIndex,
    calinskiHarabaszIndex,
    pcaCoords,
    pcaVarianceExplained: pca.varianceExplained,
    executionTimeMs,
  };
}
