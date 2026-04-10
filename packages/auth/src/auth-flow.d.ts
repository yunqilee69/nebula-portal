import type { AuthSession } from "./session-utils";
import type { CurrentUserSessionPayload } from "./session-payload";
export declare function createAuthHeaders(token?: string): {
    Authorization: string;
} | undefined;
export declare function resolveSessionFromTokenPayload(payload: unknown, fetchCurrentUser: (token: string) => Promise<CurrentUserSessionPayload>): Promise<AuthSession>;
export interface RestoreSessionOptions {
    storedSession: AuthSession | null;
    fetchCurrentUser: (token: string) => Promise<CurrentUserSessionPayload>;
    refreshSession: (refreshToken: string) => Promise<AuthSession>;
}
export declare function restoreSessionOnStartup(options: RestoreSessionOptions): Promise<AuthSession | null>;
//# sourceMappingURL=auth-flow.d.ts.map