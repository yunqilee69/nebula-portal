import { applyNebulaLocale, translateNebulaMessage, useI18nStore } from "../i18n/index";
import { eventBus } from "../event-bus";
import { withDefaultNebulaMenus, useMenuStore } from "../menu";
import { useConfigStore } from "../stores/config-store";
import { useDictStore } from "../stores/dict-store";
import { useNotifyStore } from "../stores/notify-store";
import { useResourceStore } from "../stores/resource-store";
import type { AppContextValue, AuthSession, ConfigMap, DictRecord, MenuItem, NotificationItem } from "../types";
import { hasPermissionCode, hasAnyPermissionCode, hasAllPermissionCode, hasRoleCode, hasAnyRoleCode, hasAllRoleCode } from "./permission-utils";

export { applyNebulaLocale, translateNebulaMessage };

export async function preloadNebulaData(apis: {
  fetchMenus: () => Promise<MenuItem[]>;
  fetchDictCodes: () => Promise<Array<{ code: string }>>;
  fetchDictByCode: (code: string) => Promise<DictRecord[]>;
  fetchConfig: () => Promise<ConfigMap>;
  fetchNotifications: () => Promise<NotificationItem[]>;
}) {
  useResourceStore.getState().start("menus");
  useResourceStore.getState().start("dicts");
  useResourceStore.getState().start("config");
  useResourceStore.getState().start("notifications");

  const locale = useI18nStore.getState().locale;

  await Promise.all([
    apis.fetchMenus()
      .then((menus) => {
        useMenuStore.getState().setMenus(withDefaultNebulaMenus(menus, locale));
        useResourceStore.getState().succeed("menus");
      })
      .catch((error: unknown) => {
        useMenuStore.getState().setMenus(withDefaultNebulaMenus([], locale));
        useResourceStore.getState().fail("menus", error instanceof Error ? error.message : "Failed to load menus");
      }),
    apis.fetchDictCodes()
      .then((items) => Promise.all(items.map((item) => apis.fetchDictByCode(item.code))))
      .then(() => {
        useResourceStore.getState().succeed("dicts");
      })
      .catch((error: unknown) => {
        useResourceStore.getState().fail("dicts", error instanceof Error ? error.message : "Failed to load dictionaries");
      }),
    apis.fetchConfig()
      .then((config) => {
        useConfigStore.getState().setValues(config);
        useResourceStore.getState().succeed("config");
      })
      .catch((error: unknown) => {
        useConfigStore.getState().setValues({});
        useResourceStore.getState().fail("config", error instanceof Error ? error.message : "Failed to load config");
      }),
    apis.fetchNotifications()
      .then((notifications) => {
        useNotifyStore.getState().setItems(notifications);
        useResourceStore.getState().succeed("notifications");
      })
      .catch((error: unknown) => {
        useNotifyStore.getState().setItems([]);
        useResourceStore.getState().fail("notifications", error instanceof Error ? error.message : "Failed to load notifications");
      }),
  ]);
}

export function buildAppContext(
  navigateToLogin: () => void,
  logout: () => void,
  getSession: () => AuthSession | null,
  apis: {
    requestGet: <T>(url: string, params?: Record<string, unknown>) => Promise<T>;
    requestPost: <T>(url: string, payload?: unknown) => Promise<T>;
    requestPut: <T>(url: string, payload?: unknown) => Promise<T>;
    requestDelete: <T>(url: string) => Promise<T>;
    buildStoragePreviewUrl: (file: { id?: string; fileUrl?: string; previewUrl?: string }) => string;
    buildStorageDownloadUrl: (file: { id?: string; fileUrl?: string }) => string;
  },
): AppContextValue {
  const getPermissions = () => getSession()?.permissions ?? [];
  const getRoles = () => getSession()?.user.roles ?? [];

  return {
    auth: {
      getToken: () => getSession()?.token ?? null,
      getSession,
      hasPermission: (code) => hasPermissionCode(getPermissions(), code),
      hasAnyCode: (codes) => hasAnyPermissionCode(getPermissions(), codes),
      hasAllCode: (codes) => hasAllPermissionCode(getPermissions(), codes),
      hasRole: (role) => hasRoleCode(getRoles(), role),
      hasAnyRole: (roles) => hasAnyRoleCode(getRoles(), roles),
      hasAllRole: (roles) => hasAllRoleCode(getRoles(), roles),
      redirectToLogin: navigateToLogin,
      logout,
    },
    dict: {
      get: (key) => {
        const state = useDictStore.getState();
        return state.records[key] ?? [];
      },
      ensure: (key) => Promise.resolve([]),
      all: () => useDictStore.getState().records,
    },
    config: {
      get: (key) => useConfigStore.getState().values[key],
      all: () => useConfigStore.getState().values,
    },
    notifications: {
      all: () => useNotifyStore.getState().items,
      unreadCount: () => useNotifyStore.getState().items.filter((item) => !item.read).length,
    },
    request: {
      get: (url, params) => apis.requestGet(url, params),
      post: (url, payload) => apis.requestPost(url, payload),
      put: (url, payload) => apis.requestPut(url, payload),
      delete: (url) => apis.requestDelete(url),
    },
    storage: {
      previewUrl: (file) => apis.buildStoragePreviewUrl(file),
      downloadUrl: (file) => apis.buildStorageDownloadUrl(file),
    },
    i18n: {
      getLocale: () => useI18nStore.getState().locale,
      setLocale: (locale) => applyNebulaLocale(locale),
      t: (key, fallback, variables) => translateNebulaMessage(useI18nStore.getState().locale, key, fallback, variables),
    },
    bus: eventBus,
  };
}
