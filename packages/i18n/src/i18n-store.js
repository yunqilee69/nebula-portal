import { create } from "zustand";
export const useI18nStore = create((set) => ({
    locale: "zh-CN",
    hydrated: false,
    setLocale: (locale) => set({ locale }),
    hydrate: (locale) => set({ locale, hydrated: true }),
}));
