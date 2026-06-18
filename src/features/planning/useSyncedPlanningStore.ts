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
import { resolveLocalLanguagePreference } from "@/i18n/localLanguagePreference";

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

type SyncedItemRow = Omit<LocalItemRow, "pressure_metadata" | "quick_add_parse_result"> & {
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

type PendingWriteRow = {
  action: RejectedWriteContext["action"];
  client_action_id: string;
  created_at: string;
  id: string;
  idempotency_key: string;
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
  const pendingQuery = useQuery<PendingWriteRow>(
    "SELECT * FROM pending_write_context ORDER BY created_at ASC",
  );

  const today = getDateOnlyInTimeZone(new Date(), getDefaultDeviceTimeZone());
  const settings = useMemo(() => normalizeSettings(settingsQuery.data[0]), [settingsQuery.data]);
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
  const pendingMutations = useMemo(
    () => pendingQuery.data.map(normalizePendingWrite),
    [pendingQuery.data],
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
        pendingMutations,
        rejectedWrites,
        userId,
      }),
    [data, database, deviceId, pendingMutations, rejectedWrites, userId],
  );

  return {
    data,
    mutations,
    syncSnapshot: {
      deviceId,
      pendingMutations,
      rejectedWrites,
    },
    syncUiState: {
      labelKey:
        rejectedWrites.length > 0
          ? "sync.validationRejected"
          : pendingMutations.length > 0
            ? "sync.pending"
            : "sync.synced",
      mode:
        rejectedWrites.length > 0 ? "rejected" : pendingMutations.length > 0 ? "pending" : "synced",
      pendingCount: pendingMutations.length,
      rejectedCount: rejectedWrites.length,
    },
  };
}

