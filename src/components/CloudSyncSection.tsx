import {
  cloudSyncProviderLabels,
  cloudSyncProviders,
  type CloudSyncProvider,
  type CloudSyncProviderConnectionStatus,
  type CloudSyncStatus,
} from "../helpers/cloudSyncData";
import { useCloudSyncStatus } from "../hooks/useCloudSyncStatus";

function formatDateTime(value: string | null): string {
  if (!value) {
    return "Not synced yet";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Not synced yet";
  }

  return date.toLocaleString();
}

function getStatusPillClassName({
  isConnected,
  isConfigured,
  isSyncing,
}: {
  isConnected: boolean;
  isConfigured: boolean;
  isSyncing: boolean;
}): string {
  const baseClasses =
    "inline-flex w-fit items-center rounded-full border px-3 py-1 text-[0.72rem] font-semibold uppercase tracking-[0.14em]";

  if (isSyncing) {
    return `${baseClasses} border-ember-300/30 bg-ember-300/15 text-ember-100`;
  }

  if (isConnected) {
    return `${baseClasses} border-ocean-200/30 bg-ocean-300/10 text-ocean-100`;
  }

  if (isConfigured) {
    return `${baseClasses} border-white/10 bg-white/5 text-slate-300`;
  }

  return `${baseClasses} border-rose-300/20 bg-rose-400/10 text-rose-100`;
}

function getProviderDescription(provider: CloudSyncProvider): string {
  if (provider === "google-drive") {
    return "Stores a private copy in your Google Drive app data folder.";
  }

  return "Stores a private copy in Dropbox’s app folder.";
}

function getProviderConnectLabel(
  activeProvider: CloudSyncProvider | null,
  provider: CloudSyncProvider,
  providerLabel: string,
): string {
  if (activeProvider && activeProvider !== provider) {
    return `Switch to ${providerLabel}`;
  }

  return `Connect ${providerLabel}`;
}

function getProviderStatusLabel(
  isActive: boolean,
  isConfigured: boolean,
  isPending: boolean,
): string {
  if (isPending) {
    return "Connecting";
  }

  if (isActive) {
    return "Connected";
  }

  if (isConfigured) {
    return "Ready";
  }

  return "Needs setup";
}

function CloudProviderCard({
  activeProvider,
  connect,
  disconnect,
  isPending,
  pendingProvider,
  provider,
  syncNow,
  status,
}: {
  activeProvider: CloudSyncProvider | null;
  connect: (provider: CloudSyncProvider) => Promise<boolean>;
  disconnect: () => Promise<boolean>;
  isPending: boolean;
  pendingProvider: CloudSyncProvider | null;
  provider: CloudSyncProvider;
  syncNow: () => Promise<boolean>;
  status: CloudSyncProviderConnectionStatus;
}): JSX.Element {
  const providerLabel = cloudSyncProviderLabels[provider];
  const isActive = activeProvider === provider && status.isConnected;
  const isPendingConnection = isPending && pendingProvider === provider;

  return (
    <article className="grid gap-4 rounded-3xl border border-white/10 bg-white/[0.03] p-5">
      <div className="grid gap-2">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h3 className="text-lg font-semibold text-sand-50">{providerLabel}</h3>
          <span
            className={getStatusPillClassName({
              isConnected: status.isConnected,
              isConfigured: status.isConfigured,
              isSyncing: isPendingConnection,
            })}
          >
            {getProviderStatusLabel(isActive, status.isConfigured, isPendingConnection)}
          </span>
        </div>

        <p className="m-0 text-sm leading-6 text-slate-300">
          {getProviderDescription(provider)}
        </p>
      </div>

      <div className="grid gap-2.5 border-t border-white/10 pt-3">
        <p className="m-0 text-sm text-slate-400">
          Last synced: <span className="font-semibold text-sand-50">{formatDateTime(status.lastSyncedAt)}</span>
        </p>

        {status.lastError ? (
          <div className="rounded-2xl border border-rose-300/20 bg-rose-400/10 px-4 py-3 text-sm text-rose-100">
            {status.lastError}
          </div>
        ) : null}

        {!status.isConfigured ? (
          <p className="m-0 text-xs leading-5 text-slate-400">
            Add the Google Drive or Dropbox credentials in your environment before connecting.
          </p>
        ) : null}

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-end">
          {!isActive ? (
            <button
              type="button"
              className="inline-flex h-11 w-full cursor-pointer items-center justify-center rounded-full border border-white/10 bg-white/5 px-4 text-sm font-semibold text-sand-50 transition enabled:hover:border-ember-300/25 enabled:hover:bg-ember-300/10 disabled:cursor-default disabled:opacity-70 sm:w-auto sm:min-w-[11rem]"
              onClick={() => void connect(provider)}
              disabled={!status.isConfigured || isPending}
            >
              {pendingProvider === provider
                ? "Connecting..."
                : getProviderConnectLabel(activeProvider, provider, providerLabel)}
            </button>
          ) : null}

          {isActive ? (
            <>
              <button
                type="button"
                className="inline-flex h-11 w-full cursor-pointer items-center justify-center rounded-full border border-white/10 bg-white/5 px-4 text-sm font-semibold text-sand-50 transition enabled:hover:border-ember-300/25 enabled:hover:bg-ember-300/10 disabled:cursor-default disabled:opacity-70 sm:w-auto sm:min-w-[9.5rem]"
                onClick={() => void syncNow()}
                disabled={isPending}
              >
                {isPending && pendingProvider === null ? "Syncing..." : "Sync now"}
              </button>

              <button
                type="button"
                className="inline-flex h-11 w-full cursor-pointer items-center justify-center rounded-full border border-rose-300/20 bg-rose-400/10 px-4 text-sm font-semibold text-rose-100 transition enabled:hover:bg-rose-400/20 disabled:cursor-default disabled:opacity-70 sm:w-auto sm:min-w-[9.5rem]"
                onClick={() => void disconnect()}
                disabled={isPending}
              >
                Disconnect
              </button>
            </>
          ) : null}
        </div>
      </div>
    </article>
  );
}

