import React, { useCallback, useMemo, useState } from 'react';
import { ChevronLeft } from 'lucide-react';
import { BioObject, PickTag, Scale } from '../types';
import { FIRST_SCALE, LAST_SCALE } from '../data/scales';
import { lineageOf } from '../data/taxonomy';
import { resolveObject } from '../data/resolve';
import { rcsb } from '../data/clients';
import { useAsync } from '../hooks/useAsync';
import { MODEL_CATALOG, ModelEntry } from '../data/modelCatalog';

import { BioGalaxyCanvas, OrganismModelRequest, StructurePayload } from './BioGalaxyCanvas';
import { GlobalSearch } from './GlobalSearch';
import { CosmicTimeline } from './CosmicTimeline';
import { ScaleNavigatorPanel } from './panels/ScaleNavigatorPanel';
import { ContextPanel } from './panels/ContextPanel';
import { DataSourcesPanel } from './panels/DataSourcesPanel';
import { TaxonomyNavigator } from './panels/TaxonomyNavigator';
import { AnatomyModelsPanel, ModelStatus } from './panels/AnatomyModelsPanel';
import { DetailPanel } from './panels/DetailPanel';
import { SceneControls } from './panels/SceneControls';
import { ActivityStrip } from './panels/ActivityStrip';
import { AnatomyExplorer } from './AnatomyExplorer';
import { AtlasCopilot } from './AtlasCopilot';

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
  const [scale, setScale] = useState<Scale>(Scale.Cosmos);
  const [selected, setSelected] = useState<BioObject | null>(null);
  const [hovered, setHovered] = useState<BioObject | null>(null);
  const [focusTaxonId, setFocusTaxonId] = useState<string | null>(null);
  // Load a real GLB body by default, then fit selectable anatomical systems inside it.
  const defaultHuman = MODEL_CATALOG.find((entry) => entry.id === 'human') ?? MODEL_CATALOG[0];
  const [organismModel, setOrganismModel] = useState<OrganismModelRequest | null>({ url: defaultHuman.url, label: defaultHuman.label, sourceUrl: defaultHuman.repoUrl });
  const [activeModelId, setActiveModelId] = useState<string | null>(defaultHuman.id);
  const [modelStatus, setModelStatus] = useState<ModelStatus>('loading');

  // Apply a resolved object's natural scale and phylogenetic focus.
  const applySelection = useCallback((obj: BioObject) => {
    setSelected(obj);
    if (obj.id.startsWith('taxon:')) {
      setFocusTaxonId(obj.id);
      setScale(obj.scale);
    } else if (obj.id.startsWith('organism:')) {
      setFocusTaxonId(`taxon:${stripTaxon(obj.id)}`);
      setScale(Scale.Organism);
    } else {
      setScale(obj.scale);
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

  // Search navigation always commits the camera to the chosen object's scale.
  const navigateTo = useCallback(
    (id: string) => {
      const obj = resolveObject(id);
      if (!obj) return;
      setSelected(obj);
      setScale(obj.scale);
      if (obj.id.startsWith('taxon:')) setFocusTaxonId(obj.id);
      else if (obj.id.startsWith('organism:')) setFocusTaxonId(`taxon:${stripTaxon(obj.id)}`);
    },
    [],
  );

  const stepScale = useCallback((dir: 1 | -1) => {
    setScale((s) => Math.max(FIRST_SCALE, Math.min(LAST_SCALE, s + dir)) as Scale);
  }, []);

  const loadModelEntry = useCallback((entry: ModelEntry) => {
    setActiveModelId(entry.id);
    setModelStatus('loading');
    setOrganismModel({ url: entry.url, label: entry.label, sourceUrl: entry.repoUrl });
    setScale(Scale.Organism);
  }, []);

  const handleModelResult = useCallback((ok: boolean) => {
    setModelStatus(ok ? 'loaded' : 'error');
  }, []);

  const activeSources = useMemo(
    () =>
      selected
        ? [...(selected.source ? [selected.source] : []), ...(selected.crossRefs ?? [])]
        : [],
    [selected],
  );

  const lineage = useMemo(() => {
    const taxonId = focusTaxonId ? stripTaxon(focusTaxonId) : null;
    return taxonId ? lineageOf(taxonId).map((n) => n.name) : [];
  }, [focusTaxonId]);

  // When a structure-backed object is selected, fetch its real PDB coordinates
  // and hand them to the scene to render as a live ball-and-stick model.
  const pdbId = selected?.pdbId ?? null;
  const structureState = useAsync(
    (signal) => rcsb.fetchStructure(pdbId as string, { signal }),
    [pdbId],
    Boolean(pdbId),
  );
  const structure = useMemo<StructurePayload | null>(
    () =>
      pdbId && structureState.data && selected
        ? { atoms: structureState.data.atoms, pickId: selected.id }
        : null,
    [pdbId, structureState.data, selected],
  );

  const selectedTaxonId = focusTaxonId ? stripTaxon(focusTaxonId) : null;
  const selectedOrganelleId = selected?.kind === 'organelle' ? selected.id : null;
  const anatomyScale = scale >= Scale.Organism && scale <= Scale.Tissue;
  const cosmicScale = scale <= Scale.Planet;
  const coreAnatomyScale = scale >= Scale.Organism && scale <= Scale.Organ;

  return (
    <div className="flex h-screen w-screen flex-col bg-[#02040a] text-slate-100">
      <header className="flex items-center gap-4 border-b border-white/10 px-4 py-2.5">
        <div className="flex shrink-0 items-center gap-3">
          <button
            onClick={onExit}
            aria-label="Return to home"
            className="flex items-center gap-1.5 rounded-sm border border-white/10 px-2.5 py-1 text-[11px] text-slate-300 transition hover:border-cyan-500/40 hover:text-cyan-200"
          >
            <ChevronLeft className="h-3.5 w-3.5" aria-hidden /> Home
          </button>
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-cyan-400 shadow-[0_0_8px_#27c4d9]" aria-hidden />
            <span className="text-[13px] font-semibold tracking-tight">Bio Galaxy</span>
          </div>
        </div>
        <div className="flex flex-1 justify-center">
          <GlobalSearch onSelect={navigateTo} />
        </div>
        <span className="meta-label hidden shrink-0 lg:block">
          Phylogeny to molecular structure
        </span>
      </header>

      <div className="flex min-h-0 flex-1">
        {/* Left column */}
        <aside className="hidden w-64 shrink-0 flex-col gap-3 overflow-y-auto scroll-thin border-r border-white/10 p-3 lg:flex">
          <ScaleNavigatorPanel scale={scale} onScaleChange={setScale} />
          <TaxonomyNavigator selectedTaxonId={selectedTaxonId} onSelectTaxon={selectTaxon} />
          {anatomyScale && (
            <AnatomyModelsPanel
              activeId={activeModelId}
              status={modelStatus}
              onLoad={loadModelEntry}
            />
          )}
          <ContextPanel scale={scale} selected={selected} />
          <DataSourcesPanel active={activeSources} />
        </aside>

        {/* Center scene */}
        <main
          className="relative min-w-0 flex-1 depth-field"
          role="application"
          aria-label="Bio Galaxy 3D atlas. Use the search, scale ladder, or phylogeny panel to navigate."
        >
          <BioGalaxyCanvas
            scale={scale}
            selectedId={selectedOrganelleId}
            focusTaxonId={focusTaxonId}
            structure={structure}
            organismModel={organismModel}
            onHover={handleHover}
            onSelect={handleSelect}
            onScaleSettled={handleScaleSettled}
            onModelResult={handleModelResult}
          />
          <SceneControls scale={scale} hovered={hovered} onStep={stepScale} />
          {cosmicScale && <CosmicTimeline scale={scale} onSelectScale={setScale} />}
          {coreAnatomyScale && <AnatomyExplorer scale={scale} selectedId={selected?.id} onSelect={navigateTo} onScaleChange={setScale} />}
        </main>

        {/* Right column */}
        <aside className="hidden w-80 shrink-0 border-l border-white/10 bg-[#04070f] md:block">
          <DetailPanel selected={selected} />
        </aside>
      </div>

      <ActivityStrip scale={scale} selected={selected} lineage={lineage} />
      <AtlasCopilot scale={scale} selected={selected} onNavigate={navigateTo} />
    </div>
  );
};
