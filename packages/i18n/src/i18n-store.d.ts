import type { LocaleCode } from "@nebula/request";
interface I18nState {
    locale: LocaleCode;
    hydrated: boolean;
    setLocale: (locale: LocaleCode) => void;
    hydrate: (locale: LocaleCode) => void;
}
export declare const useI18nStore: import("zustand").UseBoundStore<import("zustand").StoreApi<I18nState>>;
export {};
//# sourceMappingURL=i18n-store.d.ts.map