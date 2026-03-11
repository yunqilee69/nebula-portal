import type { RoleDetail, RoleItem, RoleMutationPayload } from "@platform/core";
import { shellEnv } from "../config/env";
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
  if (shellEnv.useMockAuth) {
    return [
      { id: "role-1", name: "Platform Admin", code: "platform_admin", status: 1 },
      { id: "role-2", name: "Business Operator", code: "biz_operator", status: 1 },
    ] satisfies RoleItem[];
  }
  const request = async (params: Record<string, unknown>) => {
    const response = await apiClient.get("/roles/page", { params });
    return unwrapEnvelope<Record<string, unknown>>(response.data);
  };
  let payload: Record<string, unknown>;
  try {
    payload = await request({ req: JSON.stringify({ pageNum: 1, pageSize: 20 }) });
  } catch {
    payload = await request({ pageNum: 1, pageSize: 20 });
  }
  return getArray<unknown>(payload.data).map(mapRole).filter((item): item is RoleItem => item !== null);
}

export async function fetchRoleDetail(id: string): Promise<RoleDetail> {
  if (shellEnv.useMockAuth) {
    return {
      id,
      name: id === "role-1" ? "Platform Admin" : "Business Operator",
      code: id === "role-1" ? "platform_admin" : "biz_operator",
      description: "Mock role detail for local shell preview",
      permissions: ["crm:customer:create", "crm:customer:edit", "crm:customer:export"],
    };
  }
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
  if (shellEnv.useMockAuth) {
    return { id: crypto.randomUUID(), ...payload };
  }
  const response = await apiClient.post("/roles", { ...payload, permissionIds: payload.permissionIds ?? [] });
  return unwrapEnvelope<unknown>(response.data);
}

export async function updateRole(id: string, payload: RoleMutationPayload) {
  if (shellEnv.useMockAuth) {
    return { id, ...payload };
  }
  const response = await apiClient.put(`/roles/${id}`, { id, ...payload, permissionIds: payload.permissionIds ?? [] });
  return unwrapEnvelope<unknown>(response.data);
}

export async function deleteRole(id: string) {
  if (shellEnv.useMockAuth) {
    return;
  }
  await apiClient.delete(`/roles/${id}`);
}
