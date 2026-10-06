import { describe, expect, test } from "vitest";
import { createTrackedEpisode } from "../test/testUtils";
import { sortEpisodes } from "./episodes";

describe("sortEpisodes", () => {
  test("orders same-day episodes numerically instead of by title without mutating the input", () => {
    const episodes = [
      createTrackedEpisode({ id: "episode-10", episodeNumber: 10, title: "A finale" }),
      createTrackedEpisode({ id: "episode-2", episodeNumber: 2, title: "B follow-up" }),
      createTrackedEpisode({ id: "episode-1", episodeNumber: 1, title: "Z premiere" }),
    ];

    expect(sortEpisodes(episodes).map((episode) => episode.id)).toEqual([
      "episode-1",
      "episode-2",
      "episode-10",
    ]);
    expect(episodes.map((episode) => episode.id)).toEqual(["episode-10", "episode-2", "episode-1"]);
  });

  test("orders by season before episode and puts unnumbered episodes last within their season", () => {
    const episodes = [
      createTrackedEpisode({ id: "special", episodeNumber: null, title: "A special" }),
      createTrackedEpisode({ id: "season-2", season: 2, episodeNumber: 1 }),
      createTrackedEpisode({ id: "season-1", season: 1, episodeNumber: 10 }),
      createTrackedEpisode({ id: "unknown-season", season: undefined, episodeNumber: 1 }),
    ];

    expect(sortEpisodes(episodes).map((episode) => episode.id)).toEqual([
      "season-1",
      "special",
      "season-2",
      "unknown-season",
    ]);
  });

  test("sorts by release time before episode numbers across the same and different series", () => {
    const episodes = [
      createTrackedEpisode({
        id: "episode-1",
        episodeNumber: 1,
        airDateTime: "2024-01-01T22:00:00.000Z",
      }),
      createTrackedEpisode({
        id: "other-series",
        showId: "tvmaze:2",
        episodeNumber: 10,
        airDateTime: "2024-01-01T21:00:00.000Z",
      }),
      createTrackedEpisode({
        id: "episode-2",
        episodeNumber: 2,
        airDateTime: "2024-01-01T20:00:00.000Z",
      }),
    ];

    expect(sortEpisodes(episodes).map((episode) => episode.id)).toEqual([
      "episode-2",
      "other-series",
      "episode-1",
    ]);
  });

  test("groups simultaneous releases by series before applying episode numbers", () => {
    const episodes = [
      createTrackedEpisode({ id: "episode-2", episodeNumber: 2, title: "A follow-up" }),
      createTrackedEpisode({ id: "other-series", showId: "tvmaze:2", title: "B premiere" }),
      createTrackedEpisode({ id: "episode-1", episodeNumber: 1, title: "Z premiere" }),
    ];

    expect(sortEpisodes(episodes).map((episode) => episode.id)).toEqual([
      "episode-1",
      "episode-2",
      "other-series",
    ]);
  });

  test("keeps release days chronological when timestamps are missing", () => {
    const episodes = [
      createTrackedEpisode({
        id: "later-day",
        airDate: "2024-01-02",
        airDateTime: undefined,
        episodeNumber: 1,
        title: "A premiere",
      }),
      createTrackedEpisode({
        id: "earlier-day",
        airDateTime: undefined,
        episodeNumber: 10,
        title: "Z finale",
      }),
    ];

    expect(sortEpisodes(episodes).map((episode) => episode.id)).toEqual(["earlier-day", "later-day"]);
  });
});
