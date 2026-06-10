import React, { FormEvent, useEffect, useMemo, useRef, useState } from 'react';
import { Bot, ChevronDown, Database, Eye, Send, X } from 'lucide-react';
import { BioObject, Scale } from '../types';
import { SCALE_LEVELS } from '../data/scales';
import { DATA_SOURCES } from '../data/sources';
import { answerQuestion, contextualQuestions, contextualStops, CopilotAnswer } from '../data/copilot';

interface Props { scale: Scale; selected: BioObject | null; hovered: BioObject | null; }
interface Exchange { question: string; answer: CopilotAnswer; }

/** Read-only contextual atlas guide. It observes scene state but never navigates or changes it. */
export const AtlasCopilot: React.FC<Props> = ({ scale, selected, hovered }) => {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [exchanges, setExchanges] = useState<Exchange[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const context = useMemo(() => ({ scale, selected, hovered }), [scale, selected, hovered]);
  const observed = hovered ?? selected;
  const questions = useMemo(() => contextualQuestions(context), [context]);
  const stops = useMemo(() => contextualStops(context), [context]);

  useEffect(() => {
    const key = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key === '/') {
        event.preventDefault();
        setOpen((value) => !value);
      }
    };
    window.addEventListener('keydown', key);
    return () => window.removeEventListener('keydown', key);
  }, []);

  const ask = (question: string) => {
    const clean = question.trim();
    if (!clean) return;
    setExchanges((current) => [...current, { question: clean, answer: answerQuestion(clean, context) }]);
    setQuery('');
  };

  const stageQuestion = (question: string) => {
    setQuery(question);
    requestAnimationFrame(() => inputRef.current?.focus());
  };

  const submit = (event: FormEvent) => {
    event.preventDefault();
    ask(query);
  };

  return <div className="fixed bottom-3 right-3 sm:bottom-5 sm:right-5 z-[100] flex flex-col items-end gap-2">
    {open && <section className="panel flex h-[min(650px,calc(100dvh-6rem))] w-[min(430px,calc(100vw-2rem))] flex-col overflow-hidden rounded-2xl border-cyan-400/20 shadow-2xl shadow-black/60" aria-label="Bio Galaxy copilot">
      <header className="flex items-center gap-2 border-b border-white/10 bg-cyan-500/[.06] px-3 py-3">
        <span className="grid h-8 w-8 place-items-center rounded-lg bg-cyan-400/15 text-cyan-200"><Bot className="h-4 w-4"/></span>
        <div className="min-w-0 flex-1"><div className="text-[12px] font-semibold">Atlas copilot</div><div className="meta-label truncate">Observing {observed?.name ?? SCALE_LEVELS[scale].name}</div></div>
        <button onClick={() => setOpen(false)} className="rounded-md p-2 text-slate-400 hover:bg-white/10 hover:text-white" aria-label="Minimize copilot"><ChevronDown className="h-4 w-4"/></button>
        <button onClick={() => setOpen(false)} className="rounded-md p-2 text-slate-400 hover:bg-white/10 hover:text-white" aria-label="Close copilot"><X className="h-4 w-4"/></button>
      </header>
      <div className="flex-1 space-y-4 overflow-y-auto p-3 scroll-thin">
        <div className="rounded-xl border border-cyan-400/15 bg-cyan-400/[.04] p-3 text-[11px] leading-relaxed text-slate-300">
          <div className="mb-1 flex items-center gap-1.5 font-semibold text-cyan-200"><Eye className="h-3.5 w-3.5"/> Read-only scene observer</div>
          I can see the current scale, selection, and hovered object. I explain them using the complete locally indexed atlas corpus and its source registry. I never move the camera or change your selection.
        </div>

        {exchanges.length === 0 && <AnswerCard answer={answerQuestion(`Explain ${observed?.name ?? 'this view'} in intricate detail`, context)} />}
        {exchanges.map((exchange, index) => <div key={`${exchange.question}-${index}`} className="space-y-2">
          <div className="ml-8 rounded-xl bg-white/[.06] px-3 py-2 text-[11px] text-slate-200">{exchange.question}</div>
          <AnswerCard answer={exchange.answer}/>
        </div>)}

        <div><div className="meta-label mb-2">Questions based on this view</div><div className="grid gap-2">{questions.map((question) => <button key={question} onClick={() => stageQuestion(question)} className="rounded-lg border border-white/10 bg-white/[.02] px-3 py-2 text-left text-[11px] text-slate-300 hover:border-cyan-400/30 hover:text-cyan-100">{question}</button>)}</div></div>
        <div><div className="meta-label mb-2">Related stops in the corpus</div><div className="grid grid-cols-1 gap-2 sm:grid-cols-3">{stops.map((stop) => <div key={stop.id} className="rounded-lg border border-white/10 bg-black/20 px-2.5 py-2"><div className="text-[10px] font-medium text-slate-200">{stop.name}</div><div className="mt-1 font-mono text-[8px] uppercase text-slate-500">{SCALE_LEVELS[stop.scale].name}</div></div>)}</div><p className="mt-1.5 text-[9px] text-slate-500">Stops are informational only. The copilot does not navigate.</p></div>
      </div>
      <form className="flex gap-2 border-t border-white/10 p-3" onSubmit={submit}><input ref={inputRef} value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Ask any question about this view" className="min-w-0 flex-1 rounded-lg border border-white/10 bg-black/30 px-3 text-[12px] outline-none focus:border-cyan-400/40"/><button className="grid h-9 w-9 place-items-center rounded-lg bg-cyan-400 text-slate-950 disabled:opacity-40" aria-label="Send" disabled={!query.trim()}><Send className="h-3.5 w-3.5"/></button></form>
    </section>}
    <button onClick={() => setOpen((value) => !value)} className="copilot-launcher flex min-h-12 items-center gap-2 rounded-full border border-cyan-300/40 bg-[#08202b] px-4 py-3 text-[12px] font-semibold text-cyan-100 shadow-xl shadow-black/50 transition hover:scale-105 hover:border-cyan-200 focus:outline-none focus:ring-2 focus:ring-cyan-300" aria-expanded={open} aria-label="Open atlas copilot"><Bot className="h-4 w-4"/><span>Copilot</span><span className="hidden font-mono text-[9px] text-cyan-300/60 sm:inline">⌘/</span></button>
  </div>;
};

const AnswerCard: React.FC<{ answer: CopilotAnswer }> = ({ answer }) => <article className="rounded-xl border border-white/10 bg-white/[.025] p-3 text-[11px] leading-relaxed text-slate-300">
  <h3 className="mb-2 text-[12px] font-semibold text-cyan-100">{answer.title}</h3>
  <div className="space-y-2">{answer.paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}</div>
  <div className="mt-3 border-t border-white/10 pt-2"><div className="meta-label mb-1.5">Corpus evidence</div><ul className="space-y-1">{answer.evidence.map((item) => <li key={item} className="flex gap-1.5"><span className="text-cyan-400">•</span><span>{item}</span></li>)}</ul></div>
  <div className="mt-3 flex flex-wrap gap-1.5">{answer.sources.map((source) => <span key={source} className="inline-flex items-center gap-1 rounded-full border border-cyan-400/15 bg-cyan-400/[.05] px-2 py-1 font-mono text-[8px] uppercase text-cyan-200"><Database className="h-2.5 w-2.5"/>{DATA_SOURCES[source].short}</span>)}</div>
</article>;
