/**
 * TerraWaltz Radar Science & Mathematics Lab
 * Warm Sand / Beige Aesthetic with student & manager friendly guides.
 */

import React, { useState, useEffect } from 'react';
import {
  Cpu,
  CheckCircle2,
  XCircle,
  Calculator,
  RefreshCw,
  Terminal,
  FileCode,
  GraduationCap,
  CloudSun,
} from 'lucide-react';
import {
  runNumericalTestVectors,
  TestVectorResult,
  toDb,
  meanDb,
  losFromPhase,
  speckleSigmaDb,
  parseNisarName,
  calculateZhd,
  calculateZwd,
  calculateSlantDelay,
  differentialTroposphericPhase,
} from '../science/radarMath';

export const MathPhysicsLab: React.FC = () => {
  const [testResults, setTestResults] = useState<TestVectorResult[]>([]);
  const [isVerifying, setIsVerifying] = useState<boolean>(false);

  // 1. Linear vs dB Averaging
  const [val1, setVal1] = useState<number>(1);
  const [val2, setVal2] = useState<number>(100);

  // 2. InSAR Phase to LOS
  const [phaseRad, setPhaseRad] = useState<number>(6.28318);
  const [wavelengthM, setWavelengthM] = useState<number>(0.24);
  const [signConv, setSignConv] = useState<number>(1);

  // 3. Tropospheric Path Delay & Atmospheric Phase Correction (Meteomatics)
  const [pressureHpa, setPressureHpa] = useState<number>(1010.5);
  const [pwvPreMm, setPwvPreMm] = useState<number>(58.6);
  const [pwvPostMm, setPwvPostMm] = useState<number>(41.2);
  const [incAngleDeg, setIncAngleDeg] = useState<number>(37.0);

  // 4. Filename parser
  const [sampleFilename, setSampleFilename] = useState<string>(
    'NISAR_L2_PR_GCOV_026_089_A_045_40_DH_A_20260625T003412_20260625T003448_P05023_P_F_J_001.h5'
  );
  const [parsedTokens, setParsedTokens] = useState<Record<string, unknown> | null>(null);

  const executeTests = () => {
    setIsVerifying(true);
    setTimeout(() => {
      const results = runNumericalTestVectors();
      setTestResults(results);
      setIsVerifying(false);
    }, 200);
  };

  useEffect(() => {
    executeTests();
    handleParse();
  }, []);

  const handleParse = () => {
    try {
      const p = parseNisarName(sampleFilename);
      setParsedTokens(p as any);
    } catch (e: any) {
      setParsedTokens({ error: e.message });
    }
  };

  const linearRes = meanDb([val1, val2]);
  const db1 = toDb(val1);
  const db2 = toDb(val2);
  const naiveDbMean = (db1 + db2) / 2;
  const losDisplacementM = losFromPhase(phaseRad, wavelengthM, signConv);

  // Tropospheric calculations
  const zhd = calculateZhd(pressureHpa, 21.8);
  const zwdPre = calculateZwd(pwvPreMm);
  const zwdPost = calculateZwd(pwvPostMm);
  const stdPreM = calculateSlantDelay(zhd, zwdPre, incAngleDeg);
  const stdPostM = calculateSlantDelay(zhd, zwdPost, incAngleDeg);
  const deltaStdMm = (stdPostM - stdPreM) * 1000.0;
  const deltaTropoPhase = differentialTroposphericPhase(stdPostM - stdPreM, 0.24);
  const falseBiasMm = -deltaStdMm;

  return (
    <div className="flex-1 bg-[#F7F5F0] text-[#201D1A] overflow-y-auto p-8 select-none">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-[#E5DFD3] pb-6">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold text-[#E65100] uppercase tracking-wider mb-1.5">
              <Cpu className="w-4 h-4" />
              <span>DANCE_WITH_ME_MARK-4 Scientific Engine</span>
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-[#201D1A]">
              Radar Physics, Mathematics & Numerical Verification
            </h1>
            <p className="text-sm text-[#696259] mt-1.5 max-w-2xl leading-relaxed">
              Every formula from the specification tested and verified against official Section 15.4 test vectors with zero error tolerance.
            </p>
          </div>

          <button
            onClick={executeTests}
            disabled={isVerifying}
            className="px-5 py-2.5 rounded-xl bg-[#E65100] text-white text-xs font-bold shadow-orange-glow transition-all hover:scale-105 active:scale-95 cursor-pointer flex items-center gap-2 self-start"
          >
            <RefreshCw className={`w-4 h-4 ${isVerifying ? 'animate-spin' : ''}`} />
            <span>Re-verify Test Suite</span>
          </button>
        </div>

        {/* Section 1: Automated Test Vector Table (Section 15.4) */}
        <div className="bg-white p-8 rounded-3xl border border-[#E5DFD3] shadow-soft space-y-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Terminal className="w-5 h-5 text-[#E65100]" />
              <h2 className="text-lg font-bold text-[#201D1A]">
                Section 15.4 Numerical Test Vectors Suite (13 / 13)
              </h2>
            </div>
            <div className="flex items-center gap-2 font-mono text-xs px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200">
              <span className="font-bold">
                {testResults.filter((t) => t.passed).length} / {testResults.length} PASSED
              </span>
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
            </div>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-[#E5DFD3]">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-[#FAF8F5] text-[#696259] border-b border-[#E5DFD3] uppercase text-[11px]">
                <tr>
                  <th className="py-3 px-5">Physical Function</th>
                  <th className="py-3 px-5">Expected Value (Spec)</th>
                  <th className="py-3 px-5">Engine Output</th>
                  <th className="py-3 px-5 text-right">Verification</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5DFD3]">
                {testResults.map((t, idx) => (
                  <tr key={idx} className="hover:bg-[#FAF8F5]/80 transition-colors">
                    <td className="py-3 px-5 font-bold text-[#201D1A]">
                      {t.name}
                    </td>
                    <td className="py-3 px-5 text-[#696259]">{t.expected}</td>
                    <td className="py-3 px-5 text-[#E65100] font-semibold">{t.actual}</td>
                    <td className="py-3 px-5 text-right">
                      {t.passed ? (
                        <span className="inline-flex items-center gap-1.5 text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          <span>PASS</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 text-rose-700 font-bold bg-rose-50 px-2 py-0.5 rounded-md border border-rose-200">
                          <XCircle className="w-3.5 h-3.5 text-rose-600" />
                          <span>FAIL</span>
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Section 2: Interactive Radar Physics Playgrounds */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Playground 1: Linear Power Averaging */}
          <div className="bg-white p-7 rounded-3xl border border-[#E5DFD3] shadow-soft space-y-4">
            <div className="flex items-center gap-2.5">
              <Calculator className="w-5 h-5 text-[#E65100]" />
              <h3 className="text-base font-bold text-[#201D1A]">
                Linear Power Averaging Rule (Section 6.4)
              </h3>
            </div>
            <p className="text-xs text-[#696259] leading-relaxed">
              Why we don’t average decibels directly: Because decibels are logarithmic, averaging them produces an erroneous -7 dB bias. TerraWaltz averages linear powers first, then converts to decibels.
            </p>

            <div className="grid grid-cols-2 gap-4 text-xs">
              <div>
                <label className="text-[11px] font-bold text-[#696259] block mb-1">
                  Pixel 1 Linear Power:
                </label>
                <input
                  type="number"
                  value={val1}
                  onChange={(e) => setVal1(parseFloat(e.target.value) || 0)}
                  className="w-full bg-[#FAF8F5] border border-[#E5DFD3] rounded-xl px-3 py-2 text-xs font-mono text-[#201D1A]"
                />
                <span className="text-[11px] text-[#696259] font-mono mt-1 block">
                  {db1.toFixed(2)} dB
                </span>
              </div>

              <div>
                <label className="text-[11px] font-bold text-[#696259] block mb-1">
                  Pixel 2 Linear Power:
                </label>
                <input
                  type="number"
                  value={val2}
                  onChange={(e) => setVal2(parseFloat(e.target.value) || 0)}
                  className="w-full bg-[#FAF8F5] border border-[#E5DFD3] rounded-xl px-3 py-2 text-xs font-mono text-[#201D1A]"
                />
                <span className="text-[11px] text-[#696259] font-mono mt-1 block">
                  {db2.toFixed(2)} dB
                </span>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-[#FAF8F5] border border-[#E5DFD3] space-y-2 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-emerald-800 font-bold">
                  Correct Linear Mean → dB:
                </span>
                <span className="font-mono text-emerald-800 font-bold text-base">
                  {linearRes.dbMean.toFixed(2)} dB
                </span>
              </div>
              <div className="flex justify-between items-center text-rose-700">
                <span>Flawed Arithmetic Mean of dB:</span>
                <span className="font-mono line-through font-bold">
                  {naiveDbMean.toFixed(2)} dB
                </span>
              </div>
              <div className="text-[11px] text-[#696259] border-t border-[#E5DFD3] pt-2">
                Bias Error Prevented:{' '}
                <span className="text-[#E65100] font-mono font-bold">
                  {(linearRes.dbMean - naiveDbMean).toFixed(2)} dB
                </span>
              </div>
            </div>
          </div>

          {/* Playground 2: InSAR Phase to LOS */}
          <div className="bg-white p-7 rounded-3xl border border-[#E5DFD3] shadow-soft space-y-4">
            <div className="flex items-center gap-2.5">
              <Calculator className="w-5 h-5 text-[#E65100]" />
              <h3 className="text-base font-bold text-[#201D1A]">
                InSAR Phase to Displacement (Section 7.3)
              </h3>
            </div>
            <p className="text-xs text-[#696259] leading-relaxed">
              Formula: d_LOS = s_phi * (lambda / 4pi) * Delta_phi_unw. One 2pi phase cycle represents a 12 cm range change for NISAR L-band (24 cm wavelength).
            </p>

            <div className="grid grid-cols-3 gap-3 text-xs">
              <div>
                <label className="text-[11px] font-bold text-[#696259] block mb-1">
                  Phase Δφ (rad):
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={phaseRad}
                  onChange={(e) => setPhaseRad(parseFloat(e.target.value) || 0)}
                  className="w-full bg-[#FAF8F5] border border-[#E5DFD3] rounded-xl px-3 py-2 text-xs font-mono text-[#201D1A]"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-[#696259] block mb-1">
                  Wavelength λ (m):
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={wavelengthM}
                  onChange={(e) => setWavelengthM(parseFloat(e.target.value) || 0.24)}
                  className="w-full bg-[#FAF8F5] border border-[#E5DFD3] rounded-xl px-3 py-2 text-xs font-mono text-[#201D1A]"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-[#696259] block mb-1">
                  Sign:
                </label>
                <select
                  value={signConv}
                  onChange={(e) => setSignConv(parseInt(e.target.value, 10))}
                  className="w-full bg-[#FAF8F5] border border-[#E5DFD3] rounded-xl px-3 py-2 text-xs font-mono text-[#201D1A]"
                >
                  <option value={1}>+1 (Toward)</option>
                  <option value={-1}>-1 (Away)</option>
                </select>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-[#FAF8F5] border border-[#E5DFD3] space-y-2 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-[#696259]">LOS Range Shift (Metres):</span>
                <span className="font-mono text-cyan-800 font-bold text-sm">
                  {losDisplacementM.toFixed(4)} m
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[#696259]">LOS Displacement (mm):</span>
                <span className="font-mono text-[#E65100] font-bold text-lg">
                  {(losDisplacementM * 1000).toFixed(1)} mm
                </span>
              </div>
              <span className="text-[11px] text-[#696259] block border-t border-[#E5DFD3] pt-2">
                Note: A single LOS raster is a projection along 40° look geometry and is never labeled vertical uplift.
              </span>
            </div>
          </div>

          {/* Playground 3: Tropospheric Path Delay & Meteomatics Weather Engine */}
          <div className="bg-white p-7 rounded-3xl border border-[#E5DFD3] shadow-soft space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CloudSun className="w-5 h-5 text-[#0891B2]" />
                <h3 className="text-base font-bold text-[#201D1A]">
                  Tropospheric Phase Delay (Meteomatics)
                </h3>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#0891B2]/10 text-[#0891B2] font-bold">
                GLOBAL OFFER
              </span>
            </div>
            <p className="text-xs text-[#696259] leading-relaxed">
              Saastamoinen (1972) & Askne-Nordh (1987) model. Differential water vapor (PWV) between repeat passes causes false ground motion in InSAR.
            </p>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <label className="text-[11px] font-bold text-[#696259] block mb-1">
                  Pass 1 PWV (mm):
                </label>
                <input
                  type="number"
                  step="0.5"
                  value={pwvPreMm}
                  onChange={(e) => setPwvPreMm(parseFloat(e.target.value) || 0)}
                  className="w-full bg-[#FAF8F5] border border-[#E5DFD3] rounded-xl px-3 py-2 text-xs font-mono text-[#201D1A]"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-[#696259] block mb-1">
                  Pass 2 PWV (mm):
                </label>
                <input
                  type="number"
                  step="0.5"
                  value={pwvPostMm}
                  onChange={(e) => setPwvPostMm(parseFloat(e.target.value) || 0)}
                  className="w-full bg-[#FAF8F5] border border-[#E5DFD3] rounded-xl px-3 py-2 text-xs font-mono text-[#201D1A]"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-[#696259] block mb-1">
                  Surface P₀ (hPa):
                </label>
                <input
                  type="number"
                  step="1"
                  value={pressureHpa}
                  onChange={(e) => setPressureHpa(parseFloat(e.target.value) || 1010)}
                  className="w-full bg-[#FAF8F5] border border-[#E5DFD3] rounded-xl px-3 py-2 text-xs font-mono text-[#201D1A]"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-[#696259] block mb-1">
                  Incidence θ (°):
                </label>
                <input
                  type="number"
                  step="1"
                  value={incAngleDeg}
                  onChange={(e) => setIncAngleDeg(parseFloat(e.target.value) || 37)}
                  className="w-full bg-[#FAF8F5] border border-[#E5DFD3] rounded-xl px-3 py-2 text-xs font-mono text-[#201D1A]"
                />
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-[#FAF8F5] border border-[#E5DFD3] space-y-2 text-xs">
              <div className="flex justify-between items-center text-xs">
                <span className="text-[#696259]">Zenith Hydrostatic (ZHD):</span>
                <span className="font-mono text-[#201D1A] font-bold">{zhd.toFixed(3)} m</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-[#696259]">Δ Slant Delay (ΔSTD):</span>
                <span className="font-mono text-[#0891B2] font-bold">{deltaStdMm > 0 ? `+${deltaStdMm.toFixed(1)}` : deltaStdMm.toFixed(1)} mm</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-[#696259]">Atmospheric Phase Error:</span>
                <span className="font-mono text-purple-700 font-bold">{deltaTropoPhase.toFixed(2)} rad</span>
              </div>
              <div className="flex justify-between items-center border-t border-[#E5DFD3] pt-2">
                <span className="text-emerald-800 font-bold">Atmospheric Bias Removed:</span>
                <span className="font-mono text-emerald-800 font-bold text-base">
                  {falseBiasMm > 0 ? `+${falseBiasMm.toFixed(1)}` : falseBiasMm.toFixed(1)} mm
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Section 3: NISAR 18-Token Filename Parser */}
        <div className="bg-white p-8 rounded-3xl border border-[#E5DFD3] shadow-soft space-y-5">
          <div className="flex items-center gap-2.5">
            <FileCode className="w-5 h-5 text-[#E65100]" />
            <h3 className="text-base font-bold text-[#201D1A]">
              NISAR 18-Field Filename Parser (JPL D-102274 Rev F)
            </h3>
          </div>
          <p className="text-xs text-[#696259]">
            Paste any official NISAR product name to decode all acquisition, orbit, maturity, and processing metadata.
          </p>

          <div className="flex gap-3">
            <input
              type="text"
              value={sampleFilename}
              onChange={(e) => setSampleFilename(e.target.value)}
              className="flex-1 bg-[#FAF8F5] border border-[#E5DFD3] rounded-xl px-4 py-2.5 text-xs font-mono text-[#201D1A]"
            />
            <button
              onClick={handleParse}
              className="px-5 py-2.5 rounded-xl bg-[#F0ECE1] hover:bg-[#E65100] hover:text-white transition-colors text-xs font-bold cursor-pointer"
            >
              Parse Tokens
            </button>
          </div>

          {parsedTokens && (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 text-xs font-mono">
              {Object.entries(parsedTokens)
                .filter(([k]) => k !== 'raw')
                .map(([key, val]) => (
                  <div key={key} className="p-3.5 rounded-xl bg-[#FAF8F5] border border-[#E5DFD3]">
                    <span className="text-[10px] text-[#696259] uppercase block font-sans font-bold">
                      {key}
                    </span>
                    <span className="text-[#E65100] font-bold truncate block mt-1">
                      {String(val)}
                    </span>
                  </div>
                ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
