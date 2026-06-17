import { beforeEach, describe, expect, it, vi } from "vitest";

import { requestSyncToken } from "./syncTokenRepository";

vi.mock("./client", () => ({
  directApiJson: vi.fn(),
}));

vi.mock("./config", () => ({
  getPowerSyncEndpoint: vi.fn(() => "/powersync"),
}));

describe("requestSyncToken", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("prefers the endpoint returned by the backend", async () => {
    const { directApiJson } = await import("./client");
    vi.mocked(directApiJson).mockResolvedValue({
      endpoint: "https://sync.example.test/ws",
      expires_at: "2026-06-17T00:00:00Z",
      stream_scope: { user_id: "user-01" },
      token: "sync-token",
    });

    const token = await requestSyncToken({
      accessToken: "access-token",
      clientVersion: "0.1.0",
      deviceId: "device-01",
    });

    expect(token?.endpoint).toBe("https://sync.example.test/ws");
  });

  it("falls back to the runtime-configured endpoint when the backend does not provide one", async () => {
    const { directApiJson } = await import("./client");
    vi.mocked(directApiJson).mockResolvedValue({
      expires_at: "2026-06-17T00:00:00Z",
      stream_scope: { user_id: "user-01" },
      token: "sync-token",
    });

    const token = await requestSyncToken({
      accessToken: "access-token",
      clientVersion: "0.1.0",
      deviceId: "device-01",
    });

    expect(token?.endpoint).toBe("/powersync");
  });
});
