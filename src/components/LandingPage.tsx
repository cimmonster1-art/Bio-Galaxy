import React, { useRef } from 'react';
import { ArrowDown, ArrowRight, Boxes, Database, Layers3, Newspaper, Server, X } from 'lucide-react';
import { Scale } from '../types';
import { DATA_SOURCE_ORDER, getSource } from '../data/sources';
import { BioGalaxyCanvas } from './BioGalaxyCanvas';
import { AttributionSection } from './AttributionSection';

interface Props { onOpenAtlas: () => void; }
const CREDIBILITY = DATA_SOURCE_ORDER.map((id) => getSource(id).name);
const SCALE_STOPS = ['Cosmos', 'Solar system', 'Biome', 'Anatomy', 'Cell', 'Atom'];
const EXAMPLE_QUERIES = ['Human heart', 'Jupiter', 'ATP', 'Blue whale', 'Mitochondrion', 'Carbon atom', 'Milky Way'];

/** Landing page with a live scene, concise product detail, and full provenance. */
export const LandingPage: React.FC<Props> = ({ onOpenAtlas }) => {
  const sourcesRef = useRef<HTMLElement>(null);
  return (
    <div className="min-h-screen bg-[#02040a] text-slate-100">
      <section className="relative min-h-screen overflow-hidden">
        <div className="absolute inset-0 opacity-80"><BioGalaxyCanvas scale={Scale.Planet} selectedId={null} onHover={() => {}} onSelect={() => {}} onScaleSettled={() => {}} /></div>
        <div className="pointer-events-none absolute inset-0 hero-veil" />
        <div className="pointer-events-none absolute inset-0 hero-grid" />

        <header className="relative z-10 flex items-center justify-between px-4 py-4 sm:px-6 sm:py-5">
          <div className="flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-cyan-400 shadow-[0_0_8px_#27c4d9]" /><span className="text-[14px] font-semibold tracking-tight">Bio Galaxy</span></div>
          <a href="/blog" className="meta-label inline-flex items-center gap-1.5 rounded-full border border-white/10 px-3 py-1 text-slate-300 transition hover:border-cyan-500/40 hover:text-cyan-200"><Newspaper className="h-3.5 w-3.5" aria-hidden /> Journal</a>
        </header>

        <div className="relative z-10 mx-auto flex min-h-[calc(100dvh-64px)] max-w-4xl flex-col items-center justify-center px-4 pb-24 pt-8 text-center sm:min-h-[calc(100vh-78px)] sm:px-6 sm:pb-20 sm:pt-0">
          <span className="meta-label mb-4 rounded-full border border-white/10 bg-[#02040a]/50 px-3 py-1 backdrop-blur-md">Google Earth for the natural sciences</span>
          <h1 className="max-w-3xl text-[2.35rem] font-semibold leading-[1.08] tracking-tight sm:text-6xl">Search any physical thing,<br/><span className="text-cyan-200">from a galaxy to an atom.</span></h1>
          <p className="mt-4 max-w-2xl text-[13px] sm:mt-5 sm:text-[15px] leading-relaxed text-slate-300/80">Instead of documents, PDFs, and database rows, you get the thing itself, rendered in real-time 3D with source-cited context: a galaxy, a planet, a city, a biome, an organism, an organ, a cell, an organelle, a protein, a molecule, an atom.</p>
          <p className="mt-3 max-w-2xl text-[12px] sm:text-[13px] leading-relaxed text-cyan-200/80">Type a protein, molecule, sequence, organism, star, or planet and watch it render live as an accurate 3D structure, streamed from public scientific data.</p>
          <div className="mt-5 flex max-w-2xl flex-wrap items-center justify-center gap-1.5">
            {EXAMPLE_QUERIES.map((example) => (
              <button key={example} onClick={onOpenAtlas} className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-[11px] text-slate-300 backdrop-blur-md transition hover:border-cyan-500/40 hover:text-cyan-200">{example}</button>
            ))}
          </div>
          <div className="mt-7 grid w-full max-w-xs grid-cols-1 gap-2.5 sm:mt-8 sm:flex sm:w-auto sm:max-w-none sm:flex-wrap sm:items-center sm:justify-center sm:gap-3">
            <button onClick={onOpenAtlas} className="group inline-flex min-h-11 items-center justify-center gap-2 rounded-md bg-cyan-400 px-5 py-2.5 text-[13px] font-semibold text-[#02040a] transition hover:bg-cyan-300">Open Atlas <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" /></button>
            <button onClick={() => sourcesRef.current?.scrollIntoView({ behavior: 'smooth' })} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md border border-white/15 bg-[#02040a]/40 px-5 py-2.5 text-[13px] font-medium text-slate-200 backdrop-blur-md transition hover:border-cyan-500/40 hover:text-cyan-200"><Database className="h-4 w-4" /> View Sources</button>
          </div>
          <div className="mt-8 flex w-full sm:mt-12 max-w-3xl items-center justify-between gap-1 rounded-lg border border-white/10 bg-[#02040a]/55 px-3 py-3 backdrop-blur-md">
            {SCALE_STOPS.map((stop, index) => <React.Fragment key={stop}><div className="flex flex-col items-center gap-2"><span className={`h-1.5 w-1.5 rounded-full ${index === 2 ? 'bg-cyan-300 shadow-[0_0_8px_#67e8f9]' : 'bg-slate-500'}`} /><span className="hidden text-[9px] uppercase tracking-[0.14em] text-slate-500 sm:block">{stop}</span></div>{index < SCALE_STOPS.length - 1 && <span className="h-px flex-1 bg-gradient-to-r from-white/5 via-cyan-400/20 to-white/5" />}</React.Fragment>)}
          </div>
          <div className="mt-6 sm:mt-8"><div className="meta-label mb-3">Live records from</div><div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2">{CREDIBILITY.map((name) => <span key={name} className="text-[11px] font-medium text-slate-400">{name}</span>)}</div></div>
        </div>

        <button
          type="button"
          onClick={onOpenAtlas}
          aria-label="Close introduction and open the atlas"
          className="absolute bottom-5 left-1/2 z-20 flex -translate-x-1/2 flex-col items-center gap-1 rounded-full border border-white/15 bg-[#050a13]/80 p-2 text-slate-300 backdrop-blur-md transition hover:border-cyan-400/50 hover:bg-cyan-500/10 hover:text-cyan-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400"
        >
          <X className="h-4 w-4" />
          <ArrowDown className="h-3 w-3 animate-bounce" aria-hidden />
        </button>
      </section>

      <section className="border-y border-white/[0.08] bg-white/[0.015]"><div className="mx-auto grid max-w-6xl gap-px px-4 py-6 sm:px-6 sm:py-8 md:grid-cols-2 lg:grid-cols-4">
        <Feature icon={Boxes} label="Search anything physical" text="Type a protein, molecule, sequence, organism, organelle, cell, atom, star, planet, or galaxy and the search bar renders it in real-time 3D, from any of the 118 Bohr-model atoms to a mitochondrion's cristae to named spiral galaxies, streamed live from RCSB PDB, PubChem, and more." />
        <Feature icon={Layers3} label="One continuous journey" text="A single camera path travels through reality from the cosmos to the atom: biome, ecosystem, organism, cell, and molecule." />
        <Feature icon={Database} label="Source-aware objects" text="Selections surface live taxonomy, pathway, expression, genomic, and structural context." />
        <Feature icon={Server} label="Fast same-origin data gateway" text="Public, key-free APIs are normalized in typed clients and accelerated by server-side caching." />
      </div></section>

      <AttributionSection ref={sourcesRef} />
      <section className="mx-auto max-w-6xl px-4 pb-16 sm:px-6 sm:pb-20"><div className="flex flex-col items-stretch gap-4 rounded-lg border border-cyan-400/15 bg-cyan-400/[0.04] p-6 sm:flex-row sm:items-center sm:justify-between"><div><div className="meta-label mb-1">Begin at any scale</div><p className="text-[15px] text-slate-200">Search a species, protein, pathway, organelle, or structure and move through its context.</p></div><button onClick={onOpenAtlas} className="inline-flex shrink-0 items-center gap-2 rounded-md bg-cyan-400 px-5 py-2.5 text-[13px] font-semibold text-[#02040a] hover:bg-cyan-300">Open Atlas <ArrowRight className="h-4 w-4" /></button></div></section>
      <footer className="border-t border-white/10 px-6 py-6 text-center"><span className="meta-label">Bio Galaxy · Educational visualization of public datasets · Not medical guidance</span><div className="mt-2"><a href="/blog" className="meta-label text-slate-400 transition hover:text-cyan-300">Read the Journal</a></div></footer>
    </div>
  );
};

const Feature: React.FC<{ icon: React.ComponentType<{ className?: string }>; label: string; text: string }> = ({ icon: Icon, label, text }) => <article className="px-5 py-4"><Icon className="h-4 w-4 text-cyan-300" /><h2 className="mt-3 text-[14px] font-semibold">{label}</h2><p className="mt-1.5 text-[12px] leading-relaxed text-slate-500">{text}</p></article>;
