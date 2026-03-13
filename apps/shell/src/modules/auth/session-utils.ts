import type { AuthSession } from "@platform/core";

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

export function normalizeSessionExpiry(session: AuthSession): AuthSession {
  return {
    ...session,
    accessTokenExpiresIn: normalizeExpiryTimestamp(session.accessTokenExpiresIn),
    refreshTokenExpiresIn: normalizeExpiryTimestamp(session.refreshTokenExpiresIn),
  };
}

export function shouldRefreshSession(session: AuthSession, skewMs = 60_000) {
  if (!session.refreshToken) {
    return false;
  }

  if (!session.accessTokenExpiresIn) {
    return false;
  }

  return session.accessTokenExpiresIn <= Date.now() + skewMs;
}

export function resolveRefreshDelay(expiresAt?: number) {
  if (!expiresAt) {
    return undefined;
  }

  return Math.max(expiresAt - Date.now() - 60_000, 15_000);
}
