/**
 * TerraWaltz 12-Day Orbital Cycle Time-Slider & Waltz Mode
 * Warm Sand / Beige Aesthetic with spacious, approachable layout.
 */

import React, { useState, useEffect } from 'react';
import { Play, Pause, SkipBack, SkipForward, AlertCircle, Music } from 'lucide-react';
import { TimeSeriesPoint } from '../services/radarEngine';

interface TimeSliderProps {
  series: TimeSeriesPoint[];
  currentCycleIndex: number;
  onSelectCycle: (index: number) => void;
  isWaltzPlaying: boolean;
  onToggleWaltz: () => void;
}

export const TimeSlider: React.FC<TimeSliderProps> = ({
  series,
  currentCycleIndex,
  onSelectCycle,
  isWaltzPlaying,
  onToggleWaltz,
}) => {
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1);

  // Waltz Mode animation ticker
  useEffect(() => {
    if (!isWaltzPlaying || series.length === 0) return;

    const intervalTime = 1600 / playbackSpeed;
    const interval = setInterval(() => {
      onSelectCycle((currentCycleIndex + 1) % series.length);
    }, intervalTime);

    return () => clearInterval(interval);
  }, [isWaltzPlaying, currentCycleIndex, series.length, playbackSpeed, onSelectCycle]);

  const currentPoint = series[currentCycleIndex];

  return (
    <div className="bg-[#FAF8F5] border-t border-[#E5DFD3] px-8 py-4 shrink-0 select-none shadow-2xs">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
        {/* Playback Controls & Waltz Mode */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="flex items-center gap-1.5 bg-white rounded-xl p-1 border border-[#E5DFD3] shadow-soft">
            <button
              onClick={() => onSelectCycle(Math.max(0, currentCycleIndex - 1))}
              disabled={currentCycleIndex === 0}
              className="p-2 text-[#696259] hover:text-[#201D1A] hover:bg-[#F7F5F0] rounded-lg disabled:opacity-30 cursor-pointer transition-colors"
              title="Previous 12-day cycle"
            >
              <SkipBack className="w-4 h-4" />
            </button>

            <button
              onClick={onToggleWaltz}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                isWaltzPlaying
                  ? 'bg-[#E65100] text-white shadow-orange-glow'
                  : 'bg-[#F7F5F0] text-[#201D1A] hover:bg-[#EAE4D8]'
              }`}
              title="Play 12-day orbital time-lapse in rhythm"
            >
              {isWaltzPlaying ? (
                <>
                  <Pause className="w-4 h-4" />
                  <span>Waltz Playing</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 text-[#E65100]" />
                  <span>Waltz Mode</span>
                </>
              )}
            </button>

            <button
              onClick={() => onSelectCycle(Math.min(series.length - 1, currentCycleIndex + 1))}
              disabled={currentCycleIndex === series.length - 1}
              className="p-2 text-[#696259] hover:text-[#201D1A] hover:bg-[#F7F5F0] rounded-lg disabled:opacity-30 cursor-pointer transition-colors"
              title="Next 12-day cycle"
            >
              <SkipForward className="w-4 h-4" />
            </button>
          </div>

          {/* Speed Selector */}
          <div className="hidden sm:flex items-center gap-1 bg-white rounded-xl p-1 border border-[#E5DFD3] text-xs font-mono shadow-soft">
            {[1, 2, 4].map((spd) => (
              <button
                key={spd}
                onClick={() => setPlaybackSpeed(spd)}
                className={`px-2.5 py-1 rounded-lg cursor-pointer transition-all ${
                  playbackSpeed === spd
                    ? 'bg-[#E65100] text-white font-bold'
                    : 'text-[#696259] hover:text-[#201D1A]'
                }`}
              >
                {spd}x
              </button>
            ))}
          </div>
        </div>

        {/* 12-Day Repeat Step Rail */}
        <div className="flex-1 w-full flex flex-col gap-2">
          <div className="flex items-center justify-between text-xs font-mono text-[#696259]">
            <div className="flex items-center gap-2.5">
              <span className="text-[#E65100] font-bold">
                CYCLE {currentPoint?.cycle ?? 25}
              </span>
              <span>·</span>
              <span className="text-[#201D1A] font-semibold">
                {currentPoint?.date ?? '2026-06-17'}
              </span>
              <span>·</span>
              <span>
                {currentPoint?.maturity ?? 'PROVISIONAL'} ({currentPoint?.crid ?? 'P05023'})
              </span>
            </div>

            {currentPoint?.isGap && (
              <div className="flex items-center gap-1.5 text-amber-700 font-semibold bg-amber-50 px-2.5 py-0.5 rounded-md border border-amber-200">
                <AlertCircle className="w-3.5 h-3.5" />
                <span>Known Instrument Gap (27 Jul - 10 Aug)</span>
              </div>
            )}
          </div>

          {/* Stepper buttons rail */}
          <div className="grid grid-cols-13 gap-1.5">
            {series.map((pt, idx) => {
              const isSelected = idx === currentCycleIndex;
              const isGap = pt.isGap;
              const isValidated = pt.maturity === 'VALIDATED';

              return (
                <button
                  key={pt.date}
                  onClick={() => onSelectCycle(idx)}
                  className={`h-8 rounded-xl transition-all cursor-pointer relative flex flex-col items-center justify-center text-[10px] font-mono border ${
                    isSelected
                      ? 'bg-[#E65100] text-white border-[#E65100] shadow-orange-glow z-10'
                      : isGap
                      ? 'bg-amber-100/60 border-amber-300 text-amber-800 cursor-not-allowed'
                      : isValidated
                      ? 'bg-white border-emerald-300 text-emerald-800 hover:border-emerald-500 shadow-2xs'
                      : 'bg-white border-[#E5DFD3] text-[#696259] hover:text-[#201D1A] hover:border-[#E65100]/50 shadow-2xs'
                  }`}
                  title={`${pt.date} · Cycle ${pt.cycle} · ${pt.maturity} (${pt.crid})`}
                >
                  <span className="font-semibold">C{pt.cycle}</span>
                </button>
              );
            })}
          </div>

          <div className="flex items-center justify-between text-[11px] text-[#696259]">
            <span>Monsoon Cycles (PROVISIONAL / P05023)</span>
            <span className="text-amber-700">Permanent Gap: 27 Jul – 10 Aug</span>
            <span className="text-emerald-700 font-semibold">21 Oct+: VALIDATED (P05036)</span>
          </div>
        </div>
      </div>
    </div>
  );
};
