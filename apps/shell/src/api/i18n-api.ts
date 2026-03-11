import type { LocaleCode } from "@platform/core";
import { shellEnv } from "../config/env";
import { requestGet, requestPost } from "./client";

interface LocalePreferencePayload {
  locale?: string;
}

function normalizeLocale(value: unknown, fallback: LocaleCode = "zh-CN"): LocaleCode {
  return value === "en-US" ? "en-US" : fallback;
}

export async function fetchCurrentLocalePreference(): Promise<LocaleCode> {
  if (shellEnv.useMockAuth || !shellEnv.localeCurrentPath) {
    return "zh-CN";
  }

  const payload = await requestGet<LocalePreferencePayload>(shellEnv.localeCurrentPath, undefined, { silent: true });
  return normalizeLocale(payload.locale);
}

export async function updateLocalePreference(locale: LocaleCode): Promise<LocaleCode> {
  if (shellEnv.useMockAuth || !shellEnv.localeSwitchPath) {
    return locale;
  }

  const payload = await requestPost<LocalePreferencePayload>(shellEnv.localeSwitchPath, { locale }, { silent: true });
  return normalizeLocale(payload.locale, locale);
}
