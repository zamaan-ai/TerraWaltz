/**
 * TerraWaltz Radar Science & Mathematics Core Engine
 * Reference: DANCE_WITH_ME_MARK-4 Technical Specification (10 November 2026)
 *
 * Implements:
 * - Backscatter processing (GCOV gamma0, GSLC beta0, LUT division, linear-power averaging, speckle statistics)
 * - Interferometry & InSAR (wrap/unwrap, phase-to-LOS displacement, coherence, Cramér-Rao bound, projection)
 * - Statistical standardization (median, MAD, IQR fallback, robust z-score)
 * - TerraWaltz Anomaly Index & Surface Change Evidence Index (SCEI)
 * - Standard NISAR filename parser conforming to JPL D-102274
 * - Built-in verification suite for Section 15.4 Numerical Test Vectors
 */

export interface TestVectorResult {
  name: string;
  expected: string;
  actual: string;
  passed: boolean;
  delta?: number;
}

// -------------------------------------------------------------
// 1. Backscatter Fundamentals & Radiometric Calculations
// -------------------------------------------------------------

/**
 * GSLC Beta-0 from complex Digital Number (DN)
 * beta0 = |DN|^2 = I^2 + Q^2
 */
export function beta0FromDN(real: number, imag: number): number {
  return real * real + imag * imag;
}

/**
 * Convert Beta-0 to Sigma-0 using product LUT
 * sigma0 = beta0 / (sigma0_LUT)^2
 */
export function convertBeta0ToSigma0(beta0: number, sigma0Lut: number): number {
  if (sigma0Lut <= 0) return NaN;
  return beta0 / (sigma0Lut * sigma0Lut);
}

/**
 * Convert Beta-0 to Gamma-0 using product LUT
 * gamma0 = beta0 / (gamma0_LUT)^2
 */
export function convertBeta0ToGamma0(beta0: number, gamma0Lut: number): number {
  if (gamma0Lut <= 0) return NaN;
  return beta0 / (gamma0Lut * gamma0Lut);
}

/**
 * Convert linear power to decibels (dB)
 * dB = 10 * log10(power)
 */
export function toDb(power: number): number {
  if (power <= 0 || !Number.isFinite(power)) return NaN;
  return 10.0 * Math.log10(power);
}

/**
 * Convert dB to linear power
 * power = 10^(dB / 10)
 */
export function fromDb(db: number): number {
  return Math.pow(10.0, db / 10.0);
}

/**
 * CRITICAL RULE (Section 6.4): Spatial, temporal and pyramid averaging
 * MUST be performed on linear power and converted to dB afterwards.
 * Averaging dB values directly biases results due to logarithmic non-linearity.
 */
export function meanDb(powers: number[]): { linearMean: number; dbMean: number } {
  const valid = powers.filter((p) => Number.isFinite(p) && p > 0);
  if (valid.length === 0) {
    return { linearMean: NaN, dbMean: NaN };
  }
  const sum = valid.reduce((acc, val) => acc + val, 0);
  const linearMean = sum / valid.length;
  const dbMean = 10.0 * Math.log10(linearMean);
  return { linearMean, dbMean };
}

/**
 * Theoretical speckle standard deviation in dB for N-look intensity
 * sigma_dB = 4.343 / sqrt(N)
 * sigma_delta = sqrt(2) * 4.343 / sqrt(N) (difference of two independent estimates)
 */
export function speckleSigmaDb(nLooks: number): { sigmaDb: number; sigmaDeltaDb: number } {
  if (nLooks <= 0) return { sigmaDb: NaN, sigmaDeltaDb: NaN };
  const sigmaDb = 4.342944819 / Math.sqrt(nLooks);
  const sigmaDeltaDb = Math.SQRT2 * sigmaDb;
  return { sigmaDb, sigmaDeltaDb };
}

/**
 * Temporal backscatter change in dB
 * Delta_gamma0_dB = 10 * log10(p_t2 / p_t1)
 */
export function changeDb(pT2: number, pT1: number): number {
  if (pT1 <= 0 || pT2 <= 0) return NaN;
  return toDb(pT2) - toDb(pT1);
}

