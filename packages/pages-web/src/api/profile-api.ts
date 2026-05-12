import type { UserProfileDetail, ProfileUpdatePayload, OAuth2BindingItem, OAuth2BindPayload, LoginRecordItem, LoginRecordPageQuery, LoginRecordPageResult } from "@nebula/core";
import { webEnv } from "../config/env";
import { getArray, getRecord, getString, requestDelete, requestGet, requestPost, requestPut } from "./client";

function toUserProfileDetail(payload: unknown): UserProfileDetail {
  const record = getRecord(payload) ?? {};
  return {
    id: getString(record.id) ?? getString(record.userId) ?? "",
    username: getString(record.username) ?? "",
    nickname: getString(record.nickname) ?? getString(record.nickName),
    avatar: getString(record.avatar),
    email: getString(record.email),
    phone: getString(record.phone),
    status: typeof record.status === "number" ? record.status : 1,
    createTime: getString(record.createTime) ?? "",
  };
}

function toOAuth2BindingItem(payload: unknown): OAuth2BindingItem {
  const record = getRecord(payload) ?? {};
  return {
    providerId: getString(record.providerId) ?? "",
    providerName: getString(record.providerName) ?? getString(record.providerId) ?? "",
    bound: typeof record.bound === "boolean" ? record.bound : Boolean(record.providerUserId),
    providerUserId: getString(record.providerUserId),
    linkedAt: getString(record.linkedAt) ?? getString(record.linkedTime),
  };
}

function toLoginRecordItem(payload: unknown): LoginRecordItem {
  const record = getRecord(payload) ?? {};
  return {
    loginTime: getString(record.loginTime) ?? "",
    loginAccount: getString(record.loginAccount) ?? "",
    loginType: getString(record.loginType) ?? "",
    loginResult: getString(record.loginResult) ?? "",
    loginIp: getString(record.loginIp) ?? "",
    deviceInfo: getString(record.deviceInfo) ?? "",
  };
}

export async function fetchUserProfile(): Promise<UserProfileDetail> {
  const payload = await requestGet<unknown>(webEnv.profilePath);
  return toUserProfileDetail(payload);
}

export async function updateUserProfile(payload: ProfileUpdatePayload): Promise<UserProfileDetail> {
  const response = await requestPut<unknown>(webEnv.profilePath, payload);
  return toUserProfileDetail(response);
}

export async function fetchOAuth2Bindings(): Promise<OAuth2BindingItem[]> {
  const payload = await requestGet<unknown>(webEnv.oauth2BindingsPath);
  const record = getRecord(payload) ?? {};
  const providers = getArray<unknown>(record.providers ?? record.data ?? []);
  return providers.map(toOAuth2BindingItem);
}

export async function bindOAuth2Provider(payload: OAuth2BindPayload): Promise<string> {
  const response = await requestPost<unknown>(webEnv.oauth2BindingsPath, payload);
  return getString(response) ?? "";
}

export async function unbindOAuth2Provider(providerId: string): Promise<boolean> {
  await requestDelete<void>(`${webEnv.oauth2BindingsPath}/${providerId}`);
  return true;
}

export async function fetchLoginRecords(query: LoginRecordPageQuery): Promise<LoginRecordPageResult> {
  const payload = await requestPost<unknown>(webEnv.loginRecordsPath, query);
  const record = getRecord(payload) ?? {};
  const rows = getArray<unknown>(record.data ?? record.records ?? record.rows ?? []);
  const total = typeof record.total === "number" ? record.total : rows.length;
  return {
    data: rows.map(toLoginRecordItem),
    total,
  };
}
