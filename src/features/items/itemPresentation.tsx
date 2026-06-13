import type { ReactNode } from "react";
import {
  ArchiveRestore,
  CalendarClock,
  CheckCircle2,
  Circle,
  CirclePause,
  FilePenLine,
  Inbox,
  Lightbulb,
  RotateCcw,
  Trash2,
  XCircle,
} from "lucide-react";

import type { BusinessStatus, ItemType, TodayReasonKey } from "@/domain/constants/shared";
import type { LocalItemRow } from "@/domain/items/schemas";

export type ItemActionId =
  | "abandon"
  | "archive"
  | "classify"
  | "complete"
  | "convert"
  | "delete"
  | "edit"
  | "hold"
  | "postpone"
  | "reopen"
  | "restore"
  | "review"
  | "setReviewDate";

export type ItemAction = {
  id: ItemActionId;
  labelKey: string;
};

export function getItemActions(item: LocalItemRow): ItemAction[] {
  if (item.deleted_at !== null || item.archived_at !== null) {
    return [
      { id: "restore", labelKey: "item.action.restore" },
      { id: "delete", labelKey: "item.action.delete" },
    ];
  }

  if (item.hidden_reason !== null) {
    return [{ id: "review", labelKey: "item.action.review" }];
  }

  if (item.status === "completed") {
    return [
      { id: "reopen", labelKey: "item.action.reopen" },
      { id: "archive", labelKey: "item.action.archive" },
    ];
  }

  if (item.status === "abandoned") {
    return [
      { id: "restore", labelKey: "item.action.restore" },
      { id: "delete", labelKey: "item.action.delete" },
    ];
  }

  if (item.status === "on_hold") {
    return [
      { id: "restore", labelKey: "item.action.restore" },
      { id: "abandon", labelKey: "item.action.abandon" },
      { id: "edit", labelKey: "item.action.edit" },
      { id: "delete", labelKey: "item.action.delete" },
    ];
  }

  if (item.status === "postponed") {
    return [
      { id: "restore", labelKey: "item.action.restore" },
      { id: "complete", labelKey: "item.action.complete" },
      { id: "hold", labelKey: "item.action.hold" },
      { id: "abandon", labelKey: "item.action.abandon" },
      { id: "edit", labelKey: "item.action.edit" },
      { id: "delete", labelKey: "item.action.delete" },
    ];
  }

  if (item.item_type === "inbox") {
    return [
      { id: "classify", labelKey: "item.action.classify" },
      { id: "edit", labelKey: "item.action.edit" },
      { id: "archive", labelKey: "item.action.archive" },
      { id: "delete", labelKey: "item.action.delete" },
    ];
  }

  if (item.item_type === "idea") {
    return [
      { id: "setReviewDate", labelKey: "item.action.setReviewDate" },
      { id: "convert", labelKey: "item.action.convert" },
      { id: "hold", labelKey: "item.action.hold" },
      { id: "abandon", labelKey: "item.action.abandon" },
      { id: "edit", labelKey: "item.action.edit" },
      { id: "delete", labelKey: "item.action.delete" },
    ];
  }

  return [
    { id: "complete", labelKey: "item.action.complete" },
    { id: "postpone", labelKey: "item.action.postpone" },
    { id: "hold", labelKey: "item.action.hold" },
    { id: "abandon", labelKey: "item.action.abandon" },
    { id: "edit", labelKey: "item.action.edit" },
    { id: "delete", labelKey: "item.action.delete" },
  ];
}

export function getPrimaryAction(item: LocalItemRow): ItemAction {
  return getItemActions(item)[0] ?? { id: "review", labelKey: "item.action.review" };
}

export function getPrimaryActionIcon(action: ItemActionId): ReactNode {
  switch (action) {
    case "classify":
    case "convert":
      return <Inbox aria-hidden="true" size={17} />;
    case "complete":
      return <CheckCircle2 aria-hidden="true" size={17} />;
    case "postpone":
    case "setReviewDate":
      return <CalendarClock aria-hidden="true" size={17} />;
    case "reopen":
    case "restore":
      return <RotateCcw aria-hidden="true" size={17} />;
    case "abandon":
      return <XCircle aria-hidden="true" size={17} />;
    case "archive":
      return <ArchiveRestore aria-hidden="true" size={17} />;
    case "hold":
      return <CirclePause aria-hidden="true" size={17} />;
    case "delete":
      return <Trash2 aria-hidden="true" size={17} />;
    case "edit":
    case "review":
      return <FilePenLine aria-hidden="true" size={17} />;
  }
}

export function getTypeMarker(itemType: ItemType): ReactNode {
  switch (itemType) {
    case "inbox":
      return <Inbox aria-hidden="true" size={17} />;
    case "date_task":
      return <Circle aria-hidden="true" size={17} />;
    case "deadline_task":
      return <CalendarClock aria-hidden="true" size={17} />;
    case "idea":
      return <Lightbulb aria-hidden="true" size={17} />;
  }
}

export function getStateKey(status: BusinessStatus): string | null {
  switch (status) {
    case "postponed":
      return "item.state.postponed";
    case "on_hold":
      return "item.state.onHold";
    case "abandoned":
      return "item.state.abandoned";
    case "completed":
      return "item.state.completed";
    case "active":
      return null;
  }
}

export function getItemDateLabel(item: LocalItemRow): string | null {
  if (item.item_type === "date_task") {
    return item.scheduled_date;
  }

  if (item.item_type === "deadline_task") {
    return item.planned_work_date ?? item.deadline_date;
  }

  if (item.item_type === "idea") {
    return item.review_date;
  }

  return item.created_at.slice(0, 10);
}

export function getDeadlineLabel(item: LocalItemRow): string | null {
  return item.item_type === "deadline_task" ? item.deadline_date : null;
}

export function reasonKeyToMessageKey(reason: TodayReasonKey): string {
  return `reason.${reason}`;
}
