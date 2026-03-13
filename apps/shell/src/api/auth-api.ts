import { shellEnv } from "../config/env";
import { apiClient } from "./client";
import { buildSessionFromPayload, normalizeCurrentUser, normalizeTokenPayload } from "../modules/auth/session-payload";

interface LoginPayload {
  username: string;
  password: string;
  captcha?: string;
  captchaKey?: string;
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

export async function loginWithPassword(payload: LoginPayload) {
  const response = await apiClient.post(shellEnv.loginPath, payload);
  const currentUser = await fetchCurrentUser(normalizeTokenPayload(response.data).token);
  return buildSessionFromPayload(response.data, currentUser);
}

export async function refreshSession(refreshToken: string) {
  const response = await apiClient.post(shellEnv.refreshPath, { refreshToken });
  const currentUser = await fetchCurrentUser(normalizeTokenPayload(response.data).token);
  return buildSessionFromPayload(response.data, currentUser);
}

export async function logoutSession() {
  await apiClient.post(shellEnv.logoutPath);
}
