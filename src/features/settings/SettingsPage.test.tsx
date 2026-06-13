import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import { I18nProvider } from "@/i18n/I18nProvider";
import { ThemeProvider } from "@/styles/ThemeProvider";

import { SettingsPage } from "./SettingsPage";

function renderSettings() {
  render(
    <I18nProvider>
      <ThemeProvider>
        <SettingsPage />
      </ThemeProvider>
    </I18nProvider>,
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
});
