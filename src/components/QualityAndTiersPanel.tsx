/**
 * TerraWaltz Three Tiers of Quantity & Quality Audit Panel
 * Warm Sand / Beige Aesthetic with spacious, approachable layout.
 */

import React, { useState } from 'react';
import { ShieldCheck, Layers, AlertTriangle, FileText, CheckCircle2, GraduationCap, Briefcase } from 'lucide-react';
import { ScanResult } from '../services/radarEngine';
import { AudienceLens } from './AudienceLensBar';

interface QualityAndTiersPanelProps {
  scanResult: ScanResult | null;
  audienceLens: AudienceLens;
}

export const QualityAndTiersPanel: React.FC<QualityAndTiersPanelProps> = ({
  scanResult,
  audienceLens,
}) => {
  const [activeTab, setActiveTab] = useState<'tiers' | 'quality' | 'provenance'>('tiers');

  if (!scanResult) {
    return (
      <div className="p-8 text-center text-xs text-[#696259] font-mono">
        No active radar scan loaded. Select a hotspot or click &ldquo;Run AI Radar Scan&rdquo;.
      </div>
    );
  }

  const { statistics, quality, indices, products, los_sign_convention } = scanResult;

  return (
    <div className="flex flex-col h-full bg-[#FAF8F5] border-l border-[#E5DFD3] text-[#201D1A] text-xs select-none overflow-y-auto">
      {/* Panel Header */}
      <div className="p-6 bg-white border-b border-[#E5DFD3] flex items-center justify-between shadow-2xs">
        <div className="flex items-center gap-2.5">
          <Layers className="w-5 h-5 text-[#E65100]" />
          <div>
            <span className="font-bold text-sm tracking-tight text-[#201D1A] block">
              Science & Quality Audit
            </span>
            <span className="text-[11px] text-[#696259]">
              Verified Radar Quantities
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2 font-mono text-xs px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200">
          <span className="w-2 h-2 rounded-full bg-emerald-500" />
          <span className="font-bold">{scanResult.status}</span>
        </div>
      </div>

      {/* Approachable Student/Manager Plain-Language Summary Box */}
      <div className="m-6 p-4 rounded-2xl bg-white border border-[#E5DFD3] shadow-soft space-y-2.5">
        <div className="flex items-center gap-2 text-xs font-bold text-[#E65100]">
          {audienceLens === 'student' ? (
            <GraduationCap className="w-4 h-4" />
          ) : (
            <Briefcase className="w-4 h-4" />
          )}
          <span>
            {audienceLens === 'student' ? 'Student Field Notes:' : 'Manager Executive Summary:'}
          </span>
        </div>
        <p className="text-xs text-[#696259] leading-relaxed">
          {statistics.water_area_delta_km2 > 0 ? (
            <>
              Water bodies expanded by <strong>+{statistics.water_area_delta_km2} km²</strong> between the two passes. Backscatter shifted by <strong>{statistics.delta_db} dB</strong>, matching seasonal monsoon tidal expansion.
            </>
          ) : (
            <>
              Surface backscatter remained consistent with seasonal vegetation cycles, with an anomaly rating of <strong>{indices.anomaly_index} / 1.0</strong>.
            </>
          )}
        </p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-[#E5DFD3] px-6 gap-6 bg-white">
        <button
          onClick={() => setActiveTab('tiers')}
          className={`pb-3 text-xs font-semibold cursor-pointer transition-all ${
            activeTab === 'tiers'
              ? 'text-[#E65100] border-b-2 border-[#E65100]'
              : 'text-[#696259] hover:text-[#201D1A]'
          }`}
        >
          Three Tiers of Quantity
        </button>
        <button
          onClick={() => setActiveTab('quality')}
          className={`pb-3 text-xs font-semibold cursor-pointer transition-all ${
            activeTab === 'quality'
              ? 'text-[#E65100] border-b-2 border-[#E65100]'
              : 'text-[#696259] hover:text-[#201D1A]'
          }`}
        >
          Quality Gates
        </button>
        <button
          onClick={() => setActiveTab('provenance')}
          className={`pb-3 text-xs font-semibold cursor-pointer transition-all ${
            activeTab === 'provenance'
              ? 'text-[#E65100] border-b-2 border-[#E65100]'
              : 'text-[#696259] hover:text-[#201D1A]'
          }`}
        >
          Provenance
        </button>
      </div>

      {/* Tab 1: Three Tiers of Quantity (Spaced Out & Clear) */}
      {activeTab === 'tiers' && (
        <div className="p-6 space-y-6">
          {/* Tier 1 */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between text-xs font-bold text-[#696259] uppercase tracking-wider">
              <span>Tier 1 · Official Observations</span>
              <span className="text-cyan-700 font-mono text-[11px]">NISAR Granules</span>
            </div>
            <div className="p-4 rounded-2xl bg-white border border-[#E5DFD3] shadow-soft space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-[#696259]">Product Family:</span>
                <span className="font-mono font-bold text-[#201D1A]">
                  {products[0]?.product_type} ({products[0]?.band}-band)
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[#696259]">Data Maturity:</span>
                <span className="font-mono font-bold text-emerald-700 px-2 py-0.5 rounded bg-emerald-50">
                  {products[0]?.maturity}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[#696259]">Processor ID (CRID):</span>
                <span className="font-mono font-bold text-[#E65100]">
                  {products[0]?.crid}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[#696259]">Look Geometry:</span>
                <span className="font-mono text-[#201D1A]">
                  40° from vertical (240 km swath)
                </span>
              </div>
            </div>
          </div>

          {/* Tier 2 */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between text-xs font-bold text-[#696259] uppercase tracking-wider">
              <span>Tier 2 · Computed Physics</span>
              <span className="text-[#E65100] font-mono text-[11px]">Physical Laws</span>
            </div>
            <div className="p-4 rounded-2xl bg-white border border-[#E5DFD3] shadow-soft space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-[#696259]">Baseline Backscatter:</span>
                <span className="font-mono font-bold text-[#201D1A]">
                  {statistics.baseline_power_db} dB
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[#696259]">Temporal Ratio (Δγ⁰):</span>
                <span className="font-mono font-bold text-[#E65100]">
                  {statistics.delta_db > 0 ? `+${statistics.delta_db}` : statistics.delta_db} dB
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[#696259]">Water Area Change:</span>
                <span className="font-mono font-bold text-cyan-700">
                  {statistics.water_area_delta_km2 > 0 ? `+${statistics.water_area_delta_km2}` : statistics.water_area_delta_km2} km²
                </span>
              </div>
              {statistics.max_los_displacement_mm !== 0 && (
                <div className="flex flex-col gap-1 border-t border-[#E5DFD3] pt-2">
                  <div className="flex justify-between items-center">
                    <span className="text-[#696259]">Single-Pass InSAR Measurement:</span>
                    <span className="font-mono font-bold text-amber-700">
                      {statistics.max_los_displacement_mm} mm
                    </span>
                  </div>
                  <span className="text-[10px] text-[#948B7D] font-mono">
                    LOS displacement (mm, toward sensor positive, θ ≈ 40°)
                  </span>
                </div>
              )}
              <div className="flex justify-between items-center text-[11px] pt-1 border-t border-[#E5DFD3]">
                <span className="text-[#696259]">Power Averaging:</span>
                <span className="font-mono text-emerald-700 font-bold">
                  Linear Unbiased Enforced (10*log10(mean(power)))
                </span>
              </div>
            </div>
          </div>

          {/* Tier 3 */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between text-xs font-bold text-[#696259] uppercase tracking-wider">
              <span>Tier 3 · Decision Metrics</span>
              <span className="text-amber-600 font-mono text-[11px]">Decision Support</span>
            </div>
            <div className="p-4 rounded-2xl bg-white border border-[#E5DFD3] shadow-soft space-y-3">
              <div>
                <span className="text-[11px] text-[#696259] uppercase font-bold block mb-1">
                  Metric Designation:
                </span>
                <span className="font-mono font-bold text-[#201D1A] text-xs leading-snug block bg-[#FAF8F5] p-2 rounded-lg border border-[#E5DFD3]">
                  TerraWaltz SCEI (Surface Change Evidence Index — Prototype Heuristic)
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[#696259]">Anomaly Index (A):</span>
                <span className="font-mono font-bold text-[#E65100] text-sm">
                  {indices.anomaly_index} / 1.00
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[#696259]">Calculated SCEI:</span>
                <span className="font-mono font-bold text-[#E65100] text-base">
                  {indices.scei} / 100
                </span>
              </div>
              <div className="flex justify-between items-center pt-2 border-t border-[#E5DFD3]">
                <span className="text-[#696259]">Confidence Tag:</span>
                <span className={`font-mono font-extrabold px-2.5 py-1 rounded text-xs tracking-wider ${
                  indices.confidence === 'High'
                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                    : 'bg-amber-100 text-amber-800 border border-amber-300'
                }`}>
                  {indices.confidence} CONFIDENCE
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Quality Gates */}
      {activeTab === 'quality' && (
        <div className="p-6 space-y-4">
          <div className="p-5 rounded-2xl bg-white border border-[#E5DFD3] shadow-soft space-y-3.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span className="font-bold text-xs text-[#201D1A]">Valid Coverage Gate</span>
              </div>
              <span className="font-mono text-emerald-700 font-bold">
                {(quality.valid_fraction * 100).toFixed(1)}% (Pass &ge; 80%)
              </span>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span className="font-bold text-xs text-[#201D1A]">Coherence Mean</span>
              </div>
              <span className="font-mono text-[#201D1A] font-semibold">
                {quality.coherence.mean.toFixed(2)}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span className="font-bold text-xs text-[#201D1A]">Connected Components</span>
              </div>
              <span className="font-mono text-[#201D1A] font-semibold">
                {(quality.connected_components_coverage * 100).toFixed(0)}%
              </span>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span className="font-bold text-xs text-[#201D1A]">Speckle Floor</span>
              </div>
              <span className="font-mono text-[#201D1A] font-semibold">
                σ_dB = {statistics.speckle_sigma_db} dB
              </span>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-white border border-[#E5DFD3] shadow-soft space-y-2 text-[#696259]">
            <span className="font-bold text-xs text-[#201D1A] block">Quality Notes:</span>
            {quality.notes.map((n, idx) => (
              <p key={idx} className="text-[11px] leading-relaxed">
                • {n}
              </p>
            ))}
          </div>
        </div>
      )}

      {/* Tab 3: Provenance */}
      {activeTab === 'provenance' && (
        <div className="p-6 space-y-4 font-mono text-xs">
          <div className="p-5 rounded-2xl bg-white border border-[#E5DFD3] shadow-soft space-y-3">
            <span className="text-[#E65100] font-bold block mb-1">
              Source NISAR Product Granules:
            </span>
            {products.map((p, idx) => (
              <div key={idx} className="border-b border-[#E5DFD3] pb-3 last:border-b-0 space-y-1">
                <div className="text-[#201D1A] break-all font-semibold text-[11px]">
                  {p.product_id}
                </div>
                <div className="text-[#696259] flex flex-wrap gap-2 text-[10px]">
                  <span>Track {p.track}</span>
                  <span>Frame {p.frame}</span>
                  <span>Pol: {p.polarization}</span>
                  <span>CRS: {p.crs}</span>
                </div>
              </div>
            ))}
          </div>

          <div className="p-4 rounded-2xl bg-white border border-[#E5DFD3] shadow-soft space-y-1">
            <span className="text-[#201D1A] font-bold block">LOS Sign Convention:</span>
            <span className="text-emerald-700 font-semibold">{los_sign_convention}</span>
            <p className="text-[#696259] text-[11px] pt-1">
              Positive values indicate ground motion towards the satellite along the line-of-sight.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
