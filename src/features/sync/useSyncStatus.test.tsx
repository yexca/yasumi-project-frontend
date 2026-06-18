import { render, screen } from "@testing-library/react";
import { act } from "react";
import { describe, expect, it, vi } from "vitest";

import { useSyncStatus } from "./useSyncStatus";

const mocks = vi.hoisted(() => ({
  authStatus: "signed_in",
  powerSyncStatus: {
    connected: true,
    connecting: false,
    dataFlowStatus: {
      downloadError: false,
      downloading: false,
      uploadError: false,
      uploading: false,
    },
    hasSynced: true,
  },
  runtime: {
    database: {},
    lifecycleState: "connected",
  },
  syncState: {
    pendingCount: 0,
    rejectedCount: 0,
  },
}));

vi.mock("@/features/auth/AuthProvider", () => ({
  useAuth: () => ({
    status: mocks.authStatus,
  }),
}));

vi.mock("@/features/planning/PlanningDataProvider", () => ({
  useSyncUiState: () => ({
    labelKey: "sync.synced",
    mode: "synced",
    pendingCount: mocks.syncState.pendingCount,
    rejectedCount: mocks.syncState.rejectedCount,
  }),
}));

vi.mock("@/features/sync/PowerSyncRuntimeProvider", () => ({
  usePowerSyncRuntime: () => ({
    ...mocks.runtime,
  }),
  useRuntimePowerSyncStatus: () => mocks.powerSyncStatus,
}));

vi.mock("@/i18n/I18nProvider", () => ({
  useTranslation: () => ({
    t: (key: string) =>
      ({
        "sync.authBlocked": "Sync blocked",
        "sync.connecting": "Connecting sync",
        "sync.downloading": "Syncing changes",
        "sync.failed": "Sync will retry",
        "sync.offline": "Offline",
        "sync.offlinePending": "Offline, saved here",
        "sync.pending": "Saved on this device",
        "sync.placeholderDisconnected": "Local sync not connected",
        "sync.synced": "Synced",
        "sync.uploading": "Uploading changes",
        "sync.validationRejected": "Needs review",
      })[key] ?? key,
  }),
}));

function Probe() {
  const status = useSyncStatus();

  return <output data-testid="status">{`${status.mode}|${status.label}|${status.count}`}</output>;
}

describe("useSyncStatus", () => {
  it("keeps uploading visible briefly before showing synced", () => {
    vi.useFakeTimers();
    resetMocks();
    mocks.powerSyncStatus.dataFlowStatus.uploading = true;

    const { rerender } = render(<Probe />);

    expect(screen.getByTestId("status")).toHaveTextContent("uploading|Uploading changes|0");

    mocks.powerSyncStatus.dataFlowStatus.uploading = false;
    rerender(<Probe />);

    expect(screen.getByTestId("status")).toHaveTextContent("uploading|Uploading changes|0");

    act(() => {
      vi.advanceTimersByTime(1_999);
    });
    expect(screen.getByTestId("status")).toHaveTextContent("uploading|Uploading changes|0");

    act(() => {
      vi.advanceTimersByTime(1);
    });
    expect(screen.getByTestId("status")).toHaveTextContent("synced|Synced|0");

    vi.useRealTimers();
  });

  it("shows offline immediately instead of holding uploading", () => {
    vi.useFakeTimers();
    resetMocks();
    mocks.powerSyncStatus.dataFlowStatus.uploading = true;

    const { rerender } = render(<Probe />);

    expect(screen.getByTestId("status")).toHaveTextContent("uploading|Uploading changes|0");

    mocks.powerSyncStatus.dataFlowStatus.uploading = false;
    mocks.authStatus = "offline";
    rerender(<Probe />);

    expect(screen.getByTestId("status")).toHaveTextContent("offline|Offline|0");
    vi.useRealTimers();
  });
});

function resetMocks() {
  mocks.authStatus = "signed_in";
  mocks.runtime.lifecycleState = "connected";
  mocks.syncState.pendingCount = 0;
  mocks.syncState.rejectedCount = 0;
  mocks.powerSyncStatus.connected = true;
  mocks.powerSyncStatus.connecting = false;
  mocks.powerSyncStatus.hasSynced = true;
  mocks.powerSyncStatus.dataFlowStatus.downloadError = false;
  mocks.powerSyncStatus.dataFlowStatus.downloading = false;
  mocks.powerSyncStatus.dataFlowStatus.uploadError = false;
  mocks.powerSyncStatus.dataFlowStatus.uploading = false;
}
