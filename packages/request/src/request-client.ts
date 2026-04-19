import axios from "axios";
import type { AxiosRequestConfig, AxiosResponse, InternalAxiosRequestConfig, AxiosHeaderValue } from "axios";

export type LocaleCode = "zh-CN" | "en-US";

export interface ApiEnvelope<T> {
  code?: number | string;
  message?: string;
  msg?: string;
  data?: T;
  result?: T;
  rows?: T;
}

export class PlatformApiClientError extends Error {
  status?: number;
  payload?: unknown;

  constructor(messageText: string, status?: number, payload?: unknown) {
    super(messageText);
    this.name = "PlatformApiClientError";
    this.status = status;
    this.payload = payload;
  }
}

export interface PlatformRequestOptions {
  successMessage?: string;
  errorMessage?: string;
  silent?: boolean;
  unwrap?: boolean;
}

export interface PlatformRequestClient {
  request<T>(config: AxiosRequestConfig, options?: PlatformRequestOptions): Promise<T>;
  get<T>(url: string, params?: Record<string, unknown>, options?: PlatformRequestOptions): Promise<T>;
  post<T>(url: string, payload?: unknown, options?: PlatformRequestOptions): Promise<T>;
  put<T>(url: string, payload?: unknown, options?: PlatformRequestOptions): Promise<T>;
  delete<T>(url: string, options?: PlatformRequestOptions): Promise<T>;
  upload<T>(url: string, formData: FormData, options?: PlatformRequestOptions): Promise<T>;
  raw: ReturnType<typeof axios.create>;
}

interface RequestFeedbackConfig extends AxiosRequestConfig {
  feedbackOptions?: Pick<PlatformRequestOptions, "errorMessage" | "silent">;
  headers?: Record<string, string>;
}

export interface CreatePlatformRequestClientOptions {
  baseURL: string;
  timeout?: number;
  withCredentials?: boolean;
  getLocale?: () => Promise<LocaleCode | null> | LocaleCode | null;
  onResolvedError?: (error: PlatformApiClientError, config?: AxiosRequestConfig) => void;
  onResolvedSuccess?: (messageText: string) => void;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

export function getRecord(value: unknown) {
  return isRecord(value) ? value : undefined;
}

export function getString(value: unknown) {
  return typeof value === "string" ? value : undefined;
}

export function getArray<T>(value: unknown): T[] {
  return Array.isArray(value) ? (value as T[]) : [];
}

function getEnvelopeMessage(payload: unknown) {
  const record = getRecord(payload);
  if (!record) {
    return undefined;
  }

  return getString(record.message) ?? getString(record.msg);
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

export function normalizePlatformApiError(error: unknown, fallbackMessage = "Request failed") {
  if (error instanceof PlatformApiClientError) {
    return error;
  }

  if (axios.isAxiosError(error)) {
    const payload = error.response?.data;
    const resolvedMessage = getEnvelopeMessage(payload) ?? error.message ?? fallbackMessage;
    return new PlatformApiClientError(resolvedMessage, error.response?.status, payload);
  }

  if (typeof error === "object" && error !== null && "message" in error && typeof error.message === "string") {
    return new PlatformApiClientError(error.message || fallbackMessage);
  }

  return new PlatformApiClientError(fallbackMessage);
}

async function resolveOptional<T>(value: Promise<T> | T) {
  return value;
}

function normalizeHeaders(headers?: InternalAxiosRequestConfig["headers"]) {
  if (!headers) {
    return axios.AxiosHeaders.from({});
  }

  const normalizedHeaders = new axios.AxiosHeaders(headers);
  const headerEntries = normalizedHeaders.toJSON(true) as Record<string, AxiosHeaderValue>;

  for (const [key, value] of Object.entries(headerEntries)) {
    if (value == null) {
      normalizedHeaders.delete(key);
    }
  }

  return normalizedHeaders;
}

export function createPlatformRequestClient(options: CreatePlatformRequestClientOptions): PlatformRequestClient {
  const raw = axios.create({
    baseURL: options.baseURL,
    timeout: options.timeout ?? 15000,
    withCredentials: options.withCredentials,
  });

  raw.interceptors.request.use(async (config: InternalAxiosRequestConfig) => {
    const locale = options.getLocale ? await resolveOptional(options.getLocale()) : null;
    const nextHeaders = normalizeHeaders(config.headers);

    if (locale && !nextHeaders.has("Accept-Language")) {
      nextHeaders.set("Accept-Language", locale);
    }

    config.headers = nextHeaders;
    return config;
  });

  raw.interceptors.response.use(
    (response: AxiosResponse) => {
      const envelopeCode = getEnvelopeCode(response.data);
      if (!isSuccessfulEnvelopeCode(envelopeCode)) {
        const apiError = new PlatformApiClientError(getEnvelopeMessage(response.data) ?? "Request failed", response.status, response.data);
        options.onResolvedError?.(apiError, response.config);
        return Promise.reject(apiError);
      }

      return response;
    },
    async (error: unknown) => {
      const axiosError = axios.isAxiosError(error) ? error : undefined;
      const originalRequest = axiosError?.config as RequestFeedbackConfig | undefined;
      const resolvedError = normalizePlatformApiError(error, originalRequest?.feedbackOptions?.errorMessage ?? "Request failed");
      options.onResolvedError?.(resolvedError, originalRequest);
      return Promise.reject(resolvedError);
    },
  );

  async function request<T>(config: AxiosRequestConfig, requestOptions: PlatformRequestOptions = {}) {
    try {
      const response = await raw.request({
        ...config,
        feedbackOptions: {
          silent: requestOptions.silent,
          errorMessage: requestOptions.errorMessage,
        },
      } as RequestFeedbackConfig);

      const payload = requestOptions.unwrap === false ? (response.data as T) : unwrapEnvelope<T>(response.data);
      if (requestOptions.successMessage) {
        options.onResolvedSuccess?.(requestOptions.successMessage);
      }
      return payload;
    } catch (error) {
      throw normalizePlatformApiError(error, requestOptions.errorMessage ?? "Request failed");
    }
  }

  return {
    request,
    get: (url, params, requestOptions) => request({ method: "GET", url, params }, requestOptions),
    post: (url, payload, requestOptions) => request({ method: "POST", url, data: payload }, requestOptions),
    put: (url, payload, requestOptions) => request({ method: "PUT", url, data: payload }, requestOptions),
    delete: (url, requestOptions) => request({ method: "DELETE", url }, requestOptions),
    upload: (url, formData, requestOptions) => request({ method: "POST", url, data: formData, headers: { "Content-Type": "multipart/form-data" } }, requestOptions),
    raw,
  };
}
