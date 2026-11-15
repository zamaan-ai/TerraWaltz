/**
 * TerraWaltz Floating SAR Radar Color Legend
 * Approachable, dynamic visual guide for non-scientists, students, and managers.
 * Explains what radar colors mean in plain English based on activeLayerId.
 */

import React, { useState } from 'react';
import {
  HelpCircle,
  ChevronDown,
  ChevronUp,
  Info,
  Sliders,
  Sparkles,
  Waves,
  TreePine,
  Layers,
  X,
} from 'lucide-react';
import { ScanResult } from '../services/radarEngine';
import { AudienceLens } from './AudienceLensBar';

export type RadarLayer = ScanResult['layers'][number];

interface SarFloatingLegendProps {
  activeLayerId: string;
  currentLayer?: RadarLayer;
  sarOpacity: number;
  onOpacityChange: (opacity: number) => void;
  audienceLens: AudienceLens;
  layers?: RadarLayer[];
  onLayerChange?: (layerId: string) => void;
  onClose?: () => void;
}

interface LegendContent {
  title: string;
  subtitle: string;
  simpleAnalogy: string;
  items: Array<{
    colorClass: string;
    colorHex?: string;
    gradient?: string;
    label: string;
    meaning: string;
    valueRange: string;
  }>;
  keyTakeaway: string;
}

