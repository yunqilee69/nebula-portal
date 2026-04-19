import { create } from "zustand";
import type { LocaleCode } from "@nebula/request";

interface I18nState {
  locale: LocaleCode;
  hydrated: boolean;
  setLocale: (locale: LocaleCode) => void;
  hydrate: (locale: LocaleCode) => void;
}

export const useI18nStore = create<I18nState>((set) => ({
  locale: "zh-CN",
  hydrated: false,
  setLocale: (locale) => set({ locale }),
  hydrate: (locale) => set({ locale, hydrated: true }),
}));
