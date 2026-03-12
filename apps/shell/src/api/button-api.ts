import type { ButtonItem, ButtonMutationPayload, ButtonPageQuery, ButtonPageResult } from "@platform/core";
import { apiClient, getArray, getRecord, getString, unwrapEnvelope } from "./client";

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
  const response = await apiClient.get("/buttons/page", { params: { query: JSON.stringify(query) } });
  return parsePagePayload(unwrapEnvelope<Record<string, unknown>>(response.data));
}

export async function fetchButtonDetail(id: string) {
  const response = await apiClient.get(`/buttons/${id}`);
  return mapButton(unwrapEnvelope<unknown>(response.data));
}

export async function createButton(payload: ButtonMutationPayload) {
  const response = await apiClient.post("/buttons", payload);
  return unwrapEnvelope<unknown>(response.data);
}

export async function updateButton(id: string, payload: ButtonMutationPayload) {
  const response = await apiClient.put(`/buttons/${id}`, { id, ...payload });
  return unwrapEnvelope<unknown>(response.data);
}

export async function deleteButton(id: string) {
  await apiClient.delete(`/buttons/${id}`);
}
