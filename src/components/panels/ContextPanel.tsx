import React from 'react';
import { BioObject, Scale } from '../../types';
import { SCALE_LEVELS } from '../../data/scales';
import { Panel } from '../ui/Panel';

interface Props {
  scale: Scale;
  selected: BioObject | null;
}

/** Current biological context: the active scale and any selected object. */
export const ContextPanel: React.FC<Props> = ({ scale, selected }) => {
  const level = SCALE_LEVELS[scale];
  return (
    <Panel eyebrow="Context" title={level.name}>
      <p className="text-[12px] leading-relaxed text-slate-400">{level.blurb}</p>
      <div className="mt-3 flex items-center justify-between border-t border-white/10 pt-2.5">
        <span className="meta-label">Magnitude</span>
        <span className="font-mono text-[11px] text-slate-300">{level.magnitude}</span>
      </div>
      {selected && (
        <div className="mt-2 flex items-center justify-between">
          <span className="meta-label">Selected</span>
          <span className="truncate font-mono text-[11px] text-cyan-300">{selected.name}</span>
        </div>
      )}
    </Panel>
  );
};
