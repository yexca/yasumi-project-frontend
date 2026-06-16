import type { AbstractPowerSyncDatabase, PowerSyncBackendConnector } from "@powersync/web";

import { getBackendBaseUrl, getPowerSyncEndpoint } from "@/repositories/direct-api/config";
import { requestSyncToken } from "@/repositories/direct-api/syncTokenRepository";

type ApiErrorBody = {
  code: string;
  fields: Record<string, string>;
  message: string;
  retryable: boolean;
};

type UploadMutation = {
  client_observed: ObservedState;
  op: "delete" | "insert" | "update";
  row: Record<string, unknown>;
  table: string;
};

type ObservedState = {
  archived_at?: string;
  deleted_at?: string;
  hidden_reason?: string;
  revision?: number;
  status?: string;
};

export type PowerSyncConnectorOptions = {
  accessToken: string | null;
  clientVersion: string;
  deviceId: string;
};

export function createYasumiPowerSyncConnector({
  accessToken,
  clientVersion,
  deviceId,
}: PowerSyncConnectorOptions): PowerSyncBackendConnector {
  return {
    async fetchCredentials() {
      const credentials = await requestSyncToken({ accessToken, clientVersion, deviceId });

      if (credentials === null) {
        return null;
      }

      return {
        endpoint: credentials.endpoint || getPowerSyncEndpoint(),
        expiresAt: credentials.expiresAt,
        token: credentials.token,
      };
    },
    async uploadData(database: AbstractPowerSyncDatabase) {
      const transaction = await database.getNextCrudTransaction();

      if (transaction === null) {
        return;
      }

      const mutations: UploadMutation[] = (
        await Promise.all(
          transaction.crud.map(async (entry) => {
            const crud = entry.toJSON();
            const oldValues = (crud.old ?? {}) as Record<string, unknown>;
            const row = await buildUploadRow(database, crud.type, crud.id, crud.data ?? {});

            if (row === null) {
              return null;
            }

            return {
              client_observed: {
                archived_at: optionalString(oldValues["archived_at"]),
                deleted_at: optionalString(oldValues["deleted_at"]),
                hidden_reason: optionalString(oldValues["hidden_reason"]),
                revision: optionalNumber(oldValues["revision"]),
                status: optionalString(oldValues["status"]),
              },
              op: mapCrudOp(crud.op),
              row,
              table: crud.type,
            };
          }),
        )
      ).filter(isPresent);

      const uploadMutations = await withSemanticCompanionOperations(database, mutations, deviceId);

      if (uploadMutations.length === 0) {
        await transaction.complete();
        return;
      }

      const response = await fetch(`${getBackendBaseUrl()}/v1/sync/upload`, {
        body: JSON.stringify({
          client_batch_id: `batch-${transaction.transactionId ?? "untracked"}`,
          device_id: deviceId,
          mutations: uploadMutations,
        }),
        headers: {
          Authorization: accessToken ? `Bearer ${accessToken}` : "",
          "Content-Type": "application/json; charset=utf-8",
        },
        method: "POST",
      });

      if (!response.ok) {
        const errorBody = await readStableErrorBody(response);

        if (errorBody !== null) {
          await recordRejectedUpload(database, uploadMutations, errorBody);
          await transaction.complete();
          return;
        }

        throw new Error("sync_upload_failed");
      }

      await clearPendingUploads(database, uploadMutations);
      await transaction.complete();
    },
  };
}

async function buildUploadRow(
  database: AbstractPowerSyncDatabase,
  table: string,
  id: string,
  changedData: Record<string, unknown>,
): Promise<Record<string, unknown> | null> {
  if (!isSyncedTable(table)) {
    return null;
  }

  const localRow = await database.getOptional<Record<string, unknown>>(
    `SELECT * FROM ${table} WHERE id = ?`,
    [id],
  );

  if (table === "user_settings") {
    const userId =
      optionalString(localRow?.["user_id"]) ?? optionalString(changedData["user_id"]) ?? id;
    return {
      id: userId,
      ...deserializeUploadRow(table, localRow ?? changedData),
      user_id: userId,
    };
  }

  return {
    id,
    ...deserializeUploadRow(table, localRow ?? changedData),
  };
}

function isSyncedTable(table: string): boolean {
  return [
    "areas",
    "items",
    "operation_history",
    "recurring_task_templates",
    "user_settings",
  ].includes(table);
}

function deserializeUploadRow(
  table: string,
  row: Record<string, unknown>,
): Record<string, unknown> {
  const out = { ...row };

  for (const columnName of jsonColumnsForTable(table)) {
    if (columnName in out) {
      out[columnName] = parseJsonField(out[columnName]);
    }
  }

  return out;
}

function jsonColumnsForTable(table: string): string[] {
  switch (table) {
    case "items":
      return ["pressure_metadata", "quick_add_parse_result"];
    case "operation_history":
      return ["previous_value", "new_value"];
    case "recurring_task_templates":
      return ["weekdays", "reminder_rule", "generated_task_defaults"];
    default:
      return [];
  }
}

