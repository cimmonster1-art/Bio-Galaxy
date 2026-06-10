import React from 'react';
import { useAsync } from '../../../hooks/useAsync';
import { uniprot } from '../../../data/clients';
import { Loader } from '../../ui/Loader';
import { ErrorNote } from '../../ui/ErrorNote';

interface Props {
  accession: string;
}

/** Live UniProt record for a protein-backed object. */
export const UniProtSection: React.FC<Props> = ({ accession }) => {
  const { data, loading, error } = useAsync(
    (signal) => uniprot.getProtein(accession, { signal }),
    [accession],
  );

  return (
    <div>
      <div className="meta-label mb-2">UniProt record</div>
      {loading && <Loader label={`Fetching ${accession}`} />}
      {error && <ErrorNote message={error} />}
      {data && (
        <dl className="space-y-1.5 text-[12px]">
          <Row label="Accession" value={data.accession} mono />
          <Row label="Name" value={data.name} />
          {data.geneName && <Row label="Gene" value={data.geneName} mono />}
          <Row label="Organism" value={data.organism} />
          <Row
            label="Sequence"
            value={data.hasSequence ? `${data.sequenceLength} residues` : 'Not available'}
          />
          {data.function && (
            <div className="pt-1">
              <div className="meta-label mb-1">Function</div>
              <p className="leading-relaxed text-slate-400">{clamp(data.function)}</p>
            </div>
          )}
          {data.pdbIds.length > 0 && (
            <Row label="Structures" value={`${data.pdbIds.length} in PDB`} mono />
          )}
          {data.reactomeIds.length > 0 && (
            <Row label="Pathways" value={`${data.reactomeIds.length} in Reactome`} mono />
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

function clamp(text: string, max = 240): string {
  return text.length > max ? `${text.slice(0, max)}…` : text;
}
