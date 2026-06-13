import type { ErrorCode, ErrorFieldKey } from "@/domain/constants/shared";
import type { ContractError } from "@/domain/errors";

type Translate = (key: string, values?: Record<string, string | number>) => string;

export function formatBackendError(error: ContractError, t: Translate): string {
  const fieldLabels = Object.keys(error.fields)
    .map((field) => t(`error.field.${field}`))
    .filter((label) => !label.startsWith("error.field."));
  const message = t(errorCodeMessageKey(error.code));

  return fieldLabels.length > 0 ? `${message} ${fieldLabels.join(", ")}` : message;
}

export function errorCodeMessageKey(code: ErrorCode): string {
  return `error.code.${code}`;
}

export function errorFieldMessageKey(field: ErrorFieldKey): string {
  return `error.field.${field}`;
}
