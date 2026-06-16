import { PowerSyncContext, useStatus as usePowerSyncStatus } from "@powersync/react";
import type { AbstractPowerSyncDatabase, SyncStatus } from "@powersync/web";
import { createContext, useContext, useEffect, useMemo, useState, type PropsWithChildren } from "react";

import { useAuth } from "@/features/auth/AuthProvider";
import { createYasumiPowerSyncConnector } from "@/repositories/powersync/connector";
import { getPowerSyncDatabase } from "@/repositories/powersync/client";

import { getSyncClientVersion } from "./clientVersion";
import { getOrCreateSyncDeviceId } from "./deviceIdentity";

export type PowerSyncLifecycleState =
  | "signed_out"
  | "auth_blocked"
  | "idle"
  | "connecting"
  | "connected"
  | "disconnected"
  | "error";

export type PowerSyncRuntimeContextValue = {
  clientVersion: string;
  database: AbstractPowerSyncDatabase;
  deviceId: string;
  lifecycleState: PowerSyncLifecycleState;
  lifecycleError: string | null;
  usesSyncedStore: boolean;
};

const PowerSyncRuntimeContext = createContext<PowerSyncRuntimeContextValue | null>(null);

type ConnectionAttemptState = {
  connectionKey: string | null;
  lifecycleError: string | null;
  lifecycleState: "connected" | "error";
};

export function PowerSyncRuntimeProvider({ children }: PropsWithChildren) {
  const { session, status } = useAuth();
  const [database] = useState(() => getPowerSyncDatabase());
  const [deviceId] = useState(getOrCreateSyncDeviceId);
  const [clientVersion] = useState(getSyncClientVersion);
  const [connectionAttempt, setConnectionAttempt] = useState<ConnectionAttemptState>({
    connectionKey: null,
    lifecycleError: null,
    lifecycleState: "connected",
  });

  useEffect(() => {
    let active = true;

    if (!session) {
      void database.disconnectAndClear().catch(() => undefined);
      return () => {
        active = false;
      };
    }

    if (status === "blocked") {
      return () => {
        active = false;
      };
    }

    if (status !== "signed_in") {
      return () => {
        active = false;
      };
    }

    const connector = createYasumiPowerSyncConnector({
      accessToken: session.accessToken,
      clientVersion,
      deviceId,
    });
    const connectionKey = buildConnectionKey(session.accessToken, clientVersion, deviceId);

    void database
      .connect(connector)
      .then(() => {
        if (active) {
          setConnectionAttempt({
            connectionKey,
            lifecycleError: null,
            lifecycleState: "connected",
          });
        }
      })
      .catch((error: unknown) => {
        if (!active) {
          return;
        }
        setConnectionAttempt({
          connectionKey,
          lifecycleError: error instanceof Error ? error.message : "powersync_connect_failed",
          lifecycleState: "error",
        });
      });

    return () => {
      active = false;
      void database.disconnect().catch(() => undefined);
    };
  }, [clientVersion, database, deviceId, session, status]);

  const lifecycleState: PowerSyncLifecycleState = !session
    ? "signed_out"
    : status === "blocked"
      ? "auth_blocked"
      : status === "signed_in"
        ? connectionAttempt.connectionKey === buildConnectionKey(session.accessToken, clientVersion, deviceId)
          ? connectionAttempt.lifecycleState
          : "connecting"
        : "idle";
  const lifecycleError = lifecycleState === "error" ? connectionAttempt.lifecycleError : null;

  const value = useMemo<PowerSyncRuntimeContextValue>(
    () => ({
      clientVersion,
      database,
      deviceId,
      lifecycleError,
      lifecycleState,
      usesSyncedStore: shouldUseSyncedStore(database),
    }),
    [clientVersion, database, deviceId, lifecycleError, lifecycleState],
  );

  return (
    <PowerSyncContext.Provider value={database}>
      <PowerSyncRuntimeContext.Provider value={value}>{children}</PowerSyncRuntimeContext.Provider>
    </PowerSyncContext.Provider>
  );
}

export function usePowerSyncRuntime(): PowerSyncRuntimeContextValue {
  const value = useContext(PowerSyncRuntimeContext);

  if (value === null) {
    throw new Error("usePowerSyncRuntime must be used inside PowerSyncRuntimeProvider.");
  }

  return value;
}

export function useOptionalPowerSyncRuntime(): PowerSyncRuntimeContextValue | null {
  return useContext(PowerSyncRuntimeContext);
}

export function useRuntimePowerSyncStatus(): SyncStatus {
  return usePowerSyncStatus();
}

function buildConnectionKey(accessToken: string, clientVersion: string, deviceId: string): string {
  return `${accessToken}:${clientVersion}:${deviceId}`;
}

function shouldUseSyncedStore(database: AbstractPowerSyncDatabase): boolean {
  if (import.meta.env.MODE !== "test") {
    return true;
  }

  return typeof (database as { customQuery?: unknown }).customQuery === "function";
}
