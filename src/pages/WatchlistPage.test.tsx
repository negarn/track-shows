import { render, screen } from "@testing-library/react";
import { describe, expect, test, vi } from "vitest";
import { createTrackedEpisode, createTrackedShow } from "../test/testUtils";
import { WatchlistPage } from "./WatchlistPage";

describe("WatchlistPage", () => {
  const noop = vi.fn();

  test("shows skeleton cards while loading and hides the empty state", () => {
    render(
      <WatchlistPage
        highlightedShowId={null}
        isLoading={true}
        nextDisabled={true}
        onMarkAiredWatched={noop}
        onNextPage={noop}
        onPreviousPage={noop}
        onRefresh={noop}
        onRemove={noop}
        onToggleWatched={noop}
        previousDisabled={true}
        shows={[]}
        syncingId={null}
      />,
    );

    expect(screen.queryByText("No watchlist yet.")).not.toBeInTheDocument();
    expect(screen.getAllByTestId("watchlist-loading-card")).toHaveLength(3);
  });

  test("shows the empty state when not loading and there are no shows", () => {
    render(
      <WatchlistPage
        highlightedShowId={null}
        isLoading={false}
        nextDisabled={true}
        onMarkAiredWatched={noop}
        onNextPage={noop}
        onPreviousPage={noop}
        onRefresh={noop}
        onRemove={noop}
        onToggleWatched={noop}
        previousDisabled={true}
        shows={[]}
        syncingId={null}
      />,
    );

    expect(screen.getByText("No watchlist yet.")).toBeInTheDocument();
  });

  test("shows next episode dates in the client timezone", () => {
    render(
      <WatchlistPage
        highlightedShowId={null}
        isLoading={false}
        nextDisabled={true}
        onMarkAiredWatched={noop}
        onNextPage={noop}
        onPreviousPage={noop}
        onRefresh={noop}
        onRemove={noop}
        onToggleWatched={noop}
        previousDisabled={true}
        shows={[
          createTrackedShow({
            episodes: [
              createTrackedEpisode({
                airDate: "2026-05-08",
                airDateTime: "2026-05-08T13:00:00.000Z",
                airTimeLabel: "9:00 AM",
                episodeLabel: "S1 • E6",
              }),
            ],
            title: "An Observation Log of My Fiancee Who Calls Herself a Villainess",
          }),
        ]}
        syncingId={null}
      />,
    );

    expect(screen.getByText(/on May 8, 2026/)).toBeInTheDocument();
    expect(screen.queryByText(/on May 7, 2026/)).not.toBeInTheDocument();
  });
});
