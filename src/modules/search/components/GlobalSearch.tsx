'use client';

import { useEffect, useRef, useState, useCallback, type KeyboardEvent } from 'react';
import { useRouter } from 'next/navigation';
import { Search, Users, Building2, CalendarOff } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useSearch } from '../hooks/useSearch';
import type { SearchResult, SearchResultType } from '../types/search.types';
import { useDebounce } from '@/hooks/useDebounce';
import { cn } from '@/lib/utils';
import { NoSearchResultsIllustration } from '@/components/feedback/illustrations';

const TYPE_LABELS: Record<SearchResultType, string> = {
  employee: 'Employees',
  department: 'Departments',
  leave: 'Leave',
  holiday: 'Holidays',
  settings: 'Settings',
};

const TYPE_ICONS: Record<SearchResultType, React.ComponentType<{ className?: string }>> = {
  employee: Users,
  department: Building2,
  leave: CalendarOff,
  holiday: CalendarOff,
  settings: Search,
};

export function GlobalSearch() {
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  // `dismissed` tracks whether user explicitly closed the dropdown (Escape / outside click).
  // It resets whenever the query changes, so typing always re-opens.
  const [dismissed, setDismissed] = useState(false);
  const [query, setQuery] = useState('');
  const [activeIdx, setActiveIdx] = useState(0);
  const debouncedQuery = useDebounce(query, 250);

  const { data } = useSearch(debouncedQuery);
  const results = data?.results ?? [];

  // Dropdown is visible when query is long enough AND user hasn't dismissed it
  const open = query.trim().length >= 2 && !dismissed;

  // "/" and Ctrl/Cmd+K to focus search
  useEffect(() => {
    function onKeyDown(e: globalThis.KeyboardEvent) {
      const target = e.target as HTMLElement;
      const inInput =
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.contentEditable === 'true';
      if (!inInput && e.key === '/') {
        e.preventDefault();
        inputRef.current?.focus();
      }
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
      }
    }
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, []);

  // Close on outside click
  useEffect(() => {
    function onPointerDown(e: PointerEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setDismissed(true);
      }
    }
    if (open) document.addEventListener('pointerdown', onPointerDown);
    return () => document.removeEventListener('pointerdown', onPointerDown);
  }, [open]);

  const navigate = useCallback(
    (result: SearchResult) => {
      setDismissed(true);
      setQuery('');
      router.push(result.url);
    },
    [router],
  );

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setQuery(e.target.value);
    setDismissed(false); // re-open if user types after dismissing
    setActiveIdx(0);
  }

  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (!open || results.length === 0) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIdx((i) => Math.min(i + 1, results.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIdx((i) => Math.max(i - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const result = results[activeIdx];
      if (result) navigate(result);
    } else if (e.key === 'Escape') {
      setDismissed(true);
    }
  }

  // Group results by type, preserving insertion order
  const grouped = results.reduce<Partial<Record<SearchResultType, SearchResult[]>>>(
    (acc, result) => {
      if (!acc[result.type]) acc[result.type] = [];
      acc[result.type]!.push(result);
      return acc;
    },
    {},
  );

  return (
    <div ref={containerRef} className="relative flex items-center max-w-xs w-full">
      <Search
        className="absolute left-2.5 size-3.5 text-fg-muted pointer-events-none"
        aria-hidden
      />
      <Input
        ref={inputRef}
        value={query}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        onFocus={() => setDismissed(false)}
        placeholder="Search…"
        className="pl-8 pr-8 h-8 text-sm bg-surface-2 border-subtle focus-visible:ring-1"
        aria-label="Global search"
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-autocomplete="list"
        role="combobox"
      />
      <kbd className="absolute right-2 hidden sm:flex items-center gap-px rounded border border-subtle bg-surface px-1.5 py-0.5 text-[10px] font-mono text-fg-muted pointer-events-none">
        /
      </kbd>

      {open && (
        <div
          className="absolute top-full left-0 mt-1.5 w-80 rounded-lg border border-subtle bg-popover shadow-lg z-50 overflow-hidden"
          role="listbox"
          aria-label="Search results"
        >
          {results.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-8 text-center">
              <NoSearchResultsIllustration className="size-12 text-fg-muted" />
              <p className="text-sm text-fg-muted">No results for &ldquo;{debouncedQuery}&rdquo;</p>
            </div>
          ) : (
            (Object.keys(grouped) as SearchResultType[]).map((type) => {
              const items = grouped[type]!;
              const Icon = TYPE_ICONS[type] ?? Search;
              return (
                <div key={type}>
                  <p className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-fg-muted bg-surface-2 border-b border-subtle">
                    {TYPE_LABELS[type]} · {data?.groupedCounts[type] ?? items.length}
                  </p>
                  {items.map((result) => {
                    const idx = results.indexOf(result);
                    const isActive = idx === activeIdx;
                    return (
                      <button
                        key={result.id}
                        type="button"
                        role="option"
                        aria-selected={isActive}
                        className={cn(
                          'w-full flex items-start gap-2.5 px-3 py-2 text-left transition-colors cursor-pointer',
                          isActive ? 'bg-accent text-accent-foreground' : 'hover:bg-accent/60',
                        )}
                        onMouseEnter={() => setActiveIdx(idx)}
                        onClick={() => navigate(result)}
                      >
                        <Icon className="mt-0.5 size-3.5 shrink-0 text-fg-muted" aria-hidden />
                        <span className="flex flex-col min-w-0">
                          <span className="text-sm font-medium text-fg truncate">
                            {result.label}
                          </span>
                          <span className="text-xs text-fg-muted truncate">{result.sublabel}</span>
                        </span>
                      </button>
                    );
                  })}
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
