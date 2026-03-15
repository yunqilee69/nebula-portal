import type { LocaleCode } from "@platform/core";
import { eventBus } from "@platform/core";
import { switchFrontendLocale } from "../../api/frontend-api";
import { useFrontendStore } from "../frontend/frontend-store";
import { patchDefaultShellMenus } from "../menu/default-menus";
import { useMenuStore } from "../menu/menu-store";
import { useI18nStore } from "./i18n-store";

const SHELL_LOCALE_STORAGE_KEY = "nebula-shell-preferred-locale";

function patchLocalMenus(locale: LocaleCode) {
  const currentMenus = useMenuStore.getState().menus;
  useMenuStore.getState().setMenus(patchDefaultShellMenus(currentMenus, locale));
}

export async function applyShellLocale(locale: LocaleCode) {
  const resolved = (await switchFrontendLocale(locale)).localeTag;
  if (typeof window !== "undefined") {
    window.localStorage.setItem(SHELL_LOCALE_STORAGE_KEY, resolved);
  }
  useI18nStore.getState().setLocale(resolved);
  useFrontendStore.getState().setDefaultPreference({ localeTag: resolved });
  patchLocalMenus(resolved);
  eventBus.emit("i18n:locale-changed", { locale: resolved });
  return resolved;
}
