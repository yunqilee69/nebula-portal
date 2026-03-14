import type { LocaleCode } from "@platform/core";
import { eventBus } from "@platform/core";
import { fetchCurrentLocalePreference, updateLocalePreference } from "../../api/i18n-api";
import { patchDefaultShellMenus } from "../menu/default-menus";
import { useMenuStore } from "../menu/menu-store";
import { useI18nStore } from "./i18n-store";

function patchLocalMenus(locale: LocaleCode) {
  const currentMenus = useMenuStore.getState().menus;
  useMenuStore.getState().setMenus(patchDefaultShellMenus(currentMenus, locale));
}

export async function hydrateShellLocale() {
  try {
    const locale = await fetchCurrentLocalePreference();
    useI18nStore.getState().setLocale(locale);
    patchLocalMenus(locale);
  } finally {
    useI18nStore.getState().markHydrated();
  }
}

export async function applyShellLocale(locale: LocaleCode) {
  const resolved = await updateLocalePreference(locale);
  useI18nStore.getState().setLocale(resolved);
  patchLocalMenus(resolved);
  eventBus.emit("i18n:locale-changed", { locale: resolved });
  return resolved;
}
