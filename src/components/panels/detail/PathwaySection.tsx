import React from 'react';
import { useAsync } from '../../../hooks/useAsync';
import { reactome } from '../../../data/clients';
import { Loader } from '../../ui/Loader';
import { ErrorNote } from '../../ui/ErrorNote';

interface Props {
  reactomeId: string;
}

/** Reactome pathway context with its participating molecules. */
export const PathwaySection: React.FC<Props> = ({ reactomeId }) => {
  const { data, loading, error } = useAsync(
    (signal) => reactome.getPathway(reactomeId, { signal }),
    [reactomeId],
  );

  return (
    <div>
      <div className="meta-label mb-2">Pathway · Reactome</div>
      {loading && <Loader label="Loading pathway" />}
      {error && <ErrorNote message={error} />}
      {data && (
        <div>
          <div className="flex items-center justify-between gap-2">
            <span className="text-[12px] text-slate-200">{data.name}</span>
            <a
              href={`https://reactome.org/content/detail/${data.stId}`}
              target="_blank"
              rel="noreferrer"
              className="shrink-0 font-mono text-[10px] text-cyan-300 hover:underline"
            >
              {data.stId}
            </a>
          </div>
          {data.participants.length > 0 && (
            <>
              <div className="meta-label mb-1.5 mt-2.5">
                Participants ({data.participants.length})
              </div>
              <div className="flex flex-wrap gap-1">
                {data.participants.slice(0, 16).map((p) => (
                  <span
                    key={p.stId}
                    className="rounded-sm border border-white/[0.06] bg-white/[0.02] px-1.5 py-0.5 text-[10px] text-slate-400"
                  >
                    {p.name}
                  </span>
                ))}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};
