import React from 'react';
import { Scale } from '../../types';
import { SCALE_LEVELS } from '../../data/scales';
import { Panel } from '../ui/Panel';

interface Props {
  scale: Scale;
  onScaleChange: (scale: Scale) => void;
}

/**
 * The scale ladder. Selecting a level commits the camera to that biological
 * scale; the active level is emphasized and annotated with magnitude.
 */
export const ScaleNavigatorPanel: React.FC<Props> = ({ scale, onScaleChange }) => (
  <Panel eyebrow="Navigate" title="Scale">
    <ol className="space-y-px">
      {SCALE_LEVELS.map((level) => {
        const active = level.scale === scale;
        return (
          <li key={level.scale}>
            <button
              onClick={() => onScaleChange(level.scale)}
              className={`group flex w-full items-center gap-3 rounded-sm px-2 py-1.5 text-left transition ${
                active ? 'bg-cyan-500/10' : 'hover:bg-white/[0.03]'
              }`}
            >
              <span
                className={`h-4 w-px shrink-0 ${active ? 'bg-cyan-400' : 'bg-white/15'}`}
                aria-hidden
              />
              <span className="min-w-0 flex-1">
                <span
                  className={`block truncate text-[12px] font-medium ${
                    active ? 'text-cyan-200' : 'text-slate-300 group-hover:text-slate-100'
                  }`}
                >
                  {level.name}
                </span>
              </span>
              <span className="meta-label shrink-0">{level.magnitude}</span>
            </button>
          </li>
        );
      })}
    </ol>
  </Panel>
);
