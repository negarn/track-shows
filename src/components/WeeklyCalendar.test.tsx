import { fireEvent, render, screen } from "@testing-library/react";
import { expect, test, vi } from "vitest";
import { createTrackedEpisode } from "../test/testUtils";
import { WeeklyCalendar } from "./WeeklyCalendar";

test("renders same-day episodes in episode order and toggles the selected episode", () => {
  const onToggleWatched = vi.fn();

  render(
    <WeeklyCalendar
      weekStart={new Date(2024, 0, 1)}
      todayKey="2024-01-01"
      onToggleWatched={onToggleWatched}
      episodes={[
        createTrackedEpisode({
          id: "episode-2",
          episodeNumber: 2,
          episodeLabel: "S1 • E2",
          title: "A second episode",
        }),
        createTrackedEpisode({
          id: "episode-1",
          episodeNumber: 1,
          episodeLabel: "S1 • E1",
          title: "Z first episode",
        }),
      ]}
    />,
  );

  const buttons = screen.getAllByRole("button");
  expect(buttons.map((button) => button.textContent)).toEqual([
    "Example ShowS1 • E1",
    "Example ShowS1 • E2",
  ]);

  fireEvent.click(buttons[0]);
  expect(onToggleWatched).toHaveBeenCalledWith("episode-1");
});
