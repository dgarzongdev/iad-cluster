import * as XLSX from 'xlsx';
import { createRNG } from './kmeans';

export interface DatasetPreset {
  id: string;
  name: string;
  sector: string;
  description: string;
  rowsCount: number;
  columnsCount: number;
  recommendedK: number;
  isReference: boolean;
  generator: () => Record<string, any>[];
}

/**
 * Generate 1,000 realistic records replicating the cellsegmentation.xlsx dataset
 * with the 16 exact variables from the R script 02. K_means.R
 */
export function generateTelecomReferenceDataset(): Record<string, any>[] {
  const rng = createRNG(42);
  const records: Record<string, any>[] = [];
  const n = 1000;

  // Segment archetypes to create authentic clustering structure
  // 1: Heavy Digital Data Streamers (high internet_gigas, high equipo_dolares)
  // 2: Multi-service Traditional (high fijo, largadistancia, internetcasa, numoculto)
  // 3: High Value Corporate/Executive (high minutos_preferido, high ingreso_miles)
  // 4: Low-cost / Price-sensitive basic users (low equipment, low minutos, low internet)
  // 5: Young Social & Streaming adopters (moderate minutes, high gigas, mid equipment)

  for (let i = 1; i <= n; i++) {
    const archetype = Math.floor(rng() * 5); // 0 to 4
    const ageBase = 18 + Math.floor(rng() * 62);
    const married = rng() > 0.45 ? 1 : 0;
    const retired = ageBase > 60 ? (rng() > 0.3 ? 1 : 0) : 0;
    const gender = rng() > 0.48 ? 1 : 0;
    const region = 1 + Math.floor(rng() * 4); // Regions 1, 2, 3, 4
    const paperless = rng() > 0.35 ? 1 : 0;

    let minPref = 0;
    let adicionales = 0;
    let equipo = 0;
    let minNoPref = 0;
    let gigas = 0;
    let fijo = 0;
    let largaDist = 0;
    let internetCasa = 0;
    let numOculto = 0;
    let ingreso = 0;

    if (archetype === 0) {
      // High Digital Users
      minPref = Math.round(50 + rng() * 180);
      adicionales = Math.round(20 + rng() * 90);
      equipo = Math.round(350 + rng() * 450);
      minNoPref = Math.round(30 + rng() * 120);
      gigas = Math.round(15 + rng() * 45);
      fijo = rng() > 0.5 ? 1 : 0;
      largaDist = rng() > 0.6 ? 1 : 0;
      internetCasa = 1;
      numOculto = rng() > 0.7 ? 1 : 0;
      ingreso = Math.round(45 + rng() * 85);
    } else if (archetype === 1) {
      // Multi-service Full Bundle
      minPref = Math.round(120 + rng() * 250);
      adicionales = Math.round(40 + rng() * 130);
      equipo = Math.round(200 + rng() * 300);
      minNoPref = Math.round(80 + rng() * 220);
      gigas = Math.round(5 + rng() * 18);
      fijo = 1;
      largaDist = 1;
      internetCasa = 1;
      numOculto = 1;
      ingreso = Math.round(60 + rng() * 110);
    } else if (archetype === 2) {
      // High Value Corporate
      minPref = Math.round(280 + rng() * 450);
      adicionales = Math.round(90 + rng() * 210);
      equipo = Math.round(450 + rng() * 550);
      minNoPref = Math.round(150 + rng() * 380);
      gigas = Math.round(20 + rng() * 60);
      fijo = 1;
      largaDist = 1;
      internetCasa = 1;
      numOculto = rng() > 0.5 ? 1 : 0;
      ingreso = Math.round(85 + rng() * 180);
    } else if (archetype === 3) {
      // Basic / Price Sensitive
      minPref = Math.round(10 + rng() * 65);
      adicionales = Math.round(0 + rng() * 25);
      equipo = Math.round(50 + rng() * 120);
      minNoPref = Math.round(5 + rng() * 45);
      gigas = Math.round(1 + rng() * 4);
      fijo = rng() > 0.7 ? 1 : 0;
      largaDist = 0;
      internetCasa = 0;
      numOculto = 0;
      ingreso = Math.round(18 + rng() * 38);
    } else {
      // Balanced Family / Casual
      minPref = Math.round(80 + rng() * 160);
      adicionales = Math.round(15 + rng() * 60);
      equipo = Math.round(150 + rng() * 280);
      minNoPref = Math.round(40 + rng() * 110);
      gigas = Math.round(6 + rng() * 20);
      fijo = rng() > 0.4 ? 1 : 0;
      largaDist = rng() > 0.5 ? 1 : 0;
      internetCasa = rng() > 0.3 ? 1 : 0;
      numOculto = rng() > 0.8 ? 1 : 0;
      ingreso = Math.round(35 + rng() * 65);
    }

    records.push({
      cliente_id: 10000 + i,
      region,
      Edad: ageBase,
      casado: married,
      jubilado: retired,
      genero: gender,
      minutos_preferido: Math.max(0, minPref),
      adicionales: Math.max(0, adicionales),
      equipo_dolares: Math.max(10, equipo),
      minutos_no_preferido: Math.max(0, minNoPref),
      internet_gigas: Math.max(0, gigas),
      fijo,
      largadistancia: largaDist,
      internetcasa: internetCasa,
      numoculto: numOculto,
      facturaelect: paperless,
      ingreso_miles: Math.max(12, ingreso),
    });
  }

  return records;
}

