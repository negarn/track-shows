import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import { buildTrackedShow, refreshTrackedShow, searchShows } from "./lib/api";
import { addDays, fromLocalDateKey, isEpisodeAired, startOfWeekMonday, toLocalDateKey, weekContainsDate } from "./lib/date";
import { useTrackShowsState } from "./hooks/useTrackShowsState";
import type { SearchResult, SearchScope, TrackedShow } from "./types";
import { SearchPanel } from "./components/SearchPanel";
import { CalendarPage } from "./pages/CalendarPage";
import { SettingsPage } from "./pages/SettingsPage";
import { WatchlistPage } from "./pages/WatchlistPage";

type ActiveView = "calendar" | "watchlist" | "settings";

const VIEW_PARAM = "view";
const WEEK_START_PARAM = "weekStart";
const WATCHLIST_PAGE_SIZE = 20;
const SEARCH_SCOPE_STORAGE_KEY = "track-shows.searchScope";

export default function App(): JSX.Element {
  const { error: dataError, isLoading: dataLoading, state, setState } = useTrackShowsState();
  const [activeView, setActiveView] = useState<ActiveView>(() => getInitialActiveView());
  const [query, setQuery] = useState("");
  const [searchScope, setSearchScope] = useState<SearchScope>(() => getInitialSearchScope());
  const [showSearchResults, setShowSearchResults] = useState<SearchResult[]>([]);
  const [showSearchErrors, setShowSearchErrors] = useState<string[]>([]);
  const [showSearching, setShowSearching] = useState(false);
  const [syncingId, setSyncingId] = useState<string | null>(null);
  const [weekStart, setWeekStart] = useState<Date>(() => getInitialWeekStart());
  const [watchlistPage, setWatchlistPage] = useState(1);
  const [watchlistFocusId, setWatchlistFocusId] = useState<string | null>(null);

  const trackedShows = state.trackedShows;
  const trackedIds = new Set(trackedShows.map((show) => show.id));
  const watchlistShows = [...trackedShows].sort(compareTrackedShowsForWatchlist);
  const trimmedQuery = query.trim();
  const normalizedQuery = trimmedQuery.toLowerCase();
  const watchlistTotalPages = Math.max(1, Math.ceil(watchlistShows.length / WATCHLIST_PAGE_SIZE));
  const safeWatchlistPage = Math.min(watchlistPage, watchlistTotalPages);
  const watchlistStartIndex = (safeWatchlistPage - 1) * WATCHLIST_PAGE_SIZE;
  const watchlistPageShows = watchlistShows.slice(watchlistStartIndex, watchlistStartIndex + WATCHLIST_PAGE_SIZE);
  const watchlistSearchResults =
    searchScope === "watchlist" && trimmedQuery.length >= 2
      ? watchlistShows.filter((show) => matchesWatchlistSearchQuery(show, normalizedQuery))
      : [];
  const searchResults = searchScope === "watchlist" ? watchlistSearchResults : showSearchResults;
  const searchErrors = searchScope === "watchlist" ? [] : showSearchErrors;
  const searchLoading = searchScope === "watchlist" ? false : showSearching;
  const visibleWeekEpisodes = trackedShows
    .flatMap((show) => show.episodes)
    .filter((episode) => weekContainsDate(weekStart, fromLocalDateKey(episode.airDate)));
  const showSearchPanel = activeView !== "settings";
  let mainContent: ReactNode = null;

  useEffect(() => {
    syncUrlToState(activeView, weekStart);
  }, [activeView, weekStart]);

  useEffect(() => {
    try {
      window.localStorage.setItem(SEARCH_SCOPE_STORAGE_KEY, searchScope);
    } catch {
      // Ignore storage failures and keep the in-memory preference.
    }
  }, [searchScope]);

  useEffect(() => {
    if (searchScope !== "shows") {
      setShowSearching(false);
      setShowSearchResults([]);
      setShowSearchErrors([]);
      return;
    }

    if (trimmedQuery.length < 2) {
      setShowSearchResults([]);
      setShowSearchErrors([]);
      setShowSearching(false);
      return;
    }

    let cancelled = false;
    setShowSearching(true);
    const timeout = window.setTimeout(async () => {
      try {
        const nextResults = await searchShows(trimmedQuery);
        if (!cancelled) {
          setShowSearchResults(nextResults);
          setShowSearchErrors([]);
        }
      } catch (error) {
        if (!cancelled) {
          setShowSearchResults([]);
          setShowSearchErrors([error instanceof Error ? error.message : "Search failed"]);
        }
      } finally {
        if (!cancelled) {
          setShowSearching(false);
        }
      }
    }, 180);

    return () => {
      cancelled = true;
      window.clearTimeout(timeout);
    };
  }, [searchScope, trimmedQuery]);

  useEffect(() => {
    setWatchlistPage((current) => Math.min(current, watchlistTotalPages));
  }, [watchlistTotalPages]);

  useEffect(() => {
    if (watchlistFocusId !== null) {
      setWatchlistFocusId(null);
    }
  }, [query, searchScope]);

  async function handleTrack(result: SearchResult): Promise<void> {
    if (trackedIds.has(result.id) || syncingId) {
      return;
    }

    setSyncingId(result.id);
    try {
      const trackedShow = await buildTrackedShow(result);
      setState((current) => ({
        ...current,
        trackedShows: [trackedShow, ...current.trackedShows.filter((show) => show.id !== trackedShow.id)],
      }));
      setQuery("");
      setShowSearchResults([]);
      setShowSearchErrors([]);
    } catch (error) {
      console.error(error);
      window.alert(error instanceof Error ? error.message : "Could not track this show.");
    } finally {
      setSyncingId(null);
    }
  }

  function handleSearchResultSelect(result: SearchResult): void {
    if (searchScope === "watchlist") {
      handleWatchlistResultSelect(result);
      return;
    }

    void handleTrack(result);
  }

  function handleWatchlistResultSelect(result: SearchResult): void {
    const index = watchlistShows.findIndex((show) => show.id === result.id);

    if (index < 0) {
      return;
    }

    setActiveView("watchlist");
    setWatchlistPage(Math.floor(index / WATCHLIST_PAGE_SIZE) + 1);
    setWatchlistFocusId(result.id);
  }

  async function handleRefresh(showId: string): Promise<void> {
    if (syncingId) {
      return;
    }

    const target = trackedShows.find((show) => show.id === showId);
    if (!target) {
      return;
    }

    setSyncingId(showId);
    try {
      const refreshed = await refreshTrackedShow(target);
      setState((current) => ({
        ...current,
        trackedShows: current.trackedShows.map((show) => (show.id === showId ? refreshed : show)),
      }));
    } catch (error) {
      console.error(error);
      window.alert(error instanceof Error ? error.message : "Could not refresh this show.");
    } finally {
      setSyncingId(null);
    }
  }

  function handleToggleWatched(episodeId: string): void {
    setState((current) => ({
      ...current,
      trackedShows: current.trackedShows.map((show) => ({
        ...show,
        episodes: show.episodes.map((episode) =>
          episode.id === episodeId ? { ...episode, watched: !episode.watched } : episode,
        ),
      })),
    }));
  }

  function handleMarkAiredWatched(showId: string): void {
    const now = new Date();

    setState((current) => ({
      ...current,
      trackedShows: current.trackedShows.map((show) =>
        show.id === showId
          ? {
              ...show,
              episodes: show.episodes.map((episode) =>
                isEpisodeAired(episode.airDate, episode.airDateTime, now) ? { ...episode, watched: true } : episode,
              ),
            }
          : show,
      ),
    }));
  }

  function handleRemove(showId: string): void {
    if (watchlistFocusId === showId) {
      setWatchlistFocusId(null);
    }

    setState((current) => ({
      ...current,
      trackedShows: current.trackedShows.filter((show) => show.id !== showId),
    }));
  }

  function handleWeekShift(days: number): void {
    setWeekStart((current) => addDays(current, days));
  }

  function handleWatchlistPageShift(delta: number): void {
    setWatchlistPage((current) => {
      const nextPage = current + delta;
      return Math.min(Math.max(nextPage, 1), watchlistTotalPages);
    });
  }

  function handleWatchlistPreviousPage(): void {
    handleWatchlistPageShift(-1);
  }

  function handleWatchlistNextPage(): void {
    handleWatchlistPageShift(1);
  }

  switch (activeView) {
    case "settings":
      mainContent = <SettingsPage />;
      break;
    case "calendar":
      mainContent = (
        <CalendarPage
          episodes={visibleWeekEpisodes}
          isLoading={dataLoading}
          onNextWeek={() => handleWeekShift(7)}
          onPreviousWeek={() => handleWeekShift(-7)}
          onToggleWatched={handleToggleWatched}
          weekStart={weekStart}
        />
      );
      break;
    case "watchlist":
    default:
      mainContent = (
        <WatchlistPage
          highlightedShowId={watchlistFocusId}
          isLoading={dataLoading}
          nextDisabled={safeWatchlistPage === watchlistTotalPages}
          onMarkAiredWatched={handleMarkAiredWatched}
          onNextPage={handleWatchlistNextPage}
          onPreviousPage={handleWatchlistPreviousPage}
          onRefresh={handleRefresh}
          onRemove={handleRemove}
          onToggleWatched={handleToggleWatched}
          previousDisabled={safeWatchlistPage === 1}
          shows={watchlistPageShows}
          syncingId={syncingId}
        />
      );
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-ink-900 text-sand-50">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-28 right-[-6rem] h-72 w-72 animate-float rounded-full bg-ember-400/10 blur-3xl" />
        <div className="absolute bottom-0 left-[-5rem] h-80 w-80 animate-float rounded-full bg-ocean-300/10 blur-3xl [animation-delay:2s]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(255,167,90,0.11),_transparent_30%),radial-gradient(circle_at_80%_20%,_rgba(123,231,226,0.08),_transparent_26%),linear-gradient(to_bottom,_rgba(4,16,29,0.96),_rgba(7,17,31,0.98))]" />
      </div>

      <div className="relative mx-auto flex max-w-[1600px] flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">
        <div className="relative z-50 grid gap-4 lg:grid-cols-[auto_1fr] lg:items-center">
          <span className="text-xs font-semibold uppercase tracking-[0.45em] text-ember-200/75 lg:col-span-2">
            Track Shows
          </span>

          <div className="inline-flex rounded-full border border-white/10 bg-white/[0.04] p-1 shadow-soft">
            <TabButton active={activeView === "calendar"} onClick={() => setActiveView("calendar")}>
              Calendar
            </TabButton>
            <TabButton active={activeView === "watchlist"} onClick={() => setActiveView("watchlist")}>
              Watchlist
            </TabButton>
            <TabButton active={activeView === "settings"} onClick={() => setActiveView("settings")}>
              Settings
            </TabButton>
          </div>

          {showSearchPanel ? (
            <SearchPanel
              query={query}
              scope={searchScope}
              loading={searchLoading}
              errors={searchErrors}
              results={searchResults}
              syncingId={syncingId}
              trackedIds={trackedIds}
              onQueryChange={setQuery}
              onScopeChange={setSearchScope}
              onResultSelect={handleSearchResultSelect}
            />
          ) : null}
        </div>

        {dataError ? (
          <div className="rounded-3xl border border-rose-300/20 bg-rose-400/10 px-4 py-3 text-sm text-rose-100">
            {dataError}
          </div>
        ) : null}

        {mainContent}
      </div>
    </div>
  );
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
}): JSX.Element {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`cursor-pointer rounded-full px-4 py-2 text-sm font-semibold transition ${
        active
          ? "bg-ember-300 text-ink-950 shadow-[0_10px_30px_rgba(255,154,72,0.24)]"
          : "text-slate-300 hover:bg-white/5 hover:text-sand-50"
      }`}
    >
      {children}
    </button>
  );
}