export const SarFloatingLegend: React.FC<SarFloatingLegendProps> = ({
  activeLayerId,
  currentLayer,
  sarOpacity,
  onOpacityChange,
  audienceLens,
  layers,
  onLayerChange,
  onClose,
}) => {
  const [isExpanded, setIsExpanded] = useState<boolean>(false);
  const [showAnalogy, setShowAnalogy] = useState<boolean>(false);

  // Dynamic definitions matching activeLayerId
  const getLegendData = (): LegendContent => {
    switch (activeLayerId) {
      case 'change_heatmap':
      case 'backscatter_change_db':
        return {
          title: 'Surface Change Heatmap',
          subtitle: 'What shifted between the two 12-day satellite passes',
          simpleAnalogy:
            'Think of radar like a flashlight in the dark: still water reflects light away like a mirror (turns cyan), while water flooded under trees bounces light back twice as bright (turns orange)!',
          items: [
            {
              colorClass: 'bg-[#E65100]',
              colorHex: '#E65100',
              label: 'Electric Orange',
              meaning:
                'Sub-canopy flood / Vegetation bounce. Water gathered under trees or structures, causing microwaves to "double bounce" back bright.',
              valueRange: '+3 to +10 dB increase',
            },
            {
              colorClass: 'bg-[#E5DFD3]',
              colorHex: '#E5DFD3',
              label: 'Warm Sand / Beige',
              meaning:
                'No significant change. Ground structure and moisture remained stable across the 12-day orbital cycle.',
              valueRange: '-2 to +2 dB (baseline)',
            },
            {
              colorClass: 'bg-[#0891B2]',
              colorHex: '#0891B2',
              label: 'Vibrant Cyan / Teal',
              meaning:
                'Newly flooded open water or shoreline retreat. Calm water deflects radar pulses away into space like a mirror.',
              valueRange: '-3 to -10 dB loss',
            },
          ],
          keyTakeaway:
            'Orange = water beneath trees or increased moisture. Cyan = open water submergence or lost vegetation.',
        };

      case 'water_mask':
        return {
          title: 'Surface Water Extent',
          subtitle: 'Automatic Otsu separation of dry land vs. open water',
          simpleAnalogy:
            'Microwaves cannot grip flat water surfaces—the beam bounces off at an angle away from the satellite, letting us map every creek, pond, and flood boundary.',
          items: [
            {
              colorClass: 'bg-[#0891B2]',
              colorHex: '#0891B2',
              label: 'Deep Cyan Blue',
              meaning:
                'Active Open Water. Tidal creeks, flooded polders, and open storm-surge waterways.',
              valueRange: 'Class 1 (Water)',
            },
            {
              colorClass: 'bg-[#FFFFFF] border border-[#E5DFD3]',
              colorHex: '#FFFFFF',
              label: 'Pure Ivory / White',
              meaning:
                'Dry Land & Canopy. Agricultural fields, embankments, mangrove forests, and villages.',
              valueRange: 'Class 0 (Dry Terrain)',
            },
          ],
          keyTakeaway:
            'Blue indicates where water currently stands; ivory marks unaffected elevated ground.',
        };

      case 'phase_fringes':
      case 'phase_fringes_corrected':
        return {
          title: activeLayerId === 'phase_fringes_corrected' ? 'Corrected Phase Fringes (Meteomatics)' : 'Interferometric Phase Fringes (Raw)',
          subtitle: activeLayerId === 'phase_fringes_corrected' ? 'Atmospheric water-vapor noise subtracted · True ground deformation' : 'Rainbow bands measuring millimeter ground motion',
          simpleAnalogy:
            'Like ripples in a pond when two waves meet, these rainbow bands count microscopic physical movement of the ground after earthquakes or fault slips.',
          items: [
            {
              colorClass: 'bg-gradient-to-r from-red-500 via-yellow-400 via-green-400 via-cyan-400 to-purple-500',
              gradient: 'linear-gradient(90deg, #ef4444, #facc15, #4ade80, #22d3ee, #a855f7)',
              label: 'Rainbow Color Cycle',
              meaning:
                'One full rainbow cycle (red → purple → red) equals exactly 12 cm of physical ground shift toward or away from the satellite radar.',
              valueRange: '-π to +π radians (12 cm cycle)',
            },
          ],
          keyTakeaway:
            activeLayerId === 'phase_fringes_corrected'
              ? 'Atmospheric turbulence removed: Tightly packed stripes indicate true fault motion.'
              : 'Tightly packed stripes indicate steep, concentrated earthquake fault displacement.',
        };

      case 'los_displacement':
      case 'los_displacement_corrected':
        return {
          title: activeLayerId === 'los_displacement_corrected' ? 'Corrected LOS Displacement (Meteomatics)' : 'Line-of-Sight Displacement (Raw)',
          subtitle: activeLayerId === 'los_displacement_corrected' ? 'True tectonic ground motion with tropospheric delay eliminated' : 'Directional millimeters of ground uplift or subsidence',
          simpleAnalogy:
            'Shows whether the landscape is swelling upwards like a balloon or sinking down toward sea level.',
          items: [
            {
              colorClass: 'bg-[#E65100]',
              colorHex: '#E65100',
              label: 'Warm Amber / Red',
              meaning:
                'Surface Uplift: Ground pushed upward or toward the satellite line of sight.',
              valueRange: '+5 to +40 mm (Uplift)',
            },
            {
              colorClass: 'bg-[#0891B2]',
              colorHex: '#0891B2',
              label: 'Cool Cyan / Indigo',
              meaning:
                'Ground Subsidence: Terrain sank downward, typical in coastal mud consolidation or groundwater extraction.',
              valueRange: '-5 to -40 mm (Subsidence)',
            },
          ],
          keyTakeaway:
            'Red = ground rose up; blue = ground sank down.',
        };

      case 'coherence_map':
        return {
          title: 'Surface Stability (Coherence)',
          subtitle: 'Consistency of the ground surface between repeat orbits',
          simpleAnalogy:
            'A measure of how "still" the ground stayed. Concrete buildings stay identical; leaves blowing in the wind or moving waves scramble the signal.',
          items: [
            {
              colorClass: 'bg-amber-400',
              colorHex: '#FBBF24',
              label: 'Bright Gold / White',
              meaning:
                'Rock-Solid Stability. Paved roads, stone structures, and dried compact ground remained undisturbed.',
              valueRange: '0.8 to 1.0 (High)',
            },
            {
              colorClass: 'bg-stone-400',
              colorHex: '#A8A29E',
              label: 'Muted Taupe / Gray',
              meaning:
                'Moderate Stability. Farmland crops or natural vegetation with slow natural growth.',
              valueRange: '0.4 to 0.7 (Moderate)',
            },
            {
              colorClass: 'bg-slate-700',
              colorHex: '#334155',
              label: 'Dark Shadow Slate',
              meaning:
                'Liquid or Shifted Surface. Water currents, heavy storm wind, or flooded mud that scrambled the radar pulse.',
              valueRange: '0.0 to 0.3 (Decohered)',
            },
          ],
          keyTakeaway:
            'Bright spots indicate reliable solid ground; dark regions mean rapid movement or water.',
        };

      case 'copernicus_dem':
        return {
          title: 'Copernicus 30m Global DEM (GLO-30)',
          subtitle: 'Surface elevation via Microsoft Planetary Computer STAC',
          simpleAnalogy:
            'A 3D topographical height map. Blue/green areas are barely above sea level and vulnerable to storm surges; warm yellow/brown areas are elevated high ground.',
          items: [
            {
              colorClass: 'bg-emerald-600',
              colorHex: '#059669',
              label: 'Low Coastal Estuary (< 3m)',
              meaning:
                'Critical Flood Risk: Low-lying intertidal mudflats and mangrove fringes submerged during spring tides.',
              valueRange: '0 to 3 meters elevation',
            },
            {
              colorClass: 'bg-amber-600',
              colorHex: '#d97706',
              label: 'Inland High Ground (> 10m)',
              meaning:
                'Safe Elevation: Natural levees and elevated settlements immune to routine monsoon tides.',
              valueRange: '10 to 50+ meters',
            },
          ],
          keyTakeaway:
            '74% of the Sundarbans islands sit under 2.8m, explaining extreme vulnerability to tidal floods.',
        };

      case 'sentinel2_optical':
        return {
          title: 'Sentinel-2 Level-2A Optical Reflectance (RGB)',
          subtitle: 'Multispectral 10m visual ground truth via Planetary Computer',
          simpleAnalogy:
            'What human eyes would see from space on clear days. Rich dark green represents dense mangrove foliage; brown marks sediment-laden rivers.',
          items: [
            {
              colorClass: 'bg-emerald-800',
              colorHex: '#064e3b',
              label: 'Mangrove Forest Foliage',
              meaning:
                'Healthy canopy leaves reflecting green/NIR light. However, optical sensors cannot see water standing beneath this canopy.',
              valueRange: 'True Color RGB Band 4, 3, 2',
            },
            {
              colorClass: 'bg-amber-200',
              colorHex: '#fef3c7',
              label: 'Monsoon Cloud Cover',
              meaning:
                'Cloud Obstruction: Optical satellites are 82% blinded during monsoon season, proving why NISAR SAR is indispensable.',
              valueRange: '23.1% to 85% Cloud Cover',
            },
          ],
          keyTakeaway:
            'Compare with NISAR L-band SAR to see through the clouds and detect water beneath the trees.',
        };

      case 'backscatter_db':
      default:
        return {
          title: 'Radar Echo Strength (Calibrated γ⁰)',
          subtitle: 'How intensely the ground bounces microwaves back to space',
          simpleAnalogy:
            'Smooth surfaces (water) reflect radar away like a glass table. Rough or vertical surfaces (trees, houses) reflect it right back like a bicycle reflector.',
          items: [
            {
              colorClass: 'bg-[#201D1A]',
              colorHex: '#201D1A',
              label: 'Dark Charcoal / Black',
              meaning:
                'Smooth Water & Flat Runways. Radar energy bounces off forward into space; almost zero echo returns.',
              valueRange: '-28 to -22 dB (Low Echo)',
            },
            {
              colorClass: 'bg-[#8F877C]',
              colorHex: '#8F877C',
              label: 'Muted Taupe / Gray',
              meaning:
                'Agricultural Land & Mudflats. Diffuse surface roughness scattering a fraction of energy back.',
              valueRange: '-18 to -12 dB (Moderate)',
            },
            {
              colorClass: 'bg-[#FFFFFF] border border-[#E5DFD3]',
              colorHex: '#FFFFFF',
              label: 'Bright White',
              meaning:
                'Dense Mangrove Roots & Settlements. Corner reflector geometry bounces almost all microwave power back to the satellite.',
              valueRange: '-6 to 0 dB (Bright Echo)',
            },
          ],
          keyTakeaway:
            'Dark = flat water; Gray = soil/grass; White = dense forest trunks or buildings.',
        };
    }
  };

  const legend = getLegendData();

  return (
    <div className="glass-panel-light rounded-2xl text-xs text-[#201D1A] shadow-float w-76 sm:w-80 border border-[#E5DFD3] overflow-hidden transition-all duration-200 bg-white/95 backdrop-blur-md max-h-[min(380px,50vh)] flex flex-col">
      {/* Integrated Layer Switcher */}
      {layers && layers.length > 0 && onLayerChange && isExpanded && (
        <div className="p-2.5 bg-[#FDFCF9] border-b border-[#E5DFD3] flex items-center gap-2">
          <Layers className="w-4 h-4 text-[#E65100] shrink-0" />
          <select
            value={activeLayerId}
            onChange={(e) => onLayerChange(e.target.value)}
            aria-label="Active Radar Layer"
            className="flex-1 text-xs font-bold bg-white border border-[#E5DFD3] rounded-xl px-2.5 py-1.5 text-[#201D1A] focus:outline-none focus:border-[#E65100] cursor-pointer shadow-2xs truncate"
          >
            {layers.map((l) => (
              <option key={l.id} value={l.id}>
                {l.name}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Header Bar */}
      <div className="p-3 flex items-center justify-between border-b border-[#E5DFD3] bg-[#FAF8F5]">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-2.5 h-2.5 rounded-full bg-[#E65100] shrink-0" />
          <div className="min-w-0">
            <h4 className="font-bold text-xs text-[#201D1A] tracking-tight truncate">
              {legend.title}
            </h4>
            <p className="text-[10px] text-[#696259] truncate">
              {legend.subtitle}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <button
            onClick={() => setShowAnalogy(!showAnalogy)}
            className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
              showAnalogy
                ? 'bg-[#E65100]/15 text-[#E65100]'
                : 'text-[#696259] hover:text-[#201D1A] hover:bg-[#F0ECE1]'
            }`}
            title="Non-Scientist Plain English Analogy"
          >
            <HelpCircle className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1.5 rounded-lg text-[#696259] hover:text-[#201D1A] hover:bg-[#F0ECE1] transition-colors cursor-pointer"
            title={isExpanded ? 'Collapse Legend' : 'Expand Legend'}
          >
            {isExpanded ? (
              <ChevronDown className="w-4 h-4" />
            ) : (
              <ChevronUp className="w-4 h-4" />
            )}
          </button>

          {onClose && (
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-[#696259] hover:text-[#201D1A] hover:bg-[#F0ECE1] transition-colors cursor-pointer"
              title="Close Legend Card"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="p-3 space-y-2.5 bg-white/80 overflow-y-auto flex-1">
          {/* Everyday Analogy Callout (when toggled or in student/manager mode) */}
          {(showAnalogy || audienceLens === 'student') && (
            <div className="p-2.5 rounded-xl bg-[#F7F5F0] border border-[#E5DFD3] text-[11px] text-[#201D1A] leading-relaxed flex items-start gap-2">
              <Sparkles className="w-4 h-4 text-[#E65100] shrink-0 mt-0.5" />
              <div>
                <span className="font-bold block text-[10px] uppercase text-[#E65100] font-mono tracking-wider">
                  Plain-Language Concept:
                </span>
                <span>{legend.simpleAnalogy}</span>
              </div>
            </div>
          )}

          {/* Color Breakdown List */}
          <div className="space-y-2">
            {legend.items.map((item, idx) => (
              <div
                key={idx}
                className="flex items-start gap-2.5 p-2 rounded-xl bg-[#FAF8F5] border border-[#E5DFD3]/70"
              >
                {/* Visual Swatch */}
                <div
                  className={`w-4 h-4 rounded-md shrink-0 mt-0.5 shadow-xs ${item.colorClass}`}
                  style={item.gradient ? { background: item.gradient } : undefined}
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1 mb-0.5">
                    <span className="font-bold text-[11px] text-[#201D1A]">
                      {item.label}
                    </span>
                    <span className="text-[10px] font-mono text-[#696259] shrink-0">
                      {item.valueRange}
                    </span>
                  </div>
                  <p className="text-[11px] text-[#696259] leading-snug">
                    {item.meaning}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Key Rule of Thumb */}
          <div className="px-2.5 py-1.5 rounded-lg bg-[#FAF8F5] border border-[#E5DFD3] text-[10px] text-[#696259] font-medium flex items-center gap-1.5">
            <Info className="w-3.5 h-3.5 text-[#E65100] shrink-0" />
            <span>{legend.keyTakeaway}</span>
          </div>

          {/* Layer Opacity Slider */}
          <div className="pt-2 border-t border-[#E5DFD3] flex items-center justify-between text-[11px] font-mono text-[#696259]">
            <div className="flex items-center gap-1.5">
              <Sliders className="w-3.5 h-3.5 text-[#E65100]" />
              <span className="font-semibold">Layer Opacity:</span>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="range"
                min="0.1"
                max="1.0"
                step="0.05"
                value={sarOpacity}
                onChange={(e) => onOpacityChange(parseFloat(e.target.value))}
                className="w-20 accent-[#E65100] cursor-pointer"
              />
              <span className="tabular-nums font-bold text-[#201D1A] min-w-[28px] text-right">
                {Math.round(sarOpacity * 100)}%
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Collapsed Pill Summary */}
      {!isExpanded && (
        <div
          onClick={() => setIsExpanded(true)}
          className="p-2.5 flex items-center justify-between text-[11px] text-[#696259] cursor-pointer hover:bg-[#FAF8F5] transition-colors"
        >
          <div className="flex items-center gap-2 truncate">
            <div className="flex -space-x-1 shrink-0">
              {legend.items.slice(0, 3).map((item, i) => (
                <div
                  key={i}
                  className={`w-3 h-3 rounded-full border border-white ${item.colorClass}`}
                  style={item.gradient ? { background: item.gradient } : undefined}
                />
              ))}
            </div>
            <span className="truncate font-bold text-[#201D1A]">
              {legend.title}
            </span>
            <span className="text-[10px] font-mono text-[#E65100] bg-[#E65100]/10 px-1.5 py-0.5 rounded font-semibold shrink-0">
              {Math.round(sarOpacity * 100)}%
            </span>
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsExpanded(true);
            }}
            className="text-[10px] font-bold text-[#E65100] flex items-center gap-1 cursor-pointer ml-2 shrink-0 hover:underline"
          >
            <span>Legend</span>
            <ChevronUp className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
};
