import React, { useRef } from 'react';
import { ArrowRight, Database } from 'lucide-react';
import { Scale } from '../types';
import { DATA_SOURCE_ORDER, getSource } from '../data/sources';
import { BioGalaxyCanvas } from './BioGalaxyCanvas';

interface Props {
  onOpenAtlas: () => void;
}

const CREDIBILITY = DATA_SOURCE_ORDER.map((id) => getSource(id).name);

/**
 * Landing page. Shares the atlas design language and shows the real scene as a
 * restrained hero rather than concept art. Copy is plain and product oriented.
 */
export const LandingPage: React.FC<Props> = ({ onOpenAtlas }) => {
  const sourcesRef = useRef<HTMLDivElement>(null);

  return (
    <div className="min-h-screen bg-[#02040a] text-slate-100">
      {/* Hero */}
      <section className="relative h-screen overflow-hidden">
        {/* Live scene, dimmed behind the copy. */}
        <div className="absolute inset-0 opacity-70">
          <BioGalaxyCanvas
            scale={Scale.Universe}
            selectedId={null}
            onHover={() => {}}
            onSelect={() => {}}
            onScaleSettled={() => {}}
          />
        </div>
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-[#02040a]/40 via-[#02040a]/30 to-[#02040a]" />

        <header className="relative z-10 flex items-center justify-between px-6 py-5">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-cyan-400 shadow-[0_0_8px_#27c4d9]" />
            <span className="text-[14px] font-semibold tracking-tight">Bio Galaxy</span>
          </div>
          <span className="meta-label hidden sm:block">
            A visual interface over public biological databases
          </span>
        </header>

        <div className="relative z-10 mx-auto flex h-[calc(100vh-160px)] max-w-3xl flex-col items-center justify-center px-6 text-center">
          <span className="meta-label mb-5 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1">
            3D biological atlas
          </span>
          <h1 className="text-4xl font-semibold leading-tight tracking-tight sm:text-5xl">
            Explore biology as a navigable universe.
          </h1>
          <p className="mt-5 max-w-xl text-[15px] leading-relaxed text-slate-400">
            Bio Galaxy is a 3D biological atlas for exploring proteins, pathways, cells, genes,
            organisms, and molecular structures through public scientific datasets.
          </p>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <button
              onClick={onOpenAtlas}
              className="group inline-flex items-center gap-2 rounded-md bg-cyan-500/90 px-5 py-2.5 text-[13px] font-semibold text-[#02040a] transition hover:bg-cyan-400"
            >
              Open Atlas
              <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
            </button>
            <button
              onClick={() =>
                sourcesRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
              }
              className="inline-flex items-center gap-2 rounded-md border border-white/12 px-5 py-2.5 text-[13px] font-medium text-slate-200 transition hover:border-cyan-500/40 hover:text-cyan-200"
            >
              <Database className="h-4 w-4" /> View Data Sources
            </button>
          </div>

          <div className="mt-12">
            <div className="meta-label mb-3">Built on public data from</div>
            <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
              {CREDIBILITY.map((name) => (
                <span key={name} className="text-[12px] font-medium text-slate-400">
                  {name}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Data sources */}
      <section ref={sourcesRef} className="mx-auto max-w-5xl px-6 py-20">
        <div className="meta-label mb-2">Integration</div>
        <h2 className="text-2xl font-semibold tracking-tight">Data sources</h2>
        <p className="mt-2 max-w-2xl text-[14px] leading-relaxed text-slate-400">
          Every database-backed object in the atlas names its source. Records are read from
          public scientific databases through typed client wrappers.
        </p>
        <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {DATA_SOURCE_ORDER.map((id) => {
            const s = getSource(id);
            return (
              <a
                key={id}
                href={s.homepage}
                target="_blank"
                rel="noreferrer"
                className="panel-solid group rounded-md p-4 transition hover:border-cyan-500/30"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[14px] font-semibold text-slate-100">{s.name}</span>
                  <ArrowRight className="h-3.5 w-3.5 text-slate-600 transition group-hover:text-cyan-300" />
                </div>
                <div className="meta-label mt-1">{s.domain}</div>
                <p className="mt-2 text-[12.5px] leading-relaxed text-slate-400">
                  {s.description}
                </p>
              </a>
            );
          })}
        </div>

        <div className="mt-12 flex flex-col items-start gap-4 border-t border-white/10 pt-8 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-[14px] text-slate-300">
            A visual interface over public biological databases.
          </p>
          <button
            onClick={onOpenAtlas}
            className="inline-flex items-center gap-2 rounded-md bg-cyan-500/90 px-5 py-2.5 text-[13px] font-semibold text-[#02040a] transition hover:bg-cyan-400"
          >
            Open Atlas <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </section>

      <footer className="border-t border-white/10 px-6 py-6 text-center">
        <span className="meta-label">Bio Galaxy · Educational visualization of public datasets</span>
      </footer>
    </div>
  );
};
