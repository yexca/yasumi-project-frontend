import { act, render, screen, within } from "@testing-library/react";
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
    await user.type(await screen.findByLabelText("Task name"), "tomorrow have a meeting");
    const dialog = screen.getByRole("dialog", { name: "Quick Add" });
    expect(within(dialog).getByText("Date task", { selector: "dd" })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Save" }));

    expect(await screen.findByText("have a meeting")).toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: "Saved on this device (1)" })).toHaveLength(2);
    expect(screen.getByText("Saved on this device")).toBeInTheDocument();
  });

  it("shows pending state after creating a deadline task with a manual deadline date", async () => {
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
    const dialog = screen.getByRole("dialog", { name: "Quick Add" });
    await user.type(within(dialog).getByLabelText("Task name"), "Renew passport");
    await user.selectOptions(within(dialog).getByLabelText("Task type"), "deadline_task");
    await user.clear(within(dialog).getByLabelText("Deadline date"));
    await user.type(within(dialog).getByLabelText("Deadline date"), "2026-07-12");
    await user.click(screen.getByRole("button", { name: "Save" }));

    act(() => {
      window.history.pushState({}, "", "/deadlines");
      window.dispatchEvent(new PopStateEvent("popstate"));
    });

    expect(await screen.findByText("Renew passport")).toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: "Saved on this device (1)" })).toHaveLength(2);
  });

  it("lets parsed dates override the Today Quick Add baseline", async () => {
    Object.defineProperty(navigator, "onLine", {
      configurable: true,
      value: true,
    });
    window.history.pushState({}, "", "/today");
    seedAuthSession();
    const user = userEvent.setup();

    render(<App />);

    await screen.findByRole("heading", { name: "Today", level: 2 });
    await user.click(firstButton("Quick Add"));
    const dialog = screen.getByRole("dialog", { name: "Quick Add" });

    expect(within(dialog).getByLabelText("Scheduled date")).toHaveValue("2026-06-14");
    await user.type(within(dialog).getByLabelText("Task name"), "tomorrow have a meeting");
    expect(within(dialog).getByLabelText("Scheduled date")).toHaveValue("2026-06-15");

    await user.click(screen.getByRole("button", { name: "Save" }));

    act(() => {
      window.history.pushState({}, "", "/upcoming");
      window.dispatchEvent(new PopStateEvent("popstate"));
    });

    expect(await screen.findByText("have a meeting")).toBeInTheDocument();
    expect(screen.getAllByText("2026-06-15").length).toBeGreaterThan(0);
  });
});

function firstButton(name: string): HTMLElement {
  const [button] = screen.getAllByRole("button", { name });

  if (!button) {
    throw new Error(`Missing button: ${name}`);
  }

  return button;
}
