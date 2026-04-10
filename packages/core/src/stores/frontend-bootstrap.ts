import { useI18nStore, type LocaleCode } from "@nebula/i18n";
import { builtinThemeCatalog, useThemeStore } from "@nebula/tokens";
import { useFrontendStore } from "./frontend-store";

function resolveBuiltinThemes(themeCodes?: string[]) {
  if (!themeCodes?.length) {
    return builtinThemeCatalog.themes;
  }

  const builtins = builtinThemeCatalog.themes.filter((item) => themeCodes.includes(item.themeCode));
  return builtins.length ? builtins : builtinThemeCatalog.themes;
}

const SHELL_LOCALE_STORAGE_KEY = "nebula-shell-preferred-locale";

function readStoredLocale(): LocaleCode | null {
  if (typeof window === "undefined") {
    return null;
  }
  const stored = window.localStorage.getItem(SHELL_LOCALE_STORAGE_KEY);
  return stored === "en-US" || stored === "zh-CN" ? stored : null;
}

export function hydrateFrontendPublicData(payload: {
  frontendConfig: { projectName: string; defaultLocale: string };
  defaultPreference: { localeTag?: string; themeCode?: string };
}) {
  try {
    useFrontendStore.getState().setInit({
      frontendConfig: {
        projectName: payload.frontendConfig.projectName,
        layoutMode: "side",
        defaultThemeCode: "nebula-light",
        defaultLocale: payload.frontendConfig.defaultLocale as "zh-CN" | "en-US",
        localeOptions: ["zh-CN", "en-US"],
      },
      defaultPreference: {
        localeTag: (payload.defaultPreference.localeTag ?? payload.frontendConfig.defaultLocale) as "zh-CN" | "en-US",
        themeCode: payload.defaultPreference.themeCode ?? "nebula-light",
        navigationLayoutCode: "classic",
        sidebarLayoutCode: "classic",
      },
      loginConfig: {},
    });
    const preferredLocale = (readStoredLocale() ?? payload.defaultPreference.localeTag ?? payload.frontendConfig.defaultLocale) as LocaleCode;
    useI18nStore.getState().hydrate(preferredLocale);
    const initialThemes = builtinThemeCatalog.themes;
    useFrontendStore.getState().setThemeCatalog({
      configItems: [],
      themes: initialThemes,
    });
    useThemeStore.getState().hydrate(payload.defaultPreference.themeCode ?? "nebula-light", initialThemes);
    document.title = payload.frontendConfig.projectName;
  } catch {
    useFrontendStore.getState().setHydrated();
    useI18nStore.getState().hydrate("zh-CN");
    useThemeStore.getState().hydrate("nebula-light", builtinThemeCatalog.themes);
    document.title = "Nebula";
  }
}

export function hydrateFrontendThemeCatalog(payload: { themes: Array<{ themeCode: string }> }) {
  const themes = resolveBuiltinThemes(payload.themes.map((item) => item.themeCode));
  const nextPayload = {
    configItems: [],
    themes,
  };
  useFrontendStore.getState().setThemeCatalog(nextPayload);
  useThemeStore.getState().setAvailableThemes(themes);
  return nextPayload;
}
