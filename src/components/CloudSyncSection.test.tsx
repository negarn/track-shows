import { render, screen, act, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, test, vi } from "vitest";
import { CloudSyncSection } from "./CloudSyncSection";
import { cloudSyncApiPaths } from "../helpers/cloudSyncRoutes";
import { createCloudSyncStatus } from "../test/testUtils";

function createMockResponse(body: unknown, ok = true): Response {
  return {
    ok,
    json: vi.fn().mockResolvedValue(body)
  } as unknown as Response;
}

describe("CloudSyncSection", () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    fetchMock.mockReset();
    vi.stubGlobal("fetch", fetchMock);
    window.history.pushState({}, "", "/");
  });

  test("connects, syncs, and disconnects a provider", async () => {
    const user = userEvent.setup();
    const initialStatus = createCloudSyncStatus({
      googleDrive: {
        isConfigured: true,
        isConnected: false,
        lastSyncedAt: null
      },
      dropbox: {
        isConfigured: false,
        isConnected: false,
        lastSyncedAt: null
      }
    });
    const connectedStatus = createCloudSyncStatus({
      activeProvider: "google-drive",
      googleDrive: {
        isConfigured: true,
        isConnected: true,
        lastSyncedAt: "2024-01-01T12:00:00.000Z"
      },
      dropbox: {
        isConfigured: false,
        isConnected: false,
        lastSyncedAt: null
      }
    });
    const syncedStatus = createCloudSyncStatus({
      activeProvider: "google-drive",
      googleDrive: {
        isConfigured: true,
        isConnected: true,
        lastSyncedAt: "2024-01-02T12:00:00.000Z"
      },
      dropbox: {
        isConfigured: false,
        isConnected: false,
        lastSyncedAt: null
      }
    });
    const disconnectedStatus = createCloudSyncStatus({
      googleDrive: {
        isConfigured: true,
        isConnected: false,
        lastSyncedAt: "2024-01-02T12:00:00.000Z"
      },
      dropbox: {
        isConfigured: false,
        isConnected: false,
        lastSyncedAt: null
      }
    });
    const popupWindow = {
      closed: false,
      close: vi.fn()
    } as unknown as Window;
    let statusCallCount = 0;

    fetchMock.mockImplementation(async (input, init) => {
      const url = String(input);
      const method = init?.method ?? "GET";

      if (url === cloudSyncApiPaths.status && method === "GET") {
        statusCallCount += 1;

        if (statusCallCount === 1) {
          return createMockResponse({ cloudSync: initialStatus });
        }

        if (statusCallCount === 2) {
          return createMockResponse({ cloudSync: connectedStatus });
        }

        if (statusCallCount === 3) {
          return createMockResponse({ cloudSync: connectedStatus });
        }

        if (statusCallCount === 4) {
          return createMockResponse({ cloudSync: syncedStatus });
        }

        return createMockResponse({ cloudSync: disconnectedStatus });
      }

      if (url === cloudSyncApiPaths.sync && method === "POST") {
        return createMockResponse({});
      }

      if (url === cloudSyncApiPaths.disconnect && method === "POST") {
        return createMockResponse({});
      }

      return createMockResponse({});
    });

    vi.spyOn(window, "open").mockReturnValue(popupWindow);

    render(<CloudSyncSection />);

    await act(async () => {
      await Promise.resolve();
    });

    await user.click(screen.getByRole("button", { name: "Connect Google Drive" }));
    expect(window.open).toHaveBeenCalledWith(
      "/api/cloud-sync/google-drive/authorize",
      "track-shows-cloud-sync",
      "popup=yes,width=560,height=760,menubar=no,toolbar=no,location=yes,status=yes"
    );

    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Sync now" })).toBeInTheDocument();
    }, { timeout: 3000 });

    expect(popupWindow.close).toHaveBeenCalled();
    expect(screen.getByRole("button", { name: "Sync now" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Disconnect" })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Sync now" }));
    await waitFor(() => {
      const googleDriveCard = screen.getByRole("heading", { name: "Google Drive" }).closest("article");

      expect(googleDriveCard).not.toBeNull();
      expect(within(googleDriveCard as HTMLElement).getByText(/Last synced:/)).not.toHaveTextContent(
        "Not synced yet"
      );
    });
    expect(fetchMock).toHaveBeenCalledWith(cloudSyncApiPaths.sync, {
      method: "POST"
    });

    await user.click(screen.getByRole("button", { name: "Disconnect" }));
    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Connect Google Drive" })).toBeInTheDocument();
    });
    expect(fetchMock).toHaveBeenCalledWith(cloudSyncApiPaths.disconnect, {
      method: "POST"
    });
  });

  test("shows an error when provider status cannot be loaded", async () => {
    fetchMock.mockRejectedValueOnce(new Error("Could not load cloud sync status."));

    render(<CloudSyncSection />);

    await waitFor(() => {
      expect(screen.getByText("Could not load cloud sync status.")).toBeInTheDocument();
    });
  });
});
