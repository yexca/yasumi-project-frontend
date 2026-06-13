import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it } from "vitest";

import { App } from "@/app/App";

describe("phase 05 sync UI states", () => {
  afterEach(() => {
    Object.defineProperty(navigator, "onLine", {
      configurable: true,
      value: true,
    });
  });

  it("shows offline mode without blocking navigation", async () => {
    Object.defineProperty(navigator, "onLine", {
      configurable: true,
      value: false,
    });
    window.history.pushState({}, "", "/today");

    render(<App />);

    expect(await screen.findByRole("heading", { name: "Today", level: 1 })).toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: "Offline" })).toHaveLength(2);
  });

  it("shows pending state after a local Quick Add write", async () => {
    Object.defineProperty(navigator, "onLine", {
      configurable: true,
      value: true,
    });
    window.history.pushState({}, "", "/inbox");
    const user = userEvent.setup();

    render(<App />);

    await user.click(await screen.findByRole("button", { name: "Quick Add" }));
    await user.type(screen.getByLabelText("Source text"), "Call venue tomorrow");
    await user.click(screen.getByRole("button", { name: "Save as Inbox" }));

    expect(await screen.findByText("Call venue tomorrow")).toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: "Saved on this device (1)" })).toHaveLength(2);
    expect(screen.getByText("Saved on this device")).toBeInTheDocument();
  });
});