function parseJsonField(value: unknown): unknown {
  if (typeof value !== "string") {
    return value;
  }

  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
}

async function withSemanticCompanionOperations(
  database: AbstractPowerSyncDatabase,
  mutations: UploadMutation[],
  deviceId: string,
): Promise<UploadMutation[]> {
  const out = [...mutations];
  const operationItemIds = new Set(
    mutations
      .filter((mutation) => mutation.table === "operation_history")
      .map((mutation) => optionalString(mutation.row["item_id"]))
      .filter(isDefined),
  );

  for (const mutation of mutations) {
    if (mutation.table !== "items" || mutation.op !== "update") {
      continue;
    }

    const itemId = optionalString(mutation.row["id"]);
    const eventType = getSemanticEventType(mutation);
    if (!itemId || !eventType || operationItemIds.has(itemId)) {
      continue;
    }

    const localCompanion = await findLocalCompanionOperation(
      database,
      itemId,
      eventType,
      optionalString(mutation.row["updated_at"]),
    );
    if (localCompanion !== null) {
      out.push({
        client_observed: {},
        op: "insert",
        row: localCompanion,
        table: "operation_history",
      });
      operationItemIds.add(itemId);
      continue;
    }

    const updatedAt = optionalString(mutation.row["updated_at"]) ?? "";
    const now =
      optionalString(mutation.row["client_updated_at"]) ?? updatedAt ?? new Date().toISOString();
    const userId = optionalString(mutation.row["user_id"]) ?? "";
    const idempotencyKey = buildSemanticActionKey(userId, deviceId, itemId, eventType, now);
    out.push({
      client_observed: {},
      op: "insert",
      row: {
        id: createUuid(),
        user_id: mutation.row["user_id"],
        item_id: itemId,
        recurring_template_id: mutation.row["recurring_template_id"] ?? null,
        event_type: eventType,
        previous_value: getPreviousValue(mutation),
        new_value: getNewValue(mutation),
        reason: null,
        idempotency_key: idempotencyKey,
        created_at: now,
        created_by_device_id: deviceId,
      },
      table: "operation_history",
    });
    operationItemIds.add(itemId);
  }

  return out;
}

function buildSemanticActionKey(
  userId: string,
  deviceId: string,
  itemId: string,
  eventType: string,
  updatedAt: string,
): string {
  return `action:${userId}:${deviceId}:semantic:${itemId}:${eventType}:${updatedAt}`;
}

async function findLocalCompanionOperation(
  database: AbstractPowerSyncDatabase,
  itemId: string,
  eventType: string,
  createdAt: string | undefined,
): Promise<Record<string, unknown> | null> {
  if (!createdAt) {
    return null;
  }

  return (
    (await database.getOptional<Record<string, unknown>>(
      `SELECT * FROM operation_history WHERE item_id = ? AND event_type = ? AND created_at = ? LIMIT 1`,
      [itemId, eventType, createdAt],
    )) ?? null
  );
}

function getSemanticEventType(mutation: UploadMutation): string | null {
  const previousStatus = mutation.client_observed.status;
  const nextStatus = optionalString(mutation.row["status"]);
  if (previousStatus && nextStatus && previousStatus !== nextStatus) {
    switch (nextStatus) {
      case "completed":
        return "completed";
      case "postponed":
        return "postponed";
      case "on_hold":
        return "on_hold";
      case "abandoned":
        return "abandoned";
      case "active":
        return "reopened";
      default:
        return null;
    }
  }

  if (changedFromEmpty(mutation.client_observed.archived_at, mutation.row["archived_at"])) {
    return "archived";
  }
  if (changedToEmpty(mutation.client_observed.archived_at, mutation.row["archived_at"])) {
    return "restored";
  }
  if (changedFromEmpty(mutation.client_observed.deleted_at, mutation.row["deleted_at"])) {
    return "deleted";
  }
  if (changedToEmpty(mutation.client_observed.deleted_at, mutation.row["deleted_at"])) {
    return "restored";
  }
  if (changedToEmpty(mutation.client_observed.hidden_reason, mutation.row["hidden_reason"])) {
    return "restored";
  }

  return null;
}

function getPreviousValue(mutation: UploadMutation): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(mutation.client_observed).filter(([, value]) => value !== undefined),
  );
}

function getNewValue(mutation: UploadMutation): Record<string, unknown> {
  return {
    archived_at: mutation.row["archived_at"] ?? null,
    deleted_at: mutation.row["deleted_at"] ?? null,
    hidden_reason: mutation.row["hidden_reason"] ?? null,
    status: mutation.row["status"] ?? null,
  };
}

function changedFromEmpty(previous: string | undefined, next: unknown): boolean {
  return previous === undefined && typeof next === "string" && next.length > 0;
}

function changedToEmpty(previous: string | undefined, next: unknown): boolean {
  return typeof previous === "string" && (next === null || next === undefined || next === "");
}

