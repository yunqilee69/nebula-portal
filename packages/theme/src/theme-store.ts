import { create } from "zustand";
import { normalizeThemeConfig } from "./theme-tokens";

export interface ThemeSnapshot {
  themeCode: string;
  themeName: string;
  builtinFlag: boolean;
  themeConfig: Record<string, string>;
}

interface ThemeState {
  hydrated: boolean;
  currentTheme: ThemeSnapshot;
  availableThemes: ThemeSnapshot[];
  hydrate: (themeCode: string, themes?: ThemeSnapshot[]) => void;
  setAvailableThemes: (themes: ThemeSnapshot[]) => void;
  applyTheme: (themeCode: string) => ThemeSnapshot;
}

const STORAGE_KEY = "nebula-shell-theme-code";

export const builtinThemeCatalog = {
  themes: [
    {
      themeCode: "nebula-light",
      themeName: "Nebula Light",
      builtinFlag: true,
      themeConfig: normalizeThemeConfig({
        primaryColor: "#1f6feb",
        secondaryColor: "#4f8cff",
        successColor: "#16a34a",
        warningColor: "#d97706",
        errorColor: "#dc2626",
        sidebarColor: "#0f172a",
        headerColor: "#ffffff",
        surfaceColor: "#ffffff",
        backgroundColor: "#f8fafc",
        textColor: "#0f172a",
        textSecondaryColor: "#6b7280",
        borderColor: "#d0d7e2",
        borderRadius: "8",
        fontSize: "14",
        controlHeight: "34",
      }),
    },
    {
      themeCode: "nebula-graphite",
      themeName: "Nebula Graphite",
      builtinFlag: true,
      themeConfig: normalizeThemeConfig({
        primaryColor: "#0f766e",
        secondaryColor: "#14b8a6",
        successColor: "#15803d",
        warningColor: "#d97706",
        errorColor: "#b91c1c",
        sidebarColor: "#1c1917",
        headerColor: "#292524",
        surfaceColor: "#fafaf9",
        backgroundColor: "#f5f5f4",
        textColor: "#1c1917",
        textSecondaryColor: "#57534e",
        borderColor: "#d6d3d1",
        borderRadius: "8",
        fontSize: "14",
        controlHeight: "34",
      }),
    },
  ] satisfies ThemeSnapshot[],
};

function resolveTheme(themeCode: string, themes: ThemeSnapshot[]) {
  return themes.find((item) => item.themeCode === themeCode);
}

function readStoredThemeCode() {
  return typeof window === "undefined" ? null : window.localStorage.getItem(STORAGE_KEY);
}

function mergeThemes(themes: ThemeSnapshot[]) {
  const merged = new Map<string, ThemeSnapshot>();

  for (const builtin of builtinThemeCatalog.themes) {
    merged.set(builtin.themeCode, builtin);
  }

  for (const theme of themes) {
    if (builtinThemeCatalog.themes.some((builtin) => builtin.themeCode === theme.themeCode)) {
      merged.set(theme.themeCode, { ...theme, themeConfig: normalizeThemeConfig(theme.themeConfig) });
    }
  }

  return Array.from(merged.values());
}

export const useThemeStore = create<ThemeState>((set, get) => ({
  hydrated: false,
  currentTheme: builtinThemeCatalog.themes[0],
  availableThemes: mergeThemes(builtinThemeCatalog.themes),
  hydrate: (themeCode, themes) => {
    const availableThemes = mergeThemes(themes?.length ? themes : get().availableThemes);
    const storedThemeCode = readStoredThemeCode();
    const resolved = resolveTheme(storedThemeCode ?? "", availableThemes)
      ?? resolveTheme(themeCode, availableThemes)
      ?? availableThemes[0];
    if (typeof window !== "undefined") {
      window.localStorage.setItem(STORAGE_KEY, resolved.themeCode);
    }
    set({ hydrated: true, availableThemes, currentTheme: resolved });
  },
  setAvailableThemes: (themes) => {
    const merged = mergeThemes(themes);
    const resolved = resolveTheme(get().currentTheme.themeCode, merged) ?? merged[0];
    set({ availableThemes: merged, currentTheme: resolved });
  },
  applyTheme: (themeCode) => {
    const resolved = resolveTheme(themeCode, get().availableThemes) ?? get().availableThemes[0];
    if (typeof window !== "undefined") {
      window.localStorage.setItem(STORAGE_KEY, resolved.themeCode);
    }
    set({ currentTheme: resolved, hydrated: true });
    return resolved;
  },
}));
