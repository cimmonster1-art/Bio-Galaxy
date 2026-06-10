import React from 'react';
import { ChevronRight } from 'lucide-react';
import type { TaxonWorkspaceProps } from './types';

export const TaxonWorkspace: React.FC<TaxonWorkspaceProps> = ({ selectedTaxonId, selected, lineage, visibleChildren, onSelect }) => <main className="relative min-h-0 overflow-y-auto p-4 sm:p-6 scroll-thin life-tree-grid">
  <div className="mx-auto flex min-h-full max-w-4xl flex-col justify-center">
    <div className="meta-label mb-5">Selected lineage</div>
    <div className="flex flex-wrap items-center gap-2">{lineage.map((node, index, items) => <React.Fragment key={node.id}>
      <button type="button" onClick={() => onSelect(node.id)} className={`group rounded-lg border px-4 py-3 text-left transition ${node.id === selectedTaxonId ? 'border-cyan-400/50 bg-cyan-400/10' : 'border-white/10 bg-[#07101d]/90 hover:border-cyan-400/30'}`}>
        <span className="mb-2 block h-2 w-2 rounded-full" style={{ backgroundColor: `hsl(${node.hue} 70% 62%)` }} />
        <span className="block text-[12px] font-semibold text-slate-100">{node.name}</span><span className="meta-label mt-1 block">{node.rank}</span>
      </button>{index < items.length - 1 && <ChevronRight className="h-4 w-4 text-slate-700" />}
    </React.Fragment>)}</div>
    <div className="mt-8 border-t border-white/10 pt-6 sm:mt-12">
      <div className="meta-label mb-3">{selected ? `Branches within ${selected.name}` : 'Start with a domain'}</div>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">{visibleChildren.map((node) => <button key={node.id} type="button" onClick={() => onSelect(node.id)} className="rounded-lg border border-white/10 bg-[#07101d]/90 p-4 text-left transition hover:border-cyan-400/30 hover:bg-cyan-400/[.04]">
        <span className="mb-3 block h-1 w-10 rounded-full" style={{ backgroundColor: `hsl(${node.hue} 70% 62%)` }} /><span className="block text-[12px] font-semibold text-slate-100">{node.name}</span><span className="mt-1 block text-[10px] text-slate-500">{node.common ?? node.rank}</span>
      </button>)}</div>
    </div>
  </div>
</main>;