// -------------------------------------------------------------
// 2. Interferometry, Coherence and LOS Displacement
// -------------------------------------------------------------

/**
 * Wrap phase into (-pi, pi]
 */
export function wrapPhase(phi: number): number {
  const twoPi = 2.0 * Math.PI;
  return ((phi + Math.PI) % twoPi + twoPi) % twoPi - Math.PI;
}

/**
 * Convert unwrapped interferometric phase to Line-Of-Sight (LOS) displacement
 * d_LOS = s_phi * (lambda / 4pi) * Delta_phi_unw
 * @param dphiUnw Unwrapped phase difference in radians
 * @param wavelengthM Radar wavelength in metres (NISAR L-band nominal = 0.24 m)
 * @param sign Sign convention (+1 or -1)
 * @returns displacement in metres
 */
export function losFromPhase(dphiUnw: number, wavelengthM: number = 0.24, sign: number = 1): number {
  return sign * (wavelengthM / (4.0 * Math.PI)) * dphiUnw;
}

/**
 * Complex sample pair coherence
 * gamma = |sum(s1 * conj(s2))| / sqrt(sum(|s1|^2) * sum(|s2|^2))
 */
export function coherence(s1: Array<[number, number]>, s2: Array<[number, number]>): number {
  if (s1.length !== s2.length || s1.length === 0) return NaN;

  let sumReal = 0;
  let sumImag = 0;
  let sumPow1 = 0;
  let sumPow2 = 0;

  for (let i = 0; i < s1.length; i++) {
    const [r1, i1] = s1[i];
    const [r2, i2] = s2[i];

    // s1 * conj(s2) = (r1 + j i1) * (r2 - j i2) = (r1*r2 + i1*i2) + j (i1*r2 - r1*i2)
    sumReal += r1 * r2 + i1 * i2;
    sumImag += i1 * r2 - r1 * i2;

    sumPow1 += r1 * r1 + i1 * i1;
    sumPow2 += r2 * r2 + i2 * i2;
  }

  const num = Math.sqrt(sumReal * sumReal + sumImag * sumImag);
  const den = Math.sqrt(sumPow1 * sumPow2);

  if (den === 0) return NaN;
  return Math.min(1.0, Math.max(0.0, num / den));
}

/**
 * Cramér-Rao bound on phase standard deviation and LOS precision
 * sigma_phi = (1 / sqrt(2N)) * sqrt(1 - gamma^2) / gamma
 * sigma_d = (lambda / 4pi) * sigma_phi
 */
export function phaseStd(gamma: number, nLooks: number, wavelengthM: number = 0.24): { sigmaPhiRad: number; sigmaDMm: number } {
  if (gamma <= 0 || gamma > 1 || nLooks <= 0) {
    return { sigmaPhiRad: NaN, sigmaDMm: NaN };
  }
  const sigmaPhiRad = (1.0 / Math.sqrt(2.0 * nLooks)) * (Math.sqrt(Math.max(0, 1.0 - gamma * gamma)) / gamma);
  const sigmaDMm = (wavelengthM / (4.0 * Math.PI)) * sigmaPhiRad * 1000.0;
  return { sigmaPhiRad, sigmaDMm };
}

/**
 * Project 3D ground motion u = [uE, uN, uU] onto radar look vector l = [lE, lN, lU]
 * d_LOS = u . l
 * IMPORTANT: A single LOS raster is a projection and is NEVER labelled "vertical"
 */
export function projectEnuToLos(
  uEnu: [number, number, number],
  lEnu: [number, number, number]
): number {
  return uEnu[0] * lEnu[0] + uEnu[1] * lEnu[1] + uEnu[2] * lEnu[2];
}

/**
 * Interval-average LOS displacement rate
 * rate = 1000 * d_LOS / dt_days (mm/day)
 */
export function rateMmPerDay(dLosM: number, dtDays: number): number {
  if (dtDays <= 0) return NaN;
  return (1000.0 * dLosM) / dtDays;
}

