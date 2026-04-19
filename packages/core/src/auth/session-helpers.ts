import type { AxiosHeaders, AxiosInstance, AxiosRequestConfig, AxiosHeaderValue, InternalAxiosRequestConfig } from "axios";
import axios from "axios";
import type { AuthSession } from "../types";

interface SessionExpiryFields {
  accessTokenExpiresIn?: number;
  refreshTokenExpiresIn?: number;
}

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

function normalizeExpiryTimestamp(expiresAt?: number) {
  if (typeof expiresAt !== "number" || !Number.isFinite(expiresAt) || expiresAt <= 0) {
    return undefined;
  }

  if (expiresAt > 1_000_000_000_000) {
    return expiresAt;
  }

  if (expiresAt > 1_000_000_000) {
    return expiresAt * 1000;
  }

  return Date.now() + expiresAt * 1000;
}

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

export function hasSessionToken(value: unknown): value is { token: string } {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const candidate = value as Record<string, unknown>;
  return typeof candidate.token === "string" && candidate.token.length > 0;
}

export function parseStoredSession<T>(raw: string | null, deserialize: (value: unknown) => T | null): T | null {
  if (!raw) {
    return null;
  }

  try {
    return deserialize(JSON.parse(raw));
  } catch {
    return null;
  }
}

export function stringifyStoredSession<T>(session: T) {
  return JSON.stringify(session);
}

export function normalizeSessionExpiryFields<T extends SessionExpiryFields>(session: T): T {
  return {
    ...session,
    accessTokenExpiresIn: normalizeExpiryTimestamp(session.accessTokenExpiresIn),
    refreshTokenExpiresIn: normalizeExpiryTimestamp(session.refreshTokenExpiresIn),
  };
}

export function normalizeSessionExpiry(session: AuthSession): AuthSession {
  return normalizeSessionExpiryFields(session);
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
