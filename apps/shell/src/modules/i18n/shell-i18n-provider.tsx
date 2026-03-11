import { I18nProvider } from "@platform/core";
import { useEffect } from "react";
import type { ReactNode } from "react";
import { shellMessages } from "./shell-messages";
import { applyShellLocale, hydrateShellLocale } from "./i18n-service";
import { useI18nStore } from "./i18n-store";

interface ShellI18nProviderProps {
  children: ReactNode;
}

export function ShellI18nProvider({ children }: ShellI18nProviderProps) {
  const locale = useI18nStore((state) => state.locale);

  useEffect(() => {
    hydrateShellLocale().catch(() => {
      useI18nStore.getState().markHydrated();
    });
  }, []);

  return (
    <I18nProvider
      defaultLocale="zh-CN"
      locale={locale}
      onLocaleChange={(nextLocale) => {
        applyShellLocale(nextLocale).catch(() => undefined);
      }}
      messages={shellMessages}
    >
      {children}
    </I18nProvider>
  );
}
