import React, { useState } from 'react';
import {
  Sparkles,
  ArrowRight,
  TrendingUp,
  Target,
  Send,
  MessageSquare,
  AlertCircle,
  Lightbulb,
  CheckCircle2,
  DollarSign,
  ShieldAlert,
  Zap,
  Award,
  Key,
} from 'lucide-react';
import {
  KMeansResult,
  GeminiInsights,
  BootstrapStabilityResult,
} from '../types/analytics';
import { CLUSTER_COLORS } from './Charts';

interface Module7GeminiInsightsProps {
  kmeansResult: KMeansResult;
  stabilityResult: BootstrapStabilityResult | null;
  features: string[];
  sector: string;
  analysisGoal: string;
  insights: GeminiInsights | null;
  userApiKey?: string;
  onOpenApiKeyModal?: () => void;
  onInsightsGenerated: (insights: GeminiInsights) => void;
  onProceedToDashboard: () => void;
}

export const Module7GeminiInsights: React.FC<Module7GeminiInsightsProps> = ({
  kmeansResult,
  stabilityResult,
  features,
  sector,
  analysisGoal,
  insights,
  userApiKey = '',
  onOpenApiKeyModal,
  onInsightsGenerated,
  onProceedToDashboard,
}) => {
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Chat Advisor state
  const [chatMessages, setChatMessages] = useState<
    { sender: 'user' | 'assistant'; text: string }[]
  >([]);
  const [currentQuery, setCurrentQuery] = useState<string>('');
  const [isAskingChat, setIsAskingChat] = useState<boolean>(false);

  // Trigger Gemini API call to server endpoint
  const handleGenerateInsights = async () => {
    setIsGenerating(true);
    setErrorMsg(null);

    try {
      const clusterStats = kmeansResult.clusters.map((c) => ({
        clusterId: c.id + 1,
        name: c.name,
        size: c.size,
        percentage: c.percentage,
        centroidsRaw: c.centroidsRaw,
        centroidsScaled: c.centroidsScaled,
        topDifferentiators: c.keyDifferentiators.slice(0, 4),
      }));

      const payload = {
        sector,
        analysisGoal,
        datasetSummary: {
          totalRows: kmeansResult.clusterAssignments.length,
          k: kmeansResult.k,
        },
        clusterCount: kmeansResult.k,
        clusterStats,
        modelMetrics: {
          silhouetteScore: kmeansResult.silhouetteScore,
          totalWss: kmeansResult.totalWss,
          explainedVarianceRatio: kmeansResult.explainedVarianceRatio,
        },
        stabilityMetrics: stabilityResult
          ? {
              averageStability: stabilityResult.averageStability,
              classification: stabilityResult.overallClassification,
            }
          : null,
        topFeatures: features,
      };

      const response = await fetch('/api/gemini/insights', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(userApiKey ? { 'x-gemini-api-key': userApiKey } : {}),
        },
        body: JSON.stringify({ ...payload, apiKey: userApiKey }),
      });

      const resData = await response.json();
      if (!response.ok || !resData.success) {
        throw new Error(resData.error || 'Error al comunicarse con Gemini');
      }

      onInsightsGenerated(resData.data);
    } catch (err: any) {
      console.error('Error generating Gemini insights:', err);
      setErrorMsg(
        err.message ||
          'No se pudo conectar con Gemini API. Asegúrese de que GEMINI_API_KEY esté configurada en el servidor.'
      );
    } finally {
      setIsGenerating(false);
    }
  };

  // Chat message send
  const handleSendMessage = async () => {
    if (!currentQuery.trim() || isAskingChat) return;

    const userText = currentQuery.trim();
    setCurrentQuery('');
    setChatMessages((prev) => [...prev, { sender: 'user', text: userText }]);
    setIsAskingChat(true);

    try {
      const context = {
        sector,
        analysisGoal,
        clusterCount: kmeansResult.k,
        clusters: kmeansResult.clusters.map((c) => ({
          name: c.name,
          percentage: c.percentage,
          centroids: c.centroidsRaw,
        })),
        metrics: {
          silhouette: kmeansResult.silhouetteScore,
          varianceExplained: kmeansResult.explainedVarianceRatio,
        },
      };

      const response = await fetch('/api/gemini/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(userApiKey ? { 'x-gemini-api-key': userApiKey } : {}),
        },
        body: JSON.stringify({ question: userText, context, apiKey: userApiKey }),
      });

      const resData = await response.json();
      if (!response.ok || !resData.success) {
        throw new Error(resData.error || 'Error en la respuesta del asesor IA');
      }

      setChatMessages((prev) => [
        ...prev,
        { sender: 'assistant', text: resData.answer },
      ]);
    } catch (err: any) {
      setChatMessages((prev) => [
        ...prev,
        {
          sender: 'assistant',
          text: `Error al procesar la consulta: ${err.message}`,
        },
      ]);
    } finally {
      setIsAskingChat(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Module Header */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-6 rounded-2xl shadow-sm border border-slate-800 flex flex-wrap items-center justify-between gap-4">
        <div className="max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 text-cyan-300 text-xs font-semibold mb-3 border border-cyan-400/30">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Módulo 7: Inteligencia Artificial & Marketing Insights con Gemini</span>
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-white mb-2">
            Interpretación Estratégica & Recomendaciones Accionables
          </h2>
          <p className="text-slate-300 text-xs leading-relaxed">
            Transforme los centroides y métricas de clustering calculados en conocimiento empresarial de alto impacto. Gemini analiza la evidencia cuantitativa sin inventar conclusiones y clasifica oportunidades de venta cruzada, fidelización y optimización de valor.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex flex-col items-end gap-1.5">
            <div className="flex items-center gap-2">
              <div className="text-[11px] text-emerald-300 bg-emerald-950/60 border border-emerald-500/30 px-3 py-1 rounded-full inline-flex items-center gap-1.5 font-medium">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>
                  {userApiKey
                    ? `Token Activo: ${userApiKey.substring(0, 6)}...${userApiKey.substring(userApiKey.length - 4)}`
                    : 'Token Google AI Studio Configurado'}
                </span>
              </div>
              {onOpenApiKeyModal && (
                <button
                  type="button"
                  onClick={onOpenApiKeyModal}
                  className="text-[11px] bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 px-2.5 py-1 rounded-full transition inline-flex items-center gap-1 cursor-pointer font-medium"
                  title="Configurar o cambiar token en la interfaz"
                >
                  <Key className="w-3 h-3 text-cyan-300" />
                  <span>Configurar Token</span>
                </button>
              )}
            </div>
            <button
              onClick={handleGenerateInsights}
              disabled={isGenerating}
              className="py-3 px-6 rounded-xl font-bold text-xs bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white shadow-lg shadow-indigo-500/25 flex items-center gap-2 transition disabled:opacity-50"
            >
              {isGenerating ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Analizando con Gemini AI...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>{insights ? 'Regenerar Insights IA' : 'Generar Insights con Gemini'}</span>
                </>
              )}
            </button>
          </div>

          {insights && (
            <button
              onClick={onProceedToDashboard}
              className="py-3 px-5 rounded-xl font-semibold text-xs bg-white/10 hover:bg-white/20 text-white border border-white/20 transition flex items-center gap-2"
            >
              <span>Ver Dashboard Ejecutivo</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {errorMsg && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Insights Content */}
      {insights ? (
        <div className="space-y-6">
          {/* Executive Overview */}
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-indigo-700">
              <Zap className="w-4 h-4 text-indigo-600" />
              <span>Resumen Ejecutivo Global</span>
            </div>
            <p className="text-sm text-slate-700 leading-relaxed font-sans">
              {insights.executiveOverview}
            </p>
          </div>

          {/* 7.2 Marketing Segment Profiles */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Target className="w-4 h-4 text-blue-600" />
              <span>7.2 Insights de Marketing por Segmento de Clientes</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {insights.segmentProfiles.map((p, idx) => {
                const color = CLUSTER_COLORS[idx % CLUSTER_COLORS.length];
                const cluster = kmeansResult.clusters[idx];

                return (
                  <div
                    key={p.clusterId || idx}
                    className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-3 flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span
                          className="w-3.5 h-3.5 rounded-full"
                          style={{ backgroundColor: color }}
                        />
                        <span className="text-xs font-bold text-slate-500">
                          {cluster?.percentage.toFixed(1)}% del total
                        </span>
                      </div>

                      <h4 className="text-base font-bold text-slate-900 mb-1">
                        {p.segmentName}
                      </h4>
                      <p className="text-xs text-slate-600 italic mb-3">
                        "{p.personaDescription}"
                      </p>

                      <div className="space-y-2 text-xs text-slate-700">
                        {p.consumptionHabits && (
                          <div className="p-2 bg-slate-50 rounded border border-slate-100">
                            <strong className="block text-[10px] text-slate-400 uppercase">
                              Patrón de Consumo:
                            </strong>
                            <span>{p.consumptionHabits}</span>
                          </div>
                        )}

                        {p.priceSensitivity && (
                          <div className="p-2 bg-slate-50 rounded border border-slate-100">
                            <strong className="block text-[10px] text-slate-400 uppercase">
                              Sensibilidad al Precio:
                            </strong>
                            <span>{p.priceSensitivity}</span>
                          </div>
                        )}

                        <div className="p-2 bg-indigo-50/50 rounded border border-indigo-100">
                          <strong className="block text-[10px] text-indigo-800 uppercase">
                            Venta Cruzada / Upsell:
                          </strong>
                          <span className="text-indigo-950">{p.crossSellOpportunities}</span>
                        </div>

                        <div className="p-2 bg-emerald-50/50 rounded border border-emerald-100">
                          <strong className="block text-[10px] text-emerald-800 uppercase">
                            Estrategia de Fidelización:
                          </strong>
                          <span className="text-emerald-950">{p.retentionStrategy}</span>
                        </div>
                      </div>
                    </div>

                    {p.recommendedChannels && (
                      <div className="pt-2 border-t border-slate-100 text-[11px] text-slate-500">
                        <strong>Canales sugeridos:</strong> {p.recommendedChannels}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* 7.4 Actionable Strategic Recommendations with Evidence and Measurable KPIs */}
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Award className="w-4 h-4 text-indigo-600" />
              <span>7.4 Recomendaciones Estratégicas Priorizadas & KPIs de Medición</span>
            </h3>
            <p className="text-xs text-slate-500">
              Cada propuesta conecta el hallazgo matemático comprobado con una acción de negocio y un indicador verificable.
            </p>

            <div className="space-y-4">
              {insights.strategicRecommendations.map((reco, idx) => {
                const isHigh = reco.impactLevel === 'Alto';
                return (
                  <div
                    key={idx}
                    className={`p-4 rounded-xl border text-xs transition ${
                      isHigh
                        ? 'bg-gradient-to-r from-blue-50/60 to-white border-blue-200 ring-1 ring-blue-500/10'
                        : 'bg-white border-slate-200'
                    }`}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2">
                        <span className="w-6 h-6 rounded-full bg-slate-900 text-white font-bold text-[11px] flex items-center justify-center">
                          {idx + 1}
                        </span>
                        <h4 className="text-sm font-bold text-slate-900">{reco.title}</h4>
                      </div>
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          isHigh
                            ? 'bg-rose-100 text-rose-800 border border-rose-200'
                            : reco.impactLevel === 'Medio'
                            ? 'bg-amber-100 text-amber-800 border border-amber-200'
                            : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        Impacto: {reco.impactLevel}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                      <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-100">
                        <span className="text-[10px] font-bold text-slate-500 uppercase block mb-0.5">
                          Hallazgo & Evidencia Estadística:
                        </span>
                        <p className="text-slate-800">{reco.finding}</p>
                        <span className="text-[11px] font-mono text-cyan-800 block mt-1">
                          Evidencia: {reco.statisticalEvidence}
                        </span>
                      </div>

                      <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-100">
                        <span className="text-[10px] font-bold text-slate-500 uppercase block mb-0.5">
                          Interpretación Empresarial:
                        </span>
                        <p className="text-slate-800">{reco.businessInterpretation}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 p-3 bg-indigo-50/40 border border-indigo-100 rounded-lg">
                      <div className="md:col-span-2">
                        <span className="text-[10px] font-bold text-indigo-900 uppercase block mb-0.5">
                          Acción Recomendada:
                        </span>
                        <p className="text-slate-800 font-medium">{reco.recommendedAction}</p>
                      </div>
                      <div>
                        <span className="text-[10px] font-bold text-indigo-900 uppercase block mb-0.5">
                          KPI Medible:
                        </span>
                        <p className="text-indigo-900 font-bold">{reco.measurableKPI}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Interactive AI Strategic Advisor Chat */}
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-blue-600" />
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Asesor Estratégico Interactivo (Consulta Directa a Gemini)
                </h3>
                <p className="text-xs text-slate-500">
                  Formule cualquier pregunta sobre los segmentos, pricing, planes de retención o análisis ad-hoc.
                </p>
              </div>
            </div>

            {/* Quick Prompt Suggestions */}
            <div className="flex flex-wrap gap-2">
              {[
                '¿Cuál es la estrategia para evitar la fuga en el cluster de menor consumo?',
                '¿Cómo diseñar una oferta convergente para los clientes tradicionales?',
                '¿Qué cluster representa el mayor Lifetime Value potencial?',
              ].map((suggestion, sIdx) => (
                <button
                  key={sIdx}
                  onClick={() => setCurrentQuery(suggestion)}
                  className="text-[11px] bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-600 px-3 py-1.5 rounded-full transition text-left"
                >
                  "{suggestion}"
                </button>
              ))}
            </div>

            {/* Chat Messages */}
            {chatMessages.length > 0 && (
              <div className="space-y-3 max-h-80 overflow-y-auto p-4 bg-slate-50 rounded-xl border border-slate-200">
                {chatMessages.map((msg, i) => (
                  <div
                    key={i}
                    className={`flex flex-col ${
                      msg.sender === 'user' ? 'items-end' : 'items-start'
                    }`}
                  >
                    <div
                      className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-xs leading-relaxed ${
                        msg.sender === 'user'
                          ? 'bg-blue-600 text-white font-medium rounded-br-xs'
                          : 'bg-white text-slate-800 border border-slate-200 shadow-xs rounded-bl-xs'
                      }`}
                    >
                      {msg.text}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Input Bar */}
            <div className="flex gap-2">
              <input
                type="text"
                value={currentQuery}
                onChange={(e) => setCurrentQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                placeholder="Pregunte a Gemini sobre los segmentos..."
                className="flex-1 border border-slate-300 rounded-lg px-4 py-2.5 text-xs bg-white text-slate-800 focus:ring-2 focus:ring-blue-500"
              />
              <button
                onClick={handleSendMessage}
                disabled={isAskingChat || !currentQuery.trim()}
                className="py-2.5 px-5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 transition"
              >
                {isAskingChat ? (
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Send className="w-3.5 h-3.5" />
                )}
                <span>Consultar</span>
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* Empty Call-to-action state */
        <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto">
            <Sparkles className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-slate-900">
            Listo para Generar Conocimiento Estratégico con Gemini
          </h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            Haga clic en el botón superior para enviar el resumen cuantitativo, centroides y métricas de estabilidad al modelo Gemini 3.8 Flash para formular recomendaciones de marketing y negocio.
          </p>
          <button
            onClick={handleGenerateInsights}
            disabled={isGenerating}
            className="py-2.5 px-6 rounded-lg font-semibold text-xs bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm inline-flex items-center gap-2"
          >
            <Sparkles className="w-4 h-4" />
            <span>Generar Insights Ahora</span>
          </button>
        </div>
      )}
    </div>
  );
};
