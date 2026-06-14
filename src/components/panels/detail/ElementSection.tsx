import React from 'react';
import { useAsync } from '../../../hooks/useAsync';
import { pubchem } from '../../../data/clients';
import { Loader } from '../../ui/Loader';
import { ErrorNote } from '../../ui/ErrorNote';

interface Props {
  symbol: string;
}

/** Live PubChem periodic-table record for an atom object. */
export const ElementSection: React.FC<Props> = ({ symbol }) => {
  const { data, loading, error } = useAsync(
    (signal) => pubchem.getElement(symbol, { signal }),
    [symbol],
  );

  return (
    <div>
      <div className="meta-label mb-2">Periodic table</div>
      {loading && <Loader label={`Fetching element ${symbol}`} />}
      {error && <ErrorNote message={error} />}
      {data && (
        <dl className="space-y-1.5 text-[12px]">
          <Row label="Element" value={`${data.name} (${data.symbol})`} />
          <Row label="Atomic no." value={String(data.atomicNumber)} mono />
          {data.atomicMass && <Row label="Atomic mass" value={`${data.atomicMass} u`} mono />}
          {data.electronConfiguration && (
            <Row label="Electrons" value={data.electronConfiguration} mono />
          )}
          {data.electronegativity && (
            <Row label="Electroneg." value={data.electronegativity} mono />
          )}
          {data.oxidationStates && <Row label="Oxidation" value={data.oxidationStates} mono />}
          {data.groupBlock && <Row label="Block" value={data.groupBlock} />}
          {data.standardState && <Row label="State" value={data.standardState} />}
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
