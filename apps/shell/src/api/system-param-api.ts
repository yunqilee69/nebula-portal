import type {
  SystemParamItem,
  SystemParamMutationPayload,
  SystemParamPageQuery,
  SystemParamPageResult,
} from "@platform/core";
import { shellEnv } from "../config/env";
import { apiClient, getArray, getRecord, getString, unwrapEnvelope } from "./client";

function mapSystemParam(item: unknown): SystemParamItem | null {
  const record = getRecord(item);
  if (!record) {
    return null;
  }
  return {
    id: getString(record.id) ?? crypto.randomUUID(),
    groupCode: getString(record.groupCode),
    paramKey: getString(record.paramKey) ?? "",
    paramName: getString(record.paramName),
    dataType: getString(record.dataType),
    status: typeof record.status === "number" ? record.status : undefined,
    isSensitive:
      typeof record.isSensitive === "number"
        ? record.isSensitive
        : typeof record.sensitive === "number"
          ? record.sensitive
          : undefined,
    isDynamic:
      typeof record.isDynamic === "number"
        ? record.isDynamic
        : typeof record.dynamic === "number"
          ? record.dynamic
          : undefined,
  };
}

export async function fetchSystemParamPage(query: SystemParamPageQuery): Promise<SystemParamPageResult> {
  const response = await apiClient.post(shellEnv.systemParamPagePath, query);
  const payload = unwrapEnvelope<Record<string, unknown>>(response.data);

  const data = getArray<unknown>(payload.data ?? payload.records ?? payload.rows)
    .map(mapSystemParam)
    .filter((item): item is SystemParamItem => item !== null);
  const totalCandidate = payload.total ?? payload.count;
  const total = typeof totalCandidate === "number" ? totalCandidate : data.length;
  return { data, total };
}

export async function createSystemParam(payload: SystemParamMutationPayload) {
  const response = await apiClient.post("/api/param/system-params", payload);
  return unwrapEnvelope<unknown>(response.data);
}

export async function updateSystemParam(id: string, payload: SystemParamMutationPayload) {
  const response = await apiClient.put(`/api/param/system-params/${id}`, payload);
  return unwrapEnvelope<unknown>(response.data);
}

export async function deleteSystemParam(id: string) {
  await apiClient.delete(`/api/param/system-params/${id}`);
}
