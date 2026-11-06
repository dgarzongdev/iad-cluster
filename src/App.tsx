import React, { useState, useEffect, useMemo } from 'react';
import { Navbar } from './components/Navbar';
import { StepNavigation, StepId, StepDef } from './components/StepNavigation';
import { Module1DataIngestion } from './components/Module1DataIngestion';
import { Module2EDA } from './components/Module2EDA';
import { Module3DataPreparation } from './components/Module3DataPreparation';
import { Module4Clustering } from './components/Module4Clustering';
import { Module5Validation } from './components/Module5Validation';
import { Module6Profiles } from './components/Module6Profiles';
import { Module7GeminiInsights } from './components/Module7GeminiInsights';
import { Module8ExecutiveDashboard } from './components/Module8ExecutiveDashboard';
import { Module9Export } from './components/Module9Export';
import { ApiKeyModal } from './components/ApiKeyModal';

import {
  ColumnMetadata,
  StandardizationMethod,
  MissingImputationMethod,
  TransformationHistory,
  KMeansResult,
  OptimalKAnalysis,
  BootstrapStabilityResult,
  GeminiInsights,
} from './types/analytics';

import { analyzeColumns, diagnoseDataQuality, applyLog1p } from './utils/statistics';
import { runKMeans } from './utils/kmeans';
import { evaluateOptimalK, runBootstrapStability } from './utils/validation';
import { generateTelecomReferenceDataset } from './utils/datasets';

import {
  Database,
  BarChart2,
  Wand2,
  GitFork,
  ShieldCheck,
  Users,
  Sparkles,
  LayoutDashboard,
  Download,
} from 'lucide-react';

