import { translateNebulaMessage, type LocaleCode } from "../i18n/index";
import type { MenuItem } from "../types";

const NEBULA_HOME_MENU_ID = "nebula-home";

function normalizeMenuPath(path: string | undefined) {
  if (!path || path === "/") {
    return "/";
  }
  return path.replace(/\/+$/, "") || "/";
}

export function buildDefaultNebulaMenus(locale: LocaleCode = "zh-CN"): MenuItem[] {
  return [
    {
      id: NEBULA_HOME_MENU_ID,
      name: translateNebulaMessage(locale, "nav.home", "首页"),
      type: 2,
      path: "/",
      component: "nebula/DashboardPage",
      linkType: 1,
      icon: "HomeOutlined",
      visible: 1,
      sort: -1,
      status: 1,
    },
  ];
}

export function withDefaultNebulaMenus(menus: MenuItem[], locale: LocaleCode = "zh-CN"): MenuItem[] {
  const defaults = buildDefaultNebulaMenus(locale);
  const defaultMenusToInject = defaults.filter(
    (defaultMenu) => !menus.some((item) => normalizeMenuPath(item.path) === normalizeMenuPath(defaultMenu.path) || item.id === defaultMenu.id),
  );
  return defaultMenusToInject.length ? [...defaultMenusToInject, ...menus] : menus;
}

export function patchDefaultNebulaMenus(menus: MenuItem[], locale: LocaleCode = "zh-CN"): MenuItem[] {
  const defaultMenus = buildDefaultNebulaMenus(locale);
  return menus.map((item) => {
    const defaultMenu = defaultMenus.find((candidate) => candidate.id === item.id || normalizeMenuPath(candidate.path) === normalizeMenuPath(item.path));
    return defaultMenu ?? item;
  });
}
