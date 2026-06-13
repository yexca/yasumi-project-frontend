import type { TodayReasonKey } from "@/domain/constants/shared";
import type { AreaDto, LocalItemRow, MinimalOperationHistoryRow } from "@/domain/items/schemas";
import { addDays, compareDateOnly, daysBetween, type DateOnly } from "@/domain/time/dateOnly";
import { isEligibleForPressureViews, isVisibleInNormalPlanning } from "@/domain/visibility";

export type TodaySectionId =
  | "carriedForward"
  | "today"
  | "primaryRecommendations"
  | "recommendedWork"
  | "approachingDeadlines"
  | "ideasToRevisit"
  | "lightTasks";

export type TodaySectionViewModel = {
  id: TodaySectionId;
  itemIds: string[];
  reasonsByItemId?: Record<string, TodayReasonKey[]>;
};

export type TodayViewModel = {
  date: DateOnly;
  timeZone: string;
  sections: TodaySectionViewModel[];
};

export type TodayBuildInput = {
  items: LocalItemRow[];
  operationHistory: MinimalOperationHistoryRow[];
  date: DateOnly;
  timeZone: string;
  settings?: {
    today_primary_lookahead_days?: number | null;
    deadline_awareness_days?: number | null;
  } | null;
};

const TODAY_SECTION_IDS: TodaySectionId[] = [
  "carriedForward",
  "today",
  "primaryRecommendations",
  "recommendedWork",
  "approachingDeadlines",
  "ideasToRevisit",
  "lightTasks",
];

export function buildTodayViewModel(input: TodayBuildInput): TodayViewModel {
  const primaryLookaheadDays = input.settings?.today_primary_lookahead_days ?? 3;
  const deadlineAwarenessDays = input.settings?.deadline_awareness_days ?? 14;
  const visibleItems = input.items.filter(isEligibleForPressureViews);
  const displayedIds = new Set<string>();
  const sectionById = new Map<TodaySectionId, TodaySectionViewModel>(
    TODAY_SECTION_IDS.map((id) => [id, { id, itemIds: [] }]),
  );

  const carriedForward = visibleItems
    .filter((item) => isCarriedForward(item, input.operationHistory, input.date))
    .sort(sortByCreatedAt);

  appendSectionItems(sectionById, "carriedForward", carriedForward, displayedIds, (item) => [
    ...deadlineReasons(item, input.date, primaryLookaheadDays),
    "carriedForward",
  ]);

  const todayCommitments = visibleItems
    .filter(
      (item) =>
        item.item_type === "date_task" &&
        item.scheduled_date === input.date &&
        !displayedIds.has(item.id),
    )
    .sort(sortByCreatedAt);

  appendSectionItems(sectionById, "today", todayCommitments, displayedIds, (item) =>
    item.recurring_template_id === null ? ["scheduledToday"] : ["recurringToday", "scheduledToday"],
  );

  const primaryCandidates = visibleItems
    .filter((item) => !displayedIds.has(item.id))
    .filter((item) => isPrimaryCandidate(item, input.date, primaryLookaheadDays))
    .sort((left, right) => sortPrimaryCandidates(left, right));

  const primaryRecommendations = primaryCandidates.slice(0, 3);
  appendSectionItems(
    sectionById,
    "primaryRecommendations",
    primaryRecommendations,
    displayedIds,
    (item) => buildRecommendationReasons(item, input.date, primaryLookaheadDays),
  );

  const recommendedWork = visibleItems
    .filter((item) => !displayedIds.has(item.id))
    .filter(
      (item) =>
        item.item_type === "deadline_task" &&
        (item.planned_work_date === input.date ||
          isInsideLookahead(item.deadline_date, input.date, primaryLookaheadDays)),
    )
    .sort((left, right) => sortPrimaryCandidates(left, right));

  appendSectionItems(sectionById, "recommendedWork", recommendedWork, displayedIds, (item) =>
    buildRecommendationReasons(item, input.date, primaryLookaheadDays),
  );

  const approachingDeadlines = visibleItems
    .filter((item) => !displayedIds.has(item.id))
    .filter(
      (item) =>
        item.item_type === "deadline_task" &&
        isInsideLookahead(item.deadline_date, input.date, deadlineAwarenessDays),
    )
    .sort((left, right) => sortPrimaryCandidates(left, right));

  appendSectionItems(
    sectionById,
    "approachingDeadlines",
    approachingDeadlines,
    displayedIds,
    (item) => buildRecommendationReasons(item, input.date, deadlineAwarenessDays),
  );

  const ideasToRevisit = visibleItems
    .filter((item) => !displayedIds.has(item.id))
    .filter((item) => item.item_type === "idea" && isDueDate(item.review_date, input.date))
    .sort(sortByCreatedAt)
    .slice(0, 3);

  appendSectionItems(sectionById, "ideasToRevisit", ideasToRevisit, displayedIds, () => [
    "reviewDateReached",
  ]);

  const lightTasks = visibleItems
    .filter((item) => !displayedIds.has(item.id))
    .filter(
      (item) =>
        item.item_type !== "idea" && item.estimated_effort !== null && item.estimated_effort <= 1,
    )
    .sort(sortByCreatedAt);

  appendSectionItems(sectionById, "lightTasks", lightTasks, displayedIds, () => ["smallTask"]);

  return {
    date: input.date,
    timeZone: input.timeZone,
    sections: TODAY_SECTION_IDS.map((id) => sectionById.get(id)).filter(
      (section): section is TodaySectionViewModel => section !== undefined,
    ),
  };
}

