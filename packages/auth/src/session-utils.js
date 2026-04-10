function normalizeExpiryTimestamp(expiresAt) {
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
export function normalizeSessionExpiryFields(session) {
    return {
        ...session,
        accessTokenExpiresIn: normalizeExpiryTimestamp(session.accessTokenExpiresIn),
        refreshTokenExpiresIn: normalizeExpiryTimestamp(session.refreshTokenExpiresIn),
    };
}
export function normalizeSessionExpiry(session) {
    return normalizeSessionExpiryFields(session);
}
export function shouldRefreshSession(session, skewMs = 60_000) {
    if (!session.refreshToken || !session.accessTokenExpiresIn) {
        return false;
    }
    return session.accessTokenExpiresIn <= Date.now() + skewMs;
}
export function isSessionExpired(expiresAt, skewMs = 0) {
    if (!expiresAt) {
        return false;
    }
    return expiresAt <= Date.now() + skewMs;
}
export function resolveRefreshDelay(expiresAt) {
    if (!expiresAt) {
        return undefined;
    }
    return Math.max(expiresAt - Date.now() - 60_000, 15_000);
}
