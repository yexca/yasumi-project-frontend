import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { AbstractPowerSyncDatabase } from "@powersync/web";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { normalizeItemRow, type AreaDto } from "@/domain/items/schemas";

import { useSyncedPlanningStore } from "./useSyncedPlanningStore";

const mocks = vi.hoisted(() => ({
  database: null as FakeDatabase | null,
  queryData: {
    areas: [] as AreaDto[],
    items: [] as unknown[],
    operationHistory: [] as unknown[],
    pendingWrites: [] as unknown[],
    recurringTemplates: [] as unknown[],
    rejectedWrites: [] as unknown[],
    settings: [] as unknown[],
  },
}));

vi.mock("@powersync/react", () => ({
  useQuery: (sql: string) => {
    if (sql.includes("FROM areas")) {
      return { data: mocks.queryData.areas };
    }
    if (sql.includes("FROM items")) {
      return { data: mocks.queryData.items };
    }
    if (sql.includes("FROM operation_history")) {
      return { data: mocks.queryData.operationHistory };
    }
    if (sql.includes("FROM recurring_task_templates")) {
      return { data: mocks.queryData.recurringTemplates };
    }
    if (sql.includes("FROM user_settings")) {
      return { data: mocks.queryData.settings };
    }
    if (sql.includes("FROM rejected_write_context")) {
      return { data: mocks.queryData.rejectedWrites };
    }
    if (sql.includes("FROM pending_write_context")) {
      return { data: mocks.queryData.pendingWrites };
    }

    return { data: [] };
  },
}));

vi.mock("@/features/auth/AuthProvider", () => ({
  useAuth: () => ({
    session: {
      user: {
        id: "user-sync",
      },
    },
  }),
}));

vi.mock("@/features/sync/PowerSyncRuntimeProvider", () => ({
  usePowerSyncRuntime: () => ({
    database: mocks.database?.asPowerSyncDatabase(),
    deviceId: "device-sync",
  }),
}));

