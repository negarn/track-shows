const longDateFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
});

const monthLongFormatter = new Intl.DateTimeFormat("en-US", {
  month: "long",
});

const timeFormatter = new Intl.DateTimeFormat("en-US", {
  hour: "numeric",
  minute: "2-digit",
});

export function startOfWeekMonday(date: Date = new Date()): Date {
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);
  const shift = (start.getDay() + 6) % 7;
  start.setDate(start.getDate() - shift);
  return start;
}

export function addDays(date: Date, days: number): Date {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

export function toLocalDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function fromLocalDateKey(dateKey: string): Date {
  const [year, month, day] = dateKey.split("-").map(Number);
  return new Date(year, month - 1, day);
}

export function formatLongDate(date: Date): string {
  return longDateFormatter.format(date);
}

export function formatFullDate(date: Date): string {
  return `${monthLongFormatter.format(date)} ${date.getDate()}, ${date.getFullYear()}`;
}

export function formatTime(date: Date): string {
  return timeFormatter.format(date);
}

export function isEpisodeAired(airDate: string, airDateTime?: string, now: Date = new Date()): boolean {
  if (airDateTime) {
    const airedAt = new Date(airDateTime);
    if (!Number.isNaN(airedAt.getTime())) {
      return airedAt.getTime() <= now.getTime();
    }
  }

  return airDate <= toLocalDateKey(now);
}

export function weekContainsDate(weekStart: Date, date: Date): boolean {
  const key = toLocalDateKey(date);
  const startKey = toLocalDateKey(weekStart);
  const endKey = toLocalDateKey(addDays(weekStart, 6));
  return key >= startKey && key <= endKey;
}

export function buildWeekDays(weekStart: Date): Date[] {
  return Array.from({ length: 7 }, (_, index) => addDays(weekStart, index));
}

export function formatAirTime(dateTime?: string): string | undefined {
  if (!dateTime) {
    return undefined;
  }

  const date = new Date(dateTime);
  if (Number.isNaN(date.getTime())) {
    return undefined;
  }

  return formatTime(date);
}
