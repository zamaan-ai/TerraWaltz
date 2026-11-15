/**
 * TerraWaltz Cloud Architecture, AWS Services & API Hub
 * Warm Sand / Beige Aesthetic with spacious, approachable layout.
 */

import React, { useState } from 'react';
import {
  Cloud,
  Server,
  Database,
  Download,
  AlertCircle,
  ExternalLink,
  Code,
  Terminal,
  Check,
  Copy,
} from 'lucide-react';
import { ScanResult } from '../services/radarEngine';

interface ApiAndCloudDocsProps {
  scanResult: ScanResult | null;
}

export const ApiAndCloudDocs: React.FC<ApiAndCloudDocsProps> = ({ scanResult }) => {
  const [copiedEndpoint, setCopiedEndpoint] = useState<string | null>(null);

  const copyToClipboard = (text: string, endpointName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedEndpoint(endpointName);
    setTimeout(() => setCopiedEndpoint(null), 2000);
  };

  const handleDownloadExport = () => {
    if (!scanResult) return;
    const exportData = {
      stac_version: '1.0.0',
      id: scanResult.scan_id,
      type: 'Feature',
      geometry: scanResult.request_parameters.aoi || {
        type: 'Polygon',
        coordinates: [
          [
            [88.0, 21.55],
            [88.4, 21.55],
            [88.4, 22.01],
            [88.0, 22.01],
            [88.0, 21.55],
          ],
        ],
      },
      properties: {
        datetime: scanResult.created_utc,
        start_datetime: scanResult.request_parameters.start,
        end_datetime: scanResult.request_parameters.end,
        'sar:instrument_mode': 'SweepSAR',
        'sar:frequency_band': scanResult.request_parameters.band,
        'sar:polarizations': [scanResult.request_parameters.polarization],
        'terrawaltz:anomaly_index': scanResult.indices.anomaly_index,
        'terrawaltz:scei_score': scanResult.indices.scei,
        'terrawaltz:confidence': scanResult.indices.confidence,
        'terrawaltz:statistics': scanResult.statistics,
        'terrawaltz:quality': scanResult.quality,
      },
      assets: {
        backscatter_db: {
          href: scanResult.layers[0]?.uri,
          type: 'image/tiff; application=geotiff; profile=cloud-optimized',
          title: 'GCOV gamma0 backscatter in dB',
        },
        change_heatmap: {
          href: scanResult.layers[1]?.uri,
          type: 'image/tiff; application=geotiff; profile=cloud-optimized',
          title: 'Temporal backscatter difference in dB',
        },
      },
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `terrawaltz-stac-${scanResult.scan_id}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex-1 bg-[#F7F5F0] text-[#201D1A] overflow-y-auto p-8 select-none">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-[#E5DFD3] pb-6">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold text-[#E65100] uppercase tracking-wider mb-1.5">
              <Cloud className="w-4 h-4" />
              <span>Cloud Infrastructure & Backend REST API</span>
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-[#201D1A]">
              API Hub, AWS Services & Data Connectors
            </h1>
            <p className="text-sm text-[#696259] mt-1.5 max-w-2xl leading-relaxed">
              Cloud-native architecture conforming to Section 7 & 12: zero-egress S3 compute in us-west-2, and STAC-compliant metadata.
            </p>
          </div>

          <button
            onClick={handleDownloadExport}
            disabled={!scanResult}
            className="px-5 py-2.5 rounded-xl bg-[#E65100] text-white text-xs font-bold shadow-orange-glow transition-all hover:scale-105 active:scale-95 cursor-pointer flex items-center gap-2 self-start disabled:opacity-50"
          >
            <Download className="w-4 h-4" />
            <span>Download STAC Item JSON</span>
          </button>
        </div>

        {/* Notice on NASA API Scheduled Maintenance */}
        <div className="p-6 rounded-3xl bg-white border border-amber-300 shadow-soft space-y-2.5">
          <div className="flex items-center gap-2.5 text-amber-800 text-xs font-bold uppercase font-mono">
            <AlertCircle className="w-4 h-4 text-amber-600" />
            <span>NASA Earthdata / ASF DAAC Scheduled Upgrade Notice</span>
          </div>
          <p className="text-xs text-[#201D1A] leading-relaxed">
            NASA Earthdata Login & ASF DAAC external catalogue endpoints have a scheduled upgrade window until <strong>13 November 2026</strong>. TerraWaltz automatically routes catalogue discovery through our verified precomputed STAC repository and AWS us-west-2 cache, ensuring uninterrupted analysis and zero broken requests.
          </p>
          <div className="flex flex-wrap gap-4 text-xs font-mono text-[#696259] pt-1">
            <span>• Direct S3 Access: s3://asf-cumulus-prod-nisar/ (us-west-2)</span>
            <span>• Bhoonidhi STAC: https://bhoonidhi.nrsc.gov.in/stac/</span>
            <span>• Re-opening Live Ingest: 13 Nov 2026 00:00 UTC</span>
          </div>
        </div>

        {/* Cloud AWS Architecture Topology */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-7 rounded-3xl border border-[#E5DFD3] shadow-soft space-y-3">
            <div className="flex items-center gap-2.5 text-[#E65100]">
              <Cloud className="w-5 h-5" />
              <h3 className="font-bold text-sm text-[#201D1A]">AWS us-west-2 Compute</h3>
            </div>
            <p className="text-xs text-[#696259] leading-relaxed">
              NASA stores all NISAR mission HDF5 data on AWS S3 in region <code>us-west-2</code>. Running our processing workers inside the same region with temporary IAM STS credentials grants direct S3 streaming with <strong>zero data-transfer egress fees</strong>.
            </p>
            <div className="text-[11px] font-mono text-[#0891B2] bg-[#FAF8F5] p-3 rounded-xl border border-[#E5DFD3]">
              s3://asf-cumulus-prod-nisar/L2_GCOV/
            </div>
          </div>

          <div className="bg-white p-7 rounded-3xl border border-[#E5DFD3] shadow-soft space-y-3">
            <div className="flex items-center gap-2.5 text-cyan-800">
              <Server className="w-5 h-5" />
              <h3 className="font-bold text-sm text-[#201D1A]">Cloud-Optimized GeoTIFFs</h3>
            </div>
            <p className="text-xs text-[#696259] leading-relaxed">
              Derived backscatter, change heatmaps, and interferograms are published as COGs with internal tiling and overviews. The browser streams only the required spatial bounding box via HTTP Range requests.
            </p>
            <div className="text-[11px] font-mono text-cyan-800 bg-[#FAF8F5] p-3 rounded-xl border border-[#E5DFD3]">
              Range: bytes=0-16384 (Overview 80m)
            </div>
          </div>

          <div className="bg-white p-7 rounded-3xl border border-[#E5DFD3] shadow-soft space-y-3">
            <div className="flex items-center gap-2.5 text-emerald-800">
              <Database className="w-5 h-5" />
              <h3 className="font-bold text-sm text-[#201D1A]">PostGIS Data Store</h3>
            </div>
            <p className="text-xs text-[#696259] leading-relaxed">
              Lightweight relational metadata store holding AOI bounding boxes, scan provenance, quality flags, and STAC links. Heavy multi-gigabyte rasters stay in object storage.
            </p>
            <div className="text-[11px] font-mono text-emerald-800 bg-[#FAF8F5] p-3 rounded-xl border border-[#E5DFD3]">
              Table scans (id UUID, aoi GEOMETRY)
            </div>
          </div>
        </div>

        {/* REST API Endpoints Specification */}
        <div className="bg-white p-8 rounded-3xl border border-[#E5DFD3] shadow-soft space-y-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Code className="w-5 h-5 text-[#E65100]" />
              <h3 className="font-bold text-base text-[#201D1A]">
                Backend REST API Endpoints (Section 12)
              </h3>
            </div>
            <span className="font-mono text-xs text-[#696259] bg-[#FAF8F5] px-3 py-1 rounded-lg border border-[#E5DFD3]">
              Prefix: /api/v1
            </span>
          </div>

          <div className="space-y-3">
            {[
              {
                method: 'GET',
                path: '/api/v1/hotspots',
                desc: 'Returns curated AOIs, bounding boxes, story chapters, and literature references.',
              },
              {
                method: 'POST',
                path: '/api/v1/search',
                desc: 'Discovers NISAR granules filtered by AOI, start/end dates, band, and maturity policy.',
              },
              {
                method: 'POST',
                path: '/api/v1/scans',
                desc: 'Creates asynchronous multi-temporal radar change scan job (202 Accepted).',
              },
              {
                method: 'GET',
                path: '/api/v1/scans/{id}/result',
                desc: 'Returns processed physical layers (dB, water, phase), statistics, quality gates, and provenance.',
              },
              {
                method: 'GET',
                path: '/api/v1/timeseries',
                desc: 'Retrieves 12-day orbital cycle backscatter, water fraction, and coherence time-series.',
              },
              {
                method: 'GET',
                path: '/api/v1/weather/troposphere',
                desc: 'Meteomatics Global Offer API: Computes Saastamoinen ZHD, Askne ZWD, slant tropospheric delay, and removes atmospheric InSAR phase errors.',
              },
              {
                method: 'GET',
                path: '/api/v1/stac/planetary/validate',
                desc: 'Microsoft Planetary Computer STAC: Multi-sensor validation fusing Copernicus 30m DEM + Sentinel-2 Optical with NISAR SAR.',
              },
              {
                method: 'GET',
                path: '/api/v1/stac/planetary/dem',
                desc: 'Microsoft Planetary Computer: Copernicus 30m Global DEM (GLO-30) STAC item & rendered elevation raster.',
              },
              {
                method: 'GET',
                path: '/api/v1/stac/planetary/sentinel2',
                desc: 'Microsoft Planetary Computer: Sentinel-2 L2A optical 10m multispectral imagery and cloud-coverage audit.',
              },
              {
                method: 'GET',
                path: '/api/v1/math/verify',
                desc: 'Runs and verifies all 14 Section 15.4 Numerical Test Vectors on the live engine.',
              },
            ].map((ep) => (
              <div
                key={ep.path}
                className="p-4 rounded-2xl bg-[#FAF8F5] border border-[#E5DFD3] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2 font-mono">
                    <span
                      className={`px-2.5 py-0.5 rounded-md font-bold text-[10px] ${
                        ep.method === 'GET'
                          ? 'bg-cyan-100 text-cyan-800'
                          : 'bg-orange-100 text-[#E65100]'
                      }`}
                    >
                      {ep.method}
                    </span>
                    <span className="text-[#201D1A] font-bold">{ep.path}</span>
                  </div>
                  <p className="text-[#696259] text-[11px]">{ep.desc}</p>
                </div>

                <button
                  onClick={() => copyToClipboard(ep.path, ep.path)}
                  className="px-3 py-1.5 rounded-xl bg-white hover:bg-[#E65100] hover:text-white transition-colors text-[11px] font-mono text-[#696259] flex items-center gap-1.5 cursor-pointer self-start sm:self-center border border-[#E5DFD3] shadow-2xs"
                >
                  {copiedEndpoint === ep.path ? (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy</span>
                    </>
                  )}
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
