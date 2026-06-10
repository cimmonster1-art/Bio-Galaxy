import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Expand, Minimize, Pause, Play, RotateCcw, X } from 'lucide-react';
import { HISTORY_CHAPTERS } from '../data/history';
import { Scale } from '../types';

interface Props {
  onSelectScale: (scale: Scale) => void;
  onProgress: (progress: number) => void;
  onClose: () => void;
}
const DURATION = 140;

/**
 * A self-contained, history-aware cinematic backdrop. It paints an animated
 * cosmic field whose mood tracks the current epoch — an expanding flash at the
 * Big Bang, drifting nebulae and galaxies in the deep-time chapters, warming into
 * the living world — over the live 3D atlas showing through behind it. No
 * external video; everything is generated procedurally so the cutscene is always
 * available and on-topic.
 */
const EpochBackdrop: React.FC<{ progress: number; color: string }> = ({ progress, color }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const state = useRef({ progress, color });
  state.current = { progress, color };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const particles = Array.from({ length: 220 }, () => ({
      a: Math.random() * Math.PI * 2,
      r: Math.random(),
      s: 0.4 + Math.random() * 1.6,
      tw: Math.random() * Math.PI * 2,
    }));

    let raf = 0;
    let t0 = performance.now();
    const hexToRgb = (hex: string): [number, number, number] => {
      const v = hex.replace('#', '');
      return [parseInt(v.slice(0, 2), 16), parseInt(v.slice(2, 4), 16), parseInt(v.slice(4, 6), 16)];
    };

    const draw = (now: number) => {
      const time = (now - t0) / 1000;
      const { progress: p, color: c } = state.current;
      const w = (canvas.width = canvas.clientWidth);
      const h = (canvas.height = canvas.clientHeight);
      const cx = w / 2;
      const cy = h * 0.48;
      const [cr, cg, cb] = hexToRgb(c);
      ctx.clearRect(0, 0, w, h);

      // Epoch-tinted nebula wash.
      const neb = ctx.createRadialGradient(cx, cy, 0, cx, cy, Math.max(w, h) * 0.7);
      neb.addColorStop(0, `rgba(${cr},${cg},${cb},0.16)`);
      neb.addColorStop(0.4, `rgba(${cr},${cg},${cb},0.05)`);
      neb.addColorStop(1, 'rgba(2,4,10,0)');
      ctx.fillStyle = neb;
      ctx.fillRect(0, 0, w, h);

      // Big Bang flash over the opening epoch (0 -> ~0.12 of the timeline).
      const bang = Math.max(0, 1 - p / 0.12);
      if (bang > 0) {
        const fr = (1 - bang) * Math.max(w, h) * 0.9 + 20;
        const flash = ctx.createRadialGradient(cx, cy, 0, cx, cy, fr);
        flash.addColorStop(0, `rgba(255,250,235,${bang * 0.9})`);
        flash.addColorStop(0.5, `rgba(${cr},${cg},${cb},${bang * 0.4})`);
        flash.addColorStop(1, 'rgba(2,4,10,0)');
        ctx.globalCompositeOperation = 'screen';
        ctx.fillStyle = flash;
        ctx.fillRect(0, 0, w, h);
        ctx.globalCompositeOperation = 'source-over';
      }

      // Drifting particles spiral slowly; later epochs feel warmer and calmer.
      const spin = reduce ? 0 : time * 0.05 * (1 - p * 0.6);
      const reach = Math.min(w, h) * (0.12 + p * 0.42);
      ctx.globalCompositeOperation = 'screen';
      for (const pt of particles) {
        const ang = pt.a + spin + pt.r * 4;
        const rad = (0.2 + pt.r) * reach + (bang > 0 ? (1 - bang) * reach * 0.5 : 0);
        const x = cx + Math.cos(ang) * rad;
        const y = cy + Math.sin(ang) * rad * 0.7;
        const tw = reduce ? 0.7 : 0.45 + Math.sin(time * 2 + pt.tw) * 0.4;
        ctx.fillStyle = `rgba(${Math.min(255, cr + 80)},${Math.min(255, cg + 70)},${Math.min(255, cb + 60)},${tw * 0.5})`;
        ctx.beginPath();
        ctx.arc(x, y, pt.s, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalCompositeOperation = 'source-over';

      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf);
  }, []);

  return <canvas ref={canvasRef} className="playback-canvas" aria-hidden="true" />;
};

