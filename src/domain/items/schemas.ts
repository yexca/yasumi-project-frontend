import { z } from "zod";

import {
  BUSINESS_STATUSES,
  DEADLINE_TIME_ZONE_MODES,
  HIDDEN_REASONS,
  ITEM_TYPES,
  OPERATION_EVENT_TYPES,
  RECURRENCE_BASES,
  RECURRENCE_END_TYPES,
  RECURRENCE_FREQUENCIES,
  RECURRING_TEMPLATE_STATUSES,
  REMINDER_TIME_ZONE_MODES,
  SCHEDULED_TIME_ZONE_MODES,
  type BusinessStatus,
  type DeadlineTimeZoneMode,
  type HiddenReason,
  type ItemType,
  type OperationEventType,
  type ReminderTimeZoneMode,
  type ScheduledTimeZoneMode,
} from "@/domain/constants/shared";
import { validationError, type ContractError } from "@/domain/errors";
import { isDateOnly, isInstant, isLocalTime, type DateOnly } from "@/domain/time/dateOnly";

export type JsonObject = Record<string, unknown>;

const jsonObjectSchema = z.record(z.string(), z.unknown());
const idSchema = z.string().min(1);
const instantSchema = z.string().refine(isInstant);
const dateOnlySchema = z.string().refine(isDateOnly);
const localTimeSchema = z.string().refine(isLocalTime);

const nullableDateOnlySchema = dateOnlySchema.nullable();
const nullableLocalTimeSchema = localTimeSchema.nullable();
const nullableInstantSchema = instantSchema.nullable();

const syncMetadataSchema = z.object({
  id: idSchema,
  user_id: idSchema,
  created_at: instantSchema,
  updated_at: instantSchema,
  deleted_at: nullableInstantSchema,
  archived_at: nullableInstantSchema,
  hidden_reason: z.enum(HIDDEN_REASONS).nullable(),
  client_updated_at: instantSchema,
  server_updated_at: instantSchema,
  created_by_device_id: z.string().min(1),
  updated_by_device_id: z.string().min(1),
  revision: z.number().int().nonnegative(),
});

export type SyncMetadata = z.infer<typeof syncMetadataSchema>;

export const itemDtoSchema = syncMetadataSchema
  .extend({
    item_type: z.enum(ITEM_TYPES),
    title: z.string().trim().min(1),
    note: z.string().nullable(),
    status: z.enum(BUSINESS_STATUSES),
    area_id: idSchema.nullable(),
    scheduled_date: nullableDateOnlySchema,
    scheduled_time: nullableLocalTimeSchema,
    planned_work_date: nullableDateOnlySchema,
    deadline_date: nullableDateOnlySchema,
    deadline_time: nullableLocalTimeSchema,
    deadline_at: nullableInstantSchema,
    deadline_timezone: z.string().nullable(),
    review_date: nullableDateOnlySchema,
    reminder_date: nullableDateOnlySchema,
    reminder_time: nullableLocalTimeSchema,
    reminder_at: nullableInstantSchema,
    reminder_intent: z.string().nullable(),
    scheduled_time_zone_mode: z.enum(SCHEDULED_TIME_ZONE_MODES).nullable(),
    deadline_time_zone_mode: z.enum(DEADLINE_TIME_ZONE_MODES).nullable(),
    reminder_time_zone_mode: z.enum(REMINDER_TIME_ZONE_MODES).nullable(),
    recurring_template_id: idSchema.nullable(),
    recurring_sequence: z.number().int().positive().nullable(),
    recurring_anchor_date: nullableDateOnlySchema,
    generated_from_item_id: idSchema.nullable(),
    importance: z.number().int().min(1).max(5).nullable(),
    estimated_effort: z.number().int().min(1).max(5).nullable(),
    pressure_metadata: jsonObjectSchema,
    quick_add_source_text: z.string().nullable(),
    quick_add_parse_result: jsonObjectSchema.nullable(),
  })
  .superRefine((row, context) => {
    appendItemInvariantIssues(row, context);
  });

export type ItemDto = z.infer<typeof itemDtoSchema>;

