import { lazy, type ComponentType } from "react";
import type { RouteComponentLoader, RouteComponentLoaderMap, RouteComponentMeta, RouteComponentRegistration } from "../types";

const routeComponentRegistry = new Map<string, RouteComponentLoader>();
const routeComponentMetaRegistry = new Map<string, RouteComponentMeta>();
const routeComponentSources = new Map<string, string>();
const routeComponentRegistrationConflicts: Array<{ key: string; existingSource: string; nextSource: string }> = [];

function isRouteComponentRegistration(value: RouteComponentLoader | RouteComponentRegistration): value is RouteComponentRegistration {
  return typeof value === "object" && value !== null && "loader" in value;
}

export function registryRouteComponent(
  componentKey: string,
  registration: RouteComponentLoader | RouteComponentRegistration,
  source = "unknown",
) {
  const existingSource = routeComponentSources.get(componentKey);
  if (existingSource && existingSource !== source) {
    routeComponentRegistrationConflicts.push({ key: componentKey, existingSource, nextSource: source });
  }

  if (isRouteComponentRegistration(registration)) {
    routeComponentRegistry.set(componentKey, registration.loader);
    if (registration.meta) {
      routeComponentMetaRegistry.set(componentKey, registration.meta);
    }
  } else {
    routeComponentRegistry.set(componentKey, registration);
  }
  routeComponentSources.set(componentKey, source);
}

export function registryRouteComponents(routeComponents: RouteComponentLoaderMap, source = "unknown") {
  Object.entries(routeComponents).forEach(([componentKey, registration]) => {
    registryRouteComponent(componentKey, registration, source);
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

export function getRouteComponentMeta(componentKey: string): RouteComponentMeta | undefined {
  return routeComponentMetaRegistry.get(componentKey);
}

export function getAllRouteComponentMeta(): Record<string, RouteComponentMeta> {
  const result: Record<string, RouteComponentMeta> = {};
  routeComponentMetaRegistry.forEach((meta, key) => {
    result[key] = meta;
  });
  return result;
}

export function getRouteComponentRegistrationConflicts() {
  return [...routeComponentRegistrationConflicts];
}

export function clearRouteComponents() {
  routeComponentRegistry.clear();
  routeComponentMetaRegistry.clear();
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