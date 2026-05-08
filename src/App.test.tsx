import { render, screen, act, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, test, vi } from "vitest";
import App from "./App";
import { buildTrackedShow, refreshTrackedShow, searchShows } from "./lib/api";
import { loadTrackShowsState, saveTrackShowsState } from "./lib/trackShowsState";
import type { SearchResult } from "./types";
import { createDeferred, createSearchResult, createSnapshot, createTrackedShow } from "./test/testUtils";

vi.mock("./lib/api", () => ({
  buildTrackedShow: vi.fn(),
  refreshTrackedShow: vi.fn(),
  searchShows: vi.fn()
}));

vi.mock("./lib/trackShowsState", () => ({
  loadTrackShowsState: vi.fn(),
  saveTrackShowsState: vi.fn()
}));

describe("App", () => {
  const mockedLoadTrackShowsState = vi.mocked(loadTrackShowsState);
  const mockedSaveTrackShowsState = vi.mocked(saveTrackShowsState);
  const mockedSearchShows = vi.mocked(searchShows);
  const mockedBuildTrackedShow = vi.mocked(buildTrackedShow);
  const mockedRefreshTrackedShow = vi.mocked(refreshTrackedShow);

  beforeEach(() => {
    mockedLoadTrackShowsState.mockReset();
    mockedSaveTrackShowsState.mockReset();
    mockedSearchShows.mockReset();
    mockedBuildTrackedShow.mockReset();
    mockedRefreshTrackedShow.mockReset();
    mockedSaveTrackShowsState.mockImplementation(async (snapshot) => snapshot);
    mockedLoadTrackShowsState.mockResolvedValue(createSnapshot());
    window.history.pushState({}, "", "/");
  });

  test("searches, tracks, refreshes, and toggles watched episodes", async () => {
    const user = userEvent.setup();
    const searchDeferred = createDeferred<SearchResult[]>();
    const trackedShow = createTrackedShow({
      id: "tvmaze:99",
      sourceId: "99",
      title: "Example Show",
      episodes: [
        {
          id: "tvmaze:99:1",
          source: "tvmaze",
          showId: "tvmaze:99",
          showTitle: "Example Show",
          showSourceLabel: "TV",
          title: "Pilot",
          episodeLabel: "Episode 1",
          season: 1,
          episodeNumber: 1,
          airDate: "2024-01-01",
          airDateTime: "2024-01-01T20:00:00.000Z",
          airTimeLabel: "8:00 PM",
          watched: false,
          sourceUrl: undefined
        }
      ]
    });
    const refreshedShow = {
      ...trackedShow,
      title: "Example Show Updated",
      lastSyncedAt: "2024-01-03T12:00:00.000Z"
    };

    mockedSearchShows.mockReturnValueOnce(searchDeferred.promise);
    mockedBuildTrackedShow.mockResolvedValue(trackedShow);
    mockedRefreshTrackedShow.mockResolvedValue(refreshedShow);

    render(<App />);
    await act(async () => {
      await Promise.resolve();
    });

    const searchInput = screen.getByPlaceholderText("Search shows");
    await user.type(searchInput, "Example");

    await waitFor(() => expect(screen.getByText("Searching...")).toBeInTheDocument());

    await act(async () => {
      searchDeferred.resolve([createSearchResult({ id: "tvmaze:99", sourceId: "99", title: "Example Show" })]);
    });

    await waitFor(() => expect(screen.getByRole("button", { name: "Track Example Show" })).toBeInTheDocument());

    await user.click(screen.getByRole("button", { name: "Track Example Show" }));

    await waitFor(() => expect(mockedSaveTrackShowsState).toHaveBeenCalledTimes(1));

    await user.click(screen.getAllByRole("button", { name: "Watchlist" })[0]);
    await waitFor(() => expect(screen.getByText("Example Show")).toBeInTheDocument());
    expect(screen.getByText("0/1 watched")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Refresh" }));
    await waitFor(() => expect(screen.getByText("Example Show Updated")).toBeInTheDocument());

    await waitFor(() => expect(mockedSaveTrackShowsState).toHaveBeenCalledTimes(2));

    await user.click(screen.getByRole("button", { name: "Mark watched" }));
    await waitFor(() => expect(screen.getByText("Caught up")).toBeInTheDocument());
    await waitFor(() => expect(mockedSaveTrackShowsState).toHaveBeenCalledTimes(3));

  });

  test("updates calendar navigation and URL state", async () => {
    const user = userEvent.setup();

    window.history.pushState({}, "", "/?weekStart=2024-01-01");
    render(<App />);

    await act(async () => {
      await Promise.resolve();
    });

    expect(screen.getByText("January 1, 2024")).toBeInTheDocument();

    await user.click(screen.getByLabelText("Next week"));
    expect(screen.getByText("January 8, 2024")).toBeInTheDocument();

    const tabBar = document.querySelector("div.inline-flex.rounded-full.border");
    expect(tabBar).not.toBeNull();

    const tabButtons = within(tabBar as HTMLElement);

    const [calendarTab, watchlistTab, settingsTab] = tabButtons.getAllByRole("button");

    await user.click(watchlistTab);
    await waitFor(() => expect(screen.getByText("No watchlist yet.")).toBeInTheDocument());

    await user.click(settingsTab);
    await waitFor(() => expect(screen.getByText("Cloud sync")).toBeInTheDocument());
    expect(screen.getByText("API details")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "TVmaze" })).toHaveAttribute(
      "href",
      "https://www.tvmaze.com/",
    );

    await user.click(calendarTab);
    await waitFor(() => expect(screen.getByText("January 8, 2024")).toBeInTheDocument());
  });

  test("shows calendar row skeletons while tracked shows are loading", async () => {
    const loadDeferred = createDeferred<ReturnType<typeof createSnapshot>>();
    mockedLoadTrackShowsState.mockReturnValueOnce(loadDeferred.promise);

    render(<App />);

    expect(screen.queryByText("Loading saved watchlist...")).not.toBeInTheDocument();
    expect(screen.getAllByTestId("calendar-loading-row")).toHaveLength(7);

    await act(async () => {
      loadDeferred.resolve(createSnapshot());
    });

    await waitFor(() => {
      expect(screen.queryByTestId("calendar-loading-row")).not.toBeInTheDocument();
    });
  });

  test("shows an error banner when tracked shows fail to load", async () => {
    mockedLoadTrackShowsState.mockRejectedValueOnce(new Error("Could not load tracked show data."));

    render(<App />);

    await waitFor(() => {
      expect(screen.getByText("Could not load tracked show data.")).toBeInTheDocument();
    });
  });
});
