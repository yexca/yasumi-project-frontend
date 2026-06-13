import type { DateOnly } from "@/domain/time/dateOnly";

export type RecurrenceActionType = "complete" | "skip";

export function buildActionIdempotencyKey(
  userId: string,
  deviceId: string,
  clientActionId: string,
): string {
  return `action:${userId}:${deviceId}:${clientActionId}`;
}

export function buildRecurrenceActionIdempotencyKey(
  userId: string,
  recurringTemplateId: string,
  recurringSequence: number,
  actionType: RecurrenceActionType,
): string {
  return `recurrence:${userId}:${recurringTemplateId}:${recurringSequence}:${actionType}`;
}

export function buildRecurrenceGenerationIdempotencyKey(
  userId: string,
  recurringTemplateId: string,
  nextSequence: number,
): string {
  return `recurrence:${userId}:${recurringTemplateId}:${nextSequence}:generate_next`;
}

export function buildPostponedActivationIdempotencyKey(
  userId: string,
  itemId: string,
  activationDate: DateOnly,
): string {
  return `postponed-activation:${userId}:${itemId}:${activationDate}`;
}
