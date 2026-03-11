import type { ComponentType } from "react";
import { loadComponent } from "./component-registry";
import { getRegisteredModules } from "./module-registry";
import type { MenuItem, RouteDefinition } from "./types";

export function buildRoutesFromMenus(
  menus: MenuItem[],
  fallback: ComponentType<object>,
) {
  const routes: RouteDefinition[] = [];

  const visit = (items: MenuItem[]) => {
    items.forEach((menu) => {
      if (menu.type === 2 && menu.linkType === 1 && menu.component && menu.path) {
        const Component = loadComponent(menu.component, fallback);
        routes.push({ path: menu.path, element: <Component /> });
      }
      if (menu.children?.length) {
        visit(menu.children);
      }
    });
  };

  visit(menus);
  return routes;
}

export function buildModuleRoutes() {
  return getRegisteredModules().flatMap((module) =>
    (module.routes ?? []).map((route) => {
      if (route.component) {
        const RouteComponent = route.component;
        return { path: route.path, element: <RouteComponent /> };
      }
      if (route.componentKey) {
        const Component = loadComponent(route.componentKey, DefaultMissingPage);
        return { path: route.path, element: <Component /> };
      }
      return { path: route.path, element: <DefaultMissingPage /> };
    }),
  );
}

function DefaultMissingPage() {
  return <div>Page is not registered.</div>;
}
