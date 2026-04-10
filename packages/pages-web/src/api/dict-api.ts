import $$$ from "@nebula/core";
import { shellEnv } from "../config/env";
import { apiClient, getArray, getRecord, getString, unwrapEnvelope } from "./client";

function pickRecordExtras(record: Record<string, unknown>) {
  const extras: Record<string, string> = {};

  Object.entries(record).forEach(([key, value]) => {
    if (key === "itemLabel" || key === "label" || key === "itemValue" || key === "value") {
      return;
    }

    const normalized = getString(value);
    if (normalized) {
      extras[key] = normalized;
    }
  });

  return Object.keys(extras).length > 0 ? extras : undefined;
}

function normalizeDictPayload(payload: unknown) {
  return getArray<unknown>(payload).map<DictRecord>((item) => {
    const record = getRecord(item) ?? {};
    return {
      label: getString(record.itemLabel) ?? getString(record.label) ?? "",
      value: getString(record.itemValue) ?? getString(record.value) ?? "",
      extra: pickRecordExtras(record),
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
