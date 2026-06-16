import type { AbstractPowerSyncDatabase } from "@powersync/web";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { createYasumiPowerSyncConnector } from "./connector";

vi.mock("@/repositories/direct-api/config", () => ({
  getBackendBaseUrl: () => "https://api.example.test",
  getPowerSyncEndpoint: () => "https://sync.example.test",
}));

vi.mock("@/repositories/direct-api/syncTokenRepository", () => ({
  requestSyncToken: vi.fn(),
}));

type CrudJson = {
  data?: Record<string, unknown>;
  id: string;
  old?: Record<string, unknown>;
  op: "PATCH" | "PUT";
  type: string;
};

type ExecuteCall = {
  parameters: unknown[];
  sql: string;
};

type UploadedMutation = {
  row: Record<string, unknown>;
  table: string;
};

type UploadBody = {
  mutations: UploadedMutation[];
};

describe("createYasumiPowerSyncConnector uploadData", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("uploads text-backed JSON columns as JSON values", async () => {
    const database = new FakeDatabase({
      crud: [
        crud("items", "item-01", "PUT"),
        crud("operation_history", "op-01", "PUT"),
        crud("recurring_task_templates", "template-01", "PUT"),
      ],
      rows: {
        "items:item-01": {
          id: "item-01",
          pressure_metadata: '{"score":2}',
          quick_add_parse_result: '{"confidence":"high"}',
        },
        "operation_history:op-01": {
          id: "op-01",
          new_value: '{"status":"completed"}',
          previous_value: '{"status":"active"}',
        },
        "recurring_task_templates:template-01": {
          id: "template-01",
          generated_task_defaults: '{"item_type":"date_task"}',
          reminder_rule: '{"offset":"P1D"}',
          weekdays: '["monday"]',
        },
      },
    });
    const fetchMock = vi
      .fn<(input: string, init: RequestInit) => Promise<Response>>()
      .mockResolvedValue(jsonResponse(200, { accepted: [] }));
    vi.stubGlobal("fetch", fetchMock);

    await createYasumiPowerSyncConnector({
      accessToken: "access-token",
      clientVersion: "test",
      deviceId: "device-01",
    }).uploadData(database.asPowerSyncDatabase());

    const fetchOptions = fetchMock.mock.calls[0]?.[1];
    expect(fetchOptions).toBeDefined();
    const body = parseUploadBody((fetchOptions as RequestInit).body);
    const item = body.mutations.find((mutation) => mutation.table === "items");
    const operation = body.mutations.find((mutation) => mutation.table === "operation_history");
    const template = body.mutations.find(
      (mutation) => mutation.table === "recurring_task_templates",
    );

    expect(item?.row.pressure_metadata).toEqual({ score: 2 });
    expect(item?.row.quick_add_parse_result).toEqual({ confidence: "high" });
    expect(operation?.row.previous_value).toEqual({ status: "active" });
    expect(operation?.row.new_value).toEqual({ status: "completed" });
    expect(template?.row.weekdays).toEqual(["monday"]);
    expect(template?.row.reminder_rule).toEqual({ offset: "P1D" });
    expect(template?.row.generated_task_defaults).toEqual({ item_type: "date_task" });
    expect(database.completed).toBe(true);
  });

  it("clears pending context after an accepted upload", async () => {
    const database = new FakeDatabase({
      crud: [crud("items", "item-01", "PUT")],
      rows: { "items:item-01": { id: "item-01", title: "Accepted" } },
    });
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(jsonResponse(200, { accepted: [] })));

    await createYasumiPowerSyncConnector({
      accessToken: "access-token",
      clientVersion: "test",
      deviceId: "device-01",
    }).uploadData(database.asPowerSyncDatabase());

    expect(database.executeCalls).toContainEqual({
      parameters: ["items", "item-01"],
      sql: "DELETE FROM pending_write_context WHERE table_name = ? AND row_id = ?",
    });
    expect(database.completed).toBe(true);
  });

  it("stores stable backend rejection details as row recovery context", async () => {
    const database = new FakeDatabase({
      crud: [crud("items", "item-01", "PATCH")],
      pending: {
        "items:item-01": {
          action: "complete",
          client_action_id: "action-01",
          id: "mutation-01",
          idempotency_key: "action:user:device:action-01",
        },
      },
      rows: { "items:item-01": { id: "item-01", status: "completed" } },
    });
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        jsonResponse(409, {
          code: "invalid_transition",
          fields: { status: "transition_not_allowed" },
          message: "status transition is not allowed",
          retryable: false,
        }),
      ),
    );

    await createYasumiPowerSyncConnector({
      accessToken: "access-token",
      clientVersion: "test",
      deviceId: "device-01",
    }).uploadData(database.asPowerSyncDatabase());

    const rejectedInsert = database.executeCalls.find((call) =>
      call.sql.includes("INSERT OR REPLACE INTO rejected_write_context"),
    );
    expect(rejectedInsert?.parameters).toEqual([
      "mutation-01",
      "complete",
      "action-01",
      expect.any(String),
      "invalid_transition",
      JSON.stringify({ status: "transition_not_allowed" }),
      "action:user:device:action-01",
      0,
      "item-01",
      "items",
    ]);
    expect(database.completed).toBe(true);
  });
});

