import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ChevronLeft, Orbit, GitBranch, Volume2, VolumeX } from 'lucide-react';
import { BioObject, PickTag, Scale } from '../types';
import { FIRST_SCALE, LAST_SCALE } from '../data/scales';
import { lineageOf } from '../data/taxonomy';
import { resolveObject } from '../data/resolve';
import { rcsb } from '../data/clients';
import { useAsync } from '../hooks/useAsync';
import { ModelEntry } from '../data/modelCatalog';

import { BioGalaxyCanvas, OrganismModelRequest, StructurePayload } from './BioGalaxyCanvas';
import { GlobalSearch } from './GlobalSearch';
import { TimeScrubber } from './TimeScrubber';
import { CladogramView } from './evolution/CladogramView';
import { ScaleNavigatorPanel } from './panels/ScaleNavigatorPanel';
import { ContextPanel } from './panels/ContextPanel';
import { DataSourcesPanel } from './panels/DataSourcesPanel';
import { TaxonomyNavigator } from './panels/TaxonomyNavigator';
import { AnatomyModelsPanel, ModelStatus } from './panels/AnatomyModelsPanel';
import { AtlasSidebar } from './panels/AtlasSidebar';
import { SceneControls } from './panels/SceneControls';
import { ActivityStrip } from './panels/ActivityStrip';
<<<<<<< HEAD
import { createSoundscape, Soundscape } from '../audio/soundscape';
import { Epoch } from '../data/epochs';
=======
import { AnatomyExplorer } from './AnatomyExplorer';
import { AtlasCopilot } from './AtlasCopilot';
>>>>>>> origin/main

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
<<<<<<< HEAD
  // The human model loads by default so the organism scale shows a real mesh.
  const [organismModel, setOrganismModel] = useState<OrganismModelRequest | null>({
    url: DEFAULT_MODEL.url,
    label: DEFAULT_MODEL.label,
    sourceUrl: DEFAULT_MODEL.repoUrl,
  });
  const [activeModelId, setActiveModelId] = useState<string | null>(DEFAULT_MODEL.id);
  const [modelStatus, setModelStatus] = useState<ModelStatus>('loading');
  const [view, setView] = useState<'explore' | 'evolution'>('explore');
  const [simDate, setSimDate] = useState<Date | null>(null);
  const [muted, setMuted] = useState(false);

  // Sound design: a single soundscape, started on the first user gesture and
  // cued by scale changes, epoch entries, and selections.
  const soundRef = useRef<Soundscape | null>(null);
  useEffect(() => {
    soundRef.current = createSoundscape();
    return () => {
      soundRef.current?.dispose();
      soundRef.current = null;
    };
  }, []);
  const wakeSound = useCallback(() => {
    soundRef.current?.start();
  }, []);
  useEffect(() => {
    soundRef.current?.setScale(scale / Scale.Atom);
  }, [scale]);
  const toggleMute = useCallback(() => {
    setMuted((m) => {
      const next = !m;
      soundRef.current?.start();
      soundRef.current?.setMuted(next);
      return next;
    });
  }, []);

  const handleEpoch = useCallback(
    (epoch: Epoch) => {
      wakeSound();
      soundRef.current?.epochCue(epoch.id);
    },
    [wakeSound],
  );
=======
  // The layered Z-Anatomy reference visualization is the always-available default.
  const [organismModel, setOrganismModel] = useState<OrganismModelRequest | null>(null);
  const [activeModelId, setActiveModelId] = useState<string | null>(null);
  const [modelStatus, setModelStatus] = useState<ModelStatus>('idle');
>>>>>>> origin/main

  // Apply a resolved object's natural scale and phylogenetic focus.
  const applySelection = useCallback((obj: BioObject) => {
    soundRef.current?.uiClick();
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

  // Selection coming from the 2D cladogram in the Evolution tab.
  const selectByPickId = useCallback(
    (pickId: string) => {
      const obj = resolveObject(pickId);
      if (obj) applySelection(obj);
    },
    [applySelection],
  );

  const handleDate = useCallback((d: Date) => setSimDate(d), []);

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
<<<<<<< HEAD
=======
  const cosmicScale = scale <= Scale.Planet;
  const coreAnatomyScale = scale >= Scale.Organism && scale <= Scale.Organ;
>>>>>>> origin/main

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
        <div className="ml-1 flex shrink-0 items-center gap-1 rounded-full border border-white/10 p-0.5">
          <button
            onClick={() => {
              wakeSound();
              setView('explore');
            }}
            className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] transition ${
              view === 'explore' ? 'bg-cyan-500/20 text-cyan-200' : 'text-slate-400 hover:text-slate-100'
            }`}
          >
            <Orbit className="h-3.5 w-3.5" aria-hidden /> Explore
          </button>
          <button
            onClick={() => {
              wakeSound();
              setView('evolution');
            }}
            className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] transition ${
              view === 'evolution' ? 'bg-cyan-500/20 text-cyan-200' : 'text-slate-400 hover:text-slate-100'
            }`}
          >
            <GitBranch className="h-3.5 w-3.5" aria-hidden /> Evolution
          </button>
        </div>
        <div className="flex flex-1 justify-center">
          <GlobalSearch onSelect={navigateTo} />
        </div>
        <button
          onClick={toggleMute}
          aria-label={muted ? 'Unmute' : 'Mute'}
          className="flex shrink-0 items-center gap-1.5 rounded-sm border border-white/10 px-2 py-1 text-[11px] text-slate-300 transition hover:border-cyan-500/40 hover:text-cyan-200"
        >
          {muted ? <VolumeX className="h-3.5 w-3.5" aria-hidden /> : <Volume2 className="h-3.5 w-3.5" aria-hidden />}
          <span className="hidden sm:inline">{muted ? 'Muted' : 'Sound'}</span>
        </button>
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
            simulationDate={simDate}
            onHover={handleHover}
            onSelect={handleSelect}
            onScaleSettled={handleScaleSettled}
            onModelResult={handleModelResult}
          />
<<<<<<< HEAD

          {/* Evolution tab: a dense 2D cladogram over the live scene. */}
          {view === 'evolution' && (
            <div className="absolute inset-0 z-10 bg-[#02040a]">
              <CladogramView onSelect={selectByPickId} activeId={focusTaxonId} />
            </div>
          )}

          {view === 'explore' && (
            <>
              <SceneControls scale={scale} hovered={hovered} onStep={stepScale} />
              <TimeScrubber
                scale={scale}
                onSelectScale={setScale}
                onDate={handleDate}
                onEpoch={handleEpoch}
              />
            </>
          )}
=======
          <SceneControls scale={scale} hovered={hovered} onStep={stepScale} />
          {cosmicScale && <CosmicTimeline scale={scale} onSelectScale={setScale} />}
          {coreAnatomyScale && <AnatomyExplorer scale={scale} selectedId={selected?.id} onSelect={navigateTo} onScaleChange={setScale} />}
>>>>>>> origin/main
        </main>

        {/* Right column: the third-of-screen detail sidebar with copilot. */}
        <aside className="hidden w-[34%] min-w-[320px] max-w-[560px] shrink-0 border-l border-white/10 bg-[#04070f] md:block">
          <AtlasSidebar selected={selected} />
        </aside>
      </div>

      <ActivityStrip scale={scale} selected={selected} lineage={lineage} />
      <AtlasCopilot scale={scale} selected={selected} onNavigate={navigateTo} />
    </div>
  );
};
