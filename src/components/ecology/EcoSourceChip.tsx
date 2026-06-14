import React from 'react';
import { Database, ExternalLink } from 'lucide-react';
import { DataSourceId } from '../../types';
import { getSource } from '../../data/sources';

interface Props {
  source: DataSourceId;
  /** Optional deep link; falls back to the source homepage. */
  href?: string;
  label?: string;
}

/**
 * Linkable provenance chip for the Earth Ecology Explorer. Every ecological
 * metric and species exposes its source database, so a citation is always one
 * click from the data it backs.
 */
export const EcoSourceChip: React.FC<Props> = ({ source, href, label }) => {
  const s = getSource(source);
  return (
    <a
      href={href ?? s.homepage}
      target="_blank"
      rel="noreferrer"
      title={`${s.name} · ${s.domain}`}
      className="inline-flex items-center gap-1 rounded-full border border-cyan-400/20 bg-cyan-400/[0.06] px-2 py-0.5 font-mono text-[9px] uppercase tracking-wide text-cyan-200 transition hover:border-cyan-300/50 hover:bg-cyan-400/15 hover:text-cyan-100"
    >
      <Database className="h-2.5 w-2.5" aria-hidden />
      {label ?? s.short}
      <ExternalLink className="h-2.5 w-2.5 opacity-60" aria-hidden />
    </a>
  );
};
