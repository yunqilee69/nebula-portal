import { lazy, type ComponentType } from "react";
import type { RouteComponentLoader, RouteComponentLoaderMap } from "../types";

const routeComponentRegistry = new Map<string, RouteComponentLoader>();
const routeComponentSources = new Map<string, string>();
const routeComponentRegistrationConflicts: Array<{ key: string; existingSource: string; nextSource: string }> = [];

export function registryRouteComponent(componentKey: string, loader: RouteComponentLoader, source = "unknown") {
  const existingSource = routeComponentSources.get(componentKey);
  if (existingSource && existingSource !== source) {
    routeComponentRegistrationConflicts.push({ key: componentKey, existingSource, nextSource: source });
  }
  routeComponentRegistry.set(componentKey, loader);
  routeComponentSources.set(componentKey, source);
}

export function registryRouteComponents(routeComponents: RouteComponentLoaderMap, source = "unknown") {
  Object.entries(routeComponents).forEach(([componentKey, loader]) => {
    registryRouteComponent(componentKey, loader, source);
  });
}

export function hasRouteComponent(componentKey: string) {
  return routeComponentRegistry.has(componentKey);
}

export function listRegisteredRouteComponents() {
  return [...routeComponentRegistry.keys()].sort((left, right) => left.localeCompare(right));
}

export function getRegisteredRouteComponentSource(componentKey: string) {
  return routeComponentSources.get(componentKey);
}

export function getRouteComponentRegistrationConflicts() {
  return [...routeComponentRegistrationConflicts];
}

export function clearRouteComponents() {
  routeComponentRegistry.clear();
  routeComponentSources.clear();
  routeComponentRegistrationConflicts.length = 0;
}

export function loadRouteComponent(componentKey: string, fallback: ComponentType<object>) {
  const loader = routeComponentRegistry.get(componentKey);
  if (!loader) {
    return lazy(async () => ({ default: fallback }));
  }
  return lazy(loader);
}
