import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { EXTRACTOR_KINDS, RESOURCES, getResource } from '../data/mining';
import ResourceIcon from './ResourceIcon';
import { ChevronDownIcon, SearchIcon } from './icons';

interface Props {
  value: string;
  onChange: (resourceId: string) => void;
}

/** Searchable resource picker (combobox) with icons and keyboard support. */
export default function ResourceSelect({ value, onChange }: Props) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);

  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const listboxId = useId();

  const selected = getResource(value);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return RESOURCES;
    return RESOURCES.filter(
      (r) =>
        r.name.toLowerCase().includes(q) ||
        r.short.toLowerCase().includes(q) ||
        EXTRACTOR_KINDS[r.extractor].label.toLowerCase().includes(q),
    );
  }, [query]);

  // Close when clicking outside.
  useEffect(() => {
    if (!open) return;
    function onDown(e: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [open]);

  // On open: reset query, focus search, highlight current selection.
  useEffect(() => {
    if (!open) return;
    setQuery('');
    setActiveIndex(Math.max(0, RESOURCES.findIndex((r) => r.id === value)));
    const id = requestAnimationFrame(() => inputRef.current?.focus());
    return () => cancelAnimationFrame(id);
  }, [open, value]);

  // Keep the active index within the filtered range.
  useEffect(() => {
    setActiveIndex((i) => Math.min(i, Math.max(0, filtered.length - 1)));
  }, [filtered.length]);

  // Scroll the active option into view.
  useEffect(() => {
    if (!open) return;
    const node = listRef.current?.querySelector(`[data-index="${activeIndex}"]`);
    (node as HTMLElement | null)?.scrollIntoView({ block: 'nearest' });
  }, [activeIndex, open]);

  function commit(resourceId: string) {
    onChange(resourceId);
    setOpen(false);
  }

  function onInputKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, filtered.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const item = filtered[activeIndex];
      if (item) commit(item.id);
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setOpen(false);
    }
  }

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className="flex w-full items-center gap-2 rounded-md border border-slate-700 bg-slate-900 px-2 py-1.5 text-sm text-slate-100 focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500/60"
      >
        <ResourceIcon resource={selected} size={20} />
        <span className="truncate">{selected.name}</span>
        <ChevronDownIcon
          className={'ml-auto h-4 w-4 shrink-0 text-slate-400 transition-transform ' + (open ? 'rotate-180' : '')}
        />
      </button>

      {open && (
        <div className="absolute z-30 mt-1 w-full overflow-hidden rounded-md border border-slate-700 bg-slate-900 shadow-xl">
          <div className="flex items-center gap-2 border-b border-slate-700 px-2 py-1.5">
            <SearchIcon className="h-4 w-4 shrink-0 text-slate-500" />
            <input
              ref={inputRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={onInputKeyDown}
              placeholder="Search resource…"
              aria-controls={listboxId}
              className="w-full bg-transparent text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none"
            />
          </div>
          <ul ref={listRef} id={listboxId} role="listbox" className="max-h-60 overflow-auto py-1">
            {filtered.length === 0 ? (
              <li className="px-3 py-2 text-sm text-slate-500">No matches</li>
            ) : (
              filtered.map((r, idx) => (
                <li
                  key={r.id}
                  role="option"
                  aria-selected={r.id === value}
                  data-index={idx}
                  onMouseEnter={() => setActiveIndex(idx)}
                  onClick={() => commit(r.id)}
                  className={
                    'flex cursor-pointer items-center gap-2 px-2 py-1.5 text-sm ' +
                    (idx === activeIndex ? 'bg-slate-700/70' : '')
                  }
                >
                  <ResourceIcon resource={r} size={20} />
                  <span className="text-slate-100">{r.name}</span>
                  {r.id === value && <span className="text-orange-400">✓</span>}
                  <span className="ml-auto pl-2 text-[10px] uppercase tracking-wide text-slate-500">
                    {EXTRACTOR_KINDS[r.extractor].label}
                  </span>
                </li>
              ))
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