function mapCrudOp(op: string): "delete" | "insert" | "update" {
  switch (op) {
    case "PUT":
      return "insert";
    case "PATCH":
      return "update";
    case "DELETE":
      return "delete";
    default:
      return "update";
  }
}

async function readStableErrorBody(response: Response): Promise<ApiErrorBody | null> {
  const contentType = response.headers.get("Content-Type") ?? "";
  if (!contentType.includes("application/json")) {
    return null;
  }

  try {
    const parsed: unknown = await response.json();
    if (!parsed || typeof parsed !== "object") {
      return null;
    }

    const body = parsed as Partial<ApiErrorBody>;
    if (
      typeof body.code !== "string" ||
      typeof body.message !== "string" ||
      typeof body.retryable !== "boolean" ||
      (body.fields !== undefined && !isStringRecord(body.fields))
    ) {
      return null;
    }

    return {
      code: body.code,
      fields: body.fields ?? {},
      message: body.message,
      retryable: body.retryable,
    };
  } catch {
    return null;
  }
}

async function recordRejectedUpload(
  database: AbstractPowerSyncDatabase,
  mutations: UploadMutation[],
  error: ApiErrorBody,
): Promise<void> {
  const now = new Date().toISOString();
  const contexts = new Map<string, Awaited<ReturnType<typeof findPendingContext>>>();

  for (const mutation of mutations) {
    const rowId = optionalString(mutation.row["id"]);
    if (rowId && isRecoverableTable(mutation.table)) {
      contexts.set(
        contextKey(mutation.table, rowId),
        await findPendingContext(database, mutation.table, rowId),
      );
    }
  }

  await database.writeTransaction(async (tx) => {
    for (const mutation of mutations) {
      const rowId = optionalString(mutation.row["id"]);
      if (!rowId || !isRecoverableTable(mutation.table)) {
        continue;
      }

      const context = contexts.get(contextKey(mutation.table, rowId)) ?? null;
      const idempotencyKey =
        optionalString(mutation.row["idempotency_key"]) ?? context?.idempotency_key ?? null;

      await tx.execute(
        `INSERT OR REPLACE INTO rejected_write_context (
          id, action, client_action_id, created_at, error_code, field_errors, idempotency_key,
          retryable, row_id, table_name
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          context?.id ?? createUuid(),
          context?.action ?? inferAction(mutation),
          context?.client_action_id ?? null,
          now,
          error.code,
          JSON.stringify(error.fields),
          idempotencyKey,
          error.retryable ? 1 : 0,
          rowId,
          mutation.table,
        ],
      );
      await tx.execute("DELETE FROM pending_write_context WHERE table_name = ? AND row_id = ?", [
        mutation.table,
        rowId,
      ]);
    }
  });
}

async function clearPendingUploads(
  database: AbstractPowerSyncDatabase,
  mutations: UploadMutation[],
): Promise<void> {
  await database.writeTransaction(async (tx) => {
    for (const mutation of mutations) {
      const rowId = optionalString(mutation.row["id"]);
      if (rowId && isRecoverableTable(mutation.table)) {
        await tx.execute("DELETE FROM pending_write_context WHERE table_name = ? AND row_id = ?", [
          mutation.table,
          rowId,
        ]);
      }
    }
  });
}

async function findPendingContext(
  database: AbstractPowerSyncDatabase,
  table: string,
  rowId: string,
): Promise<{
  action: string;
  client_action_id: string | null;
  id: string;
  idempotency_key: string | null;
} | null> {
  return (
    (await database.getOptional(
      `SELECT id, action, client_action_id, idempotency_key
       FROM pending_write_context
       WHERE table_name = ? AND row_id = ?
       ORDER BY created_at DESC
       LIMIT 1`,
      [table, rowId],
    )) ?? null
  );
}

function inferAction(mutation: UploadMutation): string {
  switch (mutation.op) {
    case "insert":
      return "create";
    case "delete":
      return "delete";
    case "update":
      return "edit";
    default:
      return "edit";
  }
}

function contextKey(table: string, rowId: string): string {
  return `${table}:${rowId}`;
}

function isRecoverableTable(table: string): boolean {
  return ["areas", "items", "recurring_task_templates", "user_settings"].includes(table);
}

function isStringRecord(value: unknown): value is Record<string, string> {
  return (
    value !== null &&
    typeof value === "object" &&
    Object.values(value).every((entry) => typeof entry === "string")
  );
}

function optionalString(value: unknown): string | undefined {
  return typeof value === "string" ? value : undefined;
}

function optionalNumber(value: unknown): number | undefined {
  return typeof value === "number" ? value : undefined;
}

function isPresent<T>(value: T | null): value is T {
  return value !== null;
}

function isDefined<T>(value: T | undefined): value is T {
  return value !== undefined;
}

function createUuid(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return "10000000-1000-4000-8000-100000000000".replace(/[018]/g, (char) =>
    (Number(char) ^ (Math.random() * 16)).toString(16),
  );
}