export function queryInboxRows(items: LocalItemRow[]): LocalItemRow[] {
  return items
    .filter((item) => isVisibleInNormalPlanning(item) && item.item_type === "inbox")
    .sort(sortByCreatedAt);
}

export function queryUpcomingRows(items: LocalItemRow[], today: DateOnly): LocalItemRow[] {
  return items
    .filter((item) => isVisibleInNormalPlanning(item))
    .filter(
      (item) =>
        (item.item_type === "date_task" &&
          item.scheduled_date !== null &&
          item.scheduled_date > today) ||
        (item.item_type === "deadline_task" &&
          item.planned_work_date !== null &&
          item.planned_work_date > today),
    )
    .sort(
      (left, right) =>
        compareDateOnly(getPlanningDate(left), getPlanningDate(right)) ||
        sortByCreatedAt(left, right),
    );
}

export function queryDeadlineRows(items: LocalItemRow[]): LocalItemRow[] {
  return items
    .filter((item) => isVisibleInNormalPlanning(item) && item.item_type === "deadline_task")
    .sort(
      (left, right) =>
        compareDateOnly(left.deadline_date, right.deadline_date) || sortByCreatedAt(left, right),
    );
}

export function queryIdeaRows(items: LocalItemRow[]): LocalItemRow[] {
  return items
    .filter((item) => isVisibleInNormalPlanning(item) && item.item_type === "idea")
    .sort(
      (left, right) =>
        compareDateOnly(left.review_date, right.review_date) || sortByCreatedAt(left, right),
    );
}

export function queryAreaRows(areas: AreaDto[]): AreaDto[] {
  return [...areas]
    .filter((area) => area.deleted_at === null && area.archived_at === null)
    .sort(
      (left, right) => left.sort_order - right.sort_order || left.name.localeCompare(right.name),
    );
}

export function queryAreaItemRows(items: LocalItemRow[], areaId: string): LocalItemRow[] {
  return items
    .filter((item) => isVisibleInNormalPlanning(item) && item.area_id === areaId)
    .sort(sortByCreatedAt);
}

export function queryCompletedRows(items: LocalItemRow[]): LocalItemRow[] {
  return items
    .filter(
      (item) =>
        item.deleted_at === null && item.archived_at === null && item.status === "completed",
    )
    .sort((left, right) => right.updated_at.localeCompare(left.updated_at));
}

export function queryArchiveRows(items: LocalItemRow[]): LocalItemRow[] {
  return items
    .filter(
      (item) =>
        item.deleted_at !== null ||
        item.archived_at !== null ||
        item.status === "abandoned" ||
        item.hidden_reason !== null,
    )
    .sort((left, right) => right.updated_at.localeCompare(left.updated_at));
}

