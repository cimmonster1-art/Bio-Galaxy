import React, { useMemo, useState } from 'react';
import { ChevronRight, CornerLeftUp, Search } from 'lucide-react';
import { Panel } from '../ui/Panel';
import {
  TaxonNode,
  childrenOf,
  lineageOf,
  searchTaxa,
} from '../../data/taxonomy';

interface Props {
  /** id of the currently selected taxon, without the `taxon:` prefix. */
  selectedTaxonId: string | null;
  onSelectTaxon: (id: string) => void;
}

/**
 * Phylogenetic route panel. Drills through the Tree of Life rank by rank, shows
 * the active lineage as a breadcrumb, and offers a name search. Selecting a node
 * commits the camera to that rank and orients the galaxy toward the lineage.
 */
export const TaxonomyNavigator: React.FC<Props> = ({ selectedTaxonId, onSelectTaxon }) => {
  const [parentId, setParentId] = useState<string | null>(null);
  const [query, setQuery] = useState('');

  const lineage = useMemo(
    () => (selectedTaxonId ? lineageOf(selectedTaxonId) : []),
    [selectedTaxonId],
  );
  const children = useMemo(() => childrenOf(parentId), [parentId]);
  const results = useMemo(() => (query ? searchTaxa(query) : []), [query]);

  const drill = (node: TaxonNode): void => {
    onSelectTaxon(node.id);
    if (node.children.length > 0) setParentId(node.id);
  };

  const upOne = (): void => {
    if (!parentId) return;
    const path = lineageOf(parentId);
    setParentId(path.length > 1 ? path[path.length - 2].id : null);
  };

  return (
    <Panel eyebrow="Phylogeny" title="Tree of Life">
      <div className="flex items-center gap-2 rounded-sm border border-white/10 bg-black/30 px-2.5 py-1.5">
        <Search className="h-3.5 w-3.5 text-slate-500" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search taxa"
          className="w-full bg-transparent text-[12px] text-slate-200 placeholder:text-slate-600 focus:outline-none"
        />
      </div>

      {query ? (
        <ul className="mt-2.5 max-h-52 space-y-px overflow-y-auto scroll-thin pr-1">
          {results.map((node) => (
            <TaxonRow key={node.id} node={node} onClick={() => drill(node)} />
          ))}
          {results.length === 0 && (
            <li className="px-1 py-1 text-[12px] text-slate-500">No matching taxa.</li>
          )}
        </ul>
      ) : (
        <>
          {/* Lineage breadcrumb */}
          {lineage.length > 0 && (
            <div className="mt-2.5 flex flex-wrap items-center gap-x-1 gap-y-0.5">
              {lineage.map((n, i) => (
                <React.Fragment key={n.id}>
                  {i > 0 && <ChevronRight className="h-3 w-3 text-slate-600" />}
                  <button
                    onClick={() => onSelectTaxon(n.id)}
                    className={`text-[11px] ${
                      i === lineage.length - 1
                        ? 'font-medium text-cyan-300'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {n.name}
                  </button>
                </React.Fragment>
              ))}
            </div>
          )}

          <div className="mt-2.5 flex items-center justify-between">
            <span className="meta-label">
              {parentId ? lineageOf(parentId).map((n) => n.name).join(' › ') : 'Domains'}
            </span>
            {parentId && (
              <button
                onClick={upOne}
                className="inline-flex items-center gap-1 text-[11px] text-slate-400 hover:text-cyan-200"
              >
                <CornerLeftUp className="h-3 w-3" /> Up
              </button>
            )}
          </div>

          <ul className="mt-1.5 max-h-52 space-y-px overflow-y-auto scroll-thin pr-1">
            {children.map((node) => (
              <TaxonRow
                key={node.id}
                node={node}
                active={selectedTaxonId === node.id}
                onClick={() => drill(node)}
              />
            ))}
          </ul>
        </>
      )}
    </Panel>
  );
};

const TaxonRow: React.FC<{ node: TaxonNode; active?: boolean; onClick: () => void }> = ({
  node,
  active = false,
  onClick,
}) => (
  <li>
    <button
      onClick={onClick}
      className={`group flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-left transition ${
        active ? 'bg-cyan-500/10' : 'hover:bg-white/[0.03]'
      }`}
    >
      <span
        className="h-2 w-2 shrink-0 rounded-full"
        style={{ backgroundColor: `hsl(${node.hue} 70% 62%)` }}
        aria-hidden
      />
      <span className="min-w-0 flex-1">
        <span
          className={`block truncate text-[12px] ${
            node.rank === 'species' ? 'italic' : ''
          } ${active ? 'text-cyan-200' : 'text-slate-300 group-hover:text-slate-100'}`}
        >
          {node.name}
        </span>
      </span>
      <span className="meta-label shrink-0">{node.rank}</span>
      {node.children.length > 0 && (
        <ChevronRight className="h-3 w-3 shrink-0 text-slate-600 group-hover:text-cyan-300" />
      )}
    </button>
  </li>
);
