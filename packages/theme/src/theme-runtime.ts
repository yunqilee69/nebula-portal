import type { ThemeSnapshot } from "./theme-store";
import { resolveThemeColor, resolveThemeNumber } from "./theme-tokens";

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

function clamp(input: number, min: number, max: number) {
  return Math.max(min, Math.min(max, input));
}

export function applyThemeToDocument(theme: ThemeSnapshot) {
  const root = document.documentElement;
  const primaryColor = normalizeHex(resolveThemeColor(theme.themeConfig, "primaryColor"), "#1f6feb");
  const secondaryColor = normalizeHex(resolveThemeColor(theme.themeConfig, "secondaryColor"), "#4f8cff");
  const sidebarColor = normalizeHex(resolveThemeColor(theme.themeConfig, "sidebarColor"), "#0f172a");
  const headerColor = normalizeHex(resolveThemeColor(theme.themeConfig, "headerColor"), "#ffffff");
  const surfaceColor = normalizeHex(resolveThemeColor(theme.themeConfig, "surfaceColor"), headerColor);
  const backgroundColor = normalizeHex(resolveThemeColor(theme.themeConfig, "backgroundColor"), "#f8fafc");
  const textColor = normalizeHex(resolveThemeColor(theme.themeConfig, "textColor"), "#0f172a");
  const textSecondaryColor = normalizeHex(resolveThemeColor(theme.themeConfig, "textSecondaryColor"), "#6b7280");
  const borderColor = normalizeHex(resolveThemeColor(theme.themeConfig, "borderColor"), "#d0d7e2");
  const borderRadius = clamp(resolveThemeNumber(theme.themeConfig, "borderRadius"), 4, 24);
  const fontSize = clamp(resolveThemeNumber(theme.themeConfig, "fontSize"), 12, 18);
  const controlHeight = clamp(resolveThemeNumber(theme.themeConfig, "controlHeight"), 28, 48);
  const sidebarText = contrastColor(sidebarColor);

  root.style.setProperty("--shell-bg", `linear-gradient(180deg, ${backgroundColor} 0%, ${withAlpha(backgroundColor, 0.92)} 100%)`);
  root.style.setProperty("--shell-surface", withAlpha(surfaceColor, 0.92));
  root.style.setProperty("--shell-surface-strong", headerColor);
  root.style.setProperty("--shell-bg-subtle", withAlpha(surfaceColor, 0.72));
  root.style.setProperty("--shell-sidebar-bg", sidebarColor);
  root.style.setProperty("--shell-text", textColor);
  root.style.setProperty("--shell-text-muted", textSecondaryColor);
  root.style.setProperty("--shell-sidebar-text", sidebarText);
  root.style.setProperty("--shell-sidebar-text-muted", withAlpha(sidebarText, 0.78));
  root.style.setProperty("--shell-border", withAlpha(borderColor, 0.72));
  root.style.setProperty("--shell-border-strong", borderColor);
  root.style.setProperty("--shell-shadow", `0 18px 40px ${withAlpha(textColor, 0.08)}`);
  root.style.setProperty("--shell-shadow-strong", `0 20px 48px ${withAlpha(textColor, 0.12)}`);
  root.style.setProperty("--shell-primary", primaryColor);
  root.style.setProperty("--shell-primary-strong", secondaryColor);
  root.style.setProperty("--shell-radius", `${borderRadius}px`);
  root.style.setProperty("--shell-font-size", `${fontSize}px`);
  root.style.setProperty("--shell-control-height", `${controlHeight}px`);
}
