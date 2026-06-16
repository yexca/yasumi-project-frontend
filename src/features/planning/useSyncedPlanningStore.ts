import { useQuery } from "@powersync/react";
import type { AbstractPowerSyncDatabase } from "@powersync/web";
import { useMemo } from "react";

import { validationError, type ContractError } from "@/domain/errors";
import {
  normalizeItemRow,
  safeNormalizeItemRow,
  type AreaDto,
  type JsonObject,
  type LocalItemRow,
  type MinimalOperationHistoryRow,
  type RecurringTaskTemplateDto,
} from "@/domain/items/schemas";
import {
  buildDefaultUserSettings,
  detectSupportedLanguage,
  getDefaultDeviceTimeZone,
  isUserSettingsDefaults,
  isValidTimeZone,
  type UserSettingsDefaults,
} from "@/domain/settings/defaults";
import { getDateOnlyInTimeZone, type DateOnly } from "@/domain/time/dateOnly";
import { validateStatusTransition } from "@/domain/transitions/status";
import type { ItemActionId } from "@/features/items/itemPresentation";
import { parseQuickAdd } from "@/features/quick-add/parser";
import { useAuth } from "@/features/auth/AuthProvider";
import { usePowerSyncRuntime } from "@/features/sync/PowerSyncRuntimeProvider";

import type {
  ClassificationInput,
  LocalMutationContext,
  MutationResult,
  PlanningData,
  PlanningMutations,
  PostponeInput,
  QuickAddInput,
  RejectedWriteContext,
  SyncSnapshot,
  SyncUiState,
} from "./usePlanningData";
import { buildOrdinaryActionKey } from "./usePlanningData";

export type SyncedStore = {
  data: PlanningData;
  mutations: PlanningMutations;
  syncSnapshot: SyncSnapshot;
  syncUiState: SyncUiState;
};

type SyncedItemRow = Omit<
  LocalItemRow,
  "pressure_metadata" | "quick_add_parse_result"
> & {
  pressure_metadata: string | JsonObject | null;
  quick_add_parse_result: string | JsonObject | null;
};

type SyncedRecurringTemplateRow = Omit<
  RecurringTaskTemplateDto,
  "generated_task_defaults" | "reminder_rule" | "weekdays"
> & {
  generated_task_defaults: string | JsonObject | null;
  reminder_rule: string | JsonObject | null;
  weekdays: string | string[] | null;
};

type SyncedOperationHistoryRow = Omit<
  MinimalOperationHistoryRow,
  "new_value" | "previous_value"
> & {
  new_value: string | JsonObject | null;
  previous_value: string | JsonObject | null;
};

type SyncedSettingsRow = UserSettingsDefaults & {
  client_updated_at: string | null;
  created_at: string | null;
  created_by_device_id: string | null;
  revision: number | null;
  server_updated_at: string | null;
  updated_at: string | null;
  updated_by_device_id: string | null;
  user_id: string;
};

type RejectedWriteRow = {
  action: RejectedWriteContext["action"];
  client_action_id: string | null;
  created_at: string;
  error_code: RejectedWriteContext["errorCode"];
  field_errors: string | Record<string, string> | null;
  id: string;
  idempotency_key: string | null;
  retryable: number | boolean;
  row_id: string;
  table_name: RejectedWriteContext["table"];
};

