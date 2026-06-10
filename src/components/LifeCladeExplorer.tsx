import React, { useMemo, useState } from 'react';
import { ChevronRight, Database, Network, Search, X } from 'lucide-react';
import { allTaxa, lineageOf, TaxonNode, TREE_OF_LIFE } from '../data/taxonomy';

interface Props {
  selectedTaxonId: string | null;
  onSelect: (id: string) => void;
  onClose: () => void;
}

interface BranchProps {
  node: TaxonNode;
  depth: number;
  selected: string | null;
  onSelect: (id: string) => void;
}

const Branch: React.FC<BranchProps> = ({ node, depth, selected, onSelect }) => {
  const [open, setOpen] = useState(depth < 1);

  return (
    <li>
      <div className={`group flex items-center rounded-md ${selected === node.id ? 'bg-cyan-500/12' : 'hover:bg-white/[.035]'}`}>
        <button
          type="button"
          onClick={() => setOpen((value) => !value)}
          disabled={!node.children.length}
          className="p-2 text-slate-600 disabled:opacity-0"
          aria-label={`${open ? 'Collapse' : 'Expand'} ${node.name}`}
        >
          <ChevronRight className={`h-3 w-3 transition ${open ? 'rotate-90' : ''}`} />
        </button>
        <button type="button" onClick={() => onSelect(node.id)} className="flex min-w-0 flex-1 items-center gap-2 py-1.5 pr-2 text-left">
          <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: `hsl(${node.hue} 70% 62%)` }} />
          <span className="min-w-0 flex-1 truncate text-[12px] text-slate-200">{node.name}</span>
          <span className="meta-label">{node.rank}</span>
        </button>
      </div>
      {open && node.children.length > 0 && (
        <ul className="ml-4 border-l border-white/8 pl-2">
          {node.children.map((child) => <Branch key={child.id} node={child} depth={depth + 1} selected={selected} onSelect={onSelect} />)}
        </ul>
      )}
    </li>
  );
};

