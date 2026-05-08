import { render, screen } from "@testing-library/react";
import { describe, expect, test, vi } from "vitest";
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
});
