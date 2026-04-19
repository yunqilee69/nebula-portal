import axios from "axios";
import type { AxiosHeaders, AxiosInstance, AxiosRequestConfig, AxiosHeaderValue, InternalAxiosRequestConfig } from "axios";
import type { AuthSession } from "./session-utils";

export interface AttachAuthRequestOptions {
  client: AxiosInstance;
  getAccessToken?: () => Promise<string | null> | string | null;
  shouldAttachAuthorization?: (config: AxiosRequestConfig) => boolean;
  isAuthLifecycleRequest?: (config?: AxiosRequestConfig) => boolean;
  getRefreshToken?: () => Promise<string | null> | string | null;
  refreshSession?: (refreshToken: string) => Promise<AuthSession>;
  onSessionRefreshed?: (session: AuthSession) => Promise<void> | void;
  onUnauthorized?: () => Promise<void> | void;
}

interface RetryableAxiosRequestConfig extends AxiosRequestConfig {
  _retry?: boolean;
  headers?: Record<string, string>;
}

type AxiosHeadersInput = Record<string, AxiosHeaderValue> | AxiosHeaders;

async function resolveOptional<T>(value: Promise<T> | T) {
  return value;
}

function normalizeHeaders(headers?: AxiosRequestConfig["headers"] | InternalAxiosRequestConfig["headers"]) {
  if (!headers) {
    return axios.AxiosHeaders.from({});
  }

  const normalizedHeaders = new axios.AxiosHeaders(headers as AxiosHeadersInput);
  const headerEntries = normalizedHeaders.toJSON(true) as Record<string, AxiosHeaderValue>;

  for (const [key, value] of Object.entries(headerEntries)) {
    if (value == null) {
      normalizedHeaders.delete(key);
    }
  }

  return normalizedHeaders;
}

export function attachAuthToRequestClient(options: AttachAuthRequestOptions) {
  let refreshPromise: Promise<AuthSession> | null = null;

  options.client.interceptors.request.use(async (config) => {
    const token = options.getAccessToken ? await resolveOptional(options.getAccessToken()) : null;
    const nextHeaders = normalizeHeaders(config.headers);

    const shouldAttachAuthorization = token && !nextHeaders.has("Authorization") && (options.shouldAttachAuthorization?.(config) ?? true);
    if (shouldAttachAuthorization) {
      nextHeaders.set("Authorization", `Bearer ${token}`);
    }

    config.headers = nextHeaders;
    return config;
  });

  async function ensureRefreshedSession() {
    if (!options.refreshSession || !options.getRefreshToken) {
      throw new Error("Session expired");
    }

    if (refreshPromise) {
      return refreshPromise;
    }

    const refreshToken = await resolveOptional(options.getRefreshToken());
    if (!refreshToken) {
      throw new Error("Session expired");
    }

    refreshPromise = options.refreshSession(refreshToken)
      .then(async (session) => {
        await options.onSessionRefreshed?.(session);
        return session;
      })
      .finally(() => {
        refreshPromise = null;
      });

    return refreshPromise;
  }

  options.client.interceptors.response.use(undefined, async (error: unknown) => {
    const axiosError = axios.isAxiosError(error) ? error : undefined;
    const originalRequest = axiosError?.config as RetryableAxiosRequestConfig | undefined;
    const isAuthLifecycleRequest = options.isAuthLifecycleRequest?.(originalRequest) ?? false;

    if (axiosError?.response?.status === 401 && originalRequest && !originalRequest._retry && !isAuthLifecycleRequest && options.refreshSession && options.getRefreshToken) {
      originalRequest._retry = true;

      try {
        const session = await ensureRefreshedSession();
        const nextHeaders = normalizeHeaders(originalRequest.headers);
        nextHeaders.set("Authorization", `Bearer ${session.token}`);
        originalRequest.headers = nextHeaders;
        return options.client.request(originalRequest);
      } catch (refreshError) {
        await options.onUnauthorized?.();
        return Promise.reject(refreshError);
      }
    }

    if (axiosError?.response?.status === 401) {
      await options.onUnauthorized?.();
    }

    return Promise.reject(error);
  });
}
