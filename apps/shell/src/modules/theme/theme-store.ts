import { create } from "zustand";

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
  upsertTheme: (theme: ThemeSnapshot) => void;
}

const STORAGE_KEY = "nebula-shell-theme-code";

export const builtinThemeCatalog = {
  themes: [
    {
      themeCode: "nebula-light",
      themeName: "Nebula Light",
      builtinFlag: true,
      themeConfig: {
        primaryColor: "#1f6feb",
        sidebarColor: "#0f172a",
        headerColor: "#ffffff",
        backgroundColor: "#f8fafc",
        textColor: "#0f172a",
      },
    },
    {
      themeCode: "nebula-graphite",
      themeName: "Nebula Graphite",
      builtinFlag: true,
      themeConfig: {
        primaryColor: "#0f766e",
        sidebarColor: "#1c1917",
        headerColor: "#292524",
        backgroundColor: "#f5f5f4",
        textColor: "#1c1917",
      },
    },
  ] satisfies ThemeSnapshot[],
};

function resolveTheme(themeCode: string, themes: ThemeSnapshot[]) {
  return themes.find((item) => item.themeCode === themeCode) ?? themes[0];
}

function readStoredThemeCode() {
  return typeof window === "undefined" ? null : window.localStorage.getItem(STORAGE_KEY);
}

export const useThemeStore = create<ThemeState>((set, get) => ({
  hydrated: false,
  currentTheme: builtinThemeCatalog.themes[0],
  availableThemes: builtinThemeCatalog.themes,
  hydrate: (themeCode, themes) => {
    const availableThemes = themes?.length ? themes : get().availableThemes;
    const storedThemeCode = readStoredThemeCode();
    const resolved = resolveTheme(storedThemeCode ?? themeCode, availableThemes);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(STORAGE_KEY, resolved.themeCode);
    }
    set({ hydrated: true, availableThemes, currentTheme: resolved });
  },
  setAvailableThemes: (themes) => {
    const merged = [...builtinThemeCatalog.themes.filter((builtin) => !themes.some((item) => item.themeCode === builtin.themeCode)), ...themes];
    const resolved = resolveTheme(get().currentTheme.themeCode, merged);
    set({ availableThemes: merged, currentTheme: resolved });
  },
  applyTheme: (themeCode) => {
    const resolved = resolveTheme(themeCode, get().availableThemes);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(STORAGE_KEY, resolved.themeCode);
    }
    set({ currentTheme: resolved, hydrated: true });
    return resolved;
  },
  upsertTheme: (theme) => {
    const current = get().availableThemes.filter((item) => item.themeCode !== theme.themeCode);
    const merged = [...current, theme];
    set({ availableThemes: merged });
  },
}));
