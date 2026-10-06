import type { TrackedEpisode } from "../types";

export function sortEpisodes(episodes: readonly TrackedEpisode[]): TrackedEpisode[] {
  return [...episodes].sort(compareEpisodesByAirDate);
}

function compareEpisodesByAirDate(a: TrackedEpisode, b: TrackedEpisode): number {
  const dateOrder = a.airDate.localeCompare(b.airDate);
  const aTime = a.airDateTime ? new Date(a.airDateTime).getTime() : 0;
  const bTime = b.airDateTime ? new Date(b.airDateTime).getTime() : 0;
  const showOrder = a.showTitle.localeCompare(b.showTitle) || a.showId.localeCompare(b.showId);
  const seasonOrder = (a.season ?? Number.MAX_SAFE_INTEGER) - (b.season ?? Number.MAX_SAFE_INTEGER);
  const episodeOrder =
    (a.episodeNumber ?? Number.MAX_SAFE_INTEGER) - (b.episodeNumber ?? Number.MAX_SAFE_INTEGER);

  return dateOrder || aTime - bTime || showOrder || seasonOrder || episodeOrder || a.title.localeCompare(b.title);
}
