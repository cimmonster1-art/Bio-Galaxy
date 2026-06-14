import React, { useMemo } from 'react';
import { ChevronRight, Layers } from 'lucide-react';
import { BioObject } from '../../types';
import { SCALE_LEVELS } from '../../data/scales';
import { relatedObjects } from '../../data/relations';
import { wikipedia } from '../../data/clients';
import { useAsync } from '../../hooks/useAsync';

interface Props {
  selected: BioObject | null;
  onNavigate: (id: string) => void;
}

// A short, human label for the relationship, so the rail header reads naturally
// for whatever kind of thing is selected.
function railLabel(object: BioObject): string {
  switch (object.kind) {
    case 'cosmos': case 'galaxy': return 'Within';
    case 'star': return 'Nearby in the catalogue';
    case 'planet': return object.id === 'planet:sun' ? 'Planets' : 'Neighbouring worlds';
    case 'biome': return 'Life in this biome';
    case 'system': return 'Organs';
    case 'organ': return 'Tissues';
    case 'tissue': return 'Cell components';
    case 'organelle': return 'Molecular machines';
    case 'complex': return 'Molecules';
    case 'molecule': return 'Atoms';
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

const RailCard: React.FC<{ item: BioObject; onNavigate: (id: string) => void }> = ({ item, onNavigate }) => {
  const title = wikiTitleFor(item);
  const { data } = useAsync((signal) => wikipedia.getSummary(title, { signal }), [title]);
  const thumb = data?.thumbnail ?? null;

  return (
    <button
      onClick={() => onNavigate(item.id)}
      className="group flex w-[11rem] shrink-0 flex-col overflow-hidden rounded-lg border border-white/10 bg-white/[0.02] text-left transition hover:border-cyan-400/40 hover:bg-cyan-400/[0.05]"
    >
      <div className="relative h-20 w-full overflow-hidden bg-gradient-to-br from-cyan-500/10 to-slate-700/10">
        {thumb ? (
          <img src={thumb} alt="" loading="lazy" className="h-full w-full object-cover transition group-hover:scale-105" />
        ) : (
          <div className="grid h-full w-full place-items-center">
            <span className="font-mono text-[9px] uppercase tracking-widest text-cyan-300/50">{SCALE_LEVELS[item.scale].name}</span>
          </div>
        )}
        <ChevronRight className="absolute right-1 top-1 h-3.5 w-3.5 rounded bg-black/30 text-slate-300 opacity-0 transition group-hover:opacity-100" aria-hidden />
      </div>
      <div className="flex min-h-0 flex-1 flex-col p-2.5">
        <span className="truncate text-[12.5px] font-semibold text-slate-50">{item.name}</span>
        <span className="mt-0.5 font-mono text-[9.5px] uppercase tracking-wide text-cyan-300/70">{SCALE_LEVELS[item.scale].name}</span>
        <p className="mt-1 line-clamp-2 text-[10.5px] leading-snug text-slate-400">{item.summary}</p>
      </div>
    </button>
  );
};

/**
 * The universal bottom-card rail. Whatever is selected, it surfaces the records
 * "inside" it from the ontology — planets within a star, organs within a system,
 * organelles within a tissue, child clades within a branch — each a card that
 * carries a live Wikipedia thumbnail and navigates one level deeper. This is what
 * makes every object feel like it opens onto another universe of information.
 */
export const RelatedRail: React.FC<Props> = ({ selected, onNavigate }) => {
  const items = useMemo(() => (selected ? relatedObjects(selected) : []), [selected]);
  if (!selected || items.length === 0) return null;

  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20 px-3 pb-3">
      <div className="pointer-events-auto mx-auto max-w-[min(100%,72rem)] rounded-xl border border-white/10 bg-[#04070f]/85 p-2 backdrop-blur">
        <header className="mb-1.5 flex items-center gap-2 px-1">
          <Layers className="h-3.5 w-3.5 text-cyan-300" aria-hidden />
          <span className="meta-label">{railLabel(selected)} · {selected.name}</span>
        </header>
        <div className="flex items-stretch gap-2 overflow-x-auto scroll-thin pb-1">
          {items.map((item) => (
            <RailCard key={item.id} item={item} onNavigate={onNavigate} />
          ))}
        </div>
      </div>
    </div>
  );
};
