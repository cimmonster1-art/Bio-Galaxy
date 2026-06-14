import React from 'react';
import { ChevronLeft, MapPin } from 'lucide-react';
import { EcologyCity } from '../../data/ecology';
import { wikipedia } from '../../data/clients';
import { useAsync } from '../../hooks/useAsync';
import { EcologySidebar } from './EcologySidebar';
import { EcologyCardRail } from './EcologyCardRail';

interface Props {
  city: EcologyCity;
  onNavigate: (id: string) => void;
  onClose: () => void;
}

/**
 * The city dive — the Astro Insight experience, rebuilt for Earth science. A
 * cinematic descent into the selected city sits over the globe, with the
 * ecological profile sidebar and the swipeable scientific card rail. Closing it
 * returns to the globe; selecting a species descends into the organism scale.
 */
export const CityDiveView: React.FC<Props> = ({ city, onNavigate, onClose }) => {
  const { data: wiki, loading } = useAsync(
    (signal) => wikipedia.getSummary(city.wikiTitle, { signal }),
    [city.wikiTitle],
  );

  return (
    <div className="eco-dive-enter absolute inset-0 z-30 flex flex-col overflow-hidden" aria-label={`Ecological profile of ${city.name}`}>
      {/* Cinematic backdrop: a slow descent over the city, with drifting haze. */}
      <div className="absolute inset-0 -z-10 overflow-hidden bg-[#02040a]">
        <div
          className="eco-dive-breathe absolute inset-0 bg-cover bg-center opacity-55"
          style={wiki?.thumbnail
            ? { backgroundImage: `url(${wiki.thumbnail})` }
            : { background: 'radial-gradient(circle at 50% 30%, rgba(39,196,217,0.18), transparent 60%), radial-gradient(circle at 70% 80%, rgba(30,90,140,0.22), transparent 55%)' }}
        />
        <div className="eco-dive-clouds absolute inset-0 opacity-70" />
        <div className="absolute inset-0 bg-gradient-to-b from-[#02040a]/55 via-[#02040a]/35 to-[#02040a]/92" />
        <div className="absolute inset-0" style={{ boxShadow: 'inset 0 0 220px 40px rgba(2,4,10,0.85)' }} />
      </div>

      {/* Header */}
      <header className="flex items-center gap-3 px-4 py-3">
        <button
          onClick={onClose}
          className="flex items-center gap-1.5 rounded-md border border-white/15 bg-black/30 px-2.5 py-1.5 text-[11px] text-slate-200 backdrop-blur transition hover:border-cyan-400/40 hover:text-cyan-200"
        >
          <ChevronLeft className="h-3.5 w-3.5" /> Globe
        </button>
        <div className="flex items-center gap-2 rounded-md border border-white/10 bg-black/30 px-3 py-1.5 backdrop-blur">
          <MapPin className="h-3.5 w-3.5 text-cyan-300" />
          <span className="text-[13px] font-semibold text-slate-50">{city.name}</span>
          <span className="text-[11px] text-slate-400">{city.country}</span>
          <span className="ml-1 rounded-sm bg-cyan-400/15 px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-wide text-cyan-200">
            Köppen {city.climate.koppen}
          </span>
        </div>
      </header>

      {/* Body: science sidebar + open scene */}
      <div className="flex min-h-0 flex-1">
        <aside className="eco-rise m-3 mr-0 hidden w-[22rem] shrink-0 overflow-hidden rounded-xl border border-white/10 bg-[#04070f]/85 backdrop-blur-md md:block">
          <EcologySidebar city={city} onNavigate={onNavigate} />
        </aside>
        <div className="hidden flex-1 md:block" aria-hidden />
      </div>

      {/* Mobile sidebar collapses into a scrollable sheet above the rail. */}
      <aside className="eco-rise mx-3 mb-2 max-h-[42vh] overflow-hidden rounded-xl border border-white/10 bg-[#04070f]/90 backdrop-blur-md md:hidden">
        <EcologySidebar city={city} onNavigate={onNavigate} />
      </aside>

      {/* Bottom card rail */}
      <div className="eco-rise h-[15.5rem] shrink-0 border-t border-white/10 bg-gradient-to-t from-[#02040a] to-transparent">
        <EcologyCardRail city={city} wiki={wiki} wikiLoading={loading} onNavigate={onNavigate} />
      </div>
    </div>
  );
};
