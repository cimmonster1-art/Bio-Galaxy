import React from 'react';
import { BioObject, Scale } from '../../types';
import { SCALE_LEVELS } from '../../data/scales';
import { DATA_SOURCE_ORDER } from '../../data/sources';

interface Props {
  scale: Scale;
  selected: BioObject | null;
  /** Names along the active phylogenetic lineage, broad to fine. */
  lineage: string[];
}

/** The active scene layer for a given scale, for the layer readout. */
function activeLayer(scale: Scale): string {
  if (scale >= Scale.TreeOfLife) return 'Classification';
  if (scale <= Scale.Galaxy) return 'Cosmos';
  if (scale === Scale.SolarSystem) return 'Solar System';
  if (scale === Scale.Planet) return 'Earth';
  if (scale === Scale.Biome) return 'Biome';
  if (scale <= Scale.Organ) return 'Anatomy';
  if (scale === Scale.Tissue) return 'Tissue';
  if (scale <= Scale.Organelle) return 'Cell';
  return 'Molecular';
}

/**
 * Bottom status strip: data source state, the active scale and layer, the
 * selected lineage, and the current selection. Plain counts and labels, no
 * inflated metrics.
 */
export const ActivityStrip: React.FC<Props> = ({ scale, selected, lineage }) => {
  const lineageText = lineage.length > 0 ? lineage.join(' › ') : '—';

  return (
    <div className="flex items-center gap-6 overflow-x-auto scroll-thin border-t border-white/10 bg-[#04070f] px-4 py-2">
      <Item label="Scale" value={SCALE_LEVELS[scale].name} />
      <Item label="Layer" value={activeLayer(scale)} />
      <Item label="Magnitude" value={SCALE_LEVELS[scale].magnitude} />
      <Item label="Lineage" value={lineageText} className="max-w-[34ch] truncate" />
      <Item label="Selection" value={selected ? selected.name : 'None'} />
      <Item label="Sources" value={String(DATA_SOURCE_ORDER.length)} />
      <div className="ml-auto flex shrink-0 items-center gap-2">
        <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
        <span className="meta-label">Built on public biological datasets</span>
      </div>
    </div>
  );
};

const Item: React.FC<{ label: string; value: string; className?: string }> = ({
  label,
  value,
  className,
}) => (
  <div className="flex shrink-0 items-baseline gap-2">
    <span className="meta-label">{label}</span>
    <span className={`font-mono text-[11px] text-slate-200 ${className ?? ''}`}>{value}</span>
  </div>
);
