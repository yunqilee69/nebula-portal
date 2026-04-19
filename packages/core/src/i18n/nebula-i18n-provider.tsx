import type { ReactNode } from "react";
import { I18nProvider } from "./i18n-provider";
import { nebulaMessages } from "./nebula-messages";
import { useI18nStore } from "./i18n-store";

interface NebulaI18nProviderProps {
  children: ReactNode;
  onLocaleChange?: (locale: "zh-CN" | "en-US") => void;
}

export function NebulaI18nProvider({ children, onLocaleChange }: NebulaI18nProviderProps) {
  const locale = useI18nStore((state) => state.locale);

  return (
    <I18nProvider
      defaultLocale="zh-CN"
      locale={locale}
      onLocaleChange={(nextLocale) => {
        useI18nStore.getState().setLocale(nextLocale);
        onLocaleChange?.(nextLocale);
      }}
      messages={nebulaMessages}
    >
      {children}
    </I18nProvider>
  );
}
