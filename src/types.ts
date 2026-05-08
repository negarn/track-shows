export type MediaSource = "tvmaze";
export type SearchScope = "shows" | "watchlist";

export interface SearchResult {
  id: string;
  source: MediaSource;
  sourceId: string;
  title: string;
  subtitle?: string;
  description?: string;
  posterUrl?: string;
  bannerUrl?: string;
  year?: number;
  status?: string;
  format?: string;
  genres: string[];
  sourceUrl?: string;
  episodeCount?: number | null;
  relevance: number;
}

export interface TrackedEpisode {
  id: string;
  source: MediaSource;
  showId: string;
  showTitle: string;
  showPosterUrl?: string;
  showSourceLabel: string;
  title: string;
  episodeLabel: string;
  season?: number | null;
  episodeNumber?: number | null;
  airDate: string;
  airDateTime?: string;
  airTimeLabel?: string;
  watched: boolean;
  sourceUrl?: string;
}

export interface TrackedShow extends SearchResult {
  episodes: TrackedEpisode[];
  addedAt: string;
  lastSyncedAt: string;
}
