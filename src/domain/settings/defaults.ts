import {
  DEFAULT_LOCALES_BY_LANGUAGE,
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
