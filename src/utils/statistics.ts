import {
  ColumnMetadata,
  NumericStats,
  CategoricalStats,
  QualityDiagnosis,
  QualityIssue,
  DataType,
} from '../types/analytics';

/**
 * Detect column data type based on sample values and cardinality
 */
export function inferColumnType(values: any[], columnName: string): DataType {
  const nonNull = values.filter((v) => v !== null && v !== undefined && v !== '');
  if (nonNull.length === 0) return 'nominal';

  const lowerName = columnName.toLowerCase();
  if (
    lowerName.includes('id') ||
    lowerName.includes('codigo') ||
    lowerName.includes('rut') ||
    lowerName.includes('dni') ||
    lowerName.includes('key')
  ) {
    const uniqueRatio = new Set(nonNull).size / nonNull.length;
    if (uniqueRatio > 0.8) return 'identifier';
  }

  // Check date
  const isDate = nonNull.slice(0, 20).every((v) => {
    if (v instanceof Date) return true;
    if (typeof v === 'string') {
      const parsed = Date.parse(v);
      return !isNaN(parsed) && (v.includes('-') || v.includes('/'));
    }
    return false;
  });
  if (isDate) return 'date';

  // Check numeric
  const numericCount = nonNull.filter((v) => {
    if (typeof v === 'number') return !isNaN(v);
    if (typeof v === 'string') {
      const trimmed = v.trim();
      return trimmed !== '' && !isNaN(Number(trimmed));
    }
    return false;
  }).length;

  if (numericCount / nonNull.length > 0.9) {
    const numbers = nonNull.map((v) => Number(v));
    const allIntegers = numbers.every((n) => Number.isInteger(n));
    const uniqueValues = new Set(numbers).size;
    if (allIntegers && uniqueValues < 15 && uniqueValues < nonNull.length * 0.1) {
      return 'discrete';
    }
    return 'continuous';
  }

  // Categorical
  const uniqueCount = new Set(nonNull).size;
  if (uniqueCount <= 10) return 'ordinal';
  return 'nominal';
}

/**
 * Generate metadata for all columns in a dataset
 */
export function analyzeColumns(data: Record<string, any>[]): ColumnMetadata[] {
  if (!data || data.length === 0) return [];

  const columnNames = Object.keys(data[0]);
  const totalRows = data.length;

  return columnNames.map((name) => {
    const rawValues = data.map((row) => row[name]);
    const nonNull = rawValues.filter((v) => v !== null && v !== undefined && v !== '');
    const missingCount = totalRows - nonNull.length;
    const missingPercentage = (missingCount / totalRows) * 100;
    const uniqueSet = new Set(nonNull);
    const uniqueCount = uniqueSet.size;
    const isConstant = uniqueCount <= 1 && totalRows > 1;

    const detectedType = inferColumnType(rawValues, name);
    const isNumeric = detectedType === 'continuous' || detectedType === 'discrete';

    return {
      name,
      originalName: name,
      type: detectedType,
      role: detectedType === 'identifier' ? 'identifier' : isNumeric ? 'feature' : 'metadata',
      sampleValues: nonNull.slice(0, 5),
      missingCount,
      missingPercentage,
      uniqueCount,
      isNumeric,
      isConstant,
    };
  });
}

/**
 * Calculate full descriptive statistics for a numeric column
 */
