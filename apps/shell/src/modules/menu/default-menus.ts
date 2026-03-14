import type { LocaleCode, MenuItem } from "@platform/core";
import { translateShellMessage } from "../i18n/translate";

const SHELL_HOME_MENU_ID = "shell-home";

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
  ];
}

export function withDefaultShellMenus(menus: MenuItem[], locale: LocaleCode = "zh-CN"): MenuItem[] {
  if (menus.some((item) => normalizeMenuPath(item.path) === "/" || item.id === SHELL_HOME_MENU_ID)) {
    return menus;
  }
  return [...buildDefaultShellMenus(locale), ...menus];
}

export function patchDefaultShellMenus(menus: MenuItem[], locale: LocaleCode = "zh-CN"): MenuItem[] {
  return menus.map((item) => {
    if (item.id !== SHELL_HOME_MENU_ID) {
      return item;
    }
    return buildDefaultShellMenus(locale)[0];
  });
}
