import type { ErrorCode, ErrorFieldKey } from "@/domain/constants/shared";

export type ContractError = {
  code: ErrorCode;
  fields: Partial<Record<ErrorFieldKey, string>>;
  retryable: boolean;
};

export function validationError(fields: ContractError["fields"]): ContractError {
  return {
    code: "validation_failed",
    fields,
    retryable: false,
  };
}

export function invalidTransitionError(): ContractError {
  return {
    code: "invalid_transition",
    fields: {
      status: "transition_not_allowed",
    },
    retryable: false,
  };
}
