import React, { useState } from 'react';
import { ChevronRight } from 'lucide-react';
import type { TaxonNode } from '../../data/taxonomy';
import type { TaxonSelectionProps } from './types';

interface BranchProps extends TaxonSelectionProps {
  node: TaxonNode;
  depth: number;
}

const TaxonBranch: React.FC<BranchProps> = ({ node, depth, selectedTaxonId, onSelect }) => {
  const [open, setOpen] = useState(depth < 1);
  const selected = selectedTaxonId === node.id;
  return <li>
    <div className={`group flex items-center rounded-md ${selected ? 'bg-cyan-500/12' : 'hover:bg-white/[.035]'}`}>
      <button type="button" onClick={() => setOpen((value) => !value)} disabled={!node.children.length} className="p-2 text-slate-600 disabled:opacity-0" aria-label={`${open ? 'Collapse' : 'Expand'} ${node.name}`}>
        <ChevronRight className={`h-3 w-3 transition ${open ? 'rotate-90' : ''}`} />
      </button>
      <button type="button" onClick={() => onSelect(node.id)} className="flex min-w-0 flex-1 items-center gap-2 py-1.5 pr-2 text-left">
        <span className={`h-2 w-2 shrink-0 rounded-full transition ${selected ? 'bg-cyan-300' : 'bg-slate-600 group-hover:bg-cyan-400/60'}`} />
        <span className="min-w-0 flex-1 truncate text-[12px] text-slate-200">{node.name}</span>
        <span className="meta-label">{node.rank}</span>
      </button>
    </div>
    {open && node.children.length > 0 && <ul className="ml-4 border-l border-white/8 pl-2">
      {node.children.map((child) => <TaxonBranch key={child.id} node={child} depth={depth + 1} selectedTaxonId={selectedTaxonId} onSelect={onSelect} />)}
    </ul>}
  </li>;
};

interface Props extends TaxonSelectionProps {
  nodes: TaxonNode[];
  resultCount?: number;
}

export const TaxonBranchList: React.FC<Props> = ({ nodes, resultCount, ...selection }) => <aside className="max-h-44 overflow-y-auto border-b border-white/10 bg-black/10 p-3 scroll-thin lg:max-h-none lg:border-b-0 lg:border-r lg:p-4">
  <div className="meta-label mb-3">{resultCount === undefined ? 'All atlas branches' : `${resultCount} search results`}</div>
  <ul className="space-y-px">{nodes.map((node) => <TaxonBranch key={node.id} node={node} depth={resultCount === undefined ? 0 : 2} {...selection} />)}</ul>
</aside>;
