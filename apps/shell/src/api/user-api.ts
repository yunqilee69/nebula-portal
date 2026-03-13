import type {
  UserDetail,
  UserItem,
  UserMutationPayload,
  UserOrganizationRef,
  UserPageQuery,
  UserPageResult,
  UserRoleRef,
} from "@platform/core";
import { getArray, getRecord, getString, requestDelete, requestGet, requestPost, requestPut } from "./client";

function mapRoleRef(item: unknown): UserRoleRef | null {
  const record = getRecord(item);
  if (!record) {
    return null;
  }

  return {
    id: getString(record.id) ?? crypto.randomUUID(),
    name: getString(record.name) ?? "Unnamed Role",
    code: getString(record.code) ?? "",
  };
}

function mapOrganizationRef(item: unknown): UserOrganizationRef | null {
  const record = getRecord(item);
  if (!record) {
    return null;
  }

  return {
    id: getString(record.id) ?? crypto.randomUUID(),
    name: getString(record.name) ?? "Unnamed Organization",
    code: getString(record.code) ?? "",
  };
}

function mapUser(item: unknown): UserDetail | null {
  const record = getRecord(item);
  if (!record) {
    return null;
  }

  return {
    id: getString(record.id) ?? crypto.randomUUID(),
    username: getString(record.username) ?? "",
    nickname: getString(record.nickname) ?? getString(record.nickName),
    avatar: getString(record.avatar),
    email: getString(record.email),
    phone: getString(record.phone),
    status: typeof record.status === "number" ? record.status : undefined,
    remark: getString(record.remark),
    createTime: getString(record.createTime),
    updateTime: getString(record.updateTime),
    roles: getArray<unknown>(record.roles)
      .map(mapRoleRef)
      .filter((value): value is UserRoleRef => value !== null),
    organizations: getArray<unknown>(record.organizations ?? record.orgs)
      .map(mapOrganizationRef)
      .filter((value): value is UserOrganizationRef => value !== null),
  };
}

function parseUserPage(payload: Record<string, unknown>): UserPageResult {
  const pageData = getRecord(payload.data) ?? payload;
  const rows = getArray<unknown>(pageData.data ?? pageData.records ?? pageData.rows ?? pageData.list)
    .map(mapUser)
    .filter((value): value is UserItem => value !== null);
  const totalCandidate = pageData.total ?? payload.total ?? payload.count;
  const total = typeof totalCandidate === "number" ? totalCandidate : rows.length;
  return { data: rows, total };
}

function toRequestPayload(payload: UserMutationPayload) {
  return {
    username: payload.username,
    password: payload.password,
    nickname: payload.nickname || undefined,
    avatar: payload.avatar || undefined,
    email: payload.email || undefined,
    phone: payload.phone || undefined,
    status: payload.status ?? 1,
    remark: payload.remark || undefined,
    roleIds: payload.roleIds ?? [],
    orgIds: payload.orgIds ?? [],
  };
}

export async function fetchUserPage(query: UserPageQuery): Promise<UserPageResult> {
  const payload = await requestPost<Record<string, unknown>>("/api/auth/users/page", query);
  return parseUserPage(payload);
}

export async function fetchUserDetail(id: string): Promise<UserDetail | null> {
  const response = await requestGet<unknown>(`/api/auth/users/${id}`);
  return mapUser(response);
}

export async function createUser(payload: UserMutationPayload) {
  return requestPost<unknown>("/api/auth/users", toRequestPayload(payload));
}

export async function updateUser(id: string, payload: UserMutationPayload) {
  const nextPayload = toRequestPayload(payload);
  return requestPut<unknown>(`/api/auth/users/${id}`, {
    id,
    nickname: nextPayload.nickname,
    avatar: nextPayload.avatar,
    email: nextPayload.email,
    phone: nextPayload.phone,
    status: nextPayload.status,
    remark: nextPayload.remark,
    roleIds: nextPayload.roleIds,
    orgIds: nextPayload.orgIds,
  });
}

export async function deleteUser(id: string) {
  await requestDelete<void>(`/api/auth/users/${id}`);
}
