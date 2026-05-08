import type { JSX } from "react";
import { TrackedShowsPanel } from "../components/TrackedShowsPanel";
import { WeekNavigation } from "../components/WeekNavigation";
import type { TrackedShow } from "../types";

interface WatchlistPageProps {
  highlightedShowId: string | null;
  isLoading: boolean;
  nextDisabled?: boolean;
  onMarkAiredWatched: (showId: string) => void;
  onNextPage: () => void;
  onPreviousPage: () => void;
  onRefresh: (showId: string) => void;
  onRemove: (showId: string) => void;
  onToggleWatched: (episodeId: string) => void;
  previousDisabled?: boolean;
  shows: TrackedShow[];
  syncingId: string | null;
}

export function WatchlistPage({
  highlightedShowId,
  isLoading,
  nextDisabled = false,
  onMarkAiredWatched,
  onNextPage,
  onPreviousPage,
  onRefresh,
  onRemove,
  onToggleWatched,
  previousDisabled = false,
  shows,
  syncingId,
}: WatchlistPageProps): JSX.Element {
  return (
    <div className="flex flex-col gap-4">
      {isLoading ? (
        <WatchlistSkeleton />
      ) : (
        <TrackedShowsPanel
          highlightedShowId={highlightedShowId}
          onMarkAiredWatched={onMarkAiredWatched}
          onRefresh={onRefresh}
          onRemove={onRemove}
          onToggleWatched={onToggleWatched}
          shows={shows}
          syncingId={syncingId}
        />
      )}

      <WeekNavigation
        nextDisabled={nextDisabled}
        nextLabel="Next page"
        onNextWeek={onNextPage}
        onPreviousWeek={onPreviousPage}
        previousDisabled={previousDisabled}
        previousLabel="Previous page"
      />
    </div>
  );
}

function WatchlistSkeleton(): JSX.Element {
  return (
    <div className="space-y-3" aria-hidden="true">
      {Array.from({ length: 3 }).map((_, index) => (
        <article
          key={index}
          data-testid="watchlist-loading-card"
          className="rounded-3xl border border-white/10 bg-white/[0.03] p-4"
        >
          <div className="flex items-start gap-4">
            <div className="h-16 w-12 shrink-0 animate-pulse rounded-2xl border border-white/10 bg-white/[0.06]" />

            <div className="min-w-0 flex-1 space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 space-y-2">
                  <div className="h-4 w-48 animate-pulse rounded-full bg-white/10" />
                  <div className="h-3 w-24 animate-pulse rounded-full bg-white/10" />
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-8 w-16 animate-pulse rounded-full bg-white/10" />
                  <div className="h-8 w-16 animate-pulse rounded-full bg-white/10" />
                </div>
              </div>

              <div className="flex flex-col gap-3 text-sm sm:flex-row sm:items-center sm:justify-between">
                <div className="h-4 w-64 animate-pulse rounded-full bg-white/10" />
                <div className="flex flex-wrap items-center gap-2">
                  <div className="h-8 w-24 animate-pulse rounded-full bg-white/10" />
                  <div className="h-8 w-28 animate-pulse rounded-full bg-white/10" />
                </div>
              </div>
            </div>
          </div>
        </article>
      ))}
    </div>
  );
}
