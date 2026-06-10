import React, { useMemo, useState } from 'react';
import { Search, Database } from 'lucide-react';
import { BioObject, DataSourceId } from '../../types';
import { DATA_SOURCES, DATA_SOURCE_ORDER } from '../../data/sources';
import { DetailPanel } from './DetailPanel';
import { CopilotPanel } from './CopilotPanel';

interface Props {
  selected: BioObject | null;
}

/**
 * The third-of-the-screen detail sidebar. It stacks three things the brief asks
 * for: searchable category pills that filter the dry database records, the rich
 * clickable card (Wikipedia image plus the six-database details) for whatever is
 * selected, and a grounded copilot docked at the foot that can expand to fill
 * the lower half.
 */
export const AtlasSidebar: React.FC<Props> = ({ selected }) => {
  const [active, setActive] = useState<DataSourceId[]>([]);
  const [query, setQuery] = useState('');
  const [copilotOpen, setCopilotOpen] = useState(true);

  const pills = useMemo(() => {
    const q = query.trim().toLowerCase();
    return DATA_SOURCE_ORDER.filter((id) => {
      if (!q) return true;
      const s = DATA_SOURCES[id];
      return (
        s.name.toLowerCase().includes(q) ||
        s.domain.toLowerCase().includes(q) ||
        s.description.toLowerCase().includes(q)
      );
    });
  }, [query]);

  const toggle = (id: DataSourceId): void =>
    setActive((a) => (a.includes(id) ? a.filter((x) => x !== id) : [...a, id]));

  return (
    <div className="flex h-full min-h-0 flex-col">
      {/* Searchable category pills for the dry database records. */}
      <div className="shrink-0 border-b border-white/10 px-3 py-2.5">
        <div className="mb-2 flex items-center gap-2 rounded-md border border-white/10 bg-[#0a1220] px-2 py-1.5">
          <Search className="h-3.5 w-3.5 text-slate-500" aria-hidden />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search databases"
            className="min-w-0 flex-1 bg-transparent text-[12px] text-slate-200 placeholder:text-slate-600 focus:outline-none"
          />
        </div>
        <div className="flex flex-wrap gap-1.5">
          <span className="flex items-center gap-1 text-[10px] uppercase tracking-wide text-slate-500">
            <Database className="h-3 w-3" aria-hidden />
          </span>
          {pills.map((id) => {
            const on = active.includes(id);
            return (
              <button
                key={id}
                onClick={() => toggle(id)}
                title={DATA_SOURCES[id].domain}
                className={`rounded-full border px-2.5 py-0.5 text-[11px] transition ${
                  on
                    ? 'border-cyan-400/60 bg-cyan-500/15 text-cyan-200'
                    : 'border-white/10 text-slate-400 hover:border-cyan-500/40 hover:text-slate-100'
                }`}
              >
                {DATA_SOURCES[id].short}
              </button>
            );
          })}
          {active.length > 0 && (
            <button
              onClick={() => setActive([])}
              className="rounded-full px-2 py-0.5 text-[11px] text-slate-500 hover:text-slate-200"
            >
              clear
            </button>
          )}
        </div>
      </div>

      {/* The clickable card: Wikipedia image plus the database details. */}
      <div className="min-h-0 flex-1">
        <DetailPanel selected={selected} visibleSources={active} />
      </div>

      {/* Grounded copilot, expandable into the lower half of the sidebar. */}
      <CopilotPanel
        selected={selected}
        expanded={copilotOpen}
        onToggle={() => setCopilotOpen((v) => !v)}
      />
    </div>
  );
};
