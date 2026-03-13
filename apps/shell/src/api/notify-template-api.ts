import type {
  NotifyTemplateDetail,
  NotifyTemplateItem,
  NotifyTemplateMutationPayload,
  NotifyTemplatePageQuery,
  NotifyTemplatePageResult,
  SendNotifyPayload,
} from "@platform/core";
import { getArray, getRecord, getString, requestDelete, requestGet, requestPost, requestPut } from "./client";

function getNumber(value: unknown) {
  return typeof value === "number" ? value : undefined;
}

function mapTemplate(item: unknown): NotifyTemplateDetail | null {
  const record = getRecord(item);
  if (!record) {
    return null;
  }
  return {
    id: getString(record.id) ?? crypto.randomUUID(),
    templateCode: getString(record.templateCode) ?? "",
    templateName: getString(record.templateName) ?? "",
    channelType: getString(record.channelType) ?? "SITE",
    subjectTemplate: getString(record.subjectTemplate),
    contentTemplate: getString(record.contentTemplate) ?? "",
    status: getNumber(record.status),
    isBuiltin: getNumber(record.isBuiltin),
    remark: getString(record.remark),
    createTime: getString(record.createTime),
    updateTime: getString(record.updateTime),
  };
}

function parsePage(payload: Record<string, unknown>) {
  const pageData = getRecord(payload.data) ?? payload;
  const rows = getArray<unknown>(pageData.data ?? pageData.records ?? pageData.rows ?? pageData.list)
    .map(mapTemplate)
    .filter((value): value is NotifyTemplateItem => value !== null);
  const totalCandidate = pageData.total ?? payload.total ?? payload.count;
  const total = typeof totalCandidate === "number" ? totalCandidate : rows.length;
  return { data: rows, total } satisfies NotifyTemplatePageResult;
}

export async function fetchNotifyTemplatePage(query: NotifyTemplatePageQuery): Promise<NotifyTemplatePageResult> {
  const payload = await requestGet<Record<string, unknown>>("/api/notify/templates/page", { req: JSON.stringify(query) });
  return parsePage(payload);
}

export async function fetchNotifyTemplateDetail(id: string): Promise<NotifyTemplateDetail | null> {
  const payload = await requestGet<unknown>(`/api/notify/templates/${id}`);
  return mapTemplate(payload);
}

export async function createNotifyTemplate(payload: NotifyTemplateMutationPayload) {
  return requestPost<unknown>("/api/notify/templates", payload);
}

export async function updateNotifyTemplate(id: string, payload: NotifyTemplateMutationPayload) {
  return requestPut<unknown>(`/api/notify/templates/${id}`, {
    templateName: payload.templateName,
    subjectTemplate: payload.subjectTemplate,
    contentTemplate: payload.contentTemplate,
    status: payload.status,
    isBuiltin: payload.isBuiltin,
    remark: payload.remark,
  });
}

export async function deleteNotifyTemplate(id: string) {
  await requestDelete<void>(`/api/notify/templates/${id}`);
}

export async function sendNotification(payload: SendNotifyPayload) {
  return requestPost<unknown>("/api/notify/send", payload);
}
