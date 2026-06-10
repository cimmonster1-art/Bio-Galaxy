import React from 'react';
import { Loader2 } from 'lucide-react';

/** Inline loading indicator used by data-backed sections. */
export const Loader: React.FC<{ label?: string }> = ({ label = 'Loading' }) => (
  <div className="flex items-center gap-2 py-1 text-[12px] text-slate-400">
    <Loader2 className="h-3.5 w-3.5 animate-spin text-cyan-400" />
    <span>{label}</span>
  </div>
);
