export { I18nProvider, useI18n } from "./i18n-provider";
export * from "./i18n-store";
export * from "./translate";
export * from "./nebula-messages";
export * from "./nebula-i18n-provider";
export type { LocaleCode } from "@nebula/request";
export type { LocaleBundle, LocaleMessages } from "./nebula-messages";

export async function applyNebulaLocale(locale: import("@nebula/request").LocaleCode) {
  const { useI18nStore } = await import("./i18n-store");
  useI18nStore.getState().setLocale(locale);
  return locale;
}
