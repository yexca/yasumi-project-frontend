import { LANGUAGE_CODES, type LanguageCode } from "@/domain/constants/shared";
import { detectSupportedLanguage } from "@/domain/settings/defaults";

const LOCAL_LANGUAGE_PREFERENCE_KEY = "yasumi:pre-auth-language";
const localLanguagePreferenceListeners = new Set<() => void>();

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
  emitLocalLanguagePreferenceChange();
}

export function subscribeLocalLanguagePreference(listener: () => void): () => void {
  localLanguagePreferenceListeners.add(listener);

  if (typeof window === "undefined") {
    return () => {
      localLanguagePreferenceListeners.delete(listener);
    };
  }

  const handleStorage = (event: StorageEvent) => {
    if (event.key === LOCAL_LANGUAGE_PREFERENCE_KEY) {
      listener();
    }
  };

  window.addEventListener("storage", handleStorage);

  return () => {
    localLanguagePreferenceListeners.delete(listener);
    window.removeEventListener("storage", handleStorage);
  };
}

function detectBrowserLanguage(): LanguageCode {
  const browserLanguage =
    typeof navigator !== "undefined" ? (navigator.languages?.[0] ?? navigator.language) : "en";

  return detectSupportedLanguage(browserLanguage);
}

function emitLocalLanguagePreferenceChange(): void {
  for (const listener of localLanguagePreferenceListeners) {
    listener();
  }
}
