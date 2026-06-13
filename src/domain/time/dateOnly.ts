export type DateOnly = string;
export type LocalTime = string;
export type Instant = string;

const DATE_ONLY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const LOCAL_TIME_PATTERN = /^\d{2}:\d{2}:\d{2}$/;
const RFC3339_INSTANT_PATTERN =
  /^(\d{4})-(\d{2})-(\d{2})T([01]\d|2[0-3]):([0-5]\d):([0-5]\d)(?:\.\d+)?(?:Z|[+-](?:[01]\d|2[0-3]):[0-5]\d)$/;

export function isDateOnly(value: unknown): value is DateOnly {
  if (typeof value !== "string" || !DATE_ONLY_PATTERN.test(value)) {
    return false;
  }

  const [year, month, day] = parseDateParts(value);
  const parsed = new Date(Date.UTC(year, month - 1, day));

  return (
    parsed.getUTCFullYear() === year &&
    parsed.getUTCMonth() === month - 1 &&
    parsed.getUTCDate() === day
  );
}

export function assertDateOnly(value: unknown): DateOnly {
  if (!isDateOnly(value)) {
    throw new Error("Expected YYYY-MM-DD date-only value.");
  }

  return value;
}

export function isLocalTime(value: unknown): value is LocalTime {
  if (typeof value !== "string" || !LOCAL_TIME_PATTERN.test(value)) {
    return false;
  }

  const [hour, minute, second] = value.split(":").map(Number);
  return hour !== undefined && minute !== undefined && second !== undefined
    ? hour >= 0 && hour <= 23 && minute >= 0 && minute <= 59 && second >= 0 && second <= 59
    : false;
}

export function isInstant(value: unknown): value is Instant {
  if (typeof value !== "string") {
    return false;
  }

  const match = RFC3339_INSTANT_PATTERN.exec(value);
  if (match === null) {
    return false;
  }

  const [, yearValue, monthValue, dayValue] = match;
  const year = Number(yearValue);
  const month = Number(monthValue);
  const day = Number(dayValue);
  const parsedDate = new Date(Date.UTC(year, month - 1, day));

  return (
    parsedDate.getUTCFullYear() === year &&
    parsedDate.getUTCMonth() === month - 1 &&
    parsedDate.getUTCDate() === day &&
    !Number.isNaN(Date.parse(value))
  );
}

export function compareDateOnly(left: DateOnly | null, right: DateOnly | null): number {
  if (left === right) {
    return 0;
  }

  if (left === null) {
    return 1;
  }

  if (right === null) {
    return -1;
  }

  return left.localeCompare(right);
}

export function addDays(date: DateOnly, days: number): DateOnly {
  const [year, month, day] = parseDateParts(date);
  const parsed = new Date(Date.UTC(year, month - 1, day + days));

  return formatUtcDate(parsed);
}

export function daysBetween(start: DateOnly, end: DateOnly): number {
  return (toUtcEpochDay(end) - toUtcEpochDay(start)) / 86_400_000;
}

export function isOnOrBefore(left: DateOnly | null, right: DateOnly): boolean {
  return left !== null && left <= right;
}

function toUtcEpochDay(date: DateOnly): number {
  const [year, month, day] = parseDateParts(date);
  return Date.UTC(year, month - 1, day);
}

function formatUtcDate(date: Date): DateOnly {
  const year = date.getUTCFullYear().toString().padStart(4, "0");
  const month = (date.getUTCMonth() + 1).toString().padStart(2, "0");
  const day = date.getUTCDate().toString().padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function parseDateParts(value: string): [number, number, number] {
  const [year, month, day] = value.split("-").map(Number);

  if (year === undefined || month === undefined || day === undefined) {
    throw new Error("Invalid date-only value.");
  }

  return [year, month, day];
}
