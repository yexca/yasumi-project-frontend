import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import { App } from "@/app/App";

describe("phase 04 pages and action surfaces", () => {
  it("renders Today sections in planning order with recommendation reasons", async () => {
    window.history.pushState({}, "", "/today");

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
    const user = userEvent.setup();

    render(<App />);

    await user.click(await screen.findByRole("button", { name: "Quick Add" }));
    await user.type(
      screen.getByLabelText("Source text"),
      "Deadline Send renewal decision by 2026-06-16",
    );

    expect(screen.getByRole("dialog", { name: "Quick Add" })).toBeInTheDocument();
    expect(screen.getByText("Deadline task")).toBeInTheDocument();
    expect(screen.getAllByText(/2026-06-16/).length).toBeGreaterThan(0);
    expect(screen.getByRole("button", { name: "Save as Inbox" })).toBeInTheDocument();
  });

  it("shows state-specific item actions from one shared path", async () => {
    cleanup();
    window.history.pushState({}, "", "/completed");
    const user = userEvent.setup();

    render(<App />);

    expect(await screen.findByText("Clean up old capture notes")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Reopen" })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "More actions" }));
    expect(screen.getByRole("menuitem", { name: "Archive" })).toBeInTheDocument();
  });

  it("renders area shortcuts in sorted order and area-scoped rows", async () => {
    cleanup();
    window.history.pushState({}, "", "/areas/area-work");

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

    render(<App />);

    expect(await screen.findByLabelText("Language")).toBeInTheDocument();
    expect(screen.getByLabelText("App timezone")).toHaveValue("Asia/Tokyo");
    expect(screen.getByLabelText("Date display")).toHaveValue("YYYY-MM-DD");
    expect(screen.getByText("Appearance")).toBeInTheDocument();
  });
});
