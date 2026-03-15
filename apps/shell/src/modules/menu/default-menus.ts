import type { LocaleCode, MenuItem } from "@platform/core";
import { translateShellMessage } from "../i18n/translate";

const SHELL_HOME_MENU_ID = "shell-home";
const SHELL_FRONTEND_MENU_ID = "shell-frontend-settings";

function normalizeMenuPath(path: string | undefined) {
  if (!path || path === "/") {
    return "/";
  }
  return path.replace(/\/+$/, "") || "/";
}

export function buildDefaultShellMenus(locale: LocaleCode = "zh-CN"): MenuItem[] {
  return [
    {
      id: SHELL_HOME_MENU_ID,
      name: translateShellMessage(locale, "nav.home", "首页"),
      type: 2,
      path: "/",
      component: "shell/DashboardPage",
      linkType: 1,
      icon: "HomeOutlined",
      visible: 1,
      sort: -1,
      status: 1,
    },
    {
      id: SHELL_FRONTEND_MENU_ID,
      name: translateShellMessage(locale, "platform.frontendSettings.title", "前端设置"),
      type: 2,
      path: "/frontend/settings",
      component: "shell/FrontendSettingsPage",
      linkType: 1,
      icon: "SettingOutlined",
      visible: 1,
      sort: 999,
      status: 1,
    },
  ];
}

export function withDefaultShellMenus(menus: MenuItem[], locale: LocaleCode = "zh-CN"): MenuItem[] {
  const defaults = buildDefaultShellMenus(locale);
  const defaultMenusToInject = defaults.filter(
    (defaultMenu) => !menus.some((item) => normalizeMenuPath(item.path) === normalizeMenuPath(defaultMenu.path) || item.id === defaultMenu.id),
  );
  return defaultMenusToInject.length ? [...defaultMenusToInject, ...menus] : menus;
}

export function patchDefaultShellMenus(menus: MenuItem[], locale: LocaleCode = "zh-CN"): MenuItem[] {
  return menus.map((item) => {
    const patchedDefault = buildDefaultShellMenus(locale).find((defaultItem) => defaultItem.id === item.id);
    if (!patchedDefault) {
      return item;
    }
    return patchedDefault;
  });
}
