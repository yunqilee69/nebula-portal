import { platformPageDefinitions, type MenuItem } from "@platform/core";
import type { NeBreadcrumbItem } from "@platform/ui";
import { useI18nStore } from "../i18n/i18n-store";
import { translateShellMessage } from "../i18n/translate";

function findLineage(nodes: MenuItem[], pathname: string, parents: MenuItem[] = []): MenuItem[] {
  for (const node of nodes) {
    const lineage = [...parents, node];
    if (node.path === pathname) {
      return lineage;
    }
    if (node.children?.length) {
      const childLineage = findLineage(node.children, pathname, lineage);
      if (childLineage.length > 0) {
        return childLineage;
      }
    }
  }
  return [];
}

export function buildBreadcrumbItems(menus: MenuItem[], pathname: string): NeBreadcrumbItem[] {
  const lineage = findLineage(menus, pathname);
  if (lineage.length > 0) {
    return lineage.map((item) => ({ key: String(item.id), title: item.name, href: item.path }));
  }

  const platformPage = platformPageDefinitions.find((page) => page.path === pathname);
  if (platformPage) {
    const locale = useI18nStore.getState().locale;
    return [
      { key: "platform-root", title: translateShellMessage(locale, "platform.root", "平台基座"), href: "/" },
      { key: platformPage.id, title: translateShellMessage(locale, platformPage.menuNameKey ?? "", platformPage.menuName), href: platformPage.path },
    ];
  }

  if (pathname === "/") {
    const locale = useI18nStore.getState().locale;
    return [{ key: "home", title: translateShellMessage(locale, "nav.home", "首页"), href: "/" }];
  }

  return [{ key: pathname, title: pathname }];
}

export function resolveRouteLabel(menus: MenuItem[], pathname: string) {
  const lineage = findLineage(menus, pathname);
  if (lineage.length > 0) {
    return (lineage.at(-1) as MenuItem).name;
  }

  const platformPage = platformPageDefinitions.find((page) => page.path === pathname);
  if (platformPage) {
    const locale = useI18nStore.getState().locale;
    return translateShellMessage(locale, platformPage.menuNameKey ?? "", platformPage.menuName);
  }

  const breadcrumbs = buildBreadcrumbItems(menus, pathname);
  return breadcrumbs.at(-1)?.title ?? translateShellMessage(useI18nStore.getState().locale, "nav.untitled", "未命名页面");
}
