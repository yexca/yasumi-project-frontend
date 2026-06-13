import type { BusinessStatus, HiddenReason } from "@/domain/constants/shared";
import type { Instant } from "@/domain/time/dateOnly";

export type MetadataState = "deleted" | "archived" | "hidden" | BusinessStatus;

export type MetadataVisibilityInput = {
  status: BusinessStatus;
  deleted_at: Instant | null;
  archived_at: Instant | null;
  hidden_reason: HiddenReason | null;
};

export function classifyMetadataState(row: MetadataVisibilityInput): MetadataState {
  if (row.deleted_at !== null) {
    return "deleted";
  }

  if (row.archived_at !== null) {
    return "archived";
  }

  if (row.hidden_reason !== null) {
    return "hidden";
  }

  return row.status;
}

export function isVisibleInNormalPlanning(row: MetadataVisibilityInput): boolean {
  return classifyMetadataState(row) === "active";
}

export function isEligibleForPressureViews(row: MetadataVisibilityInput): boolean {
  return row.status === "active" && isVisibleInNormalPlanning(row);
}
