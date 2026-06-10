import React from 'react';
import { ExternalLink } from 'lucide-react';
import { useAsync } from '../../../hooks/useAsync';
import { rcsb } from '../../../data/clients';
import { Loader } from '../../ui/Loader';
import { ErrorNote } from '../../ui/ErrorNote';

interface Props {
  pdbId: string;
}

/**
 * Structure availability from RCSB PDB. Confirms a 3D structure exists and
 * exposes the canonical coordinate URL that ProteinStructureLayer can stream
 * for full rendering.
 */
export const StructureSection: React.FC<Props> = ({ pdbId }) => {
  const { data, loading, error } = useAsync(
    (signal) => rcsb.getStructureSummary(pdbId, { signal }),
    [pdbId],
  );

  return (
    <div>
      <div className="meta-label mb-2">Structure availability</div>
      {loading && <Loader label={`Checking PDB ${pdbId}`} />}
      {error && <ErrorNote message={error} />}
      {data && (
        <div className="space-y-1.5 text-[12px]">
          <div className="flex items-center justify-between">
            <span className="font-mono text-[11px] text-cyan-300">{data.pdbId}</span>
            <a
              href={`https://www.rcsb.org/structure/${data.pdbId}`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 text-[11px] text-slate-400 hover:text-cyan-300"
            >
              Open in RCSB <ExternalLink className="h-3 w-3" />
            </a>
          </div>
          <p className="leading-relaxed text-slate-400">{data.title}</p>
          <div className="flex flex-wrap gap-x-4 gap-y-1 pt-1 font-mono text-[11px] text-slate-300">
            {data.method && <span>{data.method}</span>}
            {data.resolution && <span>{data.resolution.toFixed(2)} Å</span>}
            {data.releaseDate && <span>{data.releaseDate}</span>}
          </div>
        </div>
      )}
    </div>
  );
};
