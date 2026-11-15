/**
 * TerraWaltz Top Bar Navigation
 * Warm Sand / Beige Aesthetic with high-contrast readable typography
 * and direct toggle between 3D Spatial Orbit & 2D GIS Map.
 */

import React from 'react';
import { Radio, Activity, BookOpen, Clock, Cpu, Cloud, Sparkles, Globe, Layers, FileText } from 'lucide-react';

export type ActiveTab = 'gis' | 'globe3d' | 'story' | 'timeseries' | 'math' | 'cloud';

interface HeaderProps {
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
  onRunScanClick: () => void;
  isScanning?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  onTabChange,
  onRunScanClick,
  isScanning = false,
}) => {
  return (
    <header className="h-20 px-8 bg-[#FFFFFF] border-b border-[#E5DFD3] flex items-center justify-between gap-8 shrink-0 z-30 select-none shadow-sm">
      {/* Zone 1: Brand Wordmark */}
      <div className="flex items-center gap-3.5 shrink-0">
        <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-[#F7F5F0] border border-[#E5DFD3]">
          <Radio className="w-5 h-5 text-[#E65100]" />
        </div>
        <div className="flex flex-col">
          <span className="text-xl font-bold tracking-tight text-[#201D1A] font-['Plus_Jakarta_Sans'] whitespace-nowrap">
            TerraWaltz
          </span>
          <span className="text-[11px] text-[#696259] font-medium tracking-wide">
            NASA–ISRO NISAR Radar Engine
          </span>
        </div>
      </div>

      {/* Zone 2: Spacious, Clean Navigation Links */}
      <nav className="hidden lg:flex items-center gap-8 text-sm font-medium text-[#696259]">
        <button
          onClick={() => onTabChange('globe3d')}
          className={`flex items-center gap-2 py-2 transition-all whitespace-nowrap hover:text-[#201D1A] cursor-pointer ${
            activeTab === 'globe3d'
              ? 'text-[#E65100] border-b-2 border-[#E65100] font-bold'
              : ''
          }`}
        >
          <Globe className="w-4 h-4 text-[#E65100]" />
          <span>3D Spatial Orbit</span>
        </button>

        <button
          onClick={() => onTabChange('gis')}
          className={`flex items-center gap-2 py-2 transition-all whitespace-nowrap hover:text-[#201D1A] cursor-pointer ${
            activeTab === 'gis'
              ? 'text-[#E65100] border-b-2 border-[#E65100] font-bold'
              : ''
          }`}
        >
          <Layers className="w-4 h-4 text-[#E65100]" />
          <span>2D GIS Map</span>
        </button>

        <button
          onClick={() => onTabChange('story')}
          className={`flex items-center gap-2 py-2 transition-all whitespace-nowrap hover:text-[#201D1A] cursor-pointer ${
            activeTab === 'story'
              ? 'text-[#E65100] border-b-2 border-[#E65100] font-bold'
              : ''
          }`}
        >
          <BookOpen className="w-4 h-4" />
          <span>Story Chapters</span>
        </button>

        <button
          onClick={() => onTabChange('timeseries')}
          className={`flex items-center gap-2 py-2 transition-all whitespace-nowrap hover:text-[#201D1A] cursor-pointer ${
            activeTab === 'timeseries'
              ? 'text-[#E65100] border-b-2 border-[#E65100] font-bold'
              : ''
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>12-Day Cycles</span>
        </button>

        <button
          onClick={() => onTabChange('math')}
          className={`flex items-center gap-2 py-2 transition-all whitespace-nowrap hover:text-[#201D1A] cursor-pointer ${
            activeTab === 'math'
              ? 'text-[#E65100] border-b-2 border-[#E65100] font-bold'
              : ''
          }`}
        >
          <Cpu className="w-4 h-4" />
          <span>Physics Lab</span>
        </button>

        <button
          onClick={() => onTabChange('cloud')}
          className={`flex items-center gap-2 py-2 transition-all whitespace-nowrap hover:text-[#201D1A] cursor-pointer ${
            activeTab === 'cloud'
              ? 'text-[#E65100] border-b-2 border-[#E65100] font-bold'
              : ''
          }`}
        >
          <Cloud className="w-4 h-4" />
          <span>API & Cloud</span>
        </button>
      </nav>

      {/* Zone 3: Action CTA */}
      <div className="flex items-center gap-2.5 shrink-0">
        <a
          href="/TERRAWALTZ_MASTER_DOSSIER.pdf"
          target="_blank"
          rel="noopener noreferrer"
          className="px-3 py-2 text-xs font-semibold text-[#57534E] hover:text-[#201D1A] bg-[#F7F5F0] hover:bg-[#EFECE6] border border-[#E5DFD3] rounded-xl transition-all cursor-pointer flex items-center gap-1.5"
          title="Open Master Scientific Dossier & Presentation Speech (PDF)"
        >
          <FileText className="w-3.5 h-3.5 text-[#E65100]" />
          <span className="hidden xl:inline">PDF Dossier</span>
        </a>

        <a
          href="/presentation.html"
          target="_blank"
          rel="noopener noreferrer"
          className="px-3 py-2 text-xs font-semibold text-[#57534E] hover:text-[#201D1A] bg-[#F7F5F0] hover:bg-[#EFECE6] border border-[#E5DFD3] rounded-xl transition-all cursor-pointer flex items-center gap-1.5"
          title="Open Interactive Animated Slide Deck"
        >
          <span>📽️</span>
          <span className="hidden xl:inline">Slide Deck</span>
        </a>

        <button
          onClick={onRunScanClick}
          disabled={isScanning}
          className="relative group px-5 py-2.5 text-xs font-bold tracking-wide uppercase text-white bg-[#E65100] rounded-xl shadow-orange-glow transition-all duration-200 hover:scale-[1.03] active:scale-[0.98] cursor-pointer flex items-center gap-2 disabled:opacity-75"
        >
          {isScanning ? (
            <>
              <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              <span>Scanning Passes...</span>
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4" />
              <span>Run AI Radar Scan</span>
            </>
          )}
        </button>
      </div>
    </header>
  );
};