export function calculateNumericStats(values: (number | null | undefined)[]): NumericStats {
  const valid = values
    .filter((v): v is number => v !== null && v !== undefined && !isNaN(v))
    .sort((a, b) => a - b);

  const count = valid.length;
  const missing = values.length - count;

  if (count === 0) {
    return {
      count: 0,
      missing,
      mean: 0,
      median: 0,
      mode: null,
      stdDev: 0,
      variance: 0,
      min: 0,
      max: 0,
      q1: 0,
      q3: 0,
      iqr: 0,
      cv: 0,
      skewness: 0,
      kurtosis: 0,
      outliersIqrCount: 0,
      outliersZCount: 0,
    };
  }

  const sum = valid.reduce((acc, val) => acc + val, 0);
  const mean = sum / count;

  // Median and Quartiles
  const getPercentile = (p: number) => {
    const index = (valid.length - 1) * p;
    const lower = Math.floor(index);
    const upper = Math.ceil(index);
    const weight = index - lower;
    return valid[lower] * (1 - weight) + valid[upper] * weight;
  };

  const median = getPercentile(0.5);
  const q1 = getPercentile(0.25);
  const q3 = getPercentile(0.75);
  const iqr = q3 - q1;
  const min = valid[0];
  const max = valid[valid.length - 1];

  // Mode
  const freqMap: Record<number, number> = {};
  let maxFreq = 0;
  let mode: number | null = null;
  valid.forEach((val) => {
    freqMap[val] = (freqMap[val] || 0) + 1;
    if (freqMap[val] > maxFreq) {
      maxFreq = freqMap[val];
      mode = val;
    }
  });
  if (maxFreq === 1 && count > 1) mode = null;

  // Variance & Standard Deviation (sample variance, n-1)
  const sumSqDiff = valid.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0);
  const variance = count > 1 ? sumSqDiff / (count - 1) : 0;
  const stdDev = Math.sqrt(variance);

  // Coefficient of Variation
  const cv = mean !== 0 ? stdDev / Math.abs(mean) : 0;

  // Skewness (Fisher-Pearson standardized third moment)
  let skewness = 0;
  if (count > 2 && stdDev > 0) {
    const sumCubed = valid.reduce((acc, val) => acc + Math.pow((val - mean) / stdDev, 3), 0);
    skewness = (count / ((count - 1) * (count - 2))) * sumCubed;
  }

  // Kurtosis (excess kurtosis: normal distribution = 0)
  let kurtosis = 0;
  if (count > 3 && stdDev > 0) {
    const sumFourth = valid.reduce((acc, val) => acc + Math.pow((val - mean) / stdDev, 4), 0);
    const n = count;
    const term1 = (n * (n + 1)) / ((n - 1) * (n - 2) * (n - 3));
    const term2 = (3 * Math.pow(n - 1, 2)) / ((n - 2) * (n - 3));
    kurtosis = term1 * sumFourth - term2;
  }

  // Outliers IQR
  const iqrLower = q1 - 1.5 * iqr;
  const iqrUpper = q3 + 1.5 * iqr;
  const outliersIqrCount = valid.filter((v) => v < iqrLower || v > iqrUpper).length;

  // Outliers Z-score (|z| > 3)
  const outliersZCount = stdDev > 0
    ? valid.filter((v) => Math.abs((v - mean) / stdDev) > 3).length
    : 0;

  return {
    count,
    missing,
    mean,
    median,
    mode,
    stdDev,
    variance,
    min,
    max,
    q1,
    q3,
    iqr,
    cv,
    skewness,
    kurtosis,
    outliersIqrCount,
    outliersZCount,
  };
}

/**
 * Calculate categorical statistics
 */
export function calculateCategoricalStats(values: any[]): CategoricalStats {
  const valid = values.filter((v) => v !== null && v !== undefined && v !== '');
  const missing = values.length - valid.length;
  const total = valid.length;

  const counts: Record<string, number> = {};
  valid.forEach((v) => {
    const key = String(v).trim();
    counts[key] = (counts[key] || 0) + 1;
  });

  const uniqueCount = Object.keys(counts).length;
  const frequencies = Object.entries(counts)
    .map(([category, count]) => ({
      category,
      count,
      percentage: total > 0 ? (count / total) * 100 : 0,
    }))
    .sort((a, b) => b.count - a.count);

  const predominantCategory = frequencies.length > 0 ? frequencies[0].category : 'N/A';

  return {
    count: total,
    missing,
    uniqueCount,
    frequencies,
    predominantCategory,
  };
}

/**
 * Compute Pearson correlation between two numeric arrays
 */
export function pearsonCorrelation(x: number[], y: number[]): number {
  const n = Math.min(x.length, y.length);
  if (n < 2) return 0;

  let sumX = 0;
  let sumY = 0;
  let sumX2 = 0;
  let sumY2 = 0;
  let sumXY = 0;

  for (let i = 0; i < n; i++) {
    const xi = x[i];
    const yi = y[i];
    sumX += xi;
    sumY += yi;
    sumX2 += xi * xi;
    sumY2 += yi * yi;
    sumXY += xi * yi;
  }

  const numerator = n * sumXY - sumX * sumY;
  const denominator = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY));

  if (denominator === 0 || isNaN(denominator)) return 0;
  const r = numerator / denominator;
  return Math.max(-1, Math.min(1, r));
}

