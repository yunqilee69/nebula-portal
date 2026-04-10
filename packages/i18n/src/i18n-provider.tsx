import type { ReactNode } from "react";
import { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { LocaleCode } from "@nebula/request";

export type LocaleMessages = Record<string, string>;
export type LocaleBundle = Record<LocaleCode, LocaleMessages>;

interface I18nContextValue {
  locale: LocaleCode;
  setLocale: (locale: LocaleCode) => void;
  t: (key: string, fallback?: string, variables?: Record<string, string | number>) => string;
}

interface I18nProviderProps {
  children: ReactNode;
  defaultLocale?: LocaleCode;
  messages: LocaleBundle;
  storageKey?: string;
  locale?: LocaleCode;
  onLocaleChange?: (locale: LocaleCode) => void;
}

const I18nContext = createContext<I18nContextValue | null>(null);

function interpolate(message: string, variables?: Record<string, string | number>) {
  if (!variables) {
    return message;
  }

  return Object.entries(variables).reduce(
    (result, [key, value]) => result.replaceAll(`{${key}}`, String(value)),
    message,
  );
}

export function I18nProvider({
  children,
  defaultLocale = "zh-CN",
  messages,
  storageKey = "nebula-locale",
  locale: controlledLocale,
  onLocaleChange,
}: I18nProviderProps) {
  const [internalLocale, setInternalLocale] = useState<LocaleCode>(() => {
    if (typeof window === "undefined") {
      return defaultLocale;
    }

    const stored = window.localStorage.getItem(storageKey);
    return stored === "en-US" || stored === "zh-CN" ? stored : defaultLocale;
  });
  const locale = controlledLocale ?? internalLocale;

  const setLocale = (nextLocale: LocaleCode) => {
    if (controlledLocale === undefined) {
      setInternalLocale(nextLocale);
    }
    onLocaleChange?.(nextLocale);
  };

  useEffect(() => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(storageKey, locale);
    }
  }, [locale, storageKey]);

  const value = useMemo<I18nContextValue>(
    () => ({
      locale,
      setLocale,
      t: (key, fallback, variables) => {
        const template = messages[locale]?.[key] ?? messages[defaultLocale]?.[key] ?? fallback ?? key;
        return interpolate(template, variables);
      },
    }),
    [defaultLocale, locale, messages],
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error("useI18n must be used within I18nProvider");
  }
  return context;
}
