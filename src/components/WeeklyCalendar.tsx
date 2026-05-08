import { buildWeekDays, formatFullDate, toLocalDateKey } from "../lib/date";
import type { TrackedEpisode } from "../types";

interface WeeklyCalendarProps {
  isLoading?: boolean;
  weekStart: Date;
  episodes: TrackedEpisode[];
  onToggleWatched: (episodeId: string) => void;
}

export function WeeklyCalendar({
  isLoading = false,
  weekStart,
  episodes,
  onToggleWatched,
}: WeeklyCalendarProps): JSX.Element {
  const days = buildWeekDays(weekStart);
  const grouped = groupEpisodesByDay(episodes);
  const todayKey = toLocalDateKey(new Date());

  return (
    <section className="panel p-0">
      <div className="divide-y divide-white/10">
        {days.map((day) => {
          const key = toLocalDateKey(day);
          const dayEpisodes = [...(grouped.get(key) ?? [])].sort(compareEpisodes);
          const isToday = key === todayKey;
          const weekday = day.toLocaleDateString("en-US", { weekday: "short" });

          return (
            <div
              key={key}
              className={`flex min-h-[4.75rem] flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:gap-6 ${
                isToday ? "bg-ember-400/5" : ""
              }`}
            >
              <div className="flex w-52 shrink-0 items-center gap-3">
                <div className="flex flex-col">
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-semibold uppercase tracking-[0.3em] text-slate-500">
                      {weekday}
                    </span>
                    {isToday ? (
                      <span className="rounded-full border border-ember-300/30 bg-ember-400/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.22em] text-ember-100">
                        Today
                      </span>
                    ) : null}
                  </div>
                  <span
                    className={`whitespace-nowrap text-base font-semibold leading-tight text-sand-50 ${
                      isToday ? "mt-1.5" : "mt-0.5"
                    }`}
                  >
                    {formatFullDate(day)}
                  </span>
                </div>
              </div>

              <div className="flex min-h-[2.25rem] flex-1 flex-wrap gap-2">
                {dayEpisodes.length > 0 ? (
                  dayEpisodes.map((episode) => (
                    <button
                      key={episode.id}
                      type="button"
                      onClick={() => onToggleWatched(episode.id)}
                      className={`inline-flex max-w-full cursor-pointer items-center gap-2 rounded-full border px-3 py-2 text-left text-sm transition hover:-translate-y-0.5 ${
                        episode.watched
                          ? "border-emerald-300/20 bg-emerald-400/10 text-emerald-100"
                          : "border-white/10 bg-white/[0.04] text-sand-50 hover:border-ember-300/25 hover:bg-white/[0.07]"
                      }`}
                    >
                      <span className="font-medium">{episode.showTitle}</span>
                      <span className="text-xs text-slate-400">{episode.episodeLabel}</span>
                    </button>
                  ))
                ) : isLoading ? (
                  <div
                    className="flex flex-wrap gap-2"
                    data-testid="calendar-loading-row"
                    aria-hidden="true"
                  >
                    <div className="h-10 w-36 animate-pulse rounded-full border border-white/10 bg-white/[0.06]" />
                    <div className="h-10 w-24 animate-pulse rounded-full border border-white/10 bg-white/[0.06]" />
                  </div>
                ) : null}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function groupEpisodesByDay(episodes: TrackedEpisode[]): Map<string, TrackedEpisode[]> {
  const groups = new Map<string, TrackedEpisode[]>();

  for (const episode of episodes) {
    const key = episode.airDate;
    const dayEpisodes = groups.get(key) ?? [];
    dayEpisodes.push(episode);
    groups.set(key, dayEpisodes);
  }

  return groups;
}

function compareEpisodes(a: TrackedEpisode, b: TrackedEpisode): number {
  const aTime = a.airDateTime ? new Date(a.airDateTime).getTime() : 0;
  const bTime = b.airDateTime ? new Date(b.airDateTime).getTime() : 0;

  if (aTime !== bTime) {
    return aTime - bTime;
  }

  return a.title.localeCompare(b.title);
}
