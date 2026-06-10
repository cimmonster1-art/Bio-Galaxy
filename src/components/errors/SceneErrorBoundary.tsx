import React from 'react';
import { AlertTriangle, RotateCcw } from 'lucide-react';
import { ErrorBoundary } from './ErrorBoundary';

export const SceneErrorBoundary: React.FC<{ children: React.ReactNode; resetKey?: unknown }> = ({ children, resetKey }) => <ErrorBoundary resetKey={resetKey} fallback={(_error, retry) => <div role="alert" className="absolute inset-0 grid place-items-center bg-[#02060d] p-6 text-center">
  <div className="max-w-sm rounded-xl border border-amber-300/20 bg-amber-300/[.05] p-6"><AlertTriangle className="mx-auto h-6 w-6 text-amber-200" /><h2 className="mt-3 text-sm font-semibold text-slate-100">The 3D scene could not continue</h2><p className="mt-2 text-xs leading-relaxed text-slate-400">The surrounding atlas is still available. Retry the scene or choose another scale.</p><button type="button" onClick={retry} className="mt-4 inline-flex items-center gap-2 rounded-md border border-white/10 px-3 py-2 text-xs text-slate-200 hover:border-cyan-400/40"><RotateCcw className="h-3.5 w-3.5" /> Retry scene</button></div>
</div>}>{children}</ErrorBoundary>;
