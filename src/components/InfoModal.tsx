import React from "react";
import { X, Info, Scale, Database, HelpCircle, Compass } from "lucide-react";

interface InfoModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const InfoModal: React.FC<InfoModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md transition-opacity">
      <div 
        id="info-modal-container"
        className="relative w-full max-w-2xl bg-[#030712] border border-cyan-500/25 rounded-lg shadow-[0_0_50px_rgba(6,182,212,0.15)] flex flex-col max-h-[85vh] overflow-hidden text-left"
      >
        {/* Modal Header */}
        <div className="h-14 border-b border-white/[0.08] bg-[#040917] px-6 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <Info className="w-4.5 h-4.5 text-cyan-400" />
            <span className="text-xs font-mono font-bold uppercase tracking-widest text-slate-100">
              Observatory Reference & Methodology
            </span>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 hover:bg-white/5 rounded transition cursor-pointer"
            aria-label="Close Reference Modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar font-sans text-xs text-slate-300">
          
          {/* Section 1: What is this? */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-cyan-400 font-mono font-bold uppercase tracking-wider text-[10.5px]">
              <Compass className="w-4 h-4 shrink-0" />
              <span>What is Bio Galaxy?</span>
            </div>
            <p className="leading-relaxed">
              Bio Galaxy is a 3D structural and systems biology visualizer. It consolidates open-access, raw global bio-data models (spanning Genomics, Proteomics, and Metabolomics) into an intuitive, seamlessly unified navigational interface. Scale and cellular elements are depicted using cosmic analogies to highlight the deep computational parallels between macroscopic and microscopic systems.
            </p>
          </div>

          {/* Section 2: How is everything calculated? */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-indigo-400 font-mono font-bold uppercase tracking-wider text-[10.5px]">
              <Scale className="w-4 h-4 shrink-0" />
              <span>How are values and layouts calculated?</span>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              
              <div className="bg-[#050b18] p-3.5 rounded border border-white/5 space-y-1.5">
                <span className="font-mono text-cyan-400 font-bold block leading-none uppercase text-[9px]">Somatic & Molecular Magnification</span>
                <p className="text-[10.5px] leading-relaxed text-slate-400">
                  Calculated using a base-10 logarithmic master coordinate system. Distances are projected mathematically from human metrics (1.8 meters) down to hydrogen electron orbits (10⁻¹² meters).
                </p>
              </div>

              <div className="bg-[#050b18] p-3.5 rounded border border-white/5 space-y-1.5">
                <span className="font-mono text-emerald-400 font-bold block leading-none uppercase text-[9px]">Macromolecular & Atomic Sizes</span>
                <p className="text-[10.5px] leading-relaxed text-slate-400">
                  Retrieved directly from crystallized structure matrices in the RCSB PDB and UniProt databases. Diameters are plotted using van der Waals shell dimensions.
                </p>
              </div>

              <div className="bg-[#050b18] p-3.5 rounded border border-white/5 space-y-1.5">
                <span className="font-mono text-purple-400 font-bold block leading-none uppercase text-[9px]">3D Orthographic Coordinates</span>
                <p className="text-[10.5px] leading-relaxed text-slate-400">
                  Calculated dynamically in React using vector projection algorithms, transforming 3D scientific coordinates in real-time onto 2D screen coordinate pixels.
                </p>
              </div>

              <div className="bg-[#050b18] p-3.5 rounded border border-white/5 space-y-1.5">
                <span className="font-mono text-amber-400 font-bold block leading-none uppercase text-[9px]">Metabolic Flux & Kinetics</span>
                <p className="text-[10.5px] leading-relaxed text-slate-400">
                  Stoichiometric values are modeled based on curated, peer-reviewed cellular pathways verified by Reactome. Flow indices simulate in-vivo respiratory rates.
                </p>
              </div>

            </div>
          </div>

          {/* Section 3: Data Provenance */}
          <div className="space-y-2.5">
            <div className="flex items-center gap-2 text-teal-400 font-mono font-bold uppercase tracking-wider text-[10.5px]">
              <Database className="w-4 h-4 shrink-0" />
              <span>Scientific Data Provenance</span>
            </div>
            <p className="leading-relaxed">
              All biological data parameters are directly synchronized with public, peer-reviewed, and curated repositories:
            </p>
            <ul className="list-disc pl-5 space-y-1.5 text-[10.5px] text-slate-400">
              <li><b>UniProt Consortium:</b> Underwrites cellular targets, functional attributes, sequence segments, and cellular compartmental localization.</li>
              <li><b>RCSB Protein Data Bank:</b> Delivers accurate structural coordinates, residue numbers, molecular weights, and element densities.</li>
              <li><b>Reactome Database:</b> Backs chemical kinetics, regulatory triggers, and sequential signaling pathways.</li>
            </ul>
          </div>

          {/* Section 4: Academic Disclaimer */}
          <div className="bg-[#0b1329] border border-cyan-500/15 p-4 rounded-lg space-y-2">
            <div className="flex items-center gap-2 text-cyan-400 font-mono font-bold text-[9px] uppercase">
              <HelpCircle className="w-4 h-4 shrink-0" />
              <span>Verification Disclaimer</span>
            </div>
            <p className="text-[10.5px] text-slate-350 leading-relaxed">
              Bio Galaxy functions exclusively as an interactive schematic overview for educational, visual reference, and conceptual instruction. <b>It is not certified or configured for medical diagnostics, diagnostic calculations, therapeutic modeling, clinical advice, or active healthcare workflows.</b>
            </p>
          </div>

        </div>

        {/* Modal Footer */}
        <div className="h-12 border-t border-white/[0.08] bg-[#040917] px-6 flex items-center justify-between shrink-0 font-mono text-[9px] text-slate-500 select-none">
          <span>CALCULATION PROVENANCE ENGINE: VERIFIED</span>
          <button 
            onClick={onClose}
            className="px-3.5 py-1 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded uppercase tracking-wider cursor-pointer transition border border-cyan-400"
          >
            Acknowledge
          </button>
        </div>
      </div>
    </div>
  );
};
