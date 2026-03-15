import type { LocaleCode } from "@platform/core";
import { requestGet, requestPost, requestPut } from "./client";

export interface FrontendConfigDto {
  projectName: string;
  layoutMode: "side" | "top" | "mix";
  defaultThemeCode: string;
  defaultLocale: LocaleCode;
  localeOptions: LocaleCode[];
}

export interface FrontendLoginConfigDto {
  usernameEnabled?: boolean;
  usernameRegisterAllowed?: boolean;
  usernamePasswordMinLength?: number;
  usernamePasswordMaxLength?: number;
  phoneEnabled?: boolean;
  phoneRegisterAllowed?: boolean;
  phoneCodeExpireMinutes?: number;
  phoneSendIntervalSeconds?: number;
  emailEnabled?: boolean;
  emailRegisterAllowed?: boolean;
  emailCodeExpireMinutes?: number;
  emailSendIntervalSeconds?: number;
  oauth2Enabled?: boolean;
  oauth2RegisterAllowed?: boolean;
  qqOauth2Enabled?: boolean;
  wechatOauth2Enabled?: boolean;
  alipayOauth2Enabled?: boolean;
}

export interface FrontendPreferenceDto {
  localeTag: LocaleCode;
  themeCode: string;
}

export interface FrontendThemeDto {
  themeCode: string;
  themeName: string;
  builtinFlag: boolean;
  themeConfig: Record<string, string>;
}

export interface FrontendThemeConfigItemDto {
  configKey: string;
  configName: string;
  defaultValue: string;
}

export interface FrontendThemeCatalogDto {
  themes: FrontendThemeDto[];
  configItems: FrontendThemeConfigItemDto[];
}

export interface FrontendInitDto {
  frontendConfig: FrontendConfigDto;
  loginConfig: FrontendLoginConfigDto;
  defaultPreference: FrontendPreferenceDto;
  defaultTheme?: FrontendThemeDto;
}

export interface SaveFrontendConfigPayload {
  projectName: string;
  layoutMode: "side" | "top" | "mix";
  defaultThemeCode: string;
  defaultLocale: LocaleCode;
  localeOptions: LocaleCode[];
}

export interface SaveFrontendThemePayload {
  themeCode: string;
  themeName: string;
  themeConfig: Record<string, string>;
}

export async function fetchFrontendInit() {
  return requestGet<FrontendInitDto>("/api/frontend/init", undefined, { silent: true });
}

export async function switchFrontendLocale(localeTag: LocaleCode) {
  return requestPut<FrontendPreferenceDto>("/api/frontend/preferences/locale", { localeTag }, { silent: true });
}

export async function switchFrontendTheme(themeCode: string) {
  return requestPut<FrontendPreferenceDto>("/api/frontend/preferences/theme", { themeCode }, { silent: true });
}

export async function fetchFrontendThemes() {
  return requestGet<FrontendThemeCatalogDto>("/api/frontend/themes", undefined, { silent: true });
}

export async function saveFrontendTheme(payload: SaveFrontendThemePayload) {
  return requestPost<FrontendThemeDto>("/api/frontend/themes", payload, { silent: true });
}

export async function fetchFrontendConfig() {
  return requestGet<FrontendConfigDto>("/api/frontend/config", undefined, { silent: true });
}

export async function saveFrontendConfig(payload: SaveFrontendConfigPayload) {
  return requestPut<FrontendConfigDto>("/api/frontend/config", payload, { silent: true });
}
