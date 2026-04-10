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
export declare function attachAuthToRequestClient(options: AttachAuthRequestOptions): void;
//# sourceMappingURL=auth-request.d.ts.map