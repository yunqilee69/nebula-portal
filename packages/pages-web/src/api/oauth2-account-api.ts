import type { OAuth2AccountDetail, OAuth2AccountItem, OAuth2AccountMutationPayload, OAuth2AccountPageQuery, OAuth2AccountPageResult } from "@nebula/core";
import { getArray, getRecord, getString, requestDelete, requestGet, requestPost, requestPut } from "./client";

function getNumber(value: unknown) {
  return typeof value === "number" ? value : undefined;
}

function mapAccount(item: unknown): OAuth2AccountDetail | null {
  const record = getRecord(item);
  if (!record) {
    return null;
  }
  return {
    id: getString(record.id) ?? crypto.randomUUID(),
    userId: getString(record.userId) ?? "",
    username: getString(record.username),
    nickname: getString(record.nickname),
    provider: getString(record.provider) ?? getString(record.providerId),
    providerId: getString(record.providerId) ?? getString(record.provider),
    oauth2AccountId: getString(record.oauth2AccountId) ?? getString(record.providerUserId),
    providerUserId: getString(record.providerUserId),
    providerAttributes: getString(record.providerAttributes),
    status: getNumber(record.status),
    linkedAt: getString(record.linkedAt),
    createTime: getString(record.createTime),
    updateTime: getString(record.updateTime),
  };
}

function parsePage(payload: Record<string, unknown>) {
  const pageData = getRecord(payload.data) ?? payload;
  const rows = getArray<unknown>(pageData.data ?? pageData.records ?? pageData.rows ?? pageData.list)
    .map(mapAccount)
    .filter((value): value is OAuth2AccountItem => value !== null);
  const totalCandidate = pageData.total ?? payload.total ?? payload.count;
  const total = typeof totalCandidate === "number" ? totalCandidate : rows.length;
  return { data: rows, total } satisfies OAuth2AccountPageResult;
}

export async function fetchOAuth2AccountPage(query: OAuth2AccountPageQuery): Promise<OAuth2AccountPageResult> {
  const payload = await requestPost<Record<string, unknown>>("/api/auth/oauth2/accounts/page", query);
  return parsePage(payload);
}

export async function fetchOAuth2AccountDetail(id: string): Promise<OAuth2AccountDetail | null> {
  const payload = await requestGet<unknown>(`/api/auth/oauth2/accounts/${id}`);
  return mapAccount(payload);
}

export async function createOAuth2Account(payload: OAuth2AccountMutationPayload) {
  return requestPost<unknown>("/api/auth/oauth2/accounts", payload);
}

export async function updateOAuth2Account(id: string, payload: OAuth2AccountMutationPayload) {
  return requestPut<unknown>(`/api/auth/oauth2/accounts/${id}`, {
    id,
    providerId: payload.providerId,
    providerUserId: payload.providerUserId,
    providerAttributes: payload.providerAttributes,
  });
}

export async function deleteOAuth2Account(id: string) {
  await requestDelete<void>(`/api/auth/oauth2/accounts/${id}`);
}