export function getInitialActiveView(): ActiveView {
  if (typeof window === "undefined") {
    return "calendar";
  }

  const view = new URL(window.location.href).searchParams.get(VIEW_PARAM);
  if (view === "watchlist" || view === "settings") {
    return view;
  }

  return "calendar";
}

export function getInitialWeekStart(): Date {
  if (typeof window === "undefined") {
    return startOfWeekMonday(new Date());
  }

  const searchParams = new URL(window.location.href).searchParams;
  const weekStartParam = searchParams.get(WEEK_START_PARAM);
  if (!weekStartParam) {
    return startOfWeekMonday(new Date());
  }

  const parsed = fromLocalDateKey(weekStartParam);
  if (Number.isNaN(parsed.getTime())) {
    return startOfWeekMonday(new Date());
  }

  return startOfWeekMonday(parsed);
}

export function syncUrlToState(activeView: ActiveView, weekStart: Date): void {
  if (typeof window === "undefined") {
    return;
  }

  const url = new URL(window.location.href);
  if (activeView === "watchlist" || activeView === "settings") {
    url.searchParams.set(VIEW_PARAM, activeView);
  } else {
    url.searchParams.delete(VIEW_PARAM);
  }
  url.searchParams.set(WEEK_START_PARAM, toLocalDateKey(weekStart));
  window.history.replaceState({}, "", url.toString());
}

