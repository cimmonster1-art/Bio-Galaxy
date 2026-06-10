import React from 'react';
import { Clock3, Film, Network, X } from 'lucide-react';

export type AtlasWorkspace = 'eras' | 'playback' | 'life' | null;

interface Props { active: AtlasWorkspace; onChange: (workspace: AtlasWorkspace) => void; }

const ITEMS = [
  { id: 'eras' as const, label: 'Eras', icon: Clock3 },
  { id: 'playback' as const, label: 'Timeline playback', icon: Film },
  { id: 'life' as const, label: 'Clade of life', icon: Network },
];

export const AtlasTopNav: React.FC<Props> = ({ active, onChange }) => (
  <nav className="flex items-center gap-1 rounded-lg border border-white/10 bg-white/[.025] p-1" aria-label="Atlas workspaces">
    {ITEMS.map(({ id, label, icon: Icon }) => (
      <button key={id} type="button" onClick={() => onChange(active === id ? null : id)} className={`atlas-nav-button ${active === id ? 'atlas-nav-button-active' : ''}`} aria-pressed={active === id}>
        <Icon className="h-3.5 w-3.5" /> <span className="hidden xl:inline">{label}</span>
      </button>
    ))}
    {active && <button type="button" onClick={() => onChange(null)} className="rounded-md p-1.5 text-slate-500 hover:bg-white/5 hover:text-slate-200" aria-label="Close workspace"><X className="h-3.5 w-3.5" /></button>}
  </nav>
);
