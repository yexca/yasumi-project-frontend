import { describe, expect, it } from "vitest";

import { formatLocalDateTime } from "@/domain/time/dateOnly";

import { formatBackendError } from "./errors";
import { detectLanguage, formatMessage, getDefaultLocale, messages } from "./messages";

describe("message helpers", () => {
  it("falls back to English for unsupported browser languages", () => {
    expect(detectLanguage("fr-FR")).toBe("en");
  });

  it("maps supported browser language families", () => {
    expect(detectLanguage("zh-CN")).toBe("zh-Hans");
    expect(detectLanguage("zh-SG")).toBe("zh-Hans");
    expect(detectLanguage("ja-JP")).toBe("ja");
  });

  it("formats token values", () => {
    expect(formatMessage("Area {areaId}", { areaId: "home" })).toBe("Area home");
  });

  it("returns default locale by language", () => {
    expect(getDefaultLocale("ja")).toBe("ja-JP");
  });

  it("keeps supported language catalogs aligned with English keys", () => {
    const englishKeys = Object.keys(messages.en).sort();

    for (const [language, catalog] of Object.entries(messages)) {
      expect(Object.keys(catalog).sort(), language).toEqual(englishKeys);
    }
  });

  it("formats local date-times with the fixed MVP standard", () => {
    expect(formatLocalDateTime("2026-06-14T08:30:45Z", "Asia/Tokyo")).toBe("2026-06-14 17:30:45");
  });

  it("maps backend errors through localized codes and fields", () => {
    const message = formatBackendError(
      {
        code: "validation_failed",
        fields: {
          time_zone: "backend diagnostic detail",
        },
        retryable: false,
      },
      (key) => messages.en[key] ?? key,
    );

    expect(message).toBe("Some fields need review. Timezone");
    expect(message).not.toContain("backend diagnostic detail");
  });
});
