import React from 'react';
import { ExternalLink } from 'lucide-react';
import { useAsync } from '../../../hooks/useAsync';
import { alphafold } from '../../../data/clients';
import { Loader } from '../../ui/Loader';
import { ErrorNote } from '../../ui/ErrorNote';

interface Props {
  accession: string;
}

/** Live AlphaFold predicted-structure record for a protein object. */
export const AlphaFoldSection: React.FC<Props> = ({ accession }) => {
  const { data, loading, error } = useAsync(
    (signal) => alphafold.getPrediction(accession, { signal }),
    [accession],
  );

  return (
    <div>
      <div className="meta-label mb-2">AlphaFold prediction</div>
      {loading && <Loader label={`Fetching ${accession}`} />}
      {error && <ErrorNote message={error} />}
      {data && (
        <dl className="space-y-1.5 text-[12px]">
          <Row label="Entry" value={data.entryId} mono />
          {data.gene && <Row label="Gene" value={data.gene} mono />}
          {data.organism && <Row label="Organism" value={data.organism} />}
          {data.sequenceLength !== undefined && (
            <Row label="Length" value={`${data.sequenceLength} residues`} mono />
          )}
          {data.modelVersion !== undefined && (
            <Row label="Model" value={`v${data.modelVersion}`} mono />
          )}
          {data.createdDate && <Row label="Released" value={data.createdDate} mono />}
          {data.pdbUrl && (
            <a
              href={data.pdbUrl}
              target="_blank"
              rel="noreferrer"
              className="mt-1 inline-flex items-center gap-1.5 text-[11px] text-cyan-300 hover:text-cyan-200"
            >
              <ExternalLink className="h-3 w-3" /> Download predicted model
            </a>
          )}
        </dl>
      )}
    </div>
  );
};

const Row: React.FC<{ label: string; value: string; mono?: boolean }> = ({
  label,
  value,
  mono,
}) => (
  <div className="flex items-baseline justify-between gap-3">
    <dt className="meta-label shrink-0">{label}</dt>
    <dd className={`text-right text-slate-200 ${mono ? 'font-mono text-[11px]' : ''}`}>
      {value}
    </dd>
  </div>
);
