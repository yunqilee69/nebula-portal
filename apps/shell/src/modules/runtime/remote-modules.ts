import type { ModuleLoadResult, PlatformModule } from "@platform/core";
import { registerModule } from "@platform/core";
import {
  __federation_method_getRemote as getRemote,
  __federation_method_setRemote as setRemote,
  __federation_method_unwrapDefault as unwrapDefault,
} from "virtual:__federation__";
import { shellEnv } from "../../config/env";

interface RemoteManifestItem {
  id: string;
  remoteName: string;
  url: string;
  exposedModule: string;
}

const embeddedRemoteLoaders: Record<string, () => Promise<{ default: PlatformModule }>> = {
  demoBusiness: () => import("../../../../demo-business/src/register"),
};

const manifest: RemoteManifestItem[] = shellEnv.remoteModules.map((item) => ({
  id: item.id,
  remoteName: item.remoteName,
  url: item.url,
  exposedModule: item.exposedModule,
}));

async function loadEmbeddedModule(remoteName: string) {
  const loader = embeddedRemoteLoaders[remoteName];
  if (!loader) {
    throw new Error(`Embedded remote loader is not configured for ${remoteName}`);
  }
  return loader();
}

async function loadFederatedModule(item: RemoteManifestItem) {
  setRemote(item.remoteName, {
    url: () => Promise.resolve(item.url),
    format: "esm",
    from: "vite",
  });

  const remoteModule = await getRemote(item.remoteName, item.exposedModule);
  const unwrappedModule = await unwrapDefault(remoteModule);

  if (!unwrappedModule || typeof unwrappedModule !== "object" || !("default" in unwrappedModule)) {
    throw new Error(`Remote module ${item.remoteName} does not expose a default module export`);
  }

  return unwrappedModule as { default: PlatformModule };
}

export async function loadRemoteModules() {
  const results: ModuleLoadResult[] = [];

  for (const item of manifest) {
    try {
      const loaded = shellEnv.moduleMode === "embedded"
        ? await loadEmbeddedModule(item.remoteName)
        : await loadFederatedModule(item);

      registerModule(loaded.default);
      results.push({ id: item.id, status: "loaded" });
    } catch (error) {
      results.push({
        id: item.id,
        status: "failed",
        reason: error instanceof Error ? error.message : "Unknown remote loading error",
      });
    }
  }

  return results;
}
