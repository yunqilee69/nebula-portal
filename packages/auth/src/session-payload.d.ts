import type { AuthSession, UserProfile } from "./session-utils";
export interface CurrentUserSessionPayload {
    user: UserProfile;
    permissions: string[];
    menuList: AuthSession["menuList"];
}
export declare function toUserProfile(candidate: unknown): UserProfile;
export declare function normalizeTokenPayload(payload: unknown): {
    token: string;
    refreshToken: string | undefined;
    accessTokenExpiresIn: number | undefined;
    refreshTokenExpiresIn: number | undefined;
};
interface NormalizeCurrentUserOptions {
    normalizeMenuList?: (payload: unknown) => AuthSession["menuList"];
}
export declare function normalizeCurrentUser(payload: unknown, options?: NormalizeCurrentUserOptions): CurrentUserSessionPayload;
export declare function buildSessionFromPayload(payload: unknown, currentUser: CurrentUserSessionPayload): AuthSession;
export declare function mergeSessionWithCurrentUser(session: Pick<AuthSession, "token" | "refreshToken" | "accessTokenExpiresIn" | "refreshTokenExpiresIn">, currentUser: CurrentUserSessionPayload): AuthSession;
export {};
//# sourceMappingURL=session-payload.d.ts.map