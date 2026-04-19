import { translateNebulaMessage, useI18nStore } from "../i18n/index";
import type { MenuItem } from "../types";
import type { NeBreadcrumbItem } from "./navigation-types";

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

  if (pathname === "/") {
    const locale = useI18nStore.getState().locale;
    return [{ key: "home", title: translateNebulaMessage(locale, "nav.home", "首页"), href: "/" }];
  }

  if (pathname === "/401" || pathname === "/404") {
    const locale = useI18nStore.getState().locale;
    return [{ key: pathname, title: translateNebulaMessage(locale, pathname === "/401" ? "unauthorized.title" : "notFound.title", pathname === "/401" ? "无权访问" : "页面不存在"), href: pathname }];
  }

  return [{ key: pathname, title: pathname }];
}

export function resolveRouteLabel(menus: MenuItem[], pathname: string) {
  const lineage = findLineage(menus, pathname);
  if (lineage.length > 0) {
    return (lineage.at(-1) as MenuItem).name;
  }

  if (pathname === "/401" || pathname === "/404") {
    return translateNebulaMessage(useI18nStore.getState().locale, pathname === "/401" ? "unauthorized.title" : "notFound.title", pathname === "/401" ? "无权访问" : "页面不存在");
  }

  const breadcrumbs = buildBreadcrumbItems(menus, pathname);
  return breadcrumbs.at(-1)?.title ?? translateNebulaMessage(useI18nStore.getState().locale, "nav.untitled", "未命名页面");
}
