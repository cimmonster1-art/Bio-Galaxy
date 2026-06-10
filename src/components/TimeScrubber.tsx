import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Play, Pause, Rewind, ChevronDown, ChevronUp, ExternalLink } from 'lucide-react';
import { Scale } from '../types';
import {
  EPOCHS,
  EPOCH_POSITIONS,
  Epoch,
  epochAtPosition,
  positionOfEpoch,
} from '../data/epochs';
import { WikipediaSection } from './panels/detail/WikipediaSection';

interface Props {
  scale: Scale;
  onSelectScale: (scale: Scale) => void;
  /** A real simulation date for the ephemeris-driven solar system. */
  onDate: (date: Date) => void;
  /** Fired when the active epoch changes, for cards and sound cues. */
  onEpoch?: (epoch: Epoch) => void;
}

// Orbit advance per real second, in days, mirroring the Astro-Insight lab.
const SPEEDS = [1, 10, 100, 1000, 10000, 100000];
const SPEED_LABEL: Record<number, string> = {
  1: '1 day/s',
  10: '10 day/s',
  100: '100 day/s',
  1000: '3 yr/s',
  10000: '27 yr/s',
  100000: '274 yr/s',
};
const DAY_MS = 86_400_000;

/**
 * The transport bar. A single play head sweeps two synchronized registers: the
 * deep-time position from the Big Bang to civilization (which jumps the camera
 * between epochs) and a real calendar date that drives the ephemeris so the
 * solar system is laid out correctly for the moment on screen. Playback speed
 * is user selectable, and the active epoch expands into a card with its
 * implications and a Wikipedia summary.
 */
