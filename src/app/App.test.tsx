import { render, screen, within } from "@testing-library/react";
import { cleanup } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { App } from "@/app/App";
import { seedAuthSession } from "@/test/setup";

describe("App", () => {
  it("renders the app shell with Today as the default entry", async () => {
    window.history.pushState({}, "", "/");
    seedAuthSession();

    render(<App />);

    expect(await screen.findByRole("heading", { name: "Today", level: 2 })).toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: "Quick Add" }).length).toBeGreaterThan(0);
    expect(screen.getAllByRole("button", { name: "Synced" })).toHaveLength(2);
  });

  it("renders the archive route inside the app shell", async () => {
    cleanup();
    window.history.pushState({}, "", "/archive");
    seedAuthSession();

    render(<App />);

    expect(await screen.findByRole("heading", { name: "Archive", level: 2 })).toBeInTheDocument();
    expect(
      screen.getAllByText("Review archived, abandoned, and recoverable work history.").length,
    ).toBeGreaterThan(0);
  });

  it("shows authentication before normal app use without a local session", async () => {
    window.history.pushState({}, "", "/");

    render(<App />);

    expect(await screen.findByRole("heading", { name: "Sign in to Yasumi" })).toBeInTheDocument();
    const tablist = screen.getByRole("tablist", { name: "Authentication mode" });
    expect(within(tablist).getByRole("button", { name: "Login" })).toBeInTheDocument();
    expect(within(tablist).getByRole("button", { name: "Register" })).toBeInTheDocument();
  });
});
