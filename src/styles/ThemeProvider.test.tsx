import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import { Button } from "@/components/primitives/Button";
import { ThemeProvider, useTheme } from "@/styles/ThemeProvider";

function ThemeProbe() {
  const {
    background,
    hasBackground,
    resetBackground,
    setBuiltInBackground,
    setCustomBackground,
    setThemeMode,
    themeMode,
  } = useTheme();

  return (
    <div>
      <span data-testid="theme-mode">{themeMode}</span>
      <span data-testid="background-state">{hasBackground ? "on" : "off"}</span>
      <span data-testid="background-mode">{background.mode}</span>
      <Button onClick={() => setThemeMode("dark")}>Dark</Button>
      <Button onClick={() => setBuiltInBackground("calm-field")}>Background</Button>
      <Button onClick={() => setCustomBackground("asset-1", "blob:test")}>Custom</Button>
      <Button onClick={resetBackground}>Reset</Button>
    </div>
  );
}

describe("ThemeProvider", () => {
  it("stores theme selection and background mode on the root", async () => {
    const user = userEvent.setup();

    render(
      <ThemeProvider>
        <ThemeProbe />
      </ThemeProvider>,
    );

    expect(screen.getByTestId("theme-mode")).toHaveTextContent("system");
    expect(screen.getByTestId("background-state")).toHaveTextContent("off");

    await user.click(screen.getByRole("button", { name: "Dark" }));
    expect(screen.getByTestId("theme-mode")).toHaveTextContent("dark");
    expect(screen.getByTestId("theme-mode").closest(".theme-root")).toHaveAttribute(
      "data-theme",
      "dark",
    );

    await user.click(screen.getByRole("button", { name: "Background" }));
    expect(screen.getByTestId("background-state")).toHaveTextContent("off");
    expect(screen.getByTestId("background-mode")).toHaveTextContent("built_in");
    expect(screen.getByTestId("background-state").closest(".theme-root")).toHaveAttribute(
      "data-background",
      "none",
    );

    await user.click(screen.getByRole("button", { name: "Reset" }));
    expect(screen.getByTestId("background-state")).toHaveTextContent("off");
  });

  it("supports custom local image background state", async () => {
    const user = userEvent.setup();

    render(
      <ThemeProvider>
        <ThemeProbe />
      </ThemeProvider>,
    );

    await user.click(screen.getByRole("button", { name: "Custom" }));

    expect(screen.getByTestId("background-mode")).toHaveTextContent("custom_image");
    expect(screen.getByTestId("background-state").closest(".theme-root")).toHaveAttribute(
      "data-background",
      "custom_image",
    );
  });
});