// -------------------------------------------------------------
// 3. Statistics, Anomaly Index and SCEI
// -------------------------------------------------------------

/**
 * Robust standardization using median and Median Absolute Deviation (MAD)
 * z_r = 0.6745 * (x - m) / MAD
 * Fallback to IQR/2 if MAD is below floor.
 */
export function robustZ(
  x: number,
  baseline: number[],
  floor: number = 0.05
): { z: number; median: number; mad: number } {
  const b = baseline.filter(Number.isFinite).sort((p, q) => p - q);
  if (b.length === 0) return { z: NaN, median: NaN, mad: NaN };

  const median = getMedian(b);
  const deviations = b.map((val) => Math.abs(val - median)).sort((p, q) => p - q);
  let mad = getMedian(deviations);

  if (mad < floor) {
    // IQR fallback
    const q75 = getPercentile(b, 75);
    const q25 = getPercentile(b, 25);
    mad = (q75 - q25) / 2.0;
    if (mad < floor) {
      return { z: NaN, median, mad };
    }
  }

  const z = (0.6745 * (x - median)) / mad;
  return { z, median, mad };
}

function getMedian(sortedArray: number[]): number {
  const mid = Math.floor(sortedArray.length / 2);
  if (sortedArray.length % 2 !== 0) {
    return sortedArray[mid];
  }
  return (sortedArray[mid - 1] + sortedArray[mid]) / 2.0;
}

function getPercentile(sortedArray: number[], percentile: number): number {
  const index = (percentile / 100.0) * (sortedArray.length - 1);
  const lower = Math.floor(index);
  const upper = Math.ceil(index);
  const weight = index - lower;
  return sortedArray[lower] * (1 - weight) + sortedArray[upper] * weight;
}

/**
 * TerraWaltz Anomaly Index
 * A = (1/K) * sum clip(|z_r,k| / z_sat, 0, 1)
 */
export function anomalyIndex(
  zValues: Array<number | null | undefined>,
  zSat: number = 3.5
): { anomalyIndex: number; validCount: number } {
  const valid = zValues.filter((v): v is number => v !== null && v !== undefined && Number.isFinite(v));
  if (valid.length === 0) {
    return { anomalyIndex: NaN, validCount: 0 };
  }

  let sum = 0;
  for (const z of valid) {
    const clipped = Math.min(1.0, Math.max(0.0, Math.abs(z) / zSat));
    sum += clipped;
  }

  return {
    anomalyIndex: sum / valid.length,
    validCount: valid.length,
  };
}

/**
 * Surface Change Evidence Index (SCEI)
 * s_k = clip((x_k - a_k) / (b_k - a_k), 0, 1)
 * SCEI = 100 * sum(w_k * s_k) / sum(w_k)
 */
export function scei(
  components: Record<string, number | null | undefined>,
  bounds: Record<string, [number, number]>,
  weights: Record<string, number>
): { scei: number; contributingFraction: number } {
  let num = 0.0;
  let den = 0.0;
  let totalWeights = 0.0;

  for (const [key, weight] of Object.entries(weights)) {
    totalWeights += weight;
    const x = components[key];
    const bound = bounds[key];

    if (x === null || x === undefined || !Number.isFinite(x) || !bound) {
      continue;
    }

    const [a, b] = bound;
    if (b === a) continue;

    const s = Math.min(1.0, Math.max(0.0, (x - a) / (b - a)));
    num += weight * s;
    den += weight;
  }

  if (den === 0) {
    return { scei: NaN, contributingFraction: 0 };
  }

  return {
    scei: (100.0 * num) / den,
    contributingFraction: totalWeights > 0 ? den / totalWeights : 0,
  };
}

/**
 * Class Area Calculation
 * A_class = N_pixels * Delta_x * Delta_y
 */
export function classAreaKm2(pixelCount: number, dxM: number, dyM: number): number {
  return (pixelCount * dxM * dyM) / 1_000_000.0;
}

// -------------------------------------------------------------
// 4. Standard NISAR Filename Parser (Section 4.8 & 19.4)
// -------------------------------------------------------------

