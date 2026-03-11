import type { AuthSession, UserProfile } from "@platform/core";
import { shellEnv } from "../config/env";
import { apiClient, getArray, getRecord, getString, unwrapEnvelope } from "./client";

interface LoginPayload {
  username: string;
  password: string;
  captcha?: string;
  captchaKey?: string;
}

function toUserProfile(candidate: unknown): UserProfile {
  const record = getRecord(candidate) ?? {};
  return {
    userId: getString(record.userId) ?? getString(record.id) ?? "demo-user",
    username: getString(record.username) ?? getString(record.nickname) ?? getString(record.nickName) ?? "Demo User",
    avatar: getString(record.avatar),
    roles: getArray<string>(record.roles ?? record.roleCodeList),
  };
}

function normalizeTokenPayload(payload: unknown) {
  const data = unwrapEnvelope<Record<string, unknown>>(payload);
  return {
    token: getString(data.token) ?? getString(data.accessToken) ?? "",
    refreshToken: getString(data.refreshToken),
    accessTokenExpiresIn:
      typeof data.accessTokenExpiresIn === "number" ? data.accessTokenExpiresIn : undefined,
    refreshTokenExpiresIn:
      typeof data.refreshTokenExpiresIn === "number" ? data.refreshTokenExpiresIn : undefined,
  };
}

export function normalizeCurrentUser(payload: unknown) {
  const data = unwrapEnvelope<Record<string, unknown>>(payload);
  return {
    user: toUserProfile(data),
    permissions: getArray<string>(data.permissions ?? data.permissionCodeList),
  };
}

function createAuthHeaders(token?: string) {
  return token ? { Authorization: `Bearer ${token}` } : undefined;
}

export async function fetchCurrentUser(token?: string) {
  const response = await apiClient.get(shellEnv.currentUserPath, {
    headers: createAuthHeaders(token),
  });
  return normalizeCurrentUser(response.data);
}

function normalizeSession(payload: unknown, currentUser: Awaited<ReturnType<typeof fetchCurrentUser>>): AuthSession {
  const { token, refreshToken, accessTokenExpiresIn, refreshTokenExpiresIn } = normalizeTokenPayload(payload);

  return {
    token,
    refreshToken,
    accessTokenExpiresIn,
    refreshTokenExpiresIn,
    user: currentUser.user,
    permissions: currentUser.permissions,
  };
}

export async function loginWithPassword(payload: LoginPayload) {
  if (shellEnv.useMockAuth) {
    return {
      token: "mock-token",
      refreshToken: "mock-refresh-token",
      accessTokenExpiresIn: 3600,
      refreshTokenExpiresIn: 604800,
      user: {
        userId: "u001",
        username: payload.username || "demo",
        avatar: undefined,
        roles: ["admin"],
      },
      permissions: [
        "crm:customer:list",
        "crm:customer:create",
        "crm:customer:edit",
        "crm:customer:export",
        "platform:org:create",
        "platform:org:edit",
        "platform:org:delete",
        "platform:org-permission:create",
        "platform:org-permission:edit",
        "platform:org-permission:delete",
        "platform:menu-permission:create",
        "platform:menu-permission:edit",
        "platform:menu-permission:delete",
        "platform:button:create",
        "platform:button:edit",
        "platform:button:delete",
        "platform:button-permission:create",
        "platform:button-permission:edit",
        "platform:button-permission:delete",
      ],
    } satisfies AuthSession;
  }

  const response = await apiClient.post(shellEnv.loginPath, payload);
  const tokenPayload = normalizeTokenPayload(response.data);
  const currentUser = await fetchCurrentUser(tokenPayload.token);
  return normalizeSession(response.data, currentUser);
}

export async function refreshSession(refreshToken: string) {
  const response = await apiClient.post(shellEnv.refreshPath, { refreshToken });
  const tokenPayload = normalizeTokenPayload(response.data);
  const currentUser = await fetchCurrentUser(tokenPayload.token);
  return normalizeSession(response.data, currentUser);
}

export async function logoutSession() {
  await apiClient.post(shellEnv.logoutPath);
}
