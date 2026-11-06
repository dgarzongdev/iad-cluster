import React, { useState, useRef } from 'react';
import {
  Database,
  UploadCloud,
  FileSpreadsheet,
  Sliders,
  CheckCircle2,
  AlertCircle,
  Eye,
  ArrowRight,
  Sparkles,
  HelpCircle,
  Info,
} from 'lucide-react';
import { ColumnMetadata } from '../types/analytics';
import {
  DATASET_PRESETS,
  DatasetPreset,
  generateCustomSyntheticDataset,
  parseUploadedFile,
} from '../utils/datasets';

interface Module1DataIngestionProps {
  currentData: Record<string, any>[];
  columns: ColumnMetadata[];
  activeSector: string;
  analysisGoal: string;
  datasetName: string;
  onDatasetLoaded: (data: Record<string, any>[], name: string, sector: string) => void;
  onUpdateMetadata: (sector: string, goal: string) => void;
  onProceedToNextStep: () => void;
}

export const Module1DataIngestion: React.FC<Module1DataIngestionProps> = ({
  currentData,
  columns,
  activeSector,
  analysisGoal,
  datasetName,
  onDatasetLoaded,
  onUpdateMetadata,
  onProceedToNextStep,
}) => {
  const [activeTab, setActiveTab] = useState<'presets' | 'synthetic' | 'upload'>('presets');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Synthetic generator state
  const [syntheticConfig, setSyntheticConfig] = useState({
    sector: 'Telecomunicaciones',
    rows: 1000,
    expectedK: 5,
    missingPercent: 0,
    outlierPercent: 2,
    variability: 'media' as 'baja' | 'media' | 'alta',
  });

  // Handle file drop / upload
  const handleFileUpload = async (file: File) => {
    setIsUploading(true);
    setUploadError(null);
    try {
      const parsed = await parseUploadedFile(file);
      onDatasetLoaded(parsed.data, parsed.filename, activeSector);
    } catch (err: any) {
      setUploadError(err.message || 'Error al procesar el archivo tabular.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  const handleGenerateSynthetic = () => {
    const data = generateCustomSyntheticDataset(syntheticConfig);
    onDatasetLoaded(
      data,
      `Dataset_Sintetico_${syntheticConfig.sector}_${syntheticConfig.rows}filas`,
      syntheticConfig.sector
    );
  };

  return (
    <div className="space-y-6">
      {/* Top Banner / Hero */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-6 rounded-2xl shadow-sm border border-slate-800">
        <div className="max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 text-xs font-semibold mb-3 border border-blue-400/30">
            <Database className="w-3.5 h-3.5" />
            <span>Módulo 1: Inicio y Configuración del Análisis</span>
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-white mb-2">
            Carga de Datos & Configuración Metodológica
          </h2>
          <p className="text-slate-300 text-sm leading-relaxed">
            Seleccione el dataset de referencia de <strong>telecomunicaciones (cellsegmentation.xlsx)</strong> para replicar el script de R, importe sus propias bases de datos en Excel o CSV, o configure datasets sintéticos para simulación de modelos de segmentación K-Means.
          </p>
        </div>
      </div>

      {/* Tabs Selector */}
      <div className="bg-white p-2 rounded-xl border border-slate-200 shadow-sm flex flex-wrap gap-2">
        <button
          onClick={() => setActiveTab('presets')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition ${
            activeTab === 'presets'
              ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/20'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          <FileSpreadsheet className="w-4 h-4" />
          <span>Datasets de Demostración & Script R</span>
        </button>
        <button
          onClick={() => setActiveTab('upload')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition ${
            activeTab === 'upload'
              ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/20'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          <UploadCloud className="w-4 h-4" />
          <span>Importar Archivo Propio (Excel / CSV)</span>
        </button>
        <button
          onClick={() => setActiveTab('synthetic')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition ${
            activeTab === 'synthetic'
              ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/20'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          <Sliders className="w-4 h-4" />
          <span>Generador de Datos Sintéticos</span>
        </button>
      </div>

      {/* Tab 1: Presets */}
      {activeTab === 'presets' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {DATASET_PRESETS.map((preset) => (
            <div
              key={preset.id}
              className={`p-5 rounded-xl border transition flex flex-col justify-between ${
                preset.isReference
                  ? 'bg-gradient-to-b from-indigo-50/50 to-white border-indigo-200 shadow-sm ring-1 ring-indigo-500/20'
                  : 'bg-white border-slate-200 hover:border-slate-300'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700">
                    {preset.sector}
                  </span>
                  {preset.isReference && (
                    <span className="text-[11px] font-bold text-indigo-700 bg-indigo-100 px-2.5 py-0.5 rounded-full border border-indigo-200 flex items-center gap-1">
                      <Sparkles className="w-3 h-3" /> Script R
                    </span>
                  )}
                </div>
                <h3 className="text-base font-bold text-slate-900 mb-2">
                  {preset.name}
                </h3>
                <p className="text-xs text-slate-500 leading-relaxed mb-4">
                  {preset.description}
                </p>
                <div className="grid grid-cols-2 gap-2 text-xs bg-slate-50 p-2.5 rounded-lg border border-slate-100 mb-4">
                  <div>
                    <span className="text-slate-400 block text-[10px]">Observaciones:</span>
                    <strong className="text-slate-700">{preset.rowsCount} clientes</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Variables:</span>
                    <strong className="text-slate-700">{preset.columnsCount} columnas</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">K Sugerido:</span>
                    <strong className="text-slate-700">{preset.recommendedK} segmentos</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Tipo:</span>
                    <strong className="text-slate-700">Tabular Real</strong>
                  </div>
                </div>
              </div>

              <button
                onClick={() => onDatasetLoaded(preset.generator(), preset.name, preset.sector)}
                className={`w-full py-2.5 px-4 rounded-lg font-semibold text-xs transition flex items-center justify-center gap-2 ${
                  preset.isReference
                    ? 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm shadow-indigo-500/20'
                    : 'bg-slate-800 hover:bg-slate-900 text-white'
                }`}
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Cargar este Dataset</span>
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Tab 2: Upload */}
      {activeTab === 'upload' && (
        <div className="bg-white p-6 rounded-xl border border-slate-200">
          <div
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            className="border-2 border-dashed border-slate-300 hover:border-blue-500 bg-slate-50/70 hover:bg-blue-50/20 rounded-2xl p-8 text-center transition cursor-pointer"
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls,.csv"
              className="hidden"
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  handleFileUpload(e.target.files[0]);
                }
              }}
            />
            <div className="w-14 h-14 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center mx-auto mb-4">
              <UploadCloud className="w-7 h-7" />
            </div>
            <h4 className="text-base font-bold text-slate-800 mb-1">
              Haga clic o arrastre su archivo aquí
            </h4>
            <p className="text-xs text-slate-500 max-w-md mx-auto mb-3">
              Formatos soportados: Excel (.xlsx, .xls) y valores separados por comas (.csv).
              La primera fila debe contener los nombres de las columnas.
            </p>
            <span className="inline-block px-3 py-1 bg-white border border-slate-200 rounded-md text-xs font-medium text-slate-600 shadow-sm">
              Seleccionar archivo local
            </span>
          </div>

          {isUploading && (
            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg text-blue-700 text-xs flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
              <span>Procesando e inspeccionando estructura del archivo...</span>
            </div>
          )}

          {uploadError && (
            <div className="mt-4 p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{uploadError}</span>
            </div>
          )}
        </div>
      )}

      {/* Tab 3: Synthetic */}
      {activeTab === 'synthetic' && (
        <div className="bg-white p-6 rounded-xl border border-slate-200">
          <h3 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2">
            <Sliders className="w-4 h-4 text-blue-600" />
            <span>Configuración del Dataset Sintético Parametrizable</span>
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Sector Económico:
              </label>
              <select
                value={syntheticConfig.sector}
                onChange={(e) => setSyntheticConfig({ ...syntheticConfig, sector: e.target.value })}
                className="w-full text-xs border border-slate-300 rounded-lg p-2.5 bg-white text-slate-800 focus:ring-2 focus:ring-blue-500"
              >
                <option value="Telecomunicaciones">Telecomunicaciones</option>
                <option value="Retail y Comercio">Retail y Comercio</option>
                <option value="Servicios Financieros">Servicios Financieros</option>
                <option value="Consumo Masivo">Consumo Masivo</option>
                <option value="Marketing y B2B">Marketing y Gestión Comercial</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Cantidad de Registros ({syntheticConfig.rows}):
              </label>
              <input
                type="range"
                min="100"
                max="3000"
                step="50"
                value={syntheticConfig.rows}
                onChange={(e) =>
                  setSyntheticConfig({ ...syntheticConfig, rows: Number(e.target.value) })
                }
                className="w-full accent-blue-600"
              />
              <span className="text-[11px] text-slate-400">Entre 100 y 3.000 observaciones</span>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Segmentos Esperados ({syntheticConfig.expectedK}):
              </label>
              <input
                type="range"
                min="2"
                max="8"
                step="1"
                value={syntheticConfig.expectedK}
                onChange={(e) =>
                  setSyntheticConfig({ ...syntheticConfig, expectedK: Number(e.target.value) })
                }
                className="w-full accent-blue-600"
              />
              <span className="text-[11px] text-slate-400">K latente entre 2 y 8 grupos</span>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Variabilidad / Dispersión:
              </label>
              <select
                value={syntheticConfig.variability}
                onChange={(e) =>
                  setSyntheticConfig({
                    ...syntheticConfig,
                    variability: e.target.value as 'baja' | 'media' | 'alta',
                  })
                }
                className="w-full text-xs border border-slate-300 rounded-lg p-2.5 bg-white text-slate-800"
              >
                <option value="baja">Baja (Clusters muy compactos y separados)</option>
                <option value="media">Media (Distribución realista de mercado)</option>
                <option value="alta">Alta (Fronteras solapadas / mayor varianza)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Porcentaje de Datos Faltantes ({syntheticConfig.missingPercent}%):
              </label>
              <input
                type="range"
                min="0"
                max="20"
                step="2"
                value={syntheticConfig.missingPercent}
                onChange={(e) =>
                  setSyntheticConfig({ ...syntheticConfig, missingPercent: Number(e.target.value) })
                }
                className="w-full accent-blue-600"
              />
              <span className="text-[11px] text-slate-400">Simula valores nulos (0% a 20%)</span>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Presencia de Valores Atípicos ({syntheticConfig.outlierPercent}%):
              </label>
              <input
                type="range"
                min="0"
                max="10"
                step="1"
                value={syntheticConfig.outlierPercent}
                onChange={(e) =>
                  setSyntheticConfig({ ...syntheticConfig, outlierPercent: Number(e.target.value) })
                }
                className="w-full accent-blue-600"
              />
              <span className="text-[11px] text-slate-400">Outliers inducidos (0% a 10%)</span>
            </div>
          </div>

          <button
            onClick={handleGenerateSynthetic}
            className="py-2.5 px-6 rounded-lg font-semibold text-xs bg-blue-600 hover:bg-blue-700 text-white shadow-sm flex items-center gap-2"
          >
            <Sparkles className="w-4 h-4" />
            <span>Generar y Cargar Dataset Sintético</span>
          </button>
        </div>
      )}

      {/* Dataset Metadata & Structural Inspection */}
      {currentData.length > 0 && (
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-200">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                  Dataset Activo
                </span>
                <h3 className="text-lg font-bold text-slate-900">{datasetName}</h3>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Estructura inspeccionada: <strong>{currentData.length.toLocaleString()}</strong> observaciones y <strong>{columns.length}</strong> variables detectadas automáticamente.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={onProceedToNextStep}
                className="py-2.5 px-5 rounded-lg font-semibold text-xs bg-blue-600 hover:bg-blue-700 text-white shadow-sm flex items-center gap-2 transition"
              >
                <span>Continuar a Exploración (EDA)</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Sector & Analysis Goal Selector */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Sector Económico del Negocio:
              </label>
              <select
                value={activeSector}
                onChange={(e) => onUpdateMetadata(e.target.value, analysisGoal)}
                className="w-full text-xs border border-slate-300 rounded-lg p-2.5 bg-white text-slate-800"
              >
                <option value="Telecomunicaciones">Telecomunicaciones (Telefonía, Fibra e Internet)</option>
                <option value="Retail y Comercio">Retail y Comercio Electrónico</option>
                <option value="Servicios Financieros">Servicios Financieros y Banca</option>
                <option value="Consumo Masivo">Consumo Masivo (CPG / FMCG)</option>
                <option value="Marketing y B2B">Marketing y Gestión Comercial B2B</option>
                <option value="General">General / Otros Sectores con Datos Tabulares</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Objetivo Estratégico del Análisis:
              </label>
              <input
                type="text"
                value={analysisGoal}
                onChange={(e) => onUpdateMetadata(activeSector, e.target.value)}
                placeholder="Ej: Segmentación de clientes para diseño de planes convergentes y fidelización"
                className="w-full text-xs border border-slate-300 rounded-lg p-2.5 bg-white text-slate-800"
              />
            </div>
          </div>

          {/* Auto-detected Variables Table */}
          <div>
            <h4 className="text-sm font-bold text-slate-800 mb-2 flex items-center gap-2">
              <Info className="w-4 h-4 text-blue-600" />
              <span>Variables Detectadas y Tipología Automática</span>
            </h4>
            <div className="overflow-x-auto border border-slate-200 rounded-lg">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="p-2.5">Variable</th>
                    <th className="p-2.5">Tipo Inferido</th>
                    <th className="p-2.5">Rol Recomendado</th>
                    <th className="p-2.5">Valores Únicos</th>
                    <th className="p-2.5">Faltantes (%)</th>
                    <th className="p-2.5">Muestra de Valores</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-600">
                  {columns.map((col) => (
                    <tr key={col.name} className="hover:bg-slate-50">
                      <td className="p-2.5 font-semibold text-slate-900 font-mono">
                        {col.name}
                      </td>
                      <td className="p-2.5">
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-[11px] font-medium ${
                            col.type === 'continuous'
                              ? 'bg-blue-100 text-blue-800'
                              : col.type === 'discrete'
                              ? 'bg-cyan-100 text-cyan-800'
                              : col.type === 'identifier'
                              ? 'bg-slate-200 text-slate-700'
                              : 'bg-emerald-100 text-emerald-800'
                          }`}
                        >
                          {col.type === 'continuous'
                            ? 'Numérica Continua'
                            : col.type === 'discrete'
                            ? 'Numérica Discreta'
                            : col.type === 'identifier'
                            ? 'Identificador / ID'
                            : 'Categórica'}
                        </span>
                      </td>
                      <td className="p-2.5">
                        <span
                          className={`font-medium ${
                            col.role === 'feature'
                              ? 'text-indigo-600'
                              : col.role === 'identifier'
                              ? 'text-slate-400'
                              : 'text-amber-600'
                          }`}
                        >
                          {col.role === 'feature'
                            ? 'Feature (Clustering)'
                            : col.role === 'identifier'
                            ? 'Excluir (ID)'
                            : 'Metadato Demográfico'}
                        </span>
                      </td>
                      <td className="p-2.5">{col.uniqueCount}</td>
                      <td className="p-2.5">
                        {col.missingPercentage > 0 ? (
                          <span className="text-amber-600 font-medium">
                            {col.missingPercentage.toFixed(1)}% ({col.missingCount})
                          </span>
                        ) : (
                          <span className="text-slate-400">0%</span>
                        )}
                      </td>
                      <td className="p-2.5 font-mono text-[11px] text-slate-500 max-w-[200px] truncate">
                        {col.sampleValues.join(', ')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* First Rows Preview */}
          <div>
            <h4 className="text-sm font-bold text-slate-800 mb-2 flex items-center gap-2">
              <Eye className="w-4 h-4 text-blue-600" />
              <span>Vista Previa de los Primeros Registros</span>
            </h4>
            <div className="overflow-x-auto border border-slate-200 rounded-lg max-h-56">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-100 text-slate-700 font-semibold sticky top-0 border-b border-slate-200">
                  <tr>
                    <th className="p-2 text-slate-400">#</th>
                    {columns.map((c) => (
                      <th key={c.name} className="p-2 font-mono whitespace-nowrap">
                        {c.name}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-600">
                  {currentData.slice(0, 8).map((row, rIdx) => (
                    <tr key={rIdx} className="hover:bg-slate-50">
                      <td className="p-2 text-slate-400 font-mono">{rIdx + 1}</td>
                      {columns.map((c) => (
                        <td key={c.name} className="p-2 whitespace-nowrap font-mono text-[11px]">
                          {row[c.name] !== null && row[c.name] !== undefined
                            ? String(row[c.name])
                            : <span className="text-slate-300 italic">null</span>}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