function crud(type: string, id: string, op: CrudJson["op"]): { toJSON: () => CrudJson } {
  return {
    toJSON: () => ({ data: {}, id, op, type }),
  };
}

function jsonResponse(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    headers: { "Content-Type": "application/json; charset=utf-8" },
    status,
  });
}

function parseUploadBody(body: BodyInit | null | undefined): UploadBody {
  if (typeof body !== "string") {
    throw new Error("expected string request body");
  }

  const parsed: unknown = JSON.parse(body);
  if (
    parsed === null ||
    typeof parsed !== "object" ||
    !Array.isArray((parsed as { mutations?: unknown }).mutations)
  ) {
    throw new Error("expected upload body");
  }

  return parsed as UploadBody;
}

class FakeDatabase {
  completed = false;
  executeCalls: ExecuteCall[] = [];
  private readonly crudRows: { toJSON: () => CrudJson }[];
  private readonly pending: Record<string, Record<string, unknown>>;
  private readonly rows: Record<string, Record<string, unknown>>;

  constructor(input: {
    crud: { toJSON: () => CrudJson }[];
    pending?: Record<string, Record<string, unknown>>;
    rows: Record<string, Record<string, unknown>>;
  }) {
    this.crudRows = input.crud;
    this.pending = input.pending ?? {};
    this.rows = input.rows;
  }

  getNextCrudTransaction() {
    return Promise.resolve({
      complete: () => {
        this.completed = true;
        return Promise.resolve();
      },
      crud: this.crudRows,
      transactionId: 42,
    });
  }

  getOptional<T>(sql: string, parameters: unknown[]): Promise<T | null> {
    const first = typeof parameters[0] === "string" ? parameters[0] : "";
    const second = typeof parameters[1] === "string" ? parameters[1] : "";

    if (sql.includes("FROM pending_write_context")) {
      return Promise.resolve((this.pending[`${first}:${second}`] as T) ?? null);
    }

    const table = /FROM ([a-z_]+)/.exec(sql)?.[1];
    return Promise.resolve(table ? ((this.rows[`${table}:${first}`] as T) ?? null) : null);
  }

  async writeTransaction(fn: (tx: Pick<FakeDatabase, "execute">) => Promise<void>) {
    await fn(this);
  }

  execute(sql: string, parameters: unknown[]) {
    this.executeCalls.push({
      parameters,
      sql: sql.trim().replace(/\s+/g, " "),
    });
    return Promise.resolve();
  }

  asPowerSyncDatabase(): AbstractPowerSyncDatabase {
    return this as unknown as AbstractPowerSyncDatabase;
  }
}
