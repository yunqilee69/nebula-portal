import type { LocaleCode } from "@nebula/core/i18n";
import { webEnv } from "../config/env";
import { requestGet, requestPost } from "./client";

interface LocalePreferencePayload {
  locale?: string;
}

function normalizeLocale(value: unknown, fallback: LocaleCode = "zh-CN"): LocaleCode {
  return value === "en-US" ? "en-US" : fallback;
}

export async function fetchCurrentLocalePreference(): Promise<LocaleCode> {
  if (!webEnv.localeCurrentPath) {
    return "zh-CN";
  }

  const payload = await requestGet<LocalePreferencePayload>(webEnv.localeCurrentPath, undefined, { silent: true });
  return normalizeLocale(payload.locale);
}

export async function updateLocalePreference(locale: LocaleCode): Promise<LocaleCode> {
  if (!webEnv.localeSwitchPath) {
    return locale;
  }

  const payload = await requestPost<LocalePreferencePayload>(webEnv.localeSwitchPath, { locale }, { silent: true });
  return normalizeLocale(payload.locale, locale);
}
