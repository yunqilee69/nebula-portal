import { create } from "zustand";
import type { AuthSession } from "@platform/core";
import { hasPermissionCode } from "@platform/core";
import { normalizeSessionExpiry } from "./session-utils";

const STORAGE_KEY = "nebula-shell-session";
const ACCESS_TOKEN_COOKIE_KEY = "nebula_access_token";
const REFRESH_TOKEN_COOKIE_KEY = "nebula_refresh_token";

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

interface AuthState {
  session: AuthSession | null;
  hydrated: boolean;
  setSession: (session: AuthSession) => void;
  patchSession: (patch: Partial<AuthSession>) => void;
  clearSession: () => void;
  hydrate: () => void;
}

function readStoredSession() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    return null;
  }
  try {
    return JSON.parse(raw) as AuthSession;
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
    localStorage.setItem(STORAGE_KEY, JSON.stringify(normalizedSession));
    syncSessionCookies(normalizedSession);
    set({ session: normalizedSession, hydrated: true });
  },
  patchSession: (patch) => {
    const current = useAuthStore.getState().session;
    if (!current) {
      return;
    }
    const next = normalizeSessionExpiry({ ...current, ...patch });
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    syncSessionCookies(next);
    set({ session: next, hydrated: true });
  },
  clearSession: () => {
    localStorage.removeItem(STORAGE_KEY);
    syncSessionCookies(null);
    set({ session: null, hydrated: true });
  },
  hydrate: () => {
    const session = normalizeSession(readStoredSession());
    if (session) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
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
