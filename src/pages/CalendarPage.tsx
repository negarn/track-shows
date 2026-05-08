import type { JSX } from "react";
import { WeeklyCalendar } from "../components/WeeklyCalendar";
import { WeekNavigation } from "../components/WeekNavigation";
import type { TrackedEpisode } from "../types";

interface CalendarPageProps {
  episodes: TrackedEpisode[];
  isLoading: boolean;
  onNextWeek: () => void;
  onPreviousWeek: () => void;
  onToggleWatched: (episodeId: string) => void;
  weekStart: Date;
}

export function CalendarPage({
  episodes,
  isLoading,
  onNextWeek,
  onPreviousWeek,
  onToggleWatched,
  weekStart
}: CalendarPageProps): JSX.Element {
  return (
    <div className="flex flex-col gap-4">
      <WeeklyCalendar
        isLoading={isLoading}
        weekStart={weekStart}
        episodes={episodes}
        onToggleWatched={onToggleWatched}
      />
      <WeekNavigation onPreviousWeek={onPreviousWeek} onNextWeek={onNextWeek} />
    </div>
  );
}
