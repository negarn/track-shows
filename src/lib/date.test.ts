import { describe, expect, test } from "vitest";
import { addDays, formatFullDate, isEpisodeAired, startOfWeekMonday, weekContainsDate } from "./date";

function expectLocalDate(date: Date, year: number, month: number, day: number): void {
  expect(date.getFullYear()).toBe(year);
  expect(date.getMonth()).toBe(month);
  expect(date.getDate()).toBe(day);
}

describe("date helpers", () => {
  test("startOfWeekMonday returns the Monday of the same week", () => {
    const input = new Date(2024, 4, 9, 15, 30);

    expectLocalDate(startOfWeekMonday(input), 2024, 4, 6);
    expectLocalDate(input, 2024, 4, 9);
  });

  test("addDays leaves the source date untouched", () => {
    const input = new Date(2024, 0, 1);
    const next = addDays(input, 6);

    expectLocalDate(input, 2024, 0, 1);
    expectLocalDate(next, 2024, 0, 7);
  });

  test("weekContainsDate checks the full Monday-to-Sunday range", () => {
    const weekStart = new Date(2024, 0, 1);

    expect(weekContainsDate(weekStart, new Date(2024, 0, 1))).toBe(true);
    expect(weekContainsDate(weekStart, new Date(2024, 0, 7))).toBe(true);
    expect(weekContainsDate(weekStart, new Date(2024, 0, 8))).toBe(false);
  });

  test("isEpisodeAired prefers airDateTime and falls back to airDate", () => {
    const now = new Date("2024-01-10T12:00:00.000Z");

    expect(isEpisodeAired("2024-01-10", "2024-01-10T08:00:00.000Z", now)).toBe(true);
    expect(isEpisodeAired("2024-01-10", "2024-01-10T20:00:00.000Z", now)).toBe(false);
    expect(isEpisodeAired("2024-01-09", "not-a-date", now)).toBe(true);
  });

  test("formatFullDate uses the expected month day year layout", () => {
    expect(formatFullDate(new Date(2024, 0, 2))).toBe("January 2, 2024");
  });
});
