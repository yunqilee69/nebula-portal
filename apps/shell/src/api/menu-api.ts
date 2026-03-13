import type { MenuItem } from "@platform/core";
import { shellEnv } from "../config/env";
import { apiClient, getRecord, getString, unwrapEnvelope } from "./client";

function normalizeMenuType(type: unknown): MenuItem["type"] {
  const value = getString(type)?.toUpperCase();
  if (value === "DIRECTORY" || value === "CATALOG") {
    return 1;
  }
  if (value === "BUTTON" || value === "PERMISSION") {
    return 3;
  }
  return 2;
}

function normalizeMenus(payload: unknown): MenuItem[] {
  const result = unwrapEnvelope<unknown>(payload);
  if (!Array.isArray(result)) {
    return [];
  }

  const mapNode = (item: unknown): MenuItem | null => {
    const record = getRecord(item);
    if (!record) {
      return null;
    }
    const isExternal = record.externalFlag === true || record.isExternal === true;
    const externalUrl = getString(record.externalUrl);
    return {
      id: getString(record.id) ?? crypto.randomUUID(),
      parentId: getString(record.parentId),
      name: getString(record.name) ?? "Unnamed Menu",
      sort: typeof record.sort === "number" ? record.sort : 0,
      status: record.status === 0 ? 0 : 1,
      type: normalizeMenuType(record.type),
      path: getString(record.path),
      component: getString(record.component),
      linkType: isExternal ? 2 : 1,
      linkUrl: externalUrl,
      icon: getString(record.icon),
      visible: record.hidden === true ? 0 : 1,
      permission: getString(record.permission) ?? getString(record.code),
      children: Array.isArray(record.children)
        ? record.children.map(mapNode).filter((child): child is MenuItem => child !== null)
        : undefined,
    };
  };

  return result.map(mapNode).filter((item): item is MenuItem => item !== null);
}

export async function fetchCurrentMenus() {
  const response = await apiClient.get(shellEnv.menuPath);
  return normalizeMenus(response.data);
}