function buildSyncedMutations({
  data,
  database,
  deviceId,
  pendingMutations,
  rejectedWrites,
  userId,
}: {
  data: PlanningData;
  database: AbstractPowerSyncDatabase;
  deviceId: string;
  pendingMutations: LocalMutationContext[];
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
    fn: (context: WriteContext, tx: WriteTransaction) => Promise<void>,
    onRejected?: (error: ContractError, context: WriteContext) => Promise<void> | void,
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

    const context: WriteContext = {
      clientActionId,
      database,
      deviceId,
      idempotencyKey: mutation.idempotencyKey,
      now,
      userId: userId ?? "",
    };

    void database
      .writeTransaction(async (tx) => {
        await fn(context, tx);
        await insertPendingContext(tx, mutation, now);
      })
      .catch((error: unknown) => {
        const contractError =
          error && typeof error === "object" && "code" in error
            ? (error as ContractError)
            : validationError({ title: "local_write_failed" });
        void (async () => {
          await writeRejectedContext(database, mutation, contractError, now);
          await onRejected?.(contractError, context);
        })();
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

      return classifySyncedItem(database, deviceId, userId, item, input, data.today);
    },
    createCapture(input) {
      const rowId = createUuid();
      return execute("items", rowId, "create", async (context, tx) => {
        await insertItem(tx, buildCaptureRow(data, input, context, rowId));
      });
    },
    deleteArea(areaId, choice) {
      const affectedItems =
        choice === "area_and_items" ? data.items.filter((item) => item.area_id === areaId) : [];
      const itemMutations = affectedItems.map((item) =>
        buildRejectedMutation(userId, deviceId, "items", item.id, "delete"),
      );
      const itemMutationById = new Map(itemMutations.map((mutation) => [mutation.rowId, mutation]));

      return execute(
        "areas",
        areaId,
        "area_delete",
        async (context, tx) => {
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
          for (const item of affectedItems) {
            const itemMutation = itemMutationById.get(item.id);

            if (!itemMutation) {
              continue;
            }

            await tx.execute(
              "UPDATE items SET deleted_at = ?, updated_at = ?, client_updated_at = ?, updated_by_device_id = ? WHERE id = ?",
              [context.now, context.now, context.now, context.deviceId, item.id],
            );
            await insertOperationHistory(tx, {
              created_at: context.now,
              created_by_device_id: context.deviceId,
              event_type: "deleted",
              id: createUuid(),
              idempotency_key: itemMutation.idempotencyKey,
              item_id: item.id,
              new_value: { deleted_at: context.now },
              previous_value: { area_id: areaId, deleted_at: item.deleted_at },
              reason: null,
              recurring_template_id: item.recurring_template_id,
              user_id: context.userId,
            });
            await insertPendingContext(tx, itemMutation, context.now);
          }
        },
        async (error, context) => {
          for (const itemMutation of itemMutations) {
            await writeRejectedContext(database, itemMutation, error, context.now);
          }
        },
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
      if (rejectedWrites.some((context) => context.rowId === itemId)) {
        return "rejected";
      }

      if (pendingMutations.some((mutation) => mutation.rowId === itemId)) {
        return "pending";
      }

      return null;
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
        const candidateTimeZone =
          typeof candidate.time_zone === "string" ? candidate.time_zone : "";
        const error = validationError(
          isValidTimeZone(candidateTimeZone)
            ? { language: "invalid_setting" }
            : { time_zone: "invalid_time_zone" },
        );
        const mutation = buildRejectedMutation(
          userId,
          deviceId,
          "user_settings",
          userId ?? "settings",
          "settings_update",
        );
        void writeRejectedContext(database, mutation, error, now);
        return { ok: false, error };
      }

      return execute(
        "user_settings",
        userId ?? "settings",
        "settings_update",
        async (context, tx) => {
          await tx.execute(
            `UPDATE user_settings SET
            language = ?,
            locale = ?,
            week_start_day = ?,
            time_zone = ?,
            date_display_format = ?,
            time_display_format = ?,
            default_time_zone_mode = ?,
            today_primary_lookahead_days = ?,
            deadline_awareness_days = ?,
            weather_city = ?,
            updated_at = ?,
            client_updated_at = ?,
            updated_by_device_id = ?,
            revision = ?
          WHERE id = ?`,
            [
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
              context.deviceId,
              0,
              context.userId,
            ],
          );
          await tx.execute(
            `INSERT INTO user_settings (
            id, user_id, language, locale, week_start_day, time_zone, date_display_format,
            time_display_format, default_time_zone_mode, today_primary_lookahead_days,
            deadline_awareness_days, weather_city, created_at, updated_at, client_updated_at,
            server_updated_at, created_by_device_id, updated_by_device_id, revision
          )
          SELECT ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?
          WHERE NOT EXISTS (SELECT 1 FROM user_settings WHERE id = ?)`,
            [
              context.userId,
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
              context.userId,
            ],
          );
        },
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
  void database
    .writeTransaction(async (tx) => {
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
      await insertPendingContext(tx, mutation, now);
    })
    .catch((error: unknown) => {
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
  database: AbstractPowerSyncDatabase,
  deviceId: string,
  userId: string | null,
  item: LocalItemRow,
  input: ClassificationInput,
  today: DateOnly,
): MutationResult {
  if (input.targetType === "recurring_template") {
    return convertItemToRecurringTemplate(database, deviceId, userId, item, today);
  }

  return writeItemUpdate(
    database,
    deviceId,
    userId,
    item,
    {
      ...item,
      item_type: input.targetType,
      scheduled_date: input.targetType === "date_task" ? input.scheduledDate : null,
      scheduled_time_zone_mode: input.targetType === "date_task" ? "floating" : null,
      deadline_date: input.targetType === "deadline_task" ? input.deadlineDate : null,
      deadline_time_zone_mode: input.targetType === "deadline_task" ? "date_only" : null,
      review_date: input.targetType === "idea" ? today : null,
    },
    "classify",
  );
}

function convertItemToRecurringTemplate(
  database: AbstractPowerSyncDatabase,
  deviceId: string,
  userId: string | null,
  item: LocalItemRow,
  today: DateOnly,
): MutationResult {
  if (!userId) {
    const error = validationError({ user_id: "session_required" });
    const mutation = buildRejectedMutation(userId, deviceId, "items", item.id, "classify");
    void writeRejectedContext(database, mutation, error, new Date().toISOString());
    return { ok: false, error };
  }

  const now = new Date().toISOString();
  const templateId = createUuid();
  const itemMutation = buildRejectedMutation(userId, deviceId, "items", item.id, "classify");
  const templateMutation: LocalMutationContext = {
    action: "classify",
    clientActionId: itemMutation.clientActionId,
    idempotencyKey: itemMutation.idempotencyKey,
    localMutationId: createUuid(),
    rowId: templateId,
    table: "recurring_task_templates",
  };
  const hiddenItem = normalizeItemRow({
    ...item,
    client_updated_at: now,
    hidden_reason: "converted_to_recurring_template",
    updated_at: now,
    updated_by_device_id: deviceId,
  });
  const template = buildTemplateFromItem(item, {
    deviceId,
    now,
    templateId,
    today,
    userId,
  });

  void database
    .writeTransaction(async (tx) => {
      await insertRecurringTemplate(tx, template);
      await updateItemRow(tx, hiddenItem);
      await insertOperationHistory(tx, {
        created_at: now,
        created_by_device_id: deviceId,
        event_type: "converted_to_recurring_template",
        id: createUuid(),
        idempotency_key: itemMutation.idempotencyKey,
        item_id: item.id,
        new_value: {
          hidden_reason: "converted_to_recurring_template",
          recurring_template_id: templateId,
        },
        previous_value: {
          hidden_reason: item.hidden_reason,
          recurring_template_id: item.recurring_template_id,
        },
        reason: null,
        recurring_template_id: templateId,
        user_id: userId,
      });
      await insertPendingContext(tx, itemMutation, now);
      await insertPendingContext(tx, templateMutation, now);
    })
    .catch((error: unknown) => {
      const contractError =
        error && typeof error === "object" && "code" in error
          ? (error as ContractError)
          : validationError({ title: "local_write_failed" });
      void writeRejectedContext(database, itemMutation, contractError, now);
      void writeRejectedContext(database, templateMutation, contractError, now);
    });

  return { ok: true, mutation: itemMutation };
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

function getSyncedSemanticActionPatch(action: ItemActionId): {
  action: RejectedWriteContext["action"];
  eventType: MinimalOperationHistoryRow["event_type"];
  newValue: (now: string) => JsonObject;
  patch: (now: string) => Partial<LocalItemRow>;
} | null {
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

async function insertRecurringTemplate(
  tx: Pick<AbstractPowerSyncDatabase, "execute">,
  row: RecurringTaskTemplateDto,
): Promise<void> {
  await tx.execute(
    `INSERT INTO recurring_task_templates (
      id, user_id, archived_at, client_updated_at, created_at, created_by_device_id, deleted_at,
      hidden_reason, revision, server_updated_at, updated_at, updated_by_device_id, area_id,
      completed_count, end_after_count, end_date, end_type, frequency, generated_task_defaults,
      interval, next_sequence, note, recurrence_basis, reminder_rule, scheduled_time, start_date,
      status, title, weekdays
    ) VALUES (${Array.from({ length: 29 }, () => "?").join(", ")})`,
    [
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
      row.completed_count,
      row.end_after_count,
      row.end_date,
      row.end_type,
      row.frequency,
      serializeJson(row.generated_task_defaults),
      row.interval,
      row.next_sequence,
      row.note,
      row.recurrence_basis,
      serializeJson(row.reminder_rule),
      row.scheduled_time,
      row.start_date,
      row.status,
      row.title,
      JSON.stringify(row.weekdays),
    ],
  );
}

function buildTemplateFromItem(
  item: LocalItemRow,
  context: {
    deviceId: string;
    now: string;
    templateId: string;
    today: DateOnly;
    userId: string;
  },
): RecurringTaskTemplateDto {
  const recurrenceBasis =
    item.item_type === "deadline_task"
      ? "deadline_date"
      : item.item_type === "date_task"
        ? "scheduled_date"
        : "completion_date";
  const startDate =
    item.scheduled_date ??
    item.deadline_date ??
    item.review_date ??
    item.planned_work_date ??
    context.today;

  return {
    id: context.templateId,
    user_id: context.userId,
    archived_at: null,
    client_updated_at: context.now,
    created_at: context.now,
    created_by_device_id: context.deviceId,
    deleted_at: null,
    hidden_reason: null,
    revision: 0,
    server_updated_at: context.now,
    updated_at: context.now,
    updated_by_device_id: context.deviceId,
    area_id: item.area_id,
    completed_count: 0,
    end_after_count: null,
    end_date: null,
    end_type: "never",
    frequency: "weekly",
    generated_task_defaults: buildGeneratedTaskDefaults(item),
    interval: 1,
    next_sequence: 1,
    note: item.note,
    recurrence_basis: recurrenceBasis,
    reminder_rule: {},
    scheduled_time: item.scheduled_time,
    start_date: startDate,
    status: "active",
    title: item.title,
    weekdays: [],
  };
}

function buildGeneratedTaskDefaults(item: LocalItemRow): JsonObject {
  return {
    estimated_effort: item.estimated_effort,
    importance: item.importance,
    item_type: item.item_type === "inbox" ? "date_task" : item.item_type,
    note: item.note,
  };
}

async function insertPendingContext(
  tx: Pick<AbstractPowerSyncDatabase, "execute">,
  mutation: LocalMutationContext,
  now: string,
): Promise<void> {
  await tx.execute(
    `INSERT OR REPLACE INTO pending_write_context (
      id, action, client_action_id, created_at, idempotency_key, row_id, table_name
    ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      mutation.localMutationId,
      mutation.action,
      mutation.clientActionId,
      now,
      mutation.idempotencyKey,
      mutation.rowId,
      mutation.table,
    ],
  );
}

async function writeRejectedContext(
  database: AbstractPowerSyncDatabase,
  mutation: LocalMutationContext,
  error: ContractError,
  now: string,
): Promise<void> {
  await database.writeTransaction(async (tx) => {
    await tx.execute(
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
    await tx.execute("DELETE FROM pending_write_context WHERE id = ?", [mutation.localMutationId]);
  });
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

function normalizePendingWrite(row: PendingWriteRow): LocalMutationContext {
  return {
    action: row.action,
    clientActionId: row.client_action_id,
    idempotencyKey: row.idempotency_key,
    localMutationId: row.id,
    rowId: row.row_id,
    table: row.table_name,
  };
}

function normalizeSettings(row: SyncedSettingsRow | undefined): UserSettingsDefaults {
  if (row && isUserSettingsDefaults(row)) {
    return row;
  }

  const deviceTimeZone = getDefaultDeviceTimeZone();
  return buildDefaultUserSettings(
    resolveLocalLanguagePreference(),
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
    return Array.isArray(parsed)
      ? parsed.filter((item): item is string => typeof item === "string")
      : [];
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

type WriteTransaction = Pick<AbstractPowerSyncDatabase, "execute">;
