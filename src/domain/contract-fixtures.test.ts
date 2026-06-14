/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-return */
import { describe, expect, it } from "vitest";

import {
  buildPostponedActivationIdempotencyKey,
  buildRecurrenceActionIdempotencyKey,
  buildRecurrenceGenerationIdempotencyKey,
} from "@/domain/idempotency";
import {
  getDeadlineAuthority,
  normalizeItemRow,
  safeNormalizeItemRow,
} from "@/domain/items/schemas";
import { planDuePostponedActivation } from "@/domain/items/postponedActivation";
import { buildDefaultUserSettings } from "@/domain/settings/defaults";
import type { DateOnly } from "@/domain/time/dateOnly";
import { validateStatusTransition } from "@/domain/transitions/status";
import {
  classifyMetadataState,
  isVisibleInNormalPlanning,
  type MetadataVisibilityInput,
} from "@/domain/visibility";
import { parseQuickAdd } from "@/features/quick-add/parser";
import { buildTodayViewModel, sortPrimaryCandidates } from "@/repositories/local-db/readModels";
import { readContractFixture } from "@/test/contractFixtures";

type Fixture<TScenario> = {
  context?: Record<string, unknown>;
  scenarios: TScenario[];
};

type Scenario = Record<string, any>;
type NormalizedRow = ReturnType<typeof normalizeItemRow>;

const fixtureMetadata = {
  created_at: "2026-06-01T00:00:00Z",
  updated_at: "2026-06-01T00:00:00Z",
  deleted_at: null,
  archived_at: null,
  hidden_reason: null,
  client_updated_at: "2026-06-01T00:00:00Z",
  server_updated_at: "2026-06-01T00:00:00Z",
  created_by_device_id: "fixture-device",
  updated_by_device_id: "fixture-device",
  revision: 0,
};

