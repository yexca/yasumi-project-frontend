import { useQuery } from "@tanstack/react-query";

import { directApiJson } from "./client";
import { getPowerSyncEndpoint } from "./config";
import { parseSyncTokenResponseDto } from "./dtos";

export type SyncTokenRequest = {
  accessToken: string | null;
  clientVersion: string;
  deviceId: string;
};

export async function requestSyncToken({ accessToken, clientVersion, deviceId }: SyncTokenRequest) {
  if (!accessToken) {
    return null;
  }

  const response = await directApiJson("/v1/sync/token", {
    accessToken,
    body: {
      client_version: clientVersion,
      device_id: deviceId,
    },
    method: "POST",
    parse: parseSyncTokenResponseDto,
  });

  return {
    endpoint: getPowerSyncEndpoint(),
    expiresAt: new Date(response.expires_at),
    streamScope: response.stream_scope,
    token: response.token,
  };
}

export function useSyncTokenQuery(request: SyncTokenRequest) {
  return useQuery({
    enabled: Boolean(request.accessToken),
    queryFn: () => requestSyncToken(request),
    queryKey: ["sync-token", request.deviceId, request.clientVersion],
    retry: 1,
    staleTime: 30_000,
  });
}
