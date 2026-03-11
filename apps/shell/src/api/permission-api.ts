import type {
  PermissionItem,
  PermissionMutationPayload,
  PermissionPageQuery,
  PermissionPageResult,
} from "@platform/core";
import { shellEnv } from "../config/env";
import { apiClient, getArray, getRecord, getString, unwrapEnvelope } from "./client";
import { mockPermissions, stampUpdatedTime } from "./mock-auth-admin-data";

function mapPermission(item: unknown): PermissionItem | null {
  const record = getRecord(item);
  if (!record) {
    return null;
  }
  const subjectType = getString(record.subjectType);
  const resourceType = getString(record.resourceType);
  const effect = getString(record.effect)?.toUpperCase();
  if (!subjectType || !resourceType) {
    return null;
  }
  return {
    id: getString(record.id) ?? crypto.randomUUID(),
    subjectType: (subjectType.toUpperCase() === "ORG" ? "ORG" : subjectType.toUpperCase() === "USER" ? "USER" : "ROLE"),
    subjectId: getString(record.subjectId) ?? "",
    resourceType: resourceType.toUpperCase() === "BUTTON" ? "BUTTON" : "MENU",
    resourceId: getString(record.resourceId) ?? "",
    effect: effect === "DENY" ? "Deny" : "Allow",
    scope: getString(record.scope),
    createTime: getString(record.createTime),
    updateTime: getString(record.updateTime),
  };
}

function parsePagePayload(payload: Record<string, unknown>) {
  const rows = getArray<unknown>(payload.data ?? payload.records ?? payload.rows)
    .map(mapPermission)
    .filter((item): item is PermissionItem => item !== null);
  const totalCandidate = payload.total ?? payload.count;
  const total = typeof totalCandidate === "number" ? totalCandidate : rows.length;
  return { data: rows, total } satisfies PermissionPageResult;
}

export async function fetchPermissionPage(query: PermissionPageQuery): Promise<PermissionPageResult> {
  if (shellEnv.useMockAuth) {
    const rows = mockPermissions.filter((item) => {
      if (query.subjectType && item.subjectType !== query.subjectType) {
        return false;
      }
      if (query.subjectId && item.subjectId !== query.subjectId) {
        return false;
      }
      if (query.resourceType && item.resourceType !== query.resourceType) {
        return false;
      }
      if (query.resourceId && item.resourceId !== query.resourceId) {
        return false;
      }
      if (query.effect && item.effect !== query.effect) {
        return false;
      }
      return true;
    });
    const start = (query.pageNum - 1) * query.pageSize;
    return { data: rows.slice(start, start + query.pageSize), total: rows.length };
  }

  const response = await apiClient.get("/permissions/page", { params: query });
  return parsePagePayload(unwrapEnvelope<Record<string, unknown>>(response.data));
}

export async function createPermission(payload: PermissionMutationPayload) {
  const normalized = { ...payload, effect: payload.effect ?? "Allow", scope: payload.scope ?? "ALL" };
  if (shellEnv.useMockAuth) {
    const row: PermissionItem = {
      id: crypto.randomUUID(),
      ...normalized,
      createTime: stampUpdatedTime(),
      updateTime: stampUpdatedTime(),
    };
    mockPermissions.unshift(row);
    return row;
  }

  const response = await apiClient.post("/permissions", normalized);
  return unwrapEnvelope<unknown>(response.data);
}

export async function updatePermission(id: string, payload: PermissionMutationPayload) {
  const normalized = { ...payload, id, effect: payload.effect ?? "Allow", scope: payload.scope ?? "ALL" };
  if (shellEnv.useMockAuth) {
    const index = mockPermissions.findIndex((item) => item.id === id);
    if (index >= 0) {
      mockPermissions[index] = { ...mockPermissions[index], ...normalized, updateTime: stampUpdatedTime() };
      return mockPermissions[index];
    }
    return normalized;
  }

  const response = await apiClient.put(`/permissions/${id}`, normalized);
  return unwrapEnvelope<unknown>(response.data);
}

export async function deletePermission(id: string) {
  if (shellEnv.useMockAuth) {
    const index = mockPermissions.findIndex((item) => item.id === id);
    if (index >= 0) {
      mockPermissions.splice(index, 1);
    }
    return;
  }

  await apiClient.delete(`/permissions/${id}`);
}