export function useSyncedPlanningStore(): SyncedStore {
  const { session } = useAuth();
  const { database, deviceId } = usePowerSyncRuntime();
  const userId = session?.user.id ?? null;

  const areasQuery = useQuery<AreaDto>(
    "SELECT * FROM areas WHERE deleted_at IS NULL ORDER BY sort_order ASC, name ASC",
  );
  const itemsQuery = useQuery<SyncedItemRow>("SELECT * FROM items ORDER BY created_at DESC");
  const operationHistoryQuery = useQuery<SyncedOperationHistoryRow>(
    "SELECT * FROM operation_history ORDER BY created_at ASC",
  );
  const recurringTemplatesQuery = useQuery<SyncedRecurringTemplateRow>(
    "SELECT * FROM recurring_task_templates ORDER BY created_at ASC",
  );
  const settingsQuery = useQuery<SyncedSettingsRow>("SELECT * FROM user_settings LIMIT 1");
  const rejectedQuery = useQuery<RejectedWriteRow>(
    "SELECT * FROM rejected_write_context ORDER BY created_at DESC",
  );

  const today = getDateOnlyInTimeZone(new Date(), getDefaultDeviceTimeZone());
  const settings = useMemo(
    () => normalizeSettings(settingsQuery.data[0]),
    [settingsQuery.data],
  );
  const items = useMemo(
    () => itemsQuery.data.map(normalizeSyncedItem).filter(isPresent),
    [itemsQuery.data],
  );
  const operationHistory = useMemo(
    () => operationHistoryQuery.data.map(normalizeOperationHistory),
    [operationHistoryQuery.data],
  );
  const recurringTemplates = useMemo(
    () => recurringTemplatesQuery.data.map(normalizeRecurringTemplate),
    [recurringTemplatesQuery.data],
  );
  const rejectedWrites = useMemo(
    () => rejectedQuery.data.map(normalizeRejectedWrite),
    [rejectedQuery.data],
  );

  const data = useMemo<PlanningData>(
    () => ({
      areas: areasQuery.data,
      items,
      operationHistory,
      recurringTemplates,
      settings,
      today,
    }),
    [areasQuery.data, items, operationHistory, recurringTemplates, settings, today],
  );

  const mutations = useMemo<PlanningMutations>(
    () =>
      buildSyncedMutations({
        data,
        database,
        deviceId,
        rejectedWrites,
        userId,
      }),
    [data, database, deviceId, rejectedWrites, userId],
  );

  return {
    data,
    mutations,
    syncSnapshot: {
      deviceId,
      pendingMutations: [],
      rejectedWrites,
    },
    syncUiState: {
      labelKey: rejectedWrites.length > 0 ? "sync.validationRejected" : "sync.synced",
      mode: rejectedWrites.length > 0 ? "rejected" : "synced",
      pendingCount: 0,
      rejectedCount: rejectedWrites.length,
    },
  };
}

