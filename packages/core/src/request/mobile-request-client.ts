import { createPlatformRequestClient, normalizePlatformApiError } from "@nebula/request";
import { attachAuthToRequestClient } from "../auth/session-helpers";
import type { MobileRequestClient, MobileRequestClientOptions } from "../types";

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

/**
 * Create a mobile request client for React Native.
 * This wraps the platform request client with mobile-specific auth handling.
 */
export function createMobileRequestClient(options: MobileRequestClientOptions): MobileRequestClient {
  const client = createPlatformRequestClient({
    baseURL: options.baseURL,
    getLocale: options.getLocale,
  });

  attachAuthToRequestClient({
    client: client.raw,
    getAccessToken: () => options.getAccessToken(),
    getRefreshToken: options.getRefreshToken ? () => options.getRefreshToken!() : undefined,
    refreshSession: options.refreshSession,
    onSessionRefreshed: async (session) => {
      await options.onSessionRefreshed?.(session);
    },
    onUnauthorized: async () => {
      await options.onUnauthorized?.();
    },
  });

  return {
    get: (url, params) => client.get(url, params),
    post: (url, payload) => client.post(url, payload),
    put: (url, payload) => client.put(url, payload),
    delete: (url) => client.delete(url),
    upload: (url, formData) => client.upload(url, formData),
  };
}
