import { render, screen, act, fireEvent, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, test, vi } from "vitest";
import App from "./App";
import { buildTrackedShow, refreshTrackedShow, searchShows } from "./lib/api";
import { loadTrackShowsState, saveTrackShowsState } from "./lib/trackShowsState";
import type { SearchResult, TrackedShow } from "./types";
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
    vi.useRealTimers();
    mockedLoadTrackShowsState.mockReset();
    mockedSaveTrackShowsState.mockReset();
    mockedSearchShows.mockReset();
    mockedBuildTrackedShow.mockReset();
    mockedRefreshTrackedShow.mockReset();
    mockedSaveTrackShowsState.mockImplementation(async (snapshot) => snapshot);
    mockedLoadTrackShowsState.mockResolvedValue(createSnapshot());
    window.localStorage.clear();
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

  test("updates the today marker when the tab becomes active again", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2024, 0, 1, 23, 55));
    window.history.pushState({}, "", "/?weekStart=2024-01-01");

    render(<App />);

    await act(async () => {
      await Promise.resolve();
    });

    expect(screen.getByText("Today").closest("div.flex.min-h-\\[4\\.75rem\\]")).toHaveTextContent("January 1, 2024");

    Object.defineProperty(document, "visibilityState", {
      configurable: true,
      value: "hidden",
    });
    vi.setSystemTime(new Date(2024, 0, 2, 0, 5));
    fireEvent(document, new Event("visibilitychange"));
    expect(screen.getByText("Today").closest("div.flex.min-h-\\[4\\.75rem\\]")).toHaveTextContent("January 1, 2024");

    Object.defineProperty(document, "visibilityState", {
      configurable: true,
      value: "visible",
    });
    fireEvent(document, new Event("visibilitychange"));
    expect(screen.getByText("Today").closest("div.flex.min-h-\\[4\\.75rem\\]")).toHaveTextContent("January 2, 2024");
  });

  test("auto-refreshes the watchlist once per day after 7 AM", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2024, 0, 1, 6, 59));

    const firstShow = createTrackedShow({ id: "tvmaze:1", sourceId: "1", title: "First Show" });
    const secondShow = createTrackedShow({
      id: "tvmaze:2",
      sourceId: "2",
      title: "Second Show",
      episodes: [
        {
          ...firstShow.episodes[0],
          id: "tvmaze:2:1",
          showId: "tvmaze:2",
          showTitle: "Second Show",
        },
      ],
    });
    const refreshedShows: Record<string, TrackedShow> = {
      "tvmaze:1": { ...firstShow, title: "First Show Updated" },
      "tvmaze:2": { ...secondShow, title: "Second Show Updated" },
    };

    mockedLoadTrackShowsState.mockResolvedValueOnce(createSnapshot([firstShow, secondShow]));
    mockedRefreshTrackedShow.mockImplementation(async (show) => refreshedShows[show.id]);

    render(<App />);

    await act(async () => {
      await Promise.resolve();
    });

    expect(mockedRefreshTrackedShow).not.toHaveBeenCalled();

    vi.setSystemTime(new Date(2024, 0, 1, 7, 0));
    await act(async () => {
      await vi.advanceTimersByTimeAsync(60_000);
    });

    expect(mockedRefreshTrackedShow).toHaveBeenCalledTimes(2);
    expect(mockedRefreshTrackedShow).toHaveBeenNthCalledWith(1, firstShow);
    expect(mockedRefreshTrackedShow).toHaveBeenNthCalledWith(2, secondShow);

    await act(async () => {
      await vi.advanceTimersByTimeAsync(180);
      await Promise.resolve();
    });

    expect(mockedSaveTrackShowsState).toHaveBeenCalledTimes(1);
    expect(mockedSaveTrackShowsState.mock.calls[0]?.[0].trackedShows).toEqual([
      refreshedShows["tvmaze:1"],
      refreshedShows["tvmaze:2"],
    ]);

    await act(async () => {
      await vi.advanceTimersByTimeAsync(60 * 60 * 1000);
    });

    expect(mockedRefreshTrackedShow).toHaveBeenCalledTimes(2);
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
