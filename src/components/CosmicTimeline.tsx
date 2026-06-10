import React from 'react';
import { Scale } from '../types';
import { COSMIC_TIMELINE, eraForScale } from '../data/cosmos';

interface Props {
  scale: Scale;
  onSelectScale: (scale: Scale) => void;
}

/**
 * A timeline of the deep past, anchored at the Big Bang. Shown over the scene
 * during the cosmic era; each marker jumps the camera to that epoch's scale and
 * the active era is annotated with its approximate age.
 */
export const CosmicTimeline: React.FC<Props> = ({ scale, onSelectScale }) => {
  const active = eraForScale(scale);

  return (
    <div className="pointer-events-none absolute inset-x-0 top-16 z-20 flex flex-col items-center px-4">
      <div className="pointer-events-auto panel rounded-full px-2 py-1">
        <ol className="flex items-center gap-1">
          {COSMIC_TIMELINE.map((era) => {
            const isActive = active?.scale === era.scale;
            return (
              <li key={era.scale}>
                <button
                  onClick={() => onSelectScale(era.scale)}
                  className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] transition ${
                    isActive
                      ? 'bg-cyan-500/15 text-cyan-200'
                      : 'text-slate-400 hover:text-slate-100'
                  }`}
                >
                  <span
                    className={`h-1.5 w-1.5 rounded-full ${
                      isActive ? 'bg-cyan-400 shadow-[0_0_6px_#27c4d9]' : 'bg-slate-600'
                    }`}
                    aria-hidden
                  />
                  <span className="hidden sm:inline">{era.label}</span>
                  <span className="font-mono text-[10px] text-slate-500">{era.time}</span>
                </button>
              </li>
            );
          })}
        </ol>
      </div>
      {active && (
        <div className="mt-1.5 max-w-md text-center text-[11px] leading-relaxed text-slate-400">
          {active.detail}
        </div>
      )}
    </div>
  );
};