export interface NisarProductMetadata {
  raw: string;
  mission: string;
  il: string;
  instrument: string;
  level: number;
  pt: string; // PR, UR, OD
  prod: string; // GCOV, GUNW, GSLC, etc.
  cycle: number;
  track: number;
  dir: 'A' | 'D';
  frame: number;
  mode: string;
  pol: string;
  source: string;
  start: string;
  end: string;
  crid: string;
  accuracy: string;
  coverage: string;
  loc: string;
  counter: string;
}

const NISAR_FIELDS = [
  'mission',
  'il',
  'pt',
  'prod',
  'cycle',
  'track',
  'dir',
  'frame',
  'mode',
  'pol',
  'source',
  'start',
  'end',
  'crid',
  'accuracy',
  'coverage',
  'loc',
  'counter',
] as const;

export function parseNisarName(filename: string): NisarProductMetadata {
  const stem = filename.replace(/\.[^/.]+$/, '');
  const tokens = stem.split('_');
  if (tokens.length !== NISAR_FIELDS.length) {
    throw new Error(`Unexpected NISAR file name token count (${tokens.length} vs 18): ${filename}`);
  }

  const d: Record<string, string> = {};
  NISAR_FIELDS.forEach((field, i) => {
    d[field] = tokens[i];
  });

  return {
    raw: filename,
    mission: d.mission,
    il: d.il,
    instrument: d.il[0],
    level: parseInt(d.il.slice(1), 10),
    pt: d.pt,
    prod: d.prod,
    cycle: parseInt(d.cycle, 10),
    track: parseInt(d.track, 10),
    dir: d.dir as 'A' | 'D',
    frame: parseInt(d.frame, 10),
    mode: d.mode,
    pol: d.pol,
    source: d.source,
    start: d.start,
    end: d.end,
    crid: d.crid,
    accuracy: d.accuracy,
    coverage: d.coverage,
    loc: d.loc,
    counter: d.counter,
  };
}

// -------------------------------------------------------------
// 5. Tropospheric Path Delay & Atmospheric Phase Correction
//    Formulation: Saastamoinen (1972) & Askne-Nordh (1987)
// -------------------------------------------------------------

/**
 * Zenith Hydrostatic Delay (ZHD) via Saastamoinen (1972)
 * ZHD = (0.0022768 * P0) / (1 - 0.00266 * cos(2 * lat_rad) - 0.00028 * H_km)
 * With P0 in hPa, result in meters.
 */
export function calculateZhd(pressureHpa: number, latDeg: number = 21.8, heightKm: number = 0): number {
  if (pressureHpa <= 0) return 0;
  const latRad = (latDeg * Math.PI) / 180.0;
  const fLatH = 1.0 - 0.00266 * Math.cos(2.0 * latRad) - 0.00028 * heightKm;
  return (0.0022768 * pressureHpa) / fLatH;
}

/**
 * Zenith Wet Delay (ZWD) from Precipitable Water Vapor (PWV in mm)
 * Askne & Nordh (1987) / Bevis et al. (1992):
 * ZWD = Pi * PWV_mm (meters)
 * Dimensionless conversion factor Pi ~ 0.0063
 */
export function calculateZwd(pwvMm: number, piFactor: number = 6.3e-3): number {
  if (pwvMm < 0) return 0;
  return piFactor * pwvMm;
}

/**
 * Slant Tropospheric Delay (STD) along radar Line-of-Sight (LOS)
 * STD = (ZHD + ZWD) / cos(theta_inc)
 * theta_inc is radar incidence angle (~37 deg for NISAR L-band)
 */
export function calculateSlantDelay(zhdM: number, zwdM: number, incidenceAngleDeg: number = 37.0): number {
  const thetaRad = (incidenceAngleDeg * Math.PI) / 180.0;
  const cosInc = Math.cos(thetaRad);
  if (cosInc <= 0.1) return (zhdM + zwdM) * 10.0;
  return (zhdM + zwdM) / cosInc;
}

/**
 * Differential two-way InSAR phase error caused by troposphere
 * Delta_phi_tropo = - (4 * pi / lambda) * (STD_t2 - STD_t1)
 */
