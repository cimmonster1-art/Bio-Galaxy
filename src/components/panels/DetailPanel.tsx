import React from 'react';
import { MousePointerClick } from 'lucide-react';
import { BioObject, DataSourceId } from '../../types';
import { SourceBadge } from '../ui/SourceBadge';
import { UniProtSection } from './detail/UniProtSection';
import { StructureSection } from './detail/StructureSection';
import { MitochondrialProteins } from './detail/MitochondrialProteins';
import { PathwaySection } from './detail/PathwaySection';
import { TaxonomySection } from './detail/TaxonomySection';

interface Props {
  selected: BioObject | null;
}

/**
 * Right column. Shows the selected object's curated metadata, its database
 * provenance, and live records pulled from the integrated sources. Sections are
 * conditional on what the object exposes (accession, pdb id, pathway id).
 */
export const DetailPanel: React.FC<Props> = ({ selected }) => {
  if (!selected) return <EmptyState />;

  const sources: DataSourceId[] = [
    ...(selected.source ? [selected.source] : []),
    ...(selected.crossRefs ?? []),
  ];

  return (
    <div className="flex h-full flex-col">
      <header className="border-b border-white/10 px-4 py-3.5">
        <div className="meta-label mb-1 capitalize">{selected.kind}</div>
        <h2 className="text-[15px] font-semibold text-slate-100">{selected.name}</h2>
        <div className="mt-1 font-mono text-[11px] text-cyan-300/80">{selected.size}</div>
      </header>

      <div className="flex-1 space-y-4 overflow-y-auto scroll-thin px-4 py-3.5">
        <p className="text-[12.5px] leading-relaxed text-slate-300">{selected.summary}</p>

        <div>
          <div className="meta-label mb-1.5">Provenance</div>
          {sources.length > 0 ? (
            <div className="flex flex-wrap gap-1.5">
              {sources.map((s, i) => (
                <SourceBadge key={s} source={s} active={i === 0} />
              ))}
            </div>
          ) : (
            <p className="text-[11px] leading-relaxed text-slate-500">
              {selected.provenanceNote ?? 'Reference object.'}
            </p>
          )}
        </div>

        {selected.facts.length > 0 && (
          <ul className="space-y-1.5 border-t border-white/10 pt-3">
            {selected.facts.map((fact) => (
              <li key={fact} className="flex gap-2 text-[12px] leading-relaxed text-slate-400">
                <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-cyan-500/60" />
                {fact}
              </li>
            ))}
          </ul>
        )}

        {selected.rank && (
          <div className="border-t border-white/10 pt-3">
            <TaxonomySection selected={selected} />
          </div>
        )}

        {selected.id === 'mitochondrion' && (
          <div className="border-t border-white/10 pt-3">
            <MitochondrialProteins />
          </div>
        )}

        {selected.accession && (
          <div className="border-t border-white/10 pt-3">
            <UniProtSection accession={selected.accession} />
          </div>
        )}

        {selected.reactomeId && (
          <div className="border-t border-white/10 pt-3">
            <PathwaySection reactomeId={selected.reactomeId} />
          </div>
        )}

        {selected.pdbId && (
          <div className="border-t border-white/10 pt-3">
            <StructureSection pdbId={selected.pdbId} />
          </div>
        )}
      </div>
    </div>
  );
};

const EmptyState: React.FC = () => (
  <div className="flex h-full flex-col items-center justify-center px-6 text-center">
    <MousePointerClick className="mb-3 h-6 w-6 text-slate-600" />
    <div className="text-[13px] font-medium text-slate-300">No object selected</div>
    <p className="mt-1 text-[12px] leading-relaxed text-slate-500">
      Select a structure in the atlas to see its metadata and database provenance.
    </p>
  </div>
);