export const EvolutionPlayback: React.FC<Props> = ({ onSelectScale, onProgress, onClose }) => {
  const [progress, setProgress] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const [speed, setSpeed] = useState(1);
  const chapterIndex = useMemo(() => Math.min(HISTORY_CHAPTERS.length - 1, Math.floor(progress * HISTORY_CHAPTERS.length)), [progress]);
  const chapter = HISTORY_CHAPTERS[chapterIndex];

  useEffect(() => { onSelectScale(chapter.scale); }, [chapter.scale, onSelectScale]);
  useEffect(() => { onProgress(progress); }, [onProgress, progress]);
  useEffect(() => () => onProgress(0), [onProgress]);
  useEffect(() => {
    if (!playing) return;
    let frame = 0;
    let previous = performance.now();
    const tick = (now: number) => { const elapsed = (now - previous) / 1000; previous = now; setProgress((value) => { const next = value + elapsed * speed / DURATION; if (next >= 1) { setPlaying(false); return 1; } return next; }); frame = requestAnimationFrame(tick); };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [playing, speed]);

  const seekChapter = (index: number) => { setProgress(index / HISTORY_CHAPTERS.length); setPlaying(false); };
  const age = Math.max(0, 14 * (1 - progress));
  return <section className={`playback-overlay ${fullscreen ? 'playback-fullscreen' : ''}`} aria-label="Fourteen billion year interactive playback">
    <div className="playback-stage" style={{ '--chapter-color': chapter.color } as React.CSSProperties}>
      <EpochBackdrop progress={progress} color={chapter.color} />
      <div className="playback-video-tint" />
      <div className="playback-orbit playback-orbit-one"/><div className="playback-orbit playback-orbit-two"/><div className="playback-stars"/>
      <header className="absolute inset-x-0 top-0 z-10 flex items-center gap-3 p-4"><div><div className="meta-label text-white/50">Interactive cutscene · 14 billion years to now</div><div className="text-[12px] text-white/80">Click a chapter or scrub to direct the atlas</div></div><div className="ml-auto flex gap-1"><button onClick={() => setFullscreen((value) => !value)} className="playback-icon" aria-label={fullscreen ? 'Exit full screen playback' : 'Open full screen playback'}>{fullscreen ? <Minimize className="h-4 w-4"/> : <Expand className="h-4 w-4"/>}</button><button onClick={onClose} className="playback-icon" aria-label="Close playback"><X className="h-4 w-4"/></button></div></header>
      <div className="absolute inset-0 z-[2] grid place-items-center px-6 text-center"><div key={chapter.id} className="cutscene-title"><div className="font-mono text-[11px] tracking-[.25em] text-white/55">{chapter.time.toUpperCase()}</div><h2 className="mt-2 text-3xl font-light tracking-tight text-white md:text-5xl">{chapter.label}</h2><p className="mx-auto mt-3 max-w-xl text-[12px] leading-relaxed text-white/60 md:text-[14px]">{chapter.detail}</p></div></div>
      <div className="absolute inset-x-0 bottom-0 z-10 bg-gradient-to-t from-black via-black/80 to-transparent px-4 pb-4 pt-20">
        <div className="mb-3 flex gap-1 overflow-x-auto scroll-thin pb-1">{HISTORY_CHAPTERS.map((item, index) => <button key={item.id} onClick={() => seekChapter(index)} className={`chapter-chip ${index === chapterIndex ? 'chapter-chip-active' : ''}`}><span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: item.color }}/>{item.label}</button>)}</div>
        <input className="timeline-range w-full" type="range" min={0} max={1000} value={Math.round(progress * 1000)} onChange={(event) => { setProgress(Number(event.target.value) / 1000); setPlaying(false); }} aria-label="History playback position"/>
        <div className="mt-3 flex items-center gap-3"><button onClick={() => setPlaying((value) => !value)} className="grid h-9 w-9 place-items-center rounded-full bg-white text-black" aria-label={playing ? 'Pause playback' : 'Play playback'}>{playing ? <Pause className="h-4 w-4"/> : <Play className="ml-0.5 h-4 w-4"/>}</button><button onClick={() => { setProgress(0); setPlaying(false); }} className="playback-icon" aria-label="Restart playback"><RotateCcw className="h-3.5 w-3.5"/></button><span className="font-mono text-[11px] text-white/70">{age < .001 ? 'Present' : `${age.toFixed(age < .1 ? 3 : 1)} billion years ago`}</span><span className="hidden text-[9px] text-white/35 sm:inline">Live 3D atlas cinematic</span><label className="ml-auto flex items-center gap-2 text-[10px] text-white/50">Speed<select value={speed} onChange={(event) => setSpeed(Number(event.target.value))} className="rounded border border-white/15 bg-black px-2 py-1 text-white"><option value={1}>1x</option><option value={4}>4x</option><option value={12}>12x</option></select></label></div>
      </div>
    </div>
  </section>;
};
