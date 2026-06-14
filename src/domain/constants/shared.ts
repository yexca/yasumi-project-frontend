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

export const HIDDEN_REASONS = ["converted_to_recurring_template", "recurring_skipped"] as const;

export type HiddenReason = (typeof HIDDEN_REASONS)[number];

export const SCHEDULED_TIME_ZONE_MODES = ["floating"] as const;

export type ScheduledTimeZoneMode = (typeof SCHEDULED_TIME_ZONE_MODES)[number];

export const DEADLINE_TIME_ZONE_MODES = ["date_only", "floating", "fixed"] as const;

export type DeadlineTimeZoneMode = (typeof DEADLINE_TIME_ZONE_MODES)[number];

export const REMINDER_TIME_ZONE_MODES = ["floating", "fixed"] as const;

export type ReminderTimeZoneMode = (typeof REMINDER_TIME_ZONE_MODES)[number];

export const RECURRENCE_FREQUENCIES = ["daily", "weekly", "monthly", "yearly"] as const;

export type RecurrenceFrequency = (typeof RECURRENCE_FREQUENCIES)[number];

export const RECURRENCE_BASES = ["completion_date", "scheduled_date", "deadline_date"] as const;

export type RecurrenceBasis = (typeof RECURRENCE_BASES)[number];

export const RECURRENCE_END_TYPES = ["never", "after_count", "on_date"] as const;

export type RecurrenceEndType = (typeof RECURRENCE_END_TYPES)[number];

export const RECURRING_TEMPLATE_STATUSES = ["active", "on_hold", "abandoned"] as const;

export type RecurringTemplateStatus = (typeof RECURRING_TEMPLATE_STATUSES)[number];

export const LANGUAGE_CODES = ["en", "zh-Hans", "ja"] as const;

export type LanguageCode = (typeof LANGUAGE_CODES)[number];

export const DEFAULT_LOCALES_BY_LANGUAGE = {
  en: "en-US",
  "zh-Hans": "zh-CN",
  ja: "ja-JP",
} as const satisfies Record<LanguageCode, string>;

export const WEEK_START_DAYS = ["sunday", "monday"] as const;

export type WeekStartDay = (typeof WEEK_START_DAYS)[number];

export const TIME_DISPLAY_FORMATS = ["12h", "24h"] as const;

export type TimeDisplayFormat = (typeof TIME_DISPLAY_FORMATS)[number];

export const DEFAULT_TIME_ZONE_MODES = ["floating"] as const;

export type DefaultTimeZoneMode = (typeof DEFAULT_TIME_ZONE_MODES)[number];

export const OPERATION_EVENT_TYPES = [
  "completed",
  "postponed",
  "activated_from_postponed",
  "on_hold",
  "abandoned",
  "restored",
  "reopened",
  "deleted",
  "archived",
  "skipped",
  "generated_next_instance",
  "converted_to_recurring_template",
] as const;

export type OperationEventType = (typeof OPERATION_EVENT_TYPES)[number];

export const TODAY_REASON_KEYS = [
  "scheduledToday",
  "recurringToday",
  "carriedForward",
  "plannedToday",
  "deadlineToday",
  "deadlineTomorrow",
  "deadlineSoon",
  "smallTask",
  "highImportance",
  "postponedSeveralTimes",
  "reviewDateReached",
] as const;

export type TodayReasonKey = (typeof TODAY_REASON_KEYS)[number];

export const ERROR_CODES = [
  "unauthorized",
  "forbidden",
  "not_found",
  "validation_failed",
  "invalid_credentials",
  "username_already_taken",
  "email_already_registered",
  "session_expired",
  "account_disabled",
  "invalid_transition",
  "unsupported_operation",
  "duplicate_recurring_instance",
  "service_unavailable",
] as const;

export type ErrorCode = (typeof ERROR_CODES)[number];

export const ERROR_FIELD_KEYS = [
  "title",
  "username",
  "email",
  "password",
  "identifier",
  "refresh_token",
  "display_name",
  "item_type",
  "status",
  "scheduled_date",
  "deadline_date",
  "deadline_time",
  "deadline_at",
  "deadline_time_zone_mode",
  "user_id",
  "idempotency_key",
  "recurring_sequence",
  "language",
  "locale",
  "week_start_day",
  "time_zone",
  "date_display_format",
  "time_display_format",
  "default_time_zone_mode",
  "today_primary_lookahead_days",
  "deadline_awareness_days",
  "weather_city",
] as const;

export type ErrorFieldKey = (typeof ERROR_FIELD_KEYS)[number];

export const SETTINGS_FIELD_KEYS = [
  "language",
  "locale",
  "week_start_day",
  "time_zone",
  "date_display_format",
  "time_display_format",
  "default_time_zone_mode",
  "today_primary_lookahead_days",
  "deadline_awareness_days",
  "weather_city",
] as const;

export type SettingsFieldKey = (typeof SETTINGS_FIELD_KEYS)[number];

export const METADATA_PRECEDENCE = [
  "deleted_at",
  "archived_at",
  "hidden_reason",
  "status",
] as const;

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
