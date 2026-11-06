import React, { useState } from 'react';
import {
  GitFork,
  Play,
  RotateCcw,
  Sparkles,
  ArrowRight,
  TrendingDown,
  Layers,
  Table,
  Eye,
  Sliders,
  CheckCircle,
  HelpCircle,
  BarChart,
} from 'lucide-react';
import {
  KMeansResult,
  OptimalKAnalysis,
} from '../types/analytics';
import { runKMeans } from '../utils/kmeans';
import { evaluateOptimalK } from '../utils/validation';
import { PcaClusterScatter, OptimalKCurves, CLUSTER_COLORS } from './Charts';

interface Module4ClusteringProps {
  scaledMatrix: number[][];
  rawRecords: Record<string, any>[];
  features: string[];
  kmeansResult: KMeansResult | null;
  optimalKAnalysis: OptimalKAnalysis | null;
  onRunClustering: (result: KMeansResult, optAnalysis: OptimalKAnalysis) => void;
  onProceedToValidation: () => void;
}

export const Module4Clustering: React.FC<Module4ClusteringProps> = ({
  scaledMatrix,
  rawRecords,
  features,
  kmeansResult,
  optimalKAnalysis,
  onRunClustering,
  onProceedToValidation,
}) => {
  // Parameters matching R script 02. K_means.R default benchmark
  const [kValue, setKValue] = useState<number>(kmeansResult?.k || 5);
  const [nstart, setNstart] = useState<number>(kmeansResult?.nstart || 10);
  const [maxIter, setMaxIter] = useState<number>(kmeansResult?.maxIter || 20);
  const [seed, setSeed] = useState<number>(kmeansResult?.seed || 5935);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [scaleView, setScaleView] = useState<'raw' | 'scaled'>('raw');
  const [selectedClusterDetail, setSelectedClusterDetail] = useState<number>(0);

  // Run or re-run K-Means and optimal evaluation
  const handleExecute = () => {
    if (!scaledMatrix || scaledMatrix.length === 0 || features.length === 0) return;
    setIsRunning(true);

    setTimeout(() => {
      try {
        // 1. Evaluate optimal K if not already evaluated
        let optAnalysis = optimalKAnalysis;
        if (!optAnalysis) {
          optAnalysis = evaluateOptimalK(
            scaledMatrix,
            rawRecords,
            features,
            [2, 8],
            { wssSeed: 5935, aswSeed: 2, gapSeed: 42 }
          );
        }

        // 2. Run K-Means with user parameters
        const km = runKMeans(scaledMatrix, rawRecords, features, kValue, {
          nstart,
          maxIter,
          seed,
        });

        onRunClustering(km, optAnalysis);
      } catch (err) {
        console.error('Error running K-Means:', err);
      } finally {
        setIsRunning(false);
      }
    }, 50);
  };

  return (
    <div className="space-y-6">
      {/* Module Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-semibold mb-2 border border-blue-200">
            <GitFork className="w-3.5 h-3.5" />
            <span>Módulo 4: Segmentación de Clientes mediante K-Means</span>
          </div>
          <h2 className="text-xl font-bold text-slate-900">
            Ajuste del Modelo, Optimización de K & Visualización 2D PCA
          </h2>
          <p className="text-xs text-slate-500 max-w-2xl mt-1">
            Ejecución del algoritmo K-Means con inicialización múltiple (<code>nstart={nstart}</code>), semilla reproducible (<code>seed={seed}</code>) y convergencia por distancia euclidiana sobre la matriz estandarizada.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleExecute}
            disabled={isRunning}
            className="py-2.5 px-6 rounded-lg font-semibold text-xs bg-blue-600 hover:bg-blue-700 text-white shadow-sm flex items-center gap-2 transition disabled:opacity-50"
          >
            {isRunning ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Ejecutando K-Means...</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-white" />
                <span>{kmeansResult ? 'Recalcular Modelo' : 'Ejecutar K-Means'}</span>
              </>
            )}
          </button>

          {kmeansResult && (
            <button
              onClick={onProceedToValidation}
              className="py-2.5 px-5 rounded-lg font-semibold text-xs bg-slate-900 hover:bg-black text-white shadow-sm flex items-center gap-2 transition"
            >
              <span>Validación Bootstrap</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Model Parameter Controls */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
        <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-4 flex items-center gap-2">
          <Sliders className="w-4 h-4 text-blue-600" />
          <span>Parámetros de Configuración del Algoritmo</span>
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <div className="flex justify-between text-xs font-medium text-slate-700 mb-1">
              <span>Número de Clusters (K):</span>
              <strong className="text-blue-600 text-sm font-bold">K = {kValue}</strong>
            </div>
            <input
              type="range"
              min="2"
              max="10"
              step="1"
              value={kValue}
              onChange={(e) => setKValue(Number(e.target.value))}
              className="w-full accent-blue-600 cursor-pointer"
            />
            <span className="text-[11px] text-slate-400">Rango de 2 a 10 grupos</span>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Reinicios Aleatorios (nstart):
            </label>
            <input
              type="number"
              min="1"
              max="50"
              value={nstart}
              onChange={(e) => setNstart(Number(e.target.value))}
              className="w-full border border-slate-300 rounded px-3 py-1.5 text-xs bg-white text-slate-800 font-mono"
            />
            <span className="text-[11px] text-slate-400">R script usa nstart=10</span>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Iteraciones Máximas (iter.max):
            </label>
            <input
              type="number"
              min="5"
              max="100"
              value={maxIter}
              onChange={(e) => setMaxIter(Number(e.target.value))}
              className="w-full border border-slate-300 rounded px-3 py-1.5 text-xs bg-white text-slate-800 font-mono"
            />
            <span className="text-[11px] text-slate-400">R script usa iter.max=20</span>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Semilla Aleatoria (Seed):
            </label>
            <input
              type="number"
              value={seed}
              onChange={(e) => setSeed(Number(e.target.value))}
              className="w-full border border-slate-300 rounded px-3 py-1.5 text-xs bg-white text-slate-800 font-mono"
            />
            <span className="text-[11px] text-slate-400">R script benchmark = 5935</span>
          </div>
        </div>
      </div>

      {/* 4.1 Optimal K Evaluation Curves */}
      {optimalKAnalysis && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900">
              4.1 Evaluación Comparativa del Número Óptimo de Clusters
            </h3>
            <div className="flex gap-2">
              <button
                onClick={() => setKValue(optimalKAnalysis.elbowRecommendedK)}
                className="px-2.5 py-1 text-xs rounded bg-blue-50 text-blue-700 font-medium hover:bg-blue-100 transition"
              >
                Codo: K={optimalKAnalysis.elbowRecommendedK}
              </button>
              <button
                onClick={() => setKValue(optimalKAnalysis.silhouetteRecommendedK)}
                className="px-2.5 py-1 text-xs rounded bg-teal-50 text-teal-700 font-medium hover:bg-teal-100 transition"
              >
                Silueta: K={optimalKAnalysis.silhouetteRecommendedK}
              </button>
              <button
                onClick={() => setKValue(5)}
                className="px-2.5 py-1 text-xs rounded bg-indigo-50 text-indigo-700 font-bold hover:bg-indigo-100 transition"
              >
                Script R: K=5
              </button>
            </div>
          </div>

          <OptimalKCurves
            evaluations={optimalKAnalysis.evaluations}
            recommendedElbow={optimalKAnalysis.elbowRecommendedK}
            recommendedSilhouette={optimalKAnalysis.silhouetteRecommendedK}
            recommendedGap={optimalKAnalysis.gapRecommendedK}
          />
        </div>
      )}

      {/* 4.3 Clustering Results */}
      {kmeansResult && (
        <div className="space-y-6">
          {/* Summary KPIs */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm">
              <span className="text-[11px] text-slate-400 font-medium block">Varianza Explicada</span>
              <span className="text-base font-bold text-slate-800">
                {(kmeansResult.explainedVarianceRatio * 100).toFixed(1)}%
              </span>
              <span className="text-[10px] text-slate-400 block mt-0.5">BSS / TSS</span>
            </div>

            <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm">
              <span className="text-[11px] text-slate-400 font-medium block">Silhouette Score</span>
              <span className="text-base font-bold text-teal-600">
                {kmeansResult.silhouetteScore.toFixed(3)}
              </span>
              <span className="text-[10px] text-slate-400 block mt-0.5">[-1 a +1]</span>
            </div>

            <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm">
              <span className="text-[11px] text-slate-400 font-medium block">Inercia Total (WSS)</span>
              <span className="text-base font-bold text-slate-800">
                {kmeansResult.totalWss.toFixed(1)}
              </span>
              <span className="text-[10px] text-slate-400 block mt-0.5">Suma intra-cluster</span>
            </div>

            <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm">
              <span className="text-[11px] text-slate-400 font-medium block">Convergencia</span>
              <span className="text-base font-bold text-slate-800">
                {kmeansResult.convergedIterations} iters
              </span>
              <span className="text-[10px] text-slate-400 block mt-0.5">{kmeansResult.executionTimeMs} ms</span>
            </div>

            <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm">
              <span className="text-[11px] text-slate-400 font-medium block">Calinski-Harabasz</span>
              <span className="text-base font-bold text-indigo-600">
                {kmeansResult.calinskiHarabaszIndex.toFixed(1)}
              </span>
              <span className="text-[10px] text-slate-400 block mt-0.5">Mayor es mejor</span>
            </div>
          </div>

          {/* 2D PCA Cluster Projection */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
            <PcaClusterScatter
              coords={kmeansResult.pcaCoords}
              clustersCount={kmeansResult.k}
              clusterNames={Object.fromEntries(
                kmeansResult.clusters.map((c) => [c.id, c.name])
              )}
              varianceExplained={kmeansResult.pcaVarianceExplained}
              height={380}
            />
          </div>

          {/* Centroids Table */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Centroides de los Segmentos y Participación
                </h3>
                <span className="text-xs text-slate-500">
                  {scaleView === 'raw'
                    ? 'Mostrando valores promedio en escala original / unidades naturales'
                    : 'Mostrando Z-Score estandarizado (desviaciones estándar sobre la media)'}
                </span>
              </div>

              <div className="flex items-center gap-1 bg-white p-1 rounded-lg border border-slate-200 text-xs">
                <button
                  onClick={() => setScaleView('raw')}
                  className={`px-3 py-1 rounded-md font-medium transition ${
                    scaleView === 'raw'
                      ? 'bg-blue-600 text-white font-semibold shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Escala Original
                </button>
                <button
                  onClick={() => setScaleView('scaled')}
                  className={`px-3 py-1 rounded-md font-medium transition ${
                    scaleView === 'scaled'
                      ? 'bg-blue-600 text-white font-semibold shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Z-Score (Estandarizado)
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="p-3">Segmento</th>
                    <th className="p-3 text-center">Clientes</th>
                    <th className="p-3 text-center">% Total</th>
                    <th className="p-3 text-right">Inercia WSS</th>
                    {features.map((feat) => (
                      <th key={feat} className="p-3 font-mono text-right whitespace-nowrap">
                        {feat}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {kmeansResult.clusters.map((c) => {
                    const color = CLUSTER_COLORS[c.id % CLUSTER_COLORS.length];
                    return (
                      <tr key={c.id} className="hover:bg-slate-50">
                        <td className="p-3 font-semibold text-slate-900 flex items-center gap-2">
                          <span
                            className="w-3 h-3 rounded-full shrink-0"
                            style={{ backgroundColor: color }}
                          />
                          <span>{c.name}</span>
                        </td>
                        <td className="p-3 text-center font-medium">{c.size}</td>
                        <td className="p-3 text-center font-bold text-slate-800">
                          {c.percentage.toFixed(1)}%
                        </td>
                        <td className="p-3 text-right font-mono text-slate-500">
                          {c.wss.toFixed(1)}
                        </td>
                        {features.map((feat) => {
                          const val =
                            scaleView === 'raw'
                              ? c.centroidsRaw[feat]
                              : c.centroidsScaled[feat];

                          const isHigh =
                            scaleView === 'scaled' && val > 0.5;
                          const isLow =
                            scaleView === 'scaled' && val < -0.5;

                          return (
                            <td
                              key={feat}
                              className={`p-3 text-right font-mono ${
                                isHigh
                                  ? 'text-blue-700 font-bold bg-blue-50/40'
                                  : isLow
                                  ? 'text-rose-700 font-bold bg-rose-50/40'
                                  : ''
                              }`}
                            >
                              {val !== undefined ? val.toFixed(2) : '-'}
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
