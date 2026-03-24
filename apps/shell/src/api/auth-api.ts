import { shellEnv } from "../config/env";
import { createAuthHeaders, resolveSessionFromTokenPayload } from "@nebula/auth";
import { apiClient } from "./client";
import { normalizeCurrentUser } from "../modules/auth/session-payload";

interface LoginPayload {
  username: string;
  password: string;
  captcha?: string;
  captchaKey?: string;
}

export async function fetchCurrentUser(token?: string) {
  const response = await apiClient.get(shellEnv.currentUserPath, {
    headers: createAuthHeaders(token),
  });
  return normalizeCurrentUser(response.data);
}

export async function loginWithPassword(payload: LoginPayload) {
  const response = await apiClient.post(shellEnv.loginPath, payload);
  return resolveSessionFromTokenPayload(response.data, fetchCurrentUser);
}

export async function refreshSession(refreshToken: string) {
  const response = await apiClient.post(shellEnv.refreshPath, { refreshToken });
  return resolveSessionFromTokenPayload(response.data, fetchCurrentUser);
}

export async function logoutSession() {
  await apiClient.post(shellEnv.logoutPath);
}
