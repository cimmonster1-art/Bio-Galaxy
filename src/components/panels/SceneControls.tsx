import React from 'react';
import { Minus, Plus } from 'lucide-react';
import { BioObject, Scale } from '../../types';
import { SCALE_LEVELS, FIRST_SCALE, LAST_SCALE } from '../../data/scales';

interface Props {
  scale: Scale;
  hovered: BioObject | null;
  onStep: (direction: 1 | -1) => void;
}

/** Floating zoom controls, scale readout, and a hover label over the canvas. */
export const SceneControls: React.FC<Props> = ({ scale, hovered, onStep }) => {
  const level = SCALE_LEVELS[scale];
  return (
    <>
      {/* Top-left scale readout */}
      <div className="pointer-events-none absolute left-3 top-3 sm:left-4 sm:top-4 z-20">
        <div className="meta-label">Current scale</div>
        <div className="text-[15px] font-semibold sm:text-lg text-slate-100">{level.name}</div>
        <div className="font-mono text-[11px] text-cyan-300/80">{level.magnitude}</div>
      </div>

      {/* Hover label */}
      {hovered && (
        <div className="pointer-events-none absolute left-1/2 top-4 z-20 -translate-x-1/2">
          <div className="panel rounded-sm px-3 py-1.5 text-center">
            <div className="text-[12px] font-medium text-slate-100">{hovered.name}</div>
            <div className="meta-label">{hovered.size}</div>
          </div>
        </div>
      )}

      {/* Zoom controls */}
      <div className="absolute bottom-[4.75rem] left-1/2 lg:bottom-4 z-20 flex -translate-x-1/2 items-center gap-1 rounded-md panel px-1.5 py-1.5">
        <button
          onClick={() => onStep(-1)}
          disabled={scale === FIRST_SCALE}
          title="Zoom out one scale"
          className="grid h-8 w-8 place-items-center rounded-sm text-slate-300 transition hover:bg-white/5 disabled:opacity-30"
        >
          <Minus className="h-4 w-4" />
        </button>
        <div className="px-2 text-center">
          <div className="meta-label leading-none">Zoom</div>
          <div className="font-mono text-[11px] text-slate-200">{level.unit}</div>
        </div>
        <button
          onClick={() => onStep(1)}
          disabled={scale === LAST_SCALE}
          title="Zoom in one scale"
          className="grid h-8 w-8 place-items-center rounded-sm text-slate-300 transition hover:bg-white/5 disabled:opacity-30"
        >
          <Plus className="h-4 w-4" />
        </button>
      </div>
    </>
  );
};
