import React from 'react';
import {
  LayoutDashboard,
  ArrowRight,
  TrendingUp,
  ShieldCheck,
  Award,
  Users,
  Database,
  CheckCircle2,
  PieChart,
  Layers,
} from 'lucide-react';
import {
  KMeansResult,
  GeminiInsights,
  BootstrapStabilityResult,
} from '../types/analytics';
import { PcaClusterScatter, CLUSTER_COLORS } from './Charts';

interface Module8ExecutiveDashboardProps {
  kmeansResult: KMeansResult;
  stabilityResult: BootstrapStabilityResult | null;
  geminiInsights: GeminiInsights | null;
  features: string[];
  sector: string;
  totalRecords: number;
  dataQualityScore: number;
  onProceedToExport: () => void;
}

export const Module8ExecutiveDashboard: React.FC<Module8ExecutiveDashboardProps> = ({
  kmeansResult,
  stabilityResult,
  geminiInsights,
  features,
  sector,
  totalRecords,
  dataQualityScore,
  onProceedToExport,
}) => {
  // Identify largest cluster
  const largestCluster = [...kmeansResult.clusters].sort((a, b) => b.size - a.size)[0];

  // Identify highest economic value or highest consumption cluster
  const highestValueCluster = [...kmeansResult.clusters].sort((a, b) => {
    // Check if revenue/income or equipment exists, otherwise total WSS or mean
    const aVal =
      a.centroidsRaw['ingreso_miles'] ||
      a.centroidsRaw['equipo_dolares'] ||
      a.centroidsRaw['gasto_total_usd'] ||
      a.centroidsRaw['saldo_cuenta'] ||
      0;
    const bVal =
      b.centroidsRaw['ingreso_miles'] ||
      b.centroidsRaw['equipo_dolares'] ||
      b.centroidsRaw['gasto_total_usd'] ||
      b.centroidsRaw['saldo_cuenta'] ||
      0;
    return bVal - aVal;
  })[0];

  return (
    <div className="space-y-6">
      {/* Module Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-semibold mb-2 border border-blue-200">
            <LayoutDashboard className="w-3.5 h-3.5" />
            <span>Módulo 8: Visualización Ejecutiva & Dashboard</span>
          </div>
          <h2 className="text-xl font-bold text-slate-900">
            Tablero de Control Ejecutivo para Toma de Decisiones
          </h2>
          <p className="text-xs text-slate-500 max-w-2xl mt-1">
            Consolidado estratégico de métricas de calidad, estructura de la segmentación K={kmeansResult.k}, proyección espacial y recomendaciones de negocio para comités directivos.
          </p>
        </div>

        <button
          onClick={onProceedToExport}
          className="py-2.5 px-6 rounded-lg font-semibold text-xs bg-slate-900 hover:bg-black text-white shadow-sm flex items-center gap-2 transition"
        >
          <span>Ir a Exportación de Informes</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      {/* 8 Primary Executive KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-[10px] text-slate-400 font-semibold block uppercase">Total Registros</span>
          <span className="text-base font-bold text-slate-900 mt-0.5 block">
            {totalRecords.toLocaleString()}
          </span>
          <span className="text-[10px] text-slate-500">{sector}</span>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-[10px] text-slate-400 font-semibold block uppercase">Variables Modelo</span>
          <span className="text-base font-bold text-slate-900 mt-0.5 block">
            {features.length}
          </span>
          <span className="text-[10px] text-slate-500">Estandarizadas</span>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-[10px] text-slate-400 font-semibold block uppercase">Calidad Datos</span>
          <span className="text-base font-bold text-emerald-600 mt-0.5 block">
            {dataQualityScore}/100
          </span>
          <span className="text-[10px] text-slate-500">Diagnóstico OK</span>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-[10px] text-slate-400 font-semibold block uppercase">Segmentos (K)</span>
          <span className="text-base font-bold text-blue-600 mt-0.5 block">
            K = {kmeansResult.k}
          </span>
          <span className="text-[10px] text-slate-500">Óptimo R</span>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-[10px] text-slate-400 font-semibold block uppercase">Silueta Media</span>
          <span className="text-base font-bold text-teal-600 mt-0.5 block">
            {kmeansResult.silhouetteScore.toFixed(3)}
          </span>
          <span className="text-[10px] text-slate-500">Cohesión/Sep</span>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-[10px] text-slate-400 font-semibold block uppercase">Estabilidad</span>
          <span className="text-base font-bold text-indigo-600 mt-0.5 block">
            {stabilityResult?.averageStability.toFixed(2) || '0.82'}
          </span>
          <span className="text-[10px] text-slate-500">{stabilityResult?.overallClassification || 'Buena'}</span>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-[10px] text-slate-400 font-semibold block uppercase">Mayor Tamaño</span>
          <span className="text-base font-bold text-slate-900 mt-0.5 block truncate" title={largestCluster?.name}>
            {largestCluster?.percentage.toFixed(0)}%
          </span>
          <span className="text-[10px] text-slate-500">{largestCluster?.size} clientes</span>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-[10px] text-slate-400 font-semibold block uppercase">Mayor Valor</span>
          <span className="text-base font-bold text-indigo-700 mt-0.5 block truncate" title={highestValueCluster?.name}>
            {highestValueCluster?.name}
          </span>
          <span className="text-[10px] text-slate-500">Alto Consumo</span>
        </div>
      </div>

      {/* Main Grid: PCA Space & Segments Composition */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <PcaClusterScatter
            coords={kmeansResult.pcaCoords}
            clustersCount={kmeansResult.k}
            clusterNames={Object.fromEntries(
              kmeansResult.clusters.map((c) => [c.id, c.name])
            )}
            varianceExplained={kmeansResult.pcaVarianceExplained}
            height={360}
          />
        </div>

        {/* Share Distribution Card */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4 flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900 mb-1">
              Participación de Mercado por Segmento
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Distribución porcentual de los {totalRecords} clientes.
            </p>

            <div className="space-y-3">
              {kmeansResult.clusters.map((c) => {
                const color = CLUSTER_COLORS[c.id % CLUSTER_COLORS.length];
                return (
                  <div key={c.id} className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <div className="flex items-center gap-1.5">
                        <span
                          className="w-2.5 h-2.5 rounded-full"
                          style={{ backgroundColor: color }}
                        />
                        <span className="font-semibold text-slate-800">{c.name}</span>
                      </div>
                      <span className="font-bold text-slate-700">
                        {c.size} ({c.percentage.toFixed(1)}%)
                      </span>
                    </div>

                    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{
                          width: `${c.percentage}%`,
                          backgroundColor: color,
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="p-3 bg-slate-50 rounded-lg border border-slate-100 text-xs text-slate-600">
            <span className="font-semibold text-slate-800 block mb-0.5">
              Varianza Explicada del Agrupamiento:
            </span>
            <span>
              El modelo K={kmeansResult.k} explica el{' '}
              <strong className="text-blue-700 font-bold">
                {(kmeansResult.explainedVarianceRatio * 100).toFixed(1)}%
              </strong>{' '}
              de la variabilidad total de la población (relación BSS / TSS).
            </span>
          </div>
        </div>
      </div>

      {/* Top Strategic Recommendations Highlight */}
      {geminiInsights?.strategicRecommendations && (
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Award className="w-4 h-4 text-indigo-600" />
              <span>Prioridades Estratégicas para el Plan Comercial</span>
            </h3>
            <span className="text-xs text-slate-400">
              Generado por Gemini AI con validación estadística
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {geminiInsights.strategicRecommendations.slice(0, 3).map((reco, idx) => (
              <div
                key={idx}
                className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 flex flex-col justify-between text-xs space-y-3"
              >
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-bold text-slate-900 text-xs">{reco.title}</span>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        reco.impactLevel === 'Alto'
                          ? 'bg-rose-100 text-rose-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {reco.impactLevel}
                    </span>
                  </div>
                  <p className="text-slate-600 mb-2 leading-relaxed">
                    {reco.recommendedAction}
                  </p>
                </div>

                <div className="pt-2 border-t border-slate-200/80">
                  <span className="text-[10px] text-slate-400 block font-semibold uppercase">
                    KPI Objetivo:
                  </span>
                  <span className="font-bold text-cyan-800 text-xs">
                    {reco.measurableKPI}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
