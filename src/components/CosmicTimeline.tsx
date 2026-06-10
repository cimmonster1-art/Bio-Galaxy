import React from 'react';
import { X } from 'lucide-react';
import { Scale } from '../types';
import { HISTORY_CHAPTERS } from '../data/history';

interface Props { scale: Scale; onSelectScale: (scale: Scale) => void; onClose: () => void; }

/** Clickable era map kept separate from continuous playback. */
export const CosmicTimeline: React.FC<Props> = ({ scale, onSelectScale, onClose }) => (
  <section className="workspace-overlay workspace-eras" aria-label="Eras browser">
    <header className="flex items-center gap-3 border-b border-white/10 px-5 py-3"><div><div className="meta-label">Fourteen billion years to present</div><h2 className="text-[16px] font-semibold">Eras</h2></div><button onClick={onClose} className="ml-auto rounded-md p-2 text-slate-400 hover:bg-white/10 hover:text-white" aria-label="Close eras"><X className="h-4 w-4"/></button></header>
    <ol className="grid min-h-0 flex-1 grid-cols-2 gap-px overflow-y-auto scroll-thin bg-white/5 p-px sm:grid-cols-3 lg:grid-cols-4">{HISTORY_CHAPTERS.map((era, index) => <li key={era.id}><button type="button" onClick={() => onSelectScale(era.scale)} className={`group flex h-full min-h-28 w-full flex-col items-start bg-[#07101d] p-4 text-left transition hover:bg-[#0a1727] ${scale === era.scale ? 'ring-1 ring-inset ring-cyan-400/50' : ''}`}><span className="mb-4 font-mono text-[10px] text-slate-500">{String(index + 1).padStart(2, '0')} · {era.time}</span><span className="text-[13px] font-semibold text-slate-100 group-hover:text-cyan-100">{era.label}</span><span className="mt-1 text-[10px] leading-relaxed text-slate-500">{era.detail}</span><span className="mt-auto h-0.5 w-full origin-left scale-x-25 rounded-full transition group-hover:scale-x-100" style={{ backgroundColor: era.color }}/></button></li>)}</ol>
  </section>
);
