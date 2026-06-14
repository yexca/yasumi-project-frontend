import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it } from "vitest";

import { App } from "@/app/App";
import { seedAuthSession } from "@/test/setup";

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
    seedAuthSession();

    render(<App />);

    expect(await screen.findByRole("heading", { name: "Today", level: 2 })).toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: "Offline" })).toHaveLength(2);
  });

  it("shows pending state after a local Quick Add write", async () => {
    Object.defineProperty(navigator, "onLine", {
      configurable: true,
      value: true,
    });
    window.history.pushState({}, "", "/inbox");
    seedAuthSession();
    const user = userEvent.setup();

    render(<App />);

    await screen.findByRole("heading", { name: "Inbox", level: 2 });
    await user.click(firstButton("Quick Add"));
    await user.type(await screen.findByLabelText("Source text"), "Call venue tomorrow");
    await user.click(screen.getByRole("button", { name: "Save as Inbox" }));

    expect(await screen.findByText("Call venue tomorrow")).toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: "Saved on this device (1)" })).toHaveLength(2);
    expect(screen.getByText("Saved on this device")).toBeInTheDocument();
  });
});

function firstButton(name: string): HTMLElement {
  const [button] = screen.getAllByRole("button", { name });

  if (!button) {
    throw new Error(`Missing button: ${name}`);
  }

  return button;
}