/**
 * Generate Retail E-Commerce Customer Dataset
 */
export function generateRetailDataset(): Record<string, any>[] {
  const rng = createRNG(101);
  const records: Record<string, any>[] = [];
  const n = 800;

  for (let i = 1; i <= n; i++) {
    const segment = Math.floor(rng() * 4);
    let orders = 1;
    let spend = 50;
    let discountRate = 0.1;
    let returns = 0;
    let recencyDays = 10;
    let categories = 1;

    if (segment === 0) {
      // VIP Loyal
      orders = Math.round(15 + rng() * 35);
      spend = Math.round(1200 + rng() * 3000);
      discountRate = +(0.05 + rng() * 0.1).toFixed(2);
      returns = Math.round(rng() * 2);
      recencyDays = Math.round(2 + rng() * 20);
      categories = Math.round(4 + rng() * 4);
    } else if (segment === 1) {
      // Bargain Hunters
      orders = Math.round(4 + rng() * 12);
      spend = Math.round(250 + rng() * 600);
      discountRate = +(0.3 + rng() * 0.45).toFixed(2);
      returns = Math.round(1 + rng() * 4);
      recencyDays = Math.round(15 + rng() * 60);
      categories = Math.round(2 + rng() * 3);
    } else if (segment === 2) {
      // Dormant / At-risk
      orders = Math.round(1 + rng() * 3);
      spend = Math.round(80 + rng() * 200);
      discountRate = +(0.1 + rng() * 0.2).toFixed(2);
      returns = 0;
      recencyDays = Math.round(120 + rng() * 240);
      categories = 1;
    } else {
      // Frequent Mid-Tier
      orders = Math.round(6 + rng() * 16);
      spend = Math.round(450 + rng() * 950);
      discountRate = +(0.15 + rng() * 0.2).toFixed(2);
      returns = Math.round(rng() * 2);
      recencyDays = Math.round(10 + rng() * 45);
      categories = Math.round(2 + rng() * 4);
    }

    records.push({
      cliente_id: 20000 + i,
      ordenes_anuales: orders,
      gasto_total_usd: spend,
      tasa_descuento: discountRate,
      devoluciones: returns,
      dias_ultima_compra: recencyDays,
      categorias_compradas: categories,
      suscripcion_vip: segment === 0 ? 1 : 0,
    });
  }

  return records;
}

/**
 * Generate Financial Services / Banking Dataset
 */
