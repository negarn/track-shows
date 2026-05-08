import type { IncomingMessage, ServerResponse } from "node:http";
import { beforeEach, describe, expect, test, vi } from "vitest";

const cloudSyncManagerMock = {
  ensureReady: vi.fn(async () => undefined),
  getSnapshot: vi.fn(async () => ({ trackedShows: [] })),
  handleRequest: vi.fn(async () => false),
  scheduleSync: vi.fn(),
  setSnapshot: vi.fn(async () => undefined),
  getStatus: vi.fn(async () => ({ cloudSync: null })),
  withSyncSuppressed: vi.fn((action: () => Promise<unknown>) => action())
};

vi.mock("./cloudSync", () => ({
  createCloudSyncManager: vi.fn(() => cloudSyncManagerMock)
}));

import { trackShowsApi } from "./trackShowsApi";

function createRequest(overrides: Partial<IncomingMessage> = {}) {
  return {
    headers: {},
    method: "GET",
    socket: {},
    url: "/api/track-shows",
    ...overrides
  } as IncomingMessage;
}

function createResponse() {
  let body = "";
  const headers: Record<string, string> = {};
  const response = {
    statusCode: 200,
    end(nextBody: string) {
      body = nextBody;
    },
    setHeader(name: string, value: string) {
      headers[name] = value;
    }
  } as ServerResponse;

  return {
    bodyRef: () => body,
    headers,
    response
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.unstubAllEnvs();
});

describe("trackShowsApi", () => {
  test("rejects untrusted API requests", async () => {
    const plugin = trackShowsApi();
    let middleware: ((request: IncomingMessage, response: ServerResponse, next: () => void) => void) | null = null;

    plugin.configureServer({
      middlewares: {
        use(handler) {
          middleware = handler;
        }
      }
    } as never);

    expect(middleware).not.toBeNull();

    const request = createRequest({
      headers: {
        host: "example.com"
      },
      method: "POST",
      socket: {
        remoteAddress: "203.0.113.10"
      }
    });
    const { bodyRef, response } = createResponse();

    await new Promise<void>((resolve) => {
      const originalEnd = response.end.bind(response);
      response.end = ((nextBody: string) => {
        originalEnd(nextBody);
        resolve();
      }) as typeof response.end;

      middleware?.(request, response, () => resolve());
    });

    expect(response.statusCode).toBe(403);
    expect(bodyRef()).toContain("localhost");
    expect(cloudSyncManagerMock.ensureReady).not.toHaveBeenCalled();
  });
});
