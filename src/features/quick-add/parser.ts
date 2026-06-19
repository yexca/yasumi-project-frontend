import { addDays, type DateOnly } from "@/domain/time/dateOnly";

export type QuickAddConfidence = "high" | "medium" | "low";

export type QuickAddSuggestion = "date_task" | "deadline_task" | "idea" | "inbox";

export type QuickAddFragment = {
  normalizedValue: string;
  target: string;
  text: string;
};

export type QuickAddParseResult = {
  cleanTitle: string;
  confidence: QuickAddConfidence;
  fields: Record<string, string | null>;
  itemTypeSuggestion: QuickAddSuggestion;
  recognizedFragments: QuickAddFragment[];
  requiresConfirmation: boolean;
  sourceText: string;
  warnings: Array<{ code: string; field: string }>;
};

type ParseOptions = {
  ignoredFragments?: QuickAddFragment[];
  locale: string;
  today: DateOnly;
  untitled?: string;
};

const WEEKDAY_BY_ENGLISH = {
  sunday: 0,
  monday: 1,
  tuesday: 2,
  wednesday: 3,
  thursday: 4,
  friday: 5,
  saturday: 6,
} as const;

export function parseQuickAdd(
  sourceText: string,
  { ignoredFragments = [], locale, today, untitled = "Untitled capture" }: ParseOptions,
): QuickAddParseResult {
  const normalized = sourceText.trim().replace(/\s+/g, " ");
  const baseTitle = normalized.length > 0 ? normalized : untitled;
  const dateMatches = findDateFragments(normalized, today, locale).filter(
    (match) => !isIgnoredFragment(ignoredFragments, match.text, match.value),
  );
  const rawTimeMatch = normalized.match(/\b([01]?\d|2[0-3]):([0-5]\d)\b/);
  const timeMatch =
    rawTimeMatch && !isIgnoredFragment(ignoredFragments, rawTimeMatch[0], normalizeTime(rawTimeMatch[0]))
      ? rawTimeMatch
      : null;
  const deadlineMatch = findDeadlineMarker(normalized, dateMatches[0]?.text, timeMatch?.[0]);
  const reviewMatch = findReviewMarker(normalized, dateMatches[0]?.text);
  const warnings =
    dateMatches.length > 1 ? [{ code: "ambiguous_multiple_dates", field: "scheduled_date" }] : [];
  const firstDate = dateMatches[0];
  const recognizedFragments: QuickAddFragment[] = [];
  const fields: Record<string, string | null> = {};
  let itemTypeSuggestion: QuickAddSuggestion = "inbox";

  if (deadlineMatch && firstDate) {
    itemTypeSuggestion = "deadline_task";
    fields.deadline_date = firstDate.value;
    fields.deadline_time_zone_mode = timeMatch ? "floating" : "date_only";
    recognizedFragments.push({
      normalizedValue: firstDate.value,
      target: "deadline_date",
      text: deadlineMatch,
    });

    if (timeMatch) {
      fields.deadline_time = normalizeTime(timeMatch[0]);
      recognizedFragments.push({
        normalizedValue: fields.deadline_time,
        target: "deadline_time",
        text: timeMatch[0],
      });
    }
  } else if (reviewMatch && firstDate) {
    itemTypeSuggestion = "idea";
    fields.review_date = firstDate.value;
    recognizedFragments.push({
      normalizedValue: firstDate.value,
      target: "review_date",
      text: reviewMatch,
    });
  } else if (firstDate) {
    itemTypeSuggestion = "date_task";
    fields.scheduled_date = firstDate.value;
    fields.status = null;
    recognizedFragments.push({
      normalizedValue: firstDate.value,
      target: "scheduled_date",
      text: firstDate.text,
    });
  }

  const cleanTitle = cleanSourceTitle(baseTitle, [
    deadlineMatch,
    reviewMatch,
    ...dateMatches.map((match) => match.text),
    timeMatch?.[0] ?? null,
  ]);

  return {
    cleanTitle: cleanTitle.length > 0 ? cleanTitle : untitled,
    confidence:
      warnings.length > 0
        ? "low"
        : deadlineMatch || reviewMatch
          ? "high"
          : firstDate
            ? "medium"
            : "low",
    fields,
    itemTypeSuggestion,
    recognizedFragments,
    requiresConfirmation: warnings.length > 0,
    sourceText,
    warnings,
  };
}

function findDeadlineMarker(
  text: string,
  dateText: string | undefined,
  timeText: string | undefined,
) {
  const marker = text.match(/\b(?:deadline|due|by)\b|截止|締切/i)?.[0];
  if (!marker) {
    return null;
  }

  if (dateText && timeText && text.includes(`${marker} ${dateText} ${timeText}`)) {
    return `${marker} ${dateText} ${timeText}`;
  }

  if (dateText && text.includes(`${marker} ${dateText}`)) {
    return `${marker} ${dateText}`;
  }

  return marker;
}

