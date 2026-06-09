import React, { useState } from "react";
import { ZoomScale, BioEntity } from "./types";
import { BIOLOGICAL_ENTITIES } from "./biologicalData";
import { Header } from "./components/Header";
import { LeftSidebar } from "./components/LeftSidebar";
import { CellViewport } from "./components/CellViewport";
import { RightSidebar } from "./components/RightSidebar";
import { BottomTray } from "./components/BottomTray";
import { StructureViewer } from "./components/StructureViewer";
import { PathwayExplorer } from "./components/PathwayExplorer";
import { ProteinSearch } from "./components/ProteinSearch";
import { VercelDeployGuide } from "./components/VercelDeployGuide";
import { LandingPage } from "./components/LandingPage";
import { InfoModal } from "./components/InfoModal";

export default function App() {
  const [viewMode, setViewMode] = useState<"landing" | "explorer">("landing");
  const [currentScale, setCurrentScale] = useState<ZoomScale>(ZoomScale.CELL);
  const [selectedEntity, setSelectedEntity] = useState<BioEntity | null>(null);
  const [currentTab, setCurrentTab] = useState<string>("GALAXY VIEW");
  const [isInfoOpen, setIsInfoOpen] = useState<boolean>(false);
  
  // Quick navigation helpers to jump to specific tools from features
  const handleEnterAtlas = (tabName?: string) => {
    setViewMode("explorer");
    if (tabName) {
      setCurrentTab(tabName);
    }
  };

  const handleSelectEntity = (entity: BioEntity | null) => {
    setSelectedEntity(entity);
  };

  // Callback to handle organelle target focus from pathways
  const handleFocusOrganelle = (organelleId: string) => {
    const matched = BIOLOGICAL_ENTITIES[organelleId];
    if (matched) {
      setSelectedEntity(matched);
      setCurrentTab("GALAXY VIEW");
      if (organelleId === "mitochondrion") {
        setCurrentScale(ZoomScale.ORGANELLE);
      } else {
        setCurrentScale(ZoomScale.CELL);
      }
    }
  };

  // Scroll to details section on landing page
  const handleScrollToDataSources = () => {
    const el = document.getElementById("data-foundation-section");
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
    }
  };

  // Render Landing Page View
  if (viewMode === "landing") {
    return (
      <div className="relative">
        <LandingPage 
          onEnterAtlas={handleEnterAtlas}
          onOpenInfo={() => setIsInfoOpen(true)}
          onScrollToData={handleScrollToDataSources}
        />
        <InfoModal
          isOpen={isInfoOpen}
          onClose={() => setIsInfoOpen(false)}
        />
      </div>
    );
  }

  // Render Explorer View with working navigation tabs
  return (
    <div className="h-screen w-screen bg-[#020409] text-slate-100 flex flex-col font-sans selection:bg-cyan-500/20 relative overflow-hidden">
      
      {/* 1. HEADER MODULE */}
      <Header 
        currentTab={currentTab} 
        onTabChange={setCurrentTab} 
        onOpenInfo={() => setIsInfoOpen(true)}
      />

      {/* 2. THREE-COLUMN BENTO LAYOUT */}
      <div className="flex-grow flex min-h-0 relative z-30">
        
        {/* Left column scale navigation director */}
        <LeftSidebar currentScale={currentScale} onScaleChange={setCurrentScale} />

        {/* Center column - swap-replaced depending on selected tabs */}
        <div className="flex-grow flex flex-col h-full min-w-0 relative p-6 bg-[#010307]">
          
          {currentTab === "DATA CORE" ? (
            <ProteinSearch
              onSelectProtein={() => {
                // When "Load in 3D Viewer" is clicked, we automatically activate the molecule structure viewer!
                setCurrentTab("MOLECULAR MAP");
              }}
              onClose={() => setCurrentTab("GALAXY VIEW")}
            />
          ) : currentTab === "MOLECULAR MAP" ? (
            <StructureViewer
              proteinName="Myoglobin"
              accessionId="P01958"
              onClose={() => setCurrentTab("GALAXY VIEW")}
            />
          ) : currentTab === "SYSTEMS" ? (
            <PathwayExplorer
              onFocusOrganelle={handleFocusOrganelle}
              onClose={() => setCurrentTab("GALAXY VIEW")}
            />
          ) : currentTab === "SIMULATION" ? (
            <VercelDeployGuide />
          ) : (
            // GALAXY VIEW: The default cellular organelle interactive canvas map
            <CellViewport
              currentScale={currentScale}
              onScaleChange={setCurrentScale}
              selectedEntity={selectedEntity}
              onSelectEntity={handleSelectEntity}
            />
          )}

          {/* Clean, visible exit button to return to the beautiful biological landing page */}
          <button
            id="return-to-landing-btn"
            onClick={() => setViewMode("landing")}
            className="absolute top-4 right-4 z-40 px-3.5 py-1.5 bg-[#030712]/90 border border-white/10 hover:border-cyan-400 text-slate-300 hover:text-white rounded text-[9px] font-mono font-bold tracking-widest uppercase cursor-pointer"
          >
            LANDING PAGE
          </button>
        </div>

        {/* Right column organelle stats and overview card */}
        <RightSidebar entity={selectedEntity} />

      </div>

      {/* 3. BOTTOM DATA SECTIONS */}
      <BottomTray />

      {/* Reference Info Modal */}
      <InfoModal
        isOpen={isInfoOpen}
        onClose={() => setIsInfoOpen(false)}
      />

    </div>
  );
}
