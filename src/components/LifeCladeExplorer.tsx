import React, { useMemo, useState } from 'react';
import { Network, Search, X } from 'lucide-react';
import { allTaxa, lineageOf, TREE_OF_LIFE } from '../data/taxonomy';
import { TaxonBranchList } from './life-clade/TaxonBranchList';
import { TaxonRecord } from './life-clade/TaxonRecord';
import { TaxonWorkspace } from './life-clade/TaxonWorkspace';

interface Props {
  selectedTaxonId: string | null;
  onSelect: (id: string) => void;
  onClose: () => void;
}

/** Full-width taxonomy workspace opened from the atlas top navigation. */
export const LifeCladeExplorer: React.FC<Props> = ({ selectedTaxonId, onSelect, onClose }) => {
  const [query, setQuery] = useState('');
  const taxa = useMemo(() => allTaxa(), []);
  const matches = useMemo(() => query.trim() ? taxa.filter((node) => `${node.name} ${node.common ?? ''} ${node.rank}`.toLowerCase().includes(query.toLowerCase())).slice(0, 40) : [], [query, taxa]);
  const selected = useMemo(() => taxa.find((node) => node.id === selectedTaxonId) ?? null, [selectedTaxonId, taxa]);
  // A breadcrumb is an ancestry path, never a list of root-level domains. With
  // no selection there is deliberately no lineage to display.
  const lineage = useMemo(() => selectedTaxonId ? lineageOf(selectedTaxonId) : [], [selectedTaxonId]);

  return <section className="flex min-h-0 flex-1 flex-col bg-[#040911]" aria-label="Tree of Life workspace">
    <header className="flex flex-wrap items-center gap-3 border-b border-white/10 px-3 py-3 sm:flex-nowrap sm:gap-4 sm:px-5">
      <div className="flex items-center gap-3"><span className="grid h-9 w-9 place-items-center rounded-lg border border-cyan-400/20 bg-cyan-400/[.08] text-cyan-200"><Network className="h-4 w-4" /></span><div><div className="meta-label">Interactive taxonomy</div><h1 className="text-[16px] font-semibold">Tree of Life</h1></div></div>
      <div className="relative order-3 w-full sm:order-none sm:ml-auto sm:max-w-md"><Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-500" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search taxa, common names, or ranks" className="w-full rounded-lg border border-white/10 bg-black/30 py-2 pl-9 pr-3 text-[11px] outline-none focus:border-cyan-400/40" /></div>
      <button onClick={onClose} className="rounded-md p-2 text-slate-400 hover:bg-white/10 hover:text-white" aria-label="Close Tree of Life"><X className="h-4 w-4" /></button>
    </header>
    <div className="grid min-h-0 flex-1 grid-rows-[auto_minmax(0,1fr)] lg:grid-cols-[18rem_minmax(25rem,1fr)_20rem] lg:grid-rows-1">
      <TaxonBranchList nodes={query ? matches : TREE_OF_LIFE} resultCount={query ? matches.length : undefined} selectedTaxonId={selectedTaxonId} onSelect={onSelect} />
      <TaxonWorkspace selectedTaxonId={selectedTaxonId} selected={selected} lineage={lineage} visibleChildren={selected?.children ?? TREE_OF_LIFE} onSelect={onSelect} />
      <TaxonRecord selected={selected} />
    </div>
  </section>;
};
