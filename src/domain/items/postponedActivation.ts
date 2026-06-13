import { buildPostponedActivationIdempotencyKey } from "@/domain/idempotency";
import type { LocalItemRow } from "@/domain/items/schemas";
import { isOnOrBefore, type DateOnly } from "@/domain/time/dateOnly";
import { isVisibleInNormalPlanning } from "@/domain/visibility";

export type PostponedActivationPlan = {
  shouldWrite: true;
  updatedItem: Pick<LocalItemRow, "id" | "status">;
  operation_history: {
    event_type: "activated_from_postponed";
    item_id: string;
    previous_value: Record<string, unknown>;
    new_value: {
      status: "active";
    };
    idempotency_key: string;
  };
};

export type PostponedActivationResult =
  | PostponedActivationPlan
  | {
      shouldWrite: false;
      status: LocalItemRow["status"];
      operation_history: null;
    };

export function planDuePostponedActivation(
  item: LocalItemRow,
  activeAppDate: DateOnly,
): PostponedActivationResult {
  if (
    item.status !== "postponed" ||
    item.deleted_at !== null ||
    item.archived_at !== null ||
    item.hidden_reason !== null
  ) {
    return noActivation(item);
  }

  const triggeringField = getActivationTriggeringField(item, activeAppDate);

  if (triggeringField === null) {
    return noActivation(item);
  }

  return {
    shouldWrite: true,
    updatedItem: {
      id: item.id,
      status: "active",
    },
    operation_history: {
      event_type: "activated_from_postponed",
      item_id: item.id,
      previous_value: {
        status: "postponed",
        [triggeringField]: item[triggeringField],
      },
      new_value: {
        status: "active",
      },
      idempotency_key: buildPostponedActivationIdempotencyKey(item.user_id, item.id, activeAppDate),
    },
  };
}

export function isActiveAfterDuePostponedActivation(
  item: LocalItemRow,
  activeAppDate: DateOnly,
): boolean {
  return (
    isVisibleInNormalPlanning(item) || planDuePostponedActivation(item, activeAppDate).shouldWrite
  );
}

function getActivationTriggeringField(
  item: LocalItemRow,
  activeAppDate: DateOnly,
): "scheduled_date" | "planned_work_date" | null {
  if (item.item_type === "date_task" && isOnOrBefore(item.scheduled_date, activeAppDate)) {
    return "scheduled_date";
  }

  if (item.item_type === "deadline_task" && isOnOrBefore(item.planned_work_date, activeAppDate)) {
    return "planned_work_date";
  }

  return null;
}

function noActivation(item: LocalItemRow): PostponedActivationResult {
  return {
    shouldWrite: false,
    status: item.status,
    operation_history: null,
  };
}
