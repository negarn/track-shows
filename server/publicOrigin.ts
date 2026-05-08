import type { IncomingMessage } from "node:http";

const LOOPBACK_HOST_NAMES = new Set(["127.0.0.1", "::1", "localhost"]);

function normalizeConfiguredOrigin(rawOrigin: string | undefined) {
  if (!rawOrigin) {
    return null;
  }

  try {
    const parsedOrigin = new URL(rawOrigin.trim());

    if (parsedOrigin.protocol !== "http:" && parsedOrigin.protocol !== "https:") {
      return null;
    }

    return parsedOrigin.origin;
  } catch {
    return null;
  }
}

export function getConfiguredPublicOrigin() {
  return normalizeConfiguredOrigin(process.env.TRACK_SHOWS_PUBLIC_ORIGIN);
}

export function getConfiguredPublicOriginHostName() {
  const configuredOrigin = getConfiguredPublicOrigin();

  if (!configuredOrigin) {
    return null;
  }

  return new URL(configuredOrigin).hostname.toLowerCase();
}

export function getRequestHostName(request: IncomingMessage) {
  const hostHeader = request.headers.host?.trim();

  if (!hostHeader) {
    return null;
  }

  if (hostHeader.startsWith("[")) {
    const closingBracketIndex = hostHeader.indexOf("]");

    if (closingBracketIndex <= 1) {
      return null;
    }

    return hostHeader.slice(1, closingBracketIndex).toLowerCase();
  }

  return hostHeader.split(":", 1)[0].toLowerCase();
}

export function isLoopbackRemoteAddress(remoteAddress: string | null | undefined) {
  if (!remoteAddress) {
    return false;
  }

  const normalizedRemoteAddress = remoteAddress.toLowerCase();

  return (
    LOOPBACK_HOST_NAMES.has(normalizedRemoteAddress) ||
    normalizedRemoteAddress === "::ffff:127.0.0.1"
  );
}

export function isTrustedLocalRequest(request: IncomingMessage) {
  const hostName = getRequestHostName(request);

  return (
    isLoopbackRemoteAddress(request.socket?.remoteAddress) &&
    Boolean(hostName && LOOPBACK_HOST_NAMES.has(hostName))
  );
}

export function getRequestOrigin(request: IncomingMessage) {
  const configuredOrigin = getConfiguredPublicOrigin();

  if (configuredOrigin) {
    return configuredOrigin;
  }

  const host = request.headers.host;
  const protocol = request.headers["x-forwarded-proto"]?.toString().split(",")[0] ?? "http";

  if (typeof host === "string" && host.length > 0) {
    return `${protocol}://${host}`;
  }

  return "http://127.0.0.1:5173";
}

export function getRequestOriginHeader(request: IncomingMessage) {
  const originHeader = request.headers.origin;

  if (typeof originHeader !== "string" || !originHeader.trim()) {
    return null;
  }

  try {
    return new URL(originHeader).origin;
  } catch {
    return null;
  }
}

export function isTrustedPublicOriginRequest(
  request: IncomingMessage,
  requestPath: string
) {
  const configuredPublicOrigin = getConfiguredPublicOrigin();
  const configuredPublicOriginHostName = getConfiguredPublicOriginHostName();

  if (!configuredPublicOrigin || !configuredPublicOriginHostName) {
    return false;
  }

  const hostName = getRequestHostName(request);

  if (hostName !== configuredPublicOriginHostName) {
    return false;
  }

  const isCloudSyncCallbackRoute = /^\/api\/cloud-sync\/(google-drive|dropbox)\/callback$/.test(
    requestPath
  );

  if (isCloudSyncCallbackRoute) {
    return true;
  }

  if (request.method && request.method !== "GET") {
    return getRequestOriginHeader(request) === configuredPublicOrigin;
  }

  return true;
}

export function isTrustedRequest(request: IncomingMessage, requestPath: string) {
  return isTrustedLocalRequest(request) || isTrustedPublicOriginRequest(request, requestPath);
}

export function getRequestAccessErrorMessage() {
  return getConfiguredPublicOrigin()
    ? "This API is only available from localhost or the configured public origin."
    : "This API is only available from localhost.";
}