export function sortPrimaryCandidates(left: LocalItemRow, right: LocalItemRow): number {
  return (
    compareDateOnly(left.deadline_date, right.deadline_date) ||
    (right.importance ?? 0) - (left.importance ?? 0) ||
    (left.estimated_effort ?? 99) - (right.estimated_effort ?? 99) ||
    left.created_at.localeCompare(right.created_at)
  );
}

function appendSectionItems(
  sectionById: Map<TodaySectionId, TodaySectionViewModel>,
  sectionId: TodaySectionId,
  items: LocalItemRow[],
  displayedIds: Set<string>,
  reasonsBuilder: (item: LocalItemRow) => TodayReasonKey[],
): void {
  const section = sectionById.get(sectionId);

  if (section === undefined) {
    return;
  }

  for (const item of items) {
    if (displayedIds.has(item.id)) {
      continue;
    }

    displayedIds.add(item.id);
    section.itemIds.push(item.id);

    const reasons = uniqueReasons(reasonsBuilder(item));
    if (reasons.length > 0) {
      section.reasonsByItemId = {
        ...section.reasonsByItemId,
        [item.id]: reasons,
      };
    }
  }
}

function isCarriedForward(
  item: LocalItemRow,
  operationHistory: MinimalOperationHistoryRow[],
  today: DateOnly,
): boolean {
  return operationHistory.some((operation) => {
    if (
      operation.item_id !== item.id ||
      operation.event_type !== "activated_from_postponed" ||
      !operation.created_at.startsWith(today)
    ) {
      return false;
    }

    const previousValue = operation.previous_value ?? {};
    return (
      previousValue["scheduled_date"] === item.scheduled_date ||
      previousValue["planned_work_date"] === item.planned_work_date
    );
  });
}

function isPrimaryCandidate(
  item: LocalItemRow,
  today: DateOnly,
  primaryLookaheadDays: number,
): boolean {
  if (item.item_type === "idea") {
    return isDueDate(item.review_date, today);
  }

  if (item.item_type !== "deadline_task") {
    return false;
  }

  return (
    item.planned_work_date === today ||
    isInsideLookahead(item.deadline_date, today, primaryLookaheadDays)
  );
}

function buildRecommendationReasons(
  item: LocalItemRow,
  today: DateOnly,
  lookaheadDays: number,
): TodayReasonKey[] {
  const reasons: TodayReasonKey[] = [];

  if (item.planned_work_date === today) {
    reasons.push("plannedToday");
  }

  reasons.push(...deadlineReasons(item, today, lookaheadDays));

  if (item.item_type === "idea" && isDueDate(item.review_date, today)) {
    reasons.push("reviewDateReached");
  }

  if (item.importance !== null && item.importance >= 4) {
    reasons.push("highImportance");
  }

  if (item.estimated_effort !== null && item.estimated_effort <= 1) {
    reasons.push("smallTask");
  }

  return reasons;
}

function deadlineReasons(
  item: LocalItemRow,
  today: DateOnly,
  lookaheadDays: number,
): TodayReasonKey[] {
  if (item.deadline_date === null) {
    return [];
  }

  if (item.deadline_date === today) {
    return ["deadlineToday", "deadlineSoon"];
  }

  if (item.deadline_date === addDays(today, 1)) {
    return ["deadlineTomorrow", "deadlineSoon"];
  }

  if (isInsideLookahead(item.deadline_date, today, lookaheadDays)) {
    return ["deadlineSoon"];
  }

  return [];
}

function isInsideLookahead(date: DateOnly | null, today: DateOnly, lookaheadDays: number): boolean {
  return (
    date !== null && daysBetween(today, date) >= 0 && daysBetween(today, date) <= lookaheadDays
  );
}

function isDueDate(date: DateOnly | null, today: DateOnly): boolean {
  return date !== null && date <= today;
}

function getPlanningDate(item: LocalItemRow): DateOnly | null {
  if (item.item_type === "date_task") {
    return item.scheduled_date;
  }

  return item.planned_work_date;
}

function sortByCreatedAt(left: LocalItemRow, right: LocalItemRow): number {
  return left.created_at.localeCompare(right.created_at);
}

function uniqueReasons(reasons: TodayReasonKey[]): TodayReasonKey[] {
  return Array.from(new Set(reasons));
}
