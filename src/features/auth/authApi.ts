import { directApiJson } from "@/repositories/direct-api/client";
import {
  parseAuthResponseDto,
  type AuthResponseDto,
  type LoginRequestDto,
  type RegisterRequestDto,
} from "@/repositories/direct-api/dtos";

export function loginWithPassword(input: LoginRequestDto): Promise<AuthResponseDto> {
  return directApiJson("/auth/login", {
    body: input,
    method: "POST",
    parse: parseAuthResponseDto,
  });
}

export function registerAccount(input: RegisterRequestDto): Promise<AuthResponseDto> {
  return directApiJson("/auth/register", {
    body: input,
    method: "POST",
    parse: parseAuthResponseDto,
  });
}

export function refreshSession(refreshToken: string): Promise<AuthResponseDto> {
  return directApiJson("/auth/refresh", {
    body: { refresh_token: refreshToken },
    method: "POST",
    parse: parseAuthResponseDto,
  });
}

export async function logoutSession(accessToken: string): Promise<void> {
  await directApiJson("/auth/logout", {
    accessToken,
    method: "POST",
    parse: () => undefined,
  });
}
