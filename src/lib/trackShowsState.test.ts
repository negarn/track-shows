import { beforeEach, describe, expect, test, vi } from "vitest";
import { cloudSyncApiPaths } from "../helpers/cloudSyncRoutes";
import { createSnapshot, createTrackedShow } from "../test/testUtils";
import { loadTrackShowsState, saveTrackShowsState } from "./trackShowsState";

function createMockResponse(body: unknown, ok = true): Response {
  return {
    ok,
    json: vi.fn().mockResolvedValue(body)
  } as unknown as Response;
}

describe("trackShowsState", () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    fetchMock.mockReset();
    vi.stubGlobal("fetch", fetchMock);
  });

  test("loads tracked shows from the API", async () => {
    const snapshot = createSnapshot([createTrackedShow({ title: "Loaded Show" })]);
    fetchMock.mockResolvedValueOnce(createMockResponse({ trackShows: snapshot }));

    await expect(loadTrackShowsState()).resolves.toEqual(snapshot);
    expect(fetchMock).toHaveBeenCalledWith(cloudSyncApiPaths.trackShows, {
      method: "GET",
      headers: undefined,
      body: undefined
    });
  });

  test("saves tracked shows and falls back to the local snapshot when the response omits data", async () => {
    const snapshot = createSnapshot([createTrackedShow({ title: "Saved Show" })]);
    fetchMock.mockResolvedValueOnce(createMockResponse({}));

    await expect(saveTrackShowsState(snapshot)).resolves.toEqual(snapshot);
    expect(fetchMock).toHaveBeenCalledWith(cloudSyncApiPaths.trackShows, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ trackShows: snapshot })
    });
  });

  test("throws the API error message when the request fails", async () => {
    fetchMock.mockResolvedValueOnce(
      createMockResponse(
        {
          error: "Could not update tracked show data."
        },
        false
      )
    );

    await expect(loadTrackShowsState()).rejects.toThrow("Could not update tracked show data.");
  });
});
