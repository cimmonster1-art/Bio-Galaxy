import React from 'react';
import { Scale } from '../../types';
import { SCALE_LEVELS } from '../../data/scales';
import { Panel } from '../ui/Panel';

interface Props {
  scale: Scale;
  onScaleChange: (scale: Scale) => void;
}

interface Group {
  label: string;
  from: Scale;
  to: Scale;
}

// The ladder is long, so it is grouped into navigable regimes along the single
// continuous physical journey from the cosmos to the atom.
const GROUPS: Group[] = [
  { label: 'Cosmos', from: Scale.Cosmos, to: Scale.Planet },
  { label: 'Living World', from: Scale.Biome, to: Scale.Biome },
  { label: 'Anatomy', from: Scale.Organism, to: Scale.Tissue },
  { label: 'Cellular', from: Scale.Cell, to: Scale.Organelle },
  { label: 'Molecular', from: Scale.ProteinComplex, to: Scale.Atom },
];

/**
 * The scale ladder, grouped into cosmic, living-world, anatomy, cellular, and
 * molecular regimes. Selecting a level commits the camera to that physical
 * scale. Taxonomy is intentionally absent here — it lives in the secondary
 * Evolution / Classification mode.
 */
export const ScaleNavigatorPanel: React.FC<Props> = ({ scale, onScaleChange }) => (
  <Panel eyebrow="Navigate" title="Scale Ladder">
    <div className="space-y-3">
      {GROUPS.map((group) => (
        <div key={group.label}>
          <div className="meta-label mb-1">{group.label}</div>
          <ol className="space-y-px">
            {SCALE_LEVELS.slice(group.from, group.to + 1).map((level) => {
              const active = level.scale === scale;
              return (
                <li key={level.scale}>
                  <button
                    onClick={() => onScaleChange(level.scale)}
                    className={`group flex w-full items-center gap-2.5 rounded-sm px-2 py-1 text-left transition ${
                      active ? 'bg-cyan-500/10' : 'hover:bg-white/[0.03]'
                    }`}
                  >
                    <span
                      className={`h-3.5 w-px shrink-0 ${active ? 'bg-cyan-400' : 'bg-white/15'}`}
                      aria-hidden
                    />
                    <span
                      className={`min-w-0 flex-1 truncate text-[12px] ${
                        active
                          ? 'font-medium text-cyan-200'
                          : 'text-slate-300 group-hover:text-slate-100'
                      }`}
                    >
                      {level.name}
                    </span>
                    <span className="meta-label shrink-0">{level.magnitude}</span>
                  </button>
                </li>
              );
            })}
          </ol>
        </div>
      ))}
    </div>
  </Panel>
);
