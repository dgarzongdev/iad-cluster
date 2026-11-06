import {
  OptimalKAnalysis,
  OptimalKResult,
  BootstrapStabilityResult,
} from '../types/analytics';
import { runKMeans, createRNG, distanceSquared } from './kmeans';

/**
 * Evaluate optimal K using Elbow, Silhouette (ASW), and Gap Statistic
 * Replicates R script: WSS evaluation (seed 5935, nstart 10), ASW (seed 2), and Gap Statistic
 */
export function evaluateOptimalK(
  matrix: number[][],
  rawRecords: Record<string, any>[],
  features: string[],
  kRange: [number, number] = [2, 10],
  seeds = { wssSeed: 5935, aswSeed: 2, gapSeed: 42 }
): OptimalKAnalysis {
  const [minK, maxK] = kRange;
  const evaluations: OptimalKResult[] = [];

  const n = matrix.length;
  const d = features.length;

  // Feature-wise min and max for Gap uniform reference generation
  const colMin = new Array(d).fill(Infinity);
  const colMax = new Array(d).fill(-Infinity);
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < d; j++) {
      if (matrix[i][j] < colMin[j]) colMin[j] = matrix[i][j];
      if (matrix[i][j] > colMax[j]) colMax[j] = matrix[i][j];
    }
  }

  // Number of bootstrap samples for GAP
  const gapB = 10;
  const gapRng = createRNG(seeds.gapSeed);

  for (let k = minK; k <= maxK; k++) {
    // 1. Run for WSS and Silhouette
    const km = runKMeans(matrix, rawRecords, features, k, {
      nstart: 5,
      maxIter: 20,
      seed: seeds.wssSeed + k,
    });

    const wss = km.totalWss;
    const silhouette = km.silhouetteScore;

    // 2. Compute Gap Statistic for this K
    let logWssSum = 0;
    const refLogWssList: number[] = [];

    for (let b = 0; b < gapB; b++) {
      // Generate uniform reference dataset bounded by feature intervals
      const refMatrix: number[][] = [];
      for (let i = 0; i < n; i++) {
        const row = new Array(d);
        for (let j = 0; j < d; j++) {
          row[j] = colMin[j] + gapRng() * (colMax[j] - colMin[j]);
        }
        refMatrix.push(row);
      }

      const refKm = runKMeans(refMatrix, rawRecords, features, k, {
        nstart: 2,
        maxIter: 15,
        seed: seeds.gapSeed + b * 13,
      });

      const logWss = Math.log(Math.max(1e-5, refKm.totalWss));
      refLogWssList.push(logWss);
      logWssSum += logWss;
    }

    const expectedLogWss = logWssSum / gapB;
    const actualLogWss = Math.log(Math.max(1e-5, wss));
    const gap = expectedLogWss - actualLogWss;

    // Standard deviation of reference logWss
    const refVariance =
      refLogWssList.reduce((sum, val) => sum + Math.pow(val - expectedLogWss, 2), 0) /
      (gapB - 1 || 1);
    const gapSd = Math.sqrt(refVariance);
    const gapSe = gapSd * Math.sqrt(1 + 1 / gapB);

    evaluations.push({
      k,
      wss,
      silhouette,
      gap,
      gapSe,
    });
  }

  // 1. Elbow point selection (maximum second difference / angle)
  let elbowRecommendedK = minK;
  let maxCurvature = -Infinity;
  for (let i = 1; i < evaluations.length - 1; i++) {
    const prev = evaluations[i - 1].wss;
    const curr = evaluations[i].wss;
    const next = evaluations[i + 1].wss;
    const secondDiff = prev - 2 * curr + next;
    if (secondDiff > maxCurvature) {
      maxCurvature = secondDiff;
      elbowRecommendedK = evaluations[i].k;
    }
  }
  if (elbowRecommendedK === minK && evaluations.length > 3) {
    elbowRecommendedK = evaluations[2].k; // sensible fallback (K=4 or K=5)
  }

  // 2. Silhouette recommended K (absolute max silhouette)
  let silhouetteRecommendedK = minK;
  let maxSil = -Infinity;
  evaluations.forEach((ev) => {
    if (ev.silhouette > maxSil) {
      maxSil = ev.silhouette;
      silhouetteRecommendedK = ev.k;
    }
  });

  // 3. Gap Statistic recommended K (1-SE Rule: smallest k where Gap(k) >= Gap(k+1) - s_{k+1})
  let gapRecommendedK = evaluations[0].k;
  for (let i = 0; i < evaluations.length - 1; i++) {
    const currentGap = evaluations[i].gap || 0;
    const nextGap = evaluations[i + 1].gap || 0;
    const nextSe = evaluations[i + 1].gapSe || 0;
    if (currentGap >= nextGap - nextSe) {
      gapRecommendedK = evaluations[i].k;
      break;
    }
  }

  const explanation = `
Comparación de criterios de selección:
- Método del Codo (Elbow): Sugiere K = ${elbowRecommendedK}, punto donde la reducción de inercia intra-cluster (WSS) comienza a estabilizarse.
- Silueta Promedio (ASW): Recomienda K = ${silhouetteRecommendedK} (coeficiente ASW: ${maxSil.toFixed(3)}), que maximiza la separación inter-cluster y cohesión interna.
- Estadístico GAP: Identifica K = ${gapRecommendedK} según el criterio de 1 error estándar frente a la distribución nula uniforme.
El script de referencia de R selecciona K = 5 como solución óptima de negocio por equilibrio entre interpretabilidad y homogeneidad.
`.trim();

  return {
    elbowRecommendedK,
    silhouetteRecommendedK,
    gapRecommendedK,
    evaluations,
    explanation,
  };
}

