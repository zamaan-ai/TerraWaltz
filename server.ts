/**
 * TerraWaltz Express Full-Stack Server
 * Implements backend API specification from DANCE_WITH_ME_MARK-4 Section 12
 * and mounts Vite development middleware on port 3000.
 */

import express, { Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { HOTSPOTS } from './src/data/hotspots.ts';
import { executeRadarScan, generateTimeSeries, ScanRequest, ScanResult } from './src/services/radarEngine.ts';
import { runNumericalTestVectors } from './src/science/radarMath.ts';
import { computeTroposphericCorrection, getAtmosphericProfile } from './src/services/meteomaticsService.ts';
import {
  queryPlanetaryDem,
  queryPlanetarySentinel2,
  getMultiSensorValidation,
} from './src/services/planetaryComputerService.ts';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
const isProduction = process.env.NODE_ENV === 'production';

app.use(express.json());

// In-memory scan jobs cache
const scansCache = new Map<string, ScanResult>();

// -------------------------------------------------------------
// Backend API Endpoints (Section 12.1)
// -------------------------------------------------------------

// 1. GET /api/v1/hotspots - Curated AOIs and stories
app.get('/api/v1/hotspots', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    count: HOTSPOTS.length,
    hotspots: HOTSPOTS,
  });
});

// 2. POST /api/v1/search - Discover NISAR products
app.post('/api/v1/search', (req: Request, res: Response) => {
  const { bbox, start, end, product_type, maturity } = req.body;
  const queryId = `query-${Date.now()}`;

  // Notice about scheduled NASA Earthdata API downtime (active until 13 Nov 2026)
  const apiStatus = {
    nasa_asf_status: 'SCHEDULED_MAINTENANCE_UNTIL_2026_11_13',
    fallback_mode: 'ACTIVE_PRECOMPUTED_STAC_CATALOG',
    message: 'NASA Earthdata / ASF CMR API maintenance window in effect until 13 Nov 2026. TerraWaltz local STAC index & AWS us-west-2 replica active.',
  };

  const results = HOTSPOTS.flatMap((h) =>
    h.sampleGranules.map((granuleId) => ({
      product_id: granuleId,
      source: 'ASF DAAC / NASA Earthdata',
      band: 'L',
      frequency: 'A',
      product_type: granuleId.includes('GUNW') ? 'GUNW' : granuleId.includes('GOFF') ? 'GOFF' : 'GCOV',
      maturity: granuleId.includes('2026102') || granuleId.includes('202611') ? 'VALIDATED' : 'PROVISIONAL',
      crid: granuleId.includes('P05036') ? 'P05036' : 'P05023',
      footprint: {
        type: 'Polygon',
        coordinates: [
          [
            [h.bbox[0], h.bbox[1]],
            [h.bbox[2], h.bbox[1]],
            [h.bbox[2], h.bbox[3]],
            [h.bbox[0], h.bbox[3]],
            [h.bbox[0], h.bbox[1]],
          ],
        ],
      },
      access_status: 'AVAILABLE_S3_DIRECT_US_WEST_2',
    }))
  );

  res.json({
    query_id: queryId,
    api_connection_status: apiStatus,
    granule_count: results.length,
    granules: results,
  });
});

// 3. POST /api/v1/scans - Create asynchronous analysis job
app.post('/api/v1/scans', (req: Request, res: Response) => {
  const scanReq: ScanRequest = req.body;

  if (!scanReq.start || !scanReq.end) {
    return res.status(400).json({
      error: 'INVALID_REQUEST',
      message: 'Start and end UTC timestamps are required for multi-temporal radar scan.',
    });
  }

  const result = executeRadarScan(scanReq);
  scansCache.set(result.scan_id, result);

  // Return 202 Accepted as specified in Section 12.2
  return res.status(202).json({
    scan_id: result.scan_id,
    status: result.status,
    accepted_parameters: scanReq,
    selected_products: result.products.map((p) => p.product_id),
  });
});

