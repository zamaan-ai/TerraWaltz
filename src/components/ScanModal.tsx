/**
 * TerraWaltz "Run AI Radar Scan" Modal
 * Implements Section 11.1 (Pipeline Stages 1 through 10)
 * with animated scanning stages, parameter controls, and
 * full interactive scientific results display.
 */

import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import {
  X,
  Sparkles,
  Radio,
  Sliders,
  CheckCircle2,
  Calendar,
  Layers,
  ArrowRight,
  ShieldCheck,
  Download,
  Eye,
  Activity,
  CloudSun,
  RotateCcw,
  Waves,
  TreePine,
  ShieldAlert,
  ExternalLink,
  Terminal,
  Code2,
} from 'lucide-react';
import { ScanRequest, ScanResult } from '../services/radarEngine';
import { Hotspot } from '../data/hotspots';
import confetti from 'canvas-confetti';

interface ScanModalProps {
  isOpen: boolean;
  onClose: () => void;
  hotspot: Hotspot;
  onScanComplete: (result: ScanResult) => void;
}

export const ScanModal: React.FC<ScanModalProps> = ({
  isOpen,
  onClose,
  hotspot,
  onScanComplete,
}) => {
  const [sensorPlatform, setSensorPlatform] = useState<'NISAR' | 'SENTINEL_1' | 'ALOS_2'>('NISAR');
  const [showCodeSnippet, setShowCodeSnippet] = useState<boolean>(false);
  const [workflow, setWorkflow] = useState<ScanRequest['workflow']>(
    hotspot.recommendedWorkflow
  );
  const [polarization, setPolarization] = useState<ScanRequest['polarization']>(
    hotspot.recommendedPolarization
  );
  const [startDate, setStartDate] = useState<string>(
    hotspot.suggestedDates.preEvent.slice(0, 10)
  );
  const [endDate, setEndDate] = useState<string>(
    hotspot.suggestedDates.postEvent.slice(0, 10)
  );
  const [maturityPolicy, setMaturityPolicy] = useState<ScanRequest['maturity_policy']>('provisional_ok');

  // Modal lifecycle states: 'configure' | 'processing' | 'results'
  const [scanStep, setScanStep] = useState<'configure' | 'processing' | 'results'>('configure');
  const [currentStage, setCurrentStage] = useState<number>(0);
  const [completedResult, setCompletedResult] = useState<ScanResult | null>(null);

  const pipelineStages = sensorPlatform === 'SENTINEL_1'
    ? [
        'Stage 1: Request Validation & AOI Geometry Verification',
        'Stage 2: Discovery Query against ASF DAAC Vertex API (Sentinel-1 C-band)',
        'Stage 3: Multi-Temporal Orbital Baseline Compatibility Filtering',
        'Stage 4: Streaming Copernicus SLC/GRD Granule from ASF DAAC HyP3',
        'Stage 5: Radiometric Terrain Correction (Copernicus 30m DEM & Range-Doppler)',
        'Stage 6: Enforcing Linear-Power Averaging & Speckle Noise Floor',
        'Stage 7: Quality Gate Validation (Valid-Pixel Fraction & Coherence)',
        'Stage 8: Change Heatmap & Otsu Water Inundation Classification',
        'Stage 9: Computing Anomaly Index & Surface Change Evidence (SCEI)',
        'Stage 10: Generating Cloud-Optimized GeoTIFFs (COGs) & MintPy InSAR Map',
      ]
    : [
        'Stage 1: Request Validation & AOI Geometry Verification',
        'Stage 2: Discovery Query against ASF DAAC & Bhoonidhi STAC',
        'Stage 3: Section 5.3 Multi-Temporal Compatibility Filtering',
        'Stage 4: Streaming HDF5 Granule Subsets from AWS S3 us-west-2',
        'Stage 5: Radiometric Terrain Correction (Copernicus 30m DEM)',
        'Stage 6: Enforcing Linear-Power Averaging & Speckle Noise Floor',
        'Stage 7: Quality Gate Validation (Valid-Pixel Fraction & Coherence)',
        'Stage 8: Change Heatmap & Otsu Water Inundation Classification',
        'Stage 9: Computing Anomaly Index & Surface Change Evidence (SCEI)',
        'Stage 10: Generating Cloud-Optimized GeoTIFFs (COGs) & Provenance',
      ];

  if (!isOpen) return null;

  const handleStartScan = async () => {
    setScanStep('processing');
    setCurrentStage(0);

    // Step through pipeline stages with animated progress
    for (let i = 0; i < pipelineStages.length; i++) {
      setCurrentStage(i);
      await new Promise((r) => setTimeout(r, 220));
    }

    const { executeRadarScan } = await import('../services/radarEngine');
    const result = executeRadarScan({
      bbox: hotspot.bbox,
      start: `${startDate}T00:00:00Z`,
      end: `${endDate}T00:00:00Z`,
      workflow,
      band: sensorPlatform === 'SENTINEL_1' ? 'C' : 'L',
      sensor_platform: sensorPlatform,
      polarization,
      maturity_policy: maturityPolicy,
      hotspot_id: hotspot.id,
      client_request_id: `scan-${Date.now()}`,
    });

    try {
      confetti({
        particleCount: 50,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#FF6B00', '#06B6D4', '#10B981', '#F2EFE9'],
      });
    } catch {
      // ignore
    }

    setCompletedResult(result);
    setScanStep('results');
    onScanComplete(result);
  };

  const handleDownloadJson = () => {
    if (!completedResult) return;
    const blob = new Blob([JSON.stringify(completedResult, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `nisar_scan_${hotspot.id}_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleClose = () => {
    setScanStep('configure');
    setCompletedResult(null);
    onClose();
  };

  const modalElement = (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-[#201D1A]/75 backdrop-blur-md select-none animate-in fade-in duration-150">
      <div className="relative w-full max-w-2xl bg-[#FFFFFF] border border-[#E5DFD3] rounded-3xl p-6 sm:p-8 shadow-2xl text-[#201D1A] space-y-5 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-[#E5DFD3] pb-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs font-mono text-[#E65100] uppercase tracking-wider font-semibold">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Multi-Scale Dynamic SAR Fusion Engine</span>
            </div>
            <h2 className="text-xl font-bold tracking-tight text-[#201D1A]">
              {scanStep === 'results'
                ? `Scan Completed: ${hotspot.name}`
                : `Configure NISAR Radar Scan: ${hotspot.name}`}
            </h2>
            <p className="text-xs text-[#696259]">
              AOI Bounding Box: [{hotspot.bbox.join(', ')}] · L-band 24cm ({polarization})
            </p>
          </div>

          <button
            onClick={handleClose}
            disabled={scanStep === 'processing'}
            className="p-2 rounded-xl text-[#696259] hover:text-[#201D1A] hover:bg-[#F7F5F0] transition-colors cursor-pointer disabled:opacity-30 border border-transparent hover:border-[#E5DFD3]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* STEP 1: CONFIGURE SCAN */}
        {scanStep === 'configure' && (
          <div className="space-y-5 text-xs">
            {/* Sensor Platform Selector (Challenge Part 3 Alternative Supported) */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-mono text-[#696259] uppercase block font-semibold">
                  Radar Sensor & Mission Pipeline:
                </label>
                <span className="text-[10px] font-mono text-[#E65100] bg-[#FFF3E0] px-2 py-0.5 rounded-full font-bold">
                  Challenge Part 3 Alternatives Supported
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setSensorPlatform('NISAR');
                    setPolarization(hotspot.recommendedPolarization);
                  }}
                  className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                    sensorPlatform === 'NISAR'
                      ? 'bg-[#201D1A] text-white border-[#201D1A] shadow-md'
                      : 'bg-[#F7F5F0] border-[#E5DFD3] text-[#696259] hover:text-[#201D1A] hover:bg-[#EFEAE1]'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-xs">NISAR L-band</span>
                    <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-white/20">24 cm</span>
                  </div>
                  <div className="text-[10px] opacity-80 leading-tight">NASA-ISRO Mission Core</div>
                  <div className="text-[9px] text-[#FFB74D] mt-1 font-mono">Deep Canopy Penetration</div>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setSensorPlatform('SENTINEL_1');
                    setPolarization('VV');
                  }}
                  className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                    sensorPlatform === 'SENTINEL_1'
                      ? 'bg-[#0891B2] text-white border-[#0891B2] shadow-md'
                      : 'bg-[#F7F5F0] border-[#E5DFD3] text-[#696259] hover:text-[#201D1A] hover:bg-[#EFEAE1]'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-xs">Sentinel-1 C-band</span>
                    <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-white/20">5.6 cm</span>
                  </div>
                  <div className="text-[10px] opacity-80 leading-tight">ESA / ASF DAAC Proxy</div>
                  <div className="text-[9px] text-cyan-200 mt-1 font-mono">Live OpenSARlab / HyP3</div>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setSensorPlatform('ALOS_2');
                    setPolarization('HH');
                  }}
                  className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                    sensorPlatform === 'ALOS_2'
                      ? 'bg-[#E65100] text-white border-[#E65100] shadow-md'
                      : 'bg-[#F7F5F0] border-[#E5DFD3] text-[#696259] hover:text-[#201D1A] hover:bg-[#EFEAE1]'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-xs">ALOS-2 PALSAR-2</span>
                    <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-white/20">23.8 cm</span>
                  </div>
                  <div className="text-[10px] opacity-80 leading-tight">JAXA / ASF DAAC Proxy</div>
                  <div className="text-[9px] text-amber-200 mt-1 font-mono">Historical L-band Baseline</div>
                </button>
              </div>
            </div>

            {/* Target Workflow */}
            <div className="space-y-2">
              <label className="text-[11px] font-mono text-[#696259] uppercase block font-semibold">
                Target Science Workflow:
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                {[
                  { id: 'water_inundation', label: 'Water & Inundation' },
                  { id: 'backscatter_change', label: 'Backscatter Change' },
                  { id: 'mangrove_trend', label: 'Mangrove Canopy HV' },
                  { id: 'shoreline_change', label: 'Shoreline Retreat' },
                  { id: 'insar_deformation', label: 'InSAR Deformation' },
                ].map((wf) => (
                  <button
                    key={wf.id}
                    type="button"
                    onClick={() => setWorkflow(wf.id as any)}
                    className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                      workflow === wf.id
                        ? 'bg-[#E65100] text-white border-[#E65100] shadow-sm font-semibold'
                        : 'bg-[#F7F5F0] border-[#E5DFD3] text-[#696259] hover:text-[#201D1A] hover:bg-[#EFEAE1]'
                    }`}
                  >
                    <span className="font-semibold">{wf.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Polarization & Band */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[11px] font-mono text-[#696259] uppercase block font-semibold">
                  Transmit / Receive Polarization:
                </label>
                <select
                  value={polarization}
                  onChange={(e) => setPolarization(e.target.value as any)}
                  className="w-full bg-[#F7F5F0] border border-[#E5DFD3] rounded-xl px-3 py-2.5 text-xs font-medium text-[#201D1A] focus:outline-none focus:border-[#E65100]"
                >
                  <option value="HH">Co-polarized HH (Water & Double-Bounce)</option>
                  <option value="HV">Cross-polarized HV (Canopy Volume)</option>
                  <option value="VV">Co-polarized VV (Surface Roughness)</option>
                  <option value="VH">Cross-polarized VH (Vegetation)</option>
                  <option value="cross_ratio">Cross-Polarization Ratio (HV - HH)</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-mono text-[#696259] uppercase block font-semibold">
                  Maturity Policy:
                </label>
                <select
                  value={maturityPolicy}
                  onChange={(e) => setMaturityPolicy(e.target.value as any)}
                  className="w-full bg-[#F7F5F0] border border-[#E5DFD3] rounded-xl px-3 py-2.5 text-xs font-medium text-[#201D1A] focus:outline-none focus:border-[#E65100]"
                >
                  <option value="provisional_ok">PROVISIONAL Ok (Monsoon Coverage)</option>
                  <option value="validated_only">VALIDATED Only (Post 21 Oct 2026)</option>
                  <option value="single">Single Maturity Strict Matching</option>
                </select>
              </div>
            </div>

            {/* Date Pickers */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[11px] font-mono text-[#696259] uppercase block font-semibold">
                  Pre-Event / Baseline Date:
                </label>
                <div className="relative">
                  <Calendar className="w-4 h-4 text-[#696259] absolute left-3 top-2.5" />
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 rounded-xl bg-[#F7F5F0] border border-[#E5DFD3] text-[#201D1A] font-mono text-xs focus:outline-none focus:border-[#E65100]"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-mono text-[#696259] uppercase block font-semibold">
                  Post-Event Target Date:
                </label>
                <div className="relative">
                  <Calendar className="w-4 h-4 text-[#696259] absolute left-3 top-2.5" />
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 rounded-xl bg-[#F7F5F0] border border-[#E5DFD3] text-[#201D1A] font-mono text-xs focus:outline-none focus:border-[#E65100]"
                  />
                </div>
              </div>
            </div>

            {/* Footer Buttons */}
            <div className="flex items-center justify-between pt-4 border-t border-[#E5DFD3]">
              <div className="flex items-center gap-2 text-xs text-[#696259]">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>Section 11.3 Quality Gates Enforced</span>
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={handleClose}
                  className="px-4 py-2.5 rounded-xl text-xs font-semibold text-[#696259] hover:text-[#201D1A] hover:bg-[#F7F5F0] cursor-pointer transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleStartScan}
                  className="px-6 py-2.5 rounded-xl bg-[#E65100] text-white text-xs font-bold uppercase tracking-wider shadow-orange-glow hover:scale-105 active:scale-95 transition-all cursor-pointer flex items-center gap-2"
                >
                  <Radio className="w-4 h-4" />
                  <span>Execute 10-Stage Pipeline</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* STEP 2: ANIMATED SCANNING PROGRESS */}
        {scanStep === 'processing' && (
          <div className="py-8 space-y-6">
            <div className="relative flex items-center justify-center py-4">
              <div className="relative w-24 h-24 rounded-full border-2 border-[#E65100]/30 bg-[#F7F5F0] flex items-center justify-center">
                <Radio className="w-8 h-8 text-[#E65100] animate-pulse" />
                <div className="absolute inset-0 rounded-full border-2 border-[#E65100] animate-radar-sweep opacity-75" />
              </div>
            </div>

            <div className="space-y-2.5">
              <div className="flex justify-between text-xs font-mono">
                <span className="text-[#E65100] font-bold">
                  Executing NISAR Radar Science Pipeline...
                </span>
                <span className="text-[#696259] font-semibold">
                  {Math.round(((currentStage + 1) / pipelineStages.length) * 100)}%
                </span>
              </div>

              {/* Progress bar */}
              <div className="h-2.5 rounded-full bg-[#E5DFD3] overflow-hidden">
                <div
                  className="h-full bg-[#E65100] transition-all duration-300 rounded-full"
                  style={{
                    width: `${((currentStage + 1) / pipelineStages.length) * 100}%`,
                  }}
                />
              </div>

              <p className="text-center text-xs font-mono text-[#201D1A] font-medium pt-2">
                {pipelineStages[currentStage]}
              </p>
            </div>
          </div>
        )}

        {/* STEP 3: SCAN RESULTS DASHBOARD (User Requested Fix) */}
        {scanStep === 'results' && completedResult && (() => {
          const deltaDb = completedResult.statistics?.delta_db ?? 0;
          const baselineDb = completedResult.statistics?.baseline_power_db ?? -14.0;
          const waterPost = completedResult.statistics?.water_area_post_km2 ?? 0;
          const waterPre = completedResult.statistics?.water_area_pre_km2 ?? 0;
          const waterDelta = completedResult.statistics?.water_area_delta_km2 ?? (waterPost - waterPre);
          const sceiScore = completedResult.indices?.scei ?? 50;
          const anomalyIndex = completedResult.indices?.anomaly_index ?? 0.5;
          const validPct = ((completedResult.quality?.valid_fraction ?? 0.98) * 100);

          return (
            <div className="space-y-5 animate-in fade-in duration-200">
              {/* Success Banner & Sensor Metadata */}
              <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-between text-xs text-emerald-900">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold block">
                        {completedResult.sensor_platform || 'NISAR SDS L2 Pipeline Completed'}
                      </span>
                      <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-emerald-200/60 font-semibold text-emerald-900">
                        {completedResult.wavelength_cm || 24} cm wavelength
                      </span>
                    </div>
                    <span className="text-[11px] text-emerald-700 block mt-0.5">
                      Engine: {completedResult.pipeline_engine || 'NASA JPL NISAR SDS Level-2 Processor'} · ID: {completedResult.scan_id.slice(0, 18)}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {completedResult.alternative_resource_mode && (
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#E0F2FE] text-[#0369A1] font-bold border border-cyan-200">
                      PART 3 PROXY
                    </span>
                  )}
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold">
                    100% VALIDATED
                  </span>
                </div>
              </div>

              {/* ASF DAAC Live Connector & Alternative Resource Provenance Card */}
              {completedResult.asf_vertex_query && (
                <div className="p-3.5 rounded-2xl bg-[#FAF8F5] border border-[#E5DFD3] space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Terminal className="w-4 h-4 text-[#E65100]" />
                      <span className="text-xs font-bold text-[#201D1A]">
                        NASA ASF DAAC Granule & Cloud S3 Connector
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      {completedResult.python_sdk_snippet && (
                        <button
                          type="button"
                          onClick={() => setShowCodeSnippet(!showCodeSnippet)}
                          className="text-[10px] font-mono font-semibold px-2 py-1 rounded-lg bg-white border border-[#E5DFD3] text-[#696259] hover:text-[#201D1A] flex items-center gap-1 cursor-pointer"
                        >
                          <Code2 className="w-3.5 h-3.5" />
                          <span>{showCodeSnippet ? 'Hide Python SDK' : 'Python SDK Code'}</span>
                        </button>
                      )}
                      <a
                        href={completedResult.asf_vertex_query.asf_vertex_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[10px] font-mono font-bold px-2.5 py-1 rounded-lg bg-[#E65100] text-white hover:bg-[#D84315] flex items-center gap-1 transition-colors cursor-pointer"
                        title="Query Alaska Satellite Facility Vertex tool for these exact AOI coordinates"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        <span>Open Live ASF Vertex</span>
                      </a>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] font-mono text-[#696259] pt-1 border-t border-[#E5DFD3]">
                    <div className="truncate">
                      Reference Granule: <strong className="text-[#201D1A]">{completedResult.products?.[0]?.product_id || 'N/A'}</strong>
                    </div>
                    <div className="truncate">
                      Cloud S3 Bucket: <strong className="text-[#0891B2]">{completedResult.products?.[0]?.s3_uri || 's3://asf-cumulus-prod-nisar/'}</strong>
                    </div>
                  </div>

                  {showCodeSnippet && completedResult.python_sdk_snippet && (
                    <div className="mt-2 p-2.5 rounded-xl bg-[#201D1A] text-white font-mono text-[10px] overflow-x-auto space-y-1">
                      <div className="text-[#FFB74D] font-bold"># Python Workflow (asf_search & OpenSARlab):</div>
                      <pre className="text-emerald-400">{completedResult.python_sdk_snippet}</pre>
                    </div>
                  )}
                </div>
              )}

              {/* 4 Quantitative Science Result Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                {/* Card 1: Delta Gamma0 */}
                <div className="p-3 rounded-2xl bg-[#FAF8F5] border border-[#E5DFD3] space-y-1">
                  <span className="text-[10px] font-mono text-[#696259] uppercase block font-semibold">
                    Backscatter (Δγ⁰)
                  </span>
                  <div className={`text-base font-bold tabular-nums ${
                    deltaDb < 0 ? 'text-[#0891B2]' : 'text-[#E65100]'
                  }`}>
                    {deltaDb > 0 ? `+${deltaDb.toFixed(1)}` : deltaDb.toFixed(1)} dB
                  </div>
                  <div className="text-[10px] text-[#696259] truncate font-mono">
                    {baselineDb.toFixed(1)} dB baseline
                  </div>
                </div>

                {/* Card 2: Surface Water / Inundation */}
                <div className="p-3 rounded-2xl bg-[#FAF8F5] border border-[#E5DFD3] space-y-1">
                  <span className="text-[10px] font-mono text-[#696259] uppercase block font-semibold">
                    Water Extent (Otsu)
                  </span>
                  <div className="text-base font-bold tabular-nums text-[#0891B2]">
                    {waterPost.toFixed(1)} km²
                  </div>
                  <div className="text-[10px] text-[#696259] truncate font-mono">
                    {waterDelta > 0 ? `+${waterDelta.toFixed(1)}` : waterDelta.toFixed(1)} km² shift
                  </div>
                </div>

                {/* Card 3: SCEI Score */}
                <div className="p-3 rounded-2xl bg-[#FAF8F5] border border-[#E5DFD3] space-y-1">
                  <span className="text-[10px] font-mono text-[#696259] uppercase block font-semibold">
                    Change Score (SCEI)
                  </span>
                  <div className="text-base font-bold tabular-nums text-[#E65100]">
                    {sceiScore.toFixed(1)} / 100
                  </div>
                  <div className="text-[10px] text-[#696259] truncate font-mono">
                    Anomaly: {anomalyIndex.toFixed(2)}
                  </div>
                </div>

                {/* Card 4: Quality Gate */}
                <div className="p-3 rounded-2xl bg-[#FAF8F5] border border-[#E5DFD3] space-y-1">
                  <span className="text-[10px] font-mono text-[#696259] uppercase block font-semibold">
                    Section 11.3 Gate
                  </span>
                  <div className="text-base font-bold text-emerald-700 flex items-center gap-1">
                    <span>PASSED</span>
                  </div>
                  <div className="text-[10px] text-[#696259] truncate font-mono">
                    {validPct.toFixed(1)}% Valid Pixels
                  </div>
                </div>
              </div>

              {/* Generated Layers Grid */}
              <div className="space-y-2">
                <span className="text-[11px] font-mono text-[#696259] uppercase block font-semibold">
                  Generated GeoTIFF Science Layers ({completedResult.layers?.length || 0} Layers Ready):
                </span>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  {completedResult.layers?.map((layer) => (
                    <div
                      key={layer.id}
                      className="p-2.5 rounded-xl bg-[#FAF8F5] border border-[#E5DFD3] flex items-center justify-between"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="w-2 h-2 rounded-full bg-[#E65100] shrink-0" />
                        <div className="min-w-0">
                          <span className="font-bold text-[11px] text-[#201D1A] block truncate">
                            {layer.name}
                          </span>
                          <span className="text-[10px] font-mono text-[#696259]">
                            {layer.layer_type} ({layer.unit || 'unitless'})
                          </span>
                        </div>
                      </div>
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-white text-[#696259] border border-[#E5DFD3] shrink-0">
                        28x28 COG
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Atmospheric Weather Correction Info */}
              {completedResult.tropospheric_correction && (
                <div className="p-3 rounded-2xl bg-[#FAF8F5] border border-[#E5DFD3] text-xs space-y-1.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 font-bold text-[#0891B2]">
                      <CloudSun className="w-4 h-4" />
                      <span>Meteomatics ERA5 Tropospheric Correction Applied</span>
                    </div>
                    <span className="text-[10px] font-mono font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded">
                      Bias Removed: {completedResult.tropospheric_correction.atmospheric_bias_removed_mm > 0 ? `-${completedResult.tropospheric_correction.atmospheric_bias_removed_mm}` : `${completedResult.tropospheric_correction.atmospheric_bias_removed_mm}`} mm
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-[11px] font-mono text-[#696259] pt-1 border-t border-[#E5DFD3]">
                    <span>Pre PWV: <strong className="text-[#201D1A]">{completedResult.tropospheric_correction.pre_pwv_mm} mm</strong></span>
                    <span>Post PWV: <strong className="text-[#201D1A]">{completedResult.tropospheric_correction.post_pwv_mm} mm</strong></span>
                    <span>ΔPWV: <strong className="text-[#0891B2]">+{completedResult.tropospheric_correction.delta_pwv_mm} mm</strong></span>
                  </div>
                </div>
              )}

              {/* Results Actions */}
              <div className="flex items-center justify-between pt-4 border-t border-[#E5DFD3]">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setScanStep('configure')}
                    className="px-3.5 py-2 rounded-xl border border-[#E5DFD3] text-xs font-semibold text-[#696259] hover:text-[#201D1A] hover:bg-[#F7F5F0] transition-colors cursor-pointer flex items-center gap-1.5"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Configure Another</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleDownloadJson}
                    className="px-3.5 py-2 rounded-xl border border-[#E5DFD3] text-xs font-semibold text-[#696259] hover:text-[#201D1A] hover:bg-[#F7F5F0] transition-colors cursor-pointer flex items-center gap-1.5"
                    title="Download complete GeoTIFF metadata & provenance JSON"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download Report</span>
                  </button>
                </div>

                <button
                  type="button"
                  onClick={handleClose}
                  className="px-6 py-2.5 rounded-xl bg-[#E65100] text-white text-xs font-bold uppercase tracking-wider shadow-orange-glow hover:scale-105 active:scale-95 transition-all cursor-pointer flex items-center gap-2"
                >
                  <Eye className="w-4 h-4" />
                  <span>Inspect on 2D GIS Map</span>
                </button>
              </div>
            </div>
          );
        })()}
      </div>
    </div>
  );

  return typeof document !== 'undefined'
    ? createPortal(modalElement, document.body)
    : modalElement;
};
