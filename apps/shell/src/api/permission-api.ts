import type {
  PermissionItem,
  PermissionMutationPayload,
  PermissionPageQuery,
  PermissionPageResult,
} from "@platform/core";
import { apiClient, getArray, getRecord, getString, unwrapEnvelope } from "./client";

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
  const response = await apiClient.post("/api/auth/permissions/page", { query: JSON.stringify(query) });
  return parsePagePayload(unwrapEnvelope<Record<string, unknown>>(response.data));
}

export async function createPermission(payload: PermissionMutationPayload) {
  const normalized = { ...payload, effect: payload.effect ?? "Allow", scope: payload.scope ?? "ALL" };
  const response = await apiClient.post("/api/auth/permissions", normalized);
  return unwrapEnvelope<unknown>(response.data);
}

export async function updatePermission(id: string, payload: PermissionMutationPayload) {
  const normalized = { ...payload, id, effect: payload.effect ?? "Allow", scope: payload.scope ?? "ALL" };
  const response = await apiClient.put(`/api/auth/permissions/${id}`, normalized);
  return unwrapEnvelope<unknown>(response.data);
}

export async function deletePermission(id: string) {
  await apiClient.delete(`/api/auth/permissions/${id}`);
}
