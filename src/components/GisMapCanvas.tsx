/**
 * TerraWaltz Interactive GIS Map Canvas & SAR Overlay Engine
 * Warm Sand / Beige Aesthetic with spacious, approachable layout.
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {
  Layers,
  Crosshair,
  Maximize2,
  RefreshCw,
  Compass,
  Split,
  Eye,
  Radio,
  MapPin,
  Waves,
  TreePine,
  ShieldAlert,
  Globe,
  Sliders,
  HelpCircle,
  CloudSun,
  Sparkles,
  ChevronDown,
  ChevronUp,
  X,
  RotateCcw,
  Check,
  Calendar,
  Activity,
  Plus,
  Minus,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { ScanResult } from '../services/radarEngine';
import { Hotspot } from '../data/hotspots';
import { GEO_FEATURES } from '../data/geoFeatures';
import { AudienceLens } from './AudienceLensBar';
import { SarFloatingLegend } from './SarFloatingLegend';

interface GisMapCanvasProps {
  hotspot: Hotspot;
  scanResult: ScanResult | null;
  activeLayerId: string;
  onLayerChange: (layerId: string) => void;
  audienceLens: AudienceLens;
  onSelectHotspot: (hotspotId: string) => void;
  allHotspots: Hotspot[];
  onTriggerScan: () => void;
  onOpenGlobe3D: () => void;
}

export const GisMapCanvas: React.FC<GisMapCanvasProps> = ({
  hotspot,
  scanResult,
  activeLayerId,
  onLayerChange,
  audienceLens,
  onSelectHotspot,
  allHotspots,
  onTriggerScan,
  onOpenGlobe3D,
}) => {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);

  // Layer groups
  const baseLayersRef = useRef<Record<string, L.Layer>>({});
  const sarOverlayRef = useRef<L.ImageOverlay | null>(null);
  const vectorGroupRef = useRef<L.LayerGroup | null>(null);
  const gibsNisarRef = useRef<L.TileLayer.WMS | null>(null);
  const togglesMenuRef = useRef<HTMLDivElement | null>(null);

  // Map state
  const [activeBasemap, setActiveBasemap] = useState<'satellite' | 'warm_topo' | 'gibs'>('satellite');
  const [sarOpacity, setSarOpacity] = useState<number>(0.75);
  const [showSarOverlay, setShowSarOverlay] = useState<boolean>(true);
  const [showVectors, setShowVectors] = useState<boolean>(true);
  const [showRadarSweep, setShowRadarSweep] = useState<boolean>(true);

  // NASA GIBS WMS state & controls
  const [showGibsOverlay, setShowGibsOverlay] = useState<boolean>(false);
  const [gibsDate, setGibsDate] = useState<string>('2026-10-25');
  const [gibsOpacity, setGibsOpacity] = useState<number>(0.85);

  // Split-screen comparator
  const [isSplitMode, setIsSplitMode] = useState<boolean>(false);
  const [splitPos, setSplitPos] = useState<number>(50);

  // HUD & Panels visibility toggles
  const [isTogglesOpen, setIsTogglesOpen] = useState<boolean>(false);
  const [showIntelPanel, setShowIntelPanel] = useState<boolean>(true);
  const [intelExpanded, setIntelExpanded] = useState<boolean>(false);
  const [intelTab, setIntelTab] = useState<'weather' | 'stac'>('weather');
  const [showLegend, setShowLegend] = useState<boolean>(true);
  const [showProbe, setShowProbe] = useState<boolean>(true);

  // Hover probe data
  const [probeData, setProbeData] = useState<{
    lat: number;
    lon: number;
    gamma0Db: number;
    deltaGamma0Db: number;
    coherence: number;
    isWater: boolean;
    losMm?: number;
    elevationM?: number;
    opticalVal?: number;
  } | null>(null);

  // Friendly plain-language layer explanations for students & managers
  const layerExplanations: Record<string, { studentSummary: string; physicalReadout: string }> = {
    backscatter_db: {
      studentSummary: 'Radar Echo Strength: Shows how much microwave pulse bounced back. Water looks dark like a mirror; cities & dense forests bounce energy back bright.',
      physicalReadout: 'Calibrated γ⁰ backscatter power in decibels (dB).',
    },
    change_heatmap: {
      studentSummary: 'Surface Change Heatmap: Orange areas gained backscatter (e.g. sub-canopy flood bounce); Cyan areas lost backscatter (e.g. newly submerged open water).',
      physicalReadout: 'Logarithmic ratio Δγ⁰ = 10 log10(P2/P1) (linear power averaged).',
    },
    water_mask: {
      studentSummary: 'Surface Water Extent: Separates open water ponds and flooded creeks from dry land using Otsu histogram thresholding.',
      physicalReadout: 'Binary Otsu classification (0 = dry terrain, 1 = open water).',
    },
    coherence_map: {
      studentSummary: 'Ground Stability Score: 1.0 means rocks or buildings didn’t move at all; low scores mean trees grew, water moved, or soil shifted.',
      physicalReadout: 'Normalized InSAR complex coherence magnitude (0 to 1).',
    },
    phase_fringes: {
      studentSummary: 'Raw Interference Fringes: Rainbow bands counting millimeter shifts, but including uncorrected atmospheric water-vapor distortion.',
      physicalReadout: 'Wrapped interferometric phase (-π to +π radians). Includes tropospheric delay.',
    },
    phase_fringes_corrected: {
      studentSummary: 'Tropospherically Corrected Fringes: Rainbow bands with Meteomatics atmospheric water-vapor turbulence subtracted, isolating true ground shift.',
      physicalReadout: 'Tropospherically corrected wrapped phase (-π to +π radians) via Saastamoinen-Askne model.',
    },
    los_displacement: {
      studentSummary: 'Raw Movement Map: Ground motion along the 40° look angle, containing both real motion and atmospheric delay artifacts.',
      physicalReadout: 'Raw LOS range shift in millimeters (positive = toward satellite).',
    },
    los_displacement_corrected: {
      studentSummary: 'Corrected Ground Movement: True tectonic and coastal displacement with Meteomatics atmospheric delay noise eliminated.',
      physicalReadout: 'Atmospherically corrected LOS displacement in millimeters.',
    },
    copernicus_dem: {
      studentSummary: 'Topographic Elevation (GLO-30): Digital height map from Microsoft Planetary Computer STAC. Shows which islands are dangerously below 3 meters elevation.',
      physicalReadout: 'Elevation in meters above WGS84 ellipsoid (30m spatial resolution).',
    },
    sentinel2_optical: {
      studentSummary: 'Optical Satellite Photo (10m Visual): True-color satellite photo from Sentinel-2 via Planetary Computer. Blocked by clouds during monsoons, but validates dense foliage.',
      physicalReadout: 'Top-of-Atmosphere multispectral visual reflectance (B4, B3, B2 RGB).',
    },
  };

  // Initialize Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: hotspot.center,
        zoom: hotspot.zoom,
        zoomControl: false,
        attributionControl: false,
        preferCanvas: true,
      });

      // 1. High-Resolution True Satellite Photography (Esri World Imagery)
      const esriSatellite = L.tileLayer(
        'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
        { maxZoom: 18, subdomains: ['server', 'services'] }
      );

      // 2. Warm Topo / Terrain Basemap (Approachable warm beige aesthetic)
      const warmTopo = L.tileLayer(
        'https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png',
        { maxZoom: 19, subdomains: 'abc' }
      );

      // 3. NASA GIBS Official NISAR WMS Layer (Live NASA ESDIS Global Mosaic)
      const gibsBase = L.tileLayer(
        'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
        { maxZoom: 18, subdomains: ['server', 'services'] }
      );

      const gibsNisar = L.tileLayer.wms(
        'https://gibs.earthdata.nasa.gov/wms/epsg3857/best/wms.cgi',
        {
          layers: 'NISAR_L2_Geocoded_Polarimetric_Covariance',
          format: 'image/png',
          transparent: true,
          version: '1.3.0',
          time: '2026-10-25',
        } as any
      );

      const gibsCombined = L.layerGroup([gibsBase, gibsNisar]);
      gibsNisarRef.current = gibsNisar;

      esriSatellite.addTo(map);
      baseLayersRef.current = {
        satellite: esriSatellite,
        warm_topo: warmTopo,
        gibs: gibsCombined,
      };

      const vectorGroup = L.layerGroup().addTo(map);
      vectorGroupRef.current = vectorGroup;

      let probeRaf: number | null = null;
      map.on('mousemove', (e: L.LeafletMouseEvent) => {
        if (probeRaf !== null) return;
        probeRaf = requestAnimationFrame(() => {
          probeRaf = null;
          const { lat, lng } = e.latlng;
          const bbox = hotspot.bbox;

          const normX = Math.max(0, Math.min(1, (lng - bbox[0]) / (bbox[2] - bbox[0])));
          const normY = Math.max(0, Math.min(1, (bbox[3] - lat) / (bbox[3] - bbox[1])));

          const matrix = scanResult?.layers.find((l) => l.id === activeLayerId)?.matrix || [];
          const rows = matrix.length || 28;
          const cols = matrix[0]?.length || 28;

          const r = Math.min(rows - 1, Math.max(0, Math.floor(normY * rows)));
          const c = Math.min(cols - 1, Math.max(0, Math.floor(normX * cols)));

          const g0 = scanResult?.layers.find((l) => l.id === 'backscatter_db')?.matrix?.[r]?.[c] ?? -14.2;
          const dg = scanResult?.layers.find((l) => l.id === 'change_heatmap')?.matrix?.[r]?.[c] ?? -4.8;
          const coh = scanResult?.layers.find((l) => l.id === 'coherence_map')?.matrix?.[r]?.[c] ?? 0.65;
          const isW = (scanResult?.layers.find((l) => l.id === 'water_mask')?.matrix?.[r]?.[c] ?? 0) === 1;
          const los = scanResult?.layers.find((l) => l.id === 'los_displacement')?.matrix?.[r]?.[c];
          const elev = scanResult?.layers.find((l) => l.id === 'copernicus_dem')?.matrix?.[r]?.[c];
          const opt = scanResult?.layers.find((l) => l.id === 'sentinel2_optical')?.matrix?.[r]?.[c];

          setProbeData({
            lat,
            lon: lng,
            gamma0Db: g0,
            deltaGamma0Db: dg,
            coherence: coh,
            isWater: isW,
            losMm: los,
            elevationM: elev,
            opticalVal: opt,
          });
        });
      });

      mapRef.current = map;
    }

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  // Switch basemap
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    Object.entries(baseLayersRef.current).forEach(([key, layer]) => {
      if (key === activeBasemap) {
        if (!map.hasLayer(layer)) layer.addTo(map);
      } else {
        if (map.hasLayer(layer)) map.removeLayer(layer);
      }
    });
  }, [activeBasemap]);

  // Fly to hotspot
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    map.flyTo(hotspot.center, hotspot.zoom, { duration: 1.4 });
  }, [hotspot]);

  // Dynamically update NASA GIBS WMS layer parameters (cycle date & opacity)
  useEffect(() => {
    if (gibsNisarRef.current) {
      gibsNisarRef.current.setParams({ time: gibsDate } as any);
    }
  }, [gibsDate]);

  useEffect(() => {
    if (gibsNisarRef.current) {
      gibsNisarRef.current.setOpacity(gibsOpacity);
    }
  }, [gibsOpacity]);

  // Handle GIBS WMS as an independent overlay on top of any active basemap
  useEffect(() => {
    const map = mapRef.current;
    const gibsLayer = gibsNisarRef.current;
    if (!map || !gibsLayer) return;

    if (activeBasemap === 'gibs') {
      return; // Already active via baseLayers
    }

    if (showGibsOverlay) {
      if (!map.hasLayer(gibsLayer)) {
        gibsLayer.addTo(map);
      }
    } else {
      if (map.hasLayer(gibsLayer)) {
        map.removeLayer(gibsLayer);
      }
    }
  }, [showGibsOverlay, activeBasemap]);

  // Auto-close toggles menu on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (togglesMenuRef.current && !togglesMenuRef.current.contains(e.target as Node)) {
        setIsTogglesOpen(false);
      }
    };
    if (isTogglesOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isTogglesOpen]);

  // Update SAR Raster Overlay
  const updateSarOverlay = useCallback(() => {
    const map = mapRef.current;
    if (!map || !scanResult) return;

    const layer = scanResult.layers.find((l) => l.id === activeLayerId) || scanResult.layers[0];
    const matrix = layer?.matrix || [];
    const rows = matrix.length;
    const cols = matrix[0]?.length || 0;

    if (rows === 0 || cols === 0) return;

    const offscreen = document.createElement('canvas');
    offscreen.width = 512;
    offscreen.height = 512;
    const ctx = offscreen.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, 512, 512);

    const cellW = 512 / cols;
    const cellH = 512 / rows;

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const val = matrix[r][c];
        const x = c * cellW;
        const y = r * cellH;

        let fill = 'transparent';

        if (layer.layer_type === 'backscatter_db') {
          const norm = Math.max(0, Math.min(1, (val + 28) / 28));
          const grey = Math.round(norm * 255);
          fill = `rgba(${grey}, ${grey}, ${grey}, 0.72)`;
        } else if (layer.layer_type === 'backscatter_change_db') {
          if (Math.abs(val) > 1.2) {
            if (val > 0) {
              const alpha = Math.min(0.85, 0.25 + (Math.abs(val) / 8) * 0.6);
              fill = `rgba(230, 81, 0, ${alpha})`;
            } else {
              const alpha = Math.min(0.85, 0.25 + (Math.abs(val) / 8) * 0.6);
              fill = `rgba(6, 182, 212, ${alpha})`;
            }
          }
        } else if (layer.layer_type === 'water_mask') {
          if (val === 1) {
            fill = 'rgba(6, 182, 212, 0.85)';
          }
        } else if (layer.layer_type === 'coherence') {
          const norm = Math.max(0, Math.min(1, val));
          const rC = Math.round(norm * 245);
          const gC = Math.round(norm * 230);
          const bC = Math.round(norm * 160 + 30);
          fill = `rgba(${rC}, ${gC}, ${bC}, 0.75)`;
        } else if (layer.layer_type === 'phase_fringes') {
          const norm = (val + Math.PI) / (2 * Math.PI);
          const hue = Math.round(norm * 360);
          fill = `hsla(${hue}, 90%, 55%, 0.8)`;
        } else if (layer.layer_type === 'los_displacement') {
          if (Math.abs(val) > 20) {
            if (val > 0) {
              const alpha = Math.min(0.9, 0.3 + (Math.abs(val) / 600) * 0.6);
              fill = `rgba(230, 81, 0, ${alpha})`;
            } else {
              const alpha = Math.min(0.9, 0.3 + (Math.abs(val) / 600) * 0.6);
              fill = `rgba(59, 130, 246, ${alpha})`;
            }
          }
        } else if (layer.layer_type === 'copernicus_dem') {
          const norm = Math.max(0, Math.min(1, val / 30));
          const rElev = Math.round(16 + norm * 200);
          const gElev = Math.round(140 + norm * 40);
          const bElev = Math.round(120 - norm * 80);
          fill = `rgba(${rElev}, ${gElev}, ${bElev}, 0.78)`;
        } else if (layer.layer_type === 'sentinel2_optical') {
          const norm = Math.max(0, Math.min(1, val));
          if (norm < 0.2) {
            fill = `rgba(30, 64, 175, 0.75)`;
          } else {
            const green = Math.round(100 + norm * 120);
            fill = `rgba(16, ${green}, 48, 0.78)`;
          }
        }

        ctx.fillStyle = fill;
        ctx.fillRect(x, y, cellW + 0.5, cellH + 0.5);
      }
    }

    const dataUrl = offscreen.toDataURL();
    const bounds = [
      [hotspot.bbox[1], hotspot.bbox[0]],
      [hotspot.bbox[3], hotspot.bbox[2]],
    ] as [[number, number], [number, number]];

    if (sarOverlayRef.current) {
      sarOverlayRef.current.setUrl(dataUrl);
      sarOverlayRef.current.setBounds(L.latLngBounds(bounds));
      sarOverlayRef.current.setOpacity(showSarOverlay ? sarOpacity : 0);
    } else {
      const overlay = L.imageOverlay(dataUrl, L.latLngBounds(bounds), {
        opacity: showSarOverlay ? sarOpacity : 0,
        interactive: false,
      });
      overlay.addTo(map);
      sarOverlayRef.current = overlay;
    }
  }, [activeLayerId, hotspot, scanResult, showSarOverlay, sarOpacity]);

  useEffect(() => {
    updateSarOverlay();
  }, [updateSarOverlay]);

  // Fast GPU opacity update without re-rasterizing canvas
  useEffect(() => {
    if (sarOverlayRef.current) {
      sarOverlayRef.current.setOpacity(showSarOverlay ? sarOpacity : 0);
    }
  }, [sarOpacity, showSarOverlay]);

  // Update Vector Features
  useEffect(() => {
    const map = mapRef.current;
    const group = vectorGroupRef.current;
    if (!map || !group) return;

    group.clearLayers();

    if (!showVectors) return;

    // Draw active Hotspot Bounding Box in warm orange
    const boundsPolygon = L.polygon(
      [
        [hotspot.bbox[1], hotspot.bbox[0]],
        [hotspot.bbox[1], hotspot.bbox[2]],
        [hotspot.bbox[3], hotspot.bbox[2]],
        [hotspot.bbox[3], hotspot.bbox[0]],
      ],
      {
        color: '#E65100',
        weight: 2,
        dashArray: '6, 6',
        fillColor: '#E65100',
        fillOpacity: 0.04,
      }
    );
    boundsPolygon.bindTooltip(
      `<div class="font-mono text-xs font-bold text-[#E65100]">${hotspot.name}</div><div class="text-[10px] text-stone-600">NISAR Frame AOI</div>`,
      { sticky: true }
    );
    group.addLayer(boundsPolygon);

    const features = GEO_FEATURES.filter((f) => f.hotspotId === hotspot.id);

    features.forEach((feat) => {
      if (feat.type === 'fault_line') {
        const polyline = L.polyline(feat.coordinates, {
          color: '#DC2626',
          weight: 4,
          dashArray: '8, 4',
        });
        polyline.bindTooltip(
          `<div class="font-bold text-xs text-rose-600">${feat.name}</div><div class="text-[10px] text-stone-600">${feat.description}</div>`,
          { sticky: true }
        );
        group.addLayer(polyline);
      } else if (feat.type === 'island' || feat.type === 'mangrove_reserve' || feat.type === 'embankment') {
        const poly = L.polygon(feat.coordinates, {
          color: feat.type === 'mangrove_reserve' ? '#059669' : '#0891B2',
          weight: 2,
          fillColor: feat.type === 'mangrove_reserve' ? '#10B981' : '#06B6D4',
          fillOpacity: 0.15,
        });
        poly.bindTooltip(
          `<div class="font-bold text-xs ${feat.type === 'mangrove_reserve' ? 'text-emerald-700' : 'text-cyan-700'}">${feat.name}</div><div class="text-[10px] text-stone-600">${feat.radarSignificance}</div>`,
          { sticky: true }
        );
        group.addLayer(poly);
      } else if (feat.type === 'epicenter') {
        const marker = L.circleMarker(feat.coordinates[0], {
          radius: 9,
          color: '#E65100',
          fillColor: '#EF4444',
          fillOpacity: 0.9,
          weight: 2,
        });
        marker.bindTooltip(
          `<div class="font-bold text-xs text-[#E65100]">${feat.name}</div><div class="text-[10px] text-stone-600">${feat.description}</div>`,
          { permanent: true, direction: 'top' }
        );
        group.addLayer(marker);
      } else if (feat.type === 'city') {
        const marker = L.circleMarker(feat.coordinates[0], {
          radius: 6,
          color: '#201D1A',
          fillColor: '#FFFFFF',
          fillOpacity: 0.95,
          weight: 2,
        });
        marker.bindTooltip(
          `<div class="font-bold text-xs text-[#201D1A]">${feat.name}</div>`,
          { permanent: false, direction: 'top' }
        );
        group.addLayer(marker);
      }
    });
  }, [hotspot, showVectors]);

  const currentLayer = scanResult?.layers.find((l) => l.id === activeLayerId) || scanResult?.layers[0];
  const explanation = layerExplanations[activeLayerId] || layerExplanations['backscatter_db'];

  const isAtmosphereCorrectable =
    activeLayerId.includes('phase_fringes') || activeLayerId.includes('los_displacement');
  const isAtmosphereCorrected = activeLayerId.includes('corrected');

  const handleToggleWeatherCorrection = () => {
    if (activeLayerId === 'phase_fringes') onLayerChange('phase_fringes_corrected');
    else if (activeLayerId === 'phase_fringes_corrected') onLayerChange('phase_fringes');
    else if (activeLayerId === 'los_displacement') onLayerChange('los_displacement_corrected');
    else if (activeLayerId === 'los_displacement_corrected') onLayerChange('los_displacement');
    else {
      if (hotspot.phenomenon === 'earthquake_insar') {
        onLayerChange('phase_fringes_corrected');
      } else {
        onLayerChange('los_displacement_corrected');
      }
    }
  };

  const GIBS_CYCLES = [
    { date: '2026-10-25', label: 'Cycle 36 (25 Oct 2026)', desc: 'Validated Cal/Val' },
    { date: '2026-08-12', label: 'Cycle 30 (12 Aug 2026)', desc: 'Peak Monsoon Flood' },
    { date: '2026-07-23', label: 'Cycle 28 (23 Jul 2026)', desc: 'Early Inundation' },
    { date: '2026-06-25', label: 'Cycle 25 (25 Jun 2026)', desc: 'Pre-Event Baseline' },
  ];

  const activeTogglesCount = [
    showSarOverlay,
    activeBasemap === 'gibs' || showGibsOverlay,
    showRadarSweep,
    showVectors,
    showIntelPanel,
    showLegend,
    showProbe,
    isSplitMode,
  ].filter(Boolean).length;

  const currentHotspotIndex = allHotspots.findIndex((h) => h.id === hotspot.id);
  const handlePrevHotspot = () => {
    const prevIdx = (currentHotspotIndex - 1 + allHotspots.length) % allHotspots.length;
    onSelectHotspot(allHotspots[prevIdx].id);
  };
  const handleNextHotspot = () => {
    const nextIdx = (currentHotspotIndex + 1) % allHotspots.length;
    onSelectHotspot(allHotspots[nextIdx].id);
  };

  const handleResetToggles = () => {
    setShowSarOverlay(true);
    setSarOpacity(0.75);
    setShowVectors(true);
    setShowRadarSweep(true);
    setShowGibsOverlay(false);
    setGibsDate('2026-10-25');
    setGibsOpacity(0.85);
    setShowIntelPanel(true);
    setShowLegend(true);
    setShowProbe(true);
    setIsSplitMode(false);
  };

  return (
    <div className="relative flex-1 flex flex-col h-full bg-[#F7F5F0] overflow-hidden select-none">
      {/* Top Floating Spatial GIS Bar */}
      <div className="absolute top-3 left-3 right-3 z-30 flex items-center justify-between gap-2 pointer-events-none">
        {/* Study Area Dropdown & Step Controller */}
        <div className="flex items-center gap-1 p-1 glass-panel-light rounded-xl shadow-soft pointer-events-auto bg-white/95 shrink-0 max-w-[48vw]">
          <div className="flex items-center gap-1 pl-1.5 pr-0.5">
            <MapPin className="w-3.5 h-3.5 text-[#E65100] shrink-0" />
            <span className="text-[10px] font-bold text-[#696259] uppercase tracking-wider font-mono hidden md:inline">
              Area:
            </span>
          </div>

          {/* Quick Prev Button */}
          <button
            onClick={handlePrevHotspot}
            className="p-1 rounded-lg text-[#696259] hover:text-[#201D1A] hover:bg-[#F0ECE1] transition-colors cursor-pointer"
            title="Previous Study Area"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>

          {/* Rich Dropdown Selector */}
          <select
            value={hotspot.id}
            onChange={(e) => onSelectHotspot(e.target.value)}
            className="text-xs font-bold text-[#201D1A] bg-[#FAF8F5] border border-[#E5DFD3] rounded-lg focus:outline-none focus:border-[#E65100] cursor-pointer py-1 px-2 max-w-[190px] sm:max-w-[240px] truncate"
            aria-label="Select Target Study Area"
          >
            {allHotspots.map((h, idx) => (
              <option key={h.id} value={h.id} className="text-[#201D1A] bg-white font-medium py-1">
                {idx + 1}. {h.name.split(' (')[0]} — {h.region.split(',')[0]}
              </option>
            ))}
          </select>

          {/* Quick Next Button */}
          <button
            onClick={handleNextHotspot}
            className="p-1 rounded-lg text-[#696259] hover:text-[#201D1A] hover:bg-[#F0ECE1] transition-colors cursor-pointer"
            title="Next Study Area"
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* 3D Switcher, Recenter & Map Tools */}
        <div className="flex items-center gap-1.5 pointer-events-auto shrink-0">
          {/* Zoom In & Out Controls */}
          <div className="flex items-center rounded-xl bg-white/95 p-0.5 border border-[#E5DFD3] shadow-soft">
            <button
              onClick={() => mapRef.current?.zoomIn()}
              className="p-1.5 rounded-lg text-[#696259] hover:text-[#E65100] hover:bg-[#F0ECE1] transition-all cursor-pointer"
              title="Zoom In (+)"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
            <div className="w-[1px] h-3 bg-[#E5DFD3]" />
            <button
              onClick={() => mapRef.current?.zoomOut()}
              className="p-1.5 rounded-lg text-[#696259] hover:text-[#E65100] hover:bg-[#F0ECE1] transition-all cursor-pointer"
              title="Zoom Out (-)"
            >
              <Minus className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Recenter AOI */}
          <button
            onClick={() => {
              if (mapRef.current) {
                mapRef.current.flyTo(hotspot.center, hotspot.zoom, { duration: 1.0 });
              }
            }}
            className="p-1.5 text-xs font-semibold rounded-xl glass-panel-light text-[#696259] hover:text-[#E65100] hover:bg-white border border-[#E5DFD3] transition-all shadow-soft cursor-pointer bg-white/95"
            title="Recenter Map on Hotspot AOI"
          >
            <Compass className="w-4 h-4" />
          </button>

          {/* Switch to 3D Globe Button */}
          <button
            onClick={onOpenGlobe3D}
            className="px-2.5 py-1.5 text-xs font-bold rounded-xl glass-panel-light text-[#E65100] border border-[#E5DFD3] flex items-center gap-1.5 hover:bg-white transition-all shadow-soft cursor-pointer bg-white/95"
            title="Open 3D Spatial Earth & Satellite Orbit"
          >
            <Globe className="w-3.5 h-3.5 text-[#E65100]" />
            <span className="hidden xl:inline text-[11px]">3D Orbit</span>
          </button>

          {/* Basemap Picker */}
          <div className="flex rounded-xl bg-white/95 p-0.5 border border-[#E5DFD3] text-xs shadow-soft">
            <button
              onClick={() => setActiveBasemap('satellite')}
              className={`px-2 py-1 rounded-lg transition-all cursor-pointer font-semibold text-[11px] ${
                activeBasemap === 'satellite'
                  ? 'bg-[#E65100] text-white shadow-xs'
                  : 'text-[#696259] hover:text-[#201D1A]'
              }`}
            >
              Satellite
            </button>
            <button
              onClick={() => setActiveBasemap('warm_topo')}
              className={`px-2 py-1 rounded-lg transition-all cursor-pointer font-semibold text-[11px] ${
                activeBasemap === 'warm_topo'
                  ? 'bg-[#E65100] text-white shadow-xs'
                  : 'text-[#696259] hover:text-[#201D1A]'
              }`}
            >
              Warm Topo
            </button>
            <button
              onClick={() => setActiveBasemap('gibs')}
              className={`px-2 py-1 rounded-lg transition-all cursor-pointer font-semibold text-[11px] ${
                activeBasemap === 'gibs'
                  ? 'bg-[#E65100] text-white shadow-xs'
                  : 'text-[#696259] hover:text-[#201D1A]'
              }`}
              title="NASA GIBS 12-Day NISAR Layer"
            >
              GIBS
            </button>
          </div>

          {/* Swipe Comparator Toggle */}
          <button
            onClick={() => setIsSplitMode(!isSplitMode)}
            className={`px-2.5 py-1.5 text-xs font-semibold rounded-xl glass-panel-light flex items-center gap-1 cursor-pointer transition-all border border-[#E5DFD3] shadow-soft bg-white/95 ${
              isSplitMode
                ? 'border-[#E65100] text-[#E65100] bg-white ring-2 ring-[#E65100]/20'
                : 'text-[#201D1A] hover:text-[#E65100]'
            }`}
          >
            <Split className="w-3.5 h-3.5" />
            <span className="hidden lg:inline text-[11px]">{isSplitMode ? 'Swipe Active' : 'Swipe'}</span>
          </button>

          {/* Map Feature & Layer Toggles Popover */}
          <div className="relative" ref={togglesMenuRef}>
            <button
              onClick={() => setIsTogglesOpen(!isTogglesOpen)}
              className={`px-2.5 py-1.5 text-xs font-semibold rounded-xl glass-panel-light flex items-center gap-1.5 cursor-pointer transition-all border shadow-soft bg-white/95 ${
                isTogglesOpen
                  ? 'border-[#E65100] text-[#E65100] bg-white ring-2 ring-[#E65100]/20'
                  : 'border-[#E5DFD3] text-[#201D1A] hover:text-[#E65100]'
              }`}
              title="Toggle Map Layers, Overlays & Visual Features"
            >
              <Sliders className="w-3.5 h-3.5 text-[#E65100]" />
              <span className="text-[11px]">Toggles</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-[#E65100]/10 text-[#E65100] font-mono font-bold">
                {activeTogglesCount}
              </span>
            </button>

            {/* Dropdown Popover */}
            {isTogglesOpen && (
              <div className="absolute right-0 top-full mt-2 w-80 sm:w-96 bg-white/98 backdrop-blur-md rounded-2xl border border-[#E5DFD3] shadow-2xl p-4 z-40 space-y-4 max-h-[82vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-150 text-[#201D1A]">
                {/* Popover Header */}
                <div className="flex items-center justify-between border-b border-[#E5DFD3] pb-2.5">
                  <div className="flex items-center gap-2">
                    <Sliders className="w-4 h-4 text-[#E65100]" />
                    <span className="font-bold text-xs uppercase tracking-wider font-mono text-[#201D1A]">
                      Map & Layer Toggles
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={handleResetToggles}
                      className="p-1 text-[11px] font-semibold text-[#696259] hover:text-[#E65100] flex items-center gap-1 hover:bg-[#FAF8F5] rounded-lg transition-colors cursor-pointer"
                      title="Reset all toggles to defaults"
                    >
                      <RotateCcw className="w-3 h-3" />
                      <span>Reset</span>
                    </button>
                    <button
                      onClick={() => setIsTogglesOpen(false)}
                      className="p-1 rounded-lg text-[#696259] hover:text-[#201D1A] hover:bg-[#FAF8F5] transition-colors cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Section 1: Radar & Satellite Overlays */}
                <div className="space-y-2">
                  <span className="text-[10px] font-mono font-bold uppercase text-[#696259] tracking-wider block">
                    Radar & Satellite Overlays
                  </span>

                  {/* 1. SAR Overlay Toggle */}
                  <div className="p-2.5 rounded-xl bg-[#FAF8F5] border border-[#E5DFD3] space-y-2">
                    <div
                      onClick={() => setShowSarOverlay(!showSarOverlay)}
                      className="flex items-center justify-between cursor-pointer select-none"
                    >
                      <div className="flex items-center gap-2">
                        <Radio className="w-4 h-4 text-[#E65100]" />
                        <div>
                          <span className="text-xs font-bold text-[#201D1A] block">
                            Computed SAR Radar Overlay
                          </span>
                          <span className="text-[10px] text-[#696259]">
                            {showSarOverlay ? 'Visible over base imagery' : 'Hidden (Inspect base map directly)'}
                          </span>
                        </div>
                      </div>
                      <div
                        className={`w-9 h-5 flex items-center rounded-full p-0.5 transition-colors duration-200 shrink-0 ${
                          showSarOverlay ? 'bg-[#E65100]' : 'bg-[#D1C9BE]'
                        }`}
                      >
                        <div
                          className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-200 ${
                            showSarOverlay ? 'translate-x-4' : 'translate-x-0'
                          }`}
                        />
                      </div>
                    </div>

                    {showSarOverlay && (
                      <div className="pt-2 border-t border-[#E5DFD3] flex items-center justify-between text-[11px] font-mono text-[#696259]">
                        <span>Radar Opacity:</span>
                        <div className="flex items-center gap-2">
                          <input
                            type="range"
                            min="0.1"
                            max="1.0"
                            step="0.05"
                            value={sarOpacity}
                            onChange={(e) => setSarOpacity(parseFloat(e.target.value))}
                            className="w-24 accent-[#E65100] cursor-pointer"
                          />
                          <span className="tabular-nums font-bold text-[#201D1A] min-w-[28px] text-right">
                            {Math.round(sarOpacity * 100)}%
                          </span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* 2. NASA GIBS WMS Toggle */}
                  <div className="p-2.5 rounded-xl bg-[#FAF8F5] border border-[#E5DFD3] space-y-2">
                    <div
                      onClick={() => {
                        if (activeBasemap === 'gibs') {
                          setActiveBasemap('satellite');
                          setShowGibsOverlay(false);
                        } else {
                          setShowGibsOverlay(!showGibsOverlay);
                        }
                      }}
                      className="flex items-center justify-between cursor-pointer select-none"
                    >
                      <div className="flex items-center gap-2">
                        <Globe className="w-4 h-4 text-[#0891B2]" />
                        <div>
                          <span className="text-xs font-bold text-[#201D1A] block">
                            NASA GIBS NISAR Mosaic (WMS)
                          </span>
                          <span className="text-[10px] text-[#696259]">
                            {activeBasemap === 'gibs' || showGibsOverlay ? 'Live NASA WMS Active' : 'Off'}
                          </span>
                        </div>
                      </div>
                      <div
                        className={`w-9 h-5 flex items-center rounded-full p-0.5 transition-colors duration-200 shrink-0 ${
                          activeBasemap === 'gibs' || showGibsOverlay ? 'bg-[#0891B2]' : 'bg-[#D1C9BE]'
                        }`}
                      >
                        <div
                          className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-200 ${
                            activeBasemap === 'gibs' || showGibsOverlay ? 'translate-x-4' : 'translate-x-0'
                          }`}
                        />
                      </div>
                    </div>

                    {(activeBasemap === 'gibs' || showGibsOverlay) && (
                      <div className="pt-2 border-t border-[#E5DFD3] space-y-2">
                        <div className="space-y-1">
                          <label className="text-[10px] font-mono text-[#696259] uppercase block font-semibold">
                            GIBS 12-Day Cycle Date:
                          </label>
                          <div className="grid grid-cols-2 gap-1.5">
                            {GIBS_CYCLES.map((cycle) => (
                              <button
                                key={cycle.date}
                                onClick={() => setGibsDate(cycle.date)}
                                className={`p-1.5 rounded-lg border text-left transition-all cursor-pointer text-[10px] font-mono ${
                                  gibsDate === cycle.date
                                    ? 'bg-[#0891B2] text-white border-[#0891B2] font-bold shadow-xs'
                                    : 'bg-white border-[#E5DFD3] text-[#696259] hover:text-[#201D1A]'
                                }`}
                              >
                                <span className="block truncate">{cycle.label}</span>
                                <span className="text-[9px] opacity-80 block truncate">{cycle.desc}</span>
                              </button>
                            ))}
                          </div>
                        </div>

                        <div className="flex items-center justify-between text-[11px] font-mono text-[#696259] pt-1">
                          <span>GIBS Opacity:</span>
                          <div className="flex items-center gap-2">
                            <input
                              type="range"
                              min="0.1"
                              max="1.0"
                              step="0.05"
                              value={gibsOpacity}
                              onChange={(e) => setGibsOpacity(parseFloat(e.target.value))}
                              className="w-24 accent-[#0891B2] cursor-pointer"
                            />
                            <span className="tabular-nums font-bold text-[#201D1A] min-w-[28px] text-right">
                              {Math.round(gibsOpacity * 100)}%
                            </span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Section 2: Visual & Analysis Elements */}
                <div className="space-y-2">
                  <span className="text-[10px] font-mono font-bold uppercase text-[#696259] tracking-wider block">
                    Visual & Analysis Features
                  </span>

                  {/* Ground Truth Vectors */}
                  <div
                    onClick={() => setShowVectors(!showVectors)}
                    className="flex items-center justify-between p-2 rounded-xl bg-[#FAF8F5] border border-[#E5DFD3] cursor-pointer select-none"
                  >
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-[#E65100]" />
                      <div>
                        <span className="text-xs font-bold text-[#201D1A] block">
                          Ground Truth Markers & AOI
                        </span>
                        <span className="text-[10px] text-[#696259]">
                          Embankments, tide gauges, faults & frame polygon
                        </span>
                      </div>
                    </div>
                    <div
                      className={`w-9 h-5 flex items-center rounded-full p-0.5 transition-colors duration-200 shrink-0 ${
                        showVectors ? 'bg-[#E65100]' : 'bg-[#D1C9BE]'
                      }`}
                    >
                      <div
                        className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-200 ${
                          showVectors ? 'translate-x-4' : 'translate-x-0'
                        }`}
                      />
                    </div>
                  </div>

                  {/* Radar Sweep Animation */}
                  <div
                    onClick={() => setShowRadarSweep(!showRadarSweep)}
                    className="flex items-center justify-between p-2 rounded-xl bg-[#FAF8F5] border border-[#E5DFD3] cursor-pointer select-none"
                  >
                    <div className="flex items-center gap-2">
                      <Activity className="w-4 h-4 text-[#E65100]" />
                      <div>
                        <span className="text-xs font-bold text-[#201D1A] block">
                          Radar Beam Sweep Animation
                        </span>
                        <span className="text-[10px] text-[#696259]">
                          Dynamic rotating microwave pulse beam
                        </span>
                      </div>
                    </div>
                    <div
                      className={`w-9 h-5 flex items-center rounded-full p-0.5 transition-colors duration-200 shrink-0 ${
                        showRadarSweep ? 'bg-[#E65100]' : 'bg-[#D1C9BE]'
                      }`}
                    >
                      <div
                        className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-200 ${
                          showRadarSweep ? 'translate-x-4' : 'translate-x-0'
                        }`}
                      />
                    </div>
                  </div>

                  {/* Tropospheric Delay Weather Correction */}
                  <div
                    onClick={handleToggleWeatherCorrection}
                    className="flex items-center justify-between p-2 rounded-xl bg-[#FAF8F5] border border-[#E5DFD3] cursor-pointer select-none"
                  >
                    <div className="flex items-center gap-2">
                      <CloudSun className="w-4 h-4 text-[#0891B2]" />
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-bold text-[#201D1A]">
                            Weather Delay Filter (ERA5)
                          </span>
                          <span className={`text-[9px] font-mono font-bold px-1.5 py-0.2 rounded ${
                            isAtmosphereCorrected ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                          }`}>
                            {isAtmosphereCorrected ? 'Corrected' : 'Raw Noise'}
                          </span>
                        </div>
                        <span className="text-[10px] text-[#696259]">
                          {isAtmosphereCorrected ? 'Tropospheric water-vapor bias removed (-25.2 mm)' : 'Unfiltered raw InSAR phase distortion'}
                        </span>
                      </div>
                    </div>
                    <div
                      className={`w-9 h-5 flex items-center rounded-full p-0.5 transition-colors duration-200 shrink-0 ${
                        isAtmosphereCorrected ? 'bg-[#0891B2]' : 'bg-[#D1C9BE]'
                      }`}
                    >
                      <div
                        className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-200 ${
                          isAtmosphereCorrected ? 'translate-x-4' : 'translate-x-0'
                        }`}
                      />
                    </div>
                  </div>
                </div>

                {/* Section 3: Floating HUD & Interface Cards */}
                <div className="space-y-2">
                  <span className="text-[10px] font-mono font-bold uppercase text-[#696259] tracking-wider block">
                    HUD & Interface Panels
                  </span>

                  {/* Environmental Intel Toggle */}
                  <div
                    onClick={() => setShowIntelPanel(!showIntelPanel)}
                    className="flex items-center justify-between p-2 rounded-xl bg-[#FAF8F5] border border-[#E5DFD3] cursor-pointer select-none"
                  >
                    <div className="flex items-center gap-2">
                      <CloudSun className="w-4 h-4 text-[#0891B2]" />
                      <span className="text-xs font-semibold text-[#201D1A]">
                        Environmental Intel (Weather & STAC DEM)
                      </span>
                    </div>
                    <div
                      className={`w-9 h-5 flex items-center rounded-full p-0.5 transition-colors duration-200 shrink-0 ${
                        showIntelPanel ? 'bg-[#E65100]' : 'bg-[#D1C9BE]'
                      }`}
                    >
                      <div
                        className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-200 ${
                          showIntelPanel ? 'translate-x-4' : 'translate-x-0'
                        }`}
                      />
                    </div>
                  </div>

                  {/* Radar Color Legend Toggle */}
                  <div
                    onClick={() => setShowLegend(!showLegend)}
                    className="flex items-center justify-between p-2 rounded-xl bg-[#FAF8F5] border border-[#E5DFD3] cursor-pointer select-none"
                  >
                    <div className="flex items-center gap-2">
                      <Layers className="w-4 h-4 text-[#E65100]" />
                      <span className="text-xs font-semibold text-[#201D1A]">
                        Radar Color Legend & Layer Dock
                      </span>
                    </div>
                    <div
                      className={`w-9 h-5 flex items-center rounded-full p-0.5 transition-colors duration-200 shrink-0 ${
                        showLegend ? 'bg-[#E65100]' : 'bg-[#D1C9BE]'
                      }`}
                    >
                      <div
                        className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-200 ${
                          showLegend ? 'translate-x-4' : 'translate-x-0'
                        }`}
                      />
                    </div>
                  </div>

                  {/* Radar Coordinate Probe Toggle */}
                  <div
                    onClick={() => setShowProbe(!showProbe)}
                    className="flex items-center justify-between p-2 rounded-xl bg-[#FAF8F5] border border-[#E5DFD3] cursor-pointer select-none"
                  >
                    <div className="flex items-center gap-2">
                      <Crosshair className="w-4 h-4 text-[#E65100]" />
                      <span className="text-xs font-semibold text-[#201D1A]">
                        Coordinate Radar Probe HUD
                      </span>
                    </div>
                    <div
                      className={`w-9 h-5 flex items-center rounded-full p-0.5 transition-colors duration-200 shrink-0 ${
                        showProbe ? 'bg-[#E65100]' : 'bg-[#D1C9BE]'
                      }`}
                    >
                      <div
                        className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-200 ${
                          showProbe ? 'translate-x-4' : 'translate-x-0'
                        }`}
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Map Viewport */}
      <div className="relative flex-1 w-full h-full">
        <div ref={mapContainerRef} className="w-full h-full z-0" />

        {/* Animated Radar Sweep Visual */}
        {showRadarSweep && (
          <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-20 z-10">
            <div className="w-[180%] h-[180%] -top-[40%] -left-[40%] absolute rounded-full border border-[#E65100]/40 animate-radar-sweep bg-gradient-to-tr from-transparent via-[#E65100]/10 to-transparent" />
          </div>
        )}

        {/* Split Screen Comparator Drag Divider */}
        {isSplitMode && (
          <div
            className="absolute inset-y-0 z-20 pointer-events-none"
            style={{ left: `${splitPos}%` }}
          >
            <div className="w-0.5 h-full bg-[#E65100] shadow-[0_0_15px_#E65100] relative">
              <div
                className="absolute top-1/2 -translate-y-1/2 -left-4 w-8 h-8 rounded-full bg-[#E65100] text-white flex items-center justify-center cursor-ew-resize pointer-events-auto shadow-float"
                onMouseDown={(e) => {
                  const onMove = (mv: MouseEvent) => {
                    const rect = mapContainerRef.current?.getBoundingClientRect();
                    if (!rect) return;
                    const pct = Math.max(5, Math.min(95, ((mv.clientX - rect.left) / rect.width) * 100));
                    setSplitPos(pct);
                  };
                  const onUp = () => {
                    window.removeEventListener('mousemove', onMove);
                    window.removeEventListener('mouseup', onUp);
                  };
                  window.addEventListener('mousemove', onMove);
                  window.addEventListener('mouseup', onUp);
                }}
              >
                <Split className="w-4 h-4 rotate-90" />
              </div>
            </div>

            <div className="absolute top-24 -left-32 px-3 py-1.5 rounded-xl bg-white/95 text-xs font-mono text-[#0891B2] border border-[#E5DFD3] shadow-soft">
              ◀ PRE-EVENT SATELLITE
            </div>
            <div className="absolute top-24 left-6 px-3 py-1.5 rounded-xl bg-white/95 text-xs font-mono text-[#E65100] border border-[#E5DFD3] shadow-soft">
              POST-EVENT SAR HEATMAP ▶
            </div>
          </div>
        )}

        {/* Unified Environmental & Multi-Sensor Intel Panel (Top Left) */}
        {(scanResult?.tropospheric_correction || scanResult?.multi_sensor_validation) && (
          showIntelPanel ? (
            <div className="absolute top-20 left-5 z-20 pointer-events-auto max-w-[320px] transition-all duration-200">
              {!intelExpanded ? (
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => setIntelExpanded(true)}
                    className="glass-panel-light px-3.5 py-2 rounded-2xl text-xs font-semibold text-[#201D1A] flex items-center gap-2 shadow-float border border-[#E5DFD3] hover:border-[#E65100] transition-all bg-white/95 cursor-pointer"
                    title="Expand Environmental & Cloud Intel"
                  >
                    <CloudSun className="w-4 h-4 text-[#0891B2]" />
                    <span className="font-bold">Environmental Intel</span>
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <ChevronDown className="w-3.5 h-3.5 text-[#696259]" />
                  </button>
                  <button
                    onClick={() => setShowIntelPanel(false)}
                    className="p-2 rounded-xl text-[#696259] hover:text-[#201D1A] glass-panel-light border border-[#E5DFD3] hover:bg-[#F0ECE1] transition-colors cursor-pointer bg-white/95 shadow-soft"
                    title="Hide Intel Card"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <div className="glass-panel-light p-3 rounded-2xl text-xs shadow-float border border-[#E5DFD3] bg-white/95 space-y-2.5">
                  {/* Header with Segmented Tab Switcher, Minimize & Close */}
                  <div className="flex items-center justify-between border-b border-[#E5DFD3] pb-2">
                    <div className="flex items-center gap-1 bg-[#FAF8F5] p-0.5 rounded-xl border border-[#E5DFD3] text-[11px]">
                      <button
                        onClick={() => setIntelTab('weather')}
                        className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                          intelTab === 'weather'
                            ? 'bg-[#0891B2] text-white shadow-xs'
                            : 'text-[#696259] hover:text-[#201D1A]'
                        }`}
                      >
                        <CloudSun className="w-3.5 h-3.5" />
                        <span>Weather Delay</span>
                      </button>
                      <button
                        onClick={() => setIntelTab('stac')}
                        className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                          intelTab === 'stac'
                            ? 'bg-[#0284C7] text-white shadow-xs'
                            : 'text-[#696259] hover:text-[#201D1A]'
                        }`}
                      >
                        <Globe className="w-3.5 h-3.5" />
                        <span>STAC DEM/S2</span>
                      </button>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => setIntelExpanded(false)}
                        className="p-1 rounded-lg text-[#696259] hover:text-[#201D1A] hover:bg-[#F0ECE1] transition-colors cursor-pointer"
                        title="Minimize Intel Panel"
                      >
                        <ChevronUp className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setShowIntelPanel(false)}
                        className="p-1 rounded-lg text-[#696259] hover:text-[#201D1A] hover:bg-[#F0ECE1] transition-colors cursor-pointer"
                        title="Close Intel Panel"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Tab 1: Meteomatics Weather & InSAR Delay */}
                  {intelTab === 'weather' && scanResult?.tropospheric_correction && (
                    <div className="space-y-1.5 font-mono text-[11px] text-[#696259]">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-[#E65100]">Meteomatics ERA5:</span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 font-bold border border-emerald-200">
                          ZHD + ZWD DELAY
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Pre PWV:</span>
                        <strong className="text-[#201D1A]">{scanResult.tropospheric_correction.pre_pwv_mm} mm</strong>
                      </div>
                      <div className="flex justify-between">
                        <span>Post PWV:</span>
                        <strong className="text-[#201D1A]">{scanResult.tropospheric_correction.post_pwv_mm} mm</strong>
                      </div>
                      <div className="flex justify-between text-[#0891B2] font-bold">
                        <span>ΔPWV Slant Delay:</span>
                        <span>{scanResult.tropospheric_correction.delta_pwv_mm > 0 ? `+${scanResult.tropospheric_correction.delta_pwv_mm}` : scanResult.tropospheric_correction.delta_pwv_mm} mm</span>
                      </div>
                      <div className="flex justify-between text-[#E65100] font-bold border-t border-[#E5DFD3] pt-1">
                        <span>Artifact Removed:</span>
                        <span>{scanResult.tropospheric_correction.atmospheric_bias_removed_mm} mm</span>
                      </div>

                      {/* Toggle Button for InSAR */}
                      {(activeLayerId.includes('phase_fringes') || activeLayerId.includes('los_displacement')) && (
                        <button
                          onClick={() => {
                            if (activeLayerId === 'phase_fringes_corrected') onLayerChange('phase_fringes');
                            else if (activeLayerId === 'phase_fringes') onLayerChange('phase_fringes_corrected');
                            else if (activeLayerId === 'los_displacement_corrected') onLayerChange('los_displacement');
                            else if (activeLayerId === 'los_displacement') onLayerChange('los_displacement_corrected');
                          }}
                          className="w-full mt-2 py-1.5 px-2 rounded-xl bg-[#0891B2] text-white font-bold text-[11px] text-center hover:bg-[#0e7490] transition-all cursor-pointer shadow-xs flex items-center justify-center gap-1.5"
                        >
                          <Sparkles className="w-3.5 h-3.5" />
                          <span>
                            {activeLayerId.includes('corrected') ? 'Show Raw (With Noise)' : 'Apply Meteomatics Filter'}
                          </span>
                        </button>
                      )}
                    </div>
                  )}

                  {/* Tab 2: Planetary Computer STAC (DEM & Optical) */}
                  {intelTab === 'stac' && scanResult?.multi_sensor_validation && (
                    <div className="space-y-1.5 font-mono text-[11px] text-[#696259]">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-[#0284C7]">Copernicus & S2 STAC:</span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#0284C7]/10 text-[#0284C7] font-bold">
                          CROSS-SENSOR
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Copernicus DEM:</span>
                        <strong className="text-[#201D1A]">GLO-30 (30m)</strong>
                      </div>
                      <div className="flex justify-between">
                        <span>Sentinel-2 Optical:</span>
                        <strong className="text-[#201D1A]">10m Visual L2A</strong>
                      </div>
                      <div className="flex justify-between text-[#0284C7] font-bold">
                        <span>Optical Cloud Cover:</span>
                        <span>{scanResult.multi_sensor_validation.optical_cloud_cover_pct}%</span>
                      </div>
                      <div className="flex justify-between text-[#E65100] font-bold border-t border-[#E5DFD3] pt-1">
                        <span>Tidal Risk (&lt; 2.8m):</span>
                        <span>{scanResult.multi_sensor_validation.elevation_inundation_risk_km2} km²</span>
                      </div>
                      <p className="text-[10px] text-[#948B7D] italic pt-1 border-t border-[#E5DFD3] font-sans">
                        SAR penetrates 82% monsoon clouds where Sentinel-2 optical is blocked.
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="absolute top-20 left-5 z-20 pointer-events-auto">
              <button
                onClick={() => {
                  setShowIntelPanel(true);
                  setIntelExpanded(true);
                }}
                className="glass-panel-light px-3 py-1.5 rounded-xl text-xs font-semibold text-[#201D1A] flex items-center gap-1.5 shadow-soft border border-[#E5DFD3] hover:border-[#0891B2] transition-all bg-white/95 cursor-pointer"
                title="Show Environmental Intel (Weather & STAC DEM)"
              >
                <CloudSun className="w-3.5 h-3.5 text-[#0891B2]" />
                <span>Show Intel</span>
              </button>
            </div>
          )
        )}

        {/* Hover Coordinate Probe HUD (Bottom Left) */}
        {showProbe && (
          <div className="absolute bottom-4 left-4 z-20 pointer-events-auto max-w-[calc(100%-300px)]">
            <div className="glass-panel-light px-3.5 py-2 rounded-2xl text-xs font-mono text-[#201D1A] flex items-center gap-3 shadow-float border border-[#E5DFD3] bg-white/95">
              <div className="flex items-center gap-1.5 text-[#E65100] font-bold shrink-0">
                <Crosshair className="w-3.5 h-3.5" />
                <span>RADAR PROBE</span>
              </div>
              {probeData ? (
                <div className="flex items-center gap-2.5 tabular-nums text-xs overflow-x-auto whitespace-nowrap">
                  <span>{probeData.lat.toFixed(4)}°N, {probeData.lon.toFixed(4)}°E</span>
                  <span className="text-[#948B7D]">·</span>
                  <span className="text-[#E65100] font-bold">
                    γ⁰: {probeData.gamma0Db.toFixed(1)} dB
                  </span>
                  <span className="text-[#948B7D]">·</span>
                  <span className={probeData.deltaGamma0Db < 0 ? 'text-[#0891B2]' : 'text-[#E65100]'}>
                    Δ: {probeData.deltaGamma0Db > 0 ? `+${probeData.deltaGamma0Db.toFixed(1)}` : probeData.deltaGamma0Db.toFixed(1)} dB
                  </span>
                  <span className="text-[#948B7D]">·</span>
                  <span>Coherence: {probeData.coherence.toFixed(2)}</span>
                  {probeData.losMm !== undefined && (
                    <>
                      <span className="text-[#948B7D]">·</span>
                      <span className="text-amber-600 font-bold">
                        LOS: {probeData.losMm > 0 ? `+${probeData.losMm}` : probeData.losMm} mm
                      </span>
                    </>
                  )}
                  {probeData.elevationM !== undefined && (
                    <>
                      <span className="text-[#948B7D]">·</span>
                      <span className="text-emerald-700 font-bold">
                        DEM: {probeData.elevationM} m
                      </span>
                    </>
                  )}
                </div>
              ) : (
                <span className="text-[#696259]">Hover over satellite scene to probe surface response</span>
              )}
              <button
                onClick={() => setShowProbe(false)}
                className="p-1 rounded-lg text-[#696259] hover:text-[#201D1A] transition-colors ml-auto cursor-pointer"
                title="Hide Radar Probe HUD"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* Unified Floating Dynamic Legend & Radar Layer Dock (Bottom Right) */}
        {showLegend ? (
          <div className="absolute bottom-4 right-4 z-20 pointer-events-auto">
            <SarFloatingLegend
              activeLayerId={activeLayerId}
              currentLayer={currentLayer}
              sarOpacity={sarOpacity}
              onOpacityChange={setSarOpacity}
              audienceLens={audienceLens}
              layers={scanResult?.layers}
              onLayerChange={onLayerChange}
              onClose={() => setShowLegend(false)}
            />
          </div>
        ) : (
          <div className="absolute bottom-4 right-4 z-20 pointer-events-auto">
            <button
              onClick={() => setShowLegend(true)}
              className="glass-panel-light px-3.5 py-2 rounded-2xl text-xs font-semibold text-[#201D1A] flex items-center gap-2 shadow-float border border-[#E5DFD3] hover:border-[#E65100] transition-all bg-white/95 cursor-pointer"
              title="Show Radar Color Legend & Layer Dock"
            >
              <Layers className="w-4 h-4 text-[#E65100]" />
              <span className="font-bold">Show Legend</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
