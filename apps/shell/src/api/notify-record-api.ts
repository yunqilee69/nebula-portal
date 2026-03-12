import type { NotifyRecordDetail, NotifyRecordItem, NotifyRecordPageQuery, NotifyRecordPageResult } from "@platform/core";
import { shellEnv } from "../config/env";
import { getArray, getRecord, getString, requestGet } from "./client";

const now = new Date().toISOString();

const mockRecords: NotifyRecordDetail[] = [
  {
    id: "notify-record-1",
    bizType: "user",
    bizNo: "u001",
    channelType: "SITE",
    templateCode: "USER_WELCOME",
    subjectText: "Welcome admin",
    contentText: "Hello admin, welcome to Nebula.",
    receiver: "admin",
    ccReceiver: "",
    sendStatus: "SUCCESS",
    sendTime: now,
    extJson: '{"source":"mock"}',
    createTime: now,
    updateTime: now,
  },
];

function mapRecord(item: unknown): NotifyRecordDetail | null {
  const record = getRecord(item);
  if (!record) {
    return null;
  }
  return {
    id: getString(record.id) ?? crypto.randomUUID(),
    bizType: getString(record.bizType),
    bizNo: getString(record.bizNo),
    channelType: getString(record.channelType) ?? "SITE",
    templateCode: getString(record.templateCode),
    subjectText: getString(record.subjectText),
    contentText: getString(record.contentText),
    receiver: getString(record.receiver),
    ccReceiver: getString(record.ccReceiver),
    sendStatus: getString(record.sendStatus),
    failReason: getString(record.failReason),
    sendTime: getString(record.sendTime),
    extJson: getString(record.extJson),
    createTime: getString(record.createTime),
    updateTime: getString(record.updateTime),
  };
}

function parsePage(payload: Record<string, unknown>) {
  const pageData = getRecord(payload.data) ?? payload;
  const rows = getArray<unknown>(pageData.data ?? pageData.records ?? pageData.rows ?? pageData.list)
    .map(mapRecord)
    .filter((value): value is NotifyRecordItem => value !== null);
  const totalCandidate = pageData.total ?? payload.total ?? payload.count;
  const total = typeof totalCandidate === "number" ? totalCandidate : rows.length;
  return { data: rows, total } satisfies NotifyRecordPageResult;
}

export async function fetchNotifyRecordPage(query: NotifyRecordPageQuery): Promise<NotifyRecordPageResult> {
  if (shellEnv.useMockAuth) {
    const rows = mockRecords.filter((item) => {
      if (query.channelType && item.channelType !== query.channelType) {
        return false;
      }
      if (query.templateCode && item.templateCode !== query.templateCode) {
        return false;
      }
      if (query.receiver && !(item.receiver ?? "").includes(query.receiver)) {
        return false;
      }
      if (query.sendStatus && item.sendStatus !== query.sendStatus) {
        return false;
      }
      return true;
    });
    const start = (query.pageNum - 1) * query.pageSize;
    return { data: rows.slice(start, start + query.pageSize), total: rows.length };
  }
  const payload = await requestGet<Record<string, unknown>>("/notify/records/page", { req: JSON.stringify(query) });
  return parsePage(payload);
}

export async function fetchNotifyRecordDetail(id: string): Promise<NotifyRecordDetail | null> {
  if (shellEnv.useMockAuth) {
    return mockRecords.find((item) => item.id === id) ?? null;
  }
  const payload = await requestGet<unknown>(`/notify/records/${id}`);
  return mapRecord(payload);
}
