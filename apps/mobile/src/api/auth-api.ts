import { createAuthHeaders, normalizeCurrentUser, resolveSessionFromTokenPayload } from "@nebula/auth";
import type { AuthSession as AuthPackageSession } from "@nebula/auth";
import type { AuthSession, LocaleCode, MenuItem } from "@nebula/core";
import { createPlatformRequestClient, getRecord, getString, unwrapEnvelope } from "@nebula/request";
import { mobileEnv } from "@/config/mobile-env";

interface LoginPayload {
  username: string;
  password: string;
  captcha?: string;
  captchaKey?: string;
}

function normalizeMenuItem(item: NonNullable<AuthPackageSession["menuList"]>[number]): MenuItem {
  return {
    id: String(item.id),
    parentId: item.parentId ? String(item.parentId) : undefined,
    name: item.name,
    sort: item.sort ?? 0,
    status: item.status ?? 1,
    type: item.type ?? 2,
    path: item.path,
    component: item.component,
    linkType: item.linkType,
    linkUrl: item.linkUrl,
    icon: item.icon,
    visible: item.visible ?? 1,
    permission: item.permission,
    children: item.children?.map(normalizeMenuItem),
  };
}

export function toCoreSession(session: AuthPackageSession): AuthSession {
  return {
    token: session.token,
    refreshToken: session.refreshToken,
    accessTokenExpiresIn: session.accessTokenExpiresIn,
    refreshTokenExpiresIn: session.refreshTokenExpiresIn,
    user: {
      userId: session.user.userId,
      username: session.user.username,
      avatar: session.user.avatar,
      roles: session.user.roles,
    },
    permissions: Array.isArray(session.permissions) ? session.permissions : [],
    menuList: session.menuList?.map(normalizeMenuItem),
  };
}

function normalizeMenuType(type: unknown): MenuItem["type"] {
  const value = getString(type)?.toUpperCase();
  if (value === "DIRECTORY" || value === "CATALOG") {
    return 1;
  }
  if (value === "BUTTON" || value === "PERMISSION") {
    return 3;
  }
  return 2;
}

function normalizeMobileMenus(payload: unknown): MenuItem[] {
  const result = unwrapEnvelope<unknown>(payload);
  if (!Array.isArray(result)) {
    return [];
  }

  const mapNode = (item: unknown): MenuItem | null => {
    const record = getRecord(item);
    if (!record) {
      return null;
    }

    const isExternal = record.externalFlag === true || record.isExternal === true;
    const externalUrl = getString(record.externalUrl);

    return {
      id: getString(record.id) ?? `${getString(record.path) ?? "menu"}-${Math.random().toString(36).slice(2, 10)}`,
      parentId: getString(record.parentId),
      name: getString(record.name) ?? "Unnamed Menu",
      sort: typeof record.sort === "number" ? record.sort : 0,
      status: record.status === 0 ? 0 : 1,
      type: normalizeMenuType(record.type),
      path: getString(record.path),
      component: getString(record.component),
      linkType: isExternal ? 2 : 1,
      linkUrl: externalUrl,
      icon: getString(record.icon),
      visible: record.hidden === true ? 0 : 1,
      permission: getString(record.permission) ?? getString(record.code),
      children: Array.isArray(record.children)
        ? record.children.map(mapNode).filter((child): child is MenuItem => child !== null)
        : undefined,
    };
  };

  return result.map(mapNode).filter((item): item is MenuItem => item !== null);
}

export function createMobileAuthApi(locale: LocaleCode) {
  const client = createPlatformRequestClient({
    baseURL: mobileEnv.apiBaseUrl,
    getLocale: () => locale,
  });

  async function fetchCurrentUser(token?: string) {
    const response = await client.raw.get(mobileEnv.currentUserPath, {
      headers: createAuthHeaders(token),
    });

    return normalizeCurrentUser(response.data, {
      normalizeMenuList: normalizeMobileMenus,
    });
  }

  return {
    fetchCurrentUser,
    async loginWithPassword(payload: LoginPayload) {
      const response = await client.raw.post(mobileEnv.loginPath, payload);
      const session = await resolveSessionFromTokenPayload(response.data, fetchCurrentUser);
      return toCoreSession(session);
    },
    async refreshSession(refreshToken: string) {
      const response = await client.raw.post(mobileEnv.refreshPath, { refreshToken });
      const session = await resolveSessionFromTokenPayload(response.data, fetchCurrentUser);
      return toCoreSession(session);
    },
    async logoutSession() {
      await client.raw.post(mobileEnv.logoutPath);
    },
  };
}
