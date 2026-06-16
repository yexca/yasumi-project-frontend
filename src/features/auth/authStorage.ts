import type { AccountUserDto } from "@/repositories/direct-api/dtos";

export type StoredAuthSession = {
  accessToken: string;
  expiresAt: string;
  refreshToken: string;
  user: AccountUserDto;
};

const AUTH_STORAGE_KEY = "yasumi:auth-session";

export function readStoredSession(): StoredAuthSession | null {
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

export function persistSession(session: StoredAuthSession): void {
  localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(session));
}

export function clearStoredSession(): void {
  localStorage.removeItem(AUTH_STORAGE_KEY);
}