function buildSyncedMutations({
  data,
  database,
  deviceId,
  rejectedWrites,
  userId,
}: {
  data: PlanningData;
  database: AbstractPowerSyncDatabase;
  deviceId: string;
  rejectedWrites: RejectedWriteContext[];
  userId: string | null;
}): PlanningMutations {
  const ensureUser = () => {
    if (!userId) {
      return validationError({ user_id: "session_required" });
    }

    return null;
  };

  const execute = (
    table: LocalMutationContext["table"],
    rowId: string,
    action: RejectedWriteContext["action"],
    fn: (context: WriteContext) => Promise<void>,
  ): MutationResult => {
    const authError = ensureUser();
    const now = new Date().toISOString();
    const clientActionId = createUuid();
    const mutation: LocalMutationContext = {
      action,
      clientActionId,
      idempotencyKey: buildOrdinaryActionKey(userId ?? "", deviceId, clientActionId),
      localMutationId: createUuid(),
      rowId,
      table,
    };

    if (authError) {
      void writeRejectedContext(database, mutation, authError, now);
      return { ok: false, error: authError };
    }

    void fn({
      clientActionId,
      database,
      deviceId,
      idempotencyKey: mutation.idempotencyKey,
      now,
      userId: userId ?? "",
    }).catch((error: unknown) => {
      const contractError =
        error && typeof error === "object" && "code" in error
          ? (error as ContractError)
          : validationError({ title: "local_write_failed" });
      void writeRejectedContext(database, mutation, contractError, now);
    });

    return { ok: true, mutation };
  };

  return {
    archiveRejectedContext(localMutationId) {
      void database.execute("DELETE FROM rejected_write_context WHERE id = ?", [localMutationId]);
    },
    classifyItem(itemId, input) {
      const item = data.items.find((candidate) => candidate.id === itemId);
      if (!item) {
        return { ok: false, error: validationError({ title: "item_not_found" }) };
      }

      const projected = classifySyncedItem(item, input, data.today);
      return writeItemUpdate(database, deviceId, userId, item, projected, "classify");
    },
    createCapture(input) {
      const rowId = createUuid();
      return execute("items", rowId, "create", (context) =>
        database.writeTransaction(async (tx) => {
          await insertItem(tx, buildCaptureRow(data, input, context, rowId));
        }),
      );
    },
    deleteArea(areaId, choice) {
      return execute("areas", areaId, "area_delete", (context) =>
        database.writeTransaction(async (tx) => {
          const timestampPatch =
            choice === "area_and_items"
              ? { deleted_at: context.now }
              : { archived_at: context.now };
          await tx.execute(
            "UPDATE areas SET updated_at = ?, client_updated_at = ?, updated_by_device_id = ?, archived_at = ?, deleted_at = ? WHERE id = ?",
            [
              context.now,
              context.now,
              context.deviceId,
              timestampPatch.archived_at ?? null,
              timestampPatch.deleted_at ?? null,
              areaId,
            ],
          );
          if (choice === "area_only") {
            await tx.execute(
              "UPDATE items SET area_id = NULL, updated_at = ?, client_updated_at = ?, updated_by_device_id = ? WHERE area_id = ?",
              [context.now, context.now, context.deviceId, areaId],
            );
            return;
          }
          await tx.execute(
            "UPDATE items SET deleted_at = ?, updated_at = ?, client_updated_at = ?, updated_by_device_id = ? WHERE area_id = ?",
            [context.now, context.now, context.now, context.deviceId, areaId],
          );
        }),
      );
    },
    editItem(itemId, input) {
      const item = data.items.find((candidate) => candidate.id === itemId);
      if (!item) {
        return { ok: false, error: validationError({ title: "item_not_found" }) };
      }

      return writeItemUpdate(
        database,
        deviceId,
        userId,
        item,
        {
          ...item,
          area_id: input.areaId,
          note: input.note,
          title: input.title.trim(),
        },
        "edit",
      );
    },
    getItemSyncState(itemId) {
      return rejectedWrites.some((context) => context.rowId === itemId) ? "rejected" : null;
    },
    getRejectedContextForRow(rowId) {
      return rejectedWrites.find((context) => context.rowId === rowId) ?? null;
    },
    postponeItem(itemId, input) {
      const item = data.items.find((candidate) => candidate.id === itemId);
      if (!item) {
        return { ok: false, error: validationError({ title: "item_not_found" }) };
      }

      return writeItemUpdate(
        database,
        deviceId,
        userId,
        item,
        postponeSyncedItem(item, input),
        "postpone",
        "postponed",
        { target_date: input.targetDate },
      );
    },
    restoreItemSnapshot(item) {
      const existing = data.items.find((candidate) => candidate.id === item.id);
      if (!existing) {
        return { ok: false, error: validationError({ title: "item_not_found" }) };
      }

      return writeItemUpdate(database, deviceId, userId, existing, item, "restore", "restored", {
        status: item.status,
      });
    },
    runItemAction(itemId, action) {
      const item = data.items.find((candidate) => candidate.id === itemId);
      if (!item) {
        return { ok: false, error: validationError({ title: "item_not_found" }) };
      }

      const semantic = getSyncedSemanticActionPatch(action);
      if (!semantic) {
        return { ok: false, error: validationError({ status: "unsupported_item_action" }) };
      }

      return writeItemUpdate(
        database,
        deviceId,
        userId,
        item,
        {
          ...item,
          ...semantic.patch(new Date().toISOString()),
        },
        semantic.action,
        semantic.eventType,
        semantic.newValue(new Date().toISOString()),
      );
    },
    updateSettings(input) {
      const now = new Date().toISOString();
      const candidate = {
        ...data.settings,
        ...input,
        date_display_format: "YYYY-MM-DD",
        default_time_zone_mode: "floating",
      };

      if (!isUserSettingsDefaults(candidate)) {
        const candidateTimeZone = typeof candidate.time_zone === "string" ? candidate.time_zone : "";
        const error = validationError(
          isValidTimeZone(candidateTimeZone)
            ? { language: "invalid_setting" }
            : { time_zone: "invalid_time_zone" },
        );
        const mutation = buildRejectedMutation(userId, deviceId, "user_settings", userId ?? "settings", "settings_update");
        void writeRejectedContext(database, mutation, error, now);
        return { ok: false, error };
      }

      return execute("user_settings", userId ?? "settings", "settings_update", (context) =>
        database.writeTransaction(async (tx) => {
          await tx.execute(
            `INSERT INTO user_settings (
              user_id, language, locale, week_start_day, time_zone, date_display_format,
              time_display_format, default_time_zone_mode, today_primary_lookahead_days,
              deadline_awareness_days, weather_city, created_at, updated_at, client_updated_at,
              server_updated_at, created_by_device_id, updated_by_device_id, revision
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ON CONFLICT(user_id) DO UPDATE SET
              language = excluded.language,
              locale = excluded.locale,
              week_start_day = excluded.week_start_day,
              time_zone = excluded.time_zone,
              date_display_format = excluded.date_display_format,
              time_display_format = excluded.time_display_format,
              default_time_zone_mode = excluded.default_time_zone_mode,
              today_primary_lookahead_days = excluded.today_primary_lookahead_days,
              deadline_awareness_days = excluded.deadline_awareness_days,
              weather_city = excluded.weather_city,
              updated_at = excluded.updated_at,
              client_updated_at = excluded.client_updated_at,
              updated_by_device_id = excluded.updated_by_device_id,
              revision = excluded.revision`,
            [
              context.userId,
              candidate.language,
              candidate.locale,
              candidate.week_start_day,
              candidate.time_zone,
              candidate.date_display_format,
              candidate.time_display_format,
              candidate.default_time_zone_mode,
              candidate.today_primary_lookahead_days,
              candidate.deadline_awareness_days,
              candidate.weather_city,
              context.now,
              context.now,
              context.now,
              context.now,
              context.deviceId,
              context.deviceId,
              0,
            ],
          );
        }),
      );
    },
  };
}

