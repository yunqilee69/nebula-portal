import { create } from "zustand";

export type ThemeMode = "mist" | "sand" | "graphite";

export interface ThemeStateSnapshot {
  mode: ThemeMode;
  primaryColor: string;
  radius: number;
  compact: boolean;
}

interface ThemeState extends ThemeStateSnapshot {
  hydrated: boolean;
  hydrate: () => void;
  updateTheme: (patch: Partial<ThemeStateSnapshot>) => void;
}

const STORAGE_KEY = "nebula-shell-theme";

const presets: Record<ThemeMode, ThemeStateSnapshot> = {
  mist: { mode: "mist", primaryColor: "#0b7285", radius: 18, compact: false },
  sand: { mode: "sand", primaryColor: "#b05a2b", radius: 20, compact: false },
  graphite: { mode: "graphite", primaryColor: "#355070", radius: 16, compact: true },
};

function readStoredTheme(): Partial<ThemeStateSnapshot> {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    return {};
  }
  try {
    return JSON.parse(raw) as Partial<ThemeStateSnapshot>;
  } catch {
    localStorage.removeItem(STORAGE_KEY);
    return {};
  }
}

function nextTheme(current: ThemeStateSnapshot, patch: Partial<ThemeStateSnapshot>) {
  const targetMode = patch.mode ?? current.mode;
  const preset = presets[targetMode];
  return {
    ...preset,
    ...current,
    ...patch,
    mode: targetMode,
  } satisfies ThemeStateSnapshot;
}

export const themePresets = presets;

export const useThemeStore = create<ThemeState>((set) => ({
  ...presets.mist,
  hydrated: false,
  hydrate: () => {
    const stored = readStoredTheme();
    const merged = nextTheme(presets[(stored.mode as ThemeMode | undefined) ?? "mist"], stored);
    set({ ...merged, hydrated: true });
  },
  updateTheme: (patch) => {
    const current = useThemeStore.getState();
    const merged = nextTheme(current, patch);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
    set({ ...merged, hydrated: true });
  },
}));
