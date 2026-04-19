import { registryRouteComponents } from "./route-component-registry";
import type { AppContextValue, ModuleLoadResult, PlatformModule } from "./types";

const moduleRegistry = new Map<string, PlatformModule>();
const bootstrappedModules = new Set<string>();
const moduleRegistrationConflicts: Array<{ id: string; existingName: string; nextName: string }> = [];

export function registerModule(module: PlatformModule) {
  const existingModule = moduleRegistry.get(module.id);
  if (existingModule && existingModule !== module) {
    moduleRegistrationConflicts.push({
      id: module.id,
      existingName: existingModule.name,
      nextName: module.name,
    });
  }
  moduleRegistry.set(module.id, module);
  if (module.routeComponents) {
    registryRouteComponents(module.routeComponents, module.name);
  }
}

export function getRegisteredModules() {
  return Array.from(moduleRegistry.values());
}

export function getModuleById(id: string) {
  return moduleRegistry.get(id);
}

export function clearModules() {
  moduleRegistry.clear();
  bootstrappedModules.clear();
  moduleRegistrationConflicts.length = 0;
}

export function getModuleRegistrationConflicts() {
  return [...moduleRegistrationConflicts];
}

export async function bootstrapRegisteredModules(ctx: AppContextValue) {
  const results: ModuleLoadResult[] = [];
  for (const module of moduleRegistry.values()) {
    if (!module.bootstrap || bootstrappedModules.has(module.id)) {
      continue;
    }
    try {
      await module.bootstrap(ctx);
      bootstrappedModules.add(module.id);
      results.push({ id: module.id, status: "loaded" });
    } catch (error) {
      results.push({
        id: module.id,
        status: "failed",
        reason: error instanceof Error ? error.message : "Unknown bootstrap error",
      });
    }
  }
  return results;
}
