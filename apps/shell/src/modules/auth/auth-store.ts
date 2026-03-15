import { create } from "zustand";
import type { AuthSession } from "@platform/core";
import { hasPermissionCode } from "@platform/core";
import { normalizeSessionExpiry, normalizeSessionExpiryFields } from "./session-utils";

const STORAGE_KEY = "nebula-shell-session";
const ACCESS_TOKEN_COOKIE_KEY = "nebula_access_token";
const REFRESH_TOKEN_COOKIE_KEY = "nebula_refresh_token";

type PersistedSession = Pick<AuthSession, "token" | "refreshToken" | "accessTokenExpiresIn" | "refreshTokenExpiresIn">;

const EMPTY_USER = {
  userId: "",
  username: "",
  roles: [],
};

function buildCookie(name: string, value: string, expiresAt?: number) {
  const encoded = encodeURIComponent(value);
  const expires = typeof expiresAt === "number" && Number.isFinite(expiresAt)
    ? `; expires=${new Date(expiresAt).toUTCString()}`
    : "";
  return `${name}=${encoded}; path=/; SameSite=Lax${expires}`;
}

function clearCookie(name: string) {
  document.cookie = `${name}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax`;
}

function syncSessionCookies(session: AuthSession | null) {
  if (!session) {
    clearCookie(ACCESS_TOKEN_COOKIE_KEY);
    clearCookie(REFRESH_TOKEN_COOKIE_KEY);
    return;
  }

  document.cookie = buildCookie(ACCESS_TOKEN_COOKIE_KEY, session.token, session.accessTokenExpiresIn);
  if (session.refreshToken) {
    document.cookie = buildCookie(
      REFRESH_TOKEN_COOKIE_KEY,
      session.refreshToken,
      session.refreshTokenExpiresIn,
    );
  } else {
    clearCookie(REFRESH_TOKEN_COOKIE_KEY);
  }
}

function normalizeSession(session: AuthSession | null) {
  return session ? normalizeSessionExpiry(session) : null;
}

function toPersistedSession(session: AuthSession): PersistedSession {
  return normalizeSessionExpiryFields({
    token: session.token,
    refreshToken: session.refreshToken,
    accessTokenExpiresIn: session.accessTokenExpiresIn,
    refreshTokenExpiresIn: session.refreshTokenExpiresIn,
  });
}

function fromPersistedSession(session: PersistedSession): AuthSession {
  const normalized = normalizeSessionExpiryFields(session);
  return {
    ...normalized,
    user: EMPTY_USER,
    permissions: [],
    menuList: undefined,
  };
}

interface AuthState {
  session: AuthSession | null;
  hydrated: boolean;
  setSession: (session: AuthSession) => void;
  patchSession: (patch: Partial<AuthSession>) => void;
  clearSession: () => void;
  hydrate: () => void;
}

function isPersistedSession(value: unknown): value is PersistedSession {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const candidate = value as Record<string, unknown>;
  return typeof candidate.token === "string" && candidate.token.length > 0;
}

function readStoredSession() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    return null;
  }
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!isPersistedSession(parsed)) {
      localStorage.removeItem(STORAGE_KEY);
      return null;
    }
    return normalizeSessionExpiryFields(parsed);
  } catch {
    localStorage.removeItem(STORAGE_KEY);
    return null;
  }
}

export const useAuthStore = create<AuthState>((set) => ({
  session: null,
  hydrated: false,
  setSession: (session) => {
    const normalizedSession = normalizeSessionExpiry(session);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(toPersistedSession(normalizedSession)));
    syncSessionCookies(normalizedSession);
    set({ session: normalizedSession, hydrated: true });
  },
  patchSession: (patch) => {
    const current = useAuthStore.getState().session;
    if (!current) {
      return;
    }
    const next = normalizeSessionExpiry({ ...current, ...patch });
    localStorage.setItem(STORAGE_KEY, JSON.stringify(toPersistedSession(next)));
    syncSessionCookies(next);
    set({ session: next, hydrated: true });
  },
  clearSession: () => {
    localStorage.removeItem(STORAGE_KEY);
    syncSessionCookies(null);
    set({ session: null, hydrated: true });
  },
  hydrate: () => {
    const storedSession = readStoredSession();
    const session = storedSession ? fromPersistedSession(storedSession) : null;
    if (session) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(toPersistedSession(session)));
    }
    syncSessionCookies(session);
    set({ session, hydrated: true });
  },
}));

export function getToken() {
  return useAuthStore.getState().session?.token ?? null;
}

export function hasPermission(code: string) {
  const session = useAuthStore.getState().session;
  return session ? hasPermissionCode(session.permissions, code) : false;
}
