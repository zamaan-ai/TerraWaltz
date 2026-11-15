/**
 * TerraWaltz 12-Day Orbital Cycles & Backscatter Time Series View
 * Warm Sand / Beige Aesthetic with spacious, approachable layout.
 */

import React, { useState } from 'react';
import { Clock, TrendingUp, AlertTriangle, Layers, Calendar } from 'lucide-react';
import { TimeSeriesPoint } from '../services/radarEngine';
import { Hotspot } from '../data/hotspots';

interface TimeSeriesCyclesViewProps {
  series: TimeSeriesPoint[];
  hotspot: Hotspot;
  currentCycleIndex: number;
  onSelectCycle: (index: number) => void;
}

export const TimeSeriesCyclesView: React.FC<TimeSeriesCyclesViewProps> = ({
  series,
  hotspot,
  currentCycleIndex,
  onSelectCycle,
}) => {
  const [activeMetric, setActiveMetric] = useState<'backscatter' | 'water' | 'coherence'>('backscatter');

  const selectedPoint = series[currentCycleIndex];

  return (
    <div className="flex-1 bg-[#F7F5F0] text-[#201D1A] overflow-y-auto p-8 select-none">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-[#E5DFD3] pb-6">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold text-[#E65100] uppercase tracking-wider mb-1.5">
              <Clock className="w-4 h-4" />
              <span>Multi-Temporal InSAR & Backscatter Baseline</span>
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-[#201D1A]">
              12-Day Orbital Revisit Sequence: {hotspot.name}
            </h1>
            <p className="text-sm text-[#696259] mt-1.5 max-w-2xl leading-relaxed">
              NISAR exact 12-day repeat orbit (Relative Track 089, Frame 045). Shows seasonal monsoon backscatter dynamics, Otsu water fraction, and InSAR phase coherence.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs font-bold text-[#696259]">Metric:</span>
            <div className="flex rounded-xl bg-white p-1 border border-[#E5DFD3] text-xs shadow-soft">
              <button
                onClick={() => setActiveMetric('backscatter')}
                className={`px-3.5 py-1.5 rounded-lg transition-all cursor-pointer font-semibold ${
                  activeMetric === 'backscatter'
                    ? 'bg-[#E65100] text-white shadow-xs'
                    : 'text-[#696259] hover:text-[#201D1A]'
                }`}
              >
                Echo (dB)
              </button>
              <button
                onClick={() => setActiveMetric('water')}
                className={`px-3.5 py-1.5 rounded-lg transition-all cursor-pointer font-semibold ${
                  activeMetric === 'water'
                    ? 'bg-[#E65100] text-white shadow-xs'
                    : 'text-[#696259] hover:text-[#201D1A]'
                }`}
              >
                Water Fraction
              </button>
              <button
                onClick={() => setActiveMetric('coherence')}
                className={`px-3.5 py-1.5 rounded-lg transition-all cursor-pointer font-semibold ${
                  activeMetric === 'coherence'
                    ? 'bg-[#E65100] text-white shadow-xs'
                    : 'text-[#696259] hover:text-[#201D1A]'
                }`}
              >
                Coherence (γ)
              </button>
            </div>
          </div>
        </div>

        {/* Multi-Channel Visualization Box */}
        <div className="bg-white p-8 rounded-3xl border border-[#E5DFD3] shadow-soft space-y-6">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-4">
              <span className="font-bold text-sm text-[#201D1A]">
                Temporal Profile (June – November 2026)
              </span>
              <div className="flex items-center gap-3 text-xs font-mono">
                {activeMetric === 'backscatter' && (
                  <>
                    <span className="flex items-center gap-1.5 text-[#0891B2] font-semibold">
                      <span className="w-3 h-3 rounded bg-[#0891B2]" />
                      <span>Co-pol HH (dB)</span>
                    </span>
                    <span className="flex items-center gap-1.5 text-[#E65100] font-semibold">
                      <span className="w-3 h-3 rounded bg-[#E65100]" />
                      <span>Cross-pol HV (dB)</span>
                    </span>
                  </>
                )}
                {activeMetric === 'water' && (
                  <span className="flex items-center gap-1.5 text-[#0891B2] font-semibold">
                    <span className="w-3 h-3 rounded bg-[#0891B2]" />
                    <span>Otsu Inundation Fraction</span>
                  </span>
                )}
                {activeMetric === 'coherence' && (
                  <span className="flex items-center gap-1.5 text-amber-700 font-semibold">
                    <span className="w-3 h-3 rounded bg-amber-500" />
                    <span>InSAR Coherence Magnitude (γ)</span>
                  </span>
                )}
              </div>
            </div>

            <div className="text-xs font-mono font-bold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-lg border border-emerald-200">
              Repeat Cycle: Exactly 12 Days
            </div>
          </div>

          {/* Dual-Maturity Calibration Indicator (Section 3.4 & Audit) */}
          <div className="flex flex-wrap items-center justify-between gap-2 p-3 bg-[#FAF8F5] rounded-xl border border-[#E5DFD3] text-[11px] font-mono">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
              <span className="font-bold text-amber-900">PROVISIONAL (CRID P05023)</span>
              <span className="text-[#696259]">· Cycles C25–C35 (Pre-21 Oct 2026)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-600" />
              <span className="font-bold text-emerald-900">VALIDATED (CRID P05036)</span>
              <span className="text-[#696259]">· Cycles C36+ (Post-21 Oct 2026)</span>
            </div>
            <span className="text-emerald-700 bg-emerald-100/70 px-2 py-0.5 rounded font-bold">
              ✓ Calibration Verified across 21–23 Oct Boundary
            </span>
          </div>

          {/* Graph Stage */}
          <div className="relative h-64 w-full bg-[#FAF8F5] rounded-2xl border border-[#E5DFD3] p-5 flex flex-col justify-between">
            {/* Guide lines */}
            <div className="absolute inset-x-5 inset-y-6 flex flex-col justify-between pointer-events-none opacity-40">
              <div className="border-b border-[#E5DFD3]" />
              <div className="border-b border-[#E5DFD3]" />
              <div className="border-b border-[#E5DFD3]" />
              <div className="border-b border-[#E5DFD3]" />
            </div>

            {/* Permanent Mission Gap Indicator (27 Jul – 10 Aug 2026) */}
            <div
              className="absolute top-2 bottom-9 bg-amber-100/75 border-x-2 border-dashed border-amber-500/80 pointer-events-none flex flex-col items-center justify-center text-center rounded-sm z-20 shadow-xs"
              style={{ left: '30%', width: '9%' }}
            >
              <AlertTriangle className="w-4 h-4 text-amber-700 mb-0.5 animate-pulse" />
              <span className="text-[9px] font-mono text-amber-950 font-extrabold px-1 leading-tight">
                Permanent Mission Gap<br/>(27 Jul – 10 Aug 2026)
              </span>
            </div>

            {/* Bars */}
            <div className="relative flex-1 flex items-end justify-between z-10 px-2 pb-2">
              {series.map((pt, idx) => {
                const isSelected = idx === currentCycleIndex;
                if (pt.isGap) {
                  return (
                    <div
                      key={pt.date}
                      className="flex-1 flex flex-col items-center justify-end h-full px-1"
                    >
                      <div className="h-full w-full rounded-md border border-dashed border-amber-400/50 flex items-center justify-center">
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-600/70" />
                      </div>
                    </div>
                  );
                }

                let barHeightPct = 50;
                if (activeMetric === 'backscatter') {
                  barHeightPct = Math.max(10, Math.min(95, ((pt.hh_db + 25) / 20) * 100));
                } else if (activeMetric === 'water') {
                  barHeightPct = Math.max(10, Math.min(95, pt.water_fraction * 180));
                } else if (activeMetric === 'coherence') {
                  barHeightPct = Math.max(10, Math.min(95, pt.coherence * 100));
                }

                return (
                  <div
                    key={pt.date}
                    onClick={() => onSelectCycle(idx)}
                    className="flex-1 flex flex-col items-center justify-end h-full px-1.5 cursor-pointer group"
                  >
                    <div
                      style={{ height: `${barHeightPct}%` }}
                      className={`w-full max-w-[32px] rounded-t-xl transition-all relative ${
                        isSelected
                          ? 'bg-[#E65100] shadow-orange-glow'
                          : 'bg-[#EAE4D8] group-hover:bg-[#E65100]/60'
                      }`}
                    >
                      <div
                        className={`absolute -top-1.5 left-1/2 -translate-x-1/2 w-2.5 h-2.5 rounded-full ${
                          isSelected ? 'bg-white shadow-xs border-2 border-[#E65100]' : 'bg-[#E65100]/80'
                        }`}
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            {/* X-Axis Cycle Labels */}
            <div className="flex justify-between border-t border-[#E5DFD3] pt-2 text-xs font-mono text-[#696259]">
              {series.map((pt, idx) => {
                const isValidated = pt.maturity === 'VALIDATED';
                return (
                  <div
                    key={pt.date}
                    className={`text-center flex-1 ${
                      idx === currentCycleIndex ? 'text-[#E65100] font-bold' : ''
                    }`}
                  >
                    <div>C{pt.cycle}</div>
                    <div className="text-[10px] text-[#948B7D]">{pt.date.slice(5)}</div>
                    <span className={`text-[8px] font-bold px-1 rounded inline-block mt-0.5 ${
                      pt.isGap
                        ? 'bg-red-100 text-red-800'
                        : isValidated
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}>
                      {pt.isGap ? 'GAP' : isValidated ? 'VAL' : 'PROV'}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Selected Point Cards */}
        {selectedPoint && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-5 text-xs font-mono">
            <div className="p-5 rounded-2xl bg-white border border-[#E5DFD3] shadow-soft">
              <span className="text-[11px] text-[#696259] uppercase block font-sans font-bold">
                Acquisition Date & Orbit
              </span>
              <span className="text-base font-bold text-[#201D1A] block mt-1.5">
                {selectedPoint.date} (Cycle {selectedPoint.cycle})
              </span>
              <span className="text-[11px] text-[#948B7D] font-sans">12-Day Exact Revisit</span>
            </div>

            <div className="p-5 rounded-2xl bg-white border border-[#E5DFD3] shadow-soft">
              <span className="text-[11px] text-[#696259] uppercase block font-sans font-bold">
                Co-pol HH & Cross-pol HV
              </span>
              <span className="text-base font-bold text-[#E65100] block mt-1.5">
                {selectedPoint.hh_db} dB · {selectedPoint.hv_db} dB
              </span>
              <span className="text-[11px] text-[#948B7D] font-sans">
                CPR: {selectedPoint.ratio_db} dB
              </span>
            </div>

            <div className="p-5 rounded-2xl bg-white border border-[#E5DFD3] shadow-soft">
              <span className="text-[11px] text-[#696259] uppercase block font-sans font-bold">
                Water Extent & Coherence
              </span>
              <span className="text-base font-bold text-cyan-800 block mt-1.5">
                {(selectedPoint.water_fraction * 100).toFixed(1)}% · γ {selectedPoint.coherence}
              </span>
              <span className="text-[11px] text-[#948B7D] font-sans">Otsu Segmented</span>
            </div>

            <div className="p-5 rounded-2xl bg-white border border-[#E5DFD3] shadow-soft">
              <span className="text-[11px] text-[#696259] uppercase block font-sans font-bold">
                Maturity & CRID
              </span>
              <span className="text-base font-bold text-emerald-700 block mt-1.5">
                {selectedPoint.maturity} ({selectedPoint.crid})
              </span>
              <span className="text-[11px] text-[#948B7D] font-sans">JPL Science Data System</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
