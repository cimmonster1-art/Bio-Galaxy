import React, { ReactNode } from 'react';
import { Compass, Info, X } from 'lucide-react';

export type MobileAtlasPanel = 'navigate' | 'inspect' | null;

interface Props {
  active: MobileAtlasPanel;
  onChange: (panel: MobileAtlasPanel) => void;
  navigate: ReactNode;
  inspect: ReactNode;
  selectionName?: string;
}

/** Mobile-only access to the navigation and scientific detail panels. */
export const MobileAtlasDock: React.FC<Props> = ({ active, onChange, navigate, inspect, selectionName }) => (
  <div className="mobile-atlas-dock lg:hidden">
    {active && (
      <section className="mobile-atlas-sheet" aria-label={active === 'navigate' ? 'Atlas navigation' : 'Atlas details'}>
        <header className="flex items-center gap-3 border-b border-white/10 px-4 py-3">
          <div className="min-w-0 flex-1">
            <div className="meta-label">{active === 'navigate' ? 'Move through the atlas' : 'Current selection'}</div>
            <h2 className="truncate text-[14px] font-semibold text-slate-100">
              {active === 'navigate' ? 'Navigate' : selectionName ?? 'Scene details'}
            </h2>
          </div>
          <button type="button" onClick={() => onChange(null)} className="mobile-icon-button" aria-label="Close panel"><X className="h-4 w-4" /></button>
        </header>
        <div className="min-h-0 flex-1 space-y-3 overflow-y-auto p-3 scroll-thin">{active === 'navigate' ? navigate : inspect}</div>
      </section>
    )}
    <nav className="mobile-atlas-toolbar" aria-label="Mobile atlas controls">
      <DockButton active={active === 'navigate'} label="Navigate" icon={<Compass className="h-4 w-4" />} onClick={() => onChange(active === 'navigate' ? null : 'navigate')} />
      <DockButton active={active === 'inspect'} label={selectionName ? 'Inspect' : 'Details'} icon={<Info className="h-4 w-4" />} onClick={() => onChange(active === 'inspect' ? null : 'inspect')} />
    </nav>
  </div>
);

const DockButton: React.FC<{ active: boolean; label: string; icon: ReactNode; onClick: () => void }> = ({ active, label, icon, onClick }) => (
  <button type="button" onClick={onClick} className={`mobile-dock-button ${active ? 'mobile-dock-button-active' : ''}`} aria-pressed={active}>
    {icon}<span>{label}</span>
  </button>
);
