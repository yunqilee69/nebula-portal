// Design Tokens for Nebula Portal
// These tokens provide a centralized source of design values

export interface ColorToken {
  50: string;
  100: string;
  200: string;
  300: string;
  400: string;
  500: string;
  600: string;
  700: string;
  800: string;
  900: string;
}

export interface SpacingToken {
  xs: string;
  sm: string;
  md: string;
  lg: string;
  xl: string;
  "2xl": string;
  "3xl": string;
}

export interface BorderRadiusToken {
  none: string;
  sm: string;
  md: string;
  lg: string;
  xl: string;
  full: string;
}

export interface FontSizeToken {
  xs: string;
  sm: string;
  md: string;
  lg: string;
  xl: string;
  "2xl": string;
  "3xl": string;
}

export interface ShadowToken {
  sm: string;
  md: string;
  lg: string;
  xl: string;
}

// Color Palette
export const colors = {
  // Primary colors
  primary: {
    50: "#e6f0ff",
    100: "#cce0ff",
    200: "#99c2ff",
    300: "#66a3ff",
    400: "#3385ff",
    500: "#1f6feb",
    600: "#1a5cd9",
    700: "#1448c7",
    800: "#0f37b5",
    900: "#0a25a3",
  },
  // Secondary colors
  secondary: {
    50: "#e6f4ff",
    100: "#cce9ff",
    200: "#99d3ff",
    300: "#66bdff",
    400: "#4f8cff",
    500: "#3d7aff",
    600: "#2b68ff",
    700: "#1a56ff",
    800: "#0844ff",
    900: "#0032f5",
  },
  // Semantic colors
  success: {
    50: "#e6f7e6",
    100: "#ccebcc",
    200: "#99d699",
    300: "#66c166",
    400: "#40ac40",
    500: "#16a34a",
    600: "#149344",
    700: "#12833e",
    800: "#107438",
    900: "#0e6432",
  },
  warning: {
    50: "#fff7e6",
    100: "#ffeocc",
    200: "#ffdd99",
    300: "#ffcc66",
    400: "#ffbb33",
    500: "#d97706",
    600: "#c26a04",
    700: "#aa5c02",
    800: "#924f01",
    900: "#7a4100",
  },
  danger: {
    50: "#fee6e6",
    100: "#fdcccc",
    200: "#fb9999",
    300: "#f96666",
    400: "#f73333",
    500: "#dc2626",
    600: "#c62222",
    700: "#af1e1e",
    800: "#991a1a",
    900: "#821616",
  },
  info: {
    50: "#e6f7ff",
    100: "#ccefff",
    200: "#99dfff",
    300: "#66cfff",
    400: "#33bfff",
    500: "#0891b2",
    600: "#0781a0",
    700: "#06718d",
    800: "#05617b",
    900: "#045169",
  },
  // Neutral colors
  neutral: {
    50: "#f8fafc",
    100: "#f1f5f9",
    200: "#e2e8f0",
    300: "#cbd5e1",
    400: "#94a3b8",
    500: "#64748b",
    600: "#475569",
    700: "#334155",
    800: "#1e293b",
    900: "#0f172a",
  },
} satisfies Record<string, ColorToken>;

// Spacing scale
export const spacing = {
  xs: "4px",
  sm: "8px",
  md: "16px",
  lg: "24px",
  xl: "32px",
  "2xl": "48px",
  "3xl": "64px",
} satisfies SpacingToken;

// Border radius scale
export const borderRadius = {
  none: "0px",
  sm: "4px",
  md: "8px",
  lg: "12px",
  xl: "16px",
  full: "9999px",
} satisfies BorderRadiusToken;

// Font size scale
export const fontSize = {
  xs: "12px",
  sm: "13px",
  md: "14px",
  lg: "16px",
  xl: "18px",
  "2xl": "20px",
  "3xl": "24px",
} satisfies FontSizeToken;

// Shadow scale
export const shadows = {
  sm: "0 1px 2px 0 rgba(15, 23, 42, 0.05)",
  md: "0 4px 6px -1px rgba(15, 23, 42, 0.08), 0 2px 4px -2px rgba(15, 23, 42, 0.06)",
  lg: "0 10px 15px -3px rgba(15, 23, 42, 0.08), 0 4px 6px -4px rgba(15, 23, 42, 0.06)",
  xl: "0 20px 25px -5px rgba(15, 23, 42, 0.1), 0 8px 10px -6px rgba(15, 23, 42, 0.08)",
} satisfies ShadowToken;

// Export all tokens as a single object
export const designTokens = {
  colors,
  spacing,
  borderRadius,
  fontSize,
  shadows,
} as const;

