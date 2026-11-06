import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import { KMeansResult, GeminiInsights, BootstrapStabilityResult } from '../types/analytics';

/**
 * Export complete multi-sheet Excel file (.xlsx)
 */
export function exportToExcel(
  originalData: Record<string, any>[],
  kmeansResult: KMeansResult,
  features: string[],
  geminiInsights?: GeminiInsights | null,
  stabilityResult?: BootstrapStabilityResult | null
) {
  const wb = XLSX.utils.book_new();

  // Sheet 1: Assigned Data
  const assignedData = originalData.map((row, idx) => ({
    ...row,
    cluster_asignado: kmeansResult.clusterAssignments[idx] + 1,
    nombre_segmento: kmeansResult.clusters[kmeansResult.clusterAssignments[idx]]?.name || `Segmento ${kmeansResult.clusterAssignments[idx] + 1}`,
  }));
  const wsAssigned = XLSX.utils.json_to_sheet(assignedData);
  XLSX.utils.book_append_sheet(wb, wsAssigned, 'Datos_Con_Cluster');

  // Sheet 2: Centroids in Original Scale
  const rawCentroids = kmeansResult.clusters.map((c) => ({
    Cluster_ID: c.id + 1,
    Nombre_Segmento: c.name,
    Registros: c.size,
    Porcentaje: `${c.percentage.toFixed(1)}%`,
    Inercia_WSS: c.wss.toFixed(2),
    ...c.centroidsRaw,
  }));
  const wsRawCentroids = XLSX.utils.json_to_sheet(rawCentroids);
  XLSX.utils.book_append_sheet(wb, wsRawCentroids, 'Centroides_Reales');

  // Sheet 3: Standardized Centroids (Z-Score)
  const scaledCentroids = kmeansResult.clusters.map((c) => ({
    Cluster_ID: c.id + 1,
    Nombre_Segmento: c.name,
    ...c.centroidsScaled,
  }));
  const wsScaledCentroids = XLSX.utils.json_to_sheet(scaledCentroids);
  XLSX.utils.book_append_sheet(wb, wsScaledCentroids, 'Centroides_ZScore');

  // Sheet 4: Model Quality Metrics & Parameters
  const metricsData = [
    { Metrica: 'Número de Clusters (K)', Valor: kmeansResult.k },
    { Metrica: 'Semilla Aleatoria', Valor: kmeansResult.seed },
    { Metrica: 'Inicializaciones (nstart)', Valor: kmeansResult.nstart },
    { Metrica: 'Iteraciones Máximas', Valor: kmeansResult.maxIter },
    { Metrica: 'Iteraciones de Convergencia', Valor: kmeansResult.convergedIterations },
    { Metrica: 'Suma de Cuadrados Intra-cluster (WSS Total)', Valor: kmeansResult.totalWss.toFixed(2) },
    { Metrica: 'Suma de Cuadrados Inter-cluster (BSS)', Valor: kmeansResult.betweenSs.toFixed(2) },
    { Metrica: 'Suma Total de Cuadrados (TSS)', Valor: kmeansResult.totalSs.toFixed(2) },
    { Metrica: 'Varianza Explicada (BSS/TSS %)', Valor: `${(kmeansResult.explainedVarianceRatio * 100).toFixed(2)}%` },
    { Metrica: 'Silhouette Score Promedio', Valor: kmeansResult.silhouetteScore.toFixed(4) },
    { Metrica: 'Davies-Bouldin Index', Valor: kmeansResult.daviesBouldinIndex.toFixed(4) },
    { Metrica: 'Calinski-Harabasz Index', Valor: kmeansResult.calinskiHarabaszIndex.toFixed(2) },
    { Metrica: 'Estabilidad Bootstrap Promedio', Valor: stabilityResult ? stabilityResult.averageStability.toFixed(4) : 'N/A' },
    { Metrica: 'Clasificación de Estabilidad', Valor: stabilityResult ? stabilityResult.overallClassification : 'N/A' },
  ];
  const wsMetrics = XLSX.utils.json_to_sheet(metricsData);
  XLSX.utils.book_append_sheet(wb, wsMetrics, 'Metricas_Modelo');

  // Sheet 5: Gemini Insights (if present)
  if (geminiInsights && geminiInsights.strategicRecommendations) {
    const recoData = geminiInsights.strategicRecommendations.map((r) => ({
      Titulo: r.title,
      Hallazgo: r.finding,
      Evidencia_Estadistica: r.statisticalEvidence,
      Interpretacion_Negocio: r.businessInterpretation,
      Impacto: r.impactLevel,
      Accion_Recomendada: r.recommendedAction,
      KPI_Medible: r.measurableKPI,
    }));
    const wsReco = XLSX.utils.json_to_sheet(recoData);
    XLSX.utils.book_append_sheet(wb, wsReco, 'Recomendaciones_Estrategicas');
  }

  XLSX.writeFile(wb, `ClusterIQ_Segmentacion_K${kmeansResult.k}_${Date.now()}.xlsx`);
}

/**
 * Export data with cluster assignment to CSV
 */
