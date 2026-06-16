import { useEffect, useState } from "react";

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

  if (dataFlow.uploading) {
    return {
      count: pendingCount,
      label: t("sync.uploading"),
      mode: "uploading",
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
