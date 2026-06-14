import { directApiJson } from "@/repositories/direct-api/client";

type SyncUploadResponse = {
  accepted: unknown[];
  client_batch_id: string;
};

export function flushLocalSync(accessToken: string, deviceId: string): Promise<SyncUploadResponse> {
  return directApiJson("/sync/upload", {
    accessToken,
    body: {
      client_batch_id: `local-ui-${Date.now()}`,
      device_id: deviceId,
      mutations: [],
    },
    method: "POST",
    parse(input) {
      return input as SyncUploadResponse;
    },
  });
}
