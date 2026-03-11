import type { NotificationItem } from "@platform/core";
import { shellEnv } from "../config/env";
import { apiClient, getArray, getRecord, getString, unwrapEnvelope } from "./client";

function normalizeType(value: unknown): NotificationItem["type"] {
  const rawType = getString(value);
  return rawType === "warning" || rawType === "error" ? rawType : "info";
}

function mapSiteMessage(item: unknown): NotificationItem {
  const record = getRecord(item) ?? {};
  return {
    id: getString(record.id) ?? crypto.randomUUID(),
    title: getString(record.title) ?? "Notification",
    type: normalizeType(record.type),
    read: record.read === true || record.readStatus === 1,
    createdAt: getString(record.createTime) ?? getString(record.createdAt),
  };
}

export async function fetchCurrentNotifications() {
  if (shellEnv.useMockAuth) {
    return [
      {
        id: "mock-message-1",
        title: "Welcome to Nebula Shell",
        type: "info",
        read: false,
        createdAt: new Date().toISOString(),
      },
    ] satisfies NotificationItem[];
  }

  const request = async (params: Record<string, unknown>) => {
    const response = await apiClient.get(shellEnv.notifyPath, { params });
    return unwrapEnvelope<Record<string, unknown>>(response.data);
  };

  let payload: Record<string, unknown>;
  try {
    payload = await request({ req: JSON.stringify({ pageNum: 1, pageSize: 8, readStatus: 0 }) });
  } catch {
    payload = await request({ pageNum: 1, pageSize: 8, readStatus: 0 });
  }

  return getArray<unknown>(payload.data ?? payload).map<NotificationItem>(mapSiteMessage);
}

export async function markNotificationRead(id: string) {
  if (shellEnv.useMockAuth) {
    return;
  }
  await apiClient.put(shellEnv.notifyReadPathTemplate.replace("{id}", encodeURIComponent(id)));
}
