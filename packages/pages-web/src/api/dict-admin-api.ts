import type { DictItemDetail, DictItemMutationPayload, DictItemPageQuery, DictItemPageResult, DictTypeDetail, DictTypeItem, DictTypeMutationPayload, DictTypePageQuery, DictTypePageResult } from "@nebula/core";
import { getArray, getRecord, getString, requestDelete, requestGet, requestPost, requestPut } from "./client";

function getNumber(value: unknown) {
  return typeof value === "number" ? value : undefined;
}

function getBoolean(value: unknown) {
  return typeof value === "boolean" ? value : undefined;
}

function mapDictType(item: unknown): DictTypeDetail | null {
  const record = getRecord(item);
  if (!record) {
    return null;
  }

  return {
    id: getString(record.id) ?? crypto.randomUUID(),
    code: getString(record.code) ?? "",
    name: getString(record.name) ?? "",
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
    dictCode: getString(record.dictCode) ?? "",
    parentId: getString(record.parentId),
    name: getString(record.name) ?? "",
    itemValue: getString(record.itemValue) ?? "",
    sort: getNumber(record.sort),
    enabled: getBoolean(record.enabled),
    tagColor: getString(record.tagColor),
    remark: getString(record.remark),
    createTime: getString(record.createTime),
    updateTime: getString(record.updateTime),
    children: getArray<unknown>(record.children)
      .map(mapDictItem)
      .filter((value): value is DictItemDetail => value !== null),
  };
}

function parsePageResult<T>(payload: Record<string, unknown>, mapper: (value: unknown) => T | null) {
  const rows = getArray<unknown>(payload.data ?? payload.records ?? payload.rows ?? payload.list)
    .map(mapper)
    .filter((value): value is T => value !== null);
  const totalCandidate = payload.total ?? payload.count;
  const total = typeof totalCandidate === "number" ? totalCandidate : rows.length;
  return { data: rows, total };
}

export async function fetchDictTypePage(query: DictTypePageQuery): Promise<DictTypePageResult> {
  const payload = await requestPost<Record<string, unknown>>("/api/dict/types/page", query);
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
    name: payload.name,
    remark: payload.remark,
  });
}

export async function deleteDictType(id: string) {
  await requestDelete<void>(`/api/dict/types/${id}`);
}

export async function fetchDictItemPage(query: DictItemPageQuery): Promise<DictItemPageResult> {
  const payload = await requestPost<Record<string, unknown>>("/api/dict/items/page", query);
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
    name: payload.name,
    itemValue: payload.itemValue,
    sort: payload.sort,
    enabled: payload.enabled,
    tagColor: payload.tagColor,
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
  return types.map((item) => ({ label: `${item.name} (${item.code})`, value: item.code }));
}
