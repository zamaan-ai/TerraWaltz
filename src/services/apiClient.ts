/**
 * TerraWaltz Frontend API Client
 * Connects to /api/v1 backend endpoints and provides client-side fallbacks.
 */

import { ScanRequest, ScanResult, TimeSeriesPoint } from './radarEngine';
import { Hotspot } from '../data/hotspots';
import { TestVectorResult } from '../science/radarMath';

export async function fetchHotspots(): Promise<Hotspot[]> {
  try {
    const res = await fetch('/api/v1/hotspots');
    if (res.ok) {
      const data = await res.json();
      return data.hotspots;
    }
  } catch (e) {
    console.warn('API fallback: using local hotspots', e);
  }
  const { HOTSPOTS } = await import('../data/hotspots');
  return HOTSPOTS;
}

export async function submitRadarScan(request: ScanRequest): Promise<ScanResult> {
  try {
    const res = await fetch('/api/v1/scans', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request),
    });

    if (res.status === 202) {
      const init = await res.json();
      const resultRes = await fetch(`/api/v1/scans/${init.scan_id}/result`);
      if (resultRes.ok) {
        return await resultRes.json();
      }
    }
  } catch (e) {
    console.warn('Backend unavailable, executing on client engine', e);
  }

  // Client-side execution fallback
  const { executeRadarScan } = await import('./radarEngine');
  return executeRadarScan(request);
}

export async function fetchTimeSeries(hotspotId: string): Promise<TimeSeriesPoint[]> {
  try {
    const res = await fetch(`/api/v1/timeseries?hotspot_id=${hotspotId}`);
    if (res.ok) {
      const data = await res.json();
      return data.series;
    }
  } catch (e) {
    console.warn('Backend unavailable, generating client time-series', e);
  }

  const { generateTimeSeries } = await import('./radarEngine');
  return generateTimeSeries(hotspotId);
}

export async function fetchMathVerification(): Promise<TestVectorResult[]> {
  try {
    const res = await fetch('/api/v1/math/verify');
    if (res.ok) {
      const data = await res.json();
      return data.tests;
    }
  } catch (e) {
    console.warn('Backend math verify unavailable, executing locally', e);
  }

  const { runNumericalTestVectors } = await import('../science/radarMath');
  return runNumericalTestVectors();
}
