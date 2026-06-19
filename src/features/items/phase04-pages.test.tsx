import { act, cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import { App } from "@/app/App";
import { seedAuthSession } from "@/test/setup";

const originalInnerWidth = window.innerWidth;
const originalMatchMedia = window.matchMedia;

afterEach(() => {
  Object.defineProperty(window, "innerWidth", {
    configurable: true,
    value: originalInnerWidth,
    writable: true,
  });
  window.matchMedia = originalMatchMedia;
});

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
    const sourceText = await screen.findByLabelText("Task name");
    await user.type(sourceText, "Deadline Send renewal decision by 2026-06-16");

    const dialog = screen.getByRole("dialog", { name: "Quick Add" });
    expect(dialog).toBeInTheDocument();
    expect(within(dialog).getByLabelText("Task type")).toHaveValue("none");
    await user.selectOptions(within(dialog).getByLabelText("Task type"), "deadline_task");
    expect(within(dialog).getByLabelText("Deadline date")).toHaveValue("2026-06-16");
    expect(screen.getByRole("button", { name: "Save" })).toBeInTheDocument();
  });

  it("allows Quick Add to create a deadline task with a manual deadline date", async () => {
    cleanup();
    window.history.pushState({}, "", "/inbox");
    seedAuthSession();
    const user = userEvent.setup();

    render(<App />);

    await screen.findByRole("heading", { name: "Inbox", level: 2 });
    await user.click(firstButton("Quick Add"));
    const dialog = screen.getByRole("dialog", { name: "Quick Add" });
    await user.type(within(dialog).getByLabelText("Task name"), "Plan tax submission");
    await user.selectOptions(within(dialog).getByLabelText("Task type"), "deadline_task");
    await user.clear(within(dialog).getByLabelText("Deadline date"));
    await user.type(within(dialog).getByLabelText("Deadline date"), "2026-07-01");
    await user.click(screen.getByRole("button", { name: "Save" }));

    act(() => {
      window.history.pushState({}, "", "/deadlines");
      window.dispatchEvent(new PopStateEvent("popstate"));
    });

    expect(await screen.findByText("Plan tax submission")).toBeInTheDocument();
    await user.click(screen.getByText("Plan tax submission"));
    const detail = screen.getByLabelText("Item detail");
    expect(within(detail).getByText("2026-07-01")).toBeInTheDocument();
  });

  it("allows Inbox completion while detail stays editable", async () => {
    cleanup();
    window.history.pushState({}, "", "/inbox");
    seedAuthSession();
    const user = userEvent.setup();

    render(<App />);

    await screen.findByRole("heading", { name: "Inbox", level: 2 });
    const completeButtons = screen.getAllByRole("button", { name: "Complete" });
    expect(completeButtons.some((button) => button.hasAttribute("disabled"))).toBe(false);

    await user.click(screen.getByText("Ask Mei about the invoice date"));
    const detail = screen.getByLabelText("Item detail");
    const detailHeading = within(detail).getByRole("heading", {
      name: "Ask Mei about the invoice date",
    });
    const statusLabel = within(detail).getByText("Status");
    expect(detailHeading).toBeInTheDocument();
    expect(
      within(detail).getByPlaceholderText("Add a short description here."),
    ).toBeInTheDocument();
    expect(
      detailHeading.compareDocumentPosition(statusLabel) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();

    await user.click(completeButtons[0]!);
    expect(screen.getByRole("button", { name: "Undo" })).toBeInTheDocument();
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

  it("creates a new area from the Areas page", async () => {
    cleanup();
    window.history.pushState({}, "", "/areas");
    seedAuthSession();
    const user = userEvent.setup();

    render(<App />);

    await screen.findByRole("heading", { name: "Areas", level: 2 });
    await user.click(screen.getByRole("button", { name: "Create area" }));
    const dialog = screen.getByRole("dialog", { name: "Create area" });
    await user.type(within(dialog).getByRole("textbox", { name: /Area/ }), "Errands");
    await user.click(within(dialog).getByRole("button", { name: "Create area" }));

    expect(await screen.findByRole("heading", { name: "Errands", level: 3 })).toBeInTheDocument();
  });

  it("includes synced settings and local visual settings on Settings", async () => {
    cleanup();
    window.history.pushState({}, "", "/settings");
    seedAuthSession();

    render(<App />);

    await screen.findByLabelText("App timezone");
    const main = screen.getByRole("main");
    expect(within(main).getByLabelText("Language")).toBeInTheDocument();
    expect(within(main).getByLabelText("App timezone")).toBeInTheDocument();
    expect(within(main).queryByLabelText("Date display")).not.toBeInTheDocument();
    expect(screen.getByText("Appearance")).toBeInTheDocument();
  });

  it("keeps a floating Quick Add button on mobile", async () => {
    cleanup();
    Object.defineProperty(window, "innerWidth", {
      configurable: true,
      value: 390,
      writable: true,
    });
    window.matchMedia = vi.fn().mockImplementation((query: string) => ({
      addEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
      matches: query === "(max-width: 760px)" || query === "(pointer: coarse)",
      media: query,
      onchange: null,
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
    })) as typeof window.matchMedia;

    window.history.pushState({}, "", "/today");
    seedAuthSession();
    const user = userEvent.setup();

    render(<App />);

    await screen.findByRole("heading", { name: "Today", level: 2 });
    await user.click(screen.getAllByRole("button", { name: "Quick Add" }).at(-1)!);

    expect(await screen.findByRole("dialog", { name: "Quick Add" })).toBeInTheDocument();
  });
});

function firstButton(name: string): HTMLElement {
  const [button] = screen.getAllByRole("button", { name });

  if (!button) {
    throw new Error(`Missing button: ${name}`);
  }

  return button;
}
