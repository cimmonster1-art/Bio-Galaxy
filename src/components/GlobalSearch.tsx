import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Search } from 'lucide-react';
import { searchAtlas } from '../data/search';

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

      {open && results.length > 0 && (
        <ul
          id="atlas-search-list"
          role="listbox"
          aria-label="Search results"
          className="panel absolute left-0 right-0 top-full z-30 mt-1 max-h-72 overflow-y-auto scroll-thin rounded-md py-1"
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
  );
};
