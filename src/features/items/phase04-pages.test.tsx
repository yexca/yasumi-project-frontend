import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import { App } from "@/app/App";
import { seedAuthSession } from "@/test/setup";

describe("phase 04 pages and action surfaces", () => {
  it("renders Today sections in planning order with recommendation reasons", async () => {
    window.history.pushState({}, "", "/today");
    seedAuthSession();

    render(<App />);

    const carried = await screen.findByRole("heading", { name: "Carried Forward" });
    const scheduled = screen.getByRole("heading", { name: "Scheduled Today", level: 3 });
    const primary = screen.getByRole("heading", { name: "Primary Recommendations" });

    expect(
      carried.compareDocumentPosition(scheduled) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
    expect(
      scheduled.compareDocumentPosition(primary) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
    expect(screen.getByText("Review launch checklist")).toBeInTheDocument();
    expect(screen.getByText("Send renewal decision")).toBeInTheDocument();
    expect(screen.getAllByText("Deadline soon").length).toBeGreaterThan(0);
  });

  it("opens Quick Add and shows a deterministic parser preview", async () => {
    cleanup();
    window.history.pushState({}, "", "/inbox");
    seedAuthSession();
    const user = userEvent.setup();

    render(<App />);

    await screen.findByRole("heading", { name: "Inbox", level: 2 });
    await user.click(firstButton("Quick Add"));
    await user.type(
      screen.getByLabelText("Source text"),
      "Deadline Send renewal decision by 2026-06-16",
    );

    expect(screen.getByRole("dialog", { name: "Quick Add" })).toBeInTheDocument();
    expect(screen.getByText("Deadline task")).toBeInTheDocument();
    expect(screen.getAllByText(/2026-06-16/).length).toBeGreaterThan(0);
    expect(screen.getByRole("button", { name: "Save as Inbox" })).toBeInTheDocument();
  });

  it("keeps Inbox completion unavailable while detail stays reviewable", async () => {
    cleanup();
    window.history.pushState({}, "", "/inbox");
    seedAuthSession();
    const user = userEvent.setup();

    render(<App />);

    await screen.findByRole("heading", { name: "Inbox", level: 2 });
    const completeButtons = screen.getAllByRole("button", { name: "Complete" });
    expect(completeButtons.some((button) => button.hasAttribute("disabled"))).toBe(true);

    await user.click(screen.getByText("Ask Mei about the invoice date"));
    const detail = screen.getByLabelText("Item detail");
    const detailHeading = within(detail).getByRole("heading", {
      name: "Ask Mei about the invoice date",
    });
    const statusLabel = within(detail).getByText("Status");
    expect(detailHeading).toBeInTheDocument();
    expect(
      detailHeading.compareDocumentPosition(statusLabel) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
  });

  it("shows city weather in the shell header", async () => {
    cleanup();
    window.history.pushState({}, "", "/today");
    seedAuthSession();

    render(<App />);

    expect(await screen.findByLabelText("Weather")).toHaveTextContent("Tokyo 24°C");
  });

  it("shows state-specific item actions from one shared path", async () => {
    cleanup();
    window.history.pushState({}, "", "/completed");
    seedAuthSession();
    const user = userEvent.setup();

    render(<App />);

    expect(await screen.findByText("Clean up old capture notes")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Reopen" })).toBeInTheDocument();
    await user.click(firstButton("More actions"));
    expect(screen.getByRole("menuitem", { name: "Archive" })).toBeInTheDocument();
  });

  it("renders area shortcuts in sorted order and area-scoped rows", async () => {
    cleanup();
    window.history.pushState({}, "", "/areas/area-work");
    seedAuthSession();

    render(<App />);

    const nav = await screen.findByLabelText("Primary navigation");
    const links = within(nav)
      .getAllByRole("link")
      .map((link) => link.textContent);

    expect(links.indexOf("Work")).toBeLessThan(links.indexOf("Home"));
    expect(await screen.findByRole("heading", { name: "Work", level: 2 })).toBeInTheDocument();
    expect(screen.getByText("Draft roadmap update")).toBeInTheDocument();
  });

  it("includes synced settings and local visual settings on Settings", async () => {
    cleanup();
    window.history.pushState({}, "", "/settings");
    seedAuthSession();

    render(<App />);

    const main = await screen.findByRole("main");
    expect(within(main).getByLabelText("Language")).toBeInTheDocument();
    expect(within(main).getByLabelText("App timezone")).toBeInTheDocument();
    expect(within(main).queryByLabelText("Date display")).not.toBeInTheDocument();
    expect(screen.getByText("Appearance")).toBeInTheDocument();
  });
});

function firstButton(name: string): HTMLElement {
  const [button] = screen.getAllByRole("button", { name });

  if (!button) {
    throw new Error(`Missing button: ${name}`);
  }

  return button;
}
