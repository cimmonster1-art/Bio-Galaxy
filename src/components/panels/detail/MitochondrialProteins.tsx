import React from 'react';
import { useAsync } from '../../../hooks/useAsync';
import { uniprot } from '../../../data/clients';
import { Loader } from '../../ui/Loader';
import { ErrorNote } from '../../ui/ErrorNote';

/**
 * UniProt MVP integration: when the mitochondrion is selected, fetch human
 * mitochondrial proteins directly from the documented UniProt endpoint and list
 * them with accessions and structure availability.
 */
export const MitochondrialProteins: React.FC = () => {
  const { data, loading, error } = useAsync(
    (signal) => uniprot.searchMitochondrialProteins({ signal }),
    [],
  );

  return (
    <div>
      <div className="meta-label mb-2">Resident proteins · UniProt</div>
      {loading && <Loader label="Querying UniProtKB" />}
      {error && <ErrorNote message={error} />}
      {data && (
        <ul className="space-y-1.5">
          {data.map((p) => (
            <li
              key={p.accession}
              className="rounded-sm border border-white/[0.06] bg-white/[0.02] px-2.5 py-1.5"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="truncate text-[12px] text-slate-200">{p.name}</span>
                <span className="shrink-0 font-mono text-[10px] text-cyan-300">
                  {p.accession}
                </span>
              </div>
              <div className="mt-0.5 flex items-center gap-3 font-mono text-[10px] text-slate-500">
                {p.geneName && <span>{p.geneName}</span>}
                {p.hasSequence && <span>{p.sequenceLength} aa</span>}
                {p.pdbIds.length > 0 && <span>{p.pdbIds.length} PDB</span>}
              </div>
            </li>
          ))}
          {data.length === 0 && (
            <li className="text-[12px] text-slate-500">No records returned.</li>
          )}
        </ul>
      )}
    </div>
  );
};
