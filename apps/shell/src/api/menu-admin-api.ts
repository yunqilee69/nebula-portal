import type { MenuItem, MenuMutationPayload, MenuPageQuery, MenuPageResult } from "@platform/core";
import { apiClient, getArray, getRecord, getString, unwrapEnvelope } from "./client";

function normalizeMenuType(type: unknown): MenuItem["type"] {
  if (type === 1 || type === 2 || type === 3) {
    return type;
  }
  const value = getString(type)?.toUpperCase();
  if (value === "DIRECTORY" || value === "CATALOG") {
    return 1;
  }
  if (value === "BUTTON" || value === "PERMISSION") {
    return 3;
  }
  return 2;
}

function mapMenuRecord(item: unknown): MenuItem | null {
  const record = getRecord(item);
  if (!record) {
    return null;
  }
  const isExternal = record.isExternal === true;
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
    linkUrl: getString(record.externalUrl),
    icon: getString(record.icon),
    visible: record.hidden === true ? 0 : 1,
    permission: getString(record.permission) ?? getString(record.code),
    children: getArray<unknown>(record.children)
      .map(mapMenuRecord)
      .filter((item): item is MenuItem => item !== null),
  };
}

export async function fetchMenuPage(query: MenuPageQuery): Promise<MenuPageResult> {
  const response = await apiClient.get("/menus/page", { params: { query: JSON.stringify(query) } });
  const payload = unwrapEnvelope<Record<string, unknown>>(response.data);

  const data = getArray<unknown>(payload.data)
    .map(mapMenuRecord)
    .filter((item): item is MenuItem => item !== null);
  const total = typeof payload.total === "number" ? payload.total : data.length;
  return { data, total };
}

export async function createMenu(payload: MenuMutationPayload) {
  const response = await apiClient.post("/menus", payload);
  return unwrapEnvelope<unknown>(response.data);
}

export async function fetchMenuTree() {
  const response = await apiClient.get("/menus/tree");
  return getArray<unknown>(unwrapEnvelope<unknown[]>(response.data))
    .map(mapMenuRecord)
    .filter((item): item is MenuItem => item !== null);
}

export async function updateMenu(id: string, payload: MenuMutationPayload) {
  const response = await apiClient.put(`/menus/${id}`, { id, ...payload });
  return unwrapEnvelope<unknown>(response.data);
}

export async function deleteMenu(id: string) {
  await apiClient.delete(`/menus/${id}`);
}
