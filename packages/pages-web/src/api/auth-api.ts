import { webEnv } from "../config/env";
import { createAuthHeaders, normalizeCurrentUser, resolveSessionFromTokenPayload } from "@nebula/auth";
import { getString } from "@nebula/request";
import { apiClient, unwrapEnvelope } from "./client";
import { normalizeMenus } from "./menu-api";

interface LoginPayload {
  username: string;
  password: string;
  captcha?: string;
  captchaKey?: string;
}

export interface WechatWebRedirectPrepareResult {
  authorizeUrl: string;
  state: string;
}

export interface WechatWebQrCodeResult {
  loginId: string;
  qrCodeUrl: string;
  expiresInSeconds?: number;
}

export interface WechatWebStatusResult {
  loginId: string;
  status: "WAITING" | "SCANNED" | "SUCCESS" | "EXPIRED";
  loginResult: Record<string, unknown> | null;
  redirectAfterLogin?: string;
}

function getOptionalNumber(candidate: unknown) {
  return typeof candidate === "number" && Number.isFinite(candidate) ? candidate : undefined;
}

function normalizeWechatWebRedirectPrepareResult(payload: unknown): WechatWebRedirectPrepareResult {
  const data = unwrapEnvelope<Record<string, unknown>>(payload);
  return {
    authorizeUrl: getString(data.authorizeUrl) ?? "",
    state: getString(data.state) ?? "",
  };
}

function normalizeWechatWebQrCodeResult(payload: unknown): WechatWebQrCodeResult {
  const data = unwrapEnvelope<Record<string, unknown>>(payload);
  return {
    loginId: getString(data.loginId) ?? "",
    qrCodeUrl: getString(data.qrCodeUrl) ?? "",
    expiresInSeconds: getOptionalNumber(data.expiresInSeconds),
  };
}

function normalizeWechatWebStatusResult(payload: unknown): WechatWebStatusResult {
  const data = unwrapEnvelope<Record<string, unknown>>(payload);
  const status = getString(data.status);
  return {
    loginId: getString(data.loginId) ?? "",
    status: status === "SCANNED" || status === "SUCCESS" || status === "EXPIRED" ? status : "WAITING",
    loginResult:
      data.loginResult && typeof data.loginResult === "object" && !Array.isArray(data.loginResult)
        ? (data.loginResult as Record<string, unknown>)
        : null,
    redirectAfterLogin: getString(data.redirectAfterLogin),
  };
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

export async function prepareWechatWebRedirectLogin(redirectAfterLogin: string) {
  const response = await apiClient.post(webEnv.wechatWebRedirectPreparePath, {
    redirectAfterLogin,
  });
  return normalizeWechatWebRedirectPrepareResult(response.data);
}

export async function loginWithWechatWebRedirectCallback(payload: { code: string; state: string }) {
  const response = await apiClient.post(webEnv.wechatWebRedirectCallbackPath, payload);
  return resolveSessionFromTokenPayload(response.data, fetchCurrentUser);
}

export async function createWechatWebQrCode(redirectAfterLogin: string) {
  const response = await apiClient.post(webEnv.wechatWebQrCodePath, {
    redirectAfterLogin,
  });
  return normalizeWechatWebQrCodeResult(response.data);
}

export async function fetchWechatWebLoginStatus(loginId: string) {
  const response = await apiClient.get(webEnv.wechatWebStatusPath, {
    params: { loginId },
  });
  const result = normalizeWechatWebStatusResult(response.data);

  if (result.status === "SUCCESS" && result.loginResult) {
    return {
      ...result,
      session: await resolveSessionFromTokenPayload(result.loginResult, fetchCurrentUser),
    };
  }

  return result;
}

export async function acknowledgeWechatWebCallback(payload: { code: string; state: string }) {
  await apiClient.post(webEnv.wechatWebCallbackPath, payload);
}

export async function refreshSession(refreshToken: string) {
  const response = await apiClient.post(webEnv.refreshPath, { refreshToken });
  return resolveSessionFromTokenPayload(response.data, fetchCurrentUser);
}

export async function logoutSession() {
  await apiClient.post(webEnv.logoutPath);
}
