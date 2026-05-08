import { homedir } from "node:os";
import { resolve } from "node:path";
import type { IncomingMessage, ServerResponse } from "node:http";
import type { MiddlewareStack, Plugin } from "vite";
import {
  createEmptyTrackShowsAppDataSnapshot,
  normalizeTrackShowsAppDataSnapshot
} from "../src/helpers/cloudSyncData";
import { createCloudSyncManager } from "./cloudSync";
import {
  getRequestAccessErrorMessage,
  isTrustedRequest
} from "./publicOrigin";

const defaultTrackShowsDataRootDir = resolve(homedir(), ".track-shows");

function isRecordLike(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function parseJsonOrNull(value: string) {
  try {
    return JSON.parse(value) as unknown;
  } catch {
    return null;
  }
}

async function readRequestBody(request: IncomingMessage) {
  let requestBodyText = "";

  for await (const chunk of request) {
    requestBodyText += typeof chunk === "string" ? chunk : chunk.toString("utf8");
  }

  if (!requestBodyText) {
    return null;
  }

  return parseJsonOrNull(requestBodyText);
}

function sendJson(response: ServerResponse, statusCode: number, payload: unknown) {
  response.statusCode = statusCode;
  response.setHeader("Content-Type", "application/json; charset=utf-8");
  response.end(`${JSON.stringify(payload, null, 2)}\n`);
}

function parseTrackShowsSnapshot(value: unknown) {
  if (!isRecordLike(value)) {
    return createEmptyTrackShowsAppDataSnapshot();
  }

  if ("trackShows" in value) {
    return normalizeTrackShowsAppDataSnapshot((value as { trackShows?: unknown }).trackShows);
  }

  return normalizeTrackShowsAppDataSnapshot(value);
}

export function trackShowsApi() {
  const dataRootDir = process.env.TRACK_SHOWS_DATA_DIR
    ? resolve(process.env.TRACK_SHOWS_DATA_DIR)
    : defaultTrackShowsDataRootDir;

  const cloudSyncManager = createCloudSyncManager({
    dataRootDir,
    onError(error) {
      console.error(error);
    }
  });

  let readyPromise: Promise<void> | null = null;

  async function ensureReady() {
    if (!readyPromise) {
      readyPromise = cloudSyncManager.ensureReady();
    }

    await readyPromise;
  }

  async function handleRequest(
    request: IncomingMessage,
    response: ServerResponse,
    next: (error?: Error) => void
  ) {
    try {
      const requestPath = request.url ? request.url.split("?")[0] : "";

      if ((requestPath === "/api" || requestPath.startsWith("/api/")) && !isTrustedRequest(request, requestPath)) {
        sendJson(response, 403, { error: getRequestAccessErrorMessage() });
        return;
      }

      await ensureReady();

      if (request.method === "GET" && requestPath === "/api/track-shows") {
        sendJson(response, 200, { trackShows: await cloudSyncManager.getSnapshot() });
        return;
      }

      if (request.method === "PUT" && requestPath === "/api/track-shows") {
        const body = await readRequestBody(request);
        const snapshot = parseTrackShowsSnapshot(body);
        await cloudSyncManager.setSnapshot(snapshot);
        sendJson(response, 200, { trackShows: await cloudSyncManager.getSnapshot() });
        return;
      }

      if (await cloudSyncManager.handleRequest(request, response, next)) {
        return;
      }

      next();
    } catch (error) {
      console.error(error);
      sendJson(response, 500, { error: "Could not update tracked show data." });
    }
  }

  const install = (middlewares: MiddlewareStack) => {
    middlewares.use((request, response, next) => {
      void handleRequest(request, response, next);
    });
  };

  return {
    name: "track-shows-api",
    configureServer(server) {
      install(server.middlewares);
    },
    configurePreviewServer(server) {
      install(server.middlewares);
    }
  } satisfies Plugin;
}
