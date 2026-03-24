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
