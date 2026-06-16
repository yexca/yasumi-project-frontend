import { useEffect, useState } from "react";

import type { AuthResponseDto } from "@/repositories/direct-api/dtos";
import { getDirectApiErrorCode } from "@/repositories/direct-api/errorGuards";

import { clearStoredSession, type StoredAuthSession } from "./authStorage";
import { getOnlineState } from "./useOnlineState";

const REFRESH_SKEW_MS = 60_000;

type RefreshStatus = "checking" | "ready" | "blocked";

type UseSessionRefreshInput = {
  commitAuthResponse: (response: AuthResponseDto) => void;
  isOffline: boolean;
  session: StoredAuthSession | null;
  setErrorCode: (errorCode: string | null) => void;
  setSession: (session: StoredAuthSession | null) => void;
};

export function useSessionRefresh({
  commitAuthResponse,
  isOffline,
  session,
  setErrorCode,
  setSession,
}: UseSessionRefreshInput): RefreshStatus {
  const [refreshStatus, setRefreshStatus] = useState<RefreshStatus>(() =>
    shouldAttemptInitialRefresh(session) ? "checking" : "ready",
  );

  useEffect(() => {
    if (session === null) {
      return;
    }

    if (!shouldRefresh(session)) {
      return;
    }

    if (isOffline) {
      return;
    }

    let isActive = true;
    const refreshToken = session.refreshToken;

    async function refreshActiveSession() {
      const { refreshSession } = await import("./authApi");

      return refreshSession(refreshToken);
    }

    refreshActiveSession()
      .then((response) => {
        if (isActive) {
          commitAuthResponse(response);
          setRefreshStatus("ready");
        }
      })
      .catch((error: unknown) => {
        if (!isActive) {
          return;
        }

        const apiErrorCode = getDirectApiErrorCode(error);

        if (apiErrorCode !== null) {
          setErrorCode(apiErrorCode);
          clearStoredSession();
          setSession(null);
          setRefreshStatus("ready");
          return;
        }

        setRefreshStatus("ready");
        setErrorCode("service_unavailable");
      });

    return () => {
      isActive = false;
    };
  }, [commitAuthResponse, isOffline, session, setErrorCode, setSession]);

  if (session === null || !shouldRefresh(session)) {
    return "ready";
  }

  return refreshStatus;
}

export function shouldRefresh(session: StoredAuthSession): boolean {
  return new Date(session.expiresAt).getTime() - Date.now() <= REFRESH_SKEW_MS;
}

function shouldAttemptInitialRefresh(session: StoredAuthSession | null): boolean {
  return session !== null && shouldRefresh(session) && getOnlineState();
}
