import type { ErrorCode } from "@/domain/constants/shared";

export function getDirectApiErrorCode(error: unknown): ErrorCode | null {
  if (typeof error !== "object" || error === null || !("detail" in error)) {
    return null;
  }

  const detail = (error as { detail?: unknown }).detail;

  if (typeof detail !== "object" || detail === null || !("code" in detail)) {
    return null;
  }

  const code = (detail as { code?: unknown }).code;

  return typeof code === "string" ? (code as ErrorCode) : null;
}
