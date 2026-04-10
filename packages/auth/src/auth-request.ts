import axios from "axios";
import type { AxiosInstance, AxiosRequestConfig } from "axios";
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

async function resolveOptional<T>(value: Promise<T> | T) {
  return value;
}

export function attachAuthToRequestClient(options: AttachAuthRequestOptions) {
  let refreshPromise: Promise<AuthSession> | null = null;

  options.client.interceptors.request.use(async (config) => {
    const token = options.getAccessToken ? await resolveOptional(options.getAccessToken()) : null;
    const nextHeaders: Record<string, string> = {
      ...(config.headers ? Object.fromEntries(Object.entries(config.headers).map(([key, value]) => [key, String(value)])) : {}),
    };

    const shouldAttachAuthorization = token && !nextHeaders.Authorization && (options.shouldAttachAuthorization?.(config) ?? true);
    if (shouldAttachAuthorization) {
      nextHeaders.Authorization = `Bearer ${token}`;
    }

    config.headers = axios.AxiosHeaders.from(nextHeaders);
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
        originalRequest.headers = {
          ...(originalRequest.headers ? Object.fromEntries(Object.entries(originalRequest.headers).map(([key, value]) => [key, String(value)])) : {}),
          Authorization: `Bearer ${session.token}`,
        };
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
