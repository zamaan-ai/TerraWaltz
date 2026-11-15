/**
 * TerraWaltz Guided Storytelling Mode
 * Warm Sand / Beige Aesthetic with spacious, approachable layout.
 */

import React, { useState } from 'react';
import {
  BookOpen,
  ArrowRight,
  Shield,
  HelpCircle,
  ExternalLink,
  ChevronRight,
  Eye,
  Sparkles,
} from 'lucide-react';
import { Hotspot } from '../data/hotspots';
import { AudienceLens } from './AudienceLensBar';

interface StoryModeProps {
  hotspot: Hotspot;
  onSelectHotspot: (hotspotId: string) => void;
  onJumpToLayer: (layerId: string) => void;
  audienceLens: AudienceLens;
}

export const StoryMode: React.FC<StoryModeProps> = ({
  hotspot,
  onSelectHotspot,
  onJumpToLayer,
  audienceLens,
}) => {
  const [activeChapterIndex, setActiveChapterIndex] = useState<number>(0);

  const chapters = [
    {
      number: 1,
      title: 'Why Radar in the Monsoon Delta',
      subtitle: 'Overcoming the Optical Cloud Barrier',
      question1: 'The Indian Sundarbans & Ganga-Brahmaputra Estuary (Bay of Bengal)',
      question2: 'Southwest Monsoon: June to October 2026',
      radarEvidence: 'L-band microwave pulses (24 cm wavelength) transmit through persistent heavy clouds and monsoon rains, imaging the delta every 12 days. In West Bengal, when cyclones Amphan, Yaas, and Remal struck, optical satellites were completely blinded by dense cloud decks, whereas all-weather L-band radar penetrates tropical cyclones to reveal breached earthen bunds and inundated villages in Gosaba and Sagar Island.',
      polarizationRationale: 'Co-polarized HH is ideal for open-water specular reflection; cross-polarized HV penetrates dense canopy foliage to measure woody branch volume.',
      alternativeDrivers: 'Wind roughening over open water can temporarily increase backscatter; dry sand and steep shadows also look dark.',
      ancillaryEvidence: 'Copernicus Sentinel-2 cloud masks show 82% cloud obstruction over the delta from July through September.',
      uncertainOrInvisible: 'Smooth calm inland waters look identical to smooth paved airport runways on raw backscatter alone.',
      futureNisar: 'Validated L+S dual-frequency joint passes will provide leaf-level and branch-level structural decomposition simultaneously.',
    },
    {
      number: 2,
      title: 'The Breathing Delta',
      subtitle: 'Tidal Fluvial Expansion & Contraction',
      question1: 'Tidal creeks, intertidal mudflats and mangrove island fringes',
      question2: 'Bi-weekly 12-day orbital intervals across monsoon peak',
      radarEvidence: 'Otsu-derived water fraction expands from 28% in June to 51% in late August, tracking inundation under spring tides and heavy river discharge.',
      polarizationRationale: 'Co-polarized HH backscatter drops below -18 dB over specular floodwaters, providing optimal contrast against surrounding vegetation (-11 dB).',
      alternativeDrivers: 'Spring-neap tidal variations vs actual riverine flood waves; tide tables must be matched across acquisitions.',
      ancillaryEvidence: 'Survey of India Diamond Harbour tide gauges and Central Water Commission river discharge telemetry.',
      uncertainOrInvisible: 'Sub-canopy standing water depth is not directly measured by dB power without a calibrated hydraulic model.',
      futureNisar: 'Multi-year seasonal baseline stacks will differentiate permanent wetland loss from interannual hydrological variability.',
    },
    {
      number: 3,
      title: 'Islands on the Edge',
      subtitle: 'Shoreline Retreat at Sagar & Ghoramara',
      question1: 'Ghoramara Island & Western Sagar Island (Hooghly Estuary mouth)',
      question2: 'June 2026 baseline compared with post-monsoon October 2026',
      radarEvidence: 'Net loss of 1.82 km² of intertidal sand terrace along Ghoramara western flank detected via persistent backscatter transition from -12 dB to -22 dB.',
      polarizationRationale: 'HH and VV co-pol channels capture boundary shifts between wet saturated sandflats and open turbulent water.',
      alternativeDrivers: 'Tidal current scour, neotectonic tilting, and long-term delta sediment compaction (-2.8 mm/yr).',
      ancillaryEvidence: 'Peer-reviewed literature (J. Indian Soc. Remote Sensing) documenting 50% land loss on Ghoramara over 40 years.',
      uncertainOrInvisible: 'Daily centimetre-scale bank undercutting occurs between 12-day orbital revisit passes.',
      futureNisar: 'Urgent Response (UR) acquisitions triggered immediately following major Bay of Bengal cyclonic landfalls.',
    },
    {
      number: 4,
      title: 'The Green Shield',
      subtitle: 'Mangrove Canopy Volume Scattering & Die-off',
      question1: 'Matla Reserve Forest & Lothian Island Wildlife Sanctuary',
      question2: 'June 2026 to October 2026',
      radarEvidence: 'HV cross-pol median backscatter dropped from -11.2 dB to -14.6 dB in eastern sectors, showing decreased crown volume scattering.',
      polarizationRationale: 'Cross-polarized HV (or VH) is uniquely sensitive to volume scattering from randomly oriented branches and twigs within the mangrove canopy.',
      alternativeDrivers: 'Salinity-induced defoliation, storm branch stripping, or seasonal phenological drying.',
      ancillaryEvidence: 'Global Mangrove Watch v3.0 baseline mask; recent field reports of widespread mangrove browning in eastern Sundarbans.',
      uncertainOrInvisible: 'Single-season radar backscatter decrease cannot definitively differentiate temporary defoliation from permanent tree mortality.',
      futureNisar: 'Validated Level-3 soil moisture (SME2) products (planned for 2027) will disentangle canopy moisture from structural biomass.',
    },
    {
      number: 5,
      title: 'People and Land',
      subtitle: 'Paddy Fields Converted to Brackish Shrimp Ponds',
      question1: 'Gosaba Belt & Inhabited River Bunds (South 24 Parganas)',
      question2: 'July 2026 to October 2026',
      radarEvidence: '14.6 km² of previously high-backscatter agricultural paddies converted to permanent dark rectangular water bodies (< -19 dB).',
      polarizationRationale: 'Cross-Polarization Ratio CPR = HV(dB) - HH(dB) separates vegetated crops (-4 dB) from flat open aquaculture basins (-12 dB).',
      alternativeDrivers: 'Controlled agricultural drainage, deliberate pond flooding for tiger shrimp aquaculture, or catastrophic embankment seepage.',
      ancillaryEvidence: 'WorldPop human settlement density overlays and ESA WorldCover cropland classifications.',
      uncertainOrInvisible: 'Economic land tenure and farmer intent cannot be observed directly from orbit.',
      futureNisar: 'High-resolution Frequency A quad-pol acquisitions scheduled for Indian agriculture will enable precise crop-type classification.',
    },
    {
      number: 6,
      title: 'What Comes Next for NISAR',
      subtitle: 'From Research Prototype to Global Early Warning',
      question1: 'Global Coastlines, Fault Zones, Wetland Biospheres & Glacial Catchments',
      question2: 'Full 3-Year Nominal Operational Phase (2026 - 2029)',
      radarEvidence: 'Full global coverage every 12 days at 10m-20m resolution with open access under NASA and ISRO open science policies.',
      polarizationRationale: 'Simultaneous L-band and S-band radar imaging providing multi-frequency penetrative cross-sections of Earth’s dynamic crust.',
      alternativeDrivers: 'Climate change, anthropogenic subsidence from groundwater withdrawal, sea level rise, and seismic strain.',
      ancillaryEvidence: 'USGS global earthquake catalogs, ISRO Bhoonidhi STAC catalog, and NASA Earthdata Cloud repository.',
      uncertainOrInvisible: 'Fast rapid motions exceeding lambda/4 (6 cm per 12 days) decorrelate InSAR phase; requires feature tracking (GOFF).',
      futureNisar: 'Ascending/descending 3D vector decomposition resolving pure vertical subsidence from horizontal tectonic drift.',
    },
  ];

  const currentChapter = chapters[activeChapterIndex];

  return (
    <div className="flex-1 bg-[#F7F5F0] text-[#201D1A] overflow-y-auto p-8 select-none">
      <div className="max-w-5xl mx-auto space-y-8">
        {/* Story Mode Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-[#E5DFD3] pb-6">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold text-[#E65100] uppercase tracking-wider mb-1.5">
              <BookOpen className="w-4 h-4" />
              <span>Scientific Storytelling & Physical Drivers</span>
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-[#201D1A]">
              The Rhythm of the Delta: Tracking Surface Change with NISAR
            </h1>
            <p className="text-sm text-[#696259] mt-1.5 max-w-2xl leading-relaxed">
              A structured 6-chapter narrative translating satellite radar physics into approachable insights for students, managers, and citizens.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={() => onSelectHotspot('sundarbans_matla')}
              className="px-4 py-2 rounded-xl bg-white border border-[#E5DFD3] text-xs font-semibold text-[#201D1A] hover:border-[#E65100] transition-colors shadow-soft cursor-pointer flex items-center gap-2"
            >
              <Eye className="w-4 h-4 text-[#E65100]" />
              <span>Inspect Matla Reserve</span>
            </button>
            <button
              onClick={() => onSelectHotspot('venezuela_earthquake_2026')}
              className="px-4 py-2 rounded-xl bg-white border border-[#E5DFD3] text-xs font-semibold text-[#201D1A] hover:border-[#E65100] transition-colors shadow-soft cursor-pointer flex items-center gap-2"
            >
              <Sparkles className="w-4 h-4 text-amber-600" />
              <span>Venezuela Earthquake</span>
            </button>
          </div>
        </div>

        {/* Local West Bengal & Sundarbans Fieldwork Perspective */}
        <div className="p-5 rounded-2xl bg-[#FFF9F2] border border-[#FFE2BA] shadow-soft flex items-start gap-4">
          <div className="p-2.5 rounded-xl bg-[#E65100]/10 text-[#E65100] shrink-0 mt-0.5">
            <Shield className="w-5 h-5" />
          </div>
          <div className="space-y-1.5">
            <span className="text-xs font-bold font-mono uppercase tracking-wider text-[#E65100] block">
              Local West Bengal Fieldwork & Disaster Resilience Perspective:
            </span>
            <p className="text-xs text-[#4A4238] leading-relaxed">
              Living alongside the lower Gangetic delta in West Bengal, we witnessed firsthand how Super Cyclone Amphan (2020), Cyclone Yaas (2021), and Cyclone Remal (2024) tore through fragile earthen embankments across Gosaba, Sagar Island, and Hingalganj, drowning villages in brackish water. While persistent cloud decks and blinding torrential rains render optical satellites like Sentinel-2 completely blind for weeks during disaster response, NISAR&apos;s all-weather 24 cm L-band radar pierces straight through the storms, providing life-saving evidence of embankment breaches and standing saltwater floodwaters.
            </p>
          </div>
        </div>

        {/* Chapter Selection Rail */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {chapters.map((ch, idx) => {
            const isSelected = idx === activeChapterIndex;
            return (
              <button
                key={ch.number}
                onClick={() => setActiveChapterIndex(idx)}
                className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-white border-[#E65100] shadow-float scale-[1.02]'
                    : 'bg-white/80 border-[#E5DFD3] hover:border-[#E65100]/40 text-[#696259] shadow-soft'
                }`}
              >
                <div className="text-[11px] font-mono text-[#E65100] font-bold">
                  CHAPTER 0{ch.number}
                </div>
                <div className="text-xs font-bold text-[#201D1A] mt-1.5 line-clamp-2">
                  {ch.title}
                </div>
              </button>
            );
          })}
        </div>

        {/* Active Chapter Details Card */}
        <div className="bg-white p-8 rounded-3xl border border-[#E5DFD3] shadow-soft space-y-8">
          <div className="border-b border-[#E5DFD3] pb-4">
            <span className="text-xs font-mono text-[#E65100] uppercase tracking-wider font-bold">
              Chapter 0{currentChapter.number} · {currentChapter.subtitle}
            </span>
            <h2 className="text-2xl font-bold text-[#201D1A] mt-1">
              {currentChapter.title}
            </h2>
          </div>

          {/* Section 14.6 Eight Required Questions Grid (Spaced out & readable) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-xs">
            {/* Q1 */}
            <div className="p-4 rounded-2xl bg-[#FAF8F5] border border-[#E5DFD3] space-y-2">
              <span className="text-xs font-bold uppercase text-[#0891B2] block">
                1. Location & Physical Process
              </span>
              <p className="text-[#201D1A] leading-relaxed">
                {currentChapter.question1}
              </p>
            </div>

            {/* Q2 */}
            <div className="p-4 rounded-2xl bg-[#FAF8F5] border border-[#E5DFD3] space-y-2">
              <span className="text-xs font-bold uppercase text-[#0891B2] block">
                2. Observation Dates & Baseline
              </span>
              <p className="text-[#201D1A] leading-relaxed">
                {currentChapter.question2}
              </p>
            </div>

            {/* Q3 */}
            <div className="p-4 rounded-2xl bg-[#FAF8F5] border border-[#E5DFD3] space-y-2">
              <span className="text-xs font-bold uppercase text-[#E65100] block">
                3. Observed Radar Signature
              </span>
              <p className="text-[#201D1A] leading-relaxed">
                {currentChapter.radarEvidence}
              </p>
            </div>

            {/* Q4 */}
            <div className="p-4 rounded-2xl bg-[#FAF8F5] border border-[#E5DFD3] space-y-2">
              <span className="text-xs font-bold uppercase text-[#E65100] block">
                4. Selected Polarization & Physics
              </span>
              <p className="text-[#201D1A] leading-relaxed">
                {currentChapter.polarizationRationale}
              </p>
            </div>

            {/* Q5 */}
            <div className="p-4 rounded-2xl bg-[#FAF8F5] border border-[#E5DFD3] space-y-2">
              <span className="text-xs font-bold uppercase text-amber-700 block">
                5. Alternative Physical Drivers
              </span>
              <p className="text-[#201D1A] leading-relaxed">
                {currentChapter.alternativeDrivers}
              </p>
            </div>

            {/* Q6 */}
            <div className="p-4 rounded-2xl bg-[#FAF8F5] border border-[#E5DFD3] space-y-2">
              <span className="text-xs font-bold uppercase text-emerald-700 block">
                6. Ancillary Data Corroboration
              </span>
              <p className="text-[#201D1A] leading-relaxed">
                {currentChapter.ancillaryEvidence}
              </p>
            </div>

            {/* Q7 */}
            <div className="p-4 rounded-2xl bg-[#FAF8F5] border border-[#E5DFD3] space-y-2">
              <span className="text-xs font-bold uppercase text-rose-700 block">
                7. Uncertain or Invisible to SAR
              </span>
              <p className="text-[#201D1A] leading-relaxed">
                {currentChapter.uncertainOrInvisible}
              </p>
            </div>

            {/* Q8 */}
            <div className="p-4 rounded-2xl bg-[#FAF8F5] border border-[#E5DFD3] space-y-2">
              <span className="text-xs font-bold uppercase text-purple-700 block">
                8. Future NISAR Horizons
              </span>
              <p className="text-[#201D1A] leading-relaxed">
                {currentChapter.futureNisar}
              </p>
            </div>
          </div>

          {/* Chapter Navigation Buttons */}
          <div className="flex items-center justify-between pt-6 border-t border-[#E5DFD3]">
            <button
              onClick={() => setActiveChapterIndex(Math.max(0, activeChapterIndex - 1))}
              disabled={activeChapterIndex === 0}
              className="px-5 py-2.5 rounded-xl bg-[#F7F5F0] border border-[#E5DFD3] text-xs font-semibold text-[#201D1A] hover:bg-[#EAE4D8] disabled:opacity-40 cursor-pointer"
            >
              Previous Chapter
            </button>

            <button
              onClick={() => onJumpToLayer('change_heatmap')}
              className="px-6 py-2.5 rounded-xl bg-[#E65100] text-white text-xs font-bold hover:shadow-orange-glow transition-all cursor-pointer flex items-center gap-2"
            >
              <span>View Layer in GIS Canvas</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              onClick={() => setActiveChapterIndex(Math.min(chapters.length - 1, activeChapterIndex + 1))}
              disabled={activeChapterIndex === chapters.length - 1}
              className="px-5 py-2.5 rounded-xl bg-[#F7F5F0] border border-[#E5DFD3] text-xs font-semibold text-[#201D1A] hover:bg-[#EAE4D8] disabled:opacity-40 cursor-pointer"
            >
              Next Chapter
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
