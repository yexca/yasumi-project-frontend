import { describe, expect, it } from "vitest";

import settingsFixture from "../../../dev_documents/contracts/fixtures/domain/settings-defaults.json";
import statusFixture from "../../../dev_documents/contracts/fixtures/domain/status-transitions.json";
import duePostponedFixture from "../../../dev_documents/contracts/fixtures/sync/due-postponed-activation.json";
import { buildDefaultUserSettings } from "@/domain/settings/defaults";
import { canTransitionStatus, validateStatusTransition } from "@/domain/transitions/status";
import type { BusinessStatus, LanguageCode } from "@/domain/constants/shared";
import { classifyMetadataState, isVisibleInNormalPlanning } from "@/domain/visibility";
import { normalizeItemRow } from "@/domain/items/schemas";
import { planDuePostponedActivation } from "@/domain/items/postponedActivation";
import { buildRecurrenceActionIdempotencyKey } from "@/domain/idempotency";
import { addDays, assertDateOnly, isInstant } from "@/domain/time/dateOnly";
import type { HiddenReason } from "@/domain/constants/shared";

describe("phase 03 domain contracts", () => {
  it("accepts and rejects documented status transitions", () => {
    const allowed = findScenario(
      statusFixture.scenarios,
      "status-allowed-transitions",
    ) as unknown as TransitionScenario;
    const invalid = findScenario(
      statusFixture.scenarios,
      "status-invalid-transitions",
    ) as unknown as InvalidTransitionScenario;

    for (const [from, to] of allowed.input.transitions) {
      expect(canTransitionStatus(from, to)).toBe(true);
      expect(validateStatusTransition(from, to)).toEqual({
        ok: true,
      });
    }

    for (const [from, to] of invalid.input.transitions) {
      expect(validateStatusTransition(from, to)).toEqual({
        ok: false,
        error: invalid.expected.error,
      });
    }
  });

  it("applies metadata precedence before normal planning visibility", () => {
    const scenario = findScenario(
      statusFixture.scenarios,
      "metadata-precedence",
    ) as unknown as MetadataScenario;
    const visibilityById = Object.fromEntries(
      scenario.input.rows.map((row) => [
        row.id,
        classifyMetadataState({
          status: row.status,
          deleted_at: row.deleted_at,
          archived_at: row.archived_at,
          hidden_reason: row.hidden_reason as HiddenReason | null,
        }),
      ]),
    );
    const visibleIds = scenario.input.rows
      .filter((row) =>
        isVisibleInNormalPlanning({
          status: row.status,
          deleted_at: row.deleted_at,
          archived_at: row.archived_at,
          hidden_reason: row.hidden_reason as HiddenReason | null,
        }),
      )
      .map((row) => row.id);

    expect(visibilityById).toEqual(scenario.expected.visibilityById);
    expect(visibleIds).toEqual(scenario.expected.normalPlanningVisibleIds);
  });

  it("builds settings defaults from contract fixtures", () => {
    for (const scenario of settingsFixture.scenarios) {
      expect(
        buildDefaultUserSettings(
          scenario.input.language as LanguageCode,
          scenario.context.device_time_zone,
        ),
      ).toEqual(scenario.expected.settings);
    }
  });

  it("keeps date-only arithmetic timezone-neutral", () => {
    expect(assertDateOnly("2026-06-13")).toBe("2026-06-13");
    expect(addDays("2026-06-13", 1)).toBe("2026-06-14");
    expect(addDays("2026-03-01", -1)).toBe("2026-02-28");
  });

  it("accepts only RFC 3339 instants at contract boundaries", () => {
    expect(isInstant("2026-06-13T09:00:00Z")).toBe(true);
    expect(isInstant("2026-06-13T09:00:00.123+09:00")).toBe(true);
    expect(isInstant("2026-06-13")).toBe(false);
    expect(isInstant("2026-06-13 09:00:00Z")).toBe(false);
    expect(isInstant("2026-02-30T09:00:00Z")).toBe(false);
  });

  it("plans due postponed activation with stable idempotency keys", () => {
    const scenario = findScenario(duePostponedFixture.scenarios, "due-date-task-activates-once");
    const item = normalizeItemRow(scenario.input.item);

    expect(
      planDuePostponedActivation(item, duePostponedFixture.context.active_app_date),
    ).toMatchObject(scenario.expected);
  });

  it("does not activate postponed deadline tasks without planned work dates", () => {
    const scenario = findScenario(
      duePostponedFixture.scenarios,
      "deadline-task-without-planned-work-does-not-activate",
    );
    const item = normalizeItemRow(scenario.input.item);

    expect(planDuePostponedActivation(item, duePostponedFixture.context.active_app_date)).toEqual(
      scenario.expected,
    );
  });

  it("builds recurrence action keys exactly as documented", () => {
    expect(
      buildRecurrenceActionIdempotencyKey(
        "00000000-0000-4000-8000-000000000001",
        "50000000-0000-4000-8000-000000000001",
        1,
        "complete",
      ),
    ).toBe(
      "recurrence:00000000-0000-4000-8000-000000000001:50000000-0000-4000-8000-000000000001:1:complete",
    );
  });
});

function findScenario<TScenario extends { id: string }>(
  scenarios: readonly TScenario[],
  id: string,
): TScenario {
  const scenario = scenarios.find((candidate) => candidate.id === id);

  if (scenario === undefined) {
    throw new Error(`Missing fixture scenario: ${id}`);
  }

  return scenario;
}

type TransitionScenario = {
  input: {
    transitions: [BusinessStatus, BusinessStatus][];
  };
};

type InvalidTransitionScenario = TransitionScenario & {
  expected: {
    error: {
      code: "invalid_transition";
      fields: {
        status: "transition_not_allowed";
      };
      retryable: false;
    };
  };
};

type MetadataScenario = {
  input: {
    rows: {
      id: string;
      status: BusinessStatus;
      deleted_at: string | null;
      archived_at: string | null;
      hidden_reason: string | null;
    }[];
  };
  expected: {
    visibilityById: Record<string, string>;
    normalPlanningVisibleIds: string[];
  };
};
