import React, { useState } from "react";
import { GitFork, ArrowRight, Compass, ShieldAlert, Link2, ExternalLink } from "lucide-react";

interface PathwayStep {
  name: string;
  reaction: string;
  description: string;
  catalyst: string;
  organelleId: "cytoplasme" | "mitochondrion" | "nucleus" | "golgi_apparatus" | "endoplasmic_reticulum";
}

interface Pathway {
  id: string;
  name: string;
  category: string;
  summary: string;
  officialId: string;
  steps: PathwayStep[];
}

const BIO_PATHWAYS: Pathway[] = [
  {
    id: "tca_cycle",
    name: "Citric Acid (TCA) Cycle",
    category: "Metabolism",
    officialId: "R-HSA-71403",
    summary: "Consists of a loop of enzymatic actions inside the mitochondrial matrix yielding chemical hydrogen vectors (NADH/FADH2) to power ATP synthesis.",
    steps: [
      {
        name: "Synthesis of Citrate",
        reaction: "Acetyl-CoA + Oxaloacetate + H2O → Citrate + CoA-SH",
        description: "Enzyme citrate synthase joins two carbon units onto oxaloacetate to generate the core citrate acid.",
        catalyst: "Citrate Synthase",
        organelleId: "mitochondrion"
      },
      {
        name: "Isomerization of Citrate",
        reaction: "Citrate ↔ Cis-Aconitate ↔ Isocitrate",
        description: "Water extraction and re-addition positions the hydroxyl groups for upcoming oxidation steps.",
        catalyst: "Aconitase",
        organelleId: "mitochondrion"
      },
      {
        name: "Oxidation & Decarboxylation",
        reaction: "Isocitrate + NAD+ → Alpha-Ketoglutarate + CO2 + NADH",
        description: "Yields the first chemical high-energy NADH vector and releases respiratory carbon dioxide.",
        catalyst: "Isocitrate Dehydrogenase",
        organelleId: "mitochondrion"
      },
    ],
  },
  {
    id: "glycolysis",
    name: "Glycolysis",
    category: "Metabolism",
    officialId: "R-HSA-70171",
    summary: "Converts glucose monosaccharide into high-energy pyruvate units directly in the cell cytosol.",
    steps: [
      {
        name: "Phosphorylation of Glucose",
        reaction: "Glucose + ATP → Glucose-6-Phosphate + ADP",
        description: "Hexokinase adds a negative phosphate onto glucose, trapping the sugar inside the cell envelope.",
        catalyst: "Hexokinase-4",
        organelleId: "cytoplasme"
      },
      {
        name: "Fructose-6-phosphate phosphorylation",
        reaction: "Fructose-6-P + ATP → Fructose-1,6-Bisphosphate + ADP",
        description: "The primary control valve of glycolysis, highly regulated by cellular charge state.",
        catalyst: "Phosphofructokinase-1",
        organelleId: "cytoplasme"
      },
      {
        name: "Cleavage into Triose Sugars",
        reaction: "Fructose-1,6-BP ↔ DHAP + G3P",
        description: "Splits a single six-carbon ring into two active three-carbon aldehyde chains.",
        catalyst: "Aldolase",
        organelleId: "cytoplasme"
      },
    ],
  },
  {
    id: "apoptosis",
    name: "Intrinsic Apoptosis Signal Pathway",
    category: "Cellular Regulation",
    officialId: "R-HSA-109581",
    summary: "Programmed cellular suicide sequence triggered by metabolic stress, releasing mitochondrial Cytochrome c to terminate cell replication safely.",
    steps: [
      {
        name: "MOMP Pore Construction",
        reaction: "Bax activation and oligomerization",
        description: "Stressed Bax proteins migrate to mitochondria outer membrane to perforate active holes.",
        catalyst: "Bcl-2 family ligands",
        organelleId: "mitochondrion"
      },
      {
        name: "Cytochrome C Release",
        reaction: "Cytochrome c transport → Cytoplasmic matrix",
        description: "Soluble electron carriers leak through perforated outer shells into general cytoplasm.",
        catalyst: "Bax/Bak pore",
        organelleId: "mitochondrion"
      },
      {
        name: "Apoptosome assembly",
        reaction: "Cytochrome C + Apaf-1 + Procaspase-9 → Apoptosome complex",
        description: "Assembles multi-subunit rotary complexes triggering proteolytic caspase cascades.",
        catalyst: "Apaf-1 complex",
        organelleId: "cytoplasme"
      },
    ],
  }
];

