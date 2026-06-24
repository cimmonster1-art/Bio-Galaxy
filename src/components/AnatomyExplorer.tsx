import React from 'react';
import { ANATOMY_ENTRIES } from '../data/anatomy';
import { Scale } from '../types';

interface Props { scale: Scale; selectedId?: string; onSelect: (id: string) => void; }

/**
 * Clickable system / organ cards for the current anatomy scale.
 *
 * The old "Body scale" scrubber slider was removed — the scale ladder is now
 * driven solely by the zoom +/- controls (see SceneControls), so there is no
 * second, redundant control fighting it. At the Organism scale this overlay is
 * intentionally empty so nothing obscures the specimen.
 */
export const AnatomyExplorer: React.FC<Props> = ({ scale, selectedId, onSelect }) => {
  if (scale === Scale.Organism) return null;
  const visible = ANATOMY_ENTRIES.filter((entry) => scale === Scale.Organ ? entry.scale === Scale.Organ : entry.scale === Scale.OrganSystem);
  return (
    <div className="pointer-events-none absolute inset-x-2 top-3 sm:inset-x-3 sm:top-20 z-20 flex flex-col items-center gap-2">
      <div className="pointer-events-auto flex w-full max-w-3xl gap-2 overflow-x-auto scroll-thin pb-2">
        {visible.map((entry) => <button key={entry.id} onClick={() => onSelect(entry.id)} className={`group min-w-36 rounded-lg border px-3 py-2 text-left backdrop-blur-xl transition hover:-translate-y-0.5 hover:border-cyan-300/50 ${selectedId===entry.id?'border-cyan-300/60 bg-cyan-400/15':'border-white/10 bg-[#07101d]/85'}`}>
          <span className="mb-1 block h-1 w-8 rounded-full" style={{backgroundColor:entry.color}} />
          <span className="block text-[11px] font-semibold text-slate-100">{entry.name}</span>
          <span className="meta-label mt-1 block">Click to inspect</span>
        </button>)}
      </div>
    </div>
  );
};
