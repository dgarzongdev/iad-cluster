import React, { useState } from 'react';
import {
  Download,
  FileSpreadsheet,
  FileText,
  CheckCircle2,
  Clock,
  Layers,
  Sparkles,
  ShieldCheck,
  Share2,
} from 'lucide-react';
import {
  KMeansResult,
  GeminiInsights,
  BootstrapStabilityResult,
} from '../types/analytics';
import { exportToExcel, exportToCsv, exportToPdf } from '../utils/export';

interface Module9ExportProps {
  rawRecords: Record<string, any>[];
  kmeansResult: KMeansResult;
  stabilityResult: BootstrapStabilityResult | null;
  geminiInsights: GeminiInsights | null;
  features: string[];
  sector: string;
  datasetName: string;
  standardizationMethod: string;
}

export const Module9Export: React.FC<Module9ExportProps> = ({
  rawRecords,
  kmeansResult,
  stabilityResult,
  geminiInsights,
  features,
  sector,
  datasetName,
  standardizationMethod,
}) => {
  const [downloadSuccess, setDownloadSuccess] = useState<string | null>(null);

  const triggerFeedback = (type: string) => {
    setDownloadSuccess(`Descarga de ${type} generada exitosamente.`);
    setTimeout(() => setDownloadSuccess(null), 4000);
  };

  const handleExportExcel = () => {
    exportToExcel(
      rawRecords,
      kmeansResult,
      features,
      geminiInsights,
      stabilityResult
    );
    triggerFeedback('Libro de Excel (.xlsx)');
  };

  const handleExportCsv = () => {
    exportToCsv(rawRecords, kmeansResult.clusterAssignments);
    triggerFeedback('Archivo CSV de Datos');
  };

  const handleExportPdf = () => {
    exportToPdf(kmeansResult, features, geminiInsights, stabilityResult);
    triggerFeedback('Informe Ejecutivo en PDF');
  };

  return (
    <div className="space-y-6">
      {/* Module Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-semibold mb-2 border border-blue-200">
            <Download className="w-3.5 h-3.5" />
            <span>Módulo 9: Exportación de Resultados & Trazabilidad</span>
          </div>
          <h2 className="text-xl font-bold text-slate-900">
            Descarga de Entregables Analíticos & Registro de Auditoría
          </h2>
          <p className="text-xs text-slate-500 max-w-2xl mt-1">
            Descargue la base de datos enriquecida con las etiquetas de cluster, matrices de centroides, tablas de métricas estadísticas y el informe ejecutivo para comités directivos.
          </p>
        </div>
      </div>

      {downloadSuccess && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs flex items-center gap-2 animate-fadeIn">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{downloadSuccess}</span>
        </div>
      )}

      {/* Export Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Excel */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between hover:border-emerald-300 transition">
          <div>
            <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center mb-4">
              <FileSpreadsheet className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900 mb-1">
              Libro Completo de Excel (.xlsx)
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed mb-4">
              Libro estructurado en 5 hojas de cálculo independientes:
            </p>
            <ul className="text-xs text-slate-600 space-y-1.5 mb-6">
              <li className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                <span>Hoja 1: Datos Asignados con Cluster ID</span>
              </li>
              <li className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                <span>Hoja 2: Centroides en Escala Real</span>
              </li>
              <li className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                <span>Hoja 3: Centroides Estandarizados (Z-Score)</span>
              </li>
              <li className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                <span>Hoja 4: Métricas del Modelo & Parámetros</span>
              </li>
              <li className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                <span>Hoja 5: Recomendaciones Estratégicas</span>
              </li>
            </ul>
          </div>

          <button
            onClick={handleExportExcel}
            className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs rounded-xl shadow-sm shadow-emerald-500/20 flex items-center justify-center gap-2 transition"
          >
            <Download className="w-4 h-4" />
            <span>Descargar Excel (.xlsx)</span>
          </button>
        </div>

        {/* CSV */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between hover:border-blue-300 transition">
          <div>
            <div className="w-12 h-12 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center mb-4">
              <FileText className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900 mb-1">
              Dataset Enriquecido en CSV
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed mb-4">
              Archivo delimitado por comas (.csv) compatible con SQL, Power BI, Tableau, Python y R.
            </p>
            <ul className="text-xs text-slate-600 space-y-1.5 mb-6">
              <li className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                <span>Todas las variables originales</span>
              </li>
              <li className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                <span>Columna adicional <code>cluster_asignado</code></span>
              </li>
              <li className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                <span>Total: {rawRecords.length} filas procesadas</span>
              </li>
            </ul>
          </div>

          <button
            onClick={handleExportCsv}
            className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-xl shadow-sm shadow-blue-500/20 flex items-center justify-center gap-2 transition"
          >
            <Download className="w-4 h-4" />
            <span>Descargar CSV (.csv)</span>
          </button>
        </div>

        {/* PDF Executive Report */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between hover:border-indigo-300 transition">
          <div>
            <div className="w-12 h-12 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center mb-4">
              <Sparkles className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900 mb-1">
              Informe Ejecutivo en PDF
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed mb-4">
              Documento formal listo para presentación ejecutiva y toma de decisiones.
            </p>
            <ul className="text-xs text-slate-600 space-y-1.5 mb-6">
              <li className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                <span>Resumen de métricas de calidad y consistencia</span>
              </li>
              <li className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                <span>Tabla de perfiles y estabilidad Bootstrap</span>
              </li>
              <li className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                <span>Interpretación y recomendaciones de Gemini</span>
              </li>
              <li className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                <span>KPIs medibles para seguimiento gerencial</span>
              </li>
            </ul>
          </div>

          <button
            onClick={handleExportPdf}
            className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs rounded-xl shadow-sm shadow-indigo-500/20 flex items-center justify-center gap-2 transition"
          >
            <Download className="w-4 h-4" />
            <span>Generar y Descargar PDF</span>
          </button>
        </div>
      </div>

      {/* Traceability & Execution Parameters Log */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
          <Clock className="w-4 h-4 text-slate-600" />
          <span>Ficha Técnica y Trazabilidad del Experimento (Reproducibilidad R)</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
            <span className="text-[10px] text-slate-400 font-semibold block uppercase">Dataset</span>
            <span className="font-bold text-slate-800 font-mono">{datasetName}</span>
          </div>

          <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
            <span className="text-[10px] text-slate-400 font-semibold block uppercase">Sector Analizado</span>
            <span className="font-bold text-slate-800">{sector}</span>
          </div>

          <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
            <span className="text-[10px] text-slate-400 font-semibold block uppercase">Observaciones</span>
            <span className="font-bold text-slate-800">{rawRecords.length} filas</span>
          </div>

          <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
            <span className="text-[10px] text-slate-400 font-semibold block uppercase">Variables en Modelo ({features.length})</span>
            <span className="font-mono text-slate-700 truncate block" title={features.join(', ')}>
              {features.join(', ')}
            </span>
          </div>

          <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
            <span className="text-[10px] text-slate-400 font-semibold block uppercase">Estandarización</span>
            <span className="font-bold text-slate-800 uppercase">{standardizationMethod}</span>
          </div>

          <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
            <span className="text-[10px] text-slate-400 font-semibold block uppercase">Parámetros K-Means</span>
            <span className="font-mono text-slate-800">
              K={kmeansResult.k} • nstart={kmeansResult.nstart} • seed={kmeansResult.seed}
            </span>
          </div>

          <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
            <span className="text-[10px] text-slate-400 font-semibold block uppercase">Varianza Explicada</span>
            <span className="font-bold text-blue-700">
              {(kmeansResult.explainedVarianceRatio * 100).toFixed(2)}% (BSS/TSS)
            </span>
          </div>

          <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
            <span className="text-[10px] text-slate-400 font-semibold block uppercase">Silhouette Score</span>
            <span className="font-bold text-teal-700">
              {kmeansResult.silhouetteScore.toFixed(4)}
            </span>
          </div>

          <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
            <span className="text-[10px] text-slate-400 font-semibold block uppercase">Estabilidad Bootstrap</span>
            <span className="font-bold text-indigo-700">
              {stabilityResult?.averageStability.toFixed(3) || 'N/A'} ({stabilityResult?.overallClassification || 'N/A'})
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