const partialItemRowSchema = z
  .object({
    id: idSchema,
    user_id: idSchema,
    item_type: z.enum(ITEM_TYPES),
    title: z.string().trim().min(1),
    note: z.string().nullable().default(null),
    status: z.enum(BUSINESS_STATUSES),
    area_id: idSchema.nullable().default(null),
    scheduled_date: nullableDateOnlySchema.default(null),
    scheduled_time: nullableLocalTimeSchema.default(null),
    planned_work_date: nullableDateOnlySchema.default(null),
    deadline_date: nullableDateOnlySchema.default(null),
    deadline_time: nullableLocalTimeSchema.default(null),
    deadline_at: nullableInstantSchema.default(null),
    deadline_timezone: z.string().nullable().default(null),
    review_date: nullableDateOnlySchema.default(null),
    reminder_date: nullableDateOnlySchema.default(null),
    reminder_time: nullableLocalTimeSchema.default(null),
    reminder_at: nullableInstantSchema.default(null),
    reminder_intent: z.string().nullable().default(null),
    scheduled_time_zone_mode: z.enum(SCHEDULED_TIME_ZONE_MODES).nullable().default(null),
    deadline_time_zone_mode: z.enum(DEADLINE_TIME_ZONE_MODES).nullable().default(null),
    reminder_time_zone_mode: z.enum(REMINDER_TIME_ZONE_MODES).nullable().default(null),
    recurring_template_id: idSchema.nullable().default(null),
    recurring_sequence: z.number().int().positive().nullable().default(null),
    recurring_anchor_date: nullableDateOnlySchema.default(null),
    generated_from_item_id: idSchema.nullable().default(null),
    importance: z.number().int().min(1).max(5).nullable().default(null),
    estimated_effort: z.number().int().min(1).max(5).nullable().default(null),
    pressure_metadata: jsonObjectSchema.default({}),
    quick_add_source_text: z.string().nullable().default(null),
    quick_add_parse_result: jsonObjectSchema.nullable().default(null),
    created_at: instantSchema.default("1970-01-01T00:00:00Z"),
    updated_at: instantSchema.default("1970-01-01T00:00:00Z"),
    deleted_at: nullableInstantSchema.default(null),
    archived_at: nullableInstantSchema.default(null),
    hidden_reason: z.enum(HIDDEN_REASONS).nullable().default(null),
    client_updated_at: instantSchema.default("1970-01-01T00:00:00Z"),
    server_updated_at: instantSchema.default("1970-01-01T00:00:00Z"),
    created_by_device_id: z.string().min(1).default("fixture-device"),
    updated_by_device_id: z.string().min(1).default("fixture-device"),
    revision: z.number().int().nonnegative().default(0),
  })
  .superRefine((row, context) => {
    appendItemInvariantIssues(row, context);
  });

export type LocalItemRow = z.infer<typeof partialItemRowSchema>;

export type DeadlineAuthority =
  | "deadline_date"
  | "deadline_date_and_deadline_time"
  | "deadline_at"
  | null;

export function parseItemDto(input: unknown): ItemDto {
  return itemDtoSchema.parse(input);
}

export function normalizeItemRow(input: unknown): LocalItemRow {
  return partialItemRowSchema.parse(input);
}

export function safeNormalizeItemRow(
  input: unknown,
): { ok: true; row: LocalItemRow } | { ok: false; error: ContractError } {
  const result = partialItemRowSchema.safeParse(input);

  if (result.success) {
    return { ok: true, row: result.data };
  }

  return {
    ok: false,
    error: zodErrorToContractError(result.error),
  };
}

export function getDeadlineAuthority(
  row: Pick<LocalItemRow, "deadline_time_zone_mode">,
): DeadlineAuthority {
  if (row.deadline_time_zone_mode === "date_only") {
    return "deadline_date";
  }

  if (row.deadline_time_zone_mode === "floating") {
    return "deadline_date_and_deadline_time";
  }

  if (row.deadline_time_zone_mode === "fixed") {
    return "deadline_at";
  }

  return null;
}

export const recurringTaskTemplateDtoSchema = syncMetadataSchema.extend({
  title: z.string().trim().min(1),
  note: z.string().nullable(),
  area_id: idSchema.nullable(),
  frequency: z.enum(RECURRENCE_FREQUENCIES),
  interval: z.number().int().positive(),
  weekdays: z.array(z.string()),
  recurrence_basis: z.enum(RECURRENCE_BASES),
  start_date: dateOnlySchema,
  end_type: z.enum(RECURRENCE_END_TYPES),
  end_date: nullableDateOnlySchema,
  end_after_count: z.number().int().positive().nullable(),
  completed_count: z.number().int().nonnegative(),
  next_sequence: z.number().int().positive(),
  scheduled_time: nullableLocalTimeSchema,
  reminder_rule: jsonObjectSchema,
  generated_task_defaults: jsonObjectSchema,
  status: z.enum(RECURRING_TEMPLATE_STATUSES),
});

