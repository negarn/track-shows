import type { CloudSyncProvider } from "./cloudSyncData";

export const cloudSyncApiPaths = {
  disconnect: "/api/cloud-sync/disconnect",
  status: "/api/cloud-sync",
  sync: "/api/cloud-sync/sync",
  trackShows: "/api/track-shows"
} as const;

export function getCloudSyncAuthorizePath(provider: CloudSyncProvider) {
  return `/api/cloud-sync/${provider}/authorize`;
}

export function getCloudSyncCallbackPath(provider: CloudSyncProvider) {
  return `/api/cloud-sync/${provider}/callback`;
}
