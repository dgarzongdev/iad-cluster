import React, { useState } from 'react';

// Coordinated cluster color palette (high contrast, accessible, professional)
export const CLUSTER_COLORS = [
  '#2563eb', // Blue 600
  '#0d9488', // Teal 600
  '#7c3aed', // Purple 600
  '#ea580c', // Orange 600
  '#db2777', // Pink 600
  '#059669', // Emerald 600
  '#d97706', // Amber 600
  '#4f46e5', // Indigo 600
];

export const CLUSTER_BG_COLORS = [
  'bg-blue-50 text-blue-700 border-blue-200',
  'bg-teal-50 text-teal-700 border-teal-200',
  'bg-purple-50 text-purple-700 border-purple-200',
  'bg-orange-50 text-orange-700 border-orange-200',
  'bg-pink-50 text-pink-700 border-pink-200',
  'bg-emerald-50 text-emerald-700 border-emerald-200',
  'bg-amber-50 text-amber-700 border-amber-200',
  'bg-indigo-50 text-indigo-700 border-indigo-200',
];

/**
 * Responsive Histogram with KDE / normal overlay
 */
export const HistogramChart: React.FC<{
  values: number[];
  binsCount?: number;
  label?: string;
  height?: number;
}> = ({ values, binsCount = 12, label = 'Distribución', height = 180 }) => {
  const clean = values.filter((v) => !isNaN(v) && v !== null && v !== undefined);
  if (clean.length === 0) return <div className="text-xs text-slate-400 py-6 text-center">Sin datos numéricos</div>;

  const min = Math.min(...clean);
  const max = Math.max(...clean);
  const range = max - min || 1;
  const binWidth = range / binsCount;

  const bins = new Array(binsCount).fill(0);
  clean.forEach((v) => {
    const idx = Math.min(binsCount - 1, Math.floor((v - min) / binWidth));
    bins[idx]++;
  });

  const maxFreq = Math.max(...bins, 1);
  const chartWidth = 420;
  const padding = { top: 15, right: 15, bottom: 25, left: 35 };
  const innerW = chartWidth - padding.left - padding.right;
  const innerH = height - padding.top - padding.bottom;

  return (
    <div className="w-full">
      <div className="flex justify-between items-center text-xs text-slate-500 mb-1 font-medium">
        <span>{label}</span>
        <span>N={clean.length} | Min: {min.toFixed(1)} | Max: {max.toFixed(1)}</span>
      </div>
      <svg viewBox={`0 0 ${chartWidth} ${height}`} className="w-full h-auto overflow-visible select-none">
        {/* Y Axis ticks */}
        {[0, 0.5, 1].map((pct, idx) => {
          const val = Math.round(maxFreq * pct);
          const y = padding.top + innerH * (1 - pct);
          return (
            <g key={idx}>
              <line x1={padding.left} y1={y} x2={chartWidth - padding.right} y2={y} stroke="#e2e8f0" strokeDasharray="3 3" />
              <text x={padding.left - 6} y={y + 3} textAnchor="end" fontSize="9" fill="#94a3b8">
                {val}
              </text>
            </g>
          );
        })}

        {/* Histogram Bars */}
        {bins.map((count, i) => {
          const barW = (innerW / binsCount) - 2;
          const barH = (count / maxFreq) * innerH;
          const x = padding.left + i * (innerW / binsCount) + 1;
          const y = padding.top + innerH - barH;
          const binStart = (min + i * binWidth).toFixed(1);

          return (
            <g key={i} className="group">
              <rect
                x={x}
                y={y}
                width={Math.max(2, barW)}
                height={Math.max(1, barH)}
                fill="#3b82f6"
                rx={1}
                className="transition-opacity hover:opacity-80"
              />
              <title>{`Rango: ${binStart} - ${(min + (i + 1) * binWidth).toFixed(1)}\nFrecuencia: ${count}`}</title>
            </g>
          );
        })}

        {/* X Axis base line */}
        <line
          x1={padding.left}
          y1={padding.top + innerH}
          x2={chartWidth - padding.right}
          y2={padding.top + innerH}
          stroke="#cbd5e1"
        />

        {/* X Labels */}
        <text x={padding.left} y={height - 6} fontSize="9" fill="#94a3b8" textAnchor="start">
          {min.toFixed(1)}
        </text>
        <text x={padding.left + innerW / 2} y={height - 6} fontSize="9" fill="#94a3b8" textAnchor="middle">
          {((min + max) / 2).toFixed(1)}
        </text>
        <text x={chartWidth - padding.right} y={height - 6} fontSize="9" fill="#94a3b8" textAnchor="end">
          {max.toFixed(1)}
        </text>
      </svg>
    </div>
  );
};

