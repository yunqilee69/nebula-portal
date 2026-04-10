import { create } from "zustand";
import { normalizeThemeConfig } from "./tokens";

// Storage adapter interface for dependency injection
export interface StorageAdapter {
  get(key: string): Promise<string | null>;
  set(key: string, value: string): Promise<void>;
  remove(key: string): Promise<void>;
}

// Default storage adapter using localStorage
const defaultStorageAdapter: StorageAdapter = {
  async get(key) {
    if (typeof window === "undefined") return null;
    return window.localStorage.getItem(key);
  },
  async set(key, value) {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(key, value);
  },
  async remove(key) {
    if (typeof window === "undefined") return;
    window.localStorage.removeItem(key);
  },
};

// Theme snapshot interface
export interface ThemeSnapshot {
  themeCode: string;
  themeName: string;
  builtinFlag: boolean;
  themeConfig: Record<string, string>;
}

// Theme store state interface
interface ThemeState {
  hydrated: boolean;
  currentTheme: ThemeSnapshot;
  availableThemes: ThemeSnapshot[];
  storageAdapter: StorageAdapter;
  configureThemeStorage: (adapter: StorageAdapter) => void;
  hydrate: (themeCode: string, themes?: ThemeSnapshot[]) => void;
  setAvailableThemes: (themes: ThemeSnapshot[]) => void;
  applyTheme: (themeCode: string) => ThemeSnapshot;
}

const STORAGE_KEY = "nebula-theme-code";

// Built-in theme catalog with nebula-light and nebula-dark
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
      themeCode: "nebula-dark",
      themeName: "Nebula Dark",
      builtinFlag: true,
      themeConfig: normalizeThemeConfig({
        primaryColor: "#3d8bff",
        secondaryColor: "#66a3ff",
        successColor: "#22c55e",
        warningColor: "#f59e0b",
        errorColor: "#ef4444",
        sidebarColor: "#0f172a",
        headerColor: "#1e293b",
        surfaceColor: "#1e293b",
        backgroundColor: "#0f172a",
        textColor: "#f1f5f9",
        textSecondaryColor: "#94a3b8",
        borderColor: "#334155",
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
  storageAdapter: defaultStorageAdapter,
  configureThemeStorage: (adapter) => {
    set({ storageAdapter: adapter });
  },
  hydrate: (themeCode, themes) => {
    const { storageAdapter } = get();
    const availableThemes = mergeThemes(themes?.length ? themes : get().availableThemes);
    storageAdapter.get(STORAGE_KEY).then((storedThemeCode) => {
      const resolved = resolveTheme(storedThemeCode ?? "", availableThemes)
        ?? resolveTheme(themeCode, availableThemes)
        ?? availableThemes[0];
      storageAdapter.set(STORAGE_KEY, resolved.themeCode);
      set({ hydrated: true, availableThemes, currentTheme: resolved });
    });
  },
  setAvailableThemes: (themes) => {
    const merged = mergeThemes(themes);
    const resolved = resolveTheme(get().currentTheme.themeCode, merged) ?? merged[0];
    set({ availableThemes: merged, currentTheme: resolved });
  },
  applyTheme: (themeCode) => {
    const { storageAdapter } = get();
    const resolved = resolveTheme(themeCode, get().availableThemes) ?? get().availableThemes[0];
    storageAdapter.set(STORAGE_KEY, resolved.themeCode);
    set({ currentTheme: resolved, hydrated: true });
    return resolved;
  },
}));
