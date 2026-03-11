import type { LocaleCode } from "@platform/core";
import { shellMessages } from "./shell-messages";

export function translateShellMessage(
  locale: LocaleCode,
  key: string,
  fallback?: string,
  variables?: Record<string, string | number>,
) {
  const template = shellMessages[locale]?.[key] ?? shellMessages["zh-CN"]?.[key] ?? fallback ?? key;
  if (!variables) {
    return template;
  }
  return Object.entries(variables).reduce(
    (result, [name, value]) => result.replaceAll(`{${name}}`, String(value)),
    template,
  );
}