/**
 * Compute Pearson correlation matrix for multiple numeric variables
 */
export function computeCorrelationMatrix(
  data: Record<string, any>[],
  columns: string[]
): { columns: string[]; matrix: number[][] } {
  const matrix: number[][] = [];
  const colData = columns.map((col) =>
    data.map((row) => Number(row[col]) || 0)
  );

  for (let i = 0; i < columns.length; i++) {
    matrix[i] = [];
    for (let j = 0; j < columns.length; j++) {
      if (i === j) {
        matrix[i][j] = 1.0;
      } else if (j < i) {
        matrix[i][j] = matrix[j][i];
      } else {
        matrix[i][j] = pearsonCorrelation(colData[i], colData[j]);
      }
    }
  }

  return { columns, matrix };
}

/**
 * Comprehensive Data Quality Diagnosis
 */
export function diagnoseDataQuality(
  data: Record<string, any>[],
  columns: ColumnMetadata[]
): QualityDiagnosis {
  const totalRows = data.length;
  const totalColumns = columns.length;

  if (totalRows === 0 || totalColumns === 0) {
    return {
      overallScore: 0,
      totalRows: 0,
      totalColumns: 0,
      duplicateRowsCount: 0,
      duplicateRowsPercent: 0,
      totalMissingCells: 0,
      missingCellsPercent: 0,
      issues: [],
      recommendations: ['Cargue un dataset con registros para comenzar el diagnóstico.'],
    };
  }

  // Duplicates check
  const rowSignatures = new Set<string>();
  let duplicateRowsCount = 0;
  data.forEach((row) => {
    const sig = Object.values(row).join('|');
    if (rowSignatures.has(sig)) {
      duplicateRowsCount++;
    } else {
      rowSignatures.add(sig);
    }
  });
  const duplicateRowsPercent = (duplicateRowsCount / totalRows) * 100;

  // Missing values
  let totalMissingCells = 0;
  const totalCells = totalRows * totalColumns;
  const issues: QualityIssue[] = [];

  columns.forEach((col) => {
    totalMissingCells += col.missingCount;

    if (col.missingPercentage > 30) {
      issues.push({
        column: col.name,
        type: 'missing',
        severity: 'high',
        description: `La columna '${col.name}' tiene ${col.missingPercentage.toFixed(1)}% de datos faltantes (${col.missingCount} registros).`,
        recommendation: 'Evaluar descartar esta variable del clustering o aplicar imputación avanzada.',
      });
    } else if (col.missingPercentage > 5) {
      issues.push({
        column: col.name,
        type: 'missing',
        severity: 'medium',
        description: `La columna '${col.name}' tiene ${col.missingPercentage.toFixed(1)}% de valores nulos.`,
        recommendation: 'Aplicar imputación por media, mediana o moda en la etapa de preparación.',
      });
    }

    if (col.isConstant) {
      issues.push({
        column: col.name,
        type: 'constant',
        severity: 'high',
        description: `La columna '${col.name}' presenta varianza nula (todos los valores son iguales o nulos).`,
        recommendation: 'Excluir esta variable antes de modelar para evitar distorsiones matemáticas.',
      });
    }

    // Check skewness and outliers for numeric features
    if (col.isNumeric) {
      const values = data.map((r) => Number(r[col.name]));
      const stats = calculateNumericStats(values);

      if (Math.abs(stats.skewness) > 2) {
        issues.push({
          column: col.name,
          type: 'high_skewness',
          severity: 'medium',
          description: `Distribución altamente asimétrica (Asimetría = ${stats.skewness.toFixed(2)}).`,
          recommendation: 'Recomendado aplicar transformación logarítmica log(1+x) o Yeo-Johnson.',
        });
      }

      if (stats.outliersIqrCount > totalRows * 0.08) {
        issues.push({
          column: col.name,
          type: 'outliers',
          severity: 'medium',
          description: `Se detectaron ${stats.outliersIqrCount} posibles valores atípicos (${((stats.outliersIqrCount / totalRows) * 100).toFixed(1)}%).`,
          recommendation: 'Revisar la escala o aplicar winsorización / recorte por IQR.',
        });
      }
    }
  });

  if (duplicateRowsCount > 0) {
    issues.push({
      column: '(Dataset global)',
      type: 'duplicates',
      severity: duplicateRowsPercent > 5 ? 'high' : 'medium',
      description: `Se encontraron ${duplicateRowsCount} registros exactamente duplicados (${duplicateRowsPercent.toFixed(1)}%).`,
      recommendation: 'Eliminar registros redundantes para que no sesguen los centroides de K-Means.',
    });
  }

  const missingCellsPercent = (totalMissingCells / totalCells) * 100;

  // Calculate Quality Score (0-100)
  let score = 100;
  score -= Math.min(35, missingCellsPercent * 3);
  score -= Math.min(25, duplicateRowsPercent * 2);
  const highSeverityCount = issues.filter((i) => i.severity === 'high').length;
  const medSeverityCount = issues.filter((i) => i.severity === 'medium').length;
  score -= highSeverityCount * 8;
  score -= medSeverityCount * 3;
  const overallScore = Math.max(10, Math.min(100, Math.round(score)));

  const recommendations: string[] = [];
  if (missingCellsPercent > 0) {
    recommendations.push(
      `Tratar los ${totalMissingCells} valores nulos mediante el módulo de preparación de datos.`
    );
  }
  if (duplicateRowsCount > 0) {
    recommendations.push(
      `Remover los ${duplicateRowsCount} registros duplicados para asegurar representatividad estadística.`
    );
  }
  if (issues.some((i) => i.type === 'high_skewness')) {
    recommendations.push(
      'Aplicar transformación logarítmica log(1+x) a variables de consumo/minutos altamente asimétricas como en el script de R.'
    );
  }
  if (issues.some((i) => i.type === 'constant')) {
    recommendations.push('Desmarcar variables de varianza cero del conjunto de features de clustering.');
  }
  recommendations.push(
    'Estandarizar todas las variables seleccionadas con Z-Score o Min-Max antes de ejecutar K-Means para igualar pesos métricos.'
  );

  return {
    overallScore,
    totalRows,
    totalColumns,
    duplicateRowsCount,
    duplicateRowsPercent,
    totalMissingCells,
    missingCellsPercent,
    issues,
    recommendations,
  };
}

