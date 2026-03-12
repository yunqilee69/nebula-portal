import type {
  OAuth2ClientDetail,
  OAuth2ClientItem,
  OAuth2ClientMutationPayload,
  OAuth2ClientPageQuery,
  OAuth2ClientPageResult,
} from "@platform/core";
import { shellEnv } from "../config/env";
import { getArray, getRecord, getString, requestDelete, requestGet, requestPost, requestPut } from "./client";

const now = new Date().toISOString();

const mockClients: OAuth2ClientDetail[] = [
  {
    id: "oauth-client-1",
    clientId: "nebula-shell",
    clientSecret: "nebula-shell-secret",
    clientName: "Nebula Shell",
    clientType: "confidential",
    grantTypes: "password,refresh_token",
    scopes: "openid,profile",
    redirectUris: "http://127.0.0.1:3000/login",
    autoApprove: 1,
    accessTokenValidity: 3600,
    refreshTokenValidity: 604800,
    additionalInformation: '{"owner":"platform"}',
    status: 1,
    remark: "Default shell client",
    createTime: now,
    updateTime: now,
  },
];

function getNumber(value: unknown) {
  return typeof value === "number" ? value : undefined;
}

function mapClient(item: unknown): OAuth2ClientDetail | null {
  const record = getRecord(item);
  if (!record) {
    return null;
  }
  return {
    id: getString(record.id) ?? crypto.randomUUID(),
    clientId: getString(record.clientId) ?? "",
    clientSecret: getString(record.clientSecret),
    clientName: getString(record.clientName),
    clientType: getString(record.clientType),
    grantTypes: getString(record.grantTypes),
    scopes: getString(record.scopes),
    redirectUris: getString(record.redirectUris),
    autoApprove: getNumber(record.autoApprove),
    accessTokenValidity: getNumber(record.accessTokenValidity),
    refreshTokenValidity: getNumber(record.refreshTokenValidity),
    additionalInformation: getString(record.additionalInformation),
    status: getNumber(record.status),
    remark: getString(record.remark),
    createTime: getString(record.createTime),
    updateTime: getString(record.updateTime),
  };
}

function parsePage(payload: Record<string, unknown>) {
  const pageData = getRecord(payload.data) ?? payload;
  const rows = getArray<unknown>(pageData.data ?? pageData.records ?? pageData.rows ?? pageData.list)
    .map(mapClient)
    .filter((value): value is OAuth2ClientItem => value !== null);
  const totalCandidate = pageData.total ?? payload.total ?? payload.count;
  const total = typeof totalCandidate === "number" ? totalCandidate : rows.length;
  return { data: rows, total } satisfies OAuth2ClientPageResult;
}

export async function fetchOAuth2ClientPage(query: OAuth2ClientPageQuery): Promise<OAuth2ClientPageResult> {
  if (shellEnv.useMockAuth) {
    const rows = mockClients.filter((item) => {
      if (query.clientId && !item.clientId.toLowerCase().includes(query.clientId.toLowerCase())) {
        return false;
      }
      if (query.clientName && !(item.clientName ?? "").toLowerCase().includes(query.clientName.toLowerCase())) {
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

  const payload = await requestGet<Record<string, unknown>>("/oauth2/clients/page", { req: JSON.stringify(query) });
  return parsePage(payload);
}

export async function fetchOAuth2ClientDetail(id: string): Promise<OAuth2ClientDetail | null> {
  if (shellEnv.useMockAuth) {
    return mockClients.find((item) => item.id === id) ?? null;
  }
  const payload = await requestGet<unknown>(`/oauth2/clients/${id}`);
  return mapClient(payload);
}

export async function createOAuth2Client(payload: OAuth2ClientMutationPayload) {
  if (shellEnv.useMockAuth) {
    const next: OAuth2ClientDetail = {
      id: crypto.randomUUID(),
      ...payload,
      status: payload.status ?? 1,
      autoApprove: payload.autoApprove ?? 0,
      createTime: new Date().toISOString(),
      updateTime: new Date().toISOString(),
    };
    mockClients.unshift(next);
    return next;
  }
  return requestPost<unknown>("/oauth2/clients", payload);
}

export async function updateOAuth2Client(id: string, payload: OAuth2ClientMutationPayload) {
  if (shellEnv.useMockAuth) {
    const index = mockClients.findIndex((item) => item.id === id);
    if (index >= 0) {
      mockClients[index] = { ...mockClients[index], ...payload, id, updateTime: new Date().toISOString() };
      return mockClients[index];
    }
    return null;
  }
  return requestPut<unknown>(`/oauth2/clients/${id}`, { id, ...payload });
}

export async function deleteOAuth2Client(id: string) {
  if (shellEnv.useMockAuth) {
    const next = mockClients.filter((item) => item.id !== id);
    mockClients.splice(0, mockClients.length, ...next);
    return;
  }
  await requestDelete<void>(`/oauth2/clients/${id}`);
}