function writeItemUpdate(
  database: AbstractPowerSyncDatabase,
  deviceId: string,
  userId: string | null,
  previous: LocalItemRow,
  next: LocalItemRow,
  action: RejectedWriteContext["action"],
  eventType?: MinimalOperationHistoryRow["event_type"],
  newValue: JsonObject = {},
): MutationResult {
  const parsed = safeNormalizeItemRow(next);
  if (!parsed.ok) {
    const mutation = buildRejectedMutation(userId, deviceId, "items", previous.id, action);
    void writeRejectedContext(database, mutation, parsed.error, new Date().toISOString());
    return { ok: false, error: parsed.error };
  }

  if (previous.status !== parsed.row.status) {
    const transition = validateStatusTransition(previous.status, parsed.row.status);
    if (!transition.ok) {
      const mutation = buildRejectedMutation(userId, deviceId, "items", previous.id, action);
      void writeRejectedContext(database, mutation, transition.error, new Date().toISOString());
      return transition;
    }
  }

  const now = new Date().toISOString();
  const mutation = buildRejectedMutation(userId, deviceId, "items", previous.id, action);
  void database.writeTransaction(async (tx) => {
    await updateItemRow(tx, {
      ...parsed.row,
      client_updated_at: now,
      updated_at: now,
      updated_by_device_id: deviceId,
    });
    if (eventType) {
      await insertOperationHistory(tx, {
        created_at: now,
        created_by_device_id: deviceId,
        event_type: eventType,
        id: createUuid(),
        idempotency_key: mutation.idempotencyKey,
        item_id: previous.id,
        new_value: newValue,
        previous_value: pickPreviousValues(previous, newValue),
        reason: null,
        recurring_template_id: previous.recurring_template_id,
        user_id: userId ?? "",
      });
    }
  }).catch((error: unknown) => {
    const contractError =
      error && typeof error === "object" && "code" in error
        ? (error as ContractError)
        : validationError({ title: "local_write_failed" });
    void writeRejectedContext(database, mutation, contractError, now);
  });

  return { ok: true, mutation };
}

