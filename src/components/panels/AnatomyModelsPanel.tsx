import React from 'react';
import { Box, ExternalLink, Loader2 } from 'lucide-react';
import { MODEL_CATALOG, ModelEntry } from '../../data/modelCatalog';
import { Panel } from '../ui/Panel';

export type ModelStatus = 'idle' | 'loading' | 'loaded' | 'error';

interface Props {
  activeId: string | null;
  status: ModelStatus;
  onLoad: (entry: ModelEntry) => void;
}

/**
 * Open organism models sourced from GitHub. Each entry loads a real glTF mesh at
 * the organism scale and cites its repository and license. If a model cannot be
 * reached the scene falls back to the procedural body, reported here as a
 * fallback rather than hidden.
 */
export const AnatomyModelsPanel: React.FC<Props> = ({ activeId, status, onLoad }) => (
  <Panel eyebrow="Organism models" title="Open 3D Models">
    <p className="mb-2.5 text-[11px] leading-relaxed text-slate-500">
      Real glTF organism meshes, loaded at the organism scale. The human body and skeleton ship from
      Z-Anatomy; the animal meshes stream from open GitHub repositories.
    </p>
    <ul className="space-y-1.5">
      {MODEL_CATALOG.map((entry) => {
        const active = entry.id === activeId;
        return (
          <li
            key={entry.id}
            className={`rounded-sm border px-2.5 py-2 transition ${
              active ? 'border-cyan-500/40 bg-cyan-500/5' : 'border-white/[0.06] bg-white/[0.02]'
            }`}
          >
            <div className="flex items-center justify-between gap-2">
              <button
                onClick={() => onLoad(entry)}
                className="flex min-w-0 items-center gap-2 text-left"
              >
                <Box className="h-3.5 w-3.5 shrink-0 text-cyan-300" aria-hidden />
                <span className="min-w-0">
                  <span className="block truncate text-[12px] text-slate-100">{entry.label}</span>
                  <span className="meta-label">{entry.organism}</span>
                </span>
              </button>
              {active && status === 'loading' && (
                <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin text-cyan-300" aria-label="Loading" />
              )}
              {active && status === 'loaded' && (
                <span className="meta-label shrink-0 text-emerald-400">Loaded</span>
              )}
              {active && status === 'error' && (
                <span className="meta-label shrink-0 text-amber-400">Fallback</span>
              )}
            </div>
            <div className="mt-1.5 flex items-center justify-between gap-2">
              <span className="meta-label truncate" title={entry.license}>
                {entry.license}
              </span>
              <a
                href={entry.repoUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex shrink-0 items-center gap-1 text-[10px] text-slate-500 hover:text-cyan-300"
              >
                {entry.repo.split('/')[0]} <ExternalLink className="h-2.5 w-2.5" />
              </a>
            </div>
          </li>
        );
      })}
    </ul>
  </Panel>
);
