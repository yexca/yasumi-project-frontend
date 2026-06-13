import {
  BUSINESS_STATUSES,
  DEADLINE_TIME_ZONE_MODES,
  DEFAULT_TIME_ZONE_MODES,
  ERROR_CODES,
  ERROR_FIELD_KEYS,
  HIDDEN_REASONS,
  ITEM_TYPES,
  LANGUAGE_CODES,
  OPERATION_EVENT_TYPES,
  RECURRENCE_BASES,
  RECURRENCE_END_TYPES,
  RECURRENCE_FREQUENCIES,
  RECURRING_TEMPLATE_STATUSES,
  REMINDER_TIME_ZONE_MODES,
  SCHEDULED_TIME_ZONE_MODES,
  SETTINGS_FIELD_KEYS,
  TIME_DISPLAY_FORMATS,
  TODAY_REASON_KEYS,
  WEEK_START_DAYS,
  type BusinessStatus,
  type DeadlineTimeZoneMode,
  type DefaultTimeZoneMode,
  type ErrorCode,
  type ErrorFieldKey,
  type HiddenReason,
  type ItemType,
  type LanguageCode,
  type OperationEventType,
  type RecurrenceBasis,
  type RecurrenceEndType,
  type RecurrenceFrequency,
  type RecurringTemplateStatus,
  type ReminderTimeZoneMode,
  type ScheduledTimeZoneMode,
  type SettingsFieldKey,
  type TimeDisplayFormat,
  type TodayReasonKey,
  type WeekStartDay,
} from "@/domain/constants/shared";

function isOneOf<const Values extends readonly string[]>(
  values: Values,
  value: unknown,
): value is Values[number] {
  return typeof value === "string" && values.includes(value);
}

export const isItemType = (value: unknown): value is ItemType => isOneOf(ITEM_TYPES, value);

export const isBusinessStatus = (value: unknown): value is BusinessStatus =>
  isOneOf(BUSINESS_STATUSES, value);

export const isHiddenReason = (value: unknown): value is HiddenReason =>
  isOneOf(HIDDEN_REASONS, value);

export const isScheduledTimeZoneMode = (value: unknown): value is ScheduledTimeZoneMode =>
  isOneOf(SCHEDULED_TIME_ZONE_MODES, value);

export const isDeadlineTimeZoneMode = (value: unknown): value is DeadlineTimeZoneMode =>
  isOneOf(DEADLINE_TIME_ZONE_MODES, value);

export const isReminderTimeZoneMode = (value: unknown): value is ReminderTimeZoneMode =>
  isOneOf(REMINDER_TIME_ZONE_MODES, value);

export const isRecurrenceFrequency = (value: unknown): value is RecurrenceFrequency =>
  isOneOf(RECURRENCE_FREQUENCIES, value);

export const isRecurrenceBasis = (value: unknown): value is RecurrenceBasis =>
  isOneOf(RECURRENCE_BASES, value);

export const isRecurrenceEndType = (value: unknown): value is RecurrenceEndType =>
  isOneOf(RECURRENCE_END_TYPES, value);

export const isRecurringTemplateStatus = (value: unknown): value is RecurringTemplateStatus =>
  isOneOf(RECURRING_TEMPLATE_STATUSES, value);

export const isWeekStartDay = (value: unknown): value is WeekStartDay =>
  isOneOf(WEEK_START_DAYS, value);

export const isLanguageCode = (value: unknown): value is LanguageCode =>
  isOneOf(LANGUAGE_CODES, value);

export const isTimeDisplayFormat = (value: unknown): value is TimeDisplayFormat =>
  isOneOf(TIME_DISPLAY_FORMATS, value);

export const isDefaultTimeZoneMode = (value: unknown): value is DefaultTimeZoneMode =>
  isOneOf(DEFAULT_TIME_ZONE_MODES, value);

export const isOperationEventType = (value: unknown): value is OperationEventType =>
  isOneOf(OPERATION_EVENT_TYPES, value);

export const isTodayReasonKey = (value: unknown): value is TodayReasonKey =>
  isOneOf(TODAY_REASON_KEYS, value);

export const isErrorCode = (value: unknown): value is ErrorCode => isOneOf(ERROR_CODES, value);

export const isErrorFieldKey = (value: unknown): value is ErrorFieldKey =>
  isOneOf(ERROR_FIELD_KEYS, value);

export const isSettingsFieldKey = (value: unknown): value is SettingsFieldKey =>
  isOneOf(SETTINGS_FIELD_KEYS, value);
