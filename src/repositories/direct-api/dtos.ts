import { z } from "zod";

import { ERROR_CODES } from "@/domain/constants/shared";
import { isInstant } from "@/domain/time/dateOnly";

const instantSchema = z.string().refine(isInstant);

export const accountUserDtoSchema = z.object({
  id: z.string().min(1),
  username: z.string().min(1),
  email: z.string().email(),
  display_name: z.string().nullable(),
});

export type AccountUserDto = z.infer<typeof accountUserDtoSchema>;

export const authSessionDtoSchema = z.object({
  authenticated: z.literal(true),
  access_token: z.string().min(1),
  refresh_token: z.string().min(1),
  expires_at: instantSchema,
});

export type AuthSessionDto = z.infer<typeof authSessionDtoSchema>;

export const authResponseDtoSchema = z.object({
  user: accountUserDtoSchema,
  session: authSessionDtoSchema,
});

export type AuthResponseDto = z.infer<typeof authResponseDtoSchema>;

export const registerRequestDtoSchema = z.object({
  username: z.string().trim().min(1),
  email: z.string().trim().email(),
  password: z.string().min(1),
  display_name: z.string().nullable().optional(),
});

export type RegisterRequestDto = z.infer<typeof registerRequestDtoSchema>;

export const loginRequestDtoSchema = z.object({
  identifier: z.string().trim().min(1),
  password: z.string().min(1),
});

export type LoginRequestDto = z.infer<typeof loginRequestDtoSchema>;

export const refreshRequestDtoSchema = z.object({
  refresh_token: z.string().min(1),
});

export type RefreshRequestDto = z.infer<typeof refreshRequestDtoSchema>;

export const apiErrorDtoSchema = z.object({
  code: z.enum(ERROR_CODES),
  message: z.string(),
  fields: z.record(z.string(), z.string()),
  retryable: z.boolean(),
});

export type ApiErrorDto = z.infer<typeof apiErrorDtoSchema>;

export function parseAuthResponseDto(input: unknown): AuthResponseDto {
  return authResponseDtoSchema.parse(input);
}

export function parseApiErrorDto(input: unknown): ApiErrorDto {
  return apiErrorDtoSchema.parse(input);
}
