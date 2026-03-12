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
  if (shellEnv.useMockAuth) {
    const rows: SystemParamItem[] = [
      {
        id: "param-1",
        groupCode: "platform",
        paramKey: "upload_max_size",
        paramName: "Upload Max Size",
        dataType: "INTEGER",
        status: 1,
        isDynamic: 1,
      },
      {
        id: "param-2",
        groupCode: "theme",
        paramKey: "theme.primaryColor",
        paramName: "Primary Color",
        dataType: "STRING",
        status: 1,
        isDynamic: 1,
      },
    ];
    return { data: rows, total: rows.length };
  }

  const response = await apiClient.get(shellEnv.systemParamPagePath, { params: { req: JSON.stringify(query) } });
  const payload = unwrapEnvelope<Record<string, unknown>>(response.data);

  const data = getArray<unknown>(payload.data ?? payload.records ?? payload.rows)
    .map(mapSystemParam)
    .filter((item): item is SystemParamItem => item !== null);
  const totalCandidate = payload.total ?? payload.count;
  const total = typeof totalCandidate === "number" ? totalCandidate : data.length;
  return { data, total };
}

export async function createSystemParam(payload: SystemParamMutationPayload) {
  if (shellEnv.useMockAuth) {
    return { id: crypto.randomUUID(), ...payload };
  }
  const response = await apiClient.post("/system-params", payload);
  return unwrapEnvelope<unknown>(response.data);
}

export async function updateSystemParam(id: string, payload: SystemParamMutationPayload) {
  if (shellEnv.useMockAuth) {
    return { id, ...payload };
  }
  const response = await apiClient.put(`/system-params/${id}`, payload);
  return unwrapEnvelope<unknown>(response.data);
}

export async function deleteSystemParam(id: string) {
  if (shellEnv.useMockAuth) {
    return;
  }
  await apiClient.delete(`/system-params/${id}`);
}
