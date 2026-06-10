import React, { useEffect, useMemo, useState } from 'react';
import { Gauge, ListTree, Pause, Play, Sparkles } from 'lucide-react';
import { Scale } from '../types';
import { HISTORY_CHAPTERS } from '../data/history';

interface Props { scale: Scale; onSelectScale: (scale: Scale) => void; }
type TimelineTab = 'eras' | 'playback';
const SPEEDS = [0.25, 0.5, 1, 1.5, 2, 4, 8] as const;

/** Cosmic-era navigation with contextual milestones and isolated playback controls. */
export const CosmicTimeline: React.FC<Props> = ({ scale, onSelectScale }) => {
  const [tab, setTab] = useState<TimelineTab>('eras');
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState<number>(1);
  const active = eraForScale(scale) ?? COSMIC_TIMELINE[0];
  const activeIndex = useMemo(() => Math.max(0, COSMIC_TIMELINE.findIndex((era) => era.scale === active.scale)), [active.scale]);

  useEffect(() => {
    if (!playing) return;
    const timer = window.setTimeout(() => {
      const next = activeIndex + 1;
      if (next >= COSMIC_TIMELINE.length) return setPlaying(false);
      onSelectScale(COSMIC_TIMELINE[next].scale);
    }, 2600 / speed);
    return () => window.clearTimeout(timer);
  }, [activeIndex, onSelectScale, playing, speed]);

  const scrubTo = (index: number): void => { setPlaying(false); onSelectScale(COSMIC_TIMELINE[index].scale); };
  return (
    <div className="pointer-events-none absolute inset-x-0 top-16 z-20 flex flex-col items-center px-4">
      <div className="pointer-events-auto panel w-full max-w-4xl rounded-xl p-2 shadow-2xl shadow-black/30">
        <div className="mb-2 flex items-center justify-between gap-2 border-b border-white/8 px-1 pb-1.5">
          <div className="flex gap-1">
            <button type="button" onClick={() => setTab('eras')} className={`timeline-tab ${tab === 'eras' ? 'timeline-tab-active' : ''}`}><ListTree className="h-3.5 w-3.5" /> Eras</button>
            <button type="button" onClick={() => setTab('playback')} className={`timeline-tab ${tab === 'playback' ? 'timeline-tab-active' : ''}`}><Gauge className="h-3.5 w-3.5" /> Playback</button>
          </div>
          <span className="hidden font-mono text-[9px] uppercase tracking-[.2em] text-slate-500 sm:block">Time before present</span>
        </div>
        {tab === 'eras' ? (
          <div className="grid gap-2 lg:grid-cols-[1.35fr_.9fr]">
            <ol className="grid grid-cols-5 gap-1 overflow-x-auto scroll-thin">
              {COSMIC_TIMELINE.map((era, index) => {
                const isActive = active.scale === era.scale;
                return <li key={era.scale} className="min-w-24"><button type="button" onClick={() => onSelectScale(era.scale)} className={`h-full w-full rounded-lg border px-2 py-2 text-left transition ${isActive ? 'border-cyan-300/35 bg-cyan-500/15 text-cyan-50' : 'border-white/5 bg-white/[.02] text-slate-400 hover:border-white/15 hover:text-slate-100'}`}><span className="mb-2 flex items-center gap-1.5"><span className={`h-1.5 w-1.5 rounded-full ${isActive ? 'bg-cyan-300 shadow-[0_0_8px_#67e8f9]' : 'bg-slate-600'}`} /><span className="font-mono text-[9px] text-slate-500">0{index + 1}</span></span><strong className="block text-[10px] font-medium leading-tight">{era.label}</strong><span className="mt-1 block font-mono text-[9px] text-cyan-200/70">{era.time}</span></button></li>;
              })}
            </ol>
            <div className="rounded-lg border border-white/8 bg-black/20 px-3 py-2.5">
              <div className="mb-1 flex items-center justify-between gap-3"><strong className="text-[12px] text-slate-100">{active.label}</strong><span className="font-mono text-[9px] text-cyan-200">{active.span}</span></div>
              <p className="text-[10px] leading-relaxed text-slate-400">{active.detail}</p>
              <ul className="mt-2 grid gap-1 sm:grid-cols-3 lg:grid-cols-1">{active.milestones.map((milestone) => <li key={milestone} className="flex items-start gap-1.5 text-[9px] leading-snug text-slate-300"><Sparkles className="mt-0.5 h-2.5 w-2.5 shrink-0 text-cyan-300" />{milestone}</li>)}</ul>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-2 px-1 py-1 sm:flex-row sm:items-center"><button type="button" onClick={() => setPlaying((v) => !v)} className="grid h-8 w-8 shrink-0 place-items-center rounded-md bg-cyan-500/15 text-cyan-200" aria-label={playing ? 'Pause timeline' : 'Play timeline'}>{playing ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}</button><label className="flex min-w-0 flex-1 items-center gap-2"><span className="sr-only">Cosmic timeline position</span><input className="timeline-range w-full" type="range" min={0} max={COSMIC_TIMELINE.length - 1} step={1} value={activeIndex} onChange={(e) => scrubTo(Number(e.target.value))}/><span className="w-20 text-right font-mono text-[10px] text-cyan-200">{active.time}</span></label><label className="flex items-center gap-2 text-[10px] text-slate-400">Speed<select value={speed} onChange={(e) => setSpeed(Number(e.target.value))} className="rounded-md border border-white/10 bg-[#07101d] px-2 py-1.5 font-mono text-[11px] text-slate-100">{SPEEDS.map((v) => <option key={v} value={v}>{v}x</option>)}</select></label></div>
        )}
      </div>
    </div>
  );
};
