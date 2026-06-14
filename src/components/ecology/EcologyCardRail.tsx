import React from 'react';
import {
  BookOpen, Trees, Thermometer, PawPrint, ShieldCheck, Flame, Library, ChevronRight,
} from 'lucide-react';
import { EcologyCity, IUCN_LABEL, gbifSpeciesUrl, iucnSpeciesUrl, wikiUrl } from '../../data/ecology';
import type { WikiSummary } from '../../data/clients/wikipediaClient';
import { EcoSourceChip } from './EcoSourceChip';

interface Props {
  city: EcologyCity;
  wiki: WikiSummary | null;
  wikiLoading: boolean;
  onNavigate: (id: string) => void;
}

const Card: React.FC<{
  icon: React.ReactNode; label: string; children: React.ReactNode; onClick?: () => void; tall?: boolean;
}> = ({ icon, label, children, onClick }) => {
  const base =
    'panel flex h-full w-[16.5rem] shrink-0 flex-col rounded-xl border-white/10 p-3 text-left';
  return onClick ? (
    <button onClick={onClick} className={`${base} group transition hover:border-cyan-400/40 hover:bg-cyan-400/[0.04]`}>
      <CardHead icon={icon} label={label} interactive />
      <div className="min-h-0 flex-1 overflow-hidden">{children}</div>
    </button>
  ) : (
    <article className={base}>
      <CardHead icon={icon} label={label} />
      <div className="min-h-0 flex-1 overflow-y-auto scroll-thin">{children}</div>
    </article>
  );
};

const CardHead: React.FC<{ icon: React.ReactNode; label: string; interactive?: boolean }> = ({ icon, label, interactive }) => (
  <header className="mb-2 flex items-center gap-2">
    <span className="grid h-6 w-6 place-items-center rounded-md bg-cyan-400/10 text-cyan-200">{icon}</span>
    <span className="meta-label flex-1">{label}</span>
    {interactive && <ChevronRight className="h-3.5 w-3.5 text-slate-600 group-hover:text-cyan-300" />}
  </header>
);

const Bullets: React.FC<{ items: string[] }> = ({ items }) => (
  <ul className="space-y-1">
    {items.map((it) => (
      <li key={it} className="flex gap-1.5 text-[11px] leading-relaxed text-slate-300">
        <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-cyan-500/60" />{it}
      </li>
    ))}
  </ul>
);

/**
 * The bottom card rail — visually identical in density and behaviour to the
 * Astro Insight rail, restyled in the atlas's navy/cyan palette. Cards are
 * swipeable; species cards descend into the organism ontology, and every card
 * carries its source databases.
 */
