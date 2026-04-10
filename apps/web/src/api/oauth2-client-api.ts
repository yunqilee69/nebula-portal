import $$$ from "@nebula/core";
import { getArray, getRecord, getString, requestDelete, requestGet, requestPost, requestPut } from "./client";

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
  const payload = await requestPost<Record<string, unknown>>("/api/auth/oauth2/clients/page", query);
  return parsePage(payload);
}

export async function fetchOAuth2ClientDetail(id: string): Promise<OAuth2ClientDetail | null> {
  const payload = await requestGet<unknown>(`/api/auth/oauth2/clients/${id}`);
  return mapClient(payload);
}

export async function createOAuth2Client(payload: OAuth2ClientMutationPayload) {
  return requestPost<unknown>("/api/auth/oauth2/clients", payload);
}

export async function updateOAuth2Client(id: string, payload: OAuth2ClientMutationPayload) {
  return requestPut<unknown>(`/api/auth/oauth2/clients/${id}`, { id, ...payload });
}

export async function deleteOAuth2Client(id: string) {
  await requestDelete<void>(`/api/auth/oauth2/clients/${id}`);
}
