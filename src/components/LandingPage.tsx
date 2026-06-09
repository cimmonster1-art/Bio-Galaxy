import React from "react";
import { 
  Dna, 
  ArrowRight, 
  Search, 
  GitFork, 
  Database, 
  User, 
  Network, 
  Shield, 
  Grid, 
  Compass, 
  Layers, 
  Cpu, 
  Link2,
  Info
} from "lucide-react";

interface LandingPageProps {
  onEnterAtlas: (tabName?: string) => void;
  onOpenInfo: () => void;
  onScrollToData: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ 
  onEnterAtlas, 
  onOpenInfo,
  onScrollToData 
}) => {
  return (
    <div className="min-h-screen w-screen bg-[#020409] text-slate-100 flex flex-col font-sans selection:bg-cyan-500/20 relative overflow-x-hidden">
      
      {/* Dynamic Grid Background Mesh */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#0c1122_1px,transparent_1px),linear-gradient(to_bottom,#0c1122_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none z-0" />
      
      {/* Upper radial spotlight gradient */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[340px] bg-gradient-to-b from-cyan-500/5 to-transparent blur-[120px] pointer-events-none z-0" />

      {/* Header and Brand Actions */}
      <header className="h-[72px] shrink-0 border-b border-white/[0.06] relative z-20 px-8 flex items-center justify-between bg-[#03060f]/65 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded border border-cyan-500/20 bg-cyan-950/10 flex items-center justify-center">
            <Dna className="w-4.5 h-4.5 text-cyan-400" />
          </div>
          <div className="flex flex-col text-left">
            <span className="font-sans font-bold tracking-[0.22em] text-white text-sm">BIO GALAXY</span>
            <span className="text-[9px] tracking-wider text-slate-500 font-mono mt-0.5 uppercase">Interactive Biological Observatory</span>
          </div>
        </div>

        <div className="flex items-center gap-3.5">
          {/* Scientific Info Button ("i" dot) */}
          <button
            onClick={onOpenInfo}
            id="landing-info-dot"
            className="flex items-center gap-2 px-3 py-1.5 bg-cyan-950/20 hover:bg-cyan-900/30 text-cyan-400 border border-cyan-500/20 hover:border-cyan-400/45 rounded-md text-[10px] font-mono font-bold tracking-widest uppercase transition duration-150 cursor-pointer"
            title="How measurements are calculated and verified sources"
          >
            <Info className="w-3.5 h-3.5" />
            <span>REFERENCE INFO</span>
          </button>

          <button
            onClick={() => onEnterAtlas()}
            className="px-4.5 py-1.5 border border-white/10 hover:border-cyan-400/40 text-[10.5px] font-mono font-bold tracking-widest text-cyan-400 hover:text-white rounded uppercase transition duration-150 cursor-pointer"
          >
            Open Atlas
          </button>
        </div>
      </header>

      {/* Main visual layout row */}
      <main className="flex-grow max-w-7xl mx-auto w-full px-8 py-12 grid grid-cols-12 gap-8 relative z-10 items-center">
        
        {/* Left Column texts */}
        <div className="col-span-12 lg:col-span-6 flex flex-col justify-center text-left pr-0 lg:pr-8">
          <div className="space-y-6">
            
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#061125] border border-cyan-500/20 rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
              <span className="text-[8px] font-mono font-bold tracking-widest text-cyan-300 uppercase">
                INTEGRATED MOLECULAR BIOLOGY OBSERVATORY
              </span>
            </div>

            <h1 className="text-[34px] sm:text-[42px] font-extrabold tracking-tight text-white leading-[1.15] font-sans uppercase">
              Explore cells & structures as a <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-teal-300 to-indigo-400">
                navigable universe.
              </span>
            </h1>

            <p className="text-slate-400 text-xs sm:text-sm leading-relaxed max-w-xl font-sans font-medium">
              Bio Galaxy is a 3D biological atlas for exploring proteins, pathways, genes, and molecular structures through public scientific datasets. Zoom seamlessly across scale to map cell structure back to verified coordinates.
            </p>

            <div className="pt-2 flex flex-wrap items-center gap-3.5">
              <button
                onClick={() => onEnterAtlas()}
                className="px-7 py-3 bg-cyan-600 hover:bg-cyan-500 border border-cyan-400/25 text-white font-extrabold text-[11px] uppercase tracking-widest rounded transition duration-150 cursor-pointer flex items-center gap-2 leading-none"
              >
                <span>Launch Atlas</span>
                <ArrowRight className="w-3.5 h-3.5 stroke-[3]" />
              </button>
              
              <button
                onClick={onScrollToData}
                className="px-7 py-3 border border-white/10 hover:border-cyan-400/30 hover:bg-white/[0.02] text-slate-300 hover:text-white font-bold text-[11px] uppercase tracking-widest rounded transition duration-150 cursor-pointer"
              >
                View Data Sources
              </button>
            </div>

            <div className="pt-5 border-t border-white/[0.05] space-y-2">
              <span className="text-[9px] font-mono text-slate-500 uppercase tracking-widest block">
                Direct Databanks Provenance
              </span>
              <div className="flex flex-wrap gap-2">
                {["UniProt", "Reactome", "RCSB PDB", "Ensembl", "Human Protein Atlas", "NCBI"].map((tag) => (
                  <span
                    key={tag}
                    className="text-[9px] font-mono font-bold text-slate-400 border border-white/5 bg-[#050b18] px-2.5 py-1 rounded"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>

          </div>
        </div>

        {/* Right Column mockup display */}
        <div className="col-span-12 lg:col-span-6 flex flex-col justify-center">
          <div className="bg-[#050914] border border-white/[0.08] rounded-lg p-4.5 flex flex-col gap-3 shadow-2xl relative select-none">
            <div className="flex justify-between items-center pb-2 border-b border-white/[0.05]">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-cyan-400/80" />
                <span className="text-[9px] font-mono tracking-widest text-slate-400 uppercase font-bold">
                  VOLUMETRIC CELL VIEWPORT
                </span>
              </div>
              <div className="flex gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-white/10" />
                <span className="w-1.5 h-1.5 rounded-full bg-white/10" />
                <span className="w-1.5 h-1.5 rounded-full bg-white/10" />
              </div>
            </div>

            <div className="grid grid-cols-12 gap-3">
              <div className="col-span-3 border border-white/[0.05] p-2 rounded bg-black/40 text-left space-y-2 font-mono text-[7.5px] text-slate-500_">
                <div className="text-cyan-400 font-extrabold pb-1 border-b border-white/[0.05] text-[8px]">SCALE NAVIGATION</div>
                <div className="text-white mt-1">● CELL VIEW</div>
                <div className="text-slate-500">○ LYSOSOME</div>
                <div className="text-slate-500">○ CENTROSOME</div>
                <div className="text-white">● PROTEIN</div>
                <div className="text-slate-500">○ ATOM</div>
                <div className="h-6" />
                <div className="p-1.5 bg-cyan-950/20 text-cyan-400 rounded text-center font-extrabold border border-cyan-400/10 text-[7px]">
                  Zoom: 1.83x
                </div>
              </div>

              <div className="col-span-6 h-52 border border-white/[0.05] rounded relative overflow-hidden bg-[#02050c] flex items-center justify-center">
                <div className="absolute w-24 h-24 rounded-full border border-pink-500/20 flex items-center justify-center">
                  <div className="w-16 h-16 rounded-full border border-dashed border-cyan-400/25 animate-[spin_35s_linear_infinite]" />
                </div>
                
                <div className="absolute right-4 top-8 w-14 h-8 bg-amber-500/10 border border-amber-400/30 rounded-full flex items-center p-1">
                  <span className="text-[6px] font-mono text-amber-300 mx-auto">MITO_01</span>
                </div>

                <div className="absolute left-6 bottom-8 text-left space-y-0.5">
                  <span className="text-[6.5px] font-mono text-slate-500 block">LABEL // ACTIVE</span>
                  <span className="text-[8px] font-sans font-bold text-white block">CORE CHROMATIN</span>
                  <span className="text-[6px] font-mono text-cyan-400 block">Ident: P00846</span>
                </div>

                <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(6,182,212,0.015)_1px,transparent_1px),linear-gradient(to_bottom,rgba(6,182,212,0.015)_1px,transparent_1px)] bg-[size:15px_15px] pointer-events-none" />
              </div>

              <div className="col-span-3 border border-white/[0.05] p-2 rounded bg-black/40 text-left space-y-2.5 font-mono text-[7px] text-slate-500">
                <div className="pb-1 border-b border-white/[0.05] text-indigo-400 font-extrabold">OBSERVATORY METRICS</div>
                <div>
                  <span className="block text-[6px] text-slate-500 uppercase font-bold">ATP Turnover</span>
                  <span className="text-white font-bold block text-[8px]">2.47 mmol/s</span>
                </div>
                <div>
                  <span className="block text-[6px] text-slate-500 uppercase font-bold">Respiration</span>
                  <span className="text-emerald-400 font-bold block text-[8px]">98.2% (Homeo)</span>
                </div>
                <div className="pt-1.5 border-t border-white/[0.05]">
                  <span className="text-pink-400 font-bold">KINETICS: Reactome</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Structured Databank Cards Grid */}
      <section id="data-foundation-section" className="border-t border-white/[0.06] bg-[#02050b]/40 py-16 relative z-10">
        <div className="max-w-7xl mx-auto px-8 space-y-10 text-left">
          
          <div className="max-w-3xl space-y-2">
            <span className="text-[9px] font-mono font-bold text-cyan-400 uppercase tracking-[0.2em] block">
              01 // SCIENTIFIC DATABASE SYNCHRONY
            </span>
            <h2 className="text-2xl font-bold tracking-tight text-white uppercase font-sans">
              Structured raw knowledgebases
            </h2>
            <p className="text-slate-400 text-xs sm:text-sm leading-relaxed font-sans">
              Our observatory retrieves parameters, coordinate structures, and stoichiometric metrics live from primary academic databanks.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {[
              { title: "UniProtKB", tag: "Protein Meta", color: "text-cyan-400 bg-cyan-950/20 border-cyan-400/20", desc: "Accession identifiers, species variants, subcellular compartmentalization, and peer-reviewed literature citations." },
              { title: "Reactome", tag: "Metabolics", color: "text-purple-400 bg-purple-950/20 border-purple-400/20", desc: "Chemical reactions routes, participatory catalysts, signal cascades, and homeostatic cellular checkpoints." },
              { title: "RCSB PDB", tag: "Structures", color: "text-emerald-400 bg-emerald-950/20 border-emerald-400/20", desc: "Three-dimensional atomic configurations, secondary polypeptide structures, and crystallized molecular dimensions." },
              { title: "Ensembl", tag: "Genomics", color: "text-pink-400 bg-pink-950/20 border-pink-400/20", desc: "Chromosomal locus mapping, nucleotide structures, transcription triggers, and codon sequence data." },
              { title: "Protein Atlas", tag: "Tissues", color: "text-amber-400 bg-amber-950/20 border-amber-400/20", desc: "Validated localized tissue maps, histology slide controls, antibody bindings, and somatic expression levels." },
              { title: "NCBI Pubs", tag: "Publications", color: "text-indigo-400 bg-indigo-950/20 border-indigo-400/20", desc: "Literature references, taxid taxonomy catalogs, nucleotide sequence queries, and academic study summaries." }
            ].map((card) => (
              <div key={card.title} className="bg-[#040815] p-5 rounded-lg border border-white/5 space-y-3 hover:border-cyan-500/25 transition duration-150">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-200 uppercase font-sans">{card.title}</span>
                  <span className={`text-[8px] font-mono uppercase tracking-widest font-extrabold border px-2 py-0.5 rounded ${card.color}`}>
                    {card.tag}
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed font-sans">
                  {card.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Scale ladder segment */}
      <section className="border-t border-white/[0.06] bg-[#02050c] py-16 relative z-10">
        <div className="max-w-7xl mx-auto px-8 space-y-10 text-left">
          <div className="max-w-3xl space-y-2">
            <span className="text-[9px] font-mono font-bold text-cyan-400 uppercase tracking-[0.2em] block">
              02 // STRUCTURAL RESOLUTIONS
            </span>
            <h2 className="text-2xl font-bold tracking-tight text-white uppercase font-sans">
              Organism down to structural atoms
            </h2>
            <p className="text-slate-400 text-xs sm:text-sm leading-relaxed font-sans">
              Seamlessly explore the biological coordinate spectrum, translating dimensions from macroscopic human scales down to individual atomic electron footprints.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-9 gap-3">
            {[
              { name: "Human", num: "01", icon: User },
              { name: "Organ System", num: "02", icon: Network },
              { name: "Organ", num: "03", icon: Shield },
              { name: "Tissue", num: "04", icon: Grid },
              { name: "Cell", num: "05", icon: Compass },
              { name: "Organelle", num: "06", icon: Layers },
              { name: "Protein Group", num: "07", icon: Cpu },
              { name: "Molecule", num: "08", icon: Link2 },
              { name: "Atom Scale", num: "09", icon: Database }
            ].map((layer) => {
              const IconComp = layer.icon;
              return (
                <div key={layer.name} className="p-3.5 rounded bg-[#040815] border border-white/5 flex flex-col justify-between items-start space-y-4">
                  <div className="flex justify-between items-center w-full">
                    <div className="w-6.5 h-6.5 rounded bg-cyan-950/20 border border-cyan-400/10 flex items-center justify-center">
                      <IconComp className="w-3.5 h-3.5 text-cyan-400" />
                    </div>
                    <span className="text-[8.5px] font-mono font-bold text-slate-550">{layer.num}</span>
                  </div>
                  <div className="text-[10px] font-bold text-slate-200 uppercase font-sans leading-tight">
                    {layer.name}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Core visual tab quick launchers */}
      <section className="border-t border-white/[0.06] bg-[#02050b]/40 py-16 relative z-10">
        <div className="max-w-7xl mx-auto px-8 space-y-10 text-left">
          <div className="max-w-3xl space-y-2">
            <span className="text-[9px] font-mono font-bold text-cyan-400 uppercase tracking-[0.2em] block">
              03 // OBSERVATORY SCIENTIFIC SUITES
            </span>
            <h2 className="text-2xl font-bold tracking-tight text-white uppercase font-sans">
              Interactive Bio-Intelligence Suites
            </h2>
            <p className="text-slate-400 text-xs sm:text-sm leading-relaxed font-sans">
              Trigger any of our analytical modules designed directly for live data investigation.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {[
              { tab: "DATA CORE", icon: Search, title: "Protein Search Core", desc: "Verify sequence weights, functional locations, and annotations straight from UniProt. Input UniProt accessions directly to download dynamic structural metadata.", btn: "Launch Search Core", border: "hover:border-cyan-400/25" },
              { tab: "SYSTEMS", icon: GitFork, title: "Pathways Cascade", desc: "Map chemical kinetics, cell signaling networks, and biological cascade events from Reactome. Highlight pathways to identify their target organs.", btn: "Launch Reactor Map", border: "hover:border-purple-400/25" },
              { tab: "MOLECULAR MAP", icon: Database, title: "3D Molecular coordinates", desc: "Compile experimentally derived atomic structures inside an interactive orthographic viewport. Render elements with secondary helix highlights.", btn: "Launch 3D Render", border: "hover:border-emerald-400/25" }
            ].map((suite) => {
              const IconComp = suite.icon;
              return (
                <div key={suite.tab} className={`bg-[#040815] border border-white/5 rounded-lg p-5.5 flex flex-col justify-between transition duration-150 space-y-5 ${suite.border}`}>
                  <div className="space-y-2.5">
                    <div className="w-8 h-8 rounded bg-slate-900 border border-white/10 flex items-center justify-center">
                      <IconComp className="w-4 h-4 text-cyan-400" />
                    </div>
                    <h3 className="text-xs font-bold uppercase text-white font-sans tracking-wide">
                      {suite.title}
                    </h3>
                    <p className="text-slate-400 text-[11px] leading-relaxed font-sans">
                      {suite.desc}
                    </p>
                  </div>
                  <button
                    onClick={() => onEnterAtlas(suite.tab)}
                    className="w-full py-2 bg-cyan-950/20 border border-cyan-500/20 hover:border-cyan-400 rounded text-[9.5px] font-mono font-bold tracking-widest text-cyan-400 hover:text-white uppercase transition cursor-pointer"
                  >
                    {suite.btn}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Footer disclaimer */}
      <footer className="border-t border-white/[0.05] bg-[#02050b] py-10 shrink-0 relative z-10 text-slate-500 text-[10px] font-sans">
        <div className="max-w-7xl mx-auto px-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="text-left space-y-1">
            <div className="font-sans font-bold tracking-widest text-white uppercase text-[11px]">
              BIO GALAXY SYSTEMS
            </div>
            <p className="text-[10px] text-slate-600">
              Computational visualization of cellular architectures.
            </p>
          </div>
          <div className="text-left max-w-sm leading-normal border-l border-white/[0.05] pl-4 text-slate-600">
            DISCLAIMER: Prepared exclusively for visual reference, education, and research mapping. Not certified or configured for medical diagnostics.
          </div>
          <div className="font-mono text-[9px] text-slate-700">
            © 2026 BIO GALAXY SYSTEMS // ALL SYSTEM LICENSES SECURE
          </div>
        </div>
      </footer>

    </div>
  );
};
