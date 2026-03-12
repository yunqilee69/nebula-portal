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
import { shellEnv } from "../config/env";
import { getArray, getRecord, getString, requestDelete, requestGet, requestPost, requestPut } from "./client";

const now = new Date().toISOString();

const mockDictTypes: DictTypeDetail[] = [
  {
    id: "dict-type-1",
    typeCode: "file_type",
    typeName: "File Type",
    status: 1,
    cacheEnabled: 1,
    remark: "Shared file type dictionary",
    createTime: now,
    updateTime: now,
  },
  {
    id: "dict-type-2",
    typeCode: "notify_channel",
    typeName: "Notify Channel",
    status: 1,
    cacheEnabled: 1,
    remark: "Notification channels",
    createTime: now,
    updateTime: now,
  },
];

const mockDictItems: DictItemDetail[] = [
  {
    id: "dict-item-1",
    typeCode: "file_type",
    itemCode: "image",
    itemLabel: "Image",
    itemValue: "image",
    sort: 1,
    status: 1,
    isDefault: 1,
    tagColor: "blue",
    extraJson: '{"accept":"image/*"}',
    remark: "Images",
    createTime: now,
    updateTime: now,
  },
  {
    id: "dict-item-2",
    typeCode: "notify_channel",
    itemCode: "site",
    itemLabel: "Site Message",
    itemValue: "SITE",
    sort: 1,
    status: 1,
    isDefault: 1,
    tagColor: "green",
    extraJson: "",
    remark: "Default in-app channel",
    createTime: now,
    updateTime: now,
  },
];

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
  if (shellEnv.useMockAuth) {
    const rows = mockDictTypes.filter((item) => {
      if (query.typeCode && !item.typeCode.toLowerCase().includes(query.typeCode.toLowerCase())) {
        return false;
      }
      if (query.typeName && !item.typeName.toLowerCase().includes(query.typeName.toLowerCase())) {
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

  const payload = await requestGet<Record<string, unknown>>("/dict/types/page", { req: JSON.stringify(query) });
  return parsePageResult(payload, mapDictType) satisfies DictTypePageResult;
}

export async function fetchDictTypeDetail(id: string): Promise<DictTypeDetail | null> {
  if (shellEnv.useMockAuth) {
    return mockDictTypes.find((item) => item.id === id) ?? null;
  }

  const payload = await requestGet<unknown>(`/dict/types/${id}`);
  return mapDictType(payload);
}

export async function createDictType(payload: DictTypeMutationPayload) {
  if (shellEnv.useMockAuth) {
    const next: DictTypeDetail = {
      id: crypto.randomUUID(),
      ...payload,
      status: payload.status ?? 1,
      cacheEnabled: payload.cacheEnabled ?? 1,
      createTime: new Date().toISOString(),
      updateTime: new Date().toISOString(),
    };
    mockDictTypes.unshift(next);
    return next;
  }

  return requestPost<unknown>("/dict/types", payload);
}

export async function updateDictType(id: string, payload: DictTypeMutationPayload) {
  if (shellEnv.useMockAuth) {
    const index = mockDictTypes.findIndex((item) => item.id === id);
    if (index >= 0) {
      mockDictTypes[index] = {
        ...mockDictTypes[index],
        typeName: payload.typeName,
        status: payload.status,
        cacheEnabled: payload.cacheEnabled,
        remark: payload.remark,
        updateTime: new Date().toISOString(),
      };
      return mockDictTypes[index];
    }
    return null;
  }

  return requestPut<unknown>(`/dict/types/${id}`, {
    typeName: payload.typeName,
    status: payload.status,
    cacheEnabled: payload.cacheEnabled,
    remark: payload.remark,
  });
}

export async function deleteDictType(id: string) {
  if (shellEnv.useMockAuth) {
    const type = mockDictTypes.find((item) => item.id === id);
    const typeCode = type?.typeCode;
    const nextTypes = mockDictTypes.filter((item) => item.id !== id);
    mockDictTypes.splice(0, mockDictTypes.length, ...nextTypes);
    if (typeCode) {
      const nextItems = mockDictItems.filter((item) => item.typeCode !== typeCode);
      mockDictItems.splice(0, mockDictItems.length, ...nextItems);
    }
    return;
  }

  await requestDelete<void>(`/dict/types/${id}`);
}

export async function fetchDictItemPage(query: DictItemPageQuery): Promise<DictItemPageResult> {
  if (shellEnv.useMockAuth) {
    const rows = mockDictItems.filter((item) => {
      if (query.typeCode && item.typeCode !== query.typeCode) {
        return false;
      }
      if (query.itemCode && !item.itemCode.toLowerCase().includes(query.itemCode.toLowerCase())) {
        return false;
      }
      if (query.itemLabel && !item.itemLabel.toLowerCase().includes(query.itemLabel.toLowerCase())) {
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

  const payload = await requestGet<Record<string, unknown>>("/dict/items/page", { req: JSON.stringify(query) });
  return parsePageResult(payload, mapDictItem) satisfies DictItemPageResult;
}

export async function fetchDictItemDetail(id: string): Promise<DictItemDetail | null> {
  if (shellEnv.useMockAuth) {
    return mockDictItems.find((item) => item.id === id) ?? null;
  }

  const payload = await requestGet<unknown>(`/dict/items/${id}`);
  return mapDictItem(payload);
}

export async function createDictItem(payload: DictItemMutationPayload) {
  if (shellEnv.useMockAuth) {
    const next: DictItemDetail = {
      id: crypto.randomUUID(),
      ...payload,
      sort: payload.sort ?? 0,
      status: payload.status ?? 1,
      isDefault: payload.isDefault ?? 0,
      createTime: new Date().toISOString(),
      updateTime: new Date().toISOString(),
    };
    mockDictItems.unshift(next);
    return next;
  }

  return requestPost<unknown>("/dict/items", payload);
}

export async function updateDictItem(id: string, payload: DictItemMutationPayload) {
  if (shellEnv.useMockAuth) {
    const index = mockDictItems.findIndex((item) => item.id === id);
    if (index >= 0) {
      mockDictItems[index] = {
        ...mockDictItems[index],
        itemLabel: payload.itemLabel,
        itemValue: payload.itemValue,
        sort: payload.sort,
        status: payload.status,
        isDefault: payload.isDefault,
        tagColor: payload.tagColor,
        extraJson: payload.extraJson,
        remark: payload.remark,
        updateTime: new Date().toISOString(),
      };
      return mockDictItems[index];
    }
    return null;
  }

  return requestPut<unknown>(`/dict/items/${id}`, {
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
  if (shellEnv.useMockAuth) {
    const next = mockDictItems.filter((item) => item.id !== id);
    mockDictItems.splice(0, mockDictItems.length, ...next);
    return;
  }

  await requestDelete<void>(`/dict/items/${id}`);
}

export async function fetchDictTypeList() {
  const result = await fetchDictTypePage({ pageNum: 1, pageSize: 200 });
  return result.data;
}

export function toDictOptions(types: DictTypeItem[]) {
  return types.map((item) => ({ label: `${item.typeName} (${item.typeCode})`, value: item.typeCode }));
}
