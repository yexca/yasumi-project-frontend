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

      const response = await fetch(`${getBackendBaseUrl()}/v1/sync/upload`, {
        body: JSON.stringify({
          client_batch_id: `batch-${transaction.transactionId ?? "untracked"}`,
          device_id: deviceId,
          mutations: transaction.crud.map((entry) => entry.toJSON()),
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
