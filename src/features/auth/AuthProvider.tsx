import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { PropsWithChildren } from "react";

import { DirectApiError } from "@/repositories/direct-api/client";
import type {
  AccountUserDto,
  ChangePasswordRequestDto,
  AuthResponseDto,
  LoginRequestDto,
  RegisterRequestDto,
  UpdateProfileRequestDto,
} from "@/repositories/direct-api/dtos";

import {
  changePassword,
  loginWithPassword,
  logoutSession,
  refreshSession,
  registerAccount,
  updateProfile,
} from "./authApi";

type StoredAuthSession = {
  accessToken: string;
  expiresAt: string;
  refreshToken: string;
  user: AccountUserDto;
};

type AuthStatus = "checking" | "signed_out" | "signed_in" | "offline" | "blocked";

type AuthContextValue = {
  errorCode: string | null;
  isOffline: boolean;
  changePassword: (input: ChangePasswordRequestDto) => Promise<void>;
  login: (input: LoginRequestDto) => Promise<void>;
  logout: () => Promise<void>;
  register: (input: RegisterRequestDto) => Promise<void>;
  session: StoredAuthSession | null;
  status: AuthStatus;
  updateProfile: (input: UpdateProfileRequestDto) => Promise<AccountUserDto>;
};

const AUTH_STORAGE_KEY = "yasumi:auth-session";
const REFRESH_SKEW_MS = 60_000;

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: PropsWithChildren) {
  const [session, setSession] = useState<StoredAuthSession | null>(readStoredSession);
  const [refreshStatus, setRefreshStatus] = useState<"checking" | "ready" | "blocked">(() =>
    shouldAttemptInitialRefresh(readStoredSession()) ? "checking" : "ready",
  );
  const [errorCode, setErrorCode] = useState<string | null>(null);
  const [isOffline, setIsOffline] = useState(() => getOnlineState() === false);

  const commitAuthResponse = useCallback((response: AuthResponseDto) => {
    const nextSession: StoredAuthSession = {
      accessToken: response.session.access_token,
      expiresAt: response.session.expires_at,
      refreshToken: response.session.refresh_token,
      user: response.user,
    };

    persistSession(nextSession);
    setSession(nextSession);
    setRefreshStatus("ready");
    setErrorCode(null);
  }, []);

  const login = useCallback(
    async (input: LoginRequestDto) => {
      commitAuthResponse(await loginWithPassword(input));
    },
    [commitAuthResponse],
  );

  const register = useCallback(
    async (input: RegisterRequestDto) => {
      commitAuthResponse(await registerAccount(input));
    },
    [commitAuthResponse],
  );

  const updateProfileAction = useCallback(
    async (input: UpdateProfileRequestDto) => {
      if (!session) {
        throw new Error("profile_update_requires_session");
      }

      const response = await updateProfile(session.accessToken, input);
      const nextSession = { ...session, user: response.user };

      persistSession(nextSession);
      setSession(nextSession);
      setErrorCode(null);

      return response.user;
    },
    [session],
  );

  const changePasswordAction = useCallback(
    async (input: ChangePasswordRequestDto) => {
      if (!session) {
        throw new Error("password_change_requires_session");
      }

      await changePassword(session.accessToken, input);
      setErrorCode(null);
    },
    [session],
  );

  const logout = useCallback(async () => {
    const accessToken = session?.accessToken;
    clearStoredSession();
    setSession(null);
    setRefreshStatus("ready");
    setErrorCode(null);

    if (accessToken && getOnlineState()) {
      await logoutSession(accessToken).catch(() => undefined);
    }
  }, [session?.accessToken]);

  useEffect(() => {
    function handleOnlineState() {
      setIsOffline(getOnlineState() === false);
    }

    window.addEventListener("online", handleOnlineState);
    window.addEventListener("offline", handleOnlineState);
    handleOnlineState();

    return () => {
      window.removeEventListener("online", handleOnlineState);
      window.removeEventListener("offline", handleOnlineState);
    };
  }, []);

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

    refreshSession(session.refreshToken)
      .then((response) => {
        if (isActive) {
          commitAuthResponse(response);
        }
      })
      .catch((error: unknown) => {
        if (!isActive) {
          return;
        }

        if (error instanceof DirectApiError) {
          setErrorCode(error.detail.code);
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
  }, [commitAuthResponse, isOffline, session]);

  const status: AuthStatus =
    session === null
      ? "signed_out"
      : shouldRefresh(session) && isOffline
        ? "blocked"
        : refreshStatus === "checking"
          ? "checking"
          : isOffline
            ? "offline"
            : "signed_in";

  const value = useMemo<AuthContextValue>(
    () => ({
      errorCode,
      changePassword: changePasswordAction,
      isOffline,
      login,
      logout,
      register,
      session,
      status,
      updateProfile: updateProfileAction,
    }),
    [
      changePasswordAction,
      errorCode,
      isOffline,
      login,
      logout,
      register,
      session,
      status,
      updateProfileAction,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const value = useContext(AuthContext);

  if (value === null) {
    throw new Error("useAuth must be used inside AuthProvider.");
  }

  return value;
}

function shouldRefresh(session: StoredAuthSession): boolean {
  return new Date(session.expiresAt).getTime() - Date.now() <= REFRESH_SKEW_MS;
}

function shouldAttemptInitialRefresh(session: StoredAuthSession | null): boolean {
  return session !== null && shouldRefresh(session) && getOnlineState();
}

function readStoredSession(): StoredAuthSession | null {
  if (typeof localStorage === "undefined") {
    return null;
  }

  const stored = localStorage.getItem(AUTH_STORAGE_KEY);

  if (!stored) {
    return null;
  }

  try {
    const parsed: unknown = JSON.parse(stored);

    if (
      typeof parsed === "object" &&
      parsed !== null &&
      "accessToken" in parsed &&
      "refreshToken" in parsed &&
      "expiresAt" in parsed &&
      "user" in parsed
    ) {
      return parsed as StoredAuthSession;
    }
  } catch {
    clearStoredSession();
  }

  return null;
}

function persistSession(session: StoredAuthSession): void {
  localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(session));
}

function clearStoredSession(): void {
  localStorage.removeItem(AUTH_STORAGE_KEY);
}

function getOnlineState(): boolean {
  return typeof navigator === "undefined" || !("onLine" in navigator) ? true : navigator.onLine;
}
