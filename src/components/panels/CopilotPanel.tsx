import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Sparkles, ChevronDown, ChevronUp, Send } from 'lucide-react';
import { BioObject } from '../../types';
import { CopilotMessage, answerQuestion, suggestQuestions } from '../../data/copilot';

interface Props {
  selected: BioObject | null;
  expanded: boolean;
  onToggle: () => void;
}

/**
 * A grounded copilot docked at the foot of the detail sidebar. It always knows
 * what the user has clicked, offers three context-aware suggested questions,
 * and answers from the curated records and public databases (see data/copilot).
 * Collapsed it is a slim bar; expanded it fills the lower portion of the
 * sidebar.
 */
export const CopilotPanel: React.FC<Props> = ({ selected, expanded, onToggle }) => {
  const [messages, setMessages] = useState<CopilotMessage[]>([]);
  const [input, setInput] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  const suggestions = useMemo(() => suggestQuestions(selected), [selected]);

  // Greet with context whenever the selection changes.
  useEffect(() => {
    if (!selected) {
      setMessages([]);
      return;
    }
    setMessages([
      {
        role: 'copilot',
        text: `You selected ${selected.name}. Ask me anything, or tap a suggestion below.`,
      },
    ]);
  }, [selected]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, expanded]);

  const ask = (question: string): void => {
    const text = question.trim();
    if (!text) return;
    const reply = answerQuestion(selected, text);
    setMessages((m) => [...m, { role: 'user', text }, { role: 'copilot', text: reply }]);
    setInput('');
  };

  return (
    <section
      className={`flex shrink-0 flex-col border-t border-cyan-500/20 bg-[#050a14] transition-all ${
        expanded ? 'flex-1' : ''
      }`}
      aria-label="Copilot assistant"
    >
      <button
        onClick={onToggle}
        className="flex items-center justify-between px-4 py-2.5 text-left transition hover:bg-white/5"
      >
        <span className="flex items-center gap-2 text-[12px] font-semibold text-cyan-200">
          <Sparkles className="h-3.5 w-3.5" aria-hidden /> Copilot
          <span className="meta-label font-normal text-slate-500">grounded in the databases</span>
        </span>
        {expanded ? (
          <ChevronDown className="h-4 w-4 text-slate-400" aria-hidden />
        ) : (
          <ChevronUp className="h-4 w-4 text-slate-400" aria-hidden />
        )}
      </button>

      {expanded && (
        <div className="flex min-h-0 flex-1 flex-col">
          <div ref={scrollRef} className="min-h-0 flex-1 space-y-2 overflow-y-auto scroll-thin px-4 py-2">
            {messages.length === 0 && (
              <p className="text-[12px] leading-relaxed text-slate-500">
                Select an object in the atlas and I will explain it using the curated records and
                public databases.
              </p>
            )}
            {messages.map((m, i) => (
              <div
                key={i}
                className={`max-w-[92%] rounded-lg px-3 py-2 text-[12px] leading-relaxed ${
                  m.role === 'user'
                    ? 'ml-auto bg-cyan-500/15 text-cyan-100'
                    : 'bg-white/5 text-slate-300'
                }`}
              >
                {m.text}
              </div>
            ))}
          </div>

          <div className="flex flex-wrap gap-1.5 px-4 pb-2">
            {suggestions.map((s) => (
              <button
                key={s}
                onClick={() => ask(s)}
                className="rounded-full border border-cyan-500/25 px-2.5 py-1 text-[11px] text-cyan-200/90 transition hover:border-cyan-400/60 hover:bg-cyan-500/10"
              >
                {s}
              </button>
            ))}
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              ask(input);
            }}
            className="flex items-center gap-2 border-t border-white/10 px-3 py-2"
          >
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about the selection..."
              className="min-w-0 flex-1 bg-transparent text-[12px] text-slate-200 placeholder:text-slate-600 focus:outline-none"
            />
            <button
              type="submit"
              aria-label="Send"
              className="rounded-md border border-white/10 p-1.5 text-cyan-200 transition hover:border-cyan-400/50 hover:bg-cyan-500/10"
            >
              <Send className="h-3.5 w-3.5" aria-hidden />
            </button>
          </form>
        </div>
      )}
    </section>
  );
};
