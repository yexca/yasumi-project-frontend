import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import {
  buildOrdinaryActionKey,
  PlanningDataProvider,
  usePlanningData,
  usePlanningMutations,
  useSyncUiState,
} from "./usePlanningData";

describe("phase 05 local-first mutations", () => {
  it("appends operation history and keeps the same idempotency format for a semantic action", async () => {
    const user = userEvent.setup();

    render(
      <PlanningDataProvider>
        <MutationProbe />
      </PlanningDataProvider>,
    );

    await user.click(screen.getByRole("button", { name: "Complete fixture item" }));

    expect(screen.getByTestId("item-status")).toHaveTextContent("completed");
    expect(screen.getByTestId("last-event")).toHaveTextContent("completed");
    expect(screen.getByTestId("last-idempotency-key")).toHaveTextContent(
      /^action:fixture-user:device-/,
    );
    expect(screen.getByTestId("sync-label")).toHaveTextContent("sync.pending:1");
  });

  it("keeps rejected local context without rendering backend diagnostic messages", async () => {
    const user = userEvent.setup();

    render(
      <PlanningDataProvider>
        <MutationProbe />
      </PlanningDataProvider>,
    );

    await user.click(screen.getByRole("button", { name: "Reject invalid classification" }));

    expect(screen.getByTestId("sync-label")).toHaveTextContent("sync.validationRejected:1");
    expect(screen.getByTestId("item-sync-state")).toHaveTextContent("rejected");
    expect(screen.getByTestId("rejected-field")).toHaveTextContent("scheduled_date");
  });

  it("builds contract idempotency keys without regenerating retry keys", () => {
    const key = buildOrdinaryActionKey("user-01", "device-01", "client-action-01");

    expect(key).toBe("action:user-01:device-01:client-action-01");
    expect(buildOrdinaryActionKey("user-01", "device-01", "client-action-01")).toBe(key);
  });
});

function MutationProbe() {
  const data = usePlanningData();
  const sync = useSyncUiState();
  const { classifyItem, getItemSyncState, getRejectedContextForRow, runItemAction } =
    usePlanningMutations();
  const item = data.items.find((row) => row.id === "item-today");
  const lastHistory = data.operationHistory.at(-1);
  const rejected = getRejectedContextForRow("item-inbox");

  return (
    <div>
      <button onClick={() => runItemAction("item-today", "complete")} type="button">
        Complete fixture item
      </button>
      <button
        onClick={() =>
          classifyItem("item-inbox", {
            deadlineDate: null,
            scheduledDate: null,
            targetType: "date_task",
          })
        }
        type="button"
      >
        Reject invalid classification
      </button>
      <p data-testid="item-status">{item?.status}</p>
      <p data-testid="last-event">{lastHistory?.event_type}</p>
      <p data-testid="last-idempotency-key">{lastHistory?.idempotency_key}</p>
      <p data-testid="sync-label">
        {sync.labelKey}:{sync.rejectedCount || sync.pendingCount}
      </p>
      <p data-testid="item-sync-state">{getItemSyncState("item-inbox")}</p>
      <p data-testid="rejected-field">{Object.keys(rejected?.fieldErrors ?? {}).join(",")}</p>
    </div>
  );
}
