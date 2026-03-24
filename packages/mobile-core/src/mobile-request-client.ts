import { attachAuthToRequestClient } from "@nebula/auth";
import { createPlatformRequestClient, normalizePlatformApiError } from "@nebula/request";
import type { MobileRequestClient, MobileRequestClientOptions } from "./types";

export class MobileApiClientError extends Error {
  status?: number;
  payload?: unknown;

  constructor(messageText: string, status?: number, payload?: unknown) {
    super(messageText);
    this.name = "MobileApiClientError";
    this.status = status;
    this.payload = payload;
  }
}

export function normalizeMobileApiError(error: unknown, fallbackMessage = "Request failed") {
  const normalizedError = normalizePlatformApiError(error, fallbackMessage);
  return new MobileApiClientError(normalizedError.message, normalizedError.status, normalizedError.payload);
}

export function createMobileRequestClient(options: MobileRequestClientOptions): MobileRequestClient {
  const client = createPlatformRequestClient({
    baseURL: options.baseURL,
    getLocale: options.getLocale,
  });

  attachAuthToRequestClient({
    client: client.raw,
    getAccessToken: options.getAccessToken,
    getRefreshToken: options.getRefreshToken,
    refreshSession: options.refreshSession,
    onSessionRefreshed: options.onSessionRefreshed,
    onUnauthorized: options.onUnauthorized,
  });

  return {
    get: (url, params) => client.get(url, params),
    post: (url, payload) => client.post(url, payload),
    put: (url, payload) => client.put(url, payload),
    delete: (url) => client.delete(url),
    upload: (url, formData) => client.upload(url, formData),
  };
}
