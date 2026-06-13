import { describe, expect, it } from "vitest";

import todayFixture from "../../../../dev_documents/contracts/fixtures/recommendation/today-sections-and-ranking.json";
import { normalizeItemRow, type MinimalOperationHistoryRow } from "@/domain/items/schemas";
import { buildTodayViewModel, sortPrimaryCandidates } from "@/repositories/local-db/readModels";

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
