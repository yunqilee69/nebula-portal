import type { ThemeStateSnapshot } from "./theme-store";

interface ThemePalette {
  background: string;
  surface: string;
  surfaceStrong: string;
  sidebar: string;
  text: string;
  textMuted: string;
  border: string;
  shadow: string;
}

const palettes: Record<ThemeStateSnapshot["mode"], ThemePalette> = {
  mist: {
    background: "linear-gradient(180deg, #f7fbfc 0%, #edf4f7 100%)",
    surface: "rgba(255,255,255,0.88)",
    surfaceStrong: "#ffffff",
    sidebar: "linear-gradient(180deg, #ffffff 0%, #eef4f5 100%)",
    text: "#102a43",
    textMuted: "#627d98",
    border: "rgba(15, 23, 42, 0.08)",
    shadow: "0 20px 60px rgba(16, 42, 67, 0.08)",
  },
  sand: {
    background: "linear-gradient(180deg, #fff8ef 0%, #f8efe2 100%)",
    surface: "rgba(255,251,245,0.9)",
    surfaceStrong: "#fffdf8",
    sidebar: "linear-gradient(180deg, #fffdf8 0%, #f5eadb 100%)",
    text: "#4a2c1d",
    textMuted: "#8b6b59",
    border: "rgba(93, 52, 30, 0.1)",
    shadow: "0 22px 60px rgba(110, 72, 46, 0.08)",
  },
  graphite: {
    background: "linear-gradient(180deg, #eef2f6 0%, #dde4eb 100%)",
    surface: "rgba(255,255,255,0.86)",
    surfaceStrong: "#ffffff",
    sidebar: "linear-gradient(180deg, #fdfefe 0%, #e9eef3 100%)",
    text: "#223042",
    textMuted: "#5f6f82",
    border: "rgba(34, 48, 66, 0.1)",
    shadow: "0 22px 60px rgba(34, 48, 66, 0.08)",
  },
};

export function applyThemeToDocument(theme: ThemeStateSnapshot) {
  const root = document.documentElement;
  const palette = palettes[theme.mode];

  root.style.setProperty("--shell-bg", palette.background);
  root.style.setProperty("--shell-surface", palette.surface);
  root.style.setProperty("--shell-surface-strong", palette.surfaceStrong);
  root.style.setProperty("--shell-sidebar-bg", palette.sidebar);
  root.style.setProperty("--shell-text", palette.text);
  root.style.setProperty("--shell-text-muted", palette.textMuted);
  root.style.setProperty("--shell-border", palette.border);
  root.style.setProperty("--shell-shadow", palette.shadow);
  root.style.setProperty("--shell-primary", theme.primaryColor);
  root.style.setProperty("--shell-radius", `${theme.radius}px`);
  root.style.setProperty("--shell-content-gap", theme.compact ? "12px" : "18px");
}
