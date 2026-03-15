import type { ThemeSnapshot } from "./theme-store";

function normalizeHex(input: string, fallback: string) {
  const value = input.trim();
  if (/^#([0-9a-fA-F]{6})$/.test(value)) {
    return value;
  }
  return fallback;
}

function withAlpha(hex: string, alpha: number) {
  const value = normalizeHex(hex, "#000000").slice(1);
  const red = Number.parseInt(value.slice(0, 2), 16);
  const green = Number.parseInt(value.slice(2, 4), 16);
  const blue = Number.parseInt(value.slice(4, 6), 16);
  return `rgba(${red}, ${green}, ${blue}, ${alpha})`;
}

function contrastColor(hex: string) {
  const value = normalizeHex(hex, "#ffffff").slice(1);
  const red = Number.parseInt(value.slice(0, 2), 16);
  const green = Number.parseInt(value.slice(2, 4), 16);
  const blue = Number.parseInt(value.slice(4, 6), 16);
  const luminance = (0.299 * red + 0.587 * green + 0.114 * blue) / 255;
  return luminance > 0.62 ? "#172b4d" : "#f8fafc";
}

export function applyThemeToDocument(theme: ThemeSnapshot) {
  const root = document.documentElement;
  const primaryColor = normalizeHex(theme.themeConfig.primaryColor ?? "", "#1f6feb");
  const sidebarColor = normalizeHex(theme.themeConfig.sidebarColor ?? "", "#0f172a");
  const headerColor = normalizeHex(theme.themeConfig.headerColor ?? "", "#ffffff");
  const backgroundColor = normalizeHex(theme.themeConfig.backgroundColor ?? "", "#f8fafc");
  const textColor = normalizeHex(theme.themeConfig.textColor ?? "", "#0f172a");
  const sidebarText = contrastColor(sidebarColor);

  root.style.setProperty("--shell-bg", `linear-gradient(180deg, ${backgroundColor} 0%, ${withAlpha(backgroundColor, 0.92)} 100%)`);
  root.style.setProperty("--shell-surface", withAlpha(headerColor, 0.92));
  root.style.setProperty("--shell-surface-strong", headerColor);
  root.style.setProperty("--shell-sidebar-bg", sidebarColor);
  root.style.setProperty("--shell-text", textColor);
  root.style.setProperty("--shell-text-muted", withAlpha(textColor, 0.68));
  root.style.setProperty("--shell-sidebar-text", sidebarText);
  root.style.setProperty("--shell-sidebar-text-muted", withAlpha(sidebarText, 0.78));
  root.style.setProperty("--shell-border", withAlpha(textColor, 0.08));
  root.style.setProperty("--shell-border-strong", withAlpha(textColor, 0.14));
  root.style.setProperty("--shell-shadow", `0 18px 40px ${withAlpha(textColor, 0.08)}`);
  root.style.setProperty("--shell-shadow-strong", `0 20px 48px ${withAlpha(textColor, 0.12)}`);
  root.style.setProperty("--shell-primary", primaryColor);
  root.style.setProperty("--shell-primary-strong", withAlpha(primaryColor, 0.92));
}
