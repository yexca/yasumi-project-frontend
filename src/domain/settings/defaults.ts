import {
  DEFAULT_LOCALES_BY_LANGUAGE,
  LANGUAGE_CODES,
  TIME_DISPLAY_FORMATS,
  WEEK_START_DAYS,
  type DefaultTimeZoneMode,
  type LanguageCode,
  type TimeDisplayFormat,
  type WeekStartDay,
} from "@/domain/constants/shared";

export type UserSettingsDefaults = {
  language: LanguageCode;
  locale: string;
  week_start_day: WeekStartDay;
  time_zone: string;
  date_display_format: "YYYY-MM-DD";
  time_display_format: TimeDisplayFormat;
  default_time_zone_mode: DefaultTimeZoneMode;
  today_primary_lookahead_days: number;
  deadline_awareness_days: number;
};

const REGIONAL_DEFAULTS = {
  en: {
    week_start_day: "sunday",
    time_display_format: "12h",
  },
  "zh-Hans": {
    week_start_day: "monday",
    time_display_format: "24h",
  },
  ja: {
    week_start_day: "monday",
    time_display_format: "24h",
  },
} as const satisfies Record<
  LanguageCode,
  {
    week_start_day: WeekStartDay;
    time_display_format: TimeDisplayFormat;
  }
>;

export function buildDefaultUserSettings(
  language: LanguageCode,
  deviceTimeZone: string,
): UserSettingsDefaults {
  const regionalDefaults = REGIONAL_DEFAULTS[language];

  return {
    language,
    locale: DEFAULT_LOCALES_BY_LANGUAGE[language],
    week_start_day: regionalDefaults.week_start_day,
    time_zone: deviceTimeZone,
    date_display_format: "YYYY-MM-DD",
    time_display_format: regionalDefaults.time_display_format,
    default_time_zone_mode: "floating",
    today_primary_lookahead_days: 3,
    deadline_awareness_days: 14,
  };
}

export function detectSupportedLanguage(language: string | undefined): LanguageCode {
  if (!language) {
    return "en";
  }

  const normalized = language.toLowerCase();

  if (
    normalized === "zh-hans" ||
    normalized.startsWith("zh-cn") ||
    normalized.startsWith("zh-sg") ||
    normalized.startsWith("zh-hans")
  ) {
    return "zh-Hans";
  }

  if (normalized.startsWith("ja")) {
    return "ja";
  }

  if (normalized.startsWith("en")) {
    return "en";
  }

  return LANGUAGE_CODES.includes(language as LanguageCode) ? (language as LanguageCode) : "en";
}

export function getDefaultDeviceTimeZone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
  } catch {
    return "UTC";
  }
}

export function isValidTimeZone(timeZone: string): boolean {
  try {
    new Intl.DateTimeFormat("en-US", { timeZone }).format(new Date());
    return true;
  } catch {
    return false;
  }
}

export function isUserSettingsDefaults(value: unknown): value is UserSettingsDefaults {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const settings = value as Partial<UserSettingsDefaults>;

  return (
    LANGUAGE_CODES.includes(settings.language as LanguageCode) &&
    typeof settings.locale === "string" &&
    WEEK_START_DAYS.includes(settings.week_start_day as WeekStartDay) &&
    typeof settings.time_zone === "string" &&
    isValidTimeZone(settings.time_zone) &&
    settings.date_display_format === "YYYY-MM-DD" &&
    TIME_DISPLAY_FORMATS.includes(settings.time_display_format as TimeDisplayFormat) &&
    settings.default_time_zone_mode === "floating" &&
    isPositiveInteger(settings.today_primary_lookahead_days) &&
    isPositiveInteger(settings.deadline_awareness_days)
  );
}

function isPositiveInteger(value: unknown): value is number {
  return typeof value === "number" && Number.isInteger(value) && value > 0;
}
