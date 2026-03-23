import { lazy, type ComponentType } from "react";
import type { ComponentLoader, ComponentLoaderMap } from "./types";

const componentRegistry = new Map<string, ComponentLoader>();
const componentSources = new Map<string, string>();
const componentRegistrationConflicts: Array<{ key: string; existingSource: string; nextSource: string }> = [];

export function registerComponents(components: ComponentLoaderMap, source = "unknown") {
  Object.entries(components).forEach(([key, loader]) => {
    const existingSource = componentSources.get(key);
    if (existingSource && existingSource !== source) {
      componentRegistrationConflicts.push({ key, existingSource, nextSource: source });
    }
    componentRegistry.set(key, loader);
    componentSources.set(key, source);
  });
}

export function hasComponent(componentKey: string) {
  return componentRegistry.has(componentKey);
}

export function listRegisteredComponents() {
  return [...componentRegistry.keys()].sort((left, right) => left.localeCompare(right));
}

export function getRegisteredComponentSource(componentKey: string) {
  return componentSources.get(componentKey);
}

export function getComponentRegistrationConflicts() {
  return [...componentRegistrationConflicts];
}

export function clearComponents() {
  componentRegistry.clear();
  componentSources.clear();
  componentRegistrationConflicts.length = 0;
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
