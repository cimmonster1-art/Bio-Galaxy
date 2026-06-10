import React from 'react';
import { ErrorBoundary } from './ErrorBoundary';

export const AppErrorBoundary: React.FC<{ children: React.ReactNode }> = ({ children }) => <ErrorBoundary fallback={(_error, retry) => <main role="alert" className="grid min-h-screen place-items-center bg-[#02040a] p-6 text-center text-slate-100"><div className="max-w-md"><h1 className="text-xl font-semibold">Bio Galaxy encountered a problem</h1><p className="mt-3 text-sm text-slate-400">The interface stopped before the atlas could recover safely.</p><button type="button" onClick={retry} className="mt-5 rounded-md border border-cyan-400/30 px-4 py-2 text-sm text-cyan-100">Try again</button></div></main>}>{children}</ErrorBoundary>;
