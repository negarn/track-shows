export const demoDataDirName = ".track-shows-demo";

const TRACK_SHOWS_APP_STATE_FILE_NAME = "track-shows-app-state.json";
const CLOUD_SYNC_STATE_FILE_NAME = "cloud-sync.json";

const snapshotGeneratedAt = new Date();
const snapshotTimestamp = snapshotGeneratedAt.toISOString();
const currentYear = snapshotGeneratedAt.getFullYear();
const currentWeekStart = startOfWeekMonday(snapshotGeneratedAt);
const previousWeekStart = addDays(currentWeekStart, -7);

const airTimeFormatter = new Intl.DateTimeFormat("en-US", {
  hour: "numeric",
  minute: "2-digit"
});

function startOfWeekMonday(date = new Date()) {
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);
  const shift = (start.getDay() + 6) % 7;
  start.setDate(start.getDate() - shift);
  return start;
}

function addDays(date, days) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function toLocalDateKey(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function withLocalTime(date, hour, minute) {
  const next = new Date(date);
  next.setHours(hour, minute, 0, 0);
  return next;
}

function formatTimeLabel(date) {
  return airTimeFormatter.format(date);
}

function escapeXml(value) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

function createPosterDataUrl({ title, subtitle, from, to, glow, badge }) {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 480" role="img" aria-labelledby="poster-title poster-desc">
      <title id="poster-title">${escapeXml(title)}</title>
      <desc id="poster-desc">${escapeXml(subtitle)}</desc>
      <defs>
        <linearGradient id="bg" x1="0" x2="1" y1="0" y2="1">
          <stop offset="0%" stop-color="${from}" />
          <stop offset="100%" stop-color="${to}" />
        </linearGradient>
        <radialGradient id="glow" cx="28%" cy="16%" r="80%">
          <stop offset="0%" stop-color="${glow}" stop-opacity="0.9" />
          <stop offset="100%" stop-color="${glow}" stop-opacity="0" />
        </radialGradient>
      </defs>
      <rect width="360" height="480" rx="36" fill="url(#bg)" />
      <rect width="360" height="480" rx="36" fill="url(#glow)" />
      <circle cx="286" cy="98" r="72" fill="rgba(255,255,255,0.12)" />
      <circle cx="88" cy="372" r="96" fill="rgba(255,255,255,0.08)" />
      <circle cx="284" cy="366" r="52" fill="rgba(255,255,255,0.06)" />
      <text x="32" y="74" fill="rgba(255,255,255,0.72)" font-size="16" font-weight="700" font-family="Inter, ui-sans-serif, system-ui, sans-serif" letter-spacing="3">${badge}</text>
      <text x="32" y="154" fill="#ffffff" font-size="31" font-weight="800" font-family="Inter, ui-sans-serif, system-ui, sans-serif">${escapeXml(title)}</text>
      <text x="32" y="196" fill="rgba(255,255,255,0.88)" font-size="18" font-weight="500" font-family="Inter, ui-sans-serif, system-ui, sans-serif">${escapeXml(subtitle)}</text>
      <text x="32" y="404" fill="rgba(255,255,255,0.76)" font-size="15" font-weight="600" font-family="Inter, ui-sans-serif, system-ui, sans-serif">Demo watchlist</text>
    </svg>
  `.trim();

  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

function createEpisode(show, {
  dayOffset,
  episodeNumber,
  episodeTitle,
  hour,
  minute,
  season = 1,
  watched,
  week = "current"
}) {
  const weekStart = week === "previous" ? previousWeekStart : currentWeekStart;
  const airDate = addDays(weekStart, dayOffset);
  const airDateTime = withLocalTime(airDate, hour, minute);

  return {
    id: `${show.id}:s${season}e${episodeNumber}`,
    source: show.source,
    showId: show.id,
    showTitle: show.title,
    showSourceLabel: "TV",
    title: episodeTitle,
    episodeLabel: `Episode ${episodeNumber}`,
    season,
    episodeNumber,
    airDate: toLocalDateKey(airDate),
    airDateTime: airDateTime.toISOString(),
    airTimeLabel: formatTimeLabel(airDateTime),
    watched
  };
}

function createShow({
  source,
  sourceId,
  title,
  subtitle,
  description,
  format,
  genres,
  relevance,
  status,
  poster,
  episodeCount,
  episodes
}) {
  const posterUrl = createPosterDataUrl({ title, subtitle, ...poster });

  return {
    id: `${source}:${sourceId}`,
    source,
    sourceId,
    title,
    subtitle,
    description,
    posterUrl,
    bannerUrl: posterUrl,
    year: currentYear,
    status,
    format,
    genres,
    episodeCount,
    relevance,
    episodes: episodes.map((episode) => createEpisode({
      id: `${source}:${sourceId}`,
      source,
      title,
      posterUrl
    }, {
      dayOffset: episode.dayOffset,
      episodeNumber: episode.episodeNumber,
      episodeTitle: episode.episodeTitle,
      hour: episode.hour,
      minute: episode.minute,
      season: episode.season,
      watched: episode.watched,
      week: episode.week
    })),
    addedAt: snapshotTimestamp,
    lastSyncedAt: snapshotTimestamp
  };
}

const demoTrackedShows = [
  createShow({
    source: "tvmaze",
    sourceId: "901",
    title: "Signal Horizon",
    subtitle: "Sci-fi drama · 2026",
    description: "A salvage crew follows a ghost signal through abandoned orbital stations.",
    format: "TV",
    genres: ["Drama", "Mystery", "Science Fiction"],
    relevance: 98,
    status: "Currently Airing",
    poster: {
      from: "#0b1d3a",
      to: "#2563eb",
      glow: "#8bc7ff",
      badge: "TV MAZE"
    },
    episodeCount: 4,
    episodes: [
      {
        week: "previous",
        dayOffset: 1,
        episodeNumber: 1,
        episodeTitle: "The Static Between Stations",
        hour: 21,
        minute: 0,
        watched: true
      },
      {
        week: "previous",
        dayOffset: 3,
        episodeNumber: 2,
        episodeTitle: "Harbor Light",
        hour: 21,
        minute: 0,
        watched: true
      },
      {
        week: "previous",
        dayOffset: 4,
        episodeNumber: 3,
        episodeTitle: "A Signal Left Open",
        hour: 21,
        minute: 0,
        watched: false
      },
      {
        week: "current",
        dayOffset: 2,
        episodeNumber: 4,
        episodeTitle: "The Long Way Down",
        hour: 21,
        minute: 0,
        watched: false
      }
    ]
  }),
  createShow({
    source: "tvmaze",
    sourceId: "902",
    title: "Moonline Archive",
    subtitle: "Mystery drama · 2026",
    description: "Two archivists decode postcards from a city that disappears every Friday.",
    format: "TV",
    genres: ["Mystery", "Fantasy", "Slice of Life"],
    relevance: 95,
    status: "Releasing",
    poster: {
      from: "#37116e",
      to: "#0f766e",
      glow: "#c084fc",
      badge: "TV MAZE"
    },
    episodeCount: 3,
    episodes: [
      {
        week: "current",
        dayOffset: 0,
        episodeNumber: 1,
        episodeTitle: "Archive Room 12",
        hour: 20,
        minute: 30,
        watched: true
      },
      {
        week: "current",
        dayOffset: 2,
        episodeNumber: 2,
        episodeTitle: "Ink in the Water",
        hour: 20,
        minute: 30,
        watched: true
      },
      {
        week: "current",
        dayOffset: 4,
        episodeNumber: 3,
        episodeTitle: "Return to the Deep",
        hour: 20,
        minute: 30,
        watched: false
      }
    ]
  }),
  createShow({
    source: "tvmaze",
    sourceId: "903",
    title: "Northwind Club",
    subtitle: "Music drama · 2026",
    description: "A seaside jazz club stays open late while its regulars solve quiet mysteries.",
    format: "TV",
    genres: ["Drama", "Music", "Mystery"],
    relevance: 90,
    status: "Returning Series",
    poster: {
      from: "#1f2937",
      to: "#7c8aa3",
      glow: "#e2e8f0",
      badge: "TV MAZE"
    },
    episodeCount: 2,
    episodes: [
      {
        week: "previous",
        dayOffset: 2,
        episodeNumber: 1,
        episodeTitle: "The Last Lantern",
        hour: 19,
        minute: 0,
        watched: true
      },
      {
        week: "current",
        dayOffset: 3,
        episodeNumber: 2,
        episodeTitle: "A Map of Rain",
        hour: 19,
        minute: 0,
        watched: true
      }
    ]
  })
];

export const demoDataFiles = {
  [CLOUD_SYNC_STATE_FILE_NAME]: {
    activeConnection: null
  },
  [TRACK_SHOWS_APP_STATE_FILE_NAME]: {
    snapshot: {
      trackedShows: demoTrackedShows
    },
    version: 1
  }
};