export type RecurringTaskTemplateDto = z.infer<typeof recurringTaskTemplateDtoSchema>;

export const areaDtoSchema = syncMetadataSchema.extend({
  name: z.string().trim().min(1),
  sort_order: z.number().int(),
});

export type AreaDto = z.infer<typeof areaDtoSchema>;

export const operationHistoryDtoSchema = z.object({
  id: idSchema,
  user_id: idSchema,
  item_id: idSchema.nullable(),
  recurring_template_id: idSchema.nullable(),
  event_type: z.enum(OPERATION_EVENT_TYPES),
  previous_value: jsonObjectSchema,
  new_value: jsonObjectSchema,
  reason: z.string().nullable(),
  idempotency_key: z.string().nullable(),
  created_at: instantSchema,
  created_by_device_id: z.string().min(1),
});

export type OperationHistoryDto = z.infer<typeof operationHistoryDtoSchema>;

export type MinimalOperationHistoryRow = {
  id: string;
  user_id: string;
  item_id: string | null;
  recurring_template_id?: string | null;
  event_type: OperationEventType;
  previous_value?: JsonObject;
  new_value?: JsonObject;
  reason?: string | null;
  idempotency_key?: string | null;
  created_at: string;
  created_by_device_id?: string;
};

export type ItemShapeInput = {
  id: string;
  user_id: string;
  item_type: ItemType;
  title: string;
  status: BusinessStatus;
  hidden_reason?: HiddenReason | null;
  scheduled_time_zone_mode?: ScheduledTimeZoneMode | null;
  deadline_time_zone_mode?: DeadlineTimeZoneMode | null;
  reminder_time_zone_mode?: ReminderTimeZoneMode | null;
  deadline_date?: DateOnly | null;
  deadline_time?: string | null;
  deadline_at?: string | null;
  scheduled_date?: DateOnly | null;
  review_date?: DateOnly | null;
};

function appendItemInvariantIssues(row: ItemShapeInput, context: z.RefinementCtx): void {
  if (row.item_type === "date_task" && row.scheduled_date === null) {
    context.addIssue({
      code: "custom",
      message: "required_for_date_task",
      path: ["scheduled_date"],
    });
  }

  if (row.item_type === "deadline_task") {
    appendDeadlineIssues(row, context);
  }

  if (row.item_type === "idea") {
    const hasDeadline =
      row.deadline_date !== null ||
      row.deadline_time !== null ||
      row.deadline_at !== null ||
      row.deadline_time_zone_mode !== null;

    if (hasDeadline) {
      context.addIssue({
        code: "custom",
        message: "idea_must_not_set_deadline_fields",
        path: ["deadline_date"],
      });
    }
  }
}

function appendDeadlineIssues(row: ItemShapeInput, context: z.RefinementCtx): void {
  if (row.deadline_time_zone_mode === null) {
    context.addIssue({
      code: "custom",
      message: "invalid_or_missing_deadline_mode",
      path: ["deadline_time_zone_mode"],
    });
    return;
  }

  if (row.deadline_time_zone_mode === "date_only") {
    if (row.deadline_date === null || row.deadline_time !== null || row.deadline_at !== null) {
      context.addIssue({
        code: "custom",
        message: "invalid_date_only_deadline",
        path: ["deadline_date"],
      });
    }
    return;
  }

  if (row.deadline_time_zone_mode === "floating") {
    if (row.deadline_date === null) {
      context.addIssue({
        code: "custom",
        message: "required_for_floating_deadline",
        path: ["deadline_date"],
      });
    }

    if (row.deadline_time === null) {
      context.addIssue({
        code: "custom",
        message: "required_for_floating_deadline",
        path: ["deadline_time"],
      });
    }
    return;
  }

  if (row.deadline_time_zone_mode === "fixed") {
    if (row.deadline_at === null) {
      context.addIssue({
        code: "custom",
        message: "required_for_fixed_deadline",
        path: ["deadline_at"],
      });
    }

    if (row.deadline_date !== null || row.deadline_time !== null) {
      for (const field of ["deadline_at", "deadline_date", "deadline_time"] as const) {
        context.addIssue({
          code: "custom",
          message: "fixed_deadline_must_not_mix_local_fields",
          path: [field],
        });
      }
    }
  }
}

function zodErrorToContractError(error: z.ZodError): ContractError {
  const fields: ContractError["fields"] = {};

  for (const issue of error.issues) {
    const [field] = issue.path;
    if (typeof field === "string") {
      fields[field as keyof ContractError["fields"]] = issue.message;
    }
  }

  return validationError(fields);
}
