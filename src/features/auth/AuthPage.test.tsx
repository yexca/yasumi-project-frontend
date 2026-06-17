import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import { AppProviders } from "@/app/providers/AppProviders";
import { useSyncUiState } from "@/features/planning/PlanningDataProvider";

import { AuthPage } from "./AuthPage";

function SyncStateProbe() {
  const state = useSyncUiState();

  return <output data-testid="sync-label">{state.labelKey}</output>;
}

describe("AuthPage", () => {
  it("switches language immediately while signed out without creating rejected sync state", async () => {
    const user = userEvent.setup();

    render(
      <AppProviders>
        <AuthPage />
        <SyncStateProbe />
      </AppProviders>,
    );

    expect(screen.getByRole("heading", { name: "Sign in to Yasumi" })).toBeInTheDocument();
    expect(screen.getByTestId("sync-label")).toHaveTextContent("sync.synced");

    await user.selectOptions(screen.getByRole("combobox", { name: "Language" }), "zh-Hans");

    expect(screen.getByRole("heading", { name: "登录 Yasumi" })).toBeInTheDocument();
    expect(screen.getByTestId("sync-label")).toHaveTextContent("sync.synced");
    expect(localStorage.getItem("yasumi:pre-auth-language")).toBe("zh-Hans");
  });
});
