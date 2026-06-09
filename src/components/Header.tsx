import React from "react";
import { Search, Bookmark, Share2, Compass, Info } from "lucide-react";

interface HeaderProps {
  currentTab: string;
  onTabChange: (tab: string) => void;
  onOpenInfo: () => void;
}

export const Header: React.FC<HeaderProps> = ({ currentTab, onTabChange, onOpenInfo }) => {
  const tabs = ["GALAXY VIEW", "MOLECULAR MAP", "SYSTEMS", "DATA CORE", "SIMULATION"];

  return (
    <header className="h-[72px] shrink-0 border-b border-white/[0.08] bg-[#03060f]/90 backdrop-blur-md flex items-center justify-between px-8 z-50 select-none">
      {/* Left Title Logo */}
      <div className="flex items-center gap-3">
        <div className="relative flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-tr from-cyan-950 to-indigo-950 border border-cyan-500/30 overflow-hidden">
          {/* Subtle spinning galaxy look */}
          <div className="absolute inset-0.5 rounded-full border border-dashed border-cyan-400/40 animate-[spin_20s_linear_infinite]" />
          <Compass className="w-4.5 h-4.5 text-cyan-400" />
        </div>
        <div className="flex flex-col text-left">
          <span className="font-sans font-bold tracking-[0.25em] text-white text-sm leading-none">
            BIO GALAXY
          </span>
          <span className="text-[10px] tracking-wider text-slate-400 font-sans mt-1">
            EXPLORING LIFE AT EVERY SCALE
          </span>
        </div>
      </div>

      {/* Center Tabs Navigation */}
      <nav className="flex items-center gap-1 bg-[#090d16]/80 p-1 rounded-md border border-white/[0.05]">
        {tabs.map((tab) => {
          const isActive = tab === currentTab;
          return (
            <button
              key={tab}
              id={`tab-${tab.replace(/\s+/g, '-').toLowerCase()}`}
              onClick={() => onTabChange(tab)}
              className={`text-[10px] px-4 py-2 font-mono font-bold tracking-widest rounded transition-all duration-150 cursor-pointer ${
                isActive
                  ? "bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 shadow-[0_0_12px_rgba(6,182,212,0.1)]"
                  : "text-slate-400 hover:text-slate-100 border border-transparent"
              }`}
            >
              {tab}
            </button>
          );
        })}
      </nav>

      {/* Right Actions */}
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-4 text-slate-400">
          <button 
            onClick={onOpenInfo}
            id="header-info-btn"
            className="hover:text-cyan-400 transition cursor-pointer p-1 flex items-center gap-1" 
            title="Observation Methodology & Reference Sources ('i')"
          >
            <Info className="w-4 h-4 text-cyan-400" />
            <span className="text-[9.5px] font-mono tracking-wider font-extrabold hidden md:inline">CALC REF</span>
          </button>
          <button className="hover:text-cyan-400 transition cursor-pointer p-1" title="Search Databases">
            <Search className="w-4 h-4" />
          </button>
          <button className="hover:text-cyan-400 transition cursor-pointer p-1" title="Bookmarked Entities">
            <Bookmark className="w-4 h-4" />
          </button>
          <button className="hover:text-cyan-400 transition cursor-pointer p-1" title="Share Visualization">
            <Share2 className="w-4 h-4" />
          </button>
        </div>

        <div className="w-[1px] h-6 bg-white/[0.08]" />

        {/* User Profile Avatar badge */}
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-cyan-900/30 border border-cyan-500/20 flex items-center justify-center font-mono text-[11px] font-bold text-cyan-400">
            BG
          </div>
        </div>
      </div>
    </header>
  );
};
