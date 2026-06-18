import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it } from "vitest";
import { MemoryRouter } from "react-router";

import { ROUTE_PATHS } from "@/app/router/routes";
import { AppShell } from "@/components/layout/AppShell";
import { AuthProvider } from "@/features/auth/AuthProvider";
import { PowerSyncRuntimeProvider } from "@/features/sync/PowerSyncRuntimeProvider";
import { PlanningDataProvider } from "@/features/planning/usePlanningData";
import { I18nProvider } from "@/i18n/I18nProvider";
import { seedAuthSession } from "@/test/setup";
import { ThemeProvider } from "@/styles/ThemeProvider";

import { SettingsPage } from "./SettingsPage";

function renderSettings() {
  render(
    <MemoryRouter initialEntries={[ROUTE_PATHS.settings]}>
      <AuthProvider>
        <PowerSyncRuntimeProvider>
          <PlanningDataProvider>
            <I18nProvider>
              <ThemeProvider>
                <SettingsPage />
              </ThemeProvider>
            </I18nProvider>
          </PlanningDataProvider>
        </PowerSyncRuntimeProvider>
      </AuthProvider>
    </MemoryRouter>,
  );
}

function renderSettingsWithShell() {
  render(
    <MemoryRouter initialEntries={[ROUTE_PATHS.settings]}>
      <AuthProvider>
        <PowerSyncRuntimeProvider>
          <PlanningDataProvider>
            <I18nProvider>
              <ThemeProvider>
                <AppShell>
                  <SettingsPage />
                </AppShell>
              </ThemeProvider>
            </I18nProvider>
          </PlanningDataProvider>
        </PowerSyncRuntimeProvider>
      </AuthProvider>
    </MemoryRouter>,
  );
}

describe("SettingsPage", () => {
  beforeEach(() => {
    seedAuthSession();
  });

  it("stores a validated custom local background image", async () => {
    const user = userEvent.setup();
    const image = new File(["image-bytes"], "background.png", { type: "image/png" });

    renderSettings();

    await user.upload(screen.getByLabelText("Choose image"), image);

    await waitFor(() => {
      expect(screen.getByText("A local background is active.")).toBeInTheDocument();
    });
  });

  it("shows a localized validation error for unsupported background images", () => {
    const textFile = new File(["nope"], "background.txt", { type: "text/plain" });

    renderSettings();

    fireEvent.change(screen.getByLabelText("Choose image"), {
      target: { files: [textFile] },
    });

    expect(screen.getByText("Choose a PNG, JPEG, or WebP image.")).toBeInTheDocument();
  });

  it("updates the synced language setting and refreshes visible labels", async () => {
    const user = userEvent.setup();

    renderSettings();

    await user.selectOptions(screen.getByLabelText("Language"), "zh-Hans");

    expect(await screen.findByRole("heading", { name: "设置" })).toBeInTheDocument();
    expect(screen.getByLabelText("语言")).toHaveValue("zh-Hans");
    expect(screen.queryByLabelText("区域设置")).not.toBeInTheDocument();
  });

  it("shows common timezone choices instead of a free-form technical field", () => {
    renderSettings();

    const timeZone = screen.getByLabelText("App timezone");

    expect(timeZone).toHaveValue("Asia/Tokyo");
    expect(screen.getByRole("option", { name: "Shanghai" })).toHaveValue("Asia/Shanghai");
    expect(screen.getByRole("option", { name: "Tokyo" })).toHaveValue("Asia/Tokyo");
    expect(screen.getByRole("option", { name: "London" })).toHaveValue("Europe/London");
    expect(screen.getByRole("option", { name: "New York" })).toHaveValue("America/New_York");
  });

  it("hides fixed display previews and updates timezone from the curated list", async () => {
    const user = userEvent.setup();

    renderSettings();

    const timeZone = screen.getByLabelText("App timezone");
    await user.selectOptions(timeZone, "Asia/Tokyo");

    expect(timeZone).toHaveValue("Asia/Tokyo");
    expect(screen.queryByLabelText("Date display")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Date-only preview")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Local date-time preview")).not.toBeInTheDocument();
  });

  it("shows personal profile, password, and weather city settings", () => {
    renderSettings();

    expect(screen.getByLabelText("Display name")).toBeInTheDocument();
    expect(screen.getByLabelText(/Current password/)).toBeInTheDocument();
    expect(screen.getByLabelText(/New password/)).toBeInTheDocument();
    expect(screen.getByLabelText("Weather city")).toHaveValue("Tokyo");
  });

  it("allows customizing mobile bottom bar shortcuts", async () => {
    const user = userEvent.setup();

    renderSettings();

    const firstShortcut = screen.getByLabelText("Shortcut 1");
    await user.selectOptions(firstShortcut, " /deadlines".trim());

    expect(firstShortcut).toHaveValue("/deadlines");
    expect(screen.getByLabelText("Shortcut 2")).toHaveValue("/inbox");
    expect(screen.getByLabelText("Shortcut 3")).toHaveValue("/upcoming");
  });

  it("updates the app shell mobile bottom bar immediately after changing a shortcut", async () => {
    const user = userEvent.setup();

    renderSettingsWithShell();

    const mobileNav = screen.getByRole("navigation", { name: "Mobile navigation" });
    expect(within(mobileNav).getByText("Today")).toBeInTheDocument();
    expect(within(mobileNav).queryByText("Deadlines")).not.toBeInTheDocument();

    await user.selectOptions(screen.getByLabelText("Shortcut 1"), ROUTE_PATHS.deadlines);

    await waitFor(() => {
      expect(within(mobileNav).getByText("Deadlines")).toBeInTheDocument();
    });
    expect(within(mobileNav).queryByText("Today")).not.toBeInTheDocument();
  });

  it("keeps mobile bottom bar shortcut controls usable, including reset", async () => {
    const user = userEvent.setup();

    renderSettings();

    await user.selectOptions(screen.getByLabelText("Shortcut 1"), ROUTE_PATHS.deadlines);
    await user.click(screen.getByRole("button", { name: "Reset shortcuts" }));

    expect(screen.getByLabelText("Shortcut 1")).toHaveValue(ROUTE_PATHS.today);
    expect(screen.getByLabelText("Shortcut 2")).toHaveValue(ROUTE_PATHS.inbox);
    expect(screen.getByLabelText("Shortcut 3")).toHaveValue(ROUTE_PATHS.upcoming);
  });
});
