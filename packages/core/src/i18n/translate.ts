import type { LocaleCode } from "@nebula/request";
import { nebulaMessages } from "./nebula-messages";

export function translateNebulaMessage(
  locale: LocaleCode,
  key: string,
  fallback?: string,
  variables?: Record<string, string | number>,
) {
  const template = nebulaMessages[locale]?.[key] ?? nebulaMessages["zh-CN"]?.[key] ?? fallback ?? key;
  if (!variables) {
    return template;
  }
  return Object.entries(variables).reduce(
    (result, [name, value]) => result.replaceAll(`{${name}}`, String(value)),
    template,
  );
}