interface PathwayExplorerProps {
  onFocusOrganelle?: (organelleId: string) => void;
  onClose?: () => void;
}

export const PathwayExplorer: React.FC<PathwayExplorerProps> = ({
  onFocusOrganelle,
  onClose,
}) => {
  const [selectedPathwayId, setSelectedPathwayId] = useState<string>("tca_cycle");
  const [activeStepIndex, setActiveStepIndex] = useState<number>(0);

  const activePathway = BIO_PATHWAYS.find((p) => p.id === selectedPathwayId) || BIO_PATHWAYS[0];
  const activeStep = activePathway.steps[activeStepIndex] || activePathway.steps[0];

  return (
    <div className="flex-1 min-w-0 bg-[#02050c] flex flex-col relative rounded-md border border-white/[0.08] overflow-hidden">
      
      {/* Upper header action bar */}
      <div className="h-12 border-b border-white/[0.08] bg-[#03060f]/90 px-4 flex items-center justify-between shrink-0 select-none">
        <div className="flex items-center gap-2">
          <GitFork className="w-4.5 h-4.5 text-cyan-400 rotate-90" />
          <span className="text-[11px] font-mono tracking-widest font-extrabold uppercase text-slate-100">
            REACTOME PROTOCOL MAPS
          </span>
        </div>

        {onClose && (
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white text-[10.5px] font-mono font-bold uppercase tracking-wider px-2.5 py-1 rounded border border-white/5 hover:border-rose-500/20 hover:bg-rose-950/10 transition cursor-pointer"
          >
            Exit Pathway Maps
          </button>
        )}
      </div>

      <div className="flex-grow grid grid-cols-12 overflow-hidden h-full">
        {/* Left Column - List of standard Reactome pathways */}
        <div className="col-span-4 border-r border-white/[0.05] p-4 space-y-1 overflow-y-auto bg-black/25">
          <span className="text-[8px] font-mono font-bold text-slate-500 uppercase tracking-widest block mb-2.5">
            Pathways Index
          </span>
          {BIO_PATHWAYS.map((p) => {
            const isChosen = p.id === selectedPathwayId;
            return (
              <button
                key={p.id}
                onClick={() => {
                  setSelectedPathwayId(p.id);
                  setActiveStepIndex(0);
                }}
                className={`w-full block hover:bg-white/[0.01] p-3 text-left rounded border transition ${
                  isChosen
                    ? "bg-cyan-500/10 border-cyan-500/25 text-white"
                    : "border-transparent text-slate-400 hover:text-slate-200"
                } cursor-pointer`}
              >
                <div className="flex justify-between items-center mb-1">
                  <span className="text-[8px] font-mono tracking-wider font-extrabold text-cyan-400 uppercase bg-cyan-950/20 border border-cyan-400/25 px-1.5 py-0.5 rounded">
                    {p.category}
                  </span>
                  <span className="text-[7.5px] font-mono text-slate-500">
                    {p.steps.length} steps
                  </span>
                </div>
                <div className="text-[11.5px] font-bold block leading-snug tracking-wide uppercase truncate mt-1">
                  {p.name}
                </div>
                <div className="text-[8px] font-mono text-indigo-400 mt-1">
                  ID: {p.officialId}
                </div>
              </button>
            );
          })}

          <div className="pt-4 border-t border-white/[0.05] text-left">
            <a
              href="https://reactome.org"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-[9px] font-mono font-bold text-indigo-400 hover:text-indigo-300 uppercase transition"
            >
              <span>Visit reactome.org</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>

        {/* Right Column - Steps detail & Dynamic mapping layout */}
        <div className="col-span-8 p-6 flex flex-col justify-between overflow-y-auto text-left space-y-6">
          <div className="space-y-4">
            <div>
              <span className="text-[8px] font-mono font-bold text-slate-500 block uppercase tracking-widest">
                Pathway Summary
              </span>
              <p className="text-slate-300 text-xs leading-relaxed mt-1 font-medium font-sans">
                {activePathway.summary}
              </p>
            </div>

            {/* Step-by-Step progress bar list */}
            <div>
              <span className="text-[8px] font-mono font-bold text-slate-500 block uppercase tracking-widest mb-2.5">
                Molecular Transition steps
              </span>
              <div className="space-y-2">
                {activePathway.steps.map((step, idx) => {
                  const isCurrent = idx === activeStepIndex;
                  return (
                    <button
                      key={step.name}
                      onClick={() => setActiveStepIndex(idx)}
                      className={`w-full flex items-center justify-between p-3 rounded border text-left transition ${
                        isCurrent
                          ? "bg-[#050b18] border-cyan-500/35 text-white"
                          : "bg-white/[0.01] border-white/5 text-slate-400 hover:text-slate-200"
                      } cursor-pointer`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className={`w-5 h-5 rounded-full flex items-center justify-center font-mono text-[9px] font-bold ${
                          isCurrent ? "bg-cyan-500/15 text-cyan-400 border border-cyan-500/35" : "bg-slate-900 border border-transparent text-slate-500"
                        }`}>
                          {idx + 1}
                        </div>
                        <div className="min-w-0">
                          <span className="text-[10.5px] font-bold block leading-none truncate">{step.name}</span>
                          <span className="text-[9px] font-mono text-slate-500 block leading-none truncate mt-1">{step.reaction}</span>
                        </div>
                      </div>

                      <ArrowRight className={`w-4 h-4 shrink-0 transition-transform ${isCurrent ? "text-cyan-400 translate-x-1" : "text-slate-600"}`} />
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Focused reaction item spec card */}
          {activeStep && (
            <div className="bg-[#040813] border border-[#0d162d] p-4.5 rounded-lg space-y-3 shrink-0">
              <div className="flex justify-between items-start border-b border-white/[0.04] pb-2">
                <div>
                  <span className="text-[7.5px] font-mono text-slate-500 block uppercase leading-none">Chemical Reaction Formula</span>
                  <span className="text-[11px] font-mono font-bold text-emerald-400 block mt-1">
                    {activeStep.reaction}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-[7.5px] font-mono text-slate-500 block uppercase leading-none">Responsible Complex</span>
                  <span className="text-[10.5px] font-sans font-bold text-white block mt-0.5">
                    {activeStep.catalyst}
                  </span>
                </div>
              </div>

              <div>
                <span className="text-[7.5px] font-mono text-slate-500 block uppercase leading-none">Functional Decription</span>
                <p className="text-[11px] text-slate-400 font-sans leading-relaxed mt-1">
                  {activeStep.description}
                </p>
              </div>

              {/* Action mappings to highlight or select targeted organelle */}
              {onFocusOrganelle && (
                <div className="pt-2 flex items-center justify-between bg-[#061125]/40 -mx-4.5 -mb-4.5 p-3 px-4.5 rounded-b-lg border-t border-[#0d162d]">
                  <span className="text-[8px] font-mono text-slate-500 uppercase leading-none">
                    Target: <b className="text-slate-300 font-bold uppercase">{activeStep.organelleId.replace("_", " ")}</b>
                  </span>
                  <button
                    onClick={() => onFocusOrganelle(activeStep.organelleId)}
                    className="flex items-center gap-1.5 text-[9px] font-mono font-bold text-cyan-400 hover:text-cyan-300 bg-cyan-950/20 border border-cyan-400/25 px-2.5 py-1 rounded transition uppercase cursor-pointer"
                  >
                    <Compass className="w-3 h-3" />
                    <span>Focus on Organelle</span>
                  </button>
                </div>
              )}
            </div>
          )}

        </div>
      </div>

    </div>
  );
};
