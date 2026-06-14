import React from 'react';
import { useAsync } from '../../../hooks/useAsync';
import { pubchem } from '../../../data/clients';
import { Loader } from '../../ui/Loader';
import { ErrorNote } from '../../ui/ErrorNote';

interface Props {
  cid: number;
}

/** Live PubChem chemistry record for a small-molecule object. */
export const PubChemSection: React.FC<Props> = ({ cid }) => {
  const { data, loading, error } = useAsync(
    (signal) => pubchem.getCompound(cid, { signal }),
    [cid],
  );

  return (
    <div>
      <div className="meta-label mb-2">PubChem compound</div>
      {loading && <Loader label={`Fetching CID ${cid}`} />}
      {error && <ErrorNote message={error} />}
      {data && (
        <dl className="space-y-1.5 text-[12px]">
          <Row label="CID" value={String(data.cid)} mono />
          {data.formula && <Row label="Formula" value={data.formula} mono />}
          {data.molecularWeight && (
            <Row label="Mol. weight" value={`${data.molecularWeight} g/mol`} mono />
          )}
          {data.charge !== undefined && <Row label="Charge" value={String(data.charge)} mono />}
          {data.smiles && <Row label="SMILES" value={data.smiles} mono />}
          {data.inchiKey && <Row label="InChIKey" value={data.inchiKey} mono />}
          {data.iupacName && (
            <div className="pt-1">
              <div className="meta-label mb-1">IUPAC name</div>
              <p className="leading-relaxed text-slate-400">{data.iupacName}</p>
            </div>
          )}
          {data.synonyms.length > 0 && (
            <div className="pt-1">
              <div className="meta-label mb-1">Also known as</div>
              <p className="leading-relaxed text-slate-400">{data.synonyms.join(', ')}</p>
            </div>
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
    <dd
      className={`break-all text-right text-slate-200 ${mono ? 'font-mono text-[11px]' : ''}`}
    >
      {value}
    </dd>
  </div>
);
