import React from 'react';
import { DataSourceId } from '../../types';
import { DATA_SOURCE_ORDER, getSource } from '../../data/sources';
import { Panel } from '../ui/Panel';

interface Props {
  /** Sources referenced by the current selection, highlighted as active. */
  active: DataSourceId[];
}

/** Lists the integrated databases and marks which back the current view. */
export const DataSourcesPanel: React.FC<Props> = ({ active }) => {
  const activeSet = new Set(active);
  return (
    <Panel eyebrow="Integration" title="Data Sources">
      <ul className="space-y-1.5">
        {DATA_SOURCE_ORDER.map((id) => {
          const s = getSource(id);
          const on = activeSet.has(id);
          return (
            <li key={id} className="flex items-center gap-2.5">
              <span
                className={`h-1.5 w-1.5 shrink-0 rounded-full ${
                  on ? 'bg-cyan-400 shadow-[0_0_6px_#27c4d9]' : 'bg-slate-600'
                }`}
              />
              <span className={`text-[12px] ${on ? 'text-slate-200' : 'text-slate-500'}`}>
                {s.name}
              </span>
              <span className="meta-label ml-auto truncate">{s.domain}</span>
            </li>
          );
        })}
      </ul>
    </Panel>
  );
};
