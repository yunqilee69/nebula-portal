export interface UserProfile {
    userId: string;
    username: string;
    avatar?: string;
    roles: string[];
}
export interface AuthMenuItem {
    id: string;
    name: string;
    path?: string;
    children?: AuthMenuItem[];
}
export interface AuthSession {
    token: string;
    refreshToken?: string;
    accessTokenExpiresIn?: number;
    refreshTokenExpiresIn?: number;
    user: UserProfile;
    permissions: string[];
    menuList?: AuthMenuItem[];
}
interface SessionExpiryFields {
    accessTokenExpiresIn?: number;
    refreshTokenExpiresIn?: number;
}
export declare function normalizeSessionExpiryFields<T extends SessionExpiryFields>(session: T): T;
export declare function normalizeSessionExpiry(session: AuthSession): AuthSession;
export declare function shouldRefreshSession(session: AuthSession, skewMs?: number): boolean;
export declare function isSessionExpired(expiresAt?: number, skewMs?: number): boolean;
export declare function resolveRefreshDelay(expiresAt?: number): number | undefined;
export {};
//# sourceMappingURL=session-utils.d.ts.map