function buildCaptureRow(
  data: PlanningData,
  input: QuickAddInput,
  context: WriteContext,
  rowId: string,
): LocalItemRow {
  const preview = parseQuickAdd(input.sourceText, {
    locale: data.settings.locale,
    today: data.today,
  });
  const itemType = input.mode === "inbox" ? "inbox" : preview.itemTypeSuggestion;
  const effectiveItemType =
    input.mode === "suggestion" && preview.confidence === "low" && input.defaultItemType
      ? input.defaultItemType
      : itemType;
  const captureTitle = input.sourceText.trim().replace(/\s+/g, " ") || "Untitled capture";

  return normalizeItemRow({
    id: rowId,
    user_id: context.userId,
    created_at: context.now,
    updated_at: context.now,
    deleted_at: null,
    archived_at: null,
    hidden_reason: null,
    client_updated_at: context.now,
    server_updated_at: context.now,
    created_by_device_id: context.deviceId,
    updated_by_device_id: context.deviceId,
    revision: 0,
    item_type: effectiveItemType,
    title: input.mode === "inbox" ? captureTitle : preview.cleanTitle,
    note: null,
    status: "active",
    area_id: null,
    scheduled_date:
      effectiveItemType === "date_task"
        ? (preview.fields.scheduled_date ?? input.defaultScheduledDate ?? null)
        : null,
    scheduled_time_zone_mode: effectiveItemType === "date_task" ? "floating" : null,
    deadline_date:
      effectiveItemType === "deadline_task" ? (preview.fields.deadline_date ?? null) : null,
    deadline_time:
      effectiveItemType === "deadline_task" ? (preview.fields.deadline_time ?? null) : null,
    deadline_time_zone_mode:
      effectiveItemType === "deadline_task"
        ? ((preview.fields.deadline_time_zone_mode as "date_only" | "floating" | null) ??
          "date_only")
        : null,
    review_date: effectiveItemType === "idea" ? (preview.fields.review_date ?? null) : null,
    pressure_metadata: {},
    quick_add_source_text: input.sourceText,
    quick_add_parse_result: {
      confidence: preview.confidence,
      recognized_fragments: preview.recognizedFragments,
      warnings: preview.warnings,
    },
  });
}

function classifySyncedItem(
  item: LocalItemRow,
  input: ClassificationInput,
  today: DateOnly,
): LocalItemRow {
  if (input.targetType === "recurring_template") {
    return {
      ...item,
      hidden_reason: "converted_to_recurring_template",
    };
  }

  return {
    ...item,
    item_type: input.targetType,
    scheduled_date: input.targetType === "date_task" ? input.scheduledDate : null,
    scheduled_time_zone_mode: input.targetType === "date_task" ? "floating" : null,
    deadline_date: input.targetType === "deadline_task" ? input.deadlineDate : null,
    deadline_time_zone_mode: input.targetType === "deadline_task" ? "date_only" : null,
    review_date: input.targetType === "idea" ? today : null,
  };
}

function postponeSyncedItem(item: LocalItemRow, input: PostponeInput): LocalItemRow {
  if (item.item_type === "deadline_task") {
    return {
      ...item,
      planned_work_date: input.targetDate,
      status: "postponed",
    };
  }

  if (item.item_type === "idea") {
    return {
      ...item,
      review_date: input.targetDate,
    };
  }

  return {
    ...item,
    scheduled_date: input.targetDate,
    scheduled_time_zone_mode: "floating",
    status: "postponed",
  };
}

