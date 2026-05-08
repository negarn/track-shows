import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, test, vi } from "vitest";
import { createDeferred, createSnapshot, createTrackedShow } from "../test/testUtils";
import { loadTrackShowsState, saveTrackShowsState } from "../lib/trackShowsState";
import { useTrackShowsState } from "./useTrackShowsState";

vi.mock("../lib/trackShowsState", () => ({
  loadTrackShowsState: vi.fn(),
  saveTrackShowsState: vi.fn()
}));

describe("useTrackShowsState", () => {
  const mockedLoadTrackShowsState = vi.mocked(loadTrackShowsState);
  const mockedSaveTrackShowsState = vi.mocked(saveTrackShowsState);

  beforeEach(() => {
    mockedLoadTrackShowsState.mockReset();
    mockedSaveTrackShowsState.mockReset();
  });

  test("loads the saved snapshot and debounces saves", async () => {
    const initialSnapshot = createSnapshot([createTrackedShow({ title: "Saved Show" })]);
    const nextSnapshot = createSnapshot([
      createTrackedShow({ title: "Saved Show" }),
      createTrackedShow({
        id: "tvmaze:2",
        sourceId: "2",
        title: "New Show",
        episodes: [],
        addedAt: "2024-01-02T00:00:00.000Z",
        lastSyncedAt: "2024-01-02T00:00:00.000Z"
      })
    ]);
    const saveDeferred = createDeferred<void>();

    mockedLoadTrackShowsState.mockResolvedValue(initialSnapshot);
    mockedSaveTrackShowsState.mockImplementation(async (snapshot) => {
      await saveDeferred.promise;
      return snapshot;
    });

    const { result } = renderHook(() => useTrackShowsState());

    expect(result.current.isLoading).toBe(true);
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.state).toEqual(initialSnapshot);

    act(() => {
      result.current.setState(nextSnapshot);
    });

    expect(mockedSaveTrackShowsState).not.toHaveBeenCalled();

    await waitFor(() => expect(mockedSaveTrackShowsState).toHaveBeenCalledTimes(1));
    expect(result.current.isSaving).toBe(true);

    await act(async () => {
      saveDeferred.resolve(undefined);
    });
    await waitFor(() => expect(result.current.isSaving).toBe(false));
    expect(mockedSaveTrackShowsState).toHaveBeenCalledWith(nextSnapshot);
  });

  test("refreshes the snapshot from the server", async () => {
    const initialSnapshot = createSnapshot([createTrackedShow({ title: "Initial Show" })]);
    const refreshedSnapshot = createSnapshot([createTrackedShow({ title: "Refreshed Show" })]);

    mockedLoadTrackShowsState
      .mockResolvedValueOnce(initialSnapshot)
      .mockResolvedValueOnce(refreshedSnapshot);

    const { result } = renderHook(() => useTrackShowsState());

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    await act(async () => {
      await result.current.refresh();
    });

    expect(result.current.state).toEqual(refreshedSnapshot);
    expect(result.current.error).toBeNull();
  });

  test("reports load errors", async () => {
    mockedLoadTrackShowsState.mockRejectedValueOnce(new Error("Could not load tracked show data."));

    const { result } = renderHook(() => useTrackShowsState());

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.error).toBe("Could not load tracked show data.");
  });
});
