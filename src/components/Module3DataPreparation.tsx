import React, { useState, useMemo } from 'react';
import {
  Wand2,
  CheckCircle2,
  ArrowRight,
  Sparkles,
  Calculator,
  RotateCcw,
  SlidersHorizontal,
  Info,
  CheckSquare,
  Square,
  HelpCircle,
} from 'lucide-react';
import {
  ColumnMetadata,
  StandardizationMethod,
  OutlierTreatment,
  MissingImputationMethod,
  TransformationHistory,
} from '../types/analytics';
import { applyLog1p } from '../utils/statistics';

interface Module3DataPreparationProps {
  rawRecords: Record<string, any>[];
  columns: ColumnMetadata[];
  selectedFeatures: string[];
  standardization: StandardizationMethod;
  logTransformCols: string[];
  missingMethod: MissingImputationMethod;
  onUpdatePrepConfig: (config: {
    selectedFeatures: string[];
    standardization: StandardizationMethod;
    logTransformCols: string[];
    missingMethod: MissingImputationMethod;
    transformedData: Record<string, any>[];
    scaledMatrix: number[][];
    history: TransformationHistory[];
  }) => void;
  onProceedToClustering: () => void;
}

export const Module3DataPreparation: React.FC<Module3DataPreparationProps> = ({
  rawRecords,
  columns,
  selectedFeatures,
  standardization,
  logTransformCols,
  missingMethod,
  onUpdatePrepConfig,
  onProceedToClustering,
}) => {
  const numericColumns = useMemo(
    () => columns.filter((c) => c.isNumeric && c.role !== 'identifier'),
    [columns]
  );

  // Local state for configuration
  const [currentSelected, setCurrentSelected] = useState<string[]>(
    selectedFeatures.length > 0
      ? selectedFeatures
      : numericColumns.slice(0, 6).map((c) => c.name)
  );
  const [currentStd, setCurrentStd] = useState<StandardizationMethod>(standardization || 'zscore');
  const [currentLogCols, setCurrentLogCols] = useState<string[]>(logTransformCols || []);
  const [currentMissing, setCurrentMissing] = useState<MissingImputationMethod>(missingMethod || 'median');

  // Custom derived feature state
  const [newVarName, setNewVarName] = useState('servicios');
  const [selectedSumCols, setSelectedSumCols] = useState<string[]>([
    'fijo',
    'largadistancia',
    'internetcasa',
    'numoculto',
  ]);
  const [derivedLog, setDerivedLog] = useState<string[]>([]);

  // Check if telecom R script columns exist
  const hasTelecomCols = useMemo(() => {
    const names = columns.map((c) => c.name.toLowerCase());
    return (
      names.includes('fijo') &&
      names.includes('largadistancia') &&
      names.includes('internetcasa') &&
      names.includes('minutos_preferido')
    );
  }, [columns]);

  // Handle 1-Click R Script Preset
  const handleApplyRPipeline = () => {
    // 1. Replicate derived 'servicios' = fijo + largadistancia + internetcasa + numoculto
    // 2. Select: minutos_preferido, adicionales, minutos_no_preferido, internet_gigas, servicios, equipo_dolares
    // 3. log(1+x) on the first 4
    // 4. Z-score on all 6
    const logCols = [
      'minutos_preferido',
      'adicionales',
      'minutos_no_preferido',
      'internet_gigas',
    ].filter((c) => columns.some((col) => col.name === c));

    const allFeatures = [
      ...logCols,
      'servicios',
      'equipo_dolares',
    ].filter((c) => c === 'servicios' || columns.some((col) => col.name === c));

    setCurrentLogCols(logCols);
    setCurrentSelected(allFeatures);
    setCurrentStd('zscore');
    setCurrentMissing('median');

    applyTransformations(allFeatures, logCols, 'zscore', 'median', true);
  };

  // Toggle variable selection
  const toggleFeature = (colName: string) => {
    if (currentSelected.includes(colName)) {
      if (currentSelected.length > 2) {
        setCurrentSelected(currentSelected.filter((c) => c !== colName));
      }
    } else {
      setCurrentSelected([...currentSelected, colName]);
    }
  };

  // Toggle log transform
  const toggleLog = (colName: string) => {
    if (currentLogCols.includes(colName)) {
      setCurrentLogCols(currentLogCols.filter((c) => c !== colName));
    } else {
      setCurrentLogCols([...currentLogCols, colName]);
    }
  };

  // Create derived variable
  const handleCreateDerivedVariable = () => {
    if (!newVarName || selectedSumCols.length < 2) return;
    setDerivedLog([...derivedLog, `Variable derivada '${newVarName}' creada mediante suma de: ${selectedSumCols.join(' + ')}`]);
    if (!currentSelected.includes(newVarName)) {
      setCurrentSelected([...currentSelected, newVarName]);
    }
  };

  // Apply transformations and construct final matrix
  const applyTransformations = (
    features = currentSelected,
    logCols = currentLogCols,
    scaleMethod = currentStd,
    imputeMethod = currentMissing,
    injectServicios = false
  ) => {
    // 1. Clone records
    let transformed: Record<string, any>[] = rawRecords.map((r) => ({ ...r }));

    // Inject 'servicios' derived variable if needed or if user defined it
    if (injectServicios || derivedLog.length > 0 || features.includes('servicios')) {
      transformed = transformed.map((row) => {
        const fijo = Number(row.fijo) || 0;
        const larga = Number(row.largadistancia) || 0;
        const net = Number(row.internetcasa) || 0;
        const oculto = Number(row.numoculto) || 0;
        return {
          ...row,
          servicios: fijo + larga + net + oculto,
        };
      });
    }

    // 2. Impute missing values if needed
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

    // 3. Apply log(1+x) transformations
    logCols.forEach((feat) => {
      if (features.includes(feat)) {
        transformed.forEach((row) => {
          const val = Number(row[feat]) || 0;
          row[feat] = applyLog1p(val);
        });
      }
    });

    // 4. Build numeric matrix for selected features
    const rawMatrix: number[][] = transformed.map((row) =>
      features.map((feat) => Number(row[feat]) || 0)
    );

    // 5. Standardize matrix columns
    const n = rawMatrix.length;
    const d = features.length;
    const scaledMatrix: number[][] = Array.from({ length: n }, () => new Array(d).fill(0));

    for (let j = 0; j < d; j++) {
      const colVals = rawMatrix.map((r) => r[j]);

      if (scaleMethod === 'zscore') {
        const mean = colVals.reduce((a, b) => a + b, 0) / n;
        const variance =
          colVals.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / (n > 1 ? n - 1 : 1);
        const std = Math.sqrt(variance) || 1;

        for (let i = 0; i < n; i++) {
          scaledMatrix[i][j] = (colVals[i] - mean) / std;
        }
      } else if (scaleMethod === 'minmax') {
        const min = Math.min(...colVals);
        const max = Math.max(...colVals);
        const range = max - min || 1;

        for (let i = 0; i < n; i++) {
          scaledMatrix[i][j] = (colVals[i] - min) / range;
        }
      } else if (scaleMethod === 'robust') {
        const sorted = [...colVals].sort((a, b) => a - b);
        const median = sorted[Math.floor(n / 2)];
        const q1 = sorted[Math.floor(n * 0.25)];
        const q3 = sorted[Math.floor(n * 0.75)];
        const iqr = q3 - q1 || 1;

        for (let i = 0; i < n; i++) {
          scaledMatrix[i][j] = (colVals[i] - median) / iqr;
        }
      } else {
        // none
        for (let i = 0; i < n; i++) {
          scaledMatrix[i][j] = colVals[i];
        }
      }
    }

    const history: TransformationHistory[] = [
      {
        timestamp: new Date().toLocaleTimeString(),
        action: 'Selección de Variables',
        details: `${features.length} variables seleccionadas para clustering: ${features.join(', ')}`,
      },
      {
        timestamp: new Date().toLocaleTimeString(),
        action: 'Transformación Logarítmica',
        details: logCols.length > 0 ? `log(1+x) aplicado a: ${logCols.join(', ')}` : 'Ninguna',
      },
      {
        timestamp: new Date().toLocaleTimeString(),
        action: 'Estandarización de Escalas',
        details: `Método aplicado: ${scaleMethod.toUpperCase()}`,
      },
    ];

    onUpdatePrepConfig({
      selectedFeatures: features,
      standardization: scaleMethod,
      logTransformCols: logCols,
      missingMethod: imputeMethod,
      transformedData: transformed,
      scaledMatrix,
      history,
    });
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 text-xs font-semibold mb-2 border border-indigo-200">
            <Wand2 className="w-3.5 h-3.5" />
            <span>Módulo 3: Preparación, Transformación y Estandarización</span>
          </div>
          <h2 className="text-xl font-bold text-slate-900">
            Ingeniería de Variables y Preprocesamiento Matemático
          </h2>
          <p className="text-xs text-slate-500 max-w-2xl mt-1">
            Configure las transformaciones del script de R (creación de indicador <code>servicios</code>, transformación <code>log(1+x)</code> para reducir asimetría y estandarización <code>Z-Score</code>) o personalice las variables según su objetivo.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {hasTelecomCols && (
            <button
              onClick={handleApplyRPipeline}
              className="py-2.5 px-4 rounded-lg font-semibold text-xs bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 shadow-sm flex items-center gap-2 transition"
            >
              <Sparkles className="w-4 h-4 text-indigo-600" />
              <span>Aplicar Pipeline del Script R (02. K_means.R)</span>
            </button>
          )}

          <button
            onClick={() => {
              applyTransformations();
              onProceedToClustering();
            }}
            className="py-2.5 px-5 rounded-lg font-semibold text-xs bg-blue-600 hover:bg-blue-700 text-white shadow-sm flex items-center gap-2 transition"
          >
            <span>Aplicar y Continuar a Clustering</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 3.1 & 3.3: Variable Selection and Log Transform */}
        <div className="lg:col-span-2 bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-5">
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center justify-between">
              <span>3.1 Selección de Variables & 3.3 Transformación Logarítmica log(1+x)</span>
              <span className="text-xs font-normal text-slate-500">
                {currentSelected.length} variables activas
              </span>
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Seleccione qué variables ingresarán a la distancia euclidiana de K-Means. Marque <code>log(1+x)</code> para normalizar variables con alta asimetría positiva como consumos y minutos.
            </p>
          </div>

          <div className="overflow-x-auto border border-slate-200 rounded-lg">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
                <tr>
                  <th className="p-3 w-10 text-center">Incluir</th>
                  <th className="p-3">Variable</th>
                  <th className="p-3">Tipo</th>
                  <th className="p-3 text-center">Transformación log(1+x)</th>
                  <th className="p-3">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {/* Custom services variable row if applicable */}
                {hasTelecomCols && (
                  <tr className="bg-indigo-50/40">
                    <td className="p-3 text-center">
                      <input
                        type="checkbox"
                        checked={currentSelected.includes('servicios')}
                        onChange={() => toggleFeature('servicios')}
                        className="rounded text-indigo-600 w-4 h-4 cursor-pointer"
                      />
                    </td>
                    <td className="p-3 font-mono font-bold text-indigo-900 flex items-center gap-1.5">
                      <span>servicios</span>
                      <span className="text-[10px] bg-indigo-100 text-indigo-800 px-1.5 py-0.2 rounded font-normal">
                        Derivada R
                      </span>
                    </td>
                    <td className="p-3 text-slate-500">Suma (fijo+larga+net+oculto)</td>
                    <td className="p-3 text-center">
                      <span className="text-slate-400 text-[11px]">Escala natural (0 a 4)</span>
                    </td>
                    <td className="p-3">
                      {currentSelected.includes('servicios') ? (
                        <span className="text-emerald-700 font-medium">Activa en modelo</span>
                      ) : (
                        <span className="text-slate-400">Excluida</span>
                      )}
                    </td>
                  </tr>
                )}

                {numericColumns.map((col) => {
                  const isChecked = currentSelected.includes(col.name);
                  const isLog = currentLogCols.includes(col.name);

                  return (
                    <tr key={col.name} className="hover:bg-slate-50">
                      <td className="p-3 text-center">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => toggleFeature(col.name)}
                          className="rounded text-blue-600 w-4 h-4 cursor-pointer"
                        />
                      </td>
                      <td className="p-3 font-mono font-semibold text-slate-900">
                        {col.name}
                      </td>
                      <td className="p-3 text-slate-500">
                        {col.type === 'continuous' ? 'Numérica Continua' : 'Discreta'}
                      </td>
                      <td className="p-3 text-center">
                        <label className="inline-flex items-center gap-1.5 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={isLog}
                            disabled={!isChecked}
                            onChange={() => toggleLog(col.name)}
                            className="rounded text-indigo-600 w-3.5 h-3.5 disabled:opacity-30 cursor-pointer"
                          />
                          <span className={`text-[11px] ${isLog ? 'font-bold text-indigo-700' : 'text-slate-400'}`}>
                            {isLog ? 'log(1+x) Activo' : 'Original'}
                          </span>
                        </label>
                      </td>
                      <td className="p-3">
                        {isChecked ? (
                          <span className="text-emerald-700 font-medium">Activa en modelo</span>
                        ) : (
                          <span className="text-slate-400">Excluida</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* 3.2, 3.4 & 3.5: Scaling, Imputation and Custom Feature Builder */}
        <div className="space-y-6">
          {/* 3.4 Standardization */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-3">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <SlidersHorizontal className="w-4 h-4 text-blue-600" />
              <span>3.4 Método de Estandarización</span>
            </h3>
            <p className="text-xs text-slate-500">
              Imprescindible para que variables con rangos grandes no dominen a las de rangos menores.
            </p>
            <div className="space-y-2">
              <label
                className={`flex items-start gap-2.5 p-2.5 rounded-lg border text-xs cursor-pointer transition ${
                  currentStd === 'zscore'
                    ? 'border-blue-500 bg-blue-50/50 text-blue-900 font-medium'
                    : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                }`}
              >
                <input
                  type="radio"
                  name="std"
                  value="zscore"
                  checked={currentStd === 'zscore'}
                  onChange={() => setCurrentStd('zscore')}
                  className="mt-0.5 text-blue-600"
                />
                <div>
                  <div className="font-semibold">StandardScaler (Z-Score) - Script R</div>
                  <div className="text-[11px] text-slate-500">Media = 0, Desv. Est. = 1 (Recomendado)</div>
                </div>
              </label>

              <label
                className={`flex items-start gap-2.5 p-2.5 rounded-lg border text-xs cursor-pointer transition ${
                  currentStd === 'minmax'
                    ? 'border-blue-500 bg-blue-50/50 text-blue-900 font-medium'
                    : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                }`}
              >
                <input
                  type="radio"
                  name="std"
                  value="minmax"
                  checked={currentStd === 'minmax'}
                  onChange={() => setCurrentStd('minmax')}
                  className="mt-0.5 text-blue-600"
                />
                <div>
                  <div className="font-semibold">Min-Max Scaling [0, 1]</div>
                  <div className="text-[11px] text-slate-500">Acota todas las variables al intervalo [0, 1]</div>
                </div>
              </label>

              <label
                className={`flex items-start gap-2.5 p-2.5 rounded-lg border text-xs cursor-pointer transition ${
                  currentStd === 'robust'
                    ? 'border-blue-500 bg-blue-50/50 text-blue-900 font-medium'
                    : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                }`}
              >
                <input
                  type="radio"
                  name="std"
                  value="robust"
                  checked={currentStd === 'robust'}
                  onChange={() => setCurrentStd('robust')}
                  className="mt-0.5 text-blue-600"
                />
                <div>
                  <div className="font-semibold">Robust Scaler (Mediana & IQR)</div>
                  <div className="text-[11px] text-slate-500">Resistente a la presencia de valores atípicos</div>
                </div>
              </label>
            </div>
          </div>

          {/* 3.2 Missing value imputation */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-3">
            <h3 className="text-sm font-bold text-slate-900">
              3.2 Tratamiento de Faltantes
            </h3>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                onClick={() => setCurrentMissing('median')}
                className={`p-2 rounded-lg border text-left transition ${
                  currentMissing === 'median'
                    ? 'bg-blue-600 text-white font-semibold'
                    : 'bg-slate-50 text-slate-700 hover:bg-slate-100'
                }`}
              >
                Imputar Mediana
              </button>
              <button
                onClick={() => setCurrentMissing('mean')}
                className={`p-2 rounded-lg border text-left transition ${
                  currentMissing === 'mean'
                    ? 'bg-blue-600 text-white font-semibold'
                    : 'bg-slate-50 text-slate-700 hover:bg-slate-100'
                }`}
              >
                Imputar Media
              </button>
            </div>
          </div>

          {/* 3.5 Feature engineering / Custom derived variable */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-3">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Calculator className="w-4 h-4 text-indigo-600" />
              <span>3.5 Creador de Variable Derivada</span>
            </h3>
            <p className="text-xs text-slate-500">
              Crea nuevas variables sumando columnas existentes (replicando la lógica de <code>servicios</code>).
            </p>
            <div className="space-y-2">
              <div>
                <label className="block text-[11px] font-medium text-slate-600 mb-1">
                  Nombre de la nueva variable:
                </label>
                <input
                  type="text"
                  value={newVarName}
                  onChange={(e) => setNewVarName(e.target.value)}
                  className="w-full border border-slate-300 rounded px-2.5 py-1.5 text-xs font-mono bg-white text-slate-800"
                  placeholder="ej: servicios_totales"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-600 mb-1">
                  Sumar variables existentes:
                </label>
                <div className="grid grid-cols-2 gap-1 max-h-32 overflow-y-auto border border-slate-200 p-2 rounded text-xs bg-slate-50">
                  {columns.map((c) => (
                    <label key={c.name} className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedSumCols.includes(c.name)}
                        onChange={() => {
                          if (selectedSumCols.includes(c.name)) {
                            setSelectedSumCols(selectedSumCols.filter((s) => s !== c.name));
                          } else {
                            setSelectedSumCols([...selectedSumCols, c.name]);
                          }
                        }}
                        className="rounded text-blue-600 w-3.5 h-3.5"
                      />
                      <span className="font-mono text-[11px] truncate">{c.name}</span>
                    </label>
                  ))}
                </div>
              </div>

              <button
                onClick={handleCreateDerivedVariable}
                className="w-full py-1.5 text-xs bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-semibold rounded border border-indigo-200 transition"
              >
                Generar Variable Derivada
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
