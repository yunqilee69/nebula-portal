import type { NotifyRecordDetail, NotifyRecordItem, NotifyRecordPageQuery, NotifyRecordPageResult } from "@nebula/core/types";
import { getArray, getRecord, getString, requestGet, requestPost } from "./client";

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
  const payload = await requestPost<Record<string, unknown>>("/api/notify/records/page", query);
  return parsePage(payload);
}

export async function fetchNotifyRecordDetail(id: string): Promise<NotifyRecordDetail | null> {
  const payload = await requestGet<unknown>(`/api/notify/records/${id}`);
  return mapRecord(payload);
}
