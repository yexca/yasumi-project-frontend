import { useMemo } from "react";

import type { UserSettingsDefaults } from "@/domain/settings/defaults";
import { buildDefaultUserSettings } from "@/domain/settings/defaults";
import type { DateOnly } from "@/domain/time/dateOnly";
import type {
  AreaDto,
  LocalItemRow,
  MinimalOperationHistoryRow,
  RecurringTaskTemplateDto,
} from "@/domain/items/schemas";
import { normalizeItemRow } from "@/domain/items/schemas";

export type PlanningData = {
  areas: AreaDto[];
  items: LocalItemRow[];
  operationHistory: MinimalOperationHistoryRow[];
  recurringTemplates: RecurringTaskTemplateDto[];
  settings: UserSettingsDefaults;
  today: DateOnly;
};

const USER_ID = "fixture-user";
const DEVICE_ID = "fixture-device";
const TODAY: DateOnly = "2026-06-14";

const syncMetadata = {
  user_id: USER_ID,
  created_at: "2026-06-01T08:00:00Z",
  updated_at: "2026-06-14T08:00:00Z",
  deleted_at: null,
  archived_at: null,
  hidden_reason: null,
  client_updated_at: "2026-06-14T08:00:00Z",
  server_updated_at: "2026-06-14T08:00:00Z",
  created_by_device_id: DEVICE_ID,
  updated_by_device_id: DEVICE_ID,
  revision: 1,
} as const;

const rawItems = [
  {
    id: "item-carried",
    ...syncMetadata,
    item_type: "date_task",
    title: "Review launch checklist",
    note: "Carry forward the remaining release notes.",
    status: "active",
    area_id: "area-work",
    scheduled_date: TODAY,
    scheduled_time_zone_mode: "floating",
    estimated_effort: 2,
    importance: 4,
  },
  {
    id: "item-today",
    ...syncMetadata,
    created_at: "2026-06-02T08:00:00Z",
    item_type: "date_task",
    title: "Draft roadmap update",
    note: null,
    status: "active",
    area_id: "area-work",
    scheduled_date: TODAY,
    scheduled_time_zone_mode: "floating",
    estimated_effort: 3,
    importance: 3,
  },
  {
    id: "item-deadline-primary",
    ...syncMetadata,
    created_at: "2026-06-03T08:00:00Z",
    item_type: "deadline_task",
    title: "Send renewal decision",
    note: "Confirm owner before the deadline.",
    status: "active",
    area_id: "area-home",
    planned_work_date: TODAY,
    deadline_date: "2026-06-16",
    deadline_time_zone_mode: "date_only",
    estimated_effort: 1,
    importance: 5,
  },
  {
    id: "item-deadline-soon",
    ...syncMetadata,
    created_at: "2026-06-04T08:00:00Z",
    item_type: "deadline_task",
    title: "Prepare workshop outline",
    note: null,
    status: "active",
    area_id: "area-work",
    deadline_date: "2026-06-22",
    deadline_time_zone_mode: "date_only",
    estimated_effort: 2,
    importance: 3,
  },
  {
    id: "item-upcoming",
    ...syncMetadata,
    created_at: "2026-06-05T08:00:00Z",
    item_type: "date_task",
    title: "Book quiet planning block",
    note: null,
    status: "active",
    area_id: "area-home",
    scheduled_date: "2026-06-18",
    scheduled_time_zone_mode: "floating",
    estimated_effort: 2,
    importance: 2,
  },
  {
    id: "item-idea",
    ...syncMetadata,
    created_at: "2026-06-06T08:00:00Z",
    item_type: "idea",
    title: "Try a weekly reset ritual",
    note: "Keep it short and repeatable.",
    status: "active",
    area_id: null,
    review_date: TODAY,
    estimated_effort: 1,
    importance: 2,
  },
  {
    id: "item-idea-later",
    ...syncMetadata,
    created_at: "2026-06-07T08:00:00Z",
    item_type: "idea",
    title: "Collect examples for a calmer dashboard",
    note: null,
    status: "active",
    area_id: "area-work",
    review_date: "2026-06-28",
    estimated_effort: 1,
    importance: 1,
  },
  {
    id: "item-inbox",
    ...syncMetadata,
    created_at: "2026-06-13T12:00:00Z",
    item_type: "inbox",
    title: "Ask Mei about the invoice date",
    note: null,
    status: "active",
    area_id: null,
    quick_add_source_text: "Ask Mei about the invoice date tomorrow",
    quick_add_parse_result: {
      confidence: "medium",
      recognized_fragments: ["tomorrow"],
    },
  },
  {
    id: "item-completed",
    ...syncMetadata,
    created_at: "2026-06-01T07:00:00Z",
    updated_at: "2026-06-13T18:00:00Z",
    item_type: "date_task",
    title: "Clean up old capture notes",
    note: null,
    status: "completed",
    area_id: "area-home",
    scheduled_date: "2026-06-12",
    scheduled_time_zone_mode: "floating",
  },
  {
    id: "item-archived",
    ...syncMetadata,
    updated_at: "2026-06-12T18:00:00Z",
    archived_at: "2026-06-12T18:00:00Z",
    item_type: "deadline_task",
    title: "Retired vendor comparison",
    note: null,
    status: "active",
    area_id: null,
    deadline_date: "2026-06-20",
    deadline_time_zone_mode: "date_only",
  },
  {
    id: "item-abandoned",
    ...syncMetadata,
    updated_at: "2026-06-11T18:00:00Z",
    item_type: "idea",
    title: "Old conference topic",
    note: null,
    status: "abandoned",
    area_id: null,
    review_date: "2026-06-01",
  },
] as const;

