import React from 'react';
import { BookOpen, ExternalLink } from 'lucide-react';
import { BioObject, Scale } from '../types';
import { SCALE_LEVELS } from '../data/scales';
import { useAsync } from '../hooks/useAsync';
import { wikipedia } from '../data/clients';

interface Props { selected: BioObject | null; scale: Scale; }

/**
 * Encyclopedic context for the current selection. Atlas-authored context and a
 * live Wikipedia extract are labelled separately so fallback copy can never be
 * mistaken for encyclopedia content.
 */
export const WikipediaSidebar: React.FC<Props> = ({ selected, scale }) => {
  const title = selected?.name ?? SCALE_LEVELS[scale].name;
  const atlasSummary = selected?.summary ?? SCALE_LEVELS[scale].blurb;

  const { data, loading } = useAsync(
    (signal) => wikipedia.getSummary(title, { signal }),
    [title],
  );

  const url = data?.url ?? `https://en.wikipedia.org/wiki/${encodeURIComponent(title.replaceAll(' ', '_'))}`;

  return (
    <section className="flex h-[16.666vh] min-h-28 flex-col border-b border-white/10 bg-[#07101d]" aria-label="Wikipedia sidebar">
      <header className="flex items-center gap-2 border-b border-white/8 px-4 py-2">
        <BookOpen className="h-3.5 w-3.5 text-cyan-300" />
        <span className="meta-label flex-1">Reference context</span>
        <a href={url} target="_blank" rel="noreferrer" className="text-slate-500 hover:text-cyan-200" aria-label={`Open ${title} on Wikipedia`}>
          <ExternalLink className="h-3.5 w-3.5" />
        </a>
      </header>
      <div className="min-h-0 flex-1 overflow-y-auto scroll-thin px-4 py-2.5">
        <h2 className="text-[13px] font-semibold text-slate-100">{data?.title ?? title}</h2>
        {data?.description && (
          <p className="mt-0.5 text-[10px] uppercase tracking-wide text-cyan-300/70">{data.description}</p>
        )}
        <div className="meta-label mt-2">Atlas note</div>
        <p className="mt-1 text-[11px] leading-relaxed text-slate-400">{atlasSummary}</p>
        {data?.extract && data.extract !== atlasSummary && (
          <>
            <div className="meta-label mt-2 border-t border-white/8 pt-2">Wikipedia extract</div>
            <p className="mt-1 text-[11px] leading-relaxed text-slate-400">{data.extract}</p>
          </>
        )}
        {loading && <p className="mt-1.5 text-[9px] text-slate-600">Fetching Wikipedia extract…</p>}
        {!loading && !data?.extract && <a href={url} target="_blank" rel="noreferrer" className="mt-1.5 inline-flex items-center gap-1 text-[10px] text-cyan-300/75 hover:text-cyan-200">Live extract unavailable · open Wikipedia <ExternalLink className="h-3 w-3" /></a>}
      </div>
    </section>
  );
};