describe("contract fixture compatibility", () => {
  it("accepts and rejects item shape fixture rows", () => {
    const fixture = readContractFixture<Fixture<Scenario>>("data/item-shapes-and-deadlines.json");
    const validRows = fixture.scenarios[0]!;
    const deadlineModes = fixture.scenarios[1]!;
    const invalidRows = fixture.scenarios[2]!;

    expect(
      validRows.input.rows.map((row: Record<string, unknown>) => normalizeItemRow(row).id),
    ).toEqual(validRows.expected.acceptedRowIds);

    const normalizedDeadlineRows = deadlineModes.input.rows.map((row: Scenario) =>
      normalizeItemRow(row),
    );
    expect(normalizedDeadlineRows.map((row: NormalizedRow) => row.id)).toEqual(
      deadlineModes.expected.acceptedRowIds,
    );
    expect(
      Object.fromEntries(
        normalizedDeadlineRows.map((row: NormalizedRow) => [row.id, getDeadlineAuthority(row)]),
      ),
    ).toEqual(deadlineModes.expected.deadlineAuthorityById);

    for (const row of invalidRows.input.rows) {
      const result = safeNormalizeItemRow(row);
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error).toMatchObject(invalidRows.expected.errorsByRowId[row.id]);
      }
    }
  });

  it("matches status, metadata, and settings fixtures", () => {
    const transitions = readContractFixture<Fixture<Scenario>>("domain/status-transitions.json");
    const allowed = transitions.scenarios[0]!;
    const rejected = transitions.scenarios[1]!;
    const metadata = transitions.scenarios[2]!;

    for (const [from, to] of allowed.input.transitions) {
      expect(validateStatusTransition(from, to).ok).toBe(true);
    }

    for (const [from, to] of rejected.input.transitions) {
      const result = validateStatusTransition(from, to);
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error).toMatchObject(rejected.expected.error);
      }
    }

    expect(
      Object.fromEntries(
        metadata.input.rows.map((row: Scenario) => [
          row.id,
          classifyMetadataState(row as MetadataVisibilityInput),
        ]),
      ),
    ).toEqual(metadata.expected.visibilityById);
    expect(
      metadata.input.rows
        .filter((row: Scenario) => isVisibleInNormalPlanning(row as MetadataVisibilityInput))
        .map((row: Scenario) => row.id),
    ).toEqual(metadata.expected.normalPlanningVisibleIds);

    const settings = readContractFixture<Fixture<Scenario>>("domain/settings-defaults.json");
    for (const scenario of settings.scenarios) {
      expect(
        buildDefaultUserSettings(scenario.input.language, scenario.context.device_time_zone),
      ).toEqual(scenario.expected.settings);
    }
  });

  it("matches Today recommendation fixture ordering and reasons", () => {
    const fixture = readContractFixture<Fixture<Scenario>>(
      "recommendation/today-sections-and-ranking.json",
    );
    const sections = fixture.scenarios[0]!;
    const ranking = fixture.scenarios[1]!;
    const date = fixture.context?.active_app_date as DateOnly;
    const normalizedItems = sections.input.items.map((row: Record<string, unknown>) =>
      normalizeItemRow({ ...fixtureMetadata, ...row }),
    );

    const model = buildTodayViewModel({
      date,
      items: normalizedItems,
      operationHistory: sections.input.operation_history,
      settings: fixture.context?.settings as {
        deadline_awareness_days: number;
        today_primary_lookahead_days: number;
      },
      timeZone: fixture.context?.time_zone as string,
    });

    expect(model.sections).toEqual(sections.expected.sections);
    expect(
      new Set(model.sections.flatMap((section) => section.itemIds)).has(
        sections.expected.excludedItemIds[0],
      ),
    ).toBe(false);
    expect(
      model.sections.find((section) => section.id === "primaryRecommendations")?.itemIds,
    ).toHaveLength(sections.expected.maxPrimaryRecommendationCount);

    const candidates = ranking.input.candidates.map((row: Scenario) =>
      normalizeItemRow({
        ...fixtureMetadata,
        id: row.id,
        user_id: fixture.context?.user_id,
        item_type: "deadline_task",
        title: row.id,
        status: "active",
        deadline_time_zone_mode: "date_only",
        ...row,
      }),
    );

    expect(candidates.sort(sortPrimaryCandidates).map((row: NormalizedRow) => row.id)).toEqual(
      ranking.expected.orderedCandidateIds,
    );
  });

  it("matches Quick Add parser fixture baseline", () => {
    const fixture = readContractFixture<Fixture<Scenario>>("quick-add/parser-baseline.json");
    const today = fixture.context?.active_app_date as DateOnly;

    for (const scenario of fixture.scenarios) {
      const parsed = parseQuickAdd(scenario.input.sourceText, {
        locale: scenario.input.locale,
        today,
      });

      expect(parsed.confidence).toBe(scenario.expected.confidence);
      expect(parsed.itemTypeSuggestion).toBe(scenario.expected.itemTypeSuggestion);
      if ("cleanTitle" in scenario.expected) {
        expect(parsed.cleanTitle).toBe(scenario.expected.cleanTitle);
      }
      if ("fields" in scenario.expected) {
        expect(parsed.fields).toMatchObject(scenario.expected.fields);
      }
      if ("recognizedFragments" in scenario.expected) {
        expect(parsed.recognizedFragments).toEqual(scenario.expected.recognizedFragments);
      }
      expect(parsed.requiresConfirmation).toBe(scenario.expected.requiresConfirmation ?? false);
      expect(parsed.warnings).toEqual(scenario.expected.warnings ?? []);
      if (scenario.expected.mustNotSetStatus) {
        expect(parsed.fields.status).not.toBe(scenario.expected.mustNotSetStatus);
      }
    }
  });

  it("matches postponed activation and recurrence idempotency fixtures", () => {
    const postponed = readContractFixture<Fixture<Scenario>>("sync/due-postponed-activation.json");
    const activeDate = postponed.context?.active_app_date as DateOnly;

    for (const scenario of postponed.scenarios.slice(0, 2)) {
      const plan = planDuePostponedActivation(
        normalizeItemRow({ ...fixtureMetadata, ...scenario.input.item }),
        activeDate,
      );
      expect(plan).toMatchObject(scenario.expected);
    }

    const duplicate = postponed.scenarios[2]!;
    expect(
      duplicate.input.activation_attempts.map(
        (attempt: { idempotency_key: string }) => attempt.idempotency_key,
      ),
    ).toEqual([
      buildPostponedActivationIdempotencyKey(
        postponed.context?.user_id as string,
        duplicate.input.item.id,
        activeDate,
      ),
      buildPostponedActivationIdempotencyKey(
        postponed.context?.user_id as string,
        duplicate.input.item.id,
        activeDate,
      ),
    ]);

    const recurrence = readContractFixture<Fixture<Scenario>>(
      "recurrence/recurrence-idempotency.json",
    );
    const completeDaily = recurrence.scenarios[0]!;
    const skipWeekly = recurrence.scenarios[1]!;
    const duplicateGeneration = recurrence.scenarios[2]!;
    expect(completeDaily.expected.action_operation.idempotency_key).toBe(
      buildRecurrenceActionIdempotencyKey(
        recurrence.context?.user_id as string,
        completeDaily.input.template.id,
        completeDaily.input.current_instance.recurring_sequence,
        "complete",
      ),
    );
    expect(completeDaily.expected.generation_operation.idempotency_key).toBe(
      buildRecurrenceGenerationIdempotencyKey(
        recurrence.context?.user_id as string,
        completeDaily.input.template.id,
        completeDaily.expected.generated_instance.recurring_sequence,
      ),
    );
    expect(skipWeekly.expected.action_operation.idempotency_key).toBe(
      buildRecurrenceActionIdempotencyKey(
        recurrence.context?.user_id as string,
        skipWeekly.input.template.id,
        skipWeekly.input.current_instance.recurring_sequence,
        "skip",
      ),
    );
    expect(
      new Set(
        duplicateGeneration.input.completion_attempts.map(
          (attempt: { generation_idempotency_key: string }) => attempt.generation_idempotency_key,
        ),
      ).size,
    ).toBe(duplicateGeneration.expected.acceptedGenerationOperationCount);
  });

  it("locks documented area delete and tombstone conflict expectations", () => {
    const fixture = readContractFixture<Fixture<Scenario>>(
      "sync/area-delete-restore-tombstone.json",
    );
    const restore = fixture.scenarios[1]!;
    const tombstone = fixture.scenarios[2]!;
    const deletedRow = normalizeItemRow({
      ...fixtureMetadata,
      ...tombstone.input.base_item,
      deleted_at: tombstone.expected.final_item.deleted_at,
    });

    expect(isVisibleInNormalPlanning(deletedRow)).toBe(tombstone.expected.normalPlanningVisible);
    expect(restore.expected.operation_history.event_type).toBe("restored");
    expect(restore.expected.item.status).toBe("completed");
  });
});
