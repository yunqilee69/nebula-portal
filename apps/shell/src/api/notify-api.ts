import type { NotificationItem } from "@platform/core";
import { shellEnv } from "../config/env";
import { apiClient, getArray, getRecord, getString, unwrapEnvelope } from "./client";

function normalizeCategory(value: unknown): NotificationItem["category"] {
  const normalized = getString(value)?.trim().toLowerCase().replace(/[\s-]+/g, "_");

  if (
    normalized === "announcement"
    || normalized === "system_announcement"
    || normalized === "system_notice"
    || normalized === "system_message"
    || normalized === "notice"
  ) {
    return "announcement";
  }

  if (
    normalized === "notification"
    || normalized === "message"
    || normalized === "site_message"
    || normalized === "site_notification"
  ) {
    return "notification";
  }

  return "unknown";
}

function inferCategoryFromContent(record: Record<string, unknown>): NotificationItem["category"] {
  const text = [
    getString(record.title),
    getString(record.content),
    getString(record.contentText),
    getString(record.noticeContent),
    getString(record.messageContent),
    getString(record.description),
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  if (/(公告|通告|系统公告|system announcement|system notice|announcement|notice)/.test(text)) {
    return "announcement";
  }

  if (text) {
    return "notification";
  }

  return "unknown";
}

function resolveCategory(record: Record<string, unknown>): NotificationItem["category"] {
  const normalizedCategory = normalizeCategory(
    record.category
    ?? record.noticeType
    ?? record.messageType
    ?? record.bizType
    ?? record.bizCategory,
  );

  if (normalizedCategory !== "unknown") {
    return normalizedCategory;
  }

  return inferCategoryFromContent(record);
}

function extractNotificationRows(payload: Record<string, unknown>) {
  return getArray<unknown>(payload.data ?? payload.records ?? payload.rows ?? payload.list ?? payload);
}

function normalizeType(value: unknown): NotificationItem["type"] {
  const rawType = getString(value);
  return rawType === "warning" || rawType === "error" ? rawType : "info";
}

function mapSiteMessage(item: unknown): NotificationItem {
  const record = getRecord(item) ?? {};
  const rawId = getString(record.id);
  return {
    id: rawId ?? `local-${crypto.randomUUID()}`,
    title: getString(record.title) ?? "Notification",
    content:
      getString(record.content)
      ?? getString(record.contentText)
      ?? getString(record.noticeContent)
      ?? getString(record.messageContent)
      ?? getString(record.description),
    type: normalizeType(record.type),
    category: resolveCategory(record),
    actionable: Boolean(rawId),
    read: record.read === true || record.readStatus === true || record.readStatus === 1,
    createdAt: getString(record.createTime) ?? getString(record.createdAt),
  };
}

export async function fetchCurrentNotifications() {
  const response = await apiClient.post(shellEnv.notifyPath, { pageNum: 1, pageSize: 8, readStatus: false });
  const payload = unwrapEnvelope<Record<string, unknown>>(response.data);

  return extractNotificationRows(payload).map<NotificationItem>(mapSiteMessage);
}

export async function markNotificationRead(id: string) {
  await apiClient.put(shellEnv.notifyReadPathTemplate.replace("{id}", encodeURIComponent(id)));
}
