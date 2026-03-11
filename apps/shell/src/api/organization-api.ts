import type {
  OrganizationItem,
  OrganizationMutationPayload,
  OrganizationPageQuery,
  OrganizationPageResult,
  OrganizationTreeItem,
} from "@platform/core";
import { shellEnv } from "../config/env";
import { apiClient, getArray, getRecord, getString, unwrapEnvelope } from "./client";
import { mockOrganizations, stampUpdatedTime } from "./mock-auth-admin-data";

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

function buildMockTree(parentId?: string): OrganizationTreeItem[] {
  return mockOrganizations
    .filter((item) => item.parentId === parentId)
    .map((item) => ({
      ...item,
      children: buildMockTree(item.id),
    }));
}

function filterMockRows(query: OrganizationPageQuery) {
  return mockOrganizations.filter((item) => {
    if (query.name && !item.name.toLowerCase().includes(query.name.toLowerCase())) {
      return false;
    }
    if (query.code && !item.code.toLowerCase().includes(query.code.toLowerCase())) {
      return false;
    }
    if (typeof query.status === "number" && item.status !== query.status) {
      return false;
    }
    return true;
  });
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
  if (shellEnv.useMockAuth) {
    const rows = filterMockRows(query);
    const start = (query.pageNum - 1) * query.pageSize;
    return { data: rows.slice(start, start + query.pageSize), total: rows.length };
  }

  const response = await apiClient.get("/orgs/page", { params: query });
  return parsePagePayload(unwrapEnvelope<Record<string, unknown>>(response.data));
}

export async function fetchOrganizationTree() {
  if (shellEnv.useMockAuth) {
    return buildMockTree();
  }

  const response = await apiClient.get("/orgs/tree");
  return getArray<unknown>(unwrapEnvelope<unknown[]>(response.data))
    .map(mapOrganizationTree)
    .filter((item): item is OrganizationTreeItem => item !== null);
}

export async function fetchOrganizationList() {
  if (shellEnv.useMockAuth) {
    return [...mockOrganizations];
  }

  const response = await apiClient.get("/orgs/list");
  return getArray<unknown>(unwrapEnvelope<unknown[]>(response.data))
    .map(mapOrganization)
    .filter((item): item is OrganizationItem => item !== null);
}

export async function fetchOrganizationDetail(id: string) {
  if (shellEnv.useMockAuth) {
    return mockOrganizations.find((item) => item.id === id) ?? null;
  }

  const response = await apiClient.get(`/orgs/${id}`);
  return mapOrganization(unwrapEnvelope<unknown>(response.data));
}

export async function createOrganization(payload: OrganizationMutationPayload) {
  if (shellEnv.useMockAuth) {
    const row: OrganizationItem = {
      id: crypto.randomUUID(),
      ...payload,
      status: payload.status ?? 1,
      createTime: stampUpdatedTime(),
      updateTime: stampUpdatedTime(),
    };
    mockOrganizations.unshift(row);
    return row;
  }

  const response = await apiClient.post("/orgs", payload);
  return unwrapEnvelope<unknown>(response.data);
}

export async function updateOrganization(id: string, payload: OrganizationMutationPayload) {
  if (shellEnv.useMockAuth) {
    const index = mockOrganizations.findIndex((item) => item.id === id);
    if (index >= 0) {
      mockOrganizations[index] = { ...mockOrganizations[index], ...payload, id, updateTime: stampUpdatedTime() };
      return mockOrganizations[index];
    }
    return { id, ...payload };
  }

  const response = await apiClient.put(`/orgs/${id}`, { id, ...payload });
  return unwrapEnvelope<unknown>(response.data);
}

export async function deleteOrganization(id: string) {
  if (shellEnv.useMockAuth) {
    const ids = new Set<string>([id]);
    let updated = true;
    while (updated) {
      updated = false;
      for (const item of mockOrganizations) {
        if (item.parentId && ids.has(item.parentId) && !ids.has(item.id)) {
          ids.add(item.id);
          updated = true;
        }
      }
    }
    for (let index = mockOrganizations.length - 1; index >= 0; index -= 1) {
      if (ids.has(mockOrganizations[index].id)) {
        mockOrganizations.splice(index, 1);
      }
    }
    return;
  }

  await apiClient.delete(`/orgs/${id}`);
}