export function generateFinancialDataset(): Record<string, any>[] {
  const rng = createRNG(202);
  const records: Record<string, any>[] = [];
  const n = 900;

  for (let i = 1; i <= n; i++) {
    const tier = Math.floor(rng() * 4);
    let saldoCuenta = 500;
    let usoCredito = 200;
    let txnMes = 5;
    let inversionFondos = 0;
    let antiguedadAnios = 1;
    let scoreCrediticio = 550;

    if (tier === 0) {
      // Wealth & Investors
      saldoCuenta = Math.round(15000 + rng() * 85000);
      usoCredito = Math.round(2000 + rng() * 12000);
      txnMes = Math.round(25 + rng() * 60);
      inversionFondos = Math.round(20000 + rng() * 150000);
      antiguedadAnios = Math.round(4 + rng() * 15);
      scoreCrediticio = Math.round(750 + rng() * 120);
    } else if (tier === 1) {
      // Credit Heavy Borrowers
      saldoCuenta = Math.round(800 + rng() * 3500);
      usoCredito = Math.round(4500 + rng() * 15000);
      txnMes = Math.round(30 + rng() * 70);
      inversionFondos = 0;
      antiguedadAnios = Math.round(2 + rng() * 8);
      scoreCrediticio = Math.round(620 + rng() * 70);
    } else if (tier === 2) {
      // Digital Savers
      saldoCuenta = Math.round(4000 + rng() * 16000);
      usoCredito = Math.round(300 + rng() * 1500);
      txnMes = Math.round(18 + rng() * 45);
      inversionFondos = Math.round(2000 + rng() * 12000);
      antiguedadAnios = Math.round(2 + rng() * 6);
      scoreCrediticio = Math.round(700 + rng() * 90);
    } else {
      // Payroll Basic
      saldoCuenta = Math.round(300 + rng() * 1800);
      usoCredito = Math.round(100 + rng() * 800);
      txnMes = Math.round(8 + rng() * 22);
      inversionFondos = 0;
      antiguedadAnios = Math.round(1 + rng() * 5);
      scoreCrediticio = Math.round(580 + rng() * 80);
    }

    records.push({
      cliente_id: 30000 + i,
      saldo_cuenta: saldoCuenta,
      consumo_tarjeta_credito: usoCredito,
      transacciones_mensuales: txnMes,
      saldo_inversiones: inversionFondos,
      antiguedad_anios: antiguedadAnios,
      score_crediticio: scoreCrediticio,
      banca_movil_activa: tier !== 3 || rng() > 0.4 ? 1 : 0,
    });
  }

  return records;
}

export const DATASET_PRESETS: DatasetPreset[] = [
  {
    id: 'telecom_reference',
    name: 'Telecomunicaciones - cellsegmentation.xlsx (Dataset Oficial del Script R)',
    sector: 'Telecomunicaciones',
    description:
      'Dataset benchmark con 1.000 clientes y 16 variables de telefonía fija, móvil, internet banda ancha, minutos y equipamiento. Recrea exactamente el entorno experimental de 02. K_means.R.',
    rowsCount: 1000,
    columnsCount: 17,
    recommendedK: 5,
    isReference: true,
    generator: generateTelecomReferenceDataset,
  },
  {
    id: 'retail_ecommerce',
    name: 'Retail & Comercio Electrónico (Comportamiento RFM y Descuentos)',
    sector: 'Retail y Comercio',
    description:
      '800 clientes con métricas de órdenes anuales, gasto total acumulado, sensibilidad a promociones, devoluciones y categorías adquiridas.',
    rowsCount: 800,
    columnsCount: 8,
    recommendedK: 4,
    isReference: false,
    generator: generateRetailDataset,
  },
  {
    id: 'financial_banking',
    name: 'Servicios Financieros & Banca (Saldos, Crédito e Inversión)',
    sector: 'Servicios Financieros',
    description:
      '900 clientes bancarios caracterizados por saldos pasivos, endeudamiento en tarjetas, transacciones digitales y patrimonio invertido.',
    rowsCount: 900,
    columnsCount: 8,
    recommendedK: 4,
    isReference: false,
    generator: generateFinancialDataset,
  },
];

