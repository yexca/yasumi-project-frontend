import { LANGUAGE_CODES, type LanguageCode } from "@/domain/constants/shared";
import { detectSupportedLanguage } from "@/domain/settings/defaults";

const LOCAL_LANGUAGE_PREFERENCE_KEY = "yasumi:pre-auth-language";

export function readLocalLanguagePreference(): LanguageCode | null {
  if (typeof localStorage === "undefined") {
    return null;
  }

  const stored = localStorage.getItem(LOCAL_LANGUAGE_PREFERENCE_KEY);

  if (!stored) {
    return null;
  }

  if (LANGUAGE_CODES.includes(stored as LanguageCode)) {
    return stored as LanguageCode;
  }

  localStorage.removeItem(LOCAL_LANGUAGE_PREFERENCE_KEY);
  return null;
}

export function resolveLocalLanguagePreference(): LanguageCode {
  return readLocalLanguagePreference() ?? detectBrowserLanguage();
}

export function persistLocalLanguagePreference(language: LanguageCode): void {
  if (typeof localStorage === "undefined") {
    return;
  }

  localStorage.setItem(LOCAL_LANGUAGE_PREFERENCE_KEY, language);
}

function detectBrowserLanguage(): LanguageCode {
  const browserLanguage =
    typeof navigator !== "undefined" ? (navigator.languages?.[0] ?? navigator.language) : "en";

  return detectSupportedLanguage(browserLanguage);
}
