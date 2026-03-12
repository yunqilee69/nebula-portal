import type {
  OrganizationItem,
  OrganizationMutationPayload,
  OrganizationPageQuery,
  OrganizationPageResult,
  OrganizationTreeItem,
} from "@platform/core";
import { apiClient, getArray, getRecord, getString, unwrapEnvelope } from "./client";

function mapOrganization(item: unknown): OrganizationItem | null {
  const record = getRecord(item);
  if (!record) {
    return null;
  }
  return {
    id: getString(record.id) ?? crypto.randomUUID(),
    name: getString(record.name) ?? "Unnamed Organization",
    code: getString(record.code) ?? "",
    leader: getString(record.leader),
    phone: getString(record.phone),
    address: getString(record.address),
    parentId: getString(record.parentId),
    status: typeof record.status === "number" ? record.status : undefined,
    remark: getString(record.remark),
    createTime: getString(record.createTime),
    updateTime: getString(record.updateTime),
  };
}

function mapOrganizationTree(item: unknown): OrganizationTreeItem | null {
  const base = mapOrganization(item);
  const record = getRecord(item);
  if (!base || !record) {
    return null;
  }
  return {
    ...base,
    children: getArray<unknown>(record.children)
      .map(mapOrganizationTree)
      .filter((child): child is OrganizationTreeItem => child !== null),
  };
}

function parsePagePayload(payload: Record<string, unknown>) {
  const rows = getArray<unknown>(payload.data ?? payload.records ?? payload.rows)
    .map(mapOrganization)
    .filter((item): item is OrganizationItem => item !== null);
  const totalCandidate = payload.total ?? payload.count;
  const total = typeof totalCandidate === "number" ? totalCandidate : rows.length;
  return { data: rows, total } satisfies OrganizationPageResult;
}

export async function fetchOrganizationPage(query: OrganizationPageQuery): Promise<OrganizationPageResult> {
  const response = await apiClient.get("/orgs/page", { params: { req: JSON.stringify(query) } });
  return parsePagePayload(unwrapEnvelope<Record<string, unknown>>(response.data));
}

export async function fetchOrganizationTree() {
  const response = await apiClient.get("/orgs/tree");
  return getArray<unknown>(unwrapEnvelope<unknown[]>(response.data))
    .map(mapOrganizationTree)
    .filter((item): item is OrganizationTreeItem => item !== null);
}

export async function fetchOrganizationList() {
  const response = await apiClient.get("/orgs/list");
  return getArray<unknown>(unwrapEnvelope<unknown[]>(response.data))
    .map(mapOrganization)
    .filter((item): item is OrganizationItem => item !== null);
}

export async function fetchOrganizationDetail(id: string) {
  const response = await apiClient.get(`/orgs/${id}`);
  return mapOrganization(unwrapEnvelope<unknown>(response.data));
}

export async function createOrganization(payload: OrganizationMutationPayload) {
  const response = await apiClient.post("/orgs", payload);
  return unwrapEnvelope<unknown>(response.data);
}

export async function updateOrganization(id: string, payload: OrganizationMutationPayload) {
  const response = await apiClient.put(`/orgs/${id}`, { id, ...payload });
  return unwrapEnvelope<unknown>(response.data);
}

export async function deleteOrganization(id: string) {
  await apiClient.delete(`/orgs/${id}`);
}
