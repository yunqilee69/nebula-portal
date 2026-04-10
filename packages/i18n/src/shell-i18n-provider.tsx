import type { ReactNode } from "react";
import { I18nProvider } from "./i18n-provider";
import { shellMessages } from "./shell-messages";
import { useI18nStore } from "./i18n-store";

interface ShellI18nProviderProps {
  children: ReactNode;
  onLocaleChange?: (locale: "zh-CN" | "en-US") => void;
}

export function ShellI18nProvider({ children, onLocaleChange }: ShellI18nProviderProps) {
  const locale = useI18nStore((state) => state.locale);

  return (
    <I18nProvider
      defaultLocale="zh-CN"
      locale={locale}
      onLocaleChange={(nextLocale) => {
        useI18nStore.getState().setLocale(nextLocale);
        onLocaleChange?.(nextLocale);
      }}
      messages={shellMessages}
    >
      {children}
    </I18nProvider>
  );
}