function findReviewMarker(text: string, dateText: string | undefined) {
  if (!dateText) {
    return null;
  }

  const japaneseReview = `${dateText}レビュー`;
  if (text.includes(japaneseReview)) {
    return japaneseReview;
  }

  const review = text.match(/\breview\b/i)?.[0];
  return review ? `${dateText} ${review}` : null;
}

function findDateFragments(
  text: string,
  today: DateOnly,
  locale: string,
): Array<{ text: string; value: DateOnly }> {
  const fragments: Array<{ text: string; value: DateOnly; index: number }> = [];
  const iso = [...text.matchAll(/\b(\d{4}-\d{2}-\d{2})\b/g)];
  const shortDates = [...text.matchAll(/\b(\d{1,2})-(\d{1,2})\b/g)];
  const lower = text.toLowerCase();

  for (const match of iso) {
    fragments.push({ index: match.index ?? 0, text: match[1] ?? "", value: match[1] as DateOnly });
  }

  for (const match of shortDates) {
    if (match[0].length === 10) {
      continue;
    }

    const value = resolveShortDate(Number(match[1]), Number(match[2]), today, locale);
    if (value !== null) {
      fragments.push({ index: match.index ?? 0, text: match[0], value });
    }
  }

  addLiteralDate(fragments, lower, text, "today", today);
  addLiteralDate(fragments, lower, text, "tomorrow", addDays(today, 1));
  addLiteralDate(fragments, text, text, "今天", today);
  addLiteralDate(fragments, text, text, "今日", today);
  addLiteralDate(fragments, text, text, "明天", addDays(today, 1));
  addLiteralDate(fragments, text, text, "明日", addDays(today, 1));
  addLiteralDate(fragments, text, text, "下一个星期一", nextWeekday(today, 1));

  for (const [weekday, day] of Object.entries(WEEKDAY_BY_ENGLISH)) {
    const pattern = new RegExp(`\\b${weekday}\\b`, "i");
    const match = text.match(pattern);
    if (match?.index !== undefined) {
      fragments.push({ index: match.index, text: match[0], value: nextWeekday(today, day) });
    }
  }

  return fragments
    .sort((left, right) => left.index - right.index)
    .map(({ text: fragmentText, value }) => ({ text: fragmentText, value }));
}

function addLiteralDate(
  fragments: Array<{ text: string; value: DateOnly; index: number }>,
  searchable: string,
  original: string,
  needle: string,
  value: DateOnly,
) {
  const index = searchable.indexOf(needle.toLowerCase());
  if (index >= 0) {
    fragments.push({ index, text: original.slice(index, index + needle.length), value });
  }
}

function resolveShortDate(
  first: number,
  second: number,
  today: DateOnly,
  locale: string,
): DateOnly | null {
  if (first < 1 || second < 1) {
    return null;
  }

  const monthFirst =
    !locale.toLowerCase().startsWith("ja") && !locale.toLowerCase().startsWith("zh");
  const month = monthFirst ? first : second;
  const day = monthFirst ? second : first;

  if (month > 12 || day > 31) {
    return null;
  }

  const currentYear = Number(today.slice(0, 4));
  const thisYear = formatDate(currentYear, month, day);
  return thisYear < today ? formatDate(currentYear + 1, month, day) : thisYear;
}

function nextWeekday(today: DateOnly, targetDay: number): DateOnly {
  const date = new Date(`${today}T00:00:00Z`);
  const currentDay = date.getUTCDay();
  const days = (targetDay - currentDay + 7) % 7 || 7;
  return addDays(today, days);
}

function normalizeTime(time: string) {
  const [hour, minute] = time.split(":");
  return `${hour?.padStart(2, "0")}:${minute}:00`;
}

function isIgnoredFragment(
  ignoredFragments: QuickAddFragment[],
  text: string,
  normalizedValue: string,
) {
  return ignoredFragments.some(
    (fragment) => fragment.text === text || fragment.normalizedValue === normalizedValue,
  );
}

function formatDate(year: number, month: number, day: number): DateOnly {
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function cleanSourceTitle(text: string, fragments: Array<string | null>) {
  let cleaned = text;

  for (const fragment of fragments.filter((value): value is string => Boolean(value))) {
    cleaned = cleaned.replace(fragment, " ");
  }

  return cleaned
    .replace(/\b(?:deadline|due|by|review)\b/gi, " ")
    .replace(/截止|締切|レビュー/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}
