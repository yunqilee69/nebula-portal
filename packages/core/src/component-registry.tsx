import { lazy, type ComponentType } from "react";
import type { ComponentLoader, ComponentLoaderMap } from "./types";

const componentRegistry = new Map<string, ComponentLoader>();

export function registerComponents(components: ComponentLoaderMap) {
  Object.entries(components).forEach(([key, loader]) => {
    componentRegistry.set(key, loader);
  });
}

export function hasComponent(componentKey: string) {
  return componentRegistry.has(componentKey);
}

export function clearComponents() {
  componentRegistry.clear();
}

export function loadComponent(
  componentKey: string,
  fallback: ComponentType<object>,
) {
  const loader = componentRegistry.get(componentKey);
  if (!loader) {
    return lazy(async () => ({ default: fallback }));
  }
  return lazy(loader);
}
