import { useEffect, useRef, useState } from "react";
import type { SearchResult, SearchScope } from "../types";

interface SearchPanelProps {
  query: string;
  scope: SearchScope;
  loading: boolean;
  errors: string[];
  results: SearchResult[];
  syncingId: string | null;
  trackedIds: Set<string>;
  onQueryChange: (value: string) => void;
  onScopeChange: (value: SearchScope) => void;
  onResultSelect: (result: SearchResult) => void;
}

const scopeOptions: Array<{ value: SearchScope; label: string }> = [
  { value: "shows", label: "Shows" },
  { value: "watchlist", label: "Watchlist" },
];

export function SearchPanel({
  query,
  scope,
  loading,
  errors,
  results,
  syncingId,
  trackedIds,
  onQueryChange,
  onScopeChange,
  onResultSelect,
}: SearchPanelProps): JSX.Element {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [isResultsOpen, setIsResultsOpen] = useState(false);
  const [isScopeMenuOpen, setIsScopeMenuOpen] = useState(false);
  const trimmed = query.trim();
  const hasText = trimmed.length > 0;
  const showResultsDropdown = isResultsOpen && trimmed.length >= 2;
  const placeholder = scope === "watchlist" ? "Search watchlist" : "Search shows";
  const scopeLabel = scope === "watchlist" ? "Watchlist" : "Shows";

  function closeMenus(): void {
    setIsResultsOpen(false);
    setIsScopeMenuOpen(false);
  }

  useEffect(() => {
    if (trimmed.length < 2) {
      setIsResultsOpen(false);
    }
  }, [trimmed]);

  useEffect(() => {
    function handlePointerDown(event: PointerEvent) {
      const target = event.target;

      if (!(target instanceof Node)) {
        return;
      }

      if (!containerRef.current?.contains(target)) {
        setIsResultsOpen(false);
        setIsScopeMenuOpen(false);
      }
    }

    document.addEventListener("pointerdown", handlePointerDown);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
    };
  }, []);

  useEffect(() => {
    if (!isResultsOpen && !isScopeMenuOpen) {
      return undefined;
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsResultsOpen(false);
        setIsScopeMenuOpen(false);
      }
    }

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isResultsOpen, isScopeMenuOpen]);

  function handleScopeButtonClick(): void {
    setIsResultsOpen(false);
    setIsScopeMenuOpen((current) => !current);
  }

  function handleScopeSelect(nextScope: SearchScope): void {
    closeMenus();
    setIsResultsOpen(trimmed.length >= 2);
    onScopeChange(nextScope);
  }

  function handleQueryChange(value: string): void {
    closeMenus();
    setIsResultsOpen(true);
    onQueryChange(value);
  }

  function handleClearSearch(): void {
    closeMenus();
    onQueryChange("");
  }

  return (
    <div ref={containerRef} className="relative z-50 w-full max-w-[30rem] lg:justify-self-end">
      <div className="flex items-stretch overflow-hidden rounded-full border border-white/10 bg-ink-800/80 shadow-soft backdrop-blur-xl">
        <button
          type="button"
          onClick={handleScopeButtonClick}
          aria-haspopup="menu"
          aria-expanded={isScopeMenuOpen}
          aria-controls="search-scope-menu"
          className={`flex h-full min-w-[8.25rem] cursor-pointer items-center justify-between gap-3 border-r border-white/10 px-4 py-3 text-sm font-semibold transition ${
            isScopeMenuOpen ? "bg-white/[0.08] text-sand-50" : "bg-white/[0.03] text-sand-50 hover:bg-white/[0.05]"
          }`}
        >
          <span className="truncate">{scopeLabel}</span>
          <ChevronDownGlyph open={isScopeMenuOpen} />
        </button>

        <label className="relative min-w-0 flex-1">
          <span className="sr-only">{placeholder}</span>
          <span className="pointer-events-none absolute inset-y-0 left-4 flex items-center text-slate-400">
            <SearchGlyph />
          </span>
          <input
            value={query}
            onChange={(event) => handleQueryChange(event.target.value)}
            onFocus={() => {
              closeMenus();
              setIsResultsOpen(true);
            }}
            placeholder={placeholder}
            className="w-full bg-transparent py-3 pl-11 pr-12 text-sm text-sand-50 placeholder:text-slate-500 outline-none transition focus:ring-0"
          />
          {hasText ? (
            <button
              type="button"
              onMouseDown={(event) => event.preventDefault()}
              onClick={handleClearSearch}
              aria-label="Clear search"
              className="absolute right-2 top-1/2 inline-flex h-8 w-8 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full text-slate-400 transition hover:bg-white/5 hover:text-sand-50"
            >
              <ClearGlyph />
            </button>
          ) : null}
        </label>
      </div>

      {isScopeMenuOpen ? (
        <div
          id="search-scope-menu"
          role="menu"
          aria-label="Search scope options"
          className="absolute left-0 top-[calc(100%+0.95rem)] z-50 w-[min(92vw,12rem)] overflow-hidden rounded-[2rem] bg-ink-900/96 p-3 shadow-[0_18px_50px_rgba(0,0,0,0.5)] backdrop-blur-2xl"
        >
          <div className="space-y-1">
            {scopeOptions.map((option) => {
              const selected = option.value === scope;

              return (
                <button
                  key={option.value}
                  type="button"
                  role="menuitemradio"
                  aria-checked={selected}
                  onClick={() => handleScopeSelect(option.value)}
                  className={`flex w-full cursor-pointer items-center rounded-[1.25rem] px-4 py-3 text-left text-sm font-semibold transition ${
                    selected
                      ? "bg-ember-300/15 text-sand-50 ring-1 ring-ember-300/20"
                      : "text-slate-300 hover:bg-white/[0.06] hover:text-sand-50"
                  }`}
                >
                  <span className="truncate">{option.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      ) : null}

      {showResultsDropdown ? (
        <div className="absolute right-0 top-[calc(100%+0.75rem)] z-30 w-[min(92vw,30rem)] overflow-hidden rounded-3xl border border-white/10 bg-ink-900/98 shadow-glow backdrop-blur-xl">
          <div className="max-h-[28rem] overflow-y-auto p-2">
            {errors.length > 0 ? (
              <div className="rounded-2xl border border-rose-300/20 bg-rose-400/10 px-4 py-3 text-xs text-rose-100">
                {errors[0]}
              </div>
            ) : null}
            {loading ? (
              <div className="flex items-center gap-3 px-4 py-4 text-sm text-slate-400">
                <Spinner />
                Searching...
              </div>
            ) : results.length > 0 ? (
              results.map((result) => {
                const tracked = trackedIds.has(result.id);
                const syncing = syncingId === result.id;
                const actionLabel = getResultActionLabel(scope, tracked, syncing);
                const actionClassName = getResultActionClassName(scope, tracked, syncing);

                return (
                  <button
                    key={result.id}
                    type="button"
                    onClick={() => {
                      setIsResultsOpen(false);
                      onResultSelect(result);
                    }}
                    disabled={scope === "shows" && (tracked || syncing)}
                    aria-label={`${actionLabel} ${result.title}`}
                    className="flex w-full cursor-pointer items-center gap-3 rounded-2xl px-3 py-3 text-left transition enabled:hover:bg-white/[0.05] disabled:cursor-default disabled:opacity-60"
                  >
                    <div className="h-14 w-10 shrink-0 overflow-hidden rounded-xl bg-white/5 ring-1 ring-white/10">
                      {result.posterUrl ? (
                        <img src={result.posterUrl} alt="" className="h-full w-full object-cover" loading="lazy" />
                      ) : null}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-3">
                        <span className="truncate text-sm font-semibold text-sand-50">{result.title}</span>

                        <div className="flex shrink-0 items-center gap-2">
                          <span className={actionClassName}>{actionLabel}</span>
                        </div>
                      </div>
                      {result.subtitle ? <p className="mt-0.5 truncate text-xs text-slate-400">{result.subtitle}</p> : null}
                    </div>
                  </button>
                );
              })
            ) : (
              <div className="px-4 py-4 text-sm text-slate-500">{getEmptyMessage(scope)}</div>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}

function getResultActionClassName(scope: SearchScope, tracked: boolean, syncing: boolean): string {
  const baseClasses = "shrink-0 rounded-full border px-3 py-1 text-xs font-semibold";

  if (scope === "watchlist") {
    return `${baseClasses} border-white/10 bg-white/5 text-slate-200`;
  }

  if (syncing) {
    return `${baseClasses} border-ember-300/25 bg-ember-400/10 text-ember-100`;
  }

  if (tracked) {
    return `${baseClasses} border-emerald-300/20 bg-emerald-400/10 text-emerald-100`;
  }

  return `${baseClasses} border-white/10 bg-white/5 text-slate-200`;
}

function getResultActionLabel(scope: SearchScope, tracked: boolean, syncing: boolean): string {
  if (scope === "watchlist") {
    return "Open";
  }

  if (syncing) {
    return "Adding";
  }

  if (tracked) {
    return "Tracked";
  }

  return "Track";
}

function getEmptyMessage(scope: SearchScope): string {
  return scope === "watchlist" ? "No watchlist matches" : "No results";
}

function Spinner(): JSX.Element {
  return <span className="inline-flex h-4 w-4 animate-spin rounded-full border-2 border-slate-500 border-t-transparent" />;
}

function SearchGlyph(): JSX.Element {
  return (
    <svg aria-hidden="true" viewBox="0 0 20 20" fill="none" className="h-4 w-4">
      <path d="M13.5 13.5L17 17" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      <circle cx="8.5" cy="8.5" r="5.5" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  );
}

function ClearGlyph(): JSX.Element {
  return (
    <svg aria-hidden="true" viewBox="0 0 20 20" fill="none" className="h-4 w-4">
      <path d="M5.5 5.5L14.5 14.5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
      <path d="M14.5 5.5L5.5 14.5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  );
}

function ChevronDownGlyph({ open }: { open: boolean }): JSX.Element {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 20 20"
      fill="none"
      className={`h-3.5 w-3.5 text-slate-400 transition-transform ${open ? "rotate-180" : ""}`}
    >
      <path d="M5.5 7.5L10 12l4.5-4.5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
