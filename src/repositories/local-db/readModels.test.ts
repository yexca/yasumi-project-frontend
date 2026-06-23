import { describe, expect, it } from "vitest";

import { normalizeItemRow, type MinimalOperationHistoryRow } from "@/domain/items/schemas";
import {
  buildTodayViewModel,
  queryUpcomingRows,
  sortPrimaryCandidates,
} from "@/repositories/local-db/readModels";
import { readContractFixture } from "@/test/contractFixtures";

const todayFixture = readContractFixture<Fixture<TodaySectionsScenario | TieBreakScenario>>(
  "recommendation/today-sections-and-ranking.json",
);

describe("phase 03 local read models", () => {
  it("builds Today sections in contract order without duplicated items", () => {
    const scenario = findScenario(
      todayFixture.scenarios,
      "today-section-deduplication-and-order",
    ) as TodaySectionsScenario;
    const items = scenario.input.items.map((item) => normalizeItemRow(item));
    const operationHistory = scenario.input.operation_history.map((operation) => ({
      recurring_template_id: null,
      reason: null,
      idempotency_key: null,
      created_by_device_id: "fixture-device",
      previous_value: {},
      new_value: {},
      ...operation,
    })) satisfies MinimalOperationHistoryRow[];

    const model = buildTodayViewModel({
      items,
      operationHistory,
      date: todayFixture.context.active_app_date,
      timeZone: todayFixture.context.time_zone,
      settings: todayFixture.context.settings,
    });

    expect(model.sections).toEqual(scenario.expected.sections);
    expect(
      model.sections
        .flatMap((section) => section.itemIds)
        .filter((id, index, ids) => ids.indexOf(id) !== index),
    ).toEqual([]);
    expect(
      model.sections.find((section) => section.id === "primaryRecommendations")?.itemIds,
    ).toHaveLength(scenario.expected.maxPrimaryRecommendationCount);
  });

  it("uses documented primary candidate tie-breaks", () => {
    const scenario = findScenario(
      todayFixture.scenarios,
      "primary-ranking-tie-breaks",
    ) as TieBreakScenario;
    const candidates = scenario.input.candidates.map((candidate) =>
      normalizeItemRow({
        user_id: todayFixture.context.user_id,
        item_type: "deadline_task",
        title: candidate.id,
        status: "active",
        deadline_time_zone_mode: "date_only",
        ...candidate,
      }),
    );

    expect([...candidates].sort(sortPrimaryCandidates).map((candidate) => candidate.id)).toEqual(
      scenario.expected.orderedCandidateIds,
    );
  });

  it("shows Upcoming rows on their scheduled date, planned work date, or deadline fallback", () => {
    const items = [
      normalizeItemRow({
        id: "date-today",
        user_id: "fixture-user",
        item_type: "date_task",
        title: "Date task today",
        status: "active",
        scheduled_date: "2026-06-14",
        scheduled_time_zone_mode: "floating",
      }),
      normalizeItemRow({
        id: "deadline-with-plan",
        user_id: "fixture-user",
        item_type: "deadline_task",
        title: "Deadline with plan",
        status: "active",
        planned_work_date: "2026-06-15",
        deadline_date: "2026-06-20",
        deadline_time_zone_mode: "date_only",
      }),
      normalizeItemRow({
        id: "deadline-without-plan",
        user_id: "fixture-user",
        item_type: "deadline_task",
        title: "Deadline without plan",
        status: "active",
        deadline_date: "2026-06-16",
        deadline_time_zone_mode: "date_only",
      }),
      normalizeItemRow({
        id: "date-yesterday",
        user_id: "fixture-user",
        item_type: "date_task",
        title: "Date task yesterday",
        status: "active",
        scheduled_date: "2026-06-13",
        scheduled_time_zone_mode: "floating",
      }),
      normalizeItemRow({
        id: "deadline-past-plan",
        user_id: "fixture-user",
        item_type: "deadline_task",
        title: "Deadline with past plan",
        status: "active",
        planned_work_date: "2026-06-13",
        deadline_date: "2026-06-30",
        deadline_time_zone_mode: "date_only",
      }),
    ];

    expect(queryUpcomingRows(items, "2026-06-14").map((item) => item.id)).toEqual([
      "date-today",
      "deadline-with-plan",
      "deadline-without-plan",
    ]);
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

type TodaySectionsScenario = {
  id: string;
  input: {
    items: unknown[];
    operation_history: MinimalOperationHistoryRow[];
  };
  expected: {
    sections: unknown[];
    maxPrimaryRecommendationCount: number;
  };
};

type TieBreakScenario = {
  id: string;
  input: {
    candidates: {
      id: string;
      deadline_date: string;
      importance: number;
      estimated_effort: number;
      created_at: string;
    }[];
  };
  expected: {
    orderedCandidateIds: string[];
  };
};

type Fixture<TScenario> = {
  context: {
    active_app_date: string;
    settings: {
      deadline_awareness_days: number;
      today_primary_lookahead_days: number;
    };
    time_zone: string;
    user_id: string;
  };
  scenarios: TScenario[];
};
