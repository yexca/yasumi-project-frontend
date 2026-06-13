import { render, screen } from "@testing-library/react";
import { cleanup } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { App } from "@/app/App";

describe("App", () => {
  it("renders the app shell with Today as the default entry", async () => {
    window.history.pushState({}, "", "/");

    render(<App />);

    expect(await screen.findByRole("heading", { name: "Today", level: 1 })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Quick Add" })).toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: "Local sync not connected" })).toHaveLength(2);
  });

  it("renders a placeholder for each MVP route", async () => {
    cleanup();
    window.history.pushState({}, "", "/archive");

    render(<App />);

    expect(await screen.findByRole("heading", { name: "Archive", level: 1 })).toBeInTheDocument();
    expect(
      screen.getAllByText("Recoverable history and archived work will appear here.").length,
    ).toBeGreaterThan(0);
  });
});
