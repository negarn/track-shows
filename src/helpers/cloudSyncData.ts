import type { MediaSource, TrackedEpisode, TrackedShow } from "../types";

function isRecordLike(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isMediaSource(value: unknown): value is MediaSource {
  return value === "tvmaze";
}

function normalizeString(value: unknown): string | undefined {
  return typeof value === "string" && value.trim().length > 0 ? value : undefined;
}

function normalizeNumber(value: unknown): number | undefined {
  return typeof value === "number" && Number.isFinite(value) ? value : undefined;
}

function normalizeStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter((item): item is string => typeof item === "string" && item.trim().length > 0);
}

function normalizeTrackedEpisode(value: unknown): TrackedEpisode | null {
  if (!isRecordLike(value)) {
    return null;
  }

  const {
    airDate,
    airDateTime,
    airTimeLabel,
    episodeLabel,
    episodeNumber,
    id,
    season,
    showId,
    showPosterUrl,
    showSourceLabel,
    showTitle,
    source,
    sourceUrl,
    title,
    watched
  } = value as Partial<Record<keyof TrackedEpisode, unknown>>;

  if (
    typeof id !== "string" ||
    !isMediaSource(source) ||
    typeof showId !== "string" ||
    typeof showTitle !== "string" ||
    typeof showSourceLabel !== "string" ||
    typeof title !== "string" ||
    typeof episodeLabel !== "string" ||
    typeof airDate !== "string" ||
    typeof watched !== "boolean"
  ) {
    return null;
  }

  return {
    id,
    source,
    showId,
    showTitle,
    showPosterUrl: normalizeString(showPosterUrl),
    showSourceLabel,
    title,
    episodeLabel,
    season: normalizeNumber(season) ?? null,
    episodeNumber: normalizeNumber(episodeNumber) ?? null,
    airDate,
    airDateTime: normalizeString(airDateTime),
    airTimeLabel: normalizeString(airTimeLabel),
    watched,
    sourceUrl: normalizeString(sourceUrl)
  };
}

function normalizeTrackedShow(value: unknown): TrackedShow | null {
  if (!isRecordLike(value)) {
    return null;
  }

  const {
    addedAt,
    bannerUrl,
    description,
    episodeCount,
    episodes,
    format,
    genres,
    id,
    lastSyncedAt,
    posterUrl,
    relevance,
    source,
    sourceId,
    sourceUrl,
    status,
    subtitle,
    title,
    year
  } = value as Partial<Record<keyof TrackedShow, unknown>> & { posterior?: unknown };

  if (
    typeof id !== "string" ||
    !isMediaSource(source) ||
    typeof sourceId !== "string" ||
    typeof title !== "string" ||
    typeof relevance !== "number" ||
    typeof addedAt !== "string" ||
    typeof lastSyncedAt !== "string"
  ) {
    return null;
  }

  const nextEpisodes = Array.isArray(episodes)
    ? episodes
        .map(normalizeTrackedEpisode)
        .filter((episode): episode is TrackedEpisode => episode !== null)
    : [];

  return {
    id,
    source,
    sourceId,
    title,
    subtitle: normalizeString(subtitle),
    description: normalizeString(description),
    posterUrl: normalizeString(posterUrl),
    bannerUrl: normalizeString(bannerUrl),
    year: normalizeNumber(year),
    status: normalizeString(status),
    format: normalizeString(format),
    genres: normalizeStringArray(genres),
    sourceUrl: normalizeString(sourceUrl),
    episodeCount: episodeCount === null ? null : normalizeNumber(episodeCount),
    relevance,
    episodes: nextEpisodes,
    addedAt,
    lastSyncedAt
  };
}

export const cloudSyncProviders = ["google-drive", "dropbox"] as const;

export type CloudSyncProvider = (typeof cloudSyncProviders)[number];

export const cloudSyncProviderLabels: Record<CloudSyncProvider, string> = {
  "google-drive": "Google Drive",
  dropbox: "Dropbox"
};

export const cloudSyncBundleFileName = "track-shows-app-state.json";

export type TrackShowsAppDataSnapshot = {
  trackedShows: TrackedShow[];
};

export type CloudSyncBundle = {
  snapshot: TrackShowsAppDataSnapshot;
  version: 1;
};

export type CloudSyncProviderConnectionStatus = {
  isConfigured: boolean;
  isConnected: boolean;
  lastError: string | null;
  lastKnownRemoteModifiedAt: string | null;
  lastSyncedAt: string | null;
};

export type CloudSyncStatus = {
  activeProvider: CloudSyncProvider | null;
  isSyncing: boolean;
  providers: Record<CloudSyncProvider, CloudSyncProviderConnectionStatus>;
};

export function createEmptyTrackShowsAppDataSnapshot(): TrackShowsAppDataSnapshot {
  return {
    trackedShows: []
  };
}

export function isTrackShowsAppDataSnapshotEmpty(snapshot: TrackShowsAppDataSnapshot) {
  return snapshot.trackedShows.length === 0;
}

export function normalizeTrackShowsAppDataSnapshot(value: unknown): TrackShowsAppDataSnapshot {
  if (!isRecordLike(value)) {
    return createEmptyTrackShowsAppDataSnapshot();
  }

  const trackedShows = Array.isArray(value.trackedShows)
    ? value.trackedShows
        .map(normalizeTrackedShow)
        .filter((show): show is TrackedShow => show !== null)
    : [];

  return {
    trackedShows
  };
}

export function serializeCloudSyncBundle(snapshot: TrackShowsAppDataSnapshot): CloudSyncBundle {
  return {
    snapshot,
    version: 1
  };
}

export function normalizeCloudSyncBundle(value: unknown) {
  if (isRecordLike(value) && value.version === 1 && "snapshot" in value) {
    return normalizeTrackShowsAppDataSnapshot((value as { snapshot?: unknown }).snapshot);
  }

  return normalizeTrackShowsAppDataSnapshot(value);
}

export function createDefaultCloudSyncStatus(): CloudSyncStatus {
  const providerStatus = (): CloudSyncProviderConnectionStatus => ({
    isConfigured: false,
    isConnected: false,
    lastError: null,
    lastKnownRemoteModifiedAt: null,
    lastSyncedAt: null
  });

  return {
    activeProvider: null,
    isSyncing: false,
    providers: {
      "google-drive": providerStatus(),
      dropbox: providerStatus()
    }
  };
}