function getSyncedSemanticActionPatch(action: ItemActionId):
  | {
      action: RejectedWriteContext["action"];
      eventType: MinimalOperationHistoryRow["event_type"];
      newValue: (now: string) => JsonObject;
      patch: (now: string) => Partial<LocalItemRow>;
    }
  | null {
  switch (action) {
    case "complete":
      return {
        action: "complete",
        eventType: "completed",
        newValue: () => ({ status: "completed" }),
        patch: () => ({ status: "completed" }),
      };
    case "hold":
      return {
        action: "hold",
        eventType: "on_hold",
        newValue: () => ({ status: "on_hold" }),
        patch: () => ({ status: "on_hold" }),
      };
    case "abandon":
      return {
        action: "abandon",
        eventType: "abandoned",
        newValue: () => ({ status: "abandoned" }),
        patch: () => ({ status: "abandoned" }),
      };
    case "reopen":
      return {
        action: "reopen",
        eventType: "reopened",
        newValue: () => ({ status: "active" }),
        patch: () => ({ status: "active" }),
      };
    case "restore":
      return {
        action: "restore",
        eventType: "restored",
        newValue: () => ({ archived_at: null, deleted_at: null, hidden_reason: null }),
        patch: () => ({ archived_at: null, deleted_at: null, hidden_reason: null }),
      };
    case "archive":
      return {
        action: "archive",
        eventType: "archived",
        newValue: (now) => ({ archived_at: now }),
        patch: (now) => ({ archived_at: now }),
      };
    case "delete":
      return {
        action: "delete",
        eventType: "deleted",
        newValue: (now) => ({ deleted_at: now }),
        patch: (now) => ({ deleted_at: now }),
      };
    default:
      return null;
  }
}

async function insertItem(
  tx: Pick<AbstractPowerSyncDatabase, "execute">,
  row: LocalItemRow,
): Promise<void> {
  await tx.execute(
    `INSERT INTO items (
      id, user_id, archived_at, client_updated_at, created_at, created_by_device_id, deleted_at,
      hidden_reason, revision, server_updated_at, updated_at, updated_by_device_id, area_id,
      deadline_at, deadline_date, deadline_time, deadline_time_zone_mode, deadline_timezone,
      estimated_effort, generated_from_item_id, importance, item_type, note, planned_work_date,
      pressure_metadata, quick_add_parse_result, quick_add_source_text, recurring_anchor_date,
      recurring_sequence, recurring_template_id, reminder_at, reminder_date, reminder_intent,
      reminder_time, reminder_time_zone_mode, review_date, scheduled_date, scheduled_time,
      scheduled_time_zone_mode, status, title
    ) VALUES (${Array.from({ length: 41 }, () => "?").join(", ")})`,
    itemParams(row),
  );
}

