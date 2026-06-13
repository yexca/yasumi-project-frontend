export const ITEM_TYPES = ["inbox", "date_task", "deadline_task", "idea"] as const;

export type ItemType = (typeof ITEM_TYPES)[number];

export const BUSINESS_STATUSES = [
  "active",
  "completed",
  "postponed",
  "on_hold",
  "abandoned",
] as const;

export type BusinessStatus = (typeof BUSINESS_STATUSES)[number];

export const LANGUAGE_CODES = ["en", "zh-Hans", "ja"] as const;

export type LanguageCode = (typeof LANGUAGE_CODES)[number];

export const DEFAULT_LOCALES_BY_LANGUAGE = {
  en: "en-US",
  "zh-Hans": "zh-CN",
  ja: "ja-JP",
} as const satisfies Record<LanguageCode, string>;

export const WEEK_START_DAYS = ["sunday", "monday"] as const;

export type WeekStartDay = (typeof WEEK_START_DAYS)[number];

export const ALLOWED_STATUS_TRANSITIONS = [
  ["active", "completed"],
  ["active", "postponed"],
  ["active", "on_hold"],
  ["active", "abandoned"],
  ["postponed", "active"],
  ["postponed", "completed"],
  ["postponed", "on_hold"],
  ["postponed", "abandoned"],
  ["on_hold", "active"],
  ["on_hold", "abandoned"],
  ["abandoned", "active"],
  ["completed", "active"],
] as const satisfies ReadonlyArray<readonly [BusinessStatus, BusinessStatus]>;
