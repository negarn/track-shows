import { beforeEach, describe, expect, test, vi } from "vitest";
import { getInitialActiveView, getInitialWeekStart, syncUrlToState } from "./App";

describe("App URL helpers", () => {
  beforeEach(() => {
    window.history.pushState({}, "", "/");
  });

  test("reads the initial active view from the query string", () => {
    window.history.pushState({}, "", "/?view=watchlist");
    expect(getInitialActiveView()).toBe("watchlist");

    window.history.pushState({}, "", "/?view=settings");
    expect(getInitialActiveView()).toBe("settings");

    window.history.pushState({}, "", "/");
    expect(getInitialActiveView()).toBe("calendar");
  });

  test("normalizes the initial week start to Monday", () => {
    window.history.pushState({}, "", "/?weekStart=2024-01-03");

    const weekStart = getInitialWeekStart();

    expect(weekStart.getFullYear()).toBe(2024);
    expect(weekStart.getMonth()).toBe(0);
    expect(weekStart.getDate()).toBe(1);
  });

  test("writes view and week start into history", () => {
    const replaceStateSpy = vi.spyOn(window.history, "replaceState");
    window.history.pushState({}, "", "/?weekStart=2024-01-01");

    syncUrlToState("watchlist", new Date(2024, 0, 8));
    expect(String(replaceStateSpy.mock.calls.at(-1)?.[2])).toContain("view=watchlist");
    expect(String(replaceStateSpy.mock.calls.at(-1)?.[2])).toContain("weekStart=2024-01-08");

    syncUrlToState("calendar", new Date(2024, 0, 8));
    expect(String(replaceStateSpy.mock.calls.at(-1)?.[2])).not.toContain("view=");
    expect(String(replaceStateSpy.mock.calls.at(-1)?.[2])).toContain("weekStart=2024-01-08");
  });
});
