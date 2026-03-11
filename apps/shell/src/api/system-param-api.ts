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
    isSensitive: typeof record.isSensitive === "number" ? record.isSensitive : undefined,
    isDynamic: typeof record.isDynamic === "number" ? record.isDynamic : undefined,
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

  const flatParams: Record<string, unknown> = {
    pageNum: query.pageNum,
    pageSize: query.pageSize,
    orderName: query.orderName,
    orderType: query.orderType,
    groupCode: query.groupCode,
    paramKey: query.paramKey,
    paramName: query.paramName,
    status: query.status,
  };

  const request = async (params: Record<string, unknown>) => {
    const response = await apiClient.get(shellEnv.systemParamPagePath, { params });
    return unwrapEnvelope<Record<string, unknown>>(response.data);
  };

  let payload: Record<string, unknown>;
  try {
    payload = await request({ req: JSON.stringify(query) });
  } catch {
    payload = await request(flatParams);
  }

  const data = getArray<unknown>(payload.data)
    .map(mapSystemParam)
    .filter((item): item is SystemParamItem => item !== null);
  const total = typeof payload.total === "number" ? payload.total : data.length;
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
