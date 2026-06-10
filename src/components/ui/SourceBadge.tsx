import React from 'react';
import { DataSourceId } from '../../types';
import { getSource } from '../../data/sources';

interface Props {
  source: DataSourceId;
  active?: boolean;
}

/** Compact provenance chip. Every database-backed object renders one. */
export const SourceBadge: React.FC<Props> = ({ source, active = false }) => {
  const s = getSource(source);
  return (
    <span
      title={`${s.name} · ${s.domain}`}
      className={`inline-flex items-center gap-1.5 rounded-sm border px-2 py-0.5 font-mono text-[10px] tracking-wide ${
        active
          ? 'border-cyan-500/40 bg-cyan-500/10 text-cyan-300'
          : 'border-white/10 bg-white/[0.02] text-slate-400'
      }`}
    >
      <span
        className={`h-1.5 w-1.5 rounded-full ${active ? 'bg-cyan-400' : 'bg-slate-500'}`}
      />
      {s.short}
    </span>
  );
};
