import type { LocaleCode } from "@platform/core";
import { eventBus } from "@platform/core";
import { fetchCurrentLocalePreference, updateLocalePreference } from "../../api/i18n-api";
import { useMenuStore } from "../menu/menu-store";
import { buildPlatformMenus } from "../platform/platform-menus";
import { useI18nStore } from "./i18n-store";

function patchPlatformMenus(locale: LocaleCode) {
  const currentMenus = useMenuStore.getState().menus;
  const localizedPlatformRoot = buildPlatformMenus(locale)[0];
  if (!currentMenus.some((item) => item.id === "platform-root")) {
    return;
  }
  useMenuStore.getState().setMenus(
    currentMenus.map((item) => (item.id === "platform-root" ? localizedPlatformRoot : item)),
  );
}

export async function hydrateShellLocale() {
  try {
    const locale = await fetchCurrentLocalePreference();
    useI18nStore.getState().setLocale(locale);
    patchPlatformMenus(locale);
  } finally {
    useI18nStore.getState().markHydrated();
  }
}

export async function applyShellLocale(locale: LocaleCode) {
  const resolved = await updateLocalePreference(locale);
  useI18nStore.getState().setLocale(resolved);
  patchPlatformMenus(resolved);
  eventBus.emit("i18n:locale-changed", { locale: resolved });
  return resolved;
}
