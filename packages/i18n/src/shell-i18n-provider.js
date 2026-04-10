import { jsx as _jsx } from "react/jsx-runtime";
import { I18nProvider } from "@nebula/core";
import { shellMessages } from "./shell-messages";
import { useI18nStore } from "./i18n-store";
export function ShellI18nProvider({ children, onLocaleChange }) {
    const locale = useI18nStore((state) => state.locale);
    return (_jsx(I18nProvider, { defaultLocale: "zh-CN", locale: locale, onLocaleChange: (nextLocale) => {
            useI18nStore.getState().setLocale(nextLocale);
            onLocaleChange?.(nextLocale);
        }, messages: shellMessages, children: children }));
}