function getInitialSearchScope(): SearchScope {
  if (typeof window === "undefined") {
    return "shows";
  }

  try {
    const storedScope = window.localStorage.getItem(SEARCH_SCOPE_STORAGE_KEY);
    return storedScope === "watchlist" ? "watchlist" : "shows";
  } catch {
    return "shows";
  }
}

function matchesWatchlistSearchQuery(show: TrackedShow, normalizedQuery: string): boolean {
  if (!normalizedQuery) {
    return true;
  }

  const searchableText = [
    show.title,
    show.subtitle,
    show.description,
    show.status,
    show.format,
    show.year?.toString() ?? "",
    ...show.genres,
    ...show.episodes.flatMap((episode) => [episode.title, episode.episodeLabel]),
  ]
    .filter((part) => part.trim().length > 0)
    .join(" ")
    .toLowerCase();

  return searchableText.includes(normalizedQuery);
}

function compareTrackedShowsForWatchlist(a: TrackedShow, b: TrackedShow): number {
  const aHasUnwatchedEpisode = hasUnwatchedEpisode(a);
  const bHasUnwatchedEpisode = hasUnwatchedEpisode(b);

  if (aHasUnwatchedEpisode !== bHasUnwatchedEpisode) {
    return aHasUnwatchedEpisode ? -1 : 1;
  }

  if (aHasUnwatchedEpisode) {
    const aNextEpisodeTime = getNextEpisodeSortTime(a);
    const bNextEpisodeTime = getNextEpisodeSortTime(b);

    if (aNextEpisodeTime !== bNextEpisodeTime) {
      return aNextEpisodeTime - bNextEpisodeTime;
    }
  }

  return a.title.localeCompare(b.title);
}

function hasUnwatchedEpisode(show: TrackedShow): boolean {
  return show.episodes.some((episode) => !episode.watched);
}

function getNextEpisodeSortTime(show: TrackedShow): number {
  const nextEpisode = show.episodes.find((episode) => !episode.watched);

  if (!nextEpisode) {
    return Number.POSITIVE_INFINITY;
  }

  if (nextEpisode.airDateTime) {
    const airedAt = new Date(nextEpisode.airDateTime);
    if (!Number.isNaN(airedAt.getTime())) {
      return airedAt.getTime();
    }
  }

  return fromLocalDateKey(nextEpisode.airDate).getTime();
}