async function updateItemRow(
  tx: Pick<AbstractPowerSyncDatabase, "execute">,
  row: LocalItemRow,
): Promise<void> {
  await tx.execute(
    `UPDATE items SET
      archived_at = ?, client_updated_at = ?, deleted_at = ?, hidden_reason = ?, revision = ?,
      updated_at = ?, updated_by_device_id = ?, area_id = ?, deadline_at = ?, deadline_date = ?,
      deadline_time = ?, deadline_time_zone_mode = ?, deadline_timezone = ?, estimated_effort = ?,
      generated_from_item_id = ?, importance = ?, item_type = ?, note = ?, planned_work_date = ?,
      pressure_metadata = ?, quick_add_parse_result = ?, quick_add_source_text = ?,
      recurring_anchor_date = ?, recurring_sequence = ?, recurring_template_id = ?, reminder_at = ?,
      reminder_date = ?, reminder_intent = ?, reminder_time = ?, reminder_time_zone_mode = ?,
      review_date = ?, scheduled_date = ?, scheduled_time = ?, scheduled_time_zone_mode = ?,
      status = ?, title = ?
    WHERE id = ?`,
    [
      row.archived_at,
      row.client_updated_at,
      row.deleted_at,
      row.hidden_reason,
      row.revision,
      row.updated_at,
      row.updated_by_device_id,
      row.area_id,
      row.deadline_at,
      row.deadline_date,
      row.deadline_time,
      row.deadline_time_zone_mode,
      row.deadline_timezone,
      row.estimated_effort,
      row.generated_from_item_id,
      row.importance,
      row.item_type,
      row.note,
      row.planned_work_date,
      serializeJson(row.pressure_metadata),
      serializeNullableJson(row.quick_add_parse_result),
      row.quick_add_source_text,
      row.recurring_anchor_date,
      row.recurring_sequence,
      row.recurring_template_id,
      row.reminder_at,
      row.reminder_date,
      row.reminder_intent,
      row.reminder_time,
      row.reminder_time_zone_mode,
      row.review_date,
      row.scheduled_date,
      row.scheduled_time,
      row.scheduled_time_zone_mode,
      row.status,
      row.title,
      row.id,
    ],
  );
}

function itemParams(row: LocalItemRow): unknown[] {
  return [
    row.id,
    row.user_id,
    row.archived_at,
    row.client_updated_at,
    row.created_at,
    row.created_by_device_id,
    row.deleted_at,
    row.hidden_reason,
    row.revision,
    row.server_updated_at,
    row.updated_at,
    row.updated_by_device_id,
    row.area_id,
    row.deadline_at,
    row.deadline_date,
    row.deadline_time,
    row.deadline_time_zone_mode,
    row.deadline_timezone,
    row.estimated_effort,
    row.generated_from_item_id,
    row.importance,
    row.item_type,
    row.note,
    row.planned_work_date,
    serializeJson(row.pressure_metadata),
    serializeNullableJson(row.quick_add_parse_result),
    row.quick_add_source_text,
    row.recurring_anchor_date,
    row.recurring_sequence,
    row.recurring_template_id,
    row.reminder_at,
    row.reminder_date,
    row.reminder_intent,
    row.reminder_time,
    row.reminder_time_zone_mode,
    row.review_date,
    row.scheduled_date,
    row.scheduled_time,
    row.scheduled_time_zone_mode,
    row.status,
    row.title,
  ];
}

async function insertOperationHistory(
  tx: Pick<AbstractPowerSyncDatabase, "execute">,
  row: MinimalOperationHistoryRow,
): Promise<void> {
  await tx.execute(
    `INSERT INTO operation_history (
      id, user_id, item_id, recurring_template_id, event_type, previous_value, new_value,
      reason, idempotency_key, created_at, created_by_device_id
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      row.id,
      row.user_id,
      row.item_id,
      row.recurring_template_id ?? null,
      row.event_type,
      serializeJson(row.previous_value ?? {}),
      serializeJson(row.new_value ?? {}),
      row.reason ?? null,
      row.idempotency_key ?? null,
      row.created_at,
      row.created_by_device_id ?? "",
    ],
  );
}

async function writeRejectedContext(
  database: AbstractPowerSyncDatabase,
  mutation: LocalMutationContext,
  error: ContractError,
  now: string,
): Promise<void> {
  await database.execute(
    `INSERT OR REPLACE INTO rejected_write_context (
      id, action, client_action_id, created_at, error_code, field_errors, idempotency_key,
      retryable, row_id, table_name
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      mutation.localMutationId,
      mutation.action,
      mutation.clientActionId,
      now,
      error.code,
      serializeJson(error.fields),
      mutation.idempotencyKey,
      error.retryable ? 1 : 0,
      mutation.rowId,
      mutation.table,
    ],
  );
}

