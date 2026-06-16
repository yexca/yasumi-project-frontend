import { createContext, useCallback, useContext, useMemo, useState } from "react";
import type { PropsWithChildren } from "react";

import type {
  ChangePasswordRequestDto,
  AuthResponseDto,
  LoginRequestDto,
  RegisterRequestDto,
  UpdateProfileRequestDto,
  AccountUserDto,
} from "@/repositories/direct-api/dtos";

import {
  clearStoredSession,
  persistSession,
  readStoredSession,
  type StoredAuthSession,
} from "./authStorage";
import { getOnlineState, useOnlineState } from "./useOnlineState";
import { shouldRefresh, useSessionRefresh } from "./useSessionRefresh";

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

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: PropsWithChildren) {
  const [initialSession] = useState(readStoredSession);
  const [session, setSession] = useState<StoredAuthSession | null>(initialSession);
  const [errorCode, setErrorCode] = useState<string | null>(null);
  const isOffline = useOnlineState();

  const commitAuthResponse = useCallback((response: AuthResponseDto) => {
    const nextSession: StoredAuthSession = {
      accessToken: response.session.access_token,
      expiresAt: response.session.expires_at,
      refreshToken: response.session.refresh_token,
      user: response.user,
    };

    persistSession(nextSession);
    setSession(nextSession);
    setErrorCode(null);
  }, []);

  const refreshStatus = useSessionRefresh({
    commitAuthResponse,
    isOffline,
    session,
    setErrorCode,
    setSession,
  });

  const login = useCallback(
    async (input: LoginRequestDto) => {
      const { loginWithPassword } = await import("./authApi");
      commitAuthResponse(await loginWithPassword(input));
    },
    [commitAuthResponse],
  );

  const register = useCallback(
    async (input: RegisterRequestDto) => {
      const { registerAccount } = await import("./authApi");
      commitAuthResponse(await registerAccount(input));
    },
    [commitAuthResponse],
  );

  const updateProfileAction = useCallback(
    async (input: UpdateProfileRequestDto) => {
      if (!session) {
        throw new Error("profile_update_requires_session");
      }

      const { updateProfile } = await import("./authApi");
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

      const { changePassword } = await import("./authApi");
      await changePassword(session.accessToken, input);
      setErrorCode(null);
    },
    [session],
  );

  const logout = useCallback(async () => {
    const accessToken = session?.accessToken;
    clearStoredSession();
    setSession(null);
    setErrorCode(null);

    if (accessToken && getOnlineState()) {
      const { logoutSession } = await import("./authApi");
      await logoutSession(accessToken).catch(() => undefined);
    }
  }, [session?.accessToken]);

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
