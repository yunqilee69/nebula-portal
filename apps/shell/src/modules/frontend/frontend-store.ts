import type { LocaleCode } from "@platform/core";
import { create } from "zustand";
import type {
  FrontendConfigDto,
  FrontendInitDto,
  FrontendLoginConfigDto,
  FrontendPreferenceDto,
  FrontendThemeCatalogDto,
} from "../../api/frontend-api";
import { builtinThemeCatalog } from "../theme/theme-store";

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
}

export const useFrontendStore = create<FrontendState>((set) => ({
  hydrated: false,
  frontendConfig: defaultConfig,
  loginConfig: {},
  defaultPreference,
  themeCatalog: {
    themes: builtinThemeCatalog.themes,
    configItems: [
      { configKey: "primaryColor", configName: "Primary Color", defaultValue: "#1f6feb" },
      { configKey: "sidebarColor", configName: "Sidebar Color", defaultValue: "#0f172a" },
      { configKey: "headerColor", configName: "Header Color", defaultValue: "#ffffff" },
      { configKey: "backgroundColor", configName: "Background Color", defaultValue: "#f8fafc" },
      { configKey: "textColor", configName: "Text Color", defaultValue: "#0f172a" },
    ],
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
}));
