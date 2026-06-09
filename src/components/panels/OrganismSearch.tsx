import React, { useMemo, useState } from 'react';
import { Search } from 'lucide-react';
import { queryTaxa } from '../../data/organisms';
import { Panel } from '../ui/Panel';

interface Props {
  /** Selects a representative organism by its resolver id. */
  onSelectOrganism: (id: string) => void;
}

/**
 * Filter representative organisms in the field. Backed by the same query shape
 * a paginated taxonomy API would expose, so it can swap to live data later.
 */
export const OrganismSearch: React.FC<Props> = ({ onSelectOrganism }) => {
  const [text, setText] = useState('');
  const groups = useMemo(() => queryTaxa({ text }), [text]);

  return (
    <Panel eyebrow="Organism field" title="Search Taxa">
      <div className="flex items-center gap-2 rounded-sm border border-white/10 bg-black/30 px-2.5 py-1.5">
        <Search className="h-3.5 w-3.5 text-slate-500" />
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Filter organisms"
          className="w-full bg-transparent text-[12px] text-slate-200 placeholder:text-slate-600 focus:outline-none"
        />
      </div>
      <ul className="mt-2.5 max-h-44 space-y-2 overflow-y-auto scroll-thin pr-1">
        {groups.map((g) => (
          <li key={g.id}>
            <div className="meta-label mb-1">{g.name}</div>
            <div className="flex flex-wrap gap-1">
              {g.representatives.map((species, i) => (
                <button
                  key={species}
                  onClick={() => onSelectOrganism(`organism:${g.id}:${i}`)}
                  className="rounded-sm border border-white/10 bg-white/[0.02] px-2 py-0.5 text-[11px] italic text-slate-300 transition hover:border-cyan-500/40 hover:text-cyan-200"
                >
                  {species}
                </button>
              ))}
            </div>
          </li>
        ))}
        {groups.length === 0 && (
          <li className="text-[12px] text-slate-500">No matching organisms.</li>
        )}
      </ul>
    </Panel>
  );
};
