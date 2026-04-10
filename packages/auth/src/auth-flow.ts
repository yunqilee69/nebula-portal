import { buildSessionFromPayload, mergeSessionWithCurrentUser, normalizeTokenPayload } from "./session-payload";
import type { AuthSession } from "./session-utils";
import type { CurrentUserSessionPayload } from "./session-payload";
import { isSessionExpired, shouldRefreshSession } from "./session-utils";

export function createAuthHeaders(token?: string) {
  return token ? { Authorization: `Bearer ${token}` } : undefined;
}

export async function resolveSessionFromTokenPayload(
  payload: unknown,
  fetchCurrentUser: (token: string) => Promise<CurrentUserSessionPayload>,
) {
  const tokenPayload = normalizeTokenPayload(payload);
  const currentUser = await fetchCurrentUser(tokenPayload.token);
  return buildSessionFromPayload(payload, currentUser);
}

export interface RestoreSessionOptions {
  storedSession: AuthSession | null;
  fetchCurrentUser: (token: string) => Promise<CurrentUserSessionPayload>;
  refreshSession: (refreshToken: string) => Promise<AuthSession>;
}

export async function restoreSessionOnStartup(options: RestoreSessionOptions): Promise<AuthSession | null> {
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
