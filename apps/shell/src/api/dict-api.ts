import type { DictRecord } from "@platform/core";
import { shellEnv } from "../config/env";
import { apiClient, getArray, getRecord, getString, unwrapEnvelope } from "./client";

function normalizeDictPayload(payload: unknown) {
  return getArray<unknown>(payload).map<DictRecord>((item) => {
    const record = getRecord(item) ?? {};
    return {
      label: getString(record.itemLabel) ?? getString(record.label) ?? "",
      value: getString(record.itemValue) ?? getString(record.value) ?? "",
      extra: getString(record.itemCode) ? { itemCode: getString(record.itemCode) ?? "" } : undefined,
    };
  });
}

export async function fetchDictByCode(typeCode: string) {
  const response = await apiClient.get(
    shellEnv.dictItemPathTemplate.replace("{typeCode}", encodeURIComponent(typeCode)),
  );
  const payload = unwrapEnvelope<unknown>(response.data);
  return normalizeDictPayload(payload);
}
