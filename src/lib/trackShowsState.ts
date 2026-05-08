import {
  normalizeTrackShowsAppDataSnapshot,
  type TrackShowsAppDataSnapshot
} from "../helpers/cloudSyncData";
import { cloudSyncApiPaths } from "../helpers/cloudSyncRoutes";

function isRecordLike(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

type TrackShowsStateResponse = {
  trackShows?: unknown;
};

async function requestTrackShowsState(method: "GET" | "PUT", body?: unknown): Promise<unknown> {
  const response = await fetch(cloudSyncApiPaths.trackShows, {
    method,
    headers: body === undefined ? undefined : { "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body)
  });

  const responseBody = (await response.json().catch(() => null)) as unknown;

  if (!response.ok) {
    if (isRecordLike(responseBody) && typeof responseBody.error === "string") {
      throw new Error(responseBody.error);
    }

    throw new Error("Could not load tracked show data.");
  }

  return responseBody;
}

function normalizeTrackShowsStateResponse(
  response: unknown,
  fallbackSnapshot?: TrackShowsAppDataSnapshot
): TrackShowsAppDataSnapshot {
  if (isRecordLike(response) && "trackShows" in response) {
    return normalizeTrackShowsAppDataSnapshot((response as TrackShowsStateResponse).trackShows);
  }

  if (fallbackSnapshot !== undefined) {
    return normalizeTrackShowsAppDataSnapshot(fallbackSnapshot);
  }

  return normalizeTrackShowsAppDataSnapshot(response);
}

export async function loadTrackShowsState(): Promise<TrackShowsAppDataSnapshot> {
  const response = await requestTrackShowsState("GET");
  return normalizeTrackShowsStateResponse(response);
}

export async function saveTrackShowsState(
  snapshot: TrackShowsAppDataSnapshot
): Promise<TrackShowsAppDataSnapshot> {
  const response = await requestTrackShowsState("PUT", { trackShows: snapshot });
  return normalizeTrackShowsStateResponse(response, snapshot);
}