export const TimeScrubber: React.FC<Props> = ({ scale, onSelectScale, onDate, onEpoch }) => {
  const [pos, setPos] = useState(() => positionOfEpoch('big_bang'));
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(1000);
  const [expanded, setExpanded] = useState(true);
  const [epoch, setEpoch] = useState<Epoch>(EPOCHS[0]);

  const simDateRef = useRef<Date>(new Date());
  const rafRef = useRef<number | null>(null);
  const lastRef = useRef<number>(0);
  const lastEpochId = useRef<string>('big_bang');
  // Throttle date emission so the parent shell does not re-render every frame.
  const dateEmitRef = useRef<number>(0);

  // Keep refs to the latest callbacks so the animation loop stays stable.
  const cb = useRef({ onSelectScale, onDate, onEpoch });
  cb.current = { onSelectScale, onDate, onEpoch };

  const commitEpoch = useCallback((p: number) => {
    const e = epochAtPosition(p);
    setEpoch(e);
    if (e.id !== lastEpochId.current) {
      lastEpochId.current = e.id;
      cb.current.onSelectScale(e.scale);
      cb.current.onEpoch?.(e);
    }
  }, []);

  // The cinematic sweep: advance both the deep-time head and the calendar date.
  useEffect(() => {
    if (!playing) return;
    const tick = (now: number): void => {
      const dt = lastRef.current ? (now - lastRef.current) / 1000 : 0;
      lastRef.current = now;

      // Deep time sweeps faster at higher speeds, but always cinematically slow.
      const sweep = 0.012 * (0.5 + Math.log10(speed));
      setPos((p) => {
        const next = Math.min(1, p + sweep * dt);
        commitEpoch(next);
        if (next >= 1) setPlaying(false);
        return next;
      });

      // Calendar date advances like the Astro-Insight lab for correct orbits.
      const advanced = new Date(simDateRef.current.getTime() + speed * DAY_MS * dt);
      simDateRef.current = advanced;
      if (now - dateEmitRef.current > 200) {
        dateEmitRef.current = now;
        cb.current.onDate(advanced);
      }

      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      lastRef.current = 0;
    };
  }, [playing, speed, commitEpoch]);

  const scrubTo = (p: number): void => {
    setPos(p);
    commitEpoch(p);
  };

  const jumpToEpoch = (e: Epoch): void => {
    scrubTo(positionOfEpoch(e.id));
  };

  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20 flex flex-col items-center gap-2 px-4 pb-4">
      {/* Active epoch card */}
      {expanded && (
        <div className="pointer-events-auto panel w-full max-w-2xl rounded-xl p-3.5" style={{ borderColor: `${epoch.accent}55` }}>
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full" style={{ background: epoch.accent, boxShadow: `0 0 8px ${epoch.accent}` }} aria-hidden />
                <h3 className="text-[14px] font-semibold text-slate-100">{epoch.title}</h3>
                {epoch.endosymbiosis && (
                  <span className="rounded-full bg-amber-500/15 px-2 py-0.5 text-[10px] text-amber-300">endosymbiosis</span>
                )}
              </div>
              <div className="mt-0.5 font-mono text-[11px] text-cyan-300/80">{epoch.time}</div>
            </div>
            <button onClick={() => setExpanded(false)} aria-label="Collapse epoch card" className="text-slate-400 hover:text-slate-100">
              <ChevronDown className="h-4 w-4" aria-hidden />
            </button>
          </div>

          <div className="mt-2 grid gap-3 md:grid-cols-[1.4fr_1fr]">
            <div>
              <p className="text-[12px] leading-relaxed text-slate-300">{epoch.detail}</p>
              <div className="mt-2">
                <div className="meta-label mb-1">Implications</div>
                <ul className="space-y-1">
                  {epoch.implications.map((im) => (
                    <li key={im} className="flex gap-2 text-[11.5px] leading-relaxed text-slate-400">
                      <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full" style={{ background: epoch.accent }} aria-hidden />
                      {im}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
            <div className="min-w-0">
              <WikipediaSection title={epoch.wikipedia} />
            </div>
          </div>
        </div>
      )}

      {/* Transport bar */}
      <div className="pointer-events-auto panel flex w-full max-w-2xl items-center gap-3 rounded-full px-3 py-2">
        <button
          onClick={() => setPlaying((p) => !p)}
          aria-label={playing ? 'Pause' : 'Play'}
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-cyan-500/20 text-cyan-200 transition hover:bg-cyan-500/30"
        >
          {playing ? <Pause className="h-4 w-4" aria-hidden /> : <Play className="h-4 w-4" aria-hidden />}
        </button>
        <button
          onClick={() => scrubTo(0)}
          aria-label="Rewind to the Big Bang"
          className="shrink-0 text-slate-400 transition hover:text-slate-100"
        >
          <Rewind className="h-4 w-4" aria-hidden />
        </button>

        <div className="relative flex-1">
          {/* Epoch ticks */}
          <div className="pointer-events-none absolute inset-x-0 top-1/2 flex -translate-y-1/2 justify-between">
            {EPOCH_POSITIONS.map((p, i) => (
              <span
                key={i}
                className="h-1.5 w-1.5 rounded-full"
                style={{ background: EPOCHS[i].id === epoch.id ? EPOCHS[i].accent : '#334155' }}
              />
            ))}
          </div>
          <input
            type="range"
            min={0}
            max={1}
            step={0.001}
            value={pos}
            onChange={(e) => scrubTo(parseFloat(e.target.value))}
            aria-label="Scrub through deep time"
            className="relative w-full cursor-pointer appearance-none bg-transparent"
          />
        </div>

        <select
          value={speed}
          onChange={(e) => setSpeed(parseInt(e.target.value, 10))}
          aria-label="Playback speed"
          className="shrink-0 rounded-md border border-white/10 bg-[#0a1220] px-2 py-1 text-[11px] text-slate-200 focus:outline-none"
        >
          {SPEEDS.map((s) => (
            <option key={s} value={s}>
              {SPEED_LABEL[s]}
            </option>
          ))}
        </select>

        {!expanded && (
          <button onClick={() => setExpanded(true)} aria-label="Show epoch card" className="shrink-0 text-slate-400 hover:text-slate-100">
            <ChevronUp className="h-4 w-4" aria-hidden />
          </button>
        )}
      </div>

      {/* Epoch rail */}
      <div className="pointer-events-auto flex max-w-3xl flex-wrap justify-center gap-1">
        {EPOCHS.map((e) => (
          <button
            key={e.id}
            onClick={() => jumpToEpoch(e)}
            className={`rounded-full px-2 py-0.5 text-[10px] transition ${
              e.id === epoch.id ? 'text-slate-100' : 'text-slate-500 hover:text-slate-300'
            }`}
            style={e.id === epoch.id ? { background: `${e.accent}22` } : undefined}
          >
            {e.title}
          </button>
        ))}
      </div>
      {/* Keep the scale context honest when the user scrubs. */}
      <span className="sr-only">Current scale {Scale[scale]}</span>
    </div>
  );
};