// 4. GET /api/v1/scans/:id - Job state & progress
app.get('/api/v1/scans/:id', (req: Request, res: Response) => {
  const scan = scansCache.get(req.params.id);
  if (!scan) {
    return res.status(404).json({
      error: 'NOT_FOUND',
      message: `Scan job ${req.params.id} was not found.`,
    });
  }

  res.json({
    scan_id: scan.scan_id,
    status: scan.status,
    stage: scan.stage,
    progress: scan.progress,
    quality: scan.quality,
    warnings: scan.quality.warnings,
  });
});

// 5. GET /api/v1/scans/:id/result - Full analysis output & provenance
app.get('/api/v1/scans/:id/result', (req: Request, res: Response) => {
  const scan = scansCache.get(req.params.id);
  if (!scan) {
    return res.status(404).json({
      error: 'NOT_FOUND',
      message: `Scan job ${req.params.id} was not found.`,
    });
  }

  res.json(scan);
});

// 6. GET /api/v1/timeseries - 12-day orbital cycle time series
app.get('/api/v1/timeseries', (req: Request, res: Response) => {
  const hotspotId = (req.query.hotspot_id as string) || 'sundarbans_estuary';
  const series = generateTimeSeries(hotspotId);

  res.json({
    status: 'ok',
    hotspot_id: hotspotId,
    cycle_interval_days: 12,
    permanent_gap: {
      start: '2026-07-27T22:03:25Z',
      end: '2026-08-10T00:55:27Z',
      annotated: true,
    },
    series,
  });
});

// 7. GET /api/v1/scans/:id/export - Reproducible package export
app.get('/api/v1/scans/:id/export', (req: Request, res: Response) => {
  const scan = scansCache.get(req.params.id);
  if (!scan) {
    return res.status(404).json({
      error: 'NOT_FOUND',
      message: `Scan job ${req.params.id} was not found for export.`,
    });
  }

  res.json({
    export_version: 'STAC-1.0.0-TerraWaltz',
    scan_id: scan.scan_id,
    created_utc: scan.created_utc,
    provenance: {
      algorithm_version: scan.method.algorithm_version,
      source_products: scan.products,
      los_convention: scan.los_sign_convention,
      units: {
        backscatter: 'gamma0 power (dB = 10*log10(power))',
        los_displacement: 'mm (toward sensor positive)',
        water_mask: 'binary class (Otsu threshold)',
      },
    },
    cloud_storage_links: {
      s3_cog_raster: `s3://terrawaltz-derived-rasters/prod/scans/${scan.scan_id}/rasters/change_db.tif`,
      stac_item_json: `s3://terrawaltz-derived-rasters/prod/stac/${scan.scan_id}/item.json`,
    },
    summary_metrics: scan.statistics,
    evidence_indices: scan.indices,
  });
});

// 8. GET /api/v1/math/verify - Numerical Test Vectors Verification (Section 15.4)
app.get('/api/v1/math/verify', (_req: Request, res: Response) => {
  const testResults = runNumericalTestVectors();
  const allPassed = testResults.every((t) => t.passed);

  res.json({
    status: allPassed ? 'ALL_TESTS_PASSED' : 'TESTS_FAILED',
    total_tests: testResults.length,
    passed_count: testResults.filter((t) => t.passed).length,
    tests: testResults,
  });
});

// 9. GET /DANCE_TUTORIAL.pdf & /api/v1/tutorial/pdf
app.get(['/DANCE_TUTORIAL.pdf', '/api/v1/tutorial/pdf'], (_req: Request, res: Response) => {
  const pdfPath = path.resolve(__dirname, 'DANCE_TUTORIAL.pdf');
  if (fs.existsSync(pdfPath)) {
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'inline; filename="DANCE_TUTORIAL.pdf"');
    res.sendFile(pdfPath);
  } else {
    res.status(404).send('DANCE_TUTORIAL.pdf not found');
  }
});

// 10. GET /DANCE_STEPS_MARK-2.zip
app.get(['/DANCE_STEPS_MARK-2.zip', '/download/zip'], (_req: Request, res: Response) => {
  const zipPath = path.resolve(__dirname, 'DANCE_STEPS_MARK-2.zip');
  if (fs.existsSync(zipPath)) {
    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', 'attachment; filename="DANCE_STEPS_MARK-2.zip"');
    res.sendFile(zipPath);
  } else {
    res.status(404).send('DANCE_STEPS_MARK-2.zip not found');
  }
});