/**
 * Apply mathematical transformations safely
 */
export function applyLog1p(val: number): number {
  if (isNaN(val) || val === null || val === undefined) return 0;
  // mathematically valid for x >= -1, for business data assume x >= 0
  const cleanVal = Math.max(0, val);
  return Math.log(1 + cleanVal);
}

export function applyStandardScaler(values: number[]): { scaled: number[]; mean: number; std: number } {
  const n = values.length;
  if (n === 0) return { scaled: [], mean: 0, std: 1 };

  const mean = values.reduce((sum, v) => sum + v, 0) / n;
  const variance = values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / (n > 1 ? n - 1 : 1);
  const std = Math.sqrt(variance) || 1;

  const scaled = values.map((v) => (v - mean) / std);
  return { scaled, mean, std };
}

export function applyMinMax(values: number[]): { scaled: number[]; min: number; max: number } {
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const scaled = values.map((v) => (v - min) / range);
  return { scaled, min, max };
}

export function applyRobustScaler(values: number[]): { scaled: number[]; median: number; iqr: number } {
  const sorted = [...values].sort((a, b) => a - b);
  const n = sorted.length;
  const median = n % 2 === 0 ? (sorted[n / 2 - 1] + sorted[n / 2]) / 2 : sorted[Math.floor(n / 2)];
  const q1 = sorted[Math.floor(n * 0.25)];
  const q3 = sorted[Math.floor(n * 0.75)];
  const iqr = q3 - q1 || 1;
  const scaled = values.map((v) => (v - median) / iqr);
  return { scaled, median, iqr };
}
