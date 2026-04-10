export { I18nProvider, useI18n } from "./i18n-provider";
export * from "./i18n-store";
export * from "./translate";
export * from "./shell-messages";
export * from "./shell-i18n-provider";
export type { LocaleCode } from "@nebula/request";
export type { LocaleBundle, LocaleMessages } from "./shell-messages";
export async function applyShellLocale(locale: import("@nebula/request").LocaleCode) {
  const { useI18nStore } = await import("./i18n-store");
  useI18nStore.getState().setLocale(locale);
  return locale;
}