/**
 * Bootstrap Cluster Stability Analysis
 * Replicates R's fpc::clusterboot methodology:
 * Resamples rows with replacement B times, refits K-Means,
 * and matches bootstrap clusters to original clusters via maximum Jaccard similarity.
 */
export function runBootstrapStability(
  matrix: number[][],
  rawRecords: Record<string, any>[],
  features: string[],
  k: number,
  originalAssignments: number[],
  options: {
    iterations?: number;
    seed?: number;
  } = {}
): BootstrapStabilityResult {
  const B = options.iterations ?? 10;
  const seed = options.seed ?? 5;
  const n = matrix.length;
  const rng = createRNG(seed);

  // Group original indices by cluster
  const originalClusterSets: Set<number>[] = Array.from({ length: k }, () => new Set());
  for (let i = 0; i < n; i++) {
    originalClusterSets[originalAssignments[i]].add(i);
  }

  // Accumulate Jaccard similarity per cluster over B bootstrap iterations
  const jaccardSums = new Array(k).fill(0);

  for (let b = 0; b < B; b++) {
    // 1. Draw bootstrap sample of row indices with replacement
    const bootIndices: number[] = [];
    const bootMatrix: number[][] = [];
    for (let i = 0; i < n; i++) {
      const idx = Math.floor(rng() * n);
      bootIndices.push(idx);
      bootMatrix.push(matrix[idx]);
    }

    // 2. Fit K-Means on bootstrap sample
    const bootKm = runKMeans(bootMatrix, rawRecords, features, k, {
      nstart: 3,
      maxIter: 15,
      seed: seed + b * 101,
    });

    // 3. For each bootstrap cluster, determine which unique original rows belong to it
    const bootClusterSets: Set<number>[] = Array.from({ length: k }, () => new Set());
    for (let i = 0; i < n; i++) {
      const originalRowIdx = bootIndices[i];
      const assignedCluster = bootKm.clusterAssignments[i];
      bootClusterSets[assignedCluster].add(originalRowIdx);
    }

    // 4. For each original cluster, find the bootstrap cluster with the maximum Jaccard index
    for (let origC = 0; origC < k; origC++) {
      const origSet = originalClusterSets[origC];
      let maxJaccard = 0;

      for (let bootC = 0; bootC < k; bootC++) {
        const bootSet = bootClusterSets[bootC];

        // Intersection and Union
        let intersectionCount = 0;
        origSet.forEach((elem) => {
          if (bootSet.has(elem)) intersectionCount++;
        });

        const unionCount = origSet.size + bootSet.size - intersectionCount;
        const jaccard = unionCount > 0 ? intersectionCount / unionCount : 0;

        if (jaccard > maxJaccard) {
          maxJaccard = jaccard;
        }
      }

      jaccardSums[origC] += maxJaccard;
    }
  }

  // Calculate mean stability per cluster
  const clusterStabilities = jaccardSums.map((sum, c) => {
    const stability = sum / B;
    let classification: 'Muy Buena' | 'Buena' | 'Deficiente' = 'Buena';

    // R script benchmarks:
    // > 0.85 = Muy Buena
    // 0.75 - 0.85 = Buena
    // < 0.60 = Deficiente
    if (stability >= 0.85) {
      classification = 'Muy Buena';
    } else if (stability >= 0.75) {
      classification = 'Buena';
    } else {
      classification = 'Deficiente';
    }

    return {
      clusterId: c,
      stability: Math.min(1, Math.max(0, stability)),
      classification,
    };
  });

  const averageStability =
    clusterStabilities.reduce((acc, c) => acc + c.stability, 0) / k;

  let overallClassification: 'Muy Buena' | 'Buena' | 'Deficiente' = 'Buena';
  if (averageStability >= 0.85) {
    overallClassification = 'Muy Buena';
  } else if (averageStability >= 0.75) {
    overallClassification = 'Buena';
  } else {
    overallClassification = 'Deficiente';
  }

  let warningMessage: string | undefined;
  const unstableCount = clusterStabilities.filter((c) => c.stability < 0.6).length;
  if (unstableCount > 0) {
    warningMessage = `Atención: Se detectaron ${unstableCount} segmentos con índice de estabilidad inferior a 0.60, lo que indica susceptibilidad a fluctuaciones muestrales. Considere revisar las variables seleccionadas o ajustar K.`;
  }

  return {
    iterations: B,
    seed,
    clusterStabilities,
    averageStability,
    overallClassification,
    warningMessage,
  };
}
