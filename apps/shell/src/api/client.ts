import { message } from "antd";
import axios from "axios";
import type { AxiosRequestConfig } from "axios";
import type { ApiEnvelope, AuthSession } from "@platform/core";
import { shellEnv } from "../config/env";
import { getToken, useAuthStore } from "../modules/auth/auth-store";
import { useI18nStore } from "../modules/i18n/i18n-store";

export const apiClient = axios.create({
  baseURL: shellEnv.apiBaseUrl,
  timeout: 15000,
  withCredentials: true,
});

export class ApiClientError extends Error {
  status?: number;
  payload?: unknown;

  constructor(messageText: string, status?: number, payload?: unknown) {
    super(messageText);
    this.name = "ApiClientError";
    this.status = status;
    this.payload = payload;
  }
}

export interface ApiRequestOptions {
  successMessage?: string;
  errorMessage?: string;
  silent?: boolean;
  unwrap?: boolean;
}

interface ApiClientRequestConfig extends AxiosRequestConfig {
  feedbackOptions?: Pick<ApiRequestOptions, "errorMessage" | "silent">;
}

interface RetryableAxiosRequestConfig extends AxiosRequestConfig {
  _retry?: boolean;
}

let refreshPromise: Promise<AuthSession> | null = null;

apiClient.interceptors.request.use((config) => {
  const token = getToken();
  const hasAuthorizationHeader = Boolean(config.headers?.Authorization);
  const hasAcceptLanguageHeader = Boolean(config.headers?.["Accept-Language"]);
  const locale = useI18nStore.getState().locale;

  if (token && !hasAuthorizationHeader && !isAuthLifecycleRequest(config)) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  if (locale && !hasAcceptLanguageHeader) {
    config.headers["Accept-Language"] = locale;
  }

  return config;
});

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function getEnvelopeCode(payload: unknown) {
  const record = getRecord(payload);
  if (!record) {
    return undefined;
  }
  const code = record.code;
  if (typeof code === "number" || typeof code === "string") {
    return code;
  }
  return undefined;
}

function isSuccessfulEnvelopeCode(code: number | string | undefined) {
  if (code === undefined) {
    return true;
  }
  if (typeof code === "number") {
    return code === 0;
  }
  return code.trim() === "0";
}

export function unwrapEnvelope<T>(payload: unknown): T {
  if (!isRecord(payload)) {
    return payload as T;
  }
  const envelope = payload as ApiEnvelope<T>;
  if (envelope.data !== undefined) {
    return envelope.data;
  }
  if (envelope.result !== undefined) {
    return envelope.result;
  }
  if (envelope.rows !== undefined) {
    return envelope.rows;
  }
  return payload as T;
}

export function getString(value: unknown) {
  return typeof value === "string" ? value : undefined;
}

export function getArray<T>(value: unknown): T[] {
  return Array.isArray(value) ? (value as T[]) : [];
}

export function getRecord(value: unknown) {
  return isRecord(value) ? value : undefined;
}

function getEnvelopeMessage(payload: unknown) {
  const record = getRecord(payload);
  if (!record) {
    return undefined;
  }
  return getString(record.message) ?? getString(record.msg);
}

function resolveErrorMessage(error: unknown, fallbackMessage = "Request failed") {
  return normalizeApiError(error, fallbackMessage).message;
}

function shouldShowErrorMessage(config?: ApiClientRequestConfig) {
  return !config?.feedbackOptions?.silent && !isAuthLifecycleRequest(config);
}

function notifyApiError(error: unknown, config?: ApiClientRequestConfig) {
  if (!shouldShowErrorMessage(config)) {
    return;
  }

  const fallbackMessage = config?.feedbackOptions?.errorMessage ?? "Request failed";
  message.error(resolveErrorMessage(error, fallbackMessage));
}

function isAuthLifecycleRequest(config?: AxiosRequestConfig) {
  const url = config?.url ?? "";
  return [shellEnv.loginPath, shellEnv.refreshPath, shellEnv.logoutPath, shellEnv.currentUserPath].some((path) => url.includes(path));
}

async function ensureRefreshedSession() {
  if (refreshPromise) {
    return refreshPromise;
  }

  const refreshToken = useAuthStore.getState().session?.refreshToken;
  if (!refreshToken) {
    throw new ApiClientError("Session expired", 401);
  }

  refreshPromise = import("./auth-api")
    .then(({ refreshSession }) => refreshSession(refreshToken))
    .then((session) => {
      useAuthStore.getState().setSession(session);
      return session;
    })
    .finally(() => {
      refreshPromise = null;
    });

  return refreshPromise;
}

apiClient.interceptors.response.use(
  (response) => {
    const envelopeCode = getEnvelopeCode(response.data);
    if (!isSuccessfulEnvelopeCode(envelopeCode)) {
      const resolvedMessage = getEnvelopeMessage(response.data) ?? "Request failed";
      const apiError = new ApiClientError(resolvedMessage, response.status, response.data);
      notifyApiError(apiError, response.config as ApiClientRequestConfig | undefined);
      return Promise.reject(apiError);
    }
    return response;
  },
  async (error) => {
    const originalRequest = error.config as (RetryableAxiosRequestConfig & ApiClientRequestConfig) | undefined;

    if (error.response?.status === 401 && originalRequest && !originalRequest._retry && !isAuthLifecycleRequest(originalRequest)) {
      originalRequest._retry = true;

      try {
        const session = await ensureRefreshedSession();
        originalRequest.headers = {
          ...(originalRequest.headers ?? {}),
          Authorization: `Bearer ${session.token}`,
        };
        return apiClient.request(originalRequest);
      } catch {
        useAuthStore.getState().clearSession();
      }
    } else if (error.response?.status === 401) {
      useAuthStore.getState().clearSession();
    }

    notifyApiError(error, originalRequest);

    return Promise.reject(error);
  },
);

export function normalizeApiError(error: unknown, fallbackMessage = "Request failed") {
  if (error instanceof ApiClientError) {
    return error;
  }
  if (axios.isAxiosError(error)) {
    const payload = error.response?.data;
    const resolvedMessage = getEnvelopeMessage(payload) ?? error.message ?? fallbackMessage;
    return new ApiClientError(resolvedMessage, error.response?.status, payload);
  }
  if (error instanceof Error) {
    return new ApiClientError(error.message || fallbackMessage);
  }
  return new ApiClientError(fallbackMessage);
}

async function requestWithFeedback<T>(config: AxiosRequestConfig, options: ApiRequestOptions = {}) {
  try {
    const response = await apiClient.request({
      ...config,
      feedbackOptions: {
        silent: options.silent,
        errorMessage: options.errorMessage,
      },
    } as ApiClientRequestConfig);
    const payload = options.unwrap === false ? (response.data as T) : unwrapEnvelope<T>(response.data);
    if (options.successMessage) {
      message.success(options.successMessage);
    }
    return payload;
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
  return requestWithFeedback<T>(
    {
      method: "POST",
      url,
      data,
      headers: {
        "Content-Type": "multipart/form-data",
      },
    },
    options,
  );
}
