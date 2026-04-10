import $$$ from "@nebula/core";
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
    description: getString(record.description),
    parentId: getString(record.parentId),
    status: typeof record.status === "number" ? record.status : undefined,
    createTime: getString(record.createTime),
    updateTime: getString(record.updateTime),
  };
}

function parseRolePagePayload(payload: Record<string, unknown>): RolePageResult {
  const rows = getArray<unknown>(payload.data ?? payload.records ?? payload.rows)
    .map(mapRole)
    .filter((item): item is RoleItem => item !== null);
  const totalCandidate = payload.total ?? payload.count;
  const total = typeof totalCandidate === "number" ? totalCandidate : rows.length;
  return { data: rows, total };
}

function normalizeRoleMutationPayload(payload: RoleMutationPayload, id?: string) {
  const normalized: Record<string, unknown> = {
    ...(id ? { id } : {}),
    name: payload.name,
    code: payload.code,
    description: payload.description?.trim() ?? "",
    status: payload.status ?? 1,
  };

  if (payload.parentId?.trim()) {
    normalized.parentId = payload.parentId.trim();
  }
  if (Array.isArray(payload.permissionIds)) {
    normalized.permissionIds = payload.permissionIds;
  }

  return normalized;
}

export async function fetchRolePage(query: RolePageQuery = { pageNum: 1, pageSize: 20, orderType: "desc" }): Promise<RolePageResult> {
  const response = await apiClient.post("/api/auth/roles/page", query);
  return parseRolePagePayload(unwrapEnvelope<Record<string, unknown>>(response.data));
}

export async function fetchRoleList() {
  const response = await apiClient.get("/api/auth/roles/list");
  return getArray<unknown>(unwrapEnvelope<unknown[]>(response.data))
    .map(mapRole)
    .filter((item): item is RoleItem => item !== null);
}

export async function fetchRoleDetail(id: string): Promise<RoleDetail> {
  const response = await apiClient.get(`/api/auth/roles/${id}`);
  const payload = unwrapEnvelope<Record<string, unknown>>(response.data);
  return {
    id: getString(payload.id) ?? id,
    name: getString(payload.name) ?? "Unnamed Role",
    code: getString(payload.code) ?? "",
    description: getString(payload.description),
    parentId: getString(payload.parentId),
    status: typeof payload.status === "number" ? payload.status : undefined,
    createTime: getString(payload.createTime),
    updateTime: getString(payload.updateTime),
    permissions: getArray<unknown>(payload.permissions)
      .map((item) => {
        const record = getRecord(item);
        if (!record) {
          return null;
        }
        const permissionId = getString(record.id);
        const name = getString(record.name);
        const code = getString(record.code);
        if (!permissionId || !name || !code) {
          return null;
        }
        return { id: permissionId, name, code };
      })
      .filter((item): item is NonNullable<typeof item> => item !== null),
  };
}

export async function createRole(payload: RoleMutationPayload) {
  const response = await apiClient.post("/api/auth/roles", normalizeRoleMutationPayload(payload));
  return unwrapEnvelope<unknown>(response.data);
}

export async function updateRole(id: string, payload: RoleMutationPayload) {
  const response = await apiClient.put(`/api/auth/roles/${id}`, normalizeRoleMutationPayload(payload, id));
  return unwrapEnvelope<unknown>(response.data);
}

export async function deleteRole(id: string) {
  await apiClient.delete(`/api/auth/roles/${id}`);
}
