import type {
  DictItemDetail,
  DictItemItem,
  DictItemMutationPayload,
  DictItemPageQuery,
  DictItemPageResult,
  DictTypeDetail,
  DictTypeItem,
  DictTypeMutationPayload,
  DictTypePageQuery,
  DictTypePageResult,
} from "@platform/core";
import { getArray, getRecord, getString, requestDelete, requestGet, requestPost, requestPut } from "./client";

function getNumber(value: unknown) {
  return typeof value === "number" ? value : undefined;
}

function mapDictType(item: unknown): DictTypeDetail | null {
  const record = getRecord(item);
  if (!record) {
    return null;
  }

  return {
    id: getString(record.id) ?? crypto.randomUUID(),
    typeCode: getString(record.typeCode) ?? "",
    typeName: getString(record.typeName) ?? "",
    status: getNumber(record.status),
    cacheEnabled: getNumber(record.cacheEnabled),
    remark: getString(record.remark),
    createTime: getString(record.createTime),
    updateTime: getString(record.updateTime),
  };
}

function mapDictItem(item: unknown): DictItemDetail | null {
  const record = getRecord(item);
  if (!record) {
    return null;
  }

  return {
    id: getString(record.id) ?? crypto.randomUUID(),
    typeCode: getString(record.typeCode) ?? "",
    itemCode: getString(record.itemCode) ?? "",
    itemLabel: getString(record.itemLabel) ?? "",
    itemValue: getString(record.itemValue) ?? "",
    sort: getNumber(record.sort),
    status: getNumber(record.status),
    isDefault: getNumber(record.isDefault),
    tagColor: getString(record.tagColor),
    extraJson: getString(record.extraJson),
    remark: getString(record.remark),
    createTime: getString(record.createTime),
    updateTime: getString(record.updateTime),
  };
}

function parsePageResult<T>(payload: Record<string, unknown>, mapper: (value: unknown) => T | null) {
  const pageData = getRecord(payload.data) ?? payload;
  const rows = getArray<unknown>(pageData.data ?? pageData.records ?? pageData.rows ?? pageData.list)
    .map(mapper)
    .filter((value): value is T => value !== null);
  const totalCandidate = pageData.total ?? payload.total ?? payload.count;
  const total = typeof totalCandidate === "number" ? totalCandidate : rows.length;
  return { data: rows, total };
}

export async function fetchDictTypePage(query: DictTypePageQuery): Promise<DictTypePageResult> {
  const payload = await requestPost<Record<string, unknown>>("/api/dict/types/page", { req: JSON.stringify(query) });
  return parsePageResult(payload, mapDictType) satisfies DictTypePageResult;
}

export async function fetchDictTypeDetail(id: string): Promise<DictTypeDetail | null> {
  const payload = await requestGet<unknown>(`/api/dict/types/${id}`);
  return mapDictType(payload);
}

export async function createDictType(payload: DictTypeMutationPayload) {
  return requestPost<unknown>("/api/dict/types", payload);
}

export async function updateDictType(id: string, payload: DictTypeMutationPayload) {
  return requestPut<unknown>(`/api/dict/types/${id}`, {
    typeName: payload.typeName,
    status: payload.status,
    cacheEnabled: payload.cacheEnabled,
    remark: payload.remark,
  });
}

export async function deleteDictType(id: string) {
  await requestDelete<void>(`/api/dict/types/${id}`);
}

export async function fetchDictItemPage(query: DictItemPageQuery): Promise<DictItemPageResult> {
  const payload = await requestPost<Record<string, unknown>>("/api/dict/items/page", { req: JSON.stringify(query) });
  return parsePageResult(payload, mapDictItem) satisfies DictItemPageResult;
}

export async function fetchDictItemDetail(id: string): Promise<DictItemDetail | null> {
  const payload = await requestGet<unknown>(`/api/dict/items/${id}`);
  return mapDictItem(payload);
}

export async function createDictItem(payload: DictItemMutationPayload) {
  return requestPost<unknown>("/api/dict/items", payload);
}

export async function updateDictItem(id: string, payload: DictItemMutationPayload) {
  return requestPut<unknown>(`/api/dict/items/${id}`, {
    itemLabel: payload.itemLabel,
    itemValue: payload.itemValue,
    sort: payload.sort,
    status: payload.status,
    isDefault: payload.isDefault,
    tagColor: payload.tagColor,
    extraJson: payload.extraJson,
    remark: payload.remark,
  });
}

export async function deleteDictItem(id: string) {
  await requestDelete<void>(`/api/dict/items/${id}`);
}

export async function fetchDictTypeList() {
  const result = await fetchDictTypePage({ pageNum: 1, pageSize: 200 });
  return result.data;
}

export function toDictOptions(types: DictTypeItem[]) {
  return types.map((item) => ({ label: `${item.typeName} (${item.typeCode})`, value: item.typeCode }));
}
