import type { AuthSession } from "../types";
import { hasSessionToken, normalizeSessionExpiry, normalizeSessionExpiryFields, parseStoredSession, stringifyStoredSession } from "./session-helpers";
import type { StorageAdapter } from "../storage";

const DEFAULT_SESSION_STORAGE_KEY = "nebula-mobile-session";

type PersistedSession = Pick<AuthSession, "token" | "refreshToken" | "accessTokenExpiresIn" | "refreshTokenExpiresIn" | "user" | "permissions" | "menuList">;

function isPersistedSession(value: unknown): value is PersistedSession {
  if (!hasSessionToken(value)) {
    return false;
  }

  const candidate = value;
  return true;
}

function serializeSession(session: AuthSession): PersistedSession {
  const normalized = normalizeSessionExpiry(session);
  return {
    token: normalized.token,
    refreshToken: normalized.refreshToken,
    accessTokenExpiresIn: normalized.accessTokenExpiresIn,
    refreshTokenExpiresIn: normalized.refreshTokenExpiresIn,
    user: normalized.user,
    permissions: normalized.permissions,
    menuList: normalized.menuList,
  };
}

function deserializeSession(value: unknown): AuthSession | null {
  if (!isPersistedSession(value)) {
    return null;
  }

  return normalizeSessionExpiryFields({
    token: value.token,
    refreshToken: value.refreshToken,
    accessTokenExpiresIn: value.accessTokenExpiresIn,
    refreshTokenExpiresIn: value.refreshTokenExpiresIn,
    user: value.user,
    permissions: Array.isArray(value.permissions) ? value.permissions.filter((item): item is string => typeof item === "string") : [],
    menuList: value.menuList,
  });
}

/**
 * Create a session storage instance that uses the provided StorageAdapter.
 * This enables session persistence in both web (localStorage) and React Native (AsyncStorage).
 */
export function createMobileSessionStorage(driver: StorageAdapter, storageKey = DEFAULT_SESSION_STORAGE_KEY) {
  return {
    async read() {
      const raw = await driver.get(storageKey);
      if (!raw) {
        return null;
      }

      const session = parseStoredSession(raw, deserializeSession);
      if (!session) {
        await driver.remove(storageKey);
        return null;
      }

      return session;
    },
    async write(session: AuthSession) {
      await driver.set(storageKey, stringifyStoredSession(serializeSession(session)));
    },
    async clear() {
      await driver.remove(storageKey);
    },
  };
}