// Theme configuration field types
export type ThemeConfigFieldType = "color" | "number";

export interface ThemeConfigFieldDefinition {
  configKey: string;
  configName: string;
  defaultValue: string;
  fieldType: ThemeConfigFieldType;
  labelKey: string;
  groupKey: string;
  min?: number;
  max?: number;
  step?: number;
}

export const themeConfigFieldDefinitions: ThemeConfigFieldDefinition[] = [
  { configKey: "primaryColor", configName: "Primary Color", defaultValue: "#1f6feb", fieldType: "color", labelKey: "theme.primaryColor", groupKey: "theme.group.brand" },
  { configKey: "secondaryColor", configName: "Secondary Color", defaultValue: "#4f8cff", fieldType: "color", labelKey: "theme.secondaryColor", groupKey: "theme.group.brand" },
  { configKey: "successColor", configName: "Success Color", defaultValue: "#16a34a", fieldType: "color", labelKey: "theme.successColor", groupKey: "theme.group.semantic" },
  { configKey: "warningColor", configName: "Warning Color", defaultValue: "#d97706", fieldType: "color", labelKey: "theme.warningColor", groupKey: "theme.group.semantic" },
  { configKey: "errorColor", configName: "Error Color", defaultValue: "#dc2626", fieldType: "color", labelKey: "theme.errorColor", groupKey: "theme.group.semantic" },
  { configKey: "sidebarColor", configName: "Sidebar Color", defaultValue: "#0f172a", fieldType: "color", labelKey: "theme.sidebarColor", groupKey: "theme.group.surface" },
  { configKey: "headerColor", configName: "Header Color", defaultValue: "#ffffff", fieldType: "color", labelKey: "theme.headerColor", groupKey: "theme.group.surface" },
  { configKey: "surfaceColor", configName: "Surface Color", defaultValue: "#ffffff", fieldType: "color", labelKey: "theme.surfaceColor", groupKey: "theme.group.surface" },
  { configKey: "backgroundColor", configName: "Background Color", defaultValue: "#f8fafc", fieldType: "color", labelKey: "theme.backgroundColor", groupKey: "theme.group.surface" },
  { configKey: "textColor", configName: "Text Color", defaultValue: "#0f172a", fieldType: "color", labelKey: "theme.textColor", groupKey: "theme.group.text" },
  { configKey: "textSecondaryColor", configName: "Secondary Text Color", defaultValue: "#6b7280", fieldType: "color", labelKey: "theme.textSecondaryColor", groupKey: "theme.group.text" },
  { configKey: "borderColor", configName: "Border Color", defaultValue: "#d0d7e2", fieldType: "color", labelKey: "theme.borderColor", groupKey: "theme.group.text" },
  { configKey: "borderRadius", configName: "Border Radius", defaultValue: "8", fieldType: "number", labelKey: "theme.borderRadius", groupKey: "theme.group.shape", min: 4, max: 24, step: 1 },
  { configKey: "fontSize", configName: "Font Size", defaultValue: "14", fieldType: "number", labelKey: "theme.fontSize", groupKey: "theme.group.shape", min: 12, max: 18, step: 1 },
  { configKey: "controlHeight", configName: "Control Height", defaultValue: "34", fieldType: "number", labelKey: "theme.controlHeight", groupKey: "theme.group.shape", min: 28, max: 48, step: 1 },
];

const themeConfigDefaults = Object.fromEntries(
  themeConfigFieldDefinitions.map((item) => [item.configKey, item.defaultValue]),
) as Record<string, string>;

export function normalizeThemeConfig(themeConfig: Record<string, string>) {
  return themeConfigFieldDefinitions.reduce<Record<string, string>>((accumulator, item) => {
    accumulator[item.configKey] = themeConfig[item.configKey] ?? item.defaultValue;
    return accumulator;
  }, { ...themeConfigDefaults });
}

export function getThemeFieldDefinition(configKey: string) {
  return themeConfigFieldDefinitions.find((item) => item.configKey === configKey);
}

export function resolveThemeColor(themeConfig: Record<string, string>, configKey: string) {
  return themeConfig[configKey] ?? getThemeFieldDefinition(configKey)?.defaultValue ?? "#000000";
}

export function resolveThemeNumber(themeConfig: Record<string, string>, configKey: string) {
  const rawValue = themeConfig[configKey] ?? getThemeFieldDefinition(configKey)?.defaultValue ?? "0";
  const parsed = Number.parseFloat(rawValue);
  return Number.isFinite(parsed) ? parsed : Number.parseFloat(getThemeFieldDefinition(configKey)?.defaultValue ?? "0");
}
