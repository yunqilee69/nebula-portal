import { hasSessionToken, parseStoredSession, stringifyStoredSession } from "@nebula/auth";
import type { AuthSession } from "@platform/core";
import type { KeyValueStorageDriver } from "./types";
import { normalizeMobileSessionExpiry, normalizeMobileSessionExpiryFields } from "./mobile-session-utils";

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
  const normalized = normalizeMobileSessionExpiry(session);
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

  return normalizeMobileSessionExpiryFields({
    token: value.token,
    refreshToken: value.refreshToken,
    accessTokenExpiresIn: value.accessTokenExpiresIn,
    refreshTokenExpiresIn: value.refreshTokenExpiresIn,
    user: value.user,
    permissions: Array.isArray(value.permissions) ? value.permissions.filter((item): item is string => typeof item === "string") : [],
    menuList: value.menuList,
  });
}

export function createMobileSessionStorage(driver: KeyValueStorageDriver, storageKey = DEFAULT_SESSION_STORAGE_KEY) {
  return {
    async read() {
      const raw = await driver.getItem(storageKey);
      if (!raw) {
        return null;
      }

      const session = parseStoredSession(raw, deserializeSession);
      if (!session) {
        await driver.removeItem(storageKey);
        return null;
      }

      return session;
    },
    async write(session: AuthSession) {
      await driver.setItem(storageKey, stringifyStoredSession(serializeSession(session)));
    },
    async clear() {
      await driver.removeItem(storageKey);
    },
  };
}