function buildRejectedMutation(
  userId: string | null,
  deviceId: string,
  table: LocalMutationContext["table"],
  rowId: string,
  action: RejectedWriteContext["action"],
): LocalMutationContext {
  const clientActionId = createUuid();
  return {
    action,
    clientActionId,
    idempotencyKey: buildOrdinaryActionKey(userId ?? "", deviceId, clientActionId),
    localMutationId: createUuid(),
    rowId,
    table,
  };
}

function normalizeSyncedItem(row: SyncedItemRow): LocalItemRow | null {
  const result = safeNormalizeItemRow({
    ...row,
    pressure_metadata: parseJsonObject(row.pressure_metadata) ?? {},
    quick_add_parse_result: parseJsonObject(row.quick_add_parse_result),
  });

  return result.ok ? result.row : null;
}

function normalizeRecurringTemplate(row: SyncedRecurringTemplateRow): RecurringTaskTemplateDto {
  return {
    ...row,
    generated_task_defaults: parseJsonObject(row.generated_task_defaults) ?? {},
    reminder_rule: parseJsonObject(row.reminder_rule) ?? {},
    weekdays: parseStringArray(row.weekdays),
  };
}

function normalizeOperationHistory(row: SyncedOperationHistoryRow): MinimalOperationHistoryRow {
  return {
    ...row,
    new_value: parseJsonObject(row.new_value) ?? {},
    previous_value: parseJsonObject(row.previous_value) ?? {},
  };
}

function normalizeRejectedWrite(row: RejectedWriteRow): RejectedWriteContext {
  return {
    action: row.action,
    clientActionId: row.client_action_id,
    createdAt: row.created_at,
    errorCode: row.error_code,
    fieldErrors: parseJsonObject(row.field_errors) as RejectedWriteContext["fieldErrors"],
    idempotencyKey: row.idempotency_key,
    localMutationId: row.id,
    retryable: Boolean(row.retryable),
    rowId: row.row_id,
    table: row.table_name,
  };
}

function normalizeSettings(row: SyncedSettingsRow | undefined): UserSettingsDefaults {
  if (row && isUserSettingsDefaults(row)) {
    return row;
  }

  const browserLanguage =
    typeof navigator !== "undefined" ? (navigator.languages?.[0] ?? navigator.language) : "en";
  const deviceTimeZone = getDefaultDeviceTimeZone();
  return buildDefaultUserSettings(
    detectSupportedLanguage(browserLanguage),
    isValidTimeZone(deviceTimeZone) ? deviceTimeZone : "UTC",
  );
}

function parseJsonObject(value: string | JsonObject | null | undefined): JsonObject | null {
  if (value === null || value === undefined) {
    return null;
  }

  if (typeof value === "object") {
    return value;
  }

  try {
    const parsed: unknown = JSON.parse(value);
    return typeof parsed === "object" && parsed !== null && !Array.isArray(parsed)
      ? (parsed as JsonObject)
      : null;
  } catch {
    return null;
  }
}

function parseStringArray(value: string | string[] | null | undefined): string[] {
  if (Array.isArray(value)) {
    return value;
  }

  if (!value) {
    return [];
  }

  try {
    const parsed: unknown = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === "string") : [];
  } catch {
    return [];
  }
}

function serializeJson(value: JsonObject): string {
  return JSON.stringify(value);
}

function serializeNullableJson(value: JsonObject | null): string | null {
  return value === null ? null : serializeJson(value);
}

function pickPreviousValues(item: LocalItemRow, newValue: JsonObject): JsonObject {
  return Object.fromEntries(
    Object.keys(newValue).map((key) => [key, item[key as keyof LocalItemRow] ?? null]),
  );
}

function createUuid(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return "10000000-1000-4000-8000-100000000000".replace(/[018]/g, (char) =>
    (Number(char) ^ (Math.random() * 16)).toString(16),
  );
}

function isPresent<T>(value: T | null): value is T {
  return value !== null;
}

type WriteContext = {
  clientActionId: string;
  database: AbstractPowerSyncDatabase;
  deviceId: string;
  idempotencyKey: string;
  now: string;
  userId: string;
};
