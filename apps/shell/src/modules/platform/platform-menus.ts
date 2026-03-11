import { platformPageDefinitions, type LocaleCode, type MenuItem } from "@platform/core";
import { translateShellMessage } from "../i18n/translate";

export function buildPlatformMenus(locale: LocaleCode = "zh-CN"): MenuItem[] {
  return [
    {
      id: "platform-root",
      name: translateShellMessage(locale, "platform.root", "平台基座"),
      type: 1,
      icon: "AppstoreOutlined",
      visible: 1,
      sort: 999,
      children: platformPageDefinitions.map((page) => ({
        id: page.id,
        name: translateShellMessage(locale, page.menuNameKey ?? "", page.menuName),
        type: 2,
        path: page.path,
        component: page.componentKey,
        linkType: 1,
        visible: 1,
        sort: page.sort,
      })),
    },
  ];
}

export const platformMenus: MenuItem[] = buildPlatformMenus();
