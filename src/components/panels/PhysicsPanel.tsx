import React from 'react';
import { Atom } from 'lucide-react';
import { BioObject } from '../../types';
import { physicsFor } from '../../data/physics';
import { Panel } from '../ui/Panel';

interface Props { selected: BioObject | null; }

/**
 * The physics facet panel — the quantitative, "why does it behave this way?"
 * layer that the rest of the atlas doesn't cover. For a planet it shows gravity,
 * escape velocity, atmosphere, and magnetic field; for an atom, electron
 * configuration and quantum numbers; for a galaxy, dark matter and its rotation
 * curve. It renders only when the selection has physics to show.
 */
export const PhysicsPanel: React.FC<Props> = ({ selected }) => {
  const facets = selected ? physicsFor(selected) : [];
  if (!selected || facets.length === 0) return null;

  return (
    <Panel
      eyebrow="Physics"
      title={selected.name}
      right={<Atom className="h-4 w-4 text-cyan-300" aria-hidden />}
    >
      <ul className="space-y-2.5">
        {facets.map((facet) => (
          <li key={facet.label} className="border-b border-white/8 pb-2 last:border-0 last:pb-0">
            <div className="flex items-baseline justify-between gap-3">
              <span className="meta-label">{facet.label}</span>
              <span className="text-right font-mono text-[11px] text-cyan-200">{facet.value}</span>
            </div>
            {facet.note && <p className="mt-0.5 text-[10.5px] leading-snug text-slate-500">{facet.note}</p>}
          </li>
        ))}
      </ul>
    </Panel>
  );
};
