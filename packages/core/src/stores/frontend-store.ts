import { create } from "zustand";
import { builtinThemeCatalog } from "@nebula/tokens";
import type { LocaleCode } from "../i18n";
import type { FrontendConfigDto, FrontendInitDto, FrontendLoginConfigDto, FrontendPreferenceDto, FrontendThemeCatalogDto } from "@nebula/request";

const defaultConfig: FrontendConfigDto = {
  projectName: "Nebula",
  layoutMode: "side",
  defaultThemeCode: "nebula-light",
  defaultLocale: "zh-CN",
  localeOptions: ["zh-CN", "en-US"],
};

const defaultPreference: FrontendPreferenceDto = {
  localeTag: "zh-CN",
  themeCode: "nebula-light",
  navigationLayoutCode: "side",
  sidebarLayoutCode: "classic",
};

interface FrontendState {
  hydrated: boolean;
  frontendConfig: FrontendConfigDto;
  loginConfig: FrontendLoginConfigDto;
  defaultPreference: FrontendPreferenceDto;
  themeCatalog: FrontendThemeCatalogDto;
  setInit: (payload: FrontendInitDto) => void;
  setHydrated: () => void;
  setThemeCatalog: (payload: FrontendThemeCatalogDto) => void;
  setFrontendConfig: (payload: FrontendConfigDto) => void;
  setDefaultLocale: (locale: LocaleCode) => void;
  setDefaultPreference: (payload: Partial<FrontendPreferenceDto>) => void;
}

export const useFrontendStore = create<FrontendState>((set) => ({
  hydrated: false,
  frontendConfig: defaultConfig,
  loginConfig: {},
  defaultPreference,
  themeCatalog: {
    themes: builtinThemeCatalog.themes,
    configItems: [],
  },
  setInit: (payload) =>
    set({
      hydrated: true,
      frontendConfig: payload.frontendConfig,
      loginConfig: payload.loginConfig,
      defaultPreference: payload.defaultPreference,
    }),
  setHydrated: () => set({ hydrated: true }),
  setThemeCatalog: (payload) => set({ themeCatalog: payload }),
  setFrontendConfig: (payload) => set({ frontendConfig: payload }),
  setDefaultLocale: (locale) => set((state) => ({ defaultPreference: { ...state.defaultPreference, localeTag: locale } })),
  setDefaultPreference: (payload) => set((state) => ({ defaultPreference: { ...state.defaultPreference, ...payload } })),
}));
