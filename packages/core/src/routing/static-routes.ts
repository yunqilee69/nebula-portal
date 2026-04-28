import type { LocaleCode } from "../i18n/index";
import { translateNebulaMessage } from "../i18n/index";
import type { RouteComponentLoader } from "../types";

export interface StaticRouteItem {
  id: string;
  path: string;
  name: string;
  nameKey?: string;
  icon?: string;
  permission?: string;
  visible?: boolean;
  sort?: number;
  componentLoader: RouteComponentLoader;
}

const staticRouteRegistry = new Map<string, StaticRouteItem>();
const staticRouteSources = new Map<string, string>();

function normalizePath(path: string): string {
  if (path === "/") return path;
  return path.replace(/\/+$/, "");
}

const NEBULA_CORE_STATIC_ROUTES: StaticRouteItem[] = [
  {
    id: "nebula-dashboard",
    path: "/dashboard",
    name: "仪表盘",
    nameKey: "nav.dashboard",
    icon: "DashboardOutlined",
    visible: true,
    sort: 0,
    componentLoader: async () => ({ default: (await import("@nebula/pages-web")).DashboardPage }),
  },
  {
    id: "nebula-iframe",
    path: "/iframe",
    name: "内嵌页面",
    nameKey: "nav.iframe",
    visible: false,
    sort: 100,
    componentLoader: async () => ({ default: (await import("@nebula/pages-web")).IframePage }),
  },
  {
    id: "nebula-dict-items",
    path: "/system/dict-items",
    name: "字典项管理",
    nameKey: "dict.itemsManagementTitle",
    visible: false,
    sort: 200,
    componentLoader: async () => ({ default: (await import("@nebula/pages-web")).AdvancedDictItemsPage }),
  },
];

NEBULA_CORE_STATIC_ROUTES.forEach((route) => {
  const normalizedPath = normalizePath(route.path);
  staticRouteRegistry.set(normalizedPath, route);
  staticRouteSources.set(normalizedPath, "@nebula/core");
});

export function registerStaticRoute(route: StaticRouteItem, source = "unknown"): void {
  const normalizedPath = normalizePath(route.path);
  const existingSource = staticRouteSources.get(normalizedPath);
  if (existingSource && existingSource !== source) {
    const message = `[Nebula] Static route "${route.path}" already registered by "${existingSource}". Skipping registration from "${source}".`;
    if (process.env.NODE_ENV !== "production") {
      throw new Error(message);
    }
    console.warn(message);
    return;
  }
  staticRouteRegistry.set(normalizedPath, route);
  staticRouteSources.set(normalizedPath, source);
}

export function registerStaticRoutes(routes: StaticRouteItem[], source = "unknown"): void {
  routes.forEach((route) => registerStaticRoute(route, source));
}

export function getAllStaticRoutes(): StaticRouteItem[] {
  return [...staticRouteRegistry.values()].sort((a, b) => (a.sort ?? 0) - (b.sort ?? 0));
}

export function findStaticRouteByPath(path: string): StaticRouteItem | undefined {
  return staticRouteRegistry.get(normalizePath(path));
}

export function getStaticRouteName(route: StaticRouteItem, locale: LocaleCode): string {
  if (route.nameKey) {
    return translateNebulaMessage(locale, route.nameKey, route.name);
  }
  return route.name;
}

export function getVisibleStaticRoutes(): StaticRouteItem[] {
  return getAllStaticRoutes().filter((route) => route.visible === true);
}

export function hasStaticRoute(path: string): boolean {
  return staticRouteRegistry.has(normalizePath(path));
}

export function getStaticRouteSource(path: string): string | undefined {
  return staticRouteSources.get(normalizePath(path));
}

export const registryStaticRoute = registerStaticRoute;
export const registryStaticRoutes = registerStaticRoutes;