import { webEnv } from "../config/env";
import { createAuthHeaders, normalizeCurrentUser, resolveSessionFromTokenPayload } from "@nebula/auth";
import { apiClient, unwrapEnvelope } from "./client";
import { normalizeMenus } from "./menu-api";

interface LoginPayload {
  username: string;
  password: string;
  captcha?: string;
  captchaKey?: string;
}

export async function fetchCurrentUser(token?: string) {
  const response = await apiClient.get(webEnv.currentUserPath, {
    headers: createAuthHeaders(token),
  });
  return normalizeCurrentUser(unwrapEnvelope<Record<string, unknown>>(response.data), {
    normalizeMenuList: normalizeMenus,
  });
}

export async function loginWithPassword(payload: LoginPayload) {
  const response = await apiClient.post(webEnv.loginPath, payload);
  return resolveSessionFromTokenPayload(response.data, fetchCurrentUser);
}

export async function refreshSession(refreshToken: string) {
  const response = await apiClient.post(webEnv.refreshPath, { refreshToken });
  return resolveSessionFromTokenPayload(response.data, fetchCurrentUser);
}

export async function logoutSession() {
  await apiClient.post(webEnv.logoutPath);
}