export default function App() {
  // Global analytical state
  const [activeStep, setActiveStep] = useState<StepId>('ingestion');
  const [hasGeminiKey, setHasGeminiKey] = useState<boolean>(true);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [isApiKeyModalOpen, setIsApiKeyModalOpen] = useState<boolean>(false);
  const [userApiKey, setUserApiKey] = useState<string>(() => {
    return localStorage.getItem('clusteriq_user_gemini_token') || 'AIzaSyAW6fZ72_miXAupUrQUtzBn4WWnvk25UJA';
  });

  const handleSaveApiKey = (newKey: string) => {
    setUserApiKey(newKey);
    if (newKey) {
      localStorage.setItem('clusteriq_user_gemini_token', newKey);
      setHasGeminiKey(true);
    } else {
      localStorage.removeItem('clusteriq_user_gemini_token');
    }
  };

  // Module 1 State: Raw Data & Context
  const [rawRecords, setRawRecords] = useState<Record<string, any>[]>([]);
  const [datasetName, setDatasetName] = useState<string>('cellsegmentation.xlsx (Telecom Benchmark R)');
  const [sector, setSector] = useState<string>('Telecomunicaciones');
  const [analysisGoal, setAnalysisGoal] = useState<string>(
    'Segmentación de clientes de telecomunicaciones mediante K-Means para personalización de servicios convergentes y retención'
  );

  // Column metadata
  const columns: ColumnMetadata[] = useMemo(() => {
    return analyzeColumns(rawRecords);
  }, [rawRecords]);

  // Data Quality Score
  const qualityDiagnosis = useMemo(() => {
    return diagnoseDataQuality(rawRecords, columns);
  }, [rawRecords, columns]);

  // Module 3 State: Preparation & Transformations
  const [selectedFeatures, setSelectedFeatures] = useState<string[]>([
    'minutos_preferido',
    'adicionales',
    'minutos_no_preferido',
    'internet_gigas',
    'servicios',
    'equipo_dolares',
  ]);
  const [standardization, setStandardization] = useState<StandardizationMethod>('zscore');
  const [logTransformCols, setLogTransformCols] = useState<string[]>([
    'minutos_preferido',
    'adicionales',
    'minutos_no_preferido',
    'internet_gigas',
  ]);
  const [missingMethod, setMissingMethod] = useState<MissingImputationMethod>('median');
  const [transformedData, setTransformedData] = useState<Record<string, any>[]>([]);
  const [scaledMatrix, setScaledMatrix] = useState<number[][]>([]);
  const [transformationHistory, setTransformationHistory] = useState<TransformationHistory[]>([]);

  // Module 4 State: K-Means Clustering & Optimal K
  const [kmeansResult, setKmeansResult] = useState<KMeansResult | null>(null);
  const [optimalKAnalysis, setOptimalKAnalysis] = useState<OptimalKAnalysis | null>(null);

  // Module 5 State: Validation
  const [stabilityResult, setStabilityResult] = useState<BootstrapStabilityResult | null>(null);

  // Module 7 State: Gemini Insights
  const [geminiInsights, setGeminiInsights] = useState<GeminiInsights | null>(null);

  // Helper function to build transformed dataset and scaled matrix
  const buildScaledMatrix = (
    baseRecords: Record<string, any>[],
    features: string[],
    logCols: string[],
    scaleMethod: StandardizationMethod,
    imputeMethod: MissingImputationMethod
  ) => {
    // 1. Clone records
    let transformed: Record<string, any>[] = baseRecords.map((r) => ({ ...r }));

    // Inject 'servicios' derived variable if columns exist
    const hasParts =
      'fijo' in (baseRecords[0] || {}) &&
      'largadistancia' in (baseRecords[0] || {}) &&
      'internetcasa' in (baseRecords[0] || {});

    if (hasParts && features.includes('servicios')) {
      transformed = transformed.map((row) => ({
        ...row,
        servicios:
          (Number(row.fijo) || 0) +
          (Number(row.largadistancia) || 0) +
          (Number(row.internetcasa) || 0) +
          (Number(row.numoculto) || 0),
      }));
    }

    // 2. Impute missing
    features.forEach((feat) => {
      const validVals = transformed
        .map((r) => Number(r[feat]))
        .filter((v) => !isNaN(v) && v !== null && v !== undefined);

      if (validVals.length < transformed.length && validVals.length > 0) {
        const sum = validVals.reduce((a, b) => a + b, 0);
        const mean = sum / validVals.length;
        validVals.sort((a, b) => a - b);
        const median = validVals[Math.floor(validVals.length / 2)];

        transformed.forEach((row) => {
          if (row[feat] === null || row[feat] === undefined || isNaN(Number(row[feat]))) {
            row[feat] = imputeMethod === 'mean' ? mean : median;
          }
        });
      }
    });

    // 3. Log transform
    logCols.forEach((feat) => {
      if (features.includes(feat)) {
        transformed.forEach((row) => {
          const val = Number(row[feat]) || 0;
          row[feat] = applyLog1p(val);
        });
      }
    });

    // 4. Matrix & Scale
    const rawMatrix = transformed.map((row) =>
      features.map((feat) => Number(row[feat]) || 0)
    );

    const n = rawMatrix.length;
    const d = features.length;
    const matrix: number[][] = Array.from({ length: n }, () => new Array(d).fill(0));

    for (let j = 0; j < d; j++) {
      const colVals = rawMatrix.map((r) => r[j]);
      if (scaleMethod === 'zscore') {
        const mean = colVals.reduce((a, b) => a + b, 0) / n;
        const variance =
          colVals.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / (n > 1 ? n - 1 : 1);
        const std = Math.sqrt(variance) || 1;
        for (let i = 0; i < n; i++) {
          matrix[i][j] = (colVals[i] - mean) / std;
        }
      } else if (scaleMethod === 'minmax') {
        const min = Math.min(...colVals);
        const max = Math.max(...colVals);
        const range = max - min || 1;
        for (let i = 0; i < n; i++) {
          matrix[i][j] = (colVals[i] - min) / range;
        }
      } else {
        for (let i = 0; i < n; i++) {
          matrix[i][j] = colVals[i];
        }
      }
    }

    return { transformed, matrix };
  };

  // Initialize with reference dataset on mount
  useEffect(() => {
    // Check backend health
    fetch('/api/health')
      .then((res) => res.json())
      .then((data) => {
        if (data && typeof data.hasGeminiKey === 'boolean') {
          setHasGeminiKey(data.hasGeminiKey);
        }
      })
      .catch(() => {});

    // Load initial reference data
    loadBenchmarkDataset();
  }, []);

  const loadBenchmarkDataset = () => {
    setIsProcessing(true);
    const data = generateTelecomReferenceDataset();
    setRawRecords(data);
    setDatasetName('cellsegmentation.xlsx (Telecom Benchmark R)');
    setSector('Telecomunicaciones');
    setAnalysisGoal(
      'Segmentación de clientes de telecomunicaciones mediante K-Means para personalización de servicios convergentes y retención'
    );

    const rFeatures = [
      'minutos_preferido',
      'adicionales',
      'minutos_no_preferido',
      'internet_gigas',
      'servicios',
      'equipo_dolares',
    ];
    const rLogCols = [
      'minutos_preferido',
      'adicionales',
      'minutos_no_preferido',
      'internet_gigas',
    ];

    setSelectedFeatures(rFeatures);
    setLogTransformCols(rLogCols);
    setStandardization('zscore');
    setMissingMethod('median');

    const { transformed, matrix } = buildScaledMatrix(
      data,
      rFeatures,
      rLogCols,
      'zscore',
      'median'
    );
    setTransformedData(transformed);
    setScaledMatrix(matrix);

    // Run benchmark K-Means (K=5, nstart=10, seed=5935 matching R script)
    const km = runKMeans(matrix, transformed, rFeatures, 5, {
      nstart: 10,
      maxIter: 20,
      seed: 5935,
    });
    setKmeansResult(km);

    // Run quick optimal K
    const optK = evaluateOptimalK(matrix, transformed, rFeatures, [2, 8], {
      wssSeed: 5935,
      aswSeed: 2,
      gapSeed: 42,
    });
    setOptimalKAnalysis(optK);

    // Run quick bootstrap stability (B=10, seed=5 matching R script)
    const stab = runBootstrapStability(matrix, transformed, rFeatures, 5, km.clusterAssignments, {
      iterations: 10,
      seed: 5,
    });
    setStabilityResult(stab);

    setIsProcessing(false);
  };

  // Handler for custom dataset upload or selection
  const handleDatasetLoaded = (
    newData: Record<string, any>[],
    name: string,
    newSector: string
  ) => {
    setIsProcessing(true);
    setRawRecords(newData);
    setDatasetName(name);
    setSector(newSector);

    // Reset downstream models
    setKmeansResult(null);
    setOptimalKAnalysis(null);
    setStabilityResult(null);
    setGeminiInsights(null);

    // Auto-select initial numeric features
    const meta = analyzeColumns(newData);
    const numCols = meta
      .filter((c) => c.isNumeric && c.role !== 'identifier')
      .slice(0, 6)
      .map((c) => c.name);

    setSelectedFeatures(numCols);
    setLogTransformCols([]);
    setStandardization('zscore');

    const { transformed, matrix } = buildScaledMatrix(
      newData,
      numCols,
      [],
      'zscore',
      'median'
    );
    setTransformedData(transformed);
    setScaledMatrix(matrix);

    setIsProcessing(false);
    setActiveStep('eda');
  };

  const handleUpdateMetadata = (newSector: string, newGoal: string) => {
    setSector(newSector);
    setAnalysisGoal(newGoal);
  };

  const handleUpdatePrepConfig = (config: {
    selectedFeatures: string[];
    standardization: StandardizationMethod;
    logTransformCols: string[];
    missingMethod: MissingImputationMethod;
    transformedData: Record<string, any>[];
    scaledMatrix: number[][];
    history: TransformationHistory[];
  }) => {
    setSelectedFeatures(config.selectedFeatures);
    setStandardization(config.standardization);
    setLogTransformCols(config.logTransformCols);
    setMissingMethod(config.missingMethod);
    setTransformedData(config.transformedData);
    setScaledMatrix(config.scaledMatrix);
    setTransformationHistory(config.history);

    // Clear previous results as data representation changed
    setKmeansResult(null);
    setStabilityResult(null);
    setGeminiInsights(null);
  };

  // Sequential Step Definitions
  const steps: StepDef[] = [
    {
      id: 'ingestion',
      number: 1,
      label: 'Datos & Carga',
      shortLabel: 'Datos',
      icon: Database,
      isReady: true,
      isCompleted: rawRecords.length > 0,
    },
    {
      id: 'eda',
      number: 2,
      label: 'Exploración (EDA)',
      shortLabel: 'EDA',
      icon: BarChart2,
      isReady: rawRecords.length > 0,
      isCompleted: rawRecords.length > 0,
    },
    {
      id: 'prep',
      number: 3,
      label: 'Preparación & Transformación',
      shortLabel: 'Preparación',
      icon: Wand2,
      isReady: rawRecords.length > 0,
      isCompleted: scaledMatrix.length > 0,
    },
    {
      id: 'clustering',
      number: 4,
      label: 'Clustering K-Means',
      shortLabel: 'K-Means',
      icon: GitFork,
      isReady: scaledMatrix.length > 0,
      isCompleted: kmeansResult !== null,
    },
    {
      id: 'validation',
      number: 5,
      label: 'Validación & Estabilidad',
      shortLabel: 'Validación',
      icon: ShieldCheck,
      isReady: kmeansResult !== null,
      isCompleted: stabilityResult !== null,
    },
    {
      id: 'profiles',
      number: 6,
      label: 'Perfiles de Segmento',
      shortLabel: 'Perfiles',
      icon: Users,
      isReady: kmeansResult !== null,
      isCompleted: kmeansResult !== null,
    },
    {
      id: 'gemini',
      number: 7,
      label: 'Gemini AI Insights',
      shortLabel: 'Gemini AI',
      icon: Sparkles,
      isReady: kmeansResult !== null,
      isCompleted: geminiInsights !== null,
    },
    {
      id: 'dashboard',
      number: 8,
      label: 'Dashboard Ejecutivo',
      shortLabel: 'Dashboard',
      icon: LayoutDashboard,
      isReady: kmeansResult !== null,
      isCompleted: kmeansResult !== null,
    },
    {
      id: 'export',
      number: 9,
      label: 'Exportación & Informes',
      shortLabel: 'Exportar',
      icon: Download,
      isReady: kmeansResult !== null,
      isCompleted: false,
    },
  ];

  return (
    <div className="min-h-screen bg-slate-100/70 text-slate-900 flex flex-col font-sans antialiased selection:bg-blue-600 selection:text-white">
      {/* Top Application Header */}
      <Navbar
        currentDatasetName={datasetName}
        rowCount={rawRecords.length}
        sector={sector}
        hasGeminiKey={hasGeminiKey}
        onLoadReferencePreset={loadBenchmarkDataset}
        onResetAll={() => setActiveStep('ingestion')}
        onOpenApiKeyModal={() => setIsApiKeyModalOpen(true)}
        isProcessing={isProcessing}
      />

      {/* Sequential Step Progress Bar */}
      <StepNavigation
        steps={steps}
        activeStep={activeStep}
        onSelectStep={(stepId) => setActiveStep(stepId)}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeStep === 'ingestion' && (
          <Module1DataIngestion
            currentData={rawRecords}
            columns={columns}
            activeSector={sector}
            analysisGoal={analysisGoal}
            datasetName={datasetName}
            onDatasetLoaded={handleDatasetLoaded}
            onUpdateMetadata={handleUpdateMetadata}
            onProceedToNextStep={() => setActiveStep('eda')}
          />
        )}

        {activeStep === 'eda' && (
          <Module2EDA
            data={rawRecords}
            columns={columns}
            onProceedToPrep={() => setActiveStep('prep')}
          />
        )}

        {activeStep === 'prep' && (
          <Module3DataPreparation
            rawRecords={rawRecords}
            columns={columns}
            selectedFeatures={selectedFeatures}
            standardization={standardization}
            logTransformCols={logTransformCols}
            missingMethod={missingMethod}
            onUpdatePrepConfig={handleUpdatePrepConfig}
            onProceedToClustering={() => setActiveStep('clustering')}
          />
        )}

        {activeStep === 'clustering' && (
          <Module4Clustering
            scaledMatrix={scaledMatrix}
            rawRecords={transformedData.length > 0 ? transformedData : rawRecords}
            features={selectedFeatures}
            kmeansResult={kmeansResult}
            optimalKAnalysis={optimalKAnalysis}
            onRunClustering={(res, optAnalysis) => {
              setKmeansResult(res);
              setOptimalKAnalysis(optAnalysis);
            }}
            onProceedToValidation={() => setActiveStep('validation')}
          />
        )}

        {activeStep === 'validation' && kmeansResult && (
          <Module5Validation
            scaledMatrix={scaledMatrix}
            rawRecords={transformedData.length > 0 ? transformedData : rawRecords}
            features={selectedFeatures}
            kmeansResult={kmeansResult}
            stabilityResult={stabilityResult}
            onRunBootstrap={(res) => setStabilityResult(res)}
            onProceedToProfiles={() => setActiveStep('profiles')}
          />
        )}

        {activeStep === 'profiles' && kmeansResult && (
          <Module6Profiles
            kmeansResult={kmeansResult}
            rawRecords={transformedData.length > 0 ? transformedData : rawRecords}
            columns={columns}
            features={selectedFeatures}
            sector={sector}
            onProceedToGemini={() => setActiveStep('gemini')}
          />
        )}

        {activeStep === 'gemini' && kmeansResult && (
          <Module7GeminiInsights
            kmeansResult={kmeansResult}
            stabilityResult={stabilityResult}
            features={selectedFeatures}
            sector={sector}
            analysisGoal={analysisGoal}
            insights={geminiInsights}
            userApiKey={userApiKey}
            onOpenApiKeyModal={() => setIsApiKeyModalOpen(true)}
            onInsightsGenerated={(ins) => setGeminiInsights(ins)}
            onProceedToDashboard={() => setActiveStep('dashboard')}
          />
        )}

        {activeStep === 'dashboard' && kmeansResult && (
          <Module8ExecutiveDashboard
            kmeansResult={kmeansResult}
            stabilityResult={stabilityResult}
            geminiInsights={geminiInsights}
            features={selectedFeatures}
            sector={sector}
            totalRecords={rawRecords.length}
            dataQualityScore={qualityDiagnosis.overallScore}
            onProceedToExport={() => setActiveStep('export')}
          />
        )}

        {activeStep === 'export' && kmeansResult && (
          <Module9Export
            rawRecords={transformedData.length > 0 ? transformedData : rawRecords}
            kmeansResult={kmeansResult}
            stabilityResult={stabilityResult}
            geminiInsights={geminiInsights}
            features={selectedFeatures}
            sector={sector}
            datasetName={datasetName}
            standardizationMethod={standardization}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-4 text-xs text-slate-500 text-center">
        <div className="max-w-7xl mx-auto px-4 flex flex-wrap justify-between items-center gap-2">
          <span>
            ClusterIQ Platform • Analítica Avanzada, K-Means Clustering & Gemini AI
          </span>
          <span className="font-mono text-slate-400">
            Reproducibilidad R (02. K_means.R) & Metodología de Ciencia de Datos
          </span>
        </div>
      </footer>

      {/* Modal for User API Key Configuration */}
      <ApiKeyModal
        isOpen={isApiKeyModalOpen}
        onClose={() => setIsApiKeyModalOpen(false)}
        currentApiKey={userApiKey}
        onSaveApiKey={handleSaveApiKey}
      />
    </div>
  );
}
