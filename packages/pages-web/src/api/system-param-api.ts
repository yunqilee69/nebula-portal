import type { SystemParamDataType, SystemParamItem, SystemParamMutationPayload, SystemParamPageQuery, SystemParamPageResult } from "@nebula/core/types";
import { webEnv } from "../config/env";
import { apiClient, getArray, getRecord, getString, unwrapEnvelope } from "./client";

function mapSystemParam(item: unknown): SystemParamItem | null {
  const record = getRecord(item);
  if (!record) {
    return null;
  }

  const options = getArray<unknown>(record.options)
    .map((value) => getString(value))
    .filter((value): value is string => value !== undefined);

  const dataType = getString(record.dataType) as SystemParamDataType | undefined;

  return {
    id: getString(record.id) ?? crypto.randomUUID(),
    paramKey: getString(record.paramKey) ?? "",
    paramName: getString(record.paramName),
    description: getString(record.description),
    paramValue: getString(record.paramValue),
    dataType,
    options,
    minValue: typeof record.minValue === "number" ? record.minValue : undefined,
    maxValue: typeof record.maxValue === "number" ? record.maxValue : undefined,
    createTime: getString(record.createTime),
    updateTime: getString(record.updateTime),
  };
}

export async function fetchSystemParamPage(query: SystemParamPageQuery): Promise<SystemParamPageResult> {
  const response = await apiClient.post(webEnv.systemParamPagePath, query);
  const payload = unwrapEnvelope<Record<string, unknown>>(response.data);

  const data = getArray<unknown>(payload.records ?? payload.rows ?? payload.data)
    .map(mapSystemParam)
    .filter((item): item is SystemParamItem => item !== null);
  const totalCandidate = payload.total ?? payload.count;
  const total = typeof totalCandidate === "number" ? totalCandidate : data.length;
  return { data, total };
}

export async function fetchSystemParamDetail(id: string) {
  const response = await apiClient.get(`/api/param/system-params/${id}`);
  const payload = unwrapEnvelope<unknown>(response.data);
  return mapSystemParam(payload);
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
