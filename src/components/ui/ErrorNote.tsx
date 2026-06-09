import React from 'react';
import { AlertTriangle } from 'lucide-react';

/**
 * Defensive error state for data sections. Public databases can rate limit or
 * be briefly unreachable; the UI degrades to a clear note rather than breaking.
 */
export const ErrorNote: React.FC<{ message: string }> = ({ message }) => (
  <div className="flex items-start gap-2 rounded-sm border border-amber-500/20 bg-amber-500/[0.06] px-2.5 py-2 text-[11px] text-amber-200/90">
    <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-400" />
    <span>
      Source temporarily unavailable. <span className="text-amber-200/60">{message}</span>
    </span>
  </div>
);