/** Full-width taxonomy workspace opened from the atlas top navigation. */
export const LifeCladeExplorer: React.FC<Props> = ({ selectedTaxonId, onSelect, onClose }) => {
  const [query, setQuery] = useState('');
  const taxa = useMemo(() => allTaxa(), []);
  const matches = useMemo(
    () => query.trim()
      ? taxa.filter((node) => `${node.name} ${node.common ?? ''} ${node.rank}`.toLowerCase().includes(query.toLowerCase())).slice(0, 40)
      : [],
    [query, taxa],
  );
  const selected = useMemo(() => taxa.find((node) => node.id === selectedTaxonId) ?? null, [selectedTaxonId, taxa]);
  const lineage = useMemo(() => selectedTaxonId ? lineageOf(selectedTaxonId) : [], [selectedTaxonId]);
  const visibleChildren = selected?.children ?? TREE_OF_LIFE;

  return (
    <section className="flex min-h-0 flex-1 flex-col bg-[#040911]" aria-label="Tree of Life workspace">
      <header className="flex flex-wrap items-center gap-3 border-b border-white/10 px-3 py-3 sm:flex-nowrap sm:gap-4 sm:px-5">
        <div className="flex items-center gap-3">
          <span className="grid h-9 w-9 place-items-center rounded-lg border border-cyan-400/20 bg-cyan-400/[.08] text-cyan-200"><Network className="h-4 w-4" /></span>
          <div><div className="meta-label">Interactive taxonomy</div><h1 className="text-[16px] font-semibold">Tree of Life</h1></div>
        </div>
        <div className="relative order-3 w-full sm:order-none sm:ml-auto sm:max-w-md">
          <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-500" />
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search taxa, common names, or ranks" className="w-full rounded-lg border border-white/10 bg-black/30 py-2 pl-9 pr-3 text-[11px] outline-none focus:border-cyan-400/40" />
        </div>
        <button onClick={onClose} className="rounded-md p-2 text-slate-400 hover:bg-white/10 hover:text-white" aria-label="Close Tree of Life"><X className="h-4 w-4" /></button>
      </header>

      <div className="grid min-h-0 flex-1 grid-rows-[auto_minmax(0,1fr)] lg:grid-cols-[18rem_minmax(25rem,1fr)_20rem] lg:grid-rows-1">
        <aside className="max-h-44 overflow-y-auto border-b border-white/10 bg-black/10 p-3 scroll-thin lg:max-h-none lg:border-b-0 lg:border-r lg:p-4">
          <div className="meta-label mb-3">{query ? `${matches.length} search results` : 'All atlas branches'}</div>
          <ul className="space-y-px">
            {query
              ? matches.map((node) => <Branch key={node.id} node={node} depth={2} selected={selectedTaxonId} onSelect={onSelect} />)
              : TREE_OF_LIFE.map((node) => <Branch key={node.id} node={node} depth={0} selected={selectedTaxonId} onSelect={onSelect} />)}
          </ul>
        </aside>

        <main className="relative min-h-0 overflow-y-auto p-4 sm:p-6 scroll-thin life-tree-grid">
          <div className="mx-auto flex min-h-full max-w-4xl flex-col justify-center">
            <div className="meta-label mb-5">Selected lineage</div>
            <div className="flex flex-wrap items-center gap-2">
              {(lineage.length ? lineage : TREE_OF_LIFE).map((node, index, items) => (
                <React.Fragment key={node.id}>
                  <button type="button" onClick={() => onSelect(node.id)} className={`group rounded-lg border px-4 py-3 text-left transition ${node.id === selectedTaxonId ? 'border-cyan-400/50 bg-cyan-400/10' : 'border-white/10 bg-[#07101d]/90 hover:border-cyan-400/30'}`}>
                    <span className="mb-2 block h-2 w-2 rounded-full" style={{ backgroundColor: `hsl(${node.hue} 70% 62%)` }} />
                    <span className="block text-[12px] font-semibold text-slate-100">{node.name}</span>
                    <span className="meta-label mt-1 block">{node.rank}</span>
                  </button>
                  {index < items.length - 1 && <ChevronRight className="h-4 w-4 text-slate-700" />}
                </React.Fragment>
              ))}
            </div>

            <div className="mt-8 border-t sm:mt-12 border-white/10 pt-6">
              <div className="meta-label mb-3">{selected ? `Branches within ${selected.name}` : 'Start with a domain'}</div>
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {visibleChildren.map((node) => (
                  <button key={node.id} type="button" onClick={() => onSelect(node.id)} className="rounded-lg border border-white/10 bg-[#07101d]/90 p-4 text-left transition hover:border-cyan-400/30 hover:bg-cyan-400/[.04]">
                    <span className="mb-3 block h-1 w-10 rounded-full" style={{ backgroundColor: `hsl(${node.hue} 70% 62%)` }} />
                    <span className="block text-[12px] font-semibold text-slate-100">{node.name}</span>
                    <span className="mt-1 block text-[10px] text-slate-500">{node.common ?? node.rank}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </main>

        <aside className="hidden overflow-y-auto border-l border-white/10 bg-black/15 p-5 scroll-thin lg:block">
          <div className="meta-label">Taxon record</div>
          {selected ? <div className="mt-5">
            <span className="mb-4 block h-2.5 w-2.5 rounded-full" style={{ backgroundColor: `hsl(${selected.hue} 70% 62%)` }} />
            <h2 className="text-xl font-semibold text-slate-100">{selected.name}</h2>
            <p className="mt-1 text-[12px] text-slate-400">{selected.common ?? 'No common name in the local atlas.'}</p>
            <dl className="mt-6 space-y-4 border-t border-white/10 pt-5">
              <div><dt className="meta-label">Rank</dt><dd className="mt-1 text-[12px] capitalize text-slate-200">{selected.rank}</dd></div>
              <div><dt className="meta-label">NCBI taxonomy ID</dt><dd className="mt-1 font-mono text-[12px] text-cyan-200">{selected.ncbiTaxId}</dd></div>
              <div><dt className="meta-label">Direct branches</dt><dd className="mt-1 text-[12px] text-slate-200">{selected.children.length}</dd></div>
            </dl>
            <div className="mt-7 rounded-lg border border-white/10 bg-white/[.025] p-3">
              <div className="flex items-center gap-2 text-[11px] font-semibold text-slate-200"><Database className="h-3.5 w-3.5 text-cyan-300" /> NCBI Taxonomy</div>
              <p className="mt-2 text-[10px] leading-relaxed text-slate-500">Taxonomy identifiers provide the source reference for this atlas branch.</p>
            </div>
          </div> : <p className="mt-4 text-[12px] leading-relaxed text-slate-400">Choose any branch to inspect its lineage, children, and source identifier.</p>}
        </aside>
      </div>
    </section>
  );
};
