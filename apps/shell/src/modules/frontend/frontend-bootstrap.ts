import type { LocaleCode } from "@platform/core";
import { fetchFrontendInit, fetchFrontendThemes } from "../../api/frontend-api";
import { useFrontendStore } from "./frontend-store";
import { useI18nStore } from "../i18n/i18n-store";
import { builtinThemeCatalog, useThemeStore } from "../theme/theme-store";

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

export async function hydrateFrontendPublicData() {
  try {
    const payload = await fetchFrontendInit();
    useFrontendStore.getState().setInit(payload);
    const preferredLocale = readStoredLocale() ?? payload.defaultPreference.localeTag ?? payload.frontendConfig.defaultLocale;
    useI18nStore.getState().hydrate(preferredLocale);
    const initialThemes = builtinThemeCatalog.themes;
    useFrontendStore.getState().setThemeCatalog({
      configItems: [],
      themes: initialThemes,
    });
    useThemeStore.getState().hydrate(payload.defaultPreference.themeCode, initialThemes);
    document.title = payload.frontendConfig.projectName;
  } catch {
    useFrontendStore.getState().setHydrated();
    useI18nStore.getState().hydrate("zh-CN");
    useThemeStore.getState().hydrate("nebula-light", builtinThemeCatalog.themes);
    document.title = "Nebula";
  }
}

export async function hydrateFrontendThemeCatalog() {
  const payload = await fetchFrontendThemes();
  const themes = resolveBuiltinThemes(payload.themes.map((item) => item.themeCode));
  const nextPayload = {
    configItems: [],
    themes,
  };
  useFrontendStore.getState().setThemeCatalog(nextPayload);
  useThemeStore.getState().setAvailableThemes(themes);
  return nextPayload;
}
