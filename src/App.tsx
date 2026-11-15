/**
 * TerraWaltz — NISAR "Dancing with the SARs" Multi-Scale Fusion Engine
 * Conforms to:
 * - DANCE_IN_STYLE: 70/20/10 color palette (#121418, #1E222A, #F2EFE9, #9E9A90, #FF6B00)
 * - LETS_DANCE_MARK-7: Indian Sundarbans case studies, 12-day cycles, Waltz Mode, Audience Lens
 * - DANCE_WITH_ME_MARK-4: Radar science calculations, Section 15.4 test vectors, three tiers of quantity
 */

import React, { useState, useEffect } from 'react';
import { Header, ActiveTab } from './components/Header';
import { AudienceLensBar, AudienceLens } from './components/AudienceLensBar';
import { SpatialGlobe3D } from './components/SpatialGlobe3D';
import { GisMapCanvas } from './components/GisMapCanvas';
import { QualityAndTiersPanel } from './components/QualityAndTiersPanel';
import { TimeSlider } from './components/TimeSlider';
import { StoryMode } from './components/StoryMode';
import { TimeSeriesCyclesView } from './components/TimeSeriesCyclesView';
import { MathPhysicsLab } from './components/MathPhysicsLab';
import { ApiAndCloudDocs } from './components/ApiAndCloudDocs';
import { ScanModal } from './components/ScanModal';
import { HOTSPOTS, Hotspot } from './data/hotspots';
import {
  executeRadarScan,
  generateTimeSeries,
  ScanResult,
  TimeSeriesPoint,
} from './services/radarEngine';

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('globe3d');
  const [audienceLens, setAudienceLens] = useState<AudienceLens>('student');

  // Study Area / Hotspot state
  const [currentHotspot, setCurrentHotspot] = useState<Hotspot>(HOTSPOTS[0]);
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [activeLayerId, setActiveLayerId] = useState<string>('change_heatmap');

  // 12-Day Orbital Cycle Time series & Waltz mode
  const [timeSeries, setTimeSeries] = useState<TimeSeriesPoint[]>([]);
  const [currentCycleIndex, setCurrentCycleIndex] = useState<number>(3); // Initialized to cycle 28 (July 2026)
  const [isWaltzPlaying, setIsWaltzPlaying] = useState<boolean>(false);

  // Scan modal state
  const [isScanModalOpen, setIsScanModalOpen] = useState<boolean>(false);

  // Initialize initial scan for default hotspot
  useEffect(() => {
    loadHotspotAnalysis(currentHotspot);
  }, []);

  const loadHotspotAnalysis = (hotspot: Hotspot) => {
    const result = executeRadarScan({
      bbox: hotspot.bbox,
      start: hotspot.suggestedDates.preEvent,
      end: hotspot.suggestedDates.postEvent,
      workflow: hotspot.recommendedWorkflow,
      band: 'L',
      polarization: hotspot.recommendedPolarization,
      maturity_policy: 'provisional_ok',
      hotspot_id: hotspot.id,
      client_request_id: `init-${hotspot.id}`,
    });

    setScanResult(result);
    // If earthquake, default to phase_fringes, otherwise change_heatmap
    if (hotspot.phenomenon === 'earthquake_insar') {
      setActiveLayerId('phase_fringes');
    } else {
      setActiveLayerId('change_heatmap');
    }

    const series = generateTimeSeries(hotspot.id);
    setTimeSeries(series);
  };

  const handleSelectHotspot = (hotspotId: string) => {
    const target = HOTSPOTS.find((h) => h.id === hotspotId);
    if (!target) return;
    setCurrentHotspot(target);
    loadHotspotAnalysis(target);
  };

  const handleScanCompleted = (newResult: ScanResult) => {
    setScanResult(newResult);
    setActiveTab('gis');
    if (newResult.layers.length > 0) {
      setActiveLayerId(newResult.layers[1]?.id || newResult.layers[0].id);
    }
  };

  return (
    <div className="flex flex-col h-screen w-screen bg-[#F7F5F0] text-[#201D1A] overflow-hidden">
      {/* 1. Header (Top Bar Contract) */}
      <Header
        activeTab={activeTab}
        onTabChange={(tab) => {
          setActiveTab(tab);
          if (isWaltzPlaying && tab !== 'gis') {
            setIsWaltzPlaying(false);
          }
        }}
        onRunScanClick={() => setIsScanModalOpen(true)}
      />

      {/* 2. Audience Lens Bar */}
      <AudienceLensBar
        currentLens={audienceLens}
        onLensChange={setAudienceLens}
      />

      {/* 3. Main Stage Content */}
      <main className="flex-1 flex overflow-hidden relative">
        {/* Tab 1: 3D Spatial Orbit Earth Canvas */}
        {activeTab === 'globe3d' && (
          <SpatialGlobe3D
            hotspots={HOTSPOTS}
            selectedHotspot={currentHotspot}
            onSelectHotspot={handleSelectHotspot}
            onOpenGisView={() => setActiveTab('gis')}
          />
        )}

        {/* Tab 2: 2D GIS Workspace */}
        {activeTab === 'gis' && (
          <div className="flex-1 flex flex-col md:flex-row h-full w-full overflow-hidden">
            {/* GIS Map & Split Comparator Canvas */}
            <div className="flex-1 flex flex-col h-full overflow-hidden">
              <GisMapCanvas
                hotspot={currentHotspot}
                scanResult={scanResult}
                activeLayerId={activeLayerId}
                onLayerChange={setActiveLayerId}
                audienceLens={audienceLens}
                onSelectHotspot={handleSelectHotspot}
                allHotspots={HOTSPOTS}
                onTriggerScan={() => setIsScanModalOpen(true)}
                onOpenGlobe3D={() => setActiveTab('globe3d')}
              />

              {/* 12-Day Orbital Cycle Time Slider & Waltz Mode */}
              <TimeSlider
                series={timeSeries}
                currentCycleIndex={currentCycleIndex}
                onSelectCycle={setCurrentCycleIndex}
                isWaltzPlaying={isWaltzPlaying}
                onToggleWaltz={() => setIsWaltzPlaying(!isWaltzPlaying)}
              />
            </div>

            {/* Right Side: Three Tiers of Quantity & Quality Audit */}
            <div className="w-full md:w-80 lg:w-96 h-64 md:h-full shrink-0 border-l border-[#E5DFD3]">
              <QualityAndTiersPanel
                scanResult={scanResult}
                audienceLens={audienceLens}
              />
            </div>
          </div>
        )}

        {/* Tab 3: Guided Story Chapters */}
        {activeTab === 'story' && (
          <StoryMode
            hotspot={currentHotspot}
            onSelectHotspot={handleSelectHotspot}
            onJumpToLayer={(layerId) => {
              setActiveLayerId(layerId);
              setActiveTab('gis');
            }}
            audienceLens={audienceLens}
          />
        )}

        {/* Tab 4: 12-Day Orbital Cycles */}
        {activeTab === 'timeseries' && (
          <TimeSeriesCyclesView
            series={timeSeries}
            hotspot={currentHotspot}
            currentCycleIndex={currentCycleIndex}
            onSelectCycle={setCurrentCycleIndex}
          />
        )}

        {/* Tab 5: Radar Physics & Math Lab */}
        {activeTab === 'math' && <MathPhysicsLab />}

        {/* Tab 6: Cloud Architecture & API Hub */}
        {activeTab === 'cloud' && <ApiAndCloudDocs scanResult={scanResult} />}
      </main>

      {/* Run AI Radar Scan Modal */}
      <ScanModal
        isOpen={isScanModalOpen}
        onClose={() => setIsScanModalOpen(false)}
        hotspot={currentHotspot}
        onScanComplete={handleScanCompleted}
      />
    </div>
  );
}
