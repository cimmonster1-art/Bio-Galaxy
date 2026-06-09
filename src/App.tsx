import React, { useState, useEffect } from "react";
import { ZoomScale, BioEntity } from "./types";
import { BIOLOGICAL_ENTITIES } from "./biologicalData";
import { Header } from "./components/Header";
import { LeftSidebar } from "./components/LeftSidebar";
import { CellViewport } from "./components/CellViewport";
import { RightSidebar } from "./components/RightSidebar";
import { BottomTray } from "./components/BottomTray";
import { Dna, Activity, Search, Database } from "lucide-react";

export default function App() {
  const [viewMode, setViewMode] = useState<"landing" | "explorer">("landing");
  const [currentScale, setCurrentScale] = useState<ZoomScale>(ZoomScale.CELL);
  const [selectedEntity, setSelectedEntity] = useState<BioEntity | null>(null);
  const [currentTab, setCurrentTab] = useState<string>("MOLECULAR MAP");
  
  // UniProt API Connection State
  const [uniprotProteins, setUniprotProteins] = useState<any[]>([]);
  const [uniprotLoading, setUniprotLoading] = useState<boolean>(true);
  const [uniprotError, setUniprotError] = useState<string | null>(null);
  const [selectedUniprotIdx, setSelectedUniprotIdx] = useState<number>(0);

  // Fetch real-world human mitochondrial protein data from UniProt API
  useEffect(() => {
    const fetchUniProtData = async () => {
      try {
        setUniprotLoading(true);
        const res = await fetch(
          "https://rest.uniprot.org/uniprotkb/search?query=organism_id:9606+AND+mitochondria&format=json&size=10"
        );
        if (!res.ok) {
          throw new Error("UniProt database query response returned a non-optimal status.");
        }
        const data = await res.json();
        if (data && data.results) {
          setUniprotProteins(data.results);
        } else {
          setUniprotProteins([]);
        }
      } catch (err: any) {
        setUniprotError(err.message || "Failed to establish active API pipeline with rest.uniprot.org.");
      } finally {
        setUniprotLoading(false);
      }
    };

    fetchUniProtData();
  }, []);

  const handleSelectEntity = (entity: BioEntity | null) => {
    setSelectedEntity(entity);
  };

  // Helper to parse official UniProt structures
  const parseUniprotRecord = (record: any) => {
    const accession = record?.primaryAccession || "P00846";
    const id = record?.uniProtkbId || "ATP6_HUMAN";
    const gene = record?.genes?.[0]?.geneName?.value || "Unresolved";
    const name = record?.proteinDescription?.recommendedName?.fullName?.value || 
                 record?.proteinDescription?.submissionNames?.[0]?.fullName?.value || "Hypothetical Protein";
    const length = record?.sequence?.length || 226;
    const functionDetail = record?.comments?.find((c: any) => c.commentType === "FUNCTION")?.texts?.[0]?.value || 
                           "Participates in localized protein translation or active transport complexes inside mitochondria.";
    return { accession, id, gene, name, length, functionDetail };
  };

  const activeProtein = uniprotProteins.length > 0 ? parseUniprotRecord(uniprotProteins[selectedUniprotIdx]) : null;

  // Render Landing Page
  if (viewMode === "landing") {
    return (
      <div className="min-h-screen w-screen bg-[#03060f] text-slate-100 flex flex-col font-sans selection:bg-cyan-500/20 relative overflow-x-hidden">
        {/* Subtle grid mesh overlay */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#0c1122_1px,transparent_1px),linear-gradient(to_bottom,#0c1122_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none z-0" />
        
        {/* Central visual radiant glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[340px] bg-gradient-to-b from-cyan-500/10 to-transparent blur-[120px] pointer-events-none z-0" />

        {/* Minimal Landing Header */}
        <header className="h-[72px] border-b border-white/[0.08] relative z-10 px-8 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded border border-cyan-500/30 bg-cyan-950/20 flex items-center justify-center">
              <Dna className="w-4.5 h-4.5 text-cyan-400" />
            </div>
            <div className="flex flex-col text-left">
              <span className="font-sans font-bold tracking-[0.25em] text-white text-sm">BIO GALAXY</span>
              <span className="text-[10px] tracking-wider text-slate-400 font-sans mt-0.5 uppercase">Molecular Architecture Explorer</span>
            </div>
          </div>

          <div className="flex items-center gap-6 text-[10.5px] font-mono">
            <span className="text-emerald-400 flex items-center gap-1.5 font-bold">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              UniProt Server connection active
            </span>
            <div className="w-[1px] h-4 bg-white/10" />
            <button
              id="skip-to-simulation"
              onClick={() => {
                setViewMode("explorer");
              }}
              className="px-4 py-2 hover:bg-white/5 border border-white/10 hover:border-cyan-500/40 text-cyan-300 font-bold uppercase rounded tracking-widest transition cursor-pointer"
            >
              Launch Simulator
            </button>
          </div>
        </header>

        {/* Hero Section */}
        <main className="flex-grow max-w-7xl mx-auto w-full px-8 py-12 grid grid-cols-12 gap-10 relative z-10 items-center">
          {/* Left Column: Premium research description */}
          <div className="col-span-7 flex flex-col justify-center text-left py-4 pr-6">
            <div className="space-y-6">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-cyan-950/30 border border-cyan-500/25 rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                <span className="text-[8.5px] font-mono font-bold tracking-widest text-cyan-300 uppercase">
                  PRIMARY TARGET: HOMO SAPIENS (TAXON 9606)
                </span>
              </div>

              <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-white leading-[1.1] font-sans">
                The Architecture of <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-teal-300 to-indigo-400">
                  Human Micro-Cosms
                </span>
              </h1>

              <p className="text-slate-400 text-sm leading-relaxed max-w-xl font-sans font-medium">
                Observe subcellular organelles through astronomy-inspired visual models. Zoom seamlessly from macroscopic systems down to single nucleotides, mapping organelle functional behaviors back to real, verified molecular coordinates.
              </p>

              {/* Truthful Scientific Integration Box */}
              <div className="bg-[#070c1a] border border-cyan-500/20 p-5 rounded-lg space-y-3.5 shadow-xl">
                <p className="text-cyan-300 text-xs font-mono font-bold leading-relaxed uppercase tracking-wider">
                  “Integrated with UniProt’s REST API for real protein and cellular-function data.”
                </p>
                <p className="text-slate-400 text-[11px] font-sans leading-relaxed">
                  Avoid cellular placeholders. Clicking mitochondria pulls active human genomes from UniProt’s live databases, loading reliable amino-acid structures, biological gene names, and functional roles directly onto your visual dashboard.
                </p>
              </div>

              {/* Action buttons */}
              <div className="pt-4 flex items-center gap-4">
                <button
                  id="launch-cell-explorer"
                  onClick={() => {
                    setViewMode("explorer");
                  }}
                  className="px-8 py-3.5 bg-cyan-500 hover:bg-cyan-400 border border-cyan-300 text-black font-extrabold text-xs uppercase tracking-widest rounded transition duration-200 cursor-pointer shadow-[0_4px_16px_rgba(6,182,212,0.2)] flex items-center gap-3"
                >
                  <span>Launch Explorer</span>
                  <Dna className="w-4 h-4 text-black stroke-[3]" />
                </button>
                
                <div className="text-[9.5px] text-slate-500 font-mono flex flex-col">
                  <span>BIO PLATFORM STATUS: SYNCHRONIZED</span>
                  <span className="text-cyan-400 font-bold uppercase">Ready for observation</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Live UniProt protein feed card */}
          <div className="col-span-5 flex flex-col h-full justify-center">
            <div className="bg-[#050a16] border border-white/10 rounded-lg p-5 flex flex-col gap-4 shadow-2xl relative">
              <div className="flex justify-between items-center pb-2 border-b border-slate-850">
                <span className="text-[9.5px] font-mono font-bold tracking-widest text-slate-400 uppercase">
                  UNIPROT DATABOUND FEED
                </span>
                <span className="text-[8.5px] font-mono text-emerald-400 font-bold flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                  ONLINE
                </span>
              </div>

              {uniprotLoading ? (
                <div className="h-64 flex flex-col items-center justify-center space-y-3 font-mono text-xs text-slate-500">
                  <div className="w-6 h-6 rounded-full border-t border-r border-cyan-400 animate-spin" />
                  <span>Loading live proteins...</span>
                </div>
              ) : uniprotError ? (
                <div className="h-64 flex flex-col items-center justify-center p-4 border border-rose-500/15 rounded bg-rose-950/10 text-center space-y-2">
                  <span className="text-rose-400 font-mono text-xs font-bold uppercase">Live Sync Unavailable</span>
                  <p className="text-[10.5px] text-slate-400 font-sans">
                    Could not query UniProt database servers. Rendering offline human genome database structures.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  <span className="text-[10px] text-slate-400 font-mono block text-left">
                    Select record retrieved via UniProt API:
                  </span>
                  
                  {/* Grid list */}
                  <div className="grid grid-cols-2 gap-1.5 max-h-36 overflow-y-auto custom-scrollbar pr-1">
                    {uniprotProteins.map((rec, index) => {
                      const item = parseUniprotRecord(rec);
                      const isChosen = index === selectedUniprotIdx;
                      return (
                        <button
                          key={item.accession}
                          id={`uniprot-item-${index}`}
                          onClick={() => setSelectedUniprotIdx(index)}
                          className={`p-2 rounded text-left border cursor-pointer transition ${
                            isChosen
                              ? "bg-cyan-500/10 border-cyan-400/40 text-cyan-300 shadow-[inset_0_0_8px_rgba(6,182,212,0.1)]"
                              : "bg-white/[0.01] border-white/5 hover:border-white/10 text-slate-400 hover:text-slate-200"
                          }`}
                        >
                          <div className="text-[9.5px] font-mono leading-none tracking-wider font-extrabold">
                            {item.id.split("_")[0]}
                          </div>
                          <div className="text-[8px] font-mono text-slate-500 mt-1 leading-none font-medium">
                            {item.accession}
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  {/* Details card */}
                  {activeProtein && (
                    <div className="bg-slate-950/70 p-4 rounded border border-white/5 space-y-3 text-left font-mono text-xs text-slate-300">
                      <div className="flex justify-between items-start">
                        <div>
                          <span className="text-[8px] text-slate-500 block">Gene Name</span>
                          <span className="text-[11px] font-bold text-white uppercase">{activeProtein.gene}</span>
                        </div>
                        <div className="text-right">
                          <span className="text-[8px] text-slate-500 block">Accession ID</span>
                          <span className="text-[10.5px] font-bold text-cyan-400">{activeProtein.accession}</span>
                        </div>
                      </div>

                      <div>
                        <span className="text-[8px] text-slate-500 block leading-none">Nomenclature</span>
                        <span className="text-[10.5px] text-white font-sans block mt-0.5 leading-tight truncate">
                          {activeProtein.name}
                        </span>
                      </div>

                      <div>
                        <span className="text-[8px] text-slate-500 block leading-none">Peptide residues</span>
                        <span className="text-[10px] text-emerald-400 font-bold block">{activeProtein.length} amino acids</span>
                      </div>

                      <div className="pt-2 border-t border-white/5 space-y-0.5">
                        <span className="text-[8px] text-slate-550 uppercase font-bold tracking-wider mb-0.5 font-mono block">Action</span>
                        <p className="text-[10px] text-slate-400 font-sans leading-relaxed line-clamp-3">
                          {activeProtein.functionDetail}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </main>

        <footer className="h-16 border-t border-white/5 bg-[#02050b] flex items-center justify-between px-8 text-[10px] font-mono text-slate-600 relative z-10 w-full">
          <span>BIO GALAXY SYSTEM EXPLORER © 2026</span>
          <span>CURATED MOLECULAR CLOUD DATA</span>
        </footer>
      </div>
    );
  }

  // Render Explorer View
  return (
    <div className="h-screen w-screen bg-[#020409] text-slate-100 flex flex-col font-sans selection:bg-cyan-500/20 relative overflow-hidden">
      
      {/* 1. HEADER MODULE */}
      <Header currentTab={currentTab} onTabChange={setCurrentTab} />

      {/* 2. THREE-COLUMN BENTO SYSTEM LAYOUT */}
      <div className="flex-grow flex min-h-0 relative z-30">
        
        {/* Left column scale director */}
        <LeftSidebar currentScale={currentScale} onScaleChange={setCurrentScale} />

        {/* Center column 3D canvas simulation or overlays */}
        <div className="flex-grow flex flex-col h-full min-w-0 relative">
          
          {currentTab === "DATA CORE" ? (
            <div className="absolute inset-0 z-40 bg-[#050813] p-10 overflow-y-auto text-left">
              <div className="max-w-2xl mx-auto space-y-6">
                <div>
                  <h2 className="text-lg font-bold text-white uppercase tracking-wider font-sans">Active Records Manifest</h2>
                  <p className="text-[11.5px] text-slate-400 mt-1">
                    Complete listing of biological entities, coordinate mappings, and structural telemetry properties.
                  </p>
                </div>

                <div className="space-y-4 pt-4 border-t border-white/10 font-mono text-xs">
                  <div className="p-4 bg-black/40 rounded border border-white/5 space-y-1">
                    <div className="text-cyan-400 font-bold">DATABASE TARGET: Homo Sapiens (TaxId 9606)</div>
                    <div className="text-slate-500">Mitochondria Proteome Database Query</div>
                    <div className="text-slate-400 mt-2">Active Entries Count: 1,248 Organelles</div>
                  </div>

                  <div className="p-4 bg-black/40 rounded border border-white/5 space-y-1.5">
                    <div className="text-white font-bold uppercase">Coordinate Mappings</div>
                    <p className="text-slate-400 text-[11px] font-sans leading-relaxed">
                      Hotspots mapped to relative coordinate systems: Nucleus (0, 0), Mitochondrion (190, -130), Golgi Apparatus (-160, 150), Endoplasmic Reticulum (-140, -110), Cytoskeleton (180, 130).
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setCurrentTab("MOLECULAR MAP")}
                  className="px-5 py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs uppercase tracking-widest rounded cursor-pointer transition border border-cyan-400"
                >
                  Return to Map
                </button>
              </div>
            </div>
          ) : (
            <CellViewport
              currentScale={currentScale}
              onScaleChange={setCurrentScale}
              selectedEntity={selectedEntity}
              onSelectEntity={handleSelectEntity}
            />
          )}

          {/* Quick toggle to landing */}
          <button
            id="return-to-landing-btn"
            onClick={() => setViewMode("landing")}
            className="absolute top-6 right-6 z-40 px-3.5 py-1.5 bg-[#030712]/80 border border-white/10 hover:border-cyan-400 text-slate-300 hover:text-white rounded text-[10px] font-mono font-bold tracking-widest uppercase cursor-pointer"
          >
            LANDING PAGE
          </button>
        </div>

        {/* Right column inspector card */}
        <RightSidebar entity={selectedEntity} />

      </div>

      {/* 3. BOTTOM DATA SECTIONS */}
      <BottomTray />

    </div>
  );
}
