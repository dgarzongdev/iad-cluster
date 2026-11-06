import React from 'react';
import {
  Sparkles,
  Database,
  BarChart3,
  Cpu,
  Layers,
  FileSpreadsheet,
  CheckCircle2,
  RefreshCw,
  FolderSync,
  Key,
} from 'lucide-react';

interface NavbarProps {
  currentDatasetName: string;
  rowCount: number;
  sector: string;
  hasGeminiKey: boolean;
  onLoadReferencePreset: () => void;
  onResetAll: () => void;
  onOpenApiKeyModal: () => void;
  isProcessing?: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentDatasetName,
  rowCount,
  sector,
  hasGeminiKey,
  onLoadReferencePreset,
  onResetAll,
  onOpenApiKeyModal,
  isProcessing = false,
}) => {
  return (
    <header className="bg-slate-900 border-b border-slate-800 text-white sticky top-0 z-40 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo & Name */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-cyan-400 flex items-center justify-center shadow-lg shadow-blue-500/20">
              <Layers className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-lg tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-300 bg-clip-text text-transparent">
                  ClusterIQ
                </span>
                <span className="text-[10px] font-semibold uppercase tracking-wider bg-blue-500/20 text-blue-300 border border-blue-400/30 px-2 py-0.5 rounded-full">
                  Analytics & Marketing Studio
                </span>
              </div>
              <p className="text-xs text-slate-400 hidden sm:block">
                Segmentación K-Means, Validación Estadística e Insights de Negocio con Gemini
              </p>
            </div>
          </div>

          {/* Quick Context & Actions */}
          <div className="flex items-center gap-3">
            {/* Active Dataset Pill */}
            <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800/80 border border-slate-700/60 text-xs">
              <Database className="w-3.5 h-3.5 text-cyan-400" />
              <div className="flex flex-col text-left">
                <span className="font-medium text-slate-200 truncate max-w-[170px]" title={currentDatasetName}>
                  {currentDatasetName}
                </span>
                <span className="text-[10px] text-slate-400">
                  {rowCount.toLocaleString()} reg. • {sector}
                </span>
              </div>
            </div>

            {/* Quick 1-Click R Benchmark Action */}
            <button
              onClick={onLoadReferencePreset}
              disabled={isProcessing}
              title="Cargar dataset cellsegmentation.xlsx y preparar el flujo idéntico a 02. K_means.R"
              className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-200 border border-indigo-500/40 transition shadow-sm"
            >
              <FolderSync className="w-3.5 h-3.5 text-indigo-400" />
              <span>Cargar Benchmark Script R</span>
            </button>

            {/* Gemini Token Config Button */}
            <button
              onClick={onOpenApiKeyModal}
              title="Configurar o cambiar token de Google AI Studio en la interfaz"
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-medium border transition cursor-pointer ${
                hasGeminiKey
                  ? 'bg-emerald-950/70 text-emerald-300 border-emerald-500/40 hover:bg-emerald-900/60'
                  : 'bg-amber-950/70 text-amber-300 border-amber-500/40 hover:bg-amber-900/60'
              }`}
            >
              <Key className="w-3.5 h-3.5 text-cyan-300" />
              <span className="hidden sm:inline">
                {hasGeminiKey ? 'Token IA Configurado' : 'Cargar Token IA'}
              </span>
              <span className="sm:hidden">Token IA</span>
            </button>

            {/* Reset / Reload Button */}
            <button
              onClick={onResetAll}
              title="Reiniciar análisis con un nuevo dataset"
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
