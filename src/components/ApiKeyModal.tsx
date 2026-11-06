import React, { useState } from 'react';
import {
  Key,
  ShieldCheck,
  AlertCircle,
  CheckCircle2,
  X,
  Eye,
  EyeOff,
  Sparkles,
  RefreshCw,
  Cpu,
} from 'lucide-react';

interface ApiKeyModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentApiKey: string;
  onSaveApiKey: (newKey: string) => void;
}

export const ApiKeyModal: React.FC<ApiKeyModalProps> = ({
  isOpen,
  onClose,
  currentApiKey,
  onSaveApiKey,
}) => {
  const [inputKey, setInputKey] = useState<string>(currentApiKey || '');
  const [showKey, setShowKey] = useState<boolean>(false);
  const [isValidating, setIsValidating] = useState<boolean>(false);
  const [testResult, setTestResult] = useState<{
    success: boolean;
    message: string;
  } | null>(null);

  if (!isOpen) return null;

  const handleTestToken = async () => {
    if (!inputKey.trim()) {
      setTestResult({
        success: false,
        message: 'Por favor ingrese un token de Google AI Studio antes de probar.',
      });
      return;
    }

    setIsValidating(true);
    setTestResult(null);

    try {
      const response = await fetch('/api/gemini/test-token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-gemini-api-key': inputKey.trim(),
        },
        body: JSON.stringify({ apiKey: inputKey.trim() }),
      });

      const data = await response.json();
      if (response.ok && data.success) {
        setTestResult({
          success: true,
          message:
            data.message ||
            'Conexión exitosa con Google AI Studio (Gemini 3.1 Flash Lite - Free Tier).',
        });
      } else {
        setTestResult({
          success: false,
          message: data.error || 'El token ingresado fue rechazado por Google AI Studio.',
        });
      }
    } catch (err: any) {
      setTestResult({
        success: false,
        message: `Error de red al verificar el token: ${err?.message || 'Error desconocido'}`,
      });
    } finally {
      setIsValidating(false);
    }
  };

  const handleSave = () => {
    onSaveApiKey(inputKey.trim());
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-lg w-full overflow-hidden">
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-5 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-500/20 text-cyan-300 border border-cyan-400/30 flex items-center justify-center">
              <Key className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">
                Configuración de Token Google AI Studio
              </h3>
              <p className="text-xs text-slate-300">
                Carga directa de credenciales para consumo de Gemini Free Tier
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-4 text-xs">
          <div>
            <label className="block text-slate-700 font-semibold mb-1.5">
              Token de API / Clave de Google AI Studio:
            </label>
            <div className="relative flex items-center">
              <input
                type={showKey ? 'text' : 'password'}
                value={inputKey}
                onChange={(e) => {
                  setInputKey(e.target.value);
                  setTestResult(null);
                }}
                placeholder="AIzaSy..."
                className="w-full pl-3 pr-10 py-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono text-xs bg-slate-50 text-slate-900"
              />
              <button
                type="button"
                onClick={() => setShowKey(!showKey)}
                className="absolute right-2.5 p-1 text-slate-400 hover:text-slate-600"
                title={showKey ? 'Ocultar' : 'Mostrar'}
              >
                {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              Este token se utiliza para autenticar las peticiones de los Módulos de Insights y Asesor de Marketing.
            </p>
          </div>

          {/* Test connection result banner */}
          {testResult && (
            <div
              className={`p-3 rounded-lg border text-xs flex items-start gap-2.5 ${
                testResult.success
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                  : 'bg-rose-50 border-rose-200 text-rose-800'
              }`}
            >
              {testResult.success ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              )}
              <div>
                <span className="font-semibold block">
                  {testResult.success ? 'Conexión Exitosa' : 'Fallo de Verificación'}
                </span>
                <span className="text-[11px] opacity-90">{testResult.message}</span>
              </div>
            </div>
          )}

          {/* Service details info */}
          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5 text-slate-600">
            <div className="flex items-center gap-1.5 font-semibold text-slate-800">
              <Cpu className="w-3.5 h-3.5 text-indigo-600" />
              <span>Modelo Seleccionado para Free Tier:</span>
            </div>
            <p className="text-[11px] leading-relaxed">
              La plataforma utiliza <strong>gemini-3.1-flash-lite</strong> optimizado para alta disponibilidad y baja latencia en el Free Tier de Google AI Studio, con soporte estructurado en formato JSON.
            </p>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={handleTestToken}
            disabled={isValidating || !inputKey.trim()}
            className="px-4 py-2 text-xs font-semibold rounded-lg bg-white border border-slate-300 text-slate-700 hover:bg-slate-100 disabled:opacity-50 flex items-center gap-1.5 transition shadow-xs"
          >
            {isValidating ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin text-blue-600" />
            ) : (
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            )}
            <span>{isValidating ? 'Validando...' : 'Probar Conexión'}</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 text-xs font-medium rounded-lg text-slate-600 hover:bg-slate-200 transition"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="px-4 py-2 text-xs font-semibold rounded-lg bg-blue-600 hover:bg-blue-700 text-white shadow-sm flex items-center gap-1.5 transition"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Guardar y Aplicar</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
