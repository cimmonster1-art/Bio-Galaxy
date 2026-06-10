import React from 'react';
import { Activity, ChevronRight } from 'lucide-react';
import { ANATOMY_ENTRIES } from '../data/anatomy';
import { Scale } from '../types';

interface Props { scale: Scale; selectedId?: string; onSelect: (id: string) => void; onScaleChange: (scale: Scale) => void; }

/** Scrubbable anatomy scale rail and clickable system or organ cards. */
export const AnatomyExplorer: React.FC<Props> = ({ scale, selectedId, onSelect, onScaleChange }) => {
  const visible = ANATOMY_ENTRIES.filter((entry) => scale === Scale.Organ ? entry.scale === Scale.Organ : entry.scale === Scale.OrganSystem);
  return (
    <div className="pointer-events-none absolute inset-x-2 top-3 sm:inset-x-3 sm:top-20 z-20 flex flex-col items-center gap-2">
      <div className="pointer-events-auto panel w-full max-w-xl rounded-xl px-3 py-2.5 shadow-2xl shadow-black/40">
        <div className="flex items-center gap-3">
          <Activity className="h-4 w-4 shrink-0 text-cyan-300" />
          <span className="meta-label hidden sm:block">Body scale</span>
          <input aria-label="Scrub anatomy scale" type="range" min={Scale.Organism} max={Scale.Organ} value={scale} onChange={(e) => onScaleChange(Number(e.target.value) as Scale)} className="anatomy-scrubber min-w-0 flex-1" />
          <div className="hidden gap-1 text-[10px] sm:flex text-slate-400"><span>Body</span><ChevronRight className="h-3 w-3"/><span>Systems</span><ChevronRight className="h-3 w-3"/><span>Organs</span></div>
        </div>
      </div>
      {scale !== Scale.Organism && (
        <div className="pointer-events-auto flex w-full max-w-3xl gap-2 overflow-x-auto scroll-thin pb-2">
          {visible.map((entry) => <button key={entry.id} onClick={() => onSelect(entry.id)} className={`group min-w-36 rounded-lg border px-3 py-2 text-left backdrop-blur-xl transition hover:-translate-y-0.5 hover:border-cyan-300/50 ${selectedId===entry.id?'border-cyan-300/60 bg-cyan-400/15':'border-white/10 bg-[#07101d]/85'}`}>
            <span className="mb-1 block h-1 w-8 rounded-full" style={{backgroundColor:entry.color}} />
            <span className="block text-[11px] font-semibold text-slate-100">{entry.name}</span>
            <span className="meta-label mt-1 block">Click to inspect</span>
          </button>)}
        </div>
      )}
    </div>
  );
};
