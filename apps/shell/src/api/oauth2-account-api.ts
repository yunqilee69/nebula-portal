import type {
  OAuth2AccountDetail,
  OAuth2AccountItem,
  OAuth2AccountMutationPayload,
  OAuth2AccountPageQuery,
  OAuth2AccountPageResult,
} from "@platform/core";
import { shellEnv } from "../config/env";
import { getArray, getRecord, getString, requestDelete, requestGet, requestPost, requestPut } from "./client";

const now = new Date().toISOString();

const mockAccounts: OAuth2AccountDetail[] = [
  {
    id: "oauth-account-1",
    userId: "user-1",
    username: "admin",
    nickname: "Administrator",
    provider: "github",
    providerId: "github",
    oauth2AccountId: "github-admin",
    providerUserId: "github-admin",
    providerAttributes: '{"login":"admin"}',
    status: 1,
    linkedAt: now,
    createTime: now,
    updateTime: now,
  },
];

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
  if (shellEnv.useMockAuth) {
    const rows = mockAccounts.filter((item) => {
      if (query.userId && !item.userId.toLowerCase().includes(query.userId.toLowerCase())) {
        return false;
      }
      if (query.providerId && (item.providerId ?? item.provider) !== query.providerId) {
        return false;
      }
      if (typeof query.status === "number" && item.status !== query.status) {
        return false;
      }
      return true;
    });
    const start = (query.pageNum - 1) * query.pageSize;
    return { data: rows.slice(start, start + query.pageSize), total: rows.length };
  }

  const payload = await requestGet<Record<string, unknown>>("/oauth2/accounts/page", { req: JSON.stringify(query) });
  return parsePage(payload);
}

export async function fetchOAuth2AccountDetail(id: string): Promise<OAuth2AccountDetail | null> {
  if (shellEnv.useMockAuth) {
    return mockAccounts.find((item) => item.id === id) ?? null;
  }
  const payload = await requestGet<unknown>(`/oauth2/accounts/${id}`);
  return mapAccount(payload);
}

export async function createOAuth2Account(payload: OAuth2AccountMutationPayload) {
  if (shellEnv.useMockAuth) {
    const next: OAuth2AccountDetail = {
      id: crypto.randomUUID(),
      userId: payload.userId,
      username: payload.userId,
      nickname: payload.userId,
      provider: payload.providerId,
      providerId: payload.providerId,
      oauth2AccountId: payload.providerUserId,
      providerUserId: payload.providerUserId,
      providerAttributes: payload.providerAttributes,
      status: 1,
      linkedAt: new Date().toISOString(),
      createTime: new Date().toISOString(),
      updateTime: new Date().toISOString(),
    };
    mockAccounts.unshift(next);
    return next;
  }
  return requestPost<unknown>("/oauth2/accounts", payload);
}

export async function updateOAuth2Account(id: string, payload: OAuth2AccountMutationPayload) {
  if (shellEnv.useMockAuth) {
    const index = mockAccounts.findIndex((item) => item.id === id);
    if (index >= 0) {
      mockAccounts[index] = {
        ...mockAccounts[index],
        provider: payload.providerId,
        providerId: payload.providerId,
        oauth2AccountId: payload.providerUserId,
        providerUserId: payload.providerUserId,
        providerAttributes: payload.providerAttributes,
        updateTime: new Date().toISOString(),
      };
      return mockAccounts[index];
    }
    return null;
  }
  return requestPut<unknown>(`/oauth2/accounts/${id}`, {
    id,
    providerId: payload.providerId,
    providerUserId: payload.providerUserId,
    providerAttributes: payload.providerAttributes,
  });
}

export async function deleteOAuth2Account(id: string) {
  if (shellEnv.useMockAuth) {
    const next = mockAccounts.filter((item) => item.id !== id);
    mockAccounts.splice(0, mockAccounts.length, ...next);
    return;
  }
  await requestDelete<void>(`/oauth2/accounts/${id}`);
}
