import { createAuthHeaders, normalizeCurrentUser, resolveSessionFromTokenPayload } from "@nebula/auth"
import type { AuthSession as AuthPackageSession } from "@nebula/auth"
import type { AuthSession, LocaleCode, MenuItem, MobileRequestClient } from "@nebula/core"
import { getRecord, getString, normalizePlatformApiError, unwrapEnvelope } from "@nebula/request"
import Taro from "@tarojs/taro"
import { miniProgramEnv } from "@/modules/runtime/mini-program-env"

interface LoginPayload {
  username: string
  password: string
  captcha?: string
  captchaKey?: string
}

interface TaroRequestClientOptions {
  getAccessToken: () => string | null
  getRefreshToken: () => string | null
  getLocale: () => LocaleCode
  onSessionRefreshed?: (session: AuthSession) => Promise<void> | void
  onUnauthorized?: () => Promise<void> | void
}

let refreshPromise: Promise<AuthSession | null> | null = null

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
  }
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
  }
}

function normalizeMenuType(type: unknown): MenuItem["type"] {
  const value = getString(type)?.toUpperCase()
  if (value === "DIRECTORY" || value === "CATALOG") {
    return 1
  }
  if (value === "BUTTON" || value === "PERMISSION") {
    return 3
  }
  return 2
}

function normalizeMiniProgramMenus(payload: unknown): MenuItem[] {
  const result = unwrapEnvelope<unknown>(payload)
  if (!Array.isArray(result)) {
    return []
  }

  const mapNode = (item: unknown, index: number): MenuItem | null => {
    const record = getRecord(item)
    if (!record) {
      return null
    }

    const isExternal = record.externalFlag === true || record.isExternal === true
    const externalUrl = getString(record.externalUrl)

    return {
      id: getString(record.id) ?? `${getString(record.path) ?? "menu"}-${index}`,
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
        ? record.children.map((child, childIndex) => mapNode(child, childIndex)).filter((child): child is MenuItem => child !== null)
        : undefined,
    }
  }

  return result.map((item, index) => mapNode(item, index)).filter((item): item is MenuItem => item !== null)
}

function buildUrl(path: string) {
  if (/^https?:\/\//.test(path)) {
    return path
  }
  return `${miniProgramEnv.apiBaseUrl}${path}`
}

async function request<T>(input: {
  path: string
  method: "GET" | "POST" | "PUT" | "DELETE"
  payload?: unknown
  token?: string
  locale: LocaleCode
}) {
  const response = await Taro.request<T>({
    url: buildUrl(input.path),
    method: input.method,
    data: input.payload,
    header: {
      "Accept-Language": input.locale,
      ...createAuthHeaders(input.token ?? undefined),
    },
  })

  if (response.statusCode === 401) {
    const unauthorizedError = new Error("Unauthorized")
    ;(unauthorizedError as Error & { statusCode?: number }).statusCode = 401
    throw unauthorizedError
  }

  if (response.statusCode < 200 || response.statusCode >= 300) {
    throw new Error(`Request failed with status ${response.statusCode}`)
  }

  return response.data
}

async function fetchCurrentUser(locale: LocaleCode, token?: string) {
  const payload = await request<unknown>({
    path: miniProgramEnv.currentUserPath,
    method: "GET",
    token,
    locale,
  })

  return normalizeCurrentUser(payload, {
    normalizeMenuList: normalizeMiniProgramMenus,
  })
}

async function refreshSession(options: TaroRequestClientOptions) {
  const refreshToken = options.getRefreshToken()
  if (!refreshToken) {
    return null
  }

  const payload = await request<unknown>({
    path: miniProgramEnv.refreshPath,
    method: "POST",
    payload: { refreshToken },
    locale: options.getLocale(),
  })

  const session = await resolveSessionFromTokenPayload(payload, (token) => fetchCurrentUser(options.getLocale(), token))
  return toCoreSession(session)
}

async function withRefreshRetry<T>(executor: (token?: string) => Promise<T>, options: TaroRequestClientOptions) {
  try {
    return await executor(options.getAccessToken() ?? undefined)
  } catch (error) {
    const statusCode = typeof error === "object" && error !== null && "statusCode" in error ? (error as { statusCode?: number }).statusCode : undefined
    if (statusCode !== 401) {
      throw normalizePlatformApiError(error)
    }

    if (!refreshPromise) {
      refreshPromise = refreshSession(options)
        .then(async (session) => {
          if (session) {
            await options.onSessionRefreshed?.(session)
          } else {
            await options.onUnauthorized?.()
          }
          return session
        })
        .finally(() => {
          refreshPromise = null
        })
    }

    const nextSession = await refreshPromise
    if (!nextSession?.token) {
      throw normalizePlatformApiError(error)
    }

    return executor(nextSession.token)
  }
}

export function createMiniProgramAuthApi(locale: LocaleCode) {
  return {
    fetchCurrentUser: (token?: string) => fetchCurrentUser(locale, token),
    async loginWithPassword(payload: LoginPayload) {
      const response = await request<unknown>({
        path: miniProgramEnv.loginPath,
        method: "POST",
        payload,
        locale,
      })
      const session = await resolveSessionFromTokenPayload(response, (token) => fetchCurrentUser(locale, token))
      return toCoreSession(session)
    },

    async refreshSession(refreshToken: string) {
      const response = await request<unknown>({
        path: miniProgramEnv.refreshPath,
        method: "POST",
        payload: { refreshToken },
        locale,
      })
      const session = await resolveSessionFromTokenPayload(response, (token) => fetchCurrentUser(locale, token))
      return toCoreSession(session)
    },
    async logoutSession(token?: string) {
      await request<unknown>({
        path: miniProgramEnv.logoutPath,
        method: "POST",
        token,
        locale,
      })
    },
  }
}

export function createTaroRequestClient(options: TaroRequestClientOptions): MobileRequestClient {
  return {
    get: <T>(url: string, params?: Record<string, unknown>) => withRefreshRetry(async (token) => unwrapEnvelope<T>(await request<T>({ path: url, method: "GET", payload: params, token, locale: options.getLocale() })), options),
    post: <T>(url: string, payload?: unknown) => withRefreshRetry(async (token) => unwrapEnvelope<T>(await request<T>({ path: url, method: "POST", payload, token, locale: options.getLocale() })), options),
    put: <T>(url: string, payload?: unknown) => withRefreshRetry(async (token) => unwrapEnvelope<T>(await request<T>({ path: url, method: "PUT", payload, token, locale: options.getLocale() })), options),
    delete: <T>(url: string) => withRefreshRetry(async (token) => unwrapEnvelope<T>(await request<T>({ path: url, method: "DELETE", token, locale: options.getLocale() })), options),
    upload: async (url, formData) => {
      void formData
      await withRefreshRetry(async (token) => {
        const uploadToken = token ?? options.getAccessToken() ?? undefined
        const result = await Taro.uploadFile({
          url: buildUrl(url),
          filePath: "",
          name: "file",
          header: {
            "Accept-Language": options.getLocale(),
            ...createAuthHeaders(uploadToken),
          },
        })
        return result
      }, options)
      throw new Error("Taro upload adapter requires a page-level filePath implementation before use")
    },
  }
}
