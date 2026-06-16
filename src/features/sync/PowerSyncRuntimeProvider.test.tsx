import { render, screen, waitFor } from "@testing-library/react";
import type { PropsWithChildren } from "react";
import { describe, expect, it, vi } from "vitest";

import type { StoredAuthSession } from "@/features/auth/authStorage";
import { testPowerSyncConnect, testPowerSyncDisconnectAndClear } from "@/test/setup";

import { AuthProvider, useAuth } from "../auth/AuthProvider";
import { PowerSyncRuntimeProvider, usePowerSyncRuntime } from "./PowerSyncRuntimeProvider";

vi.mock("@/repositories/powersync/connector", () => ({
  createYasumiPowerSyncConnector: vi.fn((options: unknown) => ({ options })),
}));

function RuntimeProbe() {
  const { logout } = useAuth();
  const runtime = usePowerSyncRuntime();

  return (
    <>
      <p data-testid="device">{runtime.deviceId}</p>
      <p data-testid="state">{runtime.lifecycleState}</p>
      <button onClick={() => void logout()} type="button">
        logout
      </button>
    </>
  );
}

function TestProviders({ children }: PropsWithChildren) {
  return (
    <AuthProvider>
      <PowerSyncRuntimeProvider>{children}</PowerSyncRuntimeProvider>
    </AuthProvider>
  );
}

describe("PowerSyncRuntimeProvider", () => {
  it("connects after sign-in and clears the runtime on sign-out", async () => {
    seedSession();

    render(
      <TestProviders>
        <RuntimeProbe />
      </TestProviders>,
    );

    await waitFor(() => expect(testPowerSyncConnect).toHaveBeenCalledTimes(1));
    expect(await screen.findByTestId("device")).toHaveTextContent("device-test");

    screen.getByRole("button", { name: "logout" }).click();

    await waitFor(() => expect(testPowerSyncDisconnectAndClear).toHaveBeenCalled());
  });
});

function seedSession() {
  const session: StoredAuthSession = {
    accessToken: "test-access-token",
    expiresAt: "2099-01-01T00:00:00Z",
    refreshToken: "test-refresh-token",
    user: {
      display_name: "Test User",
      email: "test-user@example.com",
      id: "test-user",
      username: "test-user",
    },
  };

  localStorage.setItem("yasumi:auth-session", JSON.stringify(session));
  localStorage.setItem("yasumi:device-id", "device-test");
}
