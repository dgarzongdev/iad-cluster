import React, { useState, useMemo } from 'react';
import {
  BarChart3,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  HelpCircle,
  ArrowRight,
  Filter,
  Grid,
  ShieldAlert,
  ArrowDownUp,
} from 'lucide-react';
import { ColumnMetadata, NumericStats } from '../types/analytics';
import {
  calculateNumericStats,
  calculateCategoricalStats,
  computeCorrelationMatrix,
  diagnoseDataQuality,
} from '../utils/statistics';
import { HistogramChart, CorrelationHeatmap } from './Charts';

interface Module2EDAProps {
  data: Record<string, any>[];
  columns: ColumnMetadata[];
  onProceedToPrep: () => void;
}

export const Module2EDA: React.FC<Module2EDAProps> = ({
  data,
  columns,
  onProceedToPrep,
}) => {
  const numericCols = useMemo(() => columns.filter((c) => c.isNumeric), [columns]);
  const categoricalCols = useMemo(() => columns.filter((c) => !c.isNumeric && c.role !== 'identifier'), [columns]);

  const [selectedNumCol, setSelectedNumCol] = useState<string>(
    numericCols[0]?.name || ''
  );
  const [bivariateX, setBivariateX] = useState<string>(numericCols[0]?.name || '');
  const [bivariateY, setBivariateY] = useState<string>(numericCols[1]?.name || numericCols[0]?.name || '');
  const [activeSubTab, setActiveSubTab] = useState<'stats' | 'visuals' | 'correlation' | 'quality'>('stats');

  // Compute stats for all numeric columns
  const numericStatsMap = useMemo(() => {
    const map: Record<string, NumericStats> = {};
    numericCols.forEach((col) => {
      const values = data.map((r) => r[col.name]);
      map[col.name] = calculateNumericStats(values);
    });
    return map;
  }, [data, numericCols]);

  // Compute correlation matrix
  const correlationData = useMemo(() => {
    const colNames = numericCols.slice(0, 10).map((c) => c.name);
    return computeCorrelationMatrix(data, colNames);
  }, [data, numericCols]);

  // Compute quality diagnosis
  const quality = useMemo(() => {
    return diagnoseDataQuality(data, columns);
  }, [data, columns]);

  const currentStats = numericStatsMap[selectedNumCol];
  const currentValues = useMemo(() => {
    return data.map((r) => Number(r[selectedNumCol]) || 0);
  }, [data, selectedNumCol]);

  return (
    <div className="space-y-6">
      {/* Module Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-semibold mb-2 border border-blue-200">
            <BarChart3 className="w-3.5 h-3.5" />
            <span>Módulo 2: Análisis Exploratorio de Datos (EDA)</span>
          </div>
          <h2 className="text-xl font-bold text-slate-900">
            Diagnóstico Estadístico, Calidad & Visualización
          </h2>
          <p className="text-xs text-slate-500 max-w-2xl mt-1">
            Inspeccione la distribución empírica, asimetría, dispersión, valores atípicos y correlaciones lineales entre variables antes de proceder con el preprocesamiento de datos.
          </p>
        </div>

        <button
          onClick={onProceedToPrep}
          className="py-2.5 px-5 rounded-lg font-semibold text-xs bg-blue-600 hover:bg-blue-700 text-white shadow-sm flex items-center gap-2 transition"
        >
          <span>Continuar a Preparación de Datos</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      {/* Quick Quality Score Card */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div
            className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold text-lg text-white ${
              quality.overallScore >= 80
                ? 'bg-emerald-600 shadow-emerald-500/20'
                : quality.overallScore >= 60
                ? 'bg-amber-500 shadow-amber-500/20'
                : 'bg-rose-600 shadow-rose-500/20'
            } shadow-lg`}
          >
            {quality.overallScore}
          </div>
          <div>
            <span className="text-xs text-slate-400 block font-medium">Índice de Calidad</span>
            <span className="text-sm font-bold text-slate-800">
              {quality.overallScore >= 80
                ? 'Excelente'
                : quality.overallScore >= 60
                ? 'Aceptable'
                : 'Requiere Limpieza'}
            </span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-xs text-slate-400 block font-medium">Valores Faltantes</span>
          <span className="text-base font-bold text-slate-800">
            {quality.totalMissingCells.toLocaleString()}{' '}
            <span className="text-xs text-slate-500 font-normal">
              ({quality.missingCellsPercent.toFixed(1)}%)
            </span>
          </span>
          <span className="text-[11px] text-slate-400 block mt-0.5">En toda la matriz de datos</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-xs text-slate-400 block font-medium">Registros Duplicados</span>
          <span className="text-base font-bold text-slate-800">
            {quality.duplicateRowsCount}{' '}
            <span className="text-xs text-slate-500 font-normal">
              ({quality.duplicateRowsPercent.toFixed(1)}%)
            </span>
          </span>
          <span className="text-[11px] text-slate-400 block mt-0.5">Filas redundantes</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-xs text-slate-400 block font-medium">Variables Asimétricas</span>
          <span className="text-base font-bold text-amber-600">
            {
              Object.values(numericStatsMap).filter((s) => Math.abs(s.skewness) > 1.5).length
            }{' '}
            <span className="text-xs text-slate-500 font-normal">variables</span>
          </span>
          <span className="text-[11px] text-slate-400 block mt-0.5">Requieren log(1+x)</span>
        </div>
      </div>

      {/* Sub Tabs */}
      <div className="flex border-b border-slate-200 space-x-4 text-xs font-semibold">
        <button
          onClick={() => setActiveSubTab('stats')}
          className={`pb-2.5 transition border-b-2 ${
            activeSubTab === 'stats'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          1. Tabla de Estadística Descriptiva Completa
        </button>
        <button
          onClick={() => setActiveSubTab('visuals')}
          className={`pb-2.5 transition border-b-2 ${
            activeSubTab === 'visuals'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          2. Distribución y Visualizaciones Univariadas
        </button>
        <button
          onClick={() => setActiveSubTab('correlation')}
          className={`pb-2.5 transition border-b-2 ${
            activeSubTab === 'correlation'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          3. Matriz de Correlación de Pearson
        </button>
        <button
          onClick={() => setActiveSubTab('quality')}
          className={`pb-2.5 transition border-b-2 ${
            activeSubTab === 'quality'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          4. Diagnóstico Detallado de Calidad & Recomendaciones
        </button>
      </div>

      {/* SubTab 1: Descriptive Stats Table */}
      {activeSubTab === 'stats' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Estadística Descriptiva Paramétrica y No Paramétrica
            </h3>
            <span className="text-xs text-slate-400">
              Mostrando {numericCols.length} variables numéricas
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-100 text-slate-600 font-semibold border-b border-slate-200">
                <tr>
                  <th className="p-3">Variable</th>
                  <th className="p-3">N Válidos</th>
                  <th className="p-3">Media</th>
                  <th className="p-3">Desv. Est.</th>
                  <th className="p-3">Mediana</th>
                  <th className="p-3">Mín - Máx</th>
                  <th className="p-3">IQR (Q3-Q1)</th>
                  <th className="p-3">CV (Disp.)</th>
                  <th className="p-3">Asimetría</th>
                  <th className="p-3">Curtosis</th>
                  <th className="p-3">Atípicos (IQR)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {numericCols.map((col) => {
                  const s = numericStatsMap[col.name];
                  if (!s) return null;
                  const isHighSkew = Math.abs(s.skewness) > 1.5;

                  return (
                    <tr key={col.name} className="hover:bg-slate-50">
                      <td className="p-3 font-mono font-semibold text-slate-900">
                        {col.name}
                      </td>
                      <td className="p-3">{s.count}</td>
                      <td className="p-3 font-semibold">{s.mean.toFixed(2)}</td>
                      <td className="p-3">{s.stdDev.toFixed(2)}</td>
                      <td className="p-3">{s.median.toFixed(2)}</td>
                      <td className="p-3 text-slate-500">
                        [{s.min.toFixed(1)}, {s.max.toFixed(1)}]
                      </td>
                      <td className="p-3">{s.iqr.toFixed(2)}</td>
                      <td className="p-3">{s.cv.toFixed(2)}</td>
                      <td className={`p-3 font-mono ${isHighSkew ? 'text-amber-600 font-bold' : ''}`}>
                        {s.skewness.toFixed(2)}
                      </td>
                      <td className="p-3 font-mono">{s.kurtosis.toFixed(2)}</td>
                      <td className="p-3">
                        {s.outliersIqrCount > 0 ? (
                          <span className="text-rose-600 font-medium">
                            {s.outliersIqrCount} ({((s.outliersIqrCount / s.count) * 100).toFixed(1)}%)
                          </span>
                        ) : (
                          <span className="text-slate-400">0</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SubTab 2: Visualizations */}
      {activeSubTab === 'visuals' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Column selector list */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3">
              Seleccionar Variable Numérica
            </h4>
            <div className="space-y-1 max-h-80 overflow-y-auto">
              {numericCols.map((col) => {
                const s = numericStatsMap[col.name];
                const isSelected = selectedNumCol === col.name;
                return (
                  <button
                    key={col.name}
                    onClick={() => setSelectedNumCol(col.name)}
                    className={`w-full text-left p-2.5 rounded-lg text-xs transition flex justify-between items-center ${
                      isSelected
                        ? 'bg-blue-600 text-white font-semibold shadow-sm'
                        : 'hover:bg-slate-100 text-slate-700'
                    }`}
                  >
                    <span className="font-mono">{col.name}</span>
                    <span className="text-[11px] opacity-75">
                      μ={s?.mean.toFixed(1)} | Asim={s?.skewness.toFixed(1)}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Histogram & Boxplot Inspector */}
          <div className="lg:col-span-2 bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900 font-mono">
                  {selectedNumCol}
                </h3>
                <span className="text-xs text-slate-500">
                  Media: {currentStats?.mean.toFixed(2)} | Mediana: {currentStats?.median.toFixed(2)} | Desv: {currentStats?.stdDev.toFixed(2)}
                </span>
              </div>
              {currentStats && Math.abs(currentStats.skewness) > 1.5 && (
                <span className="text-xs font-medium px-2.5 py-1 bg-amber-50 text-amber-800 border border-amber-200 rounded-lg">
                  Asimetría marcada ({currentStats.skewness.toFixed(2)})
                </span>
              )}
            </div>

            <HistogramChart
              values={currentValues}
              label={`Histograma empírico de frecuencias: ${selectedNumCol}`}
              height={220}
            />

            {/* Bivariate Scatter Plot between any 2 features */}
            <div className="pt-4 border-t border-slate-200">
              <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Diagrama de Dispersión Bivariado (Scatter Plot)
                </h4>
                <div className="flex items-center gap-2 text-xs">
                  <select
                    value={bivariateX}
                    onChange={(e) => setBivariateX(e.target.value)}
                    className="border border-slate-300 rounded px-2 py-1 text-xs bg-white text-slate-800"
                  >
                    {numericCols.map((c) => (
                      <option key={c.name} value={c.name}>
                        X: {c.name}
                      </option>
                    ))}
                  </select>
                  <select
                    value={bivariateY}
                    onChange={(e) => setBivariateY(e.target.value)}
                    className="border border-slate-300 rounded px-2 py-1 text-xs bg-white text-slate-800"
                  >
                    {numericCols.map((c) => (
                      <option key={c.name} value={c.name}>
                        Y: {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Simple Scatter SVG */}
              <div className="bg-slate-50 p-2 rounded-lg border border-slate-200">
                <svg viewBox="0 0 500 200" className="w-full h-auto overflow-visible select-none">
                  {data.slice(0, 300).map((row, idx) => {
                    const xVal = Number(row[bivariateX]) || 0;
                    const yVal = Number(row[bivariateY]) || 0;
                    const sX = numericStatsMap[bivariateX];
                    const sY = numericStatsMap[bivariateY];
                    if (!sX || !sY) return null;

                    const rangeX = sX.max - sX.min || 1;
                    const rangeY = sY.max - sY.min || 1;
                    const cx = 40 + ((xVal - sX.min) / rangeX) * 420;
                    const cy = 170 - ((yVal - sY.min) / rangeY) * 140;

                    return (
                      <circle
                        key={idx}
                        cx={cx}
                        cy={cy}
                        r={2.5}
                        fill="#3b82f6"
                        fillOpacity={0.6}
                      />
                    );
                  })}
                  <text x={250} y={192} fontSize="9" fill="#64748b" textAnchor="middle">
                    Eje X: {bivariateX}
                  </text>
                  <text x={16} y={100} fontSize="9" fill="#64748b" textAnchor="middle" transform="rotate(-90, 16, 100)">
                    Eje Y: {bivariateY}
                  </text>
                </svg>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SubTab 3: Correlation */}
      {activeSubTab === 'correlation' && (
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Matriz de Correlación Lineal de Pearson (r)
              </h3>
              <p className="text-xs text-slate-500">
                Colores rojos indican correlación negativa inversa (-1), azules correlación positiva (+1). Valores cercanos a 0 indican independencia lineal.
              </p>
            </div>
          </div>

          <CorrelationHeatmap
            columns={correlationData.columns}
            matrix={correlationData.matrix}
          />
        </div>
      )}

      {/* SubTab 4: Quality & Recommendations */}
      {activeSubTab === 'quality' && (
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-6">
          <div className="flex items-center gap-3">
            <ShieldAlert className="w-6 h-6 text-indigo-600" />
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Diagnóstico de Integridad y Calidad de Datos
              </h3>
              <p className="text-xs text-slate-500">
                Evaluación sistemática de reglas de validación previas al modelamiento de clustering.
              </p>
            </div>
          </div>

          {/* Issues List */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Alertas Detectadas ({quality.issues.length})
            </h4>

            {quality.issues.length === 0 ? (
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-800 text-xs flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-600" />
                <span>No se detectaron problemas críticos en el dataset analizado.</span>
              </div>
            ) : (
              quality.issues.map((issue, idx) => (
                <div
                  key={idx}
                  className={`p-3.5 rounded-lg border text-xs flex items-start gap-3 ${
                    issue.severity === 'high'
                      ? 'bg-rose-50 border-rose-200 text-rose-900'
                      : 'bg-amber-50 border-amber-200 text-amber-900'
                  }`}
                >
                  <AlertTriangle
                    className={`w-4 h-4 mt-0.5 shrink-0 ${
                      issue.severity === 'high' ? 'text-rose-600' : 'text-amber-600'
                    }`}
                  />
                  <div>
                    <div className="font-semibold">{issue.description}</div>
                    <div className="text-[11px] opacity-90 mt-0.5">
                      <strong>Acción sugerida:</strong> {issue.recommendation}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Recommendations checklist */}
          <div className="pt-4 border-t border-slate-200">
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Recomendaciones Metodológicas para la Etapa de Preparación
            </h4>
            <ul className="space-y-2">
              {quality.recommendations.map((rec, i) => (
                <li key={i} className="flex items-start gap-2 text-xs text-slate-600">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-600 mt-1.5 shrink-0" />
                  <span>{rec}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};