const areas: AreaDto[] = [
  {
    id: "area-work",
    ...syncMetadata,
    name: "Work",
    sort_order: 10,
  },
  {
    id: "area-home",
    ...syncMetadata,
    name: "Home",
    sort_order: 20,
  },
];

const recurringTemplates: RecurringTaskTemplateDto[] = [
  {
    id: "template-weekly-review",
    ...syncMetadata,
    title: "Weekly review",
    note: "Generated as a short date task.",
    area_id: "area-work",
    frequency: "weekly",
    interval: 1,
    weekdays: ["sunday"],
    recurrence_basis: "scheduled_date",
    start_date: "2026-06-01",
    end_type: "never",
    end_date: null,
    end_after_count: null,
    completed_count: 2,
    next_sequence: 3,
    scheduled_time: null,
    reminder_rule: {},
    generated_task_defaults: {
      item_type: "date_task",
      estimated_effort: 1,
    },
    status: "active",
  },
  {
    id: "template-invoices",
    ...syncMetadata,
    title: "Monthly invoice check",
    note: null,
    area_id: "area-home",
    frequency: "monthly",
    interval: 1,
    weekdays: [],
    recurrence_basis: "deadline_date",
    start_date: "2026-05-30",
    end_type: "never",
    end_date: null,
    end_after_count: null,
    completed_count: 1,
    next_sequence: 2,
    scheduled_time: null,
    reminder_rule: {},
    generated_task_defaults: {
      item_type: "deadline_task",
      importance: 3,
    },
    status: "on_hold",
  },
];

const operationHistory: MinimalOperationHistoryRow[] = [
  {
    id: "op-carried",
    user_id: USER_ID,
    item_id: "item-carried",
    event_type: "activated_from_postponed",
    previous_value: {
      scheduled_date: TODAY,
      status: "postponed",
    },
    new_value: {
      status: "active",
    },
    reason: null,
    idempotency_key: "activate-postponed:item-carried:2026-06-14",
    created_at: "2026-06-14T00:10:00Z",
    created_by_device_id: DEVICE_ID,
  },
];

export function usePlanningData(): PlanningData {
  return useMemo(
    () => ({
      areas,
      items: rawItems.map((item) => normalizeItemRow(item)),
      operationHistory,
      recurringTemplates,
      settings: buildDefaultUserSettings("en", "Asia/Tokyo"),
      today: TODAY,
    }),
    [],
  );
}