export function exportToCsv(
  originalData: Record<string, any>[],
  clusterAssignments: number[]
) {
  const assignedData = originalData.map((row, idx) => ({
    ...row,
    cluster_asignado: clusterAssignments[idx] + 1,
  }));
  const ws = XLSX.utils.json_to_sheet(assignedData);
  const csvOutput = XLSX.utils.sheet_to_csv(ws);

  const blob = new Blob([csvOutput], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', `ClusterIQ_Asignaciones_${Date.now()}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Generate Executive PDF Report
 */
export function exportToPdf(
  kmeansResult: KMeansResult,
  features: string[],
  geminiInsights?: GeminiInsights | null,
  stabilityResult?: BootstrapStabilityResult | null
) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  let y = 18;

  // Header banner
  doc.setFillColor(15, 23, 42); // slate-900
  doc.rect(0, 0, pageWidth, 28, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text('ClusterIQ | Informe Ejecutivo de Segmentación', 14, 13);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(148, 163, 184); // slate-400
  doc.text(`Generado el ${new Date().toLocaleDateString('es-ES')} | Metodología K-Means con Validación Bootstrap y Gemini AI`, 14, 21);

  y = 38;

  // KPI Highlights Box
  doc.setFillColor(248, 250, 252); // slate-50
  doc.setDrawColor(226, 232, 240); // slate-200
  doc.roundedRect(14, y, pageWidth - 28, 24, 2, 2, 'FD');

  doc.setTextColor(15, 23, 42);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('Métricas Clave del Modelo:', 18, y + 7);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text(`* Clusters (K): ${kmeansResult.k}`, 18, y + 14);
  doc.text(`* Varianza Explicada (BSS/TSS): ${(kmeansResult.explainedVarianceRatio * 100).toFixed(1)}%`, 65, y + 14);
  doc.text(`* Silhouette Score: ${kmeansResult.silhouetteScore.toFixed(3)}`, 135, y + 14);

  const stabLabel = stabilityResult ? `${stabilityResult.averageStability.toFixed(3)} (${stabilityResult.overallClassification})` : 'N/A';
  doc.text(`* Estabilidad Bootstrap: ${stabLabel}`, 18, y + 20);
  doc.text(`* Variables Analizadas: ${features.length}`, 135, y + 20);

  y += 32;

  // Summary Table of Segments
  doc.setTextColor(15, 23, 42);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('1. Distribución y Perfil de los Segmentos', 14, y);
  y += 6;

  // Table header
  doc.setFillColor(241, 245, 249);
  doc.rect(14, y, pageWidth - 28, 7, 'F');
  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105);
  doc.text('Segmento', 16, y + 5);
  doc.text('Clientes', 60, y + 5);
  doc.text('% Total', 85, y + 5);
  doc.text('Inercia WSS', 110, y + 5);
  doc.text('Estabilidad Jaccard', 145, y + 5);
  y += 8;

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(30, 41, 59);

  kmeansResult.clusters.forEach((c) => {
    const stabVal = stabilityResult?.clusterStabilities.find((s) => s.clusterId === c.id);
    const stabText = stabVal ? `${stabVal.stability.toFixed(3)} (${stabVal.classification})` : 'N/A';

    doc.text(`${c.name}`, 16, y + 4);
    doc.text(`${c.size}`, 60, y + 4);
    doc.text(`${c.percentage.toFixed(1)}%`, 85, y + 4);
    doc.text(`${c.wss.toFixed(1)}`, 110, y + 4);
    doc.text(stabText, 145, y + 4);

    doc.setDrawColor(241, 245, 249);
    doc.line(14, y + 6, pageWidth - 14, y + 6);
    y += 7;
  });

  y += 6;

  // Gemini Executive Overview
  if (geminiInsights?.executiveOverview) {
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text('2. Resumen Estratégico e Interpretación de Negocios (Gemini AI)', 14, y);
    y += 6;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(51, 65, 85);

    const splitOverview = doc.splitTextToSize(geminiInsights.executiveOverview, pageWidth - 28);
    doc.text(splitOverview, 14, y);
    y += splitOverview.length * 4.2 + 6;
  }

  // Strategic Recommendations
  if (geminiInsights?.strategicRecommendations && geminiInsights.strategicRecommendations.length > 0) {
    if (y > 230) {
      doc.addPage();
      y = 20;
    }

    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text('3. Recomendaciones Accionables y KPIs de Seguimiento', 14, y);
    y += 7;

    geminiInsights.strategicRecommendations.slice(0, 4).forEach((reco, idx) => {
      if (y > 245) {
        doc.addPage();
        y = 20;
      }

      doc.setFillColor(idx % 2 === 0 ? 255 : 248, 250, 252);
      doc.setDrawColor(226, 232, 240);
      doc.roundedRect(14, y, pageWidth - 28, 22, 1.5, 1.5, 'FD');

      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(15, 23, 42);
      doc.text(`${idx + 1}. ${reco.title} [Impacto: ${reco.impactLevel}]`, 18, y + 5);

      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(71, 85, 105);
      const actionText = `Acción: ${reco.recommendedAction}`;
      const splitAction = doc.splitTextToSize(actionText, pageWidth - 36);
      doc.text(splitAction[0], 18, y + 10);

      doc.setTextColor(14, 116, 144); // cyan-700
      doc.text(`KPI de Medición: ${reco.measurableKPI}`, 18, y + 16);

      y += 26;
    });
  }

  // Footer on each page
  const totalPages = doc.getNumberOfPages();
  for (let p = 1; p <= totalPages; p++) {
    doc.setPage(p);
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184);
    doc.text(
      `Página ${p} de ${totalPages} - ClusterIQ Platform | Confidencial para Toma de Decisiones`,
      pageWidth / 2,
      288,
      { align: 'center' }
    );
  }

  doc.save(`ClusterIQ_Informe_Ejecutivo_K${kmeansResult.k}_${Date.now()}.pdf`);
}
