import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Search } from 'lucide-react';
import { searchAtlas } from '../data/search';
import { instantPreview, resolvePreview, type PreviewModel } from '../data/searchPreview';
import { SearchPreview3D } from './SearchPreview3D';

interface Props {
  onSelect: (id: string) => void;
}

/**
 * Global atlas search. An accessible combobox over taxa, subcellular objects,
 * and anatomy. Press "/" to focus, arrow keys to move, Enter to navigate, and
 * Escape to dismiss. Selecting a result commits the camera to that object.
 */
export const GlobalSearch: React.FC<Props> = ({ onSelect }) => {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const results = useMemo(() => searchAtlas(query), [query]);
  const active = results[activeIndex] ?? results[0];
  const [preview, setPreview] = useState<PreviewModel | null>(null);

  // Render a live 3D model of whatever is highlighted: an instant stand-in first,
  // then the real fetched structure when one resolves. Each keystroke or arrow
  // move supersedes the previous fetch.
  useEffect(() => {
    const q = query.trim();
    if (!q) {
      setPreview(null);
      return;
    }
    setPreview(instantPreview(query, active));
    const controller = new AbortController();
    resolvePreview(query, active, controller.signal)
      .then((model) => {
        if (model && !controller.signal.aborted) setPreview(model);
      })
      .catch(() => {
        /* Keep the instant stand-in if the upstream fetch fails. */
      });
    return () => controller.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, active?.id]);

  const previewLabel = useMemo(() => {
    if (!preview) return null;
    if (preview.kind === 'backbone') return 'Protein backbone ribbon';
    if (preview.kind === 'ballstick') return 'Ball-and-stick conformer';
    if (preview.kind === 'peptide') return 'Idealized α-helix';
    if (preview.kind === 'dna') return 'DNA double helix';
    if (preview.kind === 'star') return 'Stellar model';
    if (preview.kind === 'planet') return 'Planetary body';
    return 'Atlas object';
  }, [preview]);

  // "/" focuses the search from anywhere outside a text field.
  useEffect(() => {
    const onKey = (e: KeyboardEvent): void => {
      const target = e.target as HTMLElement;
      const typing = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA';
      if (e.key === '/' && !typing) {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  // Close when focus leaves the component.
  useEffect(() => {
    const onClick = (e: MouseEvent): void => {
      if (!containerRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  const choose = (id: string): void => {
    onSelect(id);
    setOpen(false);
    setQuery('');
    inputRef.current?.blur();
  };

  const onKeyDown = (e: React.KeyboardEvent): void => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setOpen(true);
      setActiveIndex((i) => Math.min(i + 1, results.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === 'Enter' && results[activeIndex]) {
      e.preventDefault();
      choose(results[activeIndex].id);
    } else if (e.key === 'Escape') {
      setOpen(false);
      inputRef.current?.blur();
    }
  };

  return (
    <div ref={containerRef} className="relative w-full max-w-md">
      <div
        className="flex items-center gap-2 rounded-md border border-white/10 bg-black/40 px-3 py-1.5 focus-within:border-cyan-500/50"
        role="combobox"
        aria-expanded={open && results.length > 0}
        aria-haspopup="listbox"
        aria-owns="atlas-search-list"
      >
        <Search className="h-3.5 w-3.5 text-slate-500" aria-hidden />
        <input
          ref={inputRef}
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
            setActiveIndex(0);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={onKeyDown}
          placeholder="Search life  ( / )"
          aria-label="Search the atlas"
          aria-controls="atlas-search-list"
          aria-autocomplete="list"
          aria-activedescendant={
            open && results[activeIndex] ? `atlas-search-opt-${activeIndex}` : undefined
          }
          className="w-full bg-transparent text-[12px] text-slate-200 placeholder:text-slate-600 focus:outline-none"
        />
      </div>

      {open && query.trim() && (preview || results.length > 0) && (
        <div className="panel absolute left-0 right-0 top-full z-30 mt-1 overflow-hidden rounded-md">
          {preview && (
            <div className="flex items-stretch gap-3 border-b border-white/10 bg-gradient-to-b from-cyan-500/[0.06] to-transparent p-2.5">
              <div className="h-24 w-24 shrink-0 overflow-hidden rounded-md border border-white/10 bg-[#02040a]">
                <SearchPreview3D model={preview} />
              </div>
              <div className="flex min-w-0 flex-col justify-center gap-1">
                <span className="meta-label text-cyan-300/90">Live 3D preview</span>
                <span className="truncate text-[13px] font-semibold text-slate-100">{preview.title}</span>
                <span className="text-[11px] text-slate-400">{previewLabel}</span>
                <span className="truncate text-[10px] text-slate-500">{preview.source}</span>
              </div>
            </div>
          )}
          {results.length > 0 && (
        <ul
          id="atlas-search-list"
          role="listbox"
          aria-label="Search results"
          className="max-h-60 overflow-y-auto scroll-thin py-1"
        >
          {results.map((r, i) => (
            <li
              key={r.id}
              id={`atlas-search-opt-${i}`}
              role="option"
              aria-selected={i === activeIndex}
            >
              <button
                onMouseEnter={() => setActiveIndex(i)}
                onClick={() => choose(r.id)}
                className={`flex w-full items-center justify-between gap-3 px-3 py-1.5 text-left transition ${
                  i === activeIndex ? 'bg-cyan-500/10' : 'hover:bg-white/[0.03]'
                }`}
              >
                <span className="truncate text-[12px] text-slate-100">{r.label}</span>
                <span className="meta-label shrink-0">{r.sublabel}</span>
              </button>
            </li>
          ))}
        </ul>
          )}
        </div>
      )}
    </div>
  );
};
