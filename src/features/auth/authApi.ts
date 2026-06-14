import { directApiJson } from "@/repositories/direct-api/client";
import {
  parseProfileResponseDto,
  parseAuthResponseDto,
  type AuthResponseDto,
  type ChangePasswordRequestDto,
  type LoginRequestDto,
  type ProfileResponseDto,
  type RegisterRequestDto,
  type UpdateProfileRequestDto,
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

export function updateProfile(
  accessToken: string,
  input: UpdateProfileRequestDto,
): Promise<ProfileResponseDto> {
  return directApiJson("/profile", {
    accessToken,
    body: input,
    method: "POST",
    parse: parseProfileResponseDto,
  });
}

export async function changePassword(
  accessToken: string,
  input: ChangePasswordRequestDto,
): Promise<void> {
  await directApiJson("/profile/password", {
    accessToken,
    body: input,
    method: "POST",
    parse: () => undefined,
  });
}
