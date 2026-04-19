export * from "./request-client";
export type { LocaleCode, ApiEnvelope } from "./request-client";

export interface FrontendConfigDto {
  projectName: string;
  layoutMode: "side" | "top" | "mix";
  defaultThemeCode: string;
  defaultLocale: "zh-CN" | "en-US";
  localeOptions: Array<"zh-CN" | "en-US">;
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
  wechatWebEnabled?: boolean;
  wechatWebRedirectEnabled?: boolean;
  wechatWebQrEnabled?: boolean;
  wechatWebMode?: "redirect" | "qr";
  alipayOauth2Enabled?: boolean;
}

export interface FrontendPreferenceDto {
  localeTag: "zh-CN" | "en-US";
  themeCode: string;
  navigationLayoutCode?: string;
  sidebarLayoutCode?: string;
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
