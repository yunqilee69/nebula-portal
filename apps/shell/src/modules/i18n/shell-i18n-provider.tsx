import { I18nProvider } from "@platform/core";
import type { ReactNode } from "react";
import { shellMessages } from "./shell-messages";
import { applyShellLocale } from "./i18n-service";
import { useI18nStore } from "./i18n-store";

interface ShellI18nProviderProps {
  children: ReactNode;
}

export function ShellI18nProvider({ children }: ShellI18nProviderProps) {
  const locale = useI18nStore((state) => state.locale);

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
