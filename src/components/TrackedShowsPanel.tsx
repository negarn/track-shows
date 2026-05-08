import { useEffect, useRef } from "react";
import { formatLongDate, fromLocalDateKey, isEpisodeAired } from "../lib/date";
import type { TrackedShow } from "../types";

interface TrackedShowsPanelProps {
  shows: TrackedShow[];
  syncingId: string | null;
  highlightedShowId: string | null;
  onRefresh: (showId: string) => void;
  onRemove: (showId: string) => void;
  onMarkAiredWatched: (showId: string) => void;
  onToggleWatched: (episodeId: string) => void;
}

export function TrackedShowsPanel({
  shows,
  syncingId,
  highlightedShowId,
  onRefresh,
  onRemove,
  onMarkAiredWatched,
  onToggleWatched,
}: TrackedShowsPanelProps): JSX.Element {
  const articleRefs = useRef(new Map<string, HTMLArticleElement | null>());
  const lastScrolledHighlightedIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (!highlightedShowId) {
      lastScrolledHighlightedIdRef.current = null;
      return;
    }

    if (lastScrolledHighlightedIdRef.current === highlightedShowId) {
      return;
    }

    const element = articleRefs.current.get(highlightedShowId);
    if (!element) {
      return;
    }

    lastScrolledHighlightedIdRef.current = highlightedShowId;
    element.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [highlightedShowId, shows]);

  return (
    <div className="space-y-3">
      {shows.length > 0 ? (
        shows.map((show) => {
          const watchedCount = show.episodes.filter((episode) => episode.watched).length;
          const totalCount = show.episodes.length;
          const nextEpisode = show.episodes.find((episode) => !episode.watched);
          const airedUnwatchedCount = show.episodes.filter(
            (episode) => !episode.watched && isEpisodeAired(episode.airDate, episode.airDateTime),
          ).length;
          const isRefreshing = syncingId === show.id;
          const isHighlighted = highlightedShowId === show.id;

          return (
            <article
              key={show.id}
              ref={(element) => {
                if (element) {
                  articleRefs.current.set(show.id, element);
                } else {
                  articleRefs.current.delete(show.id);
                }
              }}
              className={`rounded-3xl border p-4 transition ${
                isHighlighted
                  ? "border-ember-300/30 bg-ember-300/[0.08] shadow-[0_0_0_1px_rgba(255,154,72,0.12)]"
                  : "border-white/10 bg-white/[0.03]"
              }`}
            >
              <div className="flex items-start gap-4">
                <div className="h-16 w-12 shrink-0 overflow-hidden rounded-2xl bg-white/5 ring-1 ring-white/10">
                  {show.posterUrl ? (
                    <img src={show.posterUrl} alt="" className="h-full w-full object-cover" loading="lazy" />
                  ) : null}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="truncate text-base font-semibold text-sand-50">{show.title}</h3>
                      </div>
                      <p className="mt-1 text-xs text-slate-400">
                        {watchedCount}/{totalCount} watched
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => onRefresh(show.id)}
                        disabled={isRefreshing}
                        className="cursor-pointer rounded-full border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold text-slate-200 transition enabled:hover:border-ember-300/25 enabled:hover:bg-ember-300/10 disabled:cursor-wait disabled:opacity-70"
                      >
                        {isRefreshing ? "Syncing" : "Refresh"}
                      </button>
                      <button
                        type="button"
                        onClick={() => onRemove(show.id)}
                        className="cursor-pointer rounded-full border border-rose-300/20 bg-rose-400/10 px-3 py-2 text-xs font-semibold text-rose-100 transition hover:bg-rose-400/20"
                      >
                        Remove
                      </button>
                    </div>
                  </div>

                  <div className="mt-3 flex flex-col gap-3 text-sm text-slate-300 sm:flex-row sm:items-center sm:justify-between">
                    {nextEpisode ? (
                      <span className="min-w-0">
                        Next: <span className="font-semibold text-sand-50">{nextEpisode.episodeLabel}</span>
                        {nextEpisode.airTimeLabel ? ` at ${nextEpisode.airTimeLabel}` : ""}
                        {" "}
                        on {formatLongDate(fromLocalDateKey(nextEpisode.airDate))}
                      </span>
                    ) : (
                      <span className="text-emerald-100">Caught up</span>
                    )}

                    <div className="flex flex-wrap items-center gap-2">
                      {nextEpisode ? (
                        <button
                          type="button"
                          onClick={() => onToggleWatched(nextEpisode.id)}
                          className="inline-flex shrink-0 cursor-pointer items-center justify-center rounded-full border border-emerald-300/20 bg-emerald-400/10 px-3 py-2 text-xs font-semibold text-emerald-100 transition hover:border-emerald-300/30 hover:bg-emerald-400/15"
                        >
                          Mark watched
                        </button>
                      ) : null}

                      {airedUnwatchedCount > 0 ? (
                        <button
                          type="button"
                          onClick={() => onMarkAiredWatched(show.id)}
                          className="inline-flex shrink-0 cursor-pointer items-center justify-center rounded-full border border-ember-300/20 bg-ember-400/10 px-3 py-2 text-xs font-semibold text-ember-100 transition hover:border-ember-300/30 hover:bg-ember-400/15"
                        >
                          Mark aired watched
                        </button>
                      ) : null}
                    </div>
                  </div>
                </div>
              </div>
            </article>
          );
        })
      ) : (
        <div className="rounded-3xl border border-dashed border-white/10 bg-white/[0.03] px-4 py-8 text-sm text-slate-400">
          No watchlist yet.
        </div>
      )}
    </div>
  );
}
