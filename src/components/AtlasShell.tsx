import React, { useCallback, useMemo, useState } from 'react';
import { ChevronLeft } from 'lucide-react';
import { BioObject, PickTag, Scale } from '../types';
import { FIRST_SCALE, LAST_SCALE } from '../data/scales';
import { lineageOf } from '../data/taxonomy';
import { resolveObject } from '../data/resolve';
import { BioGalaxyCanvas } from './BioGalaxyCanvas';
import { ScaleNavigatorPanel } from './panels/ScaleNavigatorPanel';
import { ContextPanel } from './panels/ContextPanel';
import { DataSourcesPanel } from './panels/DataSourcesPanel';
import { TaxonomyNavigator } from './panels/TaxonomyNavigator';
import { DetailPanel } from './panels/DetailPanel';
import { SceneControls } from './panels/SceneControls';
import { ActivityStrip } from './panels/ActivityStrip';

interface Props {
  onExit: () => void;
}

const stripTaxon = (id: string): string => id.replace(/^taxon:|^organism:/, '');

/**
 * Top-level atlas layout. Holds the shared UI state (scale, selection, hover,
 * phylogenetic focus), wires the Three.js canvas to the surrounding panels, and
 * resolves pick tags into full biological records.
 */
export const AtlasShell: React.FC<Props> = ({ onExit }) => {
  const [scale, setScale] = useState<Scale>(Scale.TreeOfLife);
  const [selected, setSelected] = useState<BioObject | null>(null);
  const [hovered, setHovered] = useState<BioObject | null>(null);
  const [focusTaxonId, setFocusTaxonId] = useState<string | null>(null);

  // Apply a resolved object's natural scale and phylogenetic focus.
  const applySelection = useCallback((obj: BioObject) => {
    setSelected(obj);
    if (obj.id.startsWith('taxon:')) {
      setFocusTaxonId(obj.id);
      setScale(obj.scale);
    } else if (obj.id.startsWith('organism:')) {
      setFocusTaxonId(`taxon:${stripTaxon(obj.id)}`);
      setScale(Scale.Organism);
    }
  }, []);

  const handleHover = useCallback((tag: PickTag | null) => {
    setHovered(tag ? resolveObject(tag.id) ?? null : null);
  }, []);

  const handleSelect = useCallback(
    (tag: PickTag | null) => {
      if (!tag) {
        setSelected(null);
        return;
      }
      const obj = resolveObject(tag.id);
      if (obj) applySelection(obj);
    },
    [applySelection],
  );

  const handleScaleSettled = useCallback((s: Scale) => setScale(s), []);

  const selectTaxon = useCallback(
    (taxonId: string) => {
      const obj = resolveObject(`taxon:${taxonId}`);
      if (obj) applySelection(obj);
    },
    [applySelection],
  );

  const stepScale = useCallback((dir: 1 | -1) => {
    setScale((s) => Math.max(FIRST_SCALE, Math.min(LAST_SCALE, s + dir)) as Scale);
  }, []);

  const activeSources = useMemo(
    () => (selected ? [selected.source, ...(selected.crossRefs ?? [])] : []),
    [selected],
  );

  const lineage = useMemo(() => {
    const taxonId = focusTaxonId ? stripTaxon(focusTaxonId) : null;
    return taxonId ? lineageOf(taxonId).map((n) => n.name) : [];
  }, [focusTaxonId]);

  const selectedTaxonId = focusTaxonId ? stripTaxon(focusTaxonId) : null;
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
          Explore life from phylogeny to molecular structure
        </span>
      </header>

      <div className="flex min-h-0 flex-1">
        {/* Left column */}
        <aside className="hidden w-64 shrink-0 flex-col gap-3 overflow-y-auto scroll-thin border-r border-white/10 p-3 lg:flex">
          <ScaleNavigatorPanel scale={scale} onScaleChange={setScale} />
          <TaxonomyNavigator selectedTaxonId={selectedTaxonId} onSelectTaxon={selectTaxon} />
          <ContextPanel scale={scale} selected={selected} />
          <DataSourcesPanel active={activeSources} />
        </aside>

        {/* Center scene */}
        <main className="relative min-w-0 flex-1 depth-field">
          <BioGalaxyCanvas
            scale={scale}
            selectedId={selectedOrganelleId}
            focusTaxonId={focusTaxonId}
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

      <ActivityStrip scale={scale} selected={selected} lineage={lineage} />
    </div>
  );
};
