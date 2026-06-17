import { useEffect, useMemo, useState } from "react";

import { useAuth } from "@/features/auth/AuthProvider";
import { useSyncUiState } from "@/features/planning/PlanningDataProvider";
import {
  usePowerSyncRuntime,
  useRuntimePowerSyncStatus,
} from "@/features/sync/PowerSyncRuntimeProvider";
import { useTranslation } from "@/i18n/I18nProvider";

export type ShellSyncStatus = {
  count: number;
  label: string;
  mode: string;
};

export function useSyncStatus(): ShellSyncStatus {
  const { status } = useAuth();
  const { t } = useTranslation();
  const syncState = useSyncUiState();
  const runtime = usePowerSyncRuntime();
  const powerSyncStatus = useRuntimePowerSyncStatus();
  const uploadQueueCount = useUploadQueueCount();
  const dataFlow = powerSyncStatus.dataFlowStatus;
  const pendingCount = uploadQueueCount ?? syncState.pendingCount;
  const rejectedCount = syncState.rejectedCount;
  const liveStatus = useMemo<ShellSyncStatus>(() => {
    if (status === "blocked" || runtime.lifecycleState === "auth_blocked") {
      return {
        count: rejectedCount || pendingCount,
        label: t("sync.authBlocked"),
        mode: "blocked",
      };
    }

    if (status === "signed_out" || runtime.lifecycleState === "signed_out") {
      return {
        count: 0,
        label: t("sync.placeholderDisconnected"),
        mode: "disconnected",
      };
    }

    if (runtime.lifecycleState === "error" || dataFlow.downloadError || dataFlow.uploadError) {
      return {
        count: rejectedCount || pendingCount,
        label: t("sync.failed"),
        mode: "failed",
      };
    }

    if (rejectedCount > 0) {
      return {
        count: rejectedCount,
        label: t("sync.validationRejected"),
        mode: "rejected",
      };
    }

    if (status === "offline") {
      return {
        count: pendingCount,
        label: t(pendingCount > 0 ? "sync.offlinePending" : "sync.offline"),
        mode: "offline",
      };
    }

    if (powerSyncStatus.connecting || runtime.lifecycleState === "connecting") {
      return {
        count: pendingCount,
        label: t("sync.connecting"),
        mode: "pending",
      };
    }

    if (!powerSyncStatus.connected) {
      return {
        count: pendingCount,
        label: t("sync.placeholderDisconnected"),
        mode: "disconnected",
      };
    }

    if (dataFlow.uploading) {
      return {
        count: pendingCount,
        label: t("sync.uploading"),
        mode: "uploading",
      };
    }

    if (!powerSyncStatus.hasSynced || dataFlow.downloading) {
      return {
        count: pendingCount,
        label: t("sync.downloading"),
        mode: "pending",
      };
    }

    if (pendingCount > 0) {
      return {
        count: pendingCount,
        label: t("sync.pending"),
        mode: "pending",
      };
    }

    return {
      count: 0,
      label: t("sync.synced"),
      mode: "synced",
    };
  }, [
    dataFlow.downloadError,
    dataFlow.downloading,
    dataFlow.uploadError,
    dataFlow.uploading,
    pendingCount,
    powerSyncStatus.connected,
    powerSyncStatus.connecting,
    powerSyncStatus.hasSynced,
    rejectedCount,
    runtime.lifecycleState,
    status,
    t,
  ]);

  return useStableSyncStatus(liveStatus);
}

function useUploadQueueCount(): number | null {
  const { database } = usePowerSyncRuntime();
  const [count, setCount] = useState<number | null>(null);

  useEffect(() => {
    let active = true;

    async function refresh() {
      if (typeof database.getUploadQueueStats !== "function") {
        if (active) {
          setCount(null);
        }
        return;
      }

      const stats = await database.getUploadQueueStats().catch(() => null);
      if (active) {
        setCount(stats?.count ?? null);
      }
    }

    void refresh();
    const timer = window.setInterval(() => {
      void refresh();
    }, 1_000);

    return () => {
      active = false;
      window.clearInterval(timer);
    };
  }, [database]);

  return count;
}

function useStableSyncStatus(status: ShellSyncStatus): ShellSyncStatus {
  const [stableStatus, setStableStatus] = useState(status);

  useEffect(() => {
    const shouldHold =
      stableStatus.mode === "uploading" &&
      status.mode === "synced" &&
      stableStatus.count === 0 &&
      status.count === 0;

    if (!shouldHold) {
      if (!isSameShellSyncStatus(stableStatus, status)) {
        setStableStatus(status);
      }
      return;
    }

    const timer = window.setTimeout(() => {
      setStableStatus(status);
    }, 2_000);

    return () => {
      window.clearTimeout(timer);
    };
  }, [stableStatus.count, stableStatus.mode, status]);

  return stableStatus;
}

function isSameShellSyncStatus(left: ShellSyncStatus, right: ShellSyncStatus): boolean {
  return left.count === right.count && left.label === right.label && left.mode === right.mode;
}
