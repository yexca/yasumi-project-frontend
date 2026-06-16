import type { AbstractPowerSyncDatabase, PowerSyncBackendConnector } from "@powersync/web";

import { getBackendBaseUrl, getPowerSyncEndpoint } from "@/repositories/direct-api/config";
import { requestSyncToken } from "@/repositories/direct-api/syncTokenRepository";

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

      const mutations = transaction.crud.map((entry) => {
        const crud = entry.toJSON();
        const oldValues = (crud.old ?? {}) as Record<string, unknown>;
        const row = {
          id: crud.id,
          ...(crud.data ?? {}),
        };

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
      });

      const response = await fetch(`${getBackendBaseUrl()}/v1/sync/upload`, {
        body: JSON.stringify({
          client_batch_id: `batch-${transaction.transactionId ?? "untracked"}`,
          device_id: deviceId,
          mutations,
        }),
        headers: {
          Authorization: accessToken ? `Bearer ${accessToken}` : "",
          "Content-Type": "application/json; charset=utf-8",
        },
        method: "POST",
      });

      if (!response.ok) {
        throw new Error("sync_upload_failed");
      }

      await transaction.complete();
    },
  };
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

function optionalString(value: unknown): string | undefined {
  return typeof value === "string" ? value : undefined;
}

function optionalNumber(value: unknown): number | undefined {
  return typeof value === "number" ? value : undefined;
}
