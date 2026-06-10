import React, { useState } from 'react';
import { ExternalLink, ImageOff } from 'lucide-react';
import { useAsync } from '../../../hooks/useAsync';
import { wikipedia } from '../../../data/clients';
import { Loader } from '../../ui/Loader';
import { ErrorNote } from '../../ui/ErrorNote';

interface Props {
  title: string;
}

/**
 * Encyclopedic header card for the selected object. Pulls a thumbnail image and
 * a short extract from the public Wikipedia summary endpoint and renders them in
 * a polished card above the live database sections. Every object gets one, since
 * the title falls back to the object name when no explicit article is set.
 */
export const WikipediaSection: React.FC<Props> = ({ title }) => {
  const { data, loading, error } = useAsync(
    (signal) => wikipedia.getSummary(title, { signal }),
    [title],
  );
  const [imageFailed, setImageFailed] = useState(false);

  return (
    <div>
      <div className="meta-label mb-2">Encyclopedia</div>

      {loading && <Loader label="Fetching Wikipedia summary" />}
      {error && <ErrorNote message={error} />}

      {data && (
        <div className="overflow-hidden rounded-md border border-white/10 bg-white/[0.02]">
          {data.thumbnailUrl && !imageFailed ? (
            <img
              src={data.thumbnailUrl}
              alt={data.title}
              loading="lazy"
              onError={() => setImageFailed(true)}
              className="h-40 w-full bg-slate-900 object-cover"
            />
          ) : (
            <div className="flex h-24 w-full items-center justify-center bg-slate-900/60 text-slate-600">
              <ImageOff className="h-5 w-5" />
            </div>
          )}

          <div className="space-y-2 px-3 py-3">
            <div>
              <div className="text-[13px] font-semibold text-slate-100">{data.title}</div>
              {data.description && (
                <div className="mt-0.5 text-[11px] capitalize leading-snug text-cyan-300/80">
                  {data.description}
                </div>
              )}
            </div>

            {data.extract && (
              <div className="relative">
                <p className="text-[12px] leading-relaxed text-slate-400">
                  {clamp(data.extract)}
                </p>
                {data.extract.length > CLAMP && (
                  <div className="pointer-events-none absolute inset-x-0 bottom-0 h-6 bg-gradient-to-t from-[#0b0f17] to-transparent" />
                )}
              </div>
            )}

            <a
              href={data.pageUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 text-[11px] font-medium text-cyan-300 transition hover:text-cyan-200"
            >
              Read on Wikipedia
              <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        </div>
      )}
    </div>
  );
};

const CLAMP = 400;

function clamp(text: string, max = CLAMP): string {
  return text.length > max ? `${text.slice(0, max).trimEnd()}…` : text;
}
