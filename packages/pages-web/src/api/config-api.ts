import type { ConfigMap } from "@nebula/core";
import { apiClient, unwrapEnvelope } from "./client";

function normalizeSystemParamValue(rawValue: string): string | number | boolean | null {
  const trimmed = rawValue.trim();
  if (trimmed === "") {
    return "";
  }
  if (trimmed === "null") {
    return null;
  }
  if (trimmed === "true") {
    return true;
  }
  if (trimmed === "false") {
    return false;
  }
  const numeric = Number(trimmed);
  if (!Number.isNaN(numeric) && /^-?\d+(\.\d+)?$/.test(trimmed)) {
    return numeric;
  }
  return rawValue;
}

export async function fetchSystemParamValue(paramKey: string) {
  const response = await apiClient.get(`/api/param/system-params/key/${encodeURIComponent(paramKey)}`);
  const payload = unwrapEnvelope<unknown>(response.data);
  return typeof payload === "string" ? normalizeSystemParamValue(payload) : null;
}

export async function fetchCurrentConfig(paramKeys: string[]) {
  if (paramKeys.length === 0) {
    return {};
  }
  const entries = await Promise.all(
    paramKeys.map(async (paramKey) => {
      const value = await fetchSystemParamValue(paramKey);
      return [paramKey, value] as const;
    }),
  );

  return entries.reduce<ConfigMap>((acc, [paramKey, value]) => {
    acc[paramKey] = value;
    return acc;
  }, {});
}
