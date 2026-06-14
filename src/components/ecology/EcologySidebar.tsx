import React from 'react';
import {
  CloudRain, Trees, Mountain, ShieldAlert, Waves, ChevronRight,
} from 'lucide-react';
import { DataSourceId } from '../../types';
import {
  EcologyCity, IUCN_LABEL, gbifSpeciesUrl, iucnSpeciesUrl,
} from '../../data/ecology';
import { EcoSourceChip } from './EcoSourceChip';

interface Props {
  city: EcologyCity;
  onNavigate: (id: string) => void;
}

interface Row { label: string; value: string | string[]; }

const Field: React.FC<Row> = ({ label, value }) => (
  <div className="grid grid-cols-[7.5rem_1fr] gap-2 py-1">
    <span className="meta-label pt-0.5">{label}</span>
    <span className="text-[11.5px] leading-relaxed text-slate-300">
      {Array.isArray(value) ? value.join(' · ') : value}
    </span>
  </div>
);

const Section: React.FC<{
  icon: React.ReactNode; title: string; sources: DataSourceId[]; children: React.ReactNode;
}> = ({ icon, title, sources, children }) => (
  <section className="border-t border-white/10 px-4 py-3 first:border-t-0">
    <header className="mb-1.5 flex items-center gap-2">
      <span className="grid h-6 w-6 place-items-center rounded-md bg-cyan-400/10 text-cyan-200">{icon}</span>
      <h3 className="text-[12px] font-semibold tracking-tight text-slate-100">{title}</h3>
    </header>
    <div className="border-l border-white/10 pl-3">{children}</div>
    <div className="mt-2 flex flex-wrap gap-1.5">
      {sources.map((s) => <EcoSourceChip key={s} source={s} />)}
    </div>
  </section>
);

/**
 * The main selection sidebar for a city dive. It always represents the current
 * place, organised into the scientific sections of the brief — Climate, Biome &
 * Ecology, Geology, Conservation, and Earth Systems — each carrying its source
 * databases. Species are clickable and descend into the organism ontology.
 */
export const EcologySidebar: React.FC<Props> = ({ city, onNavigate }) => (
  <div className="flex h-full flex-col overflow-hidden">
    <header className="border-b border-white/10 px-4 py-3">
      <div className="meta-label mb-1">Ecological profile</div>
      <h2 className="text-[16px] font-semibold tracking-tight text-slate-50">{city.name}</h2>
      <div className="mt-0.5 font-mono text-[10px] text-cyan-300/80">
        {city.country} · {city.lat.toFixed(2)}°, {city.lon.toFixed(2)}° · Köppen {city.climate.koppen}
      </div>
      <p className="mt-2 text-[11.5px] leading-relaxed text-slate-400">{city.summary}</p>
    </header>

    <div className="min-h-0 flex-1 overflow-y-auto scroll-thin">
      <Section icon={<CloudRain className="h-3.5 w-3.5" />} title="Climate" sources={['worldclim', 'nasa']}>
        <Field label="Köppen" value={`${city.climate.koppen} — ${city.climate.koppenName}`} />
        <Field label="Temperature" value={city.climate.avgTempC} />
        <Field label="Rainfall" value={city.climate.rainfallMm} />
        <Field label="Humidity" value={city.climate.humidity} />
        <Field label="Seasonality" value={city.climate.seasonality} />
      </Section>

      <Section icon={<Trees className="h-3.5 w-3.5" />} title="Biome & Ecology" sources={['gbif', 'naturalearth', 'wikipedia']}>
        <Field label="Biome" value={city.ecology.biome} />
        <Field label="Ecosystem" value={city.ecology.ecosystem} />
        <Field label="Ecoregion" value={city.ecology.ecoregion} />
        <Field label="Biodiversity" value={city.ecology.biodiversity} />
        <Field label="Endemism" value={city.ecology.endemics} />
        {city.biomeId && (
          <button
            onClick={() => onNavigate(`biome:${city.biomeId}`)}
            className="mt-1.5 inline-flex items-center gap-1 text-[11px] text-cyan-300 hover:text-cyan-100"
          >
            Enter the biome <ChevronRight className="h-3 w-3" />
          </button>
        )}
      </Section>

      <Section icon={<Mountain className="h-3.5 w-3.5" />} title="Geology & Terrain" sources={['naturalearth', 'nasa', 'osm']}>
        <Field label="Elevation" value={city.geology.elevation} />
        <Field label="Terrain" value={city.geology.terrain} />
        <Field label="Soil" value={city.geology.soil} />
        <Field label="Tectonics" value={city.geology.tectonics} />
      </Section>

      <Section icon={<ShieldAlert className="h-3.5 w-3.5" />} title="Conservation" sources={['iucn', 'unep', 'gbif']}>
        <Field label="Protected" value={city.conservation.protectedAreas} />
        <Field label="Endangered" value={city.conservation.endangered} />
        <Field label="Threats" value={city.conservation.threats} />
        <Field label="Invasives" value={city.conservation.invasives} />
      </Section>

      <Section icon={<Waves className="h-3.5 w-3.5" />} title="Earth Systems" sources={['nasa', 'worldclim']}>
        <Field label="Carbon" value={city.earthSystems.carbon} />
        <Field label="Vegetation" value={city.earthSystems.vegetation} />
        <Field label="Water" value={city.earthSystems.water} />
        <Field label="Productivity" value={city.earthSystems.productivity} />
      </Section>

      <section className="border-t border-white/10 px-4 py-3">
        <h3 className="mb-2 text-[12px] font-semibold tracking-tight text-slate-100">Key species</h3>
        <div className="space-y-1.5">
          {city.species.map((s) => (
            <button
              key={s.id}
              onClick={() => onNavigate(`organism:eco:${s.id}`)}
              className="group flex w-full items-center gap-2 rounded-lg border border-white/10 bg-white/[0.02] px-2.5 py-2 text-left transition hover:border-cyan-400/30 hover:bg-cyan-400/[0.05]"
            >
              <div className="min-w-0 flex-1">
                <div className="truncate text-[12px] font-medium text-slate-100">{s.name}</div>
                <div className="truncate font-mono text-[9.5px] italic text-slate-500">{s.scientific}</div>
              </div>
              <span className={`rounded-sm px-1.5 py-0.5 font-mono text-[9px] ${
                ['EN', 'CR', 'EW', 'EX'].includes(s.iucn)
                  ? 'bg-rose-500/15 text-rose-300'
                  : ['VU', 'NT'].includes(s.iucn)
                    ? 'bg-amber-500/15 text-amber-300'
                    : 'bg-emerald-500/15 text-emerald-300'
              }`} title={IUCN_LABEL[s.iucn]}>{s.iucn}</span>
              <ChevronRight className="h-3.5 w-3.5 text-slate-600 group-hover:text-cyan-300" />
            </button>
          ))}
        </div>
        <div className="mt-2 flex flex-wrap gap-1.5">
          <EcoSourceChip source="gbif" href={gbifSpeciesUrl(city.species[0]?.scientific ?? city.name)} />
          <EcoSourceChip source="iucn" href={iucnSpeciesUrl(city.species[0]?.scientific ?? city.name)} />
        </div>
      </section>
    </div>
  </div>
);
