import type {
  SystemParamBatchUpdateItem,
  SystemParamBatchUpdateResult,
  SystemParamDataType,
  SystemParamItem,
  SystemParamMutationPayload,
  SystemParamPageQuery,
  SystemParamPageResult,
} from "@nebula/core";
import { webEnv } from "../config/env";
import { apiClient, getArray, getRecord, getString, unwrapEnvelope } from "./client";

function getNumber(value: unknown): number | undefined {
  return typeof value === "number" ? value : undefined;
}

function getBoolean(value: unknown): boolean | undefined {
  return typeof value === "boolean" ? value : undefined;
}

function mapSystemParam(item: unknown): SystemParamItem | null {
  const record = getRecord(item);
  if (!record) {
    return null;
  }

  const dataType = getString(record.dataType) as SystemParamDataType | undefined;

  return {
    id: getString(record.id) ?? crypto.randomUUID(),
    paramKey: getString(record.paramKey) ?? "",
    paramName: getString(record.paramName),
    description: getString(record.description),
    paramValue: getString(record.paramValue),
    dataType,
    defaultValue: getString(record.defaultValue),
    optionCode: getString(record.optionCode),
    minValue: getNumber(record.minValue),
    maxValue: getNumber(record.maxValue),
    minLength: getNumber(record.minLength),
    maxLength: getNumber(record.maxLength),
    validatorRegex: getString(record.validatorRegex),
    validatorMessage: getString(record.validatorMessage),
    renderEnabled: getBoolean(record.renderEnabled),
    placeholder: getString(record.placeholder),
    moduleCode: getString(record.moduleCode),
    displayOrder: getNumber(record.displayOrder),
    sensitiveFlag: getBoolean(record.sensitiveFlag),
    builtinFlag: getBoolean(record.builtinFlag),
    editableFlag: getBoolean(record.editableFlag),
    visibleFlag: getBoolean(record.visibleFlag),
    createTime: getString(record.createTime),
    updateTime: getString(record.updateTime),
  };
}

export async function fetchSystemParamPage(query: SystemParamPageQuery): Promise<SystemParamPageResult> {
  const response = await apiClient.post(webEnv.systemParamPagePath, query);
  const payload = unwrapEnvelope<Record<string, unknown>>(response.data);

  const data = getArray<unknown>(payload.records ?? payload.rows ?? payload.data)
    .map(mapSystemParam)
    .filter((item): item is SystemParamItem => item !== null);
  const totalCandidate = payload.total ?? payload.count;
  const total = typeof totalCandidate === "number" ? totalCandidate : data.length;
  return { data, total };
}

export async function fetchSystemParamDetail(id: string) {
  const response = await apiClient.get(`/api/param/system-params/${id}`);
  const payload = unwrapEnvelope<unknown>(response.data);
  return mapSystemParam(payload);
}

export async function fetchSystemParamByKeyDetail(paramKey: string) {
  const response = await apiClient.get(`/api/param/system-params/key/${paramKey}/detail`);
  const payload = unwrapEnvelope<unknown>(response.data);
  return mapSystemParam(payload);
}

export async function fetchSystemParamsByModule(moduleCode: string) {
  const response = await apiClient.get(`/api/param/system-params/module/${moduleCode}`);
  const payload = unwrapEnvelope<unknown>(response.data);
  const data = getArray<unknown>(payload)
    .map(mapSystemParam)
    .filter((item): item is SystemParamItem => item !== null);
  return data;
}

export async function fetchSystemParamValueByKey(paramKey: string) {
  const response = await apiClient.get(`/api/param/system-params/key/${paramKey}`);
  const payload = unwrapEnvelope<string>(response.data);
  return payload;
}

export async function fetchSystemParamBooleanByKey(paramKey: string) {
  const response = await apiClient.get(`/api/param/system-params/key/${paramKey}/boolean`);
  const payload = unwrapEnvelope<boolean>(response.data);
  return payload;
}

export async function fetchSystemParamIntegerByKey(paramKey: string) {
  const response = await apiClient.get(`/api/param/system-params/key/${paramKey}/integer`);
  const payload = unwrapEnvelope<number>(response.data);
  return payload;
}

export async function createSystemParam(payload: SystemParamMutationPayload) {
  const response = await apiClient.post("/api/param/system-params", payload);
  return unwrapEnvelope<unknown>(response.data);
}

export async function updateSystemParam(id: string, payload: SystemParamMutationPayload) {
  const response = await apiClient.put(`/api/param/system-params/${id}`, payload);
  return unwrapEnvelope<unknown>(response.data);
}

export async function saveOrUpdateSystemParamByKey(paramKey: string, payload: SystemParamMutationPayload) {
  const response = await apiClient.put(`/api/param/system-params/key/${paramKey}`, payload);
  return unwrapEnvelope<unknown>(response.data);
}

export async function deleteSystemParam(id: string) {
  await apiClient.delete(`/api/param/system-params/${id}`);
}

export async function batchUpdateParamValues(items: SystemParamBatchUpdateItem[]): Promise<SystemParamBatchUpdateResult> {
  const response = await apiClient.post("/api/param/system-params/batch-update-values", items);
  const payload = unwrapEnvelope<Record<string, unknown>>(response.data);

  const results = getArray<unknown>(payload.results ?? payload.items ?? [])
    .map((item) => {
      const record = getRecord(item);
      if (!record) return null;
      return {
        paramKey: getString(record.paramKey) ?? "",
        success: getBoolean(record.success) ?? false,
        message: getString(record.message) ?? getString(record.errorMessage),
      };
    })
    .filter((item): item is NonNullable<typeof item> => item !== null);

  return {
    successCount: getNumber(payload.successCount) ?? 0,
    failCount: getNumber(payload.failCount) ?? 0,
    results,
  };
}

export async function fetchSystemParamModules(): Promise<string[]> {
  const result = await fetchSystemParamPage({ pageNum: 1, pageSize: 1000 });
  const moduleSet = new Set<string>();
  for (const item of result.data) {
    if (item.moduleCode && item.visibleFlag) {
      moduleSet.add(item.moduleCode);
    }
  }
  return Array.from(moduleSet).sort();
}

const PARAM_MODULE_DICT_CODE = "param_module";

export function getSystemParamModulesFromDict(dictRecords: Record<string, Array<{ value: string }>>): string[] {
  const modules = dictRecords[PARAM_MODULE_DICT_CODE] ?? [];
  return modules.map((m) => m.value).sort();
}