import { describe, expect, it } from "vitest";

import itemShapeFixture from "../../../dev_documents/contracts/fixtures/data/item-shapes-and-deadlines.json";
import { getDeadlineAuthority, safeNormalizeItemRow } from "@/domain/items/schemas";

describe("phase 03 item row normalization", () => {
  it("accepts valid item fragments for every MVP item type", () => {
    const scenario = findScenario(itemShapeFixture.scenarios, "valid-item-rows-all-types");
    const acceptedRowIds = scenario.input.rows.flatMap((row) => {
      const result = safeNormalizeItemRow(row);
      return result.ok ? [result.row.id] : [];
    });

    expect(acceptedRowIds).toEqual(scenario.expected.acceptedRowIds);
  });

  it("tracks deadline authority through explicit deadline mode", () => {
    const scenario = findScenario(itemShapeFixture.scenarios, "valid-deadline-modes");
    const authorityById = Object.fromEntries(
      scenario.input.rows.map((row) => {
        const result = safeNormalizeItemRow(row);

        if (!result.ok) {
          throw new Error(`Expected fixture row to normalize: ${row.id}`);
        }

        return [result.row.id, getDeadlineAuthority(result.row)];
      }),
    );

    expect(Object.keys(authorityById)).toEqual(scenario.expected.acceptedRowIds);
    expect(authorityById).toEqual(scenario.expected.deadlineAuthorityById);
  });

  it("rejects invalid deadline shapes with stable field keys", () => {
    const scenario = findScenario(itemShapeFixture.scenarios, "invalid-deadline-mode-combinations");
    const rejectedRowIds: string[] = [];
    const errorsByRowId: Record<string, unknown> = {};

    for (const row of scenario.input.rows) {
      const result = safeNormalizeItemRow(row);
      if (!result.ok) {
        rejectedRowIds.push(row.id);
        errorsByRowId[row.id] = result.error;
      }
    }

    expect(rejectedRowIds).toEqual(scenario.expected.rejectedRowIds);
    expect(errorsByRowId).toEqual(scenario.expected.errorsByRowId);
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
