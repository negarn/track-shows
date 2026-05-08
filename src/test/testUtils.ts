import { createDefaultCloudSyncStatus, type CloudSyncProviderConnectionStatus, type CloudSyncStatus, type TrackShowsAppDataSnapshot } from "../helpers/cloudSyncData";
import type { SearchResult, TrackedEpisode, TrackedShow } from "../types";

export type Deferred<T> = {
  promise: Promise<T>;
  reject: (error: unknown) => void;
  resolve: (value: T) => void;
};

export function createDeferred<T>(): Deferred<T> {
  let resolve!: (value: T) => void;
  let reject!: (error: unknown) => void;

  const promise = new Promise<T>((nextResolve, nextReject) => {
    resolve = nextResolve;
    reject = nextReject;
  });

  return {
    promise,
    reject,
    resolve
  };
}

export function createSearchResult(overrides: Partial<SearchResult> = {}): SearchResult {
  return {
    id: "tvmaze:1",
    source: "tvmaze",
    sourceId: "1",
    title: "Example Show",
    genres: [],
    relevance: 1,
    ...overrides
  };
}

export function createTrackedEpisode(overrides: Partial<TrackedEpisode> = {}): TrackedEpisode {
  return {
    id: "tvmaze:1:1",
    source: "tvmaze",
    showId: "tvmaze:1",
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
    ...overrides
  };
}

export function createTrackedShow(overrides: Partial<TrackedShow> = {}): TrackedShow {
  return {
    ...createSearchResult(),
    episodes: [createTrackedEpisode()],
    addedAt: "2024-01-01T00:00:00.000Z",
    lastSyncedAt: "2024-01-01T00:00:00.000Z",
    ...overrides
  };
}

export function createSnapshot(trackedShows: TrackedShow[] = []): TrackShowsAppDataSnapshot {
  return {
    trackedShows
  };
}

export function createCloudSyncStatus(
  overrides: {
    activeProvider?: CloudSyncStatus["activeProvider"];
    googleDrive?: Partial<CloudSyncProviderConnectionStatus>;
    dropbox?: Partial<CloudSyncProviderConnectionStatus>;
    isSyncing?: boolean;
  } = {}
): CloudSyncStatus {
  const defaults = createDefaultCloudSyncStatus();

  return {
    activeProvider: overrides.activeProvider ?? defaults.activeProvider,
    isSyncing: overrides.isSyncing ?? defaults.isSyncing,
    providers: {
      "google-drive": {
        ...defaults.providers["google-drive"],
        ...overrides.googleDrive
      },
      dropbox: {
        ...defaults.providers.dropbox,
        ...overrides.dropbox
      }
    }
  };
}
