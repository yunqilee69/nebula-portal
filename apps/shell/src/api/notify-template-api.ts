import type {
  NotifyTemplateDetail,
  NotifyTemplateItem,
  NotifyTemplateMutationPayload,
  NotifyTemplatePageQuery,
  NotifyTemplatePageResult,
  SendNotifyPayload,
} from "@platform/core";
import { shellEnv } from "../config/env";
import { getArray, getRecord, getString, requestDelete, requestGet, requestPost, requestPut } from "./client";

const now = new Date().toISOString();

const mockTemplates: NotifyTemplateDetail[] = [
  {
    id: "notify-template-1",
    templateCode: "USER_WELCOME",
    templateName: "User Welcome",
    channelType: "SITE",
    subjectTemplate: "Welcome ${username}",
    contentTemplate: "Hello ${username}, welcome to Nebula.",
    status: 1,
    isBuiltin: 0,
    remark: "Used after registration",
    createTime: now,
    updateTime: now,
  },
];

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
  if (shellEnv.useMockAuth) {
    const rows = mockTemplates.filter((item) => {
      if (query.templateCode && !item.templateCode.toLowerCase().includes(query.templateCode.toLowerCase())) {
        return false;
      }
      if (query.templateName && !item.templateName.toLowerCase().includes(query.templateName.toLowerCase())) {
        return false;
      }
      if (query.channelType && item.channelType !== query.channelType) {
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

  const payload = await requestGet<Record<string, unknown>>("/notify/templates/page", { req: JSON.stringify(query) });
  return parsePage(payload);
}

export async function fetchNotifyTemplateDetail(id: string): Promise<NotifyTemplateDetail | null> {
  if (shellEnv.useMockAuth) {
    return mockTemplates.find((item) => item.id === id) ?? null;
  }
  const payload = await requestGet<unknown>(`/notify/templates/${id}`);
  return mapTemplate(payload);
}

export async function createNotifyTemplate(payload: NotifyTemplateMutationPayload) {
  if (shellEnv.useMockAuth) {
    const next: NotifyTemplateDetail = {
      id: crypto.randomUUID(),
      ...payload,
      status: payload.status ?? 1,
      isBuiltin: payload.isBuiltin ?? 0,
      createTime: new Date().toISOString(),
      updateTime: new Date().toISOString(),
    };
    mockTemplates.unshift(next);
    return next;
  }
  return requestPost<unknown>("/notify/templates", payload);
}

export async function updateNotifyTemplate(id: string, payload: NotifyTemplateMutationPayload) {
  if (shellEnv.useMockAuth) {
    const index = mockTemplates.findIndex((item) => item.id === id);
    if (index >= 0) {
      mockTemplates[index] = { ...mockTemplates[index], ...payload, id, updateTime: new Date().toISOString() };
      return mockTemplates[index];
    }
    return null;
  }
  return requestPut<unknown>(`/notify/templates/${id}`, {
    templateName: payload.templateName,
    subjectTemplate: payload.subjectTemplate,
    contentTemplate: payload.contentTemplate,
    status: payload.status,
    isBuiltin: payload.isBuiltin,
    remark: payload.remark,
  });
}

export async function deleteNotifyTemplate(id: string) {
  if (shellEnv.useMockAuth) {
    const next = mockTemplates.filter((item) => item.id !== id);
    mockTemplates.splice(0, mockTemplates.length, ...next);
    return;
  }
  await requestDelete<void>(`/notify/templates/${id}`);
}

export async function sendNotification(payload: SendNotifyPayload) {
  if (shellEnv.useMockAuth) {
    return { success: true, id: crypto.randomUUID(), ...payload };
  }
  return requestPost<unknown>("/notify/send", payload);
}
