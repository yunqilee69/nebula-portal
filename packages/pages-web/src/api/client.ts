import { message } from "antd";
import type { AxiosRequestConfig } from "axios";
import { attachAuthToRequestClient } from "@nebula/auth";
import { getToken, useAuthStore, useI18nStore } from "@nebula/core";
import { PlatformApiClientError, createPlatformRequestClient, getArray, getRecord, getString, normalizePlatformApiError, unwrapEnvelope } from "@nebula/request";
import { webEnv } from "../config/env";

export class ApiClientError extends PlatformApiClientError {}

export interface ApiRequestOptions {
  successMessage?: string;
  errorMessage?: string;
  silent?: boolean;
  unwrap?: boolean;
}

interface ApiClientRequestConfig extends AxiosRequestConfig {
  feedbackOptions?: Pick<ApiRequestOptions, "errorMessage" | "silent">;
  skipUnauthorizedFeedback?: boolean;
}

function shouldShowErrorMessage(config?: AxiosRequestConfig) {
  const typedConfig = config as ApiClientRequestConfig | undefined;
  return !typedConfig?.feedbackOptions?.silent && !isAuthLifecycleRequest(config) && !typedConfig?.skipUnauthorizedFeedback;
}

function isAuthLifecycleRequest(config?: AxiosRequestConfig) {
  const url = config?.url ?? "";
  return [
    webEnv.loginPath,
    webEnv.refreshPath,
    webEnv.logoutPath,
    webEnv.currentUserPath,
    webEnv.wechatWebRedirectPreparePath,
    webEnv.wechatWebRedirectCallbackPath,
    webEnv.wechatWebQrCodePath,
    webEnv.wechatWebStatusPath,
    webEnv.wechatWebCallbackPath,
  ].some((path) => url.includes(path));
}

let unauthorizedHandler: (() => void) | null = null;
let unauthorizedHandled = false;

function runUnauthorizedHandler() {
  if (unauthorizedHandled) {
    return;
  }

  unauthorizedHandled = true;
  unauthorizedHandler?.();
}

export function registerUnauthorizedHandler(handler: (() => void) | null) {
  unauthorizedHandler = handler;
}

export function resetUnauthorizedHandling() {
  unauthorizedHandled = false;
}

const requestClient = createPlatformRequestClient({
  baseURL: webEnv.apiBaseUrl,
  withCredentials: true,
  getLocale: () => useI18nStore.getState().locale,
  onResolvedError: (error, config) => {
    if (error.status === 401) {
      return;
    }

    if (!shouldShowErrorMessage(config)) {
      return;
    }

    const fallbackMessage = (config as ApiClientRequestConfig | undefined)?.feedbackOptions?.errorMessage ?? "Request failed";
    message.error(error.message || fallbackMessage);
  },
  onResolvedSuccess: (messageText) => {
    message.success(messageText);
  },
});

attachAuthToRequestClient({
  client: requestClient.raw,
  getAccessToken: () => getToken(),
  shouldAttachAuthorization: (config) => !isAuthLifecycleRequest(config),
  isAuthLifecycleRequest,
  getRefreshToken: () => useAuthStore.getState().session?.refreshToken ?? null,
  refreshSession: (refreshToken) => import("./auth-api").then(({ refreshSession }) => refreshSession(refreshToken)),
  onSessionRefreshed: (session) => {
    resetUnauthorizedHandling();
    useAuthStore.getState().setSession(session);
  },
  onUnauthorized: () => {
    if (!useAuthStore.getState().session?.token) {
      return;
    }

    useAuthStore.getState().clearSession();
    runUnauthorizedHandler();
  },
});

export const apiClient = requestClient.raw;

export { getArray, getRecord, getString, unwrapEnvelope };

export function normalizeApiError(error: unknown, fallbackMessage = "Request failed") {
  const normalizedError = normalizePlatformApiError(error, fallbackMessage);
  if (normalizedError instanceof ApiClientError) {
    return normalizedError;
  }

  return new ApiClientError(normalizedError.message, normalizedError.status, normalizedError.payload);
}

async function requestWithFeedback<T>(config: AxiosRequestConfig, options: ApiRequestOptions = {}) {
  try {
    return requestClient.request<T>(config, options);
  } catch (error) {
    throw normalizeApiError(error, options.errorMessage ?? "Request failed");
  }
}

export function requestGet<T>(url: string, params?: object, options?: ApiRequestOptions) {
  return requestWithFeedback<T>({ method: "GET", url, params }, options);
}

export function requestPost<T>(url: string, data?: unknown, options?: ApiRequestOptions) {
  return requestWithFeedback<T>({ method: "POST", url, data }, options);
}

export function requestPut<T>(url: string, data?: unknown, options?: ApiRequestOptions) {
  return requestWithFeedback<T>({ method: "PUT", url, data }, options);
}

export function requestDelete<T>(url: string, options?: ApiRequestOptions) {
  return requestWithFeedback<T>({ method: "DELETE", url }, options);
}

export function requestUpload<T>(url: string, data: FormData, options?: ApiRequestOptions) {
  return requestClient.upload<T>(url, data, options);
}
