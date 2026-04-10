import axios from "axios";
export class PlatformApiClientError extends Error {
    status;
    payload;
    constructor(messageText, status, payload) {
        super(messageText);
        this.name = "PlatformApiClientError";
        this.status = status;
        this.payload = payload;
    }
}
function isRecord(value) {
    return typeof value === "object" && value !== null;
}
export function getRecord(value) {
    return isRecord(value) ? value : undefined;
}
export function getString(value) {
    return typeof value === "string" ? value : undefined;
}
export function getArray(value) {
    return Array.isArray(value) ? value : [];
}
function getEnvelopeMessage(payload) {
    const record = getRecord(payload);
    if (!record) {
        return undefined;
    }
    return getString(record.message) ?? getString(record.msg);
}
function getEnvelopeCode(payload) {
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
function isSuccessfulEnvelopeCode(code) {
    if (code === undefined) {
        return true;
    }
    if (typeof code === "number") {
        return code === 0;
    }
    return code.trim() === "0";
}
export function unwrapEnvelope(payload) {
    if (!isRecord(payload)) {
        return payload;
    }
    const envelope = payload;
    if (envelope.data !== undefined) {
        return envelope.data;
    }
    if (envelope.result !== undefined) {
        return envelope.result;
    }
    if (envelope.rows !== undefined) {
        return envelope.rows;
    }
    return payload;
}
export function normalizePlatformApiError(error, fallbackMessage = "Request failed") {
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
async function resolveOptional(value) {
    return value;
}
export function createPlatformRequestClient(options) {
    const raw = axios.create({
        baseURL: options.baseURL,
        timeout: options.timeout ?? 15000,
        withCredentials: options.withCredentials,
    });
    raw.interceptors.request.use(async (config) => {
        const locale = options.getLocale ? await resolveOptional(options.getLocale()) : null;
        const nextHeaders = {
            ...(config.headers ? Object.fromEntries(Object.entries(config.headers).map(([key, value]) => [key, String(value)])) : {}),
        };
        if (locale && !nextHeaders["Accept-Language"]) {
            nextHeaders["Accept-Language"] = locale;
        }
        config.headers = axios.AxiosHeaders.from(nextHeaders);
        return config;
    });
    raw.interceptors.response.use((response) => {
        const envelopeCode = getEnvelopeCode(response.data);
        if (!isSuccessfulEnvelopeCode(envelopeCode)) {
            const apiError = new PlatformApiClientError(getEnvelopeMessage(response.data) ?? "Request failed", response.status, response.data);
            options.onResolvedError?.(apiError, response.config);
            return Promise.reject(apiError);
        }
        return response;
    }, async (error) => {
        const axiosError = axios.isAxiosError(error) ? error : undefined;
        const originalRequest = axiosError?.config;
        const resolvedError = normalizePlatformApiError(error, originalRequest?.feedbackOptions?.errorMessage ?? "Request failed");
        options.onResolvedError?.(resolvedError, originalRequest);
        return Promise.reject(resolvedError);
    });
    async function request(config, requestOptions = {}) {
        try {
            const response = await raw.request({
                ...config,
                feedbackOptions: {
                    silent: requestOptions.silent,
                    errorMessage: requestOptions.errorMessage,
                },
            });
            const payload = requestOptions.unwrap === false ? response.data : unwrapEnvelope(response.data);
            if (requestOptions.successMessage) {
                options.onResolvedSuccess?.(requestOptions.successMessage);
            }
            return payload;
        }
        catch (error) {
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
