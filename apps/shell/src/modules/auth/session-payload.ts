import type { AuthSession, UserProfile } from "@platform/core";
import { getArray, getRecord, getString, unwrapEnvelope } from "../../api/client";
import { normalizeSessionExpiry } from "./session-utils";

export function toUserProfile(candidate: unknown): UserProfile {
  const record = getRecord(candidate) ?? {};
  return {
    userId: getString(record.userId) ?? getString(record.id) ?? "demo-user",
    username: getString(record.username) ?? getString(record.nickname) ?? getString(record.nickName) ?? "Demo User",
    avatar: getString(record.avatar),
    roles: getArray<string>(record.roles ?? record.roleCodeList),
  };
}

export function normalizeTokenPayload(payload: unknown) {
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

export function buildSessionFromPayload(
  payload: unknown,
  currentUser: ReturnType<typeof normalizeCurrentUser>,
): AuthSession {
  const { token, refreshToken, accessTokenExpiresIn, refreshTokenExpiresIn } = normalizeTokenPayload(payload);

  return normalizeSessionExpiry({
    token,
    refreshToken,
    accessTokenExpiresIn,
    refreshTokenExpiresIn,
    user: currentUser.user,
    permissions: currentUser.permissions,
  });
}
