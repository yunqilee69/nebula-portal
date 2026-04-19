import type { ComponentType } from "react";
import { loadRouteComponent } from "./route-component-registry";
import type { MenuItem, RouteDefinition } from "../types";

export function buildRoutesFromMenus(
  menus: MenuItem[],
  fallback: ComponentType<object>,
) {
  const routes: RouteDefinition[] = [];

  const visit = (items: MenuItem[]) => {
    items.forEach((menu) => {
      if (menu.type === 2 && menu.linkType === 1 && menu.component && menu.path) {
        const RouteComponent = loadRouteComponent(menu.component, fallback);
        routes.push({ path: menu.path, element: <RouteComponent /> });
      }
      if (menu.children?.length) {
        visit(menu.children);
      }
    });
  };

  visit(menus);
  return routes;
}
