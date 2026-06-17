import { createContext, useContext, useEffect, useMemo, useState, type PropsWithChildren } from "react";

import { useAuth } from "@/features/auth/AuthProvider";
import { usePlanningData } from "@/features/planning/PlanningDataProvider";
import type { LanguageCode } from "@/domain/constants/shared";

import { detectLanguage, formatMessage, messages } from "./messages";
import {
  persistLocalLanguagePreference,
  resolveLocalLanguagePreference,
} from "./localLanguagePreference";

type TranslationContextValue = {
  language: keyof typeof messages;
  setLanguage: (language: LanguageCode) => void;
  t: (key: string, values?: Record<string, string | number>) => string;
};

const TranslationContext = createContext<TranslationContextValue | null>(null);

export function I18nProvider({ children }: PropsWithChildren) {
  const { session } = useAuth();
  const { settings } = usePlanningData();
  const [localLanguage, setLocalLanguage] = useState<LanguageCode>(resolveLocalLanguagePreference);

  useEffect(() => {
    if (!session || !messages[settings.language] || settings.language === localLanguage) {
      return;
    }

    persistLocalLanguagePreference(settings.language);
    setLocalLanguage(settings.language);
  }, [localLanguage, session, settings.language]);

  const value = useMemo<TranslationContextValue>(() => {
    const language = session
      ? messages[settings.language]
        ? settings.language
        : localLanguage
      : localLanguage || detectLanguage();

    return {
      language,
      setLanguage(nextLanguage) {
        persistLocalLanguagePreference(nextLanguage);
        setLocalLanguage(nextLanguage);
      },
      t(key, values) {
        const template = messages[language][key] ?? messages.en[key] ?? key;

        return formatMessage(template, values);
      },
    };
  }, [localLanguage, session, settings.language]);

  return <TranslationContext.Provider value={value}>{children}</TranslationContext.Provider>;
}

export function useTranslation() {
  const value = useContext(TranslationContext);

  if (!value) {
    throw new Error("useTranslation must be used inside I18nProvider.");
  }

  return value;
}
