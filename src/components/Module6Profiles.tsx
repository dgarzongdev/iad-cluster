import React, { useState } from 'react';
import {
  Users,
  ArrowRight,
  Sparkles,
  TrendingUp,
  TrendingDown,
  Search,
  Filter,
  CheckCircle,
  Eye,
  Tag,
} from 'lucide-react';
import { KMeansResult, ColumnMetadata } from '../types/analytics';
import { CLUSTER_COLORS, CLUSTER_BG_COLORS } from './Charts';

interface Module6ProfilesProps {
  kmeansResult: KMeansResult;
  rawRecords: Record<string, any>[];
  columns: ColumnMetadata[];
  features: string[];
  sector: string;
  onProceedToGemini: () => void;
}

export const Module6Profiles: React.FC<Module6ProfilesProps> = ({
  kmeansResult,
  rawRecords,
  columns,
  features,
  sector,
  onProceedToGemini,
}) => {
  const [selectedClusterId, setSelectedClusterId] = useState<number>(0);
  const [searchFilter, setSearchFilter] = useState<string>('');

  const activeCluster = kmeansResult.clusters[selectedClusterId] || kmeansResult.clusters[0];
  const activeColor = CLUSTER_COLORS[selectedClusterId % CLUSTER_COLORS.length];

  // Filter observations assigned to the selected cluster
  const clusterObservations = rawRecords.filter(
    (_, idx) => kmeansResult.clusterAssignments[idx] === selectedClusterId
  );

  const filteredObservations = clusterObservations.filter((row) => {
    if (!searchFilter) return true;
    return Object.values(row).some((val) =>
      String(val).toLowerCase().includes(searchFilter.toLowerCase())
    );
  });

  return (
    <div className="space-y-6">
      {/* Module Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-semibold mb-2 border border-blue-200">
            <Users className="w-3.5 h-3.5" />
            <span>Módulo 6: Análisis de Perfiles y Caracterización de Segmentos</span>
          </div>
          <h2 className="text-xl font-bold text-slate-900">
            Perfilamiento Estadístico, Arquetipos y Diferenciación
          </h2>
          <p className="text-xs text-slate-500 max-w-2xl mt-1">
            Inspección de las características distintivas que diferencian cada grupo frente a la media poblacional, arquetipos de clientes y consulta de observaciones individuales.
          </p>
        </div>

        <button
          onClick={onProceedToGemini}
          className="py-2.5 px-6 rounded-lg font-semibold text-xs bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm flex items-center gap-2 transition"
        >
          <Sparkles className="w-4 h-4 text-cyan-300" />
          <span>Generar Insights de Marketing con Gemini</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      {/* Cluster Navigation Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {kmeansResult.clusters.map((c) => {
          const isSelected = selectedClusterId === c.id;
          const color = CLUSTER_COLORS[c.id % CLUSTER_COLORS.length];

          return (
            <button
              key={c.id}
              onClick={() => setSelectedClusterId(c.id)}
              className={`p-4 rounded-xl border text-left transition relative ${
                isSelected
                  ? 'bg-white border-blue-600 shadow-md ring-2 ring-blue-500/20'
                  : 'bg-white border-slate-200 hover:border-slate-300 shadow-xs'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span
                  className="w-3.5 h-3.5 rounded-full"
                  style={{ backgroundColor: color }}
                />
                <span className="text-xs font-bold text-slate-800">
                  {c.percentage.toFixed(1)}%
                </span>
              </div>
              <h4 className="text-sm font-bold text-slate-900 truncate">
                {c.name}
              </h4>
              <p className="text-xs text-slate-500 mt-0.5">
                {c.size} observaciones
              </p>
            </button>
          );
        })}
      </div>

      {/* Selected Segment Deep Dive */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Key Differentiating Features */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <span
                className="w-3.5 h-3.5 rounded-full"
                style={{ backgroundColor: activeColor }}
              />
              <h3 className="text-sm font-bold text-slate-900">
                Variables Más Diferenciadoras
              </h3>
            </div>
            <span className="text-[11px] font-semibold text-slate-500">
              Desviación Z-Score
            </span>
          </div>

          <p className="text-xs text-slate-500">
            Variables con mayor distancia absoluta respecto a la media de la población global:
          </p>

          <div className="space-y-3">
            {activeCluster.keyDifferentiators.slice(0, 6).map((diff, idx) => {
              const isHigher = diff.direction === 'higher';
              const deviationPct =
                diff.globalMean > 0
                  ? ((diff.clusterMean - diff.globalMean) / diff.globalMean) * 100
                  : 0;

              return (
                <div key={idx} className="p-3 bg-slate-50 rounded-lg border border-slate-100 text-xs">
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-mono font-bold text-slate-800">
                      {diff.feature}
                    </span>
                    <span
                      className={`inline-flex items-center gap-1 font-bold ${
                        isHigher ? 'text-emerald-700' : 'text-rose-700'
                      }`}
                    >
                      {isHigher ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                      <span>{Math.abs(diff.zScoreDiff).toFixed(2)} σ</span>
                    </span>
                  </div>

                  <div className="flex justify-between text-[11px] text-slate-500 mt-1">
                    <span>
                      Promedio grupo: <strong>{diff.clusterMean.toFixed(1)}</strong>
                    </span>
                    <span>
                      Media global: {diff.globalMean.toFixed(1)} ({deviationPct >= 0 ? '+' : ''}{deviationPct.toFixed(0)}%)
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right 2 Columns: Full Variables Table & Observations Browser */}
        <div className="lg:col-span-2 bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Observaciones Asignadas a {activeCluster.name} ({activeCluster.size} clientes)
              </h3>
              <p className="text-xs text-slate-500">
                Consulte los registros individuales clasificados en este segmento.
              </p>
            </div>

            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
              <input
                type="text"
                placeholder="Buscar en este segmento..."
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                className="pl-8 pr-3 py-1.5 border border-slate-300 rounded-lg text-xs bg-white text-slate-800 w-48 focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Observations Table */}
          <div className="overflow-x-auto border border-slate-200 rounded-lg max-h-72">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-100 text-slate-700 font-semibold sticky top-0 border-b border-slate-200">
                <tr>
                  <th className="p-2.5 text-slate-400">#</th>
                  {columns.slice(0, 8).map((c) => (
                    <th key={c.name} className="p-2.5 font-mono whitespace-nowrap">
                      {c.name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filteredObservations.slice(0, 15).map((row, rIdx) => (
                  <tr key={rIdx} className="hover:bg-slate-50">
                    <td className="p-2.5 text-slate-400 font-mono">{rIdx + 1}</td>
                    {columns.slice(0, 8).map((c) => (
                      <td key={c.name} className="p-2.5 font-mono text-[11px] whitespace-nowrap">
                        {row[c.name] !== null && row[c.name] !== undefined
                          ? String(row[c.name])
                          : '-'}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="text-[11px] text-slate-400 text-right">
            Mostrando {Math.min(15, filteredObservations.length)} de {filteredObservations.length} observaciones en este cluster.
          </div>
        </div>
      </div>
    </div>
  );
};
