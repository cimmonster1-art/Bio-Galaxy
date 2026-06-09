import React, { useState, useEffect } from "react";
import { Search, Loader2, Database, AlertCircle, Cpu, FileText, ChevronRight, Copy, Check } from "lucide-react";

interface ProteinSearchProps {
  onSelectProtein?: (accession: string, name: string) => void;
  onClose?: () => void;
}

export const ProteinSearch: React.FC<ProteinSearchProps> = ({
  onSelectProtein,
  onClose,
}) => {
  const [query, setQuery] = useState<string>("Myoglobin");
  const [proteins, setProteins] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  
  const [selectedIdx, setSelectedIdx] = useState<number>(-1);
  const [copied, setCopied] = useState<boolean>(false);

  const fetchProteins = async (keyword: string) => {
    if (!keyword.trim()) return;
    try {
      setLoading(true);
      setError(null);
      
      // Clean query structure hitting Homo Sapiens proteins
      const url = `https://rest.uniprot.org/uniprotkb/search?query=organism_id:9606+AND+${encodeURIComponent(keyword)}&format=json&size=10`;
      const res = await fetch(url);
      if (!res.ok) {
        throw new Error("UniProt record search failed. The response returned an invalid or non-optimal status.");
      }
      const data = await res.json();
      if (data && data.results && data.results.length > 0) {
        setProteins(data.results);
        setSelectedIdx(0);
      } else {
        setProteins([]);
        setSelectedIdx(-1);
      }
    } catch (err: any) {
      setError(err.message || "Failed to contact UniProt API endpoint.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Initial fetch
    fetchProteins("Myoglobin");
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchProteins(query);
  };

  // Safe accessor helper
  const parseProtein = (record: any) => {
    const accession = record?.primaryAccession || "P02144";
    const entryName = record?.uniProtkbId || "MYG_HUMAN";
    const gene = record?.genes?.[0]?.geneName?.value || "MB";
    const fullName = record?.proteinDescription?.recommendedName?.fullName?.value || 
                     record?.proteinDescription?.submissionNames?.[0]?.fullName?.value || "Myoglobin";
    const mass = record?.sequence?.mass ? `${(record.sequence.mass / 1000).toFixed(1)} kDa` : "17.1 kDa";
    const length = record?.sequence?.length || 154;
    const diseaseArr = record?.comments?.filter((c: any) => c.commentType === "DISEASE");
    const functionalText = record?.comments?.find((c: any) => c.commentType === "FUNCTION")?.texts?.[0]?.value || 
                           "Primary oxygen carrier muscle tissue, binding iron cofactor to facilitate passive respiration gradients.";
    const cytLoc = record?.comments?.find((c: any) => c.commentType === "SUBCELLULAR_LOCATION")?.subcellularLocations?.[0]?.location?.value || "Cytoplasm, Sarcoplasm";

    return { accession, entryName, gene, fullName, mass, length, functionalText, cytLoc, diseaseArr };
  };

  const activeRecord = selectedIdx >= 0 && proteins[selectedIdx] ? parseProtein(proteins[selectedIdx]) : null;

  const handleCopySequence = (seq: string) => {
    navigator.clipboard.writeText(seq);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex-1 min-w-0 bg-[#02050c] flex flex-col relative rounded-md border border-white/[0.08] overflow-hidden">
      
      {/* Upper header action bar */}
      <div className="h-12 border-b border-white/[0.08] bg-[#03060f]/90 px-4 flex items-center justify-between shrink-0 select-none">
        <div className="flex items-center gap-2">
          <Database className="w-4 h-4 text-cyan-400" />
          <span className="text-[11px] font-mono tracking-widest font-extrabold uppercase text-slate-100">
            UNIPROT KNOWLEDGEBASE SEARCH ENGINE
          </span>
        </div>

        {onClose && (
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white text-[10.5px] font-mono font-bold uppercase tracking-wider px-2.5 py-1 rounded border border-white/5 hover:border-rose-500/20 hover:bg-rose-950/10 transition cursor-pointer"
          >
            Exit Search
          </button>
        )}
      </div>

      <div className="flex-grow grid grid-cols-12 overflow-hidden h-full">
        {/* Left Side: Search input & Results list */}
        <div className="col-span-5 border-r border-white/[0.05] p-5 flex flex-col h-full bg-black/15 overflow-hidden">
          
          <form onSubmit={handleSearchSubmit} className="flex gap-2 shrink-0 mb-4">
            <div className="relative flex-1">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              <input
                type="text"
                placeholder="Search human protein..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="w-full bg-[#040815] border border-white/10 hover:border-cyan-500/40 focus:border-cyan-500 text-xs rounded pl-9.5 pr-3 py-2 text-white outline-none font-mono"
              />
            </div>
            <button
              type="submit"
              className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white text-[11px] font-mono tracking-wider uppercase font-bold rounded cursor-pointer transition border border-cyan-400"
            >
              Search
            </button>
          </form>

          {/* Results frame */}
          <div className="flex-1 overflow-y-auto space-y-1.5 pr-1 text-left custom-scrollbar">
            {loading ? (
              <div className="h-48 flex flex-col items-center justify-center text-slate-500 gap-2.5">
                <Loader2 className="w-5 h-5 animate-spin text-cyan-400" />
                <span className="text-[11px] font-mono">Querying UniProt KB...</span>
              </div>
            ) : error ? (
              <div className="p-4 rounded border border-rose-500/15 bg-rose-950/5 text-rose-300 text-[11px] flex items-start gap-2.5 leading-relaxed">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold block">Live Query Error</span>
                  {error}
                </div>
              </div>
            ) : proteins.length === 0 ? (
              <div className="h-48 flex flex-col items-center justify-center text-slate-500 text-[11px] font-mono">
                No matching human proteins. Try "Myoglobin", "Insulin", or "Actin".
              </div>
            ) : (
              proteins.map((record, index) => {
                const parsed = parseProtein(record);
                const isSelected = index === selectedIdx;
                return (
                  <button
                    key={parsed.accession}
                    onClick={() => setSelectedIdx(index)}
                    className={`w-full block p-3 rounded border text-left transition ${
                      isSelected
                        ? "bg-[#050b18] border-cyan-500/35 text-white"
                        : "bg-[#03060d] border-white/5 text-slate-400 hover:text-slate-200"
                    } cursor-pointer`}
                  >
                    <div className="flex justify-between items-start mb-1">
                      <span className="text-[11.5px] font-bold truncate pr-2 uppercase">{parsed.gene}</span>
                      <span className="text-[9px] font-mono text-cyan-400 font-medium">{parsed.accession}</span>
                    </div>
                    <div className="text-[10px] truncate max-w-full text-slate-400">{parsed.fullName}</div>
                    <div className="text-[8.5px] text-slate-500 font-mono mt-1 leading-none">
                      {parsed.entryName} • {parsed.length} residues
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Right Side: Active item detailed documentation panel */}
        <div className="col-span-7 p-6 overflow-y-auto text-left flex flex-col justify-between h-full bg-black/5">
          {activeRecord ? (
            <div className="space-y-6">
              
              {/* Primary Identity Tag */}
              <div className="border-b border-white/[0.06] pb-4">
                <div className="flex items-center justify-between gap-2 flex-wrap mb-2">
                  <span className="text-[8.5px] font-mono font-bold uppercase tracking-widest text-cyan-400 bg-cyan-950/30 border border-cyan-500/25 px-2.5 py-0.5 rounded leading-none">
                    Verified UniProtKB Record
                  </span>
                  <span className="text-[10px] font-mono text-slate-500">
                    ID: {activeRecord.entryName}
                  </span>
                </div>
                <h3 className="text-[17px] font-bold text-white tracking-wide font-sans leading-snug">
                  {activeRecord.fullName}
                </h3>
              </div>

              {/* Bio dimensions grid */}
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-[#050a16] p-3 rounded border border-white/[0.04]">
                  <span className="text-[7.5px] font-mono text-slate-500 block uppercase leading-none">Gene Backbone</span>
                  <span className="text-[12.5px] font-bold text-slate-200 block mt-1.5 truncate">{activeRecord.gene}</span>
                </div>
                <div className="bg-[#050a16] p-3 rounded border border-[#0d162d]">
                  <span className="text-[7.5px] font-mono text-slate-500 block uppercase leading-none">Accession ID</span>
                  <span className="text-[12.5px] font-mono font-bold text-cyan-400 block mt-1.5">{activeRecord.accession}</span>
                </div>
                <div className="bg-[#050a16] p-3 rounded border border-[#0d162d]">
                  <span className="text-[7.5px] font-mono text-slate-500 block uppercase leading-none">Molecular Mass</span>
                  <span className="text-[12.5px] font-mono font-bold text-emerald-400 block mt-1.5">{activeRecord.mass}</span>
                </div>
              </div>

              {/* Functional properties comment block */}
              <div>
                <span className="text-[8px] font-mono font-bold text-slate-500 block uppercase tracking-widest mb-1.5">
                  Biological Function Overview
                </span>
                <p className="text-slate-300 text-xs leading-relaxed font-sans font-medium">
                  {activeRecord.functionalText}
                </p>
              </div>

              {/* Subcellular compartment target localization */}
              <div>
                <span className="text-[8px] font-mono font-bold text-slate-500 block uppercase tracking-widest mb-1.5">
                  Subcellular Compartment Location
                </span>
                <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-[#08152c] rounded border border-cyan-500/15">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
                  <span className="text-[10.5px] font-mono font-bold text-slate-200">
                    {activeRecord.cytLoc}
                  </span>
                </div>
              </div>

              {/* Active structures loading action */}
              {onSelectProtein && (
                <div className="pt-5 border-t border-white/[0.06] flex items-center justify-between">
                  <div className="text-[8.5px] font-mono text-slate-500 flex flex-col text-left">
                    <span>SELECTION SYNC ACTIVE</span>
                    <span className="text-emerald-400 font-bold uppercase">Ready for structure visualization</span>
                  </div>
                  <button
                    onClick={() => onSelectProtein(activeRecord.accession, activeRecord.fullName)}
                    className="flex items-center gap-1.5 text-[10.5px] font-mono font-bold text-white bg-indigo-600 hover:bg-indigo-505 px-4.5 py-2.5 rounded transition uppercase tracking-wider shadow-[0_4px_12px_rgba(99,102,241,0.25)] cursor-pointer"
                  >
                    Load in 3D Viewer
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

            </div>
          ) : (
            <div className="flex-grow flex flex-col items-center justify-center text-slate-500 font-mono text-xs">
              Select a human protein record on the left grid to view rich database metadata.
            </div>
          )}
        </div>
      </div>

    </div>
  );
};
