import { ALLOWED_STATUS_TRANSITIONS, type BusinessStatus } from "@/domain/constants/shared";
import { invalidTransitionError, type ContractError } from "@/domain/errors";

export function canTransitionStatus(from: BusinessStatus, to: BusinessStatus): boolean {
  return ALLOWED_STATUS_TRANSITIONS.some(
    ([allowedFrom, allowedTo]) => allowedFrom === from && allowedTo === to,
  );
}

export function validateStatusTransition(
  from: BusinessStatus,
  to: BusinessStatus,
): { ok: true } | { ok: false; error: ContractError } {
  if (canTransitionStatus(from, to)) {
    return { ok: true };
  }

  return {
    ok: false,
    error: invalidTransitionError(),
  };
}
