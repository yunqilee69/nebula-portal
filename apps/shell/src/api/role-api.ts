import type { RoleDetail, RoleItem, RoleMutationPayload } from "@platform/core";
import { apiClient, getArray, getRecord, getString, unwrapEnvelope } from "./client";

function mapRole(item: unknown): RoleItem | null {
  const record = getRecord(item);
  if (!record) {
    return null;
  }
  return {
    id: getString(record.id) ?? crypto.randomUUID(),
    name: getString(record.name) ?? "Unnamed Role",
    code: getString(record.code) ?? "",
    status: typeof record.status === "number" ? record.status : undefined,
  };
}

export async function fetchRolePage() {
  const response = await apiClient.get("/roles/page", {
    params: { req: JSON.stringify({ pageNum: 1, pageSize: 20 }) },
  });
  const payload = unwrapEnvelope<Record<string, unknown>>(response.data);
  return getArray<unknown>(payload.data).map(mapRole).filter((item): item is RoleItem => item !== null);
}

export async function fetchRoleList() {
  const response = await apiClient.get("/roles/list");
  return getArray<unknown>(unwrapEnvelope<unknown[]>(response.data))
    .map(mapRole)
    .filter((item): item is RoleItem => item !== null);
}

export async function fetchRoleDetail(id: string): Promise<RoleDetail> {
  const response = await apiClient.get(`/roles/${id}`);
  const payload = unwrapEnvelope<Record<string, unknown>>(response.data);
  return {
    id: getString(payload.id) ?? id,
    name: getString(payload.name) ?? "Unnamed Role",
    code: getString(payload.code) ?? "",
    description: getString(payload.description),
    permissions: getArray<unknown>(payload.permissions)
      .map((item) => getString(getRecord(item)?.resourceId) ?? getString(getRecord(item)?.subjectId) ?? getString(item))
      .filter((item): item is string => Boolean(item)),
  };
}

export async function createRole(payload: RoleMutationPayload) {
  const response = await apiClient.post("/roles", { ...payload, permissionIds: payload.permissionIds ?? [] });
  return unwrapEnvelope<unknown>(response.data);
}

export async function updateRole(id: string, payload: RoleMutationPayload) {
  const response = await apiClient.put(`/roles/${id}`, { id, ...payload, permissionIds: payload.permissionIds ?? [] });
  return unwrapEnvelope<unknown>(response.data);
}

export async function deleteRole(id: string) {
  await apiClient.delete(`/roles/${id}`);
}
