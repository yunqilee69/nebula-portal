import type {
  UserDetail,
  UserItem,
  UserMutationPayload,
  UserOrganizationRef,
  UserPageQuery,
  UserPageResult,
  UserRoleRef,
} from "@platform/core";
import { shellEnv } from "../config/env";
import { getArray, getRecord, getString, requestDelete, requestGet, requestPost, requestPut } from "./client";

const now = new Date().toISOString();

const mockRoles: UserRoleRef[] = [
  { id: "role-1", name: "Platform Admin", code: "platform_admin" },
  { id: "role-2", name: "Business Operator", code: "biz_operator" },
];

const mockOrganizations: UserOrganizationRef[] = [
  { id: "org-root", name: "Nebula HQ", code: "NEBULA" },
  { id: "org-tech", name: "Technology Center", code: "TECH" },
  { id: "org-ops", name: "Operations Center", code: "OPS" },
];

const mockUsers: UserDetail[] = [
  {
    id: "user-1",
    username: "admin",
    nickname: "管理员",
    email: "admin@nebula.local",
    phone: "13800000001",
    status: 1,
    remark: "平台超级管理员",
    createTime: now,
    updateTime: now,
    roles: [mockRoles[0]],
    organizations: [mockOrganizations[0]],
  },
  {
    id: "user-2",
    username: "operator",
    nickname: "运营同学",
    email: "operator@nebula.local",
    phone: "13800000002",
    status: 1,
    remark: "运营测试账号",
    createTime: now,
    updateTime: now,
    roles: [mockRoles[1]],
    organizations: [mockOrganizations[2]],
  },
];

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

function filterMockUsers(query: UserPageQuery): UserPageResult {
  const rows = mockUsers.filter((item) => {
    if (query.username && !item.username.toLowerCase().includes(query.username.toLowerCase())) {
      return false;
    }
    if (query.nickname && !(item.nickname ?? "").toLowerCase().includes(query.nickname.toLowerCase())) {
      return false;
    }
    if (query.email && !(item.email ?? "").toLowerCase().includes(query.email.toLowerCase())) {
      return false;
    }
    if (query.phone && !(item.phone ?? "").includes(query.phone)) {
      return false;
    }
    if (typeof query.status === "number" && item.status !== query.status) {
      return false;
    }
    return true;
  });

  const start = (query.pageNum - 1) * query.pageSize;
  return {
    data: rows.slice(start, start + query.pageSize),
    total: rows.length,
  };
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
  if (shellEnv.useMockAuth) {
    return filterMockUsers(query);
  }

  const payload = await requestGet<Record<string, unknown>>("/users/page", { req: JSON.stringify(query) });
  return parseUserPage(payload);
}

export async function fetchUserDetail(id: string): Promise<UserDetail | null> {
  if (shellEnv.useMockAuth) {
    return mockUsers.find((item) => item.id === id) ?? null;
  }

  const response = await requestGet<unknown>(`/users/${id}`);
  return mapUser(response);
}

export async function createUser(payload: UserMutationPayload) {
  if (shellEnv.useMockAuth) {
    const nextUser: UserDetail = {
      id: crypto.randomUUID(),
      username: payload.username,
      nickname: payload.nickname,
      avatar: payload.avatar,
      email: payload.email,
      phone: payload.phone,
      status: payload.status ?? 1,
      remark: payload.remark,
      createTime: new Date().toISOString(),
      updateTime: new Date().toISOString(),
      roles: mockRoles.filter((role) => payload.roleIds?.includes(role.id)),
      organizations: mockOrganizations.filter((org) => payload.orgIds?.includes(org.id)),
    };
    mockUsers.unshift(nextUser);
    return nextUser;
  }

  return requestPost<unknown>("/users", toRequestPayload(payload));
}

export async function updateUser(id: string, payload: UserMutationPayload) {
  if (shellEnv.useMockAuth) {
    const index = mockUsers.findIndex((item) => item.id === id);
    const nextUser: UserDetail = {
      id,
      username: payload.username,
      nickname: payload.nickname,
      avatar: payload.avatar,
      email: payload.email,
      phone: payload.phone,
      status: payload.status ?? 1,
      remark: payload.remark,
      createTime: mockUsers[index]?.createTime ?? new Date().toISOString(),
      updateTime: new Date().toISOString(),
      roles: mockRoles.filter((role) => payload.roleIds?.includes(role.id)),
      organizations: mockOrganizations.filter((org) => payload.orgIds?.includes(org.id)),
    };
    if (index >= 0) {
      mockUsers[index] = nextUser;
    }
    return nextUser;
  }

  const nextPayload = toRequestPayload(payload);
  return requestPut<unknown>(`/users/${id}`, {
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
  if (shellEnv.useMockAuth) {
    const index = mockUsers.findIndex((item) => item.id === id);
    if (index >= 0) {
      mockUsers.splice(index, 1);
    }
    return;
  }

  await requestDelete<void>(`/users/${id}`);
}
