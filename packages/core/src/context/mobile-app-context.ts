import { eventBus } from "../event-bus";
import { hasPermissionCode, hasAnyPermissionCode, hasAllPermissionCode, hasRoleCode, hasAnyRoleCode, hasAllRoleCode } from "../permissions/permission-utils";
import type { MobileRuntimeBindings, MobileRuntimeContextOptions } from "../types";

function translate(localeMessages: Record<string, string>, fallbackMessages: Record<string, string>, key: string, fallback?: string, variables?: Record<string, string | number>) {
  const template = localeMessages[key] ?? fallbackMessages[key] ?? fallback ?? key;
  if (!variables) {
    return template;
  }

  return Object.entries(variables).reduce(
    (result, [variableKey, value]) => result.replaceAll(`{${variableKey}}`, String(value)),
    template,
  );
}

/**
 * Create a mobile app context for React Native.
 * This provides the same interface as AppContextValue but optimized for mobile use cases.
 */
export function createMobileAppContext(options: MobileRuntimeContextOptions): MobileRuntimeBindings {
  const getPermissions = () => options.getSession()?.permissions ?? [];
  const getRoles = () => options.getSession()?.user.roles ?? [];
  const runtimeState = options.runtimeState ?? {
    dict: {},
    config: {},
    notifications: [],
  };

  const localeMessages = options.messages[options.locale] ?? {};
  const fallbackMessages = options.messages["zh-CN"] ?? {};
  const appContext = {
    auth: {
      getToken: () => options.getSession()?.token ?? null,
      getSession: options.getSession,
      hasPermission: (code: string) => hasPermissionCode(getPermissions(), code),
      hasAnyCode: (codes: string[]) => hasAnyPermissionCode(getPermissions(), codes),
      hasAllCode: (codes: string[]) => hasAllPermissionCode(getPermissions(), codes),
      hasRole: (role: string) => hasRoleCode(getRoles(), role),
      hasAnyRole: (roles: string[]) => hasAnyRoleCode(getRoles(), roles),
      hasAllRole: (roles: string[]) => hasAllRoleCode(getRoles(), roles),
      redirectToLogin: () => undefined,
      logout: () => {
        void options.logout();
      },
    },
    dict: {
      get: (key: string) => runtimeState.dict[key] ?? [],
      ensure: async (key: string) => runtimeState.dict[key] ?? [],
      all: () => runtimeState.dict,
    },
    config: {
      get: (key: string) => runtimeState.config[key] ?? null,
      all: () => runtimeState.config,
    },
    notifications: {
      all: () => runtimeState.notifications,
      unreadCount: () => runtimeState.notifications.filter((item) => !item.read).length,
    },
    request: {
      get: <T>(url: string, params?: Record<string, unknown>) => options.requestClient.get<T>(url, params),
      post: <T>(url: string, payload?: unknown) => options.requestClient.post<T>(url, payload),
      put: <T>(url: string, payload?: unknown) => options.requestClient.put<T>(url, payload),
      delete: <T>(url: string) => options.requestClient.delete<T>(url),
    },
    storage: {
      previewUrl: options.storageService.previewUrl,
      downloadUrl: options.storageService.downloadUrl,
    },
    i18n: {
      getLocale: () => options.locale,
      setLocale: options.setLocale,
      t: (key: string, fallback?: string, variables?: Record<string, string | number>) => translate(localeMessages, fallbackMessages, key, fallback, variables),
    },
    bus: eventBus,
  };

  return {
    appContext,
  };
}
