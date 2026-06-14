import React from 'react';
import type { AtlasController } from '../hooks/useAtlasController';
import { AnatomyExplorer } from './AnatomyExplorer';
import { BioGalaxyCanvas } from './BioGalaxyCanvas';
import { BodyExplorer3D } from './BodyExplorer3D';
import { CosmicTimeline } from './CosmicTimeline';
import { EvolutionPlayback } from './EvolutionPlayback';
import { WikipediaSidebar } from './WikipediaSidebar';
import { ActivityStrip } from './panels/ActivityStrip';
import { AnatomyModelsPanel } from './panels/AnatomyModelsPanel';
import { ContextPanel } from './panels/ContextPanel';
import { DataSourcesPanel } from './panels/DataSourcesPanel';
import { DetailPanel } from './panels/DetailPanel';
import { ScaleNavigatorPanel } from './panels/ScaleNavigatorPanel';
import { SceneControls } from './panels/SceneControls';
import { SceneErrorBoundary } from './errors/SceneErrorBoundary';

export const AtlasWorkspaceView: React.FC<{ atlas: AtlasController }> = ({ atlas }) => <>
  <div className="flex min-h-0 flex-1">
    <aside className="hidden w-64 shrink-0 flex-col gap-3 overflow-y-auto scroll-thin border-r border-white/10 p-3 lg:flex">
      <ScaleNavigatorPanel scale={atlas.scale} onScaleChange={atlas.setScale} />
      {atlas.anatomyScale && <AnatomyModelsPanel activeId={atlas.activeModelId} status={atlas.modelStatus} onLoad={atlas.loadModelEntry} />}
      <ContextPanel scale={atlas.scale} selected={atlas.selected} /><DataSourcesPanel active={atlas.activeSources} />
    </aside>
    <main className="relative min-w-0 flex-1 depth-field" role="application" aria-label="Bio Galaxy 3D atlas. Use the search, scale ladder, or phylogeny panel to navigate.">
      <SceneErrorBoundary resetKey={atlas.coreAnatomyScale && !atlas.workspace ? 'organism' : atlas.scale}>
        {atlas.coreAnatomyScale && !atlas.workspace
          ? <BodyExplorer3D selectedId={atlas.selected?.id ?? null} onSelect={atlas.handleSelect} onHover={atlas.handleHover} />
          : <BioGalaxyCanvas scale={atlas.scale} selectedId={atlas.selected?.id ?? null} focusTaxonId={atlas.focusTaxonId} structure={atlas.structure} organismModel={atlas.organismModel} cinematicProgress={atlas.workspace === 'playback' ? atlas.cinematicProgress : null} onHover={atlas.handleHover} onSelect={atlas.handleSelect} onScaleSettled={atlas.setScale} onModelResult={atlas.handleModelResult} />}
      </SceneErrorBoundary>
      <SceneControls scale={atlas.scale} hovered={atlas.hovered} onStep={atlas.stepScale} />
      {atlas.workspace === 'eras' && <CosmicTimeline scale={atlas.scale} onSelectScale={atlas.setScale} onClose={() => atlas.setWorkspace(null)} />}
      {atlas.workspace === 'playback' && <EvolutionPlayback onSelectScale={atlas.setScale} onProgress={atlas.setCinematicProgress} onClose={() => atlas.setWorkspace(null)} />}
      {atlas.coreAnatomyScale && !atlas.workspace && <AnatomyExplorer scale={atlas.scale} selectedId={atlas.selected?.id} onSelect={atlas.navigateTo} onScaleChange={atlas.setScale} />}
    </main>
    <aside className="hidden w-[min(33.333vw,26rem)] shrink-0 flex-col border-l border-white/10 bg-[#04070f] lg:flex"><WikipediaSidebar selected={atlas.selected} scale={atlas.scale} /><div className="min-h-0 flex-1"><DetailPanel selected={atlas.selected} /></div></aside>
  </div>
  <div className="hidden lg:block"><ActivityStrip scale={atlas.scale} selected={atlas.selected} lineage={atlas.lineage} /></div>
</>;
