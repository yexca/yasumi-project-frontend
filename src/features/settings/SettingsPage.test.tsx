import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import { PlanningDataProvider } from "@/features/planning/usePlanningData";
import { I18nProvider } from "@/i18n/I18nProvider";
import { ThemeProvider } from "@/styles/ThemeProvider";

import { SettingsPage } from "./SettingsPage";

function renderSettings() {
  render(
    <PlanningDataProvider>
      <I18nProvider>
        <ThemeProvider>
          <SettingsPage />
        </ThemeProvider>
      </I18nProvider>
    </PlanningDataProvider>,
  );
}

describe("SettingsPage", () => {
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
});
