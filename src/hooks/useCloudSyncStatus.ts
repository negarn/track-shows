import { useEffect, useRef, useState } from "react";
import {
  cloudSyncProviderLabels,
  cloudSyncProviders,
  createDefaultCloudSyncStatus,
  type CloudSyncProvider,
  type CloudSyncStatus
} from "../helpers/cloudSyncData";
import { cloudSyncApiPaths, getCloudSyncAuthorizePath } from "../helpers/cloudSyncRoutes";

const CLOUD_SYNC_STATUS_POLL_INTERVAL_MS = 30_000;
const CLOUD_SYNC_CONNECT_POLL_INTERVAL_MS = 1_000;
const CLOUD_SYNC_POPUP_FEATURES =
  "popup=yes,width=560,height=760,menubar=no,toolbar=no,location=yes,status=yes";

interface UseCloudSyncStatusResult {
  connect: (provider: CloudSyncProvider) => Promise<boolean>;
  disconnect: () => Promise<boolean>;
  error: string | null;
  isLoading: boolean;
  isPending: boolean;
  pendingProvider: CloudSyncProvider | null;
  refreshStatus: () => Promise<CloudSyncStatus>;
  status: CloudSyncStatus;
  syncNow: () => Promise<boolean>;
}

function normalizeCloudSyncStatus(value: unknown): CloudSyncStatus {
  const defaults = createDefaultCloudSyncStatus();

  if (!value || typeof value !== "object") {
    return defaults;
  }

  const parsedValue = value as Partial<CloudSyncStatus>;
  const providerStatus = (parsedValue.providers ?? {}) as Partial<CloudSyncStatus["providers"]>;

  return {
    activeProvider:
      parsedValue.activeProvider && cloudSyncProviders.includes(parsedValue.activeProvider)
        ? parsedValue.activeProvider
        : null,
    isSyncing: Boolean(parsedValue.isSyncing),
    providers: {
      "google-drive": {
        ...defaults.providers["google-drive"],
        ...(providerStatus["google-drive"] ?? {})
      },
      dropbox: {
        ...defaults.providers.dropbox,
        ...(providerStatus.dropbox ?? {})
      }
    }
  };
}

async function fetchCloudSyncStatus(): Promise<CloudSyncStatus> {
  const response = await fetch(cloudSyncApiPaths.status);

  if (!response.ok) {
    throw new Error("Could not load cloud sync status.");
  }

  const parsedResponse = (await response.json()) as unknown;

  if (parsedResponse && typeof parsedResponse === "object" && "cloudSync" in parsedResponse) {
    return normalizeCloudSyncStatus((parsedResponse as { cloudSync?: unknown }).cloudSync);
  }

  return normalizeCloudSyncStatus(parsedResponse);
}

export function useCloudSyncStatus(): UseCloudSyncStatusResult {
  const [status, setStatus] = useState<CloudSyncStatus>(createDefaultCloudSyncStatus());
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isActionPending, setIsActionPending] = useState(false);
  const [pendingProvider, setPendingProvider] = useState<CloudSyncProvider | null>(null);
  const pendingPopupRef = useRef<Window | null>(null);
  const refreshTimerRef = useRef<number | null>(null);

  useEffect(() => {
    let isCurrent = true;

    async function loadStatus() {
      try {
        const nextStatus = await fetchCloudSyncStatus();

        if (!isCurrent) {
          return;
        }

        setStatus(nextStatus);
        setError(null);
      } catch (loadError) {
        if (!isCurrent) {
          return;
        }

        console.error(loadError);
        setError("Could not load cloud sync status.");
      } finally {
        if (isCurrent) {
          setIsLoading(false);
        }
      }
    }

    void loadStatus();

    return () => {
      isCurrent = false;
    };
  }, []);

  useEffect(() => {
    if (!status.activeProvider) {
      return undefined;
    }

    const timer = window.setInterval(() => {
      void refreshStatus();
    }, CLOUD_SYNC_STATUS_POLL_INTERVAL_MS);

    return () => {
      window.clearInterval(timer);
    };
  }, [status.activeProvider]);

  useEffect(() => {
    return () => {
      if (refreshTimerRef.current !== null) {
        window.clearInterval(refreshTimerRef.current);
      }

      pendingPopupRef.current?.close();
    };
  }, []);

  async function refreshStatus(): Promise<CloudSyncStatus> {
    try {
      const nextStatus = await fetchCloudSyncStatus();
      setStatus(nextStatus);
      setError(null);
      return nextStatus;
    } catch (refreshError) {
      console.error(refreshError);
      setError("Could not load cloud sync status.");
      return status;
    }
  }

  async function waitForConnection(provider: CloudSyncProvider): Promise<boolean> {
    const popupWindow = pendingPopupRef.current;

    if (!popupWindow) {
      return false;
    }

    return await new Promise<boolean>((resolve) => {
      refreshTimerRef.current = window.setInterval(async () => {
        if (popupWindow.closed) {
          if (refreshTimerRef.current !== null) {
            window.clearInterval(refreshTimerRef.current);
            refreshTimerRef.current = null;
          }

          setPendingProvider(null);
          const nextStatus = await refreshStatus();
          resolve(nextStatus.activeProvider === provider && nextStatus.providers[provider].isConnected);
          return;
        }

        const nextStatus = await refreshStatus();

        if (nextStatus.activeProvider === provider && nextStatus.providers[provider].isConnected) {
          if (refreshTimerRef.current !== null) {
            window.clearInterval(refreshTimerRef.current);
            refreshTimerRef.current = null;
          }

          popupWindow.close();
          setPendingProvider(null);
          resolve(true);
        }
      }, CLOUD_SYNC_CONNECT_POLL_INTERVAL_MS);
    });
  }

  async function connect(provider: CloudSyncProvider): Promise<boolean> {
    setError(null);

    if (!status.providers[provider].isConfigured) {
      setError(`${cloudSyncProviderLabels[provider]} sync is not configured yet.`);
      return false;
    }

    const popupWindow = window.open(
      getCloudSyncAuthorizePath(provider),
      "track-shows-cloud-sync",
      CLOUD_SYNC_POPUP_FEATURES
    );

    if (!popupWindow) {
      setError(`Could not open the ${cloudSyncProviderLabels[provider]} authorization window.`);
      return false;
    }

    pendingPopupRef.current = popupWindow;
    setPendingProvider(provider);

    const isConnected = await waitForConnection(provider);

    if (!isConnected) {
      setError(`Could not finish connecting to ${cloudSyncProviderLabels[provider]}.`);
    }

    await refreshStatus();
    return isConnected;
  }

  async function disconnect(): Promise<boolean> {
    setError(null);
    setIsActionPending(true);

    try {
      const response = await fetch(cloudSyncApiPaths.disconnect, {
        method: "POST"
      });

      if (!response.ok) {
        setError("Could not disconnect cloud sync.");
        return false;
      }

      await refreshStatus();
      return true;
    } finally {
      setIsActionPending(false);
    }
  }

  async function syncNow(): Promise<boolean> {
    setError(null);
    setIsActionPending(true);

    try {
      const response = await fetch(cloudSyncApiPaths.sync, {
        method: "POST"
      });

      if (!response.ok) {
        setError("Could not sync cloud data.");
        return false;
      }

      await refreshStatus();
      setError(null);
      return true;
    } finally {
      setIsActionPending(false);
    }
  }

  return {
    connect,
    disconnect,
    error,
    isLoading,
    isPending: Boolean(pendingProvider) || isActionPending || status.isSyncing,
    pendingProvider,
    refreshStatus,
    status,
    syncNow
  };
}