export interface CloudSyncSectionViewProps {
  connect: (provider: CloudSyncProvider) => Promise<boolean>;
  disconnect: () => Promise<boolean>;
  error: string | null;
  isLoading: boolean;
  isPending: boolean;
  pendingProvider: CloudSyncProvider | null;
  status: CloudSyncStatus;
  syncNow: () => Promise<boolean>;
}

export function CloudSyncSectionView({
  connect,
  disconnect,
  error,
  isLoading,
  isPending,
  pendingProvider,
  status,
  syncNow,
}: CloudSyncSectionViewProps): JSX.Element {
  const cards = cloudSyncProviders.map((provider) => (
    <CloudProviderCard
      key={provider}
      activeProvider={status.activeProvider}
      connect={connect}
      disconnect={disconnect}
      isPending={isPending}
      pendingProvider={pendingProvider}
      provider={provider}
      syncNow={syncNow}
      status={status.providers[provider]}
    />
  ));

  return (
    <section className="grid gap-4">
      <div className="grid gap-2">
        <h2 className="text-xs font-semibold uppercase tracking-[0.45em] text-ember-200/75">
          Cloud sync
        </h2>
        <p className="text-sm leading-6 text-slate-300">
          Keep a private copy of your watchlist in Google Drive or Dropbox. The app always keeps a
          local copy in <code className="rounded bg-white/5 px-1.5 py-0.5 text-[0.9em]">~/.track-shows</code>.
        </p>
      </div>

      <div className="grid gap-4">
        {isLoading ? (
          <div className="grid gap-4 md:grid-cols-2" aria-hidden="true">
            {cloudSyncProviders.map((provider) => (
              <div
                key={provider}
                className="grid gap-3 rounded-3xl border border-white/10 bg-white/[0.03] p-5"
              >
                <span className="h-[1.4rem] w-[9rem] animate-pulse rounded-full bg-white/10" />
                <span className="h-[1rem] w-[100%] animate-pulse rounded-full bg-white/10" />
                <span className="h-[1rem] w-[82%] animate-pulse rounded-full bg-white/10" />
                <span className="mt-2 h-[2.75rem] w-full animate-pulse rounded-full bg-white/10" />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">{cards}</div>
        )}

        {error ? (
          <div className="rounded-3xl border border-rose-300/20 bg-rose-400/10 px-4 py-3 text-sm text-rose-100">
            {error}
          </div>
        ) : null}
      </div>
    </section>
  );
}

export function CloudSyncSection(): JSX.Element {
  const { connect, disconnect, error, isLoading, isPending, pendingProvider, status, syncNow } =
    useCloudSyncStatus();

  return (
    <CloudSyncSectionView
      connect={connect}
      disconnect={disconnect}
      error={error}
      isLoading={isLoading}
      isPending={isPending}
      pendingProvider={pendingProvider}
      status={status}
      syncNow={syncNow}
    />
  );
}