describe("useSyncedPlanningStore", () => {
  beforeEach(() => {
    mocks.database = new FakeDatabase();
    mocks.queryData.areas = [buildArea("area-work")];
    mocks.queryData.items = [
      buildItem("item-one", "area-work"),
      buildItem("item-two", "area-work"),
      buildItem("item-other", "area-home"),
    ];
    mocks.queryData.operationHistory = [];
    mocks.queryData.pendingWrites = [];
    mocks.queryData.recurringTemplates = [];
    mocks.queryData.rejectedWrites = [];
    mocks.queryData.settings = [];

    vi.spyOn(globalThis.crypto, "randomUUID").mockImplementation(makeUuidSequence());
  });

  it("writes area pending, item pending, and item operation history for area_and_items deletes", async () => {
    const user = userEvent.setup();
    const database = mocks.database;

    render(<DeleteAreaProbe />);

    await user.click(screen.getByRole("button", { name: "Delete area with items" }));

    await waitFor(() => {
      expect(
        database?.calls.some((call) => call.sql.includes("INSERT INTO operation_history")),
      ).toBe(true);
    });

    const pendingWrites =
      database?.calls.filter((call) => call.sql.includes("pending_write_context")) ?? [];
    const historyWrites =
      database?.calls.filter((call) => call.sql.includes("INSERT INTO operation_history")) ?? [];
    const itemUpdates =
      database?.calls.filter((call) => call.sql.includes("UPDATE items SET deleted_at = ?")) ?? [];

    expect(hasParams(pendingWrites, ["area-work", "areas"])).toBe(true);
    expect(hasParams(pendingWrites, ["delete", "item-one", "items"])).toBe(true);
    expect(hasParams(pendingWrites, ["delete", "item-two", "items"])).toBe(true);
    expect(pendingWrites).toHaveLength(3);
    expect(historyWrites).toHaveLength(2);
    expect(hasParams(historyWrites, ["item-one", "deleted"])).toBe(true);
    expect(hasParams(historyWrites, ["item-two", "deleted"])).toBe(true);
    expect(itemUpdates).toHaveLength(2);
    expect(itemUpdates.map((call) => call.params[call.params.length - 1]).sort()).toEqual([
      "item-one",
      "item-two",
    ]);
    expect(
      historyWrites.every((call) =>
        String(call.params[8]).startsWith("action:user-sync:device-sync:"),
      ),
    ).toBe(true);
  });

  it("commits createCapture item row and pending context in the same transaction", async () => {
    const user = userEvent.setup();
    const database = mocks.database;

    render(<CreateCaptureProbe />);

    await user.click(screen.getByRole("button", { name: "Create capture" }));

    await waitFor(() => {
      expect(database?.calls.some((call) => call.sql.includes("pending_write_context"))).toBe(true);
    });

    const itemWrite = database?.calls.find((call) => call.sql.includes("INSERT INTO items"));
    const pendingWrite = database?.calls.find((call) =>
      call.sql.includes("INSERT OR REPLACE INTO pending_write_context"),
    );

    expect(itemWrite?.params).toContain("Email Aiko");
    expect(pendingWrite?.params).toContain("items");
    expect(pendingWrite?.params).toContain(itemWrite?.params[0]);
    expect(pendingWrite?.transactionId).toBe(itemWrite?.transactionId);
  });

  it("commits createArea row and pending context in the same transaction", async () => {
    const user = userEvent.setup();
    const database = mocks.database;

    render(<CreateAreaProbe />);

    await user.click(screen.getByRole("button", { name: "Create area" }));

    await waitFor(() => {
      expect(database?.calls.some((call) => call.sql.includes("INSERT INTO areas"))).toBe(true);
    });

    const areaWrite = database?.calls.find((call) => call.sql.includes("INSERT INTO areas"));
    const pendingWrite = database?.calls.find((call) =>
      call.sql.includes("INSERT OR REPLACE INTO pending_write_context"),
    );

    expect(areaWrite?.params).toContain("Errands");
    expect(pendingWrite?.params).toContain("areas");
    expect(pendingWrite?.params).toContain(areaWrite?.params[0]);
    expect(pendingWrite?.transactionId).toBe(areaWrite?.transactionId);
  });

  it("does not leave createCapture pending context when item insert fails", async () => {
    const user = userEvent.setup();
    const database = mocks.database;
    database?.failWhen((sql) => sql.includes("INSERT INTO items"));

    render(<CreateCaptureProbe />);

    await user.click(screen.getByRole("button", { name: "Create capture" }));

    await waitFor(() => {
      expect(database?.calls.some((call) => call.sql.includes("rejected_write_context"))).toBe(
        true,
      );
    });

    expect(database?.calls.some((call) => call.sql.includes("INSERT INTO items"))).toBe(false);
    expect(
      database?.calls.some((call) =>
        call.sql.includes("INSERT OR REPLACE INTO pending_write_context"),
      ),
    ).toBe(false);
    expect(
      database?.calls.some(
        (call) => call.sql.includes("rejected_write_context") && call.params.includes("items"),
      ),
    ).toBe(true);
  });

  it("does not leave updateSettings pending context when settings write fails", async () => {
    const user = userEvent.setup();
    const database = mocks.database;
    database?.failWhen((sql) => sql.includes("UPDATE user_settings SET"));

    render(<UpdateSettingsProbe />);

    await user.click(screen.getByRole("button", { name: "Update settings" }));

    await waitFor(() => {
      expect(database?.calls.some((call) => call.sql.includes("rejected_write_context"))).toBe(
        true,
      );
    });

    expect(database?.calls.some((call) => call.sql.includes("UPDATE user_settings SET"))).toBe(
      false,
    );
    expect(
      database?.calls.some((call) =>
        call.sql.includes("INSERT OR REPLACE INTO pending_write_context"),
      ),
    ).toBe(false);
    expect(
      database?.calls.some(
        (call) =>
          call.sql.includes("rejected_write_context") && call.params.includes("user_settings"),
      ),
    ).toBe(true);
  });
});

