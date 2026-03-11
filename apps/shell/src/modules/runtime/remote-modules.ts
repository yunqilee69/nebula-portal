import type { ModuleLoadResult, PlatformModule } from "@platform/core";
import { registerModule } from "@platform/core";

interface RemoteManifestItem {
  id: string;
  load: () => Promise<{ default: PlatformModule }>;
}

const manifest: RemoteManifestItem[] = [
  {
    id: "@business/demo",
    load: () => import("demoBusiness/register"),
  },
];

export async function loadRemoteModules() {
  const results: ModuleLoadResult[] = [];

  for (const item of manifest) {
    try {
      const loaded = await item.load();
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
