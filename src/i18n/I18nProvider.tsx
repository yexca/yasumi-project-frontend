import { createContext, useContext, useMemo, type PropsWithChildren } from "react";

import { usePlanningData } from "@/features/planning/usePlanningData";

import { detectLanguage, formatMessage, messages } from "./messages";

type TranslationContextValue = {
  language: keyof typeof messages;
  t: (key: string, values?: Record<string, string | number>) => string;
};

const TranslationContext = createContext<TranslationContextValue | null>(null);

export function I18nProvider({ children }: PropsWithChildren) {
  const { settings } = usePlanningData();

  const value = useMemo<TranslationContextValue>(() => {
    const language = messages[settings.language] ? settings.language : detectLanguage();

    return {
      language,
      t(key, values) {
        const template = messages[language][key] ?? messages.en[key] ?? key;

        return formatMessage(template, values);
      },
    };
  }, [settings.language]);

  return <TranslationContext.Provider value={value}>{children}</TranslationContext.Provider>;
}

export function useTranslation() {
  const value = useContext(TranslationContext);

  if (!value) {
    throw new Error("useTranslation must be used inside I18nProvider.");
  }

  return value;
}