export function differentialTroposphericPhase(deltaStdM: number, wavelengthM: number = 0.24): number {
  if (wavelengthM <= 0) return 0;
  return -((4.0 * Math.PI) / wavelengthM) * deltaStdM;
}

/**
 * Tropospherically corrected InSAR phase
 * phi_corrected = phi_unwrapped - Delta_phi_tropo
 */
export function correctTroposphericPhase(unwrappedPhase: number, deltaTropoPhase: number): number {
  return unwrappedPhase - deltaTropoPhase;
}

// -------------------------------------------------------------
// 6. Verification Suite for Section 15.4 Numerical Test Vectors
// -------------------------------------------------------------

export function runNumericalTestVectors(): TestVectorResult[] {
  const results: TestVectorResult[] = [];

  // 1. Beta0 from DN (DN = 3 + 4j -> 25, 13.98 dB)
  const b0 = beta0FromDN(3, 4);
  const b0Db = toDb(b0);
  results.push({
    name: 'β⁰ from DN',
    expected: '25 (13.98 dB)',
    actual: `${b0.toFixed(0)} (${b0Db.toFixed(2)} dB)`,
    passed: Math.abs(b0 - 25) < 0.001 && Math.abs(b0Db - 13.98) < 0.01,
  });

  // 2. Sigma0 from Beta0 and LUT (Beta0 = 25, LUT = 0.5 -> 100, 20 dB)
  const sig0 = convertBeta0ToSigma0(25, 0.5);
  const sig0Db = toDb(sig0);
  results.push({
    name: 'σ⁰ from β⁰ and LUT',
    expected: '100 (20 dB)',
    actual: `${sig0.toFixed(0)} (${sig0Db.toFixed(2)} dB)`,
    passed: Math.abs(sig0 - 100) < 0.001 && Math.abs(sig0Db - 20) < 0.01,
  });

  // 3. dB conversion (power = 100 -> 20 dB)
  const p100Db = toDb(100);
  results.push({
    name: 'dB conversion',
    expected: '20 dB',
    actual: `${p100Db.toFixed(2)} dB`,
    passed: Math.abs(p100Db - 20) < 0.01,
  });

  // 4. Linear mean (values 1 and 100 -> 50.5, 17.03 dB)
  const lm = meanDb([1, 100]);
  results.push({
    name: 'Linear mean',
    expected: '50.5 (17.03 dB)',
    actual: `${lm.linearMean.toFixed(1)} (${lm.dbMean.toFixed(2)} dB)`,
    passed: Math.abs(lm.linearMean - 50.5) < 0.01 && Math.abs(lm.dbMean - 17.03) < 0.02,
  });

  // 5. Phase to LOS magnitude (Delta_phi = 2pi, lambda = 0.24m -> 0.12 m)
  const los2pi = Math.abs(losFromPhase(2 * Math.PI, 0.24, 1));
  results.push({
    name: 'Phase to LOS (magnitude 2π)',
    expected: '0.12 m',
    actual: `${los2pi.toFixed(2)} m`,
    passed: Math.abs(los2pi - 0.12) < 0.001,
  });

  // 6. Phase to LOS magnitude (Delta_phi = pi, lambda = 0.24m -> 0.06 m)
  const losPi = Math.abs(losFromPhase(Math.PI, 0.24, 1));
  results.push({
    name: 'Phase to LOS (magnitude π)',
    expected: '0.06 m',
    actual: `${losPi.toFixed(2)} m`,
    passed: Math.abs(losPi - 0.06) < 0.001,
  });

  // 7. Coherence S2 = S1 -> 1.0
  const s1: Array<[number, number]> = [
    [1, 2],
    [3, 4],
    [-2, 1],
  ];
  const cohIdent = coherence(s1, s1);
  results.push({
    name: 'Coherence S₂ = S₁',
    expected: '1.0',
    actual: cohIdent.toFixed(4),
    passed: Math.abs(cohIdent - 1.0) < 0.001,
  });

  // 8. Coherence S2 = S1 * e^{j theta} -> 1.0
  const theta = Math.PI / 3;
  const cosT = Math.cos(theta);
  const sinT = Math.sin(theta);
  const s2Shifted: Array<[number, number]> = s1.map(([r, i]) => [
    r * cosT - i * sinT,
    r * sinT + i * cosT,
  ]);
  const cohShift = coherence(s1, s2Shifted);
  results.push({
    name: 'Coherence with phase offset',
    expected: '1.0',
    actual: cohShift.toFixed(4),
    passed: Math.abs(cohShift - 1.0) < 0.001,
  });

  // 9. Rate -18 mm over 12 days -> -1.5 mm/day
  const rate = rateMmPerDay(-0.018, 12);
  results.push({
    name: 'Rate calculation',
    expected: '-1.5 mm/day',
    actual: `${rate.toFixed(1)} mm/day`,
    passed: Math.abs(rate - -1.5) < 0.01,
  });

  // 10. Robust z (baseline 1,2,3,4,5, x = 6 -> m = 3, MAD = 1, z = 2.02)
  const rz = robustZ(6, [1, 2, 3, 4, 5]);
  results.push({
    name: 'Robust z-score',
    expected: 'm = 3, MAD = 1, z = 2.02',
    actual: `m = ${rz.median}, MAD = ${rz.mad}, z = ${rz.z.toFixed(2)}`,
    passed: Math.abs(rz.median - 3) < 0.001 && Math.abs(rz.mad - 1) < 0.001 && Math.abs(rz.z - 2.02) < 0.02,
  });

  // 11. Anomaly index z = (2.02, 7, missing), z_sat = 3.5 -> A = 0.79, K = 2
  const ai = anomalyIndex([2.02, 7.0, null], 3.5);
  results.push({
    name: 'Anomaly index',
    expected: 'A = 0.79, K = 2',
    actual: `A = ${ai.anomalyIndex.toFixed(2)}, K = ${ai.validCount}`,
    passed: Math.abs(ai.anomalyIndex - 0.79) < 0.02 && ai.validCount === 2,
  });

  // 12. Speckle N = 16 -> sigma_dB = 1.09 dB, sigma_delta = 1.53 dB
  const sp = speckleSigmaDb(16);
  results.push({
    name: 'Speckle (N = 16)',
    expected: 'σ_dB = 1.09 dB, σ_Δ = 1.53 dB',
    actual: `σ_dB = ${sp.sigmaDb.toFixed(2)} dB, σ_Δ = ${sp.sigmaDeltaDb.toFixed(2)} dB`,
    passed: Math.abs(sp.sigmaDb - 1.09) < 0.02 && Math.abs(sp.sigmaDeltaDb - 1.53) < 0.02,
  });

  // 13. Class area (1000 pixels, 20 m spacing -> 0.4 km²)
  const ca = classAreaKm2(1000, 20, 20);
  results.push({
    name: 'Class area',
    expected: '0.4 km²',
    actual: `${ca.toFixed(2)} km²`,
    passed: Math.abs(ca - 0.4) < 0.001,
  });

  // 14. Tropospheric Slant Delay & Differential Phase (P0 = 1013.25 hPa, PWV = 40 mm, theta = 37 deg)
  const zhdTest = calculateZhd(1013.25, 21.8);
  const zwdTest = calculateZwd(40.0);
  const stdTest = calculateSlantDelay(zhdTest, zwdTest, 37.0);
  // Differential test: 50 mm excess slant delay (0.05 m) at L-band (0.24 m)
  const deltaPhaseTropo = differentialTroposphericPhase(0.05, 0.24);
  results.push({
    name: 'Tropospheric Slant Delay & InSAR Phase',
    expected: 'STD ~ 3.21 m, Δφ = -2.62 rad',
    actual: `STD = ${stdTest.toFixed(2)} m, Δφ = ${deltaPhaseTropo.toFixed(2)} rad`,
    passed: Math.abs(stdTest - 3.21) < 0.05 && Math.abs(deltaPhaseTropo - -2.62) < 0.05,
  });

  return results;
}