/**
 * Interactive Pearson Correlation Matrix Heatmap
 */
export const CorrelationHeatmap: React.FC<{
  columns: string[];
  matrix: number[][];
}> = ({ columns, matrix }) => {
  const [hoverCell, setHoverCell] = useState<{ col1: string; col2: string; val: number } | null>(null);

  if (!columns || columns.length === 0) return null;

  // Truncate long column names for display
  const displayNames = columns.map((c) => (c.length > 12 ? c.substring(0, 10) + '..' : c));

  // Color interpolation: -1 = red/orange, 0 = slate-100, +1 = blue-600
  const getColor = (val: number) => {
    if (val >= 0) {
      // White to Indigo
      const intensity = Math.min(1, Math.abs(val));
      const r = Math.round(248 - intensity * (248 - 37));
      const g = Math.round(250 - intensity * (250 - 99));
      const b = Math.round(252 - intensity * (252 - 235));
      return `rgb(${r}, ${g}, ${b})`;
    } else {
      // White to Rose
      const intensity = Math.min(1, Math.abs(val));
      const r = Math.round(248 - intensity * (248 - 225));
      const g = Math.round(250 - intensity * (250 - 29));
      const b = Math.round(252 - intensity * (252 - 72));
      return `rgb(${r}, ${g}, ${b})`;
    }
  };

  return (
    <div className="overflow-x-auto">
      {hoverCell && (
        <div className="mb-2 px-3 py-1.5 bg-slate-900 text-white rounded text-xs inline-flex items-center gap-2">
          <span className="font-semibold text-slate-300">{hoverCell.col1}</span>
          <span>×</span>
          <span className="font-semibold text-slate-300">{hoverCell.col2}</span>
          <span className="font-mono bg-slate-800 px-2 py-0.5 rounded text-cyan-400">
            r = {hoverCell.val.toFixed(3)}
          </span>
        </div>
      )}
      <div className="inline-block border border-slate-200 rounded-lg p-2 bg-white">
        <table className="border-collapse text-xs">
          <thead>
            <tr>
              <th className="p-1 text-slate-400 text-left font-normal"></th>
              {displayNames.map((name, idx) => (
                <th
                  key={idx}
                  className="p-1.5 font-medium text-slate-600 text-center max-w-[70px] truncate"
                  title={columns[idx]}
                >
                  {name}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {columns.map((rowName, rIdx) => (
              <tr key={rIdx}>
                <td className="p-1.5 font-medium text-slate-600 text-right pr-2 max-w-[90px] truncate" title={rowName}>
                  {displayNames[rIdx]}
                </td>
                {columns.map((colName, cIdx) => {
                  const val = matrix[rIdx]?.[cIdx] ?? 0;
                  const isDiag = rIdx === cIdx;
                  return (
                    <td
                      key={cIdx}
                      style={{ backgroundColor: getColor(val) }}
                      className={`p-1.5 text-center font-mono text-[11px] cursor-pointer transition-transform hover:scale-110 border border-slate-100 ${
                        Math.abs(val) > 0.6 && !isDiag ? 'text-white font-bold' : 'text-slate-800'
                      }`}
                      onMouseEnter={() => setHoverCell({ col1: rowName, col2: colName, val })}
                      onMouseLeave={() => setHoverCell(null)}
                      title={`${rowName} vs ${colName}: r = ${val.toFixed(3)}`}
                    >
                      {val.toFixed(2)}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

/**
 * 2D PCA Cluster Projection Scatter Plot
 */
export const PcaClusterScatter: React.FC<{
  coords: { x: number; y: number; cluster: number; id: number }[];
  clustersCount: number;
  clusterNames?: Record<number, string>;
  varianceExplained?: [number, number];
  height?: number;
}> = ({
  coords,
  clustersCount,
  clusterNames = {},
  varianceExplained = [45, 25],
  height = 360,
}) => {
  const [hoverPoint, setHoverPoint] = useState<{ id: number; cluster: number; x: number; y: number } | null>(null);

  if (!coords || coords.length === 0) {
    return <div className="text-center py-12 text-slate-400">Sin proyección PCA disponible.</div>;
  }

  const chartWidth = 560;
  const padding = { top: 25, right: 30, bottom: 40, left: 45 };
  const innerW = chartWidth - padding.left - padding.right;
  const innerH = height - padding.top - padding.bottom;

  const xs = coords.map((c) => c.x);
  const ys = coords.map((c) => c.y);

  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);

  const rangeX = maxX - minX || 1;
  const rangeY = maxY - minY || 1;

  const scaleX = (x: number) => padding.left + ((x - minX) / rangeX) * innerW;
  const scaleY = (y: number) => padding.top + innerH - ((y - minY) / rangeY) * innerH;

  // Calculate centroids on PCA space
  const centroids: { x: number; y: number; cluster: number; count: number }[] = [];
  for (let c = 0; c < clustersCount; c++) {
    const pts = coords.filter((pt) => pt.cluster === c);
    if (pts.length > 0) {
      const avgX = pts.reduce((sum, p) => sum + p.x, 0) / pts.length;
      const avgY = pts.reduce((sum, p) => sum + p.y, 0) / pts.length;
      centroids.push({ x: avgX, y: avgY, cluster: c, count: pts.length });
    }
  }

  return (
    <div className="w-full relative">
      <div className="flex flex-wrap items-center justify-between text-xs text-slate-500 mb-2 gap-2">
        <span className="font-medium text-slate-700">
          Proyección 2D en Componentes Principales (PCA)
        </span>
        <div className="flex gap-3 text-[11px]">
          <span>PC1: <strong className="text-slate-800">{varianceExplained[0]}%</strong> var.</span>
          <span>PC2: <strong className="text-slate-800">{varianceExplained[1]}%</strong> var.</span>
          <span>Var. Acumulada: <strong className="text-blue-700">{varianceExplained[0] + varianceExplained[1]}%</strong></span>
        </div>
      </div>

      <svg viewBox={`0 0 ${chartWidth} ${height}`} className="w-full h-auto bg-slate-50/50 border border-slate-200 rounded-lg overflow-visible select-none">
        {/* Grid lines */}
        {[0, 0.25, 0.5, 0.75, 1].map((pct, idx) => {
          const y = padding.top + innerH * pct;
          const x = padding.left + innerW * pct;
          return (
            <g key={idx}>
              <line x1={padding.left} y1={y} x2={chartWidth - padding.right} y2={y} stroke="#e2e8f0" strokeDasharray="3 3" />
              <line x1={x} y1={padding.top} x2={x} y2={padding.top + innerH} stroke="#e2e8f0" strokeDasharray="3 3" />
            </g>
          );
        })}

        {/* Data points */}
        {coords.map((pt, i) => {
          const cx = scaleX(pt.x);
          const cy = scaleY(pt.y);
          const color = CLUSTER_COLORS[pt.cluster % CLUSTER_COLORS.length];

          return (
            <circle
              key={i}
              cx={cx}
              cy={cy}
              r={3}
              fill={color}
              fillOpacity={0.65}
              stroke="#ffffff"
              strokeWidth={0.8}
              className="cursor-pointer transition-all hover:r-5 hover:fillOpacity-100"
              onMouseEnter={() => setHoverPoint(pt)}
              onMouseLeave={() => setHoverPoint(null)}
            />
          );
        })}

        {/* Centroids */}
        {centroids.map((cent) => {
          const cx = scaleX(cent.x);
          const cy = scaleY(cent.y);
          const color = CLUSTER_COLORS[cent.cluster % CLUSTER_COLORS.length];

          return (
            <g key={cent.cluster}>
              <circle
                cx={cx}
                cy={cy}
                r={10}
                fill={color}
                stroke="#ffffff"
                strokeWidth={2.5}
                className="filter drop-shadow-md"
              />
              <text
                x={cx}
                y={cy + 3.5}
                textAnchor="middle"
                fontSize="10"
                fontWeight="bold"
                fill="#ffffff"
              >
                C{cent.cluster + 1}
              </text>
            </g>
          );
        })}

        {/* Axis labels */}
        <text
          x={padding.left + innerW / 2}
          y={height - 8}
          textAnchor="middle"
          fontSize="10"
          fill="#64748b"
          fontWeight="500"
        >
          Componente Principal 1 ({varianceExplained[0]}% Varianza)
        </text>

        <text
          x={14}
          y={padding.top + innerH / 2}
          textAnchor="middle"
          fontSize="10"
          fill="#64748b"
          fontWeight="500"
          transform={`rotate(-90, 14, ${padding.top + innerH / 2})`}
        >
          Componente Principal 2 ({varianceExplained[1]}% Varianza)
        </text>
      </svg>

      {/* Hover tooltip */}
      {hoverPoint && (
        <div className="absolute top-2 right-2 bg-slate-900/95 text-white px-3 py-2 rounded-lg text-xs shadow-lg backdrop-blur">
          <div className="font-semibold text-cyan-300">
            {clusterNames[hoverPoint.cluster] || `Segmento ${hoverPoint.cluster + 1}`}
          </div>
          <div className="text-slate-300">Obs #{hoverPoint.id + 1}</div>
          <div className="text-slate-400 font-mono text-[11px] mt-0.5">
            PC1: {hoverPoint.x.toFixed(2)} | PC2: {hoverPoint.y.toFixed(2)}
          </div>
        </div>
      )}

      {/* Cluster legend */}
      <div className="flex flex-wrap gap-2 mt-2 justify-center">
        {Array.from({ length: clustersCount }, (_, c) => (
          <div
            key={c}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium border bg-white border-slate-200"
          >
            <span
              className="w-2.5 h-2.5 rounded-full"
              style={{ backgroundColor: CLUSTER_COLORS[c % CLUSTER_COLORS.length] }}
            />
            <span className="text-slate-700">
              {clusterNames[c] || `Segmento ${c + 1}`}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

/**
 * Optimal K evaluation charts (Elbow WSS, Silhouette ASW, Gap Statistic)
 */
export const OptimalKCurves: React.FC<{
  evaluations: { k: number; wss: number; silhouette: number; gap?: number; gapSe?: number }[];
  recommendedElbow: number;
  recommendedSilhouette: number;
  recommendedGap: number;
}> = ({ evaluations, recommendedElbow, recommendedSilhouette, recommendedGap }) => {
  const [activeMetric, setActiveMetric] = useState<'wss' | 'silhouette' | 'gap'>('wss');

  if (!evaluations || evaluations.length === 0) return null;

  const ks = evaluations.map((e) => e.k);
  const chartWidth = 520;
  const chartHeight = 220;
  const padding = { top: 20, right: 30, bottom: 35, left: 55 };
  const innerW = chartWidth - padding.left - padding.right;
  const innerH = chartHeight - padding.top - padding.bottom;

  let values: number[] = [];
  let yLabel = '';
  let recK = recommendedElbow;
  let explanation = '';

  if (activeMetric === 'wss') {
    values = evaluations.map((e) => e.wss);
    yLabel = 'Inercia Intra-cluster (WSS)';
    recK = recommendedElbow;
    explanation = 'Método del Codo: Busca el "codo" o punto de inflexión donde disminuciones posteriores de WSS se vuelven marginales.';
  } else if (activeMetric === 'silhouette') {
    values = evaluations.map((e) => e.silhouette);
    yLabel = 'Silueta Promedio (ASW)';
    recK = recommendedSilhouette;
    explanation = 'Silueta Promedio (ASW): Mide la cohesión y separación de los grupos. Se busca maximizar este coeficiente.';
  } else {
    values = evaluations.map((e) => e.gap || 0);
    yLabel = 'Estadístico GAP';
    recK = recommendedGap;
    explanation = 'Estadístico GAP: Compara log(WSS) con la hipótesis nula uniforme mediante remuestreo de Monte Carlo.';
  }

  const minY = Math.min(...values);
  const maxY = Math.max(...values);
  const rangeY = maxY - minY || 1;

  const scaleX = (k: number) => {
    const minK = ks[0];
    const maxK = ks[ks.length - 1];
    return padding.left + ((k - minK) / (maxK - minK || 1)) * innerW;
  };

  const scaleY = (v: number) => padding.top + innerH - ((v - minY) / rangeY) * innerH;

  // Build path
  const pathD = evaluations
    .map((e, idx) => {
      const x = scaleX(e.k);
      const val = activeMetric === 'wss' ? e.wss : activeMetric === 'silhouette' ? e.silhouette : e.gap || 0;
      const y = scaleY(val);
      return `${idx === 0 ? 'M' : 'L'} ${x} ${y}`;
    })
    .join(' ');

  return (
    <div className="bg-white p-4 rounded-xl border border-slate-200">
      {/* Metric Selector Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
        <div className="flex gap-1.5 p-1 bg-slate-100 rounded-lg text-xs font-medium">
          <button
            onClick={() => setActiveMetric('wss')}
            className={`px-3 py-1.5 rounded-md transition ${
              activeMetric === 'wss'
                ? 'bg-white text-blue-700 shadow-sm font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            1. Método del Codo (WSS)
          </button>
          <button
            onClick={() => setActiveMetric('silhouette')}
            className={`px-3 py-1.5 rounded-md transition ${
              activeMetric === 'silhouette'
                ? 'bg-white text-teal-700 shadow-sm font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            2. Silueta Promedio (ASW)
          </button>
          <button
            onClick={() => setActiveMetric('gap')}
            className={`px-3 py-1.5 rounded-md transition ${
              activeMetric === 'gap'
                ? 'bg-white text-purple-700 shadow-sm font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            3. Estadístico GAP
          </button>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span className="text-slate-500">Recomendado por este método:</span>
          <span className="px-2 py-0.5 bg-blue-100 text-blue-800 font-bold rounded-full">
            K = {recK}
          </span>
        </div>
      </div>

      <p className="text-xs text-slate-500 mb-3">{explanation}</p>

      <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="w-full h-auto overflow-visible select-none">
        {/* Y ticks */}
        {[0, 0.5, 1].map((pct, idx) => {
          const val = minY + rangeY * pct;
          const y = padding.top + innerH * (1 - pct);
          return (
            <g key={idx}>
              <line x1={padding.left} y1={y} x2={chartWidth - padding.right} y2={y} stroke="#f1f5f9" />
              <text x={padding.left - 8} y={y + 3} textAnchor="end" fontSize="9" fill="#94a3b8">
                {activeMetric === 'wss' ? Math.round(val) : val.toFixed(3)}
              </text>
            </g>
          );
        })}

        {/* Recommended K vertical highlight line */}
        <line
          x1={scaleX(recK)}
          y1={padding.top}
          x2={scaleX(recK)}
          y2={padding.top + innerH}
          stroke="#3b82f6"
          strokeWidth={1.5}
          strokeDasharray="4 3"
        />

        {/* Curve Line */}
        <path
          d={pathD}
          fill="none"
          stroke={activeMetric === 'wss' ? '#2563eb' : activeMetric === 'silhouette' ? '#0d9488' : '#7c3aed'}
          strokeWidth={2.5}
        />

        {/* Points */}
        {evaluations.map((e) => {
          const x = scaleX(e.k);
          const val = activeMetric === 'wss' ? e.wss : activeMetric === 'silhouette' ? e.silhouette : e.gap || 0;
          const y = scaleY(val);
          const isRec = e.k === recK;

          return (
            <g key={e.k} className="cursor-pointer">
              <circle
                cx={x}
                cy={y}
                r={isRec ? 6 : 4}
                fill={isRec ? '#2563eb' : '#ffffff'}
                stroke={isRec ? '#1e3a8a' : '#475569'}
                strokeWidth={isRec ? 2.5 : 2}
              />
              <title>{`K = ${e.k}\n${yLabel}: ${val.toFixed(3)}`}</title>
            </g>
          );
        })}

        {/* X Axis Ticks */}
        {ks.map((k) => {
          const x = scaleX(k);
          return (
            <g key={k}>
              <line x1={x} y1={padding.top + innerH} x2={x} y2={padding.top + innerH + 4} stroke="#cbd5e1" />
              <text
                x={x}
                y={padding.top + innerH + 16}
                textAnchor="middle"
                fontSize="10"
                fontWeight={k === recK ? 'bold' : 'normal'}
                fill={k === recK ? '#1d4ed8' : '#64748b'}
              >
                {k}
              </text>
            </g>
          );
        })}

        {/* Axis Labels */}
        <text
          x={padding.left + innerW / 2}
          y={chartHeight - 4}
          textAnchor="middle"
          fontSize="10"
          fill="#64748b"
          fontWeight="500"
        >
          Número de Clusters (K)
        </text>
      </svg>
    </div>
  );
};
