import React from 'react';
import { ExternalLink } from 'lucide-react';
import { BioObject } from '../../../types';
import { taxonomy } from '../../../data/clients';

interface Props {
  selected: BioObject;
}

/**
 * Taxonomy provenance for a clade or species. Shows the NCBI Taxonomy rank and
 * identifier and links into the NCBI Taxonomy browser. The id is the seam where
 * the NCBI E-utilities client enriches the node with a live lineage.
 */
export const TaxonomySection: React.FC<Props> = ({ selected }) => {
  if (!selected.rank) return null;
  return (
    <div>
      <div className="meta-label mb-2">Taxonomy · NCBI</div>
      <dl className="space-y-1.5 text-[12px]">
        <Row label="Rank" value={selected.rank} />
        {selected.ncbiTaxId && (
          <div className="flex items-center justify-between gap-3">
            <dt className="meta-label shrink-0">NCBI tax id</dt>
            <dd className="text-right">
              <a
                href={taxonomy.taxonomyBrowserUrl(selected.ncbiTaxId)}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 font-mono text-[11px] text-cyan-300 hover:underline"
              >
                {selected.ncbiTaxId}
                <ExternalLink className="h-3 w-3" />
              </a>
            </dd>
          </div>
        )}
      </dl>
    </div>
  );
};

const Row: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div className="flex items-baseline justify-between gap-3">
    <dt className="meta-label shrink-0">{label}</dt>
    <dd className="text-right capitalize text-slate-200">{value}</dd>
  </div>
);
