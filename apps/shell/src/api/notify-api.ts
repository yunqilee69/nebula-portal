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
  const response = await apiClient.get(shellEnv.notifyPath, {
    params: { req: JSON.stringify({ pageNum: 1, pageSize: 8, readStatus: 0 }) },
  });
  const payload = unwrapEnvelope<Record<string, unknown>>(response.data);

  return getArray<unknown>(payload.data ?? payload).map<NotificationItem>(mapSiteMessage);
}

export async function markNotificationRead(id: string) {
  await apiClient.put(shellEnv.notifyReadPathTemplate.replace("{id}", encodeURIComponent(id)));
}
