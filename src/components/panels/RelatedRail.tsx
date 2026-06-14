import React, { useMemo } from 'react';
import { ChevronRight, ChevronUp, Layers } from 'lucide-react';
import { BioObject } from '../../types';
import { SCALE_LEVELS } from '../../data/scales';
import { relatedGroups } from '../../data/relations';
import { wikipedia } from '../../data/clients';
import { useAsync } from '../../hooks/useAsync';

interface Props {
  selected: BioObject | null;
  onNavigate: (id: string) => void;
}

// A short, human label for the descend relationship, so the rail header reads
// naturally for whatever kind of thing is selected.
function insideLabel(object: BioObject): string {
  switch (object.kind) {
    case 'cosmos': case 'galaxy': return 'Within';
    case 'star': return 'Nearby in the catalogue';
    case 'planet': return object.id === 'planet:sun' ? 'Planets' : 'Neighbouring worlds';
    case 'biome': return 'Life in this biome';
    case 'system': return 'Organs';
    case 'organ': return 'Inside';
    case 'tissue': return 'Cell components';
    case 'organelle': return 'Molecular machines';
    case 'complex': return 'Molecules';
    case 'molecule': return 'Atoms & bonds';
    case 'clade': case 'taxon': return 'Branches';
    default: return 'Inside';
  }
}

// Best Wikipedia page title for an object — names are usually right, but a few
// atlas records map onto a broader or differently-cased article.
function wikiTitleFor(object: BioObject): string {
  if (object.kind === 'atom') return object.name.replace(/ atom$/i, '');
  switch (object.id) {
    case 'cosmos': return 'Observable universe';
    case 'galaxy': return 'Spiral galaxy';
    case 'dna_helix': return 'DNA';
    case 'water_cluster': return 'Water';
    case 'lipid_membrane': return 'Lipid bilayer';
    default: return object.name;
  }
}

const RailCard: React.FC<{ item: BioObject; onNavigate: (id: string) => void; up?: boolean }> = ({ item, onNavigate, up }) => {
  const title = wikiTitleFor(item);
  const { data } = useAsync((signal) => wikipedia.getSummary(title, { signal }), [title]);
  const thumb = data?.thumbnail ?? null;
  const width = up ? 'w-[9rem]' : 'w-[11rem]';
  const imgH = up ? 'h-12' : 'h-20';
  const Arrow = up ? ChevronUp : ChevronRight;

  return (
    <button
      onClick={() => onNavigate(item.id)}
      className={`group flex ${width} shrink-0 flex-col overflow-hidden rounded-lg border border-white/10 bg-white/[0.02] text-left transition hover:border-cyan-400/40 hover:bg-cyan-400/[0.05]`}
    >
      <div className={`relative ${imgH} w-full overflow-hidden bg-gradient-to-br from-cyan-500/10 to-slate-700/10`}>
        {thumb ? (
          <img src={thumb} alt="" loading="lazy" className="h-full w-full object-cover transition group-hover:scale-105" />
        ) : (
          <div className="grid h-full w-full place-items-center">
            <span className="font-mono text-[9px] uppercase tracking-widest text-cyan-300/50">{SCALE_LEVELS[item.scale].name}</span>
          </div>
        )}
        <Arrow className="absolute right-1 top-1 h-3.5 w-3.5 rounded bg-black/30 text-slate-300 opacity-0 transition group-hover:opacity-100" aria-hidden />
      </div>
      <div className="flex min-h-0 flex-1 flex-col p-2.5">
        <span className="truncate text-[12.5px] font-semibold text-slate-50">{item.name}</span>
        <span className="mt-0.5 font-mono text-[9.5px] uppercase tracking-wide text-cyan-300/70">{SCALE_LEVELS[item.scale].name}</span>
        {!up && <p className="mt-1 line-clamp-2 text-[10.5px] leading-snug text-slate-400">{item.summary}</p>}
      </div>
    </button>
  );
};

/**
 * The universal, bidirectional bottom-card rail. Whatever is selected, it shows
 * both what the object is PART OF (ascend) and what is INSIDE it (descend), each a
 * card with a live Wikipedia thumbnail that navigates one level along the graph.
 * No selection is a dead end: you can descend from an organ to the gene that
 * builds it, or climb from an atom up through chemistry into living biology.
 */
export const RelatedRail: React.FC<Props> = ({ selected, onNavigate }) => {
  const groups = useMemo(() => (selected ? relatedGroups(selected) : { up: [], down: [] }), [selected]);
  if (!selected || (groups.up.length === 0 && groups.down.length === 0)) return null;

  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20 px-3 pb-3">
      <div className="pointer-events-auto mx-auto max-w-[min(100%,72rem)] rounded-xl border border-white/10 bg-[#04070f]/85 p-2 backdrop-blur">
        {groups.up.length > 0 && (
          <div className="mb-1.5 border-b border-white/8 pb-1.5">
            <header className="mb-1 flex items-center gap-2 px-1">
              <ChevronUp className="h-3.5 w-3.5 text-slate-400" aria-hidden />
              <span className="meta-label">Part of</span>
            </header>
            <div className="flex items-stretch gap-2 overflow-x-auto scroll-thin pb-1">
              {groups.up.map((item) => <RailCard key={item.id} item={item} onNavigate={onNavigate} up />)}
            </div>
          </div>
        )}
        <header className="mb-1.5 flex items-center gap-2 px-1">
          <Layers className="h-3.5 w-3.5 text-cyan-300" aria-hidden />
          <span className="meta-label">{insideLabel(selected)} · {selected.name}</span>
        </header>
        <div className="flex items-stretch gap-2 overflow-x-auto scroll-thin pb-1">
          {groups.down.length > 0
            ? groups.down.map((item) => <RailCard key={item.id} item={item} onNavigate={onNavigate} />)
            : <span className="px-1 py-3 text-[11px] text-slate-500">The deepest rung on this branch — climb back up above.</span>}
        </div>
      </div>
    </div>
  );
};
