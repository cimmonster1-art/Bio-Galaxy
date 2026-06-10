import React, { useEffect, useMemo, useState } from 'react';
import { Gauge, ListTree, Pause, Play } from 'lucide-react';
import { Scale } from '../types';
import { COSMIC_TIMELINE, eraForScale } from '../data/cosmos';

interface Props {
  scale: Scale;
  onSelectScale: (scale: Scale) => void;
}

type TimelineTab = 'eras' | 'playback';
const SPEEDS = [0.25, 0.5, 1, 1.5, 2, 4, 8] as const;

/** Cosmic-era navigation with an optional, isolated playback scrubber. */
export const CosmicTimeline: React.FC<Props> = ({ scale, onSelectScale }) => {
  const [tab, setTab] = useState<TimelineTab>('eras');
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState<number>(1);
  const active = eraForScale(scale);
  const activeIndex = useMemo(
    () => Math.max(0, COSMIC_TIMELINE.findIndex((era) => era.scale === active?.scale)),
    [active?.scale],
  );

  useEffect(() => {
    if (!playing) return;
    const delay = 2200 / speed;
    const timer = window.setTimeout(() => {
      const nextIndex = activeIndex + 1;
      if (nextIndex >= COSMIC_TIMELINE.length) {
        setPlaying(false);
        return;
      }
      onSelectScale(COSMIC_TIMELINE[nextIndex].scale);
    }, delay);
    return () => window.clearTimeout(timer);
  }, [activeIndex, onSelectScale, playing, speed]);

  const scrubTo = (index: number): void => {
    setPlaying(false);
    onSelectScale(COSMIC_TIMELINE[index].scale);
  };

  return (
    <div className="pointer-events-none absolute inset-x-0 top-16 z-20 flex flex-col items-center px-4">
      <div className="pointer-events-auto panel w-full max-w-3xl rounded-xl p-1.5 shadow-2xl shadow-black/30">
        <div className="mb-1 flex items-center gap-1 border-b border-white/8 px-1 pb-1">
          <button
            type="button"
            onClick={() => setTab('eras')}
            className={`timeline-tab ${tab === 'eras' ? 'timeline-tab-active' : ''}`}
          >
            <ListTree className="h-3.5 w-3.5" /> Eras
          </button>
          <button
            type="button"
            onClick={() => setTab('playback')}
            className={`timeline-tab ${tab === 'playback' ? 'timeline-tab-active' : ''}`}
          >
            <Gauge className="h-3.5 w-3.5" /> Playback
          </button>
        </div>

        {tab === 'eras' ? (
          <ol className="flex items-center justify-between gap-1 overflow-x-auto scroll-thin">
            {COSMIC_TIMELINE.map((era) => {
              const isActive = active?.scale === era.scale;
              return (
                <li key={era.scale} className="shrink-0">
                  <button
                    type="button"
                    onClick={() => onSelectScale(era.scale)}
                    className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[11px] transition ${
                      isActive ? 'bg-cyan-500/15 text-cyan-100' : 'text-slate-400 hover:bg-white/5 hover:text-slate-100'
                    }`}
                  >
                    <span className={`h-1.5 w-1.5 rounded-full ${isActive ? 'bg-cyan-300' : 'bg-slate-600'}`} aria-hidden />
                    <span>{era.label}</span>
                    <span className="font-mono text-[10px] text-slate-500">{era.time}</span>
                  </button>
                </li>
              );
            })}
          </ol>
        ) : (
          <div className="flex flex-col gap-2 px-1 py-1 sm:flex-row sm:items-center">
            <button
              type="button"
              onClick={() => setPlaying((value) => !value)}
              className="grid h-8 w-8 shrink-0 place-items-center rounded-md bg-cyan-500/15 text-cyan-200 transition hover:bg-cyan-500/25"
              aria-label={playing ? 'Pause timeline' : 'Play timeline'}
            >
              {playing ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
            </button>
            <label className="flex min-w-0 flex-1 items-center gap-2">
              <span className="sr-only">Cosmic timeline position</span>
              <input
                className="timeline-range w-full"
                type="range"
                min={0}
                max={COSMIC_TIMELINE.length - 1}
                step={1}
                value={activeIndex}
                onChange={(event) => scrubTo(Number(event.target.value))}
              />
              <span className="w-20 shrink-0 text-right font-mono text-[10px] text-cyan-200">{active?.time}</span>
            </label>
            <label className="flex shrink-0 items-center gap-2 text-[10px] text-slate-400">
              Speed
              <select
                value={speed}
                onChange={(event) => setSpeed(Number(event.target.value))}
                className="rounded-md border border-white/10 bg-[#07101d] px-2 py-1.5 font-mono text-[11px] text-slate-100 outline-none focus:border-cyan-500/50"
              >
                {SPEEDS.map((value) => <option key={value} value={value}>{value}x</option>)}
              </select>
            </label>
          </div>
        )}
      </div>
      {active && <div className="mt-1.5 max-w-md text-center text-[11px] leading-relaxed text-slate-400">{active.detail}</div>}
    </div>
  );
};
