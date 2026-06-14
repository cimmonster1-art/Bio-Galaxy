import React from 'react';
import { ChevronLeft } from 'lucide-react';
import { useAtlasController } from '../hooks/useAtlasController';
import { AtlasCopilot } from './AtlasCopilot';
import { AtlasTopNav } from './AtlasTopNav';
import { AtlasWorkspaceView } from './AtlasWorkspaceView';
import { GlobalSearch } from './GlobalSearch';
import { LifeCladeExplorer } from './LifeCladeExplorer';
import { MobileAtlasDock } from './MobileAtlasDock';
import { WikipediaSidebar } from './WikipediaSidebar';
import { AnatomyModelsPanel } from './panels/AnatomyModelsPanel';
import { ContextPanel } from './panels/ContextPanel';
import { DataSourcesPanel } from './panels/DataSourcesPanel';
import { DetailPanel } from './panels/DetailPanel';
import { PhysicsPanel } from './panels/PhysicsPanel';
import { ScaleNavigatorPanel } from './panels/ScaleNavigatorPanel';

/** Composes the atlas regions while useAtlasController owns shared behavior. */
export const AtlasShell: React.FC<{ onExit: () => void }> = ({ onExit }) => {
  const atlas = useAtlasController();
  return <div className="atlas-shell flex h-screen w-screen flex-col bg-[#02040a] text-slate-100">
    <header className="atlas-header flex items-center gap-4 border-b border-white/10 px-4 py-2.5">
      <div className="flex shrink-0 items-center gap-3"><button onClick={onExit} aria-label="Return to home" className="flex items-center gap-1.5 rounded-sm border border-white/10 px-2.5 py-1 text-[11px] text-slate-300 transition hover:border-cyan-500/40 hover:text-cyan-200"><ChevronLeft className="h-3.5 w-3.5" aria-hidden /><span className="hidden sm:inline">Home</span></button><div className="flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-cyan-400 shadow-[0_0_8px_#27c4d9]" aria-hidden /><span className="text-[13px] font-semibold tracking-tight">Bio Galaxy</span></div></div>
      <div className="atlas-header-tools flex min-w-0 flex-1 items-center justify-center gap-2"><GlobalSearch onSelect={atlas.navigateTo} /><AtlasTopNav active={atlas.workspace} onChange={atlas.setWorkspace} /></div>
    </header>
    {atlas.workspace === 'life' ? <LifeCladeExplorer selectedTaxonId={atlas.selectedTaxonId} onSelect={atlas.selectTaxon} onClose={() => atlas.setWorkspace(null)} /> : <AtlasWorkspaceView atlas={atlas} />}
    {!atlas.workspace && <MobileAtlasDock active={atlas.mobilePanel} onChange={atlas.setMobilePanel} selectionName={atlas.selected?.name} navigate={<><ScaleNavigatorPanel scale={atlas.scale} onScaleChange={atlas.setScale} />{atlas.anatomyScale && <AnatomyModelsPanel activeId={atlas.activeModelId} status={atlas.modelStatus} onLoad={atlas.loadModelEntry} />}</>} inspect={<><WikipediaSidebar selected={atlas.selected} scale={atlas.scale} /><div className="min-h-[22rem] overflow-hidden rounded-lg border border-white/10 bg-[#04070f]"><DetailPanel selected={atlas.selected} /></div><ContextPanel scale={atlas.scale} selected={atlas.selected} /><PhysicsPanel selected={atlas.selected} /><DataSourcesPanel active={atlas.activeSources} /></>} />}
    <AtlasCopilot scale={atlas.scale} selected={atlas.selected} hovered={atlas.hovered} />
  </div>;
};
