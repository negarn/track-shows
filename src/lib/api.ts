import { formatAirTime, toLocalDateKey } from "./date";
import type { SearchResult, TrackedEpisode, TrackedShow } from "../types";

const TVMAZE_BASE = "https://api.tvmaze.com";

interface TvMazeSearchItem {
  score: number;
  show: TvMazeShow;
}

interface TvMazeShow {
  id: number;
  name: string;
  premiered?: string | null;
  status?: string | null;
  type?: string | null;
  summary?: string | null;
  genres?: string[];
  image?: {
    medium?: string | null;
    original?: string | null;
  } | null;
  network?: {
    name?: string | null;
  } | null;
  webChannel?: {
    name?: string | null;
  } | null;
  officialSite?: string | null;
  url?: string | null;
}

interface TvMazeEpisode {
  id: number;
  name?: string | null;
  season?: number | null;
  number?: number | null;
  type?: string | null;
  airdate?: string | null;
  airtime?: string | null;
  airstamp?: string | null;
  summary?: string | null;
  url?: string | null;
}

function cleanText(value?: string | null): string {
  if (!value) {
    return "";
  }

  return value
    .replace(/<br\s*\/?>/gi, " ")
    .replace(/<\/p>|<\/li>|<\/h\d>/gi, " ")
    .replace(/<[^>]+>/g, "")
    .replace(/[*_~`#>-]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function buildSearchId(sourceId: string): string {
  return `tvmaze:${sourceId}`;
}

function pickImageUrl(image?: TvMazeShow["image"]): string | undefined {
  if (!image) {
    return undefined;
  }

  if (image.original) {
    return image.original;
  }

  if (image.medium) {
    return image.medium;
  }

  return undefined;
}

function buildSubtitle(parts: Array<string | number | null | undefined>): string | undefined {
  const text = parts
    .map((part) => (typeof part === "number" ? String(part) : part?.trim()))
    .filter((part): part is string => Boolean(part));

  return text.length ? text.join(" · ") : undefined;
}

function mapTvMazeSearchItem(item: TvMazeSearchItem): SearchResult {
  const show = item.show;
  const year = show.premiered ? new Date(show.premiered).getFullYear() : undefined;
  const subtitle = buildSubtitle([show.type, show.status, year]);

  return {
    id: buildSearchId(String(show.id)),
    source: "tvmaze",
    sourceId: String(show.id),
    title: show.name?.trim() || "Untitled show",
    subtitle,
    description: cleanText(show.summary) || undefined,
    posterUrl: pickImageUrl(show.image),
    bannerUrl: pickImageUrl(show.image),
    year,
    status: show.status ?? undefined,
    format: show.type ?? "TV",
    genres: show.genres ?? [],
    sourceUrl: show.officialSite ?? show.url ?? undefined,
    episodeCount: null,
    relevance: item.score
  };
}

async function fetchJson<T>(input: RequestInfo | URL, init?: RequestInit): Promise<T> {
  const response = await fetch(input, init);
  if (!response.ok) {
    throw new Error(`Request failed with status ${response.status}`);
  }

  return (await response.json()) as T;
}

export async function searchShows(query: string): Promise<SearchResult[]> {
  const trimmed = query.trim();
  if (trimmed.length < 2) {
    return [];
  }

  const items = await fetchJson<TvMazeSearchItem[]>(
    `${TVMAZE_BASE}/search/shows?q=${encodeURIComponent(trimmed)}`
  );

  return items.slice(0, 8).map(mapTvMazeSearchItem);
}

async function fetchTvMazeEpisodes(showId: string, show: SearchResult): Promise<TrackedEpisode[]> {
  const episodes = await fetchJson<TvMazeEpisode[]>(`${TVMAZE_BASE}/shows/${showId}/episodes`);

  return episodes
    .filter((episode) => Boolean(episode.airdate))
    .map((episode) => {
      const airDateTime = episode.airstamp ?? (episode.airdate ? `${episode.airdate}T00:00:00` : undefined);
      const dateKey = airDateTime ? toLocalDateKey(new Date(airDateTime)) : episode.airdate!;
      const episodeLabel = formatEpisodeLabel(episode.season, episode.number, episode.type);
      const title = episode.name?.trim() || episodeLabel;

      return {
        id: `tvmaze:${showId}:${episode.id}`,
        source: "tvmaze",
        showId: show.id,
        showTitle: show.title,
        showPosterUrl: show.posterUrl,
        showSourceLabel: "TV",
        title,
        episodeLabel,
        season: episode.season ?? null,
        episodeNumber: episode.number ?? null,
        airDate: dateKey,
        airDateTime,
        airTimeLabel: formatAirTime(airDateTime),
        watched: false,
        sourceUrl: episode.url ?? show.sourceUrl
      };
    })
    .sort(compareEpisodesByAirDate);
}

function formatEpisodeLabel(season?: number | null, number?: number | null, type?: string | null): string {
  if (number != null && season != null && season > 0) {
    return `S${season} • E${number}`;
  }

  if (number != null) {
    return `Episode ${number}`;
  }

  if (type) {
    return type.charAt(0).toUpperCase() + type.slice(1);
  }

  return "Episode";
}

function compareEpisodesByAirDate(a: TrackedEpisode, b: TrackedEpisode): number {
  const aTime = a.airDateTime ? new Date(a.airDateTime).getTime() : 0;
  const bTime = b.airDateTime ? new Date(b.airDateTime).getTime() : 0;

  if (aTime !== bTime) {
    return aTime - bTime;
  }

  return a.title.localeCompare(b.title);
}

function mergeWatchedEpisodes(previous: TrackedEpisode[], next: TrackedEpisode[]): TrackedEpisode[] {
  const watchedById = new Map(previous.map((episode) => [episode.id, episode.watched]));

  return next.map((episode) => ({
    ...episode,
    watched: watchedById.get(episode.id) ?? false
  }));
}

export async function buildTrackedShow(result: SearchResult): Promise<TrackedShow> {
  const episodes = await fetchTvMazeEpisodes(result.sourceId, result);
  const now = new Date().toISOString();

  return {
    ...result,
    episodes,
    addedAt: now,
    lastSyncedAt: now
  };
}

export async function refreshTrackedShow(show: TrackedShow): Promise<TrackedShow> {
  const freshEpisodes = await fetchTvMazeEpisodes(show.sourceId, show);

  return {
    ...show,
    episodes: mergeWatchedEpisodes(show.episodes, freshEpisodes),
    lastSyncedAt: new Date().toISOString()
  };
}
