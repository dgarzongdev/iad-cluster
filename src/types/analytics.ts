export type DataType =
  | 'continuous'
  | 'discrete'
  | 'nominal'
  | 'ordinal'
  | 'date'
  | 'identifier';

export type VariableRole = 'feature' | 'metadata' | 'identifier' | 'target' | 'excluded';

export interface ColumnMetadata {
  name: string;
  originalName: string;
  type: DataType;
  role: VariableRole;
  sampleValues: any[];
  missingCount: number;
  missingPercentage: number;
  uniqueCount: number;
  isNumeric: boolean;
  isConstant: boolean;
}

export interface NumericStats {
  count: number;
  missing: number;
  mean: number;
  median: number;
  mode: number | null;
  stdDev: number;
  variance: number;
  min: number;
  max: number;
  q1: number;
  q3: number;
  iqr: number;
  cv: number; // Coefficient of Variation (stdDev / mean)
  skewness: number; // Asimetría
  kurtosis: number; // Curtosis
  outliersIqrCount: number;
  outliersZCount: number;
}

export interface CategoricalStats {
  count: number;
  missing: number;
  uniqueCount: number;
  frequencies: { category: string; count: number; percentage: number }[];
  predominantCategory: string;
}

export interface QualityIssue {
  column: string;
  type: 'missing' | 'outliers' | 'constant' | 'high_skewness' | 'duplicates' | 'format';
  severity: 'low' | 'medium' | 'high';
  description: string;
  recommendation: string;
}

export interface QualityDiagnosis {
  overallScore: number; // 0 - 100
  totalRows: number;
  totalColumns: number;
  duplicateRowsCount: number;
  duplicateRowsPercent: number;
  totalMissingCells: number;
  missingCellsPercent: number;
  issues: QualityIssue[];
  recommendations: string[];
}

export type StandardizationMethod = 'none' | 'zscore' | 'minmax' | 'robust';
export type OutlierTreatment = 'none' | 'log1p' | 'winsorize' | 'iqr_clip';
export type MissingImputationMethod = 'none' | 'drop' | 'mean' | 'median' | 'mode';

export interface TransformationRule {
  column: string;
  missingImputation: MissingImputationMethod;
  outlierTreatment: OutlierTreatment;
  standardization: StandardizationMethod;
  applied: boolean;
}

export interface DerivedVariable {
  id: string;
  name: string;
  formula: string; // e.g. "fijo + largadistancia + internetcasa + numoculto"
  sourceColumns: string[];
  operation: 'sum' | 'multiply' | 'divide' | 'custom';
  description: string;
}

export interface TransformationHistory {
  timestamp: string;
  action: string;
  details: string;
}

export interface OptimalKResult {
  k: number;
  wss: number;
  silhouette: number;
  gap?: number;
  gapSe?: number;
}

export interface OptimalKAnalysis {
  elbowRecommendedK: number;
  silhouetteRecommendedK: number;
  gapRecommendedK: number;
  evaluations: OptimalKResult[];
  explanation: string;
}

export interface ClusterSummary {
  id: number;
  name: string;
  size: number;
  percentage: number;
  wss: number;
  centroidsRaw: Record<string, number>;
  centroidsScaled: Record<string, number>;
  stabilityScore?: number;
  stabilityLabel?: 'Muy Buena' | 'Buena' | 'Deficiente';
  keyDifferentiators: {
    feature: string;
    clusterMean: number;
    globalMean: number;
    zScoreDiff: number;
    direction: 'higher' | 'lower';
  }[];
}

export interface KMeansResult {
  k: number;
  nstart: number;
  maxIter: number;
  seed: number;
  convergedIterations: number;
  clusterAssignments: number[]; // cluster index 0..k-1 for each row
  clusters: ClusterSummary[];
  totalWss: number;
  totalSs: number;
  betweenSs: number;
  explainedVarianceRatio: number; // betweenSs / totalSs
  silhouetteScore: number;
  daviesBouldinIndex: number;
  calinskiHarabaszIndex: number;
  pcaCoords: { x: number; y: number; cluster: number; id: number }[];
  pcaVarianceExplained: [number, number]; // [PC1 %, PC2 %]
  executionTimeMs: number;
}

export interface BootstrapStabilityResult {
  iterations: number;
  seed: number;
  clusterStabilities: {
    clusterId: number;
    stability: number;
    classification: 'Muy Buena' | 'Buena' | 'Deficiente';
  }[];
  averageStability: number;
  overallClassification: 'Muy Buena' | 'Buena' | 'Deficiente';
  warningMessage?: string;
}

export interface GeminiInsights {
  executiveOverview: string;
  generalInsights: {
    title: string;
    description: string;
    evidence: string;
    impact: string;
  }[];
  segmentProfiles: {
    clusterId: number;
    segmentName: string;
    personaDescription: string;
    consumptionHabits?: string;
    priceSensitivity?: string;
    crossSellOpportunities: string;
    upsellOpportunities?: string;
    churnRisk?: string;
    retentionStrategy: string;
    recommendedChannels?: string;
  }[];
  commercialIntelligence: {
    title: string;
    strategicValue: string;
    opportunity: string;
    targetSegments: string;
  }[];
  strategicRecommendations: {
    title: string;
    finding: string;
    statisticalEvidence: string;
    businessInterpretation: string;
    impactLevel: 'Alto' | 'Medio' | 'Bajo';
    recommendedAction: string;
    measurableKPI: string;
  }[];
}
