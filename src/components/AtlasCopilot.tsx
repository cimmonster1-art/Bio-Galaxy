import React, { useEffect, useState } from 'react';
import { Bot, ChevronDown, Maximize2, Send, X } from 'lucide-react';
import { BioObject, Scale } from '../types';
import { SCALE_LEVELS } from '../data/scales';

interface Props { scale: Scale; selected: BioObject | null; onNavigate: (id: string) => void; }

/** Always-available contextual atlas guide. The launcher remains visible above every panel. */
export const AtlasCopilot: React.FC<Props> = ({ scale, selected, onNavigate }) => {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  useEffect(() => { const key=(e:KeyboardEvent)=>{if((e.ctrlKey||e.metaKey)&&e.key==='/'){e.preventDefault();setOpen(v=>!v);}}; window.addEventListener('keydown',key); return()=>window.removeEventListener('keydown',key); },[]);
  const suggestions = selected?.id.startsWith('system:') ? ['organ:heart','organ:lungs','organ:kidneys'] : ['system:nervous','system:cardiovascular','system:digestive'];
  return <div className="fixed bottom-5 right-5 z-[100] flex flex-col items-end gap-2">
    {open && <section className="panel flex h-[min(470px,70vh)] w-[min(360px,calc(100vw-2rem))] flex-col overflow-hidden rounded-2xl border-cyan-400/20 shadow-2xl shadow-black/60" aria-label="Bio Galaxy copilot">
      <header className="flex items-center gap-2 border-b border-white/10 bg-cyan-500/[.06] px-3 py-3"><span className="grid h-8 w-8 place-items-center rounded-lg bg-cyan-400/15 text-cyan-200"><Bot className="h-4 w-4"/></span><div className="min-w-0 flex-1"><div className="text-[12px] font-semibold">Atlas copilot</div><div className="meta-label truncate">Following {selected?.name ?? SCALE_LEVELS[scale].name}</div></div><button onClick={()=>setOpen(false)} className="rounded-md p-2 text-slate-400 hover:bg-white/10 hover:text-white" aria-label="Minimize copilot"><ChevronDown className="h-4 w-4"/></button><button onClick={()=>setOpen(false)} className="rounded-md p-2 text-slate-400 hover:bg-white/10 hover:text-white" aria-label="Close copilot"><X className="h-4 w-4"/></button></header>
      <div className="flex-1 overflow-y-auto p-3"><div className="rounded-xl border border-white/10 bg-white/[.03] p-3 text-[12px] leading-relaxed text-slate-300">{selected ? `${selected.summary} Select a related card to continue through the atlas.` : `You are viewing ${SCALE_LEVELS[scale].name}. Select a structure or use the anatomy scrubber to explore.`}</div><div className="meta-label mb-2 mt-4">Suggested next stops</div><div className="grid gap-2">{suggestions.map(id=><button key={id} onClick={()=>onNavigate(id)} className="flex items-center justify-between rounded-lg border border-white/10 bg-white/[.02] px-3 py-2 text-left text-[11px] text-slate-300 hover:border-cyan-400/30 hover:text-cyan-100"><span>{id.split(':')[1].replace(/\b\w/g,c=>c.toUpperCase())}</span><Maximize2 className="h-3 w-3"/></button>)}</div></div>
      <form className="flex gap-2 border-t border-white/10 p-3" onSubmit={(e)=>{e.preventDefault();setQuery('');}}><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Ask about this view" className="min-w-0 flex-1 rounded-lg border border-white/10 bg-black/30 px-3 text-[12px] outline-none focus:border-cyan-400/40"/><button className="grid h-9 w-9 place-items-center rounded-lg bg-cyan-400 text-slate-950" aria-label="Send"><Send className="h-3.5 w-3.5"/></button></form>
    </section>}
    <button onClick={()=>setOpen(v=>!v)} className="copilot-launcher flex min-h-12 items-center gap-2 rounded-full border border-cyan-300/40 bg-[#08202b] px-4 py-3 text-[12px] font-semibold text-cyan-100 shadow-xl shadow-black/50 transition hover:scale-105 hover:border-cyan-200 focus:outline-none focus:ring-2 focus:ring-cyan-300" aria-expanded={open} aria-label="Open atlas copilot"><Bot className="h-4 w-4"/><span>Copilot</span><span className="hidden font-mono text-[9px] text-cyan-300/60 sm:inline">⌘/</span></button>
  </div>;
};
