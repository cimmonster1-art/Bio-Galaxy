import React from 'react';
import { Database } from 'lucide-react';
import type { TaxonNode } from '../../data/taxonomy';

export const TaxonRecord: React.FC<{ selected: TaxonNode | null }> = ({ selected }) => <aside className="hidden overflow-y-auto border-l border-white/10 bg-black/15 p-5 scroll-thin lg:block">
  <div className="meta-label">Taxon record</div>
  {selected ? <div className="mt-5">
    <span className="mb-4 block h-2.5 w-2.5 rounded-full" style={{ backgroundColor: `hsl(${selected.hue} 70% 62%)` }} /><h2 className="text-xl font-semibold text-slate-100">{selected.name}</h2><p className="mt-1 text-[12px] text-slate-400">{selected.common ?? 'No common name in the local atlas.'}</p>
    <dl className="mt-6 space-y-4 border-t border-white/10 pt-5"><div><dt className="meta-label">Rank</dt><dd className="mt-1 text-[12px] capitalize text-slate-200">{selected.rank}</dd></div><div><dt className="meta-label">NCBI taxonomy ID</dt><dd className="mt-1 font-mono text-[12px] text-cyan-200">{selected.ncbiTaxId}</dd></div><div><dt className="meta-label">Direct branches</dt><dd className="mt-1 text-[12px] text-slate-200">{selected.children.length}</dd></div></dl>
    <div className="mt-7 rounded-lg border border-white/10 bg-white/[.025] p-3"><div className="flex items-center gap-2 text-[11px] font-semibold text-slate-200"><Database className="h-3.5 w-3.5 text-cyan-300" /> NCBI Taxonomy</div><p className="mt-2 text-[10px] leading-relaxed text-slate-500">Taxonomy identifiers provide the source reference for this atlas branch.</p></div>
  </div> : <p className="mt-4 text-[12px] leading-relaxed text-slate-400">Choose any branch to inspect its lineage, children, and source identifier.</p>}
</aside>;
