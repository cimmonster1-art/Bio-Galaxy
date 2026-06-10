import React from 'react';
import { BookOpen, ExternalLink } from 'lucide-react';
import { BioObject, Scale } from '../types';
import { SCALE_LEVELS } from '../data/scales';

interface Props { selected: BioObject | null; scale: Scale; }

export const WikipediaSidebar: React.FC<Props> = ({ selected, scale }) => {
  const title = selected?.name ?? SCALE_LEVELS[scale].name;
  const summary = selected?.summary ?? SCALE_LEVELS[scale].blurb;
  const url = `https://en.wikipedia.org/wiki/${encodeURIComponent(title.replaceAll(' ', '_'))}`;
  return <section className="flex h-[16.666vh] min-h-28 flex-col border-b border-white/10 bg-[#07101d]" aria-label="Wikipedia sidebar">
    <header className="flex items-center gap-2 border-b border-white/8 px-4 py-2"><BookOpen className="h-3.5 w-3.5 text-cyan-300"/><span className="meta-label flex-1">Wikipedia context</span><a href={url} target="_blank" rel="noreferrer" className="text-slate-500 hover:text-cyan-200" aria-label={`Open ${title} on Wikipedia`}><ExternalLink className="h-3.5 w-3.5"/></a></header>
    <div className="min-h-0 flex-1 overflow-y-auto scroll-thin px-4 py-2.5"><h2 className="text-[13px] font-semibold text-slate-100">{title}</h2><p className="mt-1 text-[11px] leading-relaxed text-slate-400">{summary}</p><p className="mt-1.5 text-[9px] text-slate-600">Atlas summary with an external encyclopedia link.</p></div>
  </section>;
};