function CreateCaptureProbe() {
  const store = useSyncedPlanningStore();

  return (
    <button
      onClick={() =>
        store.mutations.createCapture({
          sourceText: "Email Aiko",
          targetItemType: "inbox",
        })
      }
      type="button"
    >
      Create capture
    </button>
  );
}

function DeleteAreaProbe() {
  const store = useSyncedPlanningStore();

  return (
    <button onClick={() => store.mutations.deleteArea("area-work", "area_and_items")} type="button">
      Delete area with items
    </button>
  );
}

function CreateAreaProbe() {
  const store = useSyncedPlanningStore();

  return (
    <button onClick={() => store.mutations.createArea({ name: "Errands" })} type="button">
      Create area
    </button>
  );
}

function UpdateSettingsProbe() {
  const store = useSyncedPlanningStore();

  return (
    <button onClick={() => store.mutations.updateSettings({ language: "ja" })} type="button">
      Update settings
    </button>
  );
}

type SqlCall = {
  params: unknown[];
  sql: string;
  transactionId: number | null;
};

class FakeDatabase {
  calls: SqlCall[] = [];
  private failPredicates: Array<(sql: string) => boolean> = [];
  private nextTransactionId = 0;

  execute(sql: string, params: unknown[] = []): Promise<void> {
    this.calls.push({ params, sql, transactionId: null });
    return Promise.resolve();
  }

  failWhen(predicate: (sql: string) => boolean): void {
    this.failPredicates.push(predicate);
  }

  async writeTransaction(fn: (tx: Pick<FakeDatabase, "execute">) => Promise<void>) {
    const transactionId = this.nextTransactionId;
    this.nextTransactionId += 1;
    const stagedCalls: SqlCall[] = [];
    const tx = {
      execute: (sql: string, params: unknown[] = []) => {
        if (this.failPredicates.some((predicate) => predicate(sql))) {
          throw new Error("simulated write failure");
        }
        stagedCalls.push({ params, sql, transactionId });
        return Promise.resolve();
      },
    };

    await fn(tx);
    this.calls.push(...stagedCalls);
  }

  asPowerSyncDatabase(): AbstractPowerSyncDatabase {
    return this as unknown as AbstractPowerSyncDatabase;
  }
}

function hasParams(calls: SqlCall[], expectedParams: unknown[]): boolean {
  return calls.some((call) => expectedParams.every((param) => call.params.includes(param)));
}

function buildArea(id: string): AreaDto {
  return {
    id,
    ...syncMetadata,
    name: "Work",
    sort_order: 10,
  };
}

function buildItem(id: string, areaId: string) {
  return normalizeItemRow({
    id,
    ...syncMetadata,
    area_id: areaId,
    item_type: "date_task",
    scheduled_date: "2026-06-16",
    scheduled_time_zone_mode: "floating",
    status: "active",
    title: id,
  });
}

const syncMetadata = {
  archived_at: null,
  client_updated_at: "2026-06-15T00:00:00.000Z",
  created_at: "2026-06-15T00:00:00.000Z",
  created_by_device_id: "device-sync",
  deleted_at: null,
  hidden_reason: null,
  revision: 1,
  server_updated_at: "2026-06-15T00:00:00.000Z",
  updated_at: "2026-06-15T00:00:00.000Z",
  updated_by_device_id: "device-sync",
  user_id: "user-sync",
} as const;

function makeUuidSequence(): () => `${string}-${string}-${string}-${string}-${string}` {
  let next = 0;

  return () => {
    next += 1;
    return `00000000-0000-4000-8000-${String(next).padStart(12, "0")}`;
  };
}
