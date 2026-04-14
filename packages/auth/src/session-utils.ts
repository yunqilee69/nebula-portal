export interface UserProfile {
  userId: string;
  username: string;
  avatar?: string;
  roles: string[];
}

export interface AuthMenuItem {
  id: string | number;
  parentId?: string | number;
  name: string;
  sort?: number;
  status?: 0 | 1;
  type?: 1 | 2 | 3;
  path?: string;
  component?: string;
  linkType?: 1 | 2 | 3;
  linkUrl?: string;
  icon?: string;
  visible?: 0 | 1;
  permission?: string;
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

export function normalizeSessionExpiryFields<T extends SessionExpiryFields>(session: T): T {
  return {
    ...session,
    accessTokenExpiresIn: normalizeExpiryTimestamp(session.accessTokenExpiresIn),
    refreshTokenExpiresIn: normalizeExpiryTimestamp(session.refreshTokenExpiresIn),
  };
}

export function normalizeSessionExpiry(session: AuthSession): AuthSession {
  return normalizeSessionExpiryFields(session);
}

export function shouldRefreshSession(session: AuthSession, skewMs = 60_000) {
  if (!session.refreshToken || !session.accessTokenExpiresIn) {
    return false;
  }

  return session.accessTokenExpiresIn <= Date.now() + skewMs;
}

export function isSessionExpired(expiresAt?: number, skewMs = 0) {
  if (!expiresAt) {
    return false;
  }

  return expiresAt <= Date.now() + skewMs;
}

export function resolveRefreshDelay(expiresAt?: number) {
  if (!expiresAt) {
    return undefined;
  }

  return Math.max(expiresAt - Date.now() - 60_000, 15_000);
}
