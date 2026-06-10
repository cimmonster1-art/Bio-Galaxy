import React, { useState } from 'react';
import { ArrowRight, Boxes, Database, Orbit, Sparkles } from 'lucide-react';
import { ATTRIBUTION_COUNT, ATTRIBUTION_GROUPS, AttributionStatus } from '../data/attributions';

const STATUS_LABEL: Record<AttributionStatus, string> = {
  live: 'Live API',
  asset: 'In atlas',
  compatible: 'Compatible',
  foundation: 'Foundation',
};

const GROUP_ICON = [Database, Orbit, Boxes, Sparkles];

export const AttributionSection = React.forwardRef<HTMLElement>(function AttributionSection(_, ref) {
  const [expanded, setExpanded] = useState(false);
  const groups = expanded ? ATTRIBUTION_GROUPS : ATTRIBUTION_GROUPS.slice(0, 2);

  return (
    <section ref={ref} id="open-science" className="mx-auto max-w-6xl px-6 py-20">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="meta-label mb-2">Open science credits · {ATTRIBUTION_COUNT} organizations and projects</div>
          <h2 className="text-2xl font-semibold tracking-tight">The ecosystem behind the atlas</h2>
          <p className="mt-2 max-w-2xl text-[14px] leading-relaxed text-slate-400">
            Bio Galaxy names the databases, institutions, open assets, and standards behind each layer. Live integrations and compatible reference ecosystems are labeled separately.
          </p>
        </div>
        <button onClick={() => setExpanded((value) => !value)} className="rounded-md border border-white/12 px-4 py-2 text-[12px] font-medium text-slate-300 transition hover:border-cyan-500/40 hover:text-cyan-200">
          {expanded ? 'Show concise list' : 'Show every credit'}
        </button>
      </div>

      <div className="mt-8 grid gap-4 lg:grid-cols-2">
        {groups.map((group, groupIndex) => {
          const Icon = GROUP_ICON[groupIndex] ?? Sparkles;
          return (
            <article key={group.id} className="panel-solid rounded-lg p-5">
              <div className="flex items-start gap-3 border-b border-white/8 pb-4">
                <div className="rounded-md border border-cyan-400/15 bg-cyan-400/[0.06] p-2 text-cyan-300"><Icon className="h-4 w-4" /></div>
                <div><h3 className="text-[14px] font-semibold">{group.label}</h3><p className="mt-1 text-[12px] leading-relaxed text-slate-500">{group.description}</p></div>
              </div>
              <ul className="mt-2 divide-y divide-white/[0.06]">
                {group.entries.map((entry) => (
                  <li key={entry.name}>
                    <a href={entry.url} target="_blank" rel="noreferrer" className="group flex gap-3 py-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2"><span className="text-[13px] font-medium text-slate-200 group-hover:text-cyan-200">{entry.name}</span><span className="credit-status">{STATUS_LABEL[entry.status]}</span></div>
                        <div className="mt-0.5 text-[11px] text-slate-500">{entry.institution}</div>
                        <p className="mt-1 text-[12px] leading-relaxed text-slate-400">{entry.role}</p>
                      </div>
                      <ArrowRight className="mt-1 h-3.5 w-3.5 shrink-0 text-slate-700 transition group-hover:text-cyan-300" />
                    </a>
                  </li>
                ))}
              </ul>
            </article>
          );
        })}
      </div>
    </section>
  );
});
