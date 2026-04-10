import axios from "axios";
import type { AxiosRequestConfig } from "axios";
export type LocaleCode = "zh-CN" | "en-US";
export interface ApiEnvelope<T> {
    code?: number | string;
    message?: string;
    msg?: string;
    data?: T;
    result?: T;
    rows?: T;
}
export declare class PlatformApiClientError extends Error {
    status?: number;
    payload?: unknown;
    constructor(messageText: string, status?: number, payload?: unknown);
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
export interface CreatePlatformRequestClientOptions {
    baseURL: string;
    timeout?: number;
    withCredentials?: boolean;
    getLocale?: () => Promise<LocaleCode | null> | LocaleCode | null;
    onResolvedError?: (error: PlatformApiClientError, config?: AxiosRequestConfig) => void;
    onResolvedSuccess?: (messageText: string) => void;
}
export declare function getRecord(value: unknown): Record<string, unknown> | undefined;
export declare function getString(value: unknown): string | undefined;
export declare function getArray<T>(value: unknown): T[];
export declare function unwrapEnvelope<T>(payload: unknown): T;
export declare function normalizePlatformApiError(error: unknown, fallbackMessage?: string): PlatformApiClientError;
export declare function createPlatformRequestClient(options: CreatePlatformRequestClientOptions): PlatformRequestClient;
//# sourceMappingURL=request-client.d.ts.map