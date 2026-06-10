import React, { useEffect, useMemo, useState } from 'react';
import { Expand, Minimize, Pause, Play, RotateCcw, X } from 'lucide-react';
import { HISTORY_CHAPTERS } from '../data/history';
import { Scale } from '../types';

interface Props { onSelectScale: (scale: Scale) => void; onClose: () => void; }
const DURATION = 140;

export const EvolutionPlayback: React.FC<Props> = ({ onSelectScale, onClose }) => {
  const [progress, setProgress] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const [speed, setSpeed] = useState(1);
  const chapterIndex = useMemo(() => Math.min(HISTORY_CHAPTERS.length - 1, Math.floor(progress * HISTORY_CHAPTERS.length)), [progress]);
  const chapter = HISTORY_CHAPTERS[chapterIndex];

  useEffect(() => { onSelectScale(chapter.scale); }, [chapter.scale, onSelectScale]);
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
      <div className="playback-orbit playback-orbit-one"/><div className="playback-orbit playback-orbit-two"/><div className="playback-stars"/>
      <header className="absolute inset-x-0 top-0 z-10 flex items-center gap-3 p-4"><div><div className="meta-label text-white/50">Interactive cutscene · 14 billion years to now</div><div className="text-[12px] text-white/80">Click a chapter or scrub to direct the atlas</div></div><div className="ml-auto flex gap-1"><button onClick={() => setFullscreen((value) => !value)} className="playback-icon" aria-label={fullscreen ? 'Exit full screen playback' : 'Open full screen playback'}>{fullscreen ? <Minimize className="h-4 w-4"/> : <Expand className="h-4 w-4"/>}</button><button onClick={onClose} className="playback-icon" aria-label="Close playback"><X className="h-4 w-4"/></button></div></header>
      <div className="absolute inset-0 z-[2] grid place-items-center px-6 text-center"><div key={chapter.id} className="cutscene-title"><div className="font-mono text-[11px] tracking-[.25em] text-white/55">{chapter.time.toUpperCase()}</div><h2 className="mt-2 text-3xl font-light tracking-tight text-white md:text-5xl">{chapter.label}</h2><p className="mx-auto mt-3 max-w-xl text-[12px] leading-relaxed text-white/60 md:text-[14px]">{chapter.detail}</p></div></div>
      <div className="absolute inset-x-0 bottom-0 z-10 bg-gradient-to-t from-black via-black/80 to-transparent px-4 pb-4 pt-20">
        <div className="mb-3 flex gap-1 overflow-x-auto scroll-thin pb-1">{HISTORY_CHAPTERS.map((item, index) => <button key={item.id} onClick={() => seekChapter(index)} className={`chapter-chip ${index === chapterIndex ? 'chapter-chip-active' : ''}`}><span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: item.color }}/>{item.label}</button>)}</div>
        <input className="timeline-range w-full" type="range" min={0} max={1000} value={Math.round(progress * 1000)} onChange={(event) => { setProgress(Number(event.target.value) / 1000); setPlaying(false); }} aria-label="History playback position"/>
        <div className="mt-3 flex items-center gap-3"><button onClick={() => setPlaying((value) => !value)} className="grid h-9 w-9 place-items-center rounded-full bg-white text-black" aria-label={playing ? 'Pause playback' : 'Play playback'}>{playing ? <Pause className="h-4 w-4"/> : <Play className="ml-0.5 h-4 w-4"/>}</button><button onClick={() => { setProgress(0); setPlaying(false); }} className="playback-icon" aria-label="Restart playback"><RotateCcw className="h-3.5 w-3.5"/></button><span className="font-mono text-[11px] text-white/70">{age < .001 ? 'Present' : `${age.toFixed(age < .1 ? 3 : 1)} billion years ago`}</span><label className="ml-auto flex items-center gap-2 text-[10px] text-white/50">Speed<select value={speed} onChange={(event) => setSpeed(Number(event.target.value))} className="rounded border border-white/15 bg-black px-2 py-1 text-white"><option value={1}>1x</option><option value={4}>4x</option><option value={12}>12x</option></select></label></div>
      </div>
    </div>
  </section>;
};
