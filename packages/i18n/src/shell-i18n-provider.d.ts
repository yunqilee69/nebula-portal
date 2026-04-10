import type { ReactNode } from "react";
interface ShellI18nProviderProps {
    children: ReactNode;
    onLocaleChange?: (locale: "zh-CN" | "en-US") => void;
}
export declare function ShellI18nProvider({ children, onLocaleChange }: ShellI18nProviderProps): import("react/jsx-runtime").JSX.Element;
export {};
//# sourceMappingURL=shell-i18n-provider.d.ts.map