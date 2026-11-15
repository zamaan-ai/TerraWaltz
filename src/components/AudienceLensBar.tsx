/**
 * TerraWaltz Audience Lens Bar
 * Warm Beige Aesthetic with student & manager friendly translations.
 */

import React from 'react';
import { Microscope, Briefcase, GraduationCap, Users, Sparkles } from 'lucide-react';

export type AudienceLens = 'student' | 'manager' | 'scientist' | 'public';

interface AudienceLensBarProps {
  currentLens: AudienceLens;
  onLensChange: (lens: AudienceLens) => void;
}

export const LENS_DESCRIPTIONS: Record<
  AudienceLens,
  {
    title: string;
    targetAudience: string;
    focus: string;
    radarConceptExplained: string;
  }
> = {
  student: {
    title: 'Student & Learning Guide',
    targetAudience: 'Schools, Colleges & Curious Learners',
    focus: 'Demystifying radar microwave pulses vs sunlight, why water looks dark like a mirror, and how trees bounce back energy.',
    radarConceptExplained: 'Radar sends microwave pulses that pierce through thick clouds. Calm water reflects the beam away like a mirror, so it looks dark. Trees bounce energy in all directions, so they look bright!',
  },
  manager: {
    title: 'Coastal Manager & Decision Maker',
    targetAudience: 'District Planners, Disaster Authorities & NGOs',
    focus: 'Actionable territory metrics, flooded hectares, embankment risk zones, and confidence levels for immediate planning.',
    radarConceptExplained: 'Direct risk metrics: Water expanded across +7.7 km² of low-lying islands. High confidence rating. Earthen dyke inspections recommended along western mudflats.',
  },
  scientist: {
    title: 'Scientific Research & Geodesy',
    targetAudience: 'Remote Sensing Specialists & Geoscientists',
    focus: 'Unwrapped interferometric phase, Cramér-Rao variance bounds, gamma-zero linear power conversions, and LOS look-vectors.',
    radarConceptExplained: 'Backscatter temporal ratio Δγ⁰ = 10 log10(P2/P1) computed via linear-power averaging. Single-geometry LOS displacement projected along 40° incidence look vector.',
  },
  public: {
    title: 'Community & General Public',
    targetAudience: 'Local Residents & Citizens',
    focus: 'Clear, honest, non-alarmist stories about how the delta naturally changes with tides, storms, and seasons.',
    radarConceptExplained: 'Recent satellite radar passes show water temporarily covering island edges during peak high tides. This tracks normal seasonal monsoon rhythms.',
  },
};

export const AudienceLensBar: React.FC<AudienceLensBarProps> = ({
  currentLens,
  onLensChange,
}) => {
  const meta = LENS_DESCRIPTIONS[currentLens];

  return (
    <div className="bg-[#FAF8F5] border-b border-[#E5DFD3] px-8 py-3.5 flex flex-wrap items-center justify-between gap-4 text-xs select-none shadow-2xs">
      <div className="flex items-center gap-3">
        <span className="text-[#696259] font-bold uppercase tracking-wider text-[11px]">
          Reading Mode:
        </span>
        <div className="inline-flex rounded-xl bg-white p-1 border border-[#E5DFD3] shadow-xs">
          <button
            onClick={() => onLensChange('student')}
            className={`px-3.5 py-1.5 rounded-lg font-semibold transition-all flex items-center gap-2 cursor-pointer ${
              currentLens === 'student'
                ? 'bg-[#E65100] text-white shadow-xs'
                : 'text-[#696259] hover:text-[#201D1A] hover:bg-[#F7F5F0]'
            }`}
          >
            <GraduationCap className="w-4 h-4" />
            <span>Student</span>
          </button>

          <button
            onClick={() => onLensChange('manager')}
            className={`px-3.5 py-1.5 rounded-lg font-semibold transition-all flex items-center gap-2 cursor-pointer ${
              currentLens === 'manager'
                ? 'bg-[#E65100] text-white shadow-xs'
                : 'text-[#696259] hover:text-[#201D1A] hover:bg-[#F7F5F0]'
            }`}
          >
            <Briefcase className="w-4 h-4" />
            <span>Manager</span>
          </button>

          <button
            onClick={() => onLensChange('scientist')}
            className={`px-3.5 py-1.5 rounded-lg font-semibold transition-all flex items-center gap-2 cursor-pointer ${
              currentLens === 'scientist'
                ? 'bg-[#E65100] text-white shadow-xs'
                : 'text-[#696259] hover:text-[#201D1A] hover:bg-[#F7F5F0]'
            }`}
          >
            <Microscope className="w-4 h-4" />
            <span>Scientist</span>
          </button>

          <button
            onClick={() => onLensChange('public')}
            className={`px-3.5 py-1.5 rounded-lg font-semibold transition-all flex items-center gap-2 cursor-pointer ${
              currentLens === 'public'
                ? 'bg-[#E65100] text-white shadow-xs'
                : 'text-[#696259] hover:text-[#201D1A] hover:bg-[#F7F5F0]'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Public</span>
          </button>
        </div>
      </div>

      <div className="flex items-center gap-2.5 text-[#696259] max-w-2xl bg-white px-3.5 py-1.5 rounded-xl border border-[#E5DFD3] shadow-2xs">
        <Sparkles className="w-3.5 h-3.5 text-[#E65100] shrink-0" />
        <span className="font-bold text-[#201D1A] shrink-0">{meta.title}:</span>
        <span className="truncate text-xs">{meta.focus}</span>
      </div>
    </div>
  );
};
