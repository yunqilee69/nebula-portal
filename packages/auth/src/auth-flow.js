import { buildSessionFromPayload, mergeSessionWithCurrentUser, normalizeTokenPayload } from "./session-payload";
import { isSessionExpired, shouldRefreshSession } from "./session-utils";
export function createAuthHeaders(token) {
    return token ? { Authorization: `Bearer ${token}` } : undefined;
}
export async function resolveSessionFromTokenPayload(payload, fetchCurrentUser) {
    const tokenPayload = normalizeTokenPayload(payload);
    const currentUser = await fetchCurrentUser(tokenPayload.token);
    return buildSessionFromPayload(payload, currentUser);
}
export async function restoreSessionOnStartup(options) {
    const { storedSession } = options;
    if (!storedSession?.token) {
        return null;
    }
    if (!storedSession.refreshToken && isSessionExpired(storedSession.accessTokenExpiresIn)) {
        return null;
    }
    if (storedSession.refreshToken && isSessionExpired(storedSession.refreshTokenExpiresIn)) {
        return null;
    }
    if (!shouldRefreshSession(storedSession) || !storedSession.refreshToken) {
        const currentUser = await options.fetchCurrentUser(storedSession.token);
        return mergeSessionWithCurrentUser(storedSession, currentUser);
    }
    return options.refreshSession(storedSession.refreshToken);
}
