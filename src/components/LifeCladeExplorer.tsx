import React, { useMemo, useState } from 'react';
import { ChevronRight, Search, X } from 'lucide-react';
import { allTaxa, lineageOf, TaxonNode, TREE_OF_LIFE } from '../data/taxonomy';

interface Props { selectedTaxonId: string | null; onSelect: (id: string) => void; onClose: () => void; }

const Branch: React.FC<{ node: TaxonNode; depth: number; selected: string | null; onSelect: (id: string) => void }> = ({ node, depth, selected, onSelect }) => {
  const [open, setOpen] = useState(depth < 1);
  return <li>
    <div className={`group flex items-center rounded-md ${selected === node.id ? 'bg-cyan-500/12' : 'hover:bg-white/[.035]'}`}>
      <button type="button" onClick={() => setOpen((value) => !value)} disabled={!node.children.length} className="p-2 text-slate-600 disabled:opacity-0" aria-label={`${open ? 'Collapse' : 'Expand'} ${node.name}`}><ChevronRight className={`h-3 w-3 transition ${open ? 'rotate-90' : ''}`}/></button>
      <button type="button" onClick={() => onSelect(node.id)} className="flex min-w-0 flex-1 items-center gap-2 py-1.5 pr-2 text-left"><span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: `hsl(${node.hue} 70% 62%)` }}/><span className="min-w-0 flex-1 truncate text-[12px] text-slate-200">{node.name}</span><span className="meta-label">{node.rank}</span></button>
    </div>
    {open && node.children.length > 0 && <ul className="ml-4 border-l border-white/8 pl-2">{node.children.map((child) => <Branch key={child.id} node={child} depth={depth + 1} selected={selected} onSelect={onSelect}/>)}</ul>}
  </li>;
};

export const LifeCladeExplorer: React.FC<Props> = ({ selectedTaxonId, onSelect, onClose }) => {
  const [query, setQuery] = useState('');
  const matches = useMemo(() => query.trim() ? allTaxa().filter((node) => `${node.name} ${node.common ?? ''} ${node.rank}`.toLowerCase().includes(query.toLowerCase())).slice(0, 40) : [], [query]);
  const lineage = selectedTaxonId ? lineageOf(selectedTaxonId) : [];
  return <section className="workspace-overlay" aria-label="Full clade of life explorer">
    <header className="flex items-center gap-4 border-b border-white/10 px-5 py-3"><div><div className="meta-label">Interactive taxonomy</div><h2 className="text-[16px] font-semibold">Clade of life</h2></div><div className="relative ml-auto w-full max-w-sm"><Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-500"/><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search the full atlas clade" className="w-full rounded-lg border border-white/10 bg-black/30 py-2 pl-9 pr-3 text-[11px] outline-none focus:border-cyan-400/40"/></div><button onClick={onClose} className="rounded-md p-2 text-slate-400 hover:bg-white/10 hover:text-white" aria-label="Close clade explorer"><X className="h-4 w-4"/></button></header>
    <div className="grid min-h-0 flex-1 md:grid-cols-[minmax(260px,1fr)_minmax(260px,.8fr)]"><div className="overflow-y-auto scroll-thin p-4"><div className="meta-label mb-2">{query ? `${matches.length} search results` : 'All atlas branches'}</div><ul className="space-y-px">{query ? matches.map((node) => <Branch key={node.id} node={node} depth={2} selected={selectedTaxonId} onSelect={onSelect}/>) : TREE_OF_LIFE.map((node) => <Branch key={node.id} node={node} depth={0} selected={selectedTaxonId} onSelect={onSelect}/>)}</ul></div><aside className="border-l border-white/10 bg-black/15 p-5"><div className="meta-label">Selected lineage</div><div className="mt-4 flex flex-wrap gap-2">{lineage.length ? lineage.map((node) => <button key={node.id} onClick={() => onSelect(node.id)} className="rounded-full border border-white/10 bg-white/[.03] px-3 py-1.5 text-[11px] text-slate-300 hover:border-cyan-400/30 hover:text-cyan-100">{node.name}</button>) : <p className="text-[12px] leading-relaxed text-slate-400">Choose any branch to move the 3D atlas to that clade and reveal its ancestry.</p>}</div></aside></div>
  </section>;
};