/**
 * Configurable Synthetic Dataset Generator
 */
export function generateCustomSyntheticDataset(config: {
  sector: string;
  rows: number;
  expectedK: number;
  missingPercent: number;
  outlierPercent: number;
  variability: 'baja' | 'media' | 'alta';
}): Record<string, any>[] {
  const rng = createRNG(Date.now() % 100000);
  const rows = Math.max(50, Math.min(5000, config.rows));
  const k = Math.max(2, Math.min(8, config.expectedK));
  const records: Record<string, any>[] = [];

  const varMult =
    config.variability === 'baja' ? 0.6 : config.variability === 'alta' ? 1.5 : 1.0;

  // Generate cluster prototypes for 5 core quantitative metrics
  const prototypes = Array.from({ length: k }, (_, idx) => ({
    metricA: 50 + idx * 75,
    metricB: 100 + (k - idx) * 80,
    metricC: 20 + Math.pow(idx + 1, 2) * 15,
    metricD: 10 + idx * 25,
    metricE: 300 + idx * 250,
  }));

  for (let i = 1; i <= rows; i++) {
    const cluster = Math.floor(rng() * k);
    const proto = prototypes[cluster];

    let a = Math.max(0, Math.round(proto.metricA + (rng() - 0.5) * 40 * varMult));
    let b = Math.max(0, Math.round(proto.metricB + (rng() - 0.5) * 50 * varMult));
    let c = Math.max(0, Math.round(proto.metricC + (rng() - 0.5) * 30 * varMult));
    let d = Math.max(0, Math.round(proto.metricD + (rng() - 0.5) * 20 * varMult));
    let e = Math.max(0, Math.round(proto.metricE + (rng() - 0.5) * 150 * varMult));

    // Inject outliers if configured
    if (rng() < config.outlierPercent / 100) {
      const target = Math.floor(rng() * 5);
      if (target === 0) a *= 4;
      if (target === 1) b *= 4;
      if (target === 2) c *= 4;
      if (target === 3) d *= 4;
      if (target === 4) e *= 4;
    }

    // Inject missing values if configured
    const rA = rng() < config.missingPercent / 100 ? null : a;
    const rB = rng() < config.missingPercent / 100 ? null : b;
    const rC = rng() < config.missingPercent / 100 ? null : c;
    const rD = rng() < config.missingPercent / 100 ? null : d;
    const rE = rng() < config.missingPercent / 100 ? null : e;

    records.push({
      id_registro: 50000 + i,
      segmento_real_oculto: cluster + 1,
      volumen_consumo: rA,
      frecuencia_interaccion: rB,
      intensidad_digital: rC,
      antiguedad_meses: rD,
      valor_monetario_usd: rE,
      canal_preferido: ['Online', 'Tienda', 'Móvil', 'CallCenter'][Math.floor(rng() * 4)],
    });
  }

  return records;
}

/**
 * Parse uploaded Excel (.xlsx, .xls) or CSV files via XLSX library
 */
export async function parseUploadedFile(file: File): Promise<{
  filename: string;
  filesize: number;
  data: Record<string, any>[];
}> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const buffer = e.target?.result;
        const workbook = XLSX.read(buffer, { type: 'binary', cellDates: true });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];

        const jsonData: Record<string, any>[] = XLSX.utils.sheet_to_json(worksheet, {
          raw: false,
          defval: null,
        });

        if (!jsonData || jsonData.length === 0) {
          throw new Error('El archivo no contiene filas legibles.');
        }

        resolve({
          filename: file.name,
          filesize: file.size,
          data: jsonData,
        });
      } catch (err) {
        reject(err);
      }
    };

    reader.onerror = () => {
      reject(new Error('Error al leer el archivo.'));
    };

    reader.readAsBinaryString(file);
  });
}
