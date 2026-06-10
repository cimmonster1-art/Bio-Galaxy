import React, { useCallback, useMemo, useState } from 'react';
import { ChevronLeft } from 'lucide-react';
import { BioObject, PickTag, Scale } from '../types';
import { resolveObject } from '../data/resolve';
import { BioGalaxyCanvas } from './BioGalaxyCanvas';
import { ScaleNavigatorPanel } from './panels/ScaleNavigatorPanel';
import { ContextPanel } from './panels/ContextPanel';
import { DataSourcesPanel } from './panels/DataSourcesPanel';
import { OrganismSearch } from './panels/OrganismSearch';
import { DetailPanel } from './panels/DetailPanel';
import { SceneControls } from './panels/SceneControls';
import { ActivityStrip } from './panels/ActivityStrip';

interface Props {
  onExit: () => void;
}

/**
 * Top-level atlas layout. Holds the shared UI state (scale, selection, hover),
 * wires the Three.js canvas to the surrounding panels, and resolves pick tags
 * into full biological records.
 */
export const AtlasShell: React.FC<Props> = ({ onExit }) => {
  const [scale, setScale] = useState<Scale>(Scale.Cell);
  const [selected, setSelected] = useState<BioObject | null>(null);
  const [hovered, setHovered] = useState<BioObject | null>(null);

  const handleHover = useCallback((tag: PickTag | null) => {
    setHovered(tag ? resolveObject(tag.id) ?? null : null);
  }, []);

  const handleSelect = useCallback((tag: PickTag | null) => {
    if (!tag) {
      setSelected(null);
      return;
    }
    const obj = resolveObject(tag.id);
    if (obj) setSelected(obj);
  }, []);

  const handleScaleSettled = useCallback((s: Scale) => {
    setScale(s);
  }, []);

  const selectOrganism = useCallback((id: string) => {
    const obj = resolveObject(id);
    if (obj) {
      setSelected(obj);
      setScale(Scale.Organism);
    }
  }, []);

  const stepScale = useCallback((dir: 1 | -1) => {
    setScale((s) => Math.max(Scale.Universe, Math.min(Scale.Atom, s + dir)) as Scale);
  }, []);

  const activeSources = useMemo(
    () => (selected ? [selected.source, ...(selected.crossRefs ?? [])] : []),
    [selected],
  );

  const macroScale = scale <= Scale.Organism;
  // Only organelles drive in-scene selection highlighting.
  const selectedOrganelleId = selected?.kind === 'organelle' ? selected.id : null;

  return (
    <div className="flex h-screen w-screen flex-col bg-[#02040a] text-slate-100">
      <header className="flex items-center justify-between border-b border-white/10 px-4 py-2.5">
        <div className="flex items-center gap-3">
          <button
            onClick={onExit}
            className="flex items-center gap-1.5 rounded-sm border border-white/10 px-2.5 py-1 text-[11px] text-slate-300 transition hover:border-cyan-500/40 hover:text-cyan-200"
          >
            <ChevronLeft className="h-3.5 w-3.5" /> Home
          </button>
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-cyan-400 shadow-[0_0_8px_#27c4d9]" />
            <span className="text-[13px] font-semibold tracking-tight">Bio Galaxy</span>
          </div>
        </div>
        <span className="meta-label hidden sm:block">
          A visual interface over public biological databases
        </span>
      </header>

      <div className="flex min-h-0 flex-1">
        {/* Left column */}
        <aside className="hidden w-64 shrink-0 flex-col gap-3 overflow-y-auto scroll-thin border-r border-white/10 p-3 lg:flex">
          <ScaleNavigatorPanel scale={scale} onScaleChange={setScale} />
          <ContextPanel scale={scale} selected={selected} />
          {macroScale && <OrganismSearch onSelectOrganism={selectOrganism} />}
          <DataSourcesPanel active={activeSources} />
        </aside>

        {/* Center scene */}
        <main className="relative min-w-0 flex-1 depth-field">
          <BioGalaxyCanvas
            scale={scale}
            selectedId={selectedOrganelleId}
            onHover={handleHover}
            onSelect={handleSelect}
            onScaleSettled={handleScaleSettled}
          />
          <SceneControls scale={scale} hovered={hovered} onStep={stepScale} />
        </main>

        {/* Right column */}
        <aside className="hidden w-80 shrink-0 border-l border-white/10 bg-[#04070f] md:block">
          <DetailPanel selected={selected} />
        </aside>
      </div>

      <ActivityStrip scale={scale} selected={selected} />
    </div>
  );
};
