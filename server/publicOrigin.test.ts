import type { IncomingMessage } from "node:http";
import { afterEach, describe, expect, test, vi } from "vitest";
import {
  getConfiguredPublicOrigin,
  getConfiguredPublicOriginHostName,
  getRequestHostName,
  getRequestOriginHeader,
  isTrustedRequest
} from "./publicOrigin";

function createRequest(overrides: Partial<IncomingMessage> = {}) {
  return {
    headers: {},
    method: "GET",
    socket: {},
    ...overrides
  } as IncomingMessage;
}

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("publicOrigin", () => {
  test("normalizes the configured public origin", () => {
    vi.stubEnv("TRACK_SHOWS_PUBLIC_ORIGIN", "https://track-shows.example.com/");

    expect(getConfiguredPublicOrigin()).toBe("https://track-shows.example.com");
    expect(getConfiguredPublicOriginHostName()).toBe("track-shows.example.com");
  });

  test("parses request host and origin headers", () => {
    const request = createRequest({
      headers: {
        host: "[::1]:5173",
        origin: "https://track-shows.example.com"
      }
    });

    expect(getRequestHostName(request)).toBe("::1");
    expect(getRequestOriginHeader(request)).toBe("https://track-shows.example.com");
  });

  test("trusts localhost requests by default", () => {
    const request = createRequest({
      headers: {
        host: "127.0.0.1:5173"
      },
      method: "POST",
      socket: {
        remoteAddress: "127.0.0.1"
      }
    });

    expect(isTrustedRequest(request, "/api/track-shows")).toBe(true);
  });

  test("trusts a configured public origin", () => {
    vi.stubEnv("TRACK_SHOWS_PUBLIC_ORIGIN", "https://track-shows.example.com");

    const request = createRequest({
      headers: {
        host: "track-shows.example.com",
        origin: "https://track-shows.example.com"
      },
      method: "POST",
      socket: {
        remoteAddress: "203.0.113.10"
      }
    });

    expect(isTrustedRequest(request, "/api/track-shows")).toBe(true);
    expect(isTrustedRequest(request, "/api/cloud-sync/google-drive/callback")).toBe(true);
  });

  test("rejects cross-origin requests to the public origin", () => {
    vi.stubEnv("TRACK_SHOWS_PUBLIC_ORIGIN", "https://track-shows.example.com");

    const request = createRequest({
      headers: {
        host: "track-shows.example.com",
        origin: "https://evil.example.com"
      },
      method: "POST",
      socket: {
        remoteAddress: "203.0.113.10"
      }
    });

    expect(isTrustedRequest(request, "/api/track-shows")).toBe(false);
  });
});
