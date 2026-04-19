import type { ConfigMap } from "@nebula/core/types";
import { webEnv } from "../config/env";
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

export async function fetchCurrentConfig() {
  if (webEnv.configKeys.length === 0) {
    return {};
  }
  const entries = await Promise.all(
    webEnv.configKeys.map(async (paramKey: string) => {
      const response = await apiClient.get(
        webEnv.systemParamKeyPathTemplate.replace("{paramKey}", encodeURIComponent(paramKey)),
      );
      const payload = unwrapEnvelope<unknown>(response.data);
      return [paramKey, typeof payload === "string" ? normalizeSystemParamValue(payload) : null] as const;
    }),
  );

  return entries.reduce<ConfigMap>((acc, [paramKey, value]) => {
    acc[paramKey] = value;
    return acc;
  }, {});
}
