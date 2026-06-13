import { describe, expect, it } from "vitest";

import { detectLanguage, formatMessage, getDefaultLocale, messages } from "./messages";

describe("message helpers", () => {
  it("falls back to English for unsupported browser languages", () => {
    expect(detectLanguage("fr-FR")).toBe("en");
  });

  it("maps supported browser language families", () => {
    expect(detectLanguage("zh-TW")).toBe("zh-Hans");
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
});
