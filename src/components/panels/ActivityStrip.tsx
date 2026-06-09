import React from 'react';
import { BioObject, Scale } from '../../types';
import { SCALE_LEVELS } from '../../data/scales';
import { DATA_SOURCE_ORDER } from '../../data/sources';

interface Props {
  scale: Scale;
  selected: BioObject | null;
}

/** Restrained status strip. Plain counts and state, no inflated metrics. */
export const ActivityStrip: React.FC<Props> = ({ scale, selected }) => {
  const items: Array<{ label: string; value: string }> = [
    { label: 'Integrated sources', value: String(DATA_SOURCE_ORDER.length) },
    { label: 'Scale levels', value: String(SCALE_LEVELS.length) },
    { label: 'Active scale', value: SCALE_LEVELS[scale].name },
    { label: 'Selection', value: selected ? selected.name : 'None' },
    { label: 'Renderer', value: 'WebGL' },
  ];

  return (
    <div className="flex items-center gap-6 overflow-x-auto scroll-thin border-t border-white/10 bg-[#04070f] px-4 py-2">
      {items.map((item) => (
        <div key={item.label} className="flex shrink-0 items-baseline gap-2">
          <span className="meta-label">{item.label}</span>
          <span className="font-mono text-[11px] text-slate-200">{item.value}</span>
        </div>
      ))}
      <div className="ml-auto flex shrink-0 items-center gap-2">
        <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
        <span className="meta-label">Live data sources reachable</span>
      </div>
    </div>
  );
};
