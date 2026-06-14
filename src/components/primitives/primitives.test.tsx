import { Check, MoreHorizontal } from "lucide-react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { DenseItemRow } from "@/components/items/DenseItemRow";
import { IconButton } from "@/components/primitives/Button";
import { SegmentedControl } from "@/components/primitives/ChoiceControls";

describe("primitives", () => {
  it("requires icon buttons to expose an accessible name", () => {
    render(
      <IconButton
        aria-label="Complete item"
        icon={<Check aria-hidden="true" size={16} />}
        tooltip="Complete item"
      />,
    );

    expect(screen.getByRole("button", { name: "Complete item" })).toBeInTheDocument();
  });

  it("supports segmented selection without losing accessible state", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();

    render(
      <SegmentedControl
        aria-label="Theme"
        onChange={onChange}
        options={[
          { label: "Light", value: "light" },
          { label: "Dark", value: "dark" },
        ]}
        value="light"
      />,
    );

    expect(screen.getByRole("button", { name: "Light" })).toHaveAttribute("aria-pressed", "true");
    await user.click(screen.getByRole("button", { name: "Dark" }));
    expect(onChange).toHaveBeenCalledWith("dark");
  });

  it("renders dense item rows with stable action regions", () => {
    render(
      <DenseItemRow
        actions={
          <IconButton
            aria-label="More actions"
            icon={<MoreHorizontal aria-hidden="true" size={16} />}
          />
        }
        completeActionLabel="Complete"
        date="2026-06-14"
        moreActionLabel="More actions"
        reasons={["Scheduled today"]}
        state="recommended"
        title="Plan second phase visual foundation"
      />,
    );

    expect(screen.getByText("Plan second phase visual foundation")).toBeInTheDocument();
    expect(screen.getByText("2026-06-14")).toBeInTheDocument();
    expect(screen.getByText("Scheduled today")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Complete" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "More actions" })).toBeInTheDocument();
  });
});
