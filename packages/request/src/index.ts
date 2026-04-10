export * from "./request-client";
export type { LocaleCode, ApiEnvelope } from "./request-client";

export interface FrontendConfigDto {
  projectName: string;
  layoutMode: string;
  defaultThemeCode: string;
  defaultLocale: "zh-CN" | "en-US";
  localeOptions: Array<"zh-CN" | "en-US">;
}

export interface FrontendLoginConfigDto {
  [key: string]: unknown;
}

export interface FrontendPreferenceDto {
  localeTag: "zh-CN" | "en-US";
  themeCode: string;
  navigationLayoutCode: string;
  sidebarLayoutCode: string;
}

export interface FrontendThemeCatalogDto {
  themes: Array<{ themeCode: string }>;
  configItems: unknown[];
}

export interface FrontendInitDto {
  frontendConfig: FrontendConfigDto;
  loginConfig: FrontendLoginConfigDto;
  defaultPreference: FrontendPreferenceDto;
}
