import type { ButtonItem, ButtonMutationPayload, ButtonPageQuery, ButtonPageResult } from "@platform/core";
import { shellEnv } from "../config/env";
import { apiClient, getArray, getRecord, getString, unwrapEnvelope } from "./client";
import { mockButtons, stampUpdatedTime } from "./mock-auth-admin-data";

function mapButton(item: unknown): ButtonItem | null {
  const record = getRecord(item);
  if (!record) {
    return null;
  }
  return {
    id: getString(record.id) ?? crypto.randomUUID(),
    menuId: getString(record.menuId),
    code: getString(record.code) ?? "",
    name: getString(record.name) ?? "Unnamed Button",
    type: getString(record.type),
    sort: typeof record.sort === "number" ? record.sort : undefined,
    status: typeof record.status === "number" ? record.status : undefined,
    createTime: getString(record.createTime),
    updateTime: getString(record.updateTime),
  };
}

function parsePagePayload(payload: Record<string, unknown>) {
  const rows = getArray<unknown>(payload.data ?? payload.records ?? payload.rows)
    .map(mapButton)
    .filter((item): item is ButtonItem => item !== null);
  const totalCandidate = payload.total ?? payload.count;
  const total = typeof totalCandidate === "number" ? totalCandidate : rows.length;
  return { data: rows, total } satisfies ButtonPageResult;
}

export async function fetchButtonPage(query: ButtonPageQuery): Promise<ButtonPageResult> {
  if (shellEnv.useMockAuth) {
    const rows = mockButtons.filter((item) => {
      if (query.menuId && item.menuId !== query.menuId) {
        return false;
      }
      if (query.name && !item.name.toLowerCase().includes(query.name.toLowerCase())) {
        return false;
      }
      if (query.code && !item.code.toLowerCase().includes(query.code.toLowerCase())) {
        return false;
      }
      if (typeof query.status === "number" && item.status !== query.status) {
        return false;
      }
      return true;
    });
    const start = (query.pageNum - 1) * query.pageSize;
    return { data: rows.slice(start, start + query.pageSize), total: rows.length };
  }

  const response = await apiClient.get("/buttons/page", { params: query });
  return parsePagePayload(unwrapEnvelope<Record<string, unknown>>(response.data));
}

export async function fetchButtonDetail(id: string) {
  if (shellEnv.useMockAuth) {
    return mockButtons.find((item) => item.id === id) ?? null;
  }

  const response = await apiClient.get(`/buttons/${id}`);
  return mapButton(unwrapEnvelope<unknown>(response.data));
}

export async function createButton(payload: ButtonMutationPayload) {
  if (shellEnv.useMockAuth) {
    const row: ButtonItem = {
      id: crypto.randomUUID(),
      ...payload,
      sort: payload.sort ?? 0,
      status: payload.status ?? 1,
      createTime: stampUpdatedTime(),
      updateTime: stampUpdatedTime(),
    };
    mockButtons.unshift(row);
    return row;
  }

  const response = await apiClient.post("/buttons", payload);
  return unwrapEnvelope<unknown>(response.data);
}

export async function updateButton(id: string, payload: ButtonMutationPayload) {
  if (shellEnv.useMockAuth) {
    const index = mockButtons.findIndex((item) => item.id === id);
    if (index >= 0) {
      mockButtons[index] = { ...mockButtons[index], ...payload, id, updateTime: stampUpdatedTime() };
      return mockButtons[index];
    }
    return { id, ...payload };
  }

  const response = await apiClient.put(`/buttons/${id}`, { id, ...payload });
  return unwrapEnvelope<unknown>(response.data);
}

export async function deleteButton(id: string) {
  if (shellEnv.useMockAuth) {
    const index = mockButtons.findIndex((item) => item.id === id);
    if (index >= 0) {
      mockButtons.splice(index, 1);
    }
    return;
  }

  await apiClient.delete(`/buttons/${id}`);
}
