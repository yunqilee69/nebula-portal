import { create } from "zustand";
import type { LocaleCode } from "@platform/core";

interface I18nState {
  locale: LocaleCode;
  hydrated: boolean;
  setLocale: (locale: LocaleCode) => void;
  markHydrated: () => void;
}

export const useI18nStore = create<I18nState>((set) => ({
  locale: "zh-CN",
  hydrated: false,
  setLocale: (locale) => set({ locale }),
  markHydrated: () => set({ hydrated: true }),
}));
