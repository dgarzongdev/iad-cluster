import React, { useState } from 'react';
import {
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  ArrowRight,
  Info,
  Sliders,
  Award,
} from 'lucide-react';
import {
  KMeansResult,
  BootstrapStabilityResult,
} from '../types/analytics';
import { runBootstrapStability } from '../utils/validation';
import { CLUSTER_COLORS } from './Charts';

interface Module5ValidationProps {
  scaledMatrix: number[][];
  rawRecords: Record<string, any>[];
  features: string[];
  kmeansResult: KMeansResult;
  stabilityResult: BootstrapStabilityResult | null;
  onRunBootstrap: (res: BootstrapStabilityResult) => void;
  onProceedToProfiles: () => void;
}

export const Module5Validation: React.FC<Module5ValidationProps> = ({
  scaledMatrix,
  rawRecords,
  features,
  kmeansResult,
  stabilityResult,
  onRunBootstrap,
  onProceedToProfiles,
}) => {
  // Bootstrap parameters matching R script (iterations: 10, seed: 5)
  const [iterations, setIterations] = useState<number>(stabilityResult?.iterations || 10);
  const [seed, setSeed] = useState<number>(stabilityResult?.seed || 5);
  const [isComputing, setIsComputing] = useState<boolean>(false);

  const handleRunBootstrap = () => {
    setIsComputing(true);
    setTimeout(() => {
      try {
        const res = runBootstrapStability(
          scaledMatrix,
          rawRecords,
          features,
          kmeansResult.k,
          kmeansResult.clusterAssignments,
          { iterations, seed }
        );
        onRunBootstrap(res);
      } catch (err) {
        console.error('Error in bootstrap stability:', err);
      } finally {
        setIsComputing(false);
      }
    }, 50);
  };

  return (
    <div className="space-y-6">
      {/* Module Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-semibold mb-2 border border-blue-200">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Módulo 5: Validación y Consistencia de los Clusters</span>
          </div>
          <h2 className="text-xl font-bold text-slate-900">
            Validación de Estabilidad por Remuestreo Bootstrap (fpc::clusterboot)
          </h2>
          <p className="text-xs text-slate-500 max-w-2xl mt-1">
            Evaluación de la consistencia y robustez de los {kmeansResult.k} clusters frente a fluctuaciones en los datos mediante remuestreo con reemplazo e índice de similitud de Jaccard.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleRunBootstrap}
            disabled={isComputing}
            className="py-2.5 px-6 rounded-lg font-semibold text-xs bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm flex items-center gap-2 transition disabled:opacity-50"
          >
            {isComputing ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Calculando {iterations} Bootstrap runs...</span>
              </>
            ) : (
              <>
                <ShieldCheck className="w-4 h-4" />
                <span>{stabilityResult ? 'Recalcular Estabilidad' : 'Ejecutar Validación Bootstrap'}</span>
              </>
            )}
          </button>

          <button
            onClick={onProceedToProfiles}
            className="py-2.5 px-5 rounded-lg font-semibold text-xs bg-slate-900 hover:bg-black text-white shadow-sm flex items-center gap-2 transition"
          >
            <span>Ver Perfiles de Segmento</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Bootstrap Config */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
        <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3 flex items-center gap-2">
          <Sliders className="w-4 h-4 text-blue-600" />
          <span>Configuración del Procedimiento Bootstrap (Script R)</span>
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Repeticiones Bootstrap (B):
            </label>
            <input
              type="number"
              min="5"
              max="50"
              value={iterations}
              onChange={(e) => setIterations(Number(e.target.value))}
              className="w-full border border-slate-300 rounded px-3 py-1.5 text-xs bg-white text-slate-800 font-mono"
            />
            <span className="text-[11px] text-slate-400">R script usa B=10</span>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Semilla de Validación (Seed):
            </label>
            <input
              type="number"
              value={seed}
              onChange={(e) => setSeed(Number(e.target.value))}
              className="w-full border border-slate-300 rounded px-3 py-1.5 text-xs bg-white text-slate-800 font-mono"
            />
            <span className="text-[11px] text-slate-400">R script usa seed=5</span>
          </div>

          <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 flex flex-col justify-center">
            <span className="text-[11px] text-slate-500 font-medium block">
              Criterios de Interpretación de R:
            </span>
            <div className="text-[10px] text-slate-600 space-y-0.5 mt-1 font-mono">
              <span className="text-emerald-700 block font-semibold">&gt; 0.85: Muy buena</span>
              <span className="text-blue-700 block font-semibold">0.75 - 0.85: Buena</span>
              <span className="text-rose-700 block font-semibold">&lt; 0.60: Deficiente / Inestable</span>
            </div>
          </div>
        </div>
      </div>

      {/* Stability Results */}
      {stabilityResult && (
        <div className="space-y-6">
          {/* Summary Box */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
              <div
                className={`w-14 h-14 rounded-2xl flex items-center justify-center font-bold text-lg text-white shadow-lg ${
                  stabilityResult.averageStability >= 0.85
                    ? 'bg-emerald-600 shadow-emerald-500/20'
                    : stabilityResult.averageStability >= 0.75
                    ? 'bg-blue-600 shadow-blue-500/20'
                    : 'bg-amber-600 shadow-amber-500/20'
                }`}
              >
                {stabilityResult.averageStability.toFixed(2)}
              </div>
              <div>
                <span className="text-xs text-slate-400 font-medium block">Estabilidad Promedio</span>
                <span className="text-base font-bold text-slate-900">
                  {stabilityResult.overallClassification}
                </span>
                <span className="text-[11px] text-slate-500 block mt-0.5">
                  Índice Jaccard medio sobre {stabilityResult.iterations} remuestreos
                </span>
              </div>
            </div>

            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-center">
              <span className="text-xs text-slate-400 font-medium block">Clusters Estables (&ge; 0.75)</span>
              <span className="text-2xl font-bold text-emerald-600">
                {
                  stabilityResult.clusterStabilities.filter((c) => c.stability >= 0.75).length
                }{' '}
                <span className="text-sm font-normal text-slate-500">de {kmeansResult.k}</span>
              </span>
              <span className="text-[11px] text-slate-500 block mt-0.5">
                Segmentos con alta reproducibilidad
              </span>
            </div>

            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-center">
              <span className="text-xs text-slate-400 font-medium block">Calidad Geométrica vs Estabilidad</span>
              <div className="flex gap-4 mt-1">
                <div>
                  <span className="text-xs text-slate-400 block text-[10px]">Silueta:</span>
                  <strong className="text-sm text-slate-800">{kmeansResult.silhouetteScore.toFixed(3)}</strong>
                </div>
                <div>
                  <span className="text-xs text-slate-400 block text-[10px]">Davies-Bouldin:</span>
                  <strong className="text-sm text-slate-800">{kmeansResult.daviesBouldinIndex.toFixed(3)}</strong>
                </div>
                <div>
                  <span className="text-xs text-slate-400 block text-[10px]">Varianza:</span>
                  <strong className="text-sm text-slate-800">{(kmeansResult.explainedVarianceRatio * 100).toFixed(1)}%</strong>
                </div>
              </div>
            </div>
          </div>

          {/* Warning banner if any cluster has stability < 0.60 */}
          {stabilityResult.warningMessage && (
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 text-xs flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <strong className="block font-semibold mb-0.5">Advertencia Metodológica:</strong>
                <span>{stabilityResult.warningMessage}</span>
              </div>
            </div>
          )}

          {/* Stability per Cluster Bar Chart & Table */}
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-slate-900">
              Estabilidad Individual por Segmento (Índice de Similitud Jaccard)
            </h3>

            <div className="space-y-3">
              {stabilityResult.clusterStabilities.map((item) => {
                const cluster = kmeansResult.clusters[item.clusterId];
                const color = CLUSTER_COLORS[item.clusterId % CLUSTER_COLORS.length];
                const pct = Math.round(item.stability * 100);

                return (
                  <div key={item.clusterId} className="space-y-1">
                    <div className="flex justify-between items-center text-xs">
                      <div className="flex items-center gap-2">
                        <span
                          className="w-3 h-3 rounded-full shrink-0"
                          style={{ backgroundColor: color }}
                        />
                        <span className="font-semibold text-slate-800">
                          {cluster?.name || `Segmento ${item.clusterId + 1}`}
                        </span>
                        <span className="text-slate-400">
                          ({cluster?.size} clientes • {cluster?.percentage.toFixed(1)}%)
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-slate-800">
                          Jaccard = {item.stability.toFixed(3)}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            item.classification === 'Muy Buena'
                              ? 'bg-emerald-100 text-emerald-800'
                              : item.classification === 'Buena'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          {item.classification}
                        </span>
                      </div>
                    </div>

                    <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden relative">
                      {/* Guide thresholds at 0.60, 0.75, 0.85 */}
                      <div className="absolute top-0 bottom-0 left-[60%] border-r border-rose-300 z-10" />
                      <div className="absolute top-0 bottom-0 left-[75%] border-r border-blue-300 z-10" />
                      <div className="absolute top-0 bottom-0 left-[85%] border-r border-emerald-300 z-10" />

                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          item.stability >= 0.85
                            ? 'bg-emerald-500'
                            : item.stability >= 0.75
                            ? 'bg-blue-500'
                            : 'bg-rose-500'
                        }`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="flex justify-between text-[11px] text-slate-400 pt-2 border-t border-slate-100">
              <span>0.00</span>
              <span className="text-rose-600 font-mono">0.60 (Mínimo)</span>
              <span className="text-blue-600 font-mono">0.75 (Bueno)</span>
              <span className="text-emerald-600 font-mono">0.85 (Muy Bueno)</span>
              <span>1.00</span>
            </div>
          </div>

          {/* Methodological Context Note */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-600 space-y-1">
            <div className="font-bold text-slate-800 flex items-center gap-1.5">
              <Info className="w-4 h-4 text-blue-600" />
              <span>Diferencia Metodológica: Calidad de Agrupamiento vs Estabilidad Bootstrap</span>
            </div>
            <p>
              Las métricas geométricas como el <strong>Silhouette Score</strong> evalúan qué tan compactos y separados espacialmente están los clusters en este conjunto de datos puntual. Por el contrario, la <strong>Estabilidad Bootstrap</strong> mide la probabilidad de que los mismos patrones y fronteras de decisión se reproduzcan si se extrae una nueva muestra de clientes del mercado, garantizando que los segmentos encontrados correspondan a estructuras de comportamiento reales y no a artefactos del azar muestral.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