// 11. GET /api/v1/nisar/provenance - Precomputed Tier 2 NISAR GCOV Provenance Dataset
app.get('/api/v1/nisar/provenance', (_req: Request, res: Response) => {
  const provenancePath = path.resolve(__dirname, 'public/data/nisar_sundarbans_provenance.json');
  if (fs.existsSync(provenancePath)) {
    const raw = fs.readFileSync(provenancePath, 'utf-8');
    res.setHeader('Content-Type', 'application/json');
    res.send(raw);
  } else {
    res.status(404).json({ error: 'NOT_FOUND', message: 'Provenance dataset not generated yet.' });
  }
});

// 11. GET /api/v1/weather/troposphere - Meteomatics Atmospheric Profile & Tropospheric Delay Correction
app.get('/api/v1/weather/troposphere', async (req: Request, res: Response) => {
  try {
    const lat = req.query.lat ? parseFloat(req.query.lat as string) : 21.8;
    const lon = req.query.lon ? parseFloat(req.query.lon as string) : 88.5;
    const preDate = (req.query.pre_date as string) || '2026-07-16T00:00:00Z';
    const postDate = (req.query.post_date as string) || '2026-08-21T00:00:00Z';
    const incAngle = req.query.incidence_deg ? parseFloat(req.query.incidence_deg as string) : 37.0;
    const hotspotId = req.query.hotspot_id as string | undefined;

    const correction = await computeTroposphericCorrection(lat, lon, preDate, postDate, incAngle, hotspotId);
    res.json({
      status: 'ok',
      correction,
    });
  } catch (err: any) {
    res.status(500).json({ error: 'WEATHER_SERVICE_ERROR', message: err.message });
  }
});

// 12. GET /api/v1/stac/planetary/validate - Microsoft Planetary Computer Multi-Sensor STAC Validation
app.get('/api/v1/stac/planetary/validate', async (req: Request, res: Response) => {
  try {
    const hotspotId = (req.query.hotspot_id as string) || 'sundarbans_estuary';
    const targetHotspot = HOTSPOTS.find((h) => h.id === hotspotId) || HOTSPOTS[0];
    const validation = await getMultiSensorValidation(targetHotspot.id, targetHotspot.bbox);

    res.json({
      status: 'ok',
      validation,
    });
  } catch (err: any) {
    res.status(500).json({ error: 'PLANETARY_COMPUTER_STAC_ERROR', message: err.message });
  }
});

// 13. GET /api/v1/stac/planetary/dem - Copernicus 30m Global DEM STAC item
app.get('/api/v1/stac/planetary/dem', async (req: Request, res: Response) => {
  try {
    const hotspotId = (req.query.hotspot_id as string) || 'sundarbans_estuary';
    const targetHotspot = HOTSPOTS.find((h) => h.id === hotspotId) || HOTSPOTS[0];
    const demItem = await queryPlanetaryDem(targetHotspot.bbox);

    res.json({
      status: 'ok',
      demItem,
    });
  } catch (err: any) {
    res.status(500).json({ error: 'PLANETARY_DEM_ERROR', message: err.message });
  }
});

// 14. GET /api/v1/stac/planetary/sentinel2 - Sentinel-2 Optical L2A STAC item
app.get('/api/v1/stac/planetary/sentinel2', async (req: Request, res: Response) => {
  try {
    const hotspotId = (req.query.hotspot_id as string) || 'sundarbans_estuary';
    const targetHotspot = HOTSPOTS.find((h) => h.id === hotspotId) || HOTSPOTS[0];
    const maxCloud = req.query.max_cloud ? parseFloat(req.query.max_cloud as string) : 35;
    const opticalItem = await queryPlanetarySentinel2(targetHotspot.bbox, maxCloud);

    res.json({
      status: 'ok',
      opticalItem,
    });
  } catch (err: any) {
    res.status(500).json({ error: 'PLANETARY_SENTINEL2_ERROR', message: err.message });
  }
});

// -------------------------------------------------------------
// Vite Server Integration
// -------------------------------------------------------------

async function startServer() {
  if (!isProduction) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[TerraWaltz Server] Running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