export const EcologyCardRail: React.FC<Props> = ({ city, wiki, wikiLoading, onNavigate }) => (
  <div className="eco-rail flex h-full items-stretch gap-3 overflow-x-auto px-4 pb-3 pt-1">
    {/* Wikipedia Summary */}
    <Card icon={<BookOpen className="h-3.5 w-3.5" />} label="Wikipedia summary">
      <div className="flex h-full flex-col">
        {wiki?.thumbnail && (
          <img src={wiki.thumbnail} alt={city.name} className="mb-2 h-20 w-full rounded-md object-cover" />
        )}
        <p className="text-[11px] leading-relaxed text-slate-300">
          {wikiLoading ? 'Fetching encyclopedia extract…' : (wiki?.extract ?? city.summary)}
        </p>
        <div className="mt-auto pt-2">
          <EcoSourceChip source="wikipedia" href={wiki?.url ?? wikiUrl(city.wikiTitle)} label="Wikipedia" />
        </div>
      </div>
    </Card>

    {/* Biome Overview */}
    <Card icon={<Trees className="h-3.5 w-3.5" />} label="Biome overview" onClick={city.biomeId ? () => onNavigate(`biome:${city.biomeId}`) : undefined}>
      <Bullets items={[
        `Biome: ${city.ecology.biome}`,
        `Ecosystem: ${city.ecology.ecosystem}`,
        `Ecoregion: ${city.ecology.ecoregion}`,
        `Endemism: ${city.ecology.endemics}`,
      ]} />
      <div className="mt-2 flex flex-wrap gap-1.5"><EcoSourceChip source="naturalearth" /><EcoSourceChip source="gbif" /></div>
    </Card>

    {/* Climate Profile */}
    <Card icon={<Thermometer className="h-3.5 w-3.5" />} label="Climate profile">
      <Bullets items={[
        `Köppen ${city.climate.koppen}: ${city.climate.koppenName}`,
        `Temp: ${city.climate.avgTempC}`,
        `Rain: ${city.climate.rainfallMm}`,
        `Seasonality: ${city.climate.seasonality}`,
      ]} />
      <div className="mt-2 flex flex-wrap gap-1.5"><EcoSourceChip source="worldclim" /><EcoSourceChip source="nasa" /></div>
    </Card>

    {/* Key Species — one clickable card each */}
    {city.species.map((s) => (
      <Card key={s.id} icon={<PawPrint className="h-3.5 w-3.5" />} label="Species" onClick={() => onNavigate(`organism:eco:${s.id}`)}>
        <div className="flex h-full flex-col">
          <div className="text-[13px] font-semibold text-slate-50">{s.name}</div>
          <div className="font-mono text-[10px] italic text-slate-500">{s.scientific}</div>
          <p className="mt-1.5 text-[11px] leading-relaxed text-slate-300">{s.blurb}</p>
          <div className="mt-auto flex items-center justify-between pt-2">
            <span className={`rounded-sm px-1.5 py-0.5 font-mono text-[9px] ${
              ['EN', 'CR', 'EW', 'EX'].includes(s.iucn)
                ? 'bg-rose-500/15 text-rose-300'
                : ['VU', 'NT'].includes(s.iucn)
                  ? 'bg-amber-500/15 text-amber-300'
                  : 'bg-emerald-500/15 text-emerald-300'
            }`}>{s.iucn} · {IUCN_LABEL[s.iucn]}</span>
            <span className="text-[10px] text-cyan-300/80">Dive in →</span>
          </div>
        </div>
      </Card>
    ))}

    {/* Conservation Status */}
    <Card icon={<ShieldCheck className="h-3.5 w-3.5" />} label="Conservation status">
      <Bullets items={[...city.conservation.endangered.map((e) => `At risk: ${e}`), ...city.conservation.protectedAreas.map((p) => `Protected: ${p}`)]} />
      <div className="mt-2 flex flex-wrap gap-1.5"><EcoSourceChip source="iucn" /><EcoSourceChip source="unep" /></div>
    </Card>

    {/* Ecological Threats */}
    <Card icon={<Flame className="h-3.5 w-3.5" />} label="Ecological threats">
      <Bullets items={[...city.conservation.threats, ...city.conservation.invasives.map((i) => `Invasive: ${i}`)]} />
      <div className="mt-2 flex flex-wrap gap-1.5"><EcoSourceChip source="iucn" /><EcoSourceChip source="gbif" /></div>
    </Card>

    {/* Scientific Sources */}
    <Card icon={<Library className="h-3.5 w-3.5" />} label="Scientific sources">
      <p className="mb-2 text-[10.5px] leading-relaxed text-slate-400">Every metric above is drawn from public databases. Open the records:</p>
      <div className="flex flex-wrap gap-1.5">
        {city.sources.map((src) => <EcoSourceChip key={src} source={src} />)}
        <EcoSourceChip source="gbif" href={gbifSpeciesUrl(city.species[0]?.scientific ?? city.name)} label="GBIF species" />
        <EcoSourceChip source="iucn" href={iucnSpeciesUrl(city.species[0]?.scientific ?? city.name)} label="IUCN search" />
      </div>
    </Card>
  </div>
);
