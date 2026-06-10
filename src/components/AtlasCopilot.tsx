import React, { useState } from 'react';
import { Bot, Maximize2, Send } from 'lucide-react';
import { BioObject, Scale } from '../types';
import { SCALE_LEVELS } from '../data/scales';

interface Props { scale: Scale; selected: BioObject | null; onNavigate: (id: string) => void; }

/** Context guide docked to the bottom sixth of the atlas screen. */
export const AtlasCopilot: React.FC<Props> = ({ scale, selected, onNavigate }) => {
  const [query, setQuery] = useState('');
  const suggestions = selected?.id.startsWith('system:') ? ['organ:heart','organ:lungs','organ:kidneys'] : ['system:nervous','system:cardiovascular','system:digestive'];
  return <section className="flex h-[16.666vh] min-h-28 shrink-0 border-t border-cyan-400/15 bg-[#06101b]/95 shadow-[0_-18px_50px_rgba(0,0,0,.35)]" aria-label="Bio Galaxy copilot">
    <div className="flex w-64 shrink-0 items-start gap-3 border-r border-white/10 p-4"><span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-cyan-400/15 text-cyan-200"><Bot className="h-4 w-4"/></span><div className="min-w-0"><div className="text-[12px] font-semibold">Atlas copilot</div><div className="meta-label mt-1 truncate">Following {selected?.name ?? SCALE_LEVELS[scale].name}</div><p className="mt-2 line-clamp-2 text-[10px] leading-relaxed text-slate-500">{selected?.summary ?? SCALE_LEVELS[scale].blurb}</p></div></div>
    <div className="hidden min-w-0 flex-1 items-center gap-2 overflow-x-auto scroll-thin px-4 md:flex">{suggestions.map((id) => <button key={id} onClick={() => onNavigate(id)} className="flex min-w-36 items-center justify-between gap-3 rounded-lg border border-white/10 bg-white/[.025] px-3 py-2 text-left text-[11px] text-slate-300 hover:border-cyan-400/30 hover:text-cyan-100"><span>{id.split(':')[1].replace(/\b\w/g, (c) => c.toUpperCase())}</span><Maximize2 className="h-3 w-3"/></button>)}</div>
    <form className="flex w-full max-w-sm items-center gap-2 border-l border-white/10 p-4" onSubmit={(event) => { event.preventDefault(); setQuery(''); }}><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Ask about this view" className="min-w-0 flex-1 rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-[11px] outline-none focus:border-cyan-400/40"/><button className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-cyan-400 text-slate-950" aria-label="Send"><Send className="h-3.5 w-3.5"/></button></form>
  </section>;
};
